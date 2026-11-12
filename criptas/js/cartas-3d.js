// =============================================================
//  CARTAS DE VELMOR EN 3D: el tablero 7×7 con sus terrenos, las figuritas, las cartas boca abajo
//  y el primer plano cuando chocan. Sin reglas: cartas.js le pasa la partida y los sucesos.
// =============================================================
import * as THREE from 'three';
import { toon, contorno, lienzo } from './claro-estilo.js';
import { crearUI3D } from './claro-ui3d.js';
import { crearSonido } from './claro-sonido.js';
import { crearMiniatura } from './miniaturas.js';
import { crearHeroe, crearVecino } from './claro-personajes.js';
import { CARTAS, TERRENOS, LADO, ataqueDe, defensaDe } from './cartas-reglas.js';

const $ = (s) => document.querySelector(s);
export const MOVIL = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
export const render = new THREE.WebGLRenderer({ canvas: $('#lienzo'), antialias: !MOVIL });
render.setPixelRatio(Math.min(devicePixelRatio, MOVIL ? 1.6 : 2)); render.setSize(innerWidth, innerHeight);
render.shadowMap.enabled = true; render.outputColorSpace = THREE.SRGBColorSpace;
export const escena = new THREE.Scene(); escena.background = new THREE.Color('#141026'); escena.fog = new THREE.Fog('#141026', 18, 42);
export const camara = new THREE.PerspectiveCamera(MOVIL ? 60 : 40, innerWidth / innerHeight, .1, 100);
export const ui = crearUI3D(escena, camara);
export const sonido = crearSonido({ entorno: 'cine' });
addEventListener('pointerdown', () => sonido.arrancar?.(), { once: true });

escena.add(new THREE.HemisphereLight('#ffe8d0', '#2a1a30', 1.25));
const sol = new THREE.DirectionalLight('#fff0d8', 1.6); sol.position.set(-4, 10, 6); sol.castShadow = true; sol.shadow.mapSize.set(1024, 1024);
Object.assign(sol.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); escena.add(sol);
for (const [x, z, c] of [[-5.5, -4, '#ffb85a'], [5.5, -4, '#ffb85a'], [-5.5, 4.5, '#ffb85a'], [5.5, 4.5, '#ffb85a']]) { const l = new THREE.PointLight(c, 10, 9); l.position.set(x, 1.6, z); escena.add(l); }

let GIRO = 1;   // -1 si juegas con las de arriba (en línea, el que acepta): el tablero se ve desde tu lado
const posX = (x) => GIRO * (x - (LADO - 1) / 2), posZ = (y) => GIRO * (y - (LADO - 1) / 2);
const deX = (wx) => Math.round(GIRO * wx + (LADO - 1) / 2), deZ = (wz) => Math.round(GIRO * wz + (LADO - 1) / 2);
export const mundo = (x, y, h = 0) => new THREE.Vector3(posX(x), h, posZ(y));

// ---------- la mesa: madera, velas y un tapete ----------
const llamas = [];
{
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(11, .6, 11), toon('#4a4458')); mesa.position.y = -.42; mesa.receiveShadow = true; contorno(mesa, .04); escena.add(mesa);
  const tapete = new THREE.Mesh(new THREE.BoxGeometry(8.1, .08, 8.1), toon('#24203a')); tapete.position.y = -.1; tapete.receiveShadow = true; escena.add(tapete);
  const ribete = new THREE.Mesh(new THREE.BoxGeometry(8.3, .06, 8.3), toon('#c8a040')); ribete.position.y = -.13; escena.add(ribete);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), toon('#1c1830')); suelo.rotation.x = -Math.PI / 2; suelo.position.y = -3; escena.add(suelo);
  for (const [x, z] of [[-5, -4.6], [5, -4.6], [-5, 4.6], [5, 4.6]]) {
    const pilar = new THREE.Mesh(new THREE.CylinderGeometry(.32, .38, 1.1, 8), toon('#6a6478')); pilar.position.set(x, -.05, z); contorno(pilar, .03); escena.add(pilar);
    const cuenco = new THREE.Mesh(new THREE.CylinderGeometry(.3, .18, .2, 10), toon('#3a3040')); cuenco.position.set(x, .55, z); escena.add(cuenco);
    const v = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, .1, 10), toon('#ffb85a')); v.position.set(x, .3, z); escena.add(v);
    const ll = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd27a' })); ll.position.set(x, .58, z); ll.scale.y = 1.6; escena.add(ll); llamas.push(ll);
  }
}
// ---------- texturas de terreno (una por tipo, a mano con canvas) ----------
const texTerreno = {};
function texturaDe(t) {
  if (texTerreno[t]) return texTerreno[t];
  const T = TERRENOS[t];
  return (texTerreno[t] = lienzo(128, 128, (x, w, h) => {
    x.fillStyle = T.col; x.fillRect(0, 0, w, h);
    const r = (i) => (Math.sin(i * 91.7 + t.length * 13.1) * 43758.5) % 1;
    if (t === 'pradera' || t === 'bosque') { x.strokeStyle = t === 'bosque' ? '#2a5a2a' : '#7aa83a'; x.lineWidth = 3; for (let i = 0; i < 26; i++) { const a = Math.abs(r(i)) * w, b = Math.abs(r(i + 50)) * h; x.beginPath(); x.moveTo(a, b); x.lineTo(a + 3, b - 9); x.stroke(); } }
    if (t === 'mar') { x.strokeStyle = '#8ac8ff'; x.lineWidth = 4; for (let i = 0; i < 4; i++) { x.beginPath(); for (let k = 0; k <= w; k += 8) x.lineTo(k, 22 + i * 30 + Math.sin(k / 10) * 5); x.stroke(); } }
    if (t === 'paramo' || t === 'derrumbe') { x.fillStyle = t === 'paramo' ? '#a87a3a' : '#4a3a2a'; for (let i = 0; i < 18; i++) { x.beginPath(); x.arc(Math.abs(r(i)) * w, Math.abs(r(i + 9)) * h, 3 + Math.abs(r(i + 3)) * 6, 0, 7); x.fill(); } }
    if (t === 'montana') { x.fillStyle = '#6a6a7a'; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(10 + i * 38, 110); x.lineTo(30 + i * 38, 50); x.lineTo(50 + i * 38, 110); x.fill(); } x.fillStyle = '#f4f4ff'; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(24 + i * 38, 66); x.lineTo(30 + i * 38, 50); x.lineTo(36 + i * 38, 66); x.fill(); } }
    if (t === 'oscuridad') { const g = x.createRadialGradient(64, 64, 4, 64, 64, 80); g.addColorStop(0, '#6a4a9a'); g.addColorStop(1, '#1a1030'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#c8a8ff'; for (let i = 0; i < 8; i++) x.fillRect(Math.abs(r(i)) * w, Math.abs(r(i + 4)) * h, 2, 2); }
    if (t === 'vinetas') { x.fillStyle = '#ff7ab8'; for (let i = 0; i < 6; i++) for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(10 + i * 22, 10 + k * 22, 4, 0, 7); x.fill(); } x.strokeStyle = '#222'; x.lineWidth = 5; x.strokeRect(4, 4, w - 8, h - 8); }
    if (t === 'normal') { x.strokeStyle = '#b8a880'; x.lineWidth = 2; x.strokeRect(6, 6, w - 12, h - 12); }
  }));
}
// ---------- el tablero ----------
const casillas = [], marcas = [], muros = [];
const geoCasilla = new THREE.BoxGeometry(.94, .14, .94);
const decorados = [];
for (let y = 0; y < LADO; y++) for (let x = 0; x < LADO; x++) {
  const lado = new THREE.MeshToonMaterial({ color: '#8a7a6a' }), arriba = new THREE.MeshToonMaterial({ color: '#ffffff' });
  const m = new THREE.Mesh(geoCasilla, [lado, lado, arriba, lado, lado, lado]);
  const dec = new THREE.Group(); dec.position.copy(mundo(x, y, .07)); escena.add(dec); decorados.push(dec); m.position.copy(mundo(x, y, 0)); m.receiveShadow = true; m.userData = { x, y, lado, arriba }; escena.add(m); casillas.push(m);
  const mk = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: .45, depthWrite: false })); mk.position.copy(mundo(x, y, .075)); mk.visible = false; escena.add(mk); marcas.push(mk);
  const muro = new THREE.Mesh(new THREE.BoxGeometry(.92, .55, .92), toon('#6a6270')); muro.position.copy(mundo(x, y, .33)); muro.visible = false; muro.castShadow = true; contorno(muro, .03); escena.add(muro); muros.push(muro);
}
let terrenoPuesto = [];
export function pintarTablero(S, animar = false) {
  for (let y = 0; y < LADO; y++) for (let x = 0; x < LADO; x++) {
    const i = y * LADO + x, t = S.tab[y][x]; if (terrenoPuesto[i] === t) continue; terrenoPuesto[i] = t;
    const m = casillas[i]; m.userData.arriba.map = texturaDe(t); m.userData.arriba.needsUpdate = true;
    m.userData.lado.color.set(TERRENOS[t].col).multiplyScalar(.55);
    m.position.y = t === 'mar' ? -.04 : 0;
    muros[i].visible = !!TERRENOS[t].muro;
    decorar(decorados[i], t, i);
    if (animar) { const m = casillas[i]; m.scale.y = 3; tween(300, (k) => { m.scale.y = 3 - 2 * k; }); }
  }
}
// Adornos de cada terreno (pocos, para que el móvil vaya fino): árboles, rocas, cactus, olas, niebla…
const azarC = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
function decorar(g, t, i) {
  for (const h of [...g.children]) g.remove(h);
  const pon = (mesh, k, h = 0) => { mesh.position.set((azarC(i, k) - .5) * .6, h, (azarC(i, k + 7) - .5) * .6); mesh.castShadow = true; g.add(mesh); return mesh; };
  if (t === 'bosque') for (let k = 0; k < 2; k++) { const a = pon(new THREE.Mesh(new THREE.ConeGeometry(.12, .34, 6), toon('#2a6a2a')), k, .2); a.scale.setScalar(.8 + azarC(i, k + 3) * .5); }
  if (t === 'pradera') for (let k = 0; k < 3; k++) pon(new THREE.Mesh(new THREE.ConeGeometry(.03, .12, 3), toon('#c8e85a')), k, .06);
  if (t === 'montana') { const r = pon(new THREE.Mesh(new THREE.ConeGeometry(.16, .3, 5), toon('#7a7a8a')), 1, .15); r.rotation.y = azarC(i, 2) * 3; }
  if (t === 'paramo') { if (azarC(i, 4) < .5) pon(new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, .22, 6), toon('#5a8a3a')), 1, .11); pon(new THREE.Mesh(new THREE.DodecahedronGeometry(.06), toon('#a87a4a')), 2, .04); }
  if (t === 'derrumbe') for (let k = 0; k < 3; k++) pon(new THREE.Mesh(new THREE.DodecahedronGeometry(.05 + azarC(i, k) * .05), toon('#5a4a3a')), k, .05);
  if (t === 'oscuridad') { const n = pon(new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 4), new THREE.MeshBasicMaterial({ color: '#c8a8ff', transparent: true, opacity: .8 })), 1, .25); n.userData.flota = azarC(i, 9) * 6; }
  if (t === 'vinetas') { const e = pon(new THREE.Mesh(new THREE.TorusGeometry(.08, .02, 4, 10), new THREE.MeshBasicMaterial({ color: '#222' })), 1, .04); e.rotation.x = Math.PI / 2; }
}
export function marcar(lista, color = '#ffe27a') { for (const { x, y } of lista) { const mk = marcas[y * LADO + x]; mk.visible = true; mk.material.color.set(color); } }
export function desmarcar() { for (const mk of marcas) mk.visible = false; }

// ---------- figuras ----------
const COLOR_LADO = ['#3a8aff', '#ff4a4a'];
let YO3 = 0;   // quién mira: lo suyo en azul y abajo
export function orientar(yo) {
  YO3 = yo; GIRO = yo === 1 ? -1 : 1;
  for (const m of casillas) m.position.copy(mundo(m.userData.x, m.userData.y, 0));
  marcas.forEach((mk, i) => mk.position.copy(mundo(i % LADO, Math.floor(i / LADO), .075)));
  muros.forEach((mu, i) => mu.position.copy(mundo(i % LADO, Math.floor(i / LADO), .33)));
  decorados.forEach((d, i) => d.position.copy(mundo(i % LADO, Math.floor(i / LADO), .07)));
  terrenoPuesto = [];   // que se vuelvan a pintar (el agua va un poco más baja)
}
const figuras = new Map();   // uid → { g, firma }
function reverso(p) {
  return lienzo(128, 176, (x, w, h) => {
    x.fillStyle = '#3a2418'; x.fillRect(0, 0, w, h); x.fillStyle = p === 0 ? '#2a4a8a' : '#8a2a2a'; x.fillRect(8, 8, w - 16, h - 16);
    x.strokeStyle = '#e8c860'; x.lineWidth = 5; x.strokeRect(14, 14, w - 28, h - 28);
    x.fillStyle = '#e8c860'; x.font = '900 74px Nunito, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', w / 2, h / 2 + 4);
  });
}
const REVERSOS = [null, null];
function cartaTumbada(p, girada) {
  REVERSOS[p] ||= reverso(p);
  const m = new THREE.Mesh(new THREE.BoxGeometry(.56, .03, .76), [toon('#3a2418'), toon('#3a2418'), new THREE.MeshToonMaterial({ map: REVERSOS[p] }), toon('#3a2418'), toon('#3a2418'), toon('#3a2418')]);
  m.position.y = .1; if (girada) m.rotation.y = Math.PI / 2; m.castShadow = true; return m;
}
const texEmoji = {};
function dibujoEmoji(e, color) {
  const k = e + color; if (texEmoji[k]) return texEmoji[k];
  return (texEmoji[k] = lienzo(256, 256, (x, w, h) => {
    x.fillStyle = color || '#fff8e6'; x.beginPath(); x.arc(w / 2, h / 2, w * .46, 0, 7); x.fill();
    x.strokeStyle = '#3a2418'; x.lineWidth = 10; x.stroke();
    x.font = '150px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, w / 2, h / 2 + 10);
  }));
}
function normalizar(obj, alto) { const b = new THREE.Box3().setFromObject(obj), h = b.max.y - b.min.y || 1; obj.scale.multiplyScalar(alto / h); const b2 = new THREE.Box3().setFromObject(obj); obj.position.y -= b2.min.y; return obj; }
function teñir(obj, color) {
  if (!color) return; const c = new THREE.Color(color);
  obj.traverse((o) => { if (o.isMesh) o.material = [].concat(o.material).map((m) => { const n = m.clone(); if (n.color && !n.emissive?.getHex?.()) n.color.lerp(c, .55); return n; }); if (o.isMesh && o.material.length === 1) o.material = o.material[0]; });
}
function figuraBicho(C) {
  const g = new THREE.Group();
  if (C.m) { const mini = crearMiniatura(THREE, C.m, {}); teñir(mini, C.c); normalizar(mini, .78); g.add(mini); }
  else {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dibujoEmoji(C.e, C.c || '#fff8e6') })); s.scale.set(.7, .7, 1); s.position.y = .5; g.add(s);
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .2, 6), toon('#3a2418')); pie.position.y = .12; g.add(pie);
  }
  return g;
}
function figuraLider(info) {
  let pj;
  if (info.heroe) { pj = crearHeroe({ raza: info.heroe.raza, clase: info.heroe.clase, colores: info.heroe.colores || {} }).grupo; }
  else pj = crearVecino(info.vecino || {}).grupo;
  const g = new THREE.Group(); normalizar(pj, .95); g.add(pj);
  const corona = new THREE.Mesh(new THREE.TorusGeometry(.42, .04, 6, 24).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd84a' })); corona.position.y = .09; g.add(corona);
  return g;
}
const texEtiqueta = {};
function etiqueta(texto, def, propia) {
  const k = texto + def + propia; if (!texEtiqueta[k]) texEtiqueta[k] = lienzo(192, 64, (x, w, h) => {
    x.fillStyle = def ? '#2a5aa8' : '#a82a2a'; x.globalAlpha = propia ? .7 : 1; x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 26); x.fill(); x.globalAlpha = 1;
    x.fillStyle = '#fff8e6'; x.font = '900 38px Nunito, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, w / 2, h / 2 + 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texEtiqueta[k], depthTest: false, transparent: true })); s.renderOrder = 8; s.scale.set(.6, .2, 1); return s;
}
let INFO_LIDERES = [{}, {}];
export function lideres(info) { INFO_LIDERES = info; }
function firmaDe(S, u, yo) { return [u.c, u.arriba, u.def, u.trampa, u.lider, u.red > 0, visibleLabel(S, u, yo)].join('|'); }
const visibleLabel = (S, u, yo) => u.lider || u.trampa ? '' : (u.arriba || u.p === yo) ? (u.def ? '🛡' + defensaDe(S, u) : '⚔' + ataqueDe(S, u)) : '';
function construir(S, u, yo) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.4, .42, .05, 24), toon(COLOR_LADO[u.p === yo ? 0 : 1])); base.position.y = .085; g.add(base);
  if (u.lider) g.add(figuraLider(INFO_LIDERES[u.p] || {}));
  else if (u.trampa) { if (u.arriba) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dibujoEmoji(CARTAS[u.c].e, '#e8d8ff') })); s.scale.set(.6, .6, 1); s.position.y = .45; g.add(s); } else { g.add(cartaTumbada(u.p === yo ? 0 : 1, false)); if (u.p === yo) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dibujoEmoji(CARTAS[u.c].e, '#e8d8ff'), transparent: true, opacity: .85 })); s.scale.set(.32, .32, 1); s.position.y = .42; g.add(s); } } }
  else if (!u.arriba) g.add(cartaTumbada(u.p === yo ? 0 : 1, u.def));
  else { const f = figuraBicho(CARTAS[u.c]); if (u.def) { f.rotation.y = Math.PI / 2; f.scale.setScalar(.85); } g.add(f); }
  if (u.p !== yo && !u.lider) g.rotation.y = Math.PI;
  const txt = visibleLabel(S, u, yo); if (txt) { const s = etiqueta(txt, u.def, !u.arriba); s.position.y = 1.05; g.add(s); g.userData.etiqueta = s; }
  if (u.red > 0) { const r = new THREE.Mesh(new THREE.TorusGeometry(.32, .03, 4, 16).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e8e8e8' })); r.position.y = .4; g.add(r); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function sincronizar(S, yo) {   // deja las figuras como está la partida (al final de cada tanda de sucesos)
  const vivos = new Set();
  for (const u of S.u) {
    vivos.add(u.id); let f = figuras.get(u.id); const firma = firmaDe(S, u, yo);
    if (!f || f.firma !== firma) {
      const g = construir(S, u, yo); const pos = f ? f.g.position.clone() : mundo(u.x, u.y, 0);
      if (f) escena.remove(f.g); g.position.copy(pos); escena.add(g); f = { g, firma }; figuras.set(u.id, f);
    }
    const dest = mundo(u.x, u.y, 0); if (f.g.position.distanceTo(dest) > .01 && !f.moviendo) f.g.position.copy(dest);
  }
  for (const [id, f] of figuras) if (!vivos.has(id)) { escena.remove(f.g); figuras.delete(id); }
}
export const figura = (uid) => figuras.get(uid)?.g;
export function ponerFigura(S, u, yo) {   // una figura nueva desde una foto de la unidad (por si luego desaparece en la misma jugada)
  const vieja = figuras.get(u.id); if (vieja) escena.remove(vieja.g);
  const g = construir(S, u, yo); g.position.copy(mundo(u.x, u.y, 0)); escena.add(g); figuras.set(u.id, { g, firma: firmaDe(S, u, yo) });
}
export function rehacer(S, uid, yo) { const u = S.u.find((v) => v.id === uid), f = figuras.get(uid); if (!u || !f) return; const pos = f.g.position.clone(), g = construir(S, u, yo); escena.remove(f.g); g.position.copy(pos); escena.add(g); f.g = g; f.firma = firmaDe(S, u, yo); }
export const casillaDe = (uid) => { const f = figuras.get(uid); return f ? { x: deX(f.g.position.x), y: deZ(f.g.position.z) } : null; };
export function limpiar() { for (const [, f] of figuras) escena.remove(f.g); figuras.clear(); terrenoPuesto = []; }

// ---------- tweens y animaciones ----------
const tweens = [];
export function tween(ms, fn) { return new Promise((ok) => tweens.push({ t0: performance.now(), ms, fn, ok })); }
const suave = (k) => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
export async function moverFigura(uid, x, y) {
  const f = figuras.get(uid); if (!f) return; f.moviendo = true;
  const a = f.g.position.clone(), b = mundo(x, y, 0);
  await tween(260, (k) => { const e = suave(k); f.g.position.lerpVectors(a, b, e); f.g.position.y = Math.sin(e * Math.PI) * .25; });
  f.moviendo = false;
}
export async function caer(uid) { const f = figuras.get(uid); if (!f) return; const y0 = 2.2; f.g.position.y = y0; await tween(320, (k) => { f.g.position.y = y0 * (1 - k * k); }); ui.chispas(f.g.position.clone().setY(.3), '#ffe27a', 14, 2.5); }
export async function hundir(uid) {
  const f = figuras.get(uid); if (!f) return; f.moviendo = true; ui.chispas(f.g.position.clone().setY(.4), '#c8c0b0', 18, 3);
  await tween(380, (k) => { f.g.position.y = -k * .9; f.g.rotation.z = k * .6; f.g.scale.setScalar(1 - k * .6); });
}
export async function sacudir(uid) { const f = figuras.get(uid); if (!f) return; const x0 = f.g.position.x; await tween(260, (k) => { f.g.position.x = x0 + Math.sin(k * 30) * .06 * (1 - k); }); f.g.position.x = x0; }

// ---------- cámara: vista de mesa y primer plano ----------
const VISTA = () => {   // que quepan las 7 columnas a lo ancho, con el marcador arriba y la mano abajo
  const asp = innerWidth / innerHeight;
  if (asp < .8) { const d = 4.6 / Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) / asp; return { pos: new THREE.Vector3(0, d * .86, d * .42), mira: new THREE.Vector3(0, 0, .75) }; }
  return { pos: new THREE.Vector3(0, 11.4, 7.6), mira: new THREE.Vector3(0, 0, 1.15) };
};
let camPos = VISTA().pos.clone(), camMira = VISTA().mira.clone();
camara.position.copy(camPos); camara.lookAt(camMira);
function encuadre() { const v = VISTA(); camPos.copy(v.pos); camMira.copy(v.mira); }
addEventListener('resize', () => { camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); render.setSize(innerWidth, innerHeight); encuadre(); });
export async function primerPlano(a, b, ms = 380) {
  const m = new THREE.Vector3().addVectors(mundo(a.x, a.y), mundo(b.x, b.y)).multiplyScalar(.5);
  const desde = camPos.clone(), mira0 = camMira.clone(), hasta = m.clone().add(new THREE.Vector3(0, 3.2, 3.4)), mira1 = m.clone().setY(.4);
  await tween(ms, (k) => { const e = suave(k); camPos.lerpVectors(desde, hasta, e); camMira.lerpVectors(mira0, mira1, e); });
}
export async function vistaMesa(ms = 380) { const v = VISTA(), desde = camPos.clone(), mira0 = camMira.clone(); await tween(ms, (k) => { const e = suave(k); camPos.lerpVectors(desde, v.pos, e); camMira.lerpVectors(mira0, v.mira, e); }); }

// ---------- tocar el tablero ----------
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
export function casillaEn(cx, cy) {
  ptr.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camara);
  const h = ray.intersectObjects(casillas, false)[0]; if (h) return h.object.userData;
  // si tocas una figura alta, cuenta su casilla
  const p = new THREE.Vector3(); ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -.4), p);
  const x = deX(p.x), y = deZ(p.z); return x >= 0 && y >= 0 && x < LADO && y < LADO ? { x, y } : null;
}

// ---------- bucle ----------
let t0 = performance.now();
function bucle(t) {
  const dt = Math.min(.05, (t - t0) / 1000); t0 = t;
  for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i], k = Math.min(1, (t - w.t0) / w.ms); w.fn(k); if (k >= 1) { tweens.splice(i, 1); w.ok(); } }
  for (const l of llamas) l.scale.y = 1.5 + Math.sin(t / 90 + l.position.x) * .25;
  if (texTerreno.mar) { texTerreno.mar.wrapS = texTerreno.mar.wrapT = THREE.RepeatWrapping; texTerreno.mar.offset.x = (t / 9000) % 1; }
  for (const d of decorados) for (const h of d.children) if (h.userData.flota !== undefined) h.position.y = .25 + Math.sin(t / 600 + h.userData.flota) * .08;
  for (const [, f] of figuras) if (f.g.userData.etiqueta) f.g.userData.etiqueta.position.y = 1.05 + Math.sin(t / 500 + f.g.position.x) * .03;
  camara.position.lerp(camPos, .2); const m = new THREE.Vector3(); camara.getWorldDirection(m);
  camara.lookAt(camMira);
  ui.actualizar?.(dt, t / 1000);
  render.render(escena, camara); requestAnimationFrame(bucle);
}
encuadre(); requestAnimationFrame(bucle);
