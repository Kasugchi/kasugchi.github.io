// =============================================================
//  RESOLUCIÓN QUE SE ADAPTA
//  Si el dispositivo no llega (más de ~24 ms por fotograma), se baja un poco
//  la nitidez; si va sobrado, se vuelve a subir. Se llama una vez por fotograma
//  con el tiempo real que ha pasado (en segundos).
// =============================================================
export function crearCalidad(render, max = Math.min(devicePixelRatio, 2), alCambiar = null) {
  const C = { max, r: max, media: 16, t: 0, antes: 0 };
  render.setPixelRatio(C.r);
  // real: segundos desde el fotograma anterior (si no se da, lo mide solo)
  C.tick = (real) => {
    if (real == null) { const ahora = performance.now(); real = C.antes ? (ahora - C.antes) / 1000 : 0; C.antes = ahora; }
    if (!(real > 0) || real > 1 || document.hidden) return;   // pausas y cambios de pestaña no cuentan
    C.media += (real * 1000 - C.media) * .05; C.t += real;
    if (C.t < 2.5) return; C.t = 0;
    const antes = C.r;
    if (C.media > 24 && C.r > 1) C.r = Math.max(1, C.r - .2);
    else if (C.media < 13 && C.r < C.max) C.r = Math.min(C.max, C.r + .1);
    if (C.r !== antes) { render.setPixelRatio(C.r); render.setSize(innerWidth, innerHeight); alCambiar?.(C.r); }
  };
  return C;
}
