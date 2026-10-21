"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DivisionalIndice, EquipoIndice, Indice } from "@/lib/datos";
import { guardarFavorito, useFavorito } from "@/lib/favorito";
import { Escudo } from "../Escudo";
import { IcoFlecha } from "../AppShell/Iconos";
import css from "./Elegir.module.css";

const normal = (x: string) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/** "¿De qué cuadro sos?": un toque elige y guarda, sin botón de confirmar. */
export function Elegir({ indice }: { indice: Indice }) {
  const router = useRouter();
  const fav = useFavorito();
  const [q, setQ] = useState("");
  const todas = indice.divisionales;
  // La serie de tu equipo primero; después en orden.
  const series = useMemo(() => {
    const s = [...new Set(todas.map((d) => d.serie))];
    return fav ? [...s.filter((x) => x === fav.serie), ...s.filter((x) => x !== fav.serie)] : s;
  }, [todas, fav]);
  const inicial = todas.find((d) => d.torneoId === fav?.torneoId)?.torneoId ?? todas[0]?.torneoId;
  const [abierta, setAbierta] = useState<number | undefined>(undefined);
  const abiertaId = abierta ?? inicial;

  const elegir = (d: DivisionalIndice, e: EquipoIndice) => {
    guardarFavorito({ torneoId: d.torneoId, equipoId: e.id, slug: e.slug, nombre: e.nombre, serie: d.serie, divisional: d.divisional });
    router.push("/");
  };
  const esTuyo = (d: DivisionalIndice, e: EquipoIndice) => fav?.torneoId === d.torneoId && fav.equipoId === e.id;

  const busqueda = normal(q);
  const encontrados = busqueda
    ? todas.flatMap((d) => d.equipos.filter((e) => normal(e.nombre).includes(busqueda)).map((e) => ({ d, e }))).slice(0, 40)
    : [];

  const Fila = ({ d, e, conDonde = false }: { d: DivisionalIndice; e: EquipoIndice; conDonde?: boolean }) => (
    <button type="button" className={`${css.equipo} ${esTuyo(d, e) ? css.esTuyo : ""}`} onClick={() => elegir(d, e)}>
      <Escudo nombre={e.nombre} url={e.escudo} />
      <span className={css.nombre}>
        {e.nombre}
        {conDonde && <span className={css.donde}>Serie {d.serie} · Divisional {d.divisional}{e.pos ? ` · ${e.pos}º` : ""}</span>}
      </span>
      {!conDonde && e.pos && <span className={css.pos}>{e.pos}º</span>}
    </button>
  );

  const divElegida = todas.find((d) => d.torneoId === abiertaId);

  return (
    <>
      <section className={css.hero}>
        <div className={css.heroIn}>
          <h1>¿De qué cuadro sos?</h1>
          <p>Elegilo una vez y la calculadora arranca siempre por tu equipo: sus chances, su próximo partido y su tabla.</p>
          {fav && (
            <Link className={css.cancelar} href="/">
              Cancelar
            </Link>
          )}
          <div className={css.buscar}>
            <span className={css.lupa} aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </span>
            <input id="buscar-equipo" type="search" placeholder="Buscá por nombre, ej. Poquitos" autoComplete="off" aria-label="Buscá tu equipo por nombre" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && (
              <button type="button" className={css.limpiar} aria-label="Borrar búsqueda" onClick={() => setQ("")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            )}
          </div>
        </div>
      </section>

      <main className={css.cuerpo}>
        <div className={css.principal}>
          {busqueda ? (
            encontrados.length ? (
              <ul className={css.resultados}>
                {encontrados.map(({ d, e }) => (
                  <li key={`${d.torneoId}-${e.id}`}><Fila d={d} e={e} conDonde /></li>
                ))}
              </ul>
            ) : (
              <p className={css.vacio}>No encontramos ese cuadro. Probá con otra parte del nombre.</p>
            )
          ) : (
            <>
              {/* celular y tableta: series → divisionales en acordeón */}
              <div className={css.acordeon}>
                {series.map((s) => (
                  <div key={s} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                    <div className={css.serie}>Serie {s}</div>
                    {todas.filter((d) => d.serie === s).map((d) => {
                      const abre = d.torneoId === abiertaId;
                      return (
                        <div key={d.torneoId} className={`${css.div} ${abre ? css.abierta : ""}`}>
                          <button type="button" className={css.divBtn} aria-expanded={abre} onClick={() => setAbierta(abre ? -1 : d.torneoId)}>
                            Divisional {d.divisional}
                            <span className={css.cuantos}>{d.equipos.length} equipos</span>
                            <span className={css.flecha}><IcoFlecha /></span>
                          </button>
                          {abre && (
                            <ul className={css.equipos}>
                              {d.equipos.map((e) => <li key={e.id}><Fila d={d} e={e} /></li>)}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              {/* escritorio: la divisional elegida en dos columnas */}
              {divElegida && (
                <div className={css.tarjetaDiv}>
                  <div className={css.tarjetaDivH}>
                    <h2>Serie {divElegida.serie} · Divisional {divElegida.divisional}</h2>
                    <span>{divElegida.equipos.length} equipos · {divElegida.categoria} {divElegida.anio}</span>
                  </div>
                  <ul className={css.grilla}>
                    {divElegida.equipos.map((e) => <li key={e.id}><Fila d={divElegida} e={e} /></li>)}
                  </ul>
                </div>
              )}
            </>
          )}
          <p className={css.nota}>Lo guardamos en este dispositivo. Lo cambiás cuando quieras desde Mi equipo.</p>
        </div>

        <aside className={css.lateral} aria-label="Otras series y divisionales">
          <div className={css.serie}>Otras series y divisionales</div>
          {series.map((s) => (
            <div key={s} className={css.chipsSerie}>
              <h3>Serie {s}</h3>
              <div className={css.chips}>
                {todas.filter((d) => d.serie === s).map((d) => (
                  <button key={d.torneoId} type="button" className={css.chip} aria-pressed={d.torneoId === abiertaId} onClick={() => { setQ(""); setAbierta(d.torneoId); }}>
                    Divisional {d.divisional}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>
      </main>
    </>
  );
}
