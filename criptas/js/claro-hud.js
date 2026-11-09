// =============================================================
//  MODO AVENTURA · INTERFAZ COMPARTIDA (el claro y la cripta):
//  la ficha del héroe, la tarjeta de misión, los botones de combate,
//  los rótulos grandes, la narración y los diálogos con voz en bips.
// =============================================================
import { RAZAS, CLASES, NIVELES } from './claro-heroes.js';

const $ = (s) => document.querySelector(s);

// estado: el del juego · def(): el héroe guardado · mision(): HTML de la tarjeta de misión
export function crearHud({ estado, def, sonido, movil, mision }) {
  const dlg = { actual: null };
  const hud = {
    actualizar() {
      const D = def(), c = $('#corazones'); c.innerHTML = '';
      for (let i = 0; i < estado.max; i++) { const s = document.createElement('i'); s.className = i < estado.cuerpo ? 'lleno' : ''; c.appendChild(s); }
      $('#oro').textContent = estado.oro; $('#pociones').textContent = estado.pociones; $('#bolas').textContent = estado.usos; $('#habIcono').textContent = estado.habilidad.icono;
      const C0 = CLASES[D.clase], R0 = RAZAS[D.raza], n = D.nivel || 1, base = NIVELES[n - 1] || 0, sig = NIVELES[n];
      $('#nombreH').textContent = D.nombre; $('#nivelH').textContent = `Nv ${n}`; $('#retrato').textContent = C0.icono; $('#retrato').style.background = `radial-gradient(circle at 40% 35%, #ffffff55, ${D.colores.ropa})`;
      $('#xp i').style.width = sig ? Math.min(100, ((D.xp || 0) - base) / (sig - base) * 100) + '%' : '100%'; $('#ficha').title = `${R0.nombre} ${C0.nombre.toLowerCase()} · ${D.xp || 0} de experiencia`;
      $('#mision').innerHTML = mision();
    },
    acciones(lista, alElegir) {
      const b = $('#acciones'); b.innerHTML = ''; b.hidden = !lista.length;
      for (const a of lista) { const x = document.createElement('button'); x.disabled = !a.activo; x.innerHTML = `<span>${a.icono}</span>${movil && a.corto ? a.corto : a.texto}`; x.onclick = () => { sonido.dado(.3); alElegir(a.id); }; b.appendChild(x); }
    },
    banner(texto, tipo) { const b = $('#banner'); b.textContent = texto; b.className = 'ver ' + tipo; clearTimeout(b._t); b._t = setTimeout(() => b.className = tipo, 1500); },
    narrar(texto) { const n = $('#narrar'); n.textContent = texto; n.hidden = !texto; }
  };

  // Diálogo: el texto se escribe solo (con bips); tocar lo completa. Devuelve la opción elegida.
  function hablar(quien, lineas, opciones = [], { grave = .4 } = {}) {
    return new Promise((fin) => {
      const caja = $('#dialogo'); caja.hidden = false; $('#quien').textContent = quien; document.body.classList.add('hablando');
      let i = 0, escribiendo = null;
      const mostrar = () => {
        const txt = lineas[i], el = $('#texto'); el.textContent = ''; $('#opciones').innerHTML = ''; let k = 0;
        sonido.voz(txt, grave); clearInterval(escribiendo);
        escribiendo = setInterval(() => { k += 2; el.textContent = txt.slice(0, k); if (k >= txt.length) { clearInterval(escribiendo); escribiendo = null; fin2(); } }, 22);
        const fin2 = () => {
          const op = $('#opciones'); op.innerHTML = '';
          const ult = i === lineas.length - 1, lista = ult && opciones.length ? opciones : [[ult ? 'Vale' : 'Siguiente ▸', null]];
          for (const [t, f] of lista) { const b = document.createElement('button'); b.textContent = t; b.onclick = (e) => { e.stopPropagation(); if (!ult) { i++; mostrar(); } else { cerrar(); f?.(); fin(t); } }; op.appendChild(b); }
        };
        dlg.actual = { saltar: () => { if (escribiendo) { clearInterval(escribiendo); escribiendo = null; el.textContent = txt; fin2(); } } };
      };
      const cerrar = () => { caja.hidden = true; dlg.actual = null; document.body.classList.remove('hablando'); };
      mostrar();
    });
  }
  $('#dialogo').addEventListener('pointerdown', () => dlg.actual?.saltar());
  return { hud, hablar, dlg };
}
