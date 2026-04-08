/* ===== Scroll-reveal ===== */
document.addEventListener('DOMContentLoaded', () => {
  /* Intersection Observer for fade-in / stagger */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll('.fade-in, .stagger').forEach((el) => observer.observe(el));

  /* Mobile nav toggle */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open'));
    });
    links.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => links.classList.remove('open'))
    );
  }

  /* Mark active nav link */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* Tabs */
  document.querySelectorAll('.tabs').forEach((tabWrapper) => {
    const buttons = tabWrapper.querySelectorAll('.tab-btn');
    const parent = tabWrapper.parentElement;
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        parent.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
        const target = parent.querySelector('#' + btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });
  });

  /* Accordion */
  document.querySelectorAll('.accordion-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      item.classList.toggle('open');
    });
  });
});
