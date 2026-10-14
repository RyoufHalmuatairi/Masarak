import { certificationsForCareer } from '../constants/professional-certifications';
import { learningResources } from '../constants/learning-resources';
import { careerProfiles } from '../constants/career-profiles';
import { calculateCareerScore } from './career-score';
import type { PersonalProfile } from './personal-profile';
import type { SkillProfile } from './skill-profile';
import type { LearningProgress } from './learning-progress';
import dataset from '../masarak_dataset.json';

export type ReadinessWeights = { skills: number; practical: number; certifications: number; academic: number; learning: number };
export const readinessWeights: Record<string, ReadinessWeights> = {
  C01: { skills: 55, practical: 25, certifications: 5, academic: 10, learning: 5 },
  C02: { skills: 50, practical: 20, certifications: 15, academic: 10, learning: 5 },
  C03: { skills: 45, practical: 25, certifications: 10, academic: 15, learning: 5 },
  C04: { skills: 45, practical: 25, certifications: 15, academic: 10, learning: 5 },
  C05: { skills: 45, practical: 20, certifications: 20, academic: 10, learning: 5 },
  C06: { skills: 45, practical: 20, certifications: 25, academic: 5, learning: 5 },
  C07: { skills: 45, practical: 25, certifications: 15, academic: 10, learning: 5 },
  C08: { skills: 45, practical: 25, certifications: 15, academic: 10, learning: 5 },
  C09: { skills: 45, practical: 25, certifications: 10, academic: 15, learning: 5 },
};

export type ReadinessInputs = {
  skillProfile: SkillProfile | null;
  personal: PersonalProfile | null;
  learningProgress: LearningProgress;
  professionalCertifications: string[];
};

function searchableEvidence(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  return Object.values(value as Record<string, unknown>)
    .filter(item => typeof item === 'string')
    .join(' ')
    .toLocaleLowerCase();
}

function isRelevantEvidence(value: unknown, keywords: string[]) {
  const text = searchableEvidence(value);
  return keywords.some(keyword => text.includes(keyword.toLocaleLowerCase()));
}

export function calculateCareerReadiness(careerId: string, input: ReadinessInputs) {
  const weights = readinessWeights[careerId] ?? readinessWeights.C01;
  const skillReport = calculateCareerScore(careerId, input.skillProfile?.skill_ids ?? null);
  const skillRatio = (skillReport.score ?? 0) / 100;
  const profile = careerProfiles[careerId];
  const allProjects = input.skillProfile?.cv?.projects ?? [];
  const allExperiences = input.skillProfile?.cv?.experiences ?? [];
  const projects = profile ? allProjects.filter(item => isRelevantEvidence(item, profile.evidenceKeywords)).length : 0;
  const experiences = profile ? allExperiences.filter(item => isRelevantEvidence(item, profile.evidenceKeywords)).length : 0;
  const documentedPracticalRatio = (Math.min(projects, 2) / 2 + Math.min(experiences, 1)) / 2;
  // Only evidence whose text contains role signals earns practical points. Skill
  // coverage then scales those points so a generic project cannot inflate every role.
  const practicalRatio = documentedPracticalRatio * skillRatio;
  const roleCertifications = certificationsForCareer(careerId);
  // Certifications listed for one role are alternatives, not a checklist the
  // user must purchase. One verified role certificate earns this component.
  const certificationRatio = roleCertifications.some(item => input.professionalCertifications.includes(item.id)) ? 1 : 0;
  const coreIds = new Set(skillReport.core.map(item => item.skill_id));
  const roleResources = learningResources.filter(resource => resource.skillIds.some(id => coreIds.has(id)));
  const learningRatio = roleResources.length
    ? roleResources.filter(resource => input.learningProgress[resource.id]).length / roleResources.length
    : 0;
  const hasEducation = Boolean(input.personal?.education.trim() || input.personal?.major.trim());
  const academicText = `${input.personal?.education ?? ''} ${input.personal?.major ?? ''}`.toLocaleLowerCase();
  const relevantMajor = Boolean(profile?.majorKeywords.some(keyword => academicText.includes(keyword.toLocaleLowerCase())));
  const gpaRatio = input.personal?.gpa !== null && input.personal?.gpaScale
    ? Math.max(0, Math.min(1, input.personal.gpa / input.personal.gpaScale))
    : 0;
  const academicRatio = (hasEducation ? 0.2 : 0) + (relevantMajor ? 0.3 : 0) + (gpaRatio * 0.5);
  const breakdown = {
    skills: Math.round(weights.skills * skillRatio),
    practical: Math.round(weights.practical * practicalRatio),
    certifications: Math.round(weights.certifications * certificationRatio),
    academic: Math.round(weights.academic * academicRatio),
    learning: Math.round(weights.learning * learningRatio),
  };
  const hasAnyEvidence = Boolean(input.skillProfile?.skill_ids.length || projects || experiences || input.personal || Object.keys(input.learningProgress).length || input.professionalCertifications.length);
  return {
    score: hasAnyEvidence ? Object.values(breakdown).reduce((sum, value) => sum + value, 0) : null,
    breakdown, weights, skillReport,
    evidence: { projects, experiences, totalProjects: allProjects.length, totalExperiences: allExperiences.length, relevantMajor, completedResources: roleResources.filter(resource => input.learningProgress[resource.id]).length, totalResources: roleResources.length, achievedCertifications: roleCertifications.filter(item => input.professionalCertifications.includes(item.id)).length, totalCertifications: roleCertifications.length },
  };
}

export function getCareerReadinessMatches(input: ReadinessInputs) {
  return dataset.careers.map(career => {
    const readiness = calculateCareerReadiness(career.career_id, input);
    return {
      ...career,
      score: readiness.score,
      skillScore: readiness.skillReport.score,
      matched: readiness.skillReport.matchedCore.length,
      total: readiness.skillReport.core.length,
      missing: readiness.skillReport.missingCore,
      breakdown: readiness.breakdown,
      weights: readiness.weights,
    };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}
