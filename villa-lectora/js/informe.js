// =============================================================
//  INFORME COLECTIVO: tres capas que nunca se mezclan.
//    1. Actividad realizada   → lo que el juego comprueba (automático)
//    2. Competencia trabajada → lo previsto en el diseño de cada reto
//    3. Aprendizaje observado → solo lo que anota el docente
//  Sin datos por alumno, sin porcentajes de dominio, sin colores de nota.
// =============================================================
import { C, AVENTURAS, estadoTramos } from './clase.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dia = (iso) => iso ? new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const COMO = { resuelto: 'Resuelto directamente', con_pista: 'Resuelto con pista', saltado: 'Saltado', decidido: 'Decidido por la clase', hablado: 'Hablado en clase' };
const DECIDE = { directa: 'Respuesta directa', votacion: 'Votación', debate: 'Debate', convivencia: 'Convivencia', turnos: 'Por turnos' };
const contar = (lista, f) => lista.reduce((m, x) => { const k = f(x); if (k) m[k] = (m[k] || 0) + 1; return m; }, {});
const barras = (obj, etiquetas = {}) => { const max = Math.max(1, ...Object.values(obj)); return Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="fila"><span>${esc(etiquetas[k] || k)}</span><i style="width:${Math.round(n / max * 100)}%"></i><b>${n}</b></div>`).join('') || '<p class="vacio">Todavía sin actividad.</p>'; };

const CSS = `body{font:15px/1.5 system-ui,'Segoe UI',sans-serif;color:#1f2d33;max-width:820px;margin:32px auto;padding:0 20px}h1{font-size:26px;margin:0}h2{font-size:19px;margin:28px 0 8px;padding-top:12px;border-top:2px solid #e2e8ea}h3{font-size:15px;margin:16px 0 6px}
.sub{color:#5b6b70}.capa{font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#2f6aa0}.cifras{display:flex;gap:12px;margin:14px 0}.cifras div{flex:1;border:1px solid #d5dde0;border-radius:10px;padding:10px;text-align:center}.cifras b{display:block;font-size:26px}
.fila{display:grid;grid-template-columns:230px 1fr 40px;gap:10px;align-items:center;margin:4px 0}.fila i{display:block;height:12px;background:#9db4c0;border-radius:6px}.fila b{text-align:right}
table{width:100%;border-collapse:collapse;font-size:13.5px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e2e8ea;vertical-align:top}th{background:#f2f5f6}.nota{font-size:12.5px;color:#5b6b70;background:#f6f8f9;border-left:3px solid #9db4c0;padding:8px 12px;margin:10px 0}.vacio{color:#8a979b;font-style:italic}
.botones{position:sticky;top:0;background:#fff;padding:8px 0;display:flex;gap:8px}.botones button{font:inherit;padding:8px 14px;border-radius:8px;border:1px solid #9db4c0;background:#fff;cursor:pointer}@media print{.botones{display:none}body{margin:0}}`;

export function informeHTML() {
  const R = C.registro, libros = new Set(R.map((r) => r.aventura));
  const tramos = Object.keys(C.hitos).filter((k) => k.startsWith('tramo:')).length, terminados = Object.keys(C.hitos).filter((k) => k.startsWith('libro:') || k.startsWith('libre:')).length;
  const competencias = contar(R.flatMap((r) => r.clave.map((c) => ({ c }))), (x) => x.c);
  const finalidades = contar(R, (r) => r.que);
  const filasCur = Object.values(R.reduce((m, r) => { const k = `${r.area}|${r.que}`; (m[k] ||= { area: r.area, que: r.que, clave: r.clave.join(', '), esp: r.especifica, cri: r.criterio, n: 0 }).n++; return m; }, {}));
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe · ${esc(C.nombre)}</title><style>${CSS}</style></head><body>
  <div class="botones"><button onclick="print()">🖨 Imprimir o guardar en PDF</button></div>
  <h1>Informe de actividad · ${esc(C.nombre)}</h1><p class="sub">Villa Lectora · generado el ${dia(new Date().toISOString())} · informe colectivo, sin datos individuales del alumnado</p>
  <div class="cifras"><div><b>${libros.size + C.librosLibres.length}</b>Libros trabajados</div><div><b>${terminados}</b>Libros terminados</div><div><b>${tramos}</b>Tramos completados</div><div><b>${C.sesiones.length}</b>Sesiones</div></div>

  <h2><span class="capa">Capa 1 · Actividad realizada</span><br>Lo que el juego ha registrado automáticamente</h2>
  <h3>Cómo se resolvieron los retos</h3>${barras(contar(R, (r) => r.resultado), COMO)}
  <h3>Cómo decidió la clase</h3>${barras(contar(R, (r) => r.decision), DECIDE)}
  <h3>Lecturas</h3><table><tr><th>Libro</th><th>Tramos</th><th>Estado</th></tr>${Object.values(AVENTURAS).filter((a) => C.lecturas[a.id]).map((a) => { const e = estadoTramos(a); return `<tr><td>${esc(a.titulo)}</td><td>${e.filter((x) => x.hecho).length} de ${e.length}</td><td>${C.hitos['libro:' + a.id] ? 'Terminado' : 'En curso'}</td></tr>`; }).join('')}${C.librosLibres.map((b) => `<tr><td>${esc(b.titulo)} <span class="sub">(sin aventura)</span></td><td>—</td><td>${b.terminado ? 'Terminado' : 'En curso'}</td></tr>`).join('')}</table>
  <div class="nota">Las barras cuentan actividades realizadas por la clase. No miden el nivel de competencia ni el de ningún alumno. Las pistas y los saltos son formas de resolver el reto, no errores.</div>

  <h2><span class="capa">Capa 2 · Competencia trabajada</span><br>Lo previsto pedagógicamente en cada reto</h2>
  <h3>Competencias clave</h3>${barras(competencias)}
  <h3>Vinculación curricular</h3><table><tr><th>Área</th><th>Qué se trabaja</th><th>Comp. clave</th><th>Comp. específica</th><th>Criterio</th><th>Veces</th></tr>${filasCur.map((f) => `<tr><td>${esc(f.area)}</td><td>${esc(f.que)}</td><td>${esc(f.clave)}</td><td>${esc(f.esp)}</td><td>${esc(f.cri)}</td><td>${f.n}</td></tr>`).join('') || '<tr><td colspan="6" class="vacio">Todavía sin actividad.</td></tr>'}</table>
  <div class="nota">«Trabajada» significa que la actividad estaba diseñada para ello, no que se haya adquirido. La competencia específica y el criterio de evaluación están pendientes de verificar con la normativa andaluza de Primaria vigente.</div>

  <h2><span class="capa">Capa 3 · Aprendizaje observado</span><br>Solo lo que ha anotado el docente</h2>
  ${C.observaciones.length ? `<table><tr><th>Fecha</th><th>Momento</th><th>Observación</th></tr>${C.observaciones.slice().reverse().map((o) => `<tr><td>${dia(o.fecha)}</td><td>${esc(o.momento || '')}</td><td>${esc(o.texto)}</td></tr>`).join('')}</table>` : '<p class="vacio">El docente no ha anotado observaciones todavía. Villa Lectora no deduce aprendizajes por su cuenta.</p>'}

  <h2>Lo que ha vivido la clase en Villa Lectora</h2>
  <p>${C.pueblo.jardin.length ? 'Rincón de la clase: ' + C.pueblo.jardin.map((j) => esc(j.op)).join(' · ') : '<span class="vacio">El rincón de la clase aún está vacío.</span>'}</p>
  ${C.pueblo.recuerdos.length ? `<p>Vitrina de la biblioteca: ${C.pueblo.recuerdos.map((r) => esc(r.emoji + ' ' + r.nombre)).join(' · ')}</p>` : ''}
  ${C.estanteria.length ? `<p>Estantería de la clase: ${C.estanteria.map((b) => '«' + esc(b.titulo) + '»').join(' · ')}</p>` : ''}
  </body></html>`;
}

export function fichaSA(av) {
  const R = C.registro.filter((r) => r.aventura === av.id), S = C.sesiones.filter((s) => s.aventura === av.id), l = C.lecturas[av.id];
  const claves = [...new Set(av.tramos.flatMap((t) => t.retos.flatMap((r) => r.cur?.clave || [])))];
  const ayudas = Object.entries(C.adaptar).filter(([, v]) => v).map(([k]) => ({ grande: 'Texto ampliado', contraste: 'Alto contraste', voz: 'Lectura en voz alta', temporizadores: 'Temporizadores activados', facil: 'Dificultad reducida (menos opciones)' }[k])).filter(Boolean);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Situación de aprendizaje · ${esc(av.titulo)}</title><style>${CSS}</style></head><body>
  <div class="botones"><button onclick="print()">🖨 Imprimir o guardar en PDF</button></div>
  <p class="capa">Situación de aprendizaje · borrador generado por Villa Lectora</p><h1>${esc(av.emoji)} ${esc(av.titulo)}</h1><p class="sub">${esc(av.autor)} · ${esc(C.nombre)} · ${esc(av.etapa)}, ${esc(av.curso)}</p>
  <div class="nota">Formato orientativo. Debe ajustarse al modelo de situación de aprendizaje del centro y verificarse con la normativa andaluza de Primaria vigente.</div>
  <h2>Descripción y contexto</h2><p>La clase lee «${esc(av.titulo)}» y, a medida que avanza en la lectura, vive una aventura colectiva en Villa Lectora dividida en ${av.tramos.length} tramos. Cada tramo solo usa lo que la clase ya ha leído; el último exige terminar el libro.</p>
  <h2>Competencias clave</h2><p>${claves.map(esc).join(', ')}</p>
  <h2>Competencias específicas, criterios y saberes</h2><table><tr><th>Tramo</th><th>Reto</th><th>Área</th><th>Qué se trabaja</th><th>Comp. específica</th><th>Criterio</th></tr>${av.tramos.flatMap((t, i) => t.retos.map((r) => `<tr><td>${i + 1}. ${esc(t.titulo)}</td><td>${esc(r.texto)}</td><td>${esc(r.cur?.area)}</td><td>${esc(r.cur?.que)}</td><td>${esc(r.cur?.especifica)}</td><td>${esc(r.cur?.criterio)}</td></tr>`)).join('')}</table>
  <h2>Metodología</h2><p>Lectura del libro en papel; sesiones de 20 a 30 minutos con el juego proyectado, dirigidas por el docente. La clase participa de forma colectiva: respuesta directa comprobable en el libro, votaciones, debates y participación por mesas. Sin dispositivos individuales.</p>
  <h2>Secuencia realizada</h2><table><tr><th>Tramo</th><th>Lectura necesaria</th><th>Estado</th><th>Fecha</th></tr>${av.tramos.map((t, i) => `<tr><td>${i + 1}. ${esc(t.titulo)}</td><td>${esc(av.hitos.find((h) => h.id === t.requiere)?.texto)}</td><td>${l?.completados[t.id] ? 'Completado' : 'Pendiente'}</td><td>${dia(l?.completados[t.id]?.fecha)}</td></tr>`).join('')}</table>
  <p>Sesiones realizadas: ${S.length}. Retos registrados: ${R.length} (${R.filter((r) => r.resultado === 'con_pista').length} con pista, ${R.filter((r) => r.resultado === 'saltado').length} saltados).</p>
  <h2>Atención a la diversidad</h2><p>${ayudas.length ? 'Adaptaciones activas para toda la clase: ' + ayudas.join(', ') + '.' : 'Sin adaptaciones activas en este momento.'} Las pistas y saltos están disponibles en cada reto sin penalización.</p>
  <h2>Evaluación</h2><p>Villa Lectora documenta la actividad colectiva; no califica ni registra datos individuales. La valoración del aprendizaje corresponde al docente.</p>
  ${C.observaciones.filter((o) => o.aventura === av.id).length ? `<h3>Observaciones del docente</h3><ul>${C.observaciones.filter((o) => o.aventura === av.id).map((o) => `<li>${dia(o.fecha)} · ${esc(o.texto)}</li>`).join('')}</ul>` : ''}
  </body></html>`;
}

export function abrirDocumento(html) { const w = window.open('', '_blank'); if (!w) return false; w.document.open(); w.document.write(html); w.document.close(); return true; }
export function descargarCSV() {
  const filas = [['Fecha', 'Libro', 'Tramo', 'Tipo de reto', 'Cómo decidió la clase', 'Resultado', 'Intentos', 'Elección de la clase', 'Mesa', 'Área', 'Competencias clave', 'Qué se trabaja', 'Competencia específica', 'Criterio'],
    ...C.registro.map((r) => [r.fecha, r.libro, r.tramoTitulo, r.tipo, DECIDE[r.decision] || r.decision, COMO[r.resultado] || r.resultado, r.intentos || '', r.eleccion || '', r.mesa || '', r.area, r.clave.join(' '), r.que, r.especifica, r.criterio])];
  const csv = '﻿' + filas.map((f) => f.map((v) => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(';')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'villa-lectora-registro-clase.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
