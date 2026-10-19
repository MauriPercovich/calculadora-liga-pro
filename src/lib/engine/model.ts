import type { Partido } from "./types";

/** Generador pseudoaleatorio con semilla (mulberry32): mismas cifras en cada corrida. */
export function rng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function poisson(l: number, r: () => number): number {
  const L = Math.exp(-l);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= r();
  } while (p > L);
  return k - 1;
}

export interface ModeloGoles {
  mu: number; // goles promedio por equipo y partido
  ataque: Map<number, number>;
  defensa: Map<number, number>;
}

/**
 * Fuerza de ataque y defensa por equipo a partir de sus goles, acercada a la media
 * (`encogimiento` partidos ficticios de un equipo promedio). Sin localía.
 */
export function ajustarGoles(partidos: Partido[], equipos: number[], encogimiento = 3, muPorDefecto = 2.4): ModeloGoles {
  const gf = new Map<number, number>();
  const gc = new Map<number, number>();
  const pj = new Map<number, number>();
  for (const e of equipos) {
    gf.set(e, 0);
    gc.set(e, 0);
    pj.set(e, 0);
  }
  let total = 0;
  let n = 0;
  for (const p of partidos) {
    if (p.golesA === null || p.golesB === null) continue;
    gf.set(p.a, (gf.get(p.a) ?? 0) + p.golesA);
    gc.set(p.a, (gc.get(p.a) ?? 0) + p.golesB);
    gf.set(p.b, (gf.get(p.b) ?? 0) + p.golesB);
    gc.set(p.b, (gc.get(p.b) ?? 0) + p.golesA);
    pj.set(p.a, (pj.get(p.a) ?? 0) + 1);
    pj.set(p.b, (pj.get(p.b) ?? 0) + 1);
    total += p.golesA + p.golesB;
    n++;
  }
  const mu = n ? total / (2 * n) : muPorDefecto;
  const ataque = new Map<number, number>();
  const defensa = new Map<number, number>();
  for (const e of equipos) {
    const j = pj.get(e) ?? 0;
    ataque.set(e, ((gf.get(e) ?? 0) + encogimiento * mu) / (j + encogimiento) / mu);
    defensa.set(e, ((gc.get(e) ?? 0) + encogimiento * mu) / (j + encogimiento) / mu);
  }
  return { mu, ataque, defensa };
}

export const golesEsperados = (m: ModeloGoles, a: number, b: number) =>
  m.mu * (m.ataque.get(a) ?? 1) * (m.defensa.get(b) ?? 1);

function pmf(l: number, k: number) {
  let p = Math.exp(-l);
  for (let i = 1; i <= k; i++) p *= l / i;
  return p;
}

/** [gana a, empate, gana b] */
export function probabilidades(m: ModeloGoles, a: number, b: number): [number, number, number] {
  const la = golesEsperados(m, a, b);
  const lb = golesEsperados(m, b, a);
  const A: number[] = [];
  const B: number[] = [];
  for (let i = 0; i <= 15; i++) {
    A.push(pmf(la, i));
    B.push(pmf(lb, i));
  }
  let pa = 0;
  let pd = 0;
  let pb = 0;
  for (let i = 0; i <= 15; i++)
    for (let j = 0; j <= 15; j++) {
      const p = A[i] * B[j];
      if (i > j) pa += p;
      else if (i === j) pd += p;
      else pb += p;
    }
  const s = pa + pd + pb;
  return [pa / s, pd / s, pb / s];
}
