import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MasarakBrand } from '../components/masarak-brand';
import { MasarakIcon } from '../components/masarak-icon';
import { colors, ui } from '../constants/design';
import { useAuth } from '../contexts/auth-context';
import { supabase } from '../utils/supabase';
import { authErrorMessage, validateAccount } from '../utils/auth-errors';
import { authRedirectUrl } from '../utils/auth-redirect';

export default function AccountScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const signup = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  const [verification, setVerification] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  useEffect(() => { if (auth.session) router.replace('/home'); }, [auth.session, router]);
  async function submit() {
    if (locked.current || !supabase) return;
    const problem = validateAccount(email, password, signup, name);
    if (problem) { setError(problem); return; }
    locked.current = true; setBusy(true); setError(''); setMessage('');
    try {
      if (signup) {
        const result = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { emailRedirectTo: authRedirectUrl(), data: { display_name: name.trim() } } });
        if (result.error) throw result.error;
        setPassword('');
        if (result.data.session) auth.completeLogin();
        else { setVerification(true); setMessage('راجع بريدك لتأكيد الحساب. إذا وصل رمز أدخله هنا؛ وإذا وصل رابط افتحه ثم ارجع لتسجيل الدخول.'); }
      } else {
        const result = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (result.error) throw result.error;
        setPassword('');
        auth.completeLogin();
      }
    } catch (failure) { setError(authErrorMessage(failure)); }
    finally { locked.current = false; setBusy(false); }
  }
  async function verify() {
    if (locked.current || !supabase) return;
    if (!/^\d{6,10}$/.test(token.trim())) { setError('أدخل رمز التأكيد الموجود في البريد.'); return; }
    locked.current = true; setBusy(true); setError('');
    try {
      const result = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: token.trim(), type: 'email' });
      if (result.error) throw result.error;
      setToken(''); auth.completeLogin();
    } catch (failure) { setError(authErrorMessage(failure)); }
    finally { locked.current = false; setBusy(false); }
  }
  async function resend() {
    if (locked.current || !supabase) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const result = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase(), options: { emailRedirectTo: authRedirectUrl() } });
      if (result.error) throw result.error;
      setMessage('إذا كان الحساب بحاجة للتأكيد، ستصلك رسالة جديدة. راجع البريد والرسائل غير المرغوبة.');
    } catch (failure) { setError(authErrorMessage(failure)); }
    finally { locked.current = false; setBusy(false); }
  }
  function switchMode() {
    setPassword(''); setToken(''); setVerification(false); setMessage(''); setError('');
    router.replace({ pathname: '/account', params: { mode: signup ? 'login' : 'signup' } });
  }
  return <SafeAreaView style={ui.screen}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" accessibilityLabel="العودة" disabled={busy} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.back}><MasarakIcon name="arrow" /></Pressable>
    <View style={styles.logo}><MasarakBrand large /></View>
    <Text style={ui.title}>{verification ? 'أكد بريدك الإلكتروني.' : signup ? 'ابدأ رحلتك معنا.' : 'أهلًا بعودتك.'}</Text>
    <Text style={ui.text}>{verification ? email.trim() : signup ? 'أنشئ حسابك وابدأ مسارك.' : 'سجّل الدخول إلى حسابك في مسارك.'}</Text>
    {!auth.configured && <Text style={styles.error}>تسجيل الحسابات غير متاح حاليًا. يمكنك المتابعة دون حساب.</Text>}
    {message ? <View style={styles.notice}><Text style={ui.text}>{message}</Text></View> : null}
    <View style={ui.card}>
      {verification ? <>
        <Text style={ui.note}>رمز تأكيد البريد</Text><TextInput accessibilityLabel="رمز تأكيد البريد" keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={10} style={ui.input} placeholder="رمز التأكيد" placeholderTextColor={colors.muted} value={token} editable={!busy} onChangeText={setToken} />
        <Pressable disabled={busy || !auth.configured} accessibilityRole="button" accessibilityState={{ disabled: busy || !auth.configured }} onPress={() => void verify()} style={[ui.button, busy && styles.disabled]}><Text style={ui.buttonText}>{busy ? 'جارٍ التأكيد…' : 'تأكيد البريد'}</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void resend()}><Text style={ui.link}>إعادة إرسال رسالة التأكيد</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={switchMode}><Text style={ui.link}>أكدت البريد بالرابط؟ تسجيل الدخول</Text></Pressable>
      </> : <>
        {signup && <><Text style={ui.note}>الاسم</Text><TextInput accessibilityLabel="الاسم" style={ui.input} value={name} onChangeText={setName} editable={!busy && auth.configured} placeholder="اسمك" placeholderTextColor={colors.muted} maxLength={80} textContentType="name" autoComplete="name" /></>}
        <Text style={ui.note}>البريد الإلكتروني</Text><TextInput accessibilityLabel="البريد الإلكتروني" style={[ui.input, styles.ltr]} value={email} onChangeText={setEmail} editable={!busy && auth.configured} placeholder="name@example.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" autoComplete="email" maxLength={254} />
        <Text style={ui.note}>كلمة المرور</Text><TextInput accessibilityLabel="كلمة المرور" style={[ui.input, styles.ltr]} value={password} onChangeText={setPassword} editable={!busy && auth.configured} placeholder={signup ? '8 أحرف على الأقل' : 'كلمة المرور'} placeholderTextColor={colors.muted} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} textContentType={signup ? 'newPassword' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} maxLength={256} />
        <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} onPress={() => setShowPassword(value => !value)}><Text style={ui.link}>{showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}</Text></Pressable>
        {!signup && <Pressable accessibilityRole="button" disabled={busy} onPress={() => router.push('/reset-password')}><Text style={ui.link}>نسيت كلمة المرور؟</Text></Pressable>}
        <Pressable disabled={busy || !auth.configured} accessibilityRole="button" accessibilityState={{ disabled: busy || !auth.configured }} onPress={() => void submit()} style={[ui.button, (busy || !auth.configured) && styles.disabled]}><Text style={ui.buttonText}>{busy ? 'جارٍ المتابعة…' : signup ? 'إنشاء حساب' : 'تسجيل الدخول'}</Text></Pressable>
      </>}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
    <Text style={ui.note}>تُرسل بيانات التسجيل إلى Supabase لإدارة الحساب. السيرة وخطة التعلم محفوظتان على هذا الجهاز؛ لكل حساب ملف مستقل عن وضع الضيف.</Text>
    <Pressable accessibilityRole="button" disabled={busy} style={ui.outline} onPress={() => router.replace('/home')}><Text style={ui.outlineText}>متابعة دون حساب</Text></Pressable>
    {!verification && <Pressable accessibilityRole="button" disabled={busy} onPress={switchMode}><Text style={styles.switch}>{signup ? 'لديك حساب؟ تسجيل الدخول' : 'جديد في مسارك؟ إنشاء حساب'}</Text></Pressable>}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({ content: { width: '100%', maxWidth: 460, alignSelf: 'center', flexGrow: 1, padding: 26, gap: 16 }, back: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' }, logo: { marginVertical: 12 }, notice: { backgroundColor: colors.mint, borderRadius: 16, padding: 16 }, disabled: { opacity: 0.5 }, ltr: { textAlign: 'left', writingDirection: 'ltr' }, error: { color: colors.error, fontSize: 14, lineHeight: 24, textAlign: 'right' }, switch: { color: colors.primary, fontSize: 14, textAlign: 'center', padding: 10 } });
