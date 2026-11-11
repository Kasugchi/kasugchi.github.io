// =============================================================
//  ENTRADAS DE CRIPTA CON TEMA
//  Cada parada puede tapar la entrada de piedra de siempre con su propia
//  fachada (en paradas.js, «decor»). La puerta oscura, los escalones y las
//  luces de la cripta se quedan: se entra igual que siempre.
//  (La de la isla, la cabeza de mono, vive en js/decor-isla.js.)
// =============================================================
import * as THREE from 'three';
import { toon, contorno, lienzo } from './claro-estilo.js';

const pieza = (geo, color, { borde = .03, ...op } = {}) => { const m = new THREE.Mesh(geo, toon(color, op)); m.castShadow = true; m.receiveShadow = true; if (borde) contorno(m, borde); return m; };
const azar = (i) => Math.abs((Math.sin(i * 127.1) * 43758.5453) % 1);

// Esconde pilares, arco, runas y antorchas de la entrada de piedra; devuelve la puerta
function despejar(C) {
  let puerta = null;
  for (const h of [...C.children]) {
    const p = h.geometry?.parameters;
    if (h.isLight) continue;
    if (h.geometry?.type === 'PlaneGeometry' && p.height === 4.2) { puerta = h; continue; }
    if (h.geometry?.type === 'BoxGeometry' && p.depth === .7) continue;   // los escalones
    h.visible = false;
  }
  return puerta;
}
// Un rótulo pintado en un lienzo (una cara; la otra mira a la pared)
function rotulo(ancho, alto, pintar) {
  const tx = lienzo(512, Math.round(512 * alto / ancho), pintar);
  return new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: tx, transparent: true }));
}
function obstaculo(mundo, C, x, z, r) { C.updateMatrixWorld(true); const p = C.localToWorld(new THREE.Vector3(x, 0, z)); mundo.obstaculos.push({ x: p.x, z: p.z, r }); }

// ---------- EL CINE ABANDONADO (parada «cine») ----------
// Fachada de cine de barrio: marquesina de bombillas (unas fundidas, otras tiritando),
// letrero con letras caídas, carteles de películas inventadas despegándose, una taquilla
// cerrada y las cortinas de la sala entreabiertas, con la luz del proyector saliendo por la rendija.
export function entradaCine(escena, mundo) {
  const C = mundo.cripta, anima = [], g = new THREE.Group();
  const puerta = despejar(C); if (puerta) puerta.position.z = -.12;
  C.add(g);   // después de despejar: si no, se escondería también
  const muro = '#9a9288', moldura = '#6e665c', oscuro = '#2a2624';

  // el edificio: cuerpo, cornisa y pilastras a los lados de la puerta
  const cuerpo = pieza(new THREE.BoxGeometry(9.5, 7.2, 5), muro, { borde: .05 }); cuerpo.position.set(0, 3.6, -2.9); g.add(cuerpo);
  const cornisa = pieza(new THREE.BoxGeometry(10.1, .5, 5.6), moldura, { borde: .04 }); cornisa.position.set(0, 7.35, -2.9); g.add(cornisa);
  for (const lx of [-1, 1]) {
    const pil = pieza(new THREE.BoxGeometry(.7, 4.6, .5), moldura, { borde: .03 }); pil.position.set(lx * 1.75, 2.3, -.2); g.add(pil);
    for (const x of [lx * 4.5]) { const esq = pieza(new THREE.BoxGeometry(.6, 7.2, .4), moldura, { borde: .03 }); esq.position.set(x, 3.6, -.3); g.add(esq); }
  }
  // las cortinas de la sala, entreabiertas, y la rendija de luz del proyector
  const tela = toon('#7a1c22');
  for (const lx of [-1, 1]) {
    const cortina = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 4.1, 6, 1), tela);
    const pa = cortina.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 9) * .06);   // pliegues
    cortina.geometry.computeVertexNormals(); cortina.position.set(lx * .72, 2.05, -.02); g.add(cortina);
  }
  const rendija = new THREE.Mesh(new THREE.PlaneGeometry(.22, 4), new THREE.MeshBasicMaterial({ color: '#fffbe8', transparent: true, opacity: .85 })); rendija.position.set(0, 2.05, -.06); g.add(rendija);
  const proyector = new THREE.PointLight('#fff6dc', 5, 9, 1.6); proyector.position.set(0, 2, 1.2); g.add(proyector);
  const haz = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#fffbe8', transparent: true, opacity: .07, side: THREE.DoubleSide, depthWrite: false }));
  haz.rotation.x = -Math.PI / 2; haz.position.set(0, 2, 1.9); g.add(haz);

  // la marquesina con sus bombillas y el letrero de letras sueltas
  const marq = pieza(new THREE.BoxGeometry(7.4, 1.1, 2.4), '#c8c0b2', { borde: .04 }); marq.position.set(0, 5.1, .9); g.add(marq);
  const bajo = pieza(new THREE.BoxGeometry(7.6, .18, 2.6), moldura, { borde: .02 }); bajo.position.set(0, 4.5, .9); g.add(bajo);
  const letrero = rotulo(6.8, .9, (x, w, h) => {
    x.fillStyle = '#f4efe2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1816'; x.font = 'bold 40px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('HOY:  L A  CR PTA  (MUDA)', w / 2, h / 2 + 2);
  });
  letrero.position.set(0, 5.1, 2.11); g.add(letrero);
  const caida = rotulo(.45, .55, (x, w, h) => { x.fillStyle = '#f4efe2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1816'; x.font = 'bold 200px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('I', w / 2, h / 2 + 8); });
  caida.position.set(1.6, .16, 2.3); caida.rotation.set(-Math.PI / 2, 0, .7); g.add(caida);   // la I, tirada en el suelo
  const bombillas = [], matOn = new THREE.MeshBasicMaterial({ color: '#fff4c8' }), matOff = toon('#5a5650');
  const bGeo = new THREE.SphereGeometry(.09, 8, 6);
  const filas = [];
  for (let i = 0; i <= 24; i++) filas.push([-3.6 + i * .3, 5.72, 2.12], [-3.6 + i * .3, 4.48, 2.12]);
  for (let i = 1; i < 4; i++) filas.push([-3.72, 4.48 + i * .31, 2.12], [3.72, 4.48 + i * .31, 2.12]);
  filas.forEach(([x, y, z], k) => {
    const r = azar(k + 3), b = new THREE.Mesh(bGeo, r < .14 ? matOff : matOn.clone()); b.position.set(x, y, z); g.add(b);
    if (r >= .14) bombillas.push({ b, tirita: r > .88, fase: r * 40 });
  });
  const luzMarq = new THREE.PointLight('#fff0c0', 6, 12, 1.5); luzMarq.position.set(0, 4.2, 3); g.add(luzMarq);

  // el letrero vertical «CINE» encima, como los de antes
  const caja = pieza(new THREE.BoxGeometry(4.2, 1.5, .4), oscuro, { borde: .04 }); caja.position.set(0, 8.4, -.6); g.add(caja);
  const cine = rotulo(3.9, 1.25, (x, w, h) => {
    x.fillStyle = '#1e1c1a'; x.fillRect(0, 0, w, h); x.fillStyle = '#fbf6e8'; x.font = 'bold 120px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('C', w * .2, h / 2 + 6); x.fillText('N', w * .6, h / 2 + 6); x.fillText('E', w * .8, h / 2 + 6);
    x.globalAlpha = .35; x.fillText('I', w * .4, h / 2 + 6);   // la I, fundida
  });
  cine.position.set(0, 8.4, -.39); g.add(cine);
  for (const lx of [-1, 1]) { const pata = pieza(new THREE.BoxGeometry(.15, 1.2, .15), oscuro, { borde: 0 }); pata.position.set(lx * 1.5, 7.6, -.6); g.add(pata); }

  // carteles de películas inventadas, despegándose
  const CARTELES = [
    ['EL ESQUELETO', 'ENAMORADO', 'Un drama con muchos huesos', 0],
    ['LA MOMIA', 'QUE NO CALLABA', 'Comedia vendada', 1],
    ['PRÓXIMAMENTE', 'LA RANA', 'QUE OPINABA', 2]
  ];
  CARTELES.forEach(([a, b, c, k], i) => {
    const cartel = rotulo(1.6, 2.3, (x, w, h) => {
      x.fillStyle = '#e8e2d2'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a2624'; x.lineWidth = 14; x.strokeRect(12, 12, w - 24, h - 24);
      x.fillStyle = '#2a2624';   // una silueta: calavera, momia o rana
      if (k === 0) { x.beginPath(); x.arc(w / 2, h * .42, 90, 0, 7); x.fill(); x.fillStyle = '#e8e2d2'; x.beginPath(); x.arc(w / 2 - 32, h * .4, 22, 0, 7); x.arc(w / 2 + 32, h * .4, 22, 0, 7); x.fill(); }
      else if (k === 1) { x.fillRect(w / 2 - 70, h * .26, 140, 230); x.strokeStyle = '#e8e2d2'; x.lineWidth = 8; for (let y = 0; y < 6; y++) { x.beginPath(); x.moveTo(w / 2 - 70, h * .3 + y * 38); x.lineTo(w / 2 + 70, h * .3 + y * 38 + 14); x.stroke(); } }
      else { x.beginPath(); x.ellipse(w / 2, h * .45, 110, 75, 0, 0, 7); x.fill(); x.beginPath(); x.arc(w / 2 - 55, h * .33, 30, 0, 7); x.arc(w / 2 + 55, h * .33, 30, 0, 7); x.fill(); }
      x.fillStyle = '#2a2624'; x.textAlign = 'center'; x.font = 'bold 50px Georgia, serif'; x.fillText(a, w / 2, 90); x.font = 'bold 54px Georgia, serif'; x.fillText(b, w / 2, h - 120); x.font = 'italic 34px Georgia, serif'; x.fillText(c, w / 2, h - 60);
    });
    const x = [-3.15, 3.15, -3.15][i], y = [2.6, 2.6, 5.9][i];
    if (i === 2) return;   // el tercero va en la taquilla
    cartel.position.set(x, y, -.04); cartel.rotation.z = (azar(i + 9) - .5) * .12; g.add(cartel);
    const esquina = new THREE.Mesh(new THREE.PlaneGeometry(.45, .45), new THREE.MeshBasicMaterial({ color: '#cfc8b6', side: THREE.DoubleSide }));   // la esquina que se despega
    esquina.position.set(x + .62, y - .95, .12); esquina.rotation.set(-.6, .5, .78); g.add(esquina);
    const marco = pieza(new THREE.BoxGeometry(1.85, 2.55, .12), moldura, { borde: .02 }); marco.position.set(x, y, -.12); g.add(marco);
  });

  // la taquilla, cerrada a cal y canto
  const taq = new THREE.Group(); taq.position.set(3.6, 0, 1.6); taq.rotation.y = -.35; g.add(taq);
  const caseta = pieza(new THREE.BoxGeometry(1.5, 2.5, 1.3), '#b0a898', { borde: .04 }); caseta.position.y = 1.25; taq.add(caseta);
  const tejado = pieza(new THREE.ConeGeometry(1.15, .8, 4), moldura, { borde: .03 }); tejado.position.y = 2.9; tejado.rotation.y = Math.PI / 4; taq.add(tejado);
  const ventana = new THREE.Mesh(new THREE.PlaneGeometry(.9, .7), toon('#1a1816')); ventana.position.set(0, 1.55, .66); taq.add(ventana);
  const grieta = rotulo(.9, .7, (x, w, h) => { x.strokeStyle = '#d8d8d0'; x.lineWidth = 5; x.beginPath(); x.moveTo(w * .2, 0); x.lineTo(w * .45, h * .4); x.lineTo(w * .3, h * .7); x.moveTo(w * .45, h * .4); x.lineTo(w * .8, h * .55); x.stroke(); });
  grieta.position.set(0, 1.55, .67); taq.add(grieta);
  const aviso = rotulo(1.1, .45, (x, w, h) => { x.fillStyle = '#f0ead8'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2624'; x.font = 'bold 64px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('CERRADO', w / 2, h * .38); x.font = 'italic 34px Georgia, serif'; x.fillText('(desde 1912)', w / 2, h * .8); });
  aviso.position.set(0, .85, .67); aviso.rotation.z = .08; taq.add(aviso);

  obstaculo(mundo, C, -2.4, -3, 3); obstaculo(mundo, C, 2.4, -3, 3);
  C.updateMatrixWorld(true); const pt = taq.getWorldPosition(new THREE.Vector3()); mundo.obstaculos.push({ x: pt.x, z: pt.z, r: 1 });

  // bombillas que tiritan, el proyector que parpadea como una película vieja
  anima.push((t) => {
    for (const { b, tirita, fase } of bombillas) {
      const encendida = tirita ? Math.sin(t * 13 + fase) + Math.sin(t * 5.3 + fase * 2) > -.4 : true;
      b.material.color.set(encendida ? '#fff4c8' : '#6a665e');
    }
    const parpadeo = .8 + Math.sin(t * 24) * .1 + (Math.sin(t * 3.7) > .97 ? -.5 : 0);
    proyector.intensity = 5 * parpadeo; rendija.material.opacity = .65 + parpadeo * .25; haz.material.opacity = .05 + parpadeo * .03;
    luzMarq.intensity = 5.5 + Math.sin(t * 2) * .5;
  });
  return { actualizar(t) { for (const f of anima) f(t); } };
}
