#!/usr/bin/env python3
"""
Generador de Quizzes Educativos para la Colección Nuevo Ser

Este script genera preguntas de quiz educativo para los libros:
- tierra-que-despierta (26 capítulos)
- manual-transicion (22 capítulos)
- toolkit-transicion (22 capítulos)
"""

import json
import os
from pathlib import Path

# Configuración base
BASE_PATH = Path("/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/books")

# Definición de libros a procesar
LIBROS = {
    "tierra-que-despierta": {
        "title": "La Tierra que Despierta",
        "expected_chapters": 26,
        "temas_principales": [
            "ecología profunda",
            "conciencia planetaria",
            "crisis ecológica",
            "reconexión con la naturaleza",
            "Gaia",
            "sistemas vivos"
        ]
    },
    "manual-transicion": {
        "title": "Manual de Transición",
        "expected_chapters": 22,
        "temas_principales": [
            "cambio sistémico",
            "prefiguración",
            "cooperativas",
            "economía solidaria",
            "gobernanza horizontal",
            "transiciones históricas"
        ]
    },
    "toolkit-transicion": {
        "title": "Toolkit de Transición",
        "expected_chapters": 22,
        "temas_principales": [
            "ejercicios prácticos",
            "herramientas de transición",
            "facilitación",
            "aprendizaje por acción",
            "transformación colectiva"
        ]
    }
}

def cargar_libro(libro_id):
    """Carga el archivo book.json de un libro"""
    libro_path = BASE_PATH / libro_id / "book.json"

    if not libro_path.exists():
        print(f"ERROR: No se encuentra {libro_path}")
        return None

    with open(libro_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def extraer_capitulos(book_data):
    """Extrae todos los capítulos de un libro"""
    capitulos = []

    if "sections" in book_data:
        for seccion in book_data["sections"]:
            if "chapters" in seccion:
                for capitulo in seccion["chapters"]:
                    capitulos.append({
                        "id": capitulo.get("id"),
                        "title": capitulo.get("title"),
                        "content": capitulo.get("content", ""),
                        "epigraph": capitulo.get("epigraph", {}),
                        "closingQuestion": capitulo.get("closingQuestion", "")
                    })

    return capitulos

def generar_preguntas_capitulo(capitulo, libro_info):
    """
    Genera 4-6 preguntas educativas para un capítulo

    NOTA: Esta es una función template. Las preguntas reales se crearán
    manualmente basándose en el contenido de cada capítulo para garantizar
    calidad educativa y relevancia contextual.
    """

    preguntas_template = [
        {
            "id": "q1",
            "question": f"¿Cuál es el concepto central desarrollado en '{capitulo['title']}'?",
            "type": "multiple",
            "options": [
                "Opción A - a definir según contenido",
                "Opción B - correcta - a definir",
                "Opción C - plausible pero incorrecta",
                "Opción D - plausible pero incorrecta"
            ],
            "correct": 1,
            "explanation": "Explicación educativa que refuerza el aprendizaje del concepto clave.",
            "bookQuote": "[Cita textual relevante del capítulo]",
            "chapterContext": capitulo['id']
        },
        {
            "id": "q2",
            "question": "¿Cómo se aplica este concepto en la práctica?",
            "type": "multiple",
            "options": [
                "Aplicación A - incorrecta",
                "Aplicación B - correcta",
                "Aplicación C - incorrecta",
                "Aplicación D - incorrecta"
            ],
            "correct": 1,
            "explanation": "Explicación de la aplicación práctica del concepto.",
            "bookQuote": "[Cita del libro sobre aplicación práctica]",
            "chapterContext": capitulo['id']
        }
    ]

    return preguntas_template

def generar_quiz_libro(libro_id):
    """Genera el archivo de quizzes completo para un libro"""

    print(f"\n{'='*60}")
    print(f"Procesando: {LIBROS[libro_id]['title']}")
    print(f"{'='*60}")

    # Cargar datos del libro
    book_data = cargar_libro(libro_id)
    if not book_data:
        return None

    # Extraer capítulos
    capitulos = extraer_capitulos(book_data)
    print(f"Capítulos encontrados: {len(capitulos)}")
    print(f"Capítulos esperados: {LIBROS[libro_id]['expected_chapters']}")

    # Estructura del quiz
    quiz_data = {
        "bookId": libro_id,
        "bookTitle": LIBROS[libro_id]['title'],
        "version": "1.0",
        "metadata": {
            "totalChapters": len(capitulos),
            "totalQuestions": len(capitulos) * 5,  # Promedio 5 preguntas por capítulo
            "difficulty": "Progresiva",
            "temasPrincipales": LIBROS[libro_id]['temas_principales'],
            "generatedDate": "2025-12-12",
            "generatedBy": "Quiz Generator v1.0"
        },
        "chapters": {}
    }

    # Generar preguntas para cada capítulo
    for idx, capitulo in enumerate(capitulos, 1):
        cap_id = capitulo['id']

        print(f"\n[{idx}/{len(capitulos)}] {cap_id}: {capitulo['title']}")
        print(f"  Longitud contenido: {len(capitulo['content'])} caracteres")

        # Template de preguntas (se rellenará manualmente)
        quiz_data["chapters"][cap_id] = {
            "chapterTitle": capitulo['title'],
            "epigraph": capitulo.get('epigraph', {}),
            "closingQuestion": capitulo.get('closingQuestion', ''),
            "contentLength": len(capitulo['content']),
            "questions": [
                {
                    "id": "q1",
                    "question": f"[PENDIENTE] Pregunta sobre concepto clave de '{capitulo['title']}'",
                    "type": "multiple",
                    "options": [
                        "[PENDIENTE] Opción A - incorrecta pero plausible",
                        "[PENDIENTE] Opción B - CORRECTA",
                        "[PENDIENTE] Opción C - incorrecta pero plausible",
                        "[PENDIENTE] Opción D - incorrecta pero plausible"
                    ],
                    "correct": 1,
                    "explanation": "[PENDIENTE] Explicación educativa",
                    "bookQuote": "[PENDIENTE] Cita textual del capítulo",
                    "tags": ["concepto-clave", "comprensión"],
                    "difficulty": "intermedio"
                },
                {
                    "id": "q2",
                    "question": "[PENDIENTE] Pregunta sobre aplicación práctica",
                    "type": "multiple",
                    "options": [
                        "[PENDIENTE] Aplicación A",
                        "[PENDIENTE] Aplicación B - CORRECTA",
                        "[PENDIENTE] Aplicación C",
                        "[PENDIENTE] Aplicación D"
                    ],
                    "correct": 1,
                    "explanation": "[PENDIENTE] Explicación de aplicación",
                    "bookQuote": "[PENDIENTE] Cita sobre práctica",
                    "tags": ["aplicación", "práctica"],
                    "difficulty": "básico"
                },
                {
                    "id": "q3",
                    "question": "[PENDIENTE] Pregunta sobre implicaciones filosóficas/teóricas",
                    "type": "multiple",
                    "options": [
                        "[PENDIENTE] Implicación A",
                        "[PENDIENTE] Implicación B - CORRECTA",
                        "[PENDIENTE] Implicación C",
                        "[PENDIENTE] Implicación D"
                    ],
                    "correct": 1,
                    "explanation": "[PENDIENTE] Explicación profunda",
                    "bookQuote": "[PENDIENTE] Cita filosófica",
                    "tags": ["filosofía", "teoría"],
                    "difficulty": "avanzado"
                },
                {
                    "id": "q4",
                    "question": "[PENDIENTE] Pregunta sobre relaciones entre conceptos",
                    "type": "multiple",
                    "options": [
                        "[PENDIENTE] Relación A",
                        "[PENDIENTE] Relación B - CORRECTA",
                        "[PENDIENTE] Relación C",
                        "[PENDIENTE] Relación D"
                    ],
                    "correct": 1,
                    "explanation": "[PENDIENTE] Explicación de conexiones",
                    "bookQuote": "[PENDIENTE] Cita sobre relaciones",
                    "tags": ["síntesis", "conexiones"],
                    "difficulty": "intermedio"
                }
            ],
            "_notas_generacion": [
                "Este capítulo requiere análisis detallado del contenido",
                "Las preguntas deben evaluar COMPRENSIÓN, no memorización",
                "Incluir citas textuales precisas del libro",
                "Opciones incorrectas deben ser plausibles, no obvias"
            ]
        }

    return quiz_data

def guardar_quiz(libro_id, quiz_data):
    """Guarda el archivo de quiz generado"""

    output_path = BASE_PATH / libro_id / "assets" / "quizzes.json"

    # Crear directorio assets si no existe
    output_path.parent.mkdir(exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(quiz_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Quiz guardado en: {output_path}")
    print(f"  Total capítulos: {quiz_data['metadata']['totalChapters']}")
    print(f"  Total preguntas (plantillas): {quiz_data['metadata']['totalQuestions']}")

def generar_reporte():
    """Genera reporte con extractos de contenido para facilitar creación manual"""

    reporte = {
        "titulo": "Reporte de Contenidos para Generación de Quizzes",
        "fecha": "2025-12-12",
        "libros": {}
    }

    for libro_id in LIBROS.keys():
        book_data = cargar_libro(libro_id)
        if not book_data:
            continue

        capitulos = extraer_capitulos(book_data)

        reporte["libros"][libro_id] = {
            "titulo": LIBROS[libro_id]['title'],
            "capitulos": []
        }

        for cap in capitulos:
            # Extraer primeros 500 caracteres como muestra
            contenido_muestra = cap['content'][:500] + "..." if len(cap['content']) > 500 else cap['content']

            reporte["libros"][libro_id]["capitulos"].append({
                "id": cap['id'],
                "titulo": cap['title'],
                "epigraph": cap.get('epigraph', {}),
                "contenido_muestra": contenido_muestra,
                "longitud_total": len(cap['content']),
                "pregunta_cierre": cap.get('closingQuestion', '')
            })

    # Guardar reporte
    reporte_path = BASE_PATH.parent.parent / "REPORTE-CONTENIDOS-QUIZ.json"
    with open(reporte_path, 'w', encoding='utf-8') as f:
        json.dump(reporte, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Reporte de contenidos guardado en: {reporte_path}")

def main():
    """Función principal"""

    print("\n" + "="*60)
    print("GENERADOR DE QUIZZES EDUCATIVOS")
    print("Colección Nuevo Ser")
    print("="*60)

    # Generar quizzes para cada libro
    resultados = {}

    for libro_id in LIBROS.keys():
        quiz_data = generar_quiz_libro(libro_id)

        if quiz_data:
            guardar_quiz(libro_id, quiz_data)
            resultados[libro_id] = "✓ Generado"
        else:
            resultados[libro_id] = "✗ Error"

    # Generar reporte de contenidos
    generar_reporte()

    # Resumen final
    print("\n" + "="*60)
    print("RESUMEN DE GENERACIÓN")
    print("="*60)

    for libro_id, estado in resultados.items():
        print(f"{estado} {LIBROS[libro_id]['title']}")

    print("\n" + "="*60)
    print("PRÓXIMOS PASOS:")
    print("="*60)
    print("""
1. Revisar los archivos quizzes.json generados
2. Rellenar las preguntas [PENDIENTE] con contenido real
3. Verificar que las citas sean textuales del libro
4. Asegurar que opciones incorrectas sean plausibles
5. Validar explicaciones educativas
6. Ajustar dificultad según necesidad
    """)

if __name__ == "__main__":
    main()
