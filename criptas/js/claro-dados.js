// =============================================================
//  EL CLARO · DADOS 3D: los de combate de siempre (3 calaveras,
//  2 escudos blancos y 1 escudo negro) y los rojos de movimiento.
//  Se lanzan sobre el tablero, botan, ruedan y se quedan mostrando
//  la cara que ha salido. El resultado se decide antes de tirar y la
//  animación «cae» en él: así nunca hay discusiones con la física.
// =============================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/addons/geometries/RoundedBoxGeometry.js';
import { lienzo } from './claro-estilo.js';

// Orden de las caras de una caja en three: +x, -x, +y, -y, +z, -z
const NORMALES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map((n) => new THREE.Vector3(...n));
const CARAS_COMBATE = ['calavera', 'calavera', 'calavera', 'escudoB', 'escudoB', 'escudoN'];

function calavera(x, w, col) {
  x.fillStyle = col; x.beginPath(); x.arc(w / 2, w * .44, w * .25, 0, Math.PI * 2); x.fill();
  x.fillRect(w * .36, w * .55, w * .28, w * .17);
  x.fillStyle = '#f4ecd8'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(w / 2 + s * w * .1, w * .43, w * .065, w * .08, 0, 0, Math.PI * 2); x.fill(); }
  x.beginPath(); x.moveTo(w / 2, w * .5); x.lineTo(w * .47, w * .56); x.lineTo(w * .53, w * .56); x.fill();
  for (let i = 0; i < 3; i++) x.fillRect(w * (.4 + i * .075), w * .64, w * .035, w * .08);
}
function escudo(x, w, relleno) {
  x.beginPath(); x.moveTo(w * .28, w * .26); x.quadraticCurveTo(w / 2, w * .2, w * .72, w * .26); x.lineTo(w * .7, w * .5); x.quadraticCurveTo(w * .66, w * .7, w / 2, w * .8); x.quadraticCurveTo(w * .34, w * .7, w * .3, w * .5); x.closePath();
  x.lineWidth = w * .05; x.strokeStyle = '#1e1622'; x.stroke(); if (relleno) { x.fillStyle = '#1e1622'; x.fill(); }
  else { x.beginPath(); x.moveTo(w / 2, w * .3); x.lineTo(w / 2, w * .72); x.moveTo(w * .36, w * .45); x.lineTo(w * .64, w * .45); x.lineWidth = w * .035; x.stroke(); }
}
function cara(tipo) {
  const roja = typeof tipo === 'number';
  return lienzo(128, 128, (x, w) => {
    x.fillStyle = roja ? '#c8343a' : '#f4ecd8'; x.fillRect(0, 0, w, w);
    x.strokeStyle = roja ? '#8e1f26' : '#c9b99a'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, w - 8);
    if (roja) {
      const P = { 1: [[.5, .5]], 2: [[.28, .28], [.72, .72]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.28, .28], [.72, .28], [.28, .72], [.72, .72]], 5: [[.26, .26], [.74, .26], [.5, .5], [.26, .74], [.74, .74]], 6: [[.28, .24], [.72, .24], [.28, .5], [.72, .5], [.28, .76], [.72, .76]] }[tipo];
      x.fillStyle = '#fff4e8'; for (const [a, b] of P) { x.beginPath(); x.arc(a * w, b * w, w * .085, 0, Math.PI * 2); x.fill(); }
    } else if (tipo === 'calavera') calavera(x, w, '#1e1622');
    else escudo(x, w, tipo === 'escudoN');
  });
}
const mats = new Map();
const matCara = (tipo) => { if (!mats.has(tipo)) mats.set(tipo, new THREE.MeshStandardMaterial({ map: cara(tipo), roughness: .45, metalness: 0 })); return mats.get(tipo); };

export function crearDados(escena, { alSonar } = {}) {
  const geo = new RoundedBoxGeometry(.5, .5, .5, 4, .09);
  let enJuego = [];

  function dado(tipo) {
    const caras = tipo === 'mover' ? [1, 6, 2, 5, 3, 4] : CARAS_COMBATE;   // caras opuestas suman 7 en los rojos
    const m = new THREE.Mesh(geo, caras.map(matCara)); m.castShadow = true; m.userData.caras = caras;
    escena.add(m); return m;
  }
  // Giro final para que la cara «i» mire arriba, con un giro de yaw al azar
  const giroFinal = (i) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2).multiply(new THREE.Quaternion().setFromUnitVectors(NORMALES[i], new THREE.Vector3(0, 1, 0)));

  return {
    // Tira n dados alrededor de «centro». Devuelve los resultados cuando han parado.
    tirar(tipo, n, centro, desde) {
      this.limpiar();
      const res = [], anims = [];
      for (let k = 0; k < n; k++) {
        const m = dado(tipo), caras = m.userData.caras, i = Math.floor(Math.random() * 6);
        res.push(caras[i]);
        const lado = (k - (n - 1) / 2) * .75, destino = centro.clone().add(new THREE.Vector3(lado, .25, (Math.random() - .5) * .4));
        const origen = (desde || centro.clone().add(new THREE.Vector3(0, 0, 4))).clone().add(new THREE.Vector3(lado * .5, 2.2 + Math.random() * .5, 0));
        m.position.copy(origen); m.quaternion.setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
        anims.push({ m, origen, destino, fin: giroFinal(i), w: new THREE.Vector3((Math.random() - .5) * 26, (Math.random() - .5) * 18, (Math.random() - .5) * 26), t: -k * .07, dur: 1.05 + Math.random() * .2, botes: new Set() });
      }
      enJuego = anims;
      return new Promise((listo) => { this._listo = () => listo(res); });
    },
    limpiar() { for (const a of enJuego) escena.remove(a.m); enJuego = []; },
    actualizar(dt) {
      if (!enJuego.length) return;
      let todos = true;
      for (const a of enJuego) {
        a.t += dt; if (a.t < 0) { todos = false; continue; }
        const p = Math.min(1, a.t / a.dur);
        if (p < 1) todos = false;
        // vuelo con dos botes: la altura sigue arcos cada vez más bajos
        const xz = 1 - Math.pow(1 - p, 2.2);
        a.m.position.x = a.origen.x + (a.destino.x - a.origen.x) * xz;
        a.m.position.z = a.origen.z + (a.destino.z - a.origen.z) * xz;
        let y;
        if (p < .45) { const q = p / .45; y = a.origen.y + (a.destino.y - a.origen.y) * q * q; }
        else if (p < .75) { const q = (p - .45) / .3; y = a.destino.y + Math.sin(q * Math.PI) * .55; if (!a.botes.has(1)) { a.botes.add(1); alSonar?.(1); } }
        else { const q = (p - .75) / .25; y = a.destino.y + Math.sin(Math.min(1, q * 1.4) * Math.PI) * .14; if (!a.botes.has(2)) { a.botes.add(2); alSonar?.(.5); } }
        a.m.position.y = y;
        if (p < .7) { const d = 1 - p / .7; a.m.rotateX(a.w.x * dt * d); a.m.rotateY(a.w.y * dt * d); a.m.rotateZ(a.w.z * dt * d); }
        else a.m.quaternion.slerp(a.fin, Math.min(1, dt * 14));
        if (p >= 1 && !a.marcado) { a.marcado = true; a.m.quaternion.copy(a.fin); alSonar?.(.25); }
      }
      if (todos && this._listo) { const f = this._listo; this._listo = null; setTimeout(f, 250); }
    }
  };
}
