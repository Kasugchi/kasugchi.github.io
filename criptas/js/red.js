// =============================================================
//  RED: salas con código usando PeerJS (WebRTC, sin servidor propio)
//  El anfitrión abre un "peer" con un id derivado del código.
//  Los invitados se conectan a ese id. Todo pasa por el anfitrión.
// =============================================================
const PREFIJO = 'criptas-velmor-kasugchi-';
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let cargando = null;

function cargarPeerJS() {
  if (window.Peer) return Promise.resolve();
  if (cargando) return cargando;
  cargando = new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
    s.onload = ok;
    s.onerror = () => { cargando = null; mal(new Error('No se pudo cargar la librería de red. Revisa tu conexión.')); };
    document.head.appendChild(s);
  });
  return cargando;
}

export const nuevoCodigo = () => Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');

// ---------- Anfitrión ----------
// eventos: alConectar(conn, datos), alMensaje(idJugador, msg), alSalir(idJugador)
export async function crearSala(eventos, codigo = nuevoCodigo()) {
  await cargarPeerJS();
  return new Promise((ok, mal) => {
    const peer = new window.Peer(PREFIJO + codigo);
    const conexiones = new Map(); // idJugador -> conn
    const sala = {
      codigo,
      enviar(id, msg) { const c = conexiones.get(id); if (c?.open) c.send(msg); },
      difundir(msg) { for (const c of conexiones.values()) if (c.open) c.send(msg); },
      cerrar() { peer.destroy(); }
    };
    peer.on('open', () => ok(sala));
    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') { peer.destroy(); crearSala(eventos).then(ok, mal); }
      else if (!sala.abierta) mal(new Error('No se pudo crear la sala (' + err.type + ').'));
      else eventos.alError?.(err);
    });
    peer.on('open', () => { sala.abierta = true; });
    peer.on('disconnected', () => { try { peer.reconnect(); } catch { /* sin conexión */ } });
    peer.on('connection', (conn) => {
      let id = null;
      conn.on('data', (msg) => {
        if (msg?.t === 'hola') {
          id = String(msg.id).slice(0, 40);
          const previa = conexiones.get(id);
          if (previa && previa !== conn) previa.close();
          conexiones.set(id, conn);
          eventos.alConectar(id, String(msg.nombre || 'Aventurero').slice(0, 24));
          return;
        }
        if (id) eventos.alMensaje(id, msg);
      });
      conn.on('close', () => { if (id && conexiones.get(id) === conn) { conexiones.delete(id); eventos.alSalir(id); } });
    });
  });
}

// ---------- Invitado ----------
export async function unirseSala(codigo, idJugador, nombre, eventos) {
  await cargarPeerJS();
  return new Promise((ok, mal) => {
    const peer = new window.Peer();
    let conectado = false;
    const tiempo = setTimeout(() => { if (!conectado) { peer.destroy(); mal(new Error('No hay ninguna sala con el código ' + codigo + '.')); } }, 12000);
    peer.on('open', () => {
      const conn = peer.connect(PREFIJO + codigo.toUpperCase(), { reliable: true });
      conn.on('open', () => {
        conectado = true; clearTimeout(tiempo);
        conn.send({ t: 'hola', id: idJugador, nombre });
        ok({ enviar: (msg) => conn.open && conn.send(msg), cerrar: () => peer.destroy() });
      });
      conn.on('data', (msg) => eventos.alMensaje(msg));
      conn.on('close', () => eventos.alCerrar());
    });
    peer.on('error', (err) => {
      if (!conectado) { clearTimeout(tiempo); peer.destroy(); mal(new Error(err.type === 'peer-unavailable' ? 'No hay ninguna sala con el código ' + codigo + '.' : 'Error de conexión (' + err.type + ').')); }
    });
  });
}
