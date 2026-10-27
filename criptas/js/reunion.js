// =============================================================
//  REUNIÓN: la sala de antes de bajar al libro.
//  Los jugadores se juntan en Morrandar (3D) o en la pantalla ligera
//  (reunion.html), se ven, se saludan, y cuando alguien propone una
//  misión y todos dicen «¡Listo!», bajan juntos a la sala de siempre
//  (index.html), con el mismo código.
//
//  Vive en la misma sala de Firebase que la partida, /salas/CODIGO:
//    anfitrion, anfitrionOnline        como en red.js
//    reunion/abierta                   true: la sala nació en una reunión
//    reunion/enJuego                   true mientras están en la mazmorra
//    reunion/gente/ID                  { nombre, clase, donde, x, z, lado, online, voto, gesto, frase, visto }
//    reunion/propuesta                 { modo, de, n }  (n identifica la propuesta)
//    reunion/salida                    { modo, n }      todos a la sala de preparación
//    reunion/regreso                   { n }            el anfitrión vuelve a Morrandar
//    reunion/cabana                    JSON con los trofeos y el diario del anfitrión
//
//  Votar: cada uno guarda en «voto» el n de la propuesta que acepta;
//  así, una propuesta nueva anula sola los votos viejos.
// =============================================================
import { app } from './firebase.js';
import {
  getDatabase, ref, get, set, update, remove, onValue, onDisconnect, serverTimestamp, off
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import { nuevoCodigo } from './red.js';

const db = getDatabase(app);
const r = (c, ruta = '') => ref(db, 'salas/' + c + (ruta ? '/' + ruta : ''));
const conectado = ref(db, '.info/connected');
let desfase = 0;
onValue(ref(db, '.info/serverTimeOffset'), (s) => { desfase = s.val() || 0; });
const ahora = () => Date.now() + desfase;

const leer = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };
const leerS = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const guardarS = (k, v) => { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch { /* nada */ } };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const FRASES = ['¡Vamos!', 'Un momento', 'Voy al baúl', '¡Listo!', 'Jajaja', '¡Mirad esto!', 'Ahora vuelvo', '¿Bajamos?'];
export const GESTOS = [
  { id: 'saludo', icono: '👋', nombre: 'Saludar' },
  { id: 'reverencia', icono: '🙇', nombre: 'Reverencia' },
  { id: 'baile', icono: '💃', nombre: 'Bailar' },
  { id: 'sentarse', icono: '🪑', nombre: 'Sentarse' }
];
export const MODOS = { infinita: 'la Mazmorra Infinita', historia: 'el Modo Historia' };
export const LUGARES = { tortuga: '🐢 en Morrandar', ligera: '📖 esperando', cabana: '🏠 en la cabaña', juego: '⚔ en la mazmorra' };

// Recuerda en este dispositivo si se prefiere la tortuga o la pantalla ligera.
export const vistaPreferida = () => leer('criptas_vistaReunion', '');
export const ponerVista = (v) => guardar('criptas_vistaReunion', v);
export const paginaDeVista = (v) => (v === 'ligera' ? 'reunion.html' : 'tortuga.html');
// La reunión en la que está esta pestaña (para volver a ella tras la partida).
export const reunionActual = () => leerS('criptas_reunion');
export const olvidarReunion = () => guardarS('criptas_reunion', null);
export const recordarReunion = (c) => guardarS('criptas_reunion', c);

export function miIdentidad() {
  let id = leer('criptas_id');
  if (!id) { id = 'j' + Math.random().toString(36).slice(2, 10); guardar('criptas_id', id); }
  return { id, nombre: (leer('criptas_nombre', '') || 'Viajero').slice(0, 20) };
}

function traducir(e) {
  if (String(e?.code || e?.message).includes('PERMISSION_DENIED')) return new Error('La base de datos ha rechazado la reunión. Hay que revisar las reglas de Realtime Database en Firebase.');
  return e instanceof Error && !e.code ? e : new Error('No se pudo conectar. Revisa tu conexión.');
}

// ¿Esta sala es una reunión? (para el menú del juego)
export async function infoReunion(codigo) {
  try {
    const v = (await get(r(codigo, 'reunion/abierta'))).val();
    if (!v) return null;
    const enJuego = (await get(r(codigo, 'reunion/enJuego'))).val() === true;
    return { enJuego };
  } catch { return null; }
}

// Desde la partida (index.html): el anfitrión avisa de que vuelven a Morrandar…
export function marcarRegreso(codigo) {
  return update(r(codigo, 'reunion'), { enJuego: false, regreso: { n: ahora() } }).catch(() => {});
}
// …y los invitados se enteran. Lo que ya había al entrar no cuenta.
export function vigilarRegreso(codigo, f) {
  let base;
  const rf = r(codigo, 'reunion/regreso');
  const oir = (s) => { const n = s.val()?.n || 0; if (base === undefined) { base = n; return; } if (n !== base) { base = n; f(); } };
  onValue(rf, oir, () => {});
  return () => off(rf, 'value', oir);
}

// Si estás de visita en la sala de otro, los datos de su cabaña (trofeos y diario).
// null si no hay sala, si la sala es tuya o si no se puede leer.
export async function cabanaDeLaSala() {
  const c = new URLSearchParams(location.search).get('sala') || reunionActual();
  if (!c) return null;
  try {
    await Promise.race([import('./nube.js').then((m) => m.usuarioListo()), new Promise((ok) => setTimeout(ok, 4000))]);
    const anf = (await get(r(c, 'anfitrion'))).val();
    if (!anf || anf === miIdentidad().id) return null;
    const t = (await get(r(c, 'reunion/cabana'))).val();
    const d = t ? JSON.parse(t) : null;
    const limpio = (t) => String(t ?? '').replace(/[<>&"']/g, '').slice(0, 40);
    return d ? { nombre: limpio(d.nombre) || 'tu anfitrión', trofeos: (d.trofeos || []).map((x) => ({ nombre: limpio(x.nombre), donde: limpio(x.donde) })), diario: d.diario ? Object.fromEntries(['misiones', 'victorias', 'derrotas', 'pisoMax', 'jefes', 'monstruos'].map((k) => [k, Number(d.diario[k]) || 0])) : null } : null;
  } catch { return null; }
}

// -------------------------------------------------------------
//  Conectar: crear una sala nueva o entrar en una que existe.
//  datos: { donde, clase, x, z }  cabana: datos públicos de la cabaña (si eres anfitrión)
// -------------------------------------------------------------
export async function conectar({ codigo = null, crear = false, donde = 'tortuga', clase = 'barbaro', x = 0, z = 5.6, cabana = null } = {}) {
  const yo = miIdentidad();
  try {
    if (crear) {
      for (let i = 0; i < 6 && !codigo; i++) {
        const c = nuevoCodigo();
        if ((await get(r(c, 'anfitrionOnline'))).val() !== true) codigo = c;
      }
      if (!codigo) throw new Error('No hay códigos libres, inténtalo otra vez.');
      await set(r(codigo), { anfitrion: yo.id, anfitrionOnline: true, creada: serverTimestamp(), reunion: { abierta: true, enJuego: false } });
    } else {
      codigo = String(codigo || '').toUpperCase();
      const anf = (await get(r(codigo, 'anfitrion'))).val();
      if (!anf) throw new Error('No hay ninguna sala con el código ' + codigo + '.');
      if (!(await get(r(codigo, 'reunion/abierta'))).val()) {
        if ((await get(r(codigo, 'estado'))).exists()) throw new Error('Esa sala está en plena partida: entra desde el menú del juego.');
        await update(r(codigo, 'reunion'), { abierta: true, enJuego: false });
      }
    }
  } catch (e) { throw traducir(e); }
  recordarReunion(codigo);

  const oyentes = {};
  const emitir = (t, ...a) => (oyentes[t] || []).forEach((f) => { try { f(...a); } catch (e) { console.error(e); } });
  const quitar = [];
  const escuchar = (ruta, f) => { const rf = r(codigo, ruta); onValue(rf, f, (e) => emitir('error', traducir(e))); quitar.push(() => off(rf)); };

  // Mi ficha en la reunión. update (no set) para no borrar mi voto al cambiar de página.
  const nodo = r(codigo, 'reunion/gente/' + yo.id);
  const mio = { nombre: yo.nombre, clase, donde, x: +x.toFixed(2), z: +z.toFixed(2), lado: 1 };
  let anfitrion = null, anfOnline = true, cerrado = false;
  const presencia = (s) => {
    if (s.val() !== true || cerrado) return;
    onDisconnect(nodo).update({ online: false, visto: serverTimestamp() })
      .then(() => update(nodo, { ...mio, online: true, visto: serverTimestamp() }))
      .catch((e) => emitir('error', traducir(e)));
    if (anfitrion === yo.id) {
      onDisconnect(r(codigo, 'anfitrionOnline')).set(false).then(() => set(r(codigo, 'anfitrionOnline'), true)).catch(() => {});
    }
  };
  onValue(conectado, presencia);
  quitar.push(() => off(conectado, 'value', presencia));

  // Estado compartido
  let gente = {}, propuesta = null, enJuego = false;
  const primera = {};   // los valores que ya estaban al entrar no disparan nada
  const vistos = {};    // último gesto/frase visto de cada uno
  escuchar('anfitrion', (s) => {
    const antes = anfitrion; anfitrion = s.val();
    if (anfitrion === yo.id && antes !== yo.id) {
      onDisconnect(r(codigo, 'anfitrionOnline')).set(false).then(() => set(r(codigo, 'anfitrionOnline'), true)).catch(() => {});
      if (cabana) set(r(codigo, 'reunion/cabana'), JSON.stringify(cabana)).catch(() => {});
    }
    emitir('gente', R.gente());
  });
  let tHuerfana = null;
  escuchar('anfitrionOnline', (s) => {
    anfOnline = s.val() === true;
    clearTimeout(tHuerfana);
    // Si el anfitrión se ha ido, la sala pasa al primero de los que quedan.
    if (!anfOnline) tHuerfana = setTimeout(() => {
      if (cerrado || anfOnline) return;
      const quedan = Object.keys(R.gente()).filter((id) => id !== anfitrion).sort();
      if (quedan[0] === yo.id) update(r(codigo), { anfitrion: yo.id, anfitrionOnline: true }).catch(() => {});
    }, 6000 + Math.random() * 1500);
  });
  escuchar('reunion/gente', (s) => {
    gente = s.val() || {};
    for (const [id, g] of Object.entries(gente)) {
      const v = vistos[id] || (vistos[id] = { gesto: g.gesto?.n || 0, frase: g.frase?.n || 0 });
      if (g.gesto && g.gesto.n > v.gesto) { v.gesto = g.gesto.n; emitir('gesto', id, g.gesto.id, g); }
      if (g.frase && g.frase.n > v.frase) { v.frase = g.frase.n; emitir('frase', id, g.frase.texto, g); }
    }
    emitir('gente', R.gente());
    comprobarVotos();
  });
  escuchar('reunion/propuesta', (s) => { propuesta = s.val(); emitir('propuesta', propuesta); comprobarVotos(); });
  escuchar('reunion/enJuego', (s) => { enJuego = s.val() === true; emitir('juego', enJuego); });
  escuchar('reunion/salida', (s) => {
    const v = s.val();
    if (!('salida' in primera)) { primera.salida = v?.n || 0; return; }
    if (v && v.n !== primera.salida) { primera.salida = v.n; emitir('salida', v.modo); }
  });

  // Quien lleva la sala comprueba si ya están todos listos.
  let saliendo = false;
  function comprobarVotos() {
    if (saliendo || cerrado || anfitrion !== yo.id || !propuesta) return;
    const todos = Object.values(R.gente());
    if (!todos.length || !todos.every((g) => g.voto === propuesta.n)) return;
    saliendo = true;
    const modo = propuesta.modo;
    // Se limpia la partida anterior de esta sala, para que nadie entre en una vieja.
    Promise.all([remove(r(codigo, 'estado')), remove(r(codigo, 'sala')), remove(r(codigo, 'acciones')), remove(r(codigo, 'errores'))])
      .then(() => update(r(codigo, 'reunion'), { enJuego: true, propuesta: null, salida: { modo, n: ahora() } }))
      .catch((e) => emitir('error', traducir(e)))
      .finally(() => setTimeout(() => { saliendo = false; }, 3000));
  }

  // Enviar la posición con calma: unas 5 veces por segundo como mucho, y solo si cambia.
  let tMov = 0, pendiente = null, tPend = null;
  const enviarPos = () => { tPend = null; if (!pendiente || cerrado) return; tMov = performance.now(); update(nodo, pendiente).catch(() => {}); pendiente = null; };

  const R = {
    codigo, yo,
    get anfitrion() { return anfitrion; },
    soyAnfitrion: () => anfitrion === yo.id,
    get propuesta() { return propuesta; },
    get enJuego() { return enJuego; },
    // Los que están (o acaban de cambiar de página: margen de 20 s).
    gente() {
      const t = ahora(), res = {};
      for (const [id, g] of Object.entries(gente)) if (g.online || (g.visto && t - g.visto < 20000)) res[id] = { ...g, id, anfitrion: id === anfitrion };
      return res;
    },
    on(t, f) { (oyentes[t] ||= []).push(f); return R; },
    mover(px, pz, lado) {
      px = +px.toFixed(2); pz = +pz.toFixed(2);
      if (Math.abs(px - mio.x) < .05 && Math.abs(pz - mio.z) < .05 && lado === mio.lado) return;
      Object.assign(mio, { x: px, z: pz, lado });
      pendiente = { x: px, z: pz, lado };
      const falta = 200 - (performance.now() - tMov);
      if (falta <= 0) enviarPos(); else if (!tPend) tPend = setTimeout(enviarPos, falta);
    },
    cambiar(campos) { Object.assign(mio, campos); return update(nodo, campos).catch((e) => emitir('error', traducir(e))); },
    gesto(id) { return update(nodo, { gesto: { id, n: ahora() } }).catch(() => {}); },
    frase(texto) { return update(nodo, { frase: { texto: String(texto).slice(0, 60), n: ahora() } }).catch(() => {}); },
    proponer(modo) {
      const n = ahora();
      return update(r(codigo, 'reunion'), { propuesta: { modo, de: yo.id, n } })
        .then(() => update(nodo, { voto: n })).catch((e) => emitir('error', traducir(e)));
    },
    votar(si) { if (!propuesta) return; return update(nodo, { voto: si ? propuesta.n : 0 }).catch(() => {}); },
    retirarPropuesta() { return set(r(codigo, 'reunion/propuesta'), null).catch(() => {}); },
    async leerCabana() {
      try { const t = (await get(r(codigo, 'reunion/cabana'))).val(); return t ? JSON.parse(t) : null; } catch { return null; }
    },
    // La dirección de la sala de preparación para este jugador.
    urlPartida(modo) { return `index.html?sala=${codigo}&rol=${anfitrion === yo.id ? 'anfitrion' : 'invitado'}&modo=${modo}`; },
    // Cerrar al cambiar de página (la reunión sigue).
    soltar() {
      if (cerrado) return;
      cerrado = true; clearTimeout(tHuerfana); clearTimeout(tPend);
      quitar.forEach((f) => f());
      onDisconnect(nodo).cancel();
      update(nodo, { online: false, visto: serverTimestamp() }).catch(() => {});
      if (anfitrion === yo.id) { onDisconnect(r(codigo, 'anfitrionOnline')).cancel(); set(r(codigo, 'anfitrionOnline'), false).catch(() => {}); }
    },
    // Salir de verdad de la reunión.
    salir() {
      R.soltar();
      remove(nodo).catch(() => {});
      olvidarReunion();
    }
  };
  addEventListener('pagehide', () => R.soltar());
  return R;
}

// =============================================================
//  PANEL: el botón 👥, la ventana de la sala y el aviso de votación.
//  Lo comparten la tortuga, la cabaña y la pantalla ligera.
//    donde:      'tortuga' | 'cabana' | 'ligera'
//    boton:      dónde poner el botón 👥 (si no es fijo)
//    fijo:       contenedor donde pintar el panel siempre abierto (pantalla ligera)
//    datos():    { clase, x, z } al conectar
//    cabana():   datos públicos de tu cabaña (los ven tus invitados)
//    alConectar(R), alSalir(): para que la página pinte a los demás
//    irA(url):   cambiar de página con su fundido
// =============================================================
const CSS = `
.reu-panel { position: fixed; z-index: 41; top: calc(max(10px, env(safe-area-inset-top)) + 52px); right: 10px; width: min(340px, calc(100vw - 20px)); max-height: calc(100vh - 80px); overflow: auto;
  background: rgba(24,14,10,.95); border: 1px solid rgba(214,160,100,.5); border-radius: 6px; padding: 12px 14px; color: #f1e2c4;
  font: 15px 'IM Fell English', Georgia, serif; box-shadow: 0 12px 30px rgba(0,0,0,.7); display: none; touch-action: auto; user-select: text; }
.reu-panel.abierto { display: block; }
.reu-panel.fijo { position: static; display: block; width: 100%; max-height: none; box-shadow: none; }
.reu-panel h3 { margin: 0 0 6px; font: 20px 'IM Fell English SC', Georgia, serif; }
.reu-panel p { margin: 4px 0 8px; }
.reu-panel .codigo { font: 32px 'IM Fell English SC', Georgia, serif; letter-spacing: .2em; color: #ffd890; }
.reu-panel .nota { font-size: 13px; opacity: .75; }
.reu-panel button, .reu-banda button { font: 15px 'IM Fell English', Georgia, serif; color: #f1e2c4; background: rgba(130,52,40,.85); border: 1px solid #e8b070; border-radius: 4px; padding: 6px 10px; cursor: pointer; }
.reu-panel button.claro, .reu-banda button.claro { background: transparent; border-color: rgba(214,160,100,.45); }
.reu-panel button:disabled { opacity: .45; cursor: default; }
.reu-panel .fila { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0; align-items: center; }
.reu-panel input { font: 20px 'IM Fell English SC', Georgia, serif; letter-spacing: .15em; width: 7em; text-transform: uppercase; background: #f3e7c9; color: #1c120b; border: 1px solid #c9944a; border-radius: 4px; padding: 4px 8px; }
.reu-panel ul { list-style: none; margin: 4px 0 8px; padding: 0; }
.reu-panel li { display: flex; justify-content: space-between; gap: 8px; padding: 3px 0; border-bottom: 1px solid rgba(214,160,100,.15); }
.reu-panel li small { opacity: .7; }
.reu-panel .frases { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.reu-panel .frases button { font-size: 14px; padding: 5px 6px; }
.reu-panel .registro { font-size: 13px; opacity: .85; max-height: 120px; overflow: auto; }
.reu-panel .registro div { padding: 1px 0; }
.reu-panel .error { color: #ff9a80; }
.reu-panel hr { border: 0; border-top: 1px solid rgba(214,160,100,.25); margin: 10px 0; }
.reu-banda { position: fixed; z-index: 42; left: 50%; top: calc(max(10px, env(safe-area-inset-top)) + 54px); transform: translateX(-50%); width: min(520px, calc(100vw - 20px));
  background: radial-gradient(ellipse at 50% 40%, #efdcb2, #c2a87c); color: #1c120b; border: 1px solid #1c120b; padding: 8px 12px; box-shadow: 0 10px 26px rgba(0,0,0,.7);
  font: 16px 'IM Fell English', Georgia, serif; display: none; text-align: center; touch-action: auto; }
.reu-banda.ver { display: block; }
.reu-banda b { color: #7a1a12; }
.reu-banda .fila { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-top: 6px; }
.reu-banda.fija { position: static; transform: none; width: 100%; margin: 0 0 12px; }
`;

export function crearPanel({ donde, boton = null, fijo = null, datos = () => ({}), cabana = () => null, alConectar = () => {}, alSalir = () => {}, irA = (u) => { location.href = u; }, proponer = true }) {
  if (!document.getElementById('css-reunion')) {
    const st = document.createElement('style'); st.id = 'css-reunion'; st.textContent = CSS; document.head.appendChild(st);
  }
  const panel = document.createElement('div');
  panel.className = 'reu-panel' + (fijo ? ' fijo' : '');
  const banda = document.createElement('div');
  banda.className = 'reu-banda' + (fijo ? ' fija' : '');
  if (fijo) { fijo.appendChild(banda); fijo.appendChild(panel); } else { document.body.appendChild(panel); document.body.appendChild(banda); }
  [panel, banda].forEach((el) => ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown', 'keyup'].forEach((t) => el.addEventListener(t, (e) => e.stopPropagation())));

  let R = null, error = '', ocupado = false;
  const registro = [];
  const nombreDe = (id) => (R?.gente()[id]?.nombre) || 'Alguien';

  function anotar(t) { registro.push(t); if (registro.length > 8) registro.shift(); pintar(); }

  async function entrar(opciones) {
    if (ocupado) return;
    ocupado = true; error = ''; pintar();
    try {
      const u = await import('./nube.js').then((m) => m.usuarioListo()).catch(() => null);
      if (!u) throw new Error('Para jugar juntos, entra antes con tu cuenta de Google en el menú del juego.');
      const d = datos();
      R = await conectar({ ...opciones, donde, clase: d.clase, x: d.x ?? 0, z: d.z ?? 5.6, cabana: cabana() });
      R.on('gente', pintar).on('propuesta', pintar).on('juego', pintar)
        .on('error', (e) => { error = e.message; pintar(); })
        .on('frase', (id, texto) => anotar(`<b>${esc(nombreDe(id))}:</b> ${esc(texto)}`))
        .on('gesto', (id, g) => { const x = GESTOS.find((q) => q.id === g); if (x) anotar(`${x.icono} ${esc(nombreDe(id))}`); })
        .on('salida', (modo) => irA(R.urlPartida(modo)));
      alConectar(R);
    } catch (e) { error = e.message; R = null; if (/No hay ninguna|plena partida/.test(e.message)) olvidarReunion(); }
    ocupado = false; pintar();
  }

  function pintarBanda() {
    if (!R) { banda.classList.remove('ver'); return; }
    const p = R.propuesta, gente = Object.values(R.gente());
    if (R.enJuego && !p) {
      banda.innerHTML = `Los demás están en la mazmorra.<div class="fila"><button data-r="unirme">Unirme a la partida</button></div>`;
      banda.classList.add('ver'); return;
    }
    if (!p) { banda.classList.remove('ver'); return; }
    const listos = gente.filter((g) => g.voto === p.n).length, yoListo = R.gente()[R.yo.id]?.voto === p.n;
    const quien = p.de === R.yo.id ? 'Has propuesto' : `<b>${esc(nombreDe(p.de))}</b> propone`;
    banda.innerHTML = `${quien} bajar a <b>${MODOS[p.modo] || p.modo}</b> · ${listos}/${gente.length} listos
      <div class="fila">${yoListo ? '<button class="claro" data-r="no">Ahora no</button>' : '<button data-r="si">¡Listo!</button><button class="claro" data-r="no">Ahora no</button>'}${p.de === R.yo.id || R.soyAnfitrion() ? '<button class="claro" data-r="retirar">Retirar</button>' : ''}</div>
      <div style="font-size:13px;opacity:.75;margin-top:4px">${gente.map((g) => `${g.voto === p.n ? '✓' : '…'} ${esc(g.nombre)}`).join(' · ')}</div>`;
    banda.classList.add('ver');
  }

  function pintar() {
    pintarBanda();
    if (boton) boton.textContent = R ? `👥 ${R.codigo}` : '👥';
    const err = error ? `<p class="error">${esc(error)}</p>` : '';
    if (!R) {
      panel.innerHTML = `<h3>Jugar juntos</h3><p>Abre una sala y pasa el código. Los demás os veréis aquí y bajaréis juntos al libro.</p>
        <div class="fila"><button data-r="abrir" ${ocupado ? 'disabled' : ''}>Abrir sala</button></div>
        <hr><form class="fila" data-r="form"><input maxlength="4" placeholder="CÓDIGO" aria-label="Código de sala" autocomplete="off"><button ${ocupado ? 'disabled' : ''}>Unirse</button></form>${err}
        ${ocupado ? '<p class="nota">Conectando…</p>' : ''}`;
      const inp = panel.querySelector('input');
      inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
      return;
    }
    const gente = Object.values(R.gente()).sort((a, b) => (b.anfitrion - a.anfitrion) || a.nombre.localeCompare(b.nombre));
    const otraVista = donde === 'ligera'
      ? '<button class="claro" data-r="vista" data-v="tortuga">🐢 Ir a Morrandar</button>'
      : '<button class="claro" data-r="vista" data-v="ligera">📖 Esperar en pantalla ligera</button>';
    panel.innerHTML = `<h3>Sala</h3><div class="codigo">${R.codigo}</div><p class="nota">Pasa este código: se entra desde «Unirse» aquí o en el menú del juego.</p>
      <ul>${gente.map((g) => `<li><span>${g.anfitrion ? '★ ' : ''}${esc(g.nombre)}${g.id === R.yo.id ? ' (tú)' : ''}</span><small>${g.online === false ? '…cambiando de sitio' : LUGARES[g.donde] || ''}</small></li>`).join('')}</ul>
      <div class="frases">${FRASES.map((f, i) => `<button data-r="frase" data-i="${i}">${esc(f)}</button>`).join('')}</div>
      <div class="fila">${GESTOS.map((g) => `<button class="claro" data-r="gesto" data-g="${g.id}" title="${g.nombre}">${g.icono}</button>`).join('')}</div>
      ${proponer ? `<hr><p>Proponer bajar al libro:</p><div class="fila"><button data-r="proponer" data-m="infinita">Mazmorra Infinita</button><button data-r="proponer" data-m="historia">Modo Historia</button></div>` : ''}
      ${registro.length ? `<hr><div class="registro">${registro.map((t) => `<div>${t}</div>`).join('')}</div>` : ''}
      <hr><div class="fila">${otraVista}<button class="claro" data-r="salir">Salir de la sala</button></div>${err}`;
  }

  function accion(e) {
    const b = e.target.closest('[data-r]'); if (!b) return;
    const a = b.dataset.r;
    if (a === 'form') return;
    e.preventDefault();
    if (a === 'abrir') return entrar({ crear: true });
    if (!R) return;
    if (a === 'frase') { const t = FRASES[+b.dataset.i]; R.frase(t); }
    if (a === 'gesto') R.gesto(b.dataset.g);
    if (a === 'proponer') { R.proponer(b.dataset.m); if (!fijo) panel.classList.remove('abierto'); }
    if (a === 'si') R.votar(true);
    if (a === 'no') R.votar(false);
    if (a === 'retirar') R.retirarPropuesta();
    if (a === 'unirme') irA(R.urlPartida('infinita'));
    if (a === 'vista') { ponerVista(b.dataset.v); irA(paginaDeVista(b.dataset.v) + '?sala=' + R.codigo); }
    if (a === 'salir') { R.salir(); R = null; registro.length = 0; alSalir(); pintar(); }
  }
  panel.addEventListener('click', accion);
  banda.addEventListener('click', accion);
  panel.addEventListener('submit', (e) => {
    e.preventDefault();
    const c = panel.querySelector('input')?.value.trim().toUpperCase();
    if (c?.length !== 4) { error = 'El código tiene 4 letras.'; return pintar(); }
    entrar({ codigo: c });
  });
  if (boton) {
    boton.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('abierto'); });
    document.addEventListener('pointerdown', (e) => { if (!panel.contains(e.target) && e.target !== boton) panel.classList.remove('abierto'); });
  }
  pintar();

  // Volver a la reunión de esta pestaña, o entrar en la de la dirección.
  const prm = new URLSearchParams(location.search);
  const codigo = (prm.get('sala') || reunionActual() || '').toUpperCase();
  const listo = codigo.length === 4 ? entrar({ codigo }) : Promise.resolve();

  return {
    get R() { return R; },
    listo,
    abrir() { panel.classList.add('abierto'); },
    pintar,
    error(t) { error = t; pintar(); }
  };
}
