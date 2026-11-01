// «El patito feo» (Hans Christian Andersen, 1843). Dominio público. Escenas y resúmenes propios.
// Ejemplo de Infantil: un álbum que se lee en una sesión es UN solo tramo.
import { cur, ORDENA, CONVIVE, votar } from './comun.js';

const ESCUCHA = cur('Comunicación y representación de la realidad', ['CCL'], 'Comprender un cuento escuchado');
export default {
  id: 'patito', version: 1, titulo: 'El patito feo', autor: 'Hans Christian Andersen', emoji: '🦢',
  etapa: 'Infantil', curso: '4 y 5 años', lectura: 'Álbum ilustrado (una sesión)',
  derechos: 'Obra de dominio público. Escena y resumen propios. Comprobar la edición ilustrada de la clase.',
  guia: { nombre: 'Mamá Pata', emoji: '🦆' },
  hitos: [{ id: 'fin', texto: 'Hemos leído el cuento juntos' }],
  tramos: [
    {
      id: 't1', titulo: 'El patito feo', requiere: 'fin', final: true, lugar: 'El estanque', emoji: '🥚',
      sabe: ['todo el cuento'],
      resumen: 'Un patito nació distinto a sus hermanos y todos se burlaban de él. Pasó un invierno muy largo y solo. En primavera se vio reflejado en el agua: era un precioso cisne.',
      escena: 'En el estanque, un huevo muy grande tarda en abrirse. Cuando por fin sale el patito, es gris, grande y torpe. Sus hermanos se ríen. Él agacha la cabeza.',
      retos: [
        { tipo: 'ordenar', texto: '¿Qué pasó primero? Tocad en orden.', items: ['🥚 Nace el patito', '🦆 Los demás se ríen de él', '❄️ Pasa el invierno solito', '🦢 Se ve en el agua: ¡es un cisne!'], pista: 'Primero sale del huevo.', cur: ORDENA },
        { tipo: 'comprension', texto: '¿Qué era el patito feo al final?', ops: ['🦢 Un cisne', '🐔 Una gallina', '🐸 Una rana', '🦆 Un pato'], buena: 0, pista: 'Un pájaro blanco, grande y muy elegante.', cur: ESCUCHA },
        { tipo: 'convivencia', texto: 'Los animales se reían del patito porque era distinto.', mensaje: 'Reírse de alguien porque es diferente le pone muy triste.', preguntas: ['¿Cómo se sentía el patito?', '¿Qué le diríais al patito para que esté contento?', '¿En qué somos diferentes en nuestra clase?'], cur: CONVIVE }
      ],
      epilogo: '¡Habéis leído el cuento! En el pueblo hay un estanque nuevo con cisnes. Una pluma blanca ya está en la vitrina. Y Rosa dice que los patos del estanque ahora son muy, muy amables con todos.'
    }
  ],
  huellas: {
    lugar: { id: 'estanque', nombre: 'El estanque de los cisnes', emoji: '🦢' },
    recuerdo: { emoji: '🪶', nombre: 'Una pluma de cisne' },
    hilo: { emoji: '🥚', nombre: 'Un huevo muy grande', texto: 'Junto al estanque ha aparecido un huevo grande. Nadie sabe de quién es.' },
    explorador: 'pluma'
  }
};
