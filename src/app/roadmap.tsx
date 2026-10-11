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
const learningSteps: Record<string, string[]> = {
    Programming: [
        'راجع المتغيرات والشروط والحلقات والدوال في Python.',
        'اكتب برنامجًا يقرأ ملف بيانات ويحسب ملخصًا له، وتعامل مع القيم الناقصة.',
        'احتفظ بالكود واختباراتك، واشرح طريقة عمله وما يحتاج إلى تحسين.',
    ],
    'Machine Learning (ML)': [
        'تعرّف على التعلم تحت الإشراف، والفرق بين بيانات التدريب والاختبار.',
        'درّب نموذجًا بسيطًا على بيانات تدريب، ثم قيّمه على بيانات اختبار منفصلة وقارنه بتوقع بسيط.',
        'وثّق النتائج والأخطاء، واشرح لماذا اخترت طريقة التقييم.',
    ],
    'Model lifecycles deployment management': [
        'راجع مراحل تدريب النموذج وحفظه ونشره ومراقبته.',
        'احفظ نموذجًا مدربًا، ثم أنشئ طريقة لاستقبال بيانات جديدة وإرجاع توقعاته.',
        'وثّق إصدار النموذج، وكيف تتحقق من المدخلات وتراقب الأخطاء بعد تشغيله.',
    ],
    'Artificial intelligence, machine learning and deep learning application': [
        'اختر مشكلة صغيرة، وحدد هل تحتاج إلى تعلم آلة أم يكفي حل برمجي بسيط.',
        'ابنِ تجربة لحل المشكلة، وقارن نتيجتها بطريقة بسيطة تؤدي نفس المهمة.',
        'وثّق الفائدة وحدود التجربة، والحالات التي قد تعطي فيها نتائج خاطئة.',
    ],
    'Data preparation': [
        'راجع القيم الناقصة والتكرار وأنواع البيانات، وكيف تؤثر في التحليل.',
        'نظّف نسخة من ملف بيانات، وسجّل التغييرات وأسبابها دون تعديل الملف الأصلي.',
        'جهّز بيانات التدريب والاختبار بصورة منفصلة، ووثّق خطوات التحضير لتتمكن من تكرارها.',
    ],
    'Knowledge of prediction models': [
        'تعرّف على الفرق بين توقع رقم وتصنيف فئة، ومتى يناسب كل منهما المشكلة.',
        'قارن نموذجين بسيطين باستخدام نفس بيانات التدريب والاختبار ومقياس تقييم مناسب.',
        'اشرح أيهما أنسب بناءً على النتائج، واذكر حدود التوقعات.',
    ],
};

const generalSteps = [
    'راجع مفهوم المهارة وحدد ما تحتاج إلى تعلمه.',
    'اختر مادة تعليمية مناسبة، وطبّق تمرينًا مرتبطًا بالمهارة.',
    'احتفظ بتطبيقك واشرح نتائجك وما يحتاج إلى تحسين.',
];
export default function RoadmapScreen() {
    const router = useRouter();
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

                                        {(learningSteps[item.name] ?? generalSteps).map((step, stepIndex) => (
                                            <Text key={stepIndex} style={styles.text}>
                                                {stepIndex + 1}. {step}
                                            </Text>
                                        ))}

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