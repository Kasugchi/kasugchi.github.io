// =============================================================
//  LA SESIÓN: lo que se proyecta en clase.
//  Recuerdo (≈2 min) → escena del tramo → retos → consecuencia → epílogo (≈2 min).
//  El profe lleva el mando; la clase decide. Cuatro mandos siempre a mano:
//  pausar, pista, saltar y terminar. Nada penaliza: ayudas y saltos se anotan.
// =============================================================
import { C, guardar, aventuraActual, lectura, completarTramo, elegirMejora, registrar, observar, siguienteMesa, turnoHecho, sesion as marcarSesion, arcoOlivia, hitosLectura } from './clase.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const barajar = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const OBS_DEBATE = ['Debate muy participativo', 'Nos costó ponernos de acuerdo', 'Buena escucha', 'Alguien cambió de opinión al escuchar'];
const OBS_SESION = ['Sesión muy participativa', 'La clase estaba cansada', 'Buena comprensión del tramo', 'Hay que repasar este tramo'];
const NOMBRE_TIPO = { comprension: '📖 Comprensión', libro: '📕 Con el libro abierto', mates: '➗ Mates del cuento', ordenar: '🧩 Ordenar la historia', votacion: '🗳️ La clase vota', debate: '💬 Debate', convivencia: '🤝 Convivencia', turnos: '🙋 Por turnos' };

let el = null, S = null, ctx = {};
function hablar(t) { if (!C.adaptar.voz || !('speechSynthesis' in window)) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(t).replace(/<[^>]+>/g, '')); u.lang = 'es-ES'; u.rate = .92; speechSynthesis.speak(u); } catch { /* sin voz */ } }

export function jugar(t, opciones = {}) {
  ctx = opciones; const av = aventuraActual(); if (!av || !t) return;
  const l = lectura(av), seguir = l.enCurso?.tramo === t.id ? l.enCurso.fase : 0;
  const fases = ['recuerdo', 'escena', ...t.retos.map((_, i) => 'reto' + i), 'consecuencia', 'epilogo'];
  S = { av, t, fases, fase: seguir, pista: false, intentos: 0, hecho: false, timer: null, pausa: false, hitosAntes: hitosLectura() };
  marcarSesion(true, av, t);
  el?.remove(); el = document.createElement('div'); el.id = 'sesion';
  el.className = (C.adaptar.grande ? 'grande ' : '') + (C.adaptar.contraste ? 'contraste' : '');
  el.innerHTML = `<div class="ses-top"><span>${esc(av.emoji)} ${esc(av.titulo)} · Tramo ${av.tramos.indexOf(t) + 1} de ${av.tramos.length}: <b>${esc(t.titulo)}</b></span><span id="ses-paso"></span></div>
    <main class="ses-main" id="ses-main"></main>
    <div class="ses-mandos"><button data-m="pausa">✋ Pausar y debatir</button><button data-m="pista">💡 Pista</button><button data-m="saltar">⏭️ Saltar</button><button data-m="terminar">🏁 Terminar</button></div>
    <div class="ses-pausa" hidden><div>⏸</div><p>Pausa para debatir</p><small>Tomaos el tiempo que necesitéis.</small><button class="ses-btn" data-m="reanudar">▶ Seguimos</button></div>`;
  document.body.appendChild(el);
  for (const ev of ['pointerdown', 'keydown', 'wheel']) el.addEventListener(ev, (e) => e.stopPropagation());
  el.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b) mando(b.dataset.m); });
  pinta();
}
function cerrar() { clearInterval(S?.timer); try { speechSynthesis.cancel(); } catch { /* nada */ } el?.remove(); el = null; marcarSesion(false); ctx.alCerrar?.(); }
function guardarSitio() { const l = lectura(S.av); l.enCurso = S.fase > 1 && S.fases[S.fase] !== 'epilogo' && !S.hecho ? { tramo: S.t.id, fase: S.fase } : null; guardar(); }
function avanzar() { clearInterval(S.timer); S.fase++; S.pista = false; S.intentos = 0; S.resuelto = false; guardarSitio(); if (S.fase >= S.fases.length) return cerrar(); pinta(); }

function mando(m) {
  const f = S.fases[S.fase], enReto = f.startsWith('reto');
  if (m === 'pausa') { S.pausa = true; el.querySelector('.ses-pausa').hidden = false; return; }
  if (m === 'reanudar') { S.pausa = false; el.querySelector('.ses-pausa').hidden = true; return; }
  if (m === 'terminar') { if (S.fase > 1 && !S.hecho && !confirm('¿Terminar la sesión aquí? La próxima vez seguiréis en este mismo punto.')) return; guardarSitio(); return cerrar(); }
  if (!enReto || S.resuelto) return;
  const r = S.t.retos[+f.slice(4)];
  if (m === 'pista') { S.pista = true; const p = el.querySelector('#ses-pista'); if (p) { p.hidden = false; hablar(r.pista || ''); } return; }
  if (m === 'saltar') { registrar(S.av, S.t, r, 'saltado'); if (r.mejora) elegirMejora(S.av, S.t, r.ops[0][0]); return avanzar(); }
}

function pinta() {
  const f = S.fases[S.fase], main = el.querySelector('#ses-main'), t = S.t, av = S.av;
  el.querySelector('#ses-paso').textContent = f.startsWith('reto') ? `Reto ${+f.slice(4) + 1} de ${t.retos.length}` : { recuerdo: 'Recuerdo', escena: 'La escena', consecuencia: 'Consecuencia', epilogo: 'Epílogo' }[f];
  el.querySelectorAll('[data-m=pista],[data-m=saltar]').forEach((b) => { b.disabled = !f.startsWith('reto') || (b.dataset.m === 'pista' && !t.retos[+f.slice(4)]?.pista); });
  const seguir = (txt = 'Seguir ▶') => `<button class="ses-btn ses-seguir" id="ses-seguir">${txt}</button>`;
  const bocadillo = (quien, txt) => `<div class="ses-habla"><div class="ses-cara">${quien}</div><div class="ses-bocadillo">${txt}</div></div>`;
  if (f === 'recuerdo') {
    const previos = av.tramos.filter((x) => lectura(av).completados[x.id] && x !== t), ult = previos.at(-1);
    const txt = ult ? `¿Os acordáis? ${esc(ult.resumen)}` : `¡Hola, clase! Soy ${esc(av.guia.nombre)}. Vamos a vivir juntos <b>${esc(av.titulo)}</b>. Pero solo lo que ya hayáis leído, ¿eh? Nada de adelantarse.`;
    main.innerHTML = `<p class="ses-eti">Recuerdo</p>${bocadillo(ult ? '🦉' : av.guia.emoji, txt)}${seguir('Empezar el tramo ▶')}`; hablar(txt);
  } else if (f === 'escena') {
    main.innerHTML = `<p class="ses-eti">${esc(t.lugar)}</p><div class="ses-escena"><div class="ses-emoji">${t.emoji}</div><p>${esc(t.escena)}</p></div>${seguir('¡Adelante! ▶')}`; hablar(t.escena);
  } else if (f.startsWith('reto')) {
    reto(main, t.retos[+f.slice(4)]);
    return;
  } else if (f === 'consecuencia') {
    const res = completarTramo(av, t); S.hecho = true; guardarSitio();
    const j = C.pueblo.jardin.find((x) => x.k === `${av.id}:${t.id}`);
    let txt = t.final ? '¡Habéis terminado el libro y su aventura!' : `¡Tramo superado! ${j ? `En el rincón de la clase ya está: <b>${esc(j.op)}</b>.` : ''}`;
    if (res.huellas) txt += `<ul class="ses-huellas"><li>🏛️ Se restaura <b>${esc(av.huellas.lugar.nombre)}</b></li><li>${av.huellas.recuerdo.emoji} <b>${esc(av.huellas.recuerdo.nombre)}</b> va a la vitrina de la biblioteca</li><li>${av.huellas.hilo.emoji} ${esc(av.huellas.hilo.texto)}</li><li>🧭 El explorador de la clase lleva ahora un recuerdo nuevo</li></ul>`;
    else if (!res.nuevo) txt += '<p class="ses-nota">Este tramo ya estaba superado: el pueblo no cambia dos veces.</p>';
    main.innerHTML = `<p class="ses-eti">Consecuencia</p><div class="ses-escena"><div class="ses-emoji">${t.final ? '🏆' : '🌟'}</div><div>${txt}</div></div>${seguir()}`;
    ctx.alCompletar?.(res, t);
  } else if (f === 'epilogo') {
    const nuevoHito = hitosLectura() > S.hitosAntes;
    main.innerHTML = `<p class="ses-eti">Mientras tanto, en Villa Lectora…</p>${bocadillo('🏡', esc(t.epilogo))}${nuevoHito ? bocadillo('🦉', esc(arcoOlivia())) : ''}
      <div class="ses-obs"><p>¿Cómo ha ido la sesión? <small>(opcional, sin nombres)</small></p>${OBS_SESION.map((o) => `<button class="ses-chip" data-obs="${esc(o)}">${esc(o)}</button>`).join('')}</div>${seguir('Volver al pueblo ▶')}`;
    hablar(t.epilogo);
    main.querySelectorAll('[data-obs]').forEach((b) => b.onclick = () => { observar(b.dataset.obs, { aventura: av.id, tramo: t.id, momento: 'sesión' }); b.classList.add('on'); b.disabled = true; });
  }
  main.querySelector('#ses-seguir')?.addEventListener('click', avanzar);
}

// ---------- los retos ----------
function cabecera(r) { return `<p class="ses-eti">${NOMBRE_TIPO[r.tipo] || ''}</p>${r.tipo === 'libro' ? '<div class="ses-libro">📖 ¡Abrid el libro!</div>' : ''}<h2 class="ses-preg">${esc(r.texto)}</h2>`; }
const pistaHTML = (r) => r.pista ? `<p class="ses-pista" id="ses-pista" hidden>💡 ${esc(r.pista)}</p>` : '';
function fin(main, html, extra = '') { S.resuelto = true; const d = document.createElement('div'); d.className = 'ses-fin'; d.innerHTML = html + extra + '<button class="ses-btn ses-seguir" id="ses-seguir">Seguir ▶</button>'; main.appendChild(d); d.querySelector('#ses-seguir').onclick = avanzar; d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }

function reto(main, r) {
  hablar(r.texto);
  if (['comprension', 'libro', 'mates'].includes(r.tipo)) {
    let ops = r.ops.map((o, i) => [o, i]); if (C.adaptar.facil) ops = [ops[r.buena], ...ops.filter((o) => o[1] !== r.buena).slice(0, 2)];
    main.innerHTML = cabecera(r) + (r.prisa && C.adaptar.temporizadores ? '<div class="ses-prisa"><i id="ses-reloj"></i><span>¡El barco va a zarpar!</span></div>' : '') + `<div class="ses-ops">${barajar(ops).map(([o, i]) => `<button class="ses-op" data-i="${i}">${esc(o)}</button>`).join('')}</div>` + pistaHTML(r) + '<p class="ses-msg" id="ses-msg"></p>';
    if (r.prisa && C.adaptar.temporizadores) { const t0 = performance.now(); S.timer = setInterval(() => { if (S.pausa) return; const x = (performance.now() - t0) / (r.prisa * 1000), b = main.querySelector('#ses-reloj'); if (!b) return clearInterval(S.timer); b.style.width = Math.min(100, x * 100) + '%'; if (x >= 1) { clearInterval(S.timer); main.querySelector('.ses-prisa span').textContent = '¡Uf, por los pelos! El capitán os espera. Pensadlo con calma.'; } }, 100); }
    main.querySelectorAll('.ses-op').forEach((b) => b.onclick = () => {
      if (S.resuelto) return;
      if (+b.dataset.i === r.buena) { clearInterval(S.timer); b.classList.add('bien'); registrar(S.av, S.t, r, S.pista ? 'con_pista' : 'resuelto', { intentos: S.intentos + 1 }); fin(main, '<p class="ses-ok">✓ ¡Eso es!</p>'); }
      else { S.intentos++; b.classList.add('mal'); b.disabled = true; main.querySelector('#ses-msg').textContent = r.tipo === 'mates' ? '🤔 Revisad la cuenta juntos.' : '📖 ¿Lo comprobamos en el libro?'; }
    });
  } else if (r.tipo === 'ordenar') {
    let n = 0;
    main.innerHTML = cabecera(r) + `<ol class="ses-orden" id="ses-orden"></ol><div class="ses-ops">${barajar(r.items.map((x, i) => [x, i])).map(([x, i]) => `<button class="ses-op" data-i="${i}">${esc(x)}</button>`).join('')}</div>` + pistaHTML(r) + '<p class="ses-msg" id="ses-msg"></p>';
    main.querySelectorAll('.ses-op').forEach((b) => b.onclick = () => {
      if (S.resuelto) return;
      if (+b.dataset.i === n) { n++; b.remove(); main.querySelector('#ses-orden').insertAdjacentHTML('beforeend', `<li>${esc(r.items[+b.dataset.i])}</li>`); if (n === r.items.length) { registrar(S.av, S.t, r, S.pista ? 'con_pista' : 'resuelto', { intentos: S.intentos + 1 }); fin(main, '<p class="ses-ok">✓ ¡Así pasó!</p>'); } }
      else { S.intentos++; b.classList.remove('sacude'); void b.offsetWidth; b.classList.add('sacude'); main.querySelector('#ses-msg').textContent = '🤔 Ese va en otro momento. ¿Qué pasó antes?'; }
    });
  } else if (r.tipo === 'votacion') {
    const pinta2 = (ops, empate) => {
      main.innerHTML = cabecera(r) + (empate ? `<div class="ses-habla"><div class="ses-cara">🦉</div><div class="ses-bocadillo">¿Empate? ¡Qué bien, significa que las dos ideas gustan! Os propongo otra: <b>${esc(r.tercera[0])}</b>. ${esc(r.tercera[1])}. O buscad un acuerdo entre todos.</div></div>` : '<p class="ses-ayuda">Votad con las manos o con las cartulinas. El profe toca la opción ganadora.</p>') +
        `<div class="ses-ops">${ops.map((o, i) => `<button class="ses-op" data-i="${i}"><b>${esc(o[0])}</b><small>${esc(o[1])}</small></button>`).join('')}</div>` + (empate ? '' : '<button class="ses-btn ses-sec" id="ses-empate">🤝 Ha habido empate</button>');
      main.querySelectorAll('.ses-op').forEach((b) => b.onclick = () => { if (S.resuelto) return; const o = ops[+b.dataset.i]; b.classList.add('bien'); if (r.mejora) elegirMejora(S.av, S.t, o[0]); registrar(S.av, S.t, r, 'decidido', { eleccion: o[0], empate: !!empate }); fin(main, `<p class="ses-ok">La clase ha elegido: ${esc(o[0])}</p>`); });
      main.querySelector('#ses-empate')?.addEventListener('click', () => pinta2([...r.ops, r.tercera], true));
    };
    pinta2(r.ops, false);
  } else if (r.tipo === 'debate') {
    main.innerHTML = cabecera(r) + `<div class="ses-persp">${r.perspectivas.map(([q, t]) => `<div><b>${esc(q)}</b><p>${esc(t)}</p></div>`).join('')}</div><p class="ses-ayuda">No hay una respuesta correcta: lo importante son las razones. Usad «Pausar y debatir» el tiempo que haga falta. Después, ¿qué decide la clase?</p><div class="ses-ops">${r.ops.map((o, i) => `<button class="ses-op" data-i="${i}">${esc(o[0])}</button>`).join('')}</div>`;
    main.querySelectorAll('.ses-op').forEach((b) => b.onclick = () => { if (S.resuelto) return; const o = r.ops[+b.dataset.i]; b.classList.add('elegida'); registrar(S.av, S.t, r, 'decidido', { eleccion: o[0] }); fin(main, `<p class="ses-cons">${esc(o[1])}</p>`, chipsObs(OBS_DEBATE, r)); activarChips(main, r); });
  } else if (r.tipo === 'convivencia') {
    main.innerHTML = cabecera(r) + `<div class="ses-conv">${esc(r.mensaje)}</div><p class="ses-ayuda">Para hablar en clase:</p><ul class="ses-preguntas">${r.preguntas.map((q) => `<li>${esc(q)}</li>`).join('')}</ul><button class="ses-btn" id="ses-hablado">🤝 Lo hemos hablado</button>`;
    main.querySelector('#ses-hablado').onclick = () => { if (S.resuelto) return; registrar(S.av, S.t, r, 'hablado'); main.querySelector('#ses-hablado').remove(); fin(main, '<p class="ses-cons">Picaporte os da las gracias. En Villa Lectora cada uno habla como habla, y todos se entienden.</p>', chipsObs(OBS_DEBATE, r)); activarChips(main, r); };
  } else if (r.tipo === 'turnos') {
    let m = siguienteMesa();
    const pinta3 = () => {
      main.innerHTML = cabecera(r) + `<div class="ses-mesa" style="--c:${m.color}">Le toca a la <b>${esc(m.nombre)}</b></div><p class="ses-ayuda">${esc(r.apoyo || '')}</p><div class="ses-fila"><button class="ses-btn" id="ses-hecho">✓ Hecho</button><button class="ses-btn ses-sec" id="ses-otra">Otra mesa</button></div>`;
      main.querySelector('#ses-hecho').onclick = () => { if (S.resuelto) return; turnoHecho(m.id); registrar(S.av, S.t, r, 'resuelto', { mesa: m.nombre }); main.querySelector('.ses-fila').remove(); fin(main, `<p class="ses-ok">¡Bien leído, ${esc(m.nombre.toLowerCase())}!</p>`); };
      main.querySelector('#ses-otra').onclick = () => { const otras = C.mesas.filter((x) => x.id !== m.id); m = otras[Math.floor(Math.random() * otras.length)]; pinta3(); };
    };
    pinta3();
  }
}
const chipsObs = (lista) => `<div class="ses-obs"><p>Observación rápida <small>(opcional)</small></p>${lista.map((o) => `<button class="ses-chip" data-obs="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
function activarChips(main, r) { main.querySelectorAll('[data-obs]').forEach((b) => b.onclick = () => { observar(b.dataset.obs, { aventura: S.av.id, tramo: S.t.id, reto: r.texto, momento: r.tipo }); b.classList.add('on'); b.disabled = true; }); }
