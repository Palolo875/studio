# Plan d’implémentation SOTA (local-first, zéro cloud)

## Règles non négociables
- Local-first strict : aucun appel cloud/Genkit par défaut. Tout pipeline IA/NLP doit être local ou stub DEV_ONLY.
- Source de vérité : Dexie (IndexedDB) pour données métier (tâches, sessions, décisions, snapshots). localStorage uniquement pour préférences légères UI.
- Définition du Done : feature intégrée au flux principal, persistée, testée (unit + integration). Pas de simulations en prod.
- Asynchronous correctness : toutes les promesses awaited et error-handling minimal (try/catch + toast/log contrôlé).
- Zéro simulation non protégée : pas de Math.random/fake data/console.log en prod sauf flag DEV_ONLY.

## Workstreams (P0/P1)
- WS0 P0 (Stabilisation immédiate)
  - Corriger tous les appels async (await + catch) dans dashboard/governance (fait : dashboard-client, governance-panel).
  - Supprimer/sécuriser simulations (Math.random, sampleTasks) dans UI principale et actions.
  - Valider npm run typecheck/lint/test dès que deps ok.
- WS1 P0 (Data layer Dexie)
  - Unifier schéma Dexie : tables déclarées = tables utilisées (tasks, sessions, brainDecisions, decisionExplanations, adaptationSignals, adaptationHistory, snapshots, overrides, etc.).
  - Migrer toute persistance de tâches vers Dexie (plus de localStorage). Dashboard/Capture doivent écrire/ lire Dexie.
  - Aligner databaseSnapshot.ts sur le schéma réel (pas de tables fantômes) + checksum/restore atomique.
- WS2 P0/P1 (Brain/replay persistant)
  - decisionLogger.ts : écrire/relire brainDecisions dans Dexie (plus de global array).
  - decisionExplanation.ts : générer et stocker les explications dans Dexie (table decisionExplanations), retour ID.
  - brainEngine replayDecision : lire Dexie plutôt que global; traces déterministes.
- WS3 P0 (Capture/NLP local)
  - capture-client.tsx : après analyzeCapture, persister les tâches extraites dans Dexie (upsertTasks) au lieu de console.log.
  - Pipeline NLP local (TaskExtractor, basicRawCapture) reste local; pas d’appel Genkit.
- WS5 P0 (Snapshots)
  - databaseSnapshot.ts : inclure uniquement tables réelles; export/import/restore robustes; stratégie corruption (fallback ou message).

## Nettoyage Genkit (bloquant npm)
- package.json : genkit supprimé (fait). Nettoyer aussi genkit-cli si encore présent.
- Supprimer fichiers :
  - src/ai/genkit.ts
  - src/ai/flows/daily-playlist-generation.ts
  - src/ai/flows/personalized-task-recommendations.ts
- Retirer imports/références : src/app/actions.ts (fait), autres fichiers si existants.

## Tâches détaillées à exécuter
1) **Retrait Genkit code**
   - Supprimer les fichiers ci-dessus. Vérifier qu’aucun import '@/ai/genkit' ou flows Genkit ne reste.
2) **Actions dashboard**
   - actions.ts : déjà basculé sur Dexie + algo local. Vérifier aucun sampleTasks restant. Pas d’appel cloud.
3) **Data layer & snapshots (WS1)**
   - src/lib/database/index.ts : confirmer tables existantes; ajouter manquantes si utilisées par code (decisionExplanations, adaptationHistory...).
   - src/lib/databaseSnapshot.ts : n’exporter/importer que les tables réelles; gérer erreurs et checksum.
   - Vérifier que DashboardClient et hooks utilisent Dexie, pas localStorage.
4) **Brain persistant (WS2)**
   - src/lib/taskEngine/decisionLogger.ts : persister brainDecisions dans Dexie (CRUD + versions si besoin).
   - src/lib/taskEngine/decisionExplanation.ts : persister dans table decisionExplanations; get/set via Dexie.
   - src/lib/taskEngine/brainEngine.ts : replayDecision lit Dexie; plus de simulation globale.
5) **Capture (WS3)**
   - src/components/capture/capture-client.tsx : après analyzeCapture, convertir vers DBTask et upsert dans Dexie; gérer erreurs (toast?) et rafraîchir vue si nécessaire.
6) **Simulations & async (WS0 validation)**
   - Traquer Math.random, sample/fake data, console.log en prod. Mettre sous DEV_ONLY ou supprimer.
   - Vérifier tous appels async phase7 (déjà corrigé dashboard/gov) + autres modules sensibles.

## Validation (quand npm OK)
- npm run typecheck
- npm run lint
- npm test (vitest) et npm test:e2e (playwright)

## Risques / watchpoints
- Lockfile encore à régénérer après nettoyage Genkit (npm install). Ne pas lancer maintenant.
- Tables Dexie manquantes lors des snapshots/replay peuvent casser l’import.
- Conversion Task -> DBTask : attention aux champs dates/effort/urgency.

## Suivi d’avancement
- Genkit retiré de package.json et actions.ts : ✅
- Fichiers Genkit à supprimer : ☐
- Dexie/snapshots alignés : ☐
- Brain logger/replay sur Dexie : ☐
- Capture persistance Dexie : ☐
- Simulations restantes nettoyées : ☐
