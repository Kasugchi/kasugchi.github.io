// =============================================================
//  EL RING DE CHATARRA (ring.html): tu robot contra los cacharros del pueblo
//  Taller: eliges núcleo y te montas el robot con las piezas que tienes.
//  Liga: cinco vecinos con sus robots; ganar a uno abre el siguiente y te llevas
//  una de sus piezas. Pelea por turnos con dados: eliges qué haces (con qué
//  pieza) y a qué pieza del rival apuntas. Si le rompes la cabeza, ganas.
//  Lo tuyo se guarda en el héroe de aventura («robot»).
// =============================================================
import * as THREE from 'three';
import { toon, lienzo } from './claro-estilo.js';
import { crearDados } from './claro-dados.js';
import { crearUI3D } from './claro-ui3d.js';
import { crearSonido } from './claro-sonido.js';
import { leerLocal, cargarHeroe, guardarHeroe } from './claro-heroes.js';
import { NUCLEOS, PIEZAS, HUECOS_ROBOT, KIT_INICIAL, RIVALES, crearRobot, nivelNucleo, extraNivel, NIVELES_NUCLEO } from './robots.js';

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
function guardar() { if (DEF) guardarHeroe(DEF); }
function nuevoRobot(nucleo) {
  DEF.robot = { nucleo, nombre: 'Chatarrín', xp: 0, piezas: [...KIT_INICIAL], equipo: { cabeza: 'cab_lata', brazoI: 'br_puno', brazoD: 'br_canon', piernas: 'pi_patas' }, liga: 0, victorias: 0 };
  guardar();
}

// ---------- pantallas ----------
const panel = $('#panel');
const mostrar = (html) => { panel.innerHTML = html; panel.hidden = false; };
const ocultar = () => { panel.hidden = true; };
let enEscena = { yo: null, rival: null };
function ponerRobots(yo, rival) {
  for (const k of ['yo', 'rival']) if (enEscena[k]) enEscena[k].desechar(escena);
  enEscena = { yo: null, rival: null };
  if (yo) { const r = crearRobot(yo); r.grupo.position.set(rival ? -1.7 : MOVIL ? 0 : 1.6, 0, 0); r.grupo.rotation.y = rival ? Math.PI / 2 : .3; escena.add(r.grupo); enEscena.yo = r; }
  if (rival) { const r = crearRobot(rival); r.grupo.position.set(1.7, 0, 0); r.grupo.rotation.y = -Math.PI / 2; escena.add(r.grupo); enEscena.rival = r; }
}
const vidaPieza = (id, nucleo) => (PIEZAS[id]?.vida || 1) + (nucleo === 'tortuga' ? 1 : 0);

function pantallaNucleo() {
  ponerRobots(null, null); modoCamara = 'taller';
  mostrar(`<h2>Tu primer robot</h2><p>Rufo ha montado un ring en el pueblo y todo el mundo se ha hecho un cacharro. Elige el <b>núcleo</b> de tu robot: es su alma, y crece con cada pelea.</p>
    <div class="cartas">${Object.entries(NUCLEOS).map(([id, N]) => `<button data-n="${id}"><span>${N.e}</span><b>${N.n}</b><small>${N.t}</small></button>`).join('')}</div>`);
  panel.querySelectorAll('[data-n]').forEach((b) => b.onclick = () => { nuevoRobot(b.dataset.n); pantallaTaller(); });
}
function pantallaTaller() {
  const R = ROBOT(); modoCamara = 'taller'; ponerRobots({ nucleo: R.nucleo, equipo: R.equipo }, null);
  const N = NUCLEOS[R.nucleo], nv = nivelNucleo(R.xp), sig = NIVELES_NUCLEO[nv];
  const fila = (hueco) => {
    const H_ = HUECOS_ROBOT[hueco], opciones = R.piezas.filter((id) => PIEZAS[id]?.hueco === H_.tipo);
    return `<div class="hueco"><b>${H_.e} ${H_.n}</b><div class="piezas">${opciones.map((id) => { const P = PIEZAS[id]; return `<button class="${R.equipo[hueco] === id ? 'puesta' : ''}" data-h="${hueco}" data-p="${id}">${P.n}<small>${textoPieza(P, R.nucleo)}</small></button>`; }).join('')}</div></div>`;
  };
  mostrar(`<h2>${N.e} ${esc(R.nombre)} <small>núcleo ${N.n.toLowerCase()} · nivel ${nv}${sig ? ` · ${R.xp}/${sig} exp` : ''}</small></h2>
    <p class="nota">${N.t}${extraNivel(nv) ? ` Por su nivel, +${extraNivel(nv)} ${extraNivel(nv) === 1 ? 'dado' : 'dados'} en todo.` : ' En el nivel 4 y en el 8, un dado más en todo.'}</p>
    ${HUECOS.map(fila).join('')}
    <div class="fila-botones"><button id="bNombre">✏️ Nombre</button><button id="bLiga" class="grande">🥊 Al ring</button></div>`);
  panel.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { R.equipo[b.dataset.h] = b.dataset.p; guardar(); sonido.recoger?.(); pantallaTaller(); });
  $('#bNombre').onclick = () => { const n = prompt('¿Cómo se llama tu robot?', R.nombre); if (n) { R.nombre = n.replace(/[<>&"'`]/g, '').slice(0, 18) || R.nombre; guardar(); pantallaTaller(); } };
  $('#bLiga').onclick = pantallaLiga;
}
function textoPieza(P, nucleo) {
  const v = `❤ ${P.vida + (nucleo === 'tortuga' ? 1 : 0)}`;
  if (P.hueco === 'piernas') return `${v} · esquiva ${P.def} · rapidez ${P.vel}`;
  if (!P.acc) return `${v} · aguanta más`;
  const a = P.acc, q = { golpe: `${a.v} dados de golpe`, disparo: `${a.v} dados de disparo${a.certero ? ', no se esquiva' : ''}`, cura: `repara ${a.v}`, escudo: `para ${a.v}`, apuntar: `+${a.v} dados al siguiente` }[a.tipo];
  return `${v} · ${a.e} ${q}${a.usos ? ` (${a.usos} veces)` : ''}${a.piernas ? ', +1 a las piernas' : ''}`;
}
const esc = (t) => String(t || '').replace(/[<>&"]/g, '');
function pantallaLiga() {
  const R = ROBOT(); modoCamara = 'taller'; ponerRobots({ nucleo: R.nucleo, equipo: R.equipo }, null);
  mostrar(`<h2>🥊 La liga del ring</h2><p class="nota">Gana a uno y se abre el siguiente. Al ganar te llevas una de sus piezas (si ya las tienes todas, monedas).</p>
    <div class="liga">${RIVALES.map((r, i) => { const abierto = i <= (R.liga || 0), N = NUCLEOS[r.nucleo]; return `<button data-r="${i}" ${abierto ? '' : 'disabled'}><span>${abierto ? N.e : '🔒'}</span><b>${r.quien} y ${r.robot}</b><small>${abierto ? `nivel ${r.nivel} · ${Object.values(r.equipo).map((id) => PIEZAS[id].n).join(', ')}${i < (R.liga || 0) ? ' · ✓ vencido' : ''}` : 'Gana al anterior'}</small></button>`; }).join('')}</div>
    <div class="fila-botones"><button id="bTaller">🔧 Al taller</button></div>`);
  panel.querySelectorAll('[data-r]').forEach((b) => b.onclick = () => empezarPelea(+b.dataset.r));
  $('#bTaller').onclick = pantallaTaller;
}

// ---------- la pelea ----------
let modoCamara = 'taller';
function luchador(spec, robot, esYo) {
  const nivel = spec.nivel, piezas = {};
  for (const h of HUECOS) { const id = spec.equipo[h]; piezas[h] = { id, P: PIEZAS[id], vida: vidaPieza(id, spec.nucleo), max: vidaPieza(id, spec.nucleo) }; }
  const usos = {}; for (const h of HUECOS) if (piezas[h].P.acc?.usos) usos[h] = piezas[h].P.acc.usos;
  return { ...spec, piezas, usos, extra: extraNivel(nivel), escudo: 0, apunta: 0, robot, esYo };
}
const viva = (L, h) => L.piezas[h].vida > 0;
const velocidad = (L) => (viva(L, 'piernas') ? L.piezas.piernas.P.vel : 0);
const esquiva = (L) => (viva(L, 'piernas') ? L.piezas.piernas.P.def : 0);
function acciones(L) {
  const l = [];
  for (const h of ['brazoD', 'brazoI', 'cabeza']) { const a = L.piezas[h].P.acc; if (a && viva(L, h) && (L.usos[h] ?? 1) > 0) l.push({ h, a }); }
  if (!l.some((x) => ['golpe', 'disparo'].includes(x.a.tipo))) l.push({ h: null, a: { tipo: 'golpe', n: 'Cabezazo', e: '🤕', v: 1 } });   // sin armas, a cabezazos
  return l;
}
function dadosDe(A, a, objetivo) {
  let n = a.v + A.extra + (A.nucleo === 'escarabajo' && a.tipo === 'disparo' ? 1 : 0) + (A.nucleo === 'mantis' && a.tipo === 'golpe' ? 1 : 0) + A.apunta;
  if (objetivo === 'cabeza' && !a.certero && A.nucleo !== 'buho' && !A.apunta) n -= 1;   // la cabeza es pequeña: cuesta más darle
  return Math.max(1, n);
}
let P1 = null, P2 = null, rivalI = 0, peleando = false;
const centroMesa = () => new THREE.Vector3(0, .1, 1.6);

async function empezarPelea(i) {
  const R = ROBOT(), rv = RIVALES[i]; rivalI = i; ocultar();
  ponerRobots({ nucleo: R.nucleo, equipo: R.equipo }, { nucleo: rv.nucleo, equipo: rv.equipo });
  P1 = luchador({ nombre: R.nombre, nucleo: R.nucleo, nivel: nivelNucleo(R.xp), equipo: { ...R.equipo } }, enEscena.yo, true);
  P2 = luchador({ nombre: rv.robot, nucleo: rv.nucleo, nivel: rv.nivel, equipo: rv.equipo }, enEscena.rival, false);
  modoCamara = 'pelea'; peleando = true; pintarBarras(); $('#barras').hidden = false;
  sonido.circulo?.(); sonido.musica?.('combate');
  narrar(`${rv.quien}: «${rv.frase}»`); await espera(2200);
  narrar('¡Ding, ding! ¡Que empiece el combate!'); ui.chispas(new THREE.Vector3(0, 1.5, 0), '#ffd27a', 40, 5); await espera(1000);
  while (peleando) {
    const orden = [P1, P2].map((L) => [L, velocidad(L) + Math.random() * 6]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    for (const L of orden) {
      if (!peleando) break;
      const otro = L === P1 ? P2 : P1;
      if (L.esYo) await turnoJugador(L, otro); else await turnoRival(L, otro);
      pintarBarras();
      if (!viva(otro, 'cabeza')) { await terminar(L.esYo); break; }
    }
  }
}
function narrar(t) { const n = $('#narrar'); n.textContent = t; n.hidden = !t; }
function pintarBarras() {
  for (const [L, sel] of [[P1, '#yo'], [P2, '#el']]) {
    const N = NUCLEOS[L.nucleo];
    $(sel).innerHTML = `<b>${N.e} ${esc(L.nombre)} <small>nv ${L.nivel}</small></b>${HUECOS.map((h) => { const p = L.piezas[h], pc = Math.max(0, p.vida / p.max * 100); return `<div class="barra ${p.vida <= 0 ? 'rota' : ''}"><span>${HUECOS_ROBOT[h].e}</span><i style="--p:${pc}%"></i><em>${p.vida > 0 ? p.vida : '✖'}</em></div>`; }).join('')}${L.escudo ? '<div class="nota">🛡️ cubierto</div>' : ''}${L.apunta ? '<div class="nota">🎯 apuntando</div>' : ''}`;
  }
}
const botones = (lista) => new Promise((ok) => {
  const b = $('#botones'); b.innerHTML = ''; b.hidden = false;
  for (const x of lista) { const e = document.createElement('button'); e.disabled = !!x.no; e.innerHTML = `<span>${x.e}</span>${x.t}`; e.onclick = () => { b.hidden = true; sonido.dado?.(.3); ok(x.v); }; b.appendChild(e); }
});
async function turnoJugador(A, D) {
  while (true) {
    narrar('Tu turno: ¿qué haces?');
    const acc = await botones(acciones(A).map((x) => ({ e: x.a.e, t: `${x.a.n}${A.usos[x.h] != null ? ` (${A.usos[x.h]})` : ''}`, v: x })));
    if (['cura', 'escudo', 'apuntar'].includes(acc.a.tipo)) return usarApoyo(A, acc);
    narrar('¿A qué pieza le apuntas?');
    const obj = await botones([...HUECOS.filter((h) => viva(D, h)).map((h) => ({ e: HUECOS_ROBOT[h].e, t: `${HUECOS_ROBOT[h].n} (${D.piezas[h].vida}) · ${dadosDe(A, acc.a, h)} 🎲`, v: h })), { e: '←', t: 'Otra cosa', v: null }]);
    if (!obj) continue;
    return atacar(A, D, acc, obj);
  }
}
async function turnoRival(A, D) {
  narrar(`Turno de ${A.nombre}…`); await espera(700);
  const l = acciones(A), curas = l.find((x) => x.a.tipo === 'cura'), herida = HUECOS.find((h) => viva(A, h) && A.piezas[h].vida <= A.piezas[h].max * .4);
  if (curas && herida) return usarApoyo(A, curas);
  const esc_ = l.find((x) => x.a.tipo === 'escudo'); if (esc_ && !A.escudo && A.piezas.cabeza.vida <= A.piezas.cabeza.max * .5 && Math.random() < .5) return usarApoyo(A, esc_);
  const ap = l.find((x) => x.a.tipo === 'apuntar'); if (ap && !A.apunta && Math.random() < .35) return usarApoyo(A, ap);
  const ataques = l.filter((x) => ['golpe', 'disparo'].includes(x.a.tipo)).sort((x, y) => y.a.v - x.a.v);
  const acc = ataques[Math.random() < .7 ? 0 : Math.floor(Math.random() * ataques.length)];
  // a por la cabeza si está tocada; si no, a desarmarte (el brazo que más pega); y a veces, lo que le da la gana
  const vivas = HUECOS.filter((h) => viva(D, h));
  let obj = D.piezas.cabeza.vida <= dadosDe(A, acc.a, 'cabeza') * .5 ? 'cabeza' : ['brazoD', 'brazoI'].filter((h) => viva(D, h) && D.piezas[h].P.acc).sort((x, y) => (D.piezas[y].P.acc?.v || 0) - (D.piezas[x].P.acc?.v || 0))[0] || 'cabeza';
  if (Math.random() < .25) obj = vivas[Math.floor(Math.random() * vivas.length)];
  return atacar(A, D, acc, obj);
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
async function atacar(A, D, { h, a }, obj) {
  if (A.usos[h] != null) A.usos[h]--;
  const n = dadosDe(A, a, obj); A.apunta = 0;
  narrar(`${A.nombre}: ¡${a.n}! ${n} ${n === 1 ? 'dado' : 'dados'} a ${HUECOS_ROBOT[obj].n.toLowerCase()}…`);
  A.robot.golpe(h === 'cabeza' || !h ? 'brazoD' : h);
  const destino = D.robot.partes[obj].getWorldPosition(new THREE.Vector3());
  if (a.tipo === 'disparo') { const desde = A.robot.partes[h && h !== 'cabeza' ? h : 'cabeza'].getWorldPosition(new THREE.Vector3()); sonido.hechizo?.(); await ui.proyectil(desde, destino, a.e === '🔥' ? '#ff8a3a' : a.e === '⚡' ? '#ffe04a' : '#cfd8e0', .4); }
  else await espera(350);
  const desdeDados = camara.position.clone().setY(1.2);
  const r = await dados.tirar('combate', n, centroMesa(), desdeDados);
  let dano = r.filter((x) => x === 'calavera').length;
  if (dano && !a.certero && esquiva(D) > 0) {
    narrar(`¡${dano} ${dano === 1 ? 'golpe' : 'golpes'}! ${D.nombre} intenta esquivar…`); await espera(500);
    const r2 = await dados.tirar('combate', esquiva(D), centroMesa(), desdeDados), para = r2.filter((x) => x === 'escudoB').length;
    dano = Math.max(0, dano - para);
  }
  if (dano && D.escudo) { const p = Math.min(dano, D.escudo); dano -= p; D.escudo = 0; ui.numero(destino.clone().add(new THREE.Vector3(0, .5, 0)), `🛡️ -${p}`, '#cfe8ff'); }
  if (a.piernas && obj === 'piernas' && dano) dano++;
  if (!dano) { sonido.bloqueo?.(); narrar(`¡${D.nombre} se libra!`); ui.numero(destino.clone().add(new THREE.Vector3(0, .5, 0)), '¡Fallo!', '#cfe8ff'); await espera(900); return; }
  const p = D.piezas[obj]; p.vida = Math.max(0, p.vida - dano);
  sonido.golpe?.(); D.robot.herido(); ui.numero(destino.clone().add(new THREE.Vector3(0, .5, 0)), `-${dano}`); ui.chispas(destino, '#ffd0a0', 18, 3);
  if (!p.vida) {
    sonido.explosion?.(); D.robot.romper(obj, escena); ui.chispas(destino, '#ff8a3a', 40, 5);
    narrar(obj === 'cabeza' ? `¡Le arranca la cabeza a ${D.nombre}!` : `¡${HUECOS_ROBOT[obj].n} de ${D.nombre}, hecho chatarra!`);
  } else narrar(`¡${dano} de daño ${obj === 'cabeza' ? 'en la cabeza' : 'en ' + HUECOS_ROBOT[obj].n.toLowerCase()}!`);
  pintarBarras(); await espera(1200);
}
async function terminar(gano) {
  peleando = false; $('#botones').hidden = true; dados.limpiar?.();
  const R = ROBOT(), rv = RIVALES[rivalI], antes = nivelNucleo(R.xp);
  R.xp += gano ? 30 + rivalI * 12 : 10;
  let premio = '';
  if (gano) {
    sonido.victoria?.(); ui.chispas(enEscena.yo.grupo.position.clone().add(new THREE.Vector3(0, 2, 0)), '#ffe08a', 70, 6);
    R.victorias = (R.victorias || 0) + 1; R.liga = Math.max(R.liga || 0, Math.min(RIVALES.length, rivalI + 1));
    const faltan = Object.values(rv.equipo).filter((id) => !R.piezas.includes(id));
    if (faltan.length) { const id = faltan[Math.floor(Math.random() * faltan.length)]; R.piezas.push(id); premio = `Te llevas su pieza: <b>${PIEZAS[id].n}</b>. Póntela en el taller.`; }
    else { const oro = 15 + rivalI * 10; DEF.oro = (DEF.oro || 0) + oro; premio = `Ya tenías todas sus piezas: te dan ${oro} monedas.`; }
  } else sonido.derrota?.();
  const nv = nivelNucleo(R.xp);
  guardar();
  mostrar(`<h2>${gano ? '🏆 ¡Victoria!' : '💥 Te han dejado sin cabeza'}</h2>
    <p>${gano ? `${esc(R.nombre)} gana a ${rv.robot}. ${premio}` : `${rv.robot} gana esta vez. Repara, cambia piezas y vuelve.`}</p>
    <p class="nota">+${gano ? 30 + rivalI * 12 : 10} de experiencia para el núcleo${nv > antes ? ` · <b>¡Sube a nivel ${nv}!</b>${extraNivel(nv) > extraNivel(antes) ? ' Un dado más en todo.' : ''}` : ''}</p>
    <div class="fila-botones"><button id="bOtra">🥊 Otra pelea</button><button id="bTaller" class="grande">🔧 Al taller</button></div>`);
  $('#barras').hidden = true; narrar('');
  $('#bOtra').onclick = pantallaLiga; $('#bTaller').onclick = pantallaTaller;
}

// ---------- bucle ----------
const reloj = new THREE.Clock(); let t = 0;
function bucle() {
  const dt = Math.min(.05, reloj.getDelta()); t += dt;
  for (const r of Object.values(enEscena)) r?.animar(dt, t);
  if (modoCamara === 'taller' && enEscena.yo && !enEscena.rival) enEscena.yo.grupo.rotation.y += dt * .5;
  const { pub, sitios, m4 } = escena.userData.publico;
  sitios.forEach(([x, y, z, f], i) => pub.setMatrixAt(i, m4.makeTranslation(x, y + Math.abs(Math.sin(t * (peleando ? 6 : 2) + f)) * (peleando ? .25 : .08), z))); pub.instanceMatrix.needsUpdate = true;
  const obj = modoCamara === 'taller' ? new THREE.Vector3(MOVIL ? 0 : 1.2, 2.5, 6.4) : new THREE.Vector3(Math.sin(t * .15) * .8, 4.2, 8.4);
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
cargarHeroe().then((h) => { if (h && !peleando && JSON.stringify(h.robot) !== JSON.stringify(DEF?.robot) && h.robot) { DEF = h; if (!panel.hidden) pantallaTaller(); } }).catch(() => {});
window.ring = { get DEF() { return DEF; }, empezarPelea, get P1() { return P1; }, get P2() { return P2; }, escena };
