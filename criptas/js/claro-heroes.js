// =============================================================
//  EL CLARO · HÉROES DEL MODO AVENTURA: razas, clases, niveles y guardado.
//  Raza y clase van por separado (un enano mago, una elfa bárbara…).
//  La raza da el aspecto y un rasgo pequeño; la clase, la forma de pelear
//  y una habilidad pensada para ir solo, sin tres compañeros al lado.
// =============================================================
import { usuarioListo, leerAventuraNube, subirAventura } from './nube.js';
import { ARMAS } from './datos.js';

export const RAZAS = {
  humano: { nombre: 'Humano', icono: '🧑', rasgo: 'Versátil', texto: 'Un uso más de su habilidad en cada combate. Racial: «¡A por ellos!», un turno con dos acciones.', activa: { id: 'aporellos', nombre: '¡A por ellos!', icono: '📯' }, pieles: ['#f4c7a1', '#e0a77e', '#b97a52', '#7a4a2e'], pelos: ['#6b3a2a', '#2b1d16', '#d9a441', '#b8462a', '#e8e0d0'] },
  enano: { nombre: 'Enano', icono: '🧔', rasgo: 'Duro de pelar', texto: 'Dos puntos de cuerpo más. Racial: «Piel de piedra», hasta tu siguiente turno ningún golpe te quita más de 1. Bajito, ancho y testarudo.', activa: { id: 'piedra', nombre: 'Piel de piedra', icono: '🪨' }, pieles: ['#f0bf98', '#d99c74', '#a96e48', '#7a4a2e'], pelos: ['#b8462a', '#6b3a2a', '#2b1d16', '#d9d2c4', '#e3a13a'] },
  elfo: { nombre: 'Elfo', icono: '🧝', rasgo: 'Pies ligeros', texto: 'Dos casillas más cada vez que se mueve. Racial: «Sombra del bosque», te escabulles hasta cuatro casillas sin gastar el movimiento.', activa: { id: 'sombra', nombre: 'Sombra del bosque', icono: '🍃' }, pieles: ['#f7dcc4', '#e8c1a0', '#c99a7a', '#9a7ab8'], pelos: ['#f1e3b0', '#e8e8f0', '#2b1d16', '#7a5ad9', '#3f8a6a'] },
  escamado: { nombre: 'Escamado', icono: '🐲', rasgo: 'Escamas', activa: { id: 'aliento', nombre: 'Aliento de dragón', icono: '🔥' }, texto: 'El primer golpe de cada combate le hace uno menos. Racial: «Aliento de dragón», fuego a todos los enemigos pegados a ti. Gente dragón de Velmor.', pieles: ['#4fae7a', '#3f8fb0', '#c4553a', '#b08a3a'], pelos: ['#f2d48a', '#e8e0d0', '#2b1d16', '#ff9a4a', '#9ad0ff'] },
  troll: { nombre: 'Trol', icono: '🧌', rasgo: 'Regeneración', activa: { id: 'rezo', nombre: 'Rezo vudú', icono: '🗿' }, texto: 'Se cura un poco al empezar sus turnos. Racial: «Rezo vudú», +2 dados de ataque y +1 de defensa durante dos turnos. Alto, encorvado y con colmillos.', pieles: ['#5a8ac8', '#4a9a8a', '#7aa05a', '#8a6ab0'], pelos: ['#e84a3a', '#3ad0e0', '#f0f0f0', '#ff8a2a', '#2b1d16'] },
};

export const CLASES = {
  barbaro: { nombre: 'Bárbaro', icono: '🪓', ataque: 3, defensa: 2, cuerpo: 9, habilidad: { id: 'brutal', nombre: 'Golpe brutal', icono: '💥', usos: 2, texto: 'Un hachazo con dos dados más.' }, texto: 'Pega fuerte y aguanta más. No le pidas sutileza.', ropa: ['#9a4a2e', '#5a6a3a', '#3d5bd9', '#7a3a6a', '#2f2f3a', '#c4553a'] },
  mago: { nombre: 'Mago', icono: '🧙', ataque: 2, defensa: 2, cuerpo: 7, habilidad: { id: 'fuego', nombre: 'Bola de fuego', icono: '🔥', usos: 2, texto: 'Dos de daño a cualquier enemigo del tablero.' }, texto: 'Frágil de cerca, pero quema lo que mira.', ropa: ['#3d5bd9', '#7a3a9a', '#2f8a7a', '#c44a5a', '#2f2f3a', '#d9a441'] },
  ingeniero: { nombre: 'Ingeniero', icono: '🔧', ataque: 2, defensa: 3, cuerpo: 8, habilidad: { id: 'torreta', nombre: 'Torreta', icono: '⚙️', usos: 1, texto: 'Monta una torreta al lado que dispara sola cada turno.' }, texto: 'Si no hay compañeros, se los fabrica.', ropa: ['#b07a3a', '#3f6a8a', '#6a4a3a', '#8a3a3a', '#4a5a4a', '#d9a441'] },
  explorador: { nombre: 'Explorador', icono: '🏹', ataque: 2, defensa: 2, cuerpo: 7, habilidad: { id: 'flecha', nombre: 'Flecha', icono: '🏹', usos: 3, texto: 'Dispara a un enemigo a hasta cinco casillas.' }, texto: 'Ataca de lejos y no se deja pillar.', ropa: ['#4e8a4a', '#6a5a3a', '#3a5a7a', '#7a4a5a', '#2f3a2f', '#b0803a'] }
};

// Experiencia necesaria para cada nivel (el 1 empieza en 0)
export const NIVELES = [0, 30, 80, 150, 250, 380, 540, 740];
export const nivelDe = (xp) => { let n = 1; for (let i = 1; i < NIVELES.length; i++) if (xp >= NIVELES[i]) n = i + 1; return n; };
export const XP = { Esqueleto: 10, 'Capitán Fémur': 25 };

// Lo que sueltan los monstruos de las criptas (como en una cacería: se lleva a la forja)
export const MATERIALES = {
  hueso: { n: 'Hueso pulido', e: '🦴' }, polvo: { n: 'Polvo de tumba', e: '⚱️' }, venda: { n: 'Venda de momia', e: '🧻' },
  ectoplasma: { n: 'Ectoplasma', e: '👻' }, piedra: { n: 'Piedra rúnica', e: '🪨' }, trofeo: { n: 'Trofeo de jefe', e: '🏆' }
};
export const BOTIN = { esqueleto: 'hueso', guerrero: 'hueso', orco: 'hueso', sacerdotisa: 'hueso', zombi: 'polvo', trasgo: 'polvo', bruja: 'polvo', momia: 'venda', fantasma: 'ectoplasma', hechicero: 'ectoplasma', ilusionista: 'ectoplasma', gargola: 'piedra', golem: 'piedra' };
// Qué cae al vencer a un monstruo: su material (no siempre) y, si era jefe, su trofeo y dos más
export function botinDe(tipo, jefe) {
  const m = BOTIN[tipo] || 'polvo', r = {};
  if (jefe) { r.trofeo = 1; r[m] = 2; } else if (Math.random() < .65) r[m] = 1;
  return r;
}
export function sumarBotin(h, b) { h.materiales ||= {}; for (const [k, n] of Object.entries(b)) h.materiales[k] = (h.materiales[k] || 0) + n; }
export const textoBotin = (b) => Object.entries(b).filter(([, n]) => n > 0).map(([k, n]) => `${MATERIALES[k].e}×${n}`).join(' ');

// La forja de Brasa (en Morrandar): lo que cuesta cada mejora, en oro y materiales; cada nivel, un dado (o un uso) más
export const FORJA = {
  arma: [{ oro: 60, hueso: 3 }, { oro: 150, hueso: 5, polvo: 2 }, { oro: 300, trofeo: 1, piedra: 2 }],
  armadura: [{ oro: 50, hueso: 2 }, { oro: 130, venda: 2, polvo: 2 }, { oro: 260, trofeo: 1, ectoplasma: 2 }],
  amuleto: [{ oro: 80, ectoplasma: 2 }, { oro: 200, trofeo: 1, piedra: 1 }],
  pocion: 25
};

// Lo que el héroe tiene ahora mismo, según raza, clase, nivel y lo que le ha forjado Brasa
// enCripta: la comida de Marga solo cuenta dentro de la cripta (y se gasta en ella)
export function estadisticas(h, enCripta = false) {
  const c = CLASES[h.clase], n = h.nivel || 1, co = enCripta ? h.comida?.efecto : null, mj = mejorasDe(h);
  return {
    ataque: Math.max(c.ataque, ARMAS[h.arma]?.ataque || 0) + mj.ataque + (h.forja?.arma || 0) + (co === 'ataque' ? 1 : 0),   // un arma encontrada solo cuenta si es mejor que la tuya
    defensa: c.defensa + mj.defensa + (h.forja?.armadura || 0) + (co === 'defensa' ? 1 : 0),
    max: c.cuerpo + (h.raza === 'enano' ? 2 : 0) + (n - 1) + mj.cuerpo + (co === 'cuerpo' ? 2 : 0),
    usos: c.habilidad.usos + (h.raza === 'humano' ? 1 : 0) + mj.usos + (co === 'habilidad' ? 1 : 0) + (h.forja?.amuleto || 0),
    pasosExtra: h.raza === 'elfo' ? 2 : 0,
    hab: { reforzada: mj.reforzada || 0, rapida: mj.rapida || 0, gorda: mj.gorda || 0, certera: mj.certera || 0, furia: mj.furia || 0 },   // mejoras propias de la clase
    escamas: h.raza === 'escamado',
    regenera: h.raza === 'troll' ? 2 : 0,
    racial: RAZAS[h.raza]?.activa || null   // la racial activa: un botón, una vez por pelea, sin gastar acción
  };
}
// Lo que elegiste al subir de nivel. Los héroes de antes (sin elección) tienen las mejoras fijas de siempre.
function mejorasDe(h) {
  if (h.mejoras) return { ataque: 0, defensa: 0, cuerpo: 0, usos: 0, ...h.mejoras };
  const n = h.nivel || 1;
  return { ataque: n >= 3 ? 1 : 0, defensa: n >= 5 ? 1 : 0, cuerpo: 0, usos: (n >= 2 ? 1 : 0) + (n >= 4 ? 1 : 0) };
}
// Al subir de nivel: siempre +1 de cuerpo, y además eliges una de estas
export const OPCIONES_MEJORA = [
  { id: 'ataque', texto: '⚔️ Un dado más de ataque', max: 3 },
  { id: 'defensa', texto: '🛡️ Un dado más de defensa', max: 3 },
  { id: 'cuerpo', texto: '❤️ Dos de cuerpo más (en vez de uno)', valor: 1 },
  { id: 'usos', texto: '✨ Un uso más de tu habilidad', max: 4 }
];
// Las que todavía se pueden coger (ataque y defensa tienen tope, para que nadie sea invencible)
// Y las propias de cada clase: hacen su habilidad más gorda (el ingeniero puede acabar plantando torretas como un chamán sus tótems)
export const MEJORAS_CLASE = {
  ingeniero: [
    { id: 'reforzada', texto: '⚙️ Torreta reforzada: +1 de cuerpo y +1 dado de ataque a cada torreta', max: 3 },
    { id: 'rapida', texto: '🔩 Montaje rápido: montar torretas ya no te gasta el ataque (puedes plantar varias en un turno)', max: 1 }
  ],
  mago: [{ id: 'gorda', texto: '🔥 Bola de fuego más gorda: un punto más de daño', max: 2 }],
  explorador: [{ id: 'certera', texto: '🏹 Flecha certera: dos dados más al disparar', max: 2 }],
  barbaro: [{ id: 'furia', texto: '💥 Más brutal: el golpe brutal tira un dado más', max: 2 }]
};
export function mejorasDisponibles(h) { const mj = mejorasDe(h); return [...OPCIONES_MEJORA, ...(MEJORAS_CLASE[h.clase] || [])].filter((o) => !o.max || (mj[o.id] || 0) < o.max); }
// Apunta la elección (y convierte a los héroes antiguos al sistema nuevo sin que pierdan nada)
export function prepararSubida(h) { if (!h.mejoras) h.mejoras = mejorasDe(h); }   // llamar ANTES de subirle el nivel
export function elegirMejora(h, id) { prepararSubida(h); h.mejoras[id] = (h.mejoras[id] || 0) + 1; }
// Qué se gana en cada nivel (para contarlo al subir)
export function mejoraDeNivel() { return '+1 de cuerpo y una mejora a tu elección'; }

const nombres = { humano: ['Aldo', 'Nerea', 'Bruno', 'Lucía', 'Tomás', 'Irene'], enano: ['Gruñón Barbarroja', 'Brunilda', 'Thorvo', 'Grisa Martillo', 'Dorm', 'Bolva'], elfo: ['Lirael', 'Eldrin', 'Sylva', 'Thalion', 'Aelis', 'Fëanra'], escamado: ['Zarkh', 'Sssandra', 'Kraz', 'Ithra', 'Vorn', 'Sali'], troll: ['Zanjo', 'Rakazi', 'Tumbo', 'Zekka', 'Mabuku', 'Sazrá'] };
const al = (l) => l[Math.floor(Math.random() * l.length)];
export function heroeAlAzar() {
  const raza = al(Object.keys(RAZAS)), clase = al(Object.keys(CLASES)), R = RAZAS[raza];
  return { nombre: al(nombres[raza]), raza, clase, colores: { ropa: al(CLASES[clase].ropa), piel: al(R.pieles), pelo: al(R.pelos) }, nivel: 1, xp: 0, oro: 0, pociones: 1 };
}

// ---------- guardado: en este navegador y, si hay sesión, en la nube ----------
const CLAVE = 'criptas_aventura';
export function leerLocal() { try { return JSON.parse(localStorage.getItem(CLAVE)); } catch { return null; } }
export async function cargarHeroe() {
  const local = leerLocal();
  try {
    await Promise.race([usuarioListo(), new Promise((r) => setTimeout(r, 2500))]);
    const nube = await leerAventuraNube();
    if (nube && (!local || (nube.actualizada || 0) > (local.actualizada || 0))) { try { localStorage.setItem(CLAVE, JSON.stringify(nube)); } catch { /* sin almacenamiento */ } return nube; }
  } catch (e) { console.warn('Aventura sin nube:', e?.message); }
  return local;
}
export function guardarHeroe(h, ya = false) {
  if (!h) return;
  h.actualizada = Date.now();
  try { localStorage.setItem(CLAVE, JSON.stringify(h)); } catch { /* sin almacenamiento */ }
  try { subirAventura(h, ya); } catch { /* sin nube */ }
}
