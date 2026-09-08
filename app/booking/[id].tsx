import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Calendar from 'expo-calendar';
import { cancelBooking, fetchBookingDetail } from '../../src/api/courtly';
import { getApiErrorMessage } from '../../src/api/client';
import { ErrorState, Loading } from '../../src/components/ui';
import { StatusPill } from '../(tabs)/bookings';
import { formatDateLabel, formatIDR, theme } from '../../src/utils';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['booking', id], queryFn: () => fetchBookingDetail(id!), enabled: !!id });

  const cancel = useMutation({
    mutationFn: () => cancelBooking(id!),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      void qc.invalidateQueries({ queryKey: ['bookings'] });
      void qc.invalidateQueries({ queryKey: ['booking', id] });
      Alert.alert('Cancelled', 'Your booking has been cancelled.');
    },
  });

  async function addToCalendar() {
    const b = q.data;
    if (!b) return;
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow calendar access to save this booking.');
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const writable = calendars.find((c) => c.allowsModifications);
      const calendarId =
        writable?.id ?? (await Calendar.getDefaultCalendarAsync()).id;
      const start = new Date(`${b.date}T${b.startTime}:00`);
      const end = new Date(`${b.date}T${b.endTime}:00`);
      await Calendar.createEventAsync(calendarId, {
        title: `Courtly: ${b.facility.name} (${b.court.name})`,
        location: b.facility.name,
        startDate: start,
        endDate: end,
        notes: `Booking ref ${b.bookingReference}`,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Booking added to your device calendar.');
    } catch (e) {
      Alert.alert('Could not save', getApiErrorMessage(e));
    }
  }

  if (q.isPending) return <Loading label="Loading booking…" />;
  if (q.isError || !q.data) return <ErrorState message={getApiErrorMessage(q.error)} onRetry={() => q.refetch()} />;
  const b = q.data;
  const cancellable = b.status === 'CONFIRMED';

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <View style={styles.top}>
          <Text style={styles.ref}>{b.bookingReference}</Text>
          <StatusPill status={b.status} />
        </View>
        <Text style={styles.facility}>{b.facility.name}</Text>
        <Text style={styles.court}>{b.court.name}</Text>
        <Row label="Date" value={formatDateLabel(b.date)} />
        <Row label="Time" value={`${b.startTime} – ${b.endTime}`} />
        <Row label="Price" value={formatIDR(b.price)} />
        <Row label="Service fee" value={formatIDR(b.serviceFee)} />
        <Row label="Total" value={formatIDR(b.totalPrice)} strong />
      </View>

      <Pressable onPress={addToCalendar} style={styles.btnWrap}>
        <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.btn}>
          <Text style={styles.btnText}>Add to calendar</Text>
        </LinearGradient>
      </Pressable>

      {cancellable ? (
        <Pressable
          onPress={() =>
            Alert.alert('Cancel booking?', `Cancel ${b.bookingReference}?`, [
              { text: 'Keep', style: 'cancel' },
              { text: 'Cancel booking', style: 'destructive', onPress: () => cancel.mutate() },
            ])
          }
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelText}>{cancel.isPending ? 'Cancelling…' : 'Cancel booking'}</Text>
        </Pressable>
      ) : null}
      {cancel.isError ? <Text style={styles.err}>{getApiErrorMessage(cancel.error)}</Text> : null}
    </ScrollView>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { padding: 16, gap: 14 },
  card: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border, gap: 4 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { color: theme.colors.muted, fontWeight: '700' },
  facility: { color: theme.colors.text, fontSize: 20, fontWeight: '900', marginTop: 6 },
  court: { color: theme.colors.muted, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
  label: { color: theme.colors.muted },
  value: { color: theme.colors.text, fontWeight: '600' },
  strong: { color: theme.colors.primary, fontWeight: '900' },
  btnWrap: { marginTop: 4 },
  btn: { borderRadius: 14, padding: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancelBtn: { borderWidth: 1, borderColor: theme.colors.danger, borderRadius: 14, padding: 15, alignItems: 'center' },
  cancelText: { color: theme.colors.danger, fontWeight: '800' },
  err: { color: theme.colors.danger, textAlign: 'center' },
});
