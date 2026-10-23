/* Eventos GA4 para el seguimiento de la tienda de referidos (clics hacia delaroca.es) */
(function(){
  function euroANumero(txt){
    if(!txt) return undefined;
    var n = parseFloat(String(txt).replace(/\./g,'').replace(',','.').replace(/[^\d.]/g,''));
    return isNaN(n) ? undefined : n;
  }

  /* Etiquetas UTM para que el Analytics de delaroca.es sepa que la visita (y la venta) viene de esta web */
  function campania(){
    var p = location.pathname;
    if(p.indexOf('/blog') === 0) return 'blog';
    if(p.indexOf('/colecciones') === 0) return 'colecciones';
    if(p === '/' || p === '/index.html') return 'portada';
    return 'otras-paginas';
  }

  function etiquetar(a){
    if(a.dataset.utm === '1') return;
    var original = a.getAttribute('href');
    try {
      var url = new URL(a.href);
      if(url.pathname.indexOf('/wp-content/') === 0) return;
      /* /inicio redirige a la portada y esa redirección borra los parámetros UTM */
      if(url.pathname === '/inicio' || url.pathname === '/inicio/') url.pathname = '/';
      if(!url.searchParams.has('utm_source')){
        url.searchParams.set('utm_source', 'estolasparaeventos');
        url.searchParams.set('utm_medium', 'referral');
        url.searchParams.set('utm_campaign', campania());
        url.searchParams.set('utm_content', a.classList.contains('card') ? 'producto' : 'enlace');
      }
      a.dataset.hrefOriginal = original;
      a.dataset.utm = '1';
      a.href = url.toString();
    } catch(err) {}
  }

  /* Se etiqueta antes de navegar: clic normal, rueda (nueva pestaña), menú contextual, móvil y teclado */
  ['mousedown', 'touchstart', 'keydown', 'contextmenu'].forEach(function(tipo){
    document.addEventListener(tipo, function(e){
      if(tipo === 'keydown' && e.key !== 'Enter') return;
      var a = e.target.closest && e.target.closest('a[href*="delaroca.es"]');
      if(a) etiquetar(a);
    }, {capture: true, passive: true});
  });

  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href*="delaroca.es"]');
    if(!a) return;
    etiquetar(a);
    if(!window.gtag) return;
    var destino = a.dataset.hrefOriginal || a.href;

    if(a.classList.contains('card')){
      var nombreEl = a.querySelector('h3');
      var catEl = a.querySelector('.card-cat');
      var precioEl = a.querySelector('.precio-act');
      var categoria = catEl ? catEl.textContent.trim() : undefined;
      gtag('event', 'select_item', {
        item_list_name: categoria,
        items: [{
          item_id: destino,
          item_name: nombreEl ? nombreEl.textContent.trim() : undefined,
          item_category: categoria,
          price: euroANumero(precioEl ? precioEl.textContent : undefined)
        }]
      });
    } else {
      gtag('event', 'generate_lead', {
        link_url: destino,
        link_text: (a.textContent || '').trim().slice(0, 100)
      });
    }
  }, true);
})();
