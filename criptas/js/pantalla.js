// =============================================================
//  PANTALLA COMPLETA, igual en todas las páginas del juego.
//  El navegador la quita al cambiar de página, así que si la tenías puesta
//  se vuelve a poner sola con el primer toque de la página nueva.
//  Si el juego está instalado en la pantalla de inicio, ya va a pantalla completa.
// =============================================================
const CLAVE = 'criptas_pantallaCompleta';
const leer = () => { try { return localStorage.getItem(CLAVE) === '1'; } catch { return false; } };
const guardar = (v) => { try { localStorage.setItem(CLAVE, v ? '1' : '0'); } catch { /* sin almacenamiento */ } };

export const instalada = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
export const pantallaPosible = () => !instalada() && !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
export const enPantallaCompleta = () => instalada() || !!(document.fullscreenElement || document.webkitFullscreenElement);

function poner() {
  const el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen;
  try { const p = f?.call(el, { navigationUI: 'hide' }); p?.catch?.(() => {}); } catch { /* no se deja */ }
}
function quitar() {
  const f = document.exitFullscreen || document.webkitExitFullscreen;
  try { const p = f?.call(document); p?.catch?.(() => {}); } catch { /* ya estaba */ }
}
// Devuelve true si la ha puesto, false si la ha quitado
export function alternarPantalla() {
  if (enPantallaCompleta()) { guardar(false); quitar(); return false; }
  guardar(true); poner(); return true;
}
// Llamar una vez al cargar cada página
export function recordarPantalla() {
  if (!leer() || !pantallaPosible()) return;
  const otra = () => { if (!enPantallaCompleta()) poner(); };
  addEventListener('pointerup', otra, { once: true, capture: true });
}
// Si la quitas con el botón atrás o Esc, no te la volvemos a poner en la siguiente página
let marchando = false;
addEventListener('beforeunload', () => { marchando = true; }); addEventListener('pagehide', () => { marchando = true; });
document.addEventListener('fullscreenchange', () => setTimeout(() => { if (!marchando && !document.fullscreenElement && !instalada()) guardar(false); }, 300));
