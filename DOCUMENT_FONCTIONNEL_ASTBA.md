# 📘 Document Fonctionnel Détaillé — Plateforme ASTBA

> **Association Sciences and Technology Ben Arous**
> Plateforme de Gestion des Formations et du Suivi de Présence
>
> Version : 1.0 — Février 2026

---

## Table des Matières

1. [Présentation Générale](#1-présentation-générale)
2. [Architecture Technique](#2-architecture-technique)
3. [Acteurs du Système](#3-acteurs-du-système)
4. [Module 1 — Authentification & Sécurité](#4-module-1--authentification--sécurité)
5. [Module 2 — Gestion des Utilisateurs (Admin)](#5-module-2--gestion-des-utilisateurs-admin)
6. [Module 3 — Gestion des Étudiants](#6-module-3--gestion-des-étudiants)
7. [Module 4 — Gestion des Formations](#7-module-4--gestion-des-formations)
8. [Module 5 — Gestion des Groupes](#8-module-5--gestion-des-groupes)
9. [Module 6 — Inscriptions (Enrollments)](#9-module-6--inscriptions-enrollments)
10. [Module 7 — Planification des Séances](#10-module-7--planification-des-séances)
11. [Module 8 — Marquage des Présences](#11-module-8--marquage-des-présences)
12. [Module 9 — Suivi de Progression](#12-module-9--suivi-de-progression)
13. [Module 10 — Certificats](#13-module-10--certificats)
14. [Module 11 — Notifications](#14-module-11--notifications)
15. [Module 12 — Notifications WhatsApp (n8n)](#15-module-12--notifications-whatsapp-n8n)
16. [Module 13 — Accessibilité](#16-module-13--accessibilité)
17. [Module 14 — Intelligence Artificielle (Perplexity)](#17-module-14--intelligence-artificielle-perplexity)
18. [Module 15 — Upload de Fichiers](#18-module-15--upload-de-fichiers)
19. [Tableau de Bord](#19-tableau-de-bord)
20. [Internationalisation (i18n)](#20-internationalisation-i18n)
21. [Annexes — Modèle de Données](#21-annexes--modèle-de-données)

---

## 1. Présentation Générale

**ASTBA** est une plateforme web complète de gestion des formations et de suivi de présence pour l'Association Sciences and Technology Ben Arous (Tunisie). Elle permet de :

- Gérer les formations structurées en 4 niveaux × 6 séances (24 séances par formation)
- Organiser les groupes d'élèves avec des créneaux horaires
- Planifier et suivre les séances avec affectation de formateurs
- Marquer les présences en temps réel
- Calculer automatiquement la progression des élèves
- Délivrer des certificats PDF aux élèves ayant validé les 4 niveaux
- Envoyer des notifications WhatsApp automatiques via n8n
- Fournir une interface bilingue (Arabe tunisien / Français) avec support RTL
- Offrir des fonctionnalités d'accessibilité (TTS, Zoom, Curseur personnalisé)
- Intégrer l'IA (Perplexity) pour l'explication de pages et le chatbot

---

## 2. Architecture Technique

### Stack Technologique

| Composant | Technologie | Version |
|-----------|------------|---------|
| **Frontend** | Next.js (Turbopack), React, TypeScript, Tailwind CSS | 16.1.6 |
| **Backend** | Spring Boot, Java, Maven | 3.2.3 / Java 17 |
| **Base de données** | MongoDB Atlas | Cloud |
| **Hébergement Backend** | Heroku | EU |
| **Hébergement Frontend** | Vercel | — |
| **Domaine** | www.astba.tech | — |
| **Automatisation** | n8n Cloud | — |
| **API WhatsApp** | Facebook Graph API v22.0 | — |
| **IA** | Perplexity API (modèle `sonar`) | — |
| **PDF** | Apache PDFBox | — |

### Architecture Applicative

```
┌──────────────────────────────────────────────┐
│              Frontend (Next.js)               │
│   www.astba.tech — Vercel                     │
│   ┌──────────────────────────────────────┐   │
│   │  Pages App Router                     │   │
│   │  /login, /dashboard, /students, ...   │   │
│   └──────────┬───────────────────────────┘   │
│              │ Proxy /api/* (rewrites)        │
└──────────────┼───────────────────────────────┘
               │ HTTPS + Cookies HttpOnly
┌──────────────┴───────────────────────────────┐
│              Backend (Spring Boot)             │
│   astba-backend.herokuapp.com                  │
│   ┌───────────────────────────────────────┐   │
│   │  REST Controllers                      │   │
│   │  JWT Auth + OAuth2 Google              │   │
│   │  Services métier                        │   │
│   └──────────┬────────────────────────────┘   │
│              │                                 │
│   ┌──────────┴────────────────────────────┐   │
│   │  MongoDB Atlas                         │   │
│   │  Collections: users, students,         │   │
│   │  trainings, groups, enrollments,       │   │
│   │  seances, session_reports,             │   │
│   │  notifications, images                 │   │
│   └───────────────────────────────────────┘   │
│              │                                 │
│   ┌──────────┴────────────────────────────┐   │
│   │  n8n Cloud (Webhooks)                  │   │
│   │  → WhatsApp Business API               │   │
│   └───────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

### Stratégie d'Authentification

Les cookies HttpOnly (`access_token`, `refresh_token`) sont définis par le backend Spring Boot. Le frontend utilise `credentials: 'include'` sur toutes les requêtes. Le middleware Next.js proxy les appels `/api/*` vers le backend, garantissant que les cookies vivent sur le même domaine que le frontend.

---

## 3. Acteurs du Système

### 3.1 Rôles et Permissions

| Rôle | Code | Description |
|------|------|-------------|
| **Administrateur** | `ADMIN` | Accès total : gestion utilisateurs, formations, élèves, groupes, présences, certificats, panel admin |
| **Manager** | `MANAGER` | Formations, élèves, groupes, inscriptions, présences, certificats (pas de panel admin) |
| **Formateur** | `TRAINER` | Consultation + marquage des présences + rapport de séances uniquement |

### 3.2 Matrice des Permissions Détaillée

| Fonctionnalité | ADMIN | MANAGER | TRAINER |
|----------------|:-----:|:-------:|:-------:|
| Gestion des utilisateurs | ✅ | ❌ | ❌ |
| Créer/Modifier/Supprimer un utilisateur | ✅ | ❌ | ❌ |
| Changer les rôles d'un utilisateur | ✅ | ❌ | ❌ |
| Activer/Désactiver un utilisateur | ✅ | ❌ | ❌ |
| Créer/Modifier/Supprimer un étudiant | ✅ | ✅ | ❌ |
| Consulter les étudiants | ✅ | ✅ | ✅ |
| Créer/Modifier/Supprimer une formation | ✅ | ✅ | ❌ |
| Consulter les formations | ✅ | ✅ | ✅ |
| Uploader un document PDF de formation | ✅ | ✅ | ❌ |
| Créer/Modifier/Supprimer un groupe | ✅ | ✅ | ❌ |
| Ajouter/Retirer un élève d'un groupe | ✅ | ✅ | ❌ |
| Inscrire un élève à une formation | ✅ | ✅ | ❌ |
| Réaffecter un élève à un autre groupe | ✅ | ✅ | ❌ |
| Planifier une séance | ✅ | ✅ | ❌ |
| Modifier/Supprimer une séance | ✅ | ✅ | ❌ |
| Changer le statut d'une séance | ✅ | ✅ | ✅ |
| Terminer une séance | ✅ | ✅ | ✅ |
| Marquer les présences | ✅ | ✅ | ✅ |
| Reporter une séance | ✅ | ✅ | ✅ |
| Consulter la progression | ✅ | ✅ | ✅ |
| Vérifier l'éligibilité au certificat | ✅ | ✅ | ❌ |
| Télécharger le certificat PDF | ✅ | ✅ | ❌ |
| Uploader des images | ✅ | ✅ | ❌ |
| Consulter les notifications | ✅ | ✅ | ✅ |
| Voir « Mes séances » | ❌ | ❌ | ✅ |
| Accéder au panel /admin | ✅ | ❌ | ❌ |

---

## 4. Module 1 — Authentification & Sécurité

### 4.1 Inscription (Register)

**Endpoint** : `POST /api/auth/register`
**Acteurs** : Visiteur non authentifié
**Condition** : `astba.public-register` doit être `true`

#### Scénario Complet

1. L'utilisateur accède à `/register`
2. Il remplit le formulaire : prénom, nom, email, mot de passe
3. **Contrôles de validation** :
   - Email : format valide, unique dans la base
   - Mot de passe : minimum requis (via `@Valid`)
   - Prénom / Nom : champs obligatoires
4. Le backend crée l'utilisateur avec :
   - `provider = LOCAL`
   - `roles = {TRAINER}` (rôle par défaut)
   - `status = ACTIVE`
   - Mot de passe hashé via BCrypt
5. Réponse : objet `AuthResponse` avec les infos utilisateur
6. L'utilisateur est redirigé vers `/login`

#### Conditions d'erreur

| Condition | Erreur | Code HTTP |
|-----------|--------|-----------|
| Email déjà utilisé | « Email déjà enregistré » | 409 Conflict |
| Inscription publique désactivée | « Inscription désactivée » | 403 Forbidden |
| Données invalides | Détails de validation | 400 Bad Request |

---

### 4.2 Connexion par Email/Mot de passe

**Endpoint** : `POST /api/auth/login`
**Acteurs** : Utilisateur enregistré

#### Scénario Complet

1. L'utilisateur accède à `/login`
2. Il saisit email + mot de passe
3. **Validation côté frontend** (Zod schema) :
   - Email : format valide, obligatoire
   - Mot de passe : obligatoire
4. Le frontend envoie la requête via le proxy Next.js (`/api/auth/login`)
5. Le backend :
   a. Recherche l'utilisateur par email
   b. Vérifie le mot de passe via BCrypt
   c. Vérifie que `status != DISABLED`
   d. Génère un `accessToken` JWT (durée : 15 min)
   e. Génère un `refreshToken` JWT (durée : 7 jours)
   f. Stocke le refresh token en base
   g. Définit les cookies HttpOnly :
      - `access_token` : SameSite=None, Secure=true
      - `refresh_token` : SameSite=None, Secure=true, path=/api/auth
   h. Met à jour `lastLoginAt`
6. Le frontend reçoit `AuthResponse` et redirige vers `/dashboard`

#### Conditions d'erreur

| Condition | Erreur | Code HTTP |
|-----------|--------|-----------|
| Email non trouvé | « Identifiants invalides » | 401 |
| Mot de passe incorrect | « Identifiants invalides » | 401 |
| Compte désactivé | « Compte désactivé » | 403 |

---

### 4.3 Connexion Google OAuth2

**Endpoint** : `GET /oauth2/authorization/google` (Spring Security)
**Acteurs** : Utilisateur (avec compte Google)
**Prérequis** : Profil Spring `oauth` activé + `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` configurés

#### Scénario Complet

1. L'utilisateur clique « Se connecter avec Google » sur `/login`
2. Le frontend redirige vers `{BACKEND_URL}/oauth2/authorization/google`
3. Spring Security redirige vers Google Accounts
4. L'utilisateur s'authentifie chez Google et autorise l'accès (scopes : `openid, profile, email`)
5. Google redirige vers `{BACKEND_URL}/login/oauth2/code/google` avec le code d'autorisation
6. Spring Security échange le code contre les tokens Google
7. `OAuth2AuthenticationSuccessHandler` s'exécute :
   a. Extraire les attributs : `sub`, `email`, `given_name`, `family_name`, `email_verified`
   b. Appeler `authService.findOrCreateGoogleUser()` :
      - Si l'email existe → mettre à jour le provider, le `providerId`, `lastLoginAt`
      - Si l'email est nouveau → créer un nouvel utilisateur avec `provider=GOOGLE`, `roles={TRAINER}`
   c. **Contrôle** : si `email_verified == false` → erreur `BadRequestException`
   d. Générer un code unique temporaire via `OAuth2CodeStore`
   e. Rediriger vers `{FRONTEND_URL}/auth/callback?provider=google&code={CODE}`
8. La page `/auth/callback` du frontend :
   a. Récupère le paramètre `code`
   b. Appelle `POST /api/auth/oauth2-exchange?code={CODE}` via le proxy
   c. Le backend échange le code contre des cookies JWT (access + refresh)
   d. Appelle `GET /api/auth/me` pour charger le profil
   e. Redirige vers `/dashboard`

#### Flux en cas d'échec

1. `OAuth2AuthenticationFailureHandler` intercepte l'erreur
2. Redirige vers `{FRONTEND_URL}/login?error=oauth2`
3. La page login affiche le message d'erreur OAuth

#### Conditions d'erreur

| Condition | Erreur | Code HTTP |
|-----------|--------|-----------|
| Email Google non vérifié | « L'email Google n'est pas vérifié » | 400 |
| Code expiré ou invalide | « Code invalide ou expiré » | 401 |
| OAuth2 non configuré | Pas de bouton Google affiché | — |

---

### 4.4 Rafraîchissement du Token

**Endpoint** : `POST /api/auth/refresh`

#### Scénario

1. Le cookie `access_token` expire (après 15 min)
2. Le frontend reçoit une erreur 401
3. L'`AuthProvider` tente automatiquement un refresh
4. Le backend extrait le `refresh_token` du cookie
5. Vérifie la validité du refresh token en base
6. Génère un nouveau couple access/refresh
7. Remplace les cookies
8. Retourne le profil utilisateur mis à jour

---

### 4.5 Déconnexion

**Endpoint** : `POST /api/auth/logout`

#### Scénario

1. L'utilisateur clique « Déconnexion »
2. Le backend révoque le refresh token en base
3. Efface les cookies (`access_token`, `refresh_token`)
4. Le frontend vide le state d'authentification
5. Redirige vers `/login`

---

### 4.6 Middleware de Protection des Routes

**Fichier** : `middleware.ts`

#### Routes protégées

| Préfixe | Requiert authentification |
|---------|:------------------------:|
| `/dashboard` | ✅ |
| `/students` | ✅ |
| `/trainings` | ✅ |
| `/attendance` | ✅ |
| `/certificates` | ✅ |
| `/admin` | ✅ |
| `/login`, `/register` | ❌ |
| `/auth/callback` | ❌ |
| `/_next`, `/api`, fichiers statiques | ❌ (skip) |

#### Logique

1. Vérifier la présence d'un cookie d'auth (`JSESSIONID`, `access_token`, `SESSION`, `jwt`)
2. Si route protégée + pas de cookie → redirection vers `/login?redirect={pathname}`
3. La vérification complète du token se fait côté client via `AuthProvider`

---

## 5. Module 2 — Gestion des Utilisateurs (Admin)

**Routes** : `/admin/users`
**Acteurs** : ADMIN uniquement
**Contrôle d'accès** : `@PreAuthorize("hasRole('ADMIN')")` sur tout le contrôleur

### 5.1 Lister les Utilisateurs

**Endpoint** : `GET /api/admin/users?q={recherche}&page={0}&size={20}`

#### Scénario

1. L'admin accède à `/admin/users`
2. Liste paginée de tous les utilisateurs
3. Recherche optionnelle par nom/email via le paramètre `q`
4. Affiche : email, nom, rôles, statut, date de création

---

### 5.2 Modifier les Rôles d'un Utilisateur

**Endpoint** : `PATCH /api/admin/users/{userId}/roles`

#### Scénario

1. L'admin sélectionne un utilisateur
2. Modifie ses rôles : `ADMIN`, `MANAGER`, `TRAINER` (set de rôles)
3. **Contrôles** :
   - L'utilisateur cible doit exister
   - Les rôles doivent être valides (`ADMIN`, `MANAGER`, `TRAINER`)
4. Sauvegarde en base
5. La réponse inclut l'utilisateur mis à jour

---

### 5.3 Modifier le Statut d'un Utilisateur

**Endpoint** : `PATCH /api/admin/users/{userId}/status`

#### Scénario

1. L'admin peut activer ou désactiver un compte
2. Statuts possibles : `ACTIVE`, `DISABLED`, `PENDING`
3. Un utilisateur `DISABLED` ne peut plus se connecter

---

### 5.4 Créer un Utilisateur (Admin)

**Endpoint** : `POST /api/admin/users`

#### Scénario

1. L'admin remplit le formulaire de création
2. Champs : email, mot de passe, prénom, nom, rôles
3. L'utilisateur est créé avec le statut `ACTIVE`
4. Le mot de passe est hashé avec BCrypt

---

## 6. Module 3 — Gestion des Étudiants

**Routes** : `/students`, `/students/new`, `/students/{id}`
**Acteurs** : Tous les rôles (consultation), MANAGER/ADMIN (CRUD)

### 6.1 Lister les Étudiants

**Endpoint** : `GET /api/students?query={recherche}&page={0}&size={20}`

#### Scénario

1. Accéder à `/students`
2. Liste paginée avec recherche par nom, prénom ou email
3. Affiche : photo, nom complet, email, téléphone, date de naissance, notes
4. Boutons d'action : voir détail, modifier, supprimer (MANAGER/ADMIN)

---

### 6.2 Créer un Étudiant

**Endpoint** : `POST /api/students`
**Acteurs** : MANAGER, ADMIN

#### Scénario Complet

1. L'utilisateur accède à `/students/new`
2. Remplit le formulaire :
   - **Obligatoires** : Prénom, Nom
   - **Optionnels** : Date de naissance, Téléphone, Email, Image (URL), Notes
3. **Contrôles de validation** :
   - Prénom et nom : non vides
   - Email : format valide si fourni
   - Téléphone : 8 chiffres (format tunisien) si fourni
4. Sauvegarde en base avec horodatage `createdAt`
5. Redirection vers la liste des étudiants

---

### 6.3 Détail d'un Étudiant

**Route** : `/students/{id}`

#### Scénario

1. Page avec 4 onglets :
   - **Vue d'ensemble** : Informations personnelles complètes
   - **Formations** : Liste des inscriptions (Enrollments) avec training, groupe, date d'inscription
   - **Progression** : Barres de progression par formation, niveaux validés, séances manquées
   - **Historique** : Tableau des présences (Niveau, Séance, Statut avec badge couleur, Date)
2. Les données viennent de plusieurs endpoints : `/api/students/{id}`, `/api/students/{id}/enrollments`, `/api/students/{id}/progress`

---

### 6.4 Modifier / Supprimer un Étudiant

**Endpoints** : `PUT /api/students/{id}`, `DELETE /api/students/{id}`
**Acteurs** : MANAGER, ADMIN

#### Contrôles

- L'étudiant doit exister (sinon 404)
- La suppression supprime l'étudiant de la collection `students`

---

## 7. Module 4 — Gestion des Formations

**Routes** : `/trainings`, `/trainings/new`, `/trainings/{id}`
**Acteurs** : Tous (consultation), MANAGER/ADMIN (CRUD)

### 7.1 Structure d'une Formation

Chaque formation est composée de :
- **4 niveaux** (`Level`) numérotés de 1 à 4
- Chaque niveau contient **6 séances** (`Session`) numérotées de 1 à 6
- **Total : 24 séances par formation**

Chaque `Session` possède un `sessionId` (UUID stable) utilisé pour le suivi de présence.

---

### 7.2 Créer une Formation

**Endpoint** : `POST /api/trainings`
**Acteurs** : MANAGER, ADMIN

#### Scénario Complet

1. L'utilisateur accède à `/trainings/new`
2. Remplit :
   - **Titre** : obligatoire (ex: « Formation Robotique »)
   - **Description** : optionnelle
3. **Auto-génération** : Si les niveaux ne sont pas fournis manuellement, le backend génère automatiquement 4 niveaux × 6 séances = 24 séances avec des titres par défaut (« Niveau 1 – Séance 1 », etc.)
4. Chaque séance reçoit un UUID unique comme `sessionId`
5. Sauvegarde en base avec horodatage

---

### 7.3 Liste Aplatie des Séances

**Endpoint** : `GET /api/trainings/{trainingId}/sessions`

Retourne les 24 séances dans un format aplati (`FlatSessionResponse`) pour une utilisation facile dans l'interface :

| Champ | Description |
|-------|------------|
| `sessionId` | UUID de la séance |
| `levelNumber` | Numéro du niveau (1-4) |
| `sessionNumber` | Numéro de la séance (1-6) |
| `title` | Titre composé (ex: « Niveau 2 – Séance 3 ») |

---

### 7.4 Gestion des Documents PDF

**Endpoints** :
- `POST /api/trainings/{id}/document` — Upload
- `GET /api/trainings/{id}/document` — Téléchargement
- `DELETE /api/trainings/{id}/document` — Suppression

#### Scénario

1. Le manager uploade un fichier PDF via le formulaire de formation
2. Le fichier est converti en Base64 et stocké dans le champ `documentBase64` du document `Training`
3. Le nom original est conservé dans `documentFilename`
4. Le PDF est servi avec cache 30 jours et Content-Disposition `inline`

#### Contrôles

- Type de fichier : PDF uniquement
- Taille maximale : 5 MB (configuré dans `spring.servlet.multipart`)

---

## 8. Module 5 — Gestion des Groupes

**Routes** : `/groups`
**Acteurs** : Tous (consultation), MANAGER/ADMIN (CRUD)

### 8.1 Concept de Groupe

Un `Group` lie une formation à une cohorte d'élèves avec un créneau horaire :
- **Nom** : ex: « Groupe A »
- **Formation associée** : `trainingId`
- **Horaire** : Jour de la semaine (`DayOfWeek`), heure de début, heure de fin
- **Formateur** : `trainerId` (optionnel)
- **Liste d'élèves** : `studentIds[]`

---

### 8.2 Créer un Groupe

**Endpoint** : `POST /api/groups`
**Acteurs** : MANAGER, ADMIN

#### Scénario

1. Choisir la formation associée
2. Définir le nom du groupe
3. Configurer le créneau : jour, heure début, heure fin
4. Optionnellement assigner un formateur
5. Sauvegarde

---

### 8.3 Ajouter / Retirer des Élèves

**Endpoints** :
- `POST /api/groups/{groupId}/students/{studentId}` — Ajouter
- `DELETE /api/groups/{groupId}/students/{studentId}` — Retirer

#### Contrôles

- L'élève doit exister
- Le groupe doit exister
- L'élève ne doit pas être déjà dans le groupe (pour l'ajout)

---

### 8.4 Filtrer par Formation

**Endpoint** : `GET /api/groups?trainingId={id}`

Retourne uniquement les groupes liés à une formation spécifique.

---

## 9. Module 6 — Inscriptions (Enrollments)

**Acteurs** : MANAGER, ADMIN

### 9.1 Concept d'Inscription

Un `Enrollment` est le lien entre un étudiant et une formation :

| Champ | Description |
|-------|------------|
| `studentId` | Référence à l'étudiant |
| `trainingId` | Référence à la formation |
| `groupId` | Groupe affecté |
| `enrolledAt` | Date d'inscription |
| `attendance` | `Map<sessionId, AttendanceEntry>` — suivi de présence par séance |
| `progressSnapshot` | Instantané calculé de la progression |

**Contrainte d'unicité** : Un étudiant ne peut être inscrit qu'une seule fois à une formation (index composé `studentId + trainingId`).

---

### 9.2 Inscrire un Étudiant

**Endpoint** : `POST /api/enrollments`

#### Scénario

1. Sélectionner l'étudiant et la formation
2. Choisir le groupe d'affectation
3. **Contrôles** :
   - L'étudiant doit exister
   - La formation doit exister
   - Le groupe doit exister et être lié à cette formation
   - L'inscription ne doit pas déjà exister (contrainte d'unicité)
4. L'enrollment est créé avec `attendance = {}` (vide) et `progressSnapshot = null`
5. L'horodatage `enrolledAt` est défini

---

### 9.3 Réaffecter un Élève à un Autre Groupe

**Endpoint** : `PUT /api/enrollments/{enrollmentId}/group/{newGroupId}`

#### Scénario d'utilisation

Quand un élève rate une séance dans son groupe, le manager peut le réaffecter temporairement à un autre groupe pour rattraper. L'historique de présence est conservé car il est lié aux `sessionId` (qui sont les mêmes pour tous les groupes d'une même formation).

---

### 9.4 Consulter les Inscriptions

**Endpoints** :
- `GET /api/students/{studentId}/enrollments` — Inscriptions d'un élève
- `GET /api/trainings/{trainingId}/enrollments` — Inscriptions à une formation
- `GET /api/enrollments/{enrollmentId}` — Détail d'une inscription

---

## 10. Module 7 — Planification des Séances

**Routes** : Planning Calendar dans `/dashboard`
**Acteurs** : MANAGER/ADMIN (planification), TRAINER (consultation + exécution)

### 10.1 Concept de Séance (Seance)

Une `Seance` est l'occurrence physique d'une session de formation :

| Champ | Description |
|-------|------------|
| `trainingId` | Formation concernée |
| `sessionId` | UUID de la session (dans Training.levels[].sessions[]) |
| `groupId` | Groupe d'élèves |
| `trainerId` | Formateur assigné |
| `date` | Date de la séance |
| `startTime` / `endTime` | Horaires |
| `status` | Statut : `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `REPORTED`, `CANCELLED` |
| `levelNumber` / `sessionNumber` | Pour affichage (ex: Niveau 2, Séance 3) |
| `title` | Titre lisible (ex: « Niveau 1 – Séance 3 ») |

---

### 10.2 Planifier une Séance

**Endpoint** : `POST /api/seances`
**Acteurs** : MANAGER, ADMIN

#### Scénario Complet

1. Depuis le calendrier de planning, le manager crée une séance
2. Champs à remplir :
   - Formation, Niveau, Session (parmi les 24)
   - Groupe d'élèves
   - Formateur (choisi parmi les formateurs actifs)
   - Date, heure de début, heure de fin
3. **Contrôles** :
   - Vérification de la disponibilité du formateur (`GET /api/seances/availability`)
   - Le formateur ne doit pas avoir de chevauchement horaire
   - La session doit exister dans la formation
4. Statut initial : `PLANNED`
5. **Notification automatique** : WhatsApp envoyé au formateur via n8n (`notifyTrainerAssigned`)

---

### 10.3 Cycle de Vie d'une Séance

```
PLANNED → IN_PROGRESS → COMPLETED
    ↓                       ↑
    └→ REPORTED ────────────┘
    ↓
    └→ CANCELLED
```

| Transition | Acteur | Action |
|-----------|--------|--------|
| PLANNED → IN_PROGRESS | TRAINER/MANAGER/ADMIN | Changer le statut |
| IN_PROGRESS → COMPLETED | TRAINER/MANAGER/ADMIN | Appeler `POST /seances/{id}/complete` (après marquage des présences) |
| PLANNED → REPORTED | TRAINER | Reporter la séance (`POST /seances/{id}/report`) |
| * → CANCELLED | MANAGER/ADMIN | Annuler la séance |

---

### 10.4 Reporter une Séance

**Endpoint** : `POST /api/seances/{id}/report`
**Acteurs** : TRAINER, MANAGER, ADMIN

#### Scénario

1. Le formateur doit reporter une séance (empêchement, absence d'élèves, etc.)
2. Il remplit :
   - **Raison** : texte libre (obligatoire)
   - **Date suggérée** : nouvelle date proposée (optionnel)
3. Un `SessionReport` est créé avec `reportStatus = PENDING`
4. Le statut de la séance passe à `REPORTED`
5. **Notification WhatsApp** envoyée aux managers via n8n (`notifySeanceReported`)

---

### 10.5 Mes Séances (Formateur)

**Endpoint** : `GET /api/seances/my`
**Acteurs** : TRAINER

#### Scénario

1. Le formateur accède au tableau de bord Formateur
2. Affiche ses séances :
   - Filtrage par date unique, ou plage de dates
   - Par défaut : toutes ses séances futures
3. Il peut voir le détail de chaque séance et marquer les présences

---

### 10.6 Vérifier la Disponibilité

**Endpoint** : `GET /api/seances/availability?trainerId=&date=&startTime=&endTime=`

Retourne `{ "available": true/false }` en vérifiant qu'il n'y a pas de chevauchement horaire avec les séances existantes du formateur.

---

## 11. Module 8 — Marquage des Présences

**Routes** : `/attendance`
**Acteurs** : TRAINER, MANAGER, ADMIN

### 11.1 Marquer la Présence

**Endpoint** : `POST /api/attendance/mark`

#### Scénario Complet

1. Le formateur ouvre la page de présence pour une séance
2. La liste des élèves inscrits au groupe est affichée
3. Pour chaque élève, le formateur sélectionne un statut :

| Statut | Code | Badge | Description |
|--------|------|-------|------------|
| ✅ Présent | `PRESENT` | 🟢 Vert | L'élève est présent |
| ❌ Absent | `ABSENT` | 🔴 Rouge | L'élève est absent |
| 🟡 Excusé | `EXCUSED` | 🟡 Orange | L'élève est absent mais excusé (compte comme présent pour la progression) |

4. **Requête** envoyée :
   ```json
   {
     "trainingId": "...",
     "sessionId": "...",
     "records": [
       { "studentId": "...", "status": "PRESENT" },
       { "studentId": "...", "status": "ABSENT" },
       { "studentId": "...", "status": "EXCUSED" }
     ]
   }
   ```
5. **Traitement backend** :
   a. Vérifier que le `sessionId` existe dans la formation
   b. Pour chaque record :
      - Trouver l'enrollment (`studentId` + `trainingId`)
      - Mettre à jour `enrollment.attendance[sessionId] = { status, markedAt }`
      - **Recalculer la progression** (`ProgressCalculator.compute()`)
      - Sauvegarder l'enrollment
   c. Si un élève n'a pas d'inscription → comptabilisé dans `missingStudentIds`
6. **Notification WhatsApp** : si un élève est marqué `ABSENT`, une notification est envoyée à son téléphone via n8n (`notifyStudentAbsent`)

#### Réponse

```json
{
  "updatedCount": 12,
  "missingEnrollmentsCount": 0,
  "missingStudentIds": [],
  "progressUpdated": true,
  "message": "12 présence(s) marquée(s)"
}
```

---

### 11.2 Consulter les Présences d'une Séance

**Endpoint** : `GET /api/attendance/session/{sessionId}?trainingId={id}`

Retourne pour chaque élève inscrit : `studentId`, `firstName`, `lastName`, `status` (PRESENT/ABSENT/EXCUSED/null si pas encore marqué).

---

## 12. Module 9 — Suivi de Progression

**Acteurs** : Tous les rôles (consultation)

### 12.1 Règles Métier de Progression

Les règles sont implémentées dans `ProgressCalculator` :

| Règle | Description |
|-------|------------|
| **Validation d'un niveau** | Un niveau est validé si les **6 séances** du niveau ont un statut `PRESENT` ou `EXCUSED` |
| **Formation complétée** | La formation est complétée si les **4 niveaux** sont validés |
| **Éligibilité au certificat** | `eligibleForCertificate = completed` (formation complétée) |
| **Séance non marquée** | Comptée comme « non validée » (le niveau ne sera pas validé) |
| **Statut EXCUSED** | Considéré comme validé pour le calcul de progression |

### 12.2 ProgressSnapshot

Calculé et stocké dans chaque `Enrollment` :

| Champ | Type | Description |
|-------|------|------------|
| `totalSessions` | int | Toujours 24 |
| `attendedCount` | int | Nombre de PRESENT + EXCUSED |
| `missedCount` | int | Nombre de ABSENT |
| `levelsValidated` | List<Integer> | Liste des niveaux validés (ex: [1, 2, 3]) |
| `completed` | boolean | Tous les 4 niveaux validés |
| `completedAt` | Instant | Date de complétion (une seule fois) |
| `eligibleForCertificate` | boolean | = completed |
| `certificateIssuedAt` | Instant | Date de délivrance du certificat PDF |

### 12.3 Progression d'un Étudiant

**Endpoint** : `GET /api/students/{studentId}/progress`

#### Réponse

Pour chaque formation inscrite :
- `enrollmentId`, `trainingId`, `trainingTitle`
- `progressSnapshot` : résumé de la progression
- `missedSessions[]` : liste des séances manquées avec :
  - `sessionId`, `levelNumber`, `sessionNumber`, `sessionTitle`
  - `status` : « ABSENT » ou null (pas encore marquée)

### 12.4 Recalcul Automatique

La progression est **recalculée automatiquement** à chaque marquage de présence. Le `ProgressCalculator.compute()` est appelé systématiquement dans `AttendanceService.markAttendance()`.

---

## 13. Module 10 — Certificats

**Routes** : `/certificates`
**Acteurs** : MANAGER, ADMIN

### 13.1 Vérification d'Éligibilité

**Endpoint** : `GET /api/enrollments/{enrollmentId}/certificate/meta`

#### Réponse

```json
{
  "eligible": true,
  "completedAt": "2026-01-15T10:30:00Z",
  "issuedAt": null,
  "studentName": "Ahmed Ben Ali",
  "trainingTitle": "Formation Robotique"
}
```

### 13.2 Génération du Certificat PDF

**Endpoint** : `GET /api/enrollments/{enrollmentId}/certificate`
**Format** : `application/pdf`

#### Scénario Complet

1. Le manager accède à `/certificates`
2. Sélectionne un enrollment éligible
3. Clique « Télécharger le certificat »
4. **Contrôles** :
   - L'enrollment doit exister
   - `progressSnapshot.eligibleForCertificate` doit être `true`
   - Si non éligible → erreur 409 Conflict : « L'élève n'est pas éligible »
5. Le PDF est généré avec PDFBox :

#### Contenu du Certificat PDF

| Section | Contenu |
|---------|---------|
| **Logo** | Logo ASTBA (depuis `static/logo.png`) |
| **En-tête** | « Association Sciences and Technology Ben Arous » |
| **Adresse** | « 67 Avenue 14 Janvier, Ben Arous 2013 — Tunisie » |
| **Titre** | « CERTIFICAT DE FORMATION » |
| **Corps** | « Nous certifions que **{Nom Étudiant}** a complété avec succès les 4 niveaux de la formation **{Titre Formation}** » |
| **Date** | « Délivré le {date de complétion} » |
| **Signatures** | Deux colonnes : « Le Responsable de la Formation » et « Le Président de l'ASTBA » |
| **Numéro** | Format : `ASTBA-{année}-{4 derniers chars de enrollmentId}` |
| **Format** | A4 Paysage, bordures décoratives, palette bleu/gris |

6. Si c'est la première génération → `certificateIssuedAt` est défini dans le ProgressSnapshot
7. Le PDF est retourné en inline (affiché dans le navigateur)

### 13.3 Bouton « Pourquoi pas éligible ? » (IA)

Si un élève n'est pas éligible, un bouton déclenche une explication IA via Perplexity :
- Analyse les séances manquées
- Explique en langage naturel pourquoi l'élève ne peut pas recevoir le certificat
- Réponse dans la langue de l'interface (Arabe فصحى ou Français)

---

## 14. Module 11 — Notifications

**Acteurs** : Tous les rôles (destinataires)

### 14.1 Types de Notifications

| Type | Code | Scénario de déclenchement |
|------|------|--------------------------|
| Séance assignée | `SEANCE_ASSIGNED` | Un formateur est affecté à une séance |
| Séance reportée | `SEANCE_REPORTED` | Un formateur reporte une séance |
| Rappel de séance | `SEANCE_REMINDER` | Rappel avant une séance |
| Rapport approuvé | `REPORT_APPROVED` | Un rapport de report est accepté |
| Rapport rejeté | `REPORT_REJECTED` | Un rapport de report est refusé |
| Général | `GENERAL` | Notification générique |

### 14.2 Structure d'une Notification

```json
{
  "id": "...",
  "userId": "destinataire",
  "title": "Nouvelle séance assignée",
  "message": "Vous êtes assigné à la séance Niveau 2 – Séance 3 le 15/02/2026",
  "link": "/attendance",
  "type": "SEANCE_ASSIGNED",
  "read": false,
  "createdAt": "2026-02-08T10:00:00Z"
}
```

### 14.3 Endpoints

| Endpoint | Description |
|----------|------------|
| `GET /api/notifications` | Toutes mes notifications |
| `GET /api/notifications/unread` | Notifications non lues |
| `GET /api/notifications/unread/count` | Compteur de non lues |
| `PATCH /api/notifications/{id}/read` | Marquer comme lue |
| `POST /api/notifications/read-all` | Tout marquer comme lu |

---

## 15. Module 12 — Notifications WhatsApp (n8n)

### 15.1 Architecture

```
Backend (Spring Boot)
    │
    │ POST JSON → n8n Cloud Webhooks
    │
    ↓
n8n Cloud (astba.app.n8n.cloud)
    │
    │ Workflow: transformer → appeler Graph API
    │
    ↓
WhatsApp Business API (Graph API v22.0)
    │
    │ Message WhatsApp envoyé
    │
    ↓
Destinataire (téléphone)
```

### 15.2 Événements Déclencheurs

| Événement | Webhook | Destinataire | Contenu |
|-----------|---------|-------------|---------|
| **Élève absent** | `/webhook/student-absent` | Étudiant (téléphone) | Nom, formation, séance, date, plan de rattrapage |
| **Formateur assigné** | `/webhook/trainer-assigned` | Formateur (téléphone) | Formation, séance, groupe, date, horaires |
| **Séance reportée** | `/webhook/seance-reported` | Managers (téléphone) | Formateur, séance, raison, date suggérée |

### 15.3 Format des Numéros

Le service normalise automatiquement les numéros de téléphone tunisiens :
- `12345678` → `21612345678` (ajout préfixe +216)
- `21612345678` → inchangé
- Le `+` est retiré (exigence WhatsApp API)

### 15.4 Conditions de Non-Envoi

- `astba.whatsapp.enabled = false` → désactivé globalement
- Pas de numéro de téléphone pour le destinataire → silencieusement ignoré
- Les webhooks sont envoyés de manière **asynchrone** (`CompletableFuture.runAsync`) pour ne pas bloquer le flux principal

---

## 16. Module 13 — Accessibilité

### 16.1 Synthèse Vocale (TTS) avec IA

**Composant** : `TTSAccessibilityButton` (bouton flottant en bas à gauche)

#### Scénario

1. L'utilisateur clique sur le bouton 🔊
2. Le système :
   a. Extrait le contenu textuel de la page (exclusion : navigation, boutons, formulaires, widgets)
   b. Détecte la langue depuis `<html lang>` : `ar-TN` ou `fr`
   c. Envoie le contenu à l'API Perplexity (`/api/tts-summarize`) pour résumé intelligent
   d. Le prompt demande un résumé clair en :
      - **Arabe standard (فصحى)** si la page est en arabe tunisien
      - **Français** si la page est en français
   e. Découpe le texte en morceaux de 180 caractères max (fiabilité du Web Speech API)
   f. Lit à haute voix avec le Web Speech API du navigateur
3. Le bouton affiche l'état : lecture en cours / pause / arrêt
4. **Priorité des voix** :
   - Arabe : `ar-SA` > `ar-XA` > `ar-EG` > toute voix `ar-*`
   - Français : `fr-FR` > `fr-CA` > toute voix `fr-*`

#### Fallback

Si l'API Perplexity échoue (503, timeout, etc.), le système lit directement le contenu brut de la page.

---

### 16.2 Widget de Zoom

**Composant** : `ZoomAccessibilityWidget` (bouton flottant)

#### Fonctionnalités

| Fonction | Description |
|----------|------------|
| **Curseur de zoom** | Zoom de 80% à 200% (défaut : 125%) |
| **Presets rapides** | Pilules cliquables : 80%, 100%, 125%, 150%, 200% |
| **Loupe magique** | Mode loupe circulaire qui grossit la zone sous le curseur (×1.5 à ×4) |
| **Jauge circulaire** | Indicateur SVG du niveau de zoom actuel |
| **Persistance** | Niveau de zoom sauvegardé en `localStorage` |
| **Raccourci clavier** | `ESC` pour fermer le panneau |

#### Design

- Panneau glassmorphism (fond transparent avec flou)
- Transitions smooth CSS
- Responsive

---

### 16.3 Curseur Personnalisé

**Fichier** : `globals.css`

Tous les éléments cliquables (`a`, `button`, `[role="button"]`, `input[type="submit"]`, `select`, etc.) utilisent un curseur personnalisé : `/mouse-pointer-clickable.png`.

---

## 17. Module 14 — Intelligence Artificielle (Perplexity)

### 17.1 Architecture IA

```
Frontend (composant React)
    │
    │ fetch('/api/ai') ou fetch('/api/tts-summarize')
    │
    ↓
Next.js API Routes (serveur)
    │
    │ POST https://api.perplexity.ai/chat/completions
    │   model: "sonar"
    │   Authorization: Bearer {PERPLEXITY_API_KEY}
    │
    ↓
Réponse IA → nettoyage markdown → retour au frontend
```

### 17.2 Mode « Expliquer cette page »

**Composant** : `ExplainScreen`

#### Scénario

1. Bouton « شرح الصفحة » (Arabe) ou « Expliquer cette page » (Français)
2. Extraction automatique du contenu de la page
3. Envoi à `/api/ai` avec `mode = "explain"` et `locale`
4. Le prompt IA :
   - **Si locale = ar-*** : « أنت مساعد ذكي... اشرح محتوى هذه الصفحة بالعربية الفصحى فقط... في 6 نقاط كحد أقصى »
   - **Si locale = fr** : « Tu es un assistant intelligent... Explique uniquement en français... en 6 points maximum »
5. Affichage du résultat dans un panneau déroulant

### 17.3 Mode « Pourquoi pas éligible ? »

**Composant** : `WhyNotEligible`

#### Scénario

1. Sur la page certificats, si un élève n'est pas éligible
2. Bouton « Pourquoi ? »
3. Mode `"eligibility"` envoyé à `/api/ai`
4. L'IA analyse les données et explique les séances manquantes

### 17.4 Mode « Chatbot »

**Composant** : `Chatbot` (widget flottant en bas à droite)

#### Scénario

1. L'utilisateur ouvre le chatbot
2. Pose une question en arabe ou en français
3. Mode `"chat"` envoyé à `/api/ai`
4. L'IA répond dans la langue de l'interface (pas bilingue)
5. Historique de conversation maintenu dans le state React

### 17.5 Contrôle de Langue

| Locale | Langue de réponse IA |
|--------|---------------------|
| `ar-TN` | Arabe standard فصحى uniquement |
| `fr` | Français uniquement |

L'IA ne mélange **jamais** les deux langues dans une même réponse.

---

## 18. Module 15 — Upload de Fichiers

### 18.1 Upload d'Images

**Endpoint** : `POST /api/uploads/image`
**Acteurs** : MANAGER, ADMIN

#### Scénario

1. Upload d'un fichier image (JPG, PNG, etc.)
2. L'image est stockée en MongoDB dans la collection `images` (document `ImageDocument`)
3. Réponse : `{ id, filename, imageUrl }` où `imageUrl = /api/images/{id}`
4. L'image est servie avec cache 30 jours

### 18.2 Servir une Image

**Endpoint** : `GET /api/images/{id}`

- Retourne le binaire avec le bon `Content-Type`
- Cache HTTP 30 jours

### 18.3 Supprimer une Image

**Endpoint** : `DELETE /api/images/{id}`
**Acteurs** : MANAGER, ADMIN

---

## 19. Tableau de Bord

### 19.1 Tableau de Bord Manager/Admin

**Route** : `/dashboard`

#### Contenu

1. **Calendrier de Planning** (`PlanningCalendar`) :
   - Vue calendrier des séances planifiées
   - Filtrage par formation, formateur, groupe
   - Drag & drop pour déplacer les séances
   - Code couleur par statut

2. **Cartes statistiques** :
   - Total étudiants
   - Total formations
   - Séances aujourd'hui
   - Certificats éligibles

3. **Liens rapides** :
   - Ajouter un étudiant
   - Créer une formation
   - Marquer les présences
   - Gérer les certificats

---

### 19.2 Tableau de Bord Formateur

**Composant** : `TrainerDashboard`

#### Contenu

1. **Mes séances du jour** : Liste des séances assignées pour aujourd'hui
2. **Séances à venir** : Planning futur
3. **Actions rapides** :
   - Commencer une séance (changer statut → IN_PROGRESS)
   - Marquer les présences
   - Reporter une séance
   - Terminer une séance

---

## 20. Internationalisation (i18n)

### 20.1 Configuration

| Paramètre | Valeur |
|-----------|--------|
| Bibliothèque | `next-intl` |
| Locales | `fr` (Français), `ar-TN` (Arabe tunisien) |
| Locale par défaut | `ar-TN` |
| Direction | `ltr` (Français), `rtl` (Arabe) |
| Police | Cairo (Google Fonts) — supporte l'arabe |

### 20.2 Fichiers de Traduction

- `frontend/messages/fr.json` — Traductions françaises
- `frontend/messages/ar-TN.json` — Traductions arabes

### 20.3 Espaces de Noms (Namespaces)

| Namespace | Contenu |
|-----------|---------|
| `auth` | Login, register, OAuth callbacks |
| `dashboard` | Tableau de bord, statistiques |
| `students` | Gestion des étudiants |
| `trainings` | Gestion des formations |
| `groups` | Gestion des groupes |
| `attendance` | Marquage des présences |
| `certificates` | Certificats |
| `admin` | Panel administrateur |
| `common` | Éléments communs (boutons, navigation) |
| `validation` | Messages d'erreur de validation |

---

## 21. Annexes — Modèle de Données

### 21.1 Collections MongoDB

```
┌─────────────────────────────────────────────────────┐
│                    users                             │
│  id, email, passwordHash, firstName, lastName,       │
│  roles[], status, provider, providerId,              │
│  speciality, yearsExperience, phone,                 │
│  lastLoginAt, createdAt, updatedAt                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   students                           │
│  id, firstName, lastName, birthDate, phone,          │
│  email, imageUrl, notes, createdAt, updatedAt        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  trainings                           │
│  id, title, description, documentBase64,             │
│  documentFilename, levels[                           │
│    { levelNumber, title, sessions[                   │
│      { sessionId, sessionNumber, title, plannedAt }  │
│    ]}                                                │
│  ], createdAt, updatedAt                             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    groups                            │
│  id, name, trainingId, dayOfWeek, startTime,         │
│  endTime, studentIds[], trainerId,                   │
│  createdAt, updatedAt                                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                 enrollments                          │
│  id, studentId, trainingId, groupId, enrolledAt,     │
│  attendance: { sessionId → { status, markedAt } },   │
│  progressSnapshot: {                                 │
│    totalSessions, attendedCount, missedCount,        │
│    levelsValidated[], completed, completedAt,        │
│    eligibleForCertificate, certificateIssuedAt       │
│  }, createdAt, updatedAt                             │
│                                                      │
│  Index unique: (studentId, trainingId)               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   seances                            │
│  id, trainingId, sessionId, groupId, trainerId,      │
│  date, startTime, endTime, status,                   │
│  levelNumber, sessionNumber, title,                  │
│  createdAt, updatedAt                                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               session_reports                        │
│  id, seanceId, trainerId, reason,                    │
│  suggestedDate, reportStatus, createdAt              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                notifications                         │
│  id, userId, title, message, link, type,             │
│  read, createdAt                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   images                             │
│  id, filename, contentType, size, data (Binary)      │
└─────────────────────────────────────────────────────┘
```

### 21.2 Énumérations

| Enum | Valeurs |
|------|---------|
| `Role` | `ADMIN`, `MANAGER`, `TRAINER` |
| `UserStatus` | `ACTIVE`, `DISABLED`, `PENDING` |
| `AuthProvider` | `LOCAL`, `GOOGLE` |
| `AttendanceStatus` | `PRESENT`, `ABSENT`, `EXCUSED` |
| `SeanceStatus` | `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `REPORTED`, `CANCELLED` |
| `ReportStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `NotificationType` | `SEANCE_ASSIGNED`, `SEANCE_REPORTED`, `SEANCE_REMINDER`, `REPORT_APPROVED`, `REPORT_REJECTED`, `GENERAL` |

### 21.3 Relations entre Entités

```
User (formateur)
 │
 ├──→ Group.trainerId
 ├──→ Seance.trainerId
 └──→ SessionReport.trainerId

Student
 │
 ├──→ Enrollment.studentId
 └──→ Group.studentIds[]

Training
 │
 ├──→ Level[] → Session[] (embedded)
 ├──→ Group.trainingId
 ├──→ Enrollment.trainingId
 └──→ Seance.trainingId

Group
 │
 ├──→ Enrollment.groupId
 └──→ Seance.groupId

Enrollment
 │
 ├──→ AttendanceEntry (Map<sessionId, entry>)
 └──→ ProgressSnapshot (embedded)

Seance
 │
 └──→ SessionReport.seanceId
```

---

> **Fin du document**
>
> © 2026 — Association Sciences and Technology Ben Arous (ASTBA)
> Plateforme développée par l'équipe CodeSlayers — Esprit Maratech 2026
