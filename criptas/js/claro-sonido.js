// =============================================================
//  EL CLARO · SONIDO, todo sintetizado (sin archivos): viento, pájaros,
//  grillos, la hoguera que crepita, una música tranquila de cuento al
//  pasear y otra con más ritmo en combate. Y los efectos: pasos, dados,
//  golpes, huesos, hechizos, recoger y las voces en «bips» al hablar.
// =============================================================
const mf = (n) => 440 * 2 ** ((n - 69) / 12);

export function crearSonido({ entorno = 'bosque' } = {}) {   // entorno: bosque (pájaros, grillos), pantano (ranas, zumbidos y música turbia) o cripta (gotas, eco y música en menor)
  let mudo = false, ctx = null, maestro, musica, ambiente, efectos, ruidoBuf, fuegoG, siguiente = 0, paso = 0, modo = 'paseo', modoVol = { paseo: null, combate: null };
  const S = {};

  function nota(n, t, dur, { tipo = 'triangle', vol = .08, destino = efectos, ataque = .005, filtro, hz = n >= 200 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipo; o.frequency.value = hz ? n : mf(n);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + ataque); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let ult = o; if (filtro) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filtro; o.connect(f); ult = f; }
    ult.connect(g); g.connect(destino); o.start(t); o.stop(t + dur + .05); return o;
  }
  function ruido(t, dur, { vol = .1, tipo = 'bandpass', f = 1200, q = 1, destino = efectos } = {}) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = ruidoBuf;
    fl.type = tipo; fl.frequency.value = f; fl.Q.value = q; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(destino); s.start(t, Math.random() * 1.5); s.stop(t + dur + .02); return fl;
  }

  S.arrancar = () => {
    if (ctx) { ctx.resume?.(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    maestro = ctx.createGain(); maestro.gain.value = mudo ? 0 : .9; maestro.connect(ctx.destination);
    const eco = ctx.createConvolver(), len = ctx.sampleRate * 1.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    eco.buffer = ir; const ecoG = ctx.createGain(); ecoG.gain.value = .25; eco.connect(ecoG); ecoG.connect(maestro);
    musica = ctx.createGain(); musica.gain.value = .55; musica.connect(maestro); musica.connect(eco);
    ambiente = ctx.createGain(); ambiente.gain.value = .7; ambiente.connect(maestro);
    efectos = ctx.createGain(); efectos.gain.value = 1; efectos.connect(maestro); efectos.connect(eco);
    for (const k of ['paseo', 'combate']) { modoVol[k] = ctx.createGain(); modoVol[k].gain.value = k === 'paseo' ? 1 : 0; modoVol[k].connect(musica); }
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = ruidoBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // viento: ruido muy filtrado que sube y baja
    const v = ctx.createBufferSource(); v.buffer = ruidoBuf; v.loop = true; const vf = ctx.createBiquadFilter(); vf.type = 'lowpass'; vf.frequency.value = 420; const vg = ctx.createGain(); vg.gain.value = .05;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .07; lg.gain.value = .03; lfo.connect(lg); lg.connect(vg.gain); lfo.start();
    v.connect(vf); vf.connect(vg); vg.connect(ambiente); v.start();
    // la hoguera: un chisporroteo cuyo volumen depende de lo cerca que estés
    fuegoG = ctx.createGain(); fuegoG.gain.value = 0; fuegoG.connect(ambiente);
    siguiente = ctx.currentTime + .1;
  };

  // Música: paseo (Fa mayor, arpegios de cuento) y combate (Re menor, con tambor)
  // el pantano: Mi menor con séptimas y un acorde que se tuerce (como el agua quieta que esconde algo)
  const PANTANO = [[52, [64, 67, 71, 74]], [48, [64, 67, 71, 76]], [50, [62, 66, 69, 74]], [47, [63, 66, 71, 75]]];
  const MELO_P = [71, -1, -1, 69, 67, -1, 66, -1, 64, -1, -1, -1, 67, -1, 69, -1, 71, -1, 74, -1, 72, -1, 71, 69, 66, -1, -1, -1, -1, -1, -1, -1];
  const PASEO = entorno === 'pantano' ? PANTANO : entorno === 'cripta' ? [[50, [62, 65, 69, 74]], [46, [62, 65, 70, 74]], [45, [61, 64, 69, 73]], [50, [62, 65, 69, 74]]] : [[53, [65, 69, 72, 77]], [50, [62, 65, 69, 74]], [46, [62, 65, 70, 74]], [48, [64, 67, 72, 76]]];
  const MELO = entorno === 'pantano' ? MELO_P : entorno === 'cripta' ? [74, -1, -1, 73, 74, -1, 77, -1, 76, -1, -1, 74, 73, -1, -1, -1, 70, -1, 69, -1, 70, -1, 73, -1, 74, -1, -1, -1, -1, -1, -1, -1] : [77, -1, 76, 74, 72, -1, 74, -1, 69, -1, 70, 72, 74, -1, -1, -1, 76, -1, 77, 79, 77, -1, 74, -1, 72, -1, 70, 69, 72, -1, -1, -1];
  // el cine: piano de película muda (ragtime en Do: Do, La7, Re7, Sol7), con bajo y acorde que se turnan («um-pa»)
  const CINE = [[48, [64, 67, 72]], [45, [61, 64, 67, 69]], [50, [62, 66, 69, 72]], [43, [62, 65, 67, 71]]];
  const MELO_C = [76, 77, 76, -1, 72, -1, 76, 79, -1, 78, 79, -1, 76, -1, 72, 74, 73, 74, 76, -1, 73, -1, 69, 72, 74, -1, 78, 77, 74, -1, 71, 67];
  const COMBATE = [[50, [62, 65, 69]], [46, [62, 65, 70]], [48, [64, 67, 72]], [45, [61, 64, 69]]];
  function programarMusica() {
    const bpm = modo === 'combate' ? 132 : entorno === 'pantano' ? 70 : entorno === 'cine' ? 116 : 84, c = 60 / bpm / 2;   // corcheas (el pantano, más lento)
    while (siguiente < ctx.currentTime + .4) {
      const t = siguiente, compas = Math.floor(paso / 8) % 4, k = paso % 8;
      // paseo
      const P = modoVol.paseo;
      if (entorno === 'cine') {   // pianito: bajo en 1 y 3, acorde en 2 y 4, melodía sincopada por encima
        const [cb, cac] = CINE[compas], tecla = (n, d, v) => { nota(n, t, d, { tipo: 'triangle', vol: v, destino: P, filtro: 3200 }); nota(n + .08, t, d * .6, { tipo: 'square', vol: v * .18, destino: P, filtro: 1800 }); };
        if (k === 0 || k === 4) tecla(k === 0 ? cb - 12 : cb - 5, c * 1.2, .09);
        if (k === 2 || k === 6) for (const n of cac) tecla(n, c * .9, .03);
        const m = MELO_C[paso % 32]; if (m > 0) tecla(m + 12, c * 1.4, .035);
      } else {
      const [b, ac] = PASEO[compas];
      if (k === 0) nota(b - 12, t, c * 7, { tipo: 'sine', vol: .12, destino: P });
      nota(ac[[0, 1, 2, 3, 2, 1, 2, 3][k]], t, c * 2.4, { tipo: 'triangle', vol: .045, destino: P, filtro: 2200 });
      const m = MELO[paso % 32]; if (m > 0 && Math.floor(paso / 32) % 2) nota(m, t, c * 3, { tipo: 'sine', vol: .04, destino: P, ataque: .04 });
      if (k === 4 && Math.random() < .3) nota(ac[3] + 12, t, 1.2, { tipo: 'sine', vol: .025, destino: P });
      }
      // combate
      const [cb, cac] = COMBATE[compas], C = modoVol.combate;
      nota(cb - 12 + (k % 2 ? 12 : 0), t, c * .9, { tipo: 'sawtooth', vol: .05, destino: C, filtro: 700 });
      if (k % 2 === 0) nota(cac[(k / 2) % 3] + 12, t, c * .8, { tipo: 'square', vol: .018, destino: C, filtro: 1800 });
      if (k === 0 || k === 4) { const o = nota(110, t, .18, { hz: true, tipo: 'sine', vol: .25, destino: C }); o.frequency.exponentialRampToValueAtTime(45, t + .15); }
      if (k === 2 || k === 6) ruido(t, .12, { vol: .12, f: 1800, q: .7, destino: C });
      ruido(t, .03, { vol: .03, tipo: 'highpass', f: 7000, destino: C });
      siguiente += c; paso++;
    }
  }
  S.musica = (m) => { if (!ctx || m === modo) return; modo = m; const t = ctx.currentTime; for (const k of ['paseo', 'combate']) { modoVol[k].gain.cancelScheduledValues(t); modoVol[k].gain.setTargetAtTime(k === m ? 1 : 0, t, .6); } };

  let proxPajaro = 0, proxGrillo = 0, proxChispa = 0;
  S.actualizar = (distFuego = 99) => {
    if (!ctx) return; const t = ctx.currentTime;
    programarMusica();
    if (entorno === 'cine') {   // el traqueteo del proyector
      if (t > proxGrillo) { proxGrillo = t + .5; for (let i = 0; i < 9; i++) ruido(t + i * .055, .012, { vol: .025, tipo: 'highpass', f: 3500, destino: ambiente }); }
    } else if (entorno === 'cripta') {
      if (t > proxPajaro) { proxPajaro = t + .8 + Math.random() * 2.5; const f = 1800 + Math.random() * 1400, o = nota(f, t, .12, { tipo: 'sine', vol: .03, destino: ambiente }); o.frequency.exponentialRampToValueAtTime(f * .55, t + .1); }   // gotas
    } else if (entorno === 'pantano') {
      // ranas: un «croac» grave (dos golpes de cuerda con el tono que baja), a veces contestado por otra
      if (t > proxPajaro) { proxPajaro = t + 1.2 + Math.random() * 3; const veces = 1 + (Math.random() < .5 ? 1 : 0), f = 90 + Math.random() * 60; for (let v = 0; v < veces; v++) for (let i = 0; i < 2; i++) { const t0 = t + v * .7 + i * .12, o = nota(f * (v ? 1.3 : 1), t0, .1, { hz: true, tipo: 'sawtooth', vol: .05, destino: ambiente, filtro: 700 }); o.frequency.exponentialRampToValueAtTime(f * .7, t0 + .09); } }
      // insectos que zumban y burbujas del barro
      if (t > proxGrillo) { proxGrillo = t + 1.5 + Math.random() * 3; if (Math.random() < .5) { const o = nota(520 + Math.random() * 80, t, 1.4, { hz: true, tipo: 'sawtooth', vol: .006, destino: ambiente, ataque: .4, filtro: 1400 }); o.frequency.linearRampToValueAtTime(560 + Math.random() * 80, t + 1.3); } else for (let i = 0; i < 3; i++) { const o = nota(300 + Math.random() * 200, t + i * .13, .08, { hz: true, tipo: 'sine', vol: .03, destino: ambiente }); o.frequency.exponentialRampToValueAtTime(700, t + i * .13 + .07); } }
    } else {
    if (t > proxPajaro) { proxPajaro = t + 2 + Math.random() * 5; const f = 2400 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) { const o = nota(f, t + i * .11, .09, { tipo: 'sine', vol: .018, destino: ambiente }); o.frequency.exponentialRampToValueAtTime(f * (1.3 + Math.random() * .4), t + i * .11 + .07); } }
    if (t > proxGrillo) { proxGrillo = t + .9 + Math.random() * 1.4; for (let i = 0; i < 3; i++) nota(4400 + Math.random() * 300, t + i * .05, .03, { tipo: 'square', vol: .006, destino: ambiente }); }
    }
    fuegoG.gain.setTargetAtTime(Math.max(0, 1 - distFuego / 12) * .5, t, .3);
    if (t > proxChispa && distFuego < 12) { proxChispa = t + .05 + Math.random() * .25; ruido(t, .03 + Math.random() * .04, { vol: .15, tipo: 'highpass', f: 2500 + Math.random() * 3000, destino: fuegoG }); }
  };

  const ya = () => ctx ? ctx.currentTime : 0;
  S.paso = () => { if (ctx) ruido(ya(), .06, { vol: .05, tipo: 'lowpass', f: 500 }); };
  S.dado = (fuerza = 1) => { if (ctx) { ruido(ya(), .04, { vol: .18 * fuerza, f: 2800, q: 3 }); nota(1400 + Math.random() * 500, ya(), .04, { tipo: 'square', vol: .02 * fuerza }); } };
  S.golpe = () => { if (!ctx) return; const t = ya(); const o = nota(160, t, .2, { hz: true, tipo: 'sine', vol: .3 }); o.frequency.exponentialRampToValueAtTime(50, t + .18); ruido(t, .12, { vol: .25, f: 900, q: .8 }); };
  S.huesos = () => { if (!ctx) return; const t = ya(); for (let i = 0; i < 9; i++) { ruido(t + i * .045 + Math.random() * .03, .05, { vol: .2, f: 1800 + Math.random() * 2500, q: 6 }); } };
  S.bloqueo = () => { if (!ctx) return; const t = ya(); nota(900, t, .25, { tipo: 'square', vol: .04, filtro: 3000 }); nota(1350, t, .2, { tipo: 'triangle', vol: .04 }); };
  S.hechizo = () => { if (!ctx) return; const t = ya(); const f = ruido(t, .7, { vol: .2, f: 400, q: 2 }); f.frequency.exponentialRampToValueAtTime(3000, t + .6); [72, 76, 79, 84].forEach((n, i) => nota(n, t + i * .06, .5, { tipo: 'sine', vol: .04 })); };
  S.explosion = () => { if (!ctx) return; const t = ya(); ruido(t, .6, { vol: .4, tipo: 'lowpass', f: 900 }); const o = nota(90, t, .5, { hz: true, tipo: 'sine', vol: .3 }); o.frequency.exponentialRampToValueAtTime(30, t + .45); };
  S.recoger = () => { if (!ctx) return; const t = ya(); [76, 81, 84, 88].forEach((n, i) => nota(n, t + i * .07, .35, { tipo: 'sine', vol: .06 })); };
  S.circulo = () => { if (!ctx) return; const t = ya(); const o = nota(70, t, .8, { hz: true, tipo: 'sine', vol: .35 }); o.frequency.exponentialRampToValueAtTime(40, t + .7); [50, 53, 57, 62].forEach((n, i) => nota(n, t + .1 + i * .08, .6, { tipo: 'sawtooth', vol: .03, filtro: 1500 })); };
  S.victoria = () => { if (!ctx) return; const t = ya(); [[65, 0], [69, .12], [72, .24], [77, .36], [76, .6], [77, .72]].forEach(([n, d]) => nota(n, t + d, d > .5 ? .9 : .25, { tipo: 'square', vol: .035, filtro: 2600 })); [53, 60, 65].forEach((n) => nota(n, t + .36, 1.2, { tipo: 'triangle', vol: .05 })); };
  S.derrota = () => { if (!ctx) return; const t = ya(); [69, 68, 67, 62].forEach((n, i) => nota(n, t + i * .3, .5, { tipo: 'triangle', vol: .06 })); };
  S.abrir = () => { if (!ctx) return; const t = ya(); [62, 66, 69, 74, 78, 81].forEach((n, i) => nota(n, t + i * .09, 1.4, { tipo: 'sine', vol: .045 })); ruido(t, 1.5, { vol: .08, f: 600, q: .5 }); };
  // Voz en bips (como en los juegos de vecinos): una nota corta por sílaba
  S.voz = (texto, grave = 0) => {
    if (!ctx) return; const t = ya(), silabas = Math.min(14, Math.ceil(texto.length / 5));
    for (let i = 0; i < silabas; i++) nota(560 - grave * 180 + Math.random() * 220, t + i * .075, .06, { tipo: 'square', vol: .02, filtro: 2400 });
  };
  S.mudo = () => mudo;
  S.silenciar = (si) => { mudo = !!si; if (maestro) maestro.gain.setTargetAtTime(si ? 0 : .9, ctx.currentTime, .1); };
  return S;
}
