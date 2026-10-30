#!/usr/bin/env python3
"""Pone una versión nueva a los archivos del juego para que los móviles
no usen copias viejas guardadas en caché. Ejecutar antes de cada subida:
    python3 criptas/version.py
"""
import os, re, time
os.chdir(os.path.dirname(os.path.abspath(__file__)))
v = time.strftime('%Y%m%d%H%M%S')
modulos = sorted(f for f in os.listdir('js') if f.endswith('.js'))
mapa = ',\n'.join(f'    "./js/{m}": "./js/{m}?v={v}"' for m in modulos)
bloque = f'<script type="importmap" id="versiones">\n{{\n  "imports": {{\n{mapa}\n  }}\n}}\n</script>'
html = open('index.html').read()
html = re.sub(r'<script type="importmap" id="versiones">.*?</script>', bloque, html, flags=re.S)
if 'id="versiones"' not in html:
    html = html.replace('<link rel="stylesheet" href="estilo.css', bloque + '\n<link rel="stylesheet" href="estilo.css', 1)
html = re.sub(r'href="estilo\.css(\?v=\d+)?"', f'href="estilo.css?v={v}"', html)
html = re.sub(r'src="js/ui\.js(\?v=\d+)?"', f'src="js/ui.js?v={v}"', html)
html = re.sub(r'<meta name="version" content="\d*">', '', html)
html = html.replace('<meta charset="utf-8">', f'<meta charset="utf-8">\n<meta name="version" content="{v}">', 1)
open('index.html', 'w').write(html)

# Las demás páginas que usan los módulos del juego (tortuga, cabaña, sala ligera, planos):
# el mismo mapa con versión, conservando lo que ya tuvieran (three).
for pagina in ['tortuga.html', 'cabana.html', 'reunion.html', 'planos.html', 'duelo.html', 'panel.html', 'pueblo.html', 'pruebas.html', 'taller.html']:
    if not os.path.exists(pagina): continue
    h = open(pagina).read()
    extra = '    "three": "./js/vendor/three.module.min.js",\n' if 'three' in h.split('<script type="module">')[0] else ''
    bloque2 = f'<script type="importmap" id="versiones">\n{{\n  "imports": {{\n{extra}{mapa}\n  }}\n}}\n</script>'
    h = re.sub(r'<script type="importmap"[^>]*>.*?</script>', bloque2, h, count=1, flags=re.S)
    if 'id="versiones"' not in h:
        h = h.replace('</head>', bloque2 + '\n</head>', 1)
    h = re.sub(r'src="js/panel\.js(\?v=\d+)?"', f'src="js/panel.js?v={v}"', h)
    open(pagina, 'w').write(h)
print('versión', v)
