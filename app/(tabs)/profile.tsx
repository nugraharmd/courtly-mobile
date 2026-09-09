import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/auth-store';
import { theme } from '../../src/utils';

export default function ProfileScreen() {
  const { user, signOut, isLoading } = useAuthStore();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
    } finally {
      setLoggingOut(false);
      setDialogVisible(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? 'C').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? '—'}</Text>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>
      </LinearGradient>
      <View style={styles.body}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{user?.name ?? '—'}</Text>
          <View style={styles.divider} />
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email ?? '—'}</Text>
        </View>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            setDialogVisible(true);
          }}
          style={styles.outBtn}
        >
          <Text style={styles.outIcon}>⏻</Text>
          <Text style={styles.outText}>Log out</Text>
        </Pressable>
      </View>

      <Modal visible={dialogVisible} transparent animationType="fade" onRequestClose={() => setDialogVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <View style={styles.dialogIconWrap}>
              <Text style={styles.dialogIcon}>👋</Text>
            </View>
            <Text style={styles.dialogTitle}>Log out of Courtly?</Text>
            <Text style={styles.dialogMsg}>
              You&apos;ll need to log back in to browse courts and manage your bookings.
            </Text>
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setDialogVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleLogout()}
                disabled={loggingOut || isLoading}
                style={[styles.logoutBtn, (loggingOut || isLoading) && styles.logoutBtnDisabled]}
              >
                <Text style={styles.logoutText}>{loggingOut ? 'Logging out…' : 'Log out'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  hero: { alignItems: 'center', paddingVertical: 36, gap: 4, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  name: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  email: { color: 'rgba(255,255,255,0.85)' },
  body: { padding: 16, gap: 14 },
  infoCard: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
  infoLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  infoValue: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: 2, marginBottom: 8 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 8 },
  outBtn: { flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: theme.colors.danger, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center' },
  outIcon: { color: theme.colors.danger, fontSize: 16, fontWeight: '800' },
  outText: { color: theme.colors.danger, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 20, padding: 22, alignItems: 'center', shadowColor: '#0F172A', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  dialogIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dialogIcon: { fontSize: 26 },
  dialogTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  dialogMsg: { color: theme.colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  dialogActions: { flexDirection: 'row', gap: 10, marginTop: 18, width: '100%' },
  cancelBtn: { flex: 1, borderRadius: 12, padding: 13, alignItems: 'center', backgroundColor: '#F1F5F9' },
  cancelText: { color: theme.colors.text, fontWeight: '800' },
  logoutBtn: { flex: 1, borderRadius: 12, padding: 13, alignItems: 'center', backgroundColor: theme.colors.danger },
  logoutBtnDisabled: { opacity: 0.6 },
  logoutText: { color: '#fff', fontWeight: '800' },
});
