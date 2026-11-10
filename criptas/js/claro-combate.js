// =============================================================
//  EL CLARO · CÍRCULO DE COMBATE: cuando tocas a un grupo de enemigos,
//  el suelo se convierte en el tablero de HeroQuest allí mismo (las
//  losas brotan una a una, siguiendo el terreno) y se juega por turnos
//  con las reglas de siempre: dados rojos para moverse, calaveras para
//  pegar, escudos blancos (héroe) o negros (monstruos) para parar.
// =============================================================
import * as THREE from 'three';
import { toon, lienzo } from './claro-estilo.js';
import { crearTorreta } from './claro-personajes.js';

const T = 1.3, N = 9, MEDIO = (N - 1) / 2;    // tamaño de casilla y del tablero (9×9)
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const FRASES = {
  falloHeroe: ['El esqueleto hace un quiebro de cadera. Literalmente: se le sale.', 'Fallas. El esqueleto se ríe con la mandíbula.', 'Ni rozarle. Hay mucho hueco entre costilla y costilla.'],
  falloEsq: ['Te tira un tajo oxidado… y pasa de largo.', 'El esqueleto falla. Se le ha ido el hombro.', 'Paras el golpe con elegancia. Bueno, con suerte.'],
  muereEsq: ['¡Se desmonta! Un puzle de huesos para el que quiera.', '¡Al suelo! Montoncito de huesos.', '¡Crac! Ya no se levanta. Ni aunque quiera.'],
};
const una = (l) => l[Math.floor(Math.random() * l.length)];

export function crearCombate({ escena, mundo, ui, dados, sonido, camara, hud, heroe, estado }) {
  const C = { activo: false };
  let tablero = null, unidades = [], casillas = [], resolver = null, modoEleccion = null, alcanzables = new Map(), anillo = null, tiempo = 0;
  let G = null;   // la rejilla del combate: { celda(i, j), pasa(a, b) } (el círculo del claro o la propia mazmorra)
  const tweens = [];

  // ---------- el tablero ----------
  function montar(centro) {
    if (mundo.tableroCombate) {   // en la mazmorra el suelo ya es el tablero: solo hace falta poder iluminar casillas
      G = mundo.tableroCombate(); casillas = G.casillas;
      const libres = casillas.filter((c) => !c.tapada);
      const brillo = new THREE.InstancedMesh(new THREE.PlaneGeometry(G.T * .86, G.T * .86).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55, depthWrite: false }), libres.length);
      brillo.renderOrder = 3; libres.forEach((c, k) => { c.k = k; });
      const g = new THREE.Group(); g.add(brillo); escena.add(g);
      tablero = { g, brillo, libres, externo: true, cx: centro.x, cz: centro.z, y0: 0, nacer: 9 };
      pintar(); return;
    }
    G = { celda: (i, j) => (i >= 0 && j >= 0 && i < N && j < N ? casillas[i * N + j] : null), pasa: () => true };
    const cx = Math.round(centro.x / T) * T, cz = Math.round(centro.z / T) * T, y0 = mundo.alturaEn(cx, cz);
    casillas = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = cx + (i - MEDIO) * T, z = cz + (j - MEDIO) * T, y = mundo.alturaEn(x, z);
      const tapada = mundo.obstaculos.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + .6) || Math.abs(y - y0) > 1.6 || Math.hypot(i - MEDIO, j - MEDIO) > MEDIO + .7;
      casillas.push({ i, j, x, y, z, tapada });
    }
    const libres = casillas.filter((c) => !c.tapada);
    const geo = new THREE.BoxGeometry(T * .94, .14, T * .94), mat = toon('#cfc2a8');
    const losas = new THREE.InstancedMesh(geo, mat, libres.length); losas.receiveShadow = true;
    libres.forEach((c, k) => { c.k = k; losas.setColorAt(k, new THREE.Color((c.i + c.j) % 2 ? '#d9cdb2' : '#bfb196')); });
    const marco = new THREE.InstancedMesh(new THREE.BoxGeometry(T * .99, .1, T * .99), toon('#6a5b72'), libres.length);
    const brillo = new THREE.InstancedMesh(new THREE.PlaneGeometry(T * .86, T * .86).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55, depthWrite: false }), libres.length);
    brillo.renderOrder = 3;
    const g = new THREE.Group(); g.add(marco, losas, brillo); escena.add(g);
    // el aro de runas que rodea el círculo
    const tx = lienzo(1024, 64, (x, w, h) => { x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, w, h); x.font = '44px serif'; x.fillStyle = '#e2c8ff'; x.textBaseline = 'middle'; const s = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'; for (let i = 0; i < 26; i++) x.fillText(s[i % s.length], i * 39 + 4, h / 2); });
    tx.wrapS = THREE.RepeatWrapping; tx.repeat.x = 3;
    anillo = new THREE.Mesh(new THREE.RingGeometry(MEDIO * T + 1, MEDIO * T + 1.9, 96, 1), new THREE.MeshBasicMaterial({ map: tx, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, color: '#c9a2ff' }));
    // mapear la textura a lo largo del aro
    const uv = anillo.geometry.attributes.uv, pa = anillo.geometry.attributes.position;
    for (let i = 0; i < uv.count; i++) { const a = Math.atan2(pa.getY(i), pa.getX(i)); uv.setXY(i, (a / Math.PI / 2 + .5), Math.hypot(pa.getX(i), pa.getY(i)) > MEDIO * T + 1.45 ? 1 : 0); }
    anillo.rotation.x = -Math.PI / 2; anillo.position.set(cx, y0 + .25, cz); anillo.scale.setScalar(.01); escena.add(anillo);
    tablero = { g, losas, marco, brillo, libres, cx, cz, y0, nacer: 0 };
    pintar();
  }
  // Dibuja las losas: brotan desde el centro y se iluminan las alcanzables
  const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), v3 = new THREE.Vector3(), esc = new THREE.Vector3();
  function pintar() {
    if (!tablero) return;
    const { losas, marco, brillo, libres, nacer } = tablero;
    if (tablero.externo) {
      for (const c of libres) { const a = alcanzables.get(c), sel = modoEleccion && a; esc.setScalar(sel ? 1 : .0001); brillo.setMatrixAt(c.k, m4.compose(v3.set(c.x, c.y + .07, c.z), q0, esc)); if (sel) brillo.setColorAt(c.k, new THREE.Color(a === 'objetivo' ? '#ff6a5a' : a === 'hechizo' ? '#ffa24a' : '#7fe0ff')); }
      brillo.instanceMatrix.needsUpdate = true; if (brillo.instanceColor) brillo.instanceColor.needsUpdate = true; return;
    }
    for (const c of libres) {
      const d = Math.hypot(c.i - MEDIO, c.j - MEDIO), k = Math.max(0, Math.min(1, nacer * 2.2 - d * .28)), s = k < 1 ? 1 - Math.pow(1 - k, 3) * 1 + Math.sin(k * Math.PI) * .15 : 1;
      esc.set(s, s, s);
      losas.setMatrixAt(c.k, m4.compose(v3.set(c.x, c.y + .1 + (1 - k) * -.6, c.z), q0, esc));
      marco.setMatrixAt(c.k, m4.compose(v3.set(c.x, c.y + .02 + (1 - k) * -.6, c.z), q0, esc));
      const a = alcanzables.get(c), sel = modoEleccion && a;
      esc.setScalar(sel ? 1 : 0.0001);
      brillo.setMatrixAt(c.k, m4.compose(v3.set(c.x, c.y + .19, c.z), q0, esc));
      if (sel) brillo.setColorAt(c.k, new THREE.Color(a === 'objetivo' ? '#ff6a5a' : a === 'hechizo' ? '#ffa24a' : '#7fe0ff'));
    }
    losas.instanceMatrix.needsUpdate = marco.instanceMatrix.needsUpdate = brillo.instanceMatrix.needsUpdate = true;
    if (brillo.instanceColor) brillo.instanceColor.needsUpdate = true;
  }
  const libre = (c, ignorar) => c && !c.tapada && !unidades.some((u) => u.vivo && u !== ignorar && u.c === c);
  const vecinos = (c) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => G.celda(c.i + a, c.j + b)).filter((x) => x && G.pasa(c, x));   // sin atravesar paredes
  // Camino más corto (anchura) desde c hasta lo que cumpla «meta», sin atravesar a nadie
  function caminos(origen, max, quien) {
    const dist = new Map([[origen, 0]]), prev = new Map(), cola = [origen];
    while (cola.length) { const c = cola.shift(), d = dist.get(c); if (d >= max) continue; for (const v of vecinos(c)) if (!dist.has(v) && libre(v, quien)) { dist.set(v, d + 1); prev.set(v, c); cola.push(v); } }
    return { dist, prev, ruta: (dest) => { const r = []; let c = dest; while (c && c !== origen) { r.unshift(c); c = prev.get(c); } return r; } };
  }
  const pegados = (a, b) => vecinos(a.c).includes(b.c);
  function masCercana(x, z, quien) { let mejor = null, d = 1e9; for (const c of casillas) if (libre(c, quien)) { const e = Math.hypot(c.x - x, c.z - z); if (e < d) { d = e; mejor = c; } } return mejor; }

  // ---------- movimiento animado ----------
  function andar(u, ruta, porPaso = .26) {
    return new Promise(async (fin) => {
      for (const c of ruta) {
        const desde = u.pj.grupo.position.clone(), hasta = new THREE.Vector3(c.x, c.y + .17, c.z);
        u.pj.mirarA(Math.atan2(hasta.x - desde.x, hasta.z - desde.z)); u.pj.vel = 1;
        await new Promise((r) => tweens.push({ t: 0, dur: porPaso, f: (p) => u.pj.grupo.position.lerpVectors(desde, hasta, p), fin: r }));
        u.c = c; sonido.paso();
      }
      u.pj.vel = 0; fin();
    });
  }
  const mirarse = (a, b) => a.pj.mirarA(Math.atan2(b.pj.grupo.position.x - a.pj.grupo.position.x, b.pj.grupo.position.z - a.pj.grupo.position.z));
  const sobre = (u, h = 1.2) => u.pj.grupo.position.clone().add(new THREE.Vector3(0, h, 0));
  function mesaDados(a, b) {    // donde caen los dados: entre los dos, un poco hacia la cámara
    const m = a.pj.grupo.position.clone().lerp(b.pj.grupo.position, .5), hacia = camara.position.clone().sub(m).setY(0).normalize();
    return { centro: m.add(hacia.multiplyScalar(1.4)), desde: m.clone().add(hacia.multiplyScalar(3)) };
  }

  // ---------- bandos ----------
  const enemigos = () => unidades.filter((u) => u.bando === 'enemigo' && u.vivo);
  const aliados = () => unidades.filter((u) => u.bando === 'aliado' && u.vivo);
  const nuestro = (u) => u.bando !== 'enemigo';               // el héroe y sus torretas: paran con escudo blanco
  const distancia = (a, b) => Math.abs(a.c.i - b.c.i) + Math.abs(a.c.j - b.c.j);

  // ---------- ataque y defensa ----------
  async function atacar(a, d, { dados: nDados = a.ataque, gesto = 'golpe', distanciaA = false } = {}) {
    if (a.heroe && C.rezo > 0) nDados += 2;                       // rezo vudú del trol
    mirarse(a, d); if (!distanciaA) mirarse(d, a);
    if (gesto) await a.pj.hacer(gesto, gesto === 'brutal' ? .8 : .55);
    const mesa = mesaDados(a, d);
    hud.narrar(`${a.heroe ? 'Atacas' : a.nombre + ' ataca'}: ${nDados} ${nDados === 1 ? 'dado' : 'dados'}…`);
    const r1 = await dados.tirar('combate', nDados, mesa.centro, mesa.desde), golpes = r1.filter((x) => x === 'calavera').length;
    if (!golpes) { hud.narrar(una(a.bando === 'enemigo' ? FRASES.falloEsq : FRASES.falloHeroe)); await espera(700); return; }
    hud.narrar(`¡${golpes} ${golpes === 1 ? 'calavera' : 'calaveras'}! ${d.heroe ? 'Te defiendes' : d.nombre + ' se defiende'}…`);
    await espera(450);
    const r2 = await dados.tirar('combate', d.defensa + (d.heroe && C.rezo > 0 ? 1 : 0), mesa.centro, mesa.desde), escudo = nuestro(d) ? 'escudoB' : 'escudoN', paradas = r2.filter((x) => x === escudo).length;
    const dano = Math.max(0, golpes - paradas);
    if (!dano) { sonido.bloqueo(); ui.numero(sobre(d, d.pj.altura), '¡Parado!', '#cfe8ff'); hud.narrar(`${d.heroe ? 'Lo paras' : d.nombre + ' lo para'} todo con ${paradas === 1 ? 'un escudo' : 'los escudos'}.`); await espera(600); return; }
    await herir(d, dano);
  }
  async function herir(d, dano) {
    if (d.heroe && estado.escamas && !C.escamasUsadas) {            // rasgo de los escamados
      C.escamasUsadas = true; dano -= 1; ui.numero(sobre(d, d.pj.altura + .5), 'Escamas', '#9fe8c0');
      if (dano <= 0) { sonido.bloqueo(); hud.narrar('Tus escamas se tragan el golpe entero.'); await espera(700); return; }
    }
    sonido.golpe(); d.pj.herido(); d.cuerpo -= dano; ui.numero(sobre(d, d.pj.altura), `-${dano}`); ui.chispas(sobre(d, 1), '#ffd0a0', 10, 2.5);
    if (d.heroe) { estado.cuerpo = Math.max(0, d.cuerpo); hud.actualizar(); }
    camara.temblar(.25);
    if (d.cuerpo <= 0) await morir(d); else { hud.narrar(d.heroe ? `Recibes ${dano} de daño.` : `${d.nombre} recibe ${dano} de daño.`); await espera(650); }
  }
  async function morir(u) {
    u.vivo = false;
    if (u.heroe) { u.pj.caido = true; hud.narrar('Caes al suelo… La guardabosques tendrá que venir a por ti.'); sonido.derrota(); await espera(1400); return; }
    if (u.bando === 'aliado') { sonido.explosion(); ui.chispas(sobre(u, .8), '#ffb36a', 30, 4); escena.remove(u.pj.grupo); hud.narrar('¡La torreta salta en pedazos! Tendrás que montar otra.'); await espera(700); return; }
    sonido.huesos(); if (u.pj.desmontar) u.pj.desmontar(u.c.y); else { u.pj.caido = true; setTimeout(() => escena.remove(u.pj.grupo), 1600); } ui.chispas(sobre(u, .8), '#e7dcff', 16, 3); hud.narrar(una(FRASES.muereEsq)); u.rotulo && ui.quitar(u.rotulo); await espera(800);
  }

  // ---------- turnos ----------
  let turnoHeroe = null;
  const HAB = () => estado.habilidad;                              // { id, nombre, icono }
  const MJ = () => estado.hab || {};                               // las mejoras propias de la clase
  const sinGastar = (id) => id === 'torreta' && MJ().rapida;        // montaje rápido: la torreta no gasta el ataque
  function accionesHeroe() {
    const h = unidades[0], t = turnoHeroe, hayPegado = enemigos().some((u) => pegados(h, u)), hab = HAB();
    const puedeHab = (!t.actuado || sinGastar(hab.id)) && estado.usos > 0 && !modoEleccion && (hab.id !== 'brutal' || hayPegado) && (hab.id !== 'torreta' || vecinos(h.c).some((c) => libre(c)));
    hud.acciones([
      { id: 'mover', texto: 'Moverse', corto: 'Mover', icono: '🎲', activo: !t.movido && !modoEleccion },
      { id: 'atacar', texto: 'Atacar', icono: '⚔️', activo: !t.actuado && hayPegado && !modoEleccion },
      { id: 'habilidad', texto: `${hab.nombre} (${estado.usos})`, corto: `${hab.nombre.split(' ')[0]} (${estado.usos})`, icono: hab.icono, activo: puedeHab },
      estado.rezo && { id: 'rezo', texto: C.rezo > 0 ? `Rezo (${C.rezo})` : 'Rezo vudú', corto: 'Rezo', icono: '🗿', activo: !C.rezoUsado && !modoEleccion },
      { id: 'pocion', texto: `Poción (${estado.pociones})`, icono: '🧪', activo: !t.actuado && estado.pociones > 0 && estado.cuerpo < estado.max && !modoEleccion },
      { id: 'fin', texto: modoEleccion ? 'Cancelar' : 'Terminar turno', corto: modoEleccion ? 'Cancelar' : 'Pasar', icono: modoEleccion ? '✖' : '⏭', activo: true }
    ].filter(Boolean), elegirAccion);
  }
  async function elegirAccion(id) {
    const h = unidades[0], t = turnoHeroe;
    if (id === 'fin') { if (modoEleccion) { modoEleccion = null; alcanzables.clear(); pintar(); hud.narrar('Elige otra cosa.'); return accionesHeroe(); } hud.acciones([]); return t.fin(); }
    if (id === 'mover') {
      hud.acciones([]); t.movido = true; hud.narrar('Tiras los dados de movimiento…');
      const pos = h.pj.grupo.position, r = await dados.tirar('mover', 2, pos.clone().add(camara.position.clone().sub(pos).setY(0).normalize().multiplyScalar(1.8)));
      const pasos = r[0] + r[1] + estado.pasosExtra;
      hud.narrar(`¡${pasos} casillas!${estado.pasosExtra ? ' (Pies ligeros: +' + estado.pasosExtra + ')' : ''} Toca dónde quieres ir.`);
      const cm = caminos(h.c, pasos, h); alcanzables = new Map([...cm.dist.keys()].filter((c) => c !== h.c).map((c) => [c, 'mover']));
      modoEleccion = { tipo: 'mover', caminos: cm }; pintar(); return accionesHeroe();
    }
    if (id === 'atacar') {
      const objetivos = enemigos().filter((u) => pegados(h, u));
      if (objetivos.length === 1) { hud.acciones([]); t.actuado = true; await atacar(h, objetivos[0]); return trasAccion(); }
      alcanzables = new Map(objetivos.map((u) => [u.c, 'objetivo'])); modoEleccion = { tipo: 'atacar' }; pintar(); hud.narrar('¿A cuál? Toca su casilla.'); return accionesHeroe();
    }
    if (id === 'habilidad') {
      const hab = HAB();
      if (hab.id === 'fuego') { alcanzables = new Map(enemigos().map((u) => [u.c, 'hechizo'])); hud.narrar('Bola de fuego: toca a un enemigo.'); }
      else if (hab.id === 'brutal') { alcanzables = new Map(enemigos().filter((u) => pegados(h, u)).map((u) => [u.c, 'objetivo'])); hud.narrar('Golpe brutal: ¿a quién partes en dos?'); }
      else if (hab.id === 'flecha') { const al = enemigos().filter((u) => distancia(h, u) <= 5); if (!al.length) { hud.narrar('No hay nadie a tiro (cinco casillas como mucho).'); return accionesHeroe(); } alcanzables = new Map(al.map((u) => [u.c, 'hechizo'])); hud.narrar('Flecha: toca a un enemigo a tiro.'); }
      else if (hab.id === 'torreta') { alcanzables = new Map(vecinos(h.c).filter((c) => libre(c)).map((c) => [c, 'mover'])); hud.narrar('Torreta: toca una casilla pegada a ti para montarla.'); }
      modoEleccion = { tipo: hab.id }; pintar(); return accionesHeroe();
    }
    if (id === 'rezo') {   // racial del trol: no gasta acción, una vez por pelea, dura dos turnos
      if (C.rezoUsado) return accionesHeroe();
      hud.acciones([]); C.rezoUsado = true; C.rezo = 2;
      sonido.hechizo(); await h.pj.hacer('celebrar', .9); ui.chispas(sobre(h, 1.2), '#c08aff', 40, 4); ui.chispas(sobre(h, .4), '#7dffa0', 20, 3);
      ui.numero(sobre(h, h.pj.altura + .3), '¡Rezo vudú! +2 ⚔️ +1 🛡️', '#d8b0ff'); hud.narrar('Invocas a tus loas con un baile muy serio. Durante dos turnos pegas con dos dados más y paras con uno más.');
      await espera(700); return accionesHeroe();
    }
    if (id === 'pocion') {
      hud.acciones([]); t.actuado = true; estado.pociones--; const cura = Math.min(3, estado.max - estado.cuerpo); h.cuerpo += cura; estado.cuerpo = h.cuerpo; hud.actualizar();
      await h.pj.hacer('recoger', .6); sonido.recoger(); ui.chispas(sobre(h, 1), '#8affb0', 22, 2.5); ui.numero(sobre(h, h.pj.altura), `+${cura}`, '#7dffa0'); hud.narrar('Te bebes la poción. Sabe a menta y a valentía.');
      await espera(500); return trasAccion();
    }
  }
  async function trasAccion() {
    if (await comprobarFin()) return;
    const t = turnoHeroe;
    if (t.movido && t.actuado) return t.fin();
    accionesHeroe();
  }
  // Toque sobre el tablero mientras eliges casilla
  C.tocar = async (punto) => {
    if (!C.activo || !modoEleccion || !punto) return false;
    let c = null, d = 1e9; for (const x of casillas) { const e = Math.hypot(x.x - punto.x, x.z - punto.z); if (e < d) { d = e; c = x; } }
    if (!c || d > T * .75 || !alcanzables.has(c)) return true;
    const h = unidades[0], t = turnoHeroe, modo = modoEleccion; modoEleccion = null; alcanzables.clear(); pintar(); hud.acciones([]);
    if (modo.tipo === 'mover') { await andar(h, modo.caminos.ruta(c)); return trasAccion(), true; }
    if (!sinGastar(modo.tipo)) t.actuado = true;
    const objetivo = unidades.find((u) => u.vivo && u.bando === 'enemigo' && u.c === c);
    if (modo.tipo === 'atacar') await atacar(h, objetivo);
    else { estado.usos--; hud.actualizar(); await usarHabilidad(modo.tipo, h, objetivo, c); }
    trasAccion(); return true;
  };
  async function usarHabilidad(id, h, objetivo, c) {
    if (id === 'brutal') { hud.narrar('¡GOLPE BRUTAL!'); camara.temblar(.35); await atacar(h, objetivo, { dados: estado.ataque + 2 + (MJ().furia || 0), gesto: 'brutal' }); return; }
    if (id === 'flecha') {
      h.pj.hacer('disparar', .6); await espera(350); sonido.dado(.6);
      await ui.proyectil(h.pj.gema.getWorldPosition(new THREE.Vector3()), sobre(objetivo, 1.1), '#e8d0a0', .4);
      await atacar(h, objetivo, { gesto: null, distanciaA: true, dados: estado.ataque + 2 * (MJ().certera || 0) }); return;
    }
    if (id === 'fuego') {
      mirarse(h, objetivo); sonido.hechizo(); h.pj.hacer('lanzar', .7); await espera(300);
      await ui.proyectil(h.pj.gema.getWorldPosition(new THREE.Vector3()), sobre(objetivo, 1)); sonido.explosion(); ui.chispas(sobre(objetivo, 1), '#ff9a4a', 40, 5);
      const fuerza = 2 + (MJ().gorda || 0), mesa = mesaDados(h, objetivo); hud.narrar(`¡Bola de fuego${fuerza > 2 ? ' gorda' : ''}! ${objetivo.nombre} tira 2 dados: cada calavera le quita 1 de los ${fuerza} de daño.`);
      const r = await dados.tirar('combate', 2, mesa.centro, mesa.desde), dano = Math.max(0, fuerza - r.filter((x) => x === 'calavera').length);
      if (dano) await herir(objetivo, dano); else { ui.numero(sobre(objetivo, objetivo.pj.altura), '¡Esquiva!', '#ffe08a'); hud.narrar('Se aparta chamuscado, pero entero.'); await espera(600); }
      return;
    }
    if (id === 'torreta') {
      h.pj.mirarA(Math.atan2(c.x - h.pj.grupo.position.x, c.z - h.pj.grupo.position.z));
      await h.pj.hacer('construir', 1.1);
      const pj = crearTorreta(); pj.grupo.position.set(c.x, c.y + .17, c.z); escena.add(pj.grupo);
      const e0 = enemigos()[0]; if (e0) pj.mirarA(Math.atan2(e0.pj.grupo.position.x - c.x, e0.pj.grupo.position.z - c.z));
      const rf = MJ().reforzada || 0; if (rf) pj.grupo.scale.setScalar(1 + rf * .12);   // reforzada: más grande y más bruta
      unidades.push({ bando: 'aliado', pj, nombre: rf ? 'La torreta reforzada' : 'La torreta', cuerpo: 2 + rf, ataque: 2 + rf, defensa: 1, alcance: 6, vivo: true, c });
      camara.mirarHacia(pj.grupo.position); sonido.abrir(); ui.chispas(sobre({ pj }, .8), '#ffd27a', 24, 3); hud.narrar(MJ().rapida && estado.usos ? `¡Clonc, chas! Torreta montada en un plis. Te quedan ${estado.usos}: ¿otra?` : '¡Clonc, clonc, chas! Torreta montada. Disparará sola al final de tu turno.');
      await espera(700);
    }
  }

  async function turnoAliado(a) {
    const objetivos = enemigos().filter((e) => distancia(a, e) <= a.alcance).sort((x, y) => distancia(a, x) - distancia(a, y));
    if (!objetivos.length) return;
    const e = objetivos[0]; camara.mirarHacia(a.pj.grupo.position);
    a.pj.mirarA(Math.atan2(e.pj.grupo.position.x - a.pj.grupo.position.x, e.pj.grupo.position.z - a.pj.grupo.position.z)); a.pj.hacer('golpe', .3);
    sonido.golpe(); await ui.proyectil(a.pj.gema.getWorldPosition(new THREE.Vector3()), sobre(e, 1), '#7fe0ff', .35);
    await atacar(a, e, { gesto: null, distanciaA: true });
  }
  async function turnoEnemigo(e) {
    if (!e.vivo) return;
    // va a por lo más cercano de nuestro bando: tú o tus torretas
    const blancos = [unidades[0], ...aliados()].filter((u) => u.vivo);
    if (!blancos.length) return;
    const { dist, ruta } = caminos(e.c, 99, e);
    const pasosA = (b) => Math.min(...vecinos(b.c).map((v) => (v === e.c ? 0 : dist.get(v) ?? 1e9)));
    const b = blancos.sort((x, y) => pasosA(x) - pasosA(y))[0];
    camara.mirarHacia(e.pj.grupo.position);
    if (!pegados(e, b)) {
      let mejor = null, md = 1e9;
      for (const v of vecinos(b.c)) if (dist.has(v) && dist.get(v) < md) { md = dist.get(v); mejor = v; }
      if (mejor) { const r = ruta(mejor).slice(0, e.mover); if (r.length) { e.pj.hacer('rugir', .5); await espera(250); await andar(e, r, .2); } }
      else {
        let cerca = null, cd = 1e9; for (const [c] of dist) { const dd = Math.abs(c.i - b.c.i) + Math.abs(c.j - b.c.j); if (dd < cd && dist.get(c) <= e.mover) { cd = dd; cerca = c; } }
        if (cerca && cerca !== e.c) await andar(e, ruta(cerca), .2);
      }
    }
    const pegado = [unidades[0], ...aliados()].find((u) => u.vivo && pegados(e, u));
    if (pegado) await atacar(e, pegado);
    await espera(250);
  }
  async function comprobarFin() {
    const h = unidades[0];
    if (!h.vivo) { terminar('derrota'); return true; }
    if (!enemigos().length) { terminar('victoria'); return true; }
    return false;
  }
  async function bucle() {
    while (C.activo) {
      hud.banner('Tu turno', 'heroe'); camara.mirarHacia(unidades[0].pj.grupo.position);
      if (C.rezo > 0) C.rezo--;                                        // el rezo se va gastando
      // rasgo de los troles: se regeneran al empezar su turno (hasta 3 veces por pelea)
      const yo = unidades[0];
      if (estado.regenera && yo.vivo && yo.cuerpo < estado.max && (C.regenerado || 0) < estado.regenera) {
        C.regenerado = (C.regenerado || 0) + 1; yo.cuerpo++; estado.cuerpo = yo.cuerpo; hud.actualizar();
        ui.numero(sobre(yo, yo.pj.altura), '+1 Regeneración', '#7dffa0'); ui.chispas(sobre(yo, 1), '#8affb0', 14, 2); await espera(500);
      }
      await new Promise((fin) => { turnoHeroe = { movido: false, actuado: false, fin }; hud.narrar('Muévete, ataca o usa tu habilidad. En el orden que quieras.'); accionesHeroe(); });
      hud.acciones([]); modoEleccion = null; alcanzables.clear(); pintar();
      if (!C.activo || await comprobarFin()) return;
      for (const a of aliados()) { if (!C.activo) return; await turnoAliado(a); if (await comprobarFin()) return; }
      hud.banner('Turno de los esqueletos', 'enemigo'); await espera(700);
      for (const e of enemigos()) { if (!C.activo) return; await turnoEnemigo(e); if (await comprobarFin()) return; }
    }
  }
  function terminar(res) {
    if (!C.activo) return;
    C.activo = false; hud.acciones([]); dados.limpiar();
    const fin = resolver; resolver = null;
    tablero.cerrar = 0; sonido.musica('paseo');
    for (const a of unidades.filter((u) => u.bando === 'aliado' && u.vivo)) { ui.chispas(sobre(a, .8), '#ffd27a', 14, 2); setTimeout(() => escena.remove(a.pj.grupo), 300); }
    const muertos = unidades.filter((u) => u.bando === 'enemigo' && !u.vivo);
    setTimeout(() => fin?.({ resultado: res, caidos: muertos.map((u) => u.nombre), caidosIds: muertos.map((u) => u.id) }), 600);
  }

  // ---------- empezar ----------
  // grupo: [{ pj, nombre, cuerpo, ataque, defensa, mover, rotulo }]
  C.ponerHeroe = (pj) => { heroe = pj; };
  C.empezar = (grupo) => new Promise(async (fin) => {
    resolver = fin; C.activo = true; C.escamasUsadas = false; C.regenerado = 0; C.rezo = 0; C.rezoUsado = false; sonido.circulo(); sonido.musica('combate');
    const h = { heroe: true, bando: 'heroe', pj: heroe, nombre: 'Tú', cuerpo: estado.cuerpo, max: estado.max, ataque: estado.ataque, defensa: estado.defensa, vivo: true };
    const centro = heroe.grupo.position.clone().multiplyScalar(.45).add(grupo.reduce((a, e) => a.add(e.pj.grupo.position), new THREE.Vector3()).multiplyScalar(.55 / grupo.length));
    montar(centro);
    unidades = [h, ...grupo.map((e) => ({ ...e, bando: 'enemigo', vivo: true }))];
    for (const u of unidades) u.c = masCercana(u.pj.grupo.position.x, u.pj.grupo.position.z, u);
    hud.banner('¡Círculo de combate!', 'enemigo');
    camara.enfocarCombate(new THREE.Vector3(tablero.cx, tablero.y0, tablero.cz), heroe.grupo.position);
    await espera(900);
    await Promise.all(unidades.map((u) => andar(u, [u.c], .35)));
    enemigos().forEach((e) => { mirarse(e, h); e.pj.hacer('rugir', .6); });
    mirarse(h, unidades[1]);
    await espera(600);
    bucle();
  });

  // Para las pruebas: qué casillas están iluminadas y dónde está cada uno
  C.depurar = () => ({ casillas: [...alcanzables.keys()].map((c) => ({ x: c.x, z: c.z, tipo: alcanzables.get(c) })), unidades: unidades.map((u) => ({ n: u.nombre, vivo: u.vivo, x: u.c?.x, z: u.c?.z, cuerpo: u.cuerpo })) });
  C.forzarVictoria = () => { for (const u of unidades) if (u.bando === 'enemigo') u.vivo = false; terminar('victoria'); };
  C.actualizar = (dt, t) => {
    tiempo = t;
    for (const u of unidades) if (u.bando === 'aliado' && u.vivo) u.pj.animar(dt, t);   // las torretas (el resto se anima fuera)
    for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; w.t += dt; const p = Math.min(1, w.t / w.dur); w.f(p * p * (3 - 2 * p)); if (p >= 1) { tweens.splice(i, 1); w.fin(); } }
    if (!tablero) return;
    if (tablero.externo) {
      if (tablero.cerrar != null) { escena.remove(tablero.g); tablero = null; return; }
      if (modoEleccion) tablero.brillo.material.opacity = .4 + Math.sin(t * 6) * .2;
      return;
    }
    if (tablero.cerrar != null) {
      tablero.cerrar += dt; mundo.aplastarHierba(tablero.cx, tablero.cz, MEDIO * T + 1.2, Math.max(0, 1 - tablero.cerrar * 1.5)); tablero.nacer = Math.max(0, 1.6 - tablero.cerrar * 1.6); pintar(); anillo.scale.setScalar(Math.max(.01, 1 - tablero.cerrar)); anillo.material.opacity = Math.max(0, 1 - tablero.cerrar);
      if (tablero.cerrar > 1.1) { escena.remove(tablero.g, anillo); tablero = null; anillo = null; }
      return;
    }
    if (tablero.nacer < 1.6) { tablero.nacer += dt * 1.1; pintar(); mundo.aplastarHierba(tablero.cx, tablero.cz, MEDIO * T + 1.2, Math.min(1, tablero.nacer)); }
    anillo.scale.setScalar(Math.min(1, anillo.scale.x + dt * 1.6)); anillo.rotation.z += dt * .15; anillo.material.opacity = .75 + Math.sin(t * 3) * .2;
    if (modoEleccion && tablero.brillo) tablero.brillo.material.opacity = .4 + Math.sin(t * 6) * .2;
  };
  return C;
}
