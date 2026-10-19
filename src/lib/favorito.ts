"use client";
import { useEffect, useState } from "react";

export interface Favorito {
  torneoId: number;
  equipoId: number;
  slug: string;
  nombre: string;
  serie: string;
  divisional: string;
}

const CLAVE = "clp-favorito";
const EVENTO = "clp-favorito-cambio";

export function leerFavorito(): Favorito | null {
  try {
    const v = localStorage.getItem(CLAVE);
    return v ? (JSON.parse(v) as Favorito) : null;
  } catch {
    return null;
  }
}

export function guardarFavorito(f: Favorito | null) {
  try {
    if (f) localStorage.setItem(CLAVE, JSON.stringify(f));
    else localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento: el favorito dura lo que dure la pestaña */
  }
  window.dispatchEvent(new Event(EVENTO));
}

/** Equipo favorito guardado en este dispositivo (sin cuenta). `undefined` mientras carga. */
export function useFavorito(): Favorito | null | undefined {
  const [fav, setFav] = useState<Favorito | null | undefined>(undefined);
  useEffect(() => {
    const leer = () => setFav(leerFavorito());
    leer();
    window.addEventListener(EVENTO, leer);
    window.addEventListener("storage", leer);
    return () => {
      window.removeEventListener(EVENTO, leer);
      window.removeEventListener("storage", leer);
    };
  }, []);
  return fav;
}
