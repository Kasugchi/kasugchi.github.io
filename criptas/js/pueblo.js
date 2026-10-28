// =============================================================
//  EL PUEBLO DE MORRANDAR: cómo crece tu tortuga
//  Cada viajero tiene su tortuga (en su ficha: ficha.tortuga).
//  Crece por cuatro vías:
//    · Fama: cada misión jugada (solo o ayudando a otros) da fama.
//    · Rescates: personajes que vienen a vivir (de momento, por fama;
//      cuando haya misiones de rescate, por rescate).
//    · Historias completas: cambios grandes (el faro de Velmor).
//    · Obras: las pagáis con el oro del banco de Madre Hiel.
//  Este módulo no toca la escena: dice qué hay desbloqueado.
// =============================================================

export const RANGOS = [
  { fama: 0, nombre: 'Aldea a la deriva' },
  { fama: 30, nombre: 'Caserío' },
  { fama: 80, nombre: 'Pueblo de Morrandar' },
  { fama: 160, nombre: 'Villa de Morrandar' },
  { fama: 300, nombre: 'Ciudad sobre el caparazón' }
];
export const rangoDe = (fama) => RANGOS.filter((r) => fama >= r.fama).pop();
export const siguienteRango = (fama) => RANGOS.find((r) => r.fama > fama) || null;

// Lo que llega con la fama (o con un rescate, o al acabar una historia).
export const MEJORAS = [
  { id: 'farolillos', nombre: 'Guirnaldas de farolillos', fama: 10, texto: 'Los vecinos cuelgan farolillos de poste a poste. De noche, la plaza brilla.' },
  { id: 'casas1', nombre: 'Primeras casas en las laderas', fama: 20, texto: 'Llegan familias de náufragos y levantan casas en el caparazón.' },
  { id: 'mordo', nombre: 'Mordo el Tuerto, mercader', fama: 30, vecino: true, texto: 'Un mercader de dudosa reputación monta su puesto en la plaza.' },
  { id: 'arbol', nombre: 'El árbol florece', fama: 45, texto: 'El árbol de la plaza se llena de hojas rojas y farolillos.' },
  { id: 'pescador', nombre: 'El Viejo Anzuelo, pescador de páginas', fama: 60, vecino: true, texto: 'Un viejo se instala en el borde a pescar páginas perdidas.' },
  { id: 'casas2', nombre: 'Más casas en las laderas', fama: 90, texto: 'El pueblo crece: más chimeneas humeando en el caparazón.' },
  { id: 'cantina', nombre: 'La cantina de Marga', fama: 120, vecino: true, texto: 'Marga abre su cantina: un guiso antes de bajar al libro sienta de maravilla.' },
  { id: 'gentio', nombre: 'Vecinos paseando por la plaza', fama: 160, texto: 'La plaza se llena de gente: náufragos, pescadores, niños corriendo detrás del gato.' },
  { id: 'casas3', nombre: 'Barrio de las laderas', fama: 200, texto: 'Morrandar ya es una ciudad: casas por todo el caparazón.' },
  { id: 'mercado', nombre: 'Mercado de la plaza', fama: 250, texto: 'Llegan más puestos: pociones de dudosa receta, mapas viejos y curiosidades.' },
  { id: 'forja', nombre: 'Bruna enciende la forja', rescate: 'bruna', texto: 'Rescatad a Bruna en las Celdas de Hierro y la forja volverá a arder.', pronto: true },
  { id: 'faro', nombre: 'El Faro de Velmor', historia: 'velmor', texto: 'Al terminar la historia de Velmor, se levanta un faro en el lomo de Morrandar.' }
];

// Obras que se pagan con el oro del banco del viajero.
export const OBRAS = [
  { id: 'bandera', nombre: 'Bandera en el mirador', precio: 80, texto: 'Una bandera con tu emblema ondea sobre la cabeza de Morrandar.' },
  { id: 'jardin', nombre: 'Jardín de setas brillantes', precio: 150, texto: 'Setas que brillan de noche junto a la casa de Madre Hiel.' },
  { id: 'fuente', nombre: 'Fuente de tinta', precio: 250, texto: 'Una fuente en la plaza. El agua es negra y huele a libro nuevo.' },
  { id: 'muelle', nombre: 'Muelle de madera', precio: 400, texto: 'Un muelle para que atraquen los barcos de papel que pasan.' }
];

// ---------- Estado (en ficha.tortuga) ----------
export function estadoPueblo(f) {
  const t = (f.tortuga ||= {});
  // Fichas de antes del pueblo: la fama sale de lo que ya habías jugado.
  if (t.fama == null) t.fama = (f.diario?.victorias || 0) * 10 + (f.diario?.derrotas || 0) * 3 + (f.diario?.jefes || 0) * 3;
  t.obras ||= {}; t.historias ||= {}; t.rescatados ||= []; t.vistos ||= {}; t.encargos ||= null;
  return t;
}
export function desbloqueado(t, m) {
  if (m.historia) return !!t.historias?.[m.historia];
  if (m.rescate) return (t.rescatados || []).includes(m.rescate);
  return (t.fama || 0) >= m.fama;
}
// Todo lo que hay: { farolillos: true, mordo: true, fuente: true, … }
export function lo(t) {
  const out = {};
  for (const m of MEJORAS) if (desbloqueado(t, m)) out[m.id] = true;
  for (const o of OBRAS) if (t.obras?.[o.id]) out[o.id] = true;
  return out;
}
// Lo nuevo desde la última visita (y se marca como visto).
export function novedades(t) {
  const hay = lo(t), nuevas = [];
  for (const id of Object.keys(hay)) if (!t.vistos[id]) { t.vistos[id] = Date.now(); nuevas.push(id); }
  return nuevas.map((id) => MEJORAS.find((m) => m.id === id) || OBRAS.find((o) => o.id === id)).filter(Boolean);
}

// ---------- Fama por cada misión (la llama registrarMision) ----------
export function famaDeMision(estado, c) {
  if (estado.pruebas) return 0;
  const gana = c.resultado === 'victoria';
  let n = gana ? 10 : 3;
  if (gana) n += 3 * (c.jefes?.length || 0);
  if (estado.aleatorio && gana) n += Math.min(10, Math.floor((c.numero || 1) / 2));
  if (estado.limbo && gana) n += 10;     // traer a alguien del Limbo da mucho que hablar
  return n;
}

// ---------- Obras ----------
export function construir(f, id) {
  const o = OBRAS.find((x) => x.id === id), t = estadoPueblo(f);
  if (!o) return 'Esa obra no existe.';
  if (t.obras[id]) return 'Ya está construida.';
  if ((f.banco || 0) < o.precio) return `Hacen falta ${o.precio} monedas en el banco (tienes ${f.banco || 0}).`;
  f.banco -= o.precio;
  t.obras[id] = Date.now();
  return null;
}

// ---------- Encargos de la semana (en el tablón) ----------
// Tres retos que cambian cada semana; se miden con el diario del viajero.
const TIPOS = [
  { id: 'misiones', texto: (n) => `Jugad ${n} misiones`, n: [3, 4, 5], campo: 'misiones' },
  { id: 'victorias', texto: (n) => `Ganad ${n} misiones`, n: [2, 3], campo: 'victorias' },
  { id: 'jefes', texto: (n) => n === 1 ? 'Venced a un jefe' : `Venced a ${n} jefes`, n: [1, 2], campo: 'jefes' },
  { id: 'monstruos', texto: (n) => `Acabad con ${n} monstruos`, n: [15, 25, 40], campo: 'monstruos' }
];
export const RECOMPENSA_ENCARGO = 8;
const semanaDe = (fecha = Date.now()) => { const d = new Date(fecha); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
function azarSemana(semana) { let h = 7; for (const c of semana) h = (h * 31 + c.charCodeAt(0)) >>> 0; return () => ((h = (h * 1103515245 + 12345) >>> 0) / 4294967296); }
export function encargos(f) {
  const t = estadoPueblo(f), semana = semanaDe();
  if (t.encargos?.semana !== semana) {
    const r = azarSemana(semana), tipos = TIPOS.slice().sort(() => r() - .5).slice(0, 3);
    t.encargos = { semana, base: { ...f.diario }, lista: tipos.map((x) => ({ id: x.id, n: x.n[Math.floor(r() * x.n.length)] })), cobrados: [] };
  }
  return t.encargos.lista.map((e) => {
    const tipo = TIPOS.find((x) => x.id === e.id);
    const hecho = Math.max(0, (f.diario[tipo.campo] || 0) - (t.encargos.base[tipo.campo] || 0));
    return { id: e.id, texto: tipo.texto(e.n), n: e.n, hecho: Math.min(hecho, e.n), listo: hecho >= e.n, cobrado: t.encargos.cobrados.includes(e.id) };
  });
}
export function cobrarEncargo(f, id) {
  const e = encargos(f).find((x) => x.id === id), t = estadoPueblo(f);
  if (!e) return 'Ese encargo no está en el tablón.';
  if (e.cobrado) return 'Ya lo cobraste.';
  if (!e.listo) return 'Todavía no está hecho.';
  t.encargos.cobrados.push(id);
  t.fama += RECOMPENSA_ENCARGO;
  return null;
}
