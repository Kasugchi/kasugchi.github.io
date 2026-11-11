// =============================================================
//  ROBOTS · EL DIBUJO: los muñecos 3D de los robots (todo hecho en código)
//  El cuerpo cambia con el alma (núcleo): escarabajo con caparazón, mantis estirada,
//  tortuga ancha con concha, búho redondo con alitas. Cada pieza tiene su forma
//  (P.forma); las de los modelos salvajes, la suya propia, para que se reconozcan.
//  Con las cuatro piezas de un modelo, el cuerpo se pinta de su color.
// =============================================================
import * as THREE from 'three';
import { toon, contorno, lienzo } from './claro-estilo.js';
import { NUCLEOS, PIEZAS, juegoDe } from './robots.js';

const caja = (w, h, d, c, b = .03) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(c)); m.castShadow = true; if (b) contorno(m, b); return m; };
const cil = (rt, rb, h, c, s = 14, b = .03) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), toon(c)); m.castShadow = true; if (b) contorno(m, b); return m; };
const bola = (r, c, b = .03) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), toon(c)); m.castShadow = true; if (b) contorno(m, b); return m; };
const cono = (r, h, c, s = 10, b = .02) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, s), toon(c)); m.castShadow = true; if (b) contorno(m, b); return m; };
const brilla = (r, c) => new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: c }));
const en = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const ojos = (g, sep, y, z, r = .06, c = '#7ff0ff') => { g.add(en(brilla(r, c), -sep, y, z), en(brilla(r, c), sep, y, z)); };
const oscuro = (c, k = .35) => '#' + new THREE.Color(c).lerp(new THREE.Color('#1a1420'), k).getHexString();
const claro = (c, k = .35) => '#' + new THREE.Color(c).lerp(new THREE.Color('#fff8e6'), k).getHexString();

// ---------- cabezas ----------
function cabeza(P) {
  const g = new THREE.Group(), c = P.color, f = P.forma;
  if (f === 'lata') { g.add(cil(.32, .32, .5, c)); ojos(g, .12, .05, .3, .07); }
  else if (f === 'casco') { g.add(bola(.38, c)); const v = cil(.2, .2, .08, '#1a2a3a', 16, .02); v.rotation.x = Math.PI / 2; v.position.z = .34; g.add(v); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(en(bola(.035, '#6a4a2a', 0), Math.cos(a) * .22, Math.sin(a) * .22, .33)); } }
  else if (f === 'radar') { g.add(caja(.5, .36, .44, c)); const d = new THREE.Mesh(new THREE.SphereGeometry(.28, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), toon('#d8dde2', { side: THREE.DoubleSide })); d.position.y = .32; d.rotation.x = .5; g.add(d); g.userData.gira = d; g.add(en(brilla(.06, '#ff5a4a'), 0, 0, .23)); }
  else if (f === 'cruz') { g.add(caja(.5, .44, .44, c)); const tx = lienzo(64, 64, (x, w) => { x.fillStyle = '#d83a3a'; x.fillRect(w * .4, w * .15, w * .2, w * .7); x.fillRect(w * .15, w * .4, w * .7, w * .2); }); g.add(en(new THREE.Mesh(new THREE.PlaneGeometry(.34, .34), new THREE.MeshBasicMaterial({ map: tx, transparent: true })), 0, 0, .225)); }
  else if (f === 'cuerno') { g.add(caja(.5, .4, .5, c)); const k = cono(.1, .4, '#e8e0c8'); k.rotation.x = Math.PI / 2.6; k.position.set(0, .12, .35); g.add(k); const k2 = cono(.06, .2, '#e8e0c8'); k2.rotation.x = Math.PI / 2.6; k2.position.set(0, .2, .12); g.add(k2); ojos(g, .13, .05, .26, .05, '#ff6a3a'); }
  else if (f === 'concha') { const t = new THREE.Mesh(new THREE.TorusGeometry(.24, .14, 10, 18), toon(c)); contorno(t, .03); t.rotation.y = Math.PI / 2; g.add(t, bola(.2, '#c8b07a')); ojos(g, .1, .1, .3, .05, '#1a1a1a'); }
  else if (f === 'antena') { g.add(caja(.46, .38, .4, c)); g.add(en(cil(.02, .02, .5, '#2a2a2a', 6, 0), 0, .42, 0)); const p = brilla(.08, '#ffe04a'); p.position.y = .7; g.add(p); g.userData.chispa = p; g.add(en(brilla(.06, '#7ff0ff'), 0, 0, .21)); }
  // las de los modelos salvajes
  else if (f === 'caparazon') {   // cangrejo: caparazón ancho y plano, ojos en palitos
    const cap = bola(.42, c); cap.scale.set(1.25, .55, 1); g.add(cap);
    for (const s of [-1, 1]) { g.add(en(cil(.025, .025, .3, oscuro(c), 6, 0), s * .16, .25, .2)); g.add(en(bola(.07, '#f4ecd8', .02), s * .16, .42, .2)); g.add(en(brilla(.035, '#1a1a1a'), s * .16, .43, .26)); }
  } else if (f === 'ojazos') {   // avispa: dos ojos enormes y antenas
    g.add(bola(.26, c)); for (const s of [-1, 1]) { const o = bola(.17, '#2a2a3a', .02); o.scale.set(1, 1.2, .8); g.add(en(o, s * .2, .04, .14)); g.add(en(brilla(.04, '#bfe8ff'), s * .22, .1, .28)); const a = cil(.015, .015, .32, '#2a2a2a', 5, 0); a.rotation.z = s * -.5; g.add(en(a, s * .12, .34, .05)); g.add(en(bola(.04, '#2a2a2a', 0), s * .2, .48, .05)); }
    const raya = cil(.265, .265, .08, '#2a2a2a', 16, 0); raya.position.y = -.08; g.add(raya);
  } else if (f === 'minero') {   // topo: casco con linterna y hocico rosa
    g.add(bola(.3, c)); const casco = new THREE.Mesh(new THREE.SphereGeometry(.33, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon('#e8c83a')); contorno(casco, .02); casco.position.y = .04; g.add(casco);
    const lin = cil(.08, .1, .1, '#5a5a62', 10, .02); lin.rotation.x = Math.PI / 2; g.add(en(lin, 0, .28, .26)); g.add(en(brilla(.07, '#fff8b0'), 0, .28, .32)); g.userData.chispa = g.children[g.children.length - 1];
    g.add(en(bola(.08, '#e88a9a', .02), 0, -.08, .3)); ojos(g, .12, .04, .26, .03, '#1a1a1a');
  } else if (f === 'bulbo') {   // pulpo: cabezota alargada con manchas
    const b = bola(.34, c); b.scale.set(1, 1.3, 1); b.position.y = .12; g.add(b);
    for (let i = 0; i < 5; i++) { const a = i * 1.3; g.add(en(bola(.05, claro(c, .5), 0), Math.cos(a) * .3, .2 + (i % 2) * .15, Math.sin(a) * .3)); }
    for (const s of [-1, 1]) { const o = bola(.09, '#f4ecd8', .02); g.add(en(o, s * .14, -.02, .28)); g.add(en(brilla(.04, '#1a1a1a'), s * .14, -.02, .36)); }
  } else if (f === 'bombilla') {   // luciérnaga: bombilla que brilla de verdad
    g.add(cil(.16, .2, .2, '#a8a8b0', 12)); const b = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff4a0', transparent: true, opacity: .9 })); b.position.y = .32; g.add(b); g.userData.chispa = b;
    const fil = cil(.02, .02, .2, '#ff8a3a', 5, 0); fil.position.y = .3; g.add(fil); ojos(g, .09, 0, .17, .04, '#2a2a2a');
  } else if (f === 'puas') {   // erizo: bola llena de púas
    g.add(bola(.3, c)); for (let i = 0; i < 18; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), d = new THREE.Vector3(Math.cos(a) * r, u, Math.sin(a) * r); if (d.z > .55) continue; const p = cono(.05, .22, oscuro(c, .4), 5, 0); p.position.copy(d.clone().multiplyScalar(.36)); p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); g.add(p); }
    g.add(en(bola(.06, '#2a2a2a', 0), 0, -.04, .32)); ojos(g, .1, .08, .26, .035, '#1a1a1a');
  } else if (f === 'hornillo') {   // salamandra: estufita con chimenea y boca de brasas
    g.add(caja(.5, .4, .46, c)); g.add(en(cil(.06, .06, .3, '#4a4a52', 8), .14, .32, -.08));
    const boca = caja(.3, .12, .02, '#ff8a2a', 0); boca.material = new THREE.MeshBasicMaterial({ color: '#ff8a2a' }); g.add(en(boca, 0, -.08, .24)); g.userData.chispa = boca; ojos(g, .13, .08, .24, .05, '#ffd24a');
  } else if (f === 'orejas') {   // hámster: orejas redondas y mofletes
    const b = bola(.3, c); b.scale.set(1.1, .95, 1); g.add(b); for (const s of [-1, 1]) { const o = cil(.12, .12, .05, c, 14, .02); o.rotation.x = Math.PI / 2; g.add(en(o, s * .22, .28, 0)); const oi = en(cil(.07, .07, .06, '#e8a8b0', 12, 0), s * .22, .28, .01); oi.rotation.x = Math.PI / 2; g.add(oi); g.add(en(bola(.08, claro(c, .5), 0), s * .18, -.08, .2)); }
    ojos(g, .1, .06, .27, .04, '#1a1a1a'); g.add(en(bola(.04, '#e88a9a', 0), 0, -.02, .3));
  }
  return g;
}

// ---------- brazos (el «fin» es lo que golpea) ----------
function brazo(P, lado) {
  const g = new THREE.Group(), c = P.color, f = P.forma, hombro = bola(.15, '#5a5a62'); g.add(hombro);
  const flexible = f === 'tentaculo' || f === 'ojo';
  if (!flexible) g.add(en(cil(.08, .08, .5, '#6a6a72', 8), 0, -.3, 0));
  const fin = new THREE.Group(); fin.position.y = -.6; g.add(fin);
  if (f === 'puno') { fin.add(en(cil(.04, .04, .2, '#c8c8c8', 6, 0), 0, .05, 0), bola(.17, c)); }
  else if (f === 'canon') { const t = cil(.1, .12, .5, c); t.rotation.x = Math.PI / 2; t.position.z = .2; fin.add(t); }
  else if (f === 'martillo') { fin.add(en(caja(.36, .22, .22, c), 0, -.08, 0)); }
  else if (f === 'pinza') { for (const s of [-1, 1]) { const p = cono(.08, .32, c, 6); p.position.set(s * .08, -.12, 0); p.rotation.z = s * .35 + Math.PI; fin.add(p); } }
  else if (f === 'escudo') { const e = cil(.34, .34, .06, c, 20); e.rotation.z = Math.PI / 2; e.position.x = lado * .1; fin.add(e, en(bola(.05, '#5a5a62', 0), lado * .14, 0, 0)); }
  else if (f === 'soplete') { const t = cil(.1, .1, .3, c); t.rotation.x = Math.PI / 2; t.position.z = .1; const b = cono(.09, .2, '#3a3a3a'); b.rotation.x = Math.PI / 2; b.position.z = .32; fin.add(t, b); }
  else if (f === 'taladro') { const t = cono(.13, .45, c, 12); t.rotation.x = -Math.PI / 2; t.position.z = .25; fin.add(cil(.12, .12, .16, '#5a5a62'), t); g.userData.taladro = t; }
  else if (f === 'iman') { const u = new THREE.Mesh(new THREE.TorusGeometry(.16, .07, 8, 16, Math.PI), toon(c)); contorno(u, .02); u.rotation.z = Math.PI; u.position.y = -.06; fin.add(u); for (const sx of [-1, 1]) fin.add(en(cil(.07, .07, .1, '#d8d8e0', 8, 0), sx * .16, -.08, 0)); }
  else if (f === 'remache') { fin.add(caja(.24, .24, .24, c)); for (let i = 0; i < 3; i++) { const t = cil(.035, .035, .35, '#2a2a2a', 6, 0); t.rotation.x = Math.PI / 2; t.position.set((i - 1) * .07, 0, .25); fin.add(t); } }
  // las de los modelos salvajes
  else if (f === 'pinzota') {   // cangrejo: la pinza gorda, abierta
    const base = bola(.2, c); base.scale.set(1, 1.3, 1); fin.add(base);
    const arriba = cono(.12, .4, c, 8); arriba.rotation.z = Math.PI - .35; arriba.position.set(.06, -.28, 0); const abajo = cono(.09, .32, oscuro(c, .15), 8); abajo.rotation.z = Math.PI + .45; abajo.position.set(-.08, -.24, 0); fin.add(arriba, abajo);
  } else if (f === 'aguijon') {   // avispa: abdomen a rayas con aguijón
    const ab = bola(.16, '#e8c02a'); ab.scale.set(1, 1.4, 1); fin.add(ab); for (const y of [-.06, .08]) fin.add(en(cil(.162, .162, .05, '#2a2a2a', 14, 0), 0, y, 0));
    const p = cono(.05, .28, '#2a2a2a', 8); p.rotation.x = -Math.PI / 2; p.position.z = .2; p.position.y = -.12; fin.add(p);
  } else if (f === 'bobina') {   // bobina eléctrica con chispa
    fin.add(cil(.06, .06, .34, '#6a6a72', 8)); for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.11, .03, 6, 14), toon(i % 2 ? c : '#c87a3a')); t.rotation.x = Math.PI / 2; t.position.y = -.12 + i * .06; fin.add(t); }
    const ch = brilla(.07, '#ffe04a'); ch.position.y = -.24; fin.add(ch); g.userData.chispa = ch;
  } else if (f === 'garra') {   // topo: zarpa ancha con tres uñas
    const m = bola(.16, c); m.scale.set(1.3, .8, 1); fin.add(m); for (let i = -1; i <= 1; i++) { const u = cono(.04, .2, '#e8e0c8', 6, 0); u.rotation.z = Math.PI; u.position.set(i * .1, -.18, .06); fin.add(u); }
  } else if (f === 'pala') {   // pala de obra
    fin.add(en(cil(.03, .03, .3, '#8a5a3a', 6, 0), 0, -.05, 0)); const h = caja(.3, .36, .04, c); h.position.set(0, -.34, .05); h.rotation.x = .3; fin.add(h);
  } else if (f === 'tentaculo') {   // pulpo: tentáculo de bolitas que se mece
    const seg = []; for (let i = 0; i < 6; i++) { const b = bola(.1 - i * .012, i % 2 ? c : claro(c, .2), .015); b.position.y = -.12 - i * .13; g.add(b); seg.push(b); } g.userData.ondea = seg; fin.position.y = -.85;
  } else if (f === 'tubo') {   // tubo con boquilla de chorro
    const t = cil(.09, .09, .4, c); t.rotation.x = Math.PI / 2; t.position.z = .16; const b = cil(.13, .06, .12, '#3a2a4a'); b.rotation.x = Math.PI / 2; b.position.z = .4; fin.add(t, b);
  } else if (f === 'yunque') {   // rino: puño-yunque enorme
    const y = caja(.42, .2, .26, c); y.position.y = -.1; const p = caja(.22, .14, .2, oscuro(c, .2)); p.position.y = .04; const pico = cono(.1, .22, c, 4); pico.rotation.z = Math.PI / 2; pico.position.set(-.3, -.1, 0); fin.add(y, p, pico);
  } else if (f === 'placa') {   // rino: placa blindada con remaches
    const e = caja(.08, .56, .42, c); e.position.x = lado * .1; fin.add(e); for (const [y, z] of [[.2, .15], [.2, -.15], [-.2, .15], [-.2, -.15]]) fin.add(en(bola(.035, '#d8d8e0', 0), lado * .15, y, z));
  } else if (f === 'farol') {   // luciérnaga: farolillo que da luz
    fin.add(caja(.2, .06, .2, '#3a3a42')); const v = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, .24, 8), new THREE.MeshBasicMaterial({ color: '#ffe08a' })); v.position.y = -.15; fin.add(v); fin.add(en(caja(.24, .05, .24, '#3a3a42'), 0, -.29, 0)); g.userData.chispa = v;
  } else if (f === 'hocico') {   // erizo: hocico puntiagudo con trufa
    const h = cono(.13, .32, c, 10); h.rotation.x = Math.PI / 2; h.position.z = .12; fin.add(h, en(bola(.05, '#2a2a2a', 0), 0, 0, .28));
  } else if (f === 'ojo') {   // caracol: ojo en antena que se mueve
    const a = cil(.035, .035, .6, c, 6, 0); a.position.y = -.3; g.add(a); const o = bola(.11, '#f4ecd8', .02); o.position.y = -.65; g.add(o); g.add(en(brilla(.05, '#1a1a1a'), 0, -.65, .09)); g.userData.ondea = [a, o]; fin.position.y = -.65;
  } else if (f === 'baba') {   // caracol: pegote de baba
    const b = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 10), new THREE.MeshBasicMaterial({ color: '#b8e88a', transparent: true, opacity: .8 })); b.scale.set(1, 1.3, 1); b.position.y = -.05; fin.add(b, en(bola(.06, '#e8ffd0', 0), .05, .02, .12));
  } else if (f === 'zarpa') {   // salamandra: zarpa con dedos al rojo
    fin.add(bola(.13, c)); for (let i = -1; i <= 1; i++) { const d = cil(.03, .025, .18, '#ff8a3a', 5, 0); d.position.set(i * .07, -.14, .04); d.rotation.x = .3; fin.add(d); }
  }
  g.userData.fin = fin;
  return g;
}

// ---------- piernas ----------
function piernas(P) {
  const g = new THREE.Group(), c = P.color, f = P.forma;
  if (f === 'patas') for (const s of [-1, 1]) { g.add(en(cil(.1, .1, .55, c, 10), s * .2, -.3, 0), en(caja(.22, .1, .34, '#5a5a62'), s * .2, -.6, .05)); }
  else if (f === 'ruedas') { const eje = cil(.05, .05, .7, '#5a5a62', 6, 0); eje.rotation.z = Math.PI / 2; eje.position.y = -.42; g.add(eje); for (const s of [-1, 1]) { const r = cil(.24, .24, .14, c, 18); r.rotation.z = Math.PI / 2; r.position.set(s * .36, -.42, 0); g.add(r); (g.userData.ruedas ||= []).push(r); } g.add(en(cil(.08, .08, .3, '#6a6a72', 8), 0, -.18, 0)); }
  else if (f === 'orugas') for (const s of [-1, 1]) { g.add(en(caja(.22, .3, .8, c), s * .26, -.48, 0)); for (const z of [-.3, 0, .3]) { const r = cil(.1, .1, .24, '#2a2a2a', 10, 0); r.rotation.z = Math.PI / 2; r.position.set(s * .26, -.48, z); g.add(r); } }
  else if (f === 'arana') for (let i = 0; i < 4; i++) { const s = i < 2 ? -1 : 1, z = i % 2 ? .2 : -.2, a = cil(.04, .05, .5, c, 6); a.position.set(s * .32, -.32, z); a.rotation.z = s * .7; const b = cil(.03, .04, .4, c, 6); b.position.set(s * .5, -.58, z); g.add(a, b); }
  else if (f === 'alas') { g.add(en(cil(.08, .08, .4, '#6a6a72', 8), 0, -.25, 0), en(cil(.18, .2, .08, '#5a5a62', 12), 0, -.5, 0)); for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.CircleGeometry(.4, 12), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .55, side: THREE.DoubleSide })); a.scale.set(1, .5, 1); a.position.set(s * .45, .35, -.3); a.rotation.set(0, s * .5, s * .3); g.add(a); (g.userData.alas ||= []).push(a); } g.userData.muelle = true; }
  else if (f === 'muelle') { for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.16, .035, 6, 16), toon(c)); t.rotation.x = Math.PI / 2; t.position.y = -.12 - i * .1; g.add(t); } g.add(en(cil(.24, .26, .08, '#5a5a62', 16), 0, -.64, 0)); g.userData.muelle = true; }
  // las de los modelos salvajes
  else if (f === 'ventosas') for (let i = 0; i < 6; i++) {   // pulpo: seis patitas con ventosas
    const a = i / 6 * Math.PI * 2, p = cil(.06, .09, .5, c, 8); p.position.set(Math.cos(a) * .22, -.32, Math.sin(a) * .22); p.rotation.set(Math.sin(a) * .5, 0, -Math.cos(a) * .5); g.add(p); g.add(en(cil(.07, .07, .03, claro(c, .5), 10, 0), Math.cos(a) * .34, -.58, Math.sin(a) * .34));
  }
  else if (f === 'columnas') for (const s of [-1, 1]) { g.add(en(cil(.17, .2, .55, c, 10), s * .22, -.32, 0)); for (let k = -1; k <= 1; k++) g.add(en(bola(.05, '#e8e0c8', 0), s * .22 + k * .08, -.6, .17)); }   // rino: patas como columnas, con uñas
  else if (f === 'bola') { const b = bola(.34, c); b.position.y = -.38; g.add(b); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const p = cono(.04, .14, oscuro(c, .4), 5, 0); p.position.set(Math.cos(a) * .36, -.38, Math.sin(a) * .36); p.rotation.z = -Math.PI / 2; p.rotation.y = -a; g.add(p); } (g.userData.ruedas ||= []).push(b); }   // erizo: rueda hecho una bola
  else if (f === 'babosa') { const b = bola(.36, c); b.scale.set(1, .45, 1.6); b.position.set(0, -.5, 0); g.add(b); const brillo = new THREE.Mesh(new THREE.CircleGeometry(.5, 18), new THREE.MeshBasicMaterial({ color: '#c8f0a8', transparent: true, opacity: .35 })); brillo.rotation.x = -Math.PI / 2; brillo.position.set(0, -.68, -.4); brillo.scale.set(1, 1.6, 1); g.add(brillo); }   // caracol: pie de babosa con rastro
  else if (f === 'rueda') { const r = new THREE.Mesh(new THREE.TorusGeometry(.34, .05, 8, 24), toon(c)); contorno(r, .02); r.position.y = -.38; g.add(r); for (let i = 0; i < 6; i++) { const ra = cil(.015, .015, .66, '#8a8a92', 4, 0); ra.rotation.x = i / 6 * Math.PI; ra.position.y = -.38; g.add(ra); } (g.userData.ruedas ||= []).push(r); r.rotation.y = Math.PI / 2; }   // hámster: dentro de su rueda
  return g;
}

// ---------- el cuerpo, según el alma ----------
function torso(nucleo, color) {
  const g = new THREE.Group(); let frente = .305;
  if (nucleo === 'escarabajo') {   // caparazón redondo con la raya de los élitros
    const t = bola(.48, color, .04); t.scale.set(.95, .85, .7); g.add(t); g.add(en(caja(.03, .7, .02, oscuro(color, .4), 0), 0, 0, .34)); frente = .345;
    for (const s of [-1, 1]) { const c = cono(.04, .2, oscuro(color, .4), 6, 0); c.rotation.z = s * .4; g.add(en(c, s * .12, .44, .1)); }
  } else if (nucleo === 'mantis') {   // estirada, con cintura
    g.add(en(caja(.62, .5, .44, color, .04), 0, .14, 0), en(caja(.42, .3, .36, oscuro(color, .15), .04), 0, -.26, 0)); frente = .23;
  } else if (nucleo === 'tortuga') {   // ancha, con su concha detrás
    g.add(caja(.9, .66, .56, color, .04)); const concha = new THREE.Mesh(new THREE.SphereGeometry(.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(oscuro(color, .2))); contorno(concha, .03); concha.rotation.x = -Math.PI / 2; concha.position.z = -.26; concha.scale.set(1, .5, 1); g.add(concha); frente = .285;
  } else {   // búho: un huevo con alitas y plumas en el pecho
    const t = bola(.46, color, .04); t.scale.set(.95, 1.05, .78); g.add(t); frente = .36;
    for (const s of [-1, 1]) { const a = bola(.2, oscuro(color, .2), .02); a.scale.set(.4, 1, .8); g.add(en(a, s * .44, -.02, 0)); }
    g.add(en(new THREE.Mesh(new THREE.CircleGeometry(.24, 16), toon(claro(color, .45))), 0, -.12, frente - .01));
  }
  return { g, frente };
}

// Un robot completo. equipo: { cabeza, brazoI, brazoD, piernas } con ids de PIEZAS
export function crearRobot({ nucleo = 'escarabajo', equipo }) {
  const N = NUCLEOS[nucleo] || NUCLEOS.escarabajo, raiz = new THREE.Group(), cuerpo = new THREE.Group(); raiz.add(cuerpo);
  const juego = juegoDe(equipo), { g: tor, frente } = torso(nucleo, juego ? juego.color : N.color); tor.position.y = 1.05; cuerpo.add(tor);
  const medalla = new THREE.Mesh(new THREE.CircleGeometry(.2, 24), new THREE.MeshBasicMaterial({ map: lienzo(128, 128, (x, w) => { x.fillStyle = juego ? '#ffe6a8' : '#f4ecd8'; x.beginPath(); x.arc(w / 2, w / 2, w * .48, 0, 7); x.fill(); x.font = `${w * .62}px serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(N.e, w / 2, w * .54); }) }));
  medalla.position.set(0, 1.08, frente + .005); cuerpo.add(medalla);
  const partes = {};
  const poner = (hueco, obj, pos) => { obj.position.copy(pos); cuerpo.add(obj); partes[hueco] = obj; obj.userData.base = pos.clone(); };
  poner('piernas', piernas(PIEZAS[equipo.piernas]), new THREE.Vector3(0, .75, 0));
  poner('cabeza', cabeza(PIEZAS[equipo.cabeza]), new THREE.Vector3(0, 1.72, 0));
  poner('brazoI', brazo(PIEZAS[equipo.brazoI], -1), new THREE.Vector3(-.55, 1.3, 0));
  poner('brazoD', brazo(PIEZAS[equipo.brazoD], 1), new THREE.Vector3(.55, 1.3, 0));
  const R = { grupo: raiz, cuerpo, partes, rotas: new Set(), sueltas: [], golpeT: 0, golpeH: null, flash: 0 };
  // las piernas cortas (ruedas, orugas, babosa) bajan el cuerpo para que pise el suelo
  const alto = { ruedas: -.1, orugas: -.05, muelle: 0, arana: -.05, patas: 0, babosa: -.12, bola: -.04, rueda: -.03, ventosas: -.04 }[PIEZAS[equipo.piernas]?.forma] || 0; cuerpo.position.y = alto;
  R.animar = (dt, t) => {
    const salto = partes.piernas.userData.muelle && !R.rotas.has('piernas') ? Math.abs(Math.sin(t * 4)) * .06 : 0;
    cuerpo.position.y = (R.rotas.has('piernas') ? -.55 : alto) + Math.sin(t * 2.2) * .03 + salto;
    for (const r of partes.piernas.userData.ruedas || []) r.rotation.x += dt * 2;
    for (const [k, a] of (partes.piernas.userData.alas || []).entries()) a.rotation.y = (k ? -1 : 1) * (.5 + Math.sin(t * 40) * .4);   // las alas zumban
    for (const h of ['brazoI', 'brazoD']) {
      const tl = partes[h].userData.taladro; if (tl) tl.rotation.y += dt * (R.golpeH === h ? 30 : 3);
      const on = partes[h].userData.ondea; if (on) on.forEach((b, i) => { b.position.x = Math.sin(t * 3 + i * .7) * .05 * i; });   // tentáculos y ojos que se mecen
      const ch = partes[h].userData.chispa; if (ch) ch.scale.setScalar(1 + Math.sin(t * 9 + i0(h)) * .2);
    }
    if (partes.cabeza.userData.gira) partes.cabeza.userData.gira.rotation.z += dt * 1.5;
    if (partes.cabeza.userData.chispa) partes.cabeza.userData.chispa.scale.setScalar(1 + Math.sin(t * 9) * .15);
    // el brazo que golpea: se echa hacia delante y vuelve
    for (const h of ['brazoI', 'brazoD']) { const b = partes[h]; if (R.rotas.has(h)) continue; const k = R.golpeH === h ? Math.sin(Math.min(1, R.golpeT) * Math.PI) : 0; b.rotation.x = -k * 1.4 - Math.sin(t * 2.2 + (h === 'brazoI' ? 0 : 1)) * .06; }
    if (R.golpeT < 1) R.golpeT += dt * 2.5; else R.golpeH = null;
    if (R.flash > 0) { R.flash -= dt; cuerpo.position.x = Math.sin(t * 60) * R.flash * .1; } else cuerpo.position.x = 0;
    for (const s of R.sueltas) {   // las piezas rotas caen dando vueltas
      if (s.p.y <= .15) continue;
      s.v.y -= 9.8 * dt; s.p.addScaledVector(s.v, dt); s.o.position.copy(s.p); s.o.rotation.x += s.w.x * dt; s.o.rotation.z += s.w.z * dt;
      if (s.p.y <= .15) { s.p.y = .15; s.o.position.y = .15; }
    }
  };
  R.golpe = (hueco) => { R.golpeH = hueco; R.golpeT = 0; };
  R.herido = () => { R.flash = .35; };
  // una pieza rota sale volando y se queda en el suelo del ring
  R.romper = (hueco, escena) => {
    const o = partes[hueco]; if (!o || R.rotas.has(hueco)) return; R.rotas.add(hueco);
    const p = o.getWorldPosition(new THREE.Vector3()); escena.attach(o);
    const lado = hueco === 'brazoI' ? -1 : hueco === 'brazoD' ? 1 : (Math.random() - .5);
    R.sueltas.push({ o, p, v: new THREE.Vector3(lado * 2.2, 3.2, (Math.random() - .5) * 2), w: new THREE.Vector3(6 + Math.random() * 6, 0, 4) });
  };
  R.desechar = (escena) => { for (const s of R.sueltas) escena.remove(s.o); raiz.removeFromParent(); };
  return R;
}
const i0 = (h) => (h === 'brazoI' ? 0 : 1.7);
// Para el álbum o el taller: la pieza sola (sin robot)
export { cabeza as dibujoCabeza, brazo as dibujoBrazo, piernas as dibujoPiernas };
