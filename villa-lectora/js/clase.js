// =============================================================
//  LA CLASE: todo lo que el juego guarda. La unidad más pequeña es la clase;
//  no hay ningún dato por alumno (ni nombres, ni respuestas individuales).
//  Prototipo: se guarda en este navegador (el ordenador de la clase).
// =============================================================
import VUELTA from './aventuras/vuelta.js';
import ISLA from './aventuras/isla.js';
import ALICIA from './aventuras/alicia.js';
import PINOCHO from './aventuras/pinocho.js';
import OZ from './aventuras/oz.js';
import PATITO from './aventuras/patito.js';
import { claseDeMuestra, VERSION_MUESTRA } from './muestra.js';

export const AVENTURAS = Object.fromEntries([VUELTA, ISLA, ALICIA, PINOCHO, OZ, PATITO].map((a) => [a.id, a]));
export function cambiarLectura(id) { if (AVENTURAS[id]) { C.actual = id; guardar(); } }
// ?muestra abre una clase ficticia con meses de uso, guardada aparte: nunca toca la clase real.
export const MUESTRA = new URLSearchParams(location.search).has('muestra');
const CLAVE = MUESTRA ? 'villa-lectora-muestra-v1' : 'villa-lectora-clase-v1';
const MESAS = [['roja', 'Mesa roja', '#e0604f'], ['azul', 'Mesa azul', '#4a7fd0'], ['verde', 'Mesa verde', '#4fa35a'], ['amarilla', 'Mesa amarilla', '#e0b23a'], ['morada', 'Mesa morada', '#8d62c6'], ['naranja', 'Mesa naranja', '#e58a3a']];

const nueva = () => ({
  v: 1, nombre: 'Clase de demostración', creada: new Date().toISOString(),
  mesas: MESAS.slice(0, 6).map(([id, nombre, color]) => ({ id, nombre, color, turnos: 0 })),
  adaptar: { grande: false, contraste: false, voz: false, temporizadores: true, facil: false },
  lecturas: {},           // aventuraId → { version, hito, completados:{tramoId:{version, fecha}}, enCurso }
  actual: VUELTA.id,
  librosLibres: [],       // libros sin aventura: { titulo, empezado, terminado }
  hitos: {},              // claves únicas: 'tramo:vuelta-80:t1', 'libro:vuelta-80', 'libre:<titulo>'
  pueblo: { jardin: [], lugares: [], recuerdos: [], hilos: [], explorador: [] },
  estanteria: [],         // interludios: { titulo, frase, fecha }
  registro: [],           // actividad colectiva
  observaciones: [],      // del docente, sin nombres
  sesiones: []            // { inicio, fin, aventura, tramo }
});

export let C = cargar();
function cargar() { try { const c = JSON.parse(localStorage.getItem(CLAVE)); if (c && c.v === 1 && (!MUESTRA || c.vMuestra === VERSION_MUESTRA)) return { ...nueva(), ...c }; } catch { /* nada */ } return MUESTRA ? claseDeMuestra() : nueva(); }
export function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(C)); } catch { /* sin almacenamiento */ } document.dispatchEvent(new Event('clase-cambia')); }
export function reiniciar() { C = MUESTRA ? claseDeMuestra() : nueva(); guardar(); }
export const exportarJSON = () => JSON.stringify({ app: 'villa-lectora', exportado: new Date().toISOString(), clase: C }, null, 2);

// ---------- lecturas y tramos ----------
export const aventuraActual = () => AVENTURAS[C.actual] || null;
export function lectura(av = aventuraActual()) { if (!av) return null; return (C.lecturas[av.id] ||= { version: av.version, hito: null, completados: {}, enCurso: null }); }
const indiceHito = (av, id) => av.hitos.findIndex((h) => h.id === id);
export function marcarLeido(hitoId) { const l = lectura(); l.hito = hitoId; guardar(); }
export const desbloqueado = (av, t) => { const l = lectura(av); return !!l?.hito && indiceHito(av, t.requiere) <= indiceHito(av, l.hito); };
export const completado = (av, t) => !!lectura(av)?.completados[t.id];
export function estadoTramos(av = aventuraActual()) { return av.tramos.map((t) => ({ t, abierto: desbloqueado(av, t), hecho: completado(av, t) })); }
export function siguienteTramo(av = aventuraActual()) { return estadoTramos(av).find((e) => e.abierto && !e.hecho)?.t || null; }

// ---------- hitos únicos y recompensas idempotentes ----------
function hito(clave) { if (C.hitos[clave]) return false; C.hitos[clave] = new Date().toISOString(); return true; }
export const hitosLectura = () => Object.keys(C.hitos).filter((k) => /^(tramo|libro|libre):/.test(k)).length;
// la eleción de la clase (votación) para la mejora de un tramo; se recuerda aunque se repita
export function elegirMejora(av, t, opcion) { const k = `${av.id}:${t.id}`; const j = C.pueblo.jardin.find((x) => x.k === k); if (j) j.op = opcion; else C.pueblo.jardin.push({ k, op: opcion, libro: av.titulo, tramo: t.titulo }); guardar(); }
export function completarTramo(av, t) {
  const l = lectura(av), nuevo = !l.completados[t.id];
  if (nuevo) l.completados[t.id] = { version: av.version, fecha: new Date().toISOString() };
  hito(`tramo:${av.id}:${t.id}`);
  let huellas = false;
  if (t.final && hito(`libro:${av.id}`)) {
    const H = av.huellas; huellas = true;
    if (!C.pueblo.lugares.includes(H.lugar.id)) C.pueblo.lugares.push(H.lugar.id);
    if (!C.pueblo.recuerdos.some((r) => r.libro === av.id)) C.pueblo.recuerdos.push({ libro: av.id, ...H.recuerdo });
    if (!C.pueblo.hilos.some((r) => r.libro === av.id)) C.pueblo.hilos.push({ libro: av.id, ...H.hilo });
    if (H.explorador && !C.pueblo.explorador.includes(H.explorador)) C.pueblo.explorador.push(H.explorador);
  }
  l.enCurso = null; guardar();
  return { nuevo, huellas };
}
export function libroLibre(titulo, terminado) {
  let b = C.librosLibres.find((x) => x.titulo === titulo);
  if (!b) { b = { titulo, empezado: new Date().toISOString(), terminado: null }; C.librosLibres.push(b); }
  if (terminado && !b.terminado) { b.terminado = new Date().toISOString(); hito('libre:' + titulo); }
  guardar();
}
export function interludio(titulo, frase) { C.estanteria.push({ titulo, frase, fecha: new Date().toISOString() }); hito('interludio:' + C.estanteria.length); guardar(); }

// ---------- mesas: turnos justos, sin nombres ----------
export function siguienteMesa() { const m = [...C.mesas].sort((a, b) => a.turnos - b.turnos || Math.random() - .5)[0]; return m; }
export function turnoHecho(id) { const m = C.mesas.find((x) => x.id === id); if (m) { m.turnos++; guardar(); } }

// ---------- registro colectivo (alimenta el informe) ----------
const DECIDE = { comprension: 'directa', libro: 'directa', mates: 'directa', ordenar: 'directa', votacion: 'votacion', debate: 'debate', convivencia: 'convivencia', turnos: 'turnos' };
export function registrar(av, t, reto, resultado, extra = {}) {
  C.registro.push({ fecha: new Date().toISOString(), aventura: av.id, libro: av.titulo, version: av.version, tramo: t.id, tramoTitulo: t.titulo, tipo: reto.tipo, decision: DECIDE[reto.tipo], texto: reto.texto, resultado, area: reto.cur?.area, clave: reto.cur?.clave || [], que: reto.cur?.que, especifica: reto.cur?.especifica, criterio: reto.cur?.criterio, ...extra });
  guardar();
}
export function observar(texto, contexto = {}) { C.observaciones.push({ fecha: new Date().toISOString(), texto: String(texto).slice(0, 400), ...contexto }); guardar(); }
export function sesion(inicio, av, t) { if (inicio) C.sesiones.push({ inicio: new Date().toISOString(), aventura: av.id, tramo: t.id }); else { const s = C.sesiones.at(-1); if (s && !s.fin) s.fin = new Date().toISOString(); } guardar(); }

// ---------- el pueblo recuerda: frases del arco de Olivia según los hitos (provisional) ----------
const ARCO = [
  [0, 'Olivia ordena la biblioteca. Dice que este año va a ser especial, aunque no sabe por qué.'],
  [2, 'Olivia busca un libro que perdió de niña. Cree que sigue en alguna parte de la biblioteca.'],
  [4, 'En la biblioteca hay un libro viejo con páginas en blanco. Olivia no deja que nadie lo toque.'],
  [6, 'Las páginas en blanco del libro viejo ya son varias. Tomás asegura que por las noches se oye pasar hojas.'],
  [9, 'Olivia confiesa que el libro viejo era suyo. «Cada vez que leéis, vuelve una palabra», dice.']
];
export const arcoOlivia = () => ARCO.filter(([n]) => hitosLectura() >= n).at(-1)[1];
