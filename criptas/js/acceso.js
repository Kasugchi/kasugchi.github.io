// =============================================================
//  CERROJO de las páginas del juego (tortuga, cabaña, sala, duelo).
//  Solo se ven con sesión de Google y la cuenta en la lista de acceso.
//  Si no, vuelta a la portada. Se importa lo primero: como espera
//  (await de nivel superior), la página no arranca hasta saberlo.
//  La página lleva <style id="cerrojo"> para no enseñar nada mientras.
// =============================================================
const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const fuera = () => { location.replace('index.html'); return new Promise(() => {}); };   // la página no sigue

async function comprobar() {
  let m;
  try { m = await import('./nube.js'); }
  catch { return !!leer('criptas_acceso'); }          // sin conexión con Google: vale si este dispositivo ya entró
  const u = await m.usuarioListo().catch(() => null);
  if (!u) return false;
  try { return await m.tieneAcceso(); }
  catch { return leer('criptas_acceso') === u.email; }
}

if (!(await comprobar())) await fuera();
document.getElementById('cerrojo')?.remove();
