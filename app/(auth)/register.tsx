import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/auth-store';
import { theme } from '../../src/utils';

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Minimum 8 characters').regex(/[A-Z]/, 'Needs an uppercase letter').regex(/[0-9]/, 'Needs a number'),
});

type Form = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { signUp, isLoading, error } = useAuthStore();
  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (v: Form) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await signUp(v.name.trim(), v.email.trim(), v.password);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.logo}>Courtly</Text>
        <Text style={styles.tagline}>Create an account to start booking courts.</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="Jane Doe" placeholderTextColor={theme.colors.muted} value={value} onChangeText={onChange} />
        )} />
        {errors.name ? <Text style={styles.err}>{errors.name.message}</Text> : null}

        <Text style={styles.label}>Email</Text>
        <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="jane@example.com" placeholderTextColor={theme.colors.muted} autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange} />
        )} />
        {errors.email ? <Text style={styles.err}>{errors.email.message}</Text> : null}

        <Text style={styles.label}>Password</Text>
        <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="Password123!" placeholderTextColor={theme.colors.muted} secureTextEntry value={value} onChangeText={onChange} />
        )} />
        {errors.password ? <Text style={styles.err}>{errors.password.message}</Text> : null}
        {error ? <Text style={styles.err}>{error}</Text> : null}

        <Pressable onPress={handleSubmit(onSubmit)} disabled={isLoading} style={styles.btnWrap}>
          <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.btn}>
            <Text style={styles.btnText}>{isLoading ? 'Creating…' : 'Sign up'}</Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.switchRow}>
          Have an account? <Link href="/(auth)/login" style={styles.link}>Log in</Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg, paddingTop: 64 },
  header: { paddingHorizontal: 24, marginBottom: 8 },
  logo: { color: '#fff', fontSize: 34, fontWeight: '900' },
  tagline: { color: theme.colors.muted, marginTop: 4 },
  form: { padding: 20 },
  label: { color: theme.colors.text, fontWeight: '700', marginTop: 10 },
  input: { backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: theme.radius.md, padding: 14, marginTop: 6, borderWidth: 1, borderColor: theme.colors.border },
  err: { color: theme.colors.danger, marginTop: 4 },
  btnWrap: { marginTop: 18 },
  btn: { borderRadius: theme.radius.md, padding: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  switchRow: { color: theme.colors.muted, textAlign: 'center', marginTop: 16 },
  link: { color: theme.colors.primary, fontWeight: '800' },
});
