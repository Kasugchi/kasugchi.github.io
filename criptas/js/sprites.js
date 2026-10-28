// =============================================================
//  SPRITES PROPIOS
//  Si existe criptas/sprites/<clave>.png se usa esa ilustración
//  en vez de la miniatura 3D y del icono de la ficha 2D.
//  Claves: barbaro, barbara, enano, enana, elfo, elfa, mago, maga,
//  cargador, trasgo, orco, esqueleto, zombi, momia, guerrero,
//  gargola, hechicero. Si falta alguna, se usa lo de siempre.
// =============================================================
export const CLAVES = ['barbaro', 'barbara', 'enano', 'enana', 'elfo', 'elfa', 'mago', 'maga', 'cargador',
  'trasgo', 'orco', 'esqueleto', 'zombi', 'momia', 'guerrero', 'gargola', 'hechicero'];
const FEM = { barbaro: 'barbara', enano: 'enana', elfo: 'elfa', mago: 'maga' };

const imagenes = new Map(); // clave -> HTMLImageElement cargada
let promesa = null;

// Prueba a cargar cada sprite; los que no existen se ignoran sin errores.
export function cargarSprites(version = '') {
  if (promesa) return promesa;
  promesa = Promise.all(CLAVES.map((k) => new Promise((ok) => {
    const img = new Image();
    img.onload = () => { if (img.naturalWidth > 0) imagenes.set(k, img); ok(); };
    img.onerror = () => ok();
    img.src = 'sprites/' + k + '.png' + (version ? '?v=' + version : '');
  })));
  return promesa;
}

// Sprite de una figura (héroe, monstruo o cargador), o null.
export function spriteDe(f) {
  if (!f) return null;
  const base = f.aspecto || f.tipo;
  if (f.fem && FEM[base] && imagenes.has(FEM[base])) return imagenes.get(FEM[base]);
  return imagenes.get(base) || null;
}
export const haySprites = () => imagenes.size > 0;
