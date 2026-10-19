import type { Metadata } from "next";
import { Suspense } from "react";
import { ConDivisional } from "@/components/ConDivisional";
import { leerIndice } from "@/lib/datos-servidor";

export const metadata: Metadata = { title: "Sancionados", description: "Jugadores suspendidos en cada divisional de Liga Pro." };

export default async function Pagina() {
  const indice = await leerIndice();
  return (
    <Suspense fallback={<main className="wrap"><p className="fine">Cargando…</p></main>}>
      <ConDivisional indice={indice} destino="sancionados" />
    </Suspense>
  );
}
