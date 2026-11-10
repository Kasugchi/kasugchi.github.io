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
//  En su turno, el compañero juega igual que en una pelea suya: la foto trae sus
//  botones y casillas («turno»), los dados que se tiran («dd») y los gestos de cada
//  muñeco («a»); sus toques vuelven en «orden». Si no hace nada en un minuto, pasa.
// =============================================================
import * as THREE from 'three';

export function crearPeleaJuntos({ escena, ui, hud, combate, dados, H, heroe, estado, def, sala, otros, fabricar, enemigosLocales, donde, alAcabar }) {
  const P = {};
  let ultimaFoto = '', tFoto = 0, publicando = false, finPublicado = null;
  const unidos = new Set();
  // lo que veo de las peleas de los demás: id del que pelea → { foto, anillo, fantasmas, ocultos }
  const ajenas = new Map();
  let dentro = null;               // { de, id } si estoy metido en la pelea de otro
  let pedida = null;               // { id, t } si he pisado un anillo y espero a entrar
  const ordenes = new Map();       // la última orden que he hecho caso de cada compañero (si la pelea es mía)
  let miTurno = null;              // { clave, fase, celdas, marcas } si me toca decidir en la pelea de otro

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
      if (g.orden && g.orden !== ordenes.get(id)) {   // lo que ha decidido en su turno
        ordenes.set(id, g.orden);
        let o = null; try { o = JSON.parse(g.orden); } catch { /* orden rota */ }
        if (o && o.id === combate.idPelea) combate.ordenRemota?.(id, o);
      }
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
        pj.objetivo = { x: u.x, z: u.z, ry: u.ry };
        gestos(pj, u);
        if (!u.v && !pj.muerto) {   // muere como en una pelea propia: se desmonta o se desploma y desaparece (nada de quedarse torcido)
          pj.muerto = true; pj.objetivo = null;
          if (pj.desmontar) pj.desmontar(pj.grupo.position.y); else { pj.caido = true; setTimeout(() => { pj.grupo.visible = false; }, 1500); }
        }
      } else if (u.b === 'heroe' || (u.uid && u.uid !== yo)) {
        const o = otros().get(u.b === 'heroe' ? id : u.uid);
        if (o) { o.pj.enPelea = true; o.tx = u.x; o.tz = u.z; o.pj.caido = !u.v; gestos(o.pj, u); }
      }
    });
    // ¿estoy yo dentro?
    const mio = f.u.find((u) => u.uid && u.uid === yo);
    if (mio) {
      if (!dentro) { dentro = { de: id, id: f.id }; pedida = null; H.bloqueado = true; H.destino = null; hud.banner('¡Entras en la pelea!', 'heroe'); ui.quitar(A.cartel); A.cartel = null; /* el «pisa el anillo» ya no hace falta */ }
      dentro.ir = { x: mio.x, z: mio.z, ry: mio.ry };   // se anda hasta allí poco a poco (cada fotograma), sin saltitos
      gestos(heroe(), mio);
      if (estado.cuerpo !== Math.max(0, mio.c)) { estado.cuerpo = Math.max(0, mio.c); hud.actualizar(); }
      heroe().caido = !mio.v;
      if (f.turno?.uid === yo) verMiTurno(f);
      else { quitarMiTurno(); hud.narrar(f.de === 'heroe' ? `Turno de ${A.nombre}. Luego te toca a ti.` : f.de && f.de !== 'enemigos' ? `Turno de ${f.de}…` : f.texto || ''); }
    }
    // los dados: la misma tirada, con las mismas caras, en el mismo sitio
    if (f.dd && dados) {
      if (A.tirada == null) A.tirada = f.dd.n;   // al llegar, la tirada vieja no se repite
      else if (f.dd.n > A.tirada) { A.tirada = f.dd.n; const v = (a) => a && new THREE.Vector3(a[0], a[1], a[2]); dados.tirar(f.dd.tipo, f.dd.res.length, v(f.dd.c), v(f.dd.d), f.dd.res); }
    }
  }
  // El gesto que ha hecho cada muñeco en la pantalla del que manda (golpe, disparar, rugir…) y lo que le han quitado
  function gestos(pj, u) {
    if (u.a && pj._visto !== u.a[0]) { const nuevo = pj._visto != null; pj._visto = u.a[0]; if (nuevo) pj.hacer?.(u.a[1], u.a[2]); }
    if (pj._vida != null && u.c < pj._vida) ui.numero(pj.grupo.position.clone().add(new THREE.Vector3(0, (pj.altura || 1.6) + .3, 0)), `-${pj._vida - u.c}`, '#ff6a6a');
    pj._vida = u.c;
  }
  // ---------- mi turno en la pelea de otro: los mismos botones y casillas que en una pelea mía ----------
  const ordenar = (o) => sala()?.cambiar({ orden: JSON.stringify({ id: dentro?.id, n: miTurno?.n, k: Date.now(), ...o }) });
  const COLOR = { mover: '#2a8cff', objetivo: '#ff4a3a', hechizo: '#ff9a3a' };
  function verMiTurno(f) {
    const T = f.turno;
    if (miTurno?.n === T.n) return;
    const primera = !miTurno?.n;
    quitarMiTurno();
    miTurno = { n: T.n, celdas: T.celdas || [], marcas: new THREE.Group(), mats: [] };
    const aro = new THREE.RingGeometry(.3, .44, 24), punto = new THREE.CircleGeometry(.3, 20);
    for (const [x, z, tipo] of miTurno.celdas) {
      const col = COLOR[tipo] || COLOR.mover, mA = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .85, depthWrite: false }), mP = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .3, depthWrite: false });
      miTurno.mats.push(mA);
      for (const [g, m] of [[aro, mA], [punto, mP]]) { const k = new THREE.Mesh(g, m); k.rotation.x = -Math.PI / 2; k.position.set(x, (T.y || H.pos.y) + .22, z); miTurno.marcas.add(k); }
    }
    escena.add(miTurno.marcas);
    if (primera) hud.banner('¡Te toca!', 'heroe');
    if (T.texto) hud.narrar(T.texto);
    hud.acciones(T.botones || [], (id) => {
      if (miTurno?.enviado) return;
      // lo que gasta en su pantalla (pociones y usos) se descuenta también aquí
      if (id === 'pocion') { estado.pociones = Math.max(0, estado.pociones - 1); hud.actualizar(); }
      miTurno.enviado = true; ordenar({ tipo: 'boton', b: id }); hud.acciones([]);   /* «b» y no «id»: «id» es el de la pelea */
    });
  }
  function quitarMiTurno() {
    if (!miTurno?.marcas) return;
    escena.remove(miTurno.marcas); hud.acciones([]);
    miTurno = { n: miTurno.n };   // recuerda el número: no vuelvas a mostrar el mismo
  }
  // Un toque en el suelo mientras estoy dentro de una pelea ajena (true: me lo quedo yo)
  P.tocar = (p) => {
    if (!dentro) return false;
    if (!miTurno?.celdas?.length || miTurno.enviado || !p) return true;
    let c = null, d = 1e9; for (const [x, z] of miTurno.celdas) { const e = Math.hypot(x - p.x, z - p.z); if (e < d) { d = e; c = [x, z]; } }
    if (!c || d > .9) return true;
    ui.chispas(new THREE.Vector3(c[0], H.pos.y + .3, c[1]), '#ffffff', 10, 1.5);
    miTurno.enviado = true; ordenar({ tipo: 'tocar', x: c[0], z: c[1] }); return true;
  };
  function quitarAjena(id) {
    const A = ajenas.get(id); if (!A) return;
    escena.remove(A.anillo.g); if (A.cartel) ui.quitar(A.cartel);
    for (const pj of A.fantasmas.values()) escena.remove(pj.grupo);
    for (const pj of A.ocultos) pj.grupo.visible = true;
    for (const o of otros().values()) { o.pj.enPelea = false; o.pj.caido = false; }
    ajenas.delete(id);
  }
  async function acabarAjena(id, f) {
    const yoDentro = dentro && dentro.de === id;
    quitarAjena(id);
    if (!yoDentro) return;
    quitarMiTurno(); miTurno = null; dados?.limpiar?.();
    dentro = null; heroe().caido = false; H.bloqueado = false;
    sala()?.cambiar({ unirse: '', pjPelea: '', orden: '' });
    const yo = (f.companeros || []).find((c) => c.uid === sala()?.yo.id);
    if (yo) { estado.cuerpo = Math.max(1, yo.c); if (yo.usos != null) estado.usos = yo.usos; if (yo.pociones != null) estado.pociones = yo.pociones; hud.actualizar(); }
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
    if (miTurno?.mats) for (const m of miTurno.mats) m.opacity = .6 + Math.sin(t * 5) * .25;
    if (dentro?.ir) {   // mi héroe va hacia donde le pone la pelea, andando
      const o = dentro.ir, dx = o.x - H.pos.x, dz = o.z - H.pos.z, d = Math.hypot(dx, dz);
      if (d > 4) { H.pos.x = o.x; H.pos.z = o.z; }
      else if (d > .03) { const v = Math.min(d, dt * 4.5); H.pos.x += dx / d * v; H.pos.z += dz / d * v; heroe().mirarA(Math.atan2(dx, dz)); heroe().vel = .75; }
      else heroe().mirarA(o.ry);
    }
    for (const A of ajenas.values()) {
      A.anillo.aro.rotation.z += dt * .4; A.anillo.aro.material.opacity = .55 + Math.sin(t * 3) * .2;
      for (const pj of A.fantasmas.values()) {
        const o = pj.objetivo; if (!o) { pj.animar?.(dt, t); continue; }   // el que ha caído sigue su animación de caer
        const p = pj.grupo.position, dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz);
        if (d > .03) { const v = Math.min(d, dt * 5); p.x += dx / d * v; p.z += dz / d * v; }
        pj.vel = d > .1 ? .8 : 0; if (pj.mirarA) pj.mirarA(o.ry); else pj.grupo.rotation.y = o.ry; p.y = H.pos.y; pj.animar?.(dt, t);
      }
      // pisar el anillo: pedir entrar
      const f = A.foto, dd = Math.hypot(H.pos.x - f.cx, H.pos.z - f.cz);
      if (!dentro && !combate.activo && !H.bloqueado && dd < f.r && estado.cuerpo > 0 && (!pedida || pedida.id !== f.id || t - pedida.t > 4)) {
        pedida = { id: f.id, t };
        sala()?.cambiar({ unirse: f.id, pjPelea: JSON.stringify({ nombre: def().nombre || 'Compañero', cuerpo: estado.cuerpo, max: estado.max, ataque: estado.ataque, defensa: estado.defensa, mover: 6 + (estado.pasosExtra || 0), alcance: def().clase === 'explorador' ? 5 : 1,
          est: { habilidad: estado.habilidad, usos: estado.usos, pociones: estado.pociones, pasosExtra: estado.pasosExtra || 0, hab: estado.hab || {} } }) });
        hud.narrar(`Entras en el círculo de ${A.nombre}…`);
      }
    }
  };
  P.dentro = () => !!dentro;
  return P;
}
