"use client";
import type { DatosDivisional } from "@/lib/datos";
import { rutaEquipo } from "@/lib/datos";
import { useFavorito } from "@/lib/favorito";
import { EquipoLink } from "./ui";

export function VistaSancionados({ d }: { d: DatosDivisional }) {
  const fav = useFavorito();
  const mio = (id: number) => fav?.torneoId === d.torneoId && fav.equipoId === id;
  const lista = d.sanciones.filter((s) => s.pendientes > 0).sort((a, b) => Number(mio(b.equipoId)) - Number(mio(a.equipoId)) || b.pendientes - a.pendientes);
  const eq = (id: number) => d.equipos.find((e) => e.id === id)!;
  return (
    <div className="card">
      <div className="card-h"><h2>Sancionados</h2><span className="hint">{lista.length} {lista.length === 1 ? "jugador" : "jugadores"}</span></div>
      {lista.length ? (
        <div className="tbl-wrap">
          <table>
            <thead><tr><th className="l">Jugador</th><th>Duración</th><th>Pendiente</th></tr></thead>
            <tbody>
              {lista.map((s) => (
                <tr key={s.jugador + s.tipo} className={mio(s.equipoId) ? "fav" : ""}>
                  <td className="l team-cell sanc-jug">
                    <b>{s.jugador}</b>
                    <EquipoLink e={eq(s.equipoId)} href={rutaEquipo(d, eq(s.equipoId).slug)} />
                  </td>
                  <td className="num">{s.fechas}</td>
                  <td className="num"><b>{s.pendientes}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-b"><p className="fine">No hay jugadores suspendidos en esta divisional.</p></div>
      )}
      <p className="fine" style={{ padding: "8px 16px 14px", margin: 0 }}>Datos de la pestaña Sancionados de la Liga. Tu equipo aparece primero.</p>
    </div>
  );
}
