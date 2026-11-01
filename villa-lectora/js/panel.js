// =============================================================
//  PANEL DOCENTE: preparar una sesión en menos de un minuto.
//  Jugar (lo habitual) · Adaptar (cuando hace falta) · Progreso e informes ·
//  La clase (mesas, libros sin aventura, interludios) · Datos (solo admin).
// =============================================================
import { C, guardar, reiniciar, exportarJSON, AVENTURAS, aventuraActual, lectura, marcarLeido, estadoTramos, siguienteTramo, libroLibre, interludio, observar, hitosLectura } from './clase.js';
import { informeHTML, fichaSA, abrirDocumento, descargarCSV } from './informe.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const $ = (s) => document.querySelector(s);

export function abrirPanel(X, tab = 'jugar') {
  const av = aventuraActual(), l = lectura(av), est = estadoTramos(av), sig = siguienteTramo(av);
  const tabs = [['jugar', '▶ Jugar'], ['adaptar', '🎛️ Adaptar'], ['progreso', '📊 Progreso'], ['clase', '🏫 La clase'], ...(X.rol === 'admin' ? [['datos', '🛡️ Datos']] : [])];
  let body = '';
  if (tab === 'jugar') {
    const icono = (e) => e.hecho ? '✅' : e.abierto ? '🔓' : '🔒';
    body = `<div class="pd-libro"><span class="pd-emoji">${av.emoji}</span><div><small>LECTURA ACTUAL</small><h2>${esc(av.titulo)}</h2><p class="muted">${esc(av.autor)} · ${esc(av.curso)}</p></div></div>
      <label class="dashboard-label">¿Hasta dónde ha leído la clase?<select id="pd-hito"><option value="">Todavía no hemos empezado</option>${av.hitos.map((h) => `<option value="${h.id}" ${l.hito === h.id ? 'selected' : ''}>${esc(h.texto)}</option>`).join('')}</select></label>
      <button class="action primary pd-grande" id="pd-continuar" ${sig ? '' : 'disabled'}>${sig ? `▶ ${l.enCurso?.tramo === sig.id ? 'Seguir' : 'Empezar'} el tramo «${esc(sig.titulo)}»` : (est.every((e) => e.hecho) ? '🏆 Aventura completada' : '📖 Marca hasta dónde habéis leído para abrir tramos')}</button>
      <div class="pd-tramos">${est.map((e, i) => `<div class="pd-tramo ${e.hecho ? 'hecho' : e.abierto ? 'abierto' : ''}"><span>${icono(e)} ${i + 1}. ${esc(e.t.titulo)}</span><small>${esc(av.hitos.find((h) => h.id === e.t.requiere).texto)}</small>${e.abierto ? `<button class="action" data-repetir="${e.t.id}">${e.hecho ? 'Repetir' : 'Jugar'}</button>` : ''}</div>`).join('')}</div>
      <p class="muted">🔓 abierto por lo leído · ✅ completado. Repetir un tramo no vuelve a cambiar el pueblo.</p>`;
  }
  if (tab === 'adaptar') {
    const op = (k, t, d) => `<label class="toggle"><input type="checkbox" data-adapt="${k}" ${C.adaptar[k] ? 'checked' : ''}> <b>${t}</b><br><small class="muted">${d}</small></label>`;
    body = `<h2>Adaptar la sesión para toda la clase</h2>${op('grande', '🔠 Texto ampliado', 'Letra más grande en la pantalla de la sesión')}${op('contraste', '🌓 Alto contraste', 'Fondo oscuro y texto claro, para proyectores con poca luz')}${op('voz', '🔊 Leer en voz alta', 'El juego lee las escenas y los retos con la voz del dispositivo')}${op('temporizadores', '⏱️ Temporizadores', 'Solo en algún reto marcado; nunca penalizan')}${op('facil', '🪶 Menos opciones', 'Los retos de respuesta muestran tres opciones en vez de cuatro')}<p class="muted">Durante la sesión siempre tienes: pausar, pista, saltar y terminar. Nada de eso bloquea la aventura ni castiga a la clase.</p>`;
  }
  if (tab === 'progreso') {
    const n = (p) => Object.keys(C.hitos).filter((k) => k.startsWith(p)).length;
    body = `<div class="stats"><div>📚 <b>${n('libro:') + n('libre:')}</b><small>Libros terminados</small></div><div>🧩 <b>${n('tramo:')}</b><small>Tramos</small></div><div>🗓️ <b>${C.sesiones.length}</b><small>Sesiones</small></div></div>
      <div class="dashboard-grid"><button class="action primary" id="pd-informe">📄 Ver informe de la clase</button><button class="action" id="pd-ficha">🧾 Situación de aprendizaje</button><button class="action" id="pd-csv">⬇ Registro en CSV</button></div>
      <label class="dashboard-label">Observación libre <small class="muted">(opcional; no escribas nombres de alumnos)</small><textarea id="pd-obs" rows="3" maxlength="400" placeholder="Por ejemplo: la clase conectó mucho con el personaje de Picaporte."></textarea></label><button class="action" id="pd-obs-ok">Guardar observación</button>
      <p class="muted">El informe separa lo que hizo la clase, lo que se trabajaba y lo que tú has observado. No contiene datos de ningún alumno.</p>`;
  }
  if (tab === 'clase') {
    body = `<label class="dashboard-label">Nombre de la clase<input id="pd-nombre" maxlength="40" value="${esc(C.nombre)}"></label>
      <label class="dashboard-label">Número de mesas o equipos<select id="pd-mesas">${[3, 4, 5, 6].map((n) => `<option ${C.mesas.length === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <h2>📗 Libros sin aventura</h2><p class="muted">Si la clase lee un libro que no tiene aventura, anótalo igual: también hace avanzar el pueblo.</p>
      ${C.librosLibres.map((b) => `<div class="pd-tramo ${b.terminado ? 'hecho' : 'abierto'}"><span>${b.terminado ? '✅' : '📖'} ${esc(b.titulo)}</span>${b.terminado ? '' : `<button class="action" data-libre="${esc(b.titulo)}">Terminado</button>`}</div>`).join('')}
      <div class="pd-fila"><input id="pd-libre" maxlength="60" placeholder="Título del libro"><button class="action" id="pd-libre-ok">Añadir</button></div>
      <h2>✍️ Interludio: una historia de la clase</h2><p class="muted">La clase la escribe en papel. Aquí solo el título y una frase: aparecerá en la estantería de la biblioteca, con autoría de toda la clase.</p>
      <div class="pd-fila"><input id="pd-int-t" maxlength="60" placeholder="Título"><input id="pd-int-f" maxlength="140" placeholder="Una frase de la historia"><button class="action" id="pd-int-ok">A la estantería</button></div>
      <h2>🛠️ Taller de aventuras</h2><p class="muted">Crear aventuras propias con las mismas piezas que las oficiales llegará más adelante.</p>`;
  }
  if (tab === 'datos') body = `<h2>🛡️ Datos de la clase</h2><p>Todo se guarda en este navegador (prototipo). No hay datos de alumnos.</p><div class="dashboard-grid"><button class="action" id="pd-backup">⬇ Copia de seguridad (JSON)</button><button class="action danger" id="pd-reset">🗑️ Reiniciar la clase</button></div><p class="muted">Hitos registrados: ${hitosLectura()}. Registros de actividad: ${C.registro.length}.</p>`;

  X.open(`<span class="tag">👩‍🏫 PANEL DOCENTE · ${esc(C.nombre)}</span><h1>Buenos días</h1><div class="dashboard-tabs">${tabs.map(([id, t]) => `<button class="${tab === id ? 'active' : ''}" data-ptab="${id}">${t}</button>`).join('')}</div><section class="dashboard-section">${body}</section>`);
  document.querySelectorAll('[data-ptab]').forEach((b) => b.onclick = () => abrirPanel(X, b.dataset.ptab));
  const re = () => { X.alCambiar?.(); abrirPanel(X, tab); };
  $('#pd-hito')?.addEventListener('change', (e) => { marcarLeido(e.target.value || null); re(); });
  $('#pd-continuar')?.addEventListener('click', () => { X.close(); X.jugar(siguienteTramo(av)); });
  document.querySelectorAll('[data-repetir]').forEach((b) => b.onclick = () => { X.close(); X.jugar(av.tramos.find((t) => t.id === b.dataset.repetir)); });
  document.querySelectorAll('[data-adapt]').forEach((c) => c.onchange = () => { C.adaptar[c.dataset.adapt] = c.checked; guardar(); });
  $('#pd-informe')?.addEventListener('click', () => { if (!abrirDocumento(informeHTML())) alert('El navegador ha bloqueado la ventana. Permite las ventanas emergentes para ver el informe.'); });
  $('#pd-ficha')?.addEventListener('click', () => { if (!abrirDocumento(fichaSA(av))) alert('El navegador ha bloqueado la ventana. Permite las ventanas emergentes.'); });
  $('#pd-csv')?.addEventListener('click', descargarCSV);
  $('#pd-obs-ok')?.addEventListener('click', () => { const t = $('#pd-obs').value.trim(); if (!t) return; observar(t, { momento: 'nota libre' }); $('#pd-obs').value = ''; $('#pd-obs-ok').textContent = '✓ Guardada'; });
  $('#pd-nombre')?.addEventListener('change', (e) => { C.nombre = e.target.value.trim() || 'Clase'; guardar(); re(); });
  $('#pd-mesas')?.addEventListener('change', (e) => { const n = +e.target.value, todas = ['roja', 'azul', 'verde', 'amarilla', 'morada', 'naranja']; const col = { roja: '#e0604f', azul: '#4a7fd0', verde: '#4fa35a', amarilla: '#e0b23a', morada: '#8d62c6', naranja: '#e58a3a' }; C.mesas = todas.slice(0, n).map((id) => C.mesas.find((m) => m.id === id) || { id, nombre: 'Mesa ' + id, color: col[id], turnos: 0 }); guardar(); });
  $('#pd-libre-ok')?.addEventListener('click', () => { const t = $('#pd-libre').value.trim(); if (t) { libroLibre(t, false); re(); } });
  document.querySelectorAll('[data-libre]').forEach((b) => b.onclick = () => { libroLibre(b.dataset.libre, true); X.celebrar?.('globos'); re(); });
  $('#pd-int-ok')?.addEventListener('click', () => { const t = $('#pd-int-t').value.trim(), f = $('#pd-int-f').value.trim(); if (t) { interludio(t, f); re(); } });
  $('#pd-backup')?.addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([exportarJSON()], { type: 'application/json' })); a.download = 'villa-lectora-clase.json'; a.click(); });
  $('#pd-reset')?.addEventListener('click', () => { if (confirm('¿Borrar todo el progreso de esta clase en este navegador?') && confirm('Última confirmación: no se puede deshacer sin copia.')) { reiniciar(); location.reload(); } });
}
