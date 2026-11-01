# Villa Lectora · Primera versión explorable

Proyecto independiente para colocar en la raíz de `kasugchi.github.io` como `villa-lectora/`.

## Inicio

Sube la carpeta completa a GitHub Pages y visita `https://kasugchi.github.io/villa-lectora/`.
Para probar en un ordenador sin publicarla, ejecuta desde la carpeta del repositorio `python -m http.server 8000` y abre `http://localhost:8000/villa-lectora/`. Abrir `index.html` directamente con `file://` puede bloquear los módulos JavaScript.

## Controles

WASD/flechas: caminar; arrastrar: rotar cámara; rueda: zoom; E: interactuar. En móvil hay botones táctiles.

## Incluye

Colegio exterior 3D, avatar caminante, seis edificios, tres NPC, fuente, huerto, cinco retos de lectura, biblioteca, rincón de recompensas y progreso guardado localmente.

## Límites actuales

Primera versión jugable, no producto escolar terminado: los interiores se presentan mediante paneles, los avatares son geométricos, las lecturas son adaptaciones didácticas breves, no hay cuentas, profesores, informes, multijugador ni decoración libre. El guardado es local al dispositivo/navegador; no contiene datos de menores ni servicios externos.

## Procedencia

Motor Three.js local copiado del repositorio de Criptas de Velmor, con su archivo de licencia. Código de Villa Lectora independiente; **no se modifica** `criptas/`, `cole/` ni otras carpetas.


## V2: gameplay educativo y panel docente
- Infantil: escuchar cuentos con voz del dispositivo, colores, secuencias y contar.
- Primaria: comprensión, vocabulario, lógica y secuencias.
- Panel docente desde el botón «Profesor»: desbloqueo de libros, estrellas, pistas, seguimiento e informe CSV.
- Tienda de cosméticos mediante estrellas; guardado local.

**Limitación importante:** el panel docente es una demostración local en el mismo navegador. No tiene autenticación, backend, sincronización entre dispositivos ni controles de acceso. No introducir datos personales reales de menores. La interacción profesor-móvil / alumno-otro-dispositivo requerirá backend, roles y medidas de privacidad antes de utilizarse en un centro.


## V3 · Acceso por roles y cuentos con libro físico

**Códigos de prueba (NO son contraseñas seguras):**
- Alumno: `LECTOR-2026`
- Profesor: `PROFE-2026`
- Administrador: `VILLA-ADMIN-2026`

La entrada separa tres interfaces. Alumno explora el mundo y juega; profesor administra desbloqueos, estrellas, pistas y exporta evidencias; admin accede a una pantalla de administración y controles docentes. **Limitación crítica:** los códigos están dentro del JavaScript público, por lo que cualquiera puede verlos. Solo sirven para probar la navegación y NO protegen los datos. Los cambios se guardan en el mismo navegador, no se transmiten entre móviles. Para usarlo en un centro hacen falta autenticación real, roles verificados por backend, aislamiento por clases y centro, protección de datos y sincronización.

Nuevas aventuras desbloqueables: Caperucita Roja, Los tres cerditos, Alicia en el país de las maravillas y La isla del tesoro. Cada una incluye actividades y una misión que requiere buscar, señalar o leer algo del libro físico. La confirmación de estas misiones es declarativa, no una comprobación automática. Las preguntas usan resúmenes originales breves; se debe revisar su correspondencia con la edición física utilizada.

La V3 no modifica ninguna carpeta ajena a `villa-lectora/`.


## Cambios V4
- Todos los roles pueden recorrer el colegio; el panel docente y el de administración se pueden cerrar para explorar.
- «Todavía no» en actividades con libro físico registra **pendiente**, no un error. El CSV lo distingue.
- Arturo y Clementina enlaza a `../cole/turin/arturo-aventura.html`, ya existente en el repositorio. Ese enlace requiere que `cole/` siga en su ubicación habitual.
- Más detalles de arquitectura y decoración 3D: tejas, molduras, farolas, flores, banderines y rocas.
- Los códigos siguen siendo de DEMOSTRACIÓN, no autenticación segura.


## V5 — pueblo y movimiento
- Mantén pulsado el suelo (ratón o dedo) para caminar hacia el punto señalado. Arrastra sin soltar para cambiar el destino; suelta para detener la orden.
- WASD sigue disponible en ordenador. Rueda del ratón controla el zoom. Botón de interacción cercano sigue disponible.
- Jardines, árboles de copa compuesta, maceteros, luces festivas, esculturas de libros y huerto ampliado.
- Conserva la separación de roles y las historias existentes. No hay sincronización entre dispositivos ni autenticación segura.


## V6 — Paneles renovados
- Profesor: cinco pestañas (Resumen, Biblioteca, Premios, Ayudas y Seguimiento), observaciones, mensaje al alumno, regalo/retirada de cosméticos, motivos para estrellas y exportación CSV.
- Admin: cuatro pestañas (Centro, Configuración, Roles e Historial), configuración de meta de lectura, copia JSON y reinicio local con doble confirmación.
- El historial de acciones y los ajustes se guardan en el mismo localStorage que el progreso.
- **Advertencia:** los códigos son de DEMOSTRACIÓN, visibles en el JavaScript. No hay seguridad real, clases múltiples, cuentas verificadas ni sincronización móvil. No introducir datos de menores.
- El profesor y el administrador pueden cerrar su panel y explorar el pueblo 3D.


## V7 — El colegio vivo (ambiente tipo Animal Crossing)
- **Hora real**: el colegio sigue el reloj del dispositivo (amanecer, día, atardecer y noche). Las farolas, ventanas y guirnaldas se encienden al anochecer; hay estrellas, luna y luciérnagas. Para probar otra hora: `?hora=21`.
- **Mundo curvo** hacia el horizonte y nubes que pasan; mariposas de día.
- **Personajes chibi** (cabeza grande, andan balanceándose). Olivia, Tomás y Rosa tienen **horario** (biblioteca, ronda, huerto, comedor, banco…), dicen cosas en voz alta y su **charla se acuerda de ti**: amistad con corazones, lo que llevas leído y lo que has ganado.
- **Mi rincón**: lo que ganas (tesoros y cosméticos) se **coloca de verdad** en el jardín de delante, en seis huecos.
- **Celebraciones del profe** (panel docente → Resumen): fuegos artificiales, suelta de globos y fiesta en el patio. Terminar «La vuelta al mundo» suelta globos.
- **Móvil sin «pulsa E»**: al acercarte sale un botón grande para tocar; tocar un personaje o una puerta te lleva hasta él y lo abre.
- Los edificios que tapan la cámara se ocultan.
- Todo el ambiente vive en `js/vida.js`; `main.js` solo lo llama.


## V9 — Modo clase y aventura de referencia
Sigue el *Documento Base de Diseño* (seis decisiones cerradas).
- **Un solo juego proyectado que dirige el profe.** Se entra como profesor/a (`PROFE-2026`) o administración (`VILLA-ADMIN-2026`). El alumnado no tiene cuenta.
- **Aventura de referencia: «La vuelta al mundo en 80 días»** (dominio público), en 6 tramos. Se abren por **hitos de la historia** («ya han llegado a Suez»), no por número de capítulo, para que sirva con cualquier edición adaptada. Cada tramo declara qué necesita haberse leído y qué puede contar (sin destripes). El último exige terminar el libro.
- **Sesión**: recuerdo → escena → retos → consecuencia → epílogo. Cuatro mandos siempre: pausar y debatir, pista, saltar y terminar (se retoma donde se dejó).
- **Retos**: comprensión, con el libro abierto, mates del cuento, ordenar, votación (con empate y tercera vía), debate (sin respuesta correcta), convivencia (no se vota) y por turnos de mesa (sin nombres; reparte turnos con justicia).
- **El pueblo crece leyendo**: cada tramo deja en el rincón de la clase lo que la clase vota; el libro terminado restaura la estación de los viajeros, deja el sombrero de Fogg en la vitrina, un hilo pendiente y una chistera al explorador de la clase. Repetir un tramo no duplica nada.
- **Los vecinos recuerdan** lo leído y lo votado; el arco de Olivia avanza solo con hitos de lectura (texto provisional hasta la biblia narrativa).
- **Panel docente**: Jugar (hasta dónde ha leído la clase, tramos), Adaptar (texto grande, contraste, voz, temporizadores, menos opciones), Progreso (informe, situación de aprendizaje, CSV, observaciones) y La clase (mesas, libros sin aventura, interludios para la estantería).
- **Informe colectivo** con tres capas separadas (actividad, competencia trabajada, aprendizaje observado) y **ficha de situación de aprendizaje** imprimible. La competencia específica y el criterio están marcados como *pendiente de verificar* con la normativa andaluza.
- **Datos**: solo de la clase, en este navegador (prototipo). Ningún dato de alumnos.
- Código nuevo: `js/clase.js` (estado), `js/sesion.js` (la sesión), `js/panel.js`, `js/informe.js`, `js/aventuras/vuelta.js` (contenido). Las partes de la V6 pensadas para un alumno individual (estrellas, tienda, alias) quedan sin uso.
