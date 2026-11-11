// =============================================================
//  LA ESCENA DEL RING: motor, cámara, luces, el ring con su público y su cartel,
//  y lo que se comparte (rótulos 3D, sonido, dados). ring.js la importa.
// =============================================================
import * as THREE from 'three';
import { toon, lienzo } from './claro-estilo.js';
import { crearDados } from './claro-dados.js';
import { crearUI3D } from './claro-ui3d.js';
import { crearSonido } from './claro-sonido.js';

const $ = (s) => document.querySelector(s);
export const MOVIL = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
// ---------- motor y escena: el ring ----------
export const render = new THREE.WebGLRenderer({ canvas: $('#lienzo'), antialias: !MOVIL });
render.setPixelRatio(Math.min(devicePixelRatio, MOVIL ? 1.6 : 2)); render.setSize(innerWidth, innerHeight);
render.shadowMap.enabled = true; render.outputColorSpace = THREE.SRGBColorSpace;
export const escena = new THREE.Scene(); escena.background = new THREE.Color('#1c1626'); escena.fog = new THREE.Fog('#1c1626', 18, 40);
export const camara = new THREE.PerspectiveCamera(MOVIL ? 58 : 46, innerWidth / innerHeight, .1, 100);
addEventListener('resize', () => { camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); render.setSize(innerWidth, innerHeight); });
escena.add(new THREE.HemisphereLight('#ffe8d0', '#2a2040', 1.4));
const foco = new THREE.SpotLight('#fff2d8', 120, 30, .6, .5, 1.4); foco.position.set(0, 12, 3); foco.castShadow = true; foco.shadow.mapSize.set(1024, 1024); escena.add(foco, foco.target);
for (const [x, c] of [[-7, '#ff6a8a'], [7, '#6ab0ff']]) { const l = new THREE.PointLight(c, 18, 16); l.position.set(x, 4, 2); escena.add(l); }

export const RING = 3.4;   // medio lado del ring
{
  const lona = new THREE.Mesh(new THREE.BoxGeometry(RING * 2 + .6, .5, RING * 2 + .6), toon('#3a5a8a')); lona.position.y = -.25; lona.receiveShadow = true; escena.add(lona);
  const centro = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), toon('#f4ecd8')); centro.rotation.x = -Math.PI / 2; centro.position.y = .01; escena.add(centro);
  const faldon = new THREE.Mesh(new THREE.BoxGeometry(RING * 2 + .7, .6, RING * 2 + .7), toon('#8a2a3a')); faldon.position.y = -.75; escena.add(faldon);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), toon('#2a2232')); suelo.rotation.x = -Math.PI / 2; suelo.position.y = -1.05; suelo.receiveShadow = true; escena.add(suelo);
  const esquinas = [[-1, -1, '#d84a4a'], [1, -1, '#4a7ad8'], [1, 1, '#d8d8d8'], [-1, 1, '#d8d8d8']];
  for (const [sx, sz, c] of esquinas) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, 1.6, 10), toon(c)); p.position.set(sx * RING, .8, sz * RING); p.castShadow = true; escena.add(p); }
  for (let k = 0; k < 4; k++) for (const h of [.55, 1.0, 1.45]) {   // las cuerdas
    const [ax, az] = esquinas[k], [bx, bz] = esquinas[(k + 1) % 4], len = Math.hypot(bx - ax, bz - az) * RING;
    if (k === 2) continue;   // la de delante, sin cuerdas: se ve mejor
    const cu = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, len, 6), toon(h === 1.0 ? '#f4ecd8' : '#d84a4a')); cu.rotation.z = Math.PI / 2; if (ax === bx) cu.rotation.set(Math.PI / 2, 0, 0);
    cu.position.set((ax + bx) / 2 * RING, h, (az + bz) / 2 * RING); escena.add(cu);
  }
  // el público: bultitos de colores que botan
  const n = 140, geo = new THREE.CapsuleGeometry(.28, .5, 3, 8), pub = new THREE.InstancedMesh(geo, toon('#ffffff'), n), m4 = new THREE.Matrix4(), cols = ['#e8b04a', '#c85a5a', '#5a8ac8', '#7ac85a', '#c87ab0', '#e8e0d0'];
  const sitios = []; for (let i = 0; i < n; i++) { const a = Math.PI * (.05 + Math.random() * .9) + Math.PI, r = 8 + Math.random() * 6; sitios.push([Math.cos(a) * r, -.4 + (r - 8) * .35, Math.sin(a) * r * .9 - 1, Math.random() * 6]); pub.setColorAt(i, new THREE.Color(cols[i % cols.length])); }
  escena.add(pub); escena.userData.publico = { pub, sitios, m4 };
  // el cartel
  const tx = lienzo(1024, 200, (x, w, h) => { x.fillStyle = '#2a1a2a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#ffd27a'; x.lineWidth = 12; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = '#ffd27a'; x.font = 'bold 96px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('EL RING DE CHATARRA', w / 2, h / 2 + 4); });
  const cartel = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.56), new THREE.MeshBasicMaterial({ map: tx })); cartel.position.set(0, 6.2, -7); escena.add(cartel);
}
export const ui = crearUI3D(escena, camara);
export const sonido = crearSonido({ entorno: 'cine' });
export const dados = crearDados(escena, { alSonar: (f) => sonido.dado?.(f), escala: MOVIL ? 1.3 : 1 });
addEventListener('pointerdown', () => sonido.arrancar?.(), { once: true });
