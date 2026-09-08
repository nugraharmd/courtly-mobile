import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchCities, fetchFacilities, fetchSports } from '../../src/api/courtly';
import { getApiErrorMessage } from '../../src/api/client';
import { FacilityCard } from '../../src/components/FacilityCard';
import { EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { theme } from '../../src/theme';

const PAGE_SIZE = 10;

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sport, setSport] = useState<string | undefined>();
  const [city, setCity] = useState<string | undefined>();

  const { data: sports } = useQuery({ queryKey: ['sports'], queryFn: fetchSports });
  const { data: cities } = useQuery({ queryKey: ['cities'], queryFn: fetchCities });

  const query = useInfiniteQuery({
    queryKey: ['facilities', debounced, sport, city],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchFacilities({ search: debounced || undefined, sport, city, page: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);

  return (
    <View style={styles.wrap}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.search}
          placeholder="Search padel, tennis…"
          placeholderTextColor={theme.colors.muted}
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            // lightweight debounce without extra deps
            clearTimeout((global as any).__courtlyT);
            (global as any).__courtlyT = setTimeout(() => setDebounced(t.trim()), 400);
          }}
          returnKeyType="search"
        />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip label="All sports" active={!sport} onPress={() => setSport(undefined)} />
          {(sports ?? []).map((s) => (
            <Chip key={s.id} label={s.name} active={sport === s.slug} onPress={() => setSport(sport === s.slug ? undefined : s.slug)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip label="All cities" active={!city} onPress={() => setCity(undefined)} />
          {(cities ?? []).map((c) => (
            <Chip key={c} label={c} active={city === c} onPress={() => setCity(city === c ? undefined : c)} />
          ))}
        </ScrollView>
      </View>

      {query.isPending ? <Loading label="Finding courts…" /> : null}
      {query.isError ? <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => query.refetch()} /> : null}
      {!query.isPending && !query.isError && items.length === 0 ? (
        <EmptyState message="No facilities match your filters." />
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <FacilityCard item={item} />}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={theme.colors.primary} />}
        ListFooterComponent={
          query.isFetchingNextPage ? <Loading label="Loading more…" /> : null
        }
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  searchBox: { padding: 12 },
  search: { backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: 12, padding: 13, borderWidth: 1, borderColor: theme.colors.border },
  chipRow: { gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.muted, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  list: { padding: 12, paddingBottom: 32 },
});
