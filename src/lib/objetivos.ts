import { pct } from "./format";
import type { DatosDivisional } from "./datos";
import type { MetaVisible } from "./engine/types";

/**
 * Los objetivos que ve la gente. Las copas son "a qué copa va" (Oro = top 4, Bronce = últimos 4,
 * Plata = el resto), no si la gana. En el Clausura, Copa de Oro = asciende (salvo en la A)
 * y Copa de Bronce = desciende.
 */
export type Meta = MetaVisible;

type Def = { corto: string; tile: string; largo: string; verbo: string; texto: string; barra: string; enHero: string; marca: "trofeo" | "cuadro" | "sube" | "baja" | "circulo"; letra?: string };
export const METAS: Record<Meta, Def> = {
  campeon: { corto: "Campeón", tile: "Campeón", largo: "salir campeón", verbo: "sale campeón", texto: "var(--goal-camp-text)", barra: "var(--goal-camp-bar)", enHero: "#93C5FD", marca: "trofeo" },
  primero: { corto: "1º puesto", tile: "1º puesto", largo: "terminar 1º", verbo: "termina 1º", texto: "var(--goal-primero-text)", barra: "var(--goal-primero-bar)", enHero: "#C4B5FD", marca: "cuadro", letra: "1º" },
  asciende: { corto: "Asciende", tile: "Asciende", largo: "ascender", verbo: "asciende", texto: "var(--goal-asc-text)", barra: "var(--goal-asc-bar)", enHero: "#4ADE80", marca: "sube" },
  desciende: { corto: "Desciende", tile: "Desciende", largo: "descender", verbo: "desciende", texto: "var(--goal-desc-text)", barra: "var(--goal-desc-bar)", enHero: "#F87171", marca: "baja" },
  zonaOro: { corto: "Copa de Oro", tile: "Copa de Oro", largo: "jugar la Copa de Oro", verbo: "va a la Copa de Oro", texto: "var(--goal-oro-text)", barra: "var(--goal-oro-bar)", enHero: "#FACC15", marca: "circulo", letra: "O" },
  zonaPlata: { corto: "Copa de Plata", tile: "Copa de Plata", largo: "jugar la Copa de Plata", verbo: "va a la Copa de Plata", texto: "var(--goal-plata-text)", barra: "var(--goal-plata-bar)", enHero: "#CBD5E1", marca: "circulo", letra: "P" },
  zonaBronce: { corto: "Copa de Bronce", tile: "Copa de Bronce", largo: "jugar la Copa de Bronce", verbo: "va a la Copa de Bronce", texto: "var(--goal-bronce-text)", barra: "var(--goal-bronce-bar)", enHero: "#FB923C", marca: "circulo", letra: "B" },
};

type DivMin = Pick<DatosDivisional, "categoria" | "esPrimera">;

/** Clausura: campeón, 1º, y a qué copa va. Apertura: campeón, asciende, desciende (la A no asciende). */
export function metasDe(d: DivMin): Meta[] {
  if (d.categoria === "Clausura") return ["campeon", "primero", "zonaOro", "zonaPlata", "zonaBronce"];
  return d.esPrimera ? ["campeon", "desciende"] : ["campeon", "asciende", "desciende"];
}

/** Lo que además implica esa copa: "asciende" / "desciende" (en la A, Oro no asciende). */
export function implica(d: DivMin, m: Meta): string | null {
  if (d.categoria !== "Clausura") return null;
  if (m === "zonaOro" && !d.esPrimera) return "asciende";
  if (m === "zonaBronce") return "desciende";
  return null;
}

/** "jugar la Copa de Oro y ascender", "salir campeón"… */
export function largo(d: DivMin, m: Meta): string {
  const extra = implica(d, m);
  return extra ? `${METAS[m].largo} y ${extra === "asciende" ? "ascender" : "descender"}` : METAS[m].largo;
}

/** Chance en 0..1 de un equipo y si ya está definida (1 seguro, 0 imposible). */
export function chance(d: DatosDivisional, m: Meta, i: number): { p: number; seguro: 0 | 1 | null; aDefinir: boolean } {
  return { p: d.simulacion.prob[m][i], seguro: d.seguro?.[m]?.[i] ?? null, aDefinir: false };
}

/** "74%", "<0,1%", ">99,9%"; 0% y 100% solo si es seguro de verdad. */
export function txtChance(c: { p: number; seguro: 0 | 1 | null; aDefinir?: boolean }): string {
  if (c.aDefinir) return "a definir";
  if (c.seguro === 1) return "100%";
  if (c.seguro === 0) return "0%";
  const v = c.p * 100;
  if (v <= 0) return "<0,1%";
  if (v >= 100) return ">99,9%";
  return pct(v);
}

/**
 * La cifra principal (handoff §7.2, con las copas como clasificación): Campeón si ≥ 10%; si no,
 * bajar si ≥ 50%; si no, subir si ≥ 10%; si no, bajar si ≥ 10%; si no, la Copa de Plata.
 */
export function metaPrincipal(d: DatosDivisional, i: number): Meta {
  const P = d.simulacion.prob;
  const cl = d.categoria === "Clausura";
  const subir: Meta = cl ? "zonaOro" : "asciende";
  const bajar: Meta = cl ? "zonaBronce" : "desciende";
  if (P.campeon[i] >= 0.1) return "campeon";
  if (P[bajar][i] >= 0.5) return bajar;
  if ((cl || !d.esPrimera) && P[subir][i] >= 0.1) return subir;
  if (P[bajar][i] >= 0.1) return bajar;
  if (cl) return "zonaPlata";
  return d.esPrimera ? "desciende" : "asciende";
}

/** Valor después de la fecha anterior (para "▲ era 49% antes de la fecha 7"). */
export function valorAnterior(d: DatosDivisional, m: Meta, i: number): { p: number; fecha: number } | null {
  const ev = d.evolucion;
  if (ev.length < 2 || !ev[ev.length - 2][m]) return null;
  return { p: ev[ev.length - 2][m][i], fecha: ev[ev.length - 1].fecha };
}

/** Lo malo es bajar: ahí, que la chance baje es bueno. */
export const esMalo = (m: Meta) => m === "desciende" || m === "zonaBronce";
export const esBueno = (m: Meta, delta: number) => (esMalo(m) ? delta < 0 : delta > 0);
