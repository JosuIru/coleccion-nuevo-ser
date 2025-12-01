# 🚀 GUÍA DE DEPLOYMENT - CNS

## 📋 Pre-Deployment Checklist

### 1. Pruebas Locales

```bash
# Iniciar servidor local
cd /home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www
python3 -m http.server 8080
```

**Abrir:** http://localhost:8080

**Probar:**
- [ ] App carga sin errores en consola
- [ ] Click en cada libro abre correctamente
- [ ] Botones del header funcionan:
  - [ ] 📱 Android → descarga APK
  - [ ] ⚙️ IA Settings → abre modal
  - [ ] ☕ Donaciones → abre modal
  - [ ] 🌐 Idioma → abre modal y cambia idioma
  - [ ] 🧘 Manual Práctico → abre HTML
  - [ ] 🔮 Prácticas Radicales → abre HTML
- [ ] En un libro abierto:
  - [ ] 🧘 Koan → muestra koan del capítulo
  - [ ] 🎧 Audio Binaural → abre modal y reproduce

---

## 📝 Configuraciones Pre-Subida

### A. Actualizar URLs de Donaciones

**Archivo:** `www/js/features/donations-modal.js`

Buscar y reemplazar:
```javascript
// Línea ~42
href="https://ko-fi.com/TUUSUARIO"
↓
href="https://ko-fi.com/TU_USUARIO_REAL"

// Línea ~54
href="https://paypal.me/TUUSUARIO"
↓
href="https://paypal.me/TU_USUARIO_REAL"

// Línea ~66
href="https://github.com/sponsors/TUUSUARIO"
↓
href="https://github.com/sponsors/TU_USUARIO_REAL"
```

### B. Verificar Manifest (Opcional)

**Archivo:** `www/manifest.json`

Revisar:
```json
{
  "name": "Colección Nuevo Ser",
  "short_name": "CNS",
  "theme_color": "#0f172a",
  "background_color": "#0f172a",
  "start_url": "/"
}
```

---

## 📤 Subir al Servidor (FileZilla)

### 1. Configuración FileZilla

```
Servidor: gailu.net
Usuario: (tu usuario FTP)
Puerto: 21 (o el que uses)
```

### 2. Archivos a Subir

**Directorio local:**
```
/home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser/www/
```

**Directorio remoto:**
```
/desarrollo/cns/
```

**Estructura a subir:**
```
www/
├── index.html                          ← MODIFICADO
├── index-new.html
├── manual-practico.html                ← NUEVO
├── practicas-radicales.html            ← NUEVO
├── manifest.json                       ← NUEVO
├── .htaccess                           ← NUEVO
├── assets/
│   └── icons/                          ← NUEVO (6 archivos)
├── css/
├── data/
├── downloads/                          ← NUEVO (8 APKs)
├── js/
│   ├── ai/
│   ├── core/
│   │   ├── i18n.js                     ← NUEVO
│   │   ├── book-reader.js              ← MODIFICADO
│   │   └── biblioteca.js               ← MODIFICADO
│   └── features/
│       ├── language-selector.js        ← NUEVO
│       ├── ai-settings-modal.js        ← NUEVO
│       ├── donations-modal.js          ← NUEVO
│       ├── koan-generator.js           ← NUEVO
│       ├── koan-modal.js               ← NUEVO
│       ├── binaural-audio.js           ← NUEVO
│       ├── binaural-modal.js           ← NUEVO
│       ├── meditation-scripts-parser.js ← NUEVO
│       ├── radical-audio-system.js     ← NUEVO
│       └── radical-meditation-parser.js ← NUEVO
└── docs/                               ← OPCIONAL
```

### 3. Orden de Subida

**Paso 1:** Subir carpeta completa `www/` al servidor
**Paso 2:** Esperar a que termine (puede tardar por los APKs - 34 MB)
**Paso 3:** Verificar que `.htaccess` se subió correctamente

---

## ✅ Post-Deployment Testing

### 1. Abrir en Navegador

```
https://gailu.net/desarrollo/cns/
```

### 2. Verificaciones Críticas

**A. Carga sin Errores**
- [ ] Abrir consola (F12)
- [ ] No debe haber errores rojos
- [ ] Todos los scripts cargan correctamente

**B. PWA Manifest**
- [ ] Ver source de index.html
- [ ] Verificar que `<link rel="manifest" href="manifest.json">` existe
- [ ] Abrir: https://gailu.net/desarrollo/cns/manifest.json
- [ ] Debe mostrar el JSON

**C. Iconos**
- [ ] Verificar favicon en pestaña del navegador
- [ ] Abrir: https://gailu.net/desarrollo/cns/assets/icons/icon-192.png
- [ ] Debe mostrar el icono

**D. .htaccess Activo**
```bash
# Verificar compresión gzip:
curl -H "Accept-Encoding: gzip" -I https://gailu.net/desarrollo/cns/js/core/book-engine.js

# Buscar en los headers:
Content-Encoding: gzip
```

**E. Descarga de APK**
- [ ] Click en 📱 Android
- [ ] Debe descargar: CodigoDelDespertar-v1.1.5.apk
- [ ] Tamaño: 4.3 MB

**F. Todos los Modales**
- [ ] ⚙️ IA Settings → funciona
- [ ] ☕ Donaciones → funciona (URLs correctas)
- [ ] 🌐 Idioma → cambia ES ↔ EN
- [ ] 🧘 Koan → muestra koan
- [ ] 🎧 Audio Binaural → reproduce

**G. HTMLs Standalone**
- [ ] Abrir: https://gailu.net/desarrollo/cns/manual-practico.html
- [ ] Abrir: https://gailu.net/desarrollo/cns/practicas-radicales.html
- [ ] Ambos deben cargar correctamente

---

## 🔧 Troubleshooting

### Problema: Errores 404 en archivos

**Solución:**
- Verificar que FileZilla subió todos los archivos
- Revisar permisos de carpetas (755)
- Revisar permisos de archivos (644)

### Problema: .htaccess no funciona

**Solución:**
```bash
# Verificar que Apache permite .htaccess
# Contactar hosting si es necesario
```

### Problema: APKs no descargan

**Solución:**
- Verificar que `/downloads/` tiene permisos correctos
- Verificar MIME types en servidor
- Agregar a `.htaccess` si necesario:
```apache
AddType application/vnd.android.package-archive .apk
```

### Problema: Manifest.json da 404

**Solución:**
- Verificar que se subió `manifest.json` en la raíz de `/cns/`
- Verificar permisos: `chmod 644 manifest.json`

---

## 📊 Métricas de Éxito

### Performance
- [ ] PageSpeed Insights > 90
- [ ] Time to Interactive < 3s
- [ ] Gzip compression activo

### Funcionalidad
- [ ] Todas las features funcionan
- [ ] Sin errores en consola
- [ ] Mobile responsive

### PWA
- [ ] Installable en móvil
- [ ] Iconos correctos
- [ ] Theme color aplicado

---

## 🎉 Checklist Final

### Pre-Deploy
- [x] Pruebas locales completas
- [x] URLs de donaciones actualizadas
- [x] Manifest.json revisado

### Deploy
- [ ] Archivos subidos por FTP
- [ ] .htaccess verificado
- [ ] Permisos correctos

### Post-Deploy
- [ ] App carga en servidor
- [ ] Sin errores 404
- [ ] Todas las features funcionan
- [ ] APKs descargan correctamente
- [ ] Modales funcionan
- [ ] Traducciones funcionan
- [ ] Audio binaural funciona
- [ ] Koans funcionan

### Opcional
- [ ] Test en móvil (Android/iOS)
- [ ] Test en diferentes navegadores
- [ ] Compartir con usuarios beta
- [ ] Recoger feedback

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisar consola del navegador** (F12 → Console)
2. **Revisar logs del servidor** (si tienes acceso)
3. **Verificar archivos subidos** (comparar local vs servidor)
4. **Revisar permisos** (archivos: 644, carpetas: 755)

---

## 🚀 ¡Listo para Producción!

Una vez completado el checklist, tu aplicación estará 100% funcional en:

```
https://gailu.net/desarrollo/cns/
```

Con todas las funcionalidades migradas desde PRODUCTION:
- ✅ 8 APKs Android
- ✅ Traducciones ES/EN
- ✅ 24 Ejercicios de meditación
- ✅ 50+ Koans zen
- ✅ Audio binaural (5 frecuencias)
- ✅ Modales profesionales
- ✅ PWA completo
- ✅ Performance optimizada

**¡Excelente trabajo!** 🎉
