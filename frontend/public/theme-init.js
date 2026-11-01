// Appearance only: match the saved theme before the application paints.
(function () {
  var saved = 'system';
  try { saved = localStorage.getItem('sf-public-theme') || 'system'; } catch (_) {}
  var night = saved === 'midnight' || (saved !== 'frost' && matchMedia('(prefers-color-scheme: dark)').matches);
  var root = document.documentElement;
  var color = night ? '#171c1b' : '#ffffff';
  root.dataset.forestTheme = night ? 'night' : 'day';
  root.dataset.studioTheme = night ? 'dark' : 'light';
  var language = 'en';
  try { language = localStorage.getItem('sf-language') === 'ar' ? 'ar' : 'en'; } catch (_) {}
  root.lang = language;
  root.dir = language === 'ar' ? 'rtl' : 'ltr';
  root.style.backgroundColor = color;
  root.style.colorScheme = night ? 'dark' : 'light';
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = color;
  if (!document.getElementById('root')) {
    root.dataset.staticPreparing = 'true';
    // The public hero is discovered before the React/module dependency chain.
    if (location.pathname === '/') {
      root.dataset.publicHeroPending = 'true';
      var preload = document.createElement('link');
      preload.rel = 'preload'; preload.as = 'image';
      preload.href = '/assets/owl-poster-1163.webp';
      preload.fetchPriority = 'high';
      document.head.appendChild(preload);
    }
    return;
  }
  var target = document.getElementById('root');
  if (location.pathname === '/') {
    target.inert = true;
    var key = language + '-' + (night ? 'midnight' : 'frost');
    var variant = document.getElementById('public-' + key);
    if (variant) target.replaceChildren(variant.content.cloneNode(true));
    if (target.hasAttribute('data-prerender')) target.dataset.prerender = 'ready';
    var hero = target.querySelector('.listening-owl>img');
    // Do not expose partially decoded WebP rows on a slow connection.
    var revealHero = function () { delete root.dataset.publicHeroPending; };
    var heroReady = hero ? hero.decode().then(revealHero,revealHero) : Promise.resolve().then(revealHero);
  } else {
    target.inert = false;
    delete target.dataset.prerender;
    var text = language === 'ar' ? 'جارٍ تحميل StethoFuse…' : 'Loading StethoFuse…';
    target.innerHTML = '<div class="app-route-loading"><div class="workspace-loading" role="status" aria-live="polite"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" opacity=".2"/><path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>' + text + '</span></div></div>';
  }
  document.querySelectorAll('template[id^="public-"]').forEach(function (node) { node.remove(); });
  delete root.dataset.staticPreparing;
  // Start the compiled application; the entrance separately verifies owl readiness.
  var launch = function () {
    var modules = document.getElementById('application-modules');
    if (!modules) return;
    modules.content.querySelectorAll('link').forEach(function (node) { document.head.appendChild(node.cloneNode(true)); });
    modules.content.querySelectorAll('script').forEach(function (node) {
      var script = document.createElement('script');
      Array.from(node.attributes).forEach(function (attribute) { script.setAttribute(attribute.name,attribute.value); });
      script.addEventListener('error',function () { if (window.__sfApplicationFailed) window.__sfApplicationFailed(); });
      document.body.appendChild(script);
    });
    modules.remove();
  };
  // The entrance owns readiness; app modules and the public owl download can
  // proceed together rather than waiting for a static poster first.
  launch();
  var stalled = setTimeout(function () {
    if (root.dataset.application === 'hydrated') return;
    var panel = location.pathname === '/' ? null : target.querySelector('.workspace-loading');
    if (!panel) return;
    var retry = document.createElement('button'); retry.type = 'button';
    retry.textContent = language === 'ar' ? 'إعادة التحميل' : 'Reload page';
    retry.addEventListener('click',function () { location.reload(); });
    panel.appendChild(retry);
  }, 20000);
  document.addEventListener('sf-hydrated',function () { clearTimeout(stalled); },{once:true});
})();
