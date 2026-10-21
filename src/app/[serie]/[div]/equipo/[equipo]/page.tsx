import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Banda } from "@/components/Banda";
import { Suspense } from "react";
import { Equipo } from "@/components/Equipo/Equipo";
import { subtituloFecha } from "@/lib/datos";
import { buscarDivisional, leerIndice } from "@/lib/datos-servidor";
import { chance, METAS, metaPrincipal, txtChance } from "@/lib/objetivos";

type Params = { serie: string; div: string; equipo: string };

export async function generateStaticParams(): Promise<Params[]> {
  const i = await leerIndice();
  return i.divisionales.flatMap((d) => d.equipos.map((e) => ({ serie: `s${d.serie}`, div: d.divisional.toLowerCase(), equipo: e.slug })));
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
  const o = metaPrincipal(d, i);
  const titulo = `${r.equipo.nombre}: ${txtChance(chance(d, o, i))} de chances de ${METAS[o].largo}`;
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
      <Suspense>
        <Equipo d={r.datos} equipoId={r.equipo.id} />
      </Suspense>
    </>
  );
}

