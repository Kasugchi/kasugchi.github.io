// =============================================================
//  LA CRIPTA (modo aventura) · el escenario a partir de una MISIÓN con el
//  formato de siempre (misiones/*.json o el generador de la Mazmorra Infinita):
//  cada casilla del plano es una losa, las paredes salen de las salas, y las
//  puertas, muebles, rocas, trampas y la escalera van donde dice la misión.
//  Muros bajos, como una maqueta de juego de mesa: se ve todo desde arriba.
//  Las salas sin explorar llevan una tapa oscura que se levanta al entrar.
// =============================================================
import * as THREE from 'three';
import { mergeGeometries } from './vendor/addons/utils/BufferGeometryUtils.js';
import * as D from './datos.js';
import * as TB from './tablero.js';
import { toon, pieza, contorno, azar, lienzo, P } from './claro-estilo.js';

export const C = 1.3;                     // lado de una casilla (igual que el tablero del claro)
const ALTO_MURO = 1.25, GROSOR = .3;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Quita monstruos a una misión pensada para cuatro héroes: como mucho dos por sala
// (tres donde está el jefe) y unos pocos por el pasillo. Siempre con la misma semilla.
export function aSolas(m, maxPasillo = 3) {
  const porSala = {}, salida = [];
  for (const mo of m.monstruos) {
    const r = TB.region(mo.x, mo.y), jefeAqui = m.monstruos.some((o) => o.jefe && TB.region(o.x, o.y) === r);
    const tope = r === '.' ? maxPasillo : jefeAqui ? 3 : 2;
    porSala[r] = porSala[r] || 0;
    if (mo.jefe || porSala[r] < tope) { salida.push(mo); porSala[r]++; }
  }
  m.monstruos = salida;
  for (const d of m.disparadores || []) for (const a of d.acciones || []) if (a.tipo === 'aparecer') a.monstruos = a.monstruos.slice(0, 2);
  return m;
}

export function crearCripta(escena, m, { movil = false } = {}) {
  TB.usarPlano(m.plano || 'clasico');
  const W = D.ANCHO, H = D.ALTO, rnd = azar(7);
  const animables = [];
  const aMundo = (x, y) => new THREE.Vector3((x - W / 2 + .5) * C, 0, (y - H / 2 + .5) * C);
  const deMundo = (p) => [Math.floor(p.x / C + W / 2), Math.floor(p.z / C + H / 2)];

  // ---- estado del plano: puertas, rocas, muebles (para saber por dónde se pasa) ----
  const rocas = new Set((m.rocas || []).map(([x, y]) => x + ',' + y));
  const puertas = (m.puertas || []).map((p) => ({ ...p, abierta: false, clave: TB.claveBorde(p.a, p.b) }));
  const puertaPorBorde = Object.fromEntries(puertas.map((p) => [p.clave, p]));
  const ocupadas = new Map();          // casilla → mueble
  for (const mu of m.muebles || []) for (let dx = 0; dx < (mu.w || 1); dx++) for (let dy = 0; dy < (mu.h || 1); dy++) ocupadas.set((mu.x + dx) + ',' + (mu.y + dy), mu);
  const escalera = m.escalera || null;
  const enEscalera = (x, y) => escalera && x >= escalera[0] && x <= escalera[0] + 1 && y >= escalera[1] && y <= escalera[1] + 1;
  // ¿Se puede pasar de la casilla a a la b (vecinas)? Paredes, puertas cerradas y huecos de roca.
  function pasa(a, b) {
    if (!TB.dentro(b[0], b[1]) || !TB.dentro(a[0], a[1])) return false;
    if (TB.region(a[0], a[1]) === TB.region(b[0], b[1])) return true;
    const p = puertaPorBorde[TB.claveBorde(a, b)];
    return !!(p && p.abierta);
  }
  const pisable = (x, y) => TB.dentro(x, y) && !rocas.has(x + ',' + y) && !ocupadas.has(x + ',' + y);

  // ---- luz: oscuridad azulada, niebla, y las antorchas de cada sala ----
  escena.background = new THREE.Color('#0d0a16');
  escena.fog = new THREE.Fog('#0d0a16', 14, 46);
  escena.add(new THREE.HemisphereLight('#8a7ac8', '#2a2036', .95));
  escena.add(new THREE.AmbientLight('#5a4a7a', .45));
  const luna = new THREE.DirectionalLight('#9a8aff', .55); luna.position.set(-10, 30, 8); luna.castShadow = true;
  luna.shadow.mapSize.set(movil ? 1024 : 2048, movil ? 1024 : 2048); Object.assign(luna.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 80 }); luna.shadow.bias = -.0008;
  escena.add(luna, luna.target);

  // ---- el vacío alrededor: roca oscura ----
  const vacio = new THREE.Mesh(new THREE.PlaneGeometry(W * C + 60, H * C + 60).rotateX(-Math.PI / 2), toon('#17121f'));
  vacio.position.y = -.3; vacio.receiveShadow = true; escena.add(vacio);

  // ---- losas: color de cada sala (el del tablero, apagado hacia la piedra) ----
  const piedra = new THREE.Color('#7c7488'), regiones = new Map();
  const grupoDe = (r) => { if (!regiones.has(r)) { const g = new THREE.Group(); g.userData.region = r; escena.add(g); regiones.set(r, { g, casillas: [], visible: r === '.' }); } return regiones.get(r); };
  {
    const porRegion = new Map();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!TB.dentro(x, y)) continue; const r = TB.region(x, y); (porRegion.get(r) || porRegion.set(r, []).get(r)).push([x, y]); grupoDe(r).casillas.push([x, y]); }
    const geo = new THREE.BoxGeometry(C * .95, .16, C * .95);
    for (const [r, cs] of porRegion) {
      const s = D.sueloDe(r), base = new THREE.Color(`rgb(${s.c.join(',')})`).lerp(piedra, r === '.' ? .75 : .55);
      const im = new THREE.InstancedMesh(geo, toon('#ffffff'), cs.length), m4 = new THREE.Matrix4();
      cs.forEach(([x, y], k) => { const p = aMundo(x, y); m4.makeTranslation(p.x, -.08 + (rnd() - .5) * .02, p.z); im.setMatrixAt(k, m4); im.setColorAt(k, base.clone().offsetHSL(0, (rnd() - .5) * .04, (rnd() - .5) * .06)); });
      im.receiveShadow = true; grupoDe(r).g.add(im);
    }
    // juntas oscuras bajo las losas
    const juntas = new THREE.Mesh(new THREE.PlaneGeometry(W * C, H * C).rotateX(-Math.PI / 2), toon('#2a2232')); juntas.position.y = -.17; escena.add(juntas);
  }

  // ---- muros bajos en cada borde entre regiones distintas (o contra el vacío) y pilares en las esquinas ----
  const huecosPuerta = new Set(puertas.filter((p) => !p.secreta).map((p) => p.clave));
  {
    const geos = [], cimas = [], gv = new THREE.BoxGeometry(C + GROSOR, ALTO_MURO, GROSOR), gc = new THREE.BoxGeometry(C + GROSOR + .06, .12, GROSOR + .1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!TB.dentro(x, y)) continue;
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nx = x + dx, ny = y + dy, fuera = !TB.dentro(nx, ny);
        if (!fuera && (TB.region(nx, ny) === TB.region(x, y) || (dx < 0 || dy < 0))) continue;   // cada borde interior, una vez
        if (!fuera && huecosPuerta.has(TB.claveBorde([x, y], [nx, ny]))) continue;
        const p = aMundo(x, y), cx = p.x + dx * C / 2, cz = p.z + dy * C / 2, giro = dx ? Math.PI / 2 : 0;
        const M = new THREE.Matrix4().makeRotationY(giro).setPosition(cx, ALTO_MURO / 2 - .08, cz);
        geos.push(gv.clone().applyMatrix4(M)); cimas.push(gc.clone().applyMatrix4(new THREE.Matrix4().makeRotationY(giro).setPosition(cx, ALTO_MURO - .02, cz)));
      }
    }
    const muros = new THREE.Mesh(mergeGeometries(geos), toon('#5e5672')); muros.castShadow = true; muros.receiveShadow = true;
    const cima = new THREE.Mesh(mergeGeometries(cimas), toon('#8a819c')); cima.receiveShadow = true;
    escena.add(contorno(muros, .02), cima);
  }

  // ---- puertas: marco de piedra y hoja de madera que gira; las bloqueadas, con cadena y candado ----
  for (const p of puertas) {
    if (p.secreta) continue;
    const a = aMundo(...p.a), b = aMundo(...p.b), c = a.clone().lerp(b, .5), horiz = p.a[1] !== p.b[1];   // horiz: la puerta corta en vertical (z)
    const g = new THREE.Group(); g.position.copy(c); g.rotation.y = horiz ? 0 : Math.PI / 2; escena.add(g);
    for (const s of [-1, 1]) { const j = pieza(new THREE.BoxGeometry(.22, ALTO_MURO + .25, GROSOR + .12), '#4e475e', { borde: .02 }); j.position.set(s * (C / 2 - .02), (ALTO_MURO + .25) / 2 - .08, 0); g.add(j); }
    const din = pieza(new THREE.BoxGeometry(C + .1, .2, GROSOR + .12), '#4e475e', { borde: .02 }); din.position.y = ALTO_MURO + .1; g.add(din);
    const bisagra = new THREE.Group(); bisagra.position.set(-C / 2 + .1, 0, 0); g.add(bisagra);
    const hoja = pieza(new THREE.BoxGeometry(C - .22, ALTO_MURO + .05, .12), '#8a5a34', { borde: .02 }); hoja.position.set((C - .22) / 2, (ALTO_MURO + .05) / 2 - .08, 0); bisagra.add(hoja);
    for (const yy of [.25, .85]) { const fl = pieza(new THREE.BoxGeometry(C - .26, .07, .15), '#3a3440', { borde: 0 }); fl.position.set((C - .22) / 2, yy, 0); bisagra.add(fl); }
    const pomo = pieza(new THREE.SphereGeometry(.06, 8, 6), P.oro, { borde: 0 }); pomo.position.set(C - .45, .55, .1); bisagra.add(pomo);
    let candado = null;
    if (p.bloqueada) {
      candado = new THREE.Group(); g.add(candado);
      const cad = pieza(new THREE.TorusGeometry(.5, .04, 6, 16, Math.PI), '#6a6a74', { borde: 0 }); cad.position.set(0, .55, .12); cad.rotation.z = Math.PI; candado.add(cad);
      const ca = new THREE.Mesh(new THREE.BoxGeometry(.22, .26, .1), toon('#c9a04a', { emissive: '#ff5a2a', emissiveIntensity: .5 })); ca.position.set(0, .1, .14); candado.add(ca);
    }
    Object.assign(p, { g, bisagra, candado, giro: 0, centro: c });
  }
  function abrirPuerta(p) { if (!p || p.abierta) return; p.abierta = true; p.bloqueada = false; if (p.candado) p.g.remove(p.candado); }
  animables.push((t, dt) => { for (const p of puertas) if (p.bisagra) { p.giro += ((p.abierta ? -1.75 : 0) - p.giro) * Math.min(1, dt * 5); p.bisagra.rotation.y = p.giro; } });

  // ---- muebles de cada tipo (sencillos, con el mismo sombreado) ----
  const muebles3d = [];
  function mueble(mu) {
    const g = new THREE.Group(), w = (mu.w || 1) * C, h = (mu.h || 1) * C, p0 = aMundo(mu.x, mu.y);
    g.position.set(p0.x + (w - C) / 2, 0, p0.z + (h - C) / 2);
    const caja = (sx, sy, sz, col, y = sy / 2, x = 0, z = 0, borde = .02) => { const b = pieza(new THREE.BoxGeometry(sx, sy, sz), col, { borde }); b.position.set(x, y, z); g.add(b); return b; };
    const t = mu.tipo;
    if (t === 'mesa') { caja(w * .9, .1, h * .8, '#8a5a34', .75); for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(.1, .72, .1, '#6a4428', .36, sx * w * .38, sz * h * .32); }
    else if (t === 'cofre') { caja(w * .7, .5, h * .55, '#9a5a34', .25); caja(w * .72, .14, h * .57, P.oro, .52, 0, 0, 0); }
    else if (t === 'estanteria') { caja(w * .92, 1.6, h * .5, '#6a4428', .8); for (const yy of [.45, .9, 1.35]) caja(w * .86, .05, h * .46, '#4a2e1a', yy, 0, .02, 0); for (let i = 0; i < 6; i++) caja(.1, .3, .25, ['#c44a3a', '#3a6ac4', '#3aa07a', '#d9a441'][i % 4], .62 + (i % 2) * .45, -w * .38 + i * w * .15, .05, 0); }
    else if (t === 'trono') { caja(w * .8, .5, h * .8, '#7a2a4a', .25); caja(w * .8, 1.4, .2, '#7a2a4a', .9, 0, -h * .35); caja(w * .9, .12, .26, P.oro, 1.65, 0, -h * .35, 0); }
    else if (t === 'sarcofago') { caja(w * .82, .6, h * .88, '#8a819c', .3); caja(w * .86, .14, h * .92, '#a8a0b8', .66); const cr = caja(.12, .04, h * .5, P.hueso, .75, 0, 0, 0); cr.rotation.y = 0; }
    else if (t === 'chimenea') { caja(w * .95, 1.3, h * .7, '#5a4e60', .65); const f = new THREE.Mesh(new THREE.ConeGeometry(.22, .5, 7), toon('#ff8a3a', { emissive: '#ff6a1a', emissiveIntensity: 1.6 })); f.position.set(0, .35, h * .2); g.add(f); g.userData.llama = f; }
    else if (t === 'armero') { caja(w * .9, 1.2, h * .3, '#6a4428', .6, 0, -h * .2); for (let i = 0; i < 3; i++) { const e = caja(.06, 1, .03, '#c9ccd6', .7, -w * .3 + i * w * .3, -h * .02, .01); e.rotation.z = .1; } }
    else if (t === 'alquimista') { caja(w * .9, .9, h * .6, '#6a4428', .45); for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), toon(['#7fe0ff', '#9aff5a', '#ff7ab8', '#ffd34a'][i], { emissive: ['#3ab8ff', '#5ad83a', '#d83a8a', '#d8a83a'][i], emissiveIntensity: .8 })); f.position.set(-w * .3 + i * w * .2, 1, 0); g.add(f); } }
    else if (t === 'potro') { caja(w * .85, .7, h * .5, '#6a4428', .35); caja(.12, .5, h * .55, '#4a2e1a', .95, -w * .35); caja(.12, .5, h * .55, '#4a2e1a', .95, w * .35); }
    else if (t === 'caldero') { const c = pieza(new THREE.SphereGeometry(.38, 14, 10, 0, Math.PI * 2, Math.PI * .3, Math.PI * .7), '#2f2f38', { borde: .02, side: THREE.DoubleSide }); c.position.y = .45; g.add(c); const s = new THREE.Mesh(new THREE.CircleGeometry(.3, 14).rotateX(-Math.PI / 2), toon('#7aff5a', { emissive: '#3ad81a', emissiveIntensity: 1 })); s.position.y = .66; g.add(s); }
    else if (t === 'altar') { caja(w * .8, .8, h * .6, '#a8a0b8', .4); for (const sx of [-1, 1]) { const v = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .25, 6), toon('#f1e7cf')); v.position.set(sx * w * .25, .92, 0); g.add(v); const f = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 5), toon('#ffd27a', { emissive: '#ffb24a', emissiveIntensity: 2 })); f.position.set(sx * w * .25, 1.08, 0); g.add(f); } }
    else caja(w * .8, .6, h * .8, '#6a4428', .3);
    grupoDe(TB.region(mu.x, mu.y)).g.add(g); muebles3d.push({ mu, g });
  }
  (m.muebles || []).forEach(mueble);
  animables.push((t) => { for (const { g } of muebles3d) if (g.userData.llama) g.userData.llama.scale.y = 1 + Math.sin(t * 9) * .15; });

  // ---- rocas que cierran pasillos ----
  for (const k of rocas) { const [x, y] = k.split(',').map(Number), p = aMundo(x, y); for (let i = 0; i < 4; i++) { const r = pieza(new THREE.DodecahedronGeometry(.3 + rnd() * .25, 0), '#6a6278', { borde: .02 }); r.position.set(p.x + (rnd() - .5) * .7, .2 + rnd() * .4, p.z + (rnd() - .5) * .7); grupoDe(TB.region(x, y)).g.add(r); } }

  // ---- la escalera por la que has bajado (y por la que se sale): peldaños y luz de arriba ----
  if (escalera) {
    const p = aMundo(escalera[0], escalera[1]).add(new THREE.Vector3(C / 2, 0, C / 2)), g = new THREE.Group(); g.position.copy(p); grupoDe(TB.region(...escalera)).g.add(g);
    for (let i = 0; i < 5; i++) { const s = pieza(new THREE.BoxGeometry(C * 1.7, .2, C * .32), i % 2 ? '#8a819c' : '#9a90ac', { borde: .02, recibe: true }); s.position.set(0, .1 + i * .2, -C * .7 + i * C * .32); g.add(s); }
    const luz = new THREE.Mesh(new THREE.PlaneGeometry(C * 1.6, 3).translate(0, 1.5, 0), new THREE.MeshBasicMaterial({ color: '#ffe6b0', transparent: true, opacity: .18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    luz.position.set(0, 0, C * .9); g.add(luz);
    const pl = new THREE.PointLight('#ffd9a0', 6, 9, 1.5); pl.position.set(0, 2.4, C * .6); g.add(pl);
  }

  // ---- antorchas: una en la pared de cada sala (y alguna en el pasillo) ----
  const antorchas = [];
  {
    const lugares = [];
    for (const [r, R] of regiones) {
      const cands = [];
      for (const [x, y] of R.casillas) for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (!TB.dentro(nx, ny) || TB.region(nx, ny) !== r) if (!huecosPuerta.has(TB.claveBorde([x, y], [nx, ny]))) cands.push([x, y, dx, dy]); }
      const n = r === '.' ? 6 : 1;
      for (let i = 0; i < n && cands.length; i++) lugares.push([r, cands.splice(Math.floor(rnd() * cands.length), 1)[0]]);
    }
    let luces = 0;
    for (const [r, [x, y, dx, dy]] of lugares) {
      const p = aMundo(x, y), g = new THREE.Group(); g.position.set(p.x + dx * (C / 2 - GROSOR / 2 - .05), 0, p.z + dy * (C / 2 - GROSOR / 2 - .05)); grupoDe(r).g.add(g);
      const palo = pieza(new THREE.CylinderGeometry(.04, .05, .5, 5), '#3d2a20', { borde: 0 }); palo.position.y = ALTO_MURO + .05; palo.rotation.set(dy * -.4, 0, dx * .4); g.add(palo);
      const f = new THREE.Mesh(new THREE.ConeGeometry(.13, .38, 6).translate(0, .19, 0), new THREE.MeshBasicMaterial({ color: '#ffb04a' })); f.position.set(-dx * .1, ALTO_MURO + .27, -dy * .1); g.add(f);
      let luz = null; if (luces < (movil ? 5 : 9) && r !== '.') { luz = new THREE.PointLight('#ff9a4a', 4, 7, 1.6); luz.position.set(-dx * .5, ALTO_MURO + .4, -dy * .5); g.add(luz); luces++; }
      antorchas.push({ f, luz, fase: rnd() * 6 });
    }
    animables.push((t) => { for (const a of antorchas) { a.f.scale.set(1, 1 + Math.sin(t * 8 + a.fase) * .18, 1); if (a.luz) a.luz.intensity = 3.6 + Math.sin(t * 5 + a.fase) * .6; } });
  }

  // ---- huesos y calaveras por el suelo, de decoración ----
  {
    const gs = [], cr = new THREE.SphereGeometry(.12, 8, 6), hu = new THREE.CapsuleGeometry(.03, .28, 3, 5).rotateZ(Math.PI / 2);
    for (let i = 0; i < 40; i++) { const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H); if (!pisable(x, y) || enEscalera(x, y)) continue; const p = aMundo(x, y); const M = new THREE.Matrix4().makeRotationY(rnd() * 6).setPosition(p.x + (rnd() - .5) * .8, .05, p.z + (rnd() - .5) * .8); gs.push((i % 3 ? hu : cr).clone().applyMatrix4(M)); }
    if (gs.length) { const mh = new THREE.Mesh(mergeGeometries(gs), toon(P.hueso)); mh.castShadow = true; escena.add(mh); }
  }

  // ---- tapas de las salas sin explorar ----
  const tapas = new Map();
  for (const [r, R] of regiones) {
    if (r === '.') continue;
    const xs = R.casillas.map((c) => c[0]), ys = R.casillas.map((c) => c[1]);
    const gs = R.casillas.map(([x, y]) => { const p = aMundo(x, y); return new THREE.BoxGeometry(C + .02, .2, C + .02).translate(p.x, ALTO_MURO + .12, p.z); });
    const tapa = new THREE.Mesh(mergeGeometries(gs), new THREE.MeshToonMaterial({ color: '#4a3e5e', emissive: '#1a1028', gradientMap: toon('#fff').gradientMap, transparent: true }));
    tapa.castShadow = true; escena.add(tapa);
    // runa en el centro de la tapa
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2, pc = aMundo(cx, cy);
    const tx = lienzo(128, 128, (x) => { x.font = '96px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#c9a2ff'; x.fillText('ᛟ', 64, 70); });
    const runa = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })); runa.position.set(pc.x, ALTO_MURO + .23, pc.z); escena.add(runa);
    tapas.set(r, { tapa, runa, alzar: -1 });
    R.g.visible = false;
  }
  function revelar(r) {
    const R = regiones.get(r); if (!R || R.visible) return false;
    R.visible = true; R.g.visible = true; const t = tapas.get(r); if (t) t.alzar = 0;
    return true;
  }
  animables.push((t, dt) => {
    for (const [r, tp] of tapas) {
      if (tp.alzar < 0) continue;
      tp.alzar += dt; const k = Math.min(1, tp.alzar / .9);
      tp.tapa.position.y = k * 3; tp.tapa.material.opacity = 1 - k; tp.runa.material.opacity = 1 - k * 1.5;
      if (k >= 1) { escena.remove(tp.tapa, tp.runa); tapas.delete(r); }
    }
  });

  // ---- trampas (escondidas hasta que alguien las pisa) ----
  const trampas = (m.trampas || []).map((t) => ({ ...t, disparada: false }));
  function mostrarTrampa(tr) {
    const p = aMundo(tr.x, tr.y), g = new THREE.Group(); g.position.copy(p); escena.add(g);
    if (tr.tipo === 'foso') { const h = new THREE.Mesh(new THREE.BoxGeometry(C * .9, .1, C * .9), toon('#0a0810')); h.position.y = .01; g.add(h); }
    else if (tr.tipo === 'lanza') { for (let i = 0; i < 5; i++) { const l = pieza(new THREE.ConeGeometry(.05, .7, 5), '#c9ccd6', { borde: 0 }); l.position.set((i % 3 - 1) * .3, .35, (i < 3 ? -.2 : .2)); g.add(l); } }
    else { const b = pieza(new THREE.BoxGeometry(C * .9, .9, C * .9), '#6a6278', { borde: .02 }); b.position.y = 3; g.add(b); animables.push((t, dt) => { b.position.y = Math.max(.45, b.position.y - dt * 14); }); }
  }

  // ---- el tablero para el combate: toda la mazmorra, con sus paredes ----
  function tableroCombate() {
    const casillas = [], idx = new Map();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = aMundo(x, y), c = { i: x, j: y, x: p.x, y: 0, z: p.z, tapada: !pisable(x, y) || !regiones.get(TB.region(x, y))?.visible };
      casillas.push(c); idx.set(x + ',' + y, c);
    }
    return { casillas, T: C, celda: (i, j) => idx.get(i + ',' + j) || null, pasa: (a, b) => pasa([a.i, a.j], [b.i, b.j]) };
  }

  // ---- moverse libre sin atravesar paredes ni muebles: se comprueba eje a eje ----
  const RADIO = .32;
  function puedeEstar(x, z, desde) {
    const [cx, cy] = deMundo({ x, z }), [ox, oy] = desde;
    if (!pisable(cx, cy)) return false;
    if (cx !== ox || cy !== oy) { if (Math.abs(cx - ox) + Math.abs(cy - oy) > 1) return pasa([ox, oy], [cx, oy]) && pasa([cx, oy], [cx, cy]) && pisable(cx, oy); if (!pasa([ox, oy], [cx, cy])) return false; }
    // que el cuerpo no se meta dentro de la pared: mira los bordes de la casilla
    const p = aMundo(cx, cy), lx = x - p.x, lz = z - p.z, m2 = C / 2 - RADIO;
    if (lx > m2 && !pasa([cx, cy], [cx + 1, cy])) return false;
    if (lx < -m2 && !pasa([cx, cy], [cx - 1, cy])) return false;
    if (lz > m2 && !pasa([cx, cy], [cx, cy + 1])) return false;
    if (lz < -m2 && !pasa([cx, cy], [cx, cy - 1])) return false;
    return true;
  }
  function mover(pos, dx, dz) {
    const desde = deMundo(pos);
    if (puedeEstar(pos.x + dx, pos.z, desde)) pos.x += dx;
    if (puedeEstar(pos.x, pos.z + dz, deMundo(pos))) pos.z += dz;
  }

  return {
    m, W, H, C, aMundo, deMundo, pasa, pisable, enEscalera, puertas, puertaPorBorde, regiones, revelar, abrirPuerta, trampas, mostrarTrampa, mover, tableroCombate,
    alturaEn: () => 0, obstaculos: [],
    actualizar(t, dt) { for (const f of animables) f(t, dt); }
  };
}
