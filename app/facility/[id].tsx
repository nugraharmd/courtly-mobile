import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { fetchFacilityDetail } from '../../src/api/courtly';
import { getApiErrorMessage } from '../../src/api/client';
import { ErrorState, Loading } from '../../src/components/ui';
import { BackButton } from '../../src/components/BackButton';
import { formatIDR, theme } from '../../src/utils';

export default function FacilityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery({ queryKey: ['facility', id], queryFn: () => fetchFacilityDetail(id!), enabled: !!id });

  if (q.isPending) return <Loading label="Loading facility…" />;
  if (q.isError || !q.data) return <ErrorState message={getApiErrorMessage(q.error)} onRetry={() => q.refetch()} />;
  const f = q.data;
  const description =
    typeof f.description === 'string' && f.description.trim() !== '' ? f.description : '-';

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: f.imageUrl }} style={styles.image} contentFit="cover" />
          <BackButton style={styles.backBtn} />
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>{f.name}</Text>
          <Text style={styles.addr}>{f.address}</Text>
          <Text style={styles.rating}>★ {f.rating.toFixed(1)} · {f.reviewCount} reviews</Text>
          <Text style={styles.desc}>{description}</Text>

          <Text style={styles.h}>Sports</Text>
          <View style={styles.row}>
            {f.sports.map((s) => (
              <View key={s} style={styles.chip}><Text style={styles.chipText}>{s}</Text></View>
            ))}
          </View>

          <Text style={styles.h}>Amenities</Text>
          <View style={styles.row}>
            {f.amenities.map((a) => (
              <View key={a} style={[styles.chip, styles.chipGhost]}><Text style={styles.chipGhostText}>{a}</Text></View>
            ))}
          </View>

          <Text style={styles.h}>Courts & pricing</Text>
          {f.courts.map((c) => (
            <View key={c.id} style={styles.court}>
              <View>
                <Text style={styles.courtName}>{c.name}</Text>
                <Text style={styles.courtMeta}>{c.sport} · {c.type}{c.indoor ? ' · Indoor' : ''}</Text>
              </View>
              <Text style={styles.price}>{formatIDR(c.basePrice)}/hr</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/facility/${f.id}/book`);
          }}
        >
          <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.cta}>
            <Text style={styles.ctaText}>Check availability & book</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: { paddingBottom: 100 },
  imageWrap: { position: 'relative' },
  backBtn: { position: 'absolute', top: 48, left: 16 },
  image: { width: '100%', height: 230, backgroundColor: theme.colors.surface },
  body: { padding: 16, gap: 6 },
  name: { color: theme.colors.text, fontSize: 22, fontWeight: '900' },
  addr: { color: theme.colors.muted },
  rating: { color: theme.colors.warning, fontWeight: '700' },
  desc: { color: theme.colors.text, lineHeight: 21, marginTop: 8 },
  h: { color: theme.colors.text, fontWeight: '800', fontSize: 16, marginTop: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { backgroundColor: 'rgba(56,189,248,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { color: theme.colors.accent, fontWeight: '700', textTransform: 'capitalize' },
  chipGhost: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  chipGhostText: { color: theme.colors.text, fontWeight: '600' },
  court: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: theme.colors.border },
  courtName: { color: theme.colors.text, fontWeight: '800' },
  courtMeta: { color: theme.colors.muted, fontSize: 12, textTransform: 'capitalize' },
  price: { color: theme.colors.primary, fontWeight: '800' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(11,18,32,0.92)' },
  cta: { borderRadius: 14, padding: 16, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
