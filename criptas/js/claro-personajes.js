// =============================================================
//  EL CLARO · PERSONAJES hechos a mano en código, al estilo de cuento:
//  cabeza grande, túnica acampanada, sombrero que se bambolea, manos
//  flotantes y contorno de cómic. Animación procedural: respiran, botan
//  al andar, el sombrero se queda atrás al arrancar, golpean y se caen.
// =============================================================
import * as THREE from 'three';
import { P, contorno } from './claro-estilo.js';
import { mergeGeometries } from './vendor/addons/utils/BufferGeometryUtils.js';

const rampa = (() => { const t = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
// Materiales propios de cada personaje (no compartidos): así podemos hacerlos destellar al recibir un golpe
function kit() {
  const mats = [];
  const mat = (color, { flatShading, ...o } = {}) => { const m = new THREE.MeshToonMaterial({ color, gradientMap: rampa, ...o }); m.userData.base = m.emissive.clone(); m.userData.baseI = m.emissiveIntensity; mats.push(m); return m; };
  const malla = (geo, color, { borde = .03, sombra = true, ...o } = {}) => { const m = new THREE.Mesh(geo, mat(color, o)); m.castShadow = sombra; if (borde) contorno(m, borde); return m; };
  return { mats, mat, malla };
}
const suaveA = (a, b, k) => a + (b - a) * Math.min(1, k);

// Base común: estado de animación, destello, caída y giro suave hacia donde va
function baseAnimada(raiz, cuerpo, mats) {
  const o = {
    grupo: raiz, cuerpo, vel: 0, fase: Math.random() * 6, accion: null, caido: false, rumbo: raiz.rotation.y, destello: 0,
    // Gira poco a poco hacia un ángulo (para no hacer giros bruscos)
    mirarA(ang) { o.rumbo = ang; },
    hacer(tipo, dur = .5) { o.accion = { tipo, t: 0, dur }; return new Promise((r) => { o.accion.fin = r; }); },
    herido() { o.destello = .35; o.hacer('herido', .35); },
    _comun(dt) {
      let d = o.rumbo - raiz.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); raiz.rotation.y += d * Math.min(1, dt * 10);
      if (o.destello > 0) { o.destello -= dt; const k = Math.max(0, o.destello / .35); for (const m of mats) { m.emissive.setRGB(1, .15, .1); m.emissiveIntensity = k * 1.2 + m.userData.baseI * (1 - k); if (k <= 0) { m.emissive.copy(m.userData.base); m.emissiveIntensity = m.userData.baseI; } } }
      if (o.accion) { o.accion.t += dt; if (o.accion.t >= o.accion.dur) { const f = o.accion.fin; o.accion = null; f?.(); } }
      return o.accion ? o.accion.t / o.accion.dur : 0;
    }
  };
  return o;
}

// ---------- El héroe mago (y, con otras opciones, la guardabosques) ----------
export function crearMago({ tunica = '#3d5bd9', adorno = P.oro, sombrero = 'pico', colorSombrero, piel = P.piel, pelo = '#6b3a2a', cristal = '#7ff6ff', baston = 'cristal', capa } = {}) {
  const { mats, mat, malla } = kit();
  const raiz = new THREE.Group(), cuerpo = new THREE.Group(); raiz.add(cuerpo);

  // túnica acampanada (torno) con ribete y cinturón
  const perfil = [[.58, 0], [.6, .06], [.52, .3], [.42, .62], [.33, .9], [.25, 1.08], [.12, 1.16], [0, 1.17]].map(([r, y]) => new THREE.Vector2(r, y));
  const tun = malla(new THREE.LatheGeometry(perfil, 20), tunica, { borde: .03 }); cuerpo.add(tun);
  const ribete = malla(new THREE.TorusGeometry(.57, .05, 6, 22), adorno, { borde: 0 }); ribete.rotation.x = Math.PI / 2; ribete.position.y = .06; cuerpo.add(ribete);
  const cint = malla(new THREE.TorusGeometry(.39, .05, 6, 20), '#6b4430', { borde: 0 }); cint.rotation.x = Math.PI / 2; cint.position.y = .7; cuerpo.add(cint);
  const hebilla = malla(new THREE.BoxGeometry(.14, .12, .05), adorno, { borde: 0 }); hebilla.position.set(0, .7, .4); cuerpo.add(hebilla);
  if (capa) { const cp = malla(new THREE.CylinderGeometry(.3, .62, 1.05, 14, 1, true, Math.PI * .55, Math.PI * .9), capa, { borde: 0, side: THREE.DoubleSide }); cp.position.set(0, .55, -.04); cuerpo.add(cp); }

  // cabeza grande con cara
  const cabeza = new THREE.Group(); cabeza.position.y = 1.47; cuerpo.add(cabeza);
  cabeza.add(malla(new THREE.SphereGeometry(.42, 22, 16), piel, { borde: .03 }));
  for (const s of [-1, 1]) {
    const ojo = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), mat('#1d1424')); ojo.scale.set(.065, .1, .04); ojo.position.set(s * .15, .03, .38); cabeza.add(ojo);
    const br = new THREE.Mesh(new THREE.SphereGeometry(.024, 6, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); br.position.set(s * .15 + .02, .07, .415); cabeza.add(br);
    const mej = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat('#ff9aa8', { transparent: true, opacity: .65 })); mej.scale.set(.07, .04, .02); mej.position.set(s * .25, -.08, .34); cabeza.add(mej);
    const mano = malla(new THREE.SphereGeometry(.13, 12, 10), piel, { borde: .025 }); mano.position.set(s * .58, .78, .1); cuerpo.add(mano); mano.userData.lado = s;
  }
  const manos = cuerpo.children.filter((c) => c.userData.lado);
  const boca = new THREE.Mesh(new THREE.TorusGeometry(.06, .014, 4, 10, Math.PI), mat('#5a2a2a')); boca.position.set(0, -.12, .4); boca.rotation.z = Math.PI; cabeza.add(boca);
  const nariz = malla(new THREE.SphereGeometry(.05, 8, 6), '#f0b08a', { borde: 0 }); nariz.position.set(0, -.04, .42); cabeza.add(nariz);
  // pelo: una melena que cubre la nuca y los lados (deja la cara al aire) y dos mechones
  const melena = malla(new THREE.SphereGeometry(.445, 20, 12, Math.PI / 2 + .95, Math.PI * 2 - 1.9, 0, Math.PI * .66), pelo, { borde: .02, side: THREE.DoubleSide }); cabeza.add(melena);
  for (const s of [-1, 1]) { const m = malla(new THREE.SphereGeometry(.1, 8, 6), pelo, { borde: .015 }); m.scale.set(.8, 1.4, .7); m.position.set(s * .36, -.08, .16); cabeza.add(m); }

  // sombrero: ala y cono en tramos que se bambolean como un muelle
  const tramos = [];
  const colS = colorSombrero || new THREE.Color(tunica).multiplyScalar(.82).getStyle();
  if (sombrero === 'pico') {
    const ala = malla(new THREE.CylinderGeometry(.64, .68, .06, 24), colS, { borde: .03 }); ala.position.y = .3; cabeza.add(ala);
    const banda = malla(new THREE.CylinderGeometry(.37, .39, .1, 20), adorno, { borde: 0 }); banda.position.y = .38; cabeza.add(banda);
    let padre = cabeza, y0 = .33;
    [[.38, .28, .32], [.28, .19, .3], [.19, .1, .28], [.1, .02, .26]].forEach(([r0, r1, h], i) => {
      const g = new THREE.Group(); g.position.y = y0; padre.add(g);
      const m = malla(new THREE.CylinderGeometry(r1, r0, h, 16).translate(0, h / 2, 0), colS, { borde: .025 }); g.add(m);
      tramos.push({ g, ang: 0, v: 0 }); padre = g; y0 = h * .95;
    });
    const estrella = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? .035 : .08, a = i / 10 * Math.PI * 2 + Math.PI / 2; estrella[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
    for (const [i, a] of [[0, .4], [1, -1.6], [0, 2.4]]) {
      const e = new THREE.Mesh(new THREE.ShapeGeometry(estrella), mat(adorno, { emissive: adorno, emissiveIntensity: .3, side: THREE.DoubleSide }));
      const tr = tramos[i].g; e.position.set(Math.sin(a) * (.33 - i * .09), .15, Math.cos(a) * (.33 - i * .09)); e.rotation.y = a; tr.add(e);
    }
  } else {                                                                     // capucha de guardabosques
    const cap = malla(new THREE.SphereGeometry(.5, 18, 14, 0, Math.PI * 2, 0, Math.PI * .62), colS, { borde: .03, side: THREE.DoubleSide }); cap.position.y = .02; cap.rotation.x = -.25; cabeza.add(cap);
    const g = new THREE.Group(); g.position.set(0, .22, -.32); g.rotation.x = -.9; cabeza.add(g);
    g.add(malla(new THREE.ConeGeometry(.2, .55, 12).translate(0, .27, 0), colS, { borde: .025 })); tramos.push({ g, ang: 0, v: 0, base: -.9 });
  }

  // bastón (con cristal que brilla) o cayado con farol
  const varilla = new THREE.Group(); manos[1].add(varilla); varilla.position.set(0, -.05, 0);
  varilla.add(malla(new THREE.CylinderGeometry(.035, .045, 1.9, 6).translate(0, .25, 0), '#6b4a34', { borde: .02 }));
  let gema = null;
  if (baston === 'cristal') {
    const garra = malla(new THREE.TorusGeometry(.1, .025, 5, 10), adorno, { borde: 0 }); garra.position.y = 1.2; garra.rotation.x = Math.PI / 2; varilla.add(garra);
    gema = new THREE.Mesh(new THREE.OctahedronGeometry(.13, 0), mat(cristal, { emissive: cristal, emissiveIntensity: 1.4 })); gema.position.y = 1.32; gema.scale.y = 1.5; varilla.add(gema);
  } else {
    const gancho = malla(new THREE.TorusGeometry(.14, .035, 5, 10, Math.PI * 1.3), '#6b4a34', { borde: 0 }); gancho.position.set(.1, 1.25, 0); varilla.add(gancho);
    gema = new THREE.Mesh(new THREE.BoxGeometry(.14, .2, .14), mat('#ffd27a', { emissive: '#ffb24a', emissiveIntensity: 2 })); gema.position.set(.24, 1.07, 0); varilla.add(gema);
  }
  raiz.traverse((o) => { if (o.isMesh && !o.userData.esContorno) o.castShadow = true; });

  const o = baseAnimada(raiz, cuerpo, mats);
  Object.assign(o, { cabeza, manos, gema, varilla, altura: 2.3 });
  let velAnt = 0;
  o.animar = (dt, t) => {
    const p = o._comun(dt), v = o.vel;
    o.fase += dt * (5 + v * 6);
    const bote = Math.abs(Math.sin(o.fase)) * .09 * v, resp = Math.sin(t * 2.2 + o.fase * .1) * .018 * (1 - v);
    cuerpo.position.y = bote; cuerpo.scale.set(1 - resp * .5, 1 + resp - bote * .3, 1 - resp * .5);
    cuerpo.rotation.x = suaveA(cuerpo.rotation.x, v * .12, dt * 6); cuerpo.rotation.z = Math.sin(o.fase) * .05 * v;
    cabeza.rotation.z = Math.sin(t * 1.1) * .04 * (1 - v); cabeza.rotation.x = -cuerpo.rotation.x * .5;
    manos[0].position.set(-.58, .78 + Math.sin(t * 2.2) * .03, .1 + Math.sin(o.fase) * .22 * v);
    manos[1].position.set(.58, .78 + Math.cos(t * 2.2) * .03, .1 - Math.sin(o.fase) * .22 * v);
    varilla.rotation.set(Math.sin(o.fase) * .15 * v, 0, -.1);
    // acciones
    if (o.accion) {
      const a = o.accion.tipo, s = Math.sin(p * Math.PI);
      if (a === 'golpe') { varilla.rotation.x = -2.2 * s + (p > .5 ? 1.2 * s : 0); cuerpo.rotation.y = -.5 * s; manos[1].position.y += .4 * s; manos[1].position.z += .3 * s; }
      else if (a === 'lanzar') { varilla.rotation.x = -1.4 * s; manos[1].position.y += .6 * s; manos[0].position.y += .4 * s; cuerpo.position.y += .15 * s; if (gema) gema.scale.setScalar(1 + s * .8); }
      else if (a === 'herido') { cuerpo.position.x = Math.sin(p * 40) * .06 * (1 - p); cuerpo.rotation.x -= .25 * s; }
      else if (a === 'saludar') { manos[0].position.set(-.6, 1.5 + Math.sin(p * 18) * .1, .2); }
      else if (a === 'recoger') { cuerpo.rotation.x = .5 * s; manos[0].position.set(-.35, .3 + .4 * (1 - s), .5); manos[1].position.z += .2 * s; }
      else if (a === 'celebrar') { cuerpo.position.y += Math.abs(Math.sin(p * Math.PI * 3)) * .5; manos[0].position.y += .7 * s; manos[1].position.y += .7 * s; }
    } else if (gema) gema.scale.setScalar(1 + Math.sin(t * 3) * .06);
    if (o.caido) { cuerpo.rotation.x = suaveA(cuerpo.rotation.x, -1.45, dt * 5); cuerpo.position.y = .25; }
    if (gema) gema.rotation.y += dt * 1.5;
    // el sombrero: muelle que se queda atrás con los arranques y frenazos
    const acel = (v - velAnt) / Math.max(dt, .001); velAnt = v;
    tramos.forEach((tr, i) => {
      const objetivo = (tr.base || 0) - acel * .012 * (i + 1) + Math.sin(o.fase) * .04 * v * (i + 1) + Math.sin(t * 1.3 + i) * .03;
      tr.v += (objetivo - tr.ang) * 90 * dt; tr.v *= Math.exp(-7 * dt); tr.ang += tr.v * dt;
      tr.g.rotation.x = tr.ang; tr.g.rotation.z = Math.sin(t * .9 + i) * .05 * (i + 1) * .5;
    });
  };
  return o;
}

// ---------- Esqueleto con espada oxidada y escudo de tablas ----------
export function crearEsqueleto({ escala = 1, ojo = '#ff5a2a' } = {}) {
  const { mats, mat, malla } = kit();
  const raiz = new THREE.Group(), cuerpo = new THREE.Group(); raiz.add(cuerpo); cuerpo.scale.setScalar(escala);
  const H = P.hueso, piezas = [];
  const hueso = (geo, x, y, z, padre = cuerpo, borde = .02) => { const m = malla(geo, H, { borde }); m.position.set(x, y, z); padre.add(m); piezas.push(m); return m; };
  // piernas y pelvis
  const caderas = new THREE.Group(); caderas.position.y = .78; cuerpo.add(caderas);
  const pelvis = hueso(new THREE.TorusGeometry(.17, .06, 6, 12), 0, 0, 0, caderas); pelvis.rotation.x = Math.PI / 2;
  const piernas = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * .13, 0, 0); caderas.add(g); hueso(new THREE.CapsuleGeometry(.045, .62, 3, 6), 0, -.38, 0, g); const pie = hueso(new THREE.BoxGeometry(.12, .06, .22), 0, -.74, .05, g); return g; });
  // columna y costillas
  const torso = new THREE.Group(); torso.position.y = .82; cuerpo.add(torso);
  for (let i = 0; i < 5; i++) hueso(new THREE.SphereGeometry(.05, 6, 5), 0, i * .1, -.05, torso, 0);
  for (let i = 0; i < 3; i++) { const c = hueso(new THREE.TorusGeometry(.2 - i * .02, .03, 5, 12, Math.PI * 1.5), 0, .2 + i * .12, .02, torso, 0); c.rotation.set(Math.PI / 2, 0, Math.PI * .75); }
  const hombros = hueso(new THREE.CapsuleGeometry(.04, .44, 3, 6), 0, .56, -.03, torso); hombros.rotation.z = Math.PI / 2;
  // brazos con espada y escudo
  const brazos = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * .27, .56, 0); torso.add(g); hueso(new THREE.CapsuleGeometry(.035, .5, 3, 6), 0, -.27, 0, g); return g; });
  const espada = new THREE.Group(); espada.position.set(0, -.55, .05); brazos[1].add(espada);
  espada.add(malla(new THREE.BoxGeometry(.06, .7, .02).translate(0, .38, 0), '#9a8f86', { borde: .015 }));
  espada.add(malla(new THREE.BoxGeometry(.24, .04, .05), '#6b4a34', { borde: 0 }));
  espada.rotation.x = Math.PI / 2 - .3;
  const escudo = malla(new THREE.CylinderGeometry(.26, .26, .05, 14), '#8a5a3a', { borde: .02 }); escudo.rotation.z = Math.PI / 2; escudo.position.set(-.06, -.4, .12); brazos[0].add(escudo);
  const aro = malla(new THREE.TorusGeometry(.26, .025, 5, 14), '#7a7a80', { borde: 0 }); aro.rotation.y = Math.PI / 2; aro.position.copy(escudo.position); brazos[0].add(aro);
  // calavera con mandíbula que castañetea y ojos que brillan
  const cabeza = new THREE.Group(); cabeza.position.y = .78; torso.add(cabeza);
  const craneo = hueso(new THREE.SphereGeometry(.27, 16, 12), 0, .05, 0, cabeza, .025); craneo.scale.set(1, .95, 1.05);
  const mandibula = hueso(new THREE.BoxGeometry(.28, .09, .22), 0, -.16, .05, cabeza);
  for (const s of [-1, 1]) {
    const cuenca = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 6), mat('#1a1018')); cuenca.position.set(s * .1, .06, .22); cabeza.add(cuenca);
    const brasa = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 6), mat(ojo, { emissive: ojo, emissiveIntensity: 2.5 })); brasa.position.set(s * .1, .06, .265); cabeza.add(brasa);
  }
  cabeza.add(new THREE.Mesh(mergeGeometries([-2, -1, 0, 1, 2].map((i) => new THREE.BoxGeometry(.035, .04, .02).translate(i * .045, -.1, .25))), mat('#fffaf0')));
  raiz.traverse((x) => { if (x.isMesh && !x.userData.esContorno) x.castShadow = true; });

  const o = baseAnimada(raiz, cuerpo, mats);
  Object.assign(o, { cabeza, altura: 2.1 * escala, piezas });
  let restos = null;
  o.animar = (dt, t) => {
    const p = o._comun(dt), v = o.vel;
    if (restos) { for (const r of restos) { if (r.quieto) continue; r.v.y -= 14 * dt; r.m.position.addScaledVector(r.v, dt); r.m.rotation.x += r.w.x * dt; r.m.rotation.z += r.w.z * dt; if (r.m.position.y < r.suelo) { r.m.position.y = r.suelo; r.v.multiplyScalar(.3); r.v.y = Math.abs(r.v.y) > 1 ? -r.v.y * .3 : 0; r.w.multiplyScalar(.5); if (r.v.length() < .2) r.quieto = true; } } return; }
    o.fase += dt * (4 + v * 7);
    const traqueteo = Math.sin(t * 17 + o.fase) * .01;
    cuerpo.position.y = Math.abs(Math.sin(o.fase)) * .06 * v + traqueteo;
    piernas[0].rotation.x = Math.sin(o.fase) * .6 * v; piernas[1].rotation.x = -Math.sin(o.fase) * .6 * v;
    brazos[0].rotation.x = -Math.sin(o.fase) * .4 * v - .2; brazos[1].rotation.x = Math.sin(o.fase) * .4 * v - .3;
    torso.rotation.z = Math.sin(o.fase) * .06 * v + Math.sin(t * 1.7) * .03; torso.rotation.x = .08 + v * .1;
    mandibula.position.y = -.16 - Math.max(0, Math.sin(t * 9 + o.fase)) * .035;
    cabeza.rotation.y = Math.sin(t * .7 + o.fase) * .3 * (1 - v);
    if (o.accion) {
      const a = o.accion.tipo, s = Math.sin(p * Math.PI);
      if (a === 'golpe') { brazos[1].rotation.x = -2.4 * s + (p > .45 ? 1.6 * s : 0); torso.rotation.y = -.6 * s; }
      else if (a === 'herido') { cuerpo.position.x = Math.sin(p * 50) * .07 * (1 - p); cabeza.rotation.z = Math.sin(p * 30) * .3 * (1 - p); }
      else if (a === 'rugir') { cabeza.rotation.x = -.5 * s; mandibula.position.y = -.16 - .1 * s; brazos[1].rotation.x = -2 * s; }
    }
  };
  // Al morir se desmonta: cada hueso sale volando y queda en un montón en el suelo
  o.desmontar = (sueloY = 0) => {
    restos = [];
    const escena = raiz.parent; if (!escena) return;
    raiz.updateMatrixWorld(true);
    for (const m of piezas) {
      const wp = m.getWorldPosition(new THREE.Vector3()), wq = m.getWorldQuaternion(new THREE.Quaternion());
      escena.attach(m); m.position.copy(wp); m.quaternion.copy(wq);
      restos.push({ m, v: new THREE.Vector3((Math.random() - .5) * 4, 2 + Math.random() * 4, (Math.random() - .5) * 4), w: new THREE.Vector3((Math.random() - .5) * 12, 0, (Math.random() - .5) * 12), suelo: sueloY + .05 });
    }
    cuerpo.visible = false;
    o.restos = restos;
  };
  return o;
}
