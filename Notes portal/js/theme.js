// js/theme.js — MeshMinds theme system
(function () {
  const root = document.documentElement;

  function setTheme(t) {
    root.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    // Update pill button active states
    document.querySelectorAll('.theme-pill button').forEach(b => {
      b.classList.toggle('active-theme', b.dataset.theme === t);
    });
    // Legacy toggle buttons
    const bLight = document.getElementById('light');
    const bDark  = document.getElementById('dark');
    if (bLight) bLight.classList.toggle('active-theme', t === 'light');
    if (bDark)  bDark.classList.toggle('active-theme',  t === 'dark');
  }

  // Apply immediately (before DOMContentLoaded) to avoid flash
  setTheme(localStorage.getItem('theme') || 'dark');

  document.addEventListener('DOMContentLoaded', () => {
    setTheme(localStorage.getItem('theme') || 'dark');

    // Wire pill buttons
    document.querySelectorAll('.theme-pill button[data-theme]').forEach(b => {
      b.addEventListener('click', () => setTheme(b.dataset.theme));
    });

    // Legacy buttons
    const bLight = document.getElementById('light');
    const bDark  = document.getElementById('dark');
    if (bLight) bLight.addEventListener('click', () => setTheme('light'));
    if (bDark)  bDark.addEventListener('click',  () => setTheme('dark'));
  });
})();
