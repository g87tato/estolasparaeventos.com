// scrape-images.js
// Extrae la imagen principal (og:image) de cada página de producto en delaroca.es
// Ejecutar: node scrape-images.js
// Genera: imagenes.json

const { readFileSync, writeFileSync, existsSync } = require('fs');

const URLS = [
  "https://www.delaroca.es/producto/estola-de-pelo-de-zorro-en-color-plata/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-marmota-finlandesa-en-color-amarillo/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-vison-rasado-con-dibujo-damero/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-rex-rasado-en-color-gris/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-zorro-en-color-amarillo-2/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-zorro-en-color-rojo/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-zorro-en-color-verde-oscuro/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-zorro-en-color-verde-claro/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-zorro-en-color-marron-plata/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-zorro-en-color-marron-oscuro/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-marmota-finlandesa-en-color-marron/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-zorro-en-color-azul/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-zorro-en-color-rosa/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-zorro-en-color-natural-2/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-zorro-en-color-natural/",
  "https://www.delaroca.es/producto/estola-de-pelo-de-zorro-en-color-amarillo/",
  "https://www.delaroca.es/producto/estola-grande-de-la-roca-de-pelo-de-zorro-y-napa-en-color-rosa/",
  "https://www.delaroca.es/producto/estola-grande-de-la-roca-de-pelo-de-zorro-y-napa-en-color-azul/",
  "https://www.delaroca.es/producto/estola-grande-de-la-roca-de-pelo-de-zorro-y-napa-en-color-verde/",
  "https://www.delaroca.es/producto/estola-de-la-roca-de-pelo-de-marmota-finlandesa-en-color-azul/",
  "https://www.delaroca.es/producto/estola-de-la-roca-de-pelo-de-marmota-finlandesa-en-color-marron/",
  "https://www.delaroca.es/producto/estola-de-la-roca-de-pelo-de-marmota-finlandesa-en-color-verde/",
  "https://www.delaroca.es/producto/estola-de-la-roca-de-pelo-de-marmota-finlandesa-color-natural/",
  "https://www.delaroca.es/producto/bufanda-larga-de-pelo-de-vison-con-extremos-de-pelo-de-zorro/",
  "https://www.delaroca.es/producto/bufanda-de-pelo-de-zorro-en-color-natural/",
  "https://www.delaroca.es/producto/bufanda-de-pelo-de-zorro-en-color-rosa/",
  "https://www.delaroca.es/producto/bufanda-de-pelo-de-zorro-en-color-plata/",
  "https://www.delaroca.es/producto/bufanda-de-la-roca-de-pelo-de-vison-tricotado-en-color-azul/",
  "https://www.delaroca.es/producto/bufanda-de-la-roca-de-pelo-de-vison-tricotado-en-color-gris/",
  "https://www.delaroca.es/producto/bufanda-de-la-roca-de-pelo-de-vison-tricotado-en-color-negro/",
  "https://www.delaroca.es/producto/bufanda-de-la-roca-de-pelo-de-vison-tricotado-en-color-rosa/",
  "https://www.delaroca.es/producto/bufanda-de-la-roca-de-pelo-de-vison-tricotado-multicolor-2/",
  "https://www.delaroca.es/producto/bufanda-de-la-roca-de-pelo-de-vison-tricotado-multicolor/",
  "https://www.delaroca.es/producto/bufanda-gris-de-pelo-de-conejo-rex-swarz/",
  "https://www.delaroca.es/producto/cuello-de-pelo-de-zorro-en-color-azul-2/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-zorro-bicolor-a-rayas-4/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-zorro-bicolor-a-rayas-3/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-zorro-bicolor-a-rayas-2/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-zorro-bicolor-7/",
  "https://www.delaroca.es/producto/cuello-de-pelo-de-zorro-en-color-azul/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-zorro-bicolor-6/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-zorro-bicolor-a-rayas/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-zorro-bicolor-5/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-zorro-en-color-naranja/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-finn-racoon-con-cintas/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-zorro-en-color-rojo/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-zorro-bicolor-3/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-zorro-bicolor-2/",
  "https://www.delaroca.es/producto/cuello-redondo-de-pelo-de-zorro-bicolor/",
  "https://www.delaroca.es/producto/cuello-de-pelo-de-zorro-bicolor/",
  "https://www.delaroca.es/producto/cuello-de-pelo-de-rex-multicolor/",
  "https://www.delaroca.es/producto/cuello-de-pelo-de-zorro-en-color-natural/",
  "https://www.delaroca.es/producto/cuello-de-pelo-de-zorro-en-color-rojo/",
  "https://www.delaroca.es/producto/cuello-de-pelo-de-zorro-en-color-verde/",
  "https://www.delaroca.es/producto/cuello-de-pelo-de-zorro-en-color-fucsia/",
  "https://www.delaroca.es/producto/cuello-de-pelo-de-zorro-en-color-amarillo/",
  "https://www.delaroca.es/producto/cuello-swarz-de-pelo-de-rex-en-color-rosa-combinado/",
  "https://www.delaroca.es/producto/cuello-de-pelo-de-zorro-rojo-saint-germain/",
  "https://www.delaroca.es/producto/cuello-largo-azul-de-pelo-zorro-saint-germain/",
  "https://www.delaroca.es/producto/capa-de-mujer-de-lana-con-detalles-de-zorro/",
  "https://www.delaroca.es/producto/capa-de-mujer-de-lana-con-ribete-de-zorro-4/",
  "https://www.delaroca.es/producto/capa-de-mujer-de-lana-con-ribete-de-zorro-3/",
  "https://www.delaroca.es/producto/capa-de-mujer-de-lana-con-ribete-de-zorro-2/",
  "https://www.delaroca.es/producto/capa-de-mujer-de-lana-con-ribete-de-zorro/",
  "https://www.delaroca.es/producto/bolso-grande-de-multiposicion-de-pelo-de-zorro-bellys-2/",
  "https://www.delaroca.es/producto/bolso-grande-de-multiposicion-de-pelo-de-zorro-bellys/",
  "https://www.delaroca.es/producto/bolso-grande-de-multiposicion-de-pelo-de-astracan/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-19/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-astracan-2/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-vison-3/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-18/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-17/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-16/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-kid-estampado-2/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-vison-bicolor/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-kid-estampado/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-15/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-grande-de-pelo-de-cordero-del-tibet-3/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-14/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-13/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-12/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-marmota-americana/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-11/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-10/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-9/",
  "https://www.delaroca.es/producto/bolso-de-piel-en-color-negro-con-asas-planas/",
  "https://www.delaroca.es/producto/bolso-de-piel-en-color-negro-con-asas-redondas/",
  "https://www.delaroca.es/producto/bolso-kelly-grande-con-asas-redondas-en-color-negro/",
  "https://www.delaroca.es/producto/bolso-kelly-con-asas-redondas-en-color-negro/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-cordero-del-tibet-7/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-cordero-del-tibet-6/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-cordero-del-tibet-5/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-grande-de-pelo-de-cordero-del-tibet-2/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-grande-de-pelo-de-cordero-del-tibet/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-8/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-7/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-vison-2/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-vison/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-cordero-kalgan/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-6/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-5/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-astracan/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-cordero-del-tibet-4/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-cordero-del-tibet-3/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-cordero-del-tibet-2/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-cordero-del-tibet/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-4/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-3/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro-2/",
  "https://www.delaroca.es/producto/bolso-de-multiposicion-de-pelo-de-zorro/",
  "https://www.delaroca.es/producto/bolso-de-mano-de-pelo-de-vison-con-asa-bandolera-2/",
  "https://www.delaroca.es/producto/bolso-de-mano-de-pelo-de-vison-con-asa-bandolera/",
  "https://www.delaroca.es/producto/gorro-de-mujer-de-la-roca-de-pelo-de-vison-tricotado/",
  "https://www.delaroca.es/producto/sombrero-de-mujer-de-pelo-de-vison-plata/",
  "https://www.delaroca.es/producto/sombrero-de-mujer-de-pelo-de-vison-marron/",
  "https://www.delaroca.es/producto/gorro-de-mujer-de-lana-con-pompon-de-pelo-de-rex-4/",
  "https://www.delaroca.es/producto/gorro-de-mujer-de-lana-con-pompon-de-pelo-de-rex-3/",
  "https://www.delaroca.es/producto/llavero-pompon-blanco-de-pelo-de-zorro/",
  "https://www.delaroca.es/producto/llavero-pompon-verde-de-pelo-de-zorro/",
  "https://www.delaroca.es/producto/llavero_pompon_rosa_fucsia_de_pelo_de_zorro/",
  "https://www.delaroca.es/producto/llavero_pompon_rosa_claro_de_pelo_de_zorro/",
  "https://www.delaroca.es/producto/llavero_pompon_rojo_de_pelo_de_zorro/",
  "https://www.delaroca.es/producto/llavero_pompon_negro_de_pelo_de_zorro/",
  "https://www.delaroca.es/producto/llavero_pompon_morado_de_pelo_de_zorro/",
  "https://www.delaroca.es/producto/llavero_pompon_marron_oscuro_de_pelo_de_zorro/",
  "https://www.delaroca.es/producto/llavero_pompon_marron_claro_de_pelo_de_zorro/",
  "https://www.delaroca.es/producto/llavero_pompon_granate_de_pelo_de_zorro/",
  "https://www.delaroca.es/producto/llavero_pompon_azul_claro_de_pelo_de_zorro/",
  "https://www.delaroca.es/producto/llavero_pompon_amarillo_de_pelo_de_zorro/",
  "https://www.delaroca.es/producto/llavero_pompon_negro_de_pelo_de_vison/",
  "https://www.delaroca.es/producto/llavero_pompon_marron_de_pelo_de_vison/",
  "https://www.delaroca.es/producto/llavero_pompon_gris_de_pelo_de_vison/",
  "https://www.delaroca.es/producto/llavero_pompon_blanco_de_pelo_de_zorro/"
];

const OUTPUT = 'imagenes.json';
const DELAY_MS = 1200;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function extractOgImage(html) {
  // Handles both attribute orderings: property first or content first
  let m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (!m) m = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return m ? m[1] : null;
}

async function scrape() {
  // Load existing progress if any
  let results = {};
  if (existsSync(OUTPUT)) {
    try {
      results = JSON.parse(readFileSync(OUTPUT, 'utf8'));
      console.log(`Retomando progreso: ${Object.keys(results).length} ya procesadas`);
    } catch {}
  }

  const pending = URLS.filter(u => !(u in results));
  console.log(`Pendientes: ${pending.length} de ${URLS.length} productos\n`);

  for (let i = 0; i < pending.length; i++) {
    const url = pending[i];
    process.stdout.write(`[${i + 1}/${pending.length}] ${url.replace('https://www.delaroca.es/producto/', '')} ... `);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DelaRocaBot/1.0)' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const img = extractOgImage(html);
      results[url] = img || null;
      console.log(img ? `OK` : 'sin imagen');
    } catch (e) {
      results[url] = null;
      console.log(`ERROR: ${e.message}`);
    }
    // Save after each request so progress is never lost
    writeFileSync(OUTPUT, JSON.stringify(results, null, 2), 'utf8');
    if (i < pending.length - 1) await sleep(DELAY_MS);
  }

  const found = Object.values(results).filter(Boolean).length;
  console.log(`\nFinalizado. ${found}/${URLS.length} imágenes encontradas.`);
  console.log(`Resultado guardado en: ${OUTPUT}`);
}

scrape().catch(console.error);
