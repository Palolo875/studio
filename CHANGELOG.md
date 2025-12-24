# CHANGELOG

## [0.3.0] - 2025-12-24

### 🚀 Phase 7 : Gouvernance, Souveraineté & Autorité
- **Authority Contract** : Implémentation du cadre contractuel entre l'utilisateur et le système.
- **Protective Mode** : Gestionnaire de mode de protection anti-burnout automatique.
- **Conflict Resolution** : Nouveau moteur de consensus (SPLIT, DELAYED, EXTERNAL) pour résoudre les désaccords utilisateur/système.
- **Governance Dashboard** : Rapport d'intégrité de l'autonomie et monitoring du risque de burnout.
- **Cost Engine** : Calcul du coût cognitif et budgétaire pour les overrides utilisateur.

### 🧠 Phase 6 : Adaptation & Apprentissage
- **Adaptation Engine** : Moteur d'apprentissage automatique basé sur les signaux comportementaux.
- **Adaptation Memory** : Persistance des signaux d'adaptation et historique des ajustements.
- **Anti-Overfitting Engine** : Protection contre l'adaptation prématurée via validation temporelle.
- **Parameter Rollback** : Système de réversibilité totale des adaptations algorithmiques.
- **Transparency Budget** : Limitation des adaptations automatiques pour garantir la stabilité psychologique.

### 📁 Nouveaux Modules SOTA
- `src/lib/phase7Main.ts` : Point d'entrée de la gouvernance.
- `src/lib/adaptation/` : Suite complète d'apprentissage machine.
- `src/lib/burnout/burnoutDetection.ts` : Nouveau moteur de détection multi-signaux.
- `src/components/dashboard/governance-panel.tsx` : UI de pilotage éthique.

---

## [0.2.0] - 2025-12-23

### 🚀 Major Improvements

#### Architecture & Code Quality
- **LoggerService** : Nouveau service de logging centralisé avec niveaux, contextes et mesure de performance
- **Database Layer** : Implémentation complète Dexie.js avec tables pour tasks, sessions, history, patterns
- **Burnout Engine** : Moteur de détection de burnout entièrement refactorisé avec vraies données DB
- **Real NLP Classifier** : Classificateur NLP avec fallback, utilisant @xenova/transformers

#### Testing Infrastructure
- **Vitest** : Configuration complète avec couverture de code (seuil 70%)
- **Playwright** : Tests E2E multi-navigateurs (Chrome, Firefox, Safari, Mobile)
- **Test Setup** : Mocks pour localStorage, matchMedia, performance.memory

#### CI/CD Pipeline
- **GitHub Actions** : Pipeline complet avec quality checks, tests, E2E, security audit
- **PR Workflow** : Validation automatique des PRs avec commentaires
- **Coverage Reports** : Intégration Codecov

#### Dashboard Refactoring
- Extraction des composants :
  - `MorningRitualDialog` : Dialogue du rituel matinal
  - `PanicTaskModal` : Modal pour tâches urgentes
  - `PlaylistView` : Vue de la playlist avec animations
  - `FloatingActions` : Boutons d'actions flottants

### 🔧 Technical Changes
- **package.json** : Renommé `nextn` → `kairuflow`, version 0.2.0
- **EnergyState** : Ajout de `lastUpdated` pour la cohérence des types
- **Session interface** : Nouveau type complet dans taskEngine/types.ts
- **Dexie** : Ajouté comme dépendance principale

### 📦 New Dependencies
- `dexie` : ^4.0.4
- `@playwright/test` : ^1.40.0
- `@testing-library/jest-dom` : ^6.4.0
- `@testing-library/react` : ^14.2.0
- `@vitejs/plugin-react` : ^4.2.0
- `@vitest/coverage-v8` : ^1.6.0
- `@xenova/transformers` : ^2.17.2
- `vitest` : ^1.6.0
- `husky` : ^9.0.0
- `lint-staged` : ^15.2.0
- `prettier` : ^3.2.0

### 📁 New Files
```
src/lib/
├── logger/
│   ├── LoggerService.ts    # Service de logging centralisé
│   └── index.ts
├── database/
│   └── index.ts            # Implémentation Dexie.js complète
├── burnout/
│   ├── BurnoutEngine.ts    # Moteur avec vraie intégration DB
│   └── index.ts
└── nlp/
    └── RealTaskClassifier.ts  # Classificateur NLP réel

src/components/dashboard/
├── morning-ritual-dialog.tsx
├── panic-task-modal.tsx
├── playlist-view.tsx
└── floating-actions.tsx

e2e/
└── dashboard.spec.ts       # Tests E2E Playwright

.github/workflows/
├── ci.yml                  # Pipeline CI/CD principal
└── pr.yml                  # Workflow spécifique aux PRs

vitest.config.ts
vitest.setup.ts
playwright.config.ts
.prettierrc
```

---

## [1.0.0] - 2025-12-20

### Added
- Module `selectorFallback.ts` pour les fallbacks de sélection
- Implémentation de `applyFallback` avec 3 stratégies

### Changed
- Refactorisation de `selector.ts`
- Suppression de la duplication de `applyFallback`

### Fixed
- Erreur "Cannot find module './selectorFallback'"
- Validation des tâches en mode volatile
