/**
 * sync-new-products.js
 * Detecta productos nuevos en la categoría "Accesorios" de delaroca.es
 * y los añade automáticamente a index.html.
 *
 * Funcionamiento:
 *  1. Recorre todas las páginas de /categoria-producto/accesorios/ en delaroca.es
 *  2. Compara las URLs encontradas con el catálogo actual de index.html
 *  3. Para cada URL nueva, visita la página y extrae: nombre, precio, subcategoría e imagen
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

const INDEX_FILE    = path.join(__dirname, '..', 'index.html');
const CAT_ACCESORIOS = 'https://www.delaroca.es/categoria-producto/accesorios/';
const DELAY_MS      = 1500;
const TIMEOUT_MS    = 15000;
const DRY_RUN       = process.argv.includes('--dry-run');

// Subcategorías de accesorios → nombre en estolasparaeventos.com
// Se detectan por los links del breadcrumb de la página del producto
const CAT_MAP = [
  { palabras: ['estola'],            cat: 'Estolas' },
  { palabras: ['bufanda'],           cat: 'Bufandas' },
  { palabras: ['cuello'],            cat: 'Cuellos' },
  { palabras: ['capa'],              cat: 'Capas' },
  { palabras: ['bolso', 'bolsa'],    cat: 'Bolsos' },
  { palabras: ['sombrero', 'gorro'], cat: 'Sombreros y gorros' },
  { palabras: ['llavero'],           cat: 'Llaveros' },
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── HTTP GET básico ──────────────────────────────────────────────────────────
function fetchText(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StockSync/1.0; +https://estolasparaeventos.com)',
        'Accept': 'text/html,*/*',
        'Accept-Language': 'es-ES,es;q=0.9',
      }
    }, (res) => {
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

// ── Extraer URLs de productos de una página de categoría ────────────────────
function extractUrlsDePagina(html) {
  return [...new Set(
    [...html.matchAll(/href="(https:\/\/www\.delaroca\.es\/producto\/[^"]+)"/g)]
      .map(m => m[1].replace(/\/$/, '') + '/')
  )];
}

// ── Recorrer todas las páginas de la categoría Accesorios ───────────────────
async function getProductUrlsFromCategory() {
  const urls = [];
  for (let page = 1; page <= 50; page++) {
    const pageUrl = page === 1
      ? CAT_ACCESORIOS
      : `${CAT_ACCESORIOS}page/${page}/`;

    process.stdout.write(`  Página ${page}: ${pageUrl} … `);
    const html = await fetchText(pageUrl);
    if (!html) { console.log('sin respuesta, fin.'); break; }

    const found = extractUrlsDePagina(html);
    if (found.length === 0) { console.log('vacía, fin.'); break; }

    console.log(`${found.length} productos`);
    urls.push(...found);
    await sleep(500);
  }
  return [...new Set(urls)];
}

// ── Extraer precio limpio del HTML WooCommerce (delaroca.es) ─────────────────
function extractPrecio(html) {
  const block = html.match(/class="price"[\s\S]{0,1000}?<\/p>/);
  if (!block) return { precio: null, antes: null };
  const seg = block[0];

  const precios = [...seg.matchAll(/<bdi>([\d.,]+)<span[^>]*>(?:&euro;|€|&#8364;)<\/span><\/bdi>/gi)]
    .map(m => m[1] + '€');

  if (precios.length === 0) return { precio: null, antes: null };

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
  if (m) return m[1].replace(/\s*[-–|].*$/, '').trim();
  return null;
}

// ── Detectar subcategoría desde los links del breadcrumb ─────────────────────
// Solo lee los <a> del breadcrumb (= categorías), nunca el nombre del producto
// (que aparece como texto plano al final del breadcrumb, sin enlace).
function detectarCategoria(html) {
  const bc = html.match(/woocommerce-breadcrumb[^>]*>([\s\S]{0,500}?)<\/nav>/i)
          || html.match(/breadcrumb[^>]*>([\s\S]{0,500}?)<\/[uo]l>/i);

  if (!bc) return null;

  const links = [...bc[1].matchAll(/<a[^>]*>([^<]+)<\/a>/gi)].map(m => m[1].toLowerCase());
  const texto = links.join(' ');

  for (const { palabras, cat } of CAT_MAP) {
    if (palabras.some(p => texto.includes(p))) return cat;
  }
  return null; // subcategoría no reconocida: no añadir
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

  // 1. Obtener URLs de la categoría Accesorios
  console.log('Obteniendo productos de /categoria-producto/accesorios/ en delaroca.es...');
  const urlsCategoria = await getProductUrlsFromCategory();

  if (urlsCategoria.length === 0) {
    console.log('\nNo se pudo acceder a la categoría. Prueba más tarde.');
    process.exit(0);
  }

  // 2. Detectar URLs nuevas
  const urlsNuevas = urlsCategoria.filter(u => !urlsActuales.has(u.replace(/\/$/, '')));
  console.log(`\nProductos en Accesorios: ${urlsCategoria.length}`);
  console.log(`Ya en catálogo:          ${urlsActuales.size}`);
  console.log(`Productos nuevos:        ${urlsNuevas.length}`);

  if (urlsNuevas.length === 0) {
    console.log('\nEl catálogo está al día. No hay productos nuevos.');
    return;
  }

  // 3. Extraer datos de cada producto nuevo
  console.log('\nExtrayendo datos de productos nuevos...\n');
  const productosNuevos = [];
  const imagenesNuevas  = {};
  const fallidos        = [];

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
    const categoria = detectarCategoria(html);

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
  console.log(`Añadir:   ${productosNuevos.length} productos`);
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

  const logPath = path.join(__dirname, 'stock-added.log');
  const entry = `\n[${new Date().toISOString()}]\n` +
    productosNuevos.map(p => `  + [${p.cat}] ${p.nombre} | ${p.precio} | ${p.url}`).join('\n') + '\n';
  fs.appendFileSync(logPath, entry, 'utf8');
  console.log('✓ Registro guardado en scripts/stock-added.log');
}

main().catch(e => { console.error('\nError fatal:', e.message); process.exit(1); });
