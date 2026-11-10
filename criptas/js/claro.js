// =============================================================
//  EL CLARO DE LOS HUESOS · prototipo de «modo aventura»
//  Bajas de Morrandar con tu héroe a un claro del bosque, paseas libre,
//  hablas con la guardabosques, recoges setas de luz y, si tocas a los
//  esqueletos, el suelo se vuelve el tablero de HeroQuest por turnos.
//  Une: claro-mundo (escenario), claro-personajes, claro-ui3d,
//  claro-dados, claro-combate y claro-sonido.
// =============================================================
import * as THREE from 'three';
import { avisarBajada } from './cripta-juntos.js';
import { crearPeleaJuntos } from './pelea-juntos.js';
import { decorarIsla } from './decor-isla.js';
import { ponerCine } from './cine.js';
import { crearMenu, appPantalla, appMenu, leerMudo, guardarMudo, AYUDA_AVENTURA as AYUDA } from './menu-aventura.js';
import { crearCalidad } from './calidad.js';
import { EffectComposer } from './vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/addons/postprocessing/OutputPass.js';
import { toon, pieza, P, lienzo as lienzoTx } from './claro-estilo.js';
import { mergeGeometries } from './vendor/addons/utils/BufferGeometryUtils.js';
import { crearMundo, SITIOS, usarMapa } from './claro-mundo.js';
import { crearMago, crearEsqueleto, crearHeroe, crearZombi, crearMomia } from './claro-personajes.js';
import { RAZAS, CLASES, NIVELES, XP, estadisticas, nivelDe, mejoraDeNivel, prepararSubida, elegirMejora, mejorasDisponibles, heroeAlAzar, leerLocal, cargarHeroe, guardarHeroe, botinDe, sumarBotin, textoBotin } from './claro-heroes.js';
import { crearHud } from './claro-hud.js';
import { crearUI3D } from './claro-ui3d.js';
import { crearDados } from './claro-dados.js';
import { crearCombate } from './claro-combate.js';
import { crearSonido } from './claro-sonido.js';
import { paradaDe, criptaHechaEn } from './paradas.js';

const $ = (s) => document.querySelector(s);
const MOVIL = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const params = new URLSearchParams(location.search);
// En qué parada de Morrandar estás (el claro, el pantano…): cambia el paisaje, la guía, los monstruos y la cripta
const PID = params.get('p') || 'claro', PAR = paradaDe(PID), TX = PAR.textos, GUIA = PAR.guia.nombre;
document.title = PAR.nombre + ' · Criptas de Velmor';
const DONDE = 'aventura-' + PID, OTROS = new Map();   // los de tu sala que están en esta misma parada
let SALA = null, PJ = null;   // la sala y pelear juntos (se montan más abajo)
const CARGADA = Date.now(), BAJADAS_VISTAS = new Set();   // las invitaciones a bajar a la cripta
let bajadaPendiente = null;

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
const CAL = crearCalidad(render, Math.min(devicePixelRatio, MOVIL ? 1.6 : 2), (r) => { composer?.setPixelRatio(r); composer?.setSize(innerWidth, innerHeight); });
addEventListener('resize', () => { camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); render.setSize(innerWidth, innerHeight); composer?.setSize(innerWidth, innerHeight); });

usarMapa(PAR.mapa);   // cada parada, su sitio para cada cosa
const MAPA = PAR.mapa || {};
const mundo = crearMundo(escena, { movil: MOVIL, tema: PAR.tema });
const DECOR = PAR.decor === 'isla' ? decorarIsla(escena, mundo) : null;   // el decorado propio de algunas paradas
const ui = crearUI3D(escena, camara);
const sonido = crearSonido({ entorno: PAR.tema?.sonido || 'bosque' });
if (PAR.tema?.cine) ponerCine();   // la parada de las películas antiguas
const dados = crearDados(escena, { alSonar: (f) => sonido.dado(f), escala: MOVIL ? 1.4 : 1 });

// ---------- estado del héroe ----------
const estado = { cuerpo: 8, max: 8, ataque: 2, defensa: 2, oro: 0, setas: 0, pociones: 1, usos: 2, mision: 'nueva', caidos: 0, cofre: false };
// El héroe guardado (raza, clase, colores, nivel, experiencia, oro…). Si no hay, uno al azar de fondo hasta que crees el tuyo.
let DEF = leerLocal(), nuevo = !DEF;
if (!DEF) DEF = heroeAlAzar();
function aplicarHeroe(def) {
  DEF = def; const s = estadisticas(def);
  Object.assign(estado, { ataque: s.ataque, defensa: s.defensa, max: s.max, cuerpo: s.max, usos: s.usos, usosMax: s.usos, pasosExtra: s.pasosExtra, escamas: s.escamas, oroExtra: s.oroExtra, carneTrol: s.carneTrol, racial: s.racial, rezos: 1, loa: def.loa || 'tigre', hab: s.hab, habilidad: CLASES[def.clase].habilidad, oro: def.oro || 0, pociones: def.pociones ?? 1 });
}
function guardarAhora() {
  DEF.oro = estado.oro; DEF.pociones = estado.pociones;
  if (typeof GRUPOS !== 'undefined') {   // la parada queda como la dejas
    const e = { mision: estado.mision, setas: estado.setas, setasCogidas: estado.setasCogidas || [], cofre: estado.cofre, grupos: GRUPOS.map((g) => g.vivo) };
    if (PID === 'claro') DEF.claro = e; else { DEF.paradas ||= {}; DEF.paradas[PID] = { ...(DEF.paradas[PID] || {}), ...e }; }
  }
  guardarHeroe(DEF);
}
aplicarHeroe(DEF);

// ---------- el héroe ----------
let heroe = crearHeroe(DEF);
escena.add(heroe.grupo);
const H = { pos: heroe.grupo.position, destino: null, interaccion: null, bloqueado: true, velocidad: 0, pasoFase: 0 };

// ---------- la guardabosques ----------
const brezo = crearMago(PAR.guia.modelo);
brezo.grupo.position.set(SITIOS.guarda.x, mundo.alturaEn(SITIOS.guarda.x, SITIOS.guarda.z), SITIOS.guarda.z);
brezo.mirarA(Math.atan2(SITIOS.llegada.x - SITIOS.guarda.x, SITIOS.llegada.z - SITIOS.guarda.z));
escena.add(brezo.grupo);
ui.rotulo(brezo.grupo, GUIA, { altura: 2.75, sub: PAR.guia.sub });
let marcaBrezo = ui.marcador(brezo.grupo, '!', 3.55);
mundo.obstaculos.push({ x: SITIOS.guarda.x, z: SITIOS.guarda.z, r: .6 });

// ---------- los esqueletos, en dos grupos ----------
const GRUPOS = [
  { nombre: PAR.enemigo.grupos[0], ancla: new THREE.Vector3(...(MAPA.grupos ? [MAPA.grupos[0][0], 0, MAPA.grupos[0][1]] : [12, 0, -6])), miembros: [{ n: PAR.enemigo.nombre }, { n: PAR.enemigo.nombre }] },
  { nombre: PAR.enemigo.grupos[1], ancla: new THREE.Vector3(...(MAPA.grupos ? [MAPA.grupos[1][0], 0, MAPA.grupos[1][1]] : [18.5, 0, 12.5])), miembros: [{ n: PAR.enemigo.nombre }, { n: PAR.enemigo.jefe, jefe: true }, { n: PAR.enemigo.nombre }] }
];
for (const g of GRUPOS) {
  g.vivo = true;
  g.miembros.forEach((m, k) => {
    const ojo = m.jefe ? '#c06aff' : (PAR.enemigo.ojo || '#ff5a2a'), esc = m.jefe ? 1.22 : 1;
    m.pj = PAR.enemigo.tipo === 'zombi' ? crearZombi({ escala: esc, ojo }) : PAR.enemigo.tipo === 'momia' ? crearMomia({ escala: esc, ojo }) : crearEsqueleto({ escala: esc, ojo, color: PAR.enemigo.color });
    const a = k / g.miembros.length * Math.PI * 2, x = g.ancla.x + Math.cos(a) * 1.6, z = g.ancla.z + Math.sin(a) * 1.6;
    m.pj.grupo.position.set(x, mundo.alturaEn(x, z), z); escena.add(m.pj.grupo);
    m.rotulo = ui.rotulo(m.pj.grupo, m.n, { tipo: 'enemigo', altura: m.jefe ? 2.85 : 2.4 });
    m.ronda = { objetivo: null, espera: Math.random() * 3 };
  });
}

// ---------- setas de luz, cofre, cartel en venta ----------
const interactivos = [];
function interactivo(def) { def.anillo = ui.anillo(def.color || '#ffe08a', def.r || 1.1); interactivos.push(def); return def; }
const SETAS = MAPA.objetos || [[-12, -2], [-22, 9], [6, -14], [9, 9], [-8, 14], [2, 5]];
SETAS.forEach(([x, z], idx) => {
  const g = new THREE.Group(), y = mundo.alturaEn(x, z); g.position.set(x, y, z); escena.add(g);
  g.add(pieza(new THREE.CylinderGeometry(.09, .13, .55, 8).translate(0, .27, 0), '#f3ecd9', { borde: .02 }));
  const som = pieza(new THREE.SphereGeometry(.34, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), PAR.objeto.sombrero, { borde: .025, emissive: PAR.objeto.brillo, emissiveIntensity: .9 }); som.position.y = .5; som.scale.y = .8; g.add(som);
  g.add(new THREE.Mesh(mergeGeometries([0, 1, 2, 3, 4].map((k) => new THREE.SphereGeometry(.05, 6, 5).translate(Math.cos(k * 1.3) * .22, .58 + (k % 2) * .06, Math.sin(k * 1.3) * .22))), toon('#e8fbff', { emissive: '#ffffff', emissiveIntensity: .8 })));
  const peq = g.clone(); peq.scale.setScalar(.55); peq.position.set(x + .5, y, z + .3); escena.add(peq);
  interactivo({ tipo: 'seta', idx, nombre: PAR.objeto.nombre, verbo: 'Recoger', obj: g, extra: peq, pos: g.position, r: 1.1, color: PAR.objeto.chispas, fase: Math.random() * 6 });
});
// Cofre junto a la colina de la cripta
const cofre = new THREE.Group();
{
  const [x, z] = MAPA.cofre || [22, -1.5]; cofre.position.set(x, mundo.alturaEn(x, z), z); cofre.rotation.y = -1.2; escena.add(cofre);
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
  const [x, z] = MAPA.parcela || [-24, 18], g = new THREE.Group(); g.position.set(x, mundo.alturaEn(x, z), z); escena.add(g);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, p = pieza(new THREE.BoxGeometry(.12, .8, .12).translate(0, .4, 0), '#c9a06a', { borde: .02 }); p.position.set(Math.cos(a) * 4, mundo.alturaEn(x + Math.cos(a) * 4, z + Math.sin(a) * 4) - g.position.y, Math.sin(a) * 4); g.add(p); }
  const cartel = pieza(new THREE.BoxGeometry(1.4, .8, .08), '#f3e2c4', { borde: .03 }); cartel.position.set(0, 1.5, 0); g.add(cartel);
  g.add(pieza(new THREE.CylinderGeometry(.06, .06, 1.4, 5).translate(0, .7, 0), '#6e4a36'));
  const tx = lienzoTx(256, 144, (c, w, h) => { c.fillStyle = '#f3e2c4'; c.fillRect(0, 0, w, h); c.fillStyle = '#c0392b'; c.font = '900 52px Nunito, sans-serif'; c.textAlign = 'center'; c.fillText('SE VENDE', w / 2, 66); c.fillStyle = '#5a3c2e'; c.font = '700 26px Nunito, sans-serif'; c.fillText('Parcela con vistas', w / 2, 110); });
  const cara = new THREE.Mesh(new THREE.PlaneGeometry(1.32, .74), new THREE.MeshBasicMaterial({ map: tx })); cara.position.set(0, 1.5, .05); g.add(cara);
  mundo.obstaculos.push({ x, z, r: .5 });
  interactivo({ tipo: 'parcela', nombre: 'Parcela en venta', verbo: 'Mirar', obj: g, pos: g.position, r: 2 });
}
interactivo({ tipo: 'brezo', nombre: GUIA, verbo: 'Hablar', obj: brezo.grupo, pos: brezo.grupo.position, r: 2.1 });
interactivo({ tipo: 'cartel', nombre: 'Cartel', verbo: 'Leer', obj: null, pos: SITIOS.cartel.clone().setY(mundo.alturaEn(SITIOS.cartel.x, SITIOS.cartel.z)), r: 1.7 });
interactivo({ tipo: 'hoguera', nombre: 'Hoguera', verbo: 'Descansar', obj: null, pos: SITIOS.hoguera.clone().setY(mundo.alturaEn(SITIOS.hoguera.x, SITIOS.hoguera.z)), r: 2.4, color: '#ffb36a' });
interactivo({ tipo: 'estanque', nombre: 'Estanque', verbo: 'Mirar', obj: null, pos: new THREE.Vector3(SITIOS.estanque.x + 6.4, 0, SITIOS.estanque.z).setY(mundo.alturaEn(SITIOS.estanque.x + 6.4, SITIOS.estanque.z)), r: 1.6, color: '#7fe0ff' });
const FRENTE = new THREE.Vector3(Math.sin(SITIOS.criptaGiro), 0, Math.cos(SITIOS.criptaGiro));   // hacia donde mira la puerta de la cripta
{ const p = SITIOS.cripta.clone().addScaledVector(FRENTE, 1.8); interactivo({ tipo: 'cripta', nombre: PAR.cripta.nombre, corto: 'Cripta', verbo: 'Entrar', obj: mundo.cripta, pos: p.setY(mundo.alturaEn(p.x, p.z)), r: 2.2, color: '#c9a2ff' }); }
interactivo({ tipo: 'pasarela', nombre: 'Pasarela de Morrandar', corto: 'Morrandar', verbo: 'Subir', obj: null, pos: SITIOS.llegada.clone().add(new THREE.Vector3(0, 0, -1.5)), r: 1.8 });
const rotCripta = ui.rotulo(mundo.cripta, PAR.cripta.nombre, { tipo: 'cosa', altura: 5.6 });

// ---------- cámara en tercera persona ----------
const CAM = { yaw: 3.93, pitch: .38, dist: 9, objetivo: new THREE.Vector3(), temblor: 0, modo: 'intro', foco: null, mirar: null, introT: 0 };
const cam = {
  get position() { return camara.position; },
  soltar() { CAM.modo = 'paseo'; CAM.yawObj = null; CAM.mirar = null; },   // al acabar una pelea ajena (pelear juntos)
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
  } else if (CAM.modo === 'creador') {
    // de cerca y un poco desplazado para que el panel no tape al héroe; gira solo, despacio
    CAM.yaw = 3.1;
    CAM.dist += ((MOVIL ? 8 : 5.6) - CAM.dist) * Math.min(1, dt * 3); CAM.pitch += (.14 - CAM.pitch) * Math.min(1, dt * 3);
    const der = new THREE.Vector3(Math.cos(CAM.yaw), 0, -Math.sin(CAM.yaw)).multiplyScalar(MOVIL ? 0 : 1.3);
    obj = heroe.grupo.position.clone().add(new THREE.Vector3(0, MOVIL ? -.15 : 1.1, 0)).add(der);   // en el móvil el panel tapa la mitad de abajo: el héroe, arriba
  } else obj = heroe.grupo.position.clone().add(new THREE.Vector3(0, 1.45, 0));
  CAM.objetivo.lerp(obj, Math.min(1, dt * (CAM.modo === 'paseo' ? 8 : 4)));
  const off = new THREE.Vector3(Math.sin(CAM.yaw) * Math.cos(CAM.pitch), Math.sin(CAM.pitch), Math.cos(CAM.yaw) * Math.cos(CAM.pitch)).multiplyScalar(CAM.dist);
  const pos = CAM.objetivo.clone().add(off), suelo = mundo.alturaEn(pos.x, pos.z) + .6;
  if (pos.y < suelo) pos.y = suelo;
  camara.position.copy(pos);
  if (CAM.temblor > 0) { CAM.temblor -= dt; camara.position.add(new THREE.Vector3((Math.random() - .5), (Math.random() - .5), (Math.random() - .5)).multiplyScalar(CAM.temblor * .5)); }
  camara.lookAt(CAM.objetivo);
}

// ---------- HUD y diálogos (compartidos con la cripta) ----------
function textoMision() {
  const hecha = criptaHechaEn(PID, DEF);
  if (estado.mision === 'nueva') return `<b>${PAR.corto}</b><span>${TX.mision}</span>`;
  if (estado.mision === 'activa') {
    const g = GRUPOS.filter((x) => !x.vivo).length;
    return `<b>${PAR.nombre}</b><span class="${estado.setas >= 3 ? 'hecho' : ''}">${PAR.objeto.corto} ${Math.min(3, estado.setas)}/3</span><span class="${g >= 2 ? 'hecho' : ''}">${PAR.enemigo.plural[0].toUpperCase() + PAR.enemigo.plural.slice(1)} ${g}/2</span>${estado.setas >= 3 && g >= 2 ? `<span class="volver">¡Vuelve con ${GUIA}!</span>` : ''}`;
  }
  return hecha ? `<b>${PAR.cripta.nombre}, vencida</b><span>Puedes volver a bajar cuando quieras</span>` : `<b>${PAR.cripta.nombre}: abierta</b><span>Entra… si te atreves</span>`;
}
const { hud, hablar, dlg } = crearHud({ estado, def: () => DEF, sonido, movil: MOVIL, mision: textoMision });

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
      await hablar(GUIA, TX.saludo, [['¡Hecho!', () => { estado.mision = 'activa'; ui.quitar(marcaBrezo); marcaBrezo = null; sonido.recoger(); hud.actualizar(); }], ['Ahora no', null]]);
    } else if (estado.mision === 'activa') {
      const g = GRUPOS.filter((x) => !x.vivo).length;
      if (estado.setas >= 3 && g >= 2) {
        await hablar(GUIA, TX.hecho, [['¡Gracias!', null]]);
        estado.mision = 'hecha'; estado.oro += 25; guardarAhora(); ui.monedas(H.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 10); sonido.victoria(); mundo.abrirCripta(); sonido.abrir();
        ui.chispas(mundo.cripta.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 2.5, 0)), '#c9a2ff', 60, 5); hud.actualizar();
      } else await hablar(GUIA, [`Llevas ${Math.min(3, estado.setas)} de 3 ${PAR.objeto.plural} y has espantado a ${g} de 2 grupos. ¡Ánimo!`, estado.cuerpo < estado.max ? 'Si te han zurrado, siéntate junto al fuego: cura más que cualquier poción.' : TX.pista]);
    } else if (criptaHechaEn(PID, DEF) && !(PID === 'claro' ? DEF.brezoContado : DEF.paradas?.[PID]?.contado)) {
      await hablar(GUIA, TX.vuelta, [[`¡Gracias, ${GUIA}!`, null]]);
      if (PID === 'claro') DEF.brezoContado = true; else { DEF.paradas ||= {}; (DEF.paradas[PID] ||= {}).contado = true; } estado.pociones++; sonido.recoger(); ui.chispas(H.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), '#8affb0', 24, 3); guardarAhora(); hud.actualizar();
    } else await hablar(GUIA, [criptaHechaEn(PID, DEF) ? TX.despues : TX.abierta]);
  } else if (t === 'seta') {
    await heroe.hacer('recoger', .6);
    sonido.recoger(); ui.chispas(it.pos.clone().add(new THREE.Vector3(0, .6, 0)), PAR.objeto.chispas, 30, 3); escena.remove(it.obj, it.extra); it.anillo.visible = false;
    interactivos.splice(interactivos.indexOf(it), 1); estado.setas++; (estado.setasCogidas ||= []).push(it.idx); guardarAhora(); ui.numero(H.pos.clone().add(new THREE.Vector3(0, 2.4, 0)), `${PAR.objeto.nombre} ${estado.setas}`, PAR.objeto.chispas); hud.actualizar();
  } else if (t === 'cofre') {
    if (estado.cofre) return hablar('Cofre viejo', ['Vacío. Solo queda olor a madera húmeda y una araña indignada.']);
    estado.cofre = true; sonido.abrir(); const tapa = cofre.userData.tapa; let a = 0; const abrir = setInterval(() => { a += .08; tapa.rotation.x = -Math.min(1.9, a); if (a > 1.9) clearInterval(abrir); }, 16);
    ui.monedas(cofre.position.clone().add(new THREE.Vector3(0, .9, 0)), 12); ui.chispas(cofre.position.clone().add(new THREE.Vector3(0, 1, 0)), '#ffe08a', 30, 3);
    estado.oro += 15; estado.pociones++; guardarAhora(); hud.actualizar(); await hablar('Cofre viejo', ['¡15 monedas y una poción de curación! Alguien se dejó esto con prisa.']);
  } else if (t === 'cartel') await hablar('Cartel', TX.cartel, [], { grave: 1 });
  else if (t === 'hoguera') {
    await heroe.hacer('recoger', .8);
    if (estado.cuerpo < estado.max) { const c = estado.max - estado.cuerpo; estado.cuerpo = estado.max; ui.numero(H.pos.clone().add(new THREE.Vector3(0, 2.4, 0)), `+${c}`, '#7dffa0'); ui.chispas(H.pos.clone().add(new THREE.Vector3(0, 1, 0)), '#ffb36a', 20, 2); sonido.recoger(); hud.actualizar(); await hablar('Hoguera', ['Te sientas un rato. El calor te recompone los huesos (los tuyos, que son los buenos).']); }
    else await hablar('Hoguera', [TX.hoguera]);
  } else if (t === 'estanque') { ui.chispas(new THREE.Vector3(SITIOS.estanque.x + 2, 0, SITIOS.estanque.z), '#bff2ff', 18, 3); sonido.recoger(); await hablar('Estanque', [TX.estanque]); }
  else if (t === 'parcela') await hablar('Parcela en venta', ['«Se vende parcela con vistas al estanque. Ideal para magos con gusto. Razón: ' + GUIA + '.»', '(Algún día aquí podrás construir tu casa, como en Wizard101. Por ahora solo hay hierba y buenas intenciones.)']);
  else if (t === 'cripta') {
    if (estado.mision !== 'hecha') await hablar(PAR.cripta.nombre, [TX.cerrada]);
    else await hablar(PAR.cripta.nombre, [criptaHechaEn(PID, DEF) ? 'La escalera sigue ahí, oscura como siempre. Abajo, todo se ha vuelto a llenar de monstruos.' : 'La entrada se abre y una escalera baja a la oscuridad. Huele a tiempo y a cosas viejas.'], [['Bajar a la cripta', () => bajarCripta(PID === 'claro' ? 'cripta.html' : `cripta.html?p=${PID}`)], ['Ahora no', null]]);
  } else if (t === 'pasarela') {
    await hablar('Pasarela de Morrandar', ['¿Subir de vuelta al pueblo?'], [['Volver al pueblo', () => { location.href = 'pueblo.html?desde=escala'; }], ['Quedarme', null]]);
  }
}

// ---------- entrada: teclado, ratón, toque y joystick ----------
const teclas = new Set();
addEventListener('keydown', (e) => {
  if (e.repeat) return; teclas.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === 'e' && !dlg.actual && H.cerca && !combate.activo && !H.bloqueado) interactuar(H.cerca);
  if ((e.key === ' ' || e.key === 'Enter') && dlg.actual) { dlg.actual.saltar(); }
});
addEventListener('keyup', (e) => teclas.delete(e.key.toLowerCase()));
const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
const suelo = escena.getObjectByName('suelo');
function lanzar(x, y) { pt.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(pt, camara); }
function tocarEn(x, y) {
  lanzar(x, y);
  if (combate.activo) { const s = ray.intersectObject(suelo)[0]; return combate.tocar(s?.point); }
  if (PJ?.dentro()) { const s = ray.intersectObject(suelo)[0]; return PJ.tocar(s?.point); }
  if (H.bloqueado || dlg.actual) return;
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
  if (p.movido && CAM.modo === 'creador') { CAM.giro = (CAM.giro || 0) + dx * .012; return; }
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
$('#accion').addEventListener('click', () => { if (H.cerca && !dlg.actual && !combate.activo) interactuar(H.cerca); });

// ---------- el combate ----------
const combate = crearCombate({ escena, mundo, ui, dados, sonido, camara: cam, hud, heroe, estado });
async function empezarCombate(g) {
  H.destino = null; H.interaccion = null; heroe.vel = 0; H.bloqueado = true;   // nada de pasear (ni de volver a pisar el círculo) hasta que acabe todo
  const grupo = g.miembros.filter((m) => !m.pj.restos).map((m) => ({ pj: m.pj, nombre: m.n, tipo: PAR.enemigo.tipo, jefe: !!m.jefe, cuerpo: m.jefe ? 2 : 1, ataque: m.jefe ? 3 : 2, defensa: 2, mover: m.jefe ? 5 : 6, rotulo: m.rotulo }));
  for (const m of g.miembros) m.pj.vel = 0;
  $('#hud').classList.add('combate');
  const { resultado, caidos } = await combate.empezar(grupo);
  $('#hud').classList.remove('combate'); hud.narrar('');
  CAM.modo = 'paseo'; CAM.yawObj = null;
  if (resultado === 'victoria') {
    g.vivo = false; hud.banner('¡Victoria!', 'heroe'); sonido.victoria(); heroe.hacer('celebrar', 1.2);
    const oro = Math.round((g.miembros.length * 5 + (g.miembros.some((m) => m.jefe) ? 10 : 0)) * (1 + (estado.oroExtra || 0))); estado.oro += oro; estado.usos = estado.usosMax; estado.rezos = 1;   // fuera de las criptas, un rezo por pelea
    if (estado.carneTrol && estado.cuerpo < estado.max) { estado.cuerpo++; setTimeout(() => ui.numero(H.pos.clone().add(new THREE.Vector3(0, 2.1, 0)), '+1 ❤ Carne de trol', '#ff9aa8'), 1600); }
    ui.monedas(H.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), 8); setTimeout(() => ui.numero(H.pos.clone().add(new THREE.Vector3(0, 3.1, 0)), `+${oro} oro`, '#ffd34a'), 500);
    if (GRUPOS.every((x) => !x.vivo) && estado.mision === 'activa' && !marcaBrezo) marcaBrezo = ui.marcador(brezo.grupo, '?', 3.55);
    const botin = {}; for (const m of g.miembros) for (const [k, n] of Object.entries(botinDe(PAR.enemigo.tipo, m.jefe))) botin[k] = (botin[k] || 0) + n;   // huesos para la forja de Morrandar
    sumarBotin(DEF, botin); const tb = textoBotin(botin); if (tb) setTimeout(() => ui.numero(H.pos.clone().add(new THREE.Vector3(0, 2.6, 0)), tb, '#e8e0d0'), 1100);
    await ganarExperiencia(g.miembros.reduce((s, m) => s + (m.jefe ? 25 : 10), 0));
  } else {
    // derrota: Brezo te lleva junto a la hoguera
    hud.acciones([]);
    $('#fundido').classList.add('ver'); await new Promise((r) => setTimeout(r, 900));
    heroe.caido = false; heroe.cuerpo.rotation.x = 0;
    H.pos.set(SITIOS.hoguera.x + 2.2, 0, SITIOS.hoguera.z + 1.2); H.pos.y = mundo.alturaEn(H.pos.x, H.pos.z);
    estado.cuerpo = estado.max; estado.usos = estado.usosMax; hud.actualizar();
    for (const m of g.miembros) if (m.pj.restos == null) { const k = g.miembros.indexOf(m), a = k / g.miembros.length * Math.PI * 2; m.pj.grupo.position.set(g.ancla.x + Math.cos(a) * 1.6, 0, g.ancla.z + Math.sin(a) * 1.6); m.pj.grupo.position.y = mundo.alturaEn(m.pj.grupo.position.x, m.pj.grupo.position.z); }
    $('#fundido').classList.remove('ver');
    await hablar(GUIA, TX.rescate);
  }
  if (estado.mision === 'activa' && estado.setas >= 3 && GRUPOS.every((x) => !x.vivo) && !marcaBrezo) marcaBrezo = ui.marcador(brezo.grupo, '?', 3.55);
  guardarAhora(); hud.actualizar(); H.bloqueado = false;
}

// ---------- tu héroe: cambiarlo, subir de nivel, la portada y el creador ----------
function ponerHeroe(def) {
  const viejo = heroe, pos = viejo.grupo.position.clone(), rot = viejo.grupo.rotation.y;
  escena.remove(viejo.grupo); viejo.desechar?.();
  heroe = crearHeroe(def); heroe.grupo.position.copy(pos); heroe.grupo.rotation.y = rot; heroe.mirarA(rot); escena.add(heroe.grupo);
  H.pos = heroe.grupo.position; combate.ponerHeroe(heroe);
}
async function ganarExperiencia(xp) {
  if (!xp) return;
  DEF.xp = (DEF.xp || 0) + xp; ui.numero(H.pos.clone().add(new THREE.Vector3(0, 3.6, 0)), `+${xp} exp`, '#b9a2ff');
  const n = nivelDe(DEF.xp);
  if (n > (DEF.nivel || 1)) {
    const antes = DEF.nivel || 1; DEF.oro = estado.oro; DEF.pociones = estado.pociones; prepararSubida(DEF); DEF.nivel = n; aplicarHeroe(DEF); hud.actualizar();   // lo ganado en el combate no se pierde al recalcular
    await new Promise((r) => setTimeout(r, 900));
    hud.banner(`¡Nivel ${n}!`, 'heroe'); sonido.victoria(); heroe.hacer('celebrar', 1.4); camara_luz();
    ui.chispas(H.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), '#ffe08a', 60, 5);
    for (let k = antes + 1; k <= n; k++) await hablar('¡Subes de nivel!', [`${DEF.nombre} llega a nivel ${k}: +1 de cuerpo y te recuperas del todo. ¿Qué más quieres mejorar?`], mejorasDisponibles(DEF).map((o) => [o.texto, () => elegirMejora(DEF, o.id)]));
    DEF.oro = estado.oro; DEF.pociones = estado.pociones; aplicarHeroe(DEF); hud.actualizar();
  }
  guardarAhora(); hud.actualizar();
}
function camara_luz() { CAM.temblor = .15; }
function pintarPortada() {
  if (!$('#portada')) return;   // ya se quitó (entraste directo o volviste de la cripta)
  { const [a, ...b] = PAR.nombre.split(' de '); $('#portada h1').innerHTML = `<small>Morrandar se detiene en…</small>${a}${b.length ? '<br>de ' + b.join(' de ') : ''}`; document.title = `Criptas · ${PAR.nombre}`; }   // el nombre de cada parada
  const C0 = CLASES[DEF.clase], R0 = RAZAS[DEF.raza];
  $('#empezar').textContent = nuevo ? 'Crear mi héroe' : 'Bajar de Morrandar';
  $('#cambiar').hidden = nuevo;
  $('#saludo').textContent = nuevo ? 'Prototipo del modo aventura: crea tu héroe, pasea libre y, si tocas a los esqueletos, se juega por turnos.'
    : `${DEF.nombre}, ${R0.nombre.toLowerCase()} ${C0.nombre.toLowerCase()} de nivel ${DEF.nivel || 1}, está listo para bajar.`;
}
const SITIO_CREADOR = new THREE.Vector3(-2.5, 0, -21);
let borrador = null;
function abrirCreador() {
  borrador = JSON.parse(JSON.stringify(DEF)); if (nuevo) borrador.nombre = '';
  $('#portada')?.classList.add('fuera'); setTimeout(() => $('#portada')?.remove(), 900);
  $('#creador').hidden = false; requestAnimationFrame(() => $('#creador').classList.add('abierto'));
  H.bloqueado = true; CAM.modo = 'creador'; CAM.yaw = 3.1; CAM.dist = 6; CAM.pitch = .2;
  heroe.grupo.position.set(SITIO_CREADOR.x, mundo.alturaEn(SITIO_CREADOR.x, SITIO_CREADOR.z), SITIO_CREADOR.z); heroe.mirarA(Math.PI); heroe.grupo.rotation.y = Math.PI;
  pintarCreador(true);
}
function pintarCreador(rehacer) {
  const b = borrador, R0 = RAZAS[b.raza], C0 = CLASES[b.clase];
  if (rehacer) { ponerHeroe(b); heroe.mirarA(heroe.grupo.rotation.y); heroe.hacer('girar', .7); }
  $('#cNombre').value = b.nombre || '';
  $('#cNombre').placeholder = 'Ponle nombre…';
  const tarjetas = (sel, lista, actual, al) => { const d = $(sel); d.innerHTML = ''; for (const [id, x] of Object.entries(lista)) { const t = document.createElement('button'); t.className = id === actual ? 'sel' : ''; t.innerHTML = `<span>${x.icono}</span>${x.nombre}`; t.onclick = () => { sonido.dado(.4); al(id); }; d.appendChild(t); } };
  tarjetas('#cRazas', RAZAS, b.raza, (id) => { b.raza = id; const R = RAZAS[id]; if (!R.pieles.includes(b.colores.piel)) b.colores.piel = R.pieles[0]; if (!R.pelos.includes(b.colores.pelo)) b.colores.pelo = R.pelos[0]; pintarCreador(true); });
  tarjetas('#cClases', CLASES, b.clase, (id) => { b.clase = id; if (!CLASES[id].ropa.includes(b.colores.ropa)) b.colores.ropa = CLASES[id].ropa[0]; pintarCreador(true); });
  $('#cRasgo').innerHTML = `<b>${R0.rasgo}.</b> ${R0.texto}`;
  $('#cHab').innerHTML = `${C0.texto} <b>${C0.habilidad.icono} ${C0.habilidad.nombre}:</b> ${C0.habilidad.texto}`;
  const muestras = (sel, lista, clave) => { const d = $(sel); d.innerHTML = ''; for (const c of lista) { const m = document.createElement('button'); m.style.background = c; m.className = b.colores[clave] === c ? 'sel' : ''; m.setAttribute('aria-label', c); m.onclick = () => { b.colores[clave] = c; sonido.dado(.3); pintarCreador(true); }; d.appendChild(m); } };
  muestras('#cRopa', C0.ropa, 'ropa'); muestras('#cPiel', R0.pieles, 'piel'); muestras('#cPelo', R0.pelos, 'pelo');
  $('#lPiel').textContent = b.raza === 'escamado' ? 'Escamas' : 'Piel'; $('#lPelo').textContent = b.raza === 'escamado' ? 'Cuernos' : 'Pelo';
  const s = estadisticas(b);
  $('#cStats').innerHTML = `<span>⚔️ Ataque ${s.ataque}</span><span>🛡️ Defensa ${s.defensa}</span><span>❤️ Cuerpo ${s.max}</span><span>${C0.habilidad.icono} ${s.usos} ${s.usos === 1 ? 'uso' : 'usos'}</span>`;
  $('#cListo').textContent = nuevo ? '¡A la aventura!' : 'Guardar y bajar';
}
$('#cNombre').addEventListener('input', (e) => { borrador.nombre = e.target.value.replace(/[<>&"'`]/g, '').slice(0, 20); $('#cError').hidden = true; });
$('#cAzar').addEventListener('click', () => { const r = heroeAlAzar(); Object.assign(borrador, { nombre: r.nombre, raza: r.raza, clase: r.clase, colores: r.colores }); sonido.dado(1); pintarCreador(true); });
$('#cListo').addEventListener('click', () => {
  borrador.nombre = (borrador.nombre || '').trim();
  if (!borrador.nombre) { $('#cError').hidden = false; $('#cNombre').focus(); return; }
  nuevo = false; aplicarHeroe(borrador); guardarHeroe(DEF, true); hud.actualizar();
  $('#creador').classList.remove('abierto'); setTimeout(() => { $('#creador').hidden = true; }, 400);
  sonido.recoger(); bajar();
});

// ---------- bucle ----------
const reloj = new THREE.Clock();
let t = 0;
const adelante = new THREE.Vector3(), derecha = new THREE.Vector3(), mov = new THREE.Vector3();
function moverHeroe(dt) {
  if (H.bloqueado || dlg.actual || combate.activo) { heroe.vel += (0 - heroe.vel) * Math.min(1, dt * 10); return; }
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
    const tR = enRampa(H.pos.x, H.pos.z);
    if (tR != null) H.pos.x = RAMPA.x + THREE.MathUtils.clamp(H.pos.x - RAMPA.x, -1.05, 1.05);   // en la pasarela, la barandilla hace de tope
    else {
      for (const o of mundo.obstaculos) { if (o.pasarela) continue; const dx = H.pos.x - o.x, dz = H.pos.z - o.z, d = Math.hypot(dx, dz), min = o.r + .45; if (d < min && d > 0) { H.pos.x = o.x + dx / d * min; H.pos.z = o.z + dz / d * min; } }
      const r = Math.hypot(H.pos.x, H.pos.z); if (r > 50) { H.pos.x *= 50 / r; H.pos.z *= 50 / r; }
    }
    H.pasoFase += v * dt; if (H.pasoFase > 1.4) { H.pasoFase = 0; sonido.paso(); }
  }
  heroe.vel += ((l > .05 ? (corre ? 1 : .75) * l : 0) - heroe.vel) * Math.min(1, dt * 10);
  const tR = enRampa(H.pos.x, H.pos.z);
  H.pos.y += ((tR != null ? alturaRampa(tR) : mundo.alturaEn(H.pos.x, H.pos.z)) - H.pos.y) * Math.min(1, dt * 15);
  if (tR != null && tR > .2 && !H.subiendo) subirAMorrandar();   // un cachito de pasarela y, si sigues, para arriba
  // ¿estás pisando el círculo de algún grupo de esqueletos?
  for (const g of GRUPOS) if (g.vivo && g.miembros.some((m) => !m.pj.restos && m.pj.grupo.position.distanceTo(H.pos) < 3.6)) { empezarCombate(g); break; }
}
// ---------- la pasarela de Morrandar se puede subir andando ----------
// Baja en línea recta de (−6, 22.5, −66) al pie, en SITIOS.llegada, con una pequeña panza en medio (igual que se dibuja en claro-mundo.js)
const RAMPA = { x: -6, zPie: SITIOS.llegada.z, zArriba: -66, yArriba: 22.5 };
function enRampa(x, z) {
  const t = (RAMPA.zPie - z) / (RAMPA.zPie - RAMPA.zArriba);
  return Math.abs(x - RAMPA.x) < 1.3 && t > .02 && t < 1.02 ? Math.min(1, t) : null;
}
const alturaRampa = (t) => .15 + (RAMPA.yArriba - .15) * t - Math.sin(t * Math.PI) * 1.2 + .2;
function subirAMorrandar() {
  if (combate.activo) return;
  H.subiendo = true; H.bloqueado = true; sonido.recoger?.();
  guardarAhora(); guardarHeroe(DEF, true); $('#fundido').classList.add('ver');
  const t0 = performance.now(), z0 = H.pos.z;
  (function andarSolo() {   // sigue subiendo él solo mientras se funde a negro
    const k = Math.min(1, (performance.now() - t0) / 900); H.pos.z = z0 - k * 4; H.pos.y = alturaRampa(enRampa(H.pos.x, H.pos.z) ?? .3); heroe.vel = .75; heroe.mirarA(Math.PI);
    if (k < 1) requestAnimationFrame(andarSolo); else location.href = 'pueblo.html?desde=escala';
  })();
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
  if (H.cerca && !dlg.actual) {
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
    else { const q = (p - .88) / .12; H.pos.set(hasta.x + 1.2 * q, 0, hasta.z + 4.5 * q); H.pos.y = mundo.alturaEn(H.pos.x, H.pos.z); }   // unos pasos ya en la hierba
    heroe.vel = .75; heroe.mirarA(p < .88 ? Math.atan2(hasta.x - desde.x, hasta.z - desde.z) : Math.atan2(1.2, 4.5));   // de cara a donde va
    if (p >= 1) { H.bloqueadoFin = true; CAM.modo = 'paseo'; H.bloqueado = false; heroe.vel = 0; $('#hud').classList.add('ver'); brezo.hacer('saludar', 1.2); hud.banner(PAR.nombre, 'heroe'); }
  }
  moverHeroe(dt); rondaEsqueletos(dt); cercanos(); animarCosas(dt);
  if (CAM.modo === 'creador') heroe.mirarA(Math.PI + (CAM.giro || 0) + Math.sin(t * .6) * .3);   // en el creador, de cara; arrastrando lo giras
  mundo.actualizar(t, dt); DECOR?.actualizar(t);
  heroe.animar(dt, t); brezo.animar(dt, t);
  if (!H.bloqueado && !dlg.actual && !combate.activo && H.pos.distanceTo(brezo.grupo.position) < 6) brezo.mirarA(Math.atan2(H.pos.x - brezo.grupo.position.x, H.pos.z - brezo.grupo.position.z));
  for (const g of GRUPOS) for (const m of g.miembros) m.pj.animar(dt, t);
  moverOtros(dt, t);
  combate.actualizar(dt, t); dados.actualizar(dt); ui.actualizar(dt, t);
  actualizarCamara(dt);
  sonido.actualizar(H.pos.distanceTo(SITIOS.hoguera));
  if (composer) composer.render(); else render.render(escena, camara);
  CAL.tick();
  requestAnimationFrame(bucle);
}

// ---------- el claro como lo dejaste (misión, setas, cofre, esqueletos) ----------
function restaurarClaro() {
  const c = PID === 'claro' ? DEF.claro : DEF.paradas?.[PID]; if (!c) return;
  Object.assign(estado, { mision: c.mision || 'nueva', setas: c.setas || 0, setasCogidas: c.setasCogidas || [], cofre: !!c.cofre });
  for (const it of interactivos.filter((x) => x.tipo === 'seta' && estado.setasCogidas.includes(x.idx))) { escena.remove(it.obj, it.extra); it.anillo.visible = false; interactivos.splice(interactivos.indexOf(it), 1); }
  if (estado.cofre) cofre.userData.tapa.rotation.x = -1.9;
  GRUPOS.forEach((g, i) => { if (c.grupos?.[i] === false && g.vivo) { g.vivo = false; for (const m of g.miembros) { escena.remove(m.pj.grupo); ui.quitar(m.rotulo); } } });
  if (estado.mision !== 'nueva' && marcaBrezo) { ui.quitar(marcaBrezo); marcaBrezo = null; }
  if (estado.mision === 'activa' && estado.setas >= 3 && GRUPOS.every((x) => !x.vivo)) marcaBrezo = ui.marcador(brezo.grupo, '?', 3.55);
  if (estado.mision === 'hecha') mundo.abrirCripta();
  hud.actualizar();
}
restaurarClaro();

// ---------- inicio ----------
H.pos.set(-6, 22.5, -66);
CAM.objetivo.copy(H.pos);
hud.actualizar();
bucle();
$('#portada').classList.add('lista');
function bajar() {
  $('#portada')?.classList.add('fuera'); CAM.modo = 'intro'; CAM.introT = 0; CAM.introEmpezada = true;
  setTimeout(() => $('#portada')?.remove(), 900);
}
$('#empezar').addEventListener('click', () => { sonido.arrancar(); if (nuevo) abrirCreador(); else bajar(); });
$('#cambiar').addEventListener('click', () => { sonido.arrancar(); abrirCreador(); });
pintarPortada();
// Si hay sesión, el héroe de la nube manda (puede venir de otro dispositivo)
cargarHeroe().then((h) => { if (h && JSON.stringify(h) !== JSON.stringify(DEF) && !$('#creador').classList.contains('abierto')) { nuevo = false; aplicarHeroe(h); ponerHeroe(h); restaurarClaro(); hud.actualizar(); pintarPortada(); } });
if (params.has('rapido')) { $('#portada').remove(); CAM.introT = 99; CAM.introEmpezada = true; }
if (params.has('desde')) {   // vuelves de la cripta: apareces en su puerta, sin portada ni bajada
  $('#portada').remove(); CAM.modo = 'paseo'; H.bloqueadoFin = true; H.bloqueado = false; $('#hud').classList.add('ver');
  H.pos.copy(SITIOS.cripta).addScaledVector(FRENTE, 4); H.pos.y = mundo.alturaEn(H.pos.x, H.pos.z); heroe.mirarA(SITIOS.criptaGiro); CAM.yaw = SITIOS.criptaGiro + .32; CAM.objetivo.copy(H.pos);   // la cámara, delante de la puerta: te ve salir con la cripta detrás
  const caido = params.has('caido');
  history.replaceState(null, '', PID === 'claro' ? 'claro.html' : `claro.html?p=${PID}`);
  if (caido) setTimeout(() => hablar(GUIA, TX.rescateCripta), 900);
}
if (params.has('crear')) { $('#portada').classList.add('fuera'); abrirCreador(); }
// ---------- Jugar juntos: los de tu sala que estén en esta misma parada se ven paseando (la sala es la del pueblo) ----------
// Bajar a la cripta: si estás en una sala, los demás se enteran y pueden seguirte (misma cripta, misma semilla)
async function bajarCripta(url) {
  guardarAhora(); guardarHeroe(DEF, true); $('#fundido').classList.add('ver');
  await Promise.race([avisarBajada(SALA, url), new Promise((r) => setTimeout(r, 1500))]).catch(() => {});
  setTimeout(() => { location.href = url; }, 400);
}
function mirarBajadas(id, g) {
  let b = null; try { b = JSON.parse(g.baja || 'null'); } catch { return; }
  if (!b || b.n < CARGADA - 15000 || BAJADAS_VISTAS.has(id + b.n)) return;   // solo las de ahora, y cada una una vez
  BAJADAS_VISTAS.add(id + b.n);
  let h = {}; try { h = JSON.parse(g.heroe || '{}'); } catch { /* sin nombre */ }
  bajadaPendiente = { nombre: h.nombre || g.nombre || 'Alguien', url: b.url };
}
function ofrecerBajada() {
  if (!bajadaPendiente || combate.activo || dlg.actual || H.bloqueado) return;
  const { nombre, url } = bajadaPendiente; bajadaPendiente = null;
  hablar('Jugar juntos', [`${nombre} acaba de bajar a la cripta. Si bajas ahora, entraréis en la misma: lo que abra uno se abre para los dos.`], [[`Bajar con ${nombre}`, () => bajarCripta(url)], ['Me quedo aquí', null]]);
}
const datosHeroe = () => ({ nombre: DEF.nombre, raza: DEF.raza, clase: DEF.clase, colores: DEF.colores });
{
  // El botón ☰: jugar juntos, sonido, pantalla completa, controles y volver (igual en todo el juego)
  const bSala = document.createElement('button');   // el panel de la sala se abre desde la libreta
  sonido.silenciar(leerMudo());
  const MENU = crearMenu({ boton: $('#menuB'), apps: () => [
    { ico: '👥', titulo: 'Jugar juntos', sub: SALA ? 'Sala ' + SALA.codigo : 'Con código', hacer: () => { setTimeout(() => bSala.click(), 0); } },
    { ico: sonido.mudo() ? '🔇' : '🔊', titulo: 'Sonido', sub: sonido.mudo() ? 'Apagado' : 'Encendido', hacer: (M) => { sonido.arrancar(); sonido.silenciar(!sonido.mudo()); guardarMudo(sonido.mudo()); M.pintar(); return 'seguir'; } },
    appPantalla(),
    { ico: '❔', titulo: 'Cómo se juega', sub: 'Controles', hacer: (M) => { M.pagina('Cómo se juega', AYUDA); return 'seguir'; } },
    { ico: '🐢', titulo: 'Morrandar', sub: 'Subir al pueblo', apagada: combate.activo, hacer: () => { if (combate.activo) return; guardarAhora(); guardarHeroe(DEF, true); location.href = 'pueblo.html?desde=escala'; } },
    appMenu()
  ] });
  import('./reunion.js').then((RED) => RED.crearPanel({
    donde: DONDE, boton: bSala, proponer: false, datos: () => ({ clase: DEF.clase, x: H.pos.x, z: H.pos.z }),
    alConectar: (R) => { SALA = R; MENU.marca(R.codigo); R.cambiar({ heroe: JSON.stringify(datosHeroe()) }); R.on('gente', pintarOtros).on('frase', decirOtro); pintarOtros(R.gente()); },
    alSalir: () => { SALA = null; MENU.marca(''); pintarOtros({}); }
  })).catch((e) => console.warn('Sin sala:', e?.message));
}
function pintarOtros(gente) {
  for (const [id, o] of [...OTROS]) if (!gente[id] || gente[id].donde !== DONDE || gente[id].online === false) { escena.remove(o.pj.grupo); ui.quitar(o.rot); OTROS.delete(id); }
  PJ?.gente(gente);
  for (const [id, g] of Object.entries(gente)) {
    if (id !== SALA?.yo.id && g.baja) mirarBajadas(id, g);
    if (id === SALA?.yo.id || g.donde !== DONDE || g.online === false) continue;
    let o = OTROS.get(id);
    if (!o || o.heroe !== g.heroe) {
      if (o) { escena.remove(o.pj.grupo); ui.quitar(o.rot); }
      let h = {}; try { h = JSON.parse(g.heroe || '{}'); } catch { /* sin datos: uno genérico */ }
      const pj = crearHeroe({ raza: h.raza || 'humano', clase: h.clase || g.clase || 'mago', colores: h.colores || {} });
      const x = g.x ?? 0, z = g.z ?? 0; pj.grupo.position.set(x, mundo.alturaEn(x, z), z); escena.add(pj.grupo);
      o = { pj, heroe: g.heroe, rot: ui.rotulo(pj.grupo, h.nombre || g.nombre || 'Viajero', { altura: pj.altura + .25, sub: g.nombre }), tx: x, tz: z }; OTROS.set(id, o);
    }
    o.tx = g.x ?? o.tx; o.tz = g.z ?? o.tz;
  }
}
function decirOtro(id, texto) { const o = OTROS.get(id); if (o) ui.numero(o.pj.grupo.position.clone().add(new THREE.Vector3(0, o.pj.altura + .8, 0)), String(texto).slice(0, 40), '#fff8e6'); }
function moverOtros(dt, t) {
  for (const o of OTROS.values()) {
    if (o.pj.manejado) { o.pj.animar(dt, t); continue; }   // está dentro de mi pelea: lo mueve el combate
    const p = o.pj.grupo.position, dx = o.tx - p.x, dz = o.tz - p.z, d = Math.hypot(dx, dz);
    if (d > 10) { p.x = o.tx; p.z = o.tz; } else if (d > .05) { const v = Math.min(d, dt * 6.5); p.x += dx / d * v; p.z += dz / d * v; o.pj.mirarA(Math.atan2(dx, dz)); }
    o.pj.vel += ((d > .15 ? .75 : 0) - o.pj.vel) * Math.min(1, dt * 8); p.y = mundo.alturaEn(p.x, p.z); o.pj.animar(dt, t);
  }
  if (SALA && !combate.activo) SALA.mover(H.pos.x, H.pos.z, +heroe.grupo.rotation.y.toFixed(2));
  ofrecerBajada();
  PJ?.actualizar(dt, t);
}
// Pelear juntos: ver los círculos de los demás y entrar pisándolos (js/pelea-juntos.js)
PJ = crearPeleaJuntos({ escena, ui, hud, combate, dados, cam, H, heroe: () => heroe, estado, def: () => DEF, sala: () => SALA, otros: () => OTROS, donde: () => DONDE,
  fabricar: (t, jefe) => { const esc = jefe ? 1.25 : 1, ojo = PAR.enemigo.ojo; return t === 'zombi' ? crearZombi({ escala: esc, ojo }) : t === 'momia' ? crearMomia({ escala: esc, ojo }) : crearEsqueleto({ escala: esc, ojo, color: PAR.enemigo.color }); },
  enemigosLocales: () => GRUPOS.filter((g) => g.vivo).flatMap((g) => g.miembros.map((m) => m.pj)),
  alAcabar: async ({ fin, caidos, caiste }) => {
    if (fin === 'victoria') {
      const oro = caidos.length * 5; estado.oro += oro; estado.usos = estado.usosMax; hud.banner('¡Victoria en compañía!', 'heroe'); sonido.victoria();
      ui.numero(H.pos.clone().add(new THREE.Vector3(0, 3.1, 0)), `+${oro} oro`, '#ffd34a'); await ganarExperiencia(caidos.length * 10);
    } else if (caiste) hud.narrar('Te levantas a duras penas. La próxima, más cerca de tu compañero.');
    hud.actualizar(); guardarAhora();
  } });
window.claro = { bajarCripta, OTROS, get SALA() { return SALA; }, get PJ() { return PJ; }, escena, estado, H, CAM, GRUPOS, combate, interactivos, empezarCombate, interactuar, hud, camara, get heroe() { return heroe; }, get def() { return DEF; }, ponerHeroe, aplicarHeroe, ganarExperiencia, abrirCreador };
