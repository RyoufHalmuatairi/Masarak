import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ui } from '../constants/design';
import { useSkillProfile } from '../hooks/use-skill-profile';
import { CareerCard } from '../components/career-card';
import { usePersonalProfile } from '../hooks/use-personal-profile';
import { useLearningProgress } from '../hooks/use-learning-progress';
import { useProfessionalCertifications } from '../hooks/use-professional-certifications';
import { getCareerReadinessMatches } from '../utils/career-readiness';

export default function CareersScreen() {
  const { profile, ready, error } = useSkillProfile();
  const personal = usePersonalProfile();
  const learning = useLearningProgress();
  const certifications = useProfessionalCertifications();
  const matches = getCareerReadinessMatches({ skillProfile: profile, personal: personal.personal, learningProgress: learning.progress, professionalCertifications: certifications.achieved });
  const allReady = ready && personal.ready && learning.ready && certifications.ready;
  return <SafeAreaView edges={['top', 'left', 'right']} style={ui.screen}><ScrollView contentContainerStyle={ui.content}>
    <Text style={ui.eyebrow}>اكتشف فرصتك القادمة</Text><Text style={ui.title}>مساراتك المهنية</Text><Text style={ui.text}>مرتبة حسب جاهزية مركبة من المهارات والتطبيق والشهادات والمعدل والتعلم. افتح المسار لرؤية التفصيل.</Text>
    {!allReady ? <Text style={ui.text}>جارٍ جمع أدلة ملفك…</Text> : error ? <Text style={ui.text}>{error}</Text> : matches.map(career => <CareerCard key={career.career_id} career={career} />)}
    <Text style={ui.note}>الأوزان قرار تصميم موثق لمسارك وليست إحصائية قبول وظيفي. إعلان الوظيفة ودليل أعمالك يظلان المرجع النهائي.</Text>
  </ScrollView></SafeAreaView>;
}
