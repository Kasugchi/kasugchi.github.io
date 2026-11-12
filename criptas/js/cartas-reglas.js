// =============================================================
//  CARTAS DE VELMOR · reglas puras (sin pantalla ni 3D).
//  Homenaje a los duelos de cartas en tablero de los 2000 (7×7 con terrenos, líder, fusiones a ciegas),
//  con bichos, nombres y reglas nuestras. Todo es determinista con la semilla del duelo (para el online).
//
//  Una partida (S):
//    lp[2], mazo[2], mano[2], cem[2] (cementerio), tab[y][x] (terreno), u[] (lo que hay en el tablero),
//    juega (0 abajo, 1 arriba), turno, jugado (ya has hecho tu jugada del turno), fin, ev[] (lo que ha pasado, para animarlo).
//  Cada unidad: { id, c (carta), p (dueño), x, y, arriba, def (en defensa), ma, md (equipo), hecho, cambio, red, lider, trampa }
// =============================================================

export const LADO = 7, VIDA = 8000, MANO = 5, MAX_BICHOS = 5, MAX_TRAMPAS = 5, MAX_TURNOS = 198;

// ---------- tipos y elementos ----------
export const TIPOS = {
  nomuerto: ['💀', 'No-muerto'], demonio: ['😈', 'Demonio'], bestia: ['🐺', 'Bestia'], insecto: ['🐛', 'Insecto'], reptil: ['🦎', 'Reptil'],
  roca: ['🗿', 'Roca'], espiritu: ['👻', 'Espíritu'], guerrero: ['⚔️', 'Guerrero'], mago: ['🔮', 'Mago'], hada: ['🧚', 'Hada'],
  dragon: ['🐉', 'Dragón'], ave: ['🦅', 'Ave'], marino: ['🐙', 'Marino'], planta: ['🌿', 'Planta'], maquina: ['⚙️', 'Máquina'], vineta: ['✏️', 'Viñeta'],
};
export const ELEMENTOS = { luz: ['☀️', 'Luz', '#ffe27a'], oscuridad: ['🌑', 'Oscuridad', '#7a5aa8'], fuego: ['🔥', 'Fuego', '#ff7a3a'], agua: ['💧', 'Agua', '#4aa8e8'], tierra: ['🪨', 'Tierra', '#a8885a'], viento: ['🌪️', 'Viento', '#8ad8b8'] };

// ---------- terrenos: ±500 a ataque y defensa según tipo y elemento ----------
export const TERRENOS = {
  normal:    { n: 'Normal', e: '⬜', col: '#c8b890' },
  pradera:   { n: 'Pradera', e: '🌾', col: '#9ac85a', mas: { t: ['guerrero', 'bestia'] }, menos: { t: ['mago'] } },
  bosque:    { n: 'Bosque', e: '🌲', col: '#4a8a3a', mas: { t: ['planta', 'insecto', 'bestia'] }, menos: { t: ['demonio'] } },
  paramo:    { n: 'Páramo', e: '🏜️', col: '#c89a5a', mas: { t: ['roca', 'nomuerto', 'maquina', 'reptil'] }, menos: { t: ['marino', 'planta'] } },
  montana:   { n: 'Montaña', e: '⛰️', col: '#8a8a9a', mas: { t: ['dragon', 'ave', 'hada'] }, menos: { t: ['nomuerto'] } },
  mar:       { n: 'Mar', e: '🌊', col: '#3a7ac8', mas: { t: ['marino'], el: ['agua'] }, menos: { t: ['maquina'], el: ['fuego'] } },
  oscuridad: { n: 'Oscuridad', e: '🌑', col: '#3a2a5a', mas: { t: ['demonio', 'nomuerto', 'espiritu'], el: ['oscuridad'] }, menos: { t: ['hada'], el: ['luz'] } },
  vinetas:   { n: 'Viñetas', e: '✏️', col: '#f0e8f8', mas: { t: ['vineta'] }, todosMenos: true },
  derrumbe:  { n: 'Derrumbe', e: '🪨', col: '#6a5a4a', aplasta: 1500 },
  laberinto: { n: 'Laberinto', e: '🧱', col: '#5a5260', muro: true },
};

// ---------- las cartas ----------
// bicho: t tipo, el elemento, a/d ataque y defensa, nv estrellas, e dibujo, m figurita de la cripta (si hay), c color de la variante
//   hab: veloz (se mueve 2), fantasmal (atraviesa el laberinto), galerias (vive en el laberinto), muro (no ataca), perforante (daña a través de la defensa), inmortal (el derrumbe no le aplasta)
//   fus: solo sale fusionando · jefe: carta de jefe · ritual: bichos tuyos que hay que sacrificar para sacarlo
const B = (n, t, el, a, d, nv, e, extra = {}) => ({ k: 'bicho', n, t, el, a, d, nv, e, ...extra });
export const CARTAS = {
  // no-muertos
  esqueleto:      B('Esqueleto', 'nomuerto', 'oscuridad', 900, 700, 3, '💀', { m: 'esqueleto', fam: 'esqueleto' }),
  esq_negro:      B('Esqueleto Negro', 'nomuerto', 'oscuridad', 1300, 1400, 4, '💀', { m: 'esqueleto', c: '#3a3442', fam: 'esqueleto' }),
  esq_maldito:    B('Esqueleto Maldito', 'nomuerto', 'oscuridad', 1600, 1000, 4, '💀', { m: 'esqueleto', c: '#8a4ab0', fam: 'esqueleto' }),
  esq_escarcha:   B('Esqueleto de Escarcha', 'nomuerto', 'agua', 1200, 1300, 4, '💀', { m: 'esqueleto', c: '#8ad0f0', fam: 'esqueleto' }),
  capitan_femur:  B('Capitán Fémur', 'nomuerto', 'oscuridad', 2100, 1500, 6, '☠️', { m: 'esqueleto', c: '#c8a040', fam: 'esqueleto', fus: true }),
  zombi:          B('Zombi', 'nomuerto', 'tierra', 1000, 1100, 3, '🧟', { m: 'zombi', fam: 'zombi' }),
  zombi_apestoso: B('Zombi Apestoso', 'nomuerto', 'tierra', 1400, 1200, 4, '🧟', { m: 'zombi', c: '#7a9a3a', fam: 'zombi' }),
  zombi_gordo:    B('Zombi Gordinflón', 'nomuerto', 'tierra', 600, 2000, 4, '🧟', { m: 'zombi', c: '#b88a7a', fam: 'zombi', hab: ['muro'] }),
  momia:          B('Momia', 'nomuerto', 'tierra', 1500, 1700, 5, '🤕', { m: 'momia', fam: 'momia' }),
  momia_real:     B('Momia Real', 'nomuerto', 'luz', 2300, 2000, 7, '👑', { m: 'momia', c: '#e8c860', fam: 'momia', fus: true }),
  lich:           B('Lich del Osario', 'nomuerto', 'oscuridad', 2600, 2200, 8, '🧙', { m: 'hechicero', c: '#3a6a5a', fam: 'lich', fus: true }),
  // espíritus
  alma_pena:      B('Alma en Pena', 'espiritu', 'oscuridad', 700, 600, 2, '👻', { fam: 'fantasma', hab: ['fantasmal'] }),
  fantasma:       B('Fantasma del Pasillo', 'espiritu', 'oscuridad', 1300, 900, 4, '👻', { fam: 'fantasma', c: '#a8c8f0', hab: ['fantasmal'] }),
  espectro:       B('Espectro Aullador', 'espiritu', 'viento', 1900, 1200, 6, '👻', { fam: 'fantasma', c: '#5ad8c8', hab: ['fantasmal'], fus: true }),
  caballo_fant:   B('Caballo Fantasma', 'bestia', 'oscuridad', 1200, 900, 4, '🐴', { fam: 'caballo', c: '#a8b8d8', hab: ['fantasmal'] }),
  caballero_fant: B('Caballero Fantasma', 'nomuerto', 'oscuridad', 1900, 1600, 6, '🏇', { m: 'guerrero', c: '#6a7aa8', fam: 'jinete', fus: true }),
  jinete_sin:     B('Jinete sin Cabeza', 'nomuerto', 'oscuridad', 2300, 1700, 7, '🏇', { m: 'guerrero', c: '#4a2a5a', fam: 'jinete', fus: true, hab: ['veloz'] }),
  // trasgos, orcos, guerreros
  trasgo:         B('Trasgo', 'guerrero', 'tierra', 800, 500, 2, '👺', { m: 'trasgo', fam: 'trasgo' }),
  trasgo_ladron:  B('Trasgo Ladrón', 'guerrero', 'viento', 1100, 600, 3, '👺', { m: 'trasgo', c: '#5a7a9a', fam: 'trasgo', hab: ['veloz'] }),
  trasgo_petardo: B('Trasgo Petardero', 'guerrero', 'fuego', 1400, 400, 3, '👺', { m: 'trasgo', c: '#c85a2a', fam: 'trasgo' }),
  orco:           B('Orco', 'guerrero', 'tierra', 1200, 900, 4, '👹', { m: 'orco', fam: 'orco' }),
  orco_berserker: B('Orco Berserker', 'guerrero', 'fuego', 1800, 600, 5, '👹', { m: 'orco', c: '#a83a2a', fam: 'orco' }),
  chaman_orco:    B('Chamán Orco', 'mago', 'tierra', 1000, 1100, 4, '👹', { m: 'orco', c: '#7a5a1a', fam: 'orco' }),
  guerrero_osc:   B('Guerrero Oscuro', 'guerrero', 'oscuridad', 1600, 1500, 5, '🛡️', { m: 'guerrero', fam: 'caballero' }),
  caballero_oxido:B('Caballero del Óxido', 'guerrero', 'tierra', 1300, 1600, 4, '🛡️', { m: 'guerrero', c: '#a86a3a', fam: 'caballero' }),
  jinete_lobo:    B('Jinete de Lobo', 'guerrero', 'tierra', 1700, 1200, 5, '🐺', { m: 'trasgo', c: '#6a6a6a', fam: 'jinete', fus: true, hab: ['veloz'] }),
  centauro:       B('Centauro Arquero', 'guerrero', 'viento', 2100, 1600, 6, '🏹', { fam: 'jinete', fus: true, hab: ['veloz'] }),
  caballero_drag: B('Caballero Dragón', 'guerrero', 'fuego', 2400, 2000, 7, '🐲', { m: 'guerrero', c: '#c84a2a', fam: 'caballero', fus: true }),
  paladin:        B('Paladín Alado', 'guerrero', 'luz', 1800, 1700, 6, '😇', { m: 'guerrero', c: '#f0e0a0', fam: 'caballero', fus: true }),
  cabo_mecanico:  B('Caballero Mecánico', 'maquina', 'tierra', 1900, 2000, 6, '🤖', { m: 'guerrero', c: '#8a9aa8', fam: 'maquina', fus: true }),
  // magos
  hechicero:      B('Hechicero', 'mago', 'oscuridad', 1400, 1100, 4, '🧙', { m: 'hechicero', fam: 'mago' }),
  bruja_plaga:    B('Bruja de la Plaga', 'mago', 'oscuridad', 1700, 1300, 5, '🧙‍♀️', { m: 'hechicero', c: '#4a6a2a', fam: 'mago' }),
  ilusionista:    B('Ilusionista', 'mago', 'luz', 1200, 1200, 4, '🎩', { m: 'mago', fam: 'mago' }),
  aprendiz:       B('Aprendiz Despistado', 'mago', 'viento', 700, 800, 2, '📚', { m: 'mago', c: '#5a9a5a', fam: 'mago' }),
  brujo_infernal: B('Brujo Infernal', 'mago', 'fuego', 2000, 1500, 6, '🔥', { m: 'hechicero', c: '#c82a2a', fam: 'mago', fus: true }),
  archimago:      B('Archimago Dragón', 'mago', 'oscuridad', 2700, 2200, 8, '🐉', { m: 'hechicero', c: '#2a1a4a', fam: 'mago', fus: true }),
  // gárgolas y gólems
  gargola:        B('Gárgola', 'roca', 'viento', 1500, 1800, 5, '🗿', { m: 'gargola', fam: 'gargola' }),
  gargola_onice:  B('Gárgola de Ónice', 'roca', 'oscuridad', 1800, 2100, 6, '🗿', { m: 'gargola', c: '#2a2a3a', fam: 'gargola', fus: true }),
  golem_barro:    B('Gólem de Barro', 'roca', 'tierra', 1000, 1800, 4, '🧱', { fam: 'golem', c: '#8a6a4a' }),
  golem_runico:   B('Gólem Rúnico', 'roca', 'tierra', 2200, 2600, 7, '🗿', { fam: 'golem', c: '#6a7a8a', fus: true }),
  golem_magma:    B('Gólem de Magma', 'roca', 'fuego', 2000, 1900, 6, '🌋', { fam: 'golem', c: '#c84a1a', fus: true }),
  piedra_rodante: B('Piedra con Ojos', 'roca', 'tierra', 500, 1500, 2, '🪨', { fam: 'golem', hab: ['muro', 'inmortal'] }),
  // hadas
  hada_rocio:     B('Hada del Rocío', 'hada', 'luz', 600, 900, 2, '🧚', { fam: 'hada' }),
  hada_guerrera:  B('Hada Guerrera', 'hada', 'luz', 1300, 1100, 4, '🧚', { fam: 'hada', c: '#f0a0c0' }),
  hada_viento:    B('Hada del Viento', 'hada', 'viento', 1100, 1000, 3, '🧚', { fam: 'hada', c: '#8ad8b8', hab: ['veloz'] }),
  angel_campana:  B('Ángel de la Campana', 'hada', 'luz', 2000, 1800, 6, '👼', { fam: 'hada', fus: true }),
  valquiria:      B('Valquiria del Viento', 'hada', 'viento', 1900, 1300, 6, '🪽', { fam: 'hada', fus: true, hab: ['veloz'] }),
  esq_bendito:    B('Esqueleto Bendito', 'nomuerto', 'luz', 1700, 1700, 5, '💀', { m: 'esqueleto', c: '#fff0b0', fam: 'esqueleto', fus: true }),
  // dragones y reptiles
  dragoncito:     B('Dragoncito', 'dragon', 'fuego', 1100, 900, 3, '🐲', { fam: 'dragon' }),
  dragon_pantano: B('Dragón del Pantano', 'dragon', 'agua', 1700, 1500, 5, '🐉', { fam: 'dragon', c: '#5a8a5a' }),
  dragon_ceniza:  B('Dragón de Ceniza', 'dragon', 'fuego', 2400, 2000, 7, '🐉', { fam: 'dragon', c: '#6a6a6a', fus: true }),
  dragon_esq:     B('Dragón Esqueleto', 'dragon', 'oscuridad', 2500, 2000, 8, '🦴', { fam: 'dragon', c: '#e8e0c8', fus: true }),
  monarca_caos:   B('Monarca del Caos', 'demonio', 'oscuridad', 3000, 2500, 9, '👑', { fam: 'demonio', fus: true }),
  lagartija:      B('Lagartija Chispa', 'reptil', 'fuego', 600, 500, 2, '🦎', { fam: 'reptil' }),
  serpiente:      B('Serpiente Cascabel', 'reptil', 'tierra', 1200, 800, 3, '🐍', { fam: 'reptil' }),
  basilisco:      B('Basilisco', 'reptil', 'tierra', 2000, 1700, 6, '🐍', { fam: 'reptil', c: '#3a6a3a', fus: true }),
  // bestias y aves
  rata:           B('Rata de Alcantarilla', 'bestia', 'tierra', 500, 300, 1, '🐀', { fam: 'rata' }),
  rata_biblio:    B('Rata de Biblioteca', 'bestia', 'luz', 1500, 1500, 5, '🐀', { fam: 'rata', fus: true }),
  lobo:           B('Lobo', 'bestia', 'tierra', 1100, 700, 3, '🐺', { fam: 'lobo', hab: ['veloz'] }),
  huargo:         B('Huargo Gris', 'bestia', 'oscuridad', 1600, 1000, 5, '🐺', { fam: 'lobo', c: '#5a5a6a', hab: ['veloz'] }),
  oso:            B('Oso Cavernario', 'bestia', 'tierra', 1900, 1500, 6, '🐻', { fam: 'oso', fus: true }),
  bicefalo:       B('Bestia de Dos Cabezas', 'bestia', 'oscuridad', 2000, 1400, 6, '🐗', { fam: 'oso', fus: true }),
  quimera:        B('Quimera', 'bestia', 'fuego', 2200, 1800, 7, '🦁', { fam: 'quimera', fus: true }),
  murcielago:     B('Murciélago Vampiro', 'ave', 'oscuridad', 800, 400, 2, '🦇', { fam: 'murcielago', hab: ['veloz'] }),
  cuervo:         B('Cuervo Agorero', 'ave', 'viento', 1000, 700, 3, '🐦‍⬛', { fam: 'cuervo', hab: ['veloz'] }),
  grifo:          B('Grifo', 'ave', 'viento', 1900, 1600, 6, '🦅', { fam: 'grifo', fus: true, hab: ['veloz'] }),
  // insectos
  arana:          B('Araña Peluda', 'insecto', 'oscuridad', 900, 800, 3, '🕷️', { fam: 'arana' }),
  escarabajo:     B('Escarabajo Acorazado', 'insecto', 'tierra', 700, 1700, 3, '🪲', { fam: 'escarabajo' }),
  mantis:         B('Mantis Afilada', 'insecto', 'viento', 1500, 700, 4, '🦗', { fam: 'mantis' }),
  gusano:         B('Gusano de las Galerías', 'insecto', 'tierra', 1800, 1500, 5, '🪱', { fam: 'gusano', hab: ['galerias'] }),
  reina_colmena:  B('Reina de la Colmena', 'insecto', 'viento', 1900, 1700, 6, '🐝', { fam: 'colmena', fus: true }),
  escorpion:      B('Escorpión Gigante', 'insecto', 'tierra', 2100, 1800, 6, '🦂', { fam: 'escorpion', fus: true }),
  gusano_reina:   B('Gusano Reina', 'insecto', 'tierra', 2300, 2100, 7, '🪱', { fam: 'gusano', c: '#c87a5a', fus: true, hab: ['galerias'] }),
  // mar
  pez_globo:      B('Pez Globo', 'marino', 'agua', 400, 1200, 2, '🐡', { fam: 'pez' }),
  cangrejo:       B('Cangrejo Gruñón', 'marino', 'agua', 1000, 1600, 3, '🦀', { fam: 'cangrejo' }),
  serp_marina:    B('Serpiente Marina', 'marino', 'agua', 1800, 1400, 5, '🐍', { fam: 'serpiente', c: '#3a8ac8' }),
  pirata_ahogado: B('Pirata Ahogado', 'nomuerto', 'agua', 1900, 1500, 6, '🏴‍☠️', { m: 'esqueleto', c: '#3a7a8a', fam: 'pirata', fus: true }),
  cocodrilo:      B('Cocodrilo del Foso', 'reptil', 'agua', 2000, 1700, 6, '🐊', { fam: 'reptil', fus: true }),
  kraken:         B('Kraken del Pozo', 'marino', 'agua', 2500, 2100, 7, '🦑', { fam: 'kraken', fus: true }),
  leviatan:       B('Leviatán', 'dragon', 'agua', 2800, 2400, 8, '🐋', { fam: 'dragon', fus: true }),
  espiritu_vapor: B('Espíritu del Vapor', 'espiritu', 'agua', 1600, 1600, 5, '♨️', { fam: 'fantasma', fus: true, hab: ['fantasmal'] }),
  // plantas
  seta:           B('Seta Saltarina', 'planta', 'tierra', 500, 700, 2, '🍄', { fam: 'seta' }),
  enredadera:     B('Enredadera Mordedora', 'planta', 'tierra', 1100, 1000, 3, '🌿', { fam: 'planta' }),
  arbol_abuelo:   B('Árbol Abuelo', 'planta', 'tierra', 1300, 2200, 5, '🌳', { fam: 'planta', hab: ['muro'] }),
  guardian_bosque:B('Guardián del Bosque', 'planta', 'tierra', 2200, 2300, 7, '🌳', { fam: 'planta', c: '#3a6a2a', fus: true }),
  carnivora:      B('Planta Carnívora Gigante', 'planta', 'oscuridad', 1700, 1400, 5, '🪴', { fam: 'planta', fus: true }),
  // máquinas (los cachivaches de Rufo)
  tostadora:      B('Tostadora Asesina', 'maquina', 'fuego', 900, 600, 2, '🍞', { fam: 'cacharro' }),
  robot_chatarra: B('Robot de Chatarra', 'maquina', 'tierra', 1400, 1200, 4, '🤖', { fam: 'robot' }),
  tanque:         B('Tanque Oxidado', 'maquina', 'fuego', 1900, 2000, 6, '🚜', { fam: 'robot', fus: true }),
  coloso:         B('Coloso de Chatarra', 'maquina', 'tierra', 2500, 2500, 8, '🦾', { fam: 'robot', fus: true }),
  canon_trasgo:   B('Cañón Trasgo', 'maquina', 'fuego', 2000, 800, 6, '💣', { fam: 'cacharro', fus: true }),
  // demonios
  diablillo:      B('Diablillo', 'demonio', 'fuego', 800, 600, 2, '😈', { fam: 'diablo' }),
  demonio_azufre: B('Demonio de Azufre', 'demonio', 'fuego', 1700, 1200, 5, '👿', { fam: 'diablo', c: '#c8a82a' }),
  canciller:      B('Canciller del Terror', 'demonio', 'oscuridad', 2200, 1800, 7, '🎭', { fam: 'diablo', fus: true }),
  // viñetas
  muneco_tinta:   B('Muñeco de Tinta', 'vineta', 'luz', 1000, 1000, 3, '✏️', { fam: 'tinta' }),
  dragon_tebeo:   B('Dragón de Tebeo', 'vineta', 'fuego', 2200, 1800, 7, '💥', { fam: 'tinta', fus: true }),
  conejo_garabato:B('Conejo Garabato', 'vineta', 'luz', 1200, 800, 3, '🐰', { fam: 'tinta', hab: ['veloz'] }),
  gato_garabato:  B('Gato Garabato', 'vineta', 'oscuridad', 1500, 900, 4, '🐱', { fam: 'tinta' }),
  sirena_tebeo:   B('Sirena de Tebeo', 'vineta', 'agua', 1400, 1300, 4, '🧜', { fam: 'tinta' }),
  calavera_risa:  B('Calavera Risueña', 'vineta', 'oscuridad', 1100, 1000, 3, '😆', { fam: 'tinta', hab: ['fantasmal'] }),
  caballero_papel:B('Caballero de Papel', 'vineta', 'viento', 1700, 1400, 5, '📜', { fam: 'tinta' }),
  mago_vineta:    B('Mago de Viñeta', 'vineta', 'luz', 1800, 1500, 6, '🪄', { fam: 'tinta' }),
  rey_tebeo:      B('Rey de las Viñetas', 'vineta', 'luz', 2600, 2200, 8, '🤴', { fam: 'tinta', fus: true }),

  // ---------- magias (gastan tu jugada) ----------
  bola_fuego:   { k: 'magia', n: 'Bola de Fuego', e: '🔥', obj: 'rival', txt: 'Destruye un bicho rival con 1500 de ataque o menos. Si es más tocho, solo lo destapa.' },
  chispas:      { k: 'magia', n: 'Lluvia de Chispas', e: '✨', obj: 'nada', txt: 'Quita 700 de vida al rival.' },
  pocima:       { k: 'magia', n: 'Pócima de la Abuela', e: '🧪', obj: 'nada', txt: 'Recuperas 1500 de vida. Sabe a rayos.' },
  farol:        { k: 'magia', n: 'Farol del Sereno', e: '🏮', obj: 'nada', txt: 'Destapa todas las cartas boca abajo del rival.' },
  escoba:       { k: 'magia', n: 'Escoba de la Sacristana', e: '🧹', obj: 'nada', txt: 'Barre todas las trampas del rival.' },
  // terrenos (cambian las casillas alrededor de donde lo juegas)
  t_bosque:     { k: 'terreno', n: 'Semillas Locas', e: '🌲', terr: 'bosque', txt: 'Brota bosque alrededor.' },
  t_mar:        { k: 'terreno', n: 'Cubo de Agua Bendita', e: '🌊', terr: 'mar', txt: 'Lo encharca todo alrededor.' },
  t_oscuridad:  { k: 'terreno', n: 'Velo de Sombras', e: '🌑', terr: 'oscuridad', txt: 'Oscuridad alrededor.' },
  t_montana:    { k: 'terreno', n: 'Cumbre Repentina', e: '⛰️', terr: 'montana', txt: 'Montaña alrededor.' },
  t_paramo:     { k: 'terreno', n: 'Saco de Arena', e: '🏜️', terr: 'paramo', txt: 'Páramo alrededor.' },
  t_pradera:    { k: 'terreno', n: 'Césped Recién Cortado', e: '🌾', terr: 'pradera', txt: 'Pradera alrededor.' },
  t_vinetas:    { k: 'terreno', n: 'Bote de Tinta', e: '✏️', terr: 'vinetas', txt: 'Todo alrededor se vuelve dibujo: casi todos se debilitan.' },
  t_laberinto:  { k: 'terreno', n: 'Muros de Piedra', e: '🧱', terr: 'laberinto', txt: 'Levanta muros en las casillas libres de alrededor.' },
  t_derrumbe:   { k: 'terreno', n: 'Techo Flojo', e: '🪨', terr: 'derrumbe', txt: 'Derrumbe alrededor: aplasta a los grandes que pasen.' },
  // equipo (encadénalo detrás de un bicho, o pónselo a uno del tablero)
  espada:       { k: 'equipo', n: 'Espada Oxidada', e: '🗡️', a: 400, d: 0, txt: '+400 de ataque.' },
  escudo:       { k: 'equipo', n: 'Tapa de Olla', e: '🛡️', a: 0, d: 600, txt: '+600 de defensa.' },
  hacha:        { k: 'equipo', n: 'Hacha de Leñador', e: '🪓', a: 700, d: -300, txt: '+700 de ataque y −300 de defensa.' },
  capa:         { k: 'equipo', n: 'Capa de Sombras', e: '🧥', a: 500, d: 500, el: 'oscuridad', txt: '+500/+500 a los de oscuridad; +100/+100 a los demás.' },
  amuleto:      { k: 'equipo', n: 'Amuleto Solar', e: '🧿', a: 500, d: 500, el: 'luz', txt: '+500/+500 a los de luz; +100/+100 a los demás.' },
  // trampas (boca abajo; saltan solas)
  foso:         { k: 'trampa', n: 'Foso con Pinchos', e: '🕳️', cuando: 'paso', txt: 'Si un bicho rival acaba a su lado y tiene 1800 de ataque o menos, se lo traga.' },
  cuchillas:    { k: 'trampa', n: 'Cuchillas Giratorias', e: '🌀', cuando: 'ataque', txt: 'Cuando atacan a algo tuyo de al lado: el atacante pierde 1000 de ataque para siempre.' },
  red:          { k: 'trampa', n: 'Red Pegajosa', e: '🕸️', cuando: 'paso', txt: 'Si un bicho rival acaba a su lado, queda pegado dos turnos.' },
  espejo:       { k: 'trampa', n: 'Espejo Traicionero', e: '🪞', cuando: 'ataque', txt: 'Cuando atacan a algo tuyo de al lado: si el atacante tiene 2000 o más, se rompe él.' },
  sello:        { k: 'trampa', n: 'Sello del Párroco', e: '📜', cuando: 'invoca', txt: 'Si el rival saca cerca un bicho de 5 estrellas o más, lo destierra.' },
};
export const carta = (id) => CARTAS[id];
export const esBicho = (id) => CARTAS[id]?.k === 'bicho';

// ---------- fusiones (no se enseñan en ningún sitio: se descubren) ----------
// 1) recetas exactas (secretas), por pareja de cartas; 2) por pareja de tipos: sale el más flojo del grupo que supere a los dos;
// 3) por pareja de elementos, igual. Si nada encaja: no fusionan.
const R = (a, b) => [a, b].sort().join('+');
const EXACTAS = {
  [R('esq_maldito', 'caballo_fant')]: 'jinete_sin',
  [R('dragon_ceniza', 'canciller')]: 'monarca_caos',
  [R('dragon_esq', 'hechicero')]: 'archimago',
  [R('trasgo_petardo', 'tostadora')]: 'canon_trasgo',
  [R('rata', 'aprendiz')]: 'rata_biblio',
  [R('muneco_tinta', 'dragoncito')]: 'dragon_tebeo',
  [R('hada_rocio', 'esqueleto')]: 'esq_bendito',
  [R('gusano', 'arana')]: 'gusano_reina',
  [R('esqueleto', 'esq_negro')]: 'capitan_femur',
  [R('momia', 'ilusionista')]: 'momia_real',
};
const POR_TIPO = {
  [R('nomuerto', 'bestia')]: ['caballero_fant', 'jinete_sin'],
  [R('espiritu', 'bestia')]: ['caballero_fant', 'jinete_sin'],
  [R('nomuerto', 'dragon')]: ['dragon_esq'],
  [R('nomuerto', 'nomuerto')]: ['capitan_femur', 'momia_real'],
  [R('nomuerto', 'mago')]: ['lich'],
  [R('espiritu', 'espiritu')]: ['espectro'],
  [R('espiritu', 'nomuerto')]: ['espectro', 'lich'],
  [R('guerrero', 'bestia')]: ['jinete_lobo', 'centauro'],
  [R('guerrero', 'dragon')]: ['caballero_drag'],
  [R('guerrero', 'hada')]: ['paladin'],
  [R('guerrero', 'maquina')]: ['cabo_mecanico'],
  [R('guerrero', 'guerrero')]: ['guerrero_osc', 'caballero_drag'],
  [R('mago', 'demonio')]: ['brujo_infernal'],
  [R('mago', 'dragon')]: ['archimago'],
  [R('mago', 'mago')]: ['bruja_plaga', 'brujo_infernal'],
  [R('hada', 'ave')]: ['valquiria'],
  [R('hada', 'hada')]: ['angel_campana'],
  [R('hada', 'nomuerto')]: ['esq_bendito'],
  [R('ave', 'bestia')]: ['grifo', 'quimera'],
  [R('demonio', 'bestia')]: ['bicefalo', 'quimera'],
  [R('bestia', 'bestia')]: ['oso', 'bicefalo'],
  [R('marino', 'dragon')]: ['leviatan'],
  [R('marino', 'marino')]: ['serp_marina', 'kraken'],
  [R('marino', 'nomuerto')]: ['pirata_ahogado'],
  [R('marino', 'guerrero')]: ['pirata_ahogado'],
  [R('marino', 'reptil')]: ['cocodrilo', 'kraken'],
  [R('marino', 'bestia')]: ['cocodrilo'],
  [R('maquina', 'maquina')]: ['tanque', 'coloso'],
  [R('roca', 'roca')]: ['gargola_onice', 'golem_runico'],
  [R('roca', 'dragon')]: ['gargola_onice'],
  [R('insecto', 'insecto')]: ['reina_colmena', 'escorpion'],
  [R('insecto', 'reptil')]: ['escorpion'],
  [R('insecto', 'planta')]: ['carnivora', 'guardian_bosque'],
  [R('planta', 'planta')]: ['carnivora', 'guardian_bosque'],
  [R('planta', 'roca')]: ['guardian_bosque'],
  [R('planta', 'bestia')]: ['carnivora', 'guardian_bosque'],
  [R('insecto', 'bestia')]: ['escorpion'],
  [R('reptil', 'reptil')]: ['basilisco'],
  [R('reptil', 'dragon')]: ['basilisco', 'dragon_ceniza'],
  [R('dragon', 'dragon')]: ['dragon_ceniza'],
  [R('demonio', 'demonio')]: ['demonio_azufre', 'canciller'],
  [R('vineta', 'dragon')]: ['dragon_tebeo'],
  [R('vineta', 'vineta')]: ['dragon_tebeo', 'rey_tebeo'],
  [R('vineta', 'mago')]: ['mago_vineta', 'rey_tebeo'],
};
const POR_ELEMENTO = {
  [R('fuego', 'agua')]: ['espiritu_vapor'],
  [R('fuego', 'tierra')]: ['golem_magma'],
  [R('luz', 'oscuridad')]: ['canciller'],
};
const masFlojoQueSupere = (lista, min) => lista.filter((id) => CARTAS[id].a > min).sort((x, y) => CARTAS[x].a - CARTAS[y].a)[0];
export function fusionar(a, b) {   // dos ids de bicho → id del resultado, o null
  if (!esBicho(a) || !esBicho(b)) return null;
  if (EXACTAS[R(a, b)]) return EXACTAS[R(a, b)];
  const A = CARTAS[a], Bc = CARTAS[b], min = Math.max(A.a, Bc.a);
  for (const tabla of [POR_TIPO[R(A.t, Bc.t)], POR_ELEMENTO[R(A.el, Bc.el)]]) {
    if (!tabla) continue; const r = masFlojoQueSupere(tabla, min); if (r) return r;
  }
  return null;
}
export const claveFusion = (a, b) => R(a, b);

// ---------- valor (para equilibrar mazos y para la IA) ----------
const VALOR_OTRAS = { bola_fuego: 22, chispas: 12, pocima: 14, farol: 10, escoba: 12, espada: 9, escudo: 9, hacha: 11, capa: 12, amuleto: 12, foso: 16, cuchillas: 12, red: 12, espejo: 15, sello: 12 };
export function valor(id) {
  const c = CARTAS[id]; if (!c) return 0;
  if (c.k === 'bicho') return (c.a + c.d) / 100 + (c.hab?.length || 0) * 3;
  if (c.k === 'terreno') return 10;
  return VALOR_OTRAS[id] ?? 10;
}

// ---------- azar con semilla (el mismo en las dos pantallas) ----------
export function semilla(...partes) { let h = 2166136261; for (const ch of partes.join('|')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function aleatorio(S) { S.s = (S.s + 0x6D2B79F5) >>> 0; let t = S.s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
export const rnd = (s) => { const o = { s: s >>> 0 }; return () => aleatorio(o); };
function barajar(lista, r) { const a = [...lista]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- líderes: tu héroe; la clase da su habilidad ----------
export const LIDERES = {
  barbaro: { n: 'Grito de guerra', txt: 'Tus bichos pegados a ti pegan +300.' },
  mago: { n: 'Brazo largo', txt: 'Puedes jugar cartas a dos casillas de ti, no solo al lado.' },
  ingeniero: { n: 'Muralla', txt: 'Tus bichos pegados a ti tienen +400 de defensa.' },
  explorador: { n: 'Piernas largas', txt: 'Te mueves dos casillas.' },
  vecino: { n: 'Paciencia', txt: 'Sin habilidad especial.' },
};

// ---------- crear la partida ----------
// mazos: [ids40, ids40]; lideres: [{clase, nombre}, …]; terreno: el de casa del rival (todo el tablero)
export function crearDuelo({ mazos, lideres, terreno = 'normal', s = 1 }) {
  const S = { s: s >>> 0, lp: [VIDA, VIDA], mazo: [], mano: [[], []], cem: [[], []], tab: [], u: [], uid: 1, juega: 0, turno: 0, jugado: false, fin: null, ev: [], lideres };
  for (let y = 0; y < LADO; y++) S.tab.push(Array(LADO).fill(terreno));
  const r = () => aleatorio(S);
  S.mazo = mazos.map((m) => barajar(m, r));
  for (const p of [0, 1]) S.u.push({ id: S.uid++, p, x: 3, y: p === 0 ? LADO - 1 : 0, lider: true, arriba: true, clase: lideres[p]?.clase || 'vecino', hecho: false, cambio: false, red: 0, ma: 0, md: 0 });
  for (const p of [0, 1]) robar(S, p);
  return S;
}
function robar(S, p) {
  let n = 0; while (S.mano[p].length < MANO && S.mazo[p].length) { S.mano[p].push(S.mazo[p].shift()); n++; }
  if (n) S.ev.push({ t: 'roba', p, n });
}
export const lider = (S, p) => S.u.find((u) => u.lider && u.p === p);
export const en = (S, x, y) => S.u.find((u) => u.x === x && u.y === y);
export const dentro = (x, y) => x >= 0 && y >= 0 && x < LADO && y < LADO;
const VECINOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const OCHO = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const habDe = (u) => (u.c && CARTAS[u.c].hab) || [];
const tiene = (u, h) => habDe(u).includes(h);
export const bichos = (S, p) => S.u.filter((u) => u.p === p && !u.lider && !u.trampa);
const trampas = (S, p) => S.u.filter((u) => u.p === p && u.trampa);

// ---------- ataque y defensa reales: carta + equipo + terreno + líder ----------
export function ajusteTerreno(S, u) {
  if (!u.c || u.trampa) return 0; const T = TERRENOS[S.tab[u.y][u.x]], C = CARTAS[u.c];
  const cumple = (r) => r && ((r.t || []).includes(C.t) || (r.el || []).includes(C.el));
  let b = 0; if (cumple(T.mas)) b += 500; if (cumple(T.menos)) b -= 500; if (T.todosMenos && !cumple(T.mas)) b -= 500;
  return b;
}
function pegadoALider(S, u) { const L = lider(S, u.p); return L && Math.max(Math.abs(L.x - u.x), Math.abs(L.y - u.y)) === 1; }
export function ataqueDe(S, u) {
  if (u.lider || u.trampa) return 0; const C = CARTAS[u.c];
  let a = C.a + u.ma + ajusteTerreno(S, u); if (lider(S, u.p)?.clase === 'barbaro' && pegadoALider(S, u)) a += 300;
  return Math.max(0, a);
}
export function defensaDe(S, u) {
  if (u.lider || u.trampa) return 0; const C = CARTAS[u.c];
  let d = C.d + u.md + ajusteTerreno(S, u); if (lider(S, u.p)?.clase === 'ingeniero' && pegadoALider(S, u)) d += 400;
  return Math.max(0, d);
}

// ---------- dónde puedes jugar ----------
export function alcanceJuego(S, p) { return lider(S, p).clase === 'mago' ? 2 : 1; }
export function casillasJuego(S, p, ids) {   // ids: las cartas elegidas, en orden. Devuelve [{x,y}] válidas según la primera.
  const C = CARTAS[ids[0]]; if (!C) return [];
  const L = lider(S, p), r = alcanceJuego(S, p), out = [];
  if (C.k === 'magia' && C.obj === 'rival') return S.u.filter((u) => u.p !== p && !u.lider).map((u) => ({ x: u.x, y: u.y }));
  if (C.k === 'magia') return [{ x: L.x, y: L.y }];
  if (C.k === 'equipo' && ids.length === 1) return bichos(S, p).filter((u) => Math.max(Math.abs(u.x - L.x), Math.abs(u.y - L.y)) <= r).map((u) => ({ x: u.x, y: u.y }));   // el equipo se lo das a uno que tengas cerca
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = L.x + dx, y = L.y + dy; if (!dentro(x, y) || (!dx && !dy)) continue;
    if (C.k === 'terreno') { out.push({ x, y }); continue; }
    if (en(S, x, y) || TERRENOS[S.tab[y][x]].muro) continue;
    if (C.k === 'trampa' && trampas(S, p).length >= MAX_TRAMPAS) continue;
    if ((C.k === 'bicho' || C.k === 'equipo') && bichos(S, p).length >= MAX_BICHOS && !(C.ritual)) continue;
    out.push({ x, y });
  }
  return out;
}

export function bonoEquipo(bicho, eq) { const E = CARTAS[eq]; return !E.el || CARTAS[bicho].el === E.el ? [E.a, E.d] : [100, 100]; }
// ---------- la jugada del turno: una carta o varias encadenadas (fusiones y equipo) ----------
// sel: índices de la mano en orden; opts: { def, arriba }
export function jugar(S, p, sel, x, y, opts = {}) {
  if (S.fin || S.juega !== p || S.jugado || !sel.length) return false;
  const ids = sel.map((i) => S.mano[p][i]); if (ids.some((v) => !v)) return false;
  if (!casillasJuego(S, p, ids).some((c) => c.x === x && c.y === y)) return false;
  S.mano[p] = S.mano[p].filter((_, i) => !sel.includes(i)); S.jugado = true;
  // encadenar
  let acc = ids[0], ma = 0, md = 0, fusiono = false;
  const equipar = (bicho, eq) => { const [a, d] = bonoEquipo(bicho, eq); ma += a; md += d; };
  for (let i = 1; i < ids.length; i++) {
    const b = ids[i], A = CARTAS[acc], Bc = CARTAS[b];
    if (A.k === 'bicho' && Bc.k === 'bicho') {
      const r = fusionar(acc, b);
      if (r) { S.ev.push({ t: 'fusion', p, a: acc, b, r, clave: claveFusion(acc, b) }); S.cem[p].push(acc, b); acc = r; ma = 0; md = 0; fusiono = true; continue; }
    } else if (A.k === 'bicho' && Bc.k === 'equipo') { equipar(acc, b); S.ev.push({ t: 'equipa', p, a: acc, b }); S.cem[p].push(b); continue; }
    else if (A.k === 'equipo' && Bc.k === 'bicho') { const eq = acc; acc = b; ma = 0; md = 0; equipar(acc, eq); S.ev.push({ t: 'equipa', p, a: b, b: eq }); S.cem[p].push(eq); continue; }
    S.ev.push({ t: 'fallo', p, a: acc, b }); S.cem[p].push(acc); acc = b; ma = 0; md = 0;
  }
  const C = CARTAS[acc];
  if (C.k === 'bicho') {
    if (en(S, x, y) || bichos(S, p).length >= MAX_BICHOS) { S.ev.push({ t: 'perdida', p, c: acc }); S.cem[p].push(acc); return true; }
    const u = { id: S.uid++, c: acc, p, x, y, arriba: !!opts.arriba, def: !!opts.def, ma, md, hecho: true, cambio: true, red: 0 };
    S.u.push(u); S.ev.push({ t: 'invoca', p, uid: u.id, c: acc, x, y, fusion: fusiono, u: { ...u } });
    aplastar(S, u); if (S.u.includes(u)) trampasInvocacion(S, u);
  } else if (C.k === 'trampa') {
    if (en(S, x, y)) { S.cem[p].push(acc); return true; }
    const u = { id: S.uid++, c: acc, p, x, y, arriba: false, trampa: true, def: false, ma: 0, md: 0, hecho: true, cambio: true, red: 0 };
    S.u.push(u); S.ev.push({ t: 'pone', p, uid: u.id, x, y, u: { ...u } });
  } else if (C.k === 'equipo') {
    const u = en(S, x, y);
    if (u && u.p === p && !u.lider && !u.trampa) { const [a, d] = bonoEquipo(u.c, acc); u.ma += a; u.md += d; S.ev.push({ t: 'equipa', p, uid: u.id, b: acc }); }
    else S.ev.push({ t: 'perdida', p, c: acc });
    S.cem[p].push(acc);
  } else if (C.k === 'terreno') {
    for (const [dx, dy] of [[0, 0], ...VECINOS]) {   // la casilla y una a cada lado (en cruz)
      const xx = x + dx, yy = y + dy; if (!dentro(xx, yy)) continue;
      if (C.terr === 'laberinto' && en(S, xx, yy)) continue;
      S.tab[yy][xx] = C.terr;
    }
    S.ev.push({ t: 'terreno', p, x, y, terr: C.terr, c: acc }); S.cem[p].push(acc);
    for (const u of [...S.u]) if (Math.abs(u.x - x) + Math.abs(u.y - y) <= 1) aplastar(S, u);
  } else if (C.k === 'magia') { magia(S, p, acc, x, y); S.cem[p].push(acc); }
  comprobar(S); return true;
}
function magia(S, p, id, x, y) {
  const o = 1 - p; S.ev.push({ t: 'magia', p, c: id, x, y });
  if (id === 'chispas') danar(S, o, 700);
  else if (id === 'pocima') { S.lp[p] += 1500; S.ev.push({ t: 'cura', p, n: 1500 }); }
  else if (id === 'farol') for (const u of S.u) if (u.p === o && !u.arriba) { u.arriba = true; S.ev.push({ t: 'voltea', uid: u.id }); }
  else if (id === 'escoba') for (const u of [...S.u]) if (u.p === o && u.trampa) destruir(S, u, 'escoba');
  else if (id === 'bola_fuego') {
    const u = en(S, x, y); if (!u || u.p === p || u.lider) return;
    if (!u.arriba) { u.arriba = true; S.ev.push({ t: 'voltea', uid: u.id }); }
    if (u.trampa || ataqueDe(S, u) <= 1500) destruir(S, u, 'fuego');
  }
}
function danar(S, p, n) { if (n <= 0) return; S.lp[p] = Math.max(0, S.lp[p] - n); S.ev.push({ t: 'dano', p, n }); }
function destruir(S, u, por = '') { const i = S.u.indexOf(u); if (i < 0) return; S.u.splice(i, 1); S.cem[u.p].push(u.c); S.ev.push({ t: 'destruye', uid: u.id, c: u.c, p: u.p, por }); }
function aplastar(S, u) {   // el derrumbe aplasta a los grandes
  const T = TERRENOS[S.tab[u.y][u.x]];
  if (T.aplasta && !u.lider && !u.trampa && !tiene(u, 'inmortal') && ataqueDe(S, u) >= T.aplasta) { u.arriba = true; destruir(S, u, 'derrumbe'); }
}

// ---------- trampas ----------
function aplicaTrampa(S, t, v) {   // ¿saltaría contra este bicho? (si no, se queda escondida)
  const id = t.c;
  if (id === 'foso') return ataqueDe(S, v) <= 1800;
  if (id === 'espejo') return ataqueDe(S, v) >= 2000;
  if (id === 'sello') return CARTAS[v.c].nv >= 5;
  return true;
}
function disparar(S, t, v) {
  S.ev.push({ t: 'trampa', uid: t.id, c: t.c, contra: v.id, x: t.x, y: t.y }); t.arriba = true;
  const id = t.c, aplica = aplicaTrampa(S, t, v); destruir(S, t, 'gastada');
  if (!aplica) return false;
  if (id === 'foso' || id === 'espejo' || id === 'sello') destruir(S, v, id);
  else if (id === 'red') { v.red = 2; S.ev.push({ t: 'pegado', uid: v.id }); }
  else if (id === 'cuchillas') { v.ma -= 1000; S.ev.push({ t: 'debilita', uid: v.id, n: 1000 }); }
  return true;
}
function trampasPaso(S, v) {
  for (const t of trampas(S, 1 - v.p)) if (CARTAS[t.c].cuando === 'paso' && dist(t, v) === 1 && aplicaTrampa(S, t, v)) { disparar(S, t, v); return true; }
  return false;
}
function trampasInvocacion(S, v) {
  for (const t of trampas(S, 1 - v.p)) if (CARTAS[t.c].cuando === 'invoca' && dist(t, v) <= 2 && aplicaTrampa(S, t, v)) { disparar(S, t, v); return true; }
  return false;
}
function trampasAtaque(S, atacante, defensor) {
  for (const t of trampas(S, defensor.p)) if (t !== defensor && CARTAS[t.c].cuando === 'ataque' && dist(t, defensor) <= 1 && aplicaTrampa(S, t, atacante)) { disparar(S, t, atacante); return true; }
  return false;
}

// ---------- moverse y atacar ----------
export function puedeEntrar(S, u, x, y) { const T = TERRENOS[S.tab[y][x]]; return !T.muro || tiene(u, 'fantasmal') || tiene(u, 'galerias'); }
export function pasos(S, u) {
  if (u.lider) return lider(S, u.p).clase === 'explorador' ? 2 : 1;
  const T = TERRENOS[S.tab[u.y][u.x]], C = CARTAS[u.c]; const favorece = T.mas && ((T.mas.t || []).includes(C.t) || (T.mas.el || []).includes(C.el));
  return tiene(u, 'veloz') || favorece ? 2 : 1;
}
export function opciones(S, uid) {   // { mover: [{x,y}], atacar: [{x,y,desde}] }
  const u = S.u.find((v) => v.id === uid), res = { mover: [], atacar: [] };
  if (!u || u.trampa || u.p !== S.juega || u.hecho || u.red > 0 || S.fin) return res;
  const max = pasos(S, u), vistos = new Map([[u.x + ',' + u.y, 0]]), cola = [[u.x, u.y, 0]];
  while (cola.length) {
    const [x, y, d] = cola.shift();
    for (const [dx, dy] of VECINOS) {
      const xx = x + dx, yy = y + dy, k = xx + ',' + yy; if (!dentro(xx, yy)) continue;
      const o = en(S, xx, yy);
      if (o) { if (o.p !== u.p && !u.lider && !u.def && !tiene(u, 'muro') && !res.atacar.some((a) => a.x === xx && a.y === yy)) res.atacar.push({ x: xx, y: yy, desde: { x, y } }); continue; }
      if (vistos.has(k) || d + 1 > max || !puedeEntrar(S, u, xx, yy)) continue;
      vistos.set(k, d + 1); res.mover.push({ x: xx, y: yy }); cola.push([xx, yy, d + 1]);
    }
  }
  return res;
}
export function mover(S, uid, x, y) {
  const u = S.u.find((v) => v.id === uid); if (!opciones(S, uid).mover.some((c) => c.x === x && c.y === y)) return false;
  const desde = { x: u.x, y: u.y }; u.x = x; u.y = y; u.hecho = true; u.cambio = true;
  S.ev.push({ t: 'mueve', uid, desde, x, y });
  if (!u.lider) { aplastar(S, u); if (S.u.includes(u)) trampasPaso(S, u); }
  comprobar(S); return true;
}
export function atacar(S, uid, x, y) {
  const u = S.u.find((v) => v.id === uid), op = opciones(S, uid).atacar.find((c) => c.x === x && c.y === y); if (!op) return false;
  const d = en(S, x, y);
  if (op.desde.x !== u.x || op.desde.y !== u.y) { const desde = { x: u.x, y: u.y }; u.x = op.desde.x; u.y = op.desde.y; S.ev.push({ t: 'mueve', uid, desde, x: u.x, y: u.y }); aplastar(S, u); if (!S.u.includes(u)) { comprobar(S); return true; } }
  u.hecho = true; u.cambio = true;
  if (!u.arriba) { u.arriba = true; S.ev.push({ t: 'voltea', uid: u.id }); }
  combate(S, u, d); comprobar(S); return true;
}
function combate(S, at, de) {
  const antes = { x: at.x, y: at.y };
  if (de.trampa) {   // has atacado una trampa creyendo que era un bicho
    de.arriba = true; S.ev.push({ t: 'voltea', uid: de.id }); disparar(S, de, at);
    if (S.u.includes(at) && !en(S, de.x, de.y)) { at.x = de.x; at.y = de.y; S.ev.push({ t: 'mueve', uid: at.id, desde: antes, x: at.x, y: at.y }); }
    return;
  }
  if (trampasAtaque(S, at, de) && !S.u.includes(at)) return;
  if (!de.arriba) { de.arriba = true; S.ev.push({ t: 'voltea', uid: de.id }); }
  const A = ataqueDe(S, at);
  if (de.lider) { S.ev.push({ t: 'combate', at: at.id, de: de.id, a: A, lider: true }); danar(S, de.p, A); return; }
  const deDef = de.def, V = deDef ? defensaDe(S, de) : ataqueDe(S, de), dx = de.x, dy = de.y, muro = TERRENOS[S.tab[dy][dx]].muro;
  S.ev.push({ t: 'combate', at: at.id, de: de.id, a: A, v: V, def: deDef });
  const entrar = () => { if (!muro || tiene(at, 'fantasmal') || tiene(at, 'galerias')) { at.x = dx; at.y = dy; S.ev.push({ t: 'mueve', uid: at.id, desde: antes, x: dx, y: dy }); aplastar(S, at); } };
  if (!deDef) {
    if (A > V) { destruir(S, de, 'combate'); danar(S, de.p, A - V); entrar(); }
    else if (A < V) { destruir(S, at, 'combate'); danar(S, at.p, V - A); }
    else { destruir(S, de, 'combate'); destruir(S, at, 'combate'); }
  } else {
    if (A > V) { destruir(S, de, 'combate'); if (tiene(at, 'perforante')) danar(S, de.p, A - V); entrar(); }
    else if (A < V) danar(S, at.p, V - A);
  }
}
export function voltear(S, uid) { const u = S.u.find((v) => v.id === uid); if (!u || u.p !== S.juega || u.arriba || u.trampa) return false; u.arriba = true; S.ev.push({ t: 'voltea', uid }); return true; }
export function cambiarPosicion(S, uid) {
  const u = S.u.find((v) => v.id === uid); if (!u || u.p !== S.juega || u.lider || u.trampa || u.cambio || u.hecho || u.red > 0) return false;
  u.def = !u.def; u.cambio = true; S.ev.push({ t: 'posicion', uid, def: u.def }); return true;   // girarse no gasta la acción: puedes girarte y atacar
}

// ---------- turnos y final ----------
function rodeado(S, p) {
  const L = lider(S, p), vec = VECINOS.map(([dx, dy]) => [L.x + dx, L.y + dy]).filter(([x, y]) => dentro(x, y));
  return vec.every(([x, y]) => { const o = en(S, x, y); return o && o.p !== p && !o.trampa; });
}
function comprobar(S) {
  if (S.fin) return;
  for (const p of [0, 1]) if (S.lp[p] <= 0) { S.fin = { gana: 1 - p, motivo: 'vida' }; S.ev.push({ t: 'fin', ...S.fin }); return; }
}
export function finTurno(S) {
  if (S.fin) return;
  const p = S.juega, o = 1 - p;
  if (rodeado(S, o)) { S.fin = { gana: p, motivo: 'rodeado' }; S.ev.push({ t: 'fin', ...S.fin }); return; }
  for (const u of S.u) if (u.p === p && u.red > 0) u.red--;
  S.turno++; S.juega = o; S.jugado = false;
  if (S.turno >= MAX_TURNOS) { S.fin = { gana: S.lp[0] === S.lp[1] ? -1 : S.lp[0] > S.lp[1] ? 0 : 1, motivo: 'tiempo' }; S.ev.push({ t: 'fin', ...S.fin }); return; }
  for (const u of S.u) if (u.p === o) { u.hecho = false; u.cambio = false; }
  robar(S, o);
  if (!S.mano[o].length && !S.mazo[o].length) { S.fin = { gana: p, motivo: 'mazo' }; S.ev.push({ t: 'fin', ...S.fin }); return; }
  S.ev.push({ t: 'turno', p: o, n: S.turno });
}
export const TEXTOS_FIN = { rendido: 'se ha rendido', vida: 'se ha quedado sin vida', rodeado: 'tiene al líder rodeado', mazo: 'se ha quedado sin cartas', tiempo: 'ha llegado al turno 99' };

// ---------- lo que ve cada uno (para la IA, que no hace trampas, y para la pantalla) ----------
export const visible = (S, u, quien) => u.p === quien || u.arriba;

// =============================================================
//  IA: juega con lo que ve (no mira tus cartas boca abajo ni tu mano) y con su carácter.
//  perfil: ataque (va a por la cabeza), trampas, defensa, fusion. Devuelve UNA acción; se llama hasta que diga 'fin'.
// =============================================================
export const PERFILES = {
  novato:     { ataque: .6, trampas: .4, defensa: .5, fusion: .3, riesgo: .5, cadena: 1 },
  agresivo:   { ataque: 1.3, trampas: .3, defensa: .3, fusion: .6, riesgo: .9 },
  tramposo:   { ataque: .8, trampas: 1.6, defensa: .6, fusion: .5, riesgo: .5 },
  defensivo:  { ataque: .6, trampas: .8, defensa: 1.4, fusion: .6, riesgo: .3 },
  fusionador: { ataque: .9, trampas: .5, defensa: .6, fusion: 1.5, riesgo: .6 },
};
const MEDIO = { a: 1200, d: 1100 };   // lo que la IA supone que hay debajo de una carta boca abajo
function permutaciones(n, k) { const out = []; const rec = (pre) => { if (pre.length) out.push([...pre]); if (pre.length === k) return; for (let i = 0; i < n; i++) if (!pre.includes(i)) { pre.push(i); rec(pre); pre.pop(); } }; rec([]); return out; }
function simularCadena(ids) { let acc = ids[0], perdidas = 0, fus = 0, ma = 0, md = 0; for (let i = 1; i < ids.length; i++) { const A = CARTAS[acc], Bc = CARTAS[ids[i]]; if (A.k === 'bicho' && Bc.k === 'bicho') { const r = fusionar(acc, ids[i]); if (r) { acc = r; fus++; ma = md = 0; continue; } } if (A.k === 'bicho' && Bc.k === 'equipo') { ma += Bc.a; md += Bc.d; continue; } perdidas += valor(acc); acc = ids[i]; ma = md = 0; } return { acc, perdidas, fus, ma, md }; }
export function accionIA(S, p, perfil = PERFILES.novato) {
  if (S.fin || S.juega !== p) return { t: 'fin' };
  const o = 1 - p, L = lider(S, p), LR = lider(S, o);
  const amenaza = (x, y) => S.u.filter((u) => u.p === o && !u.lider && !u.trampa && Math.abs(u.x - x) + Math.abs(u.y - y) <= 2).length;
  // 1) la jugada
  if (!S.jugado && S.mano[p].length) {
    let mejor = null; const mano = S.mano[p], cons = (j) => { if (!mejor || j.v > mejor.v) mejor = j; };
    const elegirCasilla = (ids, ofens) => {
      const big = CARTAS[ids[0]].k === 'bicho' && CARTAS[ids[0]].a >= 1500 && !(CARTAS[ids[0]].hab || []).includes('inmortal');
      const cs = casillasJuego(S, p, ids).filter((c) => !(big && TERRENOS[S.tab[c.y][c.x]].aplasta)); if (!cs.length) return null;
      return cs.map((c) => ({ c, s: -(Math.abs(c.x - LR.x) + Math.abs(c.y - LR.y)) * (ofens ? 1 : -.3) + (ofens ? 0 : -Math.abs(c.x - L.x) * .2) + aleatorio(S) * .3 })).sort((a, b) => b.s - a.s)[0].c;
    };
    for (const sel of permutaciones(mano.length, Math.min(perfil.cadena || 3, mano.length))) {
      const ids = sel.map((i) => mano[i]), C0 = CARTAS[ids[0]];
      if (sel.length > 1 && ids.some((id) => !['bicho', 'equipo'].includes(CARTAS[id].k))) continue;
      if (C0.k === 'bicho' || (C0.k === 'equipo' && sel.length > 1)) {
        const r = simularCadena(ids), R = CARTAS[r.acc]; if (R.k !== 'bicho') continue;
        if (bichos(S, p).length >= MAX_BICHOS) continue;
        const a = R.a + r.ma, d = R.d + r.md, ofens = a >= d;
        const casilla = elegirCasilla([r.acc], ofens || perfil.ataque > 1); if (!casilla) continue;
        const def = d > a * 1.25 || (perfil.defensa > 1 && a < 1500);
        cons({ v: (Math.max(a, d) + Math.min(a, d) * .3) / 100 + r.fus * 6 * perfil.fusion - r.perdidas * .6 - (sel.length - 1) * 2, j: { t: 'jugar', sel, ...casilla, def } });
      } else if (sel.length === 1 && C0.k === 'trampa') {
        const casilla = elegirCasilla(ids, true); if (!casilla) continue;
        const cerca = S.u.filter((u) => u.p === o && !u.lider).length;
        cons({ v: (valor(ids[0]) * .9 + cerca * 2) * perfil.trampas, j: { t: 'jugar', sel, ...casilla } });
      } else if (sel.length === 1 && C0.k === 'equipo') {
        const objetivo = bichos(S, p).sort((a, b) => ataqueDe(S, b) - ataqueDe(S, a))[0]; if (!objetivo) continue;
        cons({ v: valor(ids[0]) * .8, j: { t: 'jugar', sel, x: objetivo.x, y: objetivo.y } });
      } else if (sel.length === 1 && C0.k === 'magia') {
        let v = 0, x = L.x, y = L.y; const id = ids[0];
        if (id === 'chispas') v = 7 + (S.lp[o] <= 700 ? 100 : 0);
        if (id === 'pocima') v = S.lp[p] < 4000 ? 16 : 3;
        if (id === 'farol') v = S.u.filter((u) => u.p === o && !u.arriba && !u.lider).length * 4;
        if (id === 'escoba') v = S.u.filter((u) => u.p === o && u.trampa && u.arriba).length * 8 + 1;
        if (id === 'bola_fuego') { const t = S.u.filter((u) => u.p === o && !u.lider).map((u) => ({ u, s: u.arriba ? (ataqueDe(S, u) <= 1500 ? valor(u.c) : 1) : 6 })).sort((a, b) => b.s - a.s)[0]; if (t) { v = t.s; x = t.u.x; y = t.u.y; } }
        if (v > 0) cons({ v, j: { t: 'jugar', sel, x, y } });
      } else if (sel.length === 1 && C0.k === 'terreno') {
        const cs = casillasJuego(S, p, ids); let best = null;
        for (const c of cs) { let s = 0; for (const u of S.u) if (!u.lider && !u.trampa && Math.abs(u.x - c.x) + Math.abs(u.y - c.y) <= 1 && visible(S, u, p)) { const antes = S.tab[u.y][u.x]; S.tab[u.y][u.x] = C0.terr; const b = ajusteTerreno(S, u); S.tab[u.y][u.x] = antes; s += (u.p === p ? 1 : -1) * (b - ajusteTerreno(S, u)) / 100; } if (!best || s > best.s) best = { c, s }; }
        if (best && best.s > 0) cons({ v: best.s, j: { t: 'jugar', sel, ...best.c } });
      }
    }
    if (mejor && mejor.v > 0) return mejor.j;
  }
  // 2) los bichos: atacar si sale a cuenta; si no, avanzar o guardar
  const mios = bichos(S, p).filter((u) => !u.hecho && u.red <= 0).sort((a, b) => ataqueDe(S, b) - ataqueDe(S, a));
  for (const u of mios) {
    const op = opciones(S, u.id), A = ataqueDe(S, u);
    let mejorAt = null;
    for (const c of op.atacar) {
      const d = en(S, c.x, c.y); let s;
      if (d.lider) s = A / 100 * 2 * perfil.ataque + 10;
      else if (d.arriba && !d.trampa) {
        const V = d.def ? defensaDe(S, d) : ataqueDe(S, d);
        s = A > V ? valor(d.c) + (d.def ? 0 : (A - V) / 200) : A === V && !d.def ? valor(d.c) - valor(u.c) : -(valor(u.c) + (V - A) / 200);
      } else s = (A > MEDIO.a ? 6 : A > 900 ? 1 : -6) * perfil.riesgo - 2 + (perfil.ataque - 1) * 3;
      if (!mejorAt || s > mejorAt.s) mejorAt = { c, s };
    }
    if (mejorAt && mejorAt.s > 0) return { t: 'atacar', uid: u.id, x: mejorAt.c.x, y: mejorAt.c.y };
    // ¿mejor en defensa?
    const peligro = S.u.filter((e) => e.p === o && !e.lider && visible(S, e, p) && !e.trampa && dist(e, u) <= 2 && ataqueDe(S, e) > A);
    if (!u.def && !u.cambio && peligro.length && defensaDe(S, u) > A) return { t: 'posicion', uid: u.id };
    if (u.def && !u.cambio && !peligro.length && perfil.defensa < 1.2 && A >= defensaDe(S, u) * .8) return { t: 'posicion', uid: u.id };
    if (u.def) continue;
    // moverse: hacia la cabeza rival (los de defensa se quedan cerca de su líder)
    const guarda = perfil.defensa > 1 && dist(u, L) <= 2 && amenaza(L.x, L.y) > 0;
    if (op.mover.length && !guarda) {
      const puntua = (c) => {
        let s = -(Math.abs(c.x - LR.x) + Math.abs(c.y - LR.y)) * perfil.ataque;
        for (const e of S.u) if (e.p === o && !e.lider && !e.trampa && Math.abs(e.x - c.x) + Math.abs(e.y - c.y) === 1) { const V = visible(S, e, p) ? (e.def ? defensaDe(S, e) : ataqueDe(S, e)) : MEDIO.a; s += V > A ? -4 : 1; }
        if (perfil.defensa > 1) s -= Math.abs(c.x - L.x) + Math.abs(c.y - L.y) > 3 ? 3 : 0;
        return s + aleatorio(S) * .2;
      };
      const ahora = puntua({ x: u.x, y: u.y }) + .5, mejor = op.mover.map((c) => ({ c, s: puntua(c) })).sort((a, b) => b.s - a.s)[0];
      if (mejor && mejor.s > ahora) return { t: 'mover', uid: u.id, x: mejor.c.x, y: mejor.c.y };
    }
  }
  // 3) el líder: se aparta si le amenazan
  if (!L.hecho) {
    const op = opciones(S, L.id), aqui = amenaza(L.x, L.y);
    if (aqui > 0 && op.mover.length) { const m = op.mover.map((c) => ({ c, s: -amenaza(c.x, c.y) * 3 - Math.abs(c.y - (p === 0 ? LADO - 1 : 0)) * .5 })).sort((a, b) => b.s - a.s)[0]; if (m.s > -aqui * 3) return { t: 'mover', uid: L.id, x: m.c.x, y: m.c.y }; }
  }
  return { t: 'fin' };
}
export function aplicar(S, p, a) {   // aplica una acción (de la IA o de la red); devuelve si se pudo
  if (a.t === 'jugar') return jugar(S, p, a.sel, a.x, a.y, { def: a.def, arriba: a.arriba });
  if (a.t === 'mover') return mover(S, a.uid, a.x, a.y);
  if (a.t === 'atacar') return atacar(S, a.uid, a.x, a.y);
  if (a.t === 'voltear') return voltear(S, a.uid);
  if (a.t === 'posicion') return cambiarPosicion(S, a.uid);
  if (a.t === 'fin') { if (S.juega !== p) return false; finTurno(S); return true; }
  if (a.t === 'rendir') { if (S.fin) return false; S.fin = { gana: 1 - p, motivo: 'rendido' }; S.ev.push({ t: 'fin', ...S.fin }); return true; }
  return false;
}

// =============================================================
//  MAZOS: los preconstruidos del principio (eliges 1 de 3, distintos para cada héroe) y los de los rivales.
//  Todos con el mismo valor total, para que la suerte esté en el estilo y no en que te toque uno roto.
// =============================================================
const SUELTAS = Object.keys(CARTAS).filter((id) => esBicho(id) && !CARTAS[id].fus && !CARTAS[id].jefe);
export const TEMAS = [
  { id: 'huesos', n: 'Huesos y Cadenas', e: '💀', tipos: ['nomuerto', 'espiritu'], txt: 'No-muertos y fantasmas que no se cansan nunca.' },
  { id: 'bosque', n: 'La Manada del Bosque', e: '🐺', tipos: ['bestia', 'planta', 'insecto'], txt: 'Bestias rápidas y plantas que muerden.' },
  { id: 'escamas', n: 'Escamas y Ceniza', e: '🐲', tipos: ['dragon', 'reptil'], txt: 'Bichos de sangre fría y algún dragón con mal genio.' },
  { id: 'campanas', n: 'Campanas y Alas', e: '🧚', tipos: ['hada', 'ave'], txt: 'Luz, viento y plumas.' },
  { id: 'chatarra', n: 'Cachivaches de Rufo', e: '🤖', tipos: ['maquina', 'roca'], txt: 'Cosas que hacen ruido y no se rompen.' },
  { id: 'marea', n: 'Marea Baja', e: '🦀', tipos: ['marino', 'reptil'], txt: 'Todo lo que pellizca y huele a puerto.' },
  { id: 'bichos', n: 'Plaga de Bichos', e: '🕷️', tipos: ['insecto', 'planta'], txt: 'Patas, antenas y mucha paciencia.' },
  { id: 'acero', n: 'Acero y Gritos', e: '⚔️', tipos: ['guerrero', 'bestia'], txt: 'Trasgos, orcos y gente con espada.' },
  { id: 'azufre', n: 'Azufre y Grimorios', e: '😈', tipos: ['demonio', 'mago'], txt: 'Magos raros y diablillos con prisa.' },
  { id: 'piedra', n: 'Piedra Viva', e: '🗿', tipos: ['roca', 'guerrero'], txt: 'Muros con patas.' },
];
const MAGIAS = ['bola_fuego', 'chispas', 'pocima', 'farol', 'escoba'], TERRS = ['t_bosque', 't_mar', 't_oscuridad', 't_montana', 't_paramo', 't_pradera', 't_vinetas', 't_laberinto', 't_derrumbe'];
const EQUIPOS = ['espada', 'escudo', 'hacha', 'capa', 'amuleto'], TRAMPAS = ['foso', 'cuchillas', 'red', 'espejo', 'sello'];
export const VALOR_INICIAL = 600;
// tema + semilla + objetivo de valor → 40 cartas (máximo 3 copias)
export function construirMazo(tema, s, objetivo = VALOR_INICIAL, { nivelMax = 4, gordos = 2, trampasExtra = 0 } = {}) {
  const r = rnd(s), T = TEMAS.find((t) => t.id === tema) || TEMAS[0], cuenta = {}, mazo = [];
  const meter = (id) => { if ((cuenta[id] || 0) >= 3) return false; cuenta[id] = (cuenta[id] || 0) + 1; mazo.push(id); return true; };
  const del = (lista) => lista[Math.floor(r() * lista.length)];
  const propios = SUELTAS.filter((id) => T.tipos.includes(CARTAS[id].t) && CARTAS[id].nv <= nivelMax), otros = SUELTAS.filter((id) => !T.tipos.includes(CARTAS[id].t) && CARTAS[id].nv <= nivelMax);
  const grandes = SUELTAS.filter((id) => CARTAS[id].nv > nivelMax && CARTAS[id].nv <= nivelMax + 2 && (T.tipos.includes(CARTAS[id].t) || r() < .3));
  for (let i = 0; i < gordos && grandes.length; i++) meter(del(grandes));
  let guard = 0; while (mazo.length < 26 && guard++ < 500) meter(r() < .7 && propios.length ? del(propios) : del(otros));
  const suyos = TERRS.filter((t) => T.tipos.some((tp) => (TERRENOS[CARTAS[t].terr].mas?.t || []).includes(tp)));
  const resto = [[MAGIAS, 4], [suyos.length ? suyos : ['t_laberinto'], 2], [EQUIPOS, 4], [TRAMPAS, 4 + trampasExtra]];
  for (const [lista, n] of resto) { let k = 0, g = 0; while (k < n && g++ < 100) if (meter(del(lista.length ? lista : MAGIAS))) k++; }
  while (mazo.length > 40) mazo.splice(mazo.findIndex((id) => esBicho(id)), 1);
  while (mazo.length < 40) meter(del(otros));
  // ajustar al valor objetivo cambiando bichos por otros más o menos fuertes
  const total = () => mazo.reduce((s, id) => s + valor(id), 0);
  for (let i = 0; i < 400 && Math.abs(total() - objetivo) > objetivo * .015; i++) {
    const sube = total() < objetivo, idx = mazo.map((id, j) => j).filter((j) => esBicho(mazo[j]))[Math.floor(r() * 26)]; if (idx == null) break;
    const actual = mazo[idx], cand = (r() < .7 ? propios : otros).filter((id) => (sube ? valor(id) > valor(actual) : valor(id) < valor(actual)) && (cuenta[id] || 0) < 3);
    if (!cand.length) continue; const nuevo = cand[Math.floor(r() * cand.length)];
    cuenta[actual]--; cuenta[nuevo] = (cuenta[nuevo] || 0) + 1; mazo[idx] = nuevo;
  }
  return mazo;
}
// El mazo de viñetas de pruebas (para Carlos, en ?debug=1): dibujos que en su terreno pegan y fuera de él se debilitan los demás
export const MAZO_VINETAS = [
  ...Array(3).fill('conejo_garabato'), ...Array(3).fill('gato_garabato'), ...Array(3).fill('sirena_tebeo'), ...Array(3).fill('calavera_risa'),
  ...Array(3).fill('caballero_papel'), ...Array(3).fill('muneco_tinta'), ...Array(2).fill('mago_vineta'), ...Array(3).fill('dragoncito'),
  ...Array(3).fill('t_vinetas'), ...Array(3).fill('bola_fuego'), 'farol', 'chispas', 'chispas',
  'espada', 'espada', 'amuleto', 'amuleto', 'foso', 'foso', 'espejo', 'sello',
];
export const valorMazo = (m) => Math.round(m.reduce((s, id) => s + valor(id), 0));
export function mazosIniciales(heroeId) {   // los 3 que te ofrecen (fijos para cada héroe)
  const r = rnd(semilla('mazos', heroeId)), temas = [...TEMAS]; const out = [];
  for (let i = 0; i < 3; i++) { const t = temas.splice(Math.floor(r() * temas.length), 1)[0]; out.push({ tema: t, mazo: construirMazo(t.id, semilla('mazo', heroeId, t.id)) }); }
  return out;
}

// ---------- los rivales del pueblo (sus mazos crecen si el tuyo es más bestia) ----------
export const RIVALES_C = [
  { id: 'pip', quien: 'Pip', e: '🧒', terreno: 'normal', tema: 'acero', perfil: 'novato', valor: 560, frase: '¡Mi primo dice que soy el mejor del pueblo! Bueno, de mi calle.' },
  { id: 'anzuelo', quien: 'El Viejo Anzuelo', e: '🎣', terreno: 'mar', tema: 'marea', perfil: 'defensivo', valor: 620, frase: 'En el mar se aprende paciencia. Y a oler mal.' },
  { id: 'brasa', quien: 'Brasa la Herrera', e: '🔨', terreno: 'montana', tema: 'escamas', perfil: 'agresivo', valor: 660, frase: 'Yo forjo espadas. Las cartas las forjo a golpes.' },
  { id: 'rufo', quien: 'Rufo', e: '🏴‍☠️', terreno: 'paramo', tema: 'chatarra', perfil: 'tramposo', valor: 700, trampasExtra: 3, frase: 'Juego limpio, palabra de pirata. Ejem.' },
  { id: 'fantasma', quien: 'El Fantasma del Pozo', e: '👻', terreno: 'oscuridad', tema: 'huesos', perfil: 'fusionador', valor: 760, nivelMax: 5, frase: 'Uuuuh… ¿una partidita? Llevo cien años sin rival.' },
];
export function mazoRival(R, tuValor, revancha = 0) {
  const objetivo = Math.max(R.valor, Math.round(tuValor * (1 + revancha * .06))) + revancha * 30;
  return construirMazo(R.tema, semilla('rival', R.id, revancha), objetivo, { nivelMax: (R.nivelMax || 4) + (revancha ? 1 : 0), gordos: 2 + revancha, trampasExtra: R.trampasExtra || 0 });
}
