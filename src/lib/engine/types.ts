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
  /** Con más de 4 equipos en el medio el formato de la Copa de Plata está a definir. */
  plataSinFormato: boolean;
}

export const reglamentoDe = (d: Pick<Divisional, "categoria" | "esPrimera" | "equipos">): Reglamento => ({
  ascensos: d.esPrimera ? 0 : 4,
  descensos: 4,
  tamanoCopa: 4,
  finalDesempatePrimero: d.categoria === "Apertura",
  plataSinFormato: d.categoria === "Clausura" && d.equipos.length - 8 > 4,
});

/** Los 6 objetivos que ve la gente, en el orden en que se guardan en porPuntos. */
/** Copa de Oro / Plata / Bronce = a qué copa va (zona de la tabla), no si la gana. */
export const METAS_VISIBLES = ["campeon", "primero", "asciende", "desciende", "zonaOro", "zonaPlata", "zonaBronce"] as const;
export type MetaVisible = (typeof METAS_VISIBLES)[number];

export type Objetivo = "campeon" | "primero" | "asciende" | "copaOro" | "copaPlata" | "copaBronce" | "desciende" | "zonaOro" | "zonaPlata" | "zonaBronce" | "desempate";

export interface ResultadoSimulacion {
  n: number;
  /** probabilidad por equipo (índice del arreglo de equipos) y objetivo */
  prob: Record<Objetivo, number[]>;
  puntosEsperados: number[];
  /** distribución de posición final: pos[equipo][posición] */
  posicion: number[][];
  /** por equipo y puntos finales: [veces, y cuántas de esas logró cada META_VISIBLE en ese orden] */
  porPuntos: Record<number, number[]>[];
  /** por partido restante y resultado (0 gana a, 1 empate, 2 gana b): veces y, por objetivo, cuántas lo logró cada equipo */
  condicional: ({ n: number } & Record<MetaVisible, number[]>)[][];
}

/** 1 = seguro, 0 = imposible, null = depende. Solo con esto la UI muestra "0%", "100%", "seguro" o "no alcanza". */
export type Seguro = Partial<Record<Objetivo, (0 | 1 | null)[]>>;
