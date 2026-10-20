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
export const TABLERO = [
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
export const ANCHO = 26, ALTO = 19;

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
    defensa: 2, cuerpo: 7, mente: 3, arma: 'espadaCorta', elementos: [],
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
  hechicero: { nombre: 'Hechicero',       icono: 'hechicero', color: '#5a2a6a', mov: 6,  ataque: 2, defensa: 3, cuerpo: 4, mente: 6 }
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
  ballestaPesada: { nombre: 'Ballesta pesada', ataque: 4, precio: 600, icono: 'ballesta', distancia: true, dosManos: true, pesada: true }
};
export const ARMADURAS = {
  casco:   { nombre: 'Casco',           defensa: 1, precio: 125, icono: 'casco' },
  escudo:  { nombre: 'Escudo',          defensa: 1, precio: 150, icono: 'rodela', manos: true },
  cota:    { nombre: 'Cota de malla',   defensa: 1, precio: 450, icono: 'armadura' },
  placas:  { nombre: 'Armadura de placas', defensa: 2, precio: 850, icono: 'armadura', lenta: true }
};
export const OBJETOS_TIENDA = {
  kit:         { nombre: 'Herramientas', precio: 250, icono: 'llave', desc: 'Permite desarmar trampas.' },
  pocionCurar: { nombre: 'Poción curativa', precio: 150, icono: 'pocion', desc: 'Recupera hasta 6 de cuerpo.' }
};
export const MAGO_ARMAS = ['daga', 'baston'];

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
  tierra:{ nombre: 'Tierra',icono: 'tierra',color: '#7a8f3a' }
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
  balsamo:    { elemento: 'tierra', nombre: 'Bálsamo de tierra', objetivo: 'heroe', desc: 'Recupera 4 de cuerpo.' }
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
