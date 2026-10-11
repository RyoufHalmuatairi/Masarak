import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import dataset from '../masarak_dataset.json';

const titles: Record<string, string> = {
  C01: 'مهندس برمجيات',
  C02: 'محلل بيانات',
  C03: 'عالم بيانات وذكاء اصطناعي',
  C04: 'مهندس ذكاء اصطناعي وتعلم آلة',
  C05: 'محلل أمن سيبراني',
  C06: 'مهندس شبكات',
};

// نعرض المهارات المستخدمة في الوظائف الست فقط.
const skills = dataset.skills.filter((skill) =>
  dataset.career_skills.some(
    (link) => link.skill_id === skill.skill_id
  )
);

export default function HomeScreen() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<string[] | null>(null);
  const [search, setSearch] = useState('');
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    let active = true;

    async function restoreProfile() {
      try {
        const saved = await AsyncStorage.getItem('masarak-skills-v1');

        if (saved !== null) {
          const parsed: unknown = JSON.parse(saved);

          if (
            !Array.isArray(parsed) ||
            !parsed.every((id) => typeof id === 'string')
          ) {
            throw new Error('Invalid saved profile');
          }

          const validIds = new Set(skills.map((skill) => skill.skill_id));
          const restored = [...new Set(
            parsed.filter((id) => validIds.has(id))
          )];

          if (active) {
            setSelected(restored);
            setSubmitted(restored);
          }
        }
      } catch {
        if (active) {
          setStorageError('تعذر استرجاع المهارات المحفوظة.');
        }
      } finally {
        if (active) setStorageReady(true);
      }
    }

    restoreProfile();

    return () => {
      active = false;
    };
  }, []);

  async function saveProfile() {
    const profile = [...new Set(selected)];

    try {
      await AsyncStorage.setItem(
        'masarak-skills-v1',
        JSON.stringify(profile)
      );
      setStorageError('');
    } catch {
      setStorageError(
        'ظهرت النتائج، لكن تعذر حفظ المهارات على الجهاز.'
      );
    }

    setSubmitted(profile);
    setEditing(false);
    setSearch('');
  }

  if (!storageReady) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.description}>جارٍ تحميل مهاراتك…</Text>
      </SafeAreaView>
    );
  }

  const visibleSkills = skills.filter((skill) =>
    skill.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  function toggleSkill(id: string) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  const results = dataset.careers.map((career) => {
    const core = dataset.career_skills.filter(
      (link) =>
        link.career_id === career.career_id &&
        link.priority === 'core'
    );

    const coreIds = [...new Set(core.map((link) => link.skill_id))];
    const matched = coreIds.filter((id) => submitted?.includes(id));
    const missing = core.filter(
      (link) => !submitted?.includes(link.skill_id)
    );

    return {
      ...career,
      matched: matched.length,
      total: coreIds.length,
      missing,
      score:
        submitted === null || coreIds.length === 0
          ? null
          : Math.round((matched.length / coreIds.length) * 100),
    };
  });

  results.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>مسارك</Text>
        <Text style={styles.description}>
          اكتشف المسارات المرتبطة بمهاراتك
        </Text>

        <View style={styles.card}>
          <Text style={styles.title}>
            {submitted === null
              ? 'ابدأ بإضافة مهاراتك'
              : 'ملف مهاراتك'}
          </Text>
          <Text style={styles.description}>
            {submitted === null
              ? 'لم يتم التقييم'
              : `اخترت ${submitted.length} مهارة`}
          </Text>
          <Pressable
            style={styles.button}
            accessibilityRole="button"
            onPress={() => setEditing(true)}
          >
            <Text style={styles.buttonText}>
              {submitted === null ? 'اختيار المهارات' : 'تعديل المهارات'}
            </Text>
          </Pressable>
        </View>

        {editing && (
          <View style={styles.card}>
            <Text style={styles.title}>ما المهارات التي تمتلكها؟</Text>
            <Text style={styles.description}>
              الأسماء والأوصاف أدناه من قاموس المهارات الإنجليزي.
            </Text>

            <TextInput
              style={styles.search}
              placeholder="ابحث باسم المهارة بالإنجليزية"
              placeholderTextColor="#B0C3B7"
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="البحث عن مهارة"
            />

            <Text style={styles.description}>
              المحدد: {selected.length}
            </Text>

            {visibleSkills.length === 0 && (
              <Text style={styles.description}>
                لا توجد مهارات تطابق البحث.
              </Text>
            )}

            {visibleSkills.map((skill) => {
              const checked = selected.includes(skill.skill_id);

              return (
                <Pressable
                  key={skill.skill_id}
                  style={[
                    styles.skill,
                    checked && styles.selectedSkill,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  onPress={() => toggleSkill(skill.skill_id)}
                >
                  <Text style={styles.skillName}>
                    {checked ? '✓ ' : ''}{skill.name}
                  </Text>
                  <Text style={styles.skillDescription}>
                    {skill.description}
                  </Text>
                </Pressable>
              );
            })}

            <Pressable
              style={styles.button}
              accessibilityRole="button"
              onPress={saveProfile}
            >
              <Text style={styles.buttonText}>عرض النتائج</Text>
            </Pressable>
          </View>
        )}

        {!editing && submitted !== null && (
          <>
            <Text style={styles.title}>نتائج المطابقة</Text>
            <Text style={styles.description}>
              النتائج المتساوية لها نفس نسبة التغطية؛ ترتيب ظهورها
              لا يعني أن إحداها أفضل.
            </Text>

            {results.map((career) => (
              <View key={career.career_id} style={styles.card}>
                <Text style={styles.title}>
                  {titles[career.career_id] ?? career.title}
                </Text>
                <Text style={styles.english}>{career.title}</Text>
                <Text style={styles.score}>{career.score}%</Text>
                <Pressable
                  style={styles.button}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/career',
                      params: { id: career.career_id },
                    })
                  }
                >
                  <Text style={styles.buttonText}>تفاصيل الوظيفة</Text>
                </Pressable>

                <Text style={styles.description}>
                  تغطية المهارات الأساسية: {career.matched} من {career.total}
                </Text>

                <Text style={styles.description}>
                  مهارات لم يُرصد دليل عليها:
                </Text>
                {career.missing.length === 0 ? (
                  <Text style={styles.description}>
                    تم تحديد جميع المهارات الأساسية لهذه النسخة.
                  </Text>
                ) : (
                  career.missing.map((skill) => (
                    <Text key={skill.skill_id} style={styles.english}>
                      • {skill.name}
                    </Text>
                  ))
                )}
              </View>
            ))}
          </>
        )}

        <Text style={styles.note}>
          هذه تغطية للمهارات المختارة وليست قياسًا للإتقان أو ضمانًا
          للتوظيف. تصنيف المهارات الأساسية اختيار لنسخة Masarak
          التجريبية. عدم اختيار مهارة لا يثبت عدم امتلاكها.
        </Text>
        <Text style={styles.note}>
          {storageError || 'تُحفظ مهاراتك محليًا على هذا الجهاز.'}
        </Text>
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
  brand: {
    color: '#ACD8BB',
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#1A3025',
    borderRadius: 20,
    padding: 24,
    gap: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'right',
  },
  description: {
    color: '#E0EBE3',
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#ACD8BB',
    borderRadius: 14,
    padding: 18,
  },
  buttonText: {
    color: '#10271B',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  search: {
    borderWidth: 1,
    borderColor: '#739A82',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  skill: {
    backgroundColor: '#10271B',
    borderWidth: 1,
    borderColor: '#456653',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  selectedSkill: {
    backgroundColor: '#254B38',
    borderColor: '#ACD8BB',
  },
  skillName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  skillDescription: {
    color: '#D2DED5',
    fontSize: 14,
    lineHeight: 22,
  },
  english: { color: '#D2DED5', fontSize: 16, lineHeight: 25 },
  score: { color: '#ACD8BB', fontSize: 32, fontWeight: '700' },
  note: {
    color: '#B0C3B7',
    fontSize: 13,
    lineHeight: 23,
    textAlign: 'right',
  },
});