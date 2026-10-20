import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Banda } from "@/components/Banda";
import { VistaPartidos } from "@/components/VistaPartidos";
import { buscarDivisional, paramsDivisionales } from "@/lib/datos-servidor";
import { nombreDivisional, subtituloFecha } from "@/lib/datos";

type Params = { serie: string; div: string };

export const generateStaticParams = paramsDivisionales;
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { serie, div } = await params;
  const r = await buscarDivisional(serie, div);
  return r ? { title: `Partidos · ${nombreDivisional(r.datos)}`, description: "Próximos partidos con la chance de cada resultado, y los resultados de cada fecha." } : {};
}

export default async function Pagina({ params }: { params: Promise<Params> }) {
  const { serie, div } = await params;
  const r = await buscarDivisional(serie, div);
  if (!r) notFound();
  const actual = r.indice.divisionales.find((x) => x.torneoId === r.datos.torneoId)!;
  return (
    <>
      <Banda actual={actual} todas={r.indice.divisionales} sub={subtituloFecha(actual)} seccion="partidos" />
      <main className="wrap">
        <VistaPartidos d={r.datos} />
      </main>
    </>
  );
}
