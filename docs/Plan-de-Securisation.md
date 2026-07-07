# Plan de sécurisation — (RE)Sources Relationnelles

## 1. Contexte

L'application traite des données à caractère personnel (comptes citoyens, ressources créées par les utilisateurs, commentaires) dans le cadre d'un projet simulant une commande du Ministère des Solidarités et de la Santé. Le plan ci-dessous couvre l'identification des risques, leur criticité, les mesures de chiffrement et de prévention mises en œuvre, ainsi que la conformité RGPD.

## 2. Identification des risques et traitement

| Risque | Vecteur | Criticité | Mesure en place | Statut |
|---|---|---|---|---|
| Vol / fuite de secrets (JWT, identifiants Azure, mots de passe VM) | Code source, logs CI, image Docker | **Critique** | Aucun secret en clair dans le code ni dans l'image ; secrets GitHub Actions scopés au strict nécessaire par job (plus de `secrets: inherit`) ; authentification Azure par identité fédérée OIDC (aucun secret client stocké, aucune rotation à gérer) | ✅ En place |
| Compromission de la chaîne CI/CD (action GitHub malveillante via un tag déplacé) | `uses: action@v4` (tag mutable) | **Élevée** | Toutes les actions du pipeline sont épinglées sur leur SHA de commit complet, pas sur un tag | ✅ En place |
| Mot de passe utilisateur compromis en base | Fuite de la base MongoDB | **Élevée** | Hash bcrypt (jamais de mot de passe en clair, champ `password` exclu par défaut des lectures Mongoose `select: false`) | ✅ En place |
| Usurpation de session / token falsifié | API HTTP | **Élevée** | JWT signé (`JWT_SECRET`), vérifié sur chaque route protégée par le middleware `protect` | ✅ En place |
| Accès non autorisé à une fonctionnalité (élévation de privilège) | API HTTP | **Élevée** | RBAC (`checkRole`) : rôles USER / MODERATOR / ADMIN / GUEST vérifiés à chaque route sensible | ✅ En place |
| Dépendances tierces vulnérables (npm) | `node_modules` | **Élevée** | Scan Snyk à chaque PR (seuil `high`), `npm audit fix` appliqué (ex. CVE `qs`, `axios`, `react-router`, `form-data`, `lodash` corrigées) | ✅ En place, en continu |
| Vulnérabilités du système d'exploitation de l'image Docker | Image de base `node:20-alpine` / `nginx:alpine` | **Élevée** | Scan Trivy à chaque build ; `apk upgrade` en fin de build pour repartir des derniers correctifs OpenSSL/Alpine ; CLI `npm` retiré de l'image finale (surface d'attaque inutile en runtime) | ✅ En place |
| Upload de fichier malveillant / prévisible | `POST /api/resources` (upload d'image) | **Moyenne** | Noms de fichiers générés via `crypto.randomBytes` (non prévisibles, remplace un ancien `Math.random()`) | ✅ En place |
| Exposition de ports/services non nécessaires sur la VM | Groupe de sécurité réseau Azure | **Moyenne** | Seuls les ports 22 (SSH), 80 (front) et 5000 (API) sont ouverts, pas de port MongoDB exposé publiquement | ✅ En place |
| Absence de chiffrement du disque de la VM par une clé dédiée | VM Azure | **Faible** | Chiffrement au repos par défaut via clé gérée par la plateforme Azure (SSE) ; pas de CMK dédiée jugée nécessaire pour un environnement de démonstration | ✅ Accepté (hotspot SonarCloud revu et marqué "Safe") |
| Absence de validation d'entrée centralisée | Controllers Express | **Moyenne** | Validation actuellement au cas par cas ; middleware de validation centralisé (zod/joi) identifié comme amélioration à venir | 🟧 Suivi — [issue #8](https://github.com/X0uill3/-RE-Source-backend/issues/8) |
| Absence de suite de tests sur le frontend | ReSource-Backoffice | **Moyenne** (indirect : réduit la capacité à détecter des régressions de sécurité) | — | 🟧 Suivi — [issue #3](https://github.com/X0uill3/-RE-Source-BackOffice/issues/3) |

## 3. Chiffrement

| Donnée | Au repos | En transit |
|---|---|---|
| Mot de passe utilisateur | Haché (bcrypt, non réversible) | HTTPS (à activer en périphérie/reverse proxy en production — voir recommandations) |
| Session / authentification | Jeton JWT signé (HMAC via `JWT_SECRET`), non stocké côté serveur | Bearer token sur HTTPS |
| Disque de la VM (OS + données applicatives) | Chiffrement au repos par défaut Azure (clé gérée plateforme) | — |
| Secrets d'infrastructure (Azure, registre d'images, base de données) | Jamais committés ; stockés exclusivement dans GitHub Actions Secrets (chiffrés au repos par GitHub) | Injectés en variables d'environnement au moment du déploiement uniquement |
| Communication vers Azure (déploiement CI/CD) | — | OIDC (jeton à courte durée de vie, pas de secret client statique) |

## 4. Prévention des risques — outillage intégré au pipeline

Quatre familles de scans automatisés s'exécutent à chaque changement de code, avant toute mise en production :

1. **SAST — SonarCloud** : analyse statique du code (bugs, vulnérabilités, code smells, hotspots de sécurité, duplication) sur chaque pull request.
2. **SCA — Snyk** : analyse des dépendances npm (bibliothèques tierces) avec seuil de sévérité `high`.
3. **Scan d'image — Trivy** : recherche de CVE dans l'image Docker construite (paquets système + dépendances embarquées), avant tout déploiement en staging.
4. **DAST — OWASP ZAP** : scan dynamique de l'application réellement déployée (API backend + interface frontend) en environnement de staging, avant toute promotion vers la production.

## 5. Conformité RGPD

| Principe RGPD | Application dans le projet |
|---|---|
| Minimisation des données | Le modèle `User` ne collecte que les champs nécessaires au fonctionnement (nom, prénom, email, date de naissance, photo optionnelle) |
| Sécurité des données (art. 32) | Hash des mots de passe, JWT signé, secrets jamais exposés, scans de sécurité continus (voir sections 2 à 4) |
| Droit à l'effacement (art. 17) | Route `DELETE /users/deleteMe` (suppression par l'utilisateur lui-même) et `DELETE /users/:id` (désactivation par un administrateur) |
| Droit de rectification | Route `PATCH /users/updateMe` permettant à l'utilisateur de corriger ses données |
| Limitation de la conservation | Désactivation logique (`systemStatus: Disabled`) plutôt que suppression physique immédiate — permet une purge différée conforme à une politique de rétention à définir avec le porteur du projet |
| Traçabilité minimale | Horodatage (`createdAt`/`updatedAt`) sur l'ensemble des collections (utilisateurs, ressources, commentaires, interactions) |

**Point d'attention à documenter avec le porteur de projet** (non technique, à trancher avec le "Ministère") : durée de conservation exacte des comptes désactivés avant purge définitive, et base légale précise du traitement (consentement vs. intérêt légitime) pour les statistiques d'usage.

## 6. Bonnes pratiques de développement appliquées

- Architecture en couches (route → middleware → controller → repository → model), séparant clairement la logique métier de l'accès aux données.
- Tests automatisés (143 tests Jest, unitaires et d'intégration) exécutés à chaque pull request.
- Quality Gate SonarCloud : notes Sécurité / Fiabilité / Maintenabilité à **A**, duplication de code à 0 % sur le nouveau code.
- Conteneurs applicatifs exécutés avec un utilisateur non privilégié (non-root), aussi bien côté backend que frontend.
- Revue systématique par pull request avant toute fusion vers `develop` ou `main`.

## 7. Recommandations pour la suite

1. Mettre en place un reverse proxy / certificat TLS en périphérie (Let's Encrypt via Nginx ou Azure Application Gateway) pour chiffrer le trafic HTTP public en staging/production — actuellement le trafic entre le client et la VM n'est pas chiffré.
2. Ajouter une validation d'entrée centralisée (zod/joi) — issue déjà ouverte.
3. Mettre en place une politique de rotation du `JWT_SECRET` et raccourcir sa durée de validité (actuellement 90 jours).
4. Ajouter un test automatisé pour le frontend afin de sécuriser les évolutions futures.
