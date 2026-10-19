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
import { ICONOS } from './iconos.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const svg = (n, extra = '') => `<svg viewBox="0 0 512 512" aria-hidden="true" ${extra}><path d="${ICONOS[n] || ''}"/></svg>`;
const del = (h) => (h.fem ? 'de la ' : 'del ') + h.nombre;
const art = (h) => (h.fem ? 'la ' : 'el ') + h.nombre;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
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
function mostrar(id) { for (const p of PANTALLAS) $('#' + p).hidden = p !== id; }

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
const listas = Promise.all(D.CAMPANA.map((id) => fetch('misiones/' + id + '.json').then((r) => r.json()).then((j) => (app.misiones[id] = j))));

// =============================================================
//  PORTADA
// =============================================================
$('#nombre').value = leer('criptas_nombre') || '';
const miNombre = () => ($('#nombre').value.trim() || 'Aventurero').slice(0, 20);
$('#nombre').addEventListener('change', () => guardar('criptas_nombre', $('#nombre').value.trim()));
const guardado = () => { try { return JSON.parse(leer('criptas_partida')); } catch { return null; } };
$('#b-continuar').hidden = !guardado();

$('#b-local').addEventListener('click', () => {
  app.modo = 'local';
  app.sala = { codigo: null, jugadores: { [miId]: { nombre: miNombre() } }, eleccion: {}, misionIdx: 0 };
  pintarSala(); mostrar('sala');
});
$('#b-crear').addEventListener('click', async () => {
  avisoPortada('Abriendo la sala…');
  try {
    app.modo = 'anfitrion';
    app.sala = { codigo: null, jugadores: { [miId]: { nombre: miNombre() } }, eleccion: {}, misionIdx: 0 };
    app.red = await (await Red()).crearSala(miId, eventosAnfitrion());
    app.sala.codigo = app.red.codigo;
    avisoPortada('');
    pintarSala(); mostrar('sala');
  } catch (e) { app.modo = null; avisoPortada(e.message); }
});
$('#f-unirse').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const codigo = $('#codigo').value.trim().toUpperCase();
  if (codigo.length !== 4) return avisoPortada('El código tiene 4 letras.');
  avisoPortada('Buscando la sala ' + codigo + '…');
  try {
    app.modo = 'invitado';
    app.red = await (await Red()).unirseSala(codigo, miId, miNombre(), {
      alMensaje: mensajeDelAnfitrion,
      alAnfitrion: (online) => anfitrionCambia(online)
    });
    avisoPortada('');
    if (!app.red.anfitrionOnline) anfitrionCambia(false);
  } catch (e) { app.modo = null; avisoPortada(e.message); }
});
$('#codigo').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
$('#b-continuar').addEventListener('click', async () => {
  const g = guardado();
  if (!g) return;
  await listas;
  if (g.modo === 'anfitrion' && g.codigo) {
    avisoPortada('Reabriendo la sala ' + g.codigo + '…');
    try { await retomarComoAnfitrion(g.codigo, g.estado); avisoPortada(''); }
    catch (e) { avisoPortada(e.message); }
    return;
  }
  app.modo = 'local';
  app.visto = 0; app.estado = null; app.cola = [];
  publicar(g.estado);
});

// Seguir una partida como anfitrión (tras recargar, o si el anfitrión se fue).
async function retomarComoAnfitrion(codigo, estado) {
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
  app.red = await (await Red()).crearSala(miId, eventosAnfitrion(), { codigo, retomar: true });
  toast('Sala ' + codigo + ' abierta. Los demás pueden volver a entrar con el mismo código.', 'bueno');
  publicar(estado);
}

// El invitado se entera de que el anfitrión se ha ido (o ha vuelto).
let avisoCaida = null;
function anfitrionCambia(online) {
  if (app.modo !== 'invitado') return;
  clearTimeout(avisoCaida);
  if (online) return;
  // Margen por si solo ha recargado la página.
  avisoCaida = setTimeout(async () => {
    if (app.modo !== 'invitado') return;
    const estado = await app.red.estadoGuardado();
    if (!estado) { salirAPortada(); return avisoPortada('El anfitrión ha cerrado la sala.'); }
    app.cerrarModalFuera = null;
    const i = await modal('<h2>El anfitrión se ha ido</h2><p>La partida está guardada. Puedes seguir tú como anfitrión con el mismo código, o esperar a que vuelva.</p>',
      [{ texto: 'Esperar', clase: 'claro' }, { texto: 'Seguir como anfitrión' }]);
    if (i === 1) {
      try { await retomarComoAnfitrion(app.red.codigo, estado); } catch (e) { toast(e.message, 'peligro'); }
    }
  }, 6000);
}
$('#b-reglas').addEventListener('click', () => mostrarReglas());
function avisoPortada(t) { $('#aviso-portada').textContent = t; }

function mostrarReglas() {
  app.cerrarModalFuera = () => {};
  modal(`<h2>Cómo se juega</h2>
    <p>Cada héroe, en su turno, <b>tira los dados de movimiento</b> y camina por las casillas iluminadas, y hace <b>una acción</b>: atacar, lanzar un hechizo, buscar tesoro, buscar trampas y puertas secretas o desarmar una trampa. Puede mover antes o después de actuar.</p>
    <p>Las salas y pasillos se descubren al verlos. Abrir una puerta revela la sala entera… y lo que hay dentro.</p>
    <p><b>Combate:</b> el atacante tira dados blancos y cuenta calaveras. El héroe se defiende con escudos blancos; el monstruo, con escudos negros. Cada calavera no parada quita un punto de cuerpo.</p>
    <p>Tras el último héroe mueven los monstruos. Algunos te persiguen, otros guardan su sala y otros esperan a que pase algo.</p>
    <p class="nota">Busca trampas antes de cruzar pasillos sospechosos y no busques tesoro con monstruos a la vista.</p>`, [{ texto: 'Entendido' }]);
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
      <div><span>Puntos mentales</span><b>${b.mente}</b></div>
    </div>
    <dl class="lineas">
      <dt>Movimiento</dt><dd>${mov} ${mov === 1 ? 'dado rojo' : 'dados rojos'}</dd>
      <dt>Arma</dt><dd>${esc(arma)}</dd>
      <dt>Armadura</dt><dd>${esc(armadura)}</dd>
      ${magia ? `<dt>Magia</dt><dd>${esc(magia)}</dd>` : ''}
      ${h ? `<dt>Oro</dt><dd>${h.oro} monedas</dd>` : ''}
    </dl>
  </div>`;
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
    const quien = duenio ? (duenio === miId ? 'Lo llevas tú' : 'Lo lleva ' + (s.jugadores[duenio]?.nombre || '…')) : 'Llevar';
    const puedoCambiar = !duenio || duenio === miId;
    const otro = fem ? D.HEROES[t].nombre : D.HEROES[t].fem.nombre;
    return `<div class="hsel ${clase}">${tarjetaHTML(t, fem)}
      <div class="hsel-pie">
        <button class="btn ${duenio === miId ? '' : 'madera'}" data-heroe="${t}" ${duenio && duenio !== miId ? 'disabled' : ''}>${esc(quien)}</button>
        <button class="btn claro" data-variante="${t}" ${puedoCambiar ? '' : 'disabled'} title="Cambiar a ${esc(otro)}">${esc(otro)}</button>
      </div></div>`;
  }).join('');
  $('#heroes-sel').querySelectorAll('[data-variante]').forEach((b) => b.addEventListener('click', () => cambiarVariante(b.dataset.variante)));
  $('#heroes-sel').querySelectorAll('[data-heroe]').forEach((b) => b.addEventListener('click', () => elegirHeroe(b.dataset.heroe)));
  $('#lista-jugadores').innerHTML = Object.entries(s.jugadores).map(([id, j]) => `<li class="${j.desconectado ? 'fuera' : ''}">${esc(j.nombre)}${id === miId ? ' (tú)' : ''}</li>`).join('');
  const sel = $('#sel-mision');
  sel.innerHTML = D.CAMPANA.map((id, i) => `<option value="${i}">${i + 1}. ${esc(app.misiones[id]?.titulo || id)}</option>`).join('');
  sel.value = String(s.misionIdx);
  sel.disabled = !manda;
  $('#b-empezar').hidden = !manda;
  $('#sala-espera').hidden = manda;
  $('#b-empezar').disabled = !Object.keys(s.eleccion).length;
  $('#b-empezar').textContent = s.misionIdx > 0 ? 'Empezar en la misión ' + (s.misionIdx + 1) : 'Empezar la campaña';
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
$('#sel-mision').addEventListener('change', (e) => { app.sala.misionIdx = +e.target.value; difundirSala(); });
$('#b-salir-sala').addEventListener('click', () => salirAPortada());
$('#b-empezar').addEventListener('click', async () => {
  await listas;
  const s = app.sala;
  const elegidos = Object.entries(s.eleccion).map(([tipo, jugador]) => ({ tipo, jugador, variante: s.variante?.[tipo] }));
  if (!elegidos.length) return;
  const e = M.crearPartida(elegidos, s.jugadores);
  e.anfitrion = miId;
  e.misionIdx = s.misionIdx;
  M.iniciarMision(e, app.misiones[D.CAMPANA[s.misionIdx]]);
  app.visto = 0; app.estado = null; app.cola = [];
  publicar(e);
});

function salirAPortada() {
  app.red?.cerrar(); app.red = null; app.modo = null; app.estado = null; app.estadoReal = null; app.sala = null; app.cola = [];
  $('#b-continuar').hidden = !guardado();
  $('#registro').hidden = true;
  mostrar('portada');
}

// =============================================================
//  RED: anfitrión
// =============================================================
function eventosAnfitrion() {
  return {
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
  } else if (msg.t === 'estado') recibirEstado(msg.estado);
  else if (msg.t === 'error') toast(msg.texto, 'peligro');
}

// =============================================================
//  ESTADO Y ACCIONES
// =============================================================
function publicar(estado) {
  guardar('criptas_partida', { modo: app.modo, codigo: app.red?.codigo || null, estado });
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
    $('#br-num').textContent = 'Misión ' + m.numero + ' de ' + e.campana.length;
    $('#br-titulo').textContent = m.titulo;
    $('#br-intro').textContent = m.intro;
    $('#br-objetivo').textContent = m.objetivo.texto;
    pintarMapaMision($('#br-mapa'), e);
    $('#b-entrar').hidden = !manda;
    $('#br-espera').hidden = manda;
    mostrar('briefing');
  } else if (e.fase === 'mision' || e.fase === 'resultado') {
    if ($('#juego').hidden) { mostrar('juego'); tablero.ajustado = false; tablero.ajustar(); }
    $('#j-titulo').textContent = e.mision.titulo;
    tablero.estado = e;
    pintarJuego();
  } else if (e.fase === 'armeria') { if (!app.cola.length) { pintarArmeria(); mostrar('armeria'); } }
  else if (e.fase === 'final') { if (!app.cola.length) { pintarFinal(); mostrar('final'); } }
}

$('#b-entrar').addEventListener('click', () => enviar({ tipo: 'empezar' }));

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
$('#b-cerrar-registro').innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>';
$('#b-vertodo').addEventListener('click', () => {
  const e = app.estado;
  if (tablero.cam.z > tablero.min * 1.05) tablero.verTodo();
  else if (e?.turno) { const h = e.heroes[e.turno.heroe]; tablero.centrarEn(h.x, h.y, true); }
});
$('#b-registro').addEventListener('click', () => { pintarDiario(); $('#registro').hidden = false; });
$('#b-cerrar-registro').addEventListener('click', () => ($('#registro').hidden = true));
$('#b-sonido').addEventListener('click', () => { app.sonido = !app.sonido; guardar('criptas_sonido', app.sonido ? 'si' : 'no'); $('#b-sonido').textContent = 'Sonido: ' + (app.sonido ? 'sí' : 'no'); });
$('#b-sonido').textContent = 'Sonido: ' + (app.sonido ? 'sí' : 'no');
$('#b-abandonar').addEventListener('click', async () => {
  const i = await modal('<h2>¿Abandonar?</h2><p>La partida queda guardada en este dispositivo y podrás continuarla desde la portada.</p>', [{ texto: 'Seguir jugando', clase: 'claro' }, { texto: 'Abandonar' }]);
  if (i === 1) salirAPortada();
});

function pintarDiario() {
  const e = app.estado;
  $('#diario-sala').hidden = !app.red;
  $('#diario-sala').innerHTML = app.red ? 'Código de la sala: <b>' + esc(app.red.codigo) + '</b>' : '';
  $('#diario').innerHTML = (e?.log || []).slice().reverse().map((l) => `<li class="${l.tono}">${esc(l.texto)}</li>`).join('');
}

const miHeroeEnTurno = () => {
  const e = app.estado;
  if (!e || e.fase !== 'mision' || !e.turno || e.resultado) return null;
  return M.puedeControlar(e, miId, e.turno.heroe) ? e.heroes[e.turno.heroe] : null;
};

function pintarJuego() {
  const e = app.estado;
  // Hojas de personaje.
  $('#hojas').innerHTML = e.orden.map((t) => {
    const h = e.heroes[t], def = D.HEROES[t];
    const vida = Array.from({ length: h.cuerpoMax }, (_, i) => `<i class="${i < h.cuerpo ? '' : 'vacio'}"></i>`).join('');
    const quien = e.jugadores?.[h.jugador]?.nombre || '';
    const clase = [e.turno?.heroe === t && e.fase === 'mision' ? 'activa' : '', h.vivo ? '' : 'muerto', h.fuera ? 'fuera' : ''].join(' ');
    return `<button class="hoja ${clase}" data-heroe="${t}"><span class="ret" style="background:${def.color}">${svg(h.icono)}</span>
      <strong>${esc(h.nombre)}</strong><span class="vida" aria-label="Cuerpo ${h.cuerpo} de ${h.cuerpoMax}">${vida}</span>
      ${app.modo !== 'local' ? `<span class="jug">${esc(quien)}</span>` : ''}</button>`;
  }).join('');
  $('#hojas').querySelectorAll('[data-heroe]').forEach((b) => b.addEventListener('click', () => fichaHeroe(b.dataset.heroe)));
  pintarAcciones();
}

function pintarAcciones() {
  const e = app.estado;
  const et = $('#estado-turno'), bot = $('#botonera');
  tablero.resaltes = { destinos: {}, ataque: [], magia: [], trampas: [] };
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
  et.innerHTML = `<b>${esc(h.nombre)}</b><span>${esc(info)}</span>`;

  if (!app.reproduciendo) {
    if (app.seleccion?.tipo === 'hechizo') tablero.resaltes.magia = app.seleccion.objetivos;
    else {
      tablero.resaltes.destinos = d.destinos || {};
      tablero.resaltes.ataque = d.atacables || [];
      tablero.resaltes.trampas = d.desarmables || [];
    }
  }
  const b = [];
  const boton = (id, icono, texto, extra = {}) => b.push(`<button class="acc ${extra.clase || ''}" data-acc="${id}" ${extra.off ? 'disabled' : ''} ${extra.titulo ? `title="${esc(extra.titulo)}"` : ''}>${svg(icono)}<span>${esc(texto)}</span>${extra.n ? `<span class="n">${esc(extra.n)}</span>` : ''}</button>`);
  if (d.puedeTirar) boton('tirar', 'dados', 'Mover', { clase: 'principal', n: dadosTxt(h) });
  boton('atacar', 'atacar', 'Atacar', { off: !d.atacables.length, n: D.ARMAS[h.arma].nombre });
  if (h.hechizos.length) boton('hechizo', 'hechizo', 'Hechizo', { off: !d.hechizos.length, n: h.hechizos.length + ' restantes', clase: app.seleccion?.tipo === 'hechizo' ? 'activo' : '' });
  boton('tesoro', 'cofreAbierto', 'Buscar tesoro', { off: !d.buscarTesoro, titulo: d.motivoBusqueda });
  boton('trampas', 'buscar', 'Buscar trampas', { off: !d.buscarTrampas, n: 'y puertas secretas' });
  if (d.desarmables.length) boton('desarmar', 'llave', 'Desarmar');
  if (d.pociones.length) boton('pocion', 'pocion', 'Poción', { n: d.pociones.reduce((s, p) => s + h.objetos[p], 0) + '' });
  if (d.salir) boton('salir', 'escalera', 'Salir', { clase: 'principal' });
  else if (enLaEscalera(e, h)) boton('salir', 'escalera', 'Salir', { off: true, n: 'Aún no', titulo: motivoNoSalir(e) });
  boton('fin', 'reloj', 'Fin del turno');
  bot.innerHTML = b.join('');
  bot.querySelectorAll('[data-acc]').forEach((x) => x.addEventListener('click', () => accionBoton(x.dataset.acc, h, d)));
  if (app.reproduciendo) bot.querySelectorAll('button').forEach((x) => (x.disabled = true));
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
    case 'salir': return enviar({ ...base, tipo: 'salir' });
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

function fichaHeroe(t) {
  const e = app.estado, h = e.heroes[t], def = D.HEROES[t];
  const pots = Object.entries(h.objetos).filter(([, n]) => n > 0).map(([k, n]) => D.POCIONES[k]?.nombre + ' ×' + n).join(', ');
  const hz = h.hechizos.map((x) => D.HECHIZOS[x].nombre).join(', ');
  const ef = Object.keys(h.efectos).map((k) => ({ piel: 'Piel de roca', coraje: '+2 dados de ataque', fuerza: '+2 dados de ataque', veloz: 'Movimiento doble', niebla: 'Oculto en la niebla' }[k])).filter(Boolean).join(', ');
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
    if (app.seleccion?.tipo === 'hechizo') {
      if (f && app.seleccion.objetivos.includes(f.id)) return enviar({ heroe: h.id, tipo: 'hechizo', hechizo: app.seleccion.hechizo, objetivo: f.id });
      app.seleccion = null; return pintarAcciones();
    }
    if (f && d.atacables.includes(f.id)) { app.seleccion = null; return enviar({ heroe: h.id, tipo: 'atacar', objetivo: f.id }); }
    if (app.seleccion) { app.seleccion = null; pintarAcciones(); }
    if (d.destinos[k]) return enviar({ heroe: h.id, tipo: 'mover', x, y });
    const tr = e.trampas.find((t) => t.x === x && t.y === y && d.desarmables.includes(t.id));
    if (tr) return enviar({ heroe: h.id, tipo: 'desarmar', trampa: tr.id });
  }
  // Información de lo que hay en la casilla.
  if (!e.revelado[k]) return toast('Aún no habéis visto esta zona.');
  if (f && e.heroes[f.id]) return fichaHeroe(f.id);
  if (f) {
    const extra = f.efectos.dormido ? ' Duerme.' : '';
    return toast(`${f.nombre}: ataque ${f.ataque}, defensa ${f.defensa}, cuerpo ${f.cuerpo}/${f.cuerpoMax}, movimiento ${f.mov}.${extra}`);
  }
  const u = T.muebleEn(e, x, y);
  if (u) return toast(D.MUEBLES[u.tipo].nombre + '.');
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
}

const posDe = (id) => {
  const e = app.estado;
  const f = e.heroes[id] || e.monstruos.find((m) => m.id === id);
  return f ? (tablero.vista.pos[id] || [f.x, f.y]) : null;
};
const nombre = (id) => M.nombreDe(app.estado, id);
const conArticulo = (id) => (app.estado.heroes[id] ? art(app.estado.heroes[id]) : nombre(id));

function esperaSaltable(ms) {
  return new Promise((ok) => {
    const t = setTimeout(fin, ms);
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
      $('#mesa-dados').innerHTML = `<h3>${esc(nombre(ev.heroe))} se mueve</h3><div class="tira">${ev.valores.map(dadoRojo).join('')}</div>
        <div class="resultado-dados">${ev.total} casillas${ev.total > ev.valores.reduce((a, b) => a + b, 0) ? ' (¡doble!)' : ''}</div>`;
      $('#dados').hidden = false; sonar('dados');
      await esperaSaltable(1000);
      $('#dados').hidden = true;
      break;
    }
    case 'mover': {
      const paso = e.heroes[ev.id] ? 120 : 95;
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
      if (tablero.cam.z > tablero.min * 1.3) tablero.centrarEn(fx, fy, false);
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
    case 'dados': {
      const atk = ev.ataque, def = ev.defensa;
      const cuentaDef = ev.defiende === 'heroe' ? 'escudo' : 'escudoNegro';
      const golpes = atk.filter((c) => c === 'calavera').length;
      const paradas = def.filter((c) => c === cuentaDef).length;
      $('#mesa-dados').innerHTML = `<h3>${esc(nombre(ev.atacante))} ataca a ${esc(conArticulo(ev.defensor))}</h3>
        <p class="sub">${esc(ev.etiqueta || '')}</p>
        <div class="tira-et">Ataque: ${golpes} ${golpes === 1 ? 'calavera' : 'calaveras'}</div>
        <div class="tira">${atk.map((c) => dadoHTML(c, c === 'calavera')).join('') || '<span class="tira-et">—</span>'}</div>
        <div class="tira-et">Defensa: ${paradas} ${ev.defiende === 'heroe' ? (paradas === 1 ? 'escudo blanco' : 'escudos blancos') : (paradas === 1 ? 'escudo negro' : 'escudos negros')}</div>
        <div class="tira">${def.map((c) => dadoHTML(c, c === cuentaDef)).join('') || '<span class="tira-et">Sin defensa</span>'}</div>
        <div class="resultado-dados ${ev.dano ? '' : 'nada'}">${ev.dano ? '¡' + ev.dano + ' de daño!' : 'Sin daño'}</div>`;
      $('#dados').hidden = false; sonar('dados');
      await esperaSaltable(ev.defiende === 'heroe' ? 1500 : 1300);
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
    <p class="nota">${e.orden.map((t) => esc(e.heroes[t].nombre) + ': ' + e.heroes[t].oro + ' monedas').join(' · ')}</p>
    ${manda ? '' : '<p class="nota">El anfitrión os llevará a la armería.</p>'}`;
  sonar(victoria ? 'tesoro' : 'muerte');
  app.cerrarModalFuera = null;
  if (manda) {
    await modal(html, [{ texto: victoria ? (e.misionIdx + 1 >= e.campana.length ? 'Ver el final' : 'Ir a la armería') : 'Ir a la armería y reintentar' }]);
    app.trasCola = { tipo: 'continuar' };
  } else await modal(html, [{ texto: 'De acuerdo' }]);
}

// =============================================================
//  ARMERÍA
// =============================================================
function pintarArmeria() {
  const e = app.estado;
  const manda = app.modo !== 'invitado';
  const misHeroes = e.orden.filter((t) => M.puedeControlar(e, miId, t));
  if (!misHeroes.includes(app.pestana)) app.pestana = misHeroes[0] || e.orden[0];
  const siguiente = app.misiones[e.campana[e.misionIdx]];
  $('#arm-sub').textContent = 'Gastad el oro antes de bajar. Siguiente misión: ' + (siguiente?.titulo || '');
  $('#arm-pestanas').innerHTML = e.orden.map((t) => `<button aria-pressed="${t === app.pestana}" data-t="${t}">${esc(e.heroes[t].nombre)}</button>`).join('');
  $('#arm-pestanas').querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { app.pestana = b.dataset.t; pintarArmeria(); }));
  const h = e.heroes[app.pestana];
  const mio = M.puedeControlar(e, miId, h.id);
  const fila = (id, def, tipoTxt) => {
    const motivo = M.puedeComprar(e, h, id);
    const tengo = h.arma === id || h.armaduras.includes(id) || (id === 'kit' && h.kit);
    const desc = def.ataque ? `${def.ataque} dados de ataque${def.diagonal ? ', ataca en diagonal' : ''}${def.distancia ? ', a distancia' : ''}${def.dosManos ? ', a dos manos' : ''}` : def.defensa ? `+${def.defensa} dado${def.defensa > 1 ? 's' : ''} de defensa${def.lenta ? ', mueves con 1 dado' : ''}` : def.desc;
    return `<div class="item">${svg(def.icono)}<strong>${esc(def.nombre)}</strong>
      <button class="btn ${tengo ? 'claro' : ''}" data-comprar="${id}" ${!mio || motivo ? 'disabled' : ''} title="${esc(motivo || '')}">${tengo ? 'Lo tienes' : def.precio + ' oro'}</button>
      <span>${esc(tipoTxt + ' · ' + desc)}</span></div>`;
  };
  $('#arm-cuerpo').innerHTML = `<div class="monedas">${svg('oro')}${h.oro} monedas</div>
    <p class="nota">Lleva: ${esc(D.ARMAS[h.arma].nombre)}${h.armaduras.length ? ', ' + esc(h.armaduras.map((a) => D.ARMADURAS[a].nombre).join(', ')) : ''}.${mio ? '' : ' Este héroe lo equipa otro jugador.'}</p>
    <div class="armeria-grid">
      ${Object.entries(D.ARMAS).filter(([id]) => id !== 'daga').map(([id, d]) => fila(id, d, 'Arma')).join('')}
      ${Object.entries(D.ARMADURAS).map(([id, d]) => fila(id, d, 'Armadura')).join('')}
      ${Object.entries(D.OBJETOS_TIENDA).map(([id, d]) => fila(id, d, 'Objeto')).join('')}
    </div>`;
  $('#arm-cuerpo').querySelectorAll('[data-comprar]').forEach((b) => b.addEventListener('click', () => enviar({ tipo: 'comprar', heroe: h.id, item: b.dataset.comprar })));
  $('#b-siguiente').hidden = !manda;
  $('#arm-espera').hidden = manda;
}
$('#b-siguiente').addEventListener('click', () => enviar({ tipo: 'siguienteMision' }));

function pintarFinal() {
  const e = app.estado;
  $('#final-heroes').innerHTML = `<p class="nota">${e.orden.map((t) => esc(e.heroes[t].nombre) + ' · ' + e.heroes[t].oro + ' monedas').join('<br>')}</p>`;
}
$('#b-nueva').addEventListener('click', () => { borrar('criptas_partida'); salirAPortada(); });

// Avisar antes de cerrar si eres anfitrión con gente conectada.
window.addEventListener('beforeunload', (e) => { if (app.modo === 'anfitrion' && app.estado) { e.preventDefault(); e.returnValue = ''; } });

// Acceso desde la consola del navegador, útil para depurar.
window.criptas = { app, enviar, M, D };

// Acceso desde la consola del navegador, útil para depurar.
window.criptas = { app, enviar, M, D };

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
