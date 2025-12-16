# Phase 3.1 — Contrat du Cerveau Décisionnel

## Objectif : verrouiller juridiquement, techniquement et logiquement ce que le cerveau PEUT et NE PEUT PAS faire.
Si ce contrat est solide → le système est SOTA.
S’il est flou → dérive autoritaire garantie.

## RÉSUMÉ BRUTAL

Le cerveau n’optimise pas → il protège et rend possible l’action.

Le cerveau n’interprète pas → il applique des invariants.

Le cerveau n’apprend pas librement → il obéit à des plafonds.

Tout ce qui n’est pas explicitement autorisé est interdit par défaut.

Faiblesse classique des systèmes concurrents :
👉 ils n’ont pas de contrat formel → l’IA finit par décider.

## 3.1.1 — RÔLE FORMEL DU CERVEAU (NON NÉGOCIABLE)
### Ce que le cerveau FAIT

Élimine les tâches dangereuses

Empêche la surcharge

Expose l’impossible

Arbitre les conflits logiques, pas humains

Explique ses décisions après coup

### Ce que le cerveau NE FAIT PAS (INTERDICTIONS ABSOLUES)

❌ Décider ce qui est important

❌ Choisir "la meilleure" tâche

❌ Motiver l’utilisateur

❌ Optimiser la performance brute

❌ Modifier les priorités utilisateur

❌ Deviner l’intention

### Verdict : VRAI à 100%
### Source/faits :

Systèmes critiques (aviation, médical) → séparation perception / décision

Calm Technology (Weiser) → réduction de charge, pas optimisation

Échecs IA productivité (Notion AI, Motion) → sur-prescription

## 3.1.2 — CONTRAT D’ENTRÉE (BrainInput)
### Définition STRICTE
```typescript
type BrainInput = {
  tasks: Task[];

  userState: {
    energy: "low" | "medium" | "high";
    stability: "volatile" | "stable";
    linguisticFatigue: boolean;
  };

  temporal: {
    currentTime: Timestamp;
    availableTime: Minutes;
    timeOfDay: "morning" | "afternoon" | "evening";
  };

  budget: {
    daily: DailyCognitiveBudget;
    session: SessionBudget;
  };

  constraints: TemporalConstraint[];
  history: BehaviorHistory;
};
```

### Analyse des failles évitées

Sans availableTime → illusion de faisabilité

Sans linguisticFatigue → surcharge explicative

Sans sessionBudget → micro-épuisement invisible

### Verdict : VRAI (robuste)

## 3.1.3 — CONTRAT DE SORTIE (BrainOutput) 🔴 CRITIQUE
### Contrat STRICT (compile-time)
```typescript
type BrainOutput = {
  session: {
    allowedTasks: Task[];
    maxTasks: number;
    estimatedDuration: Minutes;
    budgetConsumed: number;
  };

  rejected: {
    tasks: Task[];
    reasons: Map<TaskID, RejectionReason>;
  };

  mode: {
    current: SystemMode;
    reason: string;
    changedFrom?: SystemMode;
  };

  warnings: Warning[];

  explanations: {
    summary: string;
    perTask: Map<TaskID, string>;
  };

  // INVARIANTS DE PURETÉ
  guarantees: {
    usedAIdecision: false;
    inferredUserIntent: false;
    optimizedForPerformance: false;
    overrodeUserChoice: false;
  };
};
```

### Pourquoi c’est critique

Sans guarantees :

un dev ajoute finalScore

un PM ajoute aiSuggestionOverride

en 3 mois → système autoritaire

### Verdict : VRAI – indispensable

### Sources/faits :

DARPA XAI (2020) — traçabilité par contrat explicite

Accidents ML (Uber ATG) — logique opaque

Software safety patterns — "deny by default"

## 3.1.4 — INVARIANTS FORMELS (Phase 3)
### Invariants cœur

I — Le cerveau ne choisit jamais à la place de l’utilisateur

II — Toute tâche proposée doit être faisable aujourd’hui

III — La surcharge globale est prioritaire sur toute urgence

IV — L’impossible doit être exposé, jamais masqué

V — Toute décision doit être explicable

XII — Budget cognitif journalier inviolable

XVI — Budget de complexité décisionnelle

XVII — Budget d’explication (anti-saturation)

## 3.1.5 — PRODUCTIVITÉ SANS FRUSTRATION (POINT QUE TU AS RAISON DE SOULIGNER)
### Faux dilemme à détruire

❌ "Protection = limiter la productivité"
➡️ Faux.

### Vérité brute

La productivité réelle = résultats terminés

La surcharge = illusion de productivité

### Mécanisme clé (SOTA)

Le cerveau n’empêche pas d’agir

Il empêche d’agir sur trop de fronts

Il priorise la finitude, pas le confort

### Exemples :

Tâches professionnelles imposées → CHAOS mode, choix conscient

Deadlines externes → exposées, pas filtrées

Résultats tangibles → favorisés via :

tâches déjà commencées

deadlines proches

coût cognitif minimal

👉 Tu n’as pas un système "bien-être"
👉 Tu as un régulateur de production soutenable

### Verdict : PRODUCTIF + ÉTHIQUE = compatible

## 3.1.6 — QUESTIONS CHALLENGANTES (RÉPONSES)
### Q1 — Le cerveau peut-il refuser toute tâche ?

OUI.
Quand : budget = 0, stabilité volatile, impossible global.
Message : factuel, non jugeant.

### Q2 — Peut-il dire qu’une journée est impossible ?

OUI, sans jugement.
"Contraintes incompatibles détectées. Choix conscient requis."

### Q3 — Peut-il bloquer même si l’utilisateur insiste ?

NON.
Mais il log et protège demain (dette énergétique).

---

## FAIBLESSES ACTUELLES DE LA PHASE 3
### Faiblesse 1 — Confusion entre "interdiction" et "verrou"

Faux raisonnement implicite actuel :

"Si c'est interdit, c'est bloqué."

❌ Faux.

Dans un système SOTA :

Interdit ≠ impossible

Interdit = nécessite une action consciente de l'utilisateur

👉 Aujourd'hui, Phase 3 bloque trop tôt, au lieu de déplacer la responsabilité proprement.

### Faiblesse 2 — Productivité mal définie

Actuellement, la Phase 3 protège très bien…
mais ne distingue pas assez :

Productivité subie (travail imposé, deadlines externes)

Productivité choisie (objectifs personnels, projets long terme)

👉 Les deux ne doivent PAS être traitées pareil.

### Faiblesse 3 — Interdictions "absolues" mal catégorisées

Certaines interdictions sont :

✅ Fondamentales (non négociables)

⚠️ Contextuelles

❌ Trop dogmatiques

Elles sont mélangées. C'est une erreur.

## CORRECTION SOTA : INTERDICTIONS À 3 NIVEAUX
### NIVEAU 1 — INTERDICTIONS FONDATION (NON NÉGOCIABLES)

Ces règles ne doivent JAMAIS être assouplies.

Pourquoi ?

Parce qu'elles protègent contre la dérive autoritaire et la manipulation.

#### Liste :

❌ Le cerveau ne décide jamais à la place de l'utilisateur

❌ Le cerveau ne modifie pas les priorités utilisateur

❌ Le cerveau ne cache jamais l'impossible

❌ Le cerveau ne ment jamais sur l'état réel (budget, temps, énergie)

❌ Le cerveau n'optimise pas pour "engagement" ou "dopamine"

#### Sources / faits :

DARPA XAI (2020) — explicabilité obligatoire

Calm Technology — priorité à la vérité, pas au confort

Échecs IA productivité (Motion, Reclaim) — sur-prescription

#### Verdict : VRAI — à garder strict

### NIVEAU 2 — INTERDICTIONS CONDITIONNELLES (ASSOUPLISSABLES)

👉 C'est ici que tu avais raison.

Ces règles ne doivent pas être absolues.

#### Exemple clé

❌ "Le cerveau ne choisit jamais la meilleure tâche"

➡️ Correction SOTA :

Le cerveau ne choisit pas sans consentement explicite.

#### Implémentation
```typescript
DecisionPolicy {
  mode: "strict" | "assisted" | "emergency",
  userConsent: boolean
}
```

- strict : élimination uniquement

- assisted : suggestions ordonnées, jamais forcées

- emergency : tri brutal quand contraintes impossibles

👉 Productivité externe (travail, deadlines)
→ assisted ou emergency autorisé

👉 Productivité personnelle
→ strict par défaut

### NIVEAU 3 — INTERDICTIONS UX (À RELÂCHER)

Celles-ci créent de la frustration inutile si trop strictes.

#### Exemples à assouplir

❌ "Max 5 tâches quoi qu'il arrive"
❌ "Refus total si budget < 20%"

#### Correction SOTA

Cap dynamique, pas fixe

Basé sur :

- type de tâche

- origine (imposée vs choisie)

- durée réelle

- état de l'utilisateur

```typescript
maxTasks = clamp(
  base = 3,
  modifiers = [
    imposedTasksBonus,
    lowEffortBonus,
    emergencyModeBonus
  ],
  hardLimit = 9
)
```

👉 Tu ne bloques pas
👉 Tu rends le coût explicite

## PRODUCTIVITÉ RÉELLE (PAS BIEN-ÊTRE COSMÉTIQUE)

Tu as raison sur un point fondamental :

Une app qui protège mais ne produit rien est inutile.

### Redéfinition correcte

Productivité = tâches terminées + résultats concrets

Le cerveau doit donc :

Favoriser la finitude

Réduire le switching

Protéger l'énergie long terme, pas la journée idéale

### Ajout nécessaire (Phase 3)
#### TaskOutcomeTracking
```typescript
TaskOutcome {
  taskId,
  completed: boolean,
  actualDuration,
  perceivedEffort,
  tangibleResult: boolean
}
```

👉 Les tâches à résultat tangible sont priorisées naturellement, sans IA magique.

## FLEXIBILITÉ UTILISATEUR (SANS CHAOS)
### Principe SOTA

Tout peut être outrepassé,
mais jamais gratuitement.

Override = autorisé
Override = traçable
Override = coût explicite

```typescript
OverrideEvent {
  invariantBroken,
  userReason,
  estimatedDebt
}
```

👉 Tu respectes la liberté
👉 Tu refuses la naïveté

## QUESTIONS CHALLENGANTES (RÉPONSES)
### 1️⃣ Faut-il parfois laisser l'utilisateur se surcharger ?

OUI.
Mais en lui montrant le coût futur.

### 2️⃣ Peut-on forcer la productivité externe ?

NON.
Mais on peut exposer l'urgence sans filtrer.

### 3️⃣ Bien-être vs résultats ?

Faux dilemme.
Le vrai conflit est :

court terme vs soutenable

## VERDICT FINAL
| Critère | Verdict |
|---------|---------|
| Rigidité actuelle | ❌ Trop forte |
| Dérive permissive | ❌ Inacceptable |
| Flexibilité contrôlée | ✅ OBLIGATOIRE |
| Productivité tangible | ✅ À renforcer |
| Éthique | ✅ Conservée |

👉 Phase 3 doit évoluer, pas être détruite.
👉 On assouplit les règles d'usage, pas les fondations.

---

# PHASE 3.2 — CERVEAU DÉCISIONNEL (VERSION SOTA ÉQUILIBRÉE)

## Objectif de la Phase 3.2

👉 Rendre le cerveau à la fois protecteur ET productif,
👉 Introduire de la flexibilité contrôlée,
👉 Permettre des résultats tangibles sans manipulation,
👉 Corriger les rigidités excessives identifiées en Phase 3.1,
👉 Sans jamais violer les fondations éthiques.

## RÉSUMÉ & FAIBLESSES CORRIGÉES
### Problèmes identifiés en Phase 3.1

Rigidité excessive → frustration potentielle

Confusion entre "interdire" et "empêcher"

Productivité externe (travail imposé) sous-traitée

Absence de niveaux de liberté explicites

### Correction Phase 3.2

👉 Architecture à verrous progressifs, pas des murs.
👉 Responsabilité déplacée vers l'utilisateur, pas supprimée.
👉 Productivité mesurée par résultats, pas par confort.

## 3.2.1 — NOUVEAU CONCEPT CENTRAL : NIVEAUX DE CONTRÔLE
### Hypothèse

Un système SOTA ne doit pas être monolithique.

Faux

Un seul mode "éthique" pour tous les cas

Vrai

Un noyau invariant + des politiques de décision explicites

### DecisionPolicy (NOUVEAU — CENTRAL)
```typescript
DecisionPolicy {
  level: "STRICT" | "ASSISTED" | "EMERGENCY",
  consentRequired: boolean,
  overrideCostVisible: true
}
```

### Règles

STRICT (défaut)
→ élimination uniquement
→ aucune recommandation finale
→ idéal pour tâches personnelles / long terme

ASSISTED
→ tri explicite mais non forcé
→ ordre expliqué
→ idéal pour travail, obligations, deadlines

EMERGENCY
→ réalité brute
→ exposition de l'impossible
→ choix forcé par l'utilisateur
→ aucune optimisation cachée

📌 Le cerveau ne choisit JAMAIS le mode seul.
Il le propose, l'utilisateur valide.

### Verdict

Éthique respectée

Productivité permise

Frustration évitée

Verdict : VRAI (confiance élevée)

## 3.2.2 — PRODUCTIVITÉ = RÉSULTATS TANGIBLES
### Problème initial

La Phase 3 protégeait bien, mais ne favorisait pas assez la finitude.

### Ajout : TaskOutcomeTracking (OBLIGATOIRE)
```typescript
TaskOutcome {
  taskId,
  completed: boolean,
  actualDuration,
  perceivedEffort,
  tangibleResult: boolean, // LIVRABLE, ACTION TERMINÉE, ENVOI FAIT
}
```

### Pourquoi ?

Une tâche "bien-être" ≠ tâche "résultat"

Les deux ont leur place

Mais elles ne doivent pas être arbitrairement égalisées

### Règle SOTA

À contraintes égales,
une tâche à résultat tangible est priorisée sans scoring opaque

### Sources / faits

Zeigarnik Effect — tâches terminées libèrent charge mentale

GTD (Allen) — "Outcome clarity" réduit stress

Nielsen Norman Group — perception d'utilité liée à complétion visible

### Verdict : VRAI

## 3.2.3 — FLEXIBILITÉ UTILISATEUR SANS CHAOS
### Erreur à éviter

❌ Bloquer l'utilisateur "pour son bien"

### Correction

👉 Tout est overridable, mais jamais gratuitement

### OverrideEvent (NOUVEAU)
```typescript
OverrideEvent {
  invariantTouched,
  userReason,
  estimatedCognitiveDebt,
  acknowledged: boolean
}
```

### Règles

Le cerveau autorise

Le système trace

Le coût est visible

Aucune sanction automatique

📌 Liberté sans illusion

### Sources / faits

Behavioral economics — coût explicite réduit abus

Self-determination theory — autonomie > contrainte

Échecs des apps trop coercitives (désinstallations massives)

### Verdict : VRAI

## 3.2.4 — PRODUCTIVITÉ EXTERNE VS PERSONNELLE
### Nouvelle distinction (CRITIQUE)
```typescript
TaskOrigin = "IMPOSED" | "SELF_CHOSEN"
```

### Règles

IMPOSED

plus tolérante aux overrides

modes ASSISTED / EMERGENCY autorisés

SELF_CHOSEN

protection plus forte

STRICT par défaut

📌 Le cerveau ne moralise pas, il contextualise.

### Failles analysées

Ignorer les obligations externes = irréaliste

Tout protéger = inefficace

### Verdict : PARTIEL avant, CORRIGÉ maintenant

## 3.2.5 — CAPS DYNAMIQUES (FIN DU "MAX 5" DOGMATIQUE)
### Ancienne règle

❌ max 5 tâches fixes

### Nouvelle règle SOTA
```typescript
maxTasks = clamp(
  base = 3,
  modifiers = [
    imposedTasksBonus,
    lowEffortBonus,
    emergencyModeBonus
  ],
  hardLimit = 9
)
```

### Invariant

Hard limit existe toujours

Mais il est contextuel, pas arbitraire

### Sources / faits

Cognitive load theory — quantité ≠ coût

Studies on task batching — micro-tâches peu coûteuses

UX research — caps rigides perçus comme punitifs

### Verdict : VRAI

## 3.2.6 — CE QUI RESTE STRICT (NON NÉGOCIABLE)

Ces règles ne changent PAS :

Pas de décision à la place de l'utilisateur

Pas de priorité modifiée en silence

Pas d'IA prescriptive

Pas de dissimulation de l'impossible

Pas d'optimisation pour l'engagement

📌 Fondations intactes

## QUESTIONS CHALLENGANTES — RÉPONSES
### Q1 — Peut-on être productif sans frustrer ?

👉 Oui, si le coût est visible et le choix conscient.

### Q2 — Peut-on laisser l'utilisateur se surcharger ?

👉 Oui, mais sans jamais lui mentir.

### Q3 — Bien-être vs résultats ?

👉 Faux conflit.
La vraie opposition est court terme vs soutenable.