import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { fetchBookings } from '../../src/api/courtly';
import { getApiErrorMessage } from '../../src/api/client';
import { EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { Pagination } from '../../src/components/Pagination';
import { formatDateLabel, formatIDR, theme } from '../../src/utils';
import type { Booking, BookingFilter } from '../../src/types';

const PAGE_SIZE = 10;

const TABS: { key: BookingFilter; label: string }[] = [
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'PAST', label: 'Past' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function BookingsScreen() {
  const [tab, setTab] = useState<BookingFilter>('UPCOMING');
  const [page, setPage] = useState(1);

  const upcomingQ = useQuery({ queryKey: ['bookings', 'UPCOMING'], queryFn: () => fetchBookings('UPCOMING') });
  const pastQ = useQuery({ queryKey: ['bookings', 'PAST'], queryFn: () => fetchBookings('PAST') });
  const cancelledQ = useQuery({ queryKey: ['bookings', 'CANCELLED'], queryFn: () => fetchBookings('CANCELLED') });

  const byTab = { UPCOMING: upcomingQ, PAST: pastQ, CANCELLED: cancelledQ } as const;
  const q = byTab[tab];

  const counts: Record<BookingFilter, number> = {
    UPCOMING: upcomingQ.data?.length ?? 0,
    PAST: pastQ.data?.length ?? 0,
    CANCELLED: cancelledQ.data?.length ?? 0,
  };

  const all = useMemo(() => q.data ?? [], [q.data]);
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => all.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [all, safePage],
  );

  function switchTab(next: BookingFilter) {
    if (next === tab) return;
    void Haptics.selectionAsync();
    setTab(next);
    setPage(1);
  }

  function refetchAll() {
    void upcomingQ.refetch();
    void pastQ.refetch();
    void cancelledQ.refetch();
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => switchTab(t.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              <View style={[styles.count, active && styles.countActive]}>
                <Text style={[styles.countText, active && styles.countTextActive]}>
                  {counts[t.key]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {q.isPending ? <Loading label="Loading bookings…" /> : null}
      {q.isError ? <ErrorState message={getApiErrorMessage(q.error)} onRetry={() => q.refetch()} /> : null}
      {!q.isPending && !q.isError && all.length === 0 ? (
        <EmptyState message={`No ${tab.toLowerCase()} bookings yet.`} />
      ) : null}

      <FlatList
        data={paged}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={refetchAll} tintColor={theme.colors.primary} />}
        renderItem={({ item }) => <BookingRow booking={item} />}
        ListFooterComponent={
          !q.isPending && !q.isError && all.length > 0 ? (
            <Pagination page={safePage} totalPages={totalPages} total={all.length} onChange={setPage} />
          ) : null
        }
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
  tab: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 10, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', gap: 6 },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { color: theme.colors.muted, fontWeight: '800', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  count: { minWidth: 22, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: '#F1F5F9', alignItems: 'center' },
  countActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countText: { color: theme.colors.text, fontWeight: '800', fontSize: 12 },
  countTextActive: { color: '#fff' },
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
