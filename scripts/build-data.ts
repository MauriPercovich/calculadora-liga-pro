// Convierte data/raw/ (lo que baja scripts/import.mjs) en los archivos que usa la web:
//   public/data/index.json                 series, divisionales y equipos del torneo en curso
//   public/data/divisionales/{id}.json     tabla, partidos, sanciones y probabilidades ya calculadas
// Uso: npx tsx scripts/build-data.ts

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { ajustarGoles, probabilidades } from "../src/lib/engine/model";
import { simular, partidosRestantes } from "../src/lib/engine/simulate";
import { calcularCertezas } from "../src/lib/engine/certeza";
import { reglamentoDe, type Categoria, type Divisional, type Equipo, type FilaTabla, type Partido, type Sancion, type Seguro } from "../src/lib/engine/types";

const RAW = path.resolve("data/raw");
const OUT = path.resolve("public/data");
const N_SIM = 20000;

/* ---------- utilidades ---------- */
const leer = async <T>(p: string): Promise<T | null> => {
  try {
    return JSON.parse(await readFile(p, "utf8")) as T;
  } catch {
    return null;
  }
};
const limpiar = (s: string) => String(s ?? "").replace(/\s+/g, " ").trim();
const clave = (s: string) => limpiar(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const isoDe = (ddmmyyyy: string | null | undefined): string | null => {
  const m = String(ddmmyyyy ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};
const slugDe = (s: string) =>
  clave(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* ---------- tipos crudos de la API ---------- */
interface RawDetail { id: number; name: string; start_at: string; finish_at: string; serie_name: string; divisional_name: string; category_name: string }
interface RawPos { id: number; name: string; slug: string; logo: string | null; points: number; games: number; games_won: number; games_tied: number; games_lost: number; goals_for: number; goals_against: number }
interface RawGame { id: number; local_team_name: string; visiting_team_name: string; local_team_result: number | null; visiting_team_result: number | null; date: string; hour: string; stadium: string | null; groupweek_name: string; groupweek_order: number; groupweek_date: string }
interface RawPen { name: string; team_id: number; team: string; type: string; duration: number; pending: number; status: string }

export interface Aviso { torneoId: number; tipo: string; detalle: string }
const avisos: Aviso[] = [];

/* ---------- normalización ---------- */
function anioDe(d: RawDetail): number {
  const m = d.name.match(/(20\d\d)/);
  return m ? Number(m[1]) : Number(d.start_at.slice(-4));
}

function faseDe(nombreFecha: string): Partido["fase"] | null {
  const n = clave(nombreFecha);
  if (/^jornada\s*\d+/.test(n) || /^fecha\s*\d+/.test(n)) return "regular";
  if (/desempate/.test(n)) return "desempate";
  if (/oro/.test(n)) return "oro";
  if (/plata/.test(n)) return "plata";
  if (/bronce/.test(n)) return "bronce";
  if (/final|semi|cuartos|octavos|16vos/.test(n)) return "final";
  return null;
}

async function normalizar(id: number): Promise<Divisional | null> {
  const dir = path.join(RAW, String(id));
  const d = await leer<RawDetail>(path.join(dir, "detail.json"));
  // La tabla viene en dos formatos: con grupos (data: [{ name, positions }]) o plana (data: [filas]).
  const pos = await leer<{ has_groups?: boolean; data: ({ name: string; positions: RawPos[] } | RawPos)[] }>(path.join(dir, "positions.json"));
  const games = (await leer<RawGame[]>(path.join(dir, "games.json"))) ?? [];
  const pens = (await leer<{ data: RawPen[] }>(path.join(dir, "penalizations.json")))?.data ?? [];
  if (!d || !pos?.data?.length) return null;

  const grupos = pos.data.every((g) => "positions" in g)
    ? (pos.data as { name: string; positions: RawPos[] }[])
    : [{ name: d.divisional_name, positions: pos.data as RawPos[] }];
  const grupo = grupos.find((g) => clave(g.name).endsWith(clave(d.divisional_name))) ?? grupos[0];
  if (!grupo?.positions?.length) return null;
  const equipos: Equipo[] = grupo.positions.map((p) => ({ id: p.id, nombre: limpiar(p.name), slug: p.slug || slugDe(p.name), escudo: p.logo }));
  const porNombre = new Map(equipos.map((e) => [clave(e.nombre), e.id]));
  const tablaOficial: FilaTabla[] = grupo.positions.map((p) => ({ equipoId: p.id, pts: p.points, pj: p.games, pg: p.games_won, pe: p.games_tied, pp: p.games_lost, gf: p.goals_for, gc: p.goals_against }));

  const partidos: Partido[] = [];
  for (const g of games) {
    const fase = faseDe(g.groupweek_name);
    if (!fase) {
      avisos.push({ torneoId: id, tipo: "fecha-desconocida", detalle: g.groupweek_name });
      continue;
    }
    const a = porNombre.get(clave(g.local_team_name));
    const b = porNombre.get(clave(g.visiting_team_name));
    if (a === undefined || b === undefined) {
      avisos.push({ torneoId: id, tipo: "equipo-desconocido", detalle: `${g.local_team_name} vs ${g.visiting_team_name}` });
      continue;
    }
    // La fecha del partido a veces viene con el año mal (p. ej. 2016): usamos la de la jornada si no coinciden en año.
    let dia = isoDe(g.date);
    const diaJornada = isoDe(g.groupweek_date);
    if (dia && diaJornada && dia.slice(0, 4) !== diaJornada.slice(0, 4)) {
      avisos.push({ torneoId: id, tipo: "anio-corregido", detalle: `${g.date} -> ${g.groupweek_date} (${g.local_team_name} vs ${g.visiting_team_name})` });
      dia = diaJornada;
    }
    const numero = Number(clave(g.groupweek_name).match(/\d+/)?.[0] ?? g.groupweek_order);
    partidos.push({
      id: g.id,
      fecha: fase === "regular" ? numero : 100 + g.groupweek_order,
      dia,
      hora: g.hour && g.hour !== "00:00" ? g.hour.slice(0, 5) : null,
      cancha: g.stadium ? limpiar(g.stadium) : null,
      a,
      b,
      golesA: g.local_team_result,
      golesB: g.visiting_team_result,
      fase,
    });
  }
  partidos.sort((x, y) => x.fecha - y.fecha || (x.dia ?? "").localeCompare(y.dia ?? "") || (x.hora ?? "").localeCompare(y.hora ?? ""));

  const sanciones: Sancion[] = pens
    .filter((p) => equipos.some((e) => e.id === p.team_id))
    .map((p) => ({ jugador: limpiar(p.name).replace(/\b(\p{L})(\p{L}*)/gu, (_, a: string, b: string) => a.toUpperCase() + b.toLowerCase()), equipoId: p.team_id, tipo: p.type, fechas: p.duration, pendientes: p.pending, estado: p.status }));

  // Control: la tabla oficial contra la suma de resultados regulares.
  const suma = new Map<number, number>();
  for (const p of partidos) {
    if (p.fase !== "regular" || p.golesA === null || p.golesB === null) continue;
    const [x, y] = [p.golesA, p.golesB];
    suma.set(p.a, (suma.get(p.a) ?? 0) + (x > y ? 3 : x === y ? 1 : 0));
    suma.set(p.b, (suma.get(p.b) ?? 0) + (y > x ? 3 : x === y ? 1 : 0));
  }
  for (const f of tablaOficial) {
    const calc = suma.get(f.equipoId) ?? 0;
    if (calc !== f.pts) avisos.push({ torneoId: id, tipo: "ajuste-de-puntos", detalle: `${equipos.find((e) => e.id === f.equipoId)?.nombre}: oficial ${f.pts}, por resultados ${calc}` });
  }

  return {
    torneoId: id,
    serie: limpiar(d.serie_name),
    divisional: limpiar(d.divisional_name).toUpperCase(),
    categoria: limpiar(d.category_name) as Categoria,
    anio: anioDe(d),
    esPrimera: limpiar(d.divisional_name).toUpperCase() === "A",
    esUltima: false, // se completa abajo, mirando las demás divisionales de la serie
    equipos,
    partidos,
    tablaOficial,
    sanciones,
  };
}

/* ---------- cálculo por divisional ---------- */
function calcular(div: Divisional) {
  const ids = div.equipos.map((e) => e.id);
  const reg = reglamentoDe(div);
  const regulares = div.partidos.filter((p) => p.fase === "regular");
  const jugados = regulares.filter((p) => p.golesA !== null);
  const ultimaJugada = jugados.reduce((m, p) => Math.max(m, p.fecha), 0);
  const totalFechas = regulares.reduce((m, p) => Math.max(m, p.fecha), 0);

  const modelo = ajustarGoles(jugados, ids);
  const ahora = simular(div, reg, modelo, { n: N_SIM, semilla: 11 });

  // Lo que ya está definido de verdad (no por redondeo de las simulaciones).
  const cz = calcularCertezas(div, reg);
  const clausura = div.categoria === "Clausura";
  const no = (c: 0 | 1 | null) => (c === 0 ? 0 : null);
  const zonaPlata = ids.map((_, t) => (cz.arriba[t] === 1 || cz.desciende[t] === 1 ? 0 : cz.arriba[t] === 0 && cz.desciende[t] === 0 ? 1 : null));
  const seguro: Seguro = {
    asciende: reg.ascensos > 0 ? cz.asciende : ids.map(() => 0),
    desciende: cz.desciende,
    campeon: clausura ? cz.arriba.map(no) : cz.primero.map((c) => (c === 0 ? 0 : c === 1 && !reg.finalDesempatePrimero ? 1 : null)),
    ...(clausura
      ? {
          zonaOro: cz.arriba,
          zonaBronce: cz.desciende,
          zonaPlata,
          copaOro: cz.arriba.map(no),
          copaBronce: cz.desciende.map(no),
          copaPlata: reg.plataSinFormato ? ids.map(() => null) : zonaPlata.map(no),
        }
      : {}),
  };
  // Las simulaciones nunca contradicen lo seguro.
  for (const [o, lista] of Object.entries(seguro) as [keyof typeof ahora.prob, (0 | 1 | null)[]][]) {
    lista.forEach((c, t) => {
      if (c === 0) ahora.prob[o][t] = 0;
      if (c === 1) ahora.prob[o][t] = 1;
    });
  }

  // Probabilidad "antes del partido": modelo con lo jugado hasta la fecha anterior.
  const antes: Record<number, [number, number, number]> = {};
  for (let f = 1; f <= ultimaJugada; f++) {
    const m = ajustarGoles(jugados.filter((p) => p.fecha < f), ids);
    for (const p of jugados.filter((q) => q.fecha === f)) antes[p.id] = probabilidades(m, p.a, p.b);
  }
  const proximos = Object.fromEntries(partidosRestantes(div).map((p) => [p.id, probabilidades(modelo, p.a, p.b)]));

  // Evolución: cómo estaban las chances después de cada fecha (tabla rearmada con los resultados hasta ahí).
  const evolucion: { fecha: number; asciende: number[]; desciende: number[]; campeon: number[] }[] = [];
  for (let f = 0; f <= ultimaJugada; f++) {
    if (f === ultimaJugada) {
      evolucion.push({ fecha: f, asciende: ahora.prob.asciende, desciende: ahora.prob.desciende, campeon: ahora.prob.campeon });
      continue;
    }
    const corte = { ...div, partidos: div.partidos.map((p) => (p.fase === "regular" && p.fecha > f ? { ...p, golesA: null, golesB: null } : p)) };
    corte.tablaOficial = tablaDesde(corte);
    const s = simular(corte, reg, ajustarGoles(jugados.filter((p) => p.fecha <= f), ids), { n: 3000, semilla: 21 + f });
    evolucion.push({ fecha: f, asciende: s.prob.asciende, desciende: s.prob.desciende, campeon: s.prob.campeon });
  }

  // Lo más picante: los partidos de la última fecha que más movieron las chances.
  const picantes: { partido: Partido; antes: [number, number, number] | null; cambios: { equipoId: number; objetivo: string; de: number; a: number }[]; max: number }[] = [];
  if (evolucion.length >= 2) {
    const ahoraEv = evolucion[evolucion.length - 1];
    const antesEv = evolucion[evolucion.length - 2];
    const objetivos = (div.esPrimera ? ["campeon", "desciende"] : ["campeon", "asciende", "desciende"]) as ("campeon" | "asciende" | "desciende")[];
    const ixDe = new Map(ids.map((id, k) => [id, k]));
    for (const p of jugados.filter((q) => q.fecha === ultimaJugada)) {
      const cambios = [p.a, p.b]
        .flatMap((eqId) => objetivos.map((o) => ({ equipoId: eqId, objetivo: o, de: antesEv[o][ixDe.get(eqId)!], a: ahoraEv[o][ixDe.get(eqId)!] })))
        .filter((c) => Math.abs(c.a - c.de) >= 0.01)
        .sort((x, y) => Math.abs(y.a - y.de) - Math.abs(x.a - x.de))
        // un movimiento por equipo: el más grande de cada uno
        .filter((c, k, arr) => arr.findIndex((z) => z.equipoId === c.equipoId) === k)
        .slice(0, 2);
      if (cambios.length) picantes.push({ partido: p, antes: antes[p.id] ?? null, cambios, max: Math.abs(cambios[0].a - cambios[0].de) });
    }
    picantes.sort((x, y) => y.max - x.max);
  }

  return {
    reglamento: reg,
    seguro,
    certezaPuntos: cz.porPuntos,
    picantes,
    ultimaJugada,
    totalFechas,
    modelo: { mu: modelo.mu, ataque: ids.map((i) => modelo.ataque.get(i)!), defensa: ids.map((i) => modelo.defensa.get(i)!) },
    simulacion: ahora,
    antes,
    proximos,
    evolucion,
  };
}

/** Tabla armada solo con resultados (para cortes en fechas pasadas, donde no hay tabla oficial). */
function tablaDesde(div: Divisional): FilaTabla[] {
  const t = new Map(div.equipos.map((e) => [e.id, { equipoId: e.id, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 }]));
  for (const p of div.partidos) {
    if (p.fase !== "regular" || p.golesA === null || p.golesB === null) continue;
    const A = t.get(p.a)!;
    const B = t.get(p.b)!;
    A.pj++;
    B.pj++;
    A.gf += p.golesA;
    A.gc += p.golesB;
    B.gf += p.golesB;
    B.gc += p.golesA;
    if (p.golesA > p.golesB) {
      A.pts += 3;
      A.pg++;
      B.pp++;
    } else if (p.golesA < p.golesB) {
      B.pts += 3;
      B.pg++;
      A.pp++;
    } else {
      A.pts++;
      B.pts++;
      A.pe++;
      B.pe++;
    }
  }
  return [...t.values()];
}

/* ---------- principal ---------- */
async function main() {
  const ids = (await readdir(RAW, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => Number(e.name));
  const todas = (await Promise.all(ids.map(normalizar))).filter((d): d is Divisional => d !== null);

  // Última divisional de cada serie (por torneo): marca descenso igual, según el reglamento.
  const grupos = new Map<string, Divisional[]>();
  for (const d of todas) {
    const k = `${d.serie}|${d.categoria}|${d.anio}`;
    grupos.set(k, [...(grupos.get(k) ?? []), d]);
  }
  for (const g of grupos.values()) {
    const ultima = g.map((d) => d.divisional).sort().at(-1);
    g.forEach((d) => (d.esUltima = d.divisional === ultima));
  }

  // Torneo en curso = el más reciente (año y categoría) que tiene partidos.
  const conPartidos = todas.filter((d) => d.partidos.some((p) => p.fase === "regular"));
  const orden = (d: Divisional) => d.anio * 10 + (d.categoria === "Clausura" ? 2 : 1);
  const actual = Math.max(...conPartidos.map(orden));
  const enCurso = conPartidos.filter((d) => orden(d) === actual);

  await mkdir(path.join(OUT, "divisionales"), { recursive: true });
  const indice = [];
  for (const div of enCurso.sort((a, b) => Number(a.serie) - Number(b.serie) || a.divisional.localeCompare(b.divisional))) {
    const t0 = Date.now();
    const calc = calcular(div);
    await writeFile(path.join(OUT, "divisionales", `${div.torneoId}.json`), JSON.stringify({ ...div, ...calc }));
    indice.push({
      torneoId: div.torneoId,
      serie: div.serie,
      divisional: div.divisional,
      categoria: div.categoria,
      anio: div.anio,
      ultimaJugada: calc.ultimaJugada,
      totalFechas: calc.totalFechas,
      esPrimera: div.esPrimera,
      jugados: div.partidos.filter((p) => p.fase === "regular" && p.golesA !== null).length,
      restantes: div.partidos.filter((p) => p.fase === "regular" && p.golesA === null).length,
      picantes: calc.picantes.slice(0, 4),
      // en el orden de la tabla oficial: pos = puesto de hoy
      equipos: [...div.tablaOficial]
        .sort((x, y) => y.pts - x.pts || y.gf - y.gc - (x.gf - x.gc) || y.gf - x.gf)
        .map((f, k) => {
          const e = div.equipos.find((q) => q.id === f.equipoId)!;
          return { id: e.id, nombre: e.nombre, slug: e.slug, escudo: e.escudo, pos: k + 1, pts: f.pts };
        }),
    });
    console.log(`Serie ${div.serie} · Div ${div.divisional}: ${div.equipos.length} equipos, fecha ${calc.ultimaJugada}/${calc.totalFechas} (${Date.now() - t0} ms)`);
  }
  const historicas = todas.filter((d) => orden(d) !== actual).length;
  await writeFile(
    path.join(OUT, "index.json"),
    JSON.stringify({ actualizado: new Date().toISOString(), torneo: `${enCurso[0]?.categoria} ${enCurso[0]?.anio}`, divisionales: indice, historicas }, null, 1),
  );
  await writeFile(path.join(OUT, "avisos.json"), JSON.stringify(avisos, null, 1));
  console.log(`Listo: ${indice.length} divisionales en curso, ${historicas} históricas, ${avisos.length} avisos de datos`);
}

if (!existsSync(RAW)) {
  console.error("Falta data/raw: correr antes `node scripts/import.mjs`");
  process.exit(1);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
