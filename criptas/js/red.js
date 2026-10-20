// =============================================================
//  RED: salas con código sobre Firebase Realtime Database
//
//  Cada sala vive en /salas/CODIGO:
//    anfitrion        id del jugador que ejecuta las reglas
//    anfitrionOnline  true mientras su navegador está conectado
//    sala             JSON de la sala de espera (texto)
//    estado           JSON de la partida (texto)
//    jugadores/ID     { nombre, online }
//    acciones/PUSH    { de, msg }  (los invitados escriben, el anfitrión consume)
//    errores/ID       { texto, n } (respuestas del anfitrión a un invitado)
//
//  El estado se guarda como texto JSON porque Firebase borra las
//  listas y objetos vacíos (y el motor cuenta con ellos).
//
//  Presencia: un móvil pierde la conexión a menudo (pantalla bloqueada,
//  cambio de app, cobertura). Firebase avisa con /.info/connected; cada
//  vez que vuelve, se marca otra vez como conectado y se reprograma el
//  aviso de desconexión.
// =============================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getDatabase, ref, get, set, update, remove, push, onValue, onChildAdded,
  onDisconnect, serverTimestamp, off
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

// Esta configuración es pública por diseño: identifica el proyecto, no da permisos.
// Lo que protege los datos son las reglas de seguridad de la base de datos.
const firebaseConfig = {
  apiKey: 'AIzaSyDfmvjGRPhUzR2b90yjzpq8Bg9llYclmds',
  authDomain: 'kasugchi.firebaseapp.com',
  databaseURL: 'https://kasugchi-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'kasugchi',
  storageBucket: 'kasugchi.firebasestorage.app',
  messagingSenderId: '1017762951602',
  appId: '1:1017762951602:web:3f11670c7dbf6f91cdb4ab'
};

const db = getDatabase(initializeApp(firebaseConfig));
const conectado = ref(db, '.info/connected');
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const nuevoCodigo = () => Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');
const raiz = (codigo, ruta = '') => ref(db, 'salas/' + codigo + (ruta ? '/' + ruta : ''));
const leerJSON = (t) => { try { return typeof t === 'string' ? JSON.parse(t) : null; } catch { return null; } };

function traducirError(e) {
  if (String(e?.code || e?.message).includes('PERMISSION_DENIED')) return new Error('La base de datos ha rechazado la conexión. Revisa las reglas en Firebase.');
  return new Error('No se pudo conectar con el servidor de partidas. Revisa tu conexión.');
}

// Marca "conectado" cada vez que hay conexión, y "desconectado" al perderla.
function presencia(refMarca, valorOn, valorOff, usarUpdate) {
  const escuchar = (snap) => {
    if (snap.val() !== true) return;
    const od = onDisconnect(refMarca);
    (usarUpdate ? od.update(valorOff) : od.set(valorOff))
      .then(() => (usarUpdate ? update(refMarca, valorOn) : set(refMarca, valorOn)))
      .catch(() => {});
  };
  onValue(conectado, escuchar);
  return () => { off(conectado, 'value', escuchar); onDisconnect(refMarca).cancel(); };
}

// Error especial: la sala sigue teniendo un anfitrión conectado.
export class SalaOcupada extends Error { constructor(m) { super(m); this.name = 'SalaOcupada'; } }

// ---------- Anfitrión ----------
// eventos: alConectar(id, nombre), alMensaje(id, msg), alSalir(id), alPerderSala()
// opciones.codigo: volver a abrir una sala existente.
export async function crearSala(idAnfitrion, eventos, opciones = {}) {
  let codigo = opciones.codigo;
  try {
    if (!codigo) {
      for (let i = 0; i < 6; i++) {
        const c = nuevoCodigo();
        const snap = await get(raiz(c, 'anfitrionOnline'));
        if (snap.val() !== true) { codigo = c; break; }
      }
      if (!codigo) throw new Error('No hay códigos libres, inténtalo otra vez.');
      await set(raiz(codigo), { anfitrion: idAnfitrion, anfitrionOnline: true, creada: serverTimestamp() });
    } else {
      const info = (await get(raiz(codigo))).val() || {};
      // Si otro jugador ya lleva la partida y está conectado, no se la quitamos.
      if (info.anfitrion && info.anfitrion !== idAnfitrion && info.anfitrionOnline === true && !opciones.forzar) {
        throw new SalaOcupada('Otro jugador ya lleva esta partida.');
      }
      await update(raiz(codigo), { anfitrion: idAnfitrion, anfitrionOnline: true });
    }
  } catch (e) {
    if (e instanceof SalaOcupada || e.message?.startsWith('No hay')) throw e;
    throw traducirError(e);
  }

  let cerrada = false;
  const quitarPresencia = presencia(raiz(codigo, 'anfitrionOnline'), true, false, false);

  // Si otro jugador toma el control, este navegador deja de ser anfitrión.
  const refAnf = raiz(codigo, 'anfitrion');
  onValue(refAnf, (snap) => {
    const v = snap.val();
    if (!cerrada && v && v !== idAnfitrion) { sala.cerrar(true); eventos.alPerderSala?.(); }
  });

  // Presencia de los invitados.
  const conocidos = new Map(); // id -> online
  const refJug = raiz(codigo, 'jugadores');
  onValue(refJug, (snap) => {
    const todos = snap.val() || {};
    for (const [id, j] of Object.entries(todos)) {
      if (id === idAnfitrion) continue;
      const antes = conocidos.get(id);
      if (j.online && antes !== true) eventos.alConectar(id, String(j.nombre || 'Aventurero').slice(0, 24));
      if (!j.online && antes === true) eventos.alSalir(id);
      conocidos.set(id, !!j.online);
    }
  });

  // Mensajes de los invitados: se procesan y se borran.
  const refAcc = raiz(codigo, 'acciones');
  onChildAdded(refAcc, (snap) => {
    const { de, msg } = snap.val() || {};
    remove(snap.ref);
    const m = leerJSON(msg);
    if (!cerrada && de && m && conocidos.get(de)) eventos.alMensaje(de, m);
  });

  const sala = {
    codigo,
    enviar(id, msg) { if (!cerrada && msg.t === 'error') set(raiz(codigo, 'errores/' + id), { texto: msg.texto, n: Date.now() }); },
    difundir(msg) {
      if (cerrada) return;
      if (msg.t === 'sala') set(raiz(codigo, 'sala'), JSON.stringify(msg.sala));
      if (msg.t === 'estado') set(raiz(codigo, 'estado'), JSON.stringify(msg.estado));
    },
    // relevado = otro jugador ya es el anfitrión: no tocar su marca de conexión.
    cerrar(relevado = false) {
      if (cerrada) return;
      cerrada = true;
      off(refJug); off(refAcc); off(refAnf);
      quitarPresencia();
      if (!relevado) set(raiz(codigo, 'anfitrionOnline'), false);
    }
  };
  return sala;
}

// ---------- Invitado ----------
// eventos: alMensaje(msg), alAnfitrion(online)
export async function unirseSala(codigo, idJugador, nombre, eventos) {
  codigo = codigo.toUpperCase();
  let info;
  try { info = (await get(raiz(codigo))).val(); } catch (e) { throw traducirError(e); }
  if (!info || !info.anfitrion) throw new Error('No hay ninguna sala con el código ' + codigo + '.');

  const yo = raiz(codigo, 'jugadores/' + idJugador);
  await set(yo, { nombre, online: true });
  const quitarPresencia = presencia(yo, { nombre, online: true }, { online: false }, true);

  const refs = [raiz(codigo, 'sala'), raiz(codigo, 'estado'), raiz(codigo, 'errores/' + idJugador), raiz(codigo, 'anfitrionOnline')];
  let ultimoError = Date.now();
  onValue(refs[0], (s) => { const v = leerJSON(s.val()); if (v) eventos.alMensaje({ t: 'sala', sala: v }); });
  onValue(refs[1], (s) => { const v = leerJSON(s.val()); if (v) eventos.alMensaje({ t: 'estado', estado: v }); });
  onValue(refs[2], (s) => { const v = s.val(); if (v && v.n > ultimoError) { ultimoError = v.n; eventos.alMensaje({ t: 'error', texto: v.texto }); } });
  onValue(refs[3], (s) => eventos.alAnfitrion(s.val() === true));

  return {
    codigo,
    hayPartida: !!info.estado,
    anfitrionOnline: info.anfitrionOnline === true,
    estadoGuardado: () => get(raiz(codigo, 'estado')).then((s) => leerJSON(s.val())),
    anfitrionSigue: () => get(raiz(codigo, 'anfitrionOnline')).then((s) => s.val() === true),
    enviar(msg) { push(raiz(codigo, 'acciones'), { de: idJugador, msg: JSON.stringify(msg) }); },
    cerrar() {
      for (const r of refs) off(r);
      quitarPresencia();
      update(yo, { online: false });
    }
  };
}
