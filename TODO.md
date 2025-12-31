# KairuFlow — Suivi d’exécution

Ce fichier reflète l’avancement réel.

La **source de vérité** est `PLAN.md` (audit, matrice Phase→Preuve→État, backlog P0/P1/P2).

## État global
- Le noyau produit (Dexie, capture locale, dashboard, gouvernance) existe.
- Des incohérences bloquantes restent à corriger avant de revendiquer “SOTA / terminé”.

## P0 — Bloquants
- [ ] Local-first: supprimer l’usage de Dexie côté serveur (`src/app/actions.ts`). Playlist/reco doivent être client-side/browser-only.
- [ ] Gouvernance: corriger BurnoutEngine/Phase 7 (surcharge chronique atteignable + seuil protectif) + tests unitaires ciblés.
- [ ] Tests: remettre Playwright E2E en cohérence avec la persistance Dexie (seed/settings) au lieu de localStorage.

## P1 — Qualité & cohérence
- [ ] Aligner README/TODO_SOTA sur l’état réel et fournir des “preuves” (fichiers / tests) pour chaque claim.
- [ ] Phase 6: intégrer (ou reclasser) AdaptationEngine (persistance des signaux + instrumentation produit).
- [ ] Phase 5: durcir snapshots/migrations/recovery si revendiqués (supprimer les parties simulées).

## P2 — Stabilisation
- [ ] Stabiliser `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`.