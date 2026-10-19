// Descarga los datos públicos de ligapro.uy y los guarda en data/raw/.
// Uso: node scripts/import.mjs [--desde 2024] [--solo-actual]
//
// Endpoints (relevados el 19/10/2026):
//   GET /api/tournaments                         lista de campeonatos
//   GET /api/tournaments/{id}                    detalle: serie, divisional, categoría
//   GET /api/tournaments/{id}/positions          tabla oficial
//   GET /api/tournaments/{id}/groupweeks         fechas
//   GET /api/tournaments/{id}/games?filter[groupweek][0]={fecha}
//   GET /api/tournaments/{id}/penalizations      sancionados

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE = "https://www.ligapro.uy/api";
const OUT = path.resolve("data/raw");
const args = process.argv.slice(2);
const DESDE = Number(args[args.indexOf("--desde") + 1]) || 2024;
const SOLO_ACTUAL = args.includes("--solo-actual");
// La API limita a unos 60 pedidos por minuto: vamos de a uno, con pausa, y si igual llega un 429 esperamos que se libere la ventana.
const CONCURRENCIA = 1;
const PAUSA_MS = 1100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ultimo = 0;
async function get(url, intentos = 6) {
  for (let i = 1; i <= intentos; i++) {
    const espera = ultimo + PAUSA_MS - Date.now();
    if (espera > 0) await sleep(espera);
    ultimo = Date.now();
    try {
      const res = await fetch(BASE + url, { headers: { accept: "application/json" } });
      if (res.status === 404) return null;
      if (res.status === 429) {
        const ra = Number(res.headers.get("retry-after")) || 60;
        console.log(`  límite de pedidos, espero ${ra}s…`);
        await sleep(ra * 1000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === intentos) throw new Error(`${url}: ${err.message}`);
      await sleep(1000 * i);
    }
  }
  throw new Error(`${url}: sin respuesta después de ${intentos} intentos`);
}

async function leerJson(p) {
  try { return JSON.parse(await readFile(p, "utf8")); } catch { return null; }
}

async function enParalelo(items, fn) {
  const resultados = new Array(items.length);
  let siguiente = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCIA }, async () => {
      while (siguiente < items.length) {
        const i = siguiente++;
        resultados[i] = await fn(items[i], i);
      }
    }),
  );
  return resultados;
}

const anio = (t) => {
  const m = String(t.name).match(/(20\d\d)/);
  if (m) return Number(m[1]);
  return Number(String(t.finish_at).slice(-4));
};

// Series especiales (+30, +35, creadores, etc.) quedan afuera por ahora.
const esSerieEspecial = (d) => /\+\s*3\d|mas\s*3\d|más\s*3\d/i.test(`${d.serie_name} ${d.name}`) || !/^\d+$/.test(String(d.serie_name).trim());

async function main() {
  await mkdir(OUT, { recursive: true });

  const lista = (await get("/tournaments")).data;
  await writeFile(path.join(OUT, "tournaments.json"), JSON.stringify(lista));
  console.log(`Campeonatos en la Liga: ${lista.length}`);

  const candidatos = lista.filter((t) => anio(t) >= DESDE);
  const cachePath = path.join(OUT, "tournaments-detail-cache.json");
  const cache = (await leerJson(cachePath)) ?? {};
  const detalles = await enParalelo(candidatos, async (t) => {
    if (!cache[t.id]) {
      cache[t.id] = (await get(`/tournaments/${t.id}`))?.data ?? null;
      await writeFile(cachePath, JSON.stringify(cache));
      console.log(`  detalle ${t.id}: ${String(cache[t.id]?.name ?? "—").trim()}`);
    }
    return cache[t.id];
  });
  await writeFile(cachePath, JSON.stringify(cache));
  const elegidos = detalles.filter(
    (d) => d && ["Apertura", "Clausura"].includes(String(d.category_name).trim()) && !esSerieEspecial(d),
  );
  const hoy = new Date();
  const enCurso = (d) => {
    const [dd, mm, yy] = String(d.finish_at).split("/").map(Number);
    return new Date(yy, mm - 1, dd + 7) >= hoy;
  };
  // primero lo más nuevo: el torneo en curso es lo que la web necesita ya
  const aBajar = (SOLO_ACTUAL ? elegidos.filter(enCurso) : elegidos).sort((a, b) => b.id - a.id);
  await writeFile(path.join(OUT, "tournaments-detail.json"), JSON.stringify(elegidos, null, 1));
  console.log(`Apertura/Clausura desde ${DESDE} (sin series especiales): ${elegidos.length}; a bajar: ${aBajar.length}`);

  let partidos = 0;
  await enParalelo(aBajar, async (d) => {
    const dir = path.join(OUT, String(d.id));
    // un campeonato terminado no cambia: si ya lo tenemos, no lo pedimos de nuevo
    if (!enCurso(d) && existsSync(path.join(dir, "games.json"))) return;
    await mkdir(dir, { recursive: true });
    const [positions, groupweeks, penalizations] = await Promise.all([
      get(`/tournaments/${d.id}/positions`),
      get(`/tournaments/${d.id}/groupweeks`),
      get(`/tournaments/${d.id}/penalizations`),
    ]);
    const fechas = groupweeks?.data ?? [];
    const games = [];
    for (const f of fechas) {
      const r = await get(`/tournaments/${d.id}/games?filter%5Bgroupweek%5D%5B0%5D=${f.id}`);
      for (const g of r?.data ?? []) games.push({ ...g, groupweek_id: f.id, groupweek_name: f.name, groupweek_order: f.order, groupweek_date: f.date });
    }
    partidos += games.length;
    await Promise.all([
      writeFile(path.join(dir, "detail.json"), JSON.stringify(d)),
      writeFile(path.join(dir, "positions.json"), JSON.stringify(positions)),
      writeFile(path.join(dir, "groupweeks.json"), JSON.stringify(groupweeks)),
      writeFile(path.join(dir, "games.json"), JSON.stringify(games)),
      writeFile(path.join(dir, "penalizations.json"), JSON.stringify(penalizations)),
    ]);
    console.log(`  ${d.id} ${d.name.trim()}: ${fechas.length} fechas, ${games.length} partidos`);
  });
  console.log(`Listo: ${partidos} partidos guardados en ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
