"use client";
import { useState } from "react";
import type { DatosDivisional } from "@/lib/datos";
import { rutaEquipo } from "@/lib/datos";
import { decimal, objetivosDe, OBJETIVOS, pct, type ObjetivoVisible } from "@/lib/formato";
import { useFavorito } from "@/lib/favorito";
import { EquipoLink, ordenarTabla, zona } from "./ui";
import { VistaPartidos } from "./VistaPartidos";

export function VistaDivisional({ d }: { d: DatosDivisional }) {
  const fav = useFavorito();
  const posibles = objetivosDe(d.categoria, d.esPrimera);
  const [obj, setObj] = useState<ObjetivoVisible>(posibles.includes("asciende") ? "asciende" : "campeon");
  const [vista, setVista] = useState<"hoy" | "proy">("hoy");
  const P = d.simulacion.prob;
  const N = d.equipos.length;
  const ix = new Map(d.equipos.map((e, i) => [e.id, i]));
  const eq = (id: number) => d.equipos[ix.get(id)!];
  const href = (id: number) => rutaEquipo(d, eq(id).slug);
  const esFav = (id: number) => fav?.torneoId === d.torneoId && fav.equipoId === id;
  const orden = [...Array(N).keys()].sort((a, b) => P[obj][b] - P[obj][a]);
  const max = Math.max(...orden.map((i) => P[obj][i]), 0.0001);
  const tabla = ordenarTabla(d.tablaOficial);
  const proy = [...Array(N).keys()].sort((a, b) => d.simulacion.puntosEsperados[b] - d.simulacion.puntosEsperados[a]);
  const ptsHoy = new Map(d.tablaOficial.map((f) => [f.equipoId, f.pts]));
  const clausura = d.categoria === "Clausura";

  return (
    <div className="stack">
      <div className="card" id="tabla">
        <div className="card-h">
          <h2>Así está la tabla</h2>
        </div>
        <div className="tabs" role="tablist">
          <button className={vista === "hoy" ? "on" : ""} onClick={() => setVista("hoy")}>Hoy</button>
          <button className={vista === "proy" ? "on" : ""} onClick={() => setVista("proy")}>Proyectada</button>
        </div>
        <div className="tbl-wrap">
          {vista === "hoy" ? (
            <table>
              <thead>
                <tr><th /><th className="l">Equipos</th><th className="pts">Pts</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th></tr>
              </thead>
              <tbody>
                {tabla.map((f, pos) => (
                  <tr key={f.equipoId} className={`${zona(pos, N, d.categoria, d.reglamento.ascensos, d.reglamento.descensos)} ${esFav(f.equipoId) ? "fav" : ""}`}>
                    <td className="pos">{pos + 1}</td>
                    <td className="l team-cell"><EquipoLink e={eq(f.equipoId)} href={href(f.equipoId)} /></td>
                    <td className="pts num">{f.pts}</td>
                    <td className="num">{f.pj}</td>
                    <td className="num">{f.pg}</td>
                    <td className="num">{f.pe}</td>
                    <td className="num">{f.pp}</td>
                    <td className="num">{f.gf}</td>
                    <td className="num">{f.gc}</td>
                    <td className="num">{f.gf - f.gc > 0 ? "+" : ""}{f.gf - f.gc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th /><th className="l">Equipos</th><th>Hoy</th><th className="pts">Final esp.</th>
                  {clausura ? (<><th>Oro</th><th>Plata</th><th>Bronce</th></>) : (<>{!d.esPrimera && <th>Asc.</th>}<th>Desc.</th></>)}
                </tr>
              </thead>
              <tbody>
                {proy.map((i, pos) => {
                  const id = d.equipos[i].id;
                  return (
                    <tr key={id} className={`${zona(pos, N, d.categoria, d.reglamento.ascensos, d.reglamento.descensos)} ${esFav(id) ? "fav" : ""}`}>
                      <td className="pos">{pos + 1}</td>
                      <td className="l team-cell"><EquipoLink e={d.equipos[i]} href={href(id)} /></td>
                      <td className="num">{ptsHoy.get(id)}</td>
                      <td className="pts num">{decimal(d.simulacion.puntosEsperados[i])}</td>
                      {clausura ? (
                        <><td className="num">{pct(P.zonaOro[i])}</td><td className="num">{pct(P.zonaPlata[i])}</td><td className="num">{pct(P.zonaBronce[i])}</td></>
                      ) : (
                        <>{!d.esPrimera && <td className="num">{pct(P.asciende[i])}</td>}<td className="num">{pct(P.desciende[i])}</td></>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="legend">
          {clausura ? (
            <>
              <span><i style={{ background: "var(--zone-oro)" }} />Copa de Oro{d.esPrimera ? "" : " · asciende"}</span>
              <span><i style={{ background: "var(--zone-mid)", border: "1px solid var(--line)" }} />Copa de Plata</span>
              <span><i style={{ background: "var(--zone-down)" }} />Copa de Bronce · desciende</span>
            </>
          ) : (
            <>
              <span><i style={{ background: "var(--zone-oro)" }} />{d.esPrimera ? "Campeón" : "Campeón · asciende"}</span>
              {!d.esPrimera && <span><i style={{ background: "var(--zone-up)" }} />Asciende</span>}
              <span><i style={{ background: "var(--zone-down)" }} />Desciende</span>
            </>
          )}
        </div>
        <p className="fine" style={{ padding: "0 16px 14px", margin: 0 }}>
          {vista === "hoy"
            ? "Tabla oficial de la Liga. Desempate: diferencia de gol, goles a favor, enfrentamiento directo y sorteo."
            : "Puntos finales esperados: el promedio de todas las simulaciones. Es lo más probable, no lo seguro."}
        </p>
      </div>

      <div className="card">
        <div className="card-h">
          <h2>Chances de cada equipo</h2>
          <span className="hint num">{d.simulacion.n.toLocaleString("es-UY")} simulaciones</span>
        </div>
        <div className="tabs" role="tablist">
          {posibles.map((o) => (
            <button key={o} role="tab" aria-selected={o === obj} className={o === obj ? "on" : ""} onClick={() => setObj(o)}>
              {OBJETIVOS[o].corto}
            </button>
          ))}
        </div>
        <div className="card-b rank">
          {orden.map((i) => (
            <div className="rank-row" key={d.equipos[i].id}>
              <EquipoLink e={d.equipos[i]} href={href(d.equipos[i].id)} />
              <div className="bar">
                <span style={{ width: `${(P[obj][i] / max) * 100}%`, background: OBJETIVOS[obj].color }} />
              </div>
              <div className="pct" style={{ color: OBJETIVOS[obj].color }}>
                {pct(P[obj][i])}
              </div>
            </div>
          ))}
        </div>
      </div>

      {clausura && (
        <div className="card">
          <div className="card-h"><h2>Cómo sigue el Clausura</h2></div>
          <div className="card-b rank">
            <div className="rank-row" style={{ gridTemplateColumns: "110px minmax(0,1fr)" }}><b style={{ color: "var(--c-oro)" }}>Copa de Oro</b><span>Los 4 primeros{d.esPrimera ? "" : ", que ascienden"}. Semis 1º vs 4º y 2º vs 3º. El 1º ya tiene lugar en la final por la divisional: si gana la Copa de Oro es campeón; si no, juega la final contra el ganador.</span></div>
            <div className="rank-row" style={{ gridTemplateColumns: "110px minmax(0,1fr)" }}><b style={{ color: "var(--c-plata)" }}>Copa de Plata</b><span>Los del medio ({N - 8 === 1 ? "el 5º" : `del 5º al ${N - 4}º`}). Juegan solo por la copa.</span></div>
            <div className="rank-row" style={{ gridTemplateColumns: "110px minmax(0,1fr)" }}><b style={{ color: "var(--c-bronce)" }}>Copa de Bronce</b><span>Los 4 últimos, que descienden. Semis {N - 3}º vs {N}º y {N - 2}º vs {N - 1}º.</span></div>
          </div>
        </div>
      )}

      <h2 className="section-title">Partidos</h2>
      <VistaPartidos d={d} />
    </div>
  );
}
