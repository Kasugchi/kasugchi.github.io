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
| `vuelta/` | La vuelta al mundo en 80 días: juego educativo (8 años en `index.html`, infantil en `infantil.html`). Un solo archivo cada uno. |
| `rutas/`, `biblioteca/`, `estanteria/` | Otras apps independientes. No tocar salvo que se pida. |

## Criptas de Velmor (`criptas/`)

Juego de mazmorras por turnos estilo juego de mesa, multijugador con código de sala, para jugar en familia. Tiene una tortuga gigante (Morrandar) que lleva encima un pueblo.

### Páginas

- `index.html` + `js/ui.js`: menú del juego, mundos, partidas, la mazmorra (motor en `js/motor.js`, dibujo en `js/render*.js`, `js/tablero.js`).
- `tortuga.html`: Morrandar en 3D (la base). Sala multijugador con el botón 👥.
- `pueblo.html`: **el pueblo** estilo Animal Crossing (three.js). Es un archivo grande (~2.500 líneas) con todo dentro: terreno, casas, vecinos (`VEC`), diálogos, reloj propio, cantina, tu casa con muebles (`MUEBLES`), libreta (menú ☰), sala en vivo y pueblo compartido.
- `cabana.html`: la cabaña de trofeos. `reunion.html`: la sala (lobby ligero). `duelo.html`: duelo de insultos. `panel.html`: panel de administración. `pruebas.html`: índice de páginas de prueba.

### Módulos clave (`criptas/js/`)

- `acceso.js`: cerrojo. Toda página jugable lo importa primero; sin sesión con permiso, redirige al menú. **No quitarlo.**
- `nube.js`: Firebase (Auth + Firestore). Guardado de fichas, actividad, pueblo compartido, cartas.
- `reunion.js`: salas multijugador (Firebase Realtime Database) y su panel.
- `viajero.js`: la ficha del jugador por mundo (héroes, banco, cabaña, diario, `ficha.pueblo`).
- `vendor/`: three.js r160 vendorizado. **No actualizar.**

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
- [ ] Un commit con un mensaje claro en español que diga qué cambia.
