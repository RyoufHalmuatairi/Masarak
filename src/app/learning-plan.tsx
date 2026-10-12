import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dataset from '../masarak_dataset.json';
import { getLearningSteps } from '../constants/learning-steps';
import { useLearningPlan } from '../hooks/use-learning-plan';
import { useSkillProfile } from '../hooks/use-skill-profile';

export default function LearningPlanScreen() {
  const router = useRouter();
  const learning = useLearningPlan();
  const profileState = useSkillProfile();
  const skills = learning.plan.flatMap((id) => {
    const skill = dataset.skills.find((item) => item.skill_id === id);
    return skill ? [skill] : [];
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}>
          <Text style={styles.link}>العودة</Text>
        </Pressable>
        <Text style={styles.title}>خطة تعلمي</Text>
        {profileState.error ? <Text style={styles.note}>{profileState.error}</Text> : null}
        <Text style={styles.text}>مهارات اخترت تطويرها. إضافتها هنا لا تغيّر ملف مهاراتك أو نسبة المطابقة.</Text>
        {learning.error ? (
          <Pressable accessibilityRole="button" onPress={() => void learning.reload()}>
            <Text style={styles.note}>{learning.error} اضغط لإعادة التحميل.</Text>
          </Pressable>
        ) : null}
        {!learning.ready ? (
          !learning.error ? <Text style={styles.text}>جارٍ تحميل خطة تعلمك…</Text> : null
        ) : skills.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.heading}>خطتك فارغة حاليًا</Text>
            <Text style={styles.text}>افتح تفاصيل وظيفة، ثم خطوات التعلم المقترحة، واضغط «أضف إلى خطة تعلمي» عند المهارة التي تريد تطويرها.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/home')}>
              <Text style={styles.link}>استكشف المسارات</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.heading}>مهارات في خطتك: {skills.length}</Text>
            {skills.map((skill) => (
              <View key={skill.skill_id} style={styles.card}>
                <Text style={styles.skill}>{skill.name}</Text>
                {profileState.ready && !profileState.error && profileState.profile?.skill_ids.includes(skill.skill_id) ? <Text style={styles.note}>✓ أصبحت ضمن مهارات ملفك المعتمد. يمكنك إبقاؤها للتدريب أو إزالتها من الخطة.</Text> : null}
                {getLearningSteps(skill.name).map((step, index) => (
                  <Text key={index} style={styles.text}>{index + 1}. {step}</Text>
                ))}
                <Pressable accessibilityRole="button" disabled={learning.busy}
                  accessibilityState={{ disabled: learning.busy }}
                  onPress={() => void learning.change(skill.skill_id, false)}>
                  <Text style={styles.link}>{learning.busy ? 'جارٍ الحفظ…' : 'إزالة من خطة تعلمي'}</Text>
                </Pressable>
              </View>
            ))}
            <Text style={styles.note}>الخطة محفوظة على هذا الجهاز. ترتيب المهارات حسب إضافتها، ويمكنك اختيار ما تبدأ به. راجع تطبيقك قبل تحديث ملف مهاراتك.</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8F9F5' },
    content: {
        width: '100%',
        maxWidth: 650,
        alignSelf: 'center',
        padding: 24,
        paddingBottom: 60,
        gap: 20,
    },
    title: {
        color: '#12635E',
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'right',
    },
    heading: {
        color: '#12635E',
        fontSize: 18,
        textAlign: 'right',
    },
    card: {
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE6E0',
        padding: 22,
        borderRadius: 18,
        gap: 14,
    },
    skill: {
        color: '#193C3B',
        fontSize: 20,
        fontWeight: '600',
    },
    english: {
        color: '#617570',
        fontSize: 15,
        lineHeight: 25,
    },
    text: {
        color: '#425F57',
        fontSize: 16,
        lineHeight: 28,
        textAlign: 'right',
    },
    link: {
        color: '#12635E',
        fontSize: 17,
        paddingVertical: 10,
        textAlign: 'right',
    },
    note: {
        color: '#617570',
        fontSize: 14,
        lineHeight: 24,
        textAlign: 'right',
    },
});