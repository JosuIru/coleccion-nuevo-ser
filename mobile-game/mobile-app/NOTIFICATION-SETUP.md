# Setup Rápido - Sistema de Notificaciones

Guía de instalación paso a paso del sistema de notificaciones para Awakening Protocol.

---

## Paso 1: Instalar Dependencias

```bash
cd mobile-app
npm install
```

Esto instalará:
- ✅ `react-native-push-notification@^8.1.1`
- ✅ `react-native-background-timer@^2.4.1`
- ✅ `@react-native-firebase/app@^18.7.3`
- ✅ `@react-native-firebase/messaging@^18.7.3`

---

## Paso 2: Configuración Android

### 2.1 - Permisos en AndroidManifest.xml

Editar `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

  <!-- Agregar estos permisos -->
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

  <application>

    <!-- Agregar receiver para boot -->
    <receiver
      android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationBootEventReceiver"
      android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
      </intent-filter>
    </receiver>

    <!-- Agregar service para notificaciones -->
    <service
      android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationListenerService"
      android:exported="false">
      <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
      </intent-filter>
    </service>

  </application>
</manifest>
```

### 2.2 - Firebase en build.gradle

Editar `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        // Agregar esta línea
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

Editar `android/app/build.gradle`:

```gradle
apply plugin: "com.android.application"
apply plugin: "com.google.gms.google-services" // Agregar esta línea

dependencies {
    implementation project(':react-native-push-notification')
}
```

### 2.3 - Firebase google-services.json

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Crear proyecto o usar existente
3. Agregar app Android
4. Descargar `google-services.json`
5. Copiar a: `android/app/google-services.json`

---

## Paso 3: Configuración iOS

### 3.1 - Permisos en Info.plist

Editar `ios/YourApp/Info.plist`:

```xml
<dict>
  <!-- Agregar esto -->
  <key>UIBackgroundModes</key>
  <array>
    <string>remote-notification</string>
  </array>
</dict>
```

### 3.2 - Capabilities en Xcode

1. Abrir `ios/YourApp.xcworkspace` en Xcode
2. Ir a Target → Signing & Capabilities
3. Click "+" → Agregar "Push Notifications"
4. Click "+" → Agregar "Background Modes"
5. Marcar "Remote notifications"

### 3.3 - Firebase GoogleService-Info.plist

1. En Firebase Console → Agregar app iOS
2. Descargar `GoogleService-Info.plist`
3. Arrastrar a Xcode en la carpeta del proyecto
4. Marcar "Copy items if needed"

### 3.4 - Instalar Pods

```bash
cd ios
pod install
cd ..
```

---

## Paso 4: Inicializar en tu App

Editar `App.js`:

```javascript
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import NotificationService from './src/services/NotificationService';

function App() {
  const navigationRef = React.useRef();

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    const initialized = await NotificationService.initialize();

    if (initialized) {
      console.log('✅ Notificaciones inicializadas');

      // Programar recordatorio de lectura
      await NotificationService.scheduleReadingReminder('20:00');

      // Configurar handler de acciones
      global.notificationActionHandler = (type, data) => {
        handleNotificationPress(type, data);
      };
    }
  };

  const handleNotificationPress = (type, data) => {
    if (navigationRef.current && data.screen) {
      navigationRef.current.navigate(data.screen, data);
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Tu app aquí */}
    </NavigationContainer>
  );
}

export default App;
```

---

## Paso 5: Probar Notificaciones

### Opción A: Desde código

```javascript
import NotificationService, { NOTIFICATION_TYPES } from './services/NotificationService';

// Probar crisis cercana
await NotificationService.sendTestNotification(NOTIFICATION_TYPES.CRISIS_NEARBY);

// Probar misión completada
await NotificationService.sendTestNotification(NOTIFICATION_TYPES.MISSION_COMPLETED);

// Probar fractal
await NotificationService.sendTestNotification(NOTIFICATION_TYPES.FRACTAL_ACTIVATED);
```

### Opción B: Crear pantalla de debug

```javascript
import React from 'react';
import { View, Button, ScrollView } from 'react-native';
import NotificationService, { NOTIFICATION_TYPES } from './services/NotificationService';

function DebugNotificationsScreen() {
  return (
    <ScrollView style={{ padding: 20 }}>
      <Button
        title="🔥 Probar Crisis Cercana"
        onPress={() => NotificationService.sendTestNotification(
          NOTIFICATION_TYPES.CRISIS_NEARBY
        )}
      />

      <Button
        title="✅ Probar Misión Completada"
        onPress={() => NotificationService.sendTestNotification(
          NOTIFICATION_TYPES.MISSION_COMPLETED
        )}
      />

      <Button
        title="✨ Probar Fractal Activado"
        onPress={() => NotificationService.sendTestNotification(
          NOTIFICATION_TYPES.FRACTAL_ACTIVATED
        )}
      />

      <Button
        title="⚡ Probar Energía Completa"
        onPress={() => NotificationService.sendTestNotification(
          NOTIFICATION_TYPES.ENERGY_FULL
        )}
      />

      <Button
        title="💤 Probar Ser Descansado"
        onPress={() => NotificationService.sendTestNotification(
          NOTIFICATION_TYPES.BEING_RESTED
        )}
      />

      <Button
        title="📚 Probar Recordatorio Lectura"
        onPress={() => NotificationService.sendTestNotification(
          NOTIFICATION_TYPES.READING_REMINDER
        )}
      />

      <Button
        title="🧹 Limpiar Notificaciones"
        onPress={() => NotificationService.clearAllNotifications()}
      />
    </ScrollView>
  );
}
```

---

## Paso 6: Verificar Funcionamiento

### Android

1. Compilar app:
```bash
npm run android
```

2. Verificar permisos en Configuración:
   - Configuración → Apps → Awakening Protocol → Notificaciones
   - Debe estar habilitado

3. Probar notificación de prueba

4. Verificar que aparece en el centro de notificaciones

### iOS

1. Compilar app:
```bash
npm run ios
```

2. Al abrir la app por primera vez, debe pedir permiso de notificaciones
   - Tocar "Permitir"

3. Probar notificación de prueba

4. Verificar que aparece

---

## Paso 7: Integrar en el Juego

### En MapScreen - Monitorear Crisis

```javascript
import { CrisisProximityMonitor } from './services/NotificationIntegrationExample';

function MapScreen() {
  const crisisMonitor = useRef(new CrisisProximityMonitor()).current;

  useEffect(() => {
    const interval = setInterval(() => {
      const userLocation = getCurrentLocation();
      const nearbyCrises = getCrises();

      crisisMonitor.checkNearbyCrises(userLocation, nearbyCrises);
    }, 10000); // Cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  // ... resto del componente
}
```

### En MapScreen - Monitorear Fractales

```javascript
import { FractalProximityMonitor } from './services/NotificationIntegrationExample';

function MapScreen() {
  const fractalMonitor = useRef(new FractalProximityMonitor()).current;

  useEffect(() => {
    const interval = setInterval(() => {
      const userLocation = getCurrentLocation();
      const nearbyFractals = getFractals();

      fractalMonitor.checkNearbyFractals(userLocation, nearbyFractals);
    }, 5000); // Cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // ... resto del componente
}
```

### Integrar con Zustand Store

```javascript
import { setupNotificationMiddleware } from './services/NotificationIntegrationExample';
import useGameStore from './stores/gameStore';

// En tu App.js o donde inicializas el store
useEffect(() => {
  setupNotificationMiddleware(useGameStore);
}, []);
```

---

## Solución de Problemas Comunes

### Android: "Permission denied for POST_NOTIFICATIONS"

**Solución:** Android 13+ requiere permiso runtime.

```javascript
import { PermissionsAndroid, Platform } from 'react-native';

if (Platform.OS === 'android' && Platform.Version >= 33) {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );

  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    console.log('Usuario rechazó permisos');
  }
}
```

### iOS: Notificaciones no aparecen

1. Verificar que se solicitaron permisos:
```javascript
PushNotification.checkPermissions((permissions) => {
  console.log('Permisos:', permissions);
});
```

2. Si `alert: false`, solicitar nuevamente:
```javascript
await PushNotification.requestPermissions();
```

### Android: App se cierra al tocar notificación

Verificar que el `MainActivity.java` está configurado correctamente:

```java
import android.os.Bundle;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null); // Importante: null en vez de savedInstanceState
  }
}
```

### Notificaciones no se programan

Verificar que la app tiene permisos de batería:

**Android:** Configuración → Batería → Sin restricciones

### Background tasks no funcionan

Android puede matar background tasks para ahorrar batería.

**Solución temporal:** Quitar app de optimización de batería.

**Solución real:** Usar WorkManager (próxima versión).

---

## Próximos Pasos

1. ✅ Configurar servidor para push notifications remotas
2. ✅ Implementar geofencing para crisis y fractales
3. ✅ Personalizar sonidos de notificación
4. ✅ Añadir badges en el icono (contador)
5. ✅ Implementar notificaciones ricas (imágenes)

---

## Recursos Adicionales

- [Documentación Completa](./NOTIFICATION-SERVICE-GUIDE.md)
- [Ejemplos de Integración](./src/services/NotificationIntegrationExample.js)
- [react-native-push-notification](https://github.com/zo0r/react-native-push-notification)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

**¿Problemas?** Revisa los logs:

```bash
# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

Buscar líneas con:
- `🔔` (inicialización)
- `✅` (éxito)
- `❌` (error)
- `⚠️` (advertencia)

---

**Última actualización:** 2025-12-13
