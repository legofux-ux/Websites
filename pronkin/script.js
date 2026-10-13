// Pronkin — Bewegung, Kopfzeile, Farbtonfächer und der Schadenmelder.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = !!(window.gsap && window.ScrollTrigger);

/* ---------- Reveals (immer, auch ohne GSAP) ---------- */

(() => {
  document.querySelectorAll('section').forEach((section) => {
    section.querySelectorAll('[data-reveal]').forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 6) * 80}ms`));
  });

  const targets = document.querySelectorAll('[data-reveal], .fan');
  const show = (el) => el.classList.add(el.classList.contains('fan') ? 'is-open' : 'is-in');
  if (!('IntersectionObserver' in window)) { targets.forEach(show); return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      show(entry.target);
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
  targets.forEach((el) => io.observe(el));
  window.addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) show(el); });
  }, 2500));
})();

/* ---------- Kopfzeile: Farbe je Abschnitt, Uhrzeit in Pocking ---------- */

(() => {
  const header = document.querySelector('.top');
  const chapters = document.querySelectorAll('[data-ink]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) document.documentElement.style.setProperty('--header-ink', e.target.dataset.ink);
    }, { rootMargin: '0px 0px -94% 0px', threshold: 0 });
    chapters.forEach((el) => io.observe(el));
  }

  const clock = document.querySelector('.js-clock');
  const fmt = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 15000);

  // Beim Herunterscrollen weg, beim Hochscrollen wieder da
  let last = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    header.classList.toggle('is-hidden', y > last && y > innerHeight * 0.6);
    last = y;
  }, { passive: true });
})();

/* ---------- Kontakt: Telefonnummer in Ziffern zerlegen ---------- */

const digits = (() => {
  const el = document.querySelector('.contact-number');
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const out = [];
  for (const ch of text) {
    const mask = document.createElement('span');
    mask.className = 'digit-mask';
    mask.setAttribute('aria-hidden', 'true');
    const d = document.createElement('span');
    d.className = 'digit';
    d.textContent = ch === ' ' ? ' ' : ch;
    mask.append(d);
    el.append(mask);
    out.push(d);
  }
  return out;
})();

/* ---------- Choreografie (GSAP) ---------- */

if (hasGsap && !reduced) {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Weiches Scrollen
  if (window.Lenis) {
    const lenis = new window.Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.4 });
    }));
  }

  // Vorhang: blaues Feld mit dem Namen, dann hoch
  const curtain = document.querySelector('.curtain');
  gsap.timeline({ onComplete: () => curtain.remove() })
    .from('.curtain-word', { yPercent: 100, duration: 0.6, ease: 'expo.out' })
    .to(curtain, { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, '+=0.15')
    .from('.top', { yPercent: -100, duration: 0.6, ease: 'expo.out' }, '-=0.3');

  const mm = gsap.matchMedia();

  mm.add('(min-width: 721px)', () => {
    // Die beiden Zeilen gehen beim Scrollen auseinander
    const lines = gsap.utils.toArray('.hero-title .line');
    gsap.to(lines[0], { xPercent: -14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to(lines[1], { xPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Der Hof öffnet sich vom Fenster rechts auf die ganze Breite
    const yard = document.querySelector('.yard');
    yard.classList.add('is-stage');
    const photo = yard.querySelector('.yard-photo');
    const caption = yard.querySelector('.yard-caption');
    photo.classList.add('is-in');
    caption.classList.add('is-in');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: yard, start: 'top top', end: '+=110%', pin: true, scrub: 0.6 },
    });
    tl.fromTo(photo, { clipPath: 'inset(12% 2.2% 12% 36%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut' })
      .fromTo(photo.querySelector('img'), { scale: 1.18 }, { scale: 1, ease: 'none' }, 0)
      .to(caption, { opacity: 0, x: -40, ease: 'power1.in', duration: 0.35 }, 0);
    return () => { yard.classList.remove('is-stage'); gsap.set([photo, caption], { clearProps: 'all' }); };
  });

  // Fotos im Paar: zwei Geschwindigkeiten
  gsap.to('.pair-a', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.pair', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('.pair-b', { yPercent: -22, ease: 'none', scrollTrigger: { trigger: '.pair', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.utils.toArray('.about-photos .photo img').forEach((img, i) => {
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.set(img, { scale: 1.14 });
  });

  // Laufband: läuft immer, Scrollen schiebt es an
  const band = gsap.to('.band-track', { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    trigger: '.band', start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = Math.min(Math.abs(self.getVelocity()) / 300, 6);
      gsap.to(band, { timeScale: (1 + v) * (self.direction || 1), duration: 0.25, overwrite: true });
      gsap.to(band, { timeScale: 1, duration: 1.2, delay: 0.25 });
    },
  });

  // Ablauf: angeheftet, ein Schritt nach dem anderen wird hell
  mm.add('(min-width: 721px)', () => {
    const steps = gsap.utils.toArray('.stairs li');
    steps.forEach((s) => s.classList.add('is-in'));
    gsap.set(steps, { opacity: 0.18 });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '.steps', start: () => (document.querySelector('.steps').offsetHeight > innerHeight ? 'bottom bottom' : 'top top'), end: '+=' + steps.length * 28 + '%', pin: true, scrub: 0.5 },
    });
    steps.forEach((s, i) => {
      tl.fromTo(s, { opacity: 0.18, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, i);
      if (i < steps.length - 1) tl.to(s, { opacity: 0.35, duration: 0.6 }, i + 1);
    });
    tl.to({}, { duration: 0.5 });
    return () => gsap.set(steps, { clearProps: 'all' });
  });

  // Das Auto fährt in den Schadenmelder
  const car = document.querySelector('.car');
  const rims = car.querySelectorAll('.spokes');
  gsap.set(rims, { transformOrigin: '50% 50%', transformBox: 'fill-box' });
  gsap.timeline({ scrollTrigger: { trigger: '.report-car', start: 'top 80%', once: true } })
    .from(car, { xPercent: -110, duration: 1.8, ease: 'power3.out' })
    .from(rims, { rotation: -900, duration: 1.8, ease: 'power3.out' }, 0);

  // Telefonnummer: Ziffer für Ziffer
  gsap.from(digits, {
    yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.04,
    scrollTrigger: { trigger: '.contact-number', start: 'top 90%', once: true },
  });

  // Footer-Wortmarke wächst beim Aufdecken leicht
  gsap.fromTo('.footer-word', { scale: 0.92, transformOrigin: '50% 100%' }, {
    scale: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'bottom bottom', end: 'bottom top', scrub: true },
  });

  // Magnetische Buttons
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.button').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
} else {
  document.querySelector('.curtain')?.remove();
  document.documentElement.style.setProperty('--intro', '150ms');
}

/* ---------- Farbtonfächer: die Gruppe im Blick hebt ihr Blatt ---------- */

(() => {
  const fan = document.querySelector('.fan');
  const blades = fan.querySelectorAll('.blade');
  const groups = document.querySelectorAll('.group[data-blade]');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const n = Number(e.target.dataset.blade);
      blades.forEach((b, i) => b.classList.toggle('is-lift', i === n));
      fan.classList.add('has-focus');
    }
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  groups.forEach((g) => io.observe(g));
})();

/* ---------- Schadenmelder ---------- */

(() => {
  const form = document.querySelector('.report-form');
  if (!form) return;

  const PHONE_INTL = '4915901760716';
  const state = { part: '', kind: '' };
  const panels = document.querySelectorAll('.car .panel');
  const chips = form.querySelectorAll('.chip');
  const carInput = form.querySelector('input[name="car"]');
  const text = form.querySelector('.message-text');
  const sms = form.querySelector('[data-send="sms"]');
  const wa = form.querySelector('[data-send="wa"]');

  chips.forEach((chip) => chip.setAttribute('aria-pressed', 'false'));

  function message() {
    const where = state.part ? ` am Bauteil „${state.part}“` : ' an meinem Auto';
    const what = state.kind ? `${state.kind === 'Delle' ? 'eine' : 'einen'} ${state.kind}` : 'einen Schaden';
    const car = carInput.value.trim();
    let m = `Hallo, ich habe ${what}${where}.`;
    if (car) m += ` Fahrzeug: ${car}.`;
    m += ' Ein Foto schicke ich gleich mit. Wann hätten Sie Zeit?';
    return m;
  }

  function render() {
    const m = message();
    text.textContent = m;
    const body = encodeURIComponent(m);
    // iOS liest „&body=“, Android „?body=“ – beides funktioniert mit „?&body=“
    sms.href = `sms:+${PHONE_INTL}?&body=${body}`;
    wa.href = `https://wa.me/${PHONE_INTL}?text=${body}`;

    panels.forEach((p) => p.classList.toggle('is-on', p.dataset.part === state.part));
    chips.forEach((c) => {
      const group = c.parentElement.dataset.group;
      c.setAttribute('aria-pressed', String(state[group] === c.dataset.value));
    });
  }

  function pick(group, value) {
    state[group] = state[group] === value ? '' : value;
    render();
  }

  panels.forEach((panel) => {
    const choose = () => {
      pick('part', panel.dataset.part);
      panel.classList.remove('is-pop');
      void panel.getBBox();
      panel.classList.add('is-pop');
    };
    panel.addEventListener('click', choose);
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
    });
  });

  chips.forEach((chip) => chip.addEventListener('click', () => pick(chip.parentElement.dataset.group, chip.dataset.value)));
  carInput.addEventListener('input', render);
  render();
})();
