import dataset from '../masarak_dataset.json';
import { calculateCareerScore } from './career-score';

export const careerTitles: Record<string, string> = {
  C01: 'مهندس برمجيات',
  C02: 'محلل بيانات',
  C03: 'عالم بيانات',
  C04: 'مهندس ذكاء اصطناعي وتعلّم آلي',
  C05: 'محلل أمن سيبراني',
  C06: 'مهندس شبكات',
  C07: 'مهندس بيانات',
  C08: 'مهندس سحابة وDevOps',
  C09: 'محلل نظم أعمال',
};
export function getCareerMatches(ids: string[] | null) {
  return dataset.careers.map(career => {
    const report = calculateCareerScore(career.career_id, ids);
    return { ...career, matched: report.matchedCore.length, total: report.core.length, missing: report.missingCore, score: report.score };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}
