// =============================================================
//  MODO PELÍCULA ANTIGUA (la parada del muelle de los dibujos)
//  Todo en blanco y negro con un toque sepia, grano, parpadeo y viñeta
//  (sin rayas: la que cruzaba la pantalla daba TOC), y los diálogos como carteles de cine mudo.
//  Solo toca el lienzo 3D: los marcadores y botones siguen en color.
// =============================================================
const CSS = `
body.cine canvas { filter: grayscale(1) sepia(.28) contrast(1.22) brightness(1.02); }
#pelicula { position: fixed; inset: 0; pointer-events: none; z-index: 4; overflow: hidden; }
#pelicula .grano { position: absolute; inset: -50%; opacity: .16; mix-blend-mode: multiply; animation: grano .35s steps(4) infinite; }
#pelicula .vineta { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 55%, rgba(20,14,8,.55) 100%); animation: parpadeo .12s infinite alternate; }
@keyframes grano { 0% { transform: translate(0,0); } 25% { transform: translate(-8%,4%); } 50% { transform: translate(5%,-6%); } 75% { transform: translate(-3%,7%); } 100% { transform: translate(6%,2%); } }
@keyframes parpadeo { from { opacity: .92; } to { opacity: 1; } }
/* los diálogos, como los carteles negros con marco de las películas mudas */
body.cine #dialogo { background: #14100c; color: #f2ead8; border: 3px double #e8dcc0; box-shadow: 0 0 0 6px #14100c, 0 12px 30px rgba(0,0,0,.5); font-family: Georgia, 'Times New Roman', serif; text-align: center; }
body.cine #dialogo #quien { font-family: Georgia, serif; font-style: italic; letter-spacing: .12em; text-transform: uppercase; color: #e8dcc0; background: #14100c; border: 2px solid #e8dcc0; }
body.cine #dialogo #texto { font-size: 1.05em; line-height: 1.5; }
body.cine #dialogo #texto::before { content: '❦ '; opacity: .6; } body.cine #dialogo #texto::after { content: ' ❦'; opacity: .6; }
body.cine #dialogo #opciones button { font-family: Georgia, serif; background: #f2ead8; color: #14100c; }
`;
function texturaGrano() {
  const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d'), d = x.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); return c.toDataURL();
}
export function ponerCine() {
  if (document.getElementById('pelicula')) return;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  document.body.classList.add('cine');
  const p = document.createElement('div'); p.id = 'pelicula';
  p.innerHTML = `<div class="grano" style="background-image:url(${texturaGrano()})"></div><div class="vineta"></div>`;
  document.body.appendChild(p);
}
