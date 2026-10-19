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
  const fechas = [...new Set(reg.map((p) => p.fecha))];
  const proximas = fechas.filter((f) => reg.some((p) => p.fecha === f && p.golesA === null)).sort((a, b) => a - b);
  const jugadas = fechas.filter((f) => !proximas.includes(f)).sort((a, b) => b - a);
  const playoffs = d.partidos.filter((p) => p.fase !== "regular");

  const Fila = ({ id }: { id: number }) => {
    const p = d.partidos.find((x) => x.id === id)!;
    if (p.golesA === null) {
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
    const sal = p.golesA > p.golesB! ? 0 : p.golesA === p.golesB ? 1 : 2;
    return (
      <div className="match">
        <div className="m-top"><EquipoLink e={eq(p.a)} href={href(p.a)} /><span className="score">{p.golesA} - {p.golesB}</span><EquipoLink e={eq(p.b)} href={href(p.b)} /></div>
        {pre && (
          <div className="m-meta">
            <span>Antes del partido: {pct(pre[0])} · E {pct(pre[1])} · {pct(pre[2])}</span>
            {pre[sal] < 0.25 && <span className="pill warn">Sorpresa</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="stack">
      {proximas.map((f) => (
        <div className="card" key={`p${f}`}>
          <div className="card-h"><h2>Fecha {f}</h2><span className="hint">{diaCorto(reg.find((p) => p.fecha === f)?.dia ?? null)}</span></div>
          <div className="card-b">{reg.filter((p) => p.fecha === f).map((p) => <Fila key={p.id} id={p.id} />)}</div>
        </div>
      ))}
      {playoffs.length > 0 && (
        <div className="card">
          <div className="card-h"><h2>Copas y finales</h2></div>
          <div className="card-b">{playoffs.map((p) => <Fila key={p.id} id={p.id} />)}</div>
        </div>
      )}
      <h2 className="section-title">Resultados</h2>
      {jugadas.map((f) => (
        <div className="card" key={`j${f}`}>
          <div className="card-h"><h2>Fecha {f}</h2><span className="hint">{diaCorto(reg.find((p) => p.fecha === f)?.dia ?? null)}</span></div>
          <div className="card-b">{reg.filter((p) => p.fecha === f).map((p) => <Fila key={p.id} id={p.id} />)}</div>
        </div>
      ))}
      <p className="fine">Sin localía: el primer equipo nombrado no tiene ventaja. &quot;Antes del partido&quot; usa solo lo que se sabía antes de esa fecha.</p>
    </div>
  );
}
