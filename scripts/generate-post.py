"""
Genera un nuevo artículo de blog usando Claude API y lo añade a posts.json.
Se ejecuta desde GitHub Actions cada 2 días.
Requiere la variable de entorno ANTHROPIC_API_KEY.
"""

import json
import os
import re
from datetime import date
import anthropic

POSTS_FILE = "posts.json"
SITEMAP_FILE = "sitemap.xml"

def cargar_posts():
    with open(POSTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def guardar_posts(posts):
    with open(POSTS_FILE, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)

def actualizar_sitemap(fecha_hoy):
    with open(SITEMAP_FILE, "r", encoding="utf-8") as f:
        contenido = f.read()
    # Actualizar la fecha del blog en el sitemap
    contenido = re.sub(
        r'(<loc>https://estolasparaeventos\.com/blog\.html</loc>\s*<lastmod>)[^<]+(</lastmod>)',
        rf'\g<1>{fecha_hoy}\g<2>',
        contenido
    )
    with open(SITEMAP_FILE, "w", encoding="utf-8") as f:
        f.write(contenido)

def generar_post(posts_existentes, tema_personalizado=""):
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    titulos_existentes = [p["titulo"] for p in posts_existentes]

    instruccion_tema = ""
    if tema_personalizado:
        instruccion_tema = f"\nEl tema del artículo debe ser: {tema_personalizado}\n"

    prompt = f"""Eres el editor del blog de Estolas para Eventos (estolasparaeventos.com), la web de alta peletería artesanal sostenible de la marca De La Roca Peleteros, con sede en Madrid.

Tu misión: escribir artículos informativos, elegantes y útiles sobre moda de eventos, complementos de pelo natural, peletería artesanal, cuidado de prendas, tendencias nupciales y temas afines.

Público objetivo: mujeres de 30-65 años que buscan complementos de lujo para bodas, galas, cumpleaños de celebración y otros eventos especiales.

Tono: culto, cálido, cercano. Nunca agresivo ni publicitario. El artículo debe aportar valor real al lector.
{instruccion_tema}
Artículos ya publicados (NO repetir temas similares):
{chr(10).join('- ' + t for t in titulos_existentes)}

Devuelve ÚNICAMENTE un objeto JSON válido con este formato exacto (sin texto adicional, sin markdown, sin bloques de código):
{{
  "titulo": "Título del artículo (máximo 65 caracteres, sin puntuación al final)",
  "resumen": "Resumen de 1-2 frases atractivas para la tarjeta del blog (máximo 120 caracteres)",
  "contenido": "Contenido completo en HTML usando <p>, <h2>, <h3>, <ul>, <li>. Mínimo 400 palabras. Sin etiquetas html, head, body ni script.",
  "categoria": "Una de exactamente estas opciones: Moda, Eventos, Consejos, Tendencias, Historia"
}}"""

    message = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    texto = message.content[0].text.strip()
    # Limpiar posibles bloques de código markdown
    texto = re.sub(r'^```(?:json)?\n?', '', texto)
    texto = re.sub(r'\n?```$', '', texto)
    return json.loads(texto)

def main():
    posts = cargar_posts()
    fecha_hoy = date.today().isoformat()
    tema = os.environ.get("TEMA_PERSONALIZADO", "").strip()

    nuevo_post = generar_post(posts, tema)
    nuevo_post["id"] = f"post-{len(posts) + 1}"
    nuevo_post["fecha"] = fecha_hoy

    posts.insert(0, nuevo_post)  # más reciente primero
    guardar_posts(posts)
    actualizar_sitemap(fecha_hoy)

    print(f"✓ Post generado: {nuevo_post['titulo']}")
    print(f"  Categoría: {nuevo_post['categoria']}")
    print(f"  Fecha: {fecha_hoy}")

if __name__ == "__main__":
    main()
