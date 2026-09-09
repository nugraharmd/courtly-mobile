export const theme = {
  colors: {
    bg: '#F4F6FB',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#64748B',
    primary: '#16A34A',
    primaryDark: '#15803D',
    accent: '#0284C7',
    danger: '#DC2626',
    warning: '#D97706',
    success: '#16A34A',
  },
  radius: { sm: 8, md: 14, lg: 20 },
} as const;

/** Online fallback image used when a facility photo is missing or fails to load. */
export const FACILITY_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=60';

/** Resolve a possibly-empty remote image URL to a guaranteed-loadable one. */
export function resolveFacilityImage(uri: string | null | undefined): string {
  if (typeof uri === 'string' && uri.trim() !== '') return uri;
  return FACILITY_FALLBACK_IMAGE;
}

export function formatIDR(n: number): string {
  return 'Rp' + Math.round(n).toLocaleString('id-ID');
}

export function formatDateLabel(iso: string): string {
  const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nextDays(count = 14): Date[] {
  const out: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

/** "09:00" -> minutes since midnight, for consecutive-slot validation. */
export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
