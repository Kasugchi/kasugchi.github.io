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
