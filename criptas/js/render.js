// =============================================================
//  DIBUJO DEL TABLERO (canvas)
//  - Una capa fija con suelos y paredes (se pinta una vez).
//  - Encima, cada fotograma: niebla, muebles, puertas, trampas,
//    fichas, resaltados y efectos.
//  - Cámara con arrastre, pellizco y rueda.
// =============================================================
import * as D from './datos.js';
import * as T from './tablero.js';
import { ICONOS } from './iconos.js';
import { spriteDe } from './sprites.js';

export const TS = 64; // tamaño de casilla en la capa interna
const W = D.ANCHO * TS, H = D.ALTO * TS;
const caminos = {};
const icono = (n) => (caminos[n] ||= new Path2D(ICONOS[n] || ''));

function semilla(n) { return () => { n |= 0; n = (n + 0x6D2B79F5) | 0; let t = Math.imul(n ^ (n >>> 15), 1 | n); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rgb = (c, k = 0) => `rgb(${c.map((v) => Math.max(0, Math.min(255, v + k))).join(',')})`;

export function pintarIcono(ctx, nombre, x, y, tam, color) {
  ctx.save();
  ctx.translate(x - tam / 2, y - tam / 2);
  ctx.scale(tam / 512, tam / 512);
  ctx.fillStyle = color;
  ctx.fill(icono(nombre));
  ctx.restore();
}

// ---------- Capa fija: suelos y paredes ----------
function baldosa(g, r, x, y, w, h, c, k) {
  g.fillStyle = rgb(c, k + Math.round((r() - 0.5) * 18));
  g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x, y, w, 2); g.fillRect(x, y, 2, h);
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, y + h - 2, w, 2); g.fillRect(x + w - 2, y, 2, h);
}

function pintarSuelo(g, r, x, y, reg) {
  const { c, p } = D.SUELOS[reg];
  const px = x * TS, py = y * TS, m = TS / 2;
  g.fillStyle = rgb(c, -45); g.fillRect(px, py, TS, TS); // lechada
  switch (p) {
    case 'pasillo': {
      // Adoquines claros y redondeados, como piedra gastada.
      g.fillStyle = rgb(c, -70); g.fillRect(px, py, TS, TS);
      g.fillStyle = rgb(c, Math.round((r() - 0.5) * 20));
      g.beginPath(); g.roundRect(px + 3, py + 3, TS - 6, TS - 6, 12); g.fill();
      const gr = g.createRadialGradient(px + TS * 0.35, py + TS * 0.3, 4, px + m, py + m, TS * 0.6);
      gr.addColorStop(0, 'rgba(255,255,255,0.28)'); gr.addColorStop(1, 'rgba(0,0,0,0.18)');
      g.fillStyle = gr; g.beginPath(); g.roundRect(px + 3, py + 3, TS - 6, TS - 6, 12); g.fill();
      break;
    }
    case 'losas': baldosa(g, r, px + 2, py + 2, TS - 4, TS - 4, c, 0); break;
    case 'damero':
      for (let i = 0; i < 4; i++) baldosa(g, r, px + (i % 2) * m + 1, py + Math.floor(i / 2) * m + 1, m - 2, m - 2, c, ((i + x + y) % 2) ? -55 : 10);
      break;
    case 'ladrillo':
      for (let f = 0; f < 4; f++) {
        const off = (f + y) % 2 ? m / 2 : 0;
        for (let bx = -1; bx < 3; bx++) {
          const x0 = px + bx * m + off, x1 = Math.max(px, x0), x2 = Math.min(px + TS, x0 + m);
          if (x2 - x1 > 3) baldosa(g, r, x1 + 1, py + f * (TS / 4) + 1, x2 - x1 - 2, TS / 4 - 2, c, 0);
        }
      }
      break;
    case 'tablas':
      for (let f = 0; f < 4; f++) baldosa(g, r, px + 1, py + f * (TS / 4) + 1, TS - 2, TS / 4 - 2, c, -5);
      break;
    case 'rombos': {
      baldosa(g, r, px + 1, py + 1, TS - 2, TS - 2, c, 0);
      g.strokeStyle = rgb(c, -60); g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + TS, py + TS); g.moveTo(px + TS, py); g.lineTo(px, py + TS); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(px + 2, py); g.lineTo(px + TS, py + TS - 2); g.stroke();
      break;
    }
    case 'grietas': {
      baldosa(g, r, px + 1, py + 1, TS - 2, TS - 2, c, 6);
      const gr = g.createRadialGradient(px + m, py + m, 4, px + m, py + m, TS * 0.7);
      gr.addColorStop(0, 'rgba(255,255,200,0.16)'); gr.addColorStop(1, 'rgba(0,0,0,0.2)');
      g.fillStyle = gr; g.fillRect(px, py, TS, TS);
      g.strokeStyle = rgb(c, -75); g.lineWidth = 2.2;
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        let cx = px + r() * TS, cy = py + (r() < 0.5 ? 0 : TS);
        g.moveTo(cx, cy);
        for (let s = 0; s < 4; s++) { cx += (r() - 0.5) * 30; cy += (cy > py + m ? -1 : 1) * (8 + r() * 12); g.lineTo(cx, cy); }
        g.stroke();
      }
      break;
    }
  }
  // Polvo y huesecillos sueltos.
  for (let i = 0; i < 16; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.07)';
    const s = 1 + r() * 2.2;
    g.fillRect(px + r() * TS, py + r() * TS, s, s);
  }
  if (reg !== '.' && r() < 0.06) {
    g.fillStyle = 'rgba(236,228,206,0.75)';
    const bx = px + 10 + r() * (TS - 20), by = py + 10 + r() * (TS - 20);
    g.save(); g.translate(bx, by); g.rotate(r() * 3); g.fillRect(-7, -1.5, 14, 3);
    g.beginPath(); g.arc(-7, 0, 2.6, 0, 7); g.arc(7, 0, 2.6, 0, 7); g.fill(); g.restore();
  }
  if (r() < 0.05) { g.fillStyle = 'rgba(110,20,14,0.35)'; g.beginPath(); g.ellipse(px + r() * TS, py + r() * TS, 4 + r() * 5, 3 + r() * 3, r() * 3, 0, 7); g.fill(); }
}

function capaBase() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const r = semilla(7);
  for (let y = 0; y < D.ALTO; y++) for (let x = 0; x < D.ANCHO; x++) pintarSuelo(g, r, x, y, T.region(x, y));
  // Paredes: canal oscuro con canto claro, como el borde de cada sala.
  const pared = (x1, y1, x2, y2) => {
    g.lineCap = 'square';
    g.strokeStyle = '#1a1310'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = '#efe8da'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  };
  for (let y = 0; y < D.ALTO; y++) for (let x = 0; x < D.ANCHO; x++) {
    if (x + 1 < D.ANCHO && T.region(x, y) !== T.region(x + 1, y)) pared((x + 1) * TS, y * TS, (x + 1) * TS, (y + 1) * TS);
    if (y + 1 < D.ALTO && T.region(x, y) !== T.region(x, y + 1)) pared(x * TS, (y + 1) * TS, (x + 1) * TS, (y + 1) * TS);
  }
  g.strokeStyle = '#1a1310'; g.lineWidth = 14; g.strokeRect(0, 0, W, H);
  g.strokeStyle = '#8a8070'; g.lineWidth = 3; g.strokeRect(5, 5, W - 10, H - 10);
  return c;
}

// ---------- Elementos ----------
function madera(g, x, y, w, h, tono = [104, 66, 36]) {
  const gr = g.createLinearGradient(x, y, x, y + h);
  gr.addColorStop(0, rgb(tono, 18)); gr.addColorStop(1, rgb(tono, -18));
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 1.5;
  const vetas = w > h;
  for (let i = 1; i < 4; i++) {
    g.beginPath();
    if (vetas) { g.moveTo(x + 3, y + (h * i) / 4); g.lineTo(x + w - 3, y + (h * i) / 4); }
    else { g.moveTo(x + (w * i) / 4, y + 3); g.lineTo(x + (w * i) / 4, y + h - 3); }
    g.stroke();
  }
  g.strokeStyle = 'rgba(20,10,4,0.8)'; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}

function sombra(g, x, y, w, h) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 5, y + 6, w, h); }

export function dibujarMueble(g, u, t) {
  const x = u.x * TS + 6, y = u.y * TS + 6, w = u.w * TS - 12, h = u.h * TS - 12;
  sombra(g, x, y, w, h);
  switch (u.tipo) {
    case 'mesa': madera(g, x, y, w, h); break;
    case 'cofre':
      madera(g, x + 4, y + 8, w - 8, h - 16, [110, 64, 30]);
      g.fillStyle = '#c9a24a'; g.fillRect(x + 4, y + h / 2 - 3, w - 8, 6); g.fillRect(x + w / 2 - 5, y + h / 2 - 7, 10, 12);
      break;
    case 'estanteria': {
      madera(g, x, y, w, h, [70, 44, 26]);
      const r = semilla(u.x * 31 + u.y);
      const libros = ['#7a1f1a', '#2f4f7a', '#3d6b3a', '#7a6420', '#5a2f6a', '#8a4a20'];
      const vert = w >= h;
      const n = Math.floor((vert ? w : h) / 9);
      for (let i = 0; i < n; i++) {
        g.fillStyle = libros[Math.floor(r() * libros.length)];
        if (vert) g.fillRect(x + 5 + i * 9, y + 5, 7, h - 10 - r() * 6);
        else g.fillRect(x + 5, y + 5 + i * 9, w - 10 - r() * 6, 7);
      }
      break;
    }
    case 'trono':
      g.fillStyle = '#5a1712'; g.fillRect(x + 4, y + 4, w - 8, h - 8);
      g.fillStyle = '#c9a24a'; g.fillRect(x, y, w, 10); g.fillRect(x, y, 8, h); g.fillRect(x + w - 8, y, 8, h);
      g.fillStyle = '#7a2a20'; g.fillRect(x + 12, y + 16, w - 24, h - 22);
      break;
    case 'sarcofago': {
      const gr = g.createLinearGradient(x, y, x + w, y + h);
      gr.addColorStop(0, '#9b958a'); gr.addColorStop(1, '#5e5a52');
      g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, w, h, 10); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 3; g.beginPath(); g.roundRect(x + 8, y + 8, w - 16, h - 16, 8); g.stroke();
      g.beginPath();
      if (w >= h) { g.moveTo(x + w * 0.3, y + h / 2); g.lineTo(x + w * 0.7, y + h / 2); g.moveTo(x + w * 0.42, y + h * 0.3); g.lineTo(x + w * 0.42, y + h * 0.7); }
      else { g.moveTo(x + w / 2, y + h * 0.3); g.lineTo(x + w / 2, y + h * 0.7); g.moveTo(x + w * 0.3, y + h * 0.42); g.lineTo(x + w * 0.7, y + h * 0.42); }
      g.stroke();
      break;
    }
    case 'chimenea': {
      g.fillStyle = '#4a2c22'; g.fillRect(x, y, w, h);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.5;
      for (let by = y; by < y + h; by += 10) for (let bx = x + ((by / 10) % 2) * 9; bx < x + w; bx += 18) g.strokeRect(bx, by, 18, 10);
      const f = 0.7 + Math.sin(t / 120) * 0.15 + Math.sin(t / 47) * 0.08;
      const fx = x + w / 2, fy = y + h / 2;
      const gr = g.createRadialGradient(fx, fy, 2, fx, fy, w * 0.4);
      gr.addColorStop(0, `rgba(255,220,120,${f})`); gr.addColorStop(0.5, `rgba(230,100,30,${f * 0.7})`); gr.addColorStop(1, 'rgba(120,30,10,0)');
      g.fillStyle = gr; g.fillRect(x, y, w, h);
      break;
    }
    case 'armero':
      madera(g, x, y, w, h, [80, 52, 30]);
      for (let i = 0; i < u.w * 2; i++) pintarIcono(g, i % 2 ? 'hacha' : 'espada', x + (i + 0.5) * (w / (u.w * 2)), y + h / 2, Math.min(h, w / (u.w * 2)) * 0.95, '#c8c2b6');
      break;
    case 'alquimista': {
      madera(g, x, y, w, h, [86, 60, 38]);
      const cols = ['#5fd38a', '#d35f9a', '#5f9ad3', '#d3b85f'];
      for (let i = 0; i < 5; i++) {
        const cx = x + 14 + (i * (w - 28)) / 4, cy = y + h / 2 + ((i % 2) - 0.5) * h * 0.35;
        g.fillStyle = cols[i % 4]; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(cx - 2, cy - 2, 2, 0, 7); g.fill();
      }
      break;
    }
    case 'potro':
      madera(g, x, y, w, h, [74, 48, 30]);
      g.fillStyle = '#3a2a1e'; g.fillRect(x - 2, y + 6, w + 4, 8); g.fillRect(x - 2, y + h - 14, w + 4, 8);
      g.strokeStyle = '#9a9488'; g.lineWidth = 2;
      for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + (w * i) / 4, y + 14); g.lineTo(x + (w * i) / 4, y + h - 14); g.stroke(); }
      break;
    case 'caldero': {
      g.fillStyle = '#1b1715'; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2, 0, 7); g.fill();
      const b = 0.6 + Math.sin(t / 200) * 0.2;
      g.fillStyle = `rgba(110,200,90,${b})`; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2 - 6, 0, 7); g.fill();
      break;
    }
    case 'altar':
      g.fillStyle = '#7d776c'; g.fillRect(x, y, w, h);
      g.fillStyle = '#6e1410'; g.fillRect(x + w * 0.2, y, w * 0.6, h);
      g.fillStyle = '#efe2b8';
      for (const [cx, cy] of [[x + 8, y + 8], [x + w - 8, y + 8], [x + 8, y + h - 8], [x + w - 8, y + h - 8]]) { g.beginPath(); g.arc(cx, cy, 4, 0, 7); g.fill(); }
      pintarIcono(g, 'altar', x + w / 2, y + h / 2, Math.min(w, h) * 0.6, 'rgba(230,200,120,0.75)');
      break;
  }
}

function dibujarEscalera(g, esc) {
  const [x0, y0] = esc[0];
  const x = x0 * TS + 4, y = y0 * TS + 4, s = TS * 2 - 8;
  g.fillStyle = '#2a221c'; g.fillRect(x, y, s, s);
  for (let i = 0; i < 6; i++) {
    const k = i / 6;
    g.fillStyle = rgb([150, 140, 125], -Math.round(k * 90));
    g.fillRect(x + 6, y + 6 + k * (s - 12), s - 12, (s - 12) / 6 - 3);
  }
  g.strokeStyle = '#c9a24a'; g.lineWidth = 3; g.strokeRect(x, y, s, s);
}

// Casilla de derrumbe: montón de piedras que corta el paso.
export function dibujarRoca(g, x, y) {
  const r = semilla(x * 97 + y * 13);
  const px = x * TS, py = y * TS;
  // Hueco oscuro con polvo
  const fondo = g.createRadialGradient(px + TS / 2, py + TS / 2, 4, px + TS / 2, py + TS / 2, TS * 0.7);
  fondo.addColorStop(0, '#3a332c'); fondo.addColorStop(1, '#1c1814');
  g.fillStyle = fondo; g.fillRect(px + 1, py + 1, TS - 2, TS - 2);
  // Piedras: de las pequeñas del fondo a las grandes de delante
  const piedras = [];
  for (let i = 0; i < 9; i++) piedras.push({ cx: px + 8 + r() * (TS - 16), cy: py + 8 + r() * (TS - 16), rad: 5 + r() * 6 });
  piedras.push({ cx: px + TS * (0.35 + r() * 0.1), cy: py + TS * (0.42 + r() * 0.1), rad: TS * 0.26 });
  piedras.push({ cx: px + TS * (0.62 + r() * 0.1), cy: py + TS * (0.6 + r() * 0.08), rad: TS * 0.2 });
  for (const p of piedras) {
    const lados = 6 + Math.floor(r() * 3), giro = r() * 6;
    const puntos = [];
    for (let k = 0; k < lados; k++) { const a = (k / lados) * Math.PI * 2 + giro; const d = p.rad * (0.8 + r() * 0.3); puntos.push([p.cx + Math.cos(a) * d, p.cy + Math.sin(a) * d * 0.9]); }
    // sombra
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath();
    for (const [a, b] of puntos) g.lineTo(a + 2.5, b + 3); g.closePath(); g.fill();
    // cuerpo con luz arriba a la izquierda
    const t = Math.round((r() - 0.5) * 30);
    const grad = g.createLinearGradient(p.cx - p.rad, p.cy - p.rad, p.cx + p.rad, p.cy + p.rad);
    grad.addColorStop(0, rgb([170, 160, 145], t)); grad.addColorStop(1, rgb([92, 84, 74], t));
    g.fillStyle = grad; g.beginPath();
    for (const [a, b] of puntos) g.lineTo(a, b); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(20,15,10,0.75)'; g.lineWidth = 1.5; g.stroke();
    // grieta en las grandes
    if (p.rad > 12) {
      g.strokeStyle = 'rgba(30,24,18,0.6)'; g.lineWidth = 1.2; g.beginPath();
      g.moveTo(p.cx - p.rad * 0.4, p.cy - p.rad * 0.2); g.lineTo(p.cx, p.cy + p.rad * 0.05); g.lineTo(p.cx + p.rad * 0.3, p.cy - p.rad * 0.35); g.stroke();
    }
  }
}

// Lado de casilla (en píxeles) que ocupa un muro entre dos casillas vecinas.
function ladoMuro(w) {
  const [a, b] = [w.a, w.b];
  if (a[0] !== b[0]) { const x = Math.max(a[0], b[0]) * TS; return [x, a[1] * TS + 4, x, (a[1] + 1) * TS - 4]; }
  const y = Math.max(a[1], b[1]) * TS; return [a[0] * TS + 4, y, (a[0] + 1) * TS - 4, y];
}
// Muro derribado: un boquete con cascotes donde antes había pared.
function dibujarMuroRoto(g, w) {
  const [x1, y1, x2, y2] = ladoMuro(w);
  const vert = x1 === x2;
  const r = semilla(x1 * 7 + y1 * 13);
  g.fillStyle = '#6e665a';
  if (vert) g.fillRect(x1 - 7, y1 - 2, 14, y2 - y1 + 4); else g.fillRect(x1 - 2, y1 - 7, x2 - x1 + 4, 14);
  for (let i = 0; i < 7; i++) {
    const t = r();
    const cx = vert ? x1 + (r() - 0.5) * 18 : x1 + t * (x2 - x1);
    const cy = vert ? y1 + t * (y2 - y1) : y1 + (r() - 0.5) * 18;
    g.fillStyle = rgb([150, 142, 128], Math.round((r() - 0.5) * 40));
    g.beginPath(); g.arc(cx, cy, 2.5 + r() * 3.5, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 1; g.stroke();
  }
}

function dibujarTrampa(g, t) {
  const cx = t.x * TS + TS / 2, cy = t.y * TS + TS / 2;
  if (t.tipo === 'foso' && t.activa) {
    const gr = g.createRadialGradient(cx, cy, 4, cx, cy, TS * 0.46);
    gr.addColorStop(0, '#000'); gr.addColorStop(0.75, '#0e0b09'); gr.addColorStop(1, 'rgba(14,11,9,0.4)');
    g.fillStyle = gr; g.fillRect(t.x * TS + 3, t.y * TS + 3, TS - 6, TS - 6);
    pintarIcono(g, 'fosoPinchos', cx, cy, TS * 0.7, 'rgba(170,160,145,0.55)');
  } else if (t.activa) {
    pintarIcono(g, D.TRAMPAS[t.tipo].icono, cx, cy, TS * 0.7, 'rgba(210,70,50,0.85)');
  } else {
    pintarIcono(g, D.TRAMPAS[t.tipo].icono, cx, cy, TS * 0.5, 'rgba(0,0,0,0.25)');
  }
}

function dibujarPuerta(g, p) {
  const [ax, ay] = p.a, [bx, by] = p.b;
  const vertical = ay === by; // el borde es una línea vertical
  const ex = vertical ? Math.max(ax, bx) * TS : ax * TS;
  const ey = vertical ? ay * TS : Math.max(ay, by) * TS;
  const largo = TS * 0.84, grosor = TS * 0.26;
  g.save();
  g.translate(vertical ? ex : ex + TS / 2, vertical ? ey + TS / 2 : ey);
  if (vertical) g.rotate(Math.PI / 2);
  const secreta = p.secreta;
  if (p.abierta) {
    // Hueco en el muro y hoja de la puerta girada.
    g.fillStyle = secreta ? '#4a453f' : '#2a1c12';
    g.fillRect(-largo / 2 - 4, -grosor / 2, 6, grosor);
    g.fillRect(largo / 2 - 2, -grosor / 2, 6, grosor);
    g.fillStyle = rgb(D.SUELOS[T.region(ax, ay)].c, -10);
    g.fillRect(-largo / 2 + 2, -TS * 0.09, largo - 4, TS * 0.18);
    if (secreta) { g.fillStyle = '#77716a'; } else madera(g, -largo / 2 - 2, -largo + 4, grosor * 0.7, largo - 8, [120, 78, 40]);
    if (secreta) g.fillRect(-largo / 2 - 2, -largo + 4, grosor * 0.7, largo - 8);
  } else {
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(-largo / 2 + 3, -grosor / 2 + 4, largo, grosor);
    if (p.bloqueada) {
      g.fillStyle = '#3c3a38'; g.fillRect(-largo / 2, -grosor / 2, largo, grosor);
      g.strokeStyle = '#9a958c'; g.lineWidth = 3;
      for (let i = 0; i <= 6; i++) { const x = -largo / 2 + 4 + (i * (largo - 8)) / 6; g.beginPath(); g.moveTo(x, -grosor / 2 + 2); g.lineTo(x, grosor / 2 - 2); g.stroke(); }
      g.strokeRect(-largo / 2, -grosor / 2, largo, grosor);
    } else if (secreta) {
      g.fillStyle = '#6f6a62'; g.fillRect(-largo / 2, -grosor / 2, largo, grosor);
      g.strokeStyle = '#c9a24a'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-8, 0); g.lineTo(0, -6); g.lineTo(8, 0); g.lineTo(0, 6); g.closePath(); g.stroke();
    } else {
      madera(g, -largo / 2, -grosor / 2, largo, grosor, [128, 80, 40]);
      g.fillStyle = '#2c2723';
      g.fillRect(-largo / 2 + 8, -grosor / 2, 5, grosor); g.fillRect(largo / 2 - 13, -grosor / 2, 5, grosor);
      g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(0, 0, 3, 0, 7); g.fill();
    }
  }
  g.restore();
}

export function dibujarFicha(g, f, x, y, esHeroe, t, opciones) {
  const cx = x * TS + TS / 2, cy = y * TS + TS / 2, rad = TS * 0.4;
  const def = f.id === 'cargador' ? D.CARGADOR : esHeroe ? D.HEROES[f.tipo] : D.MONSTRUOS[f.tipo];
  g.save();
  g.globalAlpha = opciones.alfa ?? 1;
  // peana
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.ellipse(cx + 3, cy + 6, rad, rad * 0.9, 0, 0, 7); g.fill();
  const gr = g.createRadialGradient(cx - rad * 0.35, cy - rad * 0.4, 2, cx, cy, rad);
  gr.addColorStop(0, rgb(hex(def.color), 50)); gr.addColorStop(1, rgb(hex(def.color), -30));
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rad, 0, 7); g.fill();
  g.lineWidth = esHeroe ? 4 : 3;
  g.strokeStyle = esHeroe ? '#d8b45a' : (f.jefe ? '#c43a2a' : '#1c1612');
  g.stroke();
  const sprite = opciones.sinSprite ? null : spriteDe(f);
  if (sprite) {
    // Ilustración propia recortada dentro del círculo de la ficha.
    g.save();
    g.beginPath(); g.arc(cx, cy, rad - 2, 0, 7); g.clip();
    const k = (rad * 2.2) / Math.max(sprite.naturalWidth, sprite.naturalHeight);
    const w = sprite.naturalWidth * k, h = sprite.naturalHeight * k;
    g.drawImage(sprite, cx - w / 2, cy - h * 0.42, w, h);
    g.restore();
  } else pintarIcono(g, f.icono || def.icono, cx, cy, rad * 1.45, esHeroe ? '#f3e6c4' : '#ece4d2');
  if (f.jefe) pintarIcono(g, 'corona', cx, cy - rad - 4, 20, '#e2b84a');
  // estados
  const ef = f.efectos || {};
  let ix = cx - rad;
  const marca = (n, c) => { pintarIcono(g, n, ix + 8, cy + rad - 4, 16, c); ix += 16; };
  if (ef.dormido) marca('sueno', '#9fc3ff');
  if (ef.aturdido) marca('aire', '#cfe3ef');
  if (ef.raices > 0) marca('tierra', '#a6c35a');
  if (ef.piel) marca('piedra', '#d0c8b8');
  if (ef.niebla) marca('agua', '#a8d0f0');
  if (ef.coraje || ef.fuerza || ef.calderoAtq > 0) marca('fuego', '#ff9a50');
  if (ef.calderoAtq < 0) marca('atacar', '#e05a4a');
  if (ef.farol) marca('antorcha', '#8af0a8');
  if (ef.furia) marca('fuego', '#e05a4a');
  if (ef.poseido) marca('mente', '#c49aff');
  if (ef.trance) marca('sueno', '#c49aff');
  if (ef.dominado) marca('mente', '#e05a4a');
  if (ef.cadena) marca('verja', '#d8c8a0');
  if (ef.muro) marca('rodela', '#ffd36a');
  if (ef.tiron) marca('verja', '#e05a4a');
  if (ef.calderoDef > 0) marca('escudo', '#9fd08a');
  if (ef.calderoDef < 0) marca('escudo', '#e05a4a');
  // vida de monstruos con más de 1 punto
  if ((!esHeroe || f.id === 'cargador') && f.cuerpoMax > 1) {
    const w = rad * 1.6, px = cx - w / 2, py = cy + rad + 4;
    g.fillStyle = '#1c1612'; g.fillRect(px - 1, py - 1, w + 2, 7);
    g.fillStyle = '#c43a2a'; g.fillRect(px, py, (w * f.cuerpo) / f.cuerpoMax, 5);
  }
  g.restore();
  if (opciones.activo) {
    const p = 0.5 + Math.sin(t / 220) * 0.5;
    g.strokeStyle = `rgba(255,214,110,${0.4 + p * 0.5})`; g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, rad + 6 + p * 3, 0, 7); g.stroke();
  }
}

function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

// =============================================================
//  CLASE PRINCIPAL
// =============================================================
export class Tablero {
  constructor(canvas, alTocar) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.base = capaBase();
    this.alTocar = alTocar;
    this.estado = null;
    this.vista = { pos: {}, ocultos: new Set(), vivos: new Set() };
    this.resaltes = { destinos: {}, ataque: [], magia: [], trampas: [], cargador: {}, muros: [] };
    this.textos = [];
    this.destellos = [];
    this.cam = { x: W / 2, y: H / 2, z: 0.5 };
    this.objetivoCam = null;
    this.punteros = new Map();
    this.temblor = 0;
    this.miHeroe = null;
    this.instalarEntrada();
    new ResizeObserver(() => this.ajustar()).observe(canvas);
    this.ajustar();
    const bucle = (t) => { this.dibujar(t); requestAnimationFrame(bucle); };
    requestAnimationFrame(bucle);
  }

  ajustar() {
    const r = this.cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = Math.max(1, Math.round(r.width * dpr));
    this.cv.height = Math.max(1, Math.round(r.height * dpr));
    this.dpr = dpr;
    this.min = Math.min(r.width / W, r.height / H) * 0.98;
    if (!this.ajustado) { this.cam.z = this.zInicial(); this.ajustado = true; }
    this.cam.z = Math.max(this.min, this.cam.z);
  }
  zInicial() {
    const r = this.cv.getBoundingClientRect();
    // En móvil, casillas de ~36 px; en pantalla grande, todo el tablero.
    return r.width < 700 ? Math.max(this.min, 36 / TS) : this.min;
  }
  verTodo() { if (this.e3d) return this.e3d.verTodo(); this.objetivoCam = { x: W / 2, y: H / 2, z: this.min }; }
  // ¿Está la cámara acercada? (para decidir si seguir a las fichas)
  acercado(margen = 1.3) { return this.e3d ? !this.e3d.estaLejos() : this.cam.z > this.min * margen; }

  // Vista 3D: se carga solo al activarla (three.js pesa).
  async ponerVista3D(si) {
    if (!!this.e3d === si) return true;
    if (!si) { this.e3d.destruir(); this.e3d = null; this.cv.style.visibility = ''; return true; }
    const { Escena3D } = await import('./render3d.js');
    this.e3d = new Escena3D(this.cv.parentElement, this);
    this.cv.style.visibility = 'hidden';
    return true;
  }
  girar3D(rad) { this.e3d?.girar(rad); }

  centrarEn(x, y, zoom) {
    if (this.e3d) return this.e3d.centrarEn(x, y, zoom);
    const z = zoom ? Math.max(this.cam.z, this.zInicial()) : this.cam.z;
    this.objetivoCam = { x: x * TS + TS / 2, y: y * TS + TS / 2, z };
  }

  aPantalla() {
    const r = this.cv.getBoundingClientRect();
    return { ox: r.width / 2 - this.cam.x * this.cam.z, oy: r.height / 2 - this.cam.y * this.cam.z };
  }
  casillaEn(px, py) {
    const { ox, oy } = this.aPantalla();
    return [Math.floor((px - ox) / this.cam.z / TS), Math.floor((py - oy) / this.cam.z / TS)];
  }
  limitar() {
    const r = this.cv.getBoundingClientRect();
    const mx = r.width / 2 / this.cam.z, my = r.height / 2 / this.cam.z;
    this.cam.x = W <= mx * 2 ? W / 2 : Math.max(mx - 40, Math.min(W - mx + 40, this.cam.x));
    this.cam.y = H <= my * 2 ? H / 2 : Math.max(my - 40, Math.min(H - my + 40, this.cam.y));
  }

  instalarEntrada() {
    const cv = this.cv;
    let arrastre = null, pellizco = null, movido = false;
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      this.punteros.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      this.objetivoCam = null;
      movido = false;
      if (this.punteros.size === 1) arrastre = { x: e.offsetX, y: e.offsetY, cx: this.cam.x, cy: this.cam.y };
      if (this.punteros.size === 2) {
        const [a, b] = [...this.punteros.values()];
        pellizco = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.cam.z };
        movido = true;
      }
    });
    cv.addEventListener('pointermove', (e) => {
      if (!this.punteros.has(e.pointerId)) return;
      this.punteros.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (pellizco && this.punteros.size >= 2) {
        const [a, b] = [...this.punteros.values()];
        this.cam.z = Math.max(this.min, Math.min(1.6, pellizco.z * Math.hypot(a.x - b.x, a.y - b.y) / pellizco.d));
        this.limitar();
      } else if (arrastre) {
        const dx = e.offsetX - arrastre.x, dy = e.offsetY - arrastre.y;
        if (Math.hypot(dx, dy) > 8) movido = true;
        if (movido) { this.cam.x = arrastre.cx - dx / this.cam.z; this.cam.y = arrastre.cy - dy / this.cam.z; this.limitar(); }
      }
    });
    const fin = (e) => {
      if (!this.punteros.has(e.pointerId)) return;
      this.punteros.delete(e.pointerId);
      if (this.punteros.size < 2) pellizco = null;
      if (this.punteros.size === 0) {
        if (!movido && arrastre) {
          const [x, y] = this.casillaEn(e.offsetX, e.offsetY);
          if (T.dentro(x, y)) this.alTocar(x, y);
        }
        arrastre = null;
      }
    };
    cv.addEventListener('pointerup', fin);
    cv.addEventListener('pointercancel', fin);
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.objetivoCam = null;
      const z0 = this.cam.z;
      const z = Math.max(this.min, Math.min(1.6, z0 * (e.deltaY < 0 ? 1.12 : 0.89)));
      const { ox, oy } = this.aPantalla();
      const wx = (e.offsetX - ox) / z0, wy = (e.offsetY - oy) / z0;
      this.cam.z = z;
      const r = this.cv.getBoundingClientRect();
      this.cam.x = wx - (e.offsetX - r.width / 2) / z;
      this.cam.y = wy - (e.offsetY - r.height / 2) / z;
      this.limitar();
    }, { passive: false });
  }

  // ---------- efectos ----------
  texto(x, y, txt, color) { this.textos.push({ x, y, txt, color, t0: performance.now() }); }
  destello(x, y, color) { this.destellos.push({ x, y, color, t0: performance.now() }); }
  temblar() { this.temblor = performance.now(); }

  // ---------- fotograma ----------
  dibujar(t) {
    if (this.e3d) { this.e3d.pintar(t); return; }
    const g = this.g, e = this.estado;
    const r = this.cv.getBoundingClientRect();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.cv.width, this.cv.height);
    if (!e || !e.mision) return;
    if (this.objetivoCam) {
      const o = this.objetivoCam, k = 0.12;
      this.cam.x += (o.x - this.cam.x) * k; this.cam.y += (o.y - this.cam.y) * k; this.cam.z += (o.z - this.cam.z) * k;
      if (Math.abs(o.x - this.cam.x) < 1 && Math.abs(o.y - this.cam.y) < 1 && Math.abs(o.z - this.cam.z) < 0.002) this.objetivoCam = null;
      this.limitar();
    }
    let { ox, oy } = this.aPantalla();
    const dt = t - this.temblor;
    if (dt < 350) { ox += Math.sin(dt / 18) * 6 * (1 - dt / 350); oy += Math.cos(dt / 23) * 4 * (1 - dt / 350); }
    g.setTransform(this.dpr * this.cam.z, 0, 0, this.dpr * this.cam.z, this.dpr * ox, this.dpr * oy);
    // Sombra del tablero sobre la mesa.
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(14, 18, W, H);
    this.dibujarMundo(g, t, false);
  }

  // Figuras que se ven ahora (con su posición animada). La usan el 2D y el 3D.
  figurasVisibles() {
    const e = this.estado, out = [];
    const vis = (x, y) => !!e.revelado[T.clave(x, y)];
    for (const m of e.monstruos) {
      if (!((m.vivo || this.vista.vivos.has(m.id)) && m.visto && !this.vista.ocultos.has(m.id))) continue;
      const [x, y] = this.vista.pos[m.id] || [m.x, m.y];
      if (!vis(Math.round(x), Math.round(y)) && !this.vista.pos[m.id]) continue;
      out.push({ f: m, x, y, esHeroe: false, alfa: m.vivo ? 1 : 0.8 });
    }
    for (const h of Object.values(e.heroes)) {
      if ((!h.vivo && !this.vista.vivos.has(h.id)) || h.fuera) continue;
      const [x, y] = this.vista.pos[h.id] || [h.x, h.y];
      out.push({ f: h, x, y, esHeroe: true, activo: h.id === e.turno?.heroe && e.fase === 'mision' });
    }
    const c = e.cargador;
    if (c && (c.vivo || this.vista.vivos.has('cargador'))) {
      const [x, y] = this.vista.pos.cargador || [c.x, c.y];
      out.push({ f: c, x, y, esHeroe: true, alfa: c.vivo ? 1 : 0.6 });
    }
    return out;
  }

  // Dibuja el tablero en coordenadas del mundo (1 casilla = TS).
  // plano = true: solo lo que va pegado al suelo (para la vista 3D, que pone
  // paredes, puertas, muebles, rocas y fichas en relieve).
  dibujarMundo(g, t, plano) {
    const e = this.estado;
    g.drawImage(this.base, 0, 0);
    const vis = (x, y) => !!e.revelado[T.clave(x, y)];

    dibujarEscalera(g, e.escalera);
    for (const w of e.muros || []) if (w.roto && (vis(...w.a) || vis(...w.b))) dibujarMuroRoto(g, w);
    if (!plano) for (const k of Object.keys(e.rocas)) { const [x, y] = k.split(',').map(Number); if (vis(x, y)) dibujarRoca(g, x, y); }
    for (const tr of e.trampas) if (tr.descubierta && vis(tr.x, tr.y)) dibujarTrampa(g, tr);
    if (!plano) for (const u of e.muebles) if (vis(u.x, u.y)) dibujarMueble(g, u, t);

    // Niebla: lo no descubierto queda en penumbra (se ve el plano, no lo que hay).
    g.fillStyle = 'rgba(10,7,6,0.6)';
    g.beginPath();
    for (let y = 0; y < D.ALTO; y++) for (let x = 0; x < D.ANCHO; x++) if (!vis(x, y)) g.rect(x * TS, y * TS, TS, TS);
    g.fill();

    if (!plano) for (const p of e.puertas) {
      if (p.secreta && !p.descubierta) continue;
      if (vis(p.a[0], p.a[1]) || vis(p.b[0], p.b[1])) dibujarPuerta(g, p);
    }

    // Resaltes de acciones posibles.
    const pulso = 0.5 + Math.sin(t / 260) * 0.5;
    const fuerza = plano ? 2 : 1; // en 3D la luz los apaga un poco: más marcados
    for (const k of Object.keys(this.resaltes.destinos)) {
      const [x, y] = k.split(',').map(Number);
      g.fillStyle = `rgba(255,214,120,${(0.16 + pulso * 0.1) * fuerza})`; g.fillRect(x * TS + 3, y * TS + 3, TS - 6, TS - 6);
      g.strokeStyle = 'rgba(255,214,120,0.55)'; g.lineWidth = 2; g.strokeRect(x * TS + 4, y * TS + 4, TS - 8, TS - 8);
    }
    for (const k of Object.keys(this.resaltes.cargador || {})) {
      const [x, y] = k.split(',').map(Number);
      g.fillStyle = `rgba(120,200,255,${0.14 + pulso * 0.1})`; g.fillRect(x * TS + 3, y * TS + 3, TS - 6, TS - 6);
      g.strokeStyle = 'rgba(120,200,255,0.6)'; g.lineWidth = 2; g.strokeRect(x * TS + 4, y * TS + 4, TS - 8, TS - 8);
    }
    // Muros frágiles que brillan al sacar la Trompa de Jericó.
    for (const id of this.resaltes.muros || []) {
      const w = (e.muros || []).find((x) => x.id === id);
      if (!w) continue;
      const [x1, y1, x2, y2] = ladoMuro(w);
      g.save(); g.lineCap = 'round';
      g.shadowColor = 'rgba(255,190,60,1)'; g.shadowBlur = 26 * fuerza;
      g.strokeStyle = `rgba(255,214,120,${0.65 + pulso * 0.35})`; g.lineWidth = 14;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.restore();
    }
    for (const id of this.resaltes.trampas) {
      const tr = e.trampas.find((x) => x.id === id);
      if (tr) { g.strokeStyle = `rgba(120,220,255,${0.5 + pulso * 0.5})`; g.lineWidth = 4; g.strokeRect(tr.x * TS + 4, tr.y * TS + 4, TS - 8, TS - 8); }
    }

    // Fichas.
    if (!plano) for (const x of this.figurasVisibles()) dibujarFicha(g, x.f, x.x, x.y, x.esHeroe, t, { alfa: x.alfa, activo: x.activo });
    // Objetivos de ataque y de magia.
    const anillo = (id, color) => {
      const f = e.heroes[id] || e.monstruos.find((m) => m.id === id);
      if (!f) return;
      const [x, y] = this.vista.pos[id] || [f.x, f.y];
      g.strokeStyle = color; g.lineWidth = 4; g.setLineDash([8, 6]); g.lineDashOffset = -t / 40;
      g.beginPath(); g.arc(x * TS + TS / 2, y * TS + TS / 2, TS * 0.47, 0, 7); g.stroke(); g.setLineDash([]);
    };
    for (const id of this.resaltes.ataque) anillo(id, `rgba(230,60,40,${0.6 + pulso * 0.4})`);
    for (const id of this.resaltes.magia) anillo(id, `rgba(170,120,255,${0.6 + pulso * 0.4})`);

    // Luz de antorcha alrededor de los héroes.
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const h of Object.values(e.heroes)) {
      if (!h.vivo || h.fuera) continue;
      const [x, y] = this.vista.pos[h.id] || [h.x, h.y];
      const cx = x * TS + TS / 2, cy = y * TS + TS / 2;
      const f = 0.07 + Math.sin(t / 90 + x) * 0.012;
      const gr = g.createRadialGradient(cx, cy, 10, cx, cy, TS * 3.2);
      gr.addColorStop(0, `rgba(255,170,80,${f})`); gr.addColorStop(1, 'rgba(255,170,80,0)');
      g.fillStyle = gr; g.fillRect(cx - TS * 3.2, cy - TS * 3.2, TS * 6.4, TS * 6.4);
    }
    g.restore();

    // Destellos y números flotantes.
    const ahora = performance.now();
    this.destellos = this.destellos.filter((d) => ahora - d.t0 < 700);
    for (const d of this.destellos) {
      const k = (ahora - d.t0) / 700;
      const cx = d.x * TS + TS / 2, cy = d.y * TS + TS / 2;
      const gr = g.createRadialGradient(cx, cy, 2, cx, cy, TS * (0.4 + k * 1.2));
      gr.addColorStop(0, d.color.replace('A', String(1 - k))); gr.addColorStop(1, d.color.replace('A', '0'));
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, TS * (0.4 + k * 1.2), 0, 7); g.fill();
    }
    this.textos = this.textos.filter((x) => ahora - x.t0 < 1300);
    if (!plano) for (const x of this.textos) {
      const k = (ahora - x.t0) / 1300;
      g.globalAlpha = 1 - k * k;
      g.font = '700 30px "Grenze Gotisch", serif';
      g.textAlign = 'center';
      g.lineWidth = 6; g.strokeStyle = '#140d09';
      const px = x.x * TS + TS / 2, py = x.y * TS - k * 40;
      g.strokeText(x.txt, px, py); g.fillStyle = x.color; g.fillText(x.txt, px, py);
      g.globalAlpha = 1;
    }
  }
}
