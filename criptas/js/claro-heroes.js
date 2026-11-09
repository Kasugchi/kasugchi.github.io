// =============================================================
//  EL CLARO · HÉROES DEL MODO AVENTURA: razas, clases, niveles y guardado.
//  Raza y clase van por separado (un enano mago, una elfa bárbara…).
//  La raza da el aspecto y un rasgo pequeño; la clase, la forma de pelear
//  y una habilidad pensada para ir solo, sin tres compañeros al lado.
// =============================================================
import { usuarioListo, leerAventuraNube, subirAventura } from './nube.js';
import { ARMAS } from './datos.js';

export const RAZAS = {
  humano: { nombre: 'Humano', icono: '🧑', rasgo: 'Versátil', texto: 'Un uso más de su habilidad en cada combate.', pieles: ['#f4c7a1', '#e0a77e', '#b97a52', '#7a4a2e'], pelos: ['#6b3a2a', '#2b1d16', '#d9a441', '#b8462a', '#e8e0d0'] },
  enano: { nombre: 'Enano', icono: '🧔', rasgo: 'Duro de pelar', texto: 'Dos puntos de cuerpo más. Bajito, ancho y testarudo.', pieles: ['#f0bf98', '#d99c74', '#a96e48', '#7a4a2e'], pelos: ['#b8462a', '#6b3a2a', '#2b1d16', '#d9d2c4', '#e3a13a'] },
  elfo: { nombre: 'Elfo', icono: '🧝', rasgo: 'Pies ligeros', texto: 'Dos casillas más cada vez que se mueve.', pieles: ['#f7dcc4', '#e8c1a0', '#c99a7a', '#9a7ab8'], pelos: ['#f1e3b0', '#e8e8f0', '#2b1d16', '#7a5ad9', '#3f8a6a'] },
  escamado: { nombre: 'Escamado', icono: '🐲', rasgo: 'Escamas', texto: 'El primer golpe de cada combate le hace uno menos. Gente dragón de Velmor.', pieles: ['#4fae7a', '#3f8fb0', '#c4553a', '#b08a3a'], pelos: ['#f2d48a', '#e8e0d0', '#2b1d16', '#ff9a4a', '#9ad0ff'] }
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

// Lo que el héroe tiene ahora mismo, según raza, clase y nivel
export function estadisticas(h) {
  const c = CLASES[h.clase], n = h.nivel || 1;
  return {
    ataque: Math.max(c.ataque, ARMAS[h.arma]?.ataque || 0) + (n >= 3 ? 1 : 0),   // un arma encontrada solo cuenta si es mejor que la tuya
    defensa: c.defensa + (n >= 5 ? 1 : 0),
    max: c.cuerpo + (h.raza === 'enano' ? 2 : 0) + (n - 1),
    usos: c.habilidad.usos + (h.raza === 'humano' ? 1 : 0) + (n >= 2 ? 1 : 0) + (n >= 4 ? 1 : 0),
    pasosExtra: h.raza === 'elfo' ? 2 : 0,
    escamas: h.raza === 'escamado'
  };
}
// Qué se gana en cada nivel (para contarlo al subir)
export function mejoraDeNivel(n) {
  return ['', '', '+1 cuerpo y un uso más de tu habilidad', '+1 cuerpo y un dado más de ataque', '+1 cuerpo y otro uso de habilidad', '+1 cuerpo y un dado más de defensa', '+1 cuerpo', '+1 cuerpo', '+1 cuerpo'][n] || '+1 cuerpo';
}

const nombres = { humano: ['Aldo', 'Nerea', 'Bruno', 'Lucía', 'Tomás', 'Irene'], enano: ['Gruñón Barbarroja', 'Brunilda', 'Thorvo', 'Grisa Martillo', 'Dorm', 'Bolva'], elfo: ['Lirael', 'Eldrin', 'Sylva', 'Thalion', 'Aelis', 'Fëanra'], escamado: ['Zarkh', 'Sssandra', 'Kraz', 'Ithra', 'Vorn', 'Sali'] };
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
