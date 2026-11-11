// =============================================================
//  DIFICULTAD: cada zona tiene su fuerza, y las criptas tienen versión heroica
//  - Normal: los monstruos son como los de la zona (el claro, flojos; las minas, duros).
//    Si vuelves al claro con nivel 8, te paseas: se nota lo que has crecido.
//  - Heroica (se elige al bajar): se ajusta al nivel de los héroes, para que ni con
//    un montón de dados se limpie un campamento de un golpe. Da mejor botín.
//  - En compañía: cada héroe que entra en una pelea hace a los bichos más duros.
//  Los números salen de herramientas/simulacion.py (si los tocas, cópialos allí).
// =============================================================

// Escalón de la zona: 0 en la de inicio y uno más por cada tramo del viaje
export const escalonZona = (par) => Math.max(0, (par?.fuerza || 1) - 1) * 1.7;

// Para qué nivel de héroe está pensada cada zona (lo que se enseña en la portada y en el atril)
export const NIVEL_ZONA = { 1: '1 a 3', 2: '4 a 6', 3: '7 a 10' };
export const textoNivelZona = (par) => `Nivel ${NIVEL_ZONA[par?.fuerza || 1] || '1 a 3'}`;
// Los encargos del tablón ya traen su nivel (más alto cuanto más difícil): de ahí sale lo duros que son sus bichos
export const escalonEncargo = (nivel) => Math.max(0, (nivel - 2) / 2.2);

// La experiencia: las zonas altas dan más, y los bichos que ya te quedan pequeños, poca
// (como los «grises» de otros juegos: farmear el claro a nivel 8 no sube nada). La heroica y los encargos van a tu medida.
const TOPE_ZONA = { 1: 3, 2: 6, 3: 10 };
export function factorXP({ par, nivel = 1, heroica = false, encargo = false }) {
  const f = par?.fuerza || 1, extra = 1 + (f - 1) * .5;
  if (heroica || encargo) return extra;
  const sobra = nivel - (TOPE_ZONA[f] ?? 8);
  return extra * (sobra > 0 ? Math.max(.1, 1 - sobra * .25) : 1);
}

// Lo duro que es una pelea: en normal, la zona; en heroica, el nivel del héroe (y nunca menos que la zona + 1)
// Cada rango de heroica (I, II, III…) sube un escalón y medio: el III está pensado para ir en grupo
// (dos héroes bien forjados y algún mercenario que cure)
export function escalon({ par, heroica = false, nivel = 1, rango = 1 }) {
  const z = escalonZona(par);
  return heroica ? Math.max(z + 1, (nivel - 1) / 2.2 + .6) + (rango - 1) * 1.6 : z;
}
export const RANGOS = ['I', 'II', 'III', 'IV', 'V'];
export const MAX_RANGO = 5;

// Los números de un monstruo, reforzados según el escalón (el jefe crece más en vida)
export function reforzar(m, t, jefe = false) {
  if (!t) return m;
  return {
    ...m,
    cuerpo: m.cuerpo + Math.round(t * (jefe ? 2.6 : 1.4)),
    ataque: Math.min(10, m.ataque + Math.round(t * .9)),
    defensa: Math.min(6, m.defensa + Math.round(t * .4))   // poca defensa: si no, el mago y el ingeniero (2 dados) no hacen nada
  };
}

// Lo que gana de más quien baja en heroica (más cuanto más alto el rango); la esencia heroica solo sale aquí
export const premioHeroica = (r = 1) => ({ xp: 1.5 + (r - 1) * .25, oro: 2 + (r - 1) * .5, botin: 1 + r, esencia: r });
export const PREMIO_HEROICA = premioHeroica(1);

// Cada héroe de más en la pelea: un poco más de vida a cada bicho (el jefe, más)
export const extraPorCompanero = (u) => (u.jefe ? 3 : 1);

// ---------- Afijos de la semana (solo en las heroicas): cada semana, la misma cripta se juega distinto ----------
export const AFIJOS = {
  explosivos: { n: 'Explosivos', e: '💥', t: 'Los bichos revientan al morir: quitan 1 a quien esté pegado. No te quedes al lado.' },
  regeneran: { n: 'Duros de pelar', e: '🩸', t: 'Al final de su turno, cada bicho herido se cura 1. Remata antes de cambiar de blanco.' },
  furia: { n: 'Furia', e: '😡', t: 'Los bichos por debajo de la mitad de vida tiran 2 dados más al atacar.' },
  blindados: { n: 'Blindados', e: '🛡️', t: 'Todos los bichos tienen un dado más de defensa.' }
};
// La semana del año decide el afijo (el mismo para todos: así la familia juega la misma semana)
export function afijoDeLaSemana(fecha = new Date()) {
  const semana = Math.floor((fecha - new Date(2026, 0, 5)) / (7 * 864e5));
  const ids = Object.keys(AFIJOS); return ids[((semana % ids.length) + ids.length) % ids.length];
}
// Semana (para la esencia doble de la primera heroica de cada semana)
export const numeroSemana = (fecha = new Date()) => Math.floor((fecha - new Date(2026, 0, 5)) / (7 * 864e5));
