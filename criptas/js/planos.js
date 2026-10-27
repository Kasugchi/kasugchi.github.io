// =============================================================
//  PLANOS: la forma de cada mazmorra.
//  Cada fila es una línea del tablero. '.' = pasillo, '#' = roca maciza
//  (fuera del mapa) y cualquier otra letra = una sala (letras distintas,
//  salas distintas). Las paredes salen solas entre regiones distintas.
//  Una misión elige plano con "plano": "torre" o trae el suyo dibujado;
//  sin plano, el clásico. Para añadir uno: ponlo aquí y, si quieres que
//  salga en la Mazmorra Infinita, en PLANOS_ZONA (js/procedural.js).
//  Los generó un script; se pueden retocar a mano.
// =============================================================
import { TABLERO_CLASICO } from './datos.js';

export const PLANOS = {
  clasico: { nombre: 'Clásico', desc: 'El tablero de siempre: tres filas de salas y pasillos rectos.', filas: TABLERO_CLASICO },
  cuevas: {
    nombre: 'Cuevas', desc: 'Grutas irregulares unidas por túneles estrechos.',
    filas: [
      '########EE######DDDD###GGG##',
      'JJJJJ##EEEE####DDDDD##GGGG##',
      'JJJJJ##EEEE....DDDDD##GGGGG#',
      '#JJJJ.##EE####..DDD###GGGG##',
      '#JJJ#.#########..#####.#####',
      '#####.##########.####..#####',
      '#####.##HHHH####.......IIII#',
      '#CCC#.##HHH#####.#####.IIIII',
      'CCCCC.###HH#####.#####.IIIII',
      'CCCCC.....######.#A###.#I###',
      '#CCC##...........AAA##.#####',
      '#CCC##.#.BBBBB##AAAAA#..####',
      '######.#BBBBBB##AAAAA#..F###',
      '######.##BBBBB##AAAA###FFF##',
      'KKKKKK.################FFFF#',
      'KKKKK##################FFFF#',
      'KKKKK#######################',
      '#KKK########################'
    ]
  },
  torre: {
    nombre: 'Torre', desc: 'Una torre redonda: salón central, dos anillos de pasillo y estancias alrededor.',
    filas: [
      '########RSSSSSSST########',
      '######RRRRSS.SSTTTT######',
      '####RRRRR.......TTTTT####',
      '###RRRR...GG.HH...TTTU###',
      '##QQRR..GGGG.HHHH..TUUU##',
      '##QQQGGGGGGG.HHHHHHIUUU##',
      '#QQQ.FGGGGGG.HHHHHII.UUU#',
      '#QQ..FFGGGGG.HHHHIII..UU#',
      'QQQ.FFFFG.......IIIII.UUU',
      'PQ..FFFF...AAA...IIII..UJ',
      'PP.FFFFF..AAAAA..IIIII.JJ',
      'PP.FFFFF.AAAAAAA.IIIII.JJ',
      'P........AAAAAAA........J',
      'PP.EEEEE.AAAAAAA.BBBBB.JJ',
      'PP.EEEEE..AAAAA..BBBBB.JJ',
      'PO..EEEE...AAA...BBBB..KJ',
      'OOO.EEEEE.......CBBBB.KKK',
      '#OO..EEEDDDD.CCCCCBB..KK#',
      '#OOO.EEDDDDD.CCCCCCB.KKK#',
      '##OOOEDDDDDD.CCCCCCLKKK##',
      '##OOON..DDDD.CCCC..LLKK##',
      '###ONNN...DD.CC...LLLL###',
      '####NNNNN.......LLLLL####',
      '######NNNNMM.MMLLLL######',
      '########NMMMMMMML########'
    ]
  },
  fortaleza: {
    nombre: 'Fortaleza', desc: 'Un castillo con patio de armas, cuatro torres y alas a los lados.',
    filas: [
      '##II###MMMMMNNNNNNOOOOO###JJ##',
      '#IIII##MMMMMNNNNNNOOOOO##JJJJ#',
      'IIIIII#MMMMMNNNNNNOOOOO#JJJJJJ',
      'IIIIII#MMMMMNNNNNNOOOOO#JJJJJJ',
      '#IIII....................JJJJ#',
      '##II#.AAAABBBB..CCCCDDDD.#JJ##',
      '#####.AAAABBBB..CCCCDDDD.#####',
      'RRRRR.AAAABBBB..CCCCDDDD.SSSSS',
      'RRRRR.AAAABBBB..CCCCDDDD.SSSSS',
      'RRRRR.AAAABBBB..CCCCDDDD.SSSSS',
      'RRRRR....................SSSSS',
      'RRRRR.EEEEFFFF..GGGGHHHH.SSSSS',
      'RRRRR.EEEEFFFF..GGGGHHHH.SSSSS',
      'RRRRR.EEEEFFFF..GGGGHHHH.SSSSS',
      '#####.EEEEFFFF..GGGGHHHH.#####',
      '##KK#.EEEEFFFF..GGGGHHHH.#LL##',
      '#KKKK....................LLLL#',
      'KKKKKK#PPPPPPP..QQQQQQQ#LLLLLL',
      'KKKKKK#PPPPPPP..QQQQQQQ#LLLLLL',
      '#KKKK##PPPPPPP..QQQQQQQ##LLLL#',
      '##KK###PPPPPPP..QQQQQQQ###LL##'
    ]
  },
  cripta: {
    nombre: 'Cripta', desc: 'Una catedral en cruz: nave, crucero, capillas, osarios y ábside.',
    filas: [
      '##########AA##########',
      '########AAAAAA########',
      '#######AAAAAAAA#######',
      '#######AAAAAAAA#######',
      'DDDDDBAAAAAAAAAACEEEEE',
      'DDDDDBBBB#..#CCCCEEEEE',
      'DDDDDBBBB#..#CCCCEEEEE',
      'DDDDDBBBB#..#CCCCEEEEE',
      '......................',
      'LLLLL.####..####.MMMMM',
      'LLLLL.FFFF..GGGG.MMMMM',
      'LLLLL.FFFF..GGGG.MMMMM',
      'LLLLL.FFFF..GGGG.MMMMM',
      'LLLLL.####..####.MMMMM',
      '#####.HHHH..IIII.#####',
      'NNNNN.HHHH..IIII.OOOOO',
      'NNNNN.HHHH..IIII.OOOOO',
      'NNNNN.####..####.OOOOO',
      'NNNNN.JJJJ..KKKK.OOOOO',
      'NNNNN.JJJJ..KKKK.OOOOO',
      'NNNNN.JJJJ..KKKK.OOOOO',
      '#####............#####'
    ]
  },
  barco: {
    nombre: 'Barco hundido', desc: 'El casco de un barco: camarotes, bodega, cocina y proa.',
    filas: [
      '##AAAAA.CCCCDDD.FFFFGGG.JJJ######',
      '#AAAAAA.CCCCDDD.FFFFGGG.JJJJJ####',
      'AAAAAAA.CCCCDDD.FFFFGGG.JJJJJJJ##',
      'AAAAAAA.CCCCDDD.FFFFGGG.JJJJJJJJ#',
      'AAAAAAA.CCCCDDD.FFFFGGG.JJJJJJJJ#',
      'AAAAAAA.CCCCDDD.FFFFGGG.JJJJJJJJJ',
      '#............................LLLL',
      'BBBBBBB.EEEEEEE.HHHHHHH.KKKKKKKKK',
      'BBBBBBB.EEEEEEE.HHHHHHH.KKKKKKKK#',
      'BBBBBBB.EEEEEEE.HHHHHHH.KKKKKKKK#',
      'BBBBBBB.EEEEEEE.IIIIIII.KKKKKKK##',
      '#BBBBBB.EEEEEEE.IIIIIII.KKKKK####',
      '##BBBBB.EEEEEEE.IIIIIII.KKK######'
    ]
  }
};
