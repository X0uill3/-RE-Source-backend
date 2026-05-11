# ReSource — Backend API

API REST du projet **ReSource**, une plateforme de partage de ressources relationnelles. Construite avec **Node.js**, **Express 5** et **MongoDB**.

---

## Stack technique

| Catégorie | Technologie |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Base de données | MongoDB (Mongoose ODM) |
| Authentification | JWT + bcryptjs |
| Upload de fichiers | Multer |
| Tests | Jest + Supertest + mongodb-memory-server |

---

## Fonctionnalités

- Authentification JWT avec gestion des rôles (RBAC)
- Gestion complète des ressources (CRUD + validation)
- Workflow de modération (les ressources soumises par les utilisateurs doivent être validées)
- Système de commentaires (avec réponses imbriquées)
- Interactions : vues, favoris, sauvegardes, partages
- Upload d'images pour les ressources
- Seeder pour l'initialisation des données de démonstration
- Tests unitaires et d'intégration

---

## Structure du projet

```
backend/
├── src/
│   ├── config/           # Connexion MongoDB
│   ├── constants/        # Rôles, types d'interaction, types de ressource
│   ├── controllers/      # Logique métier
│   ├── middleware/        # Auth JWT, upload fichiers
│   ├── models/           # Schémas Mongoose
│   ├── repositories/     # Couche d'accès aux données
│   ├── routes/           # Définition des routes Express
│   ├── tests/            # Tests unitaires & intégration
│   ├── utils/            # Seeder
│   └── index.ts          # Point d'entrée
├── uploads/resources/    # Fichiers uploadés (local)
├── .env
└── package.json
```

---

## Démarrage

### Prérequis

- Node.js >= 18
- Instance MongoDB (locale ou Atlas)

### Installation

```bash
npm install
```

### Variables d'environnement

Créer un fichier `.env` à la racine :

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=<votre_secret>
JWT_EXPIRES_IN=90d
NODE_ENV=development
```

### Lancement

```bash
# Développement (hot reload)
npm run dev

# Production
npm start
```

### Initialisation des données de démo

```bash
npm run seed
```

Crée les comptes suivants :

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@test.fr` | `password123` | Admin |
| `alice@test.fr` | `password123` | Utilisateur |

---

## Documentation API

**Base URL :** `http://localhost:5000/api`

### Authentification

| Méthode | Route | Description | Auth |
|---|---|---|---|
| POST | `/auth/signup` | Inscription | — |
| POST | `/auth/login` | Connexion | — |

### Utilisateurs

| Méthode | Route | Description | Auth |
|---|---|---|---|
| GET | `/users/me` | Profil de l'utilisateur connecté | JWT |
| PATCH | `/users/updateMe` | Modifier le profil | JWT |
| PATCH | `/users/updateMyPassword` | Changer le mot de passe | JWT |
| DELETE | `/users/deleteMe` | Supprimer le compte | JWT |

### Ressources

| Méthode | Route | Description | Auth |
|---|---|---|---|
| GET | `/resources` | Lister les ressources publiques (filtres disponibles) | Optionnel |
| GET | `/resources/popular` | Ressources populaires | Optionnel |
| GET | `/resources/:id` | Détail d'une ressource | Optionnel |
| POST | `/resources` | Créer une ressource | JWT |
| PATCH | `/resources/:id` | Modifier une ressource | JWT (auteur / admin) |
| PATCH | `/resources/:id/validate` | Valider une ressource | JWT (admin / modérateur) |
| PATCH | `/resources/:id/start` | Activer | JWT (admin) |
| PATCH | `/resources/:id/stop` | Désactiver | JWT (admin) |
| DELETE | `/resources/:id` | Suppression logique | JWT (admin) |

**Filtres disponibles sur `GET /resources` :** `categorie`, `typeRessource`, `typeRelation`, `sort`

### Commentaires

| Méthode | Route | Description | Auth |
|---|---|---|---|
| GET | `/comments/ressource/:id` | Commentaires d'une ressource | — |
| POST | `/comments/ressource/:id` | Ajouter un commentaire | JWT |
| PATCH | `/comments/:id` | Modifier un commentaire | JWT (auteur / admin) |
| DELETE | `/comments/:id` | Supprimer un commentaire | JWT (auteur / admin) |

### Interactions

| Méthode | Route | Description | Auth |
|---|---|---|---|
| POST | `/interactions` | Créer une interaction | JWT |
| GET | `/interactions/user` | Interactions de l'utilisateur | JWT |
| GET | `/interactions/ressource/:id` | Interactions d'une ressource | JWT |
| DELETE | `/interactions/:id` | Supprimer une interaction | JWT |

**Types d'interaction :** `VIEW`, `FAVORITE`, `SAVE`, `SHARE`

### Catégories

| Méthode | Route | Description | Auth |
|---|---|---|---|
| GET | `/categories` | Lister les catégories actives | — |
| GET | `/categories/:id` | Détail d'une catégorie | — |
| POST | `/categories` | Créer | JWT (admin) |
| PATCH | `/categories/:id` | Modifier | JWT (admin) |
| PATCH | `/categories/:id/disable` | Désactiver | JWT (admin) |
| PATCH | `/categories/:id/enable` | Activer | JWT (admin) |

### Types de relation

| Méthode | Route | Description | Auth |
|---|---|---|---|
| GET | `/typeRelation` | Lister | — |
| GET | `/typeRelation/:id` | Détail | — |
| POST | `/typeRelation` | Créer | JWT (admin) |
| PATCH | `/typeRelation/:id` | Modifier | JWT (admin) |

---

## Système d'authentification

Les requêtes protégées nécessitent un header :

```
Authorization: Bearer <token>
```

### Rôles

| Rôle | Description |
|---|---|
| `GUEST` | Accès lecture seule (token absent ou invalide) |
| `USER` | Compte utilisateur standard |
| `MODERATOR` | Peut valider des ressources |
| `ADMIN` | Accès complet |

---

## Tests

```bash
# Lancer les tests
npm test

# Rapport de couverture
npm run test:coverage
```

Les tests d'intégration utilisent `mongodb-memory-server` (base de données en mémoire, aucune instance MongoDB requise).
