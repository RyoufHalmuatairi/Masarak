import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuth } from '../contexts/auth-context';
import { useCloud } from '../contexts/cloud-context';
import { colors, ui } from '../constants/design';

export function CloudCard() {
  const auth = useAuth(); const cloud = useCloud();
  if (!auth.session) return <View style={ui.card}><Text style={ui.heading}>حفظ ملفي</Text><Text style={ui.text}>ملف الضيف محفوظ على هذا الجهاز. سجّل الدخول لتفعيل نسخة خاصة بحسابك في السحابة.</Text></View>;
  const enabled = cloud.enabled;
  return <View style={ui.card}>
    <Text style={ui.heading}>الحفظ السحابي</Text>
    <Text style={ui.text}>نحفظ بيانات ملفك ومهاراتك وخطتك وملف السيرة في Supabase بصلاحيات خاصة بحسابك، لتسترجعها من جهاز آخر. بيانات الضيف لا تُرفع تلقائيًا.</Text>
    {cloud.busy ? <><ActivityIndicator color={colors.primary} /><Text style={ui.note}>جارٍ مزامنة ملفك…</Text></> : <Text style={ui.note}>{cloud.status === 'synced' ? 'نسخة ملفك متزامنة مع السحابة.' : cloud.status === 'paused' ? 'المزامنة متوقفة على هذا الجهاز؛ النسخة السابقة تبقى في السحابة.' : cloud.status === 'conflict' ? 'يوجد اختلاف بين نسخة الجهاز والسحابة. اختر النسخة التي تريد الاحتفاظ بها؛ الاختيار يستبدل النسخة الأخرى.' : cloud.status === 'removed' ? 'النسخة السحابية لم تعد موجودة. احتفظنا ببيانات جهازك؛ فعّل الحفظ مجددًا إذا أردت رفعها.' : cloud.status === 'pending' ? 'بيانات الجهاز محفوظة، وهناك تحديث يحتاج إلى مزامنة.' : 'الحفظ الحالي على الجهاز فقط. يمكنك تفعيل الحفظ السحابي الآن.'}</Text>}
    {!!cloud.lastSynced && <Text style={ui.note}>آخر مزامنة: {new Date(cloud.lastSynced).toLocaleString('ar-SA')}</Text>}
    {!!cloud.error && <Text style={[ui.text, { color: colors.error }]} accessibilityRole="alert">{cloud.error}</Text>}
    {cloud.status === 'conflict' ? <>
      <Pressable disabled={cloud.busy} accessibilityRole="button" style={ui.outline} onPress={() => void cloud.synchronize('cloud')}><Text style={ui.outlineText}>استخدام نسخة السحابة على هذا الجهاز</Text></Pressable>
      <Pressable disabled={cloud.busy} accessibilityRole="button" style={ui.outline} onPress={() => void cloud.synchronize('local', true)}><Text style={ui.outlineText}>رفع نسخة هذا الجهاز بدل نسخة السحابة</Text></Pressable>
    </> : <Pressable disabled={cloud.busy} accessibilityRole="button" style={ui.button} onPress={() => void cloud.synchronize('auto', !enabled)}><Text style={ui.buttonText}>{enabled ? 'مزامنة الآن' : 'تفعيل الحفظ السحابي'}</Text></Pressable>}
    {enabled && <Pressable disabled={cloud.busy} accessibilityRole="button" onPress={() => void cloud.pause()}><Text style={ui.link}>إيقاف المزامنة على هذا الجهاز</Text></Pressable>}
  </View>;
}
