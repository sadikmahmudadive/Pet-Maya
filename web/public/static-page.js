// Theme handling for the static pages (about, privacy policy). Kept in a file,
// not inline, so the site's Content-Security-Policy can forbid inline scripts.
(function () {
  var KEY = 'petmaya_theme';
  function apply(dark) {
    var t = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    if (document.body) document.body.setAttribute('data-theme', t);
    var btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = dark ? '☀️' : '🌙';
  }
  function init() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(saved === 'dark' || (!saved && prefersDark));
    var btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        var dark = document.documentElement.getAttribute('data-theme') !== 'dark';
        apply(dark);
        try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch (e) { /* ignore */ }
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
