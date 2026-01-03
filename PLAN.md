# Plan d’implémentation SOTA (local-first, zéro exfiltration de données)

## Objectif
Livrer une version **cohérente**, **local-first**, **preuve-based** (tests + fichiers) et **sans simulation cachée**.

## Principes non négociables
- Local-first strict : aucune lecture/écriture IndexedDB/Dexie côté serveur. Aucun envoi de données utilisateur vers des serveurs. Téléchargement d’assets (ex: modèles) autorisé si configuré, puis usage local/offline.
- Source de vérité : Dexie (IndexedDB) pour données métier (tâches, sessions, décisions, adaptations, snapshots). `localStorage` uniquement pour préférences UI non critiques.
- Unicité : un seul modèle de tâche métier et un seul moteur “playlist/brain” utilisé en production.
- Définition du Done : intégré au flux principal, persisté, test (unit + e2e) + preuve (fichiers/paths) + suppression des stubs.
- Zéro simulation non protégée : pas de `Math.random`, fake data, `console.log`, “Simulation” en prod (sauf flag DEV_ONLY explicite).

## Milestones (ordre d’exécution)

### M0 — Baseline & garde-fous (P0)
**But**: empêcher toute régression pendant la refonte.

**Livrables**
- Un inventaire “Truth Table” (phase → feature → statut → preuve fichier → tests associés).
- Un `npm run typecheck` + `npm run lint` + `npm run test` + `npm run test:e2e` stable (ou liste de blocages + fix).

**Critères de Done**
- Tous les écrans critiques (Dashboard, Capture, Focus, Bibliothèque, Evening) utilisent Dexie comme source de vérité.
- Aucune route/action serveur n’accède à Dexie/IndexedDB.

### M1 — Unification du modèle Task (P0)
**But**: supprimer la fragmentation `DBTask` vs `legacy Task` vs `taskEngine Task`.

**Décisions d’architecture**
- Le type de référence devient `DBTask` (persisté), avec un mapping unique vers le type de décision du Brain si nécessaire.

**Livrables**
- Un module unique de conversion (DBTask ↔ BrainTask) utilisé partout.
- Suppression/neutralisation des anciennes conversions dispersées.

**Critères de Done**
- Pas de “legacy Task” utilisé dans les flows principaux.
- Les dates/efforts/urgences sont cohérents (pas de string ISO vs `Date` divergents).

### M2 — Un seul moteur de playlist/brain en production (P0)
**But**: la playlist visible par l’utilisateur doit être générée par le moteur qui enforce les invariants.

**Livrables**
- Dashboard branché sur `taskEngine.generateTaskPlaylist()` (ou équivalent) avec invariants effectifs.
- Retrait/archivage de l’ancien moteur playlist si non utilisé.

**Critères de Done**
- Les invariants sont enforce au runtime (pas seulement listés).
- Tests unit + e2e couvrent le moteur réellement utilisé.

### M3 — Local-first strict : suppression des chemins cloud & server actions Dexie (P0)
**But**: aucune dépendance implicite au serveur.

**Livrables**
- `src/app/actions.ts` : aucune lecture Dexie. Les actions cloud sont supprimées ou DEV_ONLY.
- Toutes les recommandations/playlists sont client-side (ou via worker) uniquement.

**Critères de Done**
- Recherche grep : aucune référence active à Genkit/Gemini dans le runtime produit.

### M4 — NLP : un pipeline réel, unique, cohérent avec la doc (P1)
**But**: un seul classificateur, extraction assumée (winkNLP si choisi, sinon heuristique documentée).

**Livrables**
- Un `classifyTask` canonique (pas de double implémentation concurrente).
- Un mode fallback explicite + métriques (taux de fallback).

**Critères de Done**
- Tous les écrans qui créent des tâches utilisent le même pipeline.

### M5 — Phase 6 Adaptation : opérationnelle (P1)
**But**: passer du proto à un système persistant, gouverné, rollbackable.

**Livrables**
- Signaux et paramètres persistés dans Dexie.
- Drift monitor persistant.
- Rollback réel + journalisation.

**Critères de Done**
- Une adaptation appliquée/rollbackée laisse des traces consultables (DB + UI minimal).

### M6 — Phase 7 Gouvernance : budget réel & non-negotiables stricts (P1)
**But**: coûts, budgets et décisions basés sur données réelles.

**Livrables**
- Budget quotidien calculé à partir de sessions/historique.
- Non-negotiables appliqués et testés.

**Critères de Done**
- Tests unitaires sur les seuils (burnout/protective atteignables).

### M7 — Résilience : snapshots/migrations/recovery sans simulation (P2)
**But**: retirer le “faux solide”.

**Livrables**
- Migrations réelles, rollback prouvé, intégrité validée.
- Snapshots export/import/restores alignés sur les tables réelles.

**Critères de Done**
- Tests d’intégration restauration snapshot + corruption recovery.

### M8 — Qualité transverse & fermeture (P2)
**Livrables**
- Nettoyage stubs/simulations.
- Observabilité minimale (logs structurés + métriques locales).
- Rapport final + checklist de validation.

## Annexe — Notes d’audit (historique, preuve-based)
Les sections ci-dessous sont conservées comme référence. Le suivi d’exécution doit se baser sur les milestones ci-dessus.

### Audit v2 (exécuté sur le code actuel)
1) Cartographie routes (13 page.tsx)
   - Dashboard : /dashboard (DashboardClient) = cœur produit ; /dashboard/capture (CaptureClient) = capture cloud via server action Genkit/Gemini ; /dashboard/bibliotheque (ReservoirClient) démarre sur initialTasks statiques, pas Dexie ; /dashboard/focus/[taskId] (FocusMode) complète via localStorage stub ; /dashboard/evening (console.log + alert, non implémenté) ; /dashboard/settings ; /dashboard/stats.
   - Onboarding : /onboarding/* utilise localStorage (ok pour onboarding) mais non intégré au moteur ensuite. /onboarding-test redirige vers /dashboard.
2) Server actions (src/app/actions.ts)
   - "use server" ok, mais handleGeneratePlaylist appelle generateMagicalPlaylist sans currentTime requis par MagicalPlaylistOptions → bug potentiel.
   - handleAnalyzeCapture appelle Genkit/Gemini (analyze-capture-flow) ⇒ contradiction “local-first / zéro exfiltration”.
   - handleGetRecommendations : stub local tri par priorité.
3) NLP : deux pipelines concurrents
   - Pipeline réel UI Capture : handleAnalyzeCapture (cloud Gemini) + tâches proposées, ajout à la bibliothèque non branché (console.log).
   - Pipeline “SOTA local” : Capture.tsx + useNLP/useTaskStore + Dexie simulée (fausse classe Dexie, console.log) → vitrine non productisée.
   - Conclusion : la promesse “NLP local” n’est pas l’implémentation active.
4) Magical playlist scoring incohérent
   - deadlineScore 0/5/15/30 et priorityScore 0/10/20 sont combinés avec energyScore [0..1] via coefficients 0.4/0.3/0.2 → pondérations illusoires, deadline domine.
5) Source de vérité observée
   - Dexie : lue dans handleGeneratePlaylist (getAllTasks).
   - localStorage : massif dans DashboardClient (rituels), FocusPage (completedTasks), onboarding (ok).
   - Stubs : Capture “ajouter” non implémenté ; Evening “sauvegarder” non implémenté ; gouvernance déjà corrigée async mais reste à valider.
6) Zones à auditer pour “couverture totale”
   - Composants : ReservoirClient, StatsClient, SettingsForm, FocusMode, Dashboard core (async/persistance/gouvernance).
   - Data layer : src/lib/database/*, taskDatabase.ts, dbMigrationManager.ts, dbGrowthMonitor.ts, databaseSnapshot.ts, dbCorruptionRecovery.ts.
   - IA : flows Genkit (prompts/données envoyées/consentement), autres appels LLM éventuels.
   - Tests/CI : couverture réelle des __tests__ et e2e.
7) Ordre d’audit suivant (priorité)
   1. ReservoirClient (bibliothèque) : Dexie vs initialTasks.
   2. StatsClient : provenance des stats (DB vs simulation).
   3. SettingsForm : contrôle réel NLP/Genkit/offline.
   4. FocusMode : complétion → DB/history/burnout ? (aujourd’hui localStorage).
   5. Truth Table feature vs doc (phases 1→7) : prod / stub / non branché / contradictoire avec preuve fichier.

## Audit “état général + qualité + alignement Doc/Phases” (v2 — brutal, preuve-based)
1) État réel du produit (ce qui tourne vraiment aujourd’hui)
   - Dashboard : cœur (déjà audité).
   - Capture (/dashboard/capture) : LLM cloud via handleAnalyzeCapture → analyzeCapture Genkit/Gemini ; “Ajouter à la Bibliothèque” = console.log (non implémenté).
   - Bibliothèque (/dashboard/bibliotheque) : ReservoirClient initialisé avec initialTasks, state local (useState); CRUD en mémoire, pas Dexie.
   - Focus (/dashboard/focus/[taskId]) : complete via localStorage (completedTasks) + console.log ; FocusMode ne persiste rien.
   - Evening : “auto-save” = console.log ; “Transformer en tâches” = alert non branché.
   - Conclusion : écrans majeurs en mode démo (state local/localStorage/console) alors que les moteurs Phase 1/6/7 existent.
2) Persistance & Source of Truth (contradictions)
   - DB réelle Dexie (src/lib/database/index.ts) : tables tasks, sessions, taskHistory, userPatterns, overrides, sleepData + v2 brainDecisions, decisionExplanations, adaptationSignals, adaptationHistory, snapshots.
   - DB “fantôme” taskDatabase.ts : simulation en mémoire + localStorage patterns (“en attendant Dexie”) → double système de vérité.
   - Risque : divergence totale et illusions ; snapshot/phase 5 semblent exister mais ne ciblent pas la vraie DB.
3) Qualité d’implémentation (scorecard)
   - UX/intégration : Bibliothèque riche mais non DB ; Capture cloud ok mais Add-to-library absent ; Focus/Evening persistés en localStorage/console → inutilisable pour Brain/Governance/Burnout.
   - Code health : useNLP.ts/TaskStorage.ts = fausse Dexie + store console ; dbMigrationManager.ts = backup/chiffre/hash simulés, db.meta.push générique ; dbGrowthMonitor.ts = manip DOM directe hors design system.
   - Verdict : beaucoup de modules “Phase 4/5 SOTA” sont stubs ou non intégrés.
4) Alignement Doc Phases 1→7 vs code vs produit
   - Phase 1 déterministe : moteurs riches en lib ; actions.ts utilise generateMagicalPlaylist (sans currentTime) ; bibli/focus ne nourrissent pas Dexie → signaux insuffisants.
   - Phase 2 NLP local : produit = cloud Genkit ; pipeline local existe mais entouré de stubs (Dexie fake/store fake) et non utilisé ; contradiction structurelle.
   - Phase 3 replay/audit : tables brainDecisions/decisionExplanations présentes ; chaîne log→replay→UI non démontrée.
   - Phase 4 perf/fallback/workers : modules présents, intégration faible.
   - Phase 5 tests/rollback/corruption : snapshots présents, migrations/backup/recovery très simulés ; promesse “anti data loss” non tenue.
   - Phase 6 adaptation : moteur et tables adaptation présents ; Settings IA = TODO ; consent/rollback absents.
   - Phase 7 gouvernance/burnout : burnoutEngine existe, mais actions produit (complete, capture→library, evening→tasks) ne nourrissent pas la DB → signaux incomplets.
5) Angles morts les plus dangereux (priorités)
   - P0 : Double DB (Dexie réelle vs taskDatabase fake) → divergence.
   - P0 : Bibliothèque en mémoire → aucune durabilité/audit.
   - P0 : Capture cloud + pas d’intégration bibliothèque → promesse “capteur structurant” non réalisée.
   - P0 : Focus completion en localStorage → burnout/gouvernance aveugles.
   - P1 : Migration/backup/snapshot très simulés → dette et risque confiance.
6) Restant à couvrir pour audit complet
   - dashboard-client.tsx (persistance, async phase7, intégration DB).
   - FocusProductivity / EnergyProfile / AccomplishmentCalendar (sources de stats ? DB ou mocks ?).
   - databaseSnapshot.ts + dbCorruptionRecovery.ts + dataIntegrityValidator.ts (alignement avec DB v2).
   - Tests : src/lib/__tests__ (réels vs démos).
   - Livrables à venir : matrice Phase→Exigence→Preuve→État→Risque ; scorecard qualité (product/data/offline/security) ; backlog P0/P1/P2 avec preuves.

## Matrice Phase → Exigence → Preuve → État → Risque
- Phase 1 (déterministe) : playlist contrainte, invariants, déterminisme ; preuves = src/lib/taskEngine/*, actions.ts (generateMagicalPlaylist sans currentTime) ; État = partiel ; Risque = signaux insuffisants + bug options.
- Phase 2 (NLP local) : capteur structurant local ; preuves = pipeline réel cloud (handleAnalyzeCapture → Genkit/Gemini) + pipeline local stubs (useNLP/TaskStorage Dexie fake) ; État = contradictoire ; Risque = fuite cloud + promesse brisée.
- Phase 3 (replay/audit) : brainDecisions/decisionExplanations en DB ; État = infra ok, intégration UI non prouvée ; Risque = auditabilité faible.
- Phase 4 (perf/fallback/workers) : modules progressiveFallback/workerCommunication/monitors présents ; État = faible intégration ; Risque = perf/offline non garanties.
- Phase 5 (rollback/corruption) : snapshots en DB, dbMigrationManager/dbCorruptionRecovery simulés ; État = simulation ; Risque = perte de confiance/données.
- Phase 6 (adaptation) : tables adaptation présentes, Settings IA TODO ; État = moteur sans produit ; Risque = adaptation fantôme/consent manquant.
- Phase 7 (gouvernance/burnout) : burnoutEngine existe, mais actions produit ne nourrissent pas DB ; État = logique plausible, données manquantes ; Risque = gouvernance aveugle.

### Rectifications (audit v3)
- Local-first : la capture est locale, mais des dépendances et routes/actions historiques cloud existent encore dans le repo. La règle doit être: aucun appel cloud par défaut.
- Playlist : la génération playlist est actuellement branchée via server action, ce qui contredit le choix Dexie/IndexedDB (browser-only). La génération doit être client-side.
- Burnout/protective : la surcharge chronique ne peut pas se déclencher si elle est définie comme ratio completed/planned > 1.2 ; le seuil protectif `> 0.75` rend le mode protectif inatteignable si un signal a un poids et ne se déclenche jamais.
- Tests : Playwright configure/valide encore des états via localStorage (morning ritual) alors que la persistance produit utilise Dexie settings.

## Scorecard qualité (brutal, preuve-based)
- Product readiness : Rouge — Bibliothèque/Focus/Evening/Capture “add to lib” non persistés.
- Data integrity / Source of truth : Rouge — double DB (Dexie vs taskDatabase), localStorage massif, stubs console.
- Determinisme / Async correctness : Orange — phase7 partiellement awaité, generateMagicalPlaylist options incohérentes.
- Offline / local-first : Rouge — capture cloud active, pipeline local stub.
- Security/consent cloud : Rouge — flux LLM sans consent toggle, promesse “local-first / zéro exfiltration” rompue.
- Tests/CI : Orange — workflows présents, mais coverage réelle non vérifiée, npm audit continue-on-error.

## Backlog P0/P1/P2 (corrigés par priorité)
- P0
  - Corriger les server actions : aucune lecture Dexie côté serveur. Déplacer playlist/reco en client-side ou via worker/browser.
  - Corriger BurnoutEngine/Phase 7 : surcharge chronique atteignable + seuil protectif + tests unitaires.
  - Remettre Playwright E2E en cohérence avec Dexie (seed DB/settings) et supprimer les assertions basées sur localStorage.
  - Supprimer/neutraliser taskDatabase (fake DB) et brancher tout sur Dexie réelle.
  - Persister Bibliothèque/Focus/Evening/Capture add-to-library dans Dexie ; éliminer console/localStorage pour ces flux.
  - Neutraliser handleAnalyzeCapture cloud ou le flagger DEV_ONLY ; brancher pipeline NLP local réel (useNLP refondu avec vraie Dexie).
  - Corriger generateMagicalPlaylist : options (currentTime) + normalisation des scores.
- P1
  - Durcir migrations/snapshots/recovery (dbMigrationManager, dbCorruptionRecovery, databaseSnapshot) pour cesser les simulations.
  - Intégrer burnout/gouvernance aux données réelles (complétions, captures, evening).
  - Nettoyer dbGrowthMonitor (notifications DOM), aligner UI/toast.
- P2
  - Workerisation/fallback réelle des opérations lourdes ; mesurer perf.
  - Étendre tests (unit/e2e) sur flux Dexie réels (bibli/focus/capture/evening).
  - Réviser Settings/consent IA (phase 6) et lier adaptation aux données réelles.

## Règles non négociables
- Local-first strict : aucun appel cloud/Genkit par défaut. Tout pipeline IA/NLP doit être local ou stub DEV_ONLY.
- Source de vérité : Dexie (IndexedDB) pour données métier (tâches, sessions, décisions, snapshots). localStorage uniquement pour préférences légères UI.
- Définition du Done : feature intégrée au flux principal, persistée, testée (unit + integration). Pas de simulations en prod.
- Asynchronous correctness : toutes les promesses awaited et error-handling minimal (try/catch + toast/log contrôlé).
- Zéro simulation non protégée : pas de Math.random/fake data/console.log en prod sauf flag DEV_ONLY.

## Workstreams (P0/P1)
- WS0 P0 (Stabilisation immédiate)
  - Corriger les async oubliés (dashboard/governance fait) et vérifier Reservoir/Stats/Focus.
  - Supprimer/sécuriser simulations (Math.random, sampleTasks, console.log en prod).
  - Neutraliser capture cloud : désactiver handleAnalyzeCapture (Genkit/Gemini) ou le mettre sous flag DEV_ONLY, basculer vers pipeline local.
  - Corriger generateMagicalPlaylist : fournir currentTime ou revoir types/options pour cohérence, et normaliser les scores (energy/deadline/priority).
  - Valider npm run typecheck/lint/test dès que deps ok.
- WS1 P0 (Data layer Dexie)
  - Unifier schéma Dexie : tables déclarées = tables utilisées (tasks, sessions, brainDecisions, decisionExplanations, adaptationSignals, adaptationHistory, snapshots, overrides, etc.).
  - Migrer toute persistance de tâches vers Dexie (plus de localStorage). Dashboard/Capture/Focus doivent écrire/lire Dexie.
  - Aligner databaseSnapshot.ts + dbCorruptionRecovery + dbMigrationManager sur le schéma réel (pas de tables fantômes) + checksum/restore atomique.
- WS2 P0/P1 (Brain/replay persistant)
  - decisionLogger.ts : écrire/relire brainDecisions dans Dexie (plus de global array).
  - decisionExplanation.ts : générer et stocker les explications dans Dexie (table decisionExplanations), retour ID.
  - brainEngine replayDecision : lire Dexie ; supprimer simulations globales.
- WS3 P0 (Capture/NLP local)
  - capture-client.tsx : après analyse, convertir vers DBTask et upsert Dexie; supprimer console.log stub; brancher “Ajouter à la Bibliothèque”.
  - Pipeline NLP local (TaskExtractor, basicRawCapture) : remplacer fausse Dexie/useTaskStore mock par la vraie DB et l’intégrer aux routes principales.
  - Retirer/désactiver Genkit flows (analyze-capture-flow, daily-playlist-generation, personalized-task-recommendations) si non nécessaires.
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
1) **Retrait/neutralisation Genkit cloud**
   - Supprimer ou flagger DEV_ONLY : src/ai/genkit.ts, src/ai/flows/* (analyze-capture-flow, daily-playlist-generation, personalized-task-recommendations).
   - actions.ts : handleAnalyzeCapture doit être local ou désactivé ; vérifier aucune route ne leak vers cloud.
2) **Actions dashboard**
   - actions.ts : fournir currentTime à generateMagicalPlaylist ou ajuster l’API pour cohérence; corriger scoring (normaliser unités).
   - Vérifier aucun sampleTasks restant. Pas d’appel cloud.
3) **Data layer & snapshots (WS1)**
   - src/lib/database/index.ts : confirmer tables existantes; ajouter manquantes si utilisées par code (decisionExplanations, adaptationHistory...).
   - src/lib/databaseSnapshot.ts + dbCorruptionRecovery.ts + dbMigrationManager.ts : n’exporter/importer que les tables réelles; gérer erreurs et checksum.
   - DashboardClient/Focus/Reservoir/Stats/hooks utilisent Dexie, pas localStorage.
4) **Brain persistant (WS2)**
   - src/lib/taskEngine/decisionLogger.ts : persister brainDecisions dans Dexie (CRUD + versions si besoin).
   - src/lib/taskEngine/decisionExplanation.ts : persister dans table decisionExplanations; get/set via Dexie.
   - src/lib/taskEngine/brainEngine.ts : replayDecision lit Dexie; plus de simulation globale.
5) **Capture (WS3)**
   - src/components/capture/capture-client.tsx : après analyse, convertir vers DBTask et upsert dans Dexie; gérer erreurs (toast?) et rafraîchir vue si nécessaire; enlever console.log.
   - useNLP/useTaskStore/TaskStorage : remplacer fausse Dexie par vraie DB; intégrer ce pipeline à /dashboard/capture ou retirer la vitrine.
6) **Simulations & async (WS0 validation)**
   - Traquer Math.random, sample/fake data, console.log en prod. Mettre sous DEV_ONLY ou supprimer.
   - Vérifier tous appels async phase7 + Reservoir/Stats/Focus (await systématique).
7) **Audit restant (ordre v2)**
   - Relire ReservoirClient, StatsClient, SettingsForm, FocusMode, Dashboard core (persistance/gouvernance/async).
   - Construire une Truth Table feature vs doc (phases 1→7) avec statut prod/stub/non branché/contradictoire + fichier preuve.

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
- Playlist magique: options `currentTime` + mapping DBTask → Task : ✅
- Focus routing: `taskId` canonique + fetch Dexie : ✅
- Capture: ajout à la bibliothèque via Dexie (upsert) : ✅
- useNLP: retourne/persiste des `DBTask[]` (même en fallback) : ✅
- Evening: classification via RealTaskClassifier + création DBTask : ✅
- `src/ai/dev.ts` neutralisé (pas de dépendances dev au build) : ✅
- P0 Local-first server actions (pas de Dexie serveur) : ☐
- P0 Burnout/protective atteignable + tests : ☐
- P0 Playwright E2E alignés Dexie : ☐
- Fichiers Genkit à supprimer : ☐
- Dexie/snapshots alignés : ☐
- Brain logger/replay sur Dexie : ☐
- Capture persistance Dexie : ☐
- Simulations restantes nettoyées : ☐

### Implémentations récentes (preuve-based)
- Invariant « 70% terminable » rendu mesurable via `proposed` vs `completed` : ✅
  - Preuve: `src/lib/database/index.ts` (`DBTaskHistory.action` inclut `proposed`, helper `recordTaskProposals`)
  - Preuve: `src/lib/taskEngine/types.ts` (`proposalHistory`)
  - Preuve: `src/lib/taskEngine/dbTaskMapping.ts` (mapping `proposed` -> `proposalHistory`)
  - Preuve: `src/lib/taskEngine/invariantChecker.ts` (calcul `completed/proposed` + fallback heuristique)
  - Preuve: `src/components/dashboard/dashboard-client.tsx` (log `recordTaskProposals` lors création session)

- Énergie: propagation `stable/volatile` end-to-end (check-in -> settings -> playlist -> sessions) : ✅
  - Preuve: `src/components/dashboard/energy-check-in.tsx` (sélecteur stabilité)
  - Preuve: `src/components/dashboard/dashboard-client.tsx` (stockage/chargement + FormData)
  - Preuve: `src/lib/playlistClient.ts` (Zod + `energyStability`)

- Unicité moteur playlist + trace cohérente (pas de double moteur UI) : ✅
  - Preuve: `src/components/dashboard/playlist-generator.tsx` (suppression trace UI)
  - Preuve: `src/lib/playlistClient.ts` (log décision alignée sur playlist générée)

- Focus: historique réel `started/completed` + durée de focus capturée : ✅
  - Preuve: `src/components/focus/timer-display.tsx` (elapsedWorkSeconds)
  - Preuve: `src/components/focus/focus-mode.tsx` (passe actualDurationMinutes)
  - Preuve: `src/app/dashboard/focus/[taskId]/page.tsx` (log `started` + `completed` avec duration/energy/sessionId)
  - Preuve: `src/lib/database/index.ts` (`completeTask(...data)`)

- Dashboard: régénération session -> log des tâches restantes comme `skipped` : ✅
  - Preuve: `src/lib/database/index.ts` (`recordTaskSkips`)
  - Preuve: `src/components/dashboard/dashboard-client.tsx` (appelle `recordTaskSkips` avant `EXHAUSTED`)

- Bibliothèque: changement de deadline -> log `rescheduled` : ✅
  - Preuve: `src/components/reservoir/reservoir-client.tsx` (log `addTaskHistory(..., 'rescheduled')`)

## Truth Table — Phase 1 (preuve-based)

| Exigence Phase 1 | Statut | Preuves (fichiers) |
|---|---:|---|
| Playlist déterministe (sans IA) | ✅ | `src/lib/playlistClient.ts` → `generateTaskPlaylist()` ; `src/lib/taskEngine/selector.ts` |
| Invariant: max 5 tâches | ✅ | `src/lib/taskEngine/invariantChecker.ts` (`checkMaxTasksInvariant`) ; tests `src/lib/taskEngine/__tests__/invariantChecker.test.ts` |
| Invariant: ≥ 1 quick win < 15min | ✅ | `src/lib/taskEngine/invariantChecker.ts` (`checkMinQuickWinInvariant`) ; `src/lib/taskEngine/selector.ts` (injectQuickWin) |
| Invariant: charge ≤ capacité session | ✅ | `src/lib/taskEngine/invariantChecker.ts` (`checkTotalLoadInvariant`) ; `src/lib/taskEngine/capacityCalculator.ts` |
| Invariant: pas de high effort si énergie basse | ✅ | `src/lib/taskEngine/invariantChecker.ts` (`checkEnergyMismatchInvariant`) ; `src/lib/taskEngine/energyModel.ts` |
| Invariant: terminable ≥ 70% (mesurable) | ✅ | `src/lib/database/index.ts` (`DBTaskHistory.action` inclut `proposed`) ; `src/lib/taskEngine/invariantChecker.ts` (`completed/proposed`) |
| Événement: log `proposed` lors génération playlist | ✅ | `src/lib/database/index.ts` (`recordTaskProposals`) ; `src/components/dashboard/dashboard-client.tsx` |
| Événement: log `skipped` lors régénération/exhaust | ✅ | `src/lib/database/index.ts` (`recordTaskSkips`) ; `src/components/dashboard/dashboard-client.tsx` |
| Événement: log `started` en Focus | ✅ | `src/app/dashboard/focus/[taskId]/page.tsx` (`addTaskHistory(..., 'started')`) |
| Événement: log `completed` avec durée réelle | ✅ | `src/lib/database/index.ts` (`completeTask(taskId, {duration,...})`) ; `src/components/focus/timer-display.tsx` |
| Événement: log `rescheduled` sur changement deadline | ✅ | `src/components/reservoir/reservoir-client.tsx` (`addTaskHistory(..., 'rescheduled')`) |
| Énergie: stabilité `stable/volatile` prise en compte | ✅ | `src/components/dashboard/energy-check-in.tsx` ; `src/components/dashboard/dashboard-client.tsx` ; `src/lib/playlistClient.ts` |
| Trace cohérente (pas de double moteur) | ✅ | `src/components/dashboard/playlist-generator.tsx` (trace UI supprimée) ; `src/lib/playlistClient.ts` (log décision alignée) |

## Truth Table — Phase 2 (preuve-based)

| Exigence Phase 2 | Statut | Preuves (fichiers) |
|---|---:|---|
| NLP = capteur structurant (pas décideur) | ✅ | `docs/PHASE_2_NLP_CAPTEUR_STRUCTURANT.md` ; suppression priorité: `src/components/capture/capture-client.tsx`, `src/ai/flows/analyze-capture-flow.ts` |
| Détection langue: fallback UI si texte trop court | ✅ | `src/lib/nlp/LanguageDetector.ts` (`reason: too_short`, `confidence: 0.3`) ; test `src/lib/nlp/__tests__/LanguageDetector.test.ts` |
| Extraction: 1 action max par clause + split tâches composées | ✅ | `src/lib/nlp/TaskExtractor.ts` (`splitCompoundSentence`, flag `split_from_compound`) ; test `src/lib/nlp/__tests__/TaskExtractor.test.ts` |
| Classification: confiance < 0.7 => unknown (sortie valide) | ✅ | `src/lib/nlp/RealTaskClassifier.ts` ; test `src/lib/nlp/__tests__/RealTaskClassifier.test.ts` |
| Fusion: en cas d’incertitude, DBTask neutre (pas de décisions) | ✅ | `src/lib/nlp/TaskFactory.ts` (defaults) ; test `src/lib/nlp/__tests__/TaskFactory.test.ts` |
| Réversibilité: persister des hints NLP structurés | ✅ | `src/lib/database/index.ts` (`DBTask.nlpHints`, schema v7) ; `src/lib/taskEngine/dbTaskMapping.ts` ; `src/lib/taskMapping.ts` ; test `src/lib/__tests__/taskMapping.test.ts` |
| Mise à jour DB sûre: updateTask ne doit pas effacer nlpHints/tags | ✅ | `src/lib/database/index.ts` (`safeUpdates`) ; test `src/lib/database/database.test.ts` |

## Truth Table — Phase 3 (Replay/Audit) (preuve-based)

| Exigence Phase 3 | Statut | Preuves (fichiers) |
|---|---:|---|
| Persister les décisions (brainDecisions) | ✅ | `src/lib/database/index.ts` (`DBBrainDecision`, table `brainDecisions`) ; `src/lib/taskEngine/decisionLogger.ts` (`logBrainDecision`) |
| Persister les explications figées (decisionExplanations) | ✅ | `src/lib/database/index.ts` (`DBDecisionExplanation`, table `decisionExplanations`) ; `src/lib/taskEngine/decisionExplanation.ts` (put Dexie) |
| Décision avec traçabilité (decisionId, brainVersion, inputs/outputs) | ✅ | `src/lib/taskEngine/brainEngine.ts` (`decideSessionWithTrace`) ; `src/lib/taskEngine/brainContracts.ts` (types BrainInput/BrainOutput/BrainDecision) |
| Replay déterministe depuis la DB (async) | ✅ | `src/lib/taskEngine/brainEngine.ts` (`replayDecisionAsync`) |
| Replay sync best-effort (même runtime) | ✅ | `src/lib/taskEngine/decisionLogger.ts` (cache `decisionCache`) ; `src/lib/taskEngine/brainEngine.ts` (`replayDecision`) |
| Accès explication: getters async + cache sync | ✅ | `src/lib/taskEngine/decisionExplanation.ts` (`getExplanationForDecisionAsync` + caches) |
| UI minimale Audit/Replay (local-first) | ✅ | `src/app/dashboard/audit/page.tsx` ; `src/app/dashboard/layout.tsx` (entrée menu `/dashboard/audit`) |
| Tests non-régression (persist + explanation + replay match) | ✅ | `src/lib/taskEngine/__tests__/brainEngine.test.ts` |

## Phase 3 — Release checklist (bloquants/preuves)
- ☐ `npm run typecheck` OK
- ☐ `npm run lint` OK
- ☐ `npm run test` OK
- ☐ Vérifier `/dashboard/audit` affiche décisions + explication + replay
- ☐ Vérifier que `replayDecisionAsync` retourne `match=true` sur une décision persistée

## Résumé audit/implémentation — Phase 3 (preuve-based)
- **Problème initial**: tables `brainDecisions/decisionExplanations` existaient, mais la chaîne **log → lecture → replay → UI** n’était pas prouvée.
- **Implémentation**:
  - Persistance: `logBrainDecision` écrit en Dexie et conserve un cache runtime.
  - Explications: `generateDecisionExplanation` persiste en Dexie + cache runtime + getters async.
  - Replay: `replayDecisionAsync` rejoue depuis `inputs` persistés et compare les IDs de tâches sélectionnées.
  - UI: page `/dashboard/audit` permet d’inspecter et valider le déterminisme.

## Audit profond — Phase 3 (docs vs code)

### Exigences docs (verifiables)
- Décisions traçables, persistées, consultables.
- Explication figée (anti-mensonge) persistée et liée à la décision (`explanationId`).
- Replay déterministe (rejouer à partir des `inputs` persistés → output identique sur critères définis).
- Garanties de pureté (`usedAIdecision=false`, etc.) présentes dans les sorties.

### Constat initial (écarts détectés)
- **Clonage destructif**: `JSON.parse(JSON.stringify(input))` dans `decideSessionWithTrace` cassait les `Date` (et potentiellement les structures), risquant un replay faux.
  - Preuve: `src/lib/taskEngine/brainEngine.ts` (avant correction).
- **Explication figée manquante sur logs Phase 1**: `playlistClient.ts` logge une `BrainDecision` avec `explanationId: ''`.
  - Preuve: `src/lib/playlistClient.ts` (avant correction).
- **Audit UI trompeur**: affichage brut `JSON.stringify` masquait les `Map` (vides) et les `Date` (strings), rendant l’audit illisible.
  - Preuve: `src/app/dashboard/audit/page.tsx` (avant correction).
- **Policy manager non conforme/fragile**: imports manquants, `any`, et valeurs “Simulation” dans `budgetConsumed`.
  - Preuve: `src/lib/taskEngine/decisionPolicyManager.ts` (avant correction).

### Corrections appliquées (preuves)
- **Préservation types pour déterminisme**: remplacement du clone JSON par `structuredClone` (avec fallback).
  - Preuve: `src/lib/taskEngine/brainEngine.ts`.
- **Anti-mensonge**: génération + persistance d’une explication figée et remplissage de `explanationId` lors du logging Phase 1.
  - Preuve: `src/lib/playlistClient.ts` (appel `generateDecisionExplanation(decision)` + `decision.explanationId = explanation.id`).
- **Audit UI lisible**: rendu JSON avec replacer (`Map` → entries, `Date` → ISO).
  - Preuve: `src/app/dashboard/audit/page.tsx` (`stringifyForAudit`).
- **Policy manager durci**: imports, `RejectionReason` typé, suppression de `any`, suppression du “Simulation”, alignement `guarantees.coachIsSubordinate`.
  - Preuve: `src/lib/taskEngine/decisionPolicyManager.ts`.

### Risques résiduels / TODOs Phase 3
- **Fallback `structuredClone`**: si indisponible, le fallback JSON reste destructif (Date/Map). À surveiller si l’app cible un runtime sans `structuredClone`.
- **Contestations utilisateur**: persistées dans Dexie (audit-proof) + cache mémoire best-effort.
  - Preuves: `src/lib/database/index.ts` (table `userChallenges`, schema v9, helpers `recordUserChallenge/getUserChallengesByDecisionId`) ; `src/lib/taskEngine/userChallenge.ts` (`recordUserChallenge`, `getChallengesForDecisionAsync`) ; `src/app/dashboard/audit/page.tsx` (section “Contestations utilisateur”).
- **Sérialisation Map/Date en DB**: Dexie stocke `trace` en `unknown`; selon runtime, les `Map` peuvent ne pas être persistées comme attendu. La page audit affiche correctement les `Map` *en mémoire*, mais une politique de sérialisation stable pourrait être nécessaire.

## Truth Table — Phase 6 (Adaptation) (preuve-based)

| Exigence Phase 6 | Statut | Preuves (fichiers) |
|---|---:|---|
| Contrat `ParameterDelta` strict (pas de `any`) | ✅ | `src/lib/adaptationMemory.ts` (union discriminée `ParameterDelta`) |
| Contrat `adaptationHistory.change` explicite | ✅ | `src/lib/adaptationMemory.ts` (`PersistedAdaptationChange`) ; garde-fous: `src/lib/adaptationController.ts` (`isPersistedAdaptationChange`) |
| Application paramètres type-safe (pas d’indexing unsafe) | ✅ | `src/lib/adaptationController.ts` (`applyParameters` switch) |
| Reset adaptation → enregistre historique | ✅ | `src/lib/adaptationController.ts` (`resetAdaptationToDefaults`) |
| Rollback (delta inversé) sur paramètres persistés | ✅ | `src/lib/adaptationController.ts` (`rollbackAdaptation`, `invertDelta`) |
| Rollback automatique si dégradation BrainQuality | ✅ | `src/lib/phase6Implementation.ts` (comparaison `brainQualityBefore/After` + `rollbackAdaptation`) |
| Pruning hebdo des signaux (déterministe) | ✅ | `src/lib/adaptationController.ts` (`setupAdaptationPruning`) |
| Export-before-prune via snapshots Dexie | ✅ | `src/lib/adaptationController.ts` (`exportEncryptedArchive`) ; `src/lib/database/index.ts` (`snapshots`) |
| UI Transparence: panneau lit Dexie (history + snapshots) | ✅ | `src/lib/adaptationTransparency.ts` ; `src/components/settings/settings-form.tsx` (state typé via `ReturnType<typeof AdaptationPanel>`) |
| Pipeline UI↔DB↔Engine: progress/quality sur données réelles | ✅ | `src/lib/phase6Implementation.ts` (map DB → `computeProgressMetrics`) ; `src/lib/brainQuality.ts` |
| `modeTransitions` persistants + branchés à BrainQuality | ✅ | `src/lib/database/index.ts` (schema v8 + `modeTransitions`, helpers) ; `src/lib/phase6Implementation.ts` (utilise `getModeTransitionsByPeriod`) |
| Élimination des `any` Phase 6 (contrats + tests) | ✅ | `src/lib/adaptationController.ts`, `src/lib/adaptationTransparency.ts`, `src/lib/adaptationAggregator.ts`, `src/lib/adaptationValidation.ts`, `src/lib/adaptationRollback.ts`, `src/lib/adaptationGovernance.ts` |
| Tests non-régression sur règles/controller | ✅ | `src/lib/__tests__/adaptationRules.test.ts` ; `src/lib/__tests__/adaptationController.test.ts` |

## Phase 6 — Release checklist (bloquants/preuves)
- ☐ `npm run typecheck` OK
- ☐ `npm run lint` OK
- ☐ `npm run test` OK
- ☐ Vérifier migration Dexie v8 en environnement réel (création table `modeTransitions`)
- ☐ Vérifier UI Settings → section Adaptation: affichage paramètres/historique/exports
- ☐ Vérifier rollback manuel (UI) et rollback auto (baisse qualité) sur données réelles
- ☐ Vérifier export-before-prune crée des `snapshots` consultables

## Résumé audit/implémentation — Phase 6 (preuve-based)
- **Objectif**: passer d’un proto “adaptation” à un système local-first gouverné, observable, rollbackable, sans `any`.
- **Contrats durcis**:
  - `ParameterDelta` devenu une union discriminée → suppression des écritures `next[key] = ...` non sûres.
  - `PersistedAdaptationChange` centralise le payload stocké dans `adaptationHistory.change`.
- **Pipeline DB↔Engine stabilisé**:
  - Calcul progress/quality branché sur données Dexie (sessions/overrides/tasks) plutôt que des placeholders.
  - Ajout `modeTransitions` persistant (Dexie v8) + wiring dans `computeBrainQuality`.
- **UI Transparence**:
  - `AdaptationPanel` lit Dexie (history + snapshots) et l’état UI est strictement typé côté Settings.
- **Non-régression**:
  - Tests Phase 6 durcis pour éviter retour de `any` et vérifier rollback + règles.
