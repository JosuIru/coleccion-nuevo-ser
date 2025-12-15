#!/usr/bin/env python3
"""
Validador de Quizzes Educativos
Verifica la calidad y estructura de los archivos de quiz generados
"""

import json
from pathlib import Path
from typing import Dict, List, Any

BASE_PATH = Path("/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/books")

LIBROS = {
    "filosofia-nuevo-ser": "Filosofía del Nuevo Ser",
    "manual-practico": "Manual Práctico",
    "practicas-radicales": "Prácticas Radicales"
}


def validar_estructura_pregunta(pregunta: Dict[str, Any], cap_id: str, q_idx: int) -> List[str]:
    """Valida que una pregunta tenga la estructura correcta"""
    errores = []

    campos_requeridos = ['id', 'question', 'type', 'options', 'correct', 'explanation', 'bookQuote']

    for campo in campos_requeridos:
        if campo not in pregunta:
            errores.append(f"  ❌ {cap_id} Q{q_idx+1}: Falta campo '{campo}'")

    if 'options' in pregunta:
        if not isinstance(pregunta['options'], list):
            errores.append(f"  ❌ {cap_id} Q{q_idx+1}: 'options' debe ser lista")
        elif len(pregunta['options']) != 4:
            errores.append(f"  ⚠️  {cap_id} Q{q_idx+1}: Se esperan 4 opciones, hay {len(pregunta['options'])}")

    if 'correct' in pregunta:
        if not isinstance(pregunta['correct'], int):
            errores.append(f"  ❌ {cap_id} Q{q_idx+1}: 'correct' debe ser entero")
        elif pregunta['correct'] not in [0, 1, 2, 3]:
            errores.append(f"  ❌ {cap_id} Q{q_idx+1}: 'correct' debe estar entre 0-3")

    if 'question' in pregunta:
        if len(pregunta['question']) < 10:
            errores.append(f"  ⚠️  {cap_id} Q{q_idx+1}: Pregunta muy corta")

    if 'explanation' in pregunta:
        if len(pregunta['explanation']) < 20:
            errores.append(f"  ⚠️  {cap_id} Q{q_idx+1}: Explicación muy corta")

    return errores


def analizar_calidad_pregunta(pregunta: Dict[str, Any], cap_id: str, q_idx: int) -> Dict[str, Any]:
    """Analiza la calidad de una pregunta"""

    analisis = {
        "long_pregunta": len(pregunta.get('question', '')),
        "long_explicacion": len(pregunta.get('explanation', '')),
        "long_cita": len(pregunta.get('bookQuote', '')),
        "opciones_unicas": len(set(pregunta.get('options', []))),
        "calidad": "buena"
    }

    # Verificar calidad
    if analisis['long_pregunta'] < 30:
        analisis['calidad'] = "mejorable"
    if analisis['long_explicacion'] < 50:
        analisis['calidad'] = "mejorable"
    if analisis['opciones_unicas'] < 4:
        analisis['calidad'] = "mala"

    return analisis


def validar_quiz_libro(libro_id: str) -> Dict[str, Any]:
    """Valida el archivo de quiz de un libro"""

    print(f"\n{'='*70}")
    print(f"📚 Validando: {LIBROS[libro_id]}")
    print(f"{'='*70}")

    quiz_path = BASE_PATH / libro_id / "quizzes.json"

    if not quiz_path.exists():
        print(f"❌ ERROR: No se encuentra {quiz_path}")
        return None

    # Cargar quiz
    with open(quiz_path, 'r', encoding='utf-8') as f:
        quiz_data = json.load(f)

    # Estadísticas
    stats = {
        "total_capitulos": len(quiz_data.get('chapters', {})),
        "total_preguntas": 0,
        "errores_estructura": [],
        "warnings": [],
        "calidad_promedio": [],
        "capitulos_sin_preguntas": []
    }

    # Validar cada capítulo
    for cap_id, cap_data in quiz_data.get('chapters', {}).items():
        if 'questions' not in cap_data or not cap_data['questions']:
            stats['capitulos_sin_preguntas'].append(cap_id)
            continue

        preguntas = cap_data['questions']
        stats['total_preguntas'] += len(preguntas)

        # Validar cada pregunta
        for q_idx, pregunta in enumerate(preguntas):
            errores = validar_estructura_pregunta(pregunta, cap_id, q_idx)
            stats['errores_estructura'].extend(errores)

            calidad = analizar_calidad_pregunta(pregunta, cap_id, q_idx)
            stats['calidad_promedio'].append(calidad)

    # Reporte
    print(f"\n📊 ESTADÍSTICAS:")
    print(f"  ✓ Capítulos: {stats['total_capitulos']}")
    print(f"  ✓ Preguntas: {stats['total_preguntas']}")
    print(f"  ✓ Promedio preguntas/capítulo: {stats['total_preguntas'] / max(stats['total_capitulos'], 1):.1f}")

    # Errores
    if stats['errores_estructura']:
        print(f"\n⚠️  ERRORES DE ESTRUCTURA ({len(stats['errores_estructura'])}):")
        for error in stats['errores_estructura'][:10]:  # Mostrar solo primeros 10
            print(error)
        if len(stats['errores_estructura']) > 10:
            print(f"  ... y {len(stats['errores_estructura']) - 10} más")
    else:
        print(f"\n✅ Sin errores de estructura")

    # Capítulos sin preguntas
    if stats['capitulos_sin_preguntas']:
        print(f"\n⚠️  CAPÍTULOS SIN PREGUNTAS:")
        for cap_id in stats['capitulos_sin_preguntas']:
            print(f"  - {cap_id}")

    # Análisis de calidad
    if stats['calidad_promedio']:
        calidades = [q['calidad'] for q in stats['calidad_promedio']]
        print(f"\n📈 CALIDAD DE PREGUNTAS:")
        print(f"  Buenas: {calidades.count('buena')}")
        print(f"  Mejorables: {calidades.count('mejorable')}")
        print(f"  Malas: {calidades.count('mala')}")

        # Promedio longitudes
        long_pregunta_prom = sum(q['long_pregunta'] for q in stats['calidad_promedio']) / len(stats['calidad_promedio'])
        long_explicacion_prom = sum(q['long_explicacion'] for q in stats['calidad_promedio']) / len(stats['calidad_promedio'])

        print(f"\n📏 LONGITUDES PROMEDIO:")
        print(f"  Pregunta: {long_pregunta_prom:.0f} caracteres")
        print(f"  Explicación: {long_explicacion_prom:.0f} caracteres")

    return stats


def main():
    """Función principal"""

    print("\n" + "="*70)
    print("  VALIDADOR DE QUIZZES EDUCATIVOS")
    print("  Colección Nuevo Ser")
    print("="*70)

    resultados_globales = {
        "total_capitulos": 0,
        "total_preguntas": 0,
        "total_errores": 0
    }

    for libro_id in LIBROS.keys():
        stats = validar_quiz_libro(libro_id)

        if stats:
            resultados_globales['total_capitulos'] += stats['total_capitulos']
            resultados_globales['total_preguntas'] += stats['total_preguntas']
            resultados_globales['total_errores'] += len(stats['errores_estructura'])

    # Resumen global
    print("\n" + "="*70)
    print("  RESUMEN GLOBAL")
    print("="*70)
    print(f"  📚 Libros validados: {len(LIBROS)}")
    print(f"  📖 Capítulos totales: {resultados_globales['total_capitulos']}")
    print(f"  ❓ Preguntas totales: {resultados_globales['total_preguntas']}")
    print(f"  ⚠️  Errores encontrados: {resultados_globales['total_errores']}")

    if resultados_globales['total_errores'] == 0:
        print(f"\n  ✅ ¡Todos los quizzes tienen estructura correcta!")
    else:
        print(f"\n  ⚠️  Revisa los errores arriba para mejorar calidad")

    print("\n" + "="*70)


if __name__ == "__main__":
    main()
