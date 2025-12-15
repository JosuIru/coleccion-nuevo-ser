# Arquitectura de Juegos: Frankenstein Lab + Awakening Protocol

## Resumen

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   APK 1: COLECCIÓN NUEVO SER                APK 2: AWAKENING PROTOCOL   │
│   ─────────────────────────                 ─────────────────────────   │
│                                                                         │
│   ┌───────────────────────┐                 ┌───────────────────────┐   │
│   │                       │                 │                       │   │
│   │   Biblioteca Libros   │                 │   Juego GPS           │   │
│   │   + Lector            │                 │   + Mapa              │   │
│   │   + AI Features       │                 │   + Fractales         │   │
│   │                       │                 │   + Misiones          │   │
│   │   ─────────────────   │                 │                       │   │
│   │                       │                 │   ─────────────────   │   │
│   │   FRANKENSTEIN LAB    │◄───────────────►│   SERES EN CAMPO      │   │
│   │   (Crear Seres)       │   Deep Links    │   (Usar Seres)        │   │
│   │                       │                 │                       │   │
│   └───────────────────────┘                 └───────────────────────┘   │
│                                                                         │
│   Capacitor + Web                           React Native                │
│   Package: com.nuevosser.coleccion          Package: com.awakeningprotocol.mobile
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Flujo de Usuario

### 1. Crear Ser en Frankenstein Lab

```
Usuario en Colección Nuevo Ser
    │
    ├─ Lee libros/capítulos
    │
    ├─ Completa ejercicios
    │
    ├─ Abre Frankenstein Lab
    │
    ├─ Selecciona misión
    │
    ├─ Combina piezas (capítulos + ejercicios + recursos)
    │
    ├─ Crea Ser Transformador con 15 atributos
    │
    └─ Botón "Enviar a Awakening"
         │
         └─► awakeningprotocol://receive-being?data={base64}
```

### 2. Usar Ser en Awakening Protocol

```
Awakening Protocol recibe deep link
    │
    ├─ DeepLinkService.handleReceiveBeing()
    │
    ├─ Parsea datos base64
    │
    ├─ Valida estructura del ser
    │
    ├─ Añade a gameStore.beings[]
    │
    └─ Usuario puede desplegar ser a crisis
```

### 3. Sincronización (Opcional)

```
Awakening Protocol
    │
    ├─ SyncService.syncFromWeb()
    │
    ├─ mobile-bridge.php (READ-ONLY)
    │       │
    │       └─ Lee seres de Supabase/localStorage
    │
    └─ Actualiza gameStore con seres importados
```

---

## Estructura de Datos: Ser Transformador

### Formato Base (Frankenstein Lab)

```javascript
{
    id: "being_uuid",
    name: "Ser de la Empatía",
    attributes: {
        // Mental (0-100)
        reflection: 75,
        analysis: 60,
        creativity: 80,
        // Social
        empathy: 95,
        communication: 70,
        leadership: 50,
        collaboration: 85,
        // Action
        action: 65,
        resilience: 70,
        strategy: 55,
        // Spiritual
        consciousness: 90,
        connection: 85,
        wisdom: 75,
        // Practical
        organization: 60,
        technical: 40
    },
    synergy: 78, // Promedio de atributos
    sourceApp: "coleccion-nuevo-ser",
    createdAt: "2025-12-14T10:30:00Z",
    mission: {
        id: "mission_001",
        name: "El Puente de la Empatía"
    },
    pieces: [
        { type: "chapter", id: "cap_5", book: "manual-transicion" },
        { type: "exercise", id: "ex_12" },
        { type: "resource", id: "res_3" }
    ]
}
```

### Formato Transferencia (Deep Link)

```javascript
// Codificado en base64 para deep link
{
    id: "being_uuid",
    name: "Ser de la Empatía",
    attributes: { ... },
    synergy: 78,
    sourceApp: "coleccion-nuevo-ser",
    createdAt: "2025-12-14T10:30:00Z"
}

// URL resultante:
awakeningprotocol://receive-being?data=eyJpZCI6ImJlaW5nX3V1aWQ...&name=Ser%20de%20la%20Empat%C3%ADa
```

---

## Deep Links

### Colección Nuevo Ser → Awakening Protocol

| URL | Acción |
|-----|--------|
| `awakeningprotocol://receive-being?data={base64}` | Importar ser |
| `awakeningprotocol://open?screen=BeingsScreen` | Abrir pantalla seres |
| `awakeningprotocol://sync` | Solicitar sincronización |

### Awakening Protocol → Colección Nuevo Ser

| URL | Acción |
|-----|--------|
| `nuevosser://lab` | Abrir Frankenstein Lab |
| `nuevosser://receive-being?data={base64}` | Importar ser |
| `nuevosser://book/{bookId}` | Abrir libro específico |

---

## Archivos Clave

### Colección Nuevo Ser (Capacitor)

```
www/js/core/awakening-bridge.js     # Bridge de comunicación
www/js/features/frankenstein-ui.js  # UI del laboratorio
android/app/src/main/AndroidManifest.xml  # Deep links
```

### Awakening Protocol (React Native)

```
mobile-app/src/services/DeepLinkService.js  # Handler deep links
mobile-app/src/services/SyncService.js      # Sincronización web
mobile-app/src/stores/gameStore.js          # Estado global
mobile-app/android/app/src/main/AndroidManifest.xml  # Deep links
```

---

## Comandos de Build

### APK 1: Colección Nuevo Ser

```bash
cd /home/josu/Documentos/guiaIT/25-11-25-version/coleccion-nuevo-ser

# Sincronizar web assets a Android
npx cap sync android

# Build debug APK
cd android && ./gradlew assembleDebug

# Build release APK (requiere keystore)
./gradlew assembleRelease
```

### APK 2: Awakening Protocol

```bash
cd mobile-game/mobile-app

# Instalar dependencias
npm install

# Build debug APK
cd android && ./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease
```

---

## Configuración de Producción

### 1. Google Maps API Key (Awakening Protocol)

```javascript
// mobile-app/app.json
{
    "android": {
        "config": {
            "googleMaps": {
                "apiKey": "AIza..."
            }
        }
    }
}
```

### 2. Firebase (Ambas Apps)

```bash
# Descargar google-services.json de Firebase Console
# Colocar en:
# - android/app/google-services.json (Colección)
# - mobile-game/mobile-app/android/app/google-services.json (Awakening)
```

### 3. Keystores

```bash
# Generar keystore para signing
keytool -genkey -v -keystore release.keystore \
  -alias nuevosser -keyalg RSA -keysize 2048 -validity 10000

# Configurar en gradle.properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=nuevosser
MYAPP_RELEASE_STORE_PASSWORD=***
MYAPP_RELEASE_KEY_PASSWORD=***
```

---

## Testing de Deep Links

### Desde ADB

```bash
# Probar Colección → Awakening
adb shell am start -a android.intent.action.VIEW \
  -d "awakeningprotocol://receive-being?data=eyJuYW1lIjoiVGVzdCJ9"

# Probar Awakening → Colección
adb shell am start -a android.intent.action.VIEW \
  -d "nuevosser://lab"
```

### Desde Chrome (Web)

```javascript
// Enviar ser de prueba
const testBeing = { name: "Test", attributes: { empathy: 50 } };
const url = `awakeningprotocol://receive-being?data=${btoa(JSON.stringify(testBeing))}`;
window.open(url);
```

---

## Diagrama de Secuencia

```
┌─────────┐          ┌─────────┐          ┌─────────┐
│  User   │          │Colección│          │Awakening│
└────┬────┘          └────┬────┘          └────┬────┘
     │                    │                    │
     │ Crea ser en Lab    │                    │
     │───────────────────►│                    │
     │                    │                    │
     │ Click "Enviar"     │                    │
     │───────────────────►│                    │
     │                    │                    │
     │                    │ Deep Link          │
     │                    │───────────────────►│
     │                    │                    │
     │                    │                    │ Parsea datos
     │                    │                    │─────┐
     │                    │                    │     │
     │                    │                    │◄────┘
     │                    │                    │
     │                    │                    │ Añade a store
     │                    │                    │─────┐
     │                    │                    │     │
     │                    │                    │◄────┘
     │                    │                    │
     │ Notificación       │                    │
     │◄───────────────────│◄───────────────────│
     │                    │                    │
     │ Abre Awakening     │                    │
     │────────────────────┼───────────────────►│
     │                    │                    │
     │ Ve ser importado   │                    │
     │◄───────────────────┼────────────────────│
     │                    │                    │
```

---

## FAQ

### ¿Por qué dos APKs separados?

1. **Tecnologías diferentes**: Colección usa Capacitor/Web, Awakening usa React Native
2. **Propósitos diferentes**: Lectura vs Juego GPS
3. **Tamaño**: Un APK combinado sería muy pesado (~150MB+)
4. **Actualizaciones**: Pueden actualizarse independientemente
5. **Play Store**: Mejor experiencia con apps especializadas

### ¿Qué pasa si el usuario no tiene Awakening?

- Se muestra diálogo sugiriendo descargar
- Link directo a Play Store
- Los seres quedan guardados localmente

### ¿Funciona offline?

- Frankenstein Lab: Sí (localStorage)
- Awakening Protocol: Parcial (GPS necesita conexión para fractales en vivo)
- Deep links: Necesitan que la otra app esté instalada

### ¿Cómo se sincronizan los datos?

1. **Manual**: Usuario envía ser vía deep link
2. **Auto (opcional)**: SyncService lee de Supabase cada 15 min
3. **Bidireccional**: Requiere activación explícita por usuario

---

**Última actualización**: 14 de Diciembre, 2025
**Versiones**: Colección v2.9.31+ | Awakening v1.0.0
