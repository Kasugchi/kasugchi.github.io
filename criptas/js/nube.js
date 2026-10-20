// =============================================================
//  NUBE: partidas guardadas en Firestore, con cuenta de Google.
//
//  usuarios/{uid}                 { nombre, email, ultimaVez }
//  usuarios/{uid}/partidas/{id}   { id, modo, codigo, resumen, actualizada, estado (texto JSON) }
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
  getFirestore, doc, setDoc, getDocs, deleteDoc, collection
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
    const registro = { id: p.id, modo: p.modo, codigo: p.codigo || null, resumen: p.resumen || null, actualizada: p.actualizada || Date.now(),
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
