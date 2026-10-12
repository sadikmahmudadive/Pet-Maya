// Applies the saved/system colour theme before first paint. Loaded as a file
// (not inline) so the Content-Security-Policy can forbid inline scripts.
(function () {
  try {
    var s = localStorage.getItem('pm_theme');
    var dark = s === 'dark' || ((!s || s === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var t = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (e) { /* storage blocked: keep the default theme */ }
})();
