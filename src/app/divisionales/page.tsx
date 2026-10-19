import type { Metadata } from "next";
import Link from "next/link";
import { leerIndice } from "@/lib/datos-servidor";
import { rutaDivisional } from "@/lib/datos";

export const metadata: Metadata = { title: "Divisionales" };

export default async function Pagina() {
  const indice = await leerIndice();
  const series = [...new Set(indice.divisionales.map((d) => d.serie))];
  return (
    <main className="wrap">
      <div className="stack">
        <h2 className="section-title">{indice.torneo}</h2>
        {series.map((s) => (
          <div className="card" key={s}>
            <div className="card-h"><h2>Serie {s}</h2></div>
            <div className="card-b" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {indice.divisionales
                .filter((d) => d.serie === s)
                .map((d) => (
                  <Link key={d.torneoId} className="btn ghost" href={rutaDivisional(d)}>
                    Divisional {d.divisional} · fecha {d.ultimaJugada}/{d.totalFechas}
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
