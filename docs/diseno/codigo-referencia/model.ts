/**
 * Motor de chances de la Calculadora Liga Pro (referencia).
 *
 * Es el mismo enfoque que usa el prototipo navegable:
 *  - Cada partido que queda tiene probabilidades [gana A, empate, gana B].
 *  - Si quedan ≤ EXACT_LIMIT partidos se recorren TODAS las combinaciones (3^n) con su probabilidad:
 *    el resultado es exacto y además permite saber cuándo algo es seguro (0% / 100% de verdad).
 *  - Si quedan más, Monte Carlo con semilla fija (20.000 corridas por defecto, el número que muestra la UI).
 *  - Con la misma pasada se calculan las vistas derivadas de la ficha de equipo:
 *      «¿Qué pasa si…?»            → chances condicionadas al resultado de un partido
 *      «¿Con cuántos puntos…?»      → chances condicionadas a los puntos finales
 *      «Partidos de otros que importan» → mayor cambio condicionado en partidos ajenos
 *    Por eso todas las pantallas son coherentes entre sí.
 *
 * Si la app ya tiene su propio motor (por ejemplo con goles por Poisson), mantenerlo y
 * agregarle solo `focus()` para las vistas condicionadas. Las interfaces de salida son lo que importa.
 *
 * Simplificaciones (documentadas en el HANDOFF):
 *  - No se simulan goles: el ganador suma +1 de DG y +1 GF (aproximación para el desempate).
 *  - Enfrentamiento directo y sorteo no se evalúan todavía: con empate total decide el orden de entrada (TODO).
 *  - Copas: semis y final a partido único, con `knockoutWinProb` (por defecto, leve ventaja al mejor ubicado).
 */

export type Goal = 'camp' | 'asc' | 'oro' | 'plata' | 'bronce' | 'desc';
export const GOALS: Goal[] = ['camp', 'asc', 'oro', 'plata', 'bronce', 'desc'];

export interface TeamState { id: string; pts: number; gf: number; gc: number }
/** p = [gana a, empate, gana b] en porcentaje (suman 100). */
export interface Fixture { a: string; b: string; p: [number, number, number] }
/** Resultado elegido en Simular: 0 = gana a, 1 = empate, 2 = gana b. */
export type Picks = Record<number, 0 | 1 | 2>;

export interface Rules {
  phase: 'apertura' | 'clausura';
  /** Cuántos ascienden (0 en la Divisional A). */
  promote: number;
  /** Cuántos descienden (0 en la última divisional, si aplica). */
  relegate: number;
  /** Tamaño de las copas de Oro y Bronce (Clausura): 4 arriba y 4 abajo. */
  cupSize: number;
}
export const DEFAULT_RULES: Rules = { phase: 'clausura', promote: 4, relegate: 4, cupSize: 4 };

export type GoalProbs = Record<Goal, number>; // 0..100
export interface ModelOptions {
  rules?: Rules;
  exactLimit?: number;      // por defecto 12 (3^12 = 531.441 hojas, ~1 s en el navegador)
  simulations?: number;     // Monte Carlo, por defecto 20.000
  seed?: number;
  /** P(gana el mejor ubicado) en partido único de copa, según posiciones 1-based. */
  knockoutWinProb?: (seedHigh: number, seedLow: number) => number;
}

export interface TeamResult {
  probs: GoalProbs;
  /** true en un objetivo = es matemáticamente seguro (100%), false = imposible (0%), null = depende. */
  certain: Record<Goal, boolean | null>;
  expectedPts: number;
}
export interface ModelResult {
  teams: Record<string, TeamResult>;
  mode: 'exact' | 'montecarlo';
  samples: number;
}

export interface FocusResult {
  /** Por cada partido restante y resultado: probabilidad del resultado y chances del equipo dado ese resultado. */
  byFixture: { fixture: number; outcome: 0 | 1 | 2; prob: number; probs: GoalProbs }[];
  /** Por cada puntaje final posible: probabilidad de terminar así y chances dadas. */
  byFinalPoints: { pts: number; prob: number; probs: GoalProbs; certain: Record<Goal, boolean | null> }[];
}

const DEFAULT_KO = (hi: number, lo: number) => Math.min(0.7, 0.5 + 0.03 * (lo - hi));

/** Probabilidad de que cada equipo de `bracket` (ordenado por posición) gane la copa. */
function cupWinProbs(bracket: number[], ko: (a: number, b: number) => number, seedOf: (t: number) => number): number[] {
  const n = bracket.length;
  if (n === 0) return [];
  if (n === 1) return [1];
  if (n === 2) {
    const p = ko(seedOf(bracket[0]), seedOf(bracket[1]));
    return [p, 1 - p];
  }
  // Llave de 4 (1º vs 4º, 2º vs 3º). Para 3 equipos: el 1º pasa directo a la final.
  if (n === 3) {
    const s = ko(seedOf(bracket[1]), seedOf(bracket[2]));
    const fin = (x: number) => ko(seedOf(bracket[0]), seedOf(x));
    const p0 = s * fin(bracket[1]) + (1 - s) * fin(bracket[2]);
    return [p0, s * (1 - fin(bracket[1])), (1 - s) * (1 - fin(bracket[2]))];
  }
  if (n === 4) {
    const [a, b, c, d] = bracket;
    const sAD = ko(seedOf(a), seedOf(d)), sBC = ko(seedOf(b), seedOf(c));
    const reach = [sAD, sBC, 1 - sBC, 1 - sAD];
    const other = [[b, c], [a, d], [a, d], [b, c]];
    const otherReach = [[sBC, 1 - sBC], [sAD, 1 - sAD], [sAD, 1 - sAD], [sBC, 1 - sBC]];
    return bracket.map((t, i) => {
      let w = 0;
      for (let k = 0; k < 2; k++) {
        const o = other[i][k];
        const pFinal = seedOf(t) < seedOf(o) ? ko(seedOf(t), seedOf(o)) : 1 - ko(seedOf(o), seedOf(t));
        w += otherReach[i][k] * pFinal;
      }
      return reach[i] * w;
    });
  }
  // Llaves más grandes (divisionales de 15 → Plata de 7): reparto simple por posición.
  const weights = bracket.map((_, i) => n - i);
  const sum = weights.reduce((x, y) => x + y, 0);
  return weights.map((w) => w / sum);
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const zero = (): number[] => [0, 0, 0, 0, 0, 0];

/**
 * Corre el modelo. `focusId` (opcional) agrega las vistas condicionadas de ese equipo.
 * Costo exacto: 3^n hojas × (orden de n equipos). Para 10 partidos y 10 equipos: ~60k hojas, < 100 ms.
 */
export function runModel(
  teams: TeamState[],
  fixtures: Fixture[],
  picks: Picks = {},
  opts: ModelOptions = {},
  focusId?: string,
): { result: ModelResult; focus?: FocusResult } {
  const rules = opts.rules ?? DEFAULT_RULES;
  const ko = opts.knockoutWinProb ?? DEFAULT_KO;
  const N = teams.length;
  const idx = new Map(teams.map((t, i) => [t.id, i]));
  const F = fixtures.map((f) => ({ a: idx.get(f.a)!, b: idx.get(f.b)!, p: f.p.map((x) => x / 100) }));
  const X = focusId != null ? idx.get(focusId) ?? -1 : -1;

  const acc = teams.map(zero);
  const min = teams.map(() => [1, 1, 1, 1, 1, 1]); // para "seguro"
  const max = teams.map(zero);
  const expPts = teams.map(() => 0);
  const cm = F.map(() => [0, 0, 0]);
  const cg = F.map(() => [zero(), zero(), zero()]);
  const bp = new Map<number, { m: number; g: number[]; min: number[]; max: number[] }>();

  const pts = teams.map((t) => t.pts);
  const dg = teams.map((t) => t.gf - t.gc);
  const gf = teams.map((t) => t.gf);
  const outs = new Array<number>(F.length);
  const order = teams.map((_, i) => i);
  let seedOf: (t: number) => number = () => 0;

  const goalsOf = (rank: number[], cupP: Map<number, number>[]) => {
    const g = teams.map(zero);
    const top = rules.phase === 'clausura' ? rules.cupSize : 0;
    rank.forEach((t, k) => {
      const v = g[t];
      if (k === 0) v[0] = 1;
      if (k < rules.promote) v[1] = 1;
      if (k >= N - rules.relegate) v[5] = 1;
      if (top) {
        if (k < top) v[2] = cupP[0].get(t) ?? 0;
        else if (k >= N - top) v[4] = cupP[2].get(t) ?? 0;
        else v[3] = cupP[1].get(t) ?? 0;
      }
    });
    return g;
  };

  const leaf = (p: number) => {
    // orden: puntos, DG, GF; empate total: por índice (TODO: enfrentamiento directo y sorteo)
    const rank = order.slice().sort((x, y) => pts[y] - pts[x] || dg[y] - dg[x] || gf[y] - gf[x] || x - y);
    const pos = new Array<number>(N);
    rank.forEach((t, k) => (pos[t] = k));
    seedOf = (t) => pos[t] + 1;
    const top = rules.cupSize;
    const cupP: Map<number, number>[] = [new Map(), new Map(), new Map()];
    if (rules.phase === 'clausura') {
      const brackets = [rank.slice(0, top), rank.slice(top, N - top), rank.slice(N - top)];
      brackets.forEach((br, c) => cupWinProbs(br, ko, seedOf).forEach((w, i) => cupP[c].set(br[i], w)));
    }
    const g = goalsOf(rank, cupP);
    for (let t = 0; t < N; t++) {
      expPts[t] += p * pts[t];
      for (let k = 0; k < 6; k++) {
        acc[t][k] += p * g[t][k];
        if (g[t][k] < min[t][k]) min[t][k] = g[t][k];
        if (g[t][k] > max[t][k]) max[t][k] = g[t][k];
      }
    }
    if (X >= 0) {
      const gx = g[X];
      for (let i = 0; i < F.length; i++) {
        const o = outs[i];
        cm[i][o] += p;
        for (let k = 0; k < 6; k++) cg[i][o][k] += p * gx[k];
      }
      const f = pts[X];
      let e = bp.get(f);
      if (!e) bp.set(f, (e = { m: 0, g: zero(), min: [1, 1, 1, 1, 1, 1], max: zero() }));
      e.m += p;
      for (let k = 0; k < 6; k++) {
        e.g[k] += p * gx[k];
        if (gx[k] < e.min[k]) e.min[k] = gx[k];
        if (gx[k] > e.max[k]) e.max[k] = gx[k];
      }
    }
  };

  const apply = (i: number, o: number, s: 1 | -1) => {
    const { a, b } = F[i];
    if (o === 0) { pts[a] += 3 * s; dg[a] += s; dg[b] -= s; gf[a] += s; }
    else if (o === 2) { pts[b] += 3 * s; dg[b] += s; dg[a] -= s; gf[b] += s; }
    else { pts[a] += s; pts[b] += s; }
  };

  const limit = opts.exactLimit ?? 12;
  let mode: ModelResult['mode'] = 'exact';
  let samples = 0;
  if (F.length <= limit) {
    const rec = (i: number, p: number) => {
      if (i === F.length) { leaf(p); samples++; return; }
      const pk = picks[i];
      for (let o = 0; o < 3; o++) {
        const q = pk == null ? F[i].p[o] : pk === o ? 1 : 0;
        if (!q) continue;
        outs[i] = o;
        apply(i, o, 1);
        rec(i + 1, p * q);
        apply(i, o, -1);
      }
    };
    rec(0, 1);
  } else {
    mode = 'montecarlo';
    const n = opts.simulations ?? 20000;
    const rnd = mulberry32(opts.seed ?? 20261020);
    for (let s = 0; s < n; s++) {
      for (let i = 0; i < F.length; i++) {
        const pk = picks[i];
        let o: number;
        if (pk != null) o = pk;
        else { const r = rnd(); o = r < F[i].p[0] ? 0 : r < F[i].p[0] + F[i].p[1] ? 1 : 2; }
        outs[i] = o;
        apply(i, o, 1);
      }
      leaf(1 / n);
      for (let i = 0; i < F.length; i++) apply(i, outs[i], -1);
    }
    samples = n;
  }

  const toProbs = (v: number[], m = 1): GoalProbs =>
    Object.fromEntries(GOALS.map((g, k) => [g, m ? (100 * v[k]) / m : 0])) as GoalProbs;
  const certainOf = (mn: number[], mx: number[]) =>
    Object.fromEntries(GOALS.map((g, k) => [g, mode === 'exact' ? (mn[k] >= 1 ? true : mx[k] <= 0 ? false : null) : null])) as Record<Goal, boolean | null>;

  const result: ModelResult = {
    mode,
    samples,
    teams: Object.fromEntries(
      teams.map((t, i) => [t.id, { probs: toProbs(acc[i]), certain: certainOf(min[i], max[i]), expectedPts: expPts[i] }]),
    ),
  };

  let focus: FocusResult | undefined;
  if (X >= 0) {
    focus = {
      byFixture: F.flatMap((_, i) =>
        ([0, 1, 2] as const).filter((o) => cm[i][o] > 0).map((o) => ({ fixture: i, outcome: o, prob: 100 * cm[i][o], probs: toProbs(cg[i][o], cm[i][o]) })),
      ),
      byFinalPoints: [...bp.entries()]
        .sort((x, y) => x[0] - y[0])
        .map(([f, e]) => ({ pts: f, prob: 100 * e.m, probs: toProbs(e.g, e.m), certain: certainOf(e.min, e.max) })),
    };
  }
  return { result, focus };
}

/**
 * «Partidos de otros que más te importan»: para cada partido ajeno, el resultado que más mueve
 * la chance `goal` del equipo en foco. Devuelve los `top` de mayor impacto (en puntos porcentuales).
 */
export function mattersMost(
  focus: FocusResult,
  fixtures: Fixture[],
  teamId: string,
  goal: Goal,
  base: number,
  top = 3,
) {
  const best = new Map<number, { outcome: 0 | 1 | 2; delta: number }>();
  for (const r of focus.byFixture) {
    const f = fixtures[r.fixture];
    if (f.a === teamId || f.b === teamId) continue;
    const delta = r.probs[goal] - base;
    const cur = best.get(r.fixture);
    if (!cur || Math.abs(delta) > Math.abs(cur.delta)) best.set(r.fixture, { outcome: r.outcome, delta });
  }
  return [...best.entries()]
    .filter(([, v]) => Math.abs(v.delta) >= 0.1)
    .sort((x, y) => Math.abs(y[1].delta) - Math.abs(x[1].delta))
    .slice(0, top)
    .map(([fixture, v]) => ({ fixture, ...v }));
}

/** Objetivo principal que se muestra en grande en la ficha (regla del diseño). */
export function mainGoal(p: GoalProbs): Goal {
  if (p.camp >= 10) return 'camp';
  if (p.desc >= 50) return 'desc';
  if (p.asc >= 10) return 'asc';
  if (p.desc >= 10) return 'desc';
  return 'plata';
}
