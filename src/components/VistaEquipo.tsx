"use client";
import { useState } from "react";
import Link from "next/link";
import type { DatosDivisional } from "@/lib/datos";
import { rutaDivisional, rutaEquipo } from "@/lib/datos";
import { diaCorto, objetivoPrincipal, objetivosDe, OBJETIVOS, pct, type ObjetivoVisible } from "@/lib/formato";
import { guardarFavorito, useFavorito } from "@/lib/favorito";
import { Escudo } from "./Escudo";
import { Chips, EquipoLink, ordenarTabla, Tri, zona } from "./ui";

type Cond = "campeon" | "asciende" | "desciende";

export function VistaEquipo({ d, equipoId }: { d: DatosDivisional; equipoId: number }) {
  const fav = useFavorito();
  const [aviso, setAviso] = useState<string | null>(null);
  const N = d.equipos.length;
  const i = d.equipos.findIndex((e) => e.id === equipoId);
  const yo = d.equipos[i];
  const ix = new Map(d.equipos.map((e, k) => [e.id, k]));
  const eq = (id: number) => d.equipos[ix.get(id)!];
  const href = (id: number) => rutaEquipo(d, eq(id).slug);
  const P = d.simulacion.prob as unknown as Record<string, number[]>;
  const posibles = objetivosDe(d.categoria, d.esPrimera);
  const principal = objetivoPrincipal(P, i, posibles);
  const [obj, setObj] = useState<ObjetivoVisible>(principal);

  const tabla = ordenarTabla(d.tablaOficial);
  const pos = tabla.findIndex((f) => f.equipoId === equipoId);
  const pts = tabla[pos].pts;
  const restantes = d.partidos.filter((p) => p.fase === "regular" && p.golesA === null);
  const mios = restantes.filter((p) => p.a === equipoId || p.b === equipoId);
  const prox = mios[0];
  const rival = prox ? (prox.a === equipoId ? prox.b : prox.a) : null;
  const esFav = fav?.torneoId === d.torneoId && fav.equipoId === equipoId;

  // Objetivo que siguen "¿qué pasa si…?", los puntos necesarios y los partidos que importan.
  const cond: Cond = obj === "campeon" || obj === "desciende" ? obj : !d.esPrimera && (obj === "asciende" || obj === "copaOro") ? "asciende" : principal === "desciende" ? "desciende" : d.esPrimera ? "campeon" : "asciende";
  const base = P[cond][i];

  // Puntos finales -> chance del objetivo (de las mismas simulaciones).
  const porPts = d.simulacion.porPuntos[i];
  const col = cond === "asciende" ? 1 : cond === "desciende" ? 2 : 3;
  const filas = Object.entries(porPts)
    .map(([k, v]) => ({ k: Number(k), veces: v[0], p: v[col] / v[0] }))
    .filter((r) => r.veces / d.simulacion.n > 0.003)
    .sort((a, b) => a.k - b.k);
  const seguro = cond === "desciende" ? filas.find((r) => r.p <= 0.05) : filas.find((r) => r.p >= 0.95);

  const impactan = restantes
    .map((p, k) => ({ p, k }))
    .filter(({ p }) => p.a !== equipoId && p.b !== equipoId)
    .map(({ p, k }) => {
      const c = d.simulacion.condicional[k];
      const dif = c.map((x) => (x.n ? x[cond][i] / x.n - base : 0));
      return { p, dif, rango: Math.max(...dif) - Math.min(...dif) };
    })
    .sort((a, b) => b.rango - a.rango)
    .slice(0, 4);

  const compartir = async () => {
    const o = principal;
    const txt = `${yo.nombre} tiene ${pct(P[o][i])} de chances de ${OBJETIVOS[o].largo} · Calculadora Liga Pro ${location.href}`;
    try {
      await navigator.clipboard.writeText(txt);
      setAviso("Copiado: pegalo en WhatsApp o donde quieras");
    } catch {
      setAviso(txt);
    }
    setTimeout(() => setAviso(null), 3000);
  };

  return (
    <div className="grid">
      <div className="stack">
        <div className="card">
          <div className="hero">
            <Escudo nombre={yo.nombre} url={yo.escudo} tam="lg" />
            <div>
              <div className="eyebrow">Serie {d.serie} · Divisional {d.divisional} · {d.categoria} {d.anio}</div>
              <h2>{yo.nombre}</h2>
              <div className="meta">{pos + 1}º · {pts} pts · {mios.length} {mios.length === 1 ? "partido restante" : "partidos restantes"}</div>
            </div>
            <div className="big" style={{ color: OBJETIVOS[obj].color }}>
              {pct(P[obj][i])}
              <small>chances de {OBJETIVOS[obj].largo}</small>
            </div>
          </div>
          <div className="card-b">
            <Chips prob={P} i={i} posibles={posibles} activo={obj} alElegir={setObj} />
            <div className="btns" style={{ marginTop: 12 }}>
              {esFav ? (
                <span className="pill">★ Es tu equipo</span>
              ) : (
                <button className="btn" onClick={() => guardarFavorito({ torneoId: d.torneoId, equipoId, slug: yo.slug, nombre: yo.nombre, serie: d.serie, divisional: d.divisional })}>★ Hacerlo mi equipo</button>
              )}
              <button className="btn ghost" onClick={compartir}>Copiar para compartir</button>
            </div>
          </div>
        </div>

        {prox && rival !== null && (
          <div className="card">
            <div className="card-h"><h2>¿Qué pasa si…?</h2><span className="hint">vs {eq(rival).nombre} · fecha {prox.fecha}</span></div>
            <div className="card-b">
              <div className="what">
                {(["Gana", "Empata", "Pierde"] as const).map((lab, z) => {
                  const k = restantes.indexOf(prox);
                  const res = prox.a === equipoId ? [0, 1, 2][z] : [2, 1, 0][z];
                  const c = d.simulacion.condicional[k][res];
                  const v = c.n ? c[cond][i] / c.n : 0;
                  return (
                    <div key={lab}>
                      <div className="k" style={{ color: ["var(--c-asc)", "var(--muted)", "var(--c-desc)"][z] }}>{lab}</div>
                      <div className="v" style={{ color: OBJETIVOS[cond].color }}>{pct(v)}</div>
                      <div className="s">de {OBJETIVOS[cond].largo}</div>
                    </div>
                  );
                })}
              </div>
              <p className="fine" style={{ margin: "8px 0 0" }}>Fijamos ese resultado y simulamos todo lo demás.</p>
            </div>
          </div>
        )}

        {filas.length > 1 && (
          <div className="card">
            <div className="card-h"><h2>¿Con cuántos puntos {cond === "asciende" ? "asciendo" : cond === "desciende" ? "me salvo" : "salgo campeón"}?</h2></div>
            <div className="card-b">
              <div className="hist" role="img" aria-label={`Chance de ${OBJETIVOS[cond].largo} según los puntos finales`}>
                {filas.map((r) => (
                  <div key={r.k}>
                    <span className="val" style={{ color: OBJETIVOS[cond].color }}>{pct(r.p)}</span>
                    <span className="col" style={{ height: `${Math.max(r.p * 100, 1)}%`, background: OBJETIVOS[cond].color }} />
                    <span className="lab">{r.k} pts</span>
                  </div>
                ))}
              </div>
              <p className="fine" style={{ margin: "10px 0 0" }}>
                {seguro && (
                  <>
                    Con <b>{seguro.k} puntos</b> {cond === "desciende" ? "casi seguro se salva" : `${OBJETIVOS[cond].largo} en el 95% de los casos`}: necesita sumar {Math.max(seguro.k - pts, 0)} de los {mios.length * 3} que quedan.{" "}
                  </>
                )}
                Sale de las mismas simulaciones: llegar a un puntaje ganándole a un rival directo no vale lo mismo que ganándole a otro.
              </p>
            </div>
          </div>
        )}

        {impactan.length > 0 && (
          <div className="card">
            <div className="card-h"><h2>Partidos de otros que más te importan</h2></div>
            <div className="card-b">
              {impactan.map(({ p, dif }) => (
                <div className="imp" key={p.id}>
                  <div style={{ fontWeight: 700 }}>{eq(p.a).nombre} vs {eq(p.b).nombre} <span className="fine">· fecha {p.fecha}</span></div>
                  <div className="row">
                    {([`Gana ${eq(p.a).nombre}`, "Empate", `Gana ${eq(p.b).nombre}`] as const).map((lab, z) => {
                      const v = dif[z];
                      const bueno = cond === "desciende" ? v < 0 : v > 0;
                      return (
                        <span key={z}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lab}</span>
                          <b className={Math.abs(v) < 0.0005 ? "" : bueno ? "pos-d" : "neg-d"}>{v >= 0 ? "+" : ""}{(v * 100).toFixed(1).replace(".", ",")}</b>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
              <p className="fine" style={{ margin: "8px 0 0" }}>Cuánto cambian las chances de {OBJETIVOS[cond].largo} de {yo.nombre}, en puntos porcentuales.</p>
            </div>
          </div>
        )}
      </div>

      <div className="stack">
        {mios.length > 0 && (
          <div className="card">
            <div className="card-h"><h2>Lo que le queda</h2></div>
            <div className="card-b">
              {mios.map((p) => {
                const op = p.a === equipoId ? p.b : p.a;
                const pr = d.proximos[p.id];
                const m: [number, number, number] = p.a === equipoId ? pr : [pr[2], pr[1], pr[0]];
                return (
                  <div className="match" key={p.id}>
                    <div className="m-meta"><span>Fecha {p.fecha} · {diaCorto(p.dia)}{p.hora ? ` · ${p.hora}` : ""}</span></div>
                    <EquipoLink e={eq(op)} href={href(op)} />
                    <Tri p={m} />
                    <div className="m-meta"><span>Gana {pct(m[0])}</span><span>Empata {pct(m[1])}</span><span>Pierde {pct(m[2])}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Evolucion d={d} i={i} />

        <div className="card">
          <div className="card-h"><h2>Sancionados</h2></div>
          <div className="card-b">
            <ListaSanciones d={d} equipoId={equipoId} titulo={`De ${yo.nombre}`} />
            {rival !== null && <ListaSanciones d={d} equipoId={rival} titulo={`Del próximo rival, ${eq(rival).nombre}`} />}
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h2>Posiciones</h2><Link className="hint" href={rutaDivisional(d)}>Ver todo</Link></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th /><th className="l">Equipo</th><th className="pts">Pts</th><th>{d.esPrimera ? "Camp." : "Asc."}</th><th>Desc.</th></tr></thead>
              <tbody>
                {tabla.map((f, k) => (
                  <tr key={f.equipoId} className={`${zona(k, N, d.categoria, d.reglamento.ascensos, d.reglamento.descensos)} ${f.equipoId === equipoId ? "fav" : ""}`}>
                    <td className="pos">{k + 1}</td>
                    <td className="l team-cell"><EquipoLink e={eq(f.equipoId)} href={href(f.equipoId)} /></td>
                    <td className="pts num">{f.pts}</td>
                    <td className="num">{pct(d.esPrimera ? P.campeon[ix.get(f.equipoId)!] : P.asciende[ix.get(f.equipoId)!])}</td>
                    <td className="num">{pct(P.desciende[ix.get(f.equipoId)!])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {aviso && <div className="toast" role="status">{aviso}</div>}
    </div>
  );
}

function ListaSanciones({ d, equipoId, titulo }: { d: DatosDivisional; equipoId: number; titulo: string }) {
  const lista = d.sanciones.filter((s) => s.equipoId === equipoId && s.pendientes > 0);
  return (
    <>
      <div className="eyebrow" style={{ margin: "6px 0" }}>{titulo}</div>
      {lista.length ? (
        lista.map((s) => (
          <div className="match" style={{ padding: "8px 0" }} key={s.jugador + s.tipo}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <b>{s.jugador}</b>
              <span className={`pill ${s.tipo === "Roja" ? "red" : "warn"}`}>{s.tipo}</span>
            </div>
            <div className="fine">{s.pendientes === s.fechas ? `${s.fechas} ${s.fechas === 1 ? "fecha" : "fechas"} de suspensión` : `Le quedan ${s.pendientes} de ${s.fechas} fechas`}</div>
          </div>
        ))
      ) : (
        <p className="fine" style={{ margin: "0 0 8px" }}>Sin sancionados.</p>
      )}
    </>
  );
}

function Evolucion({ d, i }: { d: DatosDivisional; i: number }) {
  const ev = d.evolucion;
  if (ev.length < 2) return null;
  const W = 320, H = 120, pl = 32, pr = 10, pt = 10, pb = 22;
  const ultima = ev.length - 1;
  const xs = (j: number) => pl + (j * (W - pl - pr)) / ultima;
  const ys = (v: number) => pt + (1 - v) * (H - pt - pb);
  const series: { k: "asciende" | "desciende" | "campeon"; color: string; txt: string }[] = d.esPrimera
    ? [{ k: "campeon", color: "var(--c-camp)", txt: "Campeón" }, { k: "desciende", color: "var(--c-desc)", txt: "Descender" }]
    : [{ k: "asciende", color: "var(--c-asc)", txt: "Ascender" }, { k: "desciende", color: "var(--c-desc)", txt: "Descender" }];
  const paso = Math.ceil(ev.length / 8);
  return (
    <div className="card">
      <div className="card-h"><h2>Evolución</h2><span className="hint">después de cada fecha</span></div>
      <div className="card-b">
        <svg className="spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Chances después de cada fecha">
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <line x1={pl} x2={W - pr} y1={ys(v)} y2={ys(v)} stroke="var(--line)" />
              <text x={pl - 6} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{v * 100}%</text>
            </g>
          ))}
          {ev.map((e, j) => (j % paso === 0 || j === ultima ? <text key={j} x={xs(j)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">{e.fecha === 0 ? "Inicio" : `F${e.fecha}`}</text> : null))}
          {series.map((s) => (
            <g key={s.k}>
              <polyline points={ev.map((e, j) => `${xs(j).toFixed(1)},${ys(e[s.k][i]).toFixed(1)}`).join(" ")} fill="none" stroke={s.color} strokeWidth="2" />
              <circle cx={xs(ultima)} cy={ys(ev[ultima][s.k][i])} r="3.5" fill={s.color} />
            </g>
          ))}
        </svg>
        <div className="legend" style={{ padding: "6px 0 0" }}>
          {series.map((s) => (
            <span key={s.k}><i style={{ background: s.color }} />{s.txt} {pct(ev[ultima][s.k][i])}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
