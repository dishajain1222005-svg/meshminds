// js/ui.js — Shared UI: navbar, mobile menu, scroll reveal, animations

document.addEventListener('DOMContentLoaded', () => {

  /* ── Mobile nav drawer ─────────────────────────── */
  const hamburger = document.getElementById('navHamburger');
  const drawer    = document.getElementById('navDrawer');

  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      drawer.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', drawer.classList.contains('open'));
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !drawer.contains(e.target)) {
        drawer.classList.remove('open');
      }
    });

    // Close on nav link click
    drawer.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => drawer.classList.remove('open'));
    });
  }

  /* ── Active nav link ───────────────────────────── */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    if (link.dataset.page === currentPage) {
      link.classList.add('active');
    }
  });

  /* ── Scroll reveal ─────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
  } else {
    // Fallback: show all
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }

  /* ── Navbar scroll shadow ──────────────────────── */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const updateNav = () => {
      navbar.style.boxShadow = window.scrollY > 20
        ? '0 4px 24px rgba(0,0,0,0.18)'
        : 'none';
    };
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  /* ── Scroll-to-top button ──────────────────────── */
  const scrollBtn = document.createElement('button');
  scrollBtn.id = 'scrollTopBtn';
  scrollBtn.title = 'Back to top';
  scrollBtn.innerHTML = '↑';
  document.body.appendChild(scrollBtn);

  window.addEventListener('scroll', () => {
    scrollBtn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ── Animate counter numbers (hero stats) ──────── */
  function animateCount(el, target, suffix) {
    let start = 0;
    const duration = 1600;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        animateCount(el, target, suffix);
        obs.unobserve(el);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
  });

});
