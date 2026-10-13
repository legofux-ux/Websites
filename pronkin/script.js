// Pronkin — Reveals, Farbtonfächer und der Schadenmelder.

(() => {
  // Teile eines Abschnitts kommen nacheinander herein (60–90 ms Abstand)
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
