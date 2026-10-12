import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/auth-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MasarakBrand } from '../components/masarak-brand';
import { MasarakIcon, type IconName } from '../components/masarak-icon';
import { CoverageRing } from '../components/coverage-ring';
import { CareerCard } from '../components/career-card';
import { colors, ui } from '../constants/design';
import { useSkillProfile } from '../hooks/use-skill-profile';
import { useLearningPlan } from '../hooks/use-learning-plan';
import { careerTitles, getCareerMatches } from '../utils/career-matches';

export default function HomeScreen() {
  const router = useRouter();
  const auth = useAuth();
  const firstName = typeof auth.session?.user.user_metadata?.display_name === 'string' ? auth.session.user.user_metadata.display_name.trim().split(/\s+/)[0].slice(0, 25) : '';
  const { profile, ready, error } = useSkillProfile();
  const learning = useLearningPlan();
  const hasSkills = ready && !error && !!profile?.skill_ids.length;
  const matches = getCareerMatches(hasSkills ? profile!.skill_ids : null);
  const best = matches[0];
  const tools = [
    { title: profile?.cv ? 'سيرتي الذاتية' : 'رفع السيرة', subtitle: profile?.cv ? 'راجع معلوماتك المحفوظة' : 'خطوتك الأولى تبدأ هنا', route: '/upload-cv', icon: 'upload' },
    { title: 'تحليل المهارات', subtitle: 'اكتشف المسارات ومهاراتها', route: '/careers', icon: 'careers' },
    { title: 'خطة التعلم', subtitle: learning.ready && !learning.error ? `${learning.plan.length} مهارات في خطتك` : 'خطواتك نحو التطور', route: '/learning-plan', icon: 'plan' },
    { title: 'ملف مهاراتي', subtitle: 'راجع مهاراتك وأضف إليها', route: '/profile', icon: 'profile' },
  ] as const;
  return <SafeAreaView edges={['top', 'left', 'right']} style={ui.screen}>
    <ScrollView contentContainerStyle={ui.content}>
      <View style={ui.row}><MasarakBrand /><Pressable accessibilityRole="button" accessibilityLabel="فتح ملفي" onPress={() => router.push('/profile')} style={styles.avatar}><MasarakIcon name="profile" /></Pressable></View>
      <View style={styles.intro}><Text style={ui.eyebrow}>خطوتك اليوم، مستقبلك بكرة</Text><Text style={ui.title}>{firstName ? `أهلًا بك، ${firstName}.` : 'أهلًا بك في مسارك.'}</Text><Text style={ui.text}>طريق أوضح لمستقبلك في عالم التقنية.</Text></View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.summary}>
        <View style={styles.summaryText}><Text style={ui.eyebrow}>تغطية المهارات الأساسية</Text><Text style={styles.number}>{!ready ? '…' : hasSkills ? `${best.score}%` : 'لنبدأ'}</Text><Text style={styles.summaryCaption}>{!ready ? 'جارٍ تحميل ملفك…' : hasSkills ? careerTitles[best.career_id] : 'حلّل سيرتك لاكتشاف مساراتك'}</Text><Text style={ui.note}>{hasSkills ? 'أعلى تغطية بين المسارات الحالية' : 'نتائجك تظهر بعد اعتماد مهاراتك'}</Text></View>
        <CoverageRing score={hasSkills ? best.score : null} />
      </View>
      <View style={ui.row}><Text style={ui.heading}>أدوات رحلتك</Text><Text style={ui.note}>خطوة بخطوة</Text></View>
      <View style={styles.grid}>{tools.map(tool => <Pressable key={tool.route} accessibilityRole="button" onPress={() => router.push(tool.route)} style={({ pressed }) => [styles.tool, pressed && ui.pressed]}><View style={styles.toolIcon}><MasarakIcon name={tool.icon as IconName} /></View><Text style={styles.toolTitle}>{tool.title}</Text><Text style={styles.toolText}>{tool.subtitle}</Text></Pressable>)}</View>
      <View style={styles.next}><View style={styles.nextText}><Text style={styles.nextTitle}>{profile?.cv ? 'ملفك جاهز للخطوة التالية' : 'كل رحلة تبدأ بخطوة'}</Text><Text style={ui.text}>{profile?.cv ? 'استكشف مهارات المسارات واختر ما تريد تطويره.' : 'ارفع سيرتك، راجع التحليل، ثم اكتشف المسارات المرتبطة بمهاراتك.'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={profile?.cv ? 'استكشاف المسارات' : 'رفع السيرة الذاتية'} onPress={() => router.push(profile?.cv ? '/careers' : '/upload-cv')} style={styles.nextButton}><MasarakIcon name="arrow" color={colors.surface} /></Pressable></View>
      <View style={ui.row}><Text style={ui.heading}>{hasSkills ? 'مسارات مرتبطة بمهاراتك' : 'اكتشف مسارات التقنية'}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/careers')}><Text style={ui.link}>عرض الكل</Text></Pressable></View>
      {matches.slice(0, 2).map(career => <CareerCard key={career.career_id} career={career} />)}
      <Text style={ui.note}>النسبة تصف تغطية المهارات الأساسية في النسخة التجريبية؛ لا تقيس الإتقان أو الجاهزية للتوظيف. المسارات المتساوية لها نفس التغطية.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  avatar: { backgroundColor: colors.mint, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  intro: { gap: 5, marginTop: 8 }, summary: { backgroundColor: colors.mint, borderRadius: 25, padding: 22, gap: 8, flexDirection: 'row-reverse', alignItems: 'center' }, summaryText: { flex: 1, gap: 5 }, number: { color: colors.ink, fontSize: 43, fontWeight: '700', textAlign: 'right' }, summaryCaption: { color: colors.primary, fontSize: 13, lineHeight: 22, textAlign: 'right' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 }, tool: { width: '48%', flexGrow: 1, flexBasis: '45%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 9 }, toolIcon: { backgroundColor: colors.mint, borderRadius: 12, padding: 10, alignSelf: 'flex-end' }, toolTitle: { color: colors.ink, fontSize: 15, fontWeight: '600', textAlign: 'right' }, toolText: { color: colors.muted, fontSize: 12, lineHeight: 20, textAlign: 'right' },
  next: { padding: 20, borderRadius: 22, backgroundColor: '#EEF2E7', flexDirection: 'row-reverse', alignItems: 'center', gap: 16 }, nextText: { flex: 1, gap: 7 }, nextTitle: { color: colors.ink, fontWeight: '600', fontSize: 16, textAlign: 'right' }, nextButton: { width: 48, height: 48, backgroundColor: colors.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, error: { color: colors.error, textAlign: 'right' },
});
