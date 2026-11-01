// «La isla del tesoro» (Robert Louis Stevenson, 1883). Dominio público. Escenas y resúmenes propios.
import { cur, MATES, LOCALIZA, ORDENA, INFIERE, EN_VOZ, DEBATE, CONVIVE, votar } from './comun.js';

export default {
  id: 'isla', version: 1, titulo: 'La isla del tesoro', autor: 'Robert Louis Stevenson', emoji: '🏴‍☠️',
  etapa: 'Primaria', curso: '4.º a 6.º', lectura: 'Libro por capítulos (edición adaptada)',
  derechos: 'Obra de dominio público. Escenas y resúmenes propios. Comprobar la edición de la clase.',
  guia: { nombre: 'Jim Hawkins', emoji: '🧒' },
  hitos: [
    { id: 'h1', texto: 'Billy Bones llega a la posada y aparece el mapa' },
    { id: 'h2', texto: 'Zarpan en la Hispaniola con Long John Silver' },
    { id: 'h3', texto: 'Jim descubre el plan del motín' },
    { id: 'h4', texto: 'En la isla, Jim conoce a Ben Gunn' },
    { id: 'fin', texto: 'Hemos terminado el libro' }
  ],
  tramos: [
    {
      id: 't1', titulo: 'El mapa del capitán', requiere: 'h1', lugar: 'La posada Almirante Benbow', emoji: '🗺️',
      sabe: ['Jim', 'la posada', 'Billy Bones', 'el cofre', 'el mapa'],
      resumen: 'Un viejo marinero, Billy Bones, se instaló en la posada de la familia de Jim. Tenía miedo de otros piratas. Cuando murió, Jim abrió su cofre y encontró un mapa de una isla con un tesoro.',
      escena: 'Hace frío en la posada. El viejo capitán canta canciones de piratas y mira el camino todo el rato, como si esperara a alguien. Dentro de su cofre hay un secreto.',
      retos: [
        { tipo: 'comprension', texto: '¿Cómo se llama la posada de la familia de Jim?', ops: ['Almirante Benbow', 'La Sirena Azul', 'El Loro Dorado', 'La Isla Perdida'], buena: 0, pista: 'Está en las primeras páginas: tiene nombre de almirante.', cur: LOCALIZA },
        { tipo: 'ordenar', texto: 'Ordenad lo que pasó en la posada.', items: ['Billy Bones llega a la posada', 'Un pirata llamado Perro Negro viene a buscarle', 'Billy Bones muere', 'Jim abre el cofre y encuentra el mapa'], pista: 'Empieza por la llegada del viejo marinero.', cur: ORDENA },
        votar('Para recordar la posada, ¿qué ponemos en el rincón de la clase?', [['🗺️ Un mapa antiguo', 'Con una cruz roja, claro'], ['🪙 Una moneda de oro', 'Por si hay más'], ['🏮 El farol de la posada', 'Para las noches de tormenta']], ['⚓ Un ancla', 'Olivia propone algo marinero para todos'])
      ],
      epilogo: 'Tomás ha encontrado una botella en el patio. Dentro no hay ningún mensaje. Lleva toda la tarde mirándola, por si acaso.'
    },
    {
      id: 't2', titulo: 'A bordo de la Hispaniola', requiere: 'h2', lugar: 'El puerto de Bristol', emoji: '⛵',
      sabe: ['la Hispaniola', 'el capitán Smollett', 'Long John Silver', 'el loro', 'la tripulación'],
      resumen: 'Jim, el doctor Livesey y el caballero Trelawney prepararon un barco, la Hispaniola. El cocinero, Long John Silver, era simpático con Jim, pero el capitán Smollett desconfiaba de la tripulación.',
      escena: 'La Hispaniola se mece en el puerto. Un cocinero con una sola pierna y una muleta sonríe a todos. En su hombro, un loro grita palabras raras.',
      retos: [
        { tipo: 'libro', texto: 'Con el libro abierto: ¿qué animal lleva Long John Silver en el hombro?', ops: ['Un loro', 'Un mono', 'Un gato', 'Una gaviota'], buena: 0, pista: 'Buscad cuando Jim baja a la cocina del barco.', cur: LOCALIZA },
        { tipo: 'debate', texto: 'Silver es muy amable con Jim, pero el capitán desconfía de la tripulación. ¿Hay que fiarse de alguien solo porque es simpático?', perspectivas: [['🧒 Jim', '«Silver me trata bien. ¿Por qué iba a ser malo?»'], ['🎖️ El capitán', '«Me fío de lo que la gente hace, no de lo que dice.»'], ['🦉 Olivia', '«Ser simpático y ser de fiar no siempre van juntos. ¿Cómo lo sabemos?»']], ops: [['Hay que conocer a la gente con el tiempo', 'Lo que hacen nos dice más que lo que dicen.'], ['Si alguien es amable, merece confianza', 'Desconfiar de todo el mundo también hace daño.'], ['Depende de lo que esté en juego', 'Con cosas importantes, mejor ir con cuidado.']], cur: DEBATE },
        votar('¿Qué ponemos en el rincón para recordar el barco?', [['🦜 Un loro', 'Como el de Silver'], ['⛵ Un velero', 'La Hispaniola en pequeño'], ['🧭 Una brújula', 'Para no perder el rumbo']], ['🎒 Un petate de marinero', 'Olivia propone algo de toda la tripulación'])
      ],
      epilogo: 'Rosa ha hecho galletas marineras. Están duras como piedras. «Así las comían en los barcos», dice muy orgullosa.'
    },
    {
      id: 't3', titulo: 'El barril de manzanas', requiere: 'h3', lugar: 'En alta mar', emoji: '🍎',
      sabe: ['el barril de manzanas', 'el plan del motín', 'Silver es el jefe de los amotinados', 'Jim avisa al capitán', 'la isla a la vista'],
      resumen: 'Escondido en un barril de manzanas, Jim oyó a Silver planear un motín para quedarse con el tesoro. Avisó al capitán y a sus amigos justo cuando aparecía la isla.',
      escena: 'Es de noche en el barco. Jim se mete en un barril de manzanas para coger una… y entonces oye voces. Es Silver, y lo que dice no tiene nada de simpático.',
      retos: [
        { tipo: 'comprension', texto: '¿Dónde estaba escondido Jim cuando oyó el plan del motín?', ops: ['Dentro de un barril de manzanas', 'Debajo de la cama del capitán', 'Subido al mástil', 'En la cocina'], buena: 0, pista: 'Es un sitio que huele a fruta.', cur: LOCALIZA },
        { tipo: 'convivencia', texto: 'En el patio de Villa Lectora, un grupo ha hecho su propio «motín»: dicen que quien no se une a ellos no puede jugar con nadie.', mensaje: 'Esto no se vota: dejar a alguien fuera a propósito para que se quede solo le hace daño.', preguntas: ['¿Cómo se siente quien se queda fuera?', '¿Qué podemos hacer si nos piden que dejemos a alguien fuera?', '¿Cómo podemos hacer que todos tengan con quién jugar?'], cur: CONVIVE },
        votar('¿Qué ponemos en el rincón para recordar el aviso de Jim?', [['🍎 Un barril de manzanas', 'El mejor escondite del barco'], ['🔭 Un catalejo', 'Para ver la isla a lo lejos'], ['🏴 Una bandera', 'La del barco']], ['🔔 Una campana', 'Olivia propone algo para dar avisos'])
      ],
      epilogo: 'Ha aparecido un catalejo en el tablón del cole. Nadie sabe de quién es. Desde lo alto del patio se ve… el huerto. Pero muy bien.'
    },
    {
      id: 't4', titulo: 'El hombre de la isla', requiere: 'h4', lugar: 'La isla', emoji: '🌴',
      sabe: ['la isla', 'Ben Gunn', 'el fuerte', 'Ben Gunn sueña con queso', 'Ben Gunn lleva años solo'],
      resumen: 'Ya en la isla, Jim se escapó y conoció a Ben Gunn, un pirata abandonado allí hacía años. Ben estaba solo, hablaba raro y soñaba con comer queso.',
      escena: 'La isla es verde y húmeda. Entre los árboles, alguien se mueve. No es un pirata de Silver: es un hombre flaco, con la piel tostada, que lleva muchísimo tiempo sin hablar con nadie.',
      retos: [
        { tipo: 'mates', texto: 'Ben Gunn lleva tres años solo en la isla. ¿Cuántos meses son?', ops: ['36 meses', '30 meses', '3 meses', '12 meses'], buena: 0, pista: 'Un año tiene 12 meses. Tres años…', cur: cur(MATES, ['STEM'], 'Multiplicar y medida del tiempo') },
        { tipo: 'turnos', texto: 'Leed en voz alta el momento en que Jim conoce a Ben Gunn.', apoyo: 'Las demás mesas escuchan y, al acabar, dicen qué le pasa a Ben por haber estado tanto tiempo solo.', cur: EN_VOZ },
        votar('¿Qué ponemos en el rincón para recordar la isla?', [['🧀 Un queso', 'Para Ben Gunn, que lo echa de menos'], ['🌴 Una palmera', 'De la isla'], ['🐐 Una cabra', 'Las de la isla']], ['🛶 Una canoa', 'Olivia propone la barquita de Ben'])
      ],
      epilogo: 'Rosa ha guardado un trozo de queso en la despensa «por si alguien lo necesita mucho». Tomás jura que alguien lo mira de lejos.'
    },
    {
      id: 't5', titulo: 'El tesoro', requiere: 'fin', final: true, lugar: 'La isla', emoji: '💰',
      sabe: ['todo el libro'],
      resumen: 'Los piratas buscaron el tesoro, pero el agujero estaba vacío: Ben Gunn lo había encontrado y escondido años antes. Jim y sus amigos volvieron a casa con el tesoro, y Silver escapó con una bolsa de monedas.',
      escena: 'El mapa marca el sitio con una cruz. Los piratas cavan y cavan… y no hay nada. Alguien llegó antes.',
      retos: [
        { tipo: 'comprension', texto: '¿Quién había encontrado ya el tesoro?', ops: ['Ben Gunn', 'El capitán Smollett', 'Long John Silver', 'El loro'], buena: 0, pista: 'El hombre que llevaba años solo en la isla.', cur: INFIERE },
        { tipo: 'debate', texto: 'Silver engañó a todos, pero también ayudó a Jim alguna vez. Al final escapa. ¿Qué pensáis de él?', perspectivas: [['🧒 Jim', '«Me salvó la vida… y me engañó. Las dos cosas.»'], ['⚕️ El doctor', '«Las personas no son solo buenas o malas.»'], ['🔑 Tomás', '«Yo no le dejaría ni las llaves del cuarto de la escoba.»']], ops: [['Era un tramposo', 'Lo que hizo estuvo mal, aunque a veces fuera amable.'], ['Era bueno y malo a la vez', 'Como muchas personas: no siempre es fácil decidir.'], ['Merecía otra oportunidad', 'A veces la gente cambia.']], cur: DEBATE }
      ],
      epilogo: '¡Habéis terminado el libro! En el pueblo se ha restaurado el viejo muelle. El mapa del tesoro ya está en la vitrina. Y en la biblioteca se ha posado un loro que solo sabe decir «¡Doblones!».'
    }
  ],
  huellas: {
    lugar: { id: 'muelle', nombre: 'El viejo muelle', emoji: '⚓' },
    recuerdo: { emoji: '🗺️', nombre: 'El mapa del tesoro' },
    hilo: { emoji: '🦜', nombre: 'Un loro en la biblioteca', texto: 'Un loro se ha quedado a vivir en la biblioteca. Repite una palabra que nadie entiende… todavía.' },
    explorador: 'panuelo'
  }
};
