// =============================================================
//  ROBOTS DE CHATARRA (el ring del pueblo): núcleos, piezas y su dibujo
//  Cada robot tiene un núcleo (su alma, con forma de bicho) que sube de nivel,
//  y cuatro piezas: cabeza, brazo izquierdo, brazo derecho y piernas.
//  Cada pieza tiene su vida y, muchas, su acción. Si te rompen la cabeza, pierdes.
//  Al ganar a un rival te llevas una de sus piezas. Todo hecho en código, a nuestra manera.
// =============================================================

export const NUCLEOS = {
  escarabajo: { n: 'Escarabajo', e: '🪲', color: '#e0a020', debil: 'rayo', t: 'Pura pólvora: sus disparos tiran 1 dado más. Su punto débil: la electricidad ⚡ (es todo metal).' },
  mantis: { n: 'Mantis', e: '🦗', color: '#4fae5a', debil: 'impacto', t: 'Cuerpo a cuerpo: sus golpes tiran 1 dado más. Su punto débil: los golpes contundentes 👊 (es finita, se dobla).' },
  tortuga: { n: 'Tortuga', e: '🐢', color: '#3a8a8a', debil: 'perforar', t: 'Lenta pero dura: cada pieza aguanta 1 más. Su punto débil: lo que perfora 🌀 (atraviesa el caparazón).' },
  buho: { n: 'Búho', e: '🦉', color: '#8a6ac8', debil: 'fuego', t: 'Ojo fino: apunta a la cabeza sin perder dados, y sus curas curan 1 más. Su punto débil: el fuego 🔥 (se le chamuscan las plumas).' }
};
// Los tipos de ataque: contra el alma que no lo aguanta, 1 dado más («le pilla de lleno»)
export const ELEMENTOS = { impacto: { n: 'contundente', e: '👊' }, perforar: { n: 'perforante', e: '🌀' }, fuego: { n: 'de fuego', e: '🔥' }, rayo: { n: 'eléctrico', e: '⚡' } };
// Experiencia del núcleo: en el 4 y en el 8, un dado más en todo
export const NIVELES_NUCLEO = [0, 40, 100, 180, 280, 400, 550, 720, 920, 1150];
export const nivelNucleo = (xp) => { let n = 1; for (let i = 1; i < NIVELES_NUCLEO.length; i++) if (xp >= NIVELES_NUCLEO[i]) n = i + 1; return n; };
export const extraNivel = (n) => (n >= 8 ? 2 : n >= 4 ? 1 : 0);

export const HUECOS_ROBOT = {
  cabeza: { n: 'Cabeza', e: '🗿', tipo: 'cabeza' }, brazoI: { n: 'Brazo izq.', e: '🦾', tipo: 'brazo' },
  brazoD: { n: 'Brazo der.', e: '🦾', tipo: 'brazo' }, piernas: { n: 'Piernas', e: '🦿', tipo: 'piernas' }
};

// acc: lo que se puede hacer con la pieza. golpe/disparo: dados de ataque; cura: cuánto cura; escudo: cuánto para; apuntar: dados extra al siguiente
// piernas: def (dados para esquivar) y vel (quién va antes)
export const PIEZAS = {
  cab_lata: { hueco: 'cabeza', n: 'Cabeza de lata', vida: 4, forma: 'lata', color: '#9aa4ae' },
  cab_casco: { hueco: 'cabeza', n: 'Casco de buzo', vida: 6, forma: 'casco', color: '#c8903a' },
  cab_radar: { hueco: 'cabeza', n: 'Radar', vida: 3, forma: 'radar', color: '#5a7ab0', acc: { tipo: 'apuntar', n: 'Apuntar', e: '🎯', v: 2 } },
  cab_cruz: { hueco: 'cabeza', n: 'Botiquín', vida: 3, forma: 'cruz', color: '#e8e2d6', acc: { tipo: 'cura', n: 'Reparar', e: '🔧', v: 3, usos: 2 } },
  cab_antena: { hueco: 'cabeza', n: 'Antena chispa', vida: 3, forma: 'antena', color: '#6a5a9a', acc: { tipo: 'disparo', n: 'Chispazo', e: '⚡', v: 2, certero: true , el: 'rayo' } },
  br_puno: { hueco: 'brazo', n: 'Puño de muelle', vida: 4, forma: 'puno', color: '#c85a3a', acc: { tipo: 'golpe', n: 'Puñetazo', e: '👊', v: 2 , el: 'impacto' } },
  br_canon: { hueco: 'brazo', n: 'Cañoncito', vida: 3, forma: 'canon', color: '#5a6a5a', acc: { tipo: 'disparo', n: 'Cañonazo', e: '💥', v: 2 } },
  br_martillo: { hueco: 'brazo', n: 'Martillo', vida: 4, forma: 'martillo', color: '#7a6a5a', acc: { tipo: 'golpe', n: 'Martillazo', e: '🔨', v: 3 , el: 'impacto' } },
  br_pinza: { hueco: 'brazo', n: 'Pinza', vida: 4, forma: 'pinza', color: '#c8a03a', acc: { tipo: 'golpe', n: 'Pellizco', e: '🦀', v: 2, piernas: true , el: 'perforar' } },
  br_escudo: { hueco: 'brazo', n: 'Tapa de olla', vida: 6, forma: 'escudo', color: '#a8b0b8', acc: { tipo: 'escudo', n: 'Cubrirse', e: '🛡️', v: 2 } },
  br_soplete: { hueco: 'brazo', n: 'Soplete', vida: 3, forma: 'soplete', color: '#d8703a', acc: { tipo: 'disparo', n: 'Llamarada', e: '🔥', v: 3 , el: 'fuego' } },
  br_remache: { hueco: 'brazo', n: 'Remachadora', vida: 3, forma: 'remache', color: '#4a4a5a', acc: { tipo: 'disparo', n: 'Ráfaga', e: '🔩', v: 4, usos: 2 } },
  pi_patas: { hueco: 'piernas', n: 'Patas de lata', vida: 4, forma: 'patas', color: '#8a94a0', def: 2, vel: 2 },
  pi_ruedas: { hueco: 'piernas', n: 'Ruedas de carrito', vida: 3, forma: 'ruedas', color: '#3a3a42', def: 1, vel: 4 },
  pi_orugas: { hueco: 'piernas', n: 'Orugas', vida: 6, forma: 'orugas', color: '#4a5a3a', def: 2, vel: 1 },
  pi_arana: { hueco: 'piernas', n: 'Patas de araña', vida: 4, forma: 'arana', color: '#5a3a5a', def: 3, vel: 3 },
  pi_muelle: { hueco: 'piernas', n: 'Muelle saltarín', vida: 3, forma: 'muelle', color: '#c8c03a', def: 4, vel: 3 },
  // Las de Rufo: no las lleva nadie de la liga; se hacen con chatarra de las criptas (RUFO_HACE)
  cab_olla: { hueco: 'cabeza', n: 'Olla exprés', vida: 7, forma: 'casco', color: '#b84a3a' },
  cab_faro: { hueco: 'cabeza', n: 'Faro del puerto', vida: 4, forma: 'radar', color: '#e8d24a', acc: { tipo: 'apuntar', n: 'Fogonazo', e: '🔦', v: 3 } },
  br_taladro: { hueco: 'brazo', n: 'Taladro', vida: 4, forma: 'taladro', color: '#c8c8d0', acc: { tipo: 'golpe', n: 'Taladrazo', e: '🌀', v: 3, certero: true , el: 'perforar' } },
  br_iman: { hueco: 'brazo', n: 'Imán gordo', vida: 5, forma: 'iman', color: '#d83a3a', acc: { tipo: 'escudo', n: 'Imantar', e: '🧲', v: 3 } },
  pi_patin: { hueco: 'piernas', n: 'Patines de hielo', vida: 3, forma: 'ruedas', color: '#8ad0ff', def: 3, vel: 5 }
};
// El banco de Rufo (en el taller del ring): lo que cuesta cada pieza suya, en chatarra (⚙️, cae en las criptas) y monedas
export const RUFO_HACE = { cab_olla: { chatarra: 6, oro: 50 }, pi_patin: { chatarra: 7, oro: 60 }, br_iman: { chatarra: 8, oro: 70 }, cab_faro: { chatarra: 9, oro: 80 }, br_taladro: { chatarra: 12, oro: 100 } };
export const KIT_INICIAL = ['cab_lata', 'br_puno', 'br_canon', 'pi_patas'];

// ---------- Los modelos salvajes (viven en el vertedero): cada uno con sus cuatro piezas ----------
// Con las cuatro de un mismo modelo puestas, su juego completo da un extra (juego).
// juego: vida (+N a cada pieza), esquiva, rapidez, cura, golpe, disparo (+N dados)
export const MODELOS = {
  pinzon: { n: 'Pinzón', e: '🦀', t: 'Un cangrejo de lata que pellizca todo lo que brilla.', color: '#d8603a', juego: { esquiva: 1 }, jt: '+1 dado al esquivar', piezas: {
    cabeza: ['Caparazón de lata', { vida: 5, forma: 'caparazon' }],
    brazoI: ['Pinza grande', { vida: 4, forma: 'pinzota', acc: { tipo: 'golpe', n: 'Tenaza', e: '🦀', v: 3, el: 'perforar' } }],
    brazoD: ['Pinza chica', { vida: 3, forma: 'pinza', acc: { tipo: 'golpe', n: 'Pellizquito', e: '🦀', v: 2, piernas: true, el: 'perforar' } }],
    piernas: ['Patitas de cangrejo', { vida: 4, forma: 'arana', def: 3, vel: 2 }] } },
  zumbona: { n: 'Zumbona', e: '🐝', t: 'Avispa mecánica. Zumba, pica y se va.', color: '#e8c02a', juego: { rapidez: 2 }, jt: '+2 de rapidez', piezas: {
    cabeza: ['Ojos de avispa', { vida: 3, forma: 'ojazos', acc: { tipo: 'apuntar', n: 'Fijar', e: '👁️', v: 2 } }],
    brazoI: ['Aguijón', { vida: 3, forma: 'aguijon', acc: { tipo: 'disparo', n: 'Picotazo', e: '🐝', v: 2, certero: true, el: 'perforar' } }],
    brazoD: ['Zumbador', { vida: 3, forma: 'bobina', acc: { tipo: 'disparo', n: 'Zumbido', e: '⚡', v: 2, el: 'rayo' } }],
    piernas: ['Alas de avispa', { vida: 2, forma: 'alas', def: 4, vel: 4 }] } },
  cavador: { n: 'Cavador', e: '⛏️', t: 'Un topo de hierro que excava túneles bajo la chatarra.', color: '#8a6a4a', juego: { vida: 1 }, jt: '+1 de vida en cada pieza', piezas: {
    cabeza: ['Casco minero', { vida: 5, forma: 'minero' }],
    brazoI: ['Garra excavadora', { vida: 4, forma: 'garra', acc: { tipo: 'golpe', n: 'Zarpazo', e: '⛏️', v: 3, el: 'perforar' } }],
    brazoD: ['Pala', { vida: 5, forma: 'pala', acc: { tipo: 'escudo', n: 'Palada', e: '🛡️', v: 2 } }],
    piernas: ['Orugas de topo', { vida: 7, forma: 'orugas', def: 1, vel: 1 }] } },
  tintero: { n: 'Tintero', e: '🐙', t: 'Pulpo de cañerías. Si lo rompes, se arregla solo… a veces.', color: '#9a4ab0', juego: { cura: 1 }, jt: 'sus reparaciones curan 1 más', piezas: {
    cabeza: ['Cabezón de pulpo', { vida: 4, forma: 'bulbo', acc: { tipo: 'cura', n: 'Regenerar', e: '🐙', v: 2, usos: 3 } }],
    brazoI: ['Tentáculo', { vida: 4, forma: 'tentaculo', acc: { tipo: 'golpe', n: 'Latigazo', e: '🐙', v: 2, el: 'impacto' } }],
    brazoD: ['Chorro de tinta', { vida: 3, forma: 'tubo', acc: { tipo: 'disparo', n: 'Tinta', e: '🫧', v: 2, certero: true } }],
    piernas: ['Ventosas', { vida: 5, forma: 'ventosas', def: 3, vel: 2 }] } },
  embestidor: { n: 'Embestidor', e: '🦏', t: 'Rinoceronte de calderas. No frena: embiste.', color: '#6a7a8a', juego: { golpe: 1 }, jt: 'sus golpes tiran 1 dado más', piezas: {
    cabeza: ['Cuerno de rino', { vida: 5, forma: 'cuerno', acc: { tipo: 'golpe', n: 'Cornada', e: '🦏', v: 2, el: 'perforar' } }],
    brazoI: ['Puño de yunque', { vida: 4, forma: 'yunque', acc: { tipo: 'golpe', n: 'Yunquetazo', e: '🔨', v: 4, usos: 2, el: 'impacto' } }],
    brazoD: ['Placa de rino', { vida: 6, forma: 'placa', acc: { tipo: 'escudo', n: 'Agacharse', e: '🛡️', v: 2 } }],
    piernas: ['Patas de rino', { vida: 5, forma: 'columnas', def: 1, vel: 3 }] } },
  farolera: { n: 'Farolera', e: '✨', t: 'Luciérnaga de feria. De noche se ve desde el pueblo.', color: '#e8e06a', juego: { disparo: 1 }, jt: 'sus disparos tiran 1 dado más', piezas: {
    cabeza: ['Bombilla', { vida: 3, forma: 'bombilla', acc: { tipo: 'apuntar', n: 'Iluminar', e: '💡', v: 2 } }],
    brazoI: ['Rayo de luz', { vida: 3, forma: 'farol', acc: { tipo: 'disparo', n: 'Rayo', e: '⚡', v: 3, el: 'rayo' } }],
    brazoD: ['Farolillo', { vida: 3, forma: 'canon', acc: { tipo: 'disparo', n: 'Bengala', e: '🔥', v: 2, el: 'fuego' } }],
    piernas: ['Alitas de luciérnaga', { vida: 2, forma: 'alas', def: 3, vel: 4 }] } },
  pinchos: { n: 'Pinchos', e: '🦔', t: 'Erizo de clavos. No lo acaricies.', color: '#7a5a3a', juego: { vida: 1 }, jt: '+1 de vida en cada pieza', piezas: {
    cabeza: ['Bola de púas', { vida: 5, forma: 'puas' }],
    brazoI: ['Lanzapúas', { vida: 3, forma: 'remache', acc: { tipo: 'disparo', n: 'Púas', e: '📍', v: 3, usos: 3, el: 'perforar' } }],
    brazoD: ['Hocico', { vida: 4, forma: 'hocico', acc: { tipo: 'golpe', n: 'Hocicazo', e: '👊', v: 2, el: 'impacto' } }],
    piernas: ['Bola rodante', { vida: 4, forma: 'bola', def: 2, vel: 4 }] } },
  babosin: { n: 'Babosín', e: '🐌', t: 'Caracol de calefacción. Lento, pero no hay quien lo rompa.', color: '#8ab05a', juego: { vida: 2 }, jt: '+2 de vida en cada pieza', piezas: {
    cabeza: ['Concha', { vida: 8, forma: 'concha' }],
    brazoI: ['Ojo saltón', { vida: 3, forma: 'ojo', acc: { tipo: 'apuntar', n: 'Asomarse', e: '👀', v: 2 } }],
    brazoD: ['Babero pegajoso', { vida: 4, forma: 'baba', acc: { tipo: 'disparo', n: 'Babazo', e: '🫧', v: 2, piernas: true } }],
    piernas: ['Pie de caracol', { vida: 8, forma: 'babosa', def: 0, vel: 0 }] } },
  salamandra: { n: 'Salamandra', e: '🦎', t: 'Lagartija de estufa. Escupe brasas.', color: '#c83a2a', juego: { disparo: 1 }, jt: 'sus disparos tiran 1 dado más', piezas: {
    cabeza: ['Hocico de estufa', { vida: 4, forma: 'hornillo' }],
    brazoI: ['Escupebrasas', { vida: 3, forma: 'soplete', acc: { tipo: 'disparo', n: 'Brasas', e: '🔥', v: 3, el: 'fuego' } }],
    brazoD: ['Zarpa caliente', { vida: 4, forma: 'zarpa', acc: { tipo: 'golpe', n: 'Zarpazo', e: '🔥', v: 2, el: 'fuego' } }],
    piernas: ['Patas de lagartija', { vida: 4, forma: 'arana', def: 3, vel: 3 }] } },
  dinamo: { n: 'Dínamo', e: '🐹', t: 'Hámster de rueda. Corre y corre, y suelta chispazos.', color: '#e8a86a', juego: { rapidez: 2 }, jt: '+2 de rapidez', piezas: {
    cabeza: ['Orejas de antena', { vida: 4, forma: 'orejas', acc: { tipo: 'disparo', n: 'Chispa', e: '⚡', v: 2, el: 'rayo' } }],
    brazoI: ['Puñito', { vida: 3, forma: 'puno', acc: { tipo: 'golpe', n: 'Puñito', e: '👊', v: 2, el: 'impacto' } }],
    brazoD: ['Bobina', { vida: 3, forma: 'bobina', acc: { tipo: 'disparo', n: 'Descarga', e: '⚡', v: 3, el: 'rayo' } }],
    piernas: ['Rueda de hámster', { vida: 3, forma: 'rueda', def: 2, vel: 5 }] } }
};
// Las piezas de los modelos van con las demás: id = m_<modelo>_<hueco>
for (const [m, M] of Object.entries(MODELOS)) for (const [h, [n, d]] of Object.entries(M.piezas)) {
  PIEZAS[`m_${m}_${h}`] = { hueco: h.startsWith('brazo') ? 'brazo' : h, n, color: M.color, modelo: m, ...d };
}
// El juego completo de un robot (las cuatro del mismo modelo), o null
export function juegoDe(equipo) {
  const m = PIEZAS[equipo?.cabeza]?.modelo;
  return m && ['brazoI', 'brazoD', 'piernas'].every((h) => PIEZAS[equipo[h]]?.modelo === m) ? MODELOS[m] : null;
}
// Un robot salvaje del vertedero: su modelo entero (a veces con una pieza cambiada)
export function salvaje(modelo, nivel) {
  const equipo = { cabeza: `m_${modelo}_cabeza`, brazoI: `m_${modelo}_brazoI`, brazoD: `m_${modelo}_brazoD`, piernas: `m_${modelo}_piernas` };
  return { equipo, nucleo: Object.keys(NUCLEOS)[Math.floor(Math.random() * 4)], nivel };
}

// La liga del ring: vecinos del pueblo con sus cacharros. Ganar a uno abre el siguiente.
export const RIVALES = [
  { quien: 'Pip', robot: 'La Tostadora', nucleo: 'escarabajo', nivel: 1, equipo: { cabeza: 'cab_lata', brazoI: 'br_puno', brazoD: 'br_puno', piernas: 'pi_ruedas' }, frase: '¡Mi tostadora pega más fuerte de lo que tuesta!' },
  { quien: 'Mordo', robot: 'El Yunquecillo', nucleo: 'mantis', nivel: 2, equipo: { cabeza: 'cab_casco', brazoI: 'br_martillo', brazoD: 'br_puno', piernas: 'pi_orugas' }, frase: 'Clonk. Clonk. Eso es todo lo que vas a oír.' },
  { quien: 'Doña Escarcha', robot: 'Calderito', nucleo: 'buho', nivel: 3, equipo: { cabeza: 'cab_cruz', brazoI: 'br_soplete', brazoD: 'br_escudo', piernas: 'pi_patas' }, frase: 'Calderito hierve por dentro. Literalmente.' },
  { quien: 'El Viejo Anzuelo', robot: 'Pescabot', nucleo: 'escarabajo', nivel: 4, equipo: { cabeza: 'cab_radar', brazoI: 'br_canon', brazoD: 'br_pinza', piernas: 'pi_muelle' }, frase: 'Lo pesqué en el río. Venía con instrucciones en otro idioma.' },
  { quien: 'Rufo', robot: 'El Capitán Tornillo', nucleo: 'mantis', nivel: 6, equipo: { cabeza: 'cab_antena', brazoI: 'br_remache', brazoD: 'br_martillo', piernas: 'pi_arana' }, frase: '¡Ningún robot de tierra firme ha vencido al Capitán Tornillo! … Bueno, uno. Pero llovía.' }
];
// El dibujo (los muñecos 3D) está en robots-3d.js
