# PHASE 1 — LE CERVEAU DE KAIRUFLOW (FOUNDATION ABSOLUE)

## Objectif
Construire un moteur décisionnel déterministe, explicable, stable, testable SANS IA.

👉 Si cette phase est ratée → tout le reste est instable, même avec les meilleurs modèles.

---

## 1. DÉFINITION DU RÔLE DU CERVEAU (CLARIFICATION RADICALE)

### Faux paradigme (à rejeter)
"KairuFlow décide quoi faire aujourd'hui"

❌ Faux.
👉 L'utilisateur reste souverain.

### Paradigme correct
"KairuFlow protège l'utilisateur de la surcharge et du chaos"

#### Mission du cerveau :
- Filtrer
- Contraindre
- Équilibrer
- Rendre explicite
- Empêcher l'auto-sabotage

---

## 2. ENTRÉES / SORTIES — CONTRAT FORMEL

### Entrées autorisées (strictes)
- Énergie perçue (self-report)
- Intention (optionnelle)
- Tâches existantes (structurées)
- Historique comportemental (faits, pas interprétations)
- Contexte temporel (jour, heure, deadlines)

⚠️ Aucune entrée floue
⚠️ Aucune "intuition magique"

### Sorties autorisées
- Playlist 3–5 tâches MAX
- Ordre implicite (pas impératif)
- Explication courte (optionnelle)
- Avertissements silencieux (overload, pattern)

---

## 3. INVARIANTS ABSOLUS (LE CŒUR DE LA VÉRITÉ)

Ces règles ne peuvent JAMAIS être violées, même par l'IA.

### Invariants cognitifs
- Jamais plus de 5 tâches
- Toujours au moins 1 tâche faisable <15 min
- Charge totale ≤ capacité énergétique du jour
- Pas de tâche "haute énergie" si énergie basse
- Une playlist doit être terminable à 70% minimum

👉 Si une règle est violée → playlist invalide

---

## 4. MODÈLE D'ÉNERGIE (CLÉ DIFFÉRENCIANTE)

### Faux modèle courant
énergie = humeur
❌ Faux

### Modèle correct (simplifié mais robuste)
```
EnergyState = {
  level: low | medium | high
  stability: volatile | stable
}
```

#### Pourquoi ?
Une énergie "haute mais volatile" ≠ "haute stable"
Ça change le type de tâches acceptables

---

## 5. CAPACITÉ JOURNALIÈRE (ANTI-HUSTLE SYSTEM)

### Erreur classique
Compter en nombre de tâches

### Modèle correct
```
DailyCapacity = sum(task.cost)
task.cost = effort * energyMismatchFactor
```

#### Exemple :
- tâche focus (L) + énergie basse → coût x2.5
- tâche admin (S) + énergie basse → coût x0.8

👉 La même tâche n'a PAS le même coût chaque jour.

---

## 6. SCORE — MAIS PAS N'IMPORTE COMMENT

### Règle clé
Le score sert à trier, pas à décider seul.

### Formule canonique (verrouillée)
```
score =
  0.40 * energyAlignment
+ 0.20 * urgency
+ 0.15 * impact
+ 0.10 * effortBalance
+ 0.10 * behavioralPattern
+ 0.05 * diversity
```

⚠️ Ces poids :
- sont versionnés
- testés
- documentés
- jamais changés "au feeling"

---

## 7. SÉLECTION — ALGORITHME, PAS IA

### Étapes STRICTES
1. Trier par score
2. Injecter 1 quick win
3. Vérifier charge totale
4. Vérifier diversité
5. Vérifier invariants
6. Si échec → fallback

### Fallbacks prévus
- Énergie trop basse → 1 tâche + repos
- Trop de contraintes → mode "survie"
- Historique incohérent → reset doux

---

## 8. CAS SOMBRES / INVISIBLES (SOUVENT OUBLIÉS)

Cas à anticiper DÈS MAINTENANT :
- Utilisateur ment sur son énergie
- Utilisateur n'accomplit jamais rien
- Utilisateur surcharge volontairement
- Utilisateur anxieux (paralysie)
- Utilisateur perfectionniste
- Journées impossibles (10 urgences réelles)

👉 Le cerveau doit survivre à ça.

---

## 9. CE QUE L'IA N'A PAS LE DROIT DE FAIRE

| Action | Autorisé ? |
|--------|------------|
| Proposer | ✅ |
| Expliquer | ✅ |
| Décomposer | ✅ |
| Décider | ❌ |
| Forcer | ❌ |
| Modifier l'historique | ❌ |
| Changer les règles | ❌ |

---

## 10. TESTS OBLIGATOIRES (NON NÉGOCIABLE)

Avant toute IA :
- [ ] Tests unitaires sur scoring
- [ ] Tests de journées extrêmes
- [ ] Tests énergie incohérente
- [ ] Tests surcharge massive
- [ ] Tests utilisateur hostile

👉 Si le cerveau passe ces tests sans IA → il est sain.

---

## VERDICT PHASE 1

### État actuel de KairuFlow (vérité brute)
- Architecture : bonne intuition
- IA : trop centrale dans la narration
- Algorithme : pas encore assez formalisé
- Invariants : partiellement implicites
- Risque principal : complexité non maîtrisée

### Ce qu'on construit
Un moteur décisionnel déterministe et explicable qui protège l'utilisateur de la surcharge cognitive.

### Pourquoi
Sans fondation solide, l'IA devient une béquille instable plutôt qu'un amplificateur de productivité.

### Ce qui peut casser
- Surcharge d'entrées floues
- IA prenant des décisions non explicables
- Violation des invariants cognitifs
- Non-respect des limites énergétiques

### Comment on verrouille
- Contrat formel d'entrées/sorties
- Invariants absolus codifiés
- Algorithmes déterministes testés
- Processus de validation rigoureux

### Ce qui est non négociable pour une version finale SOTA
- Explicabilité totale des décisions
- Respect absolu des limites cognitives
- Stabilité face aux cas extrêmes
- Absence de prise de décision par l'IA

---

## Mon analyse 🔍

Tu viens de poser les fondations d'une architecture mentale remarquable.
Ce document articule quelque chose que très peu de systèmes de productivité comprennent : la différence entre automatiser des décisions et protéger l'humain du chaos.

### Ce qui est excellent ✨

1. **Le renversement paradigmatique**
"KairuFlow protège l'utilisateur de la surcharge et du chaos"
C'est la bonne vision. Pas un assistant qui décide, mais un système immunitaire cognitif qui filtre la toxicité informationnelle.

2. **Les invariants comme colonne vertébrale**
Les 5 règles non-négociables sont exactement ce qu'il faut : des garde-fous algorithmiques qui empêchent le système de devenir un tyran de la productivité.

3. **La distinction énergie/capacité**
```
task.cost = effort × energyMismatchFactor
```
Cette intuition est profonde. La plupart des apps traitent les tâches comme des constantes. Toi, tu les traites comme des variables contextuelles.

4. **Les cas sombres**
Le fait que tu anticipes "utilisateur ment", "paralysie anxieuse", "perfectionniste" montre une maturité rare. Beaucoup de produits sont conçus pour un utilisateur idéal qui n'existe pas.

### Les tensions à résoudre ⚠️

1. **Le paradoxe du scoring déterministe**
Tu veux un système explicable, mais avec 6 dimensions pondérées, les utilisateurs ne comprendront jamais pourquoi tâche A > tâche B dans des cas limites.

💡 **Suggestion** : Ajoute une couche "explication narrative" qui traduit le score en langage humain :
"Cette tâche est suggérée car elle correspond à ton énergie actuelle"
vs "Score: 0.73" ← personne ne comprend

2. **L'énergie auto-déclarée est fragile**
"Utilisateur ment sur son énergie"
Si le système repose sur du self-report, il sera gamed. Il faut des signaux corroborants :
- Heure de la journée (corrélation énergie)
- Historique de complétion (proxy d'énergie réelle)
- Vélocité de décision dans l'app

3. **La rigidité vs l'émergence**
Tu rejettes l'IA dans la décision (correct), mais tu pourrais la garder pour détecter des patterns invisibles :
"Tu termines toujours mieux les tâches créatives le matin"
"Tes estimations de durée sont systématiquement × 1.4 sur ce type de tâche"

→ L'IA comme analytique, pas comme prescriptive.

### Critiques constructives 🎯

1. **Les poids du scoring semblent arbitraires**
```
0.40 * energyAlignment + 0.20 * urgency + ...
```
D'où viennent ces chiffres ? Il faudra :
- Soit les calibrer empiriquement (A/B testing)
- Soit les rendre personnalisables (profils utilisateur)

2. **Manque : le coût du changement de contexte**
Tu comptes `sum(task.cost)`, mais pas le coût de switch entre tâches hétérogènes :
- Admin → Code → Meeting → Admin = épuisant
- Admin → Admin → Admin = fluide

3. **Le mode "survie" est sous-spécifié**
"Si énergie trop basse → 1 tâche + repos"
Mais "repos" = quoi ? Si tu ne le structures pas, l'utilisateur va scroller Instagram. Propose du repos actif :
- 10 min marche
- 5 min respiration guidée
- Micro-tâche satisfaction (ranger 1 tiroir)

### Ce qui manque (mais pas critique Phase 1) 🧩

- **Feedback loop** : Comment le système apprend-il que l'utilisateur a triché / échoué / réussi ?
- **Interruptions** : Une urgence arrive à 15h → comment la playlist s'ajuste ?
- **Multi-jours** : Une tâche trop grosse pour aujourd'hui → découpage automatique ?
- **Collaboration** : Tâches partagées / deadlines imposées externes ?

### Verdict global : 8.5/10 🎖️

**Forces :**
- Architecture mentale solide
- Invariants clairs
- Conscience des biais utilisateur
- Refus de la complexité gratuite

**Faiblesses :**
- Scoring pas encore empirique
- Self-report fragile
- Manque signaux comportementaux passifs

### Recommandation pour Phase 1.1 ✅

Oui, mais dans cet ordre précis :
1. États utilisateurs formels (énergie, stress, flow)
2. Diagramme logique (flowchart de sélection)
3. Cas extrêmes (journées impossibles, utilisateur hostile)
4. Tables de vérité (tous les scénarios invariants)
5. Pseudo-code (en dernier, car les 4 premiers vont le modifier)

---

## Points d'Attention (Le "Diable est dans les détails")

Même si ce document est excellent, voici deux défis pour la Phase 1.1 :

### A. La définition de la "Stabilité" (Section 4)

Tu introduis `stability: volatile | stable`.

**Le défi** : Comment l'utilisateur saisit-il ça ? On ne peut pas lui demander "Êtes-vous volatile ce matin ?".

**Suggestion** : C'est peut-être la seule variable qui doit être déduite de l'historique récent (variance des check-ins sur 3 jours) plutôt que demandée explicitement. Ou alors, c'est une question simple : "Votre énergie risque-t-elle de chuter brutalement ?" (Oui/Non).

### B. La gestion du "Mensonge" (Section 8)

**Cas** : Utilisateur surcharge volontairement.

C'est le cas classique : L'algo dit "3 tâches", l'utilisateur dit "Non, je dois en faire 10".

**La réponse du système** : Il ne faut pas bloquer l'utilisateur (frustration), mais il faut marquer le coup.

**Mécanique suggérée** : Le "Mode Dette". "Ok, tu forces 10 tâches. Mais sache que tu empruntes de l'énergie à demain. Demain, ta capacité sera réduite de 20% par défaut."

---

## 🎯 CORRECTION FONDAMENTALE — TU AS RAISON

### Le problème que tu viens d'identifier

**Mon erreur conceptuelle :**
❌ "3-5 tâches par JOUR"
→ Rigide
→ Ignore les deadlines réelles
→ Crée de l'artificiel

**Ta vision (correcte) :**
✅ "3-5 tâches par MOMENT/SESSION"
→ Fluide
→ Respecte les contraintes temporelles
→ Permet progression réelle dans la journée

## NOUVEAU PARADIGME — PLAYLIST DYNAMIQUE

### Principe de base

Une journée = plusieurs SESSIONS
Chaque session = 3-5 tâches MAX
Si session terminée → nouvelle playlist

### Architecture révisée

┌─────────────────────────────────────┐
│         JOURNÉE (8h-22h)            │
├─────────────────────────────────────┤
│  SESSION 1 (9h-11h)                 │
│  → 3 tâches                         │
│  → Statut: terminé ✓                │
├─────────────────────────────────────┤
│  SESSION 2 (11h-13h)                │
│  → 4 tâches                         │
│  → Statut: en cours...              │
├─────────────────────────────────────┤
│  SESSION 3 (14h-17h)                │
│  → À générer après session 2        │
└─────────────────────────────────────┘

### RÈGLES DE SÉLECTION (RÉVISÉES)

#### 1. POOL DE TÂCHES ÉLIGIBLES

Le cerveau ne pioche QUE dans :

EligibleTasks = {
  TODAY: {
    deadline = aujourd'hui,
    scheduled = aujourd'hui,
    urgent = oui
  },

  OVERDUE: {
    deadline < aujourd'hui,
    non terminées
  },

  AVAILABLE: {
    pas de deadline,
    ou deadline > J+7,
    ET intentionnellement démarrées par user
  }
}

**Règle d'or :**
⚠️ Jamais toucher aux tâches J+2 ou plus SI :
- Il reste des tâches TODAY/OVERDUE
- User n'a pas explicitement demandé

#### 2. PRIORITÉ DE REMPLISSAGE (ORDRE STRICT)

1. OVERDUE (dette cognitive)
↓
2. TODAY avec deadline précise (15h, 17h...)
↓
3. TODAY sans heure mais avec date
↓
4. TODAY créées aujourd'hui
↓
5. AVAILABLE (seulement si capacité restante)

#### 6. GESTION DES CONTRAINTES TEMPORELLES

```
Task = {
  deadline: Date | null,
  scheduledTime: Time | null,  // "14h00"
  duration: Minutes,
  priority: low | medium | high | urgent
}
```

// Exemple cas complexe
```
{
  title: "Appel client",
  deadline: "2024-12-14",
  scheduledTime: "15h00",  // ⚠️ CONTRAINTE DURE
  duration: 30
}
```

**Conséquence :**
Cette tâche BLOQUE la session 14h-16h
Le cerveau DOIT construire autour
Impossible de la bouger

## NOUVEAU MODÈLE : SESSION-BASED PLANNING

### États possibles d'une session

| ÉTAT | DESCRIPTION |
|------|-------------|
| PLANNED | Playlist générée, pas commencée |
| IN_PROGRESS | Au moins 1 tâche démarrée |
| COMPLETED | Toutes tâches terminées |
| EXHAUSTED | User a arrêté avant la fin |
| BLOCKED | Contrainte externe (réunion...) |

### Algorithme de génération (SESSION)

```
def generate_session_playlist(
  user_energy: EnergyState,  
  current_time: Time,  
  available_time: Minutes,  
  existing_tasks: List[Task]
):

  # ÉTAPE 1 : Filtrer éligibilité temporelle  
  eligible = filter_by_temporal_eligibility(
    tasks=existing_tasks,  
    current_date=today(),  
    look_ahead_days=0  # ⚠️ Sauf si pool vide  
  )
  
  # ÉTAPE 2 : Injecter contraintes FIXES  
  fixed_tasks = [t for t in eligible if t.scheduledTime]  
  remaining_time = available_time - sum(t.duration for t in fixed_tasks)  
  
  # ÉTAPE 3 : Scorer tâches flexibles  
  flexible = [t for t in eligible if not t.scheduledTime]  
  scored = score_tasks(flexible, user_energy)  
  
  # ÉTAPE 4 : Remplir jusqu'à capacité  
  playlist = fixed_tasks.copy()  
  for task in scored:  
    if len(playlist) >= 5:  
      break  
    if sum(t.cost for t in playlist) + task.cost <= remaining_time:  
      playlist.append(task)  
  
  # ÉTAPE 5 : Vérifier invariants  
  validate_session_playlist(playlist)  
  
  return playlist
```

### CAS CRITIQUES À GÉRER

#### Cas 1 : Session terminée, mais 16h et énergie KO

**Options du cerveau :**

1. Proposer 1 micro-tâche (quick win)
2. Suggérer repos
3. Permettre stop journée

❌ NE PAS forcer nouvelle session

#### Cas 2 : User termine en 1h une session prévue 3h

**Action :**
✅ Féliciter
✅ Demander : "Nouvelle session ?"
✅ Si oui → régénérer avec énergie actuelle
❌ Ne pas auto-générer (respect autonomie)

#### Cas 3 : Tâche deadline 15h, mais user commence à 15h05

**Comportement :**
⚠️ Tâche passe en OVERDUE immédiatement
🔴 Alerte discrète : "Tâche X était prévue 15h"
✅ Reste dans playlist (ne disparaît pas)

#### Cas 4 : User n'arrive jamais à finir ses sessions

**Détection pattern :**

5 jours consécutifs avec <50% complétion

**Action du cerveau :**

1. Réduire playlist → 2-3 tâches
2. Augmenter proportion quick wins
3. Proposer décomposition des grosses tâches

### RÉVISION DES INVARIANTS

#### Anciens invariants (à modifier)

- Jamais plus de 5 tâches par JOUR
- Charge totale ≤ capacité énergétique du JOUR

#### Nouveaux invariants (ajoutés)

- Jamais plus de 5 tâches par SESSION
- Charge totale ≤ capacité énergétique de la SESSION
- Jamais toucher J+2 si reste du J ou J-1
- Contraintes horaires = non-négociables
- Si session incomplete → ne pas punir next session
- Overdue = priorité absolue sur available
- User peut TOUJOURS skip une session

### MÉTRIQUES CLÉS (POUR TESTER)

```
SessionMetrics = {
  completion_rate: 0.0-1.0,
  time_accuracy: actual_duration / estimated_duration,
  deadline_respect: % tâches faites avant deadline,
  overdue_accumulation: nombre tâches en retard,
  session_skip_rate: % sessions annulées
}
```

### EXEMPLE CONCRET (JOURNÉE RÉELLE)

#### Input utilisateur (matin 8h)

```
Tasks = [
  { title: "Rapport client", deadline: today, scheduledTime: null, duration: 90, priority: "high" },
  { title: "Call avec Jean", deadline: today, scheduledTime: "14h00", duration: 30, priority: "urgent" },
  { title: "Emails", deadline: null, duration: 20, priority: "low" },
  { title: "Code feature X", deadline: today+2, duration: 120, priority: "medium" },
  { title: "Prépa présentation", deadline: today+7, duration: 60, priority: "high" }
]
```

```
Energy = { level: "high", stability: "stable" }
```

#### SESSION 1 (9h-12h) — 180 min disponibles

**Playlist générée :**

1. ⏰ Rapport client (90 min) — deadline TODAY
2. 📧 Emails (20 min) — quick win
3. 🎯 30 min prep call 14h

**Total :** 140 min / 180 min
**Marge :** 40 min (buffer)

**Justification :**
- "Rapport client" = TODAY + high priority
- "Emails" = quick win pour momentum
- "Code feature X" = J+2 → IGNORÉ (trop tôt)
- "Prépa présentation" = J+7 → IGNORÉ (pas urgent)

#### SESSION 2 (13h-15h) — Bloquée par call 14h

- 13h00-14h00 : 1 slot libre
- 14h00-14h30 : ⚠️ CALL FIXE
- 14h30-15h00 : 1 slot libre

**Playlist :**

1. 🔧 Petites tâches admin (30 min)
2. ⏰ Call Jean (30 min) — FIXED
3. 📝 Notes post-call (20 min)

#### SESSION 3 (15h30-18h) — Si sessions 1+2 finies

```
Energy update = { level: "medium", stability: "stable" }
```

**Playlist :**

1. 💻 Code feature X (120 min)

**→ Maintenant éligible car :**
- Sessions TODAY terminées
- Deadline J+2 = assez proche
- Énergie suffisante pour focus

**OU (si énergie basse) :**

1. 📋 Prep présentation (60 min)

**→ Moins intense**
**→ Permet progression J+7**

### VERDICT : ARCHITECTURE CORRIGÉE

| Aspect | Avant | Après |
|--------|-------|-------|
| Granularité | Jour | Session |
| Flexibilité | Rigide | Adaptative |
| Deadlines | Ignorées | Respectées |
| Progression | Bloquée | Continue |
| Réalisme | Faible | Élevé |

### PHASE 1.1 RÉVISÉE — PROCHAINES ÉTAPES

1. Formaliser les états de session
2. Définir règles d'éligibilité temporelle
3. Algorithme de sélection session-based
4. Gestion des contraintes horaires fixes
5. Fallbacks pour sessions incomplètes

✅ PARFAIT — ARCHITECTURE FINALE CLARIFIÉE

## MODE HYBRIDE + VISION JOURNÉE COMPLÈTE

### 1. FONCTIONNEMENT HYBRIDE (OPTION C)

#### Comportement du système

┌─────────────────────────────────────────┐
│  SESSION TERMINÉE                       │
├─────────────────────────────────────────┤
│  ✓ 3/3 tâches complétées                │
│  ⏱️  Temps restant: 4h30                 │
│                                         │
│  💡 Suggestion intelligente             │
│  ┌───────────────────────────────────┐ │
│  │ "Session suivante prête"          │ │
│  │                                   │ │
│  │ 🎯 3 tâches • ~2h • Énergie OK    │ │
│  │                                   │ │
│  │ [Voir] [Démarrer] [Plus tard]    │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘

#### Règles de suggestion

```
SuggestionTriggers = {

  // ✅ Suggère automatiquement SI :
  auto_suggest: {
    session_completed: true,
    remaining_time: > 60 minutes,
    user_energy: not "exhausted",
    pending_tasks: count > 0,
    time_of_day: < 19h00
  },

  // ⏸️ NE suggère PAS SI :
  no_suggest: {
    user_marked: "need_break",
    completion_rate_today: < 40%,  // Pattern fatigue
    last_3_sessions: all_incomplete,
    time_of_day: > 19h00
  },

  // 🔔 Rappel discret SI :
  gentle_reminder: {
    user_ignored_suggestion: true,
    time_passed: > 30 minutes,
    urgent_task_waiting: true
  }
}
```

### 2. VUE JOURNÉE COMPLÈTE (PLANNING ANTICIPÉ)

#### Interface principale

┌──────────────────────────────────────────────────┐
│  AUJOURD'HUI • Mercredi 14 déc • ⚡ Énergie Haute│
├──────────────────────────────────────────────────┤
│                                                  │
│  📊 VISION JOURNÉE                               │
│  ┌────────────────────────────────────────────┐ │
│  │                                            │ │
│  │  9h-12h   SESSION 1  ✓ Terminée           │ │
│  │  ├─ Rapport client (90m)                  │ │
│  │  ├─ Emails (20m)                          │ │
│  │  └─ Prep call (30m)                       │ │
│  │                                            │ │
│  │  13h-15h  SESSION 2  ▶ En cours (2/3)     │ │
│  │  ├─ Admin (30m) ✓                         │ │
│  │  ├─ Call Jean (30m) ⏰ 14h00 FIXE         │ │
│  │  └─ Notes (20m) ⏳                         │ │
│  │                                            │ │
│  │  15h30-18h SESSION 3  💡 Suggérée         │ │
│  │  ├─ Code feature X (120m)                 │ │
│  │  ├─ Review PR (30m)                       │ │
│  │  └─ Quick win restant (15m)               │ │
│  │                                            │ │
│  │  🌙 Soirée libre                          │ │
│  │                                            │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  📈 Stats jour : 6/9 tâches • 4h30 restantes    │
│                                                  │
│  [⚙️ Régénérer journée] [📅 Voir semaine]       │
└──────────────────────────────────────────────────┘

### 3. GÉNÉRATION INTELLIGENTE DE LA JOURNÉE

#### Moment de génération

```
DayPlanningTriggers = {

  // Au réveil (ou première ouverture)
  morning_generation: {
    time: "première ouverture du jour",
    scope: "toutes les sessions potentielles",
    mode: "prévisionnel"
  },

  // Après chaque session
  adaptive_regeneration: {
    trigger: "session complétée",
    scope: "sessions restantes",
    mode: "ajustement réalité"
  },

  // Sur demande explicite
  manual_refresh: {
    trigger: "user clique 'Régénérer'",
    scope: "tout",
    mode: "reset complet"
  }
}
```

#### Algorithme de planification journée

```
def generate_daily_plan(
  user: User,
  date: Date,
  energy_forecast: EnergyForecast
):
  """
  Génère TOUTES les sessions de la journée
  Mais reste FLEXIBLE car ce n'est que prévisionnel
  """

  # ÉTAPE 1 : Collecter contraintes fixes  
  fixed_blocks = get_fixed_time_blocks(date)  
  # Ex: Réunions, RDV, tâches scheduledTime  
  
  # ÉTAPE 2 : Découper journée en slots disponibles  
  available_slots = calculate_free_slots(  
    day_start="08:00",  
    day_end="20:00",  
    fixed_blocks=fixed_blocks,  
    break_duration=15  # Entre chaque session  
  )  
  
  # ÉTAPE 3 : Prioriser tâches éligibles  
  tasks_pool = filter_eligible_tasks(  
    all_tasks=user.tasks,  
    date=date,  
    look_ahead=7  # Peut regarder J+7 pour remplir  
  )  
  
  prioritized = prioritize_tasks(  
    tasks=tasks_pool,  
    criteria={  
      "overdue": 1.0,      # Poids max  
      "deadline_today": 0.9,  
      "deadline_soon": 0.6,  
      "user_started": 0.5,  
      "high_priority": 0.4  
    }  
  )  
  
  # ÉTAPE 4 : Répartir dans sessions  
  sessions = []  
  for slot in available_slots:  
      
    # Énergie prévue pour ce créneau  
    slot_energy = energy_forecast.get(slot.time)  
      
    # Créer session  
    session = create_session(  
      time_slot=slot,  
      tasks_pool=prioritized, 
      energy=slot_energy,  
      max_tasks=5,  
      target_fill=0.75  # Ne pas surcharger  
    )  
    
    if session.tasks:  
      sessions.append(session)  
      
    # Retirer tâches utilisées du pool  
    prioritized = remove_scheduled(prioritized, session.tasks)  
    
  # ÉTAPE 5 : Vérifications finales  
  validate_daily_plan(sessions)  
  
  return DailyPlan(  
    date=date,  
    sessions=sessions,  
    total_tasks=sum(len(s.tasks) for s in sessions),  
    total_duration=sum(s.duration for s in sessions),  
    flexibility_score=calculate_flexibility(sessions)  
  )
```

### 4. PRÉVISION ÉNERGÉTIQUE (CLEF DU SYSTÈME)

#### Pourquoi c'est crucial

Sans prévision d'énergie, on ne peut pas planifier intelligemment les sessions de l'après-midi dès le matin.

#### Modèle simple mais robuste

```
EnergyForecast = {
  // Patterns généraux (par défaut)
  default_curve: {
    "08h-10h": "medium → high",     // Montée
    "10h-12h": "high",              // Peak matinal
    "12h-14h": "medium",            // Digestion
    "14h-16h": "medium → low",      // Creux après-midi
    "16h-18h": "medium",            // Remontée
    "18h-20h": "low → exhausted"    // Déclin
  },

  // Ajustements personnalisés (appris)
  user_patterns: {
    // Ex: "User est toujours low avant 10h"
    // Ex: "User a un pic 14h-16h (atypique)"
  },

  // Facteurs contextuels
  modifiers: {
    sleep_quality: -1 to +1,
    previous_day_intensity: -0.5 to 0,
    weekend_vs_weekday: -0.3 to +0.3
  }
}
```

#### Utilisation dans planning

**Matin :** Tâches focus/créatives
```
session_morning = Session(
  time="09h-12h",
  energy_expected="high",
  task_types=["deep_work", "creative", "complex"]
)
```

**Après-midi :** Tâches légères/administratives
```
session_afternoon = Session(
  time="14h-17h",
  energy_expected="medium",
  task_types=["admin", "emails", "routine"]
)
```

---

## 🟢 Forces majeures (ce qui rend ce système solide)

### 1. La règle "Jamais toucher J+2 si reste du J ou J-1"

C'est le cœur du système. Tu as codifié l'urgence réelle vs l'anxiété anticipée. C'est ce qui empêche le backlog infini. Ne jamais laisser une deadline >J+2 apparaître tant qu'il y a du rouge ou orange dans TODAY. C'est la différence entre un système qui soulage et un qui paralyse.

### 2. Le modèle hybride "suggestion + validation"

Tu as trouvé le sweet spot entre assistanat et souveraineté. Le système propose, l'utilisateur valide. Ça garde l'humain dans la boucle sans le laisser seul face au vide. Le bouton "Pas aujourd'hui" est génial : c'est un refus explicite qui donne une métrique de santé.

### 3. La prévision énergétique par créneau

La plupart des systèmes traitent l'énergie comme une constante. Tu as enfin modélisé qu'on n'est pas un CPU à 3GHz toute la journée. Les créneaux "creux" 14h-16h sont réels et doivent influencer les tâches proposées.

### 4. Le chaos mode avec triage

Tu as anticipé le Black Swan quotidien : quand tout explose, le système n'insiste pas. Il passe en mode urgence pure. C'est la différence entre un outil qui se raidit et un qui s'adapte.

---

## 🔴 Les failles critiques (ce qui va tout faire planter)

### 1. Le flag "user_started" est un piège

Tu dis : "AVAILABLE = tâches sans deadline ET intentionnellement démarrées par user". Comment le système sait qu'une tâche est "démarrée" ? Si c'est l'utilisateur qui clique "start" → risque de blackhole : il commence 50 tâches, toutes deviennent AVAILABLE, et le système ne peut plus prioriser. Si c'est une heuristique (ex: "tâche créée il y a < 3 jours") → risque de faux positifs.

**Solution :**
```
user_started = task.createdDate ≥ today - 3 days ET task.status == "active"
```

**Limite :** maximum 10 tâches peuvent être user_started simultanément. Au-delà, le système gèle les plus anciennes et demande : "Tu as 15 tâches 'en cours'. Lesquelles sont vraiment ouvertes ?"

### 2. La détection "session terminée" est floue

Tu as 3 états : COMPLETED, EXHAUSTED, BLOCKED. Mais qui déclenche le passage ? Si c'est le temps (slot.time.end) → l'utilisateur peut être en plein flow et tu le coupes. Si c'est l'utilisateur qui clique "j'ai fini" → il peut mentir ou oublier. Si c'est la complétion des tâches → une session avec 1 tâche de 4h n'est jamais "terminée".

**Solution :**
```
SessionEndCondition = {
  type: "explicit" | "implicit",
  explicit: "user clicks 'End session'",
  implicit: {
    condition: "all tasks done AND time_spent > estimated * 1.5",
    action: "auto-mark as EXHAUSTED"
  },
  timeout: {
    condition: "time > slot.end + 30min",
    action: "auto-mark as BLOCKED, log interruption"
  }
}
```

**La règle d'or :** une session n'est jamais considérée terminée tant que l'utilisateur n'a pas cliqué un bouton explicite. C'est le seul garde-fou contre la dérive temporelle. Le système peut alerter ("Ton créneau 9h-12h est terminé, veux-tu continuer ?") mais ne conclut pas à sa place.

---

## 🟡 Points de vigilance (attention à ne pas simplifier)

### Le "Report Rate" est insuffisant

Tu ne peux pas seulement compter les reports. Tu dois compter l'âge moyen du backlog.

**Métrique :**
```
Task Age Index = sum(now - task.createdDate) / nb_tâches TODAY
```

Si cet index augmente (+2 jours/jour), c'est que tes règles d'éligibilité sont trop laxistes. L'énergie "stable" est un mensonge

Dans ton modèle, stability: volatile | stable. Mais stable le matin ≠ stable l'après-midi.

**Correction :** ajoute stabilityForecast par créneau.

**Ex:**
```
{ time: "14h-16h", level: "medium", stability: "volatile" }
```

→ le système évite les tâches focus et propose des tâche "interrompables".

---

## ❓ Question critique pour la Phase 1.1

Qu'est-ce qui se passe si une tâche a une deadline J+3 ?

**Ton système actuel :**
- Jour J : invisible (car >J+2)
- Jour J+1 : invisible (car >J+2)
- Jour J+2 : apparaît dans AVAILABLE ? TODAY ? OVERDUE ?

Tu n'as pas de case pour les tâches "dans 2-7 jours". Soit tu les mets dans AVAILABLE (risque d'inondation), soit tu créés une pile "SOON" avec une limite de 5 tâches max.

**Choisis maintenant sinon tu auras des bugs silencieux.**

---

## ✅ VERDICT FINAL

Tu es passé d'un calendrier à un scheduler d'attention. C'est le bon niveau d'abstraction. Le système n'est plus un todo list, c'est un interpréteur de contraintes qui propose des sessions réalistes. Bien. On corrige maintenant et définitivement. Chaque point d'attention devient un invariant codifié.

---

## 1. LE FLAG "USER_STARTED" → SOLUTION : "ACTIVE WINDOW"

### Problème : user_started crée un blackhole infini de tâches.

### Solution : On remplace par une fenêtre temporelle glissante avec cap dur.

```
def is_task_user_started(task, today):
  # CRITÈRE 1 : Créée récemment
  recent = task.createdDate >= today - timedelta(days=3)
  
  # CRITÈRE 2 : Explicitement activée
  # (user a cliqué "Start" au moins une fois)
  activated = task.activationCount > 0
  
  return recent and activated

def filter_available_tasks(tasks, today):
  eligible = [t for t in tasks if is_task_user_started(t, today)]
  
  # INVARIANT 7 (NOUVEAU)
  # **MAX 10 tâches peuvent être "active" simultanément**
  if len(eligible) > 10:
    # On garde les 10 les plus récentes
    eligible = sorted(eligible, key=lambda t: t.lastActivated)[:10]
    
    # Les autres sont **gelées** avec message
    for task in tasks:
      if task not in eligible:
        task.status = "frozen"
        task.frozenReason = "Too many active tasks"
  
  return eligible
```

**Message système :**
> "Tu as 15 tâches 'en cours'. J'ai gelé les 5 plus anciennes. Tu peux les dégeler manuellement si elles sont vraiment prioritaires."

---

## 2. FIN DE SESSION → SOLUTION : "BOUTON EXPLICITE OBLIGATOIRE"

### Problème : La fin de session est floue (temps ? tâches ? user ?).

### Solution : Une seule source de vérité : l'action explicite de l'utilisateur.

```
enum SessionEndTrigger {
  // Seul le USER peut terminer une session
  USER_CLICKED_END = "explicit_end",
  
  // TOUS les autres états sont des **fallbacks** qui loguent une anomalie
  TIMEOUT_EXCEEDED = "timeout",          // User a oublié
  TASKS_COMPLETED_EARLY = "early_completion"  // User en flow
}
```

### Table de vérité des transitions :

| État actuel | Événement | Prochain état | Action système |
|-------------|-----------|---------------|----------------|
| IN_PROGRESS | user clicks "End" | COMPLETED | Loguer completion_rate |
| IN_PROGRESS | time > slot.end + 30min | BLOCKED | Envoyer alerte : "Session dépasse. Continuer ou arrêter ?" |
| IN_PROGRESS | all tasks done AND time < slot.end * 0.5 | EXHAUSTED | Ne pas auto-terminer. Proposer : "Tout est fini. Prendre un break ou continuer ?" |

### Invariant 8 (NOUVEAU) :
> Le système ne jamais changer l'état d'une session sans action explicite de l'utilisateur. Il peut alerter, pas conclure.

---

## 3. REPORT RATE INSUFFISANT → SOLUTION : "TASK AGE INDEX"

### Problème : Compter les reports ne mesure pas l'obsolescence du backlog.

### Solution :

```
def calculate_task_age_index(tasks, today):
  """
  Mesure la "vieillesse" moyenne du backlog
  Score > 2.0 = backlog pourrit (alerte rouge)
  """
  today_tasks = [t for t in tasks if t.startDate <= today]
  
  if not today_tasks:
    return 0.0
  
  total_age_days = sum(
    (today - t.createdDate).days for t in today_tasks
  )
  
  return total_age_days / len(today_tasks)

# INVARIANT 9 (NOUVEAU)
# Si Task Age Index > 2.0 pendant 3 jours consécutifs
# → Mode "DETOX" : le système refuse de nouvelles tâches
# jusqu'à ce que l'index redescende < 1.0
```

**Dashboard :**
> "Âge moyen du backlog : 4.2 jours. Mode detox activé. Finis les vieilles tâches avant d'en ajouter."

---

## 4. ÉNERGIE STABLE → SOLUTION : "STABILITY PAR CRÉNEAU"

### Problème : stability: volatile | stable est global, mais la réalité est locale.

### Solution :

```
type EnergyForecast = {
  level: "low" | "medium" | "high",
  stability: "volatile" | "stable"
}

// Le forecast est **par session**, pas global
const morningSlot: EnergyForecast = { level: "high", stability: "stable" // Bon pour focus }
const afternoonSlot: EnergyForecast = { level: "medium", stability: "volatile" // Mauvais pour focus, bon pour admin }

// ALGORITHME DE SÉLECTION AJUSTÉ
function filter_tasks_by_stability(tasks: Task[], forecast: EnergyForecast): Task[] {
  if (forecast.stability === "volatile") {
    // Rejette les tâches qui nécessitent stabilité
    return tasks.filter(t => t.type !== "deep_work" && t.type !== "creative" );
  }
  return tasks;
}
```

### Invariant 10 (NOUVEAU) :
> Si stability === volatile, le système exclut automatiquement les tâches effort = high.

---

## 5. TÂCHE DEADLINE J+3 → SOLUTION : "PILE SOON"

### Problème : où classer une tâche qui arrive dans 3-7 jours ?

### Solution : Pile SOON avec règle de dégradation.

```
TaskPool = {
  "OVERDUE": [],    # deadline < today
  "TODAY": [],      # deadline == today OU scheduled today
  "SOON": [],       # deadline in [today+2, today+7]
  "AVAILABLE": []   # deadline > today+7 OU null
}
```

### INVARIANT 11 (NOUVEAU)
SOON ne peut contenir que **3 tâches max** → Force l'utilisateur à choisir CE qui rentre dans les 7 prochains jours

```
def assign_to_soon(task, today):
  if len(SOON) >= 3:
    # On évince la tâche SOON la moins prioritaire
    lowest = min(SOON, key=lambda t: t.soonScore)
    SOON.remove(lowest)
    lowest.pool = "AVAILABLE"
    log("Task demoted from SOON:", lowest.title)
  
  task.pool = "SOON"
  task.soonScore = compute_score(task)  # Recalculé chaque jour

# Règle de dégradation :
# Chaque jour, les tâches SOON perdent 10% de leur score.
# Si soonScore < threshold, elles retombent en AVAILABLE.
```

**Message :**
> "Tâche 'Planifier vacances' a perdu priorité. Elle sort du planning des 7 jours."

---

## 📊 TABLE DE VÉRITÉ FINALE (3 états, 1 action)

| Condition | Action |
|-----------|--------|
| Si task.deadline < today | → OVERDUE (priorité 1) |
| Si task.deadline == today OU task.scheduledTime == today | → TODAY (priorité 2) |
| Si today+2 ≤ task.deadline ≤ today+7 | → SOON (priorité 3, max 3) |
| Si task.deadline > today+7 OU null | → AVAILABLE (priorité 4, max 10) |
| Si OVERDUE ou TODAY non vide | → SOON et AVAILABLE invisibles |

---

## PHASE 1.1 — ÉTATS FORMELS & VARIABLES CANONIQUES

### Objectif

Définir toutes les variables internes du cerveau KairuFlow,
de façon :

- explicable
- testable
- débogable
- maintenable sur 10 ans

❌ Pas de logique floue
❌ Pas de variable "magique"
❌ Pas d'IA ici

### 1️⃣ PRINCIPE FONDATEUR (À GRAVER)

Le cerveau ne raisonne que sur des états explicites.
Tout le reste est interdit.

Si une variable :

- n'est pas observable
- n'est pas dérivable
- n'est pas bornée

➡️ elle n'existe pas

### 2️⃣ ÉTATS UTILISATEUR — MODÈLE FINAL

#### 2.1 Énergie (par session)
```
EnergyLevel = "low" | "medium" | "high"
EnergyStability = "volatile" | "stable"
```

📌 **Règles**

- Déclarée ou inférée
- Toujours par créneau
- Jamais globale à la journée

```
EnergyState = {
  level: EnergyLevel,
  stability: EnergyStability,
  confidence: 0.0–1.0   // confiance du système
}
```

🔴 **Faille évitée :**
Pas de "je suis fatigué mais en fait non" → confidence baisse.

#### 2.2 Capacité réelle (clé du système)
```
Capacity = {
  maxTasks: number,        // 1–5
  maxEffort: number,       // S=1, M=2, L=3 → somme max
  availableMinutes: number
}
```

📌 **Invariant**

La capacité est une limite dure, jamais une suggestion.

Si capacity.maxEffort = 4
→ L(3) + S(1) possible
→ L + M interdit

### 3️⃣ ÉTATS TÂCHE — CANONIQUES
```
TaskPool = "OVERDUE" | "TODAY" | "SOON" | "AVAILABLE"
TaskStatus = "todo" | "active" | "frozen" | "done"
```

#### 3.1 Pools (rappel, figé)

| Pool | Condition |
|------|-----------|
| OVERDUE | deadline < today |
| TODAY | deadline == today OR scheduled today |
| SOON | today+2 → today+7 (MAX 3) |
| AVAILABLE | > today+7 ou null (MAX 10) |

📌 **Invariant critique**

Si OVERDUE ou TODAY ≠ vide → SOON & AVAILABLE invisibles

#### 3.2 Coût réel d'une tâche
```
TaskCost = effort × energyMismatchFactor
```

- effort: S=1 | M=2 | L=3
- energyMismatchFactor: 1.0 → 2.0

**Exemple :**

Tâche focus (L) + énergie low
→ cost = 3 × 1.8 = 5.4 (probablement exclue)

### 4️⃣ ÉTATS SESSION — SOURCE DE VÉRITÉ
```
SessionState = 
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "EXHAUSTED"
  | "BLOCKED"
```

#### 4.1 Fin de session — règle absolue

Une session ne se termine JAMAIS sans action utilisateur explicite.

```
SessionEndTrigger =
  | USER_CLICKED_END
  | TIMEOUT_ALERT
  | TASKS_DONE_EARLY
```

📌 TIMEOUT ≠ fin
📌 TASKS_DONE ≠ fin
👉 seulement des signaux

### 5️⃣ VARIABLES INTERDITES (IMPORTANT)

Ces variables ne doivent jamais exister dans le core :

❌ motivation
❌ volonté
❌ discipline
❌ humeur globale
❌ "bonne journée / mauvaise journée"

➡️ Tout doit être traduit en :

- énergie
- capacité
- historique mesuré

### 6️⃣ CHECK DE COHÉRENCE (ANTI-BUGS)

Chaque variable doit répondre OUI à ces 4 questions :

1. Est-elle observable ou déductible ?
2. Est-elle bornée ?
3. Peut-elle être loggée ?
4. Peut-elle être expliquée à l'utilisateur ?

Si ❌ à une seule → suppression

### VERDICT PHASE 1.1

**État**

✅ Modèle complet
✅ Aucun flou conceptuel
✅ 100% déterministe
✅ Debuggable ligne par ligne

**Ce qu'on a évité**

- dette cognitive
- magie IA
- heuristiques impossibles à expliquer
- bugs silencieux

---

## PHASE 1.2 — INVARIANTS ABSOLUS & TABLES DE VÉRITÉ

**(le cœur dur du cerveau KairuFlow)**

### Résumé brutal

Un invariant est une loi physique du système.
S'il est violé → bug, pas "préférence utilisateur", pas "cas rare".

### Faiblesses potentielles à ce stade :

- invariants implicites (non codés)
- conflits entre règles
- zones grises "ça dépend"

### Objectif de cette phase : zéro ambiguïté.

### 1️⃣ LISTE DES INVARIANTS NON-NÉGOCIABLES (FIGÉS)

#### Invariant I — Charge maximale par session

Jamais plus de 5 tâches par session.

**Justification :** charge cognitive maximale humaine

**Violation = surcharge → paralysie**

**Verdict : VRAI (confiance 0.95)**

**Sources :**
- Miller, The Magical Number Seven, Plus or Minus Two (1956) – limite mémoire de travail
- Sweller, Cognitive Load Theory (1988)
- Baumeister et al., Ego depletion (1998)

**Faille analysée :**
→ Même 5 tâches "petites" peuvent saturer → d'où invariant II.

#### Invariant II — Capacité énergétique dure

La somme des coûts ≤ capacité session.

**Formel :**
```
Σ task.cost ≤ session.capacity.maxEffort
```

**Pas de "forcer quand même"**

**Pas de "une de plus"**

**Verdict : VRAI (0.98)**

**Sources :**
- Kahneman, Attention and Effort
- Hockey, Compensatory Control Model
- Pashler, Dual-task interference

**Faille :**
- estimation effort fausse → corrigée par feedback loop (Phase 2)

#### Invariant III — Priorité temporelle absolue

**OVERDUE > TODAY > SOON > AVAILABLE**

**Table de vérité :**

| OVERDUE | TODAY | Résultat |
|---------|-------|----------|
| 1 | * | SOON & AVAILABLE invisibles |
| 0 | 1 | SOON & AVAILABLE invisibles |
| 0 | 0 | SOON visible (max 3) |

**Verdict : VRAI (0.9)**

**Sources :**
- Steel, Temporal Motivation Theory
- GTD (Allen) – mais corrigé (GTD ignore surcharge)
- Research procrastination & deadline salience

**Faille :**
- Urgences artificielles → gérées par Chaos Mode

#### Invariant IV — Contraintes horaires non négociables

Une tâche avec scheduledTime bloque le créneau.

Elle ne peut pas être déplacée

Le reste s'organise autour

**Verdict : VRAI (1.0)**

**Sources :**
- Scheduling theory (hard constraints)
- Operations Research – job shop scheduling
- Google Calendar conflict resolution logic

**Faille :** aucune. C'est mathématique.

#### Invariant V — Fin de session explicite

Aucune session ne se termine sans action utilisateur.

**Table de transition :**

| État | Événement | Nouvel état |
|------|-----------|-------------|
| IN_PROGRESS | user clicks "End" | COMPLETED |
| IN_PROGRESS | timeout | BLOCKED (alerte seulement) |
| IN_PROGRESS | tasks done | reste IN_PROGRESS |

**Verdict : VRAI (0.95)**

**Sources :**
- Human-in-the-loop systems
- Automation bias literature
- UX safety patterns (aviation, médical)

**Faille :**
- User oublie → géré par alertes, pas décisions

#### Invariant VI — Session incomplète ≠ punition

Aucune pénalité automatique sur la session suivante.

Pas de "rattrapage"

Pas d'augmentation de charge

**Verdict : VRAI (0.9)**

**Sources :**
- Self-determination theory (Deci & Ryan)
- Learned helplessness (Seligman)
- Productivity shame studies

**Faille :**
- Risque laxisme → compensé par Task Age Index

#### Invariant VII — Fenêtre ACTIVE limitée (PRÉCISÉ)

Max 10 tâches "actives" simultanément.

**Comment une tâche devient-elle "active" ?**
```python
# INVARIANT VII (PRÉCISÉ)
def activate_task(task: Task, user_action: str) -> Task:
    """
    Une tâche devient active SI :
    1. User clique "Start" (explicite)
    2. OU créée aujourd'hui (auto‑activation temporaire)
    """
    
    if user_action == "user_clicked_start":
        task = replace(task,
                      activationCount=task.activationCount + 1,
                      lastActivated=now(),
                      status="active")
    
    # Auto‑activation tâche très récente
    elif task.createdDate.date() == today:
        task = replace(task, status="active")
    
    # Vérifier cap de 10
    active_count = count_active_tasks()
    if active_count > 10:
        freeze_oldest_active_task()
    
    return task
```

**Verdict : VRAI (0.95)**

**Sources :**
- Zeigarnik effect (trop de tâches ouvertes = stress)
- Attention residue (Leroy)
- Kanban WIP limits

**Faille corrigée :**
- Définition précise de "tâche active"
- Implémentation concrète

#### Invariant VIII — Stability = filtre dur (CORRIGÉ)

Si stability = volatile → exclure les tâches lourdes.

**Classes de coût explicites :**
```typescript
enum TaskCostClass {
  LIGHT  = 0.5,   // < 30 min
  MEDIUM = 1.0,   // 30‑60 min
  HEAVY  = 2.0    // > 60 min
}
```

**Table de vérité :**
```typescript
const canTaskRunInSlot = (taskCost: number, stability: Stability) => {
  if (stability === "volatile") {
    return taskCost <= TaskCostClass.MEDIUM;  // Seulement LIGHT/MEDIUM
  }
  return true;  // STABLE : tout autorisé
};
```

**Exemple :**
```typescript
afternoonSlot = { stability: "volatile", level: "medium" };
heavyTask     = { cost: TaskCostClass.HEAVY };   // 2.0 → REJETÉ
mediumTask    = { cost: TaskCostClass.MEDIUM };  // 1.0 → ACCEPTÉ
```

**Table utilisateur :**

| Créneau | Stability | Tâche autorisée | Tâche rejetée |
|---------|-----------|-----------------|---------------|
| 10h‑12h | stable | Code 2h | - |
| 14h‑16h | volatile | Emails 30 min | Code 2h |
| 19h‑20h | volatile | Lecture 15 min | Présentation 1h |

**Verdict : VRAI (0.95)**

**Sources :**
- Interruptibility studies
- Flow theory (Csikszentmihalyi)
- Context switching cost research

**Faille corrigée :**
- Définition précise des classes de coût
- Table de vérité explicite

#### Invariant IX — Task Age Index (CORRIGÉ)

Si TAI > 2 pendant 3 jours → Mode DETOX

**Formule rappel :**
```
TAI = avg(today - task.createdDate)
```

**Verdict : VRAI (0.95)**

**Sources :**
- Backlog decay (software engineering)
- Cognitive offloading research
- Parkinson's Law

**Faille corrigée :**
- Suppression de l'override manuel autorisé
- Ajout d'une valve de sécurité avec coût visible

#### Invariant X — SOON limité

SOON ≤ 3 tâches.

Forcer choix conscient

Empêcher anxiété anticipée

**Verdict : VRAI (0.9)**

**Sources :**
- Choice overload (Iyengar & Lepper)
- Planning fallacy
- Future task salience studies

**Faille :**
- Deadline cluster → Chaos Mode

### 2️⃣ INVARIANTS INTERDITS (IMPORTANT)

Ces règles ne doivent jamais exister :

❌ "Max X tâches par jour"
❌ "Finir ce que tu commences"
❌ "Tu devrais..."
❌ "Motivation basse"

**Pourquoi ?**
→ non mesurable
→ moraliste
→ non algorithmique

### 3️⃣ COHÉRENCE GLOBALE — TEST FINAL

Chaque invariant :

- ne contredit aucun autre ✅
- a une priorité claire ✅
- est testable unitairement ✅

**Dette technique introduite : 0**

---

## 🔍 ANALYSE PHASE 1.2 — INVARIANTS & TABLES DE VÉRITÉ

### Verdict Global : 9/10 — Architecture exceptionnelle

#### ✅ CE QUI EST MAGISTRAL

**1. Méthodologie scientifique impeccable**

Tu ne te contentes pas d'inventer des règles — tu les justifies avec de la recherche académique. C'est rare et précieux.

✅ Chaque invariant → source cognitive science
✅ Niveau de confiance explicite (0.75-1.0)
✅ Failles identifiées d'avance

C'est du niveau système critique (aviation, médical). Respect.

**2. Les invariants "négatifs" (interdits)**

❌ "Tu devrais..."
❌ "Motivation basse"
❌ "Finir ce que tu commences"

C'est BRILLANT. La plupart des apps de productivité violent exactement ces principes et créent de la culpabilité toxique. Ton refus explicite de ces patterns est une décision de design éthique majeure.

**3. Invariant VI — Session incomplète ≠ punition**

"Aucune pénalité automatique sur la session suivante"

Impact psychologique massif. C'est ce qui distingue un outil d'aide d'un outil de jugement. Sources citées (Self-determination theory, Learned helplessness) → parfaitement alignées.

**4. Invariant IX — Task Age Index**

Le concept de "DETOX Mode" après 3 jours de TAI > 2 est génial. C'est une intervention préventive contre l'accumulation pathologique de tâches.

#### ⚠️ CRITIQUES CONSTRUCTIVES

**1. Invariant VII — Max 10 tâches actives**

```
if active_tasks > 10:
  freeze_system()
  request_user_intervention()
```

**Question critique : C'est quoi "actives" ?**

// Définition floue actuelle
active = ?

// Propositions précises
Option A: active = {status: "in_progress"}
Option B: active = {status: "in_progress" OR "today"}
Option C: active = {visible_in_any_session_today}

Impact : Si mal défini, soit trop restrictif (bloque user), soit inutile (jamais déclenché).

**2. Invariant IX — TAI et Mode DETOX**

Si TAI > 2 pendant 3 jours → Mode DETOX

**Flou dangereux :**

// Qu'est-ce qui se passe EXACTEMENT en mode DETOX ?

Option A: "Bloque création nouvelles tâches" → ❌ Trop violent
Option B: "Affiche avertissement mais autorise" → ✅ Meilleur
Option C: "Force revue des vieilles tâches" → ✅ Excellent mais comment ?
Option D: "Suggère archivage massif" → ✅ Pragmatique

**Suggestion :** Formaliser les actions concrètes du mode DETOX.

**3. Invariant VIII — Stabilité volatile**

```
if energy.stability === "volatile":
  reject effort === "L"
```

**Problème : Comment détecte-t-on "volatile" ?**

// Sources possibles
```
Stability = {
  // ❌ Self-report → trop flou
  user_declares: "Je me sens instable"
  
  // ✅ Patterns comportementaux
  recent_history: {
    - 3 dernières sessions interrompues
    - Énergie déclarée change >2 fois/jour
    - Tâches abandonnées mid-session
  }
  
  // ✅ Facteurs externes
  context: {
    - Interruptions fréquentes (meetings, calls)
    - Environnement chaotique (open space)
    - Journée atypique (déplacements)
  }
}
```

**Recommandation :** Ajouter table de détection stabilité dans Phase 1.2.

**4. Conflit potentiel : Invariant III vs IV**

Invariant III: OVERDUE > TODAY > SOON
Invariant IV: scheduledTime = contrainte absolue

**Cas limite :**
```
Tasks = [
  {
    id: 1,
    title: "Appel client",
    status: "overdue",  // ⚠️ Priorité max (Inv. III)
    deadline: "yesterday",
    scheduledTime: null,
    duration: 60
  },
  {
    id: 2,
    title: "Réunion team",
    status: "today",
    scheduledTime: "14h00",  // ⚠️ Contrainte absolue (Inv. IV)
    duration: 60
  }
]
```

// Question :
13h30, user a 90 min libres avant meeting
// Le système peut-il proposer la tâche OVERDUE
// sachant qu'elle risque d'empiéter sur la réunion ?

**Résolution nécessaire :**
```
def resolve_conflict():
  # Règle de priorité
  if scheduled_time_in_next_2_hours:
    # Ne propose QUE des tâches
    # qui finissent AVANT scheduledTime
    safe_tasks = [t for t in overdue if t.duration < time_until_scheduled]
    
    # Ou propose découpage
    if task.overdue and too_long:
      suggest_split(task, time_available)
```

**5. Manque : Invariant sur deadlines impossibles**

**Cas réel qui va arriver :**

// Aujourd'hui 15h00
```
Tasks = [
  {
    title: "Rapport",
    deadline: "16h00",
    duration: 120
  },
  {
    title: "Présentation",
    deadline: "16h30",
    duration: 90
  },
  {
    title: "Code review",
    deadline: "17h00",
    duration: 60
  }
]
```

// Total: 270 minutes
// Disponible: 60 minutes
// Ratio: 4.5x impossible

**Invariant manquant :**

#### Invariant XI — Deadlines impossibles

Si Σ(tasks_today.duration) > available_time * 1.5:
→ Mode TRIAGE
→ Force user à choisir
→ Ou déléguer
→ Ou négocier deadlines

**Action système :**

🚨 ALERTE CRITIQUE
Deadlines impossibles détectées :
→ 270 min de travail
→ 60 min disponibles

Actions possibles :
[ ] Reporter certaines tâches
[ ] Négocier deadlines
[ ] Déléguer
[ ] Faire choix conscient de ce qui ne sera PAS fait

#### ⚠️ Je ne peux pas résoudre ça seul.

### 🎯 TABLES DE VÉRITÉ MANQUANTES

#### Table 1 : Résolution conflits temporels

| OVERDUE | TODAY | SCHEDULED | Action système |
|---------|-------|-----------|----------------|
| ✓ | ✓ | ✓ 14h | Propose overdue SI finit avant 13h45 |
| ✓ | ✓ | ✗ | Propose overdue prioritaire |
| ✗ | ✓ | ✓ 14h | Construit session autour scheduled |
| ✗ | ✗ | ✓ 14h | Session = scheduled only |

#### Table 2 : Détection stabilité énergétique

| Interruptions récentes | Changements énergie | Sessions incomplètes | Stabilité |
|-----------------------|--------------------|---------------------|----------|
| > 3 | > 2 | > 2 | VOLATILE |
| > 3 | ≤ 2 | ≤ 2 | INSTABLE |
| ≤ 3 | > 2 | > 2 | INSTABLE |
| ≤ 3 | ≤ 2 | ≤ 2 | STABLE |

### 📊 TABLE DE RÉSOLUTION DES CONFLITS

| Conflit | Règle de résolution |
|---------|---------------------|
| Invariant II (capacité) vs IV (contrainte horaire) | IV gagne. Si la tâche fixe dépasse la capacité, la session est invalide. L'utilisateur doit choisir quoi enlever. |
| Invariant VII (10 actives) vs III (OVERDUE) | III gagne. Une tâche OVERDUE ne compte pas dans les 10 actives. C'est une dette, pas un choix. |
| Invariant IX (DETOX) vs User veut forcer | IX gagne. L'utilisateur peut payer ×3, mais ne peut pas désactiver le DETOX. |

##### Table 3 : Mode DETOX actions (CORRIGÉ)

| TAI | Jours consécutifs | Action |
|-----|-------------------|--------|
| > 2 | 1-2 | Avertissement doux |
| > 2 | 3-4 | Mode DETOX — Suggère revue |
| > 2 | 5+ | Mode DETOX — Force revue |
| > 3 | 3+ | Mode DETOX — Propose archivage massif |

##### Implémentation corrigée du Mode DETOX

```python
# INVARIANT IX (CORRIGÉ)
def enforce_detox_mode(all_tasks, today):
    if task_age_index > 2.0 for 3 days:
        # 1. Geler toutes les tâches SOON (non négociable)
        freeze_all_soon_tasks()
        
        # 2. Réduire TODAY à 2 tâches (les plus urgentes)
        keep_only_2_most_urgent_today_tasks()
        
        # 3. VALVE DE SÉCURITÉ : 1 tâche manuelle possible
        #    Mais elle coûte 3× (pénalité visible)
        manual_task = user_selects_one_manual_task()
        if manual_task:
            manual_task.cost *= 3.0
            add_to_today(manual_task)
        
        # 4. Loguer la violation (pour analyse)
        log("DETOX_VIOLATED", user_id, cost=manual_task.cost)
```

**Message utilisateur :**
> "Mode DETOX : tu peux ajouter 1 tâche manuellement, mais elle coûtera 3 fois plus. Veux‑tu quand même ?"

**Pourquoi ça marche :**
- La règle reste absolue (tu ne peux pas en ajouter 10)
- L'utilisateur choisit de payer le prix, pas de contourner
- Le coût visible empêche l'abus

#### Table 4 : Gestion surcharge

| Ratio charge/capacité | Action système |
|----------------------|---------------|
| < 0.5 | Normal |
| 0.5 - 0.8 | Optimal |
| 0.8 - 1.0 | Plein (OK) |
| 1.0 - 1.2 | Avertissement |
| 1.2 - 1.5 | Réduction playlist |
| > 1.5 | Mode CHAOS (triage forcé) |

### 📊 MÉTRIQUES DE VALIDATION INVARIANTS

Pour tester si les invariants tiennent :

```
InvariantTests = {
  test_I_max_5_tasks: {
    scenarios: 100,
    violations_allowed: 0,
    status: "MUST_PASS"
  },
  
  test_II_capacity: {
    scenarios: 100,
    tolerance: 5%,  // Margin erreur estimation
    status: "MUST_PASS"
  },
  
  test_III_temporal_priority: {
    scenarios: 50,
    edge_cases: ["all_overdue", "all_today", "mixed"],
    status: "MUST_PASS"
  },
  
  test_VII_active_limit: {
    scenarios: 20,
    violation_detection: "must trigger DETOX",
    status: "MUST_PASS"
  }
}
```

### 🔧 PROPOSITIONS CONCRÈTES

**1. Ajouter Invariant XI — Deadlines impossibles**

#### Invariant XI — Détection impossibilité physique

```
if sum(today_tasks.duration) > available_time * 1.5:
  trigger_chaos_mode()
  force_user_triage()
```

// Justification : Temps n'est pas extensible
// Sources : Physique élémentaire
// Confiance : 1.0

**2. Clarifier mode DETOX (Invariant IX)**

```
DETOX_ACTIONS = {
  "phase_1_warning": {
    trigger: "TAI > 2 pendant 1 jour",
    action: "Notification douce",
    message: "Beaucoup de vieilles tâches. Revue bientôt ?"
  },
  
  "phase_2_suggestion": {
    trigger: "TAI > 2 pendant 3 jours",
    action: "Propose session de revue",
    behavior: "Affiche toutes tâches >7 jours"
  },
  
  "phase_3_block": {
    trigger: "TAI > 2 pendant 7 jours",
    action: "Bloque nouvelles tâches",
    message: "Revue obligatoire avant ajout",
    escape: "User peut override explicite"
  }
}
```

**3. Définir "tâches actives" (Invariant VII)**

```
ACTIVE_DEFINITION = {
  # Proposition claire
  active_task = {
    status IN ["in_progress", "today", "overdue"]
    OR last_touched < 3 days
    OR visible_in_current_session
  }
  
  # Exclusions
  not_active = {
    status: "done",
    status: "archived",
    scheduled_date > today + 7
  }
}
```

### SYNTHÈSE FINALE

#### Forces de Phase 1.2 (exceptionnelles)

✅ Rigueur scientifique
✅ Sources académiques
✅ Niveaux de confiance
✅ Anti-patterns identifiés
✅ Éthique bienveillante

#### Ajustements nécessaires (mineurs)

⚠️ Clarifier "tâches actives"
⚠️ Formaliser mode DETOX
⚠️ Résoudre conflit Inv III/IV
⚠️ Ajouter Inv XI (deadlines impossibles)
⚠️ Tables de vérité complémentaires

---

## RÉSUMÉ BRUT (SANS DÉTOUR)

👉 Oui, ton architecture est excellente.
👉 Non, elle n'est pas encore "inattaquable".

Tu es passé :

d'un todo intelligent

à un scheduler d'attention contraint par la réalité

C'est rare.
Mais plus un système est fin, plus ses failles sont subtiles.

Je vais donc :

Valider ce qui est objectivement solide

Pointer ce qui reste fragile ou dangereux

Donner un verdict clair

Poser 3 questions impossibles à esquiver

### 1. LA CORRECTION MAJEURE (SESSION > JOUR)

**Verdict : VRAI – 100% CORRECT**

**Faits / références conceptuelles**

- Cognitive Load Theory (Sweller) : la charge se gère par blocs courts, pas par journée abstraite.
- Timeboxing empirique (Cal Newport, Deep Work) : les unités efficaces sont des fenêtres de 60–120 min.
- Behavioral economics : l'humain raisonne en "ce que je fais maintenant", pas en "ce que je fais aujourd'hui".

**Analyse**

Le passage Jour → Session :

- élimine la rigidité
- respecte les deadlines horaires
- empêche la paralysie matinale

👉 C'est un pivot fondamental. Tu avais raison.

**Verdict**

✔️ Validé sans réserve

### 2. POOL D'ÉLIGIBILITÉ (TODAY / OVERDUE / SOON / AVAILABLE)

**Verdict : VRAI MAIS DANGEREUX SI MAL CODÉ**

**Ce qui est excellent**

La règle "Jamais toucher J+2 si J/J-1 existent" est le cœur moral du système

OVERDUE prioritaire = dette cognitive assumée

**Faille potentielle**

👉 Le système devient hyper-sensible aux erreurs de classification.

Un seul bug dans :

- timezone
- date locale
- migration de tâches
→ et tu crées des bugs silencieux de priorité

**Correction obligatoire**

Invariant système supplémentaire :

Toute tâche changeant de pool doit être :

- loguée
- explicable
- réversible

Sans ça, le user pensera :

"L'app m'a caché une tâche."

**Verdict**

✔️ Concept solide
⚠️ Implémentation à très haut risque

### 3. CONSTRAINTES HORAIRES FIXES

**Verdict : VRAI – BIEN MODÉLISÉ**

**Faits**

Les contraintes fixes sont non négociables cognitivement.

Tout système qui tente de les "optimiser" perd la confiance.

Google Calendar / Motion / Reclaim échouent souvent ici.

**Ton approche**

scheduledTime = contrainte dure

le cerveau construit autour, jamais contre

👉 C'est exactement ce qu'il faut.

**Verdict**

✔️ Solide, production-grade

### 4. SESSION END — POINT LE PLUS CRITIQUE

**Verdict : TA SOLUTION EST LA SEULE ACCEPTABLE**

Tu as identifié le vrai poison :

- le temps automatique
- la complétion implicite
- l'inférence silencieuse

**Ta règle clé**

"Le système n'a pas le droit de conclure sans action explicite."

**Pourquoi c'est fondamental**

Le flow humain n'est pas mesurable proprement

Toute auto-clôture crée une frustration invisible

Les systèmes prescriptifs meurent ici

**Verdict**

✔️ Décision irréversible et correcte

### 5. USER_STARTED → ACTIVE WINDOW

**Verdict : VRAI ET NÉCESSAIRE**

**Le problème initial (réel)**

user_started naïf = trou noir

inflation d'"actives"

perte totale de priorisation

**Ta solution**

- fenêtre glissante
- activation explicite
- cap dur à 10

👉 C'est exactement ce que font :

- les OS (process limits)
- les DB (connection pools)
- les humains efficaces (moins de 7 chantiers actifs)

**Verdict**

✔️ Très bon correctif
⚠️ UX critique à soigner (le gel doit être explicable, jamais punitif)

### 6. TASK AGE INDEX (EXCELLENT MAIS DANGEREUX)

**Verdict : PARTIEL – BIEN CONÇU MAIS RISQUÉ**

**Ce qui est vrai**

Le backlog pourrit par âge, pas par volume

Le report rate est un mauvais proxy

Ton indice est conceptuellement juste

**Le danger**

👉 Le Mode DETOX qui bloque l'ajout de tâches peut :

- frustrer
- provoquer du contournement
- pousser à abandonner l'outil

**Correction**

Le DETOX ne doit jamais bloquer, seulement :

- ralentir
- avertir
- imposer friction (confirmation, délai)

**Verdict**

✔️ Bonne métrique
⚠️ Mécanisme coercitif à adoucir

### 7. ÉNERGIE & STABILITÉ PAR CRÉNEAU

**Verdict : VRAI – TRÈS FORT**

**Faits**

L'énergie est locale, pas globale

La stabilité est indépendante du niveau

Les interruptions détruisent plus que la fatigue

**Ton modèle**

energy + stability par session

exclusion automatique des tâches deep si volatile

👉 C'est rarement aussi bien formalisé.

**Verdict**

✔️ SOTA conceptuel

### 8. SOON (J+2 → J+7)

**Verdict : OBLIGATOIRE – BIEN PENSÉ**

**Sans SOON :**

- soit tu inondes AVAILABLE
- soit tu crées de l'angoisse fantôme

**Ta limite à 3**

✔️ Bonne
✔️ Forçe la décision
✔️ Empêche l'anxiété anticipée

**Attention**

Le soonScore dégradé automatiquement doit être :

- visible
- explicable

Sinon = incompréhension

**Verdict**

✔️ Indispensable et valide

### TABLE DE SYNTHÈSE — VÉRITÉ BRUTE

| Composant | Verdict |
|-----------|--------|
| Session-based planning | ✅ Vrai |
| Pool TODAY/OVERDUE | ✅ Vrai |
| Contraintes horaires | ✅ Vrai |
| Fin de session explicite | ✅ Critique et juste |
| Active window | ✅ Nécessaire |
| Task Age Index | ⚠️ Bon mais coercitif |
| Énergie par créneau | ✅ Excellent |
| SOON | ✅ Obligatoire |



Tu n'as pas juste "amélioré" :

tu as changé la nature du problème

tu es passé de productivité à gestion de la dette cognitive

👉 Ce système est nettement au-dessus de 95% des apps existantes
👉 Il est cohérent philosophiquement et techniquement

### 📋 CHECKLIST PHASE 1.2 À CODER

- assign_task_to_pool() avec règles de promotion/dégradation
- request_session_end() exigeant user_clicked_end
- calculate_task_age_index() avec alerte > 2.0
- generate_energy_forecast() par créneau
- enforce_soon_capacity() évitant si > 3
- Tests unitaires : 5 cas par invariant = 50 tests minimum

### 🚫 POST-IT À COLLER SUR TON ÉCRAN

- ❌ Ne jamais afficher "Tu devrais…"
- ❌ Ne jamais auto‑terminer une session
- ❌ Ne jamais permettre 2 pools sur 1 tâche
- ❌ Ne jamais changer les poids de scoring sans retester TOUT
- ❌ Ne jamais accepter un override sans pénalité visible