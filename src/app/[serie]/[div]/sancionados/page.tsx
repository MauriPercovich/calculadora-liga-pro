import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Banda } from "@/components/Banda";
import { VistaSancionados } from "@/components/VistaSancionados";
import { buscarDivisional, paramsDivisionales } from "@/lib/datos-servidor";
import { nombreDivisional, subtituloFecha } from "@/lib/datos";

type Params = { serie: string; div: string };

export const generateStaticParams = paramsDivisionales;
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { serie, div } = await params;
  const r = await buscarDivisional(serie, div);
  return r ? { title: `Sancionados · ${nombreDivisional(r.datos)}`, description: "Jugadores suspendidos para la próxima fecha." } : {};
}

export default async function Pagina({ params }: { params: Promise<Params> }) {
  const { serie, div } = await params;
  const r = await buscarDivisional(serie, div);
  if (!r) notFound();
  const actual = r.indice.divisionales.find((x) => x.torneoId === r.datos.torneoId)!;
  return (
    <>
      <Banda actual={actual} todas={r.indice.divisionales} sub={subtituloFecha(actual)} seccion="sancionados" />
      <main className="wrap">
        <VistaSancionados d={r.datos} />
      </main>
    </>
  );
}
