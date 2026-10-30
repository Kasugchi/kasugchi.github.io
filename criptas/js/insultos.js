// =============================================================
//  INSULTOS: lo que comparten el duelo de la taberna (duelo.html)
//  y el duelo con Rufo dentro del bocadillo del pueblo.
//  Cada réplica sirve para un insulto de taberna (t) y uno de la
//  Maestra (m). El cuaderno con lo aprendido se guarda en este
//  dispositivo (localStorage 'criptas_duelo').
// =============================================================
const CLAVE = 'criptas_duelo';
const leer = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

// ---------- Insultos: cada réplica sirve para un insulto de taberna y uno de la Maestra ----------
export const PARES = [
  { id: 'agujeros', t: '¡Te voy a dejar más agujeros que a un queso de bodega!', m: 'Mi acero te zurcirá a estocadas como a una vela vieja.', r: 'Primero tendrías que acertarme una vez.' },
  { id: 'compania', t: '¡Nadie en este puerto quiere navegar contigo!', m: 'Acabarás en el fondo del mar, con los cangrejos.', r: 'Qué bien: así por fin tendré compañía decente.' },
  { id: 'lento', t: '¡Eres más lento que un percebe con resaca!', m: 'Mi tortuga de compañía esquiva mejor que tú.', r: 'Y aun así sigues sin tocarme.' },
  { id: 'pulpo', t: '¡Peleas como un pulpo con calambres!', m: 'Te mueves como un mono que ha probado el grog.', r: 'Será que te estoy imitando.' },
  { id: 'olor', t: '¡Hueles peor que la bodega de un ballenero!', m: 'Apestas a sardina de la semana pasada.', r: 'Normal: acabo de salir de tu camarote.' },
  { id: 'loro', t: '¡Mi loro tiene más cerebro que tú!', m: 'He conocido mascarones de proa más listos que tú.', r: 'Al menos él sabe lo que dice.' },
  { id: 'felpudo', t: '¡Cuando acabe contigo, te usaré de felpudo!', m: 'Fregaré la cubierta con tu sombrero.', r: 'Por fin habría algo limpio en tu barco.' },
  { id: 'hundir', t: '¡He hundido barcos más grandes que tu ego!', m: 'He mandado a pique flotas enteras sin despeinarme.', r: 'Hundir cosas se te da bien: mira tu fama.' },
  { id: 'tiembla', t: '¡Tiemblas como gelatina en pleno temporal!', m: 'Veo el miedo bailando en tus rodillas.', r: 'Es la risa, que no la aguanto al verte.' },
  { id: 'abuela', t: '¡Mi abuela maneja la espada mejor que tú!', m: 'Hasta una anciana te desarmaría con una aguja de punto.', r: 'Lo sé: me la prestó para venir a darte una lección.' },
  { id: 'invicto', t: '¡Nadie me ha ganado un duelo jamás!', m: 'Mis rivales nunca llegan al tercer asalto.', r: 'Porque nadie se quedó despierto hasta el final.' },
  { id: 'chiste', t: '¡Tu esgrima es un chiste malo!', m: 'Tu técnica da más risa que un bufón con hipo.', r: 'Y aun así no lo pillas.' }
];
export const TORPES = ['¡Ah, sí! ¿Pues… tú más?', '¡Mira detrás de ti, una gaviota con sombrero!', 'Eh… ¿me repites la pregunta?', 'Mi madre dice que soy especial.', '¿Y si lo dejamos en empate?'];
export const NO_SABE = ['¿Y-y eso qué quiere decir?', '¡Grrr! ¡Esa no me la sé!', '…Me pillas sin palabras.', '¡Tramposo! ¡Eso no vale!'];

// ---------- Cuaderno (lo aprendido) ----------
export const cuadernoInicial = () => ({ insultos: ['lento', 'chiste'], replicas: ['lento', 'chiste'], vencidos: [] });
// Un único objeto compartido por quien importe el módulo: se modifica en el sitio.
export const cuaderno = (() => { try { return JSON.parse(leer(CLAVE, '')) || null; } catch { return null; } })() || cuadernoInicial();
export const guardarCuaderno = () => guardar(CLAVE, JSON.stringify(cuaderno));
export const par = (id) => PARES.find((p) => p.id === id);
