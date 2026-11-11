# Guía para agentes (Codex, Antigravity, Claude…)

Repositorio de las apps personales de Carlos, servido con **GitHub Pages** en `kasugchi.github.io`.
Todo es HTML + JavaScript **sin compilar** (sin npm, sin bundler). Lo que se sube a `main` se publica tal cual en la web en un minuto.

## Reglas de oro

1. **Nunca trabajes en `main`.** Crea una rama (`git checkout -b <agente>-<tarea>`) y deja que Carlos la revise. `main` es lo que usa su familia.
2. **Textos en español de España**, tono cercano y con humor. Nada de inglés en lo que ve el jugador.
3. **Cero secretos en el repo** (es público): ni correos, ni contraseñas, ni reglas de Firebase. Las reglas viven solo en la consola de Firebase.
4. **No uses recursos con derechos** (Hasbro/HeroQuest, Disney, personajes modernos con copyright). Clásicos de dominio público sí, dibujados a nuestra manera.
5. **Cambios pequeños y acotados.** No reestructures archivos grandes, no renombres funciones existentes, no reformatees código que no tocas.
6. **Antes de subir algo de `criptas/`**, ejecuta `python3 criptas/version.py` (ver «Caché» abajo).
7. Si no estás seguro de algo, **pregunta** en vez de suponer.

## Estructura

| Carpeta | Qué es |
|---|---|
| `index.html` | Portada con tarjetas de todas las apps (lista `APPS` al final del archivo). |
| `criptas/` | **Criptas de Velmor**: el juego principal (ver abajo). |
| `cole/` | Juegos educativos de colegio. `cole/index.html` es el índice. `cole/vuelta/`: La vuelta al mundo en 80 días (8 años en `index.html`, infantil en `infantil.html`). `cole/turin/`: tres juegos sobre cuentos de Adela Turín (`arturo`, `catastrofe`, `juntos`), con `estilo.css` y `comun.js` compartidos. `vuelta/` solo redirige a `cole/vuelta/`. |
| `villa-lectora/` | **Villa Lectora**: proyecto escolar independiente (colegio 3D, biblioteca de cuentos, paneles de profe y admin de demo). No depende de Criptas; solo enlaza a `cole/turin/`. |
| `rutas/`, `biblioteca/`, `estanteria/` | Otras apps independientes. No tocar salvo que se pida. |

## Criptas de Velmor (`criptas/`)

Juego de mazmorras por turnos estilo juego de mesa, multijugador con código de sala, para jugar en familia. Tiene una tortuga gigante (Morrandar) que lleva encima un pueblo.

### Páginas

- `index.html` + `js/ui.js`: menú del juego, mundos, partidas, la mazmorra (motor en `js/motor.js`, dibujo en `js/render*.js`, `js/tablero.js`).
- `tortuga.html`: Morrandar en 3D (la base). Sala multijugador con el botón 👥.
- `pueblo.html`: **el pueblo** estilo Animal Crossing (three.js). Es un archivo grande (~2.500 líneas) con todo dentro: terreno, casas, vecinos (`VEC`), diálogos, reloj propio, cantina, tu casa con muebles (`MUEBLES`), libreta (menú ☰), sala en vivo y pueblo compartido.
- `js/paradas.js`: **las paradas de Morrandar** (claro, pantano…). `claro.html?p=<id>` monta el escenario de cada parada (paisaje, guía, objetos, monstruos y cripta) y `cripta.html?p=<id>` su cripta. Para añadir una parada, copia un bloque de `PARADAS`. En el pueblo, el atril del mirador (mapa de viaje) decide adónde va Morrandar (`EP.parada`) y la escala de la pasarela baja allí.
- `claro.html` + `js/claro*.js`: **prototipo del modo aventura** («El claro de los huesos»): mundo libre en 3D estilo cuento, personajes hechos en código, y combate por turnos que brota del suelo (tablero, dados 3D). Independiente del pueblo.
- `cabana.html`: la cabaña de trofeos. `reunion.html`: la sala (lobby ligero). `duelo.html`: duelo de insultos. `panel.html`: panel de administración. `pruebas.html`: índice de páginas de prueba.

### Módulos clave (`criptas/js/`)

- `acceso.js`: cerrojo. Toda página jugable lo importa primero; sin sesión con permiso, redirige al menú. **No quitarlo.**
- `nube.js`: Firebase (Auth + Firestore). Guardado de fichas, actividad, pueblo compartido, cartas.
- `reunion.js`: salas multijugador (Firebase Realtime Database) y su panel.
- `viajero.js`: la ficha del jugador por mundo (héroes, banco, cabaña, diario, `ficha.pueblo`).
- `vendor/`: three.js r160 vendorizado. **No actualizar.**

### Modo aventura (claro, paradas, criptas 3D)

- **Héroe de aventura** (`js/claro-heroes.js`): uno por jugador, se guarda en local y en la nube (`usuarios/{uid}/viajero/aventura`). Ahí están `RAZAS` (cada una con una pasiva y una racial activa), `CLASES`, `LOAS` del trol, `FORJA`, materiales y botín, y las mejoras al subir de nivel (`OPCIONES_MEJORA` + `MEJORAS_CLASE`).
- **Varios héroes por cuenta** (hasta 4, como personajes del WoW): cada uno con su nivel, oro, forja y criptas. El activo se guarda como siempre y lleva a los demás en `_otros` (`listaHeroes`, `cambiarDeHeroe`, `heroeNuevo` en `claro-heroes.js`); se cambia desde la portada del claro («Cambiar de héroe») o ☰ → Tus héroes. A un héroe con camino hecho no se le cambia la raza; la **clase sí, como las armas del Monster Hunter** (`cambiarClase`): cada clase lleva su nivel, experiencia, mejoras y arma (guardadas en `clases`), y la armadura, el oro, los materiales y los títulos son del héroe.
- **Combate** (`js/claro-combate.js`): por turnos sobre casillas, dados 3D (`js/claro-dados.js`, se pintan siempre por encima). Las raciales activas son un botón, una vez por pelea, sin gastar acción.
- **Criptas** (`cripta.html` + `js/cripta.js`): salen del generador del juego de mesa (`js/procedural.js`) pero recortadas para un héroe (`aSolas` en `js/claro-cripta.js`: uno por sala y pasillo, el jefe con un escolta, como mucho tres por pelea, +1 de cuerpo al ganar cada pelea).
- **Bruna**: la herrera presa en las Celdas de Hierro (parada `celdas`). Al rescatarla (`EP.bruna`), la forja grande del pueblo se enciende y hace el último nivel de mejora; Brasa, su aprendiz, hace el resto.
- **Juntos**: en el claro y en la cripta se ven los de la sala (`js/cripta-juntos.js`): todo va en la ficha de cada uno dentro de `reunion/gente`, sin rutas nuevas en la base de datos. Quien baja a una cripta deja `baja` y los demás pueden seguirle. Los combates aún son de cada uno.
- **Botón ☰** (`js/menu-aventura.js`): la libreta común de la aventura (sala, sonido, pantalla completa con `js/pantalla.js`, controles). El pueblo tiene la suya con las mismas opciones.
- **Portada**: `js/sitios.js` pinta en el menú las tarjetas de cada sitio (pueblo, tortuga, paradas, cabaña…).

### Dificultad (`js/dificultad.js`)

Cada parada tiene `fuerza` (claro 1; pantano, cine e isla 2; minas 3) y un nivel recomendado que se enseña en la portada y en el atril. Los bichos se refuerzan según la zona (`reforzar`). Al bajar a una cripta se elige **normal** o **heroica** (`?modo=heroica&rango=N`): la heroica se ajusta al nivel del héroe, y cada rango (I a V, se abren de uno en uno en `heroicas` del héroe) la endurece más; da más experiencia, oro, botín, trofeo y **esencia heroica**, que piden el +4 y el +5 de la forja de Bruna. El rango III está pensado para ir en grupo. Los encargos del tablón usan su propio nivel. En compañía, cada héroe que entra en una pelea da vida extra a los bichos. La bola de fuego y la torreta crecen con el nivel (`hab.pl`).

### Equipo (`js/equipo.js`)

A lo Monster Hunter: el nivel se congela en el 8 y desde ahí te hace fuerte el equipo. Casco, peto y botas de cada zona (`JUEGOS`: de momento hueso del claro y pirata de la isla); cada pieza da una habilidad (no más dados) y se mejora hasta +3 (el +3, con Bruna y esencia). Con las 3 de un juego, su extra. Se hacen en la forja del pueblo («Equipo de las zonas») con el material común de la zona (los bichos pequeños, la mitad de las veces) y el raro (los jefes; en heroica, siempre): `botinDe(tipo, jefe, { zona, heroica })`. Lo que tienes va en `HEROE.piezas`, lo que llevas en `HEROE.equipo`; `efectosEquipo` lo suma y el combate lo lee en `estado.eq`.

### El Ring de Chatarra (`ring.html` + `js/ring.js`, `js/robots.js`)

Robots a lo «medabots», hechos a nuestra manera: núcleo (su alma, con forma de bicho, sube de nivel) y cuatro piezas (cabeza, brazos, piernas) con vida y acción. Pelea por turnos con dados apuntando a piezas; si te rompen la cabeza, pierdes. Liga de cinco vecinos (`RIVALES`); al ganar te llevas una de sus piezas. Se guarda en el héroe de aventura (`robot`). Se llega desde la cantina (Rufo o el cartel del ring) y desde la portada.

### Mercenarios (`js/mercenarios.js`)

Se alquilan a Rufo (cantina) con el oro del héroe de aventura: `HEROE.mercenario` guarda cuál, y se gasta al bajar a la siguiente cripta. Allí te sigue y entra en cada pelea como aliado con cabeza propia (`turnoMercenario` en el combate): la curandera cura al que baje de la mitad; el escudero provoca a los bichos de al lado. Sus números crecen con tu nivel.

### Equilibrio (`herramientas/simulacion.py`)

Simula miles de criptas enteras con las reglas del combate y saca el ranking raza × clase. **Si tocas números de combate** (clases, razas, loas, monstruos), cópialos también allí y vuelve a pasarlo: `python3 criptas/herramientas/simulacion.py`. Objetivo: todas las combinaciones entre un 75 % y un 95 % a nivel 3. Con `simulacion.py zonas` se mide cada clase a nivel 3, 5 y 8 contra cada zona y en heroica.

### La gramola de Rufo (`js/midi.js` y `midi/`)

Máquina de discos de la cantina que toca MIDIs sintetizados con WebAudio. Un disco es un JSON (`midi/*.json`) listado en `midi/catalogo.json`; los que son solo de Carlos van en `midi/local-*.json` + `midi/catalogo-local.json` (en `.gitignore`: **el repo y la web son públicos, no subas música con derechos**). Para convertir un `.mid`: `python3 criptas/midi/convertir.py cancion.mid` (añade `--publico` solo si es libre de derechos).

### Datos del pueblo

El estado del pueblo vive en `ficha.pueblo` (variable `EP` en `pueblo.html`) y se guarda con `guardarPueblo()`. Al añadir campos nuevos: inicialízalos en la creación de `EP` y, si importan entre dispositivos, júntalos en `juntarPueblo()`.

### Caché (`version.py`)

Las páginas cargan los módulos con `?v=<fecha>` en un importmap para que los móviles no usen copias viejas. **Si cambias cualquier `.js` de `criptas/js/`, ejecuta `python3 criptas/version.py` antes del commit.** Si creas una página nueva que use los módulos, añádela a la lista de `version.py`.

### Estilo de código

- ES modules nativos, sin dependencias nuevas. Nombres y comentarios **en español**.
- Funciones cortas, comentarios que expliquen el *porqué*.
- Interfaz del pueblo: redondita, crema (`#fff8e6`), sombras suaves, letra Nunito. Que funcione en **móvil** (táctil) y en ordenador (WASD/E).
- Guarda en `localStorage` siempre con `try/catch`.

### Cómo probar

Sirve el repo con `python3 -m http.server 8765` desde la raíz y abre `http://localhost:8765/criptas/pueblo.html?hora=16`
(parámetros útiles: `?hora=N` fija la hora, `?rapido=20` acelera el reloj). Sin sesión de Google, el cerrojo te manda al menú: para probar en local, lo más fácil es iniciar sesión en el menú con una cuenta con acceso.
Abre la consola del navegador: no debe haber errores rojos. `window.pueblo` expone el estado para depurar.

## Antes de terminar una tarea

- [ ] Estás en una rama, no en `main`.
- [ ] Sin errores en la consola, probado en vista móvil.
- [ ] `version.py` ejecutado si tocaste `criptas/js/`.
- [ ] Comprobado con `node --input-type=module --check < archivo.js` (un error de sintaxis deja la página en blanco).
- [ ] Un commit con un mensaje claro en español que diga qué cambia.
