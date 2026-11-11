// =============================================================
//  EL RING DE CHATARRA (ring.html): tu robot contra los cacharros del pueblo
//  Taller: eliges núcleo y te montas el robot con las piezas que tienes.
//  Liga: cinco vecinos con sus robots; ganar a uno abre el siguiente y te llevas
//  una de sus piezas. Pelea por turnos con dados: eliges qué haces (con qué
//  pieza) y a qué pieza del rival apuntas. Si le rompes la cabeza, ganas.
//  Lo tuyo se guarda en el héroe de aventura («robot»).
//  Con la sala (👥): retar a otro (el que pierde se deja una pieza) o ir los dos
//  juntos contra una pareja de la liga. Lo lleva el que reta y el otro lo repite.
// =============================================================
import * as THREE from 'three';
import { toon, lienzo } from './claro-estilo.js';
import { crearDados } from './claro-dados.js';
import { crearUI3D } from './claro-ui3d.js';
import { crearSonido } from './claro-sonido.js';
import { leerLocal, cargarHeroe, guardarHeroe } from './claro-heroes.js';
import { NUCLEOS, PIEZAS, HUECOS_ROBOT, KIT_INICIAL, RIVALES, RUFO_HACE, crearRobot, nivelNucleo, extraNivel, NIVELES_NUCLEO } from './robots.js';

const $ = (s) => document.querySelector(s);
const MOVIL = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const HUECOS = ['cabeza', 'brazoI', 'brazoD', 'piernas'];

// ---------- motor y escena: el ring ----------
const render = new THREE.WebGLRenderer({ canvas: $('#lienzo'), antialias: !MOVIL });
render.setPixelRatio(Math.min(devicePixelRatio, MOVIL ? 1.6 : 2)); render.setSize(innerWidth, innerHeight);
render.shadowMap.enabled = true; render.outputColorSpace = THREE.SRGBColorSpace;
const escena = new THREE.Scene(); escena.background = new THREE.Color('#1c1626'); escena.fog = new THREE.Fog('#1c1626', 18, 40);
const camara = new THREE.PerspectiveCamera(MOVIL ? 58 : 46, innerWidth / innerHeight, .1, 100);
addEventListener('resize', () => { camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); render.setSize(innerWidth, innerHeight); });
escena.add(new THREE.HemisphereLight('#ffe8d0', '#2a2040', 1.4));
const foco = new THREE.SpotLight('#fff2d8', 120, 30, .6, .5, 1.4); foco.position.set(0, 12, 3); foco.castShadow = true; foco.shadow.mapSize.set(1024, 1024); escena.add(foco, foco.target);
for (const [x, c] of [[-7, '#ff6a8a'], [7, '#6ab0ff']]) { const l = new THREE.PointLight(c, 18, 16); l.position.set(x, 4, 2); escena.add(l); }

const RING = 3.4;   // medio lado del ring
{
  const lona = new THREE.Mesh(new THREE.BoxGeometry(RING * 2 + .6, .5, RING * 2 + .6), toon('#3a5a8a')); lona.position.y = -.25; lona.receiveShadow = true; escena.add(lona);
  const centro = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), toon('#f4ecd8')); centro.rotation.x = -Math.PI / 2; centro.position.y = .01; escena.add(centro);
  const faldon = new THREE.Mesh(new THREE.BoxGeometry(RING * 2 + .7, .6, RING * 2 + .7), toon('#8a2a3a')); faldon.position.y = -.75; escena.add(faldon);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), toon('#2a2232')); suelo.rotation.x = -Math.PI / 2; suelo.position.y = -1.05; suelo.receiveShadow = true; escena.add(suelo);
  const esquinas = [[-1, -1, '#d84a4a'], [1, -1, '#4a7ad8'], [1, 1, '#d8d8d8'], [-1, 1, '#d8d8d8']];
  for (const [sx, sz, c] of esquinas) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, 1.6, 10), toon(c)); p.position.set(sx * RING, .8, sz * RING); p.castShadow = true; escena.add(p); }
  for (let k = 0; k < 4; k++) for (const h of [.55, 1.0, 1.45]) {   // las cuerdas
    const [ax, az] = esquinas[k], [bx, bz] = esquinas[(k + 1) % 4], len = Math.hypot(bx - ax, bz - az) * RING;
    if (k === 2) continue;   // la de delante, sin cuerdas: se ve mejor
    const cu = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, len, 6), toon(h === 1.0 ? '#f4ecd8' : '#d84a4a')); cu.rotation.z = Math.PI / 2; if (ax === bx) cu.rotation.set(Math.PI / 2, 0, 0);
    cu.position.set((ax + bx) / 2 * RING, h, (az + bz) / 2 * RING); escena.add(cu);
  }
  // el público: bultitos de colores que botan
  const n = 140, geo = new THREE.CapsuleGeometry(.28, .5, 3, 8), pub = new THREE.InstancedMesh(geo, toon('#ffffff'), n), m4 = new THREE.Matrix4(), cols = ['#e8b04a', '#c85a5a', '#5a8ac8', '#7ac85a', '#c87ab0', '#e8e0d0'];
  const sitios = []; for (let i = 0; i < n; i++) { const a = Math.PI * (.05 + Math.random() * .9) + Math.PI, r = 8 + Math.random() * 6; sitios.push([Math.cos(a) * r, -.4 + (r - 8) * .35, Math.sin(a) * r * .9 - 1, Math.random() * 6]); pub.setColorAt(i, new THREE.Color(cols[i % cols.length])); }
  escena.add(pub); escena.userData.publico = { pub, sitios, m4 };
  // el cartel
  const tx = lienzo(1024, 200, (x, w, h) => { x.fillStyle = '#2a1a2a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ffd27a'; x.lineWidth = 12; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = '#ffd27a'; x.font = 'bold 96px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('EL RING DE CHATARRA', w / 2, h / 2 + 4); });
  const cartel = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.56), new THREE.MeshBasicMaterial({ map: tx })); cartel.position.set(0, 6.2, -7); escena.add(cartel);
}
const ui = crearUI3D(escena, camara);
const sonido = crearSonido({ entorno: 'cine' });
const dados = crearDados(escena, { alSonar: (f) => sonido.dado?.(f), escala: MOVIL ? 1.3 : 1 });
addEventListener('pointerdown', () => sonido.arrancar?.(), { once: true });

// ---------- tu robot (en el héroe de aventura) ----------
let DEF = leerLocal();
const ROBOT = () => DEF?.robot;
function guardar() { if (DEF) guardarHeroe(DEF); publicarRobot(); }
function nuevoRobot(nucleo) {
  DEF.robot = { nucleo, nombre: 'Chatarrín', xp: 0, piezas: [...KIT_INICIAL], equipo: { cabeza: 'cab_lata', brazoI: 'br_puno', brazoD: 'br_canon', piernas: 'pi_patas' }, liga: 0, victorias: 0 };
  guardar();
}
// Lo que los demás ven de tu robot (y con lo que pelea en su pantalla)
const miEspec = () => { const R = ROBOT(); return { nombre: R.nombre, piloto: DEF.nombre || '', nucleo: R.nucleo, nivel: nivelNucleo(R.xp), equipo: { ...R.equipo }, piezas: [...R.piezas] }; };
const especRival = (i) => { const r = RIVALES[i]; return { nombre: r.robot, piloto: r.quien, nucleo: r.nucleo, nivel: r.nivel, equipo: { ...r.equipo }, frase: r.frase }; };
// En pareja contra la liga: el rival que elegís y el de al lado (con Pip, Mordo)
const pareja = (i) => (i === 0 ? 1 : i - 1);

// ---------- la sala: pelear con los demás (en duelo o juntos contra la liga) ----------
let SALA = null, GENTE = {};
const MI = () => SALA?.yo.id || 'yo';
const leerJSON = (t) => { try { return JSON.parse(t || 'null'); } catch { return null; } };
function publicarRobot() { if (SALA && DEF?.robot) SALA.cambiar({ robot: JSON.stringify(miEspec()) }); }
// Los de la sala que están ahora en el ring y ya tienen robot
const enElRing = () => Object.values(GENTE).filter((g) => g.id !== SALA?.yo.id && g.donde === 'ring' && g.online !== false && leerJSON(g.robot));

// ---------- pantallas ----------
const panel = $('#panel');
let pantalla = '';
const mostrar = (html, cual = '') => { panel.innerHTML = html; panel.hidden = false; pantalla = cual; };
const ocultar = () => { panel.hidden = true; pantalla = ''; };
let enEscena = {};
function limpiarRobots() { for (const r of Object.values(enEscena)) r?.desechar(escena); enEscena = {}; }
function ponerRobots(yo) {
  limpiarRobots();
  if (yo) { const r = crearRobot(yo); r.grupo.position.set(MOVIL ? 0 : 1.6, 0, 0); r.grupo.rotation.y = .3; escena.add(r.grupo); enEscena.yo = r; }
}
const vidaPieza = (id, nucleo) => (PIEZAS[id]?.vida || 1) + (nucleo === 'tortuga' ? 1 : 0);

function pantallaNucleo() {
  ponerRobots(null); modoCamara = 'taller';
  mostrar(`<h2>Tu primer robot</h2><p>Rufo ha montado un ring en el pueblo y todo el mundo se ha hecho un cacharro. Elige el <b>núcleo</b> de tu robot: es su alma, y crece con cada pelea.</p>
    <div class="cartas">${Object.entries(NUCLEOS).map(([id, N]) => `<button data-n="${id}"><span>${N.e}</span><b>${N.n}</b><small>${N.t}</small></button>`).join('')}</div>`, 'nucleo');
  panel.querySelectorAll('[data-n]').forEach((b) => b.onclick = () => { nuevoRobot(b.dataset.n); pantallaTaller(); });
}
function pantallaTaller() {
  const R = ROBOT(); modoCamara = 'taller'; ponerRobots({ nucleo: R.nucleo, equipo: R.equipo });
  const N = NUCLEOS[R.nucleo], nv = nivelNucleo(R.xp), sig = NIVELES_NUCLEO[nv];
  const fila = (hueco) => {
    const H_ = HUECOS_ROBOT[hueco], opciones = R.piezas.filter((id) => PIEZAS[id]?.hueco === H_.tipo);
    return `<div class="hueco"><b>${H_.e} ${H_.n}</b><div class="piezas">${opciones.map((id) => { const P = PIEZAS[id]; return `<button class="${R.equipo[hueco] === id ? 'puesta' : ''}" data-h="${hueco}" data-p="${id}">${P.n}<small>${textoPieza(P, R.nucleo)}</small></button>`; }).join('')}</div></div>`;
  };
  mostrar(`<h2>${N.e} ${esc(R.nombre)} <small>núcleo ${N.n.toLowerCase()} · nivel ${nv}${sig ? ` · ${R.xp}/${sig} exp` : ''}</small></h2>
    <p class="nota">${N.t}${extraNivel(nv) ? ` Por su nivel, +${extraNivel(nv)} ${extraNivel(nv) === 1 ? 'dado' : 'dados'} en todo.` : ' En el nivel 4 y en el 8, un dado más en todo.'}</p>
    ${HUECOS.map(fila).join('')}
    <div class="fila-botones"><button id="bNombre">✏️ Nombre</button><button id="bLiga" class="grande">🥊 Al ring</button></div>
    ${bancoRufo()}`, 'taller');
  panel.querySelectorAll('[data-hacer]').forEach((b) => b.onclick = () => hacerPieza(b.dataset.hacer));
  panel.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { R.equipo[b.dataset.h] = b.dataset.p; guardar(); sonido.recoger?.(); pantallaTaller(); });
  $('#bNombre').onclick = () => { const n = prompt('¿Cómo se llama tu robot?', R.nombre); if (n) { R.nombre = n.replace(/[<>&"'`]/g, '').slice(0, 18) || R.nombre; guardar(); pantallaTaller(); } };
  $('#bLiga').onclick = pantallaLiga;
}
// El banco de Rufo: piezas que no lleva nadie de la liga, hechas con la chatarra de las criptas
const chatarra = () => DEF.materiales?.chatarra || 0;
function bancoRufo() {
  const R = ROBOT();
  return `<h3 class="sala">🛠️ El banco de Rufo</h3>
    <p class="nota">«Dame chatarra y te hago cosas que no tiene nadie en el pueblo.» La chatarra ⚙️ la sueltan los bichos de las criptas y del claro (los jefes, siempre). Tienes ⚙️ ${chatarra()} y 🪙 ${DEF.oro || 0}.</p>
    <div class="piezas">${Object.entries(RUFO_HACE).map(([id, c]) => { const P = PIEZAS[id], tengo = R.piezas.includes(id), puedo = chatarra() >= c.chatarra && (DEF.oro || 0) >= c.oro;
      return `<button data-hacer="${id}" ${tengo || !puedo ? 'disabled' : ''}>${HUECOS_ROBOT[P.hueco === 'brazo' ? 'brazoD' : P.hueco].e} ${P.n}<small>${textoPieza(P, R.nucleo)}</small><small>${tengo ? '✓ Ya la tienes' : `⚙️ ${c.chatarra} · 🪙 ${c.oro}`}</small></button>`; }).join('')}</div>`;
}
function hacerPieza(id) {
  const R = ROBOT(), c = RUFO_HACE[id];
  if (!c || R.piezas.includes(id) || chatarra() < c.chatarra || (DEF.oro || 0) < c.oro) return;
  DEF.materiales.chatarra -= c.chatarra; DEF.oro -= c.oro; R.piezas.push(id);
  guardar(); sonido.victoria?.();
  pantallaTaller(); narrarUn(`Rufo: «¡${PIEZAS[id].n}! Recién salida del horno. Bueno, del cubo.»`);
}
function textoPieza(P, nucleo) {
  const v = `❤ ${P.vida + (nucleo === 'tortuga' ? 1 : 0)}`;
  if (P.hueco === 'piernas') return `${v} · esquiva ${P.def} · rapidez ${P.vel}`;
  if (!P.acc) return `${v} · aguanta más`;
  const a = P.acc, q = { golpe: `${a.v} dados de golpe${a.certero ? ', no se esquiva' : ''}`, disparo: `${a.v} dados de disparo${a.certero ? ', no se esquiva' : ''}`, cura: `repara ${a.v}`, escudo: `para ${a.v}`, apuntar: `+${a.v} dados al siguiente` }[a.tipo];
  return `${v} · ${a.e} ${q}${a.usos ? ` (${a.usos} veces)` : ''}${a.piernas ? ', +1 a las piernas' : ''}`;
}
const esc = (t) => String(t || '').replace(/[<>&"]/g, '');
// Los de tu sala que están en el ring: retarles o ir juntos
function seccionSala() {
  if (!SALA) return `<p class="nota">👥 Para pelear con otro (a tortas o juntos contra la liga), abrid la misma sala con el botón 👥 y entrad los dos al ring.</p>`;
  const otros = enElRing();
  if (!otros.length) return `<p class="nota">👥 Sala ${SALA.codigo}: cuando otro de la sala entre al ring con su robot, saldrá aquí para retarle o pelear juntos.</p>`;
  return `<h3 class="sala">👥 En el ring contigo</h3>${otros.map((g) => { const r = leerJSON(g.robot), N = NUCLEOS[r.nucleo] || NUCLEOS.escarabajo; return `<div class="otro"><b>${N.e} ${esc(r.nombre)} <small>de ${esc(r.piloto || g.nombre)} · nivel ${r.nivel}</small></b>
    <div class="fila-botones"><button data-reto="${g.id}">🥊 Retarle <small>os jugáis una pieza</small></button><button data-juntos="${g.id}">🤝 Juntos <small>contra la liga</small></button></div></div>`; }).join('')}`;
}
let firmaSala = '';
const firmaDeSala = () => (SALA ? SALA.codigo + enElRing().map((g) => g.id + g.robot).join('|') : '');
function pantallaLiga() {
  const R = ROBOT(); modoCamara = 'taller'; ponerRobots({ nucleo: R.nucleo, equipo: R.equipo });
  firmaSala = firmaDeSala();
  mostrar(`<h2>🥊 La liga del ring</h2><p class="nota">Gana a uno y se abre el siguiente. Al ganar te llevas una de sus piezas (si ya las tienes todas, monedas).</p>
    <div class="liga">${RIVALES.map((r, i) => { const abierto = i <= (R.liga || 0), N = NUCLEOS[r.nucleo]; return `<button data-r="${i}" ${abierto ? '' : 'disabled'}><span>${abierto ? N.e : '🔒'}</span><b>${r.quien} y ${r.robot}</b><small>${abierto ? `nivel ${r.nivel} · ${Object.values(r.equipo).map((id) => PIEZAS[id].n).join(', ')}${i < (R.liga || 0) ? ' · ✓ vencido' : ''}` : 'Gana al anterior'}</small></button>`; }).join('')}</div>
    ${seccionSala()}
    <div class="fila-botones"><button id="bTaller">🔧 Al taller</button></div>`, 'liga');
  panel.querySelectorAll('[data-r]').forEach((b) => b.onclick = () => empezarPelea(+b.dataset.r));
  panel.querySelectorAll('[data-reto]').forEach((b) => b.onclick = () => retar(b.dataset.reto, 'duelo'));
  panel.querySelectorAll('[data-juntos]').forEach((b) => b.onclick = () => elegirRivalJuntos(b.dataset.juntos));
  $('#bTaller').onclick = pantallaTaller;
}
function elegirRivalJuntos(id) {
  const R = ROBOT(), g = GENTE[id], suyo = leerJSON(g?.robot);
  mostrar(`<h2>🤝 Juntos contra la liga</h2><p class="nota">${esc(suyo?.nombre || 'Su robot')} y ${esc(R.nombre)} contra dos de la liga a la vez. Elegid contra quién (los que tengas abiertos tú). Cada uno se lleva su premio.</p>
    <div class="liga">${RIVALES.map((r, i) => { const abierto = i <= (R.liga || 0), o = RIVALES[pareja(i)]; return `<button data-r="${i}" ${abierto ? '' : 'disabled'}><span>${abierto ? NUCLEOS[r.nucleo].e + NUCLEOS[o.nucleo].e : '🔒'}</span><b>${r.robot} y ${o.robot}</b><small>${abierto ? `de ${r.quien} y ${o.quien} · nivel ${r.nivel} y ${o.nivel}` : 'Gana antes al anterior tú solo'}</small></button>`; }).join('')}</div>
    <div class="fila-botones"><button id="bVolver">← Volver</button></div>`, 'juntos');
  panel.querySelectorAll('[data-r]').forEach((b) => b.onclick = () => retar(id, 'juntos', +b.dataset.r));
  $('#bVolver').onclick = pantallaLiga;
}

// ---------- retos: uno propone, el otro acepta, y el que propuso lleva la pelea ----------
let ESPERA = null, retoVisto = 0, retoDe = null, ACEPTADO = null;
function retar(id, tipo, rival = 0) {
  if (!SALA) return;
  const g = GENTE[id], n = Date.now(); ESPERA = { para: id, n, tipo, rival };
  SALA.cambiar({ ringReto: JSON.stringify({ para: id, tipo, rival, n }) });
  const quien = esc(leerJSON(g?.robot)?.piloto || g?.nombre || 'el otro');
  mostrar(`<h2>${tipo === 'duelo' ? '🥊 Reto enviado' : '🤝 Invitación enviada'}</h2><p>Esperando a que ${quien} diga que sí…</p><div class="fila-botones"><button id="bCancelar">Cancelar</button></div>`, 'espera');
  $('#bCancelar').onclick = () => { ESPERA = null; SALA?.cambiar({ ringReto: null }); pantallaLiga(); };
  setTimeout(() => { if (ESPERA?.n === n) { ESPERA = null; SALA?.cambiar({ ringReto: null }); pantallaLiga(); narrarUn(`${quien} no contesta. Igual está en el baño.`); } }, 60000);
}
const avisoReto = $('#reto');
function mostrarReto(id, g, reto) {
  const r = leerJSON(g.robot), quien = esc(r?.piloto || g.nombre || 'Alguien');
  const texto = reto.tipo === 'duelo'
    ? `<b>${quien}</b> te reta a un duelo con ${esc(r?.nombre || 'su robot')}. <small>Os jugáis una pieza: el que pierde se la deja al otro (las de serie no se pierden).</small>`
    : `<b>${quien}</b> quiere ir juntos contra <b>${RIVALES[reto.rival]?.robot} y ${RIVALES[pareja(reto.rival)]?.robot}</b>. <small>Cada uno se lleva su premio.</small>`;
  avisoReto.innerHTML = `<p>${texto}</p><div class="fila-botones"><button id="bSi" class="grande">${reto.tipo === 'duelo' ? '🥊 ¡Acepto!' : '🤝 ¡Vamos!'}</button><button id="bNo">Ahora no</button></div>`;
  avisoReto.hidden = false; sonido.circulo?.();
  $('#bSi').onclick = () => { avisoReto.hidden = true; if (peleando || !ROBOT()) return; ACEPTADO = { de: id, n: reto.n }; publicarRobot(); SALA?.cambiar({ ringSi: reto.n }); mostrar('<h2>¡Al ring!</h2><p>Preparando la pelea…</p>', 'espera'); setTimeout(() => { if (ACEPTADO?.n === reto.n && !peleando) { ACEPTADO = null; pantallaLiga(); } }, 20000); };
  $('#bNo').onclick = () => { avisoReto.hidden = true; SALA?.cambiar({ ringNo: reto.n }); };
  setTimeout(() => { if (retoVisto === reto.n) avisoReto.hidden = true; }, 55000);
}
function alGente(gente) {
  GENTE = gente || {};
  const yo = SALA?.yo.id;
  for (const [id, g] of Object.entries(GENTE)) {
    if (id === yo) continue;
    // un reto para mí
    const reto = leerJSON(g.ringReto);
    if (reto && reto.para === yo && reto.n > retoVisto && Date.now() - reto.n < 60000) {
      retoVisto = reto.n; retoDe = id;
      if (peleando || ESPERA || !ROBOT()) SALA.cambiar({ ringNo: reto.n }); else mostrarReto(id, g, reto);
    }
    if (id === retoDe && !avisoReto.hidden && reto?.n !== retoVisto) avisoReto.hidden = true;   // lo ha retirado
    // mi reto: ¿ha dicho que sí?
    if (ESPERA && id === ESPERA.para) {
      if (g.ringSi === ESPERA.n) { const e = ESPERA; ESPERA = null; arrancarComoAnfitrion(id, g, e); }
      else if (g.ringNo === ESPERA.n) { ESPERA = null; pantallaLiga(); narrarUn(`${leerJSON(g.robot)?.piloto || g.nombre} dice que ahora no.`); }
    }
    // la pelea que he aceptado: la lleva el otro
    if (ACEPTADO && id === ACEPTADO.de && !peleando) { const ring = leerJSON(g.ring); if (ring?.id === ACEPTADO.n) { ACEPTADO = null; unirme(id, ring); } }
    if (PELEA && !PELEA.anfitrion && id === PELEA.de) { const ring = leerJSON(g.ring); if (ring?.id === PELEA.id) encolar(ring); }
  }
  if (pantalla === 'liga' && firmaDeSala() !== firmaSala) pantallaLiga();
}
let tNarrarUn = null;
function narrarUn(t) { narrar(t); clearTimeout(tNarrarUn); tNarrarUn = setTimeout(() => { if (!peleando) narrar(''); }, 4000); }

// ---------- la pelea (tú solo, en pareja o a tortas entre vosotros) ----------
// Quien lleva la pelea (el que reta, o tú si vas solo) decide el orden, los dados y lo que hacen
// los de la liga, y lo apunta todo en una lista de sucesos («ev»). El otro la recibe por la sala
// y la repite en su pantalla (los mismos dados), y cuando le toca manda lo que elige.
let modoCamara = 'taller', peleando = false, PELEA = null;
function luchador(spec, i, lado, ctrl) {
  const piezas = {};
  for (const h of HUECOS) { const id = spec.equipo[h]; piezas[h] = { id, P: PIEZAS[id], vida: vidaPieza(id, spec.nucleo), max: vidaPieza(id, spec.nucleo) }; }
  const usos = {}; for (const h of HUECOS) if (piezas[h].P.acc?.usos) usos[h] = piezas[h].P.acc.usos;
  return { ...spec, piezas, usos, extra: extraNivel(spec.nivel), escudo: 0, apunta: 0, i, lado, ctrl, robot: null };
}
const viva = (L, h) => L.piezas[h].vida > 0;
const fuera = (L) => !viva(L, 'cabeza');
const velocidad = (L) => (viva(L, 'piernas') ? L.piezas.piernas.P.vel : 0);
const esquiva = (L) => (viva(L, 'piernas') ? L.piezas.piernas.P.def : 0);
const enemigos = (L) => PELEA.F.filter((x) => x.lado !== L.lado && !fuera(x));
const CABEZAZO = { tipo: 'golpe', n: 'Cabezazo', e: '🤕', v: 1 };
function acciones(L) {
  const l = [];
  for (const h of ['brazoD', 'brazoI', 'cabeza']) { const a = L.piezas[h].P.acc; if (a && viva(L, h) && (L.usos[h] ?? 1) > 0) l.push({ h, a }); }
  if (!l.some((x) => ['golpe', 'disparo'].includes(x.a.tipo))) l.push({ h: null, a: CABEZAZO });   // sin armas, a cabezazos
  return l;
}
const buscarAccion = (L, h) => acciones(L).find((x) => (x.h ?? '-') === (h ?? '-'));
const esApoyo = (a) => ['cura', 'escudo', 'apuntar'].includes(a.tipo);
function dadosDe(A, a, objetivo) {
  let n = a.v + A.extra + (A.nucleo === 'escarabajo' && a.tipo === 'disparo' ? 1 : 0) + (A.nucleo === 'mantis' && a.tipo === 'golpe' ? 1 : 0) + A.apunta;
  if (objetivo === 'cabeza' && !a.certero && A.nucleo !== 'buho' && !A.apunta) n -= 1;   // la cabeza es pequeña: cuesta más darle
  return Math.max(1, n);
}
const CARAS = ['calavera', 'calavera', 'calavera', 'escudoB', 'escudoB', 'escudoN'];   // las del dado de combate
const caras = (n) => Array.from({ length: n }, () => CARAS[Math.floor(Math.random() * CARAS.length)]);
const centroMesa = () => new THREE.Vector3(0, .1, 1.6);

function montarPelea({ id, tipo, rival = 0, F, anfitrion, de }) {
  const yo = MI();
  const Fs = F.map((x, i) => luchador(x.spec, i, x.lado, x.ctrl));
  PELEA = { id, tipo, rival, desc: F, F: Fs, ev: [], anfitrion, de, yo, miLado: Fs.find((L) => L.ctrl === yo)?.lado ?? 0, turno: -1, cola: Promise.resolve() };
  ocultar(); avisoReto.hidden = true; limpiarRobots();
  // cada bando a un lado (el tuyo, a la izquierda); de dos en dos, uno delante y otro detrás
  for (const L of Fs) {
    const mios = Fs.filter((x) => x.lado === L.lado), j = mios.indexOf(L), izq = L.lado === PELEA.miLado;
    const r = crearRobot({ nucleo: L.nucleo, equipo: L.equipo });
    r.grupo.position.set((izq ? -1 : 1) * (mios.length > 1 ? (j ? 2.5 : 1.5) : 1.7), 0, mios.length > 1 ? (j ? .9 : -1.3) : 0);   // el de delante, más abierto: no tapa al de detrás
    r.grupo.rotation.y = izq ? Math.PI / 2 : -Math.PI / 2; escena.add(r.grupo); L.robot = r; enEscena['f' + L.i] = r;
  }
  modoCamara = 'pelea'; peleando = true; pintarBarras(); $('#barras').hidden = false;
}
async function presentar() {
  const P = PELEA; sonido.circulo?.(); sonido.musica?.('combate');
  if (P.tipo === 'duelo') { const [a, b] = P.F; narrar(`¡Duelo! ${a.nombre} contra ${b.nombre}. El que pierda se deja una pieza.`); await espera(2600); }
  else {
    const npc = P.F.filter((L) => L.ctrl === 'npc');
    for (const L of npc) { narrar(`${L.piloto}: «${L.frase}»`); await espera(npc.length > 1 ? 2000 : 2200); }
  }
  narrar('¡Ding, ding! ¡Que empiece el combate!'); ui.chispas(new THREE.Vector3(0, 1.5, 0), '#ffd27a', 40, 5); await espera(1000);
}
// Tú solo contra uno de la liga
async function empezarPelea(r) {
  montarPelea({ id: Date.now(), tipo: 'solo', rival: r, anfitrion: true, F: [{ spec: miEspec(), lado: 0, ctrl: MI() }, { spec: especRival(r), lado: 1, ctrl: 'npc' }] });
  await presentar(); dirigir();
}
// El otro ha aceptado mi reto: monto la pelea y la llevo yo
async function arrancarComoAnfitrion(id, g, e) {
  const suyo = leerJSON(g.robot); if (!suyo || !ROBOT()) return pantallaLiga();
  const F = e.tipo === 'duelo'
    ? [{ spec: miEspec(), lado: 0, ctrl: MI() }, { spec: suyo, lado: 1, ctrl: id }]
    : [{ spec: miEspec(), lado: 0, ctrl: MI() }, { spec: suyo, lado: 0, ctrl: id }, { spec: especRival(e.rival), lado: 1, ctrl: 'npc' }, { spec: especRival(pareja(e.rival)), lado: 1, ctrl: 'npc' }];
  montarPelea({ id: e.n, tipo: e.tipo, rival: e.rival, F, anfitrion: true, de: MI() });
  publicarPelea(); await presentar(); dirigir();
}
// He aceptado: me uno a la pelea que lleva el otro
async function unirme(id, ring) {
  montarPelea({ id: ring.id, tipo: ring.tipo, rival: ring.rival, F: ring.F, anfitrion: false, de: id });
  const P = PELEA; P.tVisto = Date.now();
  P.cola = presentar(); encolar(ring);
}
function encolar(ring) {
  const P = PELEA; P.tVisto = Date.now();
  for (let k = P.ev.length; k < (ring.ev || []).length; k++) {
    const ev = ring.ev[k]; P.ev.push(ev);
    P.cola = P.cola.then(() => (PELEA === P ? repetir(ev) : null)).catch((e) => console.error(e));
  }
}
// En la pantalla del invitado: repite lo que ha pasado y, si le toca, pregunta qué hace
async function repetir(ev) {
  await aplicar(ev);
  const P = PELEA;
  if (ev.k === 'turno' && P.F[ev.f].ctrl === P.yo) elegir(P.F[ev.f]).then((d) => { if (PELEA === P && P.ev.length === ev.n + 1) { SALA?.cambiar({ ringOrden: JSON.stringify({ id: P.id, n: ev.n, ...d }) }); narrar('…'); } });
}
function publicarPelea() { const P = PELEA; if (!SALA || P.tipo === 'solo' || !P.anfitrion) return; SALA.cambiar({ ring: JSON.stringify({ id: P.id, tipo: P.tipo, rival: P.rival, F: P.desc, ev: P.ev }) }); }
async function emitir(ev) { const P = PELEA; ev.n = P.ev.length; P.ev.push(ev); publicarPelea(); await aplicar(ev); }
const ladoGanador = () => { for (const l of [0, 1]) if (PELEA.F.filter((L) => L.lado === l).every(fuera)) return 1 - l; return null; };

// El que lleva la pelea: ronda a ronda, cada uno en su turno (los más rápidos, antes)
async function dirigir() {
  const P = PELEA;
  while (PELEA === P && !P.acabada) {
    const orden = P.F.filter((L) => !fuera(L)).map((L) => [L.i, velocidad(L) + Math.random() * 6]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    for (const k of orden) {
      if (PELEA !== P || P.acabada) return;
      const L = P.F[k]; if (fuera(L) || !enemigos(L).length) continue;
      await emitir({ k: 'turno', f: k });
      const d = await decidir(L);
      if (PELEA !== P || P.acabada) return;
      if (d?.abandona) { await emitir({ k: 'fin', anulada: true, quien: k }); return; }
      await emitir(construir(L, d));
      const gana = ladoGanador();
      if (gana != null) { await emitir(finDe(gana)); return; }
    }
  }
}
function decidir(L) {
  if (L.ctrl === 'npc') return espera(700).then(() => decisionIA(L));
  if (L.ctrl === PELEA.yo) return elegir(L);
  return ordenRemota(L);
}
// Lo que manda el otro desde su tablet (si tarda mucho, su robot actúa solo; si se ha ido, se suspende)
function ordenRemota(L) {
  const P = PELEA, n = P.ev.length - 1, t0 = Date.now(); let tFuera = 0, avisado = false;
  return new Promise((ok) => {
    const mirar = () => {
      if (PELEA !== P || P.acabada) return ok(null);
      const g = GENTE[L.ctrl], o = leerJSON(g?.ringOrden);
      if (o && o.id === P.id && o.n === n) return ok(validar(L, o) || decisionIA(L));
      if (!g || g.online === false) { tFuera ||= Date.now(); if (Date.now() - tFuera > 25000) return ok({ abandona: true }); } else tFuera = 0;
      if (!avisado && Date.now() - t0 > 4000) { avisado = true; narrar(`Turno de ${L.nombre}: ${L.piloto || 'el otro'} está pensando…`); }
      if (Date.now() - t0 > 75000) { narrar(`${L.piloto || 'El otro'} se ha quedado pensando: ${L.nombre} actúa solo.`); return ok(decisionIA(L)); }
      setTimeout(mirar, 300);
    };
    mirar();
  });
}
function validar(L, o) {
  const x = buscarAccion(L, o.h); if (!x) return null;
  if (esApoyo(x.a)) return { h: x.h };
  const D = PELEA.F[o.d]; if (!D || D.lado === L.lado || fuera(D) || !HUECOS.includes(o.obj) || !viva(D, o.obj)) return null;
  return { h: x.h, d: D.i, obj: o.obj };
}
// La decisión ya tomada, con sus dados echados (así las dos pantallas ven lo mismo)
function construir(A, d) {
  const x = buscarAccion(A, d?.h) || acciones(A)[0];
  if (esApoyo(x.a)) return { k: 'apoyo', f: A.i, h: x.h };
  let D = PELEA.F[d?.d]; if (!D || fuera(D) || D.lado === A.lado) D = enemigos(A)[0];
  const obj = viva(D, d?.obj) ? d.obj : 'cabeza';
  return { k: 'ataque', f: A.i, h: x.h, d: D.i, obj, r: caras(dadosDe(A, x.a, obj)), r2: caras(esquiva(D)) };
}
function finDe(gana) {
  const ev = { k: 'fin', gana };
  if (PELEA.tipo !== 'duelo') return ev;
  // el que gana se lleva una pieza del que pierde: mejor una de las que llevaba puestas y que él no tenga
  const W = PELEA.F.find((L) => L.lado === gana), Lo = PELEA.F.find((L) => L.lado !== gana);
  const suyas = (PELEA.desc[Lo.i].spec.piezas || Object.values(Lo.equipo)).filter((id) => PIEZAS[id] && !KIT_INICIAL.includes(id));
  const tengo = PELEA.desc[W.i].spec.piezas || [], puestas = Object.values(Lo.equipo);
  const nuevas = suyas.filter((id) => !tengo.includes(id)), l = [nuevas.filter((id) => puestas.includes(id)), nuevas, suyas].find((x) => x.length);
  if (l) { ev.pieza = l[Math.floor(Math.random() * l.length)]; if (!nuevas.length) ev.monedas = 25; }
  ev.de = Lo.ctrl; ev.para = W.ctrl;
  return ev;
}
function decisionIA(A) {
  const l = acciones(A), curas = l.find((x) => x.a.tipo === 'cura'), herida = HUECOS.find((h) => viva(A, h) && A.piezas[h].vida <= A.piezas[h].max * .4);
  if (curas && herida) return { h: curas.h };
  const esc_ = l.find((x) => x.a.tipo === 'escudo'); if (esc_ && !A.escudo && A.piezas.cabeza.vida <= A.piezas.cabeza.max * .5 && Math.random() < .5) return { h: esc_.h };
  const ap = l.find((x) => x.a.tipo === 'apuntar'); if (ap && !A.apunta && Math.random() < .35) return { h: ap.h };
  const ataques = l.filter((x) => ['golpe', 'disparo'].includes(x.a.tipo)).sort((x, y) => y.a.v - x.a.v);
  const acc = ataques[Math.random() < .7 ? 0 : Math.floor(Math.random() * ataques.length)];
  // a por el que tenga la cabeza más tocada (y a veces, a por cualquiera)
  const ene = enemigos(A).sort((x, y) => x.piezas.cabeza.vida - y.piezas.cabeza.vida), D = Math.random() < .7 ? ene[0] : ene[Math.floor(Math.random() * ene.length)];
  // a por la cabeza si está tocada; si no, a desarmarte (el brazo que más pega); y a veces, lo que le da la gana
  const vivas = HUECOS.filter((h) => viva(D, h));
  let obj = D.piezas.cabeza.vida <= dadosDe(A, acc.a, 'cabeza') * .5 ? 'cabeza' : ['brazoD', 'brazoI'].filter((h) => viva(D, h) && D.piezas[h].P.acc).sort((x, y) => (D.piezas[y].P.acc?.v || 0) - (D.piezas[x].P.acc?.v || 0))[0] || 'cabeza';
  if (Math.random() < .25) obj = vivas[Math.floor(Math.random() * vivas.length)];
  return { h: acc.h, d: D.i, obj };
}

function narrar(t) { const n = $('#narrar'); n.textContent = t; n.hidden = !t; }
function pintarBarras() {
  const P = PELEA; if (!P) return;
  const bloque = (L) => `<div class="luchador ${P.turno === L.i ? 'activo' : ''} ${fuera(L) ? 'fuera' : ''}"><b>${NUCLEOS[L.nucleo].e} ${esc(L.nombre)} <small>nv ${L.nivel}${L.piloto ? ` · ${esc(L.piloto)}` : ''}</small></b>${HUECOS.map((h) => { const p = L.piezas[h], pc = Math.max(0, p.vida / p.max * 100); return `<div class="barra ${p.vida <= 0 ? 'rota' : ''}"><span>${HUECOS_ROBOT[h].e}</span><i style="--p:${pc}%"></i><em>${p.vida > 0 ? p.vida : '✖'}</em></div>`; }).join('')}${L.escudo ? '<div class="nota">🛡️ cubierto</div>' : ''}${L.apunta ? '<div class="nota">🎯 apuntando</div>' : ''}</div>`;
  $('#yo').innerHTML = P.F.filter((L) => L.lado === P.miLado).map(bloque).join('');
  $('#el').innerHTML = P.F.filter((L) => L.lado !== P.miLado).map(bloque).join('');
}
const botones = (lista) => new Promise((ok) => {
  const b = $('#botones'); b.innerHTML = ''; b.hidden = false;
  for (const x of lista) { const e = document.createElement('button'); e.disabled = !!x.no; e.innerHTML = `<span>${x.e}</span>${x.t}`; e.onclick = () => { b.hidden = true; subirNarrar(); sonido.dado?.(.3); ok(x.v); }; b.appendChild(e); }
  subirNarrar();
});
// La frase siempre por encima de los botones (en el móvil ocupan dos o tres filas)
function subirNarrar() { const b = $('#botones'); $('#narrar').style.bottom = b.hidden ? '' : `${b.offsetHeight + 18}px`; }
// Tu turno: qué haces, a quién (si hay más de uno) y a qué pieza
async function elegir(A) {
  while (true) {
    narrar(`Tu turno (${A.nombre}): ¿qué haces?`);
    const acc = await botones(acciones(A).map((x) => ({ e: x.a.e, t: `${x.a.n}${A.usos[x.h] != null ? ` (${A.usos[x.h]})` : ''}`, v: x })));
    if (esApoyo(acc.a)) return { h: acc.h };
    const ene = enemigos(A);
    let D = ene[0];
    if (ene.length > 1) {
      narrar('¿A quién?');
      D = await botones([...ene.map((E) => ({ e: NUCLEOS[E.nucleo].e, t: esc(E.nombre), v: E })), { e: '←', t: 'Otra cosa', v: null }]);
      if (!D) continue;
    }
    narrar('¿A qué pieza le apuntas?');
    const obj = await botones([...HUECOS.filter((h) => viva(D, h)).map((h) => ({ e: HUECOS_ROBOT[h].e, t: `${HUECOS_ROBOT[h].n} (${D.piezas[h].vida}) · ${dadosDe(A, acc.a, h)} 🎲`, v: h })), { e: '←', t: 'Otra cosa', v: null }]);
    if (!obj) continue;
    return { h: acc.h, d: D.i, obj };
  }
}
// Lo que pasa, igual en todas las pantallas
async function aplicar(ev) {
  const P = PELEA;
  if (ev.k !== 'turno') { $('#botones').hidden = true; subirNarrar(); }
  if (ev.k === 'turno') { P.turno = ev.f; pintarBarras(); const L = P.F[ev.f]; narrar(L.ctrl === P.yo ? `Tu turno (${L.nombre})` : `Turno de ${L.nombre}…`); return; }
  if (ev.k === 'apoyo') { const A = P.F[ev.f], x = buscarAccion(A, ev.h); if (x) await usarApoyo(A, x); return; }
  if (ev.k === 'ataque') { const A = P.F[ev.f]; await atacar(A, P.F[ev.d], buscarAccion(A, ev.h) || { h: ev.h, a: CABEZAZO }, ev); return; }
  if (ev.k === 'fin') return terminar(ev);
}
async function usarApoyo(A, { h, a }) {
  if (A.usos[h] != null) A.usos[h]--;
  A.robot.golpe(h === 'cabeza' ? 'brazoD' : h);
  if (a.tipo === 'escudo') { A.escudo = a.v; sonido.bloqueo?.(); narrar(`${A.nombre} se cubre: el próximo golpe hará ${a.v} menos.`); }
  if (a.tipo === 'apuntar') { A.apunta = a.v; sonido.hechizo?.(); narrar(`${A.nombre} apunta con calma: +${a.v} dados al siguiente ataque.`); }
  if (a.tipo === 'cura') {
    const h2 = HUECOS.filter((x) => viva(A, x) && A.piezas[x].vida < A.piezas[x].max).sort((x, y) => A.piezas[x].vida / A.piezas[x].max - A.piezas[y].vida / A.piezas[y].max)[0];
    if (h2) { const p = A.piezas[h2], c = Math.min(p.max - p.vida, a.v + (A.nucleo === 'buho' ? 1 : 0)); p.vida += c; ui.numero(A.robot.partes[h2].getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .4, 0)), `+${c}`, '#8affb0'); narrar(`${A.nombre} se repara ${HUECOS_ROBOT[h2].n.toLowerCase()}: +${c}.`); }
    else narrar(`${A.nombre} saca la llave inglesa… y no tiene nada que arreglar.`);
    sonido.recoger?.();
  }
  ui.chispas(A.robot.grupo.position.clone().add(new THREE.Vector3(0, 1.6, 0)), '#ffd27a', 18, 2.5);
  pintarBarras(); await espera(1300);
}
async function atacar(A, D, { h, a }, ev) {
  const obj = ev.obj, n = ev.r.length;
  if (A.usos[h] != null) A.usos[h]--;
  A.apunta = 0;
  narrar(`${A.nombre}: ¡${a.n}! ${n} ${n === 1 ? 'dado' : 'dados'} a ${HUECOS_ROBOT[obj].n.toLowerCase()}${PELEA.F.length > 2 ? ` de ${D.nombre}` : ''}…`);
  A.robot.golpe(h === 'cabeza' || !h ? 'brazoD' : h);
  const destino = D.robot.partes[obj].getWorldPosition(new THREE.Vector3());
  if (a.tipo === 'disparo') { const desde = A.robot.partes[h && h !== 'cabeza' ? h : 'cabeza'].getWorldPosition(new THREE.Vector3()); sonido.hechizo?.(); await ui.proyectil(desde, destino, a.e === '🔥' ? '#ff8a3a' : a.e === '⚡' ? '#ffe04a' : '#cfd8e0', .4); }
  else await espera(350);
  const desdeDados = camara.position.clone().setY(1.2);
  await dados.tirar('combate', n, centroMesa(), desdeDados, ev.r);
  let dano = ev.r.filter((x) => x === 'calavera').length;
  const nEsq = esquiva(D);
  if (dano && !a.certero && nEsq > 0) {
    narrar(`¡${dano} ${dano === 1 ? 'golpe' : 'golpes'}! ${D.nombre} intenta esquivar…`); await espera(500);
    const r2 = (ev.r2 || []).slice(0, nEsq);
    await dados.tirar('combate', r2.length || nEsq, centroMesa(), desdeDados, r2);
    dano = Math.max(0, dano - r2.filter((x) => x === 'escudoB').length);
  }
  if (dano && D.escudo) { const p = Math.min(dano, D.escudo); dano -= p; D.escudo = 0; ui.numero(destino.clone().add(new THREE.Vector3(0, .5, 0)), `🛡️ -${p}`, '#cfe8ff'); }
  if (a.piernas && obj === 'piernas' && dano) dano++;
  if (!dano) { sonido.bloqueo?.(); narrar(`¡${D.nombre} se libra!`); ui.numero(destino.clone().add(new THREE.Vector3(0, .5, 0)), '¡Fallo!', '#cfe8ff'); pintarBarras(); await espera(900); return; }
  const p = D.piezas[obj]; p.vida = Math.max(0, p.vida - dano);
  sonido.golpe?.(); D.robot.herido(); ui.numero(destino.clone().add(new THREE.Vector3(0, .5, 0)), `-${dano}`); ui.chispas(destino, '#ffd0a0', 18, 3);
  if (!p.vida) {
    sonido.explosion?.(); D.robot.romper(obj, escena); ui.chispas(destino, '#ff8a3a', 40, 5);
    narrar(obj === 'cabeza' ? `¡Le arranca la cabeza a ${D.nombre}!` : `¡${HUECOS_ROBOT[obj].n} de ${D.nombre}, hecho chatarra!`);
  } else narrar(`¡${dano} de daño ${obj === 'cabeza' ? 'en la cabeza' : 'en ' + HUECOS_ROBOT[obj].n.toLowerCase()}${PELEA.F.length > 2 ? ` de ${D.nombre}` : ''}!`);
  pintarBarras(); await espera(1200);
}
// La pieza de serie que se pone en un hueco si te quitan la que llevabas
const DE_SERIE = { cabeza: 'cab_lata', brazoI: 'br_puno', brazoD: 'br_canon', piernas: 'pi_patas' };
async function terminar(ev) {
  const P = PELEA; P.acabada = true;
  peleando = false; $('#botones').hidden = true; subirNarrar(); dados.limpiar?.();
  const R = ROBOT(), antes = nivelNucleo(R.xp), yo = P.F.find((L) => L.ctrl === P.yo);
  if (ev.anulada) {
    narrar(''); $('#barras').hidden = true;
    mostrar(`<h2>🔌 Combate suspendido</h2><p>${esc(P.F[ev.quien]?.piloto || 'El otro')} se ha ido del ring. Nadie gana ni pierde nada.</p><div class="fila-botones"><button id="bTaller" class="grande">🔧 Al taller</button></div>`, 'fin');
    $('#bTaller').onclick = pantallaTaller; PELEA = null; return;
  }
  const gano = ev.gana === P.miLado;
  let xp, titulo, texto, premio = '';
  if (P.tipo === 'duelo') {
    const otro = P.F.find((L) => L !== yo);
    xp = gano ? 40 : 15;
    if (ev.pieza && PIEZAS[ev.pieza]) {
      const nom = PIEZAS[ev.pieza].n;
      if (gano) {
        if (ev.monedas) { DEF.oro = (DEF.oro || 0) + ev.monedas; premio = `Le quitas <b>${nom}</b>, pero ya la tenías: Rufo te la cambia por ${ev.monedas} monedas.`; }
        else { if (!R.piezas.includes(ev.pieza)) R.piezas.push(ev.pieza); premio = `Le quitas <b>${nom}</b>. ¡Ya es tuya! Póntela en el taller.`; }
      } else {
        R.piezas = R.piezas.filter((id) => id !== ev.pieza);
        for (const h of HUECOS) if (R.equipo[h] === ev.pieza) R.equipo[h] = DE_SERIE[h];
        for (const id of Object.values(DE_SERIE)) if (!R.piezas.includes(id)) R.piezas.push(id);
        premio = `Te quita <b>${nom}</b>. Tendrás que recuperarla en la revancha…`;
      }
    } else premio = gano ? 'Solo llevaba piezas de serie: no hay nada que quitarle. ¡Pero la gloria es tuya!' : 'Solo tenías piezas de serie: no te quita nada.';
    titulo = gano ? '🏆 ¡Ganas el duelo!' : '💥 Pierdes el duelo';
    texto = gano ? `${esc(R.nombre)} deja sin cabeza a ${esc(otro.nombre)}. ${premio}` : `${esc(otro.nombre)} gana esta vez. ${premio}`;
  } else {
    const rivales = P.F.filter((L) => L.ctrl === 'npc'), r = P.rival;
    xp = gano ? 30 + r * 12 : 10;
    if (gano) {
      R.victorias = (R.victorias || 0) + 1; R.liga = Math.max(R.liga || 0, Math.min(RIVALES.length, r + 1));
      const faltan = [...new Set(rivales.flatMap((L) => Object.values(L.equipo)))].filter((id) => !R.piezas.includes(id));
      if (faltan.length) { const id = faltan[Math.floor(Math.random() * faltan.length)]; R.piezas.push(id); premio = `Te llevas ${rivales.length > 1 ? 'una de sus piezas' : 'su pieza'}: <b>${PIEZAS[id].n}</b>. Póntela en el taller.`; }
      else { const oro = 15 + r * 10; DEF.oro = (DEF.oro || 0) + oro; premio = `Ya tenías todas sus piezas: te dan ${oro} monedas.`; }
    }
    const nombres = rivales.map((L) => L.nombre).join(' y ');
    titulo = gano ? '🏆 ¡Victoria!' : P.tipo === 'juntos' ? '💥 Os han dejado sin cabeza' : '💥 Te han dejado sin cabeza';
    texto = gano ? `${P.tipo === 'juntos' ? 'Ganáis' : `${esc(R.nombre)} gana`} a ${nombres}. ${premio}` : `${nombres} ${rivales.length > 1 ? 'ganan' : 'gana'} esta vez. Repara, cambia piezas y vuelve.`;
  }
  if (gano) { sonido.victoria?.(); if (yo?.robot) ui.chispas(yo.robot.grupo.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ffe08a', 70, 6); } else sonido.derrota?.();
  R.xp += xp;
  const nv = nivelNucleo(R.xp);
  guardar();
  await espera(1200);
  if (PELEA !== P) return;
  mostrar(`<h2>${titulo}</h2><p>${texto}</p>
    <p class="nota">+${xp} de experiencia para el núcleo${nv > antes ? ` · <b>¡Sube a nivel ${nv}!</b>${extraNivel(nv) > extraNivel(antes) ? ' Un dado más en todo.' : ''}` : ''}</p>
    <div class="fila-botones"><button id="bOtra">🥊 Otra pelea</button><button id="bTaller" class="grande">🔧 Al taller</button></div>`, 'fin');
  $('#barras').hidden = true; narrar('');
  $('#bOtra').onclick = pantallaLiga; $('#bTaller').onclick = pantallaTaller;
  PELEA = null;
}
// El invitado: si el que lleva la pelea desaparece, se suspende
setInterval(() => {
  const P = PELEA; if (!P || P.anfitrion || P.acabada) return;
  const g = GENTE[P.de];
  if (g && g.online !== false) { P.tFuera = 0; return; }
  P.tFuera ||= Date.now();
  if (Date.now() - P.tFuera > 25000) { const q = P.F.findIndex((L) => L.ctrl === P.de); P.cola = P.cola.then(() => (PELEA === P ? terminar({ k: 'fin', anulada: true, quien: q }) : null)); }
}, 1000);

// ---------- bucle ----------
const reloj = new THREE.Clock(); let t = 0;
function bucle() {
  const dt = Math.min(.05, reloj.getDelta()); t += dt;
  for (const r of Object.values(enEscena)) r?.animar(dt, t);
  if (modoCamara === 'taller' && enEscena.yo) enEscena.yo.grupo.rotation.y += dt * .5;
  const { pub, sitios, m4 } = escena.userData.publico;
  sitios.forEach(([x, y, z, f], k) => pub.setMatrixAt(k, m4.makeTranslation(x, y + Math.abs(Math.sin(t * (peleando ? 6 : 2) + f)) * (peleando ? .25 : .08), z))); pub.instanceMatrix.needsUpdate = true;
  const grupo = PELEA && PELEA.F.length > 2;
  const lejos = camara.aspect < 1 ? 1 + (1 - camara.aspect) * .5 : 1;   // en el móvil de pie, más atrás para que quepan todos
  const obj = modoCamara === 'taller' ? new THREE.Vector3(MOVIL ? 0 : 1.2, 2.5, 6.4) : new THREE.Vector3(Math.sin(t * .15) * .8, (grupo ? 5.6 : 4.2) * lejos, (grupo ? 9.4 : 8.4) * lejos);
  camara.position.lerp(obj, Math.min(1, dt * 2)); camara.lookAt(modoCamara === 'taller' ? (MOVIL ? 0 : 1.6) : 0, modoCamara === 'taller' ? (MOVIL ? .6 : 1.2) : 1, 0);
  dados.actualizar(dt); ui.actualizar(dt, t); sonido.actualizar?.(dt);
  render.render(escena, camara); requestAnimationFrame(bucle);
}
camara.position.set(0, 5, 10); bucle();

// ---------- arranque ----------
async function arrancar() {
  if (!DEF) DEF = await cargarHeroe();
  if (!DEF) return mostrar('<h2>Sin héroe</h2><p>Para tener robot, primero hazte un héroe de aventura: baja al claro desde el pueblo.</p><div class="fila-botones"><a class="boton" href="claro.html">Ir al claro</a></div>');
  if (!DEF.robot) pantallaNucleo(); else pantallaTaller();
}
arrancar();
cargarHeroe().then((h) => { if (h && !peleando && JSON.stringify(h.robot) !== JSON.stringify(DEF?.robot) && h.robot) { DEF = h; if (pantalla === 'taller') pantallaTaller(); publicarRobot(); } }).catch(() => {});
// La sala de siempre (la del pueblo): con ella os veis en el ring y podéis retaros
import('./reunion.js').then((RED) => RED.crearPanel({
  donde: 'ring', boton: $('#bSala'), proponer: false, datos: () => ({ clase: DEF?.clase || 'barbaro', x: 0, z: 0 }),
  alConectar: (R) => { SALA = R; publicarRobot(); R.cambiar({ ringReto: null }); R.on('gente', alGente); alGente(R.gente()); if (pantalla === 'liga') pantallaLiga(); },
  alSalir: () => { SALA = null; GENTE = {}; if (pantalla === 'liga') pantallaLiga(); }
})).catch((e) => console.warn('Sin sala:', e?.message));
window.ring = { get DEF() { return DEF; }, empezarPelea, get PELEA() { return PELEA; }, get SALA() { return SALA; }, escena, retar };
