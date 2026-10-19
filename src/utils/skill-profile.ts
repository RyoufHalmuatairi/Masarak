import AsyncStorage, { captureDataScope } from './scoped-storage';
import dataset from '../masarak_dataset.json';

export type CvSkill = { name: string; mapped_skill_id: string | null; evidence: string };
export type CvCertificate = { name: string; issuer: string; date: string; evidence: string };
export type CvExperience = { role: string; organization: string; dates: string; description: string; evidence: string; location?: string };
export type CvEntry = { name: string; organization: string; dates: string; description: string; evidence: string };
export type CvEducation = CvEntry & { college?: string; major?: string; study_status?: string };
export type CvProject = CvEntry & { role?: string; technologies?: string[]; category?: string; category_basis?: string; category_evidence?: string };
export type CvAnalysis = {
  skills: CvSkill[]; certificates: CvCertificate[]; courses?: CvCertificate[]; experiences: CvExperience[];
  education?: CvEducation[]; projects?: CvProject[]; activities?: CvEntry[]; unclassified?: CvEntry[];
  analyzed_at?: string; section_status?: Record<string, string>; warnings: string[];
};
export type CvProfile = CvAnalysis & { reviewed_at: string };
export type SkillProfile = { version: 3; skill_ids: string[]; manual_skill_ids: string[]; excluded_cv_skill_ids: string[]; cv: CvProfile | null };
export const SKILL_PROFILE_KEY = 'masarak-skills-v1';
const key = SKILL_PROFILE_KEY;
const validIds = new Set(dataset.skills.map(item => item.skill_id));
const uniqueValid = (ids: string[]) => [...new Set(ids.filter(id => validIds.has(id)))];
const isIds = (value: unknown): value is string[] => Array.isArray(value) && value.every(id => typeof id === 'string');

export function isCvAnalysis(value: unknown): value is CvAnalysis {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  const rows = (section: string, fields: string[]) => Array.isArray(data[section]) && (data[section] as unknown[]).length <= 80 && (data[section] as unknown[]).every(item => item && typeof item === 'object' && fields.every(field => typeof (item as Record<string, unknown>)[field] === 'string'));
  const optionalText = (section: string, fields: string[]) => data[section] === undefined || (data[section] as Record<string, unknown>[]).every(item => fields.every(field => item[field] === undefined || typeof item[field] === 'string'));
  return rows('skills', ['name', 'evidence']) && (data.skills as CvSkill[]).every(item => item.mapped_skill_id === null || (typeof item.mapped_skill_id === 'string' && validIds.has(item.mapped_skill_id)))
    && rows('certificates', ['name', 'issuer', 'date', 'evidence']) && (data.courses === undefined || rows('courses', ['name', 'issuer', 'date', 'evidence']))
    && rows('experiences', ['role', 'organization', 'dates', 'description', 'evidence'])
    && (['education', 'projects', 'activities', 'unclassified'] as const).every(section => data[section] === undefined || rows(section, ['name', 'organization', 'dates', 'description', 'evidence']))
    && optionalText('education', ['college', 'major', 'study_status']) && optionalText('projects', ['role', 'category', 'category_basis', 'category_evidence']) && optionalText('experiences', ['location'])
    && (data.projects === undefined || (data.projects as CvProject[]).every(item => item.technologies === undefined || isIds(item.technologies)))
    && (data.analyzed_at === undefined || (typeof data.analyzed_at === 'string' && Number.isFinite(Date.parse(data.analyzed_at))))
    && (data.section_status === undefined || (!!data.section_status && typeof data.section_status === 'object' && Object.values(data.section_status).every(status => ['extracted', 'not_found', 'uncertain', 'legacy'].includes(status as string))))
    && Array.isArray(data.warnings) && data.warnings.every(item => typeof item === 'string');
}

function cvIds(cv: CvProfile | null) { return uniqueValid(cv?.skills.flatMap(item => item.mapped_skill_id ? [item.mapped_skill_id] : []) ?? []); }
function compose(manual: string[], cv: CvProfile | null, excluded: string[] = []): SkillProfile {
  const manualIds = uniqueValid(manual);
  const excludedIds = uniqueValid(excluded);
  const cvSkillIds = cvIds(cv).filter(id => !excludedIds.includes(id));
  return { version: 3, manual_skill_ids: manualIds, excluded_cv_skill_ids: excludedIds, skill_ids: uniqueValid([...manualIds, ...cvSkillIds]), cv };
}

export function parseSkillProfile(parsed: unknown): SkillProfile {
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

export async function readSkillProfile(): Promise<SkillProfile | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw === null ? null : parseSkillProfile(JSON.parse(raw));
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
