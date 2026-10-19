import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Banda, subtituloFecha } from "@/components/Banda";
import { VistaDivisional } from "@/components/VistaDivisional";
import { buscarDivisional, leerIndice } from "@/lib/datos-servidor";
import { nombreDivisional } from "@/lib/datos";

type Params = { serie: string; div: string };

export async function generateStaticParams(): Promise<Params[]> {
  const i = await leerIndice();
  return i.divisionales.map((d) => ({ serie: `serie-${d.serie}`, div: d.divisional.toLowerCase() }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { serie, div } = await params;
  const r = await buscarDivisional(serie, div);
  if (!r) return {};
  return { title: nombreDivisional(r.datos), description: `Tabla, partidos y chances de cada equipo en ${nombreDivisional(r.datos)}.` };
}

export default async function Pagina({ params }: { params: Promise<Params> }) {
  const { serie, div } = await params;
  const r = await buscarDivisional(serie, div);
  if (!r) notFound();
  const actual = r.indice.divisionales.find((x) => x.torneoId === r.datos.torneoId)!;
  return (
    <>
      <Banda actual={actual} todas={r.indice.divisionales} sub={subtituloFecha(actual)} />
      <main className="wrap">
        <VistaDivisional d={r.datos} />
      </main>
    </>
  );
}
