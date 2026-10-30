// Índice de los muebles extra. Cada lote vive en su archivo; para añadir uno nuevo,
// impórtalo aquí y ponlo en LOTES (así pueblo.html no engorda).
import lote1 from './muebles-extra-1.js';

const LOTES = [lote1];

// H = las herramientas de dibujo de pueblo.html (THREE, caja, cil, bola, lam, pz, brilla, MAD, MAD2, ORO)
export function mueblesExtra(H) {
  const todo = {};
  for (const lote of LOTES) {
    try { Object.assign(todo, lote(H)); } catch (e) { console.warn('Lote de muebles con error', e); }
  }
  return todo;
}
