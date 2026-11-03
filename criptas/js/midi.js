// =============================================================
//  LA GRAMOLA DE RUFO: reproductor de «discos» MIDI sintetizados con WebAudio.
//  Un disco es un JSON con las notas ya sacadas del MIDI (midi/*.json):
//    { "nombre": "...", "largo": 244.8, "notas": [[inicio, duración, tono, fuerza, canal, instrumento], ...] }
//  El catálogo (midi/catalogo.json) dice qué discos hay. Si existe midi/catalogo-local.json
//  (no se sube al repo) se suma al catálogo: ahí puedes poner discos solo para ti.
//  Los timbres salen del número de instrumento GM: bajo, cuerdas, guitarra, sintes, percusión.
//  El módulo no sabe nada del pueblo: recibe el contexto de audio, un nodo de destino y ruido.
// =============================================================
const freq = (n) => 440 * 2 ** ((n - 69) / 12);

async function leerJSON(url, obligatorio) {
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(url + ' ' + r.status);
    return await r.json();
  } catch (e) { if (obligatorio) throw e; return null; }   // un hosting con «fallback» devuelve HTML: tampoco vale
}

// El catálogo público más el local (opcional). Devuelve [{ id, nombre, archivo, autor?, modo?, canalVoz? }]
export async function cargarCatalogo(base = 'midi/') {
  const [a, b] = await Promise.all([leerJSON(base + 'catalogo.json', true), leerJSON(base + 'catalogo-local.json', false)]);
  const ids = new Set(), lista = [];
  for (const d of [...(a?.discos || []), ...(b?.discos || [])]) { if (d && d.id && d.archivo && !ids.has(d.id)) { ids.add(d.id); lista.push(d); } }
  return lista;
}

// La melodía que «canta» Rufo: la nota más aguda de cada golpe, sin percusión ni notas flojitas
// y con aire entre bips (si no, sería un pájaro nervioso). Se puede forzar un canal con canalVoz.
export function lineaDeVoz(notas, canalVoz) {
  const voz = [], m = notas.filter((n) => n[4] !== 9 && n[3] >= 50 && n[1] >= .1 && (canalVoz == null || n[4] === canalVoz));
  let ultimo = -9;
  for (let i = 0; i < m.length;) {
    let j = i, top = m[i];
    while (j < m.length && m[j][0] - m[i][0] < .03) { if (m[j][2] > top[2]) top = m[j]; j++; }
    if (top[0] >= ultimo + .15) { voz.push([top[0], Math.min(top[1], .3), top[2]]); ultimo = top[0]; }
    i = j;
  }
  return voz;
}

const cache = new Map();
export async function cargarDisco(d, base = 'midi/') {
  if (cache.has(d.id)) return cache.get(d.id);
  const j = await leerJSON(base + d.archivo, true);
  const notas = (Array.isArray(j?.notas) ? j.notas : []).filter((n) => Array.isArray(n) && n.length >= 6 && n.every(Number.isFinite)).sort((x, y) => x[0] - y[0]);
  if (!notas.length) throw new Error('disco vacío');
  const ult = notas[notas.length - 1], disco = { ...d, notas, largo: j.largo || ult[0] + ult[1], voz: lineaDeVoz(notas, d.canalVoz) };
  cache.set(d.id, disco);
  return disco;
}

// ctx: AudioContext · destino: nodo al que sale el sonido · ruidoBuf: buffer de ruido blanco · alFin(disco): terminó un disco
export function crearGramola({ ctx, destino, ruidoBuf, alFin }) {
  let sal = null, disco = null, t0 = 0, i = 0, iv = 0;

  // Cada disco tiene su propia salida con un limitador: así 16 canales juntos no saturan y
  // al cambiar de disco el anterior se apaga con un fundido, aunque le queden notas en el aire.
  function apagarSalida(s) {
    if (!s) return;
    s.gain.cancelScheduledValues(ctx.currentTime); s.gain.setTargetAtTime(0, ctx.currentTime, .06);
    setTimeout(() => { try { s.disconnect(); } catch (e) { /* ya estaba */ } }, 2500);
  }
  function nuevaSalida() {
    const g = ctx.createGain(), lim = ctx.createDynamicsCompressor();
    g.gain.value = .3; lim.threshold.value = -18; lim.knee.value = 15; lim.ratio.value = 7; lim.attack.value = .005; lim.release.value = .2;
    g.connect(lim); lim.connect(destino);
    return g;
  }

  function tambor(p, t, v) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    const bombo = p === 35 || p === 36, hat = p === 42 || p === 44 || p === 46, len = bombo ? .13 : hat ? .055 : .12;
    s.buffer = ruidoBuf; f.type = bombo ? 'lowpass' : hat ? 'highpass' : 'bandpass'; f.frequency.value = bombo ? 170 : hat ? 6500 : 1700;
    g.gain.setValueAtTime(Math.max(.001, v * (bombo ? .065 : hat ? .025 : .048)), t); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    s.connect(f); f.connect(g); g.connect(sal); s.start(t, Math.random()); s.stop(t + len + .01);
  }
  function sonar(n, t) {
    const [, dur, tono, fuerza, canal, prog] = n, v = (fuerza / 127) ** 1.25;
    if (canal === 9) { if (disco.modo !== 'piano') tambor(tono, t, v); return; }
    const banda = disco.modo !== 'piano';
    const bajo = banda && prog >= 32 && prog <= 39, cuerdas = banda && prog >= 40 && prog <= 55, sinte = banda && prog >= 80 && prog <= 103, guitar = banda && prog >= 24 && prog <= 31;
    const largo = Math.min(dur, cuerdas ? 5 : 3.5), cola = cuerdas ? .24 : .12, pico = (bajo ? .10 : cuerdas ? .048 : sinte ? .04 : guitar ? .055 : .065) * v;
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'lowpass'; g.gain.setValueAtTime(.0001, t);
    if (bajo) { o.type = 'triangle'; f.frequency.value = 800; g.gain.linearRampToValueAtTime(pico, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(.1, Math.min(largo, 1.8))); }
    else if (cuerdas) { o.type = 'sawtooth'; f.frequency.value = 1400; g.gain.linearRampToValueAtTime(pico, t + .18); g.gain.setValueAtTime(pico * .8, t + Math.max(.2, largo - .15)); g.gain.exponentialRampToValueAtTime(.0001, t + largo + cola); }
    else if (sinte) { o.type = 'sine'; f.frequency.value = 3000; g.gain.linearRampToValueAtTime(pico, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + largo + cola); }
    else { o.type = guitar ? 'triangle' : 'sine'; f.frequency.value = 4800; g.gain.linearRampToValueAtTime(pico, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(.09, Math.min(largo + cola, 2.8))); }
    o.frequency.setValueAtTime(freq(tono), t); o.connect(f); f.connect(g); g.connect(sal); o.start(t); o.stop(t + Math.max(.12, largo + cola + .06));
    if (!bajo && !cuerdas && !sinte) {   // el armónico de arriba da el cuerpo de piano o de guitarra
      const h = ctx.createOscillator(), hg = ctx.createGain(), d2 = Math.max(.08, Math.min(largo * .65, 1.2));
      h.type = 'sine'; h.frequency.value = freq(tono) * 2; hg.gain.setValueAtTime(.0001, t); hg.gain.linearRampToValueAtTime(pico * (guitar ? .18 : .28), t + .005); hg.gain.exponentialRampToValueAtTime(.0001, t + d2);
      h.connect(hg); hg.connect(sal); h.start(t); h.stop(t + d2 + .05);
    }
  }
  // El «canto» de Rufo: un bip de onda cuadrada siguiendo la melodía, siempre en una octava agradable
  function bip(n, t) {
    let p = n[2]; while (p < 60) p += 12; while (p > 76) p -= 12;
    const o = ctx.createOscillator(), g = ctx.createGain(), d = Math.min(.13, n[1] * .8);
    o.type = 'square'; o.frequency.value = freq(p + 12) * (1 + (Math.random() - .5) * .02);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.02, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(sal); o.start(t); o.stop(t + d + .05);
  }

  return {
    get suena() { return !!disco; },
    get disco() { return disco; },
    pos() { return disco ? ctx.currentTime - t0 : 0 },
    poner(d) {
      apagarSalida(sal); sal = nuevaSalida(); disco = d; t0 = ctx.currentTime + .3; i = 0; iv = 0;
    },
    parar() { apagarSalida(sal); sal = null; disco = null; },
    // Se llama desde el bucle de audio: programa las notas que caen antes de «hasta» (segundos de ctx.currentTime)
    programar(hasta) {
      if (!disco) return;
      const mudo = destino.gain.value < .01, ahora = ctx.currentTime;   // fuera de la cantina corre el reloj pero no se gastan osciladores
      while (i < disco.notas.length && t0 + disco.notas[i][0] < hasta) { const n = disco.notas[i++], t = t0 + n[0]; if (!mudo && t > ahora - .03) sonar(n, Math.max(t, ahora + .004)); }
      while (iv < disco.voz.length && t0 + disco.voz[iv][0] < hasta) { const n = disco.voz[iv++], t = t0 + n[0]; if (!mudo && t > ahora - .03) bip(n, Math.max(t, ahora + .004)); }
      if (i >= disco.notas.length && ahora > t0 + disco.largo + 1.2) { const fin = disco; disco = null; alFin?.(fin); }
    }
  };
}
