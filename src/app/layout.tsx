import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BarraInferior, Encabezado } from "@/components/Navegacion";

export const metadata: Metadata = {
  title: { default: "Calculadora Liga Pro", template: "%s · Calculadora Liga Pro" },
  description: "Chances de salir campeón, ascender, ganar las copas de Oro, Plata y Bronce o descender en cada divisional de Liga Pro.",
  applicationName: "Calculadora Liga Pro",
  appleWebApp: { capable: true, title: "Calculadora Liga Pro", statusBarStyle: "default" },
  openGraph: { siteName: "Calculadora Liga Pro", locale: "es_UY", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#02224B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-UY">
      <body>
        <Encabezado />
        {children}
        <footer className="wrap foot">
          Calculadora Liga Pro. Datos públicos de ligapro.uy. Las probabilidades son estimaciones estadísticas: no son cuotas de apuestas ni garantías.
        </footer>
        <BarraInferior />
      </body>
    </html>
  );
}
