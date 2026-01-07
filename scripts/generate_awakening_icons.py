#!/usr/bin/env python3
"""
Generate Android launcher icons for Awakening Protocol flavor.
Tech-cyber style: deep blue/purple background, cyan glow, eye + circuit pattern.
"""

from PIL import Image, ImageDraw, ImageFilter
import os

BASE_PATH = "mobile-game/mobile-app/android/app/src/awakening/res"

SIZES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192
}

# Awakening color scheme - tech/cyber
COLOR_BG_TOP = "#0a0f1a"
COLOR_BG_BOTTOM = "#050810"
COLOR_RING = "#1a2a4a"
COLOR_EYE_OUTER = "#3b82f6"
COLOR_EYE_INNER = "#60a5fa"
COLOR_PUPIL = "#1e3a5f"
COLOR_NODE = "#67e8f9"
COLOR_ACCENT = "#f59e0b"


def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def lerp(a, b, t):
    return int(a + (b - a) * t)


def lerp_color(c1, c2, t):
    r1, g1, b1 = hex_to_rgb(c1)
    r2, g2, b2 = hex_to_rgb(c2)
    return (lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t))


def draw_vertical_gradient(size, top_color, bottom_color):
    img = Image.new("RGB", (size, size), top_color)
    draw = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        color = lerp_color(top_color, bottom_color, t)
        draw.line([(0, y), (size, y)], fill=color)
    return img


def create_eye_icon(size):
    base = draw_vertical_gradient(size, COLOR_BG_TOP, COLOR_BG_BOTTOM).convert("RGBA")

    # Soft glow
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_radius = int(size * 0.35)
    center = (size // 2, size // 2)
    glow_draw.ellipse(
        [center[0] - glow_radius, center[1] - glow_radius,
         center[0] + glow_radius, center[1] + glow_radius],
        fill=(59, 130, 246, 50)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=int(size * 0.08)))
    base = Image.alpha_composite(base, glow)

    draw = ImageDraw.Draw(base)

    # Outer ring
    ring_margin = int(size * 0.10)
    draw.ellipse(
        [ring_margin, ring_margin, size - ring_margin, size - ring_margin],
        outline=hex_to_rgb(COLOR_RING),
        width=max(2, int(size * 0.03))
    )

    # Eye shape (almond/ellipse)
    eye_w = int(size * 0.50)
    eye_h = int(size * 0.32)
    eye_box = [
        center[0] - eye_w // 2,
        center[1] - eye_h // 2,
        center[0] + eye_w // 2,
        center[1] + eye_h // 2
    ]
    draw.ellipse(eye_box, fill=hex_to_rgb(COLOR_EYE_OUTER), outline=hex_to_rgb(COLOR_EYE_INNER), width=max(1, int(size * 0.02)))

    # Iris
    iris_r = int(size * 0.12)
    draw.ellipse(
        [center[0] - iris_r, center[1] - iris_r,
         center[0] + iris_r, center[1] + iris_r],
        fill=hex_to_rgb(COLOR_EYE_INNER)
    )

    # Pupil
    pupil_r = int(size * 0.06)
    draw.ellipse(
        [center[0] - pupil_r, center[1] - pupil_r,
         center[0] + pupil_r, center[1] + pupil_r],
        fill=hex_to_rgb(COLOR_PUPIL)
    )

    # Light reflection
    ref_r = int(size * 0.025)
    ref_offset = int(size * 0.03)
    draw.ellipse(
        [center[0] - ref_offset - ref_r, center[1] - ref_offset - ref_r,
         center[0] - ref_offset + ref_r, center[1] - ref_offset + ref_r],
        fill=(255, 255, 255, 200)
    )

    # Circuit nodes
    node_radius = max(2, int(size * 0.03))
    nodes = [
        (center[0] + int(size * 0.28), center[1] - int(size * 0.15)),
        (center[0] - int(size * 0.30), center[1] - int(size * 0.12)),
        (center[0] + int(size * 0.25), center[1] + int(size * 0.18)),
        (center[0] - int(size * 0.22), center[1] + int(size * 0.20))
    ]
    for node in nodes:
        draw.ellipse(
            [node[0] - node_radius, node[1] - node_radius,
             node[0] + node_radius, node[1] + node_radius],
            fill=hex_to_rgb(COLOR_NODE),
            outline=hex_to_rgb(COLOR_ACCENT),
            width=1
        )

    # Circuit lines
    line_width = max(1, int(size * 0.015))
    draw.line([(center[0] + int(size * 0.20), center[1]), nodes[0]], fill=hex_to_rgb(COLOR_NODE), width=line_width)
    draw.line([(center[0] - int(size * 0.20), center[1]), nodes[1]], fill=hex_to_rgb(COLOR_NODE), width=line_width)
    draw.line([(center[0] + int(size * 0.15), center[1] + int(size * 0.10)), nodes[2]], fill=hex_to_rgb(COLOR_NODE), width=line_width)
    draw.line([(center[0] - int(size * 0.12), center[1] + int(size * 0.12)), nodes[3]], fill=hex_to_rgb(COLOR_NODE), width=line_width)

    return base


def main():
    # Change to project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    os.chdir(project_root)

    for density, size in SIZES.items():
        output_dir = os.path.join(BASE_PATH, f"mipmap-{density}")
        os.makedirs(output_dir, exist_ok=True)

        icon = create_eye_icon(size)
        icon.save(os.path.join(output_dir, "ic_launcher.png"), "PNG")

        # Round icon
        round_icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        mask = Image.new("L", (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse([0, 0, size - 1, size - 1], fill=255)
        round_icon.paste(icon, (0, 0), mask)
        round_icon.save(os.path.join(output_dir, "ic_launcher_round.png"), "PNG")

        # Foreground icon (same icon on transparent bg)
        fg = icon.copy()
        fg.putalpha(icon.split()[-1])
        fg.save(os.path.join(output_dir, "ic_launcher_foreground.png"), "PNG")

        print(f"✓ Awakening icons generated for {density} ({size}x{size})")

    print("✓ All Awakening Protocol icons generated")


if __name__ == "__main__":
    main()
