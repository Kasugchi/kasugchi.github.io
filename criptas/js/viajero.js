import { famaDeMision, estadoPueblo } from './pueblo.js';
// =============================================================
//  FICHA DEL VIAJERO
//  Lo que es tuyo fuera de las partidas: tus héroes (hasta 8, se puede
//  repetir clase), el banco de Madre Hiel, tu cabaña (trofeos) y el diario.
//
//  Préstamo: al empezar una partida con un héroe de la ficha, el héroe
//  queda «prestado» a esa partida (estado.uid). Mientras lo esté no se
//  puede usar en otra. Entre misiones, la ficha copia su progreso desde
//  la partida; al acabar la partida (o al borrarla), vuelve a estar libre.
//
//  Todo son funciones puras sobre un objeto JSON, salvo leerFicha /
//  guardarFicha (localStorage). La nube la gestiona ui.js con nube.js.
// =============================================================
export const MAX_HEROES = 8;
export const RETIRO_MAX = 0.4;          // fondo común: cada héroe aporta hasta el 40 % de su dinero y saca hasta el 40 % del fondo, por misión
const CLAVE = 'criptas_viajero';
// ---------- Mundos (ranuras de guardado) ----------
// Cada mundo tiene su ficha entera: héroes, banco, cabaña, diario y tortuga.
// El primero ('m1') usa la clave de siempre, así las fichas de antes son el primer mundo.
const CLAVE_MUNDOS = 'criptas_mundos';
export const MAX_MUNDOS = 3;
const claveDe = (id) => (!id || id === 'm1' ? CLAVE : CLAVE + '_' + id);
export function leerMundos() {
  try { const m = JSON.parse(localStorage.getItem(CLAVE_MUNDOS)); if (m?.lista?.length) { if (!m.lista.some((x) => x.id === m.activo)) m.activo = m.lista[0].id; return m; } } catch { /* sin mundos todavía */ }
  return { activo: 'm1', lista: [{ id: 'm1', nombre: 'Mi mundo', creado: Date.now() }] };
}
export function guardarMundos(m) { try { localStorage.setItem(CLAVE_MUNDOS, JSON.stringify(m)); } catch { /* sin almacenamiento */ } alGuardarMundos?.(m); }
let alGuardarMundos = null;
export const subirMundosAlGuardar = (f) => { alGuardarMundos = f; };
export const mundoActivo = () => leerMundos().activo;
export function elegirMundo(id) { const m = leerMundos(); if (!m.lista.some((x) => x.id === id)) return 'Ese mundo no existe.'; m.activo = id; guardarMundos(m); return null; }
export function crearMundo(nombre) {
  const m = leerMundos();
  if (m.lista.length >= MAX_MUNDOS) return { error: 'Como mucho ' + MAX_MUNDOS + ' mundos. Borra uno antes de crear otro.' };
  const id = 'm' + Date.now().toString(36);
  m.lista.push({ id, nombre: limpiarNombre(nombre) || 'Mundo nuevo', creado: Date.now() });
  m.activo = id; guardarMundos(m);
  return { id };
}
export function renombrarMundo(id, nombre) {
  const m = leerMundos(), x = m.lista.find((y) => y.id === id), n = limpiarNombre(nombre);
  if (!x) return 'Ese mundo no existe.'; if (!n) return 'Escribe un nombre.';
  x.nombre = n; guardarMundos(m); return null;
}
export function borrarMundo(id) {
  const m = leerMundos();
  if (m.lista.length <= 1) return 'Tiene que quedar al menos un mundo.';
  m.lista = m.lista.filter((x) => x.id !== id);
  m.borrados = [...(m.borrados || []), id];   // para que no vuelva desde otro dispositivo
  if (m.activo === id) m.activo = m.lista[0].id;
  try { localStorage.removeItem(claveDe(id)); } catch { /* nada */ }
  guardarMundos(m); return null;
}
// Juntar la lista de mundos de dos dispositivos (nunca se pierde uno).
export function fusionarMundos(a, b) {
  if (!b?.lista) return a;
  const borrados = [...new Set([...(a.borrados || []), ...(b.borrados || [])])];
  const out = { activo: a.activo, lista: a.lista.filter((x) => !borrados.includes(x.id)), borrados };
  for (const x of b.lista) if (!out.lista.some((y) => y.id === x.id) && !borrados.includes(x.id)) out.lista.push(x);
  if (!out.lista.length) out.lista = [{ id: 'm1', nombre: 'Mi mundo', creado: Date.now() }];
  if (!out.lista.some((x) => x.id === out.activo)) out.activo = out.lista[0].id;
  out.lista = out.lista.slice(0, MAX_MUNDOS);
  return out;
}
// Lo que se guarda de cada héroe (lo mismo que define su progreso en una partida).
export const CAMPOS_HEROE = ['tipo', 'fem', 'nombre', 'icono', 'arma', 'armaduras', 'objetos', 'kit', 'oro', 'cuerpoMax', 'mente',
  'inventario', 'nivel', 'xp', 'puntos', 'mejoras', 'subclase', 'purificada', 'bonoEspecialidad', 'banco', 'cuerpoAlCargar'];

const copia = (o) => JSON.parse(JSON.stringify(o));
const idNuevo = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function nuevaFicha(nombre = 'Viajero') {
  return {
    v: 1, nombre, actualizada: Date.now(),
    heroes: {}, orden: [], activo: null,
    banco: 0,
    cabana: { trofeos: [] },
    tortuga: { rescatados: [] },
    diario: { misiones: 0, victorias: 0, derrotas: 0, jefes: 0, pisoMax: 0, monstruos: 0, caidas: 0 },
    registradas: {},     // misiones ya apuntadas (para no contarlas dos veces)
    importados: {}       // héroes ya traídos de partidas antiguas
  };
}

// Mundo de exhibición (?showcase en la portada): la tortuga con todo y una cuadrilla veterana.
export function fichaShowcase(nombre = 'Viajero') {
  const f = nuevaFicha(nombre), ahora = Date.now();
  const H = (tipo, nombreH, arma, armaduras, subclase, mejoras, oro, banco) => {
    const id = idNuevo('h');
    const cuerpo = { barbaro: 8, enano: 7, elfo: 6, mago: 4 }[tipo] + (mejoras.cuerpo || 0);
    const mente = { barbaro: 2, enano: 3, elfo: 4, mago: 6 }[tipo] + (mejoras.mente || 0);
    f.heroes[id] = { id, tipo, nombre: nombreH, icono: tipo, arma, armaduras, objetos: { pocionCurar: 2 }, kit: tipo === 'enano',
      oro, banco, cuerpoMax: cuerpo, mente, inventario: { armas: [], armaduras: [], objetos: {} },
      nivel: 10, xp: 270, puntos: 0, mejoras, subclase, prestado: null, creado: ahora };
    f.orden.push(id);
  };
  H('barbaro', 'Grom', 'hacha', ['casco', 'placas'], 'campeon', { cuerpo: 4, ataque: 2, defensa: 2, mente: 1 }, 640, 1800);
  H('enano', 'Minimax', 'hacha', ['casco', 'escudo', 'cota'], 'guardian', { cuerpo: 4, defensa: 2, ataque: 2, mente: 1 }, 520, 2400);
  H('elfo', 'Lirael', 'ballesta', ['casco', 'cotaElfica'], 'arquero', { cuerpo: 3, ataque: 2, defensa: 2, mente: 2 }, 410, 1500);
  H('mago', 'Aldric', 'baston', [], 'hechicero', { cuerpo: 3, mente: 3, defensa: 2, ataque: 1 }, 380, 1200);
  f.activo = f.orden[0];
  f.banco = 3200;
  f.diario = { misiones: 64, victorias: 55, derrotas: 9, jefes: 21, pisoMax: 20, monstruos: 812, caidas: 6 };
  const dias = (n) => ahora - n * 86400000;
  f.cabana.trofeos = [
    { nombre: 'Ugrak, el Gran Chamán', donde: 'Mazmorra Infinita · piso 5', fecha: dias(40) },
    { nombre: 'La Reina de Hueso', donde: 'Mazmorra Infinita · piso 10', fecha: dias(31) },
    { nombre: 'El Gólem Ancestral', donde: 'Mazmorra Infinita · piso 15', fecha: dias(22) },
    { nombre: 'El Heraldo del Abismo', donde: 'Mazmorra Infinita · piso 20', fecha: dias(14) },
    { nombre: 'Corazón de la Mazmorra', donde: 'Mazmorra Infinita · piso 20', fecha: dias(14) },
    { nombre: 'Velmor el Pálido', donde: 'Misión 5: El Trono de Velmor', fecha: dias(6) }
  ];
  f.tortuga = { fama: 420, rescatados: [], historias: { velmor: dias(6) },
    obras: { bandera: dias(30), jardin: dias(25), fuente: dias(18), muelle: dias(9) }, vistos: {}, encargos: null };
  for (const id of ['farolillos', 'casas1', 'mordo', 'arbol', 'pescador', 'casas2', 'cantina', 'gentio', 'casas3', 'mercado', 'faro', 'bandera', 'jardin', 'fuente', 'muelle']) f.tortuga.vistos[id] = ahora;
  return f;
}

// Completa una ficha antigua o incompleta con lo que le falte.
export function normalizar(f) {
  const base = nuevaFicha(f?.nombre || 'Viajero');
  if (!f || typeof f !== 'object') return base;
  const out = { ...base, ...f };
  for (const k of ['cabana', 'tortuga', 'diario']) out[k] = { ...base[k], ...(f[k] || {}) };
  out.heroes ||= {}; out.registradas ||= {}; out.importados ||= {}; out.campanas ||= {};
  out.orden = (f.orden || Object.keys(out.heroes)).filter((id) => out.heroes[id]);
  for (const id of Object.keys(out.heroes)) if (!out.orden.includes(id)) out.orden.push(id);
  if (out.activo && !out.heroes[out.activo]) out.activo = null;
  return out;
}

// ---------- Héroes ----------
export function fotoHeroe(h) {
  const s = {};
  for (const k of CAMPOS_HEROE) if (h[k] !== undefined) s[k] = copia(h[k]);
  s.nivel ||= 1; s.xp ||= 0; s.puntos ||= 0; s.mejoras ||= {}; s.oro ||= 0; s.banco ||= 0;
  s.inventario ||= { armas: [], armaduras: [], objetos: {} };
  s.armaduras ||= []; s.objetos ||= {};
  return s;
}
// Nombre propio de un héroe: sin símbolos raros, 20 letras como mucho.
export const limpiarNombre = (t) => String(t ?? '').replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
export function renombrar(f, id, nombre) {
  const h = f.heroes[id], n = limpiarNombre(nombre);
  if (!h) return 'Ese héroe no está en tu ficha.';
  if (!n) return 'Escribe un nombre.';
  h.nombre = n;
  tocar(f);
  return null;
}
export function anadirHeroe(f, h, nombre) {
  nombre = limpiarNombre(nombre);
  if (f.orden.length >= MAX_HEROES) return { error: 'Ya tienes ' + MAX_HEROES + ' héroes. Retira alguno antes de traer otro.' };
  const id = idNuevo('h');
  f.heroes[id] = { ...fotoHeroe(h), id, ...(nombre ? { nombre } : {}), prestado: null, creado: Date.now() };
  f.orden.push(id);
  f.activo ||= id;
  tocar(f);
  return { id };
}
export function retirarHeroe(f, id) {
  const h = f.heroes[id];
  if (!h) return 'Ese héroe no está en tu ficha.';
  if (h.prestado) return h.nombre + ' está en una partida. Termínala o tráelo de vuelta antes.';
  delete f.heroes[id];
  f.orden = f.orden.filter((x) => x !== id);
  if (f.activo === id) f.activo = f.orden[0] || null;
  tocar(f);
  return null;
}
export const libres = (f, tipo) => f.orden.map((id) => f.heroes[id]).filter((h) => !h.prestado && !h.caido && (!tipo || h.tipo === tipo));

// ---------- Préstamo a partidas ----------
export function prestar(f, id, partida) {
  const h = f.heroes[id];
  if (!h) return 'Ese héroe no está en tu ficha.';
  if (h.prestado && h.prestado.partida !== partida) return h.nombre + ' ya está en otra partida.';
  h.prestado = { partida, desde: h.prestado?.desde || Date.now() };
  tocar(f);
  return null;
}
// Traerlo de vuelta a mano (por ejemplo, si la partida se perdió en otro móvil).
// Esa partida ya no podrá volver a llevárselo.
export function devolver(f, id) {
  const h = f.heroes[id];
  if (!h?.prestado) return false;
  (h.devueltoDe ||= []).push(h.prestado.partida);
  h.prestado = null;
  tocar(f);
  return true;
}
// Al borrar o terminar una partida: sus héroes vuelven.
export function devolverDePartida(f, partida) {
  let n = 0;
  for (const h of Object.values(f.heroes)) if (h.prestado?.partida === partida) { h.prestado = null; n++; }
  if (n) tocar(f);
  return n;
}
// Pone en el héroe de la partida lo que había en la ficha (al crear la partida).
export function cargarEnPartida(hPartida, hFicha) {
  for (const k of CAMPOS_HEROE) if (hFicha[k] !== undefined) hPartida[k] = copia(hFicha[k]);
  // Recién rescatado del Limbo: vuelve con 1 de cuerpo (solo la primera vez que baja).
  hPartida.cuerpo = hFicha.cuerpoAlCargar ? Math.min(hPartida.cuerpoMax, hFicha.cuerpoAlCargar) : hPartida.cuerpoMax;
  delete hPartida.cuerpoAlCargar;
  hPartida.fichaId = hFicha.id;
  return hPartida;
}

// ---------- Sincronizar desde una partida ----------
// Llamar con cada estado que llegue. Solo copia el progreso entre misiones
// (campamento o final), solo de los héroes de este jugador y solo si siguen
// prestados a esta partida. Devuelve true si la ficha ha cambiado.
export function sincronizar(f, estado, miId) {
  if (!estado?.uid || !estado.heroes) return false;
  let cambio = false;
  const entreMisiones = estado.fase === 'armeria' || estado.fase === 'final' || estado.fase === 'briefing';
  // Limbo superado: el caído vuelve a la ficha de su dueño, con 1 de cuerpo y todo su equipo.
  const L = estado.limbo;
  if (L?.rescatado && L.dueno === miId && f.heroes[L.fichaId]?.caido) {
    const fh = f.heroes[L.fichaId];
    fh.caido = null; fh.prestado = null; fh.cuerpoAlCargar = 1; fh.rescatado = Date.now();
    cambio = true;
  }
  for (const h of Object.values(estado.heroes)) {
    const fh = h.fichaId && f.heroes[h.fichaId];
    if (!fh || h.jugador !== miId) continue;
    if (fh.prestado?.partida === estado.uid && fh.cuerpoAlCargar) { delete fh.cuerpoAlCargar; cambio = true; }   // ya ha bajado con su cuerpo de rescatado
    if (!fh.prestado) { if (estado.fase !== 'final' && !fh.caido && !fh.devueltoDe?.includes(estado.uid)) { fh.prestado = { partida: estado.uid, desde: Date.now() }; cambio = true; } }
    if (fh.prestado?.partida !== estado.uid) continue;
    if (entreMisiones && !h.caido) {
      const antes = JSON.stringify(fotoHeroe(fh));
      const ahora = fotoHeroe(h);
      ahora.nombre = fh.nombre;
      if (JSON.stringify(ahora) !== antes) { Object.assign(fh, ahora); cambio = true; }
    }
    if (h.caido && !fh.caido) { fh.caido = { partida: estado.uid, fecha: Date.now() }; cambio = true; }   // Leyenda: espera al Limbo
    if (estado.fase === 'final' || h.caido) { fh.prestado = null; cambio = true; }
  }
  if (registrarMision(f, estado, miId)) cambio = true;
  if (apuntarCampana(f, estado, miId)) cambio = true;
  if (cambio) tocar(f);
  return cambio;
}
// Campañas importadas: lo que se decidió (y si se acabó) queda en la ficha; el pueblo lo convierte en
// vecinos, muebles y cartas. El oro de una decisión va al banco una sola vez.
function apuntarCampana(f, estado, miId) {
  const id = estado.importada;
  if (!id || !Object.values(estado.heroes).some((h) => h.jugador === miId && !h.ia)) return false;
  const c = ((f.campanas ||= {})[id] ||= { nombre: estado.nombreImportada || id, decisiones: {}, pagadas: {}, fin: 0 });
  let cambio = false;
  for (const [k, d] of Object.entries(estado.mundoCampana || {})) {
    if (c.decisiones[k]?.opcion !== d.opcion) { c.decisiones[k] = { opcion: d.opcion, texto: d.texto, marca: d.marca }; cambio = true; }
    if (d.oro && !c.pagadas[k]) { c.pagadas[k] = 1; f.banco = (f.banco || 0) + d.oro; cambio = true; }
  }
  if (!c.fin && estado.fase === 'final' && estado.resultado === 'victoria' && !estado.caida) { c.fin = Date.now(); cambio = true; }
  return cambio;
}
// Trofeos y diario: una vez por misión terminada.
// Quien quiera enterarse de cada misión apuntada (la nube la guarda como actividad).
let alApuntar = null;
export const avisarAlApuntar = (fn) => { alApuntar = fn; };
export function registrarMision(f, estado, miId) {
  const c = estado.cronica?.ultima, k = estado.cronica?.campana;
  if (!c || !k || !c.resultado) return false;
  const mios = Object.values(estado.heroes).filter((h) => h.jugador === miId && !h.ia).map((h) => h.id);
  if (!mios.length) return false;
  const clave = estado.uid + ':' + k.misiones;
  if (f.registradas[clave]) return false;
  f.registradas[clave] = Date.now();
  const d = f.diario;
  d.misiones++;
  if (c.resultado === 'victoria') d.victorias++; else d.derrotas++;
  if (estado.aleatorio && c.resultado === 'victoria') d.pisoMax = Math.max(d.pisoMax, c.numero || estado.misionIdx);
  for (const id of mios) {
    const fid = estado.heroes[id].fichaId;
    if (fid && f.heroes[fid]) { delete f.heroes[fid].retirado; delete f.heroes[fid].aporte; delete f.heroes[fid].fiambrera; }     // tras una misión: puede volver a usar el fondo y a comer en la cantina
    const hc = c.heroes?.[id];
    if (!hc) continue;
    d.monstruos += Object.values(hc.muertes || {}).reduce((s, n) => s + n, 0);
    d.caidas += hc.caidas || 0;
  }
  // Fama para tu tortuga: cuenta igual si eras el anfitrión o ayudabas a otro.
  const t = estadoPueblo(f);
  t.fama += famaDeMision(estado, c);
  // Historia completa: la campaña de Velmor terminada con victoria.
  if (!estado.aleatorio && !estado.limbo && !estado.pruebas && c.resultado === 'victoria' && estado.campana?.length && estado.misionIdx + 1 >= estado.campana.length) t.historias.velmor ||= Date.now();
  if (c.resultado === 'victoria') for (const nombre of c.jefes || []) {
    d.jefes++;
    f.cabana.trofeos.push({ nombre, donde: estado.aleatorio ? 'Mazmorra Infinita · piso ' + c.numero : 'Misión ' + c.numero + ': ' + (c.titulo || ''), fecha: Date.now() });
  }
  try {
    alApuntar?.({
      tipo: 'mision', fecha: Date.now(), mundo: f.mundo || 'm1',
      modo: estado.aleatorio ? 'infinita' : estado.limbo ? 'limbo' : estado.pruebas ? 'pruebas' : 'historia',
      dificultad: estado.dificultad || 'heroe', resultado: c.resultado, numero: c.numero || null, titulo: c.titulo || null,
      rondas: c.rondas || 0, jefes: c.jefes || [], sala: estado.codigo || null,
      monstruos: mios.reduce((s, id) => s + Object.values(c.heroes?.[id]?.muertes || {}).reduce((a, n) => a + n, 0), 0),
      caidos: mios.filter((id) => estado.heroes[id].caido).map((id) => estado.heroes[id].nombre),
      heroes: mios.map((id) => { const h = estado.heroes[id]; return { nombre: h.nombre, tipo: h.tipo, nivel: h.nivel || 1 }; }),
      fama: famaDeMision(estado, c)
    });
  } catch { /* la actividad nunca rompe la partida */ }
  // Que la lista no crezca sin fin: se guardan las últimas misiones apuntadas.
  const claves = Object.keys(f.registradas);
  if (claves.length > 400) for (const x of claves.sort((a, b) => f.registradas[a] - f.registradas[b]).slice(0, claves.length - 400)) delete f.registradas[x];
  return true;
}

// ---------- Banco de Madre Hiel ----------
// Cada héroe tiene su bolsa (h.oro) y su banco (h.banco), que van con él a las partidas;
// entre los dos mueve lo que quiera. Aparte, el FONDO COMÚN del viajero (f.banco),
// que paga las obras y la cantina. Por misión, cada héroe aporta como mucho el 40 %
// de su dinero y saca como mucho el 40 % de lo que haya en el fondo.
const heroeLibre = (f, id) => {
  const h = f.heroes[id];
  if (!h) return [null, 'Ese héroe no está en tu ficha.'];
  if (h.prestado) return [null, h.nombre + ' está en una partida: su oro lo lleva encima.'];
  return [h, null];
};
export function guardarEnSuBanco(f, id, n) {
  const [h, e] = heroeLibre(f, id); if (e) return e;
  n = Math.floor(n);
  if (!(n > 0) || n > h.oro) return 'No lleva tanto oro.';
  h.oro -= n; h.banco = (h.banco || 0) + n; tocar(f);
  return null;
}
export function sacarDeSuBanco(f, id, n) {
  const [h, e] = heroeLibre(f, id); if (e) return e;
  n = Math.floor(n);
  if (!(n > 0) || n > (h.banco || 0)) return 'No tiene tanto en su banco.';
  h.banco -= n; h.oro += n; tocar(f);
  return null;
}
// Lo que aún puede aportar al fondo en esta misión.
export const maxAporte = (f, h) => {
  const ya = h.aporte || 0;
  return Math.max(0, Math.floor((h.oro + (h.banco || 0) + ya) * RETIRO_MAX) - ya);
};
export function depositar(f, id, n) {      // aportar al fondo común (primero de la bolsa, luego de su banco)
  const [h, e] = heroeLibre(f, id); if (e) return e;
  n = Math.floor(n);
  const max = maxAporte(f, h);
  if (!(n > 0) || n > h.oro + (h.banco || 0)) return 'No tiene tanto oro.';
  if (n > max) return max ? `Como mucho puede aportar ${max} monedas más en esta misión (el 40 % de su dinero).` : `${h.nombre} ya ha aportado su 40 %. Podrá volver a hacerlo después de su próxima misión.`;
  const deBolsa = Math.min(h.oro, n);
  h.oro -= deBolsa; h.banco = (h.banco || 0) - (n - deBolsa);
  h.aporte = (h.aporte || 0) + n; f.banco += n; tocar(f);
  return null;
}
export const maxRetiro = (f, h) => (h.retirado ? 0 : Math.floor((f.banco || 0) * RETIRO_MAX));
export function retirar(f, id, n) {        // sacar del fondo común
  const [h, e] = heroeLibre(f, id); if (e) return e;
  n = Math.floor(n);
  if (h.retirado) return h.nombre + ' ya ha sacado del fondo. Podrá volver a hacerlo después de su próxima misión.';
  if (!(n > 0) || n > maxRetiro(f, h)) return 'Como mucho puede sacar ' + maxRetiro(f, h) + ' monedas (el 40 % del fondo).';
  h.oro += n; f.banco -= n; h.retirado = true; tocar(f);
  return null;
}

// ---------- Importar desde partidas guardadas ----------
export function importables(f, partidas) {
  const out = [];
  for (const p of Object.values(partidas || {})) {
    const e = p.estado;
    if (!e?.heroes) continue;
    for (const h of Object.values(e.heroes)) {
      if (h.fichaId || h.caido) continue;
      const clave = (e.uid || p.id) + ':' + h.id;
      if (f.importados[clave]) continue;
      out.push({ clave, partida: p.id, heroe: h, resumen: p.resumen?.mision || '' });
    }
  }
  return out;
}
export function importar(f, item) {
  if (f.importados[item.clave]) return { error: 'Ese héroe ya lo trajiste.' };
  const r = anadirHeroe(f, item.heroe);
  if (r.error) return r;
  f.importados[item.clave] = Date.now();
  return r;
}

// ---------- Unir dos copias (local y nube) ----------
// Gana la más reciente, pero no se pierden trofeos ni misiones apuntadas.
export function fusionar(a, b) {
  if (!a) return normalizar(b);
  if (!b) return normalizar(a);
  const [nueva, vieja] = (a.actualizada || 0) >= (b.actualizada || 0) ? [a, b] : [b, a];
  const out = normalizar(copia(nueva));
  for (const [k, v] of Object.entries(vieja.registradas || {})) out.registradas[k] ||= v;
  for (const [k, v] of Object.entries(vieja.importados || {})) out.importados[k] ||= v;
  const vistos = new Set(out.cabana.trofeos.map((t) => t.nombre + '|' + t.fecha));
  for (const t of vieja.cabana?.trofeos || []) if (!vistos.has(t.nombre + '|' + t.fecha)) out.cabana.trofeos.push(t);
  out.cabana.trofeos.sort((x, y) => x.fecha - y.fecha);
  // La tortuga nunca pierde lo ganado en otro dispositivo.
  const tv = vieja.tortuga || {}, tn = out.tortuga;
  tn.fama = Math.max(tn.fama || 0, tv.fama || 0);
  for (const k of ['obras', 'historias', 'vistos']) tn[k] = { ...(tv[k] || {}), ...(tn[k] || {}) };
  tn.rescatados = [...new Set([...(tn.rescatados || []), ...(tv.rescatados || [])])];
  // Campañas: lo decidido en un dispositivo no se pierde en otro (si choca, manda la ficha más nueva).
  for (const [k, cv] of Object.entries(vieja.campanas || {})) {
    const cn = (out.campanas[k] ||= copia(cv));
    cn.decisiones = { ...(cv.decisiones || {}), ...(cn.decisiones || {}) };
    cn.pagadas = { ...(cv.pagadas || {}), ...(cn.pagadas || {}) };
    cn.fin = cn.fin || cv.fin || 0;
  }
  return out;
}

export function tocar(f) { f.actualizada = Date.now(); }

// ---------- Guardado en el dispositivo ----------
export function leerFicha(mundo = mundoActivo()) {
  try { const t = localStorage.getItem(claveDe(mundo)); if (!t) return null; const f = normalizar(JSON.parse(t)); f.mundo = mundo; return f; } catch { return null; }
}
// Si una página quiere subir la ficha a la nube al guardarla (la tortuga y la cabaña), pone aquí su función.
let alGuardar = null;
export const subirAlGuardar = (f) => { alGuardar = f; };
export function guardarFicha(f) {
  f.mundo ||= mundoActivo();
  try { localStorage.setItem(claveDe(f.mundo), JSON.stringify(f)); alGuardar?.(f); return true; } catch { return false; }
}
export const fichaOCrear = (nombre) => leerFicha() || { ...nuevaFicha(nombre), mundo: mundoActivo() };
