export default function (H) {
  const { THREE, caja, cil, bola, lam, pz, brilla, MAD, MAD2, ORO } = H;
  return {
    // ==========================================
    // LOTE 1: COCINA Y COMEDOR (coc) - tienda
    // ==========================================
    cocTetera: { n: 'Juego de té', e: '🫖', w: 1, d: 1, de: 'tienda', precio: 90, f(g) {
      pz(g, cil(.28, .28, .04, MAD), 0, .02, 0);
      pz(g, bola(.14, '#d8e2dc'), 0, .16, 0);
      pz(g, cil(.05, .07, .06, '#d8e2dc', 8), 0, .28, 0);
      pz(g, cil(.06, .04, .08, '#d8e2dc', 8), .16, .06, .05);
      pz(g, cil(.06, .04, .08, '#d8e2dc', 8), -.15, .06, -.06);
    } },

    cocMesaBanco: { n: 'Mesa con banco rústico', e: '🪵', w: 2, d: 1, de: 'tienda', precio: 260, f(g) {
      pz(g, caja(1.7, .08, .55, MAD), 0, .72, -.18);
      pz(g, caja(.1, .7, .48, MAD2), -.65, .35, -.18);
      pz(g, caja(.1, .7, .48, MAD2), .65, .35, -.18);
      pz(g, caja(1.6, .06, .26, MAD), 0, .44, .25);
      pz(g, caja(.08, .42, .22, MAD2), -.6, .21, .25);
      pz(g, caja(.08, .42, .22, MAD2), .6, .21, .25);
    } },

    cocDespensa: { n: 'Alacena campestre', e: '🚪', w: 2, d: 1, de: 'tienda', precio: 380, f(g) {
      pz(g, caja(1.6, 1.8, .6, MAD), 0, .9, -.15);
      pz(g, caja(1.4, .7, .5, MAD2), 0, .45, -.12);
      pz(g, caja(1.45, .05, .52, MAD), 0, .85, -.12);
      pz(g, caja(1.35, .04, .45, '#e2d4b7'), 0, 1.25, -.12);
      pz(g, cil(.1, .08, .22, '#b2533e', 8), -.35, 1.38, -.1);
      pz(g, cil(.08, .08, .18, '#709775', 8), .35, 1.36, -.1);
      pz(g, bola(.04, ORO), -.2, .5, .17);
      pz(g, bola(.04, ORO), .2, .5, .17);
    } },

    cocMesaAmasar: { n: 'Mesa de amasar', e: '🥖', w: 2, d: 1, de: 'tienda', precio: 220, f(g) {
      pz(g, caja(1.6, .08, .75, MAD), 0, .75, 0);
      for (const [x, z] of [[-.68, -.28], [.68, -.28], [-.68, .28], [.68, .28]]) pz(g, cil(.04, .04, .72, MAD2, 6), x, .36, z);
      pz(g, caja(.5, .03, .35, MAD2), 0, .8, -.05);
      pz(g, cil(.04, .04, .38, MAD, 8), 0, .84, -.05, 0, 0, Math.PI / 2);
      pz(g, bola(.12, '#f3e9d2'), -.35, .86, .1);
    } },

    cocFregadero: { n: 'Fregadero de piedra', e: '🚰', w: 1, d: 1, de: 'tienda', precio: 190, f(g) {
      pz(g, caja(.78, .7, .75, '#8d99ae'), 0, .35, 0);
      pz(g, caja(.6, .18, .55, '#2b2d42'), 0, .66, .02);
      pz(g, caja(.56, .02, .5, '#48cae4', { transparent: true, opacity: .4 }), 0, .65, .02);
      pz(g, cil(.025, .025, .32, ORO, 8), 0, .86, -.25);
      pz(g, cil(.025, .025, .16, ORO, 8), 0, 1.0, -.18, Math.PI / 2, 0, 0);
    } },

    cocTablaQuesos: { n: 'Tabla con surtido de quesos', e: '🧀', w: 1, d: 1, de: 'tienda', precio: 80, f(g) {
      pz(g, cil(.32, .32, .03, MAD, 12), 0, .015, 0);
      pz(g, caja(.16, .09, .14, '#ffb703'), -.08, .07, .02);
      pz(g, cil(.12, .12, .08, '#f7d070', 8), .1, .06, -.05);
      pz(g, cil(.015, .015, .18, '#333333', 6), .05, .04, .16, 0, .4, Math.PI / 2);
    } },

    cocTaburetePaja: { n: 'Taburete de paja', e: '🪑', w: 1, d: 1, de: 'tienda', precio: 95, uso: 'sentar', f(g) {
      pz(g, cil(.22, .24, .08, '#dda15e', 8), 0, .44, 0);
      for (const [x, z] of [[-.13, -.13], [.13, -.13], [-.13, .13], [.13, .13]]) pz(g, cil(.028, .028, .42, MAD2, 6), x, .21, z);
      pz(g, cil(.16, .16, .03, MAD, 8), 0, .2, 0);
    } },

    cocBarrilVino: { n: 'Barril de bodega', e: '🛢️', w: 1, d: 1, de: 'tienda', precio: 150, f(g) {
      pz(g, cil(.32, .32, .15, MAD2, 8), 0, .08, 0);
      pz(g, cil(.38, .34, .7, MAD, 10), 0, .48, 0);
      pz(g, cil(.39, .39, .04, '#3a3a3a', 10), 0, .3, 0);
      pz(g, cil(.39, .39, .04, '#3a3a3a', 10), 0, .65, 0);
      pz(g, cil(.03, .03, .1, ORO, 6), 0, .45, .36, Math.PI / 2, 0, 0);
    } },

    cocCestaPan: { n: 'Cesta con panes dorados', e: '🧺', w: 1, d: 1, de: 'tienda', precio: 75, f(g) {
      pz(g, cil(.3, .22, .22, '#bc6c25', 10), 0, .11, 0);
      pz(g, cil(.06, .06, .45, '#d4a373', 8), -.06, .26, 0, .2, 0, .3);
      pz(g, cil(.06, .06, .42, '#c68b59', 8), .07, .25, .04, -.2, 0, -.2);
      pz(g, bola(.1, '#dda15e'), 0, .24, -.07);
    } },

    cocEstufaHierro: { n: 'Estufa de leña', e: '🔥', w: 1, d: 1, de: 'tienda', precio: 340, luz: 0.6, f(g) {
      pz(g, caja(.68, .7, .68, '#2b2d42'), 0, .35, 0);
      pz(g, caja(.38, .32, .05, '#d90429', brilla('#ff7b00', .9)), 0, .34, .33);
      pz(g, cil(.1, .1, 1.1, '#1b1d28', 8), 0, 1.25, -.15);
      for (const [x, z] of [[-.28, -.28], [.28, -.28], [-.28, .28], [.28, .28]]) pz(g, cil(.04, .03, .12, '#1b1d28', 6), x, .06, z);
    } },

    cocArmarioHierbas: { n: 'Estante de especias', e: '🌿', w: 1, d: 1, de: 'tienda', precio: 170, f(g) {
      pz(g, caja(.76, 1.2, .28, MAD), 0, .85, -.28);
      pz(g, caja(.7, .04, .25, MAD2), 0, .5, -.28);
      pz(g, caja(.7, .04, .25, MAD2), 0, .85, -.28);
      pz(g, caja(.7, .04, .25, MAD2), 0, 1.2, -.28);
      pz(g, cil(.05, .05, .15, '#588157', 6), -.2, .6, -.26);
      pz(g, cil(.05, .05, .14, '#f4a261', 6), 0, .6, -.26);
      pz(g, cil(.05, .05, .16, '#e76f51', 6), .2, .6, -.26);
      pz(g, cil(.06, .06, .16, '#dda15e', 8), -.12, .96, -.26);
    } },

    cocCalderoPuchero: { n: 'Puchero humeante', e: '🍲', w: 1, d: 1, de: 'tienda', precio: 140, luz: 0.45, f(g) {
      pz(g, cil(.16, .22, .08, '#333333', 8), 0, .04, 0);
      pz(g, cil(.28, .24, .36, '#264653', 10), 0, .26, 0);
      pz(g, cil(.25, .25, .02, '#e76f51', 8, brilla('#f4a261', .8)), 0, .42, 0);
      pz(g, cil(.02, .02, .45, MAD, 6), .05, .46, .05, .3, 0, .2);
    } },

    cocMesaRedonda: { n: 'Mesa redonda de mesón', e: '🪑', w: 2, d: 2, de: 'tienda', precio: 290, f(g) {
      pz(g, cil(.88, .88, .08, MAD, 14), 0, .72, 0);
      pz(g, cil(.12, .16, .66, MAD2, 10), 0, .34, 0);
      pz(g, cil(.5, .55, .08, MAD2, 10), 0, .04, 0);
    } },

    cocCarretillaHortalizas: { n: 'Cajón de hortalizas', e: '🥕', w: 1, d: 1, de: 'tienda', precio: 110, f(g) {
      pz(g, caja(.7, .38, .55, MAD), 0, .19, 0);
      pz(g, caja(.62, .3, .47, MAD2), 0, .22, 0);
      pz(g, cil(.05, .01, .3, '#f77f00', 6), -.14, .32, .05, .3, 0, .2);
      pz(g, cil(.05, .01, .28, '#f77f00', 6), 0, .33, -.08, -.2, 0, .4);
      pz(g, bola(.1, '#70e000'), .15, .34, .08);
      pz(g, bola(.09, '#e63946'), .16, .33, -.1);
    } },

    cocBanquetaLarga: { n: 'Banqueta comunal', e: '🪑', w: 3, d: 1, de: 'tienda', precio: 240, uso: 'sentar', f(g) {
      pz(g, caja(2.7, .07, .42, MAD), 0, .46, 0);
      pz(g, caja(.08, .42, .36, MAD2), -1.15, .21, 0);
      pz(g, caja(.08, .42, .36, MAD2), 0, .21, 0);
      pz(g, caja(.08, .42, .36, MAD2), 1.15, .21, 0);
      pz(g, caja(2.4, .06, .08, MAD2), 0, .25, 0);
    } },

    // ==========================================
    // LOTE 4: MARINERO Y PIRATA (mar) - tienda
    // ==========================================
    marFaroMiniatura: { n: 'Faro vigía en miniatura', e: '🗼', w: 1, d: 1, de: 'tienda', precio: 280, luz: 1.45, f(g) {
      pz(g, cil(.32, .38, .18, '#4a5568', 10), 0, .09, 0);
      pz(g, cil(.2, .3, .9, '#edf2f7', 10), 0, .63, 0);
      pz(g, cil(.23, .25, .15, '#e53e3e', 10), 0, .85, 0);
      pz(g, cil(.18, .22, .24, '#2d3748', 8), 0, 1.18, 0);
      pz(g, cil(.14, .14, .18, '#fef08a', 8, brilla('#fde047', .95)), 0, 1.37, 0);
      pz(g, cil(.02, .18, .2, '#1a202c', 8), 0, 1.55, 0);
    } },

    marRedPesca: { n: 'Red de pesca con corchos', e: '🕸️', w: 2, d: 2, de: 'tienda', precio: 130, capa: 'suelo', f(g) {
      pz(g, caja(1.8, .015, 1.8, '#a3a380'), 0, .008, 0);
      pz(g, caja(1.4, .02, 1.4, '#77625c'), 0, .01, 0);
      pz(g, cil(.05, .05, .12, '#b08968', 6), -.6, .04, -.5, 0, .8, Math.PI / 2);
      pz(g, cil(.05, .05, .12, '#b08968', 6), .5, .04, .4, 0, -.4, Math.PI / 2);
      pz(g, cil(.05, .05, .12, '#b08968', 6), -.2, .04, .6, 0, .2, Math.PI / 2);
    } },

    marCofreMonedas: { n: 'Cofre repleto de doblones', e: '🪙', w: 1, d: 1, de: 'tienda', precio: 390, f(g) {
      pz(g, caja(.68, .36, .48, MAD2), 0, .18, 0);
      pz(g, caja(.64, .08, .44, ORO), 0, .36, 0);
      pz(g, caja(.7, .16, .5, MAD), 0, .48, -.14, -.45, 0, 0);
      pz(g, caja(.08, .12, .02, ORO), 0, .26, .24);
      pz(g, bola(.08, ORO), -.15, .42, .08);
      pz(g, bola(.07, ORO), .12, .41, .06);
    } },

    marBanderaPirata: { n: 'Bandera con mástil negro', e: '🏴‍☠️', w: 1, d: 1, de: 'tienda', precio: 190, f(g) {
      pz(g, cil(.2, .26, .1, MAD2, 8), 0, .05, 0);
      pz(g, cil(.035, .035, 1.9, MAD, 8), 0, 1.0, 0);
      pz(g, caja(.02, .5, .55, '#1e1e1e'), .01, 1.55, .26);
      pz(g, bola(.09, '#f8f9fa'), .02, 1.57, .26);
    } },

    marBarcoMaqueta: { n: 'Maqueta de fragata velera', e: '⛵', w: 1, d: 1, de: 'tienda', precio: 220, f(g) {
      pz(g, caja(.6, .08, .28, MAD2), 0, .04, 0);
      pz(g, caja(.68, .18, .24, MAD), 0, .17, 0);
      pz(g, cil(.018, .018, .7, MAD2, 6), -.14, .52, 0);
      pz(g, cil(.018, .018, .78, MAD2, 6), .08, .56, 0);
      pz(g, caja(.01, .25, .2, '#f8f9fa'), -.14, .58, 0);
      pz(g, caja(.01, .3, .22, '#f8f9fa'), .08, .62, 0);
    } },

    marMascaronSirena: { n: 'Mascarón tallado de sirena', e: '🧜‍♀️', w: 1, d: 1, de: 'tienda', precio: 310, f(g) {
      pz(g, caja(.45, .8, .25, MAD2), 0, .4, -.32);
      pz(g, caja(.32, .65, .3, '#2a9d8f'), 0, .45, -.12, .3, 0, 0);
      pz(g, bola(.14, '#e76f51'), 0, .85, .02);
      pz(g, cil(.04, .16, .35, '#264653', 8), 0, .22, .05, -.5, 0, 0);
    } },

    marTimonPared: { n: 'Timón de nogal pulido', e: '☸️', w: 1, d: 1, de: 'tienda', precio: 250, f(g) {
      pz(g, caja(.25, .55, .15, MAD2), 0, .27, -.35);
      pz(g, cil(.28, .28, .06, MAD, 10), 0, .9, -.26, Math.PI / 2, 0, 0);
      pz(g, cil(.12, .12, .08, ORO, 8), 0, .9, -.24, Math.PI / 2, 0, 0);
      for (const a of [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4]) {
        pz(g, cil(.025, .025, .72, MAD2, 6), 0, .9, -.26, 0, 0, a);
      }
    } },

    marCanondeCubierta: { n: 'Cañón de abordaje', e: '💣', w: 2, d: 1, de: 'tienda', precio: 450, f(g) {
      pz(g, caja(1.1, .22, .5, MAD2), 0, .2, 0);
      for (const x of [-.4, .4]) for (const z of [-.28, .28]) pz(g, cil(.16, .16, .06, '#1a1a1a', 8), x, .16, z, Math.PI / 2, 0, 0);
      pz(g, cil(.14, .18, 1.5, '#2b2d42', 10), .1, .5, 0, 0, 0, -Math.PI / 2);
      pz(g, bola(.17, '#1a1a1a'), -.78, .5, 0);
    } },

    marMesaCartografia: { n: 'Mesa de cartografía marina', e: '🗺️', w: 2, d: 1, de: 'tienda', precio: 270, f(g) {
      pz(g, caja(1.65, .08, .75, MAD), 0, .74, 0);
      for (const [x, z] of [[-.7, -.28], [.7, -.28], [-.7, .28], [.7, .28]]) pz(g, cil(.04, .04, .7, MAD2, 6), x, .35, z);
      pz(g, caja(1.1, .015, .5, '#eddcd2'), 0, .79, 0);
      pz(g, cil(.06, .06, .08, ORO, 8), -.38, .84, -.1);
      pz(g, cil(.02, .02, .24, '#c1121f', 6), .3, .8, .12, 0, .5, Math.PI / 2);
    } },

    marAnclaHierro: { n: 'Ancla monumental oxidada', e: '⚓', w: 1, d: 1, de: 'tienda', precio: 320, f(g) {
      pz(g, cil(.07, .07, 1.45, '#3d405b', 8), 0, .74, -.08, -.2, 0, 0);
      pz(g, cil(.05, .05, .8, '#3d405b', 8), 0, 1.25, -.18, 0, 0, Math.PI / 2);
      pz(g, caja(.7, .08, .12, '#3d405b'), 0, .18, .05);
      pz(g, cil(.12, .12, .05, ORO, 8), 0, 1.45, -.24, Math.PI / 2, 0, 0);
    } },

    marHamacaMarinera: { n: 'Hamaca de lona', e: '🛏️', w: 2, d: 1, de: 'tienda', precio: 210, uso: 'sentar', f(g) {
      pz(g, cil(.05, .05, 1.1, MAD2, 6), -.88, .55, 0);
      pz(g, cil(.05, .05, 1.1, MAD2, 6), .88, .55, 0);
      pz(g, caja(1.5, .06, .65, '#f4f1de'), 0, .42, 0);
      pz(g, cil(.08, .08, .55, '#3d5a80', 8), -.5, .46, 0, Math.PI / 2, 0, 0);
    } },

    marCatalejoTripode: { n: 'Catalejo de latón sobre trípode', e: '🔭', w: 1, d: 1, de: 'tienda', precio: 290, f(g) {
      pz(g, cil(.02, .02, 1.0, MAD2, 6), -.14, .5, -.12, -.15, 0, .15);
      pz(g, cil(.02, .02, 1.0, MAD2, 6), .14, .5, -.12, -.15, 0, -.15);
      pz(g, cil(.02, .02, 1.0, MAD2, 6), 0, .5, .16, .2, 0, 0);
      pz(g, cil(.05, .07, .65, ORO, 10), 0, 1.12, 0, -.35, 0, 0);
      pz(g, cil(.08, .08, .05, '#2b2d42', 8), 0, 1.22, .24, -.35, 0, 0);
    } },

    marFarolPopa: { n: 'Farol de popa', e: '🏮', w: 1, d: 1, de: 'tienda', precio: 240, luz: 1.1, f(g) {
      pz(g, cil(.15, .2, .06, '#1a1a1a', 8), 0, .03, 0);
      pz(g, cil(.03, .03, .8, '#1a1a1a', 6), 0, .44, 0);
      pz(g, caja(.26, .35, .26, ORO), 0, .98, 0);
      pz(g, caja(.2, .26, .2, '#ffb703', brilla('#ffaa00', .95)), 0, .98, 0);
      pz(g, cil(.02, .18, .16, '#1a1a1a', 8), 0, 1.22, 0);
    } },

    marBanquetaRemo: { n: 'Banco largo de remeros', e: '🛶', w: 3, d: 1, de: 'tienda', precio: 230, uso: 'sentar', f(g) {
      pz(g, caja(2.7, .08, .45, MAD), 0, .44, 0);
      pz(g, caja(.1, .4, .38, MAD2), -1.1, .2, 0);
      pz(g, caja(.1, .4, .38, MAD2), 1.1, .2, 0);
      pz(g, cil(.03, .03, 2.6, MAD, 6), 0, .46, -.26, 0, 0, Math.PI / 2);
    } },

    marCajaPescado: { n: 'Caja con pesca fresca', e: '🐟', w: 1, d: 1, de: 'tienda', precio: 100, f(g) {
      pz(g, caja(.7, .3, .55, MAD), 0, .15, 0);
      pz(g, caja(.62, .15, .47, '#caf0f8', { transparent: true, opacity: .4 }), 0, .24, 0);
      pz(g, cil(.04, .04, .35, '#48cae4', 6), -.1, .28, .05, 0, .3, Math.PI / 2);
      pz(g, cil(.04, .04, .32, '#0096c7', 6), .1, .27, -.05, 0, -.4, Math.PI / 2);
    } },

    // ==========================================
    // LOTE 9: BOTÍN DE MAZMORRA (maz) - botin
    // ==========================================
    mazUrnaCenizas: { n: 'Urna misteriosa', e: '🏺', w: 1, d: 1, de: 'botin', art: 'una urna de arcilla sellada (suena como si tuviera canicas dentro)', f(g) {
      pz(g, cil(.18, .22, .08, '#582f0e', 10), 0, .04, 0);
      pz(g, bola(.24, '#7f4f24'), 0, .28, 0);
      pz(g, cil(.12, .16, .18, '#582f0e', 10), 0, .54, 0);
      pz(g, cil(.04, .14, .08, ORO, 8), 0, .66, 0);
    } },

    mazSarcofagoPequeno: { n: 'Sarcófago de piedra', e: '⚰️', w: 1, d: 2, de: 'botin', art: 'un sarcófago pequeño de piedra fría (la tapa está entreabierta)', f(g) {
      pz(g, caja(.75, .45, 1.7, '#6c757d'), 0, .225, 0);
      pz(g, caja(.82, .12, 1.75, '#495057'), .04, .5, .02, 0, .08, 0);
      pz(g, bola(.12, '#ced4da'), .04, .6, -.5);
    } },

    mazBraseroPiedra: { n: 'Brasero de mazmorra', e: '🔥', w: 1, d: 1, de: 'botin', art: 'un brasero con ascuas eternas (desprende calor acogedor)', luz: 0.9, f(g) {
      pz(g, cil(.26, .35, .12, '#343a40', 8), 0, .06, 0);
      pz(g, cil(.09, .12, .65, '#212529', 6), 0, .44, 0);
      pz(g, cil(.38, .2, .26, '#343a40', 10), 0, .85, 0);
      pz(g, bola(.18, '#e63946', brilla('#ff4d00', .95)), 0, .96, 0);
    } },

    mazTrampaPinchos: { n: 'Trampa de pinchos desactivada', e: '🪤', w: 2, d: 2, de: 'botin', art: 'una placa de suelo con pinchos oxidados (ya no pinchan casi nada)', capa: 'suelo', f(g) {
      pz(g, caja(1.85, .04, 1.85, '#3d405b'), 0, .02, 0);
      for (const x of [-.55, 0, .55]) {
        for (const z of [-.55, 0, .55]) {
          pz(g, cil(.01, .04, .25, '#8d99ae', 6), x, .16, z);
        }
      }
    } },

    mazTelaranaRincon: { n: 'Telaraña tupida', e: '🕸️', w: 1, d: 1, de: 'botin', art: 'una telaraña espesa con una arañita gorda que no muerde', f(g) {
      pz(g, caja(.85, .85, .02, '#e9ecef', { transparent: true, opacity: .4 }), -.05, .9, -.45);
      pz(g, caja(.02, .85, .85, '#e9ecef', { transparent: true, opacity: .4 }), -.45, .9, -.05);
      pz(g, bola(.06, '#1a1a1a'), -.32, .9, -.32);
    } },

    mazJaulaColgante: { n: 'Jaula de hierro herrumbroso', e: '⛓️', w: 1, d: 1, de: 'botin', art: 'una jaula con barrotes retorcidos (por dentro huele a humedad)', f(g) {
      pz(g, cil(.32, .32, .06, '#2b2d42', 8), 0, .03, 0);
      pz(g, cil(.32, .32, .06, '#2b2d42', 8), 0, .95, 0);
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        pz(g, cil(.02, .02, .88, '#4a4e69', 6), Math.cos(a) * .28, .49, Math.sin(a) * .28);
      }
      pz(g, cil(.015, .015, .8, '#22223b', 6), 0, 1.38, 0);
    } },

    mazGargolaRota: { n: 'Gárgola descabezada', e: '🗿', w: 1, d: 1, de: 'botin', art: 'una figura de piedra con alas rotas (te sigue con la pose)', f(g) {
      pz(g, caja(.6, .35, .6, '#495057'), 0, .175, 0);
      pz(g, caja(.38, .55, .32, '#6c757d'), 0, .62, 0);
      pz(g, caja(.15, .35, .45, '#adb5bd'), -.24, .68, -.1, 0, .3, .2);
      pz(g, caja(.15, .35, .45, '#adb5bd'), .24, .68, -.1, 0, -.3, -.2);
    } },

    mazPilaHuesos: { n: 'Montón de huesos limpios', e: '🦴', w: 1, d: 1, de: 'botin', art: 'un montoncito de huesos blanquecinos pulidos por el viento', f(g) {
      pz(g, cil(.04, .04, .55, '#f8f9fa', 6), 0, .05, 0, 0, .4, Math.PI / 2);
      pz(g, cil(.04, .04, .48, '#e9ecef', 6), .05, .09, -.02, 0, -.6, Math.PI / 2);
      pz(g, bola(.13, '#f8f9fa'), -.1, .16, .05);
      pz(g, bola(.035, '#111111'), -.06, .17, .16);
      pz(g, bola(.035, '#111111'), -.14, .17, .16);
    } },

    mazEstatuaGuerrero: { n: 'Estatua de caballero mutilado', e: '🛡️', w: 1, d: 1, de: 'botin', art: 'una efigie de guerrero que perdió la espada pero no la postura', f(g) {
      pz(g, caja(.65, .25, .65, '#343a40'), 0, .125, 0);
      pz(g, cil(.15, .2, .8, '#495057', 8), 0, .65, 0);
      pz(g, caja(.45, .4, .18, '#6c757d'), 0, 1.25, 0);
      pz(g, bola(.14, '#ced4da'), 0, 1.62, 0);
      pz(g, caja(.12, .5, .28, '#212529'), -.28, 1.15, .05);
    } },

    mazLosaRunica: { n: 'Losa rúnica brillante', e: '🪨', w: 1, d: 1, de: 'botin', art: 'una losa antigua con grabados que parpadean en la oscuridad', luz: 0.5, f(g) {
      pz(g, caja(.75, .15, .75, '#212529'), 0, .075, 0);
      pz(g, caja(.5, .04, .5, '#00b4d8', brilla('#90e0ef', .9)), 0, .16, 0);
      pz(g, cil(.03, .03, .2, '#48cae4', 6, brilla('#ade8f4', .8)), -.15, .18, -.15);
      pz(g, cil(.03, .03, .2, '#48cae4', 6, brilla('#ade8f4', .8)), .15, .18, .15);
    } },

    mazCofreHierro: { n: 'Cofre acorazado con candado', e: '🧰', w: 1, d: 1, de: 'botin', art: 'un cofre oxidado y cerrado a cal y canto (pesa como un muerto)', f(g) {
      pz(g, caja(.75, .42, .48, '#343a40'), 0, .21, 0);
      pz(g, caja(.78, .1, .5, '#495057'), 0, .45, 0);
      pz(g, caja(.1, .14, .04, ORO), 0, .26, .25);
      pz(g, cil(.04, .04, .08, '#1a1a1a', 6), 0, .32, .25);
    } },

    mazEstandarteDesgarrado: { n: 'Estandarte de la guardia caída', e: '🚩', w: 1, d: 1, de: 'botin', art: 'una bandera de tela vieja comida por las polillas', f(g) {
      pz(g, cil(.2, .24, .08, '#212529', 8), 0, .04, 0);
      pz(g, cil(.03, .03, 1.95, '#495057', 6), 0, 1.02, 0);
      pz(g, cil(.02, .02, .55, '#6c757d', 6), .22, 1.85, 0, 0, 0, Math.PI / 2);
      pz(g, caja(.45, 1.1, .02, '#9a031e'), .22, 1.25, 0);
    } },

    mazPilaCalaveras: { n: 'Túmulo de calaveras', e: '💀', w: 1, d: 1, de: 'botin', art: 'una pirámide pequeña de cráneos que parecen charlar en voz baja', f(g) {
      pz(g, bola(.14, '#f8f9fa'), -.14, .14, -.1);
      pz(g, bola(.14, '#e9ecef'), .14, .14, -.08);
      pz(g, bola(.14, '#dee2e6'), 0, .14, .14);
      pz(g, bola(.14, '#ffffff'), 0, .32, 0);
      pz(g, bola(.03, '#111111'), -.04, .34, .12);
      pz(g, bola(.03, '#111111'), .04, .34, .12);
    } },

    mazAtrilProfano: { n: 'Atril de piedra negra', e: '📖', w: 1, d: 1, de: 'botin', art: 'un soporte de roca volcánica con un tomo ilegible', f(g) {
      pz(g, cil(.24, .3, .1, '#1b1b1e', 8), 0, .05, 0);
      pz(g, cil(.06, .08, .85, '#2b2d42', 6), 0, .52, 0);
      pz(g, caja(.45, .05, .35, '#1b1b1e'), 0, .98, 0, .4, 0, 0);
      pz(g, caja(.36, .06, .26, '#7209b7'), 0, 1.02, 0, .4, 0, 0);
    } },

    mazPuertaCripta: { n: 'Reja de calabozo apuntalada', e: '🚪', w: 2, d: 1, de: 'botin', art: 'una reja de hierro pesado que alguien arrancó de su marco', f(g) {
      pz(g, caja(1.7, .1, .3, '#212529'), 0, .05, 0);
      pz(g, caja(.1, 1.8, .15, '#343a40'), -.75, .95, 0);
      pz(g, caja(.1, 1.8, .15, '#343a40'), .75, .95, 0);
      for (const x of [-.45, -.15, .15, .45]) pz(g, cil(.025, .025, 1.7, '#495057', 6), x, .95, 0);
      pz(g, caja(1.6, .08, .08, '#343a40'), 0, .95, 0);
    } },

    // ==========================================
    // LOTE 10: BOTÍN DE JEFE (jef) - jefe (10 raros)
    // ==========================================
    jefTronoSombras: { n: 'Trono del Señor Umbrío', e: '👑', w: 2, d: 2, de: 'jefe', art: 'un imponente trono forjado en obsidiana (quien se sienta siente frío en la coronilla)', uso: 'sentar', f(g) {
      pz(g, caja(1.7, .25, 1.6, '#101014'), 0, .125, 0);
      pz(g, caja(1.3, .35, 1.2, '#1b1b22'), 0, .42, .05);
      pz(g, caja(1.1, .08, 1.0, '#4a0e17'), 0, .63, .05);
      pz(g, caja(1.3, 1.45, .24, '#101014'), 0, 1.35, -.48);
      pz(g, caja(.24, .55, 1.0, '#2b1b2f'), -.62, .75, .05);
      pz(g, caja(.24, .55, 1.0, '#2b1b2f'), .62, .75, .05);
      pz(g, cil(.08, .02, .45, '#7209b7', 6, brilla('#b5179e', .9)), -.45, 1.95, -.48);
      pz(g, cil(.08, .02, .45, '#7209b7', 6, brilla('#b5179e', .9)), .45, 1.95, -.48);
      pz(g, bola(.14, ORO), 0, 2.05, -.48);
    } },

    jefDragonDorado: { n: 'Efigie del Gran Dragón Áureo', e: '🐉', w: 3, d: 2, de: 'jefe', art: 'una majestuosa escultura de dragón en oro puro (parece listo para escupir una llamarada)', f(g) {
      pz(g, caja(2.6, .3, 1.6, '#2b2d42'), 0, .15, 0);
      pz(g, cil(.45, .6, 1.0, ORO, 10), 0, .75, -.15, -.25, 0, 0);
      pz(g, bola(.35, ORO), 0, 1.4, .25);
      pz(g, cil(.15, .22, .5, ORO, 8), 0, 1.3, .58, Math.PI / 3, 0, 0);
      pz(g, caja(.1, .75, 1.1, ORO), -1.0, 1.2, -.2, 0, .4, .6);
      pz(g, caja(.1, .75, 1.1, ORO), 1.0, 1.2, -.2, 0, -.4, -.6);
      pz(g, bola(.06, '#d90429', brilla('#ff0054', .9)), -.14, 1.48, .5);
      pz(g, bola(.06, '#d90429', brilla('#ff0054', .9)), .14, 1.48, .5);
      pz(g, cil(.05, .02, .4, ORO, 6), 0, .5, -.8, -Math.PI / 4, 0, 0);
    } },

    jefAltarCaos: { n: 'Altar del Ojo Arcano', e: '👁️', w: 2, d: 2, de: 'jefe', art: 'un altar milenario de piedra negra con un ojo cósmico que nunca parpadea', luz: 1.2, f(g) {
      pz(g, cil(.85, .95, .3, '#1a1a24', 12), 0, .15, 0);
      pz(g, cil(.65, .75, .65, '#242435', 10), 0, .6, 0);
      pz(g, cil(.9, .7, .15, '#1a1a24', 12), 0, 1.0, 0);
      pz(g, bola(.24, '#4cc9f0', brilla('#7209b7', .95)), 0, 1.28, 0);
      pz(g, bola(.08, '#03045e'), 0, 1.28, .22);
      for (const [x, z] of [[-.55, -.55], [.55, -.55], [-.55, .55], [.55, .55]]) {
        pz(g, cil(.04, .04, .3, ORO, 6), x, 1.12, z);
      }
    } },

    jefGranRelojArena: { n: 'Clepsidra del Tiempo Infinito', e: '⏳', w: 2, d: 1, de: 'jefe', art: 'un enorme reloj de cristal donde la arena fluye hacia arriba', luz: 1.1, f(g) {
      pz(g, caja(1.6, .18, .75, MAD2), 0, .09, 0);
      pz(g, caja(1.6, .18, .75, MAD2), 0, 1.85, 0);
      pz(g, cil(.04, .04, 1.6, ORO, 8), -.65, .97, -.25);
      pz(g, cil(.04, .04, 1.6, ORO, 8), .65, .97, -.25);
      pz(g, cil(.04, .04, 1.6, ORO, 8), -.65, .97, .25);
      pz(g, cil(.04, .04, 1.6, ORO, 8), .65, .97, .25);
      pz(g, cil(.08, .4, .65, '#caf0f8', 10, { transparent: true, opacity: .4 }), 0, .6, 0);
      pz(g, cil(.4, .08, .65, '#caf0f8', 10, { transparent: true, opacity: .4 }), 0, 1.34, 0);
      pz(g, bola(.22, '#ffd166', brilla('#ffb703', .9)), 0, 1.28, 0);
    } },

    jefArmaduraTitan: { n: 'Armadura colosal del Coloso', e: '🛡️', w: 2, d: 1, de: 'jefe', art: 'el arnés de combate de un gigante (pesa tanto que comba el piso)', f(g) {
      pz(g, caja(1.5, .2, .75, '#2b2d42'), 0, .1, 0);
      pz(g, cil(.15, .18, .75, '#4a4e69', 8), -.32, .55, 0);
      pz(g, cil(.15, .18, .75, '#4a4e69', 8), .32, .55, 0);
      pz(g, caja(.85, .75, .45, '#8d99ae'), 0, 1.28, 0);
      pz(g, bola(.2, '#edf2f4'), 0, 1.82, 0);
      pz(g, caja(.3, .4, .3, ORO), -.55, 1.45, 0);
      pz(g, caja(.3, .4, .3, ORO), .55, 1.45, 0);
      pz(g, cil(.03, .03, 1.7, '#1b1b1e', 6), .8, .9, 0);
    } },

    jefCofreCthulhu: { n: 'Arcón de las Profundidades', e: '🐙', w: 2, d: 1, de: 'jefe', art: 'un baúl forrado de escamas marinas (unos tentáculos asoman por la rendija)', luz: 0.7, f(g) {
      pz(g, caja(1.6, .55, .75, '#134e4a'), 0, .275, 0);
      pz(g, caja(1.65, .25, .8, '#042f2e'), 0, .62, 0);
      pz(g, caja(.18, .22, .06, ORO), 0, .45, .4);
      pz(g, cil(.08, .04, .45, '#2dd4bf', 8, brilla('#14b8a6', .85)), -.35, .62, .3, .6, 0, -.3);
      pz(g, cil(.08, .04, .48, '#2dd4bf', 8, brilla('#14b8a6', .85)), .3, .64, .32, .5, 0, .4);
      pz(g, bola(.08, '#a7f3d0'), 0, .76, 0);
    } },

    jefMonolitoVacio: { n: 'Obelisco del Vacío', e: '💎', w: 1, d: 1, de: 'jefe', art: 'un fragmento de cometa alienígena que levita a pocos palmos del pedestal', luz: 1.3, f(g) {
      pz(g, caja(.8, .3, .8, '#1e1b4b'), 0, .15, 0);
      pz(g, caja(.6, .25, .6, '#312e81'), 0, .4, 0);
      pz(g, cil(.25, .05, 1.1, '#818cf8', 6, brilla('#c7d2fe', .95)), 0, 1.35, 0);
      pz(g, cil(.05, .25, .35, '#818cf8', 6, brilla('#c7d2fe', .95)), 0, .75, 0);
      for (const [x, z] of [[-.3, 0], [.3, 0], [0, -.3], [0, .3]]) {
        pz(g, bola(.06, ORO), x, .55, z);
      }
    } },

    jefFenixRescoldos: { n: 'Pira del Fénix Inmortal', e: '🪶', w: 2, d: 2, de: 'jefe', art: 'un nido de cenizas sagradas de donde brotan plumas incandescentes', luz: 0.95, f(g) {
      pz(g, cil(.9, 1.0, .25, '#431407', 12), 0, .125, 0);
      pz(g, cil(.7, .85, .35, '#7c2d12', 10), 0, .4, 0);
      pz(g, bola(.35, '#ea580c', brilla('#ffedd5', .95)), 0, .7, 0);
      pz(g, cil(.06, .02, .75, '#facc15', 6, brilla('#fef08a', .9)), -.25, .95, -.15, -.4, 0, .3);
      pz(g, cil(.06, .02, .75, '#facc15', 6, brilla('#fef08a', .9)), .25, .95, -.15, -.4, 0, -.3);
      pz(g, cil(.06, .02, .8, '#facc15', 6, brilla('#fef08a', .9)), 0, 1.0, .25, .4, 0, 0);
    } },

    jefEspejoAnimas: { n: 'Espejo de las Mil Almas', e: '🪞', w: 2, d: 1, de: 'jefe', art: 'un espejo con marco de oro corrupto que refleja caras que no son la tuya', luz: 1.25, f(g) {
      pz(g, caja(1.5, .15, .55, '#0f172a'), 0, .075, 0);
      pz(g, caja(1.3, 1.8, .12, ORO), 0, 1.05, 0);
      pz(g, caja(1.0, 1.5, .04, '#38bdf8', brilla('#bae6fd', .85)), 0, 1.05, .05);
      pz(g, bola(.14, '#dc2626'), 0, 2.05, 0);
      pz(g, cil(.06, .02, .3, ORO, 6), -.6, 1.95, 0);
      pz(g, cil(.06, .02, .3, ORO, 6), .6, 1.95, 0);
    } },

    jefCalderoPesadillas: { n: 'Caldero del Gran Inquisidor', e: '🧪', w: 2, d: 2, de: 'jefe', art: 'un inmenso caldero de hierro de bruja donde hierve una pócima verde fosforita', luz: 0.85, f(g) {
      pz(g, cil(.8, .55, .9, '#18181b', 12), 0, .55, 0);
      pz(g, cil(.75, .75, .05, '#22c55e', 12, brilla('#86efac', .95)), 0, .95, 0);
      for (const [x, z] of [[-.55, -.55], [.55, -.55], [-.55, .55], [.55, .55]]) {
        pz(g, cil(.08, .05, .35, '#09090b', 6), x, .18, z);
      }
      pz(g, cil(.05, .05, 1.3, MAD, 6), .15, 1.0, 0, .25, 0, .35);
      pz(g, bola(.12, '#4ade80', brilla('#86efac', .9)), -.2, 1.02, .2);
    } }
  };
}
