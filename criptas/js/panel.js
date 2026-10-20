// =============================================================
//  PANEL DE ADMINISTRACIÓN: partidas y estadísticas de todos.
//  Solo funciona con la cuenta que las reglas de Firestore
//  marcan como administradora; con cualquier otra, Firestore
//  rechaza la lectura y el panel lo dice.
// =============================================================
import { app } from './firebase.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, collectionGroup, getDocs, doc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getDatabase, ref, set, remove } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
// En la base de datos de salas, las claves no admiten puntos: se cambian por comas.
const claveCorreo = (e) => e.toLowerCase().replace(/\./g, ',');
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fecha = (t) => (t ? new Date(t).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

$('#b-entrar').addEventListener('click', async () => {
  const p = new GoogleAuthProvider();
  try { await signInWithPopup(auth, p); } catch (e) { if (/popup/i.test(e.code || '')) signInWithRedirect(auth, p); }
});
$('#b-salir').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (u) => onCambio(u));
async function onCambio(u) {
  $('#b-entrar').hidden = !!u; $('#b-salir').hidden = !u;
  $('#quien').textContent = u ? u.email : '';
  if (!u) return;
  $('#contenido').innerHTML = '<section><p class="nota">Cargando…</p></section>';
  try {
    const [usuarios, partidas, permitidos, solicitudes] = await Promise.all([getDocs(collection(db, 'usuarios')), getDocs(collectionGroup(db, 'partidas')), getDocs(collection(db, 'permitidos')), getDocs(collection(db, 'solicitudes'))]);
    pintar(solicitudes.docs.map((d) => ({ email: d.id, ...d.data() })), permitidos.docs.map((d) => d.id), usuarios.docs.map((d) => ({ uid: d.id, ...d.data() })), partidas.docs.map((d) => {
      const x = d.data();
      let estado = null; try { estado = JSON.parse(x.estado); } catch { /* partida dañada */ }
      return { ...x, uid: d.ref.parent.parent.id, estado };
    }));
  } catch (e) {
    $('#contenido').innerHTML = `<section><p class="error">No tienes permiso para ver el panel con esta cuenta (${esc(e.code || e.message)}).</p></section>`;
  }
}

function pintar(solicitudes, permitidos, usuarios, partidas) {
  const nombre = Object.fromEntries(usuarios.map((u) => [u.uid, u.nombre || u.email || u.uid.slice(0, 6)]));
  // Una partida multijugador aparece una vez por jugador: contar cada una solo una vez.
  const unicas = new Map();
  for (const p of partidas) { const k = p.codigo ? 'sala-' + p.codigo : p.uid + ':' + p.id; if (!unicas.has(k) || p.actualizada > unicas.get(k).actualizada) unicas.set(k, p); }
  const lista = [...unicas.values()].sort((a, b) => (b.actualizada || 0) - (a.actualizada || 0));

  // Estadísticas a partir de la crónica de cada partida.
  const t = { misiones: 0, victorias: 0, derrotas: 0, oro: 0, tesoros: 0, monstruos: {}, pisoMax: 0, nivelMax: 0 };
  for (const p of lista) {
    const c = p.estado?.cronica?.campana;
    if (c) {
      t.misiones += c.misiones || 0; t.victorias += c.victorias || 0; t.derrotas += c.derrotas || 0;
      t.oro += c.oro || 0; t.tesoros += c.tesoros || 0;
      for (const [k, n] of Object.entries(c.monstruos || {})) t.monstruos[k] = (t.monstruos[k] || 0) + n;
    }
    if (p.estado?.aleatorio) t.pisoMax = Math.max(t.pisoMax, (p.estado.caida?.piso || p.estado.misionIdx + 1));
    for (const h of Object.values(p.estado?.heroes || {})) t.nivelMax = Math.max(t.nivelMax, h.nivel || 1);
  }
  const muertes = Object.entries(t.monstruos).sort((a, b) => b[1] - a[1]);
  const maxM = muertes[0]?.[1] || 1;
  const cifra = (n, txt) => `<div class="cifra"><b>${n}</b><span>${txt}</span></div>`;
  const modo = (p) => (p.estado?.aleatorio ? 'Infinita' : p.estado?.pruebas ? 'Pruebas' : 'Historia') + (p.codigo ? ' · sala ' + p.codigo : ' · solo');

  $('#contenido').innerHTML = `
    <section><h2>Solicitudes de acceso${solicitudes.length ? ' (' + solicitudes.length + ')' : ''}</h2>
      <table>${solicitudes.sort((a, b) => (b.fecha || 0) - (a.fecha || 0)).map((s) => `<tr><td><b>${esc(s.nombre || '')}</b> ${esc(s.email)}</td><td>${fecha(s.fecha)}</td><td class="num"><button data-aceptar="${esc(s.email)}">Aceptar</button> <button class="claro" style="color:var(--lacre);border-color:var(--lacre)" data-rechazar="${esc(s.email)}">Rechazar</button></td></tr>`).join('') || '<tr><td class="nota">No hay solicitudes pendientes.</td></tr>'}</table>
    </section>
    <section><h2>Acceso</h2>
      <p class="nota">Solo estas cuentas de Google pueden jugar. Añade el correo con el que entra cada uno.</p>
      <form id="f-permitir" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <input id="correo-nuevo" type="email" required placeholder="correo@gmail.com" style="flex:1 1 220px;padding:8px;border-radius:6px;border:1px solid var(--linea);font:inherit">
        <button>Dar acceso</button>
      </form>
      <table>${permitidos.sort().map((e) => `<tr><td>${esc(e)}</td><td class="num"><button class="claro" style="color:var(--lacre);border-color:var(--lacre)" data-quitar="${esc(e)}">Quitar</button></td></tr>`).join('') || '<tr><td class="nota">Nadie todavía. Empieza por tu propio correo.</td></tr>'}</table>
    </section>
    <section><h2>Resumen</h2><div class="cifras">
      ${cifra(usuarios.length, 'jugadores con cuenta')}
      ${cifra(lista.length, 'partidas')}
      ${cifra(t.misiones, 'misiones jugadas')}
      ${cifra(t.victorias, 'victorias')}
      ${cifra(muertes.reduce((s, [, n]) => s + n, 0), 'monstruos abatidos')}
      ${cifra(t.oro, 'monedas ganadas')}
      ${cifra(t.pisoMax || '—', 'piso más hondo (Infinita)')}
      ${cifra(t.nivelMax, 'nivel de héroe más alto')}
    </div></section>
    <section><h2>Partidas</h2><table>
      <tr><th>Jugador</th><th>Héroes</th><th>Modo</th><th>Dónde van</th><th>Última vez</th></tr>
      ${lista.map((p) => `<tr><td>${esc(nombre[p.uid] || '?')}</td><td>${esc(p.resumen?.heroes)}</td><td>${esc(modo(p))}</td><td>${esc(p.resumen?.mision)}${p.estado?.caida ? ' · <b>caídos</b>' : ''}</td><td>${fecha(p.actualizada)}</td></tr>`).join('')}
    </table></section>
    <section><h2>Monstruos abatidos</h2><table>
      ${muertes.map(([k, n]) => `<tr><td>${esc(k)}</td><td class="num">${n}</td><td style="width:60%"><div class="barra"><i style="width:${Math.round((n / maxM) * 100)}%"></i></div></td></tr>`).join('') || '<tr><td class="nota">Todavía nada.</td></tr>'}
    </table></section>
    <section><h2>Jugadores</h2><table>
      <tr><th>Nombre</th><th>Correo</th><th class="num">Partidas</th><th>Última vez</th></tr>
      ${usuarios.sort((a, b) => (b.ultimaVez || 0) - (a.ultimaVez || 0)).map((u) => `<tr><td>${esc(u.nombre)}</td><td>${esc(u.email)}</td><td class="num">${partidas.filter((p) => p.uid === u.uid).length}</td><td>${fecha(u.ultimaVez)}</td></tr>`).join('')}
    </table></section>`;
  const permitir = async (correo) => {
    await setDoc(doc(db, 'permitidos', correo), { fecha: Date.now() });
    await set(ref(rtdb, 'permitidos/' + claveCorreo(correo)), true);
    await deleteDoc(doc(db, 'solicitudes', correo)).catch(() => {});
  };
  $('#f-permitir').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const correo = $('#correo-nuevo').value.trim().toLowerCase();
    if (!correo) return;
    try { await permitir(correo); recargar(); } catch (e) { alert('No se pudo dar acceso: ' + (e.code || e.message)); }
  });
  document.querySelectorAll('[data-aceptar]').forEach((b) => b.addEventListener('click', async () => {
    try { await permitir(b.dataset.aceptar); recargar(); } catch (e) { alert('No se pudo aceptar: ' + (e.code || e.message)); }
  }));
  document.querySelectorAll('[data-rechazar]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('¿Rechazar la solicitud de ' + b.dataset.rechazar + '?')) return;
    try { await deleteDoc(doc(db, 'solicitudes', b.dataset.rechazar)); recargar(); } catch (e) { alert('No se pudo rechazar: ' + (e.code || e.message)); }
  }));
  document.querySelectorAll('[data-quitar]').forEach((b) => b.addEventListener('click', async () => {
    const correo = b.dataset.quitar;
    if (!confirm('¿Quitar el acceso a ' + correo + '?')) return;
    try {
      await deleteDoc(doc(db, 'permitidos', correo));
      await remove(ref(rtdb, 'permitidos/' + claveCorreo(correo)));
      recargar();
    } catch (e) { alert('No se pudo quitar: ' + (e.code || e.message)); }
  }));
}
const recargar = () => onCambio(auth.currentUser);
