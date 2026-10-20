# Brief original de diseño (tal como se le pasó a Claude Design)

> Copia textual del brief con el que se hizo el diseño. Sirve de fuente de verdad para el contenido y las reglas. Las capturas que menciona están en `capturas-originales/`.

## TAREA

Diseñá la interfaz completa de **Calculadora Liga Pro**, una web app mobile-first que muestra las chances de cada equipo de Liga Pro (fútbol 8 amateur de Montevideo) de salir campeón, ascender, ganar las copas de Oro, Plata y Bronce o descender.

Entregá:

1. Las 7 pantallas de abajo, cada una en **celular (390 px)** y **escritorio (1280 px)**, en **modo claro y oscuro**.
2. Un **sistema de diseño** listo para pasar a código: tokens de color (claro y oscuro), escala tipográfica, espaciados, radios y sombras, y los componentes con todos sus estados.
3. Una nota corta por pantalla que explique qué se ve primero y por qué.

## CONTEXTO

**Qué es y para quién.** Liga Pro tiene unas 9 series (cada una juega un día y en una cancha) y cada serie tiene divisionales A, B, C, D… de 10 a 15 equipos. La usan jugadores y delegados de 25 a 45 años, casi siempre desde el celular, sobre todo el domingo a la noche después de la fecha y durante la semana para discutir en el grupo de WhatsApp del equipo. Cada uno sigue un solo equipo: el suyo.

**Objetivo de negocio.** La idea es vendérsela a la Liga e integrarla en ligapro.uy. Por eso **tiene que parecer parte de su sitio**: misma identidad, para que integrarla cueste pocos cambios. No es una marca nueva.

**Identidad de ligapro.uy (respetala):**
- Azul marino `#02224B` en la barra superior, azul `#003C8A` como color de acción y amarillo `#EAB308` como acento (lo usan en el logo y en los destacados).
- Fondo gris claro `#E5E7EB` con tarjetas blancas de bordes redondeados (6 a 10 px) y sombra muy suave.
- Fuente del sistema (system-ui, sin fuentes externas). Títulos en negrita, algunos en mayúsculas.
- En la página de cada campeonato: una banda blanca con trofeo y el nombre "SERIE 9 / DIVISIONAL C / CLAUSURA 2026", pestañas con subrayado, y la tabla de posiciones con los 4 primeros resaltados en celeste y la columna Pts sobre gris.

**Reglamento (define qué se muestra):**
- Sin localía: el orden de los equipos en un partido no significa nada.
- Apertura: todos contra todos; el 1º es campeón; ascienden 4 y descienden 4 (la Divisional A no asciende).
- Clausura: todos contra todos y después tres copas a partido único (semis 1º vs 4º y 2º vs 3º, penales si hay empate). Los 4 primeros juegan la **Copa de Oro y ascienden**; los 4 últimos juegan la **Copa de Bronce y descienden**; los del medio juegan la **Copa de Plata**. El 1º tiene lugar asegurado en la final por la divisional.
- Desempate: diferencia de gol, goles a favor, enfrentamiento directo, sorteo.

**Pantallas (contenido real, no lo inventes ni lo saques):**

1. **Elegir equipo** (primera visita): "¿De qué cuadro sos?", buscador y equipos agrupados por serie y divisional. El elegido se guarda.
2. **Inicio con tu equipo**: tu equipo con su chance principal en grande (ej.: UDEM, **74%** de chances de salir campeón), las 6 chances (Campeón, Asciende, Copa de Oro, Copa de Plata, Copa de Bronce, Desciende), próximo partido con la barra gana/empata/pierde (60% · 18% · 22%), "Lo más picante de la última fecha" (resultados que más movieron las chances: "Prado 2-7 Los Poquitos: Los Poquitos descender 78% → 39%"), mini tabla y accesos a otras divisionales.
3. **Divisional**: ranking de chances con pestañas por objetivo y barras, tabla oficial (Pos, Equipo, Pts, PJ, PG, PE, PP, GF, GC, DG) y proyectada (puntos finales esperados, % Oro / Plata / Bronce), partidos que quedan con su barra de 3 tramos, explicación de cómo siguen las copas y resultados por fecha con "Antes del partido: 58% · E 23% · 19%" y una marca de **Sorpresa**.
4. **Equipo**: encabezado con escudo, posición y chance principal; las 6 chances elegibles; "¿Qué pasa si…?" (Gana 59% · Empata 39% · Pierde 28%); "¿Con cuántos puntos asciendo?" (barras por puntaje final); "Partidos de otros que más te importan" (+15,0 / +8,8 / −15,1 puntos porcentuales); lo que le queda; gráfico de evolución de la chance fecha a fecha; sancionados propios y del próximo rival; mini tabla; botones "Hacerlo mi equipo" y "Copiar para compartir".
5. **Partidos**: próximos por fecha con su barra de probabilidad, copas y finales, y resultados.
6. **Simular**: lista de partidos restantes con selector 1 / E / 2 por partido, "Completar con lo más probable", "Limpiar", y la tabla que se recalcula al lado (en celular, abajo).
7. **Sancionados**: tabla de jugadores (nombre, equipo, Roja/Amarilla, fechas, le quedan), con tu equipo primero.

Navegación: barra superior en escritorio y **barra inferior fija en celular** (Inicio · Tabla · Partidos · Mi equipo · Simular). Selector de serie y divisional siempre a mano.

**Restricciones:**
- Números con coma decimal y formato uruguayo: "9,8%", "<0,1%", ">99,9%".
- Textos en español rioplatense ("elegí", "mirá", "tu cuadro").
- Contraste AA, zonas táctiles de 44 px, sin scroll horizontal en 390 px salvo dentro de tablas.
- Los nombres de equipo pueden ser largos ("Los Poquitos De Siempre FC"): resolvé el recorte.
- Colores fijos por objetivo en toda la app (Campeón, Asciende, Oro, Plata, Bronce, Desciende), distinguibles también sin color.
- Nada de estética de apuestas: no son cuotas, son estimaciones.
- Sin librerías ni fuentes externas: se implementa en Next.js con CSS propio.

## REFERENCIAS

- `5-ligapro-inicio.jpg` y `6-ligapro-posiciones.jpg`: el sitio actual de la Liga. **Es la identidad a seguir.**
- `1-app-inicio-escritorio.png`, `2-app-equipo-celular.png`, `3-app-divisional-celular.png` y `4-app-simular-escritorio.png`: la versión funcional actual de la app. **La estructura y el contenido están validados**; quiero mejorar jerarquía, ritmo, legibilidad de los números y detalles visuales, no cambiar qué se muestra.

Referencias de producto del mismo rubro en Uruguay: calculadoraceleste.com y calculadora-lud.vercel.app.

## EVALUÁ

1. En celular, sin hacer scroll, ¿se entiende en 3 segundos cuál es la chance principal de tu equipo y contra quién juega?
2. ¿Pasaría por una sección más de ligapro.uy (colores, tarjetas, banda, pestañas, tabla)?
3. ¿Cada objetivo tiene siempre el mismo color, y se distingue también por texto o forma?
4. ¿Las tablas entran en 390 px sin romper, con el nombre del equipo legible?
5. ¿Los porcentajes están en cifras tabulares, alineados, con coma decimal?
6. ¿El modo oscuro tiene el mismo cuidado que el claro, con el amarillo legible?
7. ¿Están todos los estados: cargando, sin datos, fase regular terminada, equipo sin partidos, sin sancionados?
8. ¿Una captura de la ficha de equipo se ve bien para compartir en WhatsApp?
