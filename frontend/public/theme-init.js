// Appearance only: match the saved theme before the application paints.
(function () {
  var saved = 'system';
  try { saved = localStorage.getItem('sf-public-theme') || 'system'; } catch (_) {}
  var night = saved === 'midnight' || (saved !== 'frost' && matchMedia('(prefers-color-scheme: dark)').matches);
  var root = document.documentElement;
  var color = night ? '#101f1c' : '#f3f5ef';
  root.dataset.forestTheme = night ? 'night' : 'day';
  root.style.backgroundColor = color;
  root.style.colorScheme = night ? 'dark' : 'light';
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = color;
})();
