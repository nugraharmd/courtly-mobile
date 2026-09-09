import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { theme, formatIDR, resolveFacilityImage } from '../utils';
import type { FacilitySummary } from '../types';

export function FacilityCard({ item }: { item: FacilitySummary }) {
  const [imgFailed, setImgFailed] = useState(false);
  const uri = imgFailed ? resolveFacilityImage(null) : resolveFacilityImage(item.imageUrl);
  return (
    <Pressable
      style={styles.card}
      onPress={() => {
        void Haptics.selectionAsync();
        router.push(`/facility/${item.id}`);
      }}
    >
      <Image
        source={{ uri }}
        style={styles.image}
        contentFit="cover"
        transition={200}
        onError={() => setImgFailed(true)}
      />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
        <View style={styles.row}>
          <Text style={styles.rating}>★ {item.rating.toFixed(1)} ({item.reviewCount})</Text>
          <Text style={styles.price}>{formatIDR(item.startingPrice)}<Text style={styles.perHour}> /hr</Text></Text>
        </View>
        <View style={styles.chips}>
          {item.sports.map((s) => (
            <View key={s} style={styles.chip}><Text style={styles.chipText}>{s}</Text></View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  image: { width: '100%', height: 170, backgroundColor: theme.colors.surface },
  body: { padding: 12, gap: 4 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  location: { color: theme.colors.muted, fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  rating: { color: theme.colors.warning, fontWeight: '700', fontSize: 13 },
  price: { color: theme.colors.primary, fontWeight: '800', fontSize: 14 },
  perHour: { color: theme.colors.muted, fontWeight: '400', fontSize: 12 },
  chips: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  chip: { backgroundColor: 'rgba(2,132,199,0.10)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chipText: { color: theme.colors.accent, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
});
