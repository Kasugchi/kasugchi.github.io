// Piezas compartidas por todas las aventuras.
// Vinculación curricular en BORRADOR: competencias clave LOMLOE seguras;
// competencia específica y criterio, a verificar con la normativa andaluza.
export const LENGUA = 'Lengua Castellana y Literatura', MATES = 'Matemáticas', VALORES = 'Lengua y valores (tutoría)';
export const cur = (area, clave, que) => ({ area, clave, que, especifica: 'pendiente de verificar', criterio: 'pendiente de verificar' });
export const VOTO = cur(VALORES, ['CPSAA', 'CC'], 'Participar en decisiones colectivas');
export const DEBATE = cur(VALORES, ['CC', 'CCL'], 'Argumentar y respetar otras opiniones');
export const CONVIVE = cur(VALORES, ['CC', 'CPSAA'], 'Respeto y convivencia');
export const LOCALIZA = cur(LENGUA, ['CCL'], 'Localizar información explícita');
export const ORDENA = cur(LENGUA, ['CCL'], 'Ordenar la secuencia de un relato');
export const INFIERE = cur(LENGUA, ['CCL'], 'Inferir a partir del texto');
export const EN_VOZ = cur(LENGUA, ['CCL'], 'Lectura expresiva en voz alta');
export const votar = (texto, ops, tercera) => ({ tipo: 'votacion', texto, ops, tercera, mejora: true, cur: VOTO });
