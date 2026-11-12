// =============================================================
//  LAS PEONZAS DE RUFO: reglas puras (sin pantalla, sin red).
//  La pelea es una simulación física del plato, casi automática: lo que decide es el montaje.
//    · El peso resta giro de salida (pesada = gira menos) pero empuja más y aguanta los golpes.
//    · El aguante gasta el giro más despacio; el ataque hace que persiga al otro y pegue más fuerte.
//    · El sentido de giro lo da el lanzador (derecha o izquierda): dos peonzas que giran igual rebotan
//      (se hacen poco daño); las que giran al revés se engranan y se comen el giro la una a la otra.
//    · El lanzador también da potencia y «empujones»: el único control que tienes durante la pelea.
//  La simulación solo usa sumas, productos y raíces (y una semilla), así que dos pantallas distintas
//  (tú y tu hermano) obtienen exactamente lo mismo. Va por segmentos de 4 s: entre uno y otro eliges.
// =============================================================

// ---------- empujones y efectos ----------
export const RUMBOS = {
  E: { n: 'Al rival', e: '🎯', t: 'Un empujón hacia el otro.' },
  C: { n: 'Al centro', e: '🛡️', t: 'Un empujón hacia el centro (para no caerte).' },
  L: { n: 'Rodear ↺', e: '↺', t: 'Un empujón de lado, en contra del reloj.' },
  R: { n: 'Rodear ↻', e: '↻', t: 'Un empujón de lado, a favor del reloj.' }
};
// Un efecto dura el segmento en el que lo gastas (cuatro segundos)
export const EFECTOS = {
  fuego: { n: 'Ascuas', e: '🔥', t: 'Todo lo que pegues este tramo, la mitad más fuerte.' },
  iman: { n: 'Imán', e: '🧲', t: 'Atrae al otro hacia ti un buen rato: se acabó correr.' },
  rayo: { n: 'Calambre', e: '⚡', t: 'Tus golpes se engranan siempre, aunque giréis igual, y pegan un poco más.' },
  escarcha: { n: 'Escarcha', e: '🧊', t: 'Te llevas la mitad de daño este tramo y devuelves un cuarto.' },
  torbellino: { n: 'Torbellino', e: '🌪️', t: 'Recuperas giro de golpe, nada más usarlo.' }
};

// ---------- las piezas ----------
// a = ataque, p = peso, g = aguante. Los lanzadores: sentido (1 derecha ↻, -1 izquierda ↺), pot (potencia) y emp (empujones por pelea).
// precio (tienda de Rufo) o premio (un rival te la da la primera vez que le ganas)
export const HUECOS_PEONZA = { aro: { n: 'Aro', e: '⭕' }, disco: { n: 'Disco', e: '💿' }, punta: { n: 'Punta', e: '📍' }, lanzador: { n: 'Lanzador', e: '🎯' } };
export const PIEZAS_P = {
  aro_chapa: { hueco: 'aro', n: 'Chapa de refresco', a: 2, p: 1, g: 1, efecto: 'fuego', cargas: 2, color: '#d8584a', forma: 'chapa' },
  aro_cuchara: { hueco: 'aro', n: 'Cuchara doblada', a: 3, p: 0, g: 1, efecto: 'rayo', cargas: 2, color: '#c8c8d8', forma: 'cuchara', precio: { chatarra: 4, oro: 40 } },
  aro_tuerca: { hueco: 'aro', n: 'Tuerca gorda', a: 1, p: 3, g: 1, efecto: 'escarcha', cargas: 2, color: '#8a9ab0', forma: 'tuerca', precio: { chatarra: 4, oro: 40 } },
  aro_aspas: { hueco: 'aro', n: 'Aspas de ventilador', a: 1, p: 0, g: 3, efecto: 'torbellino', cargas: 3, color: '#6ad0c8', forma: 'aspas', precio: { chatarra: 5, oro: 50 } },
  aro_nevera: { hueco: 'aro', n: 'Aro de nevera', a: 2, p: 2, g: 1, efecto: 'iman', cargas: 3, color: '#e8e0d0', forma: 'llanta', premio: 'Doña Escarcha' },
  aro_sierra: { hueco: 'aro', n: 'Hoja de sierra', a: 4, p: 0, g: 0, efecto: 'fuego', cargas: 3, color: '#b8b8c0', forma: 'sierra', premio: 'Rufo' },
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
  pun_boli: { hueco: 'punta', n: 'Punta de boli', a: 2, p: 0, g: 2, color: '#4a6ad8', premio: 'El Viejo Anzuelo' },
  lz_cuerda: { hueco: 'lanzador', n: 'Lanzador de cuerda', s: 1, pot: 1, emp: 0, color: '#d8c8a8' },
  lz_zurdo: { hueco: 'lanzador', n: 'Lanzador zurdo', s: -1, pot: 1, emp: 0, color: '#a8c8d8', precio: { chatarra: 4, oro: 40 } },
  lz_resorte: { hueco: 'lanzador', n: 'Lanzador de resorte', s: 1, pot: 1.08, emp: 2, color: '#e8a8a8', precio: { chatarra: 7, oro: 80 } },
  lz_turbo: { hueco: 'lanzador', n: 'Zurdo turbo', s: -1, pot: 1.12, emp: 3, color: '#a8e8c8', premio: 'Doña Escarcha' },
  lz_cremallera: { hueco: 'lanzador', n: 'Cremallera de Rufo', s: 1, pot: 1.2, emp: 4, color: '#ffd27a', premio: 'Rufo' }
};
export const KIT_P = ['aro_chapa', 'dis_tapa', 'pun_chincheta', 'lz_cuerda'];
export const EQUIPO_P = { aro: 'aro_chapa', disco: 'dis_tapa', punta: 'pun_chincheta', lanzador: 'lz_cuerda' };
export const AJUSTES = [-2, -1, 0, 1, 2];
export const textoLanzador = (P) => `${P.s > 0 ? '↻ derecha' : '↺ izquierda'} · potencia ${Math.round(P.pot * 100)} %${P.emp ? ` · ${P.emp} empujones` : ' · sin empujones'}`;

// ---------- tu peonza (en el héroe de aventura: DEF.peonza) ----------
export const peonzaNueva = () => ({ nombre: 'Peonza', piezas: [...KIT_P], equipo: { ...EQUIPO_P }, ajuste: 0, liga: 0, victorias: 0, derrotas: 0 });
export function arreglarP(Q) {   // si falta una pieza o está mal puesta, vuelve la de serie
  let c = false;
  Q.piezas ||= []; Q.equipo ||= {};
  for (const id of KIT_P) if (!Q.piezas.includes(id)) { Q.piezas.push(id); c = true; }
  for (const h of Object.keys(HUECOS_PEONZA)) if (PIEZAS_P[Q.equipo[h]]?.hueco !== h || !Q.piezas.includes(Q.equipo[h])) { Q.equipo[h] = EQUIPO_P[h]; c = true; }
  if (!AJUSTES.includes(Q.ajuste)) { Q.ajuste = 0; c = true; }
  return c;
}

// ---------- la peonza como luchadora ----------
// espec = { nombre, piloto, equipo: {aro, disco, punta, lanzador}, ajuste, frase }
export function luchadora(espec) {
  const eq = { ...EQUIPO_P, ...espec.equipo }, pz = ['aro', 'disco', 'punta'].map((h) => PIEZAS_P[eq[h]]).filter(Boolean), lz = PIEZAS_P[eq.lanzador] || PIEZAS_P.lz_cuerda;
  const aj = AJUSTES.includes(espec.ajuste) ? espec.ajuste : 0, suma = (k) => pz.reduce((s, x) => s + (x[k] || 0), 0), aro = PIEZAS_P[eq.aro];
  // apretar las tuercas: cada punto de ataque de más cuesta dos de aguante (y al revés)
  const A = Math.max(1, 1 + suma('a') + aj), P = 1 + suma('p'), G = Math.max(1, 1 + suma('g') - 2 * aj);
  return { nombre: espec.nombre, piloto: espec.piloto, A, P, G, s: lz.s, pot: lz.pot, emp: lz.emp, efecto: aro?.efecto || null, cargas: aro?.cargas || 0, equipo: eq, ajuste: aj };
}

// ---------- números al azar repetibles ----------
export function semilla(...partes) { let h = 2166136261; for (const c of partes.join('|')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function azar(s) { return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- la simulación ----------
export const SEG = 120, DT = 1 / 30, RT = .55, BORDE = 3.0;   // un segmento son 120 pasos de 1/30 s (4 s)
export const K = { busca: .5, emp: .53, dmgA: .11, dmgP: .06, base: 1.22, d0: 1.5, dv: .44, dg: .29, kc: .1, kb: .2, peso: .04, cA: .45 };   // los números que se afinan con el simulador
const MAX_SEG = 22;   // pasado este tiempo (88 s) gana quien conserve más giro
// Lo que cada una gira al salir: la potencia del lanzador y tu lanzamiento (q de 0 a 1), menos lo que pesa
export const giroInicial = (L, q) => Math.round(100 * L.pot * (.8 + .2 * Math.max(0, Math.min(1, q))) / (1 + K.peso * (L.P - 1)));
export function empezar(L, lanz) {
  return [0, 1].map((i) => {
    const q = Math.max(0, Math.min(1, lanz[i])), lado = i === 0 ? -1 : 1, w0 = giroInicial(L[i], q);
    return { x: lado * 2.4, y: 0, vx: -lado * (2 + 1.8 * q), vy: L[i].s * lado * -1.4, w: w0, w0, m: 1 + .3 * L[i].P, cargas: L[i].cargas, emp: L[i].emp, ef: null };
  });
}
// ¿Tiene algo que decidir entre segmentos? (si ninguno tiene nada, la pelea corre sola)
export const tieneOpciones = (L, t) => t.emp > 0 || (L.efecto && t.cargas > 0);

// Un segmento. ord[i] = { r: 'E'|'C'|'L'|'R'|null, x: true si gasta el efecto }.
// Devuelve el estado nuevo, los fotogramas (para dibujar), los choques y, si ha terminado, quién ha ganado.
export function segmento(L, T0, ord, rnd) {
  const T = T0.map((t) => ({ ...t })), ev = [], frames = [];
  const sq = Math.sqrt, fx = [null, null];
  // al empezar: los empujones y los efectos que se gastan
  for (const i of [0, 1]) {
    const o = ord[i] || {}, t = T[i], r = T[1 - i];
    if (o.r && t.emp > 0) {
      t.emp--; const dx = r.x - t.x, dy = r.y - t.y, d = sq(dx * dx + dy * dy) + 1e-6, px = -t.y, py = t.x, pd = sq(px * px + py * py) + 1e-6;
      const dir = o.r === 'E' ? [dx / d, dy / d] : o.r === 'C' ? [-t.x / pd, -t.y / pd] : o.r === 'L' ? [-py / pd, px / pd] : [py / pd, -px / pd];
      t.vx += dir[0] * 3.2; t.vy += dir[1] * 3.2; ev.push({ t: 0, k: 'empujon', i });
    }
    if (o.x && L[i].efecto && t.cargas > 0) {
      t.cargas--; fx[i] = L[i].efecto; ev.push({ t: 0, k: 'efecto', i, ef: fx[i] });
      if (fx[i] === 'torbellino') t.w = Math.min(t.w0, t.w + 18);
    }
  }
  let fin = null;
  for (let tick = 0; tick < SEG && !fin; tick++) {
    for (const i of [0, 1]) {
      const t = T[i], o = T[1 - i], l = L[i], rr = Math.max(0, t.w / t.w0);
      const r2 = t.x * t.x + t.y * t.y, rad = sq(r2) + 1e-6, dx = o.x - t.x, dy = o.y - t.y, d = sq(dx * dx + dy * dy) + 1e-6;
      const kc = 1 + K.kc * l.P + r2 * K.kb;                          // el cuenco: te devuelve al centro, más fuerte cerca del borde
      let ax = -t.x * kc, ay = -t.y * kc;
      const busca = K.busca * l.A * rr * (d > 1.3 ? 1 : 0);              // las de ataque van a por el otro
      ax += dx / d * busca; ay += dy / d * busca;
      ax += -t.y / rad * l.s * .9 * rr; ay += t.x / rad * l.s * .9 * rr;   // el remolino que da el sentido de giro
      if (fx[1 - i] === 'iman' && tick < 80) { ax += dx / d * 3.4; ay += dy / d * 3.4; }   // el imán del otro tira de ti
      const wob = .5 + (1 - rr) * (1 - rr) * 1.6; ax += (rnd() - .5) * 2 * wob; ay += (rnd() - .5) * 2 * wob;
      t.vx = (t.vx + ax * DT) * (1 - .55 * DT); t.vy = (t.vy + ay * DT) * (1 - .55 * DT);
      const v = sq(t.vx * t.vx + t.vy * t.vy); if (v > 9) { t.vx *= 9 / v; t.vy *= 9 / v; }
    }
    for (const t of T) { t.x += t.vx * DT; t.y += t.vy * DT; }
    // el choque
    const a = T[0], b = T[1], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, lim = 2 * RT;
    if (d2 < lim * lim && d2 > 1e-8) {
      const d = sq(d2), nx = dx / d, ny = dy / d, pen = lim - d, tm = a.m + b.m;
      a.x -= nx * pen * b.m / tm; a.y -= ny * pen * b.m / tm; b.x += nx * pen * a.m / tm; b.y += ny * pen * a.m / tm;
      const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny, engrane = L[0].s !== L[1].s || fx[0] === 'rayo' || fx[1] === 'rayo';
      const ra = Math.max(0, a.w / a.w0), rb = Math.max(0, b.w / b.w0), rs = [ra, rb];
      if (vn < 0) {
        const e = engrane ? .35 : 1, j = -(1 + e) * vn / (1 / a.m + 1 / b.m);
        a.vx -= j / a.m * nx; a.vy -= j / a.m * ny; b.vx += j / b.m * nx; b.vy += j / b.m * ny;
        for (const [i, k] of [[0, 1], [1, 0]]) {   // cada una empuja a la otra según su ataque y lo que le queda de giro
          const emp = L[i].A * rs[i] * (engrane ? K.emp / 2 : K.emp) / T[k].m, sg = i === 0 ? 1 : -1; T[k].vx += nx * emp * sg; T[k].vy += ny * emp * sg;
        }
        const base = K.base * (-vn + 1.2), d_ = [0, 0];
        for (const [i, k] of [[0, 1], [1, 0]]) {
          let dm = base * (1 + K.dmgA * L[i].A * rs[i]) / (1 + K.dmgP * L[k].P) * (engrane ? 1.5 : .7);
          if (fx[i] === 'fuego') dm *= 1.5; if (fx[i] === 'rayo') dm *= 1.15; if (fx[k] === 'escarcha') dm *= .5;
          d_[k] = dm;
        }
        for (const [i, k] of [[0, 1], [1, 0]]) if (fx[k] === 'escarcha') d_[i] += d_[k] * .5;   // devuelve un cuarto de lo que pegaba el otro
        a.w -= d_[0]; b.w -= d_[1]; ev.push({ t: tick, k: 'choque', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: [Math.round(d_[0]), Math.round(d_[1])], engrane });
      } else if (engrane && d < lim * 1.02) {   // engranadas: se van rozando y comiéndose el giro
        for (const [i, k] of [[0, 1], [1, 0]]) T[k].w -= 7 * DT * (1 + .25 * L[i].A * rs[i]) / (1 + .2 * L[k].P) * (fx[i] === 'fuego' ? 1.5 : 1);
      }
    }
    // el gasto de giro: cuesta más cuanto más te mueves y menos cuanto más aguanta tu montaje
    for (const i of [0, 1]) { const t = T[i], v = sq(t.vx * t.vx + t.vy * t.vy); t.w -= (K.d0 + v * K.dv + K.cA * L[i].A) / (1 + K.dg * L[i].G) * DT; }
    frames.push([T[0].x, T[0].y, Math.max(0, T[0].w) / T[0].w0, T[1].x, T[1].y, Math.max(0, T[1].w) / T[1].w0]);
    fin = terminado(T);
  }
  return { T, frames, ev, fx, fin };
}
// Quién ha ganado (0 o 1) y por qué ('parada': se queda sin giro; 'fuera': sale del plato) o null
export function terminado(T) {
  const cae = T.map((t) => (t.w <= 0 ? 'parada' : t.x * t.x + t.y * t.y > BORDE * BORDE ? 'fuera' : null));
  if (!cae[0] && !cae[1]) return null;
  if (cae[0] && cae[1]) return { ganador: T[0].w / T[0].w0 >= T[1].w / T[1].w0 ? 0 : 1, motivo: 'a la vez' };
  return { ganador: cae[0] ? 1 : 0, motivo: cae[0] || cae[1] };
}
// Si se agota el tiempo gana quien conserve más giro
export const porTiempo = (T) => ({ ganador: T[0].w / T[0].w0 >= T[1].w / T[1].w0 ? 0 : 1, motivo: 'tiempo' });
export const MAX_SEGMENTOS = MAX_SEG;

// ---------- los rivales de Rufo ----------
// listo: lo bien que usa sus empujones y efectos
export const RIVALES_P = [
  { quien: 'Pip', nombre: 'La Cucharilla', equipo: { aro: 'aro_chapa', disco: 'dis_tapa', punta: 'pun_chincheta', lanzador: 'lz_cuerda' }, ajuste: 0, listo: .3, apuesta: 1, frase: '¡Mi peonza gira más que mi madre buscando las llaves!' },
  { quien: 'Mordo', nombre: 'El Pisapapeles', equipo: { aro: 'aro_tuerca', disco: 'dis_plomo', punta: 'pun_tapon', lanzador: 'lz_cuerda' }, ajuste: -1, listo: .4, apuesta: 2, frase: 'Ni me muevo. Ven tú.' },
  { quien: 'Doña Escarcha', nombre: 'Copo', equipo: { aro: 'aro_aspas', disco: 'dis_cd', punta: 'pun_bola', lanzador: 'lz_zurdo' }, ajuste: -1, listo: .5, apuesta: 3, frase: 'Gira que gira, y al revés que tú. Verás qué mareo.' },
  { quien: 'El Viejo Anzuelo', nombre: 'Cebo', equipo: { aro: 'aro_cuchara', disco: 'dis_arandela', punta: 'pun_clavo', lanzador: 'lz_resorte' }, ajuste: 1, listo: .6, apuesta: 4, frase: 'Te leo como un pez en un charco.' },
  { quien: 'Rufo', nombre: 'El Trompo Tornillo', equipo: { aro: 'aro_sierra', disco: 'dis_yunque', punta: 'pun_boli', lanzador: 'lz_turbo' }, ajuste: 1, listo: .8, apuesta: 6, frase: '¡Las peonzas las inventé yo! … Vale, no. Pero las perfeccioné.' }
];
export const especRival = (i) => { const r = RIVALES_P[i]; return { nombre: r.nombre, piloto: r.quien, equipo: { ...r.equipo }, ajuste: r.ajuste, frase: r.frase }; };

// Lo que hace la máquina en cada tramo: usa sus empujones a veces y gasta el efecto cuando le conviene
export function decisionIA(r, L, T, rnd, n) {
  const o = { r: null, x: false };
  if (T.emp > 0 && rnd() < r.listo * .6) { const rr = T.w / T.w0; o.r = rr < .45 ? 'C' : rnd() < .6 ? 'E' : (rnd() < .5 ? 'L' : 'R'); }
  if (L.efecto && T.cargas > 0 && rnd() < r.listo * .45) o.x = true;
  return o;
}

export const TEXTOS_FIN = { fuera: 'ha salido volando del plato', parada: 'se ha parado', 'a la vez': 'ha caído a la vez que la otra', tiempo: 'se ha cansado antes' };
