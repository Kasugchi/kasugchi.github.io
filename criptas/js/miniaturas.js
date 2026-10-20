// =============================================================
//  MINIATURAS 3D
//  Cada figura se monta con piezas sencillas (cilindros, esferas,
//  conos, cajas) y se pinta como una miniatura de plástico.
//  crearMiniatura(THREE, clave, opciones) devuelve un grupo de ~0,9
//  de alto con los pies en y = 0, mirando hacia +z.
// =============================================================

let T3; // THREE, se pasa al crear la primera
const mats = new Map();
function mat(color, extra = {}) {
  const k = color + JSON.stringify(extra);
  if (!mats.has(k)) mats.set(k, new T3.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.05, flatShading: true, ...extra }));
  return mats.get(k);
}
const metal = (color = 0xb8b8b8) => mat(color, { metalness: 0.7, roughness: 0.35 });
const brillo = (color) => mat(color, { emissive: color, emissiveIntensity: 1.2 });

// ---------- Piezas ----------
function pieza(geo, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new T3.Mesh(geo, material);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  return m;
}
const cil = (rt, rb, h, c, ...p) => pieza(new T3.CylinderGeometry(rt, rb, h, 10), c, ...p);
const esf = (r, c, ...p) => pieza(new T3.SphereGeometry(r, 12, 10), c, ...p);
const cono = (r, h, c, ...p) => pieza(new T3.ConeGeometry(r, h, 10), c, ...p);
const caja = (w, h, d, c, ...p) => pieza(new T3.BoxGeometry(w, h, d), c, ...p);

// Cuerpo humanoide básico. Devuelve el grupo y los puntos de anclaje.
function humanoide(g, o) {
  const piel = mat(o.piel), ropa = mat(o.ropa), ropa2 = mat(o.ropa2 || o.ropa);
  const pierna = o.pierna ?? 0.26, ancho = o.ancho ?? 1, torsoH = o.torso ?? 0.28;
  const yCadera = pierna;
  // piernas
  if (!o.tunica) for (const s of [-1, 1]) g.add(cil(0.045 * ancho, 0.05 * ancho, pierna, ropa2, s * 0.065 * ancho, pierna / 2, 0));
  // torso
  g.add(cil(0.12 * ancho, 0.14 * ancho, torsoH, o.torsoDesnudo ? piel : ropa, 0, yCadera + torsoH / 2, 0));
  if (o.cinturon) g.add(cil(0.142 * ancho, 0.142 * ancho, 0.04, mat(o.cinturon), 0, yCadera + 0.03, 0));
  const yHombro = yCadera + torsoH - 0.03;
  // cabeza
  const yCabeza = yHombro + 0.03 + (o.cabeza ?? 0.095);
  g.add(esf(o.cabeza ?? 0.095, piel, 0, yCabeza, 0.005));
  // brazos: [ángulo hacia delante, separación]
  const brazos = [];
  for (const s of [-1, 1]) {
    const hombro = new T3.Group();
    hombro.position.set(s * (0.15 * ancho + 0.02), yHombro, 0);
    const adelante = s === 1 ? (o.brazoDer ?? 0.4) : (o.brazoIzq ?? 0.25);
    hombro.rotation.set(-adelante, 0, s * (o.abierto ?? 0.18));
    hombro.add(cil(0.038 * ancho, 0.034 * ancho, 0.24, o.mangas === false ? piel : ropa, 0, -0.12, 0));
    hombro.add(esf(0.038 * ancho, piel, 0, -0.25, 0));
    g.add(hombro);
    brazos.push(hombro);
  }
  return { yCabeza, yHombro, yCadera, manoIzq: brazos[0], manoDer: brazos[1], r: o.cabeza ?? 0.095 };
}
// Algo empuñado: se cuelga de la mano (extremo del brazo).
function empunar(brazo, objeto, inclinacion = 1.2) {
  const m = new T3.Group();
  m.position.set(0, -0.25, 0);
  m.rotation.x = inclinacion;
  m.add(objeto);
  brazo.add(m);
}

// ---------- Armas y accesorios ----------
function espada(largo = 0.42, ancha = 0.045) {
  const g = new T3.Group();
  g.add(caja(ancha, largo, 0.012, metal(0xd8d8de), 0, largo / 2 + 0.06, 0));
  g.add(caja(0.14, 0.025, 0.03, metal(0xc9a24a), 0, 0.06, 0));
  g.add(cil(0.016, 0.016, 0.08, mat(0x4a2c18), 0, 0.02, 0));
  return g;
}
function hacha(grande = 1) {
  const g = new T3.Group();
  g.add(cil(0.016, 0.016, 0.42 * grande, mat(0x6b4a2c), 0, 0.18 * grande, 0));
  g.add(caja(0.16 * grande, 0.12 * grande, 0.015, metal(0xcfcfd6), 0.07 * grande, 0.34 * grande, 0));
  return g;
}
function baston(cabeza) {
  const g = new T3.Group();
  g.add(cil(0.015, 0.018, 0.7, mat(0x5a3a1e), 0, 0.2, 0));
  g.add(cabeza);
  cabeza.position.y = 0.58;
  return g;
}
function escudoRedondo(color, emblema) {
  const g = new T3.Group();
  g.add(cil(0.12, 0.12, 0.025, mat(color), 0, 0, 0, Math.PI / 2));
  g.add(esf(0.03, metal(emblema || 0xc9a24a), 0, 0, 0.02));
  return g;
}

// =============================================================
//  FIGURAS
// =============================================================
const FIGURAS = {
  barbaro(g, o) {
    const h = humanoide(g, { piel: 0xd9a27a, ropa: 0x6b4a2c, ropa2: 0x5a3a20, torsoDesnudo: true, mangas: false, cinturon: 0x3a2414, ancho: 1.12, brazoDer: 2.6, abierto: 0.3 });
    g.add(cil(0.15, 0.17, 0.09, mat(0x7a5a3a), 0, h.yCadera + 0.02, 0)); // taparrabos de piel
    g.add(caja(0.05, 0.3, 0.02, mat(0x3a2414), 0.03, h.yCadera + 0.15, 0.13, 0, 0, 0.6)); // correa
    const pelo = mat(o.fem ? 0xb0402a : 0x9a3a22);
    g.add(esf(h.r * 1.08, pelo, 0, h.yCabeza + 0.02, -0.02));
    if (o.fem) g.add(cil(0.06, 0.03, 0.25, pelo, 0, h.yCabeza - 0.1, -0.08));
    empunar(h.manoDer, espada(0.5, 0.06), 0.4);
  },
  enano(g, o) {
    const h = humanoide(g, { piel: 0xe0a882, ropa: 0xb07a2a, ropa2: 0x6b4a2c, cinturon: 0x3a2414, ancho: 1.35, pierna: 0.17, torso: 0.24, cabeza: 0.1, brazoDer: 1.8 });
    g.add(cil(0.17, 0.17, 0.05, metal(0x8a8a92), 0, h.yHombro, 0)); // hombreras
    if (!o.fem) g.add(cono(0.09, 0.22, mat(0xc0602a), 0, h.yCabeza - 0.12, 0.07, Math.PI)); // barba
    else for (const s of [-1, 1]) g.add(cil(0.025, 0.02, 0.2, mat(0xc0602a), s * 0.09, h.yCabeza - 0.08, -0.02));
    g.add(pieza(new T3.SphereGeometry(0.108, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), metal(0x9a9aa2), 0, h.yCabeza + 0.01, 0));
    for (const s of [-1, 1]) g.add(cono(0.025, 0.12, mat(0xeee3c8), s * 0.11, h.yCabeza + 0.07, 0, 0, 0, -s * 0.9));
    empunar(h.manoDer, hacha(1.1), 0.5);
  },
  elfo(g, o) {
    const h = humanoide(g, { piel: 0xf0c9a4, ropa: 0x2f7d4f, ropa2: 0x2a4a2a, cinturon: 0x6b4a2c, ancho: 0.9, pierna: 0.3, torso: 0.28, brazoDer: 1.0 });
    g.add(caja(0.26, 0.42, 0.02, mat(0x1f5a36), 0, h.yCadera + 0.12, -0.1, 0.15)); // capa
    const pelo = mat(0xe8d07a);
    g.add(esf(h.r * 1.05, pelo, 0, h.yCabeza + 0.015, -0.015));
    g.add(cil(0.07, o.fem ? 0.05 : 0.07, o.fem ? 0.3 : 0.12, pelo, 0, h.yCabeza - (o.fem ? 0.14 : 0.06), -0.06));
    for (const s of [-1, 1]) g.add(cono(0.02, 0.09, mat(0xf0c9a4), s * 0.1, h.yCabeza + 0.03, 0, 0, 0, -s * 1.1));
    empunar(h.manoDer, espada(0.32, 0.035), 0.9);
  },
  mago(g, o) {
    const azul = mat(0x3a5aa8);
    g.add(cono(0.2, 0.62, azul, 0, 0.31, 0)); // túnica
    const h = humanoide(g, { piel: 0xf0c9a4, ropa: 0x3a5aa8, tunica: true, pierna: 0.26, torso: 0.26, brazoIzq: 0.9, brazoDer: 0.3 });
    g.add(cil(0.13, 0.13, 0.03, mat(0xc9a24a), 0, h.yCadera + 0.05, 0)); // cinto dorado
    g.add(cil(0.17, 0.17, 0.015, azul, 0, h.yCabeza + 0.06, 0)); // ala del sombrero
    g.add(cono(0.1, 0.32, azul, 0, h.yCabeza + 0.22, -0.02, -0.15));
    g.add(esf(0.025, brillo(0xffd36a), 0, h.yCabeza + 0.3, -0.05));
    if (!o.fem) g.add(cono(0.08, 0.26, mat(0xf2efe8), 0, h.yCabeza - 0.14, 0.07, Math.PI));
    else g.add(cil(0.07, 0.05, 0.26, mat(0xd9b24a), 0, h.yCabeza - 0.1, -0.06));
    empunar(h.manoIzq, baston(esf(0.04, brillo(0x7ac8ff))), 0.15);
  },
  trasgo(g) {
    const h = humanoide(g, { piel: 0x6b9a3a, ropa: 0x6b4a2c, ropa2: 0x5a3a20, ancho: 0.85, pierna: 0.18, torso: 0.2, cabeza: 0.11, brazoDer: 1.3, cinturon: 0x3a2414 });
    for (const s of [-1, 1]) g.add(cono(0.04, 0.16, mat(0x6b9a3a), s * 0.15, h.yCabeza + 0.02, 0, 0, 0, -s * 1.3));
    for (const s of [-1, 1]) g.add(esf(0.018, brillo(0xffe24a), s * 0.04, h.yCabeza + 0.02, 0.09));
    empunar(h.manoDer, espada(0.18, 0.03), 0.8);
  },
  orco(g) {
    const verde = 0x4f7a3a;
    const h = humanoide(g, { piel: verde, ropa: 0x5a4030, ropa2: 0x3a2a1e, ancho: 1.3, pierna: 0.24, torso: 0.3, cabeza: 0.1, brazoDer: 2.2, cinturon: 0x2a1c12, mangas: false });
    g.add(caja(0.2, 0.08, 0.2, metal(0x6a6a70), 0.17, h.yHombro + 0.02, 0, 0, 0, -0.4)); // hombrera
    for (const s of [-1, 1]) g.add(cono(0.015, 0.06, mat(0xf2ead8), s * 0.04, h.yCabeza - 0.04, 0.085));
    g.add(esf(0.065, mat(verde), 0, h.yCabeza - 0.02, 0.06)); // mandíbula
    empunar(h.manoDer, hacha(1.2), 0.6);
  },
  esqueleto(g) {
    const hueso = mat(0xe8e0c8);
    for (const s of [-1, 1]) g.add(cil(0.022, 0.022, 0.28, hueso, s * 0.06, 0.14, 0));
    g.add(cil(0.05, 0.08, 0.06, hueso, 0, 0.3, 0)); // pelvis
    g.add(cil(0.015, 0.015, 0.3, hueso, 0, 0.45, -0.02)); // columna
    for (let i = 0; i < 4; i++) g.add(pieza(new T3.TorusGeometry(0.09 - i * 0.008, 0.012, 6, 14, Math.PI * 1.4), hueso, 0, 0.42 + i * 0.05, 0, Math.PI / 2, 0, -Math.PI * 0.2));
    g.add(esf(0.085, hueso, 0, 0.7, 0));
    for (const s of [-1, 1]) g.add(esf(0.022, mat(0x1a1410), s * 0.032, 0.71, 0.07));
    const brazo = (s, ang) => { const b = new T3.Group(); b.position.set(s * 0.12, 0.58, 0); b.rotation.set(-ang, 0, s * 0.15); b.add(cil(0.016, 0.016, 0.26, hueso, 0, -0.13, 0)); g.add(b); return b; };
    const der = brazo(1, 1.4), izq = brazo(-1, 0.6);
    empunar(der, espada(0.3, 0.035), 0.6);
    const esc = escudoRedondo(0x6b4a2c, 0x8a8a8a); esc.position.set(0, -0.22, 0.05); izq.add(esc);
  },
  zombi(g) {
    const h = humanoide(g, { piel: 0x8a9a6a, ropa: 0x5a4a3a, ropa2: 0x3a3428, pierna: 0.25, torso: 0.27, brazoDer: 1.55, brazoIzq: 1.45, abierto: 0.05 });
    g.rotation.x = 0.12; // encorvado
    g.add(caja(0.08, 0.06, 0.02, mat(0x7a2a20), 0.05, h.yHombro - 0.08, 0.13)); // herida
    for (const s of [-1, 1]) g.add(esf(0.016, brillo(0xd8ff7a), s * 0.035, h.yCabeza + 0.01, 0.085));
  },
  momia(g) {
    const venda = mat(0xd8caa0), venda2 = mat(0xb8a882);
    const h = humanoide(g, { piel: 0xd8caa0, ropa: 0xd8caa0, ropa2: 0xd8caa0, pierna: 0.27, torso: 0.3, cabeza: 0.1, brazoDer: 1.5, brazoIzq: 1.5, abierto: 0.08, ancho: 1.1 });
    for (let i = 0; i < 6; i++) g.add(cil(0.152, 0.152, 0.018, i % 2 ? venda : venda2, 0, 0.12 + i * 0.09, 0, 0.15 * (i % 2 ? 1 : -1)));
    for (const s of [-1, 1]) g.add(esf(0.018, brillo(0x7affd8), s * 0.035, h.yCabeza + 0.01, 0.09));
  },
  guerrero(g) {
    const negro = metal(0x2a2a30);
    const h = humanoide(g, { piel: 0x2a2a30, ropa: 0x2a2a30, ropa2: 0x1c1c22, ancho: 1.15, brazoDer: 1.9, brazoIzq: 0.9 });
    g.traverse((m) => { if (m.isMesh) m.material = negro; });
    g.add(caja(0.42, 0.07, 0.2, negro, 0, h.yHombro + 0.02, 0)); // hombreras
    g.add(pieza(new T3.CylinderGeometry(0.1, 0.11, 0.17, 8), negro, 0, h.yCabeza + 0.01, 0)); // yelmo
    g.add(caja(0.12, 0.018, 0.02, brillo(0xff3a2a), 0, h.yCabeza + 0.02, 0.105)); // ranura
    for (const s of [-1, 1]) g.add(cono(0.025, 0.14, mat(0x1a1410), s * 0.1, h.yCabeza + 0.12, 0, 0, 0, -s * 0.5));
    g.add(caja(0.24, 0.4, 0.02, mat(0x5a0f0b), 0, h.yCadera + 0.12, -0.13, 0.12)); // capa
    empunar(h.manoDer, espada(0.42, 0.05), 0.5);
    const esc = new T3.Group(); esc.add(caja(0.2, 0.26, 0.03, negro)); esc.add(caja(0.06, 0.16, 0.035, mat(0x8e1d16)));
    esc.position.set(0, -0.2, 0.06); esc.rotation.x = -0.9; h.manoIzq.add(esc);
  },
  gargola(g) {
    const piedra = mat(0x6e6e72);
    g.add(cil(0.07, 0.09, 0.2, piedra, -0.08, 0.1, 0, 0.3)); g.add(cil(0.07, 0.09, 0.2, piedra, 0.08, 0.1, 0, 0.3)); // patas
    g.add(cil(0.13, 0.17, 0.32, piedra, 0, 0.36, 0.02, 0.35)); // cuerpo inclinado
    g.add(esf(0.1, piedra, 0, 0.58, 0.1));
    for (const s of [-1, 1]) g.add(cono(0.025, 0.14, piedra, s * 0.06, 0.68, 0.06, -0.4, 0, -s * 0.3));
    for (const s of [-1, 1]) g.add(esf(0.02, brillo(0xff8a2a), s * 0.04, 0.6, 0.19));
    for (const s of [-1, 1]) {
      const ala = new T3.Shape(); ala.moveTo(0, 0); ala.lineTo(0.42, 0.28); ala.lineTo(0.36, 0.08); ala.lineTo(0.3, 0.14); ala.lineTo(0.22, -0.02); ala.lineTo(0.12, 0.04); ala.closePath();
      const m = pieza(new T3.ShapeGeometry(ala), mat(0x5a5a5e, { side: T3.DoubleSide }), s * 0.1, 0.45, -0.08, 0, s > 0 ? -0.5 : Math.PI + 0.5, 0);
      g.add(m);
    }
    for (const s of [-1, 1]) g.add(cono(0.03, 0.14, piedra, s * 0.14, 0.33, 0.14, Math.PI / 2 + 0.4, 0, 0));
  },
  hechicero(g) {
    const morado = mat(0x3a1f4a);
    g.add(cono(0.22, 0.66, morado, 0, 0.33, 0));
    const h = humanoide(g, { piel: 0x9a9aa8, ropa: 0x3a1f4a, tunica: true, pierna: 0.28, torso: 0.26, brazoIzq: 0.4, brazoDer: 1.2 });
    g.add(pieza(new T3.SphereGeometry(0.12, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), morado, 0, h.yCabeza + 0.01, -0.01)); // capucha
    for (const s of [-1, 1]) g.add(esf(0.02, brillo(0x7aff6a), s * 0.035, h.yCabeza, 0.085));
    const calavera = new T3.Group(); calavera.add(esf(0.05, mat(0xe8e0c8))); calavera.add(esf(0.015, brillo(0x7aff6a), 0, 0, 0.045));
    empunar(h.manoIzq, baston(calavera), 0.1);
  },
  cargador(g) {
    const h = humanoide(g, { piel: 0xd9a27a, ropa: 0x9a8a6a, ropa2: 0x5a4a3a, cinturon: 0x3a2414, brazoDer: 0.3, brazoIzq: 0.3 });
    g.add(caja(0.26, 0.3, 0.16, mat(0x7a5a34), 0, h.yCadera + 0.2, -0.16)); // mochila
    g.add(cil(0.07, 0.07, 0.28, mat(0x5a8a5a), 0, h.yCadera + 0.37, -0.16, 0, 0, Math.PI / 2)); // manta enrollada
    g.add(cil(0.04, 0.04, 0.1, mat(0x9a6a2a), 0.1, h.yCadera + 0.06, -0.16)); // cantimplora
    g.add(esf(h.r * 1.05, mat(0x5a3a20), 0, h.yCabeza + 0.02, -0.02));
  }
};

// Corona para los jefes.
function corona(y) {
  const g = new T3.Group();
  const oro = metal(0xe2b84a);
  g.add(cil(0.09, 0.09, 0.04, oro, 0, 0, 0));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(cono(0.018, 0.06, oro, Math.cos(a) * 0.085, 0.045, Math.sin(a) * 0.085)); }
  g.position.y = y;
  return g;
}

// Color del plástico de cada figura (como las miniaturas sin pintar de un juego de mesa).
// Los enemigos con poder reutilizan la figura más parecida.
Object.assign(FIGURAS, { chaman: FIGURAS.orco, bestias: FIGURAS.orco, lobo: FIGURAS.trasgo, sacerdotisa: FIGURAS.hechicero,
  ilusionista: FIGURAS.hechicero, bruja: FIGURAS.hechicero, ojo: FIGURAS.gargola, golem: FIGURAS.gargola });

export const PLASTICO = {
  barbaro: 0xb3302a, enano: 0xb3302a, elfo: 0xb3302a, mago: 0xb3302a,
  cargador: 0x9a7a52,
  trasgo: 0x4f7a34, orco: 0x4f7a34,
  esqueleto: 0xd9d1bb, zombi: 0xd9d1bb, momia: 0xd9d1bb,
  guerrero: 0x6e6e76, gargola: 0x6e6e76, hechicero: 0x6e6e76
};

export function crearMiniatura(THREE, tipo, opciones = {}) {
  T3 = THREE;
  const g = new THREE.Group();
  const cuerpo = new THREE.Group();
  (FIGURAS[tipo] || FIGURAS.orco)(cuerpo, opciones);
  g.add(cuerpo);
  if (opciones.plastico) {
    // Todo del mismo color, con brillo de plástico; sin ojos que brillan.
    const plastico = mat(PLASTICO[tipo] ?? 0x8a8a8a, { roughness: 0.38, metalness: 0, flatShading: false });
    cuerpo.traverse((o) => { if (o.isMesh) o.material = plastico; });
  }
  const escala = (opciones.jefe ? 1.22 : 1) * (opciones.escala || 1);
  g.scale.setScalar(escala);
  if (opciones.jefe) {
    const caja3 = new THREE.Box3().setFromObject(cuerpo);
    const c = corona(caja3.max.y + 0.02);
    if (opciones.plastico) c.traverse((o) => { if (o.isMesh) o.material = mat(PLASTICO[tipo] ?? 0x8a8a8a, { roughness: 0.38 }); });
    g.add(c);
  }
  g.position.y = 0.1; // encima de la peana
  return g;
}
