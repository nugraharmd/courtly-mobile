import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/auth-store';
import { theme } from '../../src/theme';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

type Form = z.infer<typeof schema>;

export default function LoginScreen() {
  const { signIn, isLoading, error } = useAuthStore();
  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (v: Form) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signIn(v.email.trim(), v.password);
  };

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#15803D', '#0B1220']} style={styles.hero}>
        <Text style={styles.logo}>Courtly</Text>
        <Text style={styles.tagline}>Book padel, tennis & more in seconds.</Text>
      </LinearGradient>
      <View style={styles.form}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.sub}>Log in to browse courts and manage bookings.</Text>

        <Text style={styles.label}>Email</Text>
        <Controller
          control={control} name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input} placeholder="jane@example.com" placeholderTextColor={theme.colors.muted}
              autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange}
            />
          )}
        />
        {errors.email ? <Text style={styles.err}>{errors.email.message}</Text> : null}

        <Text style={styles.label}>Password</Text>
        <Controller
          control={control} name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input} placeholder="••••••••" placeholderTextColor={theme.colors.muted}
              secureTextEntry value={value} onChangeText={onChange}
            />
          )}
        />
        {errors.password ? <Text style={styles.err}>{errors.password.message}</Text> : null}
        {error ? <Text style={styles.err}>{error}</Text> : null}

        <Pressable onPress={handleSubmit(onSubmit)} disabled={isLoading} style={styles.btnWrap}>
          <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.btn}>
            <Text style={styles.btnText}>{isLoading ? 'Logging in…' : 'Log in'}</Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.switchRow}>
          No account? <Link href="/(auth)/register" style={styles.link}>Sign up</Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  hero: { paddingTop: 72, paddingBottom: 36, paddingHorizontal: 24 },
  logo: { color: '#fff', fontSize: 40, fontWeight: '900' },
  tagline: { color: 'rgba(255,255,255,0.85)', marginTop: 6, fontSize: 15 },
  form: { padding: 20, gap: 4 },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  sub: { color: theme.colors.muted, marginBottom: 12 },
  label: { color: theme.colors.text, fontWeight: '700', marginTop: 10 },
  input: {
    backgroundColor: theme.colors.surface, color: theme.colors.text,
    borderRadius: theme.radius.md, padding: 14, marginTop: 6,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  err: { color: theme.colors.danger, marginTop: 4 },
  btnWrap: { marginTop: 18 },
  btn: { borderRadius: theme.radius.md, padding: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  switchRow: { color: theme.colors.muted, textAlign: 'center', marginTop: 16 },
  link: { color: theme.colors.primary, fontWeight: '800' },
});
