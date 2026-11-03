#!/usr/bin/env python3
"""Convierte un archivo MIDI en un «disco» JSON para la gramola de Rufo.

Uso (desde cualquier carpeta; necesita `pip install mido`):
    python3 criptas/midi/convertir.py cancion.mid                      # disco local (no se sube al repo)
    python3 criptas/midi/convertir.py cancion.mid --publico            # va al catálogo público
    python3 criptas/midi/convertir.py cancion.mid --id sirena --nombre "La sirena" --autor "Tradicional"

Por defecto el disco es LOCAL: se escribe como local-<id>.json y se apunta en catalogo-local.json,
dos archivos que .gitignore deja fuera del repo. Con --publico se escribe <id>.json y se apunta en
catalogo.json: eso se sube a la web, que es pública. Solo para música libre de derechos o tuya.
"""
import argparse, json, os, re, sys
import mido

AQUI = os.path.dirname(os.path.abspath(__file__))


def notas_del_midi(ruta):
    """[[inicio, duración, tono, fuerza, canal, instrumento], ...] en segundos, respetando los cambios de tempo."""
    t, abiertas, prog, notas = 0.0, {}, {}, []
    for m in mido.MidiFile(ruta):          # iterar un MidiFile da el tiempo ya en segundos
        t += m.time
        if m.type == 'program_change':
            prog[m.channel] = m.program
        elif m.type == 'note_on' and m.velocity > 0:
            abiertas.setdefault((m.channel, m.note), []).append((t, m.velocity, prog.get(m.channel, 0)))
        elif m.type in ('note_off', 'note_on'):
            pila = abiertas.get((m.channel, m.note))
            if pila:
                ini, vel, pr = pila.pop(0)
                notas.append([round(ini, 3), round(max(t - ini, .02), 3), m.note, vel, m.channel, pr])
    notas.sort(key=lambda n: n[0])
    return notas, t


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('midi'); ap.add_argument('--id'); ap.add_argument('--nombre'); ap.add_argument('--autor', default='')
    ap.add_argument('--modo', choices=['banda', 'piano'], default='banda'); ap.add_argument('--publico', action='store_true')
    a = ap.parse_args()
    base = os.path.splitext(os.path.basename(a.midi))[0]
    id_ = a.id or re.sub(r'[^a-z0-9]+', '-', base.lower()).strip('-') or 'disco'
    nombre = a.nombre or base.replace('_', ' ').replace('-', ' ').strip().capitalize()
    notas, largo = notas_del_midi(a.midi)
    if not notas: sys.exit('El MIDI no tiene notas.')
    archivo = f'{id_}.json' if a.publico else f'local-{id_}.json'
    with open(os.path.join(AQUI, archivo), 'w') as f:
        json.dump({'nombre': nombre, 'largo': round(largo, 1), 'notas': notas}, f, separators=(',', ':'))
    cat = os.path.join(AQUI, 'catalogo.json' if a.publico else 'catalogo-local.json')
    datos = json.load(open(cat)) if os.path.exists(cat) else {'discos': []}
    entrada = {'id': id_, 'nombre': nombre, 'autor': a.autor or ('' if a.publico else 'Disco local'), 'archivo': archivo}
    if a.modo != 'banda': entrada['modo'] = a.modo
    datos['discos'] = [d for d in datos['discos'] if d.get('id') != id_] + [entrada]
    json.dump(datos, open(cat, 'w'), ensure_ascii=False, indent=2); open(cat, 'a').write('\n')
    print(f'{archivo}: {len(notas)} notas, {largo:.1f} s → {os.path.basename(cat)}' + ('  (PÚBLICO: se subirá al repo)' if a.publico else '  (local)'))


if __name__ == '__main__':
    main()
