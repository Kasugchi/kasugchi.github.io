// =============================================================
//  LA COCINA DE MARGA: recetas y menú del día
//  Cada receta: nombre, emoji, precio (oro del banco), flores opcionales,
//  efecto (dura hasta que duermas) y quién la adora (regalarla da más amistad).
//  Efectos: 'veloz' (andas más rápido), 'flores' (te caben 8 flores),
//  'amistad' (la primera charla del día con cada vecino cuenta doble), null (solo sabe rico).
//  Para añadir una receta basta con poner otra línea aquí.
// =============================================================
export const RECETAS = {
  tostada: { n: 'Tostada con mermelada', e: '🍞', precio: 25, efecto: null, fav: ['pip'], nota: 'La mermelada es de la casa. El pan también. La tostadora, no sé.' },
  cafe: { n: 'Café de la casa', e: '☕', precio: 15, efecto: null, fav: ['brumas'], nota: 'Negro como una novela negra. Y casi igual de amargo.' },
  chocolate: { n: 'Chocolate espeso', e: '🍫', precio: 35, efecto: null, fav: ['pip', 'lumi'], nota: 'Tan espeso que la cuchara se queda de pie. Por si quieres comprobarlo.' },
  galleta: { n: 'Galleta normal (de verdad)', e: '🍪', precio: 30, efecto: null, fav: ['escarcha'], nota: 'Receta de Escarcha, ingredientes míos. Cero ranas. Casi seguro.' },
  empanada: { n: 'Empanada de viajero', e: '🥟', precio: 45, efecto: 'veloz', fav: ['rufo'], nota: 'Se come andando. Se digiere corriendo.' },
  zarzaparrilla: { n: 'Ron de zarzaparrilla', e: '🥤', precio: 50, efecto: 'veloz', fav: ['rufo'], nota: 'Sin ron. Es lo que le digo a Rufo cada vez, y cada vez se lo cree.' },
  pescado: { n: 'Pescadito frito', e: '🐟', precio: 60, efecto: 'veloz', fav: ['gato', 'anzuelo'], nota: 'Sin espinas. Si encuentras una, es de regalo.' },
  rana: { n: 'Ancas de rana al ajillo', e: '🐸', precio: 55, efecto: 'veloz', fav: ['mordo', 'escarcha'], nota: 'Cortesía de Mordo. Pregunta lo justo, que él también.' },
  sopa: { n: 'Sopa de nabo con versos', e: '🥣', precio: 40, efecto: 'amistad', fav: ['bartolome'], nota: 'Los nabos son de Sir Bartolomé. Los versos, también. Los grumos, míos.' },
  caldo: { n: 'Caldo del doblón', e: '🪙', precio: 65, efecto: 'amistad', fav: ['hiel'], nota: 'Lleva una moneda en el fondo. Se la devuelvo a quien la encuentra. Casi siempre.' },
  tarta: { n: 'Tarta de manzana', e: '🥧', precio: 90, efecto: 'amistad', fav: ['brumas', 'pip'], nota: 'Esta sí que no desaparece. Me la quedo vigilando con un ojo. Y con el otro.' },
  paella: { n: 'Paella de la tortuga', e: '🥘', precio: 110, efecto: 'amistad', fav: ['anzuelo', 'rufo'], nota: 'Sin tortuga, que conste. Morrandar escucha.' },
  tortilla: { n: 'Tortilla de pétalos', e: '🌸', precio: 50, flores: 1, efecto: 'flores', fav: ['lumi'], nota: 'Los pétalos los pones tú. Yo les doy el punto.' },
  ensalada: { n: 'Ensalada de jardín', e: '🥗', precio: 40, flores: 2, efecto: 'flores', fav: ['guia'], nota: 'Más flor que ensalada. Pero crujiente.' }
};
export const EFECTOS = {
  veloz: 'Andas más rápido hasta que duermas.',
  flores: 'Te caben 8 flores en el bolsillo, hasta que duermas.',
  amistad: 'Hasta que duermas, la primera charla del día con cada vecino cuenta doble.'
};
export const PLATOS_MENU = 4;
// Los platos de hoy: siempre los mismos para el mismo día (como la tienda de Rufo)
export function menuHoy(dia) {
  const pool = Object.keys(RECETAS);
  let s = (dia * 6007 + 13) % 233280; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, PLATOS_MENU);
}
