#!/usr/bin/env python3
"""
Rellenador de Quizzes con Contenido Real

Este script lee el contenido de los capítulos y genera preguntas
educativas de calidad basadas en el contenido real.
"""

import json
import re
from pathlib import Path

BASE_PATH = Path("/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/books")

def cargar_libro(libro_id):
    """Carga el archivo book.json de un libro"""
    libro_path = BASE_PATH / libro_id / "book.json"
    with open(libro_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def cargar_quiz(libro_id):
    """Carga el archivo de quiz existente"""
    quiz_path = BASE_PATH / libro_id / "assets" / "quizzes.json"
    with open(quiz_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def guardar_quiz(libro_id, quiz_data):
    """Guarda el archivo de quiz"""
    quiz_path = BASE_PATH / libro_id / "assets" / "quizzes.json"
    with open(quiz_path, 'w', encoding='utf-8') as f:
        json.dump(quiz_data, f, ensure_ascii=False, indent=2)

def extraer_citas_relevantes(contenido, max_citas=5):
    """Extrae las frases más significativas del contenido"""
    # Buscar oraciones que parezcan conceptualmente importantes
    # (contienen palabras clave, son afirmaciones, tienen comillas, etc.)
    oraciones = re.split(r'[.!?]\s+', contenido)

    citas = []
    palabras_clave = [
        'es', 'son', 'significa', 'implica', 'requiere', 'necesita',
        'debe', 'puede', 'permite', 'fundamental', 'esencial', 'clave',
        'importante', 'central', 'crucial', 'básico', 'principio'
    ]

    for oracion in oraciones:
        if len(oracion) > 50 and len(oracion) < 300:
            for palabra in palabras_clave:
                if palabra in oracion.lower():
                    citas.append(oracion.strip() + '.')
                    break

        if len(citas) >= max_citas:
            break

    return citas

def generar_preguntas_tierra_que_despierta(capitulo_id, capitulo_data, contenido):
    """Genera preguntas específicas para La Tierra que Despierta"""

    preguntas = []

    # Ejemplos de preguntas de alta calidad según el capítulo
    if capitulo_id == "cap1":  # La Gran Separación
        preguntas = [
            {
                "id": "q1",
                "question": "¿Qué cambio fundamental introdujo la revolución científica del siglo XVII en nuestra relación con la naturaleza?",
                "type": "multiple",
                "options": [
                    "Nos permitió medir la naturaleza con mayor precisión que nunca antes",
                    "Transformó el cosmos de organismo vivo a máquina muerta, de sujeto a objeto",
                    "Demostró que los humanos somos superiores al resto de los seres vivos",
                    "Creó las primeras herramientas para estudiar científicamente los ecosistemas"
                ],
                "correct": 1,
                "explanation": "La revolución científica no solo mejoró la medición, sino que cambió radicalmente qué consideramos como real y cómo nos relacionamos con el mundo. El cosmos dejó de ser percibido como sujeto vivo con el que podíamos relacionarnos, para convertirse en objeto mecánico que solo podemos usar.",
                "bookQuote": "Lo que se perdió fue la percepción del mundo como sujeto. Cuando el cosmos se convirtió en objeto —materia inerte gobernada por leyes ciegas—, perdimos la posibilidad de relacionarnos con él como quien se relaciona con un tú.",
                "tags": ["historia", "filosofía", "cambio-paradigma"],
                "difficulty": "intermedio"
            },
            {
                "id": "q2",
                "question": "¿Qué significa el concepto de 'dualismo cartesiano' y cuáles son sus consecuencias ecológicas?",
                "type": "multiple",
                "options": [
                    "La separación entre razón y emoción, que nos impide sentir la crisis ecológica",
                    "La división entre res cogitans (mente) y res extensa (materia), que separó humano de naturaleza",
                    "La distinción entre ciencia y religión que surgió en el siglo XVII",
                    "La diferencia entre conocimiento teórico y práctico en la filosofía moderna"
                ],
                "correct": 1,
                "explanation": "El dualismo cartesiano estableció una división radical entre mente (exclusivamente humana) y materia (todo lo demás). Esta separación se filtró en el lenguaje, la economía, la política y nuestra psique, permitiendo tratar a la naturaleza como 'externalidad' que no necesita contabilizarse.",
                "bookQuote": "El dualismo cartesiano —mente separada de materia, humano separado de naturaleza— no se quedó en los libros de filosofía. Se filtró en cada rincón de la cultura occidental.",
                "tags": ["filosofía", "separación", "dualismo"],
                "difficulty": "avanzado"
            },
            {
                "id": "q3",
                "question": "¿Cómo vivían la relación con la naturaleza las culturas premodernas, según el capítulo?",
                "type": "multiple",
                "options": [
                    "No tenían conocimiento científico, por lo que idealizaban la naturaleza",
                    "Percibían el cosmos como vivo, privilegiando la relación sobre la medición",
                    "Vivían con miedo constante a los desastres naturales",
                    "Explotaban la naturaleza sin conciencia ecológica"
                ],
                "correct": 1,
                "explanation": "Las culturas premodernas no eran ignorantes, sino que tenían una epistemología diferente: privilegiaban la relación sobre la medición, la participación sobre la observación distante. El chamán que hablaba con el espíritu del río sabía cosas sobre ese río que ningún hidrólogo moderno sabe.",
                "bookQuote": "Esto no era ignorancia. Era una forma diferente de conocer, una epistemología que privilegiaba la relación sobre la medición, la participación sobre la observación distante.",
                "tags": ["sabiduría-ancestral", "epistemología", "cosmovisión"],
                "difficulty": "intermedio"
            },
            {
                "id": "q4",
                "question": "¿Qué es el 'síndrome de la línea de base cambiante' mencionado en el capítulo?",
                "type": "multiple",
                "options": [
                    "Un trastorno psicológico causado por el cambio climático",
                    "La tendencia de cada generación a aceptar como normal un mundo más empobrecido",
                    "El proceso de adaptación de los ecosistemas al cambio ambiental",
                    "La variación en los estándares científicos de medición ecológica"
                ],
                "correct": 1,
                "explanation": "El empobrecimiento ecológico es tan gradual que cada generación toma como normal lo que es ya una pérdida. Los niños crecen pensando que un mundo empobrecido es normal porque no conocen otro, creando una amnesia colectiva sobre lo que se ha perdido.",
                "bookQuote": "El empobrecimiento es tan gradual que cada generación toma como normal lo que es ya una pérdida. Lo llaman 'síndrome de la línea de base cambiante'. Yo lo llamo amnesia colectiva.",
                "tags": ["psicología", "percepción", "pérdida"],
                "difficulty": "básico"
            },
            {
                "id": "q5",
                "question": "¿Qué relación establece el capítulo entre colonización y separación ecológica?",
                "type": "multiple",
                "options": [
                    "Los colonizadores destruyeron la naturaleza en los territorios conquistados",
                    "La colonización impuso por la fuerza la cosmovisión de separación sobre pueblos con otras formas de relacionarse con la tierra",
                    "Los pueblos colonizados adoptaron voluntariamente el modelo occidental por ser más eficiente",
                    "No hay relación directa entre colonización y crisis ecológica"
                ],
                "correct": 1,
                "explanation": "La Gran Separación no fue solo un cambio de ideas, sino un cambio impuesto por la fuerza. Los pueblos que vivían en relación recíproca con la tierra fueron declarados 'primitivos', sus saberes descartados como superstición. Donde veían parientes, los colonizadores vieron recursos.",
                "bookQuote": "Cuando los colonizadores llegaron a América, África, Asia, Oceanía, no solo trajeron armas y enfermedades. Trajeron una forma de ver el mundo que negaba la validez de cualquier otra.",
                "tags": ["colonización", "saberes-ancestrales", "imposición-cultural"],
                "difficulty": "intermedio"
            }
        ]

    elif capitulo_id == "cap2":  # El Costo del Olvido
        preguntas = [
            {
                "id": "q1",
                "question": "¿Qué significa que estemos viviendo la 'sexta extinción masiva' y en qué se diferencia de las anteriores?",
                "type": "multiple",
                "options": [
                    "Es causada por un asteroide que impactará la Tierra próximamente",
                    "Es la única extinción masiva causada por una sola especie: los humanos",
                    "Afecta solo a especies exóticas en lugares remotos del planeta",
                    "Es un proceso natural del planeta que ocurre cada millón de años"
                ],
                "correct": 1,
                "explanation": "Las cinco extinciones anteriores fueron causadas por eventos cataclísmicos naturales. La actual es radicalmente diferente: la está causando una sola especie a través de sus acciones. La tasa actual de extinción es entre cien y mil veces mayor que la tasa natural.",
                "bookQuote": "Las cinco extinciones anteriores fueron eventos cataclísmicos: impactos de asteroides, erupciones volcánicas masivas, cambios climáticos abruptos. La actual es diferente. La está causando una sola especie. Nosotros.",
                "tags": ["extinción", "biodiversidad", "crisis-ecológica"],
                "difficulty": "básico"
            },
            {
                "id": "q2",
                "question": "¿Qué es la 'solastalgia' según el filósofo Glenn Albrecht?",
                "type": "multiple",
                "options": [
                    "La tristeza por lugares que hemos visitado en el pasado",
                    "El dolor causado por el cambio y degradación del lugar donde vives",
                    "La nostalgia por épocas históricas que nunca vivimos",
                    "El miedo al futuro causado por el cambio climático"
                ],
                "correct": 1,
                "explanation": "La solastalgia es el malestar causado por el cambio en el propio entorno. A diferencia de la nostalgia (dolor por un lugar del que te has ido), es dolor por un lugar que se va mientras tú permaneces. Es estar en casa y sentir que el hogar desaparece.",
                "bookQuote": "A diferencia de la nostalgia, que es dolor por un lugar del que te has ido, la solastalgia es dolor por un lugar que se va mientras tú permaneces. Es estar en casa y sentir que el hogar desaparece.",
                "tags": ["emociones", "lugar", "cambio-ambiental"],
                "difficulty": "intermedio"
            },
            {
                "id": "q3",
                "question": "¿Por qué el capítulo critica términos como 'medio ambiente' y 'recursos naturales'?",
                "type": "multiple",
                "options": [
                    "Son términos científicamente incorrectos",
                    "Perpetúan la separación al cosificar la naturaleza como algo externo o útil para nosotros",
                    "Son demasiado técnicos para el público general",
                    "Fueron inventados por corporaciones extractivistas"
                ],
                "correct": 1,
                "explanation": "'Medio ambiente' implica que hay un 'yo' y un 'medio' que lo rodea, cuando en realidad somos el ambiente. 'Recursos naturales' implica que la naturaleza existe para nuestro uso. El lenguaje cosifica antes de que la explotación comience.",
                "bookQuote": "Consideremos 'medio ambiente'. La expresión misma implica separación: hay un 'yo' o un 'nosotros', y luego está el 'medio' que nos 'rodea'. Pero no estamos rodeados por el medio ambiente. Somos el medio ambiente.",
                "tags": ["lenguaje", "separación", "percepción"],
                "difficulty": "avanzado"
            },
            {
                "id": "q4",
                "question": "¿Qué nos enseña el cambio climático sobre nuestra relación con la Tierra, según el capítulo?",
                "type": "multiple",
                "options": [
                    "Que la naturaleza es vengativa y nos castiga por nuestros errores",
                    "Que no hay 'fuera': la atmósfera que calentamos es la misma que respiramos",
                    "Que necesitamos más tecnología para controlar el clima",
                    "Que los científicos exageran la gravedad de la situación"
                ],
                "correct": 1,
                "explanation": "El cambio climático no es castigo sino retroalimentación. Es el sistema Tierra respondiendo a nuestras acciones según las leyes que siempre la gobernaron. Descubrimos que no hay 'fuera': lo que tratábamos como vertedero gratuito era parte del sistema que nos sostiene.",
                "bookQuote": "Ahora descubrimos que no hay 'fuera'. Que la atmósfera que calentamos es la misma que respiramos. Que los océanos que acidificamos son los mismos que regulan el clima y producen la mitad del oxígeno.",
                "tags": ["cambio-climático", "sistemas", "retroalimentación"],
                "difficulty": "intermedio"
            }
        ]

    elif capitulo_id == "cap4":  # Ecología Profunda
        preguntas = [
            {
                "id": "q1",
                "question": "¿En qué se diferencia la 'ecología profunda' de la 'ecología superficial' según Arne Naess?",
                "type": "multiple",
                "options": [
                    "La ecología profunda estudia los océanos mientras la superficial estudia la tierra",
                    "La profunda cuestiona nuestro lugar en la naturaleza; la superficial solo gestiona recursos",
                    "La profunda es más científica y rigurosa que la superficial",
                    "La profunda se enfoca en soluciones tecnológicas avanzadas"
                ],
                "correct": 1,
                "explanation": "La ecología superficial busca controlar y gestionar la contaminación manteniendo el modelo de desarrollo. La ecología profunda cuestiona radicalmente nuestro lugar en la naturaleza y plantea que el problema no es técnico sino filosófico: cómo nos vemos en relación con el resto de la vida.",
                "bookQuote": "[Buscar cita específica del capítulo sobre ecología profunda vs superficial]",
                "tags": ["ecología-profunda", "paradigmas", "filosofía-ambiental"],
                "difficulty": "intermedio"
            }
        ]

    # Si no hay preguntas específicas, devolver plantilla
    if not preguntas:
        preguntas = capitulo_data["questions"]

    return preguntas

def poblar_quizzes_tierra():
    """Puebla el quiz de La Tierra que Despierta con preguntas reales"""

    print("\nPoblando quiz: La Tierra que Despierta")
    print("="*60)

    # Cargar datos
    book_data = cargar_libro("tierra-que-despierta")
    quiz_data = cargar_quiz("tierra-que-despierta")

    # Extraer capítulos del libro
    capitulos_libro = {}
    for seccion in book_data["sections"]:
        for cap in seccion["chapters"]:
            capitulos_libro[cap["id"]] = cap

    # Poblar preguntas
    capitulos_poblados = 0
    for cap_id, cap_quiz in quiz_data["chapters"].items():
        if cap_id in capitulos_libro:
            contenido = capitulos_libro[cap_id].get("content", "")

            # Generar preguntas basadas en contenido
            nuevas_preguntas = generar_preguntas_tierra_que_despierta(
                cap_id,
                cap_quiz,
                contenido
            )

            # Actualizar solo si se generaron preguntas reales
            if nuevas_preguntas != cap_quiz["questions"]:
                quiz_data["chapters"][cap_id]["questions"] = nuevas_preguntas
                capitulos_poblados += 1
                print(f"✓ {cap_id}: {cap_quiz['chapterTitle']} - {len(nuevas_preguntas)} preguntas")

    # Guardar
    guardar_quiz("tierra-que-despierta", quiz_data)
    print(f"\nCapítulos poblados: {capitulos_poblados}/{len(quiz_data['chapters'])}")

def main():
    """Función principal"""
    print("\n" + "="*60)
    print("POBLADOR DE QUIZZES CON CONTENIDO REAL")
    print("="*60)

    poblar_quizzes_tierra()

    print("\n" + "="*60)
    print("NOTA IMPORTANTE:")
    print("="*60)
    print("""
Este script ha poblado algunos capítulos con preguntas de ejemplo
de alta calidad. Para poblar TODOS los capítulos con preguntas
relevantes, se necesita:

1. Leer cada capítulo en detalle
2. Identificar 4-6 conceptos clave por capítulo
3. Extraer citas textuales precisas
4. Diseñar opciones incorrectas plausibles
5. Escribir explicaciones educativas

Esto requiere análisis humano profundo del contenido.
El proceso actual ha creado ejemplos que sirven como modelo.
    """)

if __name__ == "__main__":
    main()
