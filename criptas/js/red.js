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
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const nuevoCodigo = () => Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');
const raiz = (codigo, ruta = '') => ref(db, 'salas/' + codigo + (ruta ? '/' + ruta : ''));
const leerJSON = (t) => { try { return typeof t === 'string' ? JSON.parse(t) : null; } catch { return null; } };

function traducirError(e) {
  if (String(e?.code || e?.message).includes('PERMISSION_DENIED')) return new Error('La base de datos ha rechazado la conexión. Revisa las reglas en Firebase.');
  return new Error('No se pudo conectar con el servidor de partidas. Revisa tu conexión.');
}

// ---------- Anfitrión ----------
// eventos: alConectar(id, nombre), alMensaje(id, msg), alSalir(id)
// opciones.codigo + opciones.retomar: volver a abrir una sala existente.
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
      await update(raiz(codigo), { anfitrion: idAnfitrion, anfitrionOnline: true });
    }
  } catch (e) { throw e.message?.startsWith('No hay') ? e : traducirError(e); }

  onDisconnect(raiz(codigo, 'anfitrionOnline')).set(false);

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
    if (de && m && conocidos.get(de)) eventos.alMensaje(de, m);
  });

  return {
    codigo,
    enviar(id, msg) { if (msg.t === 'error') set(raiz(codigo, 'errores/' + id), { texto: msg.texto, n: Date.now() }); },
    difundir(msg) {
      if (msg.t === 'sala') set(raiz(codigo, 'sala'), JSON.stringify(msg.sala));
      if (msg.t === 'estado') set(raiz(codigo, 'estado'), JSON.stringify(msg.estado));
    },
    cerrar() {
      off(refJug); off(refAcc);
      set(raiz(codigo, 'anfitrionOnline'), false);
      onDisconnect(raiz(codigo, 'anfitrionOnline')).cancel();
    }
  };
}

// ---------- Invitado ----------
// eventos: alMensaje(msg), alAnfitrion(online, sala) cuando el anfitrión se cae o vuelve
export async function unirseSala(codigo, idJugador, nombre, eventos) {
  codigo = codigo.toUpperCase();
  let info;
  try { info = (await get(raiz(codigo))).val(); } catch (e) { throw traducirError(e); }
  if (!info || !info.anfitrion) throw new Error('No hay ninguna sala con el código ' + codigo + '.');

  const yo = raiz(codigo, 'jugadores/' + idJugador);
  await set(yo, { nombre, online: true });
  onDisconnect(yo).update({ online: false });

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
    enviar(msg) { push(raiz(codigo, 'acciones'), { de: idJugador, msg: JSON.stringify(msg) }); },
    cerrar() {
      for (const r of refs) off(r);
      update(yo, { online: false });
      onDisconnect(yo).cancel();
    }
  };
}
