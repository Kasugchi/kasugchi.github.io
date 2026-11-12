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

escena.add(new THREE.HemisphereLight('#ffe8d0', '#3a2a50', 1.5));
const foco = new THREE.SpotLight('#fff0d0', 140, 30, .7, .5, 1.3); foco.position.set(0, 11, 3); foco.castShadow = true; foco.shadow.mapSize.set(1024, 1024); escena.add(foco, foco.target);

export const PLATO = 3.2;   // radio del plato
// ---------- el puesto: una mesa de feria con su plato, guirnaldas y bombillas ----------
{
  const mesa = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.6, .5, 40), toon('#8a5a36')); mesa.position.y = -.55; mesa.receiveShadow = true; contorno(mesa, .05); escena.add(mesa);
  const mantel = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, .06, 40), toon('#c8453a')); mantel.position.y = -.27; mantel.receiveShadow = true; escena.add(mantel);
  const faldon = new THREE.Mesh(new THREE.CylinderGeometry(5.3, 5.3, 2.6, 40, 1, true), toon('#a8332e', { side: THREE.DoubleSide })); faldon.position.y = -1.6; escena.add(faldon);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), toon('#3a2a40')); suelo.rotation.x = -Math.PI / 2; suelo.position.y = -2.9; suelo.receiveShadow = true; escena.add(suelo);
  // el plato: un cuenco bajo (los bordes suben un poco, como en el original que no vamos a nombrar)
  const perfil = []; for (let i = 0; i <= 24; i++) { const r = (i / 24) * PLATO; perfil.push(new THREE.Vector2(r, -.2 + Math.pow(r / PLATO, 3) * .38)); }
  const cuenco = new THREE.Mesh(new THREE.LatheGeometry(perfil, 48), toon('#4a8aa8', { side: THREE.DoubleSide })); cuenco.receiveShadow = true; escena.add(cuenco);
  const borde = new THREE.Mesh(new THREE.TorusGeometry(PLATO + .05, .16, 8, 48).rotateX(Math.PI / 2), toon('#f4ecd8')); borde.position.y = .2; contorno(borde, .03); escena.add(borde);
  const circulo = new THREE.Mesh(new THREE.RingGeometry(.9, 1.0, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: .5 })); circulo.position.y = -.17; escena.add(circulo);
  // el cartel y las bombillas
  const tx = lienzo(1024, 200, (x, w, h) => { x.fillStyle = '#2a1a2a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ffd27a'; x.lineWidth = 12; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = '#ffd27a'; x.font = 'bold 92px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('PEONZAS DE RUFO', w / 2, h / 2 + 4); });
  const cartel = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.56), new THREE.MeshBasicMaterial({ map: tx })); cartel.position.set(0, 5.6, -7); escena.add(cartel);
  for (let i = 0; i < 18; i++) { const a = Math.PI * (1.05 + i / 17 * .9), b = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), new THREE.MeshBasicMaterial({ color: ['#ffd27a', '#ff8a6a', '#8ad0ff', '#a8e88a'][i % 4] })); b.position.set(Math.cos(a) * 8.5, 3.6 + Math.sin(i * 1.7) * .25, Math.sin(a) * 8.5 - 2); escena.add(b); }
  const n = 90, pub = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.3, .55, 3, 8), toon('#ffffff'), n), m4 = new THREE.Matrix4(), cols = ['#e8b04a', '#c85a5a', '#5a8ac8', '#7ac85a', '#c87ab0', '#e8e0d0'], sitios = [];
  for (let i = 0; i < n; i++) { const a = Math.PI * (1.05 + Math.random() * .9), r = 8 + Math.random() * 5; sitios.push([Math.cos(a) * r, -1.2 + (r - 8) * .3, Math.sin(a) * r - 1, Math.random() * 6]); pub.setColorAt(i, new THREE.Color(cols[i % cols.length])); }
  escena.add(pub); escena.userData.publico = { pub, sitios, m4 };
}

// ---------- una peonza hecha con sus piezas ----------
function aroMalla(P) {
  const g = new THREE.Group(), c = P.color;
  const f = P.forma;
  if (f === 'chapa') { const base = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .1, 24), toon(c)); g.add(base); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, d = new THREE.Mesh(new THREE.BoxGeometry(.1, .14, .08), toon('#f4e0c0')); d.position.set(Math.cos(a) * .64, 0, Math.sin(a) * .64); d.rotation.y = -a; g.add(d); } }
  else if (f === 'sierra') { g.add(new THREE.Mesh(new THREE.CylinderGeometry(.52, .52, .08, 20), toon(c))); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, d = new THREE.Mesh(new THREE.ConeGeometry(.12, .3, 4), toon('#e8e8f0')); d.position.set(Math.cos(a) * .62, 0, Math.sin(a) * .62); d.rotation.z = -Math.PI / 2; d.rotation.y = -a; d.lookAt(Math.cos(a) * 2, 0, Math.sin(a) * 2); d.rotateX(Math.PI / 2); g.add(d); } }
  else if (f === 'tuerca') { const t = new THREE.Mesh(new THREE.CylinderGeometry(.64, .64, .2, 6), toon(c)); g.add(t); }
  else if (f === 'aspas') { for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(.7, .05, .3), toon(c)); b.position.set(Math.cos(a) * .38, 0, Math.sin(a) * .38); b.rotation.y = -a; b.rotation.z = .25; g.add(b); } g.add(new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .1, 12), toon('#4a4a5a'))); }
  else if (f === 'cuchara') { for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, s = new THREE.Mesh(new THREE.SphereGeometry(.34, 10, 8), toon(c)); s.scale.set(1.2, .35, .8); s.position.set(Math.cos(a) * .42, 0, Math.sin(a) * .42); s.rotation.y = -a; g.add(s); } g.add(new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .08, 12), toon('#9a9aa8'))); }
  else { const t = new THREE.Mesh(new THREE.TorusGeometry(.5, .14, 8, 24).rotateX(Math.PI / 2), toon(c)); g.add(t); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
export function crearPeonza(equipo) {
  const grupo = new THREE.Group(), girador = new THREE.Group(), inclina = new THREE.Group();
  const aro = PIEZAS_P[equipo.aro], disco = PIEZAS_P[equipo.disco], punta = PIEZAS_P[equipo.punta];
  const pu = new THREE.Mesh(new THREE.ConeGeometry(.16, .42, 12), toon(punta.color)); pu.rotation.x = Math.PI; pu.position.y = .21; contorno(pu, .03); girador.add(pu);
  const di = new THREE.Mesh(new THREE.CylinderGeometry(.5, .42, .2, 28), toon(disco.color)); di.position.y = .52; di.castShadow = true; contorno(di, .035); girador.add(di);
  const ar = aroMalla(aro); ar.position.y = .72; girador.add(ar);
  const tapa = new THREE.Mesh(new THREE.SphereGeometry(.26, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(disco.color)); tapa.position.y = .82; girador.add(tapa);
  inclina.add(girador); grupo.add(inclina); grupo.scale.setScalar(1.15);
  const marca = new THREE.Mesh(new THREE.RingGeometry(.78, .95, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .85, depthWrite: false })); marca.position.y = .02; grupo.add(marca);
  const aura = new THREE.Mesh(new THREE.SphereGeometry(.95, 18, 12), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })); aura.position.y = .5; grupo.add(aura);
  return { grupo, girador, inclina, aura, marca, vel: 14, giro: 1, vive: true, x: 0, z: 0 };
}

// ---------- el escenario: dos peonzas sobre el plato ----------
const T = [null, null];            // las dos peonzas
const COLOR_LADO = ['#ff7a8a', '#6ab0ff'];
const COLOR_EFECTO = { fuego: '#ff8a3a', iman: '#ff6aa8', rayo: '#fff26a', escarcha: '#8ad8ff', torbellino: '#b8f0c8' };
let vista = 'taller', sacudida = 0, tt = 0;
const distanciaDe = (borde) => .85 + Math.min(100, borde) / 100 * 1.8;
function sitio(i, borde) { const d = distanciaDe(borde); return new THREE.Vector3(i === 0 ? -d : d, 0, 0); }
export function quitar() { for (let i = 0; i < 2; i++) if (T[i]) { escena.remove(T[i].grupo); T[i] = null; } }
export function poner(equipos) {   // [equipoYo, equipoRival?]
  quitar(); vista = equipos[1] ? 'duelo' : 'taller';
  equipos.forEach((eq, i) => {
    if (!eq) return; const p = crearPeonza(eq); T[i] = p; escena.add(p.grupo);
    p.grupo.position.copy(vista === 'taller' ? new THREE.Vector3(0, .2, 0) : sitio(i, 0)); p.grupo.rotation.y = i * 1.3; p.vel = 14; if (vista === 'duelo') p.marca.material.color.set(COLOR_LADO[i]); else p.marca.visible = false;
  });
  if (vista === 'taller') { T[0].grupo.scale.setScalar(MOVIL ? 1.35 : 1.7); }
}
export const peonza = (i) => T[i];
// Cuánto gira (0 a 1) y cuánto se tambalea: se ve en la peonza cómo va de giro
export function verGiro(i, giro, max) { const p = T[i]; if (!p) return; p.giro = Math.max(0, giro / max); }
export function verBorde(i, borde) { const p = T[i]; if (!p || !p.vive) return; p.destino = sitio(i, borde); }

// Un «paso» de animación: una función de 0 a 1 durante ms milisegundos
const tween = (ms, fn) => new Promise((fin) => { const t0 = performance.now(); (function paso() { const u = Math.min(1, (performance.now() - t0) / ms); fn(u); if (u < 1) requestAnimationFrame(paso); else fin(); })(); });
const suave = (u) => u * u * (3 - 2 * u);
const sobre = (i, h = .8) => T[i].grupo.position.clone().add(new THREE.Vector3(0, h, 0));

// El lanzamiento: cada peonza cae sobre el plato girando a lo loco
export async function lanzar(q) {
  for (const i of [0, 1]) { const p = T[i]; if (!p) continue; p.vive = true; p.animando = true; p.destino = sitio(i, 0); p.grupo.position.set(p.destino.x * 2.2, 5, 0); p.vel = 40; }
  await tween(800, (u) => { for (const i of [0, 1]) { const p = T[i]; if (!p) continue; const d = suave(u); p.grupo.position.set(p.destino.x * (2.2 - 1.2 * d), 5 - 5 * d * d, 0); } });
  sonido.golpe?.(); ui.chispas(new THREE.Vector3(0, .3, 0), '#fff2a8', 24, 4); sacudida = .25;
  for (const i of [0, 1]) if (T[i]) ui.chispas(sobre(i, .2), COLOR_LADO[i], 14, 3);
  await espera(300); for (const i of [0, 1]) if (T[i]) { T[i].animando = false; T[i].vel = 14; }
}

// Una ronda: cada uno hace su tiro y se ve lo que pasa. r = lo que devolvió ronda() de las reglas.
export async function animarRonda(r, tiros, S, L) {
  const [a, b] = [T[0], T[1]]; if (!a || !b) return;
  a.animando = b.animando = true;
  const x0 = [a.grupo.position.clone(), b.grupo.position.clone()];
  const quien = (t) => (t === 'E' ? 'embiste' : t === 'A' ? 'aguanta' : 'gira');
  // 1) cada uno se coloca según su tiro; los que embisten salen disparados hacia el otro
  const meta = [0, 1].map((i) => { const j = 1 - i; if (tiros[i].t === 'E') { const d = sobre(j, 0).sub(sobre(i, 0)); return sobre(i, 0).add(d.multiplyScalar(.82)).setY(0); } return x0[i].clone(); });
  for (const i of [0, 1]) if (r.uso[i]) T[i].aura.material.color.set(COLOR_EFECTO[L[i].efecto] || '#ffffff');
  for (const i of [0, 1]) { if (tiros[i].t === 'A') T[i].aura.material.opacity = .35; if (tiros[i].x && r.uso[i]) T[i].aura.material.opacity = .5; }
  await tween(420, (u) => { const k = suave(u); for (const i of [0, 1]) { T[i].grupo.position.lerpVectors(x0[i], meta[i], k); if (tiros[i].t === 'G') T[i].grupo.position.x += Math.sin(u * 14) * .18; T[i].vel = tiros[i].t === 'G' ? 50 : 22; } });
  // 2) el choque
  const centro = sobre(0, .5).add(sobre(1, .5)).multiplyScalar(.5);
  const golpeado = [0, 1].filter((i) => r.d[i] > 0 || r.p[i] > 0);
  if (golpeado.length) { sonido.golpe?.(); sacudida = .35 + Math.min(.5, Math.max(...r.d) / 40); ui.chispas(centro, '#fff2a8', 22, 4.5); }
  else sonido.bloqueo?.();
  for (const i of [0, 1]) {
    if (r.d[i] > 0) ui.numero(sobre(i, 1.6), '-' + r.d[i], '#ff5a4a');
    if (r.uso[i]) { ui.chispas(sobre(i, .8), COLOR_EFECTO[L[i].efecto], 30, 5); sonido.hechizo?.(); }
  }
  // 3) el empujón: salen despedidos hacia su borde
  const fin = [0, 1].map((i) => (r.fin && r.fin.ganador !== i && r.fin.motivo === 'fuera' ? sitio(i, 100).multiplyScalar(1.5).setY(.4) : sitio(i, r.S[i].borde)));
  await tween(520, (u) => { const k = suave(u); for (const i of [0, 1]) { T[i].grupo.position.lerpVectors(meta[i], fin[i], k); T[i].grupo.rotation.y += .1; } });
  for (const i of [0, 1]) { T[i].aura.material.opacity = 0; T[i].vel = 14; T[i].destino = sitio(i, r.S[i].borde); T[i].animando = false; }
  await espera(120);
}

// El final: la que pierde se para y se cae, o sale volando del plato
export async function terminar(ganador, motivo) {
  const p = T[1 - ganador]; if (!p) return;
  p.vive = false;
  if (motivo === 'fuera' || (motivo === 'a la vez' && p.destino && p.destino.length() > 2.2)) {
    const d0 = p.grupo.position.clone(), lado = d0.x >= 0 ? 1 : -1;
    await tween(1100, (u) => { p.grupo.position.set(d0.x + lado * u * 3.2, Math.max(-2, .4 + Math.sin(u * Math.PI) * 2.4 - u * u * 2.4), d0.z + u * 1.5); p.grupo.rotation.z = -lado * u * 4; });
  } else {
    p.vel = 0; const d0 = p.grupo.position.clone();
    await tween(1200, (u) => { p.vel = 22 * (1 - u); p.inclina.rotation.z = u * 1.35 * (d0.x > 0 ? -1 : 1); p.inclina.position.y = -u * .22; p.grupo.position.x = d0.x + (d0.x > 0 ? .4 : -.4) * u; });
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
    const g = p.giro, tamb = p.vive ? (1 - g) * .35 : 0;   // se tambalea cuanto menos giro le queda
    p.girador.rotation.y += p.vel * (.25 + .75 * g) * dt * (p.vive ? 1 : 0);
    if (p.vive) { p.inclina.rotation.z = Math.sin(tt * 9 + i * 2) * tamb * .6; p.inclina.rotation.x = Math.cos(tt * 8 + i) * tamb * .5; }
    if (vista === 'duelo' && p.vive && p.destino && !p.animando) p.grupo.position.lerp(p.destino, 1 - Math.exp(-4 * dt));
    else if (vista === 'taller' && i === 0) p.grupo.position.y = .2 + Math.sin(tt * 2) * .06;
  }
  const { pub, sitios, m4 } = escena.userData.publico;
  for (let i = 0; i < sitios.length; i++) { const s = sitios[i]; m4.setPosition(s[0], s[1] + Math.abs(Math.sin(tt * 3 + s[3])) * .22, s[2]); pub.setMatrixAt(i, m4); } pub.instanceMatrix.needsUpdate = true;
  // la cámara: arriba y un poco delante; en el móvil sube para que el panel de abajo no tape el plato
  const sac = sacudida * (Math.random() - .5) * .3; sacudida = Math.max(0, sacudida - dt * 1.5);
  const alto = vista === 'taller' ? 5.2 : MOVIL ? 10.5 : 8.2, atras = vista === 'taller' ? 6.4 : MOVIL ? 11.5 : 9.6;
  camara.position.set(sac, alto + sac, atras); camara.lookAt(0, vista === 'taller' ? (MOVIL ? -1.7 : .3) : (MOVIL ? -2.6 : -.6), 0);
  sonido.actualizar?.(dt); ui.actualizar(dt, tt);
  render.render(escena, camara); requestAnimationFrame(bucle);
}
bucle();
