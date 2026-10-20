import type { Metadata } from "next";
import { Elegir } from "@/components/Inicio";
import { leerIndice } from "@/lib/datos-servidor";

export const metadata: Metadata = { title: "¿De qué cuadro sos?" };

export default async function Pagina() {
  const indice = await leerIndice();
  return (
    <main className="wrap">
      <Elegir indice={indice} />
    </main>
  );
}
