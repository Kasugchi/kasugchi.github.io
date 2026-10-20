// =============================================================
//  GEOMETRÍA DEL TABLERO
//  Regiones, paredes, puertas, línea de visión y caminos.
//  No sabe nada de reglas: solo responde "¿se puede pasar/ver?".
// =============================================================
import { TABLERO, ANCHO, ALTO } from './datos.js';

export const clave = (x, y) => x + ',' + y;
export const dentro = (x, y) => x >= 0 && y >= 0 && x < ANCHO && y < ALTO;
export const region = (x, y) => (dentro(x, y) ? TABLERO[y][x] : null);
export const esPasillo = (x, y) => region(x, y) === '.';
export const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const DIRS8 = [...DIRS, [1, 1], [1, -1], [-1, 1], [-1, -1]];

// Todas las casillas de una sala (cacheado).
const cacheSalas = {};
export function casillasDe(r) {
  if (cacheSalas[r]) return cacheSalas[r];
  const out = [];
  for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) if (TABLERO[y][x] === r) out.push([x, y]);
  return (cacheSalas[r] = out);
}

// Clave de un borde entre dos casillas vecinas (independiente del orden).
export function claveBorde(a, b) {
  const ka = clave(a[0], a[1]), kb = clave(b[0], b[1]);
  return ka < kb ? ka + '|' + kb : kb + '|' + ka;
}

// Muros frágiles: se pueden derribar con la Trompa de Jericó.
export function muroEntre(estado, a, b) {
  const i = estado.murosPorBorde?.[claveBorde(a, b)];
  return i === undefined ? null : estado.muros[i];
}

export function puertaEntre(estado, a, b) {
  const i = estado.puertasPorBorde[claveBorde(a, b)];
  return i === undefined ? null : estado.puertas[i];
}

// ¿Hay pared entre dos casillas ortogonales? (ignora puertas)
export function hayPared(a, b) {
  return region(a[0], a[1]) !== region(b[0], b[1]);
}

// Estado de un borde: 'libre' | 'puerta' (cerrada, se puede abrir) | 'bloqueado'
export function borde(estado, a, b) {
  if (!hayPared(a, b)) return 'libre';
  if (muroEntre(estado, a, b)?.roto) return 'libre';
  const p = puertaEntre(estado, a, b);
  if (!p) return 'bloqueado';
  if (p.secreta && !p.descubierta) return 'bloqueado';
  if (p.abierta) return 'libre';
  if (p.bloqueada) return 'bloqueado';
  return 'puerta';
}

export const esRoca = (estado, x, y) => !!estado.rocas[clave(x, y)];
export const muebleEn = (estado, x, y) => {
  const i = estado.mueblesPorCasilla[clave(x, y)];
  return i === undefined ? null : estado.muebles[i];
};

// ¿Bloquea la vista el paso de p a q (ortogonales)?
// destino: la casilla que se quiere ver. Un derrumbe tapa lo que hay detrás,
// pero el propio derrumbe sí se ve.
function vistaBloqueada(estado, p, q, destino = false) {
  if (!destino && esRoca(estado, q[0], q[1])) return true;
  return borde(estado, p, q) !== 'libre';
}

// Figura (héroe o monstruo vivo) en una casilla.
export function figuraEn(estado, x, y) {
  for (const h of Object.values(estado.heroes)) if (h.vivo && !h.fuera && h.x === x && h.y === y) return h;
  for (const m of estado.monstruos) if (m.vivo && m.x === x && m.y === y) return m;
  const c = estado.cargador;
  if (c && c.vivo && c.x === x && c.y === y) return c;
  return null;
}

// Héroes y cargador: se pueden cruzar entre ellos, pero no con monstruos.
export const esAliado = (estado, f) => !!f && (!!estado.heroes[f.id] || f.id === 'cargador');

// Línea de visión entre centros de casilla.
// conFiguras: si true, las figuras intermedias tapan la vista (para ataques a distancia).
export function lineaVision(estado, ax, ay, bx, by, conFiguras = false) {
  if (ax === bx && ay === by) return true;
  const dx = bx - ax, dy = by - ay;
  const pasos = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 6);
  let cx = ax, cy = ay;
  for (let i = 1; i <= pasos; i++) {
    const t = i / pasos;
    // Pequeño desplazamiento para no caer justo en las esquinas.
    const nx = Math.floor(ax + 0.5 + dx * t + 1e-4);
    const ny = Math.floor(ay + 0.5 + dy * t + 2e-4);
    if (nx === cx && ny === cy) continue;
    if (nx !== cx && ny !== cy) {
      // Paso diagonal: vale si alguno de los dos caminos en L está libre.
      const via1 = [nx, cy], via2 = [cx, ny];
      const fin = nx === bx && ny === by;
      const ok1 = !vistaBloqueada(estado, [cx, cy], via1) && !vistaBloqueada(estado, via1, [nx, ny], fin);
      const ok2 = !vistaBloqueada(estado, [cx, cy], via2) && !vistaBloqueada(estado, via2, [nx, ny], fin);
      if (!ok1 && !ok2) return false;
    } else if (vistaBloqueada(estado, [cx, cy], [nx, ny], nx === bx && ny === by)) return false;
    cx = nx; cy = ny;
    if (conFiguras && !(cx === bx && cy === by) && figuraEn(estado, cx, cy)) return false;
  }
  return true;
}

// Búsqueda en anchura. Devuelve un mapa clave -> {d, prev}.
// puedeEntrar(desde, hasta, borde) decide si se cruza cada paso.
export function explorar(origen, maxPasos, puedeEntrar, puedeSeguir = () => true) {
  const res = { [clave(origen[0], origen[1])]: { d: 0, prev: null, x: origen[0], y: origen[1] } };
  let frente = [origen];
  for (let d = 1; d <= maxPasos && frente.length; d++) {
    const sig = [];
    for (const c of frente) {
      if (d > 1 && !puedeSeguir(c)) continue;
      for (const [ox, oy] of DIRS) {
        const n = [c[0] + ox, c[1] + oy];
        if (!dentro(n[0], n[1])) continue;
        const k = clave(n[0], n[1]);
        if (res[k]) continue;
        if (!puedeEntrar(c, n)) continue;
        res[k] = { d, prev: clave(c[0], c[1]), x: n[0], y: n[1] };
        sig.push(n);
      }
    }
    frente = sig;
  }
  return res;
}

export function reconstruir(mapa, k) {
  const ruta = [];
  while (k) { const n = mapa[k]; ruta.unshift([n.x, n.y]); k = n.prev; }
  return ruta;
}

export const adyacentes = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
export const diagonales = (a, b) => Math.abs(a.x - b.x) === 1 && Math.abs(a.y - b.y) === 1;

// ¿Se puede atacar en diagonal? Solo si no hay paredes en medio.
export function diagonalLibre(estado, a, b) {
  const v1 = [b.x, a.y], v2 = [a.x, b.y];
  const p = [a.x, a.y], q = [b.x, b.y];
  const ok = (v) => !esRoca(estado, v[0], v[1]) && borde(estado, p, v) === 'libre' && borde(estado, v, q) === 'libre';
  return ok(v1) || ok(v2);
}

// Cuerpo a cuerpo: pegados en ortogonal y sin pared entre medias.
export function puedeTocar(estado, a, b) {
  return adyacentes(a, b) && borde(estado, [a.x, a.y], [b.x, b.y]) === 'libre';
}
