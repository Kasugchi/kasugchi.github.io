// =============================================================
//  MOTOR DE REGLAS
//  Todo el juego es un objeto "estado" (JSON puro) y una función
//  aplicar(estado, accion, jugador) que lo modifica.
//  Solo el anfitrión ejecuta el motor; los demás reciben el estado.
//  Cada cosa que pasa se apunta en estado.eventos para que la
//  interfaz la anime (dados, movimientos, mensajes...).
// =============================================================
import * as D from './datos.js';
import * as T from './tablero.js';
import { turnoMonstruo } from './ia.js';
import { generarMision, semillaDeNivel } from './procedural.js';

const { clave } = T;
export const rnd = (n) => Math.floor(Math.random() * n);
export const d6 = () => 1 + rnd(6);
export const tirarCombate = (n) => Array.from({ length: Math.max(0, n) }, () => D.CARAS[rnd(6)]);
const cuenta = (caras, t) => caras.filter((c) => c === t).length;
const barajar = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = rnd(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const copia = (o) => JSON.parse(JSON.stringify(o));

// ---------- Estadísticas de héroe ----------
export const ataqueHeroe = (h) => D.ARMAS[h.arma].ataque;
export const defensaHeroe = (h) => (h.id === 'cargador' ? D.CARGADOR.defensa
  : D.HEROES[h.tipo].defensa + h.armaduras.reduce((s, a) => s + D.ARMADURAS[a].defensa, 0));
export const dadosMovimiento = (h) => (h.armaduras.includes('placas') ? 1 : 2);
export const nombreDe = (estado, id) => {
  if (id === 'cargador') return 'Cargador';
  if (estado.heroes[id]) return estado.heroes[id].nombre;
  const m = estado.monstruos.find((x) => x.id === id);
  return m ? m.nombre : id;
};

// ---------- Eventos y registro ----------
export function ev(estado, e) {
  e.n = ++estado.seq;
  estado.eventos.push(e);
  if (estado.eventos.length > 120) estado.eventos.splice(0, estado.eventos.length - 120);
  return e;
}
function log(estado, texto, tono = '') {
  estado.log.push({ n: estado.seq, texto, tono });
  if (estado.log.length > 60) estado.log.shift();
}
function avisar(estado, texto, tono = '') { ev(estado, { tipo: 'mensaje', texto, tono }); log(estado, texto, tono); }

// =============================================================
//  CRÓNICA: lo que pasa en cada misión, para el resumen final
//  estado.cronica = { actual, ultima, campana }
// =============================================================
function cronicaNueva(estado) {
  const heroes = {};
  for (const t of estado.orden) heroes[t] = { muertes: {}, danoHecho: 0, danoRecibido: 0, oro: 0, tesoros: 0, hechizos: 0, pociones: 0, caidas: 0, trampas: 0, casillas: 0, busquedas: 0, secretas: 0, puertas: 0, jefes: 0, turnosVacios: 0 };
  return {
    numero: estado.mision.numero, titulo: estado.mision.titulo, resultado: null, rondas: 0,
    monstruos: {}, jefes: [], heroes, oro: 0, tesoros: 0, busquedas: 0,
    trampasActivadas: 0, trampasHalladas: 0, desarmadas: 0, secretas: 0, puertas: 0,
    cargador: estado.cargador ? 'vivo' : null
  };
}
const cron = (estado) => estado.cronica?.actual || null;
const cronH = (estado, id) => cron(estado)?.heroes[id] || null;
const sumar = (obj, k, n = 1) => { if (obj) obj[k] = (obj[k] || 0) + n; };

function cerrarCronica(estado, res) {
  const c = cron(estado);
  if (!c) return;
  c.resultado = res;
  c.rondas = (estado.ronda || 0) + 1;
  c.recompensa = res === 'victoria' ? estado.mision.recompensa || 0 : 0;
  const k = (estado.cronica.campana ||= { misiones: 0, victorias: 0, derrotas: 0, rondas: 0, monstruos: {}, jefes: [], oro: 0, tesoros: 0, trampas: 0, secretas: 0, heroes: {} });
  k.misiones++; k[res === 'victoria' ? 'victorias' : 'derrotas']++;
  k.rondas += c.rondas; k.oro += c.oro; k.tesoros += c.tesoros; k.trampas += c.trampasActivadas; k.secretas += c.secretas;
  for (const [t, n] of Object.entries(c.monstruos)) sumar(k.monstruos, t, n);
  k.jefes.push(...c.jefes);
  for (const [id, h] of Object.entries(c.heroes)) {
    const kh = (k.heroes[id] ||= { muertes: 0, danoHecho: 0, danoRecibido: 0, oro: 0, caidas: 0 });
    kh.muertes += Object.values(h.muertes).reduce((s, n) => s + n, 0);
    kh.danoHecho += h.danoHecho; kh.danoRecibido += h.danoRecibido; kh.oro += h.oro; kh.caidas += h.caidas;
  }
  estado.cronica.ultima = c;
  estado.cronica.actual = null;
}

// =============================================================
//  CAMPAÑA
// =============================================================
// elegidos: [{ tipo: 'barbaro', jugador: 'id' }, ...]
export function crearPartida(elegidos, jugadores = {}) {
  const heroes = {};
  for (const tipo of D.ORDEN_HEROES) {
    const e = elegidos.find((x) => x.tipo === tipo);
    if (!e) continue;
    const base = D.HEROES[tipo];
    const fem = e.variante === 'f';
    heroes[tipo] = {
      id: tipo, tipo, jugador: e.jugador, fem,
      nombre: fem ? base.fem.nombre : base.nombre, icono: fem ? base.fem.icono : base.icono,
      arma: base.arma, armaduras: [], objetos: {}, kit: false, oro: 0,
      cuerpoMax: base.cuerpo, mente: base.mente, cuerpo: base.cuerpo,
      x: 0, y: 0, vivo: true, fuera: false, efectos: {}, hechizos: [],
      inventario: { armas: [], armaduras: [], objetos: {} }, banco: 0, transferido: false
    };
  }
  return {
    v: 1, seq: 0, eventos: [], log: [], jugadores,
    fase: 'cargando', misionIdx: 0, campana: D.CAMPANA.slice(),
    heroes, orden: D.ORDEN_HEROES.filter((t) => heroes[t]),
    mision: null, resultado: null,
    contrato: null, cargador: null
  };
}

// Prepara una misión a partir de su JSON.
export function iniciarMision(estado, def) {
  const m = copia(def);
  estado.mision = m;
  estado.fase = 'briefing';
  estado.resultado = null;
  estado.flags = {};
  estado.disparados = {};
  estado.revelado = {};
  estado.regiones = {};
  estado.buscado = {};
  estado.bebido = {};
  estado.tesoroTomado = {};
  estado.cofreSeguro = {};
  estado.rocas = {};
  for (const [x, y] of m.rocas || []) estado.rocas[clave(x, y)] = 1;

  estado.puertas = (m.puertas || []).map((p) => ({
    id: p.id, a: p.a, b: p.b, abierta: false,
    secreta: !!p.secreta, descubierta: !p.secreta, bloqueada: !!p.bloqueada
  }));
  estado.puertasPorBorde = {};
  estado.puertas.forEach((p, i) => { estado.puertasPorBorde[T.claveBorde(p.a, p.b)] = i; });

  estado.muebles = (m.muebles || []).map((u) => ({ ...u }));
  estado.mueblesPorCasilla = {};
  estado.muebles.forEach((u, i) => {
    for (let y = u.y; y < u.y + u.h; y++) for (let x = u.x; x < u.x + u.w; x++) estado.mueblesPorCasilla[clave(x, y)] = i;
  });

  estado.trampas = (m.trampas || []).map((t) => ({ ...t, descubierta: false, activa: true }));
  estado.monstruos = [];
  for (const spec of m.monstruos || []) crearMonstruo(estado, spec, false);

  const [ex, ey] = m.escalera;
  estado.escalera = [[ex, ey], [ex + 1, ey], [ex, ey + 1], [ex + 1, ey + 1]];

  let i = 0;
  for (const t of estado.orden) {
    const h = estado.heroes[t];
    const base = D.HEROES[t];
    h.cuerpo = h.cuerpoMax; h.vivo = true; h.fuera = false; h.efectos = {};
    h.hechizos = base.elementos.flatMap((el) => D.HECHIZOS_POR_ELEMENTO[el]);
    [h.x, h.y] = estado.escalera[i++];
  }
  estado.mazo = barajar(D.CARTAS_TESORO.map((c) => ({ ...c })));
  estado.turno = null;
  estado.ronda = 0;
  // Cargador contratado para esta misión.
  estado.cargador = null;
  if (estado.contrato && estado.heroes[estado.contrato.patron]) {
    const c = D.CARGADOR;
    estado.cargador = {
      id: 'cargador', tipo: 'cargador', nombre: 'Cargador', patron: estado.contrato.patron,
      x: 0, y: 0, cuerpo: c.cuerpo, cuerpoMax: c.cuerpo, vivo: true, fuera: false, efectos: {}, objetos: {}, armaduras: [],
      carga: estado.contrato.carga || {}
    };
    const libre = (x, y) => T.dentro(x, y) && !T.esRoca(estado, x, y) && !T.muebleEn(estado, x, y) && !T.figuraEn(estado, x, y);
    const mapa = T.explorar(estado.escalera[0], 12, (a, b) => !T.esRoca(estado, b[0], b[1]) && T.borde(estado, a, b) === 'libre');
    const sitio = Object.values(mapa).filter((c2) => libre(c2.x, c2.y) && !estado.monstruos.some((m) => m.x === c2.x && m.y === c2.y)).sort((p, q) => p.d - q.d)[0];
    if (sitio) { estado.cargador.x = sitio.x; estado.cargador.y = sitio.y; }
    else { // sin sitio junto a la escalera: no baja y la carga vuelve a casa
      for (const [id, bolsa] of Object.entries(estado.cargador.carga)) for (const i of contenido(bolsa)) meter(inventarioDe(estado.heroes[id]), i);
      estado.cargador = null;
    }
  }
  estado.contrato = null;
  estado.cronica ||= {};
  estado.cronica.actual = cronicaNueva(estado);
  log(estado, 'Misión ' + m.numero + ': ' + m.titulo, 'titulo');
  return estado;
}

function crearMonstruo(estado, spec, visible) {
  const base = D.MONSTRUOS[spec.tipo];
  let id = spec.id || spec.tipo + '_' + (++estado.seq);
  while (estado.monstruos.some((m) => m.id === id)) id += '_';
  const m = {
    id, tipo: spec.tipo, nombre: spec.nombre || base.nombre, jefe: !!spec.jefe,
    x: spec.x, y: spec.y, region: T.region(spec.x, spec.y),
    mov: spec.mov ?? base.mov, ataque: spec.ataque ?? base.ataque, defensa: spec.defensa ?? base.defensa,
    cuerpo: spec.cuerpo ?? base.cuerpo, cuerpoMax: spec.cuerpo ?? base.cuerpo, mente: base.mente,
    nomuerto: !!base.nomuerto, ia: spec.ia || 'agresivo', activo: spec.ia !== 'centinela',
    hechizos: (spec.hechizos || []).slice(), visto: !!visible, vivo: true, efectos: {}
  };
  estado.monstruos.push(m);
  return m;
}

// Coloca un monstruo en la casilla libre más cercana a (x, y).
export function aparecer(estado, spec, avisarAparicion = true) {
  const libre = (x, y) => T.dentro(x, y) && !T.esRoca(estado, x, y) && !T.muebleEn(estado, x, y) && !T.figuraEn(estado, x, y);
  let pos = [spec.x, spec.y];
  if (!libre(pos[0], pos[1])) {
    const mapa = T.explorar(pos, 8, (c, n) => !T.esRoca(estado, n[0], n[1]) && T.borde(estado, c, n) === 'libre');
    const cand = Object.values(mapa).filter((c) => c.d > 0 && libre(c.x, c.y)).sort((a, b) => a.d - b.d)[0];
    if (!cand) return null;
    pos = [cand.x, cand.y];
  }
  const m = crearMonstruo(estado, { ...spec, x: pos[0], y: pos[1] }, !!estado.revelado[clave(pos[0], pos[1])]);
  if (m.visto && avisarAparicion) ev(estado, { tipo: 'aparece', id: m.id });
  return m;
}

// =============================================================
//  VISIBILIDAD
// =============================================================
function revelarSala(estado, r) {
  if (estado.regiones[r]) return;
  estado.regiones[r] = 1;
  for (const [x, y] of T.casillasDe(r)) estado.revelado[clave(x, y)] = 1;
  disparar(estado, 'region_revelada', { region: r });
}

export function revelar(estado) {
  const salas = new Set();
  for (const h of Object.values(estado.heroes)) {
    if (!h.vivo || h.fuera) continue;
    const r0 = T.region(h.x, h.y);
    if (r0 !== '.') salas.add(r0);
    estado.revelado[clave(h.x, h.y)] = 1;
    for (let y = Math.max(0, h.y - 14); y <= Math.min(D.ALTO - 1, h.y + 14); y++) {
      for (let x = Math.max(0, h.x - 14); x <= Math.min(D.ANCHO - 1, h.x + 14); x++) {
        const k = clave(x, y);
        const r = T.region(x, y);
        if (estado.revelado[k] || (r !== '.' && salas.has(r))) continue;
        if (!T.lineaVision(estado, h.x, h.y, x, y)) continue;
        if (r === '.') estado.revelado[k] = 1; else salas.add(r);
      }
    }
  }
  for (const r of salas) revelarSala(estado, r);
  const nuevos = [];
  for (const m of estado.monstruos) {
    if (m.vivo && !m.visto && estado.revelado[clave(m.x, m.y)]) { m.visto = true; nuevos.push(m.id); }
  }
  if (nuevos.length) {
    ev(estado, { tipo: 'aparecen', ids: nuevos });
    log(estado, '¡Aparecen: ' + nuevos.map((id) => nombreDe(estado, id)).join(', ') + '!', 'peligro');
  }
  return nuevos;
}

export const monstruosALaVista = (estado, h) =>
  estado.monstruos.filter((m) => m.vivo && m.visto && T.lineaVision(estado, h.x, h.y, m.x, m.y));

// =============================================================
//  DISPARADORES (el "guion" de cada misión)
// =============================================================
export function disparar(estado, cuando, datos = {}) {
  const lista = estado.mision.disparadores || [];
  lista.forEach((d, i) => {
    if (estado.disparados[i] || d.cuando !== cuando) return;
    if (d.region && d.region !== datos.region) return;
    if (d.id && d.id !== datos.id) return;
    if (d.puerta && d.puerta !== datos.puerta) return;
    if (d.nombre && d.nombre !== datos.nombre) return;
    if (d.casilla && !(d.casilla[0] === datos.x && d.casilla[1] === datos.y)) return;
    // requiere: varias flags a la vez (p. ej. reunir tres sellos).
    if (d.requiere && !d.requiere.every((f) => estado.flags[f])) return;
    estado.disparados[i] = 1;
    for (const a of d.acciones || []) ejecutarAccionGuion(estado, a);
  });
}

function ejecutarAccionGuion(estado, a) {
  switch (a.tipo) {
    case 'historia': ev(estado, { tipo: 'historia', texto: a.texto }); log(estado, a.texto, 'historia'); break;
    case 'mensaje': avisar(estado, a.texto); break;
    case 'flag': ponerFlag(estado, a.nombre); break;
    case 'activar':
      for (const m of estado.monstruos) if (a.ids.includes(m.id)) { m.activo = true; if (m.ia === 'centinela') m.ia = 'agresivo'; }
      break;
    case 'aparecer': for (const s of a.monstruos) aparecer(estado, s); break;
    case 'desbloquear': { const p = estado.puertas.find((x) => x.id === a.puerta); if (p) p.bloqueada = false; break; }
    case 'abrir': { const p = estado.puertas.find((x) => x.id === a.puerta); if (p) { p.abierta = true; p.bloqueada = false; p.descubierta = true; revelar(estado); } break; }
    case 'revelar': revelarSala(estado, a.region); break;
  }
}

function ponerFlag(estado, nombre) {
  if (estado.flags[nombre]) return;
  estado.flags[nombre] = 1;
  disparar(estado, 'flag', { nombre });
}

// =============================================================
//  DAÑO Y COMBATE
// =============================================================
export function danarHeroe(estado, h, n) {
  if (n <= 0 || !h.vivo) return;
  if (h.efectos.piel) { delete h.efectos.piel; }
  h.cuerpo -= n;
  if (h.cuerpo <= 0) {
    if (h.objetos.pocionCurar > 0) {
      h.objetos.pocionCurar--;
      const cura = d6();
      h.cuerpo = Math.min(h.cuerpoMax, cura);
      avisar(estado, h.nombre + ' bebe su poción curativa en el último aliento (+' + cura + ').', 'bueno');
      return;
    }
    h.cuerpo = 0; h.vivo = false;
    ev(estado, { tipo: 'muerte', id: h.id });
    sumar(cronH(estado, h.id), 'caidas');
    if (h.id === 'cargador') {
      if (cron(estado)) cron(estado).cargador = 'muerto';
      const perdido = Object.values(h.carga || {}).reduce((n, b) => n + contenido(b).length, 0);
      h.carga = {};
      avisar(estado, 'El cargador ha caído' + (perdido ? ' y todo lo que llevaba se pierde con él.' : '.'), 'peligro');
      return;
    }
    log(estado, h.nombre + ' ha caído.', 'peligro');
    disparar(estado, 'heroe_muerto', { id: h.id });
  }
}

export function danarMonstruo(estado, m, n) {
  if (!m.vivo) return;
  if (m.efectos.dormido) delete m.efectos.dormido;
  if (n <= 0) return;
  m.cuerpo -= n;
  if (m.cuerpo <= 0) {
    m.cuerpo = 0; m.vivo = false;
    ev(estado, { tipo: 'muerte', id: m.id });
    sumar(cron(estado)?.monstruos, m.tipo);
    if (m.jefe) cron(estado)?.jefes.push(m.nombre);
    const autor = cronH(estado, estado._autor);
    if (autor) { sumar(autor.muertes, m.tipo); if (m.jefe) sumar(autor, 'jefes'); }
    log(estado, m.nombre + ' muere.', 'bueno');
    disparar(estado, 'monstruo_muerto', { id: m.id });
  }
}

// Ataque de héroe a monstruo (arma o hechizo de ataque).
function golpearMonstruo(estado, h, m, dados, etiqueta) {
  const ataque = tirarCombate(dados);
  const dormido = !!m.efectos.dormido;
  const defensa = tirarCombate(dormido ? 0 : m.defensa);
  const dano = Math.max(0, cuenta(ataque, 'calavera') - cuenta(defensa, 'escudoNegro'));
  ev(estado, { tipo: 'dados', atacante: h.id, defensor: m.id, ataque, defensa, dano, defiende: 'monstruo', etiqueta });
  log(estado, h.nombre + (etiqueta ? ' (' + etiqueta + ')' : '') + ' → ' + m.nombre + ': ' + dano + ' de daño.', dano ? 'golpe' : '');
  sumar(cronH(estado, h.id), 'danoHecho', Math.min(dano, m.cuerpo));
  danarMonstruo(estado, m, dano);
}

// Ataque de monstruo a héroe.
export function golpearHeroe(estado, m, h, dados, etiqueta) {
  const ataque = tirarCombate(dados);
  const extra = h.efectos.piel ? 2 : 0;
  const defensa = tirarCombate(defensaHeroe(h) + extra);
  const dano = Math.max(0, cuenta(ataque, 'calavera') - cuenta(defensa, 'escudo'));
  ev(estado, { tipo: 'dados', atacante: m.id, defensor: h.id, ataque, defensa, dano, defiende: 'heroe', etiqueta });
  log(estado, m.nombre + (etiqueta ? ' (' + etiqueta + ')' : '') + ' → ' + h.nombre + ': ' + dano + ' de daño.', dano ? 'peligro' : '');
  sumar(cronH(estado, h.id), 'danoRecibido', dano);
  danarHeroe(estado, h, dano);
}

// =============================================================
//  TRAMPAS
// =============================================================
function trampaEn(estado, x, y) { return estado.trampas.find((t) => t.activa && t.x === x && t.y === y); }

function activarTrampa(estado, h, t, previa) {
  t.descubierta = true;
  sumar(cron(estado), 'trampasActivadas');
  sumar(cronH(estado, h.id), 'trampas');
  const nombre = D.TRAMPAS[t.tipo].nombre;
  if (t.tipo === 'foso') {
    ev(estado, { tipo: 'trampa', trampa: t.id, heroe: h.id, texto: '¡' + h.nombre + ' cae en un foso! Pierde 1 de cuerpo.' });
    log(estado, h.nombre + ' cae en un foso.', 'peligro');
    danarHeroe(estado, h, 1);
  } else if (t.tipo === 'lanza') {
    const dado = tirarCombate(1);
    const dano = cuenta(dado, 'calavera');
    t.activa = false;
    ev(estado, { tipo: 'trampa', trampa: t.id, heroe: h.id, dado, texto: '¡Una lanza sale del suelo! ' + (dano ? h.nombre + ' pierde 1 de cuerpo.' : h.nombre + ' la esquiva.') });
    log(estado, nombre + ': ' + dano + ' de daño a ' + h.nombre + '.', dano ? 'peligro' : '');
    danarHeroe(estado, h, dano);
  } else if (t.tipo === 'bloque') {
    const dados = tirarCombate(3);
    const dano = cuenta(dados, 'calavera');
    t.activa = false;
    estado.rocas[clave(t.x, t.y)] = 1;
    if (previa) { h.x = previa[0]; h.y = previa[1]; }
    ev(estado, { tipo: 'trampa', trampa: t.id, heroe: h.id, dado: dados, texto: '¡El techo se derrumba! ' + h.nombre + ' salta atrás y pierde ' + dano + ' de cuerpo. El paso queda bloqueado.' });
    log(estado, 'Un bloque cae del techo sobre ' + h.nombre + '.', 'peligro');
    danarHeroe(estado, h, dano);
  }
}

// =============================================================
//  MOVIMIENTO DE HÉROES
// =============================================================
export function alcance(estado, h) {
  const t = estado.turno;
  if (!t || t.heroe !== h.id || !t.movTirada || t.movRestante <= 0) return {};
  const visible = (x, y) => !!estado.revelado[clave(x, y)];
  return T.explorar([h.x, h.y], t.movRestante,
    (c, n) => {
      const [x, y] = n;
      if (T.esRoca(estado, x, y) || T.muebleEn(estado, x, y)) return false;
      const b = T.borde(estado, c, n);
      if (b === 'bloqueado') return false;
      if (!visible(x, y) && b !== 'puerta') return false;
      const f = T.figuraEn(estado, x, y);
      if (f && !estado.heroes[f.id] && f.visto) return false;
      const tr = trampaEn(estado, x, y);
      if (tr && tr.descubierta) return false;
      return true;
    },
    (c) => visible(c[0], c[1])
  );
}

export function destinos(estado, h) {
  const mapa = alcance(estado, h);
  const out = {};
  for (const [k, c] of Object.entries(mapa)) {
    if (c.d === 0) continue;
    const f = T.figuraEn(estado, c.x, c.y);
    if (f) continue;
    out[k] = c.d;
  }
  return { mapa, out };
}

function moverHeroe(estado, h, x, y) {
  const { mapa, out } = destinos(estado, h);
  const k = clave(x, y);
  if (!out[k]) return 'No puedes llegar ahí.';
  const ruta = T.reconstruir(mapa, k);
  const t = estado.turno;
  let tramo = [[h.x, h.y]];
  const volcar = () => { if (tramo.length > 1) ev(estado, { tipo: 'mover', id: h.id, ruta: tramo }); tramo = [[h.x, h.y]]; };
  t.movido = true;
  for (let i = 1; i < ruta.length; i++) {
    const prev = ruta[i - 1], n = ruta[i];
    const f = T.figuraEn(estado, n[0], n[1]);
    if (f && !T.esAliado(estado, f)) { volcar(); avisar(estado, '¡Algo bloquea el paso!', 'peligro'); revelar(estado); break; }
    const b = T.borde(estado, prev, n);
    if (b === 'puerta') {
      const p = T.puertaEntre(estado, prev, n);
      volcar();
      p.abierta = true;
      sumar(cron(estado), 'puertas');
      sumar(cronH(estado, h.id), 'puertas');
      ev(estado, { tipo: 'puerta', puerta: p.id });
      log(estado, h.nombre + ' abre una puerta.');
      disparar(estado, 'puerta_abierta', { puerta: p.id });
      revelar(estado);
      const f2 = T.figuraEn(estado, n[0], n[1]);
      if (f2 && !T.esAliado(estado, f2)) { avisar(estado, 'Hay alguien al otro lado de la puerta.', 'peligro'); break; }
    }
    h.x = n[0]; h.y = n[1];
    t.movRestante--;
    sumar(cronH(estado, h.id), 'casillas');
    tramo.push([h.x, h.y]);
    const tr = trampaEn(estado, h.x, h.y);
    if (tr && !tr.descubierta) {
      volcar();
      activarTrampa(estado, h, tr, prev);
      t.movRestante = 0;
      revelar(estado);
      break;
    }
    revelar(estado);
    disparar(estado, 'heroe_en_casilla', { x: h.x, y: h.y, id: h.id });
    if (!h.vivo) break;
  }
  volcar();
  // Nunca acabar encima de otro héroe.
  const otro = [...Object.values(estado.heroes), estado.cargador].find((o) => o && o !== h && o.vivo && !o.fuera && o.x === h.x && o.y === h.y);
  if (otro) {
    for (let i = ruta.length - 1; i >= 0; i--) {
      const [rx, ry] = ruta[i];
      if (!T.figuraEn(estado, rx, ry)) { ev(estado, { tipo: 'mover', id: h.id, ruta: [[h.x, h.y], [rx, ry]] }); h.x = rx; h.y = ry; break; }
    }
  }
  return null;
}

// =============================================================
//  ACCIONES DISPONIBLES (la interfaz pregunta esto)
// =============================================================
export function objetivosAtaque(estado, h) {
  const arma = D.ARMAS[h.arma];
  return estado.monstruos.filter((m) => {
    if (!m.vivo || !m.visto) return false;
    if (arma.distancia) return !T.adyacentes(h, m) && T.lineaVision(estado, h.x, h.y, m.x, m.y, true);
    if (T.puedeTocar(estado, h, m)) return true;
    return arma.diagonal && T.diagonales(h, m) && T.diagonalLibre(estado, h, m);
  }).map((m) => m.id);
}

export function objetivosHechizo(estado, h, id) {
  const hz = D.HECHIZOS[id];
  if (hz.objetivo === 'monstruo') {
    return estado.monstruos.filter((m) => m.vivo && m.visto && T.lineaVision(estado, h.x, h.y, m.x, m.y, true)).map((m) => m.id);
  }
  return Object.values(estado.heroes).filter((o) => o.vivo && !o.fuera && (o === h || T.lineaVision(estado, h.x, h.y, o.x, o.y, true))).map((o) => o.id);
}

const enEscalera = (estado, h) => estado.escalera.some(([x, y]) => x === h.x && y === h.y);
const requisitosSalida = (estado) => {
  const o = estado.mision.objetivo;
  return (o.tipo === 'escalera' || o.tipo === 'escapar') && (o.requiere || []).every((f) => estado.flags[f]);
};

// Objetivo "escapar": rondas que quedan antes del derrumbe (null si no aplica).
export function rondasRestantes(estado) {
  const o = estado.mision?.objetivo;
  if (o?.tipo !== 'escapar') return null;
  return Math.max(0, o.rondas - (estado.ronda || 0));
}

// Se acaba el tiempo: quien siga dentro queda sepultado.
function derrumbe(estado) {
  avisar(estado, '¡La mazmorra se derrumba! Quien no ha salido queda sepultado bajo las piedras.', 'peligro');
  ev(estado, { tipo: 'temblor' });
  for (const h of Object.values(estado.heroes)) {
    if (h.vivo && !h.fuera) { h.vivo = false; h.cuerpo = 0; ev(estado, { tipo: 'muerte', id: h.id }); sumar(cronH(estado, h.id), 'caidas'); }
  }
  comprobarFin(estado);
}

export function disponibles(estado, id) {
  const h = estado.heroes[id];
  const t = estado.turno;
  const r = { miTurno: false };
  if (!h || estado.fase !== 'mision' || !t || t.heroe !== id || estado.resultado) return r;
  r.miTurno = true;
  r.puedeTirar = !t.movTirada;
  r.destinos = destinos(estado, h).out;
  const libre = !t.accion;
  const sala = T.region(h.x, h.y);
  const aLaVista = monstruosALaVista(estado, h).length > 0;
  r.atacables = libre ? objetivosAtaque(estado, h) : [];
  r.hechizos = libre ? h.hechizos.map((hz) => ({ id: hz, objetivos: objetivosHechizo(estado, h, hz) })).filter((x) => x.objetivos.length) : [];
  r.buscarTesoro = libre && sala !== '.' && !aLaVista && !estado.buscado[id + ':' + sala];
  r.buscarTrampas = libre && !aLaVista;
  r.motivoBusqueda = aLaVista ? 'Hay monstruos a la vista' : (sala === '.' ? 'El tesoro solo se busca en salas' : (estado.buscado[id + ':' + sala] ? 'Ya buscaste tesoro aquí' : ''));
  r.desarmables = libre && (D.HEROES[id].desarmaSiempre || h.kit)
    ? estado.trampas.filter((tr) => tr.activa && tr.descubierta && (Math.abs(tr.x - h.x) + Math.abs(tr.y - h.y) <= 1)).map((tr) => tr.id) : [];
  // Calderos: un trago por héroe y caldero en cada misión, estando al lado.
  r.calderos = libre ? estado.muebles.map((u, i) => i).filter((i) => {
    const u = estado.muebles[i];
    return u.tipo === 'caldero' && !(estado.bebido || {})[h.id + ':' + i] && T.region(u.x, u.y) === sala
      && h.x >= u.x - 1 && h.x <= u.x + u.w && h.y >= u.y - 1 && h.y <= u.y + u.h;
  }) : [];
  r.pociones = Object.entries(h.objetos).filter(([, n]) => n > 0).map(([k]) => k);
  r.salir = enEscalera(estado, h) && requisitosSalida(estado);
  // Cargador: lo mueve el héroe que lo contrató, en su turno.
  const c = estado.cargador;
  if (c?.vivo && c.patron === id) {
    r.cargador = { puedeTirar: !t.cargTirada, restante: t.cargRestante || 0, destinos: destinosCargador(estado).out };
  }
  // Mochila: pegado al cargador y pagando 1 casilla de movimiento (una vez por turno).
  if (c?.vivo) {
    const pegado = T.puedeTocar(estado, h, c);
    r.mochila = pegado && (t.mochila || (t.movTirada && t.movRestante >= 1));
    r.motivoMochila = !pegado ? 'Ponte al lado del cargador.' : (!t.movTirada ? 'Tira los dados primero: abrir la mochila cuesta 1 casilla.' : 'No te queda movimiento para abrir la mochila.');
    r.cercaCargador = pegado;
  }
  return r;
}

// =============================================================
//  CARGADOR: movimiento
// =============================================================
function alcanceCargador(estado) {
  const c = estado.cargador, t = estado.turno;
  if (!c?.vivo || !t || !t.cargTirada || t.cargRestante <= 0) return {};
  const visible = (x, y) => !!estado.revelado[clave(x, y)];
  return T.explorar([c.x, c.y], t.cargRestante, (a, n) => {
    const [x, y] = n;
    if (!visible(x, y) || T.esRoca(estado, x, y) || T.muebleEn(estado, x, y)) return false;
    if (T.borde(estado, a, n) !== 'libre') return false; // no abre puertas
    const f = T.figuraEn(estado, x, y);
    if (f && !T.esAliado(estado, f)) return false;
    const tr = trampaEn(estado, x, y);
    return !(tr && tr.descubierta);
  });
}

export function destinosCargador(estado) {
  const mapa = alcanceCargador(estado);
  const out = {};
  for (const [k, c] of Object.entries(mapa)) if (c.d > 0 && !T.figuraEn(estado, c.x, c.y)) out[k] = c.d;
  return { mapa, out };
}

function tirarCargador(estado) {
  const t = estado.turno;
  const valores = Array.from({ length: D.CARGADOR.dados }, d6);
  const total = valores.reduce((s, v) => s + v, 0);
  t.cargTirada = total; t.cargRestante = total;
  ev(estado, { tipo: 'tirada', heroe: 'cargador', valores, total });
}

function moverCargador(estado, x, y) {
  const c = estado.cargador, t = estado.turno;
  const { mapa, out } = destinosCargador(estado);
  const k = clave(x, y);
  if (!out[k]) return 'El cargador no llega ahí.';
  const ruta = T.reconstruir(mapa, k);
  let tramo = [[c.x, c.y]];
  for (let i = 1; i < ruta.length; i++) {
    const prev = ruta[i - 1], n = ruta[i];
    c.x = n[0]; c.y = n[1];
    t.cargRestante--;
    tramo.push(n);
    const tr = trampaEn(estado, c.x, c.y);
    if (tr && !tr.descubierta) {
      ev(estado, { tipo: 'mover', id: 'cargador', ruta: tramo }); tramo = [[c.x, c.y]];
      activarTrampa(estado, c, tr, prev);
      t.cargRestante = 0;
      break;
    }
  }
  if (tramo.length > 1) ev(estado, { tipo: 'mover', id: 'cargador', ruta: tramo });
  // No acabar encima de otra figura (puede pasar si una trampa lo hace retroceder).
  return null;
}

// "Que me siga": tira si hace falta y se acerca todo lo posible al patrón.
function seguir(estado, h) {
  const t = estado.turno;
  if (!t.cargTirada) tirarCargador(estado);
  if (t.cargRestante <= 0) return null;
  const { out } = destinosCargador(estado);
  const c = estado.cargador;
  const dist = (x, y) => Math.abs(x - h.x) + Math.abs(y - h.y);
  let mejor = null;
  for (const [k, d] of Object.entries(out)) {
    const [x, y] = k.split(',').map(Number);
    const puntos = dist(x, y) * 100 + d;
    if (!mejor || puntos < mejor.p) mejor = { x, y, p: puntos };
  }
  if (!mejor || dist(mejor.x, mejor.y) >= dist(c.x, c.y)) { avisar(estado, 'El cargador no puede acercarse más.'); return null; }
  return moverCargador(estado, mejor.x, mejor.y);
}

// =============================================================
//  INVENTARIO PERSONAL, CARGADOR Y BANCO
//  - Cada héroe tiene su inventario (lo que no lleva encima). No se
//    pasa a otros héroes; se puede vender a mitad de precio.
//  - En el campamento, cada héroe decide qué parte carga en el cargador.
//    En la mazmorra solo se accede a esa carga, junto al cargador.
//    Si el cargador muere, su carga se pierde.
//  - Banco: dinero guardado aparte de la bolsa. Se puede transferir a
//    otro héroe hasta un 40 % del total, una vez por misión.
// =============================================================
export const nuevaBolsa = () => ({ armas: [], armaduras: [], objetos: {} });
export const inventarioDe = (h) => (h.inventario ||= nuevaBolsa());
export const TRANSFERENCIA_MAX = 0.4;

// Partidas guardadas con versiones anteriores: inventario compartido → personal.
export function asegurarInventario(estado) {
  for (const h of Object.values(estado.heroes)) { inventarioDe(h); h.banco ??= 0; }
  const viejo = estado.almacen;
  if (viejo) {
    const reparte = (item) => {
      const h = estado.orden.map((t) => estado.heroes[t]).find((x) => !motivoNoEquipar(x, item) || x.arma === item) || estado.heroes[estado.orden[0]];
      meter(inventarioDe(h), item);
    };
    for (const i of [...viejo.armas, ...viejo.armaduras]) reparte(i);
    for (const [k, n] of Object.entries(viejo.objetos || {})) for (let j = 0; j < n; j++) reparte(k);
    delete estado.almacen;
  }
  if (estado.contrato) estado.contrato.carga ||= {};
  if (estado.cargador) estado.cargador.carga ||= {};
}

export function meter(bolsa, item) {
  if (D.ARMAS[item]) bolsa.armas.push(item);
  else if (D.ARMADURAS[item]) bolsa.armaduras.push(item);
  else bolsa.objetos[item] = (bolsa.objetos[item] || 0) + 1;
}
function sacar(bolsa, item) {
  const lista = D.ARMAS[item] ? bolsa.armas : D.ARMADURAS[item] ? bolsa.armaduras : null;
  if (lista) { const i = lista.indexOf(item); if (i < 0) return false; lista.splice(i, 1); return true; }
  if (!(bolsa.objetos[item] > 0)) return false;
  bolsa.objetos[item]--;
  return true;
}
export const contenido = (bolsa) => {
  if (!bolsa) return [];
  const items = [...bolsa.armas, ...bolsa.armaduras];
  for (const [k, n] of Object.entries(bolsa.objetos)) for (let i = 0; i < n; i++) items.push(k);
  return items;
};
// Carga de un héroe en el cargador: la del contrato (campamento) o la del cargador (mazmorra).
export function cargaDe(estado, id) {
  const dueno = estado.fase === 'mision' || estado.fase === 'resultado' ? estado.cargador : estado.contrato;
  if (!dueno) return null;
  dueno.carga ||= {};
  return (dueno.carga[id] ||= nuevaBolsa());
}

// ¿Puede este héroe equiparse este objeto? Devuelve el motivo si no.
export function motivoNoEquipar(h, item) {
  const tipoH = D.HEROES[h.tipo];
  const arma = D.ARMAS[item], arm = D.ARMADURAS[item];
  if (arma) {
    if (h.arma === item) return 'Ya la llevas.';
    if (tipoH.sinArmadura && !D.MAGO_ARMAS.includes(item)) return 'Solo puede usar daga o bastón.';
    if (arma.dosManos && h.armaduras.includes('escudo')) return 'Va a dos manos: guarda antes el escudo.';
  } else if (arm) {
    if (tipoH.sinArmadura) return 'La armadura estorba al lanzar hechizos.';
    if (h.armaduras.includes(item)) return 'Ya la llevas puesta.';
    if (item === 'escudo' && D.ARMAS[h.arma].dosManos) return 'Tu arma va a dos manos.';
  } else if (!D.POCIONES[item]) return 'No existe.';
  return null;
}

// Equipa un objeto; lo que se quita va a la bolsa indicada.
function ponerEquipo(h, item, bolsa) {
  if (D.ARMAS[item]) { meter(bolsa, h.arma); h.arma = item; }
  else if (D.ARMADURAS[item]) {
    const choca = item === 'placas' ? 'cota' : item === 'cota' ? 'placas' : null;
    if (choca && h.armaduras.includes(choca)) { h.armaduras = h.armaduras.filter((x) => x !== choca); meter(bolsa, choca); }
    h.armaduras.push(item);
  } else h.objetos[item] = (h.objetos[item] || 0) + 1;
}

function equipar(estado, h, item, bolsa = inventarioDe(h)) {
  const motivo = motivoNoEquipar(h, item);
  if (motivo) return motivo;
  if (!sacar(bolsa, item)) return 'No lo tienes guardado.';
  ponerEquipo(h, item, bolsa);
  log(estado, h.nombre + ' se equipa ' + nombreItem(item) + '.');
  return null;
}

function guardar(estado, h, item, bolsa = inventarioDe(h)) {
  if (D.ARMADURAS[item]) {
    if (!h.armaduras.includes(item)) return 'No la llevas puesta.';
    h.armaduras = h.armaduras.filter((x) => x !== item);
  } else if (D.POCIONES[item]) {
    if (!(h.objetos[item] > 0)) return 'No la llevas.';
    h.objetos[item]--;
  } else return 'Las armas se cambian equipando otra.';
  meter(bolsa, item);
  log(estado, h.nombre + ' guarda ' + nombreItem(item) + '.');
  return null;
}

export const precioVenta = (item) => Math.floor(((D.ARMAS[item] || D.ARMADURAS[item] || D.POCIONES[item] || {}).precio || 100) / 2);
function vender(estado, h, item) {
  if (!sacar(inventarioDe(h), item)) return 'No está en tu inventario.';
  const oro = precioVenta(item);
  h.oro += oro;
  log(estado, h.nombre + ' vende ' + nombreItem(item) + ' por ' + oro + ' monedas.');
  return null;
}

// Pasar objetos del inventario al cargador (y al revés), en el campamento.
function cargar(estado, h, item) {
  if (!estado.contrato) return 'Primero hay que contratar un cargador.';
  if (!sacar(inventarioDe(h), item)) return 'No está en tu inventario.';
  meter(cargaDe(estado, h.id), item);
  return null;
}
function descargar(estado, h, item) {
  const c = estado.contrato && cargaDe(estado, h.id);
  if (!c || !sacar(c, item)) return 'No está en la mochila.';
  meter(inventarioDe(h), item);
  return null;
}

// ---------- Banco ----------
const cantidadValida = (n) => Number.isInteger(n) && n > 0;
function depositar(estado, h, n) {
  if (!cantidadValida(n) || n > h.oro) return 'No tienes tanto en la bolsa.';
  h.oro -= n; h.banco += n;
  log(estado, h.nombre + ' guarda ' + n + ' monedas en el banco.');
  return null;
}
function retirar(estado, h, n) {
  if (!cantidadValida(n) || n > h.banco) return 'No tienes tanto en el banco.';
  h.banco -= n; h.oro += n;
  log(estado, h.nombre + ' saca ' + n + ' monedas del banco.');
  return null;
}
export const maxTransferencia = (h) => Math.min(h.banco, Math.floor((h.oro + h.banco) * TRANSFERENCIA_MAX));
function transferir(estado, h, destino, n) {
  const otro = estado.heroes[destino];
  if (!otro || otro === h) return 'Elige a otro héroe.';
  if (h.transferido) return 'Ya has hecho una transferencia antes de esta misión.';
  if (!cantidadValida(n)) return 'Cantidad no válida.';
  if (n > h.banco) return 'Las transferencias salen del banco: ingresa primero el dinero.';
  if (n > maxTransferencia(h)) return 'Como mucho puedes transferir ' + maxTransferencia(h) + ' monedas (el 40 % de tu dinero).';
  h.banco -= n; otro.banco += n; h.transferido = true;
  log(estado, h.nombre + ' transfiere ' + n + ' monedas al banco ' + (otro.fem ? 'de la ' : 'del ') + otro.nombre + '.');
  return null;
}

export const nombreItem = (item) => (D.ARMAS[item] || D.ARMADURAS[item] || D.POCIONES[item] || D.OBJETOS_TIENDA[item] || { nombre: item }).nombre;

// =============================================================
//  TESORO Y BÚSQUEDAS
// =============================================================
function darArma(estado, h, armaId) {
  const arma = D.ARMAS[armaId];
  if (!motivoNoEquipar(h, armaId) && arma.ataque >= D.ARMAS[h.arma].ataque) {
    meter(inventarioDe(h), h.arma);
    h.arma = armaId;
    return 'Ahora empuñas: ' + arma.nombre + '. Tu arma anterior va a tu inventario.';
  }
  meter(inventarioDe(h), armaId);
  return 'Va a tu inventario: podrás equipártela o venderla en el campamento.';
}

function robarCarta(estado) {
  if (!estado.mazo.length) estado.mazo = barajar(D.CARTAS_TESORO.map((c) => ({ ...c })));
  return estado.mazo.pop();
}

// Apunta en la crónica un hallazgo (oro u objeto).
function apuntarTesoro(estado, h, oro, objeto) {
  if (!oro && !objeto) return;
  const c = cron(estado), ch = cronH(estado, h.id);
  sumar(c, 'tesoros'); sumar(ch, 'tesoros');
  sumar(c, 'oro', oro || 0); sumar(ch, 'oro', oro || 0);
}

// El caldero: un trago y que sea lo que el dado quiera.
function beberCaldero(estado, h, i) {
  (estado.bebido ||= {})[h.id + ':' + i] = 1;
  sumar(cronH(estado, h.id), 'pociones');
  const dado = d6();
  const n = h.nombre;
  let texto, tono = 'bueno';
  switch (dado) {
    case 1: h.cuerpo = Math.max(1, h.cuerpo - 1); texto = `¡Puaj! ${n} bebe del caldero y es veneno: pierde 1 de cuerpo.`; tono = 'peligro'; break;
    case 2: texto = `${n} bebe del caldero. Sabe a calcetín hervido… y no pasa nada.`; tono = ''; break;
    case 3: h.cuerpo = Math.min(h.cuerpoMax, h.cuerpo + 2); texto = `${n} bebe del caldero: un caldo reconfortante (+2 de cuerpo).`; break;
    case 4: h.efectos.fuerza = 2; texto = `${n} bebe del caldero y siente una fuerza salvaje: +2 dados en su próximo ataque.`; break;
    case 5: h.efectos.piel = true; texto = `${n} bebe del caldero y su piel se vuelve gris como la roca.`; break;
    default: h.cuerpo = h.cuerpoMax; texto = `¡${n} bebe del caldero y todas sus heridas se cierran! Cuerpo al máximo.`;
  }
  ev(estado, { tipo: 'caldero', heroe: h.id, dado, texto, tono });
  log(estado, texto, tono);
}

function buscarTesoro(estado, h) {
  const sala = T.region(h.x, h.y);
  estado.buscado[h.id + ':' + sala] = 1;
  sumar(cron(estado), 'busquedas');
  sumar(cronH(estado, h.id), 'busquedas');
  const fijo = estado.mision.tesoros?.[sala];
  if (fijo && !estado.tesoroTomado[sala]) {
    estado.tesoroTomado[sala] = 1;
    if (fijo.trampaCofre && !estado.cofreSeguro[sala]) {
      ev(estado, { tipo: 'mensaje', texto: '¡Una aguja envenenada salta del cierre! ' + h.nombre + ' pierde 1 de cuerpo.', tono: 'peligro' });
      danarHeroe(estado, h, 1);
      if (!h.vivo) return;
    }
    let texto = fijo.texto;
    if (fijo.oro) h.oro += fijo.oro;
    if (fijo.objeto) h.objetos[fijo.objeto] = (h.objetos[fijo.objeto] || 0) + 1;
    if (fijo.arma) texto += ' ' + darArma(estado, h, fijo.arma);
    ev(estado, { tipo: 'tesoro', heroe: h.id, texto, oro: fijo.oro || 0, objeto: fijo.objeto || fijo.arma || null, especial: !!fijo.flag });
    apuntarTesoro(estado, h, fijo.oro, fijo.objeto || fijo.arma || fijo.flag);
    log(estado, h.nombre + ': ' + texto, 'tesoro');
    if (fijo.flag) ponerFlag(estado, fijo.flag);
    disparar(estado, 'tesoro', { region: sala });
    return;
  }
  const c = robarCarta(estado);
  if (c.peligro) estado.mazo.splice(rnd(estado.mazo.length + 1), 0, c);
  ev(estado, { tipo: 'tesoro', heroe: h.id, texto: c.texto, oro: c.oro || 0, objeto: c.objeto || null, carta: c.tipo });
  log(estado, h.nombre + ' busca tesoro: ' + c.texto, c.peligro ? 'peligro' : 'tesoro');
  if (c.tipo === 'oro' || c.tipo === 'pocion') apuntarTesoro(estado, h, c.oro, c.objeto);
  if (c.tipo === 'oro') h.oro += c.oro;
  else if (c.tipo === 'pocion') h.objetos[c.objeto] = (h.objetos[c.objeto] || 0) + 1;
  else if (c.tipo === 'flecha' || c.tipo === 'derrumbe') danarHeroe(estado, h, 1);
  else if (c.tipo === 'errante') {
    const tipo = estado.mision.errante || 'orco';
    const cerca = T.DIRS.map(([dx, dy]) => [h.x + dx, h.y + dy])
      .find(([x, y]) => T.dentro(x, y) && T.borde(estado, [h.x, h.y], [x, y]) === 'libre' && !T.esRoca(estado, x, y) && !T.muebleEn(estado, x, y) && !T.figuraEn(estado, x, y));
    const m = aparecer(estado, { tipo, x: (cerca || [h.x, h.y])[0], y: (cerca || [h.x, h.y])[1], ia: 'agresivo' });
    if (m) { if (!m.visto) { m.visto = true; ev(estado, { tipo: 'aparece', id: m.id }); } if (T.puedeTocar(estado, m, h)) golpearHeroe(estado, m, h, m.ataque); }
  }
}

function buscarTrampas(estado, h) {
  const sala = T.region(h.x, h.y);
  let casillas;
  if (sala !== '.') casillas = T.casillasDe(sala);
  else {
    casillas = [];
    for (const k of Object.keys(estado.revelado)) {
      const [x, y] = k.split(',').map(Number);
      if (T.region(x, y) === '.' && T.lineaVision(estado, h.x, h.y, x, y)) casillas.push([x, y]);
    }
  }
  const set = new Set(casillas.map(([x, y]) => clave(x, y)));
  let trampas = 0, secretas = 0;
  for (const t of estado.trampas) if (t.activa && !t.descubierta && set.has(clave(t.x, t.y))) { t.descubierta = true; trampas++; }
  for (const p of estado.puertas) {
    if (p.secreta && !p.descubierta && (set.has(clave(p.a[0], p.a[1])) || set.has(clave(p.b[0], p.b[1])))) { p.descubierta = true; secretas++; }
  }
  let cofre = false;
  const fijo = estado.mision.tesoros?.[sala];
  if (fijo?.trampaCofre && !estado.cofreSeguro[sala] && !estado.tesoroTomado[sala]) { estado.cofreSeguro[sala] = 1; cofre = true; }
  const partes = [];
  if (trampas) partes.push(trampas === 1 ? 'una trampa' : trampas + ' trampas');
  if (secretas) partes.push(secretas === 1 ? '¡una puerta secreta!' : secretas + ' puertas secretas');
  if (cofre) partes.push('una aguja envenenada en un cofre, que inutilizas');
  sumar(cron(estado), 'trampasHalladas', trampas);
  sumar(cron(estado), 'secretas', secretas);
  sumar(cronH(estado, h.id), 'busquedas');
  sumar(cronH(estado, h.id), 'secretas', secretas);
  const texto = partes.length ? h.nombre + ' encuentra ' + partes.join(' y ') : h.nombre + ' no encuentra trampas ni pasadizos.';
  ev(estado, { tipo: 'busqueda', heroe: h.id, texto, secretas, trampas });
  log(estado, texto, secretas ? 'tesoro' : '');
  disparar(estado, 'busqueda', { region: sala });
}

function desarmar(estado, h, id) {
  const t = estado.trampas.find((x) => x.id === id);
  if (D.HEROES[h.tipo].desarmaSiempre) {
    t.activa = false;
    sumar(cron(estado), 'desarmadas');
    avisar(estado, h.nombre + ' desarma la trampa con mano experta.', 'bueno');
    return;
  }
  const dado = tirarCombate(1);
  if (dado[0] === 'escudoNegro') {
    avisar(estado, 'El mecanismo salta en las manos de ' + h.nombre + '.', 'peligro');
    activarTrampa(estado, h, t, null);
    if (t.tipo !== 'bloque') t.activa = false;
  } else {
    t.activa = false;
    sumar(cron(estado), 'desarmadas');
    avisar(estado, h.nombre + ' desarma la trampa con sus herramientas.', 'bueno');
  }
}

// =============================================================
//  HECHIZOS
// =============================================================
function lanzar(estado, h, id, objetivo) {
  const hz = D.HECHIZOS[id];
  sumar(cronH(estado, h.id), 'hechizos');
  h.hechizos.splice(h.hechizos.indexOf(id), 1);
  const m = estado.monstruos.find((x) => x.id === objetivo);
  const o = estado.heroes[objetivo];
  ev(estado, { tipo: 'hechizo', heroe: h.id, hechizo: id, objetivo, elemento: hz.elemento });
  log(estado, h.nombre + ' lanza ' + hz.nombre + ' sobre ' + nombreDe(estado, objetivo) + '.', 'magia');
  switch (id) {
    case 'bolaFuego': {
      const salva = tirarCombate(2);
      const dano = Math.max(0, 2 - cuenta(salva, 'escudoNegro'));
      ev(estado, { tipo: 'dados', atacante: h.id, defensor: m.id, ataque: ['calavera', 'calavera'], defensa: salva, dano, defiende: 'monstruo', etiqueta: hz.nombre, magia: true });
      danarMonstruo(estado, m, dano); break;
    }
    case 'llamarada': {
      const afectados = [m, ...estado.monstruos.filter((x) => x.vivo && x !== m && T.adyacentes(x, m))];
      for (const x of afectados) danarMonstruo(estado, x, 1);
      avisar(estado, 'Las llamas alcanzan a ' + afectados.length + (afectados.length === 1 ? ' monstruo.' : ' monstruos.'), 'magia');
      break;
    }
    case 'coraje': o.efectos.coraje = 2; break;
    case 'vendaval': m.efectos.aturdido = true; break;
    case 'vientoVeloz': o.efectos.veloz = true; break;
    case 'espiritu': golpearMonstruo(estado, h, m, 5, hz.nombre); break;
    case 'sanar': case 'balsamo': o.cuerpo = Math.min(o.cuerpoMax, o.cuerpo + 4); break;
    case 'niebla': o.efectos.niebla = true; break;
    case 'sueno':
      if (m.nomuerto) avisar(estado, 'Los muertos no duermen: el hechizo no tiene efecto.');
      else if (tirarCombate(m.mente).includes('escudoNegro')) avisar(estado, m.nombre + ' resiste el sueño.');
      else { m.efectos.dormido = true; avisar(estado, m.nombre + ' cae dormido.', 'magia'); }
      break;
    case 'pielRoca': o.efectos.piel = true; break;
    case 'raices': m.efectos.raices = 2; break;
  }
}

// =============================================================
//  TURNOS
// =============================================================
function empezarTurno(estado, id) {
  const h = estado.heroes[id];
  delete h.efectos.niebla;
  estado.turno = { heroe: id, movTirada: null, movRestante: 0, movido: false, accion: false, cargTirada: null, cargRestante: 0, mochila: false };
  ev(estado, { tipo: 'turno', heroe: id });
}

function siguienteTurno(estado) {
  if (estado.resultado) return;
  const activos = estado.orden.filter((t) => estado.heroes[t].vivo && !estado.heroes[t].fuera);
  if (!activos.length) return comprobarFin(estado);
  const actual = estado.turno ? estado.orden.indexOf(estado.turno.heroe) : -1;
  const siguiente = estado.orden.slice(actual + 1).find((t) => activos.includes(t));
  if (siguiente) return empezarTurno(estado, siguiente);
  turnoMonstruos(estado);
  comprobarFin(estado);
  if (estado.resultado) return;
  estado.ronda++;
  const quedan = rondasRestantes(estado);
  if (quedan !== null) {
    if (quedan <= 0) return derrumbe(estado);
    if (quedan <= 3) avisar(estado, quedan === 1 ? '¡Última ronda antes del derrumbe!' : '¡Quedan ' + quedan + ' rondas antes del derrumbe!', 'peligro');
  }
  const primero = estado.orden.find((t) => estado.heroes[t].vivo && !estado.heroes[t].fuera);
  if (primero) empezarTurno(estado, primero);
}

const ctxIA = {
  golpearHeroe, danarHeroe, aparecer, ev,
  avisar: (estado, t, tono) => avisar(estado, t, tono)
};

function turnoMonstruos(estado) {
  ev(estado, { tipo: 'fase', fase: 'monstruos' });
  const lista = estado.monstruos.slice();
  for (const m of lista) {
    if (!m.vivo || !m.visto || !m.activo) continue;
    if (!Object.values(estado.heroes).some((h) => h.vivo && !h.fuera)) break;
    turnoMonstruo(estado, m, ctxIA);
  }
  ev(estado, { tipo: 'fase', fase: 'heroes' });
}

// =============================================================
//  FINAL DE MISIÓN
// =============================================================
function comprobarFin(estado) {
  if (estado.resultado || estado.fase !== 'mision') return;
  const o = estado.mision.objetivo;
  const heroes = Object.values(estado.heroes);
  const vivos = heroes.filter((h) => h.vivo);
  const dentro = vivos.filter((h) => !h.fuera);
  let res = null;
  if (o.tipo === 'matar') {
    const m = estado.monstruos.find((x) => x.id === o.id);
    if (m && !m.vivo) res = 'victoria';
  }
  if (!res && !dentro.length) res = vivos.length && requisitosSalida(estado) ? 'victoria' : 'derrota';
  if (!res) return;
  estado.resultado = res;
  estado.fase = 'resultado';
  cerrarCronica(estado, res);
  if (res === 'victoria') {
    for (const h of vivos) h.oro += estado.mision.recompensa || 0;
    estado.completadas = Math.max(estado.completadas || 0, estado.misionIdx + 1);
  }
  ev(estado, { tipo: 'fin', resultado: res });
  log(estado, res === 'victoria' ? '¡Misión cumplida!' : 'Los héroes han caído...', res === 'victoria' ? 'bueno' : 'peligro');
}

// =============================================================
//  ARMERÍA
// =============================================================
// Solo se compra lo que el héroe puede usar (el equipo no se pasa a otros).
// Si ahora no puede ponérselo (p. ej. un escudo llevando hacha), va a su inventario.
export function puedeComprar(estado, h, item) {
  const def = D.ARMAS[item] || D.ARMADURAS[item] || D.OBJETOS_TIENDA[item];
  if (!def?.precio) return 'No existe.';
  if (item === 'kit' && (h.kit || D.HEROES[h.tipo].desarmaSiempre)) return 'No lo necesitas.';
  if (!D.OBJETOS_TIENDA[item]) {
    const m = motivoNoEquipar(h, item);
    if (m && !/dos manos|escudo/.test(m)) return m;
  }
  if (h.oro < def.precio) return 'No tienes oro suficiente en la bolsa.';
  return null;
}

function comprar(estado, h, item) {
  const motivo = puedeComprar(estado, h, item);
  if (motivo) return motivo;
  const def = D.ARMAS[item] || D.ARMADURAS[item] || D.OBJETOS_TIENDA[item];
  h.oro -= def.precio;
  let destino = '';
  if (item === 'kit') h.kit = true;
  else if (D.OBJETOS_TIENDA[item]) h.objetos[item] = (h.objetos[item] || 0) + 1;
  else if (!motivoNoEquipar(h, item)) ponerEquipo(h, item, inventarioDe(h));
  else { meter(inventarioDe(h), item); destino = ' (a su inventario)'; }
  ev(estado, { tipo: 'compra', heroe: h.id, item });
  log(estado, h.nombre + ' compra ' + def.nombre + destino + '.');
  return null;
}

function contratar(estado, h) {
  if (estado.contrato) return estado.contrato.patron === h.id ? 'Ya lo has contratado.' : 'Ya hay un cargador contratado.';
  if (h.oro < D.CARGADOR.precio) return 'No tienes oro suficiente.';
  h.oro -= D.CARGADOR.precio;
  estado.contrato = { patron: h.id, carga: {} };
  log(estado, h.nombre + ' contrata un cargador para la próxima misión.');
  return null;
}

function despedir(estado, h) {
  if (estado.contrato?.patron !== h.id) return 'No has contratado ningún cargador.';
  // Lo que llevaba vuelve a cada inventario.
  for (const [id, bolsa] of Object.entries(estado.contrato.carga || {})) for (const i of contenido(bolsa)) meter(inventarioDe(estado.heroes[id]), i);
  h.oro += D.CARGADOR.precio;
  estado.contrato = null;
  log(estado, h.nombre + ' cancela el cargador.');
  return null;
}

// =============================================================
//  PUNTO DE ENTRADA: aplicar una acción
//  Devuelve null si fue bien o un texto con el motivo del rechazo.
//  cargarMision(id) -> JSON de la misión (lo pone la interfaz).
// =============================================================
export function puedeControlar(estado, jugador, heroe) {
  const h = estado.heroes[heroe];
  if (!h) return false;
  if (h.jugador === jugador) return true;
  // El anfitrión puede mover a los héroes de jugadores desconectados.
  return jugador === estado.anfitrion && !!estado.jugadores?.[h.jugador]?.desconectado;
}

export function aplicar(estado, a, jugador, cargarMision) {
  const esAnfitrion = jugador === estado.anfitrion;
  asegurarInventario(estado);
  if (a.tipo === 'empezar') {
    if (!esAnfitrion || estado.fase !== 'briefing') return 'Solo el anfitrión empieza la misión.';
    estado.fase = 'mision';
    // Orden de turno al azar en cada misión.
    barajar(estado.orden);
    avisar(estado, 'Orden de turno: ' + estado.orden.map((t) => estado.heroes[t].nombre).join(', ') + '.');
    revelar(estado);
    empezarTurno(estado, estado.orden.find((t) => estado.heroes[t].vivo));
    return null;
  }
  if (a.tipo === 'continuar') {
    if (!esAnfitrion || estado.fase !== 'resultado') return 'Solo el anfitrión.';
    if (estado.resultado === 'victoria') {
      estado.misionIdx++;
      estado.fase = !estado.aleatorio && estado.misionIdx >= estado.campana.length ? 'final' : 'armeria';
    } else estado.fase = 'armeria';
    // La transferencia del banco se recupera al acabar cada misión.
    for (const h of Object.values(estado.heroes)) { h.vivo = true; h.cuerpo = h.cuerpoMax; h.transferido = false; }
    const c = estado.cargador;
    if (c?.vivo) for (const [id, bolsa] of Object.entries(c.carga || {})) for (const i of contenido(bolsa)) meter(inventarioDe(estado.heroes[id]), i);
    estado.cargador = null;
    ev(estado, { tipo: 'pantalla', fase: estado.fase });
    return null;
  }
  // Desde el pergamino de la misión se puede volver al campamento.
  if (a.tipo === 'volverCampamento') {
    // Temporal: también desde dentro de la misión (la misión se reinicia al volver a bajar).
    if (!esAnfitrion || !['briefing', 'mision'].includes(estado.fase)) return 'Solo el anfitrión.';
    for (const h of Object.values(estado.heroes)) { h.vivo = true; h.fuera = false; h.cuerpo = h.cuerpoMax; h.efectos = {}; }
    estado.turno = null;
    if (estado.cargador && !estado.cargador.vivo) estado.cargador = null;
    asegurarInventario(estado);
    const c = estado.cargador;
    if (c) estado.contrato = { patron: c.patron, carga: c.carga || {} };
    estado.cargador = null;
    estado.fase = 'armeria';
    ev(estado, { tipo: 'pantalla', fase: 'armeria' });
    return null;
  }
  if (a.tipo === 'siguienteMision') {
    if (!esAnfitrion || estado.fase !== 'armeria') return 'Solo el anfitrión.';
    // Mazmorra Perdida: cada nivel se genera a partir de la semilla de la partida.
    const def = estado.aleatorio
      ? generarMision(semillaDeNivel(estado.aleatorio.semilla, estado.misionIdx + 1), estado.misionIdx + 1)
      : cargarMision(estado.campana[estado.misionIdx]);
    if (!def) return 'No se pudo cargar la misión.';
    iniciarMision(estado, def);
    ev(estado, { tipo: 'pantalla', fase: 'briefing' });
    return null;
  }

  if (!a.heroe || !puedeControlar(estado, jugador, a.heroe)) return 'Ese héroe no es tuyo.';
  const h = estado.heroes[a.heroe];

  if (estado.fase === 'armeria') {
    switch (a.tipo) {
      case 'comprar': return comprar(estado, h, a.item);
      case 'equipar': return equipar(estado, h, a.item);
      case 'guardar': return guardar(estado, h, a.item);
      case 'vender': return vender(estado, h, a.item);
      case 'contratar': return contratar(estado, h);
      case 'despedir': return despedir(estado, h);
      case 'cargar': return cargar(estado, h, a.item);
      case 'descargar': return descargar(estado, h, a.item);
      case 'depositar': return depositar(estado, h, a.cantidad);
      case 'retirar': return retirar(estado, h, a.cantidad);
      case 'transferir': return transferir(estado, h, a.a, a.cantidad);
    }
  }
  if (['comprar', 'equipar', 'guardar', 'vender', 'contratar', 'despedir', 'cargar', 'descargar', 'depositar', 'retirar', 'transferir'].includes(a.tipo)) return 'Eso solo se hace en el campamento.';

  if (estado.fase !== 'mision' || estado.resultado) return 'No es momento de eso.';
  const t = estado.turno;
  if (t.heroe !== h.id) return 'No es tu turno.';
  const disp = disponibles(estado, h.id);
  const usarAccion = () => { t.accion = true; if (t.movido) t.movRestante = 0; };
  // Quién hace la acción, para apuntar en la crónica quién mata a cada monstruo.
  estado._autor = h.id;
  try { return accionHeroe(estado, a, h, t, disp, usarAccion); } finally { delete estado._autor; }
}

function accionHeroe(estado, a, h, t, disp, usarAccion) {

  switch (a.tipo) {
    case 'tirar': {
      if (!disp.puedeTirar) return 'Ya has tirado.';
      const valores = Array.from({ length: dadosMovimiento(h) }, d6);
      let total = valores.reduce((s, v) => s + v, 0);
      if (h.efectos.veloz) { total *= 2; delete h.efectos.veloz; }
      t.movTirada = total; t.movRestante = total;
      ev(estado, { tipo: 'tirada', heroe: h.id, valores, total });
      break;
    }
    case 'mover': {
      const err = moverHeroe(estado, h, a.x, a.y);
      if (err) return err;
      break;
    }
    case 'atacar': {
      if (!disp.atacables.includes(a.objetivo)) return 'No puedes atacar a ese objetivo.';
      const m = estado.monstruos.find((x) => x.id === a.objetivo);
      usarAccion();
      const extra = (h.efectos.coraje || 0) + (h.efectos.fuerza || 0);
      delete h.efectos.coraje; delete h.efectos.fuerza;
      golpearMonstruo(estado, h, m, ataqueHeroe(h) + extra, D.ARMAS[h.arma].nombre);
      break;
    }
    case 'hechizo': {
      const hz = disp.hechizos.find((x) => x.id === a.hechizo);
      if (!hz || !hz.objetivos.includes(a.objetivo)) return 'No puedes lanzar eso ahí.';
      usarAccion();
      lanzar(estado, h, a.hechizo, a.objetivo);
      break;
    }
    case 'buscarTesoro':
      if (!disp.buscarTesoro) return disp.motivoBusqueda || 'No puedes buscar tesoro ahora.';
      usarAccion(); buscarTesoro(estado, h); break;
    case 'buscarTrampas':
      if (!disp.buscarTrampas) return 'Hay monstruos a la vista.';
      usarAccion(); buscarTrampas(estado, h); break;
    case 'desarmar':
      if (!disp.desarmables.includes(a.trampa)) return 'No puedes desarmar eso.';
      usarAccion(); desarmar(estado, h, a.trampa); break;
    case 'caldero': {
      if (!disp.calderos.includes(a.caldero)) return 'No puedes beber de ese caldero.';
      usarAccion(); beberCaldero(estado, h, a.caldero); break;
    }
    case 'pocion': {
      if (!(h.objetos[a.objeto] > 0)) return 'No tienes esa poción.';
      h.objetos[a.objeto]--;
      sumar(cronH(estado, h.id), 'pociones');
      const n = D.POCIONES[a.objeto].nombre;
      if (a.objeto === 'pocionCurar') { const c = d6(); h.cuerpo = Math.min(h.cuerpoMax, h.cuerpo + c); avisar(estado, h.nombre + ' bebe ' + n + ' (+' + c + ' de cuerpo).', 'bueno'); }
      else if (a.objeto === 'pocionFuerza') { h.efectos.fuerza = 2; avisar(estado, h.nombre + ' bebe ' + n + ': +2 dados en su próximo ataque.', 'bueno'); }
      else if (a.objeto === 'pocionVelocidad') { if (t.movTirada) { t.movRestante += t.movTirada; } else h.efectos.veloz = true; avisar(estado, h.nombre + ' bebe ' + n + '.', 'bueno'); }
      else if (a.objeto === 'pocionPiedra') { h.efectos.piel = true; avisar(estado, h.nombre + ' bebe ' + n + ': su piel se vuelve gris.', 'bueno'); }
      break;
    }
    case 'tirarCargador':
      if (!disp.cargador?.puedeTirar) return 'Ya has movido al cargador.';
      tirarCargador(estado);
      break;
    case 'moverCargador': {
      if (!disp.cargador) return 'No controlas al cargador.';
      const err = moverCargador(estado, a.x, a.y);
      if (err) return err;
      break;
    }
    case 'seguir': {
      if (!disp.cargador) return 'No controlas al cargador.';
      if (!disp.cargador.puedeTirar && disp.cargador.restante <= 0) return 'El cargador ya no puede moverse este turno.';
      const err = seguir(estado, h);
      if (err) return err;
      break;
    }
    case 'mochila': {
      if (!disp.mochila) return disp.motivoMochila || 'No puedes abrir la mochila.';
      if (a.op === 'equipar') { const m = motivoNoEquipar(h, a.item); if (m) return m; }
      // Abrirla cuesta 1 casilla, una vez por turno.
      if (!t.mochila) { t.mochila = true; t.movRestante--; }
      if (a.op === 'abrir') break;
      const bolsa = cargaDe(estado, h.id);
      const err = a.op === 'equipar' ? equipar(estado, h, a.item, bolsa) : a.op === 'guardar' ? guardar(estado, h, a.item, bolsa) : 'Operación desconocida.';
      if (err) return err;
      break;
    }
    case 'salir':
      if (!disp.salir) return 'Aún no podéis salir.';
      h.fuera = true;
      ev(estado, { tipo: 'salida', heroe: h.id });
      log(estado, h.nombre + ' sale de la mazmorra.', 'bueno');
      comprobarFin(estado);
      if (!estado.resultado) siguienteTurno(estado);
      return null;
    case 'finTurno':
      if (!t.movido && !t.accion) sumar(cronH(estado, h.id), 'turnosVacios');
      siguienteTurno(estado);
      return null;
    default:
      return 'Acción desconocida.';
  }
  comprobarFin(estado);
  if (!estado.resultado && !h.vivo) siguienteTurno(estado);
  return null;
}
