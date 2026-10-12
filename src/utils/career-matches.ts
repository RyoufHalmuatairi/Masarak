import dataset from '../masarak_dataset.json';

export const careerTitles: Record<string, string> = { C01: 'مهندس برمجيات', C02: 'محلل بيانات', C03: 'عالم بيانات وذكاء اصطناعي', C04: 'مهندس ذكاء اصطناعي وتعلم آلة', C05: 'محلل أمن سيبراني', C06: 'مهندس شبكات' };
export function getCareerMatches(ids: string[] | null) {
  const selected = new Set(ids ?? []);
  return dataset.careers.map(career => {
    const core = dataset.career_skills.filter(link => link.career_id === career.career_id && link.priority === 'core');
    const uniqueIds = [...new Set(core.map(link => link.skill_id))];
    const matched = uniqueIds.filter(id => selected.has(id)).length;
    return { ...career, matched, total: uniqueIds.length, missing: core.filter(link => !selected.has(link.skill_id)), score: ids === null || uniqueIds.length === 0 ? null : Math.round(matched / uniqueIds.length * 100) };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}
