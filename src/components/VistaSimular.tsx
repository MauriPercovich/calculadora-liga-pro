"use client";
import { useMemo, useState } from "react";
import type { DatosDivisional } from "@/lib/datos";
import { rutaEquipo } from "@/lib/datos";
import { probabilidades, type ModeloGoles } from "@/lib/engine/model";
import { simular } from "@/lib/engine/simulate";
import { useFavorito } from "@/lib/favorito";
import { EquipoLink } from "./ui";
import { chance, METAS, txtChance, type Meta } from "@/lib/objetivos";

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
  const res = useMemo(() => (eligio ? simular(d, d.reglamento, modelo, { n: 8000, semilla: 17, fijados }) : d.simulacion), [d, modelo, fijados, eligio]);
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
  const P = res.prob;
  // Columnas: en el Clausura importa el 1º y a qué copa va; en el Apertura, campeón, ascenso y descenso.
  const cols: { m: Meta; titulo: string }[] =
    d.categoria === "Clausura"
      ? [{ m: "primero", titulo: "1º" }, { m: "zonaOro", titulo: "Oro" }, { m: "zonaPlata", titulo: "Plata" }, { m: "zonaBronce", titulo: "Bronce" }]
      : [{ m: "campeon", titulo: "Camp." }, ...(d.esPrimera ? [] : [{ m: "asciende" as Meta, titulo: "Asc." }]), { m: "desciende", titulo: "Desc." }];
  // Sin escenario valen las certezas exactas; con escenario no se sabe si es seguro: 0 y 1 se muestran como <0,1% / >99,9%.
  // Con todo fijado la tabla final ya no depende del azar: ahí 0% y 100% sí son seguros.
  const todo = restantes.every((p) => fijados[p.id] !== undefined);
  const txt = (m: Meta, i: number) => {
    if (!eligio) return txtChance(chance(d, m, i));
    const p = P[m][i];
    // el campeón del Clausura sale de las copas, que siguen siendo azar
    return txtChance({ p, seguro: todo && m !== "campeon" && (p === 0 || p === 1) ? (p as 0 | 1) : null });
  };
  const pts = (i: number) => d.tablaOficial.find((f) => f.equipoId === ids[i])!.pts + (extra.get(ids[i]) ?? 0);
  const dg = (i: number) => { const f = d.tablaOficial.find((x) => x.equipoId === ids[i])!; return f.gf - f.gc; };
  const orden = [...ids.keys()].sort((a, b) => pts(b) - pts(a) || d.simulacion.puntosEsperados[b] - d.simulacion.puntosEsperados[a] || dg(b) - dg(a));

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
            <p className="fine" style={{ margin: "0 0 6px" }}>Elegí resultados. Los partidos que no toques los sigue simulando el modelo.</p>
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
            <table className="sim-tbl">
              <thead><tr><th className="l">Equipo</th><th className="pts">Pts</th>{cols.map((c) => <th key={c.m}>{c.titulo}</th>)}</tr></thead>
              <tbody>
                {orden.map((i) => {
                  const id = ids[i];
                  return (
                    <tr key={id} className={fav?.torneoId === d.torneoId && fav.equipoId === id ? "fav" : ""}>
                      <td className="l team-cell"><EquipoLink e={eq(id)} href={rutaEquipo(d, eq(id).slug)} /></td>
                      <td className="pts num">{pts(i)}</td>
                      {cols.map((c) => (
                        <td key={c.m} className="num" style={{ color: METAS[c.m].texto, fontWeight: 700 }}>{txt(c.m, i)}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="fine" style={{ padding: "8px 16px 14px", margin: 0 }}>Puntos con los resultados que elegiste; los partidos sin tocar todavía no suman, pero sí cuentan en las chances.</p>
        </div>
      </div>
    </div>
  );
}
