// =============================================================
//  MOTOR DE AVENTURAS (mapa + paradas + minijuegos + pasaporte)
//  Cada aventura define un objeto DATA y llama a iniciar(DATA).
//  Se apoya en comun.js (sonido, confeti, sellos) y personajes.js.
// =============================================================
const $q = (s, r = document) => r.querySelector(s);
const uno = (l) => l[Math.floor(Math.random() * l.length)];
const avSvg = (k) => PERSONAJES[k] || PERSONAJES.ratoncito;
let D, E, velo = null, viajando = false;
const clave = () => 'turin_av_' + D.id;
function cargar() { try { const s = JSON.parse(localStorage.getItem(clave())); if (s && Array.isArray(s.hecho)) return s; } catch { /* nada */ } return { etapa: 0, hecho: [], fallos: 0 }; }
function guardar() { try { localStorage.setItem(clave(), JSON.stringify(E)); } catch { /* nada */ } }
function fallo() { E.fallos++; guardar(); sMal(); const c = $q('#cuenta-fallos'); if (c) c.textContent = 'Tropiezos: ' + E.fallos; }
const estrellasAv = () => (E.fallos <= 3 ? 3 : E.fallos <= 8 ? 2 : 1);

function iniciar(data) {
  D = data; E = cargar();
  document.title = D.titulo;
  document.getElementById('app').innerHTML = `
   <div class="juego-cab"><a href="index.html">← Volver</a><button class="mudo" id="mu"></button></div>
   <h1>${D.titulo}<br><small class="nota">${D.sub}</small></h1>
   <div class="habla tarjeta" style="grid-template-columns:auto 1fr"><span>${avSvg(D.guia)}</span><div class="bocadillo" id="intro">${D.intro}</div></div>
   <div class="mapa" id="mapa"></div>
   <div class="abajo"><button class="gran" id="b-seguir">▶ Seguir la aventura</button><button class="redondo" id="b-pasaporte" aria-label="Pasaporte">🛂</button></div>`;
  botonSonido($q('#mu'));
  $q('#b-pasaporte').onclick = abrirPasaporte;
  $q('#b-seguir').onclick = () => { if (viajando) return; if (E.etapa >= D.nodos.length) { E = { etapa: 0, hecho: [], fallos: 0 }; guardar(); pintar(); } abrirParada(E.etapa); };
  pintar();
}
function pintar() {
  const N = D.nodos, ir = Math.min(E.etapa, N.length - 1);
  const ruta = (l) => l.map((n, i) => `${i ? 'L' : 'M'}${n.x} ${n.y}`).join(' ');
  $q('#mapa').innerHTML = `<svg viewBox="0 0 400 440" role="img" aria-label="Mapa de la aventura">${D.fondo}
    <path class="ruta" d="${ruta(N)}"/><path class="ruta hecha" d="${ruta(N.slice(0, Math.min(E.etapa, N.length - 1) + 1))}"/>
    ${N.map((n, i) => `<g class="parada ${E.hecho.includes(i) ? 'hecha' : i === E.etapa ? 'ahora' : ''}" transform="translate(${n.x},${n.y})" data-i="${i}"><circle class="anillo" r="27"/><circle class="base" r="22"/><text y="9" text-anchor="middle" font-size="25">${n.icono}</text><text class="nom" y="44">${n.nombre}</text></g>`).join('')}
    <g id="viajero" transform="translate(${N[ir].x},${N[ir].y})"><image href="${svgUrl(D.guia)}" x="-26" y="-66" width="52" height="52"/></g></svg>`;
  $q('#mapa .parada.ahora')?.addEventListener('click', () => abrirParada(E.etapa));
  const b = $q('#b-seguir'); b.textContent = E.etapa >= N.length ? '🔁 Empezar de nuevo' : E.etapa === 0 && !E.hecho.length ? '▶ Empezar la aventura' : '▶ Seguir la aventura';
}
function viajar(i, cb) {
  viajando = true; const a = D.nodos[i], b = D.nodos[i + 1], v = $q('#viajero'), t0 = performance.now(), dur = 1200;
  const paso = (t) => { const f = Math.min(1, (t - t0) / dur), e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; v.setAttribute('transform', `translate(${a.x + (b.x - a.x) * e},${a.y + (b.y - a.y) * e - Math.sin(f * Math.PI) * 14})`); if (f < 1) requestAnimationFrame(paso); else { viajando = false; cb(); } };
  requestAnimationFrame(paso);
}
function cerrar() { velo?.remove(); velo = null; try { speechSynthesis.cancel(); } catch { /* nada */ } }
function abrirParada(i) {
  if (i >= D.nodos.length) return abrirPasaporte();
  cerrar(); const n = D.nodos[i];
  velo = document.createElement('div'); velo.className = 'velo';
  velo.innerHTML = `<section class="escena" role="dialog" aria-label="${esc(n.nombre)}"><div class="lugar"><h2>${n.icono} ${esc(n.nombre)}</h2><span class="sello-mini">Parada ${i + 1} de ${D.nodos.length}</span></div>
   <div class="habla">${avSvg(D.guia)}<div class="bocadillo" id="dice"></div><button class="redondo repetir" aria-label="Repetir">🔁</button></div>
   <div class="juego" id="juego"></div>
   <div class="pie"><button class="chico" id="b-volver">← Volver al mapa</button><span class="sello-mini" id="cuenta-fallos">Tropiezos: ${E.fallos}</span></div></section>`;
  document.body.appendChild(velo);
  const dice = (t, leer = true) => { const d = $q('#dice', velo); if (!d) return; d.innerHTML = t; if (leer) decir(t); velo.querySelector('.repetir').onclick = () => decir(t); };
  $q('#b-volver', velo).onclick = cerrar;
  dice(n.intro);
  JUEGOS[n.juego](velo.querySelector('#juego'), dice, () => ganar(i, dice), n.cfg || {});
}
function ganar(i, dice) {
  sFanfarria(); confeti(24);
  if (!E.hecho.includes(i)) E.hecho.push(i); E.etapa = Math.max(E.etapa, i + 1); guardar();
  const n = D.nodos[i], ultima = i === D.nodos.length - 1;
  dice(n.fin || '¡Muy bien!');
  $q('#juego', velo).innerHTML = `<div class="sello puesto" style="width:150px;font-size:16px"><span>${n.icono}</span>${esc(n.nombre)}</div>
   <button class="gran" id="b-sigue">${ultima ? '🏆 Ver el pasaporte' : '▶ Seguir el viaje'}</button>`;
  $q('#b-sigue', velo).onclick = () => { cerrar(); if (ultima) { pintar(); return abrirPasaporte(); } viajar(i, () => { pintar(); setTimeout(() => abrirParada(i + 1), 500); }); };
}
function abrirPasaporte() {
  cerrar(); velo = document.createElement('div'); velo.className = 'velo';
  const todo = E.hecho.length === D.nodos.length, est = estrellasAv();
  if (todo) ponSello(D.id, est);
  velo.innerHTML = `<section class="escena pasaporte" role="dialog" aria-label="Pasaporte"><div class="lugar"><h2>Pasaporte</h2><span class="sello-mini" style="color:var(--papel)">${E.hecho.length} de ${D.nodos.length} sellos</span></div>
   <div class="sellos">${D.nodos.map((p, i) => `<div class="sello${E.hecho.includes(i) ? ' puesto' : ''}"><span>${E.hecho.includes(i) ? p.icono : '·'}</span>${esc(p.nombre)}</div>`).join('')}</div>
   ${todo ? `<p style="text-align:center;font-size:22px">${estrellasTxt(est, 3)} · ${E.fallos} tropiezos</p><div class="lectura" style="color:var(--tinta)"><b>${D.reflexion.titulo}</b><ul>${D.reflexion.preguntas.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></div>` : ''}
   <div class="pie"><button class="chico" id="b-cerrar" style="color:var(--papel)">← Volver al mapa</button><button class="chico" id="b-borrar" style="color:var(--laton)">Empezar de nuevo</button></div></section>`;
  document.body.appendChild(velo); if (todo) { confeti(30); sFanfarria(); }
  decir(todo ? '¡Pasaporte completo! Habéis terminado la aventura.' : `Tienes ${E.hecho.length} sellos de ${D.nodos.length}.`);
  $q('#b-cerrar', velo).onclick = cerrar;
  $q('#b-borrar', velo).onclick = () => { E = { etapa: 0, hecho: [], fallos: 0 }; guardar(); cerrar(); pintar(); };
}
addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });

// =============================================================
//  MINIJUEGOS: función(area, dice, fin, cfg)
// =============================================================
const ok = () => sOk();
function reto(a, dice, fin, preguntas) {
  let i = 0;
  const pon = () => {
    const q = preguntas[i];
    a.innerHTML = `<div class="pasos">${preguntas.map((_, k) => `<span class="${k < i ? 'si' : k === i ? 'ya' : ''}"></span>`).join('')}</div>${q.visual ? `<div class="visual">${q.visual}</div>` : ''}<p class="pregunta">${q.texto}</p>
     <div class="opciones">${barajar([...new Set(q.ops.map(String))]).map((o) => `<button class="op" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    decir(q.texto);
    a.querySelectorAll('.op').forEach((b) => b.onclick = () => {
      if (b.dataset.o === String(q.buena)) { ok(); b.classList.add('bien'); a.querySelectorAll('.op').forEach((x) => { x.disabled = true; }); dice(q.bien || uno(['¡Correcto!', '¡Eso es!', '¡Muy bien!']), false); if (++i === preguntas.length) setTimeout(fin, 1000); else setTimeout(pon, 1000); }
      else { fallo(); b.classList.remove('mal'); void b.offsetWidth; b.classList.add('mal'); b.disabled = true; dice(q.pista || 'Casi. Léelo otra vez con calma.'); }
    });
  };
  pon();
}
const JUEGOS = {
  // Preguntas de opción múltiple (lengua, mates, lo que sea): cfg.preguntas
  preguntas(a, dice, fin, cfg) { reto(a, dice, fin, cfg.preguntas); },
  // Lectura: un texto y preguntas de comprensión
  lectura(a, dice, fin, cfg) { reto(a, dice, fin, cfg.preguntas.map((q) => ({ ...q, visual: `<div class="lectura">${cfg.texto}</div>` }))); },
  // Escenas de valores: se elige lo más justo; cada opción tiene su explicación
  decidir(a, dice, fin, cfg) {
    let i = 0;
    const pon = () => { const s = cfg.escenas[i];
      a.innerHTML = `<div class="pasos">${cfg.escenas.map((_, k) => `<span class="${k < i ? 'si' : k === i ? 'ya' : ''}"></span>`).join('')}</div><div class="lectura">${s.t}</div><p class="pregunta">¿Qué es lo más justo?</p><div class="opciones">${barajar(s.ops.map((o, k) => k)).map((k) => `<button class="op" data-k="${k}">${esc(s.ops[k][0])}</button>`).join('')}</div>`;
      decir(s.t);
      a.querySelectorAll('.op').forEach((b) => b.onclick = () => { const o = s.ops[+b.dataset.k];
        if (o[1]) { ok(); b.classList.add('bien'); a.querySelectorAll('.op').forEach((x) => { x.disabled = true; }); dice('✅ ' + o[2]); if (++i === cfg.escenas.length) setTimeout(fin, 2600); else setTimeout(pon, 2600); }
        else { fallo(); b.classList.remove('mal'); void b.offsetWidth; b.classList.add('mal'); b.disabled = true; dice('🤔 ' + o[2] + ' Prueba otra.'); } }); };
    pon();
  },
  // Teclado numérico: problemas de mates con respuesta escrita
  calcular(a, dice, fin, cfg) {
    let i = 0, v = '';
    const pon = () => { const p = cfg.problemas[i]; v = '';
      a.innerHTML = `<div class="pasos">${cfg.problemas.map((_, k) => `<span class="${k < i ? 'si' : k === i ? 'ya' : ''}"></span>`).join('')}</div><div class="lectura">${p.texto}</div><div class="pantalla" id="pt" aria-live="polite">&nbsp;</div>
       <div class="teclado">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✔'].map((k) => `<button class="op" data-t="${k}">${k}</button>`).join('')}</div>`;
      decir(p.texto);
      a.querySelectorAll('.teclado .op').forEach((b) => b.onclick = () => { const t = b.dataset.t; const pt = $q('#pt', a);
        if (t === '⌫') v = v.slice(0, -1); else if (t === '✔') { if (!v) return;
          if (+v === p.resp) { ok(); dice(p.bien || '¡Exacto!', false); if (++i === cfg.problemas.length) setTimeout(fin, 900); else setTimeout(pon, 900); return; }
          fallo(); dice(p.pista || 'Revisa la cuenta con calma.'); pt.classList.remove('mal'); void pt.offsetWidth; pt.classList.add('mal'); v = ''; }
        else if (v.length < 4) v += t;
        pt.textContent = v || ' '; }); };
    pon();
  },
  // Repartir tareas entre personas para que nadie cargue más
  reparto(a, dice, fin, cfg) {
    const asig = cfg.tareas.map(() => -1); let sel = -1;
    const tot = () => cfg.personas.map((_, j) => cfg.tareas.reduce((s, t, k) => s + (asig[k] === j ? t[2] : 0), 0));
    const dib = () => { const s = tot();
      a.innerHTML = `<div>${cfg.tareas.map((t, k) => `<button class="chip${sel === k ? ' sel' : ''}${asig[k] >= 0 ? ' hecho' : ''}" data-k="${k}" aria-pressed="${sel === k}">${t[0]} ${esc(t[1])} · ${t[2]} min${asig[k] >= 0 ? ' → ' + esc(cfg.personas[asig[k]].n) : ''}</button>`).join('')}</div>
       <div class="personas">${cfg.personas.map((p, j) => `<button class="persona" data-j="${j}">${avSvg(p.sv)}<span>${esc(p.n)}</span><span class="min">${s[j]} min</span></button>`).join('')}</div><button class="gran" id="chk">Comprobar el reparto</button>`;
      a.querySelectorAll('.chip').forEach((c) => c.onclick = () => { sel = +c.dataset.k; dib(); });
      a.querySelectorAll('.persona').forEach((b) => b.onclick = () => { if (sel < 0) { dice('Primero toca una tarea.', false); return; } asig[sel] = +b.dataset.j; sel = -1; dib(); });
      $q('#chk', a).onclick = () => { const s2 = tot(); if (asig.includes(-1)) { dice('Quedan tareas sin repartir.'); return; } const d = Math.max(...s2) - Math.min(...s2);
        if (d <= cfg.tol) { ok(); dice('¡Reparto justo! Nadie carga con mucho más que los demás.'); setTimeout(fin, 1800); }
        else { fallo(); dice(`Hay ${d} minutos de diferencia entre quien más y quien menos tiene. El total es ${s2.reduce((x, y) => x + y, 0)} min: entre ${cfg.personas.length} serían ${Math.round(s2.reduce((x, y) => x + y, 0) / cfg.personas.length)} min cada uno.`); } };
    };
    dib();
  },
  // Cada tarjeta va a un cubo (excusa / razón, mito / verdad…)
  clasificar(a, dice, fin, cfg) {
    const it = barajar(cfg.items); let i = 0;
    const pon = () => { const x = it[i];
      a.innerHTML = `<div class="pasos">${it.map((_, k) => `<span class="${k < i ? 'si' : k === i ? 'ya' : ''}"></span>`).join('')}</div><div class="lectura" style="font-size:22px;text-align:center">${x.t}</div><p class="pregunta">${cfg.pregunta}</p>
       <div class="opciones" style="grid-template-columns:repeat(${cfg.cubos.length},1fr)">${cfg.cubos.map((c) => `<button class="op" data-c="${c.id}">${c.e} ${esc(c.t)}</button>`).join('')}</div>`;
      decir(x.t);
      a.querySelectorAll('.op').forEach((b) => b.onclick = () => { if (b.dataset.c === x.c) { ok(); b.classList.add('bien'); a.querySelectorAll('.op').forEach((y) => { y.disabled = true; }); dice('✅ ' + x.pista, false); if (++i === it.length) setTimeout(fin, 1800); else setTimeout(pon, 1800); } else { fallo(); b.classList.remove('mal'); void b.offsetWidth; b.classList.add('mal'); dice('🤔 ' + x.pista); } }); };
    pon();
  },
  // Ordenar palabras o pasos tocándolos en orden
  ordenar(a, dice, fin, cfg) {
    let r = 0;
    const pon = () => { const R = cfg.rondas[r]; let n = 0;
      a.innerHTML = `<div class="pasos">${cfg.rondas.map((_, k) => `<span class="${k < r ? 'si' : k === r ? 'ya' : ''}"></span>`).join('')}</div><p class="pregunta">${R.texto}</p><div class="salida" id="sal" aria-live="polite">…</div><div>${barajar(R.orden.map((w, k) => k)).map((k) => `<button class="chip" data-k="${k}">${esc(R.orden[k])}</button>`).join('')}</div>`;
      decir(R.texto);
      a.querySelectorAll('.chip').forEach((c) => c.onclick = () => { if (+c.dataset.k === n) { ok(); c.classList.add('hecho'); c.disabled = true; n++; $q('#sal', a).textContent = R.orden.slice(0, n).join(R.junta ?? ' ');
        if (n === R.orden.length) { dice(R.bien || '¡Perfecto!', false); if (++r === cfg.rondas.length) setTimeout(fin, 1200); else setTimeout(pon, 1200); } }
        else { fallo(); c.classList.remove('mal'); void c.offsetWidth; c.classList.add('mal'); dice(R.pista || 'Ese va en otro lugar. ¿Cuál empieza?'); } }); };
    pon();
  },
  // Elegir objetos que sumen justo una cantidad
  suma(a, dice, fin, cfg) {
    let r = 0;
    const pon = () => { const R = cfg.rondas[r], sel = new Set(); const s = () => [...sel].reduce((x, k) => x + R.items[k][1], 0);
      a.innerHTML = `<div class="pasos">${cfg.rondas.map((_, k) => `<span class="${k < r ? 'si' : k === r ? 'ya' : ''}"></span>`).join('')}</div><p class="pregunta">${R.texto}</p><div>${R.items.map((it, k) => `<button class="chip" data-k="${k}" aria-pressed="false">${esc(it[0])} (${it[1]})</button>`).join('')}</div><p class="pregunta">Suma: <b id="sm">0</b> / ${R.meta}</p><button class="gran" id="chk">Comprobar</button>`;
      decir(R.texto);
      a.querySelectorAll('.chip').forEach((c) => c.onclick = () => { const k = +c.dataset.k; sel.has(k) ? sel.delete(k) : sel.add(k); c.classList.toggle('sel'); c.setAttribute('aria-pressed', sel.has(k)); $q('#sm', a).textContent = s(); });
      $q('#chk', a).onclick = () => { const t = s(); if (t === R.meta) { ok(); dice('¡Justo! Ni una de más.', false); if (++r === cfg.rondas.length) setTimeout(fin, 1000); else setTimeout(pon, 1000); } else { fallo(); dice(t < R.meta ? `Faltan ${R.meta - t}. Añade algo.` : `Te pasas ${t - R.meta}. Quita algo.`); } }; };
    pon();
  },
  // Unir parejas: izquierda con derecha
  emparejar(a, dice, fin, cfg) {
    const izq = cfg.pares.map((p, k) => [p[0], k]), der = barajar(cfg.pares.map((p, k) => [p[1], k])); let sel = null, hechos = 0;
    a.innerHTML = `<p class="pregunta">${cfg.texto}</p><div class="dosCol"><div class="opciones">${izq.map((x) => `<button class="op" data-l="${x[1]}">${esc(x[0])}</button>`).join('')}</div><div class="opciones">${der.map((x) => `<button class="op" data-r="${x[1]}">${esc(x[0])}</button>`).join('')}</div></div>`;
    a.querySelectorAll('[data-l]').forEach((b) => b.onclick = () => { if (b.classList.contains('hecho')) return; a.querySelectorAll('[data-l]').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.l; });
    a.querySelectorAll('[data-r]').forEach((b) => b.onclick = () => { if (sel === null || b.classList.contains('hecho')) { dice('Primero toca una de la izquierda.', false); return; }
      if (+b.dataset.r === sel) { ok(); b.classList.add('hecho'); const l = a.querySelector(`[data-l="${sel}"]`); l.classList.remove('sel'); l.classList.add('hecho'); sel = null; if (++hechos === cfg.pares.length) { dice('¡Todas unidas!'); setTimeout(fin, 1300); } }
      else { fallo(); b.classList.remove('mal'); void b.offsetWidth; b.classList.add('mal'); dice('Esas dos no van juntas. Piénsalo otra vez.'); } });
  },
  // Contrarreloj: el agua sube y hay que cruzar la puerta del resultado correcto
  puertas(a, dice, fin, cfg) {
    let i = 0, tm;
    const pon = () => { const q = cfg.gen[i](); clearInterval(tm); let f = 0; const dur = cfg.seg * 1000;
      a.innerHTML = `<div class="pasos">${cfg.gen.map((_, k) => `<span class="${k < i ? 'si' : k === i ? 'ya' : ''}"></span>`).join('')}</div><p class="pregunta" style="font-size:30px">${q.texto}</p><div class="opciones" style="grid-template-columns:repeat(3,1fr)">${barajar(q.ops).map((o) => `<button class="op" style="font-size:26px;min-height:70px" data-o="${o}">🚪 ${o}</button>`).join('')}</div><div class="agua" aria-hidden="true"><i id="ag"></i></div><p class="nota">¡El agua sube!</p>`;
      decir(q.texto.replace('=', 'igual a'), true);
      const t0 = performance.now(); tm = setInterval(() => { f = (performance.now() - t0) / dur; const ag = $q('#ag', a); if (!ag) { clearInterval(tm); return; } ag.style.width = Math.min(100, f * 100) + '%'; if (f >= 1) { clearInterval(tm); fallo(); dice('¡Te alcanzó el agua! Otra vez, con calma.'); pon(); } }, 50);
      a.querySelectorAll('.op').forEach((b) => b.onclick = () => { if (+b.dataset.o === q.c) { clearInterval(tm); ok(); b.classList.add('bien'); a.querySelectorAll('.op').forEach((x) => { x.disabled = true; }); dice('¡Por la puerta correcta!', false); if (++i === cfg.gen.length) setTimeout(fin, 900); else setTimeout(pon, 900); } else { fallo(); b.classList.remove('mal'); void b.offsetWidth; b.classList.add('mal'); b.disabled = true; dice(q.pista); } }); };
    pon();
  },
  // Cinta de tareas (acción): Arturo pone excusas; hay que repartir con justicia
  cinta(a, dice, fin, cfg) {
    const en = { a: 80, c: 80 }; let just = 50, k = 0, bloq = false, tm; const cola = barajar(cfg.tareas).map((t) => ({ ...t, excusa: Math.random() < .6 }));
    const bar = () => `<div style="width:100%"><div class="personas" style="justify-content:space-between"><div class="persona" style="min-width:110px">${avSvg('arturo')}<span>Arturo</span><div class="medidor" style="width:90px"><i id="ea" style="width:${Math.max(0, en.a)}%"></i></div></div><div class="persona" style="min-width:110px">${avSvg('clementina')}<span>Clementina</span><div class="medidor" style="width:90px"><i id="ec" style="width:${Math.max(0, en.c)}%"></i></div></div></div></div>`;
    const pon = () => { if (k >= cola.length) return term(); bloq = false; const t = cola[k], dur = Math.max(3800, 6500 - k * 300);
      a.innerHTML = `${bar()}<div class="cinta"></div><div class="lectura" style="text-align:center"><span style="font-size:48px">${t.e}</span><br><b>${esc(t.n)}</b> · cansa ${t.c}${t.g ? ' (¡muy pesada!)' : ''}</div><div class="agua"><i id="tm" style="width:0;background:var(--ruta)"></i></div>
       <div class="bocadillo" style="visibility:${t.excusa ? 'visible' : 'hidden'}"><b>Arturo:</b> «${esc(uno(cfg.excusas))}»</div><div class="opciones" style="grid-template-columns:repeat(3,1fr)"><button class="op" data-d="a">⬅ Arturo</button><button class="op" data-d="d" style="background:#9be39f">🤝 Los dos</button><button class="op" data-d="c">Clementina ➡</button></div><p class="nota">Justicia: <b id="jt">${just}</b> / ${cfg.meta} · tarea ${k + 1} de ${cola.length}</p>`;
      decir(t.excusa ? 'Arturo dice: ' + 'eso no es cosa mía' : t.n, false);
      const t0 = performance.now(); clearInterval(tm); tm = setInterval(() => { const f = (performance.now() - t0) / dur, el = $q('#tm', a); if (!el) { clearInterval(tm); return; } el.style.width = f * 100 + '%'; if (f >= 1) { clearInterval(tm); juzga(t, null); } }, 40);
      a.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => juzga(t, b.dataset.d)); };
    const juzga = (t, d) => { if (bloq) return; bloq = true; clearInterval(tm); let j = 0, m;
      if (!d) { en.a -= 8; en.c -= 8; j = -6; m = '¡Se acumuló la tarea!'; }
      else if (d === 'd') { en.a -= t.c / 2; en.c -= t.c / 2; j = t.g ? 12 : t.excusa ? 0 : 2; m = t.g ? 'Entre los dos, la pesada se aguanta mejor.' : 'Vale, pero una tarea pequeña también puede hacerla una persona.'; }
      else { en[d] -= t.c; const o = d === 'a' ? 'c' : 'a'; if (t.excusa) { if (d === 'c') { j = -15; m = 'Arturo se ha escaqueado. ¡No es justo!'; } else { j = 14; m = '¡Arturo también sabe hacerlo!'; } } else if (en[d] + t.c >= en[o] - 5) { j = t.g ? -5 : 9; m = t.g ? 'Pesaba demasiado para uno solo.' : 'Bien repartido.'; } else { j = -8; m = 'Estaba más cansad@: mejor el otro.'; } }
      just = Math.max(0, Math.min(100, just + j)); (j > 0 ? ok : sMal)(); dice((j >= 0 ? '+' + j + ' ' : j + ' ') + m);
      if (en.a <= 0 || en.c <= 0) { fallo(); dice('¡Alguien se ha agotado! Cuando una persona carga con todo, acaba sin fuerzas. Otra vez.'); setTimeout(() => { en.a = en.c = 80; just = 50; k = 0; pon(); }, 2200); return; }
      k++; setTimeout(pon, 1700); };
    const term = () => { if (just >= cfg.meta) { dice('¡Jornada justa! Justicia: ' + just); setTimeout(fin, 1200); } else { fallo(); dice('Justicia ' + just + ': hacía falta ' + cfg.meta + '. ¡Otra jornada!'); setTimeout(() => { en.a = en.c = 80; just = 50; k = 0; pon(); }, 2000); } };
    pon();
  }
};
