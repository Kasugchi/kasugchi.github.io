// =============================================================
//  CAMPAÑAS IMPORTADAS: del JSON de diseño (la plantilla que se le
//  pasa a Gemini, revisada en taller.html) a misiones jugables.
//
//  El diseño dice QUÉ hay (salas con nombre, monstruos, llaves, guion);
//  el plano lo pone la Mazmorra Infinita (procedural.js): se genera una
//  mazmorra del tipo pedido, se usan tantas salas como pida el diseño
//  (las demás se tapian) y se coloca cada cosa en su sala.
//  Siempre sale el mismo mapa para la misma campaña (semilla fija).
// =============================================================
import * as D from './datos.js';
import * as T from './tablero.js';
import { generarMision } from './procedural.js';

const k = (x, y) => x + ',' + y;
const PLANOS = ['clasico', 'cuevas', 'torre', 'fortaleza', 'cripta', 'barco'];
const IA = { agresivo: 'agresivo', guardian: 'guardian', espera: 'centinela', lanzador: 'lanzador' };
export const idMision = (campana, n) => `imp-${campana}-${n + 1}`;

// Recorrido desde la escalera (como en procedural.js), para comprobar que se llega a todo.
function alcance(m, abiertas) {
  const roca = new Set(m.rocas.map((c) => k(...c)));
  for (const u of m.muebles) for (let y = u.y; y < u.y + u.h; y++) for (let x = u.x; x < u.x + u.w; x++) roca.add(k(x, y));
  for (const t of m.trampas || []) roca.add(k(t.x, t.y));
  const puerta = new Set(m.puertas.filter((p) => !p.secreta && (abiertas || !p.bloqueada)).map((p) => T.claveBorde(p.a, p.b)));
  const d = new Set([k(...m.escalera)]), cola = [m.escalera];
  while (cola.length) {
    const [x, y] = cola.shift();
    for (const [dx, dy] of T.DIRS) {
      const nx = x + dx, ny = y + dy, c = k(nx, ny);
      if (!T.dentro(nx, ny) || d.has(c) || roca.has(c)) continue;
      if (T.region(x, y) !== T.region(nx, ny) && !puerta.has(T.claveBorde([x, y], [nx, ny]))) continue;
      d.add(c); cola.push([nx, ny]);
    }
  }
  return d;
}
const llegaA = (d, region) => T.casillasDe(region).some(([x, y]) => d.has(k(x, y)));

// Convierte una misión del diseño. Devuelve { def, notas } o lanza un error con el motivo.
export function convertirMision(dis, n, idCampana) {
  const plano = PLANOS.includes(dis.mapa) ? dis.mapa : 'clasico';
  const salasD = dis.salas || [];
  const notas = [];
  for (let intento = 0; intento < 40; intento++) {
    const base = generarMision(`${idCampana}-${n + 1}-${intento}`, Math.min(n + 1, 8), plano);
    T.usarPlano(plano);
    const regiones = base._salas;
    if (regiones.length < salasD.length) continue;
    // La primera sala abierta del diseño es la de la escalera; las demás, por orden, cada vez más lejos.
    const centro = (r) => { const c = T.casillasDe(r); return [c.reduce((s, q) => s + q[0], 0) / c.length, c.reduce((s, q) => s + q[1], 0) / c.length]; };
    const [ex, ey] = base.escalera;
    const lejos = regiones.slice(1).sort((a, b) => Math.hypot(...centro(a).map((v, i) => v - [ex, ey][i])) - Math.hypot(...centro(b).map((v, i) => v - [ex, ey][i])));
    const inicioD = salasD.find((s) => !s.cerrada_hasta) || salasD[0];
    const resto = salasD.filter((s) => s !== inicioD);
    const reg = { [inicioD.id]: regiones[0] };
    resto.forEach((s, i) => { reg[s.id] = lejos[i]; });
    const usadas = new Set(Object.values(reg));
    // Puertas: fuera las de las salas que no se usan (quedan tapiadas) y las secretas que den a salas cerradas.
    const cerradas = new Set(salasD.filter((s) => s.cerrada_hasta).map((s) => reg[s.id]));
    const toca = (p, r) => T.region(...p.a) === r || T.region(...p.b) === r;
    let puertas = base.puertas.map((p) => ({ ...p, bloqueada: false }))
      .filter((p) => [p.a, p.b].every((c) => T.region(...c) === '.' || usadas.has(T.region(...c))))
      .filter((p) => !(p.secreta && [...cerradas].some((r) => toca(p, r))));
    const m = { escalera: base.escalera, rocas: base.rocas, puertas, muebles: base.muebles.filter((u) => usadas.has(T.region(u.x, u.y))), trampas: [] };
    // Salas cerradas: todas sus puertas, bloqueadas hasta conseguir la pista.
    const puertasDe = {};
    for (const s of salasD) {
      puertasDe[s.id] = puertas.filter((p) => toca(p, reg[s.id]));
      if (s.cerrada_hasta) puertasDe[s.id].forEach((p, i) => { p.id = `cerrada-${s.id}-${i + 1}`; p.bloqueada = true; });
    }
    if (!usadas.size || [...usadas].some((r) => !llegaA(alcance(m, true), r))) continue;
    // Las abiertas, sin abrir nada.
    const d0 = alcance(m, false);
    if (salasD.some((s) => !s.cerrada_hasta && !llegaA(d0, reg[s.id]))) continue;

    // ---------- Colocar cosas ----------
    const ocupado = new Set([[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => k(ex + a, ey + b)));
    for (const c of m.rocas) ocupado.add(k(...c));
    for (const u of m.muebles) for (let y = u.y; y < u.y + u.h; y++) for (let x = u.x; x < u.x + u.w; x++) ocupado.add(k(x, y));
    const enPuerta = new Set(puertas.flatMap((p) => [k(...p.a), k(...p.b)]));
    const huecos = (r) => T.casillasDe(r).filter(([x, y]) => !ocupado.has(k(x, y)) && !enPuerta.has(k(x, y)));
    const coger = (r) => { const h = huecos(r); if (!h.length) return null; const c = h[(h.length * 0.618 * (ocupado.size + 1) | 0) % h.length]; ocupado.add(k(...c)); return c; };
    const monstruos = [], grupos = {};
    let nId = 0, faltan = false;
    for (const spec of dis.monstruos || []) {
      const r = reg[spec.sala]; if (!r || !D.MONSTRUOS[spec.tipo]) { notas.push(`Monstruo ${spec.nombre || spec.tipo} sin sala o tipo válido: no sale.`); continue; }
      const cuantos = Math.max(1, spec.cuantos || 1);
      for (let i = 0; i < cuantos; i++) {
        const c = coger(r); if (!c) { faltan = true; break; }
        const b = D.MONSTRUOS[spec.tipo];
        const id = cuantos === 1 && spec.id ? spec.id : (spec.id ? spec.id + '-' + (i + 1) : 'm' + (++nId));
        const mo = { id, tipo: spec.tipo, x: c[0], y: c[1], ia: IA[spec.conducta] || (spec.tipo === 'hechicero' ? 'lanzador' : 'guardian') };
        if (spec.nombre) mo.nombre = spec.nombre;
        if (spec.jefe) { mo.jefe = true; mo.cuerpo = spec.cuerpo || b.cuerpo + 2; mo.ataque = spec.ataque || b.ataque + 1; mo.defensa = spec.defensa || b.defensa; }
        else { if (spec.cuerpo) mo.cuerpo = spec.cuerpo; if (spec.ataque) mo.ataque = spec.ataque; if (spec.defensa) mo.defensa = spec.defensa; }
        if (spec.tipo === 'hechicero') mo.hechizos = ['rayo', 'rayo', 'invocar', 'rayo'];
        monstruos.push(mo); (grupos[spec.tipo] ||= []).push(id);
      }
    }
    if (faltan) continue;
    for (const t of dis.trampas || []) {
      const r = reg[t.sala]; if (!r || !['foso', 'lanza', 'bloque'].includes(t.tipo)) continue;
      const c = coger(r); if (!c) continue;
      m.trampas.push({ id: 't' + (m.trampas.length + 1), tipo: t.tipo, x: c[0], y: c[1] });
      if (salasD.some((s) => !s.cerrada_hasta && !llegaA(alcance(m, false), reg[s.id]))) { m.trampas.pop(); notas.push(`Una trampa de ${t.sala} cortaba el paso: quitada.`); }
    }
    // Tesoros (por sala)
    const tesoros = {};
    for (const s of salasD) {
      const t = s.tesoro; if (!t) continue;
      const out = {};
      if (t.oro) out.oro = t.oro;
      if (t.objeto) out.objeto = String(t.objeto).startsWith('pocion') && t.objeto !== 'pocion' ? t.objeto : 'pocionCurar';
      if (t.pista) out.flag = t.pista;
      out.texto = t.texto || (t.oro ? `En ${s.nombre || 'la sala'} encontráis ${t.oro} monedas.` : t.objeto ? `En ${s.nombre || 'la sala'} aparece un frasco intacto.` : `Algo interesante en ${s.nombre || 'la sala'}.`);
      tesoros[reg[s.id]] = out;
    }
    // ---------- Guion ----------
    const disparadores = [];
    const desbloquearSala = (id) => (puertasDe[id] || []).filter((p) => p.bloqueada).map((p) => ({ tipo: 'desbloquear', puerta: p.id }));
    const nombreSala = (id) => salasD.find((s) => s.id === id)?.nombre || id;
    for (const s of salasD) if (s.cerrada_hasta) disparadores.push({ cuando: 'flag', nombre: s.cerrada_hasta, acciones: [...desbloquearSala(s.id), { tipo: 'mensaje', texto: `Ya se puede entrar en ${nombreSala(s.id)}.` }] });
    for (const g of dis.guion || []) {
      const c = String(g.cuando || '').trim(); let r, dsp = null;
      if ((r = c.match(/^buscar en(?: la sala)? ([a-z0-9_]+)$/)) && reg[r[1]]) dsp = { cuando: 'tesoro', region: reg[r[1]] };
      else if ((r = c.match(/^(?:ver|pisar)(?: la)?(?: sala| casilla)? (?:de |en )?([a-z0-9_]+)$/)) && reg[r[1]]) dsp = { cuando: 'region_revelada', region: reg[r[1]] };
      else if ((r = c.match(/^abrir la puerta de ([a-z0-9_]+)$/)) && reg[r[1]]) dsp = { cuando: 'region_revelada', region: reg[r[1]] };
      else if ((r = c.match(/^matar a ([a-z0-9_]+)$/))) dsp = { cuando: 'monstruo_muerto', id: monstruos.some((x) => x.id === r[1]) ? r[1] : (grupos[r[1]]?.[0] || r[1]) };
      else if ((r = c.match(/^pistas? ([a-z0-9_]+)(?: y ([a-z0-9_]+))?$/))) dsp = r[2] ? { cuando: 'flag', requiere: [r[1], r[2]] } : { cuando: 'flag', nombre: r[1] };
      if (!dsp) { notas.push(`Guion: «${c}» todavía no se sabe hacer; se omite.`); continue; }
      const acciones = [];
      for (const p of [].concat(g.pasa || [])) {
        const a = String(p).trim(); let q;
        if ((q = a.match(/^historia:\s*(.+)$/s))) acciones.push({ tipo: 'historia', texto: q[1] });
        else if ((q = a.match(/^mensaje:\s*(.+)$/s))) acciones.push({ tipo: 'mensaje', texto: q[1] });
        else if ((q = a.match(/^pista ([a-z0-9_]+)$/))) acciones.push({ tipo: 'flag', nombre: q[1] });
        else if ((q = a.match(/^(?:abrir|desbloquear)(?: la(?: puerta de)?)? ([a-z0-9_]+)$/))) acciones.push(...desbloquearSala(q[1]));
        else if ((q = a.match(/^revelar(?: la)? sala ([a-z0-9_]+)$/)) && reg[q[1]]) acciones.push({ tipo: 'revelar', region: reg[q[1]] });
        else if ((q = a.match(/^rondas extra (\d+)$/))) acciones.push({ tipo: 'rondasExtra', n: +q[1] });
        else if (/^despertar/.test(a)) {
          const tipo = Object.keys(grupos).find((t) => new RegExp(t.slice(0, 4), 'i').test(a));
          const ids = (tipo ? grupos[tipo] : monstruos.map((x) => x.id)).filter((id) => monstruos.find((x) => x.id === id)?.ia === 'centinela');
          if (ids.length) acciones.push({ tipo: 'activar', ids });
        } else if ((q = a.match(/^aparecen? (\d+) ([a-zñ]+?)s? en(?: la)?(?: sala)? ([a-z0-9_]+)$/))) {
          const tipo = Object.keys(D.MONSTRUOS).find((t) => q[2].startsWith(t.slice(0, 4))) || 'trasgo', r2 = reg[q[3]];
          const nuevos = [];
          for (let i = 0; i < +q[1] && r2; i++) { const c2 = coger(r2); if (c2) nuevos.push({ id: 'ap' + disparadores.length + '-' + i, tipo, x: c2[0], y: c2[1], ia: 'agresivo' }); }
          if (nuevos.length) acciones.push({ tipo: 'aparecer', monstruos: nuevos });
        } else if ((q = a.match(/^decision ([a-z0-9_]+)$/))) {
          const dc = (dis.decisiones || []).find((x) => x.id === q[1]);
          // Se elige en la partida (el primero que pulse); lo que diga «en_el_mundo» llega al pueblo.
          if (dc?.opciones?.length) acciones.push({ tipo: 'decision', id: q[1], pregunta: dc.pregunta || '¿Qué hacéis?',
            opciones: dc.opciones.slice(0, 4).map((o) => ({ texto: o.texto || '…', oro: Math.max(0, Math.min(500, +(o.oro_fondo ?? o.oro) || 0)), mundo: o.en_el_mundo ? String(o.en_el_mundo).trim() : null })) });
          else notas.push(`La decisión «${q[1]}» no tiene opciones: se omite.`);
        } else notas.push(`Guion: «${a}» todavía no se sabe hacer; se omite.`);
      }
      if (acciones.length) disparadores.push({ ...dsp, acciones });
    }
    // ---------- Objetivo ----------
    const meta = dis.escalera_en && dis.escalera_en !== inicioD.id && reg[dis.escalera_en];
    if (meta) disparadores.push({ cuando: 'region_revelada', region: meta, acciones: [{ tipo: 'flag', nombre: 'llegada' }, { tipo: 'mensaje', texto: `¡Habéis llegado a ${nombreSala(dis.escalera_en)}! Volved a la escalera para salir.` }] });
    const jefe = monstruos.find((x) => x.jefe);
    // Si hay jefe y hay que salir por la escalera, también hay que vencerlo (no vale verlo y huir).
    const conJefe = jefe && dis.objetivo !== 'matar';
    if (conJefe) disparadores.push({ cuando: 'monstruo_muerto', id: jefe.id, acciones: [{ tipo: 'flag', nombre: 'jefe_vencido' }] });
    const requiere = [...new Set([...[].concat(dis.requiere || []), ...(meta ? ['llegada'] : []), ...(conJefe ? ['jefe_vencido'] : [])])];
    const textoTareas = (dis.tareas || []).join('. ');
    let objetivo;
    if (dis.objetivo === 'matar' && (jefe || monstruos.length)) objetivo = { tipo: 'matar', id: (jefe || monstruos[monstruos.length - 1]).id, texto: textoTareas || `Acaba con ${(jefe || {}).nombre || 'el jefe'}.` };
    else if (dis.objetivo === 'escapar') objetivo = { tipo: 'escapar', rondas: dis.rondas || 12, requiere, texto: textoTareas || `Llegad a la salida antes de ${dis.rondas || 12} rondas.` };
    else objetivo = { tipo: 'escalera', requiere, texto: textoTareas || 'Cumplid el objetivo y volved a la escalera.' };
    const tareas = [...(meta ? [{ flag: 'llegada', texto: `Llegar a ${nombreSala(dis.escalera_en)}` }] : []),
      ...[].concat(dis.requiere || []).map((f) => ({ flag: f, texto: (dis.tareas || []).find((t) => t.toLowerCase().includes(f.replace(/_/g, ' '))) || 'Conseguir: ' + f.replace(/_/g, ' ') })),
      ...(jefe ? [{ matar: jefe.id, texto: 'Derrotar a ' + (jefe.nombre || jefe.tipo) }] : []),
      ...(objetivo.tipo !== 'matar' ? [{ salir: true, texto: 'Volver a la escalera y salir' }] : [])];
    const def = {
      id: idMision(idCampana, n), numero: n + 1, titulo: dis.titulo || 'Misión ' + (n + 1), intro: dis.pergamino || '', objetivo, tareas,
      recompensa: dis.recompensa || 50, errante: D.MONSTRUOS[dis.errante] ? dis.errante : base.errante, plano,
      escalera: m.escalera, rocas: m.rocas, puertas, muebles: m.muebles, monstruos, trampas: m.trampas, tesoros, disparadores,
      importada: idCampana, _salas: Object.fromEntries(Object.entries(reg).map(([id, r]) => [r, nombreSala(id)]))
    };
    return { def, notas: [...new Set(notas)] };
  }
  throw new Error(`No se pudo encajar «${dis.titulo}» en un mapa de tipo ${plano} (¿demasiadas salas o monstruos?).`);
}

// Toda la campaña: [{ def, notas }] en orden.
export function convertirCampana(datos, idCampana) {
  return (datos.misiones || []).map((m, i) => convertirMision(m, i, idCampana));
}
