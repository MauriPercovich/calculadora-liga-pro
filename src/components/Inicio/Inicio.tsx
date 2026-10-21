"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DatosDivisional, DivisionalIndice, Indice, Picante } from "@/lib/datos";
import { rutaDivisional, rutaEquipo, rutaSeccion } from "@/lib/datos";
import { diaCorto, pct } from "@/lib/format";
import { guardarFavorito, useFavorito, type Favorito } from "@/lib/favorito";
import { chance, esBueno, implica, largo, METAS, metaPrincipal, metasDe, txtChance, valorAnterior, type Meta } from "@/lib/objetivos";
import { Escudo } from "../Escudo";
import { GoalRow, Marca, MatchBar } from "../Piezas/Piezas";
import { SelectorDivisional } from "../AppShell/AppShell";
import css from "./Inicio.module.css";

/** Corta "74%" en número y "%": el "%" va al 54 % del tamaño, en amarillo. */
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

export function Inicio({ indice }: { indice: Indice }) {
  const fav = useFavorito();
  const router = useRouter();
  const [datos, setDatos] = useState<DatosDivisional | null>(null);
  const [error, setError] = useState(false);

  // Si el favorito es de un torneo anterior, lo buscamos por nombre en el actual.
  const favActual = useMemo<Favorito | null>(() => {
    if (!fav) return null;
    if (indice.divisionales.some((x) => x.torneoId === fav.torneoId)) return fav;
    for (const x of indice.divisionales) {
      const e = x.equipos.find((q) => q.slug === fav.slug || q.nombre === fav.nombre);
      if (e) return { torneoId: x.torneoId, equipoId: e.id, slug: e.slug, nombre: e.nombre, serie: x.serie, divisional: x.divisional };
    }
    return null;
  }, [fav, indice]);

  useEffect(() => {
    if (fav !== undefined && !favActual) router.replace("/elegir");
  }, [fav, favActual, router]);

  useEffect(() => {
    if (!favActual) return;
    if (fav && favActual.torneoId !== fav.torneoId) guardarFavorito(favActual);
    let vivo = true;
    setError(false);
    fetch(`/data/divisionales/${favActual.torneoId}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => vivo && setDatos(j))
      .catch(() => vivo && setError(true));
    return () => {
      vivo = false;
    };
  }, [favActual, fav]);

  const div = favActual ? indice.divisionales.find((x) => x.torneoId === favActual.torneoId) ?? null : null;
  if (!favActual || !div) return <Cargando />;
  if (error) return <ErrorDatos />;
  if (!datos || datos.torneoId !== favActual.torneoId) return <Cargando />;

  const i = datos.equipos.findIndex((e) => e.id === favActual.equipoId);
  if (i < 0) return <ErrorDatos />;
  return <Portada d={datos} i={i} div={div} indice={indice} />;
}

function Portada({ d, i, div, indice }: { d: DatosDivisional; i: number; div: DivisionalIndice; indice: Indice }) {
  const yo = d.equipos[i];
  const metas = metasDe(d);
  const m = metaPrincipal(d, i);
  const c = chance(d, m, i);
  const antes = valorAnterior(d, m, i);
  const delta = antes ? c.p - antes.p : 0;
  const fila = div.equipos.find((e) => e.id === yo.id);
  const href = (slug: string, meta?: Meta) => `${rutaEquipo(d, slug)}${meta ? `?objetivo=${meta}` : ""}`;

  const prox = d.partidos.find((p) => p.fase === "regular" && p.golesA === null && (p.a === yo.id || p.b === yo.id));
  const rival = prox ? d.equipos.find((e) => e.id === (prox.a === yo.id ? prox.b : prox.a))! : null;
  const filaRival = rival ? div.equipos.find((e) => e.id === rival.id) : null;
  const pr = prox ? d.proximos[prox.id] : null;
  const mio: [number, number, number] | null = prox && pr ? (prox.a === yo.id ? pr : [pr[2], pr[1], pr[0]]) : null;
  const corto = (n: string) => n.split(" ")[0];

  // Lo más picante: primero tu divisional, después las de tu serie y el resto.
  const picantes = [
    ...div.picantes.map((p) => ({ p, d: div })),
    ...indice.divisionales
      .filter((x) => x.torneoId !== div.torneoId)
      .sort((a, b) => Number(b.serie === div.serie) - Number(a.serie === div.serie))
      .flatMap((x) => x.picantes.slice(0, 1).map((p) => ({ p, d: x }))),
  ].slice(0, 4);

  return (
    <>
      <section className={css.hero}>
        <div className={css.heroIn}>
          <div className={css.heroIzq}>
            <SelectorDivisional todas={indice.divisionales} className={css.heroSel} />
            <div className={css.equipo}>
              <span className={css.aro}><Escudo nombre={yo.nombre} url={yo.escudo} tam="lg" /></span>
              <div className={css.equipoTxt}>
                <div className={css.sobre}>TU CUADRO</div>
                <div className={css.nombre}>{yo.nombre}</div>
                <div className={css.meta}>
                  {fila?.pos}º · {fila?.pts} pts · fecha {div.ultimaJugada} de {div.totalFechas}
                </div>
              </div>
              <Link className={css.verFicha} href={href(yo.slug, m)}>Ver ficha</Link>
            </div>
          </div>
          <div className={css.cifra}>
            <Cifra txt={txtChance(c)} />
            <div className={css.etiqueta}>
              <b>
                chances de
                <br />
                {largo(d, m)}
              </b>
              {antes && Math.abs(delta) >= 0.005 && (
                <span className={`${css.variacion} ${esBueno(m, delta) ? css.sube : css.baja}`}>
                  <span aria-hidden>{delta > 0 ? "▲" : "▼"}</span> era {pct(antes.p * 100)} antes de la fecha {antes.fecha}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className={css.cuerpo}>
        <div className={css.principal}>
          {prox && rival && mio ? (
            <article className={`${css.card} ${css.proximo}`}>
              <div className={css.sobretitulo}>
                Próximo partido · fecha {prox.fecha}{prox.dia ? ` · ${diaCorto(prox.dia)}` : ""}{prox.hora ? ` · ${prox.hora}` : ""}
              </div>
              <div className={css.vs}>
                <Link className={css.lado} href={href(yo.slug)}>
                  <Escudo nombre={yo.nombre} url={yo.escudo} />
                  <b>{yo.nombre}</b>
                </Link>
                <span>vs</span>
                <Link className={`${css.lado} ${css.der}`} href={href(rival.slug)}>
                  <b>
                    {rival.nombre}
                    {filaRival && <small style={{ display: "block", fontSize: 12, fontWeight: 400, color: "var(--text-2)" }}>{filaRival.pos}º · {filaRival.pts} pts</small>}
                  </b>
                  <Escudo nombre={rival.nombre} url={rival.escudo} />
                </Link>
              </div>
              <div className={css.tres}>
                <div><b style={{ color: "var(--match-win)" }}>{pct(mio[0] * 100)}</b><small>Gana {corto(yo.nombre)}</small></div>
                <div><b>{pct(mio[1] * 100)}</b><small>Empate</small></div>
                <div><b style={{ color: "var(--text-2)" }}>{pct(mio[2] * 100)}</b><small>Gana {corto(rival.nombre)}</small></div>
              </div>
              <MatchBar p={mio} />
            </article>
          ) : (
            <article className={`${css.card} ${css.sinPartidos}`}>
              <b style={{ color: "var(--text)" }}>No le quedan partidos</b>
              <p style={{ margin: "4px 0 0" }}>Ya jugó toda la fase regular. Ahora depende de los demás.</p>
            </article>
          )}

          <section className={css.card} aria-labelledby="seis">
            <div className={css.cardH}>
              <h2 id="seis">Tus {metas.length} chances</h2>
              <span className={css.soloCel}>tocá una para ver más</span>
              <span className={css.soloDesk}>{d.simulacion.n.toLocaleString("es-UY")} simulaciones del resto del torneo</span>
            </div>
            <div className={css.filas}>
              {metas.map((k) => {
                const ck = chance(d, k, i);
                return <GoalRow key={k} m={k} p={ck.p} txt={txtChance(ck)} href={href(yo.slug, k)} aDefinir={ck.aDefinir} extra={implica(d, k)} />;
              })}
            </div>
            <div className={css.mosaicos}>
              {metas.map((k) => {
                const ck = chance(d, k, i);
                const o = METAS[k];
                return (
                  <Link key={k} href={href(yo.slug, k)} className={`${css.mosaico} ${k === m ? css.principalM : ""}`} style={{ color: o.texto }}>
                    <span className={css.mosaicoK}><Marca m={k} />{o.corto}{implica(d, k) && <small style={{ fontWeight: 600, color: "var(--text-2)" }}>· {implica(d, k)}</small>}</span>
                    <span className={`${css.mosaicoV} ${ck.aDefinir ? css.aDef : ""}`}>{txtChance(ck)}</span>
                    <span style={{ height: 6, borderRadius: 3, background: "var(--track)", overflow: "hidden", display: "block" }}>
                      {!ck.aDefinir && <span style={{ display: "block", height: "100%", width: `${ck.p > 0 ? Math.max(ck.p * 100, 1.5) : 0}%`, background: o.barra }} />}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {picantes.length > 0 && (
            <>
              <h2 className={css.titulo}>Lo destacado de la última fecha</h2>
              <div className={css.hot}>
                {picantes.map(({ p, d: dx }) => <TarjetaPicante key={p.partido.id} p={p} d={dx} />)}
              </div>
            </>
          )}
        </div>

        <aside className={css.lateral}>
          <MiniTabla d={d} div={div} yoId={yo.id} />
          <section className={css.card}>
            <div className={css.cardH}><h2>Otras divisionales</h2></div>
            <div className={css.chips}>
              {indice.divisionales.filter((x) => x.torneoId !== div.torneoId).map((x) => (
                <Link key={x.torneoId} className={css.chip} href={rutaDivisional(x)}>Serie {x.serie} · {x.divisional}</Link>
              ))}
            </div>
          </section>
          <Link className={css.cambiar} href="/elegir">Cambiar de equipo</Link>
          <Link className={css.cambiar} href={rutaSeccion(d, "partidos")}>Todos los partidos</Link>
        </aside>
      </main>
    </>
  );
}

function TarjetaPicante({ p, d }: { p: Picante; d: DivisionalIndice }) {
  const eq = (id: number) => d.equipos.find((e) => e.id === id)!;
  const g = p.partido;
  const sal = g.golesA! > g.golesB! ? 0 : g.golesA === g.golesB ? 1 : 2;
  const sorpresa = sal !== 1 && p.antes && p.antes[sal] < 0.25;
  return (
    <article className={css.hotCard}>
      <Link className={css.hotDiv} href={rutaDivisional(d)}>Serie {d.serie} · Divisional {d.divisional} · fecha {d.ultimaJugada}</Link>
      <div className={css.marcador}>
        <Link className={sal === 0 ? css.gano : ""} href={rutaEquipo(d, eq(g.a).slug)}>{eq(g.a).nombre}</Link>
        <span className={css.score}>{g.golesA} - {g.golesB}</span>
        <Link className={sal === 2 ? css.gano : ""} href={rutaEquipo(d, eq(g.b).slug)}>{eq(g.b).nombre}</Link>
      </div>
      {sorpresa && <span className={css.sorpresa}>SORPRESA · el modelo le daba {pct(p.antes![sal] * 100)}</span>}
      {p.cambios.map((c) => (
        <div className={css.mov} key={c.equipoId + c.objetivo}>
          <Marca m={c.objetivo} />
          <span><b>{eq(c.equipoId).nombre}</b> {METAS[c.objetivo].verbo}</span>
          <span>{pct(c.de * 100)} → <b style={{ color: METAS[c.objetivo].texto }}>{pct(c.a * 100)}</b></span>
        </div>
      ))}
    </article>
  );
}

function MiniTabla({ d, div, yoId }: { d: DatosDivisional; div: DivisionalIndice; yoId: number }) {
  const ix = new Map(d.equipos.map((e, k) => [e.id, k]));
  const cl = d.categoria === "Clausura";
  const col: Meta = cl ? "zonaOro" : d.esPrimera ? "campeon" : "asciende";
  const col2: Meta = cl ? "zonaBronce" : "desciende";
  return (
    <section className={css.card}>
      <div className={css.cardH}><h2>Así está la tabla</h2><Link href={rutaDivisional(d)}>Ver todo</Link></div>
      <div className={css.tablaWrap}>
        <table className={css.tabla}>
          <thead>
            <tr><th /><th>Equipo</th><th>Pts</th><th>{cl ? "Oro" : d.esPrimera ? "Camp." : "▲ Asc."}</th><th>{cl ? "Bronce" : "▼ Desc."}</th></tr>
          </thead>
          <tbody>
            {div.equipos.map((e) => {
              const k = ix.get(e.id)!;
              const clase = e.id === yoId ? css.mio : (e.pos ?? 99) <= 4 ? css.top4 : "";
              return (
                <tr key={e.id} className={clase}>
                  <td>{e.pos}</td>
                  <td>
                    <Link className={css.filaEquipo} href={rutaEquipo(d, e.slug)}>
                      <Escudo nombre={e.nombre} url={e.escudo} tam="sm" />
                      <span>{e.nombre}</span>
                    </Link>
                  </td>
                  <td>{e.pts}</td>
                  <td style={{ color: METAS[col].texto }}>{txtChance(chance(d, col, k))}</td>
                  <td style={{ color: METAS[col2].texto }}>{txtChance(chance(d, col2, k))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={css.nota}>{cl ? `En celeste, los 4 que hoy van a la Copa de Oro${d.esPrimera ? "" : " y ascienden"}. Oro y Bronce: chance de terminar en esa copa${d.esPrimera ? "" : " (Oro = asciende, Bronce = desciende)"}.` : "En celeste, los 4 primeros de hoy."} Tocá un equipo para ver su ficha.</p>
    </section>
  );
}

function Cargando() {
  return (
    <section className={css.hero}>
      <div className={css.heroIn}>
        <p className={css.esqueleto} role="status">Calculando 20.000 simulaciones…</p>
      </div>
    </section>
  );
}

function ErrorDatos() {
  return (
    <main className={css.cuerpo} style={{ marginTop: 16 }}>
      <div className={css.principal}>
        <section className={css.card} role="alert">
          <h2 style={{ margin: 0, fontSize: 17 }}>No pudimos cargar los datos de la Liga</h2>
          <p className={css.nota}>Revisá la conexión y probá de nuevo.</p>
          <button type="button" className={css.cambiar} style={{ width: "100%", marginTop: 12, cursor: "pointer", font: "inherit" }} onClick={() => location.reload()}>Reintentar</button>
        </section>
      </div>
    </main>
  );
}
