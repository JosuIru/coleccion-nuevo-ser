# NotificationService - Quick Reference Card

Referencia rápida para desarrolladores

---

## 🚀 Inicio Rápido

```javascript
import NotificationService, { NOTIFICATION_TYPES } from './services/NotificationService';

// 1. Inicializar (en App.js)
await NotificationService.initialize();

// 2. Configurar handler de acciones
global.notificationActionHandler = (type, data) => {
  navigation.navigate(data.screen, data);
};

// 3. Enviar notificación
await NotificationService.notifyCrisisNearby(crisis, distance);
```

---

## 📬 Enviar Notificaciones

### Crisis Cercana
```javascript
await NotificationService.notifyCrisisNearby({
  id: 'crisis-123',
  name: 'Contaminación Río',
  type: 'ambiental'
}, 250); // distancia en metros
```

### Misión Completada
```javascript
await NotificationService.notifyMissionCompleted(
  { id: 'mission-456', name: 'Reforestación' },
  { xp: 100, consciousness: 50, energy: 20 }
);
```

### Fractal Activado
```javascript
await NotificationService.notifyFractalActivated({
  id: 'fractal-789',
  type: 'Sabiduría'
}, 35); // distancia
```

### Energía Completa
```javascript
await NotificationService.notifyEnergyFull();
```

### Ser Descansado
```javascript
await NotificationService.notifyBeingRested({
  id: 'being-001',
  name: 'Lumina'
});
```

### Evento Comunitario
```javascript
await NotificationService.notifyCommunityEvent({
  id: 'event-001',
  name: 'Gran Limpieza Global',
  description: 'Evento mundial...'
});
```

---

## ⏰ Notificaciones Programadas

### Programar
```javascript
const date = new Date();
date.setHours(date.getHours() + 2); // en 2 horas

const id = await NotificationService.scheduleNotification(
  NOTIFICATION_TYPES.ENERGY_FULL,
  {},
  date
);
```

### Cancelar
```javascript
await NotificationService.cancelScheduledNotification(id);
```

### Recordatorio de Lectura
```javascript
// Programar para las 20:00 diariamente
await NotificationService.scheduleReadingReminder('20:00');

// Cancelar
await NotificationService.cancelReadingReminder();
```

---

## ⚙️ Configuración

### Obtener Config
```javascript
const config = NotificationService.getConfig();
```

### Actualizar Config
```javascript
await NotificationService.updateConfig({
  enabled: true,
  maxPerDay: 10,
  quietHoursStart: 22,
  quietHoursEnd: 8
});
```

### Toggle Tipo
```javascript
await NotificationService.setNotificationTypeEnabled(
  NOTIFICATION_TYPES.READING_REMINDER,
  false // deshabilitar
);
```

### Horario de Silencio
```javascript
await NotificationService.setQuietHours(22, 8); // 22:00 - 08:00
```

---

## 📊 Analytics

```javascript
const analytics = NotificationService.getAnalytics();

console.log(analytics);
// {
//   sent: 150,
//   opened: 87,
//   openRate: '58.00%',
//   byType: { ... }
// }
```

---

## 🧪 Testing

### Enviar Test
```javascript
await NotificationService.sendTestNotification(
  NOTIFICATION_TYPES.CRISIS_NEARBY
);
```

### Limpiar Notificaciones
```javascript
NotificationService.clearAllNotifications();
```

### Resetear Analytics
```javascript
await NotificationService.resetAnalytics();
```

---

## 🔌 Integración con Monitores

### Crisis Proximity
```javascript
import { CrisisProximityMonitor } from './services/NotificationIntegrationExample';

const monitor = new CrisisProximityMonitor();

// En interval o useEffect
monitor.checkNearbyCrises(userLocation, crises);
```

### Fractal Proximity
```javascript
import { FractalProximityMonitor } from './services/NotificationIntegrationExample';

const monitor = new FractalProximityMonitor();
monitor.checkNearbyFractals(userLocation, fractals);
```

### Zustand Middleware
```javascript
import { setupNotificationMiddleware } from './services/NotificationIntegrationExample';
import useGameStore from './stores/gameStore';

setupNotificationMiddleware(useGameStore);
```

---

## 📱 Tipos de Notificación

| Tipo | Prioridad | Vibra | Sonido | Ignora Silencio |
|------|-----------|-------|--------|-----------------|
| CRISIS_NEARBY | 5 | ✅ | ✅ | ❌ |
| MISSION_COMPLETED | 4 | ✅ | ✅ | ❌ |
| FRACTAL_ACTIVATED | 3 | ✅ | ❌ | ❌ |
| COMMUNITY_EVENT | 3 | ✅ | ✅ | ✅ |
| ENERGY_FULL | 2 | ❌ | ❌ | ❌ |
| BEING_RESTED | 2 | ❌ | ❌ | ❌ |
| READING_REMINDER | 1 | ❌ | ❌ | ❌ |

---

## 🛠️ Canales Android

- `crisis_notifications` - Crisis cercanas
- `mission_notifications` - Misiones
- `fractal_notifications` - Fractales
- `game_notifications` - Juego general
- `reminder_notifications` - Recordatorios
- `community_notifications` - Eventos

---

## 🔄 Background Tasks

Automáticas al inicializar:

- ✅ Energía (cada 5 min)
- ✅ Seres (cada 10 min)
- ✅ Misiones (cada 15 min)

Detener:
```javascript
NotificationService.stopBackgroundTasks();
```

---

## 🐛 Debug

### Ver Logs
```bash
# Android
npx react-native log-android | grep "🔔"

# iOS
npx react-native log-ios | grep "🔔"
```

### Verificar Estado
```javascript
console.log('Inicializado:', NotificationService.initialized);
console.log('Permisos:', NotificationService.permissionGranted);
console.log('Config:', NotificationService.getConfig());
```

### Modo Debug
```javascript
await NotificationService.updateConfig({
  maxPerDay: 999,
  quietHoursStart: -1
});
```

---

## ⚡ Atajos de Teclado (para testing)

Crear en Settings/Debug screen:

```javascript
<Button title="🔥 Crisis" onPress={() =>
  NotificationService.sendTestNotification(NOTIFICATION_TYPES.CRISIS_NEARBY)
} />

<Button title="✅ Misión" onPress={() =>
  NotificationService.sendTestNotification(NOTIFICATION_TYPES.MISSION_COMPLETED)
} />

<Button title="✨ Fractal" onPress={() =>
  NotificationService.sendTestNotification(NOTIFICATION_TYPES.FRACTAL_ACTIVATED)
} />

<Button title="🧹 Limpiar" onPress={() =>
  NotificationService.clearAllNotifications()
} />
```

---

## 📄 Documentación Completa

- **Guía Completa:** `NOTIFICATION-SERVICE-GUIDE.md`
- **Setup:** `NOTIFICATION-SETUP.md`
- **Resumen:** `NOTIFICATION-SYSTEM-SUMMARY.md`
- **Código:** `src/services/NotificationService.js`
- **Ejemplos:** `src/services/NotificationIntegrationExample.js`

---

## 🆘 Problemas Comunes

### Android: Permisos
```javascript
import { PermissionsAndroid } from 'react-native';

if (Platform.OS === 'android' && Platform.Version >= 33) {
  await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
}
```

### iOS: No aparecen
```javascript
await PushNotification.requestPermissions();
```

### Background no funciona
Android: Configuración → Batería → Sin restricciones

---

**Última actualización:** 2025-12-13
