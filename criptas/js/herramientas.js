// =============================================================
//  HERRAMIENTAS DE ADMINISTRADOR: la lista de enlaces del «backoffice».
//  La usan el menú principal (index.html, solo si eres admin) y la pestaña
//  Atajos del estudio. Para añadir una herramienta nueva, una línea aquí.
// =============================================================
export const HERRAMIENTAS = [
  { grupo: 'Gestión', items: [
    { ico: '🔬', t: 'Estudio', d: 'Visor de muebles y vecinos, textos y salud del juego', href: 'estudio.html' },
    { ico: '📚', t: 'Taller de campañas', d: 'Importar y revisar campañas en JSON', href: 'taller.html' },
    { ico: '📊', t: 'Panel', d: 'Actividad, jugadores, errores, anuncio y accesos', href: 'panel.html' },
    { ico: '🧪', t: 'Pruebas', d: 'Índice con todas las páginas', href: 'pruebas.html' }
  ] },
  { grupo: 'El pueblo', items: [
    { ico: '🏡', t: 'Pueblo', d: 'Tal cual lo ve el jugador', href: 'pueblo.html' },
    { ico: '☀️', t: 'Pueblo de mañana', d: 'Con la hora fijada a las 9:00', href: 'pueblo.html?hora=9' },
    { ico: '🌙', t: 'Pueblo de noche', d: 'Con la hora fijada a las 22:00', href: 'pueblo.html?hora=22' },
    { ico: '⏩', t: 'Día rápido', d: 'El reloj va 20 veces más deprisa', href: 'pueblo.html?rapido=20' }
  ] },
  { grupo: 'Creación', items: [
    { ico: '🗺', t: 'Editor de planos', d: 'Dibujar mapas de mazmorra a mano', href: 'planos.html' },
    { ico: '⚔️', t: 'Duelo de insultos', d: 'El prototipo del duelo pirata', href: 'duelo.html' },
    { ico: '🐢', t: 'Tortuga', d: 'Morrandar vista desde fuera', href: 'tortuga.html?elegir' },
    { ico: '🏆', t: 'Cabaña', d: 'Trofeos y baúl de héroes', href: 'cabana.html' }
  ] }
];
