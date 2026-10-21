import Link from "next/link";
import { Escudo } from "./Escudo";
import { pct, OBJETIVOS, type ObjetivoVisible } from "@/lib/formato";
import type { EquipoIndice } from "@/lib/datos";
import type { FilaTabla } from "@/lib/engine/types";

export function EquipoLink({ e, href, tam = "sm" }: { e: EquipoIndice; href: string; tam?: "" | "sm" | "lg" }) {
  return (
    <Link className="team" href={href}>
      <Escudo nombre={e.nombre} url={e.escudo} tam={tam} />
      <span className="nm">{e.nombre}</span>
    </Link>
  );
}

/** Barra de tres tramos: gana el primero, empate, gana el segundo. */
/** Barra gana · empate · gana el otro. Con `real`, es un partido jugado: solo lo que pasó va en color. */
export function Tri({ p, real }: { p: [number, number, number]; real?: 0 | 1 | 2 }) {
  const lab = (x: number) => (x >= 0.12 ? pct(x) : "");
  const cls = (k: 0 | 1 | 2, base: string) => (real === undefined ? base : real === k ? "real" : "off");
  const que = ["ganó el primero", "empataron", "ganó el segundo"];
  return (
    <div
      className="tri"
      role="img"
      aria-label={`${real === undefined ? "" : "Antes del partido: "}gana el primero ${pct(p[0])}, empate ${pct(p[1])}, gana el segundo ${pct(p[2])}${real === undefined ? "" : `; ${que[real]}`}`}
    >
      <span className={cls(0, "a")} style={{ width: `${p[0] * 100}%` }}>{lab(p[0])}</span>
      <span className={cls(1, "d")} style={{ width: `${p[1] * 100}%` }}>{lab(p[1])}</span>
      <span className={cls(2, "b")} style={{ width: `${p[2] * 100}%` }}>{lab(p[2])}</span>
    </div>
  );
}

export function Chips({ prob, i, posibles, activo, alElegir }: { prob: Record<string, number[]>; i: number; posibles: ObjetivoVisible[]; activo: ObjetivoVisible; alElegir?: (o: ObjetivoVisible) => void }) {
  return (
    <div className="chips">
      {posibles.map((o) => {
        const contenido = (
          <>
            <span className="k">{OBJETIVOS[o].corto}</span>
            <span className="v">{pct(prob[o][i])}</span>
          </>
        );
        return alElegir ? (
          <button key={o} type="button" className={`chip ${o === activo ? "on" : ""}`} style={{ color: OBJETIVOS[o].color }} onClick={() => alElegir(o)} aria-pressed={o === activo}>
            {contenido}
          </button>
        ) : (
          <div key={o} className={`chip ${o === activo ? "on" : ""}`} style={{ color: OBJETIVOS[o].color }}>
            {contenido}
          </div>
        );
      })}
    </div>
  );
}

/** Orden de la tabla oficial (la Liga ya la publica ordenada; desempatamos igual por las dudas). */
export const ordenarTabla = (t: FilaTabla[]) => [...t].sort((x, y) => y.pts - x.pts || y.gf - y.gc - (x.gf - x.gc) || y.gf - x.gf);

/** Zona de color de la fila: arriba = Copa de Oro (Clausura) o ascenso (Apertura); abajo = descenso. */
export function zona(pos: number, n: number, categoria: string, ascensos: number, descensos: number) {
  // Clausura: los 4 de arriba van a la Copa de Oro. Apertura: el 1º es campeón (dorado) y 2º–4º ascienden (celeste).
  if (categoria === "Clausura" ? pos < 4 : pos === 0) return "oro";
  if (pos < ascensos) return "up";
  if (pos >= n - descensos) return "down";
  return categoria === "Clausura" ? "plata" : "";
}
