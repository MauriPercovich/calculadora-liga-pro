"use client";
import { useRouter } from "next/navigation";
import type { DivisionalIndice } from "@/lib/datos";
import { nombreDivisional, rutaDivisional } from "@/lib/datos";

/** Banda blanca del campeonato, como en ligapro.uy, con el selector de serie y divisional. */
export function Banda({ actual, todas, sub, destino = "divisional" }: { actual: DivisionalIndice | null; todas: DivisionalIndice[]; sub?: string; destino?: "divisional" | "partidos" | "simular" | "sancionados" }) {
  const router = useRouter();
  const ir = (id: number) => {
    const d = todas.find((x) => x.torneoId === id);
    if (!d) return;
    router.push(destino === "divisional" ? rutaDivisional(d) : `/${destino}?d=${d.torneoId}`);
  };
  return (
    <section className="band">
      <div className="wrap">
        <div className="trophy" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth="2" />
            <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1>{actual ? nombreDivisional(actual) : "Liga Pro"}</h1>
          {sub && <div className="sub">{sub}</div>}
        </div>
        <div className="sel">
          <select aria-label="Elegir serie y divisional" value={actual?.torneoId ?? ""} onChange={(e) => ir(Number(e.target.value))}>
            {!actual && <option value="">Elegí serie y divisional</option>}
            {todas.map((d) => (
              <option key={d.torneoId} value={d.torneoId}>
                Serie {d.serie} / Divisional {d.divisional}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

export const subtituloFecha = (d: DivisionalIndice) =>
  d.ultimaJugada >= d.totalFechas
    ? `Fase regular terminada (${d.totalFechas} fechas)`
    : `Fecha ${d.ultimaJugada} de ${d.totalFechas} jugada`;
