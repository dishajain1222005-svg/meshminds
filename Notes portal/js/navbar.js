// js/navbar.js — injects the shared navbar into every page
// Usage: <script type="module" src="js/navbar.js"></script>

export function injectNavbar(base = '') {
  const html = `
  <nav class="navbar" id="mainNav" role="navigation" aria-label="Main navigation">
    <a class="navbar-brand" href="${base}index.html">
      <div class="navbar-logo">🧠</div>
      <span class="navbar-name">MeshMinds</span>
    </a>

    <div class="navbar-links">
      <a class="nav-link" href="${base}index.html"  data-page="index.html">Home</a>
      <a class="nav-link" href="${base}course.html" data-page="course.html">B.Tech</a>
    </div>

    <div class="navbar-right">
      <div class="theme-pill" aria-label="Theme selector">
        <button data-theme="light" title="Light mode">🌞</button>
        <button data-theme="dark"  title="Dark mode">🌙</button>
      </div>
      <button class="nav-hamburger" id="navHamburger" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>

  <div class="nav-drawer" id="navDrawer" aria-label="Mobile navigation">
    <a class="nav-link" href="${base}index.html"  data-page="index.html">🏠 Home</a>
    <a class="nav-link" href="${base}course.html" data-page="course.html">🎓 B.Tech</a>
  </div>`;

  document.body.insertAdjacentHTML('afterbegin', html);
}

// Auto-detect base path
const isAdmin = location.pathname.includes('/admin/');
injectNavbar(isAdmin ? '../' : '');
