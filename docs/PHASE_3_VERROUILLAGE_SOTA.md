# PHASE 3 — VERROUILLAGE SOTA

## 🔴 VÉRITÉ BRUTE AVANT DE CONTINUER

Aujourd'hui, KairuFlow est :

| État | Description |
|------|-------------|
| ❌ déjà très avancé conceptuellement | Architecture solide établie |
| ⚠️ encore vulnérable structurellement | Points faibles identifiés |
| ❌ pas encore SOTA par défaut | Manque de verrous critiques |
| ✅ rattrapable maintenant | Correctifs possibles |
| ❌ irrattrapable si on avance sans verrouiller | Risque de dette technique |

👉 **Le danger n'est plus l'algorithme. Le danger, c'est l'accumulation invisible de décisions implicites.**

---

## 🧠 CE QUI FAIT UN SYSTÈME SOTA (ET PAS UN "BON PRODUIT")

Un système SOTA respecte 5 lois non négociables :

### Loi 1 — Toute intelligence doit être bornée

**Principe :** Si un module peut faire "un peu plus", il le fera trop.

👉 **Chaque module doit avoir un plafond dur.**

### Loi 2 — Toute heuristique doit être mesurable

**Principe :** Si tu ne peux pas mesurer quand elle échoue → elle échouera en silence.

### Loi 3 — Toute adaptation doit être réversible

**Principe :** Sinon tu fabriques de la dépendance ou de la dérive.

### Loi 4 — Toute aide doit réduire la charge, pas la déplacer

**Principe :** Beaucoup d'apps déplacent la charge vers la culpabilité.

### Loi 5 — Tout système doit prévoir l'utilisateur non idéal

**Principe :** Fatigué. Chaotique. Anxieux. Irrationnel. Silencieux.

👉 **KairuFlow respecte déjà 3/5. Il manque encore 2 verrous critiques.**

---

## 🔴 CE QUI MANQUE ENCORE (ET QUI PEUT TOUT FAIRE ÉCHOUER)

### FAILLE 1 — ABSENCE DE "BUDGET COGNITIF GLOBAL"

Tu gères :
- sessions
- tâches
- énergie
- stabilité

❌ **MAIS tu n'as pas de budget cognitif global journalier contraignant.**

#### Problème

Un utilisateur peut :
- respecter chaque session
- mais exploser sur la journée
- accumuler fatigue latente
- sans jamais déclencher d'alerte

👉 **C'est exactement comme dépasser un quota mémoire sans OOM.**

#### CORRECTION SOTA — Cognitive Load Budget (CLB)

```typescript
DailyCognitiveBudget {
  max_load: number       // ex: 10 points
  used_load: number
  remaining: number
}
```

**Chaque tâche consomme :**
```
task_cost = effort_class × duration_factor × stability_penalty
```

#### Invariant NOUVEAU (XII)

```
Si budget restant < 20%
→ aucune tâche effort HEAVY autorisée
→ seulement maintenance ou arrêt
```

#### Seuils d'alerte précoce

```
Si budget restant < 40%
→ warn("⚠️ Budget cognitif à 60%. Ralentis.")

Si budget restant < 20%
→ alert("🔴 Budget critique. Arrête aujourd'hui.")
```

#### Message utilisateur (non culpabilisant) :

> "Ta capacité cognitive du jour est presque atteinte. Continuer maintenant risque de coûter demain."

⚠️ **Sans ça, ton système encourage le surmenage intelligent.**

---

### FAILLE 2 — AUCUNE LIMITE SUR L'APPRENTISSAGE ADAPTATIF

Tu adaptes :
- énergie
- stabilité
- suggestions
- ambitions

❌ **MAIS tu n'as aucune limite à ce que le système peut apprendre.**

#### Problème

Le système peut :
- sur-apprendre un mauvais pattern
- normaliser un comportement dysfonctionnel
- devenir permissif au chaos

👉 **C'est un biais de renforcement négatif classique.**

#### CORRECTION SOTA — Learning Guardrails

```typescript
LearningConstraints {
  max_adjustment_per_day: 15%
  min_baseline_reset: every 7 days
  forbidden_learns: [
    "chronic_overwork",
    "chronic_avoidance",
    "always_override"
  ]
}
```

#### Invariant XIII

```
Le système ne peut PAS apprendre d'un comportement
qui viole un invariant de santé.
```

#### Exemple :

```
user force ×3 tous les jours en DETOX
→ ❌ ce pattern ne devient jamais "normal"
```

---

### FAILLE 3 — ABSENCE DE "MODE SILENCE LONG"

Tu as :
- mode minimal
- chaos
- detox

❌ **MAIS tu n'as pas prévu : l'utilisateur qui ne veut plus RIEN pendant 48h.**

#### Cas réel

- burnout
- dépression
- surcharge émotionnelle
- rejet total de la planification

👉 **Si ton système continue de "suggérer", il devient intrusif.**

#### CORRECTION SOTA — Silent Recovery Mode

```typescript
SilentMode {
  trigger: user ignores all interactions 48h
  behavior:
    - no suggestions
    - no nudges
    - no alerts
    - only passive logging
}
```

#### Sortie :

- uniquement par action explicite
- ou par nouveau jour + interaction volontaire

#### Message unique :

> "Je suis là quand tu veux. Rien d'autre."

⚠️ **C'est un marqueur de maturité produit.**

---

## 🧱 CE QUI DOIT ÊTRE VERROUILLÉ MAINTENANT (CHECKLIST SOTA)

### Verrous algorithmiques

| Verrou | Statut |
|--------|--------|
| Budget cognitif global journalier | À IMPLÉMENTER |
| Limite d'apprentissage adaptatif | À IMPLÉMENTER |
| Mode silence long | À IMPLÉMENTER |
| Classes de coût normalisées (déjà fait) | ✔ |
| Invariants > heuristiques | ✔ |

### Verrous UX

| Verrou | Description |
|--------|-------------|
| Aucune phrase injonctive | Éviter le ton autoritaire |
| Aucune auto-décision finale | Toujours validation utilisateur |
| Aucune surprise silencieuse | Transparence totale |
| Toujours une sortie sans coût | Pas de pénalité pour abandon |

### Verrous techniques

| Verrou | Description |
|--------|-------------|
| Tous les scores traçables | Auditabilité complète |
| Tous les ajustements logués | Traçabilité des décisions |
| Tous les apprentissages plafonnés | Contrôle de l'évolution |
| Tous les modules désactivables | Modularité et tests |

---