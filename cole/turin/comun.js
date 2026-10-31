const SEL = 'turin_sellos';
function sellos() { try { return JSON.parse(localStorage.getItem(SEL)) || {}; } catch { return {}; } }
function ponSello(id, estrellas) { try { const s = sellos(); s[id] = Math.max(s[id] || 0, estrellas); localStorage.setItem(SEL, JSON.stringify(s)); } catch { /* sin almacenamiento */ } }
const barajar = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const azar = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function confeti(n = 30) { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; const cs = ['#c8372d', '#d4a43a', '#4f9a52', '#2f6aa0']; for (let k = 0; k < n; k++) { const c = document.createElement('i'); c.className = 'confeti'; c.style.left = Math.random() * 100 + 'vw'; c.style.background = cs[k % 4]; c.style.animationDelay = Math.random() * .6 + 's'; document.body.appendChild(c); setTimeout(() => c.remove(), 2800); } }
const estrellasTxt = (n, m) => '⭐'.repeat(n) + '☆'.repeat(m - n);
