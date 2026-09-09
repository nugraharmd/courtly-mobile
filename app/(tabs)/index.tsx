import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchCities, fetchFacilities, fetchSports } from '../../src/api/courtly';
import { getApiErrorMessage } from '../../src/api/client';
import { FacilityCard } from '../../src/components/FacilityCard';
import { Pagination } from '../../src/components/Pagination';
import { EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { useAuthStore } from '../../src/store/auth-store';
import { theme } from '../../src/utils';

const PAGE_SIZE = 10;

export default function ExploreScreen() {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sport, setSport] = useState<string | undefined>();
  const [city, setCity] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [cityOpen, setCityOpen] = useState(false);

  const { data: sports } = useQuery({ queryKey: ['sports'], queryFn: fetchSports });
  const { data: cities } = useQuery({ queryKey: ['cities'], queryFn: fetchCities });

  const query = useQuery({
    queryKey: ['facilities', debounced, sport, city, page],
    queryFn: () =>
      fetchFacilities({ search: debounced || undefined, sport, city, page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  // Reset to first page whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [debounced, sport, city]);

  const items = query.data?.data ?? [];
  const total = query.data?.pagination.total ?? items.length;
  const totalPages = query.data?.pagination.totalPages ?? 1;

  const cityLabel = city ?? 'All cities';

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greet}>Hi, {user?.name ?? 'Player'} 👋</Text>
          <Text style={styles.sub}>Find and book your court</Text>
        </View>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {(user?.name ?? 'C').charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search by city or sport type"
          placeholderTextColor={theme.colors.muted}
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            // lightweight debounce without extra deps
            clearTimeout((globalThis as any).__courtlyT);
            (globalThis as any).__courtlyT = setTimeout(() => setDebounced(t.trim()), 400);
          }}
          returnKeyType="search"
        />
        <Pressable onPress={() => setCityOpen(true)} style={styles.cityBtn}>
          <Text style={styles.cityIcon}>📍</Text>
          <Text style={styles.cityText} numberOfLines={1}>{cityLabel}</Text>
          <Text style={styles.cityChevron}>▾</Text>
        </Pressable>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip label="All sports" active={!sport} onPress={() => setSport(undefined)} />
          {(sports ?? []).map((s) => (
            <Chip key={s.id} label={s.name} active={sport === s.slug} onPress={() => setSport(sport === s.slug ? undefined : s.slug)} />
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
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={theme.colors.primary} />}
        ListFooterComponent={
          !query.isPending && !query.isError && items.length > 0 ? (
            <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
          ) : null
        }
      />

      <Modal visible={cityOpen} transparent animationType="fade" onRequestClose={() => setCityOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setCityOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Filter by city</Text>
            <ScrollView style={styles.sheetList}>
              <CityOption
                label="All cities"
                active={!city}
                onPress={() => {
                  setCity(undefined);
                  setCityOpen(false);
                }}
              />
              {(cities ?? []).map((c) => (
                <CityOption
                  key={c}
                  label={c}
                  active={city === c}
                  onPress={() => {
                    setCity(city === c ? undefined : c);
                    setCityOpen(false);
                  }}
                />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function CityOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.cityOption, active && styles.cityOptionActive]}>
      <Text style={[styles.cityOptionText, active && styles.cityOptionTextActive]}>{label}</Text>
      {active ? <Text style={styles.cityOptionCheck}>✓</Text> : null}
    </Pressable>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  headerLeft: { flex: 1 },
  greet: { color: theme.colors.text, fontSize: 19, fontWeight: '900' },
  sub: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  searchRow: { flexDirection: 'row', gap: 8, padding: 12, alignItems: 'center' },
  search: { flex: 1, backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: 12, padding: 13, borderWidth: 1, borderColor: theme.colors.border },
  cityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 13, maxWidth: 150 },
  cityIcon: { fontSize: 14 },
  cityText: { color: theme.colors.text, fontWeight: '700', fontSize: 13, flexShrink: 1 },
  cityChevron: { color: theme.colors.muted, fontWeight: '800' },
  chipRow: { gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.muted, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  list: { padding: 12, paddingBottom: 32 },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '70%' },
  sheetTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 16, marginBottom: 8 },
  sheetList: { gap: 4 },
  cityOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  cityOptionActive: { backgroundColor: '#F0FDF4' },
  cityOptionText: { color: theme.colors.text, fontWeight: '600' },
  cityOptionTextActive: { color: theme.colors.primary, fontWeight: '800' },
  cityOptionCheck: { color: theme.colors.primary, fontWeight: '900' },
});
