import type { Objetivo } from "./engine/types";

/** Porcentaje en estilo uruguayo: coma decimal, un decimal debajo de 10%, extremos acotados. */
export function pct(p: number): string {
  if (p <= 0) return "0%";
  if (p < 0.001) return "<0,1%";
  if (p >= 1) return "100%";
  if (p > 0.999) return ">99,9%";
  const v = p * 100;
  return (v < 10 ? v.toFixed(1) : Math.round(v).toString()).replace(".", ",") + "%";
}

export const decimal = (x: number, d = 1) => x.toFixed(d).replace(".", ",");

export type ObjetivoVisible = Extract<Objetivo, "campeon" | "asciende" | "copaOro" | "copaPlata" | "copaBronce" | "desciende">;

export const OBJETIVOS: Record<ObjetivoVisible, { corto: string; largo: string; color: string }> = {
  campeon: { corto: "Campeón", largo: "salir campeón", color: "var(--c-camp)" },
  asciende: { corto: "Asciende", largo: "ascender", color: "var(--c-asc)" },
  copaOro: { corto: "Copa de Oro", largo: "ganar la Copa de Oro", color: "var(--c-oro)" },
  copaPlata: { corto: "Copa de Plata", largo: "ganar la Copa de Plata", color: "var(--c-plata)" },
  copaBronce: { corto: "Copa de Bronce", largo: "ganar la Copa de Bronce", color: "var(--c-bronce)" },
  desciende: { corto: "Desciende", largo: "descender", color: "var(--c-desc)" },
};

/** Objetivos que aplican: el Apertura no tiene copas; la divisional A no tiene ascenso. */
export function objetivosDe(categoria: string, esPrimera: boolean): ObjetivoVisible[] {
  const base: ObjetivoVisible[] = categoria === "Clausura" ? ["campeon", "asciende", "copaOro", "copaPlata", "copaBronce", "desciende"] : ["campeon", "asciende", "desciende"];
  return esPrimera ? base.filter((o) => o !== "asciende") : base;
}

/** El objetivo que más le importa hoy a un equipo: el que todavía está en juego. */
export function objetivoPrincipal(prob: Record<string, number[]>, i: number, posibles: ObjetivoVisible[]): ObjetivoVisible {
  const vivo = (o: ObjetivoVisible) => posibles.includes(o) && prob[o][i] >= 0.02 && prob[o][i] <= 0.98;
  if (posibles.includes("campeon") && prob.campeon[i] >= 0.05) return "campeon";
  if (vivo("asciende")) return "asciende";
  if (vivo("desciende")) return "desciende";
  if (posibles.includes("asciende") && prob.asciende[i] > 0.98) return posibles.includes("copaOro") ? "copaOro" : "asciende";
  if (posibles.includes("desciende") && prob.desciende[i] > 0.98) return posibles.includes("copaBronce") ? "copaBronce" : "desciende";
  return posibles.includes("copaPlata") ? "copaPlata" : "campeon";
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
export function diaCorto(iso: string | null): string {
  if (!iso) return "fecha a confirmar";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]}`;
}
