// =============================================================
//  VIDA: lo que hace que el colegio se sienta un pueblo vivo.
//  Mundo curvo, hora real (día, tarde, noche), nubes, mariposas y
//  luciérnagas, personajes chibi que andan, vecinos con horario y
//  charla que se acuerda de ti, el jardín de «Mi rincón» y las
//  celebraciones del profe. main.js solo llama a iniciarVida() y tick().
// =============================================================
import * as THREE from './vendor/three.module.min.js';

// ---------- El mundo se curva hacia el horizonte (como un tronco que rueda) ----------
export const CURVA = { k: { value: 0.0062 }, z: { value: 0 } };
export function curvar(m) {
  m.onBeforeCompile = (s) => {
    s.uniforms.uCurva = CURVA.k; s.uniforms.uAncla = CURVA.z;
    s.vertexShader = 'uniform float uCurva;\nuniform float uAncla;\n' + s.vertexShader.replace('#include <project_vertex>', `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
  vec4 wpC = modelMatrix * mvPosition; float dzC = wpC.z - uAncla; wpC.y -= dzC * dzC * uCurva;
  mvPosition = viewMatrix * wpC; gl_Position = projectionMatrix * mvPosition;`);
  };
  return m;
}
const bajada = (z) => (z - CURVA.z.value) ** 2 * CURVA.k.value;

// ---------- Personajes chibi ----------
export function chibi(mat, { camiseta = '#cb7653', piel = '#f1c39a', pelo = '#5a3b2a', pantalon = '#3e5265' } = {}) {
  const g = new THREE.Group(), u = { fase: 0 };
  const m = (geo, color, x, y, z) => { const o = new THREE.Mesh(geo, mat(color)); o.position.set(x, y, z); o.castShadow = true; return o; };
  const cuerpo = new THREE.Group(); g.add(cuerpo);
  cuerpo.add(m(new THREE.CylinderGeometry(.34, .44, .72, 12), camiseta, 0, .78, 0));
  const cabeza = new THREE.Group(); cabeza.position.y = 1.55; cuerpo.add(cabeza);
  cabeza.add(m(new THREE.SphereGeometry(.62, 18, 14), piel, 0, 0, 0));
  const pel = m(new THREE.SphereGeometry(.65, 18, 12, 0, Math.PI * 2, 0, Math.PI * .52), pelo, 0, .06, -.02); pel.rotation.x = -.18; cabeza.add(pel);
  for (const s of [-1, 1]) {
    const ojo = m(new THREE.SphereGeometry(.085, 10, 8), '#2b2b33', s * .22, -.05, .56); ojo.scale.set(1, 1.35, .6); cabeza.add(ojo);
    const brillo = m(new THREE.SphereGeometry(.03, 6, 5), '#ffffff', s * .22 + .03, 0, .61); cabeza.add(brillo);
    const mof = m(new THREE.SphereGeometry(.09, 10, 8), '#f59a9a', s * .36, -.2, .5); mof.scale.set(1, .6, .3); cabeza.add(mof);
  }
  const boca = m(new THREE.TorusGeometry(.07, .018, 6, 12, Math.PI), '#7a3b2a', 0, -.24, .58); boca.rotation.z = Math.PI; cabeza.add(boca);
  const brazos = [], piernas = [];
  for (const s of [-1, 1]) {
    const hombro = new THREE.Group(); hombro.position.set(s * .43, 1.05, 0); cuerpo.add(hombro);
    hombro.add(m(new THREE.CylinderGeometry(.1, .11, .5, 8), camiseta, 0, -.22, 0));
    hombro.add(m(new THREE.SphereGeometry(.11, 8, 6), piel, 0, -.5, 0)); brazos.push(hombro);
    const cadera = new THREE.Group(); cadera.position.set(s * .17, .44, 0); g.add(cadera);
    cadera.add(m(new THREE.CylinderGeometry(.12, .12, .36, 8), pantalon, 0, -.18, 0));
    const zap = m(new THREE.BoxGeometry(.2, .1, .3), '#3a2a22', 0, -.38, .05); cadera.add(zap); piernas.push(cadera);
  }
  Object.assign(u, { cuerpo, cabeza, brazos, piernas }); g.userData.chibi = u;
  return g;
}
function animarChibi(g, dt, anda, t) {
  const u = g.userData.chibi; if (!u) return;
  u.fase += dt * (anda ? 11 : 0);
  const a = anda ? Math.sin(u.fase) * .65 : 0;
  u.piernas[0].rotation.x = a; u.piernas[1].rotation.x = -a;
  u.brazos[0].rotation.x = -a * .8; u.brazos[1].rotation.x = a * .8;
  u.cuerpo.position.y = anda ? Math.abs(Math.sin(u.fase)) * .08 : Math.sin(t * 2.2 + g.id) * .015;
  u.cabeza.rotation.z = anda ? Math.sin(u.fase) * .05 : Math.sin(t * .9 + g.id) * .04;
}

// ---------- Hora real ----------
const prm = new URLSearchParams(location.search);
const horaAhora = () => { if (prm.has('hora')) return Number(prm.get('hora')); const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const CIELO = [[0, '#121a36'], [5, '#1a2244'], [6.3, '#e9a07a'], [7.6, '#a6dce9'], [18, '#a6dce9'], [19.5, '#f39468'], [20.6, '#4a3f7a'], [21.6, '#1c2750'], [24, '#121a36']];
function colorCielo(h, out) {
  for (let i = 0; i < CIELO.length - 1; i++) { const [a, x] = CIELO[i], [b, y] = CIELO[i + 1]; if (h >= a && h <= b) return out.set(x).lerp(new THREE.Color(y), (h - a) / (b - a)); }
  return out.set(CIELO[0][1]);
}
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function momentoEscolar(h, dia) {
  if (dia === 0 || dia === 6) return 'fin de semana';
  if (h < 9) return 'antes de clase'; if (h < 11.5) return 'en clase'; if (h < 12) return 'recreo';
  if (h < 14) return 'en clase'; if (h < 16) return 'comedor'; if (h < 20) return 'tarde libre'; return 'noche';
}

// ---------- Los vecinos: horario, aspecto y charla ----------
const VECINOS = {
  owl: {
    nombre: '🦉 Olivia, la bibliotecaria', pelo: '#3a2a3a',
    plan: (h) => h >= 8 && h < 17 ? { pts: [[-3, -15.5], [2.5, -15.5], [0, -14]], estado: 'ordenando libros' } : h >= 17 && h < 20 ? { pts: [[-8, 7.4]], estado: 'leyendo en el banco' } : null,
    manana: ['¡Buenos días! He puesto libros nuevos en la estantería de aventuras.', 'Temprano y ya por aquí. Así me gusta.'],
    tarde: ['Las tardes son para leer sin prisa. ¿Te lo había dicho?', 'Hoy he tenido la biblioteca llena. ¡Qué gusto!'],
    noche: ['¿Tú por aquí a estas horas? Los libros también duermen, ¿eh?'],
    amiga: ['Te guardo siempre el mejor sitio junto a la ventana.', 'Cuando termines este libro, tengo uno que te va a encantar.'],
    murmullos: ['Shhh… 📚', 'A ver dónde va este…', '¡Libros nuevos!', 'Mmm, qué olor a papel']
  },
  caretaker: {
    nombre: '🔑 Tomás, el conserje', pelo: '#8a8a8a',
    plan: (h) => h >= 7 && h < 21 ? { pts: [[-10, -7], [10, -7], [10, 8.5], [-10, 8.5]], estado: 'haciendo la ronda' } : { pts: [[0, 31.8], [3, 31.8]], estado: 'vigilando con su farol' },
    manana: ['¡Arriba esos ánimos! He regado las macetas antes de que llegaras.', 'Las llaves, las llaves… ¡ah, aquí están!'],
    tarde: ['Las farolas las enciendo yo, ¿sabes? Bueno, se encienden solas, pero yo miro.', 'Hoy alguien ha dejado una mochila en el patio. Otra vez.'],
    noche: ['De noche el cole hace ruiditos. No pasa nada: son las tuberías. Creo.', 'Vete a casa, que mañana hay cole.'],
    amiga: ['Tú eres de los que dejan el patio limpio. Me fijo, ¿eh?', 'Te voy a contar un secreto: la fuente canta si le silbas.'],
    murmullos: ['Tralarí…', '¿Quién ha dejado esto aquí?', '🔑 clinc, clinc', '¡Esas carreras!']
  },
  cook: {
    nombre: '🥘 Rosa, la cocinera', pelo: '#a0522d',
    plan: (h) => h >= 7 && h < 11 ? { pts: [[-29, 29], [-26, 29]], estado: 'recogiendo del huerto' } : h >= 11 && h < 16 ? { pts: [[-23, 17], [-20, 16.6]], estado: 'en el comedor' } : h >= 16 && h < 20.5 ? { pts: [[8, 7.4]], estado: 'descansando en el banco' } : null,
    manana: ['¡Mira qué tomates! Hoy hay ensalada, y no acepto quejas.', 'Madrugar en el huerto es lo mejor del día.'],
    tarde: ['Qué día más largo. Me siento un ratito, ¿vale?', 'Hoy ha sobrado arroz. Nunca sobra arroz. ¿Qué ha pasado?'],
    noche: ['La cocina está cerrada, cielo. Mañana más.'],
    amiga: ['A ti te pongo siempre un poquito más de postre. Que no se entere nadie.', '¿Me ayudas mañana a recoger zanahorias del huerto?'],
    murmullos: ['🍅 ¡Qué tomates!', 'Ñam…', '¿Y la sal?', 'Huele a croquetas']
  }
};
const NOMBRES_TESORO = (t) => String(t).replace(/^\S+\s/, '');

// =============================================================
export function iniciarVida(C) {
  const { scene, camera, player, npcs, save, persist, mat, sun, hemi, luces } = C;
  save.amistad ??= {}; save.vistoHoy ??= {}; save.rincon ??= [null, null, null, null, null, null];
  const huecosRincon = () => (C.rincon ? C.rincon() : save.rincon);
  const hoy = new Date().toDateString();

  // ---------- cielo, estrellas, luna, halos ----------
  const cielo = new THREE.Color();
  const estrellas = (() => {
    const n = 380, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const az = (Math.random() - .5) * Math.PI * 1.6, el = -.5 + Math.random() * .9, r = 150; pos.set([Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, -Math.cos(az) * Math.cos(el) * r], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#fff8e0', size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); scene.add(p); return p;
  })();
  const texHalo = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,225,150,1)'); gr.addColorStop(.4, 'rgba(255,200,110,.45)'); gr.addColorStop(1, 'rgba(255,190,90,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const matHalo = new THREE.SpriteMaterial({ map: texHalo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 });
  const halos = luces.lamparas.map((l) => { const s = new THREE.Sprite(matHalo); s.scale.setScalar(4); s.userData.l = l; scene.add(s); return s; });
  const luna = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const gr = x.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,230,.5)'); gr.addColorStop(1, 'rgba(255,250,230,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); x.fillStyle = '#fff6dc'; x.beginPath(); x.arc(64, 64, 26, 0, 6.29); x.fill(); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, fog: false, opacity: 0 })); s.scale.setScalar(22); scene.add(s); return s; })();
  for (const l of [...luces.lamparas, ...luces.bombillas]) l.material.emissive = new THREE.Color('#ffcf70');
  for (const v of luces.ventanas) v.material.emissive = new THREE.Color('#ffc760');

  // ---------- nubes ----------
  const nubes = [];
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group(); const m = curvar(new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: .35 }));
    for (const [x, y, r] of [[0, 0, 2.2], [2.2, -.3, 1.7], [-2, -.4, 1.6], [.9, .9, 1.5]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), m); s.position.set(x, y, 0); s.scale.y = .7; g.add(s); }
    g.position.set(-60 + Math.random() * 120, 20 + Math.random() * 7, -45 + Math.random() * 80); g.userData.v = .6 + Math.random() * .8; g.userData.m = m; scene.add(g); nubes.push(g);
  }
  // ---------- mariposas (de día) y luciérnagas (de noche) ----------
  const mariposas = [];
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group(), col = ['#ffd3e8', '#ffe27a', '#c9b6ff', '#ffffff'][i % 4];
    for (const s of [-1, 1]) { const ala = new THREE.Mesh(new THREE.PlaneGeometry(.32, .24), curvar(new THREE.MeshLambertMaterial({ color: col, side: THREE.DoubleSide }))); ala.position.x = s * .16; const p = new THREE.Group(); p.add(ala); g.add(p); }
    const base = [[-10, -8], [10, -8], [-10, 9], [10, 9], [-28, 31], [-18, 25], [18, 25], [-30, 30], [5, 20]][i];
    g.userData = { cx: base[0], cz: base[1], fase: Math.random() * 6 }; scene.add(g); mariposas.push(g);
  }
  const lucis = (() => {
    const n = 70, pos = new Float32Array(n * 3), o = [];
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, r = 8 + Math.random() * 30; o.push([Math.cos(a) * r, .6 + Math.random() * 2, Math.sin(a) * r, Math.random() * 6]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#e8ff8a', size: .22, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); p.frustumCulled = false; p.userData.o = o; scene.add(p); return p;
  })();

  // ---------- vecinos: aspecto, horario, globos de texto ----------
  const vec = npcs.filter((n) => VECINOS[n.kind]).map((n) => {
    const V = VECINOS[n.kind], mesh = n.mesh, cab = mesh.userData.chibi.cabeza;
    // el pelo de cada uno y su detalle
    cab.children.forEach((c) => { if (c.geometry?.parameters?.phiLength === Math.PI * 2 && c.geometry.parameters.thetaLength < 2) c.material = mat(V.pelo); });
    if (n.kind === 'owl') { const mono = new THREE.Mesh(new THREE.SphereGeometry(.24, 10, 8), mat(V.pelo)); mono.position.set(0, .45, -.45); cab.add(mono); for (const s of [-1, 1]) { const g = new THREE.Mesh(new THREE.TorusGeometry(.12, .025, 6, 16), mat('#3a2a22')); g.position.set(s * .22, -.05, .6); cab.add(g); } }
    if (n.kind === 'caretaker') { const gorra = new THREE.Mesh(new THREE.CylinderGeometry(.6, .62, .22, 16), mat('#3f5f8a')); gorra.position.y = .45; cab.add(gorra); const vis = new THREE.Mesh(new THREE.BoxGeometry(.55, .05, .35), mat('#2f4a6a')); vis.position.set(0, .36, .55); cab.add(vis); }
    if (n.kind === 'cook') { const gorro = new THREE.Mesh(new THREE.CylinderGeometry(.42, .38, .45, 14), mat('#ffffff')); gorro.position.y = .62; cab.add(gorro); const top = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 9), mat('#ffffff')); top.position.y = .95; top.scale.y = .6; cab.add(top); }
    let farol = null;
    if (n.kind === 'caretaker') { farol = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), mat('#ffe2a0')); farol.material.emissive = new THREE.Color('#ffc760'); farol.position.set(0, -.55, .1); mesh.userData.chibi.brazos[1].add(farol); }
    const globo = document.createElement('div'); globo.className = 'globo'; globo.hidden = true; document.body.appendChild(globo);
    return { n, V, mesh, farol, globo, i: 0, espera: 0, visible: true, plan: null, hasta: 0, antes: mesh.position.clone() };
  });
  const yoAntes = player.position.clone();

  // ---------- charla (se acuerda de ti) ----------
  const franja = (h) => (h < 12 ? 'manana' : h < 20 ? 'tarde' : 'noche');
  const uno = (l) => l[Math.floor(Math.random() * l.length)];
  function charla(kind) {
    const v = vec.find((x) => x.n.kind === kind); const V = VECINOS[kind]; if (!V) return '';
    const h = horaAhora(), primera = save.vistoHoy[kind] !== hoy;
    if (primera) { save.vistoHoy[kind] = hoy; save.amistad[kind] = (save.amistad[kind] || 0) + 1; persist(); }
    const am = save.amistad[kind] || 0, cor = '♥'.repeat(Math.min(5, Math.ceil(am / 2))) + '♡'.repeat(5 - Math.min(5, Math.ceil(am / 2)));
    const lineas = [primera ? uno(V[franja(h)]) : uno(['¿Otra vez por aquí? ¡Qué alegría!', '¿Necesitas algo más?', 'Aquí sigo, ya ves.'])];
    // recuerdos: lo que llevas leído y lo que has ganado
    for (const x of (C.charlaExtra?.(kind) || [])) lineas.push(x);
    if (am >= 4) lineas.push(uno(V.amiga));
    const est = v?.plan?.estado ? `<p class="muted">Ahora está ${v.plan.estado}.</p>` : '';
    return `<h1>${V.nombre}</h1><p class="corazones" title="Amistad">${cor}</p>${lineas.map((l) => `<p class="dialogo">${l}</p>`).join('')}${est}${kind === 'owl' ? '<button class="action primary" id="goLibrary">📚 Ir a la biblioteca</button>' : ''}`;
  }

  // ---------- Mi rincón: el jardín donde colocas lo que ganas ----------
  const rincon = new THREE.Group(); scene.add(rincon);
  const HUECOS = [35.2, 37.2, 39.2].flatMap((z) => [-4.2, -1.4, 1.4, 4.2].map((x) => [x, z]));   // 12 huecos: se ven los 12 más recientes
  { const valla = mat('#f1e6cf'); for (const [x, z, w, d] of [[0, 34, 11.5, .15], [0, 40.2, 11.5, .15], [-5.75, 37.1, .15, 6.2], [5.75, 37.1, .15, 6.2]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, .5, d, Math.ceil(w), 1, Math.ceil(d)), valla); b.position.set(x, .25, z); scene.add(b); } const cesped = new THREE.Mesh(new THREE.BoxGeometry(11.4, .06, 6.1, 10, 1, 6), mat('#8fcf7a')); cesped.position.set(0, .05, 37.1); scene.add(cesped); }
  const texEmoji = new Map();
  const cartel = (e) => { let t = texEmoji.get(e); if (!t) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.font = '96px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 70); t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; texEmoji.set(e, t); } const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), curvar(new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }))); return m; };
  function modelo(id) {
    const g = new THREE.Group(), p = (geo, c, x, y, z) => { const o = new THREE.Mesh(geo, mat(c)); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    if (id === 'plant') { p(new THREE.CylinderGeometry(.4, .3, .6, 12), '#c0704a', 0, .3, 0); p(new THREE.SphereGeometry(.6, 10, 8), '#5aa957', 0, 1, 0); p(new THREE.SphereGeometry(.15, 8, 6), '#ffd6e5', .3, 1.4, .3); }
    else if (id === 'lamp') { p(new THREE.CylinderGeometry(.06, .08, 2, 8), '#5e5550', 0, 1, 0); const b = p(new THREE.SphereGeometry(.3, 10, 8), '#fff3bb', 0, 2.1, 0); b.material.emissive = new THREE.Color('#ffcf70'); luces.rincon.push(b); }
    else if (id === 'owl') { p(new THREE.SphereGeometry(.45, 12, 10), '#9a7a5a', 0, .5, 0).scale.y = 1.2; for (const s of [-1, 1]) { p(new THREE.SphereGeometry(.14, 8, 6), '#ffffff', s * .16, .72, .36); p(new THREE.SphereGeometry(.07, 6, 5), '#2b2b33', s * .16, .72, .48); } p(new THREE.ConeGeometry(.07, .16, 6), '#f2b84b', 0, .58, .44).rotation.x = Math.PI / 2; }
    else if (id === 'cape') { p(new THREE.CylinderGeometry(.05, .05, 1.4, 6), '#5e5550', 0, .7, 0); p(new THREE.SphereGeometry(.22, 8, 6), '#e9d8ae', 0, 1.55, 0); const c = p(new THREE.ConeGeometry(.55, 1.1, 12, 1, true), '#c8372d', 0, 1.0, 0); c.material.side = THREE.DoubleSide; }
    else { p(new THREE.CylinderGeometry(.45, .5, .5, 10), '#c5a17b', 0, .25, 0); const e = cartel(String(id).split(' ')[0]); e.position.y = 1.2; g.add(e); }
    return g;
  }
  function pintarRincon() {
    luces.rincon.length = 0;
    for (const c of [...rincon.children]) rincon.remove(c);
    huecosRincon().slice(-HUECOS.length).forEach((id, i) => { if (!id) return; const m = modelo(id); m.position.set(HUECOS[i][0], 0, HUECOS[i][1]); rincon.add(m); });
  }
  pintarRincon();
  function uiRincon() {
    const el = document.querySelector('#rinconSlots'); if (!el) return;
    const cat = C.catalogo(), opciones = [...save.cosmetics.map((id) => [id, cat.find((c) => c.id === id)?.name || id]), ...save.treasures.map((t) => [t, t])];
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    el.innerHTML = opciones.length ? `<div class="huecos">${HUECOS.map((_, i) => `<label>Hueco ${i + 1}<select data-hueco="${i}"><option value="">— vacío —</option>${opciones.map(([v, t]) => `<option value="${esc(v)}" ${save.rincon[i] === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`).join('')}</div><p class="muted">Sal y mira el jardín delante de «Mi rincón».</p>` : '<p class="muted">Cuando consigas tesoros o canjees algo en la tienda, podrás colocarlo aquí.</p>';
    el.querySelectorAll('[data-hueco]').forEach((s) => s.onchange = () => { save.rincon[+s.dataset.hueco] = s.value || null; persist(); pintarRincon(); });
  }

  // ---------- lugares restaurados por los libros ----------
  const lugaresG = new THREE.Group(); scene.add(lugaresG);
  function pintarLugares(lista = []) {
    for (const c of [...lugaresG.children]) lugaresG.remove(c);
    if (lista.includes('estacion')) {
      const g = new THREE.Group(), p = (geo, c, x, y, z) => { const o = new THREE.Mesh(geo, mat(c)); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
      p(new THREE.BoxGeometry(6, .3, 4.4, 3, 1, 2), '#d9c3a0', 0, .15, 0);
      for (const [x, z] of [[-2.6, -1.8], [2.6, -1.8], [-2.6, 1.8], [2.6, 1.8]]) p(new THREE.CylinderGeometry(.13, .15, 3.2, 8), '#6b4a34', x, 1.75, z);
      const techo = p(new THREE.ConeGeometry(4.4, 1.6, 4), '#2f6aa0', 0, 4.1, 0); techo.rotation.y = Math.PI / 4;
      const globo = p(new THREE.SphereGeometry(1.1, 18, 14), '#3f8fd0', 0, 6.3, 0); const tierra = p(new THREE.SphereGeometry(1.12, 10, 8), '#5fb05a', 0, 6.3, 0); tierra.scale.set(1, .55, .7);
      const anillo = new THREE.Mesh(new THREE.TorusGeometry(1.45, .06, 6, 30), mat('#d4a43a')); anillo.position.y = 6.3; anillo.rotation.x = Math.PI / 2.4; g.add(anillo);
      p(new THREE.BoxGeometry(1.6, .9, .9), '#8a5a34', -1.2, .75, .6); p(new THREE.BoxGeometry(1.1, .7, .7), '#c8372d', .9, .65, .4);
      const c = cartel('🎈'); c.position.set(0, 2.9, 2.3); g.add(c);
      g.position.set(29, 0, -4); g.userData.globo = globo; lugaresG.add(g);
    }
    const sitio = (x, z, hacer) => { const g = new THREE.Group(), p = (geo, c, px, py, pz) => { const o = new THREE.Mesh(geo, mat(c)); o.position.set(px, py, pz); o.castShadow = true; g.add(o); return o; }; hacer(p, g); g.position.set(x, 0, z); lugaresG.add(g); };
    if (lista.includes('muelle')) sitio(-29, -4, (p, g) => {   // el viejo muelle: tablones, postes, una barca y un cofre
      p(new THREE.BoxGeometry(7, .25, 3, 4, 1, 2), '#9a7350', 0, .45, 0);
      for (const x of [-3, -1, 1, 3]) for (const z of [-1.3, 1.3]) p(new THREE.CylinderGeometry(.14, .16, 1.1, 8), '#6b4a34', x, .3, z);
      const barca = p(new THREE.CylinderGeometry(.9, .5, .6, 10, 1, false, 0, Math.PI), '#c8372d', 0, .75, 2.3); barca.rotation.set(0, 0, Math.PI / 2); barca.scale.set(1, 2.4, 1);
      p(new THREE.BoxGeometry(1, .6, .7), '#7a4a24', -2, .9, -.3); p(new THREE.BoxGeometry(1.04, .12, .74), '#d4a43a', -2, 1.15, -.3);
      p(new THREE.CylinderGeometry(.3, .3, .8, 10), '#8a6a44', 2.2, .95, -.5); const c = cartel('⚓'); c.position.set(0, 2.2, 0); g.add(c);
    });
    if (lista.includes('rosas')) sitio(-31, 21, (p, g) => {   // el jardín de las rosas: setos y rosas rojas y blancas
      for (const [x, z, w, d] of [[0, -2.2, 6, .7], [0, 2.2, 6, .7], [-3, 0, .7, 5.1], [3, 0, .7, 5.1]]) p(new THREE.BoxGeometry(w, 1, d, Math.ceil(w), 1, Math.ceil(d)), '#3f8a4a', x, .5, z);
      for (let i = 0; i < 14; i++) p(new THREE.SphereGeometry(.22, 8, 6), i % 3 ? '#d23a4a' : '#fff4f4', -2.4 + (i % 7) * .8, 1.1, i < 7 ? -2.2 : 2.2);
      const c = cartel('🌹'); c.position.set(0, 1.6, 0); g.add(c);
    });
    if (lista.includes('taller')) sitio(31, 22, (p, g) => {   // el taller del carpintero: banco, troncos y un muñeco
      p(new THREE.BoxGeometry(3, .2, 1.2), '#b07a44', 0, 1, 0); for (const x of [-1.3, 1.3]) p(new THREE.BoxGeometry(.2, 1, 1), '#7a5030', x, .5, 0);
      for (let i = 0; i < 3; i++) { const t = p(new THREE.CylinderGeometry(.3, .3, 1.4, 10), '#9a6a40', -2.6, .3 + i * .55, (i - 1) * .5); t.rotation.x = Math.PI / 2; }
      p(new THREE.SphereGeometry(.22, 10, 8), '#e2b07a', .6, 1.55, 0); p(new THREE.CylinderGeometry(.12, .16, .5, 8), '#c8372d', .6, 1.2, 0); const n = p(new THREE.ConeGeometry(.05, .35, 6), '#e2b07a', .6, 1.55, .3); n.rotation.x = Math.PI / 2;
      const c = cartel('🪚'); c.position.set(0, 2.4, 0); g.add(c);
    });
    if (lista.includes('camino')) sitio(16, 34, (p, g) => {   // un trocito del camino de baldosas amarillas y un arco verde
      for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) p(new THREE.BoxGeometry(.9, .1, .9), (i + j) % 2 ? '#f2c744' : '#e8b830', -2.5 + i, .06, -.5 + j);
      for (const x of [-1.6, 1.6]) p(new THREE.CylinderGeometry(.2, .2, 2.4, 10), '#3fae6a', x, 1.2, -1.4);
      const arco = new THREE.Mesh(new THREE.TorusGeometry(1.6, .2, 8, 20, Math.PI), mat('#3fae6a')); arco.position.set(0, 2.4, -1.4); g.add(arco);
      const c = cartel('💚'); c.position.set(0, 3.2, -1.4); g.add(c);
    });
    if (lista.includes('estanque')) sitio(-17, 34, (p, g) => {   // el estanque de los cisnes
      const agua = p(new THREE.CylinderGeometry(2.4, 2.4, .12, 24), '#6dbcd1', 0, .08, 0); agua.material.emissive = new THREE.Color('#1d4e5a'); agua.material.emissiveIntensity = .15;
      p(new THREE.TorusGeometry(2.45, .18, 8, 28), '#c9b9a0', 0, .12, 0).rotation.x = Math.PI / 2;
      for (const [x, z] of [[-.8, .3], [.9, -.6]]) { p(new THREE.SphereGeometry(.32, 10, 8), '#ffffff', x, .35, z).scale.set(1, .7, 1.4); p(new THREE.SphereGeometry(.13, 8, 6), '#ffffff', x, .82, z + .35); p(new THREE.CylinderGeometry(.05, .06, .45, 6), '#ffffff', x, .6, z + .3); }
      const c = cartel('🦢'); c.position.set(0, 1.7, -1.6); g.add(c);
    });
  }
  // ---------- el explorador de la clase lleva un recuerdo de cada libro ----------
  const accesorios = new THREE.Group();
  function vestir(lista = []) {
    const cab = player.userData.chibi?.cabeza; if (!cab) return; cab.remove(accesorios); for (const c of [...accesorios.children]) accesorios.remove(c);
    if (lista.includes('chistera')) { const ala = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .05, 18), mat('#2b2b33')); ala.position.y = .5; const copa = new THREE.Mesh(new THREE.CylinderGeometry(.4, .42, .6, 18), mat('#2b2b33')); copa.position.y = .82; const cinta = new THREE.Mesh(new THREE.CylinderGeometry(.425, .435, .12, 18), mat('#c8372d')); cinta.position.y = .6; accesorios.add(ala, copa, cinta); }
    if (lista.includes('panuelo')) { const p = new THREE.Mesh(new THREE.SphereGeometry(.66, 16, 10, 0, Math.PI * 2, 0, Math.PI * .42), mat('#c8372d')); p.position.y = .08; accesorios.add(p); const n = new THREE.Mesh(new THREE.ConeGeometry(.14, .4, 6), mat('#c8372d')); n.position.set(0, .1, -.62); n.rotation.x = -2.2; accesorios.add(n); }
    if (lista.includes('orejas')) for (const sx of [-1, 1]) { const o = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .55, 4, 8), mat('#ffffff')); o.position.set(sx * .24, .9, -.05); o.rotation.z = -sx * .18; accesorios.add(o); }
    if (lista.includes('gorro')) { const g = new THREE.Mesh(new THREE.ConeGeometry(.42, .7, 12), mat('#e8d6b0')); g.position.set(.08, .82, 0); g.rotation.z = -.2; accesorios.add(g); }
    if (lista.includes('gafas')) for (const sx of [-1, 1]) { const a = new THREE.Mesh(new THREE.TorusGeometry(.13, .03, 6, 16), mat('#2f8f4f')); a.position.set(sx * .22, -.05, .62); accesorios.add(a); }
    if (lista.includes('pluma')) { const pl = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), mat('#ffffff')); pl.scale.set(.6, 2.6, .4); pl.position.set(-.3, .75, -.1); pl.rotation.z = .5; accesorios.add(pl); }
    cab.add(accesorios);
  }

  // ---------- sonido y celebraciones del profe ----------
  let ac; const nota = (f, d = .15, tipo = 'triangle', v = .05) => { try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = tipo; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); o.stop(ac.currentTime + d); } catch { /* sin audio */ } };
  const efectos = []; let nocheFx = 0;
  function celebrar(tipo) {
    const cx = 0, cz = -2;
    if (tipo === 'fuegos') {
      let t0 = 0, sig = 0; const nubesP = [];
      efectos.push({ noche: 1, upd(dt) {
        t0 += dt;
        if (t0 > sig && sig < 8) { sig += .65 + Math.random() * .4; const n = 70, pos = new Float32Array(n * 3), vel = [], x0 = cx + (Math.random() - .5) * 22, y0 = 13 + Math.random() * 4, z0 = cz - 4 - Math.random() * 10;
          for (let i = 0; i < n; i++) { pos.set([x0, y0, z0], i * 3); const a = Math.random() * 6.28, b = Math.acos(2 * Math.random() - 1), s = 4 + Math.random() * 3; vel.push([Math.sin(b) * Math.cos(a) * s, Math.cos(b) * s, Math.sin(b) * Math.sin(a) * s]); }
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const m = new THREE.PointsMaterial({ color: new THREE.Color().setHSL(Math.random(), 1, .6), size: .5, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
          const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts); nubesP.push({ pts, g, m, vel, e: 0 }); nota(140, .3, 'sawtooth', .06); }
        for (const f of nubesP) { f.e += dt; const p = f.g.attributes.position; f.vel.forEach((v, i) => { v[1] -= 4 * dt; p.array[i * 3] += v[0] * dt; p.array[i * 3 + 1] += v[1] * dt; p.array[i * 3 + 2] += v[2] * dt; }); p.needsUpdate = true; f.m.opacity = Math.max(0, 1 - f.e / 1.7); if (f.e > 1.7 && !f.fuera) { scene.remove(f.pts); f.g.dispose(); f.m.dispose(); f.fuera = true; } }
        return t0 > 11;
      }, fin() { for (const f of nubesP) if (!f.fuera) { scene.remove(f.pts); f.g.dispose(); f.m.dispose(); } } });
    } else if (tipo === 'globos') {
      const gl = []; let t0 = 0; [523, 659, 784].forEach((f, k) => setTimeout(() => nota(f, .2, 'sine'), k * 120));
      efectos.push({ upd(dt) { t0 += dt; if (t0 < 6 && Math.random() < dt * 10) { const m = new THREE.Mesh(new THREE.SphereGeometry(.45, 12, 10), new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(Math.random(), .8, .62) })); m.scale.y = 1.2; m.position.set(cx + (Math.random() - .5) * 20, .5, cz + (Math.random() - .5) * 18); scene.add(m); gl.push({ m, v: 1.8 + Math.random() * 1.5, f: Math.random() * 6, x0: m.position.x }); }
        for (const g of gl) { g.m.position.y += g.v * dt; g.m.position.x = g.x0 + Math.sin(t0 * 1.5 + g.f) * .4; if (g.m.position.y > 28 && !g.fuera) { scene.remove(g.m); g.fuera = true; } }
        return t0 > 6 && gl.every((g) => g.fuera); }, fin() { for (const g of gl) scene.remove(g.m); } });
    } else if (tipo === 'fiesta') {
      const luz = new THREE.PointLight('#ff40c0', 80, 50, 1.3); scene.add(luz); let t0 = 0, sig = 0; const esc = [0, 4, 7, 12, 7, 4];
      efectos.push({ noche: .6, fiesta: 1, upd(dt) { t0 += dt; luz.color.setHSL((t0 * .5) % 1, 1, .55); luz.position.set(player.position.x, 8, player.position.z); if (t0 > sig) { sig += .22; nota(330 * 2 ** (esc[Math.floor(t0 / .22) % 6] / 12), .18); } return t0 > 14; }, fin() { scene.remove(luz); } });
    }
  }

  // ---------- botón para esconder los botones de arriba (y ver el colegio limpio) ----------
  { const b = document.createElement('button'); b.id = 'verLimpio'; document.body.appendChild(b);
    let limpio = false; try { limpio = localStorage.getItem('villa-lectora-limpio') === '1'; } catch { /* nada */ }
    const pon = () => { document.body.classList.toggle('limpio', limpio); b.textContent = limpio ? '☰' : '✕'; b.title = b.ariaLabel = limpio ? 'Mostrar los botones' : 'Esconder los botones'; };
    b.onclick = (e) => { e.stopPropagation(); limpio = !limpio; try { localStorage.setItem('villa-lectora-limpio', limpio ? '1' : '0'); } catch { /* nada */ } pon(); };
    pon(); }

  // ---------- en el móvil: un botón que se toca, no «pulsa E» ----------
  const tactil = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const textoPrompt = (label) => tactil ? `👆 ${label}` : `${label} · Pulsa <b>E</b> o haz clic`;

  // ---------- cada fotograma ----------
  const vP = new THREE.Vector3(); let reloj = 0, proximoMurmullo = 4;
  function proyectar(el, x, y, z) { vP.set(x, y - bajada(z), z).project(camera); if (vP.z > 1) { el.hidden = true; return; } el.hidden = false; el.style.left = ((vP.x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - vP.y) / 2 * innerHeight) + 'px'; }
  function tick(dt, t, modal) {
    const h = horaAhora(), dia = new Date().getDay();
    CURVA.z.value = player.position.z;
    // efectos del profe
    for (let i = efectos.length - 1; i >= 0; i--) if (efectos[i].upd(dt)) { efectos[i].fin?.(); efectos.splice(i, 1); }
    const quiere = efectos.reduce((m, e) => Math.max(m, e.noche || 0), 0); nocheFx += (quiere - nocheFx) * (1 - Math.exp(-1.5 * dt));
    const n0 = h < 12 ? 1 - suave(6, 8, h) : suave(18.5, 21, h), n = n0 + (1 - n0) * nocheFx;
    // cielo y luces
    colorCielo(h, cielo).lerp(new THREE.Color('#141a3a'), nocheFx); scene.background = cielo; scene.fog.color.copy(cielo);
    hemi.intensity = 2 * (1 - n * .62); sun.intensity = 2.4 * (1 - n * .85);
    const dorado = Math.max(0, 1 - Math.abs(h - 19.2) / 1.4) + Math.max(0, 1 - Math.abs(h - 7) / 1.1);
    sun.color.set('#ffedbb').lerp(new THREE.Color('#ff9a58'), Math.min(1, dorado) * (1 - nocheFx)).lerp(new THREE.Color('#9ab0e8'), n);
    for (const l of [...luces.lamparas, ...luces.bombillas, ...luces.rincon]) l.material.emissiveIntensity = n * 1.6;
    for (const v of luces.ventanas) v.material.emissiveIntensity = n * .9;
    matHalo.opacity = n * .85; for (const s of halos) { const p = s.userData.l.position; s.position.set(p.x, p.y - bajada(p.z), p.z); }
    estrellas.position.copy(camera.position); estrellas.material.opacity = n * .95;
    luna.position.copy(camera.position).add(new THREE.Vector3(-50, 70, -110)); luna.material.opacity = n;
    for (const c of nubes) { c.position.x += c.userData.v * dt; if (c.position.x > 70) c.position.x = -70; c.userData.m.emissiveIntensity = .35 * (1 - n * .8); c.userData.m.color.set('#ffffff').lerp(new THREE.Color('#3a4060'), n * .8); }
    for (const m of mariposas) { const u = m.userData; u.fase += dt; m.visible = n < .5; m.position.set(u.cx + Math.sin(u.fase * .7) * 2.4, .9 + Math.sin(u.fase * 2.3) * .35, u.cz + Math.cos(u.fase * .5) * 2); m.children[0].rotation.y = Math.sin(u.fase * 18) * .9; m.children[1].rotation.y = -Math.sin(u.fase * 18) * .9; m.rotation.y = u.fase * .6; }
    lucis.material.opacity = Math.max(0, n - .4) * 1.4;
    if (lucis.material.opacity > 0) { const pos = lucis.geometry.attributes.position.array; lucis.userData.o.forEach((o, i) => { o[3] += dt; const x = o[0] + Math.sin(o[3] * .6) * .8, z = o[2] + Math.cos(o[3] * .5) * .8; pos.set([x, o[1] + Math.sin(o[3] * 1.3) * .3 - bajada(z), z], i * 3); }); lucis.geometry.attributes.position.needsUpdate = true; }
    // el jugador anda (o baila, si hay fiesta)
    const fiesta = efectos.some((e) => e.fiesta);
    const anda = Math.hypot(player.position.x - yoAntes.x, player.position.z - yoAntes.z) > .002; yoAntes.copy(player.position);
    animarChibi(player, dt, anda || fiesta, t); if (fiesta) player.userData.chibi.cuerpo.position.y = Math.abs(Math.sin(t * 8)) * .3;
    // vecinos con horario
    for (const v of vec) {
      const plan = v.V.plan(h);
      if (!plan) { if (v.visible) { v.visible = false; v.mesh.visible = false; v.n.x = 9999; v.globo.hidden = true; } continue; }
      if (!v.visible || v.plan?.estado !== plan.estado) { if (!v.visible) v.mesh.position.set(plan.pts[0][0], 0, plan.pts[0][1]); v.visible = true; v.mesh.visible = true; v.i = 0; v.espera = 0; }
      v.plan = plan;
      if (v.farol) v.farol.visible = n > .4;
      const cerca = Math.hypot(player.position.x - v.mesh.position.x, player.position.z - v.mesh.position.z) < 3.2;
      const [tx, tz] = plan.pts[v.i % plan.pts.length], dx = tx - v.mesh.position.x, dz = tz - v.mesh.position.z, d = Math.hypot(dx, dz);
      let andaV = false;
      if (modal || cerca) { v.mesh.rotation.y += (Math.atan2(player.position.x - v.mesh.position.x, player.position.z - v.mesh.position.z) - v.mesh.rotation.y) * Math.min(1, dt * 6); }
      else if (d > .15) { const s = Math.min(d, 2.3 * dt); v.mesh.position.x += dx / d * s; v.mesh.position.z += dz / d * s; v.mesh.rotation.y = Math.atan2(dx, dz); andaV = true; }
      else if ((v.espera -= dt) <= 0) { v.espera = 2 + Math.random() * 4; v.i++; }
      animarChibi(v.mesh, dt, andaV || fiesta, t); if (fiesta) v.mesh.userData.chibi.cuerpo.position.y = Math.abs(Math.sin(t * 8 + v.mesh.id)) * .3;
      v.n.x = v.mesh.position.x; v.n.z = v.mesh.position.z;
      if (performance.now() < v.hasta && !modal) proyectar(v.globo, v.mesh.position.x, 3.2, v.mesh.position.z); else v.globo.hidden = true;
    }
    // de vez en cuando, alguien dice algo en voz alta
    if ((proximoMurmullo -= dt) <= 0) { proximoMurmullo = 6 + Math.random() * 6; const cand = vec.filter((v) => v.visible && Math.hypot(player.position.x - v.mesh.position.x, player.position.z - v.mesh.position.z) < 16); if (cand.length) { const v = uno(cand); v.globo.textContent = uno(v.V.murmullos); v.hasta = performance.now() + 3500; } }
    // los edificios que se ponen entre la cámara y tú se vuelven transparentes
    for (const e of C.edificios || []) {
      const tapa = camera.position.z > e.z - e.d / 2 && player.position.z < e.z - e.d / 2 && Math.abs(player.position.x - e.x) < e.w / 2 + 3;
      for (const m of e.m) { const o = tapa ? 0 : 1, mt = m.material; if (mt.opacity !== o) { mt.transparent = true; mt.opacity += (o - mt.opacity) * Math.min(1, dt * 8); if (Math.abs(mt.opacity - o) < .03) mt.opacity = o; mt.transparent = mt.opacity < 1; mt.depthWrite = mt.opacity > .95; } m.visible = mt.opacity > .03; }
    }
    // reloj del cole
    if ((reloj -= dt) <= 0) { reloj = 1; const el = document.querySelector('#reloj'); if (el) { const hh = Math.floor(h), mm = Math.floor((h - hh) * 60); el.textContent = `${n > .5 ? '🌙' : h < 8 || h > 18.5 ? '🌅' : '☀️'} ${hh}:${String(mm).padStart(2, '0')} · ${DIAS[dia]} · ${momentoEscolar(h, dia)}`; } }
  }
  return { tick, charla, celebrar, uiRincon, pintarRincon, pintarLugares, vestir, textoPrompt, tactil, esVecino: (k) => !!VECINOS[k] };
}
