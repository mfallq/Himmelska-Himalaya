// Apply the saved theme before first paint. Kept in its own file (not inline)
// so the page works under a strict Content-Security-Policy.
try {
  var saved = JSON.parse(localStorage.getItem('hh:v1') || '{}');
  if (saved.settings && saved.settings.theme) document.documentElement.dataset.theme = saved.settings.theme;
} catch (e) {}
