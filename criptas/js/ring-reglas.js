// =============================================================
//  LAS REGLAS DEL RING (sin pantalla ni escena): lo que vale cada pieza, cuántos dados
//  se tiran, quién esquiva, la IA de los rivales, el Desguace (robots al azar, reglas raras)
//  y el vertedero (redes, huir, arreglos). ring.js las usa para pelear y pintar.
//  MESA.regla: la regla rara de la pelea en curso (la pone ring.js al montar la pelea).
// =============================================================
import { NUCLEOS, PIEZAS, HUECOS_ROBOT, MODELOS, ELEMENTOS, RUFO_HACE, juegoDe, extraNivel } from './robots.js';

export const HUECOS = ['cabeza', 'brazoI', 'brazoD', 'piernas'];
export const MESA = { regla: null };
// Las piezas se pueden tener repetidas (R.piezas lleva una entrada por copia): para llevar la misma
// en los dos brazos hacen falta dos. Una de cada pieza de serie no se pierde nunca.
export const cuantas = (R, id) => R.piezas.filter((x) => x === id).length;
export const usadas = (R, id, sin = null) => HUECOS.filter((h) => h !== sin && R.equipo[h] === id).length;
export const DE_SERIE = { cabeza: 'cab_lata', brazoI: 'br_puno', brazoD: 'br_canon', piernas: 'pi_patas' };
// Deja el equipo bien: nada puesto más veces de las que lo tienes (arregla también los robots de antes de este cambio)
export function arreglarEquipo(R) {
  for (const id of Object.values(DE_SERIE)) if (!R.piezas.includes(id)) R.piezas.push(id);
  let cambio = false;
  for (const h of HUECOS) {
    const id = R.equipo[h], tipo = HUECOS_ROBOT[h].tipo;
    if (PIEZAS[id]?.hueco === tipo && usadas(R, id, h) < cuantas(R, id)) continue;
    R.equipo[h] = [...new Set(R.piezas)].find((x) => PIEZAS[x]?.hueco === tipo && usadas(R, x, h) < cuantas(R, x)) || DE_SERIE[h];
    cambio = true;
  }
  return cambio;
}
export function quitarUna(R, id) { const k = R.piezas.indexOf(id); if (k >= 0) R.piezas.splice(k, 1); arreglarEquipo(R); }
export const vidaPieza = (id, nucleo) => (PIEZAS[id]?.vida || 1) + (nucleo === 'tortuga' ? 1 : 0);
export function textoPieza(P, nucleo) {
  const v = `❤ ${P.vida + (nucleo === 'tortuga' ? 1 : 0)}`;
  const m = P.modelo ? ` · ${MODELOS[P.modelo].e}` : '';
  if (P.hueco === 'piernas') return `${v} · esquiva ${P.def} · rapidez ${P.vel}${m}`;
  if (!P.acc) return `${v} · aguanta más${m}`;
  const a = P.acc, q = { golpe: `${a.v} dados de golpe${a.certero ? ', no se esquiva' : ''}`, disparo: `${a.v} dados de disparo${a.certero ? ', no se esquiva' : ''}`, cura: `repara ${a.v}`, escudo: `para ${a.v}`, apuntar: `+${a.v} dados al siguiente` }[a.tipo];
  return `${v} · ${a.e} ${q}${a.usos ? ` (${a.usos} veces)` : ''}${a.piernas ? ', +1 a las piernas' : ''}${a.el ? ` · ${ELEMENTOS[a.el].e} ${ELEMENTOS[a.el].n}` : ''}${P.modelo ? ` · ${MODELOS[P.modelo].e}` : ''}`;
}
export function luchador(spec, i, lado, ctrl) {
  const piezas = {}, juego = juegoDe(spec.equipo)?.juego || {};
  for (const h of HUECOS) {
    const id = spec.equipo[h], max = vidaPieza(id, spec.nucleo) + (spec.vidaExtra || 0) + (juego.vida || 0);
    piezas[h] = { id, P: PIEZAS[id], max, vida: spec.vidas?.[h] != null ? Math.max(1, Math.min(max, spec.vidas[h])) : max };   // en el Desguace, como acabó la ronda anterior
  }
  const usos = {}; for (const h of HUECOS) if (piezas[h].P.acc?.usos) usos[h] = piezas[h].P.acc.usos;
  return { ...spec, piezas, usos, juego, extra: spec.dados ?? extraNivel(spec.nivel), escudo: 0, apunta: 0, i, lado, ctrl, robot: null };
}
export const viva = (L, h) => L.piezas[h].vida > 0;
export const fuera = (L) => !viva(L, 'cabeza');
export const velocidad = (L) => (viva(L, 'piernas') ? L.piezas.piernas.P.vel + (L.juego?.rapidez || 0) : 0);
// La esquiva sale de las piernas; la cabeza, además, se aparta con el cuello (+1)
export const esquiva = (L, obj = null) => Math.max(0, (viva(L, 'piernas') ? L.piezas.piernas.P.def + (L.juego?.esquiva || 0) : 0) + (obj === 'cabeza' ? 1 : 0) - (MESA.regla === 'aceite' ? 1 : 0));
// ¿Le pilla de lleno? (el ataque es del tipo que el alma del otro no aguanta)
export const eficaz = (a, D) => !!(a?.el && D && NUCLEOS[D.nucleo]?.debil === a.el);
export const CABEZAZO = { tipo: 'golpe', n: 'Cabezazo', e: '🤕', v: 1 };
export function acciones(L) {
  const l = [];
  for (const h of ['brazoD', 'brazoI', 'cabeza']) { const a = L.piezas[h].P.acc; if (a && viva(L, h) && (L.usos[h] ?? 1) > 0) l.push({ h, a }); }
  if (!l.some((x) => ['golpe', 'disparo'].includes(x.a.tipo))) l.push({ h: null, a: CABEZAZO });   // sin armas, a cabezazos
  return l;
}
export const buscarAccion = (L, h) => acciones(L).find((x) => (x.h ?? '-') === (h ?? '-'));
export const esApoyo = (a) => ['cura', 'escudo', 'apuntar'].includes(a.tipo);
export function dadosDe(A, a, objetivo, D = null) {
  let n = a.v + A.extra + (A.nucleo === 'escarabajo' && a.tipo === 'disparo' ? 1 : 0) + (A.nucleo === 'mantis' && a.tipo === 'golpe' ? 1 : 0) + A.apunta;
  if ((MESA.regla === 'tormenta' && a.tipo === 'disparo') || (MESA.regla === 'furia' && a.tipo === 'golpe')) n++;
  if (a.tipo === 'golpe' || a.tipo === 'disparo') n += (A.juego?.[a.tipo] || 0) + (eficaz(a, D) ? 1 : 0);
  if (objetivo === 'cabeza' && !a.certero && A.nucleo !== 'buho' && !A.apunta) n -= 1;   // la cabeza es pequeña: cuesta más darle
  return Math.max(1, n);
}
export const CARAS = ['calavera', 'calavera', 'calavera', 'escudoB', 'escudoB', 'escudoN'];   // las del dado de combate
export const caras = (n) => Array.from({ length: n }, () => CARAS[Math.floor(Math.random() * CARAS.length)]);
export function decisionIA(A, enemigos) {
  const l = acciones(A), curas = l.find((x) => x.a.tipo === 'cura'), herida = HUECOS.find((h) => viva(A, h) && A.piezas[h].vida <= A.piezas[h].max * .4);
  if (curas && herida) return { h: curas.h };
  const esc_ = l.find((x) => x.a.tipo === 'escudo'); if (esc_ && !A.escudo && A.piezas.cabeza.vida <= A.piezas.cabeza.max * .5 && Math.random() < .5) return { h: esc_.h };
  const ap = l.find((x) => x.a.tipo === 'apuntar'); if (ap && !A.apunta && Math.random() < .35) return { h: ap.h };
  const ataques = l.filter((x) => ['golpe', 'disparo'].includes(x.a.tipo)).sort((x, y) => y.a.v - x.a.v);
  const acc = ataques[Math.random() < .7 ? 0 : Math.floor(Math.random() * ataques.length)];
  // a por el que tenga la cabeza más tocada (y a veces, a por cualquiera)
  const ene = [...enemigos].sort((x, y) => x.piezas.cabeza.vida - y.piezas.cabeza.vida), D = Math.random() < .7 ? ene[0] : ene[Math.floor(Math.random() * ene.length)];
  // a por la cabeza si está tocada; si no, a desarmarte (el brazo que más pega); y a veces, lo que le da la gana
  const vivas = HUECOS.filter((h) => viva(D, h));
  let obj = D.piezas.cabeza.vida <= dadosDe(A, acc.a, 'cabeza', D) * .5 ? 'cabeza' : ['brazoD', 'brazoI'].filter((h) => viva(D, h) && D.piezas[h].P.acc).sort((x, y) => (D.piezas[y].P.acc?.v || 0) - (D.piezas[x].P.acc?.v || 0))[0] || 'cabeza';
  if (Math.random() < .25) obj = vivas[Math.floor(Math.random() * vivas.length)];
  return { h: acc.h, d: D.i, obj };
}
export const REGLAS = {
  tormenta: { e: '⛈️', n: 'Tormenta eléctrica', t: 'los disparos tiran 1 dado más.' },
  furia: { e: '😤', n: 'Público con ganas de sangre', t: 'los golpes tiran 1 dado más.' },
  aceite: { e: '🛢️', n: 'Suelo con aceite', t: 'todos esquivan con 1 dado menos.' },
  oxido: { e: '🟫', n: 'Lluvia ácida', t: 'todas las piezas empiezan con 1 menos.' }
};
export const azar = (l) => l[Math.floor(Math.random() * l.length)];
export const NOMBRE_A = ['Tuerca', 'Chispa', 'Botijo', 'Cazo', 'Grifo', 'Zumbador', 'Sartén', 'Tostón', 'Cafetera', 'Petardo', 'Cacerola', 'Molinillo', 'Ventilador', 'Bisagra', 'Farolillo'];
export const NOMBRE_B = ['Loco', 'III', 'Oxidado', 'Turbo', 'de Hojalata', 'Mk 2', 'el Breve', 'Furioso', 'de Feria', 'Sin Frenos', 'Deluxe', 'de Segunda Mano', 'Pocholo', 'el Terrible'];
export const PILOTOS = ['Un forastero', 'La Tía Bisagra', 'El Hermano Engranaje', 'Doña Remache', 'El Niño del Taller', 'Paco Pistones', 'La Señora Voltio', 'El Afilador', 'Un tipo con gafas de soldar', 'La Sobrina de Rufo'];
export const FRASES_D = ['¡Lo hice con una lavadora y mucha fe!', 'Bip. Bup. Prepárate.', 'Mi robot no tiene frenos. Ni ganas de tenerlos.', '¿Eso es un robot o una tostadora con ambición?', 'He venido desde muy lejos para perder… ¡digo, para ganar!', 'Si gano, me quedo tus tornillos.', 'No lo mires a los ojos. Bueno, al ojo.', 'Funciona con pilas. Y con rencor.'];
export const JEFES = [['El Compactador', 'El dueño del desguace', 'Todo lo que entra aquí sale cuadradito.'], ['Mamá Grúa', 'La gruista', 'Os voy a levantar… del suelo, y luego no.'], ['La Trituradora', 'El encargado', 'Ñam. Ñam. Chatarra.']];
export function robotAzar(ronda, jefe) {
  // al principio, piezas de andar por casa; las de Rufo (las mejores), a partir de la cuarta
  const fuertes = ['br_remache', 'cab_antena', 'pi_arana'], deRufo = Object.keys(RUFO_HACE);
  const de = (hueco) => Object.keys(PIEZAS).filter((id) => PIEZAS[id].hueco === hueco && (ronda >= 4 || !deRufo.includes(id)) && (ronda >= 3 || !fuertes.includes(id)));
  const ataques = de('brazo').filter((id) => ['golpe', 'disparo'].includes(PIEZAS[id].acc?.tipo));
  const [jn, jp, jf] = jefe ? azar(JEFES) : [];
  return {
    nombre: jefe ? jn : `${azar(NOMBRE_A)} ${azar(NOMBRE_B)}`, piloto: jefe ? jp : azar(PILOTOS), frase: jefe ? jf : azar(FRASES_D),
    nucleo: azar(Object.keys(NUCLEOS)), nivel: ronda,
    equipo: { cabeza: azar(de('cabeza')), brazoI: azar(de('brazo')), brazoD: azar(ataques), piernas: azar(de('piernas')) },
    vidaExtra: Math.floor((ronda - 1) / 2) + (jefe ? 2 : 0), dados: Math.floor((ronda - 1) / 3) + (jefe ? 1 : 0)
  };
}
export const REDES = {
  cuerda: { n: 'Red de cuerda', e: '🕸️', b: 0, oro: 10 },
  acero: { n: 'Red de acero', e: '⛓️', b: .15, oro: 25 },
  rayo: { n: 'Red eléctrica', e: '⚡', b: .3, oro: 50 }
};
export function probCaptura(D, red) {
  const c = D.piezas.cabeza, rotas = HUECOS.filter((h) => h !== 'cabeza' && !viva(D, h)).length;
  return Math.max(.05, Math.min(.95, .15 + (REDES[red]?.b || 0) + .55 * (1 - c.vida / c.max) + .08 * rotas - .02 * ((D.nivel || 1) - 1)));
}
export const probHuir = (A) => Math.min(.9, .45 + .08 * velocidad(A));
export const costeArreglo = (id) => { const P = PIEZAS[id]; return { oro: 8 + 3 * P.vida + 4 * (P.acc?.v || 0) + 3 * (P.def || 0), chatarra: 1 + (P.acc ? 1 : 0) }; };
