// =============================================================
//  EL VERTEDERO (dentro del ring: ring.js lo monta al viajar con Rufo)
//  Un descampado de chatarra por el que paseas con tu robot. Entre los montones
//  rondan robots salvajes (los MODELOS de robots.js): si te acercas, pelea.
//  Cuanto más al fondo, más duros. El camión de Rufo, a la entrada, repara gratis.
//  Está lejos del ring (en x = CENTRO.x), en la misma escena.
// =============================================================
import * as THREE from 'three';
import { toon, contorno, lienzo } from './claro-estilo.js';
import { MODELOS, salvaje, crearRobot } from './robots.js';

export const CENTRO = new THREE.Vector3(400, 0, 0);
const MEDIO = 30;          // medio lado del vertedero
const ENTRADA = 26;        // z (local) del camión de Rufo
const POR_ZONA = [['pinzon', 'cavador', 'babosin', 'dinamo'], ['tintero', 'pinchos', 'zumbona', 'pinzon'], ['embestidor', 'farolera', 'salamandra', 'zumbona']];
const azar = (l) => l[Math.floor(Math.random() * l.length)];
// El nivel según lo lejos que estés de la entrada: 1 junto al camión, 9 al fondo
export const nivelEn = (zLocal) => Math.max(1, Math.min(9, 1 + Math.floor((ENTRADA - zLocal) / (ENTRADA + MEDIO) * 9)));

export function crearVertedero({ escena, camara, lienzoDom, ui, alEncontrar, alCamion }) {
  const G = new THREE.Group(); G.position.copy(CENTRO); G.visible = false; escena.add(G);
  const luz = new THREE.DirectionalLight('#ffe0b0', 1.6); luz.position.set(-10, 20, 8); G.add(luz, luz.target);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(MEDIO * 2 + 20, MEDIO * 2 + 20), toon('#7a6a52')); suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; G.add(suelo);
  // charcos de aceite y manchas
  for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(.8 + Math.random() * 2, 16), toon(Math.random() < .3 ? '#2a2a32' : '#6a5a42')); m.rotation.x = -Math.PI / 2; m.position.set((Math.random() - .5) * MEDIO * 2, .01 + i * .0005, (Math.random() - .5) * MEDIO * 2); G.add(m); }
  // la valla
  for (let k = -MEDIO; k <= MEDIO; k += 3) for (const [x, z, r] of [[k, -MEDIO - 1, 0], [k, MEDIO + 3, 0], [-MEDIO - 1, k, Math.PI / 2], [MEDIO + 1, k, Math.PI / 2]]) {
    if (z === MEDIO + 3 && Math.abs(x) < 5) continue;   // la puerta, junto al camión
    const p = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, .08), toon('#8a8a90', { transparent: true, opacity: .55 })); p.position.set(x, .8, z); p.rotation.y = r; G.add(p);
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.8, 6), toon('#5a5a62')); poste.position.set(x + (r ? 0 : 1.5), .9, z + (r ? 1.5 : 0)); G.add(poste);
  }
  // los montones de chatarra (con su círculo de choque)
  const choques = [];
  const colores = ['#9a8a7a', '#6a7a8a', '#a86a4a', '#8a9a6a', '#d8d0c0', '#5a5a62', '#b8a060'];
  for (let i = 0; i < 34; i++) {
    let x, z; do { x = (Math.random() - .5) * (MEDIO * 2 - 6); z = (Math.random() - .5) * (MEDIO * 2 - 6); } while (Math.abs(x) < 11 && z > ENTRADA - 8);
    const r = 1.4 + Math.random() * 2.2, g = new THREE.Group(); g.position.set(x, 0, z); G.add(g); choques.push({ x, z, r: r + .5 });
    const base = new THREE.Mesh(new THREE.ConeGeometry(r * 1.1, r * 1.1, 7), toon('#6a5a4a')); base.position.y = r * .5; base.rotation.y = Math.random() * 3; g.add(base);
    for (let k = 0; k < 6; k++) {   // cacharros encima: neveras, ruedas, bidones
      const t = Math.random(), c = azar(colores); let o;
      if (t < .3) o = new THREE.Mesh(new THREE.BoxGeometry(.6 + Math.random() * .6, .5 + Math.random(), .5 + Math.random() * .4), toon(c));
      else if (t < .6) { o = new THREE.Mesh(new THREE.TorusGeometry(.4, .16, 8, 14), toon('#2a2a2a')); o.rotation.set(Math.random() * 3, Math.random() * 3, 0); }
      else o = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .8, 10), toon(c));
      contorno(o, .03); const a = Math.random() * Math.PI * 2, d = Math.random() * r * .7;
      o.position.set(Math.cos(a) * d, r * (1 - d / r) * .9 + .2, Math.sin(a) * d); o.rotation.y = Math.random() * 3; g.add(o);
    }
  }
  // el camión de Rufo, a la entrada (y su cartel)
  const camion = new THREE.Group(); camion.position.set(-7, 0, ENTRADA + .5); G.add(camion);   // a un lado: que no tape la vista al llegar
  { const caja = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 3.4), toon('#c84a3a')); caja.position.set(0, 1.25, -.4); contorno(caja, .04);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 1.3), toon('#e8d8b0')); cab.position.set(0, 1.05, 1.9); contorno(cab, .04);
    const cristal = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .55), toon('#7ab0d0')); cristal.position.set(0, 1.35, 2.56);
    camion.add(caja, cab, cristal);
    for (const [x, z] of [[-1.1, -1.4], [1.1, -1.4], [-1.1, 1.6], [1.1, 1.6]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .3, 14), toon('#2a2a2a')); r.rotation.z = Math.PI / 2; r.position.set(x, .42, z); camion.add(r); }
    const tx = lienzo(512, 160, (x, w, h) => { x.fillStyle = '#fff2c8'; x.fillRect(0, 0, w, h); x.fillStyle = '#8a1c1c'; x.font = 'bold 54px Georgia, serif'; x.textAlign = 'center'; x.fillText('RUFO · CHATARRAS', w / 2, 70); x.font = 'bold 34px Georgia, serif'; x.fillStyle = '#3a2a20'; x.fillText('Aquí te reparo gratis', w / 2, 128); });
    const cartel = new THREE.Mesh(new THREE.PlaneGeometry(2.3, .72), new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide })); cartel.position.set(0, 2.5, -2.15); camion.add(cartel);
    const corro = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.9, 32), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: .6 })); corro.rotation.x = -Math.PI / 2; corro.position.set(0, .02, -3.5); camion.add(corro);
  }
  const SITIO_REPARAR = new THREE.Vector3(-7, 0, ENTRADA - 3);

  // ---------- tú (tu robot) ----------
  let yo = null; const destino = new THREE.Vector3(); let hayDestino = false; const teclas = {};
  const pos = () => yo.grupo.position;
  function ponerme(spec) {
    if (yo) yo.desechar(G);
    yo = crearRobot(spec); yo.grupo.scale.setScalar(.8); G.add(yo.grupo); yo.grupo.position.set(0, 0, ENTRADA - 3); yo.grupo.rotation.y = Math.PI; hayDestino = false;
  }
  addEventListener('keydown', (e) => { teclas[e.key.toLowerCase()] = true; });
  addEventListener('keyup', (e) => { teclas[e.key.toLowerCase()] = false; });
  const ray = new THREE.Raycaster(), plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), v2 = new THREE.Vector2();
  lienzoDom.addEventListener('pointerdown', (e) => {
    if (!V.activo || V.pausa || !yo) return;
    v2.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(v2, camara);
    const p = new THREE.Vector3(); if (ray.ray.intersectPlane(plano, p)) { destino.copy(p).sub(CENTRO); hayDestino = true; }
  });

  // ---------- los salvajes ----------
  const salvajes = [];
  function soltar() {
    let x, z, ok = false;
    for (let k = 0; k < 30 && !ok; k++) {
      x = (Math.random() - .5) * (MEDIO * 2 - 4); z = (Math.random() - .5) * (MEDIO * 2 - 4) - 4;
      ok = choques.every((c) => Math.hypot(c.x - x, c.z - z) > c.r + .5) && (!yo || Math.hypot(pos().x - x, pos().z - z) > 9) && z < ENTRADA - 8;
    }
    if (!ok) return;
    const nivel = nivelEn(z), zona = nivel <= 3 ? 0 : nivel <= 6 ? 1 : 2, modelo = azar(POR_ZONA[zona]), M = MODELOS[modelo];
    const spec = salvaje(modelo, nivel), r = crearRobot(spec);
    r.grupo.scale.setScalar(.8); r.grupo.position.set(x, 0, z); G.add(r.grupo);
    const s = { modelo, nivel, spec, r, meta: new THREE.Vector3(x, 0, z), espera: Math.random() * 3 };
    s.rot = ui.rotulo(r.grupo, `${M.e} ${M.n}`, { altura: 2.1, sub: `nivel ${nivel}`, tipo: 'enemigo' });
    salvajes.push(s);
  }
  function quitarSalvaje(s) { const i = salvajes.indexOf(s); if (i >= 0) salvajes.splice(i, 1); ui.quitar(s.rot); s.r.desechar(G); }
  // empujar fuera de los montones y de la valla
  function chocar(p, rr = .6) {
    for (const c of choques) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz); if (d < c.r + rr && d > 0) { p.x = c.x + dx / d * (c.r + rr); p.z = c.z + dz / d * (c.r + rr); } }
    p.x = Math.max(-MEDIO, Math.min(MEDIO, p.x)); p.z = Math.max(-MEDIO, Math.min(ENTRADA + 1, p.z));
  }

  const V = {
    grupo: G, activo: false, pausa: false, salvajes, quitarSalvaje,
    get yo() { return yo; },
    // Dónde estás, en el mundo (para la cámara)
    dondeEstoy: () => (yo ? yo.grupo.getWorldPosition(new THREE.Vector3()) : CENTRO.clone()),
    entrar(spec) { V.activo = true; G.visible = true; ponerme(spec); while (salvajes.length < 9) soltar(); },
    salir() { V.activo = false; G.visible = false; },
    // Vuelves al camión (después de perder, por ejemplo)
    alCamion() { if (yo) { yo.grupo.position.set(0, 0, ENTRADA - 3); hayDestino = false; } },
    ocultarPelea(s, si) { if (yo) yo.grupo.visible = !si; if (s) s.r.grupo.visible = !si; for (const x of salvajes) if (x.rot) x.rot.visible = !si; },
    actualizar(dt, t) {
      if (!V.activo || !yo) return;
      for (const s of salvajes) s.r.animar(dt, t);
      yo.animar(dt, t);
      if (V.pausa) return;
      // moverte: con el dedo (a donde toques) o con WASD / flechas
      const p = pos(), dir = new THREE.Vector3((teclas.d || teclas.arrowright ? 1 : 0) - (teclas.a || teclas.arrowleft ? 1 : 0), 0, (teclas.s || teclas.arrowdown ? 1 : 0) - (teclas.w || teclas.arrowup ? 1 : 0));
      if (dir.lengthSq()) hayDestino = false; else if (hayDestino) { dir.set(destino.x - p.x, 0, destino.z - p.z); if (dir.length() < .2) { hayDestino = false; dir.set(0, 0, 0); } }
      if (dir.lengthSq()) { dir.normalize(); p.addScaledVector(dir, dt * 4.2); yo.grupo.rotation.y = Math.atan2(dir.x, dir.z); p.y = Math.abs(Math.sin(t * 12)) * .06; } else p.y = 0;
      chocar(p);
      // el camión de Rufo: te repara
      if (p.distanceTo(SITIO_REPARAR) < 2.8) alCamion?.();
      // los salvajes deambulan; si te ven cerca, van a por ti
      for (const s of [...salvajes]) {
        const q = s.r.grupo.position, d = Math.hypot(p.x - q.x, p.z - q.z);
        const calma = (s.calma || 0) > 0; if (calma) s.calma -= dt;   // recién escapado de ti: te deja en paz un rato
        if (!calma && d < 2.2 && p.z < ENTRADA - 5) { alEncontrar?.(s); return; }
        if (!calma && d < 6 && p.z < ENTRADA - 5) s.meta.set(p.x, 0, p.z);
        else if ((s.espera -= dt) < 0) { s.espera = 2 + Math.random() * 4; s.meta.set(q.x + (Math.random() - .5) * 10, 0, q.z + (Math.random() - .5) * 10); }
        const dx = s.meta.x - q.x, dz = s.meta.z - q.z, dd = Math.hypot(dx, dz);
        if (dd > .3) { const v = Math.min(dd, dt * (d < 6 ? 2.6 : 1.3)); q.x += dx / dd * v; q.z += dz / dd * v; s.r.grupo.rotation.y = Math.atan2(dx, dz); }
        chocar(q, .5); q.z = Math.min(q.z, ENTRADA - 7);
      }
      // de vez en cuando sale otro de entre la chatarra
      if (salvajes.length < 9 && Math.random() < dt * .15) soltar();
    }
  };
  return V;
}
