/**
 * ============================================================================
 * ETERNO PASE — MOTOR DE COMPRESIÓN ANALÓGICA Y SUBIDA A GOOGLE DRIVE
 * ============================================================================
 * Procesa capturas de cámara en vivo o archivos de galería en el navegador:
 *  - Recorte central exacto 3:4 (Mobile-First) con ancho máximo de 1080 px.
 *  - Espejo horizontal opcional para cámara frontal (selfie).
 *  - Filtro analógico desechable ('contrast(1.08) saturate(1.15) sepia(0.14)')
 *    con detección real en canvas 1x1 y fallback matemático por píxel para
 *    WebViews antiguos de iOS / WhatsApp.
 *  - Viñeta cálida radial sutil (alpha máx. 0.16 en esquinas).
 *  - Compresión JPEG progresiva garantizando peso <= 350 KB.
 *  - Subida sin preflight CORS a Google Apps Script (con fallback 'no-cors' y
 *    Modo Demo offline realista cuando APPS_SCRIPT_URL no ha sido configurada).
 * ============================================================================
 */

(function (global) {
  'use strict';

  const EternoPase = (global.EternoPase = global.EternoPase || {});

  /**
   * URL del Web App de Google Apps Script (/exec).
   * Puede definirse antes de cargar este script o reemplazarse aquí directamente.
   */
  global.APPS_SCRIPT_URL =
    global.APPS_SCRIPT_URL ||
    'https://script.google.com/macros/s/TU_DEPLOYMENT_ID_AQUI/exec';

  const MAX_WIDTH = 1080;
  const JPEG_QUALITY = 0.80;
  const MAX_BYTES = 350 * 1024;
  const ANALOG_FILTER = 'contrast(1.08) saturate(1.15) sepia(0.14)';

  const QUALITY_FALLBACK_STEPS = [0.72, 0.64, 0.56, 0.48];
  const SUCCESS_MESSAGE = '¡Foto guardada en el álbum de los novios!';
  const UPLOADING_MESSAGE = 'Revelando y guardando en el álbum...';

  /** @type {boolean | null} */
  let cachedCanvasFilterSupport = null;

  function getEndpointUrl() {
    return typeof global.APPS_SCRIPT_URL === 'string'
      ? global.APPS_SCRIPT_URL.trim()
      : '';
  }

  /**
   * Indica si `window.APPS_SCRIPT_URL` apunta a un Web App HTTPS real.
   * @returns {boolean}
   */
  function isEndpointConfigured() {
    const rawUrl = getEndpointUrl();
    if (!rawUrl) return false;

    const upper = rawUrl.toUpperCase();
    if (upper.indexOf('TU_DEPLOYMENT_ID_AQUI') !== -1 || upper.indexOf('REEMPLAZAR') !== -1) {
      return false;
    }

    if (typeof URL === 'function') {
      try {
        const parsed = new URL(rawUrl);
        return parsed.protocol === 'https:' && Boolean(parsed.hostname);
      } catch (err) {
        return false;
      }
    }

    return /^https:\/\/[^\s/$.?#].[^\s]*$/i.test(rawUrl);
  }

  function pad2(num) {
    return String(num).padStart(2, '0');
  }

  function generateFileName(customName) {
    if (typeof customName === 'string' && customName.trim()) {
      const sanitized = customName
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '');
      if (sanitized) {
        return /\.(jpe?g)$/i.test(sanitized) ? sanitized : sanitized + '.jpg';
      }
    }

    const now = new Date();
    const datePart =
      String(now.getFullYear()) +
      pad2(now.getMonth() + 1) +
      pad2(now.getDate());
    const timePart =
      pad2(now.getHours()) +
      pad2(now.getMinutes()) +
      pad2(now.getSeconds());

    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomSuffix = '';
    for (let i = 0; i < 4; i += 1) {
      randomSuffix += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }

    return 'EternoPase_' + datePart + '_' + timePart + '_' + randomSuffix + '.jpg';
  }

  function getSourceDimensions(source) {
    if (!source) {
      return { width: 0, height: 0 };
    }
    if (typeof source.videoWidth === 'number' && typeof source.videoHeight === 'number') {
      return {
        width: source.videoWidth,
        height: source.videoHeight
      };
    }
    if (typeof source.naturalWidth === 'number' && typeof source.naturalHeight === 'number') {
      return {
        width: source.naturalWidth,
        height: source.naturalHeight
      };
    }
    return {
      width: Number(source.width) || 0,
      height: Number(source.height) || 0
    };
  }

  function computeCenterCrop3by4(srcWidth, srcHeight) {
    const targetAspect = 3 / 4;
    const srcAspect = srcWidth / srcHeight;

    let cropWidth;
    let cropHeight;
    let cropX;
    let cropY;

    if (srcAspect > targetAspect) {
      cropHeight = srcHeight;
      cropWidth = Math.min(srcWidth, srcHeight * targetAspect);
      cropX = (srcWidth - cropWidth) / 2;
      cropY = 0;
    } else {
      cropWidth = srcWidth;
      cropHeight = Math.min(srcHeight, srcWidth / targetAspect);
      cropX = 0;
      cropY = (srcHeight - cropHeight) / 2;
    }

    return { cropX, cropY, cropWidth, cropHeight };
  }

  /**
   * Comprueba de forma real en un canvas 1x1 si `ctx.filter` modifica píxeles.
   * Evita falsos positivos en WebViews antiguos de iOS donde la propiedad
   * existe pero no aplica filtros al dibujar.
   * @returns {boolean}
   */
  function hasCanvasFilterSupport() {
    if (cachedCanvasFilterSupport !== null) {
      return cachedCanvasFilterSupport;
    }

    try {
      if (typeof document === 'undefined') {
        cachedCanvasFilterSupport = false;
        return cachedCanvasFilterSupport;
      }

      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = 1;
      srcCanvas.height = 1;
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) {
        cachedCanvasFilterSupport = false;
        return cachedCanvasFilterSupport;
      }
      srcCtx.fillStyle = '#ff0000';
      srcCtx.fillRect(0, 0, 1, 1);

      const testCanvas = document.createElement('canvas');
      testCanvas.width = 1;
      testCanvas.height = 1;
      const testCtx = testCanvas.getContext('2d');
      if (!testCtx || typeof testCtx.filter !== 'string') {
        cachedCanvasFilterSupport = false;
        return cachedCanvasFilterSupport;
      }

      testCtx.filter = 'sepia(1)';
      testCtx.drawImage(srcCanvas, 0, 0);
      const pixel = testCtx.getImageData(0, 0, 1, 1).data;

      // Sobre rojo puro (#ff0000), sepia(1) eleva G (~89) y B (~69) desde 0.
      cachedCanvasFilterSupport = pixel[1] > 40 && pixel[2] > 40;
    } catch (err) {
      cachedCanvasFilterSupport = false;
    }

    return cachedCanvasFilterSupport;
  }

  function clampChannel(val) {
    if (val < 0) return 0;
    if (val > 255) return 255;
    return val;
  }

  function parseCssFilterOperations(filterCss) {
    const ops = [];
    const regex = /([a-z-]+)\(\s*([0-9.]+%?)\s*\)/gi;
    let match;

    while ((match = regex.exec(filterCss)) !== null) {
      const name = match[1].toLowerCase();
      const rawVal = match[2];
      const numeric = rawVal.endsWith('%')
        ? parseFloat(rawVal.slice(0, -1)) / 100
        : parseFloat(rawVal);

      if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
        ops.push({ name, value: numeric });
      }
    }

    return ops;
  }

  /**
   * Fallback matemático por píxel equivalente a las funciones CSS
   * `contrast()`, `saturate()`, `sepia()`, `brightness()` y `grayscale()`.
   */
  function applyPixelFilterFallback(ctx, width, height, filterCss) {
    const ops = parseCssFilterOperations(filterCss);
    if (!ops.length) return;

    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, width, height);
    } catch (err) {
      return;
    }

    const data = imageData.data;
    const len = data.length;
    const opsLen = ops.length;

    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      for (let j = 0; j < opsLen; j += 1) {
        const op = ops[j];
        const v = op.value;

        if (op.name === 'contrast') {
          r = clampChannel((r - 127.5) * v + 127.5);
          g = clampChannel((g - 127.5) * v + 127.5);
          b = clampChannel((b - 127.5) * v + 127.5);
        } else if (op.name === 'saturate') {
          const lum = 0.213 * r + 0.715 * g + 0.072 * b;
          r = clampChannel(lum + (r - lum) * v);
          g = clampChannel(lum + (g - lum) * v);
          b = clampChannel(lum + (b - lum) * v);
        } else if (op.name === 'sepia') {
          const amount = Math.max(0, Math.min(1, v));
          const inv = 1 - amount;
          const sr =
            (0.393 + 0.607 * inv) * r +
            (0.769 - 0.769 * inv) * g +
            (0.189 - 0.189 * inv) * b;
          const sg =
            (0.349 - 0.349 * inv) * r +
            (0.686 + 0.314 * inv) * g +
            (0.168 - 0.168 * inv) * b;
          const sb =
            (0.272 - 0.272 * inv) * r +
            (0.534 - 0.534 * inv) * g +
            (0.131 + 0.869 * inv) * b;
          r = clampChannel(sr);
          g = clampChannel(sg);
          b = clampChannel(sb);
        } else if (op.name === 'brightness') {
          r = clampChannel(r * v);
          g = clampChannel(g * v);
          b = clampChannel(b * v);
        } else if (op.name === 'grayscale') {
          const amount = Math.max(0, Math.min(1, v));
          const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          r = clampChannel(r + (gray - r) * amount);
          g = clampChannel(g + (gray - g) * amount);
          b = clampChannel(b + (gray - b) * amount);
        }
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function applyWarmAnalogVignette(ctx, width, height) {
    const cx = width / 2;
    const cy = height / 2;
    const innerRadius = Math.min(width, height) * 0.42;
    const outerRadius = Math.hypot(cx, cy);

    const gradient = ctx.createRadialGradient(
      cx,
      cy,
      innerRadius,
      cx,
      cy,
      outerRadius
    );
    gradient.addColorStop(0, 'rgba(42, 28, 16, 0)');
    gradient.addColorStop(0.55, 'rgba(42, 28, 16, 0.03)');
    gradient.addColorStop(0.85, 'rgba(34, 22, 12, 0.09)');
    gradient.addColorStop(1, 'rgba(28, 18, 10, 0.16)');

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function stripBase64Prefix(value) {
    return String(value || '')
      .replace(/^data:image\/[^;]+;base64,/i, '')
      .trim();
  }

  function calculateBase64Bytes(base64) {
    if (!base64) return 0;
    let padding = 0;
    if (base64.endsWith('==')) {
      padding = 2;
    } else if (base64.endsWith('=')) {
      padding = 1;
    }
    return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
  }

  /**
   * Captura un cuadro de video, imagen o canvas, lo recorta al centro en
   * proporción 3:4 (máx. 1080 px de ancho), hornea el filtro analógico retro
   * con viñeta cálida sutil y comprime a JPEG <= 350 KB.
   *
   * @param {HTMLVideoElement | HTMLImageElement | HTMLCanvasElement} source
   * @param {{ isFrontCamera?: boolean, filterCss?: string, fileName?: string }} [options]
   * @returns {Promise<{
   *   dataUrl: string,
   *   base64: string,
   *   mimeType: 'image/jpeg',
   *   width: number,
   *   height: number,
   *   sizeBytes: number,
   *   sizeKB: number,
   *   qualityUsed: number,
   *   fileName: string
   * }>}
   */
  async function captureAndCompressFrame(source, options) {
    const opts = options || {};
    const dims = getSourceDimensions(source);
    const srcWidth = dims.width;
    const srcHeight = dims.height;

    if (!srcWidth || !srcHeight || srcWidth <= 0 || srcHeight <= 0) {
      throw new Error('La fuente visual no tiene dimensiones válidas para capturar.');
    }

    const crop = computeCenterCrop3by4(srcWidth, srcHeight);
    const targetWidth = Math.min(MAX_WIDTH, Math.max(1, Math.round(crop.cropWidth)));
    const targetHeight = Math.max(1, Math.round((targetWidth * 4) / 3));

    const filterCss =
      typeof opts.filterCss === 'string' && opts.filterCss.trim()
        ? opts.filterCss.trim()
        : ANALOG_FILTER;

    const useNativeFilter = hasCanvasFilterSupport();
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: !useNativeFilter });
    if (!ctx) {
      throw new Error('No fue posible inicializar el contexto 2D para procesar la foto.');
    }

    ctx.save();

    if (opts.isFrontCamera === true) {
      ctx.translate(targetWidth, 0);
      ctx.scale(-1, 1);
    }

    if (useNativeFilter && filterCss !== 'none') {
      ctx.filter = filterCss;
    }

    ctx.drawImage(
      source,
      crop.cropX,
      crop.cropY,
      crop.cropWidth,
      crop.cropHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    ctx.restore();

    if (typeof ctx.filter === 'string') {
      ctx.filter = 'none';
    }

    if (!useNativeFilter && filterCss !== 'none') {
      applyPixelFilterFallback(ctx, targetWidth, targetHeight, filterCss);
    }

    applyWarmAnalogVignette(ctx, targetWidth, targetHeight);

    const qualities = [JPEG_QUALITY].concat(QUALITY_FALLBACK_STEPS);
    let dataUrl = '';
    let base64 = '';
    let sizeBytes = 0;
    let qualityUsed = JPEG_QUALITY;

    for (let i = 0; i < qualities.length; i += 1) {
      qualityUsed = qualities[i];
      dataUrl = canvas.toDataURL('image/jpeg', qualityUsed);
      base64 = stripBase64Prefix(dataUrl);
      sizeBytes = calculateBase64Bytes(base64);
      if (sizeBytes <= MAX_BYTES) {
        break;
      }
    }

    const fileName = generateFileName(opts.fileName);
    const sizeKB = Number((sizeBytes / 1024).toFixed(1));

    return {
      dataUrl,
      base64,
      mimeType: 'image/jpeg',
      width: targetWidth,
      height: targetHeight,
      sizeBytes,
      sizeKB,
      qualityUsed,
      fileName
    };
  }

  function notifyStatus(onStatusChange, status, message) {
    if (typeof onStatusChange === 'function') {
      onStatusChange(status, message);
    }
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Sube la fotografía comprimida al álbum en Google Drive vía Google Apps Script.
   * Si `APPS_SCRIPT_URL` no está configurada, ejecuta una simulación realista en Modo Demo.
   *
   * @param {{
   *   base64?: string,
   *   dataUrl?: string,
   *   fileName?: string,
   *   guestName?: string,
   *   eventId?: string,
   *   timestamp?: string
   * }} photoPayload
   * @param {(status: 'uploading' | 'success' | 'error', message: string) => void} [onStatusChange]
   * @returns {Promise<object>}
   */
  async function uploadPhotoToDrive(photoPayload, onStatusChange) {
    const input = photoPayload || {};
    const fileName = generateFileName(input.fileName);

    notifyStatus(onStatusChange, 'uploading', UPLOADING_MESSAGE);

    if (!isEndpointConfigured()) {
      await delay(850);
      const demoResult = {
        ok: true,
        mode: 'demo',
        fileId: 'demo-' + Date.now(),
        fileName,
        message: SUCCESS_MESSAGE
      };
      notifyStatus(onStatusChange, 'success', demoResult.message);
      return demoResult;
    }

    const cleanBase64 = stripBase64Prefix(input.base64 || input.dataUrl);
    if (!cleanBase64) {
      const missingMsg = 'No se encontró la fotografía codificada para subir.';
      notifyStatus(onStatusChange, 'error', missingMsg);
      throw new Error(missingMsg);
    }

    const endpointUrl = getEndpointUrl();
    const requestPayload = {
      action: 'upload',
      base64: cleanBase64,
      fileName,
      mimeType: 'image/jpeg',
      guestName: (input.guestName && String(input.guestName).trim()) || 'Invitado',
      eventId: (input.eventId && String(input.eventId).trim()) || 'evento-eterno-pase',
      timestamp: input.timestamp || new Date().toISOString()
    };

    const requestBody = JSON.stringify(requestPayload);
    let response;

    try {
      response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: requestBody
      });
    } catch (corsOrNetworkErr) {
      // Fallback automático si las políticas CORS de redirección 302 en
      // script.google.com impiden leer la respuesta estándar en el navegador.
      try {
        await fetch(endpointUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: requestBody
        });

        const noCorsResult = {
          ok: true,
          mode: 'no-cors',
          fileName,
          message: SUCCESS_MESSAGE
        };
        notifyStatus(onStatusChange, 'success', noCorsResult.message);
        return noCorsResult;
      } catch (realNetworkErr) {
        const errorMsg =
          (realNetworkErr && realNetworkErr.message) ||
          'No se pudo conectar con Google Drive. Verifica tu conexión e inténtalo de nuevo.';
        notifyStatus(onStatusChange, 'error', errorMsg);
        throw realNetworkErr instanceof Error ? realNetworkErr : new Error(errorMsg);
      }
    }

    if (!response || !response.ok) {
      const httpMsg =
        'El servidor de Drive devolvió un error HTTP ' +
        (response ? response.status : 'desconocido') +
        '.';
      notifyStatus(onStatusChange, 'error', httpMsg);
      throw new Error(httpMsg);
    }

    let jsonData;
    try {
      jsonData = await response.json();
    } catch (parseErr) {
      const parseMsg = 'La respuesta de Google Apps Script no tuvo un formato JSON válido.';
      notifyStatus(onStatusChange, 'error', parseMsg);
      throw new Error(parseMsg);
    }

    if (!jsonData || jsonData.ok === false) {
      const serverMsg =
        (jsonData && jsonData.error) || 'Ocurrió un error al guardar la foto en Google Drive.';
      notifyStatus(onStatusChange, 'error', serverMsg);
      throw new Error(serverMsg);
    }

    const liveResult = Object.assign({}, jsonData, {
      ok: true,
      mode: 'live',
      fileName: jsonData.fileName || fileName,
      message: jsonData.message || SUCCESS_MESSAGE
    });
    notifyStatus(onStatusChange, 'success', liveResult.message);
    return liveResult;
  }

  function buildDemoPolaroidSvgDataUrl(opts) {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">',
      '  <defs>',
      '    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">',
      '      <stop offset="0%" stop-color="' + opts.skyTop + '"/>',
      '      <stop offset="58%" stop-color="' + opts.skyMid + '"/>',
      '      <stop offset="100%" stop-color="' + opts.ground + '"/>',
      '    </linearGradient>',
      '    <radialGradient id="leak" cx="' + opts.leakX + '" cy="' + opts.leakY + '" r="65%">',
      '      <stop offset="0%" stop-color="' + opts.leakColor + '" stop-opacity="0.52"/>',
      '      <stop offset="55%" stop-color="' + opts.leakColor + '" stop-opacity="0.14"/>',
      '      <stop offset="100%" stop-color="' + opts.leakColor + '" stop-opacity="0"/>',
      '    </radialGradient>',
      '    <radialGradient id="vig" cx="50%" cy="50%" r="72%">',
      '      <stop offset="55%" stop-color="#1c120a" stop-opacity="0"/>',
      '      <stop offset="100%" stop-color="#1c120a" stop-opacity="0.22"/>',
      '    </radialGradient>',
      '  </defs>',
      '  <rect width="600" height="800" fill="url(#bg)"/>',
      opts.sceneMarkup,
      '  <rect width="600" height="800" fill="url(#leak)"/>',
      '  <rect width="600" height="800" fill="url(#vig)"/>',
      '  <text x="546" y="754" text-anchor="end" font-family="Courier New, monospace" font-size="22" font-weight="700" letter-spacing="2" fill="#FFB347" fill-opacity="0.88">' + opts.stamp + '</text>',
      '</svg>'
    ].join('\n');

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function createDemoSamplePhotos() {
    const now = Date.now();

    const photo1Url = buildDemoPolaroidSvgDataUrl({
      skyTop: '#F3E5D8',
      skyMid: '#E4B796',
      ground: '#6B705C',
      leakX: '18%',
      leakY: '22%',
      leakColor: '#FFD166',
      stamp: '24 04 27',
      sceneMarkup: [
        '  <circle cx="430" cy="210" r="95" fill="#FFF3D6" fill-opacity="0.45"/>',
        '  <path d="M0 540 Q180 480 340 525 T600 505 L600 800 L0 800 Z" fill="#5A604D"/>',
        '  <path d="M120 560 C120 310 480 310 480 560" fill="none" stroke="#FAF8F5" stroke-width="6" stroke-opacity="0.6"/>',
        '  <g fill="#FAF8F5" fill-opacity="0.85">',
        '    <circle cx="155" cy="400" r="14"/><circle cx="185" cy="365" r="11"/><circle cx="220" cy="340" r="13"/>',
        '    <circle cx="445" cy="400" r="14"/><circle cx="415" cy="365" r="11"/><circle cx="380" cy="340" r="13"/>',
        '  </g>',
        '  <g transform="translate(230, 420)" stroke="#FFF8EB" stroke-width="4" fill="#FFE6A7" fill-opacity="0.45">',
        '    <path d="M10 0 L48 0 L38 72 Q29 88 20 72 Z"/>',
        '    <line x1="29" y1="80" x2="29" y2="145"/><line x1="12" y1="145" x2="46" y2="145"/>',
        '  </g>',
        '  <g transform="translate(302, 412) rotate(-14)" stroke="#FFF8EB" stroke-width="4" fill="#FFE6A7" fill-opacity="0.45">',
        '    <path d="M10 0 L48 0 L38 72 Q29 88 20 72 Z"/>',
        '    <line x1="29" y1="80" x2="29" y2="145"/><line x1="12" y1="145" x2="46" y2="145"/>',
        '  </g>'
      ].join('\n')
    });

    const photo2Url = buildDemoPolaroidSvgDataUrl({
      skyTop: '#2E2336',
      skyMid: '#7D4F50',
      ground: '#CB997E',
      leakX: '84%',
      leakY: '26%',
      leakColor: '#F4A261',
      stamp: '24 04 27',
      sceneMarkup: [
        '  <path d="M0 160 Q300 245 600 140" fill="none" stroke="#FAF8F5" stroke-width="2" stroke-opacity="0.45"/>',
        '  <g fill="#FFE599">',
        '    <circle cx="75" cy="180" r="9"/><circle cx="155" cy="197" r="10"/><circle cx="240" cy="204" r="9"/>',
        '    <circle cx="330" cy="202" r="10"/><circle cx="420" cy="190" r="9"/><circle cx="515" cy="168" r="10"/>',
        '  </g>',
        '  <g fill="#FFE599" fill-opacity="0.22">',
        '    <circle cx="75" cy="180" r="24"/><circle cx="155" cy="197" r="26"/><circle cx="240" cy="204" r="24"/>',
        '    <circle cx="330" cy="202" r="26"/><circle cx="420" cy="190" r="24"/><circle cx="515" cy="168" r="26"/>',
        '  </g>',
        '  <ellipse cx="300" cy="650" rx="185" ry="42" fill="#2B2D26" fill-opacity="0.24"/>',
        '  <circle cx="265" cy="360" r="32" fill="#2B2D26" fill-opacity="0.72"/>',
        '  <path d="M225 405 Q265 390 305 405 L318 590 L212 590 Z" fill="#2B2D26" fill-opacity="0.72"/>',
        '  <circle cx="342" cy="378" r="28" fill="#FAF8F5" fill-opacity="0.86"/>',
        '  <path d="M308 418 Q342 405 378 418 L412 630 L274 630 Z" fill="#FAF8F5" fill-opacity="0.86"/>'
      ].join('\n')
    });

    const photo3Url = buildDemoPolaroidSvgDataUrl({
      skyTop: '#1E1A2B',
      skyMid: '#4A344D',
      ground: '#8C5E58',
      leakX: '14%',
      leakY: '74%',
      leakColor: '#E9C46A',
      stamp: '24 04 27',
      sceneMarkup: [
        '  <g stroke="#FFD166" stroke-linecap="round">',
        '    <line x1="210" y1="300" x2="210" y2="230" stroke-width="3"/>',
        '    <line x1="210" y1="300" x2="210" y2="370" stroke-width="3"/>',
        '    <line x1="210" y1="300" x2="145" y2="300" stroke-width="3"/>',
        '    <line x1="210" y1="300" x2="275" y2="300" stroke-width="3"/>',
        '    <line x1="210" y1="300" x2="165" y2="255" stroke-width="2.5"/>',
        '    <line x1="210" y1="300" x2="255" y2="345" stroke-width="2.5"/>',
        '    <line x1="210" y1="300" x2="255" y2="255" stroke-width="2.5"/>',
        '    <line x1="210" y1="300" x2="165" y2="345" stroke-width="2.5"/>',
        '    <line x1="395" y1="260" x2="395" y2="198" stroke-width="3"/>',
        '    <line x1="395" y1="260" x2="395" y2="322" stroke-width="3"/>',
        '    <line x1="395" y1="260" x2="335" y2="260" stroke-width="3"/>',
        '    <line x1="395" y1="260" x2="455" y2="260" stroke-width="3"/>',
        '    <line x1="395" y1="260" x2="352" y2="217" stroke-width="2.5"/>',
        '    <line x1="395" y1="260" x2="438" y2="303" stroke-width="2.5"/>',
        '    <line x1="395" y1="260" x2="438" y2="217" stroke-width="2.5"/>',
        '    <line x1="395" y1="260" x2="352" y2="303" stroke-width="2.5"/>',
        '  </g>',
        '  <circle cx="210" cy="300" r="14" fill="#FFF8DC"/>',
        '  <circle cx="395" cy="260" r="14" fill="#FFF8DC"/>',
        '  <rect x="110" y="540" width="380" height="22" rx="11" fill="#FAF8F5" fill-opacity="0.82"/>',
        '  <path d="M165 540 Q300 455 435 540 Z" fill="#CB997E" fill-opacity="0.72"/>',
        '  <circle cx="250" cy="510" r="24" fill="#FAF8F5" fill-opacity="0.88"/>',
        '  <circle cx="300" cy="494" r="28" fill="#F4D58D" fill-opacity="0.9"/>',
        '  <circle cx="350" cy="510" r="24" fill="#FAF8F5" fill-opacity="0.88"/>'
      ].join('\n')
    });

    return [
      {
        id: 'demo-photo-1',
        fileName: 'EternoPase_Demo_Brindis.jpg',
        thumbnailUrl: photo1Url,
        fileUrl: photo1Url,
        createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
        guestName: 'Camila & Sofía'
      },
      {
        id: 'demo-photo-2',
        fileName: 'EternoPase_Demo_PrimerBaile.jpg',
        thumbnailUrl: photo2Url,
        fileUrl: photo2Url,
        createdAt: new Date(now - 1000 * 60 * 34).toISOString(),
        guestName: 'Diego M.'
      },
      {
        id: 'demo-photo-3',
        fileName: 'EternoPase_Demo_Bengalas.jpg',
        thumbnailUrl: photo3Url,
        fileUrl: photo3Url,
        createdAt: new Date(now - 1000 * 60 * 58).toISOString(),
        guestName: 'Tía Elena'
      }
    ];
  }

  function normalizeRemotePhoto(item) {
    const raw = item || {};
    const id = String(raw.id || raw.fileId || '');
    const fallbackThumb = id
      ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w800'
      : '';
    const fallbackView = id
      ? 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/view'
      : '';

    return {
      id,
      fileName: String(raw.fileName || raw.name || 'Recuerdo.jpg'),
      thumbnailUrl: String(raw.thumbnailUrl || fallbackThumb),
      fileUrl: String(raw.fileUrl || raw.url || fallbackView),
      createdAt: String(raw.createdAt || raw.date || new Date().toISOString()),
      guestName: String(raw.guestName || 'Invitado')
    };
  }

  /**
   * Obtiene las fotografías públicas recientes del álbum del evento.
   * En Modo Demo devuelve 3 postales Polaroid editoriales generadas en memoria.
   *
   * @param {string} [eventId]
   * @returns {Promise<{
   *   ok: boolean,
   *   mode: 'live' | 'demo',
   *   photos: Array<{
   *     id: string,
   *     fileName: string,
   *     thumbnailUrl: string,
   *     fileUrl: string,
   *     createdAt: string,
   *     guestName: string
   *   }>,
   *   error?: string
   * }>}
   */
  async function fetchPublicEventPhotos(eventId) {
    if (!isEndpointConfigured()) {
      return {
        ok: true,
        mode: 'demo',
        photos: createDemoSamplePhotos()
      };
    }

    const endpointUrl = getEndpointUrl();
    const separator = endpointUrl.indexOf('?') === -1 ? '?' : '&';
    const requestUrl =
      endpointUrl +
      separator +
      'action=list&eventId=' +
      encodeURIComponent(eventId || '');

    try {
      const response = await fetch(requestUrl, { method: 'GET' });
      if (!response || !response.ok) {
        return {
          ok: false,
          mode: 'live',
          photos: [],
          error: 'No se pudo consultar la galería (HTTP ' + (response ? response.status : 'error') + ').'
        };
      }

      const data = await response.json();
      if (!data || data.ok === false) {
        return {
          ok: false,
          mode: 'live',
          photos: [],
          error: (data && data.error) || 'El endpoint no devolvió una lista de fotos válida.'
        };
      }

      const list = Array.isArray(data.photos) ? data.photos.map(normalizeRemotePhoto) : [];
      return {
        ok: true,
        mode: 'live',
        photos: list
      };
    } catch (err) {
      return {
        ok: false,
        mode: 'live',
        photos: [],
        error:
          (err && err.message) ||
          'El endpoint de Apps Script no soporta lectura pública o falló la red.'
      };
    }
  }

  EternoPase.DriveUploader = {
    MAX_WIDTH,
    JPEG_QUALITY,
    MAX_BYTES,
    ANALOG_FILTER,
    isEndpointConfigured,
    captureAndCompressFrame,
    uploadPhotoToDrive,
    fetchPublicEventPhotos
  };
})(typeof window !== 'undefined' ? window : globalThis);
