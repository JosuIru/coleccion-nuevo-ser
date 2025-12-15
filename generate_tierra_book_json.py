#!/usr/bin/env python3
"""
Script para generar book.json para "La Tierra que Despierta"
desde los archivos .txt en books/files/
"""

import json
import re
from pathlib import Path

# Configuración de rutas
archivos_base_directorio = Path("books/files")
salida_directorio = Path("www/books/tierra-que-despierta")
salida_archivo_json = salida_directorio / "book.json"

# Estructura del libro
estructura_libro = {
    "title": "La Tierra que Despierta",
    "subtitle": "Hacia una Conciencia Ecológica Integral",
    "author": "J. Irurtzun",
    "coAuthor": "En diálogo con Claude (Anthropic)",
    "sections": []
}

# Definición de secciones y capítulos
secciones_definicion = [
    {
        "id": "prologo",
        "title": "Prólogo",
        "chapters": [
            {
                "id": "prologo",
                "archivo": "Prologo_La_Tierra_que_Despierta.txt",
                "titulo_esperado": "PRÓLOGO A DOS VOCES"
            }
        ]
    },
    {
        "id": "parte1",
        "title": "PARTE I",
        "subtitle": "El Olvido — Cómo aprendimos a olvidar que somos la Tierra",
        "chapters": [
            {
                "id": "cap1",
                "archivo": "Capitulo_01_La_Gran_Separacion.txt",
                "numero_capitulo": 1
            },
            {
                "id": "cap2",
                "archivo": "Capitulo_02_El_Costo_del_Olvido.txt",
                "numero_capitulo": 2
            },
            {
                "id": "cap3",
                "archivo": "Capitulo_03_La_Anestesia_Moderna.txt",
                "numero_capitulo": 3
            }
        ]
    },
    {
        "id": "parte2",
        "title": "PARTE II",
        "subtitle": "Los Fundamentos — Filosofía para una era ecológica",
        "chapters": [
            {
                "id": "cap4",
                "archivo": "Capitulo_04_Ecologia_Profunda.txt",
                "numero_capitulo": 4
            },
            {
                "id": "cap5",
                "archivo": "Capitulo_05_Gaia.txt",
                "numero_capitulo": 5
            },
            {
                "id": "cap6",
                "archivo": "Capitulo_06_Thomas_Berry.txt",
                "numero_capitulo": 6
            },
            {
                "id": "cap7",
                "archivo": "Capitulo_07_Biomimetica.txt",
                "numero_capitulo": 7
            },
            {
                "id": "cap8",
                "archivo": "Capitulo_08_Pensamiento_Relacional.txt",
                "numero_capitulo": 8
            }
        ]
    },
    {
        "id": "parte3",
        "title": "PARTE III",
        "subtitle": "El Duelo que Transforma — Atravesar la oscuridad hacia la acción",
        "chapters": [
            {
                "id": "cap9",
                "archivo": "Capitulo_09_El_Dolor_del_Mundo.txt",
                "numero_capitulo": 9
            },
            {
                "id": "cap10",
                "archivo": "Capitulo_10_Honrar_lo_que_se_Pierde.txt",
                "numero_capitulo": 10
            },
            {
                "id": "cap11",
                "archivo": "Capitulo_11_La_Esperanza_Activa.txt",
                "numero_capitulo": 11
            },
            {
                "id": "cap12",
                "archivo": "Capitulo_12_Rabia_Sagrada.txt",
                "numero_capitulo": 12
            }
        ]
    },
    {
        "id": "parte4",
        "title": "PARTE IV",
        "subtitle": "Prácticas de Reconexión — Tecnologías de re-enraizamiento",
        "chapters": [
            {
                "id": "cap13",
                "archivo": "Capitulo_13_Presencia_Naturaleza.txt",
                "numero_capitulo": 13
            },
            {
                "id": "cap14",
                "archivo": "Capitulo_14_Trabajo_que_Reconecta.txt",
                "numero_capitulo": 14
            },
            {
                "id": "cap15",
                "archivo": "Capitulo_15_Rituales_Conexion.txt",
                "numero_capitulo": 15
            },
            {
                "id": "cap16",
                "archivo": "Capitulo_16_Diario_Ecologico.txt",
                "numero_capitulo": 16
            },
            {
                "id": "cap17",
                "archivo": "Capitulo_17_Escucha_Profunda.txt",
                "numero_capitulo": 17
            }
        ]
    },
    {
        "id": "parte5",
        "title": "PARTE V",
        "subtitle": "Acción Enraizada — Del despertar interior a la transformación del mundo",
        "chapters": [
            {
                "id": "cap18",
                "archivo": "Capitulo_18_Activismo_Corazon.txt",
                "numero_capitulo": 18
            },
            {
                "id": "cap19",
                "archivo": "Capitulo_19_Permacultura_Social.txt",
                "numero_capitulo": 19
            },
            {
                "id": "cap20",
                "archivo": "Capitulo_20_Comunidades_Practica.txt",
                "numero_capitulo": 20
            },
            {
                "id": "cap21",
                "archivo": "Capitulo_21_Ecologia_Lugar.txt",
                "numero_capitulo": 21
            }
        ]
    },
    {
        "id": "parte6",
        "title": "PARTE VI",
        "subtitle": "Preguntas Abiertas — Lo que no sabemos",
        "chapters": [
            {
                "id": "cap22",
                "archivo": "Capitulo_22_Limites_Reconexion.txt",
                "numero_capitulo": 22
            },
            {
                "id": "cap23",
                "archivo": "Capitulo_23_Sombras_Movimiento.txt",
                "numero_capitulo": 23
            },
            {
                "id": "cap24",
                "archivo": "Capitulo_24_Invitacion.txt",
                "numero_capitulo": 24
            }
        ]
    },
    {
        "id": "epilogo",
        "title": "Epílogo",
        "chapters": [
            {
                "id": "epilogo",
                "archivo": "Epilogo_Carta_a_la_Tierra.txt",
                "titulo_esperado": "Carta a la Tierra"
            }
        ]
    }
]


def extraer_epigrafe(texto):
    """Extrae el epígrafe (cita con autor) del texto."""
    # Buscar patrón de cita: texto entre comillas seguido de — y autor
    patron_epigrafe = r'«([^»]+)»\s*\n\s*[—–]\s*(.+?)(?=\n\n|\n[A-Z]|\n✦)'
    coincidencia = re.search(patron_epigrafe, texto, re.DOTALL)

    if coincidencia:
        texto_cita = coincidencia.group(1).strip()
        autor_cita = coincidencia.group(2).strip()
        return {
            "text": f"«{texto_cita}»",
            "author": autor_cita
        }
    return None


def extraer_titulo_capitulo(texto, numero_capitulo=None):
    """Extrae el título del capítulo."""
    # Buscar "Capítulo N" seguido del título
    if numero_capitulo:
        patron = rf'Capítulo\s+{numero_capitulo}\s*\n\s*(.+?)(?=\n|$)'
        coincidencia = re.search(patron, texto, re.IGNORECASE)
        if coincidencia:
            titulo = coincidencia.group(1).strip()
            # Si el título es un subtítulo descriptivo (no es el título real)
            # buscar en la siguiente línea
            if not titulo or len(titulo) < 3:
                # Buscar la línea siguiente
                lineas_despues = texto[coincidencia.end():].split('\n')
                for linea in lineas_despues[:5]:
                    linea_limpia = linea.strip()
                    if linea_limpia and not linea_limpia.startswith('«') and not linea_limpia.startswith('—'):
                        return linea_limpia
            return titulo

    # Buscar cualquier línea que parezca un título después de "Capítulo"
    patron_generico = r'Capítulo\s+\d+\s*\n\s*(.+?)(?=\n|$)'
    coincidencia = re.search(patron_generico, texto, re.IGNORECASE)
    if coincidencia:
        titulo = coincidencia.group(1).strip()
        if titulo and len(titulo) >= 3:
            return titulo

    # Para prólogo y epílogo, buscar el título directamente
    lineas = texto.split('\n')
    for i, linea in enumerate(lineas[:15]):  # Revisar primeras 15 líneas
        linea_limpia = linea.strip()
        # Saltar líneas con encabezados de PARTE, símbolos, etc.
        if (linea_limpia and
            not linea_limpia.startswith('✦') and
            not linea_limpia.startswith('PARTE') and
            not linea_limpia.startswith('«') and
            not re.match(r'^[—–\s]+$', linea_limpia) and
            len(linea_limpia) > 3):
            # Para prólogo/epílogo, la primera línea significativa es el título
            if 'prologo' in str(numero_capitulo).lower() or 'epilogo' in str(numero_capitulo).lower():
                return linea_limpia

    return "Sin título"


def extraer_contenido(texto):
    """Extrae el contenido principal del capítulo (sin el epígrafe y antes de PRÁCTICA)."""
    # Eliminar el encabezado de PARTE si existe
    texto = re.sub(r'^PARTE [IVX]+.*?\n.*?\n✦.*?\n', '', texto, flags=re.DOTALL)

    # Eliminar el título del capítulo y el epígrafe
    # Buscar donde empieza el contenido real (después del epígrafe o título)
    inicio_contenido = 0

    # Si hay epígrafe, el contenido empieza después
    coincidencia_epigrafe = re.search(r'«[^»]+»\s*\n\s*[—–].+?\n', texto, re.DOTALL)
    if coincidencia_epigrafe:
        inicio_contenido = coincidencia_epigrafe.end()
    else:
        # Si no hay epígrafe, buscar el título del capítulo
        coincidencia_titulo = re.search(r'Capítulo\s+\d+\s*\n.+?\n', texto, re.IGNORECASE)
        if coincidencia_titulo:
            inicio_contenido = coincidencia_titulo.end()

    contenido = texto[inicio_contenido:]

    # Extraer hasta PRÁCTICA o hasta el final
    coincidencia_practica = re.search(r'\n✦\s*\nPRÁCTICA', contenido, re.IGNORECASE)
    if coincidencia_practica:
        contenido = contenido[:coincidencia_practica.start()]

    # Limpiar contenido
    contenido = contenido.strip()

    # Eliminar líneas con solo símbolos ✦
    contenido = re.sub(r'\n\s*✦\s*\n', '\n\n', contenido)

    return contenido


def extraer_pregunta_cierre(texto):
    """Extrae la pregunta de cierre antes de la sección PRÁCTICA."""
    # Buscar "Pregunta para llevar contigo:" seguida de la pregunta
    patron = r'Pregunta para llevar contigo:\s*\n\s*(.+?)(?=\n\n|$)'
    coincidencia = re.search(patron, texto, re.DOTALL)
    if coincidencia:
        return coincidencia.group(1).strip()

    # Buscar preguntas destacadas al final del contenido (antes de PRÁCTICA)
    patron_antes_practica = r'¿[^?]+\?(?=\s*\n\s*✦\s*\n\s*PRÁCTICA)'
    coincidencia = re.search(patron_antes_practica, texto, re.DOTALL)
    if coincidencia:
        return coincidencia.group(0).strip()

    return None


def extraer_ejercicios(texto, id_capitulo):
    """Extrae los ejercicios de la sección PRÁCTICA."""
    ejercicios = []

    # Buscar la sección PRÁCTICA
    patron_practica = r'✦\s*\nPRÁCTICA\s*\n(.+?)(?=\n✦\s*✦\s*✦|$)'
    coincidencia_practica = re.search(patron_practica, texto, re.DOTALL | re.IGNORECASE)

    if not coincidencia_practica:
        return ejercicios

    texto_practica = coincidencia_practica.group(1)

    # Extraer título del ejercicio (primera línea significativa)
    lineas_practica = texto_practica.split('\n')
    titulo_ejercicio = None
    descripcion_ejercicio = ""
    duracion_ejercicio = ""

    for linea in lineas_practica[:10]:
        linea_limpia = linea.strip()
        if linea_limpia and not linea_limpia.startswith('Propósito:') and not linea_limpia.startswith('Tiempo') and not linea_limpia.startswith('Duración'):
            if not titulo_ejercicio:
                titulo_ejercicio = linea_limpia
            break

    # Extraer propósito/descripción
    patron_proposito = r'Propósito:\s*(.+?)(?=\n(?:Tiempo|Duración|Materiales|Preparación|Primera parte|La práctica|Práctica)|\n\n[A-Z])'
    coincidencia_proposito = re.search(patron_proposito, texto_practica, re.DOTALL)
    if coincidencia_proposito:
        descripcion_ejercicio = coincidencia_proposito.group(1).strip()

    # Extraer duración
    patron_duracion = r'(?:Tiempo necesario|Duración|Tiempo diario):\s*(.+?)(?=\n|$)'
    coincidencia_duracion = re.search(patron_duracion, texto_practica)
    if coincidencia_duracion:
        duracion_ejercicio = coincidencia_duracion.group(1).strip()

    # Extraer pasos del ejercicio
    pasos_ejercicio = []

    # Buscar secciones estructuradas (Primera parte, Segunda parte, etc.)
    patron_partes = r'(Primera parte|Segunda parte|Tercera parte|Preparación|La práctica diaria|Práctica|Cómo practicar).*?\n(.+?)(?=\n(?:Primera parte|Segunda parte|Tercera parte|Preparación|Al final|Registro|Cierra con|Pregunta para llevar)|\n✦|$)'
    coincidencias_partes = re.finditer(patron_partes, texto_practica, re.DOTALL | re.IGNORECASE)

    for coincidencia in coincidencias_partes:
        titulo_parte = coincidencia.group(1).strip()
        contenido_parte = coincidencia.group(2).strip()
        pasos_ejercicio.append(f"**{titulo_parte}:** {contenido_parte}")

    # Si no se encontraron partes estructuradas, buscar listas numeradas o con bullets
    if not pasos_ejercicio:
        # Buscar listas numeradas
        patron_lista = r'^\d+\.\s+(.+?)(?=\n\d+\.|\n\n|$)'
        coincidencias_lista = re.finditer(patron_lista, texto_practica, re.MULTILINE | re.DOTALL)
        for coincidencia in coincidencias_lista:
            pasos_ejercicio.append(coincidencia.group(1).strip())

        # Si no hay listas numeradas, buscar bullets
        if not pasos_ejercicio:
            patron_bullets = r'^\•\s+(.+?)(?=\n\•|\n\n|$)'
            coincidencias_bullets = re.finditer(patron_bullets, texto_practica, re.MULTILINE | re.DOTALL)
            for coincidencia in coincidencias_bullets:
                pasos_ejercicio.append(coincidencia.group(1).strip())

    # Extraer reflexión final
    reflexion_final = None
    patron_reflexion = r'(?:Reflexiona:|Al final de los \d+ días|Pregunta para llevar contigo:)\s*\n\s*(.+?)(?=\n✦|$)'
    coincidencia_reflexion = re.search(patron_reflexion, texto_practica, re.DOTALL)
    if coincidencia_reflexion:
        reflexion_final = coincidencia_reflexion.group(1).strip()

    # Si no se encontró reflexión pero hay una pregunta al final
    if not reflexion_final:
        patron_pregunta_final = r'¿[^?]+\?(?=\s*(?:\n✦|$))'
        coincidencia_pregunta = re.search(patron_pregunta_final, texto_practica)
        if coincidencia_pregunta:
            reflexion_final = coincidencia_pregunta.group(0).strip()

    # Crear ejercicio si tenemos suficiente información
    if titulo_ejercicio or descripcion_ejercicio or pasos_ejercicio:
        numero_capitulo = id_capitulo.replace('cap', '') if 'cap' in id_capitulo else '0'
        ejercicio = {
            "id": f"ex{numero_capitulo}-1",
            "title": titulo_ejercicio or "Práctica",
            "duration": duracion_ejercicio or "Variable",
            "description": descripcion_ejercicio,
            "steps": pasos_ejercicio if pasos_ejercicio else ["Ver texto completo del ejercicio"],
            "reflection": reflexion_final or ""
        }
        ejercicios.append(ejercicio)

    return ejercicios


def procesar_capitulo(ruta_archivo, definicion_capitulo):
    """Procesa un archivo de capítulo y retorna la estructura JSON."""
    print(f"Procesando: {ruta_archivo.name}")

    with open(ruta_archivo, 'r', encoding='utf-8') as archivo:
        texto_completo = archivo.read()

    # Para prólogo y epílogo, usar título esperado si está definido
    if 'titulo_esperado' in definicion_capitulo:
        titulo = definicion_capitulo['titulo_esperado']
    else:
        # Extraer componentes
        titulo = extraer_titulo_capitulo(
            texto_completo,
            definicion_capitulo.get('numero_capitulo')
        )

    epigrafe = extraer_epigrafe(texto_completo)
    contenido = extraer_contenido(texto_completo)
    pregunta_cierre = extraer_pregunta_cierre(texto_completo)
    ejercicios = extraer_ejercicios(texto_completo, definicion_capitulo['id'])

    capitulo = {
        "id": definicion_capitulo['id'],
        "title": titulo,
        "content": contenido
    }

    if epigrafe:
        capitulo["epigraph"] = epigrafe

    if pregunta_cierre:
        capitulo["closingQuestion"] = pregunta_cierre

    capitulo["exercises"] = ejercicios

    return capitulo


def generar_book_json():
    """Función principal que genera el book.json completo."""
    print("=== Generando book.json para 'La Tierra que Despierta' ===\n")

    # Verificar que el directorio de archivos existe
    if not archivos_base_directorio.exists():
        print(f"ERROR: No se encontró el directorio {archivos_base_directorio}")
        return

    # Procesar cada sección
    for definicion_seccion in secciones_definicion:
        print(f"\n--- Procesando {definicion_seccion['title']} ---")

        seccion = {
            "id": definicion_seccion['id'],
            "title": definicion_seccion['title'],
            "chapters": []
        }

        if 'subtitle' in definicion_seccion:
            seccion['subtitle'] = definicion_seccion['subtitle']

        # Procesar cada capítulo de la sección
        for definicion_capitulo in definicion_seccion['chapters']:
            ruta_archivo = archivos_base_directorio / definicion_capitulo['archivo']

            if not ruta_archivo.exists():
                print(f"  ADVERTENCIA: No se encontró {definicion_capitulo['archivo']}")
                continue

            capitulo = procesar_capitulo(ruta_archivo, definicion_capitulo)
            seccion['chapters'].append(capitulo)

        estructura_libro['sections'].append(seccion)

    # Crear directorio de salida si no existe
    salida_directorio.mkdir(parents=True, exist_ok=True)

    # Guardar el JSON
    with open(salida_archivo_json, 'w', encoding='utf-8') as archivo:
        json.dump(estructura_libro, archivo, ensure_ascii=False, indent=2)

    print(f"\n=== book.json generado exitosamente ===")
    print(f"Ubicación: {salida_archivo_json}")
    print(f"Secciones: {len(estructura_libro['sections'])}")

    total_capitulos = sum(len(s['chapters']) for s in estructura_libro['sections'])
    print(f"Capítulos totales: {total_capitulos}")


if __name__ == "__main__":
    generar_book_json()
