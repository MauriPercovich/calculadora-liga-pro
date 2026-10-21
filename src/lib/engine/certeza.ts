import type { Divisional, Reglamento } from "./types";

/** Por equipo: 1 = seguro que pasa, 0 = imposible, null = depende de lo que falta. */
export type Certeza = (0 | 1 | null)[];
export interface Certezas {
  arriba: Certeza; // termina entre los 4 primeros (Copa de Oro en el Clausura)
  asciende: Certeza;
  desciende: Certeza;
  primero: Certeza; // termina 1º
  /** Con enumeración exacta: por equipo y puntaje final, si el objetivo pasa seguro (1) o nunca (0). */
  porPuntos: Record<number, { arriba: 0 | 1 | null; asciende: 0 | 1 | null; desciende: 0 | 1 | null; primero: 0 | 1 | null }>[] | null;
}

/**
 * Qué está matemáticamente definido. No sabemos los goles futuros, así que un empate en puntos
 * puede romperse para cualquier lado: solo es "seguro" si vale aun perdiendo todos los desempates.
 * Con 12 partidos o menos recorre todas las combinaciones (3^n); si quedan más, usa cotas
 * (máximo y mínimo de puntos posibles), que son más conservadoras pero nunca afirman de más.
 */
export function calcularCertezas(div: Divisional, reg: Reglamento, maxEnumerar = 12): Certezas {
  const ids = div.equipos.map((e) => e.id);
  const N = ids.length;
  const ix = new Map(ids.map((id, i) => [id, i]));
  const base = new Array(N).fill(0);
  for (const f of div.tablaOficial) {
    const i = ix.get(f.equipoId);
    if (i !== undefined) base[i] = f.pts;
  }
  const rest = div.partidos.filter((p) => p.fase === "regular" && (p.golesA === null || p.golesB === null)).map((p) => [ix.get(p.a)!, ix.get(p.b)!] as const);

  const K = 4;
  // siempre[o][t] / nunca[o][t]: si en todas las combinaciones vistas pasó o no pasó.
  const visto = { arriba: [new Array(N).fill(true), new Array(N).fill(true)], asciende: [new Array(N).fill(true), new Array(N).fill(true)], desciende: [new Array(N).fill(true), new Array(N).fill(true)], primero: [new Array(N).fill(true), new Array(N).fill(true)] };
  type Par = [boolean, boolean]; // [siempre, nunca]
  const porPts: Record<number, Record<keyof typeof visto, Par>>[] = Array.from({ length: N }, () => ({}));
  const registrar = (pts: number[]) => {
    for (let t = 0; t < N; t++) {
      const celda = (porPts[t][pts[t]] ??= { arriba: [true, true], asciende: [true, true], desciende: [true, true], primero: [true, true] });
      let mayores = 0; // estrictamente arriba
      let mayoresOIguales = 0; // arriba o empatados (sin contarse)
      for (let j = 0; j < N; j++) {
        if (j === t) continue;
        if (pts[j] > pts[t]) mayores++;
        if (pts[j] >= pts[t]) mayoresOIguales++;
      }
      const mejor = mayores; // mejor puesto posible (0 = 1º)
      const peor = mayoresOIguales; // peor puesto posible
      const marcar = (o: keyof typeof visto, segura: boolean, posible: boolean) => {
        if (!segura) visto[o][0][t] = celda[o][0] = false; // no siempre pasa
        if (posible) visto[o][1][t] = celda[o][1] = false; // no nunca pasa
      };
      marcar("arriba", peor < K, mejor < K);
      marcar("asciende", reg.ascensos > 0 && peor < reg.ascensos, reg.ascensos > 0 && mejor < reg.ascensos);
      marcar("desciende", mejor >= N - reg.descensos, peor >= N - reg.descensos);
      marcar("primero", peor === 0, mejor === 0);
    }
  };

  const exacto = rest.length <= maxEnumerar;
  if (exacto) {
    const pts = base.slice();
    const rec = (k: number) => {
      if (k === rest.length) return registrar(pts);
      const [a, b] = rest[k];
      pts[a] += 3; rec(k + 1); pts[a] -= 3;
      pts[a] += 1; pts[b] += 1; rec(k + 1); pts[a] -= 1; pts[b] -= 1;
      pts[b] += 3; rec(k + 1); pts[b] -= 3;
    };
    rec(0);
  } else {
    // Cotas: cada equipo entre lo que tiene y lo que tiene + 3 por partido que le queda.
    const quedan = new Array(N).fill(0);
    for (const [a, b] of rest) {
      quedan[a]++;
      quedan[b]++;
    }
    const max = base.map((p, i) => p + 3 * quedan[i]);
    for (let t = 0; t < N; t++) {
      let puedenPasarlo = 0; // pueden terminar igual o arriba de t aunque t gane todo... (peor caso de t)
      let seguroArriba = 0; // terminan arriba de t aunque t gane todo
      for (let j = 0; j < N; j++) {
        if (j === t) continue;
        if (max[j] >= base[t]) puedenPasarlo++;
        if (base[j] > max[t]) seguroArriba++;
      }
      const peor = puedenPasarlo; // peor puesto posible
      const mejor = seguroArriba; // mejor puesto posible
      const fijar = (o: keyof typeof visto, segura: boolean, posible: boolean) => {
        visto[o][0][t] = segura;
        visto[o][1][t] = !posible;
      };
      fijar("arriba", peor < K, mejor < K);
      fijar("asciende", reg.ascensos > 0 && peor < reg.ascensos, reg.ascensos > 0 && mejor < reg.ascensos);
      fijar("desciende", mejor >= N - reg.descensos, peor >= N - reg.descensos);
      fijar("primero", peor === 0, mejor === 0);
    }
  }

  const out = (o: keyof typeof visto): Certeza => ids.map((_, t) => (visto[o][0][t] ? 1 : visto[o][1][t] ? 0 : null));
  const de = ([siempre, nunca]: Par): 0 | 1 | null => (siempre ? 1 : nunca ? 0 : null);
  return {
    arriba: out("arriba"),
    asciende: out("asciende"),
    desciende: out("desciende"),
    primero: out("primero"),
    porPuntos: exacto
      ? porPts.map((m) => Object.fromEntries(Object.entries(m).map(([k, c]) => [k, { arriba: de(c.arriba), asciende: de(c.asciende), desciende: de(c.desciende), primero: de(c.primero) }])))
      : null,
  };
}
