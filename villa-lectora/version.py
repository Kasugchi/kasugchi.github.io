#!/usr/bin/env python3
"""Pone versión nueva a los módulos de Villa Lectora (para que los navegadores no usen copias viejas).
Ejecutar antes de cada subida:  python3 villa-lectora/version.py"""
import os, re, time
os.chdir(os.path.dirname(os.path.abspath(__file__)))
v = time.strftime('%Y%m%d%H%M%S')
mods = sorted(os.path.relpath(os.path.join(r, f), 'js') for r, _, fs in os.walk('js') for f in fs if f.endswith('.js') and 'vendor' not in r)
mapa = ',\n'.join(f'    "./js/{m}": "./js/{m}?v={v}"' for m in mods)
h = open('index.html').read()
h = re.sub(r'<script type="importmap" id="versiones">.*?</script>', f'<script type="importmap" id="versiones">\n{{\n  "imports": {{\n{mapa}\n  }}\n}}\n</script>', h, flags=re.S)
h = re.sub(r'href="css/style\.css(\?v=\d+)?"', f'href="css/style.css?v={v}"', h)
open('index.html', 'w').write(h); print('versión', v)
