# Stratégie de gestion des versions — (RE)Sources Relationnelles

## 1. Outil

**Git**, hébergé sur **GitHub**, avec un dépôt distinct par composant (`-RE-Source-backend`, `-RE-Source-BackOffice`, mobile) — cohérent avec une architecture multi-services déployée indépendamment mais orchestrée ensemble via `docker-compose.yml`.

## 2. Stratégie de branches

Le modèle retenu est un **Git Flow simplifié**, calqué exactement sur les trois environnements du pipeline CI/CD :

```
feature/xxx ──► develop ──► release/x.y.z ──► main
   (dev)       (intégration)   (staging)      (production)
```

| Branche | Rôle | Protection | Déclenche |
|---|---|---|---|
| `feature/*` | Développement d'une fonctionnalité ou d'un correctif | — | Pipeline d'intégration à l'ouverture d'une PR vers `develop` |
| `develop` | Intégration continue de toutes les fonctionnalités validées | PR obligatoire (pas de push direct en usage normal) | Build + scan de l'image `:canary` |
| `release/x.y.z` | Gel d'une version candidate pour recette en staging | — | Déploiement complet en environnement de staging (Bicep + docker compose + scan ZAP) |
| `main` | Code en production | PR obligatoire | Build + déploiement de l'image `:prod` |

Cette stratégie a l'avantage d'être **directement lisible dans le pipeline** : chaque nom de branche correspond exactement à un environnement et à un tag d'image Docker (`:canary` pour `develop`/`release`, `:prod` pour `main`), ce qui évite toute ambiguïté sur "quelle version tourne où".

## 3. Convention de nommage des commits

Les messages de commit suivent une convention proche de [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` — nouvelle fonctionnalité
- `fix:` — correction de bug ou de vulnérabilité
- `chore:` — tâche d'outillage / configuration sans impact fonctionnel

Exemple tiré de l'historique réel du projet :
```
fix: replace Math.random() with crypto.randomBytes() in upload middleware
fix: exclude CI/CD infrastructure files from SonarCloud analysis
feat: add CI/CD pipeline (GitHub Actions)
```

## 4. Correspondance version applicative / image Docker

| Tag Git | Tag d'image Docker (`ghcr.io`) | Environnement cible |
|---|---|---|
| `develop` (dernier commit) | `:canary` | Staging (recette) |
| `release/x.y.z` | `:canary` (réutilise l'image validée sur `develop`) | Staging (déploiement complet) |
| `main` (dernier commit) | `:prod` | Production |

Le numéro de version (`x.y.z`) de la branche `release/*` suit le [versionnage sémantique](https://semver.org/lang/fr/) : incrément majeur pour une rupture de compatibilité, mineur pour une nouvelle fonctionnalité, correctif pour un bugfix.

## 5. Revue de code

Toute fusion vers `develop` ou `main` passe par une **pull request**, avec :
- l'affichage direct des résultats des checks automatisés (tests, SonarCloud, Snyk) ;
- la possibilité de commenter et de demander des changements avant fusion.
