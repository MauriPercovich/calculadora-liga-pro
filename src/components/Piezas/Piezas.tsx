import Link from "next/link";
import type React from "react";
import { pct } from "@/lib/format";
import { METAS, type Meta } from "@/lib/objetivos";
import css from "./Piezas.module.css";

/**
 * Ícono de cada objetivo (decorativo: siempre va con texto). Trofeo = campeón, podio = 1º puesto,
 * medalla del metal de la copa = Copa de Oro / Plata / Bronce, flecha = asciende / desciende.
 * `color` lo pisa cuando va sobre fondo oscuro (la ficha).
 */
export function Marca({ m, color, tam = 16 }: { m: Meta; color?: string; tam?: number }) {
  const c = color ?? METAS[m].barra;
  const svg = (hijos: React.ReactNode) => (
    <svg className={css.marca} width={tam} height={tam} viewBox="0 0 24 24" aria-hidden style={{ color: c }}>
      {hijos}
    </svg>
  );
  switch (METAS[m].marca) {
    case "trofeo":
      return svg(
        <>
          <path d="M7 5H4.6a.6.6 0 0 0-.6.6V7a3.5 3.5 0 0 0 3.6 3.5M17 5h2.4a.6.6 0 0 1 .6.6V7a3.5 3.5 0 0 1-3.6 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M6.5 2.5h11V8a5.5 5.5 0 0 1-11 0z" fill="currentColor" />
          <path d="m12 4.6.8 1.6 1.7.2-1.3 1.2.4 1.7L12 8.4l-1.6.9.4-1.7-1.3-1.2 1.7-.2z" fill="#fff" fillOpacity=".9" />
          <path d="M10.8 13.2h2.4l.5 3.8h-3.4z" fill="currentColor" />
          <rect x="7" y="17" width="10" height="4.5" rx="1.2" fill="currentColor" />
        </>,
      );
    case "cuadro": // 1º puesto: podio con estrella sobre el escalón más alto
      return svg(
        <>
          <path d="m12 1.8 1.1 2.2 2.4.3-1.8 1.7.5 2.4L12 7.2l-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" fill="currentColor" />
          <rect x="8.5" y="10" width="7" height="12" rx="1.2" fill="currentColor" />
          <rect x="1.5" y="14" width="6.2" height="8" rx="1.2" fill="currentColor" fillOpacity=".55" />
          <rect x="16.3" y="16.5" width="6.2" height="5.5" rx="1.2" fill="currentColor" fillOpacity=".55" />
          <path d="M11.2 13.4 12.6 12.4v6.4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>,
      );
    case "sube":
    case "baja":
      return svg(
        <>
          <circle cx="12" cy="12" r="10.5" fill="currentColor" />
          <path d={METAS[m].marca === "sube" ? "M12 17.5v-11M7 11.5l5-5 5 5" : "M12 6.5v11M7 12.5l5 5 5-5"} fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </>,
      );
    default: // copas: medalla con cinta, del color del metal
      return svg(
        <>
          <path d="M6.5 1.5h4.2l2.4 7H8.9z" fill="currentColor" fillOpacity=".6" />
          <path d="M17.5 1.5h-4.2l-2.4 7h4.2z" fill="currentColor" fillOpacity=".8" />
          <circle cx="12" cy="15.2" r="7.3" fill="currentColor" />
          <circle cx="12" cy="15.2" r="4.6" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="1.4" />
        </>,
      );
  }
}

/** Barra gana · empate · gana el otro, proporcional. Nunca en rojo: el rojo es de Desciende. */
export function MatchBar({ p, numeros = false, etiquetas }: { p: [number, number, number]; numeros?: boolean; etiquetas?: [string, string, string] }) {
  const w = (x: number) => `${Math.max(x * 100, 0.5)}%`;
  const lab = (x: number) => (numeros && x >= 0.12 ? pct(x * 100) : "");
  return (
    <div>
      <div className={`${css.match} ${numeros ? css.gruesa : css.fina}`} role="img" aria-label={`Gana el primero ${pct(p[0] * 100)}, empate ${pct(p[1] * 100)}, gana el segundo ${pct(p[2] * 100)}`}>
        <span className={css.a} style={{ width: w(p[0]) }}>{lab(p[0])}</span>
        <span className={css.d} style={{ width: w(p[1]) }}>{lab(p[1])}</span>
        <span className={css.b} style={{ width: w(p[2]) }}>{lab(p[2])}</span>
      </div>
      {etiquetas && (
        <div className={css.bajo}>
          <span>{etiquetas[0]}</span>
          <span>{etiquetas[1]}</span>
          <span>{etiquetas[2]}</span>
        </div>
      )}
    </div>
  );
}

/** Fila de 44 px: marca + nombre · barra · cifra. Tocar lleva a la ficha con ese objetivo. */
export function GoalRow({ m, p, txt, href, aDefinir = false, extra }: { m: Meta; p: number; txt: string; href: string; aDefinir?: boolean; extra?: string | null }) {
  const o = METAS[m];
  const ancho = p > 0 ? Math.max(p * 100, 1.5) : 0; // barra mínima visible si la chance es > 0
  return (
    <Link className={css.goalRow} href={href}>
      <span className={css.goalNombre} style={{ color: o.texto }}>
        <Marca m={m} />
        <span>
          {o.corto}
          {extra && <small className={css.extra}>y {extra}</small>}
        </span>
      </span>
      <span className={css.track} aria-hidden>
        {!aDefinir && <span style={{ width: `${ancho}%`, background: o.barra }} />}
      </span>
      <span className={`${css.cifra} ${aDefinir ? css.aDefinir : ""}`} style={aDefinir ? undefined : { color: o.texto }}>
        {txt}
      </span>
    </Link>
  );
}
