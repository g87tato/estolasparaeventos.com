/* Eventos GA4 para el seguimiento de la tienda de referidos (clics hacia delaroca.es) */
(function(){
  function euroANumero(txt){
    if(!txt) return undefined;
    var n = parseFloat(String(txt).replace(/\./g,'').replace(',','.').replace(/[^\d.]/g,''));
    return isNaN(n) ? undefined : n;
  }

  document.addEventListener('click', function(e){
    if(!window.gtag) return;
    var a = e.target.closest('a[href*="delaroca.es"]');
    if(!a) return;

    if(a.classList.contains('card')){
      var nombreEl = a.querySelector('h3');
      var catEl = a.querySelector('.card-cat');
      var precioEl = a.querySelector('.precio-act');
      var categoria = catEl ? catEl.textContent.trim() : undefined;
      gtag('event', 'select_item', {
        item_list_name: categoria,
        items: [{
          item_id: a.href,
          item_name: nombreEl ? nombreEl.textContent.trim() : undefined,
          item_category: categoria,
          price: euroANumero(precioEl ? precioEl.textContent : undefined)
        }]
      });
    } else {
      gtag('event', 'generate_lead', {
        link_url: a.href,
        link_text: (a.textContent || '').trim().slice(0, 100)
      });
    }
  }, true);
})();
