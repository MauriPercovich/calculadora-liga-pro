import type { Divisional, Partido, Reglamento, ResultadoSimulacion } from "./engine/types";

export interface EquipoIndice { id: number; nombre: string; slug: string; escudo: string | null }
export interface DivisionalIndice {
  torneoId: number;
  serie: string;
  divisional: string;
  categoria: string;
  anio: number;
  ultimaJugada: number;
  totalFechas: number;
  esPrimera: boolean;
  picantes: Picante[];
  equipos: EquipoIndice[];
}
export interface Picante {
  partido: Partido;
  antes: [number, number, number] | null;
  cambios: { equipoId: number; objetivo: "campeon" | "asciende" | "desciende"; de: number; a: number }[];
  max: number;
}
export interface Indice { actualizado: string; torneo: string; divisionales: DivisionalIndice[]; historicas: number }

/** Todo lo que la web necesita de una divisional (lo genera scripts/build-data.ts). */
export interface DatosDivisional extends Divisional {
  reglamento: Reglamento;
  ultimaJugada: number;
  totalFechas: number;
  modelo: { mu: number; ataque: number[]; defensa: number[] };
  simulacion: ResultadoSimulacion;
  antes: Record<number, [number, number, number]>;
  proximos: Record<number, [number, number, number]>;
  evolucion: { fecha: number; asciende: number[]; desciende: number[]; campeon: number[] }[];
}

/** /serie-9/c */
export const rutaDivisional = (d: { serie: string; divisional: string }) => `/serie-${d.serie}/${d.divisional.toLowerCase()}`;
export const rutaEquipo = (d: { serie: string; divisional: string }, slug: string) => `${rutaDivisional(d)}/${slug}`;
export const nombreDivisional = (d: { serie: string; divisional: string; categoria: string; anio: number }) =>
  `Serie ${d.serie} / Divisional ${d.divisional} / ${d.categoria} ${d.anio}`;

export const subtituloFecha = (d: { ultimaJugada: number; totalFechas: number }) =>
  d.ultimaJugada >= d.totalFechas ? `Fase regular terminada (${d.totalFechas} fechas)` : `Fecha ${d.ultimaJugada} de ${d.totalFechas} jugada`;
