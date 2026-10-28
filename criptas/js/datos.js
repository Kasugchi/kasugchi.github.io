// =============================================================
//  DATOS DEL JUEGO
//  Todo lo que es "contenido" (héroes, monstruos, armas, hechizos,
//  cartas de tesoro, mobiliario) vive aquí. El motor solo lee estas
//  tablas, así que puedes equilibrar el juego sin tocar las reglas.
// =============================================================

// ---------- Tablero ----------
// 26 x 19 casillas. '.' = pasillo, cada letra = una sala distinta.
// Las paredes no se dibujan aquí: existen automáticamente entre dos
// casillas de distinta región (salvo que haya una puerta).
export const TABLERO_CLASICO = [
  '..........................', // 0
  '.AAA.BBBBB.CCCC.DDD.EEEEE.', // 1
  '.AAA.BBBBB.CCCC.DDD.EEEEE.', // 2
  '.AAA.BBBBB.CCCC.DDD.EEEEE.', // 3
  '.AAA.BBBBB.CCCC.DDD.EEEEE.', // 4
  '..........................', // 5
  '.FFFFF.GGGGGGGGGGGG.HHHHH.', // 6
  '.FFFFF.GGGGGGGGGGGG.HHHHH.', // 7
  '.FFFFF.GGGGGGGGGGGG.HHHHH.', // 8
  '.OOOOO.GGGGGGGGGGGG.NNNNN.', // 9
  '.OOOOO.GGGGGGGGGGGG.NNNNN.', // 10
  '.OOOOO.GGGGGGGGGGGG.NNNNN.', // 11
  '..........................', // 12
  '.IIIII.JJJ.KKKK.LLLLL.MMM.', // 13
  '.IIIII.JJJ.KKKK.LLLLL.MMM.', // 14
  '.IIIII.JJJ.KKKK.LLLLL.MMM.', // 15
  '.IIIII.JJJ.KKKK.LLLLL.MMM.', // 16
  '.IIIII.JJJ.KKKK.LLLLL.MMM.', // 17
  '..........................'  // 18
];
// Plano activo. Cada misión puede traer el suyo (ver js/planos.js); lo cambia
// tablero.js › usarPlano. Son «let» exportados: quien los importa ve siempre el actual.
export let TABLERO = TABLERO_CLASICO;
export let ANCHO = 26, ALTO = 19;
export function fijarPlano(filas) {
  ANCHO = Math.max(...filas.map((f) => f.length));
  ALTO = filas.length;
  TABLERO = filas.map((f) => f.padEnd(ANCHO, '#'));
}

// Suelo de cada sala: color y dibujo de baldosa, para que cada una se reconozca.
// dibujos: losas | damero | rombos | ladrillo | grietas | tablas
export const SUELOS = {
  '.': { c: [196, 186, 168], p: 'pasillo' },
  A: { c: [150, 96, 58],  p: 'tablas' },
  B: { c: [176, 70, 58],  p: 'losas' },
  C: { c: [104, 158, 160], p: 'grietas' },
  D: { c: [176, 74, 52],  p: 'grietas' },
  E: { c: [196, 140, 60], p: 'ladrillo' },
  F: { c: [118, 124, 132], p: 'losas' },
  O: { c: [150, 170, 60], p: 'grietas' },
  G: { c: [92, 82, 74],   p: 'losas' },
  H: { c: [176, 180, 196], p: 'damero' },
  N: { c: [150, 168, 64], p: 'grietas' },
  I: { c: [188, 160, 52], p: 'losas' },
  J: { c: [110, 160, 168], p: 'rombos' },
  K: { c: [176, 84, 66],  p: 'ladrillo' },
  L: { c: [170, 120, 104], p: 'losas' },
  M: { c: [78, 140, 64],  p: 'grietas' }
};

const DIBUJOS_SUELO = ['losas', 'damero', 'rombos', 'ladrillo', 'grietas', 'tablas'];
export function sueloDe(r) {
  if (SUELOS[r]) return SUELOS[r];
  let h = 0; for (const ch of String(r)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const tonos = [[150, 96, 58], [176, 70, 58], [104, 158, 160], [196, 140, 60], [118, 124, 132], [150, 170, 60], [92, 82, 74], [176, 180, 196], [188, 160, 52], [110, 160, 168], [170, 120, 104], [78, 140, 64], [130, 100, 150], [160, 130, 90]];
  return (SUELOS[r] = { c: tonos[h % tonos.length], p: DIBUJOS_SUELO[(h >>> 4) % DIBUJOS_SUELO.length] });
}

// ---------- Dado de combate ----------
// 6 caras: 3 calaveras, 2 escudos blancos (defienden héroes) y 1 escudo negro (defiende monstruos).
export const CARAS = ['calavera', 'calavera', 'calavera', 'escudo', 'escudo', 'escudoNegro'];

// ---------- Héroes ----------
export const HEROES = {
  barbaro: {
    nombre: 'Bárbaro', icono: 'barbaro', color: '#a8322a', fem: { nombre: 'Bárbara', icono: 'barbaro' },
    defensa: 2, cuerpo: 8, mente: 2, arma: 'espadaAncha', elementos: [],
    lema: 'El guerrero más fuerte. Mucho cuerpo, poca mente.'
  },
  enano: {
    nombre: 'Enano', icono: 'enano', color: '#b07a2a', fem: { nombre: 'Enana', icono: 'enano' },
    defensa: 3, cuerpo: 7, mente: 3, arma: 'espadaCorta', elementos: [],
    lema: 'Duro como la roca. Desarma trampas sin riesgo.', desarmaSiempre: true
  },
  elfo: {
    nombre: 'Elfo', icono: 'elfo', color: '#2f7d4f', fem: { nombre: 'Elfa', icono: 'elfa' },
    defensa: 2, cuerpo: 6, mente: 4, arma: 'espadaCorta', elementos: ['tierra'],
    lema: 'Espada y magia de la tierra.'
  },
  mago: {
    nombre: 'Mago', icono: 'mago', color: '#3a5aa8', fem: { nombre: 'Maga', icono: 'mago' },
    defensa: 2, cuerpo: 4, mente: 6, arma: 'daga', elementos: ['fuego', 'aire', 'agua'],
    lema: 'Frágil, pero domina tres elementos.', sinArmadura: true
  }
};
export const ORDEN_HEROES = ['barbaro', 'enano', 'elfo', 'mago'];

// ---------- Monstruos ----------
// mov: casillas por turno. nomuerto: inmune a Sueño.
export const MONSTRUOS = {
  trasgo:    { nombre: 'Trasgo',          icono: 'trasgo',    color: '#4f7a2a', mov: 10, ataque: 2, defensa: 1, cuerpo: 1, mente: 1 },
  orco:      { nombre: 'Orco',            icono: 'orco',      color: '#3f6b3a', mov: 8,  ataque: 3, defensa: 2, cuerpo: 1, mente: 2 },
  esqueleto: { nombre: 'Esqueleto',       icono: 'esqueleto', color: '#8a8270', mov: 6,  ataque: 2, defensa: 2, cuerpo: 1, mente: 0, nomuerto: true },
  zombi:     { nombre: 'Zombi',           icono: 'zombi',     color: '#5d6b4a', mov: 5,  ataque: 2, defensa: 3, cuerpo: 1, mente: 0, nomuerto: true },
  momia:     { nombre: 'Momia',           icono: 'momia',     color: '#9a8a62', mov: 4,  ataque: 3, defensa: 4, cuerpo: 2, mente: 0, nomuerto: true },
  guerrero:  { nombre: 'Guerrero oscuro', icono: 'guerrero',  color: '#3a3440', mov: 7,  ataque: 3, defensa: 4, cuerpo: 1, mente: 3 },
  gargola:   { nombre: 'Gárgola',         icono: 'gargola',   color: '#5c5f66', mov: 6,  ataque: 4, defensa: 5, cuerpo: 3, mente: 4 },
  hechicero: { nombre: 'Hechicero',       icono: 'hechicero', color: '#5a2a6a', mov: 6,  ataque: 2, defensa: 3, cuerpo: 4, mente: 6, poder: 'invocar' },
  // Enemigos con poder: hacen algo propio y, si el mago los posee, ese poder es suyo.
  chaman:      { nombre: 'Chamán orco',          icono: 'orco',      color: '#7a5a1a', mov: 6,  ataque: 2, defensa: 2, cuerpo: 2, mente: 2, poder: 'curar' },
  sacerdotisa: { nombre: 'Sacerdotisa de hueso', icono: 'fantasma',  color: '#c8c0a8', mov: 5,  ataque: 2, defensa: 3, cuerpo: 3, mente: 4, nomuerto: true, poder: 'alzar' },
  ilusionista: { nombre: 'Ilusionista',          icono: 'reflejo',   color: '#4a5ab0', mov: 6,  ataque: 2, defensa: 2, cuerpo: 2, mente: 4, poder: 'senuelo' },
  ojo:         { nombre: 'Ojo flotante',         icono: 'ojo',       color: '#8a3a5a', mov: 4,  ataque: 1, defensa: 2, cuerpo: 2, mente: 2, poder: 'vision' },
  bruja:       { nombre: 'Bruja de la plaga',    icono: 'telarana',  color: '#4a6a2a', mov: 6,  ataque: 2, defensa: 2, cuerpo: 3, mente: 4, poder: 'veneno' },
  bestias:     { nombre: 'Señor de las bestias', icono: 'orco',      color: '#6a3a2a', mov: 7,  ataque: 3, defensa: 3, cuerpo: 3, mente: 2, poder: 'lobos' },
  lobo:        { nombre: 'Lobo',                 icono: 'trasgo',    color: '#6a6a6a', mov: 12, ataque: 2, defensa: 1, cuerpo: 1, mente: 0 },
  mercader:    { nombre: 'Mercader errante',     icono: 'mochila',   color: '#8a6a2a', mov: 8,  ataque: 5, defensa: 4, cuerpo: 8, mente: 3 },
  fantasma:    { nombre: 'Fantasma',             icono: 'fantasma',  color: '#7a8aa0', mov: 7,  ataque: 3, defensa: 2, cuerpo: 4, mente: 3, nomuerto: true },
  corazon:     { nombre: 'Corazón de la Mazmorra', icono: 'ojo',     color: '#9a1a2a', mov: 0,  ataque: 4, defensa: 4, cuerpo: 18, mente: 8 },
  golem:       { nombre: 'Gólem rúnico',         icono: 'piedra',    color: '#6a7a8a', mov: 3,  ataque: 4, defensa: 4, cuerpo: 6, mente: 0, poder: 'embestir' },
  // Limbo (rescate de un héroe caído). El espíritu del compañero copia sus dados y su cuerpo al crearse.
  espirituCaido: { nombre: 'Espíritu',          icono: 'fantasma',  color: '#6aa8d8', mov: 6,  ataque: 3, defensa: 2, cuerpo: 8, mente: 3, nomuerto: true },
  almaPena:    { nombre: 'Alma en pena',         icono: 'fantasma',  color: '#5a7a9a', mov: 3,  ataque: 2, defensa: 2, cuerpo: 3, mente: 3, nomuerto: true },
  ojoCastigo:  { nombre: 'Ojo del Castigo',      icono: 'ojo',       color: '#b8d8ff', mov: 4,  ataque: 0, defensa: 9, cuerpo: 1, mente: 0 },
  carcelero:   { nombre: 'El Carcelero',         icono: 'calavera',  color: '#2a3a4a', mov: 4,  ataque: 5, defensa: 4, cuerpo: 8, mente: 4 }
};

// ---------- Armería ----------
// ataque: dados de ataque. diagonal: puede atacar en diagonal. distancia: ataca a lo que ve (no adyacente).
export const ARMAS = {
  daga:        { nombre: 'Daga',          ataque: 1, precio: 25,  icono: 'espada' },
  baston:      { nombre: 'Bastón',        ataque: 1, precio: 100, icono: 'baston', diagonal: true },
  espadaCorta: { nombre: 'Espada corta',  ataque: 2, precio: 150, icono: 'espada' },
  lanza:       { nombre: 'Lanza',         ataque: 2, precio: 150, icono: 'lanza', diagonal: true },
  espadaAncha: { nombre: 'Espada ancha',  ataque: 3, precio: 250, icono: 'espada' },
  espadaLarga: { nombre: 'Espada larga',  ataque: 3, precio: 350, icono: 'espada', diagonal: true },
  ballesta:    { nombre: 'Ballesta',      ataque: 3, precio: 350, icono: 'ballesta', distancia: true },
  hacha:       { nombre: 'Hacha de guerra', ataque: 4, precio: 450, icono: 'hacha', dosManos: true },
  // pesada: hay que plantarla para disparar, así que no se puede mover y atacar en el mismo turno.
  ballestaPesada: { nombre: 'Ballesta pesada', ataque: 4, precio: 600, icono: 'ballesta', distancia: true, dosManos: true, pesada: true },
  // minPiso: solo en la Mazmorra Infinita, a partir de ese piso.
  espadaRunica: { nombre: 'Espada rúnica', ataque: 5, precio: 1100, icono: 'espada', diagonal: true, minPiso: 5 },
  // ---- Solo las vende el mercader errante (Mazmorra Infinita). Cada una con su ventaja y su pega. ----
  hachaSedienta: { nombre: 'Hacha sedienta', ataque: 5, precio: 1200, icono: 'hacha', dosManos: true, mercader: true, sed: true,
    bueno: 'Cada monstruo que matas te cura 1 de cuerpo.', malo: 'Si acabas el turno con monstruos a la vista sin haber atacado, pierdes 1 de cuerpo (nunca por debajo de 1).' },
  espadaAvaro: { nombre: 'Espada del avaro', ataque: 4, precio: 900, icono: 'espada', mercader: true, avaro: true,
    bueno: 'Cada monstruo que matas te da 15 monedas.', malo: 'Al entrar en cada piso se come el 10 % de tu bolsa.' },
  dagaSusurrante: { nombre: 'Daga susurrante', ataque: 3, precio: 800, icono: 'espada', mercader: true, perfora: 1, mente: -1,
    bueno: 'El enemigo defiende con un dado menos. El mago también la puede llevar.', malo: '−1 de mente: pierdes más fácil los duelos de mentes.' },
  martilloTrueno: { nombre: 'Martillo del trueno', ataque: 4, precio: 1000, icono: 'hacha', dosManos: true, mercader: true, empuja: true, ruido: true,
    bueno: 'Si el enemigo sobrevive, el golpe lo empuja una casilla hacia atrás.', malo: 'Cada golpe tiene 1 entre 6 de atraer a un monstruo errante.' },
  arcoHueso: { nombre: 'Arco de hueso', ataque: 3, precio: 900, icono: 'ballesta', distancia: true, dosManos: true, mercader: true, atraviesa: true, cebo: 'nomuertos',
    bueno: 'Dispara a distancia y la flecha sigue hasta el siguiente enemigo en línea recta.', malo: 'Los no muertos van a por ti antes que a por nadie.' },
  lanzaMartir: { nombre: 'Lanza del mártir', ataque: 4, precio: 1000, icono: 'lanza', diagonal: true, alcance: 2, mercader: true, sinCuras: true,
    bueno: 'Alcanza a 2 casillas en línea recta, y también en diagonal.', malo: 'Nadie te puede curar en la mazmorra: ni hechizos, ni altares, ni compañeros. Solo pociones.' },
  hojaReyCaido: { nombre: 'Hoja del rey caído', ataque: 6, precio: 1600, icono: 'espadaAltar', dosManos: true, mercader: true, maldita: true, cuerpoMax: -2,
    bueno: 'La más fuerte del juego.', malo: 'Maldita: −2 de cuerpo máximo mientras la llevas, y no te la puedes quitar hasta purificarla (Diosa de la suerte o un sacerdote).' }
};
export const ARMADURAS = {
  casco:   { nombre: 'Casco',           defensa: 1, precio: 125, icono: 'casco' },
  escudo:  { nombre: 'Escudo',          defensa: 1, precio: 150, icono: 'rodela', manos: true },
  cota:    { nombre: 'Cota de malla',   defensa: 1, precio: 450, icono: 'armadura' },
  placas:  { nombre: 'Armadura de placas', defensa: 2, precio: 850, icono: 'armadura', lenta: true },
  cotaElfica: { nombre: 'Cota élfica',    defensa: 2, precio: 1200, icono: 'armadura', minPiso: 4 },
  // Solo las vende el mercader. «ligera»: también el mago puede llevarla.
  capaSombras: { nombre: 'Capa de sombras', defensa: -1, precio: 700, icono: 'fantasma', mercader: true, ligera: true, capa: true,
    bueno: 'Empiezas cada piso invisible durante la primera ronda.', malo: '−1 dado de defensa.' },
  amuletoGloton: { nombre: 'Amuleto del glotón', defensa: 0, precio: 600, icono: 'pocion', mercader: true, ligera: true, gloton: true,
    bueno: 'Las pociones curativas curan el doble.', malo: 'Solo puedes llevar 2 pociones encima.' }
};
export const OBJETOS_TIENDA = {
  kit:         { nombre: 'Herramientas', precio: 250, icono: 'llave', desc: 'Permite desarmar trampas.' },
  pocionCurar: { nombre: 'Poción curativa', precio: 150, icono: 'pocion', desc: 'Recupera hasta 6 de cuerpo.' }
};
export const MAGO_ARMAS = ['daga', 'baston', 'dagaSusurrante'];

// ---------- Mazmorra Infinita: niveles y habilidades ----------
// Experiencia total para llegar a cada nivel: 10, 25, 45, 70, 100…
export const xpParaNivel = (n) => (5 * (n - 1) * (n + 2)) / 2;
export const NIVEL_HABILIDAD = 3;
export const MEJORAS = {
  cuerpo:  { nombre: '+1 de cuerpo',            max: 4 },
  ataque:  { nombre: '+1 dado de ataque',       max: 2 },
  defensa: { nombre: '+1 dado de defensa',      max: 2 },
  mente:   { nombre: '+1 de mente',             max: 3 }
};
// Subclases: se eligen al llegar al nivel 3 y traen su habilidad (una vez por piso).
// mods: cambios fijos de estadísticas. objetivo: qué hay que tocar al usarla.
export const SUBCLASES = {
  enano: {
    guardian:  { nombre: 'Guardián', papel: 'Protege', mods: { defensa: 1 },
      bueno: '+1 dado de defensa siempre.', malo: 'Al usar el Escudo de piedra queda petrificado: 2 turnos moviendo con 1 dado, y el siguiente no puede atacar.',
      hab: { id: 'escudoPiedra', nombre: 'Escudo de piedra', icono: 'rodela', objetivo: 'heroe',
        desc: 'Un compañero pegado a ti (o tú) no recibe ningún daño hasta tu próximo turno.' },
      extra: [{ id: 'runaBaluarte', nombre: 'Runa del baluarte', icono: 'rodela', objetivo: 'ninguno', runas: 2, sinLimite: true, sinAccion: true,
        desc: '2 runas, sin gastar acción: los compañeros pegados a ti tiran +1 dado de defensa hasta tu próximo turno.' }] },
    minero:    { nombre: 'Minero', papel: 'Utilidad', mods: {}, ventrampas: true,
      bueno: 'Ve las trampas y las puertas secretas de cada sala al entrar.', malo: 'Rompepiedras hace ruido: atrae seguro a un monstruo errante y queda medio sordo 2 turnos (−1 defensa).',
      hab: { id: 'rompepiedras', nombre: 'Rompepiedras', icono: 'derrumbe', objetivo: 'lista',
        desc: 'Revienta un derrumbe o un muro frágil pegado a ti; la metralla hace 1 de daño a los enemigos pegados.' },
      extra: [{ id: 'runaBusqueda', nombre: 'Runa del rastro', icono: 'buscar', objetivo: 'ninguno', runas: 1, sinLimite: true, sinAccion: true,
        desc: '1 runa, sin gastar acción: descubre todas las trampas que tengas a la vista.' }] },
    berserker: { nombre: 'Berserker', papel: 'Daño', mods: {}, arma: 'hacha',
      bueno: 'Empieza con hacha de guerra.', malo: 'Durante la furia no tira defensa, no puede alejarse de los enemigos y a 1 de cuerpo ataca a lo que tenga al lado; al acabar, 2 turnos agotado (1 dado de movimiento y −1 de ataque).',
      hab: { id: 'furiaEnana', nombre: 'Furia enana', icono: 'hacha', objetivo: 'monstruo',
        desc: 'Ataca dos veces ahora y durante 3 turnos cada ataque es doble.' },
      extra: [{ id: 'runaSangre', nombre: 'Runa de sangre', icono: 'pocion', objetivo: 'ninguno', runas: 2, sinLimite: true, sinAccion: true,
        desc: '2 runas, sin gastar acción: en tu próximo ataque recuperas 1 de cuerpo por cada punto de daño que hagas.' }] }
  },
  barbaro: {
    campeon:   { nombre: 'Campeón', papel: 'Líder', mods: {}, cuerpoExtra: 1,
      bueno: '+1 de cuerpo máximo.', malo: 'Al gritar, 2 turnos con todos los monstruos a la vista yendo a por él y −1 de defensa.',
      hab: { id: 'grito', nombre: 'Grito de guerra', icono: 'fuego', objetivo: 'ninguno',
        desc: 'Todo el grupo tira +1 dado de ataque durante 2 turnos.' },
      extra: [{ id: 'estandarte', nombre: 'Estandarte', icono: 'corona', objetivo: 'ninguno', rabia: 3, sinLimite: true, sinAccion: true,
        desc: '3 de rabia, sin gastar acción: los héroes de tu sala tiran +1 dado de defensa hasta su próximo turno.' }] },
    gemelas:   { nombre: 'Espadas gemelas', papel: 'Daño', mods: {}, gemelas: true,
      bueno: '+1 dado de ataque si no lleva escudo.', malo: 'Tras el Doble tajo, 2 turnos agotado (1 dado de movimiento y −1 defensa); si lo usa agotado, pierde 2 de cuerpo. Con escudo no puede usarlo.',
      hab: { id: 'dobleTajo', nombre: 'Doble tajo', icono: 'espada', objetivo: 'monstruo',
        desc: 'Ataca dos veces; si el primero cae, el segundo golpe va a otro enemigo pegado.' },
      extra: [{ id: 'torbellino', nombre: 'Torbellino', icono: 'remolino', objetivo: 'ninguno', rabia: 4, sinLimite: true,
        desc: '4 de rabia: gira con las dos espadas y ataca a todos los enemigos pegados a ti.' }] },
    cazador:   { nombre: 'Cazador', papel: 'A distancia', mods: {}, arma: 'ballesta',
      bueno: 'Empieza con ballesta.', malo: 'El turno del Disparo doble ya no se mueve, y los 2 siguientes recarga (−1 dado a distancia).',
      hab: { id: 'disparoDoble', nombre: 'Disparo doble', icono: 'ballesta', objetivo: 'monstruo',
        desc: 'Dos disparos de 3 dados a enemigos a la vista que no estén pegados.' },
      extra: [{ id: 'certero', nombre: 'Tiro certero', icono: 'ojo', objetivo: 'ninguno', rabia: 2, sinLimite: true, sinAccion: true,
        desc: '2 de rabia, sin gastar acción: tu próximo disparo a distancia no deja defenderse al monstruo.' }] }
  },
  elfo: {
    arquero:   { nombre: 'Arquero lunar', papel: 'Tirador', mods: {}, arquero: true,
      bueno: '+1 dado al atacar a distancia.', malo: 'La Flecha de luna se cobra un hechizo de su lista y el movimiento que le quede.',
      hab: { id: 'flechaLuna', nombre: 'Flecha de luna', icono: 'ballesta', objetivo: 'monstruo',
        desc: 'Elige un enemigo en tu misma fila o columna: la flecha da a todos los de esa línea hasta la pared (3 dados cada uno).' },
      extra: [{ id: 'ojoHalcon', nombre: 'Ojo de halcón', icono: 'ojo', objetivo: 'ninguno', armonia: 2, sinLimite: true, sinAccion: true,
        desc: '2 de armonía, sin gastar acción: tu próximo ataque a distancia tira +2 dados.' }] },
    sombras:   { nombre: 'Caminante de sombras', papel: 'Sigilo', mods: {}, sigilo: true,
      bueno: '+1 dado contra monstruos pegados a otro héroe.', malo: 'Al salir de las sombras queda marcado 2 turnos: los monstruos van a por él y tiene −1 de defensa.',
      hab: { id: 'sombras', nombre: 'Fundirse en sombras', icono: 'fantasma', objetivo: 'ninguno',
        desc: 'Invisible 2 turnos: los monstruos le ignoran. Su primer ataque desde las sombras hace el doble y le hace visible.' },
      extra: [{ id: 'traicion', nombre: 'Golpe a traición', icono: 'espada', objetivo: 'ninguno', armonia: 2, sinLimite: true, sinAccion: true,
        desc: '2 de armonía, sin gastar acción: si tu próximo ataque es contra un monstruo pegado a otro héroe, hace el doble de daño.' }] },
    bosque:    { nombre: 'Guardián del bosque', papel: 'Cambiaformas', mods: {}, raicesLargas: true,
      bueno: 'Sus Raíces duran un turno más.', malo: 'Como oso no lanza hechizos ni usa objetos; al volver pierde el turno y 2 turnos más sin hechizos.',
      hab: { id: 'oso', nombre: 'Forma de oso', icono: 'tierra', objetivo: 'ninguno',
        desc: '3 turnos: +3 de cuerpo y +2 dados de ataque.' },
      extra: [{ id: 'zarzas', nombre: 'Zarzas', icono: 'tierra', objetivo: 'ninguno', armonia: 2, sinLimite: true,
        desc: '2 de armonía: brotan zarzas y los enemigos pegados a ti no pueden moverse en su próximo turno.' }] }
  },
  mago: {
    hechicero: { nombre: 'Hechicero', papel: 'Control', mods: { mente: 1 },
      bueno: '+1 de mente.', malo: 'Mientras posee, su cuerpo queda en trance; al volver, 2 turnos mareado (1 dado de movimiento y −1 defensa).',
      hab: { id: 'posesion', nombre: 'Posesión', icono: 'mente', objetivo: 'monstruo',
        desc: 'Mete su alma en un enemigo a la vista (no un jefe). Los de mente fuerte se resisten con un duelo de mentes, y si pierdes, él te controla a ti. Si golpean tu cuerpo, vuelves de golpe; si muere, tu alma queda atrapada en el monstruo.' },
      extra: [{ id: 'orden', nombre: 'Orden mental', icono: 'mente', objetivo: 'monstruo', menteCoste: 2, sinLimite: true,
        desc: '2 de mente: un enemigo a la vista (no un jefe) golpea a otro que tenga pegado.' }] },
    nigromante: { nombre: 'Nigromante', papel: 'Muertos', mods: {}, almas: true,
      bueno: 'Recoge fragmentos de alma de los enemigos que mueren en su misma sala (máx. 6). Cambia sus 9 hechizos por 4 oscuros.', malo: 'Si cae a 1 de cuerpo, sus esqueletos se vuelven contra él; revivir atrae a un monstruo errante; los fragmentos se pierden al acabar el piso.',
      hab: { id: 'alzar', nombre: 'Alzar muerto', icono: 'esqueleto', objetivo: 'cadaver', coste: 2, sinLimite: true,
        desc: '2 fragmentos y un dado: 1, se levanta un esqueleto rebelde contra vosotros; 2, el alma se escapa; 3-4, esqueleto aliado 3 turnos; 5, esqueleto resistente 4 turnos; 6, vuelve el propio monstruo (al menos 3 de cuerpo) a vuestro servicio 4 turnos.' },
      extra: [
        { id: 'cosecha', nombre: 'Cosecha', icono: 'curar', objetivo: 'heroe', coste: 2, sinLimite: true, sinAccion: true, desc: '2 fragmentos y un dado, sin gastar acción: tú o un compañero de tu sala recuperáis 1 de cuerpo (3-5) o 2 (6); con 1-2 el alma se escapa.' },
        { id: 'tumba', nombre: 'Volver de la tumba', icono: 'calavera', objetivo: 'caido', coste: 5, desc: '5 fragmentos, una vez por piso: revive a un héroe caído con la mitad de su cuerpo (−1 de cuerpo máximo el resto del piso).' }
      ] },
    sacerdote: { nombre: 'Sacerdote', papel: 'Apoyo', mods: {}, luz: true,
      bueno: 'Magia de luz: Purgatorio, Luz sanadora y Bendición. Puede llevar daga o bastón.', malo: 'Tras el Santuario, Ayuno sagrado: pierde 1D6 de cuerpo (nunca por debajo de 1) y 2 turnos sin atacar ni lanzar hechizos. Contra vivos su luz hace la mitad.',
      hab: { id: 'santuario', nombre: 'Santuario', icono: 'altar', objetivo: 'ninguno',
        desc: 'Hasta tu próximo turno, ningún monstruo puede atacar a los héroes de tu sala.' },
      extra: [{ id: 'esperanza', nombre: 'Luz de esperanza', icono: 'curar', objetivo: 'ninguno', menteCoste: 2, sinLimite: true, sinAccion: true,
        desc: '2 de tu mente, sin gastar acción: los demás héroes de tu sala recuperan 1 de mente y se les pasa el veneno.' }] }
  }
};
// Hechizos de luz del sacerdote (sustituyen a los elementales al especializarse).
export const HECHIZOS_LUZ = ['purgatorio', 'purgatorio', 'luzSanadora', 'luzSanadora', 'bendicion'];
// Hechizos oscuros del nigromante (sustituyen a los nueve elementales al especializarse).
export const HECHIZOS_OSCUROS = ['toqueTumba', 'drenar', 'terror', 'pacto'];
// Altares de la Mazmorra Infinita: cada uno de un dios con su carácter.
export const DIOSES = {
  guerra:   { nombre: 'Dios de la guerra', desc: 'Pide sangre: 2 de cuerpo a cambio de +1 dado de ataque o de defensa el resto del piso.' },
  suerte:   { nombre: 'Diosa de la suerte', desc: 'Una ruleta: puede curar al grupo, dar oro o una reliquia… o traer una maldición o un monstruo.' },
  avaricia: { nombre: 'Dios de la avaricia', desc: 'Pide oro. Cuanto más le das, mejor responde.' }
};
// Lo que puede llevar el mercader errante (se eligen 3 al azar en cada piso).
export const MERCANCIA = {
  espadaRunica:    { tipo: 'arma', precio: 1400 },
  cotaElfica:      { tipo: 'armadura', precio: 1500 },
  ballestaPesada:  { tipo: 'arma', precio: 800 },
  pocionCurar:     { tipo: 'pocion', precio: 200 },
  pocionFuerza:    { tipo: 'pocion', precio: 180 },
  pocionPiedra:    { tipo: 'pocion', precio: 180 },
  pocionVelocidad: { tipo: 'pocion', precio: 150 },
  pergamino:       { tipo: 'especial', precio: 300, nombre: 'Pergamino de sabiduría', desc: '+15 de experiencia.' },
  pieza:           { tipo: 'especial', precio: 500, nombre: 'Pieza de reliquia', desc: 'Una pieza de reliquia que os falta.' }
};
// Maldiciones que el Corazón de la Mazmorra lanza sobre algunos pisos.
export const MALDICIONES = {
  oscuridad:   { nombre: 'Oscuridad', desc: 'Solo veis a 3 casillas, y las salas no se descubren hasta que entráis.' },
  inundado:    { nombre: 'Inundado', desc: 'El agua os frena: 2 casillas menos en cada tirada de movimiento.' },
  fiebreOro:   { nombre: 'Fiebre del oro', desc: 'Todo el oro vale el doble… pero hay más trampas.' },
  sinDescanso: { nombre: 'Sin descanso', desc: 'Los monstruos están inquietos: se mueven la mitad más.' }
};
export const DIFICULTADES = {
  aventurero: { nombre: 'Aventurero', desc: 'Si caéis todos, volvéis al campamento y repetís el piso (perdiendo la bolsa).' },
  heroe:      { nombre: 'Héroe', desc: 'Si caéis todos, se acaba la partida.' },
  leyenda:    { nombre: 'Leyenda', desc: 'Si caéis todos, se acaba. Y el héroe que cae, cae para siempre.' }
};
export const EPITETOS = ['Rabioso', 'Viejo', 'Tuerto', 'Sanguinario', 'de Hierro', 'Maldito', 'Despiadado', 'Hambriento'];

// ---------- Reliquias (del grupo, se guardan toda la campaña) ----------
// Cada reliquia se forma al juntar dos piezas. Las piezas se encuentran como
// tesoro fijo de una misión ("reliquia": "mecha") o en la Mazmorra Perdida.
export const PIEZAS = {
  escritos:      { nombre: 'Escritos Antiguos',          pista: 'Hablan de una trompeta capaz de derribar murallas…' },
  trompeta:      { nombre: 'Trompeta Ancestral',         pista: 'Está cubierta de runas que nadie sabe leer.' },
  mecha:         { nombre: 'Mecha Eterna',               pista: 'Arde sin consumirse, pero no da luz por sí sola.' },
  farolHierro:   { nombre: 'Farol de Hierro',            pista: 'Un farol oxidado al que le falta la mecha.' },
  grillete1:     { nombre: 'Grillete del Hermano Mayor', pista: 'Lleva grabado un nombre y media cadena rota.' },
  grillete2:     { nombre: 'Grillete del Hermano Menor', pista: 'La otra mitad de alguna cadena.' },
  umbo:          { nombre: 'Umbo de Bronce',             pista: 'El centro de un escudo legendario, sin correas.' },
  correas:       { nombre: 'Correas del Centinela',      pista: 'Cuero viejo que todavía aguanta. ¿De qué escudo serán?' },
  aguja:         { nombre: 'Aguja Imantada',             pista: 'Tiembla sola, como si buscara algo.' },
  cajaHueso:     { nombre: 'Caja de Hueso',              pista: 'Una cajita con una rosa de los vientos tallada. Vacía.' },
  caliz1:        { nombre: 'Mitad Dorada del Cáliz',     pista: 'Media copa. La otra mitad debe de andar por ahí.' },
  caliz2:        { nombre: 'Mitad Negra del Cáliz',      pista: 'Media copa negra que encaja con algo.' },
  badajo:        { nombre: 'Badajo de Plomo',            pista: 'Pesa demasiado para su tamaño.' },
  campanaRajada: { nombre: 'Campana Rajada',             pista: 'Una campana sin badajo. Los muertos le tienen miedo.' }
};
export const RELIQUIAS = {
  jerico:  { nombre: 'Trompa de Jericó', piezas: ['escritos', 'trompeta'], icono: 'viento',
    desc: 'Solo el mago, una vez por misión, con alguien pegado delante que la sujete: Estruendo (los enemigos de esa línea pierden su turno) o derribar un muro frágil.' },
  farol:   { nombre: 'Farol de los Ahogados', piezas: ['mecha', 'farolHierro'], icono: 'antorcha',
    desc: 'Una vez por misión: quien lo enciende ve las trampas y puertas secretas de cada sala que pisa hasta el final de la misión. Pero brilla: los monstruos que lo ven van a por él primero.' },
  cadena:  { nombre: 'Cadena de Hermanos', piezas: ['grillete1', 'grillete2'], icono: 'verja',
    desc: 'Una vez por misión, con otro héroe pegado: quedáis encadenados hasta el final de la misión y os repartís el daño. Si uno se aleja más de 2 casillas, la cadena da un tirón y el otro no podrá moverse en su turno.' },
  escudo:  { nombre: 'Escudo del Último Muro', piezas: ['umbo', 'correas'], icono: 'rodela',
    desc: 'Una vez por misión: te plantas y ningún monstruo puede entrar en tu casilla ni en las de alrededor hasta tu próximo turno. Mientras, no puedes moverte.' },
  brujula: { nombre: 'Brújula del Desertor', piezas: ['aguja', 'cajaHueso'], icono: 'ojo',
    desc: 'Antes de moverte: la aguja señala el objetivo más cercano (o la salida). A cambio, ese turno no te mueves.' },
  caliz:   { nombre: 'Cáliz Partido', piezas: ['caliz1', 'caliz2'], icono: 'pocion',
    desc: 'Al beber de un caldero puedes elegir el efecto en vez de tirar el dado, a cambio de 1 de cuerpo máximo hasta acabar la misión.' },
  campana: { nombre: 'Campana de los Muertos', piezas: ['badajo', 'campanaRajada'], icono: 'calavera',
    desc: 'Una vez por misión: los no muertos a la vista vuelven a su sitio y pierden su turno. Pero suena en toda la mazmorra y atrae a un monstruo errante.' }
};

// ---------- Cargador ----------
// Se contrata en la armería para una misión. Lleva el almacén del grupo.
export const CARGADOR = { precio: 100, cuerpo: 2, defensa: 2, dados: 2, color: '#7a5a34', icono: 'cargador' };

// ---------- Pociones y objetos ----------
export const POCIONES = {
  pocionCurar:     { nombre: 'Poción curativa',  icono: 'pocion',  desc: 'Recupera 1D6 de cuerpo. Se bebe sola si vas a morir.' },
  pocionFuerza:    { nombre: 'Poción de fuerza', icono: 'pocion2', desc: '+2 dados en tu próximo ataque.' },
  pocionVelocidad: { nombre: 'Poción de rapidez', icono: 'pocion2', desc: 'Dobla tu próxima tirada de movimiento.' },
  pocionPiedra:    { nombre: 'Elixir de piedra', icono: 'pocion2', desc: '+2 dados de defensa hasta que te hieran.' }
};

// ---------- Hechizos ----------
// objetivo: 'monstruo' (a la vista), 'heroe' (a la vista, incluido tú).
export const ELEMENTOS = {
  fuego: { nombre: 'Fuego', icono: 'fuego', color: '#d9572a' },
  aire:  { nombre: 'Aire',  icono: 'aire',  color: '#8fb3c9' },
  agua:  { nombre: 'Agua',  icono: 'agua',  color: '#3f86c9' },
  tierra:{ nombre: 'Tierra',icono: 'tierra',color: '#7a8f3a' },
  luz:   { nombre: 'Luz',   icono: 'curar', color: '#e8c25a' },
  oscuro: { nombre: 'Oscuridad', icono: 'calavera', color: '#7a4ab0' }
};
export const HECHIZOS = {
  bolaFuego:  { elemento: 'fuego',  nombre: 'Bola de fuego',  objetivo: 'monstruo', desc: '2 de daño. El monstruo tira 2 dados para salvarse.' },
  llamarada:  { elemento: 'fuego',  nombre: 'Llamarada',      objetivo: 'monstruo', desc: '1 de daño al objetivo y a los monstruos pegados a él.' },
  coraje:     { elemento: 'fuego',  nombre: 'Fuego interior', objetivo: 'heroe',    desc: '+2 dados en el próximo ataque del héroe.' },
  vendaval:   { elemento: 'aire',   nombre: 'Vendaval',       objetivo: 'monstruo', desc: 'El monstruo pierde su próximo turno.' },
  vientoVeloz:{ elemento: 'aire',   nombre: 'Viento veloz',   objetivo: 'heroe',    desc: 'Dobla la próxima tirada de movimiento del héroe.' },
  espiritu:   { elemento: 'aire',   nombre: 'Espíritu del aire', objetivo: 'monstruo', desc: 'Un ataque invisible de 5 dados.' },
  sanar:      { elemento: 'agua',   nombre: 'Agua sanadora',  objetivo: 'heroe',    desc: 'Recupera 4 de cuerpo.' },
  niebla:     { elemento: 'agua',   nombre: 'Velo de niebla', objetivo: 'heroe',    desc: 'Los monstruos ignoran al héroe hasta su próximo turno.' },
  sueno:      { elemento: 'agua',   nombre: 'Sueño profundo', objetivo: 'monstruo', desc: 'El monstruo duerme hasta que le ataquen. No afecta a no muertos.' },
  pielRoca:   { elemento: 'tierra', nombre: 'Piel de roca',   objetivo: 'heroe',    desc: '+2 dados de defensa hasta que el héroe reciba daño.' },
  raices:     { elemento: 'tierra', nombre: 'Raíces',         objetivo: 'monstruo', desc: 'El monstruo no puede moverse durante 2 turnos.' },
  balsamo:    { elemento: 'tierra', nombre: 'Bálsamo de tierra', objetivo: 'heroe', desc: 'Recupera 4 de cuerpo.' },
  purgatorio: { elemento: 'luz', nombre: 'Purgatorio', objetivo: 'monstruo', desc: 'Un dado por cada enemigo a la vista: a los no muertos, una calavera quita 2; a los vivos, 1.' },
  luzSanadora:{ elemento: 'luz', nombre: 'Luz sanadora', objetivo: 'heroe', desc: 'Recupera 4 de cuerpo.' },
  bendicion:  { elemento: 'luz', nombre: 'Bendición', objetivo: 'heroe', desc: '+1 dado de defensa hasta su próximo turno.' },
  toqueTumba: { elemento: 'oscuro', nombre: 'Toque de la tumba', objetivo: 'monstruo', desc: 'Un ataque de 4 dados; si lo mata, su alma es tuya (+1 fragmento).' },
  drenar:     { elemento: 'oscuro', nombre: 'Drenar vida', objetivo: 'monstruo', desc: 'Un ataque de 2 dados: recuperas tanto cuerpo como daño haga.' },
  terror:     { elemento: 'oscuro', nombre: 'Mirada del abismo', objetivo: 'monstruo', desc: 'El monstruo tira su mente: si no saca ningún escudo negro, huye de miedo y pierde sus 2 próximos turnos. No afecta a jefes ni a no muertos.' },
  pacto:      { elemento: 'oscuro', nombre: 'Pacto de sangre', objetivo: 'propio', desc: 'Pierdes 2 de cuerpo (nunca por debajo de 1) y ganas 3 fragmentos de alma.' }
};
export const HECHIZOS_POR_ELEMENTO = {
  fuego: ['bolaFuego', 'llamarada', 'coraje'],
  aire: ['vendaval', 'vientoVeloz', 'espiritu'],
  agua: ['sanar', 'niebla', 'sueno'],
  tierra: ['pielRoca', 'raices', 'balsamo']
};

// ---------- Mazo de tesoro ----------
// Los "peligros" vuelven al mazo tras salir; el resto se descarta.
export const CARTAS_TESORO = [
  ...Array(3).fill({ tipo: 'oro', oro: 25, texto: 'Unas monedas sueltas entre el polvo.' }),
  ...Array(2).fill({ tipo: 'oro', oro: 50, texto: 'Una bolsa de cuero con monedas.' }),
  { tipo: 'oro', oro: 100, texto: 'Un pequeño cofre lleno de oro.' },
  { tipo: 'oro', oro: 150, texto: 'Una joya engastada en plata.' },
  ...Array(3).fill({ tipo: 'pocion', objeto: 'pocionCurar', texto: 'Un frasco con un líquido rojo y cálido.' }),
  { tipo: 'pocion', objeto: 'pocionFuerza', texto: 'Un vial que huele a hierro.' },
  { tipo: 'pocion', objeto: 'pocionVelocidad', texto: 'Un frasco que zumba en la mano.' },
  { tipo: 'pocion', objeto: 'pocionPiedra', texto: 'Un elixir gris y espeso.' },
  ...Array(4).fill({ tipo: 'nada', texto: 'No encuentras nada de valor.' }),
  ...Array(4).fill({ tipo: 'errante', texto: '¡Un monstruo errante te sorprende!', peligro: true }),
  ...Array(2).fill({ tipo: 'flecha', texto: '¡Una flecha sale disparada de la pared!', peligro: true }),
  { tipo: 'derrumbe', texto: '¡Caen piedras del techo!', peligro: true }
];

// ---------- Trampas ----------
export const TRAMPAS = {
  foso:   { nombre: 'Foso',            icono: 'fosoPinchos' },
  lanza:  { nombre: 'Trampa de lanza', icono: 'trampa' },
  bloque: { nombre: 'Bloque que cae',  icono: 'derrumbe' }
};

// ---------- Mobiliario ----------
// Bloquea el paso pero no la vista. w/h los da cada misión.
export const MUEBLES = {
  mesa:       { nombre: 'Mesa',               icono: 'mesa' },
  cofre:      { nombre: 'Cofre',              icono: 'cofre' },
  estanteria: { nombre: 'Estantería',         icono: 'estanteria' },
  trono:      { nombre: 'Trono',              icono: 'trono' },
  sarcofago:  { nombre: 'Sarcófago',          icono: 'sarcofago' },
  chimenea:   { nombre: 'Chimenea',           icono: 'chimenea' },
  armero:     { nombre: 'Armero',             icono: 'espada' },
  alquimista: { nombre: 'Mesa de alquimista', icono: 'caldero' },
  potro:      { nombre: 'Potro de tortura',   icono: 'telarana' },
  caldero:    { nombre: 'Caldero',            icono: 'caldero' },
  altar:      { nombre: 'Altar',              icono: 'altar' }
};

// Orden de las misiones de la campaña (archivos de /misiones).
export const CAMPANA = ['01-tuneles-de-ceniza', '02-biblioteca-del-alquimista', '03-celdas-de-hierro', '04-los-tres-sellos', '03-trono-de-velmor'];

// ---------- Reacciones (sellos de lacre sobre el héroe) ----------
// tono: peligro (rojo), bueno (verde), presume (dorado).
export const REACCIONES = {
  muerto:  { icono: 'calavera', texto: '¡Muerto!', tono: 'peligro' },
  tirada:  { icono: 'dados', texto: '¡Vaya tirada!', tono: 'presume' },
  cubro:   { icono: 'rodela', texto: '¡Os cubro!', tono: 'bueno' },
  curame:  { icono: 'pocion', texto: '¡Cúrame!', tono: 'peligro' },
  botin:   { icono: 'oro', texto: '¡Botín!', tono: 'presume' },
  cuidado: { icono: 'trampa', texto: '¡Cuidado!', tono: 'peligro' },
  mira:    { icono: 'ojo', texto: 'Mira eso…', tono: 'bueno' },
  tomaya:  { icono: 'corona', texto: '¡Toma ya!', tono: 'presume' },
  prisa:   { icono: 'reloj', texto: '¡Daos prisa!', tono: 'peligro' },
  plan:    { icono: 'mente', texto: 'Tengo un plan', tono: 'bueno' },
  vamonos: { icono: 'escalera', texto: '¡Vámonos!', tono: 'bueno' },
  atope:   { icono: 'fuego', texto: '¡A tope!', tono: 'presume' }
};
// Las que salen solas (cada jugador puede quitarlas).
export const REACCIONES_AUTO = {
  ay:     { icono: 'calavera', texto: '¡Ay!', tono: 'peligro' },
  golpazo: { icono: 'corona', texto: '¡Toma ya!', tono: 'presume' }
};

// ---------- Recursos y habilidades de clase (Mazmorra Infinita) ----------
// Rabia del bárbaro: +1 al recibir un golpe que hace daño y al matar a un monstruo (máx. 5). Se pierde al acabar el piso.
export const RABIA_MAX = 5;
// Runas del enano: empieza cada piso con 3 grabadas y graba otra cada vez que desarma una trampa (máx. 4).
export const RUNAS_PISO = 3, RUNAS_MAX = 4;
// Armonía del elfo: +1 al empezar su turno si desde el anterior nadie le ha herido (máx. 3).
export const ARMONIA_MAX = 3;
export const HAB_CLASE = {
  enano: [
    { id: 'runaHierro', nombre: 'Runa de hierro', icono: 'armadura', objetivo: 'ninguno', runas: 1, sinLimite: true, sinAccion: true,
      desc: '1 runa, sin gastar acción: +2 dados de defensa hasta tu próximo turno.' },
    { id: 'runaFuego', nombre: 'Runa de fuego', icono: 'fuego', objetivo: 'ninguno', runas: 1, sinLimite: true, sinAccion: true,
      desc: '1 runa, sin gastar acción: si tu próximo ataque hace daño, la runa quema 1 más.' },
    { id: 'runaPiedra', nombre: 'Runa de piedra', icono: 'piedra', objetivo: 'heroe', runas: 2, sinLimite: true, sinAccion: true,
      desc: '2 runas, sin gastar acción: un compañero pegado a ti tira +2 dados de defensa hasta su próximo turno.' }
  ],
  elfo: [
    { id: 'pasoViento', nombre: 'Paso del viento', icono: 'viento', objetivo: 'ninguno', armonia: 1, sinLimite: true, sinAccion: true,
      desc: '1 de armonía, sin gastar acción: 3 casillas más de movimiento este turno.' },
    { id: 'esquiva', nombre: 'Esquiva élfica', icono: 'correr', objetivo: 'ninguno', armonia: 2, sinLimite: true, sinAccion: true,
      desc: '2 de armonía, sin gastar acción: +2 dados de defensa hasta tu próximo turno.' },
    { id: 'canto', nombre: 'Canto élfico', icono: 'hechizo', objetivo: 'lista', armonia: 3, sinLimite: true, sinAccion: true,
      desc: '3 de armonía, sin gastar acción: recuperas un hechizo que ya hayas lanzado en esta misión.' }
  ],
  mago: [
    { id: 'recordar', nombre: 'Concentración', icono: 'pergamino', objetivo: 'lista', menteCoste: 2, sinLimite: true, sinAccion: true,
      desc: '2 de mente, sin gastar acción: recuperas un hechizo que ya hayas lanzado en esta misión. Cuidado: a 0 de mente quedas aterrorizado.' }
  ],
  barbaro: [
    { id: 'golpeBrutal', nombre: 'Golpe brutal', icono: 'hacha', objetivo: 'ninguno', rabia: 2, sinLimite: true, sinAccion: true,
      desc: '2 de rabia, sin gastar acción: tu próximo ataque tira +2 dados.' },
    { id: 'aguantar', nombre: 'Aguantar', icono: 'rodela', objetivo: 'ninguno', rabia: 3, sinLimite: true, sinAccion: true,
      desc: '3 de rabia, sin gastar acción: el próximo golpe que recibas antes de tu siguiente turno no te hace daño.' },
    { id: 'rugido', nombre: 'Rugido', icono: 'fuego', objetivo: 'ninguno', rabia: 4, sinLimite: true,
      desc: '4 de rabia: los enemigos pegados a ti retroceden una casilla y pierden su próximo turno si tienen poca mente (2 o menos).' }
  ]
};
