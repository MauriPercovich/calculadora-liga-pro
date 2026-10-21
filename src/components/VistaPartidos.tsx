"use client";
import type { DatosDivisional } from "@/lib/datos";
import { rutaEquipo } from "@/lib/datos";
import { diaCorto, pct } from "@/lib/formato";
import { EquipoLink, Tri } from "./ui";

export function VistaPartidos({ d }: { d: DatosDivisional }) {
  const ix = new Map(d.equipos.map((e, i) => [e.id, i]));
  const eq = (id: number) => d.equipos[ix.get(id)!];
  const href = (id: number) => rutaEquipo(d, eq(id).slug);
  const reg = d.partidos.filter((p) => p.fase === "regular");
  const fechas = [...new Set(reg.map((p) => p.fecha))].sort((a, b) => a - b);
  const deFecha = (f: number) => reg.filter((p) => p.fecha === f);
  const pendientes = (f: number) => deFecha(f).filter((p) => p.golesA === null).length;
  // La próxima: la primera fecha con la mayoría de sus partidos por jugar (una fecha vieja con un partido
  // postergado no cuenta); si no hay, la primera con algo pendiente.
  const proxima = fechas.find((f) => pendientes(f) * 2 >= deFecha(f).length) ?? fechas.find((f) => pendientes(f) > 0) ?? null;
  const playoffs = d.partidos.filter((p) => p.fase !== "regular");

  const Fila = ({ id }: { id: number }) => {
    const p = d.partidos.find((x) => x.id === id)!;
    if (p.golesA === null || p.golesB === null) {
      const pr = d.proximos[p.id];
      return (
        <div className="match">
          <div className="m-top"><EquipoLink e={eq(p.a)} href={href(p.a)} /><span className="vs">{p.hora ?? "vs"}</span><EquipoLink e={eq(p.b)} href={href(p.b)} /></div>
          {pr && <Tri p={pr} />}
          {pr && <div className="m-meta"><span>Gana {eq(p.a).nombre} {pct(pr[0])}</span><span>Empate {pct(pr[1])}</span><span>Gana {eq(p.b).nombre} {pct(pr[2])}</span></div>}
        </div>
      );
    }
    const pre = d.antes[p.id];
    const sal = p.golesA > p.golesB ? 0 : p.golesA === p.golesB ? 1 : 2;
    return (
      <div className="match">
        <div className="m-top"><EquipoLink e={eq(p.a)} href={href(p.a)} /><span className="score">{p.golesA} - {p.golesB}</span><EquipoLink e={eq(p.b)} href={href(p.b)} /></div>
        {pre && <Tri p={pre} real={sal} />}
      </div>
    );
  };

  const Fecha = ({ titulo, lista, abierta, dia }: { titulo: string; lista: typeof reg; abierta: boolean; dia: string | null }) => (
    <details className="card fecha" open={abierta}>
      <summary>
        <h2>{titulo}</h2>
        <span className="hint">{diaCorto(dia)}</span>
      </summary>
      <div className="card-b">{lista.map((p) => <Fila key={p.id} id={p.id} />)}</div>
    </details>
  );

  return (
    <div className="stack">
      {fechas.map((f) => (
        <Fecha key={f} titulo={`Fecha ${f}`} lista={deFecha(f)} abierta={f === proxima} dia={deFecha(f).find((p) => p.golesA === null)?.dia ?? deFecha(f)[0]?.dia ?? null} />
      ))}
      {playoffs.length > 0 && (
        <Fecha titulo="Copas y finales" lista={playoffs} abierta={proxima === null && playoffs.some((p) => p.golesA === null)} dia={playoffs.find((p) => p.golesA === null)?.dia ?? null} />
      )}
      <p className="fine">Sin localía: el primer equipo nombrado no tiene ventaja. En los partidos jugados, la barra es lo que daba la calculadora antes de esa fecha y en color está lo que pasó.</p>
    </div>
  );
}
