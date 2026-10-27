// =============================================================
//  MAZMORRA PERDIDA: generador de misiones aleatorias
//
//  generarMision(semilla, nivel) devuelve un JSON con el mismo formato
//  que las misiones escritas a mano (misiones/*.json), así que el motor,
//  la IA, la vista 3D y la crónica funcionan igual.
//
//  Con la misma semilla sale siempre la misma mazmorra.
//  Pasos: salas y puertas → distancias → objetivo → muebles →
//  monstruos (más duros cuanto más lejos) → trampas → tesoros → textos.
//  Cada mazmorra se valida (todo alcanzable, nada tapa nada); si falla,
//  se vuelve a intentar con la siguiente tirada.
// =============================================================
import * as D from './datos.js';
import * as T from './tablero.js';

// ---------- Azar con semilla ----------
function hash(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; };
}
function azar(semilla) {
  let a = hash(String(semilla))();
  const r = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.int = (n) => Math.floor(r() * n);
  r.de = (lista) => lista[r.int(lista.length)];
  r.entre = (a2, b) => a2 + r.int(b - a2 + 1);
  r.prob = (p) => r() < p;
  r.barajar = (l) => { const c = l.slice(); for (let i = c.length - 1; i > 0; i--) { const j = r.int(i + 1); [c[i], c[j]] = [c[j], c[i]]; } return c; };
  r.pesos = (obj) => { const tot = Object.values(obj).reduce((s, v) => s + v, 0); let x = r() * tot; for (const [k, v] of Object.entries(obj)) { x -= v; if (x < 0) return k; } return Object.keys(obj)[0]; };
  return r;
}
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const nuevaSemilla = () => Array.from({ length: 5 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');
export const semillaDeNivel = (semilla, nivel) => semilla + '-' + nivel;

// ---------- Geometría del plano ----------
// Salas y pasillos del plano activo. Se calculan una vez por plano.
const k = (x, y) => x + ',' + y;
let SALAS = {}, PASILLO = [];
const geometrias = new Map();
function prepararGeometria() {
  const id = D.TABLERO;
  if (geometrias.has(id)) { ({ SALAS, PASILLO } = geometrias.get(id)); return; }
  const out = {};
  for (let y = 0; y < D.ALTO; y++) for (let x = 0; x < D.ANCHO; x++) {
    const r = T.region(x, y);
    if (!r || r === '.') continue;
    (out[r] ||= { id: r, celdas: [] }).celdas.push([x, y]);
  }
  for (const s of Object.values(out)) {
    const xs = s.celdas.map((c) => c[0]), ys = s.celdas.map((c) => c[1]);
    Object.assign(s, { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) });
    s.area = s.celdas.length;
    // Huecos de 2x2 para la escalera.
    s.huecos2 = s.celdas.filter(([x, y]) => [[1, 0], [0, 1], [1, 1]].every(([dx, dy]) => T.region(x + dx, y + dy) === s.id));
    // Bordes con el pasillo y con otras salas (sitios posibles para puertas).
    s.bordesPasillo = []; s.bordesSala = {};
    for (const [x, y] of s.celdas) for (const [dx, dy] of T.DIRS) {
      const nx = x + dx, ny = y + dy;
      if (!T.dentro(nx, ny)) continue;
      const r = T.region(nx, ny);
      if (r === '.') s.bordesPasillo.push([[x, y], [nx, ny]]);
      else if (r !== s.id) (s.bordesSala[r] ||= []).push([[x, y], [nx, ny]]);
    }
  }
  const pas = [];
  for (let y = 0; y < D.ALTO; y++) for (let x = 0; x < D.ANCHO; x++) if (T.region(x, y) === '.') pas.push([x, y]);
  geometrias.set(id, { SALAS: out, PASILLO: pas });
  ({ SALAS, PASILLO } = geometrias.get(id));
}
// Qué planos salen en cada zona de la Mazmorra Infinita (con su peso).
export const PLANOS_ZONA = {
  cuevas: { clasico: 2, cuevas: 3, barco: 1 },
  catacumbas: { clasico: 2, cripta: 3, cuevas: 1 },
  fortaleza: { clasico: 1, fortaleza: 3, torre: 1 },
  abismo: { clasico: 1, torre: 3, cripta: 1, fortaleza: 1, barco: 1 }
};

// ---------- Contenido según el tema ----------
const TEMAS = {
  orcos:   { nombre: ['la Guarida', 'la Madriguera', 'el Fortín', 'el Cubil'], monstruos: { trasgo: 4, orco: 4, guerrero: 1, chaman: 1, bestias: 1 }, errante: 'orco', salas: ['cuartel', 'guardia', 'despensa', 'tesoro', 'forja'] },
  muertos: { nombre: ['la Cripta', 'el Osario', 'las Catacumbas', 'el Mausoleo'], monstruos: { esqueleto: 4, zombi: 3, momia: 2, sacerdotisa: 1, bruja: 1 }, errante: 'esqueleto', salas: ['cripta', 'cripta', 'biblioteca', 'capilla', 'tesoro'] },
  mixto:   { nombre: ['la Mazmorra', 'las Ruinas', 'las Galerías', 'los Sótanos'], monstruos: { trasgo: 3, orco: 3, esqueleto: 3, zombi: 2, guerrero: 1, ilusionista: 1, ojo: 1 }, errante: 'orco', salas: ['cuartel', 'cripta', 'biblioteca', 'alquimia', 'guardia', 'tesoro'] },
  oscuro:  { nombre: ['el Santuario', 'la Torre Hundida', 'el Templo', 'el Abismo'], monstruos: { esqueleto: 2, guerrero: 3, momia: 2, gargola: 1, orco: 2, ojo: 1, golem: 1, ilusionista: 1 }, errante: 'guerrero', salas: ['capilla', 'alquimia', 'biblioteca', 'cripta', 'tortura'] }
};
// Zonas por profundidad: cambian qué mazmorras salen, el color del suelo y el ambiente.
export const ZONAS = [
  { id: 'cuevas', nombre: 'Cuevas de los orcos', desde: 1, temas: { orcos: 6, mixto: 2 } },
  { id: 'catacumbas', nombre: 'Catacumbas', desde: 6, temas: { muertos: 6, mixto: 2 } },
  { id: 'fortaleza', nombre: 'Fortaleza del caos', desde: 11, temas: { oscuro: 6, mixto: 1 } },
  { id: 'abismo', nombre: 'El Abismo', desde: 16, temas: { oscuro: 3, muertos: 2, orcos: 2 } }
];
export const zonaDe = (nivel) => ZONAS.filter((z) => nivel >= z.desde).pop();
const COSTE = { trasgo: 1, esqueleto: 1, orco: 2, zombi: 2, momia: 3, guerrero: 3, gargola: 4, chaman: 3, bestias: 4, sacerdotisa: 3, bruja: 3, ilusionista: 3, ojo: 2, golem: 5 };
// Los de poder solo salen a partir de cierta profundidad.
const NIVEL_MIN = { chaman: 2, bestias: 3, sacerdotisa: 2, bruja: 3, ilusionista: 3, ojo: 2, golem: 5 };
// Muebles por tipo de sala: [tipo, ancho, alto]
const MUEBLES_SALA = {
  cuartel: [['mesa', 3, 2], ['chimenea', 3, 1], ['cofre', 1, 1]],
  guardia: [['armero', 3, 1], ['mesa', 2, 1]],
  despensa: [['mesa', 2, 2], ['caldero', 1, 1], ['cofre', 1, 1]],
  tesoro: [['cofre', 1, 1], ['cofre', 1, 1], ['estanteria', 2, 1]],
  forja: [['chimenea', 3, 1], ['armero', 2, 1], ['mesa', 2, 1]],
  cripta: [['sarcofago', 2, 2], ['sarcofago', 1, 2], ['altar', 1, 1]],
  biblioteca: [['estanteria', 3, 1], ['estanteria', 3, 1], ['mesa', 2, 1]],
  capilla: [['altar', 2, 2], ['estanteria', 2, 1]],
  alquimia: [['alquimista', 3, 2], ['caldero', 1, 1], ['estanteria', 2, 1]],
  tortura: [['potro', 2, 2], ['chimenea', 2, 1], ['cofre', 1, 1]],
  trono: [['trono', 1, 1], ['mesa', 3, 2], ['cofre', 1, 1]],
  celda: [['potro', 2, 1], ['chimenea', 2, 1]],
  vacia: []
};

// ---------- Nombres ----------
const SIL_A = ['Kar', 'Mor', 'Vel', 'Grak', 'Zul', 'Dra', 'Ul', 'Thar', 'Bel', 'Nok', 'Sar', 'Vor', 'Ezh', 'Gul', 'Rhe'];
const SIL_B = ['gul', 'dak', 'mor', 'eth', 'vane', 'rok', 'zar', 'ith', 'ash', 'gor', 'lun', 'drek', 'ul', 'osh'];
const nombrePropio = (r) => r.de(SIL_A) + r.de(SIL_B);
const RELIQUIAS = ['el Cáliz de Ceniza', 'el Ojo de Ámbar', 'la Corona Rota', 'el Cuerno de Hueso', 'la Lámpara Eterna', 'el Códice Negro', 'la Daga de Sal'];
const PRISIONEROS = ['el hermano Odo', 'la exploradora Lys', 'el escriba Tamsin', 'la capitana Ruva', 'el aprendiz Pell'];
const APODOS_JEFE = { orco: 'el Caudillo', momia: 'el Rey Momia', hechicero: 'el Nigromante', guerrero: 'el Caballero Negro', gargola: 'el Guardián de Piedra' };

// =============================================================
//  GENERADOR
// =============================================================
// plano: fuerza un plano (nombre de js/planos.js); si no, lo elige la zona.
export function generarMision(semilla, nivel = 1, plano = null) {
  const r = azar(semilla);
  const zona = zonaDe(nivel);
  const nombrePlano = plano || r.pesos(PLANOS_ZONA[zona.id] || { clasico: 1 });
  T.usarPlano(nombrePlano);
  prepararGeometria();
  for (let intento = 0; intento < 60; intento++) {
    const m = intentar(r, semilla, nivel);
    if (m) m.plano = nombrePlano;
    if (m && !validar(m)) return m;
  }
  throw new Error('No se pudo generar la mazmorra ' + semilla);
}

function intentar(r, semilla, nivel) {
  const zona = zonaDe(nivel);
  const nombreTema = r.pesos(zona.temas);
  const tema = TEMAS[nombreTema];
  const objetivoTipo = nivel <= 1 ? r.de(['jefe', 'reliquia']) : r.pesos({ jefe: 3, reliquia: 2, rescate: 2, sellos: nivel >= 2 ? 2 : 0, escapar: 2 });

  // ---------- Salas ----------
  const todas = Object.keys(SALAS);
  const conHueco = todas.filter((s) => SALAS[s].huecos2.length && SALAS[s].bordesPasillo.length);
  const pequenas = conHueco.filter((s) => SALAS[s].area <= 20);
  const inicio = r.de(pequenas.length ? pequenas : conHueco);
  // La huida contrarreloj va en un mapa más pequeño: con malas tiradas no se hace imposible.
  const nSalas = objetivoTipo === 'escapar' ? 4 + r.int(2) : Math.min(todas.length - 1, 6 + Math.min(3, Math.floor(nivel / 2)) + r.int(2));
  const elegidas = [inicio, ...r.barajar(todas.filter((s) => s !== inicio)).slice(0, nSalas - 1)];
  const usadas = new Set(elegidas);

  // ---------- Escalera (2x2 dentro de la sala de inicio) ----------
  const si = SALAS[inicio];
  const [ex, ey] = r.de(si.huecos2);
  const escalera = [[ex, ey], [ex + 1, ey], [ex, ey + 1], [ex + 1, ey + 1]];
  const ocupado = new Map(); // casilla -> qué hay
  for (const [x, y] of escalera) ocupado.set(k(x, y), 'escalera');

  // ---------- Puertas ----------
  const puertas = [];
  const nuevaPuerta = (borde, extra = {}) => {
    const p = { id: 'p' + (puertas.length + 1), a: borde[0], b: borde[1], ...extra };
    puertas.push(p);
    return p;
  };
  const bordeLibre = (b) => !puertas.some((p) => T.claveBorde(p.a, p.b) === T.claveBorde(b[0], b[1])) && !ocupado.has(k(...b[0]));
  for (const s of elegidas) {
    const n = SALAS[s].area >= 20 && r.prob(0.45) ? 2 : 1;
    const cand = r.barajar(SALAS[s].bordesPasillo.filter(bordeLibre));
    for (let i = 0; i < n && i < cand.length; i++) nuevaPuerta(cand[i]);
  }
  // Algunas salas vecinas se comunican directamente.
  for (const s of elegidas) for (const [vecina, bordes] of Object.entries(SALAS[s].bordesSala)) {
    if (s < vecina && usadas.has(vecina) && r.prob(0.3)) { const b = r.de(bordes.filter(bordeLibre)); if (b) nuevaPuerta(b); }
  }

  // ---------- Rocas: cortan algún pasillo para dar forma al recorrido ----------
  const rocas = [];
  const nRocas = r.entre(2, 5);
  const junto = (c, lista) => lista.some((p) => Math.abs(p[0] - c[0]) + Math.abs(p[1] - c[1]) <= 1);
  for (let i = 0; i < 30 && rocas.length < nRocas; i++) {
    const c = r.de(PASILLO);
    if (ocupado.has(k(...c)) || junto(c, puertas.flatMap((p) => [p.a, p.b]))) continue;
    rocas.push(c); ocupado.set(k(...c), 'roca');
    const m = { escalera: [ex, ey], rocas, puertas, muebles: [] };
    if (!salasAlcanzables(m, elegidas, { secretas: false, bloqueadas: true })) { rocas.pop(); ocupado.delete(k(...c)); }
  }

  // ---------- Distancias desde la escalera ----------
  const base = { escalera: [ex, ey], rocas, puertas, muebles: [] };
  const dist = distancias(base, { secretas: true, bloqueadas: true });
  const distSala = {};
  for (const s of elegidas) distSala[s] = Math.min(...SALAS[s].celdas.map(([x, y]) => dist[k(x, y)] ?? 999));
  if (elegidas.some((s) => distSala[s] >= 999)) return null;
  const porDistancia = elegidas.filter((s) => s !== inicio).sort((a, b) => distSala[a] - distSala[b]);
  const salaObj = porDistancia[porDistancia.length - 1];
  const rango = Object.fromEntries(porDistancia.map((s, i) => [s, i + 1]));

  // La sala del objetivo con llave: una sola puerta, al pasillo, cerrada.
  const conLlave = objetivoTipo === 'rescate' || objetivoTipo === 'sellos';
  let puertaObj = null;
  if (conLlave) {
    const suyas = puertas.filter((p) => T.region(...p.a) === salaObj || T.region(...p.b) === salaObj);
    const alPasillo = suyas.filter((p) => T.region(...p.a) === '.' || T.region(...p.b) === '.');
    if (!alPasillo.length) return null;
    puertaObj = alPasillo[0];
    for (const p of suyas) if (p !== puertaObj) puertas.splice(puertas.indexOf(p), 1);
    puertaObj.id = 'sellada';
    puertaObj.bloqueada = true;
  }

  // Puerta secreta: un atajo extra (nunca la única entrada).
  if (r.prob(0.6)) {
    const cand = elegidas.filter((s) => s !== salaObj && s !== inicio);
    const s = cand.length ? r.de(cand) : null;
    const b = s && r.de([...SALAS[s].bordesPasillo, ...Object.entries(SALAS[s].bordesSala).filter(([v]) => usadas.has(v) && v !== salaObj).flatMap(([, bs]) => bs)].filter(bordeLibre));
    if (b) nuevaPuerta(b, { id: 'secreta', secreta: true });
  }

  // ---------- Tipos de sala y muebles ----------
  const tipoSala = {};
  for (const s of elegidas) tipoSala[s] = s === inicio ? 'vacia' : r.de(tema.salas);
  tipoSala[salaObj] = objetivoTipo === 'rescate' ? 'celda' : objetivoTipo === 'jefe' || objetivoTipo === 'sellos' ? (nombreTema === 'muertos' ? 'cripta' : 'trono') : 'capilla';
  const muebles = [];
  const celdaPuerta = new Set(puertas.flatMap((p) => [k(...p.a), k(...p.b)]));
  for (const s of elegidas) {
    for (const [tipo, w0, h0] of MUEBLES_SALA[tipoSala[s]]) {
      const [w, h] = r.prob(0.5) ? [w0, h0] : [h0, w0];
      const sitio = colocarMueble(r, s, w, h, ocupado, celdaPuerta);
      if (!sitio) continue;
      const u = { tipo, x: sitio[0], y: sitio[1], w, h };
      muebles.push(u);
      for (let yy = u.y; yy < u.y + h; yy++) for (let xx = u.x; xx < u.x + w; xx++) ocupado.set(k(xx, yy), 'mueble');
    }
  }

  // ---------- Monstruos ----------
  const monstruos = [];
  let nId = 0;
  const libresDe = (s) => r.barajar(SALAS[s].celdas.filter(([x, y]) => !ocupado.has(k(x, y)) && !celdaPuerta.has(k(x, y))));
  const poner = (spec) => { monstruos.push(spec); ocupado.set(k(spec.x, spec.y), 'monstruo'); return spec; };
  const elegirTipo = (max) => {
    const pool = Object.fromEntries(Object.entries(tema.monstruos).filter(([t]) => COSTE[t] <= max && (t !== 'gargola' || nivel >= 3) && (t !== 'momia' || nivel >= 2 || nombreTema === 'muertos') && nivel >= (NIVEL_MIN[t] || 0)));
    return Object.keys(pool).length ? r.pesos(pool) : null;
  };
  for (const s of porDistancia) {
    if (s === salaObj && (objetivoTipo === 'jefe' || objetivoTipo === 'sellos')) continue; // va aparte, con el jefe
    let presupuesto = Math.round(1 + rango[s] * 0.9 + nivel * 0.8 + r() * 2);
    const libres = libresDe(s);
    const tope = Math.max(1, Math.floor(libres.length / 3));
    while (presupuesto > 0 && libres.length && monstruos.filter((m) => T.region(m.x, m.y) === s).length < tope) {
      const tipo = elegirTipo(presupuesto);
      if (!tipo) break;
      const [x, y] = libres.pop();
      poner({ id: 'm' + (++nId), tipo, x, y, ia: r.prob(0.55) ? 'guardian' : 'agresivo' });
      presupuesto -= COSTE[tipo];
    }
  }
  // Errantes por los pasillos, lejos de la escalera.
  const pasilloLejos = r.barajar(PASILLO.filter(([x, y]) => !ocupado.has(k(x, y)) && !celdaPuerta.has(k(x, y)) && (dist[k(x, y)] ?? 0) >= 8));
  for (let i = 0; i < Math.min(pasilloLejos.length, 1 + Math.floor(nivel / 2) + r.int(2)); i++) {
    const tipo = elegirTipo(2) || 'trasgo';
    const [x, y] = pasilloLejos[i];
    poner({ id: 'm' + (++nId), tipo, x, y, ia: 'agresivo' });
  }

  // Jefe
  const nombreJefe = nombrePropio(r);
  const tipoJefe = nombreTema === 'muertos' ? (nivel >= 3 && r.prob(0.5) ? 'hechicero' : 'momia') : nombreTema === 'oscuro' ? r.de(['hechicero', 'guerrero', 'gargola']) : r.de(['orco', 'orco', 'guerrero']);
  const jefeObligatorio = objetivoTipo === 'jefe' || objetivoTipo === 'sellos';
  let jefe = null;
  if (jefeObligatorio || nivel >= 2) {
    const salaJefe = jefeObligatorio ? salaObj : porDistancia[Math.max(0, porDistancia.length - 2)];
    const libres = libresDe(salaJefe);
    if (!libres.length) return null;
    const [x, y] = libres.pop();
    const b = D.MONSTRUOS[tipoJefe];
    jefe = poner({
      id: 'jefe', tipo: tipoJefe, nombre: nombreJefe + ' ' + APODOS_JEFE[tipoJefe], x, y, ia: tipoJefe === 'hechicero' ? 'lanzador' : 'guardian', jefe: true,
      cuerpo: b.cuerpo + 1 + Math.floor(nivel / 2), ataque: b.ataque + 1, defensa: b.defensa + (nivel >= 3 ? 1 : 0),
      ...(tipoJefe === 'hechicero' ? { hechizos: ['rayo', 'rayo', 'invocar', 'rayo'] } : {})
    });
    // Escolta
    for (let i = 0; i < 1 + Math.min(3, Math.floor(nivel / 2)) && libres.length; i++) {
      const tipo = elegirTipo(3) || 'orco';
      const [ex2, ey2] = libres.pop();
      poner({ id: 'm' + (++nId), tipo, x: ex2, y: ey2, ia: 'guardian' });
    }
  }

  // ---------- Objetivo, tesoros clave y guion ----------
  const tesoros = {};
  const disparadores = [];
  const reliquia = r.de(RELIQUIAS);
  const lugar = r.de(tema.nombre);          // con artículo: "la Cripta"
  const nombreLugar = nombrePropio(r);
  const enTexto = lugar + ' de ' + nombreLugar; // "la Cripta de Karvul"
  const titulo = enTexto.replace(/^./, (c) => c.toUpperCase());
  const mayus = (t) => t.replace(/^./, (c) => c.toUpperCase());
  const intermedias = porDistancia.filter((s) => s !== salaObj);
  let objetivo, intro;
  let tareas = []; // pasos que se muestran en el diario
  const refuerzos = () => {
    // Al coger el objetivo, salen monstruos en el camino de vuelta.
    const medio = PASILLO.filter(([x, y]) => !ocupado.has(k(x, y)) && !celdaPuerta.has(k(x, y)) && Math.abs((dist[k(x, y)] ?? 0) - distSala[salaObj] / 2) <= 3);
    return r.barajar(medio).slice(0, 2 + Math.floor(nivel / 2)).map(([x, y], i) => ({ id: 'r' + (i + 1), tipo: elegirTipo(2) || 'trasgo', x, y, ia: 'agresivo' }));
  };
  switch (objetivoTipo) {
    case 'jefe':
      objetivo = { tipo: 'matar', id: 'jefe', texto: 'Acaba con ' + jefe.nombre + '.' };
      tareas = [{ matar: 'jefe', texto: 'Acabar con ' + jefe.nombre }];
      intro = `Los caminos del norte llevan semanas cortados. Los supervivientes hablan ${/^el /.test(enTexto) ? 'del ' + enTexto.slice(3) : 'de ' + enTexto}, donde ${jefe.nombre} reúne a sus huestes. La Hermandad os envía a terminar con él antes de que su sombra llegue a las aldeas.`;
      disparadores.push({ cuando: 'region_revelada', region: salaObj, acciones: [{ tipo: 'historia', texto: `Al fondo de la sala, ${jefe.nombre} se vuelve hacia vosotros. «Habéis llegado lejos… para morir aquí.»` }] });
      tesoros[salaObj] = { texto: `Entre las pertenencias de ${nombreJefe} hay ${60 + nivel * 30} monedas.`, oro: 60 + nivel * 30 };
      break;
    case 'reliquia':
    case 'escapar': {
      tesoros[salaObj] = { texto: `Sobre un pedestal descansa ${reliquia}. Al cogerlo, algo cruje en las paredes.`, flag: 'reliquia', oro: 30 + nivel * 15 };
      tareas = [{ flag: 'reliquia', texto: 'Encontrar ' + reliquia + ' (busca tesoro en las salas)' }, { salir: true, texto: 'Volver a la escalera y salir' }];
      const salida = { tipo: 'aparecer', monstruos: refuerzos() };
      if (objetivoTipo === 'reliquia') {
        objetivo = { tipo: 'escalera', requiere: ['reliquia'], texto: `Recupera ${reliquia} y vuelve a la escalera.` };
        intro = `${reliquia.replace(/^./, (c) => c.toUpperCase())} desapareció hace un siglo. Un mapa robado lo sitúa en ${enTexto}. Bajad, encontradlo y traedlo de vuelta antes de que caiga en otras manos.`;
        disparadores.push({ cuando: 'flag', nombre: 'reliquia', acciones: [salida, { tipo: 'historia', texto: 'Se oyen pasos por los pasillos: alguien más quería la reliquia. ¡Volved a la escalera!' }] });
      } else {
        // Dos tramos: unas rondas para llegar (contando con tiradas flojas, ~4 casillas por ronda)
        // y, al coger la reliquia, unas 10 más para volver.
        const rondas = Math.ceil(distSala[salaObj] / 4) + 6;
        const extra = 8 + r.int(5);
        objetivo = { tipo: 'escapar', rondas, requiere: ['reliquia'], texto: `Coge ${reliquia} antes de ${rondas} rondas; al cogerlo ganaréis tiempo para volver a la escalera.` };
        intro = `${mayus(enTexto)} ${/^(las|los) /.test(lugar) ? 'se están hundiendo' : 'se está hundiendo'}. Bajo sus piedras queda ${reliquia}, y en cuanto pongáis el pie dentro el techo empezará a ceder. Tenéis ${rondas} rondas para llegar hasta él; dicen que su magia sostiene el techo un rato más.`;
        disparadores.push({ cuando: 'flag', nombre: 'reliquia', acciones: [salida, { tipo: 'rondasExtra', n: extra }, { tipo: 'historia', texto: `Al levantar ${reliquia}, su luz sostiene el techo: ¡${extra} rondas más! Las columnas tiemblan igualmente… ¡Corred a la escalera!` }] });
      }
      break;
    }
    case 'rescate': {
      const preso = r.de(PRISIONEROS);
      const salaLlave = intermedias[Math.max(0, Math.floor(intermedias.length / 2))];
      tesoros[salaLlave] = { texto: 'Colgada de un clavo, una llave de hierro grande y oxidada.', flag: 'llave' };
      tesoros[salaObj] = { texto: `Encadenado al muro está ${preso}. Rompéis los grilletes: «Sabía que vendría alguien. Sacadme de aquí».`, flag: 'rescatado' };
      objetivo = { tipo: 'escalera', requiere: ['rescatado'], texto: `Libera a ${preso} y vuelve con vida a la escalera.` };
      tareas = [{ flag: 'llave', texto: 'Encontrar la llave de la celda (busca tesoro en las salas)' }, { flag: 'rescatado', texto: 'Abrir la celda y liberar a ' + preso }, { salir: true, texto: 'Volver a la escalera y salir' }];
      intro = `${preso.replace(/^./, (c) => c.toUpperCase())} bajó ${/^el /.test(enTexto) ? 'al ' + enTexto.slice(3) : 'a ' + enTexto} y no ha vuelto. Lo tienen encerrado tras una puerta de hierro; la llave debe de estar en alguna parte de la mazmorra.`;
      disparadores.push({ cuando: 'flag', nombre: 'llave', acciones: [{ tipo: 'desbloquear', puerta: 'sellada' }, { tipo: 'historia', texto: 'La llave encaja en la cerradura de la celda: ya podéis abrirla.' }] });
      disparadores.push({ cuando: 'flag', nombre: 'rescatado', acciones: [{ tipo: 'aparecer', monstruos: refuerzos() }, { tipo: 'historia', texto: 'Alguien da la alarma. ¡Volved a la escalera con el prisionero!' }] });
      break;
    }
    case 'sellos': {
      const n = Math.min(3, intermedias.length);
      const salasSello = r.barajar(intermedias).slice(0, n);
      const sellos = ['Hueso', 'Ceniza', 'Sangre'].slice(0, n);
      const flags = sellos.map((s) => 'sello' + s);
      salasSello.forEach((s, i) => { tesoros[s] = { texto: `Encontráis el Sello de ${sellos[i]}.`, flag: flags[i] }; });
      flags.forEach((f, i) => disparadores.push({ cuando: 'flag', nombre: f, acciones: [{ tipo: 'mensaje', texto: `Tenéis el Sello de ${sellos[i]}.` }] }));
      disparadores.push({ cuando: 'flag', requiere: flags, acciones: [{ tipo: 'desbloquear', puerta: 'sellada' }, { tipo: 'historia', texto: 'Los sellos vibran a la vez: la puerta sellada ya no resiste.' }] });
      disparadores.push({ cuando: 'region_revelada', region: salaObj, acciones: [{ tipo: 'historia', texto: `${jefe.nombre} os esperaba. «Nadie rompe mis sellos y sale vivo.»` }] });
      objetivo = { tipo: 'matar', id: 'jefe', texto: `Reúne ${n === 1 ? 'el sello' : 'los ' + n + ' sellos'}, abre la puerta sellada y acaba con ${jefe.nombre}.` };
      tareas = [...sellos.map((s2, i) => ({ flag: flags[i], texto: 'Encontrar el Sello de ' + s2 })), { matar: 'jefe', texto: 'Cruzar la puerta sellada y acabar con ' + jefe.nombre }];
      intro = `${jefe.nombre} se ha encerrado en lo más hondo ${/^el /.test(enTexto) ? 'del ' + enTexto.slice(3) : 'de ' + enTexto}, tras una puerta que solo ceden ${n === 1 ? 'un sello' : n + ' sellos'} escondidos en la mazmorra. Encontradlos y terminad con él.`;
      break;
    }
  }
  if (jefe && !jefeObligatorio) disparadores.push({ cuando: 'monstruo_muerto', id: 'jefe', acciones: [{ tipo: 'mensaje', texto: jefe.nombre + ' cae. Esta mazmorra tenía dueño… y ya no.' }] });

  // Tesoros sueltos en otras salas.
  const sinTesoro = r.barajar(elegidas.filter((s) => s !== inicio && !tesoros[s]));
  for (const s of sinTesoro.slice(0, r.entre(2, 3))) {
    const tirada = r();
    if (tirada < 0.5) { const oro = 20 + r.int(4) * 15 + nivel * 15; tesoros[s] = { texto: `Escondidas en un rincón hay ${oro} monedas.`, oro, trampaCofre: r.prob(0.25) || undefined }; }
    else if (tirada < 0.8) tesoros[s] = { texto: 'Entre trastos rotos aparece un frasco intacto.', objeto: r.de(['pocionCurar', 'pocionCurar', 'pocionFuerza', 'pocionPiedra', 'pocionVelocidad']) };
    else tesoros[s] = { texto: 'Alguien dejó aquí su arma.', arma: r.de(['espadaCorta', 'lanza', 'espadaAncha', 'baston', 'espadaLarga', 'ballesta']) };
  }

  // ---------- Trampas (nunca cortan el único camino) ----------
  const trampas = [];
  const nTrampas = Math.min(6, 2 + Math.floor(nivel / 2) + r.int(2));
  const candTrampa = r.barajar([...PASILLO, ...elegidas.flatMap((s) => SALAS[s].celdas)].filter(([x, y]) =>
    !ocupado.has(k(x, y)) && !celdaPuerta.has(k(x, y)) && (dist[k(x, y)] ?? 0) >= 4 && !rocas.some((c) => c[0] === x && c[1] === y)));
  const borrador = () => ({ escalera: [ex, ey], rocas, puertas, muebles, monstruos: [], trampas: [] });
  for (const [x, y] of candTrampa) {
    if (trampas.length >= nTrampas) break;
    const prueba = borrador();
    prueba.rocas = [...rocas, ...trampas.map((t) => [t.x, t.y]), [x, y]];
    if (!salasAlcanzables(prueba, elegidas, { secretas: false, bloqueadas: true })) continue;
    trampas.push({ id: 't' + (trampas.length + 1), tipo: r.de(['foso', 'lanza', 'lanza', 'bloque']), x, y });
    ocupado.set(k(x, y), 'trampa');
  }

  return {
    id: 'perdida-' + semilla, numero: nivel, titulo, intro, objetivo, tareas, semilla, generada: true,
    recompensa: 40 + nivel * 20, errante: tema.errante, tema: nombreTema, zona: zona.id, nombreZona: zona.nombre,
    escalera: [ex, ey], rocas, puertas, muebles, monstruos, trampas, tesoros, disparadores,
    _salas: elegidas, _salaObjetivo: salaObj
  };
}

// Busca sitio para un mueble pegado a una pared de la sala, sin tapar puertas
// y sin partir la sala en dos.
function colocarMueble(r, s, w, h, ocupado, celdaPuerta) {
  const S = SALAS[s];
  const cand = [];
  for (let y = S.y0; y <= S.y1 - h + 1; y++) for (let x = S.x0; x <= S.x1 - w + 1; x++) {
    const pegado = x === S.x0 || y === S.y0 || x + w - 1 === S.x1 || y + h - 1 === S.y1;
    if (pegado) cand.push([x, y]);
  }
  for (const [x, y] of r.barajar(cand)) {
    const celdas = [];
    let ok = true;
    for (let yy = y; yy < y + h && ok; yy++) for (let xx = x; xx < x + w; xx++) {
      const c = k(xx, yy);
      // Ni encima de nada, ni en una casilla de puerta ni justo delante de una.
      if (T.region(xx, yy) !== s || ocupado.has(c) || celdaPuerta.has(c) || T.DIRS.some(([dx, dy]) => celdaPuerta.has(k(xx + dx, yy + dy)) && T.region(xx + dx, yy + dy) === s)) { ok = false; break; }
      celdas.push(c);
    }
    if (!ok) continue;
    // La sala debe seguir conectada.
    const bloq = new Set([...celdas, ...[...ocupado.keys()].filter((c) => ocupado.get(c) !== 'monstruo')]);
    const libres = S.celdas.filter(([xx, yy]) => !bloq.has(k(xx, yy)));
    if (!libres.length) continue;
    const vistos = new Set([k(...libres[0])]);
    const pila = [libres[0]];
    while (pila.length) {
      const [cx, cy] = pila.pop();
      for (const [dx, dy] of T.DIRS) {
        const nx = cx + dx, ny = cy + dy, c = k(nx, ny);
        if (T.region(nx, ny) === s && !bloq.has(c) && !vistos.has(c)) { vistos.add(c); pila.push([nx, ny]); }
      }
    }
    if (vistos.size === libres.length) return [x, y];
  }
  return null;
}

// ---------- Recorridos para validar ----------
function distancias(m, { secretas, bloqueadas }) {
  const roca = new Set(m.rocas.map((c) => k(...c)));
  const mueble = new Set();
  for (const u of m.muebles) for (let y = u.y; y < u.y + u.h; y++) for (let x = u.x; x < u.x + u.w; x++) mueble.add(k(x, y));
  const puerta = new Set(m.puertas.filter((p) => (secretas || !p.secreta) && (bloqueadas || !p.bloqueada)).map((p) => T.claveBorde(p.a, p.b)));
  const ini = m.escalera;
  const d = { [k(...ini)]: 0 };
  const cola = [ini];
  while (cola.length) {
    const [x, y] = cola.shift();
    for (const [dx, dy] of T.DIRS) {
      const nx = x + dx, ny = y + dy, c = k(nx, ny);
      if (!T.dentro(nx, ny) || d[c] !== undefined || roca.has(c) || mueble.has(c)) continue;
      if (T.region(x, y) !== T.region(nx, ny) && !puerta.has(T.claveBorde([x, y], [nx, ny]))) continue;
      d[c] = d[k(x, y)] + 1;
      cola.push([nx, ny]);
    }
  }
  return d;
}
function salasAlcanzables(m, salas, opciones) {
  const d = distancias(m, opciones);
  return salas.every((s) => SALAS[s].celdas.some(([x, y]) => d[k(x, y)] !== undefined));
}

// Devuelve un texto con el problema, o null si la mazmorra es válida.
export function validar(m) {
  T.usarPlano(m.plano);
  prepararGeometria();
  const oc = new Map();
  const marcar = (x, y, que) => { const c = k(x, y); if (oc.has(c)) return `${que} encima de ${oc.get(c)} en ${c}`; oc.set(c, que); return null; };
  const [ex, ey] = m.escalera;
  const re = T.region(ex, ey);
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { if (T.region(ex + dx, ey + dy) !== re || re === '.') return 'escalera fuera de sala'; const e = marcar(ex + dx, ey + dy, 'escalera'); if (e) return e; }
  for (const c of m.rocas) { const e = marcar(c[0], c[1], 'roca'); if (e) return e; }
  for (const u of m.muebles) for (let y = u.y; y < u.y + u.h; y++) for (let x = u.x; x < u.x + u.w; x++) { if (T.region(x, y) !== T.region(u.x, u.y)) return 'mueble cruza sala'; const e = marcar(x, y, u.tipo); if (e) return e; }
  for (const mo of m.monstruos) { const e = marcar(mo.x, mo.y, mo.id); if (e) return e; }
  for (const t of m.trampas) { const e = marcar(t.x, t.y, t.id); if (e) return e; }
  for (const p of m.puertas) {
    if (Math.abs(p.a[0] - p.b[0]) + Math.abs(p.a[1] - p.b[1]) !== 1 || T.region(...p.a) === T.region(...p.b)) return 'puerta mal puesta ' + p.id;
    for (const c of [p.a, p.b]) { const q = oc.get(k(...c)); if (q && !/^(m\d+|jefe|r\d+)$/.test(q)) return 'puerta tapada por ' + q; }
  }
  // Fase 1: sin puertas secretas ni cerradas, se llega a todas las salas con algo que coger.
  const d1 = distancias(m, { secretas: false, bloqueadas: false });
  const obj = m._salaObjetivo;
  const necesarias = Object.keys(m.tesoros).filter((s) => s !== obj || !m.puertas.some((p) => p.bloqueada));
  for (const s of necesarias) if (!SALAS[s].celdas.some(([x, y]) => d1[k(x, y)] !== undefined)) return 'sala ' + s + ' inalcanzable';
  // Fase 2: con todo abierto, se llega al objetivo y al jefe.
  const d2 = distancias(m, { secretas: false, bloqueadas: true });
  if (!SALAS[obj].celdas.some(([x, y]) => d2[k(x, y)] !== undefined)) return 'objetivo inalcanzable';
  const jefe = m.monstruos.find((x) => x.id === 'jefe');
  if (jefe && !T.DIRS.some(([dx, dy]) => d2[k(jefe.x + dx, jefe.y + dy)] !== undefined)) return 'jefe inalcanzable';
  return null;
}
