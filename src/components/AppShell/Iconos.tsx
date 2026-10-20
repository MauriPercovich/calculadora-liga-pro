/** Íconos de trazo 2 px, decorativos (siempre acompañados de texto). */
const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const IcoInicio = () => (
  <svg {...base}><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" /></svg>
);
export const IcoTabla = () => (
  <svg {...base}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
export const IcoPartidos = () => (
  <svg {...base}><circle cx="12" cy="12" r="8.5" /><path d="m12 8 3.2 2.3-1.2 3.7h-4l-1.2-3.7z" /></svg>
);
export const IcoEquipo = () => (
  <svg {...base}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" /></svg>
);
export const IcoSimular = () => (
  <svg {...base}><path d="M5 19V10M12 19V5M19 19v-7" /></svg>
);
export const IcoLuna = () => (
  <svg {...base}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
);
export const IcoSol = () => (
  <svg {...base}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const IcoTrofeo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8" />
  </svg>
);
export const IcoFlecha = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/** Logo: triángulo + "LigaPro" en itálica + chip amarillo. */
export const Logo = ({ grande = false }: { grande?: boolean }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 18 12 4l8 14H4Z" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M9 14h6" stroke="#EAB308" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
    <span style={{ color: "#fff", fontSize: grande ? 22 : 20, fontWeight: 800, fontStyle: "italic", letterSpacing: "-0.5px" }}>LigaPro</span>
    <span style={{ background: "#EAB308", color: "#02224B", fontSize: 10, fontWeight: 800, letterSpacing: 1, padding: "3px 7px", borderRadius: 4 }}>CALCULADORA</span>
  </span>
);
