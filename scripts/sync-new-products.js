/**
 * sync-new-products.js
 * Detecta productos nuevos en delaroca.es y los añade automáticamente a index.html.
 *
 * Funcionamiento:
 *  1. Obtiene todas las URLs de productos del sitemap de delaroca.es
 *  2. Compara con el catálogo actual de index.html
 *  3. Para cada URL nueva, visita la página y extrae: nombre, precio, categoría e imagen
 *  4. Añade los nuevos productos al array PRODUCTOS y al mapa IMAGENES de index.html
 *
 * Uso:
 *   node scripts/sync-new-products.js            → actualiza index.html
 *   node scripts/sync-new-products.js --dry-run  → muestra qué se añadiría sin tocar archivos
 *   node --use-system-ca scripts/sync-new-products.js  → en Windows con proxy corporativo
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const INDEX_FILE = path.join(__dirname, '..', 'index.html');
const DELAY_MS   = 1500;
const TIMEOUT_MS = 15000;
const DRY_RUN    = process.argv.includes('--dry-run');

// Categorías de delaroca.es → nombre que usamos en estolasparaeventos.com
// El script busca estas palabras en las migas de pan (breadcrumb) de la página
const CAT_MAP = [
  { palabras: ['estola'],               cat: 'Estolas' },
  { palabras: ['bufanda'],              cat: 'Bufandas' },
  { palabras: ['cuello'],               cat: 'Cuellos' },
  { palabras: ['capa'],                 cat: 'Capas' },
  { palabras: ['bolso', 'bolsa'],       cat: 'Bolsos' },
  { palabras: ['sombrero', 'gorro'],    cat: 'Sombreros y gorros' },
  { palabras: ['llavero'],              cat: 'Llaveros' },
];

// URLs candidatas del sitemap de delaroca.es
const SITEMAP_URLS = [
  'https://www.delaroca.es/product-sitemap.xml',
  'https://www.delaroca.es/wp-sitemap-posts-product-1.xml',
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── HTTP GET básico ──────────────────────────────────────────────────────────
function fetchText(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: TIMEOUT_MS,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockSync/1.0; +https://estolasparaeventos.com)',
                 'Accept': 'text/html,application/xml,*/*', 'Accept-Language': 'es-ES,es;q=0.9' }
    }, (res) => {
      // Seguir una sola redirección
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        fetchText(res.headers.location).then(resolve);
        return;
      }
      if (res.statusCode !== 200) { resolve(null); return; }
      let body = '';
      res.on('data', c => { body += c; if (body.length > 800000) req.destroy(); });
      res.on('end', () => resolve(body));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// ── Sitemap: extraer URLs de /producto/ ─────────────────────────────────────
async function getProductUrlsFromSitemap() {
  for (const url of SITEMAP_URLS) {
    process.stdout.write(`  Probando sitemap: ${url} … `);
    const xml = await fetchText(url);
    if (!xml) { console.log('no disponible'); continue; }

    // Sitemap index: busca el sub-sitemap de productos
    if (xml.includes('<sitemapindex')) {
      const subMatch = xml.match(/<loc>([^<]*product[^<]*)<\/loc>/i);
      if (subMatch) {
        console.log(`index → ${subMatch[1]}`);
        const subXml = await fetchText(subMatch[1]);
        if (subXml) {
          const urls = [...subXml.matchAll(/<loc>(https:\/\/www\.delaroca\.es\/producto\/[^<]+)<\/loc>/gi)]
            .map(m => m[1].trim());
          if (urls.length > 0) { console.log(`  ${urls.length} URLs de productos`); return urls; }
        }
      }
    }

    // Sitemap directo de productos
    const urls = [...xml.matchAll(/<loc>(https:\/\/www\.delaroca\.es\/producto\/[^<]+)<\/loc>/gi)]
      .map(m => m[1].trim());
    if (urls.length > 0) { console.log(`${urls.length} productos`); return urls; }
    console.log('sin productos');
  }
  return [];
}

// ── Extraer precio limpio del HTML WooCommerce (delaroca.es) ─────────────────
// Formato real en la página: <bdi>1.500,00<span ...>&euro;</span></bdi>
// Dentro de <del> = precio original, dentro de <ins> = precio oferta
function extractPrecio(html) {
  const block = html.match(/class="price"[\s\S]{0,1000}?<\/p>/);
  if (!block) return { precio: null, antes: null };
  const seg = block[0];

  // Extrae todos los importes que aparecen en <bdi>
  const precios = [...seg.matchAll(/<bdi>([\d.,]+)<span[^>]*>(?:&euro;|€|&#8364;)<\/span><\/bdi>/gi)]
    .map(m => m[1] + '€');

  if (precios.length === 0) return { precio: null, antes: null };

  // Si hay <del> Y <ins> es oferta: primero = original, segundo = precio actual
  const esOferta = seg.includes('<del') && seg.includes('<ins');
  if (esOferta && precios.length >= 2) return { precio: precios[1], antes: precios[0] };
  return { precio: precios[0], antes: null };
}

// ── Extraer og:image ─────────────────────────────────────────────────────────
function extractOgImage(html) {
  let m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (!m) m = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return m ? m[1] : null;
}

// ── Extraer og:title ─────────────────────────────────────────────────────────
function extractOgTitle(html) {
  let m = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (!m) m = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (m) return m[1].replace(/\s*[-–|].*$/, '').trim(); // quitar "– De La Roca" del final
  return null;
}

// Prendas de ropa completas que no son accesorios — aunque tengan "cuello" en el nombre
const PRENDAS_EXCLUIR = ['chaqueta', 'abrigo', 'chaleco', 'cazadora', 'chaqueton', 'chaquetón', 'abrigos', 'chaquetas'];

// ── Detectar categoría desde migas de pan ────────────────────────────────────
function detectarCategoria(html, url) {
  const bc = html.match(/woocommerce-breadcrumb[^>]*>([\s\S]{0,500}?)<\/nav>/i)
          || html.match(/breadcrumb[^>]*>([\s\S]{0,500}?)<\/[uo]l>/i);

  if (!bc) return null;

  // Buscar solo el texto de los LINKS del breadcrumb (= categorías).
  // El nombre del producto aparece al final como texto plano sin <a>, así que queda excluido.
  const links = [...bc[1].matchAll(/<a[^>]*>([^<]+)<\/a>/gi)].map(m => m[1].toLowerCase());
  const textoCats = links.join(' ');

  // Si la URL o los links del breadcrumb contienen una prenda completa, descartar
  const urlLower = url.toLowerCase();
  if (PRENDAS_EXCLUIR.some(p => urlLower.includes(p) || textoCats.includes(p))) return null;

  for (const { palabras, cat } of CAT_MAP) {
    if (palabras.some(p => textoCats.includes(p))) return cat;
  }
  return null; // categoría no mapeada: no añadir
}

// ── Leer / escribir index.html ───────────────────────────────────────────────
function extractProductos(html) {
  const start = html.indexOf('const PRODUCTOS = [');
  if (start === -1) throw new Error('No se encontró PRODUCTOS en index.html');
  let depth = 0, i = start + 'const PRODUCTOS = '.length, end = -1;
  for (; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return { productos: JSON.parse(html.slice(start + 'const PRODUCTOS = '.length, end)), blockStart: start, blockEnd: end };
}

function extractImagenes(html) {
  const start = html.indexOf('const IMAGENES = {');
  if (start === -1) return { imagenes: {}, imgStart: -1, imgEnd: -1 };
  let depth = 0, i = start + 'const IMAGENES = '.length, end = -1;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return { imagenes: JSON.parse(html.slice(start + 'const IMAGENES = '.length, end)), imgStart: start, imgEnd: end };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) console.log('── MODO DRY-RUN: no se modificará ningún archivo ──\n');

  const htmlOriginal = fs.readFileSync(INDEX_FILE, 'utf8');
  const { productos, blockStart, blockEnd } = extractProductos(htmlOriginal);
  const { imagenes, imgStart, imgEnd }      = extractImagenes(htmlOriginal);

  const urlsActuales = new Set(productos.map(p => p.url.replace(/\/$/, '')));
  console.log(`Catálogo actual: ${urlsActuales.size} productos\n`);

  // 1. Obtener URLs del sitemap
  console.log('Obteniendo URLs desde el sitemap de delaroca.es...');
  const urlsSitemap = await getProductUrlsFromSitemap();

  if (urlsSitemap.length === 0) {
    console.log('\nNo se pudo acceder al sitemap. Prueba a ejecutar el script más tarde.');
    process.exit(0);
  }

  // 2. Detectar URLs nuevas
  const urlsNuevas = urlsSitemap.filter(u => !urlsActuales.has(u.replace(/\/$/, '')));
  console.log(`\nProductos en sitemap:  ${urlsSitemap.length}`);
  console.log(`Ya en catálogo:        ${urlsActuales.size}`);
  console.log(`Productos nuevos:      ${urlsNuevas.length}`);

  if (urlsNuevas.length === 0) {
    console.log('\nEl catálogo está al día. No hay productos nuevos.');
    return;
  }

  // 3. Extraer datos de cada producto nuevo
  console.log('\nExtrayendo datos de productos nuevos...\n');
  const productosNuevos  = [];
  const imagenesNuevas   = {};
  const fallidos         = [];

  for (let i = 0; i < urlsNuevas.length; i++) {
    const url = urlsNuevas[i];
    process.stdout.write(`[${i + 1}/${urlsNuevas.length}] ${url.split('/producto/')[1] || url} … `);

    const html = await fetchText(url);
    if (!html) {
      console.log('✗ sin respuesta');
      fallidos.push(url);
      await sleep(DELAY_MS);
      continue;
    }

    const nombre    = extractOgTitle(html);
    const imagen    = extractOgImage(html);
    const { precio, antes } = extractPrecio(html);
    const categoria = detectarCategoria(html, url);

    if (!nombre || !precio || !categoria) {
      console.log(`✗ datos incompletos (nombre:${!!nombre} precio:${!!precio} cat:${!!categoria})`);
      fallidos.push(url);
      await sleep(DELAY_MS);
      continue;
    }

    const producto = { cat: categoria, nombre, precio, url };
    if (antes) producto.antes = antes;
    productosNuevos.push(producto);
    if (imagen) imagenesNuevas[url] = imagen;

    console.log(`✓  [${categoria}] ${nombre.slice(0, 45)}`);
    await sleep(DELAY_MS);
  }

  // 4. Resumen
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`Añadir:  ${productosNuevos.length} productos`);
  console.log(`Fallidos: ${fallidos.length}`);
  if (fallidos.length > 0) console.log('  ' + fallidos.join('\n  '));

  if (productosNuevos.length === 0) {
    console.log('\nNo hay productos válidos para añadir.');
    return;
  }

  console.log('\nProductos nuevos a añadir:');
  productosNuevos.forEach(p => console.log(`  + [${p.cat}] ${p.nombre} — ${p.precio}`));

  if (DRY_RUN) {
    console.log('\nDry-run completado. Ejecuta sin --dry-run para aplicar los cambios.');
    return;
  }

  // 5. Actualizar index.html
  // Los nuevos se insertan al inicio del array (más recientes primero)
  const productosActualizados = [...productosNuevos, ...productos];
  const imagenesActualizadas  = { ...imagenesNuevas, ...imagenes };

  let htmlActualizado = htmlOriginal.slice(0, blockStart) +
    'const PRODUCTOS = ' + JSON.stringify(productosActualizados, null, '\n') +
    htmlOriginal.slice(blockEnd);

  if (imgStart !== -1) {
    const nuevoImgStart = htmlActualizado.indexOf('const IMAGENES = {');
    let d2 = 0, j = nuevoImgStart + 'const IMAGENES = '.length, end2 = -1;
    for (; j < htmlActualizado.length; j++) {
      if (htmlActualizado[j] === '{') d2++;
      else if (htmlActualizado[j] === '}') { d2--; if (d2 === 0) { end2 = j + 1; break; } }
    }
    if (end2 !== -1) {
      htmlActualizado = htmlActualizado.slice(0, nuevoImgStart) +
        'const IMAGENES = ' + JSON.stringify(imagenesActualizadas, null, '  ') +
        htmlActualizado.slice(end2);
    }
  }

  fs.writeFileSync(INDEX_FILE, htmlActualizado, 'utf8');
  console.log(`\n✓ index.html actualizado: ${productosNuevos.length} productos añadidos.`);

  // Log
  const logPath = path.join(__dirname, 'stock-added.log');
  const entry = `\n[${new Date().toISOString()}]\n` +
    productosNuevos.map(p => `  + [${p.cat}] ${p.nombre} | ${p.precio} | ${p.url}`).join('\n') + '\n';
  fs.appendFileSync(logPath, entry, 'utf8');
  console.log('✓ Registro guardado en scripts/stock-added.log');
}

main().catch(e => { console.error('\nError fatal:', e.message); process.exit(1); });
