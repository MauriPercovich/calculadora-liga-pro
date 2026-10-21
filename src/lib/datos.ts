import type { Divisional, MetaVisible, Partido, Reglamento, ResultadoSimulacion, Seguro } from "./engine/types";

export interface EquipoIndice { id: number; nombre: string; slug: string; escudo: string | null; pos?: number; pts?: number }
export interface DivisionalIndice {
  torneoId: number;
  serie: string;
  divisional: string;
  categoria: string;
  anio: number;
  ultimaJugada: number;
  totalFechas: number;
  esPrimera: boolean;
  jugados: number;
  restantes: number;
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
  /** Qué está definido de verdad: 1 seguro, 0 imposible, null depende. */
  seguro: Seguro;
  /** Con 12 partidos o menos: por equipo y puntaje final, si el objetivo pasa seguro o nunca. */
  certezaPuntos: Record<number, { arriba: 0 | 1 | null; asciende: 0 | 1 | null; desciende: 0 | 1 | null; primero: 0 | 1 | null }>[] | null;
  ultimaJugada: number;
  totalFechas: number;
  modelo: { mu: number; ataque: number[]; defensa: number[] };
  simulacion: ResultadoSimulacion;
  antes: Record<number, [number, number, number]>;
  proximos: Record<number, [number, number, number]>;
  /** chances de los 6 objetivos después de cada fecha (0 = antes de empezar) */
  evolucion: ({ fecha: number } & Record<MetaVisible, number[]>)[];
}

/** /s9/c */
export const rutaDivisional = (d: { serie: string; divisional: string }) => `/s${d.serie}/${d.divisional.toLowerCase()}`;
/** /s9/c/equipo/udem */
export const rutaEquipo = (d: { serie: string; divisional: string }, slug: string) => `${rutaDivisional(d)}/equipo/${slug}`;
export type Seccion = "partidos" | "simular" | "sancionados";
/** /s9/c/partidos */
export const rutaSeccion = (d: { serie: string; divisional: string }, s: Seccion) => `${rutaDivisional(d)}/${s}`;
/** Lee "/s9/c/..." y devuelve serie y divisional, o null. */
export function divisionalDeRuta(ruta: string): { serie: string; divisional: string } | null {
  const m = ruta.match(/^\/s(\d+)\/([a-z])(?:\/|$)/i);
  return m ? { serie: m[1], divisional: m[2].toUpperCase() } : null;
}
export const nombreDivisional = (d: { serie: string; divisional: string; categoria: string; anio: number }) =>
  `Serie ${d.serie} / Divisional ${d.divisional} / ${d.categoria} ${d.anio}`;

export const subtituloFecha = (d: { jugados: number; restantes: number; totalFechas: number }) =>
  d.restantes === 0
    ? `Fase regular terminada · ${d.jugados} partidos`
    : `${d.jugados} partidos jugados · ${d.restantes === 1 ? "queda 1" : `quedan ${d.restantes}`} · ${d.totalFechas} fechas`;
