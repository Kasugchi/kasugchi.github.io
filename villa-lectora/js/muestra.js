// =============================================================
//  CLASE DE MUESTRA: cómo se ve Villa Lectora tras dos meses de uso.
//  Se guarda aparte (?muestra) y nunca toca los datos de la clase real.
//  Todo es ficticio y sin datos de alumnos, como en una clase de verdad.
// =============================================================
import VUELTA from './aventuras/vuelta.js';
import ISLA from './aventuras/isla.js';

const dias = ['2026-09-17', '2026-09-24', '2026-10-01', '2026-10-06', '2026-10-15', '2026-10-20', '2026-10-27', '2026-10-29'];
const iso = (d, h = '10:15') => new Date(`${d}T${h}:00`).toISOString();
const MESAS = [['roja', 'Mesa roja', '#e0604f', 2], ['azul', 'Mesa azul', '#4a7fd0', 2], ['verde', 'Mesa verde', '#4fa35a', 1], ['amarilla', 'Mesa amarilla', '#e0b23a', 1], ['morada', 'Mesa morada', '#8d62c6', 1], ['naranja', 'Mesa naranja', '#e58a3a', 1]];
const ELIGE = { t1: '🕰️ Reloj de estación', t2: '🔍 Una lupa', t3: '🐘 Un elefante de madera', t4: '🌸 Un cerezo', t5: '⭐ Una estrella' };
// cómo le fue a la clase en cada reto: resultado, intentos y, si se votó o decidió, qué
const COMO = {
  t1: [['resuelto', 1], ['con_pista', 3], ['decidido', 0, ELIGE.t1]],
  t2: [['resuelto', 2], ['decidido', 0, 'Primero hay que buscar pruebas'], ['decidido', 0, ELIGE.t2, true]],
  t3: [['resuelto', 1], ['hablado', 0], ['decidido', 0, ELIGE.t3]],
  t4: [['con_pista', 2], ['resuelto', 1, null, false, 'Mesa azul'], ['decidido', 0, ELIGE.t4]],
  t5: [['resuelto', 1], ['decidido', 0, 'Las personas van primero'], ['decidido', 0, '⭐ Una estrella', true]],
  t6: [['resuelto', 2], ['saltado', 0]]
};
const SESIONES = [['t1', 0, true], ['t2', 1, false], ['t2', 2, true], ['t3', 3, true], ['t4', 4, true], ['t5', 5, true], ['t6', 6, true]];

export const VERSION_MUESTRA = 2;
export function claseDeMuestra() {
  const DECIDE = { comprension: 'directa', libro: 'directa', mates: 'directa', ordenar: 'directa', votacion: 'votacion', debate: 'debate', convivencia: 'convivencia', turnos: 'turnos' };
  const registro = [], completados = {}, hitos = {}, sesiones = [];
  VUELTA.tramos.forEach((t, i) => {
    const dia = dias[Math.min(i + 1, dias.length - 1)];
    t.retos.forEach((r, k) => {
      const [resultado, intentos, eleccion, empate, mesa] = COMO[t.id][k] || ['resuelto', 1];
      registro.push({ fecha: iso(dia, `10:${String(10 + k * 6).padStart(2, '0')}`), aventura: VUELTA.id, libro: VUELTA.titulo, version: VUELTA.version, tramo: t.id, tramoTitulo: t.titulo, tipo: r.tipo, decision: DECIDE[r.tipo], texto: r.texto, resultado, intentos: intentos || undefined, eleccion: eleccion || undefined, empate: empate || undefined, mesa: mesa || undefined, area: r.cur.area, clave: r.cur.clave, que: r.cur.que, especifica: r.cur.especifica, criterio: r.cur.criterio, adaptaciones: i >= 3 ? ['voz'] : [] });
    });
    completados[t.id] = { version: VUELTA.version, fecha: iso(dia, '10:30') };
    hitos[`tramo:${VUELTA.id}:${t.id}`] = iso(dia, '10:30');
  });
  hitos['libro:' + VUELTA.id] = iso(dias[7]);
  // segundo libro, a medias: «La isla del tesoro», primer tramo jugado y leído hasta el segundo hito
  const t1 = ISLA.tramos[0], elIsla = '🗺️ Un mapa antiguo';
  t1.retos.forEach((r, k) => registro.push({ fecha: iso('2026-10-30', `10:${String(10 + k * 6).padStart(2, '0')}`), aventura: ISLA.id, libro: ISLA.titulo, version: ISLA.version, tramo: t1.id, tramoTitulo: t1.titulo, tipo: r.tipo, decision: DECIDE[r.tipo], texto: r.texto, resultado: r.tipo === 'votacion' ? 'decidido' : 'resuelto', intentos: r.tipo === 'votacion' ? undefined : 1, eleccion: r.tipo === 'votacion' ? elIsla : undefined, area: r.cur.area, clave: r.cur.clave, que: r.cur.que, especifica: r.cur.especifica, criterio: r.cur.criterio, adaptaciones: ['voz'] }));
  hitos[`tramo:${ISLA.id}:${t1.id}`] = iso('2026-10-30', '10:30');
  sesiones.push({ inicio: iso('2026-10-30', '10:00'), fin: iso('2026-10-30', '10:27'), aventura: ISLA.id, tramo: t1.id, completa: true });
  SESIONES.forEach(([tramo, d, completa]) => sesiones.push({ inicio: iso(dias[d], '10:00'), fin: iso(dias[d], completa ? '10:28' : '10:14'), aventura: VUELTA.id, tramo, completa }));
  const librosLibres = [
    { titulo: 'El pequeño Nicolás', empezado: iso('2026-09-10'), terminado: iso('2026-09-30') },
    { titulo: 'Las brujas', empezado: iso('2026-10-01'), terminado: iso('2026-10-24') },
    { titulo: 'Charlie y la fábrica de chocolate', empezado: iso('2026-10-27'), terminado: null }
  ];
  for (const b of librosLibres) if (b.terminado) hitos['libre:' + b.titulo] = b.terminado;
  return {
    v: 1, vMuestra: VERSION_MUESTRA, nombre: '4.º B · clase de muestra', creada: iso('2026-09-15'), muestra: true,
    mesas: MESAS.map(([id, nombre, color, turnos]) => ({ id, nombre, color, turnos })),
    adaptar: { grande: false, contraste: false, voz: true, temporizadores: true, facil: false },
    lecturas: { [VUELTA.id]: { version: VUELTA.version, hito: 'fin', completados, enCurso: null }, [ISLA.id]: { version: ISLA.version, hito: 'h2', completados: { t1: { version: 1, fecha: iso('2026-10-30', '10:30') } }, enCurso: null } },
    actual: ISLA.id, librosLibres, hitos,
    pueblo: {
      jardin: [...VUELTA.tramos.filter((t) => ELIGE[t.id]).map((t) => ({ k: `${VUELTA.id}:${t.id}`, op: ELIGE[t.id], libro: VUELTA.titulo, tramo: t.titulo })), { k: `${ISLA.id}:t1`, op: '🗺️ Un mapa antiguo', libro: ISLA.titulo, tramo: ISLA.tramos[0].titulo }],
      lugares: ['estacion'], recuerdos: [{ libro: VUELTA.id, ...VUELTA.huellas.recuerdo }], hilos: [{ libro: VUELTA.id, ...VUELTA.huellas.hilo }], explorador: ['chistera']
    },
    estanteria: [
      { titulo: 'El faro que no quería apagarse', frase: 'Cada noche, el faro contaba una historia distinta a los barcos que pasaban.', fecha: iso('2026-10-08') },
      { titulo: 'La carta de Picaporte', frase: 'Querida clase: en Yokohama hay un circo donde los elefantes leen el periódico.', fecha: iso('2026-10-30') }
    ],
    registro, sesiones,
    observaciones: [
      { fecha: iso('2026-09-24', '10:30'), texto: 'Debate muy participativo', aventura: VUELTA.id, tramo: 't2', momento: 'debate' },
      { fecha: iso('2026-10-06', '10:30'), texto: 'Buena escucha', aventura: VUELTA.id, tramo: 't3', momento: 'convivencia' },
      { fecha: iso('2026-10-06', '10:40'), texto: 'La conversación sobre las burlas por el acento dio mucho de sí; varios contaron experiencias parecidas en el comedor.', momento: 'nota libre' },
      { fecha: iso('2026-10-20', '10:30'), texto: 'Alguien cambió de opinión al escuchar', aventura: VUELTA.id, tramo: 't5', momento: 'debate' },
      { fecha: iso('2026-10-27', '10:35'), texto: 'Les costó el cálculo de los husos horarios; lo repasamos en Matemáticas.', momento: 'nota libre' }
    ]
  };
}
export const amistadMuestra = { owl: 9, caretaker: 6, cook: 7 };
