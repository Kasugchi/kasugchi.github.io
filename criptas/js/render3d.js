// =============================================================
//  VISTA 3D: el tablero como si estuviera sobre la mesa
//  - El suelo es una textura con lo que pinta la vista 2D (baldosas,
//    escalera, trampas, niebla, casillas iluminadas, destellos).
//  - Paredes, puertas, muebles, rocas y fichas se levantan en relieve.
//  - Cámara inclinada: arrastrar mueve, pellizcar/rueda acerca,
//    dos dedos (o botón derecho) giran.
//  Usa three.js (licencia MIT), copiado en js/vendor.
// =============================================================
import * as THREE from './vendor/three.module.min.js';
import * as D from './datos.js';
import * as T from './tablero.js';
import { TS, dibujarMueble, dibujarFicha, dibujarRoca } from './render.js';
import { crearMiniatura, PLASTICO } from './miniaturas.js';
import { spriteDe } from './sprites.js';
import { crearMueble, crearPuerta, frenteMueble } from './muebles3d.js';

const ESCALA_SUELO = 0.75; // resolución de la textura del suelo
const ALTO_PARED = 0.26; // muros bajos, como los bordes del tablero: dejan ver las figuras
const GROSOR = 0.16;
const ALTURAS = { mesa: 0.42, cofre: 0.38, estanteria: 0.95, trono: 0.85, sarcofago: 0.5, chimenea: 0.75, armero: 0.7, alquimista: 0.45, potro: 0.4, caldero: 0.4, altar: 0.5 };
const COLOR_LADO = { mesa: '#4e321b', cofre: '#5a3418', estanteria: '#3a2716', trono: '#5a1712', sarcofago: '#5e5a52', chimenea: '#3d241c', armero: '#46301c', alquimista: '#4a3420', potro: '#3e2a1a', caldero: '#1b1715', altar: '#6a645a' };

const hex = (h) => new THREE.Color(h);

export class Escena3D {
  constructor(zona, tablero) {
    this.tab = tablero;
    this.zona = zona;
    // Lienzo WebGL encima del 2D.
    this.cv = document.createElement('canvas');
    this.cv.className = 'lienzo3d';
    zona.prepend(this.cv);
    this.render = new THREE.WebGLRenderer({ canvas: this.cv, antialias: true });
    this.render.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.render.shadowMap.enabled = true;
    this.render.shadowMap.type = THREE.PCFSoftShadowMap;
    this.render.outputColorSpace = THREE.SRGBColorSpace;

    this.escena = new THREE.Scene();
    this.escena.background = hex('#120c08');
    // Niebla: lo lejano se pierde en la oscuridad de la mazmorra (se ajusta a la distancia de la cámara).
    this.escena.fog = new THREE.Fog(0x120c08, 20, 60);
    zona.classList.add('con3d');
    this.camara = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

    // Luces: ambiente cálida + un "foco" de taberna que da sombras.
    this.escena.add(new THREE.HemisphereLight(0xffe8cc, 0x1a120c, 0.62));
    const sol = new THREE.DirectionalLight(0xffd8a8, 1.05);
    sol.position.set(4, 22, 6);
    sol.target.position.set(D.ANCHO / 2, 0, D.ALTO / 2);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    Object.assign(sol.shadow.camera, { left: -18, right: 18, top: 15, bottom: -15, near: 1, far: 50 });
    sol.shadow.bias = -0.0008;
    sol.shadow.normalBias = 0.03; // sin rayas de sombra sobre las paredes y las figuras
    this.escena.add(sol, sol.target);
    // Luz de relleno desde el lado contrario, sin sombras: al girar la cámara, las caras
    // que no ven el foco ya no se quedan negras.
    const relleno = new THREE.DirectionalLight(0xd8c8ff, 0.45);
    relleno.position.set(D.ANCHO + 6, 14, D.ALTO + 8);
    relleno.target.position.set(D.ANCHO / 2, 0, D.ALTO / 2);
    this.escena.add(relleno, relleno.target);
    this.antorcha = new THREE.PointLight(0xff9a40, 2.2, 6, 1.4);
    this.antorcha.position.y = 1.4;
    this.escena.add(this.antorcha);
    // Antorchas de las salas: unas pocas luces que se reparten entre las más cercanas a la cámara.
    this.luces = Array.from({ length: 6 }, () => { const l = new THREE.PointLight(0xff8030, 0, 5.5, 1.2); this.escena.add(l); return l; });
    this.gAntorchas = new THREE.Group(); this.escena.add(this.gAntorchas);
    this.antorchas = [];
    // Partículas (chispas, polvo, brasas, magia): un solo objeto con hasta 500 puntos.
    const geoP = new THREE.BufferGeometry();
    geoP.setAttribute('position', new THREE.BufferAttribute(new Float32Array(500 * 3), 3));
    geoP.setAttribute('color', new THREE.BufferAttribute(new Float32Array(500 * 3), 3));
    const disco = document.createElement('canvas'); disco.width = disco.height = 32;
    { const gd = disco.getContext('2d'), gr = gd.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); gd.fillStyle = gr; gd.fillRect(0, 0, 32, 32); }
    this.puntos = new THREE.Points(geoP, new THREE.PointsMaterial({ size: 0.3, map: new THREE.CanvasTexture(disco), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.puntos.frustumCulled = false;
    this.escena.add(this.puntos);

    // Mesa y canto del tablero.
    const mesa = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.95 }));
    mesa.rotation.x = -Math.PI / 2; mesa.position.set(D.ANCHO / 2, -0.32, D.ALTO / 2); mesa.receiveShadow = true;
    this.escena.add(mesa);
    const canto = new THREE.Mesh(new THREE.BoxGeometry(D.ANCHO + 0.6, 0.3, D.ALTO + 0.6), new THREE.MeshStandardMaterial({ color: 0x2b211a, roughness: 0.8 }));
    canto.position.set(D.ANCHO / 2, -0.16, D.ALTO / 2); canto.castShadow = true; canto.receiveShadow = true;
    this.escena.add(canto);

    // Suelo: textura con lo que pinta la vista 2D.
    this.lienzoSuelo = document.createElement('canvas');
    this.lienzoSuelo.width = Math.round(D.ANCHO * TS * ESCALA_SUELO);
    this.lienzoSuelo.height = Math.round(D.ALTO * TS * ESCALA_SUELO);
    this.gSuelo = this.lienzoSuelo.getContext('2d');
    this.texSuelo = new THREE.CanvasTexture(this.lienzoSuelo);
    this.texSuelo.colorSpace = THREE.SRGBColorSpace;
    this.texSuelo.anisotropy = this.render.capabilities.getMaxAnisotropy();
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(D.ANCHO, D.ALTO), new THREE.MeshStandardMaterial({ map: this.texSuelo, roughness: 0.92 }));
    suelo.rotation.x = -Math.PI / 2; suelo.position.set(D.ANCHO / 2, 0, D.ALTO / 2); suelo.receiveShadow = true;
    this.suelo = suelo;
    this.escena.add(suelo);

    // Grupos que se rehacen al cambiar el estado.
    this.gParedes = new THREE.Group(); this.gPuertas = new THREE.Group(); this.gMuebles = new THREE.Group(); this.gFichas = new THREE.Group(); this.gTextos = new THREE.Group();
    this.escena.add(this.gParedes, this.gPuertas, this.gMuebles, this.gFichas, this.gTextos);
    this.claves = {};
    this.fichas = new Map(); // id -> grupo
    this.texturas = new Map();

    // Cámara: objetivo en el tablero, distancia, giro e inclinación.
    this.cam = { x: D.ANCHO / 2, z: D.ALTO / 2, d: 26, giro: 0, incl: 0.95 };
    this.objetivo = null;
    this.rayo = new THREE.Raycaster();
    this.instalarEntrada();
    this.ro = new ResizeObserver(() => this.ajustar());
    this.ro.observe(zona);
    this.ajustar();
    this.cuadro = 0;
  }

  destruir() {
    this.zona.classList.remove('con3d');
    this.ro.disconnect();
    this.render.dispose();
    this.cv.remove();
  }

  ajustar() {
    const r = this.zona.getBoundingClientRect();
    this.render.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    this.camara.aspect = Math.max(1, r.width) / Math.max(1, r.height);
    this.camara.updateProjectionMatrix();
    if (!this.colocada && r.width > 0) {
      // En vertical (móvil) el tablero se gira para aprovechar la pantalla
      // y la cámara empieza cerca de los héroes.
      if (this.camara.aspect < 0.8) this.cam.giro = Math.PI / 2;
      this.verTodo(true);
      const e = this.tab.estado, h = e?.turno && e.heroes[e.turno.heroe];
      if (r.width < 700 && h) Object.assign(this.cam, { x: h.x + 0.5, z: h.y + 0.5, d: 12 });
      this.colocada = true;
    }
  }

  // ---------- cámara ----------
  distanciaTodo() {
    const aspecto = this.camara.aspect || 1;
    // Si la cámara está girada de lado, el tablero se ve "de pie".
    const ladeado = Math.abs(Math.sin(this.cam.giro)) > 0.7;
    const [an, al] = ladeado ? [D.ALTO, D.ANCHO] : [D.ANCHO, D.ALTO];
    const ancho = Math.max(an / aspecto, al * 1.15);
    return ancho * 1.05 / (2 * Math.tan((this.camara.fov * Math.PI) / 360));
  }
  pantallaDe(x, y) {
    const v = new THREE.Vector3(x + 0.5, 1.15, y + 0.5).project(this.camara);
    const r = this.cv.getBoundingClientRect();
    return [((v.x + 1) / 2) * r.width, ((1 - v.y) / 2) * r.height];
  }
  verTodo(ya) {
    const o = { x: D.ANCHO / 2, z: D.ALTO / 2, d: this.distanciaTodo() };
    if (ya) Object.assign(this.cam, o); else this.objetivo = o;
  }
  // Centrar en una casilla. Si se ve todo el tablero, no se mueve (solo con zoom pedido);
  // si la casilla ya está cerca del centro de la pantalla, tampoco.
  centrarEn(x, y, zoom) {
    if (!zoom && this.estaLejos()) return;
    if (!zoom) {
      const [px, py] = this.pantallaDe(x, y), r = this.cv.getBoundingClientRect();
      if (px > r.width * 0.25 && px < r.width * 0.75 && py > r.height * 0.25 && py < r.height * 0.75) return;
    }
    this.objetivo = { x: x + 0.5, z: y + 0.5, d: zoom ? Math.min(this.cam.d, 11) : this.cam.d };
  }
  // Cuánto tablero se ve alrededor del punto al que mira la cámara (en casillas, por eje del mundo).
  alcanceVista(d = this.cam.d) {
    const t = Math.tan((this.camara.fov * Math.PI) / 360);
    const ancho = d * t * (this.camara.aspect || 1), fondo = (d * t) / Math.max(0.4, Math.sin(this.cam.incl));
    const cg = Math.abs(Math.cos(this.cam.giro)), sg = Math.abs(Math.sin(this.cam.giro));
    return { ex: cg * ancho + sg * fondo, ez: sg * ancho + cg * fondo };
  }
  estaLejos() { return this.cam.d > this.distanciaTodo() * 0.9; }
  girar(rad) { this.objetivo = { ...(this.objetivo || {}), giro: this.cam.giro + rad }; }
  colocarCamara(t) {
    if (this.objetivo) {
      const o = this.objetivo, k = 0.12;
      let fin = true;
      for (const c of ['x', 'z', 'd', 'giro']) {
        if (o[c] === undefined) continue;
        this.cam[c] += (o[c] - this.cam[c]) * k;
        if (Math.abs(o[c] - this.cam[c]) > 0.01) fin = false;
      }
      if (fin) this.objetivo = null;
    }
    const c = this.cam;
    c.d = Math.max(5, Math.min(this.distanciaTodo() * 1.15, c.d));
    // Que la cámara no se vaya fuera del tablero: si cabe entero, al centro; si no, sin pasar de los bordes.
    const { ex, ez } = this.alcanceVista(c.d), m = 1;
    const sujetar = (v, alcance, tam) => (alcance * 2 >= tam + m * 2 ? tam / 2 : Math.max(alcance - m, Math.min(tam - alcance + m, v)));
    c.x = sujetar(c.x, ex, D.ANCHO);
    c.z = sujetar(c.z, ez, D.ALTO);
    let sx = 0, sz = 0;
    const dt = t - (this.tab.temblor || 0);
    const ft = this.tab.fuerzaTemblor || 1;
    if (dt < 350) { sx = Math.sin(dt / 18) * 0.15 * ft * (1 - dt / 350); sz = Math.cos(dt / 23) * 0.1 * ft * (1 - dt / 350); }
    this.escena.fog.near = c.d * 0.85; this.escena.fog.far = c.d * 2.1;
    const h = Math.sin(c.incl) * c.d, horiz = Math.cos(c.incl) * c.d;
    this.camara.position.set(c.x + sx + Math.sin(c.giro) * horiz, h, c.z + sz + Math.cos(c.giro) * horiz);
    this.camara.lookAt(c.x + sx, 0, c.z + sz);
  }

  // ---------- entrada: arrastrar, pellizcar, girar, tocar ----------
  instalarEntrada() {
    const cv = this.cv;
    const punteros = new Map();
    let inicio = null, movido = false, gesto = null;
    const enPlano = (px, py) => {
      const r = cv.getBoundingClientRect();
      const v = new THREE.Vector2(((px - r.left) / r.width) * 2 - 1, -((py - r.top) / r.height) * 2 + 1);
      this.rayo.setFromCamera(v, this.camara);
      const p = new THREE.Vector3();
      return this.rayo.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p) ? p : null;
    };
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.objetivo = null;
      movido = false;
      if (punteros.size === 1) inicio = { x: e.clientX, y: e.clientY, p: enPlano(e.clientX, e.clientY), cam: { ...this.cam }, girar: e.button === 2 };
      if (punteros.size === 2) {
        const [a, b] = [...punteros.values()];
        gesto = { d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), cam: { ...this.cam } };
        movido = true;
      }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!punteros.has(e.pointerId)) return;
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (gesto && punteros.size >= 2) {
        const [a, b] = [...punteros.values()];
        this.cam.d = gesto.cam.d * gesto.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y));
        this.cam.giro = gesto.cam.giro - (Math.atan2(b.y - a.y, b.x - a.x) - gesto.ang);
      } else if (inicio) {
        const dx = e.clientX - inicio.x, dy = e.clientY - inicio.y;
        if (Math.hypot(dx, dy) > 8) movido = true;
        if (!movido) return;
        if (inicio.girar) { this.cam.giro = inicio.cam.giro - dx * 0.008; this.cam.incl = Math.max(0.55, Math.min(1.45, inicio.cam.incl + dy * 0.004)); return; }
        // Arrastrar el tablero: el punto tocado sigue al dedo.
        Object.assign(this.cam, { x: inicio.cam.x, z: inicio.cam.z });
        this.colocarCamara(0);
        const p = enPlano(e.clientX, e.clientY);
        if (p && inicio.p) { this.cam.x = inicio.cam.x - (p.x - inicio.p.x); this.cam.z = inicio.cam.z - (p.z - inicio.p.z); }
      }
    });
    const fin = (e) => {
      if (!punteros.has(e.pointerId)) return;
      punteros.delete(e.pointerId);
      if (punteros.size < 2) gesto = null;
      if (punteros.size === 0) {
        if (!movido && inicio) this.tocar(e.clientX, e.clientY);
        inicio = null;
      }
    };
    cv.addEventListener('pointerup', fin);
    cv.addEventListener('pointercancel', fin);
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.objetivo = null;
      this.cam.d *= e.deltaY < 0 ? 0.9 : 1.1;
    }, { passive: false });
  }

  tocar(px, py) {
    const r = this.cv.getBoundingClientRect();
    const v = new THREE.Vector2(((px - r.left) / r.width) * 2 - 1, -((py - r.top) / r.height) * 2 + 1);
    this.rayo.setFromCamera(v, this.camara);
    // Primero las fichas (están de pie y tapan la casilla de detrás).
    const golpe = this.rayo.intersectObjects(this.gFichas.children, true)[0];
    if (golpe) {
      let o = golpe.object;
      while (o && !o.userData.casilla) o = o.parent;
      if (o) return this.tab.alTocar(...o.userData.casilla());
    }
    const s = this.rayo.intersectObject(this.suelo)[0];
    if (!s) return;
    const x = Math.floor(s.point.x), y = Math.floor(s.point.z);
    if (T.dentro(x, y)) this.tab.alTocar(x, y);
  }

  // ---------- construcción ----------
  // Paredes: un bloque por cada borde entre regiones distintas sin puerta visible.
  construirParedes(e) {
    const vis = (x, y) => !!e.revelado[T.clave(x, y)];
    const huecos = new Set();
    // Solo se abre hueco para las puertas que ya se han visto: si no, la pared delataría dónde están.
    for (const p of e.puertas) if ((!p.secreta || p.descubierta) && (vis(...p.a) || vis(...p.b))) huecos.add(T.claveBorde(p.a, p.b));
    for (const w of e.muros || []) if (w.roto) huecos.add(T.claveBorde(w.a, w.b));
    const tramos = [];
    for (let y = 0; y < D.ALTO; y++) for (let x = 0; x < D.ANCHO; x++) {
      if (x + 1 < D.ANCHO && T.region(x, y) !== T.region(x + 1, y) && !huecos.has(T.claveBorde([x, y], [x + 1, y]))) tramos.push({ x: x + 1, z: y + 0.5, vert: true, vis: vis(x, y) || vis(x + 1, y) });
      if (y + 1 < D.ALTO && T.region(x, y) !== T.region(x, y + 1) && !huecos.has(T.claveBorde([x, y], [x, y + 1]))) tramos.push({ x: x + 0.5, z: y + 1, vert: false, vis: vis(x, y) || vis(x, y + 1) });
    }
    // Borde exterior.
    for (let x = 0; x < D.ANCHO; x++) { tramos.push({ x: x + 0.5, z: 0, vert: false, vis: vis(x, 0) }); tramos.push({ x: x + 0.5, z: D.ALTO, vert: false, vis: vis(x, D.ALTO - 1) }); }
    for (let y = 0; y < D.ALTO; y++) { tramos.push({ x: 0, z: y + 0.5, vert: true, vis: vis(0, y) }); tramos.push({ x: D.ANCHO, z: y + 0.5, vert: true, vis: vis(D.ANCHO - 1, y) }); }

    this.gParedes.clear();
    const geo = new THREE.BoxGeometry(1 + GROSOR, ALTO_PARED, GROSOR);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
    const malla = new THREE.InstancedMesh(geo, mat, tramos.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), giro = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    const claro = hex({ cuevas: '#d8c6a6', catacumbas: '#c8ccd6', fortaleza: '#cfaaa2', abismo: '#bcb0d4' }[e.mision?.zona] || '#e6e0d2'), oscuro = hex('#4a423a');
    tramos.forEach((p, i) => {
      m4.compose(new THREE.Vector3(p.x, ALTO_PARED / 2, p.z), p.vert ? giro : q, new THREE.Vector3(1, 1, 1));
      malla.setMatrixAt(i, m4);
      malla.setColorAt(i, p.vis ? claro : oscuro);
    });
    malla.castShadow = true; malla.receiveShadow = true;
    this.gParedes.add(malla);
  }

  construirPuertas(e) {
    this.gPuertas.clear();
    const vis = (c) => !!e.revelado[T.clave(c[0], c[1])];
    for (const p of e.puertas) {
      if (p.secreta && !p.descubierta) continue;
      if (!vis(p.a) && !vis(p.b)) continue;
      const vert = p.a[1] === p.b[1]; // borde vertical (vecinos en x)
      const g = crearPuerta(THREE, p);
      g.position.set(vert ? Math.max(p.a[0], p.b[0]) : p.a[0] + 0.5, 0, vert ? p.a[1] + 0.5 : Math.max(p.a[1], p.b[1]));
      if (vert) g.rotation.y = Math.PI / 2;
      this.gPuertas.add(g);
    }
  }

  construirMuebles(e) {
    this.gMuebles.clear();
    const vis = (x, y) => !!e.revelado[T.clave(x, y)];
    for (const u of e.muebles) {
      if (!vis(u.x, u.y)) continue;
      this.gMuebles.add(crearMueble(THREE, u, frenteMueble(u, T.region)));
    }
    // Rocas y derrumbes: un montón de piedras que tapa la casilla.
    const roca = new THREE.MeshStandardMaterial({ color: 0x8a8174, roughness: 1, flatShading: true });
    const rocaOsc = new THREE.MeshStandardMaterial({ color: 0x5e574d, roughness: 1, flatShading: true });
    for (const k of Object.keys(e.rocas)) {
      const [x, y] = k.split(',').map(Number);
      if (!vis(x, y)) continue;
      let n = x * 31 + y * 17;
      const azar = () => { n = (n * 1103515245 + 12345) & 0x7fffffff; return n / 0x7fffffff; };
      // Pedrusco grande en el centro
      const grande = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), roca);
      grande.scale.set(1, 0.95, 1); grande.position.set(x + 0.45 + azar() * 0.1, 0.3, y + 0.45 + azar() * 0.1);
      grande.rotation.set(azar() * 3, azar() * 3, azar() * 3); grande.castShadow = true; grande.receiveShadow = true;
      this.gMuebles.add(grande);
      // Piedras medianas y cascotes alrededor
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + azar() * 0.6;
        const d = 0.22 + azar() * 0.18;
        const r = i < 4 ? 0.16 + azar() * 0.07 : 0.06 + azar() * 0.05;
        const piedra = new THREE.Mesh(i % 3 ? new THREE.DodecahedronGeometry(r, 0) : new THREE.IcosahedronGeometry(r, 0), i % 2 ? roca : rocaOsc);
        piedra.position.set(x + 0.5 + Math.cos(a) * d, r * 0.7 + (i < 4 ? 0.05 : 0), y + 0.5 + Math.sin(a) * d);
        piedra.rotation.set(azar() * 3, azar() * 3, azar() * 3); piedra.castShadow = true;
        this.gMuebles.add(piedra);
      }
    }
  }

  // Ficha de pie: peana de color y una lámina con el dibujo de la ficha 2D.
  texturaFicha(f, esHeroe) {
    const def = f.id === 'cargador' ? D.CARGADOR : esHeroe ? D.HEROES[f.tipo] : D.MONSTRUOS[f.tipo];
    const clave = (f.icono || def.icono) + '|' + def.color + '|' + (f.jefe ? 1 : 0) + '|' + esHeroe;
    if (this.texturas.has(clave)) return this.texturas.get(clave);
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.scale(2, 2);
    g.translate(-TS * 0 , 0);
    dibujarFicha(g, { ...f, efectos: {}, cuerpoMax: 1 }, 0, 0, esHeroe, 0, { alfa: 1 });
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    this.texturas.set(clave, tex);
    return tex;
  }

  crearFicha(f, esHeroe) {
    const def = f.id === 'cargador' ? D.CARGADOR : esHeroe ? D.HEROES[f.tipo] : D.MONSTRUOS[f.tipo];
    const g = new THREE.Group();
    const color = hex(def.color);
    const modo = this.tab.modoFiguras || 'auto';
    const plastico = modo === 'plastico';
    const sprite = modo === 'auto' ? spriteDe(f) : null;
    // Peana cuadrada; en plástico, del mismo color que la figura.
    const colorPeana = plastico ? (PLASTICO[f.tipo] ?? 0x8a8a8a) : (esHeroe ? 0xc9a24a : f.jefe ? 0x8e1d16 : 0x2a211d);
    const peana = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.07, 0.62), new THREE.MeshStandardMaterial({ color: colorPeana, roughness: 0.4 }));
    peana.position.y = 0.04; peana.castShadow = true; peana.receiveShadow = true; g.add(peana);
    if (!plastico) { const borde = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.03, 0.66), new THREE.MeshStandardMaterial({ color, roughness: 0.5 })); borde.position.y = 0.015; g.add(borde); }
    // Miniatura modelada (ver miniaturas.js).
    const mini = sprite ? this.figuraSprite(sprite, f.jefe) : crearMiniatura(THREE, f.tipo, { fem: f.fem, jefe: f.jefe, plastico });
    mini.position.y = 0.08;
    g.add(mini);
    g.userData.mini = mini;
    // Anillo del turno.
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffd36a }));
    anillo.rotation.x = Math.PI / 2; anillo.position.y = 0.03; anillo.visible = false; g.add(anillo);
    g.userData.anillo = anillo;
    // Materiales propios de cada ficha: las miniaturas comparten materiales, y al hacer
    // transparente una (al aparecer o al morir) se volvían transparentes todas las del mismo tipo.
    g.traverse((o) => { if (o.material && !Array.isArray(o.material)) o.material = o.material.clone(); });
    g.userData.alfa = 1;
    this.gFichas.add(g);
    return g;
  }

  actualizarFichas(t) {
    const vistos = new Set();
    for (const x of this.tab.figurasVisibles()) {
      const f = x.f;
      vistos.add(f.id);
      let g = this.fichas.get(f.id);
      if (!g) { g = this.crearFicha(f, x.esHeroe); this.fichas.set(f.id, g); }
      // Saltito al andar: la figura se levanta a mitad de cada casilla.
      const entre = Math.max(Math.abs(x.x - Math.round(x.x)), Math.abs(x.y - Math.round(x.y)));
      const salto = x.golpe || x.caida ? 0 : Math.sin(Math.min(0.5, entre) * Math.PI) * 0.16;
      g.position.set(x.x + 0.5, salto, x.y + 0.5);
      g.userData.casilla = () => [Math.round(x.x), Math.round(x.y)];
      // Golpe: se enciende de rojo un instante.
      const rojo = Math.min(1, x.golpe || 0);
      if (rojo !== g.userData.rojo) {
        g.userData.rojo = rojo;
        g.traverse((o) => { const mt = o.material; if (!mt || Array.isArray(mt) || !mt.emissive) return; mt.userData.emi ||= mt.emissive.clone(); mt.emissive.copy(mt.userData.emi).lerp(new THREE.Color(0xff2a10), rojo * 0.85); });
      }
      // La figura gira hacia la cámara (solo en horizontal).
      g.userData.mini.rotation.y = Math.atan2(this.camara.position.x - g.position.x, this.camara.position.z - g.position.z);
      g.userData.anillo.visible = !!x.activo;
      if (x.activo) g.userData.anillo.scale.setScalar(1 + Math.sin(t / 220) * 0.06);
      // Al morir, la ficha cae de lado (animada).
      g.rotation.z = x.caida ? (Math.PI / 2.4) * (1 - Math.pow(1 - x.caida, 3)) : !f.vivo ? Math.PI / 2.4 : 0;
      const alfa = x.alfa ?? 1;
      if (alfa !== g.userData.alfa) {
        g.userData.alfa = alfa;
        const trans = alfa < 1;
        g.traverse((o) => { if (o.material && !Array.isArray(o.material)) { if (o.material.transparent !== trans) { o.material.transparent = trans; o.material.needsUpdate = true; } o.material.opacity = alfa; o.material.depthWrite = !trans; } });
      }
    }
    for (const [id, g] of this.fichas) if (!vistos.has(id)) { this.gFichas.remove(g); this.fichas.delete(id); }
    // La antorcha sigue al héroe del turno.
    const e = this.tab.estado;
    const h = e.turno && e.heroes[e.turno.heroe];
    if (h) {
      const [hx, hy] = this.tab.vista.pos[h.id] || [h.x, h.y];
      this.antorcha.position.set(hx + 0.5, 1.4, hy + 0.5);
      this.antorcha.intensity = 2.4 + Math.sin(t / 90) * 0.3 + Math.sin(t / 31) * 0.15;
    }
  }

  // Muros frágiles que brillan mientras el mago tiene la trompa en la mano.
  actualizarBrillo(e, t) {
    const ids = this.tab.resaltes.muros || [];
    const clave = ids.join(',');
    if (clave !== this.claves.brillo) {
      this.claves.brillo = clave;
      if (this.gBrillo) this.escena.remove(this.gBrillo);
      this.gBrillo = new THREE.Group();
      this.matBrillo ||= new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, depthWrite: false });
      for (const id of ids) {
        const w = (e.muros || []).find((x) => x.id === id);
        if (!w) continue;
        const vert = w.a[0] !== w.b[0];
        const caja = new THREE.Mesh(new THREE.BoxGeometry(vert ? GROSOR + 0.06 : 1.02, ALTO_PARED + 0.06, vert ? 1.02 : GROSOR + 0.06), this.matBrillo);
        caja.position.set(vert ? Math.max(w.a[0], w.b[0]) : w.a[0] + 0.5, ALTO_PARED / 2, vert ? w.a[1] + 0.5 : Math.max(w.a[1], w.b[1]));
        this.gBrillo.add(caja);
      }
      this.escena.add(this.gBrillo);
    }
    if (this.matBrillo) this.matBrillo.opacity = 0.45 + Math.sin(t / 220) * 0.25;
  }

  // Ilustración de pie sobre la peana, como una figura de cartón recortada.
  figuraSprite(img, jefe) {
    this.texSprites ||= new Map();
    let tex = this.texSprites.get(img.src);
    if (!tex) { tex = new THREE.Texture(img); tex.needsUpdate = true; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; this.texSprites.set(img.src, tex); }
    const alto = jefe ? 1.35 : 1.12;
    const ancho = alto * (img.naturalWidth / img.naturalHeight);
    const geo = new THREE.PlaneGeometry(ancho, alto); geo.translate(0, alto / 2, 0);
    const lamina = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.75, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.55 }));
    lamina.castShadow = true;
    lamina.rotation.x = -0.28; // un poco inclinada hacia la cámara, que mira desde arriba
    lamina.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    const g = new THREE.Group(); g.add(lamina);
    return g;
  }

  // Volver a montar las figuras (al cambiar entre plástico y pintadas).
  rehacerFichas() { for (const g of this.fichas.values()) this.gFichas.remove(g); this.fichas.clear(); }

  // Números de daño flotando en el aire.
  actualizarTextos() {
    this.gTextos.clear();
    const ahora = performance.now();
    for (const x of this.tab.textos) {
      const k = (ahora - x.t0) / 1300;
      if (k >= 1) continue;
      const c = document.createElement('canvas'); c.width = 128; c.height = 64;
      const g = c.getContext('2d');
      g.font = '700 46px "Grenze Gotisch", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 8; g.strokeStyle = '#140d09'; g.strokeText(x.txt, 64, 32); g.fillStyle = x.color; g.fillText(x.txt, 64, 32);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 1 - k * k, depthTest: false }));
      s.scale.set(1.1, 0.55, 1);
      s.position.set(x.x + 0.5, 1.7 + k * 0.8, x.y + 0.5);
      this.gTextos.add(s);
    }
  }

  // Una antorcha en una esquina de cada sala descubierta (siempre la misma para cada sala).
  construirAntorchas(e) {
    this.gAntorchas.clear();
    this.antorchas = [];
    const cajas = {};
    for (const k of Object.keys(e.revelado)) {
      const [x, y] = k.split(',').map(Number);
      const r = T.region(x, y);
      if (!r || r === '.') continue;
      const c = (cajas[r] ||= { x0: x, y0: y, x1: x, y1: y });
      c.x0 = Math.min(c.x0, x); c.y0 = Math.min(c.y0, y); c.x1 = Math.max(c.x1, x); c.y1 = Math.max(c.y1, y);
    }
    this.matLlama ||= new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    this.matPalo ||= new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.9 });
    this.matSoporte ||= new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5, metalness: 0.6 });
    for (const [r, c] of Object.entries(cajas)) {
      // Esquina según el nombre de la sala, para que no estén todas en el mismo sitio.
      const n = r.charCodeAt(0);
      const esq = [[c.x0 + 0.14, c.y0 + 0.14], [c.x1 + 0.86, c.y0 + 0.14], [c.x0 + 0.14, c.y1 + 0.86], [c.x1 + 0.86, c.y1 + 0.86]][n % 4];
      const g = new THREE.Group();
      const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.5, 6), this.matPalo); palo.position.y = 0.25; palo.castShadow = true; g.add(palo);
      const copa = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.08, 8), this.matSoporte); copa.position.y = 0.52; g.add(copa);
      const llama = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 8), this.matLlama); llama.position.y = 0.66; g.add(llama);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xff8a2a, map: this.puntos.material.map, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.setScalar(0.7); halo.position.y = 0.66; g.add(halo);
      g.position.set(esq[0], 0, esq[1]);
      this.gAntorchas.add(g);
      this.antorchas.push({ g, llama, halo, x: esq[0], z: esq[1], fase: n * 1.7 });
    }
  }
  actualizarAntorchas(t) {
    if (!this.antorchas.length) { for (const l of this.luces) l.intensity = 0; return; }
    const c = this.cam;
    const cerca = this.antorchas.slice().sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z)).slice(0, this.luces.length);
    for (const a of this.antorchas) {
      const p = Math.sin(t / 70 + a.fase) * 0.5 + Math.sin(t / 37 + a.fase * 2) * 0.3;
      a.llama.scale.set(1 + p * 0.12, 1 + p * 0.25, 1 + p * 0.12);
      a.halo.material.opacity = 0.45 + p * 0.12;
    }
    this.luces.forEach((l, i) => {
      const a = cerca[i];
      if (!a) { l.intensity = 0; return; }
      l.position.set(a.x, 0.75, a.z);
      l.intensity = 4.2 + Math.sin(t / 70 + a.fase) * 0.7 + Math.sin(t / 23 + a.fase) * 0.35;
      // Brasas que suben de vez en cuando.
      if (Math.random() < 0.025) this.tab.emitir(a.x - 0.5, a.z - 0.5, 'brasas', 1);
    });
  }
  actualizarParticulas() {
    const ps = this.tab.particulas, pos = this.puntos.geometry.attributes.position, col = this.puntos.geometry.attributes.color;
    const ahora = performance.now(), cc = new THREE.Color();
    let i = 0;
    for (const p of ps) {
      if (i >= 500) break;
      const k = Math.min(1, (ahora - p.t0) / p.vida);
      pos.setXYZ(i, p.x, p.tipoAltura ?? p.z, p.y);
      cc.set(p.color).multiplyScalar(1 - k * k);
      col.setXYZ(i, cc.r, cc.g, cc.b);
      i++;
    }
    this.puntos.geometry.setDrawRange(0, i);
    pos.needsUpdate = true; col.needsUpdate = true;
  }

  // ---------- cada fotograma ----------
  pintar(t) {
    const e = this.tab.estado;
    if (!e?.mision) return;
    // Rehacer lo estático solo cuando cambia.
    const revelados = Object.keys(e.revelado).length;
    const kPuertas = e.mision.id + '|' + revelados + '|' + e.puertas.map((p) => (p.abierta ? 1 : 0) + (p.descubierta ? 2 : 0) + (p.bloqueada ? 4 : 0)).join('') + '|' + (e.muros || []).map((w) => (w.roto ? 1 : 0)).join('');
    if (kPuertas !== this.claves.puertas) { this.claves.puertas = kPuertas; this.construirParedes(e); this.construirPuertas(e); this.construirAntorchas(e); }
    const kMuebles = e.mision.id + '|' + revelados + '|' + Object.keys(e.rocas).length;
    if (kMuebles !== this.claves.muebles) { this.claves.muebles = kMuebles; this.construirMuebles(e); }

    // El suelo se repinta cada 2 fotogramas (subir la textura cuesta).
    if (this.cuadro++ % 2 === 0) {
      const g = this.gSuelo;
      g.setTransform(ESCALA_SUELO, 0, 0, ESCALA_SUELO, 0, 0);
      g.clearRect(0, 0, D.ANCHO * TS, D.ALTO * TS);
      this.tab.dibujarMundo(g, t, true);
      this.texSuelo.needsUpdate = true;
    }
    this.actualizarBrillo(e, t);
    this.colocarCamara(t);
    this.actualizarAntorchas(t);
    this.actualizarParticulas();
    this.actualizarFichas(t);
    if (this.tab.textos.length || this.gTextos.children.length) this.actualizarTextos();
    this.render.render(this.escena, this.camara);
  }
}
