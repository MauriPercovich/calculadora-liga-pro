"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { DatosDivisional, Indice } from "@/lib/datos";
import { useFavorito } from "@/lib/favorito";
import { Banda } from "./Banda";
import { subtituloFecha } from "@/lib/datos";
import { VistaPartidos } from "./VistaPartidos";
import { VistaSancionados } from "./VistaSancionados";
import { VistaSimular } from "./VistaSimular";

const VISTAS = { partidos: VistaPartidos, simular: VistaSimular, sancionados: VistaSancionados };

/**
 * Elige la divisional de `?d=` (o la de tu equipo, o la primera), carga su JSON
 * y se la pasa a la vista.
 */
export function ConDivisional({ indice, destino }: { indice: Indice; destino: keyof typeof VISTAS }) {
  const Vista = VISTAS[destino];
  const params = useSearchParams();
  const fav = useFavorito();
  const [datos, setDatos] = useState<DatosDivisional | null>(null);
  const pedido = Number(params.get("d"));
  const id =
    indice.divisionales.find((x) => x.torneoId === pedido)?.torneoId ??
    (fav ? indice.divisionales.find((x) => x.torneoId === fav.torneoId)?.torneoId : undefined) ??
    (fav === undefined ? undefined : indice.divisionales[0]?.torneoId);
  const actual = indice.divisionales.find((x) => x.torneoId === id) ?? null;

  useEffect(() => {
    if (id === undefined) return;
    let vivo = true;
    fetch(`/data/divisionales/${id}.json`)
      .then((r) => r.json())
      .then((j) => vivo && setDatos(j));
    return () => {
      vivo = false;
    };
  }, [id]);

  return (
    <>
      <Banda actual={actual} todas={indice.divisionales} sub={actual ? subtituloFecha(actual) : undefined} destino={destino} />
      <main className="wrap">{datos && datos.torneoId === id ? <Vista d={datos} /> : <p className="fine">Cargando…</p>}</main>
    </>
  );
}
