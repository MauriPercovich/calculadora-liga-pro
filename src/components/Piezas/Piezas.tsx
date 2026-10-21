import Link from "next/link";
import { pct } from "@/lib/format";
import { METAS, type Meta } from "@/lib/objetivos";
import css from "./Piezas.module.css";

/** Marca de 16 px por objetivo (decorativa: siempre va con texto). */
export function Marca({ m }: { m: Meta }) {
  const o = METAS[m];
  if (o.marca === "sube" || o.marca === "baja")
    return (
      <svg className={css.marca} viewBox="0 0 16 16" aria-hidden>
        <path d={o.marca === "sube" ? "M8 2.5 14.5 13.5h-13z" : "M8 13.5 1.5 2.5h13z"} fill={o.barra} />
      </svg>
    );
  return (
    <span className={`${css.marca} ${o.marca === "cuadro" ? css.cuadro : css.circulo} ${m === "copaOro" ? css.oro : ""}`} style={{ background: o.barra }} aria-hidden>
      {o.letra}
    </span>
  );
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
export function GoalRow({ m, p, txt, href, aDefinir = false }: { m: Meta; p: number; txt: string; href: string; aDefinir?: boolean }) {
  const o = METAS[m];
  const ancho = p > 0 ? Math.max(p * 100, 1.5) : 0; // barra mínima visible si la chance es > 0
  return (
    <Link className={css.goalRow} href={href}>
      <span className={css.goalNombre} style={{ color: o.texto }}>
        <Marca m={m} />
        <span>{o.corto}</span>
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
