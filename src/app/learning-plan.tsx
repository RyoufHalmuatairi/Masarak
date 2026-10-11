import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dataset from '../masarak_dataset.json';
import { getLearningSteps } from '../constants/learning-steps';
import { useLearningPlan } from '../hooks/use-learning-plan';

export default function LearningPlanScreen() {
  const router = useRouter();
  const learning = useLearningPlan();
  const skills = learning.plan.flatMap((id) => {
    const skill = dataset.skills.find((item) => item.skill_id === id);
    return skill ? [skill] : [];
  });

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <Text style={styles.link}>العودة</Text>
        </Pressable>
        <Text style={styles.title}>خطة تعلمي</Text>
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
            <Pressable accessibilityRole="button" onPress={() => router.replace('/')}>
              <Text style={styles.link}>استكشف المسارات</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.heading}>مهارات في خطتك: {skills.length}</Text>
            {skills.map((skill) => (
              <View key={skill.skill_id} style={styles.card}>
                <Text style={styles.skill}>{skill.name}</Text>
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
    screen: { flex: 1, backgroundColor: '#0D1B16' },
    content: {
        width: '100%',
        maxWidth: 650,
        alignSelf: 'center',
        padding: 24,
        paddingBottom: 60,
        gap: 20,
    },
    title: {
        color: '#ACD8BB',
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'right',
    },
    heading: {
        color: '#ACD8BB',
        fontSize: 18,
        textAlign: 'right',
    },
    card: {
        backgroundColor: '#1A3025',
        padding: 22,
        borderRadius: 18,
        gap: 14,
    },
    skill: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
    },
    english: {
        color: '#D2DED5',
        fontSize: 15,
        lineHeight: 25,
    },
    text: {
        color: '#E0EBE3',
        fontSize: 16,
        lineHeight: 28,
        textAlign: 'right',
    },
    link: {
        color: '#ACD8BB',
        fontSize: 17,
        paddingVertical: 10,
        textAlign: 'right',
    },
    note: {
        color: '#B0C3B7',
        fontSize: 14,
        lineHeight: 24,
        textAlign: 'right',
    },
});