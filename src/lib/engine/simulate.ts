import { golesEsperados, poisson, rng, type ModeloGoles } from "./model";
import type { Divisional, Objetivo, Partido, Reglamento, ResultadoSimulacion } from "./types";

const OBJETIVOS: Objetivo[] = ["campeon", "asciende", "copaOro", "copaPlata", "copaBronce", "desciende", "zonaOro", "zonaPlata", "zonaBronce", "desempate"];

export interface OpcionesSimulacion {
  n: number;
  semilla?: number;
  /** resultados elegidos por el usuario: id de partido -> 0 gana a, 1 empate, 2 gana b */
  fijados?: Record<number, 0 | 1 | 2>;
}

/**
 * Monte Carlo de una divisional: tabla oficial + partidos restantes simulados = tabla final,
 * y después la definición que corresponda (Apertura: campeón directo; Clausura: copas).
 */
export function simular(div: Divisional, reg: Reglamento, modelo: ModeloGoles, op: OpcionesSimulacion): ResultadoSimulacion {
  const r = rng(op.semilla ?? 7);
  const ids = div.equipos.map((e) => e.id);
  const N = ids.length;
  const ix = new Map(ids.map((id, i) => [id, i]));
  const regulares = div.partidos.filter((p) => p.fase === "regular");
  const jugados = regulares.filter((p) => p.golesA !== null && p.golesB !== null);
  const restantes = regulares.filter((p) => p.golesA === null || p.golesB === null);

  // Base: la tabla oficial manda (incluye sanciones y correcciones de la Liga).
  const basePts = new Array(N).fill(0);
  const baseGd = new Array(N).fill(0);
  const baseGf = new Array(N).fill(0);
  for (const f of div.tablaOficial) {
    const i = ix.get(f.equipoId);
    if (i === undefined) continue;
    basePts[i] = f.pts;
    baseGd[i] = f.gf - f.gc;
    baseGf[i] = f.gf;
  }
  // Enfrentamiento directo: puntos que sacó cada uno contra el otro.
  const baseH2h = Array.from({ length: N }, () => new Array(N).fill(0));
  const sumarH2h = (H: number[][], a: number, b: number, x: number, y: number) => {
    if (x > y) H[a][b] += 3;
    else if (x < y) H[b][a] += 3;
    else {
      H[a][b] += 1;
      H[b][a] += 1;
    }
  };
  for (const p of jugados) sumarH2h(baseH2h, ix.get(p.a)!, ix.get(p.b)!, p.golesA!, p.golesB!);

  const L = restantes.map((p) => [golesEsperados(modelo, p.a, p.b), golesEsperados(modelo, p.b, p.a)] as const);
  const lam = (a: number, b: number) => golesEsperados(modelo, ids[a], ids[b]);

  // Partido único con penales (50 y 50) si termina igualado.
  const unico = (a: number, b: number) => {
    const x = poisson(lam(a, b), r);
    const y = poisson(lam(b, a), r);
    return x > y ? a : x < y ? b : r() < 0.5 ? a : b;
  };
  const llave4 = (t: number[]) => unico(unico(t[0], t[3]), unico(t[1], t[2]));
  const llave = (t: number[]) => {
    if (t.length === 0) return -1;
    if (t.length === 1) return t[0];
    if (t.length === 2) return unico(t[0], t[1]);
    if (t.length === 3) return unico(t[0], unico(t[1], t[2]));
    return llave4(t.slice(0, 4));
  };

  const cuenta: Record<Objetivo, number[]> = Object.fromEntries(OBJETIVOS.map((o) => [o, new Array(N).fill(0)])) as Record<Objetivo, number[]>;
  const ptsSum = new Array(N).fill(0);
  const posicion = Array.from({ length: N }, () => new Array(N).fill(0));
  const porPuntos: Record<number, [number, number, number, number]>[] = Array.from({ length: N }, () => ({}));
  const condicional = restantes.map(() =>
    [0, 1, 2].map(() => ({ n: 0, asciende: new Array(N).fill(0), desciende: new Array(N).fill(0), campeon: new Array(N).fill(0) })),
  );

  for (let s = 0; s < op.n; s++) {
    const pts = basePts.slice();
    const gd = baseGd.slice();
    const gf = baseGf.slice();
    const H = baseH2h.map((f) => f.slice());
    const salida = new Array<number>(restantes.length);

    restantes.forEach((p, k) => {
      const a = ix.get(p.a)!;
      const b = ix.get(p.b)!;
      const fijo = op.fijados?.[p.id];
      let x: number;
      let y: number;
      do {
        x = poisson(L[k][0], r);
        y = poisson(L[k][1], r);
      } while (fijo !== undefined && !((fijo === 0 && x > y) || (fijo === 1 && x === y) || (fijo === 2 && x < y)));
      salida[k] = x > y ? 0 : x === y ? 1 : 2;
      gf[a] += x;
      gf[b] += y;
      gd[a] += x - y;
      gd[b] += y - x;
      if (x > y) pts[a] += 3;
      else if (x < y) pts[b] += 3;
      else {
        pts[a] += 1;
        pts[b] += 1;
      }
      sumarH2h(H, a, b, x, y);
    });

    // Desempate: diferencia de gol, goles a favor, enfrentamiento directo, sorteo.
    const sorteo = Array.from({ length: N }, () => r());
    const orden = [...Array(N).keys()].sort(
      (p, q) => pts[q] - pts[p] || gd[q] - gd[p] || gf[q] - gf[p] || H[q][p] - H[p][q] || sorteo[q] - sorteo[p],
    );
    orden.forEach((t, pos) => posicion[t][pos]++);

    const sube = orden.slice(0, reg.ascensos);
    const baja = orden.slice(N - reg.descensos);
    let campeon: number;

    if (div.categoria === "Apertura") {
      // Campeón el 1º; si hay igualdad en puntos por el 1º puesto, final de desempate.
      const empatados = orden.filter((t) => pts[t] === pts[orden[0]]);
      if (reg.finalDesempatePrimero && empatados.length > 1) {
        campeon = llave(empatados);
        empatados.forEach((t) => cuenta.desempate[t]++);
      } else campeon = orden[0];
    } else {
      // Clausura: Oro (4 primeros), Bronce (4 últimos), Plata (el resto).
      const oro = orden.slice(0, reg.tamanoCopa);
      const bronce = orden.slice(N - reg.tamanoCopa);
      const plata = orden.slice(reg.tamanoCopa, N - reg.tamanoCopa);
      const ganaOro = llave4(oro);
      // El 1º tiene lugar asegurado en la final por la divisional.
      campeon = ganaOro === oro[0] ? oro[0] : unico(ganaOro, oro[0]);
      const ganaPlata = llave(plata);
      const ganaBronce = llave4(bronce);
      cuenta.copaOro[ganaOro]++;
      if (ganaPlata >= 0) cuenta.copaPlata[ganaPlata]++;
      cuenta.copaBronce[ganaBronce]++;
      oro.forEach((t) => cuenta.zonaOro[t]++);
      plata.forEach((t) => cuenta.zonaPlata[t]++);
      bronce.forEach((t) => cuenta.zonaBronce[t]++);
    }

    cuenta.campeon[campeon]++;
    sube.forEach((t) => cuenta.asciende[t]++);
    baja.forEach((t) => cuenta.desciende[t]++);

    for (let t = 0; t < N; t++) {
      ptsSum[t] += pts[t];
      const h = (porPuntos[t][pts[t]] ??= [0, 0, 0, 0]);
      h[0]++;
      if (sube.includes(t)) h[1]++;
      if (baja.includes(t)) h[2]++;
      if (campeon === t) h[3]++;
    }
    salida.forEach((o, k) => {
      const c = condicional[k][o];
      c.n++;
      sube.forEach((t) => c.asciende[t]++);
      baja.forEach((t) => c.desciende[t]++);
      c.campeon[campeon]++;
    });
  }

  const prob = Object.fromEntries(OBJETIVOS.map((o) => [o, cuenta[o].map((x) => x / op.n)])) as Record<Objetivo, number[]>;
  return {
    n: op.n,
    prob,
    puntosEsperados: ptsSum.map((x) => x / op.n),
    posicion: posicion.map((f) => f.map((x) => x / op.n)),
    porPuntos,
    condicional,
  };
}

/** Partidos de la fase regular que faltan, en el orden en que los simula el motor. */
export const partidosRestantes = (div: Divisional): Partido[] =>
  div.partidos.filter((p) => p.fase === "regular" && (p.golesA === null || p.golesB === null));
