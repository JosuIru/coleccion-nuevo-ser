# 🗺️ ESTRUCTURA DE NAVEGACIÓN - AWAKENING PROTOCOL

## 📊 Diagrama General

```
┌─────────────────────────────────────────────────────────────┐
│                     ROOT NAVIGATOR                          │
│            (RootNavigator.js - Punto de entrada)            │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────┴──────────┐
         │                  │
         ▼                  ▼
   ┌──────────┐        ┌──────────┐
   │ TUTORIAL │        │   MAIN   │
   │(Primera  │        │ (Usuario │
   │  vez)    │        │retornado)│
   └──────────┘        └────┬─────┘
                            │
                    ┌───────┴────────┐
                    │ TAB NAVIGATOR  │
                    │ (5 tabs)       │
                    └───────────────┬┘
                                    │
        ┌──────────┬────────┬──────┬┴──────┬─────────┐
        │          │        │      │       │         │
        ▼          ▼        ▼      ▼       ▼         ▼
      ┌─────┐  ┌──────┐ ┌──────┐┌─────┐ ┌──────┐ ┌───────┐
      │ MAP │  │BEINGS│ │MISN. ││LIBR.│ │PROF. │ │CRISIS │
      │STACK│  │STACK │ │STACK ││STACK│ │STACK │ │DETAIL │
      └─────┘  └──────┘ └──────┘└─────┘ └──────┘ └───────┘
```

---

## 🎯 RUTAS Y PANTALLAS

### 1. TUTORIAL STACK (Primera ejecución)
**Archivo:** `RootNavigator.js → TutorialStack`

```
TutorialFlow (TutorialScreen)
  ├─ Paso 1: Bienvenida
  ├─ Paso 2: Fractales
  ├─ Paso 3: Seres
  ├─ Paso 4: Crisis & Misiones
  └─ Paso 5: ¡Comienza!
       └─> Almacena tutorial_completed en AsyncStorage
           └─> Redirige a Main (App principal)
```

**Flujo:**
```
Usuario abre app por primera vez
         ↓
¿tutorial_completed en AsyncStorage? → NO
         ↓
Mostrar TutorialScreen
         ↓
Usuario completa 5 pasos
         ↓
Click "¡Empezar a Jugar!"
         ↓
Guardar tutorial_completed = true
         ↓
Navegar a Main (TabNavigator)
```

---

### 2. MAIN - TAB NAVIGATOR (Aplicación Principal)
**Archivo:** `RootNavigator.js → TabNavigator`

Estructura con 5 tabs principales:

#### TAB 1: 🗺️ MAPA (MapStack)
```
MapFlow
  ├─ MapScreen (Principal)
  │   ├─ Mapa interactivo con GPS
  │   ├─ Fractales de consciencia
  │   ├─ Marcadores de crisis
  │   ├─ HUD de recursos (⚡ 🌟 ⭐)
  │   ├─ Botón: Ver Seres
  │   ├─ Botón: Centrar en usuario
  │   └─ Crisis visible en mapa → Tap
  │       └─ Navega a CrisisDetail
  │
  └─ CrisisDetailScreen (Modal)
      ├─ Detalle completo de crisis
      ├─ Mapa de ubicación
      ├─ Requisitos de atributos
      ├─ Seleccionar seres para desplegar
      ├─ Cálculo de probabilidad
      └─ Botón: "Desplegar Misión"
```

**Acceso:**
- ✅ Click en ícono "Mapa" (tab)
- ✅ Crisis visible directamente en mapa
- ✅ Desde cualquier otra pantalla → Volver al mapa

---

#### TAB 2: 🧬 SERES (BeingsStack)
```
BeingsList
  ├─ Header: "Mis Seres"
  ├─ Opciones de filtro
  │   ├─ Por estado (Disponibles, Desplegados, Descansando)
  │   ├─ Por atributo
  │   └─ Por tipo/arquetipo
  │
  ├─ Lista de seres
  │   ├─ Card de cada ser
  │   │   ├─ Nombre y nivel
  │   │   ├─ Icono y estado
  │   │   ├─ 15 atributos visuales
  │   │   └─ Botones:
  │   │       ├─ Ver Detalles
  │   │       ├─ Entrenar
  │   │       ├─ Fusionar con otro ser
  │   │       └─ Desplegar a misión
  │   │
  │   └─ Empty State: "Crea tu primer ser"
  │
  └─ Opciones globales
      ├─ Crear nuevo ser
      ├─ Fusionar seres (hibridación)
      └─ Ver estadísticas de seres
```

**Acceso:**
- ✅ Click en ícono "Seres" (tab)
- ✅ Desde MapScreen → Botón "Mis Seres"
- ✅ Desde cualquier pantalla → Swipe derecha

**Acciones:**
- Crear ser ← Requiere consciencia
- Fusionar (2 seres) ← Requiere 500 consciencia
- Entrenar ← Leyendo libros
- Desplegar ← A crisis desde CrisisDetail

---

#### TAB 3: 🎯 MISIONES (MissionsStack)
```
MissionsList (ActiveMissionsScreen)
  ├─ Header con estadísticas
  │   ├─ Misiones activas: N
  │   ├─ Completadas: N
  │   └─ Nivel actual: N
  │
  ├─ Lista de misiones activas
  │   ├─ Card para cada misión
  │   │   ├─ Icono de crisis
  │   │   ├─ Nombre de crisis
  │   │   ├─ Ser asignado
  │   │   ├─ Progreso (barra visual)
  │   │   │   └─ X / Y minutos
  │   │   ├─ Probabilidad de éxito
  │   │   ├─ Recompensas estimadas
  │   │   │   ├─ ⭐ XP
  │   │   │   ├─ 🌟 Consciencia
  │   │   │   └─ 👥 Población ayudada
  │   │   │
  │   │   └─ Si misión completada:
  │   │       └─ Botón "Reclamar Recompensas"
  │   │           └─ Actualiza gameStore
  │   │
  │   │   └─ Si misión en progreso:
  │   │       └─ Botón "Cancelar"
  │   │
  │   └─ Empty State: "Sin misiones activas"
  │       └─ "Selecciona una crisis en el mapa"
  │
  └─ Pull-to-refresh (actualizar manualmente)
```

**Acceso:**
- ✅ Click en ícono "Misiones" (tab)
- ✅ Desde CrisisDetail → "Desplegar Misión"
- ✅ Auto-refresh cada 30 segundos
- ✅ Auto-actualización en tiempo real

**Estados:**
- ⏳ En progreso: muestra barra de progreso
- ✅ Completada: muestra botón "Reclamar"
- ❌ Fallida: muestra resultado y opción de reintentar

---

#### TAB 4: 📚 BIBLIOTECA (LibraryStack)
```
LibraryFlow
  ├─ Header: "Biblioteca Digital"
  ├─ Filtros
  │   ├─ Por categoría
  │   ├─ Por progreso (Completados, En progreso, No iniciados)
  │   └─ Búsqueda
  │
  ├─ Catálogo de libros (7 disponibles)
  │   ├─ Book Card para cada libro
  │   │   ├─ Portada y título
  │   │   ├─ Autor
  │   │   ├─ Descripción
  │   │   ├─ Categoría y etiquetas
  │   │   ├─ Progreso de lectura (barra)
  │   │   ├─ Capítulos: X/Y
  │   │   ├─ Tiempo estimado
  │   │   │
  │   │   └─ Botones:
  │   │       ├─ Leer (abre reader)
  │   │       ├─ Continuar (si en progreso)
  │   │       ├─ Resumen
  │   │       └─ Compartir
  │   │
  │   └─ Empty State: "Conéctate al web para descargar libros"
  │
  └─ Panel de estadísticas
      ├─ Capítulos leídos
      ├─ Tiempo total de lectura
      ├─ Consciencia ganada
      └─ Logros desbloqueados
```

**Libros disponibles:**
1. 📖 El Código del Despertar
2. 📖 Manual Práctico
3. 📖 Toolkit de Transición
4. 📖 Guía de Acciones
5. 📖 Manifiesto
6. 📖 Prácticas Radicales
7. 📖 Tierra que Despierta

**Acceso:**
- ✅ Click en ícono "Libros" (tab)
- ✅ Desde cualquier pantalla → Swipe left
- ✅ Lectura sincroniza con web

**Acciones:**
- Leer capítulo → Abre BookReader
- Marcar como favorito
- Compartir progreso
- Ver estadísticas

---

#### TAB 5: 👤 PERFIL (ProfileStack)
```
ProfileFlow
  ├─ Header: "Mi Perfil"
  │
  ├─ Información de usuario
  │   ├─ Avatar
  │   ├─ Nombre / Username
  │   ├─ Email
  │   └─ Nivel: N (con barra de XP)
  │
  ├─ Estadísticas
  │   ├─ Progreso
  │   │   ├─ Nivel actual: N/50
  │   │   ├─ XP: X / Y
  │   │   └─ Barra de progreso
  │   │
  │   ├─ Misiones
  │   │   ├─ Completadas: N
  │   │   ├─ Tasa de éxito: N%
  │   │   └─ Población ayudada: N millones
  │   │
  │   ├─ Logros
  │   │   ├─ Desbloqueados: N/20
  │   │   ├─ Puntos de logros: N
  │   │   └─ Ver todos (abre AchievementsScreen)
  │   │
  │   └─ Seres
  │       ├─ Poseídos: N/MAX
  │       ├─ Híbridos creados: N
  │       └─ Fusión completada: SI/NO
  │
  ├─ Configuración
  │   ├─ Notificaciones ON/OFF
  │   ├─ Sonido ON/OFF
  │   ├─ Hápticos ON/OFF
  │   ├─ Modo de sincronización
  │   │   └─ Read-Only (por defecto)
  │   │   └─ Bidireccional (explícito)
  │   └─ Idioma
  │
  ├─ Acciones
  │   ├─ Ver Logros Completos
  │   │   └─ AchievementsScreen (20 logros)
  │   ├─ Ver Estadísticas Detalladas
  │   ├─ Exportar Datos
  │   ├─ Contactar Soporte
  │   └─ Logout
  │
  └─ Información legal
      ├─ Privacidad
      ├─ Términos de Servicio
      ├─ Versión de app
      └─ Versión de servidor
```

**Acceso:**
- ✅ Click en ícono "Perfil" (tab)
- ✅ Desde cualquier pantalla → Swipe left twice
- ✅ Acceso a Achievements desde aquí

**Acciones:**
- Editar perfil
- Ver logros (20 desbloqueables)
- Configurar preferencias
- Exportar datos
- Logout

---

## 🔗 FLUJOS DE NAVEGACIÓN

### Flujo 1: RESOLVER CRISIS (Principal)
```
MapScreen
  ├─ Usuario ve crisis en mapa
  ├─ Tap en marker de crisis
  └─> CrisisDetailScreen
       ├─ Ver detalles completos
       ├─ Ver requisitos de atributos
       ├─ Seleccionar seres
       ├─ Ver probabilidad
       └─ Botón "Desplegar Misión"
            └─> Navega a MissionsStack
                 └─> ActiveMissionsScreen
                      ├─ Muestra misión en progreso
                      ├─ Cuenta atrás en tiempo real
                      └─ Al completar → Reclamar recompensas
```

### Flujo 2: GESTIONAR SERES
```
BeingsScreen
  ├─ Ver lista de seres
  ├─ Filtrar por estado/atributo
  │
  ├─ Acción: Crear nuevo ser
  │   ├─ Requiere consciencia
  │   └─ Se agrega a lista
  │
  ├─ Acción: Fusionar seres
  │   ├─ Seleccionar 2 seres
  │   ├─ Combinar mejores atributos
  │   ├─ Crear híbrido nuevo
  │   └─ Se agrega a lista
  │
  └─ Acción: Entrenar/Mejorar
      ├─ Leer libros (desde LibraryStack)
      ├─ Ganan experiencia
      └─ Mejoran atributos
```

### Flujo 3: APRENDER Y LEER
```
LibraryStack
  ├─ Seleccionar libro
  ├─ Leer capítulo
  │   ├─ Acumula progreso de lectura
  │   ├─ Gana consciencia
  │   ├─ Los seres aprenden (mejoran atributos)
  │   └─ Desbloqueados logros de lectura
  │
  └─ Al completar libro
       ├─ Logro desbloqueado
       ├─ Bonificación de XP
       └─ Acceso a nuevo libro
```

### Flujo 4: VER PROGRESO
```
ProfileStack
  ├─ Ver nivel y XP
  ├─ Ver misiones completadas
  ├─ Ver tasa de éxito
  ├─ Ver población ayudada
  ├─ Ver logros desbloqueados
  │   └─ Click en "Ver todos"
  │       └─> AchievementsScreen (20 logros)
  │           ├─ Desbloqueados: con icono completo
  │           ├─ Bloqueados: grises
  │           ├─ Rareza (común→legendario)
  │           └─ Recompensas de XP
  │
  └─ Configurar preferencias
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
src/
├── navigation/
│   └── RootNavigator.js           ← PUNTO DE ENTRADA
│       ├─ Detecta tutorial_completed
│       ├─ Configura stacks
│       └─ Maneja inicialización
│
├── screens/
│   ├── index.js                   ← Exporta todas las pantallas
│   ├── TutorialScreen.js          ← 1er inicio
│   ├── MapScreen.js               ← Tab 1: Mapa
│   ├── BeingsScreen.js            ← Tab 2: Seres
│   ├── ActiveMissionsScreen.js    ← Tab 3: Misiones
│   ├── LibraryScreen.js           ← Tab 4: Biblioteca
│   ├── ProfileScreen.js           ← Tab 5: Perfil
│   └── CrisisDetailScreen.js      ← Modal desde Map
│
├── services/
│   ├── MissionService.js          ← Lógica de misiones
│   ├── CrisisService.js           ← Lógica de crisis
│   ├── AchievementsService.js     ← Lógica de logros
│   └── SyncService.js             ← Sincronización
│
├── stores/
│   └── gameStore.js               ← Estado global (Zustand)
│
└── components/
    └── HelpTooltip.js             ← Ayuda contextual
```

---

## 🎯 CÓMO ACCEDER A CADA FEATURE

### Feature: Tutorial
**Cuándo:** Primera ejecución
**Dónde:** TutorialScreen
**Cómo:** Automático
```javascript
// En RootNavigator.js
const tutorialCompleted = await AsyncStorage.getItem('tutorial_completed');
if (!tutorialCompleted) {
  setInitialRoute('Tutorial'); // Mostrar TutorialScreen
}
```

### Feature: Mapa
**Cuándo:** Siempre (después del tutorial)
**Dónde:** Tab "Mapa"
**Cómo:** Click en ícono inferior
```javascript
<Tab.Screen
  name="Map"
  component={MapStack}
  options={{ tabBarLabel: 'Mapa', tabBarIcon: map }}
/>
```

### Feature: Seres
**Cuándo:** Siempre
**Dónde:** Tab "Seres" o botón en MapScreen
**Cómo:** Click en tab o botón
```javascript
// En MapScreen
<TouchableOpacity onPress={() => navigation.navigate('Beings')}>
  <Text>Ver Seres</Text>
</TouchableOpacity>
```

### Feature: Misiones Activas
**Cuándo:** Después de desplegar una misión
**Dónde:** Tab "Misiones"
**Cómo:** Click en tab o automático al desplegar
```javascript
// En CrisisDetailScreen
<TouchableOpacity onPress={() => {
  deployMission(being, crisis);
  navigation.navigate('Missions');
}}>
  <Text>Desplegar Misión</Text>
</TouchableOpacity>
```

### Feature: Biblioteca
**Cuándo:** Siempre
**Dónde:** Tab "Libros"
**Cómo:** Click en tab
```javascript
<Tab.Screen
  name="Library"
  component={LibraryStack}
  options={{ tabBarLabel: 'Libros' }}
/>
```

### Feature: Perfil & Logros
**Cuándo:** Siempre
**Dónde:** Tab "Perfil" + botón "Ver Logros"
**Cómo:** Click en tab, luego en "Ver todos los logros"
```javascript
// En ProfileScreen
<TouchableOpacity onPress={() => navigation.navigate('Achievements')}>
  <Text>Ver Logros Completos</Text>
</TouchableOpacity>
```

---

## 🚀 CÓMO SE INICIALIZA LA APP

```javascript
// src/index.js o App.js
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return <RootNavigator />;
}
```

**Flujo de inicialización:**

```
1. App.js importa RootNavigator
                 ↓
2. RootNavigator carga:
   - gameStore (Zustand)
   - Datos de AsyncStorage
                 ↓
3. Verifica tutorial_completed:
   - SI: Navega a TabNavigator (Main)
   - NO: Muestra TutorialScreen
                 ↓
4. TabNavigator renderiza 5 tabs:
   - Map, Beings, Missions, Library, Profile
                 ↓
5. Usuario interactúa:
   - Taps, navegación, acciones
   - Los servicios actualizan gameStore
   - gameStore re-renderiza componentes
                 ↓
6. Datos persisten en:
   - AsyncStorage (local)
   - Supabase (web, si sync bidireccional)
```

---

## 📊 RESUMEN DE NAVEGACIÓN

| Feature | Ubicación | Acceso | Estado |
|---------|-----------|--------|--------|
| **Tutorial** | TutorialScreen | Auto 1ª vez | ✅ Completo |
| **Mapa** | MapStack | Tab "Mapa" | ✅ Completo |
| **Seres** | BeingsStack | Tab "Seres" | ✅ Completo |
| **Misiones** | MissionsStack | Tab "Misiones" | ✅ Completo |
| **Biblioteca** | LibraryStack | Tab "Libros" | ✅ Completo |
| **Perfil** | ProfileStack | Tab "Perfil" | ✅ Completo |
| **Logros** | AchievementsScreen | Profile > Ver Logros | ✅ Completo |
| **Crisis Detail** | CrisisDetailScreen | Map > Crisis | ✅ Completo |
| **Ayuda Contextual** | HelpTooltip | Iconos "?" en UI | ✅ Completo |

---

**Versión:** 1.0.0
**Estado:** ✅ PRODUCTION READY
**Última actualización:** 2025-12-13

