const SEL = 'turin_sellos';
function sellos() { try { return JSON.parse(localStorage.getItem(SEL)) || {}; } catch { return {}; } }
function ponSello(id, estrellas) { try { const s = sellos(); s[id] = Math.max(s[id] || 0, estrellas); localStorage.setItem(SEL, JSON.stringify(s)); } catch { /* sin almacenamiento */ } }
const barajar = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const azar = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function confeti(n = 30) { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; const cs = ['#c8372d', '#d4a43a', '#4f9a52', '#2f6aa0']; for (let k = 0; k < n; k++) { const c = document.createElement('i'); c.className = 'confeti'; c.style.left = Math.random() * 100 + 'vw'; c.style.background = cs[k % 4]; c.style.animationDelay = Math.random() * .6 + 's'; document.body.appendChild(c); setTimeout(() => c.remove(), 2800); } }
const estrellasTxt = (n, m) => '⭐'.repeat(n) + '☆'.repeat(m - n);

// ---- Sonido y efectos compartidos ----
let mudo = false; try { mudo = localStorage.getItem('turin_mudo') === '1'; } catch { /* nada */ }
let AC;
function beep(f, d = .12, t = 'square', v = .05, f2) {
  if (mudo) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(); o.type = t; o.frequency.value = f; if (f2) o.frequency.linearRampToValueAtTime(f2, AC.currentTime + d);
    g.gain.value = v; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.stop(AC.currentTime + d);
  } catch { /* sin audio */ }
}
const sOk = () => { beep(523, .1); setTimeout(() => beep(784, .16), 90); };
const sMal = () => beep(200, .25, 'sawtooth', .06, 90);
const sMoneda = () => { beep(988, .06); setTimeout(() => beep(1319, .1), 55); };
const sFanfarria = () => [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => beep(f, .2), k * 120));
function botonSonido(el) { const p = () => { el.textContent = mudo ? '🔇' : '🔊'; el.setAttribute('aria-label', mudo ? 'Activar sonido' : 'Silenciar'); }; p(); el.onclick = () => { mudo = !mudo; try { localStorage.setItem('turin_mudo', mudo ? '1' : '0'); } catch { /* nada */ } p(); if (!mudo) sMoneda(); }; }
function flota(pad, texto, color = '#2e7d32', x, y) { const f = document.createElement('div'); f.textContent = texto; f.className = 'flota'; f.style.color = color; f.style.left = (x ?? 50) + '%'; f.style.top = (y ?? 40) + '%'; pad.appendChild(f); setTimeout(() => f.remove(), 1200); }
