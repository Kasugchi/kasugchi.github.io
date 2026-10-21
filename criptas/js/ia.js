// =============================================================
//  INTELIGENCIA DE LOS MONSTRUOS
//  Cada monstruo trae en el JSON de la misión su "ia":
//    agresivo  -> va a por el héroe más cercano
//    guardian  -> no sale de su sala; ataca a quien entre
//    centinela -> inmóvil hasta que un disparador lo active
//    lanzador  -> lanza hechizos a distancia y convoca muertos
//  El motor le pasa "ctx" con las funciones de combate.
// =============================================================
import * as T from './tablero.js';
import * as D from './datos.js';
const { clave } = T;

const objetivosDe = (estado) => {
  const lista = Object.values(estado.heroes).filter((h) => h.vivo && !h.fuera && !h.efectos.niebla && !h.efectos.sombras && !h.efectos.capa);
  if (estado.cargador?.vivo) lista.push(estado.cargador); // el cargador también es una presa
  // Los aliados del grupo (muertos alzados, invocaciones) también son presas.
  for (const m of estado.monstruos) if (m.vivo && m.aliado) lista.push(m);
  return lista;
};
// Santuario del sacerdote: nadie puede atacar a los héroes de esa sala.
const protegido = (estado, h) => {
  const s = estado.santuario;
  if (!s || !estado.heroes[h.id]) return false;
  return s.region !== '.' ? h.region === s.region || (T.region(h.x, h.y) === s.region) : Math.max(Math.abs(h.x - s.x), Math.abs(h.y - s.y)) <= 1;
};
// Quien llama la atención (farol encendido o grito de guerra) es el primer objetivo.
// Y a los no muertos les atrae quien lleva el Arco de hueso.
const llamativo = (estado, lista, m) => lista.find((h) => h.id === estado.farol || h.efectos?.provoca)
  || (m?.nomuerto ? lista.find((h) => D.ARMAS[h.arma]?.cebo === 'nomuertos') : undefined);
const masDebil = (lista) => lista.slice().sort((a, b) => a.cuerpo - b.cuerpo)[0];

// Busca el camino más corto hasta una casilla pegada a algún héroe.
function caminoHaciaHeroe(estado, m, objetivos, soloSala) {
  const mapa = T.explorar([m.x, m.y], 80, (c, n) => {
    const [x, y] = n;
    if (T.esRoca(estado, x, y) || T.muebleEn(estado, x, y)) return false;
    if (T.borde(estado, c, n) !== 'libre') return false;
    // Escudo del Último Muro: nadie entra junto al héroe plantado.
    const esc = estado.escudo && estado.heroes[estado.escudo.heroe];
    if (esc && Math.max(Math.abs(esc.x - x), Math.abs(esc.y - y)) <= 1) return false;
    if (soloSala && T.region(x, y) !== m.region) return false;
    return !T.figuraEn(estado, x, y);
  });
  let mejor = null;
  for (const [k, c] of Object.entries(mapa)) {
    const toca = objetivos.filter((h) => T.puedeTocar(estado, c, h));
    if (!toca.length) continue;
    if (!mejor || c.d < mejor.d || (c.d === mejor.d && masDebil(toca).cuerpo < mejor.h.cuerpo)) mejor = { k, d: c.d, h: masDebil(toca) };
  }
  return mejor ? T.reconstruir(mapa, mejor.k) : null;
}

function moverPor(estado, m, ruta, pasos, ctx) {
  const tramo = ruta.slice(0, pasos + 1);
  if (tramo.length < 2) return;
  const [x, y] = tramo[tramo.length - 1];
  m.x = x; m.y = y;
  ctx.ev(estado, { tipo: 'mover', id: m.id, ruta: tramo });
}

function atacarSiPuede(estado, m, ctx) {
  const pegados = objetivosDe(estado).filter((h) => T.puedeTocar(estado, m, h) && !protegido(estado, h));
  if (!pegados.length) return false;
  const v = llamativo(estado, pegados, m) || masDebil(pegados);
  if (v.aliado) ctx.golpeEntreMonstruos(estado, m, v);
  else ctx.golpearHeroe(estado, m, v, m.ataque);
  return true;
}

// ---------- Hechizos del lanzador ----------
function intentarHechizo(estado, m, ctx) {
  if (!m.hechizos.length) return false;
  const objetivos = objetivosDe(estado);
  const herido = m.cuerpo <= Math.ceil(m.cuerpoMax / 2);
  const i = m.hechizos.indexOf('invocar');
  if (herido && i >= 0) {
    m.hechizos.splice(i, 1);
    ctx.ev(estado, { tipo: 'hechizoMonstruo', id: m.id, hechizo: 'invocar' });
    ctx.avisar(estado, m.nombre + ' alza las manos: ¡los muertos se levantan a su alrededor!', 'peligro');
    let n = 0;
    for (const [dx, dy] of T.DIRS8) {
      if (n >= 2) break;
      const s = ctx.aparecer(estado, { tipo: 'esqueleto', x: m.x + dx, y: m.y + dy, ia: 'agresivo' });
      if (s) { s.visto = true; n++; }
    }
    return true;
  }
  const j = m.hechizos.indexOf('rayo');
  if (j < 0) return false;
  const visibles = objetivos.filter((h) => !h.aliado && !protegido(estado, h) && !T.puedeTocar(estado, m, h) && T.lineaVision(estado, m.x, m.y, h.x, h.y, true));
  if (!visibles.length) return false;
  m.hechizos.splice(j, 1);
  const h = masDebil(visibles);
  ctx.ev(estado, { tipo: 'hechizoMonstruo', id: m.id, hechizo: 'rayo', objetivo: h.id });
  ctx.golpearHeroe(estado, m, h, 3, 'Rayo sombrío');
  return true;
}

// Aliados del grupo: van a por el monstruo enemigo más cercano.
export function turnoAliado(estado, m, ctx) {
  if (--m.aliado.turnos < 0) {
    m.vivo = false;
    ctx.ev(estado, { tipo: 'muerte', id: m.id });
    ctx.avisar(estado, m.nombre + ' se deshace en polvo.', '');
    return;
  }
  // Si su amo ya lo ha dirigido esta ronda, no actúa por su cuenta.
  if (m.aliado.dirigido === estado.ronda) return;
  const enemigos = estado.monstruos.filter((o) => o.vivo && o.visto && !o.aliado && !o.neutral);
  const pegado = enemigos.find((o) => T.puedeTocar(estado, m, o));
  if (pegado) return ctx.golpeEntreMonstruos(estado, m, pegado);
  const ruta = caminoHaciaHeroe(estado, m, enemigos, false);
  if (!ruta) return;
  moverPor(estado, m, ruta, m.mov, ctx);
  const ahora = enemigos.find((o) => o.vivo && T.puedeTocar(estado, m, o));
  if (ahora) ctx.golpeEntreMonstruos(estado, m, ahora);
}

export function turnoMonstruo(estado, m, ctx) {
  if (m.neutral) return; // el mercader no pelea… mientras nadie le moleste
  const ef = m.efectos;
  if (ef.dormido) return;
  if (ef.aturdido) { delete ef.aturdido; ctx.avisar(estado, m.nombre + ' sigue aturdido y pierde el turno.'); return; }
  const inmovil = ef.raices > 0;
  if (inmovil) ef.raices--;

  const objetivos = objetivosDe(estado);
  if (!objetivos.length) return;

  // 0) Poder propio (curar, alzar muertos, crear ilusiones…): puede gastar el turno.
  if (ctx.poderEnemigo && ctx.poderEnemigo(estado, m)) return;

  // 1) Si ya está pegado a un héroe, ataca sin moverse.
  if (atacarSiPuede(estado, m, ctx)) return;

  // 2) El lanzador prefiere la magia a distancia.
  if (m.ia === 'lanzador' && intentarHechizo(estado, m, ctx)) return;

  // 3) Moverse hacia el héroe más cercano (el guardián, sin salir de su sala).
  if (inmovil) return;
  const soloSala = m.ia === 'guardian' || m.ia === 'lanzador';
  // Farol de los Ahogados o grito de guerra: si lo ve, va a por él.
  const farol = llamativo(estado, objetivos, m);
  const haciaFarol = farol && T.lineaVision(estado, m.x, m.y, farol.x, farol.y) && caminoHaciaHeroe(estado, m, [farol], soloSala);
  const ruta = haciaFarol || caminoHaciaHeroe(estado, m, objetivos, soloSala);
  if (!ruta) return;
  moverPor(estado, m, ruta, m.mov, ctx);

  // 4) Y si ha llegado, ataca.
  atacarSiPuede(estado, m, ctx);
}
