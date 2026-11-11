# =============================================================
#  SIMULADOR DE CRIPTAS (equilibrio de razas y clases)
#  Juega miles de criptas enteras sobre tablero con las mismas reglas que
#  js/claro-combate.js y dice qué combinación raza + clase sale viva más a menudo.
#
#    python3 criptas/herramientas/simulacion.py        # ranking a nivel 3
#    python3 criptas/herramientas/simulacion.py 1      # a nivel 1
#    python3 criptas/herramientas/simulacion.py zonas  # cada clase a nivel 3, 5 y 8 contra cada zona y en heroica
#
#  OJO: los números de héroes y monstruos están copiados a mano de
#  js/claro-heroes.js (CLASES, RAZAS, LOAS) y js/datos.js (MONSTRUOS).
#  Si cambias allí algo de combate, cámbialo también aquí y vuelve a pasarlo.
#  Objetivo actual: que todas las combinaciones salgan vivas entre un 75 % y un 95 %
#  de las veces a nivel 3.
# =============================================================
# (dados: calavera 1/2, escudo blanco 1/3 para el héroe y torretas, escudo negro 1/6 para monstruos;
#  héroe: mueve 2d6 (+2 elfo) y una acción; torretas alcance 6; monstruos van al más cercano y pegan si están al lado)
import random, sys
R = random.random
d6 = lambda: random.randint(1, 6)
def tira(n, p): return sum(R() < p for _ in range(max(0, n)))
SK, BL, BN = .5, 1/3, 1/6
W, H = 9, 7                                       # una sala de cripta típica
CL = {'barbaro': (3, 2, 9, 2, 'brutal'), 'mago': (2, 2, 8, 3, 'fuego'), 'ingeniero': (2, 3, 8, 1, 'torreta'), 'explorador': (2, 2, 8, 4, 'flecha')}
MON = {'esq': (2, 2, 1, 6), 'zom': (2, 3, 1, 5), 'bru': (2, 2, 3, 6), 'sac': (2, 3, 3, 5), 'mom': (3, 4, 2, 4), 'jefe': (4, 4, 5, 4)}
CRIPTA = [['zom'], ['esq', 'zom'], ['bru'], ['esq', 'zom'], ['sac'], ['mom', 'esq'], ['zom', 'esq'], ['jefe', 'sac']]

class U:
    def __init__(s, bando, x, y, atk, dfn, hp, mov=0, nombre=''):
        s.bando, s.x, s.y, s.atk, s.dfn, s.hp, s.mov, s.nombre = bando, x, y, atk, dfn, hp, mov, nombre
        s.sangra = 0
    vivo = property(lambda s: s.hp > 0)
dist = lambda a, b: abs(a.x - b.x) + abs(a.y - b.y)
pegados = lambda a, b: dist(a, b) == 1

# js/dificultad.js: los bichos, reforzados según el escalón (la zona, o el nivel del héroe en heroica)
import os
FA, FD, FH, FJ, FZ = (float(os.environ.get(k, v)) for k, v in (('FA', .9), ('FD', .4), ('FH', 1.4), ('FJ', 2.6), ('FZ', 1.7)))
def reforzar(a, d, hp, t, jefe=False):
    if not t: return a, d, hp
    return min(8, a + round(t * FA)), min(6, d + round(t * FD)), hp + round(t * (FJ if jefe else FH))
def escalon(fuerza, heroica=False, nivel=1):
    z = max(0, fuerza - 1) * FZ
    return max(z + 1, (nivel - 1) / 2.2 + .6) if heroica else z
# Un héroe «normal» de nivel L: mejoras repartidas entre ataque y defensa, y lo que va dando la forja
def montar(L):
    atk = min(3, (L - 1 + 1) // 2); dfn = min(3, (L - 1) // 2); forja_a = 0 if L < 4 else 1 if L < 7 else 2; forja_d = 0 if L < 5 else 1
    return {'atk+': atk + forja_a, 'def+': dfn + forja_d}

def pelea(heroe, grupo, cfg, est):
    """est: dict persistente de la cripta (hp, poc, rezos). Devuelve False si el héroe cae."""
    raza, clase = cfg['raza'], cfg['clase']
    atk, dfn, _, usos0, hab = CL[clase]
    atk += cfg.get('atk+', 0); dfn += cfg.get('def+', 0) + (cfg.get('elfo_def', 0) if raza == 'elfo' else 0)
    h = U('h', W // 2, H - 1, atk, dfn, est['hp'])
    ene = []
    for k, t in enumerate(grupo):
        a, d, hp, mv = MON[t]
        a, d, hp = reforzar(a, d, hp, cfg.get('t', 0), t == 'jefe')
        ene.append(U('e', min(W - 1, max(0, W // 2 + (k * 2 - (len(grupo) - 1)))), random.randint(0, 1), a, d, hp, mv, t))
    tur = []
    usos = usos0 + (1 if raza == 'humano' else 0) + cfg.get('usos+', 0)
    racial, rezo, piedra, escamas = True, 0, 0, raza == 'escamado'
    rezado = False
    ocupado = lambda x, y, yo=None: any(u.vivo and u is not yo and u.x == x and u.y == y for u in [h] + ene + tur)
    def libres_alrededor(u):
        return [(u.x + dx, u.y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= u.x + dx < W and 0 <= u.y + dy < H and not ocupado(u.x + dx, u.y + dy)]
    def mover_hacia(u, obj, pasos, lejos=False):
        for _ in range(pasos):
            op = libres_alrededor(u)
            if not op: return
            if lejos: mejor = max(op, key=lambda c: min((abs(c[0] - e.x) + abs(c[1] - e.y)) for e in ene if e.vivo))
            else: mejor = min(op, key=lambda c: abs(c[0] - obj.x) + abs(c[1] - obj.y))
            if (not lejos and abs(mejor[0] - obj.x) + abs(mejor[1] - obj.y) >= dist(u, obj)) : return
            if lejos and min(abs(mejor[0]-e.x)+abs(mejor[1]-e.y) for e in ene if e.vivo) <= min(dist(u,e) for e in ene if e.vivo): return
            u.x, u.y = mejor
            if not lejos and pegados(u, obj): return
    def golpe(a, d, n):
        nonlocal escamas
        if a is h and rezo > 0: n += {'tigre': cfg.get('tigre', 2), 'raptor': 1}.get(cfg.get('loa', 'tigre'), 0)
        dd = d.dfn + (1 if d is h and rezo > 0 and cfg.get('loa') == 'rana' else 0)
        dmg = max(0, tira(n, SK) - tira(dd, BL if d.bando != 'e' else BN))
        if d is h:
            if dmg and escamas: dmg -= 1; escamas = False
            if piedra > 0: dmg = min(dmg, 1)
        d.hp -= dmg
        if a is h and dmg and rezo > 0:
            if cfg.get('loa', 'tigre') == 'tigre' and d.vivo: d.sangra = 1
            if cfg.get('loa') == 'muerte': h.hp = min(est['max'], h.hp + 1)
        return dmg
    vivos = lambda: [e for e in ene if e.vivo]
    for ronda in range(60):
        if rezo > 0: rezo -= 1
        if piedra > 0: piedra -= 1
        for e in vivos():
            if e.sangra: e.sangra = 0; e.hp -= 1
        if not vivos(): break
        # ---- turno del héroe ----
        acciones = 1
        adyacentes = [e for e in vivos() if pegados(h, e)]
        if racial and raza == 'humano' and (adyacentes or (CL[clase][4] in ('fuego', 'flecha') and usos)): acciones = 2; racial = False
        if racial and raza == 'enano' and (len(adyacentes) >= 2 or any(e.nombre == 'jefe' for e in adyacentes)): piedra = 1; racial = False
        if raza == 'troll' and est['rezos'] > 0 and rezo == 0 and not (cfg.get('por_pelea') and rezado) and (cfg.get('rezo_siempre') or len(vivos()) >= 2 or any(e.hp >= 3 for e in vivos())):
            est['rezos'] -= 1; rezo = cfg.get('dur', 2); rezado = True
            if cfg.get('loa') == 'rana': h.hp = min(est['max'], h.hp + 3)
        if cfg.get('aliento_cripta') and raza == 'escamado' and est.get('aliento_usado'): racial = False
        if racial and raza == 'escamado' and (len(adyacentes) >= 2 or (adyacentes and len(vivos()) == 1)):
            for e in adyacentes:
                if cfg.get('aliento') == 'defensa' and tira(e.dfn, BN): continue   # lo para con un escudo negro
                e.hp -= 1
            racial = False; est['aliento_usado'] = True
        a_distancia = hab in ('fuego', 'flecha')
        movido = False
        objetivo = min(vivos(), key=lambda e: (dist(h, e), e.hp)) if vivos() else None
        # el elfo se escabulle si le rodean (y el que dispara, si le pegan)
        if racial and raza == 'elfo' and (len(adyacentes) >= 2 or (a_distancia and adyacentes and usos)):
            mover_hacia(h, objetivo, 4, lejos=True); racial = False
        for _ in range(acciones):
            if not vivos(): break
            objetivo = min(vivos(), key=lambda e: (dist(h, e), e.hp))
            if h.hp <= 3 and est['poc']: est['poc'] -= 1; h.hp = min(est['max'], h.hp + 3); continue
            if hab == 'torreta' and usos and not any(t.vivo for t in tur):
                c = libres_alrededor(h)
                if c: usos -= 1; pl = (cfg.get('L', 1) - 1) // 3; tur.append(U('t', c[0][0], c[0][1], 2 + pl, 1, 2 + pl)); continue
            if hab == 'fuego' and usos:
                t = max(vivos(), key=lambda e: (e.dfn, e.hp)); usos -= 1; t.hp -= max(0, 2 + (cfg.get('L', 1) - 1) // 3 - tira(2, SK)); continue
            if hab == 'flecha' and usos and min(dist(h, e) for e in vivos()) <= 5:
                t = min([e for e in vivos() if dist(h, e) <= 5], key=lambda e: e.hp); usos -= 1; golpe(h, t, h.atk + cfg.get('flecha+', 0)); continue
            # cuerpo a cuerpo: acercarse si hace falta
            if not pegados(h, objetivo) and not movido:
                movido = True; mover_hacia(h, objetivo, d6() + d6() + (2 if raza == 'elfo' else 0) + (3 if rezo > 0 and cfg.get('loa') == 'raptor' else 0))
            if pegados(h, objetivo):
                if hab == 'brutal' and usos: usos -= 1; golpe(h, objetivo, h.atk + 2)
                else: golpe(h, objetivo, h.atk)
        # el que dispara, si ya ha disparado y no se ha movido, se aleja
        if a_distancia and not movido and vivos() and usos: mover_hacia(h, objetivo, d6() + d6() + (2 if raza == 'elfo' else 0), lejos=True)
        if not vivos(): break
        # ---- torretas ----
        for t in [t for t in tur if t.vivo]:
            al = [e for e in vivos() if dist(t, e) <= 6]
            if al: golpe(t, min(al, key=lambda e: dist(t, e)), t.atk)
        # ---- monstruos ----
        for e in vivos():
            blancos = [u for u in [h] + tur if u.vivo]
            b = min(blancos, key=lambda u: dist(e, u))
            if not pegados(e, b): mover_hacia(e, b, e.mov)
            pegado = next((u for u in [h] + tur if u.vivo and pegados(e, u)), None)
            if pegado: golpe(e, pegado, e.atk)
            if h.hp <= 0: return False
    est['hp'] = h.hp
    return True

def cripta(cfg, nivel=3):
    raza, clase = cfg['raza'], cfg['clase']
    mx = CL[clase][2] + cfg.get('base+', {}).get(clase, 0) + (nivel - 1) + (2 if raza == 'enano' else 0) + cfg.get('cuerpo+', 0)
    est = {'hp': mx, 'max': mx, 'poc': 1, 'rezos': cfg.get('rezos', 2) if raza == 'troll' else 0}
    for g in CRIPTA:
        if not pelea(None, g, cfg, est): return False, 0
        est['hp'] = min(mx, est['hp'] + 1 + (1 if raza == 'troll' else 0))
    return True, est['hp']

def medir(cfg, N=3000, nivel=3):
    v = s = 0
    for _ in range(N):
        ok, hp = cripta(cfg, nivel)
        if ok: v += 1; s += hp
    return v / N, s / max(1, v)

if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == 'zonas':
    # python3 simulacion.py zonas: cada clase a nivel 3, 5 y 8 contra cada zona, en normal y en heroica
    print('                  nivel   zona1   zona2   zona3   heroica   (victorias, vida que queda)')
    for r, c in [('humano', 'barbaro'), ('humano', 'mago'), ('humano', 'ingeniero'), ('humano', 'explorador'), ('troll', 'barbaro')]:
        for L in (3, 5, 8):
            base = {'raza': r, 'clase': c, 'aliento': 'defensa', 'flecha+': 2, 'elfo_def': 1, 'rezos': 99, 'por_pelea': 1, 'rezo_siempre': 1, 'loa': 'tigre', 'L': L, **montar(L)}
            fila = []
            for t in (escalon(1), escalon(2), escalon(3), escalon(2, True, L)):
                w, hp = medir({**base, 't': t}, 800, L); fila.append(f'{w*100:4.0f}% {hp:4.1f}')
            print(f'{r[:5]} {c:11} {L:3}   ' + '  '.join(fila))
    sys.exit()
if __name__ == '__main__':
    nivel = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    res = []
    for r in ['humano', 'enano', 'elfo', 'escamado', 'troll']:
        for c in CL:
            cfg = {'raza': r, 'clase': c, 'aliento': 'defensa', 'flecha+': 2, 'elfo_def': 1, 'rezos': 99, 'por_pelea': 1, 'rezo_siempre': 1}
            if r == 'troll':   # el trol elige su mejor loa para esa clase
                mejor = max((medir({**cfg, 'loa': l}, 1500, nivel) + (l,) for l in ('tigre', 'rana', 'muerte', 'raptor')))
                res.append((mejor[0], mejor[1], r, c + ' (' + mejor[2] + ')'))
            else:
                w, hp = medir(cfg, 3000, nivel); res.append((w, hp, r, c))
    res.sort(reverse=True)
    for w, hp, r, c in res: print(f'{r:9} {c:22} {w*100:5.1f}%  vida {hp:4.1f}')
