"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { DivisionalIndice } from "@/lib/datos";
import { divisionalDeRuta, nombreDivisional, rutaDivisional, rutaEquipo, rutaSeccion } from "@/lib/datos";
import { useFavorito } from "@/lib/favorito";
import { useTema } from "@/lib/preferencias";
import { IcoEquipo, IcoFlecha, IcoInicio, IcoLuna, IcoPartidos, IcoSimular, IcoSol, IcoTabla, IcoTrofeo, Logo } from "./Iconos";
import { useDivisionalActual } from "./useDivisionalActual";
import css from "./AppShell.module.css";

type Clave = "inicio" | "tabla" | "partidos" | "equipo" | "simular" | "sancionados" | null;

function useNavegacion(todas: DivisionalIndice[]) {
  const ruta = usePathname();
  const fav = useFavorito();
  const actual = useDivisionalActual(todas);
  const miEquipo = fav ? rutaEquipo(fav, fav.slug) : "/elegir";
  const enDivisional = divisionalDeRuta(ruta);

  let activa: Clave = null;
  if (ruta === "/") activa = "inicio";
  else if (ruta === miEquipo) activa = "equipo";
  else if (enDivisional && ruta.endsWith("/partidos")) activa = "partidos";
  else if (enDivisional && ruta.endsWith("/simular")) activa = "simular";
  else if (enDivisional && ruta.endsWith("/sancionados")) activa = "sancionados";
  else if (enDivisional || ruta === "/divisionales") activa = "tabla";

  const destino = (s?: "partidos" | "simular" | "sancionados") => (actual ? (s ? rutaSeccion(actual, s) : rutaDivisional(actual)) : "/elegir");
  return {
    ruta,
    actual,
    activa,
    links: {
      inicio: "/",
      tabla: destino(),
      partidos: destino("partidos"),
      equipo: miEquipo,
      simular: destino("simular"),
      sancionados: destino("sancionados"),
    },
  };
}

export function TopBar({ todas }: { todas: DivisionalIndice[] }) {
  const router = useRouter();
  const [tema, alternar] = useTema();
  const { ruta, actual, activa, links } = useNavegacion(todas);

  // Cambiar de divisional mantiene la sección (tabla, partidos, simular o sancionados).
  const cambiar = (id: number) => {
    const d = todas.find((x) => x.torneoId === id);
    if (!d) return;
    const seccion = ruta.match(/\/(partidos|simular|sancionados)$/)?.[1] as "partidos" | "simular" | "sancionados" | undefined;
    router.push(seccion ? rutaSeccion(d, seccion) : rutaDivisional(d));
  };

  const items: [Exclude<Clave, null>, string][] = [
    ["inicio", "Inicio"],
    ["tabla", "Tabla y chances"],
    ["partidos", "Partidos"],
    ["equipo", "Mi equipo"],
    ["simular", "Simular"],
    ["sancionados", "Sancionados"],
  ];

  return (
    <header className={css.top}>
      <div className={css.topIn}>
        <div className={css.row}>
          <Link className={css.brand} href="/" aria-label="Calculadora Liga Pro, inicio">
            <Logo />
          </Link>
          <nav className={css.links} aria-label="Principal">
            {items.map(([k, txt]) => (
              <Link key={k} href={links[k]} aria-current={activa === k ? "page" : undefined}>
                {txt}
              </Link>
            ))}
          </nav>
          <button type="button" className={css.moon} onClick={alternar} aria-label={tema === "dark" ? "Pasar a modo claro" : "Pasar a modo oscuro"}>
            {tema === "dark" ? <IcoSol /> : <IcoLuna />}
          </button>
        </div>
        {ruta !== "/elegir" && (
          <div className={css.selWrap}>
            <select className={css.selNative} aria-label="Elegí serie y divisional" value={actual?.torneoId ?? ""} onChange={(e) => cambiar(Number(e.target.value))}>
              {!actual && <option value="">Elegí serie y divisional</option>}
              {todas.map((d) => (
                <option key={d.torneoId} value={d.torneoId}>
                  Serie {d.serie} · Divisional {d.divisional}
                </option>
              ))}
            </select>
            <div className={css.selBtn} aria-hidden>
              <span className={css.trofeo}><IcoTrofeo /></span>
              <span className={css.selTxt}>{actual ? nombreDivisional(actual) : "Elegí serie y divisional"}</span>
              <IcoFlecha />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function BottomNav({ todas }: { todas: DivisionalIndice[] }) {
  const { ruta, activa, links } = useNavegacion(todas);
  if (ruta === "/elegir") return null;
  const marcada = activa === "sancionados" ? "partidos" : activa;
  const items: [Exclude<Clave, null | "sancionados">, string, React.ReactNode][] = [
    ["inicio", "Inicio", <IcoInicio key="i" />],
    ["tabla", "Tabla", <IcoTabla key="t" />],
    ["partidos", "Partidos", <IcoPartidos key="p" />],
    ["equipo", "Mi equipo", <IcoEquipo key="e" />],
    ["simular", "Simular", <IcoSimular key="s" />],
  ];
  return (
    <>
      <div className={css.spacer} aria-hidden />
      <nav className={css.bottom} aria-label="Principal">
        {items.map(([k, txt, ico]) => (
          <Link key={k} href={links[k]} aria-current={marcada === k ? "page" : undefined}>
            {ico}
            {txt}
          </Link>
        ))}
      </nav>
    </>
  );
}

export function Pie() {
  return (
    <footer className={css.foot}>
      <span>Calculadora Liga Pro · datos públicos de ligapro.uy.</span>
      <span>Son estimaciones: el resto del torneo se simula partido a partido, no son cuotas.</span>
      <Link href="/como-se-calcula">Cómo se calcula</Link>
      <Link href="/divisionales">Todas las divisionales</Link>
    </footer>
  );
}
