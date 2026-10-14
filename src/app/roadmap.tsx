import { useSkillProfile } from '../hooks/use-skill-profile';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import dataset from '../masarak_dataset.json';
import { getLearningSteps } from '../constants/learning-steps';
import { useLearningPlan } from '../hooks/use-learning-plan';
import { displaySkillName } from '../utils/skill-labels';
import { jobPathById } from '../constants/job-paths';
import { requirementsForCareerPath } from '../constants/job-path-requirements';

export default function RoadmapScreen() {
    const router = useRouter();
    const learning = useLearningPlan();
    const { id } = useLocalSearchParams<{ id?: string }>();

    const { profile, ready: loaded, error } = useSkillProfile();
    const savedSkills = profile?.skill_ids ?? null;

    const career = jobPathById(id);
    const missing = requirementsForCareerPath(id ?? '').filter(
        (item) =>
            item.priority === 'core' &&
            !savedSkills?.includes(item.skill_id)
    );

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                        if (router.canGoBack()) router.back();
                        else router.replace('/home');
                    }}
                >
                    <Text style={styles.link}>العودة</Text>
                </Pressable>

                <Pressable accessibilityRole="button" onPress={() => router.push('/learning-plan')}>
                    <Text style={styles.link}>خطة تعلمي</Text>
                </Pressable>
                {learning.error ? (
                    <Pressable accessibilityRole="button" onPress={() => void learning.reload()}>
                        <Text style={styles.note}>{learning.error} اضغط لإعادة التحميل.</Text>
                    </Pressable>
                ) : null}
                <Text style={styles.title}>خطوات التعلم المقترحة</Text>
                <Text style={styles.english}>
                    {career?.title ?? ''}
                </Text>

                {!career ? (
                    <Text style={styles.text}>لم يتم العثور على الوظيفة.</Text>
                ) : !loaded ? (
                    <Text style={styles.text}>جارٍ تحميل مهاراتك…</Text>
                ) : error ? (
                    <Text style={styles.text}>{error}</Text>
                ) : savedSkills === null ? (
                    <View style={styles.card}>
                        <Text style={styles.text}>
                            اعتمد مهارات سيرتك أو أضفها يدويًا حتى نعرض اقتراحات مرتبطة بملفك.
                        </Text>
                        <Pressable onPress={() => router.replace('/home')}>
                            <Text style={styles.link}>فتح الصفحة الرئيسية</Text>
                        </Pressable>
                    </View>
                ) : (
                    <>
                        <Text style={styles.text}>
                            هذه المهارات الأساسية لم يُرصد دليل عليها في ملفك المعتمد. اختر منها ما
                            تريد تطويره. رتّبنا الأساسية لهذا المسمى قبل المهارات
                            الإضافية، ثم اعرضناها حسب ترتيب الخطة المهنية للمسار.
                        </Text>

                        {missing.length === 0 ? (
                            <View style={styles.card}>
                                <Text style={styles.text}>
                                    حددت جميع المهارات الأساسية في هذه النسخة.
                                    يمكنك مراجعة مستوى إتقانك أو استكشاف المهارات
                                    الإضافية في تفاصيل الوظيفة.
                                </Text>
                            </View>
                        ) : (
                            missing.map((item, index) => {
                                const skill = dataset.skills.find(
                                    (entry) => entry.skill_id === item.skill_id
                                );

                                return (
                                    <View key={item.skill_id} style={styles.card}>
                                        <Text style={styles.heading}>
                                            مهارة {index + 1}
                                        </Text>
                                        <Text style={styles.skill}>{displaySkillName(item.name)}</Text>
                                        <Text style={styles.english}>
                                            {skill?.description ?? 'الوصف غير متوفر'}
                                        </Text>

                                        {getLearningSteps(item.name).map((step, stepIndex) => (
                                            <Text key={stepIndex} style={styles.text}>
                                                {stepIndex + 1}. {step}
                                            </Text>
                                        ))}

                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityState={{ disabled: !learning.ready || learning.busy }}
                                            disabled={!learning.ready || learning.busy}
                                            style={{ backgroundColor: '#12635E', borderRadius: 14, padding: 14, minHeight: 48, opacity: !learning.ready || learning.busy ? 0.5 : 1 }}
                                            onPress={() => void learning.change(item.skill_id, !learning.plan.includes(item.skill_id))}
                                        >
                                            <Text style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600', fontSize: 16 }}>
                                                {!learning.ready ? 'جارٍ تحميل الخطة…' : learning.plan.includes(item.skill_id) ? '✓ في خطة تعلمي — إزالة' : 'أضف إلى خطة تعلمي'}
                                            </Text>
                                        </Pressable>
                                        <Text style={styles.note}>
                                            بعد التطبيق، راجع ما تستطيع تنفيذه وشرحه بنفسك قبل تحديث ملف مهاراتك.
                                        </Text>
                                    </View>
                                );
                            })
                        )}

                        <Text style={styles.note}>
                            بعض المهارات لها تمارين ومصادر مخصصة، والبقية تعرض خطوات عامة.
                            إكمال التمرين وحده لا يثبت امتلاك المهارة.
                        </Text>
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
