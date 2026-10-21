"use client";
import { useEffect, useState } from "react";

export type Tema = "light" | "dark";
const CLAVE_TEMA = "clp-tema";

/** Script que corre antes de pintar: aplica el tema guardado para que no parpadee. */
export const SCRIPT_TEMA = `try{var t=localStorage.getItem("${CLAVE_TEMA}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

function temaActual(): Tema {
  const d = document.documentElement.dataset.theme;
  if (d === "light" || d === "dark") return d;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Tema elegido (o el del sistema) y una función para alternarlo; se guarda en el dispositivo. */
export function useTema(): [Tema | null, () => void] {
  const [tema, setTema] = useState<Tema | null>(null);
  useEffect(() => setTema(temaActual()), []);
  const alternar = () => {
    const nuevo: Tema = temaActual() === "dark" ? "light" : "dark";
    const aplicar = () => {
      document.documentElement.dataset.theme = nuevo;
      try {
        localStorage.setItem(CLAVE_TEMA, nuevo);
      } catch {
        /* sin almacenamiento: dura lo que dure la pestaña */
      }
      setTema(nuevo);
    };
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (sinMovimiento) return aplicar();
    if (doc.startViewTransition) {
      // fundido de toda la página de un tema al otro
      doc.startViewTransition(aplicar);
      return;
    }
    // navegadores sin View Transitions: los colores cambian con una transición suave
    const raiz = document.documentElement;
    raiz.classList.add("cambiando-tema");
    aplicar();
    window.setTimeout(() => raiz.classList.remove("cambiando-tema"), 450);
  };
  return [tema, alternar];
}
