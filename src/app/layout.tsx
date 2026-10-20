import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav, Pie, TopBar } from "@/components/AppShell/AppShell";
import { leerIndice } from "@/lib/datos-servidor";
import { SCRIPT_TEMA } from "@/lib/preferencias";

export const metadata: Metadata = {
  title: { default: "Calculadora Liga Pro", template: "%s · Calculadora Liga Pro" },
  description: "Chances de salir campeón, ascender, ganar las copas de Oro, Plata y Bronce o descender en cada divisional de Liga Pro.",
  applicationName: "Calculadora Liga Pro",
  appleWebApp: { capable: true, title: "Calculadora Liga Pro", statusBarStyle: "black-translucent" },
  openGraph: { siteName: "Calculadora Liga Pro", locale: "es_UY", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#02224B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const indice = await leerIndice();
  return (
    <html lang="es-UY" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body>
        <TopBar todas={indice.divisionales} />
        {children}
        <Pie />
        <BottomNav todas={indice.divisionales} />
      </body>
    </html>
  );
}
