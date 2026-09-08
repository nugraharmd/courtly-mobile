export const theme = {
  colors: {
    bg: '#0B1220',
    surface: '#111C33',
    card: '#16233F',
    border: 'rgba(255,255,255,0.08)',
    text: '#F4F7FF',
    muted: '#9AA7C2',
    primary: '#22C55E',
    primaryDark: '#15803D',
    accent: '#38BDF8',
    danger: '#F87171',
    warning: '#FBBF24',
    success: '#34D399',
  },
  radius: { sm: 8, md: 14, lg: 20 },
} as const;

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
