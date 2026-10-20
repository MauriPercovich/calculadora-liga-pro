import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Banda } from "@/components/Banda";
import { VistaSimular } from "@/components/VistaSimular";
import { buscarDivisional, paramsDivisionales } from "@/lib/datos-servidor";
import { nombreDivisional, subtituloFecha } from "@/lib/datos";

type Params = { serie: string; div: string };

export const generateStaticParams = paramsDivisionales;
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { serie, div } = await params;
  const r = await buscarDivisional(serie, div);
  return r ? { title: `Simular · ${nombreDivisional(r.datos)}`, description: "Armá tu escenario: elegí resultados y mirá cómo cambian las chances de cada equipo." } : {};
}

export default async function Pagina({ params }: { params: Promise<Params> }) {
  const { serie, div } = await params;
  const r = await buscarDivisional(serie, div);
  if (!r) notFound();
  const actual = r.indice.divisionales.find((x) => x.torneoId === r.datos.torneoId)!;
  return (
    <>
      <Banda actual={actual} todas={r.indice.divisionales} sub={subtituloFecha(actual)} seccion="simular" />
      <main className="wrap">
        <VistaSimular d={r.datos} />
      </main>
    </>
  );
}
