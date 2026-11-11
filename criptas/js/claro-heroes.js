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
  elfo: { nombre: 'Elfo', icono: '🧝', rasgo: 'Pies ligeros', texto: 'Dos casillas más al moverse y un dado más de defensa: es difícil de pillar. Racial: «Sombra del bosque», te escabulles hasta cuatro casillas sin gastar el movimiento.', activa: { id: 'sombra', nombre: 'Sombra del bosque', icono: '🍃' }, pieles: ['#f7dcc4', '#e8c1a0', '#c99a7a', '#9a7ab8'], pelos: ['#f1e3b0', '#e8e8f0', '#2b1d16', '#7a5ad9', '#3f8a6a'] },
  escamado: { nombre: 'Escamado', icono: '🐲', rasgo: 'Escamas', activa: { id: 'aliento', nombre: 'Aliento de dragón', icono: '🔥' }, texto: 'El primer golpe de cada combate le hace uno menos. Racial: «Aliento de dragón», fuego a todos los enemigos pegados a ti (lo para quien saque un escudo). Gente dragón de Velmor.', pieles: ['#4fae7a', '#3f8fb0', '#c4553a', '#b08a3a'], pelos: ['#f2d48a', '#e8e0d0', '#2b1d16', '#ff9a4a', '#9ad0ff'] },
  troll: { nombre: 'Trol', icono: '🧌', rasgo: 'Carne de trol', activa: { id: 'rezo', nombre: 'Rezo vudú', icono: '🗿' }, texto: 'Al ganar cada pelea recupera 1 de cuerpo más. Racial: «Rezo vudú», elige a qué loa rezas antes de bajar a la cripta y pide su bendición una vez en cada pelea. Alto, encorvado y con colmillos.', pieles: ['#5a8ac8', '#4a9a8a', '#7aa05a', '#8a6ab0'], pelos: ['#e84a3a', '#3ad0e0', '#f0f0f0', '#ff8a2a', '#2b1d16'] },
};

// Los loas del trol: se elige uno antes de bajar a la cripta; cada rezo da su bendición durante dos turnos
export const LOAS = {
  tigre: { nombre: 'Loa del Tigre', icono: '🐅', texto: '+2 dados de ataque, y lo que golpeas sangra 1 al turno siguiente.' },
  rana: { nombre: 'Loa de la Rana', icono: '🐸', texto: 'El de curarse: te cura 3 de golpe y paras con un dado más.' },
  muerte: { nombre: 'Loa de la Muerte', icono: '💀', texto: 'Cada golpe que das te cura 1.' },
  raptor: { nombre: 'Loa del Raptor', icono: '🦖', texto: '+3 casillas al moverte y +1 dado de ataque.' }
};
export const REZOS_CRIPTA = 1;   // por pelea

export const CLASES = {
  barbaro: { nombre: 'Bárbaro', icono: '🪓', ataque: 3, defensa: 2, cuerpo: 9, habilidad: { id: 'brutal', nombre: 'Golpe brutal', icono: '💥', usos: 2, texto: 'Un hachazo con dos dados más.' }, texto: 'Pega fuerte y aguanta más. No le pidas sutileza.', ropa: ['#9a4a2e', '#5a6a3a', '#3d5bd9', '#7a3a6a', '#2f2f3a', '#c4553a'] },
  mago: { nombre: 'Mago', icono: '🧙', ataque: 2, defensa: 2, cuerpo: 8, habilidad: { id: 'fuego', nombre: 'Bola de fuego', icono: '🔥', usos: 3, texto: 'Dos de daño a cualquier enemigo del tablero.' }, texto: 'Frágil de cerca, pero quema lo que mira.', ropa: ['#3d5bd9', '#7a3a9a', '#2f8a7a', '#c44a5a', '#2f2f3a', '#d9a441'] },
  ingeniero: { nombre: 'Ingeniero', icono: '🔧', ataque: 2, defensa: 3, cuerpo: 8, habilidad: { id: 'torreta', nombre: 'Torreta', icono: '⚙️', usos: 1, texto: 'Monta una torreta al lado que dispara sola cada turno.' }, texto: 'Si no hay compañeros, se los fabrica.', ropa: ['#b07a3a', '#3f6a8a', '#6a4a3a', '#8a3a3a', '#4a5a4a', '#d9a441'] },
  explorador: { nombre: 'Explorador', icono: '🏹', ataque: 2, defensa: 2, cuerpo: 8, habilidad: { id: 'flecha', nombre: 'Flecha', icono: '🏹', usos: 4, texto: 'Dispara a un enemigo a hasta cinco casillas, con dos dados más.' }, texto: 'Ataca de lejos y no se deja pillar.', ropa: ['#4e8a4a', '#6a5a3a', '#3a5a7a', '#7a4a5a', '#2f3a2f', '#b0803a'] }
};

// Experiencia necesaria para cada nivel (el 1 empieza en 0)
// Hasta el 8 como siempre (nadie pierde niveles); desde ahí, cada nivel cuesta bastante más que el anterior
export const NIVELES = [0, 30, 80, 150, 250, 380, 540, 740, 1000, 1350, 1820, 2460, 3320, 4480, 6050];
export const nivelDe = (xp) => { let n = 1; for (let i = 1; i < NIVELES.length; i++) if (xp >= NIVELES[i]) n = i + 1; return n; };
export const XP = { Esqueleto: 10, 'Capitán Fémur': 25 };

// Lo que sueltan los monstruos de las criptas (como en una cacería: se lleva a la forja)
export const MATERIALES = {
  hueso: { n: 'Hueso pulido', e: '🦴' }, polvo: { n: 'Polvo de tumba', e: '⚱️' }, venda: { n: 'Venda de momia', e: '🧻' },
  ectoplasma: { n: 'Ectoplasma', e: '👻' }, piedra: { n: 'Piedra rúnica', e: '🪨' }, trofeo: { n: 'Trofeo de jefe', e: '🏆' },
  esencia: { n: 'Esencia heroica', e: '✨' }   // solo la sueltan los jefes de las heroicas (más cuanto más alto el rango)
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
  // del +3 en adelante, solo Bruna; el +4 y el +5 piden esencia heroica (hay que ir a las heroicas, y el +5, a las de rango alto)
  arma: [{ oro: 60, hueso: 3 }, { oro: 150, hueso: 5, polvo: 2 }, { oro: 300, trofeo: 1, piedra: 2 }, { oro: 700, trofeo: 2, esencia: 4, piedra: 3 }, { oro: 1400, trofeo: 4, esencia: 12, piedra: 5 }],
  armadura: [{ oro: 50, hueso: 2 }, { oro: 130, venda: 2, polvo: 2 }, { oro: 260, trofeo: 1, ectoplasma: 2 }, { oro: 600, trofeo: 2, esencia: 4, ectoplasma: 3 }, { oro: 1200, trofeo: 4, esencia: 12, ectoplasma: 5 }],
  amuleto: [{ oro: 80, ectoplasma: 2 }, { oro: 200, trofeo: 1, piedra: 1 }],
  pocion: 25
};

// Lo que el héroe tiene ahora mismo, según raza, clase, nivel y lo que le ha forjado Brasa
// enCripta: la comida de Marga solo cuenta dentro de la cripta (y se gasta en ella)
export function estadisticas(h, enCripta = false) {
  const c = CLASES[h.clase], n = h.nivel || 1, co = enCripta ? h.comida?.efecto : null, mj = mejorasDe(h);
  return {
    ataque: Math.max(c.ataque, ARMAS[h.arma]?.ataque || 0) + mj.ataque + (h.forja?.arma || 0) + (co === 'ataque' ? 1 : 0),   // un arma encontrada solo cuenta si es mejor que la tuya
    defensa: c.defensa + (h.raza === 'elfo' ? 1 : 0) + mj.defensa + (h.forja?.armadura || 0) + (co === 'defensa' ? 1 : 0),
    max: c.cuerpo + (h.raza === 'enano' ? 2 : 0) + (Math.min(n, 8) - 1) + Math.floor(Math.max(0, n - 8) / 2) + mj.cuerpo + (co === 'cuerpo' ? 2 : 0),
    usos: c.habilidad.usos + (h.raza === 'humano' ? 1 : 0) + mj.usos + (co === 'habilidad' ? 1 : 0) + (h.forja?.amuleto || 0),
    pasosExtra: h.raza === 'elfo' ? 2 : 0,
    hab: { reforzada: mj.reforzada || 0, rapida: mj.rapida || 0, gorda: mj.gorda || 0, certera: mj.certera || 0, furia: mj.furia || 0, pl: Math.floor((n - 1) / 3) },   // mejoras propias de la clase; pl: la bola de fuego y la torreta crecen con el nivel
    escamas: h.raza === 'escamado',
    oroExtra: 0,
    carneTrol: h.raza === 'troll',                                           // carne de trol: +1 de cuerpo extra al ganar cada pelea
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

// ---------- La ficha del héroe (☰ → Tu héroe, o tocando su tarjeta): qué tiene y cuánto pega ----------
// «est» es el estado de ahora (vida y usos que le quedan, la comida de la cripta…); si no, los de siempre.
export function fichaHeroe(h, est = null) {
  const c = CLASES[h.clase], r = RAZAS[h.raza], base = estadisticas(h), e = { ...base, cuerpo: base.max, ...(est || {}) };
  const fila = (ico, nombre, valor, nota = '') => `<div class="fh-fila"><span class="fh-ico">${ico}</span><b>${nombre}</b><span class="fh-val">${valor}</span>${nota ? `<small>${nota}</small>` : ''}</div>`;
  const dados = (n, cara) => `${n} ${cara.repeat(Math.min(n, 6))}`;
  const mj = h.mejoras || {}, mc = (MEJORAS_CLASE[h.clase] || []).filter((m) => (e.hab?.[m.id] || 0) > 0);
  const elegidas = [mj.ataque && `⚔️ +${mj.ataque} de ataque`, mj.defensa && `🛡️ +${mj.defensa} de defensa`, mj.cuerpo && `❤️ +${mj.cuerpo * 2} de cuerpo`, mj.usos && `✨ +${mj.usos} usos`, ...mc.map((m) => `${m.texto.split(':')[0]}${(e.hab[m.id] || 0) > 1 ? ` ×${e.hab[m.id]}` : ''}`)].filter(Boolean);
  const forja = h.forja ? [h.forja.arma && `arma +${h.forja.arma}`, h.forja.armadura && `armadura +${h.forja.armadura}`, h.forja.amuleto && `amuleto +${h.forja.amuleto}`].filter(Boolean) : [];
  const loa = h.raza === 'troll' && (est?.loa || h.loa) ? LOAS[est?.loa || h.loa] : null;
  return `<style>
    .libreta-av { max-height: calc(100vh - 40px); max-height: calc(100dvh - 40px); overflow-y: auto; overscroll-behavior: contain; }
    .fh-cab { display: flex; gap: 12px; align-items: center; margin: 4px 0 12px; } .fh-cab .r { font-size: 40px; } .fh-cab small { display: block; opacity: .7; }
    .fh-fila { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 2px 8px; padding: 8px 10px; border-radius: 12px; background: #fff3d6; margin-bottom: 6px; }
    .fh-fila small { grid-column: 2 / 4; opacity: .7; font-size: 12px; line-height: 1.25; } .fh-ico { font-size: 20px; text-align: center; } .fh-val { font-weight: 800; font-size: 17px; white-space: nowrap; }
    .fh-sec { margin: 12px 0 4px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; opacity: .6; } .fh-txt { font-size: 13px; line-height: 1.35; margin: 0 0 6px; }
  </style>
  <div class="fh-cab"><span class="r">${c.icono}</span><div><b>${h.nombre || 'Tu héroe'}</b> · nivel ${h.nivel || 1}<small>${r?.nombre || ''} ${c.nombre.toLowerCase()} · ${h.xp || 0} de experiencia</small></div></div>
  ${fila('❤️', 'Cuerpo', `${e.cuerpo} / ${e.max}`, 'Lo que aguantas. A cero, caes.')}
  ${fila('⚔️', 'Ataque', dados(e.ataque, '🎲'), 'Dados que tiras al pegar: cada calavera es un golpe.')}
  ${fila('🛡️', 'Defensa', dados(e.defensa, '🎲'), 'Dados que tiras cuando te pegan: cada escudo para un golpe.')}
  ${fila('👣', 'Movimiento', `2 🎲${e.pasosExtra ? ` + ${e.pasosExtra}` : ''}`, 'Casillas que andas en tu turno.')}
  ${fila(c.habilidad.icono, c.habilidad.nombre, `${est?.usos ?? e.usos} / ${base.usos}`, c.habilidad.texto)}
  <div class="fh-sec">${r?.icono || ''} ${r?.nombre || 'Raza'}: ${r?.rasgo || ''}</div><p class="fh-txt">${r?.texto || ''}</p>
  ${loa ? `<p class="fh-txt"><b>${loa.icono} ${loa.nombre}:</b> ${loa.texto}</p>` : ''}
  ${elegidas.length ? `<div class="fh-sec">Mejoras de nivel</div><p class="fh-txt">${elegidas.join(' · ')}</p>` : ''}
  ${forja.length ? `<div class="fh-sec">De la forja</div><p class="fh-txt">${forja.join(' · ')}</p>` : ''}
  ${h.arma && ARMAS[h.arma] ? `<p class="fh-txt">Llevas: <b>${ARMAS[h.arma].nombre || h.arma}</b></p>` : ''}`;
}
