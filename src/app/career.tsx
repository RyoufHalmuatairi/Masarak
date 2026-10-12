import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSkillProfile } from '../hooks/use-skill-profile';
import dataset from '../masarak_dataset.json';

const titles: Record<string, string> = {
    C01: 'مهندس برمجيات',
    C02: 'محلل بيانات',
    C03: 'عالم بيانات وذكاء اصطناعي',
    C04: 'مهندس ذكاء اصطناعي وتعلم آلة',
    C05: 'محلل أمن سيبراني',
    C06: 'مهندس شبكات',
};

export default function CareerScreen() {
    const router = useRouter();
    const { profile, ready: profileLoaded, error: profileError } = useSkillProfile();
    const savedSkills = profile?.skill_ids ?? null;
    const cvSkills = new Set(profile?.cv?.skills.flatMap(skill => skill.mapped_skill_id && !profile.excluded_cv_skill_ids.includes(skill.mapped_skill_id) ? [skill.mapped_skill_id] : []) ?? []);
    const params = useLocalSearchParams<{ id?: string }>();
    const career = dataset.careers.find(
        (item) => item.career_id === params.id
    );

    if (!career) {
        return (
            <SafeAreaView style={styles.screen}>
                <View style={styles.content}>
                    <Text style={styles.title}>لم يتم العثور على الوظيفة</Text>
                    <Pressable onPress={() => router.replace('/home')}>
                        <Text style={styles.link}>العودة للرئيسية</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const requirements = dataset.career_skills.filter(
        (item) => item.career_id === career.career_id
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

                <Text style={styles.title}>
                    {titles[career.career_id] ?? career.title}
                </Text>
                <Text style={styles.english}>{career.title}</Text>
                <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                        router.push({
                            pathname: '/roadmap',
                            params: { id: career.career_id },
                        })
                    }
                >
                    <Text style={styles.link}>عرض خطوات التعلم المقترحة</Text>
                </Pressable>

                {(['core', 'additional'] as const).map((priority) => (
                    <View key={priority} style={styles.section}>
                        <Text style={styles.heading}>
                            {priority === 'core'
                                ? 'المهارات الأساسية للتجربة'
                                : 'المهارات الإضافية'}
                        </Text>

                        {requirements
                            .filter((item) => item.priority === priority)
                            .map((item) => {
                                const skill = dataset.skills.find(
                                    (entry) => entry.skill_id === item.skill_id
                                );

                                return (
                                    <View key={item.skill_id} style={styles.card}>
                                        <Text style={styles.skillName}>{item.name}</Text>
                                        <Text style={styles.note}>
                                            {!profileLoaded
                                                ? 'جارٍ تحميل ملف مهاراتك…'
                                                : profileError
                                                    ? profileError
                                                    : savedSkills === null
                                                        ? 'اعتمد سيرتك أو أضف مهاراتك من ملفك'
                                                        : savedSkills.includes(item.skill_id)
                                                            ? cvSkills.has(item.skill_id) ? '✓ من سيرتك الذاتية المعتمدة' : '✓ أضفتها يدويًا في ملفك'
                                                            : 'لم تحددها في ملف مهاراتك'}
                                        </Text>

                                        <Text style={styles.english}>
                                            {skill?.description ?? 'الوصف غير متوفر'}
                                        </Text>
                                        <Pressable
                                            accessibilityRole="link"
                                            onPress={() => {
                                                Linking.openURL(item.evidence_url).catch(
                                                    () => { }
                                                );
                                            }}
                                        >
                                            <Text style={styles.link}>المصدر المهني</Text>
                                        </Pressable>
                                    </View>
                                );
                            })}
                    </View>
                ))}

                <View style={styles.card}>
                    <Text style={styles.heading}>كيف اخترنا المهارات؟</Text>
                    <Text style={styles.note}>
                        أسماء المهارات وأوصافها من إطار المهارات السعودي.
                        ربطها بهذه الوظيفة تفسير للمصادر المهنية المكملة،
                        وليس ربطًا رسميًا. تصنيف الأساسية والإضافية قرار
                        لنسخة Masarak التجريبية، ولا يحدد مستوى إتقان مطلوبًا.
                    </Text>
                    <Text style={styles.note}>
                        المهارات الإضافية لا تدخل في نسبة التغطية.
                        الأوصاف الإنجليزية معروضة كما وردت في البيانات.
                    </Text>
                </View>
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
        gap: 20,
        paddingBottom: 60,
    },
    title: {
        color: '#12635E',
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'right',
    },
    heading: {
        color: '#193C3B',
        fontSize: 21,
        fontWeight: '700',
        textAlign: 'right',
    },
    section: { gap: 14 },
    card: {
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE6E0',
        padding: 20,
        borderRadius: 16,
        gap: 12,
    },
    skillName: {
        color: '#193C3B',
        fontSize: 18,
        fontWeight: '600',
    },
    english: {
        color: '#617570',
        fontSize: 15,
        lineHeight: 25,
    },
    link: {
        color: '#12635E',
        fontSize: 17,
        textAlign: 'right',
        paddingVertical: 8,
    },
    note: {
        color: '#617570',
        fontSize: 15,
        lineHeight: 27,
        textAlign: 'right',
    },
});