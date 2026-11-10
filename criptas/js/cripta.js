// =============================================================
//  LA CRIPTA DE LOS HUESOS · la mazmorra del modo aventura.
//  La misión sale del generador de siempre (Mazmorra Infinita, plano «cripta»)
//  con menos monstruos, porque vas solo. Paseas libre por los pasillos, abres
//  puertas, las salas se destapan y, si te ven, el combate por turnos empieza
//  sobre las propias losas, con sus paredes. El guion de la misión
//  (disparadores, flags, tesoros, objetivo) funciona igual que en el clásico.
// =============================================================
import * as THREE from 'three';
import { crearCalidad } from './calidad.js';
import { EffectComposer } from './vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/addons/postprocessing/OutputPass.js';
import * as D from './datos.js';
import * as TB from './tablero.js';
import { generarMision } from './procedural.js';
import { EFECTOS_CRIPTA } from './cocina.js';
import { paradaDe } from './paradas.js';
import { crearCripta, aSolas, C } from './claro-cripta.js';
import { crearHeroe, crearEsqueleto, crearMago, crearZombi, crearMomia } from './claro-personajes.js';
import { crearUI3D } from './claro-ui3d.js';
import { crearDados } from './claro-dados.js';
import { crearCombate } from './claro-combate.js';
import { crearSonido } from './claro-sonido.js';
import { crearHud } from './claro-hud.js';
import { crearJuntos } from './cripta-juntos.js';
import { crearMenu, appPantalla, appMenu, leerMudo, guardarMudo, AYUDA_AVENTURA } from './menu-aventura.js';
import { CLASES, estadisticas, nivelDe, mejoraDeNivel, prepararSubida, elegirMejora, mejorasDisponibles, leerLocal, guardarHeroe, heroeAlAzar, botinDe, sumarBotin, textoBotin } from './claro-heroes.js';

const $ = (s) => document.querySelector(s);
const MOVIL = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const params = new URLSearchParams(location.search);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- motor ----------
const lienzo = $('#lienzo');
const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: !MOVIL, powerPreference: 'high-performance' });
render.setPixelRatio(Math.min(devicePixelRatio, MOVIL ? 1.6 : 2)); render.setSize(innerWidth, innerHeight);
render.shadowMap.enabled = true; render.shadowMap.type = THREE.PCFSoftShadowMap; render.outputColorSpace = THREE.SRGBColorSpace;
const escena = new THREE.Scene();
const camara = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 300);
let composer = null;
if (!MOVIL && !params.has('sinbrillo')) {
  composer = new EffectComposer(render); composer.addPass(new RenderPass(escena, camara));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .55, .5, .78)); composer.addPass(new OutputPass());
}
const CAL = crearCalidad(render, Math.min(devicePixelRatio, MOVIL ? 1.6 : 2), (r) => { composer?.setPixelRatio(r); composer?.setSize(innerWidth, innerHeight); });
addEventListener('resize', () => { camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); render.setSize(innerWidth, innerHeight); composer?.setSize(innerWidth, innerHeight); });

// ---------- la misión: la Mazmorra Infinita en el plano de la cripta, para un héroe solo ----------
// De dónde vienes: la cripta de una parada (el claro, el pantano…), o un encargo de la oficina de Morrandar
const DEL_PUEBLO = params.get('vuelta') === 'pueblo';
const PID = params.get('p') || 'claro', PAR = paradaDe(PID);
const SEMILLA = params.get('semilla') || PAR.cripta.semilla;
const NIVEL = Math.max(1, Math.min(10, +params.get('nivel') || PAR.cripta.nivel));
const AL_SITIO = PAR.corto.replace(/^El /, 'al ').replace(/^La /, 'a la ');
const ESCENARIO = PID === 'claro' ? 'claro.html' : `claro.html?p=${PID}&`;
const VOLVER = DEL_PUEBLO ? 'pueblo.html?desde=escala' : (PID === 'claro' ? 'claro.html?desde=cripta' : `${ESCENARIO}desde=cripta`);
const mision = aSolas(generarMision(SEMILLA, NIVEL, 'cripta'));
if (!DEL_PUEBLO) mision.titulo = PAR.cripta.titulo;   // la de cada parada tiene nombre propio; las de los encargos, el suyo
// Los monstruos de la zona: en el pantano, zombis y brujas (el jefe conserva su nombre y su fuerza)
if (PAR.cripta.monstruos) { const L = PAR.cripta.monstruos; const re = (mo, i) => { if (!mo.jefe && !mo.nombre) mo.tipo = L[(i * 7 + (mo.x || 0)) % L.length]; }; mision.monstruos.forEach(re); for (const d of mision.disparadores || []) for (const a of d.acciones || []) if (a.tipo === 'aparecer') a.monstruos.forEach(re); }
// Un preso con nombre propio (en las Celdas de Hierro, Bruna): se cambia el del generador en todos los textos
if (PAR.cripta.preso && !DEL_PUEBLO) {
  const t = Object.values(mision.tesoros || {}).find((x) => x.flag === 'rescatado'), viejo = t?.texto.match(/Encadenado al muro está (.+?)\. /)?.[1];
  if (viejo) {
    const mayus = (x) => x[0].toUpperCase() + x.slice(1), nuevo = PAR.cripta.preso;
    const j = JSON.stringify(mision).split(mayus(viejo)).join(nuevo).split(viejo).join(nuevo);
    Object.assign(mision, JSON.parse(j));
    for (const x of Object.values(mision.tesoros)) if (x.flag === 'rescatado' && PAR.cripta.rescate) x.texto = PAR.cripta.rescate;
  }
}
if (mision.objetivo?.tipo === 'escapar') { mision.objetivo.tipo = 'escalera'; mision.objetivo.texto = 'Encuentra lo que buscas y vuelve a la escalera.'; }   // aquí no hay rondas: vas a tu ritmo
const cripta = crearCripta(escena, mision, { movil: MOVIL });
const ui = crearUI3D(escena, camara);
const sonido = crearSonido({ entorno: 'cripta' });
const dados = crearDados(escena, { alSonar: (f) => sonido.dado(f) });

// ---------- tu héroe ----------
let DEF = leerLocal() || { ...heroeAlAzar(), nombre: 'Viajero' };
const estado = { cuerpo: 8, max: 8, ataque: 2, defensa: 2, oro: 0, pociones: 1, usos: 2, mision: 'cripta' };
function aplicarHeroe(def) {
  DEF = def; const s = estadisticas(def, true);
  Object.assign(estado, { ataque: s.ataque, defensa: s.defensa, max: s.max, cuerpo: s.max, usos: s.usos, usosMax: s.usos, pasosExtra: s.pasosExtra, escamas: s.escamas, habilidad: CLASES[def.clase].habilidad, oro: def.oro || 0, pociones: def.pociones ?? 1 });
}
aplicarHeroe(DEF);
const heroe = crearHeroe(DEF); escena.add(heroe.grupo);
const linterna = new THREE.PointLight('#ffcf8a', 11, 13, 1.3); escena.add(linterna);   // la luz que llevas contigo
const H = { pos: heroe.grupo.position, destino: null, interaccion: null, bloqueado: true, pasoFase: 0 };
{
  // Apareces al pie de la escalera: en una casilla libre pegada a ella, mejor si es de su misma sala
  const e = mision.escalera || [1, 1], rE = TB.region(e[0], e[1]);
  const pie = [[0, 2], [1, 2], [-1, 0], [-1, 1], [2, 0], [2, 1], [0, -1], [1, -1]].map(([dx, dy]) => [e[0] + dx, e[1] + dy]).filter(([x, y]) => cripta.pisable(x, y));
  const enSala = pie.filter(([x, y]) => TB.region(x, y) === rE);   // al azar entre las buenas: si bajáis juntos, no salís uno encima del otro
  const [x, y] = enSala[Math.floor(Math.random() * enSala.length)] || pie[0] || e;
  H.pos.copy(cripta.aMundo(x, y)); heroe.mirarA(0);
  cripta.revelar(TB.region(x, y));
}

// ---------- las tareas de la misión y las flags ----------
const flags = new Set(), hechos = new Set(), buscadas = new Set(), BOTIN_TOTAL = [];
function textoMision() {
  const tareas = (mision.tareas || []).map((t) => `<span class="${t.flag && flags.has(t.flag) ? 'hecho' : ''}">${t.texto}</span>`).join('');
  return `<b>${mision.titulo}</b>${tareas || `<span>${mision.objetivo?.texto || 'Explora la cripta'}</span>`}`;
}
const { hud, hablar, dlg } = crearHud({ estado, def: () => DEF, sonido, movil: MOVIL, mision: textoMision });
function guardarAhora() { DEF.oro = estado.oro; DEF.pociones = estado.pociones; guardarHeroe(DEF); }

// ---------- monstruos: un modelo para cada tipo ----------
const XP_TIPO = { esqueleto: 10, zombi: 12, momia: 20, sacerdotisa: 18, bruja: 18, guerrero: 20, gargola: 30, hechicero: 30, trasgo: 8, orco: 12 };
function modelo(tipo, jefe) {
  let pj;
  if (tipo === 'zombi') pj = crearZombi();
  else if (tipo === 'momia') pj = crearMomia({ escala: 1.08 });
  else if (tipo === 'sacerdotisa') pj = crearMago({ tunica: '#e8e2cc', sombrero: 'capucha', colorSombrero: '#c8c0a8', piel: '#e8e4d8', pelo: '#d8d0c0', cristal: '#c9f0ff' });
  else if (tipo === 'bruja') pj = crearMago({ tunica: '#4a6a2a', piel: '#a8c890', pelo: '#2b1d16', cristal: '#9aff5a' });
  else if (tipo === 'hechicero') pj = crearMago({ tunica: '#3a2050', piel: '#c8c0d0', pelo: '#1a1020', cristal: '#c06aff' });
  else pj = crearEsqueleto({ color: tipo === 'esqueleto' ? undefined : '#b0a890' });
  if (jefe) { pj.grupo.scale.setScalar(1.3); pj.altura *= 1.3; }
  return pj;
}
const monstruos = [];
let J = null;   // los de tu sala que están en esta misma cripta (cripta-juntos.js)
function nacer(mo, alerta = false) {
  const st = D.MONSTRUOS[mo.tipo] || D.MONSTRUOS.esqueleto, pj = modelo(mo.tipo, mo.jefe), p = cripta.aMundo(mo.x, mo.y);
  pj.grupo.position.copy(p); pj.mirarA(Math.random() * 6);
  const r = TB.region(mo.x, mo.y); cripta.regiones.get(r).g.add(pj.grupo);
  const nombre = mo.nombre || (mo.jefe ? (st.nombre + ' jefe') : st.nombre);
  const x = { def: mo, id: mo.id, tipo: mo.tipo, nombre, pj, vivo: true, alerta, region: r, st,
    // Los jefes ya traen su cuerpo del generador (no se suma otra vez) y su defensa se queda en 4 como mucho:
    // los monstruos paran con el escudo negro (1 de cada 6), y con 5 dados el Rey Momia parecía inmortal.
    cuerpo: mo.cuerpo || (st.cuerpo + (mo.jefe ? 2 : 0)), ataque: mo.ataque || st.ataque, defensa: Math.min(mo.jefe ? 4 : 9, mo.defensa || st.defensa), mover: Math.min(8, st.mov || 6) };
  x.rotulo = ui.rotulo(pj.grupo, nombre, { tipo: 'enemigo', altura: pj.altura + .2 });
  monstruos.push(x);
  if (J?.muertoFuera(x.id)) { x.vivo = false; pj.grupo.visible = false; }   // otro de la sala ya lo tumbó
  return x;
}
mision.monstruos.forEach((mo) => nacer(mo));

// ---------- combate sobre las losas de la cripta ----------
const CAM = { yaw: Math.PI, pitch: .78, dist: 11, objetivo: H.pos.clone(), temblor: 0, modo: 'paseo', foco: null, mirar: null };
const cam = {
  get position() { return camara.position; },
  temblar(s) { CAM.temblor = Math.max(CAM.temblor, s); },
  enfocarCombate(centro, desde) { CAM.modo = 'combate'; CAM.foco = centro.clone(); CAM.mirar = null; CAM.pitchObj = .95; CAM.distObj = MOVIL ? 17 : 12; },
  mirarHacia(p) { CAM.mirar = p.clone(); }
};
const combate = crearCombate({ escena, mundo: cripta, ui, dados, sonido, camara: cam, hud, heroe, estado });

// ---------- jugar juntos: la misma cripta para todos los de la sala ----------
let ganarLuego = false;
async function muertoFuera(id) {
  const mo = monstruos.find((m) => m.id === id); if (!mo || !mo.vivo) return;
  mo.vivo = false; if (mo.pj.desmontar && mo.visto) mo.pj.desmontar(0); else mo.pj.grupo.visible = false;
  await evento('monstruo_muerto', { id });
  if (mision.objetivo?.tipo === 'matar' && mision.objetivo.id === id) { if (combate.activo || H.bloqueado || dlg.actual) ganarLuego = true; else await ganar(); }
}
// El botón ☰, igual que en el claro y el pueblo
const bSala = document.createElement('button');
sonido.silenciar(leerMudo());
const MENU = crearMenu({ boton: $('#menuB'), apps: () => [
  { ico: '👥', titulo: 'Jugar juntos', sub: J?.SALA ? 'Sala ' + J.SALA.codigo : 'Con código', hacer: () => { setTimeout(() => bSala.click(), 0); } },
  { ico: sonido.mudo() ? '🔇' : '🔊', titulo: 'Sonido', sub: sonido.mudo() ? 'Apagado' : 'Encendido', hacer: (M) => { sonido.arrancar(); sonido.silenciar(!sonido.mudo()); guardarMudo(sonido.mudo()); M.pintar(); return 'seguir'; } },
  appPantalla(),
  { ico: '❔', titulo: 'Cómo se juega', sub: 'Controles', hacer: (M) => { M.pagina('Cómo se juega', AYUDA_AVENTURA + '<p class="texto">Para salir de la cripta, vuelve a la escalera por la que bajaste.</p>'); return 'seguir'; } },
  appMenu()
] });
J = crearJuntos({ botonSala: bSala, escena, ui, cripta, clave: `${PID}|${SEMILLA}|${NIVEL}|${DEL_PUEBLO ? 'p' : 'a'}`, heroe, H, def: () => DEF, combate, al: {
  puerta: async (id) => { const p = cripta.puertas.find((x) => x.id === id); if (p && !p.abierta) { p.bloqueada = false; if (p.candado) { p.g.remove(p.candado); p.candado = null; } await abrir(p); } },
  muerto: muertoFuera,
  buscada: (r) => buscadas.add(r),
  flag: (f) => ponerFlag(f),
  pisa: (x, y) => { const r = TB.region(x, y); if (r !== '.') abrirRegion(r); },
  marca: (c) => MENU.marca(c),
  llega: (n) => { hud.narrar(`${n} está en la cripta contigo. Lo que abráis, tumbéis o encontréis vale para los dos.`); setTimeout(() => hud.narrar(''), 5000); }
} });

async function empezarCombate(grupo) {
  H.destino = null; H.interaccion = null; H.bloqueado = true; heroe.vel = 0;
  for (const g of grupo) { g.alerta = true; g.pj.vel = 0; }
  J?.luchar(grupo.map((g) => g.id));
  $('#hud').classList.add('combate');
  const { resultado, caidosIds = [] } = await combate.empezar(grupo.map((g) => ({ pj: g.pj, id: g.id, nombre: g.nombre, cuerpo: g.cuerpo, ataque: g.ataque, defensa: g.defensa, mover: g.mover, rotulo: g.rotulo })));
  $('#hud').classList.remove('combate'); hud.narrar(''); CAM.modo = 'paseo';
  J?.luchar([]); for (const id of caidosIds) J?.anotar('m', id);
  let xp = 0;
  const botin = {};
  for (const id of caidosIds) { const mo = monstruos.find((m) => m.id === id); if (!mo) continue; mo.vivo = false; xp += (XP_TIPO[mo.tipo] || 10) + (mo.def.jefe ? 40 : 0); for (const [k, n] of Object.entries(botinDe(mo.tipo, mo.def.jefe))) botin[k] = (botin[k] || 0) + n; }
  sumarBotin(DEF, botin); BOTIN_TOTAL.push(botin);
  for (const g of grupo) { const u = monstruos.find((m) => m.id === g.id); if (u?.vivo) { u.def.x = cripta.deMundo(u.pj.grupo.position)[0]; u.def.y = cripta.deMundo(u.pj.grupo.position)[1]; } }
  if (resultado === 'derrota') return expulsado();
  hud.banner('¡Victoria!', 'heroe'); sonido.victoria(); heroe.hacer('celebrar', 1.2);
  const oro = caidosIds.length * 5; estado.oro += oro; estado.usos = estado.usosMax;
  setTimeout(() => ui.numero(H.pos.clone().add(new THREE.Vector3(0, 3.1, 0)), `+${oro} oro`, '#ffd34a'), 500);
  const tb = textoBotin(botin); if (tb) setTimeout(() => { ui.numero(H.pos.clone().add(new THREE.Vector3(0, 2.6, 0)), tb, '#e8e0d0'); sonido.recoger(); }, 1100);
  await ganarExperiencia(xp);
  for (const id of caidosIds) await evento('monstruo_muerto', { id });
  if (mision.objetivo?.tipo === 'matar' && caidosIds.includes(mision.objetivo.id)) await ganar();
  guardarAhora(); hud.actualizar(); H.bloqueado = false;
}
async function ganarExperiencia(xp) {
  if (!xp) return;
  DEF.xp = (DEF.xp || 0) + xp; ui.numero(H.pos.clone().add(new THREE.Vector3(0, 3.6, 0)), `+${xp} exp`, '#b9a2ff');
  const n = nivelDe(DEF.xp);
  if (n > (DEF.nivel || 1)) {
    const antes = DEF.nivel || 1; DEF.oro = estado.oro; DEF.pociones = estado.pociones; prepararSubida(DEF); DEF.nivel = n; aplicarHeroe(DEF); hud.actualizar();
    await espera(900); hud.banner(`¡Nivel ${n}!`, 'heroe'); sonido.victoria(); heroe.hacer('celebrar', 1.4); ui.chispas(H.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), '#ffe08a', 60, 5);
    for (let k = antes + 1; k <= n; k++) await hablar('¡Subes de nivel!', [`${DEF.nombre} llega a nivel ${k}: +1 de cuerpo y te recuperas del todo. ¿Qué más quieres mejorar?`], mejorasDisponibles(DEF).map((o) => [o.texto, () => elegirMejora(DEF, o.id)]));
    DEF.oro = estado.oro; DEF.pociones = estado.pociones; aplicarHeroe(DEF); hud.actualizar();
  }
  guardarAhora(); hud.actualizar();
}

// ---------- el guion de la misión (disparadores) ----------
async function ponerFlag(nombre) { if (flags.has(nombre)) return; flags.add(nombre); J?.anotar('f', nombre); hud.actualizar(); await evento('flag', { nombre }); }
function cumple(d, tipo, x) {
  if (d.cuando !== tipo) return false;
  if (tipo === 'flag') return d.requiere ? d.requiere.every((f) => flags.has(f)) : d.nombre === x.nombre;
  if (tipo === 'monstruo_muerto') return d.id === x.id;
  if (tipo === 'puerta_abierta') return d.puerta === x.id;
  if (tipo === 'region_revelada' || tipo === 'tesoro') return d.region === x.region;
  if (tipo === 'heroe_en_casilla') return d.casilla?.[0] === x.x && d.casilla?.[1] === x.y;
  return false;
}
async function evento(tipo, x) {
  for (const [i, d] of (mision.disparadores || []).entries()) {
    if (hechos.has(i) || !cumple(d, tipo, x)) continue;
    hechos.add(i);
    for (const a of d.acciones || []) await accion(a);
  }
}
async function accion(a) {
  if (a.tipo === 'historia') await hablar(mision.titulo, [a.texto], [], { grave: .9 });
  else if (a.tipo === 'mensaje') { hud.banner(a.texto.length < 30 ? a.texto : '¡Atención!', 'enemigo'); hud.narrar(a.texto); setTimeout(() => hud.narrar(''), 4000); }
  else if (a.tipo === 'flag') await ponerFlag(a.nombre);
  else if (a.tipo === 'aparecer') { for (const mo of a.monstruos || []) { if (!TB.dentro(mo.x, mo.y)) continue; abrirRegion(TB.region(mo.x, mo.y)); const n = nacer(mo, true); n.pj.hacer('rugir', .6); ui.chispas(n.pj.grupo.position.clone().add(new THREE.Vector3(0, 1, 0)), '#c9a2ff', 18, 3); } sonido.circulo(); }
  else if (a.tipo === 'desbloquear') { const p = cripta.puertas.find((x) => x.id === a.puerta); if (p) { p.bloqueada = false; if (p.candado) { p.g.remove(p.candado); p.candado = null; } sonido.abrir(); } }
  else if (a.tipo === 'abrir') { const p = cripta.puertas.find((x) => x.id === a.puerta); if (p) await abrir(p); }
  else if (a.tipo === 'revelar') abrirRegion(a.region);
}
function abrirRegion(r) {
  if (!cripta.revelar(r)) return;
  for (const mo of monstruos) if (mo.region === r && mo.vivo) mo.alerta = true;   // te han oído entrar
  evento('region_revelada', { region: r });
}
async function abrir(p) {
  if (p.abierta) return;
  cripta.abrirPuerta(p); sonido.abrir(); J?.anotar('p', p.id);
  abrirRegion(TB.region(...p.a)); abrirRegion(TB.region(...p.b));
  await evento('puerta_abierta', { id: p.id });
}

// ---------- buscar tesoro, trampas, la escalera ----------
async function buscar(r) {
  buscadas.add(r); J?.anotar('b', r); await heroe.hacer('recoger', .8);
  const t = mision.tesoros?.[r];
  if (t) {
    if (t.oro) estado.oro += t.oro;
    if (t.objeto) estado.pociones++;
    if (t.arma && D.ARMAS[t.arma]) { DEF.arma = t.arma; const s = estadisticas(DEF); estado.ataque = s.ataque; }
    ui.chispas(H.pos.clone().add(new THREE.Vector3(0, 1, 0)), '#ffe08a', 30, 3); if (t.oro) ui.monedas(H.pos.clone().add(new THREE.Vector3(0, 1, 0)), 8); sonido.recoger();
    const extra = [t.oro ? `${t.oro} monedas` : '', t.objeto ? 'una poción' : '', t.arma ? `${D.ARMAS[t.arma]?.nombre || 'un arma'} (${D.ARMAS[t.arma]?.ataque} dados de ataque)` : ''].filter(Boolean).join(', ');
    await hablar('Tesoro', [t.texto + (extra ? ` Te llevas: ${extra}.` : '')]);
    if (t.trampaCofre) { await herido(1, '¡El cofre tenía trampa! Una aguja te pincha el dedo.'); }
    if (t.flag) await ponerFlag(t.flag);
  } else {
    const d = Math.random();
    if (d < .4) { const o = 5 + Math.floor(Math.random() * 16); estado.oro += o; ui.monedas(H.pos.clone().add(new THREE.Vector3(0, 1, 0)), 5); sonido.recoger(); await hablar('Tesoro', [`Entre el polvo encuentras ${o} monedas.`]); }
    else if (d < .55) { estado.pociones++; sonido.recoger(); await hablar('Tesoro', ['¡Un frasco intacto! Una poción más para la bolsa.']); }
    else await hablar('Tesoro', [['Nada. Polvo, telarañas y una cucaracha ofendida.', 'Nada de valor. Alguien llegó antes.', 'Solo encuentras un calcetín. Sin pareja.'][Math.floor(Math.random() * 3)]]);
  }
  await evento('tesoro', { region: r }); guardarAhora(); hud.actualizar();
}
async function herido(n, texto) {
  estado.cuerpo = Math.max(0, estado.cuerpo - n); heroe.herido(); sonido.golpe(); ui.numero(H.pos.clone().add(new THREE.Vector3(0, heroe.altura, 0)), `-${n}`); CAM.temblor = .3; hud.actualizar();
  await hablar('¡Ay!', [texto]);
  if (estado.cuerpo <= 0) await expulsado();
}
function revisarTrampas() {
  const [x, y] = cripta.deMundo(H.pos);
  for (const tr of cripta.trampas) {
    if (tr.disparada || tr.x !== x || tr.y !== y) continue;
    tr.disparada = true; cripta.mostrarTrampa(tr); H.destino = null;
    const n = tr.tipo === 'bloque' ? 2 : 1, txt = { foso: '¡Un foso! Te caes y sales trepando, magullado.', lanza: '¡Clac! Unas lanzas salen del suelo.', bloque: '¡Un bloque de piedra cae del techo!' }[tr.tipo] || '¡Una trampa!';
    if (estado.escamas && n === 1) { hablar('¡Uf!', ['Una trampa… pero tus escamas aguantan el pinchazo.']); return; }
    herido(n, txt);
  }
}
async function ganar() {
  H.bloqueado = true;
  const oro = Math.round((mision.recompensa || 100) / 2); estado.oro += oro;
  if (DEL_PUEBLO) DEF.criptasHechas = [...new Set([...(DEF.criptasHechas || []), SEMILLA])].slice(-40); else if (PID === 'claro') DEF.criptaHecha = true; else { DEF.paradas ||= {}; (DEF.paradas[PID] ||= {}).criptaHecha = true; }
  sonido.victoria(); hud.banner('¡Cripta superada!', 'heroe'); heroe.hacer('celebrar', 1.5); ui.chispas(H.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), '#ffe08a', 70, 6);
  await ganarExperiencia(60);
  await hablar(mision.titulo, [`¡Lo has conseguido! Sales a la luz del atardecer con ${oro} monedas de recompensa y la cabeza bien alta.` + (() => { const t = {}; for (const b of BOTIN_TOTAL) for (const [k, n] of Object.entries(b)) t[k] = (t[k] || 0) + n; const s = textoBotin(t); return s ? ` En la bolsa, para la forja: ${s}.` : ''; })(), DEL_PUEBLO ? 'Morrandar te espera arriba. Marga ya está tirando de la jarra: esta historia se cuenta en la cantina.' : (PAR.cripta.final || `${PAR.guia.nombre} te estará esperando junto al fuego para que se lo cuentes todo.`)]);
  salir();
}
async function expulsado() {
  H.bloqueado = true; $('#fundido').classList.add('ver'); await espera(900); delete DEF.comida; guardarAhora(); guardarHeroe(DEF, true);
  location.href = DEL_PUEBLO ? 'pueblo.html?desde=escala&caido=1' : (PID === 'claro' ? 'claro.html?desde=cripta&caido=1' : `${ESCENARIO}desde=cripta&caido=1`);
}
function salir() { delete DEF.comida; guardarAhora(); guardarHeroe(DEF, true); $('#fundido').classList.add('ver'); setTimeout(() => { location.href = VOLVER; }, 800); }

// ---------- lo que tienes cerca (puertas, buscar, escalera) ----------
let cerca = null;
function cercanos() {
  cerca = null;
  if (H.bloqueado || dlg.actual || combate.activo) { $('#accion').hidden = true; return; }
  const [x, y] = cripta.deMundo(H.pos), r = TB.region(x, y);
  let md = 1.3;
  for (const p of cripta.puertas) { if (p.abierta || p.secreta || !p.centro) continue; const d = Math.hypot(p.centro.x - H.pos.x, p.centro.z - H.pos.z); if (d < md) { md = d; cerca = { tipo: 'puerta', p, verbo: p.bloqueada ? 'Mirar' : 'Abrir', nombre: p.bloqueada ? 'Puerta con cadena' : 'Puerta' }; } }
  if (!cerca && cripta.enEscalera(x, y)) cerca = { tipo: 'escalera', verbo: 'Salir', nombre: 'Escalera' };
  if (!cerca && r !== '.' && !buscadas.has(r) && !monstruos.some((m) => m.vivo && m.region === r)) cerca = { tipo: 'buscar', r, verbo: 'Buscar', nombre: 'tesoro en la sala' };
  const b = $('#accion');
  if (cerca) { b.hidden = false; b.innerHTML = `<kbd>${MOVIL ? '👆' : 'E'}</kbd><span>${cerca.verbo} · ${cerca.nombre}</span>`; } else b.hidden = true;
}
async function interactuar() {
  const c = cerca; if (!c || H.ocupado) return; H.ocupado = true;
  try {
    if (c.tipo === 'puerta') { if (c.p.bloqueada) await hablar('Puerta', ['Una cadena gruesa con un candado que brilla. Por aquí no se pasa… de momento.']); else await abrir(c.p); }
    else if (c.tipo === 'buscar') await buscar(c.r);
    else if (c.tipo === 'escalera') {
      const req = mision.objetivo?.requiere || [], listo = mision.objetivo?.tipo === 'escalera' && req.every((f) => flags.has(f));
      if (listo) await ganar();
      else await hablar('Escalera', [req.length ? 'Aún no tienes lo que viniste a buscar. ¿Subir de todas formas?' : (DEL_PUEBLO ? '¿Volver a Morrandar?' : `¿Volver ${AL_SITIO}?`)], [[DEL_PUEBLO ? 'Subir a Morrandar' : `Subir ${AL_SITIO}`, salir], ['Seguir explorando', null]]);
    }
  } finally { H.ocupado = false; }
}

// ---------- ¿te han visto? ----------
function vigilar() {
  if (combate.activo || H.bloqueado || dlg.actual) return;
  const [hx, hy] = cripta.deMundo(H.pos), hr = TB.region(hx, hy);
  const ven = monstruos.filter((m) => {
    if (!m.vivo || !m.visto || J?.ocupado(m.id)) return false;   // lo que no has visto aún no te ve; y si pelea con otro, está a lo suyo
    const [mx, my] = cripta.deMundo(m.pj.grupo.position), d = Math.abs(mx - hx) + Math.abs(my - hy);
    return (m.region === hr && hr !== '.') || (m.region === '.' && hr === '.' && d <= 5) || (m.alerta && d <= 7);
  });
  if (!ven.length) return;
  const [ax, ay] = cripta.deMundo(ven[0].pj.grupo.position);
  const grupo = monstruos.filter((m) => m.vivo && m.visto && !J?.ocupado(m.id) && (Math.abs(cripta.deMundo(m.pj.grupo.position)[0] - ax) + Math.abs(cripta.deMundo(m.pj.grupo.position)[1] - ay) <= 7));
  empezarCombate(grupo);
}

// ---------- entrada ----------
const teclas = new Set();
addEventListener('keydown', (e) => { if (e.repeat) return; teclas.add(e.key.toLowerCase()); if (e.key.toLowerCase() === 'e' && !dlg.actual) interactuar(); if ((e.key === ' ' || e.key === 'Enter') && dlg.actual) dlg.actual.saltar(); });
addEventListener('keyup', (e) => teclas.delete(e.key.toLowerCase()));
const ray = new THREE.Raycaster(), pt = new THREE.Vector2(), suelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function puntoSuelo(x, y) { pt.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(pt, camara); const v = new THREE.Vector3(); return ray.ray.intersectPlane(suelo, v) ? v : null; }
function tocarEn(x, y) {
  const p = puntoSuelo(x, y); if (!p) return;
  if (combate.activo) return combate.tocar(p);
  if (H.bloqueado || dlg.actual) return;
  // ¿una puerta?
  for (const q of cripta.puertas) if (!q.abierta && q.centro && Math.hypot(q.centro.x - p.x, q.centro.z - p.z) < .9) { H.destino = q.centro.clone(); H.interaccion = q; return; }
  H.destino = p; H.interaccion = null; ui.chispas(p.clone().add(new THREE.Vector3(0, .1, 0)), '#ffffff', 6, 1);
}
const punteros = new Map(); let pellizco = null, joy = null;
lienzo.addEventListener('pointerdown', (e) => { sonido.arrancar(); punteros.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), movido: false }); if (punteros.size === 2) { const [a, b] = [...punteros.values()]; pellizco = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: CAM.dist }; } });
addEventListener('pointermove', (e) => {
  const p = punteros.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (Math.hypot(p.x - p.x0, p.y - p.y0) > 7) p.movido = true;
  if (pellizco && punteros.size === 2) { const [a, b] = [...punteros.values()]; CAM.dist = THREE.MathUtils.clamp(pellizco.dist * pellizco.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), 5, 20); return; }
  if (p.movido) { CAM.yaw -= dx * .006; CAM.pitch = THREE.MathUtils.clamp(CAM.pitch + dy * .005, .35, 1.3); }
});
addEventListener('pointerup', (e) => { const p = punteros.get(e.pointerId); punteros.delete(e.pointerId); if (punteros.size < 2) pellizco = null; if (p && !p.movido && performance.now() - p.t0 < 500 && e.target === lienzo) tocarEn(e.clientX, e.clientY); });
lienzo.addEventListener('wheel', (e) => { CAM.dist = THREE.MathUtils.clamp(CAM.dist * (1 + Math.sign(e.deltaY) * .1), 5, 20); e.preventDefault(); }, { passive: false });
const pad = $('#joystick'), bola = $('#joystick i');
pad.addEventListener('pointerdown', (e) => { sonido.arrancar(); const r = pad.getBoundingClientRect(); joy = { id: e.pointerId, cx: r.left + r.width / 2, cy: r.top + r.height / 2, x: 0, y: 0 }; pad.setPointerCapture(e.pointerId); e.stopPropagation(); });
pad.addEventListener('pointermove', (e) => { if (!joy || e.pointerId !== joy.id) return; let x = (e.clientX - joy.cx) / 45, y = (e.clientY - joy.cy) / 45; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } joy.x = x; joy.y = y; bola.style.transform = `translate(${x * 34}px, ${y * 34}px)`; });
const soltarJoy = () => { joy = null; bola.style.transform = ''; };
pad.addEventListener('pointerup', soltarJoy); pad.addEventListener('pointercancel', soltarJoy);
$('#accion').addEventListener('click', () => { if (!dlg.actual) interactuar(); });

// ---------- moverse ----------
const adelante = new THREE.Vector3(), derecha = new THREE.Vector3(), mov = new THREE.Vector3();
let celdaAnt = '';
function moverHeroe(dt) {
  if (H.bloqueado || dlg.actual || combate.activo) { heroe.vel += (0 - heroe.vel) * Math.min(1, dt * 10); return; }
  adelante.set(-Math.sin(CAM.yaw), 0, -Math.cos(CAM.yaw)); derecha.set(-adelante.z, 0, adelante.x); mov.set(0, 0, 0);
  if (teclas.has('w') || teclas.has('arrowup')) mov.add(adelante);
  if (teclas.has('s') || teclas.has('arrowdown')) mov.sub(adelante);
  if (teclas.has('d') || teclas.has('arrowright')) mov.add(derecha);
  if (teclas.has('a') || teclas.has('arrowleft')) mov.sub(derecha);
  if (joy) mov.addScaledVector(derecha, joy.x).addScaledVector(adelante, -joy.y);
  if (mov.lengthSq() > .01) { H.destino = null; H.interaccion = null; }
  else if (H.destino) {
    mov.set(H.destino.x - H.pos.x, 0, H.destino.z - H.pos.z);
    const lejos = mov.length();
    if (lejos < (H.interaccion ? 1.1 : .25)) { const q = H.interaccion; H.destino = null; H.interaccion = null; mov.set(0, 0, 0); if (q && !q.abierta) { if (q.bloqueada) hablar('Puerta', ['Una cadena gruesa con un candado que brilla. Por aquí no se pasa… de momento.']); else abrir(q); } }
  }
  const l = Math.min(1, mov.length()), corre = teclas.has('shift');
  if (l > .05) {
    mov.normalize(); const v = (corre ? 6.5 : 4.5) * l, antes = H.pos.clone();
    cripta.mover(H.pos, mov.x * v * dt, mov.z * v * dt);
    if (H.destino && antes.distanceTo(H.pos) < v * dt * .2) H.destino = null;   // atascado contra una pared: para
    heroe.mirarA(Math.atan2(mov.x, mov.z));
    H.pasoFase += v * dt; if (H.pasoFase > 1.4) { H.pasoFase = 0; sonido.paso(); }
  }
  heroe.vel += ((l > .05 ? (corre ? 1 : .75) * l : 0) - heroe.vel) * Math.min(1, dt * 10);
  H.pos.y = 0;
  const [cx, cy] = cripta.deMundo(H.pos), k = cx + ',' + cy;
  if (k !== celdaAnt) { celdaAnt = k; revisarTrampas(); evento('heroe_en_casilla', { x: cx, y: cy }); const r = TB.region(cx, cy); if (r !== '.') abrirRegion(r); }
}

// ---------- cámara ----------
function actualizarCamara(dt) {
  let obj;
  if (CAM.modo === 'combate') {
    obj = CAM.foco.clone(); if (CAM.mirar) obj.lerp(CAM.mirar, .45);
    CAM.dist += (CAM.distObj - CAM.dist) * Math.min(1, dt * 2); CAM.pitch += (CAM.pitchObj - CAM.pitch) * Math.min(1, dt * 2);
  } else obj = H.pos.clone().add(new THREE.Vector3(0, 1, 0));
  CAM.objetivo.lerp(obj, Math.min(1, dt * 6));
  const off = new THREE.Vector3(Math.sin(CAM.yaw) * Math.cos(CAM.pitch), Math.sin(CAM.pitch), Math.cos(CAM.yaw) * Math.cos(CAM.pitch)).multiplyScalar(CAM.dist);
  camara.position.copy(CAM.objetivo).add(off);
  if (CAM.temblor > 0) { CAM.temblor -= dt; camara.position.add(new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(CAM.temblor * .5)); }
  camara.lookAt(CAM.objetivo);
}

// ---------- bucle ----------
const reloj = new THREE.Clock(); let t = 0;
function bucle() {
  const dt = Math.min(.05, reloj.getDelta()); t += dt;
  moverHeroe(dt); cripta.explorar(...cripta.deMundo(H.pos)); vigilar(); cercanos();
  cripta.actualizar(t, dt); heroe.animar(dt, t);
  for (const m of monstruos) { if (!m.pj.grupo.parent) continue; m.pj.animar(dt, t); if (m.vivo && m.alerta && !combate.activo) m.pj.mirarA(Math.atan2(H.pos.x - m.pj.grupo.position.x, H.pos.z - m.pj.grupo.position.z)); if (!m.visto && cripta.vista(...cripta.deMundo(m.pj.grupo.position))) m.visto = true; m.pj.grupo.visible = !!(m.visto || !m.vivo); if (m.rotulo) m.rotulo.visible = !!(m.vivo && m.visto); }
  linterna.position.copy(H.pos).add(new THREE.Vector3(0, 2.2, 0));
  J.actualizar(dt, t); if (ganarLuego && !combate.activo && !H.bloqueado && !dlg.actual) { ganarLuego = false; ganar(); }
  combate.actualizar(dt, t); dados.actualizar(dt); ui.actualizar(dt, t);
  actualizarCamara(dt); sonido.actualizar(99);
  if (composer) composer.render(); else render.render(escena, camara);
  CAL.tick();
  requestAnimationFrame(bucle);
}
hud.actualizar(); bucle();
$('#hud').classList.add('ver');
$('#fundido').classList.add('ver'); setTimeout(() => $('#fundido').classList.remove('ver'), 100);
setTimeout(async () => {
  await hablar(mision.titulo, ['Bajas los escalones y el aire se vuelve frío. Huele a tiempo, a cera y a huesos que no se están quietos.', mision.objetivo?.texto || 'Explora la cripta.', ...(DEF.comida ? [`Aún te dura la comida de Marga (${DEF.comida.n}): ${EFECTOS_CRIPTA[DEF.comida.efecto]?.replace('En tu próxima cripta: ', '') || ''}`] : [])], [], { grave: .9 });
  H.bloqueado = false;
}, 900);
lienzo.addEventListener('pointerdown', () => sonido.arrancar(), { once: true });
window.cripta = { J, THREE, dados, camara, escena, estado, H, CAM, mision, monstruos, combate, flags, cripta, ponerFlag, abrir, abrirRegion, interactuar, get cerca() { return cerca; }, get def() { return DEF; } };
