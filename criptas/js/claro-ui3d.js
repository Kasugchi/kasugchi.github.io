// =============================================================
//  EL CLARO · INTERFAZ 3D: rótulos con nombre que flotan sobre la gente,
//  el «!» de misión que bota, anillos en el suelo de lo que se puede tocar,
//  números de daño que suben y chispas, monedas y humo que saltan.
//  Todo vive en el mundo, no pegado a la pantalla.
// =============================================================
import * as THREE from 'three';
import { lienzo } from './claro-estilo.js';

const FUENTE = '800 44px Nunito, system-ui, sans-serif';
function pastilla(texto, { fondo = '#fff8e6', tinta = '#4a3626', borde = '#c9a36a', sub } = {}) {
  const c = document.createElement('canvas').getContext('2d'); c.font = FUENTE; const wt = c.measureText(texto).width; c.font = '700 30px Nunito, sans-serif';
  const w = Math.ceil(Math.max(wt, sub ? c.measureText(sub).width : 0)) + 60, h = sub ? 112 : 76;
  const tx = lienzo(w, h, (x) => {
    x.font = FUENTE; x.fillStyle = fondo; x.strokeStyle = borde; x.lineWidth = 6;
    const r = 30; x.beginPath(); x.roundRect(4, 4, w - 8, (sub ? 72 : h) - 8, r); x.fill(); x.stroke();
    x.fillStyle = tinta; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, w / 2, (sub ? 72 : h) / 2 + 2);
    if (sub) { x.font = '700 30px Nunito, sans-serif'; x.fillStyle = '#fff8e6'; x.strokeStyle = '#3b2418'; x.lineWidth = 6; x.strokeText(sub, w / 2, 94); x.fillText(sub, w / 2, 94); }
  });
  return { tx, aspecto: w / h };
}

export function crearUI3D(escena, camara) {
  const vivos = [];   // efectos con vida limitada
  const fijos = [];   // rótulos y marcadores que siguen a alguien

  function sprite(tx, alto, { encima = true } = {}) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthTest: !encima, depthWrite: false, fog: false }));
    s.renderOrder = encima ? 10 : 0; s.userData.alto = alto; return s;
  }

  return {
    // Rótulo con nombre sobre un personaje (tipo: amigo, enemigo, cosa)
    rotulo(objetivo, texto, { tipo = 'amigo', altura = 2.6, sub } = {}) {
      const col = { amigo: {}, enemigo: { fondo: '#5a1f2a', tinta: '#ffe1d6', borde: '#ff8a6a' }, cosa: { fondo: '#2f2a4a', tinta: '#f1e6ff', borde: '#b78bff' } }[tipo];
      const { tx, aspecto } = pastilla(texto, { ...col, sub }), alto = sub ? .62 : .42, s = sprite(tx, alto);
      s.scale.set(alto * aspecto, alto, 1);
      escena.add(s); const f = { s, objetivo, altura, visible: true, tipo: 'rotulo' }; fijos.push(f); return f;
    },
    // El «!» dorado de misión (o «?» cuando ya puedes entregarla)
    marcador(objetivo, signo = '!', altura = 3.2) {
      const tx = lienzo(128, 160, (x) => {
        x.font = '900 150px Nunito, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.lineWidth = 14; x.strokeStyle = '#4a2a10'; x.strokeText(signo, 64, 86); x.fillStyle = '#ffd34a'; x.fillText(signo, 64, 86);
        x.fillStyle = 'rgba(255,255,255,.55)'; x.fillText(signo, 60, 80);
      });
      const s = sprite(tx, .9); s.scale.set(.72, .9, 1); escena.add(s);
      const f = { s, objetivo, altura, visible: true, tipo: 'marca', bote: Math.random() * 6 }; fijos.push(f); return f;
    },
    quitar(f) { if (!f) return; escena.remove(f.s); const i = fijos.indexOf(f); if (i >= 0) fijos.splice(i, 1); },
    // Anillo luminoso en el suelo: «esto se puede tocar»
    anillo(color = '#ffe08a', r = 1) {
      const m = new THREE.Mesh(new THREE.RingGeometry(r * .9, r, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      m.renderOrder = 2; escena.add(m); m.visible = false; return m;
    },
    // Número que sube y se desvanece (daño, curación, oro)
    numero(pos, texto, color = '#ff5a4a') {
      const tx = lienzo(256, 96, (x) => { x.font = '900 72px Nunito, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 12; x.strokeStyle = '#2b1d2e'; x.strokeText(texto, 128, 50); x.fillStyle = color; x.fillText(texto, 128, 50); });
      const s = sprite(tx, .8); s.scale.set(2.1, .8, 1); s.position.copy(pos); escena.add(s);
      vivos.push({ s, vida: 1.3, total: 1.3, v: new THREE.Vector3((Math.random() - .5) * .6, 2.2, 0), tipo: 'numero' });
    },
    // Chispas de colores (al recoger, al lanzar un hechizo, al abrir algo)
    chispas(pos, color = '#fff2a8', n = 26, fuerza = 4) {
      const tx = lienzo(32, 32, (x) => { const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); });
      for (let i = 0; i < n; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); const e = .15 + Math.random() * .2; s.scale.set(e, e, 1);
        s.position.copy(pos); escena.add(s);
        const a = Math.random() * Math.PI * 2, u = Math.random();
        vivos.push({ s, vida: .7 + Math.random() * .6, total: 1.2, v: new THREE.Vector3(Math.cos(a) * fuerza * u, 1 + Math.random() * fuerza, Math.sin(a) * fuerza * u), g: -6, tipo: 'chispa' });
      }
    },
    // Monedas que saltan en arco y caen girando
    monedas(pos, n = 8) {
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .04, 14), new THREE.MeshToonMaterial({ color: '#ffcd4a', emissive: '#a86a10', emissiveIntensity: .3 }));
        m.rotation.x = Math.PI / 2; m.position.copy(pos); m.castShadow = true; escena.add(m);
        const a = Math.random() * Math.PI * 2; vivos.push({ s: m, vida: 1.6, total: 1.6, v: new THREE.Vector3(Math.cos(a) * 2, 4 + Math.random() * 2, Math.sin(a) * 2), g: -12, suelo: pos.y - .9, gira: 10 + Math.random() * 10, tipo: 'moneda' });
      }
    },
    // Bola de fuego que vuela de un punto a otro (y avisa al llegar)
    proyectil(desde, hasta, color = '#ff8a3a', dur = .55) {
      return new Promise((fin) => {
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.28, 1), new THREE.MeshBasicMaterial({ color })); b.position.copy(desde); escena.add(b);
        vivos.push({ s: b, vida: dur, total: dur, desde: desde.clone(), hasta: hasta.clone(), tipo: 'proyectil', fin, rastro: (p) => this.chispas(p, color, 2, 1) });
      });
    },
    actualizar(dt, t) {
      for (const f of fijos) {
        const o = f.objetivo; if (!o) continue;
        const p = o.isVector3 ? o : o.getWorldPosition(new THREE.Vector3());
        f.s.visible = f.visible && camara.position.distanceTo(p) < (f.tipo === 'marca' ? 60 : 30); f.s.position.set(p.x, p.y + f.altura + (f.tipo === 'marca' ? Math.abs(Math.sin(t * 3 + f.bote)) * .25 : 0), p.z);
        if (f.tipo === 'marca') f.s.material.rotation = Math.sin(t * 2 + f.bote) * .08;
        const d = camara.position.distanceTo(f.s.position), k = Math.min(1.6, Math.max(.9, d / 14));   // que se lean igual de lejos que de cerca
        const a = f.s.userData.alto * k, asp = f.s.scale.x / f.s.scale.y; f.s.scale.set(a * asp, a, 1);
      }
      for (let i = vivos.length - 1; i >= 0; i--) {
        const e = vivos[i]; e.vida -= dt; const k = Math.max(0, e.vida / e.total);
        if (e.tipo === 'proyectil') {
          const p = 1 - k; e.s.position.lerpVectors(e.desde, e.hasta, p); e.s.position.y += Math.sin(p * Math.PI) * 1.5; e.s.scale.setScalar(1 + Math.sin(t * 40) * .15);
          if (Math.random() < .7) e.rastro(e.s.position.clone());
        } else {
          if (e.g) e.v.y += e.g * dt;
          e.s.position.addScaledVector(e.v, dt);
          if (e.tipo === 'moneda') { e.s.rotation.z += e.gira * dt; if (e.s.position.y < e.suelo) { e.s.position.y = e.suelo; e.v.set(0, 0, 0); } }
          if (e.tipo === 'numero') e.v.multiplyScalar(Math.exp(-2 * dt));
          if (e.s.material) { e.s.material.opacity = e.tipo === 'moneda' ? Math.min(1, k * 3) : Math.min(1, k * 2.2); e.s.material.transparent = true; }
        }
        if (e.vida <= 0) { escena.remove(e.s); if (!e.s.isSprite) e.s.geometry?.dispose?.(); vivos.splice(i, 1); e.fin?.(); }
      }
    }
  };
}
