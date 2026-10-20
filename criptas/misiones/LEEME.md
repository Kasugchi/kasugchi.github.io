# Cómo crear una misión

Cada misión es un archivo `.json` en esta carpeta. Para que aparezca en el juego, añade su `id` a `CAMPANA` en `js/datos.js`, en el orden en que se juega.

Las coordenadas son `[x, y]`: `x` va de 0 a 25 (columnas, de izquierda a derecha) e `y` de 0 a 18 (filas, de arriba abajo). El plano de salas está en `TABLERO`, dentro de `js/datos.js`.

## Campos

| Campo | Qué es |
|---|---|
| `id` | Igual que el nombre del archivo, sin `.json`. |
| `numero`, `titulo`, `intro` | Lo que se lee en el pergamino de inicio. |
| `objetivo` | `{ "tipo": "escalera", "requiere": ["flag"], "texto": "..." }` (salir por la escalera tras conseguir esas flags), `{ "tipo": "matar", "id": "jefe", "texto": "..." }` (acabar con un monstruo) o `{ "tipo": "escapar", "rondas": 20, "requiere": ["flag"], "texto": "..." }` (salir antes de que pasen esas rondas; al acabarse, quien siga dentro queda sepultado). |
| `recompensa` | Oro para cada héroe superviviente. |
| `errante` | Tipo de monstruo que sale con la carta de monstruo errante. |
| `escalera` | Esquina superior izquierda de la escalera (ocupa 2×2 y debe ir dentro de una sala). |
| `rocas` | Casillas bloqueadas, para cerrar pasillos. |
| `puertas` | `{ "id", "a": [x,y], "b": [x,y] }` entre dos casillas vecinas con pared. Opcional: `"secreta": true` o `"bloqueada": true` (se abre con un disparador). |
| `muebles` | `{ "tipo", "x", "y", "w", "h" }`. Tipos: mesa, cofre, estanteria, trono, sarcofago, chimenea, armero, alquimista, potro, caldero, altar. |
| `monstruos` | `{ "id", "tipo", "x", "y", "ia" }`. Tipos: trasgo, orco, esqueleto, zombi, momia, guerrero, gargola, hechicero. Opcional: `nombre`, `jefe`, `cuerpo`, `ataque`, `defensa`, `hechizos` (solo el hechicero: `rayo`, `invocar`). |
| `trampas` | `{ "id", "tipo", "x", "y" }`. Tipos: foso, lanza, bloque. |
| `tesoros` | Por letra de sala: lo que se encuentra la primera vez que alguien busca tesoro en ella. Campos: `texto`, `oro`, `objeto` (una poción), `arma`, `flag`, `trampaCofre`. Las salas sin tesoro fijo usan el mazo de cartas. |
| `disparadores` | El guion de la misión (ver abajo). |

## IA de los monstruos

- `agresivo`: va a por el héroe más cercano en cuanto lo veis.
- `guardian`: no sale de su sala; ataca a quien entre.
- `centinela`: no se mueve hasta que un disparador lo activa.
- `lanzador`: lanza rayos a distancia e invoca esqueletos cuando está herido.

## Disparadores

```json
{ "cuando": "flag", "nombre": "llave", "acciones": [ ... ] }
```

`cuando` puede ser:

- `region_revelada` + `region`
- `puerta_abierta` + `puerta`
- `monstruo_muerto` + `id`
- `heroe_en_casilla` + `casilla`
- `flag` + `nombre`, o `flag` + `requiere: [...]` para varias flags a la vez
- `tesoro` + `region`

Cada disparador salta una sola vez. Acciones posibles:

- `historia` + `texto` (ventana que hay que cerrar)
- `mensaje` + `texto` (aviso breve)
- `flag` + `nombre`
- `activar` + `ids`
- `aparecer` + `monstruos`
- `desbloquear` + `puerta`
- `abrir` + `puerta`
- `revelar` + `region`

Mira `03-celdas-de-hierro.json` como ejemplo: una llave que abre una celda y una alarma que hace aparecer refuerzos.

## Mazmorra Perdida

Las mazmorras aleatorias las crea `js/procedural.js` con este mismo formato. Para ver una en JSON, en la consola del navegador:

```js
const P = await import('./js/procedural.js?v=1');
P.generarMision('MISEMILLA-1', 1)
```
