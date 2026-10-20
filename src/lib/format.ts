/**
 * Formato uruguayo de porcentajes y puntos porcentuales.
 * Reglas del diseño:
 *  - coma decimal: "9,8%"
 *  - extremos: "<0,1%" y ">99,9%"; 0 y 100 solo cuando es matemáticamente seguro
 *  - menos de 10%: un decimal ("7,9%", "1,5%"); 10% o más: entero ("74%")
 *  - pp con signo tipográfico: "+12,0" / "−11,0" (U+2212, no guion)
 */

/** p en 0..100. exact = true solo si el valor es 0 o 100 por definición (no por redondeo). */
export function pct(p: number, exact = false): string {
  if (exact && p <= 0) return '0%';
  if (exact && p >= 100) return '100%';
  if (p >= 99.95) return '>99,9%';
  if (p <= 0) return '0%';
  if (p < 0.05) return '<0,1%';
  if (p < 9.95) return p.toFixed(1).replace('.', ',') + '%';
  return Math.round(p) + '%';
}

/** Diferencia en puntos porcentuales, siempre con un decimal. */
export function pp(delta: number): string {
  const abs = Math.abs(delta).toFixed(1).replace('.', ',');
  return (delta >= 0 ? '+' : '−') + abs;
}

/** Puntos esperados: "18,6". */
export function dec1(n: number): string {
  return n.toFixed(1).replace('.', ',');
}

/** Diferencia de gol con signo: "+15", "−8", "0". */
export function dg(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0';
}

const DIAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/** "2026-10-25" → "DOM 25 OCT" (sobretítulos en mayúsculas). Usa hora de Montevideo. */
export function diaCorto(iso: string): string {
  const d = new Date(iso + 'T12:00:00-03:00');
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}
