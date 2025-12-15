#!/usr/bin/env python3
"""
Script para añadir niveles de dificultad al archivo quizzes.json de ahora-instituciones.
"""

import json

# Mapa de dificultades por capítulo y pregunta
# Basado en análisis de complejidad conceptual
difficulty_map = {
    "prologo": ["iniciado", "principiante", "iniciado", "principiante"],
    "cap5": ["principiante", "principiante", "iniciado", "experto"],
    "cap6": ["principiante", "principiante", "iniciado", "experto"],
    "cap7": ["iniciado", "principiante", "iniciado", "experto"],
    "cap8": ["iniciado", "experto", "iniciado", "experto"],
    "cap9": ["principiante", "principiante", "iniciado", "experto"],
    "cap10": ["iniciado", "iniciado", "experto", "iniciado"],
    "cap11": ["iniciado", "iniciado", "iniciado", "experto"],
    "cap12": ["experto", "iniciado", "iniciado", "experto"],
    "cap13": ["iniciado", "principiante", "iniciado", "iniciado"],
    "cap14": ["iniciado", "iniciado", "iniciado", "experto"],
    "cap15": ["principiante", "iniciado", "experto", "experto"],
    "cap16": ["iniciado", "iniciado", "experto", "experto"],
    "cap17": ["principiante", "iniciado", "iniciado", "experto"],
    "cap18": ["experto", "principiante", "iniciado", "iniciado"],
    "cap19": ["iniciado", "iniciado", "iniciado", "iniciado"],
    "cap20": ["iniciado", "iniciado", "experto", "iniciado"],
    "cap21": ["principiante", "iniciado", "principiante", "experto"],
    "cap22": ["iniciado", "iniciado", "iniciado", "experto"],
    "cap23": ["principiante", "iniciado", "iniciado", "experto"],
    "cap24": ["principiante", "iniciado", "iniciado", "experto"],
    "cap25": ["principiante", "iniciado", "iniciado", "experto"],
    "epilogo": ["principiante", "iniciado", "iniciado", "experto"]
}

def add_difficulty_levels(input_file, output_file):
    """Lee el archivo JSON, añade dificultad y guarda el resultado."""

    # Leer archivo original
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Añadir dificultad a cada pregunta
    for chapter_id, chapter_data in data["chapters"].items():
        if chapter_id in difficulty_map:
            difficulties = difficulty_map[chapter_id]
            questions = chapter_data["questions"]

            for i, question in enumerate(questions):
                if i < len(difficulties):
                    question["difficulty"] = difficulties[i]
                else:
                    # Por defecto, si no hay mapping
                    question["difficulty"] = "iniciado"

    # Guardar archivo actualizado
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✓ Archivo actualizado: {output_file}")
    print(f"✓ Procesados {len(data['chapters'])} capítulos")

if __name__ == "__main__":
    input_path = "/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/books/ahora-instituciones/assets/quizzes.json"
    output_path = input_path  # Sobrescribir el original

    add_difficulty_levels(input_path, output_path)
