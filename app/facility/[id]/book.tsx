import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { createBooking, fetchAvailability } from '../../../src/api/courtly';
import { getApiErrorMessage } from '../../../src/api/client';
import { ErrorState, Loading } from '../../../src/components/ui';
import { formatIDR, nextDays, theme, toISODate, toMinutes } from '../../../src/utils';

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const days = useMemo(() => nextDays(14), []);
  const [date, setDate] = useState(toISODate(days[0]));
  const [courtId, setCourtId] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['availability', id, date],
    queryFn: () => fetchAvailability(id!, date),
    enabled: !!id,
  });

  const selectedCourt = q.data?.courts.find((c) => c.id === courtId);
  const selectedSlots = useMemo(() => {
    if (!selectedCourt || !start || !end) return [];
    return selectedCourt.slots.filter((s) => toMinutes(s.startTime) >= toMinutes(start) && toMinutes(s.endTime) <= toMinutes(end));
  }, [selectedCourt, start, end]);
  const total = selectedSlots.reduce((sum, s) => sum + s.price, 0);

  function tapSlot(cId: string, startTime: string, endTime: string, available: boolean) {
    if (!available) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    void Haptics.selectionAsync();
    const court = q.data?.courts.find((c) => c.id === cId);
    if (!court) return;
    // switching court resets selection
    if (courtId !== cId) {
      setCourtId(cId);
      setStart(startTime);
      setEnd(endTime);
      return;
    }
    if (!start || !end) {
      setStart(startTime);
      setEnd(endTime);
      return;
    }
    if (startTime === start && endTime === end) {
      setStart(null);
      setEnd(null);
      return;
    }
    // expand / contract consecutively: range from min(start) to max(end)
    const newStart = toMinutes(startTime) < toMinutes(start) ? startTime : start;
    const newEnd = toMinutes(endTime) > toMinutes(end) ? endTime : end;
    const inRange = court.slots.filter(
      (s) => toMinutes(s.startTime) >= toMinutes(newStart) && toMinutes(s.endTime) <= toMinutes(newEnd),
    );
    const blocked = inRange.some((s) => !s.available);
    if (blocked) {
      // restart selection from tapped slot when range crosses a booked hour
      setStart(startTime);
      setEnd(endTime);
    } else {
      setStart(newStart);
      setEnd(newEnd);
    }
  }

  const mutation = useMutation({
    mutationFn: () => createBooking({ courtId: courtId!, date, startTime: start!, endTime: end! }),
    onSuccess: (booking) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void qc.invalidateQueries({ queryKey: ['bookings'] });
      void qc.invalidateQueries({ queryKey: ['availability'] });
      Alert.alert('Booked!', `Reference: ${booking.bookingReference}`, [
        { text: 'View booking', onPress: () => router.replace(`/booking/${booking.id}`) },
      ]);
      setStart(null);
      setEnd(null);
    },
    onError: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
        {days.map((d) => {
          const iso = toISODate(d);
          const active = iso === date;
          return (
            <Pressable
              key={iso}
              onPress={() => {
                setDate(iso);
                setCourtId(null);
                setStart(null);
                setEnd(null);
              }}
              style={[styles.day, active && styles.dayActive]}
            >
              <Text style={[styles.dayDow, active && styles.dayTextActive]}>
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[styles.dayNum, active && styles.dayTextActive]}>{d.getDate()}</Text>
              <Text style={[styles.dayMon, active && styles.dayTextActive]}>
                {d.toLocaleDateString('en-US', { month: 'short' })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={styles.hint}>07:00–22:00 · tap consecutive hours on the same court</Text>

      {q.isPending ? <Loading label="Checking availability…" /> : null}
      {q.isError ? <ErrorState message={getApiErrorMessage(q.error)} onRetry={() => q.refetch()} /> : null}

      <ScrollView contentContainerStyle={styles.scroll}>
        {(q.data?.courts ?? []).map((court) => (
          <View key={court.id} style={styles.courtCard}>
            <View style={styles.courtHead}>
              <Text style={styles.courtName}>{court.name}</Text>
              <Text style={styles.courtMeta}>{court.type}{court.indoor ? ' · Indoor' : ''}</Text>
            </View>
            <View style={styles.slots}>
              {court.slots.map((s) => {
                const isSel =
                  court.id === courtId && start && end &&
                  toMinutes(s.startTime) >= toMinutes(start) && toMinutes(s.endTime) <= toMinutes(end);
                return (
                  <Pressable
                    key={s.startTime}
                    onPress={() => tapSlot(court.id, s.startTime, s.endTime, s.available)}
                    style={[styles.slot, !s.available && styles.slotBooked, isSel && styles.slotSel]}
                  >
                    <Text style={[styles.slotTime, isSel && styles.slotSelText]}>{s.startTime}</Text>
                    <Text style={[styles.slotPrice, !s.available && styles.slotBookedText, isSel && styles.slotSelText]}>
                      {s.available ? formatIDR(s.price) : 'Booked'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.sumLabel}>
            {selectedSlots.length > 0 && selectedCourt
              ? `${selectedCourt.name} · ${start}–${end} · ${selectedSlots.length}h`
              : 'No slots selected'}
          </Text>
          <Text style={styles.sumTotal}>{selectedSlots.length > 0 ? formatIDR(total) : '—'}</Text>
        </View>
        <Pressable
          disabled={!courtId || !start || !end || mutation.isPending}
          onPress={() => mutation.mutate()}
          style={{ opacity: !courtId || !start || !end ? 0.5 : 1 }}
        >
          <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.bookBtn}>
            <Text style={styles.bookText}>{mutation.isPending ? 'Booking…' : 'Book now'}</Text>
          </LinearGradient>
        </Pressable>
      </View>
      {mutation.isError ? (
        <Text style={styles.mutErr}>{getApiErrorMessage(mutation.error)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  days: { gap: 8, padding: 12 },
  day: { width: 62, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  dayActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  dayDow: { color: theme.colors.muted, fontSize: 12, fontWeight: '700' },
  dayNum: { color: theme.colors.text, fontSize: 18, fontWeight: '900' },
  dayMon: { color: theme.colors.muted, fontSize: 12 },
  dayTextActive: { color: '#fff' },
  hint: { color: theme.colors.muted, paddingHorizontal: 14, paddingBottom: 6, fontSize: 12 },
  scroll: { padding: 12, paddingBottom: 130, gap: 12 },
  courtCard: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: theme.colors.border },
  courtHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  courtName: { color: theme.colors.text, fontWeight: '800', fontSize: 15 },
  courtMeta: { color: theme.colors.muted, fontSize: 12 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { width: '31%', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingVertical: 8, alignItems: 'center', gap: 2 },
  slotBooked: { opacity: 0.45 },
  slotSel: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  slotTime: { color: theme.colors.text, fontWeight: '800', fontSize: 13 },
  slotPrice: { color: theme.colors.muted, fontSize: 11 },
  slotBookedText: { color: theme.colors.danger },
  slotSelText: { color: '#fff' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.97)', borderTopWidth: 1, borderTopColor: theme.colors.border },
  sumLabel: { color: theme.colors.muted, fontSize: 12 },
  sumTotal: { color: theme.colors.text, fontWeight: '900', fontSize: 18 },
  bookBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  bookText: { color: '#fff', fontWeight: '800' },
  mutErr: { position: 'absolute', bottom: 92, left: 16, right: 16, color: theme.colors.danger, textAlign: 'center' },
});
