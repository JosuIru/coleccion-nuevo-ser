# Quick Start - Sistema Premium IA

## 🚀 3 Pasos para Comenzar

### 1. Cargar módulos en lazy-loader.js

Todos los módulos ya están configurados. Solo asegúrate de que en `index.html` está:

```html
<script src="/js/core/lazy-loader.js"></script>
```

### 2. Inicializar al cargar

```javascript
// En tu código de inicialización
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar sistema premium cuando sea necesario
  if (shouldLoadPremium) {
    await window.lazyLoader.load('premium-system');
  }
});
```

### 3. Usar las features

```javascript
// Mostrar botón de login
window.authModal.showLoginModal();

// Mostrar pricing
window.pricingModal.showPricingModal();

// Usar IA (en libro)
await window.aiBookFeatures.chatAboutBook(chapterContent, title, question);

// Usar IA (en game)
await window.aiGameMaster.generateDynamicMission(being, difficulty);
```

---

## 📚 Archivos Clave

### System Modules (`www/js/`)

| Archivo | Líneas | Propósito | Tier |
|---------|--------|----------|------|
| `core/auth-helper.js` | 400+ | Gestión de auth | Free |
| `features/auth-modal.js` | 500+ | UI login/signup | Free |
| `features/pricing-modal.js` | 400+ | Planes y checkout | Free |
| `features/ai-premium.js` | 400+ | Créditos y management | Premium |
| `features/ai-book-features.js` | 600+ | Chat, quizzes, resúmenes | Premium |
| `features/ai-game-master.js` | 700+ | NPCs, misiones, narrativa | Pro |

### Styling (`www/css/`)

| Archivo | Líneas | Elementos |
|---------|--------|-----------|
| `auth-premium.css` | 700+ | Login, signup, pricing modals |
| `ai-features.css` | 800+ | Widgets, cards, NPC chat |

### Backend (`supabase/`)

| Archivo | Tipo | Propósito |
|---------|------|----------|
| `migrations/001_initial_schema.sql` | SQL | Base de datos |
| `functions/create-checkout-session/index.ts` | TypeScript | Crear checkout Stripe |
| `functions/stripe-webhook/index.ts` | TypeScript | Procesar webhooks |

### Documentation

| Archivo | Contenido |
|---------|-----------|
| `SETUP-PREMIUM-SYSTEM.md` | Setup paso a paso |
| `AI-FEATURES-INTEGRATION.md` | Cómo integrar en UI |
| `FASE-3-COMPLETADA.md` | Resumen de implementación |
| `QUICK-START-PREMIUM.md` | Este archivo |

---

## 🔑 Variables Globales

Después de cargar los módulos, tienes disponibles:

```javascript
window.authHelper          // Autenticación y perfiles
window.authModal           // UI de login/signup
window.pricingModal        // UI de planes
window.aiPremium           // Gestión de créditos
window.aiBookFeatures      // Features para libros
window.aiGameMaster        // Game Master IA
window.lazyLoader          // Sistema de carga dinámica
```

---

## 💬 Métodos Más Usados

### Auth
```javascript
window.authHelper.signUp(email, password, fullName)
window.authHelper.signIn(email, password)
window.authHelper.signOut()
window.authHelper.getProfile()
window.authHelper.onAuthStateChange(callback)
```

### Credits
```javascript
window.aiPremium.getCreditsRemaining()
window.aiPremium.checkCredits(estimatedTokens, featureName)
window.aiPremium.createCreditsWidget()
```

### Book AI
```javascript
window.aiBookFeatures.chatAboutBook(content, title, question)
window.aiBookFeatures.generatePersonalizedQuiz(chapter)
window.aiBookFeatures.generateChapterSummary(chapter)
```

### Game Master
```javascript
window.aiGameMaster.chatWithNPC(id, personality, message)
window.aiGameMaster.generateDynamicMission(being, difficulty)
window.aiGameMaster.generateAdaptiveNarrative(gameState, action, choices)
```

---

## 📊 Tiers de Suscripción

### Free
- 10 créditos/mes
- Solo lectura de libros
- Sin IA features

### Premium ($9.99/mes)
- 500 créditos/mes
- Chat sobre libros ✅
- Quizzes personalizados ✅
- Resúmenes ✅
- Sin Game Master

### Pro ($19.99/mes)
- 2,000 créditos/mes
- Todo de Premium +
- Game Master IA ✅
- NPCs conversacionales ✅
- Misiones dinámicas ✅

---

## 🎨 UI Components

### Botones de Feature
```html
<button class="ai-feature-btn" onclick="handleFeature()">
  💬 Preguntar a IA
</button>
```

### Widget de Créditos
```javascript
const widget = window.aiPremium.createCreditsWidget();
document.body.appendChild(widget);
```

### Modal de Upgrade
```javascript
window.aiGameMaster.showUpgradeIfNeeded('ai_game_master');
```

---

## ❌ Error Handling

### Créditos insuficientes
```javascript
try {
  await window.aiBookFeatures.chatAboutBook(...);
} catch (error) {
  if (error.message.includes('insuficientes')) {
    window.pricingModal.showPricingModal();
  }
}
```

### Feature no disponible
```javascript
if (!window.aiPremium.hasFeature('ai_game_master')) {
  window.aiGameMaster.showUpgradeIfNeeded();
  return;
}
```

---

## 🧪 Quick Tests

```javascript
// Test 1: Check initialized
console.log(window.aiPremium)  // Should be defined

// Test 2: Get credits
console.log(window.aiPremium.getCreditsRemaining())

// Test 3: Check feature
console.log(window.aiPremium.hasFeature('ai_chat'))

// Test 4: Show login
window.authModal.showLoginModal()

// Test 5: Show pricing
window.pricingModal.showPricingModal()
```

---

## 🔗 Flow Típico de Usuario

```
1. Usuario nuevo
   └─> Click "Iniciar Sesión"
       └─> window.authModal.showLoginModal()
           └─> Signup con email/password o Google
               └─> Perfil creado automáticamente en Supabase

2. Usuario quiere IA
   └─> Click "Usar IA" (en libro)
       └─> Check credits: checkCredits()
           └─> Si no tiene: showUpgradeIfNeeded()
               └─> Click "Ver Planes Premium"
                   └─> window.pricingModal.showPricingModal()
                       └─> Stripe Checkout
                           └─> Pago procesado
                               └─> Webhook actualiza perfil
                                   └─> Créditos disponibles
                                       └─> Feature ahora funciona

3. Usando IA
   └─> await aiBookFeatures.chatAboutBook(...)
       └─> Consume créditos
           └─> Widget se actualiza en tiempo real
               └─> Si créditos bajos: showLowCreditsWarning()
```

---

## 📱 Mobile Responsive

Todos los componentes son mobile-first:
- Modales adaptan a pantalla
- Inputs tocan agradablemente
- Botones son grandes
- Mensajes NPC scrollean suavemente

---

## 🔒 Security Notes

- JWT verification en Edge Functions
- RLS policies en todas las tablas
- Créditos verificados server-side
- Stripe webhook signature validation
- No keys expuestas en frontend

---

## 📞 Common Issues

### "aiPremium is not defined"
→ Cargar módulo: `window.lazyLoader.load('ai-features')`

### "Supabase not available"
→ Verificar: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`

### "Invalid Stripe key"
→ Configurar en HTML: `window.STRIPE_PUBLISHABLE_KEY = 'pk_test_...'`

### "Webhook not received"
→ Verificar secret en Supabase settings

---

## 📚 Para Aprender Más

- Full setup: Ver `SETUP-PREMIUM-SYSTEM.md`
- Integration guide: Ver `AI-FEATURES-INTEGRATION.md`
- Implementation details: Ver `FASE-3-COMPLETADA.md`

---

## ✅ Implementation Checklist

For integrating into your app:

- [ ] Modules loaded in lazy-loader.js
- [ ] CSS included in index.html
- [ ] Buttons added to UI
- [ ] Credits widget positioned
- [ ] Error handling implemented
- [ ] Testing in dev environment
- [ ] Mobile tested
- [ ] Ready for production

---

**¡Listo para usar!** 🚀

Ejemplo rápido:
```javascript
// Usuario quiere hacer quiz
await window.aiBookFeatures.generatePersonalizedQuiz(
  currentChapter,
  previousAnswers
);
```
