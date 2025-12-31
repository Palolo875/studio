# TODO SOTA — Backlog d’alignement (source: PLAN.md)

Ce fichier suit la trajectoire vers une version réellement “SOTA” au sens **preuve-based**.

La **source de vérité** est `PLAN.md`.

## P0 — Stabilisation local-first & tests
- [ ] Aucune lecture Dexie/IndexedDB côté serveur (Next server actions). Playlist/reco doivent être client-side.
- [ ] Burnout/protective: signaux atteignables + seuils cohérents + tests unitaires.
- [ ] Playwright: seed Dexie/settings et supprimer les scénarios basés sur localStorage.

## P1 — Résilience et gouvernance prouvées
- [ ] Snapshots/migrations/recovery: retirer les parties simulées si revendiquées (hash/chiffrement/migrations réelles) + tests.
- [ ] Adaptation (Phase 6): persister les signaux et instrumenter le produit, ou reclasser comme expérimental.
- [ ] “Truth table” phases 1→7: exigences → preuves → statut (prod/stub/non branché).

## P2 — Qualité globale
- [ ] Typecheck/lint/vitest/e2e stables en CI.
- [ ] Mesures de perf réelles (latences) et seuils documentés.