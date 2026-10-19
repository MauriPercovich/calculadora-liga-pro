import { Banda } from "@/components/Banda";
import { Inicio } from "@/components/Inicio";
import { leerIndice } from "@/lib/datos-servidor";

export default async function Pagina() {
  const indice = await leerIndice();
  return (
    <>
      <Banda actual={null} todas={indice.divisionales} sub={`${indice.torneo} · ${indice.divisionales.length} divisionales`} />
      <main className="wrap">
        <Inicio indice={indice} />
      </main>
    </>
  );
}
