// =============================================================
//  AVENTURA DE REFERENCIA · «La vuelta al mundo en 80 días» (Julio Verne, 1872)
//  Obra de dominio público. Los textos de aquí son resúmenes y escenas propias.
//
//  Los tramos se abren por HITOS de la historia, no por número de capítulo:
//  las ediciones adaptadas numeran distinto, pero todas pasan por los mismos
//  momentos. Cada tramo declara:
//    requiere  → el hito que la clase tiene que haber leído
//    sabe      → lo único que el tramo puede contar (contra destripes)
//  La vinculación curricular es un BORRADOR: competencias clave LOMLOE seguras;
//  competencia específica y criterio, a verificar con la normativa andaluza.
// =============================================================
const LENGUA = 'Lengua Castellana y Literatura', MATES = 'Matemáticas', CIUDADANIA = 'Lengua y valores (tutoría)';
const cur = (area, clave, que) => ({ area, clave, que, especifica: 'pendiente de verificar', criterio: 'pendiente de verificar' });

export default {
  id: 'vuelta-80', version: 1,
  titulo: 'La vuelta al mundo en 80 días', autor: 'Julio Verne', emoji: '🎈',
  etapa: 'Primaria', curso: '3.º a 5.º', lectura: 'Libro por capítulos (edición adaptada)',
  derechos: 'Obra de dominio público. Las escenas y resúmenes son propios. Comprobar la edición que usa la clase.',
  guia: { nombre: 'Picaporte', emoji: '🧳' },

  hitos: [
    { id: 'h1', texto: 'Fogg hace la apuesta y sale de Londres' },
    { id: 'h2', texto: 'Llegan a Suez y aparece el detective Fix' },
    { id: 'h3', texto: 'Cruzan la India y conocen a Aouda' },
    { id: 'h4', texto: 'Picaporte se pierde y se reencuentran en Yokohama' },
    { id: 'h5', texto: 'Cruzan Estados Unidos en tren' },
    { id: 'fin', texto: 'Hemos terminado el libro' }
  ],

  tramos: [
    {
      id: 't1', titulo: 'La apuesta', requiere: 'h1', lugar: 'Londres', emoji: '🎩',
      sabe: ['Phileas Fogg', 'Picaporte', 'el Reform Club', 'la apuesta', 'la salida de Londres'],
      resumen: 'Phileas Fogg, un caballero que lo hace todo a su hora, apostó en su club que daría la vuelta al mundo en ochenta días. Salió esa misma noche con su nuevo criado, Picaporte.',
      escena: 'Es de noche en el Reform Club. Los caballeros se ríen: nadie puede dar la vuelta al mundo tan deprisa. Phileas Fogg mira su reloj, muy tranquilo. Picaporte acaba de llegar a la casa… y ya tiene que hacer la maleta.',
      retos: [
        { tipo: 'comprension', texto: '¿Cuánto dinero apuesta Phileas Fogg?', ops: ['20.000 libras', '80 libras', '1.000 monedas de oro', 'Su casa entera'], buena: 0, pista: 'Buscadlo en el capítulo de la apuesta: es muchísimo dinero.', cur: cur(LENGUA, ['CCL'], 'Localizar información explícita') },
        { tipo: 'ordenar', texto: 'Ordenad lo que pasó esa noche.', items: ['Fogg juega a las cartas en el club', 'Hablan de un robo y de lo grande que es el mundo', 'Fogg apuesta que dará la vuelta en 80 días', 'Fogg y Picaporte salen hacia la estación'], pista: 'Empieza en el club, antes de que nadie hable de viajes.', cur: cur(LENGUA, ['CCL'], 'Ordenar la secuencia de un relato') },
        { tipo: 'votacion', texto: 'Para recordar la salida, ¿qué ponemos en el rincón de la clase?', ops: [['🕰️ Reloj de estación', 'Para no perder ni un minuto, como Fogg'], ['🧳 Maleta de viaje', 'La de Picaporte, hecha a toda prisa'], ['🎟️ Billete de tren', 'El primero de muchos']], tercera: ['🗺️ Un mapa con las dos ideas', 'Olivia propone un mapa donde quepa todo'], mejora: true, cur: cur(CIUDADANIA, ['CPSAA', 'CC'], 'Participar en decisiones colectivas') }
      ],
      epilogo: 'En el rincón de la clase ha aparecido algo nuevo. Picaporte lo mira y suspira: «Si mi señor supiera que me he dejado la estufa de gas encendida…».'
    },
    {
      id: 't2', titulo: 'El detective Fix', requiere: 'h2', lugar: 'Suez', emoji: '🕵️',
      sabe: ['Suez', 'el detective Fix', 'que Fix cree que Fogg es un ladrón', 'el barco', 'Picaporte charla con Fix'],
      resumen: 'En Suez apareció el detective Fix. Cree que Fogg es el ladrón de un banco y quiere detenerlo. Picaporte, sin saberlo, le cuenta cosas de su señor.',
      escena: 'El puerto de Suez está lleno de barcos y de gente. Un hombre con sombrero mira a todos los viajeros con lupa. Se llama Fix, es detective… y está seguro de que Phileas Fogg es un ladrón.',
      retos: [
        { tipo: 'libro', texto: 'Con el libro abierto: ¿de qué sospecha Fix?', ops: ['De que Fogg robó un banco', 'De que Fogg es un pirata', 'De que Picaporte es un espía', 'De que el barco es robado'], buena: 0, pista: 'Buscad la parte en la que Fix lee la descripción del ladrón.', cur: cur(LENGUA, ['CCL'], 'Localizar información en el texto') },
        { tipo: 'debate', texto: 'Fix sospecha de Fogg, pero no tiene pruebas. ¿Está bien seguir a alguien y contar a todos que es un ladrón sin pruebas?', perspectivas: [['🕵️ Fix', '«Es mi trabajo. Si me equivoco, no pasa nada.»'], ['🧳 Picaporte', '«Mi señor es raro, pero es honrado. Me fío de él.»'], ['🦉 Olivia', '«Sospechar no es lo mismo que saber. ¿Cómo se sentiría Fogg?»']], ops: [['Primero hay que buscar pruebas', 'Fix tendrá que investigar más antes de acusar.'], ['Hay que preguntarle a Fogg directamente', 'Hablar claro puede evitar malentendidos.'], ['Fix tiene derecho a sospechar', 'Sospechar es parte de su trabajo; acusar es otra cosa.']], cur: cur(CIUDADANIA, ['CC', 'CCL'], 'Argumentar y respetar otras opiniones') },
        { tipo: 'votacion', texto: '¿Qué ponemos en el rincón para recordar Suez?', ops: [['⚓ Un ancla', 'Del puerto de Suez'], ['🔍 Una lupa', 'Como la del detective Fix'], ['⛵ Un barquito', 'Como los del canal']], tercera: ['🧭 Una brújula', 'Olivia propone algo que sirva a todos los viajeros'], mejora: true, cur: cur(CIUDADANIA, ['CPSAA', 'CC'], 'Participar en decisiones colectivas') }
      ],
      epilogo: 'Esa tarde, Tomás el conserje anda mirando a todo el mundo con los ojos entornados. «Estoy practicando para detective», dice. No se le da muy bien.'
    },
    {
      id: 't3', titulo: 'A través de la India', requiere: 'h3', lugar: 'India', emoji: '🐘',
      sabe: ['Bombay', 'la vía del tren sin terminar', 'el elefante', 'Aouda', 'el rescate de Aouda', 'sir Francis Cromarty'],
      resumen: 'En la India la vía del tren estaba sin terminar. Compraron un elefante para cruzar la selva y, por el camino, ayudaron a Aouda, una joven que estaba en peligro. Ella sigue el viaje con ellos.',
      escena: 'El tren se para en medio de la selva: ¡la vía no está terminada! Fogg no se altera. Si no hay tren, habrá elefante. Y en el camino, alguien va a necesitar su ayuda.',
      retos: [
        { tipo: 'ordenar', texto: 'Ordenad lo que pasó en la India.', items: ['El tren se para: la vía está sin terminar', 'Fogg compra un elefante', 'Encuentran a Aouda en peligro', 'Aouda sigue el viaje con ellos'], pista: 'Primero falla el tren; sin transporte no pueden seguir.', cur: cur(LENGUA, ['CCL'], 'Ordenar la secuencia de un relato') },
        { tipo: 'convivencia', texto: 'Llega a Villa Lectora una carta de Picaporte: en el pueblo alguien se ha burlado de su acento francés y de cómo pronuncia las palabras.', mensaje: 'Esto no se vota: burlarse de cómo habla alguien le hace daño, venga de donde venga.', preguntas: ['¿Cómo creéis que se ha sentido Picaporte?', '¿Qué podemos hacer cuando vemos que se burlan de alguien?', '¿Conocéis palabras de otros idiomas que nos gusten?'], cur: cur(CIUDADANIA, ['CC', 'CPSAA'], 'Respeto a la diversidad y convivencia') },
        { tipo: 'votacion', texto: '¿Qué ponemos en el rincón para recordar la India?', ops: [['🐘 Un elefante de madera', 'Como Kiuni, el que les llevó'], ['🌺 Flores de colores', 'De los jardines de Bombay'], ['🚂 Un trenecito', 'El que no pudo seguir']], tercera: ['🪁 Una cometa', 'Olivia propone algo alegre para todos'], mejora: true, cur: cur(CIUDADANIA, ['CPSAA', 'CC'], 'Participar en decisiones colectivas') }
      ],
      epilogo: 'Rosa ha preparado un arroz con especias «en honor a los viajeros». Huele a toda la plaza.'
    },
    {
      id: 't4', titulo: 'Perdidos en el mar de China', requiere: 'h4', lugar: 'Hong Kong y Yokohama', emoji: '🎪',
      sabe: ['Hong Kong', 'Fix engaña a Picaporte', 'Picaporte se separa de Fogg', 'Yokohama', 'el circo', 'el reencuentro'],
      resumen: 'En Hong Kong, Fix engañó a Picaporte para que no avisara a Fogg y se separaron. Picaporte llegó solo a Yokohama, trabajó en un circo y allí, por fin, se reencontró con su señor.',
      escena: 'Picaporte está solo en Yokohama, sin dinero y lejos de todos. Encuentra trabajo en un circo, haciendo de nariz larga en una torre humana… ¡y entre el público hay alguien conocido!',
      retos: [
        { tipo: 'mates', texto: 'El barco recorre 300 millas cada día y quedan 1.500 millas hasta Yokohama. ¿Cuántos días faltan?', ops: ['5 días', '3 días', '15 días', '50 días'], buena: 0, prisa: 45, pista: 'Repartid 1.500 en trozos de 300: ¿cuántos caben?', cur: cur(MATES, ['STEM'], 'Resolver problemas con división') },
        { tipo: 'turnos', texto: 'Leed en voz alta el momento en que Picaporte y Fogg se reencuentran en el circo.', apoyo: 'Las demás mesas escuchan y, al acabar, dicen qué sintió Picaporte.', cur: cur(LENGUA, ['CCL'], 'Lectura expresiva en voz alta') },
        { tipo: 'votacion', texto: '¿Qué ponemos en el rincón para recordar Japón?', ops: [['🎪 Una carpa de circo', 'Donde se reencontraron'], ['🏮 Un farolillo', 'De las calles de Yokohama'], ['🌸 Un cerezo', 'Como los de Japón']], tercera: ['🤝 Dos manos', 'Olivia propone recordar el reencuentro'], mejora: true, cur: cur(CIUDADANIA, ['CPSAA', 'CC'], 'Participar en decisiones colectivas') }
      ],
      epilogo: 'Ha llegado una postal de Picaporte desde Yokohama: «¡Nunca más me separo de mi señor!». Olivia la ha colgado en el tablón.'
    },
    {
      id: 't5', titulo: 'El tren de América', requiere: 'h5', lugar: 'Estados Unidos', emoji: '🚂',
      sabe: ['San Francisco', 'el tren hacia Nueva York', 'el ataque al tren', 'Picaporte capturado', 'Fogg va a rescatarlo', 'el retraso'],
      resumen: 'Cruzaron Estados Unidos en tren, de San Francisco a Nueva York. Atacaron el tren y se llevaron a Picaporte. Fogg fue a rescatarlo aunque eso le hiciera perder tiempo y quizá la apuesta.',
      escena: 'El tren cruza las praderas a toda velocidad. De pronto, gritos y confusión: atacan el tren. Cuando todo se calma, falta alguien. Picaporte no está.',
      retos: [
        { tipo: 'comprension', texto: '¿En qué viajan de San Francisco a Nueva York?', ops: ['En tren', 'En barco', 'En globo', 'En elefante'], buena: 0, pista: 'Cruzan todo el país por tierra.', cur: cur(LENGUA, ['CCL'], 'Localizar información explícita') },
        { tipo: 'debate', texto: 'Fogg va a rescatar a Picaporte aunque pueda perder la apuesta. ¿Qué es más importante?', perspectivas: [['🎩 Fogg', '«Un caballero cumple sus apuestas… pero no abandona a nadie.»'], ['🕵️ Fix', '«Si pierde tiempo, pierde la apuesta. Así de simple.»'], ['🥘 Rosa', '«Lo que se hace por un amigo nunca es tiempo perdido.»']], ops: [['Las personas van primero', 'La apuesta puede esperar; Picaporte, no.'], ['Hay que buscar la manera de hacer las dos cosas', 'Rescatarle y luego recuperar el tiempo.'], ['Es una decisión difícil', 'Entendemos a Fogg y también el peligro de perder.']], cur: cur(CIUDADANIA, ['CC', 'CCL'], 'Argumentar y respetar otras opiniones') },
        { tipo: 'votacion', texto: '¿Qué ponemos en el rincón para recordar América?', ops: [['🚂 Una locomotora', 'La del tren a Nueva York'], ['🌵 Un cactus', 'De las praderas y desiertos'], ['⛵ Un velero', 'El trineo con vela que usaron sobre la nieve']], tercera: ['⭐ Una estrella', 'Olivia propone una estrella para Picaporte'], mejora: true, cur: cur(CIUDADANIA, ['CPSAA', 'CC'], 'Participar en decisiones colectivas') }
      ],
      epilogo: 'Tomás jura que esta tarde ha oído el silbato de un tren a lo lejos. En Villa Lectora no hay tren. Todavía.'
    },
    {
      id: 't6', titulo: 'El día ganado', requiere: 'fin', final: true, lugar: 'De vuelta a Londres', emoji: '🌍',
      sabe: ['todo el libro'],
      resumen: 'Fogg volvió a Londres creyendo que había perdido la apuesta por unos minutos. Pero, al viajar siempre hacia el este, había ganado un día sin darse cuenta. Llegó a tiempo al club… y además se casó con Aouda.',
      escena: 'Londres, por fin. Fogg está seguro de que ha perdido: llega tarde, o eso cree. Pero Picaporte acaba de descubrir algo increíble en el calendario.',
      retos: [
        { tipo: 'mates', texto: 'Viajando hacia el este, cada vez que cambias de huso horario adelantas el reloj una hora. Hay 24 husos. Al dar la vuelta entera, ¿cuánto tiempo ganas?', ops: ['Un día', 'Una hora', 'Una semana', 'Nada'], buena: 0, pista: '24 horas son exactamente…', cur: cur(MATES, ['STEM'], 'Medida del tiempo y razonamiento') },
        { tipo: 'comprension', texto: '¿Por qué creía Fogg que había perdido la apuesta?', ops: ['No se dio cuenta de que había ganado un día', 'Le robaron el dinero', 'Se le rompió el reloj', 'Volvió en un barco equivocado'], buena: 0, pista: 'Pensad en lo que acabáis de calcular.', cur: cur(LENGUA, ['CCL'], 'Inferir causas a partir del texto') }
      ],
      epilogo: '¡Habéis terminado el libro! En el pueblo se ha restaurado la vieja estación de los viajeros. El sombrero de Fogg ya está en la vitrina de la biblioteca. Y para Olivia ha llegado una carta con un sello de Yokohama… que no se puede abrir hasta el próximo libro.'
    }
  ],

  huellas: {
    lugar: { id: 'estacion', nombre: 'La estación de los viajeros', emoji: '🎈' },
    recuerdo: { emoji: '🎩', nombre: 'El sombrero de Fogg' },
    hilo: { emoji: '✉️', nombre: 'Una carta con sello de Yokohama', texto: 'Una carta para Olivia que se abrirá con la próxima aventura.' },
    explorador: 'chistera'
  }
};
