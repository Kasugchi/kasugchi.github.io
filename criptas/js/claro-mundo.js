// =============================================================
//  EL CLARO · MUNDO: cielo de atardecer, colinas, bosque, estanque,
//  hoguera, la entrada de la cripta y Morrandar al fondo con el pueblo.
//  Devuelve lo que el juego necesita: altura del suelo, obstáculos,
//  sitios con nombre y una función para animarlo todo cada fotograma.
// =============================================================
import * as THREE from 'three';
import { mergeGeometries } from './vendor/addons/utils/BufferGeometryUtils.js';
import { P, toon, pieza, contorno, fbm, ruido, azar, lienzo } from './claro-estilo.js';

// Sitios importantes del claro (el juego los usa para colocar cosas)
export const SITIOS = {
  llegada: new THREE.Vector3(-6, 0, -30),       // pie de la pasarela que baja de Morrandar
  morrandar: new THREE.Vector3(-6, 0, -100),
  hoguera: new THREE.Vector3(-1.5, 0, -15),
  guarda: new THREE.Vector3(-4.2, 0, -16.5),
  cartel: new THREE.Vector3(1.8, 0, -24),
  estanque: new THREE.Vector3(-17, 0, 6),
  cripta: new THREE.Vector3(27, 0, 7),          // la puerta (mirando al oeste)
  colina: new THREE.Vector3(33, 0, 7)
};
// El camino de tierra, como una línea de puntos
const CAMINO = [[-6, -31], [-4, -24], [-1, -19], [1, -12], [3, -6], [8, -1], [14, 3], [20, 6], [25, 7]];

function distSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}
export function distCamino(x, z) {
  let d = 1e9; for (let i = 0; i < CAMINO.length - 1; i++) d = Math.min(d, distSeg(x, z, ...CAMINO[i], ...CAMINO[i + 1]));
  return d;
}
const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// La altura del suelo: llano en el claro, colinas alrededor, hueco en el estanque
export function alturaEn(x, z) {
  const d = Math.hypot(x, z * 1.1);
  let h = (fbm(x * .07 + 3, z * .07) - .5) * 1.1;                       // ondulación suave
  h += suave(36, 75, d) * (fbm(x * .03, z * .03) * 22 + 2);             // colinas del borde
  const de = Math.hypot(x - SITIOS.estanque.x, z - SITIOS.estanque.z);
  h -= (1 - suave(3, 7.5, de)) * 1.6;                                   // el estanque
  h *= 1 - (1 - suave(1.2, 4, distCamino(x, z))) * .6;                  // el camino, más llano
  const dm = Math.hypot(x - SITIOS.morrandar.x, (z - SITIOS.morrandar.z) * .9);
  h *= suave(36, 60, dm);                                               // Morrandar pisa llano
  return h;
}

export function crearMundo(escena, { movil = false } = {}) {
  const animables = [];             // funciones (t, dt) que se llaman cada fotograma
  const obstaculos = [];            // círculos { x, z, r } por donde no se puede pasar
  const rnd = azar(11);

  // ---------- Luz de atardecer ----------
  const solDir = new THREE.Vector3(-.75, .32, .58).normalize();
  const sol = new THREE.DirectionalLight('#ffd2a1', 2.3);
  sol.position.copy(solDir).multiplyScalar(60); sol.castShadow = true;
  sol.shadow.mapSize.set(movil ? 1024 : 2048, movil ? 1024 : 2048);
  Object.assign(sol.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 160 });
  sol.shadow.bias = -.0006; sol.shadow.normalBias = .04;
  escena.add(sol, sol.target);
  escena.add(new THREE.HemisphereLight('#b7a6ff', '#4d7a3a', 1.05));
  escena.add(new THREE.AmbientLight('#ffb38a', .25));
  escena.fog = new THREE.Fog(P.niebla, 50, 190);

  // ---------- Cielo pintado: degradado, resplandor del sol y estrellas que empiezan a salir ----------
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { alto: { value: new THREE.Color(P.cieloAlto) }, medio: { value: new THREE.Color(P.cieloMedio) }, bajo: { value: new THREE.Color(P.horizonte) }, sol: { value: solDir }, t: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 alto, medio, bajo, sol; uniform float t; varying vec3 vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        float y = vD.y;
        vec3 c = mix(bajo, medio, smoothstep(-.02, .22, y));
        c = mix(c, alto, smoothstep(.2, .75, y));
        float s = max(dot(vD, sol), 0.);
        c += vec3(1., .78, .5) * pow(s, 8.) * .55 + vec3(1., .95, .8) * smoothstep(.9975, .999, s);
        vec2 g = floor(vec2(atan(vD.z, vD.x) * 140., y * 220.));
        float e = step(.996, h(g)) * smoothstep(.35, .8, y) * (.6 + .4 * sin(t * 2. + h(g) * 40.));
        c += e * .9;
        gl_FragColor = vec4(c, 1.);
      }`
  }));
  escena.add(cielo);
  animables.push((t) => { cielo.material.uniforms.t.value = t; });

  // Nubes de algodón, rosadas por el sol, que pasan despacio
  const nubes = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const n = new THREE.Group(), ang = rnd() * Math.PI * 2, dist = 150 + rnd() * 120;
    for (let k = 0; k < 5; k++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(7 + rnd() * 6, 1), toon(k % 2 ? '#ffe3d3' : '#ffc8c0', { fog: false }));
      b.position.set((k - 2) * 8 + rnd() * 4, rnd() * 4, rnd() * 6); b.scale.y = .55; n.add(b);
    }
    n.position.set(Math.cos(ang) * dist, 60 + rnd() * 50, Math.sin(ang) * dist);
    n.userData.v = .6 + rnd() * .8; nubes.add(n);
  }
  escena.add(nubes);
  animables.push((t, dt) => { nubes.rotation.y += dt * .004; });

  // ---------- El suelo: colinas con colores pintados (hierba, camino, orillas) ----------
  const TAM = 240, SEG = movil ? 120 : 170;
  const gSuelo = new THREE.PlaneGeometry(TAM, TAM, SEG, SEG); gSuelo.rotateX(-Math.PI / 2);
  const pos = gSuelo.attributes.position, cols = new Float32Array(pos.count * 3), c = new THREE.Color();
  const cH = new THREE.Color(P.hierba), cO = new THREE.Color(P.hierbaOscura), cC = new THREE.Color(P.hierbaClara), cCam = new THREE.Color(P.camino), cT = new THREE.Color(P.tierra);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = alturaEn(x, z); pos.setY(i, y);
    const n = fbm(x * .12, z * .12);
    c.copy(cO).lerp(cH, suave(.3, .6, n)).lerp(cC, suave(.62, .85, n) * .7);
    c.lerp(cT, suave(2, 12, y) * .25);                                         // las colinas, más secas
    const dc = distCamino(x, z) + (ruido(x * .8, z * .8) - .5) * .9;
    c.lerp(cCam, 1 - suave(1.3, 2.2, dc));                                     // camino con borde irregular
    const de = Math.hypot(x - SITIOS.estanque.x, z - SITIOS.estanque.z);
    c.lerp(cCam, (1 - suave(6, 7.6, de)) * suave(4.5, 6, de) * .8);            // orilla de arena
    cols.set([c.r, c.g, c.b], i * 3);
  }
  gSuelo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); gSuelo.computeVertexNormals();
  const suelo = new THREE.Mesh(gSuelo, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon('#fff').gradientMap }));
  suelo.receiveShadow = true; suelo.name = 'suelo'; escena.add(suelo);

  // ---------- Hierba que se mece con el viento (miles de briznas en una sola pieza) ----------
  const viento = { value: 0 }, aplastar = { value: new THREE.Vector4(0, 0, 0, 0) };   // aplastar: (x, z, radio, cuánto) para el círculo de combate
  {
    const gb = new THREE.BufferGeometry();
    gb.setAttribute('position', new THREE.Float32BufferAttribute([-.06, 0, 0, .06, 0, 0, -.04, .25, 0, .04, .25, 0, 0, .55, 0], 3));
    gb.setAttribute('color', new THREE.Float32BufferAttribute([.55, .55, .55, .55, .55, .55, .8, .8, .8, .8, .8, .8, 1.15, 1.15, 1.1], 3));
    gb.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); gb.computeVertexNormals();
    const mb = new THREE.MeshToonMaterial({ vertexColors: true, side: THREE.DoubleSide, gradientMap: toon('#fff').gradientMap });
    mb.onBeforeCompile = (s) => {
      s.uniforms.viento = viento; s.uniforms.aplastar = aplastar;
      s.vertexShader = 'uniform float viento; uniform vec4 aplastar;\n' + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 ip = instanceMatrix * vec4(0., 0., 0., 1.);
        transformed.y *= 1. - aplastar.w * (1. - smoothstep(aplastar.z - 1.2, aplastar.z, length(ip.xz - aplastar.xy))) * .92;
        float a = position.y / .55;
        transformed.x += (sin(viento * 1.7 + ip.x * .35 + ip.z * .22) * .16 + sin(viento * 3.1 + ip.z * .9) * .05) * a * a;
        transformed.z += cos(viento * 1.3 + ip.x * .2) * .08 * a * a;`);
      s.vertexShader = s.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n objectNormal = vec3(0., 1., 0.);');
    };
    const N = movil ? 9000 : 22000, hierba = new THREE.InstancedMesh(gb, mb, N), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
    let k = 0;
    for (let i = 0; k < N && i < N * 4; i++) {
      const x = (rnd() - .5) * 110, z = (rnd() - .5) * 100;
      if (distCamino(x, z) < 1.7 || Math.hypot(x - SITIOS.estanque.x, z - SITIOS.estanque.z) < 6.8) continue;
      if (Math.hypot(x - SITIOS.colina.x, z - SITIOS.colina.z) < 9 || Math.hypot(x, z) > 58) continue;
      if (fbm(x * .15 + 9, z * .15) < .36) continue;                          // calvas: la hierba va en matas
      p.set(x, alturaEn(x, z) - .02, z); e.set((rnd() - .5) * .3, rnd() * Math.PI, (rnd() - .5) * .3); q.setFromEuler(e);
      const t = .6 + rnd() * .9; s.set(1, t, 1);
      hierba.setMatrixAt(k, m.compose(p, q, s));
      hierba.setColorAt(k, c.copy(cH).lerp(cC, rnd() * .8).offsetHSL((rnd() - .5) * .03, 0, (rnd() - .5) * .06));
      k++;
    }
    hierba.count = k; hierba.receiveShadow = true; escena.add(hierba);
    animables.push((t) => { viento.value = t; });
  }

  // ---------- Flores de colores en matas ----------
  {
    const gf = mergeGeometries([new THREE.CylinderGeometry(.015, .015, .3, 4).translate(0, .15, 0).toNonIndexed(), new THREE.IcosahedronGeometry(.08, 0).translate(0, .32, 0)]);
    const N = movil ? 260 : 520, flores = new THREE.InstancedMesh(gf, toon('#ffffff'), N), m = new THREE.Matrix4();
    const colores = ['#ff8fb8', '#ffe066', '#ffffff', '#c59bff', '#ff9e5e'];
    for (let i = 0; i < N; i++) {
      const g = Math.floor(rnd() * 40), cx = ruido(g * 3.1, 1) * 90 - 45, cz = ruido(1, g * 2.7) * 80 - 40;
      const x = cx + (rnd() - .5) * 4, z = cz + (rnd() - .5) * 4;
      if (distCamino(x, z) < 1.8 || Math.hypot(x - SITIOS.estanque.x, z - SITIOS.estanque.z) < 7) { m.makeScale(0, 0, 0); flores.setMatrixAt(i, m); continue; }
      m.makeRotationY(rnd() * 6); m.setPosition(x, alturaEn(x, z), z); const e = .8 + rnd() * .7; m.scale(new THREE.Vector3(e, e, e));
      flores.setMatrixAt(i, m); flores.setColorAt(i, new THREE.Color(colores[g % colores.length]));
    }
    escena.add(flores);
  }

  // ---------- Árboles retorcidos con copas de nube ----------
  // Para que vaya fluido en el móvil, todos los árboles del bosque se funden en pocas piezas
  // (troncos, copas y sus contornos); el vaivén de las copas lo hace la tarjeta gráfica.
  const geoTroncos = [], geoCopas = [], bordeTroncos = [], bordeCopas = [];
  const casco = (g, grosor) => { const c = g.clone(), p = c.attributes.position, n = c.attributes.normal; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * grosor, p.getY(i) + n.getY(i) * grosor, p.getZ(i) + n.getZ(i) * grosor); return c; };
  const conColor = (g, col) => { const c = new THREE.Color(col), a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) a.set([c.r, c.g, c.b], i); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  function arbol(x, z, esc = 1, semilla = 1, { suelto = false } = {}) {
    const r = azar(semilla), alto = (4.2 + r() * 2.5) * esc;
    const curva = new THREE.CatmullRomCurve3([0, .33, .66, 1].map((f, i) => new THREE.Vector3(i ? (r() - .5) * 1.1 * esc * f : 0, f * alto, i ? (r() - .5) * 1.1 * esc * f : 0)));
    const gt = new THREE.TubeGeometry(curva, 10, .38 * esc, 7, false), pt = gt.attributes.position;
    for (let i = 0; i <= 10; i++) {                                          // el tronco se estrecha hacia arriba
      const c0 = curva.getPointAt(i / 10), k = 1 - .55 * (i / 10) + (i === 0 ? .35 : 0);
      for (let j = 0; j <= 7; j++) { const v = i * 8 + j; pt.setXYZ(v, c0.x + (pt.getX(v) - c0.x) * k, pt.getY(v), c0.z + (pt.getZ(v) - c0.z) * k); }
    }
    gt.computeVertexNormals();
    const cima = curva.getPointAt(1), tonos = [P.copa, P.copa2, P.copa3], bolas = [];
    for (let k = 0; k < 4 + Math.floor(r() * 3); k++) {
      const rad = (1.4 + r() * 1.1) * esc, b = new THREE.IcosahedronGeometry(rad, 1);
      b.scale(1, .8, 1); b.translate(cima.x + (r() - .5) * 2.6 * esc, cima.y + (r() - .2) * 1.4 * esc, cima.z + (r() - .5) * 2.6 * esc);
      bolas.push(conColor(b, tonos[Math.floor(r() * 3)]));
    }
    const M = new THREE.Matrix4().makeRotationY(r() * 6).setPosition(x, alturaEn(x, z) - .1, z);
    if (suelto) {   // un árbol suelto (el de la plaza de Morrandar)
      const g = new THREE.Group(); g.add(pieza(gt, P.tronco, { borde: .05 }));
      for (const b of bolas) { b.computeVertexNormals(); const m = new THREE.Mesh(b, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon('#fff').gradientMap })); g.add(contorno(m, .06)); }
      return g;
    }
    gt.applyMatrix4(M); geoTroncos.push(gt); bordeTroncos.push(casco(gt, .05));
    for (const b of bolas) { b.applyMatrix4(M); geoCopas.push(b); bordeCopas.push(casco(b, .07)); }
    obstaculos.push({ x, z, r: .7 * esc });
  }
  {
    const hay = [];
    const sitio = (x, z) => distCamino(x, z) > 4 && Math.hypot(x - SITIOS.estanque.x, z - SITIOS.estanque.z) > 9 && Math.hypot(x - SITIOS.colina.x, z - SITIOS.colina.z) > 11
      && Math.hypot(x - SITIOS.hoguera.x, z - SITIOS.hoguera.z) > 7 && !(Math.abs(x + 6) < 7 && z < -28) && !hay.some(([a, b]) => Math.hypot(a - x, b - z) < 5);
    let n = 0;
    for (let i = 0; i < 500 && n < (movil ? 40 : 60); i++) {
      const ang = rnd() * Math.PI * 2, dist = 24 + rnd() * 34, x = Math.cos(ang) * dist, z = Math.sin(ang) * dist;
      if (!sitio(x, z)) continue;
      arbol(x, z, .85 + rnd() * .6, i * 13 + 5); hay.push([x, z]); n++;
    }
    arbol(-11, -6, 1.15, 77); arbol(9, -17, 1, 31); arbol(-21, -15, 1.3, 91);   // unos pocos dentro del claro, para dar sombra
    // el vaivén de las copas: lo calcula la gráfica según la altura y la posición de cada vértice
    const mecer = (m) => { m.onBeforeCompile = (s) => { s.uniforms.viento = viento; s.vertexShader = 'uniform float viento;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float alto = max(0., position.y - 3.);\n transformed.x += sin(viento * .9 + position.x * .15 + position.z * .1) * .035 * alto;\n transformed.z += cos(viento * .7 + position.z * .15) * .025 * alto;'); }; return m; };
    const troncos = new THREE.Mesh(mergeGeometries(geoTroncos), toon(P.tronco)); troncos.castShadow = true;
    const copas = new THREE.Mesh(mergeGeometries(geoCopas), mecer(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon('#fff').gradientMap }))); copas.castShadow = true;
    const bordeM = new THREE.MeshBasicMaterial({ color: P.contorno, side: THREE.BackSide });
    escena.add(troncos, copas, new THREE.Mesh(mergeGeometries(bordeTroncos), bordeM), new THREE.Mesh(mergeGeometries(bordeCopas), mecer(new THREE.MeshBasicMaterial({ color: P.contorno, side: THREE.BackSide }))));
  }

  // ---------- Rocas con musgo ----------
  function roca(x, z, e = 1, sem = 1) {
    const r = azar(sem), g = new THREE.DodecahedronGeometry(e, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 1 + (ruido(p.getX(i) * 2 + sem, p.getZ(i) * 2) - .5) * .35; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * .7, p.getZ(i) * k); }
    g.computeVertexNormals();
    const m = pieza(g, r() > .5 ? P.roca : P.roca2, { borde: .04, recibe: true, flatShading: true });
    m.position.set(x, alturaEn(x, z) + e * .2, z); m.rotation.y = r() * 6; escena.add(m);
    if (e > .5) obstaculos.push({ x, z, r: e * .9 });
    return m;
  }
  [[-9, -27, 1.2], [6, -28, .8], [12, -9, .7], [-20, 0, 1.4], [-13, 12, .9], [4, 14, 1.1], [20, -14, 1.6], [-27, -6, .9], [15, 18, .7], [-2, 22, 1.3], [24, -4, .6]].forEach(([x, z, e], i) => roca(x, z, e, i + 3));
  {
    const g = new THREE.DodecahedronGeometry(1, 0), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 1 + (ruido(p.getX(i) * 2, p.getZ(i) * 2) - .5) * .4; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * .6, p.getZ(i) * k); }
    g.computeVertexNormals();
    const N = 60, piedras = new THREE.InstancedMesh(g, toon('#ffffff'), N), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < N; i++) {
      const a = rnd() * 6.28, d = 8 + rnd() * 42, x = Math.cos(a) * d, z = Math.sin(a) * d, s = .15 + rnd() * .3;
      e.set(0, rnd() * 6, 0); m.compose(new THREE.Vector3(x, alturaEn(x, z) + s * .15, z), q.setFromEuler(e), new THREE.Vector3(s, s, s));
      piedras.setMatrixAt(i, m); piedras.setColorAt(i, new THREE.Color(rnd() > .5 ? P.roca : P.roca2));
    }
    piedras.castShadow = true; escena.add(piedras);
  }

  // ---------- El estanque: agua con anillos que brillan, nenúfares y juncos ----------
  const agua = new THREE.Mesh(new THREE.CircleGeometry(6.6, 48).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    transparent: true, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { t: { value: 0 }, claro: { value: new THREE.Color(P.agua) }, hondo: { value: new THREE.Color(P.aguaHonda) } }]),
    vertexShader: '#include <fog_pars_vertex>\nvarying vec2 vP; void main(){ vP = position.xz; vec4 mvPosition = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n }',
    fragmentShader: `#include <fog_pars_fragment>
      uniform float t; uniform vec3 claro, hondo; varying vec2 vP;
      void main(){
        float d = length(vP) / 6.6;
        vec3 c = mix(claro, hondo, smoothstep(.15, .9, 1. - d) * .7);
        float anillos = step(.93, sin(length(vP - vec2(sin(t*.3)*2., cos(t*.2)*1.5)) * 3. - t * 1.6));
        float brillo = step(.97, sin(vP.x * 2.3 + t * .9) * sin(vP.y * 2.7 - t * .7));
        c += (anillos * .12 + brillo * .35) * vec3(1., .9, .8);
        c = mix(c, vec3(1.), smoothstep(.9, .97, d) * .55);
        gl_FragColor = vec4(c, .92);
        #include <fog_fragment>
      }`
  }));
  agua.position.set(SITIOS.estanque.x, -.62, SITIOS.estanque.z); escena.add(agua);
  animables.push((t) => { agua.material.uniforms.t.value = t; });
  obstaculos.push({ x: SITIOS.estanque.x, z: SITIOS.estanque.z, r: 5.9 });
  for (let i = 0; i < 6; i++) {
    const a = rnd() * 6.28, d = 1.5 + rnd() * 3.8, n = pieza(new THREE.CircleGeometry(.45 + rnd() * .25, 12, .4, 5.6).rotateX(-Math.PI / 2), '#58b05a', { sombra: false, side: THREE.DoubleSide });
    n.position.set(SITIOS.estanque.x + Math.cos(a) * d, -.58, SITIOS.estanque.z + Math.sin(a) * d); n.rotation.y = rnd() * 6; escena.add(n);
    if (i % 2) { const f = pieza(new THREE.IcosahedronGeometry(.13, 0), '#ffb3d4', { emissive: '#ff8fb8', emissiveIntensity: .25 }); f.position.copy(n.position).add(new THREE.Vector3(.1, .08, 0)); escena.add(f); }
  }
  {
    const tallos = [], puros = [];
    for (let i = 0; i < 26; i++) {
      const a = rnd() * 6.28, d = 6.2 + rnd() * 1.2, x = SITIOS.estanque.x + Math.cos(a) * d, z = SITIOS.estanque.z + Math.sin(a) * d, alto = 1.4 + rnd();
      const M = new THREE.Matrix4().makeRotationZ((rnd() - .5) * .3).setPosition(x, alturaEn(x, z) - .1, z);
      tallos.push(new THREE.CylinderGeometry(.03, .05, alto, 4).translate(0, alto / 2, 0).applyMatrix4(M));
      if (rnd() > .6) puros.push(new THREE.CapsuleGeometry(.07, .3, 3, 6).translate(0, alto - .1, 0).applyMatrix4(M));
    }
    escena.add(new THREE.Mesh(mergeGeometries(tallos), toon('#4f8f3a')));
    if (puros.length) escena.add(new THREE.Mesh(mergeGeometries(puros), toon('#7a4a2e')));
  }

  // ---------- La hoguera de la guardabosques, con troncos para sentarse ----------
  const fuego = new THREE.Group();
  {
    const h = SITIOS.hoguera; fuego.position.set(h.x, alturaEn(h.x, h.z), h.z); escena.add(fuego);
    for (let i = 0; i < 8; i++) { const p = pieza(new THREE.DodecahedronGeometry(.28, 0), P.roca2, { flatShading: true }); p.position.set(Math.cos(i / 8 * 6.28) * .9, .1, Math.sin(i / 8 * 6.28) * .9); fuego.add(p); }
    for (let i = 0; i < 3; i++) { const l = pieza(new THREE.CylinderGeometry(.12, .12, 1.3, 6), P.tronco); l.rotation.set(Math.PI / 2, 0, i * 2.1); l.position.y = .2; fuego.add(l); }
    const llamas = [];
    [['#ff5a2a', .55, 1.2], ['#ff9a2a', .42, .95], ['#ffe066', .26, .7]].forEach(([col, r, a], k) => {
      const f = new THREE.Mesh(new THREE.ConeGeometry(r, a, 7), toon(col, { emissive: col, emissiveIntensity: 1.6 }));
      f.position.y = .3 + a / 2; fuego.add(f); llamas.push(f);
    });
    const luz = new THREE.PointLight('#ff9a4a', 9, 14, 1.6); luz.position.y = 1.2; fuego.add(luz);
    for (const [ang, dist] of [[.6, 2.4], [2.3, 2.5], [4.2, 2.3]]) {
      const t = pieza(new THREE.CylinderGeometry(.3, .32, 1.6, 8), P.tronco, { borde: .03 }); t.rotation.set(0, -ang, Math.PI / 2);
      t.position.set(Math.cos(ang) * dist, .3, Math.sin(ang) * dist); fuego.add(t);
      obstaculos.push({ x: h.x + Math.cos(ang) * dist, z: h.z + Math.sin(ang) * dist, r: .7 });
    }
    obstaculos.push({ x: h.x, z: h.z, r: 1.2 });
    animables.push((t) => {
      llamas.forEach((f, k) => { const s = 1 + Math.sin(t * (9 + k * 3)) * .1 + Math.sin(t * 23 + k) * .05; f.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s)); f.rotation.y = t * (1 + k); });
      luz.intensity = 8 + Math.sin(t * 11) * 1.2 + Math.sin(t * 27) * .8;
    });
  }

  // ---------- Farolillos a lo largo del camino ----------
  const farolas = [];
  for (const i of [1, 3, 5, 7]) {
    const [ax, az] = CAMINO[i], [bx, bz] = CAMINO[i + 1], x = (ax + bx) / 2 + (i % 4 === 1 ? 2.2 : -2.2), z = (az + bz) / 2 + 1;
    const g = new THREE.Group(); g.position.set(x, alturaEn(x, z), z); escena.add(g);
    const palo = pieza(new THREE.CylinderGeometry(.07, .1, 2.6, 6).translate(0, 1.3, 0), '#4a3328', { borde: .03 }); palo.rotation.z = (i % 3 - 1) * .08; g.add(palo);
    const brazo = pieza(new THREE.BoxGeometry(.7, .08, .08), '#4a3328'); brazo.position.set(.3, 2.5, 0); g.add(brazo);
    const farol = new THREE.Mesh(new THREE.OctahedronGeometry(.22, 0), toon('#ffd27a', { emissive: '#ffb24a', emissiveIntensity: 2.2 })); farol.position.set(.6, 2.2, 0); g.add(farol);
    farolas.push(farol); obstaculos.push({ x, z, r: .35 });
  }
  animables.push((t) => farolas.forEach((f, k) => { f.rotation.z = Math.sin(t * 1.5 + k) * .15; }));

  // ---------- El cartel del cruce ----------
  {
    const g = new THREE.Group(), s = SITIOS.cartel; g.position.set(s.x, alturaEn(s.x, s.z), s.z); g.rotation.y = -.5; escena.add(g);
    g.add(pieza(new THREE.CylinderGeometry(.09, .12, 2.2, 6).translate(0, 1.1, 0), '#5a3c2e', { borde: .03 }));
    const tabla = (txt, y, rot, col) => {
      const tx = lienzo(256, 64, (x, w, h) => { x.fillStyle = col; x.fillRect(0, 0, w, h); x.fillStyle = '#3b2418'; x.font = '800 30px Nunito, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 2); });
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, .38, .06), [toon(col), toon(col), toon(col), toon(col), new THREE.MeshToonMaterial({ map: tx, gradientMap: toon('#fff').gradientMap }), new THREE.MeshToonMaterial({ map: tx, gradientMap: toon('#fff').gradientMap })]);
      m.position.set(.35 * Math.sign(rot || 1), y, 0); m.rotation.set(0, rot, (Math.random() - .5) * .1); m.castShadow = true; g.add(contorno(m, .03));
    };
    tabla('Cripta ➜', 1.8, 0, '#e8c48c'); tabla('⬅ Morrandar', 1.35, Math.PI, '#d9b07a');
    obstaculos.push({ x: s.x, z: s.z, r: .4 });
  }

  // ---------- La cripta: una colina con una puerta de piedra y runas que brillan ----------
  const cripta = new THREE.Group();
  const runas = [];
  let puerta;
  {
    const cc = SITIOS.colina, cp = SITIOS.cripta;
    const colina = pieza(new THREE.SphereGeometry(10, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), P.hierbaOscura, { recibe: true });
    colina.scale.set(1, .62, 1.05); colina.position.set(cc.x, alturaEn(cc.x, cc.z) - .4, cc.z); escena.add(colina);
    for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, d = 3 + rnd() * 6; roca(cc.x + Math.cos(a) * d, cc.z + Math.sin(a) * d, .3 + rnd() * .5, 300 + i).position.y += 2 + (1 - d / 10) * 3.5; }
    obstaculos.push({ x: cc.x, z: cc.z, r: 9.4 });
    cripta.position.set(cp.x, alturaEn(cp.x, cp.z), cp.z); cripta.rotation.y = -Math.PI / 2; escena.add(cripta);
    const piedra = '#8a8198', piedra2 = '#6f6680';
    for (const lado of [-1, 1]) {
      const pil = pieza(new THREE.BoxGeometry(.9, 4.2, .9), piedra, { borde: .04, flatShading: true }); pil.position.set(lado * 1.7, 2.1, 0); pil.rotation.z = lado * .04; cripta.add(pil);
      const cap = pieza(new THREE.BoxGeometry(1.2, .35, 1.2), piedra2, { borde: .03 }); cap.position.set(lado * 1.72, 4.3, 0); cripta.add(cap);
      const cal = pieza(new THREE.SphereGeometry(.32, 10, 8), P.hueso, { borde: .03 }); cal.scale.set(1, .9, 1.05); cal.position.set(lado * 1.72, 4.75, 0); cripta.add(cal);
      for (const ox of [-.11, .11]) { const o = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 6), toon('#ff6a3a', { emissive: '#ff4a1a', emissiveIntensity: 2 })); o.position.set(lado * 1.72 + ox, 4.8, .27); cripta.add(o); }
    }
    const arco = pieza(new THREE.TorusGeometry(1.75, .42, 8, 16, Math.PI), piedra, { borde: .04, flatShading: true }); arco.position.y = 4.15; cripta.add(arco);
    puerta = pieza(new THREE.PlaneGeometry(2.6, 4.2), '#15101c', { sombra: false, emissive: '#2a1145', emissiveIntensity: .6 });
    puerta.position.set(0, 2.1, -.2); cripta.add(puerta);
    const signos = ['ᚱ', 'ᚢ', 'ᚾ', 'ᚨ', 'ᛊ', 'ᚦ'];
    signos.forEach((sg, i) => {
      const tx = lienzo(64, 64, (x, w, h) => { x.fillStyle = '#d9b8ff'; x.font = '48px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(sg, w / 2, h / 2); });
      const r = new THREE.Mesh(new THREE.PlaneGeometry(.45, .45), new THREE.MeshBasicMaterial({ map: tx, transparent: true, color: '#c7a2ff', blending: THREE.AdditiveBlending, depthWrite: false }));
      const a = Math.PI * (i + .5) / signos.length; r.position.set(Math.cos(a) * 1.75, 4.15 + Math.sin(a) * 1.75, .45); cripta.add(r); runas.push(r);
    });
    for (let i = 0; i < 4; i++) { const e = pieza(new THREE.BoxGeometry(3.4 - i * .15, .18, .7), piedra2, { recibe: true }); e.position.set(0, .09 + i * .0, 1 + i * .55); e.position.y = .09; cripta.add(e); }
    for (const lado of [-1, 1]) {                                            // antorchas
      const a = new THREE.Group(); a.position.set(lado * 2.7, 0, .8); cripta.add(a);
      a.add(pieza(new THREE.CylinderGeometry(.06, .08, 2, 5).translate(0, 1, 0), '#3d2a20'));
      const f = new THREE.Mesh(new THREE.ConeGeometry(.2, .55, 6), toon('#b27aff', { emissive: '#9a5aff', emissiveIntensity: 2 })); f.position.y = 2.25; a.add(f); runas.push(f);
    }
    const luz = new THREE.PointLight('#a77bff', 5, 10, 1.8); luz.position.set(0, 2.5, 1.5); cripta.add(luz);
    animables.push((t) => {
      runas.forEach((r, i) => { r.material.opacity = .55 + Math.sin(t * 2 + i) * .35; if (r.geometry.type === 'ConeGeometry') r.scale.y = 1 + Math.sin(t * 13 + i) * .12; });
      luz.intensity = 4.5 + Math.sin(t * 3) * .8;
    });
  }

  // ---------- Morrandar: la tortuga gigante, con el pueblo encima, respirando ----------
  const tortuga = new THREE.Group();
  const morr = { cabeza: null, ojos: [], aspas: null, humos: [] };
  {
    const M = SITIOS.morrandar; tortuga.position.set(M.x, 0, M.z); tortuga.rotation.y = .25; escena.add(tortuga);
    const cuerpo = new THREE.Group(); tortuga.add(cuerpo);
    // caparazón con placas: color por celdas
    const gc = new THREE.SphereGeometry(34, 56, 24, 0, Math.PI * 2, 0, Math.PI / 2), pc = gc.attributes.position, cc = new Float32Array(pc.count * 3);
    const tA = new THREE.Color('#7d6a4a'), tB = new THREE.Color('#5f5038'), tBorde = new THREE.Color('#3f3527');
    for (let i = 0; i < pc.count; i++) {
      const x = pc.getX(i), y = pc.getY(i), z = pc.getZ(i), a = Math.atan2(z, x), e = Math.acos(Math.min(1, y / 34));
      const fa = a * 3 / Math.PI + (Math.floor(e * 3) % 2) * .5, fe = e * 3;
      const borde = Math.min(Math.abs(fa - Math.round(fa)), Math.abs(fe - Math.round(fe))) < .06;
      const col = borde ? tBorde : ((Math.floor(fa) + Math.floor(fe)) % 2 ? tA : tB);
      cc.set([col.r, col.g, col.b], i * 3);
    }
    gc.setAttribute('color', new THREE.BufferAttribute(cc, 3));
    const capa = new THREE.Mesh(gc, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon('#fff').gradientMap })); capa.scale.y = .62; capa.position.y = 13; capa.castShadow = false; cuerpo.add(contorno(capa, .25));
    const falda = pieza(new THREE.CylinderGeometry(34.5, 33, 4, 48), '#4a3f2e', { sombra: false }); falda.position.y = 12; cuerpo.add(falda);
    // la tierra del pueblo sobre el caparazón
    const prado = pieza(new THREE.CylinderGeometry(19, 23, 3, 32), P.hierba, { sombra: false }); prado.position.y = 33.2; cuerpo.add(prado);
    // casitas de colores con ventanas encendidas
    const tejados = ['#d9534f', '#4f7fd9', '#e0a03a', '#7a5ad9', '#3aa07a', '#d96aa0'];
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * Math.PI * 2 + .3, d = 7 + (i % 3) * 4, x = Math.cos(a) * d, z = Math.sin(a) * d, ca = new THREE.Group();
      const w = 2.6 + (i % 2), h = 2.4 + (i % 3) * .6;
      const pared = pieza(new THREE.BoxGeometry(w, h, w * .85), i % 2 ? '#f3e2c4' : '#e9d1b0', { sombra: false, borde: .06 }); pared.position.y = h / 2; ca.add(pared);
      const tej = pieza(new THREE.ConeGeometry(w * .85, 2.2, 4), tejados[i % tejados.length], { sombra: false, borde: .06 }); tej.position.y = h + 1.05; tej.rotation.y = Math.PI / 4; ca.add(tej);
      const ven = new THREE.Mesh(new THREE.PlaneGeometry(.6, .6), new THREE.MeshBasicMaterial({ color: '#ffcf6a' })); ven.position.set(0, h * .55, w * .43); ca.add(ven);
      if (i % 3 === 0) { const ch = pieza(new THREE.BoxGeometry(.5, 1.2, .5), '#8a6a5a', { sombra: false }); ch.position.set(w * .25, h + 1.4, 0); ca.add(ch); morr.humos.push(ch); }
      ca.position.set(x, 34.6, z); ca.rotation.y = -a + Math.PI / 2; cuerpo.add(ca);
    }
    // el árbol grande de la plaza y el molino
    const ag = arbol(0, 0, 2.2, 999, { suelto: true }); ag.position.set(0, 34.5, 0); cuerpo.add(ag);
    const molino = new THREE.Group(); molino.position.set(-14, 34.5, -6); cuerpo.add(molino);
    molino.add(pieza(new THREE.CylinderGeometry(1.4, 2, 7, 8).translate(0, 3.5, 0), '#efe2c8', { sombra: false, borde: .06 }));
    const tm = pieza(new THREE.ConeGeometry(2, 2.4, 8), '#c44a3a', { sombra: false, borde: .06 }); tm.position.y = 8.2; molino.add(tm);
    morr.aspas = new THREE.Group(); morr.aspas.position.set(0, 6.4, 2.1); molino.add(morr.aspas);
    for (let k = 0; k < 4; k++) { const a = pieza(new THREE.BoxGeometry(.5, 5, .1).translate(0, 2.5, 0), '#f6efe0', { sombra: false }); a.rotation.z = k * Math.PI / 2; morr.aspas.add(a); }
    // patas, cola y cabeza
    for (const [x, z] of [[18, 20], [-18, 20], [18, -20], [-18, -20]]) {
      const pata = pieza(new THREE.CylinderGeometry(5.5, 6.5, 14, 14), '#8fa36a', { sombra: false, borde: .2 }); pata.position.set(x, 6, z); cuerpo.add(pata);
      for (let u = -1; u <= 1; u++) { const una = pieza(new THREE.SphereGeometry(1.2, 8, 6), '#e8dcc0', { sombra: false }); una.position.set(x + u * 2.6, 1, z + Math.sign(z) * 5.5); cuerpo.add(una); }
    }
    const cola = pieza(new THREE.ConeGeometry(4, 12, 10), '#8fa36a', { sombra: false, borde: .2 }); cola.rotation.z = Math.PI / 2 + .3; cola.position.set(-38, 8, 0); cuerpo.add(cola);
    const cuello = pieza(new THREE.CylinderGeometry(5.5, 7, 16, 14), '#8fa36a', { sombra: false, borde: .2 }); cuello.rotation.z = -1.0; cuello.position.set(36, 16, 0); cuerpo.add(cuello);
    const cab = new THREE.Group(); cab.position.set(44, 22, 0); cuerpo.add(cab); morr.cabeza = cab;
    const craneo = pieza(new THREE.SphereGeometry(8, 24, 16), '#9bb070', { sombra: false, borde: .25 }); craneo.scale.set(1.25, .85, 1); cab.add(craneo);
    for (const s of [-1, 1]) {
      const ojo = pieza(new THREE.SphereGeometry(1.7, 12, 10), '#ffffff', { sombra: false }); ojo.position.set(5, 2.4, s * 5.6); cab.add(ojo);
      const pu = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: '#1c1420' })); pu.position.set(.7, .1, s * .9); ojo.add(pu); morr.ojos.push(ojo);
      const brillo = new THREE.Mesh(new THREE.SphereGeometry(.32, 6, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); brillo.position.set(1.2, .6, s * 1.1); ojo.add(brillo);
    }
    const boca = new THREE.Mesh(new THREE.TorusGeometry(3.2, .25, 6, 16, Math.PI * .8), new THREE.MeshBasicMaterial({ color: '#3a2a20' })); boca.position.set(8.5, -1.5, 0); boca.rotation.set(Math.PI / 2, 0, -Math.PI * .4 - Math.PI / 2); cab.add(boca);
    obstaculos.push({ x: M.x, z: M.z, r: 44 });
    // la pasarela de tablones que baja hasta el claro
    const desde = new THREE.Vector3(-6, 22.5, -66), hasta = SITIOS.llegada.clone().add(new THREE.Vector3(0, .15, 0)), largo = desde.distanceTo(hasta);
    const pasarela = new THREE.Group(); escena.add(pasarela);
    const nT = Math.floor(largo / .55), gT = new THREE.BoxGeometry(2.6, .14, .45), mT = new THREE.InstancedMesh(gT, toon('#9a6a48'), nT), mm = new THREE.Matrix4(), dir = hasta.clone().sub(desde).normalize();
    const giro = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    for (let i = 0; i < nT; i++) { const p = desde.clone().lerp(hasta, i / nT); p.y += Math.sin(i / nT * Math.PI) * -1.2; mm.compose(p, giro.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, (ruido(i, 3) - .5) * .06))), new THREE.Vector3(1, 1, 1)); mT.setMatrixAt(i, mm); mT.setColorAt(i, new THREE.Color(i % 3 ? '#a8774f' : '#8c5f40')); }
    mT.castShadow = true; mT.receiveShadow = true; pasarela.add(mT);
    for (let i = 0; i <= 8; i++) for (const s of [-1.35, 1.35]) {
      const p = desde.clone().lerp(hasta, i / 8); p.y += Math.sin(i / 8 * Math.PI) * -1.2; p.x += s;
      const poste = pieza(new THREE.CylinderGeometry(.08, .08, 1.2, 5), '#6e4a36'); poste.position.copy(p).add(new THREE.Vector3(0, .6, 0)); pasarela.add(poste);
    }
    obstaculos.push({ x: -6, z: -36, r: 1.5, pasarela: true });
    animables.push((t) => {
      cuerpo.scale.y = 1 + Math.sin(t * .5) * .006; cuerpo.position.y = Math.sin(t * .5) * .15;
      cab.rotation.y = Math.sin(t * .23) * .12; cab.rotation.z = Math.sin(t * .31) * .05;
      const parpadeo = (t % 6.5) < .14 ? .1 : 1; morr.ojos.forEach((o) => { o.scale.y = parpadeo; });
      morr.aspas.rotation.z = t * .7;
    });
  }

  // ---------- Luciérnagas que se encienden con el atardecer ----------
  {
    const N = movil ? 70 : 140, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3), base = [];
    for (let i = 0; i < N; i++) {
      const cerca = i % 3 === 0, a = rnd() * 6.28, d = cerca ? rnd() * 8 : 12 + rnd() * 30;
      const x = (cerca ? SITIOS.estanque.x : 0) + Math.cos(a) * d, z = (cerca ? SITIOS.estanque.z : 0) + Math.sin(a) * d;
      base.push([x, alturaEn(x, z) + .6 + rnd() * 2.2, z, rnd() * 6.28]); p.set(base[i].slice(0, 3), i * 3);
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const punto = lienzo(64, 64, (x, w) => { const gr = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,200,1)'); gr.addColorStop(.25, 'rgba(230,255,120,.8)'); gr.addColorStop(1, 'rgba(200,255,80,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, w); });
    const lu = new THREE.Points(g, new THREE.PointsMaterial({ size: .45, map: punto, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#f4ff9a' }));
    escena.add(lu);
    animables.push((t) => {
      for (let i = 0; i < N; i++) { const [x, y, z, f] = base[i]; p[i * 3] = x + Math.sin(t * .4 + f) * 1.2; p[i * 3 + 1] = y + Math.sin(t * .9 + f * 2) * .4; p[i * 3 + 2] = z + Math.cos(t * .35 + f) * 1.2; }
      g.attributes.position.needsUpdate = true; lu.material.opacity = .65 + Math.sin(t * 3) * .1;
    });
  }

  // ---------- Hojas que caen y pájaros que cruzan el cielo ----------
  {
    const N = movil ? 40 : 80, gh = new THREE.PlaneGeometry(.22, .14), hojas = new THREE.InstancedMesh(gh, toon('#e8913a', { side: THREE.DoubleSide }), N), d = [], m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), pp = new THREE.Vector3();
    const tonos = ['#e8913a', '#d9622f', '#f2c14a', '#9fbf4a'];
    for (let i = 0; i < N; i++) { d.push({ x: (rnd() - .5) * 70, y: rnd() * 12, z: (rnd() - .5) * 70, f: rnd() * 6, v: .4 + rnd() * .5 }); hojas.setColorAt(i, new THREE.Color(tonos[i % 4])); }
    escena.add(hojas);
    animables.push((t, dt) => {
      for (let i = 0; i < N; i++) {
        const h = d[i]; h.y -= h.v * dt; h.x += Math.sin(t + h.f) * dt * .8 + dt * .5;
        const suelo = alturaEn(h.x, h.z); if (h.y < suelo) { h.y = suelo + 10 + rnd() * 4; h.x = (rnd() - .5) * 70; h.z = (rnd() - .5) * 70; }
        e.set(t * 2 + h.f, t * 1.3 + h.f, Math.sin(t * 3 + h.f)); q.setFromEuler(e); hojas.setMatrixAt(i, m.compose(pp.set(h.x, h.y, h.z), q, s));
      }
      hojas.instanceMatrix.needsUpdate = true;
    });
    const bandada = new THREE.Group(); escena.add(bandada); const alas = [];
    for (let i = 0; i < 7; i++) {
      const p = new THREE.Group(); p.position.set((i % 2 ? 1 : -1) * Math.ceil(i / 2) * 2.2, 0, -Math.ceil(i / 2) * 1.8);
      for (const sd of [-1, 1]) { const a = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .35).translate(sd * .6, 0, 0), new THREE.MeshBasicMaterial({ color: '#3a2a4a', side: THREE.DoubleSide, fog: false })); p.add(a); alas.push([a, sd, i]); }
      bandada.add(p);
    }
    animables.push((t) => {
      const a = t * .05; bandada.position.set(Math.cos(a) * 120, 55 + Math.sin(t * .2) * 4, Math.sin(a) * 120 - 40); bandada.rotation.y = -a;
      for (const [w, sd, i] of alas) w.rotation.z = sd * Math.sin(t * 6 + i) * .6;
    });
  }

  return {
    alturaEn, obstaculos, SITIOS, puerta, cripta,
    actualizar(t, dt) { for (const f of animables) f(t, dt); },
    // Abrir la cripta: la puerta deja salir luz morada
    // El círculo de combate aplasta la hierba de debajo (k de 0 a 1)
    aplastarHierba(x, z, r, k) { aplastar.value.set(x, z, r, k); },
    abrirCripta() { puerta.material = toon('#5a2a9a', { emissive: '#b07aff', emissiveIntensity: 1.6 }); }
  };
}
