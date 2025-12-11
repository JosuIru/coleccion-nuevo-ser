# 🚨 IMPORTANTE: Evitar APKs Anidadas

## El Problema

Si dejas archivos `.apk` en `www/downloads/`, Capacitor los copia automáticamente a los assets de Android. Esto causa que **cada nueva APK incluya las APKs anteriores dentro**, creciendo exponencialmente:

```
Build 1: 10 MB    ✅
Build 2: 20 MB    ⚠️  (incluye Build 1)
Build 3: 40 MB    ❌  (incluye Build 1 + Build 2)
Build 4: 80 MB    💥  (incluye Build 1 + Build 2 + Build 3)
```

## ✅ Solución Simple

### Opción 1: Usar el Script Automatizado (RECOMENDADO)

```bash
./build-apk.sh 2.8.6.4 59
```

El script:
1. 🧹 Limpia `www/downloads/*.apk` automáticamente
2. 📦 Hace `npx cap sync android`
3. 🔨 Compila con `./gradlew clean assembleDebug`
4. 💾 Guarda en `releases/` (NO en `www/downloads/`)
5. 📊 Muestra el tamaño final

### Opción 2: Proceso Manual

```bash
# 1. SIEMPRE limpiar ANTES de compilar
rm -f www/downloads/*.apk

# 2. Sync y build
npx cap sync android
cd android
./gradlew clean assembleDebug

# 3. Guardar en releases/ (NO en www/downloads/)
cp android/app/build/outputs/apk/debug/app-debug.apk \
   releases/coleccion-nuevo-ser-v2.8.6.4-build59-SIGNED.apk
```

## 📁 Estructura de Carpetas

```
/
├── www/downloads/          ← ⚠️ NUNCA guardar .apk aquí
│   └── *.html             ← Solo archivos pequeños
│
└── releases/              ← ✅ Guardar .apk aquí
    ├── v2.8.6.3-build58.apk
    └── latest.apk
```

## 🔍 Verificar que Está Funcionando

```bash
# La APK debe pesar ~10-12 MB (debug)
ls -lh releases/*.apk

# Si pesa > 15 MB, probablemente contiene APKs dentro
# Verificar assets:
unzip -l releases/latest.apk | grep "downloads.*apk"
# No debe aparecer nada
```

## 📝 Archivos Creados

- `BUILD-PROCESS.md` - Documentación completa del proceso
- `build-apk.sh` - Script automatizado
- `.gitignore` - Previene commits de APKs en www/downloads/
- `README-BUILD.md` - Este archivo (quick reference)

## ⚠️ Recordatorio

**NUNCA hagas:**
```bash
cp releases/*.apk www/downloads/  # ❌ NUNCA
```

**SIEMPRE limpia antes de compilar:**
```bash
rm -f www/downloads/*.apk  # ✅ SIEMPRE
```
