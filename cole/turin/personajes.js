// Personajes dibujados en SVG, en el estilo de «La vuelta al mundo».
const TINTA_P = '#3a2a1c';
const tortuga = (extra) => `<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="${TINTA_P}" stroke-width="3" stroke-linejoin="round">
<ellipse cx="30" cy="80" rx="8" ry="6" fill="#7fae5a"/><ellipse cx="62" cy="80" rx="8" ry="6" fill="#7fae5a"/><path d="M14 62 q-8 2-8 8 q4 2 9-1z" fill="#7fae5a"/>
<ellipse cx="46" cy="58" rx="34" ry="26" fill="#4f9a52"/><path d="M46 34v50M22 48q24 12 48 0M20 68q26-10 52 0" fill="none"/>
<circle cx="80" cy="50" r="13" fill="#7fae5a"/><circle cx="84" cy="47" r="2.6" fill="${TINTA_P}" stroke="none"/><path d="M80 56q5 4 10 0" fill="none"/></g>${extra}</svg>`;
const PERSONAJES = {
  arturo: tortuga(`<g stroke="${TINTA_P}" stroke-width="3"><ellipse cx="80" cy="36" rx="14" ry="4" fill="${TINTA_P}"/><path d="M71 36q0-14 9-14t9 14z" fill="#2b2b2b"/></g><path d="M74 62l-5 6 8-1 5 6 2-8z" fill="#c8372d" stroke="${TINTA_P}" stroke-width="2"/>`),
  clementina: tortuga(`<g stroke="${TINTA_P}" stroke-width="2"><circle cx="76" cy="36" r="5" fill="#f28ab2"/><circle cx="84" cy="36" r="5" fill="#f28ab2"/><circle cx="80" cy="30" r="5" fill="#f28ab2"/><circle cx="80" cy="42" r="4" fill="#f2c744"/></g><path d="M86 44l4-3M87 47l5-1" stroke="${TINTA_P}" stroke-width="2"/>`),
  florentina: `<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="${TINTA_P}" stroke-width="3" stroke-linejoin="round">
<path d="M70 78q22 6 18-14" fill="none"/><circle cx="26" cy="26" r="13" fill="#c9b9a6"/><circle cx="26" cy="26" r="7" fill="#f2b6c0" stroke="none"/><circle cx="74" cy="26" r="13" fill="#c9b9a6"/><circle cx="74" cy="26" r="7" fill="#f2b6c0" stroke="none"/>
<ellipse cx="50" cy="76" rx="26" ry="20" fill="#c9b9a6"/><path d="M34 62h32l6 30H28z" fill="#fff6e0"/><circle cx="50" cy="44" r="25" fill="#d8c9b6"/>
<circle cx="40" cy="42" r="3.4" fill="${TINTA_P}" stroke="none"/><circle cx="60" cy="42" r="3.4" fill="${TINTA_P}" stroke="none"/><ellipse cx="50" cy="54" rx="5" ry="4" fill="#f28ab2"/><path d="M50 58q-5 6-9 3M50 58q5 6 9 3" fill="none" stroke-width="2.4"/></g>
<path d="M30 52l-14-3M30 56l-14 3M70 52l14-3M70 56l14 3" stroke="${TINTA_P}" stroke-width="2"/></svg>`,
  ratoncito: `<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="${TINTA_P}" stroke-width="4"><circle cx="28" cy="32" r="14" fill="#c9b9a6"/><circle cx="72" cy="32" r="14" fill="#c9b9a6"/><circle cx="50" cy="56" r="32" fill="#d8c9b6"/><circle cx="38" cy="52" r="4" fill="${TINTA_P}" stroke="none"/><circle cx="62" cy="52" r="4" fill="${TINTA_P}" stroke="none"/><ellipse cx="50" cy="66" rx="6" ry="5" fill="#f28ab2"/></g></svg>`
};
const svgUrl = (k) => 'data:image/svg+xml;utf8,' + encodeURIComponent(PERSONAJES[k].replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" '));
function decir(t) { if (typeof mudo !== 'undefined' && mudo) return; try { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.replace(/<[^>]+>/g, '')); u.lang = 'es-ES'; u.rate = .95; speechSynthesis.speak(u); } catch { /* sin voz */ } }
