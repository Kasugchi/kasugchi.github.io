// =============================================================
//  LA ISLA DE LOS TRES GARFIOS: el decorado propio de la parada pirata
//  Palmeras, la feria pirata abandonada (carrusel oxidado que aún gira,
//  casetas con toldos de rayas y un arco de entrada al que le faltan letras),
//  un barco varado y la cabeza de mono de piedra encima de la gruta.
//  Homenaje a las aventuras piratas de antes, todo inventado aquí.
// =============================================================
import * as THREE from 'three';
import { toon, contorno, lienzo } from './claro-estilo.js';

const pieza = (geo, color, { borde = .03, ...op } = {}) => { const m = new THREE.Mesh(geo, toon(color, op)); m.castShadow = true; m.receiveShadow = true; if (borde) contorno(m, borde); return m; };
function cartelTexto(texto, ancho, alto, { fondo = '#f2e2b0', tinta = '#5a2a1a', letra = 'bold 54px Georgia, serif' } = {}) {
  const tx = lienzo(512, Math.round(512 * alto / ancho), (x, w, h) => { x.fillStyle = fondo; x.fillRect(0, 0, w, h); x.strokeStyle = tinta; x.lineWidth = 10; x.strokeRect(8, 8, w - 16, h - 16); x.fillStyle = tinta; x.font = letra; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, w / 2, h / 2 + 3); });
  // dos caras, cada una con el texto al derecho (si no, por detrás se lee en espejo)
  const g = new THREE.Group(), geo = new THREE.PlaneGeometry(ancho, alto), mat = new THREE.MeshBasicMaterial({ map: tx });
  const delante = new THREE.Mesh(geo, mat), detras = new THREE.Mesh(geo, mat); detras.rotation.y = Math.PI; g.add(delante, detras);
  return g;
}

export function decorarIsla(escena, mundo) {
  const anima = [], { alturaEn, obstaculos } = mundo;
  const suelo = (x, z) => alturaEn(x, z);

  // ---------- palmeras ----------
  function palmera(x, z, alto = 5, inc = .25, giro = 0) {
    const g = new THREE.Group(); g.position.set(x, suelo(x, z) - .1, z); g.rotation.y = giro;
    let p = new THREE.Vector3(), dir = new THREE.Vector3(Math.sin(inc), 1, 0).normalize();
    const n = 7;
    for (let i = 0; i < n; i++) {
      const tramo = pieza(new THREE.CylinderGeometry(.2 - i * .015, .24 - i * .015, alto / n + .05, 8), i % 2 ? '#8a6a42' : '#9a7a4e', { borde: .02 });
      tramo.position.copy(p).addScaledVector(dir, alto / n / 2); tramo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); g.add(tramo);
      p.addScaledVector(dir, alto / n); dir.x += .035; dir.normalize();
    }
    for (let k = 0; k < 8; k++) {   // hojas que cuelgan
      const a = k / 8 * Math.PI * 2, hoja = pieza(new THREE.ConeGeometry(.42, 2.8, 4), k % 2 ? '#3a9a4a' : '#4aae58', { borde: .02 });
      hoja.scale.set(1, 1, .18); hoja.position.copy(p).add(new THREE.Vector3(Math.cos(a) * 1.15, -.35, Math.sin(a) * 1.15));
      hoja.rotation.set(0, -a, 0); hoja.rotateZ(-Math.PI / 2 - .45); g.add(hoja);
    }
    for (let k = 0; k < 3; k++) { const coco = pieza(new THREE.SphereGeometry(.17, 8, 6), '#6a4a2a', { borde: .015 }); coco.position.copy(p).add(new THREE.Vector3(Math.cos(k * 2.1) * .25, -.3, Math.sin(k * 2.1) * .25)); g.add(coco); }
    escena.add(g); obstaculos.push({ x, z, r: .45 });
    const fase = Math.random() * 6; anima.push((t) => { g.rotation.z = Math.sin(t * .8 + fase) * .02; });
  }
  [[-2, 14, 5.5, .3, 0], [6, 24, 6, .2, 1], [-30, 2, 5, .35, 2], [20, 22, 5.2, .25, 3], [-12, -14, 4.6, .3, 4], [30, -18, 5.4, .2, 5], [-34, 22, 4.8, .3, 1.5], [14, -24, 5, .25, 2.5], [36, 6, 5.6, .3, 4.5], [-22, -30, 4.6, .2, .5]]
    .forEach(([x, z, a, i, r]) => palmera(x, z, a, i, r));
  // un anillo de palmeras más lejos, para que la isla parezca isla (salvo donde están la feria, el barco, la gruta y la pasarela)
  for (let k = 0; k < 22; k++) {
    const a = k / 22 * Math.PI * 2 + .13, d = 34 + (k * 7 % 5) * 3, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.hypot(x + 18, z - 14) < 10 || Math.hypot(x - 30, z - 24) < 9 || Math.hypot(x - 24, z + 4) < 10 || (Math.abs(x + 6) < 7 && z < -26)) continue;
    palmera(x, z, 4.6 + (k % 3) * .6, .15 + (k % 4) * .07, k);
  }

  // ---------- la feria abandonada ----------
  const FX = -18, FZ = 14;
  {   // el carrusel: la madera desconchada y los caballitos de mar, que aún dan vueltas solos
    const g = new THREE.Group(); g.position.set(FX, suelo(FX, FZ), FZ); escena.add(g);
    const base = pieza(new THREE.CylinderGeometry(3.4, 3.6, .45, 24), '#b8865a', { borde: .03 }); base.position.y = .22; g.add(base);
    const giro = new THREE.Group(); g.add(giro);
    const palo = pieza(new THREE.CylinderGeometry(.22, .22, 4.2, 10), '#d8b060', { borde: .02 }); palo.position.y = 2.4; giro.add(palo);
    for (let k = 0; k < 10; k++) {   // el techo a gajos, rojo y crema desteñidos
      const gajo = pieza(new THREE.ConeGeometry(3.9, 1.6, 4, 1, false, k * Math.PI / 5, Math.PI / 5), k % 2 ? '#c8564a' : '#f0dcb0', { borde: 0 });
      gajo.position.y = 4.9; giro.add(gajo);
    }
    const bandera = pieza(new THREE.PlaneGeometry(.8, .5), '#1a1a1a', { borde: 0, side: THREE.DoubleSide }); bandera.position.set(.4, 6.1, 0); giro.add(bandera);
    const mastil = pieza(new THREE.CylinderGeometry(.04, .04, 1.2, 6), '#5a4030', { borde: 0 }); mastil.position.y = 5.9; giro.add(mastil);
    const caballitos = [];
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2, c = new THREE.Group(); c.position.set(Math.cos(a) * 2.5, 1.3, Math.sin(a) * 2.5); c.rotation.y = -a; giro.add(c);
      const barra = pieza(new THREE.CylinderGeometry(.05, .05, 3.6, 6), '#e8c870', { borde: 0 }); barra.position.y = 1.1; c.add(barra);
      const col = ['#7ac8d8', '#e8a0b0', '#f0d070'][k % 3];
      const cuerpo = pieza(new THREE.SphereGeometry(.42, 10, 8), col, { borde: .025 }); cuerpo.scale.set(.8, 1.2, 1); c.add(cuerpo);
      const cabeza = pieza(new THREE.SphereGeometry(.26, 10, 8), col, { borde: .02 }); cabeza.position.set(0, .55, .22); c.add(cabeza);
      const morro = pieza(new THREE.CylinderGeometry(.07, .1, .35, 8), col, { borde: .015 }); morro.rotation.x = Math.PI / 2; morro.position.set(0, .52, .5); c.add(morro);
      const cola = pieza(new THREE.TorusGeometry(.2, .07, 6, 10, Math.PI * 1.4), col, { borde: .015 }); cola.position.set(0, -.5, -.1); cola.rotation.y = Math.PI / 2; c.add(cola);
      caballitos.push(c);
    }
    obstaculos.push({ x: FX, z: FZ, r: 3.7 });
    anima.push((t) => { giro.rotation.y = t * .25; caballitos.forEach((c, k) => { c.position.y = 1.3 + Math.sin(t * 1.6 + k * 1.1) * .3; }); });
  }
  function caseta(x, z, giro, texto, col) {
    const g = new THREE.Group(); g.position.set(x, suelo(x, z), z); g.rotation.y = giro; escena.add(g);
    const mostrador = pieza(new THREE.BoxGeometry(2.8, 1.1, 1.2), '#a87a4a'); mostrador.position.y = .55; g.add(mostrador);
    const fondo = pieza(new THREE.BoxGeometry(2.8, 2.6, .2), '#8a6a42'); fondo.position.set(0, 1.3, -.9); g.add(fondo);
    for (const lx of [-1.35, 1.35]) { const p = pieza(new THREE.CylinderGeometry(.07, .07, 2.7, 6), '#6a4a2a', { borde: 0 }); p.position.set(lx, 1.35, .55); g.add(p); }
    for (let k = 0; k < 7; k++) {   // toldo de rayas, un poco caído
      const r = pieza(new THREE.BoxGeometry(.42, .06, 1.7), k % 2 ? col : '#f2e8d0', { borde: 0 }); r.position.set(-1.26 + k * .42, 2.75 - (k === 5 ? .2 : 0), -.05); r.rotation.x = .28; g.add(r);
    }
    const c = cartelTexto(texto, 2.4, .55); c.position.set(0, 3.25, -.75); g.add(c);
    obstaculos.push({ x, z, r: 1.6 });
  }
  caseta(-26, 7, .9, 'TIRO AL LORO', '#c8564a');
  caseta(-9, 22, -2.6, 'GROG CALIENTE', '#3a7aa8');
  caseta(-27, 20, 2.2, 'ADIVINA EL COFRE', '#4a9a5a');
  {   // el arco de entrada, al que le faltan letras (una está en el suelo)
    const ax = -11, az = 6, g = new THREE.Group(); g.position.set(ax, suelo(ax, az), az); g.rotation.y = .7; escena.add(g);
    for (const lx of [-2.6, 2.6]) { const p = pieza(new THREE.CylinderGeometry(.16, .2, 4.4, 8), '#c8564a'); p.position.set(lx, 2.2, 0); g.add(p); }
    const cartel = cartelTexto('FE IA DEL C PITÁN', 5.6, 1, { fondo: '#f0d070', tinta: '#7a2a1a' }); cartel.position.y = 4.6; cartel.rotation.z = -.05; g.add(cartel);
    const letra = cartelTexto('R', .6, .7, { fondo: '#f0d070', tinta: '#7a2a1a' }); letra.position.set(1.4, .05, 1.1); letra.rotation.set(-Math.PI / 2 + .1, 0, .6); g.add(letra);
    obstaculos.push({ x: ax - 2, z: az - 1.6, r: .4 }, { x: ax + 2, z: az + 1.6, r: .4 });
  }
  {   // un barco varado en la arena, tumbado, con la bandera rota
    const bx = 30, bz = 24, g = new THREE.Group(); g.position.set(bx, suelo(bx, bz) - .3, bz); g.rotation.set(0, -.6, .32); escena.add(g);
    const casco = pieza(new THREE.SphereGeometry(3, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#6a4a2e', { side: THREE.DoubleSide }); casco.scale.set(1, .7, 2.2); casco.position.y = 1.6; g.add(casco);
    const cubierta = pieza(new THREE.CylinderGeometry(3, 3, .12, 16), '#9a7a4e'); cubierta.scale.set(1, 1, 2.2); cubierta.position.y = 1.55; g.add(cubierta);
    const mastil = pieza(new THREE.CylinderGeometry(.14, .18, 6.5, 8), '#5a4030'); mastil.position.set(0, 4.7, .5); g.add(mastil);
    const vela = pieza(new THREE.PlaneGeometry(2.6, 2.2, 4, 4), '#e8dcc0', { side: THREE.DoubleSide, borde: 0 }); vela.position.set(0, 5.2, .55); g.add(vela);
    const calavera = cartelTexto('☠', .9, .7, { fondo: '#1a1a1a', tinta: '#f2ead8', letra: 'bold 200px serif' }); calavera.position.set(.5, 7.6, .5); g.add(calavera);
    obstaculos.push({ x: bx, z: bz, r: 4.8 });
    anima.push((t) => { vela.rotation.y = Math.sin(t * .9) * .15; calavera.rotation.y = Math.sin(t * 1.3) * .5; });
  }

  // ---------- la cabeza de mono gigante: se entra a la gruta por la boca ----------
  {
    const C = mundo.cripta;
    // fuera la entrada de siempre (pilares, arco, runas, antorchas): solo quedan la puerta oscura, los escalones y las luces
    let puerta = null;
    for (const h of [...C.children]) {
      const p = h.geometry?.parameters;
      if (h.isLight) continue;
      if (h.geometry?.type === 'PlaneGeometry' && p.height === 4.2) { puerta = h; continue; }
      if (h.geometry?.type === 'BoxGeometry' && p.depth === .7) continue;
      h.visible = false;
    }
    if (puerta) puerta.position.z = .15;
    const g = new THREE.Group(); C.add(g);
    const piedra = '#8a8a78', clara = '#b4ad94', oscura = '#5e5d50';
    const cabeza = pieza(new THREE.SphereGeometry(5, 26, 18), piedra, { borde: .07, flatShading: true }); cabeza.scale.set(1.15, 1, .9); cabeza.position.set(0, 5.2, -4.2); g.add(cabeza);
    for (const lx of [-1, 1]) {
      const oreja = pieza(new THREE.SphereGeometry(2, 14, 10), piedra, { borde: .05, flatShading: true }); oreja.scale.set(.45, 1, .9); oreja.position.set(lx * 5.9, 6, -4.4); g.add(oreja);
      const dentro = pieza(new THREE.SphereGeometry(1.3, 12, 8), clara, { borde: 0, flatShading: true }); dentro.scale.set(.35, .9, .8); dentro.position.set(lx * 6.25, 6, -4); g.add(dentro);
      const cuenca = pieza(new THREE.SphereGeometry(1.05, 12, 8), oscura, { borde: 0 }); cuenca.scale.set(1, .8, .5); cuenca.position.set(lx * 1.75, 7.6, -.35); g.add(cuenca);
      const ojo = new THREE.Mesh(new THREE.SphereGeometry(.55, 12, 10), toon('#ffd04a', { emissive: '#ffb020', emissiveIntensity: 2 })); ojo.position.set(lx * 1.75, 7.6, -.05); g.add(ojo);
    }
    const ceja = pieza(new THREE.BoxGeometry(6.4, .9, 1.6), piedra, { borde: .05, flatShading: true }); ceja.position.set(0, 8.75, -.9); ceja.rotation.x = -.25; g.add(ceja);
    // el hocico, con los agujeros de la nariz, encima de la boca
    const hocico = pieza(new THREE.SphereGeometry(2.2, 16, 10), clara, { borde: .05, flatShading: true }); hocico.scale.set(1.5, .85, .75); hocico.position.set(0, 5.7, -.5); g.add(hocico);
    for (const lx of [-.6, .6]) { const nariz = new THREE.Mesh(new THREE.SphereGeometry(.3, 8, 6), toon('#2a2a22')); nariz.scale.set(1, .7, .5); nariz.position.set(lx, 5.85, 1.1); g.add(nariz); }
    // la boca abierta de par en par: labios de piedra alrededor de la puerta, y unos dientes
    const labio = pieza(new THREE.TorusGeometry(1.75, .5, 8, 22), clara, { borde: .04, flatShading: true }); labio.scale.set(1.15, 1.3, 1); labio.position.set(0, 2.2, .1); g.add(labio);
    const fondo = new THREE.Mesh(new THREE.CircleGeometry(1.75, 22), toon('#120c16', { emissive: '#2a1145', emissiveIntensity: .5 })); fondo.scale.set(1.15, 1.3, 1); fondo.position.set(0, 2.2, .05); g.add(fondo);
    for (let k = 0; k < 6; k++) {
      const x = (k - 2.5) * .5, arriba = pieza(new THREE.ConeGeometry(.2, .55, 5), '#e8e2cc', { borde: .02 });
      arriba.rotation.x = Math.PI; arriba.position.set(x, 4.35 - Math.abs(x) * .25, .35); g.add(arriba);
    }
    const barbilla = pieza(new THREE.SphereGeometry(1.6, 12, 8), piedra, { borde: .04, flatShading: true }); barbilla.scale.set(1.7, .45, .9); barbilla.position.set(0, -.05, -.4); g.add(barbilla);
    // musgo por encima y una enredadera colgando de la oreja
    const azarM = (i) => (Math.sin(i * 91.7) * 4375.85) % 1;
    for (let k = 0; k < 16; k++) { const a = Math.abs(azarM(k + 1)) * Math.PI, m = pieza(new THREE.SphereGeometry(.45 + Math.abs(azarM(k + 7)) * .4, 8, 6), k % 2 ? '#5a8a3a' : '#6a9a42', { borde: 0 }); m.position.set(Math.cos(a) * 5.3, 5.2 + Math.sin(a) * 4.7, -3 + Math.abs(azarM(k + 3)) * 1.5); g.add(m); }
    for (let k = 0; k < 6; k++) { const hoja = pieza(new THREE.SphereGeometry(.28, 6, 5), '#4a7a30', { borde: 0 }); hoja.position.set(-5.7 + Math.sin(k) * .2, 4.6 - k * .7, -2.6); g.add(hoja); }
    const luzOjos = new THREE.PointLight('#ffc04a', 10, 18, 1.4); luzOjos.position.set(0, 7.6, 2.5); g.add(luzOjos);
    const luzBoca = new THREE.PointLight('#a77bff', 4, 7, 1.8); luzBoca.position.set(0, 1.6, 1.4); g.add(luzBoca);
    anima.push((t) => { luzOjos.intensity = 9 + Math.sin(t * 2.2) * 2.5; luzBoca.intensity = 3.5 + Math.sin(t * 3.1) * 1; });
    C.updateMatrixWorld(true);
    const centro = C.localToWorld(new THREE.Vector3(0, 0, -4.4));
    obstaculos.push({ x: centro.x, z: centro.z, r: 5.2 });
  }

  return { actualizar: (t) => { for (const f of anima) f(t); } };
}
