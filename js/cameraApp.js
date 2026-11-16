/**
 * ============================================================================
 * ETERNO PASE — CÁMARA DESECHABLE EN VIVO & GALERÍA POLAROID
 * ============================================================================
 * Controla la vista previa en tiempo real (getUserMedia), visor analógico de
 * prueba (<canvas>), disparo con destello + vibración + audio Web Audio API,
 * captura/compresión vía window.EternoPase.DriveUploader y galería Polaroid.
 * ============================================================================
 */

(function (global) {
  'use strict';

  const MAX_SHOTS = 10;
  global.MAX_SHOTS = MAX_SHOTS;

  const EternoPase = (global.EternoPase = global.EternoPase || {});
  const DEFAULT_ANALOG_FILTER = 'contrast(1.08) saturate(1.15) sepia(0.14)';
  const GUEST_NAME_STORAGE_KEY = 'eterno_pase_cam_guest_name';

  const EVENT_CATALOG = {
    boda: {
      id: 'boda',
      title: 'Valeria & Andrés',
      subtitle: 'Álbum Eterno · Boda Valeria & Andrés',
      backHref: 'boda.html',
      backLabel: 'Volver a la invitación',
      savedBanner: '¡Foto guardada en el álbum de los novios!'
    },
    xv: {
      id: 'xv',
      title: 'Mis XV Sofía',
      subtitle: 'Álbum Eterno · Mis XV Sofía',
      backHref: 'xv.html',
      backLabel: 'Volver a la invitación',
      savedBanner: '¡Foto guardada en el álbum de Mis XV Sofía!'
    },
    cumpleanos: {
      id: 'cumpleanos',
      title: 'Cumpleaños #3 de Mateo',
      subtitle: 'Álbum Eterno · Cumpleaños #3 de Mateo',
      backHref: 'cumpleanos.html',
      backLabel: 'Volver a la invitación',
      savedBanner: '¡Foto guardada en el álbum de Mateo!'
    }
  };

  let eventConfig = null;
  let currentFacingMode = 'environment';
  let mediaStream = null;
  let isSimMode = false;
  let simRafId = null;
  let simLastDrawAt = 0;
  let wasCameraActiveBeforeHide = false;
  let isCapturing = false;
  let shotsUsed = 0;
  let polaroids = [];
  let audioCtx = null;
  let toastTimerId = null;
  let flashTimerId = null;

  const dom = {};

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizeUrl(url) {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (!trimmed) return '';
    if (
      /^(https?:|data:image\/(?:png|jpeg|jpg|webp|gif);base64,|data:image\/svg\+xml;(?:charset=utf-8,|base64,)|blob:)/i.test(
        trimmed
      )
    ) {
      return trimmed;
    }
    if (/^[a-zA-Z0-9._/-]+$/.test(trimmed) && !trimmed.startsWith('//')) {
      return trimmed;
    }
    return '';
  }

  function resolveEventConfig() {
    const params = new URLSearchParams(global.location.search || '');
    const rawParam = (params.get('evento') || '').trim().toLowerCase();

    if (rawParam && EVENT_CATALOG[rawParam]) {
      return EVENT_CATALOG[rawParam];
    }

    if (rawParam) {
      const safeId = rawParam.replace(/[^a-z0-9_-]/g, '') || 'album-eterno';
      return {
        id: safeId,
        title: 'Álbum Eterno',
        subtitle: 'Álbum Eterno · Recuerdos en Vivo',
        backHref: 'index.html',
        backLabel: 'Catálogo Eterno Pase',
        savedBanner: '¡Foto guardada en el álbum de los novios!'
      };
    }

    return {
      id: 'album-eterno',
      title: 'Álbum Eterno',
      subtitle: 'Álbum Eterno · Boda Valeria & Andrés',
      backHref: 'index.html',
      backLabel: 'Catálogo Eterno Pase',
      savedBanner: '¡Foto guardada en el álbum de los novios!'
    };
  }

  function getShotsStorageKey() {
    return `eterno_pase_cam_shots_used_${eventConfig.id}`;
  }

  function getPolaroidsStorageKey() {
    return `eterno_pase_cam_polaroids_${eventConfig.id}`;
  }

  function getDriveUploader() {
    return EternoPase && EternoPase.DriveUploader ? EternoPase.DriveUploader : null;
  }

  function getAnalogFilter() {
    const uploader = getDriveUploader();
    return (uploader && uploader.ANALOG_FILTER) || DEFAULT_ANALOG_FILTER;
  }

  function isDriveEndpointConfigured() {
    const uploader = getDriveUploader();
    if (uploader && typeof uploader.isEndpointConfigured === 'function') {
      try {
        return Boolean(uploader.isEndpointConfigured());
      } catch (_) {
        return false;
      }
    }
    const url = global.APPS_SCRIPT_URL ? String(global.APPS_SCRIPT_URL).trim() : '';
    const upper = url.toUpperCase();
    return Boolean(url && !upper.includes('REEMPLAZA') && !upper.includes('TU_DEPLOYMENT_ID_AQUI'));
  }

  function safeStorageGet(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      global.localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function readShotsUsed() {
    const raw = safeStorageGet(getShotsStorageKey());
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 0) return 0;
    return Math.min(parsed, MAX_SHOTS);
  }

  function writeShotsUsed(value) {
    const clamped = Math.max(0, Math.min(MAX_SHOTS, Number(value) || 0));
    safeStorageSet(getShotsStorageKey(), String(clamped));
  }

  function readPolaroids() {
    const raw = safeStorageGet(getPolaroidsStorageKey());
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writePolaroids(list) {
    const candidate = Array.isArray(list) ? list.slice() : [];
    while (candidate.length >= 0) {
      try {
        global.localStorage.setItem(getPolaroidsStorageKey(), JSON.stringify(candidate));
        return candidate.length === (list ? list.length : 0);
      } catch (err) {
        const isQuota =
          err &&
          (err.name === 'QuotaExceededError' ||
            err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
            err.code === 22 ||
            err.code === 1014);
        if (!isQuota || candidate.length === 0) {
          return false;
        }
        // Elimina la instantánea más antigua (al final del arreglo) para liberar cuota
        candidate.pop();
      }
    }
    return false;
  }

  function formatTimestampMx(isoValue) {
    try {
      const date = isoValue ? new Date(isoValue) : new Date();
      if (Number.isNaN(date.getTime())) return 'Justo ahora';
      return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch (_) {
      return 'Justo ahora';
    }
  }

  function showToast(message) {
    if (!dom.toast || !message) return;
    dom.toast.textContent = message;
    dom.toast.classList.add('is-visible');
    if (toastTimerId) clearTimeout(toastTimerId);
    toastTimerId = setTimeout(() => {
      dom.toast.classList.remove('is-visible');
    }, 3000);
  }

  function setStatusBanner(mode, message) {
    if (!dom.statusBanner || !dom.statusText || !dom.statusIcon) return;

    dom.statusBanner.classList.remove('is-hidden', 'is-uploading', 'is-success', 'is-error');

    if (mode === 'hidden' || !message) {
      dom.statusBanner.classList.add('is-hidden');
      dom.statusText.textContent = '';
      dom.statusIcon.innerHTML = '';
      return;
    }

    dom.statusText.textContent = message;

    if (mode === 'uploading') {
      dom.statusBanner.classList.add('is-uploading');
      dom.statusIcon.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
    } else if (mode === 'success') {
      dom.statusBanner.classList.add('is-success');
      dom.statusIcon.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (mode === 'error') {
      dom.statusBanner.classList.add('is-error');
      dom.statusIcon.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
    }
  }

  function triggerFlash() {
    if (!dom.flashOverlay) return;
    dom.flashOverlay.classList.remove('is-flashing');
    void dom.flashOverlay.offsetWidth;
    dom.flashOverlay.classList.add('is-flashing');
    if (flashTimerId) clearTimeout(flashTimerId);
    flashTimerId = setTimeout(() => {
      dom.flashOverlay.classList.remove('is-flashing');
    }, 420);
  }

  function playShutterSound() {
    try {
      const AudioCtx = global.AudioContext || global.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtx) {
        audioCtx = new AudioCtx();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const now = audioCtx.currentTime;

      // Ruido mecánico breve de cortinilla 35mm
      const bufferSize = Math.floor(audioCtx.sampleRate * 0.045);
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }

      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;

      const bandpass = audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1950, now);
      bandpass.Q.setValueAtTime(1.4, now);

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noise.start(now);

      // Segundo click metálico sutil de cierre
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now + 0.012);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.042);

      oscGain.gain.setValueAtTime(0.18, now + 0.012);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      osc.start(now + 0.012);
      osc.stop(now + 0.05);
    } catch (_) {
      // Ignorar si AudioContext está bloqueado o no soportado
    }
  }

  function getRemainingShots() {
    return Math.max(0, MAX_SHOTS - shotsUsed);
  }

  function updateShotsUi() {
    const remaining = getRemainingShots();
    if (dom.shotsCounter) {
      dom.shotsCounter.textContent = `${remaining} / ${MAX_SHOTS} disparos`;
    }
    if (dom.shotsBadge) {
      dom.shotsBadge.classList.toggle('is-empty', remaining === 0);
    }
    if (dom.shutterBtn) {
      dom.shutterBtn.disabled = remaining === 0 || isCapturing;
      dom.shutterBtn.setAttribute(
        'aria-label',
        remaining === 0
          ? 'Rollo terminado, sin disparos restantes'
          : `Tomar foto Polaroid (${remaining} disparos restantes)`
      );
    }
  }

  function updateDemoBadgeVisibility() {
    if (!dom.demoBadge) return;
    dom.demoBadge.classList.toggle('is-hidden', isDriveEndpointConfigured());
  }

  function updateMirrorState() {
    if (!dom.video) return;
    const shouldMirror = !isSimMode && currentFacingMode === 'user';
    dom.video.classList.toggle('is-mirrored', shouldMirror);
  }

  function showFallbackOverlay(message) {
    if (!dom.fallbackOverlay) return;
    if (dom.fallbackMessage && message) {
      dom.fallbackMessage.textContent = message;
    }
    dom.fallbackOverlay.classList.remove('is-hidden');
  }

  function hideFallbackOverlay() {
    if (!dom.fallbackOverlay) return;
    dom.fallbackOverlay.classList.add('is-hidden');
  }

  function stopCameraTracks() {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {
          // Ignorar errores al detener pista
        }
      });
      mediaStream = null;
    }
    if (dom.video) {
      dom.video.srcObject = null;
    }
  }

  function drawSimulationFrame(now) {
    if (!isSimMode || !dom.simCanvas) return;
    simRafId = global.requestAnimationFrame(drawSimulationFrame);

    // ~24 fps para mantener fluidez editorial sin consumir batería innecesaria
    if (now - simLastDrawAt < 42) return;
    simLastDrawAt = now;

    const canvas = dom.simCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const t = now * 0.001;

    // Cielo dorado de atardecer editorial
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#18141c');
    sky.addColorStop(0.38, '#4a312c');
    sky.addColorStop(0.68, '#b87b48');
    sky.addColorStop(1, '#e8c184');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Sol cálido con respiración sutil
    const sunX = w * 0.5 + Math.sin(t * 0.35) * 18;
    const sunY = h * 0.44 + Math.cos(t * 0.45) * 8;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 210);
    sunGlow.addColorStop(0, 'rgba(255, 244, 214, 0.95)');
    sunGlow.addColorStop(0.28, 'rgba(235, 195, 112, 0.45)');
    sunGlow.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 210, 0, Math.PI * 2);
    ctx.fill();

    // Siluetas suaves de colinas / jardín
    ctx.fillStyle = '#2d211d';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.68);
    ctx.quadraticCurveTo(w * 0.3, h * 0.6, w * 0.62, h * 0.67);
    ctx.quadraticCurveTo(w * 0.85, h * 0.72, w, h * 0.64);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#181311';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.78);
    ctx.quadraticCurveTo(w * 0.28, h * 0.73, w * 0.54, h * 0.79);
    ctx.quadraticCurveTo(w * 0.82, h * 0.84, w, h * 0.75);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Luces bokeh cálidas tipo verbena nocturna
    for (let i = 0; i < 14; i += 1) {
      const bx = ((i * 79 + 48) % (w - 80)) + 40 + Math.sin(t * 0.6 + i) * 6;
      const by = h * 0.55 + ((i * 53) % (h * 0.34)) + Math.cos(t * 0.7 + i) * 5;
      const radius = 6 + (i % 4) * 4;
      const alpha = 0.25 + 0.25 * Math.sin(t * 1.4 + i * 0.9);
      ctx.fillStyle = `rgba(255, 224, 150, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(bx, by, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Estampa de fecha LED 35mm en vivo
    const nowDate = new Date();
    const hh = String(nowDate.getHours()).padStart(2, '0');
    const mm = String(nowDate.getMinutes()).padStart(2, '0');
    const ss = String(nowDate.getSeconds()).padStart(2, '0');

    ctx.font = '700 20px monospace';
    ctx.fillStyle = 'rgba(255, 196, 102, 0.9)';
    ctx.textAlign = 'right';
    ctx.fillText(`35MM · ${hh}:${mm}:${ss}`, w - 28, h - 28);

    ctx.font = '600 16px sans-serif';
    ctx.fillStyle = 'rgba(250, 248, 244, 0.72)';
    ctx.textAlign = 'left';
    ctx.fillText('VISOR DE PRUEBA', 28, h - 28);
  }

  function startSimulation() {
    stopCameraTracks();
    isSimMode = true;
    hideFallbackOverlay();

    if (dom.video) {
      dom.video.classList.add('is-hidden');
      dom.video.classList.remove('is-mirrored');
    }
    if (dom.simCanvas) {
      dom.simCanvas.classList.remove('is-hidden');
    }
    if (dom.liveBadge) {
      dom.liveBadge.classList.add('is-sim');
    }
    if (dom.liveLabel) {
      dom.liveLabel.textContent = 'VISOR PRUEBA · ISO 400';
    }

    if (simRafId) {
      global.cancelAnimationFrame(simRafId);
    }
    simLastDrawAt = 0;
    simRafId = global.requestAnimationFrame(drawSimulationFrame);
    showToast('Visor analógico de prueba activado.');
  }

  function stopSimulation(preserveMode) {
    if (simRafId) {
      global.cancelAnimationFrame(simRafId);
      simRafId = null;
    }
    if (!preserveMode) {
      isSimMode = false;
      if (dom.simCanvas) {
        dom.simCanvas.classList.add('is-hidden');
      }
      if (dom.video) {
        dom.video.classList.remove('is-hidden');
      }
      if (dom.liveBadge) {
        dom.liveBadge.classList.remove('is-sim');
      }
      if (dom.liveLabel) {
        dom.liveLabel.textContent = 'EN VIVO · ISO 400';
      }
    }
  }

  async function startCamera(facingMode) {
    currentFacingMode = facingMode === 'user' ? 'user' : 'environment';
    stopSimulation(false);
    stopCameraTracks();

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      showFallbackOverlay(
        'Tu navegador o contexto actual no permite acceso directo a la cámara. Usa tu carrete o el visor de prueba.'
      );
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: currentFacingMode },
          width: { ideal: 1440 },
          height: { ideal: 1920 }
        },
        audio: false
      });

      mediaStream = stream;
      if (dom.video) {
        dom.video.srcObject = stream;
        updateMirrorState();
        try {
          await dom.video.play();
        } catch (_) {
          // Algunos WebViews resuelven autoplay en el siguiente frame
        }
      }

      hideFallbackOverlay();
      if (dom.liveLabel) {
        dom.liveLabel.textContent = 'EN VIVO · ISO 400';
      }
      return true;
    } catch (err) {
      let friendlyMsg =
        'No se pudo iniciar la cámara en vivo. Puedes usar la cámara nativa de tu dispositivo o el visor de prueba.';
      if (err && err.name === 'NotAllowedError') {
        friendlyMsg =
          'Permiso de cámara denegado. Habilita el permiso en tu navegador, abre tu cámara nativa o usa el visor analógico de prueba.';
      } else if (err && err.name === 'NotFoundError') {
        friendlyMsg =
          'No detectamos una cámara física en este dispositivo. Usa el carrete o activa el visor analógico de prueba.';
      }
      showFallbackOverlay(friendlyMsg);
      return false;
    }
  }

  function hasLiveVideoReady() {
    return Boolean(
      !isSimMode &&
        dom.video &&
        dom.video.srcObject &&
        dom.video.readyState >= 2 &&
        dom.video.videoWidth > 0 &&
        dom.video.videoHeight > 0
    );
  }

  async function fallbackCaptureAndCompress(source, options) {
    const opts = options || {};
    const targetW = 1080;
    const targetH = 1440;
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    const srcW = source.videoWidth || source.naturalWidth || source.width || targetW;
    const srcH = source.videoHeight || source.naturalHeight || source.height || targetH;

    // Recorte centrado 3:4 (object-fit: cover)
    const srcRatio = srcW / srcH;
    const dstRatio = targetW / targetH;
    let sx = 0;
    let sy = 0;
    let sw = srcW;
    let sh = srcH;

    if (srcRatio > dstRatio) {
      sw = srcH * dstRatio;
      sx = (srcW - sw) / 2;
    } else if (srcRatio < dstRatio) {
      sh = srcW / dstRatio;
      sy = (srcH - sh) / 2;
    }

    ctx.save();
    if (opts.filterCss) {
      ctx.filter = opts.filterCss;
    }
    if (opts.isFrontCamera) {
      ctx.translate(targetW, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, targetW, targetH);
    ctx.restore();

    const quality = 0.84;
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const base64 = dataUrl.split(',')[1] || '';
    const sizeBytes = Math.round((base64.length * 3) / 4);
    return {
      dataUrl,
      base64,
      mimeType: 'image/jpeg',
      width: targetW,
      height: targetH,
      sizeBytes,
      sizeKB: Math.max(1, Math.round(sizeBytes / 1024)),
      qualityUsed: quality,
      fileName: opts.fileName || `ep-${eventConfig.id}-${Date.now()}.jpg`
    };
  }

  async function captureFrameWithUploader(source, options) {
    const uploader = getDriveUploader();
    if (uploader && typeof uploader.captureAndCompressFrame === 'function') {
      return uploader.captureAndCompressFrame(source, options);
    }
    return fallbackCaptureAndCompress(source, options);
  }

  async function uploadWithUploader(payload, onStatusChange) {
    const uploader = getDriveUploader();
    if (uploader && typeof uploader.uploadPhotoToDrive === 'function') {
      return uploader.uploadPhotoToDrive(payload, onStatusChange);
    }
    return {
      ok: true,
      mode: 'demo',
      fileId: `local-${Date.now()}`,
      fileName: payload.fileName,
      message: 'Guardado localmente (módulo driveUploader no disponible).'
    };
  }

  function updatePolaroidCardBadge(localId, status, label) {
    if (!dom.polaroidGrid) return;
    const escapedId =
      typeof global.CSS !== 'undefined' && typeof global.CSS.escape === 'function'
        ? global.CSS.escape(localId)
        : String(localId).replace(/[^a-zA-Z0-9_-]/g, '');
    const card = dom.polaroidGrid.querySelector(`[data-local-id="${escapedId}"]`);
    if (!card) return;
    const badge = card.querySelector('[data-role="sync-badge"]');
    if (!badge) return;
    badge.className = `polaroid-badge polaroid-badge--${status}`;
    badge.textContent = label;
  }

  function renderPolaroidCardHtml(item, options) {
    const opts = options || {};
    const imgSrc = sanitizeUrl(item.dataUrl || item.thumbnailUrl || item.fileUrl);
    const author = escapeHtml(item.guestName || 'Invitado Eterno Pase');
    const timeText = escapeHtml(formatTimestampMx(item.createdAt));
    const sizeText = item.sizeKB ? `${escapeHtml(String(item.sizeKB))} KB` : '';
    const statusClass = escapeHtml(item.status || 'synced');
    const statusLabel = escapeHtml(item.statusText || 'En Drive');
    const newClass = item.isNew ? ' is-new' : '';
    const cardIdAttr = item.localId ? ` data-local-id="${escapeHtml(item.localId)}"` : '';
    const sourceTag = opts.isPublic ? 'data-public-id' : 'data-download-id';
    const itemId = escapeHtml(item.localId || item.id || '');
    const frameMediaHtml = imgSrc
      ? `<img
            class="polaroid-card__img"
            src="${escapeHtml(imgSrc)}"
            alt="Recuerdo Polaroid de ${author}"
            loading="lazy"
          />`
      : `<div class="polaroid-card__img" role="img" aria-label="Imagen no disponible"></div>`;

    return `
      <article class="polaroid-card${newClass}"${cardIdAttr}>
        <div class="polaroid-card__frame">
          ${frameMediaHtml}
        </div>
        <div class="polaroid-card__caption">
          <div class="polaroid-card__top-row">
            <span class="polaroid-card__author">${author}</span>
            <span class="polaroid-card__time">${timeText}</span>
          </div>
          <div class="polaroid-card__meta-row">
            <div class="polaroid-card__badges">
              ${sizeText ? `<span class="polaroid-badge">${sizeText}</span>` : ''}
              <span class="polaroid-badge polaroid-badge--${statusClass}" data-role="sync-badge">${statusLabel}</span>
            </div>
            <button
              type="button"
              class="polaroid-card__download"
              ${sourceTag}="${itemId}"
              aria-label="Descargar Polaroid de ${author}"
              title="Descargar Polaroid"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              <span>Bajar</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderLocalGallery() {
    if (!dom.polaroidGrid || !dom.galleryEmpty) return;

    if (!polaroids.length) {
      dom.galleryEmpty.classList.remove('is-hidden');
      dom.polaroidGrid.innerHTML = '';
      return;
    }

    dom.galleryEmpty.classList.add('is-hidden');
    dom.polaroidGrid.innerHTML = polaroids.map((item) => renderPolaroidCardHtml(item)).join('');

    // Marca la animación solo una vez por captura recién tomada
    polaroids.forEach((item) => {
      if (item.isNew) item.isNew = false;
    });
  }

  function loadImageFromUrl(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
      img.src = src;
    });
  }

  function triggerBrowserDownload(href, fileName) {
    const safeHref = sanitizeUrl(href);
    if (!safeHref) return;
    const link = document.createElement('a');
    link.href = safeHref;
    link.download = fileName || 'polaroid-eterno-pase.jpg';
    link.rel = 'noopener noreferrer';
    if (/^https?:/i.test(safeHref)) {
      link.target = '_blank';
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function downloadPolaroid(item) {
    if (!item) return;
    const baseSrc = sanitizeUrl(item.dataUrl || item.fileUrl || item.thumbnailUrl);
    if (!baseSrc) return;

    const downloadName = (item.fileName || `polaroid-${eventConfig.id}`).replace(/\.[^.]+$/, '') + '-polaroid.jpg';

    // Para capturas locales (dataUrl) generamos la Polaroid completa con marco marfil y firma
    if (baseSrc.startsWith('data:image/')) {
      try {
        const img = await loadImageFromUrl(baseSrc);
        const cardW = 760;
        const cardH = 1070;
        const pad = 42;
        const photoW = cardW - pad * 2;
        const photoH = Math.round((photoW * 4) / 3);

        const canvas = document.createElement('canvas');
        canvas.width = cardW;
        canvas.height = cardH;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FAF8F4';
        ctx.fillRect(0, 0, cardW, cardH);

        // Ajuste cover 3:4
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        const ir = iw / ih;
        const pr = photoW / photoH;
        let sx = 0;
        let sy = 0;
        let sw = iw;
        let sh = ih;
        if (ir > pr) {
          sw = ih * pr;
          sx = (iw - sw) / 2;
        } else if (ir < pr) {
          sh = iw / pr;
          sy = (ih - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, pad, pad, photoW, photoH);

        ctx.strokeStyle = 'rgba(28, 27, 24, 0.1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(pad, pad, photoW, photoH);

        const captionY = pad + photoH + 54;
        ctx.fillStyle = '#1C1B18';
        ctx.font = 'italic 700 32px Georgia, serif';
        ctx.textAlign = 'left';
        const authorLabel = (item.guestName || eventConfig.title || 'Álbum Eterno').slice(0, 28);
        ctx.fillText(authorLabel, pad, captionY);

        ctx.fillStyle = '#666057';
        ctx.font = '600 20px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(formatTimestampMx(item.createdAt), cardW - pad, captionY);

        ctx.fillStyle = '#8C6D46';
        ctx.font = '600 15px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('ETERNO PASE · 35MM', pad, cardH - 28);

        const polaroidUrl = canvas.toDataURL('image/jpeg', 0.92);
        triggerBrowserDownload(polaroidUrl, downloadName);
        showToast('Polaroid lista para guardar.');
        return;
      } catch (_) {
        // Si falla el canvas compuesto, descarga el dataUrl directo
      }
    }

    triggerBrowserDownload(item.fileUrl || item.thumbnailUrl || baseSrc, downloadName);
  }

  async function processCapturedSource(source, captureOptions) {
    if (getRemainingShots() <= 0) {
      showToast('Has alcanzado los 10 disparos de este rollo.');
      updateShotsUi();
      return;
    }

    isCapturing = true;
    updateShotsUi();
    let activePolaroidEntry = null;

    try {
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(50);
      }
      triggerFlash();
      playShutterSound();

      const guestName = dom.guestNameInput ? dom.guestNameInput.value.trim() : '';
      const createdAt = new Date().toISOString();
      const fileName = `ep-${eventConfig.id}-${Date.now()}.jpg`;

      const captured = await captureFrameWithUploader(source, {
        isFrontCamera: Boolean(captureOptions && captureOptions.isFrontCamera),
        filterCss: getAnalogFilter(),
        fileName
      });

      shotsUsed = Math.min(MAX_SHOTS, shotsUsed + 1);
      writeShotsUsed(shotsUsed);
      updateShotsUi();

      const localId = `pol_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const polaroidEntry = {
        localId,
        fileName: captured.fileName || fileName,
        dataUrl: captured.dataUrl,
        sizeKB: captured.sizeKB,
        width: captured.width,
        height: captured.height,
        createdAt,
        guestName: guestName || 'Invitado',
        status: 'uploading',
        statusText: 'Subiendo...',
        fileId: '',
        fileUrl: '',
        isNew: true
      };

      activePolaroidEntry = polaroidEntry;
      polaroids.unshift(polaroidEntry);
      renderLocalGallery();
      writePolaroids(polaroids);

      setStatusBanner('uploading', 'Revelando y guardando en el álbum...');

      const uploadPayload = {
        eventId: eventConfig.id,
        eventTitle: eventConfig.title,
        guestName,
        fileName: polaroidEntry.fileName,
        mimeType: captured.mimeType || 'image/jpeg',
        base64: captured.base64,
        dataUrl: captured.dataUrl,
        width: captured.width,
        height: captured.height,
        sizeBytes: captured.sizeBytes,
        sizeKB: captured.sizeKB,
        timestamp: createdAt,
        createdAt
      };

      const result = await uploadWithUploader(uploadPayload, (statusArg, messageArg) => {
        const activeMessage =
          typeof messageArg === 'string' && messageArg.trim()
            ? messageArg.trim()
            : statusArg && typeof statusArg.message === 'string'
              ? statusArg.message.trim()
              : '';
        if (statusArg === 'uploading' && activeMessage) {
          setStatusBanner('uploading', activeMessage);
        }
      });

      if (result && result.ok !== false) {
        const isDemo = result.mode === 'demo';
        polaroidEntry.status = isDemo ? 'demo' : 'synced';
        polaroidEntry.statusText = isDemo ? 'Guardada (Demo)' : 'En Drive';
        polaroidEntry.fileId = result.fileId || '';
        polaroidEntry.fileUrl = result.fileUrl || '';
        writePolaroids(polaroids);
        updatePolaroidCardBadge(localId, polaroidEntry.status, polaroidEntry.statusText);
        setStatusBanner('success', eventConfig.savedBanner);
      } else {
        polaroidEntry.status = 'local';
        polaroidEntry.statusText = 'Solo local';
        writePolaroids(polaroids);
        updatePolaroidCardBadge(localId, 'local', 'Solo local');
        setStatusBanner(
          'error',
          (result && result.error) || 'No se pudo subir a Drive, pero tu Polaroid quedó guardada aquí.'
        );
      }
    } catch (err) {
      if (activePolaroidEntry) {
        activePolaroidEntry.status = 'local';
        activePolaroidEntry.statusText = 'Solo local';
        writePolaroids(polaroids);
        updatePolaroidCardBadge(activePolaroidEntry.localId, 'local', 'Solo local');
      }
      setStatusBanner(
        'error',
        (err && err.message) || 'Ocurrió un error al revelar la foto. Intenta de nuevo.'
      );
    } finally {
      isCapturing = false;
      updateShotsUi();
    }
  }

  async function handleShutterClick() {
    if (isCapturing) return;

    if (getRemainingShots() <= 0) {
      showToast('Completaste los 10 disparos de tu rollo.');
      updateShotsUi();
      return;
    }

    if (!isSimMode && !hasLiveVideoReady()) {
      showFallbackOverlay(
        'Activa tu cámara, selecciona una foto del carrete o inicia el visor analógico de prueba.'
      );
      showToast('Primero activa la cámara o el visor de prueba.');
      return;
    }

    const activeSource = isSimMode ? dom.simCanvas : dom.video;
    await processCapturedSource(activeSource, {
      isFrontCamera: !isSimMode && currentFacingMode === 'user'
    });
  }

  async function handleFileSelection(event) {
    const input = event.target;
    const file = input && input.files && input.files[0];
    if (input) input.value = '';
    if (!file) return;

    if (isCapturing) {
      showToast('Espera un segundo mientras se revela la foto actual.');
      return;
    }
    if (getRemainingShots() <= 0) {
      showToast('Completaste los 10 disparos de este rollo.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await loadImageFromUrl(objectUrl);
      await processCapturedSource(img, { isFrontCamera: false });
    } catch (_) {
      setStatusBanner('error', 'No pudimos leer esa imagen. Prueba con otra fotografía.');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function handleSwitchCamera() {
    const nextFacing = currentFacingMode === 'environment' ? 'user' : 'environment';
    if (isSimMode) {
      currentFacingMode = nextFacing;
      showToast(
        nextFacing === 'user'
          ? 'Cámara frontal seleccionada (visor de prueba).'
          : 'Cámara trasera seleccionada (visor de prueba).'
      );
      return;
    }
    startCamera(nextFacing);
  }

  function handleResetRoll() {
    shotsUsed = 0;
    writeShotsUsed(0);
    updateShotsUi();
    setStatusBanner('hidden', '');
    showToast(`Rollo reiniciado: ${MAX_SHOTS} disparos disponibles.`);
  }

  let loadedPublicPhotos = [];

  async function handleLoadPublicPhotos() {
    if (!dom.loadPublicBtn || !dom.publicSection || !dom.publicStatus || !dom.publicGrid) return;

    const uploader = getDriveUploader();
    dom.publicSection.classList.remove('is-hidden');

    if (!uploader || typeof uploader.fetchPublicEventPhotos !== 'function') {
      dom.publicStatus.textContent =
        'Conecta driveUploader.js y Apps Script para explorar las fotos públicas del evento.';
      dom.publicGrid.innerHTML = '';
      return;
    }

    dom.loadPublicBtn.disabled = true;
    dom.publicStatus.textContent = 'Consultando instantáneas públicas en Google Drive...';

    try {
      const res = await uploader.fetchPublicEventPhotos(eventConfig.id);
      const photos = res && Array.isArray(res.photos) ? res.photos : [];
      const isDemoRes = Boolean(res && res.mode === 'demo');
      loadedPublicPhotos = photos.map((p, idx) => ({
        id: p.id || `pub_${idx}`,
        fileName: p.fileName || `recuerdo-${idx + 1}.jpg`,
        thumbnailUrl: p.thumbnailUrl || p.fileUrl || '',
        fileUrl: p.fileUrl || p.thumbnailUrl || '',
        createdAt: p.createdAt || '',
        guestName: p.guestName || 'Invitado del evento',
        status: isDemoRes ? 'demo' : 'synced',
        statusText: isDemoRes ? 'Muestra Demo' : 'Álbum Drive'
      }));

      if (res && res.ok === false) {
        dom.publicStatus.textContent =
          res.error || 'No se pudieron consultar las fotos públicas del álbum en Drive.';
        dom.publicGrid.innerHTML = '';
        return;
      }

      if (!loadedPublicPhotos.length) {
        dom.publicStatus.textContent = isDemoRes
          ? 'Modo Demo: cuando conectes APPS_SCRIPT_URL verás aquí las Polaroids públicas compartidas por todos los invitados.'
          : 'Aún no hay fotografías públicas en esta carpeta. ¡Sé el primero en disparar!';
        dom.publicGrid.innerHTML = '';
        return;
      }

      dom.publicStatus.textContent = isDemoRes
        ? `Modo Demo: ${loadedPublicPhotos.length} postales Polaroid de muestra. Conecta APPS_SCRIPT_URL para ver tu carpeta real de Drive.`
        : `${loadedPublicPhotos.length} recuerdo(s) compartidos en el Álbum Eterno.`;
      dom.publicGrid.innerHTML = loadedPublicPhotos
        .map((photo) => renderPolaroidCardHtml(photo, { isPublic: true }))
        .join('');
    } catch (err) {
      dom.publicStatus.textContent =
        (err && err.message) || 'No se pudieron cargar las fotos públicas de Drive en este momento.';
    } finally {
      dom.loadPublicBtn.disabled = false;
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      if (isSimMode) {
        stopSimulation(true);
        return;
      }
      wasCameraActiveBeforeHide = Boolean(mediaStream);
      stopCameraTracks();
    } else if (document.visibilityState === 'visible') {
      if (isSimMode) {
        startSimulation();
        return;
      }
      if (wasCameraActiveBeforeHide) {
        wasCameraActiveBeforeHide = false;
        startCamera(currentFacingMode);
      }
    }
  }

  function handlePageHide() {
    if (isSimMode) {
      stopSimulation(true);
    }
    stopCameraTracks();
  }

  function bindLabelKeyboardTrigger(labelEl, inputEl) {
    if (!labelEl || !inputEl) return;
    labelEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputEl.click();
      }
    });
  }

  function cacheDom() {
    dom.backLink = document.getElementById('cam-back-link');
    dom.backLabel = document.getElementById('cam-back-label');
    dom.eventSubtitle = document.getElementById('cam-event-subtitle');
    dom.guestNameInput = document.getElementById('cam-guest-name');
    dom.video = document.getElementById('cam-video');
    dom.simCanvas = document.getElementById('cam-sim-canvas');
    dom.liveBadge = document.getElementById('cam-live-badge');
    dom.liveLabel = document.getElementById('cam-live-label');
    dom.shotsBadge = document.getElementById('cam-shots-badge');
    dom.shotsCounter = document.getElementById('cam-shots-counter');
    dom.flashOverlay = document.getElementById('cam-flash-overlay');
    dom.fallbackOverlay = document.getElementById('cam-fallback-overlay');
    dom.fallbackMessage = document.getElementById('cam-fallback-message');
    dom.retryBtn = document.getElementById('cam-retry-btn');
    dom.fallbackNativeBtn = document.getElementById('cam-fallback-native-btn');
    dom.simBtn = document.getElementById('cam-sim-btn');
    dom.switchBtn = document.getElementById('cam-switch-btn');
    dom.shutterBtn = document.getElementById('cam-shutter-btn');
    dom.fileInput = document.getElementById('cam-file-input');
    dom.nativeLabel = document.getElementById('cam-native-label');
    dom.statusBanner = document.getElementById('cam-status-banner');
    dom.statusIcon = document.getElementById('cam-status-icon');
    dom.statusText = document.getElementById('cam-status-text');
    dom.demoBadge = document.getElementById('cam-demo-badge');
    dom.loadPublicBtn = document.getElementById('cam-load-public-btn');
    dom.galleryEmpty = document.getElementById('cam-gallery-empty');
    dom.polaroidGrid = document.getElementById('cam-polaroid-grid');
    dom.publicSection = document.getElementById('cam-public-section');
    dom.publicStatus = document.getElementById('cam-public-status');
    dom.publicGrid = document.getElementById('cam-public-grid');
    dom.resetRollBtn = document.getElementById('cam-reset-roll-btn');
    dom.toast = document.getElementById('cam-toast');
  }

  function applyEventContextToDom() {
    if (dom.eventSubtitle) {
      dom.eventSubtitle.textContent = eventConfig.subtitle;
    }
    if (dom.backLink) {
      dom.backLink.href = sanitizeUrl(eventConfig.backHref) || 'index.html';
    }
    if (dom.backLabel) {
      dom.backLabel.textContent = eventConfig.backLabel;
    }
    document.title = `Cámara Desechable en Vivo | ${eventConfig.title} — Eterno Pase`;
  }

  function bindEvents() {
    if (dom.guestNameInput) {
      const savedGuest = safeStorageGet(GUEST_NAME_STORAGE_KEY);
      if (savedGuest) dom.guestNameInput.value = savedGuest;
      dom.guestNameInput.addEventListener('input', () => {
        safeStorageSet(GUEST_NAME_STORAGE_KEY, dom.guestNameInput.value.trim().slice(0, 40));
      });
    }

    if (dom.shutterBtn) {
      dom.shutterBtn.addEventListener('click', handleShutterClick);
    }
    if (dom.switchBtn) {
      dom.switchBtn.addEventListener('click', handleSwitchCamera);
    }
    if (dom.fileInput) {
      dom.fileInput.addEventListener('change', handleFileSelection);
    }
    bindLabelKeyboardTrigger(dom.nativeLabel, dom.fileInput);
    bindLabelKeyboardTrigger(dom.fallbackNativeBtn, dom.fileInput);

    if (dom.retryBtn) {
      dom.retryBtn.addEventListener('click', () => startCamera(currentFacingMode));
    }
    if (dom.simBtn) {
      dom.simBtn.addEventListener('click', startSimulation);
    }
    if (dom.loadPublicBtn) {
      dom.loadPublicBtn.addEventListener('click', handleLoadPublicPhotos);
    }
    if (dom.resetRollBtn) {
      dom.resetRollBtn.addEventListener('click', handleResetRoll);
    }

    if (dom.polaroidGrid) {
      dom.polaroidGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-download-id]');
        if (!btn) return;
        const id = btn.getAttribute('data-download-id');
        const found = polaroids.find((p) => p.localId === id);
        if (found) downloadPolaroid(found);
      });
    }

    if (dom.publicGrid) {
      dom.publicGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-public-id]');
        if (!btn) return;
        const id = btn.getAttribute('data-public-id');
        const found = loadedPublicPhotos.find((p) => p.id === id);
        if (found) downloadPolaroid(found);
      });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    global.addEventListener('pagehide', handlePageHide);
  }

  function init() {
    cacheDom();
    eventConfig = resolveEventConfig();
    applyEventContextToDom();

    shotsUsed = readShotsUsed();
    polaroids = readPolaroids();

    updateShotsUi();
    updateDemoBadgeVisibility();
    renderLocalGallery();
    bindEvents();

    startCamera('environment');
  }

  EternoPase.CameraApp = {
    MAX_SHOTS,
    escapeHtml,
    startCamera,
    startSimulation,
    handleShutterClick,
    resetRoll: handleResetRoll
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
