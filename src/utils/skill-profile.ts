import AsyncStorage, { captureDataScope } from './scoped-storage';
import dataset from '../masarak_dataset.json';

export type CvSkill = { name: string; mapped_skill_id: string | null; evidence: string };
export type CvCertificate = { name: string; issuer: string; date: string; evidence: string };
export type CvExperience = { role: string; organization: string; dates: string; description: string; evidence: string };
export type CvEntry = { name: string; organization: string; dates: string; description: string; evidence: string };
export type CvAnalysis = { skills: CvSkill[]; certificates: CvCertificate[]; experiences: CvExperience[]; education?: CvEntry[]; projects?: CvEntry[]; activities?: CvEntry[]; warnings: string[] };
export type CvProfile = CvAnalysis & { reviewed_at: string };
export type SkillProfile = { version: 3; skill_ids: string[]; manual_skill_ids: string[]; excluded_cv_skill_ids: string[]; cv: CvProfile | null };
const key = 'masarak-skills-v1';
const validIds = new Set(dataset.skills.map(item => item.skill_id));
const uniqueValid = (ids: string[]) => [...new Set(ids.filter(id => validIds.has(id)))];
const isIds = (value: unknown): value is string[] => Array.isArray(value) && value.every(id => typeof id === 'string');

export function isCvAnalysis(value: unknown): value is CvAnalysis {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  const rows = (section: string, fields: string[]) => Array.isArray(data[section]) && (data[section] as unknown[]).length <= 80 && (data[section] as unknown[]).every(item => item && typeof item === 'object' && fields.every(field => typeof (item as Record<string, unknown>)[field] === 'string'));
  return rows('skills', ['name', 'evidence']) && (data.skills as CvSkill[]).every(item => item.mapped_skill_id === null || (typeof item.mapped_skill_id === 'string' && validIds.has(item.mapped_skill_id))) && rows('certificates', ['name', 'issuer', 'date', 'evidence']) && rows('experiences', ['role', 'organization', 'dates', 'description', 'evidence']) && (['education', 'projects', 'activities'] as const).every(section => data[section] === undefined || rows(section, ['name', 'organization', 'dates', 'description', 'evidence'])) && Array.isArray(data.warnings) && data.warnings.every(item => typeof item === 'string');
}

function cvIds(cv: CvProfile | null) { return uniqueValid(cv?.skills.flatMap(item => item.mapped_skill_id ? [item.mapped_skill_id] : []) ?? []); }
function compose(manual: string[], cv: CvProfile | null, excluded: string[] = []): SkillProfile {
  const manualIds = uniqueValid(manual);
  const excludedIds = uniqueValid(excluded);
  const cvSkillIds = cvIds(cv).filter(id => !excludedIds.includes(id));
  return { version: 3, manual_skill_ids: manualIds, excluded_cv_skill_ids: excludedIds, skill_ids: uniqueValid([...manualIds, ...cvSkillIds]), cv };
}

export async function readSkillProfile(): Promise<SkillProfile | null> {
  const saved = await AsyncStorage.getItem(key);
  if (saved === null) return null;
  const parsed: unknown = JSON.parse(saved);
  if (isIds(parsed)) return compose(parsed, null);
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid profile');
  const value = parsed as Record<string, unknown>;
  if (!isIds(value.skill_ids) || (value.cv !== null && (!isCvAnalysis(value.cv) || typeof (value.cv as CvProfile).reviewed_at !== 'string'))) throw new Error('Invalid profile');
  const cv = value.cv as CvProfile | null;
  if (value.version === 2) {
    // Preserve the old selected set exactly; do not revive previously removed CV mappings.
    const selected = uniqueValid(value.skill_ids);
    const fromCv = cvIds(cv);
    return compose(selected.filter(id => !fromCv.includes(id)), cv, fromCv.filter(id => !selected.includes(id)));
  }
  if (value.version !== 3 || !isIds(value.manual_skill_ids) || !isIds(value.excluded_cv_skill_ids)) throw new Error('Invalid profile');
  return compose(value.manual_skill_ids, cv, value.excluded_cv_skill_ids);
}

let pending: Promise<unknown> = Promise.resolve();
function updateProfile(change: (current: SkillProfile) => SkillProfile): Promise<SkillProfile> {
  const scope = captureDataScope();
  const operation = pending.then(async () => {
    scope.assertCurrent();
    const current = await readSkillProfile() ?? compose([], null);
    const next = change(current);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    scope.assertCurrent();
    return next;
  });
  pending = operation.catch(() => undefined);
  return operation;
}
export function saveManualSkills(ids: string[]) {
  return updateProfile(current => compose(ids, current.cv, current.excluded_cv_skill_ids));
}
export function saveReviewedCv(analysis: CvAnalysis) {
  if (!isCvAnalysis(analysis)) return Promise.reject(new Error('Invalid analysis'));
  return updateProfile(current => compose(current.manual_skill_ids, { ...analysis, reviewed_at: new Date().toISOString() }));
}
// Removing the saved document keeps already-approved skills, as promised in the CV screen.
export function clearReviewedCv() { return updateProfile(current => compose(current.skill_ids, null)); }
