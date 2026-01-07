# Notification Service - Guía Completa

Sistema completo de notificaciones para **Awakening Protocol**

## Índice

1. [Instalación](#instalación)
2. [Configuración Inicial](#configuración-inicial)
3. [Uso Básico](#uso-básico)
4. [Tipos de Notificaciones](#tipos-de-notificaciones)
5. [Notificaciones Programadas](#notificaciones-programadas)
6. [Background Tasks](#background-tasks)
7. [Configuración](#configuración)
8. [Analytics](#analytics)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Instalación

### 1. Instalar dependencias

```bash
cd mobile-app
npm install
```

Dependencias incluidas:
- `react-native-push-notification` - Notificaciones locales
- `react-native-background-timer` - Tareas en background
- `@react-native-firebase/app` - Firebase core
- `@react-native-firebase/messaging` - Push notifications remotas

### 2. Configuración Android

#### a) AndroidManifest.xml

Agregar permisos:

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

  <application>
    <!-- Receiver para notificaciones -->
    <receiver android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationBootEventReceiver">
      <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
      </intent-filter>
    </receiver>

    <!-- Service para notificaciones -->
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

#### b) build.gradle

```gradle
// android/app/build.gradle
dependencies {
    implementation project(':react-native-push-notification')
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
}
```

### 3. Configuración iOS

#### a) Info.plist

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

#### b) Capabilities

Habilitar en Xcode:
- Push Notifications
- Background Modes → Remote notifications

### 4. Firebase Setup (Push Notifications Remotas)

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Descargar `google-services.json` (Android) y `GoogleService-Info.plist` (iOS)
3. Colocar archivos:
   - Android: `android/app/google-services.json`
   - iOS: `ios/GoogleService-Info.plist`

---

## Configuración Inicial

### En tu App.js o componente principal:

```javascript
import { useEffect } from 'react';
import NotificationService from './src/services/NotificationService';
import { useNavigation } from '@react-navigation/native';

function App() {
  const navigation = useNavigation();

  useEffect(() => {
    // Inicializar servicio de notificaciones
    const initNotifications = async () => {
      const initialized = await NotificationService.initialize();

      if (initialized) {
        console.log('✅ Notificaciones listas');

        // Programar recordatorio diario de lectura
        await NotificationService.scheduleReadingReminder('20:00');
      }
    };

    initNotifications();

    // Configurar handler para acciones de notificaciones
    global.notificationActionHandler = (type, data) => {
      handleNotificationPress(type, data);
    };

    return () => {
      // Cleanup
      NotificationService.stopBackgroundTasks();
    };
  }, []);

  const handleNotificationPress = (type, data) => {
    switch (data.screen) {
      case 'CrisisDetail':
        navigation.navigate('CrisisDetail', { crisisId: data.crisisId });
        break;
      case 'Map':
        navigation.navigate('Map', { centerOnFractal: data.centerOnFractal });
        break;
      case 'Profile':
        navigation.navigate('Profile', { tab: data.tab });
        break;
      case 'Library':
        navigation.navigate('Library');
        break;
      // ... otros casos
    }
  };

  return (
    // ... tu app
  );
}
```

---

## Uso Básico

### Enviar una notificación

```javascript
import NotificationService, { NOTIFICATION_TYPES } from './services/NotificationService';

// Crisis cercana detectada
await NotificationService.notifyCrisisNearby(crisis, distance);

// Misión completada
await NotificationService.notifyMissionCompleted(mission, rewards);

// Fractal activado
await NotificationService.notifyFractalActivated(fractal, distance);

// Energía completa
await NotificationService.notifyEnergyFull();

// Ser descansado
await NotificationService.notifyBeingRested(being);
```

---

## Tipos de Notificaciones

### 1. Crisis Cercana (Alta Prioridad)

**Trigger:** Crisis a menos de 500m del usuario

```javascript
const crisis = {
  id: 'crisis-123',
  name: 'Contaminación del Río',
  type: 'ambiental'
};

await NotificationService.notifyCrisisNearby(crisis, 250); // 250 metros
```

**Resultado:**
- Título: "🔥 Crisis cerca de ti"
- Mensaje: "Contaminación del Río"
- Descripción: "Crisis ambiental a 250m de tu ubicación. ¡Tu ayuda es necesaria!"
- Acción: Abrir CrisisDetailScreen

---

### 2. Misión Completada

**Trigger:** Timer de misión termina

```javascript
const mission = {
  id: 'mission-456',
  name: 'Reforestación Urbana'
};

const rewards = {
  xp: 100,
  consciousness: 50,
  energy: 20
};

await NotificationService.notifyMissionCompleted(mission, rewards);
```

**Resultado:**
- Título: "✅ Misión completada"
- Mensaje: "Reforestación Urbana"
- Descripción: "Recompensas: 100 XP, 50 Consciencia, 20 Energía"
- Acción: Abrir ProfileScreen

---

### 3. Fractal Activado

**Trigger:** Fractal a menos de 50m

```javascript
const fractal = {
  id: 'fractal-789',
  type: 'Sabiduría'
};

await NotificationService.notifyFractalActivated(fractal, 35); // 35 metros
```

**Resultado:**
- Título: "✨ Fractal de Sabiduría cercano"
- Mensaje: "Toca para recolectar"
- Acción: Abrir MapScreen centrado en el fractal

---

### 4. Energía Recuperada

**Trigger:** Energía llega a 100%

```javascript
await NotificationService.notifyEnergyFull();
```

**Resultado:**
- Título: "⚡ Energía completa"
- Mensaje: "Listo para nuevas misiones"

---

### 5. Ser Descansado

**Trigger:** Ser termina de descansar

```javascript
const being = {
  id: 'being-001',
  name: 'Lumina'
};

await NotificationService.notifyBeingRested(being);
```

**Resultado:**
- Título: "💤 Lumina ha descansado"
- Mensaje: "Disponible para desplegar"

---

### 6. Recordatorio de Lectura

**Trigger:** Hora configurada por usuario

```javascript
// Programar para las 20:00 cada día
await NotificationService.scheduleReadingReminder('20:00');
```

**Resultado:**
- Título: "📚 Momento de crecer"
- Mensaje: "Lee 1 capítulo = 1 ser nuevo"
- Acción: Abrir LibraryScreen

---

### 7. Evento Comunitario

**Trigger:** Push desde servidor

```javascript
const event = {
  id: 'event-global-001',
  name: 'Gran Limpieza Global',
  description: 'Jugadores de todo el mundo unidos por un objetivo común'
};

await NotificationService.notifyCommunityEvent(event);
```

---

## Notificaciones Programadas

### Programar notificación para el futuro

```javascript
const scheduledDate = new Date();
scheduledDate.setHours(scheduledDate.getHours() + 2); // En 2 horas

const notificationId = await NotificationService.scheduleNotification(
  NOTIFICATION_TYPES.ENERGY_FULL,
  {},
  scheduledDate
);

console.log('Notificación programada con ID:', notificationId);
```

### Cancelar notificación programada

```javascript
await NotificationService.cancelScheduledNotification(notificationId);
```

### Cancelar todas las notificaciones programadas

```javascript
await NotificationService.cancelAllScheduledNotifications();
```

---

## Background Tasks

El servicio ejecuta automáticamente estas tareas en background:

### 1. Verificación de Energía (cada 5 minutos)
- Notifica cuando energía está completa
- Evita spam (solo 1 notificación cada 2 horas)

### 2. Verificación de Seres (cada 10 minutos)
- Detecta seres que terminaron de descansar
- Notifica al usuario

### 3. Verificación de Misiones (cada 15 minutos)
- Detecta misiones completadas
- Notifica recompensas

### Detener background tasks

```javascript
NotificationService.stopBackgroundTasks();
```

---

## Configuración

### Obtener configuración actual

```javascript
const config = NotificationService.getConfig();
console.log(config);
```

### Actualizar configuración

```javascript
await NotificationService.updateConfig({
  maxPerDay: 10,
  quietHoursStart: 23,
  quietHoursEnd: 7
});
```

### Habilitar/deshabilitar tipo de notificación

```javascript
// Deshabilitar recordatorios de lectura
await NotificationService.setNotificationTypeEnabled(
  NOTIFICATION_TYPES.READING_REMINDER,
  false
);

// Habilitar notificaciones de fractales
await NotificationService.setNotificationTypeEnabled(
  NOTIFICATION_TYPES.FRACTAL_ACTIVATED,
  true
);
```

### Configurar horario de silencio

```javascript
// Silencio de 22:00 a 08:00
await NotificationService.setQuietHours(22, 8);
```

### Cambiar hora del recordatorio de lectura

```javascript
await NotificationService.scheduleReadingReminder('21:30');
```

---

## Analytics

### Obtener estadísticas

```javascript
const analytics = NotificationService.getAnalytics();

console.log(analytics);
// {
//   sent: 150,
//   opened: 87,
//   dismissed: 63,
//   openRate: '58.00%',
//   byType: {
//     crisis_nearby: { sent: 45, opened: 32, dismissed: 13 },
//     mission_completed: { sent: 30, opened: 28, dismissed: 2 },
//     ...
//   }
// }
```

### Resetear analytics

```javascript
await NotificationService.resetAnalytics();
```

---

## Testing

### Enviar notificación de prueba

```javascript
// En tu pantalla de configuración/debug
import NotificationService, { NOTIFICATION_TYPES } from './services/NotificationService';

// Probar crisis cercana
await NotificationService.sendTestNotification(NOTIFICATION_TYPES.CRISIS_NEARBY);

// Probar misión completada
await NotificationService.sendTestNotification(NOTIFICATION_TYPES.MISSION_COMPLETED);

// Probar fractal activado
await NotificationService.sendTestNotification(NOTIFICATION_TYPES.FRACTAL_ACTIVATED);

// Probar recordatorio de lectura
await NotificationService.sendTestNotification(NOTIFICATION_TYPES.READING_REMINDER);
```

### Limpiar notificaciones del centro

```javascript
NotificationService.clearAllNotifications();
```

---

## Troubleshooting

### Android: Permisos no concedidos

```javascript
import { PermissionsAndroid } from 'react-native';

const checkPermissions = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );

    console.log('Permiso de notificaciones:', granted ? '✅' : '❌');
  }
};
```

### iOS: Notificaciones no aparecen

1. Verificar que se solicitaron permisos:
```javascript
PushNotification.checkPermissions((permissions) => {
  console.log('Permisos iOS:', permissions);
});
```

2. Verificar en Configuración del dispositivo → App → Notificaciones

### Notificaciones no se envían

1. Verificar que el servicio está inicializado:
```javascript
console.log('Inicializado:', NotificationService.initialized);
console.log('Permisos:', NotificationService.permissionGranted);
```

2. Verificar configuración:
```javascript
const config = NotificationService.getConfig();
console.log('Notificaciones habilitadas:', config.enabled);
console.log('Tipo habilitado:', config.enabledTypes[NOTIFICATION_TYPES.CRISIS_NEARBY]);
```

3. Verificar límite diario:
```javascript
console.log('Notificaciones enviadas hoy:', NotificationService.dailyNotificationCount);
console.log('Límite diario:', NotificationService.config.maxPerDay);
```

### Background tasks no funcionan

Android requiere que la app tenga permisos de background:

```javascript
// Verificar si la app puede ejecutar en background
import BackgroundTimer from 'react-native-background-timer';

BackgroundTimer.start();
// Si no lanza error, background está disponible
```

---

## Ejemplo Completo: Integración en GameScreen

```javascript
import React, { useEffect, useState } from 'react';
import { View, Button } from 'react-native';
import NotificationService, { NOTIFICATION_TYPES } from './services/NotificationService';
import useGameStore from './stores/gameStore';

function GameScreen() {
  const { userLocation, nearbyFractals, activeMissions } = useGameStore();
  const [fractalsNotified, setFractalsNotified] = useState(new Set());

  useEffect(() => {
    // Monitorear fractales cercanos
    const checkNearbyFractals = () => {
      nearbyFractals.forEach(async (fractal) => {
        const distance = calculateDistance(userLocation, fractal.location);

        // Si está a menos de 50m y no hemos notificado
        if (distance < 50 && !fractalsNotified.has(fractal.id)) {
          await NotificationService.notifyFractalActivated(fractal, distance);
          setFractalsNotified(prev => new Set([...prev, fractal.id]));
        }
      });
    };

    const interval = setInterval(checkNearbyFractals, 10000); // Cada 10s
    return () => clearInterval(interval);
  }, [nearbyFractals, userLocation, fractalsNotified]);

  useEffect(() => {
    // Monitorear misiones completadas
    activeMissions.forEach(async (mission) => {
      if (mission.completesAt) {
        const now = Date.now();
        const completionTime = new Date(mission.completesAt).getTime();

        if (now >= completionTime) {
          await NotificationService.notifyMissionCompleted(
            mission,
            mission.rewards
          );
        }
      }
    });
  }, [activeMissions]);

  return (
    <View>
      {/* ... tu UI ... */}

      {/* Botón de prueba */}
      <Button
        title="Probar Notificación"
        onPress={() => NotificationService.sendTestNotification(
          NOTIFICATION_TYPES.CRISIS_NEARBY
        )}
      />
    </View>
  );
}

function calculateDistance(loc1, loc2) {
  // Implementar cálculo de distancia Haversine
  // ...
}
```

---

## Configuración Inteligente

El servicio incluye:

### 1. Horario de Silencio
- Por defecto: 22:00 - 08:00
- Configurable por usuario
- Puede ser ignorado para notificaciones críticas

### 2. Límite Diario
- Máximo 5 notificaciones/día (por defecto)
- Se resetea a medianoche
- Evita spam

### 3. Priorización
Crisis > Misiones > Fractales > Eventos > Recordatorios

### 4. Agrupación
- Android agrupa notificaciones automáticamente
- iOS muestra las más recientes

---

## Próximos Pasos

1. Implementar servidor para push notifications remotas
2. Añadir notificaciones basadas en geofencing
3. Integrar con sistema de achievements
4. Personalización avanzada por usuario
5. A/B testing de formatos de notificación

---

## Soporte

Para problemas o preguntas:
- Revisa la [documentación de react-native-push-notification](https://github.com/zo0r/react-native-push-notification)
- Consulta [Firebase Cloud Messaging docs](https://firebase.google.com/docs/cloud-messaging)

---

**Última actualización:** 2025-12-13
**Versión:** 1.0.0
