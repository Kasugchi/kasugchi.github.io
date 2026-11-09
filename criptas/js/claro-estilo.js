// =============================================================
//  EL CLARO · ESTILO: materiales de dibujo animado, contornos y ruido.
//  Todo el claro comparte esta paleta y este sombreado para que nada
//  parezca de otro juego (lo que delata un mundo hecho a trozos).
// =============================================================
import * as THREE from 'three';

// Paleta de atardecer: pocos colores, repetidos en todo el claro
export const P = {
  cieloAlto: '#33307a', cieloMedio: '#c8679a', horizonte: '#ffc58a', sol: '#fff1c4', niebla: '#e9a28f',
  hierba: '#69b84a', hierbaOscura: '#3f8a3c', hierbaClara: '#a9d65a', camino: '#e0b77b', tierra: '#a5734f',
  tronco: '#6e4636', copa: '#3f9e6b', copa2: '#5cbd72', copa3: '#2f7f63', roca: '#9a8fa8', roca2: '#7b7091',
  agua: '#4fb7d6', aguaHonda: '#2c6fa6', piel: '#f4c7a1', hueso: '#f1e7cf', oro: '#ffcd4a', runa: '#b78bff',
  contorno: '#2b1d2e'
};

// Tres escalones de luz: el sombreado «de dibujo» (luz, media luz, sombra)
const rampa = (() => {
  const d = new Uint8Array([90, 170, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
})();

const cache = new Map();
// Material de dibujo animado. opts: emissive, emissiveIntensity, transparent, opacity, side, flat
export function toon(color, opts = {}) {
  const { flatShading, ...resto } = opts; opts = resto;   // el material de dibujo no lo admite: las facetas salen de la geometría
  const k = color + JSON.stringify(opts);
  if (cache.has(k)) return cache.get(k);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: rampa, ...opts });
  cache.set(k, m);
  return m;
}

// Contorno «de cómic»: una copia de la malla, un poco más gorda y vuelta del revés, en color oscuro.
const matContorno = new THREE.MeshBasicMaterial({ color: P.contorno, side: THREE.BackSide });
export function contorno(malla, grosor = .035) {
  const c = new THREE.Mesh(malla.geometry, matContorno);
  c.scale.setScalar(1 + grosor / Math.max(.05, radioDe(malla.geometry)));
  c.userData.esContorno = true; c.castShadow = false; c.receiveShadow = false;
  malla.add(c);
  return malla;
}
function radioDe(g) { if (!g.boundingSphere) g.computeBoundingSphere(); return g.boundingSphere.radius; }

// Atajo: malla con material toon, sombras y contorno opcional
export function pieza(geo, color, { sombra = true, recibe = false, borde = 0, ...opts } = {}) {
  const m = new THREE.Mesh(geo, toon(color, opts));
  m.castShadow = sombra; m.receiveShadow = recibe;
  if (borde) contorno(m, borde);
  return m;
}

// Ruido suave (valor) para colinas, variaciones de color y viento. Determinista.
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
export function ruido(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x, y) => ruido(x, y) * .55 + ruido(x * 2.1, y * 2.1) * .3 + ruido(x * 4.3, y * 4.3) * .15;

// Azar con semilla, para que el claro sea siempre el mismo
export function azar(semilla = 7) { let s = semilla >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// Textura de lienzo para rótulos, caras y dados
export function lienzo(w, h, dibujar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  dibujar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
