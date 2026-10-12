import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ui } from '../constants/design';
import { useSkillProfile } from '../hooks/use-skill-profile';
import { getCareerMatches } from '../utils/career-matches';
import { CareerCard } from '../components/career-card';

export default function CareersScreen() {
  const { profile, ready, error } = useSkillProfile();
  const hasSkills = !!profile?.skill_ids.length && !error;
  const matches = getCareerMatches(hasSkills ? profile!.skill_ids : null);
  return <SafeAreaView edges={['top', 'left', 'right']} style={ui.screen}><ScrollView contentContainerStyle={ui.content}>
    <Text style={ui.eyebrow}>اكتشف فرصتك القادمة</Text><Text style={ui.title}>مساراتك المهنية</Text><Text style={ui.text}>{hasSkills ? 'مرتبة حسب تغطية مهاراتك الأساسية. افتح أي مسار لتتعرف على المهارات وخطوات التعلم.' : 'تعرّف على المسارات. أضف مهاراتك أو اعتمد تحليل سيرتك لتظهر نسب التغطية.'}</Text>
    {!ready ? <Text style={ui.text}>جارٍ تحميل مهاراتك…</Text> : error ? <Text style={ui.text}>{error}</Text> : matches.map(career => <CareerCard key={career.career_id} career={career} />)}
    <Text style={ui.note}>تغطية المهارات لا تعني مستوى الإتقان أو ضمان التوظيف. المسارات المتساوية في النسبة لها نفس التغطية؛ ترتيبها لا يجعل أحدها أفضل.</Text>
  </ScrollView></SafeAreaView>;
}
