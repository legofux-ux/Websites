import { createScene } from './scene.js';
import { FIGURES, MORALS } from './fables.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* --------------------------------------------------------------------------
   Text splitting (Zeichen für Titel, Wörter für Fließtext)
   -------------------------------------------------------------------------- */

function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  text.split(/(\s+)/).forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) { el.append(' '); return; }
    const word = document.createElement('span');
    word.className = 'word';
    for (const ch of part) {
      const mask = document.createElement('span');
      mask.className = 'char-mask';
      const c = document.createElement('span');
      c.className = 'char';
      c.textContent = ch;
      mask.append(c);
      word.append(mask);
    }
    el.append(word);
  });
  return $$('.char', el);
}

function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span');
          w.className = 'word';
          w.textContent = part;
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(el);
  return $$('.word', el);
}

$$('[data-split-chars]').forEach(splitChars);
$$('[data-split-words]').forEach(splitWords);

/* --------------------------------------------------------------------------
   Smooth Scroll
   -------------------------------------------------------------------------- */

let lenis = null;
if (!reduced && Lenis) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

$$('[data-scroll-to]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id && id.startsWith('#') ? $(id) : null;
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });
});

/* --------------------------------------------------------------------------
   3D-Szene
   -------------------------------------------------------------------------- */

let scene = null;
try {
  scene = createScene($('.webgl'));
} catch (err) {
  console.warn('WebGL nicht verfügbar – Seite läuft ohne 3D.', err);
}

let currentShape = 0;
function setShape(index, offset) {
  if (!scene) return;
  if (index !== currentShape) {
    currentShape = index;
    gsap.to(scene.uniforms.uMorph, { value: index, duration: reduced ? 0.01 : 2.2, ease: 'power2.inOut', overwrite: true });
  }
  if (offset !== undefined) {
    gsap.to(scene.state, { offsetX: offset, duration: reduced ? 0.01 : 2.4, ease: 'expo.inOut', overwrite: 'auto' });
  }
}

function pulse(amount = 1, duration = 1.2) {
  if (!scene) return;
  gsap.to(scene.uniforms.uPulse, { value: amount, duration: duration * 0.4, ease: 'power2.out', overwrite: true });
}
function calm() {
  if (!scene) return;
  gsap.to(scene.uniforms.uPulse, { value: 0, duration: 1.8, ease: 'power3.out', overwrite: true });
}

/* --------------------------------------------------------------------------
   Kapitel-Anzeige in der Navigation
   -------------------------------------------------------------------------- */

const chNum = $('.js-chapter-num');
const chName = $('.js-chapter-name');
let currentChapter = '00';
function setChapter(num, name) {
  if (!num || num === currentChapter) return;
  currentChapter = num;
  gsap.timeline()
    .to([chNum, chName], { yPercent: -100, opacity: 0, duration: 0.3, ease: 'power2.in', stagger: 0.04 })
    .add(() => { chNum.textContent = num; chName.textContent = name; })
    .fromTo([chNum, chName], { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.04 });
}

function activate(el) {
  const shape = Number(el.dataset.shape);
  const offset = el.dataset.offset !== undefined ? Number(el.dataset.offset) : undefined;
  setShape(shape, offset);
  setChapter(el.dataset.chapter, el.dataset.name);
}

/* --------------------------------------------------------------------------
   Intro
   -------------------------------------------------------------------------- */

function intro() {
  const count = $('.js-count');
  const counter = { v: 0 };
  const heroChars = $$('.hero__title .char');
  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);

  gsap.set(heroChars, { yPercent: 115 });
  gsap.set('[data-fade]', { opacity: 0, y: 16 });

  const loading = gsap.timeline()
    .to(counter, {
      v: 100,
      duration: reduced ? 0.2 : 1.6,
      ease: 'power2.inOut',
      onUpdate: () => { count.textContent = String(Math.round(counter.v)).padStart(3, '0'); },
    })
    .to('.loader__bar span', { scaleX: 1, duration: reduced ? 0.2 : 1.6, ease: 'power2.inOut' }, 0);

  Promise.all([fontsReady, new Promise((r) => loading.eventCallback('onComplete', r))]).then(() => {
    ScrollTrigger.refresh();
    const tl = gsap.timeline({
      onComplete: () => {
        document.body.classList.remove('is-loading');
        $('.loader').remove();
        if (lenis) lenis.start();
      },
    });
    tl.to('.loader__inner', { yPercent: -30, opacity: 0, duration: 0.7, ease: 'power3.in' })
      .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.2')
      .to(heroChars, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.06 }, '-=0.55')
      .to('[data-fade]', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }, '-=1.0');
    if (scene) {
      tl.to(scene.uniforms.uReveal, { value: 1, duration: 3.2, ease: 'power3.out' }, 0.6);
      tl.add(() => { scene.state.offsetX = 0.9; }, 0);
    }
  });
}
document.body.classList.add('is-loading');
gsap.set('.loader', { clipPath: 'inset(0 0 0% 0)' });
intro();

/* --------------------------------------------------------------------------
   Scroll-Choreografie
   -------------------------------------------------------------------------- */

// Fortschrittsleiste
gsap.to('.progress span', {
  scaleX: 1,
  ease: 'none',
  scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: 0.3 },
});

// Hero: Titel driftet beim Verlassen nach oben
gsap.to('.hero__title', {
  yPercent: -18,
  opacity: 0.15,
  ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
});

// Manifest: Wort für Wort „eingefärbt“
const manifestWords = $$('.manifest__text .word');
if (!reduced) {
  gsap.to(manifestWords, {
    opacity: 1,
    ease: 'none',
    stagger: 0.12,
    scrollTrigger: { trigger: '.manifest__text', start: 'top 78%', end: 'bottom 45%', scrub: true },
  });
}

// Kapitel: horizontale Erzählung
const chapters = $('.chapters');
const track = $('.chapters__track');
const panels = $$('.chapter');
const romans = ['I', 'II', 'III', 'IV'];
const chCurrent = $('.js-ch-current');
const distance = () => track.scrollWidth - window.innerWidth;

const hTween = gsap.to(track, {
  x: () => -distance(),
  ease: 'none',
  scrollTrigger: {
    trigger: chapters,
    pin: true,
    scrub: 1,
    start: 'top top',
    end: () => '+=' + distance() * 1.15,
    invalidateOnRefresh: true,
    onUpdate: (self) => gsap.set('.chapters__bar span', { scaleX: self.progress }),
  },
});

panels.forEach((panel, i) => {
  ScrollTrigger.create({
    trigger: panel,
    containerAnimation: hTween,
    start: 'left 55%',
    end: 'right 55%',
    onToggle: (self) => {
      // scrub hinkt hinterher – bei schnellen Sprüngen nicht die Sektion überschreiben
      if (!self.isActive || !hTween.scrollTrigger.isActive) return;
      activate(panel);
      chCurrent.textContent = romans[i];
    },
  });

  // Parallaxe innerhalb jedes Kapitels
  gsap.fromTo($('.chapter__num', panel), { xPercent: 30 }, {
    xPercent: -30,
    ease: 'none',
    scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true },
  });

  const parts = $$('.chapter__animal, .chapter__title, .chapter__line, .chapter__text', panel);
  gsap.from(parts, {
    x: 120,
    opacity: 0,
    stagger: 0.06,
    ease: 'power2.out',
    scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left 85%', end: 'left 35%', scrub: true },
  });
});

// Erst nach dem Pin anlegen, damit die Positionen den Pin-Abstand kennen
// Generische Reveals
$$('[data-reveal]').forEach((el) => {
  gsap.from(el, {
    y: 50,
    opacity: 0,
    duration: 1.3,
    ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
  });
});

// Vertikale Sektionen steuern die Form
$$('section[data-shape]').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 55%',
    end: 'bottom 45%',
    onToggle: (self) => { if (self.isActive) activate(sec); },
  });
});

// Epilog: Seite wird Nacht, Tinte wird Licht
const paper = { x: 0xf1 / 255, y: 0xed / 255, z: 0xe4 / 255 };
const ink = { x: 0x19 / 255, y: 0x18 / 255, z: 0x16 / 255 };
ScrollTrigger.create({
  trigger: '.finale',
  start: 'top 60%',
  onToggle: (self) => {
    document.body.classList.toggle('is-dark', self.isActive);
    if (!scene) return;
    const to = self.isActive ? paper : ink;
    gsap.to(scene.uniforms.uInk.value, { ...to, duration: 1, ease: 'power2.inOut', overwrite: true });
  },
});

const finaleChars = $$('.finale__title .char');
gsap.set(finaleChars, { yPercent: 115 });
ScrollTrigger.create({
  trigger: '.finale__title',
  start: 'top 80%',
  once: true,
  onEnter: () => gsap.to(finaleChars, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.025 }),
});

// Marquee mit Scroll-Trägheit
const marquee = gsap.to('.marquee__inner', { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
if (reduced) marquee.pause();

// Leichte Kippung der Form über die gesamte Seite + Geschwindigkeit aus Scroll
if (scene) {
  ScrollTrigger.create({
    trigger: document.documentElement,
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      scene.state.scrollRot = self.progress * Math.PI * 0.6;
      const v = Math.min(Math.abs(self.getVelocity()) / 400, 12);
      gsap.to(scene.state, { speed: 1 + v, duration: 0.4, overwrite: 'auto', onComplete: () => gsap.to(scene.state, { speed: 1, duration: 1.4 }) });
      marquee.timeScale(1 + v * 0.6 * (self.direction || 1));
      gsap.to(marquee, { timeScale: 1, duration: 1.2, overwrite: true });
    },
  });
}

/* --------------------------------------------------------------------------
   Haltung: Akkordeon
   -------------------------------------------------------------------------- */

$$('.principle').forEach((item) => {
  const head = $('.principle__head', item);
  const body = $('.principle__body', item);
  head.addEventListener('click', () => {
    const open = !item.classList.contains('is-open');
    $$('.principle.is-open').forEach((other) => {
      if (other === item) return;
      other.classList.remove('is-open');
      $('.principle__head', other).setAttribute('aria-expanded', 'false');
      gsap.to($('.principle__body', other), { height: 0, duration: 0.7, ease: 'expo.inOut' });
    });
    item.classList.toggle('is-open', open);
    head.setAttribute('aria-expanded', String(open));
    gsap.to(body, { height: open ? 'auto' : 0, duration: 0.8, ease: 'expo.inOut', onComplete: () => ScrollTrigger.refresh() });
    if (open) { pulse(0.35); setTimeout(calm, 400); }
  });
});

/* --------------------------------------------------------------------------
   Werkstatt: Fabel-Generator (vorbereitete Texte)
   -------------------------------------------------------------------------- */

const choice = { animal: 'fuchs', moral: 'geduld' };
$$('[data-group]').forEach((group) => {
  $$('.chip', group).forEach((chip) => {
    chip.addEventListener('click', () => {
      $$('.chip', group).forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      choice[group.dataset.group] = chip.dataset.value;
    });
  });
});

const tellBtn = $('.js-tell');
const story = $('.story');
const storyText = $('.js-story');
const storyMoral = $('.js-moral');
const status = $('.js-status');
let writing = null;

function compose() {
  const f = FIGURES[choice.animal];
  const m = MORALS[choice.moral];
  return { text: [f.opening, m.middle(f), m.end(f)].join(' '), moral: m.moral };
}

function typeText(text, onDone) {
  storyText.textContent = '';
  const out = document.createTextNode('');
  const caret = document.createElement('span');
  caret.className = 'story__caret';
  storyText.append(out, caret);
  let i = 0;
  let last = performance.now();
  let wait = 0;
  const step = (now) => {
    const dt = now - last;
    last = now;
    wait -= dt;
    while (wait <= 0 && i < text.length) {
      const ch = text[i++];
      out.textContent += ch;
      wait += /[.!?]/.test(ch) ? 260 : /[,–:]/.test(ch) ? 120 : 14 + Math.random() * 22;
    }
    if (i < text.length) writing = requestAnimationFrame(step);
    else { caret.remove(); onDone(); }
  };
  writing = requestAnimationFrame(step);
}

tellBtn.addEventListener('click', () => {
  if (writing) cancelAnimationFrame(writing);
  const { text, moral } = compose();
  tellBtn.disabled = true;
  storyMoral.textContent = '';
  story.classList.remove('is-writing');
  story.classList.add('is-thinking');
  status.textContent = 'Denkt nach …';
  storyText.innerHTML = '<span class="story__placeholder">…</span>';
  pulse(1);

  setTimeout(() => {
    story.classList.replace('is-thinking', 'is-writing');
    status.textContent = 'Schreibt …';
    calm();
    const finish = () => {
      writing = null;
      story.classList.remove('is-writing');
      status.textContent = `Fertig · ${text.split(/\s+/).length} Wörter`;
      storyMoral.textContent = moral;
      const chars = splitChars(storyMoral);
      gsap.from(chars, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.012 });
      tellBtn.disabled = false;
      ScrollTrigger.refresh();
    };
    if (reduced) { storyText.textContent = text; finish(); }
    else typeText(text, finish);
  }, reduced ? 0 : 1100);
});

/* --------------------------------------------------------------------------
   Cursor & magnetische Buttons
   -------------------------------------------------------------------------- */

if (finePointer && !reduced) {
  const cursor = $('.cursor');
  const dot = $('.cursor__dot');
  const ring = $('.cursor__ring');
  const label = $('.cursor__label');
  const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });

  window.addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    const interactive = e.target.closest('a, button');
    cursor.classList.toggle('is-label', !!labelled);
    cursor.classList.toggle('is-hover', !labelled && !!interactive);
    label.textContent = labelled ? labelled.dataset.cursor : '';
  });

  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

window.addEventListener('load', () => ScrollTrigger.refresh());
