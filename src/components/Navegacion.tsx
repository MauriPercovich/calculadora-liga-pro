"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorito } from "@/lib/favorito";
import { rutaDivisional, rutaEquipo } from "@/lib/datos";

const Icono = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Encabezado() {
  const ruta = usePathname();
  const fav = useFavorito();
  const tabla = fav ? rutaDivisional(fav) : "/divisionales";
  const items = [
    { href: "/", txt: "Inicio", on: ruta === "/" },
    { href: tabla, txt: "Tabla y chances", on: ruta.startsWith("/serie-") || ruta === "/divisionales" },
    { href: "/partidos", txt: "Partidos", on: ruta.startsWith("/partidos") },
    { href: "/simular", txt: "Simular", on: ruta.startsWith("/simular") },
    { href: "/sancionados", txt: "Sancionados", on: ruta.startsWith("/sancionados") },
    { href: "/como-se-calcula", txt: "Cómo se calcula", on: ruta.startsWith("/como-se-calcula") },
  ];
  return (
    <header className="top">
      <div className="wrap">
        <Link className="brand" href="/" aria-label="Calculadora Liga Pro, inicio">
          <span className="mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 18 12 4l8 14H4Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
              <path d="M9 14h6" stroke="#EAB308" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            LigaPro
          </span>
          <span className="tag">Calculadora</span>
        </Link>
        <nav className="nav" aria-label="Secciones">
          {items.map((i) => (
            <Link key={i.txt} href={i.href} className={i.on ? "on" : ""}>
              {i.txt}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function BarraInferior() {
  const ruta = usePathname();
  const fav = useFavorito();
  const miEquipo = fav ? rutaEquipo(fav, fav.slug) : "/";
  const items = [
    { href: "/", txt: "Inicio", on: ruta === "/", d: "M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z" },
    { href: fav ? rutaDivisional(fav) : "/divisionales", txt: "Tabla", on: ruta.startsWith("/serie-") && !(fav && ruta === miEquipo), d: "M4 6h16M4 12h16M4 18h16" },
    { href: "/partidos", txt: "Partidos", on: ruta.startsWith("/partidos"), d: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4 3 2-1 4h-4l-1-4 3-2Z" },
    { href: miEquipo, txt: "Mi equipo", on: !!fav && ruta === miEquipo, d: "M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" },
    { href: "/simular", txt: "Simular", on: ruta.startsWith("/simular"), d: "M5 19V9M12 19V5M19 19v-7" },
  ];
  return (
    <nav className="bottom" aria-label="Secciones">
      {items.map((i) => (
        <Link key={i.txt} href={i.href} className={i.on ? "on" : ""}>
          <Icono d={i.d} />
          {i.txt}
        </Link>
      ))}
    </nav>
  );
}
