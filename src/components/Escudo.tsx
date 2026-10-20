"use client";
import { useEffect, useRef, useState } from "react";

const iniciales = (nombre: string) =>
  nombre
    .replace(/\b(f\.?c\.?|fútbol club|futbol club|club)\b/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

function tono(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/** Escudo oficial de la Liga; si no carga, las iniciales sobre un color fijo por equipo. */
export function Escudo({ nombre, url, tam = "" }: { nombre: string; url: string | null; tam?: "" | "sm" | "lg" }) {
  const [roto, setRoto] = useState(!url);
  const img = useRef<HTMLImageElement>(null);
  // Si la imagen falló antes de que React se conectara, onError ya no llega: lo miramos al montar.
  useEffect(() => {
    const i = img.current;
    if (i && i.complete && i.naturalWidth === 0) setRoto(true);
  }, []);
  return (
    <span className={`crest ${tam}`} style={roto ? { background: `hsl(${tono(nombre)} 55% 38%)` } : undefined} aria-hidden="true">
      {roto ? (
        iniciales(nombre)
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={img} src={url!} alt="" loading="lazy" onError={() => setRoto(true)} />
      )}
    </span>
  );
}
