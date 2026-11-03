// =============================================================
//  EL CANCIONERO DE RUFO: versiones a guitarra de canciones de dominio público
//  (salomas, clásicos y populares), tocadas «a su manera» y cantadas en bips.
//  Cada canción: título de broma, original, tempo, compás, melodía y acordes.
//  Melodía: «nota:pulsos» separadas por espacios (- es silencio). Acordes: «Am:4».
// =============================================================
export const CANCIONES = [
  { t: 'Marinero borracho (versión zarzaparrilla)', o: 'Drunken Sailor (saloma tradicional)', bpm: 138, comp: 4, vueltas: 2,
    dice: 'Una saloma de toda la vida. La original lleva ron; la mía, zarzaparrilla.',
    mel: `A4:1 A4:.5 A4:.5 A4:1 A4:.5 A4:.5 A4:1 D4:1 F4:1 A4:1  G4:1 G4:.5 G4:.5 G4:1 G4:.5 G4:.5 G4:1 C4:1 E4:1 G4:1
          A4:1 A4:.5 A4:.5 A4:1 A4:.5 A4:.5 A4:1 B4:1 C5:1 D5:1  C5:1 A4:1 G4:1 E4:1 D4:2 D4:2
          A4:2 A4:2 A4:1 D4:1 F4:1 A4:1  G4:2 G4:2 G4:1 C4:1 E4:1 G4:1
          A4:2 A4:2 A4:1 B4:1 C5:1 D5:1  C5:1 A4:1 G4:1 E4:1 D4:2 D4:2`,
    ac: 'Dm:4 Dm:4 C:4 C:4 Dm:4 Dm:4 C:4 Dm:4 Dm:4 Dm:4 C:4 C:4 Dm:4 Dm:4 C:4 Dm:4' },
  { t: 'Cancán del grog', o: 'Galop infernal (Offenbach, 1858)', bpm: 150, comp: 4, vueltas: 2,
    dice: '¡Esta se baila levantando la pierna! Yo la levanto poco, que me da un tirón.',
    mel: `C5:1 D5:.5 F5:.5 E5:.5 D5:.5 G5:1  G5:1 G5:.5 A5:.5 E5:.5 F5:.5 D5:1  D5:1 G5:.5 A5:.5 E5:.5 F5:.5 D5:.5 C5:.5
          C6:.5 B5:.5 A5:.5 G5:.5 F5:.5 E5:.5 D5:.5 C5:.5  C5:1 D5:.5 F5:.5 E5:.5 D5:.5 G5:1  G5:1 G5:.5 A5:.5 E5:.5 F5:.5 D5:1
          D5:1 G5:.5 A5:.5 E5:.5 F5:.5 D5:.5 E5:.5  C5:2 -:2`,
    ac: 'C:4 G:4 G:4 C:4 C:4 G:4 G:4 C:4' },
  { t: 'Habanera del muelle', o: 'Habanera de «Carmen» (Bizet, 1875)', bpm: 76, comp: 4, vueltas: 2, habanera: 1,
    dice: 'Esta me la enseñó una gaviota en Cádiz. O eso creo: era muy temprano.',
    mel: `D5:1.5 C#5:.5 C5:1 C5:1  B4:1.5 Bb4:.5 A4:.5 A4:.5 Ab4:1  G4:1.5 G4:.5 F4:.5 E4:.5 F4:.5 G4:.5  F4:1 E4:1 -:2
          D5:1.5 C#5:.5 C5:1 C5:1  B4:1.5 Bb4:.5 A4:.5 A4:.5 Ab4:1  G4:1.5 G4:.5 F4:.5 E4:.5 F4:.5 E4:.5  D4:3 -:1`,
    ac: 'Dm:4 Dm:4 A7:4 A7:4 Dm:4 Dm:4 A7:4 Dm:4' },
  { t: 'La cucaracha pirata', o: 'La cucaracha (popular)', bpm: 168, comp: 4, vueltas: 2,
    dice: 'La cucaracha de mi barco sí que puede caminar. Y nadar. Y robar galletas.',
    mel: `G4:.5 G4:.5 G4:.5 C5:1.5 E5:1  G4:.5 G4:.5 G4:.5 C5:1.5 E5:1  C5:.5 C5:.5 B4:.5 B4:.5 A4:.5 A4:.5 G4:1  G4:3 -:1
          G4:.5 G4:.5 G4:.5 B4:1.5 D5:1  G4:.5 G4:.5 G4:.5 B4:1.5 D5:1  G5:.5 A5:.5 G5:.5 F5:.5 E5:.5 D5:.5 C5:1  C5:3 -:1`,
    ac: 'C:4 C:4 G7:4 G7:4 G7:4 G7:4 G7:4 C:4' },
  { t: 'La gaviota es voluble', o: 'La donna è mobile (Verdi, 1851)', bpm: 132, comp: 3, vueltas: 2,
    dice: 'Ópera, ¿eh? Un pirata con cultura vale por dos piratas.',
    mel: `E5:.5 E5:.5 E5:.5 G5:1 F5:.5  D5:3  D5:.5 D5:.5 D5:.5 F5:1 E5:.5  C5:3
          C5:.5 D5:.5 E5:.5 F5:.5 G5:.5 A5:.5  G5:1 F5:1 E5:1  D5:.5 E5:.5 F5:.5 E5:.5 D5:.5 B4:.5  C5:3`,
    ac: 'C:3 G7:3 G7:3 C:3 F:3 C:3 G7:3 C:3' },
  { t: '¡Oh, Susana (no llores, que vuelvo)!', o: 'Oh! Susanna (Stephen Foster, 1848)', bpm: 132, comp: 4, vueltas: 1,
    dice: 'Una de banjo, pero con guitarra. Nadie se ha quejado. Todavía.',
    mel: `C4:.5 D4:.5  E4:1 G4:1 G4:1.5 A4:.5  G4:1 E4:1 C4:1.5 D4:.5  E4:1 E4:1 D4:1 C4:1  D4:3 C4:.5 D4:.5
          E4:1 G4:1 G4:1.5 A4:.5  G4:1 E4:1 C4:1.5 D4:.5  E4:1 E4:1 D4:1 D4:1  C4:4
          F4:2 F4:2  A4:1 A4:2 A4:1  G4:1 G4:1 E4:1 C4:1  D4:3 C4:.5 D4:.5
          E4:1 G4:1 G4:1.5 A4:.5  G4:1 E4:1 C4:1.5 D4:.5  E4:1 E4:1 D4:1 D4:1  C4:4`,
    ac: 'C:1 C:4 C:4 C:4 G7:4 C:4 C:4 G7:4 C:4 F:4 F:4 C:4 G7:4 C:4 C:4 G7:4 C:4' },
  { t: 'Clementina, la del faro', o: 'Oh My Darling, Clementine (popular)', bpm: 150, comp: 3, vueltas: 2,
    dice: 'Es triste, pero la toco alegre. Es mi estilo: la pena, con ritmo.',
    mel: `C4:.5 C4:.5  C4:1 G3:1 E4:.5 E4:.5  E4:1 C4:1 C4:.5 E4:.5  G4:1.5 G4:.5 F4:.5 E4:.5  D4:2 D4:.5 E4:.5
          F4:1 F4:1 E4:.5 D4:.5  E4:1 C4:1 C4:.5 E4:.5  D4:1 G3:1.5 B3:.5  C4:3`,
    ac: 'C:1 C:3 C:3 C:3 G7:3 G7:3 C:3 G7:3 C:3' },
  { t: 'Himno del grog', o: 'Himno de la alegría (Beethoven, 1824)', bpm: 116, comp: 4, vueltas: 2,
    dice: 'Beethoven la compuso pensando en mí. No lo sabía, pero en el fondo sí.',
    mel: `E4:1 E4:1 F4:1 G4:1  G4:1 F4:1 E4:1 D4:1  C4:1 C4:1 D4:1 E4:1  E4:1.5 D4:.5 D4:2
          E4:1 E4:1 F4:1 G4:1  G4:1 F4:1 E4:1 D4:1  C4:1 C4:1 D4:1 E4:1  D4:1.5 C4:.5 C4:2`,
    ac: 'C:4 G:4 C:4 G:4 C:4 G:4 C:4 G:2 C:2' },
  { t: 'Mangas verdes (de tanto remar)', o: 'Greensleeves (popular inglesa)', bpm: 108, comp: 3, vueltas: 1,
    dice: 'Una balada antigua. Mi abuela me la cantaba. Bueno, la abuela del libro del que salí.',
    mel: `A4:1  C5:2 D5:1  E5:1.5 F5:.5 E5:1  D5:2 B4:1  G4:1.5 A4:.5 B4:1  C5:2 A4:1  A4:1.5 G#4:.5 A4:1  B4:2 G#4:1  E4:2 A4:1
          C5:2 D5:1  E5:1.5 F5:.5 E5:1  D5:2 B4:1  G4:1.5 A4:.5 B4:1  C5:1.5 B4:.5 A4:1  G#4:1.5 F#4:.5 G#4:1  A4:3`,
    ac: 'Am:1 Am:3 C:3 G:3 Em:3 Am:3 Am:3 E:3 E:3 Am:3 C:3 G:3 Em:3 Am:3 E:3 Am:3' }
];

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function midiDe(n) {   // «C#5» → 73
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); if (!m) return null;
  return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
// Acorde «Am», «G7», «Bb»: raíz (en la octava 3) e intervalos
export function acordeDe(a) {
  const m = /^([A-G])(#|b)?(m)?(7)?$/.exec(a); if (!m) return { raiz: 48, iv: [0, 4, 7] };
  const raiz = 48 + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const iv = [0, m[3] ? 3 : 4, 7]; if (m[4]) iv.push(10);
  return { raiz: raiz > 54 ? raiz - 12 : raiz, iv };
}
// La partitura lista para tocar: eventos con su pulso de inicio
export function partitura(c) {
  const ev = [];
  let b = 0;
  for (const tok of c.mel.trim().split(/\s+/)) { const [n, d] = tok.split(':'), dur = +d; if (n !== '-') ev.push({ b, mel: midiDe(n), dur }); b += dur; }
  const finMel = b; b = 0;
  for (const tok of c.ac.trim().split(/\s+/)) { const [a, d] = tok.split(':'); ev.push({ b, ac: acordeDe(a), dur: +d }); b += +d; }
  ev.sort((x, y) => x.b - y.b);
  return { ev, fin: Math.max(finMel, b) };
}
