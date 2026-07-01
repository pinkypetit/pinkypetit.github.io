(function(){
  'use strict';

  /* Keys whose Spanish/English value legitimately contains markup (e.g. <strong>) and
     therefore need innerHTML. Every other data-i18n key is set via textContent, per
     TECH_RECOMMENDATIONS.md's i18n spec (avoids reparsing / any XSS surface). */
  var HTML_KEYS = { bio: true };

  /* ---------- Language toggle (data-i18n) ---------- */
  var langToggle = document.getElementById('langToggle');

  /* Cache the original Spanish HTML FIRST, before any English swap could overwrite it —
     otherwise a returning visitor whose saved preference is English would corrupt the
     Spanish cache with English text on load. */
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    el.setAttribute('data-i18n-es-cache', el.innerHTML);
  });

  function applyLang(lang){
    document.documentElement.lang = lang;
    var nodes = document.querySelectorAll('[data-i18n]');
    nodes.forEach(function(el){
      var key = el.getAttribute('data-i18n');
      var value = lang === 'en' && I18N_EN[key] !== undefined
        ? I18N_EN[key]
        : el.getAttribute('data-i18n-es-cache');
      if (HTML_KEYS[key]) { el.innerHTML = value; } else { el.textContent = value; }
    });
  }

  var isEn = document.documentElement.lang === 'en';
  if (isEn) { langToggle.classList.add('is-en'); langToggle.setAttribute('aria-pressed', 'true'); applyLang('en'); }
  /* Reveal the page now that any needed English swap has already happened — see the
     matching html.lang-en-pref rule in styles.css and the blocking script in <head>. */
  document.body.style.visibility = 'visible';

  langToggle.addEventListener('click', function(){
    isEn = !isEn;
    langToggle.classList.toggle('is-en', isEn);
    langToggle.setAttribute('aria-pressed', isEn ? 'true' : 'false');
    var lang = isEn ? 'en' : 'es';
    applyLang(lang);
    try { localStorage.setItem('jpl-lang', lang); } catch(e){}
    if (overlay.classList.contains('is-open') && currentCardId) {
      renderModal(currentCardId);
    }
  });

  /* ---------- Identity flip ---------- */
  var identity = document.getElementById('identity');
  function toggleIdentity(){
    var flipped = identity.classList.toggle('is-flipped');
    identity.setAttribute('aria-pressed', flipped ? 'true' : 'false');
  }
  identity.addEventListener('click', toggleIdentity);
  identity.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleIdentity(); }
  });

  /* ---------- Scroll reveal ---------- */
  var cards = document.querySelectorAll('.card');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    cards.forEach(function(c){ io.observe(c); });
  } else {
    cards.forEach(function(c){ c.classList.add('is-visible'); });
  }

  /* ---------- Modal ---------- */
  var overlay = document.getElementById('modalOverlay');
  var modalPanel = overlay.querySelector('.modal-panel');
  var modalCarousel = document.getElementById('modalCarousel');
  var modalCarouselTrack = document.getElementById('modalCarouselTrack');
  var modalCarouselPrev = document.getElementById('modalCarouselPrev');
  var modalCarouselNext = document.getElementById('modalCarouselNext');
  var modalCarouselDots = document.getElementById('modalCarouselDots');
  var modalTag = document.getElementById('modalTag');
  var modalTitle = document.getElementById('modalTitle');
  var modalBody = document.getElementById('modalBody');
  var modalLinks = document.getElementById('modalLinks');
  var modalEmbed = document.getElementById('modalEmbed');
  var modalClose = document.getElementById('modalClose');
  var lastFocused = null;
  var currentCardId = null;
  var lastRenderedId = null;
  var carouselCount = 0;

  /* Carousel: a horizontally-snapping scroll track driven by both native touch/trackpad
     swipe (CSS scroll-snap) and the prev/next/dot controls below, which just call
     scrollTo() — there is one source of truth (scrollLeft), not a separate "current index"
     state that could drift out of sync with what the user actually swiped to. */
  function currentSlideIndex(){
    var w = modalCarouselTrack.clientWidth;
    return w ? Math.round(modalCarouselTrack.scrollLeft / w) : 0;
  }
  function goToSlide(index, smooth){
    if (!carouselCount) return;
    var i = ((index % carouselCount) + carouselCount) % carouselCount;
    modalCarouselTrack.scrollTo({ left: i * modalCarouselTrack.clientWidth, behavior: smooth === false ? 'auto' : 'smooth' });
  }
  function updateActiveDot(){
    var i = currentSlideIndex();
    Array.prototype.forEach.call(modalCarouselDots.children, function(dot, idx){
      dot.classList.toggle('is-active', idx === i);
    });
  }
  modalCarouselPrev.addEventListener('click', function(){ goToSlide(currentSlideIndex() - 1); });
  modalCarouselNext.addEventListener('click', function(){ goToSlide(currentSlideIndex() + 1); });
  modalCarouselTrack.addEventListener('scroll', updateActiveDot);

  function renderModal(id){
    var data = CARD_DATA[id];
    if (!data) return;
    var lang = isEn ? 'en' : 'es';
    var content = data[lang];
    var photos = data.photos || [];
    var sameCard = id === lastRenderedId;
    var prevIndex = (sameCard && carouselCount) ? currentSlideIndex() : 0;

    modalCarouselTrack.innerHTML = '';
    modalCarouselDots.innerHTML = '';
    carouselCount = photos.length;
    photos.forEach(function(src, i){
      var img = document.createElement('img');
      img.src = src;
      img.alt = photos.length > 1 ? content.title + ' — ' + (i + 1) + '/' + photos.length : content.title;
      modalCarouselTrack.appendChild(img);
      if (photos.length > 1) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'modal-carousel-dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', (isEn ? 'Go to photo ' : 'Ir a la foto ') + (i + 1));
        dot.addEventListener('click', function(){ goToSlide(i); });
        modalCarouselDots.appendChild(dot);
      }
    });
    modalCarousel.hidden = photos.length === 0;
    modalCarouselPrev.hidden = modalCarouselNext.hidden = modalCarouselDots.hidden = photos.length < 2;
    if (photos.length) { goToSlide(sameCard ? prevIndex : 0, false); }
    lastRenderedId = id;

    modalTag.textContent = content.tag;
    modalTitle.textContent = content.title;
    modalBody.textContent = content.body;

    modalLinks.innerHTML = '';
    (content.links || []).forEach(function(link){
      var a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = '→ ' + link.label;
      modalLinks.appendChild(a);
    });

    if (data.embed_html) {
      /* Real LinkedIn "Embed this post" markup, authored by us — not user input, so
         innerHTML is safe here. Embedded content stays in its original language
         regardless of the site's current language (per spec: incrustados no se traducen). */
      modalEmbed.innerHTML = data.embed_html;
      modalEmbed.hidden = false;
    } else {
      modalEmbed.innerHTML = '';
      modalEmbed.hidden = true;
    }
  }

  function getModalFocusable(){
    return Array.prototype.slice.call(
      modalPanel.querySelectorAll('a[href], button:not([hidden])')
    ).filter(function(el){ return el.offsetParent !== null; });
  }

  function trapTabKey(e){
    if (e.key !== 'Tab') return;
    var focusable = getModalFocusable();
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function openModal(id){
    currentCardId = id;
    lastFocused = document.activeElement;
    renderModal(id);
    overlay.classList.add('is-open');
    modalClose.focus();
  }
  function closeModal(){
    overlay.classList.remove('is-open');
    currentCardId = null;
    if (lastFocused) { lastFocused.focus(); }
  }

  cards.forEach(function(card){
    card.addEventListener('click', function(){ openModal(card.getAttribute('data-id')); });
  });
  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function(e){
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (carouselCount > 1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      goToSlide(currentSlideIndex() + (e.key === 'ArrowRight' ? 1 : -1));
      return;
    }
    trapTabKey(e);
  });
})();
