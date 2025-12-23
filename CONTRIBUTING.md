# Contributing to KairuFlow

Merci de votre intérêt pour contribuer à KairuFlow ! 🎉

## 📋 Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

## 🚀 Installation

```bash
# Cloner le dépôt
git clone https://github.com/Palolo875/studio.git
cd studio

# Installer les dépendances
npm install

# Préparer les hooks Git
npm run prepare
```

## 🔧 Scripts de développement

```bash
# Démarrer le serveur de développement
npm run dev

# Vérification des types TypeScript
npm run typecheck

# Lancer ESLint
npm run lint
npm run lint:fix

# Lancer les tests unitaires
npm run test
npm run test:watch
npm run test:coverage

# Lancer les tests E2E
npm run test:e2e
npm run test:e2e:ui

# Tout vérifier
npm run test:all
```

## 📁 Structure du projet

```
src/
├── app/                 # Pages Next.js (App Router)
├── components/          # Composants React
│   ├── ui/             # Composants UI réutilisables
│   └── dashboard/      # Composants spécifiques au dashboard
├── lib/                 # Logique métier
│   ├── taskEngine/     # Moteur de tâches (cerveau)
│   ├── nlp/            # Traitement du langage naturel
│   ├── database/       # Couche de données (Dexie.js)
│   ├── burnout/        # Détection de burnout
│   ├── logger/         # Service de logging
│   └── playlist/       # Génération de playlists
├── ai/                  # Intégration Genkit AI
│   └── flows/          # Flows AI
└── hooks/              # Hooks React personnalisés

e2e/                    # Tests E2E Playwright
```

## 🧪 Standards de tests

### Tests unitaires (Vitest)
- Fichiers de test : `*.test.ts` ou `*.spec.ts`
- Couverture minimale : 70%
- Localisation : à côté du fichier testé ou dans `__tests__/`

### Tests E2E (Playwright)
- Fichiers de test : `e2e/*.spec.ts`
- Navigateurs testés : Chromium, Firefox, WebKit
- URL de base : `http://localhost:9002`

## 📝 Conventions de code

### TypeScript
- Mode strict activé
- Pas de `any` sauf cas exceptionnels documentés
- Interfaces préférées aux types pour les objets

### Commits
Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/) :

```
type(scope): description

feat(auth): add login functionality
fix(dashboard): resolve task sorting issue
docs(readme): update installation steps
test(burnout): add unit tests for detection
refactor(logger): extract to separate module
```

Types autorisés :
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage (pas de changement de code)
- `refactor` : Refactorisation
- `test` : Ajout/modification de tests
- `chore` : Maintenance, dépendances

### Branches
- `main` : Production stable
- `develop` : Développement en cours
- `feature/*` : Nouvelles fonctionnalités
- `fix/*` : Corrections de bugs
- `docs/*` : Documentation

## 🔄 Processus de contribution

1. **Fork** le dépôt
2. **Créez** une branche depuis `develop`
   ```bash
   git checkout -b feature/ma-fonctionnalite develop
   ```
3. **Développez** votre fonctionnalité avec des tests
4. **Vérifiez** que tout passe
   ```bash
   npm run test:all
   ```
5. **Committez** avec un message conventionnel
6. **Poussez** votre branche
7. **Ouvrez** une Pull Request vers `develop`

## ✅ Checklist PR

Avant de soumettre une PR, vérifiez :

- [ ] Le code compile sans erreur (`npm run typecheck`)
- [ ] Les tests passent (`npm run test`)
- [ ] Le linter ne signale aucune erreur (`npm run lint`)
- [ ] Les tests E2E passent (`npm run test:e2e`)
- [ ] La documentation est mise à jour si nécessaire
- [ ] Le CHANGELOG est mis à jour pour les changements majeurs

## 🆘 Besoin d'aide ?

- Ouvrez une [Issue](https://github.com/Palolo875/studio/issues)
- Consultez la [documentation](./docs/)
- Rejoignez les discussions

## 📜 Licence

Ce projet est sous licence MIT. Voir [LICENSE](./LICENSE) pour plus de détails.
