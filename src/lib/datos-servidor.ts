import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DatosDivisional, Indice } from "./datos";

const DIR = path.join(process.cwd(), "public", "data");

export async function leerIndice(): Promise<Indice> {
  return JSON.parse(await readFile(path.join(DIR, "index.json"), "utf8"));
}

export async function leerDivisional(torneoId: number): Promise<DatosDivisional> {
  return JSON.parse(await readFile(path.join(DIR, "divisionales", `${torneoId}.json`), "utf8"));
}

export async function buscarDivisional(serie: string, divisional: string) {
  const indice = await leerIndice();
  const d = indice.divisionales.find((x) => `s${x.serie}` === serie && x.divisional.toLowerCase() === divisional.toLowerCase());
  return d ? { indice, datos: await leerDivisional(d.torneoId) } : null;
}

/** Parámetros estáticos de todas las divisionales en curso: { serie: "s9", div: "c" }. */
export async function paramsDivisionales() {
  const i = await leerIndice();
  return i.divisionales.map((d) => ({ serie: `s${d.serie}`, div: d.divisional.toLowerCase() }));
}
