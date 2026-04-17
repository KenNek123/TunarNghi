import type { ThemeMode } from './types';

export interface ThemeCardPreset {
  value: ThemeMode;
  label: string;
  sublabel: string;
  preview: string;
  badge?: string;
}

export interface AppThemeVisual {
  page: string;
  orbs: [string, string];
  badge: string;
  heading: string;
  body: string;
  primaryButton: string;
  sectionEyebrow: string;
  heroCard: string;
}

export interface PortalThemeVisual {
  name: string;
  shell: string;
  panel: string;
  stageGlow: string;
  badge: string;
  accentText: string;
  infoPanel: string;
  infoText: string;
  borderA: string;
  borderB: string;
  borderC: string;
  shadow: string;
  progressA: string;
  progressB: string;
  progressC: string;
  particle: string;
}

export const THEME_CARDS: ThemeCardPreset[] = [
  { value: 'dreamy', label: 'Dreamy', sublabel: 'kẹo ngọt pastel', preview: 'from-pink-200 via-fuchsia-200 to-sky-200' },
  { value: 'locket', label: 'Locket Air', sublabel: 'kem sáng, vintage nhẹ', preview: 'from-amber-100 via-rose-100 to-orange-100', badge: 'Locket' },
  { value: 'locketGold', label: 'Locket Gold', sublabel: 'vàng đen cổ điển', preview: 'from-[#3f2e18] via-[#b89146] to-[#1c150d]', badge: 'Dark' },
  { value: 'locketGoldMidnight', label: 'Gold Midnight', sublabel: 'đen tím + gold', preview: 'from-[#161217] via-[#c5a45b] to-[#09080b]', badge: 'Dark' },
  { value: 'locketGoldEspresso', label: 'Gold Espresso', sublabel: 'nâu đậm như cà phê', preview: 'from-[#22160f] via-[#d8b46a] to-[#120d09]', badge: 'Dark' },
  { value: 'locketGoldVelvet', label: 'Gold Velvet', sublabel: 'đen nhung, gold mềm', preview: 'from-[#1e1718] via-[#f1cf8b] to-[#0f0b0c]', badge: 'Dark' },
  { value: 'neon', label: 'Neon', sublabel: 'đậm, nổi, cá tính', preview: 'from-cyan-300 via-violet-300 to-fuchsia-300' },
  { value: 'sunset', label: 'Sunset', sublabel: 'cam tím chiều muộn', preview: 'from-orange-200 via-rose-200 to-purple-200' },
];

export const APP_THEME_VISUALS: Record<ThemeMode, AppThemeVisual> = {
  dreamy: {
    page: 'bg-[linear-gradient(180deg,#fffafc_0%,#f9f4ff_40%,#f4f9ff_100%)]',
    orbs: ['bg-fuchsia-300/25', 'bg-sky-300/25'],
    badge: 'bg-white/70 text-fuchsia-700 ring-white/70',
    heading: 'text-slate-900',
    body: 'text-slate-600',
    primaryButton: 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 text-white shadow-[0_24px_48px_rgba(139,92,246,0.28)]',
    sectionEyebrow: 'text-fuchsia-600/90',
    heroCard: 'pretty-card',
  },
  locket: {
    page: 'bg-[linear-gradient(180deg,#fffaf6_0%,#f8f1ea_45%,#f3ece6_100%)]',
    orbs: ['bg-amber-300/20', 'bg-rose-200/20'],
    badge: 'bg-[#fff3e4]/80 text-amber-900 ring-[#f6dfbf]',
    heading: 'text-[#33241a]',
    body: 'text-[#715946]',
    primaryButton: 'bg-gradient-to-r from-[#dfb87f] via-[#d9997d] to-[#e8c9aa] text-[#302015] shadow-[0_24px_48px_rgba(180,116,52,0.22)]',
    sectionEyebrow: 'text-amber-700/90',
    heroCard: 'pretty-card',
  },
  locketGold: {
    page: 'bg-[linear-gradient(180deg,#120d09_0%,#1b140e_38%,#080707_100%)]',
    orbs: ['bg-amber-500/18', 'bg-yellow-200/8'],
    badge: 'bg-[#2a2118]/85 text-[#f0d28f] ring-[#6e572b]',
    heading: 'text-[#f6e6bd]',
    body: 'text-[#c9b28a]',
    primaryButton: 'bg-gradient-to-r from-[#6d531e] via-[#c89f4d] to-[#8f6b25] text-[#130f0b] shadow-[0_24px_48px_rgba(200,159,77,0.25)]',
    sectionEyebrow: 'text-[#d2b06a]',
    heroCard: 'pretty-card-dark',
  },
  locketGoldMidnight: {
    page: 'bg-[linear-gradient(180deg,#0e0c10_0%,#17131a_42%,#070608_100%)]',
    orbs: ['bg-yellow-300/10', 'bg-violet-400/10'],
    badge: 'bg-[#1f1a20]/85 text-[#e5c986] ring-[#67552c]',
    heading: 'text-[#f2e4be]',
    body: 'text-[#bda983]',
    primaryButton: 'bg-gradient-to-r from-[#4d4327] via-[#d0ab58] to-[#7b5f2a] text-[#120f0b] shadow-[0_24px_48px_rgba(188,152,77,0.25)]',
    sectionEyebrow: 'text-[#cdae6d]',
    heroCard: 'pretty-card-dark',
  },
  locketGoldEspresso: {
    page: 'bg-[linear-gradient(180deg,#130d09_0%,#241811_46%,#090706_100%)]',
    orbs: ['bg-amber-500/16', 'bg-orange-200/10'],
    badge: 'bg-[#251912]/85 text-[#f0d08b] ring-[#70552f]',
    heading: 'text-[#f5dfb0]',
    body: 'text-[#bea37c]',
    primaryButton: 'bg-gradient-to-r from-[#5b3920] via-[#dbb15a] to-[#8b5624] text-[#150e09] shadow-[0_24px_48px_rgba(188,124,52,0.25)]',
    sectionEyebrow: 'text-[#d6ab64]',
    heroCard: 'pretty-card-dark',
  },
  locketGoldVelvet: {
    page: 'bg-[linear-gradient(180deg,#140f12_0%,#1f171a_44%,#080607_100%)]',
    orbs: ['bg-rose-300/10', 'bg-amber-300/10'],
    badge: 'bg-[#261e21]/85 text-[#f3d89d] ring-[#735f35]',
    heading: 'text-[#f8e8c3]',
    body: 'text-[#c4ab86]',
    primaryButton: 'bg-gradient-to-r from-[#584130] via-[#e0bd77] to-[#8a6d35] text-[#150f0d] shadow-[0_24px_48px_rgba(216,185,117,0.25)]',
    sectionEyebrow: 'text-[#dabc7d]',
    heroCard: 'pretty-card-dark',
  },
  neon: {
    page: 'bg-[linear-gradient(180deg,#07111f_0%,#12061d_40%,#020617_100%)]',
    orbs: ['bg-cyan-400/20', 'bg-fuchsia-500/16'],
    badge: 'bg-slate-900/85 text-cyan-200 ring-cyan-500/30',
    heading: 'text-cyan-50',
    body: 'text-slate-300',
    primaryButton: 'bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 text-slate-950 shadow-[0_24px_48px_rgba(34,211,238,0.22)]',
    sectionEyebrow: 'text-cyan-300',
    heroCard: 'pretty-card-dark',
  },
  sunset: {
    page: 'bg-[linear-gradient(180deg,#fff7ed_0%,#fff1f2_42%,#f5f3ff_100%)]',
    orbs: ['bg-orange-300/22', 'bg-purple-300/18'],
    badge: 'bg-white/70 text-rose-700 ring-white/70',
    heading: 'text-slate-900',
    body: 'text-slate-600',
    primaryButton: 'bg-gradient-to-r from-orange-400 via-rose-400 to-violet-400 text-white shadow-[0_24px_48px_rgba(251,146,60,0.22)]',
    sectionEyebrow: 'text-rose-600/90',
    heroCard: 'pretty-card',
  },
};

export const PORTAL_THEME_VISUALS: Record<ThemeMode, PortalThemeVisual> = {
  dreamy: {
    name: 'Dreamy', shell: 'from-white/85 via-fuchsia-50/90 to-sky-50/90', panel: 'bg-white/70', stageGlow: 'bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.28),_transparent_55%)]', badge: 'bg-white/70 text-slate-600', accentText: 'text-fuchsia-600/80', infoPanel: 'bg-slate-900', infoText: 'text-slate-200', borderA: 'rgba(255,255,255,0.94)', borderB: 'rgba(216,180,254,0.95)', borderC: 'rgba(125,211,252,0.96)', shadow: 'rgba(244,114,182,0.62)', progressA: '#f9a8d4', progressB: '#c084fc', progressC: '#7dd3fc', particle: 'rgba(244,114,182,0.72)'
  },
  locket: {
    name: 'Locket Air', shell: 'from-white/92 via-orange-50/85 to-rose-50/80', panel: 'bg-white/80', stageGlow: 'bg-[radial-gradient(circle_at_top,_rgba(255,248,240,0.42),_transparent_55%)]', badge: 'bg-[#fff4ea]/80 text-amber-900', accentText: 'text-amber-700/90', infoPanel: 'bg-[#3a2418]', infoText: 'text-amber-50/90', borderA: 'rgba(255,251,235,0.98)', borderB: 'rgba(251,191,143,0.95)', borderC: 'rgba(244,114,182,0.8)', shadow: 'rgba(251,146,60,0.5)', progressA: '#fdba74', progressB: '#fda4af', progressC: '#fef3c7', particle: 'rgba(251,146,60,0.65)'
  },
  locketGold: {
    name: 'Locket Gold', shell: 'from-[#20160f]/95 via-[#2d2015]/90 to-[#100c09]/95', panel: 'bg-[#231a13]/82', stageGlow: 'bg-[radial-gradient(circle_at_top,_rgba(238,207,137,0.12),_transparent_55%)]', badge: 'bg-[#2d231a]/90 text-[#f0d28f]', accentText: 'text-[#ddb970]', infoPanel: 'bg-[#0f0b08]', infoText: 'text-[#e8d5aa]', borderA: 'rgba(255,246,214,0.95)', borderB: 'rgba(231,191,94,0.95)', borderC: 'rgba(143,107,37,0.95)', shadow: 'rgba(213,167,72,0.48)', progressA: '#f5d084', progressB: '#c89f4d', progressC: '#7a5a22', particle: 'rgba(240,210,143,0.75)'
  },
  locketGoldMidnight: {
    name: 'Gold Midnight', shell: 'from-[#161118]/95 via-[#1e1822]/92 to-[#09070b]/95', panel: 'bg-[#1c1720]/84', stageGlow: 'bg-[radial-gradient(circle_at_top,_rgba(213,182,112,0.12),_transparent_55%)]', badge: 'bg-[#211b24]/90 text-[#f0d79b]', accentText: 'text-[#d6b46e]', infoPanel: 'bg-[#0b0910]', infoText: 'text-[#eadbb4]', borderA: 'rgba(255,245,217,0.95)', borderB: 'rgba(224,191,112,0.95)', borderC: 'rgba(110,88,40,0.95)', shadow: 'rgba(196,162,89,0.45)', progressA: '#f2d392', progressB: '#caa557', progressC: '#725729', particle: 'rgba(239,216,155,0.72)'
  },
  locketGoldEspresso: {
    name: 'Gold Espresso', shell: 'from-[#23150f]/95 via-[#311e14]/92 to-[#0d0907]/95', panel: 'bg-[#241812]/84', stageGlow: 'bg-[radial-gradient(circle_at_top,_rgba(215,168,91,0.13),_transparent_55%)]', badge: 'bg-[#2a1d16]/90 text-[#f2d597]', accentText: 'text-[#d7b066]', infoPanel: 'bg-[#100907]', infoText: 'text-[#ebdbb7]', borderA: 'rgba(255,242,208,0.96)', borderB: 'rgba(222,171,89,0.95)', borderC: 'rgba(113,67,28,0.95)', shadow: 'rgba(204,145,64,0.47)', progressA: '#f2cf85', progressB: '#d29a49', progressC: '#80451f', particle: 'rgba(241,214,151,0.72)'
  },
  locketGoldVelvet: {
    name: 'Gold Velvet', shell: 'from-[#211719]/95 via-[#2a1e20]/92 to-[#0c090a]/95', panel: 'bg-[#241b1d]/84', stageGlow: 'bg-[radial-gradient(circle_at_top,_rgba(237,206,132,0.12),_transparent_55%)]', badge: 'bg-[#2c2022]/90 text-[#f5dc9e]', accentText: 'text-[#ddbe79]', infoPanel: 'bg-[#10090a]', infoText: 'text-[#efdfbb]', borderA: 'rgba(255,244,218,0.96)', borderB: 'rgba(232,196,114,0.95)', borderC: 'rgba(132,102,48,0.95)', shadow: 'rgba(222,187,109,0.45)', progressA: '#f6db9a', progressB: '#d7b064', progressC: '#856734', particle: 'rgba(245,220,158,0.72)'
  },
  neon: {
    name: 'Neon', shell: 'from-slate-900/95 via-violet-950/90 to-slate-900/95', panel: 'bg-slate-900/75', stageGlow: 'bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_55%)]', badge: 'bg-slate-900/75 text-cyan-100', accentText: 'text-cyan-300', infoPanel: 'bg-[#020617]', infoText: 'text-cyan-50/90', borderA: 'rgba(207,250,254,0.96)', borderB: 'rgba(34,211,238,0.96)', borderC: 'rgba(217,70,239,0.96)', shadow: 'rgba(34,211,238,0.64)', progressA: '#22d3ee', progressB: '#8b5cf6', progressC: '#d946ef', particle: 'rgba(34,211,238,0.72)'
  },
  sunset: {
    name: 'Sunset', shell: 'from-orange-50/95 via-rose-50/90 to-violet-50/90', panel: 'bg-white/72', stageGlow: 'bg-[radial-gradient(circle_at_top,_rgba(255,237,213,0.35),_transparent_55%)]', badge: 'bg-white/75 text-rose-900', accentText: 'text-rose-600/90', infoPanel: 'bg-slate-900', infoText: 'text-slate-200', borderA: 'rgba(255,255,255,0.96)', borderB: 'rgba(251,146,60,0.95)', borderC: 'rgba(244,114,182,0.92)', shadow: 'rgba(251,146,60,0.58)', progressA: '#fb923c', progressB: '#fb7185', progressC: '#a78bfa', particle: 'rgba(251,146,60,0.68)'
  },
};
