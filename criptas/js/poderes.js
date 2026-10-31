// =============================================================
//  PODERES DE ADMIN: travesuras para el pueblo
//  Todos los jugadores cargan este módulo para VER los efectos; el panel
//  (🪄) solo se enseña a la cuenta de administrador.
//  Viajan por la misma sala en vivo que las frases: un mensaje con un
//  prefijo que reunion.js separa del chat. Son efectos solo visuales y
//  de sonido: nada toca partidas, fichas ni el reloj del pueblo.
// =============================================================
export const PREFIJO = '\u2063PODER|';
const FUERA = (C) => !C.dentro();

// ---- Los poderes (id → qué hacen). todos: se envían a la sala; si no, solo los ves tú.
export const LISTA = [
  { grupo: '📣 Para todos', items: [
    { id: 'patos', ico: '🦆', t: 'Lluvia de patos', todos: 1 },
    { id: 'ranas', ico: '🐸', t: 'Lluvia de ranas', todos: 1 },
    { id: 'quesos', ico: '🧀', t: 'Lluvia de quesos', todos: 1 },
    { id: 'calabazas', ico: '🎃', t: 'Lluvia de calabazas', todos: 1 },
    { id: 'fuegos', ico: '🎆', t: 'Fuegos artificiales', todos: 1 },
    { id: 'fiesta', ico: '💃', t: 'Fiesta: todos bailan', todos: 1 },
    { id: 'globos', ico: '🎈', t: 'Lluvia de globos', todos: 1 },
    { id: 'gallina', ico: '🐔', t: 'Gallina gigante', todos: 1 },
    { id: 'ovni', ico: '🛸', t: 'Pasa un ovni', todos: 1 },
    { id: 'tortuga', ico: '🐢', t: 'Tortuga voladora', todos: 1 },
    { id: 'enanos', ico: '🍄', t: 'Todos enanitos', todos: 1 },
    { id: 'gigantes', ico: '🗿', t: 'Todos gigantes', todos: 1 },
    { id: 'reves', ico: '🙃', t: 'Mundo del revés', todos: 1 },
    { id: 'arcoiris', ico: '🌈', t: 'Colores locos', todos: 1 },
    { id: 'borroso', ico: '🥴', t: 'Todo borroso', todos: 1 },
    { id: 'viejo', ico: '📽️', t: 'Peli antigua', todos: 1 },
    { id: 'conmigo', ico: '🧲', t: '¡Todos conmigo!', todos: 1 },
    { id: 'plaza', ico: '⛲', t: 'Todos a la plaza', todos: 1 },
    { id: 'playa', ico: '🏖️', t: 'Todos a la playa', todos: 1 },
    { id: 'anuncio', ico: '📢', t: 'Anuncio a voces…', todos: 1, texto: 1 }
  ] },
  { grupo: '🪄 Solo para mí', items: [
    { id: 'vuelo', ico: '🪽', t: 'Volar', local: 1, alterna: 1 },
    { id: 'turbo', ico: '⚡', t: 'Súper velocidad', local: 1, alterna: 1 },
    { id: 'coloso', ico: '👑', t: 'Hacerme enorme', local: 1, alterna: 1 },
    { id: 'minimo', ico: '🔬', t: 'Hacerme diminuto', local: 1, alterna: 1 },
    { id: 'saltarin', ico: '🦘', t: 'Modo saltarín', local: 1, alterna: 1 }
  ] }
];
const TODOS = Object.fromEntries(LISTA.flatMap((g) => g.items).map((i) => [i.id, i]));

export function iniciarPoderes(C) {
  const { THREE, escena, J, PNJ, otros, render } = C;
  const activos = [];                       // efectos en marcha: { upd(dt, t) → true si ha terminado, fin?() }
  const estado = { vuelo: 0, turbo: 0, coloso: 0, minimo: 0, saltarin: 0 };
  let alt = 0, saltoV = 0, saltoY = 0;
  const P = { vel: 1 };

  // ---------- sonido ----------
  let ctx;
  const nota = (f, d = .12, tipo = 'square', v = .04, f2) => {
    try {
      ctx ||= new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipo; o.frequency.value = f; if (f2) o.frequency.linearRampToValueAtTime(f2, ctx.currentTime + d);
      g.gain.value = v; o.connect(g); g.connect(ctx.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + d); o.stop(ctx.currentTime + d);
    } catch { /* sin audio */ }
  };
  const cuac = () => { nota(420, .09, 'sawtooth', .05, 300); setTimeout(() => nota(380, .09, 'sawtooth', .04, 260), 90); };
  const pum = () => nota(160, .35, 'sawtooth', .07, 40);
  const fanfarria = () => [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => nota(f, .2), k * 110));

  // ---------- emojis en 3D ----------
  const TEX = new Map();
  const spriteDe = (e, tam) => {
    let t = TEX.get(e);
    if (!t) { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); x.font = '100px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 72); t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; TEX.set(e, t); }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(tam, tam, 1); escena.add(s); return s;
  };
  const alSuelo = (x, z) => C.sueloEn(x, z);
  const cerca = (r) => { const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * r; return [J.x + Math.cos(a) * d, J.z + Math.sin(a) * d]; };

  // ---------- efectos ----------
  function lluvia(e, n, dur, tam = 1.1, sonido = null) {
    if (!FUERA(C)) return C.aviso('Se oye caer algo ahí fuera…');
    let acum = 0, vivos = [], tiempo = 0;
    activos.push({ upd(dt) {
      tiempo += dt; acum += dt * n / dur;
      while (acum >= 1 && tiempo < dur) { acum--; const [x, z] = cerca(11); const s = spriteDe(e, tam * (.8 + Math.random() * .6)); s.position.set(x, 12 + Math.random() * 6, z); vivos.push({ s, v: 5 + Math.random() * 5, x, z, r: 0 }); if (sonido && Math.random() < .35) sonido(); }
      for (const o of vivos) { if (o.suelo) { o.r -= dt; if (o.r <= 0) { escena.remove(o.s); o.s.material.dispose(); o.muerto = true; } continue; }
        o.s.position.y -= o.v * dt; o.s.material.rotation += dt * (o.v - 7) * .4; const y = alSuelo(o.x, o.z) + .4; if (o.s.position.y <= y) { o.s.position.y = y; o.suelo = true; o.r = .9; } }
      vivos = vivos.filter((o) => !o.muerto);
      return tiempo >= dur && !vivos.length;
    }, fin() { for (const o of vivos) { escena.remove(o.s); o.s.material.dispose(); } } });
  }
  function globos() {
    if (!FUERA(C)) return;
    const cols = ['🎈'], vivos = []; let t0 = 0;
    activos.push({ upd(dt) {
      t0 += dt; if (t0 < 7 && Math.random() < dt * 9) { const [x, z] = cerca(10); const s = spriteDe(cols[0], 1.6); s.position.set(x, alSuelo(x, z) + .5, z); s.material.color.setHSL(Math.random(), .8, .65); vivos.push({ s, v: 1.6 + Math.random() * 1.6, x0: x, f: Math.random() * 6 }); }
      for (const o of vivos) { o.s.position.y += o.v * dt; o.s.position.x = o.x0 + Math.sin(t0 * 1.7 + o.f) * .4; if (o.s.position.y > 26) { escena.remove(o.s); o.s.material.dispose(); o.fuera = true; } }
      for (let i = vivos.length - 1; i >= 0; i--) if (vivos[i].fuera) vivos.splice(i, 1);
      return t0 > 7 && !vivos.length;
    }, fin() { for (const o of vivos) { escena.remove(o.s); o.s.material.dispose(); } } });
    for (let k = 0; k < 4; k++) setTimeout(() => nota(600 + k * 120, .08, 'sine', .05), k * 90);
  }
  function desfile(e, tam, alto, dur, sonido) {
    if (!FUERA(C)) return C.aviso('Algo enorme pasa por encima del tejado…');
    const s = spriteDe(e, tam); let t0 = 0; const z0 = J.z - 7, x0 = J.x, dir = Math.random() < .5 ? 1 : -1;
    if (sonido) sonido();
    activos.push({ upd(dt) { t0 += dt; const f = t0 / dur; s.position.set(x0 + dir * (-45 + 90 * f), alto + Math.sin(f * 12) * .5, z0); s.material.rotation = Math.sin(f * 20) * .12; if (sonido && Math.random() < dt * .8) sonido(); if (f >= 1) { escena.remove(s); s.material.dispose(); return true; } return false; }, fin() { escena.remove(s); s.material.dispose(); } });
  }
  function fuegos() {
    if (!FUERA(C)) return C.aviso('Se oyen fuegos artificiales fuera…');
    let t0 = 0, siguiente = 0; const nubes = [];
    activos.push({ upd(dt) {
      t0 += dt;
      if (t0 > siguiente && siguiente < 7) { siguiente += .7 + Math.random() * .4; const cx = J.x + (Math.random() - .5) * 18, cz = J.z - 4 - Math.random() * 8, cy = 11 + Math.random() * 4;
        const n = 70, pos = new Float32Array(n * 3), vel = []; const col = new THREE.Color().setHSL(Math.random(), 1, .6);
        for (let i = 0; i < n; i++) { pos.set([cx, cy, cz], i * 3); const a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1), v = 4 + Math.random() * 3; vel.push([Math.sin(b) * Math.cos(a) * v, Math.cos(b) * v, Math.sin(b) * Math.sin(a) * v]); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const m = new THREE.PointsMaterial({ color: col, size: .45, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
        const pts = new THREE.Points(g, m); pts.frustumCulled = false; escena.add(pts); nubes.push({ pts, g, m, vel, edad: 0 }); pum(); }
      for (const f of nubes) { f.edad += dt; const p = f.g.attributes.position; for (let i = 0; i < f.vel.length; i++) { f.vel[i][1] -= 4 * dt; p.array[i * 3] += f.vel[i][0] * dt; p.array[i * 3 + 1] += f.vel[i][1] * dt; p.array[i * 3 + 2] += f.vel[i][2] * dt; } p.needsUpdate = true; f.m.opacity = Math.max(0, 1 - f.edad / 1.7); }
      for (const f of nubes) if (f.edad > 1.7) { escena.remove(f.pts); f.g.dispose(); f.m.dispose(); f.muerto = true; }
      for (let i = nubes.length - 1; i >= 0; i--) if (nubes[i].muerto) nubes.splice(i, 1);
      return t0 > 9 && !nubes.length;
    }, fin() { for (const f of nubes) { escena.remove(f.pts); f.g.dispose(); f.m.dispose(); } } });
  }
  function fiesta() {
    const todos = () => [J.ch, ...PNJ.map((p) => p.ch), ...[...otros.values()].map((o) => o.ch)].filter(Boolean);
    const luz = new THREE.PointLight('#ff40c0', 60, 45, 1.4); escena.add(luz); let t0 = 0, sig = 0; const escala = [0, 4, 7, 9, 12, 9, 7, 4];
    activos.push({ upd(dt, t) {
      t0 += dt; luz.color.setHSL((t0 * .6) % 1, 1, .55); luz.position.set(J.x, 7, J.z + 1); luz.intensity = 55 + Math.sin(t0 * 9) * 15;
      if (t0 > sig) { sig += .21; nota(330 * Math.pow(2, escala[Math.floor(t0 / .21) % 8] / 12), .16, 'triangle', .05); }
      if (!C.dentro()) [J.ch, ...PNJ.map((p) => p.ch)].forEach((ch, i) => { ch.position.y = alSuelo(ch.position.x, ch.position.z) + Math.abs(Math.sin(t * 8 + i)) * .55; ch.rotation.z = Math.sin(t * 8 + i) * .22; if (ch !== J.ch) ch.rotation.y += dt * 4; });
      const fin = t0 > 14; if (fin) todos().forEach((ch) => { ch.rotation.z = 0; }); return fin;
    }, tarde(dt, t) { if (!C.dentro()) [...otros.values()].forEach((o, i) => { const ch = o.ch; if (!ch) return; ch.position.y = alSuelo(ch.position.x, ch.position.z) + Math.abs(Math.sin(t * 8 + i + 3)) * .55; ch.rotation.z = Math.sin(t * 8 + i + 3) * .22; ch.rotation.y += dt * 4; }); }, fin() { escena.remove(luz); luz.dispose?.(); todos().forEach((ch) => { ch.rotation.z = 0; }); } });
  }
  let escalaGlobal = 1, escalaVista = 1;
  function escalar(f, dur) {
    let t0 = 0; nota(f > 1 ? 120 : 700, .5, 'sine', .08, f > 1 ? 90 : 1100); escalaGlobal = f;
    activos.push({ escala: 1, upd(dt) { t0 += dt; if (t0 > dur) { escalaGlobal = 1; return true; } return false; }, fin() { escalaGlobal = 1; } });
  }
  function filtro(css, dur, anim) {
    const cv = render.domElement; let t0 = 0; const fin = () => { cv.style.filter = ''; cv.style.transform = ''; cv.style.transition = ''; };
    activos.push({ upd(dt) { t0 += dt; anim ? anim(cv, t0, dt) : css(cv); if (t0 > dur) { fin(); return true; } return false; }, fin });
    nota(250, .3, 'sine', .06, 600);
  }
  function anuncio(txt) {
    const t = String(txt || '').slice(0, 100); if (!t) return;
    let el = document.getElementById('pod-anuncio'); if (!el) { el = document.createElement('div'); el.id = 'pod-anuncio'; document.body.appendChild(el); }
    el.textContent = '📢 ' + t; el.className = 'ver'; clearTimeout(anuncio.t); anuncio.t = setTimeout(() => { el.className = ''; }, 7000); fanfarria();
  }
  function teleportar(x, z, texto) {
    if (C.dentro()) return C.aviso('Notas un tirón, pero estás a cubierto.');
    for (let k = 0; k < 12; k++) { const nx = x + (Math.random() - .5) * 3.5, nz = z + (Math.random() - .5) * 3.5; if (C.libre(nx, nz)) { J.x = nx; J.z = nz; J.ir = null; break; } }
    nota(900, .25, 'sine', .06, 200); C.aviso(texto);
  }

  // ---------- ejecutar un poder (aquí, venga de quien venga) ----------
  function ejecutar(id, arg, deId) {
    switch (id) {
      case 'patos': lluvia('🦆', 40, 8, 1.2, cuac); break;
      case 'ranas': lluvia('🐸', 40, 8, 1.1, () => nota(180, .08, 'square', .04, 260)); break;
      case 'quesos': lluvia('🧀', 40, 8, 1.1, () => nota(880, .06, 'sine', .04)); break;
      case 'calabazas': lluvia('🎃', 36, 8, 1.3, () => nota(110, .12, 'triangle', .06)); break;
      case 'globos': globos(); break;
      case 'fuegos': fuegos(); break;
      case 'fiesta': fiesta(); break;
      case 'gallina': desfile('🐔', 10, 5.5, 9, () => { nota(700, .1, 'sawtooth', .05, 420); }); C.aviso('🐔 ¡COCOROCÓÓÓ!'); break;
      case 'ovni': desfile('🛸', 9, 11, 8, () => nota(300 + Math.random() * 200, .2, 'sine', .04, 900)); C.aviso('🛸 …Hola, humanos.'); break;
      case 'tortuga': desfile('🐢', 12, 8.5, 10, () => nota(120, .3, 'sine', .05)); C.aviso('🐢 Morrandar tiene primos, parece.'); break;
      case 'enanos': escalar(.45, 14); C.aviso('🍄 Todos se han encogido…'); break;
      case 'gigantes': escalar(2.4, 14); C.aviso('🗿 ¡Todos han crecido!'); break;
      case 'reves': filtro(null, 10, (cv, t) => { cv.style.transition = 'transform .6s'; cv.style.transform = 'rotate(180deg)'; }); C.aviso('🙃 El mundo está del revés'); break;
      case 'arcoiris': filtro(null, 14, (cv, t) => { cv.style.filter = `hue-rotate(${(t * 140) % 360}deg) saturate(1.8)`; }); C.aviso('🌈 ¡Los colores se han vuelto locos!'); break;
      case 'borroso': filtro(null, 8, (cv, t) => { cv.style.filter = `blur(${3 + Math.sin(t * 3) * 3}px)`; }); C.aviso('🥴 Qué mareo…'); break;
      case 'viejo': filtro(null, 12, (cv) => { cv.style.filter = 'grayscale(1) sepia(.5) contrast(1.25) brightness(.95)'; }); C.aviso('📽️ Cine mudo'); break;
      case 'conmigo': { const g = C.getR()?.gente?.()[deId]; if (g && g.donde === 'pueblo' && deId !== C.getR()?.yo.id) teleportar(g.x, g.z, '🧲 ¡Te han llamado! Todos con el admin'); break; }
      case 'plaza': if (deId !== C.getR()?.yo.id || !C.getR()) teleportar(C.PLAZA.x, C.PLAZA.z, '⛲ ¡A la plaza!'); break;
      case 'playa': teleportar(0, 19, '🏖️ ¡A la playa!'); break;
      case 'anuncio': anuncio(arg); break;
      case 'vuelo': case 'turbo': case 'coloso': case 'minimo': case 'saltarin': alternar(id); break;
    }
  }
  function alternar(id) {
    estado[id] = estado[id] ? 0 : 1;
    if (id === 'coloso' && estado.coloso) estado.minimo = 0; if (id === 'minimo' && estado.minimo) estado.coloso = 0;
    P.vel = estado.turbo ? 2.6 : 1;
    C.aviso({ vuelo: estado.vuelo ? '🪽 ¡Vuelas!' : 'Vuelves al suelo', turbo: estado.turbo ? '⚡ Súper velocidad' : 'Velocidad normal', coloso: estado.coloso ? '👑 Eres enorme' : 'Tamaño normal', minimo: estado.minimo ? '🔬 Eres diminuto' : 'Tamaño normal', saltarin: estado.saltarin ? '🦘 ¡Salta con la barra!' : 'Se acabó el salto' }[id]);
    nota(estado[id] ? 700 : 400, .15, 'sine', .06, estado[id] ? 1000 : 250); pintarPanel();
  }

  // ---------- recibir de la sala ----------
  function recibir(deId, texto) {
    let m; try { m = JSON.parse(texto); } catch { return; }
    if (!m || !TODOS[m.p] || !TODOS[m.p].todos) return;      // solo los poderes «para todos» viajan
    if (deId === C.getR()?.yo.id) return;                    // el mío ya se ejecutó al pulsarlo
    ejecutar(m.p, String(m.a || '').slice(0, 100), deId);
  }
  function lanzar(id, arg) {
    const p = TODOS[id]; if (!p) return;
    ejecutar(id, arg, C.getR()?.yo.id);
    if (p.todos && C.getR()) C.getR().poder({ p: id, a: arg || undefined }); else if (p.todos) C.aviso('Sin sala: solo lo ves tú');
  }

  // ---------- cada fotograma (al final del bucle, tras mover a todos) ----------
  function tick(dt, t) {
    for (let i = activos.length - 1; i >= 0; i--) { let fin = false; try { fin = activos[i].upd(dt, t); } catch { fin = true; } if (fin) { activos[i].fin?.(); activos.splice(i, 1); } }
    // poderes personales
    const ch = J.ch;
    alt += ((estado.vuelo ? 3.2 + Math.sin(t * 2.2) * .35 : 0) - alt) * (1 - Math.exp(-4 * dt));
    if (estado.saltarin) { if (saltoY <= 0 && C.teclas.has(' ')) saltoV = 7.2; saltoV -= 18 * dt; saltoY = Math.max(0, saltoY + saltoV * dt); if (saltoY === 0) saltoV = 0; } else { saltoY = 0; saltoV = 0; }
    if (!C.dentro() || alt > .05 || saltoY > 0) ch.position.y += alt + saltoY;
    const k = estado.coloso ? 2.8 : estado.minimo ? .4 : escalaGlobal;
    if (escalaGlobal !== 1 || escalaVista !== 1) for (const o of [...PNJ.map((p) => p.ch), ...[...otros.values()].map((a) => a.ch)]) if (o) o.scale.setScalar(escalaGlobal);
    escalaVista = escalaGlobal; if (ch.scale.x !== k) ch.scale.setScalar(k);
    return P;
  }

  const tarde = (dt, t) => { for (const a of activos) a.tarde?.(dt, t); };

  // ---------- el panel (solo admin) ----------
  let panel = null, boton = null;
  function pintarPanel() {
    if (!panel) return;
    panel.querySelectorAll('[data-alt]').forEach((b) => b.classList.toggle('on', !!estado[b.dataset.alt]));
  }
  function montarPanel() {
    if (panel) return;
    const css = document.createElement('style');
    css.textContent = `#pod-boton{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:30;width:54px;height:54px;border-radius:50%;border:0;background:#7a4ab8;color:#fff;font-size:26px;box-shadow:0 4px 0 rgba(0,0,0,.3);cursor:pointer}
    #pod-panel{position:fixed;left:12px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:30;width:min(340px,calc(100vw - 24px));max-height:min(70vh,520px);overflow:auto;background:#fff6e0;color:#4a3626;border-radius:20px;padding:12px;box-shadow:0 8px 0 rgba(0,0,0,.25);display:none}
    #pod-panel.abierto{display:block}#pod-panel h3{margin:6px 2px 6px;font-size:15px}
    #pod-panel .rej{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    #pod-panel button{font:700 14px/1.15 inherit;font-family:inherit;background:#fff;border:0;border-radius:12px;padding:9px 8px;box-shadow:0 3px 0 #d8c28a;cursor:pointer;text-align:left;color:#4a3626}
    #pod-panel button:active{transform:translateY(2px)}#pod-panel button.on{background:#d4a43a;color:#fff}
    #pod-panel .nota{font-size:12.5px;margin:4px 2px;opacity:.8}
    #pod-anuncio{position:fixed;top:14%;left:50%;transform:translate(-50%,-30px);opacity:0;z-index:40;background:#c8372d;color:#fff;font:800 clamp(18px,4vw,30px)/1.15 inherit;font-family:inherit;padding:12px 22px;border-radius:18px;box-shadow:0 8px 0 rgba(0,0,0,.3);max-width:90vw;text-align:center;pointer-events:none;transition:all .35s}
    #pod-anuncio.ver{opacity:1;transform:translate(-50%,0)}`;
    document.head.appendChild(css);
    boton = document.createElement('button'); boton.id = 'pod-boton'; boton.textContent = '🪄'; boton.setAttribute('aria-label', 'Poderes de administrador'); document.body.appendChild(boton);
    panel = document.createElement('div'); panel.id = 'pod-panel';
    panel.innerHTML = `<div class="nota">Poderes de administrador. Los de «para todos» los ven los que estén contigo en la sala.</div>` +
      LISTA.map((g) => `<h3>${g.grupo}</h3><div class="rej">${g.items.map((i) => `<button data-p="${i.id}"${i.alterna ? ` data-alt="${i.id}"` : ''}>${i.ico} ${i.t}</button>`).join('')}</div>`).join('');
    document.body.appendChild(panel);
    for (const el of [panel, boton]) ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'keydown', 'keyup', 'click'].forEach((e) => el.addEventListener(e, (ev) => ev.stopPropagation()));
    boton.addEventListener('click', () => panel.classList.toggle('abierto'));
    let ultimo = 0;
    panel.addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]'); if (!b) return; if (performance.now() - ultimo < 500) return; ultimo = performance.now();
      const id = b.dataset.p; let arg;
      if (TODOS[id].texto) { arg = prompt('¿Qué quieres anunciar a todos?'); if (!arg) return; }
      lanzar(id, arg); if (TODOS[id].alterna) pintarPanel();
    });
  }
  return { recibir, tick, tarde, montarPanel, lanzar, P, estado, activos };
}
