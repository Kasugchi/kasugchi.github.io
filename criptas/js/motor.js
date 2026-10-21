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
import { turnoMonstruo, turnoAliado } from './ia.js';
import { generarMision, semillaDeNivel } from './procedural.js';

const { clave } = T;
export const rnd = (n) => Math.floor(Math.random() * n);
export const d6 = () => 1 + rnd(6);
export const tirarCombate = (n) => Array.from({ length: Math.max(0, n) }, () => D.CARAS[rnd(6)]);
const cuenta = (caras, t) => caras.filter((c) => c === t).length;
const barajar = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = rnd(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const copia = (o) => JSON.parse(JSON.stringify(o));

// ---------- Estadísticas de héroe ----------
export const ataqueHeroe = (h) => D.ARMAS[h.arma].ataque + (h.mejoras?.ataque || 0) + (h.efectos?.guerraAtq ? 1 : 0) + (h.subclase ? modSub(h, 'ataque') : 0) + (h.efectos?.oso ? 2 : 0);
export const defensaHeroe = (h) => (h.id === 'cargador' ? D.CARGADOR.defensa
  : D.HEROES[h.tipo].defensa + (h.mejoras?.defensa || 0) + (h.efectos?.guerraDef ? 1 : 0) - (h.efectos?.malaSuerte ? 1 : 0) + (h.subclase ? modSub(h, 'defensa') : 0) + h.armaduras.reduce((s, a) => s + D.ARMADURAS[a].defensa, 0));
export const dadosMovimiento = (h) => (h.armaduras.includes('placas') || h.efectos?.agotado || (h.subclase && modSub(h, 'movimiento')) ? 1 : 2);
// Armas y objetos raros del mercader: ventajas y pegas que dependen de lo que lleva el héroe.
export const armaDe = (h) => D.ARMAS[h?.arma] || {};
const llevaArmadura = (h, prop) => (h?.armaduras || []).some((a) => D.ARMADURAS[a]?.[prop]);
export const menteHeroe = (h) => (h.mente || 0) + (armaDe(h).mente || 0);
const sinCuras = (h) => !!armaDe(h).sinCuras;
const POCIONES_GLOTON = 2;
const pocionesEncima = (h) => Object.entries(h.objetos || {}).filter(([k]) => D.POCIONES[k]).reduce((n, [, v]) => n + v, 0);
const glotonLleno = (h) => llevaArmadura(h, 'gloton') && pocionesEncima(h) >= POCIONES_GLOTON;
// Da una poción; con el Amuleto del glotón lleno, va al inventario.
function darPocion(estado, h, k) {
  if (glotonLleno(h)) { meter(inventarioDe(h), k); log(estado, h.nombre + ' no puede llevar más pociones (Amuleto del glotón): va a su inventario.'); return; }
  h.objetos[k] = (h.objetos[k] || 0) + 1;
}
// Hoja maldita puesta y sin purificar.
export const malditaPuesta = (h) => !!armaDe(h).maldita && !h.purificada;
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
      id: tipo, tipo, jugador: e.jugador, fem, ia: !!e.ia,
      nombre: fem ? base.fem.nombre : base.nombre, icono: fem ? base.fem.icono : base.icono,
      arma: base.arma, armaduras: [], objetos: {}, kit: false, oro: 0,
      cuerpoMax: base.cuerpo, mente: base.mente, cuerpo: base.cuerpo,
      x: 0, y: 0, vivo: true, fuera: false, efectos: {}, hechizos: [],
      inventario: { armas: [], armaduras: [], objetos: {} }, banco: 0, transferido: false,
      nivel: 1, xp: 0, puntos: 0, mejoras: {}
    };
  }
  return {
    v: 1, seq: 0, eventos: [], log: [], jugadores,
    fase: 'cargando', misionIdx: 0, campana: D.CAMPANA.slice(),
    heroes, orden: D.ORDEN_HEROES.filter((t) => heroes[t]),
    mision: null, resultado: null,
    contrato: null, cargador: null, reliquias: {}
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
  estado.muros = (m.muros || []).map((w, i) => ({ id: w.id || 'm' + (i + 1), a: w.a, b: w.b, roto: false }));
  estado.murosPorBorde = {};
  estado.muros.forEach((w, i) => { estado.murosPorBorde[T.claveBorde(w.a, w.b)] = i; });
  estado.reliquiasUsadas = {};
  estado.habUsada = {};
  estado.farol = null; estado.cadena = null; estado.escudo = null;
  for (const h of Object.values(estado.heroes)) {
    for (const k of ['farol', 'cadena', 'muro', 'tiron', 'sordo', 'furia', 'trance', 'dominado', 'aturdidoAlma']) delete h.efectos[k];
    delete h.alma;
    restaurarCaliz(h);
  }
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
    if (h.efectos?.oso) h.cuerpoMax -= 3;
    h.cuerpo = estado.aleatorio && h.cuerpo > 0 ? Math.min(h.cuerpo, h.cuerpoMax) : h.cuerpoMax; h.vivo = true; h.fuera = false; h.efectos = {}; h.fragmentos = 0;
    h.hechizos = subclaseDe(h)?.luz ? D.HECHIZOS_LUZ.slice() : base.elementos.flatMap((el) => D.HECHIZOS_POR_ELEMENTO[el]);
    [h.x, h.y] = estado.escalera[i++];
    if (estado.aleatorio && armaDe(h).avaro && h.oro > 0) { const come = Math.ceil(h.oro / 10); h.oro -= come; log(estado, 'La Espada del avaro se come ' + come + ' monedas de la bolsa de ' + h.nombre + '.', 'peligro'); }
    if (llevaArmadura(h, 'capa')) h.efectos.capa = 2;
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
    x: spec.x, y: spec.y, x0: spec.x, y0: spec.y, region: T.region(spec.x, spec.y),
    mov: spec.mov ?? base.mov, ataque: spec.ataque ?? base.ataque, defensa: spec.defensa ?? base.defensa,
    cuerpo: spec.cuerpo ?? base.cuerpo, cuerpoMax: spec.cuerpo ?? base.cuerpo, mente: base.mente,
    nomuerto: !!base.nomuerto, ia: spec.ia || 'agresivo', activo: spec.ia !== 'centinela',
    hechizos: (spec.hechizos || []).slice(), visto: !!visible, vivo: true, efectos: {}
  };
  if (spec.extra) Object.assign(m, JSON.parse(JSON.stringify(spec.extra)));
  if (estado.mision?.maldicion === 'sinDescanso' && m.mov) m.mov = Math.ceil(m.mov * 1.5);
  if (estado.pesadilla && !spec.noEscalar) { m.ataque += 1; m.cuerpo += 1; }
  // Mazmorra Infinita: cuanto más hondo, más duros (y algunos de élite).
  if (estado.aleatorio && !spec.noEscalar) {
    const piso = estado.misionIdx + 1;
    m.cuerpo += Math.floor((piso - 1) / 3); m.ataque += Math.floor((piso - 1) / 4); m.defensa += Math.floor((piso - 1) / 6);
    if (!m.jefe && piso >= 2 && rnd(100) < Math.min(35, (piso - 1) * 5)) {
      m.elite = true; m.nombre += ' ' + D.EPITETOS[rnd(D.EPITETOS.length)];
      m.cuerpo += 1; m.ataque += 1;
    }
    m.cuerpoMax = m.cuerpo;
  }
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
    const oscuro = estado.mision?.maldicion === 'oscuridad';
    const R = oscuro ? 3 : 14;
    for (let y = Math.max(0, h.y - R); y <= Math.min(D.ALTO - 1, h.y + R); y++) {
      for (let x = Math.max(0, h.x - R); x <= Math.min(D.ANCHO - 1, h.x + R); x++) {
        const k = clave(x, y);
        const r = T.region(x, y);
        if (estado.revelado[k] || (r !== '.' && salas.has(r))) continue;
        if (!T.lineaVision(estado, h.x, h.y, x, y)) continue;
        if (r === '.' || oscuro) estado.revelado[k] = 1; else salas.add(r);
      }
    }
  }
  for (const r of salas) revelarSala(estado, r);
  farolIlumina(estado);
  for (const m of Object.values(estado.heroes)) {
    if (!m.vivo || m.fuera || !subclaseDe(m)?.ventrampas) continue;
    const sala = T.region(m.x, m.y);
    if (sala === '.') continue;
    const vistas = estado.trampas.filter((tr) => tr.activa && !tr.descubierta && T.region(tr.x, tr.y) === sala);
    for (const tr of vistas) tr.descubierta = true;
    if (vistas.length) avisar(estado, m.nombre + ', minero de oficio, ve ' + (vistas.length === 1 ? 'una trampa' : vistas.length + ' trampas') + ' en la sala.', 'bueno');
  }
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

// El mercader tranquilo y los aliados no cuentan como «monstruos a la vista».
export const monstruosALaVista = (estado, h) =>
  estado.monstruos.filter((m) => m.vivo && m.visto && !m.neutral && !m.aliado && T.lineaVision(estado, h.x, h.y, m.x, m.y));

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
    if (d.muro && d.muro !== datos.muro) return;
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
    case 'rondasExtra': if (estado.mision.objetivo?.tipo === 'escapar') estado.mision.objetivo.rondas += a.n; break;
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
export function danarHeroe(estado, h, n, sinCadena = false) {
  if (n <= 0 || !h.vivo) return;
  // Cadena de Hermanos: el golpe se reparte entre los dos.
  const otro = !sinCadena && companeroCadena(estado, h);
  if (otro && n >= 2) {
    const mitad = Math.floor(n / 2);
    n -= mitad;
    avisar(estado, 'La cadena reparte el golpe: ' + otro.nombre + ' se lleva ' + mitad + '.', '');
    danarHeroe(estado, otro, mitad, true);
  }
  if (h.efectos.piel) { delete h.efectos.piel; }
  h.cuerpo -= n;
  if (h.efectos?.trance) cuerpoGolpeado(estado, h, h.cuerpo <= 0 && !(h.objetos?.pocionCurar > 0));
  if (h.cuerpo <= 0) {
    if (h.objetos.pocionCurar > 0) {
      h.objetos.pocionCurar--;
      const cura = d6() * (llevaArmadura(h, 'gloton') ? 2 : 1);
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
  if (m.ilusion && n > 0) { m.vivo = false; ev(estado, { tipo: 'muerte', id: m.id }); avisar(estado, '¡Era una ilusión! Se deshace en el aire.', ''); return; }
  if (m.efectos.dormido) delete m.efectos.dormido;
  if (n <= 0) return;
  m.cuerpo -= n;
  if (m.cuerpo > 0 && m.fases) faseJefe(estado, m);
  if (m.cuerpo <= 0) {
    m.cuerpo = 0; m.vivo = false;
    if (m.tipo === 'corazon') corazonVencido(estado);
    ev(estado, { tipo: 'muerte', id: m.id });
    sumar(cron(estado)?.monstruos, m.tipo);
    if (m.jefe) cron(estado)?.jefes.push(m.nombre);
    const autor = cronH(estado, estado._autor);
    if (autor) { sumar(autor.muertes, m.tipo); if (m.jefe) sumar(autor, 'jefes'); }
    const asesino = estado.heroes[estado._autor];
    if (asesino?.vivo && !m.aliado) {
      if (armaDe(asesino).sed && asesino.cuerpo < asesino.cuerpoMax) { asesino.cuerpo++; log(estado, 'El Hacha sedienta bebe: ' + asesino.nombre + ' recupera 1 de cuerpo.', 'bueno'); }
      if (armaDe(asesino).avaro) { asesino.oro += 15; log(estado, 'La Espada del avaro tintinea: +15 monedas para ' + asesino.nombre + '.', 'tesoro'); }
    }
    if (estado.aleatorio && estado.heroes[estado._autor]) ganarXP(estado, estado.heroes[estado._autor], 1 + m.cuerpoMax + (m.elite ? 3 : 0) + (m.jefe ? 6 : 0));
    if (m.efectos.poseido) liberarPosesion(estado, m, true);
    // Lo que llevaba (el mercader, un fantasma) pasa a quien lo mató.
    const ganador = estado.heroes[estado._autor];
    if (ganador && (m.mercancia?.length || m.equipo?.length)) {
      const cosas = [...(m.mercancia || []), ...(m.equipo || [])];
      for (const it of cosas) entregarItem(estado, ganador, it);
      avisar(estado, ganador.nombre + ' se queda con lo que llevaba ' + m.nombre + ': ' + cosas.map((it) => nombreMercancia(it)).join(', ') + '.', 'tesoro');
      m.mercancia = []; m.equipo = [];
      if (m.tipo === 'fantasma') estado.fantasmaVencido = true;
    }
    // Nigromantes cerca: recogen fragmentos de alma.
    if (!m.aliado) for (const n of Object.values(estado.heroes)) {
      if (!n.vivo || n.fuera || !subclaseDe(n)?.almas) continue;
      const cerca = (T.region(n.x, n.y) !== '.' && T.region(n.x, n.y) === m.region) || T.lineaVision(estado, n.x, n.y, m.x, m.y);
      if (!cerca) continue;
      const antes = n.fragmentos || 0;
      n.fragmentos = Math.min(6, antes + (m.jefe || m.elite ? 2 : 1));
      if (n.fragmentos > antes) log(estado, n.nombre + ' recoge un fragmento de alma (' + n.fragmentos + '/6).', 'magia');
    }
    log(estado, m.nombre + ' muere.', 'bueno');
    disparar(estado, 'monstruo_muerto', { id: m.id });
  }
}

// Ataque de héroe a monstruo (arma o hechizo de ataque).
function golpearMonstruo(estado, h, m, dados, etiqueta, conArma = false) {
  if (m.neutral) enfadarMercader(estado, m, h.nombre + ' ataca al mercader.');
  if (estado.monstruos.some((o) => o.tipo === 'ojo' && o.vivo && o.efectos.poseido && T.lineaVision(estado, o.x, o.y, h.x, h.y))) dados += 1;
  const ataque = tirarCombate(dados);
  const dormido = !!m.efectos.dormido;
  const arma = conArma ? armaDe(h) : {};
  const defensa = tirarCombate(dormido ? 0 : Math.max(0, m.defensa - (arma.perfora || 0)));
  let dano = Math.max(0, cuenta(ataque, 'calavera') - cuenta(defensa, 'escudoNegro'));
  if (m.ilusion && dano === 0 && cuenta(ataque, 'calavera')) dano = 1;
  if (h.efectos?.sombras) {
    // Combo: si un Guardián enano tiene al monstruo entretenido (pegado a él), el golpe desde las sombras es triple.
    const tanque = Object.values(estado.heroes).some((o) => o.vivo && o.subclase === 'guardian' && T.puedeTocar(estado, o, m));
    dano *= tanque ? 3 : 2; delete h.efectos.sombras; etiqueta = (etiqueta || '') + (tanque ? ' · ¡combo con el Guardián! (×3)' : ' · desde las sombras (×2)');
  }
  ev(estado, { tipo: 'dados', atacante: h.id, defensor: m.id, ataque, defensa, dano, defiende: 'monstruo', etiqueta });
  log(estado, h.nombre + (etiqueta ? ' (' + etiqueta + ')' : '') + ' → ' + m.nombre + ': ' + dano + ' de daño.', dano ? 'golpe' : '');
  sumar(cronH(estado, h.id), 'danoHecho', Math.min(dano, m.cuerpo));
  danarMonstruo(estado, m, dano);
  if (arma.empuja && m.vivo && dano > 0) empujar(estado, h, m);
  if (arma.ruido && d6() === 1) { avisar(estado, 'El trueno del martillo retumba por los pasillos… algo viene.', 'peligro'); aparecerErrante(estado, h); }
}
// Martillo del trueno: el monstruo sale despedido una casilla, si hay sitio detrás.
function empujar(estado, h, m) {
  const dx = Math.sign(m.x - h.x), dy = Math.sign(m.y - h.y);
  const x = m.x + dx, y = m.y + dy;
  if ((dx && dy) || !T.dentro(x, y) || T.figuraEn(estado, x, y) || T.muebleEn(estado, x, y) || T.esRoca(estado, x, y) || !T.puedeTocar(estado, m, { x, y })) return;
  ev(estado, { tipo: 'mover', id: m.id, ruta: [[m.x, m.y], [x, y]] });
  m.x = x; m.y = y; m.region = T.region(x, y);
  log(estado, m.nombre + ' sale despedido hacia atrás.');
}
// Arco de hueso: la flecha sigue en línea recta hasta el siguiente enemigo.
function siguienteEnLinea(estado, h, m) {
  const dx = m.x - h.x, dy = m.y - h.y;
  if (dx && dy) return null;
  const sx = Math.sign(dx), sy = Math.sign(dy);
  for (let x = m.x + sx, y = m.y + sy; T.dentro(x, y); x += sx, y += sy) {
    if (!T.lineaVision(estado, m.x, m.y, x, y, true)) return null;
    const o = estado.monstruos.find((k) => k.vivo && k.visto && !k.aliado && !k.neutral && k.x === x && k.y === y);
    if (o) return o;
  }
  return null;
}

// Ataque de monstruo a héroe.
export function golpearHeroe(estado, m, h, dados, etiqueta) {
  if (m.efectos?.tambor) { dados += 1; delete m.efectos.tambor; }
  if (estado.monstruos.some((o) => o.tipo === 'ojo' && o.vivo && !o.aliado && !o.efectos.poseido && o !== m && T.lineaVision(estado, o.x, o.y, m.x, m.y))) dados += 1;
  const ataque = tirarCombate(dados);
  const extra = (h.efectos.piel ? 2 : 0) + (h.efectos.calderoDef || 0) - (h.efectos.sordo ? 1 : 0) + (h.efectos.bendicion ? 1 : 0) - (h.efectos.agotado ? 1 : 0);
  delete h.efectos.calderoDef; delete h.efectos.sordo;
  const base = h.efectos?.trance ? Math.floor(defensaHeroe(h) / 2) : defensaHeroe(h);
  const defensa = tirarCombate(h.efectos?.furia ? 0 : Math.max(0, base + extra));
  let dano = Math.max(0, cuenta(ataque, 'calavera') - cuenta(defensa, 'escudo'));
  if (dano && h.efectos?.escudoPiedra) { delete h.efectos.escudoPiedra; avisar(estado, 'El escudo de piedra para el golpe y se hace pedazos.', 'bueno'); dano = 0; }
  if (dano && m.tipo === 'bruja' && estado.heroes[h.id] && !h.efectos.veneno) { h.efectos.veneno = true; avisar(estado, h.nombre + ' está envenenado: perderá 1 de cuerpo cada turno hasta curarse.', 'peligro'); }
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
  if (!t || t.heroe !== h.id || !t.movTirada || t.movRestante <= 0 || t.plantado) return {};
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
    if (!dentroCadena(estado, h, c.x, c.y)) continue;
    out[k] = c.d;
  }
  return { mapa, out };
}

function abrirPuerta(estado, h, p) {
  p.abierta = true;
  sumar(cron(estado), 'puertas');
  sumar(cronH(estado, h.id), 'puertas');
  ev(estado, { tipo: 'puerta', puerta: p.id });
  log(estado, h.nombre + ' abre una puerta.');
  disparar(estado, 'puerta_abierta', { puerta: p.id });
  revelar(estado);
}

// Puertas cerradas pegadas al héroe (abrirlas no gasta movimiento ni acción).
function puertasAlLado(estado, h) {
  const out = [];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = [h.x + dx, h.y + dy];
    const p = T.puertaEntre(estado, [h.x, h.y], n);
    if (p && !p.abierta && (!p.secreta || p.descubierta)) out.push({ id: p.id, bloqueada: !!p.bloqueada });
  }
  return out;
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
      abrirPuerta(estado, h, p);
      const f2 = T.figuraEn(estado, n[0], n[1]);
      if (f2 && !T.esAliado(estado, f2)) { avisar(estado, 'Hay alguien al otro lado de la puerta.', 'peligro'); break; }
    }
    if (!dentroCadena(estado, h, n[0], n[1])) {
      volcar();
      const otro = companeroCadena(estado, h);
      otro.efectos.tiron = true;
      t.movRestante = 0;
      avisar(estado, '¡La cadena da un tirón! ' + h.nombre + ' se frena en seco y ' + otro.nombre + ' no podrá moverse en su turno.', 'peligro');
      break;
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
    if (!m.vivo || !m.visto || m.aliado) return false;
    if (arma.distancia) return !T.adyacentes(h, m) && T.lineaVision(estado, h.x, h.y, m.x, m.y, true);
    if (T.puedeTocar(estado, h, m)) return true;
    if (arma.alcance === 2 && ((h.x === m.x && Math.abs(h.y - m.y) === 2) || (h.y === m.y && Math.abs(h.x - m.x) === 2))) {
      const mx = (h.x + m.x) / 2, my = (h.y + m.y) / 2;
      if (!T.figuraEn(estado, mx, my) && T.lineaVision(estado, h.x, h.y, m.x, m.y, true)) return true;
    }
    return arma.diagonal && T.diagonales(h, m) && T.diagonalLibre(estado, h, m);
  }).map((m) => m.id);
}

export function objetivosHechizo(estado, h, id) {
  const hz = D.HECHIZOS[id];
  if (hz.objetivo === 'monstruo') {
    return estado.monstruos.filter((m) => m.vivo && m.visto && !m.aliado && T.lineaVision(estado, h.x, h.y, m.x, m.y, true)).map((m) => m.id);
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
  if (h.efectos.trance || h.alma) {
    // El alma está en otro cuerpo: solo se controla al poseído.
    Object.assign(r, { puedeTirar: false, destinos: {}, atacables: [], hechizos: [], buscarTesoro: false, buscarTrampas: false,
      desarmables: [], pociones: [], salir: false, puertas: [], calderos: [], reliquias: [], habilidades: [], trance: true,
      motivoBusqueda: 'Tu alma está en otro cuerpo.' });
    if (t.poseido) r.poseido = poseidoDe(estado, t);
    return r;
  }
  r.puedeTirar = !t.movTirada && !t.plantado;
  r.destinos = destinos(estado, h).out;
  const libre = !t.accion;
  const sala = T.region(h.x, h.y);
  const aLaVista = monstruosALaVista(estado, h).length > 0;
  // Armas pesadas: plantarla y disparar ocupa todo el turno, así que no se combina con moverse.
  const pesada = !!D.ARMAS[h.arma]?.pesada;
  r.atacables = libre && !(pesada && t.movido) ? objetivosAtaque(estado, h) : [];
  // Al mercader tranquilo no se le ataca por accidente: solo desde su menú.
  const esNeutral = (mid) => estado.monstruos.find((x) => x.id === mid)?.neutral;
  r.atacablesNeutros = r.atacables.filter(esNeutral);
  r.atacables = r.atacables.filter((mid) => !esNeutral(mid));
  if (libre && pesada && t.movido) r.motivoAtaque = 'Con la ' + D.ARMAS[h.arma].nombre.toLowerCase() + ' no puedes atacar después de moverte.';
  r.hechizos = libre ? h.hechizos.map((hz) => ({ id: hz, objetivos: objetivosHechizo(estado, h, hz).filter((o) => !esNeutral(o)) })).filter((x) => x.objetivos.length) : [];
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
  r.puertas = puertasAlLado(estado, h);
  if (estado.reliquias?.jerico && D.HEROES[h.tipo].sinArmadura && !(estado.reliquiasUsadas || {}).jerico) {
    const apoyos = libre ? apoyosTrompa(estado, h) : [];
    r.trompa = { apoyos, motivo: !libre ? 'Ya has hecho tu acción este turno.' : !apoyos.length ? 'Necesitas a alguien pegado delante de ti (no en diagonal) que la sujete: sola se te caería.' : '' };
  }
  r.reliquias = reliquiasDe(estado, h, t, libre);
  // Altar con dios pegado, y mercader neutral pegado.
  const altar = estado.muebles.find((u) => u.dios && !u.usado && h.x >= u.x - 1 && h.x <= u.x + u.w && h.y >= u.y - 1 && h.y <= u.y + u.h && T.region(u.x, u.y) === T.region(h.x, h.y));
  if (altar && libre) r.altar = { dios: altar.dios, idx: estado.muebles.indexOf(altar) };
  const merc = estado.monstruos.find((m) => m.vivo && m.neutral && T.puedeTocar(estado, h, m));
  if (merc) r.mercader = { id: merc.id, items: merc.mercancia || [], puedeAtacar: r.atacablesNeutros.includes(merc.id) };
  r.habilidades = habilidadesDe(estado, h, t, libre);
  const scH = subclaseDe(h);
  if (scH?.sinArmas) { r.atacables = []; r.motivoAtaque = 'El sacerdote no ataca con armas.'; }
  if (h.efectos.oso) { r.hechizos = []; r.pociones = []; }
  if (t.poseido) r.poseido = poseidoDe(estado, t);
  if (t.tiron) r.motivoTiron = 'La cadena te dio un tirón: este turno no puedes moverte.';
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
  if (malditaPuesta(h) && arma) return D.ARMAS[h.arma].nombre + ' está maldita: no te la puedes quitar hasta purificarla.';
  if (arma) {
    if (h.arma === item) return 'Ya la llevas.';
    if (tipoH.sinArmadura && !D.MAGO_ARMAS.includes(item)) return 'Solo puede usar daga o bastón.';
    if (arma.dosManos && h.armaduras.includes('escudo')) return 'Va a dos manos: guarda antes el escudo.';
  } else if (arm) {
    if (tipoH.sinArmadura && !arm.ligera) return 'La armadura estorba al lanzar hechizos.';
    if (h.armaduras.includes(item)) return 'Ya la llevas puesta.';
    if (item === 'escudo' && D.ARMAS[h.arma].dosManos) return 'Tu arma va a dos manos.';
  } else if (!D.POCIONES[item]) return 'No existe.';
  else if (glotonLleno(h)) return 'Con el Amuleto del glotón solo llevas ' + POCIONES_GLOTON + ' pociones encima.';
  return null;
}

// Equipa un objeto; lo que se quita va a la bolsa indicada.
function ponerEquipo(h, item, bolsa) {
  if (D.ARMAS[item]) {
    // Lo que el arma quita o da de cuerpo máximo cambia con ella.
    const antes = D.ARMAS[h.arma].cuerpoMax || 0, despues = D.ARMAS[item].cuerpoMax || 0;
    if (antes !== despues) { h.cuerpoMax = Math.max(1, h.cuerpoMax - antes + despues); h.cuerpo = Math.max(1, Math.min(h.cuerpo - antes + despues, h.cuerpoMax)); }
    meter(bolsa, h.arma); h.arma = item; delete h.purificada;
  }
  else if (D.ARMADURAS[item]) {
    const choca = item === 'placas' ? 'cota' : item === 'cota' ? 'placas' : null;
    if (choca && h.armaduras.includes(choca)) { h.armaduras = h.armaduras.filter((x) => x !== choca); meter(bolsa, choca); }
    h.armaduras.push(item);
    // Al ponerse el Amuleto del glotón, las pociones de más van a la bolsa.
    if (D.ARMADURAS[item].gloton) for (const k of Object.keys(h.objetos)) while (D.POCIONES[k] && h.objetos[k] > 0 && pocionesEncima(h) > POCIONES_GLOTON) { h.objetos[k]--; meter(bolsa, k); }
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

// =============================================================
//  TROMPA DE JERICÓ
//  El mago la sopla apoyada en un aliado pegado a él; suena en la
//  dirección del aliado hasta la primera pared.
// =============================================================
// =============================================================
//  MAZMORRA INFINITA: experiencia, mejoras y habilidades
// =============================================================
export function ganarXP(estado, h, n) {
  h.nivel ||= 1; h.xp ||= 0; h.puntos ||= 0;
  h.xp += n;
  while (h.xp >= D.xpParaNivel(h.nivel + 1)) {
    h.nivel++; h.puntos++;
    const hab = h.nivel === D.NIVEL_HABILIDAD ? ' ¡Ya puede elegir especialización!' : '';
    ev(estado, { tipo: 'nivel', heroe: h.id, nivel: h.nivel });
    avisar(estado, '¡' + h.nombre + ' sube a nivel ' + h.nivel + '! Elige una mejora en el campamento.' + hab, 'bueno');
  }
}

function mejorar(estado, h, mejora) {
  const def = D.MEJORAS[mejora];
  if (!def) return 'Esa mejora no existe.';
  if (!(h.puntos > 0)) return 'No tienes puntos de mejora.';
  h.mejoras ||= {};
  if ((h.mejoras[mejora] || 0) >= def.max) return 'Ya tienes esa mejora al máximo.';
  h.mejoras[mejora] = (h.mejoras[mejora] || 0) + 1;
  h.puntos--;
  if (mejora === 'cuerpo') { h.cuerpoMax++; h.cuerpo = h.cuerpoMax; }
  if (mejora === 'mente') h.mente++;
  log(estado, h.nombre + ' mejora: ' + def.nombre + '.', 'bueno');
  return null;
}

// Muros frágiles entre una sala y el pasillo (para la trompa y el enano).
function ponerMurosFragiles(def) {
  const salas = [...new Set((def.puertas || []).flatMap((p) => [T.region(...p.a), T.region(...p.b)]))].filter((s) => s !== '.');
  const conPuerta = new Set((def.puertas || []).map((p) => T.claveBorde(p.a, p.b)));
  const rocas = new Set((def.rocas || []).map(([x, y]) => clave(x, y)));
  const cands = [];
  for (const s of salas) for (const [x, y] of T.casillasDe(s)) for (const [dx, dy] of T.DIRS) {
    const n = [x + dx, y + dy];
    if (!T.dentro(...n) || T.region(...n) !== '.' || rocas.has(clave(...n))) continue;
    if (!conPuerta.has(T.claveBorde([x, y], n))) cands.push({ a: [x, y], b: n });
  }
  def.muros = [];
  const n = Math.min(cands.length, 1 + (def.numero >= 3 ? 1 : 0) + rnd(2));
  for (let i = 0; i < n; i++) def.muros.push({ id: 'mf' + (i + 1), ...cands.splice(rnd(cands.length), 1)[0] });
}

// ---------- Subclases y sus habilidades ----------
export const subclaseDe = (h) => (h.subclase ? D.SUBCLASES[h.tipo]?.[h.subclase] : null);
export const modSub = (h, k) => subclaseDe(h)?.mods?.[k] || 0;
const listaHabilidades = (sc) => (sc ? [sc.hab, ...(sc.extra || [])] : []);

function elegirSubclase(estado, h, id) {
  const sc = D.SUBCLASES[h.tipo]?.[id];
  if (!sc) return 'Esa especialización no existe.';
  if (h.subclase) return 'Ya tiene especialización.';
  if ((h.nivel || 1) < D.NIVEL_HABILIDAD) return 'Se elige al llegar al nivel ' + D.NIVEL_HABILIDAD + '.';
  h.subclase = id;
  const bolsa = inventarioDe(h);
  if (sc.arma && D.ARMAS[sc.arma] && h.arma !== sc.arma) { meter(bolsa, h.arma); h.arma = sc.arma; }
  if (sc.sinEscudo && h.armaduras.includes('escudo')) { h.armaduras = h.armaduras.filter((a) => a !== 'escudo'); meter(bolsa, 'escudo'); }
  if (sc.sinArmadura) { for (const a of h.armaduras) meter(bolsa, a); h.armaduras = []; }
  if (sc.luz) h.hechizos = D.HECHIZOS_LUZ.slice();
  log(estado, h.nombre + ' se especializa: ' + sc.nombre + '.', 'bueno');
  return null;
}

// Habilidades del héroe en este momento, con sus objetivos posibles.
function habilidadesDe(estado, h, t, libre) {
  if (!estado.aleatorio && !estado.pruebas) return [];
  const sc = subclaseDe(h);
  const out = [];
  const visibles = estado.monstruos.filter((m) => m.vivo && m.visto && !m.aliado && T.lineaVision(estado, h.x, h.y, m.x, m.y));
  for (const hab of listaHabilidades(sc)) {
    const r = { id: hab.id, nombre: hab.nombre, icono: hab.icono, objetivo: hab.objetivo, ok: false, motivo: '', objetivos: [] };
    out.push(r);
    if (!hab.sinLimite && (estado.habUsada || {})[h.id + ':' + hab.id]) { r.motivo = 'Ya la has usado en este piso.'; continue; }
    if (!hab.sinAccion && !libre) { r.motivo = 'Ya has hecho tu acción este turno.'; continue; }
    if (hab.coste && (h.fragmentos || 0) < hab.coste) { r.motivo = 'Necesitas ' + hab.coste + ' fragmentos de alma (tienes ' + (h.fragmentos || 0) + ').'; continue; }
    switch (hab.id) {
      case 'furiaEnana': case 'dobleTajo': r.objetivos = objetivosAtaque(estado, h); break;
      case 'disparoDoble': r.objetivos = visibles.filter((m) => !T.adyacentes(h, m) && T.lineaVision(estado, h.x, h.y, m.x, m.y, true)).map((m) => m.id); break;
      case 'flechaLuna':
        if (t.movido) { r.motivo = 'Si te has movido no puedes tensar la Flecha de luna.'; continue; }
        r.objetivos = visibles.filter((m) => (m.x === h.x || m.y === h.y) && T.lineaVision(estado, h.x, h.y, m.x, m.y)).map((m) => m.id); break;
      case 'posesion': r.objetivos = visibles.filter((m) => !m.jefe && !m.efectos.poseido).map((m) => m.id); break;
      case 'escudoPiedra': r.objetivos = Object.values(estado.heroes).filter((o) => o.vivo && !o.fuera && (o === h || T.puedeTocar(estado, h, o))).map((o) => o.id); break;
      case 'rompepiedras':
        for (const [dx, dy] of T.DIRS) {
          const n = [h.x + dx, h.y + dy];
          if (T.esRoca(estado, ...n)) r.objetivos.push('roca:' + clave(...n));
          const mu = T.muroEntre(estado, [h.x, h.y], n);
          if (mu && !mu.roto) r.objetivos.push('muro:' + mu.id);
        }
        break;
      case 'alzar': {
        const sala = T.region(h.x, h.y);
        r.objetivos = estado.monstruos.filter((m) => !m.vivo && !m.alzado && !m.jefe && !m.aliado && (sala !== '.' ? m.region === sala : T.lineaVision(estado, h.x, h.y, m.x, m.y))).map((m) => m.id);
        break;
      }
      case 'tumba': r.objetivos = Object.values(estado.heroes).filter((o) => !o.vivo && !o.alma && !o.fuera).map((o) => o.id); break;
      case 'oso': if (h.efectos.oso) { r.motivo = 'Ya eres un oso.'; continue; } r.objetivos = ['yo']; break;
      default: r.objetivos = ['yo'];
    }
    r.ok = r.objetivos.length > 0;
    if (!r.ok && !r.motivo) r.motivo = { furiaEnana: 'No hay nadie a tu alcance.', dobleTajo: 'No hay nadie a tu alcance.', disparoDoble: 'No ves a ningún enemigo lejos de ti.',
      flechaLuna: 'No hay enemigos en tu fila ni en tu columna.', posesion: 'No ves a ningún enemigo que puedas poseer.', escudoPiedra: 'No hay nadie pegado a ti.',
      rompepiedras: 'No hay derrumbes ni muros frágiles pegados a ti.', alzar: 'No hay ningún enemigo muerto en tu sala.', tumba: 'No ha caído nadie.' }[hab.id] || '';
  }
  return out;
}

function usarHabilidad(estado, h, id, objetivo) {
  const hab = listaHabilidades(subclaseDe(h)).find((x) => x.id === id);
  if (!hab.sinLimite) (estado.habUsada ||= {})[h.id + ':' + id] = 1;
  if (hab.coste) h.fragmentos -= hab.coste;
  const m = estado.monstruos.find((x) => x.id === objetivo);
  const atacarDos = (etiqueta) => {
    // Combo: con el grito de guerra del Campeón, los dos golpes van con +1.
    const grito = h.efectos.grito ? 1 : 0;
    if (grito) { delete h.efectos.grito; avisar(estado, '¡Combo! El grito de guerra empuja los dos golpes.', 'bueno'); }
    golpearMonstruo(estado, h, m, ataqueHeroe(h) + grito, etiqueta);
    const otro = m.vivo ? m : estado.monstruos.find((x) => objetivosAtaque(estado, h).includes(x.id));
    if (otro) golpearMonstruo(estado, h, otro, ataqueHeroe(h) + grito, etiqueta + ' (segundo golpe)');
  };
  switch (id) {
    case 'furiaEnana': avisar(estado, '¡' + h.nombre + ' entra en Furia enana!', 'peligro'); atacarDos('Furia enana'); break;
    case 'dobleTajo':
      avisar(estado, '¡' + h.nombre + ' desenvaina las dos espadas!', 'peligro'); atacarDos('Doble tajo');
      h.efectos.agotado = 2; // dura hasta el final de su próximo turno
      break;
    case 'disparoDoble': {
      golpearMonstruo(estado, h, m, 3 + (h.mejoras?.ataque || 0), 'Disparo doble');
      const otros = estado.monstruos.filter((x) => x.vivo && x.visto && !x.aliado && !T.adyacentes(h, x) && T.lineaVision(estado, h.x, h.y, x.x, x.y, true));
      const segundo = m.vivo ? m : otros[0];
      if (segundo) golpearMonstruo(estado, h, segundo, 3 + (h.mejoras?.ataque || 0), 'Disparo doble (segunda flecha)');
      break;
    }
    case 'flechaLuna': {
      const dx = Math.sign(m.x - h.x), dy = Math.sign(m.y - h.y);
      let c = [h.x, h.y];
      const tocados = [];
      for (let i = 0; i < 30; i++) {
        const n = [c[0] + dx, c[1] + dy];
        if (!T.dentro(...n) || T.borde(estado, c, n) !== 'libre' || T.esRoca(estado, ...n)) break;
        const o = estado.monstruos.find((x) => x.vivo && !x.aliado && x.x === n[0] && x.y === n[1]);
        if (o) tocados.push(o);
        c = n;
      }
      avisar(estado, 'La Flecha de luna cruza la sala dejando un rastro de plata.', 'bueno');
      for (const o of tocados) golpearMonstruo(estado, h, o, 3 + (h.mejoras?.ataque || 0), 'Flecha de luna');
      break;
    }
    case 'escudoPiedra': {
      const o = estado.heroes[objetivo];
      o.efectos.escudoPiedra = true;
      avisar(estado, h.nombre + ' levanta un escudo de piedra delante de ' + o.nombre + ': el próximo golpe no le hará daño.', 'bueno');
      break;
    }
    case 'rompepiedras': {
      const [tipo, ref] = objetivo.split(':');
      if (tipo === 'roca') delete estado.rocas[ref];
      else { const w = estado.muros.find((x) => x.id === ref); T.muroEntre(estado, w.a, w.b).roto = true; }
      ev(estado, { tipo: 'temblor' });
      avisar(estado, h.nombre + ' descarga el martillo: ¡' + (tipo === 'roca' ? 'el derrumbe salta en pedazos' : 'el muro se viene abajo') + '!', 'bueno');
      revelar(estado);
      if (tipo === 'muro') disparar(estado, 'muro_roto', { muro: ref });
      break;
    }
    case 'grito':
      for (const o of Object.values(estado.heroes)) if (o.vivo && !o.fuera) o.efectos.grito = 1;
      h.efectos.provoca = true;
      ev(estado, { tipo: 'reliquia', reliquia: 'grito', heroe: h.id, texto: '¡' + h.nombre + ' lanza un grito de guerra! Todo el grupo tira +1 dado en su próximo ataque… y los monstruos solo tienen ojos para él.' });
      break;
    case 'sombras':
      h.efectos.sombras = 2;
      ev(estado, { tipo: 'reliquia', reliquia: 'sombras', heroe: h.id, texto: h.nombre + ' se funde con las sombras y desaparece de la vista.' });
      break;
    case 'oso':
      h.efectos.oso = 3; h.cuerpoMax += 3; h.cuerpo += 3;
      ev(estado, { tipo: 'reliquia', reliquia: 'oso', heroe: h.id, texto: '¡' + h.nombre + ' se transforma en un oso enorme!' });
      break;
    case 'santuario':
      estado.santuario = { heroe: h.id, region: T.region(h.x, h.y), x: h.x, y: h.y };
      ev(estado, { tipo: 'reliquia', reliquia: 'santuario', heroe: h.id, texto: h.nombre + ' consagra el lugar: hasta su próximo turno, ningún monstruo puede atacar aquí.' });
      break;
    case 'cosecha':
      h.cuerpo = Math.min(h.cuerpoMax, h.cuerpo + 1);
      avisar(estado, h.nombre + ' consume un fragmento de alma (+1 de cuerpo).', 'bueno');
      break;
    case 'alzar': {
      m.alzado = true;
      const s = aparecer(estado, { tipo: 'esqueleto', x: m.x, y: m.y, ia: 'agresivo', nombre: 'Esqueleto alzado' }, false);
      if (!s) { avisar(estado, 'No hay sitio para alzar a ese muerto.', 'peligro'); h.fragmentos += hab.coste; return null; }
      s.visto = true; s.aliado = { de: h.id, turnos: 3 }; s.cuerpo = s.cuerpoMax = 2; delete s.elite;
      ev(estado, { tipo: 'aparece', id: s.id });
      avisar(estado, h.nombre + ' susurra un nombre olvidado: ¡' + m.nombre + ' se levanta como esqueleto a vuestro servicio!', 'bueno');
      break;
    }
    case 'tumba': {
      const o = estado.heroes[objetivo];
      const sitio = T.DIRS8.map(([dx, dy]) => [h.x + dx, h.y + dy]).find(([x, y]) => T.dentro(x, y) && !T.esRoca(estado, x, y) && !T.muebleEn(estado, x, y) && !T.figuraEn(estado, x, y) && T.region(x, y) === T.region(h.x, h.y));
      if (!sitio) { avisar(estado, 'No hay sitio junto al nigromante.', 'peligro'); h.fragmentos += hab.coste; delete estado.habUsada[h.id + ':tumba']; return null; }
      o.vivo = true; o.x = sitio[0]; o.y = sitio[1];
      o.calizPerdido = (o.calizPerdido || 0) + 1; o.cuerpoMax = Math.max(1, o.cuerpoMax - 1);
      o.cuerpo = Math.max(1, Math.ceil(o.cuerpoMax / 2));
      ev(estado, { tipo: 'aparece', id: o.id });
      avisar(estado, '¡' + h.nombre + ' arranca a ' + o.nombre + ' de la tumba! Vuelve con ' + o.cuerpo + ' de cuerpo… y el ritual retumba por la mazmorra.', 'bueno');
      aparecerErrante(estado, h);
      break;
    }
    case 'posesion': {
      if ((m.mente || 0) >= 3) {
        const a = d6() + menteHeroe(h), b = d6() + m.mente;
        ev(estado, { tipo: 'duelo', heroe: h.id, monstruo: m.id, a, b });
        if (a <= b) {
          h.efectos.dominado = m.id;
          avisar(estado, 'Duelo de mentes: ' + h.nombre + ' ' + a + ' contra ' + m.nombre + ' ' + b + '. ¡' + m.nombre + ' le da la vuelta! En su próximo turno, ' + h.nombre + ' estará bajo su control.', 'peligro');
          return null;
        }
        avisar(estado, 'Duelo de mentes: ' + h.nombre + ' ' + a + ' contra ' + m.nombre + ' ' + b + '. ¡Gana el mago!', 'bueno');
      }
      h.efectos.trance = m.id;
      m.efectos.poseido = { por: h.id, rondas: 2 };
      delete m.efectos.dormido;
      estado.turno.poseido = { id: m.id, restante: m.tipo === 'golem' ? Math.floor(m.mov / 2) : m.mov, ataco: false };
      // Los lobos del Señor de las bestias siguen a su amo… ahora del grupo.
      for (const l of estado.monstruos) if (l.vivo && l.amo === m.id) { l.aliado = { de: h.id, turnos: 2, temporal: true }; }
      ev(estado, { tipo: 'reliquia', reliquia: 'posesion', heroe: h.id, texto: h.nombre + ' clava la mirada en ' + m.nombre + ' y toma su cuerpo. Durante sus dos próximos turnos, ese ' + m.nombre.toLowerCase() + ' es suyo.' });
      break;
    }
  }
  return null;
}

// --- Posesión: el mago mueve al monstruo y le hace atacar a los suyos ---
function alcancePoseido(estado, m, pasos) {
  return T.explorar([m.x, m.y], pasos, (c, n) => {
    const [x, y] = n;
    if (T.esRoca(estado, x, y) || T.muebleEn(estado, x, y)) return false;
    if (T.borde(estado, c, n) !== 'libre') return false;
    return !T.figuraEn(estado, x, y);
  });
}
function poseidoDe(estado, t) {
  const m = estado.monstruos.find((x) => x.id === t.poseido.id && x.vivo && x.efectos.poseido);
  if (!m) { delete t.poseido; return undefined; }
  const destinos = {};
  if (t.poseido.restante > 0) for (const [k, c] of Object.entries(alcancePoseido(estado, m, t.poseido.restante))) if (c.d > 0) destinos[k] = c.d;
  const rayo = m.hechizos?.includes('rayo');
  const atacables = t.poseido.ataco ? [] : estado.monstruos.filter((o) => o !== m && o.vivo && o.visto && (T.puedeTocar(estado, m, o) || (rayo && T.lineaVision(estado, m.x, m.y, o.x, o.y, true)))).map((o) => o.id);
  const poder = t.poseido.poder ? null : poderPoseido(estado, estado.heroes[m.efectos.poseido.por], m);
  return { id: m.id, restante: t.poseido.restante, destinos, atacables, poder: poder && poder.objetivos.length ? poder : null };
}
function moverPoseido(estado, t, x, y) {
  const m = estado.monstruos.find((o) => o.id === t.poseido.id);
  const mapa = alcancePoseido(estado, m, t.poseido.restante);
  const k = clave(x, y);
  if (!mapa[k] || mapa[k].d === 0) return 'No puede llegar ahí.';
  const ruta = T.reconstruir(mapa, k);
  t.poseido.restante -= mapa[k].d;
  m.x = x; m.y = y; m.region = T.region(x, y);
  ev(estado, { tipo: 'mover', id: m.id, ruta });
  return null;
}
function atacarPoseido(estado, h, t, objetivo) {
  const m = estado.monstruos.find((o) => o.id === t.poseido.id);
  const o = estado.monstruos.find((x) => x.id === objetivo);
  t.poseido.ataco = true;
  const conRayo = !T.puedeTocar(estado, m, o) && m.hechizos?.includes('rayo');
  if (conRayo) m.hechizos.splice(m.hechizos.indexOf('rayo'), 1);
  const ataque = tirarCombate(conRayo ? 3 : m.ataque);
  const defensa = tirarCombate(o.efectos.dormido ? 0 : o.defensa);
  const dano = Math.max(0, cuenta(ataque, 'calavera') - cuenta(defensa, 'escudoNegro'));
  ev(estado, { tipo: 'dados', atacante: m.id, defensor: o.id, ataque, defensa, dano, defiende: 'monstruo', etiqueta: (conRayo ? 'Rayo sombrío · ' : '') + 'Poseído por ' + h.nombre });
  log(estado, m.nombre + ' (poseído) → ' + o.nombre + ': ' + dano + ' de daño.', dano ? 'golpe' : '');
  danarMonstruo(estado, o, dano);
  return null;
}
function liberarPosesion(estado, m, muerto = false) {
  const p = m.efectos.poseido;
  delete m.efectos.poseido;
  for (const l of estado.monstruos) if (l.amo === m.id && l.aliado?.temporal) delete l.aliado;
  const mago = p && estado.heroes[p.por];
  if (mago) {
    delete mago.efectos.trance;
    if (mago.alma === m.id) {
      delete mago.alma;
      avisar(estado, 'Con ' + m.nombre + ' muere también el alma de ' + mago.nombre + '.', 'peligro');
      ev(estado, { tipo: 'muerte', id: mago.id });
    } else if (!muerto) avisar(estado, 'El alma de ' + mago.nombre + ' vuelve a su cuerpo.', '');
    else avisar(estado, m.nombre + ' cae y el alma de ' + mago.nombre + ' vuelve a su cuerpo.', '');
  }
  if (estado.turno?.poseido?.id === m.id) delete estado.turno.poseido;
  if (!muerto) avisar(estado, m.nombre + ' recupera el control de su cuerpo.', 'peligro');
}

// Golpe al cuerpo vacío del mago: el alma vuelve de golpe… o se queda atrapada.
function cuerpoGolpeado(estado, h, muere) {
  const m = estado.monstruos.find((x) => x.id === h.efectos.trance);
  if (!m) { delete h.efectos.trance; return; }
  if (!muere) {
    avisar(estado, '¡Golpean el cuerpo de ' + h.nombre + ' y la conexión se rompe!', 'peligro');
    liberarPosesion(estado, m);
    h.efectos.aturdidoAlma = true;
  } else {
    // Muere el cuerpo: el alma se queda dentro del monstruo hasta que este caiga.
    h.alma = m.id;
    m.efectos.poseido.rondas = 999;
    avisar(estado, '¡El cuerpo de ' + h.nombre + ' ha caído! Su alma queda atrapada dentro de ' + m.nombre + '. Si ese monstruo muere, ' + h.nombre + ' se va con él.', 'peligro');
  }
}

// Turno del mago dominado: el monstruo ganó el duelo y le hace atacar a los suyos.
function turnoDominado(estado, h) {
  const amo = estado.monstruos.find((m) => m.id === h.efectos.dominado);
  delete h.efectos.dominado;
  const t = estado.turno;
  t.accion = true; t.plantado = true;
  const victimas = Object.values(estado.heroes).filter((o) => o !== h && o.vivo && !o.fuera && T.puedeTocar(estado, h, o));
  if (!victimas.length) { avisar(estado, h.nombre + ', con la mirada vacía, se tambalea sin nadie a quien atacar. Pierde el turno.', 'peligro'); return; }
  const v = victimas.sort((a, b) => a.cuerpo - b.cuerpo)[0];
  avisar(estado, (amo ? amo.nombre : 'Una voz') + ' controla a ' + h.nombre + ', que se lanza contra ' + v.nombre + '.', 'peligro');
  const ataque = tirarCombate(ataqueHeroe(h));
  const defensa = tirarCombate(defensaHeroe(v));
  const dano = Math.max(0, cuenta(ataque, 'calavera') - cuenta(defensa, 'escudo'));
  ev(estado, { tipo: 'dados', atacante: h.id, defensor: v.id, ataque, defensa, dano, defiende: 'heroe', etiqueta: 'Dominado' });
  danarHeroe(estado, v, dano);
}

// =============================================================
//  RELIQUIAS
// =============================================================
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const enJuego = (h) => h && h.vivo && !h.fuera;

function restaurarCaliz(h) {
  if (h.calizPerdido) { h.cuerpoMax += h.calizPerdido; delete h.calizPerdido; }
}

// --- Cadena de Hermanos ---
function companeroCadena(estado, h) {
  const c = estado.cadena;
  if (!c || !c.includes(h.id)) return null;
  const otro = estado.heroes[c[0] === h.id ? c[1] : c[0]];
  if (!enJuego(otro) || !enJuego(h)) { romperCadena(estado); return null; }
  return otro;
}
function romperCadena(estado) {
  if (!estado.cadena) return;
  for (const id of estado.cadena) delete estado.heroes[id]?.efectos.cadena;
  estado.cadena = null;
}
function dentroCadena(estado, h, x, y) {
  const otro = companeroCadena(estado, h);
  return !otro || Math.max(Math.abs(otro.x - x), Math.abs(otro.y - y)) <= 2;
}

// --- Farol de los Ahogados: ve trampas y puertas secretas a su alrededor ---
function farolIlumina(estado) {
  const h = estado.heroes[estado.farol];
  if (!enJuego(h)) return;
  const sala = T.region(h.x, h.y);
  const celdas = new Set();
  if (sala !== '.') for (const [x, y] of T.casillasDe(sala)) celdas.add(clave(x, y));
  else for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) celdas.add(clave(h.x + dx, h.y + dy));
  let trampas = 0, secretas = 0;
  for (const tr of estado.trampas) if (tr.activa && !tr.descubierta && celdas.has(clave(tr.x, tr.y))) { tr.descubierta = true; trampas++; }
  for (const p of estado.puertas) if (p.secreta && !p.descubierta && (celdas.has(clave(...p.a)) || celdas.has(clave(...p.b)))) { p.descubierta = true; secretas++; }
  if (trampas || secretas) {
    const partes = [];
    if (trampas) partes.push(trampas === 1 ? 'una trampa' : trampas + ' trampas');
    if (secretas) partes.push(secretas === 1 ? 'una puerta secreta' : secretas + ' puertas secretas');
    avisar(estado, 'La luz verdosa del farol revela ' + partes.join(' y ') + '.', 'bueno');
  }
}

// --- Brújula del Desertor: camino hasta el objetivo más cercano ---
function rumboBrujula(estado, h) {
  const pasa = (c, n) => !T.esRoca(estado, n[0], n[1]) && ['libre', 'puerta'].includes(T.borde(estado, c, n));
  const mapa = T.explorar([h.x, h.y], 400, pasa);
  const cands = [];
  for (const id of (estado.mision.tareas || []).map((x) => x.matar).filter(Boolean)) {
    const m = estado.monstruos.find((o) => o.id === id && o.vivo);
    if (m) cands.push({ celdas: [[m.x, m.y]], que: 'vuestro objetivo' });
  }
  for (const [r, f] of Object.entries(estado.mision.tesoros || {})) {
    if (estado.tesoroTomado[r]) continue;
    if (f.flag) cands.push({ celdas: T.casillasDe(r), que: 'algo que buscáis' });
    else if (f.reliquia && !estado.reliquias?.[f.reliquia]) cands.push({ celdas: T.casillasDe(r), que: 'una reliquia' });
  }
  if (!cands.length) cands.push({ celdas: estado.escalera, que: 'la salida' });
  let mejor = null;
  for (const c of cands) for (const [x, y] of c.celdas) {
    const nodo = mapa[clave(x, y)];
    if (nodo && nodo.d > 0 && (!mejor || nodo.d < mejor.d)) mejor = { d: nodo.d, k: clave(x, y), que: c.que, x, y };
  }
  if (!mejor) return null;
  return { ...mejor, ruta: T.reconstruir(mapa, mejor.k) };
}
const RUMBOS = ['este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste', 'norte', 'noreste'];
function nombreRumbo(dx, dy) {
  if (!dx && !dy) return 'aquí mismo';
  const a = Math.atan2(dy, dx);
  return 'el ' + RUMBOS[(Math.round(a / (Math.PI / 4)) + 8) % 8];
}

// Estado de cada reliquia forjada para el héroe en turno.
function reliquiasDe(estado, h, t, libre) {
  const r = estado.reliquias || {};
  const usadas = estado.reliquiasUsadas || {};
  const out = [];
  const add = (id, motivo, extra = {}) => out.push({ id, ok: !motivo, motivo: motivo || '', ...extra });
  const yaUsada = 'Ya la habéis usado en esta misión.';
  const sinAccion = 'Ya has hecho tu acción este turno.';
  if (r.farol) add('farol', usadas.farol ? yaUsada : !libre ? sinAccion : '');
  if (r.cadena) {
    const pegados = Object.values(estado.heroes).filter((o) => o.id !== h.id && enJuego(o) && cheb(o, h) <= 1).map((o) => o.id);
    add('cadena', usadas.cadena ? yaUsada : !libre ? sinAccion : !pegados.length ? 'Necesitas a otro héroe pegado a ti.' : '', { companeros: pegados });
  }
  if (r.escudo) add('escudo', usadas.escudo ? yaUsada : !libre ? sinAccion : '');
  if (r.brujula) add('brujula', t.movido ? 'Solo antes de moverte.' : t.brujula ? 'Ya la has consultado este turno.' : '');
  if (r.caliz) add('caliz', 'Se usa al beber de un caldero.');
  if (r.campana) add('campana', usadas.campana ? yaUsada : !libre ? sinAccion : '');
  return out;
}

function usarReliquia(estado, h, t, a, usarAccion) {
  const usadas = (estado.reliquiasUsadas ||= {});
  switch (a.reliquia) {
    case 'farol': {
      usarAccion(); usadas.farol = 1;
      estado.farol = h.id; h.efectos.farol = true;
      ev(estado, { tipo: 'reliquia', reliquia: 'farol', heroe: h.id, texto: h.nombre + ' enciende el Farol de los Ahogados. Una luz verdosa lo envuelve… y se ve desde lejos.' });
      farolIlumina(estado);
      return null;
    }
    case 'cadena': {
      const otro = estado.heroes[a.companero];
      if (!otro || otro.id === h.id || !enJuego(otro) || cheb(otro, h) > 1) return 'Necesitas a otro héroe pegado a ti.';
      usarAccion(); usadas.cadena = 1;
      estado.cadena = [h.id, otro.id]; h.efectos.cadena = true; otro.efectos.cadena = true;
      ev(estado, { tipo: 'reliquia', reliquia: 'cadena', heroe: h.id, texto: h.nombre + ' y ' + otro.nombre + ' se cierran la Cadena de Hermanos. Os repartiréis los golpes… y no os podréis separar más de 2 casillas.' });
      return null;
    }
    case 'escudo': {
      usarAccion(); usadas.escudo = 1;
      estado.escudo = { heroe: h.id }; h.efectos.muro = true;
      t.plantado = true; t.movRestante = 0;
      ev(estado, { tipo: 'reliquia', reliquia: 'escudo', heroe: h.id, texto: h.nombre + ' clava el Escudo del Último Muro. Ningún monstruo podrá acercarse a su lado hasta su próximo turno.' });
      return null;
    }
    case 'brujula': {
      t.brujula = true; t.plantado = true; t.movRestante = 0;
      const rumbo = rumboBrujula(estado, h);
      const aqui = rumbo && T.region(h.x, h.y) !== '.' && T.region(rumbo.x, rumbo.y) === T.region(h.x, h.y);
      const texto = rumbo
        ? `La aguja de la Brújula del Desertor gira y se clava: ${rumbo.que} está ${aqui ? 'en esta misma sala' : 'hacia ' + nombreRumbo(rumbo.x - h.x, rumbo.y - h.y) + ', a ' + (rumbo.d === 1 ? 'un paso' : 'unas ' + rumbo.d + ' casillas')}.`
        : 'La aguja de la Brújula del Desertor gira sin parar: no hay camino.';
      ev(estado, { tipo: 'reliquia', reliquia: 'brujula', heroe: h.id, ruta: rumbo ? rumbo.ruta.slice(1, 14) : [], texto });
      log(estado, texto);
      return null;
    }
    case 'campana': {
      usarAccion(); usadas.campana = 1;
      const muertos = estado.monstruos.filter((m) => m.vivo && m.visto && m.nomuerto && T.lineaVision(estado, h.x, h.y, m.x, m.y));
      ev(estado, { tipo: 'reliquia', reliquia: 'campana', heroe: h.id, texto: h.nombre + ' tañe la Campana de los Muertos. ¡DONG!' });
      for (const m of muertos) {
        m.efectos.aturdido = true;
        if ((m.x !== m.x0 || m.y !== m.y0) && !T.figuraEn(estado, m.x0, m.y0)) {
          ev(estado, { tipo: 'mover', id: m.id, ruta: [[m.x, m.y], [m.x0, m.y0]] });
          m.x = m.x0; m.y = m.y0;
        }
      }
      avisar(estado, muertos.length ? (muertos.length === 1 ? 'Un no muerto retrocede' : muertos.length + ' no muertos retroceden') + ' a su sitio y pierde' + (muertos.length === 1 ? '' : 'n') + ' su próximo turno.' : 'No hay no muertos a la vista… pero el sonido recorre toda la mazmorra.', 'bueno');
      avisar(estado, 'Algo ha oído la campana…', 'peligro');
      aparecerErrante(estado, h);
      return null;
    }
  }
  return 'Esa reliquia no se usa así.';
}

// =============================================================
//  COMPAÑEROS IA: juegan solos su turno (el motor del anfitrión).
//  Siguen al grupo, pelean y se curan; no abren puertas ni buscan tesoro.
// =============================================================
function turnoIA(estado, h) {
  // Sin ningún jugador de carne y hueso no hay a quién seguir: lo mueve el anfitrión.
  if (!Object.values(estado.heroes).some((o) => !o.ia)) return;
  const t = estado.turno;
  const usarAccion = () => { t.accion = true; if (t.movido) t.movRestante = 0; };
  const hacer = (a) => { estado._autor = h.id; try { return accionHeroe(estado, a, h, t, disponibles(estado, h.id), usarAccion); } finally { delete estado._autor; } };
  const vivos = () => estado.monstruos.filter((m) => m.vivo && m.visto && !m.efectos.poseido && !m.neutral && !m.aliado);
  const distancia = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const actuar = () => {
    if (t.accion || !h.vivo) return;
    const d = disponibles(estado, h.id);
    // Curar a quien esté peor (incluido él mismo).
    const cura = d.hechizos.find((x) => ['sanar', 'balsamo'].includes(x.id));
    if (cura) {
      const herido = cura.objetivos.map((id) => estado.heroes[id]).filter((o) => o && o.cuerpo <= o.cuerpoMax - 3).sort((a, b) => a.cuerpo - b.cuerpo)[0];
      if (herido) return hacer({ tipo: 'hechizo', hechizo: cura.id, objetivo: herido.id });
    }
    const atacables = d.atacables.filter((id) => !estado.monstruos.find((x) => x.id === id)?.neutral);
    if (atacables.length) {
      const m = atacables.map((id) => estado.monstruos.find((x) => x.id === id)).sort((a, b) => (b.jefe - a.jefe) || (a.cuerpo - b.cuerpo))[0];
      return hacer({ tipo: 'atacar', objetivo: m.id });
    }
    // Hechizo de daño a distancia contra lo más peligroso a la vista.
    const ataque = d.hechizos.find((x) => ['bolaFuego', 'espiritu', 'llamarada', 'raices', 'vendaval', 'sueno'].includes(x.id));
    if (ataque && ataque.objetivos.length) {
      const m = ataque.objetivos.map((id) => estado.monstruos.find((x) => x.id === id)).sort((a, b) => b.ataque - a.ataque)[0];
      return hacer({ tipo: 'hechizo', hechizo: ataque.id, objetivo: m.id });
    }
  };
  // 1) Poción si está a punto de caer.
  if (h.cuerpo <= 2 && h.objetos.pocionCurar > 0) hacer({ tipo: 'pocion', objeto: 'pocionCurar' });
  // 2) Si ya puede pelear, pelea antes de moverse.
  actuar();
  // 3) Moverse: hacia el monstruo más cercano a la vista o, si no hay, detrás del jugador más cercano.
  if (!t.plantado && disponibles(estado, h.id).puedeTirar) {
    hacer({ tipo: 'tirar' });
    const { mapa, out } = destinos(estado, h);
    const sinPuertas = (k) => {
      const ruta = T.reconstruir(mapa, k);
      for (let i = 1; i < ruta.length; i++) if (T.borde(estado, ruta[i - 1], ruta[i]) !== 'libre') return false;
      return true;
    };
    const objetivos = vivos().filter((m) => T.lineaVision(estado, h.x, h.y, m.x, m.y));
    const lider = Object.values(estado.heroes).filter((o) => !o.ia && o.vivo && !o.fuera).sort((a, b) => distancia(a, h) - distancia(b, h))[0];
    let mejor = null, nota = Infinity;
    for (const k of Object.keys(out)) {
      if (!sinPuertas(k)) continue;
      const [x, y] = k.split(',').map(Number);
      const c = { x, y };
      let v;
      if (objetivos.length) v = Math.min(...objetivos.map((m) => distancia(c, m)));
      else if (lider) { const dl = distancia(c, lider); v = dl <= 1 ? 1 : dl; }
      else continue;
      v += out[k] * 0.01; // a igualdad, andar menos
      if (v < nota) { nota = v; mejor = c; }
    }
    const ahora = objetivos.length ? Math.min(...objetivos.map((m) => distancia(h, m))) : (lider ? distancia(h, lider) : 0);
    if (mejor && nota < ahora) hacer({ tipo: 'mover', x: mejor.x, y: mejor.y });
  }
  // 4) Y si ha llegado a algo, actúa.
  actuar();
  comprobarFin(estado);
  if (!estado.resultado && estado.turno?.heroe === h.id) siguienteTurno(estado);
}

// =============================================================
//  PODERES DE ENEMIGOS (lo que hacen solos) Y AL POSEERLOS
// =============================================================
const ORCOS = ['orco', 'trasgo', 'chaman', 'bestias', 'lobo'];
const NOMUERTOS_COMBO = ['esqueleto', 'zombi'];
const NOMUERTOS = ['esqueleto', 'zombi', 'momia'];
const enemigoVisible = (estado, a, b) => b.vivo && !b.aliado && T.lineaVision(estado, a.x, a.y, b.x, b.y);
// Casilla libre lo más cerca posible (misma sala), buscando en anillos de hasta 3 casillas.
function sitioJunto(estado, x, y, radio = 1) {
  const libre = (a, b) => T.dentro(a, b) && !T.esRoca(estado, a, b) && !T.muebleEn(estado, a, b) && !T.figuraEn(estado, a, b) && T.region(a, b) === T.region(x, y);
  for (let r = 1; r <= radio; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) === r && libre(x + dx, y + dy)) return [x + dx, y + dy];
    }
  }
  return undefined;
}
function invocarAliado(estado, tipo, x, y, de, turnos, extra = {}) {
  const p = sitioJunto(estado, x, y);
  if (!p) return null;
  const a = aparecer(estado, { tipo, x: p[0], y: p[1], ia: 'agresivo' }, false);
  if (!a) return null;
  a.visto = true; a.aliado = { de, turnos }; delete a.elite; Object.assign(a, extra);
  if (a.ilusion) a.nombre = 'Señuelo';
  ev(estado, { tipo: 'aparece', id: a.id });
  return a;
}
// Devuelve true si el poder gasta el turno del monstruo.
function poderEnemigo(estado, m) {
  switch (m.tipo) {
    case 'chaman': {
      const herido = estado.monstruos.filter((o) => o !== m && ORCOS.includes(o.tipo) && o.cuerpo < o.cuerpoMax && enemigoVisible(estado, m, o)).sort((a, b) => a.cuerpo - b.cuerpo)[0];
      if (herido) { herido.cuerpo++; avisar(estado, m.nombre + ' canta y cura a ' + herido.nombre + '.', 'peligro'); return true; }
      const suyos = estado.monstruos.filter((o) => ORCOS.includes(o.tipo) && o !== m && enemigoVisible(estado, m, o));
      if (suyos.length) { for (const o of suyos) o.efectos.tambor = 1; avisar(estado, m.nombre + ' toca el tambor de guerra: los suyos atacan con +1 dado.', 'peligro'); }
      return false;
    }
    case 'sacerdotisa': {
      m.revividos ||= 0;
      if (m.revividos >= 3) return false;
      const muerto = estado.monstruos.find((o) => !o.vivo && NOMUERTOS.includes(o.tipo) && !o.aliado && !o.alzado && T.lineaVision(estado, m.x, m.y, o.x, o.y) && !T.figuraEn(estado, o.x, o.y));
      if (!muerto) return false;
      muerto.vivo = true; muerto.cuerpo = 1; m.revividos++;
      ev(estado, { tipo: 'aparece', id: muerto.id });
      avisar(estado, m.nombre + ' alza los brazos: ¡' + muerto.nombre + ' vuelve a levantarse!', 'peligro');
      return true;
    }
    case 'ilusionista':
      if (!m.copias) {
        m.copias = true;
        for (let i = 0; i < 2; i++) {
          const p = sitioJunto(estado, m.x, m.y);
          if (!p) break;
          const c = aparecer(estado, { tipo: 'ilusionista', x: p[0], y: p[1], ia: 'agresivo' }, false);
          if (c) { c.visto = true; c.ilusion = true; c.copias = true; c.ataque = 0; c.cuerpo = c.cuerpoMax = 1; c.nombre = m.nombre; delete c.elite; ev(estado, { tipo: 'aparece', id: c.id }); }
        }
        avisar(estado, '¡' + m.nombre + ' se multiplica! ¿Cuál es el de verdad?', 'peligro');
        return true;
      }
      return false;
    case 'bestias':
      if (!m.lobos) {
        m.lobos = [];
        for (let i = 0; i < 2; i++) {
          const p = sitioJunto(estado, m.x, m.y);
          if (!p) break;
          const l = aparecer(estado, { tipo: 'lobo', x: p[0], y: p[1], ia: 'agresivo' }, false);
          if (l) { l.visto = true; l.amo = m.id; m.lobos.push(l.id); ev(estado, { tipo: 'aparece', id: l.id }); }
        }
        avisar(estado, m.nombre + ' silba: ¡sus lobos se lanzan a por vosotros!', 'peligro');
        return true;
      }
      return false;
    case 'golem': {
      for (const [dx, dy] of T.DIRS) {
        const n = [m.x + dx, m.y + dy];
        if (T.esRoca(estado, ...n)) { delete estado.rocas[clave(...n)]; avisar(estado, m.nombre + ' aplasta un derrumbe a su paso.', 'peligro'); revelar(estado); break; }
        const mu = T.muroEntre(estado, [m.x, m.y], n);
        if (mu && !mu.roto) { mu.roto = true; ev(estado, { tipo: 'temblor' }); avisar(estado, '¡' + m.nombre + ' atraviesa un muro!', 'peligro'); revelar(estado); break; }
      }
      return false;
    }
  }
  return false;
}

// Poder que puede usar el mago con el monstruo que posee (una vez por turno).
function poderPoseido(estado, h, m) {
  const id = D.MONSTRUOS[m.tipo]?.poder;
  if (!id) return null;
  const r = { id, objetivos: [], nombre: { curar: 'Curar', alzar: 'Alzar muerto', senuelo: 'Crear señuelo', vision: 'Ojo que todo lo ve', veneno: 'Envenenar', invocar: 'Invocar esqueletos', embestir: 'Embestir', lobos: 'Llamar a los lobos' }[id] };
  if (id === 'curar') r.objetivos = Object.values(estado.heroes).filter((o) => o.vivo && !o.fuera && o.cuerpo < o.cuerpoMax && T.lineaVision(estado, m.x, m.y, o.x, o.y)).map((o) => o.id);
  else if (id === 'alzar') r.objetivos = estado.monstruos.filter((o) => !o.vivo && !o.jefe && !o.alzado && !o.aliado && T.lineaVision(estado, m.x, m.y, o.x, o.y)).map((o) => o.id);
  else if (id === 'veneno') r.objetivos = estado.monstruos.filter((o) => o !== m && o.vivo && o.visto && !o.aliado && !o.efectos.veneno && T.lineaVision(estado, m.x, m.y, o.x, o.y)).map((o) => o.id);
  else if (id === 'invocar') r.objetivos = m.hechizos?.includes('invocar') ? ['yo'] : [];
  else if (id === 'embestir') for (const [dx, dy] of T.DIRS) {
    const n = [m.x + dx, m.y + dy];
    if (T.esRoca(estado, ...n)) r.objetivos.push('roca:' + clave(...n));
    const mu = T.muroEntre(estado, [m.x, m.y], n);
    if (mu && !mu.roto) r.objetivos.push('muro:' + mu.id);
  }
  else if (id === 'lobos') r.objetivos = [];
  else r.objetivos = ['yo'];
  return r;
}
function usarPoderPoseido(estado, h, m, objetivo) {
  const id = D.MONSTRUOS[m.tipo].poder;
  switch (id) {
    case 'curar': { const o = estado.heroes[objetivo]; if (!sinCuras(o)) o.cuerpo = Math.min(o.cuerpoMax, o.cuerpo + 2); delete o.efectos.veneno; avisar(estado, m.nombre + ' (poseído) cura a ' + o.nombre + ' (+2).', 'bueno'); break; }
    case 'alzar': { const o = estado.monstruos.find((x) => x.id === objetivo); o.alzado = true; const a = invocarAliado(estado, 'esqueleto', o.x, o.y, h.id, 2); if (a) avisar(estado, m.nombre + ' (poseído) levanta un esqueleto que lucha por vosotros.', 'bueno'); break; }
    case 'senuelo': { const a = invocarAliado(estado, 'ilusionista', m.x, m.y, h.id, 2, { ilusion: true, ataque: 0, cuerpo: 1, cuerpoMax: 1 }); if (a) avisar(estado, 'Aparece un señuelo: los monstruos irán a por él.', 'bueno'); break; }
    case 'vision': {
      const sala = T.region(m.x, m.y);
      if (sala !== '.') revelarSala(estado, sala);
      for (const tr of estado.trampas) if (tr.activa && T.lineaVision(estado, m.x, m.y, tr.x, tr.y)) tr.descubierta = true;
      revelar(estado);
      avisar(estado, 'A través del Ojo veis toda la sala y sus trampas. Mientras lo controléis, los que ve atacan con +1 dado.', 'bueno');
      break;
    }
    case 'veneno': { const o = estado.monstruos.find((x) => x.id === objetivo); o.efectos.veneno = true; avisar(estado, m.nombre + ' (poseída) envenena a ' + o.nombre + '.', 'bueno'); break; }
    case 'invocar': {
      m.hechizos.splice(m.hechizos.indexOf('invocar'), 1);
      let n = 0; for (let i = 0; i < 2; i++) if (invocarAliado(estado, 'esqueleto', m.x, m.y, h.id, 2)) n++;
      avisar(estado, m.nombre + ' (poseído) invoca ' + n + ' esqueletos a vuestro favor.', 'bueno');
      break;
    }
    case 'embestir': {
      const [tipo, ref] = objetivo.split(':');
      if (tipo === 'roca') delete estado.rocas[ref];
      else { const w = estado.muros.find((x) => x.id === ref); T.muroEntre(estado, w.a, w.b).roto = true; }
      ev(estado, { tipo: 'temblor' }); avisar(estado, '¡El gólem embiste y lo derriba!', 'bueno'); revelar(estado);
      break;
    }
  }
  return null;
}

// Golpe de un monstruo a otro (aliados contra enemigos, poseídos, etc.).
function golpeEntreMonstruos(estado, a, b, etiqueta = '') {
  const ataque = tirarCombate(a.ataque);
  const defensa = tirarCombate(b.efectos?.dormido ? 0 : b.defensa);
  const dano = Math.max(0, cuenta(ataque, 'calavera') - cuenta(defensa, 'escudoNegro'));
  ev(estado, { tipo: 'dados', atacante: a.id, defensor: b.id, ataque, defensa, dano, defiende: 'monstruo', etiqueta });
  log(estado, a.nombre + ' → ' + b.nombre + ': ' + dano + ' de daño.', dano ? 'golpe' : '');
  danarMonstruo(estado, b, dano);
}

// Berserker a 1 de cuerpo: pierde la cabeza y ataca a lo que tenga más cerca.
function locuraBerserker(estado, h) {
  const t = estado.turno;
  t.accion = true; t.plantado = true;
  const cerca = [...Object.values(estado.heroes).filter((o) => o !== h && o.vivo && !o.fuera), ...estado.monstruos.filter((m) => m.vivo && m.visto)]
    .filter((o) => T.puedeTocar(estado, h, o));
  if (!cerca.length) { avisar(estado, h.nombre + ' ruge fuera de sí, pero no tiene a nadie al lado.', 'peligro'); return; }
  const v = cerca[rnd(cerca.length)];
  avisar(estado, '¡' + h.nombre + ' pierde la cabeza y ataca a ' + v.nombre + '!', 'peligro');
  if (estado.heroes[v.id]) {
    const ataque = tirarCombate(ataqueHeroe(h)), defensa = tirarCombate(defensaHeroe(v));
    const dano = Math.max(0, cuenta(ataque, 'calavera') - cuenta(defensa, 'escudo'));
    ev(estado, { tipo: 'dados', atacante: h.id, defensor: v.id, ataque, defensa, dano, defiende: 'heroe', etiqueta: 'Locura berserker' });
    danarHeroe(estado, v, dano);
  } else golpearMonstruo(estado, h, v, ataqueHeroe(h), 'Locura berserker');
}

// =============================================================
//  MAZMORRA INFINITA: altares, mercader errante y fantasma del caído
// =============================================================
function libreEnDef(def, x, y) {
  if (T.region(x, y) === '.') return false;
  const ocupada = (def.monstruos || []).some((m) => m.x === x && m.y === y) || (def.rocas || []).some(([a, b]) => a === x && b === y)
    || (def.muebles || []).some((u) => x >= u.x && x < u.x + u.w && y >= u.y && y < u.y + u.h)
    || (def.puertas || []).some((p) => (p.a[0] === x && p.a[1] === y) || (p.b[0] === x && p.b[1] === y))
    || (def.trampas || []).some((t) => t.x === x && t.y === y);
  const [ex, ey] = def.escalera;
  return !ocupada && !(x >= ex && x <= ex + 1 && y >= ey && y <= ey + 1);
}
function salasDe(def) {
  const inicio = T.region(def.escalera[0], def.escalera[1]);
  return [...new Set((def.puertas || []).flatMap((p) => [T.region(...p.a), T.region(...p.b)]))].filter((s) => s !== '.' && s !== inicio);
}
function sitioLibre(def, sala) {
  const c = T.casillasDe(sala).filter(([x, y]) => libreEnDef(def, x, y));
  return c.length ? c[rnd(c.length)] : null;
}
function ponerExtrasInfinita(estado, def) {
  const piso = def.numero || estado.misionIdx + 1;
  const salas = salasDe(def);
  if (!salas.length) return;
  def.muebles ||= []; def.monstruos ||= [];
  // Altar con dios: uno de cada dos pisos más o menos.
  if (rnd(100) < 55) {
    let altar = def.muebles.find((u) => u.tipo === 'altar');
    if (!altar) {
      const s = salas[rnd(salas.length)], p = sitioLibre(def, s);
      if (p) { altar = { tipo: 'altar', x: p[0], y: p[1], w: 1, h: 1 }; def.muebles.push(altar); }
    }
    if (altar) altar.dios = ['guerra', 'suerte', 'avaricia'][rnd(3)];
  }
  // Mercader errante, desde el piso 2.
  if (piso >= 2 && rnd(100) < 35) {
    const s = salas[rnd(salas.length)], p = sitioLibre(def, s);
    if (p) {
      const todo = Object.keys(D.MERCANCIA);
      // Siempre trae una rareza que solo vende él, y dos cosas más.
      const raras = [...Object.keys(D.ARMAS), ...Object.keys(D.ARMADURAS)].filter((k) => (D.ARMAS[k] || D.ARMADURAS[k]).mercader);
      const mercancia = [raras[rnd(raras.length)]];
      while (mercancia.length < 3) { const it = todo[rnd(todo.length)]; if (!mercancia.includes(it)) mercancia.push(it); }
      const hostil = estado.ladron && rnd(2) === 0;
      def.monstruos.push({ id: 'mercader', tipo: 'mercader', x: p[0], y: p[1], ia: hostil ? 'agresivo' : 'neutral', noEscalar: true,
        extra: hostil ? { mercancia, nombre: 'Mercader rencoroso' } : { neutral: true, mercancia } });
    }
  }
  // Fantasma del grupo que cayó en este piso en una partida anterior.
  const f = (estado.fantasmas || []).find((x) => x.piso === piso);
  if (f) {
    const lejos = salas.slice().sort(() => rnd(3) - 1);
    for (const g of f.heroes.slice(0, 2)) {
      const s = lejos.pop() || salas[0], p = sitioLibre(def, s);
      if (!p) continue;
      def.monstruos.push({ tipo: 'fantasma', x: p[0], y: p[1], ia: 'guardian', nombre: 'Fantasma de ' + g.nombre,
        ataque: Math.max(2, g.ataque), defensa: Math.max(2, g.defensa), cuerpo: Math.max(3, Math.ceil(g.cuerpoMax / 2)),
        extra: { equipo: g.equipo || [] } });
    }
    def.intro = (def.intro || '') + ' Un frío conocido recorre la mazmorra: aquí cayó un grupo de héroes, y sus fantasmas siguen vagando con su equipo.';
  }
}

const nombreMercancia = (it) => D.MERCANCIA[it]?.nombre || D.ARMAS[it]?.nombre || D.ARMADURAS[it]?.nombre || D.POCIONES[it]?.nombre || it;
export const precioMercader = (estado, it) => Math.round((D.MERCANCIA[it]?.precio || D.ARMAS[it]?.precio || D.ARMADURAS[it]?.precio || 100) * (estado.ladron ? 3 : 1));
function entregarItem(estado, h, it) {
  const def = D.MERCANCIA[it];
  if (D.POCIONES[it]) darPocion(estado, h, it);
  else if (it === 'pergamino') ganarXP(estado, h, 15);
  else if (it === 'pieza') {
    const r = estado.reliquias || {};
    const falta = Object.values(D.RELIQUIAS).flatMap((rq) => rq.piezas).find((p) => !r[p]);
    if (falta) avisar(estado, ganarReliquia(estado, falta), 'tesoro'); else h.oro += 300;
  } else if (D.ARMAS[it] || D.ARMADURAS[it]) meter(inventarioDe(h), it);
  else if (def) h.oro += def.precio;
}
function enfadarMercader(estado, m, motivo) {
  if (!m.neutral) return;
  m.neutral = false; m.ia = 'agresivo'; m.activo = true;
  m.nombre = 'Mercader furioso'; m.ataque += 1;
  estado.ladron = true;
  avisar(estado, motivo + ' ¡El mercader saca un hacha enorme! A partir de ahora, ningún mercader os tratará igual.', 'peligro');
}
// El mercader recoge sus cosas y se va del piso (deja de estar en el tablero).
function despedirMercader(estado, m, motivo) {
  if (!m?.neutral) return;
  estado.monstruos.splice(estado.monstruos.indexOf(m), 1);
  avisar(estado, motivo + ' «Otra vez será, amigo.» Se echa la mochila al hombro y desaparece por un pasadizo que nadie había visto.', 'bueno');
}
function tratoMercader(estado, h, m, it, robar) {
  if (!m.mercancia?.includes(it)) return 'El mercader no tiene eso.';
  const precio = precioMercader(estado, it);
  if (robar) {
    m.mercancia.splice(m.mercancia.indexOf(it), 1);
    entregarItem(estado, h, it);
    enfadarMercader(estado, m, h.nombre + ' se lleva ' + nombreMercancia(it) + ' sin pagar.');
    return null;
  }
  if (h.oro < precio) return 'No tienes oro suficiente en la bolsa (' + precio + ').';
  h.oro -= precio;
  m.mercancia.splice(m.mercancia.indexOf(it), 1);
  entregarItem(estado, h, it);
  avisar(estado, h.nombre + ' compra ' + nombreMercancia(it) + ' por ' + precio + ' monedas.' + (D.ARMAS[it] || D.ARMADURAS[it] ? ' Va a su inventario.' : ''), 'tesoro');
  return null;
}
function rezar(estado, h, altar, opcion) {
  const dios = altar.dios;
  if (subclaseDe(h)?.almas && dios !== 'avaricia') return 'Los dioses no escuchan a un nigromante.';
  if (dios === 'guerra') {
    if (!['ataque', 'defensa'].includes(opcion)) return 'Elige ataque o defensa.';
    altar.usado = true;
    h.cuerpo = Math.max(1, h.cuerpo - 2);
    h.efectos[opcion === 'ataque' ? 'guerraAtq' : 'guerraDef'] = true;
    avisar(estado, h.nombre + ' ofrece su sangre al Dios de la guerra: +1 dado de ' + opcion + ' el resto del piso.', 'bueno');
    return null;
  }
  if (dios === 'suerte' && opcion === 'purificar') {
    if (!malditaPuesta(h)) return 'No llevas nada maldito.';
    if (h.oro < 200) return 'La diosa pide 200 monedas por romper la maldición.';
    altar.usado = true; h.oro -= 200; h.purificada = true;
    avisar(estado, 'La Diosa de la suerte acepta 200 monedas y rompe la maldición de ' + D.ARMAS[h.arma].nombre + '. Ya puedes quitártela.', 'bueno');
    return null;
  }
  if (dios === 'suerte') {
    altar.usado = true;
    const dado = d6();
    const textos = {
      1: () => { h.efectos.malaSuerte = true; return 'Mala suerte: −1 dado de defensa el resto del piso.'; },
      2: () => { aparecerErrante(estado, h); return '¡La diosa se ríe y aparece un monstruo!'; },
      3: () => { const oro = 40 + (estado.misionIdx + 1) * 20; h.oro += oro; return '+' + oro + ' monedas.'; },
      4: () => { darPocion(estado, h, 'pocionCurar'); return 'Una poción curativa.'; },
      5: () => { for (const o of Object.values(estado.heroes)) if (o.vivo && !sinCuras(o)) o.cuerpo = o.cuerpoMax; return '¡Todo el grupo se cura por completo!'; },
      6: () => { entregarItem(estado, h, 'pieza'); return '¡Una pieza de reliquia!'; }
    };
    ev(estado, { tipo: 'tirada', heroe: h.id, valores: [dado], total: dado });
    avisar(estado, 'La Diosa de la suerte tira el dado (' + dado + '): ' + textos[dado](), dado <= 2 ? 'peligro' : 'bueno');
    return null;
  }
  if (dios === 'avaricia') {
    const ofrenda = { poco: 50, bastante: 150, mucho: 350 }[opcion];
    if (!ofrenda) return 'Elige cuánto ofreces.';
    if (h.oro < ofrenda) return 'No llevas tanto oro en la bolsa.';
    altar.usado = true;
    h.oro -= ofrenda;
    if (ofrenda === 50) { darPocion(estado, h, 'pocionCurar'); avisar(estado, 'El Dios de la avaricia acepta la ofrenda con desdén: una poción curativa.', 'bueno'); }
    if (ofrenda === 150) { for (const o of Object.values(estado.heroes)) if (o.vivo && !sinCuras(o)) o.cuerpo = o.cuerpoMax; darPocion(estado, h, 'pocionFuerza'); avisar(estado, 'El Dios de la avaricia sonríe: el grupo se cura y recibes una poción de fuerza.', 'bueno'); }
    if (ofrenda === 350) { entregarItem(estado, h, 'pieza'); h.puntos = (h.puntos || 0) + 1; avisar(estado, '¡El Dios de la avaricia se deshace en oro! Una pieza de reliquia y un punto de mejora.', 'bueno'); }
    return null;
  }
  return 'Ese altar no responde.';
}

// =============================================================
//  PISOS ESPECIALES: maldiciones, jefes de zona y el Corazón
// =============================================================
const JEFES_ZONA = {
  cuevas:     { tipo: 'chaman', nombre: 'Ugrak, el Gran Chamán', cuerpo: 8, ataque: 4, defensa: 3, invoca: 'orco' },
  catacumbas: { tipo: 'sacerdotisa', nombre: 'La Reina de Hueso', cuerpo: 9, ataque: 4, defensa: 4, invoca: 'esqueleto' },
  fortaleza:  { tipo: 'golem', nombre: 'El Gólem Ancestral', cuerpo: 14, ataque: 5, defensa: 5, invoca: 'gargola' },
  abismo:     { tipo: 'hechicero', nombre: 'El Heraldo del Abismo', cuerpo: 10, ataque: 4, defensa: 4, invoca: 'guerrero', hechizos: ['rayo', 'rayo'] }
};
function salaMasLejana(def) {
  const [ex, ey] = def.escalera;
  const salas = salasDe(def);
  return salas.sort((a, b) => {
    const da = Math.min(...T.casillasDe(a).map(([x, y]) => Math.abs(x - ex) + Math.abs(y - ey)));
    const db = Math.min(...T.casillasDe(b).map(([x, y]) => Math.abs(x - ex) + Math.abs(y - ey)));
    return db - da;
  })[0];
}
function pisoEspecial(estado, def) {
  const piso = def.numero || estado.misionIdx + 1;
  def.monstruos ||= [];
  // Jefe de zona cada 5 pisos; en el 20, el Corazón de la Mazmorra (y luego vuelve a empezar el ciclo, más duro).
  if (piso % 5 === 0) {
    const sala = salaMasLejana(def);
    const p = sala && sitioLibre(def, sala);
    if (p) {
      const corazon = piso === 20 && !estado.pesadilla;
      const j = corazon
        ? { tipo: 'corazon', nombre: 'El Corazón de la Mazmorra', cuerpo: 18, ataque: 4, defensa: 4, hechizos: ['rayo', 'rayo', 'rayo', 'invocar'], invoca: 'guerrero' }
        : JEFES_ZONA[def.zona] || JEFES_ZONA.cuevas;
      def.monstruos.push({ id: 'jefezona', tipo: j.tipo, nombre: j.nombre, x: p[0], y: p[1], ia: corazon ? 'lanzador' : 'guardian', jefe: true,
        cuerpo: j.cuerpo, ataque: j.ataque, defensa: j.defensa, hechizos: j.hechizos || [],
        extra: { fases: corazon ? [{ umbral: 0.66, invoca: j.invoca, n: 2 }, { umbral: 0.33, invoca: 'gargola', n: 2 }] : [{ umbral: 0.5, invoca: j.invoca, n: 2 }] } });
      def.objetivo = { tipo: 'matar', id: 'jefezona', texto: 'Derrota a ' + j.nombre + '.' };
      def.tareas = [{ matar: 'jefezona', texto: 'Derrotar a ' + j.nombre }];
      def.intro = corazon
        ? 'Habéis llegado al fondo. Las paredes laten como si respiraran: aquí está el Corazón de la Mazmorra, lo que lanza las maldiciones y despierta a los muertos. Destruidlo.'
        : (def.intro || '') + ' Al fondo de este piso os espera ' + j.nombre + ', señor de esta zona.';
      return; // sin maldición en los pisos de jefe
    }
  }
  // Maldición del Corazón: desde el piso 3, la mitad de las veces (siempre si descansasteis).
  if (piso >= 3 && (estado.maldicionSegura || rnd(100) < 45)) {
    const ids = Object.keys(D.MALDICIONES);
    const id = ids[rnd(ids.length)];
    def.maldicion = id;
    def.intro = (def.intro || '') + ' El Corazón de la Mazmorra late con fuerza y maldice este piso: ' + D.MALDICIONES[id].nombre + '. ' + D.MALDICIONES[id].desc;
    if (id === 'fiebreOro') {
      for (const t of Object.values(def.tesoros || {})) if (t.oro) t.oro *= 2;
      def.recompensa = (def.recompensa || 0) * 2;
      def.trampas ||= [];
      for (let i = 0; i < 3; i++) {
        const c = PASILLO_LIBRE(def);
        if (c) def.trampas.push({ id: 'tf' + i, tipo: ['foso', 'lanza'][rnd(2)], x: c[0], y: c[1] });
      }
    }
  }
  estado.maldicionSegura = false;
}
function PASILLO_LIBRE(def) {
  for (let i = 0; i < 60; i++) {
    const x = rnd(D.ANCHO), y = rnd(D.ALTO);
    if (T.region(x, y) !== '.') continue;
    const ocupada = (def.monstruos || []).some((m) => m.x === x && m.y === y) || (def.rocas || []).some(([a, b]) => a === x && b === y)
      || (def.trampas || []).some((t) => t.x === x && t.y === y) || (def.puertas || []).some((p) => (p.a[0] === x && p.a[1] === y) || (p.b[0] === x && p.b[1] === y));
    if (!ocupada) return [x, y];
  }
  return null;
}
// Al bajar de cierta vida, el jefe cambia de fase: llama refuerzos.
function faseJefe(estado, m) {
  for (const f of m.fases) {
    if (f.hecha || m.cuerpo > m.cuerpoMax * f.umbral) continue;
    f.hecha = true;
    let n = 0;
    for (let i = 0; i < f.n; i++) { const p = sitioJunto(estado, m.x, m.y, 3); if (!p) break; const r = aparecer(estado, { tipo: f.invoca, x: p[0], y: p[1], ia: 'agresivo' }, false); if (r) { r.visto = true; ev(estado, { tipo: 'aparece', id: r.id }); n++; } }
    ev(estado, { tipo: 'historia', texto: m.nombre + ' ruge de dolor y la mazmorra responde: ¡' + (n === 1 ? 'un refuerzo aparece' : n + ' refuerzos aparecen') + ' a su lado!' });
  }
}
function corazonVencido(estado) {
  estado.pesadilla = true;
  ev(estado, { tipo: 'historia', texto: 'El Corazón de la Mazmorra estalla en mil pedazos y las maldiciones se apagan… por un momento. Algo más profundo despierta: se abre el MODO PESADILLA. La mazmorra sigue, y ahora es peor.' });
  log(estado, '¡El Corazón de la Mazmorra ha caído!', 'bueno');
}

// Votación en el campamento: descansar cura a todos, pero el Corazón maldice el próximo piso.
export const votosNecesarios = (estado) => Math.ceil(new Set(Object.values(estado.heroes).filter((h) => !h.ia && !h.caido).map((h) => h.jugador)).size / 2);
function votarDescanso(estado, jugador) {
  if (!estado.aleatorio) return 'Solo en la Mazmorra Infinita.';
  if (estado.descansado) return 'Ya habéis descansado.';
  estado.votosDescanso ||= {};
  if (estado.votosDescanso[jugador]) delete estado.votosDescanso[jugador];
  else estado.votosDescanso[jugador] = true;
  if (Object.keys(estado.votosDescanso).length >= votosNecesarios(estado)) {
    estado.descansado = true;
    for (const h of Object.values(estado.heroes)) if (!h.caido) h.cuerpo = h.cuerpoMax;
    estado.maldicionSegura = true;
    log(estado, 'Acampáis junto a la escalera y os curáis las heridas… pero el Corazón de la Mazmorra os ha oído roncar: el próximo piso estará maldito.', 'bueno');
  }
  return null;
}

function aparecerErrante(estado, h) {
  const tipo = estado.mision.errante || 'orco';
  const cerca = T.DIRS.map(([dx, dy]) => [h.x + dx, h.y + dy])
    .find(([x, y]) => T.dentro(x, y) && T.borde(estado, [h.x, h.y], [x, y]) === 'libre' && !T.esRoca(estado, x, y) && !T.muebleEn(estado, x, y) && !T.figuraEn(estado, x, y));
  const m = aparecer(estado, { tipo, x: (cerca || [h.x, h.y])[0], y: (cerca || [h.x, h.y])[1], ia: 'agresivo' });
  if (m) { if (!m.visto) { m.visto = true; ev(estado, { tipo: 'aparece', id: m.id }); } if (T.puedeTocar(estado, m, h)) golpearHeroe(estado, m, h, m.ataque); }
}

// Mazmorra Perdida: a veces hay una pieza de reliquia que el grupo no tiene
// (antes las que completan una reliquia a medias).
function esconderPieza(estado, def) {
  const r = estado.reliquias || {};
  const faltan = Object.values(D.RELIQUIAS).filter((rq) => !rq.piezas.every((p) => r[p]));
  if (!faltan.length || rnd(100) >= 60) return;
  const medias = faltan.filter((rq) => rq.piezas.some((p) => r[p]));
  const rq = (medias.length ? medias : faltan)[rnd(medias.length || faltan.length)];
  const pieza = rq.piezas.find((p) => !r[p]);
  const inicio = T.region(def.escalera[0], def.escalera[1]);
  const salas = [...new Set((def.puertas || []).flatMap((p) => [T.region(...p.a), T.region(...p.b)]))]
    .filter((s) => s !== '.' && s !== inicio && !def.tesoros?.[s]?.flag && !def.tesoros?.[s]?.reliquia);
  if (!salas.length) return;
  const sala = salas[rnd(salas.length)];
  def.tesoros ||= {};
  const previo = def.tesoros[sala];
  const texto = 'Entre el polvo aparece algo antiguo: ' + D.PIEZAS[pieza].nombre.toLowerCase() + '.';
  def.tesoros[sala] = previo ? { ...previo, texto: previo.texto + ' ' + texto, reliquia: pieza } : { texto, reliquia: pieza };
}

// Las piezas se juntan solas en cuanto el grupo tiene las dos de una reliquia.
function ganarReliquia(estado, id) {
  const r = (estado.reliquias ||= {});
  if (r[id] || !D.PIEZAS[id]) return '';
  r[id] = true;
  let texto = '(Pieza de reliquia: ' + D.PIEZAS[id].nombre + '.)';
  const nueva = Object.entries(D.RELIQUIAS).find(([k, rq]) => !r[k] && rq.piezas.every((p) => r[p]));
  if (nueva) {
    const [k, rq] = nueva;
    r[k] = true;
    texto += ' Al juntar ' + rq.piezas.map((p) => D.PIEZAS[p].nombre).join(' y ') + ', encajan como si se buscaran y forman la reliquia «' + rq.nombre + '». ' + rq.desc;
  } else texto += ' ' + D.PIEZAS[id].pista;
  return texto;
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function lineaTrompa(estado, desde, dir) {
  const celdas = [];
  let cur = desde;
  for (let i = 0; i < 40; i++) {
    const n = [cur[0] + dir[0], cur[1] + dir[1]];
    if (!T.dentro(n[0], n[1])) break;
    if (T.borde(estado, cur, n) !== 'libre') {
      const mu = T.muroEntre(estado, cur, n);
      return { celdas, muro: mu && !mu.roto ? mu : null };
    }
    celdas.push(n); cur = n;
  }
  return { celdas, muro: null };
}
export function apoyosTrompa(estado, h) {
  const out = [];
  for (const d of DIRS) {
    const x = h.x + d[0], y = h.y + d[1];
    const f = T.figuraEn(estado, x, y);
    if (!f || f.id === h.id || !T.esAliado(estado, f)) continue;
    if (T.borde(estado, [h.x, h.y], [x, y]) !== 'libre') continue;
    const l = lineaTrompa(estado, [x, y], d);
    const enemigos = l.celdas.filter(([cx, cy]) => estado.monstruos.some((m) => m.vivo && m.visto && m.x === cx && m.y === cy)).length;
    out.push({ id: f.id, dir: d, muro: l.muro?.id || null, enemigos });
  }
  return out;
}
function tocarTrompa(estado, h, ap, modo) {
  (estado.reliquiasUsadas ||= {}).jerico = 1;
  const apoyo = estado.heroes[ap.id] || estado.cargador;
  const quien = ap.id === 'cargador' ? 'el cargador' : apoyo.nombre;
  const { celdas, muro } = lineaTrompa(estado, [apoyo.x, apoyo.y], ap.dir);
  if (estado.heroes[ap.id]) apoyo.efectos.sordo = true;
  const sordo = estado.heroes[ap.id] ? ` ${apoyo.nombre} se queda medio sordo (−1 dado de defensa en el próximo golpe).` : '';
  if (modo === 'muro') {
    muro.roto = true;
    const texto = `${h.nombre} invoca la Trompa de Jericó, que crece hasta medir tres varas; ${quien} la sujeta y… ¡el muro se viene abajo! La trompa vuelve a encogerse en su mano.` + sordo;
    ev(estado, { tipo: 'trompa', heroe: h.id, celdas, muro: muro.id, texto, tono: 'bueno' });
    ev(estado, { tipo: 'temblor' });
    log(estado, texto, 'bueno');
    revelar(estado);
    disparar(estado, 'muro_roto', { muro: muro.id });
    return;
  }
  ev(estado, { tipo: 'trompa', heroe: h.id, celdas, texto: `${h.nombre} invoca la Trompa de Jericó, que crece hasta medir tres varas; ${quien} la sujeta y… ¡BWOOOOOM!`, tono: 'bueno' });
  ev(estado, { tipo: 'temblor' });
  let tontos = 0, piedras = 0;
  for (const [x, y] of celdas) {
    if (estado.rocas[clave(x, y)]) { delete estado.rocas[clave(x, y)]; piedras++; }
    const m = estado.monstruos.find((o) => o.vivo && o.x === x && o.y === y);
    if (!m) continue;
    m.efectos.aturdido = true;
    if (cuenta(tirarCombate(1), 'calavera')) danarMonstruo(estado, m, 1);
    if (m.vivo) tontos++;
  }
  const partes = [];
  if (tontos) partes.push(tontos === 1 ? 'un enemigo se queda tonto y pierde su próximo turno' : tontos + ' enemigos se quedan tontos y pierden su próximo turno');
  if (piedras) partes.push(piedras === 1 ? 'un derrumbe salta en pedazos' : piedras + ' derrumbes saltan en pedazos');
  avisar(estado, (partes.length ? partes.join(' y ').replace(/^./, (c) => c.toUpperCase()) + '.' : 'El estruendo retumba por el pasillo, pero no había nadie.') + sordo, 'bueno');
  log(estado, 'La trompa vuelve a encogerse hasta caber en la mano.');
  if (piedras) revelar(estado);
}

// El caldero: un trago y que sea lo que el dado quiera.
function beberCaldero(estado, h, i, elegido) {
  (estado.bebido ||= {})[h.id + ':' + i] = 1;
  sumar(cronH(estado, h.id), 'pociones');
  const eleccion = Math.round(+elegido);
  const dado = eleccion >= 1 && eleccion <= 6 ? eleccion : d6();
  if (dado === eleccion) {
    h.calizPerdido = (h.calizPerdido || 0) + 1;
    h.cuerpoMax = Math.max(1, h.cuerpoMax - 1);
    h.cuerpo = Math.min(h.cuerpo, h.cuerpoMax);
    avisar(estado, h.nombre + ' bebe con el Cáliz Partido y elige su suerte (−1 de cuerpo máximo hasta acabar la misión).', '');
  }
  const n = h.nombre;
  let texto, tono = 'bueno';
  switch (dado) {
    case 1: h.cuerpo = 1; texto = `¡Puaj! ${n} bebe del caldero y es veneno: se queda con 1 de cuerpo.`; tono = 'peligro'; break;
    case 2: h.efectos.calderoDef = -1; texto = `${n} bebe del caldero y se siente flojo. Vulnerable: 1 dado menos de defensa en el próximo ataque que reciba.`; tono = 'peligro'; break;
    case 3: h.efectos.calderoAtq = -1; texto = `${n} bebe del caldero y se le nubla la vista: 1 dado menos en su próximo ataque.`; tono = 'peligro'; break;
    case 4: h.efectos.calderoAtq = 1; texto = `${n} bebe del caldero y siente una fuerza salvaje: +1 dado en su próximo ataque.`; break;
    case 5: h.efectos.calderoDef = 1; texto = `${n} bebe del caldero. Robustez: +1 dado de defensa en el próximo ataque que reciba.`; break;
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
    if (fijo.objeto) darPocion(estado, h, fijo.objeto);
    if (fijo.arma) texto += ' ' + darArma(estado, h, fijo.arma);
    if (fijo.reliquia) texto += ' ' + ganarReliquia(estado, fijo.reliquia);
    ev(estado, { tipo: 'tesoro', heroe: h.id, texto, oro: fijo.oro || 0, objeto: fijo.objeto || fijo.arma || null, especial: !!(fijo.flag || fijo.reliquia) });
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
  if (c.tipo === 'oro') h.oro += c.oro * (estado.mision.maldicion === 'fiebreOro' ? 2 : 1);
  else if (c.tipo === 'pocion') darPocion(estado, h, c.objeto);
  else if (c.tipo === 'flecha' || c.tipo === 'derrumbe') danarHeroe(estado, h, 1);
  else if (c.tipo === 'errante') aparecerErrante(estado, h);

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
    case 'purgatorio': {
      // Combo: los esqueletos aliados que alcanza la luz estallan y dañan a los enemigos de alrededor.
      for (const a of estado.monstruos.filter((x) => x.vivo && x.aliado && NOMUERTOS_COMBO.includes(x.tipo) && T.lineaVision(estado, h.x, h.y, x.x, x.y))) {
        a.vivo = false; ev(estado, { tipo: 'muerte', id: a.id });
        avisar(estado, '¡Combo! La luz hace estallar a ' + a.nombre + ' en esquirlas de hueso.', 'bueno');
        for (const o of estado.monstruos.filter((x) => x.vivo && !x.aliado && Math.max(Math.abs(x.x - a.x), Math.abs(x.y - a.y)) <= 1)) danarMonstruo(estado, o, cuenta(tirarCombate(1), 'calavera') ? 2 : 1);
      }
      const blancos = estado.monstruos.filter((x) => x.vivo && x.visto && !x.aliado && T.lineaVision(estado, h.x, h.y, x.x, x.y));
      for (const x of blancos) {
        const dado = tirarCombate(1);
        const dano = cuenta(dado, 'calavera') ? (x.nomuerto ? 2 : 1) : 0;
        ev(estado, { tipo: 'dados', atacante: h.id, defensor: x.id, ataque: dado, defensa: [], dano, defiende: 'monstruo', etiqueta: 'Purgatorio', magia: true });
        danarMonstruo(estado, x, dano);
      }
      break;
    }
    case 'luzSanadora': if (sinCuras(o)) { avisar(estado, 'La Lanza del mártir rechaza la curación de ' + o.nombre + '.', ''); break; } o.cuerpo = Math.min(o.cuerpoMax, o.cuerpo + 4); delete o.efectos.veneno; break;
    case 'bendicion': o.efectos.bendicion = true; break;
    case 'vendaval': m.efectos.aturdido = true; break;
    case 'vientoVeloz': o.efectos.veloz = true; break;
    case 'espiritu': golpearMonstruo(estado, h, m, 5, hz.nombre); break;
    case 'sanar': case 'balsamo': if (sinCuras(o)) { avisar(estado, 'La Lanza del mártir rechaza la curación de ' + o.nombre + '.', ''); break; } o.cuerpo = Math.min(o.cuerpoMax, o.cuerpo + 4); delete o.efectos.veneno; break;
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
  if (estado.escudo?.heroe === id) { estado.escudo = null; delete h.efectos.muro; }
  estado.turno = { heroe: id, movTirada: null, movRestante: 0, movido: false, accion: false, cargTirada: null, cargRestante: 0, mochila: false };
  if (h.efectos.tiron) { delete h.efectos.tiron; estado.turno.plantado = true; estado.turno.tiron = true; }
  delete h.efectos.furia;
  if (h.efectos.veneno && h.vivo) { avisar(estado, 'El veneno hace efecto: ' + h.nombre + ' pierde 1 de cuerpo.', 'peligro'); danarHeroe(estado, h, 1); }
  // Efectos de subclase que duran «hasta su próximo turno».
  delete h.efectos.provoca; delete h.efectos.bendicion;
  if (estado.santuario?.heroe === id) estado.santuario = null;
  if (h.efectos.agotado) { if (--h.efectos.agotado <= 0) delete h.efectos.agotado; else avisar(estado, h.nombre + ' está agotado tras el Doble tajo: 1 dado de movimiento y −1 de defensa este turno.', ''); }
  if (h.efectos.capa && --h.efectos.capa <= 0) { delete h.efectos.capa; avisar(estado, 'La capa de sombras de ' + h.nombre + ' se desvanece: ya le ven.', ''); }
  if (h.efectos.sombras && --h.efectos.sombras <= 0) { delete h.efectos.sombras; avisar(estado, h.nombre + ' sale de las sombras.', ''); }
  if (h.efectos.oso && --h.efectos.oso <= 0) {
    delete h.efectos.oso; h.cuerpoMax -= 3; h.cuerpo = Math.max(1, Math.min(h.cuerpo, h.cuerpoMax));
    estado.turno.accion = true; estado.turno.plantado = true;
    avisar(estado, h.nombre + ' vuelve a su forma élfica, agotado: pierde este turno.', '');
  }
  if (subclaseDe(h)?.locura && h.cuerpo === 1 && h.vivo) locuraBerserker(estado, h);
  if (h.efectos.aturdidoAlma) { delete h.efectos.aturdidoAlma; estado.turno.accion = true; estado.turno.plantado = true; avisar(estado, h.nombre + ' sigue mareado por el regreso brusco de su alma: pierde el turno.', 'peligro'); }
  if (h.efectos.dominado) turnoDominado(estado, h);
  if (h.ia && !estado.resultado) turnoIA(estado, h);
  const pos = estado.monstruos.find((m) => m.vivo && m.efectos.poseido?.por === id);
  if (pos) estado.turno.poseido = { id: pos.id, restante: pos.tipo === 'golem' ? Math.floor(pos.mov / 2) : pos.mov, ataco: false };
  ev(estado, { tipo: 'turno', heroe: id });
}

function siguienteTurno(estado) {
  if (estado.resultado) return;
  const activos = estado.orden.filter((t) => (estado.heroes[t].vivo && !estado.heroes[t].fuera) || estado.heroes[t].alma);
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
  golpearHeroe, danarHeroe, aparecer, ev, golpeEntreMonstruos, poderEnemigo,
  avisar: (estado, t, tono) => avisar(estado, t, tono)
};

function turnoMonstruos(estado) {
  ev(estado, { tipo: 'fase', fase: 'monstruos' });
  // Los lobos atacan antes que nadie.
  const lista = estado.monstruos.slice().sort((a, b) => (b.tipo === 'lobo') - (a.tipo === 'lobo'));
  for (const m of lista) {
    if (!m.vivo || !m.visto || !m.activo) continue;
    if (m.efectos.veneno) { log(estado, 'El veneno consume a ' + m.nombre + '.', 'golpe'); danarMonstruo(estado, m, 1); if (!m.vivo) continue; }
    if (!Object.values(estado.heroes).some((h) => h.vivo && !h.fuera)) break;
    if (m.efectos.poseido) {
      if (--m.efectos.poseido.rondas <= 0) liberarPosesion(estado, m);
      continue;
    }
    if (m.aliado) { estado._autor = m.aliado.de; try { turnoAliado(estado, m, ctxIA); } finally { delete estado._autor; } continue; }
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
  // Compañeros IA: no siguen sin jugadores. Si salen todos los jugadores, salen con ellos;
  // si han caído todos, la partida se pierde aunque quede algún compañero en pie.
  const humanos = heroes.filter((h) => !h.ia);
  if (!res && humanos.length && heroes.some((h) => h.ia)) {
    if (!humanos.some((h) => h.vivo || h.alma)) res = 'derrota';
    else if (!humanos.some((h) => h.vivo && !h.fuera)) for (const h of dentro) if (h.ia) { h.fuera = true; log(estado, h.nombre + ' sale con el grupo.', 'bueno'); }
  }
  const dentro2 = vivos.filter((h) => !h.fuera);
  if (!res && !dentro2.length) res = vivos.length && requisitosSalida(estado) ? 'victoria' : 'derrota';
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
  if (def.mercader) return 'Esto solo lo vende el mercader errante.';
  if (def.minPiso && !(estado.aleatorio && estado.misionIdx + 1 >= def.minPiso)) return 'Aún no está a la venta: baja hasta el piso ' + def.minPiso + '.';
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
  else if (D.OBJETOS_TIENDA[item]) darPocion(estado, h, item);
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
    const todos = Object.values(estado.heroes);
    if (estado.aleatorio) {
      // Mazmorra Infinita: quien cae pierde la bolsa (el banco se salva); los demás ganan experiencia.
      for (const h of todos) {
        if (!h.vivo && h.oro > 0) { log(estado, h.nombre + ' cayó y pierde las ' + h.oro + ' monedas que llevaba encima.', 'peligro'); h.oro = 0; }
        if (h.vivo && estado.resultado === 'victoria') ganarXP(estado, h, 5 + estado.misionIdx);
      }
    }
    const dificultad = estado.dificultad || 'heroe';
    if (estado.aleatorio && dificultad === 'leyenda') {
      // Leyenda: quien cae, cae para siempre.
      for (const h of todos) if (!h.vivo && !h.caido) { h.caido = true; log(estado, h.nombre + ' ha caído para siempre.', 'peligro'); }
      estado.orden = estado.orden.filter((t) => !estado.heroes[t].caido);
    }
    if (estado.aleatorio && (!todos.some((h) => h.vivo) || !estado.orden.some((t) => !estado.heroes[t].ia))) {
      if (dificultad === 'aventurero' && estado.orden.length) {
        log(estado, 'Despertáis en el campamento, magullados. Tendréis que volver a bajar a este piso.', 'peligro');
        estado.fase = 'armeria';
      } else {
        // Han caído todos: se acaba la partida.
        estado.fase = 'final';
        estado.caida = { piso: estado.misionIdx + 1 };
      }
    } else if (estado.resultado === 'victoria') {
      if (!estado.pruebas) estado.misionIdx++; // la zona de pruebas se repite
      estado.fase = !estado.aleatorio && estado.misionIdx >= estado.campana.length ? 'final' : 'armeria';
    } else estado.fase = 'armeria';
    // La transferencia del banco se recupera al acabar cada misión.
    for (const h of Object.values(estado.heroes)) {
      if (h.caido) continue;
      restaurarCaliz(h); delete h.alma;
      if (h.efectos?.oso) { h.cuerpoMax -= 3; delete h.efectos.oso; }
      // En la Infinita las heridas se arrastran (salvo que descanséis); quien cayó vuelve con la mitad.
      if (estado.aleatorio) h.cuerpo = h.vivo ? Math.max(1, Math.min(h.cuerpo, h.cuerpoMax)) : Math.ceil(h.cuerpoMax / 2);
      else h.cuerpo = h.cuerpoMax;
      h.vivo = true; h.transferido = false;
    }
    estado.votosDescanso = {}; estado.descansado = false;
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
    for (const h of Object.values(estado.heroes)) { restaurarCaliz(h); h.vivo = true; h.fuera = false; h.cuerpo = h.cuerpoMax; h.efectos = {}; }
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
    if (estado.aleatorio) { esconderPieza(estado, def); ponerMurosFragiles(def); ponerExtrasInfinita(estado, def); pisoEspecial(estado, def); }
    estado.votosDescanso = {}; estado.descansado = false;
    iniciarMision(estado, def);
    ev(estado, { tipo: 'pantalla', fase: 'briefing' });
    return null;
  }

  if (!a.heroe || !puedeControlar(estado, jugador, a.heroe)) return 'Ese héroe no es tuyo.';
  const h = estado.heroes[a.heroe];

  if (estado.fase === 'armeria') {
    switch (a.tipo) {
      case 'comprar': return comprar(estado, h, a.item);
      case 'mejorar': return mejorar(estado, h, a.mejora);
      case 'subclase': return elegirSubclase(estado, h, a.subclase);
      case 'descansar': return votarDescanso(estado, jugador);
      case 'purificar': {
        if (!malditaPuesta(h)) return 'No llevas nada maldito.';
        const cura = Object.values(estado.heroes).find((o) => !o.caido && subclaseDe(o)?.luz);
        if (!cura) return 'Hace falta un sacerdote en el grupo (o un altar de la Diosa de la suerte).';
        h.purificada = true;
        avisar(estado, cura.nombre + ' reza sobre ' + D.ARMAS[h.arma].nombre + ': la maldición se rompe. Ya puede quitársela (los −2 de cuerpo siguen mientras la lleve).', 'bueno');
        return null;
      }
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
      if (estado.mision?.maldicion === 'inundado') total = Math.max(1, total - 2);
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
      if (!disp.atacables.includes(a.objetivo) && !(a.alMercader && disp.atacablesNeutros.includes(a.objetivo))) return 'No puedes atacar a ese objetivo.';
      const m = estado.monstruos.find((x) => x.id === a.objetivo);
      usarAccion();
      const torpe = subclaseDe(h)?.torpe && T.adyacentes(h, m) ? -1 : 0;
      const extra = (h.efectos.coraje || 0) + (h.efectos.fuerza || 0) + (h.efectos.calderoAtq || 0) + (h.efectos.grito || 0) + torpe;
      delete h.efectos.coraje; delete h.efectos.fuerza; delete h.efectos.calderoAtq; delete h.efectos.grito;
      if (D.ARMAS[h.arma].pesada) { t.plantado = true; t.movRestante = 0; }
      t.ataco = true;
      golpearMonstruo(estado, h, m, Math.max(1, ataqueHeroe(h) + extra), D.ARMAS[h.arma].nombre, true);
      if (armaDe(h).atraviesa) { const otro = siguienteEnLinea(estado, h, m); if (otro) golpearMonstruo(estado, h, otro, Math.max(1, ataqueHeroe(h) + extra), 'la flecha sigue', true); }
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
    case 'abrirPuerta': {
      const q = disp.puertas.find((x) => x.id === a.puerta) || disp.puertas[0];
      if (!q) return 'No hay ninguna puerta a tu lado.';
      if (q.bloqueada) { avisar(estado, 'La puerta está cerrada a cal y canto. Habrá que encontrar la forma de abrirla.', 'peligro'); break; }
      abrirPuerta(estado, h, estado.puertas.find((x) => x.id === q.id));
      break;
    }
    case 'habilidad': {
      const habs = disp.habilidades || [];
      const hb = habs.find((x) => x.id === a.habilidad) || (habs.length === 1 ? habs[0] : null);
      if (!hb) return 'No tienes esa habilidad.';
      if (!hb.ok) return hb.motivo;
      if (!hb.objetivos.some((o) => o === a.objetivo)) return 'Ese objetivo no vale.';
      const def = listaHabilidades(subclaseDe(h)).find((x) => x.id === hb.id);
      if (!def.sinAccion) usarAccion();
      return usarHabilidad(estado, h, hb.id, a.objetivo);
    }
    case 'moverPoseido': {
      if (!disp.poseido) return 'No controlas a ningún enemigo.';
      return moverPoseido(estado, t, a.x, a.y);
    }
    case 'poderPoseido': {
      const pd = disp.poseido?.poder;
      if (!pd || !pd.objetivos.includes(a.objetivo)) return 'Ese poder no se puede usar así.';
      t.poseido.poder = true;
      return usarPoderPoseido(estado, h, estado.monstruos.find((x) => x.id === t.poseido.id), a.objetivo);
    }
    case 'atacarPoseido': {
      if (!disp.poseido?.atacables.includes(a.objetivo)) return 'No puede atacar a ese.';
      return atacarPoseido(estado, h, t, a.objetivo);
    }
    case 'rezar': {
      if (!disp.altar) return 'No hay ningún altar a tu lado.';
      usarAccion();
      return rezar(estado, h, estado.muebles[disp.altar.idx], a.opcion);
    }
    case 'mercader': {
      if (!disp.mercader) return 'No hay ningún mercader a tu lado.';
      const merc = estado.monstruos.find((m) => m.id === disp.mercader.id);
      if (a.despedir) { despedirMercader(estado, merc, h.nombre + ' le dice al mercader que no le interesa nada.'); return null; }
      const r = tratoMercader(estado, h, merc, a.item, a.robar);
      if (!r && merc.neutral && !merc.mercancia.length) despedirMercader(estado, merc, 'El mercader ha vendido todo.');
      return r;
    }
    case 'reliquia': {
      const rq = disp.reliquias.find((x) => x.id === a.reliquia);
      if (!rq) return 'No tenéis esa reliquia.';
      if (!rq.ok) return rq.motivo;
      return usarReliquia(estado, h, t, a, usarAccion);
    }
    case 'trompa': {
      const ap = disp.trompa?.apoyos.find((x) => x.id === a.apoyo);
      if (!ap) return disp.trompa?.motivo || 'No puedes tocar la trompa ahora.';
      if (a.modo === 'muro' && !ap.muro) return 'No hay ningún muro frágil en esa dirección.';
      usarAccion(); tocarTrompa(estado, h, ap, a.modo); break;
    }
    case 'caldero': {
      if (!disp.calderos.includes(a.caldero)) return 'No puedes beber de ese caldero.';
      if (a.elegido && !estado.reliquias?.caliz) return 'Necesitas el Cáliz Partido para elegir.';
      usarAccion(); beberCaldero(estado, h, a.caldero, a.elegido); break;
    }
    case 'pocion': {
      if (!(h.objetos[a.objeto] > 0)) return 'No tienes esa poción.';
      h.objetos[a.objeto]--;
      sumar(cronH(estado, h.id), 'pociones');
      const n = D.POCIONES[a.objeto].nombre;
      delete h.efectos.veneno;
      if (a.objeto === 'pocionCurar') { const c = d6() * (llevaArmadura(h, 'gloton') ? 2 : 1); h.cuerpo = Math.min(h.cuerpoMax, h.cuerpo + c); avisar(estado, h.nombre + ' bebe ' + n + ' (+' + c + ' de cuerpo).', 'bueno'); }
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
      if (armaDe(h).sed && !t.ataco && h.cuerpo > 1 && monstruosALaVista(estado, h).length) { h.cuerpo--; avisar(estado, 'El Hacha sedienta tiene sed: ' + h.nombre + ' pierde 1 de cuerpo.', 'peligro'); }
      siguienteTurno(estado);
      return null;
    default:
      return 'Acción desconocida.';
  }
  comprobarFin(estado);
  if (!estado.resultado && !h.vivo && !h.alma) siguienteTurno(estado);
  return null;
}
