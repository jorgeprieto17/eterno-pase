# Eterno Pase — Backend sin Servidor con Google Apps Script y Google Drive

Guía lista para producción para conectar el módulo **Cámara Desechable en Vivo + Álbum Eterno** directamente a una carpeta de **Google Drive** del cliente en menos de 3 minutos, sin servidores, sin bases de datos y sin costos de almacenamiento extra.

> **Modo Demo automático:** Mientras `window.APPS_SCRIPT_URL` conserve `'TU_DEPLOYMENT_ID_AQUI'` o `'REEMPLAZAR'`, la plataforma operará en **Modo Demo** simulando la subida (~850 ms) y mostrando 3 postales Polaroid de muestra en memoria para demostraciones comerciales.

---

## Guía rápida paso a paso

### Paso 1: Crear la carpeta del evento en Google Drive y obtener su ID

1. Abre [Google Drive](https://drive.google.com) con la cuenta donde deseas recibir las fotografías.
2. Crea una carpeta nueva para el evento (por ejemplo: `Album Boda Valeria y Andres`).
3. Abre la carpeta y revisa la URL en la barra de direcciones de tu navegador:
   ```text
   https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz123456
   ```
4. El **ID de la carpeta** es el texto al final de la URL después de `/folders/` (en el ejemplo anterior: `1AbCdEfGhIjKlMnOpQrStUvWxYz123456`). Cópialo.

#### Permisos recomendados para la galería colaborativa

- Si deseas que las miniaturas del **Álbum Eterno** sean visibles para todos los invitados desde la galería colaborativa de la invitación:
  1. Haz clic derecho sobre la carpeta en Google Drive → **Compartir** → **Compartir**.
  2. En *Acceso general*, cambia **Restringido** a **"Cualquier persona con el enlace"** con rol de **Lector** (*puede ver*).
- Si el cliente prefiere un álbum privado donde solo los novios/anfitriones vean las fotos dentro de Google Drive, puedes dejar la carpeta como **Restringida**: las subidas de los invitados (`doPost`) seguirán funcionando normalmente porque el script se ejecuta con tu propia cuenta.

---

### Paso 2: Crear el proyecto en Google Apps Script

1. Ingresa a **[https://script.new](https://script.new)** (se abrirá un editor nuevo con un archivo llamado `Código.gs`).
2. Borra el contenido inicial (`function myFunction() {}`) y pega íntegramente el bloque de código **`Código.gs`** que aparece más abajo en este documento.
3. Busca y reemplaza **`'ID_CARPETA_DEL_CLIENTE'`** (aparece tanto en `doPost` como en `doGet`) por el ID real que copiaste en el Paso 1 (conservando las comillas simples, por ejemplo `'1AbCdEfGhIjKlMnOpQrStUvWxYz123456'`).
4. Guarda el proyecto (**Ctrl + S** / **Cmd + S**) y ponle un nombre descriptivo (ej. `Eterno Pase - Album en Vivo`).

---

### Paso 3: Desplegar como Aplicación Web

1. En la esquina superior derecha del editor de Apps Script, haz clic en **Implementar** → **Nueva implementación**.
2. En **Seleccionar tipo** (ícono de engrane), elige **Aplicación web**.
3. Configura exactamente estos campos:
   - **Descripción:** `Eterno Pase Álbum en Vivo v1`
   - **Ejecutar como:** **Yo** *(tu cuenta de Google, propietaria o editora de la carpeta)*
   - **Quién tiene acceso:** **Cualquier persona** *(indispensable para que los invitados puedan subir fotos desde WhatsApp sin iniciar sesión)*
4. Haz clic en **Implementar**.
5. Si Google solicita autorización por primera vez:
   - Selecciona **Autorizar acceso** y elige tu cuenta.
   - Si aparece la pantalla *"Google no verificó esta aplicación"*, haz clic en **Configuración avanzada** → **Ir a Eterno Pase... (no seguro)** → **Permitir**.
6. Copia la **URL de la aplicación web** generada (siempre termina en `/exec`, por ejemplo):
   ```text
   https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec
   ```

---

### Paso 4: Conectar la URL `/exec` en Eterno Pase

Tienes dos formas de configurar el endpoint en tu proyecto:

#### Opción A: Directamente en `js/driveUploader.js`
Abre [js/driveUploader.js](js/driveUploader.js) y reemplaza la URL por defecto en `global.APPS_SCRIPT_URL`:

```js
global.APPS_SCRIPT_URL =
  global.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/TU_URL_REAL_DE_APPS_SCRIPT/exec';
```

#### Opción B: Antes de cargar `js/driveUploader.js` en el HTML del cliente (recomendado para múltiples clientes)
En la plantilla HTML específica del cliente (por ejemplo `boda-cliente.html`), define `window.APPS_SCRIPT_URL` justo **antes** de la etiqueta `<script src="js/driveUploader.js">`:

```html
<script>
  window.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/TU_URL_REAL_DE_APPS_SCRIPT/exec';
</script>
<script src="js/driveUploader.js"></script>
```

---

## Código exacto de Google Apps Script (`Código.gs`)

Copia y pega este código completo en `Código.gs` dentro de [https://script.new](https://script.new):

```javascript
/**
 * ============================================================================
 * ETERNO PASE — BACKEND SIN SERVIDOR PARA CÁMARA EN VIVO + ÁLBUM ETERNO
 * ============================================================================
 * Recibe fotografías JPEG comprimidas en Base64 vía POST y las guarda
 * directamente en la carpeta de Google Drive del evento.
 * Además expone vía GET las últimas 30 fotos para la galería colaborativa.
 * ============================================================================
 */

function doPost(e) {
  try {
    var payload = {};

    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var rawBase64 = payload.base64 || payload.image || '';
    if (!rawBase64) {
      throw new Error('No se recibió ninguna imagen en Base64.');
    }

    var mimeType = payload.mimeType || 'image/jpeg';
    var dataUrlMatch = String(rawBase64).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/i);
    if (dataUrlMatch && !payload.mimeType) {
      mimeType = dataUrlMatch[1];
    }

    var cleanBase64 = String(rawBase64)
      .replace(/^data:image\/[^;]+;base64,/i, '')
      .replace(/\s+/g, '');

    var fileName =
      payload.fileName && String(payload.fileName).trim()
        ? String(payload.fileName).trim()
        : 'EternoPase_' + new Date().getTime() + '.jpg';

    var guestName =
      payload.guestName && String(payload.guestName).trim()
        ? String(payload.guestName).trim()
        : 'Invitado';

    var eventId =
      payload.eventId && String(payload.eventId).trim()
        ? String(payload.eventId).trim()
        : '';

    var bytes = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);
    var file = DriveApp.getFolderById('ID_CARPETA_DEL_CLIENTE').createFile(blob);

    try {
      file.setDescription(
        JSON.stringify({
          guestName: guestName,
          eventId: eventId,
          timestamp: payload.timestamp || new Date().toISOString()
        })
      );
    } catch (metaErr) {
      // No crítico: el archivo ya quedó guardado correctamente en Drive
    }

    return ContentService
      .createTextOutput(
        JSON.stringify({
          ok: true,
          status: 'success',
          fileId: file.getId(),
          fileName: file.getName(),
          fileUrl: file.getUrl(),
          thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w800',
          message: '¡Foto guardada en el álbum de los novios!'
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(
        JSON.stringify({
          ok: false,
          error: err.message
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var requestedEventId =
      e && e.parameter && e.parameter.eventId
        ? String(e.parameter.eventId).trim()
        : '';

    var files = DriveApp.getFolderById('ID_CARPETA_DEL_CLIENTE').getFiles();
    var items = [];

    while (files.hasNext()) {
      var file = files.next();
      if (file.isTrashed()) {
        continue;
      }

      var mime = file.getMimeType() || '';
      if (mime.indexOf('image/') !== 0) {
        continue;
      }

      var guestName = 'Invitado';
      var itemEventId = '';
      var rawDesc = file.getDescription();

      if (rawDesc) {
        try {
          var meta = JSON.parse(rawDesc);
          if (meta && meta.guestName) {
            guestName = String(meta.guestName);
          }
          if (meta && meta.eventId) {
            itemEventId = String(meta.eventId);
          }
        } catch (descErr) {
          // Ignorar descripciones no JSON
        }
      }

      if (requestedEventId && itemEventId && itemEventId !== requestedEventId) {
        continue;
      }

      var createdDate = file.getDateCreated();
      items.push({
        id: file.getId(),
        fileName: file.getName(),
        thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w800',
        fileUrl: file.getUrl(),
        createdAt: createdDate.toISOString(),
        guestName: guestName,
        _ts: createdDate.getTime()
      });
    }

    items.sort(function (a, b) {
      return b._ts - a._ts;
    });

    var recentPhotos = items.slice(0, 30).map(function (item) {
      return {
        id: item.id,
        fileName: item.fileName,
        thumbnailUrl: item.thumbnailUrl,
        fileUrl: item.fileUrl,
        createdAt: item.createdAt,
        guestName: item.guestName
      };
    });

    return ContentService
      .createTextOutput(
        JSON.stringify({
          ok: true,
          photos: recentPhotos
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(
        JSON.stringify({
          ok: false,
          error: err.message
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## Verificación y notas de producción

- **Prueba rápida del endpoint GET:** Abre en tu navegador `TU_URL_EXEC?action=list`. Deberías ver un JSON como `{"ok":true,"photos":[]}` (o la lista de imágenes existentes en la carpeta).
- **Miniaturas públicas en galería:** Recuerda compartir la carpeta de Google Drive como **"Cualquier persona con el enlace puede ver"** para que los navegadores de los invitados puedan cargar las URLs `https://drive.google.com/thumbnail?id=...&sz=w800` sin requerir sesión de Google.
- **Compatibilidad CORS:** `js/driveUploader.js` envía el `POST` con `Content-Type: text/plain;charset=utf-8` para evitar la petición `OPTIONS` (*preflight*) que Google Apps Script no responde, y cuenta con respaldo automático en modo `no-cors` ante redirecciones estrictas de WebViews móviles.
- **Si editas `Código.gs` en el futuro:** Cada cambio requiere ir a **Implementar → Administrar implementaciones → Editar (lápiz) → Versión: Nueva versión → Implementar**, ya que guardar con Ctrl+S únicamente actualiza el borrador de prueba (`/dev`), no la URL pública (`/exec`).
