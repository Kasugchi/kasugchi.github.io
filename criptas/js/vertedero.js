// =============================================================
//  EL VERTEDERO (dentro del ring: ring.js lo monta al viajar con Rufo)
//  Un descampado de chatarra por el que paseas con tu robot. Entre los montones
//  rondan robots salvajes (los MODELOS de robots.js): si te acercas, pelea.
//  Cuanto más al fondo, más duros. El camión de Rufo, a la entrada, repara gratis.
//  Está lejos del ring (en x = CENTRO.x), en la misma escena.
// =============================================================
import * as THREE from 'three';
import { toon, contorno, lienzo, fbm } from './claro-estilo.js';
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
  const animables = []; let lucesRing = [];
  const MOVIL = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
  // ---------- Luz de atardecer: el sol bajo, al fondo del vertedero (todo a contraluz, dorado) ----------
  const solDir = new THREE.Vector3(-.35, .16, -1).normalize();
  const sol = new THREE.DirectionalLight('#ffc89a', 1.5); sol.position.copy(solDir).multiplyScalar(40); G.add(sol, sol.target);
  G.add(new THREE.HemisphereLight('#c8b0ff', '#5a3a3a', .55));   // cielo violeta, suelo cálido
  const relleno = new THREE.DirectionalLight('#7a9aff', .7); relleno.position.set(10, 12, 20); G.add(relleno, relleno.target);   // un poco de azul por delante

  // ---------- El cielo: degradado de atardecer, sol enorme, y alguna estrella saliendo ----------
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(260, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { alto: { value: new THREE.Color('#2e3170') }, medio: { value: new THREE.Color('#d8607a') }, bajo: { value: new THREE.Color('#ffc07a') }, sol: { value: solDir }, t: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 alto, medio, bajo, sol; uniform float t; varying vec3 vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        float y = vD.y;
        vec3 c = mix(bajo, medio, smoothstep(-.05, .28, y));
        c = mix(c, alto, smoothstep(.25, .85, y));
        float s = max(dot(vD, sol), 0.);
        c += vec3(1., .6, .35) * pow(s, 6.) * .7 + vec3(1., .92, .7) * smoothstep(.994, .997, s);   // halo y disco del sol
        vec2 g = floor(vec2(atan(vD.z, vD.x) * 140., y * 220.));
        c += step(.997, h(g)) * smoothstep(.45, .9, y) * (.6 + .4 * sin(t * 2. + h(g) * 40.)) * .8;
        gl_FragColor = vec4(c, 1.);
      }`
  }));
  cielo.renderOrder = -1; G.add(cielo);
  animables.push((t) => { cielo.material.uniforms.t.value = t; });
  // nubes alargadas, rosas por abajo, que pasan despacio
  const txNube = lienzo(256, 128, (x, w, h) => { for (let i = 0; i < 7; i++) { const cx = 40 + i * 30 + Math.random() * 10, cy = 70 - Math.random() * 20, r = 26 + Math.random() * 16, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,236,226,.95)'); g.addColorStop(1, 'rgba(255,200,190,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } });
  const nubes = [];
  for (let i = 0; i < 9; i++) {
    const n = new THREE.Sprite(new THREE.SpriteMaterial({ map: txNube, color: i % 2 ? '#ffd0c0' : '#f8b0b8', transparent: true, opacity: .8, fog: false, depthWrite: false }));
    const a = -Math.PI / 2 + (Math.random() - .5) * 2.2; n.position.set(Math.cos(a) * 170, 30 + Math.random() * 45, Math.sin(a) * 170); n.scale.set(70 + Math.random() * 40, 22 + Math.random() * 10, 1); G.add(n); nubes.push({ n, a, v: .004 + Math.random() * .004 });
  }
  animables.push((t, dt) => { for (const c of nubes) { c.a += c.v * dt; c.n.position.x = Math.cos(c.a) * 170; c.n.position.z = Math.sin(c.a) * 170; } });

  // ---------- Las montañas de chatarra de fuera (siluetas moradas en la bruma) ----------
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2 + Math.random() * .1, d = 62 + Math.random() * 30, h = 10 + Math.random() * 18;
    const m = new THREE.Mesh(new THREE.ConeGeometry(h * .9, h, 6), toon(['#7a4a6a', '#8a5a6a', '#6a4a72'][i % 3])); m.position.set(Math.cos(a) * d, h / 2 - 1, Math.sin(a) * d); m.rotation.y = Math.random() * 3; G.add(m);
  }

  // ---------- El suelo: tierra y arena con manchas de óxido (colores por vértice) ----------
  {
    const geo = new THREE.PlaneGeometry(MEDIO * 2 + 70, MEDIO * 2 + 70, 70, 70).rotateX(-Math.PI / 2), pos = geo.attributes.position, col = [];
    const arena = new THREE.Color('#bfa47e'), tierra = new THREE.Color('#7e6352'), oxido = new THREE.Color('#a8563e'), musgo = new THREE.Color('#7a8a5a'), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), n = fbm(x * .06 + 3, z * .06), o = fbm(x * .15 - 9, z * .15 + 4);
      c.copy(arena).lerp(tierra, n); if (o > .62) c.lerp(oxido, (o - .62) * 2.4); if (n < .32) c.lerp(musgo, (.32 - n) * 2);
      col.push(c.r, c.g, c.b);
      const fuera = Math.max(Math.abs(x), Math.abs(z)) - MEDIO - 3; pos.setY(i, fuera > 0 ? fuera * .25 * n : (n - .5) * .25);   // fuera de la valla, el suelo sube un poco
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const suelo = new THREE.Mesh(geo, toon('#ffffff', { vertexColors: true })); suelo.receiveShadow = true; G.add(suelo);
  }
  // charcos de aceite con su brillo de colores, y caminitos de grava
  for (let i = 0; i < 22; i++) {
    const r = .8 + Math.random() * 2, x = (Math.random() - .5) * MEDIO * 2, z = (Math.random() - .5) * MEDIO * 2;
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), toon('#1e1a2a')); m.rotation.x = -Math.PI / 2; m.position.set(x, .03, z); G.add(m);
    const brillo = new THREE.Mesh(new THREE.RingGeometry(r * .3, r * .55, 20), new THREE.MeshBasicMaterial({ color: ['#7a5aff', '#3ad0b0', '#ff7ab0'][i % 3], transparent: true, opacity: .35 })); brillo.rotation.x = -Math.PI / 2; brillo.position.set(x + r * .15, .04, z - r * .1); G.add(brillo);
    animables.push((t) => { brillo.rotation.z = t * .2 + i; });
  }

  // ---------- La valla ----------
  const malla = new THREE.MeshBasicMaterial({ color: '#c8c8d0', transparent: true, opacity: .25, side: THREE.DoubleSide, map: lienzo(64, 64, (x, w) => { x.strokeStyle = '#fff'; x.lineWidth = 3; for (let k = -w; k < w * 2; k += 16) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + w, w); x.moveTo(k + w, 0); x.lineTo(k, w); x.stroke(); } }) });
  malla.map.wrapS = malla.map.wrapT = THREE.RepeatWrapping; malla.map.repeat.set(3, 2);
  for (let k = -MEDIO; k <= MEDIO; k += 3) for (const [x, z, r] of [[k, -MEDIO - 1, 0], [k, MEDIO + 3, 0], [-MEDIO - 1, k, Math.PI / 2], [MEDIO + 1, k, Math.PI / 2]]) {
    if (z === MEDIO + 3 && Math.abs(x + 7) < 4) continue;   // la puerta, por donde entra el camión
    const p = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8), malla); p.position.set(x, .9, z); p.rotation.y = r; G.add(p);
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2, 6), toon('#6a6a72')); poste.position.set(x + (r ? 0 : 1.5), 1, z + (r ? 1.5 : 0)); G.add(poste);
  }

  // ---------- Los montones de chatarra: de todo, y de colores desteñidos ----------
  const choques = [], montones = [];
  const colores = ['#5aa8a0', '#e88a6a', '#e8c86a', '#7a9ad8', '#d87a9a', '#f0e8d8', '#8ab86a', '#c85a4a', '#4a6a8a'];
  const cacharro = (c) => {   // un trasto al azar
    const t = Math.random(), g = new THREE.Group();
    if (t < .14) {   // un coche viejo
      const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(1.7, .5, .9), toon(c)), cab = new THREE.Mesh(new THREE.BoxGeometry(.9, .4, .8), toon(c)); cab.position.set(-.1, .42, 0);
      const cris = new THREE.Mesh(new THREE.BoxGeometry(.92, .26, .82), toon('#9ac8e0')); cris.position.set(-.1, .44, 0);
      g.add(cuerpo, cab, cris); for (const [x, z] of [[-.55, .45], [.55, .45], [-.55, -.45], [.55, -.45]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .14, 10), toon('#2a2a2a')); r.rotation.x = Math.PI / 2; r.position.set(x, -.2, z); g.add(r); }
      contorno(cuerpo, .03);
    } else if (t < .28) {   // lavadora o nevera
      const alta = Math.random() < .5, b = new THREE.Mesh(new THREE.BoxGeometry(.6, alta ? 1.2 : .6, .6), toon(Math.random() < .6 ? '#f0ece0' : c)); contorno(b, .03); g.add(b);
      const o = new THREE.Mesh(alta ? new THREE.BoxGeometry(.04, .5, .04) : new THREE.CircleGeometry(.18, 16), toon(alta ? '#8a8a8a' : '#5a7a9a')); o.position.set(alta ? .22 : 0, alta ? .1 : 0, .31); g.add(o);
    } else if (t < .4) {   // tele con la pantalla aún encendida
      const b = new THREE.Mesh(new THREE.BoxGeometry(.6, .5, .5), toon(c)); contorno(b, .03);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(.44, .34), new THREE.MeshBasicMaterial({ color: Math.random() < .5 ? '#8ae0ff' : '#c8ffb0' })); p.position.z = .26; g.add(b, p);
      animables.push((tt) => { p.material.opacity = 1; p.visible = Math.sin(tt * 7 + c.length * 3) > -.6; });
    } else if (t < .58) {   // ruedas apiladas
      for (let k = 0; k < 1 + Math.floor(Math.random() * 3); k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.32, .13, 8, 14), toon('#26222a')); r.rotation.x = Math.PI / 2; r.position.y = k * .24; g.add(r); }
    } else if (t < .74) {   // bidón con raya
      const b = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .8, 12), toon(c)); contorno(b, .03); const r = new THREE.Mesh(new THREE.CylinderGeometry(.29, .29, .12, 12), toon('#f0e8d8')); g.add(b, r);
    } else if (t < .84) {   // cono de obra
      const b = new THREE.Mesh(new THREE.ConeGeometry(.22, .6, 10), toon('#ff8a3a')); const r = new THREE.Mesh(new THREE.CylinderGeometry(.13, .16, .1, 10), toon('#ffffff')); r.position.y = .02; g.add(b, r);
    } else {   // una bañera o una caja cualquiera
      const b = new THREE.Mesh(new THREE.BoxGeometry(.9 + Math.random() * .5, .4, .5), toon(c)); contorno(b, .03); g.add(b);
    }
    return g;
  };
  for (let i = 0; i < 34; i++) {
    let x, z; do { x = (Math.random() - .5) * (MEDIO * 2 - 6); z = (Math.random() - .5) * (MEDIO * 2 - 6); } while (Math.abs(x) < 11 && z > ENTRADA - 8);
    const r = 1.4 + Math.random() * 2.2, g = new THREE.Group(); g.position.set(x, 0, z); G.add(g); choques.push({ x, z, r: r + .5 }); montones.push({ g, x, z, r });
    const base = new THREE.Mesh(new THREE.ConeGeometry(r * 1.1, r * 1.1, 7), toon(['#7a5a42', '#8a6248', '#6a5240'][i % 3])); base.position.y = r * .5; base.rotation.y = Math.random() * 3; g.add(base);
    for (let k = 0; k < (MOVIL ? 5 : 7); k++) {
      const o = cacharro(colores[(i * 7 + k) % colores.length]), a = Math.random() * Math.PI * 2, d = Math.random() * r * .75;
      o.position.set(Math.cos(a) * d, r * (1 - d / r) * .95 + .15, Math.sin(a) * d); o.rotation.set((Math.random() - .5) * .8, Math.random() * 3, (Math.random() - .5) * .8); g.add(o);
    }
  }
  // ---------- La grúa con su imán, al fondo (se ve desde todo el vertedero) ----------
  {
    const g = new THREE.Group(); g.position.set(12, 0, -20); G.add(g); choques.push({ x: 12, z: -20, r: 1.6 });
    const torre = new THREE.Mesh(new THREE.BoxGeometry(.9, 14, .9), toon('#f0b83a')); torre.position.y = 7; contorno(torre, .05);
    const brazo = new THREE.Group(); brazo.position.y = 14; g.add(torre, brazo);
    const pluma = new THREE.Mesh(new THREE.BoxGeometry(14, .6, .6), toon('#f0b83a')); pluma.position.x = -4; contorno(pluma, .05); brazo.add(pluma);
    const contra = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.2), toon('#5a5a62')); contra.position.x = 3; brazo.add(contra);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 6, 4), toon('#2a2a2a')); cable.position.set(-9, -3, 0); brazo.add(cable);
    const iman = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .4, 18), toon('#c83a3a')); iman.position.set(-9, -6.2, 0); contorno(iman, .04); brazo.add(iman);
    const coche = cacharro('#5aa8a0'); coche.position.set(-9, -6.9, 0); brazo.add(coche);
    const luzRoja = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3a3a', fog: false })); luzRoja.position.set(0, 14.6, 0); g.add(luzRoja);
    animables.push((t) => { brazo.rotation.y = Math.sin(t * .12) * 1.2; luzRoja.visible = Math.sin(t * 3) > 0; });
  }
  // ---------- Hogueras en bidones (humo y chispas) y farolas ----------
  const txHumo = lienzo(64, 64, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
  for (const [x, z] of [[-5, ENTRADA - 6], [9, 4], [-16, -12], [20, -26]]) {
    choques.push({ x, z, r: .6 });
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .9, 12), toon('#5a4a42')); b.position.set(x, .45, z); contorno(b, .03); G.add(b);
    const fuego = new THREE.Mesh(new THREE.ConeGeometry(.3, .7, 8), new THREE.MeshBasicMaterial({ color: '#ffb03a' })); fuego.position.set(x, 1.15, z); G.add(fuego);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: txHumo, color: '#ffa04a', transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.set(x, 1.2, z); halo.scale.setScalar(2.6); G.add(halo);
    const humos = [];
    for (let k = 0; k < 5; k++) { const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: txHumo, color: '#6a5a62', transparent: true, opacity: .4, depthWrite: false })); G.add(h); humos.push({ h, f: k / 5 }); }
    animables.push((t) => {
      fuego.scale.set(1 + Math.sin(t * 13 + x) * .15, 1 + Math.sin(t * 9 + z) * .25, 1); halo.material.opacity = .45 + Math.sin(t * 11 + x) * .12;
      for (const s of humos) { const k = (t * .25 + s.f) % 1; s.h.position.set(x + Math.sin(t + s.f * 6) * k * .8, 1.4 + k * 5, z); s.h.scale.setScalar(.6 + k * 2.4); s.h.material.opacity = .4 * (1 - k); }
    });
  }
  // polvo dorado flotando a contraluz
  {
    const N = MOVIL ? 120 : 260, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { p[i * 3] = (Math.random() - .5) * MEDIO * 2; p[i * 3 + 1] = Math.random() * 6; p[i * 3 + 2] = (Math.random() - .5) * MEDIO * 2; }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const polvo = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffd8a0', size: .09, transparent: true, opacity: .8, depthWrite: false }));
    G.add(polvo); animables.push((t) => { polvo.position.y = Math.sin(t * .3) * .3; polvo.rotation.y = t * .01; });
  }
  // gaviotas dando vueltas
  {
    const bandada = new THREE.Group(); G.add(bandada); const alas = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Group(); p.position.set((i % 2 ? 1 : -1) * Math.ceil(i / 2) * 1.6, Math.random(), -Math.ceil(i / 2) * 1.4);
      for (const sd of [-1, 1]) { const a = new THREE.Mesh(new THREE.PlaneGeometry(.9, .22).translate(sd * .45, 0, 0), new THREE.MeshBasicMaterial({ color: '#f4ecd8', side: THREE.DoubleSide })); p.add(a); alas.push([a, sd, i]); }
      bandada.add(p);
    }
    animables.push((t) => { const a = t * .08; bandada.position.set(Math.cos(a) * 18, 14 + Math.sin(t * .4) * 1.5, Math.sin(a) * 18 - 6); bandada.rotation.y = -a; for (const [w, sd, i] of alas) w.rotation.z = sd * Math.sin(t * 5 + i) * .5; });
  }
  // el camión de Rufo, a la entrada (y su cartel)
  const ruedas = [], puertas = [];
  const camion = new THREE.Group(); camion.position.set(-7, 0, ENTRADA + .5); G.add(camion);   // a un lado: que no tape la vista al llegar
  { const caja = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 3.4), toon('#c84a3a')); caja.position.set(0, 1.25, -.4); contorno(caja, .04);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 1.3), toon('#e8d8b0')); cab.position.set(0, 1.05, 1.9); contorno(cab, .04);
    const cristal = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .55), toon('#7ab0d0')); cristal.position.set(0, 1.35, 2.56);
    camion.add(caja, cab, cristal);
    for (const [x, z] of [[-1.1, -1.4], [1.1, -1.4], [-1.1, 1.6], [1.1, 1.6]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .3, 14), toon('#2a2a2a')); r.rotation.z = Math.PI / 2; r.position.set(x, .42, z); camion.add(r); ruedas.push(r); }
    // las puertas de atrás (bisagra en cada lado): se abren para que salte tu robot
    for (const sx of [-1, 1]) { const b = new THREE.Group(); b.position.set(sx * 1.2, 1.25, -2.12); const h = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.5, .06), toon('#a83a2e')); h.position.x = -sx * .59; contorno(h, .03); const asa = new THREE.Mesh(new THREE.BoxGeometry(.06, .3, .06), toon('#e8d8b0')); asa.position.set(-sx * 1.05, 0, -.05); b.add(h, asa); camion.add(b); puertas.push([b, sx]); }
    const faro = new THREE.Mesh(new THREE.BoxGeometry(.3, .18, .05), new THREE.MeshBasicMaterial({ color: '#fff4c0' })); faro.position.set(-.7, .75, 2.56); const faro2 = faro.clone(); faro2.position.x = .7; camion.add(faro, faro2);
    const tx = lienzo(512, 160, (x, w, h) => { x.fillStyle = '#fff2c8'; x.fillRect(0, 0, w, h); x.fillStyle = '#8a1c1c'; x.font = 'bold 54px Georgia, serif'; x.textAlign = 'center'; x.fillText('RUFO · CHATARRAS', w / 2, 70); x.font = 'bold 34px Georgia, serif'; x.fillStyle = '#3a2a20'; x.fillText('Aquí te reparo gratis', w / 2, 128); });
    const cartel = new THREE.Mesh(new THREE.PlaneGeometry(2.3, .72), new THREE.MeshBasicMaterial({ map: tx })); cartel.position.set(0, 2.5, -2.15); cartel.rotation.y = Math.PI; camion.add(cartel);   // de cara al vertedero
    const corro = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.9, 32), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: .6 })); corro.rotation.x = -Math.PI / 2; corro.position.set(0, .02, -3.5); camion.add(corro);
  }
  const SITIO_REPARAR = new THREE.Vector3(-7, 0, ENTRADA - 3);
  const APARCADO = camion.position.clone(), LEJOS = APARCADO.clone().setZ(ENTRADA + 30), SALTO = new THREE.Vector3(-3.6, 0, ENTRADA - 4.6);

  // ---------- La llegada (y la vuelta) en el camión de Rufo, como el autobús de los juegos de islas ----------
  // El camión entra marcha atrás pitando, abre las puertas de atrás y tu robot salta al suelo. Al irte, al revés.
  let cine = null; const mundo = (v) => v.clone().add(CENTRO);
  const ac = (() => { try { return new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } })();
  function pitar(f = 1400, d = .12, vol = .08, tipo = 'square') {
    if (!ac) return; try { ac.resume?.(); const o = ac.createOscillator(), g = ac.createGain(); o.type = tipo; o.frequency.value = f; g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + d + .02); } catch { /* sin sonido */ }
  }
  const bocina = () => { pitar(330, .35, .1, 'sawtooth'); setTimeout(() => pitar(392, .45, .1, 'sawtooth'), 380); };
  const suave = (k) => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  const arco = (a, b, k, alto) => a.clone().lerp(b, k).setY(a.y + (b.y - a.y) * k + Math.sin(Math.PI * k) * alto);
  function abrir(k) { for (const [b, sx] of puertas) b.rotation.y = sx * 1.9 * k; }
  function pasoCine(dt) {
    const c = cine; c.t += dt; const t = c.t, cam = new THREE.Vector3(), mira = new THREE.Vector3();
    const atras = APARCADO.clone().add(new THREE.Vector3(0, 1, -2));   // el hueco de atrás del camión
    if (c.tipo === 'llega') {
      const k = suave(t / 3.2); camion.position.copy(LEJOS).lerp(APARCADO, k); camion.position.y = t < 3.2 ? Math.abs(Math.sin(t * 18)) * .04 : 0;
      for (const r of ruedas) r.rotation.x += dt * (t < 3.2 ? (1 - k) * 9 + .5 : 0);
      if (t < 3.1 && Math.floor(t / .45) !== c.pi) { c.pi = Math.floor(t / .45); pitar(); }   // pi… pi… pi… (marcha atrás)
      if (t > 3.2 && !c.bocina) { c.bocina = true; bocina(); }
      abrir(suave((t - 3.4) / .5));
      if (t > 3.9) { const j = Math.min(1, (t - 3.9) / .8); yo.grupo.visible = true; yo.grupo.position.copy(arco(atras, SALTO, j, 1.3)); yo.grupo.rotation.y = Math.PI; if (j >= 1 && !c.polvo) { c.polvo = true; ui?.chispas(mundo(SALTO).add(new THREE.Vector3(0, .2, 0)), '#e8d8b8', 24, 2.2); pitar(180, .12, .08, 'triangle'); } }
      cam.copy(APARCADO).add(new THREE.Vector3(5.5, 3, -9.5)); mira.copy(t < 3.9 ? camion.position.clone().add(new THREE.Vector3(0, 1.2, -1)) : yo.grupo.position.clone().add(new THREE.Vector3(0, 1, 0)));
      if (t > 5.2) return terminarCine();
    } else {   // se va
      if (t < .9) { const j = t / .9; abrir(1); yo.grupo.position.copy(arco(SALTO, atras, j, 1.3)); yo.grupo.rotation.y = 0; if (j > .95) yo.grupo.visible = false; }
      else yo.grupo.visible = false;
      abrir(1 - suave((t - 1) / .5));
      if (t > 1.6 && !c.bocina) { c.bocina = true; bocina(); }
      const k = Math.pow(Math.max(0, Math.min(1, (t - 2) / 2.6)), 2); camion.position.copy(APARCADO).lerp(LEJOS, k); camion.position.y = k > 0 ? Math.abs(Math.sin(t * 18)) * .04 : 0;
      for (const r of ruedas) r.rotation.x -= dt * k * 12;
      cam.copy(APARCADO).add(new THREE.Vector3(5.5, 3, -9.5)); mira.copy(camion.position).add(new THREE.Vector3(0, 1.2, 0));
      if (t > 4.4) return terminarCine();
    }
    V.cineCam = { pos: mundo(cam), mira: mundo(mira) };
  }
  function terminarCine() {
    const c = cine; cine = null; V.cineCam = null;
    if (c.tipo === 'llega') { camion.position.copy(APARCADO); abrir(1); yo.grupo.visible = true; yo.grupo.position.copy(SALTO); yo.grupo.rotation.y = Math.PI; V.pausa = false; }
    else { camion.position.copy(LEJOS); abrir(0); }
    c.ok();
  }

  // ---------- tú (tu robot) ----------
  let yo = null; const destino = new THREE.Vector3(); let hayDestino = false; const teclas = {};
  const pos = () => yo.grupo.position;
  function ponerme(spec) {
    if (yo) yo.desechar(G);
    yo = crearRobot(spec); yo.grupo.scale.setScalar(.8); G.add(yo.grupo); yo.grupo.position.copy(SALTO); yo.grupo.rotation.y = Math.PI; hayDestino = false;
  }
  addEventListener('keydown', (e) => { teclas[e.key.toLowerCase()] = true; });
  addEventListener('keyup', (e) => { teclas[e.key.toLowerCase()] = false; });
  // el joystick (en táctil, como el del claro): abajo a la izquierda
  let joy = null;
  const pad = document.createElement('div'); pad.id = 'joyVert'; pad.innerHTML = '<i></i>'; pad.hidden = true; document.body.appendChild(pad);
  const bola = pad.firstChild;
  if (!document.getElementById('css-joyVert')) { const st = document.createElement('style'); st.id = 'css-joyVert'; st.textContent = `
    #joyVert { position: fixed; z-index: 4; left: 18px; bottom: calc(max(18px, env(safe-area-inset-bottom)) + 8px); width: 104px; height: 104px; border-radius: 50%; background: rgba(255,248,230,.28); border: 3px solid rgba(255,248,230,.65); touch-action: none; }
    #joyVert[hidden] { display: none; }
    #joyVert i { position: absolute; left: 50%; top: 50%; width: 46px; height: 46px; margin: -23px; border-radius: 50%; background: #fff8e6; box-shadow: 0 4px 0 #c9a06a; }`; document.head.appendChild(st); }
  pad.addEventListener('pointerdown', (e) => { const r = pad.getBoundingClientRect(); joy = { id: e.pointerId, cx: r.left + r.width / 2, cy: r.top + r.height / 2, x: 0, y: 0 }; pad.setPointerCapture(e.pointerId); hayDestino = false; e.stopPropagation(); });
  pad.addEventListener('pointermove', (e) => { if (!joy || e.pointerId !== joy.id) return; let x = (e.clientX - joy.cx) / 42, y = (e.clientY - joy.cy) / 42; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } joy.x = x; joy.y = y; bola.style.transform = `translate(${x * 32}px, ${y * 32}px)`; });
  const soltarJoy = () => { joy = null; bola.style.transform = ''; };
  pad.addEventListener('pointerup', soltarJoy); pad.addEventListener('pointercancel', soltarJoy);
  const TACTIL = matchMedia('(pointer: coarse)').matches;
  const ray = new THREE.Raycaster(), plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), v2 = new THREE.Vector2();
  // La cámara, como en el claro: arrastrar la gira alrededor de tu robot (y sube o baja); pellizco o rueda, más cerca o más lejos
  const CAMV = { giro: 0, alto: .25, dist: 1 };   // giro 0: detrás de ti mirando al fondo
  const dedos = new Map(); let pellizco = null;
  lienzoDom.addEventListener('pointerdown', (e) => {
    if (cine && cine.t > .4) { terminarCine(); return; }   // tocar: saltarse la escena
    if (!V.activo || V.pausa || !yo) return;
    dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dedos.size === 2) { const [a, b] = [...dedos.values()]; pellizco = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: CAMV.dist }; }
  });
  lienzoDom.addEventListener('pointermove', (e) => {
    const d = dedos.get(e.pointerId); if (!d || !V.activo || V.pausa) return;
    if (dedos.size === 2 && pellizco) { d.x = e.clientX; d.y = e.clientY; const [a, b] = [...dedos.values()]; CAMV.dist = Math.max(.6, Math.min(1.8, pellizco.dist * pellizco.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)))); return; }
    CAMV.giro -= (e.clientX - d.x) * .008; CAMV.alto = Math.max(0, Math.min(1, CAMV.alto + (e.clientY - d.y) * .004));
    d.x = e.clientX; d.y = e.clientY;
  });
  const soltar_ = (e) => { dedos.delete(e.pointerId); if (dedos.size < 2) pellizco = null; };
  lienzoDom.addEventListener('pointerup', soltar_); lienzoDom.addEventListener('pointercancel', soltar_);
  lienzoDom.addEventListener('wheel', (e) => { if (!V.activo) return; CAMV.dist = Math.max(.6, Math.min(1.8, CAMV.dist * (1 + Math.sign(e.deltaY) * .1))); }, { passive: true });

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
    entrar(spec) {
      V.activo = true; G.visible = true; ponerme(spec); while (salvajes.length < 9) soltar();
      lucesRing = escena.children.filter((o) => o.isLight && o.parent === escena).map((l) => [l, l.intensity]); for (const [l] of lucesRing) l.intensity *= .35;
    },
    salir() { V.activo = false; G.visible = false; for (const [l, i] of lucesRing) l.intensity = i; lucesRing = []; },
    // Vuelves al camión (después de perder, por ejemplo)
    alCamion() { if (yo) { yo.grupo.position.copy(SALTO); hayDestino = false; } },
    cineCam: null, cam: CAMV,
    // Dónde va la cámara al pasear: detrás de ti según el giro, más alta o más baja según hayas arrastrado
    camaraPaseo(lejos = 1) {
      const p = V.dondeEstoy(), k = CAMV.dist * lejos, alto = 2.6 + CAMV.alto * 5, atras = 8.2 - CAMV.alto * 2;
      const sx = Math.sin(CAMV.giro), cz = Math.cos(CAMV.giro);
      return { pos: p.clone().add(new THREE.Vector3(sx * atras * k, alto * k, cz * atras * k)), mira: p.clone().add(new THREE.Vector3(-sx * (6 - CAMV.alto * 5), 2.2 - CAMV.alto * 1.2, -cz * (6 - CAMV.alto * 5))) };
    },
    // Llegas: el camión entra marcha atrás y tu robot salta de atrás (se puede saltar tocando)
    llegada() { return new Promise((ok) => { V.pausa = true; Object.assign(CAMV, { giro: .45, alto: .25, dist: 1 }); camion.position.copy(LEJOS); abrir(0); yo.grupo.visible = false; cine = { tipo: 'llega', t: 0, ok, pi: -1 }; V.cineCam = { pos: mundo(APARCADO.clone().add(new THREE.Vector3(5.5, 3, -9.5))), mira: mundo(LEJOS.clone().setY(1)), corte: true }; }); },
    // Te vas: tu robot se sube atrás y el camión se marcha
    salida() { return new Promise((ok) => { V.pausa = true; hayDestino = false; yo.grupo.position.copy(SALTO); camion.position.copy(APARCADO); cine = { tipo: 'va', t: 0, ok }; V.cineCam = { pos: mundo(APARCADO.clone().add(new THREE.Vector3(5.5, 3, -9.5))), mira: mundo(APARCADO.clone().setY(1.2)), corte: true }; }); },
    ocultarPelea(s, si) { if (yo) yo.grupo.visible = !si; if (s) s.r.grupo.visible = !si; for (const x of salvajes) if (x.rot) x.rot.visible = !si; },
    actualizar(dt, t) {
      pad.hidden = !(TACTIL && V.activo && !V.pausa);
      if (!V.activo || !yo) return;
      for (const f of animables) f(t, dt);
      if (cine) { pasoCine(dt); yo.animar(dt, t); for (const s of salvajes) s.r.animar(dt, t); return; }
      // los montones que se ponen entre la cámara y tu robot se apartan (si no, te pierdes de vista)
      { const c = camara.position.clone().sub(CENTRO), q = yo.grupo.position, dx = q.x - c.x, dz = q.z - c.z, L2 = dx * dx + dz * dz || 1;
        for (const m of montones) { const k = Math.max(0, Math.min(1, ((m.x - c.x) * dx + (m.z - c.z) * dz) / L2)); m.g.visible = !(k > .05 && k < .97 && Math.hypot(c.x + dx * k - m.x, c.z + dz * k - m.z) < m.r * .9); } }
      for (const s of salvajes) s.r.animar(dt, t);
      yo.animar(dt, t);
      if (V.pausa) return;
      // moverte: con el dedo (a donde toques) o con WASD / flechas
      const p = pos(), dir = new THREE.Vector3((teclas.d || teclas.arrowright ? 1 : 0) - (teclas.a || teclas.arrowleft ? 1 : 0), 0, (teclas.s || teclas.arrowdown ? 1 : 0) - (teclas.w || teclas.arrowup ? 1 : 0));
      let rapidez = 1;
      if (joy && Math.hypot(joy.x, joy.y) > .15) { dir.set(joy.x, 0, joy.y); rapidez = Math.min(1, Math.hypot(joy.x, joy.y) * 1.2); }
      if (dir.lengthSq()) { const c = Math.cos(CAMV.giro), s_ = Math.sin(CAMV.giro); dir.set(dir.x * c + dir.z * s_, 0, -dir.x * s_ + dir.z * c); }   // adelante es hacia donde mira la cámara
      if (dir.lengthSq()) hayDestino = false; else if (hayDestino) { dir.set(destino.x - p.x, 0, destino.z - p.z); if (dir.length() < .2) { hayDestino = false; dir.set(0, 0, 0); } }
      if (dir.lengthSq()) { dir.normalize(); p.addScaledVector(dir, dt * 4.2 * rapidez); yo.grupo.rotation.y = Math.atan2(dir.x, dir.z); p.y = Math.abs(Math.sin(t * 12)) * .06; } else p.y = 0;
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
