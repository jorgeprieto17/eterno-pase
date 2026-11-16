# Eterno Pase — Plataforma Oficial de Demostración

> *"Una invitación que no se desecha, dura para siempre"*

Plataforma web estática **100% Mobile-First**, optimizada para abrirse con velocidad instantánea dentro del navegador integrado de WhatsApp y desplegarse gratuitamente en **Vercel** o **Netlify** sin pasos de compilación.

## Estructura del Proyecto

- `index.html`: Vista 1 — Hub / Catálogo de demos con navegación instantánea y botón flotante a WhatsApp (`5215657978859`).
- `boda.html`: Vista 2 — Demo Boda (*Valeria & Andrés*, verde olivo `#6B705C`, terracota `#CB997E`, crema `#FAF8F5`, *Cormorant Garamond* + *Plus Jakarta Sans*).
- `xv.html`: Vista 3 — Demo XV Años (*Mis XV Sofía*, púrpura profundo `#2D1B4E`, dorado champagne `#D4AF37`, fondo oscuro `#120924`, *Playfair Display* + *Montserrat*).
- `cumpleanos.html`: Vista 4 — Demo Cumpleaños Infantil / Bautizo (*Cumpleaños #3 de Mateo*, azul cielo pastel `#A2D2FF`, amarillo suave `#FFD166`, blanco cálido `#FFFDF9`, *Fredoka* / *Quicksand* + *Plus Jakarta Sans*).
- `camara.html`: Vista 5 (ruta limpia `/camara`) — Módulo **Cámara Desechable en Vivo + Álbum Eterno**, cámara web con estética analógica (10 disparos por invitado) y carga colaborativa al álbum del evento (acepta `?evento=boda|xv|cumpleanos`).
- `css/camera.css`: Hoja de estilos editorial oscura dedicada al módulo de Cámara Desechable en Vivo (`/camara`).
- `js/demosConfig.js`: **Archivo único de configuración** con marca, textos, fechas, ubicaciones Maps/Waze, itinerario, código de vestimenta, CLABE y RSVP.
- `js/audioSynth.js`: Sintetizador WAV polifónico en memoria para la etiqueta `<audio>` HTML5 (funciona incluso sin archivos `.mp3` externos; puedes reemplazarlo colocando la URL de un `.mp3` en `music.customMp3Url`).
- `js/app.js`: Motor compartido de renderizado, Splash Screen, cuenta regresiva, copia de CLABE, enlace al módulo de cámara por evento y envío RSVP a WhatsApp.
- `js/cameraApp.js`: Controlador de interfaz e interacción de la cámara analógica en vivo y galería de disparos en `camara.html`.
- `js/driveUploader.js`: Conector de subida de capturas desde el navegador hacia Google Drive a través de Google Apps Script.
- `assets/og-*.svg`: Imágenes Open Graph configuradas para generar vista previa limpia al compartir enlaces en WhatsApp (incluye `assets/og-camara.svg` para `/camara`).
- `vercel.json` y `netlify.toml`: Soporte de rutas limpias (`/boda`, `/xv`, `/cumpleanos`, `/camara`).
- `README_APPS_SCRIPT.md`: Guía completa para desplegar el backend serverless en Google Apps Script y vincular el álbum con Google Drive.

## Cómo duplicar y personalizar un nuevo cliente en menos de 15 minutos

1. Abre `js/demosConfig.js` y copia uno de los bloques dentro de `EternoPase.DEMOS_CONFIG` (por ejemplo `boda`).
2. Cambia la clave del objeto (por ejemplo `boda_cliente`) y actualiza:
   - `title`, `subtitle`, `dateDisplay`, `cityDisplay` y `eventDate` (formato ISO `YYYY-MM-DDTHH:mm:ss-06:00`).
   - `hosts`, `locations` (enlaces a Google Maps y Waze), `itinerary`, `dressCode` y `gifts` (Banco, Beneficiario y CLABE).
   - `rsvp.whatsappTarget` con el WhatsApp del cliente (sin `+` ni espacios, ej. `5215657978859`).
   - Opcional: coloca tu archivo `.mp3` en `assets/` y pon su ruta en `music.customMp3Url`.
3. Duplica `boda.html` (por ejemplo `boda-cliente.html`), cambia `data-initial-demo="boda_cliente"` en el `<body>` y actualiza sus metatags `og:title`, `og:description` y `og:image`.
4. Sube la carpeta `eterno-pase` a Vercel o Netlify (arrastrar y soltar o conectar repositorio).

## Cámara Desechable en Vivo + Álbum Eterno (`/camara`)

- Ruta pública limpia: `/camara` (`camara.html`), accesible tanto desde el banner editorial del Hub (`index.html`) como desde el botón **Abrir Cámara del Evento** dentro de cada invitación (`camara.html?evento=<id>`).
- **Conexión con Google Drive**: Consulta la guía rápida en [`README_APPS_SCRIPT.md`](README_APPS_SCRIPT.md) para crear el Web App en **Google Apps Script**, otorgar permisos sobre la carpeta de destino en Google Drive y configurar la URL del endpoint en `js/driveUploader.js`.
