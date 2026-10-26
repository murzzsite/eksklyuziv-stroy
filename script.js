const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/T3TCYCL4NB';

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // старт: герой собирается после загрузки главной картинки
  const heroImg = $('.hero__img img');
  const ready = () => document.documentElement.classList.add('is-ready');
  if (heroImg && !heroImg.complete) { heroImg.addEventListener('load', ready, { once: true }); setTimeout(ready, 1200); }
  else requestAnimationFrame(() => requestAnimationFrame(ready));
  document.documentElement.classList.add('is-ready-fallback');

  // шапка
  const top = $('#top');
  const burger = $('#burger');
  const nav = $('#nav');
  const onScroll = () => top.classList.toggle('scrolled', window.scrollY > 24 || nav.classList.contains('is-open'));
  burger?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.textContent = open ? 'Закрыть' : 'Меню';
    top.classList.toggle('menu-open', open);
    onScroll();
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open'); top.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false'); burger.textContent = 'Меню'; onScroll();
  }));

  // плавный якорь
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 56, behavior: reduce ? 'auto' : 'smooth' });
  }));

  // появление блоков
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
  }), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('[data-r]').forEach(el => io.observe(el));
  const shutterIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); shutterIO.unobserve(e.target);
  }), { threshold: 0.2 });
  $$('[data-shutter]').forEach(el => shutterIO.observe(el));

  // счётчики
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; countIO.unobserve(el);
    const to = parseInt(el.dataset.count, 10);
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now();
    const tick = t => {
      const p = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.5 });
  $$('[data-count]').forEach(el => { if (!reduce) el.textContent = '0'; countIO.observe(el); });

  // силуэт Бештау: линия рисуется по мере прокрутки
  const sky = $('#sky');
  const line = $('#skyLine');
  const dots = $$('.dot', sky);
  let len = 0;
  if (line) { len = line.getTotalLength(); line.style.strokeDasharray = len; }
  const drawSky = () => {
    if (!line || reduce) { dots.forEach(d => d.classList.add('on')); if (line) line.style.strokeDashoffset = 0; return; }
    const r = sky.getBoundingClientRect(), vh = innerHeight;
    const p = clamp((vh * 0.9 - r.top) / (r.height + vh * 0.25), 0, 1);
    line.style.strokeDashoffset = len * (1 - p);
    [100, 300, 500, 700, 900].forEach((x, i) => dots[i].classList.toggle('on', p >= x / 1000 - 0.02));
  };

  // лёгкий параллакс картинок
  const pars = $$('[data-par]');
  const par = () => {
    if (reduce) return;
    const vh = innerHeight;
    pars.forEach(img => {
      const box = img.parentElement.getBoundingClientRect();
      if (box.bottom < -100 || box.top > vh + 100) return;
      const k = parseFloat(img.dataset.par);
      const off = (box.top + box.height / 2 - vh / 2) * -k;
      img.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
    });
    const hi = $('.hero__img');
    if (hi && window.scrollY < innerHeight * 1.2) hi.style.transform = `translate3d(0, ${(window.scrollY * 0.22).toFixed(1)}px, 0)`;
  };

  let ticking = false;
  const frame = () => { ticking = false; onScroll(); drawSky(); par(); };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame);
  frame();

  // калькулятор семейной ипотеки
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
  const rub = n => fmt(n) + ' ₽';
  const price = $('#price'), down = $('#down'), term = $('#term');
  const out = { pay: $('#pay'), rate: $('#rate'), downSum: $('#downSum'), loan: $('#loan'), over: $('#over') };
  let shown = 0, raf = 0;
  const tween = to => {
    cancelAnimationFrame(raf);
    if (reduce) { shown = to; out.pay.textContent = fmt(to); return; }
    const from = shown, t0 = performance.now();
    const step = t => {
      const p = Math.min(1, (t - t0) / 450);
      shown = from + (to - from) * (1 - Math.pow(1 - p, 3));
      out.pay.textContent = fmt(shown);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  const calc = () => {
    const rate = parseFloat($('input[name="kids"]:checked').value);
    const P = +price.value, d = +down.value, years = +term.value;
    const L = P * (1 - d / 100), n = years * 12, r = rate / 100 / 12;
    const pay = L * r / (1 - Math.pow(1 + r, -n));
    $('#priceV').textContent = rub(P);
    $('#downV').textContent = d + ' %';
    $('#termV').textContent = years + ' ' + (years % 10 === 1 && years !== 11 ? 'год' : (years % 10 >= 2 && years % 10 <= 4 && (years < 12 || years > 14)) ? 'года' : 'лет');
    out.rate.textContent = String(rate).replace('.', ',') + ' %' + (rate === 1.95 ? ' и ниже по лоту' : '');
    out.rate.textContent = (rate === 1.95 ? 'от ' : '') + String(rate).replace('.', ',') + ' %';
    out.downSum.textContent = rub(P * d / 100);
    out.loan.textContent = rub(L);
    out.over.textContent = rub(pay * n - L);
    tween(pay);
  };
  [price, down, term].forEach(el => el.addEventListener('input', calc));
  $$('input[name="kids"]').forEach(el => el.addEventListener('change', calc));
  calc();

  // маска телефона
  $$('input[type="tel"]').forEach(input => input.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.startsWith('8')) v = '7' + v.slice(1);
    if (!v.startsWith('7')) v = '7' + v;
    v = v.slice(0, 11);
    let o = '+7';
    if (v.length > 1) o += ' (' + v.slice(1, 4);
    if (v.length >= 4) o += ') ' + v.slice(4, 7);
    if (v.length >= 7) o += '-' + v.slice(7, 9);
    if (v.length >= 9) o += '-' + v.slice(9, 11);
    e.target.value = o;
  }));

  // заявка → Worker → Telegram
  const form = $('#leadForm');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    const payload = {};
    new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || (payload.phone || '').replace(/\D/g, '').length < 11) {
      btn.textContent = 'Проверьте имя и телефон';
      setTimeout(() => { btn.textContent = orig; }, 2500);
      return;
    }
    const k = $('input[name="kids"]:checked');
    payload.calc = `${k ? k.value : ''}% · ${$('#priceV').textContent} · взнос ${$('#downV').textContent} · ${$('#termV').textContent} · платёж ${out.pay.textContent} ₽`;
    btn.disabled = true; btn.textContent = 'Отправляем…';
    try {
      const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Заявка отправлена. Мы свяжемся с вами';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Не вышло. Напишите в Telegram';
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 4000);
    }
  });
})();
