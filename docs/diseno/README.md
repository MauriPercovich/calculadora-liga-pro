# Calculadora Liga Pro: paquete de diseño

Todo lo que salió del diseño, listo para desarrollar.

| Carpeta / archivo | Qué hay |
|---|---|
| `PROMPT-PARA-CLAUDE-CODE.md` | El texto para pegar en Claude Code. |
| `HANDOFF.md` | La especificación completa para implementar. |
| `design/screenshots/00-resumen.png` | Todas las pantallas de celular de un vistazo. |
| `design/screenshots/celular/` | 7 pantallas a 390 px, claro y oscuro, página completa (@2x). |
| `design/screenshots/escritorio/` | 7 pantallas a 1280 px, claro y oscuro, página completa. |
| `design/screenshots/prototipo/` | 19 pasos del prototipo navegable en orden (@2x). |
| `design/screenshots/sistema/` | Sistema de diseño y estados (claro y oscuro). |
| `design/html-estatico/` | El HTML renderizado de cada pantalla, con estilos inline (para sacar medidas). |
| `design/fuente-canvas/` | Fuente original de las mesas de Claude Design (`.dc.html` + `canvas.json`). |
| `codigo-referencia/tokens.css` | Tokens de color, tipografía, espaciado, radios y sombras (claro, oscuro y automático). |
| `codigo-referencia/format.ts` | Formato uruguayo de porcentajes, pp y fechas. |
| `codigo-referencia/model.ts` | Motor de chances + vistas condicionadas (¿qué pasa si?, puntos, partidos que importan). |
| `codigo-referencia/datos-ejemplo/` | Los datos del diseño en JSON (marcados los que son de ejemplo). |
| `codigo-referencia/tests/model.check.ts` | Prueba rápida del modelo: `npx tsx codigo-referencia/tests/model.check.ts`. |
| `reference/` | Brief original y capturas de ligapro.uy y de la app anterior. |

El diseño en vivo (con el prototipo que se puede tocar) está en el lienzo «Calculadora Liga Pro» de Claude.
