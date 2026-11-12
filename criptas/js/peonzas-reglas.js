// =============================================================
//  LAS PEONZAS DE RUFO: reglas puras (sin pantalla, sin red).
//  Se juega por rondas: los dos eligen un tiro a la vez y se resuelve con una semilla,
//  así que dos pantallas distintas (tú y tu hermano) llegan siempre al mismo resultado.
//    💥 Embestida gana a 🌀 Girar · 🌀 Girar gana a 🛡️ Aguantar · 🛡️ Aguantar gana a 💥 Embestida
//  Pierde quien se queda sin giro (se para) o sale del plato (el borde llega a 100).
// =============================================================

export const TIROS = {
  E: { n: 'Embestida', e: '💥', t: 'Te lanzas a por el otro. Pega fuerte y lo empuja al borde, pero rebota contra quien aguanta.' },
  A: { n: 'Aguantar', e: '🛡️', t: 'Te plantas. Hace rebotar al que embiste (y le duele), pero el que gira te va comiendo el giro.' },
  G: { n: 'Girar', e: '🌀', t: 'Das vueltas sin parar y le gastas el giro a quien se planta. Si te embisten, te llevas el golpe entero.' }
};
export const VENCE = { E: 'G', G: 'A', A: 'E' };    // E vence a G, G vence a A, A vence a E
export const CONTRA = { E: 'A', G: 'E', A: 'G' };   // lo que vence a cada tiro

// Cada efecto vale para un tiro y gasta una carga SOLO si llega a servir: es una apuesta a lo que hará el otro.
export const EFECTOS = {
  fuego: { n: 'Ascuas', e: '🔥', en: 'E', t: 'Tu embestida pega la mitad más (si da en el blanco).' },
  iman: { n: 'Imán', e: '🧲', en: 'E', t: 'Tu embestida empuja el doble hacia el borde.' },
  rayo: { n: 'Calambre', e: '⚡', en: 'E', t: 'Rompe la guardia: si el otro aguanta, no rebotas y le quitas giro.' },
  escarcha: { n: 'Escarcha', e: '🧊', en: 'A', t: 'Si te embisten mientras aguantas, el golpe se lo come el que embistió.' },
  torbellino: { n: 'Torbellino', e: '🌪️', en: 'G', t: 'Si te embisten mientras giras, lo esquivas del todo y le devuelves un trompazo.' }
};

// ---------- las piezas ----------
// a = ataque, p = peso, g = aguante. precio (tienda de Rufo) o premio (un rival te la da la primera vez que le ganas)
export const HUECOS_PEONZA = { aro: { n: 'Aro', e: '⭕' }, disco: { n: 'Disco', e: '💿' }, punta: { n: 'Punta', e: '📍' } };
export const PIEZAS_P = {
  aro_chapa: { hueco: 'aro', n: 'Chapa de refresco', a: 2, p: 1, g: 1, efecto: 'fuego', cargas: 2, color: '#d8584a', forma: 'chapa' },
  aro_cuchara: { hueco: 'aro', n: 'Cuchara doblada', a: 3, p: 0, g: 1, efecto: 'rayo', cargas: 2, color: '#c8c8d8', forma: 'cuchara', precio: { chatarra: 4, oro: 40 } },
  aro_tuerca: { hueco: 'aro', n: 'Tuerca gorda', a: 1, p: 3, g: 1, efecto: 'escarcha', cargas: 2, color: '#8a9ab0', forma: 'tuerca', precio: { chatarra: 4, oro: 40 } },
  aro_aspas: { hueco: 'aro', n: 'Aspas de ventilador', a: 1, p: 0, g: 3, efecto: 'torbellino', cargas: 3, color: '#6ad0c8', forma: 'aspas', precio: { chatarra: 5, oro: 50 } },
  aro_nevera: { hueco: 'aro', n: 'Aro de nevera', a: 2, p: 2, g: 1, efecto: 'iman', cargas: 3, color: '#e8e0d0', forma: 'llanta', premio: 'Doña Escarcha' },
  aro_sierra: { hueco: 'aro', n: 'Hoja de sierra', a: 4, p: 0, g: 0, efecto: 'iman', cargas: 2, color: '#b8b8c0', forma: 'sierra', premio: 'Rufo' },
  dis_tapa: { hueco: 'disco', n: 'Tapa de olla', a: 0, p: 2, g: 2, color: '#a8a8b8' },
  dis_moneda: { hueco: 'disco', n: 'Moneda gorda', a: 0, p: 3, g: 1, color: '#e8c04a', premio: 'Pip' },
  dis_arandela: { hueco: 'disco', n: 'Arandela', a: 0, p: 1, g: 3, color: '#7a8a9a', precio: { chatarra: 3, oro: 30 } },
  dis_plomo: { hueco: 'disco', n: 'Plomada de pescar', a: 0, p: 4, g: 0, color: '#5a5a6a', precio: { chatarra: 5, oro: 50 } },
  dis_cd: { hueco: 'disco', n: 'CD rayado', a: 1, p: 0, g: 4, color: '#c8a8e8', precio: { chatarra: 5, oro: 50 } },
  dis_yunque: { hueco: 'disco', n: 'Yunquecillo', a: 1, p: 5, g: 0, color: '#3a3a48', premio: 'Mordo' },
  pun_chincheta: { hueco: 'punta', n: 'Chincheta', a: 1, p: 0, g: 1, color: '#e8d85a' },
  pun_clavo: { hueco: 'punta', n: 'Clavo', a: 3, p: 0, g: 0, color: '#9a6a4a', precio: { chatarra: 4, oro: 40 } },
  pun_bola: { hueco: 'punta', n: 'Rodamiento', a: 0, p: 0, g: 3, color: '#d8d8e8', precio: { chatarra: 4, oro: 40 } },
  pun_tapon: { hueco: 'punta', n: 'Tapón de corcho', a: 0, p: 2, g: 1, color: '#c8a070', precio: { chatarra: 3, oro: 30 } },
  pun_canica: { hueco: 'punta', n: 'Canica', a: 0, p: 1, g: 2, color: '#5ab8e8', precio: { chatarra: 3, oro: 30 } },
  pun_boli: { hueco: 'punta', n: 'Punta de boli', a: 2, p: 0, g: 2, color: '#4a6ad8', premio: 'El Viejo Anzuelo' }
};
export const KIT_P = ['aro_chapa', 'dis_tapa', 'pun_chincheta'];
export const EQUIPO_P = { aro: 'aro_chapa', disco: 'dis_tapa', punta: 'pun_chincheta' };
export const AJUSTES = [-2, -1, 0, 1, 2];

// ---------- tu peonza (en el héroe de aventura: DEF.peonza) ----------
export const peonzaNueva = () => ({ nombre: 'Peonza', piezas: [...KIT_P], equipo: { ...EQUIPO_P }, ajuste: 0, liga: 0, victorias: 0, derrotas: 0 });
export function arreglarP(Q) {   // si falta una pieza o está mal puesta, vuelve la de serie
  let c = false;
  for (const h of Object.keys(HUECOS_PEONZA)) if (PIEZAS_P[Q.equipo?.[h]]?.hueco !== h || !Q.piezas.includes(Q.equipo[h])) { (Q.equipo ||= {})[h] = EQUIPO_P[h]; c = true; }
  for (const id of KIT_P) if (!Q.piezas.includes(id)) { Q.piezas.push(id); c = true; }
  if (!AJUSTES.includes(Q.ajuste)) { Q.ajuste = 0; c = true; }
  return c;
}

// ---------- la peonza como luchadora ----------
// espec = { nombre, piloto, equipo: {aro, disco, punta}, ajuste, frase }
export function luchadora(espec) {
  const pz = Object.values(espec.equipo).map((id) => PIEZAS_P[id]).filter(Boolean);
  const aj = AJUSTES.includes(espec.ajuste) ? espec.ajuste : 0, suma = (k) => pz.reduce((s, x) => s + (x[k] || 0), 0);
  const aro = PIEZAS_P[espec.equipo.aro];
  // apretar las tuercas: cada punto de ataque de más cuesta dos de aguante (y al revés)
  const A = Math.max(1, 1 + suma('a') + aj), P = 1 + suma('p'), G = Math.max(1, 1 + suma('g') - 2 * aj);
  return { nombre: espec.nombre, piloto: espec.piloto, A, P, G, giroMax: 30 + G * 3, efecto: aro?.efecto || null, cargas: aro?.cargas || 0, equipo: espec.equipo, ajuste: aj };
}
// Una peonza a punto de empezar: el lanzamiento (0 a 1) le da hasta un 20 % más de giro
export function empezar(L, lanz) { return { giro: Math.round(L.giroMax * (.8 + .2 * Math.max(0, Math.min(1, lanz)))), borde: 0, cargas: L.cargas, lanz }; }

// ---------- números al azar repetibles ----------
export function semilla(...partes) { let h = 2166136261; for (const c of partes.join('|')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function azar(s) { return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- una ronda ----------
// o = { t: 'E'|'A'|'G', x: true si quiere gastar el efecto }. Devuelve los estados nuevos y qué ha pasado.
export function ronda(L, S, o, rnd, n) {
  const f = () => .8 + rnd() * .4;
  const golpe = (i, j, m = 1) => Math.max(2, Math.round((L[i].A * 3.2 * f() - L[j].P * 1.8) * m));
  const empuje = (i, j, m = 1) => Math.max(6, Math.round((24 + L[i].A * 6 - L[j].P * 3) * m));
  const quiere = (i) => o[i].x && S[i].cargas > 0 && L[i].efecto && EFECTOS[L[i].efecto].en === o[i].t ? L[i].efecto : null;
  const ef = [quiere(0), quiere(1)];
  const d = [0, 0], p = [0, 0], uso = [false, false], tipo = [];   // daño al giro, empuje al borde, efecto gastado
  const pega = (i, j, m = 1, mp = 1) => { d[j] += golpe(i, j, m); p[j] += empuje(i, j, mp); };
  const choque = (i, j) => {   // i embiste a j
    const ti = o[i].t, tj = o[j].t;
    if (tj === 'G') {
      if (ef[j] === 'torbellino') { uso[j] = true; d[i] += golpe(j, i, .9); p[i] += empuje(j, i, .6); tipo.push('esquiva'); return; }
      const fu = ef[i] === 'fuego', im = ef[i] === 'iman'; uso[i] = fu || im; pega(i, j, fu ? 1.5 : 1, im ? 2 : 1); tipo.push('golpe'); return;
    }
    // j aguanta
    if (ef[i] === 'rayo') { uso[i] = true; d[j] += golpe(i, j, .9) + 3; p[j] += empuje(i, j, .7); tipo.push('guardia rota'); return; }
    if (ef[j] === 'escarcha') { uso[j] = true; d[i] += golpe(i, j, 1.1) + Math.max(2, Math.round(L[j].P * 1.5 * f())); p[i] += 8; tipo.push('devuelto'); return; }
    d[i] += Math.max(2, Math.round(L[j].P * 2 * f() - L[i].A * .5)); p[i] += 8; d[j] += 1; tipo.push('rebote');
  };
  const [a, b] = [o[0].t, o[1].t];
  if (a === b) {
    if (a === 'E') {   // choque de frente: los dos se llevan lo suyo
      for (const [i, j] of [[0, 1], [1, 0]]) { const fu = ef[i] === 'fuego', im = ef[i] === 'iman'; uso[i] = fu || im; d[j] += Math.round(golpe(i, j, (fu ? 1.5 : 1) * .7)); p[j] += Math.round(empuje(i, j, (im ? 2 : 1) * .6)); }
      tipo.push('choque');
    } else if (a === 'A') { d[0] += 2; d[1] += 2; p[0] -= 10; p[1] -= 10; tipo.push('tablas'); }
    else { p[0] -= 10; p[1] -= 10; tipo.push('baile'); }
  } else if (a === 'E' && b === 'G') choque(0, 1);
  else if (b === 'E' && a === 'G') choque(1, 0);
  else if (a === 'E' && b === 'A') choque(0, 1);
  else if (b === 'E' && a === 'A') choque(1, 0);
  else if (a === 'G' && b === 'A') { d[1] += 4 + Math.round(L[0].G * .8); tipo.push('desgaste'); }
  else { d[0] += 4 + Math.round(L[1].G * .8); tipo.push('desgaste'); }
  const gasto = 2 + Math.floor(n / 6);   // el giro se va gastando solo, y cada vez más
  const N = [0, 1].map((i) => ({ ...S[i], giro: S[i].giro - d[i] - gasto, borde: Math.max(0, S[i].borde + p[i] - 3), cargas: S[i].cargas - (uso[i] ? 1 : 0) }));
  return { S: N, d, p, uso, ef, tipo: tipo[0], gasto, fin: terminado(L, N) };
}
// Quién ha ganado (0, 1) o null si siguen; motivo: 'parada' (se queda sin giro) o 'fuera' (sale del plato)
export function terminado(L, S) {
  const cae = [0, 1].map((i) => (S[i].giro <= 0 ? 'parada' : S[i].borde >= 100 ? 'fuera' : null));
  if (!cae[0] && !cae[1]) return null;
  if (cae[0] && cae[1]) { const v = (i) => S[i].giro / L[i].giroMax - S[i].borde / 400; return { ganador: v(0) >= v(1) ? 0 : 1, motivo: 'a la vez' }; }
  return { ganador: cae[0] ? 1 : 0, motivo: cae[0] || cae[1] };
}

// ---------- los rivales de Rufo (y quién pierde qué) ----------
// listo: cuánto adivina lo que vas a hacer; pesos: lo que le gusta hacer
export const RIVALES_P = [
  { quien: 'Pip', nombre: 'La Cucharilla', equipo: { aro: 'aro_chapa', disco: 'dis_tapa', punta: 'pun_chincheta' }, ajuste: 0, pesos: { E: .5, A: .2, G: .3 }, listo: .05, apuesta: 1, frase: '¡Mi peonza gira más que mi madre buscando las llaves!' },
  { quien: 'Mordo', nombre: 'El Pisapapeles', equipo: { aro: 'aro_tuerca', disco: 'dis_plomo', punta: 'pun_tapon' }, ajuste: -1, pesos: { E: .25, A: .55, G: .2 }, listo: .2, apuesta: 2, frase: 'Ni me muevo. Ven tú.' },
  { quien: 'Doña Escarcha', nombre: 'Copo', equipo: { aro: 'aro_aspas', disco: 'dis_cd', punta: 'pun_bola' }, ajuste: -1, pesos: { E: .2, A: .2, G: .6 }, listo: .3, apuesta: 3, frase: 'Gira que gira, y tú sin enterarte.' },
  { quien: 'El Viejo Anzuelo', nombre: 'Cebo', equipo: { aro: 'aro_cuchara', disco: 'dis_arandela', punta: 'pun_clavo' }, ajuste: 1, pesos: { E: .4, A: .3, G: .3 }, listo: .45, apuesta: 4, frase: 'Te leo como un pez en un charco.' },
  { quien: 'Rufo', nombre: 'El Trompo Tornillo', equipo: { aro: 'aro_sierra', disco: 'dis_yunque', punta: 'pun_boli' }, ajuste: 1, pesos: { E: .4, A: .3, G: .3 }, listo: .6, apuesta: 6, frase: '¡Las peonzas las inventé yo! … Vale, no. Pero las perfeccioné.' }
];
export const especRival = (i) => { const r = RIVALES_P[i]; return { nombre: r.nombre, piloto: r.quien, equipo: { ...r.equipo }, ajuste: r.ajuste, frase: r.frase }; };

// Lo que hace la máquina: sus gustos, y a veces adivina lo que vas a hacer (por lo último que hiciste)
export function decisionIA(r, L, S, rnd, ultimoRival) {
  let t;
  if (ultimoRival && rnd() < r.listo) t = CONTRA[ultimoRival];
  else { const x = rnd(); t = x < r.pesos.E ? 'E' : x < r.pesos.E + r.pesos.A ? 'A' : 'G'; }
  const ef = L.efecto && S.cargas > 0 && EFECTOS[L.efecto].en === t && rnd() < (L.efecto === 'fuego' || L.efecto === 'iman' ? .5 : .35);
  return { t, x: !!ef };
}

export const TEXTOS = {
  esquiva: '¡Torbellino! Lo esquiva y le devuelve el trompazo', golpe: '¡Pam! Embestida en todo el centro', 'guardia rota': '¡Calambre! La guardia salta por los aires',
  devuelto: '¡Escarcha! El golpe se lo come el que embistió', rebote: '¡Boing! Rebota contra la guardia', choque: '¡Choque de frente! Chispas por todas partes',
  tablas: 'Los dos se plantan y se miran. Tablas', baile: 'Los dos dan vueltas como si nada', desgaste: 'Gira que gira: le va comiendo el giro al que se planta'
};
