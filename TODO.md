# KairuFlow — Suivi d’exécution

Ce fichier reflète l’avancement réel.

La **source de vérité** est `PLAN.md` (audit, matrice Phase→Preuve→État, backlog P0/P1/P2).

## Règles
- Le suivi s’effectue par milestones `M0..M8` définies dans `PLAN.md`.
- Une tâche est “Done” uniquement si : intégrée au flux produit + persistée Dexie + tests + preuve (fichier/paths).

## État global
- Le noyau produit (Dexie, capture locale, dashboard, gouvernance) existe.
- Des incohérences bloquantes restent à corriger avant de revendiquer “SOTA / terminé”.

## P0 — Bloquants (M0→M3)
- [ ] M0: Truth Table phases 1→7 (exigences → preuves → statut) + tests associés.
- [ ] M1: Unifier le modèle Task (référence = `DBTask`) et supprimer les conversions legacy dispersées.
- [ ] M2: Un seul moteur playlist/brain en production (invariants enforce au runtime).
- [ ] M3: Local-first strict (aucune server action Dexie, aucun chemin cloud par défaut).

### Avancement concret (preuve fichier)
- [x] Phase 1: génération playlist active via `src/lib/playlistClient.ts` → `generateTaskPlaylist()`.
- [x] Invariant « 70% terminable »: `proposed` vs `completed` (avec fallback heuristique).
- [x] Dashboard: régénération marque les tâches restantes `skipped` + session précédente `EXHAUSTED`.
- [x] Focus: logs `started` + `completed` avec `duration` + `sessionId`.
- [x] Bibliothèque: changement deadline log `rescheduled`.
- [x] Énergie: stabilité `stable/volatile` propagée (check-in → settings → playlist → sessions).
- [x] Trace: supprimée de l’UI et déclenchée au niveau `generatePlaylistClient()` pour cohérence.

## P1 — Qualité & cohérence (M4→M6)
- [ ] M4: NLP canonique unique (extraction + classification) + métriques de fallback.
- [ ] M5: Phase 6 Adaptation opérationnelle (persistance Dexie, drift, rollback, journalisation).
  - [ ] M5.1: Contrat persisted `adaptationHistory.change` type-safe (no `any`) + validation deltas.
  - [ ] M5.2: UI Transparence adaptation branchée Dexie (history + rollback + exports snapshots).
  - [ ] M5.3: Mode transitions persistants (ou intégration au logger existant) + exploitation dans brainQuality.
  - [ ] M5.4: Tests unit/integration sur rollback + pruning + export-before-prune.
- [ ] M6: Phase 7 Gouvernance durcie (budget réel, non-negotiables stricts, tests seuils).

## P2 — Résilience & fermeture (M7→M8)
- [ ] M7: Snapshots/migrations/recovery sans simulation + tests d’intégration.
- [ ] M8: Nettoyage dettes + observabilité minimale + rapport final + checklist.