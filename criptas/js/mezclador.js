// =============================================================
//  MEZCLADOR DE SONIDO para las escenas de la base (tortuga, cabaña…)
//  Cada escena declara sus canales (fuego, mar, música…) y conecta sus
//  sonidos a mz.salida('fuego'). El jugador sube o baja cada canal desde
//  un panel; la mezcla se guarda en el dispositivo y la comparten todas
//  las escenas (el canal «música» es el mismo en la tortuga y la cabaña).
// =============================================================
const CLAVE_MEZCLA = 'criptas_mezcla', CLAVE_ACTIVO = 'criptas_sonidoBarco';
const leer = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

const CSS = `
.mezclador { position: fixed; z-index: 40; top: calc(max(10px, env(safe-area-inset-top)) + 52px); right: 10px; width: min(300px, calc(100vw - 20px));
  background: rgba(24,14,10,.94); border: 1px solid rgba(214,160,100,.5); border-radius: 6px; padding: 12px 14px 10px; color: #f1e2c4;
  font: 15px 'IM Fell English', Georgia, serif; box-shadow: 0 12px 30px rgba(0,0,0,.7); display: none; touch-action: auto; }
.mezclador.abierto { display: block; }
.mezclador h3 { margin: 0 0 8px; font: 19px 'IM Fell English SC', Georgia, serif; display: flex; justify-content: space-between; align-items: center; }
.mezclador h3 button { font: 14px 'IM Fell English', Georgia, serif; color: #f1e2c4; background: rgba(130,52,40,.8); border: 1px solid #e8b070; border-radius: 4px; padding: 3px 10px; cursor: pointer; }
.mezclador h3 button.apagado { background: transparent; border-color: rgba(214,160,100,.4); }
.mezclador .canal { display: grid; grid-template-columns: 92px 1fr 34px; gap: 8px; align-items: center; margin: 6px 0; }
.mezclador .canal span:last-child { text-align: right; font: 12px monospace; opacity: .7; }
.mezclador input[type=range] { width: 100%; accent-color: #c8823a; }
.mezclador.mudo .canal { opacity: .45; }
`;

export function crearMezclador({ canales, boton }) {
  const mezcla = (() => { try { return JSON.parse(leer(CLAVE_MEZCLA, '{}')) || {}; } catch { return {}; } })();
  for (const c of canales) if (typeof mezcla[c.id] !== 'number') mezcla[c.id] = 1;
  let activo = leer(CLAVE_ACTIVO, '1') === '1';
  let ac = null, maestro = null;
  const nodos = {};

  // ---------- Panel ----------
  if (!document.getElementById('css-mezclador')) {
    const st = document.createElement('style'); st.id = 'css-mezclador'; st.textContent = CSS; document.head.appendChild(st);
  }
  const panel = document.createElement('div');
  panel.className = 'mezclador';
  panel.innerHTML = `<h3>Sonido <button type="button" data-mudo>Activado</button></h3>` +
    canales.map((c) => `<label class="canal"><span>${c.nombre}</span><input type="range" min="0" max="100" step="1" data-canal="${c.id}" value="${Math.round(mezcla[c.id] * 100)}"><span data-valor="${c.id}">${Math.round(mezcla[c.id] * 100)}</span></label>`).join('');
  document.body.appendChild(panel);
  ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown'].forEach((t) => panel.addEventListener(t, (e) => e.stopPropagation()));
  const bMudo = panel.querySelector('[data-mudo]');
  function pintar() {
    bMudo.textContent = activo ? 'Activado' : 'Silencio';
    bMudo.classList.toggle('apagado', !activo);
    panel.classList.toggle('mudo', !activo);
    if (boton) boton.textContent = activo ? '🔊' : '🔇';
  }
  bMudo.addEventListener('click', () => {
    activo = !activo; guardar(CLAVE_ACTIVO, activo ? '1' : '0');
    if (activo) { if (!ac) empezar(); else ac.resume(); } else if (ac) ac.suspend();
    pintar();
  });
  panel.querySelectorAll('[data-canal]').forEach((r) => r.addEventListener('input', () => {
    const id = r.dataset.canal, v = r.value / 100;
    mezcla[id] = v; guardar(CLAVE_MEZCLA, JSON.stringify(mezcla));
    panel.querySelector(`[data-valor="${id}"]`).textContent = r.value;
    if (nodos[id]) nodos[id].gain.setTargetAtTime(v * v, ac.currentTime, .05);   // curva cuadrática: más fino abajo
  }));
  if (boton) boton.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('abierto'); if (activo) empezar(); });
  document.addEventListener('pointerdown', (e) => { if (!panel.contains(e.target) && e.target !== boton) panel.classList.remove('abierto'); });
  pintar();

  // ---------- Audio ----------
  const listos = [];
  function empezar() {
    if (ac || !activo) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    maestro = ac.createGain(); maestro.gain.value = .9; maestro.connect(ac.destination);
    for (const c of canales) { const g = ac.createGain(); g.gain.value = mezcla[c.id] ** 2; g.connect(maestro); nodos[c.id] = g; }
    for (const f of listos) f(ac);
  }
  return {
    empezar,
    // Para sonidos continuos (el mar, el fuego): se montan cuando arranca el audio.
    alArrancar(f) { listos.push(f); if (ac) f(ac); },
    get ac() { return ac; },
    get activo() { return activo && !!ac; },
    salida: (id) => nodos[id] || null,
    ruido(s) {
      const b = ac.createBuffer(1, ac.sampleRate * s, ac.sampleRate), d = b.getChannelData(0);
      let u = 0; for (let i = 0; i < d.length; i++) { u = (u + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = u * 3.5; }
      return b;
    },
    // Una nota suelta en un canal.
    nota(canal, frec, dur = 0.5, cuando = 0, vol = 0.05, tipo = 'triangle') {
      if (!activo || !ac || !nodos[canal]) return;
      const t = ac.currentTime + cuando, o = ac.createOscillator(), g = ac.createGain();
      o.type = tipo; o.frequency.value = frec;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(nodos[canal]); o.start(t); o.stop(t + dur + 0.05);
    }
  };
}
