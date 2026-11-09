// =============================================================
//  EL CLARO DE LOS HUESOS · prototipo de «modo aventura»
//  Bajas de Morrandar con tu héroe a un claro del bosque, paseas libre,
//  hablas con la guardabosques, recoges setas de luz y, si tocas a los
//  esqueletos, el suelo se vuelve el tablero de HeroQuest por turnos.
//  Une: claro-mundo (escenario), claro-personajes, claro-ui3d,
//  claro-dados, claro-combate y claro-sonido.
// =============================================================
import * as THREE from 'three';
import { EffectComposer } from './vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/addons/postprocessing/OutputPass.js';
import { toon, pieza, P, lienzo as lienzoTx } from './claro-estilo.js';
import { mergeGeometries } from './vendor/addons/utils/BufferGeometryUtils.js';
import { crearMundo, SITIOS } from './claro-mundo.js';
import { crearMago, crearEsqueleto } from './claro-personajes.js';
import { crearUI3D } from './claro-ui3d.js';
import { crearDados } from './claro-dados.js';
import { crearCombate } from './claro-combate.js';
import { crearSonido } from './claro-sonido.js';

const $ = (s) => document.querySelector(s);
const MOVIL = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const params = new URLSearchParams(location.search);

// ---------- motor ----------
const lienzo = $('#lienzo');
const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: !MOVIL, powerPreference: 'high-performance' });
render.setPixelRatio(Math.min(devicePixelRatio, MOVIL ? 1.6 : 2));
render.setSize(innerWidth, innerHeight);
render.shadowMap.enabled = true; render.shadowMap.type = THREE.PCFSoftShadowMap;
render.outputColorSpace = THREE.SRGBColorSpace;
const escena = new THREE.Scene();
const camara = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 900);
let composer = null;
if (!MOVIL && !params.has('sinbrillo')) {
  composer = new EffectComposer(render);
  composer.addPass(new RenderPass(escena, camara));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .45, .55, .82));
  composer.addPass(new OutputPass());
}
addEventListener('resize', () => { camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); render.setSize(innerWidth, innerHeight); composer?.setSize(innerWidth, innerHeight); });

const mundo = crearMundo(escena, { movil: MOVIL });
const ui = crearUI3D(escena, camara);
const sonido = crearSonido();
const dados = crearDados(escena, { alSonar: (f) => sonido.dado(f) });

// ---------- estado del héroe ----------
const estado = { cuerpo: 8, max: 8, ataque: 2, defensa: 2, oro: 0, setas: 0, pociones: 1, bolas: 2, mision: 'nueva', caidos: 0, cofre: false };

// ---------- el héroe ----------
const heroe = crearMago({ tunica: '#3d5bd9', adorno: P.oro, cristal: '#7ff6ff' });
escena.add(heroe.grupo);
const H = { pos: heroe.grupo.position, destino: null, interaccion: null, bloqueado: true, velocidad: 0, pasoFase: 0 };

// ---------- la guardabosques ----------
const brezo = crearMago({ tunica: '#4e8a4a', adorno: '#e8c27a', sombrero: 'capucha', colorSombrero: '#3b6b3a', pelo: '#c9702e', baston: 'cayado', capa: '#7a4a2e' });
brezo.grupo.position.set(SITIOS.guarda.x, mundo.alturaEn(SITIOS.guarda.x, SITIOS.guarda.z), SITIOS.guarda.z);
brezo.mirarA(Math.atan2(SITIOS.llegada.x - SITIOS.guarda.x, SITIOS.llegada.z - SITIOS.guarda.z));
escena.add(brezo.grupo);
ui.rotulo(brezo.grupo, 'Brezo', { altura: 2.75, sub: 'Guardabosques' });
let marcaBrezo = ui.marcador(brezo.grupo, '!', 3.55);
mundo.obstaculos.push({ x: SITIOS.guarda.x, z: SITIOS.guarda.z, r: .6 });

// ---------- los esqueletos, en dos grupos ----------
const GRUPOS = [
  { nombre: 'Esqueletos del sendero', ancla: new THREE.Vector3(12, 0, -6), miembros: [{ n: 'Esqueleto' }, { n: 'Esqueleto' }] },
  { nombre: 'Guardia de la cripta', ancla: new THREE.Vector3(18.5, 0, 12.5), miembros: [{ n: 'Esqueleto' }, { n: 'Capitán Fémur', jefe: true }, { n: 'Esqueleto' }] }
];
for (const g of GRUPOS) {
  g.vivo = true;
  g.miembros.forEach((m, k) => {
    m.pj = crearEsqueleto({ escala: m.jefe ? 1.22 : 1, ojo: m.jefe ? '#c06aff' : '#ff5a2a' });
    const a = k / g.miembros.length * Math.PI * 2, x = g.ancla.x + Math.cos(a) * 1.6, z = g.ancla.z + Math.sin(a) * 1.6;
    m.pj.grupo.position.set(x, mundo.alturaEn(x, z), z); escena.add(m.pj.grupo);
    m.rotulo = ui.rotulo(m.pj.grupo, m.n, { tipo: 'enemigo', altura: m.jefe ? 2.85 : 2.4 });
    m.ronda = { objetivo: null, espera: Math.random() * 3 };
  });
}

// ---------- setas de luz, cofre, cartel en venta ----------
const interactivos = [];
function interactivo(def) { def.anillo = ui.anillo(def.color || '#ffe08a', def.r || 1.1); interactivos.push(def); return def; }
const SETAS = [[-12, -2], [-22, 9], [6, -14], [9, 9], [-8, 14], [2, 5]];
for (const [x, z] of SETAS) {
  const g = new THREE.Group(), y = mundo.alturaEn(x, z); g.position.set(x, y, z); escena.add(g);
  g.add(pieza(new THREE.CylinderGeometry(.09, .13, .55, 8).translate(0, .27, 0), '#f3ecd9', { borde: .02 }));
  const som = pieza(new THREE.SphereGeometry(.34, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), '#5ad1ff', { borde: .025, emissive: '#3ab8ff', emissiveIntensity: .9 }); som.position.y = .5; som.scale.y = .8; g.add(som);
  g.add(new THREE.Mesh(mergeGeometries([0, 1, 2, 3, 4].map((k) => new THREE.SphereGeometry(.05, 6, 5).translate(Math.cos(k * 1.3) * .22, .58 + (k % 2) * .06, Math.sin(k * 1.3) * .22))), toon('#e8fbff', { emissive: '#ffffff', emissiveIntensity: .8 })));
  const peq = g.clone(); peq.scale.setScalar(.55); peq.position.set(x + .5, y, z + .3); escena.add(peq);
  interactivo({ tipo: 'seta', nombre: 'Seta de luz', verbo: 'Recoger', obj: g, extra: peq, pos: g.position, r: 1.1, color: '#7fe0ff', fase: Math.random() * 6 });
}
// Cofre junto a la colina de la cripta
const cofre = new THREE.Group();
{
  const x = 22, z = -1.5; cofre.position.set(x, mundo.alturaEn(x, z), z); cofre.rotation.y = -1.2; escena.add(cofre);
  cofre.add(pieza(new THREE.BoxGeometry(1.1, .6, .7).translate(0, .3, 0), '#9a5a34', { borde: .03 }));
  const tapa = new THREE.Group(); tapa.position.set(0, .6, -.35); cofre.add(tapa);
  tapa.add(pieza(new THREE.CylinderGeometry(.35, .35, 1.1, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).translate(0, 0, .35), '#a8643a', { borde: .03 }));
  for (const sx of [-.42, .42]) { const b = pieza(new THREE.BoxGeometry(.1, .64, .74).translate(0, .32, 0), P.oro, { borde: 0 }); b.position.x = sx; cofre.add(b); }
  const cerr = pieza(new THREE.BoxGeometry(.18, .2, .06), P.oro); cerr.position.set(0, .55, .37); cofre.add(cerr);
  cofre.userData.tapa = tapa; mundo.obstaculos.push({ x, z, r: .8 });
  interactivo({ tipo: 'cofre', nombre: 'Cofre viejo', verbo: 'Abrir', obj: cofre, pos: cofre.position, r: 1.6 });
}
// Parcela en venta (el «algún día tendrás tu casa aquí»)
{
  const x = -24, z = 18, g = new THREE.Group(); g.position.set(x, mundo.alturaEn(x, z), z); escena.add(g);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, p = pieza(new THREE.BoxGeometry(.12, .8, .12).translate(0, .4, 0), '#c9a06a', { borde: .02 }); p.position.set(Math.cos(a) * 4, mundo.alturaEn(x + Math.cos(a) * 4, z + Math.sin(a) * 4) - g.position.y, Math.sin(a) * 4); g.add(p); }
  const cartel = pieza(new THREE.BoxGeometry(1.4, .8, .08), '#f3e2c4', { borde: .03 }); cartel.position.set(0, 1.5, 0); g.add(cartel);
  g.add(pieza(new THREE.CylinderGeometry(.06, .06, 1.4, 5).translate(0, .7, 0), '#6e4a36'));
  const tx = lienzoTx(256, 144, (c, w, h) => { c.fillStyle = '#f3e2c4'; c.fillRect(0, 0, w, h); c.fillStyle = '#c0392b'; c.font = '900 52px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('SE VENDE', w / 2, 66); c.fillStyle = '#5a3c2e'; c.font = '700 26px Nunito, sans-serif'; c.fillText('Parcela con vistas', w / 2, 110); });
  const cara = new THREE.Mesh(new THREE.PlaneGeometry(1.32, .74), new THREE.MeshBasicMaterial({ map: tx })); cara.position.set(0, 1.5, .05); g.add(cara);
  mundo.obstaculos.push({ x, z, r: .5 });
  interactivo({ tipo: 'parcela', nombre: 'Parcela en venta', verbo: 'Mirar', obj: g, pos: g.position, r: 2 });
}
interactivo({ tipo: 'brezo', nombre: 'Brezo', verbo: 'Hablar', obj: brezo.grupo, pos: brezo.grupo.position, r: 2.1 });
interactivo({ tipo: 'cartel', nombre: 'Cartel', verbo: 'Leer', obj: null, pos: SITIOS.cartel.clone().setY(mundo.alturaEn(SITIOS.cartel.x, SITIOS.cartel.z)), r: 1.7 });
interactivo({ tipo: 'hoguera', nombre: 'Hoguera', verbo: 'Descansar', obj: null, pos: SITIOS.hoguera.clone().setY(mundo.alturaEn(SITIOS.hoguera.x, SITIOS.hoguera.z)), r: 2.4, color: '#ffb36a' });
interactivo({ tipo: 'estanque', nombre: 'Estanque', verbo: 'Mirar', obj: null, pos: new THREE.Vector3(SITIOS.estanque.x + 6.4, 0, SITIOS.estanque.z).setY(mundo.alturaEn(SITIOS.estanque.x + 6.4, SITIOS.estanque.z)), r: 1.6, color: '#7fe0ff' });
interactivo({ tipo: 'cripta', nombre: 'Cripta de los Huesos', corto: 'Cripta', verbo: 'Entrar', obj: mundo.cripta, pos: SITIOS.cripta.clone().add(new THREE.Vector3(-1.8, 0, 0)).setY(mundo.alturaEn(SITIOS.cripta.x - 1.8, SITIOS.cripta.z)), r: 2.2, color: '#c9a2ff' });
interactivo({ tipo: 'pasarela', nombre: 'Pasarela de Morrandar', corto: 'Morrandar', verbo: 'Subir', obj: null, pos: SITIOS.llegada.clone().add(new THREE.Vector3(0, 0, -1.5)), r: 1.8 });
const rotCripta = ui.rotulo(mundo.cripta, 'Cripta de los Huesos', { tipo: 'cosa', altura: 5.6 });

// ---------- cámara en tercera persona ----------
const CAM = { yaw: 3.93, pitch: .38, dist: 9, objetivo: new THREE.Vector3(), temblor: 0, modo: 'intro', foco: null, mirar: null, introT: 0 };
const cam = {
  get position() { return camara.position; },
  temblar(s) { CAM.temblor = Math.max(CAM.temblor, s); },
  enfocarCombate(centro, desde) { CAM.modo = 'combate'; CAM.foco = centro.clone(); CAM.mirar = null; CAM.yawObj = Math.atan2(desde.x - centro.x, desde.z - centro.z); CAM.distObj = 14; CAM.pitchObj = .82; },
  mirarHacia(p) { CAM.mirar = p.clone(); }
};
function actualizarCamara(dt) {
  let obj;
  if (CAM.modo === 'intro') {
    // Bajada por la pasarela: la cámara acompaña de lado con Morrandar detrás
    if (CAM.introEmpezada) CAM.introT += dt; const p = Math.min(1, CAM.introT / 7);
    obj = heroe.grupo.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    const e = p * p * (3 - 2 * p), yaw = THREE.MathUtils.lerp(.8, 3.93, e), dist = THREE.MathUtils.lerp(38, 9, e), pitch = THREE.MathUtils.lerp(.05, .38, e);
    CAM.yaw = yaw; CAM.dist = dist; CAM.pitch = pitch;
  } else if (CAM.modo === 'combate') {
    obj = CAM.foco.clone().add(new THREE.Vector3(0, .6, 0)); if (CAM.mirar) obj.lerp(CAM.mirar, .35);
    if (CAM.yawObj != null) { let d = CAM.yawObj - CAM.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); CAM.yaw += d * Math.min(1, dt * 2.5); CAM.dist += (CAM.distObj - CAM.dist) * Math.min(1, dt * 2.5); CAM.pitch += (CAM.pitchObj - CAM.pitch) * Math.min(1, dt * 2.5); if (Math.abs(d) < .01) CAM.yawObj = null; }
  } else obj = heroe.grupo.position.clone().add(new THREE.Vector3(0, 1.45, 0));
  CAM.objetivo.lerp(obj, Math.min(1, dt * (CAM.modo === 'paseo' ? 8 : 4)));
  const off = new THREE.Vector3(Math.sin(CAM.yaw) * Math.cos(CAM.pitch), Math.sin(CAM.pitch), Math.cos(CAM.yaw) * Math.cos(CAM.pitch)).multiplyScalar(CAM.dist);
  const pos = CAM.objetivo.clone().add(off), suelo = mundo.alturaEn(pos.x, pos.z) + .6;
  if (pos.y < suelo) pos.y = suelo;
  camara.position.copy(pos);
  if (CAM.temblor > 0) { CAM.temblor -= dt; camara.position.add(new THREE.Vector3((Math.random() - .5), (Math.random() - .5), (Math.random() - .5)).multiplyScalar(CAM.temblor * .5)); }
  camara.lookAt(CAM.objetivo);
}

// ---------- HUD (lo poco que va pegado a la pantalla) ----------
const hud = {
  actualizar() {
    const c = $('#corazones'); c.innerHTML = '';
    for (let i = 0; i < estado.max; i++) { const s = document.createElement('i'); s.className = i < estado.cuerpo ? 'lleno' : ''; c.appendChild(s); }
    $('#oro').textContent = estado.oro; $('#pociones').textContent = estado.pociones; $('#bolas').textContent = estado.bolas;
    const m = $('#mision');
    if (estado.mision === 'nueva') m.innerHTML = '<b>El claro</b><span>Habla con Brezo, junto a la hoguera</span>';
    else if (estado.mision === 'activa') {
      const g = GRUPOS.filter((x) => !x.vivo).length;
      m.innerHTML = `<b>El claro de los huesos</b><span class="${estado.setas >= 3 ? 'hecho' : ''}">Setas de luz ${Math.min(3, estado.setas)}/3</span><span class="${g >= 2 ? 'hecho' : ''}">Esqueletos ${g}/2</span>${estado.setas >= 3 && g >= 2 ? '<span class="volver">¡Vuelve con Brezo!</span>' : ''}`;
    } else if (estado.mision === 'hecha') m.innerHTML = '<b>La cripta está abierta</b><span>Entra… si te atreves</span>';
  },
  acciones(lista, alElegir) {
    const b = $('#acciones'); b.innerHTML = ''; b.hidden = !lista.length;
    for (const a of lista) { const x = document.createElement('button'); x.disabled = !a.activo; x.innerHTML = `<span>${a.icono}</span>${MOVIL && a.corto ? a.corto : a.texto}`; x.onclick = () => { sonido.dado(.3); alElegir(a.id); }; b.appendChild(x); }
  },
  banner(texto, tipo) { const b = $('#banner'); b.textContent = texto; b.className = 'ver ' + tipo; clearTimeout(b._t); b._t = setTimeout(() => b.className = tipo, 1500); },
  narrar(texto) { const n = $('#narrar'); n.textContent = texto; n.hidden = !texto; }
};

// ---------- diálogos con voz en bips ----------
let dialogo = null;
function hablar(quien, lineas, opciones = [], { grave = .4 } = {}) {
  return new Promise((fin) => {
    const caja = $('#dialogo'); caja.hidden = false; $('#quien').textContent = quien; document.body.classList.add('hablando');
    let i = 0, escribiendo = null;
    const mostrar = () => {
      const txt = lineas[i], el = $('#texto'); el.textContent = ''; $('#opciones').innerHTML = ''; let k = 0;
      sonido.voz(txt, grave); clearInterval(escribiendo);
      escribiendo = setInterval(() => { k += 2; el.textContent = txt.slice(0, k); if (k >= txt.length) { clearInterval(escribiendo); escribiendo = null; fin2(); } }, 22);
      const fin2 = () => {
        const op = $('#opciones'); op.innerHTML = '';
        const ult = i === lineas.length - 1, lista = ult && opciones.length ? opciones : [[ult ? 'Vale' : 'Siguiente ▸', null]];
        for (const [t, f] of lista) { const b = document.createElement('button'); b.textContent = t; b.onclick = (e) => { e.stopPropagation(); if (!ult) { i++; mostrar(); } else { cerrar(); f?.(); fin(t); } }; op.appendChild(b); }
      };
      dialogo = { saltar: () => { if (escribiendo) { clearInterval(escribiendo); escribiendo = null; el.textContent = txt; fin2(); } } };
    };
    const cerrar = () => { caja.hidden = true; dialogo = null; document.body.classList.remove('hablando'); };
    mostrar();
  });
}
$('#dialogo').addEventListener('pointerdown', () => dialogo?.saltar());

// ---------- lo que pasa al interactuar ----------
// Una interacción cada vez (aunque se pulse E muchas veces seguidas)
async function interactuar(it) {
  if (H.ocupado || !interactivos.includes(it)) return;
  H.ocupado = true;
  try { await interactuarYa(it); } finally { H.ocupado = false; }
}
async function interactuarYa(it) {
  H.destino = null; H.interaccion = null;
  if (it.obj) heroe.mirarA(Math.atan2(it.pos.x - H.pos.x, it.pos.z - H.pos.z));
  const t = it.tipo;
  if (t === 'brezo') {
    brezo.mirarA(Math.atan2(H.pos.x - brezo.grupo.position.x, H.pos.z - brezo.grupo.position.z)); brezo.hacer('saludar', 1);
    if (estado.mision === 'nueva') {
      await hablar('Brezo', ['¡Anda! Un viajero bajando de Morrandar. Hacía semanas que la tortuga no paraba en este claro.', 'Yo cuido el bosque, pero desde que se abrió la cripta, los esqueletos se pasean por el sendero como si fuera suyo.', 'Si me traes tres setas de luz (brillan azules, no tiene pérdida) y espantas a los dos grupos de esqueletos, te doy la llave de runas.'], [['¡Hecho!', () => { estado.mision = 'activa'; ui.quitar(marcaBrezo); marcaBrezo = null; sonido.recoger(); hud.actualizar(); }], ['Ahora no', null]]);
    } else if (estado.mision === 'activa') {
      const g = GRUPOS.filter((x) => !x.vivo).length;
      if (estado.setas >= 3 && g >= 2) {
        await hablar('Brezo', ['¡Lo has conseguido! Las setas brillan de maravilla y los esqueletos… bueno, ahora son decoración.', 'Toma la llave de runas. La cripta te espera. Y unas monedas, que el camino es largo.'], [['¡Gracias!', null]]);
        estado.mision = 'hecha'; estado.oro += 25; ui.monedas(H.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 10); sonido.victoria(); mundo.abrirCripta(); sonido.abrir();
        ui.chispas(mundo.cripta.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 2.5, 0)), '#c9a2ff', 60, 5); hud.actualizar();
      } else await hablar('Brezo', [`Llevas ${Math.min(3, estado.setas)} de 3 setas y has espantado a ${g} de 2 grupos. ¡Ánimo!`, estado.cuerpo < estado.max ? 'Si te han zurrado, siéntate junto a la hoguera: el fuego cura más que cualquier poción.' : 'Las setas suelen esconderse cerca del agua y entre las rocas.']);
    } else await hablar('Brezo', ['La cripta ya está abierta. Dicen que dentro hay un nigromante que colecciona calaveras. Tú no le des la tuya.']);
  } else if (t === 'seta') {
    await heroe.hacer('recoger', .6);
    sonido.recoger(); ui.chispas(it.pos.clone().add(new THREE.Vector3(0, .6, 0)), '#9fe8ff', 30, 3); escena.remove(it.obj, it.extra); it.anillo.visible = false;
    interactivos.splice(interactivos.indexOf(it), 1); estado.setas++; ui.numero(H.pos.clone().add(new THREE.Vector3(0, 2.4, 0)), `Seta ${estado.setas}`, '#9fe8ff'); hud.actualizar();
  } else if (t === 'cofre') {
    if (estado.cofre) return hablar('Cofre viejo', ['Vacío. Solo queda olor a madera húmeda y una araña indignada.']);
    estado.cofre = true; sonido.abrir(); const tapa = cofre.userData.tapa; let a = 0; const abrir = setInterval(() => { a += .08; tapa.rotation.x = -Math.min(1.9, a); if (a > 1.9) clearInterval(abrir); }, 16);
    ui.monedas(cofre.position.clone().add(new THREE.Vector3(0, .9, 0)), 12); ui.chispas(cofre.position.clone().add(new THREE.Vector3(0, 1, 0)), '#ffe08a', 30, 3);
    estado.oro += 15; estado.pociones++; hud.actualizar(); await hablar('Cofre viejo', ['¡15 monedas y una poción de curación! Alguien se dejó esto con prisa.']);
  } else if (t === 'cartel') await hablar('Cartel', ['«➜ Cripta de los Huesos. ⬅ Morrandar (la tortuga grande, no tiene pérdida).»', 'Alguien ha añadido a lápiz: «Cuidado con el capitán. Muerde.»'], [], { grave: 1 });
  else if (t === 'hoguera') {
    await heroe.hacer('recoger', .8);
    if (estado.cuerpo < estado.max) { const c = estado.max - estado.cuerpo; estado.cuerpo = estado.max; ui.numero(H.pos.clone().add(new THREE.Vector3(0, 2.4, 0)), `+${c}`, '#7dffa0'); ui.chispas(H.pos.clone().add(new THREE.Vector3(0, 1, 0)), '#ffb36a', 20, 2); sonido.recoger(); hud.actualizar(); await hablar('Hoguera', ['Te sientas un rato. El calor te recompone los huesos (los tuyos, que son los buenos).']); }
    else await hablar('Hoguera', ['Crepita a gusto. Huele a pino y a castañas que no hay.']);
  } else if (t === 'estanque') { ui.chispas(new THREE.Vector3(SITIOS.estanque.x + 2, 0, SITIOS.estanque.z), '#bff2ff', 18, 3); sonido.recoger(); await hablar('Estanque', ['Un pez asoma, te mira de arriba abajo y se vuelve a meter. Juzgado por un pez.']); }
  else if (t === 'parcela') await hablar('Parcela en venta', ['«Se vende parcela con vistas al estanque. Ideal para magos con gusto. Razón: Brezo.»', '(Algún día aquí podrás construir tu casa, como en Wizard101. Por ahora solo hay hierba y buenas intenciones.)']);
  else if (t === 'cripta') {
    if (estado.mision !== 'hecha') await hablar('Cripta de los Huesos', ['La puerta está sellada con runas que zumban. Hace falta una llave… Seguro que la guardabosques sabe algo.']);
    else await hablar('Cripta de los Huesos', ['Las runas se apartan y una escalera baja a la oscuridad. Huele a tiempo y a huesos viejos.', 'Aquí empezaría la mazmorra de verdad, por turnos y sala a sala. Continuará…']);
  } else if (t === 'pasarela') {
    await hablar('Pasarela de Morrandar', ['¿Subir de vuelta al pueblo?'], [['Volver al pueblo', () => { location.href = 'pueblo.html'; }], ['Quedarme', null]]);
  }
}

// ---------- entrada: teclado, ratón, toque y joystick ----------
const teclas = new Set();
addEventListener('keydown', (e) => {
  if (e.repeat) return; teclas.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === 'e' && !dialogo && H.cerca && !combate.activo && !H.bloqueado) interactuar(H.cerca);
  if ((e.key === ' ' || e.key === 'Enter') && dialogo) { dialogo.saltar(); }
});
addEventListener('keyup', (e) => teclas.delete(e.key.toLowerCase()));
const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
const suelo = escena.getObjectByName('suelo');
function lanzar(x, y) { pt.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(pt, camara); }
function tocarEn(x, y) {
  lanzar(x, y);
  if (combate.activo) { const s = ray.intersectObject(suelo)[0]; return combate.tocar(s?.point); }
  if (H.bloqueado || dialogo) return;
  // ¿Has tocado algo con lo que se puede interactuar?
  let mejor = null, md = 1e9;
  for (const it of interactivos) {
    const objs = it.obj ? [it.obj] : []; const hit = objs.length && ray.intersectObjects(objs, true)[0];
    const p = it.pos.clone().add(new THREE.Vector3(0, .8, 0)), dRay = ray.ray.distanceToPoint(p);
    const d = hit ? hit.distance : (dRay < 1.1 ? camara.position.distanceTo(p) : 1e9);
    if (d < md) { md = d; mejor = it; }
  }
  if (mejor) { H.interaccion = mejor; H.destino = mejor.pos.clone(); return; }
  const s = ray.intersectObject(suelo)[0]; if (s) { H.destino = s.point; H.interaccion = null; ui.chispas(s.point.clone().add(new THREE.Vector3(0, .1, 0)), '#ffffff', 6, 1); }
}
// arrastrar = girar la cámara; tocar sin arrastrar = ir allí / interactuar
const punteros = new Map(); let pellizco = null, joy = null;
lienzo.addEventListener('pointerdown', (e) => {
  sonido.arrancar();
  punteros.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), movido: false });
  if (punteros.size === 2) { const [a, b] = [...punteros.values()]; pellizco = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: CAM.dist }; }
});
addEventListener('pointermove', (e) => {
  const p = punteros.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (Math.hypot(p.x - p.x0, p.y - p.y0) > 7) p.movido = true;
  if (pellizco && punteros.size === 2) { const [a, b] = [...punteros.values()]; CAM.dist = THREE.MathUtils.clamp(pellizco.dist * pellizco.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), 4, 22); return; }
  if (p.movido && CAM.modo !== 'intro') { CAM.yaw -= dx * .006; CAM.pitch = THREE.MathUtils.clamp(CAM.pitch + dy * .005, .08, 1.25); CAM.yawObj = null; }
});
addEventListener('pointerup', (e) => {
  const p = punteros.get(e.pointerId); punteros.delete(e.pointerId); if (punteros.size < 2) pellizco = null;
  if (p && !p.movido && performance.now() - p.t0 < 500 && e.target === lienzo) tocarEn(e.clientX, e.clientY);
});
lienzo.addEventListener('wheel', (e) => { CAM.dist = THREE.MathUtils.clamp(CAM.dist * (1 + Math.sign(e.deltaY) * .1), 4, 22); e.preventDefault(); }, { passive: false });
// joystick táctil
const pad = $('#joystick'), bola = $('#joystick i');
pad.addEventListener('pointerdown', (e) => { sonido.arrancar(); const r = pad.getBoundingClientRect(); joy = { id: e.pointerId, cx: r.left + r.width / 2, cy: r.top + r.height / 2, x: 0, y: 0 }; pad.setPointerCapture(e.pointerId); e.stopPropagation(); });
pad.addEventListener('pointermove', (e) => { if (!joy || e.pointerId !== joy.id) return; let x = (e.clientX - joy.cx) / 45, y = (e.clientY - joy.cy) / 45; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } joy.x = x; joy.y = y; bola.style.transform = `translate(${x * 34}px, ${y * 34}px)`; });
const soltarJoy = () => { joy = null; bola.style.transform = ''; };
pad.addEventListener('pointerup', soltarJoy); pad.addEventListener('pointercancel', soltarJoy);
$('#accion').addEventListener('click', () => { if (H.cerca && !dialogo && !combate.activo) interactuar(H.cerca); });
$('#sonido').addEventListener('click', () => { const b = $('#sonido'); b.classList.toggle('mudo'); sonido.silenciar(b.classList.contains('mudo')); });

// ---------- el combate ----------
const combate = crearCombate({ escena, mundo, ui, dados, sonido, camara: cam, hud, heroe, estado });
async function empezarCombate(g) {
  H.destino = null; H.interaccion = null; heroe.vel = 0; H.bloqueado = true;   // nada de pasear (ni de volver a pisar el círculo) hasta que acabe todo
  const grupo = g.miembros.filter((m) => !m.pj.restos).map((m) => ({ pj: m.pj, nombre: m.n, cuerpo: m.jefe ? 2 : 1, ataque: m.jefe ? 3 : 2, defensa: 2, mover: m.jefe ? 5 : 6, rotulo: m.rotulo }));
  for (const m of g.miembros) m.pj.vel = 0;
  $('#hud').classList.add('combate');
  const { resultado } = await combate.empezar(grupo);
  $('#hud').classList.remove('combate'); hud.narrar('');
  CAM.modo = 'paseo'; CAM.yawObj = null;
  if (resultado === 'victoria') {
    g.vivo = false; hud.banner('¡Victoria!', 'heroe'); sonido.victoria(); heroe.hacer('celebrar', 1.2);
    const oro = g.miembros.length * 5 + (g.miembros.some((m) => m.jefe) ? 10 : 0); estado.oro += oro; estado.bolas = 2;
    ui.monedas(H.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), 8); setTimeout(() => ui.numero(H.pos.clone().add(new THREE.Vector3(0, 3.1, 0)), `+${oro} oro`, '#ffd34a'), 500);
    if (GRUPOS.every((x) => !x.vivo) && estado.mision === 'activa' && !marcaBrezo) marcaBrezo = ui.marcador(brezo.grupo, '?', 3.55);
  } else {
    // derrota: Brezo te lleva junto a la hoguera
    hud.acciones([]);
    $('#fundido').classList.add('ver'); await new Promise((r) => setTimeout(r, 900));
    heroe.caido = false; heroe.cuerpo.rotation.x = 0;
    H.pos.set(SITIOS.hoguera.x + 2.2, 0, SITIOS.hoguera.z + 1.2); H.pos.y = mundo.alturaEn(H.pos.x, H.pos.z);
    estado.cuerpo = estado.max; estado.bolas = 2; hud.actualizar();
    for (const m of g.miembros) if (m.pj.restos == null) { const k = g.miembros.indexOf(m), a = k / g.miembros.length * Math.PI * 2; m.pj.grupo.position.set(g.ancla.x + Math.cos(a) * 1.6, 0, g.ancla.z + Math.sin(a) * 1.6); m.pj.grupo.position.y = mundo.alturaEn(m.pj.grupo.position.x, m.pj.grupo.position.z); }
    $('#fundido').classList.remove('ver');
    await hablar('Brezo', ['¡Menos mal que pasaba por allí! Te he traído a rastras hasta la hoguera.', 'Descansa y vuelve a intentarlo. Los esqueletos no se van a ir a ningún sitio. Literalmente: no tienen adónde.']);
  }
  if (estado.mision === 'activa' && estado.setas >= 3 && GRUPOS.every((x) => !x.vivo) && !marcaBrezo) marcaBrezo = ui.marcador(brezo.grupo, '?', 3.55);
  hud.actualizar(); H.bloqueado = false;
}

// ---------- bucle ----------
const reloj = new THREE.Clock();
let t = 0;
const adelante = new THREE.Vector3(), derecha = new THREE.Vector3(), mov = new THREE.Vector3();
function moverHeroe(dt) {
  if (H.bloqueado || dialogo || combate.activo) { heroe.vel += (0 - heroe.vel) * Math.min(1, dt * 10); return; }
  adelante.set(-Math.sin(CAM.yaw), 0, -Math.cos(CAM.yaw)); derecha.set(-adelante.z, 0, adelante.x);
  mov.set(0, 0, 0);
  if (teclas.has('w') || teclas.has('arrowup')) mov.add(adelante);
  if (teclas.has('s') || teclas.has('arrowdown')) mov.sub(adelante);
  if (teclas.has('d') || teclas.has('arrowright')) mov.add(derecha);
  if (teclas.has('a') || teclas.has('arrowleft')) mov.sub(derecha);
  if (joy) mov.addScaledVector(derecha, joy.x).addScaledVector(adelante, -joy.y);
  if (mov.lengthSq() > .01) { H.destino = null; H.interaccion = null; }
  else if (H.destino) {
    mov.set(H.destino.x - H.pos.x, 0, H.destino.z - H.pos.z);
    const lejos = mov.length(), llegar = H.interaccion ? H.interaccion.r * .75 : .3;
    if (lejos < llegar) { const it = H.interaccion; H.destino = null; H.interaccion = null; mov.set(0, 0, 0); if (it) interactuar(it); }
  }
  const l = Math.min(1, mov.length()), corre = teclas.has('shift');
  if (l > .05) {
    mov.normalize();
    const v = (corre ? 7.5 : 5) * l; H.pos.x += mov.x * v * dt; H.pos.z += mov.z * v * dt;
    heroe.mirarA(Math.atan2(mov.x, mov.z));
    for (const o of mundo.obstaculos) { const dx = H.pos.x - o.x, dz = H.pos.z - o.z, d = Math.hypot(dx, dz), min = o.r + .45; if (d < min && d > 0) { H.pos.x = o.x + dx / d * min; H.pos.z = o.z + dz / d * min; } }
    const r = Math.hypot(H.pos.x, H.pos.z); if (r > 50) { H.pos.x *= 50 / r; H.pos.z *= 50 / r; }
    H.pasoFase += v * dt; if (H.pasoFase > 1.4) { H.pasoFase = 0; sonido.paso(); }
  }
  heroe.vel += ((l > .05 ? (corre ? 1 : .75) * l : 0) - heroe.vel) * Math.min(1, dt * 10);
  H.pos.y += (mundo.alturaEn(H.pos.x, H.pos.z) - H.pos.y) * Math.min(1, dt * 15);
  // ¿estás pisando el círculo de algún grupo de esqueletos?
  for (const g of GRUPOS) if (g.vivo && g.miembros.some((m) => !m.pj.restos && m.pj.grupo.position.distanceTo(H.pos) < 3.6)) { empezarCombate(g); break; }
}
function rondaEsqueletos(dt) {
  if (combate.activo) return;
  for (const g of GRUPOS) {
    if (!g.vivo) continue;
    for (const m of g.miembros) {
      if (m.pj.restos) continue;
      const p = m.pj.grupo.position, r = m.ronda;
      const cerca = p.distanceTo(H.pos) < 9;
      if (cerca) { m.pj.mirarA(Math.atan2(H.pos.x - p.x, H.pos.z - p.z)); m.pj.vel = 0; continue; }
      if (!r.objetivo) { r.espera -= dt; m.pj.vel = Math.max(0, m.pj.vel - dt * 3); if (r.espera < 0) { const a = Math.random() * 6.28, d = Math.random() * 3.2; r.objetivo = new THREE.Vector3(g.ancla.x + Math.cos(a) * d, 0, g.ancla.z + Math.sin(a) * d); } continue; }
      const dx = r.objetivo.x - p.x, dz = r.objetivo.z - p.z, d = Math.hypot(dx, dz);
      if (d < .2) { r.objetivo = null; r.espera = 1.5 + Math.random() * 3; continue; }
      p.x += dx / d * 1.3 * dt; p.z += dz / d * 1.3 * dt; p.y = mundo.alturaEn(p.x, p.z); m.pj.mirarA(Math.atan2(dx, dz)); m.pj.vel = .7;
    }
  }
}
function cercanos() {
  let mejor = null, md = 1e9;
  for (const it of interactivos) { const d = Math.hypot(it.pos.x - H.pos.x, it.pos.z - H.pos.z); it.anillo.visible = false; if (d < it.r + .6 && d < md) { md = d; mejor = it; } }
  H.cerca = (!combate.activo && !H.bloqueado) ? mejor : null;
  const b = $('#accion');
  if (H.cerca && !dialogo) {
    const it = H.cerca; it.anillo.visible = true; it.anillo.position.set(it.pos.x, mundo.alturaEn(it.pos.x, it.pos.z) + .06, it.pos.z); it.anillo.scale.setScalar(1 + Math.sin(t * 4) * .06);
    b.hidden = false; b.innerHTML = `<kbd>${MOVIL ? '👆' : 'E'}</kbd><span>${it.verbo} · ${MOVIL ? (it.corto || it.nombre) : it.nombre}</span>`;
  } else b.hidden = true;
}
function animarCosas(dt) {
  for (const it of interactivos) if (it.tipo === 'seta') { it.obj.position.y = mundo.alturaEn(it.pos.x, it.pos.z) + Math.sin(t * 2 + it.fase) * .06; it.obj.rotation.y += dt * .5; }
}
function bucle() {
  const dt = Math.min(.05, reloj.getDelta()); t += dt;
  if (CAM.modo === 'intro' && !H.bloqueadoFin) {
    const p = Math.min(1, CAM.introT / 6.5);
    const desde = new THREE.Vector3(-6, 22.5, -66), hasta = SITIOS.llegada.clone().setY(.15);
    if (p < .88) { H.pos.lerpVectors(desde, hasta, p / .88); H.pos.y += Math.sin(p / .88 * Math.PI) * -1.2 + .2; }
    else { const q = (p - .88) / .12; H.pos.set(hasta.x + 1.2 * q, 0, hasta.z + 4.5 * q); H.pos.y = mundo.alturaEn(H.pos.x, H.pos.z); }   // unos pasos ya en la hierba heroe.vel = .75; heroe.mirarA(Math.atan2(hasta.x - desde.x, hasta.z - desde.z));
    if (p >= 1) { H.bloqueadoFin = true; CAM.modo = 'paseo'; H.bloqueado = false; heroe.vel = 0; $('#hud').classList.add('ver'); brezo.hacer('saludar', 1.2); hud.banner('El claro de los huesos', 'heroe'); }
  }
  moverHeroe(dt); rondaEsqueletos(dt); cercanos(); animarCosas(dt);
  mundo.actualizar(t, dt);
  heroe.animar(dt, t); brezo.animar(dt, t);
  if (!H.bloqueado && !dialogo && !combate.activo && H.pos.distanceTo(brezo.grupo.position) < 6) brezo.mirarA(Math.atan2(H.pos.x - brezo.grupo.position.x, H.pos.z - brezo.grupo.position.z));
  for (const g of GRUPOS) for (const m of g.miembros) m.pj.animar(dt, t);
  combate.actualizar(dt, t); dados.actualizar(dt); ui.actualizar(dt, t);
  actualizarCamara(dt);
  sonido.actualizar(H.pos.distanceTo(SITIOS.hoguera));
  if (composer) composer.render(); else render.render(escena, camara);
  requestAnimationFrame(bucle);
}

// ---------- inicio ----------
H.pos.set(-6, 22.5, -66);
CAM.objetivo.copy(H.pos);
hud.actualizar();
bucle();
$('#portada').classList.add('lista');
$('#empezar').addEventListener('click', () => {
  sonido.arrancar(); $('#portada').classList.add('fuera'); CAM.introT = 0; CAM.introEmpezada = true;
  setTimeout(() => $('#portada').remove(), 900);
});
if (params.has('rapido')) { $('#portada').remove(); CAM.introT = 99; CAM.introEmpezada = true; }
window.claro = { escena, estado, H, CAM, GRUPOS, combate, interactivos, empezarCombate, interactuar, hud, camara, heroe };
