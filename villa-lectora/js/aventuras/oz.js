// «El maravilloso mago de Oz» (L. Frank Baum, 1900). Dominio público. Escenas y resúmenes propios
// (del libro: los zapatos de Dorothy son de plata, no rojos como en la película).
import { cur, MATES, LOCALIZA, ORDENA, INFIERE, DEBATE, CONVIVE, votar } from './comun.js';

export default {
  id: 'oz', version: 1, titulo: 'El maravilloso mago de Oz', autor: 'L. Frank Baum', emoji: '🌪️',
  etapa: 'Primaria', curso: '3.º a 5.º', lectura: 'Libro por capítulos (edición adaptada)',
  derechos: 'Obra de dominio público. Escenas y resúmenes propios, basados en el libro y no en la película.',
  guia: { nombre: 'Totó', emoji: '🐶' },
  hitos: [
    { id: 'h1', texto: 'Un ciclón lleva a Dorothy y a Totó a Oz' },
    { id: 'h2', texto: 'Se unen el Espantapájaros, el Leñador y el León' },
    { id: 'h3', texto: 'Llegan a la Ciudad Esmeralda y ven al Mago' },
    { id: 'h4', texto: 'Vencen a la Bruja Mala del Oeste' },
    { id: 'fin', texto: 'Hemos terminado el libro' }
  ],
  tramos: [
    {
      id: 't1', titulo: 'El ciclón', requiere: 'h1', lugar: 'Kansas y el país de los munchkins', emoji: '🌪️',
      sabe: ['Dorothy', 'Totó', 'Kansas', 'el ciclón', 'los munchkins', 'la Bruja del Norte', 'los zapatos de plata', 'el camino de baldosas amarillas'],
      resumen: 'Un ciclón levantó la casa de Dorothy, con ella y su perro Totó dentro, y la dejó caer en el país de los munchkins. Allí le dieron unos zapatos de plata y le dijeron que siguiera el camino de baldosas amarillas hasta el Mago de Oz.',
      escena: 'En Kansas todo es gris. De pronto, el cielo ruge: ¡un ciclón! La casa empieza a girar y a subir, subir, subir… con Dorothy y Totó dentro.',
      retos: [
        { tipo: 'comprension', texto: '¿Cómo se llama el perro de Dorothy?', ops: ['Totó', 'Bobby', 'Lucky', 'Rayo'], buena: 0, pista: 'Es pequeño, negro y muy valiente.', cur: LOCALIZA },
        { tipo: 'libro', texto: 'Con el libro abierto: ¿de qué son los zapatos que recibe Dorothy?', ops: ['De plata', 'Rojos, de rubíes', 'De madera', 'De cristal'], buena: 0, pista: '¡Ojo! En la película son rojos, pero en el libro no.', cur: LOCALIZA },
        votar('¿Qué ponemos en el rincón para recordar el ciclón?', [['🌪️ Un remolino de viento', 'Pequeñito, eso sí'], ['🏠 Una casita', 'Como la de Dorothy'], ['🐶 Un perrito', 'Como Totó']], ['🧭 Una veleta', 'Olivia propone algo que marque el viento'])
      ],
      epilogo: 'Hoy ha hecho mucho viento en Villa Lectora. Tomás ha atado el banco del patio «por si acaso». Nadie le ha preguntado por si acaso qué.'
    },
    {
      id: 't2', titulo: 'Compañeros de camino', requiere: 'h2', lugar: 'El camino de baldosas amarillas', emoji: '🛤️',
      sabe: ['el Espantapájaros quiere un cerebro', 'el Leñador de Hojalata quiere un corazón', 'el León Cobarde quiere valor', 'el camino amarillo'],
      resumen: 'Por el camino, Dorothy conoció al Espantapájaros, que quería un cerebro; al Leñador de Hojalata, que quería un corazón; y al León, que quería valor. Todos fueron juntos a ver al Mago.',
      escena: 'El camino amarillo cruza campos y bosques. Un espantapájaros saluda desde su palo; más allá, un hombre de hojalata se ha quedado oxidado con el hacha en alto.',
      retos: [
        { tipo: 'ordenar', texto: 'Ordenad a quién conoce Dorothy por el camino.', items: ['Al Espantapájaros', 'Al Leñador de Hojalata', 'Al León'], pista: 'El primero está en un campo de maíz.', cur: ORDENA },
        { tipo: 'debate', texto: 'Cada uno cree que le falta algo: cerebro, corazón o valor. Pero en el camino… ¿no demuestran ya tenerlo?', perspectivas: [['🌾 Espantapájaros', '«Yo no tengo cerebro. Aunque se me ocurren ideas.»'], ['🤖 Leñador', '«No tengo corazón. Pero lloro si piso un escarabajo.»'], ['🦁 León', '«Soy un cobarde… y me pongo delante cuando hay peligro.»']], ops: [['Ya lo tienen, solo que no lo saben', 'Lo que hacemos dice más de nosotros que lo que creemos.'], ['Les falta confianza', 'A veces necesitamos que alguien nos lo diga.'], ['Lo van ganando por el camino', 'Se aprende a ser valiente siéndolo.']], cur: DEBATE },
        votar('¿Qué ponemos en el rincón para recordar a los compañeros?', [['🌽 Una mazorca', 'Del campo del Espantapájaros'], ['🛢️ Una aceitera', 'Para que nadie se oxide'], ['🦁 Un león de peluche', 'Valiente, aunque no lo sepa']], ['❤️ Un corazón', 'Olivia propone algo para los tres'])
      ],
      epilogo: 'Rosa ha engrasado las bisagras del comedor. «Para que nadie se oxide», dice. Las puertas ya no chirrían. Tomás echa de menos el ruido.'
    },
    {
      id: 't3', titulo: 'La Ciudad Esmeralda', requiere: 'h3', lugar: 'La Ciudad Esmeralda', emoji: '💚',
      sabe: ['la Ciudad Esmeralda', 'las gafas verdes', 'el Mago aparece con formas distintas', 'el encargo de vencer a la Bruja del Oeste'],
      resumen: 'En la Ciudad Esmeralda todos tenían que llevar gafas verdes. El Mago recibió a cada uno con una forma distinta y les puso una condición: vencer a la Bruja Mala del Oeste.',
      escena: 'A lo lejos brilla una ciudad verde. En la puerta, un guardián les entrega unas gafas verdes y se las cierra con llave. «Son las normas», dice.',
      retos: [
        { tipo: 'comprension', texto: '¿Qué tienen que llevar todos en la Ciudad Esmeralda?', ops: ['Gafas verdes', 'Sombreros altos', 'Zapatos de plata', 'Capas rojas'], buena: 0, pista: 'Se las ponen al entrar, y con llave.', cur: LOCALIZA },
        { tipo: 'mates', texto: 'El camino amarillo tiene 4 tramos de 250 baldosas cada uno. ¿Cuántas baldosas hay?', ops: ['1.000', '254', '500', '2.500'], buena: 0, pista: 'Cuatro veces 250. O sumad 250 cuatro veces.', cur: cur(MATES, ['STEM'], 'Multiplicar y sumar') },
        votar('¿Qué ponemos en el rincón para recordar la Ciudad Esmeralda?', [['👓 Unas gafas verdes', 'Sin llave'], ['💎 Una esmeralda', 'De cristal, que es más barata'], ['🧱 Una baldosa amarilla', 'Del camino']], ['🗝️ Una llave verde', 'Olivia propone la llave de las gafas'])
      ],
      epilogo: 'Olivia ha puesto papel celofán verde en una ventana de la biblioteca. Dice que así los libros se ven «más esmeralda». Tiene razón.'
    },
    {
      id: 't4', titulo: 'La Bruja del Oeste', requiere: 'h4', lugar: 'El país de los winkies', emoji: '🪣',
      sabe: ['la Bruja Mala del Oeste', 'los monos alados', 'Dorothy trabaja para la bruja', 'el cubo de agua', 'la bruja se derrite'],
      resumen: 'La Bruja Mala del Oeste capturó a Dorothy y la obligó a trabajar. Un día, enfadada, Dorothy le echó un cubo de agua… y la bruja se derritió. Los winkies quedaron libres.',
      escena: 'Un castillo amarillo, unos monos alados en el cielo y una bruja con un solo ojo que lo ve todo. Dorothy friega suelos todo el día. Pero no se rinde.',
      retos: [
        { tipo: 'comprension', texto: '¿Con qué vence Dorothy a la Bruja Mala del Oeste?', ops: ['Con un cubo de agua', 'Con una espada', 'Con los zapatos de plata', 'Con un hechizo'], buena: 0, pista: 'Lo tenía a mano porque estaba fregando.', cur: LOCALIZA },
        { tipo: 'convivencia', texto: 'En el patio, alguien obliga a otros a hacerle los recados «porque si no, se va a burlar de ellos».', mensaje: 'Esto no se vota: obligar a alguien con amenazas no es un juego, aunque lo parezca.', preguntas: ['¿Cómo se siente quien tiene que obedecer por miedo?', '¿A quién se lo podemos contar?', '¿Qué hizo falta para que Dorothy y los winkies quedaran libres?'], cur: CONVIVE },
        votar('¿Qué ponemos en el rincón para recordar la victoria?', [['🪣 Un cubo', 'Con agua, por si acaso'], ['🐒 Un mono alado', 'Que ya es libre'], ['🌻 Un girasol', 'Del país amarillo']], ['🏅 Una medalla', 'Olivia propone una para los cuatro'])
      ],
      epilogo: 'Tomás ha dejado un cubo de agua en cada esquina del patio. Dice que es para regar. Nadie le cree, pero las plantas están contentísimas.'
    },
    {
      id: 't5', titulo: 'El secreto del Mago', requiere: 'fin', final: true, lugar: 'De vuelta a casa', emoji: '👠',
      sabe: ['todo el libro'],
      resumen: 'El gran Mago de Oz resultó ser un hombre normal que hacía trucos. Aun así, ayudó a cada compañero a ver lo que ya tenía. Dorothy volvió a Kansas chocando tres veces los talones de sus zapatos de plata.',
      escena: 'Totó tira un biombo en la sala del trono… y detrás aparece un señor bajito, calvo y muy avergonzado. «Soy un farsante», confiesa.',
      retos: [
        { tipo: 'comprension', texto: '¿Quién es en realidad el Mago de Oz?', ops: ['Un hombre normal que hace trucos', 'Un dragón disfrazado', 'La Bruja del Norte', 'El León'], buena: 0, pista: 'Totó lo descubre detrás de un biombo.', cur: INFIERE },
        { tipo: 'comprension', texto: '¿Cómo vuelve Dorothy a casa?', ops: ['Chocando los talones de sus zapatos de plata', 'En el globo del Mago', 'Con otro ciclón', 'Volando con los monos alados'], buena: 0, pista: 'Lo que llevaba puesto desde el principio.', cur: INFIERE }
      ],
      epilogo: '¡Habéis terminado el libro! Se ha restaurado un trocito del camino de baldosas amarillas. Las gafas verdes ya están en la vitrina. Y a veces sopla un viento que trae olor a campo de Kansas.'
    }
  ],
  huellas: {
    lugar: { id: 'camino', nombre: 'El camino de baldosas amarillas', emoji: '🧱' },
    recuerdo: { emoji: '👓', nombre: 'Las gafas verdes de la Ciudad Esmeralda' },
    hilo: { emoji: '🌪️', nombre: 'Un viento con olor a campo', texto: 'A veces sopla un viento que trae olor a campo y a pan recién hecho. Viene de muy lejos.' },
    explorador: 'gafas'
  }
};
