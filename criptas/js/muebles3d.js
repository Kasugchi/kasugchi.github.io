// =============================================================
//  MUEBLES Y PUERTAS 3D, con aspecto de pieza de juego de mesa
//  crearMueble(THREE, u, frente) devuelve un grupo colocado en el
//  origen de la casilla superior izquierda; "frente" indica hacia dónde
//  mira (para estanterías, armeros y chimeneas pegados a la pared).
// =============================================================
let T3;
const cache = new Map();
function mat(color, extra = {}) {
  const k = color + JSON.stringify(extra);
  if (!cache.has(k)) cache.set(k, new T3.MeshStandardMaterial({ color, roughness: 0.7, ...extra }));
  return cache.get(k);
}
function m(geo, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const o = new T3.Mesh(geo, material);
  o.position.set(x, y, z); o.rotation.set(rx, ry, rz);
  o.castShadow = true; o.receiveShadow = true;
  return o;
}
const caja = (w, h, d, c, x, y, z, ...r) => m(new T3.BoxGeometry(w, h, d), c, x, y, z, ...r);
const cil = (rt, rb, h, c, x, y, z, ...r) => m(new T3.CylinderGeometry(rt, rb, h, 14), c, x, y, z, ...r);

// Textura dibujada en un lienzo (se guarda para reutilizarla).
const texturas = new Map();
function textura(clave, w, h, pintar) {
  if (texturas.has(clave)) return texturas.get(clave);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  pintar(c.getContext('2d'), w, h);
  const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace;
  texturas.set(clave, t);
  return t;
}
const LIBROS = ['#7a1f1a', '#2f4f7a', '#3d6b3a', '#7a6420', '#5a2f6a', '#8a4a20', '#3a3a3a', '#9a7a3a'];
function texLibros(n) {
  return textura('libros' + n, 128 * n, 192, (g, w, h) => {
    g.fillStyle = '#4a2c16'; g.fillRect(0, 0, w, h);
    let s = 7;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let fila = 0; fila < 4; fila++) {
      const y0 = 10 + fila * 45;
      g.fillStyle = '#2a1a0c'; g.fillRect(6, y0, w - 12, 40);
      let x = 10;
      while (x < w - 16) {
        const bw = 6 + r() * 9, bh = 26 + r() * 12;
        g.fillStyle = LIBROS[Math.floor(r() * LIBROS.length)];
        g.fillRect(x, y0 + 40 - bh, bw, bh);
        g.fillStyle = 'rgba(255,230,160,0.35)'; g.fillRect(x + 1, y0 + 40 - bh + 5, bw - 2, 2);
        x += bw + 1.5;
      }
      g.fillStyle = '#6b4424'; g.fillRect(0, y0 + 40, w, 5);
    }
    g.strokeStyle = '#2a1a0c'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  });
}
function texArmero(n) {
  return textura('armero' + n, 128 * n, 160, (g, w, h) => {
    g.fillStyle = '#5a3a1e'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) { g.fillStyle = x % 32 ? '#53361c' : '#61401f'; g.fillRect(x, 0, 16, h); }
    for (let i = 0; i < n * 3; i++) {
      const cx = 22 + i * (w - 44) / Math.max(1, n * 3 - 1);
      g.fillStyle = '#cfcfd6'; g.fillRect(cx - 3, 18, 6, 104);
      g.fillStyle = '#c9a24a'; g.fillRect(cx - 12, 118, 24, 6);
      g.fillStyle = '#3a2414'; g.fillRect(cx - 3, 124, 6, 20);
    }
  });
}
function texChimenea(n) {
  return textura('chimenea' + n, 128 * n, 128, (g, w, h) => {
    g.fillStyle = '#6a4436'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3d241c'; g.lineWidth = 3;
    for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 0 : 14; x < w; x += 28) g.strokeRect(x, y, 28, 16);
    const bx = w * 0.25, bw = w * 0.5;
    g.fillStyle = '#140a06'; g.beginPath(); g.moveTo(bx, h); g.lineTo(bx, h * 0.45); g.quadraticCurveTo(w / 2, h * 0.15, bx + bw, h * 0.45); g.lineTo(bx + bw, h); g.fill();
    const gr = g.createRadialGradient(w / 2, h * 0.9, 4, w / 2, h * 0.85, bw * 0.5);
    gr.addColorStop(0, '#ffe08a'); gr.addColorStop(0.4, '#f07a2a'); gr.addColorStop(1, 'rgba(120,30,10,0)');
    g.fillStyle = gr; g.fillRect(bx, h * 0.4, bw, h * 0.6);
  });
}

// Hacia qué lado mira un mueble pegado a la pared: el lado abierto a la sala.
export function frenteMueble(u, regionEn) {
  const r = regionEn(u.x, u.y);
  if (u.w >= u.h) {
    const arriba = regionEn(u.x, u.y - 1) === r, abajo = regionEn(u.x, u.y + u.h) === r;
    return abajo || !arriba ? 'sur' : 'norte';
  }
  const izq = regionEn(u.x - 1, u.y) === r, der = regionEn(u.x + u.w, u.y) === r;
  return der || !izq ? 'este' : 'oeste';
}
const GIRO = { sur: 0, norte: Math.PI, este: Math.PI / 2, oeste: -Math.PI / 2 };

export function crearMueble(THREE, u, frente) {
  T3 = THREE;
  const g = new THREE.Group();
  const W = u.w - 0.12, H = u.h - 0.12;
  const cx = u.w / 2, cz = u.h / 2;
  const madera = mat(0x7a4f2a), maderaOsc = mat(0x4e321b), piedra = mat(0x8f887c, { roughness: 0.95 }), oro = mat(0xc9a24a, { metalness: 0.7, roughness: 0.35 });
  // Para piezas con frente: se construyen mirando a +z (sur) con largo L y fondo F, y luego se giran.
  const conFrente = (construir) => {
    const ladeado = frente === 'este' || frente === 'oeste';
    const L = ladeado ? H : W, F = ladeado ? W : H;
    const p = new THREE.Group(); construir(p, L, F);
    p.rotation.y = GIRO[frente] || 0; p.position.set(cx, 0, cz);
    g.add(p);
  };
  switch (u.tipo) {
    case 'mesa': case 'alquimista': {
      const alto = 0.4;
      g.add(caja(W, 0.06, H, madera, cx, alto, cz));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(caja(0.07, alto, 0.07, maderaOsc, cx + sx * (W / 2 - 0.08), alto / 2, cz + sz * (H / 2 - 0.08)));
      if (u.tipo === 'alquimista') {
        const cols = [0x5fd38a, 0xd35f9a, 0x5f9ad3, 0xd3b85f, 0x9a5fd3];
        for (let i = 0; i < 5; i++) {
          const v = mat(cols[i], { transparent: true, opacity: 0.85, roughness: 0.15, emissive: cols[i], emissiveIntensity: 0.25 });
          const x = cx - W / 2 + 0.2 + (i * (W - 0.4)) / 4, z = cz + ((i % 2) - 0.5) * H * 0.4;
          g.add(cil(0.05, 0.07, 0.12, v, x, alto + 0.09, z));
          g.add(cil(0.015, 0.02, 0.06, v, x, alto + 0.18, z));
        }
        g.add(caja(0.28, 0.04, 0.2, mat(0xe8d8b0), cx + 0.1, alto + 0.05, cz, 0, 0.3)); // pergamino
      }
      break;
    }
    case 'estanteria':
      conFrente((p, L, F) => {
        const alto = 1.0, fondo = Math.min(F, 0.45);
        const frenteTex = mat(0xffffff, { map: texLibros(Math.max(1, Math.round(L))) });
        p.add(m(new THREE.BoxGeometry(L, alto, fondo), [maderaOsc, maderaOsc, madera, maderaOsc, frenteTex, maderaOsc], 0, alto / 2, (F - fondo) / -2 + 0.0));
        p.add(caja(L + 0.08, 0.07, fondo + 0.06, madera, 0, alto + 0.03, (F - fondo) / -2)); // cornisa
        p.add(m(new THREE.SphereGeometry(0.07, 10, 8), mat(0xe8e0c8), L / 2 - 0.15, alto + 0.12, (F - fondo) / -2)); // calavera
      });
      break;
    case 'armero':
      conFrente((p, L, F) => {
        const alto = 0.85, fondo = Math.min(F, 0.3);
        const frenteTex = mat(0xffffff, { map: texArmero(Math.max(1, Math.round(L))) });
        p.add(m(new THREE.BoxGeometry(L, alto, fondo), [maderaOsc, maderaOsc, madera, maderaOsc, frenteTex, maderaOsc], 0, alto / 2, (F - fondo) / -2));
        p.add(caja(L + 0.06, 0.06, fondo + 0.05, madera, 0, alto + 0.03, (F - fondo) / -2));
      });
      break;
    case 'chimenea':
      conFrente((p, L, F) => {
        const alto = 0.8, fondo = Math.min(F, 0.5);
        const frenteTex = mat(0xffffff, { map: texChimenea(Math.max(1, Math.round(L))), emissive: 0x401808, emissiveIntensity: 0.6 });
        const ladrillo = mat(0x5a3a2e);
        p.add(m(new THREE.BoxGeometry(L, alto, fondo), [ladrillo, ladrillo, ladrillo, ladrillo, frenteTex, ladrillo], 0, alto / 2, (F - fondo) / -2));
        p.add(caja(L + 0.1, 0.08, fondo + 0.1, piedra, 0, alto + 0.04, (F - fondo) / -2));
      });
      break;
    case 'cofre': {
      const w = Math.min(W, 0.7), d = Math.min(H, 0.45);
      g.add(caja(w, 0.26, d, madera, cx, 0.13, cz));
      g.add(m(new THREE.CylinderGeometry(d / 2, d / 2, w, 14, 1, false, 0, Math.PI), madera, cx, 0.26, cz, 0, 0, Math.PI / 2));
      for (const s of [-1, 1]) g.add(caja(0.05, 0.27, d + 0.02, oro, cx + s * w * 0.32, 0.135, cz));
      g.add(caja(0.08, 0.1, 0.03, oro, cx, 0.24, cz + d / 2 + 0.01));
      break;
    }
    case 'trono': {
      const rojo = mat(0x8e1d16);
      g.add(caja(W * 0.8, 0.32, H * 0.75, oro, cx, 0.16, cz + 0.05));
      g.add(caja(W * 0.6, 0.06, H * 0.6, rojo, cx, 0.34, cz + 0.05));
      g.add(caja(W * 0.8, 0.9, 0.1, oro, cx, 0.45, cz - H * 0.35));
      g.add(caja(W * 0.6, 0.65, 0.04, rojo, cx, 0.5, cz - H * 0.3));
      for (const s of [-1, 1]) g.add(caja(0.08, 0.18, H * 0.7, oro, cx + s * W * 0.38, 0.4, cz + 0.05));
      for (const s of [-1, 1]) g.add(m(new THREE.ConeGeometry(0.05, 0.16, 8), oro, cx + s * W * 0.35, 0.98, cz - H * 0.35));
      break;
    }
    case 'sarcofago': {
      g.add(caja(W, 0.36, H, piedra, cx, 0.18, cz));
      g.add(caja(W + 0.04, 0.08, H + 0.04, mat(0xa39b8e), cx, 0.4, cz));
      g.add(caja(W * 0.7, 0.06, H * 0.7, mat(0xb3ab9e), cx, 0.47, cz));
      const largo = W > H;
      g.add(caja(largo ? W * 0.5 : 0.06, 0.03, largo ? 0.06 : H * 0.5, mat(0x6e675c), cx, 0.51, cz));
      g.add(caja(largo ? 0.06 : W * 0.3, 0.03, largo ? H * 0.3 : 0.06, mat(0x6e675c), cx + (largo ? -W * 0.1 : 0), 0.51, cz + (largo ? 0 : -H * 0.1)));
      break;
    }
    case 'altar':
      g.add(caja(W, 0.45, H, piedra, cx, 0.225, cz));
      g.add(caja(W * 0.5, 0.02, H + 0.02, mat(0x6e1410), cx, 0.46, cz));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        g.add(cil(0.035, 0.035, 0.12, mat(0xefe2b8), cx + sx * (W / 2 - 0.1), 0.51, cz + sz * (H / 2 - 0.1)));
        g.add(m(new THREE.SphereGeometry(0.025, 6, 6), mat(0xffc04a, { emissive: 0xffa020, emissiveIntensity: 1.5 }), cx + sx * (W / 2 - 0.1), 0.6, cz + sz * (H / 2 - 0.1)));
      }
      break;
    case 'potro': {
      const largo = W >= H;
      g.add(caja(W * 0.9, 0.08, H * 0.6, madera, cx, 0.35, cz));
      for (const s of [-1, 1]) g.add(caja(largo ? 0.12 : W * 0.8, 0.5, largo ? H * 0.8 : 0.12, maderaOsc, cx + (largo ? s * W * 0.42 : 0), 0.25, cz + (largo ? 0 : s * H * 0.42)));
      g.add(cil(0.04, 0.04, largo ? H * 0.9 : W * 0.9, mat(0x5a5a5e, { metalness: 0.6 }), cx + (largo ? W * 0.42 : 0), 0.52, cz + (largo ? 0 : H * 0.42), largo ? Math.PI / 2 : 0, 0, largo ? 0 : Math.PI / 2));
      break;
    }
    case 'caldero': {
      g.add(m(new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0x1e1a18, { metalness: 0.5, roughness: 0.5 }), cx, 0.32, cz, 0));
      g.add(cil(0.28, 0.28, 0.02, mat(0x6ec85a, { emissive: 0x3a8a2a, emissiveIntensity: 0.8 }), cx, 0.3, cz));
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; g.add(cil(0.025, 0.025, 0.12, mat(0x1e1a18), cx + Math.cos(a) * 0.2, 0.05, cz + Math.sin(a) * 0.2)); }
      break;
    }
    case 'pozo': {
      // Pozo del Retorno: brocal de piedra con agua que brilla; cadenas cruzadas hasta vencer al espíritu.
      const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.09, 8, 20), piedra);
      anillo.rotation.x = Math.PI / 2; anillo.position.set(cx, 0.18, cz); g.add(anillo);
      g.add(cil(0.34, 0.36, 0.16, piedra, cx, 0.08, cz));
      g.add(cil(0.29, 0.29, 0.02, mat(0x8ad0ff, { emissive: 0x3a90ff, emissiveIntensity: 1.2, roughness: 0.2 }), cx, 0.17, cz));
      if (!u.libre) {
        const hierro = mat(0x55565e, { metalness: 0.7, roughness: 0.4 });
        for (const giro of [Math.PI / 4, -Math.PI / 4]) for (let i = -3; i <= 3; i++) {
          const es = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 10), hierro);
          es.position.set(cx + Math.cos(giro) * i * 0.09, 0.26, cz + Math.sin(giro) * i * 0.09);
          es.rotation.set(Math.PI / 2, 0, giro + (i % 2 ? Math.PI / 2 : 0));
          g.add(es);
        }
      }
      break;
    }
    default:
      g.add(caja(W, 0.4, H, madera, cx, 0.2, cz));
  }
  g.position.set(u.x, 0, u.y);
  return g;
}

// Puerta de pie con arco de piedra, como las piezas de puerta del juego de mesa.
export function crearPuerta(THREE, p) {
  T3 = THREE;
  const g = new THREE.Group();
  const marco = p.secreta ? mat(0x8f887c, { roughness: 0.95 }) : mat(0xc4b496, { roughness: 0.85 });
  const madera = mat(0x8a5428), hierro = mat(0x55524e, { metalness: 0.6, roughness: 0.45 });
  const anchoHueco = 0.62, altoPoste = 0.55;
  // Base, postes y arco
  g.add(caja(0.92, 0.06, 0.24, marco, 0, 0.03, 0));
  for (const s of [-1, 1]) g.add(caja(0.12, altoPoste, 0.16, marco, s * (anchoHueco / 2 + 0.06), altoPoste / 2 + 0.05, 0));
  g.add(m(new THREE.TorusGeometry(anchoHueco / 2 + 0.06, 0.06, 8, 18, Math.PI), marco, 0, altoPoste + 0.05, 0));
  if (p.bloqueada && !p.abierta) {
    for (let i = 0; i < 5; i++) g.add(cil(0.022, 0.022, altoPoste + 0.22, hierro, -0.24 + i * 0.12, (altoPoste + 0.22) / 2 + 0.05, 0));
    g.add(caja(anchoHueco, 0.04, 0.05, hierro, 0, altoPoste * 0.7, 0));
    return g;
  }
  // Hoja: rectángulo + medio punto, con tablones y herrajes
  const forma = new THREE.Shape();
  const r = anchoHueco / 2 - 0.01;
  forma.moveTo(-r, 0); forma.lineTo(r, 0); forma.lineTo(r, altoPoste); forma.absarc(0, altoPoste, r, 0, Math.PI, false); forma.lineTo(-r, 0);
  const hojaGeo = new THREE.ExtrudeGeometry(forma, { depth: 0.05, bevelEnabled: false });
  hojaGeo.translate(0, 0, -0.025);
  const hoja = m(hojaGeo, p.secreta ? marco : madera, 0, 0.05, 0);
  if (!p.secreta) {
    for (const yy of [0.15, 0.42]) hoja.add(caja(anchoHueco - 0.04, 0.035, 0.06, hierro, 0, yy, 0));
    hoja.add(m(new THREE.SphereGeometry(0.03, 8, 6), mat(0xc9a24a, { metalness: 0.8, roughness: 0.3 }), r * 0.6, 0.3, 0.04));
  }
  if (p.abierta) {
    // Gira sobre la bisagra hacia dentro.
    const bisagra = new THREE.Group(); bisagra.position.set(-r, 0, 0); bisagra.rotation.y = -Math.PI * 0.45;
    hoja.position.set(r, 0.05, 0); bisagra.add(hoja); g.add(bisagra);
  } else g.add(hoja);
  return g;
}
