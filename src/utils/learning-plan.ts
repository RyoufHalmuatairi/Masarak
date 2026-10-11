import AsyncStorage from '@react-native-async-storage/async-storage';
import dataset from '../masarak_dataset.json';

const key = 'masarak-learning-plan-v1';
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
  const operation = pending.then(async () => {
    if (!validIds.has(id)) throw new Error('Unknown skill');
    const current = await readLearningPlan();
    const next = add ? [...new Set([...current, id])] : current.filter((entry) => entry !== id);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    return next;
  });
  pending = operation.catch(() => undefined);
  return operation;
}
