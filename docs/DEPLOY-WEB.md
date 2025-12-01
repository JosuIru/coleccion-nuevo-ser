# 🌐 GUÍA DE DEPLOY A WEB - gailu.net

## 📋 RESUMEN

Esta guía explica cómo subir la aplicación "Colección Nuevo Ser" a tu servidor web en gailu.net para que esté accesible públicamente.

---

## ✅ PRE-REQUISITOS

Antes de empezar, asegúrate de tener:

- ✅ Acceso FTP a gailu.net (usuario y contraseña)
- ✅ Aplicación funcionando localmente (`python3 -m http.server 8000`)
- ✅ Cliente FTP instalado (FileZilla, lftp, o el script incluido)

---

## 🚀 OPCIÓN 1: Deploy Automático con Script (Recomendado)

### Paso 1: Configurar credenciales

Edita el archivo `deploy.sh`:

```bash
nano deploy.sh
```

Cambia estas líneas (14-16):

```bash
FTP_USER="tu_usuario_ftp"  # ← Tu usuario de gailu.net
FTP_PASS="tu_password_ftp"  # ← Tu contraseña
REMOTE_DIR="/public_html/coleccion"  # ← Ruta en el servidor
```

**Ejemplo:**
```bash
FTP_USER="josu@gailu.net"
FTP_PASS="miPassword123"
REMOTE_DIR="/public_html/coleccion"
```

### Paso 2: Instalar lftp (si no lo tienes)

```bash
sudo apt-get update
sudo apt-get install lftp
```

### Paso 3: Ejecutar deploy

```bash
./deploy.sh
```

El script hará:
1. ✅ Verificar que todos los archivos estén listos
2. ✅ Crear backup local antes de subir
3. ✅ Subir todos los archivos de `www/` a gailu.net
4. ✅ Verificar que la web esté accesible

### Paso 4: Acceder a tu web

Una vez completado, accede a:
```
https://gailu.net/coleccion/
```

---

## 🖥️ OPCIÓN 2: Deploy Manual con FileZilla

### Paso 1: Abrir FileZilla

1. Instalar FileZilla (si no lo tienes):
   ```bash
   sudo apt-get install filezilla
   ```

2. Abrir FileZilla

### Paso 2: Conectar al servidor

En FileZilla:
- **Host:** `gailu.net` o `ftp.gailu.net`
- **Username:** Tu usuario FTP
- **Password:** Tu contraseña FTP
- **Port:** 21 (FTP) o 22 (SFTP)

Click **"Quickconnect"**

### Paso 3: Navegar al directorio destino

En el panel derecho (servidor remoto):
- Navega a `/public_html/` o `/httpdocs/`
- Crea carpeta `coleccion/` (si no existe)
- Entra en `coleccion/`

### Paso 4: Subir archivos

En el panel izquierdo (local):
- Navega a: `/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/`

Selecciona TODOS los archivos y carpetas dentro de `www/`:
- `index.html`
- `css/`
- `js/`
- `books/`
- `assets/`

Arrastra al panel derecho para subir.

**Importante:** Sube el CONTENIDO de `www/`, no la carpeta `www/` en sí.

### Paso 5: Verificar estructura en servidor

El servidor debe quedar así:

```
/public_html/coleccion/
├── index.html
├── css/
│   ├── core.css
│   └── themes/
├── js/
│   ├── core/
│   ├── ai/
│   └── features/
├── books/
│   ├── catalog.json
│   ├── codigo-despertar/
│   └── manifiesto/
└── assets/
```

### Paso 6: Configurar permisos (si es necesario)

En algunos servidores, necesitas ajustar permisos:

```bash
# Archivos: 644
# Directorios: 755
```

En FileZilla: Click derecho → File permissions → 644 para archivos, 755 para carpetas.

### Paso 7: Probar acceso

Abre en navegador:
```
https://gailu.net/coleccion/
```

---

## 🔧 OPCIÓN 3: Deploy con rsync/scp

Si tienes acceso SSH al servidor:

### Con rsync (más eficiente)

```bash
# Sincronizar archivos
rsync -avz --delete \
  ./www/ \
  usuario@gailu.net:/public_html/coleccion/

# -a: archive mode (preserva permisos)
# -v: verbose
# -z: compresión
# --delete: elimina archivos remotos que no existen localmente
```

### Con scp (alternativa)

```bash
# Subir carpeta completa
scp -r ./www/* usuario@gailu.net:/public_html/coleccion/
```

---

## 🌍 CONFIGURACIÓN DEL DOMINIO

### Si quieres usar un subdominio personalizado

Por ejemplo: `coleccion.gailu.net`

#### Paso 1: Crear subdominio en cPanel

1. Login a cPanel de gailu.net
2. **Domains** → **Subdomains**
3. Crear subdominio: `coleccion`
4. Document Root: `/public_html/coleccion`

#### Paso 2: Esperar propagación DNS (5-30 minutos)

#### Paso 3: Configurar HTTPS (SSL)

En cPanel:
1. **Security** → **SSL/TLS Status**
2. Buscar `coleccion.gailu.net`
3. Click **"Run AutoSSL"**

---

## 📁 ARCHIVOS A SUBIR

### Estructura completa (620 KB):

```
www/
├── index.html                      8 KB
├── css/
│   ├── core.css                    7 KB
│   └── themes/
│       ├── codigo-despertar.css    5 KB
│       └── manifiesto.css          7 KB
├── js/
│   ├── core/
│   │   ├── book-engine.js          15 KB
│   │   ├── biblioteca.js           15 KB
│   │   └── book-reader.js          12 KB
│   ├── ai/
│   │   ├── ai-config.js            12 KB
│   │   ├── ai-adapter.js           15 KB
│   │   └── contexts/
│   │       ├── codigo-despertar.txt        4 KB
│   │       ├── manifiesto-critical.txt     5 KB
│   │       ├── manifiesto-constructive.txt 6 KB
│   │       └── manifiesto-historical.txt   6 KB
│   └── features/
│       ├── ai-chat-modal.js        17 KB
│       ├── notes-modal.js          18 KB
│       ├── timeline-viewer.js      16 KB
│       ├── resources-viewer.js     16 KB
│       └── audioreader.js          20 KB
├── books/
│   ├── catalog.json                5 KB
│   ├── codigo-despertar/
│   │   ├── book.json               180 KB
│   │   └── config.json             2 KB
│   └── manifiesto/
│       ├── book.json               181 KB
│       ├── config.json             5 KB
│       └── assets/
│           ├── timeline.json       16 KB
│           └── resources.json      13 KB
└── assets/
    └── (imágenes futuras)

TOTAL: ~620 KB
```

### Archivos NO subir:

- ❌ `node_modules/` (solo para desarrollo)
- ❌ `android/` (solo para APK)
- ❌ `docs/` (documentación local)
- ❌ `.git/` (control de versiones)
- ❌ `package.json` (npm config)
- ❌ `capacitor.config.json` (Capacitor config)

---

## ⚙️ CONFIGURACIONES POST-DEPLOY

### .htaccess (Recomendado)

Crea un archivo `.htaccess` en `/public_html/coleccion/`:

```apache
# Enable gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 1 hour"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/json "access plus 1 day"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Redirect HTTP to HTTPS (opcional)
# RewriteEngine On
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### robots.txt (Opcional)

Si quieres que Google indexe tu app:

```
User-agent: *
Allow: /
Sitemap: https://gailu.net/coleccion/sitemap.xml
```

---

## 🧪 VERIFICACIÓN POST-DEPLOY

### Checklist de pruebas:

```bash
# 1. Verificar que la página carga
curl -I https://gailu.net/coleccion/

# 2. Verificar archivos críticos
curl https://gailu.net/coleccion/index.html
curl https://gailu.net/coleccion/books/catalog.json
curl https://gailu.net/coleccion/js/core/book-engine.js

# 3. Verificar tamaño (debe ser ~620 KB)
curl -s https://gailu.net/coleccion/ | wc -c
```

### Pruebas en navegador:

- [ ] Página principal carga correctamente
- [ ] Splash screen aparece y desaparece
- [ ] Ambos libros aparecen en la biblioteca
- [ ] Click en libro abre el lector
- [ ] Navegación entre capítulos funciona
- [ ] Todos los botones aparecen (🎧 📝 🤖 ⏳ 🔗)
- [ ] Chat IA funciona (con API key configurada)
- [ ] Notas se guardan correctamente
- [ ] Timeline se abre (Manifiesto)
- [ ] Recursos se abren (Manifiesto)
- [ ] Audioreader funciona

### Herramientas de verificación:

**Google PageSpeed Insights:**
```
https://pagespeed.web.dev/
```

**GTmetrix:**
```
https://gtmetrix.com/
```

---

## 🔄 ACTUALIZACIONES FUTURAS

### Proceso de actualización:

1. **Modificar archivos localmente** en `www/`
2. **Probar localmente:**
   ```bash
   cd www && python3 -m http.server 8000
   ```
3. **Ejecutar deploy:**
   ```bash
   ./deploy.sh
   ```

### Actualización manual:

1. Conectar con FileZilla
2. Subir SOLO los archivos modificados
3. Limpiar caché del navegador (Ctrl+Shift+R)

---

## 📊 MONITOREO Y ANALÍTICAS

### Google Analytics (Opcional)

Si quieres añadir analytics, edita `www/index.html` antes del `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Logs del servidor

Para ver accesos:

```bash
# En el servidor
tail -f /var/log/apache2/access.log | grep coleccion
tail -f /var/log/apache2/error.log | grep coleccion
```

---

## 🐛 TROUBLESHOOTING

### Problema: "404 Not Found"

**Causa:** Archivos no subidos o ruta incorrecta

**Solución:**
- Verifica que `index.html` está en la raíz del directorio
- Verifica la estructura de carpetas
- Revisa permisos (644 para archivos, 755 para carpetas)

### Problema: "500 Internal Server Error"

**Causa:** Error en `.htaccess` o permisos

**Solución:**
- Elimina `.htaccess` temporalmente
- Verifica permisos de archivos
- Revisa logs del servidor

### Problema: "Página en blanco"

**Causa:** Error de JavaScript o ruta incorrecta

**Solución:**
- Abre consola del navegador (F12)
- Verifica errores de carga de archivos
- Verifica que todas las rutas sean relativas (sin `/` al inicio)

### Problema: "Mixed Content" (HTTP/HTTPS)

**Causa:** Cargando recursos HTTP desde página HTTPS

**Solución:**
- Verifica que todos los recursos usan HTTPS o rutas relativas
- No hay enlaces externos HTTP en el código

### Problema: "Chat IA no funciona"

**Causa:** API key no configurada o CORS

**Solución:**
- Configurar API key en localStorage del navegador
- Verificar que proxy en gailu.net funciona
- Revisar consola para errores de red

---

## 📞 SOPORTE

Si tienes problemas con el deploy:

1. **Revisar logs:** Consola del navegador (F12) y logs del servidor
2. **Verificar permisos:** Archivos 644, carpetas 755
3. **Limpiar caché:** Ctrl+Shift+R en navegador
4. **Contactar soporte:** Si es problema del servidor de gailu.net

---

## ✅ CHECKLIST FINAL

Antes de considerar el deploy completo:

- [ ] Archivos subidos correctamente
- [ ] Estructura de carpetas correcta
- [ ] Permisos configurados
- [ ] `.htaccess` creado (opcional)
- [ ] HTTPS funcionando
- [ ] Página accesible públicamente
- [ ] Todas las features funcionan
- [ ] Sin errores en consola
- [ ] Probado en móvil y desktop
- [ ] Analytics configurado (opcional)

---

## 🎉 DEPLOY COMPLETADO

Una vez verificado todo, tu aplicación estará disponible en:

```
🌐 https://gailu.net/coleccion/
```

**¡Comparte el enlace con tus usuarios!** 🚀
