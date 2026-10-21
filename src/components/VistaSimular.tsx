"use client";
import { useMemo, useState } from "react";
import type { DatosDivisional } from "@/lib/datos";
import { rutaEquipo } from "@/lib/datos";
import { probabilidades, type ModeloGoles } from "@/lib/engine/model";
import { useFavorito } from "@/lib/favorito";
import { EquipoLink, zona } from "./ui";

/** "Armá tu escenario": fijás resultados y el resto lo sigue simulando el modelo, en el navegador. */
export function VistaSimular({ d }: { d: DatosDivisional }) {
  const fav = useFavorito();
  const [fijados, setFijados] = useState<Record<number, 0 | 1 | 2>>({});
  const ids = d.equipos.map((e) => e.id);
  const modelo: ModeloGoles = useMemo(
    () => ({ mu: d.modelo.mu, ataque: new Map(ids.map((id, i) => [id, d.modelo.ataque[i]])), defensa: new Map(ids.map((id, i) => [id, d.modelo.defensa[i]])) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d],
  );
  const restantes = d.partidos.filter((p) => p.fase === "regular" && p.golesA === null);
  const eligio = Object.keys(fijados).length > 0;
  const eq = (id: number) => d.equipos.find((e) => e.id === id)!;
  const corto = (id: number) => (eq(id).nombre.length > 14 ? eq(id).nombre.slice(0, 12) + "…" : eq(id).nombre);

  const extra = new Map<number, number>();
  for (const p of restantes) {
    const f = fijados[p.id];
    if (f === 0) extra.set(p.a, (extra.get(p.a) ?? 0) + 3);
    if (f === 2) extra.set(p.b, (extra.get(p.b) ?? 0) + 3);
    if (f === 1) {
      extra.set(p.a, (extra.get(p.a) ?? 0) + 1);
      extra.set(p.b, (extra.get(p.b) ?? 0) + 1);
    }
  }
  const pts = (i: number) => d.tablaOficial.find((f) => f.equipoId === ids[i])!.pts + (extra.get(ids[i]) ?? 0);
  const dg = (i: number) => { const f = d.tablaOficial.find((x) => x.equipoId === ids[i])!; return f.gf - f.gc; };
  // Posiciones finales con lo elegido: puntos, después diferencia de gol (la que hay hoy) y, si siguen iguales, lo que espera el modelo.
  const orden = [...ids.keys()].sort((a, b) => pts(b) - pts(a) || dg(b) - dg(a) || d.simulacion.puntosEsperados[b] - d.simulacion.puntosEsperados[a]);
  const N = ids.length;
  const clausura = d.categoria === "Clausura";

  const elegir = (id: number, v: 0 | 1 | 2) =>
    setFijados((f) => {
      const n = { ...f };
      if (n[id] === v) delete n[id];
      else n[id] = v;
      return n;
    });
  const lomasProbable = () => {
    const n: Record<number, 0 | 1 | 2> = { ...fijados };
    for (const p of restantes) {
      if (n[p.id] !== undefined) continue;
      const pr = probabilidades(modelo, p.a, p.b);
      const m = Math.max(...pr);
      n[p.id] = m < 0.42 ? 1 : (pr.indexOf(m) as 0 | 1 | 2);
    }
    setFijados(n);
  };

  if (!restantes.length) return <div className="card"><div className="card-b" style={{ paddingTop: 16 }}><p className="fine">No quedan partidos de la fase regular en esta divisional.</p></div></div>;

  return (
    <div className="grid">
      <div className="stack">
        <div className="card">
          <div className="card-h"><h2>Armá tu escenario</h2><span className="hint">{Object.keys(fijados).length} de {restantes.length} elegidos</span></div>
          <div className="card-b">
            <p className="fine" style={{ margin: "0 0 6px" }}>Elegí resultados y mirá cómo quedaría la tabla al final.</p>
            {restantes.map((p) => (
              <div className="sim-row" key={p.id}>
                <div style={{ minWidth: 0 }}>
                  <div className="fine">Fecha {p.fecha}</div>
                  <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{eq(p.a).nombre} vs {eq(p.b).nombre}</div>
                </div>
                <div className="seg" role="group" aria-label={`Resultado de ${eq(p.a).nombre} vs ${eq(p.b).nombre}`}>
                  {([[`Gana ${corto(p.a)}`, 0], ["Empate", 1], [`Gana ${corto(p.b)}`, 2]] as const).map(([lab, v]) => (
                    <button key={v} className={fijados[p.id] === v ? "on" : ""} aria-pressed={fijados[p.id] === v} onClick={() => elegir(p.id, v)} title={lab}>
                      {v === 1 ? "E" : v === 0 ? "1" : "2"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="fine" style={{ margin: "8px 0 0" }}>1 = gana el primero · E = empate · 2 = gana el segundo</p>
            <div className="btns" style={{ marginTop: 12 }}>
              <button className="btn" onClick={lomasProbable}>Completar con lo más probable</button>
              <button className="btn ghost" onClick={() => setFijados({})}>Limpiar</button>
            </div>
          </div>
        </div>
      </div>
      <div className="stack">
        <div className="card">
          <div className="card-h"><h2>Así quedaría</h2><span className="hint">{eligio ? "con tu escenario" : "sin cambios"}</span></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th /><th className="l">Equipo</th><th className="pts">Pts</th></tr></thead>
              <tbody>
                {orden.map((i, pos) => {
                  const id = ids[i];
                  const z = zona(pos, N, d.categoria, d.reglamento.ascensos, d.reglamento.descensos);
                  return (
                    <tr key={id} className={`${z} ${fav?.torneoId === d.torneoId && fav.equipoId === id ? "fav" : ""}`}>
                      <td className="pos">{pos + 1}</td>
                      <td className="l team-cell sim-eq"><EquipoLink e={eq(id)} href={rutaEquipo(d, eq(id).slug)} /></td>
                      <td className="pts num">{pts(i)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="legend">
            {clausura ? (
              <>
                <span><i style={{ background: "var(--zone-oro)" }} />Copa de Oro{d.esPrimera ? "" : " · asciende"}</span>
                <span><i style={{ background: "var(--zone-plata)" }} />Copa de Plata</span>
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
          <p className="fine" style={{ padding: "8px 16px 14px", margin: 0 }}>Posiciones con los resultados que elegiste. Los partidos que no elijas todavía no suman puntos.</p>
        </div>
      </div>
    </div>
  );
}
