// =============================================================
//  GUÍA DE MORRANDAR: qué es la tortuga y qué ofrece.
//  La usan la ayuda de la portada («Cómo se juega») y el botón «?»
//  de la tortuga. Las listas salen de pueblo.js, así no se desfasan.
// =============================================================
import { RANGOS, MEJORAS, OBRAS, RECOMPENSA_ENCARGO } from './pueblo.js';

const lista = (filas) => `<div class="lista-guia">${filas.map(([a, b]) => `<span>${a}</span><span>${b}</span>`).join('')}</div>`;

export function seccionesTortuga() {
  return [
    ['Qué es Morrandar', `
    <p><b>Morrandar</b> es la tortuga gigante que nada entre las historias del libro. En su caparazón está vuestro pueblo: el sitio donde descansáis entre misión y misión, guardáis el oro y veis crecer lo que habéis conseguido.</p>
    <p>Se entra con <b>🐢 Ir a Morrandar</b> en el menú. Lo primero que te pregunta es <b>con qué héroe quieres pasear</b>: el banco, la cantina y los vecinos tratan con ese héroe. Lo cambias cuando quieras tocando su retrato arriba.</p>
    <p>Cada <b>mundo</b> (las ranuras del menú) tiene su propia tortuga, sus héroes y sus partidas. Lo que hagas en un mundo no cambia los otros.</p>`],
    ['Moverse', `
    <p><b>Móvil:</b> toca el suelo para andar, toca a alguien para ir a hablarle, arrastra para girar la cámara y pellizca para acercar.</p>
    <p><b>Ordenador:</b> WASD para andar, Q para girar, rueda para acercar y <b>E</b> (o Intro) para hablar con quien tengas cerca.</p>
    <p>Arriba: <b>Calidad</b> (bájala si el móvil va lento), <b>sonido</b>, <b>pantalla completa</b>, <b>📖</b> la vista ligera sin 3D y <b>👥</b> jugar juntos.</p>`],
    ['Lugares y vecinos', lista([
      ['<b>El Libro</b>', 'Entrar en una historia: Historia, Infinita o el rescate en el Limbo. Solo o con sala.'],
      ['<b>Tu cabaña</b>', 'Tus trofeos, el baúl con tus héroes (y su aspecto) y un rincón tranquilo con gramófono y lluvia.'],
      ['<b>Madre Hiel</b>', 'El banco: guarda el oro de tus héroes y lo comparten todos los de tu ficha.'],
      ['<b>Tablón de encargos</b>', 'Retos de la semana, cómo va el pueblo y las obras.'],
      ['<b>Marga</b> (cantina)', 'Un guiso antes de bajar: una poción curativa para la próxima misión.'],
      ['<b>Mordo el Tuerto</b>', 'Mercader de dudosa reputación. De momento solo enseña su género.'],
      ['<b>El Viejo Anzuelo</b>', 'Pesca páginas perdidas. Pregúntale qué ha sacado hoy.'],
      ['<b>Pip, la Guía Ciega y Tintero</b>', 'El grumete, quien guía a Morrandar y el gato. Hablad con ellos.'],
      ['<b>La Forja Fría</b>', 'Apagada hasta que alguien rescate a Bruna (próximamente).'],
      ['<b>Morrandar</b>', 'Su cabeza, al final del caparazón. Se le puede acariciar.']
    ])],
    ['El banco de Madre Hiel', `
    <p>Tu ficha tiene <b>un solo banco</b> para todos tus héroes. El héroe que paseas puede <b>guardar</b> todo el oro que lleve.</p>
    <p>Para <b>sacar</b> hay límite: como mucho el <b>40 %</b> de lo que tiene entre bolsa y banco, y <b>una vez por misión</b>. Así un héroe nuevo no sale con la fortuna de otro.</p>
    <p>Un héroe que está metido en una partida lleva la bolsa encima: no puede usar el banco hasta que la partida acabe.</p>`],
    ['Cómo crece el pueblo', `
    <p>Tu tortuga empieza como una aldea casi vacía. Crece con la <b>fama</b>, que se gana jugando:</p>
    ${lista([
      ['Misión ganada', '+10'],
      ['Misión perdida', '+3'],
      ['Cada jefe vencido', '+3'],
      ['Mazmorra Infinita', 'extra según el piso (hasta +10)'],
      ['Rescate en el Limbo', '+10'],
      ['Encargo de la semana', `+${RECOMPENSA_ENCARGO}`]
    ])}
    <p><b>Ayudar también cuenta:</b> si juegas en la sala de otro, tu tortuga gana la misma fama que la suya.</p>
    <p><b>Rangos:</b> ${RANGOS.map((r) => `${r.nombre} (${r.fama})`).join(' → ')}.</p>
    <p><b>Lo que va llegando:</b></p>
    ${lista(MEJORAS.map((m) => [m.nombre, m.historia ? 'al acabar la historia' : m.rescate ? 'con un rescate (pronto)' : m.fama + ' de fama']))}
    <p>Al volver, la tortuga te avisa de lo nuevo.</p>`],
    ['Obras y encargos', `
    <p><b>Encargos:</b> en el tablón hay tres retos que cambian cada lunes (jugar misiones, ganar, vencer jefes, matar monstruos). Al cumplirlos, cóbralos ahí mismo: +${RECOMPENSA_ENCARGO} de fama cada uno.</p>
    <p><b>Obras:</b> desde el tablón se encargan con el oro del banco:</p>
    ${lista(OBRAS.map((o) => [o.nombre, o.precio + ' monedas']))}`],
    ['Jugar juntos en la tortuga', `
    <p>Con <b>👥</b> abres una sala y te da un <b>código</b>. Los demás se unen con ese código, desde la tortuga o con <b>Unirse</b> en el menú, y pueden elegir entre ir a la tortuga o esperar en la <b>pantalla ligera</b>, que gasta mucho menos.</p>
    <p>Todos veis <b>el pueblo de quien abre la sala</b>. Los demás pueden entrar en su cabaña y, en su baúl, cambiar su propio héroe.</p>
    <p>Para hablar hay <b>gestos y frases rápidas</b>. Para bajar, cualquiera <b>propone una historia en el Libro</b> y, cuando todos dicen «¡Listo!», el libro os traga a la vez. Al terminar la misión, volvéis juntos a la tortuga.</p>`]
  ];
}
