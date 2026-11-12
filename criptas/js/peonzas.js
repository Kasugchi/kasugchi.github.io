// =============================================================
//  LAS PEONZAS DE RUFO (peonzas.html): taller, tienda, retos a los del pueblo y duelo con apuesta de chatarra por la sala.
//  Reglas puras en peonzas-reglas.js; el plato y las animaciones, en peonzas-3d.js.
//  Se guarda en el héroe de aventura (peonza) y la chatarra es la misma de los robots.
//  Duelo por sala: los dos eligen tiro a la vez; cada uno publica sus tiros (peonOrden) y las dos pantallas
//  resuelven cada ronda con la misma semilla, así que ven lo mismo sin que mande ninguna.
// =============================================================
import { poner, lanzar, reproducir, terminar, verGiro, sonido } from './peonzas-3d.js';
import { RUMBOS, EFECTOS, HUECOS_PEONZA, PIEZAS_P, AJUSTES, RIVALES_P, TEXTOS_FIN, MAX_SEGMENTOS, peonzaNueva, arreglarP, luchadora, empezar, giroInicial, tieneOpciones, segmento, porTiempo, textoLanzador, semilla, azar, decisionIA, especRival } from './peonzas-reglas.js';
import { leerLocal, cargarHeroe, guardarHeroe } from './claro-heroes.js';

const $ = (s) => document.querySelector(s);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const leerJSON = (t) => { try { return JSON.parse(t || 'null'); } catch { return null; } };

// ---------- tu peonza (en el héroe de aventura) ----------
let DEF = leerLocal();
const Q = () => DEF?.peonza;
const chatarra = () => DEF?.materiales?.chatarra || 0;
// ?debug=1: taller de pruebas con todas las piezas y chatarra de sobra. Trabaja sobre una copia y NUNCA guarda, así que tu héroe real no se toca.
const DEBUG = new URLSearchParams(location.search).has('debug');
function guardar() { if (DEF && !DEBUG) guardarHeroe(DEF); publicar(); }
function modoDebug() {
  DEF = structuredClone(DEF); DEF.materiales ||= {}; DEF.materiales.chatarra = 9999; DEF.oro = 9999;
  DEF.peonza ||= peonzaNueva(); DEF.peonza.piezas = Object.keys(PIEZAS_P); DEF.peonza.liga = RIVALES_P.length - 1;
  const b = document.createElement('div'); b.textContent = '🧪 MODO PRUEBAS · todo desbloqueado · no se guarda nada';
  b.style.cssText = 'position:fixed;left:50%;bottom:4px;transform:translateX(-50%);z-index:50;background:#7a1fa2;color:#fff;font:700 11px Nunito,sans-serif;padding:3px 10px;border-radius:9px;pointer-events:none;opacity:.9'; document.body.appendChild(b);
}
const miEspec = () => { const q = Q(); return { nombre: q.nombre, piloto: DEF.nombre || '', equipo: { ...q.equipo }, ajuste: q.ajuste, cha: chatarra() }; };

// ---------- la sala ----------
let SALA = null, GENTE = {};
const yoId = () => SALA?.yo.id || 'yo';
function publicar() { if (SALA && DEF?.peonza) SALA.cambiar({ peon: JSON.stringify(miEspec()) }); }
const enLaPlaza = () => Object.values(GENTE).filter((g) => g.id !== SALA?.yo.id && g.donde === 'peonzas' && g.online !== false && leerJSON(g.peon));

// ---------- pantallas ----------
const panel = $('#panel');
let pantalla = '', pestana = 'peonza', jugando = false;
const mostrar = (html, cual = '') => { panel.innerHTML = html; panel.hidden = false; pantalla = cual; panel.scrollTop = 0; };
const ocultar = () => { panel.hidden = true; pantalla = ''; };
const narrar = (t) => { const n = $('#narrar'); n.innerHTML = t; n.hidden = !t; };
const barra = (e, v, max, c) => `<div class="stat" style="--c:${c};--p:${Math.min(100, v / max * 100)}%"><span>${e}</span><i></i><em>${v}</em></div>`;
const textoPieza = (P) => P.hueco === 'lanzador' ? textoLanzador(P) : `${P.a ? `⚔️${P.a} ` : ''}${P.p ? `🛡️${P.p} ` : ''}${P.g ? `🌀${P.g}` : ''}${P.efecto ? ` · ${EFECTOS[P.efecto].e} ${EFECTOS[P.efecto].n} ×${P.cargas}` : ''}`;

function pestanas() { return `<div class="pestanas">${[['peonza', '🌀 Tu peonza'], ['tienda', '🛠️ Rufo'], ['retos', '🏆 Retos']].map(([k, t]) => `<button data-p="${k}" class="${pestana === k ? 'activa' : ''}">${t}</button>`).join('')}</div>`; }
function pantallaTaller(p = pestana) {
  pestana = p; if (!jugando) poner([Q().equipo], [luchadora(miEspec()).s]);
  const html = p === 'tienda' ? htmlTienda() : p === 'retos' ? htmlRetos() : htmlPeonza();
  mostrar(pestanas() + html, 'taller');
  panel.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => pantallaTaller(b.dataset.p));
  (p === 'tienda' ? alTienda : p === 'retos' ? alRetos : alPeonza)();
}

// --- tu peonza ---
function htmlPeonza() {
  const q = Q(), L = luchadora({ ...miEspec() }), ef = L.efecto ? EFECTOS[L.efecto] : null;
  const huecos = Object.entries(HUECOS_PEONZA).map(([h, H]) => `<div class="hueco"><b>${H.e} ${H.n}</b><div class="piezas">${[...new Set(q.piezas)].filter((id) => PIEZAS_P[id].hueco === h).map((id) => `<button data-pz="${id}" class="${q.equipo[h] === id ? 'puesta' : ''}">${esc(PIEZAS_P[id].n)}<small>${textoPieza(PIEZAS_P[id])}</small></button>`).join('')}</div></div>`).join('');
  return `<h2>${esc(q.nombre)}<small>${q.victorias} ganadas · ${q.derrotas} perdidas</small></h2>
    ${barra('⚔️', L.A, 12, '#e8584a')}${barra('🛡️', L.P, 12, '#5a8ac8')}${barra('🌀', L.G, 12, '#5ac85a')}
    <p class="nota">Gira hacia la <b>${L.s > 0 ? 'derecha ↻' : 'izquierda ↺'}</b> y sale con <b>${giroInicial(L, 1)}</b> de giro (lo pesada que sea le resta). ⚔️ la hace perseguir y pegar fuerte · 🛡️ aguanta los golpes y empuja · 🌀 gasta el giro más despacio. Si gira al revés que la otra, se engranan y se comen el giro.</p>
    ${ef ? `<div class="efecto">${ef.e} <b>${ef.n}</b> ×${L.cargas}: ${ef.t}</div>` : ''}
    <div class="hueco"><b>🔧 Apretar tuercas</b><div class="tuercas">${AJUSTES.map((a) => `<button data-aj="${a}" class="${q.ajuste === a ? 'puesta' : ''}">${a > 0 ? '+' : ''}${a}</button>`).join('')}</div>
    <small class="nota">Cada punto de ataque que le metes te quita 2 de aguante (y al revés). Ahora: ${q.ajuste > 0 ? `+${q.ajuste} ataque, ${-2 * q.ajuste} aguante` : q.ajuste < 0 ? `${q.ajuste} ataque, +${-2 * q.ajuste} aguante` : 'a pelo, sin tocar'}.</small></div>
    ${huecos}
    <div class="fila-botones"><button id="bNombre">✏️ Nombre</button><button id="bRetos" class="grande">🌀 ¡Al plato!</button></div>`;
}
function alPeonza() {
  const q = Q();
  panel.querySelectorAll('[data-pz]').forEach((b) => b.onclick = () => { const P = PIEZAS_P[b.dataset.pz]; q.equipo[P.hueco] = b.dataset.pz; guardar(); pantallaTaller('peonza'); });
  panel.querySelectorAll('[data-aj]').forEach((b) => b.onclick = () => { q.ajuste = +b.dataset.aj; guardar(); pantallaTaller('peonza'); });
  $('#bNombre').onclick = () => { const n = prompt('¿Cómo se llama tu peonza?', q.nombre); if (n && n.trim()) { q.nombre = n.trim().slice(0, 20); guardar(); pantallaTaller('peonza'); } };
  $('#bRetos').onclick = () => pantallaTaller('retos');
}

// --- la tienda de Rufo ---
function htmlTienda() {
  const q = Q(), sueltas = Object.entries(PIEZAS_P).filter(([id, P]) => P.precio), premios = Object.entries(PIEZAS_P).filter(([id, P]) => P.premio);
  return `<h2>🛠️ El puesto de Rufo<small>⚙️ ${chatarra()} de chatarra · 🪙 ${DEF.oro || 0}</small></h2>
    <p>«Piezas de peonza, hechas con lo que otros tiran. Ni una sola ha sido robada. Casi.»</p>
    <div class="tienda">${sueltas.map(([id, P]) => { const tengo = q.piezas.includes(id), ok = chatarra() >= P.precio.chatarra && (DEF.oro || 0) >= P.precio.oro; return `<button data-compra="${id}" ${tengo || !ok ? 'disabled' : ''}><span>${HUECOS_PEONZA[P.hueco].e} ${esc(P.n)}<small>${textoPieza(P)}</small></span><span class="pr">${tengo ? '✔ tuya' : `⚙️ ${P.precio.chatarra} · 🪙 ${P.precio.oro}`}</span></button>`; }).join('')}</div>
    <h3 class="sala">Solo se ganan</h3><p class="nota">${premios.map(([id, P]) => `${HUECOS_PEONZA[P.hueco].e} <b>${esc(P.n)}</b> (${q.piezas.includes(id) ? 'ya la tienes' : 'se la quitas a ' + esc(P.premio)})`).join(' · ')}</p>`;
}
function alTienda() {
  panel.querySelectorAll('[data-compra]').forEach((b) => b.onclick = () => {
    const id = b.dataset.compra, P = PIEZAS_P[id]; if (chatarra() < P.precio.chatarra || (DEF.oro || 0) < P.precio.oro || Q().piezas.includes(id)) return;
    DEF.materiales.chatarra -= P.precio.chatarra; DEF.oro -= P.precio.oro; Q().piezas.push(id); guardar(); sonido.recoger?.(); pantallaTaller('tienda');
  });
}

// --- los retos: la liga de Rufo y la gente de la sala ---
function htmlRetos() {
  const q = Q();
  const liga = RIVALES_P.map((r, i) => {
    const abierto = i <= q.liga, premio = Object.entries(PIEZAS_P).find(([id, P]) => P.premio === r.quien);
    const ap = Math.min(r.apuesta, chatarra());
    return `<div class="rival ${abierto ? '' : 'cerrado'}"><b>${i < q.liga ? '✔ ' : ''}${esc(r.quien)} · ${esc(r.nombre)}</b><small>«${esc(r.frase)}»</small>${premio && !q.piezas.includes(premio[0]) ? `<small>🎁 Si le ganas: ${esc(premio[1].n)}</small>` : ''}
      <div class="fila-botones"><button data-ia="${i}" data-ap="0" ${abierto ? '' : 'disabled'}>Entrenar</button><button data-ia="${i}" data-ap="${ap}" class="grande" ${abierto ? '' : 'disabled'}>${ap ? `Apostar ⚙️ ${ap}` : 'Jugar'}</button></div></div>`;
  }).join('');
  return `<h2>🏆 La liga de Rufo<small>⚙️ ${chatarra()} de chatarra · gana a uno para abrir al siguiente</small></h2>${liga}<h3 class="sala">👥 Con la sala</h3><div id="plaza">${htmlPlaza()}</div>`;
}
function htmlPlaza() {
  if (!SALA) return `<p class="nota">Abrid la misma sala con el botón 👥 y entrad los dos a las peonzas: aquí saldrá para retaros a una apuesta de chatarra.</p>`;
  const otros = enLaPlaza();
  if (!otros.length) return `<p class="nota">Sala ${esc(SALA.codigo)}: cuando otro de la sala entre en las peonzas, saldrá aquí.</p>`;
  return otros.map((g) => { const e = leerJSON(g.peon), tope = Math.min(chatarra(), e.cha || 0); return `<div class="otro"><b>${esc(e.piloto || g.nombre)}</b> · ${esc(e.nombre)} <small>(⚙️ ${e.cha || 0})</small>
    <div class="fila-botones">${[0, 1, 3, 5, 10].map((n) => `<button data-reto="${g.id}" data-ap="${n}" ${n > tope ? 'disabled' : ''}>${n ? '⚙️ ' + n : 'Por jugar'}</button>`).join('')}</div></div>`; }).join('');
}
const firmaDeSala = () => (SALA ? SALA.codigo + enLaPlaza().map((g) => g.id + g.peon).join('|') + chatarra() : '');
function alRetos() {
  panel.querySelectorAll('[data-ia]').forEach((b) => b.onclick = () => retoIA(+b.dataset.ia, +b.dataset.ap));
  panel.querySelectorAll('[data-reto]').forEach((b) => b.onclick = () => retar(b.dataset.reto, +b.dataset.ap));
}

// ---------- contra los de Rufo ----------
function retoIA(i, apuesta) {
  const r = RIVALES_P[i], n = Date.now();
  jugar({ tipo: 'ia', yo: 0, espec: [miEspec(), especRival(i)], apuesta, id: n, seed: n, rival: i });
}

// ---------- contra alguien de la sala ----------
let ESPERA = null, ACEPTADO = null, VISTOS = {};
function retar(id, apuesta) {
  if (!SALA || jugando) return; const n = Date.now(), g = GENTE[id], e = leerJSON(g?.peon);
  ESPERA = { n, id, apuesta, seed: n };
  SALA.cambiar({ peonReto: JSON.stringify({ para: id, n, apuesta, seed: n }) });
  mostrar(`<h2>Retando a ${esc(e?.piloto || g?.nombre)}…</h2><p>${apuesta ? `Apuesta: ⚙️ ${apuesta} de chatarra cada uno.` : 'Una partida por jugar, sin apuesta.'} Esperando a que acepte.</p><div class="fila-botones"><button id="bCancelar">Cancelar</button></div>`, 'espera');
  $('#bCancelar').onclick = () => { ESPERA = null; SALA?.cambiar({ peonReto: null }); pantallaTaller('retos'); };
  setTimeout(() => { if (ESPERA?.n === n) { ESPERA = null; SALA?.cambiar({ peonReto: null }); if (pantalla === 'espera') pantallaTaller('retos'); aviso(`${esc(e?.piloto || 'El otro')} no contesta. Igual está en el baño.`); } }, 60000);
}
function aviso(t) { const r = $('#reto'); r.innerHTML = `<p>${t}</p>`; r.hidden = false; setTimeout(() => { r.hidden = true; }, 4000); }
function mostrarReto(id, g, reto) {
  const e = leerJSON(g.peon), r = $('#reto'), cuesta = reto.apuesta, puedo = chatarra() >= cuesta;
  r.innerHTML = `<p><b>${esc(e?.piloto || g.nombre)}</b> te reta a las peonzas${cuesta ? ` a ⚙️ ${cuesta} de chatarra cada uno` : ' (por jugar, sin apuesta)'}.</p>${puedo ? '' : '<small>No tienes tanta chatarra para aceptar.</small>'}
    <div class="fila-botones"><button id="bSi" class="grande" ${puedo ? '' : 'disabled'}>¡Acepto!</button><button id="bNo">Ahora no</button></div>`; r.hidden = false;
  $('#bSi').onclick = () => { r.hidden = true; if (jugando || !Q()) return; ACEPTADO = reto.n; publicar(); SALA.cambiar({ peonSi: reto.n }); jugar({ tipo: 'sala', yo: 1, espec: [{ ...e }, miEspec()], apuesta: cuesta, id: reto.n, seed: reto.seed, rivalId: id }); };
  $('#bNo').onclick = () => { r.hidden = true; SALA?.cambiar({ peonNo: reto.n }); };
}
function alGente(gente) {
  GENTE = gente; const yo = SALA?.yo.id;
  for (const [id, g] of Object.entries(gente)) {
    if (id === yo) continue;
    const reto = leerJSON(g.peonReto);
    if (reto && reto.para === yo && reto.n !== VISTOS[id]) { VISTOS[id] = reto.n; if (jugando || ESPERA || !Q()) SALA.cambiar({ peonNo: reto.n }); else mostrarReto(id, g, reto); }
    if (ESPERA && ESPERA.id === id) {
      if (g.peonSi === ESPERA.n) { const e = ESPERA; ESPERA = null; const rival = leerJSON(g.peon); jugar({ tipo: 'sala', yo: 0, espec: [miEspec(), rival], apuesta: e.apuesta, id: e.n, seed: e.seed, rivalId: id }); }
      else if (g.peonNo === ESPERA.n) { ESPERA = null; pantallaTaller('retos'); aviso('Dice que ahora no.'); }
    }
  }
  if (jugando) revisarEspera();
  if (pantalla === 'taller' && pestana === 'retos') { const f = firmaDeSala(); if (f !== firmaDeSala.ant) { firmaDeSala.ant = f; const pl = $('#plaza'); if (pl) { pl.innerHTML = htmlPlaza(); alRetos(); } } }
}
// Esperar a que el otro publique algo (su lanzamiento o su tiro de la ronda n)
const ESP = [];
function rivalOrden(c) { const o = leerJSON(GENTE[c.rivalId]?.peonOrden); return o && o.id === c.id ? o : null; }
function revisarEspera() { for (const e of [...ESP]) { const o = rivalOrden(e.c); if (o && e.cond(o)) { ESP.splice(ESP.indexOf(e), 1); clearTimeout(e.t); e.ok(o); } } }
function esperarRival(c, cond) {
  return new Promise((ok) => {
    const e = { c, cond, ok, t: setTimeout(() => { narrar('El otro tarda… <button id="bDar">Dar por ganada</button>'); $('#bDar').onclick = () => { ESP.splice(ESP.indexOf(e), 1); ok({ fin: 'ausente' }); }; }, 40000) };
    ESP.push(e); revisarEspera();
  });
}
const publicarOrden = (c, campos) => { c.mi = { ...c.mi, ...campos }; SALA?.cambiar({ peonOrden: JSON.stringify({ id: c.id, ...c.mi }) }); };

// ---------- una partida ----------
function pintarBarras(c) {
  [['#yo', 0], ['#el', 1]].forEach(([sel, i]) => {
    const e = c.espec[i], L = c.L[i], t = c.T?.[i], w = t ? Math.max(0, t.w) : giroInicial(L, 1), w0 = t ? t.w0 : w, ef = L.efecto ? EFECTOS[L.efecto] : null;
    $(sel).innerHTML = `<div class="luchador"><b>${esc(e.piloto || e.nombre)}${i === c.yo ? ' (tú)' : ''}</b> <small>${esc(e.nombre)} · ${L.s > 0 ? '↻' : '↺'}</small>
      <div class="barra"><span>🌀</span><i style="--p:${w / w0 * 100}%"></i><em>${Math.round(w)}</em></div>
      <div class="barra borde"><span>${t && t.emp ? '🎯' : ''}</span><i style="--p:${t ? t.emp / Math.max(1, L.emp) * 100 : 0}%"></i><em>${t && ef ? ef.e + t.cargas : ''}</em></div></div>`;
    verGiro(i, t ? w / w0 : 1);
  });
}
function lanzamiento() {
  return new Promise((ok) => {
    const l = $('#lanza'); l.innerHTML = `<p>🎯 ¡Lanzamiento! Suelta con la barra en el centro verde: cuanto mejor, más giro de salida.</p><div class="medidor"><i id="cursor"></i></div><button id="bSuelta">¡Suelta!</button>`; l.hidden = false;
    let u = 0, vivo = true; const t0 = performance.now();
    (function paso() { if (!vivo) return; u = .5 + .5 * Math.sin((performance.now() - t0) / 380); $('#cursor').style.left = u * 100 + '%'; requestAnimationFrame(paso); })();
    $('#bSuelta').onclick = () => { vivo = false; const q = Math.max(0, 1 - Math.abs(u - .5) * 2.4); l.innerHTML = `<p>${q > .85 ? '¡Lanzamiento perfecto! 🌟' : q > .5 ? '¡Buen lanzamiento!' : q > .2 ? 'Regulero… pero gira.' : 'Eso ha sido un estornudo, no un lanzamiento.'}</p>`; setTimeout(() => { l.hidden = true; ok(Math.round(q * 20) / 20); }, 900); };
  });
}
// Entre tramo y tramo: empujones y efecto (solo si tienes algo que gastar). Si no eliges, sigue sola.
function elegir(c, seg) {
  return new Promise((ok) => {
    const L = c.L[c.yo], t = c.T[c.yo], ef = L.efecto ? EFECTOS[L.efecto] : null, b = $('#botones');
    let rumbo = null, con = false, resto = 8, vivo = true;
    const fin = (r) => { if (!vivo) return; vivo = false; clearInterval(tm); b.hidden = true; ok(r); };
    b.innerHTML = (t.emp > 0 ? Object.entries(RUMBOS).map(([k, R]) => `<button class="tiro" data-r="${k}"><span>${R.e}</span>${R.n}</button>`).join('') : '')
      + (ef && t.cargas > 0 ? `<button class="ef" id="bEf" title="${esc(ef.t)}"><span>${ef.e}</span>${ef.n} ×${t.cargas}<small>${esc(ef.t)}</small></button>` : '')
      + '<button class="ef" id="bSigue"><span>▶️</span>Seguir<small id="cuenta"></small></button>'
      + (c.tipo === 'sala' ? '<button class="suelta" id="bRinde">🏳️ Rendirme</button>' : '');
    b.hidden = false;
    const pintar = () => { $('#cuenta') && ($('#cuenta').textContent = `(${resto} s)`); narrar(`Tramo ${seg + 1}${t.emp ? ` · 🎯 ${t.emp} empujón${t.emp > 1 ? 'es' : ''}` : ''}${ef && t.cargas ? ` · ${ef.e} ${t.cargas}` : ''}<small>Un empujón cambia hacia dónde va tu peonza; el efecto dura todo el tramo.</small>`); };
    pintar(); const tm = setInterval(() => { resto--; pintar(); if (resto <= 0) fin({ r: rumbo, x: con }); }, 1000);
    b.querySelectorAll('[data-r]').forEach((x) => x.onclick = () => { rumbo = rumbo === x.dataset.r ? null : x.dataset.r; b.querySelectorAll('[data-r]').forEach((y) => y.classList.toggle('on', y.dataset.r === rumbo)); });
    $('#bEf') && ($('#bEf').onclick = () => { con = !con; $('#bEf').classList.toggle('on', con); });
    $('#bSigue').onclick = () => fin({ r: rumbo, x: con });
    $('#bRinde') && ($('#bRinde').onclick = () => { if (!confirm('¿Te rindes? Pierdes la apuesta.')) return; fin({ rendido: true }); });
  });
}
async function jugar(c) {
  jugando = true; ESPERA = null; c.mi = {}; c.hist = {}; c.L = c.espec.map(luchadora); c.T = null;
  const yo = c.yo, rivalIA = c.tipo === 'ia' ? RIVALES_P[c.rival] : null, rIA = azar(semilla('ia', c.seed));
  ocultar(); $('#reto').hidden = true; poner(c.espec.map((e) => e.equipo), c.L.map((l) => l.s)); pintarBarras(c); $('#barras').hidden = false;
  narrar(`${c.apuesta ? `⚙️ ${c.apuesta} de chatarra en juego. ` : ''}${c.L[0].s !== c.L[1].s ? '¡Giran en sentido contrario! Si se tocan, se engranan.' : `Giran las dos hacia la ${c.L[0].s > 0 ? 'derecha ↻' : 'izquierda ↺'}: si se tocan, rebotan.`}`);
  await espera(1200);
  const q = await lanzamiento(), lz = [0, 0]; lz[yo] = q;
  if (c.tipo === 'ia') lz[1 - yo] = .45 + rIA() * .45;
  else { publicarOrden(c, { lz: q }); narrar('Esperando el lanzamiento del otro…'); const o = await esperarRival(c, (x) => x.lz != null || x.fin); if (o.fin) return acabar(c, yo, 'El otro se ha ido', o.fin === 'ausente'); lz[1 - yo] = o.lz; }
  c.T = empezar(c.L, lz); narrar(''); pintarBarras(c); await lanzar(c.T); await espera(300);
  for (let seg = 0; seg < MAX_SEGMENTOS; seg++) {
    const op = [0, 1].map((i) => tieneOpciones(c.L[i], c.T[i])), ord = [{}, {}];
    if (op[yo]) {
      const mio = await elegir(c, seg);
      if (mio.rendido) { publicarOrden(c, { fin: 'rendido' }); await terminar(1 - yo, 'parada'); return acabar(c, 1 - yo, 'Te has rendido'); }
      ord[yo] = mio; if (c.tipo === 'sala') { c.hist[seg] = [mio.r || '', mio.x ? 1 : 0]; publicarOrden(c, { h: c.hist }); }
    }
    if (c.tipo === 'ia') { if (op[1 - yo]) ord[1 - yo] = decisionIA(rivalIA, c.L[1 - yo], c.T[1 - yo], azar(semilla('ia', c.seed, seg)), seg); }
    else if (op[1 - yo]) {
      narrar('Esperando al otro…'); const o = await esperarRival(c, (x) => x.fin || (x.h && x.h[seg] != null));
      if (o.fin) return acabar(c, yo, o.fin === 'rendido' ? 'El otro se ha rendido' : 'El otro se ha ido', o.fin === 'ausente');
      ord[1 - yo] = { r: o.h[seg][0] || null, x: !!o.h[seg][1] };
    }
    const res = segmento(c.L, c.T, ord, azar(semilla('s', c.seed, seg)));
    const gasta = res.ev.filter((e) => e.k === 'efecto' || e.k === 'empujon').map((e) => `${esc(c.espec[e.i].piloto || c.espec[e.i].nombre)}: ${e.k === 'efecto' ? EFECTOS[e.ef].e + ' ' + EFECTOS[e.ef].n : '🎯 empujón'}`);
    narrar(gasta.length ? gasta.join(' · ') : '');
    await reproducir(res); c.T = res.T; pintarBarras(c);
    const fin = res.fin || (seg === MAX_SEGMENTOS - 1 ? porTiempo(c.T) : null);
    if (fin) {
      const cae = 1 - fin.ganador, nom = cae === yo ? 'Tu peonza' : c.tipo === 'ia' ? c.espec[cae].nombre : `La peonza de ${c.espec[cae].piloto || 'tu rival'}`;
      narrar(fin.motivo === 'fuera' ? '¡FUERA DEL PLATO!' : '¡Se ha parado!'); await terminar(fin.ganador, fin.motivo);
      return acabar(c, fin.ganador, `${nom} ${TEXTOS_FIN[fin.motivo]}`);
    }
  }
}
function acabar(c, ganador, motivo, sinApuesta = false) {
  jugando = false; $('#botones').hidden = true; narrar(''); $('#barras').hidden = true; c.mi && SALA?.cambiar({ peonOrden: null });
  const gano = ganador === c.yo, q = Q(), ap = sinApuesta ? 0 : c.apuesta; let extra = '';
  if (gano) q.victorias++; else q.derrotas++;
  if (ap) { if (gano) { DEF.materiales.chatarra = chatarra() + ap; extra += `<p>⚙️ <b>+${ap}</b> de chatarra.</p>`; } else { const p = Math.min(ap, chatarra()); DEF.materiales.chatarra = chatarra() - p; extra += `<p>⚙️ <b>−${p}</b> de chatarra. Rufo se la queda para la caja de los tornillos.</p>`; } }
  if (gano && c.tipo === 'ia' && c.rival === q.liga) {
    q.liga++;
    for (const [id, P] of Object.entries(PIEZAS_P).filter(([, P]) => P.premio === RIVALES_P[c.rival].quien)) if (!q.piezas.includes(id)) { q.piezas.push(id); extra += `<p>🎁 ${esc(RIVALES_P[c.rival].quien)} te da su <b>${esc(P.n)}</b> (${HUECOS_PEONZA[P.hueco].e} ${HUECOS_PEONZA[P.hueco].n}).</p>`; }
    if (q.liga >= RIVALES_P.length) extra += '<p>🏆 ¡Has ganado a toda la liga de Rufo! Él dice que estaba cansado.</p>';
  }
  guardar(); arreglarP(q);
  mostrar(`<h2>${gano ? '¡Has ganado!' : 'Has perdido'}<small>${esc(motivo)}.</small></h2>${extra}
    <div class="fila-botones">${c.tipo === 'ia' ? '<button id="bOtra" class="grande">🔁 Revancha</button>' : ''}<button id="bTaller" ${c.tipo === 'ia' ? '' : 'class="grande"'}>🛠️ Al puesto</button></div>`, 'fin');
  $('#bOtra')?.addEventListener('click', () => retoIA(c.rival, Math.min(c.apuesta, chatarra())));
  $('#bTaller').onclick = () => pantallaTaller('peonza');
}

// ---------- arranque ----------
async function arrancar() {
  if (!DEF) DEF = await cargarHeroe();
  if (DEBUG && !DEF) DEF = { nombre: 'Probador', clase: 'barbaro' };
  if (!DEF) return mostrar('<h2>Sin héroe</h2><p>Para tener peonza, primero hazte un héroe de aventura: baja al claro desde el pueblo.</p><div class="fila-botones"><a class="boton" href="claro.html">Ir al claro</a></div>');
  DEF.materiales ||= {};
  if (DEBUG) modoDebug();
  if (!DEF.peonza) {
    DEF.peonza = peonzaNueva(); guardar(); poner([DEF.peonza.equipo]);
    mostrar(`<h2>Las peonzas de Rufo</h2><p>Rufo ha montado un puestecillo con un plato y una cajita de pedazos de cosas. «Toma, una peonza de las de toda la vida: tapa de olla, chapa de refresco y una chincheta. Se la apuesta uno, se la juega uno, y la chatarra cambia de manos.»</p>
      <p>Se juega por rondas: elegís a la vez <b>💥 Embestida</b>, <b>🛡️ Aguantar</b> o <b>🌀 Girar</b> (cada una gana a otra, como piedra, papel o tijera). Pierde el que se queda sin giro o sale del plato. Y las apuestas, en chatarra ⚙️, la de las criptas.</p>
      <div class="fila-botones"><button id="bVale" class="grande">¡Vamos allá!</button></div>`, 'intro');
    $('#bVale').onclick = () => pantallaTaller('peonza'); return;
  }
  if (arreglarP(Q())) guardar(); pantallaTaller('peonza');
}
arrancar();
if (!DEBUG) cargarHeroe().then((h) => { if (h && !jugando && h.peonza && JSON.stringify(h.peonza) !== JSON.stringify(DEF?.peonza)) { DEF = h; arreglarP(DEF.peonza); if (pantalla === 'taller') pantallaTaller(pestana); publicar(); } }).catch(() => {});
import('./reunion.js').then((RED) => RED.crearPanel({
  donde: 'peonzas', boton: $('#bSala'), proponer: false, datos: () => ({ clase: DEF?.clase || 'barbaro', x: 0, z: 0 }),
  alConectar: (R) => { SALA = R; publicar(); R.cambiar({ peonReto: null, peonOrden: null }); R.on('gente', alGente); alGente(R.gente()); if (pantalla === 'taller' && pestana === 'retos') pantallaTaller('retos'); },
  alSalir: () => { SALA = null; GENTE = {}; if (pantalla === 'taller' && pestana === 'retos') pantallaTaller('retos'); }
})).catch((e) => console.warn('Sin sala:', e?.message));
window.peonzas = { get DEF() { return DEF; }, get SALA() { return SALA; }, jugar, retoIA, retar, luchadora };
