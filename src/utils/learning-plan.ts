import AsyncStorage, { captureDataScope } from './scoped-storage';
import dataset from '../masarak_dataset.json';

export const LEARNING_PLAN_KEY = 'masarak-learning-plan-v1';
const key = LEARNING_PLAN_KEY;
const validIds = new Set(dataset.career_skills.map((item) => item.skill_id));
let pending: Promise<unknown> = Promise.resolve();

export async function readLearningPlan(): Promise<string[]> {
  const saved = await AsyncStorage.getItem(key);
  if (saved === null) return [];
  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) {
    throw new Error('Invalid learning plan');
  }
  return [...new Set(parsed.filter((id) => validIds.has(id)))];
}

export function changeLearningPlan(id: string, add: boolean): Promise<string[]> {
  const scope = captureDataScope();
  const operation = pending.then(async () => {
    scope.assertCurrent();
    if (!validIds.has(id)) throw new Error('Unknown skill');
    const current = await readLearningPlan();
    const next = add ? [...new Set([...current, id])] : current.filter((entry) => entry !== id);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    scope.assertCurrent();
    return next;
  });
  pending = operation.catch(() => undefined);
  return operation;
}
