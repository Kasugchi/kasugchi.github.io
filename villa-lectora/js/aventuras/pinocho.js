// «Las aventuras de Pinocho» (Carlo Collodi, 1883). Dominio público. Escenas y resúmenes propios
// (del libro, no de las películas).
import { cur, MATES, LOCALIZA, ORDENA, INFIERE, DEBATE, votar } from './comun.js';

export default {
  id: 'pinocho', version: 1, titulo: 'Las aventuras de Pinocho', autor: 'Carlo Collodi', emoji: '🪵',
  etapa: 'Primaria', curso: '3.º a 5.º', lectura: 'Libro por capítulos (edición adaptada)',
  derechos: 'Obra de dominio público. Escenas y resúmenes propios, basados en el libro y no en las películas.',
  guia: { nombre: 'El Grillo', emoji: '🦗' },
  hitos: [
    { id: 'h1', texto: 'Geppetto talla a Pinocho y el muñeco se escapa' },
    { id: 'h2', texto: 'Pinocho vende su abecedario para ir al teatro' },
    { id: 'h3', texto: 'El Gato y el Zorro le engañan con las monedas' },
    { id: 'h4', texto: 'Pinocho va al País de los Juguetes' },
    { id: 'fin', texto: 'Hemos terminado el libro' }
  ],
  tramos: [
    {
      id: 't1', titulo: 'El tronco que hablaba', requiere: 'h1', lugar: 'El taller de Geppetto', emoji: '🪵',
      sabe: ['Maese Cereza', 'el tronco que habla', 'Geppetto', 'el muñeco de madera', 'Pinocho se escapa'],
      resumen: 'Un carpintero encontró un tronco que hablaba y se lo regaló a su amigo Geppetto. Geppetto talló con él un muñeco, lo llamó Pinocho y, nada más tener piernas, el muñeco salió corriendo a la calle.',
      escena: 'El carpintero Maese Cereza levanta el hacha… y una vocecita grita: «¡No me pegues tan fuerte!». Pero en el taller no hay nadie. Solo un tronco.',
      retos: [
        { tipo: 'comprension', texto: '¿Qué hace Geppetto con el tronco?', ops: ['Talla un muñeco de madera', 'Hace una silla', 'Lo echa al fuego', 'Construye una barca'], buena: 0, pista: 'Quiere un compañero para recorrer el mundo.', cur: LOCALIZA },
        { tipo: 'ordenar', texto: 'Ordenad lo que pasó en el taller.', items: ['Un carpintero encuentra un tronco que habla', 'Se lo regala a Geppetto', 'Geppetto talla el muñeco', 'Pinocho sale corriendo a la calle'], pista: 'Antes de Geppetto, el tronco estaba en otro taller.', cur: ORDENA },
        votar('¿Qué ponemos en el rincón para recordar el taller?', [['🪵 Un tronco', 'Que no hable, por favor'], ['🔨 Un martillo', 'De carpintero'], ['🧵 Un ovillo de hilo', 'Para los muñecos']], ['🪚 Una sierra', 'Olivia propone otra herramienta del taller'])
      ],
      epilogo: 'Tomás jura que ha oído una vocecita en el montón de leña del patio. Ha decidido no partir más leña hasta nuevo aviso.'
    },
    {
      id: 't2', titulo: 'El abecedario', requiere: 'h2', lugar: 'La plaza del teatro', emoji: '🎭',
      sabe: ['el Grillo Parlante', 'Geppetto vende su chaqueta', 'el abecedario', 'el teatro de marionetas', 'Comefuego'],
      resumen: 'Geppetto vendió su chaqueta para comprarle a Pinocho un abecedario e ir al colegio. Pero de camino, Pinocho oyó la música del teatro de marionetas y vendió el abecedario para entrar.',
      escena: 'Pinocho va al colegio con su abecedario nuevo. A lo lejos suena una música de pífanos y tambores. Hay un teatro de marionetas… y la entrada cuesta cuatro monedas.',
      retos: [
        { tipo: 'libro', texto: 'Con el libro abierto: ¿qué vende Pinocho para poder entrar al teatro?', ops: ['Su abecedario', 'Su gorro', 'Sus zapatos', 'Una peonza'], buena: 0, pista: 'Lo que Geppetto le compró para ir al colegio.', cur: LOCALIZA },
        { tipo: 'debate', texto: 'Pinocho elige el teatro ahora en lugar del colegio. ¿Qué es mejor: hacer lo que nos apetece ahora o lo que nos ayudará después?', perspectivas: [['🪵 Pinocho', '«¡Al colegio puedo ir mañana! El teatro es hoy.»'], ['🦗 El Grillo', '«Lo que dejas para mañana a veces ya no vuelve.»'], ['🥘 Rosa', '«Yo primero friego y luego bailo. Pero bailo, ¿eh?»']], ops: [['Primero lo importante, luego lo divertido', 'Así se disfruta más y sin preocupaciones.'], ['A veces hay que darse un gusto', 'Pero sin hacer daño a nadie.'], ['Depende de qué se pierde', 'Geppetto vendió su chaqueta: eso cuenta.']], cur: DEBATE },
        votar('¿Qué ponemos en el rincón para recordar el teatro?', [['🎭 Un teatrillo', 'De marionetas'], ['📘 Un abecedario', 'Para que no se venda'], ['🦗 Un grillo', 'Que da buenos consejos']], ['🧥 Una chaqueta', 'Olivia propone devolverle la chaqueta a Geppetto'])
      ],
      epilogo: 'En la biblioteca, Olivia ha puesto un cartel: «Los abecedarios no se venden». Nadie sabe por qué, pero todos asienten.'
    },
    {
      id: 't3', titulo: 'El Campo de los Milagros', requiere: 'h3', lugar: 'El camino', emoji: '🦊',
      sabe: ['las cinco monedas de oro', 'el Gato y el Zorro', 'el Campo de los Milagros', 'la nariz que crece al mentir', 'el Hada'],
      resumen: 'Comefuego regaló cinco monedas de oro a Pinocho. El Gato y el Zorro le convencieron de enterrarlas en el Campo de los Milagros para que crecieran, y se las robaron. Pinocho también descubrió que, cuando miente, le crece la nariz.',
      escena: 'Un gato que dice estar ciego y un zorro que dice estar cojo acompañan a Pinocho por el camino. Le hablan de un campo mágico donde las monedas crecen como árboles.',
      retos: [
        { tipo: 'mates', texto: 'Pinocho tiene 5 monedas. El Zorro dice que cada una se convertirá en 100. ¿Cuántas tendría?', ops: ['500', '105', '50', '1.000'], buena: 0, pista: 'Cinco veces cien.', cur: cur(MATES, ['STEM'], 'Multiplicar por 100') },
        { tipo: 'comprension', texto: 'Y entonces… ¿qué le pasa a la nariz de Pinocho cuando miente?', ops: ['Le crece', 'Se le pone roja', 'Se le cae', 'No le pasa nada'], buena: 0, pista: 'Es lo más famoso del libro.', cur: INFIERE },
        votar('¿Qué ponemos en el rincón para recordar el engaño?', [['🪙 Cinco monedas', 'Bien guardadas, no enterradas'], ['🌳 Un arbolito', 'De los que no dan monedas'], ['🔔 Una campanita', 'Para avisar de los timos']], ['📏 Una regla', 'Olivia propone medir narices'])
      ],
      epilogo: 'Tomás ha cavado un agujero en el huerto «para comprobar una cosa». No ha crecido nada. Rosa no le habla.'
    },
    {
      id: 't4', titulo: 'El País de los Juguetes', requiere: 'h4', lugar: 'El País de los Juguetes', emoji: '🎠',
      sabe: ['Mecha', 'el País de los Juguetes', 'un país sin colegio', 'se convierten en burros'],
      resumen: 'Su amigo Mecha convenció a Pinocho para irse al País de los Juguetes, donde no hay colegio y todo es jugar. Pasaron meses divirtiéndose… hasta que a los dos les crecieron orejas de burro y se convirtieron en burros.',
      escena: 'Una carreta llena de niños cantando va hacia un país donde nunca hay colegio y siempre es domingo. Mecha le guarda un sitio a Pinocho.',
      retos: [
        { tipo: 'comprension', texto: '¿En qué se convierten Pinocho y Mecha?', ops: ['En burros', 'En marionetas', 'En pájaros', 'En niños de verdad'], buena: 0, pista: 'Primero les crecen unas orejas muy largas.', cur: LOCALIZA },
        { tipo: 'debate', texto: 'Mecha convence a Pinocho para ir a un sitio que no le conviene. ¿Cómo se le dice que no a un amigo?', perspectivas: [['🧒 Mecha', '«¡Si eres mi amigo, te vienes!»'], ['🦗 El Grillo', '«Un amigo de verdad no te pide que hagas lo que te hace daño.»'], ['🔑 Tomás', '«Yo digo: "No, gracias, pero si quieres jugamos a otra cosa".»']], ops: [['Se puede decir que no y seguir siendo amigos', 'Un buen amigo lo entiende.'], ['Proponiendo otra cosa', 'Así nadie se queda mal.'], ['Pidiendo ayuda a un adulto', 'Si la cosa es seria, mejor no estar solo.']], cur: DEBATE },
        votar('¿Qué ponemos en el rincón para recordar el País de los Juguetes?', [['🎠 Un tiovivo', 'De los de feria'], ['🧸 Un juguete', 'Para compartir'], ['🫏 Un burrito', 'Con orejas largas']], ['🎈 Un globo', 'Olivia propone algo para jugar todos'])
      ],
      epilogo: 'Rosa dice que hoy en el comedor alguien ha rebuznado. Ha sido Tomás, que estaba imitando a un burro. Dice que es «para ambientar».'
    },
    {
      id: 't5', titulo: 'Un niño de verdad', requiere: 'fin', final: true, lugar: 'Dentro del tiburón', emoji: '🐋',
      sabe: ['todo el libro'],
      resumen: 'Pinocho encontró a Geppetto dentro de un tiburón enorme y lo sacó de allí nadando. Desde entonces trabajó y estudió para cuidarle, y una mañana despertó convertido en un niño de verdad.',
      escena: 'Todo está oscuro y huele a pescado. Al fondo, una lucecita. Alguien está sentado a una mesa, comiendo a la luz de una vela. Es una cara muy conocida.',
      retos: [
        { tipo: 'comprension', texto: '¿Dónde encuentra Pinocho a Geppetto?', ops: ['Dentro de un tiburón enorme', 'En el País de los Juguetes', 'En el teatro', 'En el colegio'], buena: 0, pista: 'Es un animal gigantesco del mar.', cur: LOCALIZA },
        { tipo: 'comprension', texto: '¿Cómo termina el libro?', ops: ['Pinocho se convierte en un niño de verdad', 'Pinocho vuelve a ser un tronco', 'Pinocho se queda en el mar', 'Geppetto se convierte en muñeco'], buena: 0, pista: 'Lo que Pinocho deseaba desde hacía mucho.', cur: INFIERE }
      ],
      epilogo: '¡Habéis terminado el libro! Se ha restaurado el taller del carpintero. Un trocito del tronco que hablaba está en la vitrina. Y en la ventana de la biblioteca vive ahora un grillo que da consejos… cuando nadie se los pide.'
    }
  ],
  huellas: {
    lugar: { id: 'taller', nombre: 'El taller del carpintero', emoji: '🪚' },
    recuerdo: { emoji: '🪵', nombre: 'Un trocito del tronco que hablaba' },
    hilo: { emoji: '🦗', nombre: 'El grillo de la ventana', texto: 'Un grillo vive en la ventana de la biblioteca y da consejos sin que nadie se los pida.' },
    explorador: 'gorro'
  }
};
