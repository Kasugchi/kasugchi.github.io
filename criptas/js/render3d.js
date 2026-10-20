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

const ESCALA_SUELO = 0.75; // resolución de la textura del suelo
const ALTO_PARED = 0.55;
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
    this.escena.background = hex('#1f1611');
    this.camara = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

    // Luces: ambiente cálida + un "foco" de taberna que da sombras.
    this.escena.add(new THREE.HemisphereLight(0xfff1dc, 0x2a1d14, 0.9));
    const sol = new THREE.DirectionalLight(0xffe2b8, 1.4);
    sol.position.set(4, 22, 6);
    sol.target.position.set(D.ANCHO / 2, 0, D.ALTO / 2);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    Object.assign(sol.shadow.camera, { left: -18, right: 18, top: 15, bottom: -15, near: 1, far: 50 });
    sol.shadow.bias = -0.0008;
    this.escena.add(sol, sol.target);
    this.antorcha = new THREE.PointLight(0xff9a40, 1.2, 6, 1.6);
    this.antorcha.position.y = 1.4;
    this.escena.add(this.antorcha);

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
  verTodo(ya) {
    const o = { x: D.ANCHO / 2, z: D.ALTO / 2, d: this.distanciaTodo() };
    if (ya) Object.assign(this.cam, o); else this.objetivo = o;
  }
  centrarEn(x, y, zoom) {
    this.objetivo = { x: x + 0.5, z: y + 0.5, d: zoom ? Math.min(this.cam.d, 11) : this.cam.d };
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
    c.x = Math.max(-2, Math.min(D.ANCHO + 2, c.x));
    c.z = Math.max(-2, Math.min(D.ALTO + 2, c.z));
    c.d = Math.max(5, Math.min(this.distanciaTodo() * 1.4, c.d));
    let sx = 0, sz = 0;
    const dt = t - (this.tab.temblor || 0);
    if (dt < 350) { sx = Math.sin(dt / 18) * 0.15 * (1 - dt / 350); sz = Math.cos(dt / 23) * 0.1 * (1 - dt / 350); }
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
    for (const p of e.puertas) if (!p.secreta || p.descubierta) huecos.add(T.claveBorde(p.a, p.b));
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
    const claro = hex('#d9d0c0'), oscuro = hex('#4a423a');
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
    const madera = new THREE.MeshStandardMaterial({ color: 0x7a4a24, roughness: 0.8 });
    const hierro = new THREE.MeshStandardMaterial({ color: 0x55524e, roughness: 0.5, metalness: 0.6 });
    const piedra = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.9 });
    for (const p of e.puertas) {
      if (p.secreta && !p.descubierta) continue;
      if (!vis(p.a) && !vis(p.b)) continue;
      const vert = p.a[1] === p.b[1]; // borde vertical (vecinos en x)
      const cx = vert ? Math.max(p.a[0], p.b[0]) : p.a[0] + 0.5;
      const cz = vert ? p.a[1] + 0.5 : Math.max(p.a[1], p.b[1]);
      const g = new THREE.Group();
      g.position.set(cx, 0, cz);
      if (vert) g.rotation.y = Math.PI / 2;
      // Marco a los lados.
      for (const s of [-1, 1]) {
        const jamba = new THREE.Mesh(new THREE.BoxGeometry(0.1, ALTO_PARED + 0.08, GROSOR + 0.06), p.secreta ? piedra : madera);
        jamba.position.set(s * 0.47, (ALTO_PARED + 0.08) / 2, 0); jamba.castShadow = true;
        g.add(jamba);
      }
      if (p.bloqueada && !p.abierta) {
        for (let i = 0; i < 6; i++) {
          const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, ALTO_PARED, 6), hierro);
          barra.position.set(-0.35 + i * 0.14, ALTO_PARED / 2, 0); barra.castShadow = true;
          g.add(barra);
        }
        const trav = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.05, 0.06), hierro);
        trav.position.y = ALTO_PARED * 0.7; g.add(trav);
      } else {
        const hoja = new THREE.Mesh(new THREE.BoxGeometry(0.82, ALTO_PARED * 0.95, 0.07), p.secreta ? piedra : madera);
        hoja.castShadow = true;
        if (p.abierta) {
          // Abierta: girada sobre la bisagra.
          const bisagra = new THREE.Group(); bisagra.position.set(-0.41, 0, 0); bisagra.rotation.y = -Math.PI / 2 * 0.92;
          hoja.position.set(0.41, ALTO_PARED * 0.475, 0); bisagra.add(hoja); g.add(bisagra);
        } else {
          hoja.position.y = ALTO_PARED * 0.475; g.add(hoja);
          const pomo = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.8, roughness: 0.3 }));
          pomo.position.set(0.25, ALTO_PARED * 0.45, 0.06); g.add(pomo);
        }
      }
      this.gPuertas.add(g);
    }
  }

  construirMuebles(e) {
    this.gMuebles.clear();
    const vis = (x, y) => !!e.revelado[T.clave(x, y)];
    for (const u of e.muebles) {
      if (!vis(u.x, u.y)) continue;
      const alto = ALTURAS[u.tipo] || 0.45;
      // La tapa usa el mismo dibujo que la vista 2D.
      const c = document.createElement('canvas');
      c.width = u.w * 64; c.height = u.h * 64;
      const g = c.getContext('2d');
      g.fillStyle = COLOR_LADO[u.tipo] || '#4e321b'; g.fillRect(0, 0, c.width, c.height);
      g.translate(-u.x * TS, -u.y * TS);
      dibujarMueble(g, u, 0);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const lado = new THREE.MeshStandardMaterial({ color: hex(COLOR_LADO[u.tipo] || '#4e321b'), roughness: 0.8 });
      const tapa = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
      const caja = new THREE.Mesh(new THREE.BoxGeometry(u.w - 0.14, alto, u.h - 0.14), [lado, lado, tapa, lado, lado, lado]);
      caja.position.set(u.x + u.w / 2, alto / 2, u.y + u.h / 2);
      caja.castShadow = true; caja.receiveShadow = true;
      this.gMuebles.add(caja);
    }
    // Rocas y derrumbes.
    const roca = new THREE.MeshStandardMaterial({ color: 0x7a7268, roughness: 1, flatShading: true });
    for (const k of Object.keys(e.rocas)) {
      const [x, y] = k.split(',').map(Number);
      if (!vis(x, y)) continue;
      for (let i = 0; i < 4; i++) {
        const r = 0.2 + ((x * 7 + y * 3 + i * 5) % 7) / 40;
        const piedra = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), roca);
        piedra.position.set(x + 0.3 + (i % 2) * 0.4, r * 0.8, y + 0.3 + Math.floor(i / 2) * 0.4);
        piedra.rotation.set(i, x, y); piedra.castShadow = true;
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
    const peana = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.1, 24), new THREE.MeshStandardMaterial({ color: esHeroe ? 0xc9a24a : f.jefe ? 0x8e1d16 : 0x2a211d, roughness: 0.5, metalness: esHeroe ? 0.5 : 0.1 }));
    peana.position.y = 0.05; peana.castShadow = true; g.add(peana);
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.5, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
    cuerpo.position.y = 0.35; cuerpo.castShadow = true; g.add(cuerpo);
    const lamina = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), new THREE.MeshStandardMaterial({ map: this.texturaFicha(f, esHeroe), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6 }));
    lamina.position.y = 1.0; lamina.castShadow = true; g.add(lamina);
    g.userData.lamina = lamina;
    // Anillo del turno.
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.04, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffd36a }));
    anillo.rotation.x = Math.PI / 2; anillo.position.y = 0.03; anillo.visible = false; g.add(anillo);
    g.userData.anillo = anillo;
    // Barra de vida (monstruos con más de 1 punto y cargador).
    if ((!esHeroe || f.id === 'cargador') && f.cuerpoMax > 1) {
      const fondo = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.09), new THREE.MeshBasicMaterial({ color: 0x1c1612 }));
      const barra = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.06), new THREE.MeshBasicMaterial({ color: 0xc43a2a }));
      barra.position.z = 0.001;
      const vida = new THREE.Group(); vida.add(fondo, barra); vida.position.y = 1.5;
      g.add(vida);
      g.userData.vida = vida; g.userData.barra = barra;
    }
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
      g.position.set(x.x + 0.5, 0, x.y + 0.5);
      g.userData.casilla = () => [Math.round(x.x), Math.round(x.y)];
      // La lámina y la vida miran siempre a la cámara.
      g.userData.lamina.quaternion.copy(this.camara.quaternion);
      if (g.userData.vida) {
        g.userData.vida.quaternion.copy(this.camara.quaternion);
        const k = Math.max(0, f.cuerpo / f.cuerpoMax);
        g.userData.barra.scale.x = Math.max(0.001, k);
        g.userData.barra.position.x = -0.33 * (1 - k);
      }
      g.userData.anillo.visible = !!x.activo;
      if (x.activo) g.userData.anillo.scale.setScalar(1 + Math.sin(t / 220) * 0.06);
      const caida = !f.vivo;
      g.rotation.z = caida ? Math.PI / 2.4 : 0; // ficha tumbada al morir
      g.traverse((o) => { if (o.material && !Array.isArray(o.material)) { o.material.transparent = true; o.material.opacity = x.alfa ?? 1; } });
    }
    for (const [id, g] of this.fichas) if (!vistos.has(id)) { this.gFichas.remove(g); this.fichas.delete(id); }
    // La antorcha sigue al héroe del turno.
    const e = this.tab.estado;
    const h = e.turno && e.heroes[e.turno.heroe];
    if (h) {
      const [hx, hy] = this.tab.vista.pos[h.id] || [h.x, h.y];
      this.antorcha.position.set(hx + 0.5, 1.4, hy + 0.5);
      this.antorcha.intensity = 1.1 + Math.sin(t / 90) * 0.15;
    }
  }

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

  // ---------- cada fotograma ----------
  pintar(t) {
    const e = this.tab.estado;
    if (!e?.mision) return;
    // Rehacer lo estático solo cuando cambia.
    const revelados = Object.keys(e.revelado).length;
    const kPuertas = e.mision.id + '|' + revelados + '|' + e.puertas.map((p) => (p.abierta ? 1 : 0) + (p.descubierta ? 2 : 0) + (p.bloqueada ? 4 : 0)).join('');
    if (kPuertas !== this.claves.puertas) { this.claves.puertas = kPuertas; this.construirParedes(e); this.construirPuertas(e); }
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
    this.colocarCamara(t);
    this.actualizarFichas(t);
    if (this.tab.textos.length || this.gTextos.children.length) this.actualizarTextos();
    this.render.render(this.escena, this.camara);
  }
}
