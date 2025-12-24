#!/usr/bin/env python3
"""
Resource Finder System for Colección Nuevo Ser
Extracts chapter themes and generates search queries for resources.
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any

BOOKS_DIR = Path('/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/books')

def extract_chapter_themes(book_id: str) -> Dict[str, Dict]:
    """Extract key themes and concepts from each chapter."""
    book_file = BOOKS_DIR / book_id / 'book.json'

    if not book_file.exists():
        return {}

    with open(book_file, 'r', encoding='utf-8') as f:
        book = json.load(f)

    chapters = {}

    for section in book.get('sections', []):
        section_title = section.get('title', '')

        for chapter in section.get('chapters', []):
            cap_id = chapter.get('id', '')
            cap_title = chapter.get('title', '')
            content = chapter.get('content', '')
            epigraph_obj = chapter.get('epigraph') or {}
            epigraph = epigraph_obj.get('text', '') if isinstance(epigraph_obj, dict) else ''

            # Extract key concepts (words in bold or headers)
            bold_concepts = re.findall(r'\*\*([^*]+)\*\*', content)
            headers = re.findall(r'###?\s*([^\n]+)', content)

            # Extract key terms (capitalized phrases, technical terms)
            key_terms = set()
            for concept in bold_concepts[:10]:  # Limit to 10
                if len(concept) > 3:
                    key_terms.add(concept.strip())

            chapters[cap_id] = {
                'title': cap_title,
                'section': section_title,
                'epigraph': epigraph[:200] if epigraph else '',
                'key_concepts': list(key_terms)[:8],
                'headers': headers[:5],
                'content_preview': content[:500] if content else ''
            }

    return chapters


def generate_search_queries(book_id: str, chapter_data: Dict) -> Dict[str, List[str]]:
    """Generate optimized search queries for each chapter."""

    # Book-specific context
    book_contexts = {
        'nacimiento': 'colapso civilizatorio transición sistémica nuevo paradigma',
        'filosofia-nuevo-ser': 'filosofía ontología conciencia realidad',
        'codigo-despertar': 'conciencia despertar transformación personal',
        'manual-transicion': 'transición ecológica comunidades sostenibilidad',
        'manual-practico': 'prácticas transformación personal ejercicios',
        'toolkit-transicion': 'herramientas transición metodologías cambio',
        'guia-acciones': 'acción social activismo cambio sistémico',
        'tierra-que-despierta': 'ecología profunda tierra naturaleza',
        'dialogos-maquina': 'inteligencia artificial IA humanidad tecnología',
        'practicas-radicales': 'prácticas transformadoras cambio radical',
        'manifiesto': 'manifiesto nuevo ser paradigma civilización',
        'ahora-instituciones': 'instituciones transformación organizaciones'
    }

    context = book_contexts.get(book_id, '')
    queries = {}

    for cap_id, data in chapter_data.items():
        cap_queries = []
        title = data['title']
        concepts = data['key_concepts']

        # Query 1: Title + context (books)
        cap_queries.append(f'libros sobre {title} {context}')
        cap_queries.append(f'books about {title} {context}')

        # Query 2: Key concepts (documentaries)
        if concepts:
            cap_queries.append(f'documental {" ".join(concepts[:3])}')
            cap_queries.append(f'documentary {" ".join(concepts[:3])}')

        # Query 3: Organizations
        cap_queries.append(f'organizaciones {title} {context}')
        cap_queries.append(f'organizations {title}')

        # Query 4: Academic papers
        cap_queries.append(f'paper académico {title}')
        cap_queries.append(f'academic paper {title}')

        queries[cap_id] = cap_queries

    return queries


def get_existing_resources(book_id: str) -> Dict:
    """Load existing resources for a book."""
    resources_file = BOOKS_DIR / book_id / 'assets' / 'resources.json'

    if resources_file.exists():
        with open(resources_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    return {}


def analyze_resource_gaps(book_id: str) -> Dict:
    """Analyze which chapters need more resources."""
    chapters = extract_chapter_themes(book_id)
    existing = get_existing_resources(book_id)

    # Count resources per chapter
    chapter_coverage = {cap_id: 0 for cap_id in chapters}

    for category, items in existing.items():
        if isinstance(items, list):
            for item in items:
                related = item.get('relatedChapters', [])
                for cap_id in related:
                    if cap_id in chapter_coverage:
                        chapter_coverage[cap_id] += 1

    # Find gaps
    gaps = {
        'no_resources': [],
        'low_resources': [],  # < 2
        'adequate': []  # >= 2
    }

    for cap_id, count in chapter_coverage.items():
        if count == 0:
            gaps['no_resources'].append(cap_id)
        elif count < 2:
            gaps['low_resources'].append(cap_id)
        else:
            gaps['adequate'].append(cap_id)

    return {
        'book_id': book_id,
        'total_chapters': len(chapters),
        'chapters': chapters,
        'coverage': chapter_coverage,
        'gaps': gaps,
        'queries': generate_search_queries(book_id, chapters)
    }


def main():
    """Analyze all books and output resource gaps."""
    print("=== RESOURCE GAP ANALYSIS ===\n")

    all_analysis = {}

    for book_dir in sorted(BOOKS_DIR.iterdir()):
        if (book_dir / 'book.json').exists():
            book_id = book_dir.name
            analysis = analyze_resource_gaps(book_id)
            all_analysis[book_id] = analysis

            no_res = len(analysis['gaps']['no_resources'])
            low_res = len(analysis['gaps']['low_resources'])
            total = analysis['total_chapters']

            print(f"{book_id}: {total} caps, {no_res} sin recursos, {low_res} con pocos")

    # Save analysis
    output_file = BOOKS_DIR.parent / 'resource-analysis.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_analysis, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Análisis guardado en: {output_file}")
    return all_analysis


if __name__ == '__main__':
    main()
