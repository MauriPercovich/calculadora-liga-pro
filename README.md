# Calculadora Liga Pro

Chances de salir campeón, terminar 1º, ascender, descender y a qué copa va (Oro, Plata o Bronce) para cada equipo de [Liga Pro](https://www.ligapro.uy) (fútbol 8, Montevideo), actualizadas después de cada fecha.

**En vivo: [calculadora-liga-pro-five.vercel.app](https://calculadora-liga-pro-five.vercel.app)**

Proyecto independiente. Los datos son los que la Liga publica en su web.

## Qué hace

- **Tu equipo primero**: elegís tu cuadro y la portada abre con sus chances y su próximo partido.
- **Chances por divisional**: campeón, 1º puesto, ascenso, descenso y a qué copa va, con tabla oficial y tabla proyectada.
- **Ficha de equipo**: qué pasa si gana, empata o pierde; con cuántos puntos le alcanza; qué partidos de otros le importan; cómo cambiaron sus chances fecha a fecha; sancionados propios y del rival.
- **Partidos**: probabilidad de cada resultado en lo que viene, y en lo jugado, lo que el modelo esperaba antes (con las sorpresas marcadas).
- **Simular**: elegís resultados de los partidos que faltan y se recalcula todo en el navegador.

## Cómo calcula

1. **La tabla oficial manda**: se toma la tabla de la Liga y solo se simulan los partidos que faltan.
2. **Modelo de goles**: ataque y defensa de cada equipo a partir de sus goles del torneo, acercados a la media de la divisional. Sin localía (en Liga Pro no hay). Goles esperados de A = media × ataque de A × defensa de B; de ahí la probabilidad de cada marcador.
3. **Monte Carlo**: 20.000 simulaciones con el reglamento completo (Apertura: campeón, 4 ascensos, 4 descensos; Clausura: copas de Oro, Plata y Bronce con semis 1º vs 4º y 2º vs 3º, final por la divisional para el 1º, penales 50/50).
4. **Desempate**: diferencia de gol, goles a favor, enfrentamiento directo y sorteo.

El detalle está en [`src/lib/engine`](src/lib/engine) y en la página *Cómo se calcula*.

## Stack

Next.js 15 (App Router, páginas estáticas) · TypeScript · motor de simulación propio sin dependencias · GitHub Actions para actualizar datos · Vercel.

## Datos

```bash
node scripts/import.mjs --desde 2024     # baja de ligapro.uy a data/raw/ (respeta el límite de ~60 pedidos/min)
npx tsx scripts/build-data.ts            # normaliza y precalcula en public/data/
npm run dev
```

Endpoints públicos que usa: `/api/tournaments`, `/api/tournaments/{id}`, `/positions`, `/groupweeks`, `/games?filter[groupweek][0]={fecha}` y `/penalizations`.

La GitHub Action [`actualizar-datos`](.github/workflows/actualizar-datos.yml) corre cada 30 minutos, baja solo los campeonatos en curso y sube los datos si cambió algo.

---

Las probabilidades son estimaciones estadísticas. No son cuotas de apuestas ni garantías.
