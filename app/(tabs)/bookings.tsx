import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fetchBookings } from '../../src/api/courtly';
import { getApiErrorMessage } from '../../src/api/client';
import { EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { formatDateLabel, formatIDR, theme } from '../../src/theme';
import type { Booking, BookingFilter } from '../../src/types';

const TABS: { key: BookingFilter; label: string }[] = [
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'PAST', label: 'Past' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function BookingsScreen() {
  const [tab, setTab] = useState<BookingFilter>('UPCOMING');
  const q = useQuery({ queryKey: ['bookings', tab], queryFn: () => fetchBookings(tab) });

  return (
    <View style={styles.wrap}>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => {
              void Haptics.selectionAsync();
              setTab(t.key);
            }}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {q.isPending ? <Loading label="Loading bookings…" /> : null}
      {q.isError ? <ErrorState message={getApiErrorMessage(q.error)} onRetry={() => q.refetch()} /> : null}
      {!q.isPending && !q.isError && (q.data ?? []).length === 0 ? (
        <EmptyState message={`No ${tab.toLowerCase()} bookings yet.`} />
      ) : null}

      <FlatList
        data={q.data ?? []}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={theme.colors.primary} />}
        renderItem={({ item }) => <BookingRow booking={item} />}
      />
    </View>
  );
}

function BookingRow({ booking: b }: { booking: Booking }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => {
        void Haptics.selectionAsync();
        router.push(`/booking/${b.id}`);
      }}
    >
      <View style={styles.top}>
        <Text style={styles.ref}>{b.bookingReference}</Text>
        <StatusPill status={b.status} />
      </View>
      <Text style={styles.facility}>{b.facility.name} · {b.court.name}</Text>
      <Text style={styles.meta}>{formatDateLabel(b.date)} · {b.startTime}–{b.endTime}</Text>
      <Text style={styles.total}>{formatIDR(b.totalPrice)}</Text>
    </Pressable>
  );
}

export function StatusPill({ status }: { status: Booking['status'] }) {
  const color =
    status === 'CONFIRMED' ? theme.colors.success : status === 'COMPLETED' ? theme.colors.accent : theme.colors.danger;
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillText, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  tabs: { flexDirection: 'row', gap: 8, padding: 12 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.colors.surface, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { color: theme.colors.muted, fontWeight: '800' },
  tabTextActive: { color: '#fff' },
  list: { padding: 12, gap: 10, paddingBottom: 32 },
  card: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { color: theme.colors.muted, fontWeight: '700', fontSize: 12 },
  facility: { color: theme.colors.text, fontWeight: '800', fontSize: 15, marginTop: 4 },
  meta: { color: theme.colors.muted, marginTop: 2 },
  total: { color: theme.colors.primary, fontWeight: '800', marginTop: 6 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 11, fontWeight: '800' },
});
