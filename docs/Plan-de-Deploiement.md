# Plan de déploiement — (RE)Sources Relationnelles

## 1. Environnements

| Environnement | Déclencheur | Infrastructure | Usage |
|---|---|---|---|
| **Local** | — | Poste développeur, MongoDB local ou Atlas | Développement quotidien |
| **Intégration (CI)** | Pull request → `develop` | Runners GitHub Actions (éphémères) | Validation automatique de chaque contribution avant fusion |
| **Staging** | Push → `develop` (build image) / push → `release/*` (déploiement) | VM Azure Linux (`RessourcesRelationnelles-Staging`) | Recette, démonstration, scan de sécurité dynamique (DAST) |
| **Production** | Pull request → `main` (build image) / push → `main` (déploiement) | VM Azure Linux (`RessourcesRelationnelles-Production`) | Mise à disposition réelle |

Chaque environnement est isolé (groupe de ressources Azure dédié, base MongoDB dédiée), pour qu'un incident en staging n'affecte jamais la production.

## 2. Ordonnancement des étapes

Le pipeline est découpé en trois workflows GitHub Actions séquentiels, chacun conditionné par la branche/l'évènement Git :

```
01 - Integration            02 - Staging                      03 - Production
(PR → develop)               (push develop / release/*)        (PR / push → main)
─────────────────            ─────────────────────────         ───────────────────
┌───────────┐                ┌───────────────────┐             ┌───────────────────┐
│  Test      │──┐            │ Build + Push       │             │ Build + Push       │
│ (Jest)     │  │            │ image :canary       │             │ image :prod        │
└───────────┘  ├─►           │ (push develop)      │             │ (PR → main)        │
┌───────────┐  │             └────────┬───────────┘             └────────┬───────────┘
│ SonarCloud │──┤                      ▼                                  ▼
│ (SAST)     │  │             ┌───────────────────┐             ┌───────────────────┐
└───────────┘  │             │ Scan Trivy          │             │ Déploiement Azure   │
┌───────────┐  │             │ (image :canary)     │             │ (push → main)       │
│ Snyk       │──┘             └────────┬───────────┘             └───────────────────┘
│ (SCA)      │                          ▼ (push release/*)
└───────────┘                ┌───────────────────┐
                              │ Bicep Deploy        │
                              │ (provisionne la VM) │
                              └────────┬───────────┘
                                       ▼
                              ┌───────────────────┐
                              │ Deploy App          │
                              │ (docker compose up) │
                              └────────┬───────────┘
                                       ▼
                              ┌───────────────────┐
                              │ Scan ZAP (DAST)     │
                              │ back + front        │
                              └───────────────────┘
```

Chaque étape ne se déclenche que si la précédente réussit (`needs:` dans GitHub Actions) — un échec de test bloque le build, un échec de build bloque le déploiement.

## 3. Affectation des ressources

| Étape | Responsable / exécutant | Outil |
|---|---|---|
| Écriture de code, revue de PR | Développeurs de l'équipe | GitHub (pull requests) |
| Exécution des tests, scans, builds | Automatisée — runners GitHub Actions (`ubuntu-latest` / `ubuntu-22.04`) | GitHub Actions |
| Authentification aux ressources Azure | Automatisée — identité fédérée OIDC (aucun secret stocké) | Azure AD Workload Identity Federation |
| Provisioning infrastructure | Automatisé — template Bicep (`main.bicep`) | Azure Resource Manager |
| Décision de merge vers `develop` / `main` | Équipe (revue humaine) | GitHub (pull requests) |
| Décision de créer une branche `release/*` | Équipe | Git |

## 4. Communication auprès des acteurs

- **Pull requests GitHub** : chaque changement passe par une PR, avec les résultats des checks (tests, Sonar, Snyk) visibles directement dans l'interface avant toute décision de fusion.
- **GitHub Issues** : suivi des anomalies et des demandes d'évolution, visible par toute l'équipe (voir stratégie de gestion des évolutions).
- **Rapports d'analyse** : SonarCloud (qualité/sécurité du code), Snyk (dépendances), Trivy (image Docker/CVE système) et ZAP (dynamique) publient chacun un rapport consultable (commentaire de PR ou artefact téléchargeable) à chaque exécution.

## 5. Indicateurs de suivi

| Indicateur | Source | Où le consulter |
|---|---|---|
| Statut des tests (pass/fail, nombre) | Jest (`npm run test:coverage`) | Job `Test` du workflow 01 |
| Couverture de code | Jest + SonarCloud | Rapport SonarCloud |
| Quality Gate (bugs, vulnérabilités, hotspots, duplication) | SonarCloud | Dashboard SonarCloud + commentaire de PR |
| Vulnérabilités des dépendances | Snyk | Artefact `snyk-results` |
| Vulnérabilités de l'image Docker (OS + libs) | Trivy | Artefact `trivy-results` |
| Vulnérabilités applicatives dynamiques | OWASP ZAP | Issue GitHub créée automatiquement en cas d'alerte |
| Succès/échec de chaque déploiement | GitHub Actions (historique des runs) | Onglet Actions du dépôt |
| IP publique et disponibilité de la VM | Sortie du job Bicep (`vm_ip`) | Logs du workflow |

## 6. Outils utilisés

- **Versioning** : Git / GitHub (voir `Strategie-Versioning.md`)
- **CI/CD** : GitHub Actions (workflows réutilisables, déclenchement par branche)
- **Conteneurisation** : Docker (image multi-stage, exécution non-root)
- **Registre d'images** : GitHub Container Registry (`ghcr.io`)
- **Infrastructure as Code** : Bicep (VM Linux Azure, réseau, groupe de sécurité)
- **Orchestration de déploiement** : Docker Compose (backend + frontend + MongoDB) via SSH
- **Qualité/Sécurité** : SonarCloud (SAST), Snyk (SCA), Trivy (scan image), OWASP ZAP (DAST)

## 7. État actuel (au 07/07/2026)

- Pipeline d'intégration (01) : opérationnel et validé sur backend et frontend.
- Build + scan de l'image canary (02, partie build) : opérationnel et validé sur backend et frontend.
- Déploiement Azure de la VM de staging (Bicep) : validé en conditions réelles.
- Démarrage de l'application complète (backend + frontend + MongoDB) en staging : en cours de validation (voir suivi des runs sur `release/*`).
- Pipeline de production (03) : jamais encore exécuté en conditions réelles — prochaine étape après validation complète du staging.
