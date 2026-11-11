// =============================================================
//  ROBOTS DE CHATARRA (el ring del pueblo): núcleos, piezas y su dibujo
//  Cada robot tiene un núcleo (su alma, con forma de bicho) que sube de nivel,
//  y cuatro piezas: cabeza, brazo izquierdo, brazo derecho y piernas.
//  Cada pieza tiene su vida y, muchas, su acción. Si te rompen la cabeza, pierdes.
//  Al ganar a un rival te llevas una de sus piezas. Todo hecho en código, a nuestra manera.
// =============================================================
import * as THREE from 'three';
import { toon, contorno, lienzo } from './claro-estilo.js';

export const NUCLEOS = {
  escarabajo: { n: 'Escarabajo', e: '🪲', color: '#e0a020', t: 'Pura pólvora: sus disparos tiran 1 dado más.' },
  mantis: { n: 'Mantis', e: '🦗', color: '#4fae5a', t: 'Cuerpo a cuerpo: sus golpes tiran 1 dado más.' },
  tortuga: { n: 'Tortuga', e: '🐢', color: '#3a8a8a', t: 'Lenta pero dura: cada pieza aguanta 1 más.' },
  buho: { n: 'Búho', e: '🦉', color: '#8a6ac8', t: 'Ojo fino: apunta a la cabeza sin perder dados, y sus curas curan 1 más.' }
};
// Experiencia del núcleo: en el 4 y en el 8, un dado más en todo
export const NIVELES_NUCLEO = [0, 40, 100, 180, 280, 400, 550, 720, 920, 1150];
export const nivelNucleo = (xp) => { let n = 1; for (let i = 1; i < NIVELES_NUCLEO.length; i++) if (xp >= NIVELES_NUCLEO[i]) n = i + 1; return n; };
export const extraNivel = (n) => (n >= 8 ? 2 : n >= 4 ? 1 : 0);

export const HUECOS_ROBOT = {
  cabeza: { n: 'Cabeza', e: '🗿', tipo: 'cabeza' }, brazoI: { n: 'Brazo izq.', e: '🦾', tipo: 'brazo' },
  brazoD: { n: 'Brazo der.', e: '🦾', tipo: 'brazo' }, piernas: { n: 'Piernas', e: '🦿', tipo: 'piernas' }
};

// acc: lo que se puede hacer con la pieza. golpe/disparo: dados de ataque; cura: cuánto cura; escudo: cuánto para; apuntar: dados extra al siguiente
// piernas: def (dados para esquivar) y vel (quién va antes)
export const PIEZAS = {
  cab_lata: { hueco: 'cabeza', n: 'Cabeza de lata', vida: 4, forma: 'lata', color: '#9aa4ae' },
  cab_casco: { hueco: 'cabeza', n: 'Casco de buzo', vida: 6, forma: 'casco', color: '#c8903a' },
  cab_radar: { hueco: 'cabeza', n: 'Radar', vida: 3, forma: 'radar', color: '#5a7ab0', acc: { tipo: 'apuntar', n: 'Apuntar', e: '🎯', v: 2 } },
  cab_cruz: { hueco: 'cabeza', n: 'Botiquín', vida: 3, forma: 'cruz', color: '#e8e2d6', acc: { tipo: 'cura', n: 'Reparar', e: '🔧', v: 3, usos: 2 } },
  cab_antena: { hueco: 'cabeza', n: 'Antena chispa', vida: 3, forma: 'antena', color: '#6a5a9a', acc: { tipo: 'disparo', n: 'Chispazo', e: '⚡', v: 2, certero: true } },
  br_puno: { hueco: 'brazo', n: 'Puño de muelle', vida: 4, forma: 'puno', color: '#c85a3a', acc: { tipo: 'golpe', n: 'Puñetazo', e: '👊', v: 2 } },
  br_canon: { hueco: 'brazo', n: 'Cañoncito', vida: 3, forma: 'canon', color: '#5a6a5a', acc: { tipo: 'disparo', n: 'Cañonazo', e: '💥', v: 2 } },
  br_martillo: { hueco: 'brazo', n: 'Martillo', vida: 4, forma: 'martillo', color: '#7a6a5a', acc: { tipo: 'golpe', n: 'Martillazo', e: '🔨', v: 3 } },
  br_pinza: { hueco: 'brazo', n: 'Pinza', vida: 4, forma: 'pinza', color: '#c8a03a', acc: { tipo: 'golpe', n: 'Pellizco', e: '🦀', v: 2, piernas: true } },
  br_escudo: { hueco: 'brazo', n: 'Tapa de olla', vida: 6, forma: 'escudo', color: '#a8b0b8', acc: { tipo: 'escudo', n: 'Cubrirse', e: '🛡️', v: 2 } },
  br_soplete: { hueco: 'brazo', n: 'Soplete', vida: 3, forma: 'soplete', color: '#d8703a', acc: { tipo: 'disparo', n: 'Llamarada', e: '🔥', v: 3 } },
  br_remache: { hueco: 'brazo', n: 'Remachadora', vida: 3, forma: 'remache', color: '#4a4a5a', acc: { tipo: 'disparo', n: 'Ráfaga', e: '🔩', v: 4, usos: 2 } },
  pi_patas: { hueco: 'piernas', n: 'Patas de lata', vida: 4, forma: 'patas', color: '#8a94a0', def: 2, vel: 2 },
  pi_ruedas: { hueco: 'piernas', n: 'Ruedas de carrito', vida: 3, forma: 'ruedas', color: '#3a3a42', def: 1, vel: 4 },
  pi_orugas: { hueco: 'piernas', n: 'Orugas', vida: 6, forma: 'orugas', color: '#4a5a3a', def: 2, vel: 1 },
  pi_arana: { hueco: 'piernas', n: 'Patas de araña', vida: 4, forma: 'arana', color: '#5a3a5a', def: 3, vel: 3 },
  pi_muelle: { hueco: 'piernas', n: 'Muelle saltarín', vida: 3, forma: 'muelle', color: '#c8c03a', def: 4, vel: 3 },
  // Las de Rufo: no las lleva nadie de la liga; se hacen con chatarra de las criptas (RUFO_HACE)
  cab_olla: { hueco: 'cabeza', n: 'Olla exprés', vida: 7, forma: 'casco', color: '#b84a3a' },
  cab_faro: { hueco: 'cabeza', n: 'Faro del puerto', vida: 4, forma: 'radar', color: '#e8d24a', acc: { tipo: 'apuntar', n: 'Fogonazo', e: '🔦', v: 3 } },
  br_taladro: { hueco: 'brazo', n: 'Taladro', vida: 4, forma: 'taladro', color: '#c8c8d0', acc: { tipo: 'golpe', n: 'Taladrazo', e: '🌀', v: 3, certero: true } },
  br_iman: { hueco: 'brazo', n: 'Imán gordo', vida: 5, forma: 'iman', color: '#d83a3a', acc: { tipo: 'escudo', n: 'Imantar', e: '🧲', v: 3 } },
  pi_patin: { hueco: 'piernas', n: 'Patines de hielo', vida: 3, forma: 'ruedas', color: '#8ad0ff', def: 3, vel: 5 }
};
// El banco de Rufo (en el taller del ring): lo que cuesta cada pieza suya, en chatarra (⚙️, cae en las criptas) y monedas
export const RUFO_HACE = { cab_olla: { chatarra: 6, oro: 50 }, pi_patin: { chatarra: 7, oro: 60 }, br_iman: { chatarra: 8, oro: 70 }, cab_faro: { chatarra: 9, oro: 80 }, br_taladro: { chatarra: 12, oro: 100 } };
export const KIT_INICIAL = ['cab_lata', 'br_puno', 'br_canon', 'pi_patas'];

// La liga del ring: vecinos del pueblo con sus cacharros. Ganar a uno abre el siguiente.
export const RIVALES = [
  { quien: 'Pip', robot: 'La Tostadora', nucleo: 'escarabajo', nivel: 1, equipo: { cabeza: 'cab_lata', brazoI: 'br_puno', brazoD: 'br_puno', piernas: 'pi_ruedas' }, frase: '¡Mi tostadora pega más fuerte de lo que tuesta!' },
  { quien: 'Mordo', robot: 'El Yunquecillo', nucleo: 'mantis', nivel: 2, equipo: { cabeza: 'cab_casco', brazoI: 'br_martillo', brazoD: 'br_puno', piernas: 'pi_orugas' }, frase: 'Clonk. Clonk. Eso es todo lo que vas a oír.' },
  { quien: 'Doña Escarcha', robot: 'Calderito', nucleo: 'buho', nivel: 3, equipo: { cabeza: 'cab_cruz', brazoI: 'br_soplete', brazoD: 'br_escudo', piernas: 'pi_patas' }, frase: 'Calderito hierve por dentro. Literalmente.' },
  { quien: 'El Viejo Anzuelo', robot: 'Pescabot', nucleo: 'escarabajo', nivel: 4, equipo: { cabeza: 'cab_radar', brazoI: 'br_canon', brazoD: 'br_pinza', piernas: 'pi_muelle' }, frase: 'Lo pesqué en el río. Venía con instrucciones en otro idioma.' },
  { quien: 'Rufo', robot: 'El Capitán Tornillo', nucleo: 'mantis', nivel: 6, equipo: { cabeza: 'cab_antena', brazoI: 'br_remache', brazoD: 'br_martillo', piernas: 'pi_arana' }, frase: '¡Ningún robot de tierra firme ha vencido al Capitán Tornillo! … Bueno, uno. Pero llovía.' }
];

// ---------- el dibujo ----------
const caja = (w, h, d, c, b = .03) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(c)); m.castShadow = true; if (b) contorno(m, b); return m; };
const cil = (rt, rb, h, c, s = 14, b = .03) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), toon(c)); m.castShadow = true; if (b) contorno(m, b); return m; };
const bola = (r, c, b = .03) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), toon(c)); m.castShadow = true; if (b) contorno(m, b); return m; };
const brilla = (r, c) => new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: c }));

function cabeza(P) {
  const g = new THREE.Group(), c = P.color;
  if (P.forma === 'lata') { g.add(cil(.32, .32, .5, c)); const o = brilla(.07, '#7ff0ff'); o.position.set(-.12, .05, .3); const o2 = o.clone(); o2.position.x = .12; g.add(o, o2); }
  else if (P.forma === 'casco') { g.add(bola(.38, c)); const v = cil(.2, .2, .08, '#1a2a3a', 16, .02); v.rotation.x = Math.PI / 2; v.position.z = .34; g.add(v); for (let i = 0; i < 6; i++) { const r = bola(.035, '#6a4a2a', 0); const a = i / 6 * Math.PI * 2; r.position.set(Math.cos(a) * .22, Math.sin(a) * .22, .33); g.add(r); } }
  else if (P.forma === 'radar') { g.add(caja(.5, .36, .44, c)); const d = new THREE.Mesh(new THREE.SphereGeometry(.28, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), toon('#d8dde2', { side: THREE.DoubleSide })); d.position.y = .32; d.rotation.x = .5; g.add(d); g.userData.gira = d; const o = brilla(.06, '#ff5a4a'); o.position.set(0, 0, .23); g.add(o); }
  else if (P.forma === 'cruz') { g.add(caja(.5, .44, .44, c)); const tx = lienzo(64, 64, (x, w) => { x.fillStyle = '#d83a3a'; x.fillRect(w * .4, w * .15, w * .2, w * .7); x.fillRect(w * .15, w * .4, w * .7, w * .2); }); const cr = new THREE.Mesh(new THREE.PlaneGeometry(.34, .34), new THREE.MeshBasicMaterial({ map: tx, transparent: true })); cr.position.z = .225; g.add(cr); }
  else if (P.forma === 'antena') { g.add(caja(.46, .38, .4, c)); const a = cil(.02, .02, .5, '#2a2a2a', 6, 0); a.position.y = .42; g.add(a); const p = brilla(.08, '#ffe04a'); p.position.y = .7; g.add(p); g.userData.chispa = p; const o = brilla(.06, '#7ff0ff'); o.position.set(0, 0, .21); g.add(o); }
  return g;
}
function brazo(P, lado) {
  const g = new THREE.Group(), c = P.color, hombro = bola(.15, '#5a5a62'); g.add(hombro);
  const palo = cil(.08, .08, .5, '#6a6a72', 8); palo.position.y = -.3; g.add(palo);
  const fin = new THREE.Group(); fin.position.y = -.6; g.add(fin);
  if (P.forma === 'puno') { const m = cil(.04, .04, .2, '#c8c8c8', 6, 0); m.position.y = .05; fin.add(m, bola(.17, c)); }
  else if (P.forma === 'canon') { const t = cil(.1, .12, .5, c); t.rotation.x = Math.PI / 2; t.position.z = .2; fin.add(t); }
  else if (P.forma === 'martillo') { const t = caja(.36, .22, .22, c); t.position.y = -.08; fin.add(t); }
  else if (P.forma === 'pinza') { for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.ConeGeometry(.08, .32, 6), toon(c)); contorno(p, .02); p.position.set(s * .08, -.12, 0); p.rotation.z = s * .35 + Math.PI; fin.add(p); } }
  else if (P.forma === 'escudo') { const e = cil(.34, .34, .06, c, 20); e.rotation.z = Math.PI / 2; e.position.x = lado * .1; fin.add(e); const a = bola(.05, '#5a5a62', 0); a.position.x = lado * .14; fin.add(a); }
  else if (P.forma === 'soplete') { const t = cil(.1, .1, .3, c); t.rotation.x = Math.PI / 2; t.position.z = .1; const b = new THREE.Mesh(new THREE.ConeGeometry(.09, .2, 10), toon('#3a3a3a')); b.rotation.x = Math.PI / 2; b.position.z = .32; fin.add(t, b); }
  else if (P.forma === 'taladro') { const t = new THREE.Mesh(new THREE.ConeGeometry(.13, .45, 12), toon(c)); contorno(t, .02); t.rotation.x = -Math.PI / 2; t.position.z = .25; fin.add(cil(.12, .12, .16, '#5a5a62'), t); g.userData.taladro = t; }
  else if (P.forma === 'iman') { const u = new THREE.Mesh(new THREE.TorusGeometry(.16, .07, 8, 16, Math.PI), toon(c)); contorno(u, .02); u.rotation.z = Math.PI; u.position.y = -.06; fin.add(u); for (const sx of [-1, 1]) { const pu = cil(.07, .07, .1, '#d8d8e0', 8, 0); pu.position.set(sx * .16, -.08, 0); fin.add(pu); } }
  else if (P.forma === 'remache') { fin.add(caja(.24, .24, .24, c)); for (let i = 0; i < 3; i++) { const t = cil(.035, .035, .35, '#2a2a2a', 6, 0); t.rotation.x = Math.PI / 2; t.position.set((i - 1) * .07, 0, .25); fin.add(t); } }
  g.userData.fin = fin;
  return g;
}
function piernas(P) {
  const g = new THREE.Group(), c = P.color;
  if (P.forma === 'patas') for (const s of [-1, 1]) { const p = cil(.1, .1, .55, c, 10); p.position.set(s * .2, -.3, 0); const pie = caja(.22, .1, .34, '#5a5a62'); pie.position.set(s * .2, -.6, .05); g.add(p, pie); }
  else if (P.forma === 'ruedas') { const eje = cil(.05, .05, .7, '#5a5a62', 6, 0); eje.rotation.z = Math.PI / 2; eje.position.y = -.42; g.add(eje); for (const s of [-1, 1]) { const r = cil(.24, .24, .14, c, 18); r.rotation.z = Math.PI / 2; r.position.set(s * .36, -.42, 0); g.add(r); g.userData.ruedas = (g.userData.ruedas || []).concat(r); } const p = cil(.08, .08, .3, '#6a6a72', 8); p.position.y = -.18; g.add(p); }
  else if (P.forma === 'orugas') for (const s of [-1, 1]) { const o = caja(.22, .3, .8, c); o.position.set(s * .26, -.48, 0); g.add(o); for (const z of [-.3, 0, .3]) { const r = cil(.1, .1, .24, '#2a2a2a', 10, 0); r.rotation.z = Math.PI / 2; r.position.set(s * .26, -.48, z); g.add(r); } }
  else if (P.forma === 'arana') for (let i = 0; i < 4; i++) { const s = i < 2 ? -1 : 1, z = i % 2 ? .2 : -.2, a = cil(.04, .05, .5, c, 6); a.position.set(s * .32, -.32, z); a.rotation.z = s * .7; const b = cil(.03, .04, .4, c, 6); b.position.set(s * .5, -.58, z); g.add(a, b); }
  else if (P.forma === 'muelle') { for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.16, .035, 6, 16), toon(c)); t.rotation.x = Math.PI / 2; t.position.y = -.12 - i * .1; g.add(t); } const pie = cil(.24, .26, .08, '#5a5a62', 16); pie.position.y = -.64; g.add(pie); g.userData.muelle = true; }
  return g;
}
// Un robot completo. equipo: { cabeza, brazoI, brazoD, piernas } con ids de PIEZAS
export function crearRobot({ nucleo = 'escarabajo', equipo }) {
  const N = NUCLEOS[nucleo] || NUCLEOS.escarabajo, raiz = new THREE.Group(), cuerpo = new THREE.Group(); raiz.add(cuerpo);
  const torso = caja(.8, .78, .6, N.color, .04); torso.position.y = 1.05; cuerpo.add(torso);
  const medalla = new THREE.Mesh(new THREE.CircleGeometry(.2, 24), new THREE.MeshBasicMaterial({ map: lienzo(128, 128, (x, w) => { x.fillStyle = '#f4ecd8'; x.beginPath(); x.arc(w / 2, w / 2, w * .48, 0, 7); x.fill(); x.font = `${w * .62}px serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(N.e, w / 2, w * .54); }) }));
  medalla.position.set(0, 1.08, .305); cuerpo.add(medalla);
  const partes = {};
  const poner = (hueco, obj, pos) => { obj.position.copy(pos); cuerpo.add(obj); partes[hueco] = obj; obj.userData.base = pos.clone(); };
  poner('piernas', piernas(PIEZAS[equipo.piernas]), new THREE.Vector3(0, .75, 0));
  poner('cabeza', cabeza(PIEZAS[equipo.cabeza]), new THREE.Vector3(0, 1.72, 0));
  poner('brazoI', brazo(PIEZAS[equipo.brazoI], -1), new THREE.Vector3(-.55, 1.3, 0));
  poner('brazoD', brazo(PIEZAS[equipo.brazoD], 1), new THREE.Vector3(.55, 1.3, 0));
  const R = { grupo: raiz, cuerpo, partes, rotas: new Set(), sueltas: [], golpeT: 0, golpeH: null, flash: 0 };
  // las piernas cortas (ruedas, orugas) bajan el cuerpo para que pise el suelo
  const alto = { ruedas: -.1, orugas: -.05, muelle: 0, arana: -.05, patas: 0 }[PIEZAS[equipo.piernas]?.forma] || 0; cuerpo.position.y = alto;
  R.animar = (dt, t) => {
    const salto = partes.piernas.userData.muelle && !R.rotas.has('piernas') ? Math.abs(Math.sin(t * 4)) * .06 : 0;
    cuerpo.position.y = (R.rotas.has('piernas') ? -.55 : alto) + Math.sin(t * 2.2) * .03 + salto;
    for (const r of partes.piernas.userData.ruedas || []) r.rotation.x += dt * 2;
    for (const h of ['brazoI', 'brazoD']) { const tl = partes[h].userData.taladro; if (tl) tl.rotation.y += dt * (R.golpeH === h ? 30 : 3); }
    if (partes.cabeza.userData.gira) partes.cabeza.userData.gira.rotation.z += dt * 1.5;
    if (partes.cabeza.userData.chispa) partes.cabeza.userData.chispa.scale.setScalar(1 + Math.sin(t * 9) * .25);
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
  R.desechar = (escena) => { for (const s of R.sueltas) escena.remove(s.o); escena.remove(raiz); };
  return R;
}
