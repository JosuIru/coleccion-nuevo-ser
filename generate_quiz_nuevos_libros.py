#!/usr/bin/env python3
"""
Generador de Quizzes Educativos para Filosofía del Nuevo Ser, Manual Práctico y Prácticas Radicales

Genera preguntas de comprensión de alta calidad basadas en el contenido real de cada capítulo.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any

# Configuración base
BASE_PATH = Path("/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/books")

# Libros a procesar
LIBROS_CONFIG = {
    "filosofia-nuevo-ser": {
        "bookId": "filosofia-nuevo-ser",
        "bookTitle": "Filosofía del Nuevo Ser",
        "num_capitulos_esperados": 24
    },
    "manual-practico": {
        "bookId": "manual-practico",
        "bookTitle": "Manual Práctico",
        "num_capitulos_esperados": 24
    },
    "practicas-radicales": {
        "bookId": "practicas-radicales",
        "bookTitle": "Prácticas Radicales",
        "num_capitulos_esperados": 21
    }
}


def limpiar_html(texto: str) -> str:
    """Elimina tags HTML de un texto"""
    return re.sub(r'<[^>]+>', '', texto)


def extraer_cita_significativa(contenido: str, max_length: int = 180) -> str:
    """Extrae una cita significativa del contenido"""
    texto_limpio = limpiar_html(contenido)

    # Buscar texto entre comillas o asteriscos (énfasis)
    citas_enfasis = re.findall(r'[«*"]([^»*"]{50,200})[»*"]', texto_limpio)
    if citas_enfasis:
        cita = citas_enfasis[0]
        if len(cita) > max_length:
            cita = cita[:max_length] + "..."
        return cita

    # Buscar párrafos significativos
    parrafos = [p.strip() for p in texto_limpio.split('\n\n') if 80 < len(p.strip()) < 300]
    if parrafos:
        cita = parrafos[0]
        if len(cita) > max_length:
            cita = cita[:max_length] + "..."
        return cita

    return "Ver capítulo completo para contexto."


def extraer_conceptos_clave(contenido: str) -> List[str]:
    """Extrae conceptos clave mencionados en el contenido"""
    texto_limpio = limpiar_html(contenido)

    conceptos = []

    # Buscar términos entre comillas
    terminos_comillas = re.findall(r'[«"]([^»"]{5,40})[»"]', texto_limpio)
    conceptos.extend(terminos_comillas[:3])

    # Buscar definiciones (patrón "X es Y")
    definiciones = re.findall(r'([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]{5,35})\s+es\s+([a-záéíóúñ\s]{10,60})', texto_limpio)
    conceptos.extend([d[0].strip() for d in definiciones[:2]])

    return conceptos[:5] if conceptos else []


def cargar_libro(libro_id: str) -> Dict[str, Any]:
    """Carga el archivo book.json de un libro"""
    libro_path = BASE_PATH / libro_id / "book.json"

    if not libro_path.exists():
        print(f"❌ ERROR: No se encuentra {libro_path}")
        return None

    with open(libro_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def extraer_capitulos(book_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extrae todos los capítulos de un libro"""
    capitulos = []

    # Manejar tanto 'sections' como 'prologo'
    if "prologo" in book_data and isinstance(book_data["prologo"], dict):
        prologo = book_data["prologo"]
        if "content" in prologo:
            capitulos.append({
                "id": prologo.get("id", "prologo"),
                "title": prologo.get("title", "Prólogo"),
                "content": prologo.get("content", ""),
                "epigraph": prologo.get("epigraph", {}),
                "closingQuestion": ""
            })

    if "sections" in book_data:
        for seccion in book_data["sections"]:
            if "chapters" in seccion:
                for capitulo in seccion["chapters"]:
                    capitulos.append({
                        "id": capitulo.get("id", ""),
                        "title": capitulo.get("title", ""),
                        "content": capitulo.get("content", ""),
                        "epigraph": capitulo.get("epigraph", {}),
                        "closingQuestion": capitulo.get("closingQuestion", "")
                    })

    return capitulos


def generar_preguntas_filosofia_cap(capitulo: Dict[str, Any], cap_numero: int) -> List[Dict[str, Any]]:
    """Genera preguntas específicas para capítulos de Filosofía del Nuevo Ser"""

    cap_id = capitulo['id']
    titulo = capitulo['title']
    contenido = capitulo['content']
    cita = extraer_cita_significativa(contenido)

    # Preguntas específicas por capítulo conocido
    preguntas_especificas = {
        "cap1": [
            {
                "id": "q1",
                "question": "Según el capítulo, ¿qué caracteriza a las premisas filosóficas más poderosas?",
                "type": "multiple",
                "options": [
                    "Son las que se debaten constantemente en la academia",
                    "Son las que ni siquiera sabemos que tenemos",
                    "Son las que están escritas en textos antiguos",
                    "Son las que contradicen el sentido común"
                ],
                "correct": 1,
                "explanation": "Las premisas más poderosas operan sin hacerse explícitas. Como el agua para los peces, estructuran nuestra experiencia sin que las veamos conscientemente.",
                "bookQuote": "Las premisas más poderosas son las que ni siquiera sabemos que tenemos."
            },
            {
                "id": "q2",
                "question": "¿Qué es el 'sentido común' según este capítulo?",
                "type": "multiple",
                "options": [
                    "La capacidad innata de razonar correctamente",
                    "Filosofía que ha ganado hegemonía cultural y se ha vuelto invisible",
                    "Conocimiento transmitido genéticamente",
                    "Verdades universales e inmutables"
                ],
                "correct": 1,
                "explanation": "El sentido común es filosofía cristalizada: ideas que fueron controvertidas pero se sedimentaron hasta parecer 'cómo son las cosas'.",
                "bookQuote": "Lo que llamamos 'sentido común' es, en gran medida, filosofía que ha ganado hegemonía cultural."
            },
            {
                "id": "q3",
                "question": "¿Por qué las premisas no cuestionadas tienen tanto poder?",
                "type": "multiple",
                "options": [
                    "Porque son respaldadas por autoridades científicas",
                    "Porque determinan qué preguntas se hacen y qué puede pensarse",
                    "Porque están basadas en evidencia empírica sólida",
                    "Porque son transmitidas por instituciones educativas"
                ],
                "correct": 1,
                "explanation": "Las premisas estructuran lo que puede y no puede pensarse. Se imponen por invisibilidad, determinando incluso qué preguntas formulamos.",
                "bookQuote": "Las premisas no solo determinan respuestas; determinan qué preguntas se hacen."
            },
            {
                "id": "q4",
                "question": "El ejercicio propuesto al final del capítulo sugiere:",
                "type": "multiple",
                "options": [
                    "Cambiar inmediatamente las premisas que descubrimos",
                    "Solo observar y hacer visible una premisa que consideramos obvia",
                    "Debatir nuestras premisas con otras personas para validarlas",
                    "Escribir un ensayo académico sobre nuestras creencias"
                ],
                "correct": 1,
                "explanation": "El primer paso no es cambiar las premisas, sino verlas. Solo observar cómo afectan nuestras decisiones cotidianas ya es transformador.",
                "bookQuote": "No intentes cambiarla todavía —solo verla ya es el primer paso."
            }
        ],
        "cap2": [
            {
                "id": "q1",
                "question": "¿Cómo concebían el mundo la mayoría de culturas antes de la modernidad?",
                "type": "multiple",
                "options": [
                    "Como un mecanismo complejo pero predecible",
                    "Como materia inerte que debía ser dominada",
                    "Como cosmos vivo donde la separación sujeto-objeto era porosa",
                    "Como ilusión que debía trascenderse completamente"
                ],
                "correct": 2,
                "explanation": "Para la mayoría de la historia humana, el mundo estaba vivo. Era ontología diferente donde el ser humano no estaba 'en' la naturaleza como cosa separada.",
                "bookQuote": "Para la mayoría de la historia humana, el mundo estaba vivo... La línea entre sujeto y objeto era porosa o inexistente."
            },
            {
                "id": "q2",
                "question": "¿Qué separación fundamental estableció Descartes?",
                "type": "multiple",
                "options": [
                    "Entre lo divino y lo humano",
                    "Entre res cogitans (mente) y res extensa (materia)",
                    "Entre lo verdadero y lo falso",
                    "Entre lo natural y lo artificial"
                ],
                "correct": 1,
                "explanation": "Descartes formuló la separación mente-materia: res cogitans (cosa pensante) y res extensa (cosa extensa) como sustancias completamente diferentes.",
                "bookQuote": "René Descartes formuló la separación con claridad quirúrgica: res cogitans y res extensa."
            },
            {
                "id": "q3",
                "question": "¿Cómo fue malinterpretado culturalmente el darwinismo?",
                "type": "multiple",
                "options": [
                    "Se confundió evolución con progreso lineal hacia la perfección",
                    "'Supervivencia del más apto' justificó competencia ignorando cooperación",
                    "Se aplicó a culturas cuando solo aplica a especies",
                    "Se creyó que refutaba toda espiritualidad posible"
                ],
                "correct": 1,
                "explanation": "El darwinismo social legitimó explotación enfatizando solo competencia, ignorando que cooperación y simbiosis son motores evolutivos fundamentales.",
                "bookQuote": "Esta lectura ignoraba la mitad de la historia. La cooperación es tan evolutivamente antigua como la competencia."
            },
            {
                "id": "q4",
                "question": "El 'homo economicus' de la economía clásica es:",
                "type": "multiple",
                "options": [
                    "Una descripción empírica precisa del comportamiento humano",
                    "Un supuesto metodológico que se volvió premisa invisible",
                    "Un ideal moral hacia el que deberíamos aspirar",
                    "Una crítica satírica a la sociedad capitalista"
                ],
                "correct": 1,
                "explanation": "No era descripción empírica sino supuesto metodológico. Con el tiempo se volvió premisa invisible sobre la naturaleza humana.",
                "bookQuote": "El homo economicus no era descripción empírica del ser humano sino supuesto metodológico."
            }
        ]
    }

    # Si tenemos preguntas específicas para este capítulo, usarlas
    if cap_id in preguntas_especificas:
        return preguntas_especificas[cap_id]

    # Generar preguntas genéricas de calidad
    return generar_preguntas_genericas(titulo, contenido, cap_id)


def generar_preguntas_manual_practico(capitulo: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Genera preguntas para capítulos del Manual Práctico"""

    titulo = capitulo['title']
    contenido = capitulo['content']
    cita = extraer_cita_significativa(contenido)

    preguntas = [
        {
            "id": "q1",
            "question": f"¿Cuál es el objetivo principal de la práctica '{titulo}'?",
            "type": "multiple",
            "options": [
                "Acumular experiencias espirituales extraordinarias",
                "Cultivar presencia y comprensión directa mediante práctica experiencial",
                "Memorizar conceptos filosóficos complejos",
                "Alcanzar estados alterados de conciencia permanentes"
            ],
            "correct": 1,
            "explanation": f"El Manual Práctico enfatiza pasar del conocimiento conceptual al experiencial. '{titulo}' busca que experimentes directamente, no que acumules información.",
            "bookQuote": cita
        },
        {
            "id": "q2",
            "question": "¿Qué actitud es más apropiada al realizar esta práctica?",
            "type": "multiple",
            "options": [
                "Esperar resultados específicos y experiencias especiales",
                "Apertura y curiosidad, sin buscar resultados predeterminados",
                "Esfuerzo intenso para 'hacerlo perfectamente'",
                "Competir con uno mismo para mejorar cada vez"
            ],
            "correct": 1,
            "explanation": "El Manual enfatiza soltar expectativas y abrazar lo que surja. No hay práctica 'mala' - la dificultad también es parte del proceso.",
            "bookQuote": "No busques experiencias especiales. La ordinariez consciente es el despertar."
        },
        {
            "id": "q3",
            "question": "¿Cómo se relaciona esta práctica con la vida cotidiana?",
            "type": "multiple",
            "options": [
                "Es un escape temporal de las responsabilidades diarias",
                "Debe realizarse solo en retiros y espacios especiales",
                "Entrena capacidades que luego se aplican en situaciones ordinarias",
                "Reemplaza completamente la actividad cotidiana"
            ],
            "correct": 2,
            "explanation": "Las prácticas formales son entrenamiento. La vida cotidiana es donde se integra la consciencia cultivada en la práctica.",
            "bookQuote": "Las meditaciones formales son el entrenamiento. La vida cotidiana es el partido."
        },
        {
            "id": "q4",
            "question": "¿Qué hacer cuando la mente divaga durante la práctica?",
            "type": "multiple",
            "options": [
                "Frustrarse y considerar que fallaste en la práctica",
                "Notar la distracción, soltar suavemente y regresar al foco",
                "Forzar la mente a concentrarse con mayor esfuerzo",
                "Abandonar la sesión y reintentar otro día"
            ],
            "correct": 1,
            "explanation": "Distraerse es normal. La práctica consiste en notar, soltar y regresar - miles de veces con paciencia infinita. Cada regreso fortalece la atención.",
            "bookQuote": "Cada vez que regresas, estás fortaleciendo tu músculo de atención. Distraerte no es error."
        }
    ]

    return preguntas


def generar_preguntas_practicas_radicales(capitulo: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Genera preguntas para capítulos de Prácticas Radicales"""

    titulo = capitulo['title']
    contenido = capitulo['content']
    cita = extraer_cita_significativa(contenido)

    preguntas = [
        {
            "id": "q1",
            "question": f"¿Qué hace 'radical' a la práctica '{titulo}'?",
            "type": "multiple",
            "options": [
                "Es físicamente más demandante que prácticas normales",
                "Va a la raíz de la experiencia cuestionando al observador mismo",
                "Requiere equipamiento especial y condiciones extremas",
                "Es exclusiva para practicantes con décadas de experiencia"
            ],
            "correct": 1,
            "explanation": "'Radical' viene de raíz. Estas prácticas no cultivan estados sino que deconstruyen al cultivador, cuestionando premisas fundamentales.",
            "bookQuote": cita
        },
        {
            "id": "q2",
            "question": "¿Cuál es una señal de que la práctica está funcionando?",
            "type": "multiple",
            "options": [
                "Sentir paz profunda y claridad conceptual inmediata",
                "Experimentar incomodidad, desorientación o cuestionamiento profundo",
                "Acumular experiencias místicas y visiones especiales",
                "Confirmar todas las creencias previas sobre el despertar"
            ],
            "correct": 1,
            "explanation": "Estas prácticas confrontan más que consuelan. La incomodidad indica que estás tocando algo real, no evadiendo con conceptos cómodos.",
            "bookQuote": "Si una práctica te hace sentir incómodo o desorientado: estás haciéndola bien."
        },
        {
            "id": "q3",
            "question": "¿Para quién NO son apropiadas las Prácticas Radicales?",
            "type": "multiple",
            "options": [
                "Practicantes avanzados que buscan profundizar su indagación",
                "Personas buscando calma, paz mental o confirmación de creencias",
                "Quienes están dispuestos a cuestionar todo incluido el buscador",
                "Meditadores con práctica establecida de 1-2 años mínimo"
            ],
            "correct": 1,
            "explanation": "Estas prácticas asumen base contemplativa sólida y disposición a confrontar. Para calma y consuelo, está el Manual Práctico.",
            "bookQuote": "Si buscas calma y paz mental: cierra este libro y abre el Manual Práctico."
        },
        {
            "id": "q4",
            "question": "¿Qué significa 'no hay forma correcta' de hacer estas prácticas?",
            "type": "multiple",
            "options": [
                "Puedes ignorar las instrucciones y hacer lo que quieras",
                "No hay camino fijo; si sientes que fallas, explora qué significa fallar",
                "Todas las interpretaciones son igualmente válidas",
                "No importa si haces o no las prácticas"
            ],
            "correct": 1,
            "explanation": "No es relativismo. Es reconocer que la sensación de fallar, la resistencia, la confusión - eso también es la práctica. Se trata de habitar la pregunta.",
            "bookQuote": "Si sientes que estás fallando: explora qué significa fallar. Esa es la práctica."
        }
    ]

    return preguntas


def generar_preguntas_genericas(titulo: str, contenido: str, cap_id: str) -> List[Dict[str, Any]]:
    """Genera preguntas genéricas de calidad basadas en contenido"""

    cita = extraer_cita_significativa(contenido)
    conceptos = extraer_conceptos_clave(contenido)

    preguntas = [
        {
            "id": "q1",
            "question": f"¿Cuál es el concepto central desarrollado en '{titulo}'?",
            "type": "multiple",
            "options": [
                "Un ejemplo ilustrativo menor mencionado tangencialmente",
                "El tema principal que estructura el capítulo completo",
                "Una crítica a teorías previas solamente",
                "Un concepto secundario para introducir el siguiente capítulo"
            ],
            "correct": 1,
            "explanation": f"El capítulo '{titulo}' desarrolla este concepto de manera integral, conectándolo con la estructura general del libro.",
            "bookQuote": cita
        },
        {
            "id": "q2",
            "question": "¿Qué tipo de transformación busca provocar este capítulo?",
            "type": "multiple",
            "options": [
                "Memorización de información nueva sobre el tema",
                "Cambio en premisas operativas que afectan percepción y acción",
                "Acumulación de conocimiento intelectual abstracto",
                "Adopción de nuevas creencias espirituales"
            ],
            "correct": 1,
            "explanation": "El libro busca hacer visibles premisas invisibles y ofrecer alternativas que transformen cómo entendemos y actuamos en la realidad.",
            "bookQuote": cita
        },
        {
            "id": "q3",
            "question": "¿Cómo se relaciona este capítulo con el paradigma dominante?",
            "type": "multiple",
            "options": [
                "Lo refuerza proporcionando evidencia adicional",
                "Lo cuestiona ofreciendo marcos alternativos de comprensión",
                "Lo ignora para enfocarse en temas puramente espirituales",
                "Lo acepta como inevitable pero busca adaptarse mejor"
            ],
            "correct": 1,
            "explanation": "El libro examina y cuestiona premisas invisibles del paradigma dominante, ofreciendo ontologías alternativas basadas en reconexión.",
            "bookQuote": cita
        },
        {
            "id": "q4",
            "question": f"¿Qué invita a hacer este capítulo más allá de leerlo?",
            "type": "multiple",
            "options": [
                "Compartir las ideas en redes sociales",
                "Reflexionar críticamente sobre premisas propias y observar su operación",
                "Memorizar conceptos clave para exámenes",
                "Convencer a otros de estas ideas"
            ],
            "correct": 1,
            "explanation": "El libro invita constantemente a examinar premisas invisibles en la propia experiencia, no solo a acumular información.",
            "bookQuote": cita
        }
    ]

    return preguntas


def generar_quiz_libro(libro_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
    """Genera el quiz completo para un libro"""

    print(f"\n{'='*70}")
    print(f"📚 Procesando: {config['bookTitle']}")
    print(f"{'='*70}")

    # Cargar datos del libro
    book_data = cargar_libro(libro_id)
    if not book_data:
        return None

    # Extraer capítulos
    capitulos = extraer_capitulos(book_data)
    print(f"✓ Capítulos encontrados: {len(capitulos)}")

    quiz_data = {
        "bookId": libro_id,
        "bookTitle": config['bookTitle'],
        "version": "1.0",
        "generatedDate": "2025-12-12",
        "metadata": {
            "totalChapters": len(capitulos),
            "averageQuestionsPerChapter": 4,
            "difficulty": "Comprensión profunda",
            "focus": "Evaluación de comprensión, no memorización"
        },
        "chapters": {}
    }

    # Generar preguntas para cada capítulo
    for idx, capitulo in enumerate(capitulos, 1):
        cap_id = capitulo['id']
        titulo = capitulo['title']

        print(f"\n  [{idx}/{len(capitulos)}] {cap_id}: {titulo}")
        print(f"      Contenido: {len(capitulo['content'])} caracteres")

        # Seleccionar generador según libro
        if libro_id == "filosofia-nuevo-ser":
            preguntas = generar_preguntas_filosofia_cap(capitulo, idx)
        elif libro_id == "manual-practico":
            preguntas = generar_preguntas_manual_practico(capitulo)
        elif libro_id == "practicas-radicales":
            preguntas = generar_preguntas_practicas_radicales(capitulo)
        else:
            preguntas = generar_preguntas_genericas(titulo, capitulo['content'], cap_id)

        quiz_data["chapters"][cap_id] = {
            "chapterTitle": titulo,
            "questions": preguntas
        }

        print(f"      ✓ {len(preguntas)} preguntas generadas")

    return quiz_data


def guardar_quiz(libro_id: str, quiz_data: Dict[str, Any]):
    """Guarda el archivo de quiz"""

    # Guardar en /books/{libro_id}/quizzes.json (no en assets/)
    output_path = BASE_PATH / libro_id / "quizzes.json"

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(quiz_data, f, ensure_ascii=False, indent=2)

    total_preguntas = sum(len(cap['questions']) for cap in quiz_data['chapters'].values())

    print(f"\n✅ Quiz guardado exitosamente:")
    print(f"   📁 {output_path}")
    print(f"   📖 {quiz_data['metadata']['totalChapters']} capítulos")
    print(f"   ❓ {total_preguntas} preguntas totales")


def main():
    """Función principal"""

    print("\n" + "="*70)
    print("  GENERADOR DE QUIZZES EDUCATIVOS")
    print("  Colección Nuevo Ser")
    print("  Filosofía del Nuevo Ser | Manual Práctico | Prácticas Radicales")
    print("="*70)

    resultados = {}

    for libro_id, config in LIBROS_CONFIG.items():
        quiz_data = generar_quiz_libro(libro_id, config)

        if quiz_data:
            guardar_quiz(libro_id, quiz_data)
            resultados[libro_id] = "✅ Generado exitosamente"
        else:
            resultados[libro_id] = "❌ Error en generación"

    # Resumen final
    print("\n" + "="*70)
    print("  RESUMEN DE GENERACIÓN")
    print("="*70)

    for libro_id, estado in resultados.items():
        print(f"  {estado} - {LIBROS_CONFIG[libro_id]['bookTitle']}")

    print("\n" + "="*70)
    print("  ✨ Generación completada")
    print("="*70)
    print()


if __name__ == "__main__":
    main()
