# Documentation Technique Backend - ReSource

## 1. Objectif
Ce document décrit uniquement le backend de ReSource: architecture, composants, modèle de données, sécurité, API HTTP, tests et exploitation.

## 2. Stack Technique
- Runtime: Node.js
- Langage: TypeScript
- Framework HTTP: Express 5
- Base de données: MongoDB avec Mongoose
- Authentification: JWT (jsonwebtoken)
- Hash de mot de passe: bcryptjs
- Upload de fichiers: multer
- Tests: Jest + Supertest + mongodb-memory-server

## 3. Structure du Projet (Backend)
- src/index.ts: bootstrap Express, middleware globaux, montage des routes, démarrage serveur
- src/config/db.ts: connexion MongoDB
- src/models: schémas Mongoose
- src/repositories: couche d'accès aux données
- src/controllers: logique métier et réponses HTTP
- src/routes: définition des endpoints
- src/middleware: auth JWT, contrôle de rôle, upload
- src/constants: enums métiers (roles, interactions, types de ressource)
- src/tests: tests d'intégration et unitaires
- src/utils/seeder.ts: script d'initialisation de données
- uploads/resources: stockage local des médias uploadés

## 4. Architecture Applicative
Architecture en couches:
1. Route: mappe URL + méthode HTTP vers un contrôleur.
2. Middleware: applique authentification/autorisation et transformations (ex: upload).
3. Controller: valide le contexte fonctionnel et applique les règles métier.
4. Repository: exécute les opérations Mongoose (find, create, update, delete, populate).
5. Model: définit les schémas MongoDB.

Bénéfices:
- séparation claire des responsabilités
- testabilité accrue (controllers testables avec repositories mockés)
- logique d'accès aux données centralisée

## 5. Configuration et Variables d'Environnement
Variables nécessaires:
- PORT: port HTTP du serveur
- MONGO_URI: URI de connexion MongoDB
- JWT_SECRET: secret de signature JWT
- JWT_EXPIRES_IN: durée de validité du token (ex: 90d)
- NODE_ENV: environnement d'exécution (development, test, production)

Important:
- Ne jamais commiter de secrets dans le dépôt.
- Préférer un fichier .env.example sans valeurs sensibles.

## 6. Démarrage et Commandes
Depuis le dossier backend:

- Installer les dépendances:
  npm install

- Lancer en développement:
  npm run dev

- Exécuter les tests:
  npm test

- Couverture de tests:
  npm run test:coverage

- Initialiser des données de démonstration:
  npm run seed

## 7. Initialisation Serveur
Comportement principal (src/index.ts):
- Chargement de l'environnement via dotenv
- Activation CORS
- Parsing JSON via express.json()
- Application du middleware softProtect globalement
- Montage des routeurs sur /api/*
- Exposition statique des uploads via /uploads
- Connexion DB + écoute réseau sauf en mode test

## 8. Sécurité
### 8.1 Authentification JWT
Middleware principal:
- protect: exige un token Bearer valide, charge l'utilisateur, bloque les comptes Disabled
- softProtect: tente d'authentifier; en absence/erreur de token assigne un rôle GUEST

### 8.2 Autorisation RBAC
- checkRole(allowedRoles): bloque en 403 si req.user.role n'est pas autorisé

Rôles supportés:
- USER
- ADMIN
- MODERATOR
- GUEST

### 8.3 Gestion des comptes
- Login refusé si compte Disabled
- protect/softProtect refusent l'accès aux comptes Disabled

## 9. Modèle de Données
## 9.1 User
Collection: User
Champs clés:
- firstname, lastname, email (unique), password (select: false)
- birthdate, picture
- role: USER | ADMIN | MODERATOR | GUEST
- systemStatus: Enabled | Disabled
- timestamps

Règles:
- hash automatique du mot de passe avant sauvegarde
- méthode comparePassword pour la connexion

## 9.2 Categorie
Collection: Categorie
- name
- icon
- color (defaut #000000)
- systemStatus: Enabled | Disabled
- createdAt, updatedAt

## 9.3 TypeRelation
Collection: TypeRelation
- name
- description
- systemStatus: Enabled | Disabled
- createdAt, updatedAt

## 9.4 Ressource
Collection: Ressource
- userId (ref User)
- title, description, content
- picture, path_media
- categorie (ref Categorie)
- typeRelation (ref TypeRelation)
- typeRessource: GAME | ACTIVITY
- visibility: Public | Private | Restricted
- systemStatus: Enabled | Disabled
- views
- start (etat de demarrage)
- createdAt, updatedAt

## 9.5 Comment
Collection: Comment
- content
- date
- authorId (ref User)
- ressourceId (ref Ressource)
- commentId (ref Comment, pour reponses)

Règle:
- suppression en cascade des reponses dans un pre deleteOne

## 9.6 Interaction
Collection: Interaction
- UserId (ref User)
- ressourceId (ref Ressource)
- interactionType: VIEW | FAVORITE | SAVE | SHARE
- ReceiverId (optionnel)
- date

## 10. Couches Repository (Acces Donnees)
Points notables:
- tri centralisé (createdAt, date, views)
- populate sur les ressources: userId, categorie, typeRelation
- méthodes dédiées à certains cas d'usage:
  - findPopular(limit)
  - findByUserId
  - findByIdWithPassword (User)
  - deleteUserInteraction (interaction appartenant a l'utilisateur)

## 11. Upload de Fichiers
Middleware: src/middleware/uploadMiddleware.ts
- stockage local disque dans uploads/resources
- création automatique du dossier si absent
- génération de nom de fichier unique
- route concernée: POST /api/resources (upload.single("image"))

## 12. API REST
Base URL: /api

## 12.1 Auth
- POST /auth/signup: inscription utilisateur, retour token JWT
- POST /auth/login: connexion, retour token JWT

## 12.2 Users
Routes protégées (protect):
- GET /users/me: profil courant
- PATCH /users/updateMe: mise à jour profil courant
- PATCH /users/updateMyPassword: changement de mot de passe
- DELETE /users/deleteMe: suppression de son compte

Routes admin:
- GET /users: liste utilisateurs
- PATCH /users/:id: mise a jour utilisateur (role/statut)
- DELETE /users/:id: desactivation logique du compte
- PATCH /users/:id/reactivate: reactivation

## 12.3 Categories
- GET /categories: categories actives
- GET /categories/:id: categorie active par id
- GET /categories/all: toutes categories (admin)
- POST /categories: creation (admin)
- PATCH /categories/:id: mise a jour (admin)
- PATCH /categories/:id/disable: desactivation (admin)
- PATCH /categories/:id/enable: activation (admin)

## 12.4 TypeRelation
- GET /typeRelation: types actifs
- GET /typeRelation/:id: type par id
- GET /typeRelation/all: tous types (admin)
- POST /typeRelation: creation (admin)
- PATCH /typeRelation/:id: mise a jour (admin)
- PATCH /typeRelation/:id/disable: desactivation (admin)
- PATCH /typeRelation/:id/enable: activation (admin)

## 12.5 Resources
- GET /resources: ressources publiques actives (filtres: categorie, typeRessource, typeRelation, sort)
- GET /resources/restricted: ressources restreintes actives
- GET /resources/popular?limit=10: ressources populaires
- GET /resources/:id: detail + incrementation des vues
- POST /resources: creation (utilisateur connecté), upload image possible
- PATCH /resources/:id: modification (proprietaire ou admin)
- PATCH /resources/:id/validate: validation moderation (admin/moderator)
- PATCH /resources/:id/start: demarrage ressource (auth requis)
- PATCH /resources/:id/stop: arret ressource (auth requis)
- DELETE /resources/:id: desactivation logique (admin)
- GET /resources/user/:id: ressources d'un utilisateur (admin ou proprietaire)

## 12.6 Comments
- GET /comments/ressource/:id: commentaires d'une ressource
- POST /comments/ressource/:id: ajout commentaire (auth requis)
- PATCH /comments/:id: edition (auteur ou admin)
- DELETE /comments/:id: suppression (auteur ou admin)
- GET /comments/user/:id: commentaires d'un utilisateur (admin ou proprietaire)

Routes admin:
- GET /comments/admin/comments: tous les commentaires
- DELETE /comments/ressource/:id: suppression massive par ressource
- DELETE /comments/user/:id: suppression massive par utilisateur

## 12.7 Interactions
Routes protégées (auth requise):
- POST /interactions: creer interaction
- GET /interactions/user: interactions du user courant
- GET /interactions/ressource/:id: interactions d'une ressource
- DELETE /interactions/:id: suppression interaction appartenant au user courant

## 13. Comportements Metier Importants
- Lors de la creation d'une ressource:
  - ADMIN => systemStatus = Enabled
  - USER => systemStatus = Disabled (validation necessaire)
- Lors de la modification d'une ressource par un non-admin:
  - systemStatus repasse a Disabled
- Consultation d'une ressource:
  - incrementation automatique de views
- Desactivation logique privilegiee pour Users, Categories, TypeRelation et Ressources (soft delete par statut)

## 14. Tests
Configuration:
- Jest en mode ESM via ts-jest/presets/default-esm
- environnement Node
- base MongoDB en memoire (mongodb-memory-server)

Types de tests:
- integration: verification des endpoints HTTP
- unitaires: verification de controllers

Exemples verifies:
- healthcheck GET /
- signup/login
- cas d'erreurs repositories (mocks)
- blocage des comptes desactives

## 15. Donnees de Seed
Script: src/utils/seeder.ts
- purge complete des collections
- insertion d'utilisateurs (admin + standard)
- categories et types de relation
- ressources de demonstration
- commentaires (dont reponse)
- interactions

Comptes de test generes:
- admin@test.fr / password123
- alice@test.fr / password123

## 16. Points d'Attention Techniques
- Les secrets sont actuellement dans .env local: a externaliser absolument pour un environnement partage/production.
- startResource et stopResource positionnent tous deux start a false: verifier si startResource doit passer a true.
- Dans createResource, la variable imageUrl est calculee mais le schema utilise picture/path_media: aligner le nommage pour eviter la perte de l'URL image.
- Contrat route/commentaire: POST /comments/ressource/:id existe mais le controller lit ressourceId dans req.body. Harmoniser en utilisant req.params.id.

## 17. Recommandations d'Exploitation
- Ajouter un .env.example sans secrets.
- Mettre en place une validation d'entree centralisee (zod/joi/express-validator).
- Ajouter une gestion d'erreurs globale (middleware error handler unique).
- Ajouter une documentation OpenAPI/Swagger pour le contrat API.
- Ajouter des indexes MongoDB selon les usages (ressourceId, authorId, UserId, systemStatus, createdAt, views).

## 18. Etat Actuel
Le backend est fonctionnel avec:
- API REST complete pour Auth, Users, Categories, TypeRelation, Resources, Comments, Interactions
- RBAC JWT + gestion du statut de compte
- couche repository structuree
- base de tests integration/unitaire

Ce document couvre exclusivement le backend et peut servir de base de passation, d'audit technique et de preparation CI/CD.
