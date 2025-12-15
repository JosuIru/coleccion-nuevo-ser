#!/usr/bin/env python3
"""
Script FINAL para regenerar book.json de "La Tierra que Despierta"
con formato markdown perfecto.
"""

import json
import re
from pathlib import Path

BASE_DIR = Path("/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser")
FILES_DIR = BASE_DIR / "books" / "files"
OUTPUT_FILE = BASE_DIR / "www" / "books" / "tierra-que-despierta" / "book.json"

CHAPTER_FILES = {
    "prologo": "Prologo_La_Tierra_que_Despierta.txt",
    "cap1": "Capitulo_01_La_Gran_Separacion.txt",
    "cap2": "Capitulo_02_El_Costo_del_Olvido.txt",
    "cap3": "Capitulo_03_La_Anestesia_Moderna.txt",
    "cap4": "Capitulo_04_Ecologia_Profunda.txt",
    "cap5": "Capitulo_05_Gaia.txt",
    "cap6": "Capitulo_06_Thomas_Berry.txt",
    "cap7": "Capitulo_07_Biomimetica.txt",
    "cap8": "Capitulo_08_Pensamiento_Relacional.txt",
    "cap9": "Capitulo_09_El_Dolor_del_Mundo.txt",
    "cap10": "Capitulo_10_Honrar_lo_que_se_Pierde.txt",
    "cap11": "Capitulo_11_La_Esperanza_Activa.txt",
    "cap12": "Capitulo_12_Rabia_Sagrada.txt",
    "cap13": "Capitulo_13_Presencia_Naturaleza.txt",
    "cap14": "Capitulo_14_Trabajo_que_Reconecta.txt",
    "cap15": "Capitulo_15_Rituales_Conexion.txt",
    "cap16": "Capitulo_16_Diario_Ecologico.txt",
    "cap17": "Capitulo_17_Escucha_Profunda.txt",
    "cap18": "Capitulo_18_Activismo_Corazon.txt",
    "cap19": "Capitulo_19_Permacultura_Social.txt",
    "cap20": "Capitulo_20_Comunidades_Practica.txt",
    "cap21": "Capitulo_21_Ecologia_Lugar.txt",
    "cap22": "Capitulo_22_Limites_Reconexion.txt",
    "cap23": "Capitulo_23_Sombras_Movimiento.txt",
    "cap24": "Capitulo_24_Invitacion.txt",
    "epilogo": "Epilogo_Carta_a_la_Tierra.txt"
}


def is_subtitle(line, prev_line="", next_line=""):
    """Detecta si una línea es un subtítulo."""
    line_stripped = line.strip()

    if not line_stripped:
        return False
    if line_stripped.startswith("✦"):
        return False
    if line_stripped.startswith("«"):
        return False
    if line_stripped.startswith("—"):
        return False
    if line_stripped.startswith("•"):
        return False
    if line_stripped.startswith("["):
        return False
    if line_stripped.startswith("PARTE"):
        return False
    if line_stripped.startswith("Capítulo"):
        return False
    if line_stripped.startswith("PRÁCTICA"):
        return False
    if line_stripped.startswith("Propósito:"):
        return False
    if line_stripped.startswith("Tiempo"):
        return False
    if line_stripped.startswith("Materiales:"):
        return False
    if "parte:" in line_stripped.lower() or "parte " in line_stripped.lower():
        return False

    # Patrones específicos de subtítulo
    patterns = [
        r'^Principio \d+$',
        r'^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+ [a-záéíóúñ]+ [a-záéíóúñ]+:',
    ]

    for pattern in patterns:
        if re.match(pattern, line_stripped):
            return True

    # Heurística: líneas cortas sin punto final y siguiente línea más larga
    if len(line_stripped) < 100 and not line_stripped.endswith('.'):
        if line_stripped.endswith('?') or line_stripped.endswith('!'):
            return False
        if next_line and len(next_line.strip()) > len(line_stripped) * 1.5:
            if len(line_stripped) > 15:
                return True

    return False


def format_content_lines(lines):
    """Convierte líneas en contenido markdown."""
    result = []
    i = 0

    while i < len(lines):
        line = lines[i].rstrip()
        prev_line = lines[i - 1].rstrip() if i > 0 else ""
        next_line = lines[i + 1].rstrip() if i + 1 < len(lines) else ""

        if not line.strip():
            i += 1
            continue

        if line.strip() == "✦" or line.strip() == "✦ ✦ ✦":
            result.append(line.strip())
            i += 1
            continue

        if line.strip().startswith("[Nota de Claude") or line.strip().startswith("[Josu recuerda]"):
            result.append(line.strip())
            i += 1
            continue

        if line.strip() in ["Josu", "Claude", "Convergencia"] and len(line.strip()) < 15:
            result.append(f"**{line.strip()}**")
            i += 1
            continue

        if is_subtitle(line, prev_line, next_line):
            result.append(f"### {line.strip()}")
            i += 1
            continue

        result.append(line.strip())
        i += 1

    return "\n\n".join(result)


def extract_epigraph(lines):
    """
    Extrae el epígrafe que viene DESPUÉS del título del capítulo.
    Ignora las citas que aparecen antes (que son del subtítulo de la Parte).
    """
    epigraph_text = ""
    epigraph_author = ""

    # Buscar primero la línea "Capítulo N"
    chapter_line_index = -1
    for i, line in enumerate(lines):
        if line.strip().startswith("Capítulo") or line.strip() == "PRÓLOGO A DOS VOCES":
            chapter_line_index = i
            break

    # Si no encontramos "Capítulo", buscar desde el principio (caso del prólogo)
    if chapter_line_index == -1:
        chapter_line_index = 0

    # Buscar el epígrafe DESPUÉS del título del capítulo
    for i in range(chapter_line_index, len(lines)):
        stripped = lines[i].strip()

        # Saltar el título del capítulo mismo
        if stripped.startswith("Capítulo"):
            continue

        # Buscar la cita
        if stripped.startswith("«") and stripped.endswith("»"):
            epigraph_text = stripped
            # Buscar autor en las siguientes líneas
            for j in range(i + 1, min(i + 4, len(lines))):
                author_line = lines[j].strip()
                if author_line.startswith("—"):
                    epigraph_author = author_line.replace("—", "").strip()
                    break
            break
        elif stripped.startswith("«") and not stripped.endswith("»"):
            # Cita multilínea
            quote_lines = [stripped]
            for j in range(i + 1, min(i + 10, len(lines))):
                next_l = lines[j].strip()
                quote_lines.append(next_l)
                if next_l.endswith("»"):
                    epigraph_text = "\n".join(quote_lines)
                    # Buscar autor
                    for k in range(j + 1, min(j + 4, len(lines))):
                        author_line = lines[k].strip()
                        if author_line.startswith("—"):
                            epigraph_author = author_line.replace("—", "").strip()
                            break
                    break
            break

    return {"text": epigraph_text, "author": epigraph_author}


def extract_closing_question(lines):
    """Extrae la pregunta de cierre."""
    for i, line in enumerate(lines):
        if "Pregunta para llevar contigo:" in line:
            question_lines = []
            for j in range(i + 1, min(i + 10, len(lines))):
                q_line = lines[j].strip()
                if q_line and not q_line.startswith("✦"):
                    question_lines.append(q_line)
                elif len(question_lines) > 0:
                    break
            return "\n".join(question_lines)
    return ""


def extract_main_content(lines):
    """Extrae el contenido principal."""
    content_lines = []
    content_started = False
    skip_lines = 0

    for i, line in enumerate(lines):
        stripped = line.strip()

        # Saltar líneas hasta encontrar el contenido real
        if not content_started:
            # Saltar metadatos iniciales
            if stripped.startswith("PARTE ") or stripped.startswith("EL ") or stripped.startswith("LA ") or stripped.startswith("LOS "):
                if stripped.isupper() and i < 10:
                    continue
            if stripped.startswith("Capítulo"):
                continue
            if stripped.startswith("✦") and i < 10:
                continue

            # Saltar epígrafe (cualquier línea con « que viene antes del contenido real)
            if stripped.startswith("«"):
                skip_lines = 4
                continue

            if skip_lines > 0:
                skip_lines -= 1
                continue

            # El contenido empieza con el primer párrafo real
            if stripped and len(stripped) > 20:
                content_started = True

        # Parar en práctica o pregunta de cierre
        if stripped.startswith("PRÁCTICA") or "Pregunta para llevar" in stripped:
            break

        if content_started:
            content_lines.append(line)

    return format_content_lines(content_lines)


def process_chapter(file_path):
    """Procesa un archivo de capítulo."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')

    return {
        "epigraph": extract_epigraph(lines),
        "content": extract_main_content(lines),
        "closingQuestion": extract_closing_question(lines)
    }


def main():
    print("🌍 Regenerando book.json - VERSIÓN DEFINITIVA\n")

    # Cargar libro existente
    with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
        book_data = json.load(f)

    chapters_processed = 0
    total_chapters = sum(len(s["chapters"]) for s in book_data["sections"])

    # Procesar cada capítulo
    for section in book_data["sections"]:
        for chapter in section["chapters"]:
            chapter_id = chapter["id"]

            if chapter_id not in CHAPTER_FILES:
                continue

            file_path = FILES_DIR / CHAPTER_FILES[chapter_id]
            if not file_path.exists():
                continue

            print(f"📖 {chapter['title']}")

            try:
                data = process_chapter(file_path)

                if data["epigraph"]["text"]:
                    chapter["epigraph"] = data["epigraph"]

                chapter["content"] = data["content"]

                if data["closingQuestion"]:
                    chapter["closingQuestion"] = data["closingQuestion"]

                chapters_processed += 1

            except Exception as e:
                print(f"❌ Error: {e}")
                import traceback
                traceback.print_exc()

    # Guardar
    print(f"\n💾 Guardando...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(book_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ ¡Listo!")
    print(f"   • {chapters_processed}/{total_chapters} capítulos procesados")
    print(f"   • Archivo: {OUTPUT_FILE}\n")


if __name__ == "__main__":
    main()
