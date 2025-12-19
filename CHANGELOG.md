# Changelog

## [1.0.0] - 2025-12-20
### Added
- Nouveau module `selectorFallback.ts` pour gérer les fallbacks de sélection de tâches
- Implémentation de la fonction `applyFallback` avec 3 stratégies :
  - Mode énergie basse : une seule tâche facile
  - Mode survie : tâches urgentes
  - Fallback vide avec explication

### Changed
- Refactorisation de `selector.ts` :
  - Suppression de la duplication de `applyFallback`
  - Nettoyage des commentaires et de la structure
- Correction d'une faute de frappe dans les tests d'intégration (`phase1-integration.test.ts`)

### Fixed
- Résolution de l'erreur "Cannot find module './selectorFallback'"
- Correction de la validation des tâches en mode volatile

### Notes
- Les tests d'intégration nécessitent une configuration supplémentaire (script `test` dans package.json)
- La documentation de la Phase 1 est à finaliser
