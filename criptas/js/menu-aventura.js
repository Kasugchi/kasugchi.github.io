// =============================================================
//  EL BOTÓN ☰ DE LA AVENTURA (claro, paradas y criptas)
//  Un solo botón con todo lo que no es jugar: jugar juntos, sonido,
//  pantalla completa, cómo se juega y volver al menú. Misma pinta que la
//  libreta del pueblo, para que todo el juego se maneje igual.
//    apps(): [{ ico, titulo, sub, hacer, apagada }]   (se vuelve a pedir al abrir)
// =============================================================
import { alternarPantalla, pantallaPosible, enPantallaCompleta, instalada, recordarPantalla } from './pantalla.js';

const CSS = `
#menuB { position: absolute; right: 12px; top: calc(max(12px, env(safe-area-inset-top)) + 118px); min-width: 44px; height: 44px; border-radius: 22px; display: flex; align-items: center; justify-content: center; gap: 6px; font: 900 20px 'Nunito', sans-serif; padding: 0 12px; cursor: pointer; pointer-events: auto; }
#menuB small { font-size: 13px; letter-spacing: .08em; color: #3f72b8; }
#menuB small:empty { display: none; }
.libreta-av { box-sizing: border-box; position: fixed; z-index: 45; right: 12px; top: calc(max(12px, env(safe-area-inset-top)) + 168px); width: min(380px, calc(100vw - 24px)); max-height: calc(100vh - 190px); overflow: auto; background: #fff8e6; border-radius: 26px; padding: 14px; box-shadow: 0 10px 30px rgba(60,40,20,.35); font-family: 'Nunito', sans-serif; color: #4a3626; display: none; }
.libreta-av.ver { display: block; animation: libretaSale .18s ease-out; }
@keyframes libretaSale { from { transform: translateY(-8px) scale(.97); opacity: 0; } }
.libreta-av h2 { margin: 0 0 10px; font-size: 20px; color: #c0503a; display: flex; justify-content: space-between; align-items: center; }
.libreta-av h2 button { border: 0; background: #f2e6c8; color: #5a4030; width: 34px; height: 34px; border-radius: 50%; font: 800 18px 'Nunito', sans-serif; cursor: pointer; }
.libreta-av .apps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.libreta-av .app { display: flex; flex-direction: column; align-items: center; gap: 2px; border: 0; background: #f6ecd2; border-radius: 22px; padding: 12px 4px 10px; cursor: pointer; box-shadow: 0 3px 0 #e2d2aa; font-family: inherit; color: inherit; }
.libreta-av .app:active { transform: translateY(2px); box-shadow: 0 1px 0 #e2d2aa; }
.libreta-av .app .ico { font-size: 30px; line-height: 1.1; }
.libreta-av .app b { font-size: 13px; }
.libreta-av .app small { font-size: 11px; opacity: .7; font-weight: 700; text-align: center; }
.libreta-av .app.apagada { opacity: .5; }
.libreta-av .texto { font-size: 14px; font-weight: 600; line-height: 1.45; margin: 4px 2px 10px; }
.libreta-av ul { list-style: none; margin: 6px 0 10px; padding: 0; }
.libreta-av li { display: flex; justify-content: space-between; gap: 10px; padding: 7px 4px; border-bottom: 2px dashed #eadcb8; font-weight: 700; font-size: 14px; }
.libreta-av li small { opacity: .7; text-align: right; }
@media (max-width: 760px) { #menuB { top: max(8px, env(safe-area-inset-top)); right: 8px; min-width: 34px; height: 34px; font-size: 16px; padding: 0 9px; } .libreta-av { top: calc(max(8px, env(safe-area-inset-top)) + 44px); right: 8px; } }
`;

export function crearMenu({ boton, apps, titulo = 'Tu libreta' }) {
  recordarPantalla();
  if (!document.getElementById('css-menu-av')) { const st = document.createElement('style'); st.id = 'css-menu-av'; st.textContent = CSS; document.head.appendChild(st); }
  boton.innerHTML = '☰<small></small>';
  const L = document.createElement('div'); L.className = 'libreta-av'; document.body.appendChild(L);
  ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown'].forEach((t) => L.addEventListener(t, (e) => e.stopPropagation()));
  let lista = [];
  const M = {
    abierta: () => L.classList.contains('ver'),
    cerrar() { L.classList.remove('ver'); },
    abrir() { M.pintar(); L.classList.add('ver'); },
    pintar() {
      lista = apps().filter(Boolean);
      L.innerHTML = `<h2>${titulo}<button data-i="x" aria-label="Cerrar">✕</button></h2><div class="apps">${lista.map((a, i) => `<button class="app${a.apagada ? ' apagada' : ''}" data-i="${i}"><span class="ico">${a.ico}</span><b>${a.titulo}</b><small>${a.sub || ''}</small></button>`).join('')}</div>`;
    },
    // Una página de texto dentro de la libreta (cómo se juega, avisos…)
    pagina(t, html) { L.innerHTML = `<h2>${t}<button data-i="atras" aria-label="Atrás">←</button></h2>${html}`; L.classList.add('ver'); },
    marca(t) { boton.querySelector('small').textContent = t || ''; }
  };
  L.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    if (b.dataset.i === 'x') return M.cerrar();
    if (b.dataset.i === 'atras') return M.pintar();
    const a = lista[+b.dataset.i]; if (!a) return;
    const r = a.hacer?.(M); if (r !== 'seguir') M.cerrar();
  });
  boton.addEventListener('click', (e) => { e.stopPropagation(); if (M.abierta()) M.cerrar(); else M.abrir(); });
  boton.addEventListener('pointerdown', (e) => e.stopPropagation());
  document.addEventListener('pointerdown', (e) => { if (M.abierta() && !L.contains(e.target) && e.target !== boton) M.cerrar(); });
  return M;
}

// Las apps de siempre (cada página añade las suyas)
export const appPantalla = () => (instalada() ? null : {
  ico: enPantallaCompleta() ? '🗗' : '⛶', titulo: 'Pantalla completa', sub: !pantallaPosible() ? 'Añádelo a inicio' : enPantallaCompleta() ? 'Quitar' : 'Sin barras',
  hacer: (M) => {
    if (!pantallaPosible()) { M.pagina('Pantalla completa', '<p class="texto">Este navegador no deja ponerla desde la página (pasa en iPhone). Toca «Compartir» y luego «Añadir a pantalla de inicio»: el juego se abrirá como una app, a pantalla completa.</p>'); return 'seguir'; }
    alternarPantalla();
  }
});
export const appMenu = () => ({ ico: '📖', titulo: 'El libro', sub: 'Menú del juego', hacer: () => { location.href = 'index.html'; } });
export const leerMudo = () => { try { return localStorage.getItem('criptas_mudoAventura') === '1'; } catch { return false; } };
export const guardarMudo = (v) => { try { localStorage.setItem('criptas_mudoAventura', v ? '1' : '0'); } catch { /* nada */ } };
export const AYUDA_AVENTURA = `<ul>
  <li><span>Andar</span><small>joystick · WASD o flechas · toca el suelo</small></li>
  <li><span>Correr</span><small>joystick a tope · Mayús</small></li>
  <li><span>Girar la cámara</span><small>arrastra · ratón</small></li>
  <li><span>Acercar</span><small>pellizca · rueda</small></li>
  <li><span>Hablar, abrir, buscar</span><small>botón de abajo · E</small></li>
  <li><span>Pasar diálogos</span><small>toca · Espacio</small></li>
  <li><span>En combate</span><small>elige acción abajo y toca la casilla</small></li>
</ul><p class="texto">En la sala (👥 Jugar juntos) os veis paseando, y si uno baja a la cripta los demás pueden seguirle.</p>`;
