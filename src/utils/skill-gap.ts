// Skill Gap Analysis + Readiness Score (report FR5, FR6 and section 4.5.2).
// Formula from the report (Figure 7):
//   Readiness Score = (matched skills / total required skills for the role) * 100
// Only "core" skills count, same as getCareerMatches(), so both screens show the same number.
import dataset from '../masarak_dataset.json';

// Readiness levels. The thresholds are a design choice for this prototype; change them in one place here.
export type ReadinessLevel = 'early' | 'developing' | 'ready';
export const READINESS_THRESHOLDS = { developing: 40, ready: 70 } as const;

export type GapSkill = { skill_id: string; name: string; description: string };
export type SkillGapReport = {
  career_id: string;
  // Null means the user has no saved skills yet, so a score would be a guess.
  score: number | null;
  level: ReadinessLevel | null;
  matchedCore: GapSkill[];
  missingCore: GapSkill[];
  // Additional skills are shown to the user, but they never change the score.
  matchedAdditional: GapSkill[];
  missingAdditional: GapSkill[];
};

// Turn a score into a level.
export function readinessLevel(score: number | null): ReadinessLevel | null {
  if (score === null) return null;
  if (score >= READINESS_THRESHOLDS.ready) return 'ready';
  if (score >= READINESS_THRESHOLDS.developing) return 'developing';
  return 'early';
}

// Arabic labels for the UI.
export const readinessLabels: Record<ReadinessLevel, string> = {
  early: 'بداية الطريق',
  developing: 'في طور التطور',
  ready: 'قريب من الجاهزية',
};

// Build the gap report for one career.
// userSkillIds = saved skill ids from the profile, or null when nothing is saved yet.
export function getSkillGapReport(careerId: string, userSkillIds: string[] | null): SkillGapReport {
  const owned = new Set(userSkillIds ?? []);
  const descriptions = new Map(dataset.skills.map(skill => [skill.skill_id, skill.description]));
  const links = dataset.career_skills.filter(link => link.career_id === careerId);

  // One entry per skill id, so a skill listed twice is not counted twice.
  const unique = (priority: string): GapSkill[] => {
    const seen = new Set<string>();
    const rows: GapSkill[] = [];
    for (const link of links) {
      if (link.priority !== priority || seen.has(link.skill_id)) continue;
      seen.add(link.skill_id);
      rows.push({ skill_id: link.skill_id, name: link.name, description: descriptions.get(link.skill_id) ?? '' });
    }
    return rows;
  };

  const core = unique('core');
  const additional = unique('additional');
  const matchedCore = core.filter(skill => owned.has(skill.skill_id));
  const score = userSkillIds === null || core.length === 0 ? null : Math.round((matchedCore.length / core.length) * 100);

  return {
    career_id: careerId,
    score,
    level: readinessLevel(score),
    matchedCore,
    missingCore: core.filter(skill => !owned.has(skill.skill_id)),
    matchedAdditional: additional.filter(skill => owned.has(skill.skill_id)),
    missingAdditional: additional.filter(skill => !owned.has(skill.skill_id)),
  };
}