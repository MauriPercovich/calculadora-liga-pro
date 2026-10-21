import { pct } from "./format";
import type { DatosDivisional } from "./datos";

/** Los 6 objetivos que ve la gente (las "zonas" son internas). */
export type Meta = "campeon" | "asciende" | "copaOro" | "copaPlata" | "copaBronce" | "desciende";

export const METAS: Record<Meta, { corto: string; tile: string; largo: string; verbo: string; texto: string; barra: string; marca: "cuadro" | "sube" | "baja" | "circulo"; letra?: string }> = {
  campeon: { corto: "Campeón", tile: "Campeón", largo: "salir campeón", verbo: "sale campeón", texto: "var(--goal-camp-text)", barra: "var(--goal-camp-bar)", marca: "cuadro", letra: "1º" },
  asciende: { corto: "Asciende", tile: "Asciende", largo: "ascender", verbo: "asciende", texto: "var(--goal-asc-text)", barra: "var(--goal-asc-bar)", marca: "sube" },
  copaOro: { corto: "Copa de Oro", tile: "Oro", largo: "ganar la Copa de Oro", verbo: "gana la Copa de Oro", texto: "var(--goal-oro-text)", barra: "var(--goal-oro-bar)", marca: "circulo", letra: "O" },
  copaPlata: { corto: "Copa de Plata", tile: "Plata", largo: "ganar la Copa de Plata", verbo: "gana la Copa de Plata", texto: "var(--goal-plata-text)", barra: "var(--goal-plata-bar)", marca: "circulo", letra: "P" },
  copaBronce: { corto: "Copa de Bronce", tile: "Bronce", largo: "ganar la Copa de Bronce", verbo: "gana la Copa de Bronce", texto: "var(--goal-bronce-text)", barra: "var(--goal-bronce-bar)", marca: "circulo", letra: "B" },
  desciende: { corto: "Desciende", tile: "Desciende", largo: "descender", verbo: "desciende", texto: "var(--goal-desc-text)", barra: "var(--goal-desc-bar)", marca: "baja" },
};

/** Objetivos que aplican: el Apertura no tiene copas y la Divisional A no asciende. */
export function metasDe(d: Pick<DatosDivisional, "categoria" | "esPrimera">): Meta[] {
  const todas: Meta[] = d.categoria === "Clausura" ? ["campeon", "asciende", "copaOro", "copaPlata", "copaBronce", "desciende"] : ["campeon", "asciende", "desciende"];
  return d.esPrimera ? todas.filter((m) => m !== "asciende") : todas;
}

/** Chance en 0..1 de un equipo y si ya está definida (1 seguro, 0 imposible). */
export function chance(d: DatosDivisional, m: Meta, i: number): { p: number; seguro: 0 | 1 | null; aDefinir: boolean } {
  const aDefinir = m === "copaPlata" && d.reglamento.plataSinFormato;
  const seguro = d.seguro?.[m]?.[i] ?? null;
  return { p: d.simulacion.prob[m][i], seguro, aDefinir };
}

/** "74%", "<0,1%", ">99,9%"; 0% y 100% solo si es seguro de verdad. */
export function txtChance(c: { p: number; seguro: 0 | 1 | null; aDefinir?: boolean }): string {
  if (c.aDefinir) return "a definir";
  if (c.seguro === 1) return "100%";
  if (c.seguro === 0) return "0%";
  const v = c.p * 100;
  // sin certeza nunca mostramos 0 ni 100 redondos
  if (v <= 0) return "<0,1%";
  if (v >= 100) return ">99,9%";
  return pct(v);
}

/**
 * La cifra principal de un equipo (handoff §7.2): Campeón si ≥ 10%; si no, Desciende si ≥ 50%;
 * si no, Asciende si ≥ 10%; si no, Desciende si ≥ 10%; si no, Copa de Plata (o lo que haya).
 */
export function metaPrincipal(d: DatosDivisional, i: number): Meta {
  const P = d.simulacion.prob;
  const metas = metasDe(d);
  const hay = (m: Meta) => metas.includes(m) && !(m === "copaPlata" && d.reglamento.plataSinFormato);
  if (P.campeon[i] >= 0.1) return "campeon";
  if (P.desciende[i] >= 0.5) return "desciende";
  if (hay("asciende") && P.asciende[i] >= 0.1) return "asciende";
  if (P.desciende[i] >= 0.1) return "desciende";
  if (hay("copaPlata")) return "copaPlata";
  if (hay("asciende")) return "asciende";
  return "desciende";
}

/** Valor de la meta después de la fecha anterior (para "▲ era 49% antes de la fecha 7"). */
export function valorAnterior(d: DatosDivisional, m: Meta, i: number): { p: number; fecha: number } | null {
  const ev = d.evolucion;
  if (ev.length < 2) return null;
  return { p: ev[ev.length - 2][m][i], fecha: ev[ev.length - 1].fecha };
}

/** Subir es bueno salvo en Desciende. */
export const esBueno = (m: Meta, delta: number) => (m === "desciende" ? delta < 0 : delta > 0);
