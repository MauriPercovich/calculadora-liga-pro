export type Categoria = "Apertura" | "Clausura";

export interface Equipo {
  id: number;
  nombre: string;
  slug: string;
  escudo: string | null;
}

/** Partido normalizado. Sin localía: `a` y `b` solo indican el orden en que los publica la Liga. */
export interface Partido {
  id: number;
  fecha: number; // número de jornada
  dia: string | null; // ISO yyyy-mm-dd
  hora: string | null; // "HH:MM" o null si la Liga no la publicó
  cancha: string | null;
  a: number; // id de equipo
  b: number;
  golesA: number | null;
  golesB: number | null;
  fase: "regular" | "oro" | "plata" | "bronce" | "final" | "desempate";
}

export interface Sancion {
  jugador: string;
  equipoId: number;
  tipo: "Roja" | "Amarilla" | string;
  fechas: number;
  pendientes: number;
  estado: string;
}

export interface FilaTabla {
  equipoId: number;
  pts: number;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
}

export interface Divisional {
  torneoId: number;
  serie: string; // "9"
  divisional: string; // "C"
  categoria: Categoria;
  anio: number;
  esPrimera: boolean; // divisional A: no asciende
  esUltima: boolean; // última de su serie: igual marca descenso
  equipos: Equipo[];
  partidos: Partido[];
  tablaOficial: FilaTabla[];
  sanciones: Sancion[];
}

/** Reglamento de Liga Pro (confirmado con el usuario el 19/10/2026). */
export interface Reglamento {
  ascensos: number; // 4 (0 en la divisional A)
  descensos: number; // 4
  tamanoCopa: number; // 4 en Oro y en Bronce; el resto va a Plata
  finalDesempatePrimero: boolean; // Apertura: sí; Clausura: no
}

export const reglamentoDe = (d: Pick<Divisional, "categoria" | "esPrimera">): Reglamento => ({
  ascensos: d.esPrimera ? 0 : 4,
  descensos: 4,
  tamanoCopa: 4,
  finalDesempatePrimero: d.categoria === "Apertura",
});

export type Objetivo = "campeon" | "asciende" | "copaOro" | "copaPlata" | "copaBronce" | "desciende" | "zonaOro" | "zonaPlata" | "zonaBronce" | "desempate";

export interface ResultadoSimulacion {
  n: number;
  /** probabilidad por equipo (índice del arreglo de equipos) y objetivo */
  prob: Record<Objetivo, number[]>;
  puntosEsperados: number[];
  /** distribución de posición final: pos[equipo][posición] */
  posicion: number[][];
  /** por puntos finales: [veces, asciende, desciende, campeón] */
  porPuntos: Record<number, [number, number, number, number]>[];
  /** por partido restante y resultado (0 gana a, 1 empate, 2 gana b): veces y objetivos */
  condicional: { n: number; asciende: number[]; desciende: number[]; campeon: number[] }[][];
}
