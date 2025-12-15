#!/usr/bin/env python3
"""
Generador de iconos Android para Colección Nuevo Ser
Crea iconos de biblioteca (library) en todas las resoluciones necesarias
Basado en el ícono library de Lucide que usamos en la app
"""

from PIL import Image, ImageDraw
import os

# Colores de la app
COLOR_BG = "#0f172a"  # Slate-900 (fondo muy oscuro)
COLOR_CIRCLE = "#1e293b"  # Slate-800 (círculo de fondo)
COLOR_PRIMARY = "#8b5cf6"  # Purple-500 (color principal)
COLOR_ACCENT = "#fbbf24"  # Amber-400 (color de acento)
COLOR_GRADIENT_START = "#a855f7"  # Purple-400
COLOR_GRADIENT_END = "#f59e0b"  # Amber-500

# Tamaños para cada densidad
SIZES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192
}

def hex_to_rgb(hex_color):
    """Convierte color hex a tupla RGB"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def interpolate_color(color1, color2, factor):
    """Interpola entre dos colores (factor entre 0 y 1)"""
    r1, g1, b1 = hex_to_rgb(color1)
    r2, g2, b2 = hex_to_rgb(color2)

    r = int(r1 + (r2 - r1) * factor)
    g = int(g1 + (g2 - g1) * factor)
    b = int(b1 + (b2 - b1) * factor)

    return (r, g, b)

def create_library_icon(size):
    """
    Crea el icono de biblioteca basado en el diseño de Lucide
    4 líneas verticales de diferentes tamaños simulando libros en un estante
    """
    # Crear imagen con fondo transparente para foreground
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Escalar elementos según el tamaño
    # Diseño base para 48px
    scale = size / 48

    # Grosor de las líneas (libros)
    line_width = max(2, int(3 * scale))

    # Área de dibujo (con padding)
    padding = int(8 * scale)
    content_width = size - (2 * padding)
    content_height = size - (2 * padding)

    # 4 posiciones para los "libros" (líneas verticales)
    # Distribuidas uniformemente en el ancho disponible
    num_books = 4
    book_spacing = content_width / (num_books + 1)

    # Definir cada libro con su altura y color
    books = [
        {
            'x': padding + book_spacing * 1,
            'height_factor': 0.85,  # 85% de altura
            'y_offset': 0.15,  # Comienza al 15% desde arriba
            'color_factor': 0.0  # Purple
        },
        {
            'x': padding + book_spacing * 2,
            'height_factor': 1.0,  # 100% de altura (el más alto)
            'y_offset': 0.0,
            'color_factor': 0.33
        },
        {
            'x': padding + book_spacing * 3,
            'height_factor': 0.7,  # 70% de altura
            'y_offset': 0.3,
            'color_factor': 0.66
        },
        {
            'x': padding + book_spacing * 4,
            'height_factor': 0.90,  # 90% de altura
            'y_offset': 0.1,
            'color_factor': 1.0  # Amber
        }
    ]

    # Dibujar cada libro
    for book in books:
        x = int(book['x'])
        book_height = int(content_height * book['height_factor'])
        y_start = int(padding + (content_height * book['y_offset']))
        y_end = y_start + book_height

        # Color con gradiente de purple a amber
        color = interpolate_color(COLOR_GRADIENT_START, COLOR_GRADIENT_END, book['color_factor'])

        # Dibujar la línea (libro) con caps redondeados
        draw.line(
            [(x, y_start), (x, y_end)],
            fill=color,
            width=line_width
        )

        # Agregar pequeño destello en la parte superior
        cap_size = int(2 * scale)
        if cap_size > 0:
            highlight_color = interpolate_color(COLOR_GRADIENT_START, COLOR_GRADIENT_END, book['color_factor'])
            highlight_color = tuple(min(255, c + 40) for c in highlight_color)  # Más brillante
            draw.ellipse(
                [x - cap_size, y_start - cap_size, x + cap_size, y_start + cap_size],
                fill=highlight_color
            )

    return img

def main():
    """Genera todos los iconos necesarios"""
    base_path = "android/app/src/main/res"

    # Crear icono foreground para cada densidad
    for density, size in SIZES.items():
        output_dir = f"{base_path}/mipmap-{density}"
        os.makedirs(output_dir, exist_ok=True)

        # Icono principal (foreground)
        icon = create_library_icon(size)
        icon.save(f"{output_dir}/ic_launcher_foreground.png", "PNG")

        # Icono completo (con fondo)
        bg = Image.new('RGB', (size, size), hex_to_rgb(COLOR_BG))
        # Agregar círculo de fondo
        draw = ImageDraw.Draw(bg)
        margin = size // 8
        draw.ellipse([margin, margin, size-margin, size-margin],
                     fill=hex_to_rgb(COLOR_CIRCLE))
        # Pegar foreground
        bg.paste(icon, (0, 0), icon)
        bg.save(f"{output_dir}/ic_launcher.png", "PNG")

        # Icono redondo
        round_bg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(round_bg)
        # Círculo exterior (fondo oscuro)
        draw.ellipse([0, 0, size-1, size-1], fill=hex_to_rgb(COLOR_BG))
        # Círculo interior (fondo de contenido)
        inner_margin = max(1, int(size * 0.05))
        draw.ellipse([inner_margin, inner_margin, size-inner_margin-1, size-inner_margin-1],
                     fill=hex_to_rgb(COLOR_CIRCLE))
        # Pegar foreground
        round_bg.paste(icon, (0, 0), icon)
        round_bg.save(f"{output_dir}/ic_launcher_round.png", "PNG")

        print(f"✓ Generados iconos para {density} ({size}x{size}px)")

    print("\n✓ Todos los iconos generados exitosamente")
    print(f"✓ Diseño: Biblioteca (Library icon) con gradiente purple-amber")

if __name__ == "__main__":
    main()
