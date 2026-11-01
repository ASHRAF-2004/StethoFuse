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
})();
