# Criptas de Velmor — Mecánicas y mapa del código

Guía pensada para que una IA (o una persona) entienda el juego y sepa **dónde tocar**. Las referencias son a **nombres de función** (búscalos con grep); los números de línea cambian.

- Juego web en vanilla JS (módulos ES), sin build. Se publica tal cual en GitHub Pages: `kasugchi.github.io/criptas/`.
- Todo el código, los nombres y los textos están en **español**. Mantén ese idioma al añadir cosas.
- Inspirado en un juego de mesa de mazmorras por turnos, pero **sin usar** nombres, arte ni misiones oficiales. No añadas assets ni textos de terceros.

---

## 1. Arquitectura en una frase

`estado` (JSON puro) + `aplicar(estado, accion, jugador, cargarMision)` en `js/motor.js`. Solo el **anfitrión** (o el modo local) ejecuta el motor; los demás reciben el estado por Firebase. Cada cosa que pasa se apunta en `estado.eventos` y la interfaz (`js/ui.js`) los **anima** en orden.

```
ui.js ──acción──▶ motor.aplicar() ──muta──▶ estado ──publicar()──▶ Firebase RTDB ──▶ invitados
   ▲                                    │
   └────── reproducir() anima estado.eventos (dados, movimientos, muertes, mensajes)
```

### Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | Todas las pantallas del juego (portada, sala, briefing, juego, armería/campamento, final). Importmap con versión. |
| `estilo.css` | Estilos del juego. |
| `js/motor.js` | **Reglas.** Todo lo que cambia el estado. ~3100 líneas. |
| `js/datos.js` | **Contenido.** Héroes, monstruos, armas, armaduras, hechizos, subclases, reliquias, cartas, constantes. |
| `js/ia.js` | IA de monstruos y aliados (`turnoMonstruo`, `turnoAliado`). |
| `js/tablero.js` | Geometría pura: regiones, paredes, puertas, línea de visión, caminos (`explorar`), adyacencia. No sabe reglas. |
| `js/procedural.js` | Generador de mazmorras aleatorias por semilla (Mazmorra Infinita / Perdida) + `validar`. |
| `js/ui.js` | Interfaz: pantallas, sala, turnos, botones de acción, animación de eventos, sonido sintetizado, campamento, crónica, trucos, reacciones. ~2300 líneas. |
| `js/render.js` | Tablero 2D en canvas (`class Tablero`): suelo, muebles, fichas, animaciones (embestida, impacto, caída), partículas. |
| `js/render3d.js` | Vista 3D con three.js (`class Escena3D`): cámara, luces, antorchas, niebla, partículas. |
| `js/miniaturas.js` | Figuras 3D hechas con primitivas (`crearMiniatura`). |
| `js/muebles3d.js` | Muebles y puertas 3D (`crearMueble`, `crearPuerta`). |
| `js/sprites.js` | Si existe `sprites/<clave>.png`, se usa en vez de la miniatura (`cargarSprites`, `spriteDe`). |
| `js/iconos.js` | Iconos SVG (game-icons.net, CC BY 3.0). |
| `js/red.js` | Salas multijugador con código de 4 letras sobre Firebase Realtime Database (`crearSala`, `unirseSala`), presencia. |
| `js/nube.js` | Partidas guardadas en Firestore con cuenta de Google; control de acceso (lista blanca, `accesoAbierto`). |
| `js/firebase.js` | Configuración pública de Firebase (una sola app). |
| `js/panel.js` + `panel.html` | Panel de administración: solicitudes de acceso, usuarios, partidas, interruptor de lista blanca. |
| `js/vendor/three.module.min.js` | three.js r160 (MIT). |
| `misiones/*.json` | Misiones del Modo Historia. Formato en `misiones/LEEME.md`. |
| `sprites/` | Ilustraciones PNG de héroes (`LEEME.md` dice nombres y formato). |
| `version.py` | Actualiza la versión del importmap (`meta[name=version]`) para romper la caché. **Ejecutar antes de cada commit.** |
| `barco.html`, `zepelin.html`, `base-oscura.html`, `base.html` | **Prototipos** de la base (hub) independientes del juego; ver §13. |

---

## 2. El estado

Creado por `crearPartida(elegidos, jugadores)` y preparado por misión con `iniciarMision(estado, def)`.

Campos principales:

- `fase`: `'cargando' | 'briefing' | 'mision' | 'resultado' | 'armeria' | 'final'`.
- `heroes`: objeto por tipo (`barbaro`, `enano`, `elfo`, `mago`). Cada héroe: `jugador`, `ia`, `fem`, `arma`, `armaduras[]`, `objetos{}`, `oro`, `banco`, `inventario`, `cuerpo/cuerpoMax`, `mente`, `menteActual`, `x,y`, `vivo`, `fuera`, `efectos{}`, `hechizos[]`, `nivel`, `xp`, `puntos`, `mejoras{}`, `subclase`, recursos (`rabia`, `runas`, `armonia`, `fragmentos`), `caido` (Leyenda).
- `orden`: orden de turno (se baraja al empezar cada misión).
- `turno`: `{ heroe, movTirada, movRestante, movido, accion, plantado, poseido, ... }`.
- `ronda`, `monstruos[]`, `puertas[]`, `muros[]`, `muebles[]`, `trampas[]`, `rocas{}`, `escalera`, `revelado{}`, `flags{}`, `disparados{}`, `mazo` (cartas de tesoro).
- `mision`: copia del JSON de la misión en curso.
- `aleatorio`: presente en la Mazmorra Infinita (`{ semilla }`). **Muchas reglas solo se activan si `estado.aleatorio`** (XP, subclases, recursos de clase, rarezas, maldiciones…). `estado.pruebas` activa algunas en la zona de pruebas.
- `dificultad`: `'aventurero' | 'heroe' | 'leyenda'` (solo Infinita).
- `reliquias{}`, `cargador`, `contrato`, `cronica{actual, ultima, campana}`, `fantasmas`, `eventos[]`, `log[]`, `seq`.

Claves de `localStorage` (en `ui.js`): `criptas_partidas` (varias partidas), `criptas_id`, `criptas_nombre`, `criptas_vista`, `criptas_sonido`, `criptas_velocidad`, `criptas_autoreac`, `criptas_fantasmas`, `criptas_records`, `criptas_figuras`, `criptas_acceso`.

---

## 3. Acciones (`aplicar`)

`aplicar` devuelve `null` si fue bien o un **texto con el motivo del rechazo**. Primero comprueba fase y permisos (`puedeControlar`).

| Fase | Acciones |
|---|---|
| Globales (anfitrión) | `empezar`, `continuar`, `volverCampamento`, `siguienteMision` |
| Cualquiera, en misión | `reaccion` (sello sobre el héroe, máx. 1 cada 2,5 s por jugador) |
| `armeria` (campamento) | `comprar`, `mejorar`, `subclase`, `descansar`, `purificar`, `equipar`, `guardar`, `vender`, `contratar`, `despedir`, `cargar`, `descargar`, `depositar`, `retirar`, `transferir` |
| `mision`, en tu turno (`accionHeroe`) | `tirar`, `mover`, `atacar`, `hechizo`, `buscarTesoro`, `buscarTrampas`, `desarmar`, `abrirPuerta`, `habilidad`, `moverPoseido`, `poderPoseido`, `atacarPoseido`, `moverAliado`, `atacarAliado`, `rezar`, `equiparHallazgo`, `mercader`, `reliquia`, `trompa`, `caldero`, `pocion`, `tirarCargador`, `moverCargador`, `seguir`, `mochila`, `salir`, `finTurno` |

`disponibles(estado, id)` dice a la interfaz qué se puede hacer ahora; `ui.js › pintarAcciones` monta los botones a partir de eso.

**Para añadir una acción:** caso en `accionHeroe` (o en el `switch` de armería) → que aparezca en `disponibles` → botón en `pintarAcciones`/`accionBoton` → si produce algo visible, un evento con `ev(estado, {tipo: ...})` y su animación en `ui.js › animar`.

---

## 4. Ciclo de turno

- `aplicar('empezar')`: baraja `orden`, `revelar`, `empezarTurno` del primero vivo.
- `empezarTurno(estado, id)`: resetea `turno`, aplica veneno, borra efectos «hasta tu próximo turno», suma armonía al elfo, **decrementa los `TEMPORALES`** (y llama a `finTemporal` al acabar), capa de sombras, forma de oso, posesión, turno IA de compañeros (`turnoIA`).
- Movimiento: `tirar` → 2 dados (1 si `dadosMovimiento` lo reduce: placas, agotado, petrificado, mareo…), luego `mover` con `destinos`/`moverHeroe`. Una **acción** por turno (`usarAccion`); se puede mover antes o después.
- `finTurno` → `siguienteTurno`: siguiente héroe activo; si no quedan, `turnoMonstruos` → `comprobarFin` → `ronda++` → cuenta atrás de misiones de escape (`rondasRestantes`, `derrumbe`).
- `turnoMonstruos`: lobos primero; veneno; posesiones; aliados (`turnoAliado`); resto `turnoMonstruo` (ia.js) con `ctxIA`.

---

## 5. Combate

- Dado de combate (`D.CARAS`): 3 calaveras, 2 escudos blancos, 1 escudo negro. `tirarCombate(n)`.
- **Héroe ataca** (`golpearMonstruo`): calaveras − escudos **negros** del monstruo = daño. Modificadores: `perfora`, tiro certero, golpe a traición, runa de fuego, sombras (×2, ×3 con Guardián pegado), dormido (no defiende). Luego `danarMonstruo`.
- **Monstruo ataca** (`golpearHeroe`): calaveras − escudos **blancos** del héroe. Ataques mentales (`opciones.mental`, Rayo, fantasma) se defienden con mente. `danarHeroe` gestiona escudos totales, cadena de hermanos, poción automática al morir, aguante…
- Ataque del héroe: `ataqueHeroe(h)` = arma + mejoras + efectos + subclase + `extraEspecialidad` − penalizaciones. Defensa: `defensaHeroe(h)` − `penalDefensa(h)`. Desglose para la UI: `desgloseAtaque`, `desgloseDefensa`.
- Armas: `diagonal` (ataca en diagonal), `distancia` (a lo que ve), `alcance: 2`, `dosManos` (sin escudo), `pesada` (no mover y disparar el mismo turno). Diagonales y esquinas: `tablero.js › diagonalLibre`, `puedeTocar`.
- Muerte de monstruo (`danarMonstruo`): crónica, rabia del asesino, efectos de armas (sed, avaro), **XP repartida por daño** (`repartirXP`, total = 1 + cuerpoMax + 3 élite + 6 jefe, solo Infinita), botín de mercader/fantasma, fragmentos del nigromante, disparador `monstruo_muerto`.

---

## 6. Exploración

- Visibilidad: `revelar`, `revelarSala`, `monstruosALaVista`. Línea de visión: `tablero.js › lineaVision`.
- Puertas (`abrirPuerta`, secretas, bloqueadas), muros frágiles (`estado.muros`, trompa y rompepiedras), rocas.
- Tesoro: `buscarTesoro` (tesoro fijo de la sala o carta del mazo `D.CARTAS_TESORO`: oro, pociones, nada, monstruo errante, flecha, derrumbe). Trampas: `buscarTrampas`, `desarmar` (necesita kit; el enano siempre puede), `activarTrampa`.
- Hallazgos de equipo: `nuevoHallazgo` → `h.hallazgos` + evento `'hallazgo'` → la UI pregunta si equiparlo (`preguntarHallazgo`) → acción `equiparHallazgo`.
- Disparadores (guion de misión): `disparar(estado, cuando, datos)` y `ejecutarAccionGuion`. Tipos y acciones en `misiones/LEEME.md`.

---

## 7. Héroes, magia y equipo

- Héroes base (`D.HEROES`): bárbaro (def 2, cuerpo 8, mente 2), enano (def 3, 7, 3, desarma siempre), elfo (def 2, 6, 4, tierra), mago (def 2, 4, 6, fuego/aire/agua, sin armadura). Variante femenina por `fem`.
- Hechizos (`D.HECHIZOS`, `HECHIZOS_POR_ELEMENTO`): cada héroe tiene los de sus elementos; se gastan al lanzarse (`lanzar`, `objetivosHechizo`). Sacerdote → `HECHIZOS_LUZ`; nigromante → `HECHIZOS_OSCUROS`.
- **Mente**: `menteHeroe` (máximo), `menteAhora`/`h.menteActual` (gasta en la misión), `perderMente`. A 0 → `aterrorizado` (−1 ataque/defensa, sin habilidades). Se recupera en el campamento.
- Equipo e inventario (`ponerEquipo`, `equipar`, `guardar`, `vender` a mitad de precio, `motivoNoEquipar`). Cada héroe tiene `inventario` personal (no se pasa a otros).
- **Cargador** (`D.CARGADOR`): se contrata en el campamento, lleva la carga del grupo; si muere, la carga se pierde. `tirarCargador`, `moverCargador`, `seguir`, `mochila`.
- **Banco**: `depositar`, `retirar`, `transferir` (máx. 40 %, una vez por misión).
- Pociones (`D.POCIONES`, `darPocion`; el amuleto del glotón limita a 2).

---

## 8. Mazmorra Infinita (solo con `estado.aleatorio`)

- Pisos generados con `procedural.js › generarMision(semillaDeNivel(semilla, piso), piso)`. Zonas por profundidad (`ZONAS`): cuevas (1), catacumbas (6), fortaleza (11), abismo (16).
- Al bajar (`aplicar('siguienteMision')`): `esconderPieza`, `ponerMurosFragiles`, `ponerExtrasInfinita` (altar con dios 55 %, mercader 35 % desde el piso 2, fantasmas de grupos caídos), `pisoEspecial` (jefe de zona cada 5 pisos; el **Corazón** en el 20; maldición desde el piso 3 con 45 %, o seguro si descansasteis).
- Jefes: `JEFES_ZONA`, fases por umbral de vida (`faseJefe`, invocan refuerzos con `sitioJunto`). `corazonVencido` → modo pesadilla.
- Maldiciones (`D.MALDICIONES`): oscuridad, inundado, fiebre del oro, sin descanso.
- Descanso: `votarDescanso` (votos de los jugadores; cura todo, pero el siguiente piso sale maldito).
- Dificultad (`D.DIFICULTADES`): aventurero (repetís piso), héroe (fin), leyenda (quien cae, cae para siempre: `h.caido`).
- Al continuar tras un piso: quien cayó pierde la bolsa (el banco se salva); los vivos ganan XP; las heridas se arrastran.
- **Niveles y XP**: `ganarXP`, `D.xpParaNivel(n) = 5·(n−1)·(n+2)/2` (10, 25, 45, 70…). Cada nivel da un punto para `mejorar` (`D.MEJORAS`: cuerpo, ataque, defensa, mente con máximos).
- **Subclases** (nivel 3, `D.SUBCLASES`, `elegirSubclase`): cada una con ventaja fija pequeña (`mods`, `cuerpoExtra`, flags), habilidad principal una vez por piso y extras. **Las pegas solo se aplican al usar la habilidad** y duran 2–3 turnos (efectos en `TEMPORALES`, con `durante(h, k, n)`).
  - Enano: guardián, minero, berserker. Bárbaro: campeón, espadas gemelas, cazador. Elfo: arquero lunar, caminante de sombras, guardián del bosque. Mago: hechicero (posesión), nigromante, sacerdote.
- **Recursos de clase** (`D.HAB_CLASE`, `habilidadesHeroe` = subclase + extras + clase; `r.recurso` agrupa los botones en la UI):
  - Bárbaro: **rabia** (+1 al recibir daño y al matar, máx. 5; `ganarRabia`).
  - Enano: **runas** (3 por piso, +1 por trampa desarmada, máx. 4).
  - Elfo: **armonía** (+1 por turno sin ser herido, máx. 3).
  - Mago: **concentración** (2 de mente para recuperar un hechizo).
- Habilidades: `habilidadesDe`, `usarHabilidad` (un `switch` grande por id). Campos: `objetivo`, `coste`, `rabia`, `runas`, `armonia`, `menteCoste`, `sinLimite`, `sinAccion`.
- **Posesión** (hechicero): `poseidoDe`, `moverPoseido`, `atacarPoseido`, `usarPoderPoseido`, `liberarPosesion`, `turnoDominado` (si pierde el duelo de mentes).
- **Nigromante**: fragmentos solo de muertes en su sala (máx. 6), `alzar` con d6 (rebelde / alma escapa / aliado / resistente / el monstruo original), `cosecha`, `tumba`; aliados (`aliadosDe`, `dirigirAliado`); si cae a 1 de cuerpo, sus esqueletos se rebelan.
- **Altares** (`rezar`, `D.DIOSES`): guerra, suerte (puede purificar la Hoja maldita), avaricia.
- **Mercader errante** (`tratoMercader`, `despedirMercader`, `enfadarMercader`, `precioMercader`): es **neutral**, no cuenta como enemigo; tocarlo abre la tienda. Trae 1 rareza exclusiva + 2 cosas. Robarle o atacarle lo enfada.
- **Rarezas del mercader** (`D.ARMAS`/`D.ARMADURAS` con `mercader: true`, cada una con `bueno` y `malo`): hacha sedienta, espada del avaro, daga susurrante, martillo del trueno, arco de hueso, lanza del mártir, **Hoja del rey caído** (maldita: `malditaPuesta`, se purifica con sacerdote o Diosa de la suerte), capa de sombras, amuleto del glotón.
- **Fantasmas**: al caer un grupo, `ui.js › guardarFantasma`; en partidas futuras aparecen en ese piso con su equipo.

---

## 9. Modo Historia

- Misiones JSON en `misiones/`, orden en `D.CAMPANA`. Objetivos: `escalera` (salir con flags), `matar`, `escapar` (rondas; al cogerse el objetivo se suman rondas extra con la acción de guion `rondasExtra`).
- Reliquias de campaña (`D.PIEZAS`, `D.RELIQUIAS`, `ganarReliquia`, `usarReliquia`, `reliquiasDe`): Trompa de Jericó (`tocarTrompa`), Farol de los Ahogados (`farolIlumina`), Cadena de Hermanos, Escudo del Último Muro, Brújula del Desertor, Cáliz Partido (`beberCaldero`), Campana de los Muertos.
- Crónica por misión y campaña (`cronicaNueva`, `cerrarCronica`; títulos en `ui.js › TITULOS`, `asignarTitulos`).

---

## 10. Monstruos e IA

- Datos en `D.MONSTRUOS` (mov, ataque, defensa, cuerpo, mente, `nomuerto`, `poder`).
- Comportamientos (`m.ia`): `agresivo`, `guardian`, `centinela`, `lanzador`, `neutral` (mercader). Ver `ia.js`.
- Poderes (`poderEnemigo`): chamán cura, sacerdotisa alza, ilusionista señuelos, ojo da visión, bruja envenena (se resiste con mente), señor de las bestias lobos, gólem embiste, hechicero invoca y lanza rayos (mentales).
- Prioridad de objetivos: `ia.js › objetivosDe`, `llamativo` (marcado, cebo del arco de hueso para no muertos, provocar…).

---

## 11. Multijugador y guardado

- **Salas** (`red.js`): `/salas/CODIGO` en Realtime Database. El estado viaja como **texto JSON** (Firebase borra arrays vacíos). Presencia con `onDisconnect`. Si el anfitrión se va, otro puede retomar (`ui.js › retomarComoAnfitrion`).
- Roles en `ui.js` (`app.modo`): `'local'`, `'anfitrion'`, `'invitado'`. El invitado envía acciones (`enviar`) y el anfitrión las aplica y publica (`publicar`).
- **Nube** (`nube.js`): partidas en Firestore con login de Google; acceso por lista blanca (o abierto desde el panel). Las reglas de Firebase **solo están en la consola**, no en el repo (contienen el correo del admin; no lo pongas en el código).
- Partidas locales: varias en `criptas_partidas`; exportar/importar JSON (`exportarPartida`, `importarPartida`). Al importar, los héroes se reasignan al `miId` del dispositivo.

---

## 12. Interfaz y presentación

- Pantallas: `mostrar(id)` con `PANTALLAS`. Modales (`modal`), avisos (`toast`), carteles (`cartel`).
- Eventos → animaciones: `reproducir` recorre `estado.eventos` y llama a `animar(ev)` (tipos: `dados`, `mover`, `muerte`, `mensaje`, `turno`, `fase`, `nivel`, `hechizo`, `tirada`, `reaccion`, `hallazgo`, `fin`, `pantalla`…). Velocidad configurable (`VELOCIDADES`).
- «Emoción»: embestida, destello de golpe, temblor, partículas (chispas/sangre), cartel de crítico, caída con polvo, momento de jefe, salto al andar, fanfarria de nivel (en `render.js` y `render3d.js`).
- Sonido: sintetizado con WebAudio en `ui.js › sonar`, ambiente por zona (`sonarAmbiente`). No hay archivos de audio.
- Campamento (`pintarArmeria`): subpestañas héroe, equipo, tienda, banco, cargador. Tarjeta de personaje con desglose (`tarjetaHTML`, `desgloseHTML`).
- Reacciones: 12 sellos (`D.REACCIONES`) + automáticas (`D.REACCIONES_AUTO`), dibujados con `sello`/`colocarSellos`.
- Trucos de consola (solo anfitrión/local): `trucos.ayuda()`, `trucos.mover(50)`, `trucos.accion()`, `trucos.curar()`, `trucos.oro(500)`, `trucos.revelar()`, `trucos.hechizos()`.

---

## 13. Prototipos de la base (fuera del juego)

Páginas sueltas, **sin conexión con el estado del juego** todavía. Diseño completo en el documento «Criptas · Diseño del Barco de Tinta».

- `barco.html`: barco caminable en 3D sobre un mar de tinta (olas en shader con `onBeforeCompile`, `alturaOla` en JS para lo que flota). Personajes de papel dibujados en canvas, tripulación con rutas y frases, diálogos, sonido sintetizado, relámpagos, aviso de rendimiento → vista libro, pantalla completa. **Es la dirección elegida.**
- `base-oscura.html`: la base como grimorio ilustrado (vista ligera para móvil): páginas con escenas SVG por capas, luz de vela que sigue al dedo, página bloqueada que se dibuja al desbloquear.
- `zepelin.html`: versión zepelín (descartada por steampunk). `base.html`: primera versión en estilo infantil (descartada).

---

## 14. Convenciones y trampas

- **Nunca mutes el estado fuera de `motor.js`.** La UI solo envía acciones.
- Todo lo aleatorio usa `Math.random` (`rnd`, `d6`); las pruebas lo sustituyen por un stub para ser deterministas.
- Las reglas nuevas grandes van **solo en la Mazmorra Infinita** (`if (estado.aleatorio)`) para no romper el Modo Historia clásico.
- Efectos temporales: añade la clave a `TEMPORALES`, usa `durante(h, k, n)` (pone n+1 porque se descuenta al empezar el turno) y, si hace falta, un aviso en `finTemporal`.
- Texto para el jugador: `avisar` (mensaje + log), `log` (solo diario), `ev` (evento animado).
- Al tirar dados que no son de combate, el evento `tirada` acepta `titulo`/`resultado` para que el cartel diga lo correcto.
- Tras cambiar código: `python3 version.py` (rompe la caché del navegador) y comprobar en el navegador; GitHub Pages tarda ~1 minuto en publicar.
- Las pruebas automáticas (scripts Node `*.mjs` que importan `motor.js` y simulan partidas, y comprobaciones con Playwright) **no están en el repositorio**.
