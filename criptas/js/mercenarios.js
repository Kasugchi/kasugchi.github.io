// =============================================================
//  MERCENARIOS: gente del camino que se alquila en la cantina de Rufo
//  Se pagan por cripta: bajan contigo la próxima vez (normal o heroica) y
//  pelean a tu lado con cabeza propia. Si caen, se acabó por esa cripta.
//  Los números crecen con tu nivel, para que valgan también en las heroicas altas.
// =============================================================

export const MERCENARIOS = {
  curandera: {
    nombre: 'Tomasa la Curandera', icono: '💚', rol: 'Cura al que más lo necesite',
    texto: 'Cura 3 al que baje de la mitad, unas cuantas veces por cripta. Pega flojito con su cayado.',
    aspecto: { raza: 'humano', clase: 'mago', colores: { ropa: '#e8f0e0', piel: '#e2b48c', pelo: '#b8b8b0' } },
    stats: (n) => ({ cuerpo: 6 + Math.floor(n / 2), ataque: 1 + Math.floor(n / 4), defensa: 2 + Math.floor(n / 4), mover: 6, alcance: 1, curas: 3 + Math.floor(n / 3), cura: 3 + Math.floor(n / 6) }),
    precio: (n) => 70 + n * 12,
    frases: ['¿Dónde duele? No me lo digas: en todas partes.', 'Tengo tila, vendas y paciencia. Esta última se acaba antes.', 'Cobro por adelantado. Los muertos pagan fatal.']
  },
  escudero: {
    nombre: 'Gervasio el Escudero', icono: '🛡️', rol: 'Se pone delante y aguanta',
    texto: 'Mucha vida y mucho escudo. Los bichos de al lado le pegan a él antes que a ti.',
    aspecto: { raza: 'enano', clase: 'barbaro', colores: { ropa: '#5a6a7a', piel: '#d8a07a', pelo: '#6a4a2a' } },
    stats: (n) => ({ cuerpo: 8 + n, ataque: 2 + Math.floor(n / 3), defensa: Math.min(6, 4 + Math.floor(n / 3)), mover: 5, alcance: 1, provoca: true }),
    precio: (n) => 60 + n * 10,
    frases: ['Yo me pongo delante. Tú pega fuerte, que yo no llego.', 'Mi escudo ha parado de todo. Menos a mi suegra.', 'Si oyes un «¡clonk!», soy yo trabajando.']
  }
};
