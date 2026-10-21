import { Inicio } from "@/components/Inicio/Inicio";
import { leerIndice } from "@/lib/datos-servidor";

export default async function Pagina() {
  const indice = await leerIndice();
  return <Inicio indice={indice} />;
}
