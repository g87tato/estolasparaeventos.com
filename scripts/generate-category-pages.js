/**
 * generate-category-pages.js
 * Genera páginas de colección estáticas con URL propia (/colecciones/<slug>.html)
 * para las categorías/ocasiones con mayor volumen de búsqueda real confirmado
 * (Search Console + Google Ads Keyword Planner, sept 2026):
 *   - "estola de pelo" / "estola para boda"        1.000-10.000 búsquedas/mes
 *   - "capa de pelo para boda"                       100-1.000 búsquedas/mes
 *   - "cuello de pelo natural"                        100-1.000 búsquedas/mes
 *   - "chal para vestido de fiesta" / "chal para bodas" 100-10.000 búsquedas/mes
 *
 * Por qué: index.html es una sola página con un filtro en JavaScript sin URL
 * propia (?cat=... no existe), así que Google no puede indexar "estolas para
 * boda" como una página independiente aunque haya 1.000-10.000 búsquedas/mes
 * para ese término exacto. Estas páginas dan a cada término esa URL propia,
 * reutilizando el mismo catálogo (PRODUCTOS/IMAGENES) que ya vive en index.html.
 *
 * Uso:
 *   node scripts/generate-category-pages.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const INDEX_FILE = path.join(ROOT, 'index.html');
const OUT_DIR    = path.join(ROOT, 'colecciones');
const SITE_URL   = 'https://estolasparaeventos.com';
const OG_IMAGE   = 'https://www.delaroca.es/wp-content/uploads/2025/10/250066-1.jpg';

function extractBlock(html, marker, openChar, closeChar) {
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`No se encontró "${marker}" en index.html`);
  let depth = 0, i = start + marker.length, end = -1;
  for (; i < html.length; i++) {
    if (html[i] === openChar) depth++;
    else if (html[i] === closeChar) { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return JSON.parse(html.slice(start + marker.length, end));
}

function cargarCatalogo() {
  const html = fs.readFileSync(INDEX_FILE, 'utf8');
  const productos = extractBlock(html, 'const PRODUCTOS = ', '[', ']');
  const imagenes  = extractBlock(html, 'const IMAGENES = ', '{', '}');
  return { productos, imagenes };
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}

function tarjeta(p, imagenes) {
  const img = p.img || imagenes[p.url] || '';
  const visual = img
    ? `<img src="${img}" alt="${escapeAttr(p.nombre)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` +
      `<div class="fallback" style="display:none;"><div class="marca">De La Roca</div><div class="ftxt">${p.cat}</div></div>`
    : `<div class="fallback"><div class="marca">De La Roca</div><div class="ftxt">${p.cat}</div></div>`;
  return `<a class="card" href="${p.url}" target="_blank" rel="noopener">` +
    `<div class="card-img">${p.antes ? '<span class="etiqueta">Oferta</span>' : ''}${visual}</div>` +
    `<div class="card-cuerpo"><div class="card-cat">${p.cat}</div><h3>${p.nombre}</h3>` +
    `<div class="precios"><span class="precio-act">${p.precio}</span>${p.antes ? `<span class="precio-ant">${p.antes}</span>` : ''}</div>` +
    `<span class="ver">Ver producto</span></div></a>`;
}

// ── Definición de las páginas de colección ──────────────────────────────────
// filtro: función que selecciona los productos de PRODUCTOS a mostrar
const PAGINAS = [
{
  slug: 'estolas-de-pelo-para-boda',
  categoria: 'Estolas',
  filtro: p => p.cat === 'Estolas',
  titulo: 'Estolas de Pelo Natural para Boda',
  metaDescripcion: 'Estolas de pelo natural (visón, zorro, armiño) para invitadas de boda. Piezas artesanales de alta peletería De La Roca, en Madrid, para bodas de día y de noche.',
  h1: 'Estolas de pelo natural para boda',
  eyebrow: 'La pieza que resuelve el frío sin renunciar al estilo',
  intro: `<p>La estola es, con diferencia, el complemento más elegido por las invitadas de boda que buscan algo más que un simple abrigo de repuesto. Una pieza de pelo natural —visón, zorro o armiño— se coloca sobre los hombros, cae con los extremos sueltos por delante y resuelve dos problemas a la vez: el frío de las horas finales de la celebración y la falta de un punto de lujo discreto que distinga el conjunto.</p>
<p>A diferencia de un chal de tejido plano, una estola de pelo natural mantiene su volumen y su brillo durante toda la noche, no se aplasta al sentarse y envejece bien: una pieza bien cuidada se puede volver a llevar en la siguiente boda, en una gala o heredarse, algo que no ocurre con los complementos sintéticos pensados para un solo uso.</p>
<p>Cada estola de esta colección está fabricada artesanalmente por De La Roca Peleteros, peletería de referencia en Madrid con más de 30 años de oficio. Todas las piezas se muestran aquí con su precio y enlazan directamente a la ficha de producto en <a href="https://www.delaroca.es" target="_blank" rel="noopener">delaroca.es</a>, donde se formaliza la compra.</p>`,
  faq: [
    ['¿Qué diferencia hay entre una estola para boda de día y una de noche?',
     'En una boda de día se suelen preferir tonos claros y naturales —beige, champán, gris perla— y se reserva la estola para las horas finales, cuando baja la temperatura. En una boda de noche, la estola forma parte del look desde el principio y admite tonos más intensos o con brillo, como el zorro plateado o el visón oscuro. Lo explicamos con más detalle en <a href="../blog/como-vestir-en-una-boda-de-noche-guia-completa-de-estilo-para-invitadas.html">esta guía sobre cómo vestir en una boda de noche</a>.'],
    ['¿Dónde comprar una estola de pelo natural en España?',
     'Todas las estolas de esta colección son piezas de De La Roca Peleteros, peletería artesanal con tienda física en Madrid (Calle Lope de Rueda, 20) y venta online a través de delaroca.es, con envíos a toda España.'],
    ['¿Cuánto cuesta una estola de pelo natural?',
     'El precio varía según el tipo de piel y la longitud de la pieza. En esta colección encontrarás estolas desde los 400€ hasta piezas de zorro argenté de alta gama por encima de los 1.800€. Cada tarjeta muestra el precio actualizado.'],
    ['¿Qué es exactamente una estola?',
     'Una estola es una pieza alargada de pelo natural que se coloca sobre los hombros y cae con los dos extremos sueltos por delante, sin cierre. Es la opción más versátil de la alta peletería para bodas, galas y vestidos de noche. Si quieres profundizar, tenemos una <a href="../blog/estola-capa-o-chal-que-son-y-en-que-se-diferencian.html">guía completa sobre estola, capa y chal</a>.'],
  ],
},
{
  slug: 'capas-de-pelo-para-boda',
  categoria: 'Capas',
  filtro: p => p.cat === 'Capas',
  titulo: 'Capas de Pelo Natural para Boda',
  metaDescripcion: 'Capas de pelo natural para invitadas de boda: más abrigo y presencia que una estola, ideales para ceremonias al aire libre y vestidos de espalda descubierta.',
  h1: 'Capas de pelo natural para boda',
  eyebrow: 'Más abrigo y más presencia que una estola',
  intro: `<p>Cuando la boda es en una finca, en un jardín o en cualquier ceremonia al aire libre, una capa de pelo natural suele ser una opción más práctica que una estola: cubre toda la espalda, en muchos casos parte de los brazos, y se sujeta con un broche o un lazo delantero en lugar de quedar suelta sobre los hombros.</p>
<p>Es también la elección más acertada para vestidos con la espalda descubierta, donde una estola convencional tiende a resbalar. La capa deja la espalda visible mientras protege del frío el resto del cuerpo, y aporta una silueta con más volumen y presencia visual que resulta especialmente favorecedora en fotografías.</p>
<p>Las capas de esta colección están confeccionadas por De La Roca Peleteros combinando pelo natural —zorro, visón— con lana y otros tejidos nobles. Cada pieza enlaza a su ficha completa en <a href="https://www.delaroca.es" target="_blank" rel="noopener">delaroca.es</a>.</p>`,
  faq: [
    ['¿Cuándo elegir una capa en vez de una estola para una boda?',
     'La capa es la opción más acertada en ceremonias al aire libre, bodas en finca o castillo, y con vestidos de espalda descubierta, porque ofrece más abrigo real y se sujeta al cuerpo en lugar de quedar suelta. La estola, en cambio, es más versátil para bodas en interior. Lo comparamos en detalle en <a href="../blog/estola-capa-o-chal-que-son-y-en-que-se-diferencian.html">esta guía sobre estola, capa y chal</a>.'],
    ['¿Las capas de pelo natural sirven para bodas de invierno?',
     'Sí, de hecho es donde más se lucen: la capa ofrece más superficie de abrigo que una estola o un cuello, lo que la convierte en la opción más práctica para bodas de otoño e invierno o ceremonias en exteriores con temperaturas bajas.'],
    ['¿Cómo debe caer una capa para que quede bien?',
     'El punto crítico es la línea de hombros: debe coincidir exactamente con la anchura de quien la lleva. Una capa demasiado ancha pierde estructura y una demasiado estrecha tira del cierre delantero.'],
  ],
},
{
  slug: 'cuellos-de-pelo-natural',
  categoria: 'Cuellos',
  filtro: p => p.cat === 'Cuellos',
  titulo: 'Cuellos de Pelo Natural',
  metaDescripcion: 'Cuellos de pelo natural artesanales de De La Roca: la forma más sutil de introducir la alta peletería en el día a día, con abrigos, vestidos de cóctel o eventos.',
  h1: 'Cuellos de pelo natural',
  eyebrow: 'La pieza más versátil de la alta peletería',
  intro: `<p>El cuello de pelo natural es la versión más pequeña y discreta de la peletería: rodea la base del cuello sin caer sobre los hombros, se cierra con un gancho o un lazo interior que lo fija en la posición exacta, y funciona tanto con un abrigo de diario como con un vestido de cóctel o una prenda de gala.</p>
<p>Es, además, la pieza con la que más clientas empiezan a introducir la alta peletería en su armario: al ser más pequeña que una estola o una capa, resulta más fácil de combinar y de llevar durante todo el año, no solo en ocasiones especiales.</p>
<p>Cada cuello de esta colección está fabricado por De La Roca Peleteros en pieles como el zorro, el visón o la marmota finlandesa. Puedes ver el precio y la ficha completa de cada pieza directamente en <a href="https://www.delaroca.es" target="_blank" rel="noopener">delaroca.es</a>.</p>`,
  faq: [
    ['¿Cómo se coloca un cuello de piel natural?',
     'Un buen cuello artesanal incluye un gancho o un lazo interior que permite fijarlo justo en la base del cuello, sin apretar y sin dejar espacios visibles entre la piel y la prenda de debajo, evitando que se desplace durante el día o la noche.'],
    ['¿Se puede llevar un cuello de pelo natural en entretiempo?',
     'Sí. Al ser una pieza pequeña, el cuello de pelo natural resulta menos abrigado que una estola o una capa, lo que lo hace apropiado también para entretiempo, sobre una chaqueta ligera o un vestido de cóctel en interiores.'],
    ['¿Qué diferencia un cuello de una estola?',
     'El cuello rodea únicamente la base del cuello, sin caer sobre los hombros; la estola es una pieza más larga que sí cae con los extremos sueltos por delante. Lo explicamos con más detalle en <a href="../blog/estola-capa-o-chal-que-son-y-en-que-se-diferencian.html">esta guía sobre estola, capa y chal</a>.'],
  ],
},
{
  slug: 'bufandas-y-chales-de-fiesta',
  categoria: 'Bufandas',
  filtro: p => p.cat === 'Bufandas',
  titulo: 'Bufandas y Chales de Pelo para Vestidos de Fiesta',
  metaDescripcion: 'Bufandas y boas de pelo natural para vestidos de fiesta y de noche. El complemento ligero de alta peletería De La Roca para bodas, galas y cenas de gala.',
  h1: 'Bufandas y chales de pelo natural para vestidos de fiesta',
  eyebrow: 'El complemento ligero para tu vestido de fiesta',
  intro: `<p>Cuando el vestido de fiesta pide un complemento más ligero que una estola pero con más textura que un chal de tejido plano, una bufanda o boa de pelo natural es la opción intermedia perfecta. Se anuda al cuello o se deja caer sobre un hombro, y aporta ese punto de volumen y brillo que distingue un look de fiesta de uno de calle.</p>
<p>Es también la pieza más versátil para reutilizar: una bufanda de pelo natural funciona igual de bien con un vestido de gala que con un abrigo de diario, lo que la convierte en una de las inversiones más rentables dentro de la alta peletería.</p>
<p>Cada bufanda y boa de esta colección está confeccionada por De La Roca Peleteros en pieles como el visón o el zorro. Todas las piezas enlazan a su ficha completa en <a href="https://www.delaroca.es" target="_blank" rel="noopener">delaroca.es</a>.</p>`,
  faq: [
    ['¿Qué complemento de pelo llevar con un vestido de fiesta?',
     'Depende del tejido y del escote del vestido. Para vestidos de tejido ligero (gasa, chifón, seda), una bufanda o estola de pelo natural añade estructura sin sobrecargar el conjunto. Lo desarrollamos en <a href="../blog/estola-capa-o-chal-que-son-y-en-que-se-diferencian.html">esta guía sobre estola, capa y chal</a>.'],
    ['¿Cómo se anuda una bufanda de pelo natural?',
     'Las formas más habituales son: al cuello con un nudo simple, cruzada por delante sujeta con un broche, o dejada caer suelta sobre un solo hombro para un efecto más informal.'],
    ['¿Una bufanda de pelo natural sirve para una boda de invierno?',
     'Sí, aunque para bodas con temperaturas muy bajas se suele preferir una estola o una capa, que cubren más superficie. La bufanda es la opción más ligera dentro de la peletería, más apropiada para interiores con calefacción o entretiempo.'],
  ],
},
];

function paginaColeccion(pagina, productos, imagenes) {
  const lista = productos.filter(pagina.filtro);
  const url = `${SITE_URL}/colecciones/${pagina.slug}.html`;
  const faqHtml = pagina.faq.map(([q, a]) => `<h3>${q}</h3><p>${a}</p>`).join('\n');
  const faqSchema = pagina.faq.map(([q, a]) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') },
  }));
  const itemListSchema = lista.slice(0, 40).map((p, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    url: p.url,
    name: p.nombre,
  }));

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${pagina.titulo} | Estolas para Eventos</title>
<meta name="description" content="${escapeAttr(pagina.metaDescripcion)}">
<meta name="robots" content="index, follow">
<meta name="author" content="DE LA ROCA PELETEROS, S.L.">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${escapeAttr(pagina.titulo)} | Estolas para Eventos">
<meta property="og:description" content="${escapeAttr(pagina.metaDescripcion)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(pagina.titulo)}">
<meta name="twitter:description" content="${escapeAttr(pagina.metaDescripcion)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="apple-touch-icon" href="../favicon.svg">
<link rel="manifest" href="../site.webmanifest">
<meta name="theme-color" content="#241c14">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "${url}",
      "name": ${JSON.stringify(pagina.titulo)},
      "description": ${JSON.stringify(pagina.metaDescripcion)},
      "url": "${url}",
      "isPartOf": {"@id": "${SITE_URL}/#website"}
    },
    {
      "@type": "ItemList",
      "itemListElement": ${JSON.stringify(itemListSchema)}
    },
    {
      "@type": "FAQPage",
      "mainEntity": ${JSON.stringify(faqSchema)}
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": "${SITE_URL}/"},
        {"@type": "ListItem", "position": 2, "name": ${JSON.stringify(pagina.h1)}, "item": "${url}"}
      ]
    }
  ]
}
</script>
<style>
:root{--negro:#241c14;--marron:#5c3d24;--marron-claro:#8a6442;--crema:#f4ece1;--crema-osc:#e7dac8;--arena:#cbb295;--oro:#a9763f;--oro-claro:#c79a5f;--gris:#7a6a58;--blanco:#fbf7f1;--sombra:0 20px 45px -20px rgba(36,28,20,.4);--display:'Cormorant Garamond',Georgia,serif;--texto:'Jost',system-ui,sans-serif;}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:var(--texto);color:var(--negro);background:var(--crema);line-height:1.65;font-weight:300;-webkit-font-smoothing:antialiased;}
a{color:inherit;text-decoration:none;}
.contenedor{width:90%;max-width:1280px;margin:0 auto;}
.aviso-top{background:var(--negro);color:var(--crema);text-align:center;font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;padding:.7rem 1rem;font-weight:400;}
header{position:sticky;top:0;z-index:50;background:rgba(244,236,225,.94);backdrop-filter:blur(10px);border-bottom:1px solid var(--crema-osc);}
.nav{display:flex;align-items:center;justify-content:space-between;padding:1.1rem 0;}
.logo{font-family:var(--display);font-size:1.75rem;font-weight:600;letter-spacing:.04em;line-height:1;color:var(--marron);}
.logo span{color:var(--oro);font-style:italic;}
.logo small{display:block;font-family:var(--texto);font-size:.6rem;letter-spacing:.35em;text-transform:uppercase;color:var(--gris);margin-top:.35rem;font-weight:400;}
.nav-links{display:flex;gap:2rem;list-style:none;font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;}
.nav-links a{position:relative;padding-bottom:3px;transition:color .3s;}
.nav-links a::after{content:'';position:absolute;left:0;bottom:0;width:0;height:1px;background:var(--oro);transition:width .3s;}
.nav-links a:hover,.nav-links a.activo{color:var(--oro);}
.nav-links a:hover::after,.nav-links a.activo::after{width:100%;}
.pagina-cab{padding:3.2rem 0 1.5rem;text-align:center;}
.pagina-cab .migas{font-size:.75rem;letter-spacing:.1em;color:var(--gris);margin-bottom:1.4rem;}
.pagina-cab .migas a{color:var(--oro);}
.pagina-cab .eyebrow{font-size:.72rem;letter-spacing:.35em;text-transform:uppercase;color:var(--oro);margin-bottom:1rem;}
.pagina-cab h1{font-family:var(--display);font-size:clamp(2rem,4.5vw,3.2rem);font-weight:500;color:var(--marron);margin-bottom:1.4rem;}
.intro-texto{max-width:760px;margin:0 auto;text-align:left;}
.intro-texto p{color:#3a2e22;margin-bottom:1.1rem;font-size:1rem;}
.separador{width:60px;height:1px;background:var(--oro);margin:2.2rem auto;}
.productos{padding:1rem 0 5.5rem;}
.contador{text-align:center;font-size:.78rem;letter-spacing:.15em;text-transform:uppercase;color:var(--gris);margin-bottom:2.5rem;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(265px,1fr));gap:2.5rem 1.8rem;}
.card{background:var(--blanco);overflow:hidden;display:flex;flex-direction:column;transition:transform .4s,box-shadow .4s;box-shadow:0 2px 12px rgba(36,28,20,.07);border-radius:2px;}
.card:hover{transform:translateY(-6px);box-shadow:var(--sombra);}
.card-img{position:relative;aspect-ratio:4/5;overflow:hidden;background:linear-gradient(135deg,var(--crema-osc),var(--arena));}
.card-img img{width:100%;height:100%;object-fit:cover;transition:transform .8s ease;display:block;}
.card:hover .card-img img{transform:scale(1.06);}
.card-img .fallback{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:1.5rem;background:linear-gradient(135deg,#3c2818,#5c3d24);color:var(--crema);}
.card-img .fallback .marca{font-family:var(--display);font-size:1.5rem;font-style:italic;color:var(--oro-claro);margin-bottom:.5rem;}
.card-img .fallback .ftxt{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;opacity:.75;line-height:1.5;}
.etiqueta{position:absolute;top:14px;left:14px;z-index:2;background:var(--negro);color:var(--crema);font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;padding:.4rem .8rem;font-weight:400;}
.card-cuerpo{padding:1.4rem 1.3rem 1.6rem;display:flex;flex-direction:column;flex:1;}
.card-cat{font-size:.64rem;letter-spacing:.22em;text-transform:uppercase;color:var(--oro);margin-bottom:.5rem;}
.card h3{font-family:var(--display);font-size:1.28rem;font-weight:500;line-height:1.28;margin-bottom:.9rem;color:var(--negro);}
.precios{margin-top:auto;display:flex;align-items:baseline;gap:.6rem;margin-bottom:1.1rem;flex-wrap:wrap;}
.precio-act{font-size:1.3rem;font-weight:400;color:var(--marron);}
.precio-ant{font-size:.88rem;color:#b3a48f;text-decoration:line-through;}
.ver{display:block;text-align:center;border:1px solid var(--marron);padding:.8rem;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;font-weight:500;transition:background .3s,color .3s;color:var(--marron);}
.card:hover .ver{background:var(--marron);color:var(--crema);}
.faq{background:var(--blanco);padding:4.5rem 0;}
.faq-inner{max-width:760px;margin:0 auto;}
.faq h2{font-family:var(--display);font-size:clamp(1.7rem,3.5vw,2.4rem);font-weight:500;color:var(--marron);margin-bottom:2rem;text-align:center;}
.faq h3{font-size:1.02rem;font-weight:500;color:var(--negro);margin:1.6rem 0 .5rem;letter-spacing:.02em;}
.faq p{font-size:.96rem;color:#3a2e22;line-height:1.75;}
.confianza{background:var(--negro);color:var(--crema);padding:5rem 0;}
.confianza-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:3rem;text-align:center;}
.conf-item .num{font-family:var(--display);font-size:2.6rem;color:var(--oro-claro);font-style:italic;margin-bottom:.6rem;}
.conf-item h4{font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;font-weight:500;margin-bottom:.6rem;}
.conf-item p{font-size:.9rem;color:rgba(244,236,225,.72);}
.cta{text-align:center;padding:6rem 0;}
.cta .eyebrow{font-size:.72rem;letter-spacing:.35em;text-transform:uppercase;color:var(--oro);margin-bottom:1.2rem;}
.cta h2{font-family:var(--display);font-size:clamp(2rem,4vw,3.2rem);font-weight:500;margin-bottom:1.4rem;color:var(--marron);}
.cta p{max-width:520px;margin:0 auto 2.4rem;color:var(--gris);}
.btn{display:inline-block;background:var(--oro);color:var(--blanco);padding:1rem 2.4rem;font-size:.78rem;letter-spacing:.2em;text-transform:uppercase;font-weight:500;border:none;cursor:pointer;transition:background .3s,transform .3s;}
.btn:hover{background:var(--marron-claro);transform:translateY(-2px);}
footer{background:var(--crema-osc);padding:3.5rem 0 2rem;font-size:.85rem;color:var(--gris);}
.footer-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2rem;margin-bottom:2.5rem;}
footer h5{font-family:var(--display);font-size:1.2rem;color:var(--marron);margin-bottom:.9rem;font-weight:600;}
footer a:hover{color:var(--oro);}
.footer-legal{border-top:1px solid #d3c4ad;padding-top:1.5rem;text-align:center;font-size:.78rem;line-height:1.8;}
.hamburguesa{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:4px;z-index:200;}
.hamburguesa span{display:block;width:24px;height:2px;background:var(--marron);transition:all .3s;}
.hamburguesa.abierto span:nth-child(1){transform:translateY(7px) rotate(45deg);}
.hamburguesa.abierto span:nth-child(2){opacity:0;}
.hamburguesa.abierto span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}
.menu-movil{display:none;position:fixed;inset:0;background:var(--crema);z-index:100;flex-direction:column;align-items:center;justify-content:center;gap:2.2rem;}
.menu-movil.abierto{display:flex;}
.menu-movil a{font-family:var(--display);font-size:2rem;font-weight:500;color:var(--marron);letter-spacing:.04em;transition:color .3s;}
.menu-movil a:hover{color:var(--oro);}
.menu-movil .separador-menu{width:40px;height:1px;background:var(--arena);}
@media(max-width:760px){.nav-links{display:none;}.hamburguesa{display:flex;}.grid{grid-template-columns:repeat(2,1fr);gap:1.2rem;}}
#cookie-banner{position:fixed;bottom:0;left:0;right:0;z-index:999;background:var(--negro);color:var(--crema);padding:1.2rem 1.5rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;box-shadow:0 -4px 24px rgba(0,0,0,.3);}
#cookie-banner p{margin:0;font-size:.82rem;line-height:1.5;flex:1;min-width:240px;}
#cookie-banner p a{color:var(--oro-claro);text-decoration:underline;}
.cookie-btns{display:flex;gap:.7rem;flex-shrink:0;}
.cookie-btn-aceptar{background:var(--oro);color:var(--blanco);border:none;padding:.65rem 1.6rem;font-family:var(--texto);font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;font-weight:500;transition:background .3s;}
.cookie-btn-aceptar:hover{background:var(--marron-claro);}
.cookie-btn-rechazar{background:transparent;color:var(--crema);border:1px solid rgba(244,236,225,.35);padding:.65rem 1.2rem;font-family:var(--texto);font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:border-color .3s;}
.cookie-btn-rechazar:hover{border-color:var(--arena);}
</style>
</head>
<body>

<div class="aviso-top">Peleter&iacute;a artesanal espa&ntilde;ola &nbsp;&middot;&nbsp; Fabricaci&oacute;n uno a uno &nbsp;&middot;&nbsp; Marca De La Roca</div>

<header>
  <div class="contenedor nav">
    <a href="../" class="logo">Estolas <span>para Eventos</span><small>Alta Peletería</small></a>
    <nav><ul class="nav-links">
      <li><a href="../#coleccion">Colección</a></li>
      <li><a href="../#confianza">Calidad</a></li>
      <li><a href="../blog.html">Blog</a></li>
      <li><a href="../#contacto">Contacto</a></li>
      <li><a href="https://www.delaroca.es" target="_blank" rel="noopener">De La Roca</a></li>
    </ul></nav>
    <button class="hamburguesa" id="hamburguesa" aria-label="Abrir menú">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

<div class="menu-movil" id="menu-movil">
  <a href="../">Catálogo</a>
  <div class="separador-menu"></div>
  <a href="../blog.html">Blog</a>
  <div class="separador-menu"></div>
  <a href="../#contacto">Contacto</a>
  <div class="separador-menu"></div>
  <a href="https://www.delaroca.es" target="_blank" rel="noopener">De La Roca &rarr;</a>
</div>

<section class="pagina-cab contenedor">
  <p class="migas"><a href="../">Inicio</a> &rsaquo; ${pagina.h1}</p>
  <p class="eyebrow">${pagina.eyebrow}</p>
  <h1>${pagina.h1}</h1>
  <div class="separador"></div>
  <div class="intro-texto">${pagina.intro}</div>
</section>

<section class="productos contenedor">
  <div class="contador">${lista.length} ${lista.length === 1 ? 'pieza' : 'piezas'} en esta colección</div>
  <div class="grid">${lista.map(p => tarjeta(p, imagenes)).join('')}</div>
</section>

<section class="faq">
  <div class="contenedor faq-inner">
    <h2>Preguntas frecuentes</h2>
    ${faqHtml}
  </div>
</section>

<section class="confianza" id="confianza">
  <div class="contenedor confianza-grid">
    <div class="conf-item"><div class="num">Eco</div><h4>Sostenible</h4><p>Pieles de muy alta calidad, totalmente trazables y de origen ecológico y responsable.</p></div>
    <div class="conf-item"><div class="num">Artesanal</div><h4>Hecho a mano</h4><p>Cada pieza se fabrica una a una por profesionales altamente cualificados.</p></div>
    <div class="conf-item"><div class="num">+30</div><h4>Años de oficio</h4><p>La experiencia de De La Roca, peletería de referencia en Madrid.</p></div>
    <div class="conf-item"><div class="num">Madrid</div><h4>Atención cercana</h4><p>Tienda física en el corazón de Madrid y envíos a toda España.</p></div>
  </div>
</section>

<section class="cta contenedor" id="contacto">
  <p class="eyebrow">¿Buscas algo especial?</p>
  <h2>¿No encuentras el color o modelo que buscas?</h2>
  <p>Fabricamos bajo encargo. Cuéntanos qué necesitas para tu evento y nuestro equipo de peleteros te ayudará a encontrar la pieza perfecta.</p>
  <a href="https://www.delaroca.es/inicio#contacto" target="_blank" rel="noopener" class="btn">Contactar con De La Roca</a>
</section>

<footer>
  <div class="contenedor">
    <div class="footer-grid">
      <div><h5>Estolas para Eventos</h5><p>Selección de alta peletería de la marca De La Roca. Estolas, bufandas, cuellos, capas y complementos de pelo natural para tus ocasiones más especiales.</p></div>
      <div><h5>Colecciones</h5><p><a href="../colecciones/estolas-de-pelo-para-boda.html">Estolas para boda</a></p><p><a href="../colecciones/capas-de-pelo-para-boda.html">Capas para boda</a></p><p><a href="../colecciones/cuellos-de-pelo-natural.html">Cuellos de pelo natural</a></p><p><a href="../colecciones/bufandas-y-chales-de-fiesta.html">Bufandas y chales de fiesta</a></p><p><a href="../">Ver catálogo completo</a></p></div>
      <div><h5>Más</h5><p><a href="../blog.html">Blog de moda y eventos</a></p><p><a href="https://www.delaroca.es" target="_blank" rel="noopener">Tienda oficial De La Roca</a></p><p><a href="../#contacto">Contacto</a></p></div>
    </div>
    <div class="footer-legal">
      © <span id="anio"></span> DE LA ROCA PELETEROS, S.L. · NIF B81516031 · Calle Lope de Rueda, 20 Local, 28009 Madrid.<br>
      Todos los derechos reservados. Productos comercializados a través de <a href="https://www.delaroca.es" target="_blank" rel="noopener">delaroca.es</a>.<br>
      <a href="../aviso-legal.html">Aviso Legal</a> · <a href="../politica-privacidad.html">Política de Privacidad y Cookies</a>
    </div>
  </div>
</footer>

<div id="cookie-banner" style="display:none" role="dialog" aria-label="Aviso de cookies">
  <p>Usamos cookies propias y de an&aacute;lisis para mejorar tu experiencia. Al hacer clic en &laquo;Aceptar&raquo; consientes el uso de cookies de Google Analytics. <a href="../politica-privacidad.html">Pol&iacute;tica de cookies</a>.</p>
  <div class="cookie-btns">
    <button class="cookie-btn-aceptar" onclick="aceptarCookies()">Aceptar todas</button>
    <button class="cookie-btn-rechazar" onclick="rechazarCookies()">Solo necesarias</button>
  </div>
</div>
<script>
document.getElementById('anio').textContent = new Date().getFullYear();
const GA_ID = 'G-XB4NMN86N0';
function cargarGA(){
  if(window.__ga_loaded) return;
  window.__ga_loaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);
  gtag('event','view_item_list',{item_list_name:${JSON.stringify(pagina.categoria)}});
}
(function(){
  const v = localStorage.getItem('cookies_consent');
  if(!v) document.getElementById('cookie-banner').style.display='flex';
  else if(v==='aceptadas') cargarGA();
})();
function aceptarCookies(){
  localStorage.setItem('cookies_consent','aceptadas');
  document.getElementById('cookie-banner').style.display='none';
  cargarGA();
}
function rechazarCookies(){
  localStorage.setItem('cookies_consent','basicas');
  document.getElementById('cookie-banner').style.display='none';
}
const btn=document.getElementById('hamburguesa');
const menu=document.getElementById('menu-movil');
btn.addEventListener('click',()=>{
  const a=menu.classList.toggle('abierto');
  btn.classList.toggle('abierto',a);
  document.body.style.overflow=a?'hidden':'';
});
</script>
<script src="/tracking-eventos.js" defer></script>
</body>
</html>
`;
}

function main() {
  const { productos, imagenes } = cargarCatalogo();
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const pagina of PAGINAS) {
    const html = paginaColeccion(pagina, productos, imagenes);
    fs.writeFileSync(path.join(OUT_DIR, `${pagina.slug}.html`), html, 'utf8');
    const n = productos.filter(pagina.filtro).length;
    console.log(`✓ colecciones/${pagina.slug}.html (${n} productos)`);
  }
}

main();
module.exports = { PAGINAS };
