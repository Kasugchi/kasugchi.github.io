// =============================================================
//  EQUIPO (a lo Monster Hunter): casco, peto y botas de cada zona
//  Cada pieza da una habilidad (no más dados) y se mejora en la forja hasta +3.
//  Se hacen con los materiales de su zona: los bichos pequeños sueltan el común
//  (no siempre) y los jefes el raro (en heroica, siempre). Se pueden mezclar
//  piezas de juegos distintos; con las 3 de un mismo juego, su extra.
//  Lo que tienes: h.piezas { 'pirata.casco': nivel }; lo que llevas: h.equipo { casco: 'pirata' }.
// =============================================================

export const HUECOS = { casco: { n: 'Casco', e: '🪖' }, peto: { n: 'Peto', e: '🦺' }, botas: { n: 'Botas', e: '👢' } };

// v(nivel): cuánto da la habilidad según la mejora de la pieza (0 = recién hecha)
export const JUEGOS = {
  hueso: {
    n: 'de hueso', zona: 'claro', comun: 'hueso', raro: 'femur',
    piezas: {
      casco: { n: 'Yelmo de calavera', ef: 'cuerpo', v: (l) => 1 + l, t: (x) => `+${x} de cuerpo` },
      peto: { n: 'Costillar', ef: 'cuerpo', v: (l) => 2 + l, t: (x) => `+${x} de cuerpo` },
      botas: { n: 'Botas de fémur', ef: 'pasos', v: (l) => 1 + (l >= 2 ? 1 : 0), t: (x) => `+${x} ${x === 1 ? 'casilla' : 'casillas'} al moverte` }
    },
    extra: { ef: 'curaAlGanar', v: 1, t: 'Juego completo: al ganar cada pelea te curas 1 más' }
  },
  pirata: {
    n: 'pirata', zona: 'isla', comun: 'salitre', raro: 'perla',
    piezas: {
      casco: { n: 'Tricornio con parche', ef: 'primerAtaque', v: (l) => 1 + Math.floor(l / 2), t: (x) => `tu primer ataque de cada pelea tira ${x} ${x === 1 ? 'dado' : 'dados'} más` },
      peto: { n: 'Casaca curtida', ef: 'primerGolpe', v: (l) => 1 + (l >= 3 ? 1 : 0), t: (x) => x === 1 ? 'el primer golpe que te dan en cada pelea no cuenta' : `los ${x} primeros golpes que te dan en cada pelea no cuentan` },
      botas: { n: 'Botas de cubierta', ef: 'pasos', v: (l) => 2 + (l >= 2 ? 1 : 0), t: (x) => `+${x} casillas al moverte` }
    },
    extra: { ef: 'contraJefes', v: 1, t: 'Juego completo: ¡al abordaje! Contra los jefes tiras 1 dado más' }
  }
};

// Lo que cuesta hacer una pieza (nivel 0) o mejorarla (1 a 3). El +3, con esencia heroica (cosa de Bruna).
export function costePieza(juego, hueco, nivel) {
  const J = JUEGOS[juego], peto = hueco === 'peto' ? 1 : 0, caro = juego === 'hueso' ? 1 : 2;
  const c = { oro: Math.round((40 + nivel * 50) * caro * (1 + peto * .3)) };
  c[J.comun] = 3 + nivel * 2 + peto;
  if (nivel >= 1 || juego !== 'hueso') c[J.raro] = Math.max(1, nivel);
  if (nivel >= 3) c.esencia = 3;
  return c;
}
export const MAX_NIVEL_PIEZA = 3;

// Las habilidades de todo lo que llevas puesto, sumadas: { cuerpo, pasos, primerAtaque, primerGolpe, curaAlGanar, contraJefes }
export function efectosEquipo(h) {
  const ef = {}, porJuego = {};
  for (const [hueco, juego] of Object.entries(h?.equipo || {})) {
    const P = JUEGOS[juego]?.piezas[hueco], nivel = h.piezas?.[`${juego}.${hueco}`];
    if (!P || nivel == null) continue;
    ef[P.ef] = (ef[P.ef] || 0) + P.v(nivel);
    porJuego[juego] = (porJuego[juego] || 0) + 1;
  }
  for (const [juego, n] of Object.entries(porJuego)) if (n >= 3) { const X = JUEGOS[juego].extra; ef[X.ef] = (ef[X.ef] || 0) + X.v; }
  return ef;
}
// Textos para la ficha y la forja
export function textoPieza(juego, hueco, nivel) { const P = JUEGOS[juego].piezas[hueco]; return `${P.n}${nivel ? ` +${nivel}` : ''}: ${P.t(P.v(nivel || 0))}`; }
export function textoEquipo(h) {
  const l = []; const porJuego = {};
  for (const [hueco, juego] of Object.entries(h?.equipo || {})) { const nv = h.piezas?.[`${juego}.${hueco}`]; if (nv == null || !JUEGOS[juego]) continue; l.push(`${HUECOS[hueco].e} ${textoPieza(juego, hueco, nv)}`); porJuego[juego] = (porJuego[juego] || 0) + 1; }
  for (const [juego, n] of Object.entries(porJuego)) if (n >= 3) l.push(`✨ ${JUEGOS[juego].extra.t}`);
  return l;
}
