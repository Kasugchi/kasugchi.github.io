// =============================================================
//  LAS PEONZAS EN 3D: el plato de Rufo, cada peonza hecha con sus piezas, y lo que pasa en cada ronda.
//  Sin reglas aquí: peonzas.js le dice qué ha ocurrido y esto solo lo dibuja.
// =============================================================
import * as THREE from 'three';
import { toon, contorno, lienzo } from './claro-estilo.js';
import { crearUI3D } from './claro-ui3d.js';
import { crearSonido } from './claro-sonido.js';
import { PIEZAS_P } from './peonzas-reglas.js';

const $ = (s) => document.querySelector(s);
export const MOVIL = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
export const render = new THREE.WebGLRenderer({ canvas: $('#lienzo'), antialias: !MOVIL });
render.setPixelRatio(Math.min(devicePixelRatio, MOVIL ? 1.6 : 2)); render.setSize(innerWidth, innerHeight);
render.shadowMap.enabled = true; render.outputColorSpace = THREE.SRGBColorSpace;
export const escena = new THREE.Scene(); escena.background = new THREE.Color('#2a1d32'); escena.fog = new THREE.Fog('#2a1d32', 16, 38);
export const camara = new THREE.PerspectiveCamera(MOVIL ? 56 : 44, innerWidth / innerHeight, .1, 100);
addEventListener('resize', () => { camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); render.setSize(innerWidth, innerHeight); });
export const ui = crearUI3D(escena, camara);
export const sonido = crearSonido({ entorno: 'cine' });
addEventListener('pointerdown', () => sonido.arrancar?.(), { once: true });

escena.background = new THREE.Color('#150f24'); escena.fog = new THREE.Fog('#150f24', 18, 46);
escena.add(new THREE.HemisphereLight('#c8b8ff', '#2a1a40', 1.1));
const foco = new THREE.SpotLight('#fff0d8', 170, 32, .62, .5, 1.3); foco.position.set(0, 12, 3); foco.castShadow = true; foco.shadow.mapSize.set(1024, 1024); escena.add(foco, foco.target);
for (const [x, c] of [[-6, '#ff5a8a'], [6, '#4a9aff']]) { const l = new THREE.PointLight(c, 40, 16); l.position.set(x, 3, 1); escena.add(l); }

export const PLATO = 3.2;   // radio del plato
const luces = [];           // los conos de luz que barren el escenario
// ---------- el escenario: tarima con neón, estadio con su borde y sus bocas, foco y pantalla de fondo ----------
{
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), toon('#1c1430')); suelo.rotation.x = -Math.PI / 2; suelo.position.y = -2.2; suelo.receiveShadow = true; escena.add(suelo);
  const tarima = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 7.7, .8, 56), toon('#2a2040')); tarima.position.y = -.9; tarima.receiveShadow = true; contorno(tarima, .05); escena.add(tarima);
  for (const [r, c, y] of [[7.45, '#ff5a8a', -.52], [7.15, '#4a9aff', -.5]]) { const n = new THREE.Mesh(new THREE.TorusGeometry(r, .06, 6, 80).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: c })); n.position.y = y; escena.add(n); }
  const peana = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.1, 1, 8), toon('#3a2f58')); peana.position.y = -.42; peana.receiveShadow = true; contorno(peana, .05); escena.add(peana);
  // el estadio: un cuenco con el suelo pintado (sectores, aros y flechas), borde por tramos y cuatro bocas por donde se sale
  const dibujo = lienzo(512, 512, (x, w, h) => {
    const c = w / 2; x.translate(c, c);
    for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#3f74a8' : '#2f5f92'; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, c, i * Math.PI / 8, (i + 1) * Math.PI / 8); x.fill(); }
    for (const [r, col, g] of [[.97, '#ffe08a', 12], [.74, '#ff5a8a', 7], [.48, '#4a9aff', 7], [.22, '#ffe08a', 9]]) { x.strokeStyle = col; x.lineWidth = g; x.beginPath(); x.arc(0, 0, c * r, 0, Math.PI * 2); x.stroke(); }
    x.fillStyle = '#ffe08a'; for (let i = 0; i < 8; i++) { x.save(); x.rotate(i * Math.PI / 4); x.beginPath(); x.moveTo(c * .5, -18); x.lineTo(c * .68, 0); x.lineTo(c * .5, 18); x.closePath(); x.fill(); x.restore(); }
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0, 0, 16, 0, Math.PI * 2); x.fill();
  });
  // el cuenco: un disco con anillos al que se le curva el borde hacia arriba (su textura se proyecta plana, así el dibujo sale redondo)
  const geo = new THREE.RingGeometry(.001, PLATO, 72, 30).rotateX(-Math.PI / 2), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const r = Math.hypot(pos.getX(i), pos.getZ(i)) / PLATO; pos.setY(i, -.2 + Math.pow(r, 4) * .32); }
  geo.computeVertexNormals();
  const cuenco = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ map: dibujo, side: THREE.DoubleSide })); cuenco.receiveShadow = true; escena.add(cuenco);
  for (let i = 0; i < 16; i++) {   // el borde, a tramos de dos colores
    const a = i / 16 * Math.PI * 2, t = new THREE.Mesh(new THREE.BoxGeometry(1.3, .26, .26), toon(i % 2 ? '#ff5a6a' : '#f4ecd8'));
    t.position.set(Math.cos(a) * (PLATO + .1), .22, Math.sin(a) * (PLATO + .1)); t.rotation.y = -a - Math.PI / 2; t.castShadow = true; contorno(t, .03); escena.add(t);
  }
  for (let i = 0; i < 4; i++) {   // las bocas: huecos negros en el borde, como en los estadios de verdad
    const a = Math.PI / 4 + i * Math.PI / 2, h = new THREE.Mesh(new THREE.BoxGeometry(.9, .5, .5), new THREE.MeshBasicMaterial({ color: '#0a0612' }));
    h.position.set(Math.cos(a) * (PLATO + .12), .22, Math.sin(a) * (PLATO + .12)); h.rotation.y = -a - Math.PI / 2; escena.add(h);
    const l = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .06), new THREE.MeshBasicMaterial({ color: ['#ff5a8a', '#4a9aff'][i % 2] })); l.position.set(Math.cos(a) * (PLATO + .1), .5, Math.sin(a) * (PLATO + .1)); l.rotation.y = -a - Math.PI / 2; escena.add(l);
  }
  // la pantalla de fondo: rayos, estrellas y el rótulo
  const fondo = lienzo(1024, 512, (x, w, h) => {
    const g = x.createRadialGradient(w / 2, h * .55, 20, w / 2, h * .55, w * .6); g.addColorStop(0, '#5a3a9a'); g.addColorStop(1, '#150f24'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.save(); x.translate(w / 2, h * .55); for (let i = 0; i < 24; i++) { x.rotate(Math.PI / 12); x.fillStyle = i % 2 ? 'rgba(255,200,120,.10)' : 'rgba(120,180,255,.08)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w, -50); x.lineTo(w, 50); x.fill(); } x.restore();
    x.strokeStyle = '#ffd27a'; x.lineWidth = 10; x.strokeRect(14, 14, w - 28, h - 28);
    x.fillStyle = '#ffd27a'; x.font = 'bold 118px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#ff5a8a'; x.shadowBlur = 28; x.fillText('PEONZAS', w / 2, h * .36); x.fillText('DE RUFO', w / 2, h * .64);
  });
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(13, 6.5), new THREE.MeshBasicMaterial({ map: fondo })); pantalla.position.set(0, 4.4, -10); escena.add(pantalla);
  // la cercha con sus focos: conos de luz de colores que barren el plato
  const cercha = new THREE.Mesh(new THREE.TorusGeometry(9.5, .09, 6, 60, Math.PI).rotateZ(0), toon('#6a6a80')); cercha.position.set(0, 4.2, -2); cercha.rotation.x = 0; escena.add(cercha);
  for (let i = 0; i < 6; i++) {
    const ang = Math.PI * (i + .5) / 6, px = Math.cos(ang) * 9.5, py = 4.2 + Math.sin(ang) * 9.5 * .8, col = ['#ff5a8a', '#4a9aff', '#ffd27a'][i % 3];
    const cono = new THREE.Mesh(new THREE.ConeGeometry(1.1, 9, 24, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const g = new THREE.Group(); cono.position.y = -4.5; g.add(cono); g.position.set(px, Math.min(8.5, py), -2); g.userData = { fase: i * 1.1, vel: .5 + (i % 3) * .15, x0: px }; escena.add(g); luces.push(g);
    const f = new THREE.Mesh(new THREE.CylinderGeometry(.22, .3, .4, 10), toon('#2a2a38')); f.position.copy(g.position); escena.add(f);
  }
  for (let i = 0; i < 22; i++) { const a = Math.PI * (1.04 + i / 21 * .92), b = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), new THREE.MeshBasicMaterial({ color: ['#ffd27a', '#ff8a6a', '#8ad0ff', '#a8e88a'][i % 4] })); b.position.set(Math.cos(a) * 8.8, 3.4 + Math.sin(i * 1.7) * .25, Math.sin(a) * 8.8 - 1); escena.add(b); }
  // el público, en gradas detrás
  const n = 120, pub = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.3, .55, 3, 8), toon('#ffffff'), n), m4 = new THREE.Matrix4(), cols = ['#e8b04a', '#c85a5a', '#5a8ac8', '#7ac85a', '#c87ab0', '#e8e0d0'], sitios = [];
  for (let i = 0; i < n; i++) { const a = Math.PI * (1.08 + Math.random() * .84), r = 9 + Math.floor(Math.random() * 3) * 1.4; sitios.push([Math.cos(a) * r, -1.1 + (r - 9) * .45, Math.sin(a) * r - 1, Math.random() * 6]); pub.setColorAt(i, new THREE.Color(cols[i % cols.length])); }
  escena.add(pub); escena.userData.publico = { pub, sitios, m4 };
}

// ---------- una peonza hecha como un Beyblade: punta, rueda de metal, aro de ataque y tapa con su emblema ----------
const COLOR_EFECTO_P = { fuego: '#ff8a3a', iman: '#ff6aa8', rayo: '#fff26a', escarcha: '#8ad8ff', torbellino: '#b8f0c8' };
const EMBLEMA_P = { fuego: '🔥', iman: '🧲', rayo: '⚡', escarcha: '🧊', torbellino: '🌪️' };
function aroMalla(P) {
  const g = new THREE.Group(), c = P.color, f = P.forma, claro = new THREE.Color(c).lerp(new THREE.Color('#ffffff'), .5).getStyle();
  if (f === 'chapa') { g.add(new THREE.Mesh(new THREE.CylinderGeometry(.66, .66, .1, 28), toon(c))); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, d = new THREE.Mesh(new THREE.BoxGeometry(.11, .16, .1), toon(claro)); d.position.set(Math.cos(a) * .68, 0, Math.sin(a) * .68); d.rotation.y = -a; g.add(d); } }
  else if (f === 'sierra') { g.add(new THREE.Mesh(new THREE.CylinderGeometry(.52, .52, .09, 24), toon(c))); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, d = new THREE.Mesh(new THREE.ConeGeometry(.15, .38, 4), toon('#eef0f8')); d.position.set(Math.cos(a) * .66, 0, Math.sin(a) * .66); d.rotation.order = 'YZX'; d.rotation.set(0, -a, -Math.PI / 2); g.add(d); } }
  else if (f === 'tuerca') { g.add(new THREE.Mesh(new THREE.CylinderGeometry(.68, .68, .2, 6), toon(c))); g.add(new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .24, 6), toon('#2a2a3a'))); }
  else if (f === 'aspas') { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(.62, .05, .3), toon(c)); b.position.set(Math.cos(a) * .42, 0, Math.sin(a) * .42); b.rotation.y = -a; b.rotation.z = .3; g.add(b); } g.add(new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .1, 14), toon('#3a3a4a'))); }
  else if (f === 'cuchara') { for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, s = new THREE.Mesh(new THREE.SphereGeometry(.38, 12, 8), toon(c)); s.scale.set(1.25, .3, .75); s.position.set(Math.cos(a) * .44, 0, Math.sin(a) * .44); s.rotation.y = -a; g.add(s); } g.add(new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .1, 14), toon('#8a8a9a'))); }
  else { const t = new THREE.Mesh(new THREE.TorusGeometry(.54, .15, 8, 28).rotateX(Math.PI / 2), toon(c)); g.add(t); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, d = new THREE.Mesh(new THREE.BoxGeometry(.2, .12, .12), toon(claro)); d.position.set(Math.cos(a) * .66, 0, Math.sin(a) * .66); d.rotation.y = -a; g.add(d); } }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function crearPeonza(equipo) {
  const grupo = new THREE.Group(), girador = new THREE.Group(), inclina = new THREE.Group();
  const aro = PIEZAS_P[equipo.aro], disco = PIEZAS_P[equipo.disco], punta = PIEZAS_P[equipo.punta], ce = COLOR_EFECTO_P[aro.efecto] || '#e8e8ff';
  // la punta y el engranaje
  const pu = new THREE.Mesh(new THREE.ConeGeometry(.12, .36, 12), toon(punta.color)); pu.rotation.x = Math.PI; pu.position.y = .18; contorno(pu, .03); girador.add(pu);
  const eng = new THREE.Mesh(new THREE.CylinderGeometry(.3, .24, .12, 8), toon('#3a3a4a')); eng.position.y = .4; girador.add(eng);
  // la rueda de metal (el disco): pesada, con dientes y un aro de otro color
  const di = new THREE.Mesh(new THREE.CylinderGeometry(.56, .46, .2, 32), toon(disco.color)); di.position.y = .54; di.castShadow = true; contorno(di, .035); girador.add(di);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, d = new THREE.Mesh(new THREE.BoxGeometry(.16, .14, .14), toon('#2a2a3a')); d.position.set(Math.cos(a) * .56, .54, Math.sin(a) * .56); d.rotation.y = -a; girador.add(d); }
  const rin = new THREE.Mesh(new THREE.TorusGeometry(.38, .035, 6, 28).rotateX(Math.PI / 2), toon(ce)); rin.position.y = .65; girador.add(rin);
  // el aro de ataque
  const ar = aroMalla(aro); ar.position.y = .76; girador.add(ar);
  // la tapa de energía, con su emblema
  const dom = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshToonMaterial({ color: ce, transparent: true, opacity: .75, gradientMap: null })); dom.position.y = .84; girador.add(dom);
  const emb = lienzo(128, 128, (x, w, h) => { x.fillStyle = '#1a1226'; x.beginPath(); x.arc(64, 64, 62, 0, Math.PI * 2); x.fill(); x.font = '78px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(EMBLEMA_P[aro.efecto] || '⭐', 64, 70); });
  const cara = new THREE.Mesh(new THREE.CircleGeometry(.27, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: emb })); cara.position.y = 1.0; girador.add(cara);
  // el borrón de movimiento: un disco transparente que se ve más cuanto más gira
  const blur = new THREE.Mesh(new THREE.RingGeometry(.5, .9, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: ce, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); blur.position.y = .7; inclina.add(blur);
  inclina.add(girador); grupo.add(inclina); grupo.scale.setScalar(1.15);
  const marca = new THREE.Mesh(new THREE.RingGeometry(.86, 1.02, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .85, depthWrite: false })); marca.position.y = .02; grupo.add(marca);
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })); aura.position.y = .55; grupo.add(aura);
  return { grupo, girador, inclina, aura, marca, blur, vel: 14, giro: 1, vive: true, x: 0, z: 0 };
}

// ---------- el escenario: dos peonzas sobre el plato ----------
const T = [null, null];            // las dos peonzas
const COLOR_LADO = ['#ff7a8a', '#6ab0ff'];
const COLOR_EFECTO = { fuego: '#ff8a3a', iman: '#ff6aa8', rayo: '#fff26a', escarcha: '#8ad8ff', torbellino: '#b8f0c8' };
let vista = 'taller', sacudida = 0, tt = 0;
export function quitar() { for (let i = 0; i < 2; i++) if (T[i]) { escena.remove(T[i].grupo); T[i] = null; } }
// equipos: [equipoYo] para el taller, o [equipo0, equipo1] para el plato. sentidos: hacia dónde gira cada una (1 derecha, -1 izquierda)
export function poner(equipos, sentidos = [1, 1]) {
  quitar(); vista = equipos[1] ? 'duelo' : 'taller';
  equipos.forEach((eq, i) => {
    if (!eq) return; const p = crearPeonza(eq); T[i] = p; p.s = sentidos[i] || 1; escena.add(p.grupo);
    p.grupo.rotation.y = i * 1.3; p.vel = 14;
    if (vista === 'taller') { p.grupo.position.set(0, .2, 0); p.marca.visible = false; p.grupo.scale.setScalar(MOVIL ? 1.35 : 1.7); }
    else { p.grupo.position.set(i === 0 ? -2.4 : 2.4, 0, 0); p.grupo.scale.setScalar(.92); p.marca.material.color.set(COLOR_LADO[i]); }
  });
}
export const peonza = (i) => T[i];
// Cuánto le queda de giro (0 a 1): se ve en lo rápido que gira y en lo que se tambalea
export function verGiro(i, r) { const p = T[i]; if (p) p.giro = Math.max(0, Math.min(1, r)); }

const tween = (ms, fn) => new Promise((fin) => { const t0 = performance.now(); (function paso() { const u = Math.min(1, (performance.now() - t0) / ms); fn(u); if (u < 1) requestAnimationFrame(paso); else fin(); })(); });
const suave = (u) => u * u * (3 - 2 * u);
const sobre = (i, h = .8) => T[i].grupo.position.clone().add(new THREE.Vector3(0, h, 0));

// El lanzamiento: cada peonza cae sobre el plato desde su lado, girando a lo loco. Est = el estado inicial de la simulación.
export async function lanzar(Est) {
  const fin = [0, 1].map((i) => new THREE.Vector3(Est[i].x, 0, Est[i].y));
  for (const i of [0, 1]) { const p = T[i]; if (!p) continue; p.vive = true; p.giro = 1; p.vel = 40; p.inclina.rotation.set(0, 0, 0); p.inclina.position.y = 0; p.grupo.rotation.z = 0; }
  await tween(800, (u) => { for (const i of [0, 1]) { const p = T[i]; if (!p) continue; const d = suave(u); p.grupo.position.set(fin[i].x * (2 - d), 5 - 5 * d * d, fin[i].z); } });
  sonido.golpe?.(); ui.chispas(new THREE.Vector3(0, .3, 0), '#fff2a8', 24, 4); sacudida = .25;
  for (const i of [0, 1]) if (T[i]) { ui.chispas(sobre(i, .2), COLOR_LADO[i], 14, 3); T[i].vel = 14; }
  await espera(300);
}

// Reproducir un segmento de la simulación: res = { frames, ev, fx }. Va a su ritmo (30 pasos por segundo).
export function reproducir(res, rapidez = 1) {
  const [a, b] = [T[0], T[1]]; if (!a || !b) return Promise.resolve();
  for (const e of res.ev) if (e.k === 'efecto') { const p = T[e.i]; p.aura.material.color.set(COLOR_EFECTO[e.ef] || '#ffffff'); p.aura.material.opacity = .45; ui.chispas(sobre(e.i, .8), COLOR_EFECTO[e.ef], 28, 5); sonido.hechizo?.(); }
  return new Promise((fin) => {
    const t0 = performance.now(), n = res.frames.length; let hecho = -1;
    (function paso() {
      const k = Math.min(n - 1, (performance.now() - t0) / 1000 * 30 * rapidez), i0 = Math.floor(k), f0 = res.frames[i0], f1 = res.frames[Math.min(n - 1, i0 + 1)], u = k - i0;
      for (const i of [0, 1]) { const p = T[i], o = i * 3; p.grupo.position.set(f0[o] + (f1[o] - f0[o]) * u, 0, f0[o + 1] + (f1[o + 1] - f0[o + 1]) * u); p.giro = f0[o + 2] + (f1[o + 2] - f0[o + 2]) * u; }
      for (const e of res.ev) if (e.k === 'choque' && e.t > hecho && e.t <= i0) {
        const pos = new THREE.Vector3(e.x, .6, e.y), fuerte = Math.max(...e.d);
        sonido.golpe?.(); sacudida = Math.max(sacudida, Math.min(.6, .12 + fuerte / 30)); ui.chispas(pos, e.engrane ? '#ffd27a' : '#fff2a8', 14 + Math.round(fuerte), 3 + fuerte / 6);
        e.d.forEach((d, i) => d >= 3 && ui.numero(sobre(i, 1.5), '-' + d, '#ff5a4a'));
      }
      hecho = i0;
      if (i0 >= n - 1) { for (const i of [0, 1]) T[i].aura.material.opacity = 0; fin(); } else requestAnimationFrame(paso);
    })();
  });
}

// El final: la que pierde se para y se cae, o sale volando del plato
export async function terminar(ganador, motivo) {
  const p = T[1 - ganador]; if (!p) return;
  p.vive = false;
  const d0 = p.grupo.position.clone(), r = Math.hypot(d0.x, d0.z) || 1, ux = d0.x / r, uz = d0.z / r;
  if (motivo === 'fuera' || (motivo === 'a la vez' && r > 2.6)) {
    await tween(1100, (u) => { p.grupo.position.set(d0.x + ux * u * 3.2, Math.max(-2, .4 + Math.sin(u * Math.PI) * 2.4 - u * u * 2.4), d0.z + uz * u * 3.2); p.grupo.rotation.z = -u * 4; });
  } else {
    p.vel = 0; await tween(1200, (u) => { p.vel = 22 * (1 - u); p.inclina.rotation.z = u * 1.35; p.inclina.position.y = -u * .22; });
  }
  sonido.derrota?.(); const g = T[ganador]; if (g) { sonido.victoria?.(); ui.chispas(sobre(ganador, 1), '#ffe08a', 40, 5); ui.monedas(sobre(ganador, 1), 10); }
}
export function sacar(i) { const p = T[i]; if (p) escena.remove(p.grupo); T[i] = null; }

// ---------- el bucle ----------
const clock = new THREE.Clock();
function bucle() {
  const dt = Math.min(clock.getDelta(), .05); tt += dt;
  for (let i = 0; i < 2; i++) {
    const p = T[i]; if (!p) continue;
    const g = p.giro, tamb = p.vive ? (1 - g) * (1 - g) * .5 : 0;   // se tambalea cuanto menos giro le queda
    p.girador.rotation.y += p.vel * (.25 + .75 * g) * dt * (p.vive ? 1 : 0) * (p.s || 1) * -1;
    p.blur.material.opacity = p.vive ? .32 * g * Math.min(1, p.vel / 20) : 0; p.blur.rotation.y = -p.girador.rotation.y * .6;
    if (p.vive) { p.inclina.rotation.z = Math.sin(tt * 9 + i * 2) * tamb * .6; p.inclina.rotation.x = Math.cos(tt * 8 + i) * tamb * .5; }
    if (vista === 'taller' && i === 0) p.grupo.position.y = .2 + Math.sin(tt * 2) * .06;
  }
  for (const l of luces) { l.rotation.z = Math.sin(tt * l.userData.vel + l.userData.fase) * .35; l.rotation.x = Math.cos(tt * l.userData.vel * .8 + l.userData.fase) * .25; }
  const { pub, sitios, m4 } = escena.userData.publico;
  for (let i = 0; i < sitios.length; i++) { const s = sitios[i]; m4.setPosition(s[0], s[1] + Math.abs(Math.sin(tt * 3 + s[3])) * .22, s[2]); pub.setMatrixAt(i, m4); } pub.instanceMatrix.needsUpdate = true;
  // la cámara: arriba y un poco delante; en el móvil sube para que el panel de abajo no tape el plato
  const sac = sacudida * (Math.random() - .5) * .3; sacudida = Math.max(0, sacudida - dt * 1.5);
  const alto = vista === 'taller' ? 3.4 : MOVIL ? 8.6 : 6.4, atras = vista === 'taller' ? 6.0 : MOVIL ? 9.6 : 8.0, lado = vista === 'taller' && !MOVIL ? -2.4 : 0;
  camara.position.set(sac + lado, alto + sac, atras); camara.lookAt(lado, vista === 'taller' ? (MOVIL ? -1.3 : .5) : (MOVIL ? -2.4 : -.2), 0);
  sonido.actualizar?.(dt); ui.actualizar(dt, tt);
  render.render(escena, camara); requestAnimationFrame(bucle);
}
bucle();
