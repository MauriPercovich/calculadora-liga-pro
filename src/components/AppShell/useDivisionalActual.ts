"use client";
import { usePathname } from "next/navigation";
import type { DivisionalIndice } from "@/lib/datos";
import { divisionalDeRuta } from "@/lib/datos";
import { useFavorito } from "@/lib/favorito";

/** La divisional de la URL; si la página no es de una divisional, la de tu equipo. */
export function useDivisionalActual(todas: DivisionalIndice[]): DivisionalIndice | null {
  const ruta = usePathname();
  const fav = useFavorito();
  const deRuta = divisionalDeRuta(ruta);
  if (deRuta) return todas.find((d) => d.serie === deRuta.serie && d.divisional === deRuta.divisional) ?? null;
  if (fav) return todas.find((d) => d.torneoId === fav.torneoId) ?? todas.find((d) => d.serie === fav.serie && d.divisional === fav.divisional) ?? null;
  return null;
}
