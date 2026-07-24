/**
 * generate-blog.js
 * Genera una página HTML estática por cada artículo publicado de posts.json
 * (carpeta blog/<slug>.html) y regenera sitemap.xml con todas las páginas
 * del sitio + una entrada por artículo.
 *
 * Por qué: blog.html mostraba los artículos solo como overlay JS bajo
 * blog.html#post-N. Un fragmento "#" no es una URL distinta para Google:
 * los 30 artículos existían pero eran invisibles para el buscador como
 * páginas propias, sin título, descripción ni entrada en el sitemap.
 *
 * Uso:
 *   node scripts/generate-blog.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const POSTS_FILE = path.join(ROOT, 'posts.json');
const BLOG_DIR   = path.join(ROOT, 'blog');
const SITEMAP    = path.join(ROOT, 'sitemap.xml');
const SITE_URL   = 'https://estolasparaeventos.com';
const OG_IMAGE   = 'https://www.delaroca.es/wp-content/uploads/2025/10/250066-1.jpg';

function slugify(titulo) {
  return titulo
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatFecha(iso) {
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const d = new Date(iso + 'T12:00:00');
  return d.getDate() + ' de ' + meses[d.getMonth()] + ' de ' + d.getFullYear();
}

function metaDescripcion(resumen) {
  if (resumen.length <= 160) return resumen;
  return resumen.slice(0, 157).replace(/\s+\S*$/, '') + '…';
}

function escapeAttr(s) {
  return s.replace(/"/g, '&quot;');
}

function paginaPost(p, slug) {
  const url = `${SITE_URL}/blog/${slug}.html`;
  const desc = metaDescripcion(p.resumen);
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.titulo} | Blog Estolas para Eventos</title>
<meta name="description" content="${escapeAttr(desc)}">
<meta name="robots" content="index, follow">
<meta name="author" content="DE LA ROCA PELETEROS, S.L.">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${escapeAttr(p.titulo)}">
<meta property="og:description" content="${escapeAttr(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="article:published_time" content="${p.fecha}">
<meta property="article:section" content="${p.categoria}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(p.titulo)}">
<meta name="twitter:description" content="${escapeAttr(desc)}">
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
      "@type": "Article",
      "headline": ${JSON.stringify(p.titulo)},
      "description": ${JSON.stringify(desc)},
      "image": "${OG_IMAGE}",
      "datePublished": "${p.fecha}",
      "dateModified": "${p.fecha}",
      "articleSection": "${p.categoria}",
      "author": {"@type": "Organization", "name": "De La Roca Peleteros"},
      "publisher": {
        "@type": "Organization",
        "name": "Estolas para Eventos – De La Roca Peleteros",
        "logo": {"@type": "ImageObject", "url": "${OG_IMAGE}"}
      },
      "mainEntityOfPage": "${url}"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": "${SITE_URL}/"},
        {"@type": "ListItem", "position": 2, "name": "Blog", "item": "${SITE_URL}/blog.html"},
        {"@type": "ListItem", "position": 3, "name": ${JSON.stringify(p.titulo)}, "item": "${url}"}
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
.post-back{display:inline-flex;align-items:center;gap:.5rem;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gris);border:1px solid var(--arena);padding:.55rem 1.2rem;margin-bottom:2.5rem;transition:all .3s;}
.post-back:hover{border-color:var(--oro);color:var(--oro);}
.post-single{max-width:760px;margin:0 auto;padding:3.5rem 0 6rem;}
.post-single .post-cat{font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--oro);margin-bottom:.8rem;}
.post-single h1{font-family:var(--display);font-size:clamp(1.9rem,4vw,3rem);font-weight:500;line-height:1.15;color:var(--marron);margin-bottom:1rem;}
.post-single .post-fecha{font-size:.78rem;color:var(--arena);letter-spacing:.1em;padding-bottom:1.8rem;border-bottom:1px solid var(--crema-osc);margin-bottom:2rem;display:block;}
.post-contenido p{font-size:1rem;color:#3a2e22;line-height:1.8;margin-bottom:1.4rem;}
.post-contenido h2{font-family:var(--display);font-size:1.6rem;font-weight:600;color:var(--marron);margin:2.2rem 0 .9rem;}
.post-contenido h3{font-size:1.05rem;font-weight:500;color:var(--negro);margin:1.5rem 0 .6rem;letter-spacing:.05em;}
.post-contenido ul{padding-left:1.5rem;margin-bottom:1.2rem;}
.post-contenido li{font-size:1rem;color:#3a2e22;line-height:1.8;margin-bottom:.4rem;}
.blog-cta{background:var(--negro);color:var(--crema);text-align:center;padding:4rem 0;}
.blog-cta h2{font-family:var(--display);font-size:clamp(1.6rem,3.5vw,2.6rem);font-weight:500;margin-bottom:1rem;}
.blog-cta p{color:rgba(244,236,225,.75);margin-bottom:2rem;font-size:.95rem;}
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
@media(max-width:760px){.nav-links{display:none;}.hamburguesa{display:flex;}}
</style>
</head>
<body>

<div class="aviso-top">Blog de moda &nbsp;&middot;&nbsp; Peletería artesanal &nbsp;&middot;&nbsp; Eventos y tendencias</div>

<header>
  <div class="contenedor nav">
    <a href="../" class="logo">Estolas <span>para Eventos</span><small>Alta Peletería</small></a>
    <nav><ul class="nav-links">
      <li><a href="../#coleccion">Colección</a></li>
      <li><a href="../#confianza">Calidad</a></li>
      <li><a href="../blog.html" class="activo">Blog</a></li>
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

<section class="contenedor post-single">
  <a class="post-back" href="../blog.html">← Volver al blog</a>
  <p class="post-cat">${p.categoria}</p>
  <h1>${p.titulo}</h1>
  <span class="post-fecha">${formatFecha(p.fecha)}</span>
  <div class="post-contenido">${p.contenido}</div>
  <div style="margin-top:3rem;padding-top:2rem;border-top:1px solid var(--crema-osc);">
    <a class="post-back" href="../blog.html">← Volver al blog</a>
  </div>
</section>

<section class="blog-cta">
  <div class="contenedor">
    <h2>Descubre nuestra colección</h2>
    <p>Alta peletería artesanal para bodas, galas y eventos especiales.</p>
    <a href="../" class="btn">Ver catálogo completo</a>
  </div>
</section>

<footer>
  <div class="contenedor">
    <div class="footer-grid">
      <div><h5>Estolas para Eventos</h5><p>Blog y catálogo de alta peletería de la marca De La Roca. Artículos sobre moda, eventos y peletería artesanal sostenible.</p></div>
      <div><h5>Navegar</h5><p><a href="../">Catálogo de productos</a></p><p><a href="../blog.html">Blog</a></p><p><a href="https://www.delaroca.es" target="_blank" rel="noopener">Tienda oficial De La Roca</a></p></div>
      <div><h5>De La Roca</h5><p>DE LA ROCA PELETEROS, S.L.</p><p>Calle Lope de Rueda, 20 (Local)</p><p>28009 Madrid, España</p><p><a href="https://www.delaroca.es/inicio#contacto" target="_blank" rel="noopener">Formulario de contacto</a></p></div>
    </div>
    <div class="footer-legal">
      © <span id="anio"></span> DE LA ROCA PELETEROS, S.L. · NIF B81516031 · Calle Lope de Rueda, 20 Local, 28009 Madrid.<br>
      <a href="../aviso-legal.html">Aviso Legal</a> · <a href="../politica-privacidad.html">Política de Privacidad y Cookies</a>
    </div>
  </div>
</footer>

<script>
document.getElementById('anio').textContent = new Date().getFullYear();
(function(){
  const GA_ID = 'G-XB4NMN86N0';
  if(localStorage.getItem('cookies_consent')==='aceptadas'){
    const s=document.createElement('script');s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID;
    document.head.appendChild(s);
    window.dataLayer=window.dataLayer||[];
    function gtag(){dataLayer.push(arguments);}
    gtag('js',new Date());gtag('config',GA_ID);
  }
})();
const btn=document.getElementById('hamburguesa');
const menu=document.getElementById('menu-movil');
btn.addEventListener('click',()=>{
  const a=menu.classList.toggle('abierto');
  btn.classList.toggle('abierto',a);
  document.body.style.overflow=a?'hidden':'';
});
</script>
</body>
</html>
`;
}

function generarSitemap(postsPublicados, slugPorId) {
  const hoy = new Date().toISOString().split('T')[0];
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: hoy, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE_URL}/blog.html`, lastmod: hoy, changefreq: 'weekly', priority: '0.8' },
    ...postsPublicados.map(p => ({
      loc: `${SITE_URL}/blog/${slugPorId.get(p.id)}.html`,
      lastmod: p.fecha,
      changefreq: 'monthly',
      priority: '0.6',
    })),
    { loc: `${SITE_URL}/aviso-legal.html`, lastmod: '2026-05-22', changefreq: 'yearly', priority: '0.2' },
    { loc: `${SITE_URL}/politica-privacidad.html`, lastmod: '2026-05-22', changefreq: 'yearly', priority: '0.2' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n') +
    `\n</urlset>\n`;

  fs.writeFileSync(SITEMAP, xml, 'utf8');
}

function main() {
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
  const hoy = new Date().toISOString().split('T')[0];
  const publicados = posts.filter(p => p.fecha <= hoy);

  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

  const slugPorId = new Map();
  const slugsUsados = new Set();
  for (const p of publicados) {
    let slug = slugify(p.titulo);
    let candidato = slug, n = 2;
    while (slugsUsados.has(candidato)) { candidato = `${slug}-${n++}`; }
    slugsUsados.add(candidato);
    slugPorId.set(p.id, candidato);
  }

  let generadas = 0;
  for (const p of publicados) {
    const slug = slugPorId.get(p.id);
    fs.writeFileSync(path.join(BLOG_DIR, `${slug}.html`), paginaPost(p, slug), 'utf8');
    generadas++;
  }

  generarSitemap(publicados, slugPorId);

  console.log(`✓ ${generadas} páginas de blog generadas en /blog`);
  console.log(`✓ sitemap.xml actualizado (${publicados.length} artículos + páginas fijas)`);
}

main();
