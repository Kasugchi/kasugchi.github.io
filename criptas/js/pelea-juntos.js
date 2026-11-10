// =============================================================
//  PELEAR JUNTOS (a lo Wizard101)
//  Cuando alguien de la sala empieza un combate, los demás que están en el
//  mismo sitio ven su círculo en el suelo, con los monstruos y la pelea en
//  marcha. Si no hacen nada, no se involucran. Si pisan el anillo, su héroe
//  entra en el tablero y pelea al lado del que lo empezó.
//
//  Manda la pelea el móvil del que la empezó (los dados, los monstruos):
//  publica una foto de la pelea en su ficha de la sala («pelea») y los que
//  entran dejan dicho en la suya «unirse» y sus números («pjPelea»).
//  De momento el compañero pelea solo (se acerca y pega); el control a mano
//  llegará en la siguiente tanda.
// =============================================================
import * as THREE from 'three';

export function crearPeleaJuntos({ escena, ui, hud, combate, H, heroe, estado, def, sala, otros, fabricar, enemigosLocales, donde, alAcabar }) {
  const P = {};
  let ultimaFoto = '', tFoto = 0, publicando = false, finPublicado = null;
  const unidos = new Set();
  // lo que veo de las peleas de los demás: id del que pelea → { foto, anillo, fantasmas, ocultos }
  const ajenas = new Map();
  let dentro = null;               // { de, id } si estoy metido en la pelea de otro
  let pedida = null;               // { id, t } si he pisado un anillo y espero a entrar

  // ---------- si la pelea es mía: publicar la foto y meter a los que pisan ----------
  function publicar(dt) {
    const S = sala(); if (!S) return;
    if (combate.activo) {
      publicando = true; finPublicado = null;
      if ((tFoto -= dt) > 0) return; tFoto = .25;
      const f = combate.instantanea(); if (!f) return;
      const txt = JSON.stringify({ ...f, d: donde(), texto: document.querySelector('#narrar')?.textContent?.slice(0, 120) || '' });
      if (txt !== ultimaFoto) { ultimaFoto = txt; S.cambiar({ pelea: txt }); }
    } else if (publicando) {
      publicando = false; unidos.clear();
      const fin = combate.final; if (!fin) { S.cambiar({ pelea: '' }); return; }
      S.cambiar({ pelea: JSON.stringify({ ...fin, d: donde(), acabada: true }) });
      finPublicado = setTimeout(() => { if (!combate.activo) sala()?.cambiar({ pelea: '' }); }, 6000);
    }
  }
  function mirarQuienEntra(gente) {
    if (!combate.activo || !combate.idPelea) return;
    for (const [id, g] of Object.entries(gente)) {
      if (id === sala()?.yo.id || g.unirse !== combate.idPelea || unidos.has(id)) continue;
      const o = otros().get(id); if (!o) continue;
      let d = null; try { d = JSON.parse(g.pjPelea || 'null'); } catch { /* sin datos */ }
      if (!d) continue;
      unidos.add(id);
      combate.unirRemoto({ uid: id, pj: o.pj, ...d });
    }
  }

  // ---------- si la pelea es de otro: verla y poder entrar ----------
  function anilloDe(f) {
    const g = new THREE.Group();
    const aro = new THREE.Mesh(new THREE.RingGeometry(f.r - .35, f.r, 72), new THREE.MeshBasicMaterial({ color: '#c9a2ff', transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    aro.rotation.x = -Math.PI / 2; aro.position.y = .2; g.add(aro);
    const cupula = new THREE.Mesh(new THREE.SphereGeometry(f.r, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#b48aff', transparent: true, opacity: .07, side: THREE.DoubleSide, depthWrite: false }));
    cupula.scale.y = .35; g.add(cupula);
    g.position.set(f.cx, H.pos.y, f.cz); escena.add(g);
    return { g, aro, cupula };
  }
  function verAjena(id, f, nombre) {
    let A = ajenas.get(id);
    if (!A || A.foto.id !== f.id) {
      if (A) quitarAjena(id);
      A = { foto: f, fantasmas: new Map(), ocultos: [], nombre };
      A.anillo = anilloDe(f);
      A.cartel = ui.rotulo(A.anillo.g, `⚔️ Pelea de ${nombre}: pisa el anillo para entrar`, { altura: 3.2 });
      // los monstruos de mi mundo que están en esa pelea se esconden: los muestra la foto
      for (const pj of enemigosLocales()) { const p = pj.grupo.position; if (pj.grupo.visible && Math.hypot(p.x - f.cx, p.z - f.cz) < f.r + 3) { pj.grupo.visible = false; A.ocultos.push(pj); } }
      ajenas.set(id, A);
    }
    A.foto = f;
    const yo = sala()?.yo.id;
    f.u.forEach((u, k) => {
      if (u.b === 'enemigo') {
        const clave = u.id ?? 'k' + k;
        let pj = A.fantasmas.get(clave);
        if (!pj) { pj = fabricar(u.t, u.j); pj.grupo.position.set(u.x, 0, u.z); escena.add(pj.grupo); A.fantasmas.set(clave, pj); }
        pj.objetivo = { x: u.x, z: u.z, ry: u.ry }; pj.caido = !u.v;
      } else if (u.b === 'heroe' || (u.uid && u.uid !== yo)) {
        const o = otros().get(u.b === 'heroe' ? id : u.uid);
        if (o) { o.pj.enPelea = true; o.tx = u.x; o.tz = u.z; o.pj.caido = !u.v; }
      }
    });
    // ¿estoy yo dentro?
    const mio = f.u.find((u) => u.uid && u.uid === yo);
    if (mio) {
      if (!dentro) { dentro = { de: id, id: f.id }; pedida = null; H.bloqueado = true; H.destino = null; hud.banner('¡Entras en la pelea!', 'heroe'); }
      H.pos.x = mio.x; H.pos.z = mio.z; heroe().grupo.rotation.y = mio.ry;
      if (estado.cuerpo !== Math.max(0, mio.c)) { estado.cuerpo = Math.max(0, mio.c); hud.actualizar(); }
      heroe().caido = !mio.v;
      if (f.texto) hud.narrar(f.texto);
    }
  }
  function quitarAjena(id) {
    const A = ajenas.get(id); if (!A) return;
    escena.remove(A.anillo.g); ui.quitar(A.cartel);
    for (const pj of A.fantasmas.values()) escena.remove(pj.grupo);
    for (const pj of A.ocultos) pj.grupo.visible = true;
    for (const o of otros().values()) { o.pj.enPelea = false; o.pj.caido = false; }
    ajenas.delete(id);
  }
  async function acabarAjena(id, f) {
    const yoDentro = dentro && dentro.de === id;
    quitarAjena(id);
    if (!yoDentro) return;
    dentro = null; heroe().caido = false; H.bloqueado = false;
    sala()?.cambiar({ unirse: '', pjPelea: '' });
    const yo = (f.companeros || []).find((c) => c.uid === sala()?.yo.id);
    if (yo) { estado.cuerpo = Math.max(1, yo.c); hud.actualizar(); }
    hud.narrar('');
    await alAcabar?.({ fin: f.fin, caidos: f.caidos || [], ids: f.ids || [], caiste: yo && !yo.v });
  }
  P.gente = (gente) => {
    mirarQuienEntra(gente);
    const yo = sala()?.yo.id, vistas = new Set();
    for (const [id, g] of Object.entries(gente)) {
      if (id === yo || !g.pelea || g.online === false) continue;
      let f = null; try { f = JSON.parse(g.pelea); } catch { continue; }
      if (!f || f.d !== donde()) continue;
      vistas.add(id);
      if (f.acabada) { if (ajenas.has(id) || dentro?.de === id) acabarAjena(id, f); continue; }
      let n = g.nombre || 'alguien'; try { n = JSON.parse(g.heroe || '{}').nombre || n; } catch { /* nombre de la sala */ }
      verAjena(id, f, n);
    }
    for (const id of [...ajenas.keys()]) if (!vistas.has(id)) acabarAjena(id, { fin: 'cortada', companeros: [] });   // se fue o se cortó
  };

  // ---------- cada fotograma ----------
  P.actualizar = (dt, t) => {
    publicar(dt);
    for (const A of ajenas.values()) {
      A.anillo.aro.rotation.z += dt * .4; A.anillo.aro.material.opacity = .55 + Math.sin(t * 3) * .2;
      for (const pj of A.fantasmas.values()) {
        const o = pj.objetivo; if (!o) continue;
        const p = pj.grupo.position, dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz);
        if (d > .03) { const v = Math.min(d, dt * 5); p.x += dx / d * v; p.z += dz / d * v; }
        pj.vel = d > .1 ? .8 : 0; pj.grupo.rotation.y = o.ry; p.y = H.pos.y; pj.animar?.(dt, t);
      }
      // pisar el anillo: pedir entrar
      const f = A.foto, dd = Math.hypot(H.pos.x - f.cx, H.pos.z - f.cz);
      if (!dentro && !combate.activo && !H.bloqueado && dd < f.r && estado.cuerpo > 0 && (!pedida || pedida.id !== f.id || t - pedida.t > 4)) {
        pedida = { id: f.id, t };
        sala()?.cambiar({ unirse: f.id, pjPelea: JSON.stringify({ nombre: def().nombre || 'Compañero', cuerpo: estado.cuerpo, max: estado.max, ataque: estado.ataque, defensa: estado.defensa, mover: 6 + (estado.pasosExtra || 0), alcance: def().clase === 'explorador' ? 5 : 1 }) });
        hud.narrar(`Entras en el círculo de ${A.nombre}…`);
      }
    }
  };
  P.dentro = () => !!dentro;
  return P;
}
