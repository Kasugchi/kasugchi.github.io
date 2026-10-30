// =============================================================
//  NUBE: partidas guardadas en Firestore, con cuenta de Google.
//
//  usuarios/{uid}                 { nombre, email, ultimaVez }
//  usuarios/{uid}/partidas/{id}   { id, modo, codigo, resumen, actualizada, estado (texto JSON) }
//  usuarios/{uid}/viajero/ficha   { datos (texto JSON), actualizada }   — la ficha del viajero
//
//  El estado va como texto por lo mismo que en las salas: Firestore no
//  guarda bien listas vacías ni objetos muy anidados, y el motor cuenta
//  con ellos. Si Firestore o el inicio de sesión no están activados en
//  el proyecto, todo falla en silencio y el juego sigue con lo local.
// =============================================================
import { app } from './firebase.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, doc, setDoc, getDoc, getDocs, deleteDoc, collection, collectionGroup, addDoc, query, limit
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const auth = getAuth(app);
const db = getFirestore(app);
let usuario = null;
const oyentes = new Set();

getRedirectResult(auth).catch(() => {});
onAuthStateChanged(auth, (u) => {
  usuario = u;
  if (u) setDoc(doc(db, 'usuarios', u.uid), { nombre: u.displayName || '', email: u.email || '', ultimaVez: Date.now() }, { merge: true }).catch(() => {});
  for (const f of oyentes) f(u);
});

export const alCambiarUsuario = (f) => { oyentes.add(f); f(usuario); return () => oyentes.delete(f); };
export const usuarioActual = () => usuario;
// Espera a que Firebase diga si hay sesión (al cargar la página tarda un momento).
export const usuarioListo = () => auth.authStateReady().then(() => (usuario ||= auth.currentUser));

export async function entrar() {
  const proveedor = new GoogleAuthProvider();
  try { await signInWithPopup(auth, proveedor); }
  catch (e) {
    // Algunos móviles bloquean las ventanas emergentes: entonces, redirección.
    if (/popup/i.test(e.code || '')) return signInWithRedirect(auth, proveedor);
    throw e;
  }
}
export const salir = () => signOut(auth);

// Lista de acceso: permitidos/{correo} en Firestore (la gestiona el panel).
// Si el administrador ha abierto la lista (config/acceso.abierto), entra cualquiera con cuenta de Google.
export async function accesoAbierto() {
  try { return (await getDoc(doc(db, 'config', 'acceso'))).data()?.abierto === true; } catch { return false; }
}
export async function tieneAcceso() {
  if (!usuario?.email) return false;
  if (await accesoAbierto()) return true;
  const r = await getDoc(doc(db, 'permitidos', usuario.email.toLowerCase()));
  return r.exists();
}
// Solicitudes de acceso: solicitudes/{correo}; el panel las acepta o rechaza.
export async function haSolicitado() {
  if (!usuario?.email) return false;
  return (await getDoc(doc(db, 'solicitudes', usuario.email.toLowerCase()))).exists();
}
export function solicitarAcceso() {
  return setDoc(doc(db, 'solicitudes', usuario.email.toLowerCase()), { email: usuario.email.toLowerCase(), nombre: usuario.displayName || '', fecha: Date.now() });
}

const coleccion = () => collection(db, 'usuarios', usuario.uid, 'partidas');

// Guardar con calma: como mucho una escritura cada 15 s por partida,
// y enseguida cuando se pide (al cambiar de fase o al salir de la página).
const pendientes = new Map();
const temporizadores = new Map();
export function subir(p, ya = false) {
  if (!usuario || !p?.estado) return;
  pendientes.set(p.id, p);
  if (ya) return vaciar(p.id);
  if (!temporizadores.has(p.id)) temporizadores.set(p.id, setTimeout(() => vaciar(p.id), 15000));
}
export function vaciar(id) {
  const ids = id ? [id] : [...pendientes.keys()];
  return Promise.all(ids.map((k) => {
    clearTimeout(temporizadores.get(k)); temporizadores.delete(k);
    const p = pendientes.get(k); pendientes.delete(k);
    if (!p || !usuario) return null;
    const registro = { id: p.id, modo: p.modo, codigo: p.codigo || null, mundo: p.mundo || 'm1', resumen: p.resumen || null, actualizada: p.actualizada || Date.now(),
      estado: typeof p.estado === 'string' ? p.estado : JSON.stringify(p.estado) };
    return setDoc(doc(coleccion(), k), registro).catch((e) => console.warn('No se pudo guardar en la nube:', e.message));
  }));
}

export async function listar() {
  if (!usuario) return [];
  const r = await getDocs(coleccion());
  return r.docs.map((d) => {
    const x = d.data();
    let estado = null;
    try { estado = JSON.parse(x.estado); } catch { estado = null; }
    return { ...x, estado };
  });
}
export async function borrarNube(id) {
  if (!usuario) return;
  try { await deleteDoc(doc(coleccion(), id)); } catch (e) { console.warn(e.message); }
}

// ---------- Ficha del viajero ----------
// Una por mundo: el primero es «ficha» (como siempre); los demás, con el id del mundo.
const docFicha = (mundo) => doc(db, 'usuarios', usuario.uid, 'viajero', !mundo || mundo === 'm1' ? 'ficha' : mundo);
export async function leerFichaNube(mundo) {
  if (!usuario) return null;
  try { const r = await getDoc(docFicha(mundo || leerMundoActivo())); return r.exists() ? JSON.parse(r.data().datos) : null; }
  catch (e) { console.warn('No se pudo leer la ficha de la nube:', e.message); return null; }
}
const leerMundoActivo = () => { try { return JSON.parse(localStorage.getItem('criptas_mundos'))?.activo || 'm1'; } catch { return 'm1'; } };
// La lista de mundos también viaja con la cuenta.
export async function leerMundosNube() {
  if (!usuario) return null;
  try { const r = await getDoc(doc(db, 'usuarios', usuario.uid, 'viajero', 'mundos')); return r.exists() ? JSON.parse(r.data().datos) : null; }
  catch (e) { console.warn('No se pudieron leer los mundos:', e.message); return null; }
}
export function subirMundos(m) {
  if (!usuario || !m) return;
  setDoc(doc(db, 'usuarios', usuario.uid, 'viajero', 'mundos'), { datos: JSON.stringify(m), actualizada: Date.now() }).catch((e) => console.warn('No se pudieron guardar los mundos:', e.message));
}
let fichaPendiente = null, tFicha = null;
export function subirFicha(f, ya = false) {
  if (!usuario || !f) return;
  fichaPendiente = f;
  clearTimeout(tFicha);
  tFicha = setTimeout(() => {
    const x = fichaPendiente; fichaPendiente = null;
    if (x && usuario) setDoc(docFicha(x.mundo), { datos: JSON.stringify(x), actualizada: x.actualizada || Date.now() }).catch((e) => console.warn('No se pudo guardar la ficha:', e.message));
  }, ya ? 0 : 4000);
}

// ---------- Actividad y errores (para el panel) ----------
//  usuarios/{uid}/actividad/{auto}  { tipo: 'mision' | 'entrada', fecha, … }
//  usuarios/{uid}/errores/{auto}    { mensaje, donde, pila, fecha, version }
const sinUsuario = () => !usuario && !auth.currentUser;
const uidAhora = () => (usuario || auth.currentUser).uid;
export function registrarActividad(ev) {
  if (sinUsuario() || !ev) return;
  addDoc(collection(db, 'usuarios', uidAhora(), 'actividad'), JSON.parse(JSON.stringify(ev))).catch(() => {});
}
const errVistos = new Set();
export function registrarError(mensaje, donde = '', pila = '') {
  if (sinUsuario() || !mensaje || errVistos.size >= 5 || errVistos.has(mensaje)) return;
  errVistos.add(mensaje);
  const version = document.querySelector('meta[name="version"]')?.content || '';
  addDoc(collection(db, 'usuarios', uidAhora(), 'errores'), {
    mensaje: String(mensaje).slice(0, 300), donde: String(donde).slice(0, 200), pila: String(pila || '').slice(0, 1200),
    pagina: location.pathname.split('/').pop() || 'index.html', fecha: Date.now(), version, navegador: navigator.userAgent.slice(0, 160)
  }).catch(() => {});
}
// Los fallos de la página, a la nube (como mucho 5 distintos por visita).
export function vigilarErrores() {
  addEventListener('error', (e) => registrarError(e.message, (e.filename || '').split('/').pop() + ':' + e.lineno, e.error?.stack));
  addEventListener('unhandledrejection', (e) => registrarError(e.reason?.message || String(e.reason), 'promesa', e.reason?.stack));
}
// Anuncio para todos en la portada (lo escribe el panel en config/anuncio).
export async function leerAnuncio() {
  try { const d = (await getDoc(doc(db, 'config', 'anuncio'))).data(); return d?.texto ? d : null; } catch { return null; }
}

// ¿Es la cuenta del administrador? Solo él puede leer las partidas de todos (lo dicen las
// reglas de Firestore, para el panel), así que se prueba a leer una: si deja, es él.
export async function esAdmin() {
  if (sinUsuario()) return false;
  try { await getDocs(query(collectionGroup(db, 'partidas'), limit(1))); return true; } catch { return false; }
}
