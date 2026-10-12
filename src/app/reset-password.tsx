import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, ui } from '../constants/design';
import { useAuth } from '../contexts/auth-context';
import { supabase } from '../utils/supabase';
import { authErrorMessage } from '../utils/auth-errors';
import { authRedirectUrl } from '../utils/auth-redirect';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [stage, setStage] = useState<'send' | 'verify' | 'change' | 'done'>(auth.session ? 'change' : 'send');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  async function perform() {
    if (!supabase || locked.current) return;
    if (stage === 'send' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('أدخل بريدًا إلكترونيًا صالحًا.'); return; }
    if (stage === 'verify' && !/^\d{6,10}$/.test(token.trim())) { setError('أدخل الرمز الموجود في البريد.'); return; }
    if (stage === 'change' && (password.length < 8 || password !== confirmation)) { setError('استخدم 8 أحرف على الأقل وتأكد من تطابق كلمتي المرور.'); return; }
    locked.current = true; setBusy(true); setError('');
    try {
      if (stage === 'send') {
        const result = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: authRedirectUrl() });
        if (result.error) throw result.error;
        setStage('verify');
      } else if (stage === 'verify') {
        const result = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: token.trim(), type: 'recovery' });
        if (result.error) throw result.error;
        setToken(''); setStage('change');
      } else if (stage === 'change') {
        const result = await supabase.auth.updateUser({ password });
        if (result.error) throw result.error;
        setPassword(''); setConfirmation(''); auth.finishRecovery(); setStage('done');
      }
    } catch (failure) { setError(authErrorMessage(failure)); }
    finally { locked.current = false; setBusy(false); }
  }
  return <SafeAreaView style={ui.screen}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={ui.link}>العودة</Text></Pressable>
    <Text style={ui.title}>{stage === 'done' ? 'تم تحديث كلمة المرور.' : 'استعادة كلمة المرور'}</Text>
    {stage === 'send' && <><Text style={ui.text}>أدخل بريد حسابك لتصلك رسالة استعادة كلمة المرور.</Text><TextInput accessibilityLabel="البريد الإلكتروني" style={ui.input} placeholder="name@example.com" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} editable={!busy} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" maxLength={254} /></>}
    {stage === 'verify' && <><Text style={ui.text}>إذا كان البريد مرتبطًا بحساب، ستصلك رسالة. افتح رابط الاستعادة على الجهاز الذي طلبت منه الرسالة لفتح صفحة كلمة المرور الجديدة. إذا وصلك رمز بدل الرابط، أدخله هنا.</Text><TextInput accessibilityLabel="رمز استعادة كلمة المرور" style={ui.input} value={token} onChangeText={setToken} editable={!busy} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={10} placeholder="رمز الاستعادة إن وصل" placeholderTextColor={colors.muted} /><Pressable accessibilityRole="button" disabled={busy} onPress={() => { setStage('send'); setError(''); setToken(''); }}><Text style={ui.link}>طلب رسالة جديدة</Text></Pressable></>}
    {stage === 'change' && <><Text style={ui.note}>{auth.session?.user.email ?? ''}</Text><Text style={ui.text}>اختر كلمة مرور جديدة من 8 أحرف على الأقل.</Text><TextInput accessibilityLabel="كلمة المرور الجديدة" style={ui.input} value={password} onChangeText={setPassword} editable={!busy} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" maxLength={256} placeholder="كلمة المرور الجديدة" placeholderTextColor={colors.muted} /><TextInput accessibilityLabel="تأكيد كلمة المرور الجديدة" style={ui.input} value={confirmation} onChangeText={setConfirmation} editable={!busy} secureTextEntry autoCapitalize="none" autoCorrect={false} maxLength={256} placeholder="تأكيد كلمة المرور" placeholderTextColor={colors.muted} /></>}
    {error ? <Text accessibilityRole="alert" style={[ui.text, { color: colors.error }]}>{error}</Text> : null}
    {stage !== 'done' ? <Pressable accessibilityRole="button" disabled={busy || !auth.configured} accessibilityState={{ disabled: busy || !auth.configured }} style={[ui.button, (busy || !auth.configured) && ui.pressed]} onPress={() => void perform()}><Text style={ui.buttonText}>{busy ? 'جارٍ المتابعة…' : stage === 'send' ? 'إرسال رسالة الاستعادة' : stage === 'verify' ? 'تأكيد الرمز' : 'حفظ كلمة المرور'}</Text></Pressable> : <Pressable accessibilityRole="button" style={ui.button} onPress={() => router.replace('/home')}><Text style={ui.buttonText}>متابعة إلى مسارك</Text></Pressable>}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
