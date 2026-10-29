// Utility to manage store primary accent colors and palettes

export interface ColorPreset {
  id: string;
  name: string;
  category: string;
  primary: string; // 600 shade or main representative
  lightText: boolean;
  shades: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
}

export const THEME_COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'emerald',
    name: 'Verde Esmeralda',
    category: 'Abarrotes & Fresco (Original)',
    primary: '#059669',
    lightText: true,
    shades: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22'
    }
  },
  {
    id: 'blue',
    name: 'Azul Océano',
    category: 'Comercial & Farmacia',
    primary: '#2563eb',
    lightText: true,
    shades: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    }
  },
  {
    id: 'indigo',
    name: 'Índigo Real',
    category: 'Moderno & Tecnológico',
    primary: '#4f46e5',
    lightText: true,
    shades: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b'
    }
  },
  {
    id: 'purple',
    name: 'Púrpura / Violeta',
    category: 'Elegante & Boutique',
    primary: '#9333ea',
    lightText: true,
    shades: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764'
    }
  },
  {
    id: 'red',
    name: 'Rojo Dinámico',
    category: 'Supermercado & Carnicería',
    primary: '#dc2626',
    lightText: true,
    shades: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    }
  },
  {
    id: 'rose',
    name: 'Rosa Fucsia',
    category: 'Dulcería & Papelería',
    primary: '#e11d48',
    lightText: true,
    shades: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
      950: '#4c0519'
    }
  },
  {
    id: 'orange',
    name: 'Naranja Cítrico',
    category: 'Panadería & Frutería',
    primary: '#ea580c',
    lightText: true,
    shades: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407'
    }
  },
  {
    id: 'amber',
    name: 'Ámbar Miel',
    category: 'Cálido & Cafetería',
    primary: '#d97706',
    lightText: true,
    shades: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03'
    }
  },
  {
    id: 'teal',
    name: 'Verde Turquesa',
    category: 'Limpio & Natural',
    primary: '#0d9488',
    lightText: true,
    shades: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e'
    }
  },
  {
    id: 'cyan',
    name: 'Cian Glaciar',
    category: 'Ferretería & Técnico',
    primary: '#0891b2',
    lightText: true,
    shades: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344'
    }
  },
  {
    id: 'slate',
    name: 'Grafito Minimalista',
    category: 'Neutro & Sobrio',
    primary: '#475569',
    lightText: true,
    shades: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    }
  }
];

/**
 * Generate 50-950 shades from any arbitrary hex color.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixColors(color1: string, color2: string, weight: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const p = Math.max(0, Math.min(1, weight));
  const r = rgb1.r * (1 - p) + rgb2.r * p;
  const g = rgb1.g * (1 - p) + rgb2.g * p;
  const b = rgb1.b * (1 - p) + rgb2.b * p;
  return rgbToHex(r, g, b);
}

export function generateCustomShades(baseHex: string) {
  const white = '#ffffff';
  const black = '#000000';

  return {
    50: mixColors(white, baseHex, 0.08),
    100: mixColors(white, baseHex, 0.18),
    200: mixColors(white, baseHex, 0.32),
    300: mixColors(white, baseHex, 0.50),
    400: mixColors(white, baseHex, 0.75),
    500: baseHex,
    600: mixColors(baseHex, black, 0.12),
    700: mixColors(baseHex, black, 0.28),
    800: mixColors(baseHex, black, 0.45),
    900: mixColors(baseHex, black, 0.62),
    950: mixColors(baseHex, black, 0.78)
  };
}

export function getShadesForColor(colorIdOrHex: string) {
  const preset = THEME_COLOR_PRESETS.find((p) => p.id === colorIdOrHex);
  if (preset) {
    return preset.shades;
  }
  // If it's a valid hex
  if (/^#([0-9A-F]{3}){1,2}$/i.test(colorIdOrHex)) {
    return generateCustomShades(colorIdOrHex);
  }
  // Default to emerald
  return THEME_COLOR_PRESETS[0].shades;
}

export function applyThemeColor(colorIdOrHex: string): void {
  if (typeof document === 'undefined') return;

  const shades = getShadesForColor(colorIdOrHex);
  const root = document.documentElement;

  // Set individual CSS variables on document root
  root.style.setProperty('--theme-color-50', shades[50]);
  root.style.setProperty('--theme-color-100', shades[100]);
  root.style.setProperty('--theme-color-200', shades[200]);
  root.style.setProperty('--theme-color-300', shades[300]);
  root.style.setProperty('--theme-color-400', shades[400]);
  root.style.setProperty('--theme-color-500', shades[500]);
  root.style.setProperty('--theme-color-600', shades[600]);
  root.style.setProperty('--theme-color-700', shades[700]);
  root.style.setProperty('--theme-color-800', shades[800]);
  root.style.setProperty('--theme-color-900', shades[900]);
  root.style.setProperty('--theme-color-950', shades[950]);

  // Set attribute for optional styling hooks
  root.setAttribute('data-color-theme', colorIdOrHex);

  try {
    localStorage.setItem('pos_primary_color', colorIdOrHex);
  } catch (e) {
    console.error('No se pudo guardar pos_primary_color:', e);
  }
}

export function getInitialThemeColor(): string {
  if (typeof window === 'undefined') return 'emerald';
  try {
    const saved = localStorage.getItem('pos_primary_color');
    if (saved && (THEME_COLOR_PRESETS.some((p) => p.id === saved) || /^#([0-9A-F]{3}){1,2}$/i.test(saved))) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'emerald';
}

export interface HeaderColorPreset {
  id: string;
  name: string;
  category: string;
  hex: string;
}

export const HEADER_COLOR_PRESETS: HeaderColorPreset[] = [
  {
    id: 'slate-900',
    name: 'Azul Marino Clásico (Original)',
    category: 'Azules & Marinos',
    hex: '#0f172a'
  },
  {
    id: 'blue-950',
    name: 'Azul Noche Profundo',
    category: 'Azules & Marinos',
    hex: '#172554'
  },
  {
    id: 'indigo-950',
    name: 'Índigo Medianoche',
    category: 'Azules & Marinos',
    hex: '#1e1b4b'
  },
  {
    id: 'neutral-950',
    name: 'Negro Azabache Puro',
    category: 'Neutros & Oscuros',
    hex: '#0a0a0a'
  },
  {
    id: 'zinc-900',
    name: 'Carbón Mate',
    category: 'Neutros & Oscuros',
    hex: '#18181b'
  },
  {
    id: 'slate-800',
    name: 'Gris Grafito Pizarra',
    category: 'Neutros & Oscuros',
    hex: '#1e293b'
  },
  {
    id: 'emerald-950',
    name: 'Verde Bosque Oscuro',
    category: 'Verdes & Botánicos',
    hex: '#022c22'
  },
  {
    id: 'teal-950',
    name: 'Turquesa Marino Oscuro',
    category: 'Verdes & Botánicos',
    hex: '#042f2e'
  },
  {
    id: 'cyan-950',
    name: 'Cian Petróleo Oscuro',
    category: 'Azules & Marinos',
    hex: '#083344'
  },
  {
    id: 'purple-950',
    name: 'Púrpura Ciruela Real',
    category: 'Elegantes & Cálidos',
    hex: '#3b0764'
  },
  {
    id: 'red-950',
    name: 'Vino Tinto / Burdeos',
    category: 'Elegantes & Cálidos',
    hex: '#450a0a'
  },
  {
    id: 'amber-950',
    name: 'Café Ébano Moka',
    category: 'Elegantes & Cálidos',
    hex: '#291508'
  }
];

export function getHeaderColorHex(colorIdOrHex: string): string {
  const preset = HEADER_COLOR_PRESETS.find((p) => p.id === colorIdOrHex);
  if (preset) return preset.hex;
  if (/^#([0-9A-F]{3}){1,2}$/i.test(colorIdOrHex)) return colorIdOrHex;
  return '#0f172a';
}

export function applyHeaderColor(colorIdOrHex: string): void {
  if (typeof document === 'undefined') return;

  const hex = getHeaderColorHex(colorIdOrHex);
  const root = document.documentElement;

  root.style.setProperty('--header-bg-color', hex);
  root.style.setProperty('--header-border-color', 'rgba(255, 255, 255, 0.12)');
  root.style.setProperty('--header-surface-color', 'rgba(255, 255, 255, 0.08)');
  root.style.setProperty('--header-surface-hover-color', 'rgba(255, 255, 255, 0.14)');
  root.style.setProperty('--header-surface-border-color', 'rgba(255, 255, 255, 0.15)');

  try {
    localStorage.setItem('pos_header_bg_color', colorIdOrHex);
  } catch (e) {
    console.error('No se pudo guardar pos_header_bg_color:', e);
  }
}

export function getInitialHeaderColor(): string {
  if (typeof window === 'undefined') return 'slate-900';
  try {
    const saved = localStorage.getItem('pos_header_bg_color');
    if (saved && (HEADER_COLOR_PRESETS.some((p) => p.id === saved) || /^#([0-9A-F]{3}){1,2}$/i.test(saved))) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'slate-900';
}

