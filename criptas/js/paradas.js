// =============================================================
//  LAS PARADAS DE MORRANDAR (modo aventura)
//  Morrandar camina y se para en sitios distintos. Cada parada usa el mismo
//  escenario libre (claro.html?p=<id>) con su paisaje, su guía, lo que hay
//  que recoger, sus monstruos y su cripta. Para añadir una parada basta con
//  copiar un bloque y cambiarle los textos y los colores.
// =============================================================

export const PARADAS = {
  claro: {
    nombre: 'El claro de los huesos', corto: 'El claro', icono: '🌲',
    descripcion: 'Un claro del bosque al atardecer. Esqueletos en el sendero y una cripta con runas.',
    tema: null,                                   // el aspecto de siempre
    guia: { nombre: 'Brezo', sub: 'Guardabosques', modelo: { tunica: '#4e8a4a', adorno: '#e8c27a', sombrero: 'capucha', colorSombrero: '#3b6b3a', pelo: '#c9702e', baston: 'cayado', capa: '#7a4a2e' } },
    objeto: { nombre: 'Seta de luz', plural: 'setas de luz', corto: 'Setas de luz', sombrero: '#5ad1ff', brillo: '#3ab8ff', chispas: '#9fe8ff' },
    enemigo: { tipo: 'esqueleto', nombre: 'Esqueleto', plural: 'esqueletos', grupos: ['Esqueletos del sendero', 'Guardia de la cripta'], jefe: 'Capitán Fémur' },
    cripta: { nombre: 'Cripta de los Huesos', semilla: 'CLARO', nivel: 6, titulo: 'La Cripta de los Huesos' },
    textos: {
      saludo: ['¡Anda! Un viajero bajando de Morrandar. Hacía semanas que la tortuga no paraba en este claro.', 'Yo cuido el bosque, pero desde que se abrió la cripta, los esqueletos se pasean por el sendero como si fuera suyo.', 'Si me traes tres setas de luz (brillan azules, no tiene pérdida) y espantas a los dos grupos de esqueletos, te doy la llave de runas.'],
      hecho: ['¡Lo has conseguido! Las setas brillan de maravilla y los esqueletos… bueno, ahora son decoración.', 'Toma la llave de runas. La cripta te espera. Y unas monedas, que el camino es largo.'],
      pista: 'Las setas suelen esconderse cerca del agua y entre las rocas.',
      abierta: 'La cripta ya está abierta. Dicen que dentro hay un nigromante que colecciona calaveras. Tú no le des la tuya.',
      vuelta: ['¡Has vuelto entero! Bueno, casi entero. Cuéntamelo todo… No, espera, ya me lo cuentan tus botas: barro de cripta y polvo de hueso.', 'Toma, una poción de las buenas. Y que sepas que el bosque respira más tranquilo esta noche.'],
      despues: 'Abajo los huesos se vuelven a montar solos, así que si te aburres, ya sabes dónde hay pelea.',
      rescate: ['¡Menos mal que pasaba por allí! Te he traído a rastras hasta la hoguera.', 'Descansa y vuelve a intentarlo. Los esqueletos no se van a ir a ningún sitio. Literalmente: no tienen adónde.'],
      rescateCripta: ['¡Te he sacado a rastras de esa cripta! Estabas más tieso que los esqueletos.', 'Descansa junto al fuego y vuelve a bajar cuando quieras. Lo que ganaste, ganado está.'],
      cartel: ['«➜ Cripta de los Huesos. ⬅ Morrandar (la tortuga grande, no tiene pérdida).»', 'Alguien ha añadido a lápiz: «Cuidado con el capitán. Muerde.»'],
      cerrada: 'La puerta está sellada con runas que zumban. Hace falta una llave… Seguro que la guardabosques sabe algo.',
      estanque: 'Un pez asoma, te mira de arriba abajo y se vuelve a meter. Juzgado por un pez.',
      hoguera: 'Crepita a gusto. Huele a pino y a castañas que no hay.',
      mision: 'Habla con Brezo, junto a la hoguera'
    }
  },
  pantano: {
    nombre: 'El pantano de las brujas', corto: 'El pantano', icono: '🐸',
    descripcion: 'Agua verde, niebla baja y ranas que opinan. Los zombis salen del barro y una bruja vieja guarda la Ciénaga Hundida.',
    requiere: 'claro',                          // se abre al vencer la cripta del claro
    tema: {
      colores: { cieloAlto: '#1f2a3a', cieloMedio: '#5a6a5a', horizonte: '#b8c08a', niebla: '#8a9a78', hierba: '#5a7a3a', hierbaOscura: '#3a5a2a', hierbaClara: '#8a9a4a', camino: '#7a6a4a', tierra: '#4a3a2a', tronco: '#4a3a2e', copa: '#4a6a3a', copa2: '#5a7a42', copa3: '#3a5232', agua: '#5a8a5a', aguaHonda: '#2a4a32', roca: '#6a7a6a', roca2: '#5a6a5a' },
      niebla: [20, 120], neblinaBaja: '#d8e8c8', sonido: 'pantano', flores: ['#c8e05a', '#e8e0a0', '#9ad0a0'], hojas: ['#7a8a4a', '#5a6a3a', '#a8a050', '#6a5a3a'], luzSol: '#d8e0b0', cielo: '#a8b8a0'
    },
    // Su propio mapa: la cripta al oeste, el fuego al este y el suelo lleno de charcas
    mapa: {
      sitios: { hoguera: [8, -16], guarda: [10.5, -17.6], cartel: [-10, -21], estanque: [9, 5], cripta: [-26, 5], colina: [-32, 5] },
      criptaGiro: Math.PI / 2,
      camino: [[-6, -31], [-8, -24], [-11, -18], [-15, -12], [-18, -6], [-20, -1], [-22, 3], [-24, 5], [-25, 5]],
      charcas: [[19, -4, 3.4], [-1, 13, 3.8], [21, 15, 3], [-12, 17, 3.2], [2, -7, 2.4], [-30, -16, 2.8], [30, 4, 2.6]],
      arboles: [[3, -24, 1.1, 41], [15, -11, 1.1, 53], [-4, -2, 1.25, 67], [-20, 18, 1.2, 83]],
      rocas: [[-13, -27, 1.1], [11, -27, .8], [-7, 3, .7], [25, -12, 1.4], [-28, -8, 1], [11, 20, .9], [2, 24, 1.2], [27, 10, .7], [-17, 9, .8]],
      grupos: [[-13, -7], [-18, 13]],
      objetos: [[14, -1], [-6, 9], [17, 10], [-8, 21], [6, -11], [-24, -12]],
      cofre: [-31, -6], parcela: [22, -21]
    },
    guia: { nombre: 'Abuela Cieno', sub: 'Curandera del pantano', modelo: { tunica: '#5a4a6a', adorno: '#a8c870', sombrero: 'pico', colorSombrero: '#3a2a4a', pelo: '#d8d8d0', piel: '#c8d0a8', baston: 'cristal', cristal: '#9aff5a' } },
    objeto: { nombre: 'Flor de ciénaga', plural: 'flores de ciénaga', corto: 'Flores de ciénaga', sombrero: '#e8a0ff', brillo: '#c060ff', chispas: '#e8c0ff' },
    enemigo: { tipo: 'zombi', nombre: 'Zombi', plural: 'zombis', grupos: ['Zombis del barro', 'Guardia de la ciénaga'], jefe: 'Sargento Fangoso', color: '#9ab07a', ojo: '#d8ff5a' },
    cripta: { nombre: 'Ciénaga Hundida', semilla: 'PANTANO', nivel: 8, titulo: 'La Ciénaga Hundida', monstruos: ['zombi', 'zombi', 'bruja', 'momia', 'esqueleto'] },
    textos: {
      saludo: ['Mira tú por dónde: un héroe con las botas limpias. Eso se arregla en este pantano en dos pasos.', 'Soy la Abuela Cieno. Curo verrugas, mal de ojo y resfriados de rana. Lo que no curo es a los zombis que salen del barro desde que alguien abrió la Ciénaga Hundida.', 'Tráeme tres flores de ciénaga (son moradas y brillan, no te comas ninguna) y quítame de en medio a esos dos grupos de zombis. Te daré el amuleto que abre la ciénaga.'],
      hecho: ['¡Ja! Tres flores y ni un zombi en pie. Tú vales más que tus botas.', 'Toma el amuleto de la ciénaga. Y estas monedas, que yo con ellas solo compro ranas.'],
      pista: 'Las flores se esconden en las orillas y entre las piedras con musgo. Mira donde croen las ranas.',
      abierta: 'La ciénaga ya está abierta. Huele a sopa de calcetín, pero dentro hay cosas que brillan.',
      vuelta: ['¡Sigues vivo! Y oliendo a ciénaga, que es como se huele aquí el éxito.', 'Toma una poción. Es de las mías: sabe a rana, pero cura de verdad.'],
      despues: 'Los zombis de la ciénaga vuelven a salir del barro cada noche. Son como las setas, pero con peor humor.',
      rescate: ['¡Arriba, que te me ahogas en el barro! Te he arrastrado hasta el fuego.', 'Los zombis no corren, pero tampoco se cansan. Descansa y vuelve con más cabeza.'],
      rescateCripta: ['Te han sacado de la ciénaga más verde que una rana. Siéntate al fuego.', 'Lo que ganaste ahí abajo, tuyo es. Lo que perdiste… era dignidad, y esa vuelve sola.'],
      cartel: ['«➜ Ciénaga Hundida (no apta para botas buenas). ⬅ Morrandar.»', 'Debajo, con letra de abuela: «Las ranas no se tocan».'],
      cerrada: 'Unas raíces gordas tapan la entrada y laten como si respiraran. La Abuela Cieno sabrá cómo abrirlas.',
      estanque: 'Una rana te mira, se infla y dice algo que suena muy a «croac». Seguramente te ha insultado.',
      hoguera: 'El fuego sisea con la humedad. Huele a turba y a sopa de algo.',
      mision: 'Habla con la Abuela Cieno, junto al fuego'
    }
  }
};

export const paradaDe = (id) => PARADAS[id] || PARADAS.claro;
// ¿Está abierta esta parada para este héroe? (la siguiente se abre al vencer la cripta de la anterior)
export function paradaAbierta(id, h) {
  const p = PARADAS[id]; if (!p) return false;
  if (!p.requiere) return true;
  return criptaHechaEn(p.requiere, h);
}
export function criptaHechaEn(id, h) {
  if (!h) return false;
  return id === 'claro' ? !!h.criptaHecha : !!h.paradas?.[id]?.criptaHecha;
}
