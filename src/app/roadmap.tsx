import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function RoadmapScreen() {
    const router = useRouter();
    const learning = useLearningPlan();
    const { id } = useLocalSearchParams<{ id?: string }>();

    const [savedSkills, setSavedSkills] = useState<string[] | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        async function loadSkills() {
            try {
                const saved = await AsyncStorage.getItem('masarak-skills-v1');

                if (saved !== null) {
                    const parsed: unknown = JSON.parse(saved);

                    if (
                        !Array.isArray(parsed) ||
                        !parsed.every((value) => typeof value === 'string')
                    ) {
                        throw new Error('Invalid profile');
                    }

                    if (active) setSavedSkills([...new Set(parsed)]);
                }
            } catch {
                if (active) setError('تعذر قراءة مهاراتك. حاول فتح الصفحة مجددًا.');
            } finally {
                if (active) setLoaded(true);
            }
        }

        loadSkills();

        return () => {
            active = false;
        };
    }, []);

    const career = dataset.careers.find(
        (item) => item.career_id === id
    );

    const missing = dataset.career_skills.filter(
        (item) =>
            item.career_id === id &&
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
                        else router.replace('/');
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
                            أضف مهاراتك أولًا حتى نعرض قائمة مناسبة لاختياراتك.
                        </Text>
                        <Pressable onPress={() => router.replace('/')}>
                            <Text style={styles.link}>فتح الصفحة الرئيسية</Text>
                        </Pressable>
                    </View>
                ) : (
                    <>
                        <Text style={styles.text}>
                            هذه المهارات الأساسية لم تحددها في ملفك. اختر منها ما
                            تريد تطويره. ترتيب القائمة ليس ترتيب أولوية أو متطلبات
                            سابقة للتعلم.
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
                                        <Text style={styles.skill}>{item.name}</Text>
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
                                            style={{ backgroundColor: '#ACD8BB', borderRadius: 14, padding: 14, minHeight: 48, opacity: !learning.ready || learning.busy ? 0.5 : 1 }}
                                            onPress={() => void learning.change(item.skill_id, !learning.plan.includes(item.skill_id))}
                                        >
                                            <Text style={{ color: '#0D1B16', textAlign: 'center', fontWeight: '600', fontSize: 16 }}>
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
                            بعض المهارات لها تمارين مقترحة مخصصة، والبقية تعرض خطوات عامة.
                            لم نضف دورات محددة أو مددًا أو اختبار إتقان بعد.
                            إكمال التمرين وحده لا يثبت امتلاك المهارة.
                        </Text>
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