#!/usr/bin/env python3
"""
Generate Android launcher icons for Trascendencia flavor.
Tech-organic style: deep green background, teal glow, leaf + circuit nodes.
"""

from PIL import Image, ImageDraw, ImageFilter
import os

BASE_PATH = "mobile-game/mobile-app/android/app/src/trascendencia/res"

SIZES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192
}

COLOR_BG_TOP = "#0f1f1a"
COLOR_BG_BOTTOM = "#08110d"
COLOR_RING = "#1f3a30"
COLOR_LEAF_MAIN = "#2ccf8a"
COLOR_LEAF_ALT = "#1a8f62"
COLOR_NODE = "#9be4c9"
COLOR_ACCENT = "#f2c86b"


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


def create_leaf_icon(size):
    base = draw_vertical_gradient(size, COLOR_BG_TOP, COLOR_BG_BOTTOM).convert("RGBA")

    # Soft glow
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_radius = int(size * 0.33)
    center = (size // 2, size // 2)
    glow_draw.ellipse(
        [center[0] - glow_radius, center[1] - glow_radius,
         center[0] + glow_radius, center[1] + glow_radius],
        fill=(44, 207, 138, 60)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=int(size * 0.06)))
    base = Image.alpha_composite(base, glow)

    draw = ImageDraw.Draw(base)

    # Ring
    ring_margin = int(size * 0.12)
    draw.ellipse(
        [ring_margin, ring_margin, size - ring_margin, size - ring_margin],
        outline=hex_to_rgb(COLOR_RING),
        width=max(2, int(size * 0.03))
    )

    # Leaf shape
    leaf = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    leaf_draw = ImageDraw.Draw(leaf)
    leaf_w = int(size * 0.36)
    leaf_h = int(size * 0.55)
    leaf_box = [
        center[0] - leaf_w // 2,
        center[1] - leaf_h // 2,
        center[0] + leaf_w // 2,
        center[1] + leaf_h // 2
    ]
    leaf_draw.ellipse(leaf_box, fill=hex_to_rgb(COLOR_LEAF_MAIN))
    leaf = leaf.rotate(25, resample=Image.BICUBIC, center=center)
    base = Image.alpha_composite(base, leaf)

    # Secondary leaf
    leaf2 = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    leaf2_draw = ImageDraw.Draw(leaf2)
    leaf2_w = int(size * 0.26)
    leaf2_h = int(size * 0.42)
    leaf2_box = [
        center[0] - leaf2_w // 2,
        center[1] - leaf2_h // 2,
        center[0] + leaf2_w // 2,
        center[1] + leaf2_h // 2
    ]
    leaf2_draw.ellipse(leaf2_box, fill=hex_to_rgb(COLOR_LEAF_ALT))
    leaf2 = leaf2.rotate(-20, resample=Image.BICUBIC, center=(center[0], center[1] + int(size * 0.02)))
    base = Image.alpha_composite(base, leaf2)

    # Leaf stem line
    stem_len = int(size * 0.22)
    stem_width = max(2, int(size * 0.03))
    draw.line(
        [(center[0], center[1] + int(size * 0.12)),
         (center[0] - int(size * 0.08), center[1] + stem_len)],
        fill=hex_to_rgb(COLOR_NODE),
        width=stem_width
    )

    # Circuit nodes
    node_radius = max(2, int(size * 0.035))
    nodes = [
        (center[0] + int(size * 0.18), center[1] - int(size * 0.1)),
        (center[0] - int(size * 0.2), center[1] - int(size * 0.18)),
        (center[0] + int(size * 0.12), center[1] + int(size * 0.22))
    ]
    for node in nodes:
        draw.ellipse(
            [node[0] - node_radius, node[1] - node_radius,
             node[0] + node_radius, node[1] + node_radius],
            fill=hex_to_rgb(COLOR_NODE),
            outline=hex_to_rgb(COLOR_ACCENT),
            width=1
        )
    draw.line([center, nodes[0]], fill=hex_to_rgb(COLOR_NODE), width=max(1, int(size * 0.02)))
    draw.line([center, nodes[1]], fill=hex_to_rgb(COLOR_NODE), width=max(1, int(size * 0.02)))
    draw.line([center, nodes[2]], fill=hex_to_rgb(COLOR_NODE), width=max(1, int(size * 0.02)))

    return base


def main():
    for density, size in SIZES.items():
        output_dir = os.path.join(BASE_PATH, f"mipmap-{density}")
        os.makedirs(output_dir, exist_ok=True)

        icon = create_leaf_icon(size)
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

        print(f"✓ Trascendencia icons generated for {density} ({size}x{size})")

    print("✓ All Trascendencia icons generated")


if __name__ == "__main__":
    main()
