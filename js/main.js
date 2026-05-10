/* ============================================================
   COPA MUNDIAL TMF 2026 — main.js
   - Loader, smooth scroll, navbar
   - Hero animations (GSAP)
   - Countdowns (next Sunday 18:30 in Estadio Siglo 21)
   - Players grid (3D tilt + holo + stats)
   - Dashboard charts, counters, ring, probability bars
   - Modo Serio recovery bar
   - Schedule + standings
   - Floating chat panel
   - Mouse glow + soft hover sound
   ============================================================ */

(() => {
  const $  = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));

  /* =========================================================
     LOADER (Trophy intro — keep on screen long enough to enjoy it)
     ========================================================= */
  const loader = $('#loader');
  const loaderBar = $('#loader-bar');

  // Lock body scroll while loader is on screen
  if (loader) document.body.style.overflow = 'hidden';

  // Loader is short and snappy: ~1.8s total
  const LOADER_DURATION = 1700;
  const LOADER_HOLD     = 250;
  const startTime = performance.now();

  function tickLoader(now) {
    const k = Math.min(1, (now - startTime) / LOADER_DURATION);
    const eased = 1 - Math.pow(1 - k, 2);
    if (loaderBar) loaderBar.style.width = (eased * 100) + '%';
    if (k < 1) requestAnimationFrame(tickLoader);
    else setTimeout(hideLoader, LOADER_HOLD);
  }
  requestAnimationFrame(tickLoader);
  // Failsafe: if a CDN or animation hiccups, scrolling must never remain locked.
  setTimeout(() => {
    document.body.style.overflow = '';
  }, LOADER_DURATION + LOADER_HOLD + 1500);

  function hideLoader() {
    if (!loader) return;
    document.body.style.overflow = '';
    loader.classList.add('is-hidden');
    setTimeout(() => loader.remove(), 900);
    runHeroIntro();
  }

  /* =========================================================
     NATIVE SCROLL
     ========================================================= */
  // The wheel stays native and fast. Anchor clicks still scroll smoothly.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const target = $(href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* =========================================================
     NAVBAR + MOBILE MENU
     ========================================================= */
  const nav = $('#navbar');
  const onScroll = () => {
    if (window.scrollY > 30) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navToggle = $('#nav-toggle');
  const mobileMenu = $('#mobile-menu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => mobileMenu.classList.add('hidden')));
  }

  /* =========================================================
     HERO INTRO
     ========================================================= */
  function runHeroIntro() {
    if (!window.gsap) return;
    gsap.to('.hero-elem', {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.12
    });
  }

  /* =========================================================
     COUNTDOWN
     - Target: today 10 May 2026 at 18:30 (per spec).
     - If already passed, target the next Sunday 18:30.
     ========================================================= */
  function getKickoff() {
    const today = new Date(2026, 4, 10, 18, 30, 0); // May = 4
    const now = new Date();
    if (now < today) return today;
    // Next Sunday at 18:30
    const next = new Date(now);
    const day = next.getDay(); // 0 = Sunday
    const add = day === 0 ? (next.getHours() < 18 || (next.getHours() === 18 && next.getMinutes() < 30) ? 0 : 7) : (7 - day);
    next.setDate(next.getDate() + add);
    next.setHours(18, 30, 0, 0);
    return next;
  }

  const kickoff = getKickoff();

  function buildCountdownDOM(container, big = false) {
    const labels = [['days','DÍAS'],['hours','HORAS'],['mins','MINUTOS'],['secs','SEGUNDOS']];
    container.innerHTML = labels.map(([k, l]) => `
      <div class="${big ? 'cd-big' : 'cd-block'}">
        <div class="${big ? 'cd-big-num' : 'cd-num'}" data-cd="${k}">00</div>
        <div class="${big ? 'cd-big-label' : 'cd-label'}">${l}</div>
      </div>
    `).join('');
  }

  const heroCD = $('#hero-countdown');
  const bigCD  = $('#big-countdown');
  if (heroCD) buildCountdownDOM(heroCD, false);
  if (bigCD)  buildCountdownDOM(bigCD, true);

  function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }

  function tickCountdown() {
    const diff = kickoff - new Date();
    const totalSec = Math.max(0, Math.floor(diff / 1000));
    const days  = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins  = Math.floor((totalSec % 3600) / 60);
    const secs  = totalSec % 60;
    const data  = { days: pad(days), hours: pad(hours), mins: pad(mins), secs: pad(secs) };

    $$('[data-cd]').forEach(el => {
      const k = el.dataset.cd;
      if (el.textContent !== data[k]) {
        el.textContent = data[k];
        el.animate(
          [{ transform: 'translateY(-6px)', opacity: 0.4 }, { transform: 'translateY(0)', opacity: 1 }],
          { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
      }
    });
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* =========================================================
     PLAYERS DATA + GRID  (con persistencia en localStorage)
     ========================================================= */
  const PLAYERS_DEFAULT = [
    { name: 'Chifu',        position: 'MEDIOCAMPO',  number: 8,  rating: 91, energy: 95, color: '#ffd166', stats: { pase: 92, vision: 90, control: 89, tiro: 91 } },
    { name: 'Paolo Neto',   position: 'MEDIOCAMPO',  number: 10, rating: 94, energy: 91, color: '#00d4ff', stats: { pase: 96, vision: 95, control: 92, tiro: 88 } },
    { name: 'WLAN 21',      position: 'PORTERO',     number: 21, rating: 90, energy: 92, color: '#39ff14', stats: { reflejos: 94, atajadas: 92, posicion: 90, salida: 88 } },
    { name: 'Jose Ch.',     position: 'MEDIOCAMPO',  number: 6,  rating: 93, energy: 90, color: '#ff2b5b', stats: { pase: 96, vision: 94, control: 93, tiro: 87 } },
    { name: 'Ratón',        position: 'PORTERO',     number: 1,  rating: 90, energy: 88, color: '#a78bfa', stats: { reflejos: 95, atajadas: 93, posicion: 91, salida: 84 } },
    { name: 'Erick',        position: 'MEDIO DEF.',  number: 5,  rating: 87, energy: 90, color: '#22d3ee', stats: { recuperacion: 92, pase: 88, vision: 85, defensa: 86 } },
    { name: 'Clau',         position: 'LATERAL',     number: 3,  rating: 86, energy: 92, color: '#f472b6', stats: { velocidad: 89, centro: 88, defensa: 84, resistencia: 93 } },
    { name: 'Mono Serio',   position: 'DELANTERO',   number: 11, rating: 91, energy: 100, color: '#fb923c', stats: { ataque: 92, velocidad: 90, tiro: 95, fisico: 88 }, badge: 'MODO SERIO' }
  ];

  const PLAYERS_STORAGE_KEY = 'tmf_players_v2';

  function loadPlayersFromCache() {
    try {
      const raw = localStorage.getItem(PLAYERS_STORAGE_KEY);
      if (!raw) return PLAYERS_DEFAULT.map(p => ({ ...p, stats: { ...p.stats } }));
      const overrides = JSON.parse(raw) || {};
      return PLAYERS_DEFAULT.map(p => {
        const o = overrides[p.name];
        if (!o) return { ...p, stats: { ...p.stats } };
        return {
          ...p,
          position: o.position ?? p.position,
          rating:   typeof o.rating === 'number' ? o.rating : p.rating,
          energy:   typeof o.energy === 'number' ? o.energy : p.energy,
          stats: { ...p.stats, ...(o.stats || {}) }
        };
      });
    } catch (_) {
      return PLAYERS_DEFAULT.map(p => ({ ...p, stats: { ...p.stats } }));
    }
  }

  function savePlayerOverride(name, override) {
    try {
      const raw = localStorage.getItem(PLAYERS_STORAGE_KEY);
      const all = raw ? (JSON.parse(raw) || {}) : {};
      all[name] = { ...(all[name] || {}), ...override };
      localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(all));
    } catch (_) {}
  }

  function resetPlayerOverride(name) {
    try {
      const raw = localStorage.getItem(PLAYERS_STORAGE_KEY);
      if (!raw) return;
      const all = JSON.parse(raw) || {};
      delete all[name];
      localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(all));
    } catch (_) {}
  }

  let PLAYERS = loadPlayersFromCache();
  // Exponer para inspección rápida desde devtools
  window.__TMF_PLAYERS__ = PLAYERS;

  const grid = $('#players-grid');

  function renderPlayersGrid() {
    if (!grid) return;
    grid.innerHTML = PLAYERS.map((p, i) => {
      const initial = p.name.charAt(0).toUpperCase();
      const statRows = Object.entries(p.stats).map(([k, v]) => `
        <div class="player-stat-row">
          <span>${k.toUpperCase()}</span>
          <span class="v">${v}</span>
        </div>
      `).join('');

      return `
      <article class="player-card reveal" style="--accent:${p.color}; --c1:${p.color}30" data-i="${i}">
        ${p.badge ? `<div class="absolute top-3 left-3 px-2 py-1 rounded-full bg-amber/20 border border-amber/40 text-amber text-[9px] tracking-[0.25em] font-display inline-flex items-center gap-1"><i data-lucide="zap" class="icon-sm"></i> ${p.badge}</div>` : ''}
        <div class="player-rating" style="--accent:${p.color};">${p.rating}</div>

        <div class="player-portrait" style="--accent:${p.color};">${initial}</div>

        <div class="text-center mt-4">
          <h3 class="font-display font-black text-xl">${p.name}</h3>
          <div class="mt-2 flex items-center justify-center gap-2">
            <span class="position-pill" style="background:${p.color}22; border-color:${p.color}55; color:${p.color};">${p.position}</span>
            <span class="text-white/40 text-xs">#${p.number}</span>
          </div>
        </div>

        <div class="mt-5">
          <div class="flex justify-between text-[10px] text-white/50 tracking-widest mb-1.5">
            <span>ENERGÍA</span>
            <span style="color:${p.color}">${p.energy}%</span>
          </div>
          <div class="energy-bar">
            <div class="energy-fg" style="--accent:${p.color}; background: linear-gradient(90deg, ${p.color}, #fff);" data-energy="${p.energy}"></div>
          </div>
        </div>

        <div class="mt-4 grid gap-2">
          ${statRows}
        </div>
      </article>`;
    }).join('');

    // Animate energy bars in when visible
    const eObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        const fg = card.querySelector('.energy-fg');
        if (fg) {
          requestAnimationFrame(() => fg.style.width = fg.dataset.energy + '%');
        }
        eObserver.unobserve(card);
      });
    }, { threshold: 0.3 });
    $$('.player-card').forEach(c => eObserver.observe(c));

    // 3D tilt + mouse-tracked sheen — only on real pointer + wider screens
    const supportsTilt = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches
      && !matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (supportsTilt) {
      $$('.player-card, .dash-card').forEach(card => {
        let pending = false;
        let lastX = 0, lastY = 0;

        function onMove(e) {
          lastX = e.clientX;
          lastY = e.clientY;
          if (pending) return;
          pending = true;
          requestAnimationFrame(() => {
            pending = false;
            const r = card.getBoundingClientRect();
            const x = lastX - r.left;
            const y = lastY - r.top;
            card.style.setProperty('--mx', `${(x / r.width) * 100}%`);
            card.style.setProperty('--my', `${(y / r.height) * 100}%`);
            const rx = ((y / r.height) - 0.5) * -6;
            const ry = ((x / r.width)  - 0.5) *  8;
            card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
          });
        }

        card.addEventListener('mouseenter', () => {
          card.style.willChange = 'transform';
          card.addEventListener('mousemove', onMove);
        });
        card.addEventListener('mouseleave', () => {
          card.removeEventListener('mousemove', onMove);
          card.style.transform = '';
          card.style.willChange = '';
        });
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  renderPlayersGrid();

  /* =========================================================
     DASHBOARD: counters, ring, prob bars, recovery, sparkline
     ========================================================= */
  function animateCounter(el) {
    const target = +el.dataset.target;
    const dur = 1400;
    const start = performance.now();
    function frame(t) {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * eased);
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function fillRing(wrap) {
    const value = +wrap.dataset.value;
    const fg = wrap.querySelector('.ring-fg');
    if (!fg) return;
    const C = 2 * Math.PI * 52;
    const offset = C * (1 - value / 100);
    requestAnimationFrame(() => fg.style.strokeDashoffset = offset);
  }

  function fillProbBars(scope) {
    $$('.prob-fg', scope).forEach(b => {
      const w = +b.dataset.w;
      requestAnimationFrame(() => b.style.width = w + '%');
    });
  }

  function fillRecovery() {
    const bar = $('#recovery-bar');
    if (!bar) return;
    requestAnimationFrame(() => bar.style.width = bar.dataset.w + '%');
  }

  // Sparkline (perf chart)
  function buildSparkline() {
    const linePath = $('#chart-perf-line');
    const areaPath = $('#chart-perf-area');
    if (!linePath || !areaPath) return;

    const data = [62, 70, 65, 78, 72, 84, 80, 88, 86, 92];
    const W = 300, H = 90, pad = 6;
    const stepX = (W - pad * 2) / (data.length - 1);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const points = data.map((v, i) => {
      const x = pad + i * stepX;
      const y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
      return [x, y];
    });

    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    linePath.setAttribute('d', d);

    const area = d + ` L ${points[points.length - 1][0]} ${H} L ${points[0][0]} ${H} Z`;
    areaPath.setAttribute('d', area);

    const len = linePath.getTotalLength();
    linePath.style.strokeDasharray = len;
    linePath.style.strokeDashoffset = len;
    requestAnimationFrame(() => {
      linePath.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.2,.8,.2,1)';
      linePath.style.strokeDashoffset = 0;
    });
  }

  /* =========================================================
     UPCOMING MATCHES
     ========================================================= */
  const upcoming = [
    { day: 17, mon: 'MAY', home: 'TMF UNITED', away: 'TIGRES FC',     time: '18:30', venue: 'Estadio Siglo 21', tag: 'LOCAL' },
    { day: 24, mon: 'MAY', home: 'HALCONES',   away: 'TMF UNITED',    time: '18:30', venue: 'Estadio Siglo 21', tag: 'VISITA' },
    { day: 31, mon: 'MAY', home: 'TMF UNITED', away: 'LEONES NEGROS', time: '18:30', venue: 'Estadio Siglo 21', tag: 'LOCAL' },
    { day:  7, mon: 'JUN', home: 'AGUILAS',    away: 'TMF UNITED',    time: '18:30', venue: 'Estadio Siglo 21', tag: 'CLÁSICO' }
  ];

  const upList = $('#upcoming-list');
  if (upList) {
    upList.innerHTML = upcoming.map(m => `
      <div class="match-row reveal">
        <div class="date-block">
          <div class="d">${m.day}</div>
          <div class="m">${m.mon}</div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-display font-black truncate">${m.home}</span>
            <span class="text-white/30 text-sm">vs</span>
            <span class="font-display font-black truncate">${m.away}</span>
          </div>
          <div class="text-xs text-white/50 mt-1 flex items-center gap-3 flex-wrap">
            <span class="inline-flex items-center gap-1.5"><i data-lucide="clock-3" class="icon-sm"></i>${m.time}</span>
            <span class="inline-flex items-center gap-1.5"><i data-lucide="map-pin" class="icon-sm"></i>${m.venue}</span>
            <span class="px-2 py-0.5 rounded-full bg-elec/15 text-elec text-[10px] tracking-widest">${m.tag}</span>
          </div>
        </div>
        <button class="hidden md:inline-flex items-center gap-1 text-xs text-white/60 hover:text-white">
          Detalle <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>
    `).join('');
  }

  /* =========================================================
     STANDINGS
     ========================================================= */
  const standings = [
    { team: 'TMF UNITED',    pj: 18, dg: '+27', pts: 45, self: true },
    { team: 'HALCONES',      pj: 18, dg: '+18', pts: 40 },
    { team: 'LEONES NEGROS', pj: 18, dg: '+11', pts: 36 },
    { team: 'TIGRES FC',     pj: 18, dg: '+5',  pts: 30 },
    { team: 'AGUILAS',       pj: 18, dg: '-2',  pts: 24 },
    { team: 'PUMAS DEL SUR', pj: 18, dg: '-9',  pts: 18 }
  ];

  const stTable = $('#standings-table');
  if (stTable) {
    stTable.innerHTML = standings.map((t, i) => {
      const top = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
      return `
        <div class="standings-row ${top} ${t.self ? 'is-self' : ''}">
          <div class="col-span-1"><span class="rank">${i + 1}</span></div>
          <div class="col-span-6 truncate font-medium ${t.self ? 'text-mint' : ''}">${t.team}</div>
          <div class="col-span-1 text-center text-white/60">${t.pj}</div>
          <div class="col-span-2 text-center text-white/60">${t.dg}</div>
          <div class="col-span-2 text-right font-display font-black ${t.self ? 'text-mint' : ''}">${t.pts}</div>
        </div>
      `;
    }).join('');
  }

  /* =========================================================
     SCROLL REVEAL
     ========================================================= */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');

      // Trigger animations contained inside this section
      $$('.counter', el).forEach(animateCounter);
      $$('.ring-progress', el).forEach(fillRing);
      fillProbBars(el);

      if (el.id === 'serio' || el.classList.contains('serio-card')) fillRecovery();
      if (el.id === 'dashboard') buildSparkline();

      revealObserver.unobserve(el);
    });
  }, { threshold: 0.18 });
  $$('.reveal').forEach(el => revealObserver.observe(el));

  // Also: make sure dashboard inner counters trigger even if not directly observed
  const dashSection = $('#dashboard');
  if (dashSection) {
    const dashOnce = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        $$('.counter', dashSection).forEach(animateCounter);
        $$('.ring-progress', dashSection).forEach(fillRing);
        fillProbBars(dashSection);
        buildSparkline();
        dashOnce.disconnect();
      });
    }, { threshold: 0.2 });
    dashOnce.observe(dashSection);
  }

  // Modo Serio counters
  const serio = $('#serio');
  if (serio) {
    const sObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        $$('.counter', serio).forEach(animateCounter);
        fillRecovery();
        sObs.disconnect();
      });
    }, { threshold: 0.25 });
    sObs.observe(serio);
  }

  /* =========================================================
     FLOATING CHAT
     ========================================================= */
  const fab = $('#fab');
  const chat = $('#chat-panel');
  const chatClose = $('#chat-close');
  const chatMessages = $('#chat-messages');
  const chatAnswers = {
    match: {
      question: '¿A qué hora juegan hoy?',
      answer: 'El kick-off es hoy a las 6:30 PM en el Estadio Siglo 21. Puedes bajar cuando quieras para ver el detalle del partido.'
    },
    schedule: {
      question: 'Próximas jornadas',
      answer: 'Todos los domingos a las 6:30 PM en el Estadio Siglo 21. El calendario completo está más abajo en la página.'
    },
    players: {
      question: 'Plantilla del equipo',
      answer: 'Arqueros: WLAN 21 y Ratón. Mediocampo: Chifu, Paolo Neto, Jose Ch. (estilo Toni Kroos) y Erick. Defensa: Clau (lateral). Delantera: Mono Serio. Más abajo verás cada uno con sus stats.'
    },
    watch: {
      question: 'Quiero ver el partido',
      answer: 'Abriendo la transmisión simulada de TMF SPORTS…',
      action: 'openWatch'
    },
    remind: {
      question: 'Recordarme el partido (alarma)',
      answer: 'Te puedo avisar de dos formas. Elige la que prefieras:',
      action: 'openReminder'
    },
    editPlayer: {
      question: 'Editar características de un jugador',
      answer: 'Elige al jugador que quieras editar. Tus cambios quedan guardados en el navegador y se mantienen aunque cierres la página.',
      action: 'openEditor'
    }
  };

  function toggleChat(force) {
    const show = typeof force === 'boolean' ? force : chat.classList.contains('hidden');
    chat.classList.toggle('hidden', !show);
    if (show && chatMessages && chatMessages.childElementCount === 0) {
      addMessage('Hola. Soy el asistente TMF. Elige una opción y te respondo al instante.', 'bot');
    }
  }
  function addMessage(text, type = 'bot') {
    if (!chatMessages) return;
    const msg = document.createElement('div');
    msg.className = type === 'user' ? 'user-msg' : 'bot-msg';
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  function showTyping() {
    if (!chatMessages) return null;
    const t = document.createElement('div');
    t.className = 'bot-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(t);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return t;
  }

  if (fab) fab.addEventListener('click', () => toggleChat());
  if (chatClose) chatClose.addEventListener('click', () => toggleChat(false));
  function clearChat() {
    if (!chatMessages) return;
    chatMessages.innerHTML = '';
  }

  $$('.quick-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = chatAnswers[btn.dataset.answer];
      if (!data) return;

      // Cierra cualquier conversación previa: solo muestra esta pregunta y respuesta.
      clearChat();

      addMessage(data.question, 'user');
      const typing = showTyping();
      setTimeout(() => {
        if (typing) typing.remove();
        addMessage(data.answer, 'bot');
        if (data.action === 'openWatch') {
          setTimeout(() => { toggleChat(false); openWatchModal(); }, 350);
        }
        if (data.action === 'openEditor') {
          renderPlayerPicker();
        }
        if (data.action === 'openReminder') {
          renderReminderPicker();
        }
      }, 750);
    });
  });

  /* =========================================================
     CHAT: editor de jugadores (persistido en localStorage)
     ========================================================= */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function renderPlayerPicker() {
    if (!chatMessages) return;
    const wrap = document.createElement('div');
    wrap.className = 'chat-editor';
    wrap.innerHTML = `
      <p class="chat-editor-title">Selecciona un jugador</p>
      <div class="chat-editor-grid">
        ${PLAYERS.map((p, i) => `
          <button type="button" class="chat-editor-chip" data-edit="${i}" style="--c:${p.color}">
            <span class="dot" style="background:${p.color}"></span>
            <span class="nm">${escapeHtml(p.name)}</span>
            <span class="po">${escapeHtml(p.position)}</span>
          </button>
        `).join('')}
      </div>
    `;
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    wrap.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.dataset.edit;
        renderPlayerForm(idx);
      });
    });
  }

  function renderPlayerForm(idx) {
    if (!chatMessages) return;
    const p = PLAYERS[idx];
    if (!p) return;

    addMessage(`Editar a ${p.name}`, 'user');

    const form = document.createElement('form');
    form.className = 'chat-editor chat-editor-form';
    form.style.setProperty('--c', p.color);
    form.innerHTML = `
      <p class="chat-editor-title">${escapeHtml(p.name)} <span class="muted">#${p.number}</span></p>

      <label class="ed-row">
        <span>Posición</span>
        <input type="text" name="position" value="${escapeHtml(p.position)}" maxlength="18" required />
      </label>

      <div class="ed-grid">
        <label class="ed-row">
          <span>Rating</span>
          <input type="number" name="rating" min="40" max="99" value="${p.rating}" required />
        </label>
        <label class="ed-row">
          <span>Energía</span>
          <input type="number" name="energy" min="0" max="100" value="${p.energy}" required />
        </label>
      </div>

      <p class="chat-editor-sub">Estadísticas</p>
      <div class="ed-grid">
        ${Object.entries(p.stats).map(([k, v]) => `
          <label class="ed-row">
            <span>${escapeHtml(k.toUpperCase())}</span>
            <input type="number" name="stat:${escapeHtml(k)}" min="0" max="99" value="${v}" required />
          </label>
        `).join('')}
      </div>

      <div class="ed-actions">
        <button type="button" class="ed-btn ed-btn-ghost" data-action="reset">Restablecer</button>
        <button type="submit" class="ed-btn ed-btn-primary">Guardar cambios</button>
      </div>
      <p class="ed-hint">Tus cambios se guardan en el cache de tu navegador.</p>
    `;
    chatMessages.appendChild(form);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const newStats = { ...p.stats };
      const override = {
        position: String(fd.get('position') || p.position).trim().toUpperCase(),
        rating:   clampInt(fd.get('rating'), 40, 99, p.rating),
        energy:   clampInt(fd.get('energy'), 0, 100, p.energy),
        stats:    newStats
      };
      Object.keys(p.stats).forEach(k => {
        const v = fd.get('stat:' + k);
        if (v !== null && v !== '') newStats[k] = clampInt(v, 0, 99, p.stats[k]);
      });
      Object.assign(PLAYERS[idx], override);
      savePlayerOverride(p.name, override);
      renderPlayersGrid();
      addMessage(`Listo. ${p.name} ahora juega como ${override.position} (rating ${override.rating}). Guardado en este navegador.`, 'bot');
    });

    form.querySelector('[data-action="reset"]').addEventListener('click', () => {
      const def = PLAYERS_DEFAULT.find(d => d.name === p.name);
      if (!def) return;
      resetPlayerOverride(p.name);
      PLAYERS[idx] = { ...def, stats: { ...def.stats } };
      renderPlayersGrid();
      addMessage(`Restablecí a ${p.name} a sus valores originales.`, 'bot');
      renderPlayerForm(idx);
    });
  }

  function clampInt(value, min, max, fallback) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  /* =========================================================
     CHAT: recordatorio del partido (alarma navegador + .ics)
     ========================================================= */
  const REMIND_KEY = 'tmf_remind_armed';
  let remindTimerId = null;

  function renderReminderPicker() {
    if (!chatMessages) return;
    const wrap = document.createElement('div');
    wrap.className = 'chat-editor';
    wrap.style.setProperty('--c', '#39ff14');

    const armed = localStorage.getItem(REMIND_KEY) === '1';
    const fmt = kickoff.toLocaleString('es-PE', {
      weekday: 'long', day: '2-digit', month: 'long',
      hour: '2-digit', minute: '2-digit'
    });

    wrap.innerHTML = `
      <p class="chat-editor-title">Alarma del kick-off</p>
      <p class="ed-hint" style="text-align:left; letter-spacing:.06em; font-size:.7rem; color:rgba(255,255,255,.7); margin:0 0 .35rem;">
        Partido: <b style="color:#fff">${escapeHtml(fmt)}</b> · Estadio Siglo 21
      </p>
      <div class="ed-actions" style="flex-direction:column;">
        <button type="button" class="ed-btn ed-btn-primary" data-r="browser">
          <span style="display:inline-flex;align-items:center;gap:.4rem;justify-content:center">
            ${armed ? 'Alarma del navegador ACTIVA · desactivar' : 'Activar alarma en este navegador'}
          </span>
        </button>
        <button type="button" class="ed-btn ed-btn-ghost" data-r="ics">
          Agregar al calendario del celular (.ics)
        </button>
        <button type="button" class="ed-btn ed-btn-ghost" data-r="test">
          Probar el sonido de la alarma
        </button>
      </div>
      <p class="ed-hint" style="text-align:left; line-height:1.5;">
        <b style="color:#39ff14">Para que suene con el celular cerrado/bloqueado</b> usa la opción del calendario: tu celular abre la alerta con su propio sonido aunque esta página esté cerrada. La alarma del navegador solo suena si tienes esta web abierta o en una pestaña en segundo plano.
      </p>
    `;
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    wrap.querySelector('[data-r="browser"]').addEventListener('click', toggleBrowserAlarm);
    wrap.querySelector('[data-r="ics"]').addEventListener('click', downloadIcs);
    wrap.querySelector('[data-r="test"]').addEventListener('click', () => playAlarmSound(2.2));
  }

  async function toggleBrowserAlarm() {
    const armed = localStorage.getItem(REMIND_KEY) === '1';
    if (armed) {
      localStorage.removeItem(REMIND_KEY);
      if (remindTimerId) { clearTimeout(remindTimerId); remindTimerId = null; }
      addMessage('Alarma del navegador desactivada.', 'bot');
      return;
    }

    if (!('Notification' in window)) {
      addMessage('Tu navegador no soporta notificaciones. Usa la opción del calendario para que suene en el celular.', 'bot');
      return;
    }

    let perm = Notification.permission;
    if (perm === 'default') {
      try { perm = await Notification.requestPermission(); } catch (_) { perm = 'denied'; }
    }
    if (perm !== 'granted') {
      addMessage('No diste permiso de notificaciones. Igual puedo programar el sonido si dejas la página abierta. ¿Quieres usar el calendario del celular?', 'bot');
      return;
    }

    localStorage.setItem(REMIND_KEY, '1');
    scheduleBrowserAlarm();
    addMessage(`Listo. Te avisaré con sonido y notificación cuando empiece el partido (${kickoff.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}). Mantén esta página abierta o en una pestaña.`, 'bot');
  }

  function scheduleBrowserAlarm() {
    const ms = kickoff.getTime() - Date.now();
    if (ms <= 0) return;
    if (remindTimerId) clearTimeout(remindTimerId);
    // setTimeout en navegadores está limitado a ~24.8 días; el kickoff aquí siempre es <= 7 días.
    remindTimerId = setTimeout(fireKickoffAlarm, ms);
  }

  function fireKickoffAlarm() {
    if (localStorage.getItem(REMIND_KEY) !== '1') return;
    playAlarmSound(4);
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const n = new Notification('¡Llegó la hora! TMF UNITED vs LOS RIVALES', {
          body: 'Kick-off ahora · Estadio Siglo 21 · Activa la transmisión.',
          tag: 'tmf-kickoff',
          requireInteraction: true
        });
        n.onclick = () => { window.focus(); n.close(); };
      }
    } catch (_) {}
    localStorage.removeItem(REMIND_KEY);
  }

  // Genera un sonido de alarma con Web Audio (sin archivo externo).
  function playAlarmSound(seconds = 3) {
    try {
      enableSound();
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const t0 = audioCtx.currentTime;
      const beepDur = 0.18;
      const gap = 0.12;
      const cycle = beepDur + gap;
      const beeps = Math.max(1, Math.floor(seconds / cycle));

      for (let i = 0; i < beeps; i++) {
        const start = t0 + i * cycle;
        const freq = i % 2 === 0 ? 988 : 740; // alterna B5 / F#5 estilo alarma deportiva
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(freq, start);
        o.connect(g);
        g.connect(audioCtx.destination);
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.18, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, start + beepDur);
        o.start(start);
        o.stop(start + beepDur + 0.02);
      }
    } catch (_) {}
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function toIcsDate(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate())
      + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  }

  function downloadIcs() {
    const start = kickoff;
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const stamp = toIcsDate(new Date());
    const uid = 'tmf-kickoff-' + start.getTime() + '@tmf2026';

    // Alarmas: una al inicio del partido, otra 15 min antes
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TMF//Copa Mundial TMF 2026//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + stamp,
      'DTSTART:' + toIcsDate(start),
      'DTEND:' + toIcsDate(end),
      'SUMMARY:¡Llegó la hora! TMF UNITED vs LOS RIVALES',
      'DESCRIPTION:Kick-off de la Copa Mundial TMF 2026. Activa la transmisión y ve cada jugada.',
      'LOCATION:Estadio Siglo 21',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Faltan 15 minutos para el kick-off TMF',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:PT0M',
      'ACTION:DISPLAY',
      'DESCRIPTION:¡Llegó la hora! Comienza el partido TMF',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TMF-Kickoff.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);

    addMessage('Descargué el archivo TMF-Kickoff.ics. Ábrelo en tu celular y agrégalo a Google Calendar / Calendario de iPhone. Con eso tu celular sonará a la hora del partido aunque la página esté cerrada.', 'bot');
  }

  // Re-armar la alarma si el usuario ya la tenía activa al recargar.
  if (localStorage.getItem(REMIND_KEY) === '1') {
    if (kickoff.getTime() <= Date.now()) {
      localStorage.removeItem(REMIND_KEY);
    } else {
      scheduleBrowserAlarm();
    }
  }

  // Close chat with ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chat && !chat.classList.contains('hidden')) {
      toggleChat(false);
    }
  });

  /* =========================================================
     CURSOR GLOW (lightweight; only on real pointer ≥ 1024px)
     ========================================================= */
  const glow = $('#cursor-glow');
  const glowSupported = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches
    && !matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (glow && glowSupported) {
    const SIZE = 360;
    let gx = -9999, gy = -9999, tx = -9999, ty = -9999;
    let dirty = false;
    let running = false;

    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      dirty = true;
      if (!running) {
        running = true;
        requestAnimationFrame(loop);
      }
    }, { passive: true });

    function loop() {
      if (!dirty) { running = false; return; }
      gx += (tx - gx) * 0.18;
      gy += (ty - gy) * 0.18;
      glow.style.transform = `translate3d(${gx - SIZE / 2}px, ${gy - SIZE / 2}px, 0)`;
      if (Math.abs(tx - gx) < 0.5 && Math.abs(ty - gy) < 0.5) {
        dirty = false;
      }
      requestAnimationFrame(loop);
    }
  } else if (glow) {
    glow.remove();
  }

  // Subtle web-audio "tick" for hover (no asset needed). Disabled by default,
  // turns on after first user gesture. Toggle via window.__TMF_SOUND__ = false.
  let audioCtx = null;
  let soundsEnabled = false;
  window.__TMF_SOUND__ = true;

  function playTick(freq = 880, dur = 0.045) {
    if (!soundsEnabled || !window.__TMF_SOUND__ || !audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = 0;
    o.connect(g); g.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    g.gain.linearRampToValueAtTime(0.04, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function enableSound() {
    if (soundsEnabled) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      soundsEnabled = true;
    } catch (_) {}
  }
  ['click', 'keydown', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, enableSound, { once: true })
  );

  // Hook hover sounds on key interactive items
  $$('.btn-primary, .btn-ghost, .player-card, #fab, .nav-link, .match-row').forEach(el => {
    el.addEventListener('mouseenter', () => playTick(720 + Math.random() * 220));
  });

  /* =========================================================
     ESPN-STYLE WATCH MODAL
     ========================================================= */
  const watchModal    = $('#watch-modal');
  const watchClose    = $('#watch-close');
  const watchStep     = $('#watch-step');
  const watchProgress = $('#watch-progress');
  const watchLog      = $('#watch-log');
  const videoCard     = $('#video-card');

  const WATCH_STEPS = [
    { t: 'Conectando con TMF Sports…',                         log: 'Resolviendo CDN tmf-sports-edge.live',         p: 10 },
    { t: 'Autenticando suscripción…',                          log: 'Token válido · Plan PREMIUM activo',           p: 22 },
    { t: 'Estableciendo enlace satélite…',                     log: 'Satélite ARGOS-7 enganchado · 99.4% señal',    p: 38 },
    { t: 'Negociando con servidores de ESPN…',                 log: 'Handshake con espn-live-feed.tmf … OK',        p: 55 },
    { t: 'Cargando cámaras del Estadio Siglo 21…',             log: '14 cámaras conectadas · 4K HDR',               p: 70 },
    { t: 'Verificando derechos de transmisión LIVE…',          log: 'Licencia FIFA-TMF #2026 confirmada',           p: 82 },
    { t: 'En minutos tendremos conexión con ESPN en vivo…',    log: 'Esperando feed broadcast oficial',             p: 92 },
    { t: 'En minutos tendremos conexión con ESPN en vivo',     log: 'TMF UNITED vs LOS RIVALES · KICK-OFF 18:30',   p: 100, hold: true }
  ];
  let watchTimer = null;

  function openWatchModal() {
    if (!watchModal) return;
    watchModal.classList.remove('hidden');
    watchModal.classList.add('is-open');
    watchModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('watch-open');
    if (watchLog)      watchLog.innerHTML = '';
    if (watchStep)     watchStep.textContent = 'Iniciando…';
    if (watchProgress) watchProgress.style.width = '0%';

    let i = 0;
    clearInterval(watchTimer);
    function next() {
      if (i >= WATCH_STEPS.length) return;
      const s = WATCH_STEPS[i++];
      if (watchStep)     watchStep.textContent = s.t;
      if (watchProgress) watchProgress.style.width = s.p + '%';
      if (watchLog) {
        const li = document.createElement('li');
        li.textContent = s.log;
        li.style.animationDelay = '.05s';
        watchLog.appendChild(li);
        // Keep only last 4 visible
        while (watchLog.childElementCount > 4) watchLog.firstElementChild.remove();
      }
    }
    next();
    watchTimer = setInterval(() => {
      if (i >= WATCH_STEPS.length) { clearInterval(watchTimer); return; }
      next();
    }, 900);
  }

  function closeWatchModal() {
    if (!watchModal) return;
    clearInterval(watchTimer);
    watchModal.classList.add('hidden');
    watchModal.classList.remove('is-open');
    watchModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.classList.remove('watch-open');
  }

  $$('[data-watch-match]').forEach(b => b.addEventListener('click', openWatchModal));
  if (videoCard)  videoCard.addEventListener('click', openWatchModal);
  if (watchClose) watchClose.addEventListener('click', closeWatchModal);
  if (watchModal) {
    watchModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('watch-backdrop')) closeWatchModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && watchModal && !watchModal.classList.contains('hidden')) closeWatchModal();
  });

  /* =========================================================
     COOKIE BANNER
     ========================================================= */
  const cookieBanner = $('#cookie-banner');
  const cookieAccept = $('#cookie-accept');
  const cookieReject = $('#cookie-reject');

  function getCookie(name) {
    const v = `; ${document.cookie}`.split(`; ${name}=`);
    if (v.length === 2) return v.pop().split(';').shift();
    return null;
  }
  function setCookie(name, value, days = 180) {
    const d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }
  function showCookieBanner() {
    if (!cookieBanner) return;
    if (getCookie('tmf_cookie_consent')) return;
    setTimeout(() => cookieBanner.classList.remove('hidden'), 1800);
  }
  if (cookieAccept) {
    cookieAccept.addEventListener('click', () => {
      setCookie('tmf_cookie_consent', 'accepted');
      cookieBanner.classList.add('hidden');
      addMessage('Gracias por aceptar las cookies. Recordaré tus preferencias.', 'bot');
    });
  }
  if (cookieReject) {
    cookieReject.addEventListener('click', () => {
      setCookie('tmf_cookie_consent', 'rejected', 7);
      cookieBanner.classList.add('hidden');
    });
  }
  showCookieBanner();

  /* =========================================================
     "Avisarme cuando esté lista" — App TMF próximamente
     ========================================================= */
  const notifyBtn = $('#notify-btn');
  if (notifyBtn) {
    notifyBtn.addEventListener('click', () => {
      const original = notifyBtn.innerHTML;
      notifyBtn.innerHTML = '<span class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4"></i> Te avisaremos · ¡Gracias!</span>';
      if (window.lucide) window.lucide.createIcons();
      notifyBtn.disabled = true;
      notifyBtn.classList.add('is-confirmed');
      setTimeout(() => {
        notifyBtn.innerHTML = original;
        notifyBtn.disabled = false;
        notifyBtn.classList.remove('is-confirmed');
        if (window.lucide) window.lucide.createIcons();
      }, 4500);
    });
  }

  /* =========================================================
     EXTRA REVEAL (left/right) for new sections
     ========================================================= */
  const dirObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      dirObs.unobserve(e.target);
    });
  }, { threshold: 0.18 });
  $$('.reveal-left, .reveal-right').forEach(el => dirObs.observe(el));

  // Render all Lucide icons, including icons injected dynamically by JS.
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: { 'stroke-width': 2.1 }
    });
  }
})();
