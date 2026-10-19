import { useCallback, useEffect, useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CV_MIME_TYPES, formatCvSize, validateCvFile } from '../utils/cv-file';
import { analyzeCv } from '../utils/cv-api';
import { readSkillProfile, saveReviewedCv, clearReviewedCv, type CvAnalysis, type CvProfile } from '../utils/skill-profile';
import dataset from '../masarak_dataset.json';
import { careerTitles } from '../utils/career-matches';
import { createSkillMatcher } from '../utils/skill-matching.mjs';
import { captureDataScope } from '../utils/scoped-storage';
import { loadSavedCv, storeCvFile, storeCvReview, deleteSavedCv } from '../utils/saved-cv';
const matchSkillName = createSkillMatcher(dataset);
function skillScoreNote(id: string | null) {
  if (!id) return 'لم نجد ربطًا موثوقًا لهذا الاسم؛ تُحفظ المهارة للمراجعة ولا نحتسبها بالتخمين.';
  const core = dataset.career_skills.filter(row => row.skill_id === id && row.priority === 'core').map(row => careerTitles[row.career_id] ?? row.career_id);
  if (core.length) return 'تدخل تغطية المتطلبات الأساسية لمسار: ' + core.join('، ') + '. تُحتسب الكفاءة مرة واحدة مهما تكررت أدواتها.';
  if (dataset.career_skills.some(row => row.skill_id === id)) return 'مهارة مساندة مرتبطة بمسارات؛ تظهر في ملفك والخطة، ولا تغير نسبة المتطلبات الأساسية.';
  return 'مهارة معروفة في القاموس ومحفوظة، لكنها ليست ضمن متطلبات المسارات الستة الحالية.';
}

export default function UploadCvScreen() {
  const router = useRouter();
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  const [ready, setReady] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [analysis, setAnalysis] = useState<CvAnalysis | null>(null);
  const [savedCv, setSavedCv] = useState<CvProfile | null>(null);
  const [includedSkills, setIncludedSkills] = useState<number[]>([]);
  const [includedCertificates, setIncludedCertificates] = useState<number[]>([]);
  const [includedExperiences, setIncludedExperiences] = useState<number[]>([]);
  const [includedExtras, setIncludedExtras] = useState<Record<'education' | 'projects' | 'activities', number[]>>({ education: [], projects: [], activities: [] });
  const locked = useRef(false);
  const active = useRef(true);
  useFocusEffect(useCallback(() => {
    active.current = true;
    void Promise.all([readSkillProfile(), loadSavedCv()]).then(([profile, saved]) => {
      if (!active.current) return;
      setSavedCv(profile?.cv ?? null);
      if (saved) {
        setFile(saved.asset);
        setAnalysis(saved.review?.analysis ?? null);
        setIncludedSkills(saved.review?.skills ?? []);
        setIncludedCertificates(saved.review?.certificates ?? []);
        setIncludedExperiences(saved.review?.experiences ?? []);
        setIncludedExtras({ education: saved.review?.education ?? [], projects: saved.review?.projects ?? [], activities: saved.review?.activities ?? [] });
      }
    }).catch(() => { if (active.current) setError('تعذر استرجاع السيرة المحفوظة. حاول فتح الصفحة مجددًا.'); })
      .finally(() => { if (active.current) setReady(true); });
    return () => { active.current = false; };
  }, []));

  useEffect(() => {
    if (!ready || !file || !analysis || busy) return;
    void storeCvReview(file.uri, { analysis, skills: includedSkills, certificates: includedCertificates, experiences: includedExperiences, ...includedExtras })
      .catch(() => setError('تعذر حفظ تعديلات المراجعة. حاول مجددًا قبل إغلاق التطبيق.'));
  }, [ready, file, analysis, busy, includedSkills, includedCertificates, includedExperiences, includedExtras]);

  async function removeCv() {
    const scope = captureDataScope();
    if (locked.current) return;
    locked.current = true; setBusy(true); setStatus('جارٍ حذف السيرة…'); setError('');
    try {
      await clearReviewedCv();
      scope.assertCurrent();
      await deleteSavedCv();
      setFile(null); setAnalysis(null); setSavedCv(null); setConsent(false); setConfirmDelete(false);
      setIncludedSkills([]); setIncludedCertificates([]); setIncludedExperiences([]); setIncludedExtras({ education: [], projects: [], activities: [] });
    } catch { setError('تعذر إكمال حذف السيرة. حاول مجددًا.'); }
    finally { locked.current = false; setBusy(false); }
  }

  async function pickCv() {
    const scope = captureDataScope();
    if (locked.current) return;
    locked.current = true; setBusy(true); setStatus('جارٍ اختيار الملف…'); setError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: CV_MIME_TYPES, multiple: false, copyToCacheDirectory: true, base64: false });
      if (result.canceled) return;
      scope.assertCurrent();
      const selected = result.assets[0];
      if (!selected) throw new Error('تعذر اختيار الملف.');
      const problem = validateCvFile(selected);
      if (problem) throw new Error(problem);
      const saved = await storeCvFile(selected);
      setFile(saved.asset); setAnalysis(null); setConsent(false); setConfirmDelete(false);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'تعذر اختيار الملف.'); }
    finally { locked.current = false; setBusy(false); }
  }

  async function runAnalysis() {
    const scope = captureDataScope();
    if (!file || !consent || locked.current) return;
    locked.current = true; setBusy(true); setStatus('جارٍ قراءة السيرة وتحليلها…'); setError('');
    try {
      const result = await analyzeCv(file);
      scope.assertCurrent();
      await storeCvReview(file.uri, { analysis: result, skills: result.skills.map((_, index) => index), certificates: result.certificates.map((_, index) => index), experiences: result.experiences.map((_, index) => index), education: (result.education ?? []).map((_, index) => index), projects: (result.projects ?? []).map((_, index) => index), activities: (result.activities ?? []).map((_, index) => index) });
      if (!active.current) return;
      setAnalysis(result);
      setIncludedSkills(result.skills.map((_, index) => index));
      setIncludedCertificates(result.certificates.map((_, index) => index));
      setIncludedExperiences(result.experiences.map((_, index) => index));
      setIncludedExtras({ education: (result.education ?? []).map((_, index) => index), projects: (result.projects ?? []).map((_, index) => index), activities: (result.activities ?? []).map((_, index) => index) });
    } catch (failure) { if (active.current) setError(failure instanceof Error ? failure.message : 'تعذر التحليل.'); }
    finally { locked.current = false; setBusy(false); }
  }

  async function approve() {
    const scope = captureDataScope();
    if (!analysis || locked.current) return;
    locked.current = true; setBusy(true); setStatus('جارٍ حفظ المعلومات…'); setError('');
    try {
      const reviewed: CvAnalysis = {
        skills: analysis.skills.filter((_, index) => includedSkills.includes(index)),
        certificates: analysis.certificates.filter((_, index) => includedCertificates.includes(index)),
        experiences: analysis.experiences.filter((_, index) => includedExperiences.includes(index)),
        education: (analysis.education ?? []).filter((_, index) => includedExtras.education.includes(index)),
        projects: (analysis.projects ?? []).filter((_, index) => includedExtras.projects.includes(index)),
        activities: (analysis.activities ?? []).filter((_, index) => includedExtras.activities.includes(index)), warnings: analysis.warnings,
      };
      if (reviewed.skills.some(item => !item.name.trim()) || reviewed.certificates.some(item => !item.name.trim()) || reviewed.experiences.some(item => !item.role.trim()) || [reviewed.education, reviewed.projects, reviewed.activities].some(items => items?.some(item => !item.name.trim()))) throw new Error('أكمل أسماء المعلومات التي تريد حفظها أو ألغِ اختيارها.');
      if (file) await storeCvReview(file.uri, { analysis, skills: includedSkills, certificates: includedCertificates, experiences: includedExperiences, ...includedExtras });
      scope.assertCurrent();
      await saveReviewedCv(reviewed);
      router.replace('/home');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'تعذر الحفظ.'); }
    finally { locked.current = false; setBusy(false); }
  }

  function toggle(list: number[], index: number, update: (value: number[]) => void) {
    update(list.includes(index) ? list.filter(value => value !== index) : [...list, index]);
  }
  function selection(label: string, selected: boolean, onPress: () => void) {
    return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled: busy }} disabled={busy} onPress={onPress}><Text style={styles.link}>{selected ? '✓' : '□'} {label}</Text></Pressable>;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}><Text style={styles.link}>العودة</Text></Pressable>
        <Text style={styles.title}>سيرتك الذاتية</Text>
        <Text style={styles.text}>راجع مهاراتك وتعليمك وشهاداتك وخبراتك ومشاريعك وأنشطتك قبل اعتمادها.</Text>
        <View style={styles.card}>
          <Text style={styles.heading}>{file ? 'سيرتك المحفوظة' : 'اختر ملف السيرة'}</Text>
          <Text style={styles.text}>PDF نصي أو DOCX، حتى 10 ميجابايت. السيرة المصوّرة غير مدعومة حاليًا.</Text>
          <Pressable style={[styles.button, busy && styles.disabled]} accessibilityRole="button" disabled={busy || !ready} onPress={() => void pickCv()}><Text style={styles.buttonText}>{file ? 'اختيار ملف آخر' : 'اختيار السيرة من الملفات'}</Text></Pressable>
          {file ? <>
            <Text style={styles.fileName}>{file.name}</Text><Text style={styles.text}>{formatCvSize(file.size)}</Text>
            {selection('أوافق على تحليل محتوى السيرة؛ وقد يُرسل نصها إلى Groq إذا كانت الخدمة مفعّلة.', consent, () => setConsent(!consent))}
            <Text style={styles.note}>دون Groq، هذا استخراج محدود بقواعد وليس تحليل ذكاء اصطناعي كاملًا. يلتقط المهارات الحرفية والخبرات الواضحة تحت أقسامها بأدلة من النص؛ وقد يفوّت التنسيقات المعقدة ولا يخمّن معلومات أو يستخرج بقية الأقسام. عند تفعيل Groq قد يُرسل نص السيرة إلى مزوّد خارجي؛ لن يبدأ التحليل قبل موافقتك.</Text>
            <Pressable disabled={busy} onPress={() => void Linking.openURL('https://console.groq.com/docs/your-data').catch(() => setError('تعذر فتح صفحة سياسة البيانات.'))}><Text style={styles.link}>سياسة بيانات Groq عند تفعيله</Text></Pressable>
            <Pressable style={[styles.button, (!consent || busy) && styles.disabled]} accessibilityRole="button" disabled={!consent || busy} onPress={() => void runAnalysis()}><Text style={styles.buttonText}>{analysis ? 'إعادة التحليل' : 'تحليل السيرة الذاتية'}</Text></Pressable>
            <Text style={styles.note}>السيرة ونتيجة التحليل محفوظتان على هذا الجهاز حتى تحذفهما. حفظ المتصفح منفصل عن حفظ الآيفون، وقد يُحذف عند مسح بيانات التطبيق أو المتصفح.</Text>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => setConfirmDelete(true)}><Text style={styles.link}>حذف السيرة المحفوظة</Text></Pressable>
            {confirmDelete ? <View>
              <Text style={styles.text}>هل تريد حذف ملف السيرة ونتيجة تحليلها والمعلومات المعتمدة منها؟ المهارات المختارة وخطة التعلم تبقيان؛ يمكنك تعديلهما من الرئيسية.</Text>
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => void removeCv()}><Text style={styles.error}>نعم، حذف السيرة</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => setConfirmDelete(false)}><Text style={styles.link}>إلغاء</Text></Pressable>
            </View> : null}
          </> : null}
        </View>
        {!ready ? <Text style={styles.text}>جارٍ استرجاع سيرتك…</Text> : null}
        {busy ? <View><ActivityIndicator color="#12635E" /><Text style={styles.text}>{status}</Text></View> : null}
        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
        {analysis ? <>
          <Text style={styles.heading}>راجع المعلومات المستخرجة</Text>
          <Text style={styles.text}>يمكن أن يخطئ التحليل. صحح النصوص وألغِ اختيار المعلومات غير الصحيحة. ربط المهارة بقاموس مسارك اقتراح يحتاج مراجعتك.</Text>
          {analysis.warnings.map((warning, index) => <Text key={index} style={styles.note}>{warning}</Text>)}
          <Text style={styles.heading}>المهارات ({analysis.skills.length})</Text>
          {!analysis.skills.length ? <Text style={styles.note}>لم نستخرج مهارات مدعومة بنص واضح.</Text> : null}
          {analysis.skills.map((skill, index) => <View key={index} style={styles.card}>
            {selection('اعتماد هذه المهارة', includedSkills.includes(index), () => toggle(includedSkills, index, setIncludedSkills))}
            <TextInput accessibilityLabel="اسم المهارة" style={styles.input} value={skill.name} editable={!busy} onChangeText={name => setAnalysis({ ...analysis, skills: analysis.skills.map((item, i) => i === index ? { ...item, name, mapped_skill_id: matchSkillName(name) } : item) })} />
            <Text style={styles.note}>من السيرة: {skill.evidence}</Text>
            <Text style={styles.text}>{skill.mapped_skill_id ? `ربط مقترح: ${dataset.skills.find(item => item.skill_id === skill.mapped_skill_id)?.name}` : 'لم نجد ربطًا موثوقًا لهذا الاسم في القاموس؛ احتفظنا به للمراجعة.'}</Text>
            <Text style={styles.note}>{skillScoreNote(skill.mapped_skill_id)}</Text>
            {skill.mapped_skill_id ? <Pressable disabled={busy} onPress={() => setAnalysis({ ...analysis, skills: analysis.skills.map((item, i) => i === index ? { ...item, mapped_skill_id: null } : item) })}><Text style={styles.link}>إلغاء الربط المقترح مع الاحتفاظ بالمهارة</Text></Pressable> : null}
          </View>)}
          {(['education', 'projects', 'activities'] as const).map(section => {
            const title = section === 'education' ? 'التعليم والمؤهلات الجامعية' : section === 'projects' ? 'المشاريع' : 'الأنشطة والتطوع';
            const labels = section === 'education' ? { name: 'المؤهل والتخصص', organization: 'الجهة التعليمية', dates: 'فترة الدراسة', description: 'حالة الدراسة أو تفاصيل المؤهل' } : section === 'projects' ? { name: 'اسم المشروع', organization: 'الجهة إن وجدت', dates: 'الفترة', description: 'وصف المشروع' } : { name: 'النشاط أو الدور', organization: 'الجهة أو النادي', dates: 'الفترة', description: 'وصف المشاركة' };
            const entries = analysis[section] ?? [];
            return <View key={section} style={{ gap: 16 }}>
              <Text style={styles.heading}>{title} ({entries.length})</Text>
              {analysis[section] === undefined ? <Text style={styles.note}>هذه نتيجة من الإصدار السابق. أعد التحليل لتفصيل هذا القسم.</Text> : entries.length === 0 ? <Text style={styles.note}>لم نجد معلومات واضحة لهذا القسم.</Text> : null}
              {entries.map((entry, index) => <View key={index} style={styles.card}>
                {selection('اعتماد هذه المعلومة', includedExtras[section].includes(index), () => setIncludedExtras({ ...includedExtras, [section]: includedExtras[section].includes(index) ? includedExtras[section].filter(value => value !== index) : [...includedExtras[section], index] }))}
                {(['name', 'organization', 'dates', 'description'] as const).map(field => <View key={field}>
                  <Text style={styles.note}>{labels[field]}</Text>
                  <TextInput accessibilityLabel={labels[field]} placeholder={labels[field]} placeholderTextColor="#617570" style={styles.input} multiline={field === 'description'} editable={!busy} value={entry[field]} onChangeText={value => setAnalysis({ ...analysis, [section]: entries.map((item, i) => i === index ? { ...item, [field]: value } : item) })} />
                </View>)}
                <Text style={styles.note}>من السيرة: {entry.evidence}</Text>
              </View>)}
            </View>;
          })}
          <Text style={styles.heading}>الشهادات المهنية والدورات ({analysis.certificates.length})</Text>
          {!analysis.certificates.length ? <Text style={styles.note}>لم نجد شهادات مكتملة مذكورة بوضوح.</Text> : null}
          {analysis.certificates.map((certificate, index) => <View key={index} style={styles.card}>
            {selection('اعتماد هذه الشهادة', includedCertificates.includes(index), () => toggle(includedCertificates, index, setIncludedCertificates))}
            {(['name', 'issuer', 'date'] as const).map(field => <TextInput key={field} accessibilityLabel={field === 'name' ? 'اسم الشهادة' : field === 'issuer' ? 'الجهة المانحة' : 'تاريخ الشهادة'} placeholder={field === 'name' ? 'اسم الشهادة' : field === 'issuer' ? 'الجهة المانحة' : 'التاريخ إن وجد'} placeholderTextColor="#617570" style={styles.input} editable={!busy} value={certificate[field]} onChangeText={value => setAnalysis({ ...analysis, certificates: analysis.certificates.map((item, i) => i === index ? { ...item, [field]: value } : item) })} />)}
            <Text style={styles.note}>من السيرة: {certificate.evidence}</Text>
          </View>)}
          <Text style={styles.heading}>خبرات العمل والتدريب ({analysis.experiences.length})</Text>
          {!analysis.experiences.length ? <Text style={styles.note}>لم نجد خبرات عمل أو تدريب مذكورة بوضوح.</Text> : null}
          {analysis.experiences.map((experience, index) => <View key={index} style={styles.card}>
            {selection('اعتماد هذه الخبرة', includedExperiences.includes(index), () => toggle(includedExperiences, index, setIncludedExperiences))}
            {(['role', 'organization', 'dates', 'description'] as const).map(field => <TextInput key={field} accessibilityLabel={field === 'role' ? 'المسمى' : field === 'organization' ? 'الجهة' : field === 'dates' ? 'الفترة' : 'وصف الخبرة'} placeholder={field === 'role' ? 'المسمى' : field === 'organization' ? 'الجهة' : field === 'dates' ? 'الفترة إن وجدت' : 'وصف الخبرة'} placeholderTextColor="#617570" style={styles.input} multiline={field === 'description'} editable={!busy} value={experience[field]} onChangeText={value => setAnalysis({ ...analysis, experiences: analysis.experiences.map((item, i) => i === index ? { ...item, [field]: value } : item) })} />)}
            <Text style={styles.note}>من السيرة: {experience.evidence}</Text>
          </View>)}
          <Text style={styles.note}>المهارات المعتمدة المرتبطة بالقاموس تُضاف إلى اختياراتك السابقة. التعليم والشهادات والخبرات والمشاريع والأنشطة تُحفظ في ملف السيرة، ولا تدخل نسبة تغطية المهارات حاليًا.</Text>
          <Pressable accessibilityRole="button" style={[styles.button, busy && styles.disabled]} disabled={busy} onPress={() => void approve()}><Text style={styles.buttonText}>اعتماد المعلومات وحفظها</Text></Pressable>
        </> : null}
        {savedCv && !analysis ? <View style={styles.card}>
          <Text style={styles.heading}>آخر معلومات اعتمدتها</Text>
          <Text style={styles.note}>رفع ملف جديد لا يغيّر المعلومات المحفوظة حتى تعتمد نتيجته.</Text>
          <Text style={styles.text}>المهارات: {savedCv.skills.map(item => item.name).join('، ') || 'لا توجد'}</Text>
          {(['education', 'projects', 'activities'] as const).map(section => <Text key={section} style={styles.text}>
            {section === 'education' ? 'التعليم' : section === 'projects' ? 'المشاريع' : 'الأنشطة'}: {(savedCv[section] ?? []).map(item => [item.name, item.organization, item.dates, item.description].filter(Boolean).join(' — ')).join('\n') || 'لا توجد معلومات محفوظة'}
          </Text>)}
          <Text style={styles.text}>الشهادات: {savedCv.certificates.map(item => [item.name, item.issuer, item.date].filter(Boolean).join(' — ')).join('\n') || 'لا توجد'}</Text>
          <Text style={styles.text}>الخبرات: {savedCv.experiences.map(item => [item.role, item.organization, item.dates, item.description].filter(Boolean).join(' — ')).join('\n') || 'لا توجد'}</Text>
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F9F5' },
  content: { width: '100%', maxWidth: 650, alignSelf: 'center', padding: 24, paddingBottom: 60, gap: 20 },
  title: { color: '#12635E', fontSize: 28, fontWeight: '700', textAlign: 'right' },
  heading: { color: '#193C3B', fontSize: 20, fontWeight: '600', textAlign: 'right' },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDE6E0', padding: 22, borderRadius: 18, gap: 16 },
  text: { color: '#425F57', fontSize: 16, lineHeight: 28, textAlign: 'right' },
  note: { color: '#617570', fontSize: 14, lineHeight: 24, textAlign: 'right' },
  fileName: { color: '#193C3B', fontSize: 17, lineHeight: 26, textAlign: 'left' },
  link: { color: '#12635E', fontSize: 17, paddingVertical: 12, textAlign: 'right' },
  button: { backgroundColor: '#12635E', borderRadius: 14, minHeight: 48, padding: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  disabled: { opacity: 0.5 },
  error: { color: '#A33535', fontSize: 15, lineHeight: 25, textAlign: 'right' },
  input: { color: '#193C3B', borderWidth: 1, borderColor: '#DDE6E0', borderRadius: 12, padding: 12, minHeight: 48, fontSize: 16, textAlign: 'right', backgroundColor: '#F0F4F0' },
});

