// =============================================================
//  JUNTOS EN LA CRIPTA (primera parte del cooperativo)
//  Los de tu sala que estén en esta misma cripta (misma semilla y nivel)
//  se ven paseando, ven lo que tú ves y comparten lo hecho: puertas abiertas,
//  monstruos caídos, salas registradas y tareas cumplidas. Cada uno pelea
//  sus combates, pero un monstruo con el que ya está peleando otro no te ataca.
//
//  Todo va en la ficha de cada jugador dentro de la sala (reunion/gente/<id>),
//  así no hace falta ningún sitio nuevo en la base de datos: cada uno publica
//  lo suyo y los demás lo juntan.
// =============================================================
import * as THREE from 'three';
import { crearHeroe } from './claro-personajes.js';

export function crearJuntos({ escena, ui, cripta, clave, heroe, H, def, combate, al }) {
  const OTROS = new Map();
  const hecho = { p: new Set(), m: new Set(), b: new Set(), f: new Set() };   // puertas, muertos, buscadas, flags
  const deFuera = { m: new Set() };                                             // monstruos que han caído en manos de otros
  let SALA = null, tPub = null, luchando = [];

  // ---------- lo mío ----------
  const datosHeroe = () => { const d = def(); return { nombre: d.nombre, raza: d.raza, clase: d.clase, colores: d.colores }; };
  function publicar() {
    if (!SALA || tPub) return;
    tPub = setTimeout(() => {
      tPub = null; if (!SALA) return;
      SALA.cambiar({ cripta: clave, hechos: JSON.stringify({ p: [...hecho.p], m: [...hecho.m], b: [...hecho.b], f: [...hecho.f] }), lucha: luchando.join(',') });
    }, 250);
  }
  const J = {
    get SALA() { return SALA; }, OTROS,
    anotar(tipo, v) { if (hecho[tipo].has(v)) return; hecho[tipo].add(v); publicar(); },
    luchar(ids) { luchando = ids; publicar(); },
    // ¿Este monstruo está ya peleando con otro de la sala?
    ocupado(id) { for (const o of OTROS.values()) if (o.lucha.includes(String(id))) return true; return false; },
    muertoFuera: (id) => deFuera.m.has(id),
    hayCompania: () => OTROS.size > 0
  };

  // ---------- el botón 👥 y la conexión (la sala es la de siempre, la del pueblo) ----------
  const b = document.createElement('button'); b.id = 'sala'; b.className = 'caja'; b.textContent = '👥'; b.setAttribute('aria-label', 'Jugar juntos'); document.querySelector('#hud').appendChild(b);
  import('./reunion.js').then((RED) => RED.crearPanel({
    donde: 'cripta', boton: b, proponer: false, datos: () => ({ clase: def().clase, x: H.pos.x, z: H.pos.z }),
    alConectar: (R) => { SALA = R; R.cambiar({ heroe: JSON.stringify(datosHeroe()) }); publicar(); R.on('gente', juntar).on('frase', decir); juntar(R.gente()); },
    alSalir: () => { SALA = null; juntar({}); }
  })).catch((e) => console.warn('Sin sala:', e?.message));

  // ---------- los demás ----------
  const aqui = (id, g) => id !== SALA?.yo.id && g.donde === 'cripta' && g.cripta === clave && g.online !== false;
  function juntar(gente) {
    for (const [id, o] of [...OTROS]) if (!gente[id] || !aqui(id, gente[id])) { o.pj.grupo.removeFromParent(); ui.quitar(o.rot); OTROS.delete(id); }
    for (const [id, g] of Object.entries(gente)) {
      if (!aqui(id, g)) continue;
      let o = OTROS.get(id);
      if (!o || o.heroe !== g.heroe) {
        if (o) { o.pj.grupo.removeFromParent(); ui.quitar(o.rot); }
        let h = {}; try { h = JSON.parse(g.heroe || '{}'); } catch { /* uno genérico */ }
        const pj = crearHeroe({ raza: h.raza || 'humano', clase: h.clase || g.clase || 'mago', colores: h.colores || {} });
        pj.grupo.position.set(g.x ?? H.pos.x, 0, g.z ?? H.pos.z); escena.add(pj.grupo);
        const luz = new THREE.PointLight('#ffcf8a', 4, 9, 1.5); luz.position.y = 2.2; pj.grupo.add(luz);   // cada uno lleva su antorcha
        o = { pj, heroe: g.heroe, rot: ui.rotulo(pj.grupo, h.nombre || g.nombre || 'Viajero', { altura: pj.altura + .25, sub: g.nombre }), tx: pj.grupo.position.x, tz: pj.grupo.position.z, lucha: [], celda: '' };
        OTROS.set(id, o);
        if (OTROS.size === 1) al.llega?.(h.nombre || g.nombre || 'Alguien');
      }
      o.tx = g.x ?? o.tx; o.tz = g.z ?? o.tz;
      o.lucha = String(g.lucha || '').split(',').filter(Boolean);
      let hs = null; try { hs = JSON.parse(g.hechos || 'null'); } catch { /* nada */ }
      if (hs) mezclar(hs);
    }
  }
  // Lo que han hecho los demás pasa también en tu cripta
  async function mezclar(hs) {
    for (const id of hs.p || []) if (!hecho.p.has(id)) { hecho.p.add(id); await al.puerta?.(id); }
    for (const id of hs.m || []) if (!hecho.m.has(id)) { hecho.m.add(id); deFuera.m.add(id); await al.muerto?.(id); }
    for (const r of hs.b || []) if (!hecho.b.has(r)) { hecho.b.add(r); al.buscada?.(r); }
    for (const f of hs.f || []) if (!hecho.f.has(f)) { hecho.f.add(f); await al.flag?.(f); }
  }
  function decir(id, texto) { const o = OTROS.get(id); if (o) ui.numero(o.pj.grupo.position.clone().add(new THREE.Vector3(0, o.pj.altura + .8, 0)), String(texto).slice(0, 40), '#fff8e6'); }

  // Cada fotograma: se mueven suaves, ven lo que tienen delante (y tú con ellos) y tú mandas tu sitio
  J.actualizar = (dt, t) => {
    for (const o of OTROS.values()) {
      const p = o.pj.grupo.position, dx = o.tx - p.x, dz = o.tz - p.z, d = Math.hypot(dx, dz);
      if (d > 8) { p.x = o.tx; p.z = o.tz; } else if (d > .05) { const v = Math.min(d, dt * 6.5); p.x += dx / d * v; p.z += dz / d * v; o.pj.mirarA(Math.atan2(dx, dz)); }
      o.pj.vel += ((d > .15 ? .75 : 0) - o.pj.vel) * Math.min(1, dt * 8); p.y = 0; o.pj.animar(dt, t);
      const [cx, cy] = cripta.deMundo(p), k = cx + ',' + cy;
      if (k !== o.celda) { o.celda = k; cripta.explorar(cx, cy); al.pisa?.(cx, cy); }
    }
    if (SALA && !combate.activo) SALA.mover(H.pos.x, H.pos.z, +heroe.grupo.rotation.y.toFixed(2));
  };
  return J;
}

// La invitación: cuando alguien de tu sala baja a una cripta, deja dicho adónde (para que los demás le sigan)
export const avisarBajada = (SALA, url) => SALA ? SALA.cambiar({ baja: JSON.stringify({ url, n: Date.now() }) }) : Promise.resolve();
