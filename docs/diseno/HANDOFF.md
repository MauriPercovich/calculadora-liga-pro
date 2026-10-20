# Calculadora Liga Pro: handoff de diseño a desarrollo

Este paquete tiene todo lo necesario para implementar el diseño final en la app real (Next.js, CSS propio, deploy en Vercel). Está pensado para que lo lea Claude Code (o cualquier dev) de punta a punta antes de tocar código.

**Orden de lectura sugerido**

1. Este archivo completo.
2. `design/screenshots/prototipo/`: el recorrido real de la app, en orden (01 → 19). Es la mejor referencia de comportamiento.
3. `design/screenshots/celular/` y `design/screenshots/escritorio/`: cada pantalla en claro y oscuro.
4. `design/screenshots/sistema/`: sistema de diseño y estados.
5. `codigo-referencia/`: `tokens.css`, `format.ts`, `model.ts` (motor de chances probado) y datos de ejemplo.
6. `design/html-estatico/`: el DOM renderizado de cada pantalla, con estilos inline. Sirve para copiar medidas exactas (paddings, tamaños, colores), **no** para copiar estructura tal cual: hay que componentizar.
7. `design/fuente-canvas/`: fuente original de las mesas de diseño (`.dc.html`, formato del editor de Claude Design; no corre fuera de él). `Prototipo.dc.html` contiene toda la lógica de interacción del prototipo en su `<script>`: es la especificación más fiel de cómo se comporta cada pantalla.
8. `reference/`: brief original y capturas del sitio de la Liga y de la versión funcional anterior de la app.

---

## 1. Producto

- **Qué es:** web app mobile-first que muestra las chances de cada equipo de Liga Pro (fútbol 8 amateur de Montevideo) de salir campeón, ascender, ganar las copas de Oro, Plata o Bronce, o descender.
- **Quién la usa:** jugadores y delegados de 25 a 45 años, casi siempre en el celular, sobre todo el domingo a la noche después de la fecha y durante la semana, discutiendo en el grupo de WhatsApp del equipo. Cada uno sigue **un solo equipo: el suyo**.
- **Negocio:** se le quiere vender a la Liga para integrarla en ligapro.uy. **Tiene que parecer una sección más de su sitio** (mismos colores, tarjetas, banda con trofeo, pestañas con subrayado, tabla con top 4 celeste y Pts sobre gris). No es una marca nueva.
- **Versiones:** 0.9 (base publicable) y 1.0 (lo necesario para la venta). Plan de etapas al final (§14).
- **Tono:** español rioplatense ("elegí", "mirá", "tu cuadro"). Nada de estética de apuestas: son estimaciones, no cuotas.

## 2. Stack y restricciones técnicas

- **Next.js (App Router) + TypeScript**, deploy en **Vercel**. Código en el repo de GitHub del usuario.
- **CSS propio**: `codigo-referencia/tokens.css` como `globals.css` (o importado desde él) + **CSS Modules** por componente. Sin Tailwind, sin librerías de UI, sin librerías de gráficos (los gráficos son SVG a mano), **sin fuentes externas** (`system-ui`).
- Si el repo ya tiene la app funcional (la de las capturas `reference/capturas-originales/1..4`), **no reescribir la capa de datos ni el scraping**: aplicar el diseño encima, reemplazar componentes y sumar lo que falte. Mantener el motor de simulación existente si ya está, y agregarle las vistas condicionadas de `model.ts` (§8).
- Sin estado global pesado: React state + URL + `localStorage` (equipo elegido y tema). Un cookie con el equipo elegido permite renderizar Inicio en el servidor sin parpadeo.
- **Commits a nombre del usuario, sin mencionar a Claude** (sin líneas `Co-Authored-By` ni firmas de IA). El repo es parte de su portfolio.

## 3. Rutas y arquitectura

| Ruta | Pantalla | Barra inferior activa |
|---|---|---|
| `/` | Inicio con tu equipo. Si no hay equipo guardado → `/elegir` | Inicio |
| `/elegir` | Elegir equipo (primera visita o "Cambiar de equipo") | — (sin barra) |
| `/[serie]/[div]` ej. `/s9/c` | Divisional: chances, posiciones, lo que queda, copas, resultados | Tabla |
| `/[serie]/[div]/partidos` (`?tab=copas\|resultados`) | Partidos | Partidos |
| `/[serie]/[div]/equipo/[id]` (`?objetivo=asc`) | Ficha de equipo | Mi equipo si es el tuyo; si no, Tabla |
| `/[serie]/[div]/simular` | Simular | Simular |
| `/[serie]/[div]/sancionados` | Sancionados | Partidos |

- El selector de serie y divisional (hoja inferior en celular, menú en escritorio) cambia `[serie]/[div]` y mantiene la sección actual.
- Divisional sin datos → estado vacío con "Volver a …" (ver `screenshots/prototipo/06`).
- Estructura sugerida:

```
app/
  layout.tsx            ← <html data-theme>, TopBar/BottomNav, tokens.css
  page.tsx              ← Inicio
  elegir/page.tsx
  [serie]/[div]/page.tsx, partidos/, equipo/[id]/, simular/, sancionados/
components/             ← uno por carpeta: Component.tsx + Component.module.css
lib/
  model.ts              ← copiar de codigo-referencia
  format.ts             ← copiar de codigo-referencia
  data/                 ← fetch/scraping existente → tipos de datos-ejemplo
  preferences.ts        ← equipo elegido + tema (localStorage + cookie)
```

## 4. Responsive

Un solo código, tres anchos. Probar en **360, 390, 768, 1024, 1280 y 1440 px**.

| Ancho | Navegación | Layout |
|---|---|---|
| < 768 px | Barra superior azul (52 px) con logo, luna (tema) y selector de divisional de 44 px; **barra inferior fija** de 64 px (+ `env(safe-area-inset-bottom)`) | Una columna, márgenes de 12 px, tarjetas a todo el ancho |
| 768–1023 px | Barra superior de 64 px con los 6 links (INICIO, TABLA Y CHANCES, PARTIDOS, MI EQUIPO, SIMULAR, SANCIONADOS) | Una columna, contenedor de 720 px centrado |
| ≥ 1024 px | Igual | Dos columnas: principal (`flex: 999 1 560px`) + lateral (`flex: 1 1 340px`), contenedor de 1180 px, gutter de 24 px |

- **Sin scroll horizontal en 390 px** salvo dentro de tablas (tabla de posiciones: primera columna fija con `position: sticky`).
- Nombres largos ("Los Poquitos De Siempre FC"): en tarjetas y tablas anchas, **dos líneas**; en filas compactas (mini tabla), **una línea con "…"**. Nunca cortar el número.
- Cifra principal: 104 px en celular, 136 px en escritorio; baja a 88 px si tiene 3 caracteres ("<0,1") y a 64 px si tiene más (">99,9"). El "%" va al 54 % del tamaño, en amarillo.

## 5. Sistema de diseño

Todo está en `codigo-referencia/tokens.css` (claro, oscuro y `prefers-color-scheme`). Ver `design/screenshots/sistema/sistema-de-diseno.png`.

**Colores de marca:** navy `#02224B` (barras y portada), acción `#003C8A`, amarillo `#EAB308` (logo, "%", indicador de navegación), fondo `#E5E7EB`, tarjetas blancas.

**Colores por objetivo: fijos en toda la app y siempre con forma + texto** (nunca solo color):

| Objetivo | Marca | Texto claro / oscuro | Barra claro / oscuro |
|---|---|---|---|
| Campeón | cuadrado con "1º" | `#003C8A` / `#93C5FD` | `#003C8A` / `#3B82F6` |
| Asciende | triángulo ▲ | `#15803D` / `#4ADE80` | `#16A34A` / `#22C55E` |
| Copa de Oro | círculo con "O" | `#854D0E` / `#FACC15` | `#EAB308` / `#EAB308` |
| Copa de Plata | círculo con "P" | `#4B5563` / `#CBD5E1` | `#9CA3AF` / `#94A3B8` |
| Copa de Bronce | círculo con "B" | `#9A3412` / `#FB923C` | `#C2410C` / `#EA580C` |
| Desciende | triángulo ▼ | `#B91C1C` / `#F87171` | `#DC2626` / `#EF4444` |

- La **barra de partido** (gana · empate · gana el otro) usa azul y grises (`--match-*`), **nunca rojo**: el rojo queda reservado para Desciende.
- Variaciones (`▲ era 49%`, `+12,0 pp`) en verde/rojo según si es bueno **para ese objetivo** (bajar en Desciende es bueno).

**Tipografía** (`system-ui`, `font-variant-numeric: tabular-nums` en todo el body):

| Uso | Tamaño / peso |
|---|---|
| Cifra héroe | 104 px (136 escritorio), 800, letter-spacing −4px, line-height 0.9 |
| Título de página | 22 px (28–32 escritorio), 800 |
| Título de tarjeta | 17 px (20 escritorio), 800 |
| Cifra en tabla | 15 px, 800 |
| Cuerpo | 15 px |
| Secundario | 13 px, `--text-2` |
| Sobretítulo | 11 px, 800, +0,8 px, MAYÚSCULAS ("PRÓXIMO PARTIDO · FECHA 8 · DOM 25 OCT") |
| Etiqueta de barra inferior | 11 px, 600 (700 activa) |

**Espaciado** base 4 (4, 8, 12, 16, 24, 32, 48). **Radios:** 4 marca · 6 botón · 8 mosaico · 10 tarjeta · 12 ficha · 16 hoja inferior · 999 chip. **Sombras:** `--shadow-card` (tarjetas) y `--shadow-raise` (tarjeta del próximo partido sobre la portada, ficha).

**Interacción:** zonas táctiles ≥ 44 px. Foco visible: anillo de 3 px `--focus` con 2 px de separación. Hover del botón primario `--action-hover`, presionado `--action-pressed`, deshabilitado gris. Respetar `prefers-reduced-motion`.

## 6. Componentes

| Componente | Notas |
|---|---|
| `TopBar` (celular) | Navy. Logo (triángulo + "LigaPro" itálica + chip amarillo "CALCULADORA"), botón luna (44×44, `aria-label` "Pasar a modo oscuro/claro"), `DivisionSelectorButton` de 44 px con trofeo amarillo y "SERIE 9 / DIVISIONAL C / CLAUSURA 2026". |
| `TopNav` (≥768) | Navy 64 px, links en mayúsculas 13 px, activo blanco 800 con subrayado amarillo de 3 px. |
| `BottomNav` | Fija, 5 ítems con ícono SVG trazo 2 px + etiqueta; activo en `--nav-active` con borde superior amarillo de 3 px; `aria-current="page"`. Se oculta en `/elegir`. |
| `DivisionSelector` | Hoja inferior (celular) con chips por serie, divisional activa en `--action`; "Listo" la cierra; el fondo oscurecido también. En escritorio, popover desde el botón. |
| `ChampionshipBand` (≥768) | Banda blanca como ligapro.uy: trofeo amarillo 48 px + título en mayúsculas + "Fecha 7 de 9 jugada" + pestañas con subrayado. |
| `TeamHero` | Portada navy: escudo (círculo con sigla y color del equipo hasta tener escudos reales), nombre (hasta 2 líneas), "1º · 16 pts · fecha 7 de 9", "Ver ficha" en amarillo, cifra héroe + etiqueta en 2 líneas + variación ("▲ era 49% antes de la fecha 7"). Termina con 52 px de colchón para que la tarjeta siguiente se superponga −36 px. |
| `NextMatchCard` | Sobretítulo, equipos con escudo (rival clickeable → su ficha), tres cifras grandes (Gana X · Empate · Gana Y) y `MatchBar` fina de 8 px. Variante sin partidos: borde punteado "No le quedan partidos". |
| `MatchBar` | 3 tramos proporcionales con 2 px de separación. Variante con números adentro (22–24 px de alto). Si un tramo mide < 12 %, su número va debajo de la barra. |
| `GoalMark` | Marca de 16 px por objetivo (tabla de §5). Decorativa (`aria-hidden`), siempre acompañada de texto. |
| `GoalRow` | Fila botón de 44 px: marca + nombre (128 px) · barra de 8 px · cifra (64 px, derecha). Tocar → ficha con ese objetivo elegido. Barra mínima visible de 1,5 % si la chance es > 0. |
| `GoalTile` | Mosaico de la ficha (3×2): etiqueta corta (Campeón, Asciende, Oro, Plata, Bronce, Desciende) + cifra 20 px. `aria-pressed`; el elegido con borde amarillo de 2 px. Cambia la cifra héroe y todas las secciones de la ficha a ese objetivo. |
| `ChanceRanking` | Pestañas por objetivo (scroll horizontal en celular), filas: escudo · nombre · barra · cifra; tu equipo con fondo `--row-mine`. Por defecto, el objetivo principal de tu equipo. |
| `StandingsTable` | Pestañas segmentadas Hoy / Proyectada. Hoy: Pos, Equipo, **Pts sobre gris**, PJ, PG, PE, PP, GF, GC, DG (con signo). Top 4 en `--row-top4`, tu equipo en `--row-mine`. Proyectada: Pts esp., % Oro, % Plata, % Bronce. En escritorio ambas en una sola tabla con grupo "PROYECTADA". |
| `FixtureCard` | Equipos (hasta 2 líneas) + `MatchBar` con números + "Gana · Empate · Gana". El partido de tu equipo va primero, con borde amarillo, "★ TU PARTIDO" y link a "Sancionados". |
| `CupBracket` | Llaves de Oro (semis 1º–4º, 2º–3º), Plata (con 10 equipos: final directa 5º–6º) y Bronce (7º–10º, 8º–9º), "así quedarían con la tabla de hoy", borde punteado; tu cruce resaltado. Aviso "El 1º tiene lugar asegurado en la final por la divisional". |
| `ResultRow` | Marcador en gris, ganador en 800, "Antes del partido: 19% · E 23% · 58%" y chip **SORPRESA** (amarillo suave) si el ganador tenía < 25 %. |
| `HotCard` | "Lo más picante": marcador + 2 movimientos ("▼ Los Poquitos desciende 78% → **39%**"). Ordenar por mayor movimiento absoluto de la fecha. |
| `TeamCard` (ficha compartible) | Bloque navy cerrado: sobretítulo de la divisional, escudo + nombre + "7º · 7 pts · le quedan 2 partidos", cifra héroe, 6 `GoalTile`, pie con "LigaPro · Calculadora" y "Después de la fecha 7 · 20/10/2026". Pensado para captura de pantalla (ver §11). |
| `WhatIf` | Tres cajas Gana / Empata / Pierde con borde superior en el color de la barra de partido, cifra 24 px y variación en pp. |
| `PointsNeeded` | Título según objetivo: "¿Con cuántos puntos salgo campeón? / asciendo? / me salvo? / llego a la Copa de Plata?". Una fila por puntaje final posible con barra; "seguro" si es 100 % exacto y "no alcanza" si es 0 % exacto. |
| `MattersMost` | Hasta 3 partidos ajenos: "Que gane La Blanca · Fecha 9 · El Tunel FC vs La Blanca F.C" y "+12,0" en verde o rojo. Si no hay ninguno: "Ningún otro partido le cambia esta chance: ya está definida." |
| `EvolutionChart` | SVG: líneas guía en 0/50/100, polilínea de 3 px en el color del objetivo, punto final + etiqueta, F1…F7. `role="img"` + `aria-label` con los valores. |
| `SuspensionList` | Grupos: tu cuadro (borde amarillo), tu próximo rival, resto. Fila: nombre, equipo, rectángulo rojo/amarillo **+ texto** ("Roja · 2 fechas" / "Amarilla (5ª) · 1 fecha"), "Le queda 1" grande a la derecha. Grupo vacío: "Tiene a todos: nadie suspendido." |
| `ResultPicker` | `role="radiogroup"` con 3 botones de 44×44 (1 / E / 2), `aria-label` completo ("Gana UDEM"). Tocar el elegido lo desmarca. |
| `SimSummary` | Franja fija arriba en Simular (celular): "UDEM quedaría 1º con 22 pts · campeón 100%" + "10/10". |
| `Toast` | Abajo, sobre la barra: "**Copiado.** Pegalo en el grupo del cuadro." 2,4 s, `role="status"`. |
| `EmptyState`, `Skeleton` | Ver §10. |

## 7. Pantallas

Para cada una: referencia de imágenes, qué se ve primero y orden de secciones. Celular y escritorio tienen **el mismo contenido**; cambia la grilla.

### 7.1 Elegir equipo: `01-elegir-equipo-*`, prototipo `01`, `02`
Qué se ve primero: "¿De qué cuadro sos?" y el buscador con borde amarillo. Debajo, series → divisionales; la divisional con datos se muestra abierta con sus equipos (escudo, nombre, posición); las otras dicen "sin datos todavía". El buscador filtra en vivo y muestra "Serie 9 · Divisional C · 7º" debajo de cada resultado; sin resultados: "No encontramos ese cuadro. Probá con otra parte del nombre." **Un toque elige y guarda**, sin botón de confirmar. Si ya había equipo, aparece "Cancelar". Sin barra inferior.

### 7.2 Inicio: `02-inicio-*`, prototipo `03`, `04`
Qué se ve primero (sin scroll en 390×844): el equipo, la **cifra principal** en grande y el **próximo rival** en la tarjeta superpuesta. Después: "Tus 6 chances" (`GoalRow`, "tocá una para ver más"), "Lo más picante de la última fecha" (3 en celular, 4 en escritorio), "Así está la tabla" (mini tabla: Pts, ▲ Asc., ▼ Desc.; filas clickeables) y "Otras divisionales" (chips).
La cifra principal se elige con `mainGoal()`: Campeón si ≥ 10 %; si no, Desciende si ≥ 50 %; si no, Asciende si ≥ 10 %; si no, Desciende si ≥ 10 %; si no, Copa de Plata.
Escritorio: portada a todo el ancho con el número a la derecha (136 px); columna lateral con Posiciones y Otras divisionales.

### 7.3 Divisional / Tabla: `03-divisional-*`, prototipo `07`, `08`
Orden: Chances de cada equipo (`ChanceRanking`) → Posiciones (Hoy / Proyectada) → Lo que queda (fecha 8 y 9 con `MatchBar`) → Cómo siguen las copas → Resultados por fecha (chips de fecha).
Escritorio: banda blanca de campeonato con pestañas, ranking + copas lado a lado, tabla unificada a todo el ancho, Lo que queda + Resultados lado a lado.

### 7.4 Equipo: `04-equipo-*`, prototipo `13`, `15`, `16`
Qué se ve primero: la ficha compartible. Después: "Es tu cuadro" / "Hacerlo mi equipo" + "Copiar para compartir"; ¿Qué pasa si…? (si le quedan partidos); ¿Con cuántos puntos…?; Partidos de otros que más te importan; Lo que le queda; Cómo vino su chance; Sancionados (propios y del próximo rival, "Ver todos"); Cerca en la tabla (5 filas alrededor del equipo); "Cambiar de equipo".
**Todo lo de la ficha sigue al objetivo elegido** en los mosaicos (cifra héroe, ¿qué pasa si?, puntos, partidos de otros, evolución, mini tabla).
Si la ficha no es de tu equipo: botón "Volver" arriba y "Hacerlo mi equipo".

### 7.5 Partidos: `05-partidos-*`, prototipo `09`, `10`, `11`
Pestañas fijas Próximos · Copas · Resultados. Próximos: por fecha, tu partido primero y marcado. Copas: `CupBracket`. Resultados: `ResultRow` + leyenda "Sorpresa: el que ganó tenía menos de 25% antes del partido."

### 7.6 Simular: `06-simular-*`, prototipo `18`, `19`
Celular: `SimSummary` fijo, lista de partidos con `ResultPicker`, "1 = gana el primero · E = empate · 2 = gana el segundo", "Completar con lo más probable" (primario) + "Limpiar", y abajo "Así quedaría" (Pts sumando solo lo elegido; 1º / ▲ Asc. / ▼ Desc. recalculadas con el modelo, que **sí** considera los partidos sin tocar). Escritorio: tabla al costado, `position: sticky`.
El recálculo es instantáneo (enumeración exacta, < 100 ms con 10 partidos). Si quedan muchos partidos, correr el modelo en un Web Worker con *debounce* de 150 ms.

### 7.7 Sancionados: `07-sancionados-*`, prototipo `12`
"Para la fecha 8 · según el informe de la Liga del 20/10/2026." Grupos: tu cuadro, tu próximo rival, resto. Escritorio: tabla Jugador · Equipo · Sanción · Fechas · Le quedan.

## 8. Modelo de chances (`codigo-referencia/model.ts`)

Probado con `tsx codigo-referencia/tests/model.check.ts` (salida en §15). Resumen:

- Entrada: equipos (pts, gf, gc), partidos restantes con `p = [gana a, empate, gana b]`, `picks` de Simular y reglas (`phase`, `promote`, `relegate`, `cupSize`).
- Si quedan ≤ 12 partidos: **enumeración exacta** de las 3ⁿ combinaciones. Con 10 partidos: 59.049 hojas, ~300 ms en Node la primera vez (memoizar por `picks`). Permite saber cuándo algo es **seguro** o **imposible** de verdad (`certain`), y solo entonces mostrar "0%" o "100%"; si no, `<0,1%` / `>99,9%`.
- Si quedan más: Monte Carlo con semilla fija (20.000 corridas, el número que muestra la UI).
- Salida por equipo: probabilidad de cada objetivo (0–100), `certain` y puntos esperados (tabla Proyectada).
- `focus(teamId)` en la misma pasada: **condicionales por resultado de cada partido** (¿Qué pasa si…?, Partidos de otros) y **por puntaje final** (¿Con cuántos puntos…?). Así todas las vistas cierran entre sí. `mattersMost()` y `mainGoal()` ya están implementadas.
- Copas: el ganador se calcula sobre la llave real de cada combinación con `knockoutWinProb` (por defecto 50 % + 3 pp por puesto de diferencia, tope 70 %). Ajustable.
- **Simplificaciones pendientes:** no se simulan goles (el ganador suma +1 DG y +1 GF); enfrentamiento directo y sorteo no se evalúan todavía. Si la app ya tiene un motor con goles (Poisson), usar ese y sumarle `focus()`.
- **Importante:** en el prototipo los números se "anclaban" a los valores de ejemplo para que coincidieran con el diseño. En la app real **se muestra directamente lo que da el modelo**. Corriendo `model.ts` con los datos de ejemplo da, por ejemplo, UDEM campeón 80 % (no 74 %): es esperable y está bien.
- Formato: usar siempre `format.ts` (`pct`, `pp`, `dec1`, `dg`, `diaCorto`). Nunca `toFixed` suelto en un componente.

## 9. Reglas de negocio

- Sin localía: el orden de los equipos en un partido no significa nada (copy "Sin localía: el orden no importa").
- **Apertura:** todos contra todos; el 1º es campeón; ascienden 4 y descienden 4 (la Divisional A no asciende → `promote: 0`). Sin copas: ocultar Oro/Plata/Bronce y "Cómo siguen las copas".
- **Clausura:** todos contra todos y después tres copas a partido único (semis 1º vs 4º y 2º vs 3º; penales si hay empate). Top 4 → Copa de Oro **y ascienden**; últimos 4 → Copa de Bronce **y descienden**; los del medio → Copa de Plata (con 10 equipos, final directa 5º–6º; con 12 o más, llave). El 1º tiene lugar asegurado en la final por la divisional.
- Desempate: diferencia de gol, goles a favor, enfrentamiento directo, sorteo.
- Sorpresa: el ganador tenía < 25 % antes del partido.

## 10. Estados (`design/screenshots/sistema/estados.png`)

- **Cargando:** skeleton con la misma silueta (portada + tarjeta superpuesta + filas) y "Calculando 20.000 simulaciones…" (`role="status"`).
- **Sin datos de la divisional:** ícono de líneas, "Todavía no hay datos de esta divisional", "Las chances aparecen cuando la Liga publica la primera fecha.", botón "Elegí otra divisional".
- **Fase regular terminada:** portada con "FASE REGULAR TERMINADA · UDEM terminó 1º", la cifra pasa a la copa ("47% de ganar la Copa de Oro"), aviso "Ascenso y descenso ya están definidos. Ahora se juegan las copas.", Campeón/Asciende muestran "Sí"/"No".
- **Equipo sin partidos:** tarjeta punteada "No le quedan partidos · Ya jugó toda la fase regular. Ahora depende de los demás." + "Lo que tiene que pasar".
- **Sin sancionados:** check verde "UDEM tiene a todos · Nadie suspendido para la fecha 8."
- **Error de red:** misma tarjeta que "sin datos" con "No pudimos cargar los datos de la Liga" y "Reintentar" (no está dibujado; seguir el patrón).

## 11. Compartir

- "Copiar para compartir" copia: `UDEM tiene 74% de chances de salir campeón (Serie 9 · Div. C, después de la fecha 7). Calculadora Liga Pro` + URL de la ficha. Toast de confirmación. Si existe `navigator.share` en celular, usarlo.
- La ficha (`TeamCard`) se ve bien como captura: bloque navy cerrado con fecha y marca.
- 1.0: imagen Open Graph por equipo con `next/og` (viene con Next, no es dependencia externa) usando la misma composición de la ficha, para que el link pegado en WhatsApp muestre la tarjeta.

## 12. Accesibilidad

- Contraste AA en ambos temas (los tokens ya lo cumplen; el amarillo como texto usa `--accent-text`).
- Botones reales (`<button>`, `<a href>`), nunca `div` clickeables. Pestañas con `role="tablist"`/`tab` + `aria-selected`; mosaicos con `aria-pressed`; selector 1/E/2 con `radiogroup`.
- Iconos decorativos `aria-hidden`; gráficos con `role="img"` y `aria-label` con los datos.
- `lang="es-UY"`, foco visible, orden de tabulación lógico, la hoja inferior atrapa el foco y cierra con Escape.

## 13. Textos (copiar tal cual)

"¿De qué cuadro sos?" · "Elegilo una vez y la calculadora arranca siempre por tu equipo: sus chances, su próximo partido y su tabla." · "Buscá por nombre, ej. Poquitos" · "Lo guardamos en este celular. Lo cambiás cuando quieras desde Mi equipo." · "Ver ficha" · "chances de salir campeón / ascender / descender / ganar la Copa de Oro" · "▲ era 49% antes de la fecha 7" · "PRÓXIMO PARTIDO · FECHA 8 · DOM 25 OCT" · "Tus 6 chances" · "tocá una para ver más" · "Lo más picante de la última fecha" · "Así está la tabla" · "En celeste, los 4 que hoy juegan la Copa de Oro y ascienden." · "Otras divisionales" · "Chances de cada equipo" · "Son estimaciones: el resto del torneo se simula partido a partido, no son cuotas." · "Hoy / Proyectada" · "Pts esp. = puntos con los que terminaría en promedio." · "Lo que queda" · "Gana el primero · empate · gana el segundo. Sin localía: el orden no importa." · "Cómo siguen las copas" · "Al terminar la fecha 9 la tabla se parte en tres. Todo es a partido único; si hay empate, penales." · "★ TU PARTIDO" · "Copas y finales" · "Se arman cuando termine la fecha 9. Mientras tanto, así quedarían con la tabla de hoy." · "¿Qué pasa si…?" · "¿Con cuántos puntos salgo campeón?" · "Partidos de otros que más te importan" · "Cuánto cambia tu chance de salir campeón, en puntos porcentuales." · "Lo que le queda" · "Cómo vino su chance" · "Cerca en la tabla" · "Es tu cuadro" / "Hacerlo mi equipo" · "Copiar para compartir" · "Armá tu escenario" · "Elegí resultados. Los partidos que no toques los sigue simulando el modelo." · "Completar con lo más probable" · "Limpiar" · "Así quedaría" · "sin cambios" / "3 resultados elegidos" · "Los puntos suman solo lo que elegiste. Las chances tienen en cuenta todo, incluidos los partidos sin tocar." · "Elegí serie y divisional" · "Listo".

## 14. Plan de trabajo (tickets en orden)

Cada ticket termina con la app andando, revisada en 390 y 1280 px, en claro y oscuro, y con un commit.

1. **Base:** `tokens.css` como global, `format.ts`, tema (`data-theme` + toggle + `prefers-color-scheme` + guardado), layout con `TopBar`/`TopNav`/`BottomNav`, rutas vacías. *Acepta:* navegar entre las 5 secciones en celular y escritorio, tema persistente.
2. **Datos y modelo:** adaptar la capa de datos existente a los tipos de `datos-ejemplo`; integrar `model.ts` (o `focus()` sobre el motor existente) con memo por divisional + `picks`. *Acepta:* sumas por objetivo = 100 % (camp, oro, plata, bronce) y 400 % (asc/desc con 4).
3. **Elegir equipo + preferencias** (localStorage + cookie; redirección desde `/`).
4. **Inicio** completo, con `mainGoal()`, `NextMatchCard`, `GoalRow`, `HotCard`, mini tabla.
5. **Divisional/Tabla** con ranking, posiciones (sticky, Hoy/Proyectada), lo que queda, copas, resultados.
6. **Equipo** con ficha, mosaicos que cambian el objetivo, ¿qué pasa si?, puntos, partidos de otros, evolución (SVG), sancionados, mini tabla, compartir.
7. **Partidos** (pestañas en la URL) y **Sancionados**.
8. **Simular** con recálculo instantáneo (Web Worker si hace falta).
9. **Selector de divisional** (hoja inferior / popover) + estados vacíos, carga y error.
10. **Pulido 1.0:** accesibilidad (§12), Lighthouse ≥ 95 en Accesibilidad y Rendimiento en celular, imagen OG por equipo, metadatos, favicon, 404.

Checklist de aceptación global (del brief): (1) en 390×844 sin scroll se entiende la chance principal y el rival; (2) parece una sección de ligapro.uy; (3) cada objetivo con color fijo + forma + texto; (4) tablas sin romper en 390 px; (5) cifras tabulares con coma decimal; (6) modo oscuro con el mismo cuidado; (7) todos los estados; (8) la ficha se ve bien como captura.

## 15. Datos de ejemplo, verificación y dudas abiertas

**Son de ejemplo (reemplazar por datos reales):** estadísticas de las filas 7 a 10 de la tabla; chances de copas de todos menos UDEM; probabilidades de los partidos restantes salvo UDEM vs Croacia; probabilidades "antes del partido" de la fecha 7; evolución fecha a fecha; nombres de sancionados; colores de escudo. Los reales que se vieron en las capturas: posiciones 1–6, resultados de la fecha 7, partidos de las fechas 8 y 9, chances de Campeón/Asciende/Desciende y "Lo más picante".

**Salida de `tests/model.check.ts` con los datos de ejemplo** (enumeración exacta, 59.049 hojas): sumas Campeón/Oro/Plata/Bronce = 100,00 y Asciende/Desciende = 400,00 · UDEM campeón 80 % · si gana / empata / pierde vs Croacia: 95 % / 75 % / 46 % · por puntos finales 16 → 1,2 %, 17 → 22 %, 18 → 55 %, 19 → 78 %, 20 y 22 → seguro · partidos de otros: El Tunel vs La Blanca (gana La Blanca) +9,5; El Tunel vs La Pampara (gana El Tunel) −9,4 · con Monte Carlo da lo mismo (80 %).

**Dudas abiertas para el usuario o la Liga:**
- ¿La Liga tiene escudos? Hoy se usa círculo con sigla y color.
- Horarios y canchas de la fecha 8 en adelante, y fechas reales de las copas.
- ¿Contra quién se juega la "final por la divisional"?
- Divisionales de 12 a 15 equipos: tamaño exacto de la Copa de Plata (¿llave con byes?).
- ¿La Liga publica las sanciones en un formato que se pueda leer automáticamente?
