# TODO SOTA — Backlog d’alignement (source: PLAN.md)

Ce fichier suit la trajectoire vers une version réellement “SOTA” au sens **preuve-based**.

La **source de vérité** est `PLAN.md`.

## P0 — Stabilisation & cohérence (M0→M3)
- [ ] M0: Truth Table phases 1→7 (exigences → preuves → statut) + tests associés.
- [ ] M1: Unifier le modèle Task (référence = `DBTask`) + conversions centralisées.
- [ ] M2: Un seul moteur playlist/brain en production avec invariants enforce.
- [ ] M3: Local-first strict (aucune server action Dexie, aucun chemin cloud par défaut).

## P1 — NLP, adaptation, gouvernance (M4→M6)
- [ ] M4: NLP canonique unique (extraction + classification) + métriques de fallback.
- [ ] M5: Adaptation Phase 6 opérationnelle (persistance Dexie, drift, rollback, journalisation).
- [ ] M6: Gouvernance Phase 7 durcie (budget réel, non-negotiables stricts, tests seuils).

## P2 — Résilience & qualité (M7→M8)
- [ ] M7: Snapshots/migrations/recovery sans simulation + tests d’intégration.
- [ ] M8: Nettoyage dettes + observabilité minimale + rapport final + checklist.