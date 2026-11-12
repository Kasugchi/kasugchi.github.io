// =============================================================
//  CARTAS DE VELMOR (cartas.html): eliges mazo, retas a los del pueblo y juegas en el tablero 7×7.
//  Reglas puras en cartas-reglas.js; el tablero y las figuritas, en cartas-3d.js.
//  Se guarda en el héroe de aventura (cartas: mazo, colección, libro de fusiones, victorias).
//  ?debug=1: todas las cartas, todos los rivales y no se guarda nada.
// =============================================================
import * as C3 from './cartas-3d.js';
import { pintarTablero, sincronizar, ponerFigura, rehacer, figura, casillaDe, marcar, desmarcar, casillaEn, moverFigura, caer, hundir, sacudir, primerPlano, vistaMesa, lideres, limpiar, ui, sonido, mundo } from './cartas-3d.js';
import * as R from './cartas-reglas.js';
import { leerLocal, cargarHeroe, guardarHeroe, CLASES } from './claro-heroes.js';

const { CARTAS, TIPOS, ELEMENTOS, TERRENOS, LIDERES } = R;
const $ = (s) => document.querySelector(s);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nom = (id) => CARTAS[id]?.n || '¿?';
const DEBUG = new URLSearchParams(location.search).has('debug');
const YO = 0, EL = 1;

// ---------- tu colección (en el héroe) ----------
let DEF = leerLocal();
const K = () => DEF.cartas;
function guardar() { if (DEF && !DEBUG) guardarHeroe(DEF); }
function modoDebug() {
  DEF = structuredClone(DEF || { nombre: 'Probador', clase: 'barbaro', raza: 'humano' });
  DEF.cartas ||= {}; const col = {}; for (const id of Object.keys(CARTAS)) col[id] = 3; DEF.cartas.coleccion = col; DEF.cartas.victorias ||= {}; DEF.cartas.libro ||= {};
  const b = document.createElement('div'); b.textContent = '🧪 MODO PRUEBAS · todas las cartas · no se guarda nada';
  b.style.cssText = 'position:fixed;left:8px;top:calc(max(8px, env(safe-area-inset-top)) + 72px);z-index:50;background:#7a1fa2;color:#fff;font:700 11px Nunito,sans-serif;padding:3px 10px;border-radius:9px;pointer-events:none;opacity:.9'; document.body.appendChild(b);
}
const contar = (lista) => lista.reduce((m, id) => (m[id] = (m[id] || 0) + 1, m), {});

// ---------- pintar una carta (mano, menús, info) ----------
const COLOR_CLASE = { bicho: '#f0d8a0', magia: '#9ad8a8', trampa: '#d0a8e8', equipo: '#c8c8d0', terreno: '#8ad0d0' };
function htmlCarta(id, { sel = 0, mini = false, extra = '' } = {}) {
  const C = CARTAS[id]; if (!C) return '';
  const borde = C.k === 'bicho' ? ELEMENTOS[C.el][2] : '#8a6a4a';
  const pie = C.k === 'bicho' ? `<em>⚔${C.a}<br>🛡${C.d}</em>` : `<em class="k">${{ magia: 'Magia', trampa: 'Trampa', equipo: 'Equipo', terreno: 'Terreno' }[C.k]}</em>`;
  return `<div class="carta ${mini ? 'mini' : ''} ${sel ? 'sel' : ''}" style="--fondo:${COLOR_CLASE[C.k]};--borde:${borde}" ${extra}>${sel ? `<i class="orden">${sel}</i>` : ''}
    ${C.k === 'bicho' ? `<span class="estrellas">${'★'.repeat(Math.min(C.nv, 9))}</span>` : ''}<span class="dib">${C.e}</span><b>${esc(C.n)}</b>${pie}</div>`;
}
function textoCarta(id) {
  const C = CARTAS[id]; if (!C) return '';
  if (C.k === 'bicho') {
    const hab = (C.hab || []).map((h) => ({ veloz: '💨 Veloz: se mueve 2.', fantasmal: '👻 Fantasmal: atraviesa los muros.', galerias: '🪱 Vive en las galerías: se mueve por el laberinto.', muro: '🧱 Muro: no ataca.', perforante: '🗡️ Perforante.', inmortal: '🪨 El derrumbe no le aplasta.' }[h])).join(' ');
    return `${TIPOS[C.t][0]} ${TIPOS[C.t][1]} · ${ELEMENTOS[C.el][0]} ${ELEMENTOS[C.el][1]} · ${'★'.repeat(C.nv)}${hab ? '<br>' + hab : ''}`;
  }
  return esc(C.txt || '');
}

// ---------- pantallas de menú ----------
const panel = $('#panel');
const mostrar = (html) => { panel.innerHTML = html; panel.hidden = false; panel.scrollTop = 0; };
let pestana = 'duelos';
function pantallaElegir() {
  const ops = R.mazosIniciales(DEF.id || DEF.nombre || 'yo');
  mostrar(`<h2>🃏 Cartas de Velmor<small>Elige tu primer mazo. Cada héroe recibe tres distintos; todos valen lo mismo, cambia el estilo.</small></h2>
    ${ops.map((o, i) => `<button class="tema" data-i="${i}"><span>${o.tema.e}</span><b>${esc(o.tema.n)}</b><small>${esc(o.tema.txt)}</small>
      <div class="muestra">${[...new Set(o.mazo.filter(R.esBicho))].sort((a, b) => CARTAS[b].a - CARTAS[a].a).slice(0, 6).map((id) => `<i title="${esc(nom(id))}">${CARTAS[id].e}</i>`).join('')}</div></button>`).join('')}`);
  panel.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => {
    const o = ops[+b.dataset.i]; DEF.cartas = { tema: o.tema.id, mazo: [...o.mazo], coleccion: DEBUG ? K().coleccion : contar(o.mazo), libro: K()?.libro || {}, victorias: K()?.victorias || {} };
    guardar(); pantallaMenu('duelos');
  });
}
function pestanas() { return `<div class="pestanas">${[['duelos', '⚔️ Duelos'], ['mazo', '🃏 Mi mazo'], ['libro', '📖 Fusiones'], ['ayuda', '❓']].map(([k, t]) => `<button data-p="${k}" class="${pestana === k ? 'activa' : ''}">${t}</button>`).join('')}</div>`; }
function pantallaMenu(p = pestana) {
  pestana = p; $('#hud').hidden = true; $('#mano').hidden = true; $('#acciones').hidden = true; $('#info').hidden = true; $('#volver').hidden = false;
  const html = p === 'mazo' ? htmlMazo() : p === 'libro' ? htmlLibro() : p === 'ayuda' ? htmlAyuda() : htmlDuelos();
  mostrar(pestanas() + html);
  panel.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => pantallaMenu(b.dataset.p));
  if (p === 'duelos') panel.querySelectorAll('[data-reto]').forEach((b) => b.onclick = () => empezarDuelo(R.RIVALES_C.find((r) => r.id === b.dataset.reto)));
  if (p === 'mazo') alMazo();
}
function htmlDuelos() {
  const v = K().victorias, mio = R.valorMazo(K().mazo), ok = K().mazo.length === 40;
  return `<h2>Duelos en el pueblo<small>Tu mazo: ${K().mazo.length}/40 cartas · fuerza ${mio}</small></h2>
    ${ok ? '' : '<p class="aviso">⚠️ Tu mazo tiene que tener 40 cartas justas para jugar.</p>'}
    ${R.RIVALES_C.map((r, i) => {
      const abierto = DEBUG || i === 0 || (v[R.RIVALES_C[i - 1].id] || 0) > 0, g = v[r.id] || 0;
      return `<div class="rival ${abierto ? '' : 'cerrado'}"><b>${r.e} ${esc(r.quien)}</b> <small>${TERRENOS[r.terreno].e} juega en ${TERRENOS[r.terreno].n.toLowerCase()} · ${g ? `le has ganado ${g} ${g === 1 ? 'vez' : 'veces'}` : 'sin ganarle aún'}</small>
        <small>«${esc(r.frase)}»</small><div class="fila-botones"><button class="grande" data-reto="${r.id}" ${abierto && ok ? '' : 'disabled'}>${abierto ? (g ? '⚔️ Revancha' : '⚔️ Retar') : '🔒 Gana al anterior'}</button></div></div>`;
    }).join('')}`;
}
function htmlMazo() {
  const mazo = contar(K().mazo), col = K().coleccion, ids = Object.keys(CARTAS).filter((id) => (col[id] || 0) > 0);
  const orden = (a, b) => (CARTAS[a].k === 'bicho' ? 0 : 1) - (CARTAS[b].k === 'bicho' ? 0 : 1) || (CARTAS[b].a || 0) - (CARTAS[a].a || 0) || nom(a).localeCompare(nom(b));
  return `<h2>Mi mazo<small>${K().mazo.length}/40 · fuerza ${R.valorMazo(K().mazo)} · máximo 3 copias de cada carta</small></h2>
    <p class="nota">Toca − para sacar una carta y + para meter una de tu colección.</p>
    <div class="lista">${ids.sort(orden).map((id) => `<div class="fila"><span class="dib">${CARTAS[id].e}</span><div><b>${esc(nom(id))}</b><small>${CARTAS[id].k === 'bicho' ? `⚔${CARTAS[id].a} 🛡${CARTAS[id].d} · ${textoCarta(id)}` : textoCarta(id)}</small></div>
      <div class="cuenta"><button data-menos="${id}" ${(mazo[id] || 0) ? '' : 'disabled'}>−</button><i>${mazo[id] || 0}/${Math.min(3, col[id])}</i><button data-mas="${id}" ${(mazo[id] || 0) < Math.min(3, col[id]) && K().mazo.length < 40 ? '' : 'disabled'}>+</button></div></div>`).join('')}</div>`;
}
function alMazo() {
  panel.querySelectorAll('[data-menos]').forEach((b) => b.onclick = () => { const i = K().mazo.indexOf(b.dataset.menos); if (i >= 0) K().mazo.splice(i, 1); guardar(); const st = panel.scrollTop; pantallaMenu('mazo'); panel.scrollTop = st; });
  panel.querySelectorAll('[data-mas]').forEach((b) => b.onclick = () => { if (K().mazo.length < 40) K().mazo.push(b.dataset.mas); guardar(); const st = panel.scrollTop; pantallaMenu('mazo'); panel.scrollTop = st; });
}
function htmlLibro() {
  const libro = K().libro || {}, total = Object.keys(CARTAS).filter((id) => CARTAS[id].fus).length, sacadas = new Set(Object.values(libro));
  const filas = Object.entries(libro).map(([k, r]) => { const [a, b] = k.split('+'); return `<div class="fila"><span class="dib">${CARTAS[r]?.e || '?'}</span><div><b>${esc(nom(r))}</b><small>${esc(nom(a))} + ${esc(nom(b))}</small></div></div>`; }).join('');
  return `<h2>📖 Libro de fusiones<small>${sacadas.size} de ${total} bichos de fusión descubiertos</small></h2>
    <p class="nota">Aquí no hay chuletas: solo se apunta lo que has fusionado tú. Prueba a juntar bichos (o un bicho y un equipo) en la mano antes de jugarlos.</p>
    ${filas || '<p>Todavía nada. ¿Qué pasará si juntas dos no-muertos…?</p>'}
    <div class="huecos">${Array.from({ length: Math.max(0, total - sacadas.size) }, () => '<i>???</i>').join('')}</div>`;
}
function htmlAyuda() {
  return `<h2>Cómo se juega</h2>
    <p>🎯 <b>Gana</b> quien deje al otro sin vida (8000), o le rodee el líder por los cuatro lados.</p>
    <p>🃏 Cada turno robas hasta tener 5 y haces <b>una sola jugada</b> al lado de tu líder: una carta, o varias seguidas. Si eliges varios bichos, <b>intentan fusionarse</b> en orden; si no encajan, el primero se pierde. Un bicho y un equipo seguidos: sale equipado.</p>
    <p>🚶 Después, cada carta tuya hace <b>una cosa</b>: moverse (o atacar a una de al lado), voltearse o cambiar entre ataque y defensa. Las cartas salen <b>boca abajo</b>: el rival no sabe qué son hasta que chocan.</p>
    <p>⚔️ Ataque contra ataque: pierde el más flojo y su dueño pierde la diferencia. Contra defensa: si no la rompes, te comes tú la diferencia. Golpe al líder: todo el ataque a la vida.</p>
    <p>🗺️ Cada rival juega en su terreno (±500 a los que les va bien o mal). Las cartas de terreno cambian la zona alrededor de donde las juegas. El laberinto no se cruza, salvo fantasmas y gusanos.</p>
    <p>🪤 Las trampas salen boca abajo como cualquier carta y saltan solas. Manda delante al bicho flojo.</p>
    <p>🎰 Al ganar, la tragaperras te da una carta del cementerio del rival o de su mazo.</p>`;
}

// ---------- el duelo ----------
let S = null, RIVAL = null, sel = [], modo = 'menu', elegida = null, opc = null, jugando = false;
const hud = $('#hud'), mano = $('#mano'), acciones = $('#acciones'), info = $('#info');
function empezarDuelo(r) {
  RIVAL = r; const rev = Math.min(2, K().victorias[r.id] || 0);
  const suyo = R.mazoRival(r, R.valorMazo(K().mazo), rev);
  S = R.crearDuelo({ mazos: [K().mazo, suyo], lideres: [{ clase: CLASES[DEF.clase] ? DEF.clase : 'barbaro', nombre: DEF.nombre }, { clase: 'vecino', nombre: r.quien }], terreno: r.terreno, s: (Math.random() * 2 ** 32) >>> 0 });
  lideres([{ heroe: { raza: DEF.raza || 'humano', clase: DEF.clase || 'barbaro', colores: DEF.colores } }, { vecino: { ropa: { pip: '#5aa8e8', anzuelo: '#3a6a8a', brasa: '#a83a2a', rufo: '#2a2a3a', fantasma: '#c8d8f0' }[r.id] || '#8a6a4a' } }]);
  limpiar(); pintarTablero(S); sincronizar(S, YO); S.ev.length = 0;
  panel.hidden = true; $('#volver').hidden = true; hud.hidden = false; mano.hidden = false; acciones.hidden = false; info.hidden = true;
  sel = []; modo = 'yo'; elegida = null; opc = null;
  aviso(`${r.e} ${esc(r.quien)}: «${esc(r.frase)}»`, 2600); pintarHUD(); pintarMano(); pintarAcciones();
}
function pintarHUD() {
  if (!S) return; const L = (p) => S.u.find((u) => u.lider && u.p === p);
  hud.innerHTML = `<div class="jug ${S.juega === YO ? 'activo' : ''}"><b>${esc(DEF.nombre || 'Tú')}</b><span>❤️ ${S.lp[YO]}</span><small>🂠 ${S.mazo[YO].length} · ${LIDERES[L(YO).clase].n}</small></div>
    <div class="turno">Turno ${Math.floor(S.turno / 2) + 1}</div>
    <div class="jug el ${S.juega === EL ? 'activo' : ''}"><b>${RIVAL.e} ${esc(RIVAL.quien)}</b><span>❤️ ${S.lp[EL]}</span><small>🂠 ${S.mazo[EL].length} · ✋ ${S.mano[EL].length}</small></div>`;
}
function pintarMano() {
  if (!S) return;
  mano.innerHTML = S.mano[YO].map((id, i) => htmlCarta(id, { sel: sel.indexOf(i) + 1, extra: `data-m="${i}"` })).join('');
  mano.querySelectorAll('[data-m]').forEach((c) => c.onclick = () => tocarCarta(+c.dataset.m));
}
function pintarAcciones() {
  const mio = S && S.juega === YO && !S.fin && modo !== 'ia';
  acciones.innerHTML = `${sel.length && mio && !S.jugado ? `<button class="grande" id="bJugar">✅ Jugar ${sel.length > 1 ? `(${sel.length})` : ''}</button>` : ''}
    ${(sel.length || modo === 'casilla' || elegida) && mio ? '<button id="bCancelar">↩️</button>' : ''}
    ${mio ? `<button id="bFin">⏭️ Fin de turno</button>` : `<button disabled>${S?.fin ? '' : '⏳ Juega el rival…'}</button>`}
    ${mio && DEBUG ? '<button id="bAuto">🤖 Auto</button>' : ''}`;
  $('#bAuto')?.addEventListener('click', autoTurno);
  $('#bJugar')?.addEventListener('click', elegirCasilla);
  $('#bCancelar')?.addEventListener('click', cancelar);
  $('#bFin')?.addEventListener('click', terminarTurno);
}
function tocarCarta(i) {
  if (!S || S.juega !== YO || S.fin || modo === 'ia') return;
  const id = S.mano[YO][i], C = CARTAS[id];
  quitarEleccion(); verInfoCarta(id);
  if (S.jugado) { aviso('Ya has hecho tu jugada este turno. Mueve tus cartas o pasa turno.'); return; }
  const encadenable = (k) => k === 'bicho' || k === 'equipo';
  const ya = sel.indexOf(i);
  if (ya >= 0) sel.splice(ya, 1);
  else if (!encadenable(C.k) || (sel.length && !encadenable(CARTAS[S.mano[YO][sel[0]]].k))) sel = [i];
  else sel.push(i);
  if (modo === 'casilla') { modo = 'yo'; desmarcar(); }
  pintarMano(); pintarAcciones();
}
function elegirCasilla() {
  const ids = sel.map((i) => S.mano[YO][i]), cs = R.casillasJuego(S, YO, ids);
  if (!cs.length) { aviso('No hay sitio donde jugar eso ahora (¿tienes ya 5 bichos o no hay casillas libres al lado de tu líder?).'); return; }
  const C = CARTAS[ids[0]];
  if (C.k === 'magia' && C.obj === 'nada') { hacerJugada(cs[0].x, cs[0].y); return; }
  modo = 'casilla'; desmarcar(); marcar(cs, '#ffe27a');
  aviso(C.k === 'magia' ? '🎯 Toca el bicho rival al que se la lanzas.' : C.k === 'equipo' && ids.length === 1 ? '🎯 Toca el bicho tuyo al que se lo pones.' : C.k === 'terreno' ? '🎯 Toca dónde cambiar el terreno (la casilla y las de alrededor).' : '🎯 Toca una casilla brillante al lado de tu líder.');
  pintarAcciones();
}
function cancelar() { sel = []; modo = 'yo'; desmarcar(); quitarEleccion(); pintarMano(); pintarAcciones(); }
function quitarEleccion() { elegida = null; opc = null; info.hidden = true; if (modo !== 'casilla') desmarcar(); }
async function preguntarPosicion() {
  return new Promise((ok) => {
    const d = $('#pos'); d.hidden = false;
    d.innerHTML = `<p>¿Cómo lo pones? <small>${sel.length > 1 ? 'Si se fusionan, lo verás ahora y saldrá boca arriba. Si no, boca abajo.' : 'Sale boca abajo: el rival no sabrá qué es.'}</small></p><div class="fila-botones"><button class="grande" data-def="0">⚔️ En ataque</button><button class="grande azul" data-def="1">🛡️ En defensa</button></div><button class="sutil" data-def="x">Cancelar</button>`;
    d.querySelectorAll('[data-def]').forEach((b) => b.onclick = () => { d.hidden = true; ok(b.dataset.def === 'x' ? null : b.dataset.def === '1'); });
  });
}
async function hacerJugada(x, y) {
  const ids = sel.map((i) => S.mano[YO][i]); let def = false;
  if (ids.some((id) => CARTAS[id].k === 'bicho')) { const r = await preguntarPosicion(); if (r === null) return; def = r; }
  desmarcar(); const s2 = [...sel]; sel = []; modo = 'yo';
  R.jugar(S, YO, s2, x, y, { def }); pintarMano(); await procesar();
}
async function tocarTablero(cx, cy) {
  if (!S || jugando) return; const c = casillaEn(cx, cy); if (!c) return;
  if (modo === 'casilla') { if (R.casillasJuego(S, YO, sel.map((i) => S.mano[YO][i])).some((k) => k.x === c.x && k.y === c.y)) await hacerJugada(c.x, c.y); return; }
  if (elegida && opc && S.juega === YO) {
    const at = opc.atacar.find((k) => k.x === c.x && k.y === c.y), mv = opc.mover.find((k) => k.x === c.x && k.y === c.y);
    if (at || mv) { const uid = elegida; quitarEleccion(); (at ? R.atacar : R.mover)(S, uid, c.x, c.y); await procesar(); return; }
  }
  const u = R.en(S, c.x, c.y);
  if (!u) { quitarEleccion(); pintarAcciones(); return; }
  elegirUnidad(u);
}
function elegirUnidad(u) {
  desmarcar(); elegida = null; opc = null;
  const mio = u.p === YO && S.juega === YO && !S.fin && modo !== 'ia';
  if (mio && !u.trampa) { elegida = u.id; opc = R.opciones(S, u.id); marcar(opc.mover, '#5ac8ff'); marcar(opc.atacar, '#ff5a5a'); marcar([{ x: u.x, y: u.y }], '#ffffff'); }
  verInfoUnidad(u); pintarAcciones();
}
function verInfoCarta(id) { info.hidden = false; info.innerHTML = `<div class="ficha">${htmlCarta(id, { mini: true })}<div><b>${esc(nom(id))}</b><small>${textoCarta(id)}</small></div></div>`; }
function verInfoUnidad(u) {
  const visible = u.p === YO || u.arriba, botones = [];
  const mio = u.p === YO && S.juega === YO && !S.fin && modo !== 'ia';
  let html;
  if (u.lider) html = `<div class="ficha"><span class="dib grande">${u.p === YO ? '🧑' : RIVAL.e}</span><div><b>${esc(u.p === YO ? DEF.nombre : RIVAL.quien)} · líder</b><small>👑 ${esc(LIDERES[u.clase].n)}: ${esc(LIDERES[u.clase].txt)}<br>Si un bicho le golpea, pierdes todo su ataque de vida.${mio && !u.hecho ? '<br>Toca una casilla azul para moverte.' : ''}</small></div></div>`;
  else if (!visible) html = `<div class="ficha"><span class="dib grande">🂠</span><div><b>Carta boca abajo</b><small>Puede ser un bicho… o una trampa. Solo hay una forma de saberlo.</small></div></div>`;
  else {
    const C = CARTAS[u.c], ter = R.ajusteTerreno(S, u);
    html = `<div class="ficha">${htmlCarta(u.c, { mini: true })}<div><b>${esc(C.n)}${u.arriba ? '' : ' <i class="oculta">(boca abajo)</i>'}</b><small>${textoCarta(u.c)}${C.k === 'bicho' ? `<br>Ahora: ⚔${R.ataqueDe(S, u)} 🛡${R.defensaDe(S, u)} · en ${u.def ? 'defensa' : 'ataque'}${ter ? ` · terreno ${ter > 0 ? '+' : ''}${ter}` : ''}${u.red > 0 ? ' · 🕸️ pegado' : ''}` : ''}</small></div></div>`;
    if (mio && !u.trampa) {
      if (!u.arriba) botones.push(`<button data-u="voltear">🔄 Destapar</button>`);
      if (!u.cambio && !u.hecho && u.red <= 0) botones.push(`<button data-u="posicion">${u.def ? '⚔️ A ataque' : '🛡️ A defensa'}</button>`);
      if (u.hecho) botones.push('<small class="hecho">Ya ha hecho lo suyo este turno.</small>');
      else if (u.def) botones.push('<small class="hecho">En defensa no ataca (sí se mueve).</small>');
    }
  }
  info.hidden = false; info.innerHTML = html + (botones.length ? `<div class="fila-botones">${botones.join('')}</div>` : '');
  info.querySelectorAll('[data-u]').forEach((b) => b.onclick = async () => { const uid = u.id; (b.dataset.u === 'voltear' ? R.voltear : R.cambiarPosicion)(S, uid); await procesar(); const v = S.u.find((w) => w.id === uid); if (v) elegirUnidad(v); });
}
async function terminarTurno() {
  if (!S || S.juega !== YO || jugando) return;
  cancelar(); R.finTurno(S); await procesar(); if (!S.fin) await turnoRival();
}
async function autoTurno() {   // solo en pruebas: la máquina juega tu turno
  if (!S || S.juega !== YO || jugando) return; cancelar(); modo = 'ia';
  for (let i = 0; i < 80 && S.juega === YO && !S.fin; i++) { const a = R.accionIA(S, YO, R.PERFILES.agresivo); if (a.t === 'fin' || !R.aplicar(S, YO, a)) break; await procesar(); }
  modo = 'yo'; if (S.juega === YO && !S.fin) { R.finTurno(S); await procesar(); } if (!S.fin) await turnoRival();
}
async function turnoRival() {
  modo = 'ia'; pintarAcciones(); await espera(500);
  const perfil = R.PERFILES[RIVAL.perfil];
  for (let i = 0; i < 80 && S.juega === EL && !S.fin; i++) {
    const a = R.accionIA(S, EL, perfil);
    if (a.t === 'fin') { R.finTurno(S); await procesar(); break; }
    if (!R.aplicar(S, EL, a)) { R.finTurno(S); await procesar(); break; }
    await procesar(); await espera(260);
  }
  if (S.juega === EL && !S.fin) { R.finTurno(S); await procesar(); }
  modo = 'yo'; pintarMano(); pintarAcciones();
  if (!S.fin) aviso('🃏 Tu turno', 1200);
}

// ---------- animar lo que ha pasado ----------
const avisoEl = $('#aviso'); let tAviso = 0;
function aviso(html, ms = 1800) { avisoEl.innerHTML = html; avisoEl.hidden = false; clearTimeout(tAviso); tAviso = setTimeout(() => { avisoEl.hidden = true; }, ms); }
const quien = (p) => p === YO ? 'Tú' : RIVAL.quien;
async function procesar() {
  jugando = true; let cerca = false;
  while (S.ev.length) {
    const e = S.ev.shift();
    switch (e.t) {
      case 'fusion':
        if (e.p === YO) { K().libro ||= {}; if (!K().libro[e.clave]) { K().libro[e.clave] = e.r; aviso(`🌀 ¡FUSIÓN NUEVA! ${esc(nom(e.a))} + ${esc(nom(e.b))} → <b>${esc(nom(e.r))}</b><br><small>Apuntada en tu libro.</small>`, 2600); guardar(); } else aviso(`🌀 ¡Fusión! ${esc(nom(e.a))} + ${esc(nom(e.b))} → <b>${esc(nom(e.r))}</b>`, 2000); }
        else aviso(`🌀 ¡${esc(RIVAL.quien)} fusiona! ${esc(nom(e.a))} + ${esc(nom(e.b))} → <b>${esc(nom(e.r))}</b>`, 2200);
        sonido.moneda?.(); await espera(1300); break;
      case 'fallo': aviso(`💨 ${esc(nom(e.a))} y ${esc(nom(e.b))} no fusionan. ${esc(nom(e.a))} se pierde.`, 1800); await espera(1100); break;
      case 'equipa': aviso(`🗡️ ${esc(nom(e.a || ''))} ${e.a ? 'sale equipado con' : 'se equipa'} ${esc(nom(e.b))}`, 1500); await espera(600); break;
      case 'perdida': aviso(`🗑️ ${esc(nom(e.c))} no tenía dónde ir y se pierde.`, 1500); await espera(700); break;
      case 'invoca': case 'pone': ponerFigura(S, e.u, YO); await caer(e.uid); break;
      case 'magia': aviso(`${CARTAS[e.c].e} ${esc(quien(e.p))}: <b>${esc(nom(e.c))}</b>`, 1600); await espera(800); break;
      case 'terreno': aviso(`${CARTAS[e.c].e} ${esc(quien(e.p))} juega <b>${esc(nom(e.c))}</b>`, 1500); pintarTablero(S, true); await espera(600); break;
      case 'mueve': await moverFigura(e.uid, e.x, e.y); break;
      case 'voltea': { const u = S.u.find((v) => v.id === e.uid); if (u) rehacer(S, e.uid, YO); const f = figura(e.uid); if (f) ui.chispas(f.position.clone().setY(.4), '#ffffff', 10, 2); await espera(250); break; }
      case 'posicion': rehacer(S, e.uid, YO); break;
      case 'combate': {
        const a = casillaDe(e.at), b = casillaDe(e.de); if (a && b) { await primerPlano(a, b); cerca = true; }
        const fa = figura(e.at), fb = figura(e.de);
        if (fa) ui.numero(fa.position.clone().setY(1.3), '⚔' + e.a, '#ff8a5a'); if (fb && !e.lider) ui.numero(fb.position.clone().setY(1.3), (e.def ? '🛡' : '⚔') + e.v, e.def ? '#5aa8ff' : '#ff8a5a');
        sonido.golpe?.(); await espera(800); break;
      }
      case 'destruye': await hundir(e.uid); break;
      case 'dano': { const L = S.u.find((u) => u.lider && u.p === e.p), f = L && figura(L.id); if (f) { ui.numero(f.position.clone().setY(1.4), '−' + e.n, '#ff4a4a'); sacudir(L.id); } pintarHUD(); await espera(500); break; }
      case 'cura': { const L = S.u.find((u) => u.lider && u.p === e.p), f = L && figura(L.id); if (f) ui.numero(f.position.clone().setY(1.4), '+' + e.n, '#5ad85a'); pintarHUD(); await espera(400); break; }
      case 'trampa': aviso(`🪤 ¡Trampa! <b>${esc(nom(e.c))}</b>`, 1800); { const f = figura(e.uid); if (f) ui.chispas(f.position.clone().setY(.4), '#d0a8ff', 20, 3); } await espera(900); break;
      case 'pegado': { const f = figura(e.uid); if (f) ui.numero(f.position.clone().setY(1.2), '🕸️ pegado', '#e8e8e8'); await espera(300); break; }
      case 'debilita': { const f = figura(e.uid); if (f) ui.numero(f.position.clone().setY(1.2), '−' + e.n + ' ⚔', '#ff8a5a'); await espera(300); break; }
      case 'turno': pintarHUD(); break;
    }
  }
  if (cerca) await vistaMesa();
  sincronizar(S, YO); pintarHUD(); pintarMano(); pintarAcciones(); jugando = false;
  if (S.fin) await terminar();
}

// ---------- final y tragaperras ----------
async function terminar() {
  modo = 'fin'; acciones.innerHTML = ''; info.hidden = true; await espera(900);
  const gano = S.fin.gana === YO, motivo = R.TEXTOS_FIN[S.fin.motivo] || '';
  if (!gano) {
    mostrar(`<h2>${S.fin.gana === -1 ? '🤝 Empate' : '💀 Has perdido'}<small>${S.fin.gana === -1 ? 'Turno 99 y la misma vida. Qué cosas.' : { vida: 'Te has quedado sin vida.', rodeado: 'Te han rodeado al líder.', mazo: 'Te has quedado sin cartas.', tiempo: 'Turno 99, y tenía más vida.' }[S.fin.motivo] || ''}</small></h2><p>${esc(RIVAL.quien)}: «${['Vuelve cuando quieras. Traigo pañuelos.', 'Otra vez será, campeón.', 'Las cartas no mienten. Tú sí, al decir que ibas a ganar.'][Math.floor(Math.random() * 3)]}»</p><div class="fila-botones"><button class="grande" id="bOtra">⚔️ Otra</button><button id="bMenu">🃏 Al menú</button></div>`);
    $('#bOtra').onclick = () => empezarDuelo(RIVAL); $('#bMenu').onclick = () => pantallaMenu('duelos'); return;
  }
  K().victorias[RIVAL.id] = (K().victorias[RIVAL.id] || 0) + 1;
  // la tragaperras: todo su cementerio y dos al azar de lo que le quedaba en el mazo
  const resto = [...S.mazo[EL], ...S.mano[EL]], bolsa = [...S.cem[EL]];
  for (let i = 0; i < 2 && resto.length; i++) bolsa.push(resto.splice(Math.floor(Math.random() * resto.length), 1)[0]);
  const premio = bolsa[Math.floor(Math.random() * bolsa.length)] || 'rata';
  K().coleccion[premio] = (K().coleccion[premio] || 0) + 1; guardar();
  mostrar(`<h2>🏆 ¡Has ganado!<small>${esc(RIVAL.quien)} ${motivo}.</small></h2><p>🎰 La tragaperras gira con su cementerio y dos cartas de su mazo…</p><div id="rodillo" class="rodillo">${htmlCarta(bolsa[0])}</div><p id="premioTxt" class="nota"> </p><div class="fila-botones"><button class="grande" id="bOtra">⚔️ Revancha</button><button id="bMenu">🃏 Al menú</button></div>`);
  $('#bOtra').onclick = () => empezarDuelo(RIVAL); $('#bMenu').onclick = () => pantallaMenu('duelos');
  const rod = $('#rodillo');
  for (let i = 0; i < 18; i++) { rod.innerHTML = htmlCarta(bolsa[Math.floor(Math.random() * bolsa.length)]); await espera(60 + i * 12); }
  rod.innerHTML = htmlCarta(premio); rod.classList.add('premio'); sonido.moneda?.();
  $('#premioTxt').innerHTML = `Te llevas <b>${esc(nom(premio))}</b> a tu colección. Métela en el mazo desde «Mi mazo».`;
}

// ---------- arranque ----------
$('#lienzo').addEventListener('click', (e) => tocarTablero(e.clientX, e.clientY));
async function arrancar() {
  if (!DEF) DEF = await cargarHeroe();
  if (DEBUG) modoDebug();
  if (!DEF) { mostrar('<h2>🃏 Cartas de Velmor</h2><p>Necesitas un héroe para jugar. Créalo en el pueblo y vuelve.</p><a class="boton" href="pueblo.html">🏘 Al pueblo</a>'); return; }
  DEF.cartas ||= {}; K().libro ||= {}; K().victorias ||= {}; K().coleccion ||= {};
  if (!K().mazo?.length) pantallaElegir(); else pantallaMenu('duelos');
}
arrancar();
window.cartas = { get S() { return S; }, get DEF() { return DEF; }, R, autoTurno };
window.cartas3d = C3;
