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
export const RETIRO_MAX = 0.4;          // del banco a un héroe: hasta el 40 % de (bolsa + banco)
const CLAVE = 'criptas_viajero';
// Lo que se guarda de cada héroe (lo mismo que define su progreso en una partida).
export const CAMPOS_HEROE = ['tipo', 'fem', 'nombre', 'icono', 'arma', 'armaduras', 'objetos', 'kit', 'oro', 'cuerpoMax', 'mente',
  'inventario', 'nivel', 'xp', 'puntos', 'mejoras', 'subclase', 'purificada', 'bonoEspecialidad', 'banco'];

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

// Completa una ficha antigua o incompleta con lo que le falte.
export function normalizar(f) {
  const base = nuevaFicha(f?.nombre || 'Viajero');
  if (!f || typeof f !== 'object') return base;
  const out = { ...base, ...f };
  for (const k of ['cabana', 'tortuga', 'diario']) out[k] = { ...base[k], ...(f[k] || {}) };
  out.heroes ||= {}; out.registradas ||= {}; out.importados ||= {};
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
export function anadirHeroe(f, h, nombre) {
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
  hPartida.cuerpo = hPartida.cuerpoMax;
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
  for (const h of Object.values(estado.heroes)) {
    const fh = h.fichaId && f.heroes[h.fichaId];
    if (!fh || h.jugador !== miId) continue;
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
  if (cambio) tocar(f);
  return cambio;
}
// Trofeos y diario: una vez por misión terminada.
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
    if (fid && f.heroes[fid]) delete f.heroes[fid].retirado;     // tras una misión puede volver a sacar del banco
    const hc = c.heroes?.[id];
    if (!hc) continue;
    d.monstruos += Object.values(hc.muertes || {}).reduce((s, n) => s + n, 0);
    d.caidas += hc.caidas || 0;
  }
  if (c.resultado === 'victoria') for (const nombre of c.jefes || []) {
    d.jefes++;
    f.cabana.trofeos.push({ nombre, donde: estado.aleatorio ? 'Mazmorra Infinita · piso ' + c.numero : 'Misión ' + c.numero + ': ' + (c.titulo || ''), fecha: Date.now() });
  }
  // Que la lista no crezca sin fin: se guardan las últimas misiones apuntadas.
  const claves = Object.keys(f.registradas);
  if (claves.length > 400) for (const x of claves.sort((a, b) => f.registradas[a] - f.registradas[b]).slice(0, claves.length - 400)) delete f.registradas[x];
  return true;
}

// ---------- Banco de Madre Hiel (del viajero) ----------
export function depositar(f, id, n) {
  const h = f.heroes[id];
  n = Math.floor(n);
  if (!h) return 'Ese héroe no está en tu ficha.';
  if (h.prestado) return h.nombre + ' está en una partida: su bolsa la lleva encima.';
  if (!(n > 0) || n > h.oro) return 'No lleva tanto oro.';
  h.oro -= n; f.banco += n; tocar(f);
  return null;
}
export const maxRetiro = (f, h) => (h.retirado ? 0 : Math.min(f.banco, Math.floor((h.oro + f.banco) * RETIRO_MAX)));
export function retirar(f, id, n) {
  const h = f.heroes[id];
  n = Math.floor(n);
  if (!h) return 'Ese héroe no está en tu ficha.';
  if (h.prestado) return h.nombre + ' está en una partida.';
  if (h.retirado) return h.nombre + ' ya ha sacado oro del banco. Podrá volver a hacerlo después de su próxima misión.';
  if (!(n > 0) || n > maxRetiro(f, h)) return 'Como mucho puede sacar ' + maxRetiro(f, h) + ' monedas (el 40 %).';
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
  return out;
}

export function tocar(f) { f.actualizada = Date.now(); }

// ---------- Guardado en el dispositivo ----------
export function leerFicha() {
  try { const t = localStorage.getItem(CLAVE); return t ? normalizar(JSON.parse(t)) : null; } catch { return null; }
}
export function guardarFicha(f) {
  try { localStorage.setItem(CLAVE, JSON.stringify(f)); return true; } catch { return false; }
}
export const fichaOCrear = (nombre) => leerFicha() || nuevaFicha(nombre);
