"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DatosDivisional, DivisionalIndice, Indice } from "@/lib/datos";
import { rutaDivisional, rutaEquipo } from "@/lib/datos";
import { diaCorto, objetivoPrincipal, objetivosDe, OBJETIVOS, pct } from "@/lib/formato";
import { guardarFavorito, useFavorito, type Favorito } from "@/lib/favorito";
import { Escudo } from "./Escudo";
import { Chips, EquipoLink, ordenarTabla, Tri, zona } from "./ui";

export function Inicio({ indice }: { indice: Indice }) {
  const fav = useFavorito();
  const router = useRouter();
  const [datos, setDatos] = useState<DatosDivisional | null>(null);
  const [error, setError] = useState(false);

  // El favorito puede ser de un torneo anterior: lo buscamos por nombre en el torneo actual.
  const favActual = useMemo<Favorito | null>(() => {
    if (!fav) return null;
    const d = indice.divisionales.find((x) => x.torneoId === fav.torneoId);
    if (d) return fav;
    for (const x of indice.divisionales) {
      const e = x.equipos.find((q) => q.slug === fav.slug || q.nombre === fav.nombre);
      if (e) return { torneoId: x.torneoId, equipoId: e.id, slug: e.slug, nombre: e.nombre, serie: x.serie, divisional: x.divisional };
    }
    return null;
  }, [fav, indice]);

  // Sin equipo elegido, la portada es "¿De qué cuadro sos?".
  useEffect(() => {
    if (fav !== undefined && !favActual) router.replace("/elegir");
  }, [fav, favActual, router]);

  useEffect(() => {
    if (!favActual) return;
    if (fav && favActual.torneoId !== fav.torneoId) guardarFavorito(favActual);
    setDatos(null);
    fetch(`/data/divisionales/${favActual.torneoId}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDatos)
      .catch(() => setError(true));
  }, [favActual, fav]);

  if (fav === undefined) return <div className="card"><div className="card-b" style={{ paddingTop: 16 }}><p className="fine">Cargando…</p></div></div>;
  if (!favActual) return <div className="card"><div className="card-b" style={{ paddingTop: 16 }}><p className="fine">Cargando…</p></div></div>;

  const div = indice.divisionales.find((x) => x.torneoId === favActual.torneoId)!;
  const otras = indice.divisionales.filter((x) => x.torneoId !== div.torneoId);
  const mismaSerie = otras.filter((x) => x.serie === div.serie);
  const resto = otras.filter((x) => x.serie !== div.serie);
  const picantes = [
    ...div.picantes.map((p) => ({ p, d: div })),
    ...[...mismaSerie, ...resto].flatMap((d) => d.picantes.slice(0, 1).map((p) => ({ p, d }))).sort((a, b) => b.p.max - a.p.max),
  ].slice(0, 6);

  return (
    <div className="grid">
      <div className="stack">
        {datos ? <TarjetaEquipo d={datos} equipoId={favActual.equipoId} /> : <div className="card"><div className="card-b" style={{ paddingTop: 16 }}><p className="fine">{error ? "No pudimos cargar los datos de tu equipo. Probá de nuevo en un rato." : "Cargando tu equipo…"}</p></div></div>}
        <h2 className="section-title">Lo más picante de la última fecha</h2>
        <div className="hot">
          {picantes.map(({ p, d }) => (
            <TarjetaPicante key={p.partido.id} p={p} d={d} />
          ))}
        </div>
      </div>
      <div className="stack">
        {datos && <MiniTabla d={datos} equipoId={favActual.equipoId} />}
        <div className="card">
          <div className="card-h"><h2>Otras divisionales</h2></div>
          <div className="card-b" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {indice.divisionales.map((x) => (
              <Link key={x.torneoId} className="pill" href={rutaDivisional(x)} style={{ textDecoration: "none", padding: "6px 10px" }}>
                Serie {x.serie} · {x.divisional}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TarjetaEquipo({ d, equipoId }: { d: DatosDivisional; equipoId: number }) {
  const i = d.equipos.findIndex((e) => e.id === equipoId);
  const yo = d.equipos[i];
  const P = d.simulacion.prob as unknown as Record<string, number[]>;
  const posibles = objetivosDe(d.categoria, d.esPrimera);
  const o = objetivoPrincipal(P, i, posibles);
  const tabla = ordenarTabla(d.tablaOficial);
  const pos = tabla.findIndex((f) => f.equipoId === equipoId);
  const prox = d.partidos.find((p) => p.fase === "regular" && p.golesA === null && (p.a === equipoId || p.b === equipoId));
  const rival = prox ? d.equipos.find((e) => e.id === (prox.a === equipoId ? prox.b : prox.a))! : null;
  const pr = prox ? d.proximos[prox.id] : null;
  const mio: [number, number, number] | null = prox && pr ? (prox.a === equipoId ? pr : [pr[2], pr[1], pr[0]]) : null;
  return (
    <div className="card">
      <div className="hero">
        <Escudo nombre={yo.nombre} url={yo.escudo} tam="lg" />
        <div>
          <div className="eyebrow">Tu equipo</div>
          <h2>{yo.nombre}</h2>
          <div className="meta">{pos + 1}º con {tabla[pos].pts} pts · Serie {d.serie} · Divisional {d.divisional}</div>
        </div>
        <div className="big" style={{ color: OBJETIVOS[o].color }}>
          {pct(P[o][i])}
          <small>chances de {OBJETIVOS[o].largo}</small>
        </div>
      </div>
      <div className="card-b"><Chips prob={P} i={i} posibles={posibles} activo={o} /></div>
      <div className="card-b" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
        {prox && rival && mio ? (
          <>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Próximo partido · fecha {prox.fecha} · {diaCorto(prox.dia)}{prox.hora ? ` · ${prox.hora}` : ""}</div>
            <div className="m-top">
              <EquipoLink e={yo} href={rutaEquipo(d, yo.slug)} />
              <span className="vs">vs</span>
              <EquipoLink e={rival} href={rutaEquipo(d, rival.slug)} />
            </div>
            <div style={{ marginTop: 8 }}><Tri p={mio} /></div>
            <div className="m-meta" style={{ marginTop: 6 }}><span>Gana {yo.nombre}</span><span>Empate</span><span>Gana {rival.nombre}</span></div>
          </>
        ) : (
          <p className="fine" style={{ margin: 0 }}>Terminó la fase regular.</p>
        )}
        <div className="btns" style={{ marginTop: 12 }}>
          <Link className="btn" href={rutaEquipo(d, yo.slug)}>Ver todo de {yo.nombre}</Link>
          <Link className="btn ghost" href="/elegir">Cambiar de equipo</Link>
        </div>
      </div>
    </div>
  );
}

function TarjetaPicante({ p, d }: { p: DivisionalIndice["picantes"][number]; d: DivisionalIndice }) {
  const eq = (id: number) => d.equipos.find((e) => e.id === id)!;
  const g = p.partido;
  const sal = g.golesA! > g.golesB! ? 0 : g.golesA === g.golesB ? 1 : 2;
  const sorpresa = p.antes && p.antes[sal] < 0.25;
  return (
    <div className="card">
      <Link className="eyebrow" href={rutaDivisional(d)} style={{ textDecoration: "none" }}>Serie {d.serie} · Divisional {d.divisional}</Link>
      <div className="m-top">
        <EquipoLink e={eq(g.a)} href={rutaEquipo(d, eq(g.a).slug)} />
        <span className="score">{g.golesA} - {g.golesB}</span>
        <EquipoLink e={eq(g.b)} href={rutaEquipo(d, eq(g.b).slug)} />
      </div>
      {sorpresa && <span className="pill warn" style={{ alignSelf: "flex-start" }}>Sorpresa · el modelo le daba {pct(p.antes![sal])}</span>}
      {p.cambios.map((c) => (
        <div className="swing" key={c.equipoId + c.objetivo}>
          <span><b>{eq(c.equipoId).nombre}</b> {OBJETIVOS[c.objetivo].largo}</span>
          <span className="num"><span style={{ color: "var(--muted)" }}>{pct(c.de)} →</span> <b style={{ color: OBJETIVOS[c.objetivo].color }}>{pct(c.a)}</b></span>
        </div>
      ))}
    </div>
  );
}

function MiniTabla({ d, equipoId }: { d: DatosDivisional; equipoId: number }) {
  const P = d.simulacion.prob;
  const ix = new Map(d.equipos.map((e, k) => [e.id, k]));
  const tabla = ordenarTabla(d.tablaOficial);
  const N = d.equipos.length;
  return (
    <div className="card">
      <div className="card-h"><h2>Posiciones</h2><Link className="hint" href={rutaDivisional(d)}>Ver todo</Link></div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th /><th className="l">Equipo</th><th className="pts">Pts</th><th>{d.esPrimera ? "Camp." : "Asc."}</th><th>Desc.</th></tr></thead>
          <tbody>
            {tabla.map((f, k) => {
              const e = d.equipos[ix.get(f.equipoId)!];
              return (
                <tr key={f.equipoId} className={`${zona(k, N, d.categoria, d.reglamento.ascensos, d.reglamento.descensos)} ${f.equipoId === equipoId ? "fav" : ""}`}>
                  <td className="pos">{k + 1}</td>
                  <td className="l team-cell"><EquipoLink e={e} href={rutaEquipo(d, e.slug)} /></td>
                  <td className="pts num">{f.pts}</td>
                  <td className="num">{pct(d.esPrimera ? P.campeon[ix.get(f.equipoId)!] : P.asciende[ix.get(f.equipoId)!])}</td>
                  <td className="num">{pct(P.desciende[ix.get(f.equipoId)!])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Elegir({ indice }: { indice: Indice }) {
  const router = useRouter();
  const fav = useFavorito();
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const grupos = indice.divisionales
    .map((d) => ({ d, equipos: d.equipos.filter((e) => !s || norm(e.nombre).includes(s)) }))
    .filter((g) => g.equipos.length);
  return (
    <div className="stack">
      <div className="welcome">
        <h2>¿De qué cuadro sos?</h2>
        <p>Elegilo una vez y la calculadora arranca siempre por tu equipo: sus chances, su próximo partido y su tabla.</p>
        {fav && <Link href="/" style={{ color: "var(--nav-active)", fontWeight: 700 }}>Cancelar</Link>}
      </div>
      <div className="card">
        <div className="card-b" style={{ paddingTop: 16 }}>
          <label htmlFor="buscar" className="eyebrow">Buscar equipo</label>
          <input id="buscar" className="search" type="search" placeholder="Escribí el nombre de tu equipo" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} style={{ margin: "8px 0 14px" }} />
          {grupos.length === 0 && <p className="fine">No encontramos equipos con ese nombre en el {indice.torneo}.</p>}
          {grupos.map(({ d, equipos }) => (
            <div key={d.torneoId} style={{ marginBottom: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Serie {d.serie} · Divisional {d.divisional}</div>
              <div className="pick">
                {equipos.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      guardarFavorito({ torneoId: d.torneoId, equipoId: e.id, slug: e.slug, nombre: e.nombre, serie: d.serie, divisional: d.divisional });
                      router.push("/");
                    }}
                  >
                    <Escudo nombre={e.nombre} url={e.escudo} />
                    <span className="nm" style={{ fontWeight: 700 }}>{e.nombre}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
