#!/usr/bin/env python3
"""Quita el fondo de un sprite y lo deja listo para el juego.

Sirve para imágenes generadas con IA que traen el "cuadriculado de
transparencia" dibujado (gris y blanco) o un fondo liso. Rellena desde
los bordes todo lo que sea gris claro o blanco y sin color, lo vuelve
transparente, recorta y centra la figura con los pies abajo en un
lienzo cuadrado.

Uso:
    python3 limpiar_fondo.py entrada.png salida.png [tamaño]
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage


def limpiar(entrada, salida, lado=512):
    img = Image.open(entrada).convert('RGBA')
    a = np.asarray(img).astype(np.int16)
    rgb = a[..., :3]
    brillo = rgb.mean(axis=2)
    saturacion = rgb.max(axis=2) - rgb.min(axis=2)
    # Candidato a fondo: claro y sin color (blanco o el gris claro del cuadriculado
    # que dibujan algunas IA) o lo que ya es transparente.
    fondo_posible = ((brillo > 150) & (saturacion < 24)) | (a[..., 3] < 20)
    # Solo cuenta como fondo lo que toca los bordes (así no se borran los blancos de la figura).
    # Conexión en 8 direcciones: los cuadros del damero solo se tocan por las esquinas.
    etiquetas, _ = ndimage.label(fondo_posible, structure=np.ones((3, 3)))
    bordes = set(np.unique(np.concatenate([etiquetas[0], etiquetas[-1], etiquetas[:, 0], etiquetas[:, -1]]))) - {0}
    fondo = np.isin(etiquetas, list(bordes))
    # Huecos encerrados (entre las piernas, detrás de un brazo): si tienen casi
    # exactamente el color del fondo del borde, también son fondo.
    color_borde = np.median(np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]]), axis=0)
    igual = np.abs(rgb - color_borde).max(axis=2) < 10
    et2, n2 = ndimage.label(igual)
    if n2:
        tam = ndimage.sum(np.ones_like(et2), et2, range(n2 + 1))
        fondo |= np.isin(et2, [i for i in range(1, n2 + 1) if tam[i] > 40])
    # Suaviza el borde para que no quede un halo blanco.
    fondo = ndimage.binary_dilation(fondo, iterations=1)
    alfa = np.where(fondo, 0, 255).astype(np.uint8)
    alfa = ndimage.gaussian_filter(alfa.astype(float), 0.6).clip(0, 255).astype(np.uint8)
    salida_rgba = np.dstack([a[..., :3].clip(0, 255).astype(np.uint8), alfa])
    res = Image.fromarray(salida_rgba, 'RGBA')
    caja = res.getbbox()
    if not caja:
        raise SystemExit('No queda nada de la figura: revisa la imagen.')
    res = res.crop(caja)
    # Lienzo cuadrado, figura centrada con los pies abajo y un poco de margen.
    escala = (lado * 0.94) / max(res.width, res.height)
    res = res.resize((max(1, round(res.width * escala)), max(1, round(res.height * escala))), Image.LANCZOS)
    lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    lienzo.paste(res, ((lado - res.width) // 2, lado - res.height - round(lado * 0.02)), res)
    lienzo.save(salida)
    print('Guardado', salida, lienzo.size)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    limpiar(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 512)
