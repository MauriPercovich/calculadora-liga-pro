import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cómo se calcula", description: "Cómo calculamos las chances de cada equipo de Liga Pro." };

export default function Pagina() {
  return (
    <main className="wrap">
      <div className="card">
        <div className="card-b prose" style={{ paddingTop: 16 }}>
          <h2 style={{ fontSize: 20, margin: "0 0 6px" }}>¿Cómo se calcula?</h2>
          <p>
            Partimos de la tabla oficial de la Liga y simulamos 20.000 veces los partidos que faltan, con el reglamento de cada torneo. Cada porcentaje es la proporción de
            simulaciones en las que pasa eso.
          </p>
          <p className="fine">Las probabilidades son estimaciones estadísticas. No son cuotas de apuestas ni garantías.</p>

          <h3>1. La tabla oficial manda</h3>
          <p>Tomamos la tabla que publica la Liga, con sanciones y correcciones, y solo simulamos lo que falta: tabla oficial más partidos restantes simulados igual a tabla final.</p>

          <h3>2. Probabilidad de cada partido</h3>
          <p>Estimamos la fuerza de ataque y de defensa de cada equipo con sus goles del torneo, acercadas a la media de la divisional para que pocos partidos no exageren. En Liga Pro no hay localía. De ahí salen los goles esperados de cada lado:</p>
          <div className="formula">goles esperados de A = media de la divisional × ataque de A × defensa de B</div>
          <p>Con esos goles armamos la probabilidad de cada marcador y, sumando, la de ganar, empatar o perder.</p>

          <h3>3. Reglamento</h3>
          <p>3 puntos por victoria, 1 por empate; un walkover cuenta 3-0. Desempate en la tabla: diferencia de gol, goles a favor, enfrentamiento directo y sorteo.</p>
          <p>
            <b>Apertura:</b> todos contra todos. El 1º es campeón (si dos o más empatan en puntos, se juega una final de desempate). Ascienden los 4 primeros, salvo en la Divisional A, y descienden los 4 últimos.
          </p>
          <p>
            <b>Clausura:</b> todos contra todos, y después la tabla se parte en tres copas. Los 4 primeros juegan la Copa de Oro y ascienden (salvo en la Divisional A); los 4 últimos juegan la Copa de Bronce y descienden; el resto juega la Copa de Plata. Cada copa: semifinales 1º vs 4º y 2º vs 3º, y final, a partido único y con penales si hay empate (en la simulación, 50 y 50). El 1º de la tabla tiene asegurado un lugar en la final por la divisional: si gana la Copa de Oro es campeón; si no, juega la final contra quien la ganó.
          </p>

          <h3>4. Lo que sale de las mismas simulaciones</h3>
          <p>&quot;Si gana, empata o pierde&quot;, &quot;¿con cuántos puntos asciendo?&quot; y &quot;partidos que más te importan&quot; miran solo las simulaciones que cumplen esa condición.</p>

          <h3>Próximamente</h3>
          <p>Un rating por serie con el historial desde 2024, para que el arranque de cada torneo no dependa de pocos partidos, y la medición pública de cuánto acierta el modelo (log loss y Brier) contra referencias simples.</p>
        </div>
      </div>
    </main>
  );
}
