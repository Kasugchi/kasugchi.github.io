// =============================================================
//  INTERFAZ
//  Pantallas, sala, turnos, animación de eventos y sonido.
//  Modos: 'local' (un dispositivo), 'anfitrion' y 'invitado'.
//  El anfitrión (o el modo local) ejecuta el motor y reparte el estado.
// =============================================================
import * as D from './datos.js';
import * as M from './motor.js';
import * as T from './tablero.js';
// La red se carga solo al crear o unirse a una sala: así el modo local funciona sin conexión.
let moduloRed = null;
const Red = async () => {
  try { return (moduloRed ||= await import('./red.js')); }
  catch { throw new Error('No se pudo cargar la conexión de partidas. Revisa tu conexión a internet.'); }
};
import { Tablero } from './render.js';
import { cargarSprites } from './sprites.js';
import { ICONOS } from './iconos.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const svg = (n, extra = '') => `<svg viewBox="0 0 512 512" aria-hidden="true" ${extra}><path d="${ICONOS[n] || ''}"/></svg>`;
const del = (h) => (h.fem ? 'de la ' : 'del ') + h.nombre;
const art = (h) => (h.fem ? 'la ' : 'el ') + h.nombre;
// Velocidad de las animaciones: 1 normal, 0.5 rápida, 0.25 muy rápida (se guarda en este aparato).
const VELOCIDADES = [[1, 'normal'], [0.5, 'rápida'], [0.25, 'muy rápida']];
let velocidad = (() => { try { return +localStorage.getItem('criptas_velocidad') || 1; } catch { return 1; } })();
const espera = (ms) => new Promise((r) => setTimeout(r, ms * velocidad));
const guardar = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const borrar = (k) => { try { localStorage.removeItem(k); } catch { /* nada */ } };

// ---------- Identidad del jugador ----------
let miId = leer('criptas_id');
if (!miId) { miId = 'j' + Math.random().toString(36).slice(2, 10); guardar('criptas_id', miId); }

const app = {
  modo: null, estado: null, sala: null, red: null, misiones: {},
  visto: 0, cola: [], reproduciendo: false, seleccion: null,
  sonido: leer('criptas_sonido') !== 'no', pestana: null, saltar: null
};

// =============================================================
//  SONIDO (sintetizado, sin archivos)
// =============================================================
let audio = null;
// Ambiente de fondo por zona: sonidos sueltos de vez en cuando, muy bajitos.
let ambiente = { zona: null, temporizador: null };
function actualizarAmbiente() {
  const e = app.estado;
  const zona = app.sonido && e?.fase === 'mision' && !$('#juego').hidden ? e.mision?.zona : null;
  if (zona === ambiente.zona) return;
  clearTimeout(ambiente.temporizador);
  ambiente = { zona, temporizador: null };
  if (!zona) return;
  const siguiente = () => {
    ambiente.temporizador = setTimeout(() => { if (ambiente.zona === zona) { sonarAmbiente(zona); siguiente(); } }, 2500 + Math.random() * 5000);
  };
  siguiente();
}
function sonarAmbiente(zona) {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const a = audio, t = a.currentTime;
    const tono = (f1, f2, dur, vol, forma = 'sine') => {
      const o = a.createOscillator(); o.type = forma;
      o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
    };
    const soplo = (dur, vol, frec) => {
      const b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((i / d.length) * Math.PI);
      const s = a.createBufferSource(); s.buffer = b;
      const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = frec;
      const g = a.createGain(); g.gain.value = vol;
      s.connect(f).connect(g).connect(a.destination); s.start(t);
    };
    if (zona === 'cuevas') { const f = 1200 + Math.random() * 900; tono(f, f * 0.55, 0.18, 0.04); }          // gota
    if (zona === 'catacumbas') { if (Math.random() < 0.4) tono(196, 190, 3.5, 0.03, 'triangle'); else soplo(2.5, 0.05, 300); } // campana lejana / aire
    if (zona === 'fortaleza') { soplo(1.8, 0.07, 140); if (Math.random() < 0.3) tono(70, 50, 1.2, 0.05, 'sawtooth'); } // retumbo
    if (zona === 'abismo') soplo(4, 0.06, 500 + Math.random() * 400);                                         // viento
  } catch { /* sin audio */ }
}

function sonar(tipo) {
  if (!app.sonido) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const a = audio, t = a.currentTime;
    const ruido = (dur, vol, filtro) => {
      const b = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const s = a.createBufferSource(); s.buffer = b;
      const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = filtro;
      const g = a.createGain(); g.gain.value = vol;
      s.connect(f).connect(g).connect(a.destination); s.start(t);
    };
    const tono = (f1, f2, dur, vol, forma = 'sine', ret = 0) => {
      const o = a.createOscillator(); o.type = forma;
      o.frequency.setValueAtTime(f1, t + ret); o.frequency.exponentialRampToValueAtTime(f2, t + ret + dur);
      const g = a.createGain(); g.gain.setValueAtTime(vol, t + ret); g.gain.exponentialRampToValueAtTime(0.001, t + ret + dur);
      o.connect(g).connect(a.destination); o.start(t + ret); o.stop(t + ret + dur);
    };
    if (tipo === 'dados') { for (let i = 0; i < 5; i++) setTimeout(() => ruido(0.05, 0.25, 2500 + Math.random() * 2000), i * 70); }
    if (tipo === 'golpe') { ruido(0.18, 0.5, 400); tono(160, 60, 0.2, 0.3, 'triangle'); }
    if (tipo === 'puerta') { tono(90, 140, 0.45, 0.12, 'sawtooth'); ruido(0.3, 0.15, 600); }
    if (tipo === 'aparece') { tono(220, 110, 0.6, 0.15, 'sawtooth'); tono(233, 116, 0.6, 0.1, 'sawtooth'); }
    if (tipo === 'muerte') { tono(300, 40, 0.5, 0.2, 'square'); }
    if (tipo === 'tesoro') { tono(880, 880, 0.15, 0.12); tono(1320, 1320, 0.25, 0.1, 'sine', 0.1); }
    if (tipo === 'magia') { tono(400, 1200, 0.5, 0.12, 'triangle'); tono(600, 1800, 0.5, 0.06); }
    if (tipo === 'trampa') { ruido(0.4, 0.5, 300); }
    if (tipo === 'turno') { tono(523, 523, 0.12, 0.06, 'triangle'); }
  } catch { /* sin audio */ }
}

// =============================================================
//  PANTALLAS
// =============================================================
const PANTALLAS = ['portada', 'sala', 'briefing', 'juego', 'armeria', 'final'];
function mostrar(id) { for (const p of PANTALLAS) $("#" + p).hidden = p !== id; if (typeof actualizarAmbiente === "function") actualizarAmbiente(); }

function toast(texto, tono = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + tono; el.textContent = texto;
  const zona = $('#toasts');
  zona.appendChild(el);
  while (zona.children.length > 3) zona.firstChild.remove();
  setTimeout(() => el.remove(), 3200);
}
let cartelT = 0;
function cartel(texto) {
  const c = $('#cartel'); c.textContent = texto; c.style.opacity = 1;
  clearTimeout(cartelT); cartelT = setTimeout(() => (c.style.opacity = 0), 1300);
}

function modal(html, botones = []) {
  return new Promise((ok) => {
    $('#modal-cuerpo').innerHTML = html + `<div class="fila" style="margin-top:14px">${botones.map((b, i) => `<button class="btn ${b.clase || ''}" data-i="${i}">${esc(b.texto)}</button>`).join('')}</div>`;
    $('#modal').hidden = false;
    $('#modal-cuerpo').querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { $('#modal').hidden = true; ok(+b.dataset.i); }));
    $('#modal-cuerpo').querySelector('[data-i]')?.focus();
  });
}
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' && app.cerrarModalFuera) { $('#modal').hidden = true; app.cerrarModalFuera(); } });

// =============================================================
//  CARGA DE MISIONES
// =============================================================
const listas = Promise.all([...D.CAMPANA, 'pruebas'].map((id) => fetch('misiones/' + id + '.json').then((r) => r.json()).then((j) => (app.misiones[id] = j))));

// =============================================================
//  PORTADA
// =============================================================
$('#nombre').value = leer('criptas_nombre') || '';
const miNombre = () => ($('#nombre').value.trim() || 'Aventurero').slice(0, 20);
$('#nombre').addEventListener('change', () => guardar('criptas_nombre', $('#nombre').value.trim()));
// =============================================================
//  PARTIDAS GUARDADAS
//  Varias a la vez en localStorage ('criptas_partidas'):
//    { [id]: { id, modo, codigo, estado, actualizada } }
//  - En solitario: id 'solo-<fecha>', guarda el estado entero.
//  - Multijugador: id 'sala-<código>'. El anfitrión guarda el estado;
//    el invitado solo apunta el código para volver a entrar.
// =============================================================
function leerPartidas() {
  let todas = {};
  try { todas = JSON.parse(leer('criptas_partidas')) || {}; } catch { todas = {}; }
  // Migrar la partida única de versiones anteriores.
  try {
    const vieja = JSON.parse(leer('criptas_partida'));
    if (vieja?.estado) {
      const id = vieja.codigo ? 'sala-' + vieja.codigo : 'solo-' + Date.now();
      todas[id] = { id, modo: vieja.codigo ? vieja.modo : 'local', codigo: vieja.codigo || null, estado: vieja.estado, actualizada: Date.now() };
      escribirPartidas(todas);
    }
    borrar('criptas_partida');
  } catch { /* nada que migrar */ }
  return todas;
}
let avisoEspacio = false;
function escribirPartidas(todas) {
  try { localStorage.setItem('criptas_partidas', JSON.stringify(todas)); return true; }
  catch {
    if (!avisoEspacio) { avisoEspacio = true; toast('No queda espacio para guardar. Borra alguna partida antigua desde la portada.', 'peligro'); }
    return false;
  }
}
function guardarPartida(estado) {
  if (!app.partidaId) return;
  const todas = leerPartidas();
  // Los eventos solo sirven para animar: no hace falta guardarlos.
  todas[app.partidaId] = {
    id: app.partidaId, modo: app.modo, codigo: app.red?.codigo || null,
    estado: { ...estado, eventos: [] },
    resumen: resumenPartida(estado), actualizada: Date.now()
  };
  escribirPartidas(todas);
  if (estado.fantasmaVencido && app.modo !== 'invitado') escribirFantasmas(leerFantasmas().filter((f) => f.piso !== estado.misionIdx + 1));
  // Copia en la nube (si hay sesión): enseguida al cambiar de fase, si no, con calma.
  const cambioFase = ultimaFase[app.partidaId] !== estado.fase;
  ultimaFase[app.partidaId] = estado.fase;
  nube()?.subir(todas[app.partidaId], cambioFase);
}
const ultimaFase = {};
function resumenPartida(e) {
  const heroes = e.orden.map((t) => e.heroes[t].nombre).join(', ');
  const fin = e.fase === 'final';
  const idx = Math.min(e.misionIdx, e.campana.length - 1);
  const mision = e.aleatorio ? 'Mazmorra Infinita · piso ' + (e.misionIdx + 1) + (e.mision?.generada ? ': ' + e.mision.titulo : '')
    : fin ? 'Campaña completada' : 'Misión ' + (idx + 1) + ' de ' + e.campana.length + ': ' + (app.misiones[e.campana[idx]]?.titulo || '');
  const oro = e.orden.reduce((s, t) => s + e.heroes[t].oro, 0);
  return { heroes, mision, oro, fin };
}
function borrarPartida(id) { const todas = leerPartidas(); delete todas[id]; escribirPartidas(todas); nube()?.borrarNube(id); }
// Lo local y lo de la nube juntos: gana la copia más reciente de cada partida.
function todasLasPartidas() {
  const todas = leerPartidas();
  for (const p of app.nubePartidas || []) {
    if (!p.estado || !p.resumen) continue;
    const local = todas[p.id];
    if (!local || (p.actualizada || 0) > (local.actualizada || 0)) todas[p.id] = { ...p, soloNube: !local };
    todas[p.id].enNube = true;
  }
  return todas;
}

function pintarPartidas() {
  const todas = Object.values(todasLasPartidas()).filter((p) => p.resumen).sort((a, b) => b.actualizada - a.actualizada);
  const fecha = (t) => new Date(t).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const fila = (p) => `<li class="partida">
      <div><strong>${esc(p.resumen.heroes)}</strong>
      <span>${esc(p.resumen.mision)}</span>
      <small>${p.codigo ? 'Sala ' + esc(p.codigo) + (p.modo === 'invitado' ? ' · como invitado' : ' · como anfitrión') + ' · ' : ''}${fecha(p.actualizada)}${p.enNube ? ' · <span class="en-nube">en la nube</span>' : ''}</small></div>
      <button class="icono-btn borrar" data-exportar="${esc(p.id)}" aria-label="Exportar partida" title="Exportar a un archivo">${'<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>'}</button>
      <button class="btn" data-seguir="${esc(p.id)}">${p.resumen.fin ? 'Ver' : p.modo === 'invitado' ? 'Volver a entrar' : 'Continuar'}</button>
      <button class="icono-btn borrar" data-borrar="${esc(p.id)}" aria-label="Borrar partida">${'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>'}</button>
    </li>`;
  const solo = todas.filter((p) => p.modo === 'local'), multi = todas.filter((p) => p.modo !== 'local');
  $('#partidas').hidden = false;
  $('#partidas').innerHTML = (solo.length ? `<h2>En solitario</h2><ul>${solo.map(fila).join('')}</ul>` : '')
    + (multi.length ? `<h2>Multijugador</h2><ul>${multi.map(fila).join('')}</ul>` : '')
    + `<label class="btn claro importar">Importar partida desde archivo<input type="file" accept=".json,application/json" id="importar" hidden></label>`;
  $('#importar').addEventListener('change', (ev) => importarPartida(ev.target.files[0]));
  $('#partidas').querySelectorAll('[data-exportar]').forEach((b) => b.addEventListener('click', () => exportarPartida(b.dataset.exportar)));
  $('#partidas').querySelectorAll('[data-seguir]').forEach((b) => b.addEventListener('click', () => continuarPartida(b.dataset.seguir)));
  $('#partidas').querySelectorAll('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
    app.cerrarModalFuera = () => {};
    const i = await modal('<h2>¿Borrar esta partida?</h2><p>Se borrará de este dispositivo y de la nube.</p>', [{ texto: 'Cancelar', clase: 'claro' }, { texto: 'Borrar' }]);
    if (i === 1) { borrarPartida(b.dataset.borrar); pintarPartidas(); }
  }));
}
listas.then(pintarPartidas);

// ---------- Exportar / importar una partida a un archivo ----------
function exportarPartida(id) {
  const p = todasLasPartidas()[id];
  if (!p?.estado) return toast('Esta partida no tiene datos que exportar.');
  const nombreArchivo = 'criptas-' + (p.resumen?.heroes || 'partida').replace(/[^a-z0-9áéíóúñ]+/gi, '-').toLowerCase() + '.json';
  const blob = new Blob([JSON.stringify({ criptas: 1, partida: { ...p, soloNube: undefined, enNube: undefined } })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombreArchivo; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
async function importarPartida(archivo) {
  if (!archivo) return;
  try {
    const datos = JSON.parse(await archivo.text());
    const p = datos?.partida;
    if (!datos?.criptas || !p?.estado?.heroes) throw new Error('formato');
    const todas = leerPartidas();
    const id = todas[p.id] ? p.id + '-' + Date.now().toString(36) : p.id;
    todas[id] = { ...p, id, actualizada: Date.now() };
    escribirPartidas(todas);
    nube()?.subir(todas[id], true);
    pintarPartidas();
    toast('Partida importada.', 'bueno');
  } catch { toast('Ese archivo no es una partida de Criptas.', 'peligro'); }
}

// ---------- Partidas en la nube (Firestore, con cuenta de Google) ----------
let moduloNube = null;
const nube = () => moduloNube;
// Acceso por lista: solo juegan las cuentas que el panel ha autorizado.
// (Las reglas de Firebase lo hacen cumplir; esto es la pantalla.)
function ponerAcceso(estado) {
  app.acceso = estado; // 'comprobando' | 'fuera' | 'denegado' | 'ok'
  document.getElementById('portada').dataset.acceso = estado;
}
ponerAcceso('comprobando');
import('./nube.js').then((m) => {
  moduloNube = m;
  m.alCambiarUsuario(async (u) => {
    app.nubePartidas = [];
    if (!u) { ponerAcceso('fuera'); pintarNube(null); return pintarPartidas(); }
    ponerAcceso('comprobando'); pintarNube(u);
    let ok = false;
    try { ok = await m.tieneAcceso(); } catch (e) { ok = leer('criptas_acceso') === u.email; }
    if (!ok) { app.solicitado = await m.haSolicitado().catch(() => false); ponerAcceso('denegado'); pintarNube(u); return pintarPartidas(); }
    guardar('criptas_acceso', u.email);
    ponerAcceso('ok'); pintarNube(u);
    if (!$('#nombre').value.trim() && u.displayName) $('#nombre').value = u.displayName.split(' ')[0];
    try {
      app.nubePartidas = await m.listar();
      // Lo que solo estaba en este dispositivo, a la nube.
      const enNube = new Set(app.nubePartidas.map((p) => p.id));
      for (const p of Object.values(leerPartidas())) if (p.estado && !enNube.has(p.id)) m.subir(p, true);
    } catch (e) { console.warn('Nube no disponible:', e.message); pintarNube(u, true); }
    pintarPartidas();
  });
}).catch(() => {
  // Sin conexión con Google: si este dispositivo ya tenía acceso, se juega en local.
  ponerAcceso(leer('criptas_acceso') ? 'ok' : 'fuera');
  pintarNube(null, true);
});
function pintarNube(u, fallo = false) {
  const caja = $('#nube');
  if (fallo && !u) {
    caja.innerHTML = app.acceso === 'ok' ? '<p>Sin conexión con la nube: puedes jugar con las partidas de este dispositivo.</p>'
      : '<p>No se puede comprobar tu acceso ahora mismo. Revisa la conexión y recarga.</p>';
    return;
  }
  const salirBtn = '<button class="btn claro" id="b-salir-nube">Cerrar sesión</button>';
  const quien = u ? esc(u.displayName || u.email || 'tu cuenta') : '';
  if (!u) caja.innerHTML = '<p>Criptas de Velmor está en pruebas cerradas. Entra con tu cuenta de Google para jugar.</p><button class="btn" id="b-entrar-nube">Entrar con Google</button>';
  else if (app.acceso === 'comprobando') caja.innerHTML = `<p>Comprobando el acceso de <b>${quien}</b>…</p>`;
  else if (app.acceso === 'denegado') caja.innerHTML = app.solicitado
    ? `<p>Solicitud enviada para <b>${esc(u.email)}</b>. En cuanto te den acceso, recarga la página.</p>${salirBtn}`
    : `<p>La cuenta <b>${esc(u.email)}</b> todavía no tiene acceso.</p><button class="btn" id="b-solicitar">Solicitar acceso</button>${salirBtn}`;
  else caja.innerHTML = `<p>☁ Tus partidas se guardan en la nube como <b>${quien}</b>.${fallo ? ' <span class="nota">(No se ha podido leer la nube: revisa la conexión.)</span>' : ''}</p>${salirBtn}`;
  $('#b-entrar-nube')?.addEventListener('click', () => moduloNube?.entrar().catch((e) => toast('No se pudo iniciar sesión: ' + (e.code || e.message), 'peligro')));
  $('#b-salir-nube')?.addEventListener('click', () => moduloNube?.salir());
  $('#b-solicitar')?.addEventListener('click', async () => {
    try { await moduloNube.solicitarAcceso(); app.solicitado = true; pintarNube(u); toast('Solicitud enviada.', 'bueno'); }
    catch (e) { toast('No se pudo enviar la solicitud: ' + (e.code || e.message), 'peligro'); }
  });
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') moduloNube?.vaciar(); });

// Dos modos de juego; en los dos se juega solo o con sala.
document.querySelectorAll('#portada [data-modo]').forEach((b) => b.addEventListener('click', () => {
  if (app.acceso !== 'ok') return;
  const infinita = b.dataset.modo === 'infinita';
  if (b.dataset.donde === 'local') {
    app.modo = 'local';
    app.sala = { codigo: null, jugadores: { [miId]: { nombre: miNombre() } }, eleccion: {}, misionIdx: 0, perdida: infinita };
    pintarSala(); mostrar('sala');
  } else crearSala(infinita);
}));
async function crearSala(infinita) {
  avisoPortada('Abriendo la sala…');
  try {
    app.modo = 'anfitrion';
    app.sala = { codigo: null, jugadores: { [miId]: { nombre: miNombre() } }, eleccion: {}, misionIdx: 0, perdida: infinita };
    app.red = await (await Red()).crearSala(miId, eventosAnfitrion());
    app.sala.codigo = app.red.codigo;
    avisoPortada('');
    pintarSala(); mostrar('sala');
  } catch (e) { app.modo = null; avisoPortada(e.message); }
}
$('#f-unirse').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  if (app.acceso !== 'ok') return;
  const codigo = $('#codigo').value.trim().toUpperCase();
  if (codigo.length !== 4) return avisoPortada('El código tiene 4 letras.');
  avisoPortada('Buscando la sala ' + codigo + '…');
  try { await unirseComoInvitado(codigo); avisoPortada(''); }
  catch (e) { app.modo = null; avisoPortada(e.message); }
});

async function unirseComoInvitado(codigo) {
  app.modo = 'invitado';
  app.partidaId = 'sala-' + codigo;
  app.red = await (await Red()).unirseSala(codigo, miId, miNombre(), {
    alMensaje: mensajeDelAnfitrion,
    alAnfitrion: (online) => anfitrionCambia(online)
  });
  // Si la sala ya no tiene anfitrión, ofrecer seguir enseguida.
  if (!app.red.anfitrionOnline) anfitrionCambia(false, 3000);
}
$('#codigo').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
async function continuarPartida(id) {
  if (app.acceso !== 'ok') return;
  const g = todasLasPartidas()[id];
  if (!g) return;
  await listas;
  app.partidaId = id;
  if (g.modo === 'invitado') {
    avisoPortada('Entrando en la sala ' + g.codigo + '…');
    try { await unirseComoInvitado(g.codigo); avisoPortada(''); }
    catch (e) {
      app.modo = null; avisoPortada(e.message);
      // La sala ya no está, pero tenemos la partida: la puede seguir este jugador.
      if (g.estado) {
        app.cerrarModalFuera = () => {};
        const i = await modal('<h2>La sala ya no está abierta</h2><p>Tienes guardada la partida entera. ¿La abres tú como anfitrión? Los demás podrán entrar con el mismo código.</p>', [{ texto: 'Ahora no', clase: 'claro' }, { texto: 'Abrirla yo' }]);
        if (i === 1) {
          avisoPortada('Abriendo la sala ' + g.codigo + '…');
          try { await retomarComoAnfitrion(g.codigo, g.estado, true); avisoPortada(''); } catch (e2) { avisoPortada(e2.message); }
        }
      }
    }
    return;
  }
  if (g.modo === 'anfitrion' && g.codigo) {
    avisoPortada('Reabriendo la sala ' + g.codigo + '…');
    try { await retomarComoAnfitrion(g.codigo, g.estado); avisoPortada(''); }
    catch (e) {
      if (e.name === 'SalaOcupada' || e.constructor?.name === 'SalaOcupada') {
        try { await unirseComoInvitado(g.codigo); avisoPortada(''); toast('Otro jugador lleva ahora la partida. Has entrado como invitado.'); }
        catch (e2) { app.modo = null; avisoPortada(e2.message); }
      } else avisoPortada(e.message);
    }
    return;
  }
  app.modo = 'local';
  app.visto = 0; app.estado = null; app.cola = [];
  publicar(g.estado);
}

// Seguir una partida como anfitrión (tras recargar, o si el anfitrión se fue).
async function retomarComoAnfitrion(codigo, estado, forzar = false) {
  app.red?.cerrar();
  app.red = null;
  app.modo = 'anfitrion';
  estado.anfitrion = miId;
  estado.jugadores ||= {};
  for (const [id, j] of Object.entries(estado.jugadores)) if (id !== miId) j.desconectado = true;
  estado.jugadores[miId] = { nombre: miNombre() };
  app.sala = { codigo, jugadores: estado.jugadores, eleccion: {}, misionIdx: estado.misionIdx };
  app.visto = 0; app.estado = null; app.cola = [];
  app.estadoReal = estado; // antes de abrir la sala, para que los que se reconectan se apunten bien
  app.partidaId = 'sala-' + codigo;
  try {
    app.red = await (await Red()).crearSala(miId, eventosAnfitrion(), { codigo, forzar });
  } catch (e) { app.modo = null; app.estadoReal = null; throw e; }
  ocultarAvisoAnfitrion();
  toast('Sala ' + codigo + ' abierta. Los demás pueden volver a entrar con el mismo código.', 'bueno');
  publicar(estado);
}

// El invitado se entera de que el anfitrión se ha ido (o ha vuelto).
// Se muestra un aviso discreto, no una ventana: así no tapa ni bloquea la partida.
let avisoCaida = null;
function anfitrionCambia(online, retraso = 20000) {
  if (app.modo !== 'invitado') return;
  clearTimeout(avisoCaida);
  if (online) return ocultarAvisoAnfitrion();
  // Margen amplio: un móvil que bloquea la pantalla o recarga vuelve enseguida.
  avisoCaida = setTimeout(async () => {
    if (app.modo !== 'invitado' || !app.red) return;
    if (await app.red.anfitrionSigue()) return;
    const estado = await app.red.estadoGuardado();
    if (!estado) { salirAPortada(); return avisoPortada('El anfitrión ha cerrado la sala.'); }
    mostrarAvisoAnfitrion();
  }, retraso);
}
function mostrarAvisoAnfitrion() {
  const el = $('#aviso-anfitrion');
  el.hidden = false;
  el.querySelector('button').disabled = false;
}
function ocultarAvisoAnfitrion() { $('#aviso-anfitrion').hidden = true; }
$('#aviso-anfitrion button').addEventListener('click', async (ev) => {
  ev.currentTarget.disabled = true;
  if (app.modo !== 'invitado' || !app.red) return ocultarAvisoAnfitrion();
  // Última comprobación, por si ha vuelto justo ahora.
  if (await app.red.anfitrionSigue()) { toast('El anfitrión ha vuelto.', 'bueno'); return ocultarAvisoAnfitrion(); }
  const estado = await app.red.estadoGuardado();
  try { await retomarComoAnfitrion(app.red.codigo, estado, true); }
  catch (e) { toast(e.message, 'peligro'); ev.currentTarget.disabled = false; }
});

// El anfitrión ve que otro jugador ha tomado el control: pasa a invitado.
async function perderSala() {
  const codigo = app.red?.codigo;
  app.red = null; app.estadoReal = null;
  toast('Otro jugador ha tomado el control de la partida. Sigues como invitado.', 'peligro');
  try { await unirseComoInvitado(codigo); } catch (e) { salirAPortada(); avisoPortada(e.message); }
}
$('#b-reglas').addEventListener('click', () => mostrarReglas());
function avisoPortada(t) { $('#aviso-portada').textContent = t; }

function mostrarReglas() {
  app.cerrarModalFuera = () => {};
  const sec = (titulo, cuerpo, abierta = false) => `<details class="guia" ${abierta ? 'open' : ''}><summary>${titulo}</summary>${cuerpo}</details>`;
  modal(`<h2>Cómo se juega</h2>
    ${sec('Lo básico', `
    <p>Cada héroe, en su turno, <b>tira los dados de movimiento</b> y camina por las casillas iluminadas, y hace <b>una acción</b>: atacar, lanzar un hechizo, buscar tesoro, buscar trampas y puertas secretas o desarmar una trampa. Puede mover antes o después de actuar.</p>
    <p>Las salas y pasillos se descubren al verlos. Abrir una puerta revela la sala entera… y lo que hay dentro. Las piedras marcan un camino cortado.</p>
    <p><b>Combate:</b> primero el atacante tira los dados y cuenta calaveras; después el que recibe tira los suyos y cuenta escudos (blancos el héroe, negros el monstruo). Cada calavera no parada quita un punto de cuerpo.</p>
    <p>Tras el último héroe mueven los monstruos. Algunos te persiguen, otros guardan su sala y otros esperan a que pase algo.</p>`, true)}
    ${sec('La barra de botones', `
    <p>Siempre ves <b>Mover</b>, <b>Atacar</b>, <b>Hechizo</b> y <b>Fin del turno</b>. Lo que depende de dónde estés (abrir puerta, rezar, comerciar, beber del caldero, habilidades…) aparece solo cuando se puede usar.</p>
    <p>El resto está en <b>Más</b>: pociones, reliquias, buscar cuando no se puede… Lo apagado dice por qué no se puede ahora.</p>
    <p>En el <b>Diario</b> (el pergamino de arriba) cambias el sonido y la <b>velocidad</b> de las animaciones.</p>`)}
    ${sec('Campamento y cargador', `
    <p>Antes de cada misión cada héroe compra, se equipa, guarda dinero en el banco y puede contratar un cargador. El equipo es de cada héroe: no se pasa a otros, pero se puede vender a mitad de precio. Del banco se puede transferir a otro héroe hasta un 40 % del dinero, una vez por misión.</p>
    <p><b>Cargador:</b> lleva a la mazmorra lo que cada héroe le cargue. Para usarlo hay que ponerse a su lado y gastar 1 casilla. Si muere, lo que lleva se pierde.</p>
    <p><b>Calderos:</b> bebe y tira un dado. 1: te quedas a 1 de cuerpo. 2: −1 dado de defensa. 3: −1 dado de ataque. 4: +1 dado de ataque. 5: +1 dado de defensa. 6: te curas del todo.</p>`)}
    ${sec('Mazmorra Infinita', `
    <p>Pisos al azar, uno detrás de otro, y cada vez más duros. El equipo y las heridas se conservan entre pisos; después de cada piso hay campamento. Si caéis todos, se acaba la partida (en Aventurero volvéis al campamento).</p>
    <p><b>Niveles:</b> matar da experiencia. Cada nivel da una mejora, y en el <b>nivel 3</b> eliges especialización: tres por clase, cada una con su habilidad y su pega.</p>
    <p><b>Zonas:</b> Cuevas (1–5), Catacumbas (6–10), Fortaleza (11–15) y Abismo (16–20). Cada 5 pisos hay un <b>jefe de zona</b>, y en el 20 espera el <b>Corazón de la Mazmorra</b>. Si lo destruís empieza la Pesadilla.</p>
    <p><b>Maldiciones:</b> desde el piso 3 el Corazón puede maldecir un piso (oscuridad, inundado, fiebre del oro, sin descanso). Mira el Diario para saber cuál.</p>
    <p><b>Descansar:</b> en el campamento, si alguien está herido, se puede votar descansar. Os curáis todos, pero el siguiente piso sale maldito.</p>
    <p><b>Por el camino:</b> altares de tres dioses (Guerra, Suerte y Avaricia), un mercader errante (no le robes…), fantasmas de héroes caídos en otras partidas y piezas de <b>reliquias</b>, que se juntan para forjarlas.</p>
    <p><b>Posesión:</b> el mago puede meter su alma en un monstruo y controlarlo. Su cuerpo se queda en trance y puede recibir golpes.</p>
    <p><b>Dificultad:</b> Aventurero perdona, Héroe es lo normal, y en Leyenda quien cae, cae para siempre.</p>
    <p><b>Jugar solo:</b> en la sala, «+ IA» añade compañeros que juegan por su cuenta.</p>`)}
    <p class="nota">Busca trampas antes de cruzar pasillos sospechosos y no busques tesoro con monstruos a la vista.</p>`, [{ texto: 'Entendido' }]);
  requestAnimationFrame(() => { $('#modal-cuerpo').scrollTop = 0; });
}

// =============================================================
//  TARJETA DE PERSONAJE (lobby y ficha)
// =============================================================
function tarjetaHTML(tipo, fem, h) {
  const b = D.HEROES[tipo];
  const nombreH = h ? h.nombre : (fem ? b.fem.nombre : b.nombre);
  const icono = h ? h.icono : (fem ? b.fem.icono : b.icono);
  const ataque = h ? M.ataqueHeroe(h) : D.ARMAS[b.arma].ataque;
  const defensa = h ? M.defensaHeroe(h) : b.defensa;
  const cuerpo = h ? `${h.cuerpo}<small>/${h.cuerpoMax}</small>` : b.cuerpo;
  const arma = D.ARMAS[h ? h.arma : b.arma].nombre;
  const armadura = h && h.armaduras.length ? h.armaduras.map((a) => D.ARMADURAS[a].nombre).join(', ') : 'Ninguna';
  const mov = h ? M.dadosMovimiento(h) : 2;
  const magia = b.elementos.length ? b.elementos.map((e) => D.ELEMENTOS[e].nombre).join(', ') : '';
  return `<div class="tarjeta">
    <div class="estandarte">${esc(nombreH)}</div>
    <div class="retrato" style="--c:${b.color}">${svg(icono)}</div>
    <div class="stats4">
      <div><span>Dados de ataque</span><b>${ataque}</b></div>
      <div><span>Dados de defensa</span><b>${defensa}</b></div>
      <div><span>Puntos corporales</span><b>${cuerpo}</b></div>
      <div><span>Puntos mentales</span><b>${h ? M.menteHeroe(h) : b.mente}</b></div>
    </div>
    <dl class="lineas">
      <dt>Movimiento</dt><dd>${mov} ${mov === 1 ? 'dado rojo' : 'dados rojos'}</dd>
      <dt>Arma</dt><dd>${esc(arma)}</dd>
      <dt>Armadura</dt><dd>${esc(armadura)}</dd>
      ${magia ? `<dt>Magia</dt><dd>${esc(magia)}</dd>` : ''}
      ${h ? `<dt>Bolsa</dt><dd>${h.oro} monedas</dd><dt>Banco</dt><dd>${h.banco || 0} monedas</dd>` : ''}
    </dl>
    ${h ? desgloseHTML(h) : ''}
  </div>`;
}
// De dónde sale cada número, y lo bueno y lo malo de la especialización y del arma.
function desgloseHTML(h) {
  const suma = (l) => l.map(([n, v], i) => (i === 0 ? '' : v < 0 ? ' − ' : ' + ') + esc(n) + ' ' + Math.abs(v)).join('');
  const total = (l) => l.reduce((t, [, v]) => t + v, 0);
  const at = M.desgloseAtaque(h), df = M.desgloseDefensa(h);
  const lineas = [`<b>Ataque ${total(at)}</b> = ${suma(at)}`, `<b>Defensa ${total(df)}</b> = ${suma(df)}`];
  const lento = [h.armaduras.includes('placas') && 'Armadura de placas', h.efectos?.agotado && 'Agotado', h.subclase && M.modSub(h, 'movimiento') && D.SUBCLASES[h.tipo][h.subclase].nombre].filter(Boolean);
  if (lento.length) lineas.push(`<b>Movimiento 1 dado</b> por: ${esc(lento.join(', '))}`);
  const sc = h.subclase && D.SUBCLASES[h.tipo]?.[h.subclase];
  if (sc) lineas.push(`<b>${esc(sc.nombre)}</b>: <span class="pro">✔ ${esc(sc.bueno)}</span> <span class="contra">✘ ${esc(sc.malo)}</span>`);
  const arma = D.ARMAS[h.arma];
  if (arma.mercader) lineas.push(`<b>${esc(arma.nombre)}</b>: <span class="pro">✔ ${esc(arma.bueno)}</span> <span class="contra">✘ ${esc(arma.malo)}</span>`);
  for (const a of h.armaduras) { const d = D.ARMADURAS[a]; if (d.mercader) lineas.push(`<b>${esc(d.nombre)}</b>: <span class="pro">✔ ${esc(d.bueno)}</span> <span class="contra">✘ ${esc(d.malo)}</span>`); }
  return `<div class="desglose">${lineas.map((l) => `<p>${l}</p>`).join('')}</div>`;
}

// =============================================================
//  SALA (antes de empezar)
// =============================================================
function pintarSala() {
  const s = app.sala;
  const manda = app.modo !== 'invitado';
  $('#sala-codigo').hidden = !s.codigo;
  $('#codigo-grande').textContent = s.codigo || '';
  $('#sala-titulo').textContent = 'Elige tus héroes';
  s.variante ||= {};
  $('#heroes-sel').innerHTML = D.ORDEN_HEROES.map((t) => {
    const duenio = s.eleccion[t];
    const fem = s.variante[t] === 'f';
    const clase = duenio === miId ? 'mio' : duenio ? 'otro' : '';
    const esIA = !!s.ia?.[t];
    const quien = esIA ? 'Compañero IA' : duenio ? (duenio === miId ? 'Lo llevas tú' : 'Lo lleva ' + (s.jugadores[duenio]?.nombre || '…')) : 'Llevar';
    const puedoCambiar = !duenio || duenio === miId;
    const otro = fem ? D.HEROES[t].nombre : D.HEROES[t].fem.nombre;
    return `<div class="hsel ${clase}">${tarjetaHTML(t, fem)}
      <div class="hsel-pie">
        <button class="btn ${duenio === miId ? '' : 'madera'}" data-heroe="${t}" ${duenio && duenio !== miId ? 'disabled' : ''}>${esc(quien)}</button>
        <button class="btn claro" data-variante="${t}" ${puedoCambiar ? '' : 'disabled'} title="Cambiar a ${esc(otro)}">${esc(otro)}</button>
        ${manda && (!duenio || duenio === miId) ? `<button class="btn claro" data-ia="${t}" title="Que lo lleve la IA">${esIA ? 'Quitar IA' : '+ IA'}</button>` : ''}
      </div></div>`;
  }).join('');
  $('#heroes-sel').querySelectorAll('[data-variante]').forEach((b) => b.addEventListener('click', () => cambiarVariante(b.dataset.variante)));
  $('#heroes-sel').querySelectorAll('[data-heroe]').forEach((b) => b.addEventListener('click', () => { if (s.ia?.[b.dataset.heroe]) delete s.ia[b.dataset.heroe]; elegirHeroe(b.dataset.heroe); }));
  $('#heroes-sel').querySelectorAll('[data-ia]').forEach((b) => b.addEventListener('click', () => {
    const t = b.dataset.ia;
    s.ia ||= {};
    if (s.ia[t]) { delete s.ia[t]; delete s.eleccion[t]; }
    else { s.ia[t] = true; s.eleccion[t] = miId; }
    difundirSala();
  }));
  $('#lista-jugadores').innerHTML = Object.entries(s.jugadores).map(([id, j]) => `<li class="${j.desconectado ? 'fuera' : ''}">${esc(j.nombre)}${id === miId ? ' (tú)' : ''}</li>`).join('');
  const sel = $('#sel-mision');
  sel.innerHTML = D.CAMPANA.map((id, i) => `<option value="${i}">${i + 1}. ${esc(app.misiones[id]?.titulo || id)}</option>`).join('')
    + '<option value="pruebas">⚙ Zona de pruebas (5000 monedas, para probar cosas)</option>';
  sel.value = s.pruebas ? 'pruebas' : String(s.misionIdx);
  $('#campo-mision').hidden = !!s.perdida;
  $('#sala-titulo').textContent = s.perdida ? 'Mazmorra Infinita: elige tus héroes' : 'Elige tus héroes';
  sel.disabled = !manda;
  $('#campo-semilla').hidden = !s.perdida;
  $('#campo-dificultad').hidden = !s.perdida;
  $('#sel-dificultad').value = s.dificultad || 'heroe';
  $('#sel-dificultad').disabled = !manda;
  $('#semilla').value = s.semilla || '';
  $('#semilla').disabled = !manda;
  $('#b-empezar').hidden = !manda;
  $('#sala-espera').hidden = manda;
  $('#b-empezar').disabled = !Object.keys(s.eleccion).length;
  $('#b-empezar').textContent = s.perdida ? 'Bajar a la Mazmorra Infinita' : s.pruebas ? 'Ir a la zona de pruebas' : s.perdida ? 'Bajar a la Mazmorra Infinita' : s.misionIdx > 0 ? 'Empezar en la misión ' + (s.misionIdx + 1) : 'Empezar la campaña';
}
listas.then(() => { if (app.sala && !$('#sala').hidden) pintarSala(); });

function cambiarVariante(t) {
  if (app.modo === 'invitado') return app.red.enviar({ t: 'variante', heroe: t });
  alternarVariante(miId, t);
}
function alternarVariante(jugador, t) {
  const s = app.sala;
  s.variante ||= {};
  if (s.eleccion[t] && s.eleccion[t] !== jugador) return;
  s.variante[t] = s.variante[t] === 'f' ? 'm' : 'f';
  difundirSala();
}
function elegirHeroe(t) {
  if (app.modo === 'invitado') return app.red.enviar({ t: 'elegir', heroe: t });
  alternarHeroe(miId, t);
}
function alternarHeroe(jugador, t) {
  const s = app.sala;
  if (s.eleccion[t] === jugador) delete s.eleccion[t];
  else if (!s.eleccion[t]) s.eleccion[t] = jugador;
  difundirSala();
}
function difundirSala() {
  pintarSala();
  if (app.modo === 'anfitrion') app.red?.difundir({ t: 'sala', sala: app.sala });
}
$('#sel-mision').addEventListener('change', (e) => {
  app.sala.pruebas = e.target.value === 'pruebas';
  if (!app.sala.pruebas) app.sala.misionIdx = +e.target.value;
  difundirSala();
});
$('#sel-dificultad').addEventListener('change', (e) => { app.sala.dificultad = e.target.value; difundirSala(); });
$('#semilla').addEventListener('change', (e) => {
  app.sala.semilla = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  difundirSala();
});
$('#b-salir-sala').addEventListener('click', () => salirAPortada());
$('#b-empezar').addEventListener('click', async () => {
  await listas;
  const s = app.sala;
  const elegidos = Object.entries(s.eleccion).map(([tipo, jugador]) => ({ tipo, jugador, variante: s.variante?.[tipo], ia: !!s.ia?.[tipo] }));
  if (!elegidos.length) return;
  if (elegidos.every((x) => x.ia)) return toast('Tiene que haber al menos un héroe que lleve una persona.', 'peligro');
  const e = M.crearPartida(elegidos, s.jugadores);
  e.anfitrion = miId;
  app.partidaId = app.modo === 'local' ? 'solo-' + Date.now() : 'sala-' + s.codigo;
  e.misionIdx = s.misionIdx;
  if (s.perdida) {
    // Mazmorra Perdida: niveles infinitos generados a partir de una semilla.
    const { nuevaSemilla } = await import('./procedural.js');
    e.aleatorio = { semilla: s.semilla || nuevaSemilla() };
    e.fantasmas = leerFantasmas();
    e.dificultad = s.dificultad || 'heroe';
    e.campana = [];
    e.misionIdx = 0;
  }
  if (s.pruebas) {
    // Zona de pruebas: una sola misión que se repite, con dinero de sobra para la tienda.
    e.pruebas = true; e.campana = ['pruebas']; e.misionIdx = 0;
    for (const h of Object.values(e.heroes)) { h.oro = 5000; h.objetos.pocionCurar = 3; h.kit = true; }
    // Todas las reliquias ya forjadas menos la trompa, cuyas piezas están en la mazmorra.
    e.reliquias = {};
    for (const [k, rq] of Object.entries(D.RELIQUIAS)) if (k !== 'jerico') { e.reliquias[k] = true; for (const pz of rq.piezas) e.reliquias[pz] = true; }
  }
  e.fase = 'armeria'; // primero el campamento: equipo, banco y cargador
  app.visto = 0; app.estado = null; app.cola = [];
  publicar(e);
});

function salirAPortada() {
  pintarRecord();
  clearTimeout(avisoCaida); ocultarAvisoAnfitrion();
  app.red?.cerrar(); app.red = null; app.modo = null; app.estado = null; app.estadoReal = null; app.sala = null; app.cola = [];
  pintarPartidas();
  $('#registro').hidden = true;
  mostrar('portada');
}

// =============================================================
//  RED: anfitrión
// =============================================================
function eventosAnfitrion() {
  return {
    alPerderSala: () => perderSala(),
    alConectar(id, nombre) {
      const s = app.sala;
      s.jugadores[id] = { nombre };
      const real = app.estadoReal;
      if (real) {
        real.jugadores[id] = { nombre };
        toast(nombre + ' se ha unido.', 'bueno');
        publicar(real);
      } else difundirSala();
    },
    alMensaje(id, msg) {
      if (msg.t === 'elegir' && !app.estado) return alternarHeroe(id, msg.heroe);
      if (msg.t === 'variante' && !app.estado) return alternarVariante(id, msg.heroe);
      if (msg.t === 'accion' && app.estadoReal) {
        const err = M.aplicar(app.estadoReal, msg.accion, id, (m) => app.misiones[m]);
        if (err) app.red.enviar(id, { t: 'error', texto: err });
        else publicar(app.estadoReal);
      }
    },
    alSalir(id) {
      const s = app.sala;
      if (!app.estadoReal) { delete s.jugadores[id]; for (const [t, j] of Object.entries(s.eleccion)) if (j === id) delete s.eleccion[t]; difundirSala(); return; }
      const real = app.estadoReal;
      if (real.jugadores[id]) real.jugadores[id].desconectado = true;
      toast((s.jugadores[id]?.nombre || 'Un jugador') + ' se ha desconectado. Puedes mover sus héroes.', 'peligro');
      publicar(real);
    }
  };
}

// =============================================================
//  RED: invitado
// =============================================================
function mensajeDelAnfitrion(msg) {
  if (msg.t === 'sala') {
    app.sala = msg.sala;
    if (!app.estado) { pintarSala(); mostrar('sala'); }
  } else if (msg.t === 'estado') { recibirEstado(msg.estado); guardarPartida(msg.estado); }
  else if (msg.t === 'error') toast(msg.texto, 'peligro');
}

// =============================================================
//  ESTADO Y ACCIONES
// =============================================================
function publicar(estado) {
  M.asegurarInventario(estado); // partidas de versiones anteriores
  guardarPartida(estado);
  if (app.modo === 'anfitrion') app.red?.difundir({ t: 'estado', estado });
  recibirEstado(JSON.parse(JSON.stringify(estado)), estado);
}

function enviar(accion) {
  if (app.reproduciendo) return;
  if (app.modo === 'invitado') return app.red.enviar({ t: 'accion', accion });
  const err = M.aplicar(app.estadoReal, accion, miId, (m) => app.misiones[m]);
  if (err) toast(err, 'peligro');
  else publicar(app.estadoReal);
}

function recibirEstado(e, real) {
  const primera = !app.estado;
  app.estado = e;
  if (real) app.estadoReal = real;
  app.seleccion = null;
  if (primera) app.visto = e.seq;
  for (const ev of e.eventos) if (ev.n > app.visto && !app.cola.some((x) => x.n === ev.n)) app.cola.push(ev);
  app.visto = Math.max(app.visto, ...app.cola.map((x) => x.n), app.visto);
  irAFase();
  if (!app.reproduciendo) reproducir();
}

function irAFase() {
  const e = app.estado;
  const manda = app.modo !== 'invitado';
  if (e.fase === 'briefing') {
    const m = e.mision;
    $('#br-num').textContent = e.pruebas ? 'Zona de pruebas' : e.aleatorio ? 'Mazmorra Infinita · piso ' + m.numero + (m.nombreZona ? ' · ' + m.nombreZona : '') + ' · semilla ' + e.aleatorio.semilla : 'Misión ' + m.numero + ' de ' + e.campana.length;
    $('#br-titulo').textContent = m.titulo;
    $('#br-intro').textContent = m.intro;
    $('#br-objetivo').textContent = m.objetivo.texto;
    pintarConectados($('#br-conectados'), e);
    $('#b-entrar').hidden = !manda;
    $('#b-campamento').hidden = !manda;
    $('#br-espera').hidden = manda;
    mostrar('briefing');
  } else if (e.fase === 'mision' || e.fase === 'resultado') {
    if ($('#juego').hidden) { mostrar('juego'); tablero.ajustado = false; tablero.ajustar(); }
    $('#j-titulo').textContent = e.mision.titulo;
    tablero.estado = e;
    pintarJuego();
  } else if (e.fase === 'armeria') { app.mochilaAbierta = null; if (!app.cola.length) { pintarArmeria(); mostrar('armeria'); } }
  else if (e.fase === 'final') { if (!app.cola.length) { pintarFinal(); mostrar('final'); } }
}

$('#b-entrar').addEventListener('click', () => enviar({ tipo: 'empezar' }));
$('#b-campamento').addEventListener('click', () => enviar({ tipo: 'volverCampamento' }));

// Mapa al estilo de un libro de misiones: granate lo que no se juega,
// claro la zona de la misión. No muestra monstruos, trampas ni pasadizos.
function pintarMapaMision(cv, e) {
  const c = 22, w = D.ANCHO * c, hgt = D.ALTO * c;
  cv.width = w; cv.height = hgt;
  const g = cv.getContext('2d');
  const zona = T.explorar(e.escalera[0], 999, (a, b) => !e.rocas[T.clave(b[0], b[1])] && (!T.hayPared(a, b) || !!T.puertaEntre(e, a, b)));
  const salas = new Set(Object.values(zona).map((z) => T.region(z.x, z.y)));
  const juega = (x, y) => !!zona[T.clave(x, y)] || (T.region(x, y) !== '.' && salas.has(T.region(x, y)));
  for (let y = 0; y < D.ALTO; y++) for (let x = 0; x < D.ANCHO; x++) {
    const on = juega(x, y) && !e.rocas[T.clave(x, y)];
    g.fillStyle = on ? (T.region(x, y) === '.' ? '#e6d6bd' : '#f3ebe4') : '#a65a6c';
    g.fillRect(x * c, y * c, c, c);
    g.strokeStyle = on ? 'rgba(150,70,90,0.35)' : 'rgba(80,20,35,0.35)';
    g.lineWidth = 1; g.strokeRect(x * c + 0.5, y * c + 0.5, c - 1, c - 1);
  }
  g.strokeStyle = '#6a1e30'; g.lineWidth = 2.5;
  for (let y = 0; y < D.ALTO; y++) for (let x = 0; x < D.ANCHO; x++) {
    if (x + 1 < D.ANCHO && T.region(x, y) !== T.region(x + 1, y)) { g.beginPath(); g.moveTo((x + 1) * c, y * c); g.lineTo((x + 1) * c, (y + 1) * c); g.stroke(); }
    if (y + 1 < D.ALTO && T.region(x, y) !== T.region(x, y + 1)) { g.beginPath(); g.moveTo(x * c, (y + 1) * c); g.lineTo((x + 1) * c, (y + 1) * c); g.stroke(); }
  }
  g.strokeRect(1, 1, w - 2, hgt - 2);
  for (const u of e.muebles) {
    g.fillStyle = '#fff'; g.strokeStyle = '#6a1e30'; g.lineWidth = 1.5;
    g.fillRect(u.x * c + 3, u.y * c + 3, u.w * c - 6, u.h * c - 6); g.strokeRect(u.x * c + 3, u.y * c + 3, u.w * c - 6, u.h * c - 6);
  }
  for (const p of e.puertas) {
    if (p.secreta) continue;
    const vert = p.a[1] === p.b[1];
    const x = vert ? Math.max(p.a[0], p.b[0]) * c : p.a[0] * c + c * 0.15;
    const y = vert ? p.a[1] * c + c * 0.15 : Math.max(p.a[1], p.b[1]) * c;
    g.fillStyle = p.bloqueada ? '#555' : '#fff'; g.strokeStyle = '#6a1e30'; g.lineWidth = 1.5;
    if (vert) { g.fillRect(x - 3, y, 6, c * 0.7); g.strokeRect(x - 3, y, 6, c * 0.7); }
    else { g.fillRect(x, y - 3, c * 0.7, 6); g.strokeRect(x, y - 3, c * 0.7, 6); }
  }
  const [sx, sy] = e.escalera[0];
  g.fillStyle = '#6a1e30'; g.fillRect(sx * c + 2, sy * c + 2, c * 2 - 4, c * 2 - 4);
  g.save(); g.translate(sx * c + 4, sy * c + 4); g.scale((c * 2 - 8) / 512, (c * 2 - 8) / 512); g.fillStyle = '#f3ebe4'; g.fill(new Path2D(ICONOS.escalera)); g.restore();
}

// =============================================================
//  TABLERO Y TURNOS
// =============================================================
const tablero = new Tablero($('#lienzo'), alTocar);
$('#b-vertodo').innerHTML = svg('ojo');
$('#b-registro').innerHTML = svg('pergamino');
$('#b-reaccion').innerHTML = svg('corona');
$('#b-cerrar-registro').innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>';
// ---------- Vista 2D / 3D (se recuerda en cada dispositivo) ----------
async function cambiarVista(tres) {
  try { await tablero.ponerVista3D(tres); }
  catch (err) { console.error(err); toast('Este dispositivo no puede mostrar la vista 3D.', 'peligro'); tres = false; }
  guardar('criptas_vista', tres ? '3d' : '2d');
  $('#b-vista').textContent = tres ? '2D' : '3D';
  $('#b-vista').setAttribute('aria-label', tres ? 'Cambiar a vista 2D' : 'Cambiar a vista de mesa 3D');
  $('#giro3d').hidden = !tres;
}
$('#b-vista').addEventListener('click', () => cambiarVista(!tablero.e3d));
$('#b-girar-izq').addEventListener('click', () => tablero.girar3D(-Math.PI / 4));
$('#b-girar-der').addEventListener('click', () => tablero.girar3D(Math.PI / 4));
if (leer('criptas_vista') === '3d') cambiarVista(true);

// ---------- Pantalla completa ----------
const ICONO_COMPLETA = '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>';
const ICONO_SALIR_COMPLETA = '<svg viewBox="0 0 24 24"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>';
const enCompleta = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
const pintarBotonPantalla = () => {
  $('#b-pantalla').innerHTML = enCompleta() ? ICONO_SALIR_COMPLETA : ICONO_COMPLETA;
  $('#b-pantalla').setAttribute('aria-label', enCompleta() ? 'Salir de pantalla completa' : 'Pantalla completa');
};
pintarBotonPantalla();
document.addEventListener('fullscreenchange', pintarBotonPantalla);
document.addEventListener('webkitfullscreenchange', pintarBotonPantalla);
$('#b-pantalla').addEventListener('click', async () => {
  const doc = document.documentElement;
  try {
    if (enCompleta()) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else if (doc.requestFullscreen) await doc.requestFullscreen({ navigationUI: 'hide' });
    else if (doc.webkitRequestFullscreen) doc.webkitRequestFullscreen();
    else throw new Error('sin soporte');
  } catch {
    toast('Este navegador no deja ponerla a pantalla completa. Usa «Compartir → Añadir a pantalla de inicio» y ábrela desde el icono: se verá sin barras.');
  }
});

$('#b-vertodo').addEventListener('click', () => {
  const e = app.estado;
  if (tablero.acercado(1.05)) tablero.verTodo();
  else if (e?.turno) { const h = e.heroes[e.turno.heroe]; tablero.centrarEn(h.x, h.y, true); }
});
$('#b-registro').addEventListener('click', () => {
  pintarDiario();
  $('#b-al-campamento').hidden = app.modo === 'invitado' || app.estado?.fase !== 'mision';
  $('#registro').hidden = false;
});
// Temporal: volver al campamento a mitad de misión (la misión empieza de cero al bajar otra vez).
$('#b-al-campamento').addEventListener('click', async () => {
  app.cerrarModalFuera = () => {};
  const i = await modal('<h2>¿Volver al campamento?</h2><p>Los héroes conservan el oro y el equipo que llevan, pero la misión empezará de cero al volver a bajar.</p>', [{ texto: 'Seguir jugando', clase: 'claro' }, { texto: 'Volver al campamento' }]);
  if (i !== 1) return;
  $('#registro').hidden = true;
  enviar({ tipo: 'volverCampamento' });
});
$('#b-cerrar-registro').addEventListener('click', () => ($('#registro').hidden = true));
$('#b-sonido').addEventListener('click', () => { app.sonido = !app.sonido; guardar('criptas_sonido', app.sonido ? 'si' : 'no'); $('#b-sonido').textContent = 'Sonido: ' + (app.sonido ? 'sí' : 'no'); actualizarAmbiente(); });
// Figuras: ilustraciones propias (criptas/sprites), miniaturas pintadas o de plástico.
tablero.modoFiguras = leer('criptas_figuras') || 'auto';
$('#sel-figuras').value = tablero.modoFiguras;
$('#sel-figuras').addEventListener('change', (e) => { tablero.modoFiguras = e.target.value; guardar('criptas_figuras', e.target.value); tablero.e3d?.rehacerFichas(); });
cargarSprites(document.querySelector('meta[name="version"]')?.content).then(() => { tablero.e3d?.rehacerFichas(); tablero.dibujar?.(); });
$('#b-sonido').textContent = 'Sonido: ' + (app.sonido ? 'sí' : 'no');
const pintarVelocidad = () => { $('#b-velocidad').textContent = 'Velocidad: ' + (VELOCIDADES.find((v) => v[0] === velocidad) || VELOCIDADES[0])[1]; };
$('#b-velocidad').addEventListener('click', () => {
  const i = VELOCIDADES.findIndex((v) => v[0] === velocidad);
  velocidad = VELOCIDADES[(i + 1) % VELOCIDADES.length][0];
  try { localStorage.setItem('criptas_velocidad', String(velocidad)); } catch { /* sin almacenamiento */ }
  pintarVelocidad();
});
pintarVelocidad();
$('#b-abandonar').addEventListener('click', async () => {
  const i = await modal('<h2>¿Abandonar?</h2><p>La partida queda guardada en este dispositivo y podrás continuarla desde la portada.</p>', [{ texto: 'Seguir jugando', clase: 'claro' }, { texto: 'Abandonar' }]);
  if (i === 1) salirAPortada();
});

// Lo que hay que hacer en la misión, con lo ya cumplido tachado.
function htmlNivel(h, mio) {
  const n = h.nivel || 1, xp = h.xp || 0;
  const desde = D.xpParaNivel(n), hasta = D.xpParaNivel(n + 1);
  const pct = Math.round(((xp - desde) / (hasta - desde)) * 100);
  const mejoras = Object.entries(D.MEJORAS).map(([k, m]) => {
    const tiene = h.mejoras?.[k] || 0;
    return `<button class="btn madera" data-mejora="${k}" ${!mio || !(h.puntos > 0) || tiene >= m.max ? 'disabled' : ''}>${esc(m.nombre)} (${tiene}/${m.max})</button>`;
  }).join('');
  const sc = M.subclaseDe(h);
  const opciones = D.SUBCLASES[h.tipo] || {};
  let esp = '';
  if (sc) esp = `<p style="margin-top:10px"><b>Especialización: ${esc(sc.nombre)}</b> (${esc(sc.papel)}). <span class="nota">${esc(sc.bueno)} ${esc(sc.malo)}</span></p>`
    + [sc.hab, ...(sc.extra || [])].map((hb) => `<p><b>${esc(hb.nombre)}</b>: ${esc(hb.desc)}</p>`).join('');
  else if (n >= D.NIVEL_HABILIDAD) esp = `<h3 class="sec" style="margin-top:12px">Elige especialización</h3><div class="armeria-grid">${Object.entries(opciones).map(([k, o]) => `<div class="item">${svg(o.hab.icono)}<strong>${esc(o.nombre)}</strong>
      <button class="btn" data-subclase="${k}" ${mio ? '' : 'disabled'}>Elegir</button>
      <span><b>${esc(o.hab.nombre)}:</b> ${esc(o.hab.desc)} <br>✔ ${esc(o.bueno)} <br>✘ ${esc(o.malo)}</span></div>`).join('')}</div>`;
  else esp = `<p class="nota" style="margin-top:10px">En el nivel ${D.NIVEL_HABILIDAD} elegirás especialización: ${Object.values(opciones).map((o) => esc(o.nombre)).join(', ')}.</p>`;
  const mejoras2 = mejoras;
  return `<div class="nivel-heroe"><b>Nivel ${n}</b> · ${xp} de experiencia (siguiente nivel a ${hasta})
    <div class="barra-xp"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>
    ${h.puntos > 0 ? `<p><b>Tienes ${h.puntos} ${h.puntos === 1 ? 'mejora' : 'mejoras'} por elegir:</b></p>` : '<p class="nota">Al subir de nivel podrás elegir una mejora.</p>'}
    <div class="mejoras">${mejoras2}</div>${esp}</div>`;
}
function htmlReliquias(e) {
  const r = e.reliquias || {};
  if (!Object.keys(r).length) return '';
  const lineas = [];
  for (const [k, rq] of Object.entries(D.RELIQUIAS)) {
    if (r[k]) lineas.push(`<li><b>${esc(rq.nombre)}</b>: ${esc(rq.desc)}</li>`);
    else if (rq.piezas.some((p) => r[p])) lineas.push(`<li>${esc(rq.piezas.filter((p) => r[p]).map((p) => D.PIEZAS[p].nombre).join(', '))} · falta otra pieza</li>`);
  }
  return `<details class="reliquias-diario"><summary>Reliquias (${Object.keys(D.RELIQUIAS).filter((k) => r[k]).length})</summary><ul>${lineas.join('')}</ul></details>`;
}
function htmlTareas(e) {
  const m = e?.mision;
  if (!m) return '';
  const hecha = (t) => (t.flag && e.flags?.[t.flag]) || (t.matar && e.monstruos.some((x) => x.id === t.matar && !x.vivo))
    || (t.salir && (e.resultado === 'victoria' || Object.values(e.heroes).some((h) => h.fuera)));
  const quedan = M.rondasRestantes(e);
  return `<h3>${esc(m.titulo)}</h3><p class="obj">${esc(m.objetivo.texto)}</p>`
    + (m.maldicion ? `<p class="obj" style="color:var(--lacre)"><b>Maldición: ${esc(D.MALDICIONES[m.maldicion].nombre)}.</b> ${esc(D.MALDICIONES[m.maldicion].desc)}</p>` : '')
    + (e.pesadilla ? '<p class="obj"><b>Modo pesadilla.</b></p>' : '')
    + (m.tareas?.length ? '<ul class="tareas">' + m.tareas.map((t) => `<li class="${hecha(t) ? 'hecha' : ''}">${esc(t.texto)}</li>`).join('') + '</ul>' : '')
    + htmlReliquias(e)
    + (quedan !== null ? `<p class="obj">Quedan <b>${quedan}</b> ${quedan === 1 ? 'ronda' : 'rondas'} antes del derrumbe.</p>` : '')
    + '<button class="enlace" id="b-ver-historia">Releer la historia</button>';
}

function pintarDiario() {
  const e = app.estado;
  const enMision = e?.mision && ['mision', 'resultado', 'briefing'].includes(e.fase);
  $('#diario-mision').hidden = !enMision;
  $('#diario-mision').innerHTML = enMision ? htmlTareas(e) : '';
  $('#b-ver-historia')?.addEventListener('click', () => { app.cerrarModalFuera = () => {}; modal(`<h2>${esc(e.mision.titulo)}</h2><p style="font-size:18px">${esc(e.mision.intro)}</p><p class="objetivo">${esc(e.mision.objetivo.texto)}</p>`, [{ texto: 'Cerrar' }]); });
  const version = document.querySelector('meta[name="version"]')?.content || '';
  $('#diario-sala').hidden = false;
  $('#diario-sala').innerHTML = (app.red ? 'Código de la sala: <b>' + esc(app.red.codigo) + '</b><br>' : '') + '<small>Versión ' + esc(version) + '</small>';
  $('#diario').innerHTML = (e?.log || []).slice().reverse().map((l) => `<li class="${l.tono}">${esc(l.texto)}</li>`).join('');
}

const miHeroeEnTurno = () => {
  const e = app.estado;
  if (!e || e.fase !== 'mision' || !e.turno || e.resultado) return null;
  return M.puedeControlar(e, miId, e.turno.heroe) ? e.heroes[e.turno.heroe] : null;
};

function pintarJuego() {
  actualizarBotonReaccion();
  actualizarAmbiente();
  const e = app.estado;
  // Hojas de personaje.
  $('#hojas').innerHTML = e.orden.map((t) => {
    const h = e.heroes[t], def = D.HEROES[t];
    const vida = Array.from({ length: h.cuerpoMax }, (_, i) => `<i class="${i < h.cuerpo ? '' : 'vacio'}"></i>`).join('');
    const quien = e.jugadores?.[h.jugador]?.nombre || '';
    const clase = [e.turno?.heroe === t && e.fase === 'mision' ? 'activa' : '', h.vivo ? '' : 'muerto', h.fuera ? 'fuera' : ''].join(' ');
    return `<button class="hoja ${clase}" data-heroe="${t}"><span class="ret" style="background:${def.color}">${svg(h.icono)}</span>
      <strong>${esc(h.nombre)}${e.aleatorio ? ` <span class="nv">Nv ${h.nivel || 1}</span>` : ''}</strong><span class="vida" aria-label="Cuerpo ${h.cuerpo} de ${h.cuerpoMax}">${vida}</span><span class="pv">${h.cuerpo}<small>/${h.cuerpoMax}</small></span>
      ${h.ia ? '<span class="jug">Compañero IA</span>' : app.modo !== 'local' ? `<span class="jug">${esc(quien)}</span>` : ''}</button>`;
  }).join('');
  const c = e.cargador;
  if (c) {
    const vida = Array.from({ length: c.cuerpoMax }, (_, i) => `<i class="${i < c.cuerpo ? '' : 'vacio'}"></i>`).join('');
    const patron = e.heroes[c.patron];
    $('#hojas').insertAdjacentHTML('beforeend', `<button class="hoja cargador ${c.vivo ? '' : 'muerto'}" id="hoja-cargador"><span class="ret" style="background:${D.CARGADOR.color}">${svg('cargador')}</span>
      <strong>Cargador</strong><span class="vida" aria-label="Cuerpo ${c.cuerpo} de ${c.cuerpoMax}">${vida}</span><span class="pv">${c.cuerpo}<small>/${c.cuerpoMax}</small></span><span class="jug">${esc(patron ? 'Lo guía ' + art(patron) : '')}</span></button>`);
    $('#hoja-cargador').addEventListener('click', () => verMochila(false));
  }
  $('#hojas').querySelectorAll('[data-heroe]').forEach((b) => b.addEventListener('click', () => fichaHeroe(b.dataset.heroe)));
  const quedan = M.rondasRestantes(e);
  $('#reloj-rondas').hidden = quedan === null;
  if (quedan !== null) {
    $('#reloj-rondas').innerHTML = svg('reloj') + `<b>${quedan}</b> ${quedan === 1 ? 'ronda' : 'rondas'}`;
    $('#reloj-rondas').classList.toggle('urgente', quedan <= 3);
  }
  pintarAcciones();
  if (app.mochilaAbierta) pintarMochila();
}

function pintarAcciones() {
  const e = app.estado;
  const et = $('#estado-turno'), bot = $('#botonera');
  tablero.resaltes = { destinos: {}, ataque: [], magia: [], trampas: [], cargador: {}, muros: [] };
  if (e.fase !== 'mision' || !e.turno) { et.innerHTML = ''; bot.innerHTML = ''; return; }
  const h = e.heroes[e.turno.heroe];
  const mio = miHeroeEnTurno();
  const t = e.turno;
  if (!mio) {
    const quien = e.jugadores?.[h.jugador]?.nombre || 'otro jugador';
    et.innerHTML = `<b>Turno ${esc(del(h))}</b><span>Juega ${esc(quien)}</span>`;
    bot.innerHTML = '';
    return;
  }
  const d = M.disponibles(e, h.id);
  let info = 'Tira los dados para moverte o actúa primero.';
  if (t.movTirada) info = t.movRestante > 0 ? `Te quedan ${t.movRestante} casillas: toca una iluminada.` : (t.accion ? 'Ya has movido y actuado.' : 'Sin movimiento. Puedes hacer tu acción.');
  if (t.accion && t.movTirada && t.movRestante > 0) info = `Acción hecha. Te quedan ${t.movRestante} casillas.`;
  if (app.seleccion?.tipo === 'hechizo') info = 'Toca el objetivo de ' + D.HECHIZOS[app.seleccion.hechizo].nombre + '.';
  if (app.seleccion?.tipo === 'atacar') info = 'Toca el monstruo al que quieres atacar.';
  if (app.moverCargador && !d.cargador) app.moverCargador = false;
  if (app.moverCargador) info = d.cargador.restante > 0 ? `Cargador: ${d.cargador.restante} casillas. Toca dónde llevarlo.` : 'El cargador ya no puede moverse este turno.';
  if (d.trance && d.poseido) app.moverPoseido = true;
  if (d.trance) info = h.alma ? 'Tu cuerpo ha caído: tu alma vive dentro del monstruo.' : 'Tu cuerpo está en trance: controla al poseído.';
  if (app.moverPoseido && !d.poseido) app.moverPoseido = false;
  const aliadoCtrl = app.moverAliado && d.aliados?.find((x) => x.id === app.moverAliado);
  if (app.moverAliado && !aliadoCtrl) app.moverAliado = null;
  if (aliadoCtrl) info = `Diriges a ${aliadoCtrl.nombre}: ${aliadoCtrl.restante} casillas${aliadoCtrl.atacables.length ? ', puede atacar' : ''}. Toca dónde llevarlo o a quién atacar.`;
  if (app.moverPoseido) info = `Controlas a ${nombre(d.poseido.id)}: ${d.poseido.restante} casillas. Toca dónde llevarlo o a quién atacar.`;
  if (app.seleccion?.tipo === 'habilidad' || app.seleccion?.tipo === 'poder') info = 'Toca el objetivo de ' + app.seleccion.nombre + '.';
  if (h.fragmentos) info += ' · Almas: ' + h.fragmentos + '/6';
  if (app.seleccion?.tipo === 'trompa' && !d.trompa) app.seleccion = null;
  if (app.seleccion?.tipo === 'trompa') return pintarTrompa(e, h, d, et, bot);
  if (app.seleccion?.tipo === 'reliquias') return pintarReliquias(e, h, d, et, bot);
  if (app.seleccion?.tipo === 'caliz') return pintarCaliz(e, h, d, et, bot);
  if (d.motivoTiron && !t.movTirada) info = d.motivoTiron;
  et.innerHTML = `<b>${esc(h.nombre)}</b><span>${esc(info)}</span>`;

  if (!app.reproduciendo) {
    if (['hechizo', 'habilidad', 'poder'].includes(app.seleccion?.tipo)) tablero.resaltes.magia = app.seleccion.objetivos;
    else if (app.moverPoseido) { tablero.resaltes.cargador = d.poseido.destinos; tablero.resaltes.ataque = d.poseido.atacables; }
    else if (aliadoCtrl) { tablero.resaltes.cargador = aliadoCtrl.destinos; tablero.resaltes.ataque = aliadoCtrl.atacables; }
    else if (app.moverCargador) tablero.resaltes.cargador = d.cargador.destinos;
    else {
      tablero.resaltes.destinos = d.destinos || {};
      tablero.resaltes.ataque = d.atacables || [];
      tablero.resaltes.trampas = d.desarmables || [];
    }
  }
  // Botonera por grupos: lo de siempre (mover, atacar, hechizo, fin) siempre a la vista;
  // lo que depende del sitio solo cuando se puede usar; lo demás, en «Más».
  const fijos = [], aqui = [], mas = [];
  const html = (id, icono, texto, extra = {}) => `<button class="acc ${extra.clase || ''}" ${extra.hab ? `data-hab="${id}"` : `data-acc="${id}"`} ${extra.off ? 'disabled' : ''} ${extra.titulo ? `title="${esc(extra.titulo)}"` : ''}>${svg(icono)}<span>${esc(texto)}</span>${extra.n ? `<span class="n">${esc(extra.n)}</span>` : ''}</button>`;
  // grupo: 'fijo' siempre; 'aqui' en la barra si se puede usar y si no en «Más»; 'mas' siempre en «Más».
  const boton = (id, icono, texto, extra = {}, grupo = 'aqui') => {
    const x = html(id, icono, texto, extra);
    if (grupo === 'fijo') fijos.push(x);
    else if (grupo === 'aqui' && !extra.off) aqui.push(x);
    else mas.push({ x, ok: !extra.off });
  };
  if (d.puedeTirar) boton('tirar', 'dados', 'Mover', { clase: 'principal', n: dadosTxt(h) }, 'fijo');
  boton('atacar', 'atacar', 'Atacar', { off: !d.atacables.length, n: D.ARMAS[h.arma].nombre, titulo: d.motivoAtaque, clase: app.seleccion?.tipo === 'atacar' ? 'activo' : '' }, 'fijo');
  if (h.hechizos.length) boton('hechizo', 'hechizo', 'Hechizo', { off: !d.hechizos.length, n: h.hechizos.length + ' restantes', clase: app.seleccion?.tipo === 'hechizo' ? 'activo' : '' }, 'fijo');
  if (d.poseido) boton('poseido', 'mente', app.moverPoseido ? 'Volver a tu héroe' : 'Controlar a ' + nombre(d.poseido.id), { clase: app.moverPoseido ? 'activo' : 'principal', n: d.poseido.restante + ' casillas' + (d.poseido.atacables.length ? ' · puede atacar' : '') }, 'fijo');
  for (const al of d.aliados || []) boton('aliado:' + al.id, 'calavera', app.moverAliado === al.id ? 'Volver a tu héroe' : 'Dirigir ' + al.nombre.toLowerCase(),
    { clase: app.moverAliado === al.id ? 'activo' : '', n: al.restante + ' casillas' + (al.atacables.length ? ' · puede atacar' : '') + ' · ' + (al.turnos + 1) + (al.turnos ? ' rondas' : ' ronda'), off: !al.restante && !al.atacables.length && app.moverAliado !== al.id }, 'aqui');
  if (d.poseido?.poder) boton('poder', 'mente', d.poseido.poder.nombre, { n: 'poder del poseído', clase: app.seleccion?.tipo === 'poder' ? 'activo' : '' });
  for (const hb of d.habilidades || []) boton(hb.id, hb.icono, hb.nombre, { hab: true, off: !hb.ok, n: hb.ok ? 'habilidad' : hb.motivo, clase: app.seleccion?.habilidad === hb.id ? 'activo' : '' });
  if (d.desarmables.length) boton('desarmar', 'llave', 'Desarmar');
  if (d.puertas?.length) boton('puerta', 'puerta', 'Abrir puerta', { n: d.puertas.every((p) => p.bloqueada) ? 'cerrada' : '' });
  if (d.altar) boton('altar', 'altar', 'Rezar', { n: D.DIOSES[d.altar.dios].nombre });
  if (d.mercader) boton('mercader', 'mochila', 'Comerciar', { n: d.mercader.items.length + ' cosas a la venta' });
  if (d.calderos?.length) boton('caldero', 'caldero', 'Beber del caldero', { n: '¿suerte?' });
  boton('tesoro', 'cofreAbierto', 'Buscar tesoro', { off: !d.buscarTesoro, titulo: d.motivoBusqueda, n: d.buscarTesoro ? '' : d.motivoBusqueda });
  boton('trampas', 'buscar', 'Buscar trampas', { off: !d.buscarTrampas, n: 'y puertas secretas' });
  if (d.cargador) {
    boton('cargador', 'cargador', app.moverCargador ? 'Mover a tu héroe' : 'Cargador', { clase: app.moverCargador ? 'activo' : '', n: d.cargador.puedeTirar ? 'tirar y mover' : d.cargador.restante + ' casillas', off: !d.cargador.puedeTirar && d.cargador.restante <= 0 && !app.moverCargador });
    boton('seguir', 'mover', 'Que me siga', { off: !d.cargador.puedeTirar && d.cargador.restante <= 0 }, 'mas');
  }
  if (d.cercaCargador) boton('mochila', 'mochila', 'Mochila', { off: !d.mochila, titulo: d.mochila ? '' : d.motivoMochila, n: t.mochila ? 'abierta' : (d.mochila ? '1 casilla' : d.motivoMochila) });
  if (d.pociones.length) boton('pocion', 'pocion', 'Poción', { n: d.pociones.reduce((s, p) => s + h.objetos[p], 0) + '' }, 'mas');
  const usables = d.reliquias.filter((r) => r.ok).length + (d.trompa?.apoyos.length ? 1 : 0);
  if (d.reliquias.length || d.trompa || e.reliquias?.jerico) boton('reliquias', 'corona', 'Reliquias', { n: usables ? usables + (usables === 1 ? ' disponible' : ' disponibles') : 'ninguna ahora' }, usables ? 'aqui' : 'mas');
  if (d.salir) boton('salir', 'escalera', 'Salir', { clase: 'principal' }, 'fijo');
  else if (enLaEscalera(e, h)) boton('salir', 'escalera', 'Salir', { off: true, n: 'Aún no', titulo: motivoNoSalir(e) }, 'fijo');
  const b = [...fijos, ...aqui];
  if (app.verMas && (!mas.length || app.verMasDe !== t.heroe + ':' + e.ronda)) app.verMas = false;
  if (app.verMas) {
    et.innerHTML = `<b>Más acciones</b><span>Lo que no se puede usar ahora sale apagado, con el motivo.</span>`;
    b.length = 0; b.push(...mas.map((m) => m.x), html('menos', 'reloj', 'Volver'));
  } else {
    if (mas.length) b.push(html('mas', 'pergamino', 'Más', { n: ((k) => (k ? k + (k === 1 ? ' disponible' : ' disponibles') : mas.length + (mas.length === 1 ? ' opción' : ' opciones')))(mas.filter((m) => m.ok).length) }));
    b.push(html('fin', 'reloj', 'Fin del turno'));
  }
  bot.innerHTML = b.join('');
  bot.querySelectorAll('[data-acc]').forEach((x) => x.addEventListener('click', () => accionBoton(x.dataset.acc, h, d)));
  bot.querySelectorAll('[data-hab]').forEach((x) => x.addEventListener('click', () => usarHabilidadUI(x.dataset.hab, h, d)));
  if (app.reproduciendo) bot.querySelectorAll('button').forEach((x) => (x.disabled = true));
}
// Reliquias: lista con las forjadas y para qué sirve cada una ahora.
function pintarReliquias(e, h, d, et, bot) {
  et.innerHTML = `<b>Reliquias</b><span>Elige cuál usar. Las piezas que os faltan están en el Diario.</span>`;
  const b = [];
  const fila = (id, ok, motivo, extra = '') => b.push(`<button class="acc ${ok ? 'principal' : ''}" data-rq="${id}" ${extra} ${ok ? '' : 'disabled'}>${svg(D.RELIQUIAS[id].icono)}<span>${esc(D.RELIQUIAS[id].nombre)}</span><span class="n">${esc(ok ? '' : motivo)}</span></button>`);
  if (e.reliquias?.jerico) {
    const usada = e.reliquiasUsadas?.jerico;
    const mago = D.HEROES[h.tipo].sinArmadura;
    fila('jerico', !!d.trompa, usada ? 'Ya la habéis usado en esta misión.' : !mago ? 'Solo el mago sabe tocarla.' : '');
  }
  for (const r of d.reliquias) {
    if (r.id === 'cadena' && r.ok && r.companeros.length > 1) {
      for (const c of r.companeros) b.push(`<button class="acc principal" data-rq="cadena" data-con="${esc(c)}">${svg('verja')}<span>Cadena con ${esc(e.heroes[c].nombre)}</span></button>`);
      continue;
    }
    fila(r.id, r.ok, r.motivo, r.id === 'cadena' && r.ok ? `data-con="${esc(r.companeros[0])}"` : '');
  }
  b.push(`<button class="acc" data-rq="">${svg('reloj')}<span>Volver</span></button>`);
  bot.innerHTML = b.join('');
  bot.querySelectorAll('[data-rq]').forEach((x) => x.addEventListener('click', async () => {
    const id = x.dataset.rq;
    app.seleccion = null;
    if (!id) return pintarAcciones();
    if (id === 'jerico') { app.seleccion = { tipo: 'trompa' }; return pintarAcciones(); }
    app.cerrarModalFuera = () => {};
    const si = await modal(`<h2>${esc(D.RELIQUIAS[id].nombre)}</h2><p>${esc(D.RELIQUIAS[id].desc)}</p>`, [{ texto: 'Mejor no', clase: 'claro' }, { texto: 'Usarla' }]);
    if (si !== 1) return pintarAcciones();
    enviar({ heroe: h.id, tipo: 'reliquia', reliquia: id, companero: x.dataset.con });
  }));
  if (app.reproduciendo) bot.querySelectorAll('button').forEach((x) => (x.disabled = true));
}

// Cáliz Partido: elegir el efecto del caldero (o tirar el dado como siempre).
const EFECTOS_CALDERO = { 4: '+1 dado en tu próximo ataque', 5: 'Robustez: +1 dado de defensa', 6: 'Recuperar toda la vida' };
function pintarCaliz(e, h, d, et, bot) {
  const caldero = app.seleccion.caldero ?? d.calderos?.[0];
  if (caldero === undefined || !d.calderos.includes(caldero)) { app.seleccion = null; return pintarAcciones(); }
  et.innerHTML = `<b>Cáliz Partido</b><span>Elegir el efecto cuesta 1 de cuerpo máximo hasta acabar la misión. Tirar el dado, nada.</span>`;
  const b = [`<button class="acc principal" data-cz="0">${svg('dados')}<span>Tirar el dado</span><span class="n">como siempre</span></button>`];
  for (const [n, txt] of Object.entries(EFECTOS_CALDERO)) b.push(`<button class="acc" data-cz="${n}">${svg('pocion')}<span>${esc(txt)}</span><span class="n">−1 cuerpo máx.</span></button>`);
  b.push(`<button class="acc" data-cz="x">${svg('reloj')}<span>Volver</span></button>`);
  bot.innerHTML = b.join('');
  bot.querySelectorAll('[data-cz]').forEach((x) => x.addEventListener('click', () => {
    app.seleccion = null;
    if (x.dataset.cz === 'x') return pintarAcciones();
    enviar({ heroe: h.id, tipo: 'caldero', caldero, elegido: +x.dataset.cz || undefined });
  }));
  if (app.reproduciendo) bot.querySelectorAll('button').forEach((x) => (x.disabled = true));
}

// Trompa de Jericó: al sacarla brillan los muros frágiles a la vista y se elige qué hacer.
const FLECHAS = { '1,0': '→', '-1,0': '←', '0,1': '↓', '0,-1': '↑' };
function pintarTrompa(e, h, d, et, bot) {
  const vis = (c) => !!e.revelado[T.clave(c[0], c[1])];
  tablero.resaltes.muros = (e.muros || []).filter((w) => !w.roto && (vis(w.a) || vis(w.b))).map((w) => w.id);
  const nombreDe = (id) => (id === 'cargador' ? 'el cargador' : e.heroes[id].nombre);
  const hayMuros = tablero.resaltes.muros.length;
  et.innerHTML = `<b>Trompa de Jericó</b><span>${esc(d.trompa.motivo || ((hayMuros ? 'Los muros que brillan se pueden derribar. ' : 'No veis ningún muro frágil. ') + 'Suena hacia donde está quien la sujeta.'))}</span>`;
  const b = [];
  for (const ap of d.trompa.apoyos) {
    const f = FLECHAS[ap.dir.join(',')];
    b.push(`<button class="acc principal" data-trompa="${esc(ap.id)}" data-modo="aturdir">${svg('viento')}<span>${f} Estruendo</span><span class="n">sujeta ${esc(nombreDe(ap.id))} · ${ap.enemigos} ${ap.enemigos === 1 ? 'enemigo' : 'enemigos'}</span></button>`);
    if (ap.muro) b.push(`<button class="acc principal" data-trompa="${esc(ap.id)}" data-modo="muro">${svg('derrumbe')}<span>${f} Romper el muro</span><span class="n">sujeta ${esc(nombreDe(ap.id))}</span></button>`);
  }
  b.push(`<button class="acc" data-trompa="">${svg('reloj')}<span>Guardarla</span></button>`);
  bot.innerHTML = b.join('');
  bot.querySelectorAll('[data-trompa]').forEach((x) => x.addEventListener('click', () => {
    app.seleccion = null;
    if (!x.dataset.trompa) return pintarAcciones();
    enviar({ heroe: h.id, tipo: 'trompa', apoyo: x.dataset.trompa, modo: x.dataset.modo });
  }));
  if (app.reproduciendo) bot.querySelectorAll('button').forEach((x) => (x.disabled = true));
}
async function usarHabilidadUI(id, h, d) {
  const hb = d.habilidades.find((x) => x.id === id);
  if (!hb?.ok) return;
  app.verMas = false;
  const enviarHab = (objetivo) => enviar({ heroe: h.id, tipo: 'habilidad', habilidad: id, objetivo });
  if (hb.objetivos.length === 1 || hb.objetivo === 'ninguno') return enviarHab(hb.objetivos[0]);
  if (hb.objetivo === 'monstruo' || hb.objetivo === 'heroe') { app.seleccion = { tipo: 'habilidad', habilidad: id, nombre: hb.nombre, objetivos: hb.objetivos }; return pintarAcciones(); }
  // Elegir de una lista: derrumbes/muros, muertos para alzar, caídos para revivir.
  const e = app.estado;
  const texto = (o) => o.startsWith('roca:') ? 'El derrumbe de ' + o.split(':')[1] : o.startsWith('muro:') ? 'El muro frágil'
    : e.heroes[o] ? e.heroes[o].nombre : (e.monstruos.find((m) => m.id === o)?.nombre || o);
  app.cerrarModalFuera = () => {};
  const i = await modal('<h2>' + esc(hb.nombre) + '</h2><p>Elige:</p>', [{ texto: 'Nada', clase: 'claro' }, ...hb.objetivos.map((o) => ({ texto: texto(o) }))]);
  if (i > 0) enviarHab(hb.objetivos[i - 1]);
}
const enLaEscalera = (e, h) => e.escalera.some(([x, y]) => x === h.x && y === h.y);
function motivoNoSalir(e) {
  const o = e.mision.objetivo;
  if (o.tipo === 'matar') return 'En esta misión no se sale por la escalera: ' + o.texto.charAt(0).toLowerCase() + o.texto.slice(1);
  return 'Aún no podéis salir. Objetivo: ' + o.texto;
}
const dadosTxt = (h) => (M.dadosMovimiento(h) === 1 ? '1 dado' : '2 dados');

async function accionBoton(acc, h, d) {
  const base = { heroe: h.id };
  if (acc.startsWith('aliado:')) { const id = acc.slice(7); app.moverAliado = app.moverAliado === id ? null : id; app.moverPoseido = false; app.moverCargador = false; app.seleccion = null; app.verMas = false; return pintarAcciones(); }
  if (acc === 'mas' || acc === 'menos') { app.verMas = acc === 'mas'; app.verMasDe = h.id + ':' + app.estado.ronda; return pintarAcciones(); }
  app.verMas = false;
  switch (acc) {
    case 'tirar': return enviar({ ...base, tipo: 'tirar' });
    case 'atacar':
      if (d.atacables.length === 1) return enviar({ ...base, tipo: 'atacar', objetivo: d.atacables[0] });
      app.seleccion = { tipo: 'atacar' }; return pintarAcciones();
    case 'hechizo': return elegirHechizo(h, d);
    case 'tesoro': return enviar({ ...base, tipo: 'buscarTesoro' });
    case 'trampas': return enviar({ ...base, tipo: 'buscarTrampas' });
    case 'desarmar': return enviar({ ...base, tipo: 'desarmar', trampa: d.desarmables[0] });
    case 'pocion': return elegirPocion(h, d);
    case 'puerta': return enviar({ ...base, tipo: 'abrirPuerta', puerta: (d.puertas.find((p) => !p.bloqueada) || d.puertas[0]).id });
    case 'reliquias': app.seleccion = { tipo: 'reliquias' }; return pintarAcciones();
    case 'altar': {
      const dios = D.DIOSES[d.altar.dios];
      app.cerrarModalFuera = () => {};
      const ops = { guerra: [['ataque', '+1 dado de ataque (−2 cuerpo)'], ['defensa', '+1 dado de defensa (−2 cuerpo)']],
        suerte: [['ruleta', 'Tentar a la suerte'], ...(M.malditaPuesta(h) ? [['purificar', 'Purificar el arma maldita (200 monedas)']] : [])], avaricia: [['poco', 'Ofrecer 50 monedas'], ['bastante', 'Ofrecer 150 monedas'], ['mucho', 'Ofrecer 350 monedas']] }[d.altar.dios];
      const i = await modal(`<h2>${esc(dios.nombre)}</h2><p>${esc(dios.desc)}</p><p class="nota">Rezar gasta tu acción. Cada altar responde una sola vez.</p>`, [{ texto: 'Irse', clase: 'claro' }, ...ops.map(([, t]) => ({ texto: t }))]);
      return i > 0 ? enviar({ ...base, tipo: 'rezar', opcion: ops[i - 1][0] }) : null;
    }
    case 'mercader': {
      const nombreIt = (it) => D.MERCANCIA[it]?.nombre || D.ARMAS[it]?.nombre || D.ARMADURAS[it]?.nombre || D.POCIONES[it]?.nombre || it;
      const descIt = (it) => ((D.ARMAS[it] || D.ARMADURAS[it])?.mercader ? '★ Solo la vende él. ' + ((D.ARMAS[it]?.ataque ? D.ARMAS[it].ataque + ' dados de ataque. ' : '') + '✔ ' + (D.ARMAS[it] || D.ARMADURAS[it]).bueno + ' ✘ ' + (D.ARMAS[it] || D.ARMADURAS[it]).malo) : '') || D.MERCANCIA[it]?.desc || D.POCIONES[it]?.desc || (D.ARMAS[it] ? D.ARMAS[it].ataque + ' dados de ataque' : D.ARMADURAS[it] ? '+' + D.ARMADURAS[it].defensa + ' de defensa' : '');
      const items = d.mercader.items;
      app.cerrarModalFuera = () => {};
      const lista = items.map((it) => `<li><b>${esc(nombreIt(it))}</b> — ${M.precioMercader(app.estado, it)} monedas <span class="nota">${esc(descIt(it))}</span></li>`).join('');
      const ops = [{ texto: 'Ahora no', clase: 'claro', id: 'cerrar' }, { texto: 'No me interesa (que se vaya)', clase: 'claro', id: 'despedir' },
        ...items.map((it) => ({ texto: 'Comprar ' + nombreIt(it) + ' · ' + M.precioMercader(app.estado, it), id: 'comprar', it })),
        ...items.map((it) => ({ texto: 'Robar ' + nombreIt(it), clase: 'claro', id: 'robar', it })),
        ...(d.mercader.puedeAtacar ? [{ texto: 'Atacar al mercader', clase: 'claro', id: 'atacar' }] : [])];
      const i = await modal(`<h2>Mercader errante</h2><p>«Cosas raras, amigo. Todo tiene un precio… y yo nunca olvido una cara.»</p><ul>${lista}</ul><p class="nota">Llevas ${h.oro} monedas en la bolsa. Comprar no gasta tu acción.</p>`, ops);
      const op = ops[i];
      if (!op || op.id === 'cerrar') return null;
      if (op.id === 'despedir') return enviar({ ...base, tipo: 'mercader', despedir: true });
      if (op.id === 'comprar') return enviar({ ...base, tipo: 'mercader', item: op.it });
      // Robar o atacar lo vuelve hostil: mejor confirmarlo.
      const seguro = await modal(`<h2>¿Seguro?</h2><p>Si ${op.id === 'robar' ? 'le robas' : 'le atacas'}, el mercader saca su hacha: es de lo más duro del piso, y el resto de la partida los mercaderes os cobrarán el triple o irán a por vosotros.</p>`,
        [{ texto: 'Mejor no', clase: 'claro' }, { texto: op.id === 'robar' ? 'Robar' : 'Atacar' }]);
      if (seguro !== 1) return null;
      if (op.id === 'robar') return enviar({ ...base, tipo: 'mercader', item: op.it, robar: true });
      return enviar({ ...base, tipo: 'atacar', objetivo: d.mercader.id, alMercader: true });
    }
    case 'poder': {
      const pd = d.poseido.poder;
      if (pd.objetivos.length === 1) return enviar({ ...base, tipo: 'poderPoseido', objetivo: pd.objetivos[0] });
      if (pd.objetivos[0].includes(':')) {
        const i = await modal('<h2>' + esc(pd.nombre) + '</h2>', [{ texto: 'Nada', clase: 'claro' }, ...pd.objetivos.map((o) => ({ texto: o.startsWith('roca') ? 'El derrumbe' : 'El muro frágil' }))]);
        return i > 0 ? enviar({ ...base, tipo: 'poderPoseido', objetivo: pd.objetivos[i - 1] }) : null;
      }
      const vivos = pd.objetivos.filter((id) => app.estado.heroes[id] || app.estado.monstruos.find((m) => m.id === id)?.vivo);
      if (!vivos.length) {
        const i = await modal('<h2>' + esc(pd.nombre) + '</h2>', [{ texto: 'Nada', clase: 'claro' }, ...pd.objetivos.map((o) => ({ texto: app.estado.monstruos.find((m) => m.id === o)?.nombre || o }))]);
        return i > 0 ? enviar({ ...base, tipo: 'poderPoseido', objetivo: pd.objetivos[i - 1] }) : null;
      }
      app.seleccion = { tipo: 'poder', objetivos: pd.objetivos, nombre: pd.nombre }; return pintarAcciones();
    }
    case 'poseido': app.moverAliado = null; app.moverPoseido = !app.moverPoseido; app.moverCargador = false; app.seleccion = null; return pintarAcciones();
    case 'habilidadVieja': {
      const objs = d.habilidad.objetivos;
      if (objs.length === 1) return enviar({ ...base, tipo: 'habilidad', objetivo: objs[0] });
      if (D.HABILIDADES[h.tipo].id === 'rompepiedras') {
        const i = await modal('<h2>Rompepiedras</h2><p>¿Qué revientas?</p>', [{ texto: 'Nada', clase: 'claro' }, ...objs.map((o) => ({ texto: o.startsWith('roca') ? 'El derrumbe de ' + o.split(':')[1] : 'El muro frágil' }))]);
        return i > 0 ? enviar({ ...base, tipo: 'habilidad', objetivo: objs[i - 1] }) : null;
      }
      app.seleccion = { tipo: 'habilidad', objetivos: objs }; return pintarAcciones();
    }
    case 'caldero':
      if (app.estado.reliquias?.caliz) { app.seleccion = { tipo: 'caliz' }; return pintarAcciones(); }
      return enviar({ ...base, tipo: 'caldero', caldero: d.calderos[0] });
    case 'salir': return enviar({ ...base, tipo: 'salir' });
    case 'cargador':
      if (app.moverCargador) { app.moverCargador = false; return pintarAcciones(); }
      app.moverCargador = true;
      if (d.cargador.puedeTirar) return enviar({ ...base, tipo: 'tirarCargador' });
      return pintarAcciones();
    case 'seguir': app.moverCargador = false; return enviar({ ...base, tipo: 'seguir' });
    case 'mochila': return abrirMochila(h);
    case 'fin': {
      const t = app.estado.turno;
      if (!t.accion && !t.movTirada) {
        const i = await modal('<h2>¿Terminar el turno?</h2><p>Todavía no te has movido ni has hecho ninguna acción.</p>', [{ texto: 'Volver', clase: 'claro' }, { texto: 'Terminar turno' }]);
        if (i !== 1) return;
      }
      return enviar({ ...base, tipo: 'finTurno' });
    }
  }
}

async function elegirHechizo(h, d) {
  app.cerrarModalFuera = () => {};
  const html = `<h2>Hechizos ${esc(del(h))}</h2><p class="nota">Cada hechizo se usa una vez por misión.</p><div class="lista-hechizos">${
    h.hechizos.map((id) => {
      const hz = D.HECHIZOS[id], el = D.ELEMENTOS[hz.elemento];
      const ok = d.hechizos.some((x) => x.id === id);
      return `<button class="hz" data-hz="${id}" ${ok ? '' : 'disabled style="opacity:.45"'}>${svg(el.icono, `style="fill:${el.color}"`)}<strong>${esc(hz.nombre)}</strong><span>${esc(hz.desc)}${ok ? '' : ' (sin objetivo a la vista)'}</span></button>`;
    }).join('')}</div>`;
  const p = modal(html, [{ texto: 'Cancelar', clase: 'claro' }]);
  $('#modal-cuerpo').querySelectorAll('[data-hz]').forEach((b) => b.addEventListener('click', () => {
    $('#modal').hidden = true;
    const hz = d.hechizos.find((x) => x.id === b.dataset.hz);
    if (D.HECHIZOS[hz.id].objetivo === 'heroe' && hz.objetivos.length === 1) return enviar({ heroe: h.id, tipo: 'hechizo', hechizo: hz.id, objetivo: hz.objetivos[0] });
    app.seleccion = { tipo: 'hechizo', hechizo: hz.id, objetivos: hz.objetivos };
    pintarAcciones();
  }));
  await p;
}

async function elegirPocion(h, d) {
  const html = `<h2>Pociones</h2><div class="lista-hechizos">${d.pociones.map((p) => {
    const def = D.POCIONES[p];
    return `<button class="hz" data-p="${p}">${svg(def.icono, 'style="fill:var(--lacre)"')}<strong>${esc(def.nombre)} ×${h.objetos[p]}</strong><span>${esc(def.desc)}</span></button>`;
  }).join('')}</div>`;
  const pr = modal(html, [{ texto: 'Cancelar', clase: 'claro' }]);
  $('#modal-cuerpo').querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { $('#modal').hidden = true; enviar({ heroe: h.id, tipo: 'pocion', objeto: b.dataset.p }); }));
  await pr;
}

// =============================================================
//  MOCHILA DEL CARGADOR (almacén del grupo durante la misión)
// =============================================================
function abrirMochila(h) {
  if (!app.estado.turno.mochila) enviar({ heroe: h.id, tipo: 'mochila', op: 'abrir' });
  app.mochilaAbierta = h.id;
  pintarMochila();
}
// Solo consulta (tocando la hoja del cargador): sin coste ni cambios.
function verMochila() {
  app.mochilaAbierta = '__ver';
  pintarMochila();
}
function filaItem(item, boton, motivo) {
  const def = D.ARMAS[item] || D.ARMADURAS[item] || D.POCIONES[item];
  const desc = def.ataque ? def.ataque + ' dados de ataque' : def.defensa ? '+' + def.defensa + ' de defensa' : def.desc || '';
  return `<div class="item">${svg(def.icono)}<strong>${esc(def.nombre)}</strong>${boton || ''}<span>${esc(motivo || desc)}</span></div>`;
}
// Agrupa objetos repetidos: [['espadaCorta', 2], ...]
const agrupar = (items) => { const m = new Map(); for (const i of items) m.set(i, (m.get(i) || 0) + 1); return [...m]; };
function pintarMochila() {
  const e = app.estado;
  const soloVer = app.mochilaAbierta === '__ver';
  const h = soloVer ? null : e.heroes[app.mochilaAbierta];
  const t = e.turno;
  const sigue = h && e.fase === 'mision' && t?.heroe === h.id && M.disponibles(e, h.id).mochila;
  const c = e.cargador;
  let html = `<h2>Mochila del cargador</h2>`;
  if (soloVer) {
    // Consulta: lo que lleva cada héroe en la mochila.
    html += '<p class="nota">Cada héroe solo puede coger lo suyo. Si el cargador muere, todo se pierde.</p>';
    for (const t of e.orden) {
      const items = M.contenido(c?.carga?.[t]);
      html += `<h3 class="sec">De ${esc(art(e.heroes[t]))}</h3>` + (items.length ? '<div class="armeria-grid">' + agrupar(items).map(([i, n]) => filaItem(i, '', n > 1 ? '×' + n : '')).join('') + '</div>' : '<p class="nota">Nada.</p>');
    }
  }
  const items = h ? M.contenido(c?.carga?.[h.id]) : [];
  if (h) {
    html += `<p class="nota">${sigue ? 'Coge o deja lo que quieras: ya has pagado la casilla de este turno.' : 'Ya no estás junto al cargador.'}</p>
      <h3 class="sec">Lo que lleva ${esc(art(h))}</h3><div class="armeria-grid">
      ${filaItem(h.arma, '', 'Arma equipada: cámbiala cogiendo otra')}
      ${h.armaduras.map((a) => filaItem(a, `<button class="btn claro" data-guardar="${a}" ${sigue ? '' : 'disabled'}>Dejar</button>`)).join('')}
      ${Object.entries(h.objetos).filter(([k, n]) => n > 0 && D.POCIONES[k]).map(([k, n]) => filaItem(k, `<button class="btn claro" data-guardar="${k}" ${sigue ? '' : 'disabled'}>Dejar</button>`, D.POCIONES[k].nombre + ' ×' + n)).join('')}
      </div>`;
  }
  if (h) html += `<h3 class="sec">Tus cosas en la mochila</h3>`;
  if (h && !items.length) html += '<p class="nota">No llevas nada en la mochila. Se carga en el campamento, antes de bajar.</p>';
  else if (h) {
    html += '<div class="armeria-grid">' + agrupar(items).map(([i, n]) => {
      const motivo = M.motivoNoEquipar(h, i);
      const btn = h ? `<button class="btn" data-coger="${i}" ${sigue && !motivo ? '' : 'disabled'} title="${esc(motivo || '')}">Coger</button>` : '';
      return filaItem(i, btn, motivo || (n > 1 ? '×' + n : ''));
    }).join('') + '</div>';
  }
  $('#modal-cuerpo').innerHTML = html + `<div class="fila" style="margin-top:14px"><button class="btn" id="b-cerrar-mochila">Cerrar</button></div>`;
  $('#modal').hidden = false;
  app.cerrarModalFuera = () => { app.mochilaAbierta = null; };
  $('#b-cerrar-mochila').addEventListener('click', () => { $('#modal').hidden = true; app.mochilaAbierta = null; });
  $('#modal-cuerpo').querySelectorAll('[data-coger]').forEach((b) => b.addEventListener('click', () => enviar({ heroe: h.id, tipo: 'mochila', op: 'equipar', item: b.dataset.coger })));
  $('#modal-cuerpo').querySelectorAll('[data-guardar]').forEach((b) => b.addEventListener('click', () => enviar({ heroe: h.id, tipo: 'mochila', op: 'guardar', item: b.dataset.guardar })));
}

// Carta del monstruo, como las de los héroes pero en negro y rojo.
// No muestra cómo se comporta (sería un spoiler).
function fichaMonstruo(m) {
  const base = D.MONSTRUOS[m.tipo];
  const vida = Array.from({ length: m.cuerpoMax }, (_, i) => `<i class="${i < m.cuerpo ? '' : 'vacio'}"></i>`).join('');
  const ef = m.efectos || {};
  const estados = [ef.dormido && 'Dormido', ef.aturdido && 'Aturdido', ef.raices > 0 && 'Atrapado por raíces', ef.poseido && 'Poseído', ef.veneno && 'Envenenado', m.aliado && 'Aliado vuestro'].filter(Boolean);
  app.cerrarModalFuera = () => {};
  modal(`<div class="tarjeta monstruo">
      <div class="estandarte">${esc(m.nombre)}</div>
      ${m.jefe ? '<div class="sello-jefe">Jefe</div>' : m.elite ? '<div class="sello-jefe">Élite</div>' : ''}
      <div class="retrato" style="--c:${base.color}">${svg(base.icono)}</div>
      <div class="vida-m" aria-label="Cuerpo ${m.cuerpo} de ${m.cuerpoMax}">${vida}<span>${m.cuerpo} / ${m.cuerpoMax}</span></div>
      <div class="stats4">
        <div><span>Movimiento</span><b>${m.mov}</b></div>
        <div><span>Dados de ataque</span><b>${m.ataque}</b></div>
        <div><span>Dados de defensa</span><b>${m.defensa}</b></div>
        <div><span>Puntos mentales</span><b>${m.mente}</b></div>
      </div>
      <dl class="lineas">
        ${m.nomuerto ? '<dt>No muerto</dt><dd>Inmune al sueño</dd>' : ''}
        ${estados.length ? `<dt>Estado</dt><dd>${esc(estados.join(', '))}</dd>` : ''}
        ${m.hechizos?.length ? `<dt>Hechizos</dt><dd>${m.hechizos.length} por lanzar</dd>` : ''}
      </dl>
    </div>`, [{ texto: 'Cerrar' }]);
}

function fichaHeroe(t) {
  const e = app.estado, h = e.heroes[t], def = D.HEROES[t];
  const pots = Object.entries(h.objetos).filter(([, n]) => n > 0).map(([k, n]) => D.POCIONES[k]?.nombre + ' ×' + n).join(', ');
  const hz = h.hechizos.map((x) => D.HECHIZOS[x].nombre).join(', ');
  const ef = Object.entries(h.efectos).map(([k, v]) => ({ piel: 'Piel de roca', coraje: '+2 dados de ataque', fuerza: '+2 dados de ataque', veloz: 'Movimiento doble', niebla: 'Oculto en la niebla',
    calderoAtq: v > 0 ? '+1 dado en el próximo ataque' : '−1 dado en el próximo ataque', calderoDef: v > 0 ? 'Robustez (+1 dado de defensa)' : 'Vulnerable (−1 dado de defensa)', sordo: 'Medio sordo (−1 dado de defensa)', farol: 'Lleva el farol encendido (los monstruos van a por él)', furia: 'En furia: no tira defensa hasta su turno', trance: 'En trance: su alma está en otro cuerpo', escudoPiedra: 'Escudo de piedra: el próximo golpe no le hace daño', grito: '+1 dado de ataque (grito de guerra)', provoca: 'Los monstruos van a por él', agotado: 'Agotado: 1 dado de movimiento y −1 defensa', sombras: 'Invisible entre las sombras', escudoTotal: 'Tras un escudo de piedra: no recibe daño', petrificado: 'Petrificado: 1 dado de movimiento', brazosPiedra: 'Brazos de piedra: no puede atacar', aturdidoRuido: 'Medio sordo: −1 defensa', furiaB: 'Furia enana: golpes dobles, sin defensa, no retrocede', agotadoFuria: 'Agotado tras la furia: 1 dado de movimiento y −1 ataque', pechoDescubierto: 'Pecho descubierto: −1 defensa', recarga: 'Recargando: −1 dado a distancia', marcado: 'Marcado: los monstruos van a por él y −1 defensa', bestia: 'La bestia sigue dentro: sin hechizos', mareo: 'Mareado: 1 dado de movimiento y −1 defensa', ayuno: 'Ayuno sagrado: sin atacar ni hechizos', capa: 'Invisible bajo la capa de sombras', veneno: 'Envenenado: −1 de cuerpo cada turno hasta curarse', guerraAtq: '+1 ataque (Dios de la guerra)', guerraDef: '+1 defensa (Dios de la guerra)', malaSuerte: 'Mala suerte: −1 defensa', oso: 'En forma de oso', bendicion: 'Bendecido: +1 defensa', dominado: 'Dominado: el enemigo le controla en su próximo turno', cadena: 'Encadenado con su hermano de armas', muro: 'Plantado tras el escudo', tiron: 'Tirón de la cadena: no se mueve su próximo turno' }[k])).filter(Boolean).join(', ');
  app.cerrarModalFuera = () => {};
  modal(`${tarjetaHTML(t, h.fem, h)}<p class="nota" style="margin-top:12px">${esc(def.lema)}${h.kit ? ' Lleva herramientas para desarmar trampas.' : ''}</p>
    ${pots ? `<p><b>Pociones:</b> ${esc(pots)}</p>` : ''}${hz ? `<p><b>Hechizos que le quedan:</b> ${esc(hz)}</p>` : ''}${ef ? `<p><b>Efectos:</b> ${esc(ef)}</p>` : ''}`, [{ texto: 'Cerrar' }]);
}

function alTocar(x, y) {
  const e = app.estado;
  if (!e || e.fase !== 'mision' || app.reproduciendo) return;
  const h = miHeroeEnTurno();
  const f = T.figuraEn(e, x, y);
  const k = T.clave(x, y);
  if (h) {
    const d = M.disponibles(e, h.id);
    if (app.moverCargador && d.cargador) {
      if (d.cargador.destinos[k]) return enviar({ heroe: h.id, tipo: 'moverCargador', x, y });
      if (f?.id !== 'cargador') { app.moverCargador = false; pintarAcciones(); }
    }
    const al = app.moverAliado && d.aliados?.find((x) => x.id === app.moverAliado);
    if (al) {
      if (al.destinos[k]) return enviar({ heroe: h.id, tipo: 'moverAliado', aliado: al.id, x, y });
      if (f && al.atacables.includes(f.id)) return enviar({ heroe: h.id, tipo: 'atacarAliado', aliado: al.id, objetivo: f.id });
      if (f?.id !== al.id) { app.moverAliado = null; pintarAcciones(); }
    }
    if (app.moverPoseido && d.poseido) {
      if (d.poseido.destinos[k]) return enviar({ heroe: h.id, tipo: 'moverPoseido', x, y });
      if (f && d.poseido.atacables.includes(f.id)) return enviar({ heroe: h.id, tipo: 'atacarPoseido', objetivo: f.id });
    }
    if (app.seleccion?.tipo === 'poder') {
      if (f && app.seleccion.objetivos.includes(f.id)) { app.seleccion = null; return enviar({ heroe: h.id, tipo: 'poderPoseido', objetivo: f.id }); }
      app.seleccion = null; return pintarAcciones();
    }
    if (app.seleccion?.tipo === 'habilidad') {
      if (f && app.seleccion.objetivos.includes(f.id)) { const hab = app.seleccion.habilidad; app.seleccion = null; return enviar({ heroe: h.id, tipo: 'habilidad', habilidad: hab, objetivo: f.id }); }
      app.seleccion = null; return pintarAcciones();
    }
    if (app.seleccion?.tipo === 'hechizo') {
      if (f && app.seleccion.objetivos.includes(f.id)) return enviar({ heroe: h.id, tipo: 'hechizo', hechizo: app.seleccion.hechizo, objetivo: f.id });
      app.seleccion = null; return pintarAcciones();
    }
    if (f && d.atacables.includes(f.id)) { app.seleccion = null; return enviar({ heroe: h.id, tipo: 'atacar', objetivo: f.id }); }
    // Tocar al mercader tranquilo abre su tienda (si estás a su lado), nunca le ataca.
    if (f?.neutral) { app.seleccion = null; if (d.mercader?.id === f.id) return accionBoton('mercader', h, d); return toast('Ponte al lado del mercader para comerciar con él.'); }
    if (app.seleccion) { app.seleccion = null; pintarAcciones(); }
    if (d.destinos[k]) return enviar({ heroe: h.id, tipo: 'mover', x, y });
    const tr = e.trampas.find((t) => t.x === x && t.y === y && d.desarmables.includes(t.id));
    if (tr) return enviar({ heroe: h.id, tipo: 'desarmar', trampa: tr.id });
  }
  // Información de lo que hay en la casilla.
  if (!e.revelado[k]) return toast('Aún no habéis visto esta zona.');
  if (f && e.heroes[f.id]) return fichaHeroe(f.id);
  if (f?.id === 'cargador') return toast(`Cargador: cuerpo ${f.cuerpo}/${f.cuerpoMax}, defensa ${D.CARGADOR.defensa}. Lleva el almacén del grupo.`);
  if (f) return fichaMonstruo(f);
  const u = T.muebleEn(e, x, y);
  if (u?.tipo === 'caldero') {
    const i = e.muebles.indexOf(u);
    if (h && M.disponibles(e, h.id).calderos?.includes(i)) {
      if (e.reliquias?.caliz) { app.seleccion = { tipo: 'caliz', caldero: i }; return pintarAcciones(); }
      return enviar({ heroe: h.id, tipo: 'caldero', caldero: i });
    }
    return toast('Caldero burbujeante. Ponte al lado para beber (gasta la acción del turno, una vez por héroe).');
  }
  if (u) return toast(D.MUEBLES[u.tipo].nombre + '.');
  if (e.rocas[k]) return toast('Derrumbe: el paso está cortado por las piedras.');
  const tr = e.trampas.find((t) => t.x === x && t.y === y && t.descubierta);
  if (tr) return toast(D.TRAMPAS[tr.tipo].nombre + (tr.activa ? '. Rodéala o desármala.' : ', desarmada.'));
  if (e.escalera.some(([a, b]) => a === x && b === y)) return toast('La escalera: por aquí se entra y se sale.');
  if (h && e.turno.movTirada && e.turno.movRestante > 0) toast('No llegas hasta ahí.');
}

// =============================================================
//  REPRODUCCIÓN DE EVENTOS
// =============================================================
function prepararVista() {
  const v = { pos: {}, ocultos: new Set(), vivos: new Set() };
  for (const ev of app.cola) {
    if (ev.tipo === 'mover' && !(ev.id in v.pos)) v.pos[ev.id] = ev.ruta[0];
    if (ev.tipo === 'muerte') v.vivos.add(ev.id);
    if (ev.tipo === 'aparece' && !(ev.id in v.pos)) v.ocultos.add(ev.id);
    if (ev.tipo === 'aparecen') for (const id of ev.ids) if (!(id in v.pos)) v.ocultos.add(id);
  }
  tablero.vista = v;
}

async function reproducir() {
  app.reproduciendo = true;
  if (app.estado.fase === 'mision') pintarAcciones();
  while (app.cola.length) {
    prepararVista();
    const ev = app.cola[0];
    try { await animar(ev); } catch (err) { console.error(err); }
    app.cola.shift();
  }
  prepararVista();
  app.reproduciendo = false;
  irAFase();
  if (app.trasCola) { const a = app.trasCola; app.trasCola = null; enviar(a); }
  preguntarHallazgo();
}

// Arma o armadura recién conseguida: ¿cambiarla ya por lo que llevas?
let preguntando = false;
async function preguntarHallazgo() {
  const e = app.estado;
  if (preguntando || e?.fase !== 'mision' || e.turno?.heroe == null) return;
  const h = e.heroes[e.turno.heroe];
  if (!h?.hallazgos?.length || !M.puedeControlar(e, miId, h.id)) return;
  const item = h.hallazgos[0];
  const nuevo = D.ARMAS[item] || D.ARMADURAS[item];
  if (!nuevo) return;
  const desc = (def) => (def.ataque ? def.ataque + ' dados de ataque' : def.defensa ? (def.defensa > 0 ? '+' : '') + def.defensa + ' de defensa' : 'Se lleva puesto')
    + (def.dosManos ? ', a dos manos' : '') + (def.distancia ? ', a distancia' : '') + (def.diagonal ? ', en diagonal' : '')
    + (def.mercader ? '. ✔ ' + def.bueno + ' ✘ ' + def.malo : '.');
  const motivo = M.motivoNoEquipar(h, item);
  const actual = D.ARMAS[item] ? `<p>Ahora llevas <b>${esc(D.ARMAS[h.arma].nombre)}</b>: ${esc(desc(D.ARMAS[h.arma]))}</p>` : '';
  preguntando = true;
  app.cerrarModalFuera = null;
  const i = await modal(`<h2>${esc(h.nombre)} consigue: ${esc(nuevo.nombre)}</h2><p>${esc(desc(nuevo))}</p>${actual}`
    + (motivo ? `<p class="nota">Ahora no te la puedes poner: ${esc(motivo)} Queda en tu inventario.</p>` : `<p class="nota">${D.ARMAS[item] ? 'Cambiar de arma' : 'Ponértela'} no gasta tu acción. Lo que te quites va al inventario.</p>`),
    motivo ? [{ texto: 'Vale' }] : [{ texto: 'Guardarla', clase: 'claro' }, { texto: D.ARMAS[item] ? 'Empuñarla' : 'Ponérmela' }]);
  preguntando = false;
  enviar({ heroe: h.id, tipo: 'equiparHallazgo', item, no: motivo || i !== 1 });
}

const posDe = (id) => {
  const e = app.estado;
  const f = e.heroes[id] || (id === 'cargador' ? e.cargador : null) || e.monstruos.find((m) => m.id === id);
  return f ? (tablero.vista.pos[id] || [f.x, f.y]) : null;
};
const nombre = (id) => M.nombreDe(app.estado, id);
const conArticulo = (id) => (app.estado.heroes[id] ? art(app.estado.heroes[id]) : id === 'cargador' ? 'el cargador' : nombre(id));

function esperaSaltable(ms) {
  return new Promise((ok) => {
    const t = setTimeout(fin, ms * Math.max(velocidad, 0.5));
    function fin() { clearTimeout(t); app.saltar = null; ok(); }
    app.saltar = fin;
  });
}
$('#dados').addEventListener('click', () => app.saltar?.());

function dadoHTML(cara, cuenta) {
  const n = cara === 'calavera' ? 'calavera' : 'escudo';
  const estilo = cara === 'escudoNegro' ? 'style="fill:#1d1712;stroke:#1d1712"' : (cara === 'escudo' ? 'style="fill:#fff;stroke:#1d1712;stroke-width:28px;paint-order:stroke"' : '');
  return `<div class="dado rueda ${cuenta ? 'cuenta' : ''}" style="animation-delay:${Math.random() * 120}ms">${svg(n, estilo)}</div>`;
}
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const dadoRojo = (v) => `<div class="dado rojo rueda"><div class="pips">${Array.from({ length: 9 }, (_, i) => (PIPS[v].includes(i) ? '<i></i>' : '<span></span>')).join('')}</div></div>`;

async function animar(ev) {
  const e = app.estado;
  switch (ev.tipo) {
    case 'turno': {
      app.moverCargador = false;
      if (app.mochilaAbierta && app.mochilaAbierta !== '__ver') { app.mochilaAbierta = null; $('#modal').hidden = true; }
      const h = e.heroes[ev.heroe];
      const mio = M.puedeControlar(e, miId, ev.heroe);
      cartel(mio && app.modo !== 'local' ? 'Tu turno: ' + h.nombre : 'Turno ' + del(h));
      sonar('turno');
      tablero.centrarEn(h.x, h.y, false);
      await espera(350);
      break;
    }
    case 'fase':
      if (ev.fase === 'monstruos') { cartel('Mueven los monstruos'); await espera(500); }
      break;
    case 'tirada': {
      $('#mesa-dados').innerHTML = `<h3>${esc(ev.titulo || nombre(ev.heroe) + ' se mueve')}</h3><div class="tira">${ev.valores.map(dadoRojo).join('')}</div>
        <div class="resultado-dados">${ev.titulo ? esc(ev.resultado || '') : ev.total + ' casillas' + (ev.total > ev.valores.reduce((a, b) => a + b, 0) ? ' (¡doble!)' : '')}</div>
        <p class="tocar">Toca para continuar</p>`;
      $('#dados').hidden = false; sonar('dados');
      await esperaSaltable(2000);
      $('#dados').hidden = true;
      break;
    }
    case 'mover': {
      const paso = (e.heroes[ev.id] ? 120 : 95) * velocidad;
      for (let i = 1; i < ev.ruta.length; i++) {
        const [ax, ay] = ev.ruta[i - 1], [bx, by] = ev.ruta[i];
        const t0 = performance.now();
        await new Promise((ok) => {
          const f = () => {
            const k = Math.min(1, (performance.now() - t0) / paso);
            tablero.vista.pos[ev.id] = [ax + (bx - ax) * k, ay + (by - ay) * k];
            if (k < 1) requestAnimationFrame(f); else ok();
          };
          f();
        });
      }
      tablero.vista.pos[ev.id] = ev.ruta[ev.ruta.length - 1];
      const [fx, fy] = ev.ruta[ev.ruta.length - 1];
      if (tablero.acercado()) tablero.centrarEn(fx, fy, false);
      // Aviso si un héroe tuyo llega a la escalera sin poder salir todavía.
      const quien = e.heroes[ev.id];
      const [ix, iy] = ev.ruta[0];
      if (quien && M.puedeControlar(e, miId, ev.id) && enLaEscalera(e, { x: fx, y: fy }) && !enLaEscalera(e, { x: ix, y: iy }) && !M.disponibles(e, ev.id).salir) {
        toast(motivoNoSalir(e), 'peligro');
      }
      break;
    }
    case 'puerta': sonar('puerta'); await espera(180); break;
    case 'aparece':
    case 'aparecen': {
      const ids = ev.ids || [ev.id];
      for (const id of ids) { tablero.vista.ocultos.delete(id); const p = posDe(id); if (p) tablero.destello(p[0], p[1], 'rgba(200,40,30,A)'); }
      sonar('aparece');
      toast('¡' + ids.map(nombre).join(', ') + '!', 'peligro');
      await espera(550);
      break;
    }
    case 'reaccion': {
      const r = D.REACCIONES[ev.reaccion];
      if (r) { sello(ev.heroe, r); sonar('puerta'); }
      await espera(120);
      break;
    }
    case 'dados': {
      // Reacciones solas: golpazo de un héroe, o un héroe que se lleva un buen golpe.
      if (autoReac && ev.dano >= 2) {
        if (app.estado.heroes[ev.atacante] && ev.ataque.filter((c) => c === 'calavera').length >= 3) setTimeout(() => sello(ev.atacante, D.REACCIONES_AUTO.golpazo), 1600 * velocidad);
        else if (app.estado.heroes[ev.defensor]) setTimeout(() => sello(ev.defensor, D.REACCIONES_AUTO.ay), 1600 * velocidad);
      }
      const atk = ev.ataque, def = ev.defensa;
      const cuentaDef = ev.defiende === 'heroe' ? 'escudo' : 'escudoNegro';
      const golpes = atk.filter((c) => c === 'calavera').length;
      const paradas = def.filter((c) => c === cuentaDef).length;
      // En dos tiempos, como en la mesa: primero tira el atacante y luego se defiende el otro.
      const mesa = $('#mesa-dados');
      mesa.innerHTML = `<h3>${esc(nombre(ev.atacante))} ataca a ${esc(conArticulo(ev.defensor))}</h3>
        <p class="sub">${esc(ev.etiqueta || '')}</p>
        <div class="tira-et">Ataque: ${golpes} ${golpes === 1 ? 'calavera' : 'calaveras'}</div>
        <div class="tira">${atk.map((c) => dadoHTML(c, c === 'calavera')).join('') || '<span class="tira-et">—</span>'}</div>
        <div class="fase-def"><div class="tira-et">${esc(nombre(ev.defensor))} se defiende…</div><div class="tira"></div></div>
        <div class="resultado-dados espera">&nbsp;</div>
        <p class="tocar">Toca para continuar</p>`;
      $('#dados').hidden = false; sonar('dados');
      await esperaSaltable(1300);
      mesa.querySelector('.fase-def').innerHTML = `<div class="tira-et">Defensa: ${paradas} ${ev.defiende === 'heroe' ? (paradas === 1 ? 'escudo blanco' : 'escudos blancos') : (paradas === 1 ? 'escudo negro' : 'escudos negros')}</div>
        <div class="tira">${def.map((c) => dadoHTML(c, c === cuentaDef)).join('') || '<span class="tira-et">Sin defensa</span>'}</div>`;
      sonar('dados');
      await esperaSaltable(1100);
      const res = mesa.querySelector('.resultado-dados');
      res.className = 'resultado-dados ' + (ev.dano ? '' : 'nada');
      res.textContent = ev.dano ? '¡' + ev.dano + ' de daño!' : 'Sin daño';
      await esperaSaltable(ev.defiende === 'heroe' ? 1900 : 1600);
      $('#dados').hidden = true;
      const p = posDe(ev.defensor);
      if (p && ev.dano) { tablero.texto(p[0], p[1], '−' + ev.dano, ev.defiende === 'heroe' ? '#ff6a50' : '#ffd36a'); tablero.destello(p[0], p[1], 'rgba(255,60,40,A)'); sonar('golpe'); }
      break;
    }
    case 'muerte': {
      const p = posDe(ev.id);
      if (p) { tablero.destello(p[0], p[1], 'rgba(120,10,10,A)'); tablero.texto(p[0], p[1], e.heroes[ev.id] ? 'Cae' : '†', '#e8d8b0'); }
      sonar('muerte');
      await espera(420);
      tablero.vista.vivos.delete(ev.id);
      if (e.heroes[ev.id]) toast(nombre(ev.id) + ' ha caído.', 'peligro');
      break;
    }
    case 'temblor': tablero.temblar(); sonar('trampa'); await espera(500); break;
    case 'trampa': {
      const p = posDe(ev.heroe);
      tablero.temblar(); sonar('trampa');
      if (p) tablero.destello(p[0], p[1], 'rgba(255,120,40,A)');
      toast(ev.texto, 'peligro');
      await espera(900);
      break;
    }
    case 'tesoro': {
      const icono = ev.oro ? 'oro' : ev.objeto ? (D.POCIONES[ev.objeto] ? D.POCIONES[ev.objeto].icono : 'espada') : ev.carta === 'errante' ? 'calavera' : ev.carta === 'flecha' || ev.carta === 'derrumbe' ? 'trampa' : 'cofreAbierto';
      $('#mesa-dados').innerHTML = `<div class="pergamino carta">${svg(icono)}<h2>${ev.especial ? '¡Lo habéis encontrado!' : 'Tesoro'}</h2><p>${esc(ev.texto)}</p>${ev.oro ? `<p><b>+${ev.oro} monedas</b> para ${esc(conArticulo(ev.heroe))}</p>` : ''}</div>`;
      $('#dados').hidden = false; sonar(ev.oro || ev.objeto ? 'tesoro' : 'aparece');
      await esperaSaltable(ev.especial ? 3500 : 2000);
      $('#dados').hidden = true;
      break;
    }
    case 'busqueda': {
      const p = posDe(ev.heroe);
      if (p) tablero.destello(p[0], p[1], 'rgba(120,200,255,A)');
      toast(ev.texto, ev.secretas ? 'bueno' : '');
      if (ev.secretas) sonar('tesoro');
      await espera(700);
      break;
    }
    case 'hechizo': {
      const p = posDe(ev.objetivo), el = D.ELEMENTOS[ev.elemento];
      const c = el.color;
      const rgb = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)).join(',');
      if (p) tablero.destello(p[0], p[1], `rgba(${rgb},A)`);
      cartel(D.HECHIZOS[ev.hechizo].nombre);
      sonar('magia');
      await espera(650);
      break;
    }
    case 'hechizoMonstruo': {
      const p = posDe(ev.id);
      if (p) tablero.destello(p[0], p[1], 'rgba(150,70,220,A)');
      if (ev.objetivo) { const q = posDe(ev.objetivo); if (q) tablero.destello(q[0], q[1], 'rgba(150,70,220,A)'); }
      cartel(ev.hechizo === 'invocar' ? '¡Los muertos se levantan!' : 'Rayo sombrío');
      sonar('magia');
      await espera(600);
      break;
    }
    case 'mensaje': toast(ev.texto, ev.tono); await espera(550); break;
    case 'duelo': { sonar('aparece'); const p = posDe(ev.heroe), q = posDe(ev.monstruo); if (p) tablero.destello(p[0], p[1], 'rgba(190,140,255,A)'); if (q) tablero.destello(q[0], q[1], 'rgba(190,140,255,A)'); await espera(500); break; }
    case 'nivel': { const p = posDe(ev.heroe); if (p) tablero.destello(p[0], p[1], 'rgba(190,140,255,A)'); sonar('aparece'); break; }
    case 'reliquia': {
      sonar(ev.reliquia === 'campana' ? 'trampa' : 'aparece');
      const p = posDe(ev.heroe);
      if (p) tablero.destello(p[0], p[1], ev.reliquia === 'farol' ? 'rgba(120,255,160,A)' : 'rgba(255,220,140,A)');
      toast(ev.texto, 'bueno');
      for (const [x, y] of ev.ruta || []) { tablero.destello(x, y, 'rgba(140,200,255,A)'); await espera(110); }
      await espera(1100); break;
    }
    case 'trompa': {
      sonar('trampa');
      for (const [x, y] of ev.celdas || []) tablero.destello(x, y, 'rgba(255,220,140,A)');
      toast(ev.texto, ev.tono); await espera(1200); break;
    }
    case 'caldero': toast('🎲 ' + ev.dado + ' · ' + ev.texto, ev.tono); await espera(900); break;
    case 'historia':
      app.cerrarModalFuera = null;
      await modal(`<div class="historia"><p>${esc(ev.texto)}</p></div>`, [{ texto: 'Continuar' }]);
      break;
    case 'salida': toast(nombre(ev.heroe) + ' sube la escalera y sale.', 'bueno'); await espera(500); break;
    case 'fin': await mostrarResultado(ev.resultado); break;
    case 'compra': sonar('tesoro'); break;
  }
}

async function mostrarResultado(res) {
  const e = app.estado;
  const manda = app.modo !== 'invitado';
  const victoria = res === 'victoria';
  const html = `<h2>${victoria ? 'Misión cumplida' : 'Derrota'}</h2>
    <p>${victoria ? 'Los héroes salen a la luz con sus bolsas más pesadas. Cada superviviente recibe ' + (e.mision.recompensa || 0) + ' monedas de la Hermandad.' : 'La mazmorra se ha cobrado a todos los héroes. La Hermandad los arrastrará de vuelta y podréis intentarlo de nuevo.'}</p>
    ${htmlCronica(e.cronica?.ultima, e)}
    ${manda ? '' : '<p class="nota">El anfitrión os llevará al campamento.</p>'}`;
  sonar(victoria ? 'tesoro' : 'muerte');
  app.cerrarModalFuera = null;
  if (manda) {
    await modal(html, [{ texto: victoria ? (!e.aleatorio && e.misionIdx + 1 >= e.campana.length ? 'Ver el final' : 'Ir al campamento') : 'Ir al campamento y reintentar' }]);
    app.trasCola = { tipo: 'continuar' };
  } else await modal(html, [{ texto: 'De acuerdo' }]);
}

// =============================================================
//  CRÓNICA: resumen de la misión y de la campaña
// =============================================================
const nombreMonstruo = (tipo, n) => {
  const base = D.MONSTRUOS[tipo]?.nombre || tipo;
  if (n === 1) return base;
  return base === 'Guerrero oscuro' ? 'Guerreros oscuros' : /[aeiouáéíóú]$/i.test(base) ? base + 's' : base + 'es';
};
function chipsMonstruos(obj) {
  const lista = Object.entries(obj || {}).sort((a, b) => b[1] - a[1]);
  if (!lista.length) return '<p class="nota">Ninguno.</p>';
  return '<div class="chips-cronica">' + lista.map(([t, n]) => `<span class="chip-m" style="--c:${D.MONSTRUOS[t]?.color || '#555'}">${svg(D.MONSTRUOS[t]?.icono || 'calavera')}<b>${n}</b> ${esc(nombreMonstruo(t, n))}</span>`).join('') + '</div>';
}
// =============================================================
//  TÍTULOS: un mote para cada héroe según cómo ha jugado la misión
//  Cada título se da a un solo héroe y cada héroe recibe como mucho dos.
// =============================================================
const bajas = (h) => Object.values(h.muertes).reduce((s, n) => s + n, 0);
const TITULOS = [
  { id: 'mvp', icono: 'corona', nombre: 'MVP', texto: (h) => `${bajas(h)} ${bajas(h) === 1 ? 'enemigo abatido' : 'enemigos abatidos'}. El terror de la mazmorra.`, valor: (h) => bajas(h) * 100 + h.danoHecho, min: 100 },
  { id: 'matagigantes', icono: 'espadaAltar', nombre: 'Matagigantes', texto: () => 'Dio el golpe de gracia al jefe.', valor: (h) => h.jefes, min: 1 },
  { id: 'gallina', icono: 'correr', nombre: 'La Gallina', texto: (h) => `Recorrió ${h.casillas} casillas y no le hizo ni un rasguño a nadie.`, valor: (h) => (h.danoHecho === 0 && h.hechizos === 0 ? h.casillas + 1 : 0), min: 1 },
  { id: 'saco', icono: 'escudo', nombre: 'Saco de Boxeo', texto: (h) => `Se comió ${h.danoRecibido} golpes. Los monstruos le tienen cariño.`, valor: (h) => h.danoRecibido, min: 4 },
  { id: 'iman', icono: 'trampa', nombre: 'Imán de Trampas', texto: (h) => h.trampas === 1 ? 'Si hay una trampa, la pisa.' : `Pisó ${h.trampas} trampas. Ni mirando al suelo.`, valor: (h) => h.trampas, min: 1 },
  { id: 'resucitado', icono: 'calavera', nombre: 'Volvió en Camilla', texto: () => 'Cayó en combate. La Hermandad lo recogió con pala.', valor: (h) => h.caidas, min: 1 },
  { id: 'avaro', icono: 'oro', nombre: 'El Avaro', texto: (h) => `Se embolsó ${h.oro} monedas. Nadie sabe cuántas declaró.`, valor: (h) => h.oro, min: 60 },
  { id: 'intocable', icono: 'reflejo', nombre: 'Intocable', texto: () => 'Ni una herida en toda la misión.', valor: (h) => (h.danoRecibido === 0 && h.casillas > 0 ? 1 + h.danoHecho : 0), min: 1 },
  { id: 'sabueso', icono: 'buscar', nombre: 'Sabueso', texto: (h) => h.secretas ? `Encontró ${h.secretas === 1 ? 'una puerta secreta' : h.secretas + ' puertas secretas'}.` : `Registró ${h.busquedas} veces cada rincón.`, valor: (h) => h.secretas * 10 + h.busquedas, min: 3 },
  { id: 'cosquillas', icono: 'hechizo', nombre: 'Hace Cosquillas', texto: (h) => `${h.danoHecho} de daño y ni una baja. Los monstruos se ríen.`, valor: (h) => (bajas(h) === 0 ? h.danoHecho : 0), min: 2 },
  { id: 'turista', icono: 'mover', nombre: 'El Turista', texto: (h) => `${h.casillas} casillas recorridas. Se conoce la mazmorra mejor que el que la construyó.`, valor: (h) => h.casillas, min: 25 },
  { id: 'abrepuertas', icono: 'puerta', nombre: 'Abrepuertas', texto: (h) => `Abrió ${h.puertas} puertas sin preguntar qué había detrás.`, valor: (h) => h.puertas, min: 3 },
  { id: 'alquimista', icono: 'pocion', nombre: 'Bebedor Profesional', texto: (h) => `Se bebió ${h.pociones} pociones.`, valor: (h) => h.pociones, min: 2 },
  { id: 'dormilon', icono: 'sueno', nombre: 'El Dormilón', texto: (h) => `Pasó ${h.turnosVacios} turnos sin hacer nada.`, valor: (h) => h.turnosVacios, min: 2 }
];
function asignarTitulos(c) {
  if (!c) return [];
  const heroes = Object.entries(c.heroes);
  const cuenta = {};
  const dados = [];
  for (const t of TITULOS) {
    const cand = heroes.map(([id, h]) => ({ id, h, v: t.valor(h) || 0 })).filter((x) => x.v >= t.min && (cuenta[x.id] || 0) < 2);
    if (!cand.length) continue;
    cand.sort((a, b) => b.v - a.v);
    if (cand[1] && cand[1].v === cand[0].v && t.id !== 'resucitado') continue; // empate: nadie se lo lleva
    const g = cand[0];
    cuenta[g.id] = (cuenta[g.id] || 0) + 1;
    dados.push({ ...t, heroe: g.id, frase: t.texto(g.h) });
  }
  return dados;
}
function htmlTitulos(c, e) {
  const t = asignarTitulos(c);
  if (!t.length) return '';
  return '<h4>Títulos</h4><div class="titulos">' + t.map((x) => `<div class="titulo-h ${x.id === 'mvp' ? 'oro' : ''}">${svg(x.icono)}<div><b>${esc(x.nombre)}</b> · ${esc(e.heroes[x.heroe]?.nombre || x.heroe)}<span>${esc(x.frase)}</span></div></div>`).join('') + '</div>';
}

function htmlCronica(c, e) {
  if (!c) return '';
  const filas = Object.entries(c.heroes).map(([id, h]) => {
    const muertes = Object.values(h.muertes).reduce((s, n) => s + n, 0);
    return { id, h, muertes };
  });
  const nombreH = (id) => e.heroes[id]?.nombre || id;
  const datos = [
    ['Rondas', c.rondas], ['Puertas abiertas', c.puertas], ['Tesoros encontrados', c.tesoros], ['Oro encontrado', c.oro],
    ['Trampas activadas', c.trampasActivadas], ['Trampas descubiertas', c.trampasHalladas], ['Trampas desarmadas', c.desarmadas], ['Puertas secretas', c.secretas]
  ];
  if (c.recompensa) datos.push(['Recompensa por héroe', c.recompensa]);
  if (c.cargador) datos.push(['Cargador', c.cargador === 'vivo' ? 'Volvió con la carga' : 'Cayó con la carga']);
  return `<div class="cronica">
    <h3 class="sec">Crónica · Misión ${c.numero}${c.resultado ? ' · ' + (c.resultado === 'victoria' ? 'victoria' : 'derrota') + ' en ' + c.rondas + (c.rondas === 1 ? ' ronda' : ' rondas') : ''}</h3>
    ${htmlTitulos(c, e)}
    <h4>Enemigos abatidos</h4>${chipsMonstruos(c.monstruos)}
    ${c.jefes.length ? `<p><b>Jefes derrotados:</b> ${esc(c.jefes.join(', '))}</p>` : ''}
    <h4>Héroes</h4>
    <div class="tabla-cronica" role="table">
      <div class="fila-c cab" role="row"><span>Héroe</span><span title="Enemigos abatidos">Bajas</span><span title="Daño hecho">Daño</span><span title="Daño recibido">Heridas</span><span>Oro</span></div>
      ${filas.map(({ id, h, muertes }) => `<div class="fila-c" role="row"><span>${esc(nombreH(id))}${h.caidas ? ' †' : ''}</span><span>${muertes}</span><span>${h.danoHecho}</span><span>${h.danoRecibido}</span><span>${h.oro}</span></div>`).join('')}
    </div>
    <div class="datos-cronica">${datos.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
  </div>`;
}
function htmlCampana(e) {
  const k = e.cronica?.campana;
  if (!k) return '<p class="nota">Aún no habéis terminado ninguna misión.</p>';
  const filas = Object.entries(k.heroes);
  return `<div class="cronica">
    <h3 class="sec">La campaña hasta ahora</h3>
    <div class="datos-cronica">
      <div><span>Misiones jugadas</span><b>${k.misiones}</b></div><div><span>Victorias</span><b>${k.victorias}</b></div>
      <div><span>Derrotas</span><b>${k.derrotas}</b></div><div><span>Rondas</span><b>${k.rondas}</b></div>
      <div><span>Oro encontrado</span><b>${k.oro}</b></div><div><span>Tesoros</span><b>${k.tesoros}</b></div>
      <div><span>Trampas sufridas</span><b>${k.trampas}</b></div><div><span>Puertas secretas</span><b>${k.secretas}</b></div>
    </div>
    <h4>Enemigos abatidos</h4>${chipsMonstruos(k.monstruos)}
    ${k.jefes.length ? `<p><b>Jefes derrotados:</b> ${esc(k.jefes.join(', '))}</p>` : ''}
    <h4>Héroes</h4>
    <div class="tabla-cronica">
      <div class="fila-c cab"><span>Héroe</span><span>Bajas</span><span>Daño</span><span>Heridas</span><span>Oro</span></div>
      ${filas.map(([id, h]) => `<div class="fila-c"><span>${esc(e.heroes[id]?.nombre || id)}${h.caidas ? ' †' + (h.caidas > 1 ? h.caidas : '') : ''}</span><span>${h.muertes}</span><span>${h.danoHecho}</span><span>${h.danoRecibido}</span><span>${h.oro}</span></div>`).join('')}
    </div>
  </div>`;
}
function verCronica() {
  const e = app.estado;
  app.cerrarModalFuera = () => {};
  modal(htmlCronica(e.cronica?.ultima, e) + htmlCampana(e), [{ texto: 'Cerrar' }]);
}

// =============================================================
//  ARMERÍA
// =============================================================
// =============================================================
//  CAMPAMENTO (antes de cada misión)
//  Por héroe: carta y stats, equipo e inventario, tienda, banco y cargador.
// =============================================================
const SUBPESTANAS = [['heroe', 'Héroe'], ['equipo', 'Equipo'], ['tienda', 'Tienda'], ['banco', 'Banco'], ['cargador', 'Cargador']];
// Quién está en la sala y quién no (solo en partidas con sala).
function pintarConectados(el, e) {
  if (app.modo === 'local' || !e.jugadores) { el.hidden = true; return; }
  const lista = Object.entries(e.jugadores);
  const dentro = lista.filter(([id, j]) => id === e.anfitrion || !j.desconectado).length;
  el.hidden = false;
  el.innerHTML = `<b>${dentro} de ${lista.length} ${lista.length === 1 ? 'jugador conectado' : 'jugadores conectados'}</b>`
    + lista.map(([id, j]) => {
      const on = id === e.anfitrion || !j.desconectado;
      const heroes = e.orden.filter((t) => e.heroes[t].jugador === id).map((t) => e.heroes[t].nombre).join(', ');
      return `<span class="jugador ${on ? 'on' : 'off'}"><i></i>${esc(j.nombre)}${id === miId ? ' (tú)' : ''}${id === e.anfitrion ? ' · anfitrión' : ''}${heroes ? ' · ' + esc(heroes) : ''}${on ? '' : ' · desconectado'}</span>`;
    }).join('');
}

function pintarArmeria() {
  const e = app.estado;
  pintarConectados($('#arm-conectados'), e);
  const manda = app.modo !== 'invitado';
  const misHeroes = e.orden.filter((t) => M.puedeControlar(e, miId, t));
  if (!e.orden.includes(app.pestana)) app.pestana = misHeroes[0] || e.orden[0];
  app.sub ||= 'heroe';
  const siguiente = e.aleatorio ? { titulo: 'Mazmorra Infinita, piso ' + (e.misionIdx + 1) + ' (semilla ' + e.aleatorio.semilla + ')' } : app.misiones[e.campana[e.misionIdx]];
  const votos = Object.keys(e.votosDescanso || {}).length, faltan = M.votosNecesarios(e);
  const yoVote = !!e.votosDescanso?.[miId];
  const herido = e.orden.some((t) => e.heroes[t].cuerpo < e.heroes[t].cuerpoMax);
  const descanso = !e.aleatorio || (!herido && !votos && !e.descansado) ? '' : (e.descansado ? '<p class="nota">Habéis descansado: estáis curados, pero el próximo piso estará maldito.</p>'
    : `<p class="nota" style="margin-top:6px">${herido ? 'Las heridas se arrastran de un piso a otro. ' : ''}<b>¿Descansar antes de bajar?</b> Os cura a todos, pero el Corazón de la Mazmorra maldecirá el próximo piso. Votos: ${votos}/${faltan}.
      <button class="btn madera" id="b-descansar" style="min-height:34px;font-size:14px;padding:0 12px;margin-left:6px">${yoVote ? 'Quitar mi voto' : 'Votar descansar'}</button></p>`);
  $('#arm-sub').innerHTML = esc('Siguiente misión: ' + (e.misionIdx + 1) + '. ' + (siguiente?.titulo || ''))
    + (e.cronica?.campana ? ' · <button class="enlace" id="b-cronica">Ver la crónica</button>' : '') + descanso;
  $('#b-descansar')?.addEventListener('click', () => { const mio = e.orden.find((t) => M.puedeControlar(e, miId, t)); if (mio) enviar({ tipo: 'descansar', heroe: mio }); });
  $('#b-cronica')?.addEventListener('click', verCronica);
  $('#arm-pestanas').innerHTML = e.orden.map((t) => `<button aria-pressed="${t === app.pestana}" data-t="${t}">${esc(e.heroes[t].nombre)}</button>`).join('');
  $('#arm-pestanas').querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { app.pestana = b.dataset.t; pintarArmeria(); }));
  const h = e.heroes[app.pestana];
  M.inventarioDe(h);
  const mio = M.puedeControlar(e, miId, h.id);
  const off = mio ? '' : 'disabled';
  const descDe = (def) => def.mercader ? `${def.ataque ? def.ataque + ' dados de ataque' + (def.dosManos ? ', a dos manos' : '') : (def.defensa ? (def.defensa > 0 ? '+' : '') + def.defensa + ' de defensa' : 'Objeto')}. ✔ ${def.bueno} ✘ ${def.malo}` : def.ataque ? `${def.ataque} dados de ataque${def.diagonal ? ', en diagonal' : ''}${def.distancia ? ', a distancia' : ''}${def.dosManos ? ', a dos manos' : ''}${def.pesada ? '; no se puede mover y disparar en el mismo turno' : ''}`
    : def.defensa ? `+${def.defensa} de defensa${def.lenta ? ', mueves con 1 dado' : ''}` : def.desc;
  const con = e.contrato;
  const monedas = `<div class="monedas-fila"><span class="monedas">${svg('oro')}${h.oro} <small>en la bolsa</small></span><span class="monedas banco">${svg('corona')}${h.banco || 0} <small>en el banco</small></span></div>`;
  let cuerpo = '';

  if (app.sub === 'heroe') {
    const hz = h.hechizos.map((x) => D.HECHIZOS[x].nombre).join(', ');
    cuerpo = `<div class="campamento-heroe">${tarjetaHTML(h.id, h.fem, h)}</div>
      <p class="nota" style="margin-top:12px">${esc(D.HEROES[h.tipo].lema)}${h.kit ? ' Lleva herramientas para desarmar trampas.' : ''}</p>
      ${hz ? `<p><b>Hechizos:</b> ${esc(hz)}</p>` : ''}
      ${e.aleatorio || h.nivel > 1 ? htmlNivel(h, mio) : ''}
      ${mio ? '' : '<p class="nota">Este héroe lo lleva otro jugador.</p>'}`;
  }

  if (app.sub === 'equipo') {
    const inv = M.contenido(h.inventario);
    cuerpo = `<h3 class="sec">Lo que lleva</h3><div class="armeria-grid">
      ${filaItem(h.arma, M.malditaPuesta(h) ? `<button class="btn" data-purificar ${off} title="Hace falta un sacerdote en el grupo">Purificar</button>` : '', 'Arma · ' + descDe(D.ARMAS[h.arma]) + (M.malditaPuesta(h) ? ' · Un sacerdote del grupo la purifica gratis aquí; si no, la Diosa de la suerte por 200 monedas.' : h.purificada ? ' · Purificada: ya te la puedes quitar.' : ''))}
      ${h.armaduras.map((x) => filaItem(x, `<button class="btn claro" data-guardar="${x}" ${off}>Guardar</button>`, 'Armadura · ' + descDe(D.ARMADURAS[x]))).join('')}
      ${Object.entries(h.objetos).filter(([k, n]) => n > 0 && D.POCIONES[k]).map(([k, n]) => filaItem(k, `<button class="btn claro" data-guardar="${k}" ${off}>Guardar</button>`, D.POCIONES[k].nombre + ' ×' + n)).join('')}
    </div>
    <h3 class="sec">Inventario</h3>
    <p class="nota">Lo que tienes guardado. No se puede pasar a otros héroes, pero sí vender a mitad de precio.</p>` +
    (inv.length ? '<div class="armeria-grid">' + agrupar(inv).map(([i, n]) => {
      const motivo = M.motivoNoEquipar(h, i);
      const def = D.ARMAS[i] || D.ARMADURAS[i] || D.POCIONES[i];
      return filaItem(i, `<span class="botones"><button class="btn" data-equipar="${i}" ${mio && !motivo ? '' : 'disabled'} title="${esc(motivo || '')}">Equipar</button><button class="btn claro" data-vender="${i}" ${off}>Vender ${M.precioVenta(i)}</button></span>`,
        (motivo || descDe(def)) + (n > 1 ? ' · ×' + n : ''));
    }).join('') + '</div>' : '<p class="nota">Vacío. Al cambiar de arma, la anterior se guarda aquí.</p>');
  }

  if (app.sub === 'tienda') {
    const fila = (id, def, tipoTxt) => {
      const motivo = M.puedeComprar(e, h, id);
      const aInv = !D.OBJETOS_TIENDA[id] && !motivo && M.motivoNoEquipar(h, id);
      return `<div class="item">${svg(def.icono)}<strong>${esc(def.nombre)}</strong>
        <button class="btn" data-comprar="${id}" ${!mio || motivo ? 'disabled' : ''} title="${esc(motivo || '')}">${def.precio} oro</button>
        <span>${esc(tipoTxt + ' · ' + (motivo && motivo !== 'No tienes oro suficiente en la bolsa.' ? motivo : descDe(def) + (aInv ? ' · irá a tu inventario' : '')))}</span></div>`;
    };
    cuerpo = `<p class="nota">Se paga con el dinero de la bolsa.</p><div class="armeria-grid">
      ${Object.entries(D.ARMAS).filter(([id, d]) => id !== 'daga' && !d.mercader && (!d.minPiso || e.aleatorio)).map(([id, d]) => fila(id, d, 'Arma')).join('')}
      ${Object.entries(D.ARMADURAS).filter(([, d]) => !d.mercader && (!d.minPiso || e.aleatorio)).map(([id, d]) => fila(id, d, 'Armadura')).join('')}
      ${Object.entries(D.OBJETOS_TIENDA).map(([id, d]) => fila(id, d, 'Objeto')).join('')}
    </div>`;
  }

  if (app.sub === 'banco') {
    const max = M.maxTransferencia(h);
    const otros = e.orden.filter((t) => t !== h.id);
    cuerpo = `<p class="nota">El dinero del banco no se gasta en la tienda: sácalo antes de comprar.</p>
      <div class="banco-op">
        <input type="number" min="1" step="1" inputmode="numeric" id="cant-banco" placeholder="Cantidad" ${off}>
        <button class="btn" data-banco="depositar" ${off}>Ingresar</button>
        <button class="btn madera" data-banco="retirar" ${off}>Sacar</button>
      </div>
      <h3 class="sec">Transferir a otro héroe</h3>
      <p class="nota">Sale de tu banco y llega al suyo. Como mucho el 40 % de tu dinero (${max} monedas ahora) y una vez por misión.</p>
      ${h.transferido ? '<p class="nota"><b>Ya has transferido antes de esta misión.</b></p>' : ''}
      ${otros.length ? `<div class="banco-op">
        <select id="dest-banco" ${off}>${otros.map((t) => `<option value="${t}">${esc(e.heroes[t].nombre)}</option>`).join('')}</select>
        <input type="number" min="1" step="1" inputmode="numeric" max="${max}" id="cant-transf" placeholder="Hasta ${max}" ${off}>
        <button class="btn" id="b-transferir" ${mio && !h.transferido && max > 0 ? '' : 'disabled'}>Transferir</button>
      </div>` : '<p class="nota">No hay más héroes en el grupo.</p>'}`;
  }

  if (app.sub === 'cargador') {
    const patron = con && e.heroes[con.patron];
    const inv = M.contenido(h.inventario);
    const carga = con ? M.contenido(con.carga?.[h.id]) : [];
    cuerpo = `<div class="item">${svg('cargador')}<strong>Cargador · ${D.CARGADOR.precio} monedas</strong>
      ${con ? (con.patron === h.id ? `<button class="btn claro" data-despedir ${off}>Cancelar</button>` : '<button class="btn" disabled>Contratado</button>')
        : `<button class="btn" data-contratar ${mio && h.oro >= D.CARGADOR.precio ? '' : 'disabled'}>Contratar</button>`}
      <span>${con ? 'Contratado por ' + esc(patron?.nombre || '') + ' para esta misión.' : 'Lo mueve quien lo paga. Tiene 2 de cuerpo.'}</span></div>
      <p class="nota">Lleva a la mazmorra lo que cada héroe cargue aquí. Para usarlo hay que ponerse a su lado y gastar 1 casilla. <b>Si muere, lo que lleva se pierde.</b></p>` +
      (con ? `<h3 class="sec">Tus cosas en la mochila</h3>` + (carga.length ? '<div class="armeria-grid">' + agrupar(carga).map(([i, n]) => filaItem(i, `<button class="btn claro" data-descargar="${i}" ${off}>Sacar</button>`, n > 1 ? '×' + n : '')).join('') + '</div>' : '<p class="nota">Nada todavía.</p>')
        + `<h3 class="sec">Tu inventario</h3>` + (inv.length ? '<div class="armeria-grid">' + agrupar(inv).map(([i, n]) => filaItem(i, `<button class="btn" data-cargar="${i}" ${off}>Cargar</button>`, n > 1 ? '×' + n : '')).join('') + '</div>' : '<p class="nota">Tu inventario está vacío.</p>')
      : '');
  }

  $('#arm-cuerpo').innerHTML = monedas
    + `<div class="pestanas sub" id="arm-sub-pestanas">${SUBPESTANAS.map(([k, n]) => `<button aria-pressed="${k === app.sub}" data-sub="${k}">${n}</button>`).join('')}</div>`
    + `<div class="sub-cuerpo">${cuerpo}</div>`;
  const q = (sel, fn) => $('#arm-cuerpo').querySelectorAll(sel).forEach((b) => b.addEventListener('click', () => fn(b)));
  q('[data-sub]', (b) => { app.sub = b.dataset.sub; pintarArmeria(); });
  q('[data-comprar]', (b) => enviar({ tipo: 'comprar', heroe: h.id, item: b.dataset.comprar }));
  q('[data-mejora]', (b) => enviar({ tipo: 'mejorar', heroe: h.id, mejora: b.dataset.mejora }));
  q('[data-subclase]', (b) => enviar({ tipo: 'subclase', heroe: h.id, subclase: b.dataset.subclase }));
  q('[data-equipar]', (b) => enviar({ tipo: 'equipar', heroe: h.id, item: b.dataset.equipar }));
  q('[data-purificar]', () => enviar({ tipo: 'purificar', heroe: h.id }));
  q('[data-guardar]', (b) => enviar({ tipo: 'guardar', heroe: h.id, item: b.dataset.guardar }));
  q('[data-vender]', (b) => enviar({ tipo: 'vender', heroe: h.id, item: b.dataset.vender }));
  q('[data-cargar]', (b) => enviar({ tipo: 'cargar', heroe: h.id, item: b.dataset.cargar }));
  q('[data-descargar]', (b) => enviar({ tipo: 'descargar', heroe: h.id, item: b.dataset.descargar }));
  q('[data-contratar]', () => enviar({ tipo: 'contratar', heroe: h.id }));
  q('[data-despedir]', () => enviar({ tipo: 'despedir', heroe: h.id }));
  q('[data-banco]', (b) => {
    const n = Math.floor(Number($('#cant-banco').value));
    if (!(n > 0)) return toast('Escribe una cantidad.', 'peligro');
    enviar({ tipo: b.dataset.banco, heroe: h.id, cantidad: n });
  });
  q('#b-transferir', () => {
    const n = Math.floor(Number($('#cant-transf').value));
    if (!(n > 0)) return toast('Escribe una cantidad.', 'peligro');
    enviar({ tipo: 'transferir', heroe: h.id, a: $('#dest-banco').value, cantidad: n });
  });
  $('#b-siguiente').hidden = !manda;
  $('#b-siguiente').textContent = 'Bajar a la mazmorra';
  $('#arm-espera').hidden = manda;
}
$('#b-siguiente').addEventListener('click', () => enviar({ tipo: 'siguienteMision' }));

function pintarFinal() {
  const e = app.estado;
  if (e.caida) {
    guardarRecord(e);
    guardarFantasma(e);
    $('#final-titulo').innerHTML = 'Habéis caído<small>Piso ' + e.caida.piso + ' de la Mazmorra Infinita</small>';
    const mejor = mejorRecord();
    $('#final-texto').textContent = 'La mazmorra se ha tragado al grupo en el piso ' + e.caida.piso + '. '
      + (mejor && mejor.piso > e.caida.piso ? 'Vuestro récord sigue en el piso ' + mejor.piso + '.' : '¡Es vuestro mejor récord!');
  } else {
    $('#final-titulo').innerHTML = 'Victoria<small>Las criptas duermen</small>';
    $('#final-texto').textContent = 'Velmor el Pálido ha caído y sus huesos no volverán a levantarse. La Hermandad grabará vuestros nombres en la piedra.';
  }
  $('#b-nueva').textContent = e.caida ? 'Volver al inicio' : 'Nueva campaña';
  $('#final-heroes').innerHTML = htmlCampana(e);
}
// Récords de la Mazmorra Infinita (en este dispositivo).
// Fantasmas del caído: el grupo que cae deja su fantasma en ese piso para futuras partidas (en este dispositivo).
function leerFantasmas() { try { return JSON.parse(localStorage.getItem('criptas_fantasmas') || '[]'); } catch { return []; } }
function escribirFantasmas(l) { try { localStorage.setItem('criptas_fantasmas', JSON.stringify(l.slice(-10))); } catch {} }
function guardarFantasma(e) {
  if (app.modo === 'invitado' || e.fantasmaGuardado) return;
  e.fantasmaGuardado = true;
  const heroes = e.orden.map((t) => e.heroes[t]).map((h) => ({ nombre: h.nombre, tipo: h.tipo, ataque: M.ataqueHeroe(h), defensa: M.defensaHeroe(h), cuerpoMax: h.cuerpoMax,
    equipo: [h.arma, ...h.armaduras].filter((x) => x && x !== D.HEROES[h.tipo].arma) }));
  escribirFantasmas([...leerFantasmas().filter((f) => f.piso !== e.caida.piso), { piso: e.caida.piso, heroes, fecha: Date.now() }]);
}
function leerRecords() { try { return JSON.parse(localStorage.getItem('criptas_records') || '[]'); } catch { return []; } }
function guardarRecord(e) {
  const lista = leerRecords().filter((r) => r.id !== app.partidaId);
  lista.push({ id: app.partidaId, piso: e.caida.piso, heroes: e.orden.map((t) => e.heroes[t].nombre).join(', '), fecha: Date.now() });
  try { localStorage.setItem('criptas_records', JSON.stringify(lista.sort((a, b) => b.piso - a.piso).slice(0, 20))); } catch {}
}
const mejorRecord = () => leerRecords()[0] || null;
function pintarRecord() {
  const r = mejorRecord();
  $('#record-infinita').hidden = !r;
  if (r) $('#record-infinita').textContent = 'Récord: piso ' + r.piso + ' (' + r.heroes + ')';
}
pintarRecord();
$('#b-nueva').addEventListener('click', () => salirAPortada());

// Avisar antes de cerrar si eres anfitrión con gente conectada.
window.addEventListener('beforeunload', (e) => { if (app.modo === 'anfitrion' && app.estado) { e.preventDefault(); e.returnValue = ''; } });

// Acceso desde la consola del navegador, útil para depurar.
window.criptas = { app, enviar, publicar, fichaMonstruo, tablero, M, D, T };

// =============================================================
//  TRUCOS (consola del navegador, F12)
//  Solo funcionan en tu dispositivo o si eres el anfitrión,
//  porque son quienes ejecutan las reglas.
// =============================================================
function conTruco(nombreTruco, fn) {
  return (...args) => {
    const e = app.estadoReal;
    if (app.modo === 'invitado') return 'Los trucos solo funcionan en el dispositivo del anfitrión.';
    if (!e) return 'Empieza una partida primero.';
    const msg = fn(e, ...args);
    if (typeof msg === 'string' && msg.startsWith('No')) return msg;
    e.log.push({ n: e.seq, texto: 'Truco: ' + nombreTruco, tono: 'magia' });
    publicar(e);
    return msg || 'Hecho.';
  };
}
window.trucos = {
  ayuda: () => console.log([
    'trucos.mover(50)    → el héroe en turno tiene 50 casillas de movimiento',
    'trucos.accion()     → recupera la acción del turno',
    'trucos.curar()      → todos los héroes al máximo de cuerpo',
    'trucos.oro(500)     → oro para todos los héroes',
    'trucos.revelar()    → descubre todo el tablero',
    'trucos.hechizos()   → recupera los hechizos gastados'
  ].join('\n')),
  mover: conTruco('movimiento', (e, n = 50) => {
    const t = e.turno;
    if (e.fase !== 'mision' || !t) return 'No hay ningún turno en curso.';
    t.movTirada = t.movTirada || n;
    t.movRestante = n;
    return e.heroes[t.heroe].nombre + ' puede moverse ' + n + ' casillas.';
  }),
  accion: conTruco('acción extra', (e) => {
    if (!e.turno) return 'No hay ningún turno en curso.';
    e.turno.accion = false;
    return 'Acción recuperada.';
  }),
  curar: conTruco('curación', (e) => {
    for (const h of Object.values(e.heroes)) if (h.vivo) h.cuerpo = h.cuerpoMax;
    return 'Héroes curados.';
  }),
  oro: conTruco('oro', (e, n = 500) => {
    for (const h of Object.values(e.heroes)) h.oro += n;
    return '+' + n + ' monedas para cada héroe.';
  }),
  revelar: conTruco('revelar mapa', (e) => {
    if (!e.mision) return 'No hay misión en curso.';
    for (let y = 0; y < D.ALTO; y++) for (let x = 0; x < D.ANCHO; x++) e.revelado[T.clave(x, y)] = 1;
    for (const m of e.monstruos) if (m.vivo) m.visto = true;
    return 'Mapa descubierto.';
  }),
  hechizos: conTruco('hechizos', (e) => {
    for (const h of Object.values(e.heroes)) h.hechizos = D.HEROES[h.tipo].elementos.flatMap((el) => D.HECHIZOS_POR_ELEMENTO[el]);
    return 'Hechizos recuperados.';
  })
};

// =============================================================
//  REACCIONES: sellos de lacre que salen sobre el héroe
// =============================================================
let autoReac = leer('criptas_autoreac') !== 'no';
const pintarAutoReac = () => { $('#b-auto-reac').textContent = 'Reacciones solas: ' + (autoReac ? 'sí' : 'no'); };
$('#b-auto-reac').addEventListener('click', () => { autoReac = !autoReac; guardar('criptas_autoreac', autoReac ? 'si' : 'no'); pintarAutoReac(); });
pintarAutoReac();

const sellosVivos = [];
function sello(heroe, r) {
  const capa = $('#capa-sellos');
  if (!capa || !posDe(heroe)) return;
  const el = document.createElement('div');
  el.className = 'sello ' + (r.tono || '');
  el.innerHTML = `<span class="cera">${svg(r.icono)}</span><span class="lema">${esc(r.texto)}</span>`;
  capa.appendChild(el);
  // Si el mismo héroe ya tiene uno, el nuevo sale un poco más arriba.
  const antes = sellosVivos.filter((s) => s.heroe === heroe).length;
  const s = { el, heroe, t0: performance.now(), sube: antes * 34 };
  sellosVivos.push(s);
  colocarSellos();
  setTimeout(() => { el.classList.add('fuera'); }, 2300);
  setTimeout(() => { el.remove(); sellosVivos.splice(sellosVivos.indexOf(s), 1); }, 2800);
  if (sellosVivos.length === 1) requestAnimationFrame(bucleSellos);
}
function colocarSellos() {
  for (const s of sellosVivos) {
    const p = posDe(s.heroe);
    if (!p) continue;
    const [x, y] = tablero.pantallaDe(p[0], p[1]);
    const t = Math.min(1, (performance.now() - s.t0) / 2600);
    s.el.style.transform = `translate(${x}px, ${y - s.sube - 18 * t}px) translate(-50%, -100%)`;
  }
}
function bucleSellos() { if (!sellosVivos.length) return; colocarSellos(); requestAnimationFrame(bucleSellos); }

// Botón y panel: elegir una reacción. Sale sobre tu héroe del turno o, si no es tu turno, sobre el primero tuyo.
function heroeQueReacciona() {
  const e = app.estado;
  if (!e || e.fase !== 'mision') return null;
  const mios = e.orden.filter((t) => M.puedeControlar(e, miId, t) && !e.heroes[t].ia);
  if (e.turno && mios.includes(e.turno.heroe)) return e.turno.heroe;
  return mios.find((t) => e.heroes[t].vivo && !e.heroes[t].fuera) || mios[0] || null;
}
function actualizarBotonReaccion() {
  const b = $('#b-reaccion');
  b.hidden = !heroeQueReacciona();
  if (b.hidden) $('#panel-reacciones').hidden = true;
}
$('#panel-reacciones').innerHTML = Object.entries(D.REACCIONES).map(([id, r]) =>
  `<button class="sello mini ${r.tono}" data-reac="${id}"><span class="cera">${svg(r.icono)}</span><span class="lema">${esc(r.texto)}</span></button>`).join('');
$('#b-reaccion').addEventListener('click', (ev) => { ev.stopPropagation(); $('#panel-reacciones').hidden = !$('#panel-reacciones').hidden; });
$('#panel-reacciones').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-reac]');
  if (!b) return;
  $('#panel-reacciones').hidden = true;
  const h = heroeQueReacciona();
  if (h) enviar({ tipo: 'reaccion', heroe: h, reaccion: b.dataset.reac });
});
document.addEventListener('click', (ev) => { if (!ev.target.closest('#panel-reacciones, #b-reaccion')) $('#panel-reacciones').hidden = true; });
