// =============================================================
//  LOS SITIOS DEL JUEGO (portada del menú)
//  Tarjetas para entrar directamente a cada sitio: el pueblo, cada parada
//  de Morrandar con su cripta, la tortuga, la cabaña, la sala y los
//  prototipos. Las paradas cerradas dicen qué falta para abrirlas.
// =============================================================
import { textoNivelZona } from './dificultad.js';
import { PARADAS, paradaAbierta, criptaHechaEn } from './paradas.js';
import { leerLocal, cargarHeroe } from './claro-heroes.js';

const CSS = `
#sitios-caja h2 { margin-bottom: 4px; }
#sitios-caja .heroe-av { display: flex; gap: 10px; align-items: center; background: rgba(255,255,255,.35); border: 2px solid var(--pergamino-osc); border-radius: 10px; padding: 8px 12px; margin: 6px 0 12px; font-weight: 700; }
#sitios-caja .heroe-av b { font-size: 18px; }
#sitios-caja .heroe-av small { display: block; opacity: .75; font-weight: 600; }
#sitios-caja .grupo { margin: 14px 0 6px; font: 700 13px var(--f-texto, sans-serif); letter-spacing: .12em; text-transform: uppercase; opacity: .7; }
.sitios { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.sitio { position: relative; display: flex; flex-direction: column; gap: 3px; text-align: left; border: 2px solid var(--pergamino-osc); border-radius: 12px; padding: 10px 12px 11px; background: linear-gradient(160deg, #f6ead0, #e9d6aa); color: var(--tinta); text-decoration: none; cursor: pointer; font: inherit; box-shadow: 0 3px 0 rgba(90,60,30,.25); transition: transform .12s; }
.sitio:hover { transform: translateY(-2px); }
.sitio:active { transform: translateY(1px); box-shadow: 0 1px 0 rgba(90,60,30,.25); }
.sitio .ico { font-size: 30px; line-height: 1.1; }
.sitio b { font-size: 16px; line-height: 1.15; }
.sitio small { font-size: 12.5px; line-height: 1.3; opacity: .8; }
.sitio .marca { position: absolute; top: 8px; right: 9px; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 9px; background: #6a9a4a; color: #fff; }
.sitio .marca.nueva { background: #c0503a; }
.sitio.cerrado { filter: grayscale(.85); opacity: .65; cursor: help; }
.sitio.grande { grid-column: span 2; }
.sitio.grande .ico { font-size: 38px; }
@media (max-width: 420px) { .sitios { grid-template-columns: 1fr 1fr; } .sitio.grande, .sitio.grande + .sitio { grid-column: 1 / -1; } }
`;

function tarjeta({ ico, titulo, sub, href, marca, clase = '', cerrado }) {
  const m = marca ? `<span class="marca ${marca[1] || ''}">${marca[0]}</span>` : '';
  if (cerrado) return `<button type="button" class="sitio cerrado ${clase}" data-cerrado="${cerrado.replace(/"/g, '&quot;')}"><span class="ico">${ico}</span><b>${titulo}</b><small>🔒 ${cerrado}</small></button>`;
  return `<a class="sitio ${clase}" href="${href}">${m}<span class="ico">${ico}</span><b>${titulo}</b><small>${sub}</small></a>`;
}

function pintar(caja, h) {
  const lista = Object.entries(PARADAS);
  const nombreDe = (id) => (PARADAS[id]?.corto?.toLowerCase() || id).replace(/^el /, 'l ');   // «de» + «l pantano» = «del pantano»
  const paradas = lista.map(([id, p]) => {
    const abierta = paradaAbierta(id, h), hecha = criptaHechaEn(id, h);
    return tarjeta({
      ico: p.icono, titulo: p.nombre, sub: `<b>${textoNivelZona(p)}.</b> ${p.descripcion.split('. ')[0]}. Cripta: ${p.cripta.nombre}.`,
      href: id === 'claro' ? 'claro.html' : `claro.html?p=${id}`,
      marca: hecha ? ['✓ superada'] : abierta && h && id !== 'claro' ? ['nueva', 'nueva'] : null,
      cerrado: abierta ? null : `Vence antes la cripta de${nombreDe(p.requiere).startsWith('l ') ? '' : ' '}${nombreDe(p.requiere)}`
    });
  }).join('');
  const heroe = h ? `<div class="heroe-av"><span style="font-size:30px">🧙</span><div><b>${h.nombre || 'Tu héroe'}</b> · nivel ${h.nivel || 1}<small>🪙 ${h.oro ?? 0} · 🧪 ${h.pociones ?? 0} · ${lista.filter(([id]) => criptaHechaEn(id, h)).length}/${lista.length} criptas superadas</small></div></div>`
    : '<p class="nota">Aún no tienes héroe de aventura: lo creas al bajar al claro por primera vez.</p>';
  caja.innerHTML = `<h2>Morrandar y sus paradas</h2>${heroe}
    <div class="sitios">
      ${tarjeta({ ico: '🏘', titulo: 'El pueblo de Morrandar', sub: 'Casas, vecinos, la cantina con su gramola, la forja y la oficina de encargos.', href: 'pueblo.html', clase: 'grande' })}
    </div>
    <div class="grupo">Paradas (modo aventura)</div>
    <div class="sitios">${paradas}</div>
    <div class="grupo">Más sitios</div>
    <div class="sitios">
      ${tarjeta({ ico: '🤖', titulo: 'El Ring de Chatarra', sub: 'Fabrícate un robot con piezas y gánale las suyas a los del pueblo.', href: 'ring.html' })}
      ${tarjeta({ ico: '🌀', titulo: 'Las peonzas de Rufo', sub: 'Monta tu peonza, tira y apuesta chatarra contra los del pueblo (o contra tu hermano).', href: 'peonzas.html' })}
      ${tarjeta({ ico: '🃏', titulo: 'Cartas de Velmor', sub: 'Duelos de cartas en un tablero 7×7: terrenos, fusiones a ciegas, trampas y faroles.', href: 'cartas.html' })}
      ${tarjeta({ ico: '🏆', titulo: 'Tu cabaña', sub: 'Los trofeos de tus héroes.', href: 'cabana.html' })}
      ${tarjeta({ ico: '👥', titulo: 'Sala de espera', sub: 'Para juntaros con código sin 3D, gastando poco.', href: 'reunion.html' })}
      ${tarjeta({ ico: '🏴‍☠️', titulo: 'Duelo de insultos', sub: 'El duelo al estilo pirata que lanza Rufo.', href: 'duelo.html' })}
      ${tarjeta({ ico: '⛵', titulo: 'El barco de tinta', sub: 'Prototipo de base de antes de la tortuga.', href: 'barco.html' })}
      ${tarjeta({ ico: '🎈', titulo: 'El zepelín', sub: 'Otro prototipo de base volante.', href: 'zepelin.html' })}
      ${tarjeta({ ico: '🗺', titulo: 'Editor de planos', sub: 'Dibuja mapas de mazmorra a mano.', href: 'planos.html' })}
    </div>`;
  caja.querySelectorAll('.sitio.cerrado').forEach((b) => b.addEventListener('click', () => {
    const s = b.querySelector('small'), t = s.textContent; s.textContent = '🔒 ' + b.dataset.cerrado + '. Cuando la venzas, Morrandar podrá ir allí.';
    setTimeout(() => { s.textContent = t; }, 3500);
  }));
}

export function montarSitios(caja) {
  if (!caja) return;
  if (!document.getElementById('css-sitios')) { const st = document.createElement('style'); st.id = 'css-sitios'; st.textContent = CSS; document.head.appendChild(st); }
  pintar(caja, leerLocal());
  cargarHeroe().then((h) => { if (h) pintar(caja, h); }).catch(() => {});
}
