// ============ FECHAS CLAVE ============
const TRIP_DATE = new Date('2026-11-13T04:15:00-06:00');
const DEADLINE_ANTICIPO = new Date('2026-09-03T23:59:59-06:00');
const DEADLINE_TOTAL = new Date('2026-10-29T23:59:59-06:00');

function daysUntil(target) {
  const now = new Date();
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ============ COUNTDOWN HERO ============
function renderCountdown() {
  const now = new Date();
  let diff = Math.max(0, TRIP_DATE - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v).padStart(2, '0'); };
  set('cd-d', d); set('cd-h', h); set('cd-m', m); set('cd-s', s);
}
renderCountdown();
setInterval(renderCountdown, 1000);

// ============ DIAS RESTANTES PARA PAGOS ============
(function renderDeadlines() {
  const a = document.getElementById('days-anticipo');
  const t = document.getElementById('days-total');
  const da = daysUntil(DEADLINE_ANTICIPO);
  const dt = daysUntil(DEADLINE_TOTAL);
  if (a) a.textContent = da > 0 ? `Quedan ${da} días` : 'Fecha límite vencida';
  if (t) t.textContent = dt > 0 ? `Quedan ${dt} días` : 'Fecha límite vencida';
})();

// ============ PROGRESS BAR ============
const progressBar = document.getElementById('progress');
function updateProgress() {
  const h = document.documentElement;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  if (progressBar) progressBar.style.width = scrolled + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

// ============ NAV: fondo al hacer scroll ============
window.addEventListener('scroll', () => {
  document.querySelector('.nav')?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ============ MENU MOVIL ============
function toggleMenu() { document.getElementById('mobile-nav')?.classList.toggle('open'); }
function closeMenu() { document.getElementById('mobile-nav')?.classList.remove('open'); }
document.querySelectorAll('.mobile-nav a').forEach(a => a.addEventListener('click', closeMenu));

// ============ NAV ACTIVO SEGUN SECCION VISIBLE ============
const sections = document.querySelectorAll('main .card, .hero');
const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav a');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    }
  });
}, { threshold: 0.5 });
sections.forEach(s => { if (s.id) sectionObserver.observe(s); });

// ============ SCROLL-IN ANIMATIONS ============
const animObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      animObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('[data-anim]').forEach(el => animObserver.observe(el));

// ============ FAQ ACORDEON ============
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  q.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// ============ GALERIA: CARRUSEL + LIGHTBOX ============
const TOTAL_FOTOS = 16;
let lightboxIndex = 1;

function scrollCarousel(dir) {
  const track = document.getElementById('gallery-carousel');
  if (!track) return;
  const tile = track.querySelector('.tile');
  const step = tile ? tile.getBoundingClientRect().width + 16 : 240;
  track.scrollBy({ left: dir * step, behavior: 'smooth' });
}

function renderLightbox() {
  const tile = document.getElementById('lightbox-tile');
  if (!tile) return;
  tile.innerHTML = '';
  const img = document.createElement('img');
  img.src = `v${lightboxIndex}.jpg`;
  img.alt = `Foto viaje anterior ${lightboxIndex}`;
  img.draggable = false;
  img.oncontextmenu = () => false;
  tile.appendChild(img);
}

function openLightbox(index) {
  lightboxIndex = index;
  renderLightbox();
  document.getElementById('lightbox')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(event) {
  if (event && event.target.closest('.lightbox-tile')) return;
  document.getElementById('lightbox')?.classList.remove('open');
  document.body.style.overflow = '';
}

function lightboxStep(event, dir) {
  event.stopPropagation();
  lightboxIndex = ((lightboxIndex - 1 + dir + TOTAL_FOTOS) % TOTAL_FOTOS) + 1;
  renderLightbox();
}

document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') lightboxStep(e, 1);
  if (e.key === 'ArrowLeft') lightboxStep(e, -1);
});

// Disuade el clic derecho / arrastre sobre las fotos. Esto NO impide guardarlas
// de forma definitiva (capturas de pantalla, DevTools, etc. siempre pueden hacerlo).
document.querySelectorAll('.gallery-carousel .tile, .lightbox-tile').forEach(el => {
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('dragstart', e => e.preventDefault());
});

// ============ PARALLAX (solo móvil, reemplaza el stacking cards) ============
const mobileQuery = window.matchMedia('(max-width: 640px)');
const parallaxCards = document.querySelectorAll('main .card');
let parallaxTicking = false;

function applyParallax() {
  parallaxTicking = false;
  if (!mobileQuery.matches) {
    parallaxCards.forEach(card => { card.querySelector('.card-inner').style.transform = ''; });
    return;
  }
  const vh = window.innerHeight;
  parallaxCards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const progress = Math.max(-1, Math.min(1, (vh / 2 - center) / vh));
    card.querySelector('.card-inner').style.transform = `translateY(${progress * 26}px)`;
  });
}

function queueParallax() {
  if (!parallaxTicking) {
    parallaxTicking = true;
    requestAnimationFrame(applyParallax);
  }
}

window.addEventListener('scroll', queueParallax, { passive: true });
window.addEventListener('resize', queueParallax);
applyParallax();
