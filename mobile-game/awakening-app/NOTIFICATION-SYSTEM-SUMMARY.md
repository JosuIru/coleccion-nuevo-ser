# Sistema de Notificaciones - Resumen Ejecutivo

## ✅ Implementación Completa

Sistema de notificaciones profesional para **Awakening Protocol** - Mobile Game.

---

## 📁 Archivos Creados

### 1. NotificationService.js (1,205 líneas)
**Ubicación:** `/src/services/NotificationService.js`

**Funcionalidades:**
- ✅ Gestión completa de permisos (Android/iOS)
- ✅ 7 tipos de notificaciones diferentes
- ✅ Notificaciones locales y push (Firebase)
- ✅ Scheduling inteligente con cooldowns
- ✅ Horario de silencio configurable (22:00-08:00)
- ✅ Límite diario (5 notificaciones/día)
- ✅ Priorización automática
- ✅ Background tasks para monitoreo continuo
- ✅ Analytics completo (enviadas, abiertas, descartadas)
- ✅ Persistencia de configuración
- ✅ Funciones de testing

### 2. NotificationIntegrationExample.js (550+ líneas)
**Ubicación:** `/src/services/NotificationIntegrationExample.js`

**Incluye:**
- ✅ 10 ejemplos completos de integración
- ✅ Monitores de proximidad (Crisis, Fractales)
- ✅ Monitor de misiones completadas
- ✅ Monitor de energía y seres descansando
- ✅ Middleware para Zustand store
- ✅ Hook de React (useNotifications)
- ✅ Componente de configuración
- ✅ Setup de push notifications remotas

### 3. NOTIFICATION-SERVICE-GUIDE.md
**Ubicación:** `/mobile-app/NOTIFICATION-SERVICE-GUIDE.md`

**Contenido:**
- Guía completa de uso del servicio
- Documentación de API
- Ejemplos de código para cada tipo de notificación
- Configuración avanzada
- Analytics y debugging
- Troubleshooting

### 4. NOTIFICATION-SETUP.md
**Ubicación:** `/mobile-app/NOTIFICATION-SETUP.md`

**Contenido:**
- Guía paso a paso de instalación
- Configuración Android (manifest, gradle, Firebase)
- Configuración iOS (Info.plist, Xcode, Pods)
- Setup de Firebase
- Verificación y testing
- Solución de problemas comunes

### 5. package.json (Actualizado)
**Dependencias agregadas:**
```json
{
  "react-native-push-notification": "^8.1.1",
  "react-native-background-timer": "^2.4.1",
  "@react-native-firebase/app": "^18.7.3",
  "@react-native-firebase/messaging": "^18.7.3"
}
```

---

## 🔔 Tipos de Notificaciones

### 1. Crisis Cercana (Prioridad: 5 - Máxima)
- **Trigger:** Crisis a <500m del usuario
- **Título:** "🔥 Crisis cerca de ti"
- **Canal:** crisis_notifications
- **Vibración:** ✅ | **Sonido:** ✅

### 2. Misión Completada (Prioridad: 4)
- **Trigger:** Timer de misión termina
- **Título:** "✅ Misión completada"
- **Canal:** mission_notifications
- **Vibración:** ✅ | **Sonido:** ✅

### 3. Fractal Activado (Prioridad: 3)
- **Trigger:** Fractal a <50m
- **Título:** "✨ Fractal de [tipo] cercano"
- **Canal:** fractal_notifications
- **Vibración:** ✅ | **Sonido:** ❌

### 4. Energía Completa (Prioridad: 2)
- **Trigger:** Energía = 100%
- **Título:** "⚡ Energía completa"
- **Canal:** game_notifications
- **Vibración:** ❌ | **Sonido:** ❌

### 5. Ser Descansado (Prioridad: 2)
- **Trigger:** Ser termina de descansar
- **Título:** "💤 [Nombre] ha descansado"
- **Canal:** game_notifications
- **Vibración:** ❌ | **Sonido:** ❌

### 6. Recordatorio de Lectura (Prioridad: 1)
- **Trigger:** Hora programada (20:00 por defecto)
- **Título:** "📚 Momento de crecer"
- **Canal:** reminder_notifications
- **Vibración:** ❌ | **Sonido:** ❌
- **Repetición:** Diaria

### 7. Evento Comunitario (Prioridad: 3)
- **Trigger:** Push desde servidor
- **Título:** "🌍 Evento global"
- **Canal:** community_notifications
- **Vibración:** ✅ | **Sonido:** ✅
- **Ignora horario de silencio:** ✅

---

## ⚙️ Características Inteligentes

### 1. Horario de Silencio
- **Por defecto:** 22:00 - 08:00
- **Configurable:** Por usuario
- **Excepciones:** Eventos críticos pueden ignorarlo

### 2. Límite Diario
- **Por defecto:** Máximo 5 notificaciones/día
- **Reseteo:** Automático a medianoche
- **Evita:** Spam y molestias al usuario

### 3. Priorización
```
Crisis (5) > Misiones (4) > Fractales (3) = Eventos (3) >
Energía (2) = Seres (2) > Recordatorios (1)
```

### 4. Cooldowns Inteligentes
- **Crisis:** 30 minutos entre notificaciones de la misma crisis
- **Energía completa:** 2 horas mínimo entre notificaciones
- **Fractales:** No se notifica el mismo fractal dos veces

### 5. Agrupación
- Android agrupa automáticamente por canal
- iOS muestra las más recientes primero

---

## 🔄 Background Tasks

### Task 1: Monitoreo de Energía
- **Frecuencia:** Cada 5 minutos
- **Función:** Detecta cuando energía llega a 100%
- **Notifica:** Solo si pasaron 2+ horas desde última notificación

### Task 2: Monitoreo de Seres
- **Frecuencia:** Cada 10 minutos
- **Función:** Detecta seres que terminaron de descansar
- **Notifica:** Una vez por ser

### Task 3: Monitoreo de Misiones
- **Frecuencia:** Cada 15 minutos
- **Función:** Detecta misiones completadas
- **Notifica:** Con recompensas detalladas

**Nota:** Background tasks funcionan aunque la app esté cerrada (requiere configuración Android/iOS correcta).

---

## 📊 Analytics

### Métricas Rastreadas
- **Total enviadas:** Contador global
- **Total abiertas:** Cuando usuario toca notificación
- **Total descartadas:** Cuando usuario descarta sin abrir
- **Por tipo:** Desglose detallado de cada tipo de notificación
- **Open rate:** Porcentaje de apertura (abiertas/enviadas * 100)

### Acceso a Analytics
```javascript
const analytics = NotificationService.getAnalytics();

console.log(analytics);
// {
//   sent: 150,
//   opened: 87,
//   dismissed: 63,
//   openRate: '58.00%',
//   byType: { ... }
// }
```

---

## 🛠️ API Principal

### Inicialización
```javascript
await NotificationService.initialize();
```

### Enviar Notificaciones
```javascript
// Métodos específicos (recomendado)
await NotificationService.notifyCrisisNearby(crisis, distance);
await NotificationService.notifyMissionCompleted(mission, rewards);
await NotificationService.notifyFractalActivated(fractal, distance);
await NotificationService.notifyEnergyFull();
await NotificationService.notifyBeingRested(being);
await NotificationService.notifyCommunityEvent(event);

// Método genérico
await NotificationService.sendNotification(type, data, options);
```

### Notificaciones Programadas
```javascript
// Programar
const id = await NotificationService.scheduleNotification(type, data, date);

// Cancelar
await NotificationService.cancelScheduledNotification(id);

// Cancelar todas
await NotificationService.cancelAllScheduledNotifications();

// Recordatorio de lectura
await NotificationService.scheduleReadingReminder('20:00');
await NotificationService.cancelReadingReminder();
```

### Configuración
```javascript
// Obtener
const config = NotificationService.getConfig();

// Actualizar
await NotificationService.updateConfig({ maxPerDay: 10 });

// Toggle tipo
await NotificationService.setNotificationTypeEnabled(type, true/false);

// Horario de silencio
await NotificationService.setQuietHours(22, 8);
```

### Testing
```javascript
// Notificación de prueba
await NotificationService.sendTestNotification(NOTIFICATION_TYPES.CRISIS_NEARBY);

// Limpiar centro de notificaciones
NotificationService.clearAllNotifications();

// Resetear analytics
await NotificationService.resetAnalytics();
```

---

## 🔌 Integración Rápida

### En App.js
```javascript
import NotificationService from './src/services/NotificationService';

useEffect(() => {
  const init = async () => {
    await NotificationService.initialize();
    await NotificationService.scheduleReadingReminder('20:00');

    global.notificationActionHandler = (type, data) => {
      navigation.navigate(data.screen, data);
    };
  };

  init();
}, []);
```

### En MapScreen (Crisis)
```javascript
import { CrisisProximityMonitor } from './services/NotificationIntegrationExample';

const monitor = new CrisisProximityMonitor();

useInterval(() => {
  monitor.checkNearbyCrises(userLocation, crises);
}, 10000);
```

### En MapScreen (Fractales)
```javascript
import { FractalProximityMonitor } from './services/NotificationIntegrationExample';

const monitor = new FractalProximityMonitor();

useInterval(() => {
  monitor.checkNearbyFractals(userLocation, fractals);
}, 5000);
```

### Con Zustand Store
```javascript
import { setupNotificationMiddleware } from './services/NotificationIntegrationExample';
import useGameStore from './stores/gameStore';

setupNotificationMiddleware(useGameStore);
```

---

## 📦 Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Android Setup
- Agregar permisos en AndroidManifest.xml
- Configurar Firebase en build.gradle
- Agregar google-services.json

### 3. iOS Setup
- Agregar permisos en Info.plist
- Habilitar capabilities en Xcode
- Agregar GoogleService-Info.plist
- Ejecutar `pod install`

### 4. Firebase Setup
- Crear proyecto en Firebase Console
- Descargar archivos de configuración
- Habilitar Cloud Messaging

**Guía completa:** Ver `NOTIFICATION-SETUP.md`

---

## ✅ Checklist de Implementación

### Básico
- [x] NotificationService.js creado (1,205 líneas)
- [x] NotificationIntegrationExample.js creado (550+ líneas)
- [x] Documentación completa (GUIDE + SETUP)
- [x] package.json actualizado con dependencias
- [x] 7 tipos de notificaciones implementados
- [x] Permisos Android/iOS configurables
- [x] Canales de notificación (Android)

### Funcionalidades
- [x] Notificaciones locales
- [x] Notificaciones programadas
- [x] Background tasks (3 tipos)
- [x] Horario de silencio
- [x] Límite diario
- [x] Priorización automática
- [x] Analytics completo
- [x] Persistencia de datos
- [x] Testing utilities

### Integraciones
- [x] Firebase Cloud Messaging setup
- [x] Zustand store middleware
- [x] React Navigation handler
- [x] Monitores de proximidad (Crisis, Fractales)
- [x] Monitor de misiones
- [x] Monitor de energía/seres
- [x] Hook de React (useNotifications)

### Documentación
- [x] Guía de usuario completa
- [x] Guía de setup paso a paso
- [x] 10 ejemplos de integración
- [x] Troubleshooting guide
- [x] API reference
- [x] Comentarios inline en código

---

## 🎯 Casos de Uso Implementados

### 1. Usuario caminando cerca de crisis
- ✅ Sistema detecta proximidad (<500m)
- ✅ Notificación de alta prioridad
- ✅ Usuario toca → Abre CrisisDetailScreen
- ✅ Cooldown de 30min evita spam

### 2. Misión completada en background
- ✅ Background task detecta misión completada
- ✅ Notificación con recompensas detalladas
- ✅ Usuario toca → Abre ProfileScreen
- ✅ Recompensas visibles inmediatamente

### 3. Fractal muy cercano
- ✅ Sistema detecta fractal a <50m
- ✅ Notificación con tipo de fractal
- ✅ Usuario toca → Mapa centrado en fractal
- ✅ No se vuelve a notificar ese fractal

### 4. Energía recuperada
- ✅ Background task detecta energía al 100%
- ✅ Notificación informativa
- ✅ Cooldown de 2h evita repeticiones
- ✅ Usuario sabe que puede volver a jugar

### 5. Recordatorio de lectura
- ✅ Programado para 20:00 diariamente
- ✅ Notificación suave (sin sonido/vibración)
- ✅ Respeta horario de silencio
- ✅ Usuario toca → Abre LibraryScreen

### 6. Evento global
- ✅ Push desde servidor Firebase
- ✅ Alta prioridad, ignora horario de silencio
- ✅ Notificación a todos los usuarios
- ✅ Usuario toca → Abre EventsScreen

### 7. Configuración personalizada
- ✅ Usuario puede deshabilitar tipos específicos
- ✅ Cambiar horario de silencio
- ✅ Ajustar límite diario
- ✅ Cambiar hora de recordatorio lectura

---

## 🚀 Próximas Mejoras (Futuro)

### Fase 2
- [ ] Geofencing nativo para crisis permanentes
- [ ] Notificaciones ricas con imágenes
- [ ] Sonidos personalizados por tipo
- [ ] Badges en icono de app (contador)
- [ ] Notificaciones interactivas (acciones inline)

### Fase 3
- [ ] Machine learning para personalizar horarios
- [ ] A/B testing de mensajes
- [ ] Segmentación de usuarios
- [ ] Analytics avanzado (Firebase Analytics)
- [ ] Deep linking desde notificaciones

### Fase 4
- [ ] WorkManager para Android (más confiable que BackgroundTimer)
- [ ] Server-side logic para notificaciones inteligentes
- [ ] Integración con sistema de achievements
- [ ] Notificaciones basadas en comportamiento
- [ ] Gamificación de notificaciones (streaks, etc.)

---

## 📖 Recursos

### Documentación del Proyecto
- **Guía Completa:** `NOTIFICATION-SERVICE-GUIDE.md`
- **Setup:** `NOTIFICATION-SETUP.md`
- **Código:** `src/services/NotificationService.js`
- **Ejemplos:** `src/services/NotificationIntegrationExample.js`

### Recursos Externos
- [react-native-push-notification](https://github.com/zo0r/react-native-push-notification)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [React Native Background Timer](https://github.com/ocetnik/react-native-background-timer)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)
- [iOS User Notifications](https://developer.apple.com/documentation/usernotifications)

---

## 🐛 Soporte y Debugging

### Logs
El servicio usa emojis para identificar logs fácilmente:
- 🔔 Inicialización
- ✅ Éxito
- ❌ Error
- ⚠️ Advertencia
- 📊 Analytics
- 🔄 Background tasks
- ⏭️ Notificación bloqueada (configuración)

### Ver logs en tiempo real
```bash
# Android
npx react-native log-android | grep "🔔\|✅\|❌\|⚠️"

# iOS
npx react-native log-ios | grep "🔔\|✅\|❌\|⚠️"
```

### Debug Mode
```javascript
// Activar modo debug (desactiva límites)
await NotificationService.updateConfig({
  maxPerDay: 999,
  quietHoursStart: -1 // Deshabilita horario de silencio
});
```

---

## 💡 Tips de Uso

1. **Testing:** Usa `sendTestNotification()` antes de implementar lógica real
2. **Permisos:** Pide permisos en el momento adecuado (onboarding, no al inicio)
3. **Respeto al usuario:** Sigue límites y horarios configurados
4. **Analytics:** Revisa métricas regularmente para optimizar
5. **Debugging:** Usa emojis en logs para filtrar fácilmente
6. **Background:** Ten en cuenta limitaciones de batería en Android
7. **iOS:** Solicitar permisos solo cuando sea necesario

---

## 📝 Notas Técnicas

### Persistencia
- AsyncStorage para toda la configuración
- Se guarda automáticamente al cambiar
- Se carga al inicializar

### Performance
- Background tasks optimizados
- Cooldowns evitan cálculos innecesarios
- Analytics ligero (solo contadores)

### Seguridad
- No se envían datos sensibles en notificaciones
- Token de dispositivo almacenado localmente
- Validación de permisos antes de cada acción

### Compatibilidad
- Android: 5.0+ (API 21+)
- Android 13+: Requiere permiso POST_NOTIFICATIONS
- iOS: 10.0+
- React Native: 0.60+

---

## ✨ Créditos

**Sistema desarrollado para:** Awakening Protocol
**Versión:** 1.0.0
**Fecha:** 2025-12-13
**Líneas de código:** ~1,800
**Archivos creados:** 5
**Documentación:** Completa

---

**¡Sistema de notificaciones listo para producción!** 🎉
