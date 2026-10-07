// Contraste de colores según WCAG 2.x, para que la paleta se adapte a CUALQUIER
// color que el admin elija en Branding (no solo al rojo/naranja actuales).
// Funciones puras: sin Angular ni DOM, se pueden probar sueltas.

/** Mínimo de WCAG AA para texto normal. */
export const CONTRASTE_MINIMO = 4.5;
/**
 * Objetivo al CALCULAR tonos y tinta: un poco por encima del mínimo, para que
 * sigan pasando sobre fondos casi blancos (gray-50, surface-50) y no solo sobre blanco.
 */
export const CONTRASTE_OBJETIVO = 4.7;
/** Texto oscuro que se usa cuando el blanco no contrasta (gray-900). */
export const TEXTO_OSCURO = '#111827';

type Rgb = [number, number, number];

export function hexARgb(hex: string): Rgb {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  return [0, 2, 4].map((i) => parseInt(c.substring(i, i + 2), 16)) as Rgb;
}

function rgbAHex([r, g, b]: Rgb): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/** Luminancia relativa (0 = negro, 1 = blanco). */
export function luminancia(hex: string): number {
  const [r, g, b] = hexARgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relación de contraste entre dos colores (1 a 21). */
export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Mezcla `color` con `hacia` en proporción `t` (0 = color, 1 = hacia). */
export function mezclar(color: string, hacia: string, t: number): string {
  const a = hexARgb(color);
  const b = hexARgb(hacia);
  return rgbAHex(a.map((v, i) => v + (b[i] - v) * t) as Rgb);
}

/** Texto (blanco u oscuro) que mejor se lee encima de `fondo`. */
export function textoSobre(fondo: string): string {
  return contraste(fondo, '#ffffff') >= contraste(fondo, TEXTO_OSCURO) ? '#ffffff' : TEXTO_OSCURO;
}

/**
 * Proporción mínima de mezcla de `color` hacia `hacia` para llegar a `minimo`
 * de contraste contra `fondo` (1 si ni mezclándolo del todo se llega).
 */
function mezclaNecesaria(color: string, hacia: string, fondo: string, minimo: number): number {
  for (let t = 0; t <= 1; t += 0.02) {
    if (contraste(mezclar(color, hacia, t), fondo) >= minimo) return t;
  }
  return 1;
}

export interface TonosMarca {
  /** Tonos 600 a 950: el color oscurecido (o aclarado si el fondo es oscuro). */
  tonos: Record<'600' | '700' | '800' | '900' | '950', string>;
  /** Texto que se lee encima del color base (botones, etiquetas). */
  textoEncima: string;
  /** El color para usarlo COMO texto sobre la superficie: el mismo si ya contrasta, si no el 600. */
  tinta: string;
}

/**
 * Calcula los tonos de un color de marca para que funcionen sobre `superficie`:
 * el 600 siempre llega a 4.7:1 (así `text-primary-600` y el texto blanco sobre
 * `bg-primary-600` se leen), y del 700 al 950 cada uno es más profundo que el anterior.
 * Para colores normales queda igual que la escala fija (30 % hacia negro en el 600).
 */
export function tonosDeMarca(color: string, superficie: string): TonosMarca {
  const hacia = luminancia(superficie) > 0.4 ? '#000000' : '#ffffff';
  const base = Math.max(0.3, mezclaNecesaria(color, hacia, superficie, CONTRASTE_OBJETIVO));
  const paso = (p: number) => mezclar(color, hacia, Math.min(1, base + (1 - base) * p));
  const tonos = { '600': paso(0), '700': paso(0.17), '800': paso(0.31), '900': paso(0.45), '950': paso(0.6) };
  return {
    tonos,
    textoEncima: textoSobre(color),
    tinta: contraste(color, superficie) >= CONTRASTE_OBJETIVO ? color : tonos['600'],
  };
}
