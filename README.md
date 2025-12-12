# KairuFlow - Assistant Intelligent de Gestion de Tâches

KairuFlow est un assistant intelligent de productivité qui transforme votre langage naturel en tâches structurées avec une intelligence contextuelle avancée.

## 🚀 Fonctionnalités Principales

### 🧠 Intelligence NLP State-of-the-Art
- **Détection de langue SOTA** : Support multilingue (FR/EN/ES) avec précision >95%
- **Extraction structurelle** : Transformation du texte en tâches avec scores de confiance
- **Classification mmBERT** : Analyse énergie/effort/sentiment avec modèle quantifié INT8
- **Génération automatique de tags** : Catégorisation contextuelle intelligente

### 📋 Génération de Playlist Dynamique
- **Algorithme de scoring pondéré** :
  - Énergie (40%), Impact (15%), Priorité (20%), Effort (15%), Patterns (10%)
  - Sélection optimale de 3-5 tâches par jour
  - Intégration d'habitudes clés (keystone habits)
- **Apprentissage adaptatif** : Ajustement des poids basé sur l'historique
- **Feedback & fallback intelligent** : Quick wins en cas de faible impact

### ⚡ Performance Optimisée
- **Temps de réponse <1s** : Pipeline complet optimisé
- **Stockage Dexie** : Base de données locale ultra-rapide
- **Memoization** : Cache intelligent pour les calculs récurrents
- **Mobile-first** : Expérience fluide sur tous les appareils

## 🛠️ Stack Technologique

### Frontend
- **Next.js 15** : Framework React moderne
- **React 19** : Interface utilisateur déclarative
- **TypeScript** : Typage statique pour la fiabilité
- **Tailwind CSS** : Styling utility-first
- **Radix UI** : Composants accessibles
- **Zustand** : Gestion d'état légère

### Intelligence Artificielle
- **winkNLP** : Extraction linguistique avancée
- **mmBERT-small** : Classification énergie/effort/sentiment
- **Modèles quantifiés INT8** : Performance optimisée (<45MB)

### Stockage & Données
- **Dexie.js** : Wrapper IndexedDB pour stockage local
- **bulkGet optimisé** : Accès aux données rapides

## 📁 Architecture du Projet

```
src/
├── app/                 # Pages Next.js et routing
├── components/          # Composants React réutilisables
├── hooks/               # Hooks personnalisés
├── lib/
│   ├── nlp/            # Pipeline NLP complet
│   ├── playlistGenerator.ts  # Algorithme de génération
│   ├── scoringRules.ts       # Règles de scoring
│   └── types.ts              # Interfaces TypeScript
└── stores/              # Gestion d'état (Zustand)
```

## 🚀 Installation

```bash
# Cloner le repository
git clone [url-du-repository]
cd kairuflow

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## 🧪 Pipeline NLP Complet

1. **Détection de langue** (<1ms)
2. **Extraction structurelle** (<200ms)
3. **Classification mmBERT** (<800ms)
4. **Fusion & stockage** (<50ms)

### Exemple d'utilisation
```text
Input: "Appeler Marc demain 15h urgent, écrire rapport Q4 complexe"

Output:
[
  {
    content: "Appeler Marc",
    energy: "relationnel",
    effort: "S",
    priority: "high",
    urgency: 0.85,
    tags: ["appeler", "relationnel", "deadline"]
  },
  {
    content: "Écrire rapport Q4",
    energy: "focus",
    effort: "L",
    tags: ["écrire", "focus", "rapport Q4"]
  }
]
```

## 📊 Algorithmique

### Scoring Dynamique Pondéré
- **Énergie (40%)** : Correspondance avec le niveau d'énergie de l'utilisateur
- **Impact (15%)** : Valeur perçue et momentum passé
- **Priorité (20%)** : Échéances et importance relative
- **Effort (15%)** : Complexité estimée
- **Patterns (10%)** : Historique d'interaction et apprentissage

### Apprentissage Adaptatif
- Suivi des tâches ignorées/complétées
- Ajustement des poids après >2 shuffles
- Intégration des habitudes clés basées sur les jours

## 🔧 Dépendances Clés

```json
{
  "dependencies": {
    "next": "^15.3.6",
    "react": "^19.2.1",
    "typescript": "^5.0.0",
    "dexie": "^3.2.0",
    "zustand": "^4.5.0",
    "wink-nlp": "^2.0.0",
    "@radix-ui/react-*": "^1.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

## 📱 Composants Clés

### Capture NLP
Interface de saisie vocale/textuelle qui transforme le langage naturel en tâches structurées.

### Dashboard
Visualisation de la playlist quotidienne avec scoring et recommandations.

### Focus Mode
Environnement de travail optimisé avec timer Pomodoro intégré.

### Analytics
Suivi des habitudes, productivité et patterns d'utilisation.

## 🎯 Cas d'Utilisation

- **Professionnels** : Gestion de projet et organisation quotidienne
- **Étudiants** : Planification des études et devoirs
- **Freelancers** : Suivi des tâches et deadlines clients
- **Personnel** : Organisation de la vie quotidienne

## 📈 Roadmap

- [ ] Intégration IA générative pour suggestions contextuelles
- [ ] Synchronisation cross-appareils
- [ ] Extensions navigateur
- [ ] API REST pour intégrations tierces
- [ ] Widgets système (Windows/macOS)

## 🤝 Contribution

1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

MIT License - voir le fichier [LICENSE.md](LICENSE.md) pour plus de détails.

## 👥 Auteurs

- **Palolo875** - *Développeur principal* - [GitHub](https://github.com/Palolo875)

## 🙏 Remerciements

- Modèles linguistiques Xenova pour mmBERT
- Équipe winkNLP pour les outils NLP
- Communauté Next.js et React