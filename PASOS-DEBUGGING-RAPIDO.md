# ⚡ PASOS PARA DEBUGGEAR LA APK - GUÍA RÁPIDA

## 🎯 Objetivo
Identificar por qué la APK del Awakening Protocol no inicia en tu dispositivo Android

---

## 📋 REQUISITOS

Tienes dos opciones:

### OPCIÓN A: Con dispositivo Android físico (Recomendado)
- [ ] Dispositivo Android (teléfono o tablet)
- [ ] Cable USB
- [ ] "USB Debugging" habilitado en el dispositivo
- [ ] ADB (Android Debug Bridge) instalado

### OPCIÓN B: Sin dispositivo (usa emulador)
- [ ] Android Emulator o Android Studio
- [ ] ADB instalado

---

## 🚀 PASOS RÁPIDOS (15 minutos)

### PASO 1: Habilitar USB Debugging (solo si no está habilitado)

En tu dispositivo Android:

```
1. Abre Configuración
2. Busca "Acerca del teléfono" o "Información del dispositivo"
3. Toca "Número de compilación" 7 veces
4. Aparecerá "Opciones de desarrollador" desbloqueadas
5. Vuelve atrás y abre "Opciones de desarrollador"
6. Activa "Depuración USB"
```

### PASO 2: Conectar dispositivo y verificar

En tu computadora (terminal/CMD):

```bash
# Conectar dispositivo por USB

# Verificar que lo detecta
adb devices
```

**Resultado esperado:**
```
List of devices attached
RZ8N410V2FL     device
```

Si dice `unauthorized`, en tu teléfono acepta la notificación "Permitir depuración USB".

---

### PASO 3: Desinstalar versión anterior (si es necesario)

```bash
adb uninstall com.awakeningprotocol
```

---

### PASO 4: Instalar APK DEBUG (nueva versión)

Tengo dos versiones disponibles:

**Opción 1: APK Debug (con símbolos de debugging)** ← RECOMENDADA
```bash
adb install -r www/downloads/awakening-protocol-debug.apk
```

**Opción 2: APK Release (versión anterior)**
```bash
adb install -r www/downloads/awakening-protocol-latest.apk
```

**Esperado:**
```
Success
```

---

### PASO 5: Preparar logs (antes de abrir la app)

**Terminal 1 - Ver logs en tiempo real:**
```bash
adb logcat -c  # Limpiar logs previos

adb logcat | tee awakening-log.txt
```

Esto mostrará los logs Y los guardará en `awakening-log.txt`

**NO CIERRES ESTA TERMINAL**

---

### PASO 6: Abrir la app desde el dispositivo

**En tu teléfono:**
1. Toca el ícono de "Awakening Protocol"
2. Espera 10 segundos (aunque no veas nada)

**Si la app carga:** ¡Perfecto! Sigue al Paso 8
**Si la app NO carga:** Sigue al Paso 7

---

### PASO 7: Detener logs y analizar

**En Terminal 1:** Presiona `CTRL+C` para detener

**Buscar errores en el archivo:**
```bash
# Ver todo el contenido
cat awakening-log.txt

# Ver solo errores y crashes
grep -E "FATAL|Error|Exception|Crash" awakening-log.txt

# Ver logs específicos de nuestra app
grep "com.awakeningprotocol" awakening-log.txt
```

**Copiar el error completo y compartirmelo**

---

### PASO 8: Si la app FUNCIONA

¡Excelente! Significa que el debug APK funciona correctamente.

Próximos pasos:
1. Probar todas las pantallas
2. Abrir mapa, seres, misiones, etc.
3. Reportar cuál es la primera pantalla que falla (si falla)

---

## 🔍 ERRORES COMUNES Y SOLUCIONES RÁPIDAS

### Error: "Device not found"
```bash
# Solución 1: Reconectar USB
# Desconecta y reconecta el cable USB

# Solución 2: Reiniciar ADB
adb kill-server
adb start-server
adb devices

# Solución 3: Activar USB Debugging nuevamente
# (En el teléfono)
```

---

### Error: "Installation failed"
```bash
# Solución 1: Desinstalar versión anterior
adb uninstall com.awakeningprotocol

# Solución 2: Instalar con -r (replace)
adb install -r www/downloads/awakening-protocol-debug.apk

# Solución 3: Si aún falla, ver logs
adb shell pm install www/downloads/awakening-protocol-debug.apk
```

---

### App abre pero muestra pantalla blanca/negra

**En los logs busca:**
```
E/ReactNativeJS: Error
E/RNGestureHandler:
E/com.google.android: Google Maps API key
```

**Soluciones:**
- Google Maps API Key no configurada (problema conocido)
- Falta de permisos de ubicación

---

### App muestra "Initializing..." y no continúa

**En los logs busca:**
```
E/AndroidRuntime: FATAL EXCEPTION
E/LoadedApk: Unable to instantiate
```

**Significa:**
- Error al cargar algún módulo JavaScript
- Error en la inicialización de React Native

---

## 📱 PASOS ESPECÍFICOS PARA TU DISPOSITIVO

Si tienes un **Huawei, Xiaomi, Samsung** o similar, algunos pasos adicionales:

### Xiaomi:
```
Configuración → Privacidad → Aplicaciones → Permisos
→ Activar TODOS los permisos para Awakening Protocol
```

### Samsung:
```
Configuración → Aplicaciones → Awakening Protocol
→ Permisos → Activar:
  - Ubicación
  - Cámara
  - Almacenamiento
```

### Huawei:
```
Configuración → Privacidad → Gestor de permisos
→ Seleccionar permisos para Awakening Protocol
```

---

## 📤 INFORMACIÓN A COMPARTIR

Una vez tengas los logs, comparteix conmigo:

```
1. DISPOSITIVO:
   - Marca: (Samsung, Xiaomi, etc.)
   - Modelo: (Galaxy S20, Redmi Note 10, etc.)
   - Android version: (10, 11, 12, 13, 14, etc.)

2. LOGS:
   - Contenido de awakening-log.txt (o la línea de error)
   - Específicamente cualquier "FATAL EXCEPTION"

3. DESCRIPCIÓN:
   - ¿La app abre o no?
   - ¿Muestra pantalla blanca?
   - ¿Muestra error específico?
```

---

## ⏱️ HORARIO

**Los pasos 1-7 deberían tomar máximo 15 minutos**

Si necesitas más tiempo:
1. Paso 1-2: 2 minutos
2. Paso 3-4: 1 minuto
3. Paso 5: 1 minuto
4. Paso 6-7: 5-10 minutos (según compilación)

---

## 🆘 SI NO PUEDES HACER ADB

Si no tienes acceso a ADB o terminal, alternativas:

### Opción 1: Usar Android Studio
1. Instalar Android Studio
2. Conectar dispositivo
3. Abrir Logcat desde Android Studio
4. Instalar APK arrastrando a la ventana

### Opción 2: Probar el APK directamente
1. Descargar APK en el teléfono
2. Abrirlo directamente desde archivos
3. Instalarlo manualmente
4. Ver si da error específico

### Opción 3: Usar Genymotion (emulador)
1. Descargar Genymotion
2. Crear emulador
3. Instalar APK en emulador
4. Ver logs desde Genymotion

---

## ✅ CHECKLIST

Marca cada paso:

- [ ] USB Debugging habilitado en teléfono
- [ ] Dispositivo conectado y reconocido por `adb devices`
- [ ] APK desinstalada (versión anterior)
- [ ] APK debug instalada correctamente
- [ ] Logcat abierto en Terminal 1
- [ ] App abierta desde dispositivo
- [ ] Esperé 10 segundos
- [ ] Revisé logs para errores
- [ ] Copiché el error principal
- [ ] Tengo la info del dispositivo (marca, modelo, Android version)

---

## 🎯 SIGUIENTE PASO

Una vez ejecutes estos pasos:

1. **Si la app funciona:**
   - Reporta que funciona
   - Prueba todas las pantallas
   - Reporta dónde falla (si falla)

2. **Si hay error:**
   - Copia el error del log
   - Comparte la línea de error específica
   - Reporta tu dispositivo y Android version
   - Yo compilaré un fix

3. **Si no puedes hacer ADB:**
   - Usa una de las alternativas
   - O compartix screenshots del error

---

## 📞 CONTACTO

Cuando tengas los resultados, compartix:

1. **Si funciona:** "La app abre, estoy en [pantalla que ves]"
2. **Si no funciona:** El error exacto del logcat
3. **Tu dispositivo:** Marca, modelo, Android version

Yo compilaré un fix basado en el error encontrado.

---

*Guía de debugging rápido - Awakening Protocol*
*2025-12-14*
*Toma 15 minutos, identifica el problema, y listo.*

