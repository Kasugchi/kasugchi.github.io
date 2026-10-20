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
print('versión', v)
