import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Banda } from "@/components/Banda";
import { VistaEquipo } from "@/components/VistaEquipo";
import { subtituloFecha } from "@/lib/datos";
import { buscarDivisional, leerIndice } from "@/lib/datos-servidor";
import { objetivoPrincipal, objetivosDe, OBJETIVOS, pct } from "@/lib/formato";

type Params = { serie: string; div: string; equipo: string };

export async function generateStaticParams(): Promise<Params[]> {
  const i = await leerIndice();
  return i.divisionales.flatMap((d) => d.equipos.map((e) => ({ serie: `serie-${d.serie}`, div: d.divisional.toLowerCase(), equipo: e.slug })));
}
export const dynamicParams = false;

async function cargar(p: Params) {
  const r = await buscarDivisional(p.serie, p.div);
  if (!r) return null;
  const e = r.datos.equipos.find((x) => x.slug === p.equipo);
  return e ? { ...r, equipo: e } : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const r = await cargar(await params);
  if (!r) return {};
  const d = r.datos;
  const i = d.equipos.indexOf(r.equipo);
  const P = d.simulacion.prob as unknown as Record<string, number[]>;
  const o = objetivoPrincipal(P, i, objetivosDe(d.categoria, d.esPrimera));
  const titulo = `${r.equipo.nombre}: ${pct(P[o][i])} de chances de ${OBJETIVOS[o].largo}`;
  return {
    title: titulo,
    description: `Serie ${d.serie} · Divisional ${d.divisional} · ${d.categoria} ${d.anio}. Qué pasa si gana, empata o pierde, y con cuántos puntos le alcanza.`,
    openGraph: { title: titulo },
  };
}

export default async function Pagina({ params }: { params: Promise<Params> }) {
  const r = await cargar(await params);
  if (!r) notFound();
  const actual = r.indice.divisionales.find((x) => x.torneoId === r.datos.torneoId)!;
  return (
    <>
      <Banda actual={actual} todas={r.indice.divisionales} sub={subtituloFecha(actual)} />
      <main className="wrap">
        <VistaEquipo d={r.datos} equipoId={r.equipo.id} />
      </main>
    </>
  );
}

