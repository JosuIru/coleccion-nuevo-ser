# PLAN DE REFACTORING: frankenstein-ui.js
## Análisis y División en Módulos

**Archivo analizado:** `www/js/features/frankenstein-ui.js`
**Líneas totales:** 8,414
**Clase principal:** `FrankensteinLabUI`
**Fecha:** 2025-12-28

---

## 📊 ANÁLISIS DE ESTRUCTURA ACTUAL

### Métodos identificados (por sección lógica)

#### 1. **Inicialización y Configuración** (líneas 12-493)
- `constructor()` - 185 líneas
- `initDomCache()` - 107 líneas
- `clearDomCache()` - 6 líneas
- `updateActionButtons()` - 18 líneas
- `init()` - 57 líneas
- `initRewardsSystem()` - 20 líneas
- `showDailyLoginReward()` - 60 líneas
- `startLab()` - 15 líneas

#### 2. **Carga de Datos** (líneas 496-670)
- `loadAvailablePieces()` - 92 líneas
- `getBookColor()` - 13 líneas
- `getBookTitle()` - 5 líneas
- `hydrateLegacyPiece()` - 9 líneas
- `ensureMissionRequirements()` - 19 líneas
- `getCurrentMissionRequirements()` - 4 líneas
- `isMobileViewport()` - 4 líneas
- `getExerciseIcon()` - 9 líneas

#### 3. **Pantalla de Inicio** (líneas 671-1036)
- `createStartScreen()` - 300 líneas
- `setRandomDaVinciBackground()` - 32 líneas
- `resolveAssetUrl()` - 17 líneas
- `startBackgroundRotation()` - 11 líneas

#### 4. **Renderizado de UI Principal** (líneas 1037-1709)
- `createLabUI()` - 613 líneas (CRÍTICO - muy grande)
- `checkOnboarding()` - 17 líneas
- `initRewardsHUD()` - 30 líneas

#### 5. **Gestión de Misiones** (líneas 1710-2032)
- `populateMissions()` - 68 líneas
- `setupMissionTabsScroll()` - 32 líneas
- `addScrollIndicator()` - 18 líneas
- `openMissionModal()` - 8 líneas
- `closeMissionModal()` - 8 líneas
- `switchTab()` - 35 líneas
- `showProfileSection()` - 60 líneas
- `openSettings()` - 8 líneas
- `getSavedBeingsCount()` - 8 líneas
- `getCompletedMissionsCount()` - 8 líneas
- `showSection()` - 4 líneas
- `selectMission()` - 33 líneas

#### 6. **Modales de Requisitos y Piezas** (líneas 2033-2264)
- `openRequirementsModal()` - 8 líneas
- `closeRequirementsModal()` - 8 líneas
- `openPiecesModal()` - 36 líneas
- `closePiecesModal()` - 6 líneas
- `updateFABBadges()` - 19 líneas
- `updateMissingRequirementsQuickView()` - 129 líneas

#### 7. **Árbol de Piezas** (líneas 2265-3009)
- `populatePiecesGrid()` - 27 líneas
- `renderPiecesTree()` - 7 líneas
- `organizePiecesByBook()` - 30 líneas
- `getChapterTitle()` - 43 líneas
- `getStatsSummaryHtml()` - 12 líneas
- `createBookCardMobile()` - 43 líneas
- `openBookBottomSheet()` - 55 líneas
- `setupBookBottomSheetControls()` - 33 líneas
- `closeBookBottomSheet()` - 11 líneas
- `renderMobileBookChapters()` - 81 líneas
- `createMobilePieceCard()` - 46 líneas
- `updateMobilePieceActionState()` - 11 líneas
- `isPieceSelected()` - 3 líneas
- `calculateChapterPower()` - 6 líneas
- `createBookTree()` - 154 líneas
- `createChapterTree()` - 86 líneas
- `createPieceCard()` - 46 líneas
- `getTypeLabel()` - 9 líneas

#### 8. **Gestión de Selección de Piezas** (líneas 3010-3119)
- `togglePieceSelection()` - 77 líneas
- `updateBeingFromPieces()` - 28 líneas

#### 9. **Actualización del Ser** (líneas 3120-3389)
- `updateBeingDisplay()` - 78 líneas
- `updateAvatarDisplay()` - 45 líneas
- `updateAttributeBars()` - 88 líneas
- `updateBalance()` - 49 líneas

#### 10. **Validación y Exportación** (líneas 3390-3863)
- `validateBeing()` - 23 líneas
- `showValidationResults()` - 58 líneas
- `exportBeingAsPrompt()` - 18 líneas
- `generateBeingPrompt()` - 103 líneas
- `getCanonicalBeingPieces()` - 58 líneas
- `updateVitruvianHud()` - 69 líneas
- `updateBeingCompositionSummary()` - 27 líneas
- `showPromptModal()` - 21 líneas
- `talkToBeing()` - 35 líneas
- `clearSelection()` - 33 líneas
- `saveLabState()` - 12 líneas
- `serializePieceState()` - 20 líneas
- `restoreLabState()` - 51 líneas
- `rehydratePiecesFromState()` - 16 líneas
- `markSelectedPieceCards()` - 11 líneas
- `applyMissionFromState()` - 20 líneas

#### 11. **Efectos Visuales** (líneas 3991-4046)
- `playLightningEffect()` - 6 líneas
- `showNotification()` - 28 líneas
- `generateFloatingParticles()` - 9 líneas

#### 12. **Event Listeners** (líneas 4047-4429)
- `attachEventListeners()` - 383 líneas (CRÍTICO - muy grande)

#### 13. **Sistema de Retos** (líneas 4430-4512)
- `startChallenges()` - 18 líneas
- `createMicroSociety()` - 59 líneas
- `ensureMicroSocietiesManager()` - 11 líneas
- `createBeingVariation()` - 19 líneas
- `simulateMicroSocietyLocally()` - 28 líneas

#### 14. **Guardado de Seres** (líneas 4580-5004)
- `saveBeingWithPrompt()` - 20 líneas
- `saveBeing()` - 58 líneas
- `loadBeings()` - 8 líneas
- `loadBeing()` - 147 líneas
- `deleteBeing()` - 22 líneas
- `saveBeingToSupabase()` - 22 líneas
- `showSavedBeingsModal()` - 121 líneas

#### 15. **Bottom Sheet** (líneas 5017-5196)
- `initBottomSheetGestures()` - 88 líneas
- `getBottomSheetTransform()` - 8 líneas
- `expandBottomSheet()` - 11 líneas
- `collapseBottomSheet()` - 11 líneas
- `setBottomSheetState()` - 8 líneas
- `toggleBottomSheet()` - 14 líneas
- `toggleRequirements()` - 18 líneas

#### 16. **Panel de Requisitos** (líneas 5197-5546)
- `updateRequirementsPanel()` - 83 líneas
- `updateRequirementsChecklist()` - 28 líneas
- `clearRequirementsPanel()` - 28 líneas
- `updateRequirementsSummaryMini()` - 89 líneas
- `updateRequirementsBriefing()` - 43 líneas
- `updatePiecesSidebarMeta()` - 10 líneas
- `updatePiecesTipsPanel()` - 23 líneas
- `getRequirementIcon()` - 16 líneas

#### 17. **Validación de Requisitos** (líneas 5547-5646)
- `getRequirementTarget()` - 12 líneas
- `getRequirementCurrentValue()` - 24 líneas
- `getRequirementKey()` - 6 líneas
- `handleRequirementMilestones()` - 29 líneas
- `triggerRequirementCelebration()` - 15 líneas
- `spawnProgressReward()` - 15 líneas

#### 18. **Mini Challenges** (líneas 5647-5861)
- `generateMiniChallenge()` - 48 líneas
- `renderMiniChallenge()` - 48 líneas
- `getMiniChallengeHistoryMarkup()` - 16 líneas
- `updateMiniChallengeProgress()` - 13 líneas
- `completeMiniChallenge()` - 23 líneas
- `rewardSpecialPiece()` - 43 líneas
- `getSupportAttributeForReward()` - 20 líneas

#### 19. **Demo y Microsociedades** (líneas 5862-6179)
- `applyDemoScenario()` - 23 líneas
- `renderDemoScenarioCard()` - 49 líneas
- `evaluateScenarioObjective()` - 43 líneas
- `updateDemoScenarioProgress()` - 4 líneas
- `renderMicrosocietyCard()` - 97 líneas
- `wireMicroEventButtons()` - 11 líneas
- `triggerMicroEvent()` - 23 líneas
- `previewDemoMicrosociety()` - 15 líneas
- `estimateMicrosocietyMetrics()` - 18 líneas
- `updateMissionProgressUI()` - 48 líneas

#### 20. **Validación de Estado** (líneas 6180-6253)
- `isRequirementFulfilled()` - 20 líneas
- `hasRequirementConflict()` - 14 líneas
- `countFulfilledRequirements()` - 4 líneas
- `calculateCurrentPower()` - 17 líneas
- `getPiecePower()` - 9 líneas

#### 21. **Búsqueda y Filtrado** (líneas 6254-6425)
- `searchPieces()` - 28 líneas
- `renderFilteredPieces()` - 43 líneas
- `filterPiecesByAttribute()` - 75 líneas
- `updatePiecesCountBadge()` - 14 líneas

#### 22. **Animaciones Confetti** (líneas 6426-6483)
- `showConfetti()` - 58 líneas

#### 23. **Efectos Visuales Avanzados** (líneas 6489-6905)
- `animatePieceToTarget()` - 48 líneas
- `createFlightTrail()` - 24 líneas
- `createParticleBurst()` - 57 líneas
- `createSelectionRipple()` - 14 líneas
- `triggerHaptic()` - 13 líneas
- `playSelectionSound()` - 38 líneas
- `togglePieceSelectionEnhanced()` - 148 líneas
- `highlightCompatibleSlots()` - 16 líneas
- `clearSlotHighlights()` - 6 líneas
- `isSlotCompatible()` - 13 líneas
- `initDragAndDropEnhanced()` - 76 líneas
- `getPieceData()` - 6 líneas

#### 24. **Filtros Inteligentes** (líneas 6997-7269)
- `filterCompatiblePieces()` - 24 líneas
- `getCompatiblePieces()` - 62 líneas
- `getMissingRequirements()` - 4 líneas
- `showSmartSuggestions()` - 54 líneas
- `getTopSuggestions()` - 42 líneas
- `getSuggestionReason()` - 11 líneas
- `getSuggestionPriority()` - 34 líneas
- `getTypeIcon()` - 9 líneas
- `showEmptyCompatibleState()` - 18 líneas
- `showNoMissionAlert()` - 11 líneas

#### 25. **Sticky Headers y Tooltips** (líneas 7270-7453)
- `handlePiecesModalScroll()` - 28 líneas
- `updateStickyRequirementsHeader()` - 67 líneas
- `getRequirementFulfillmentPercentage()` - 8 líneas
- `showVitruvianPopup()` - 64 líneas
- `hideVitruvianPopup()` - 10 líneas

#### 26. **Experiment Log** (líneas 7455-7538)
- `loadExperimentLog()` - 9 líneas
- `recordExperimentEntry()` - 30 líneas
- `renderExperimentLog()` - 45 líneas

#### 27. **Tooltips Contextuales** (líneas 7539-7673)
- `initContextualTooltips()` - 62 líneas
- `showTooltip()` - 60 líneas
- `hideTooltip()` - 8 líneas

#### 28. **Tutorial y Ayuda** (líneas 7674-7947)
- `showMiniTutorial()` - 106 líneas
- `showProgressHint()` - 16 líneas
- `createGameModeSelector()` - 149 líneas
- `getModeDescription()` - 10 líneas

#### 29. **Menú Lateral** (líneas 7960-8305)
- `toggleSideMenu()` - 10 líneas
- `openSideMenu()` - 12 líneas
- `closeSideMenu()` - 8 líneas
- `handleMenuNavigation()` - 59 líneas
- `updateMenuBadges()` - 32 líneas
- `openMicrosocietiesSimulator()` - 66 líneas
- `renderBasicMicrosocietyModal()` - 71 líneas
- `showHelpModal()` - 57 líneas

#### 30. **Cleanup y Gestión de Memoria** (líneas 8306-8409)
- `_setTimeout()` - 13 líneas
- `_setInterval()` - 5 líneas
- `_clearInterval()` - 6 líneas
- `_addEventListener()` - 4 líneas
- `destroy()` - 37 líneas

---

## 🎯 PLAN DE REFACTORING EN 3 FASES

### **FASE 1: Quick Wins - Datos y Utilidades (~2-3 horas)**

#### Prioridad: ALTA | Dificultad: BAJA
Extraer datos estáticos y utilidades puras sin dependencias.

#### Módulos a crear:

##### 1.1. `frankenstein-data-constants.js` (~150 líneas)
**Líneas origen:** 36-69, 595-669
**Contenido:**
- `vintageBackgrounds` (array de fondos)
- `microSocietyEvents` (eventos de microsociedad)
- `getBookColor()` - mapeo de colores por libro
- `getExerciseIcon()` - iconos por categoría
- `getTypeLabel()` - labels de tipo de pieza
- `getTypeIcon()` - iconos de tipo
**Dependencias:** Ninguna
**Estimación:** ~180 líneas
**Dificultad:** Baja

##### 1.2. `frankenstein-background-rotator.js` (~80 líneas)
**Líneas origen:** 973-1036
**Contenido:**
- Clase `BackgroundRotator`
- `setRandomDaVinciBackground()`
- `resolveAssetUrl()`
- `startBackgroundRotation()`
**Dependencias:** `frankenstein-data-constants.js`
**Estimación:** ~90 líneas
**Dificultad:** Baja

##### 1.3. `frankenstein-animations-effects.js` (~300 líneas)
**Líneas origen:** 3991-4046, 6426-6705
**Contenido:**
- `playLightningEffect()`
- `showConfetti()`
- `createParticleBurst()`
- `createFlightTrail()`
- `createSelectionRipple()`
- `triggerHaptic()`
- `playSelectionSound()`
**Dependencias:** Ninguna
**Estimación:** ~320 líneas
**Dificultad:** Baja

##### 1.4. `frankenstein-piece-catalog.js` (~120 líneas)
**Líneas origen:** 496-670
**Contenido:**
- `loadAvailablePieces()`
- `getBookTitle()`
- `hydrateLegacyPiece()`
- `getChapterTitle()`
**Dependencias:** `organism`, `missionsSystem`
**Estimación:** ~130 líneas
**Dificultad:** Media

##### 1.5. `frankenstein-being-templates.js` (~100 líneas)
**Líneas origen:** Datos de demo implícitos
**Contenido:**
- Templates de seres de ejemplo
- Configuración de escenarios demo
**Dependencias:** Ninguna
**Estimación:** ~100 líneas
**Dificultad:** Baja

---

### **FASE 2: UI Components - Módulos Independientes (~4-5 horas)**

#### Prioridad: ALTA | Dificultad: MEDIA
Extraer componentes de UI que tienen dependencias lógicas pero pueden aislarse.

##### 2.1. `frankenstein-tooltips.js` (~150 líneas)
**Líneas origen:** 7539-7673
**Contenido:**
- `initContextualTooltips()`
- `showTooltip()`
- `hideTooltip()`
**Dependencias:** DOM
**Estimación:** ~160 líneas
**Dificultad:** Baja

##### 2.2. `frankenstein-modals-manager.js` (~250 líneas)
**Líneas origen:** 2033-2106, 3761-3824, 4882-5004
**Contenido:**
- `openRequirementsModal()`
- `closeRequirementsModal()`
- `openPiecesModal()`
- `closePiecesModal()`
- `openMissionModal()`
- `closeMissionModal()`
- `showPromptModal()`
- `showSavedBeingsModal()`
**Dependencias:** DOM
**Estimación:** ~270 líneas
**Dificultad:** Media

##### 2.3. `frankenstein-vitruvian-display.js` (~250 líneas)
**Líneas origen:** 3660-3757, 7375-7453
**Contenido:**
- `updateVitruvianHud()`
- `updateBeingCompositionSummary()`
- `showVitruvianPopup()`
- `hideVitruvianPopup()`
**Dependencias:** `missionsSystem`, DOM
**Estimación:** ~260 líneas
**Dificultad:** Media

##### 2.4. `frankenstein-avatar-generator.js` (~80 líneas)
**Líneas origen:** 3199-3244
**Contenido:**
- `updateAvatarDisplay()`
- Integración con `FrankensteinAvatarSystem`
**Dependencias:** `avatarSystem`, DOM
**Estimación:** ~90 líneas
**Dificultad:** Baja

##### 2.5. `frankenstein-piece-selector.js` (~600 líneas)
**Líneas origen:** 2265-3009
**Contenido:**
- `populatePiecesGrid()`
- `organizePiecesByBook()`
- `createBookTree()`
- `createChapterTree()`
- `createPieceCard()`
- `createBookCardMobile()`
- `createMobilePieceCard()`
**Dependencias:** `missionsSystem`, DOM
**Estimación:** ~650 líneas
**Dificultad:** Alta

##### 2.6. `frankenstein-bottom-sheet.js` (~250 líneas)
**Líneas origen:** 5017-5196, 2453-2553
**Contenido:**
- `initBottomSheetGestures()`
- `openBookBottomSheet()`
- `closeBookBottomSheet()`
- `renderMobileBookChapters()`
- Gestión completa del bottom sheet móvil
**Dependencias:** DOM, gestures
**Estimación:** ~280 líneas
**Dificultad:** Media

##### 2.7. `frankenstein-drag-drop-handler.js` (~180 líneas)
**Líneas origen:** 6906-6994
**Contenido:**
- `initDragAndDropEnhanced()`
- `highlightCompatibleSlots()`
- `clearSlotHighlights()`
- `isSlotCompatible()`
- `getPieceData()`
**Dependencias:** DOM
**Estimación:** ~190 líneas
**Dificultad:** Media

##### 2.8. `frankenstein-tutorial.js` (~200 líneas)
**Líneas origen:** 7674-7947
**Contenido:**
- `showMiniTutorial()`
- `createGameModeSelector()`
- `getModeDescription()`
- `showProgressHint()`
**Dependencias:** localStorage, DOM
**Estimación:** ~220 líneas
**Dificultad:** Media

---

### **FASE 3: Core Logic - Lógica de Negocio (~6-8 horas)**

#### Prioridad: CRÍTICA | Dificultad: ALTA
Extraer la lógica central del laboratorio manteniendo cohesión.

##### 3.1. `frankenstein-mission-validator.js` (~400 líneas)
**Líneas origen:** 5197-5646
**Contenido:**
- `updateRequirementsPanel()`
- `updateRequirementsChecklist()`
- `updateRequirementsSummaryMini()`
- `updateRequirementsBriefing()`
- `getRequirementTarget()`
- `getRequirementCurrentValue()`
- `isRequirementFulfilled()`
- `hasRequirementConflict()`
- `countFulfilledRequirements()`
- `handleRequirementMilestones()`
- `triggerRequirementCelebration()`
**Dependencias:** `missionsSystem`
**Estimación:** ~430 líneas
**Dificultad:** Alta

##### 3.2. `frankenstein-being-builder.js` (~450 líneas)
**Líneas origen:** 3010-3389, 6705-6857
**Contenido:**
- `togglePieceSelection()`
- `togglePieceSelectionEnhanced()`
- `updateBeingFromPieces()`
- `updateBeingDisplay()`
- `updateAttributeBars()`
- `updateBalance()`
- `calculateCurrentPower()`
**Dependencias:** `missionsSystem`, `quiz`, `vitruvian`
**Estimación:** ~480 líneas
**Dificultad:** Alta

##### 3.3. `frankenstein-being-storage.js` (~400 líneas)
**Líneas origen:** 4580-5004, 3863-3942
**Contenido:**
- `saveBeingWithPrompt()`
- `saveBeing()`
- `loadBeings()`
- `loadBeing()`
- `deleteBeing()`
- `saveBeingToSupabase()`
- `saveLabState()`
- `restoreLabState()`
- `serializePieceState()`
- `rehydratePiecesFromState()`
**Dependencias:** localStorage, Supabase (opcional)
**Estimación:** ~420 líneas
**Dificultad:** Alta

##### 3.4. `frankenstein-micro-society.js` (~350 líneas)
**Líneas origen:** 4430-4512, 5862-6179, 8103-8244
**Contenido:**
- `createMicroSociety()`
- `createBeingVariation()`
- `simulateMicroSocietyLocally()`
- `renderMicrosocietyCard()`
- `wireMicroEventButtons()`
- `triggerMicroEvent()`
- `estimateMicrosocietyMetrics()`
- `openMicrosocietiesSimulator()`
- `renderBasicMicrosocietyModal()`
**Dependencias:** `missionsSystem`, modals
**Estimación:** ~370 líneas
**Dificultad:** Alta

##### 3.5. `frankenstein-mini-challenges.js` (~250 líneas)
**Líneas origen:** 5647-5861
**Contenido:**
- `generateMiniChallenge()`
- `renderMiniChallenge()`
- `updateMiniChallengeProgress()`
- `completeMiniChallenge()`
- `rewardSpecialPiece()`
- `getSupportAttributeForReward()`
**Dependencias:** `missionsSystem`
**Estimación:** ~260 líneas
**Dificultad:** Media

##### 3.6. `frankenstein-rewards-system.js` (~150 líneas)
**Líneas origen:** 389-473, 1649-1709
**Contenido:**
- `initRewardsSystem()`
- `showDailyLoginReward()`
- `initRewardsHUD()`
- Integración con `FrankensteinRewards`
**Dependencias:** `rewards` (externo)
**Estimación:** ~160 líneas
**Dificultad:** Baja

##### 3.7. `frankenstein-search-filter.js` (~350 líneas)
**Líneas origen:** 6254-6425, 6997-7269
**Contenido:**
- `searchPieces()`
- `renderFilteredPieces()`
- `filterPiecesByAttribute()`
- `filterCompatiblePieces()`
- `getCompatiblePieces()`
- `showSmartSuggestions()`
- `getTopSuggestions()`
**Dependencias:** `missionsSystem`
**Estimación:** ~370 líneas
**Dificultad:** Alta

##### 3.8. `frankenstein-validation-export.js` (~250 líneas)
**Líneas origen:** 3390-3606
**Contenido:**
- `validateBeing()`
- `showValidationResults()`
- `exportBeingAsPrompt()`
- `generateBeingPrompt()`
- `getCanonicalBeingPieces()`
- `talkToBeing()`
**Dependencias:** `missionsSystem`, `aiChat`
**Estimación:** ~270 líneas
**Dificultad:** Alta

##### 3.9. `frankenstein-demo-scenarios.js` (~200 líneas)
**Líneas origen:** 5862-5982
**Contenido:**
- `applyDemoScenario()`
- `renderDemoScenarioCard()`
- `evaluateScenarioObjective()`
- `updateDemoScenarioProgress()`
**Dependencias:** `FrankensteinDemoData`
**Estimación:** ~210 líneas
**Dificultad:** Media

##### 3.10. `frankenstein-experiment-log.js` (~100 líneas)
**Líneas origen:** 7455-7538
**Contenido:**
- `loadExperimentLog()`
- `recordExperimentEntry()`
- `renderExperimentLog()`
**Dependencias:** localStorage
**Estimación:** ~110 líneas
**Dificultad:** Baja

##### 3.11. `frankenstein-ui-renderer.js` (~850 líneas)
**Líneas origen:** 671-1036, 1037-1654
**Contenido:**
- `createStartScreen()`
- `createLabUI()` (template HTML)
- Renderizado de estructura principal
**Dependencias:** DOM
**Estimación:** ~900 líneas
**Dificultad:** Alta

##### 3.12. `frankenstein-event-coordinator.js` (~500 líneas)
**Líneas origen:** 4047-4429, 7960-8305
**Contenido:**
- `attachEventListeners()` (orquestación)
- `handleMenuNavigation()`
- `toggleSideMenu()`, `openSideMenu()`, `closeSideMenu()`
- `updateMenuBadges()`
- Coordinación de todos los event handlers
**Dependencias:** Todos los módulos
**Estimación:** ~550 líneas
**Dificultad:** Alta

##### 3.13. `frankenstein-lab.js` (Orquestador Principal) (~600 líneas)
**Líneas origen:** 12-493, 8306-8409
**Contenido:**
- Clase `FrankensteinLabUI` (constructor y métodos de ciclo de vida)
- `init()`, `destroy()`
- `initDomCache()`, `clearDomCache()`
- `_setTimeout()`, `_setInterval()`, `_addEventListener()` (wrappers de cleanup)
- Importación y orquestación de todos los módulos
**Dependencias:** TODOS los módulos anteriores
**Estimación:** ~650 líneas
**Dificultad:** Alta

---

## 📋 RESUMEN DE MÓDULOS (20 módulos totales)

| # | Módulo | Líneas | Dificultad | Fase |
|---|--------|--------|------------|------|
| 1 | `frankenstein-data-constants.js` | ~180 | Baja | 1 |
| 2 | `frankenstein-background-rotator.js` | ~90 | Baja | 1 |
| 3 | `frankenstein-animations-effects.js` | ~320 | Baja | 1 |
| 4 | `frankenstein-piece-catalog.js` | ~130 | Media | 1 |
| 5 | `frankenstein-being-templates.js` | ~100 | Baja | 1 |
| 6 | `frankenstein-tooltips.js` | ~160 | Baja | 2 |
| 7 | `frankenstein-modals-manager.js` | ~270 | Media | 2 |
| 8 | `frankenstein-vitruvian-display.js` | ~260 | Media | 2 |
| 9 | `frankenstein-avatar-generator.js` | ~90 | Baja | 2 |
| 10 | `frankenstein-piece-selector.js` | ~650 | Alta | 2 |
| 11 | `frankenstein-bottom-sheet.js` | ~280 | Media | 2 |
| 12 | `frankenstein-drag-drop-handler.js` | ~190 | Media | 2 |
| 13 | `frankenstein-tutorial.js` | ~220 | Media | 2 |
| 14 | `frankenstein-mission-validator.js` | ~430 | Alta | 3 |
| 15 | `frankenstein-being-builder.js` | ~480 | Alta | 3 |
| 16 | `frankenstein-being-storage.js` | ~420 | Alta | 3 |
| 17 | `frankenstein-micro-society.js` | ~370 | Alta | 3 |
| 18 | `frankenstein-mini-challenges.js` | ~260 | Media | 3 |
| 19 | `frankenstein-rewards-system.js` | ~160 | Baja | 3 |
| 20 | `frankenstein-search-filter.js` | ~370 | Alta | 3 |
| 21 | `frankenstein-validation-export.js` | ~270 | Alta | 3 |
| 22 | `frankenstein-demo-scenarios.js` | ~210 | Media | 3 |
| 23 | `frankenstein-experiment-log.js` | ~110 | Baja | 3 |
| 24 | `frankenstein-ui-renderer.js` | ~900 | Alta | 3 |
| 25 | `frankenstein-event-coordinator.js` | ~550 | Alta | 3 |
| 26 | `frankenstein-lab.js` (Orquestador) | ~650 | Alta | 3 |

**Total estimado:** ~7,720 líneas (vs. 8,414 originales)
**Reducción:** ~8% (por eliminación de duplicados y optimización)

---

## 🔄 ORDEN DE EJECUCIÓN RECOMENDADO

### Fase 1 (Primero) - Datos y Utilidades
1. `frankenstein-data-constants.js`
2. `frankenstein-being-templates.js`
3. `frankenstein-background-rotator.js`
4. `frankenstein-animations-effects.js`
5. `frankenstein-piece-catalog.js`

**Beneficio:** Sin dependencias complejas, fácil de testear.

### Fase 2 (Segundo) - UI Components
1. `frankenstein-tooltips.js`
2. `frankenstein-avatar-generator.js`
3. `frankenstein-drag-drop-handler.js`
4. `frankenstein-modals-manager.js`
5. `frankenstein-vitruvian-display.js`
6. `frankenstein-bottom-sheet.js`
7. `frankenstein-tutorial.js`
8. `frankenstein-piece-selector.js` (último por ser más complejo)

**Beneficio:** Componentes visuales independientes, pueden desarrollarse en paralelo.

### Fase 3 (Tercero) - Core Logic
1. `frankenstein-experiment-log.js`
2. `frankenstein-rewards-system.js`
3. `frankenstein-demo-scenarios.js`
4. `frankenstein-mini-challenges.js`
5. `frankenstein-mission-validator.js`
6. `frankenstein-search-filter.js`
7. `frankenstein-validation-export.js`
8. `frankenstein-being-builder.js`
9. `frankenstein-being-storage.js`
10. `frankenstein-micro-society.js`
11. `frankenstein-ui-renderer.js`
12. `frankenstein-event-coordinator.js`
13. `frankenstein-lab.js` (último - orquestador que integra todo)

**Beneficio:** Lógica crítica al final, cuando todas las piezas están probadas.

---

## 📊 DIAGRAMA DE DEPENDENCIAS

```
frankenstein-lab.js (Orquestador Principal)
├── frankenstein-data-constants.js
├── frankenstein-background-rotator.js
│   └── frankenstein-data-constants.js
├── frankenstein-animations-effects.js
├── frankenstein-piece-catalog.js
│   └── organism
│   └── missionsSystem
├── frankenstein-being-templates.js
├── frankenstein-tooltips.js
├── frankenstein-modals-manager.js
├── frankenstein-vitruvian-display.js
│   └── missionsSystem
│   └── vitruvianBeing
├── frankenstein-avatar-generator.js
│   └── avatarSystem
├── frankenstein-piece-selector.js
│   └── missionsSystem
│   └── frankenstein-data-constants.js
├── frankenstein-bottom-sheet.js
│   └── mobileGestures (opcional)
├── frankenstein-drag-drop-handler.js
├── frankenstein-tutorial.js
├── frankenstein-mission-validator.js
│   └── missionsSystem
│   └── frankenstein-animations-effects.js
├── frankenstein-being-builder.js
│   └── missionsSystem
│   └── quiz
│   └── vitruvianBeing
│   └── frankenstein-animations-effects.js
├── frankenstein-being-storage.js
│   └── localStorage
│   └── supabase (opcional)
├── frankenstein-micro-society.js
│   └── missionsSystem
│   └── frankenstein-modals-manager.js
├── frankenstein-mini-challenges.js
│   └── missionsSystem
│   └── frankenstein-animations-effects.js
├── frankenstein-rewards-system.js
│   └── FrankensteinRewards (externo)
├── frankenstein-search-filter.js
│   └── missionsSystem
│   └── frankenstein-piece-selector.js
├── frankenstein-validation-export.js
│   └── missionsSystem
│   └── aiChat (externo)
├── frankenstein-demo-scenarios.js
│   └── FrankensteinDemoData (externo)
├── frankenstein-experiment-log.js
│   └── localStorage
├── frankenstein-ui-renderer.js
│   └── frankenstein-data-constants.js
└── frankenstein-event-coordinator.js
    └── TODOS los módulos anteriores
```

---

## ⚠️ RIESGOS Y CONSIDERACIONES

### Riesgos Principales:

1. **Pérdida de funcionalidad durante la migración**
   - **Mitigación:** Testing incremental después de cada módulo extraído.

2. **Dependencias circulares**
   - **Mitigación:** Seguir estrictamente el orden de dependencias del diagrama.

3. **Cambios en la API durante el refactor**
   - **Mitigación:** Mantener backward compatibility con wrappers temporales.

4. **Event listeners duplicados o perdidos**
   - **Mitigación:** Sistema de cleanup centralizado en orquestador.

5. **Estado compartido roto**
   - **Mitigación:** Pasar siempre referencias explícitas, evitar globals ocultos.

### Consideraciones Especiales:

1. **Sistema de cleanup de memoria (líneas 8306-8409)**
   - CRÍTICO: Preservar `_setTimeout`, `_setInterval`, `_addEventListener` en orquestador.
   - Todos los módulos deben usar estos wrappers.

2. **DOM Cache (líneas 79-184)**
   - Centralizar en orquestador.
   - Pasar referencias a módulos que las necesiten.

3. **Mobile vs Desktop**
   - Mantener `isMobileViewport()` como utility compartida.
   - Muchos módulos tienen lógica condicional mobile.

4. **Integración con sistemas externos**
   - `FrankensteinQuiz`
   - `FrankensteinRewards`
   - `FrankensteinAvatarSystem`
   - `VitruvianBeing`
   - Validar que las interfaces no cambien.

---

## ✅ TESTING RECOMENDADO ENTRE FASES

### Después de Fase 1:
- [ ] Fondos rotan correctamente
- [ ] Animaciones visuales funcionan (confetti, partículas)
- [ ] Catálogo de piezas se carga sin errores
- [ ] Colores y etiquetas se muestran correctamente

### Después de Fase 2:
- [ ] Modales abren y cierran sin errores
- [ ] Tooltips se muestran en hover
- [ ] Drag & drop funciona
- [ ] Bottom sheet responde a gestos (móvil)
- [ ] Selector de piezas (árbol) se renderiza completo
- [ ] Avatar y Vitruvian se actualizan al añadir piezas

### Después de Fase 3:
- [ ] Misiones se seleccionan y validan
- [ ] Piezas se añaden al ser
- [ ] Quiz funciona en modo aprendizaje
- [ ] Validación de requisitos precisa
- [ ] Guardado/carga de seres funciona
- [ ] Exportación de prompt correcto
- [ ] Microsociedades se crean y simulan
- [ ] Mini-challenges aparecen y completan
- [ ] Filtros inteligentes muestran piezas compatibles
- [ ] Tutorial se muestra en primera vez
- [ ] Cleanup de memoria sin leaks (verificar con Chrome DevTools)

---

## ⏱️ ESTIMACIÓN DE TIEMPO POR FASE

### Fase 1: Quick Wins
- **Desarrollo:** 4-6 horas
- **Testing:** 1-2 horas
- **Total:** **5-8 horas**

### Fase 2: UI Components
- **Desarrollo:** 8-12 horas
- **Testing:** 2-3 horas
- **Total:** **10-15 horas**

### Fase 3: Core Logic
- **Desarrollo:** 16-24 horas
- **Testing:** 4-6 horas
- **Integración final:** 2-4 horas
- **Total:** **22-34 horas**

### **TOTAL ESTIMADO: 37-57 horas (4.6-7.1 días laborales)**

---

## 🚀 ESTRATEGIA DE MIGRACIÓN INCREMENTAL

### Enfoque: Mantener funcionalidad durante toda la migración

1. **Crear carpeta `www/js/features/frankenstein/`** para los nuevos módulos.

2. **Migrar módulo por módulo:**
   - Extraer código a nuevo archivo
   - Exportar clase/funciones
   - Importar en `frankenstein-ui.js`
   - Delegar llamadas al módulo
   - Testear que todo sigue funcionando
   - Solo cuando funciona, eliminar código original

3. **Mantener `frankenstein-ui.js` como facade** durante la migración:
   ```javascript
   // Ejemplo transitorio
   import { BackgroundRotator } from './frankenstein/background-rotator.js';

   class FrankensteinLabUI {
     constructor() {
       this.backgroundRotator = new BackgroundRotator(this);
     }

     setRandomDaVinciBackground(img) {
       // Delegar al módulo
       return this.backgroundRotator.setRandomDaVinciBackground(img);
     }
   }
   ```

4. **Al final de Fase 3:**
   - `frankenstein-ui.js` se convierte en `frankenstein-lab.js` (solo orquestador)
   - Eliminar todo el código delegado
   - Mantener solo lógica de inicialización e integración

---

## 📝 NOTAS FINALES

- **No ejecutar refactoring completo de golpe.** Hacerlo incrementalmente.
- **Priorizar estabilidad sobre perfección.** Si un módulo queda en ~1200 líneas pero es cohesivo, aceptable.
- **Documentar cambios** en cada módulo (JSDoc).
- **Versionar cada fase** con tags Git (`v2.10.0-phase1`, `v2.10.0-phase2`, etc.).
- **Preparar rollback plan:** Mantener branch `frankenstein-ui-legacy` antes de empezar.

---

## 🎯 CRITERIOS DE ÉXITO

✅ **Objetivo principal:** Cada módulo <1000 líneas (tolerancia hasta 1200 si es cohesivo).
✅ **Funcionalidad:** Cero regresiones detectadas en testing.
✅ **Mantenibilidad:** Cualquier desarrollador puede entender un módulo en <15 minutos.
✅ **Performance:** Sin degradación medible (tiempo de carga, animaciones).
✅ **Memoria:** Cleanup correcto, sin memory leaks (verificar con DevTools).

---

**Documento generado:** 2025-12-28
**Versión:** 1.0
**Autor:** Claude Sonnet 4.5
**Archivo analizado:** `www/js/features/frankenstein-ui.js` (8,414 líneas)
