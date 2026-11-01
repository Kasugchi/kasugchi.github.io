// «Alicia en el país de las maravillas» (Lewis Carroll, 1865). Dominio público. Escenas y resúmenes propios.
import { cur, MATES, LOCALIZA, ORDENA, INFIERE, EN_VOZ, DEBATE, CONVIVE, votar } from './comun.js';

export default {
  id: 'alicia', version: 1, titulo: 'Alicia en el país de las maravillas', autor: 'Lewis Carroll', emoji: '🐇',
  etapa: 'Primaria', curso: '3.º a 5.º', lectura: 'Libro por capítulos (edición adaptada)',
  derechos: 'Obra de dominio público. Escenas y resúmenes propios. Comprobar la edición de la clase.',
  guia: { nombre: 'El Conejo Blanco', emoji: '🐇' },
  hitos: [
    { id: 'h1', texto: 'Alicia sigue al Conejo Blanco y cae por la madriguera' },
    { id: 'h2', texto: 'Alicia crece, encoge y llora un charco' },
    { id: 'h3', texto: 'La merienda de locos' },
    { id: 'h4', texto: 'El cróquet de la Reina de Corazones' },
    { id: 'fin', texto: 'Hemos terminado el libro' }
  ],
  tramos: [
    {
      id: 't1', titulo: 'La madriguera', requiere: 'h1', lugar: 'La orilla del río', emoji: '🕳️',
      sabe: ['Alicia', 'su hermana', 'el Conejo Blanco', 'el reloj', 'la madriguera', 'la caída'],
      resumen: 'Alicia se aburría junto a su hermana cuando pasó un Conejo Blanco con chaleco y reloj, muy apurado. Lo siguió hasta una madriguera y cayó por un pozo larguísimo.',
      escena: 'Hace calor y Alicia se aburre. De pronto, un conejo blanco pasa corriendo y saca un reloj del chaleco: «¡Ay, ay, que llego tarde!». Un conejo con reloj. Eso hay que verlo.',
      retos: [
        { tipo: 'comprension', texto: '¿Qué saca el Conejo Blanco del bolsillo del chaleco?', ops: ['Un reloj', 'Una zanahoria', 'Una llave', 'Un pañuelo'], buena: 0, pista: 'Lo mira porque llega tarde.', cur: LOCALIZA },
        { tipo: 'ordenar', texto: 'Ordenad cómo empieza la aventura.', items: ['Alicia se aburre junto a su hermana', 'Pasa un conejo blanco con reloj', 'Alicia lo sigue hasta la madriguera', 'Cae por un pozo muy, muy hondo'], pista: 'Antes de ver al conejo, Alicia no está haciendo nada.', cur: ORDENA },
        votar('¿Qué ponemos en el rincón para recordar la madriguera?', [['🐇 Un conejo blanco', 'Con prisa, claro'], ['⏱️ Un reloj de bolsillo', 'Siempre llega tarde'], ['🚪 Una puertecita', 'Muy, muy pequeña']], ['🍄 Una seta', 'Olivia propone algo de bosque mágico'])
      ],
      epilogo: 'Tomás ha visto pasar algo blanco y rápido junto a la biblioteca. «Un gato», dice. Pero llevaba chaleco.'
    },
    {
      id: 't2', titulo: 'Crecer y encoger', requiere: 'h2', lugar: 'La sala de las puertas', emoji: '🧪',
      sabe: ['la sala de las puertas', 'la llave dorada', 'la botellita «Bébeme»', 'el pastelito', 'crecer y encoger', 'el charco de lágrimas'],
      resumen: 'Alicia llegó a una sala llena de puertas. Bebió de una botellita que decía «Bébeme» y encogió; comió un pastelito y creció muchísimo. Lloró tanto que formó un charco enorme.',
      escena: 'Una sala con muchas puertas, todas cerradas. Sobre una mesa de cristal, una llavecita dorada y una botella con una etiqueta que dice algo muy claro.',
      retos: [
        { tipo: 'libro', texto: 'Con el libro abierto: ¿qué dice la etiqueta de la botellita?', ops: ['«Bébeme»', '«Veneno»', '«No tocar»', '«Para mañana»'], buena: 0, pista: 'Es una sola palabra, y es una invitación.', cur: LOCALIZA },
        { tipo: 'mates', texto: 'Si Alicia mide 120 centímetros y encoge hasta la cuarta parte, ¿cuánto mide?', ops: ['30 cm', '40 cm', '60 cm', '12 cm'], buena: 0, pista: 'Repartid 120 en cuatro partes iguales.', cur: cur(MATES, ['STEM'], 'Fracciones sencillas y medida') },
        votar('¿Qué ponemos en el rincón para recordar la sala de las puertas?', [['🔑 La llave dorada', 'Diminuta y brillante'], ['🧪 La botellita', '¡Sin beber!'], ['🍰 El pastelito', 'Tampoco se come']], ['🌊 Un charquito', 'Olivia propone el charco de lágrimas'])
      ],
      epilogo: 'Rosa dice que ayer la puerta de la despensa le pareció más pequeña que de costumbre. Hoy ya no. Prefiere no darle vueltas.'
    },
    {
      id: 't3', titulo: 'La merienda de locos', requiere: 'h3', lugar: 'La casa de la Liebre de Marzo', emoji: '🫖',
      sabe: ['el Sombrerero', 'la Liebre de Marzo', 'el Lirón', 'la merienda', 'las adivinanzas sin respuesta', 'siempre son las seis'],
      resumen: 'Alicia encontró una merienda con el Sombrerero, la Liebre de Marzo y un Lirón dormido. Le dijeron que no había sitio, aunque la mesa estaba casi vacía, y nadie la escuchaba.',
      escena: 'Una mesa larguísima, llena de tazas. Solo hay tres comensales, apretujados en una esquina. Cuando Alicia se acerca, gritan: «¡No hay sitio! ¡No hay sitio!».',
      retos: [
        { tipo: 'comprension', texto: '¿Quiénes están en la merienda de locos?', ops: ['El Sombrerero, la Liebre de Marzo y el Lirón', 'La Reina, el Rey y la Duquesa', 'El Conejo, el Gato y la Oruga', 'Alicia y su hermana'], buena: 0, pista: 'Uno lleva sombrero, otra es una liebre y el tercero se duerme todo el rato.', cur: LOCALIZA },
        { tipo: 'convivencia', texto: 'Alicia llega a la merienda y le dicen que no hay sitio, aunque hay muchísimas sillas libres.', mensaje: 'Esto no se vota: decirle a alguien que no hay sitio cuando sí lo hay es dejarle fuera a propósito.', preguntas: ['¿Cómo se siente alguien a quien le dicen «no hay sitio»?', '¿Os ha pasado alguna vez en el comedor o en el patio?', '¿Qué podemos hacer para que quien llega nuevo se sienta bien?'], cur: CONVIVE },
        votar('¿Qué ponemos en el rincón para recordar la merienda?', [['🫖 Una tetera', 'Siempre llena'], ['🎩 Un sombrero alto', 'Como el del Sombrerero'], ['🐭 Un lirón dormido', 'Sin despertarle']], ['🪑 Una silla de más', 'Olivia propone una silla para quien llegue'])
      ],
      epilogo: 'Rosa ha puesto una silla de más en cada mesa del comedor. «Por si viene alguien», dice. Siempre viene alguien.'
    },
    {
      id: 't4', titulo: 'El cróquet de la Reina', requiere: 'h4', lugar: 'El jardín de la Reina', emoji: '🦩',
      sabe: ['la Reina de Corazones', 'los naipes jardineros', 'las rosas pintadas', 'el cróquet con flamencos y erizos', '«¡Que le corten la cabeza!»', 'el Gato de Cheshire'],
      resumen: 'En el jardín de la Reina de Corazones, unos naipes pintaban de rojo las rosas blancas. La Reina jugaba al cróquet con flamencos como mazos y gritaba «¡Que le corten la cabeza!» por cualquier cosa.',
      escena: 'Un jardín precioso… y tres naipes con brochas, pintando rosas a toda prisa. «¡Plantamos rosas blancas y la Reina las quería rojas!», susurran temblando.',
      retos: [
        { tipo: 'comprension', texto: '¿Qué usan como mazos en el cróquet de la Reina?', ops: ['Flamencos', 'Paraguas', 'Ramas de árbol', 'Cucharas'], buena: 0, pista: 'Son pájaros rosas de patas largas.', cur: LOCALIZA },
        { tipo: 'debate', texto: 'La Reina grita «¡Que le corten la cabeza!» por todo, y todos le tienen miedo. ¿Qué hace que alguien mande bien?', perspectivas: [['👑 La Reina', '«Si me tienen miedo, me obedecen. Así funciona.»'], ['🐇 El Conejo', '«Yo obedezco… pero no me gusta nada.»'], ['🦉 Olivia', '«¿Se puede hacer caso a alguien sin tenerle miedo?»']], ops: [['Mandar bien es escuchar', 'Quien manda bien explica y escucha a los demás.'], ['Hace falta que haya normas', 'Pero normas justas, no gritos.'], ['Depende de la situación', 'A veces hay que decidir rápido, pero sin asustar.']], cur: DEBATE },
        votar('¿Qué ponemos en el rincón para recordar el jardín?', [['🦩 Un flamenco', 'Que no sirva de mazo'], ['🌹 Una rosa roja', 'Pintada… o no'], ['🃏 Un naipe', 'El jardinero más nervioso']], ['🎨 Un bote de pintura', 'Olivia propone algo para pintar entre todos'])
      ],
      epilogo: 'Alguien ha pintado de rojo una rosa blanca del patio. Tomás está investigando. De momento, sospecha de todo el mundo.'
    },
    {
      id: 't5', titulo: '¿Era un sueño?', requiere: 'fin', final: true, lugar: 'El juicio', emoji: '🃏',
      sabe: ['todo el libro'],
      resumen: 'En el juicio de la Sota de Corazones, Alicia empezó a crecer y dejó de tenerle miedo a nadie: «¡No sois más que una baraja de cartas!». Entonces despertó junto a su hermana. Todo había sido un sueño.',
      escena: 'Un juicio sin pies ni cabeza: el Rey hace de juez, los testigos dicen tonterías y la Reina quiere el castigo antes que la sentencia. Alicia empieza a crecer… y a hablar claro.',
      retos: [
        { tipo: 'comprension', texto: '¿Cómo termina la aventura de Alicia?', ops: ['Se despierta: era un sueño', 'Se queda a vivir en el país', 'La Reina la nombra princesa', 'Vuelve por la madriguera con el Conejo'], buena: 0, pista: 'Vuelve a estar junto a su hermana, como al principio.', cur: INFIERE },
        { tipo: 'turnos', texto: 'Cada mesa cuenta en una sola frase su momento favorito del libro.', apoyo: 'Le toca a una mesa; las demás pueden pedir turno después.', cur: EN_VOZ }
      ],
      epilogo: '¡Habéis terminado el libro! Se ha restaurado el jardín de las rosas. El reloj del Conejo Blanco ya está en la vitrina. Y cada mañana aparece un naipe en un sitio distinto del pueblo.'
    }
  ],
  huellas: {
    lugar: { id: 'rosas', nombre: 'El jardín de las rosas', emoji: '🌹' },
    recuerdo: { emoji: '⏱️', nombre: 'El reloj del Conejo Blanco' },
    hilo: { emoji: '🃏', nombre: 'El naipe viajero', texto: 'Cada mañana aparece un naipe en un sitio distinto del pueblo. Nadie sabe quién lo pone.' },
    explorador: 'orejas'
  }
};
