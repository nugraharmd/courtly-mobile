import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/auth-store';
import { theme } from '../../src/utils';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  function confirmLogout() {
    Alert.alert('Log out?', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void signOut() },
    ]);
  }
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#15803D', '#0B1220']} style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? 'C').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? '—'}</Text>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>
      </LinearGradient>
      <View style={styles.body}>
        <Pressable onPress={confirmLogout} style={styles.outBtn}>
          <Text style={styles.outText}>Log out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  hero: { alignItems: 'center', paddingVertical: 36, gap: 4 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  name: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  email: { color: 'rgba(255,255,255,0.75)' },
  body: { padding: 16 },
  outBtn: { borderWidth: 1, borderColor: theme.colors.danger, borderRadius: 12, padding: 14, alignItems: 'center' },
  outText: { color: theme.colors.danger, fontWeight: '800' },
});
