import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

/** Numbered pagination bar: 10 items per page. Shows a compact window of pages + Prev/Next. */
export function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  if (total === 0) return null;
  const pages = pageNumbers(page, totalPages);
  return (
    <View style={styles.wrap}>
      <Text style={styles.total}>
        Page {page} of {totalPages} · {total} item{total === 1 ? '' : 's'}
      </Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => onChange(page - 1)}
          disabled={page <= 1}
          style={[styles.nav, page <= 1 && styles.disabled]}
        >
          <Text style={styles.navText}>‹ Prev</Text>
        </Pressable>
        {pages.map((p) =>
          typeof p === 'number' ? (
            <Pressable
              key={p}
              onPress={() => onChange(p)}
              style={[styles.num, p === page && styles.numActive]}
            >
              <Text style={[styles.numText, p === page && styles.numTextActive]}>{p}</Text>
            </Pressable>
          ) : (
            <Text key={p} style={styles.ellipsis}>
              …
            </Text>
          ),
        )}
        <Pressable
          onPress={() => onChange(page + 1)}
          disabled={page >= totalPages}
          style={[styles.nav, page >= totalPages && styles.disabled]}
        >
          <Text style={styles.navText}>Next ›</Text>
        </Pressable>
      </View>
    </View>
  );
}

function pageNumbers(page: number, totalPages: number): (number | string)[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const set = new Set<number>([1, page - 1, page, page + 1, totalPages]);
  const nums = [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out: (number | string)[] = [];
  let prev = 0;
  for (const n of nums) {
    if (prev && n - prev > 1) out.push(`gap-${prev}-${n}`);
    out.push(n);
    prev = n;
  }
  return out;
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  total: { color: theme.colors.muted, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  nav: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  navText: { color: theme.colors.text, fontWeight: '800', fontSize: 13 },
  disabled: { opacity: 0.4 },
  num: { minWidth: 34, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  numActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  numText: { color: theme.colors.text, fontWeight: '800', fontSize: 13 },
  numTextActive: { color: '#fff' },
  ellipsis: { color: theme.colors.muted, paddingHorizontal: 2, fontWeight: '800' },
});
