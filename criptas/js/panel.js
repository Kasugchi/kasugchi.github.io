// =============================================================
//  PANEL DE ADMINISTRACIÓN: partidas y estadísticas de todos.
//  Solo funciona con la cuenta que las reglas de Firestore
//  marcan como administradora; con cualquier otra, Firestore
//  rechaza la lectura y el panel lo dice.
// =============================================================
import { app } from './firebase.js';
import { RANGOS } from './pueblo.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, collectionGroup, getDocs, getDoc, doc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
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
  // Cada lectura por separado: si una falla, se ve cuál y el resto se pinta igual.
  const fallos = [];
  const leerCol = (nombre, q) => getDocs(q).then((r) => r.docs).catch((e) => { fallos.push(nombre + ': ' + (e.code || e.message)); return []; });
  const [usuarios, partidas, permitidos, solicitudes, config, viajeros, actividad, errores, anuncio] = await Promise.all([
    leerCol('usuarios', collection(db, 'usuarios')), leerCol('partidas', collectionGroup(db, 'partidas')),
    leerCol('permitidos', collection(db, 'permitidos')), leerCol('solicitudes', collection(db, 'solicitudes')),
    getDoc(doc(db, 'config', 'acceso')).then((d) => d.data() || {}).catch((e) => { fallos.push('config: ' + (e.code || e.message)); return {}; }),
    leerCol('viajeros', collectionGroup(db, 'viajero')), leerCol('actividad', collectionGroup(db, 'actividad')), leerCol('errores', collectionGroup(db, 'errores')),
    getDoc(doc(db, 'config', 'anuncio')).then((d) => d.data() || null).catch(() => null)]);
  abierta = config.abierto === true;
  if (fallos.length >= 7) {
    $('#contenido').innerHTML = `<section><p class="error">No tienes permiso para ver el panel con esta cuenta (${esc(fallos[0])}).</p></section>`;
    return;
  }
  try {
    pintar(solicitudes.map((d) => ({ email: d.id, ...d.data() })), permitidos.map((d) => d.id), usuarios.map((d) => ({ uid: d.id, ...d.data() })), partidas.map((d) => {
      const x = d.data();
      let estado = null; try { estado = JSON.parse(x.estado); } catch { /* partida dañada */ }
      return { ...x, uid: d.ref.parent.parent.id, estado };
    }));
    pintarActividad({
      usuarios: usuarios.map((d) => ({ uid: d.id, ...d.data() })),
      viajeros: viajeros.map((d) => { let datos = null; try { datos = JSON.parse(d.data().datos); } catch { /* dañado */ } return { uid: d.ref.parent.parent.id, id: d.id, datos }; }),
      actividad: actividad.map((d) => ({ uid: d.ref.parent.parent.id, ...d.data() })),
      errores: errores.map((d) => ({ uid: d.ref.parent.parent.id, ref: d.ref, ...d.data() })),
      anuncio
    });
    if (fallos.length) $('#contenido').insertAdjacentHTML('afterbegin', `<section><p class="error">Algunas lecturas fallaron (revisa las reglas de Firestore): ${esc(fallos.join(' · '))}</p></section>`);
  } catch (e) {
    $('#contenido').innerHTML = `<section><p class="error">No tienes permiso para ver el panel con esta cuenta (${esc(e.code || e.message)}).</p></section>`;
  }
}

let abierta = false;
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
      <div class="interruptor">
        <div><b>Lista de acceso: ${abierta ? 'abierta' : 'cerrada'}</b>
          <p class="nota" style="margin:2px 0 0">${abierta ? 'Puede jugar cualquiera que entre con su cuenta de Google. La lista de abajo se guarda para cuando la vuelvas a cerrar.' : 'Solo pueden jugar las cuentas de la lista. Los demás pueden pedir acceso.'}</p></div>
        <button id="b-abrir" class="${abierta ? 'claro' : ''}" style="${abierta ? 'color:var(--lacre);border-color:var(--lacre)' : ''}">${abierta ? 'Cerrar la lista' : 'Abrir a todos'}</button>
      </div>
      <p class="nota">${abierta ? 'Mientras está abierta, estas cuentas siguen apuntadas:' : 'Solo estas cuentas de Google pueden jugar. Añade el correo con el que entra cada uno.'}</p>
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
  $('#b-abrir').addEventListener('click', async () => {
    const nuevo = !abierta;
    if (!confirm(nuevo ? '¿Abrir el juego a cualquiera con cuenta de Google?' : '¿Cerrar la lista? Solo podrán jugar las cuentas apuntadas.')) return;
    try {
      await setDoc(doc(db, 'config', 'acceso'), { abierto: nuevo, fecha: Date.now() });
      await set(ref(rtdb, 'config/abierto'), nuevo);
      recargar();
    } catch (e) { alert('No se pudo cambiar (¿has publicado las reglas nuevas en Firebase?): ' + (e.code || e.message)); }
  });
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

// =============================================================
//  ACTIVIDAD: cuándo se juega, qué pasa, cómo van las tortugas.
//  Se pinta encima de lo demás. Las misiones de antes de que existiera
//  el registro salen igual en el gráfico (de las fichas: «registradas»).
// =============================================================
const DIA = 864e5;
const COLORES = ['#3a6ab0', '#c0612b', '#2f8a5b', '#8a4fb0', '#b0943a', '#b03a5a', '#3a9aa8', '#6a6a6a'];
const RANGO = (fama) => RANGOS.filter((r) => fama >= r.fama).pop()?.nombre || '—';
const diaDe = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const hace = (t) => { if (!t) return '—'; const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`; };
const CLASE = { barbaro: 'bárbaro', enano: 'enano', elfo: 'elfo', mago: 'mago' };
const MODO = { infinita: 'Infinita', historia: 'Historia', limbo: 'Limbo', pruebas: 'Pruebas' };

function pintarActividad({ usuarios, viajeros, actividad, errores, anuncio }) {
  const nombre = Object.fromEntries(usuarios.map((u) => [u.uid, u.nombre?.split(' ')[0] || u.email || u.uid.slice(0, 6)]));
  const uids = [...new Set(usuarios.map((u) => u.uid))];
  const color = Object.fromEntries(uids.map((u, i) => [u, COLORES[i % COLORES.length]]));
  const ahora = Date.now(), hoy = diaDe(ahora);

  // Mundos de cada uno (doc «mundos») y fichas (una por mundo).
  const nombresMundo = {};
  for (const v of viajeros) if (v.id === 'mundos') for (const m of v.datos?.lista || []) nombresMundo[v.uid + ':' + m.id] = m.nombre;
  const fichas = viajeros.filter((v) => v.id !== 'mundos' && v.datos).map((v) => ({ uid: v.uid, mundo: v.id === 'ficha' ? 'm1' : v.id, f: v.datos }));

  // Misiones con fecha: las de las fichas (todas) para contar; las del registro para el detalle.
  const misiones = [];
  for (const { uid, f } of fichas) for (const t of Object.values(f.registradas || {})) if (typeof t === 'number') misiones.push({ uid, fecha: t });
  const eventos = actividad.filter((a) => a.fecha).sort((a, b) => b.fecha - a.fecha);
  const entradas = eventos.filter((a) => a.tipo === 'entrada');
  const ultima = {};
  for (const x of [...misiones, ...eventos]) ultima[x.uid] = Math.max(ultima[x.uid] || 0, x.fecha);
  for (const u of usuarios) ultima[u.uid] = Math.max(ultima[u.uid] || 0, u.ultimaVez || 0);

  const activos = (dias) => uids.filter((u) => ultima[u] >= ahora - dias * DIA).length;
  const ultimos7 = misiones.filter((m) => m.fecha >= ahora - 7 * DIA);

  // ---- Gráfico: misiones por día, 30 días, apiladas por jugador ----
  const N = 30, W = 720, H = 170, x0 = 28, y0 = 14, ancho = (W - x0 - 8) / N;
  const porDia = Array.from({ length: N }, (_, i) => ({ dia: hoy - (N - 1 - i) * DIA, n: {} }));
  for (const m of misiones) { const i = N - 1 - Math.round((hoy - diaDe(m.fecha)) / DIA); if (i >= 0 && i < N) porDia[i].n[m.uid] = (porDia[i].n[m.uid] || 0) + 1; }
  const maxDia = Math.max(1, ...porDia.map((d) => Object.values(d.n).reduce((s, n) => s + n, 0)));
  const escY = (H - y0 - 22) / maxDia;
  let barras = '';
  porDia.forEach((d, i) => {
    let y = H - 22;
    for (const u of uids) { const n = d.n[u] || 0; if (!n) continue; const h = n * escY; y -= h;
      barras += `<rect x="${(x0 + i * ancho + 1).toFixed(1)}" y="${y.toFixed(1)}" width="${(ancho - 2).toFixed(1)}" height="${h.toFixed(1)}" fill="${color[u]}"><title>${esc(nombre[u])}: ${n} el ${new Date(d.dia).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</title></rect>`; }
    if (i % 5 === 4 || i === N - 1) barras += `<text x="${(x0 + i * ancho + ancho / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="11" fill="#7a6a55">${new Date(d.dia).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</text>`;
  });
  const marcas = [0, Math.ceil(maxDia / 2), maxDia].filter((v, i, a) => a.indexOf(v) === i).map((v) => `<line x1="${x0}" x2="${W - 8}" y1="${H - 22 - v * escY}" y2="${H - 22 - v * escY}" stroke="rgba(80,50,20,.15)"/><text x="${x0 - 6}" y="${H - 18 - v * escY}" text-anchor="end" font-size="11" fill="#7a6a55">${v}</text>`).join('');
  const leyenda = uids.filter((u) => misiones.some((m) => m.uid === u)).map((u) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px"><i style="width:10px;height:10px;border-radius:2px;background:${color[u]};display:inline-block"></i>${esc(nombre[u])}</span>`).join('');
  const grafico = misiones.length ? `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${marcas}${barras}</svg><div class="nota" style="margin-top:4px">${leyenda}</div>` : '<p class="nota">Todavía no hay misiones con fecha.</p>';

  // ---- Mapa de calor: día de la semana × hora ----
  const calor = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const m of misiones) { const d = new Date(m.fecha); calor[(d.getDay() + 6) % 7][d.getHours()]++; }
  const maxC = Math.max(1, ...calor.flat());
  const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const celda = 26, cw = 24 * celda + 30;
  let cal = '';
  calor.forEach((fila, d) => {
    cal += `<text x="10" y="${d * celda + 30}" font-size="11" fill="#7a6a55">${DIAS[d]}</text>`;
    fila.forEach((n, h) => { cal += `<rect x="${30 + h * celda}" y="${d * celda + 14}" width="${celda - 3}" height="${celda - 3}" rx="3" fill="${n ? `rgba(58,106,176,${(0.15 + 0.85 * n / maxC).toFixed(2)})` : 'rgba(80,50,20,.07)'}"><title>${DIAS[d]} ${h}:00 · ${n} misiones</title></rect>`; });
  });
  for (const h of [0, 6, 12, 18, 23]) cal += `<text x="${30 + h * celda + celda / 2}" y="10" text-anchor="middle" font-size="10" fill="#7a6a55">${h}h</text>`;
  const mapaCalor = misiones.length ? `<svg viewBox="0 0 ${cw} ${7 * celda + 18}" style="width:100%;height:auto;display:block">${cal}</svg>` : '';

  // ---- Últimos sucesos ----
  const frase = (a) => {
    const quien = `<b style="color:${color[a.uid] || 'inherit'}">${esc(nombre[a.uid] || '?')}</b>`;
    if (a.tipo === 'entrada') return `${quien} entró en ${a.donde === 'tortuga' ? 'Morrandar 🐢' : 'el juego'}`;
    const con = (a.heroes || []).map((h) => `${esc(h.nombre)} (${CLASE[h.tipo] || h.tipo} ${h.nivel})`).join(', ');
    const donde = a.modo === 'infinita' ? `el piso ${a.numero}` : a.modo === 'limbo' ? 'el rescate del Limbo' : `«${esc(a.titulo || 'misión ' + a.numero)}»`;
    let t = `${quien} ${a.resultado === 'victoria' ? 'superó' : 'cayó en'} ${donde}`;
    if (con) t += ` con ${con}`;
    if (a.sala) t += ` · sala ${esc(a.sala)}`;
    if (a.dificultad === 'leyenda') t += ' · Leyenda';
    if (a.jefes?.length && a.resultado === 'victoria') t += ` · venció a ${esc(a.jefes.join(', '))}`;
    if (a.caidos?.length) t += ` · <b class="error">cayó ${esc(a.caidos.join(', '))}</b>`;
    return t;
  };
  const feed = eventos.filter((a) => a.tipo === 'mision' || a.fecha > ahora - 2 * DIA).slice(0, 30)
    .map((a) => `<tr><td class="nota" style="width:1%">${hace(a.fecha)}</td><td style="white-space:normal">${a.tipo === 'mision' ? (a.resultado === 'victoria' ? '⚔️ ' : '💀 ') : '🚪 '}${frase(a)}</td></tr>`).join('')
    || '<tr><td class="nota">El registro empieza ahora: en cuanto alguien juegue, aparecerá aquí.</td></tr>';

  // ---- Por jugador ----
  const filasJug = uids.map((u) => {
    const fs = fichas.filter((x) => x.uid === u), d = fs.reduce((s, { f }) => { for (const k of ['misiones', 'victorias', 'jefes', 'monstruos']) s[k] += f.diario?.[k] || 0; return s; }, { misiones: 0, victorias: 0, jefes: 0, monstruos: 0 });
    const modos = {}; for (const a of eventos) if (a.uid === u && a.tipo === 'mision') modos[a.modo] = (modos[a.modo] || 0) + 1;
    const fav = Object.entries(modos).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { u, d, sem: ultimos7.filter((m) => m.uid === u).length, fav, mundos: fs.length };
  }).sort((a, b) => (ultima[b.u] || 0) - (ultima[a.u] || 0));
  const tablaJug = `<table><tr><th>Jugador</th><th>Última vez</th><th class="num">Esta semana</th><th class="num">Misiones</th><th class="num">Ganadas</th><th class="num">Jefes</th><th>Modo favorito</th><th class="num">Mundos</th></tr>
    ${filasJug.map((r) => `<tr><td><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color[r.u]};margin-right:6px"></i>${esc(nombre[r.u])}</td><td>${hace(ultima[r.u])}</td><td class="num">${r.sem}</td><td class="num">${r.d.misiones}</td><td class="num">${r.d.misiones ? Math.round(100 * r.d.victorias / r.d.misiones) + ' %' : '—'}</td><td class="num">${r.d.jefes}</td><td>${MODO[r.fav] || '—'}</td><td class="num">${r.mundos}</td></tr>`).join('')}</table>`;

  // ---- Mundos y tortugas ----
  const tablaMundos = fichas.length ? `<table><tr><th>Jugador</th><th>Mundo</th><th class="num">Fama</th><th>Rango</th><th>Héroes</th><th class="num">Fondo común</th><th>Obras</th></tr>
    ${fichas.sort((a, b) => (b.f.tortuga?.fama || 0) - (a.f.tortuga?.fama || 0)).map(({ uid, mundo, f }) => {
      const hs = (f.orden || []).map((id) => f.heroes?.[id]).filter(Boolean);
      const fama = f.tortuga?.fama || 0;
      return `<tr><td>${esc(nombre[uid] || '?')}</td><td>${esc(nombresMundo[uid + ':' + mundo] || (mundo === 'm1' ? 'Mi mundo' : mundo))}</td><td class="num">${fama}</td><td>${esc(RANGO(fama))}</td>
        <td style="white-space:normal">${hs.map((h) => `${esc(h.nombre)} <span class="nota">${CLASE[h.tipo] || h.tipo} ${h.nivel || 1}${h.caido ? ' · caído' : ''}</span>`).join(', ') || '<span class="nota">ninguno</span>'}</td>
        <td class="num">${f.banco || 0}</td><td>${Object.keys(f.tortuga?.obras || {}).length}/4${f.tortuga?.historias?.velmor ? ' · faro' : ''}</td></tr>`;
    }).join('')}</table>` : '<p class="nota">No se pueden leer las fichas (revisa las reglas: viajero).</p>';

  // ---- Récords ----
  const todosHeroes = fichas.flatMap(({ uid, f }) => (f.orden || []).map((id) => ({ uid, h: f.heroes?.[id] })).filter((x) => x.h));
  const mejor = (lista, val) => lista.reduce((m, x) => (val(x) > (m ? val(m) : -1) ? x : m), null);
  const rPiso = mejor(fichas, (x) => x.f.diario?.pisoMax || 0), rHeroe = mejor(todosHeroes, (x) => (x.h.nivel || 1) * 1e6 + (x.h.xp || 0));
  const rJefes = mejor(fichas, (x) => x.f.diario?.jefes || 0), rMon = mejor(fichas, (x) => x.f.diario?.monstruos || 0);
  const rFama = mejor(fichas, (x) => x.f.tortuga?.fama || 0), rRico = mejor(todosHeroes, (x) => (x.h.oro || 0) + (x.h.banco || 0));
  const rec = (t, v, quien) => `<div class="cifra"><b style="font-size:20px">${v}</b><span>${t}${quien ? ' · ' + esc(quien) : ''}</span></div>`;
  const records = `<div class="cifras">
    ${rec('piso más hondo', rPiso?.f.diario?.pisoMax || '—', rPiso && nombre[rPiso.uid])}
    ${rec('héroe de más nivel', rHeroe ? `${esc(rHeroe.h.nombre)} · ${rHeroe.h.nivel || 1}` : '—', rHeroe && nombre[rHeroe.uid])}
    ${rec('jefes vencidos', rJefes?.f.diario?.jefes || 0, rJefes && nombre[rJefes.uid])}
    ${rec('monstruos abatidos', rMon?.f.diario?.monstruos || 0, rMon && nombre[rMon.uid])}
    ${rec('tortuga con más fama', rFama?.f.tortuga?.fama || 0, rFama && nombre[rFama.uid])}
    ${rec('héroe más rico', rRico ? `${(rRico.h.oro || 0) + (rRico.h.banco || 0)} o` : '—', rRico && `${rRico.h.nombre} (${nombre[rRico.uid]})`)}
  </div>`;

  // ---- Errores ----
  const grupos = new Map();
  for (const e of errores) { const k = e.mensaje + '|' + e.pagina; const g = grupos.get(k) || { ...e, veces: 0, quien: new Set(), refs: [] }; g.veces++; g.quien.add(nombre[e.uid] || '?'); g.refs.push(e.ref); g.fecha = Math.max(g.fecha || 0, e.fecha || 0); grupos.set(k, g); }
  const listaErr = [...grupos.values()].sort((a, b) => b.fecha - a.fecha);
  const tablaErr = listaErr.length ? `<table><tr><th>Error</th><th>Página</th><th class="num">Veces</th><th>A quién</th><th>Última</th><th>Versión</th></tr>
    ${listaErr.slice(0, 25).map((g) => `<tr title="${esc(g.pila || '')}"><td style="white-space:normal"><b>${esc(g.mensaje)}</b><br><span class="nota">${esc(g.donde)}</span></td><td>${esc(g.pagina)}</td><td class="num">${g.veces}</td><td>${esc([...g.quien].join(', '))}</td><td>${hace(g.fecha)}</td><td class="nota">${esc(g.version || '')}</td></tr>`).join('')}</table>
    <p style="margin:10px 0 0"><button id="b-borrar-errores" class="claro" style="color:var(--lacre);border-color:var(--lacre)">Borrar todos los errores</button></p>`
    : '<p class="nota">Ningún error registrado. 🎉</p>';

  const cifra = (n, txt) => `<div class="cifra"><b>${n}</b><span>${txt}</span></div>`;
  const html = `
    <section id="sec-actividad"><h2>Actividad</h2>
      <div class="cifras" style="margin-bottom:14px">
        ${cifra(activos(1), 'jugando hoy')}${cifra(activos(7), 'activos esta semana')}${cifra(ultimos7.length, 'misiones en 7 días')}${cifra(entradas.filter((a) => a.fecha >= ahora - 7 * DIA && a.donde === 'tortuga').length, 'visitas a Morrandar en 7 días')}
      </div>
      <h3 class="sub">Misiones por día (30 días)</h3>${grafico}
      ${mapaCalor ? `<h3 class="sub">Cuándo se juega</h3>${mapaCalor}` : ''}
    </section>
    <section><h2>Últimos sucesos</h2><table>${feed}</table></section>
    <section><h2>Jugadores</h2>${tablaJug}</section>
    <section><h2>Récords</h2>${records}</section>
    <section><h2>Mundos y tortugas</h2>${tablaMundos}</section>
    <section><h2>Errores${listaErr.length ? ' (' + listaErr.length + ')' : ''}</h2>${tablaErr}</section>
    <section><h2>Anuncio en la portada</h2>
      <p class="nota">Lo ven todos los jugadores al entrar, encima de los mundos. Déjalo vacío y publica para quitarlo.</p>
      <input id="anuncio-titulo" placeholder="Título (opcional)" value="${esc(anuncio?.titulo || '')}" style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--linea);font:inherit;margin-bottom:8px">
      <textarea id="anuncio-texto" rows="3" placeholder="Ej.: ¡Nueva misión de rescate en el Libro de Morrandar!" style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--linea);font:inherit">${esc(anuncio?.texto || '')}</textarea>
      <p style="margin:8px 0 0"><button id="b-anuncio">Publicar</button> ${anuncio?.texto ? `<span class="nota">Publicado ${hace(anuncio.fecha)}</span>` : ''}</p>
    </section>`;
  // Las solicitudes pendientes siguen arriba del todo; lo demás, debajo.
  const primera = document.querySelector('#contenido section');
  primera.insertAdjacentHTML('afterend', html);
  // La tabla vieja de jugadores queda repetida: fuera.
  for (const h of document.querySelectorAll('#contenido section h2')) if (h.textContent === 'Jugadores' && !h.parentElement.querySelector('.cifra') && h.parentElement.querySelectorAll('th').length === 4) h.parentElement.remove();

  document.getElementById('b-anuncio').addEventListener('click', async () => {
    const texto = document.getElementById('anuncio-texto').value.trim(), titulo = document.getElementById('anuncio-titulo').value.trim();
    try { await setDoc(doc(db, 'config', 'anuncio'), { texto, titulo, fecha: Date.now() }); recargar(); }
    catch (e) { alert('No se pudo publicar (¿reglas de config/anuncio?): ' + (e.code || e.message)); }
  });
  document.getElementById('b-borrar-errores')?.addEventListener('click', async () => {
    if (!confirm('¿Borrar los ' + errores.length + ' errores registrados?')) return;
    try { await Promise.all(errores.map((e) => deleteDoc(e.ref))); recargar(); }
    catch (e) { alert('No se pudieron borrar: ' + (e.code || e.message)); }
  });
}
