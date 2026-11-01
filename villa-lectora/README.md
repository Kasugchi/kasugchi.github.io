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
