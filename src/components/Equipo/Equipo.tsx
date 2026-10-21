"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { DatosDivisional } from "@/lib/datos";
import { rutaDivisional, rutaEquipo, rutaSeccion } from "@/lib/datos";
import { METAS_VISIBLES } from "@/lib/engine/types";
import { diaCorto, pct, pp } from "@/lib/format";
import { guardarFavorito, useFavorito } from "@/lib/favorito";
import { chance, esBueno, METAS, metaPrincipal, metasDe, txtChance, type Meta } from "@/lib/objetivos";
import { Escudo } from "../Escudo";
import { Marca, MatchBar } from "../Piezas/Piezas";
import css from "./Equipo.module.css";

const corto = (n: string) => n.replace(/\b(F\.?C\.?|Fútbol Club|Futbol Club)\b/gi, "").trim().split(" ").slice(0, 2).join(" ");

function Cifra({ txt }: { txt: string }) {
  const num = txt.replace("%", "");
  const largo = num.length <= 2 ? "" : num.length <= 4 ? css.n3 : css.n5;
  return (
    <span className={`${css.numero} ${largo}`}>
      {num}
      {txt.endsWith("%") && <span className={css.pc}>%</span>}
    </span>
  );
}

const PREGUNTA: Record<Meta, string> = {
  campeon: "¿Con cuántos puntos salgo campeón?",
  asciende: "¿Con cuántos puntos asciendo?",
  desciende: "¿Con cuántos puntos me salvo?",
  copaOro: "¿Con cuántos puntos gano la Copa de Oro?",
  copaPlata: "¿Con cuántos puntos gano la Copa de Plata?",
  copaBronce: "¿Con cuántos puntos gano la Copa de Bronce?",
};

export function Equipo({ d, equipoId }: { d: DatosDivisional; equipoId: number }) {
  const fav = useFavorito();
  const params = useSearchParams();
  const i = d.equipos.findIndex((e) => e.id === equipoId);
  const yo = d.equipos[i];
  const metas = metasDe(d);
  const pedido = params.get("objetivo") as Meta | null;
  const [m, setM] = useState<Meta>(() => (pedido && metas.includes(pedido) ? pedido : metaPrincipal(d, i)));
  useEffect(() => {
    if (pedido && metas.includes(pedido)) setM(pedido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido]);
  const [aviso, setAviso] = useState<string | null>(null);

  const esMio = fav?.torneoId === d.torneoId && fav.equipoId === equipoId;
  const o = METAS[m];
  const c = chance(d, m, i);
  const k = METAS_VISIBLES.indexOf(m);

  const tabla = [...d.tablaOficial].sort((x, y) => y.pts - x.pts || y.gf - y.gc - (x.gf - x.gc) || y.gf - x.gf);
  const pos = tabla.findIndex((f) => f.equipoId === equipoId);
  const pts = tabla[pos].pts;
  const ix = new Map(d.equipos.map((e, j) => [e.id, j]));
  const eq = (id: number) => d.equipos[ix.get(id)!];
  const restantes = d.partidos.filter((p) => p.fase === "regular" && p.golesA === null);
  const mios = restantes.filter((p) => p.a === equipoId || p.b === equipoId);
  const prox = mios[0];
  const rival = prox ? eq(prox.a === equipoId ? prox.b : prox.a) : null;
  const filaDe = (id: number) => ({ pos: tabla.findIndex((f) => f.equipoId === id) + 1, pts: tabla.find((f) => f.equipoId === id)!.pts });

  // ¿Qué pasa si…? con el resultado de su próximo partido
  const what = prox
    ? (["Gana", "Empata", "Pierde"] as const).map((lab, z) => {
        const res = prox.a === equipoId ? z : 2 - z;
        const cc = d.simulacion.condicional[restantes.indexOf(prox)][res];
        const v = cc.n ? cc[m][i] / cc.n : 0;
        return { lab, v, delta: v - c.p, color: ["var(--match-win)", "var(--match-draw)", "var(--match-lose)"][z] };
      })
    : [];

  // ¿Con cuántos puntos…? (las mismas simulaciones; "seguro" / "no alcanza" solo si es exacto)
  const exacta = d.certezaPuntos?.[i] ?? null;
  const filasPts = Object.entries(d.simulacion.porPuntos[i])
    .map(([kpts, v]) => {
      const p = Number(kpts);
      const cz = exacta?.[p];
      const ex = cz ? (m === "asciende" ? cz.asciende : m === "desciende" ? cz.desciende : m === "campeon" ? (d.categoria === "Apertura" && !d.reglamento.finalDesempatePrimero ? cz.primero : cz.arriba === 0 ? 0 : null) : cz.arriba === 0 && m === "copaOro" ? 0 : null) : null;
      return { p, veces: v[0], v: v[k + 1] / v[0], ex };
    })
    .filter((r) => r.veces / d.simulacion.n >= 0.002)
    .sort((a, b) => a.p - b.p);
  const maxPts = pts + 3 * mios.length;

  // Partidos de otros que más le mueven esta chance
  const otros = restantes
    .map((p, kk) => ({ p, kk }))
    .filter(({ p }) => p.a !== equipoId && p.b !== equipoId)
    .map(({ p, kk }) => {
      const cc = d.simulacion.condicional[kk];
      const deltas = cc.map((x) => (x.n ? x[m][i] / x.n - c.p : 0));
      const z = deltas.reduce((best, v, j) => (Math.abs(v) > Math.abs(deltas[best]) ? j : best), 0);
      return { p, z, delta: deltas[z] };
    })
    .filter((x) => Math.abs(x.delta) >= 0.005)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  const compartir = async () => {
    const txt = `${yo.nombre} tiene ${txtChance(chance(d, m, i))} de chances de ${o.largo} (Serie ${d.serie} · Div. ${d.divisional}, después de la fecha ${d.ultimaJugada}). Calculadora Liga Pro`;
    const url = `${location.origin}${rutaEquipo(d, yo.slug)}?objetivo=${m}`;
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text: txt, url });
        return;
      }
      await navigator.clipboard.writeText(`${txt} ${url}`);
      setAviso("Copiado. Pegalo en el grupo del cuadro.");
    } catch {
      setAviso(`${txt} ${url}`);
    }
    setTimeout(() => setAviso(null), 2400);
  };

  const sanc = (id: number) => d.sanciones.filter((s) => s.equipoId === id && s.pendientes > 0);
  const cerca = tabla.slice(Math.max(0, Math.min(pos - 2, tabla.length - 5)), Math.max(0, Math.min(pos - 2, tabla.length - 5)) + 5);
  const hoy = new Date();
  const fechaHoy = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`;

  return (
    <main className={css.cuerpo}>
      <div className={css.principal}>
        {!esMio && fav && (
          <Link className={css.volver} href="/">← Volver a tu cuadro</Link>
        )}

        {/* La ficha: pensada para captura de pantalla */}
        <section className={css.ficha} aria-label={`Ficha de ${yo.nombre}`}>
          <div className={css.fichaSobre}>Serie {d.serie} · Divisional {d.divisional} · {d.categoria} {d.anio}</div>
          <div className={css.fichaEquipo}>
            <span className={css.aro}><Escudo nombre={yo.nombre} url={yo.escudo} tam="lg" /></span>
            <div>
              <h1 className={css.fichaNombre} style={{ margin: 0 }}>{yo.nombre}</h1>
              <div className={css.fichaMeta}>
                {pos + 1}º · {pts} pts · {mios.length === 0 ? "ya jugó toda la fase regular" : mios.length === 1 ? "le queda 1 partido" : `le quedan ${mios.length} partidos`}
              </div>
            </div>
          </div>
          <div className={css.fichaCuerpo}>
            <div className={css.cifra}>
              <Cifra txt={txtChance(c)} />
              <span className={css.etiqueta}>chances de<br />{o.largo}</span>
            </div>
            <div className={css.tiles} role="group" aria-label="Elegí qué chance mirar">
              {metas.map((mm) => {
                const cc = chance(d, mm, i);
                return (
                  <button key={mm} type="button" className={css.tile} aria-pressed={mm === m} onClick={() => setM(mm)}>
                    <span className={css.tileK}><Marca m={mm} />{METAS[mm].tile}</span>
                    <span className={`${css.tileV} ${cc.aDefinir ? css.aDef : ""}`} style={cc.aDefinir ? undefined : { color: mm === "campeon" ? "#93C5FD" : mm === "asciende" ? "#4ADE80" : mm === "copaOro" ? "#FACC15" : mm === "copaPlata" ? "#CBD5E1" : mm === "copaBronce" ? "#FB923C" : "#F87171" }}>
                      {txtChance(cc)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className={css.fichaPie}>
            <b>LigaPro · <span>Calculadora</span></b>
            <span>Después de la fecha {d.ultimaJugada} · {fechaHoy}</span>
          </div>
        </section>

        <div className={css.acciones}>
          {esMio ? (
            <span className={css.btnSec}><span className={css.estrella} aria-hidden>★</span> Es tu cuadro</span>
          ) : (
            <button type="button" className={css.btnSec} onClick={() => guardarFavorito({ torneoId: d.torneoId, equipoId, slug: yo.slug, nombre: yo.nombre, serie: d.serie, divisional: d.divisional })}>
              <span className={css.estrella} aria-hidden>★</span> Hacerlo mi equipo
            </button>
          )}
          <button type="button" className={css.btn} onClick={compartir}>Copiar para compartir</button>
        </div>

        <div className={css.dos}>
          {prox && rival && (
            <section className={css.card}>
              <div className={css.cardH}><h2>¿Qué pasa si…?</h2><span>vs {corto(rival.nombre)} · fecha {prox.fecha}</span></div>
              <p className={css.bajada}>Chances de {o.largo} según el resultado.</p>
              <div className={css.what}>
                {what.map((w) => (
                  <div key={w.lab} style={{ borderTopColor: w.color }}>
                    <div className={css.whatK}>{w.lab.toUpperCase()}</div>
                    <div className={css.whatV} style={{ color: o.texto }}>{pct(w.v * 100)}</div>
                    {Math.abs(w.delta) >= 0.0005 && (
                      <div className={`${css.whatD} ${esBueno(m, w.delta) ? css.up : css.down}`}>
                        <span aria-hidden>{w.delta > 0 ? "▲" : "▼"}</span> {pp(Math.abs(w.delta) * 100).replace("+", "")} pp
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {filasPts.length > 1 && !c.aDefinir && (
            <section className={css.card}>
              <div className={css.cardH}><h2>{PREGUNTA[m]}</h2></div>
              <p className={css.bajada}>Hoy tiene {pts} y puede llegar a {maxPts}. Chance según con cuántos termine.</p>
              <div className={css.puntos}>
                {filasPts.map((r) => {
                  // en Desciende, la barra es la chance de salvarse
                  const v = m === "desciende" ? 1 - r.v : r.v;
                  const seguro = m === "desciende" ? r.ex === 0 : r.ex === 1;
                  const nunca = m === "desciende" ? r.ex === 1 : r.ex === 0;
                  const txt = seguro ? "seguro" : nunca ? "no alcanza" : txtChance({ p: v, seguro: null });
                  const color = m === "desciende" ? METAS.asciende.barra : o.barra;
                  return (
                    <div key={r.p} className={css.punto}>
                      <b>{r.p} pts</b>
                      <span className={css.track}><span style={{ width: `${v * 100}%`, background: color }} /></span>
                      <span style={{ color: m === "desciende" ? METAS.asciende.texto : o.texto, fontWeight: seguro || nunca ? 700 : 800 }}>{txt}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <Evolucion d={d} i={i} m={m} />
      </div>

      <aside className={css.lateral}>
        {mios.length > 0 && (
          <section className={css.card}>
            <div className={css.cardH}><h2>Lo que le queda</h2></div>
            <div style={{ marginTop: 12 }}>
              {mios.map((p) => {
                const op = eq(p.a === equipoId ? p.b : p.a);
                const pr = d.proximos[p.id];
                const mm: [number, number, number] = p.a === equipoId ? pr : [pr[2], pr[1], pr[0]];
                const f = filaDe(op.id);
                return (
                  <div key={p.id} className={css.queda}>
                    <div className={css.quedaH}>
                      <span>Fecha {p.fecha}{p.dia ? ` · ${diaCorto(p.dia)}` : ""}{p.hora ? ` · ${p.hora}` : ""}</span>
                      <span>rival {f.pos}º · {f.pts} pts</span>
                    </div>
                    <Link className={css.quedaVs} href={rutaEquipo(d, op.slug)}>vs {op.nombre}</Link>
                    <MatchBar p={mm} numeros />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className={css.card}>
          <div className={css.cardH}><h2>Partidos de otros que más te importan</h2></div>
          <p className={css.bajada}>Cuánto cambia la chance de {o.largo}, en puntos porcentuales.</p>
          {otros.length ? (
            otros.map(({ p, z, delta }) => {
              const que = z === 0 ? `Que gane ${corto(eq(p.a).nombre)}` : z === 2 ? `Que gane ${corto(eq(p.b).nombre)}` : `Que empaten ${corto(eq(p.a).nombre)} y ${corto(eq(p.b).nombre)}`;
              return (
                <div key={p.id} className={css.otro}>
                  <div>
                    <b>{que}</b>
                    <small>Fecha {p.fecha} · {eq(p.a).nombre} vs {eq(p.b).nombre}</small>
                  </div>
                  <span className={`${css.otroD} ${esBueno(m, delta) ? css.up : css.down}`}>{pp(delta * 100)}</span>
                </div>
              );
            })
          ) : (
            <p className={css.bajada} style={{ margin: 0 }}>Ningún otro partido le cambia esta chance: ya está definida.</p>
          )}
        </section>

        <section className={css.card}>
          <div className={css.cardH}><h2>Sancionados</h2><Link href={rutaSeccion(d, "sancionados")}>Ver todos</Link></div>
          <Sanciones titulo={`De ${yo.nombre}`} lista={sanc(equipoId)} vacio={`${yo.nombre} tiene a todos: nadie suspendido.`} />
          {rival && <Sanciones titulo={`De ${rival.nombre}, su próximo rival`} lista={sanc(rival.id)} vacio="Tiene a todos: nadie suspendido." />}
        </section>

        <section className={css.card}>
          <div className={css.cardH}><h2>Cerca en la tabla</h2><Link href={rutaDivisional(d)}>Tabla completa</Link></div>
          <table className={css.tabla}>
            <tbody>
              {cerca.map((f) => {
                const j = ix.get(f.equipoId)!;
                const pp_ = tabla.findIndex((t) => t.equipoId === f.equipoId);
                return (
                  <tr key={f.equipoId} className={f.equipoId === equipoId ? css.mio : pp_ < 4 ? css.top4 : ""}>
                    <td>{pp_ + 1}</td>
                    <td><Link href={rutaEquipo(d, eq(f.equipoId).slug)}>{eq(f.equipoId).nombre}</Link></td>
                    <td>{f.pts}</td>
                    <td style={{ color: o.texto }}>{txtChance(chance(d, m, j))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <Link className={css.btnSec} href="/elegir">Cambiar de equipo</Link>
      </aside>
      {aviso && <div className={css.toast} role="status">{aviso}</div>}
    </main>
  );
}

function Sanciones({ titulo, lista, vacio }: { titulo: string; lista: DatosDivisional["sanciones"]; vacio: string }) {
  return (
    <>
      <div className={css.grupo}>{titulo}</div>
      {lista.length ? (
        lista.map((s) => (
          <div key={s.jugador + s.tipo} className={css.sanc}>
            <div>
              <b>{s.jugador}</b>
              <small>
                <span className={css.tarjeta} style={{ background: s.tipo === "Roja" ? "var(--card-red)" : "var(--card-yellow)" }} aria-hidden />
                {s.tipo} · {s.fechas} {s.fechas === 1 ? "fecha" : "fechas"}
              </small>
            </div>
            <span className={css.leQueda}>{s.pendientes === 1 ? "Le queda 1" : `Le quedan ${s.pendientes}`}</span>
          </div>
        ))
      ) : (
        <p className={css.todos}>{vacio}</p>
      )}
    </>
  );
}

function Evolucion({ d, i, m }: { d: DatosDivisional; i: number; m: Meta }) {
  const ev = d.evolucion.filter((e) => e.fecha > 0);
  if (ev.length < 2 || (m === "copaPlata" && d.reglamento.plataSinFormato)) return null;
  const o = METAS[m];
  return (
    <section className={css.card}>
      <div className={css.cardH}><h2>Cómo vino su chance</h2><span>{o.corto} · fecha a fecha</span></div>
      {/* dos tamaños de dibujo para que el texto se lea igual en celular y en escritorio */}
      <div className={css.soloCel}><Grafico d={d} i={i} m={m} W={360} H={190} /></div>
      <div className={css.soloDesk}><Grafico d={d} i={i} m={m} W={760} H={220} /></div>
    </section>
  );
}

function Grafico({ d, i, m, W, H }: { d: DatosDivisional; i: number; m: Meta; W: number; H: number }) {
  const ev = d.evolucion.filter((e) => e.fecha > 0);
  const o = METAS[m];
  const pl = 54, pr = 28, pt = 28, pb = 30;
  const xs = (j: number) => pl + (j * (W - pl - pr)) / (ev.length - 1);
  const ys = (v: number) => pt + (1 - v) * (H - pt - pb);
  const pts = ev.map((e, j) => `${xs(j).toFixed(1)},${ys(e[m][i]).toFixed(1)}`).join(" ");
  const ult = ev[ev.length - 1][m][i];
  const paso = Math.ceil(ev.length / (W < 500 ? 7 : 10));
  return (
      <svg className={css.grafico} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Chance de ${o.largo} después de cada fecha: ${ev.map((e) => `fecha ${e.fecha} ${pct(e[m][i] * 100)}`).join(", ")}`}>
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={pl} x2={W - pr} y1={ys(v)} y2={ys(v)} stroke="var(--line)" strokeWidth="1" />
            <text x={pl - 10} y={ys(v) + 4} textAnchor="end" fontSize="13" fill="var(--text-2)">{v * 100}%</text>
          </g>
        ))}
        {ev.map((e, j) => (j % paso === 0 || j === ev.length - 1 ? <text key={e.fecha} x={xs(j)} y={H - 8} textAnchor="middle" fontSize="13" fill="var(--text-2)">F{e.fecha}</text> : null))}
        <polyline points={pts} fill="none" stroke={o.barra} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={xs(ev.length - 1)} cy={ys(ult)} r="6" fill={o.barra} />
        <text x={xs(ev.length - 1)} y={Math.max(ys(ult) - 14, 14)} textAnchor="middle" fontSize="15" fontWeight="800" fill={o.texto}>{pct(ult * 100)}</text>
      </svg>
  );
}
