/**
 * check-stock.js
 * Comprueba cada producto del catálogo en delaroca.es y elimina de index.html
 * los que devuelvan 404 o estén marcados como agotados.
 *
 * Uso:
 *   node scripts/check-stock.js           → actualiza index.html
 *   node scripts/check-stock.js --dry-run → solo muestra qué se eliminaría
 *   node --use-system-ca scripts/check-stock.js  → en Windows con proxy corporativo
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const INDEX_FILE  = path.join(__dirname, '..', 'index.html');
const DELAY_MS    = 1500;   // pausa entre peticiones para no saturar delaroca.es
const TIMEOUT_MS  = 15000;
const DRY_RUN     = process.argv.includes('--dry-run');

// Indicadores de "sin existencias" en el HTML de WooCommerce en español
const OUT_OF_STOCK_SIGNALS = [
  'class="stock out-of-stock"',
  'out-of-stock',
  '>Agotado<',
  '>Sin existencias<',
  'availability" content="https://schema.org/OutOfStock"',
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    let html = '';
    let statusCode = 0;
    let redirectUrl = '';

    const req = lib.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StockChecker/1.0; +https://estolasparaeventos.com)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-ES,es;q=0.9',
      }
    }, (res) => {
      statusCode = res.statusCode;
      redirectUrl = res.headers.location || '';

      res.on('data', chunk => {
        html += chunk;
        // Con los primeros 30 KB tenemos suficiente para detectar el estado
        if (html.length > 30000) req.destroy();
      });

      res.on('end', () => resolve({ statusCode, html, redirectUrl }));
    });

    req.on('error', () => resolve({ statusCode: 0, html: '', redirectUrl: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ statusCode: 0, html: '', redirectUrl: '' }); });
  });
}

async function checkProduct(url) {
  const { statusCode, html, redirectUrl } = await fetchUrl(url);

  // Error de red o timeout → conservar el producto (puede ser temporal)
  if (statusCode === 0) return { activo: true, motivo: 'Error de red (se conserva)' };

  // 404 → producto eliminado de la tienda
  if (statusCode === 404) return { activo: false, motivo: '404 – Producto eliminado' };

  // Redirección fuera de la sección /producto/ → producto desaparecido
  if ((statusCode === 301 || statusCode === 302) && redirectUrl) {
    if (!redirectUrl.includes('/producto/')) {
      return { activo: false, motivo: `Redirige a ${redirectUrl}` };
    }
  }

  // Errores de servidor → conservar (puede ser temporal)
  if (statusCode >= 500) return { activo: true, motivo: `Error ${statusCode} (se conserva)` };

  // Página cargada: buscar señales de agotado
  const agotado = OUT_OF_STOCK_SIGNALS.some(s => html.includes(s));
  if (agotado) return { activo: false, motivo: 'Sin existencias (Agotado)' };

  return { activo: true };
}

function extractProductos(html) {
  // Localiza el bloque "const PRODUCTOS = [...];"
  const start = html.indexOf('const PRODUCTOS = [');
  if (start === -1) throw new Error('No se encontró const PRODUCTOS en index.html');

  let depth = 0, i = start + 'const PRODUCTOS = '.length, end = -1;
  for (; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end === -1) throw new Error('No se encontró el cierre del array PRODUCTOS');

  const rawArray = html.slice(start + 'const PRODUCTOS = '.length, end);
  const productos = JSON.parse(rawArray);
  return { productos, blockStart: start, blockEnd: end };
}

function rebuildHtml(html, blockStart, blockEnd, productos) {
  const newArray = JSON.stringify(productos, null, '\n');
  return html.slice(0, blockStart) + 'const PRODUCTOS = ' + newArray + html.slice(blockEnd);
}

async function main() {
  if (DRY_RUN) console.log('── MODO DRY-RUN: no se modificará ningún archivo ──\n');

  const htmlOriginal = fs.readFileSync(INDEX_FILE, 'utf8');
  const { productos, blockStart, blockEnd } = extractProductos(htmlOriginal);

  console.log(`Catálogo: ${productos.length} productos`);
  console.log(`Comprobando disponibilidad en delaroca.es...\n`);

  const activos   = [];
  const eliminados = [];

  for (let i = 0; i < productos.length; i++) {
    const p = productos[i];
    const label = `[${String(i + 1).padStart(3)}/${productos.length}] ${p.nombre.slice(0, 55).padEnd(55)}`;
    process.stdout.write(label + ' … ');

    const { activo, motivo } = await checkProduct(p.url);

    if (activo) {
      process.stdout.write('✓\n');
      activos.push(p);
    } else {
      process.stdout.write(`✗  ${motivo}\n`);
      eliminados.push({ nombre: p.nombre, url: p.url, motivo });
    }

    if (i < productos.length - 1) await sleep(DELAY_MS);
  }

  // ── Resumen ──
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`Activos:    ${activos.length}`);
  console.log(`Eliminados: ${eliminados.length}`);

  if (eliminados.length === 0) {
    console.log('\nTodo el catálogo sigue disponible. No hay cambios.');
    return;
  }

  console.log('\nProductos a eliminar:');
  eliminados.forEach(p => console.log(`  ✗ ${p.nombre}\n      ${p.motivo}\n      ${p.url}`));

  if (DRY_RUN) {
    console.log('\nDry-run completado. Ejecuta sin --dry-run para aplicar los cambios.');
    return;
  }

  // ── Actualizar index.html ──
  const htmlActualizado = rebuildHtml(htmlOriginal, blockStart, blockEnd, activos);
  fs.writeFileSync(INDEX_FILE, htmlActualizado, 'utf8');

  console.log(`\n✓ index.html actualizado: ${eliminados.length} productos eliminados, ${activos.length} conservados.`);

  // Guardar log de eliminados para referencia
  const logPath = path.join(__dirname, '..', 'scripts', 'stock-removed.log');
  const logEntry = `\n[${new Date().toISOString()}]\n` +
    eliminados.map(p => `  - ${p.nombre} | ${p.motivo} | ${p.url}`).join('\n') + '\n';
  fs.appendFileSync(logPath, logEntry, 'utf8');
  console.log(`✓ Registro guardado en scripts/stock-removed.log`);
}

main().catch(e => { console.error('\nError fatal:', e.message); process.exit(1); });
