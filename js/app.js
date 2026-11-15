/**
 * ============================================================================
 * ETERNO PASE — MOTOR DE APLICACIÓN (HUB + INVITACIONES INTERACTIVAS)
 * ============================================================================
 */

(function (global) {
  'use strict';

  const EternoPase = (global.EternoPase = global.EternoPase || {});
  const { BRAND_CONFIG, DEMOS_CONFIG, DEMO_ORDER, AudioSynth } = EternoPase;

  let activeDemoId = null;
  let countdownTimerId = null;
  let toastTimerId = null;
  let isAudioPlaying = false;

  const ICONS = {
    whatsapp:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.77 14.02c-.24.67-1.4 1.28-1.94 1.36-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.61-2.91-1.26-4.81-4.2-4.96-4.39-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.01-2.42.27-.29.58-.36.77-.36.19 0 .39 0 .56.01.18.01.42-.07.66.51.24.59.82 2.02.9 2.16.07.15.12.32.02.51-.1.19-.15.32-.29.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.29.77 1.27 1.65 2.05 1.14 1.01 2.09 1.33 2.39 1.48.29.15.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.66-.15.27.1 1.71.81 2 .95.29.15.49.22.56.34.07.12.07.7-.17 1.37z"/></svg>',
    'map-pin':
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    music:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    clock:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    sparkles:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
    rings:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M12 6 10 3h4l-2 3Z"/></svg>',
    cocktail:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8Z"/></svg>',
    dinner:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
    camera:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    party:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>',
    balloon:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a6 6 0 0 0-6 6c0 4 6 9 6 9s6-5 6-9a6 6 0 0 0-6-6Z"/><path d="M12 17v5"/></svg>',
    cake:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>',
    copy:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
    check:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
    play:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
    pause:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    arrowRight:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    gift:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>',
    external:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>'
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatClabeDisplay(clabe) {
    return String(clabe || '')
      .replace(/\s+/g, '')
      .replace(/(.{4})/g, '$1 ')
      .trim();
  }

  function showToast(message) {
    const toast = document.getElementById('ep-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    if (toastTimerId) clearTimeout(toastTimerId);
    toastTimerId = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2800);
  }

  function setMetaContent(selector, value) {
    const el = document.querySelector(selector);
    if (el && value) {
      el.setAttribute('content', value);
    }
  }

  function updateDocumentMetadata(demo) {
    if (!demo) {
      document.title = `${BRAND_CONFIG.name} — ${BRAND_CONFIG.slogan}`;
      setMetaContent('meta[property="og:title"]', `${BRAND_CONFIG.name} | Invitaciones Digitales Eternas`);
      setMetaContent('meta[property="og:description"]', BRAND_CONFIG.slogan);
      setMetaContent('meta[property="og:image"]', 'assets/og-eterno-pase.svg');
      return;
    }

    document.title = demo.og.title;
    setMetaContent('meta[property="og:title"]', demo.og.title);
    setMetaContent('meta[property="og:description"]', demo.og.description);
    setMetaContent('meta[property="og:image"]', demo.og.image);
  }

  function resolveFutureEventTimestamp(isoDate) {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
      return Date.now() + 90 * 24 * 60 * 60 * 1000;
    }
    const now = Date.now();
    if (parsed.getTime() <= now) {
      parsed.setFullYear(new Date().getFullYear() + 1);
    }
    return parsed.getTime();
  }

  function stopCountdown() {
    if (countdownTimerId) {
      clearInterval(countdownTimerId);
      countdownTimerId = null;
    }
  }

  function startCountdown(isoDate) {
    stopCountdown();
    const targetMs = resolveFutureEventTimestamp(isoDate);

    function tick() {
      const diff = Math.max(0, targetMs - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      const elDays = document.getElementById('ep-cd-days');
      const elHours = document.getElementById('ep-cd-hours');
      const elMins = document.getElementById('ep-cd-mins');
      const elSecs = document.getElementById('ep-cd-secs');

      if (!elDays) return;
      elDays.textContent = String(days).padStart(2, '0');
      elHours.textContent = String(hours).padStart(2, '0');
      elMins.textContent = String(mins).padStart(2, '0');
      elSecs.textContent = String(secs).padStart(2, '0');
    }

    tick();
    countdownTimerId = setInterval(tick, 1000);
  }

  function getAudioElement() {
    return document.getElementById('ep-audio-player');
  }

  function syncMusicButtonUI() {
    const fab = document.getElementById('ep-music-toggle');
    if (!fab) return;
    const iconBox = fab.querySelector('.inv-music-fab__icon');
    const stateText = fab.querySelector('.inv-music-fab__state');
    if (isAudioPlaying) {
      fab.classList.add('is-playing');
      fab.setAttribute('aria-pressed', 'true');
      if (iconBox) iconBox.innerHTML = ICONS.pause;
      if (stateText) stateText.textContent = 'Reproduciendo · Pausar';
    } else {
      fab.classList.remove('is-playing');
      fab.setAttribute('aria-pressed', 'false');
      if (iconBox) iconBox.innerHTML = ICONS.play;
      if (stateText) stateText.textContent = 'Pausada · Reproducir';
    }
  }

  function stopAudio() {
    const audioEl = getAudioElement();
    if (audioEl) {
      audioEl.pause();
      try {
        audioEl.currentTime = 0;
      } catch (e) {
        // Ignorar si aún no cargan metadatos
      }
    }
    isAudioPlaying = false;
    syncMusicButtonUI();
  }

  function prepareAudioForDemo(demo) {
    const audioEl = getAudioElement();
    if (!audioEl) return;
    stopAudio();
    const customUrl = demo.music && demo.music.customMp3Url ? demo.music.customMp3Url.trim() : '';
    const src = customUrl || (AudioSynth ? AudioSynth.getTrackUrl(demo.music.preset) : '');
    if (src) {
      audioEl.src = src;
      audioEl.volume = 0.65;
      audioEl.load();
    }
  }

  function playDemoAudio() {
    const audioEl = getAudioElement();
    if (!audioEl) return;
    const playPromise = audioEl.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          isAudioPlaying = true;
          syncMusicButtonUI();
        })
        .catch(() => {
          isAudioPlaying = false;
          syncMusicButtonUI();
          showToast('Toca el botón de música abajo a la izquierda para escuchar la melodía.');
        });
    } else {
      isAudioPlaying = true;
      syncMusicButtonUI();
    }
  }

  function toggleDemoAudio() {
    const audioEl = getAudioElement();
    if (!audioEl) return;
    if (isAudioPlaying) {
      audioEl.pause();
      isAudioPlaying = false;
      syncMusicButtonUI();
    } else {
      playDemoAudio();
    }
  }

  function renderHub() {
    const gridEl = document.getElementById('ep-demos-grid');
    if (gridEl) {
      gridEl.innerHTML = DEMO_ORDER.map((key) => {
        const demo = DEMOS_CONFIG[key];
        const swatches = [demo.colors.primary, demo.colors.secondary, demo.colors.background]
          .map((hex) => `<span class="ep-swatch" style="background:${escapeHtml(hex)}" title="${escapeHtml(hex)}"></span>`)
          .join('');

        return `
          <article class="ep-demo-card" data-demo-card="${escapeHtml(demo.id)}">
            <div class="ep-demo-preview ep-demo-preview--${escapeHtml(demo.id)}">
              <div class="ep-demo-preview__top">
                <span class="ep-demo-badge">${escapeHtml(demo.category)} · ${escapeHtml(demo.badge)}</span>
                <div class="ep-demo-swatches" aria-label="Paleta de colores">${swatches}</div>
              </div>
              <div class="ep-demo-preview__main">
                <div class="ep-demo-preview__style">${escapeHtml(demo.styleTag)}</div>
                <h3 class="ep-demo-preview__title">${escapeHtml(demo.title)}</h3>
                <div class="ep-demo-preview__meta">${escapeHtml(demo.dateDisplay)}</div>
              </div>
            </div>
            <div class="ep-demo-card__body">
              <p class="ep-demo-card__desc">${escapeHtml(demo.description)}</p>
              <div class="ep-demo-card__chips">
                <span class="ep-chip">${escapeHtml(demo.fonts.displayLabel)}</span>
                <span class="ep-chip">Maps + Waze</span>
                <span class="ep-chip">Música + RSVP</span>
              </div>
              <div class="ep-demo-card__actions">
                <button type="button" class="ep-demo-launch-btn" data-open-demo="${escapeHtml(demo.id)}">
                  <span>Probar Demo en Vivo</span>
                  ${ICONS.arrowRight}
                </button>
                <a class="ep-demo-direct-link" href="${escapeHtml(demo.route)}" title="Abrir ruta directa optimizada para compartir en WhatsApp">
                  ${ICONS.external}
                </a>
              </div>
            </div>
          </article>
        `;
      }).join('');
    }

    const benefitsEl = document.getElementById('ep-benefits-grid');
    if (benefitsEl) {
      benefitsEl.innerHTML = BRAND_CONFIG.benefits
        .map(
          (item) => `
          <article class="ep-benefit-card">
            <div class="ep-benefit-card__icon">${ICONS[item.icon] || ICONS.sparkles}</div>
            <div>
              <h3 class="ep-benefit-card__title">${escapeHtml(item.title)}</h3>
              <p class="ep-benefit-card__text">${escapeHtml(item.description)}</p>
            </div>
          </article>
        `
        )
        .join('');
    }

    const useCasesEl = document.getElementById('ep-usecases-pills');
    if (useCasesEl) {
      useCasesEl.innerHTML = BRAND_CONFIG.useCases
        .map((u) => `<span class="ep-usecase-pill"><strong>${escapeHtml(u.label)}</strong> · ${escapeHtml(u.detail)}</span>`)
        .join('');
    }
  }

  function renderInvitationDemo(demoId) {
    const demo = DEMOS_CONFIG[demoId];
    const container = document.getElementById('ep-demo-view');
    if (!demo || !container) return;

    activeDemoId = demoId;
    updateDocumentMetadata(demo);

    const switcherButtons = DEMO_ORDER.map((id) => {
      const item = DEMOS_CONFIG[id];
      const activeClass = id === demo.id ? 'is-active' : '';
      return `<button type="button" class="inv-switch-pill ${activeClass}" data-switch-demo="${escapeHtml(item.id)}">${escapeHtml(item.category)}</button>`;
    }).join('');

    const hostsHtml = demo.hosts
      .map(
        (host) => `
        <div class="inv-host-item">
          <span class="inv-host-item__role">${escapeHtml(host.role)}</span>
          <div class="inv-host-item__names">${escapeHtml(host.names)}</div>
        </div>
      `
      )
      .join('');

    const locationsHtml = demo.locations
      .map(
        (loc) => `
        <article class="inv-location-card">
          <div class="inv-location-card__head">
            <span class="inv-location-card__type">${escapeHtml(loc.type)}</span>
            <span class="inv-location-card__time">${escapeHtml(loc.time)}</span>
          </div>
          <h3 class="inv-location-card__venue">${escapeHtml(loc.venue)}</h3>
          <p class="inv-location-card__address">${escapeHtml(loc.address)}</p>
          <div class="inv-location-card__btns">
            <a class="inv-map-btn inv-map-btn--primary" href="${escapeHtml(loc.mapsUrl)}" target="_blank" rel="noopener noreferrer">
              ${ICONS['map-pin']}
              <span>Google Maps</span>
            </a>
            <a class="inv-map-btn" href="${escapeHtml(loc.wazeUrl)}" target="_blank" rel="noopener noreferrer">
              ${ICONS.external}
              <span>Ir con Waze</span>
            </a>
          </div>
        </article>
      `
      )
      .join('');

    const itineraryHtml = demo.itinerary
      .map(
        (step) => `
        <div class="inv-timeline-item">
          <div class="inv-timeline-item__dot">${ICONS[step.icon] || ICONS.sparkles}</div>
          <div class="inv-timeline-item__body">
            <span class="inv-timeline-item__time">${escapeHtml(step.time)} hrs</span>
            <h3 class="inv-timeline-item__title">${escapeHtml(step.title)}</h3>
            <p class="inv-timeline-item__desc">${escapeHtml(step.description)}</p>
          </div>
        </div>
      `
      )
      .join('');

    const dressPaletteHtml = demo.dressCode.palette
      .map(
        (swatch) => `
        <div class="inv-palette-chip">
          <span class="inv-palette-chip__circle" style="background:${escapeHtml(swatch.hex)}"></span>
          <span>${escapeHtml(swatch.name)}</span>
        </div>
      `
      )
      .join('');

    const extraNotesHtml =
      demo.gifts.extraNotes && demo.gifts.extraNotes.length
        ? `<ul class="inv-extra-notes">${demo.gifts.extraNotes.map((n) => `<li>• ${escapeHtml(n)}</li>`).join('')}</ul>`
        : '';

    const registriesHtml =
      demo.gifts.registries && demo.gifts.registries.length
        ? `<div class="inv-registries">${demo.gifts.registries
            .map(
              (r) =>
                `<a class="inv-registry-link" href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${ICONS.gift}<span>${escapeHtml(r.label)}</span></a>`
            )
            .join('')}</div>`
        : '';

    const guestOptionsHtml = Array.from({ length: demo.rsvp.maxGuests }, (_, idx) => {
      const n = idx + 1;
      const label = n === 1 ? '1 persona' : `${n} personas`;
      return `<option value="${n}">${label}</option>`;
    }).join('');

    const quoteWaHref = `${BRAND_CONFIG.whatsappUrl}?text=${encodeURIComponent(
      `¡Hola Eterno Pase! Probé la demo "${demo.shortTitle}" y quiero cotizar una invitación similar.`
    )}`;

    container.innerHTML = `
      <div class="ep-demo-stage" data-demo-theme="${escapeHtml(demo.id)}">
        <nav class="inv-topbar" aria-label="Navegación de catálogo Eterno Pase">
          <button type="button" class="inv-back-btn" id="ep-back-to-hub">
            ← Volver al Catálogo Eterno Pase
          </button>
          <div class="inv-switcher" role="tablist" aria-label="Cambiar de demo">
            ${switcherButtons}
          </div>
        </nav>

        <!-- Pantalla de bienvenida (Splash Screen) -->
        <section class="inv-splash" id="ep-splash-screen" aria-label="Bienvenida de la invitación">
          <div class="inv-splash__card">
            <div class="inv-splash__seal" aria-hidden="true">${escapeHtml(demo.splash.sealText)}</div>
            <p class="inv-splash__eyebrow">${escapeHtml(demo.splash.eyebrow)}</p>
            <h1 class="inv-splash__title">${escapeHtml(demo.splash.headline)}</h1>
            <p class="inv-splash__subtext">${escapeHtml(demo.splash.subtext)}</p>
            <button type="button" class="inv-splash__btn" id="ep-open-invitation">
              <span>${escapeHtml(demo.splash.buttonLabel)}</span>
              ${ICONS.arrowRight}
            </button>
            <p class="inv-splash__music-hint">
              ${ICONS.music}
              <span>Incluye música de fondo: ${escapeHtml(demo.music.title)}</span>
            </p>
          </div>
        </section>

        <!-- Contenido principal de la invitación -->
        <main class="inv-shell" id="ep-invitation-main">
          <!-- Portada Hero -->
          <section class="inv-card inv-hero">
            <div class="inv-ornament" aria-hidden="true">${ICONS.sparkles}</div>
            <span class="inv-card__eyebrow">${escapeHtml(demo.hero.eyebrow)}</span>
            <h2 class="inv-hero__headline">${escapeHtml(demo.hero.headline)}</h2>
            <div class="inv-hero__date">${escapeHtml(demo.dateDisplay)}</div>
            <p class="inv-hero__quote">${escapeHtml(demo.hero.quote)}</p>
            <div class="inv-hero__city">
              ${ICONS['map-pin']}
              <span>${escapeHtml(demo.cityDisplay)}</span>
            </div>
          </section>

          <!-- Cuenta Regresiva -->
          <section class="inv-card" aria-labelledby="ep-cd-heading">
            <span class="inv-card__eyebrow">Falta muy poco</span>
            <h2 class="inv-card__title" id="ep-cd-heading">Cuenta Regresiva</h2>
            <div class="inv-countdown-grid" role="timer" aria-live="polite">
              <div class="inv-time-box">
                <span class="inv-time-box__value" id="ep-cd-days">00</span>
                <span class="inv-time-box__label">Días</span>
              </div>
              <div class="inv-time-box">
                <span class="inv-time-box__value" id="ep-cd-hours">00</span>
                <span class="inv-time-box__label">Horas</span>
              </div>
              <div class="inv-time-box">
                <span class="inv-time-box__value" id="ep-cd-mins">00</span>
                <span class="inv-time-box__label">Min</span>
              </div>
              <div class="inv-time-box">
                <span class="inv-time-box__value" id="ep-cd-secs">00</span>
                <span class="inv-time-box__label">Seg</span>
              </div>
            </div>
          </section>

          <!-- Padres / Anfitriones -->
          <section class="inv-card" aria-labelledby="ep-hosts-heading">
            <span class="inv-card__eyebrow">Familia &amp; Padrinos</span>
            <h2 class="inv-card__title" id="ep-hosts-heading">${escapeHtml(demo.hostsTitle)}</h2>
            <div class="inv-hosts-list">
              ${hostsHtml}
            </div>
          </section>

          <!-- Ubicaciones Maps & Waze -->
          <section class="inv-card" aria-labelledby="ep-loc-heading">
            <span class="inv-card__eyebrow">¿Cómo llegar?</span>
            <h2 class="inv-card__title" id="ep-loc-heading">Ubicación y Horarios</h2>
            <p class="inv-card__subtitle">Toca tu aplicación de navegación preferida para iniciar la ruta GPS al instante.</p>
            <div class="inv-locations-list">
              ${locationsHtml}
            </div>
          </section>

          <!-- Itinerario Visual -->
          <section class="inv-card" aria-labelledby="ep-itinerary-heading">
            <span class="inv-card__eyebrow">Momento a momento</span>
            <h2 class="inv-card__title" id="ep-itinerary-heading">Itinerario del Evento</h2>
            <div class="inv-timeline">
              ${itineraryHtml}
            </div>
          </section>

          <!-- Código de Vestimenta -->
          <section class="inv-card" aria-labelledby="ep-dress-heading">
            <span class="inv-card__eyebrow">Dress Code</span>
            <h2 class="inv-card__title" id="ep-dress-heading">Código de Vestimenta</h2>
            <div class="inv-dress-box">
              <h3 class="inv-dress-box__title">${escapeHtml(demo.dressCode.title)}</h3>
              <p class="inv-dress-box__desc">${escapeHtml(demo.dressCode.description)}</p>
              <div class="inv-palette-row">${dressPaletteHtml}</div>
              <p class="inv-dress-box__note">${escapeHtml(demo.dressCode.reservedNote)}</p>
            </div>
          </section>

          <!-- Mesa de Regalos / Lluvia de Sobres -->
          <section class="inv-card" aria-labelledby="ep-gifts-heading">
            <span class="inv-card__eyebrow">Obsequios</span>
            <h2 class="inv-card__title" id="ep-gifts-heading">${escapeHtml(demo.gifts.title)}</h2>
            <p class="inv-card__subtitle">${escapeHtml(demo.gifts.subtitle)}</p>
            <div class="inv-bank-card">
              <span class="inv-bank-card__bank">${escapeHtml(demo.gifts.bank)} · Transferencia SPEI</span>
              <p class="inv-bank-card__owner">${escapeHtml(demo.gifts.beneficiary)}</p>
              <div class="inv-clabe-box" id="ep-clabe-value">${escapeHtml(formatClabeDisplay(demo.gifts.clabe))}</div>
              <button type="button" class="inv-copy-btn" id="ep-copy-clabe-btn" data-clabe="${escapeHtml(demo.gifts.clabe)}" data-bank="${escapeHtml(demo.gifts.bank)}">
                ${ICONS.copy}
                <span>Copiar CLABE</span>
              </button>
              ${extraNotesHtml}
            </div>
            ${registriesHtml}
          </section>

          <!-- Confirmación RSVP vía WhatsApp -->
          <section class="inv-card" aria-labelledby="ep-rsvp-heading">
            <span class="inv-card__eyebrow">Confirmación Directa</span>
            <h2 class="inv-card__title" id="ep-rsvp-heading">${escapeHtml(demo.rsvp.title)}</h2>
            <p class="inv-card__subtitle">${escapeHtml(demo.rsvp.subtitle)}</p>
            <form class="inv-rsvp-form" id="ep-rsvp-form">
              <div class="inv-field">
                <label for="ep-rsvp-name">Tu nombre completo</label>
                <input id="ep-rsvp-name" name="name" type="text" required autocomplete="name" placeholder="Ej. Fernanda López" />
              </div>
              <div class="inv-field">
                <label for="ep-rsvp-status">¿Nos acompañas?</label>
                <select id="ep-rsvp-status" name="status">
                  <option value="Sí, confirmo mi asistencia">Sí, ahí estaremos con gusto</option>
                  <option value="No podré asistir, pero les deseo lo mejor">Lamentablemente no podré asistir</option>
                </select>
              </div>
              <div class="inv-field">
                <label for="ep-rsvp-guests">Número de asistentes</label>
                <select id="ep-rsvp-guests" name="guests">
                  ${guestOptionsHtml}
                </select>
              </div>
              <div class="inv-field">
                <label for="ep-rsvp-song">Canción sugerida para la fiesta (opcional)</label>
                <input id="ep-rsvp-song" name="song" type="text" placeholder="${escapeHtml(demo.rsvp.songPlaceholder)}" />
              </div>
              <button type="submit" class="inv-rsvp-submit">
                ${ICONS.whatsapp}
                <span>Confirmar por WhatsApp</span>
              </button>
              <p class="inv-rsvp-deadline">${escapeHtml(demo.hero.rsvpDeadline)}</p>
            </form>
          </section>

          <footer class="inv-powered-footer">
            <div>Demo interactiva creada con <strong>${escapeHtml(BRAND_CONFIG.name)}</strong></div>
            <div>
              “${escapeHtml(BRAND_CONFIG.slogan)}” ·
              <a href="${escapeHtml(quoteWaHref)}" target="_blank" rel="noopener noreferrer">Cotizar una así</a>
            </div>
          </footer>
        </main>

        <!-- Botón flotante de Música Play/Pause -->
        <button type="button" class="inv-music-fab" id="ep-music-toggle" aria-pressed="false" aria-label="Reproducir o pausar música de fondo">
          <span class="inv-music-fab__icon">${ICONS.play}</span>
          <span class="inv-music-fab__info">
            <span class="inv-music-fab__label">${escapeHtml(demo.music.title)}</span>
            <span class="inv-music-fab__state">Toca para escuchar</span>
          </span>
          <span class="inv-eq-bars" aria-hidden="true"><span></span><span></span><span></span></span>
        </button>
      </div>
    `;

    bindDemoEvents(demo);
    prepareAudioForDemo(demo);
    startCountdown(demo.eventDate);
  }

  function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    return new Promise((resolve, reject) => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (ok) resolve();
        else reject(new Error('No se pudo copiar'));
      } catch (err) {
        document.body.removeChild(textarea);
        reject(err);
      }
    });
  }

  function bindDemoEvents(demo) {
    const backBtn = document.getElementById('ep-back-to-hub');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        returnToHub();
      });
    }

    document.querySelectorAll('[data-switch-demo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-switch-demo');
        if (targetId && targetId !== activeDemoId) {
          openDemo(targetId);
        }
      });
    });

    const openBtn = document.getElementById('ep-open-invitation');
    const splashEl = document.getElementById('ep-splash-screen');
    if (openBtn && splashEl) {
      openBtn.addEventListener('click', () => {
        playDemoAudio();
        splashEl.classList.add('is-dismissed');
        global.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const musicBtn = document.getElementById('ep-music-toggle');
    if (musicBtn) {
      musicBtn.addEventListener('click', toggleDemoAudio);
    }

    const copyBtn = document.getElementById('ep-copy-clabe-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const clabe = copyBtn.getAttribute('data-clabe') || '';
        const bank = copyBtn.getAttribute('data-bank') || '';
        copyTextToClipboard(clabe)
          .then(() => {
            copyBtn.classList.add('is-copied');
            copyBtn.innerHTML = `${ICONS.check}<span>¡CLABE Copiada!</span>`;
            showToast(`CLABE de ${bank} copiada al portapapeles`);
            setTimeout(() => {
              copyBtn.classList.remove('is-copied');
              copyBtn.innerHTML = `${ICONS.copy}<span>Copiar CLABE</span>`;
            }, 2400);
          })
          .catch(() => {
            showToast(`CLABE: ${clabe}`);
          });
      });
    }

    const rsvpForm = document.getElementById('ep-rsvp-form');
    if (rsvpForm) {
      rsvpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(rsvpForm);
        const name = String(formData.get('name') || '').trim();
        const status = String(formData.get('status') || '').trim();
        const guests = String(formData.get('guests') || '1').trim();
        const song = String(formData.get('song') || '').trim();

        if (!name) {
          showToast('Por favor escribe tu nombre para confirmar.');
          return;
        }

        const lines = [
          `¡Hola! Confirmo desde la invitación digital *${demo.shortTitle}* (Eterno Pase):`,
          ``,
          `👤 *Nombre:* ${name}`,
          `✅ *Respuesta:* ${status}`,
          `🎟️ *Asistentes:* ${guests} ${guests === '1' ? 'persona' : 'personas'}`
        ];

        if (song) {
          lines.push(`🎵 *Canción sugerida:* ${song}`);
        }

        const waTarget = demo.rsvp.whatsappTarget || BRAND_CONFIG.whatsappNumber;
        const waUrl = `https://wa.me/${waTarget}?text=${encodeURIComponent(lines.join('\n'))}`;

        showToast('Abriendo WhatsApp con tu confirmación lista...');
        const win = global.open(waUrl, '_blank', 'noopener,noreferrer');
        if (!win) {
          global.location.href = waUrl;
        }
      });
    }
  }

  function showHubView() {
    const hubView = document.getElementById('ep-hub-view');
    const demoView = document.getElementById('ep-demo-view');
    const waFloat = document.getElementById('ep-wa-float');

    stopAudio();
    stopCountdown();
    activeDemoId = null;
    updateDocumentMetadata(null);

    if (demoView) {
      demoView.classList.add('is-hidden');
      demoView.innerHTML = '';
    }
    if (hubView) {
      hubView.classList.remove('is-hidden');
    }
    if (waFloat) {
      waFloat.classList.remove('is-hidden');
    }
    global.scrollTo({ top: 0, behavior: 'instant' });
  }

  function openDemo(demoId, options) {
    const opts = options || {};
    if (!DEMOS_CONFIG[demoId]) return;

    const hubView = document.getElementById('ep-hub-view');
    const demoView = document.getElementById('ep-demo-view');
    const waFloat = document.getElementById('ep-wa-float');

    if (hubView) hubView.classList.add('is-hidden');
    if (waFloat) waFloat.classList.add('is-hidden');
    if (demoView) demoView.classList.remove('is-hidden');

    renderInvitationDemo(demoId);
    global.scrollTo({ top: 0, behavior: 'instant' });

    if (opts.updateHistory !== false && (global.location.protocol === 'http:' || global.location.protocol === 'https:')) {
      const isDedicatedPage = /(boda|xv|cumpleanos)(\.html)?$/i.test(global.location.pathname);
      if (!isDedicatedPage) {
        const nextUrl = `?demo=${encodeURIComponent(demoId)}`;
        global.history.pushState({ demoId }, '', nextUrl);
      } else if (demoId !== document.body.getAttribute('data-initial-demo')) {
        const targetRoute = DEMOS_CONFIG[demoId].route;
        if (targetRoute) {
          global.history.pushState({ demoId }, '', targetRoute);
        }
      }
    }
  }

  function returnToHub() {
    const isDedicatedPage = Boolean(document.body.getAttribute('data-initial-demo'));
    const hasHubMarkup = Boolean(document.getElementById('ep-hub-view'));

    if (isDedicatedPage || !hasHubMarkup) {
      stopAudio();
      stopCountdown();
      global.location.href = 'index.html';
      return;
    }

    if (global.location.protocol === 'http:' || global.location.protocol === 'https:') {
      global.history.pushState({}, '', global.location.pathname || './');
    }
    showHubView();
  }

  function detectInitialDemo() {
    const bodyDemo = document.body.getAttribute('data-initial-demo');
    if (bodyDemo && DEMOS_CONFIG[bodyDemo]) {
      return bodyDemo;
    }

    const params = new URLSearchParams(global.location.search);
    const queryDemo = params.get('demo');
    if (queryDemo && DEMOS_CONFIG[queryDemo]) {
      return queryDemo;
    }

    const hashDemo = (global.location.hash || '').replace(/^#/, '');
    if (hashDemo && DEMOS_CONFIG[hashDemo]) {
      return hashDemo;
    }

    return null;
  }

  function bindGlobalEvents() {
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-open-demo]');
      if (trigger) {
        const demoId = trigger.getAttribute('data-open-demo');
        if (demoId) {
          openDemo(demoId);
        }
      }
    });

    const audioEl = getAudioElement();
    if (audioEl) {
      audioEl.addEventListener('play', () => {
        isAudioPlaying = true;
        syncMusicButtonUI();
      });
      audioEl.addEventListener('pause', () => {
        isAudioPlaying = false;
        syncMusicButtonUI();
      });
    }

    global.addEventListener('popstate', () => {
      const nextDemo = detectInitialDemo();
      if (nextDemo) {
        openDemo(nextDemo, { updateHistory: false });
      } else if (document.getElementById('ep-hub-view')) {
        showHubView();
      }
    });
  }

  function init() {
    renderHub();
    bindGlobalEvents();

    const initialDemo = detectInitialDemo();
    if (initialDemo) {
      openDemo(initialDemo, { updateHistory: false });
    } else {
      showHubView();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  EternoPase.App = {
    openDemo,
    returnToHub,
    showToast
  };
})(window);
