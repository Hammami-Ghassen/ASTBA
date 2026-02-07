# ASTBA — Frontend (Training & Attendance Tracking)

> Frontend Next.js pour l'**Association Sciences and Technology Ben Arous** (Tunisie).
> Suivi des formations, groupes, présences, progression et certificats PDF.

---

## Table des matières

- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Structure du projet](#structure-du-projet)
- [Pages & routes](#pages--routes)
- [Architecture](#architecture)
- [Internationalisation (i18n)](#internationalisation-i18n)
- [API Contract](#api-contract)
- [Authentification & RBAC](#authentification--rbac)
- [Hypothèses métier](#hypothèses-métier)
- [Accessibilité (WCAG 2.2 AA)](#accessibilité-wcag-22-aa)
- [Scripts](#scripts)
- [Script de démo](#script-de-démo)
- [Stack technique](#stack-technique)

---

## Démarrage rapide

### Prérequis

| Outil       | Version                                 |
| ----------- | --------------------------------------- |
| **Node.js** | ≥ 20.x                                  |
| **npm**     | ≥ 10.x                                  |
| **Backend** | Spring Boot sur `http://localhost:8080` |

### Installation

```bash
cd frontend
npm install
```

### Environnement

```bash
cp .env.example .env.local
```

### Lancer

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

### Build production

```bash
npm run build
npm start
```

---

## Variables d'environnement

| Variable                     | Défaut                  | Description                                     |
| ---------------------------- | ----------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`   | `/api`                  | Chemin API — `/api` pour le proxy Next.js local |
| `NEXT_PUBLIC_BACKEND_URL`    | `http://localhost:8080` | URL réelle du backend (proxy + OAuth + images)  |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `ar-TN`                 | Locale par défaut (`ar-TN` ou `fr`)             |

### Proxy API

Les appels `/api/*` sont **proxyfiés** par Next.js vers le backend (configuré dans
`next.config.ts` via `rewrites`). Cela permet aux cookies HttpOnly du backend
de vivre sur le **même domaine** que le frontend, évitant les problèmes
cross-origin.

```
Browser → localhost:3000/api/auth/login → (proxy) → localhost:8080/api/auth/login
```

> **Pourquoi ?** Les cookies `access_token` / `refresh_token` sont HttpOnly.
> Si le frontend et le backend sont sur des domaines différents, le middleware
> Next.js ne pourrait pas voir les cookies pour protéger les routes.

---

## Structure du projet

```
frontend/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (landing)/page.tsx         # Accueil public (/)
│   │   ├── layout.tsx                 # Root layout (i18n, RTL, skip-link, nav)
│   │   ├── globals.css                # Styles globaux + surcharges a11y
│   │   ├── login/page.tsx             # Connexion (/login)
│   │   ├── register/page.tsx          # Inscription (/register)
│   │   ├── access-denied/page.tsx     # Accès refusé (/access-denied)
│   │   ├── auth/callback/page.tsx     # Callback OAuth2 (/auth/callback)
│   │   ├── dashboard/page.tsx         # Tableau de bord (/dashboard)
│   │   ├── students/
│   │   │   ├── page.tsx               # Liste étudiants (/students)
│   │   │   ├── new/page.tsx           # Créer un étudiant (/students/new)
│   │   │   └── [id]/page.tsx          # Détail étudiant (/students/:id)
│   │   ├── trainings/
│   │   │   ├── page.tsx               # Liste formations (/trainings)
│   │   │   ├── new/page.tsx           # Créer formation (/trainings/new)
│   │   │   └── [id]/page.tsx          # Détail formation (/trainings/:id)
│   │   ├── groups/page.tsx            # Gestion des groupes (/groups)
│   │   ├── attendance/page.tsx        # Marquage présences (/attendance)
│   │   ├── certificates/page.tsx      # Certificats (/certificates)
│   │   └── admin/users/page.tsx       # Gestion utilisateurs (/admin/users)
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── auth-layout.tsx        # Layout pages d'authentification
│   │   │   ├── google-oauth-button.tsx # Bouton Google OAuth
│   │   │   └── require-auth.tsx       # Guard client-side (rôle)
│   │   ├── ui/                        # Primitives UI accessibles (Radix)
│   │   │   ├── accordion.tsx          # Radix Accordion
│   │   │   ├── badge.tsx              # Badge (variantes)
│   │   │   ├── button.tsx             # Button (CVA variants)
│   │   │   ├── card.tsx               # Card container
│   │   │   ├── dialog.tsx             # Dialog modal (Radix)
│   │   │   ├── image-upload.tsx       # Upload d'image avec drag & drop
│   │   │   ├── input.tsx              # Input + error states
│   │   │   ├── label.tsx              # Label (Radix)
│   │   │   ├── progress.tsx           # Progress bar (Radix)
│   │   │   ├── select.tsx             # Select dropdown (Radix)
│   │   │   ├── skeleton.tsx           # Loading skeleton
│   │   │   ├── table.tsx              # Table accessible (caption + th scope)
│   │   │   ├── tabs.tsx               # Tabs (Radix)
│   │   │   ├── textarea.tsx           # Textarea
│   │   │   └── toast.tsx              # Toast notifications (Radix)
│   │   └── layout/
│   │       ├── app-shell.tsx          # Shell principal (navbar conditionnelle)
│   │       ├── breadcrumb.tsx         # Fil d'Ariane
│   │       ├── form-field.tsx         # Champ formulaire avec label + erreur
│   │       ├── language-switcher.tsx  # Sélecteur FR / عربي
│   │       ├── navbar.tsx             # Barre de navigation responsive
│   │       └── states.tsx             # États loading / empty / error
│   │
│   ├── lib/
│   │   ├── api-client.ts             # Client REST typé (students, trainings, groups…)
│   │   ├── auth-api.ts               # Client auth (login, register, OAuth, admin)
│   │   ├── auth-provider.tsx          # AuthContext + RBAC helpers
│   │   ├── hooks.ts                   # React Query hooks (queries + mutations)
│   │   ├── providers.tsx              # QueryClient + NextIntl + Auth providers
│   │   ├── types.ts                   # Types TypeScript (domaine + auth)
│   │   ├── utils.ts                   # Utilitaires (cn, formatDate…)
│   │   └── validators.ts             # Schémas Zod (formulaires auth)
│   │
│   ├── middleware.ts                  # Protection de routes (présence cookie)
│   ├── i18n.ts                        # Configuration next-intl
│   └── i18n-config.ts                 # Locales supportées
│
├── messages/
│   ├── fr.json                        # Traductions français
│   └── ar-TN.json                     # Traductions arabe tunisien
│
├── tests/
│   └── e2e-a11y.spec.ts              # Playwright + axe-core (WCAG 2.2 AA)
│
├── .env.example                       # Template des variables d'environnement
├── .env.local                         # Variables locales (non commité)
├── next.config.ts                     # Config Next.js (proxy API + images)
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
└── playwright.config.ts
```

---

## Pages & routes

| Route            | Page                           | Auth requise | Rôle minimum  |
| ---------------- | ------------------------------ | :----------: | ------------- |
| `/`              | Landing page publique          |     Non      | —             |
| `/login`         | Connexion                      |     Non      | —             |
| `/register`      | Inscription                    |     Non      | —             |
| `/auth/callback` | Callback OAuth2                |     Non      | —             |
| `/access-denied` | Accès refusé                   |     Non      | —             |
| `/dashboard`     | Tableau de bord                |     Oui      | Tout rôle     |
| `/students`      | Liste des étudiants            |     Oui      | Tout rôle     |
| `/students/new`  | Créer un étudiant              |     Oui      | ADMIN/MANAGER |
| `/students/:id`  | Détail étudiant + inscriptions |     Oui      | Tout rôle     |
| `/trainings`     | Liste des formations           |     Oui      | Tout rôle     |
| `/trainings/new` | Créer une formation            |     Oui      | ADMIN/MANAGER |
| `/trainings/:id` | Détail formation               |     Oui      | Tout rôle     |
| `/groups`        | Gestion des groupes            |     Oui      | ADMIN/MANAGER |
| `/attendance`    | Marquage des présences         |     Oui      | Tout rôle     |
| `/certificates`  | Certificats                    |     Oui      | Tout rôle     |
| `/admin/users`   | Gestion utilisateurs           |     Oui      | ADMIN         |

---

## Architecture

### Protection des routes (2 couches)

1. **Middleware** (`src/middleware.ts`) — Serveur Next.js. Vérifie la présence
   d'un cookie d'authentification (`access_token`, `JSESSIONID`, etc.).
   Si absent sur une route protégée → redirection vers `/login?redirect=...`.

2. **AuthProvider** (`src/lib/auth-provider.tsx`) — Client-side. Au montage,
   appelle `GET /api/auth/me` pour valider le cookie et charger le profil
   utilisateur. Expose `isAuthenticated`, `user`, `login()`, `logout()`,
   `refreshUser()`.

### Data Fetching

- **TanStack Query** (React Query) pour le cache, l'invalidation et les mutations.
- Tous les hooks sont dans `src/lib/hooks.ts`.
- Le client API (`src/lib/api-client.ts`) utilise `fetch` avec `credentials: 'include'`.

### Formulaires

- **React Hook Form** + **Zod** pour la validation.
- Composant `FormField` réutilisable avec label, erreur, `aria-describedby`.

---

## Internationalisation (i18n)

| Propriété          | Valeur                                      |
| ------------------ | ------------------------------------------- |
| Librairie          | `next-intl`                                 |
| Locale par défaut  | `ar-TN` (arabe tunisien — RTL)              |
| Locales supportées | `ar-TN`, `fr`                               |
| Fichiers           | `/messages/fr.json`, `/messages/ar-TN.json` |

- `dir="rtl"` appliqué dynamiquement sur `<html>` pour l'arabe.
- Tous les composants utilisent des propriétés logiques CSS (`start`/`end`).
- Sélecteur de langue dans la navbar (FR / عربي).

### Ajouter une langue

1. Créer `/messages/xx.json` (copier la structure de `fr.json`)
2. Ajouter la locale dans `src/i18n-config.ts`
3. Si RTL, ajouter à `rtlLocales`

---

## API Contract

Le frontend consomme l'API REST du backend Spring Boot.
Voir `src/lib/api-client.ts` et `src/lib/auth-api.ts` pour les clients typés.

### Étudiants

| Méthode        | Endpoint                           | Description               |
| -------------- | ---------------------------------- | ------------------------- |
| GET            | `/api/students?query=&page=&size=` | Liste (paginé, recherche) |
| POST           | `/api/students`                    | Créer                     |
| GET/PUT/DELETE | `/api/students/{id}`               | CRUD                      |
| GET            | `/api/students/{id}/enrollments`   | Inscriptions              |
| GET            | `/api/students/{id}/progress`      | Progression               |

### Formations

| Méthode        | Endpoint              | Description |
| -------------- | --------------------- | ----------- |
| GET            | `/api/trainings`      | Liste       |
| POST           | `/api/trainings`      | Créer       |
| GET/PUT/DELETE | `/api/trainings/{id}` | CRUD        |

### Groupes

| Méthode        | Endpoint                          | Description                  |
| -------------- | --------------------------------- | ---------------------------- |
| GET            | `/api/groups?trainingId=`         | Liste (filtre par formation) |
| POST           | `/api/groups`                     | Créer                        |
| GET/PUT/DELETE | `/api/groups/{id}`                | CRUD                         |
| POST           | `/api/groups/{id}/students/{sid}` | Ajouter étudiant             |
| DELETE         | `/api/groups/{id}/students/{sid}` | Retirer étudiant             |

### Inscriptions & Présences

| Méthode | Endpoint               | Description               |
| ------- | ---------------------- | ------------------------- |
| POST    | `/api/enrollments`     | Inscrire                  |
| POST    | `/api/attendance/mark` | Marquer présences (batch) |

### Certificats

| Méthode | Endpoint                                 | Description     |
| ------- | ---------------------------------------- | --------------- |
| GET     | `/api/enrollments/{id}/certificate`      | Télécharger PDF |
| GET     | `/api/enrollments/{id}/certificate/meta` | Métadonnées     |

### Authentification

| Méthode | Endpoint                       | Description              |
| ------- | ------------------------------ | ------------------------ |
| POST    | `/api/auth/login`              | Connexion                |
| POST    | `/api/auth/register`           | Inscription              |
| GET     | `/api/auth/me`                 | Utilisateur courant      |
| POST    | `/api/auth/logout`             | Déconnexion              |
| POST    | `/api/auth/refresh`            | Rafraîchir le token      |
| GET     | `/oauth2/authorization/google` | Redirection Google OAuth |

### Administration (ADMIN)

| Méthode | Endpoint                          | Description             |
| ------- | --------------------------------- | ----------------------- |
| GET     | `/api/admin/users?q=&page=&size=` | Lister les utilisateurs |
| PATCH   | `/api/admin/users/{id}/roles`     | Changer le rôle         |
| PATCH   | `/api/admin/users/{id}/status`    | Activer/désactiver      |

---

## Authentification & RBAC

### Stratégie

Cookies HttpOnly définis par le backend Spring Boot. Le frontend utilise
`credentials: 'include'` sur toutes les requêtes fetch, et le middleware
Next.js proxy les appels vers le backend.

### Rôles

| Rôle      | Droits                                                                           |
| --------- | -------------------------------------------------------------------------------- |
| `ADMIN`   | Tout : gestion utilisateurs, formations, élèves, groupes, présences, certificats |
| `MANAGER` | Formations, élèves, groupes, présences, certificats (pas de panel admin)         |
| `TRAINER` | Consultation + marquage des présences uniquement                                 |

### Google OAuth2

1. L'utilisateur clique « Se connecter avec Google »
2. Redirection vers `{NEXT_PUBLIC_BACKEND_URL}/oauth2/authorization/google`
3. Le backend gère le flux OAuth2 et définit les cookies
4. Callback sur `/auth/callback` → vérification via `/api/auth/me`

---

## Hypothèses métier

| Règle               | Détail                             |
| ------------------- | ---------------------------------- |
| Structure formation | 4 niveaux × 6 séances = 24 séances |
| Niveau validé       | PRÉSENT aux 6 séances du niveau    |
| Formation terminée  | 4 niveaux validés                  |
| Certificat éligible | Quand la formation est terminée    |
| Statuts de présence | `PRESENT` / `ABSENT` / `EXCUSED`   |

---

## Accessibilité (WCAG 2.2 AA)

### Fonctionnalités implémentées

| Fonctionnalité                             | Statut |
| ------------------------------------------ | :----: |
| Skip link (« Aller au contenu »)           |   ✅   |
| H1 unique par page + hiérarchie H2/H3      |   ✅   |
| HTML sémantique (header/nav/main/footer)   |   ✅   |
| Labels + `aria-describedby` pour erreurs   |   ✅   |
| `aria-invalid` sur champs en erreur        |   ✅   |
| Focus sur premier champ invalide           |   ✅   |
| Résumé d'erreurs (`aria-live`)             |   ✅   |
| Tables : `caption` + `th scope`            |   ✅   |
| Navigation clavier (Tab logique)           |   ✅   |
| Focus visible                              |   ✅   |
| RTL (`dir="rtl"`) dynamique                |   ✅   |
| Propriétés logiques CSS                    |   ✅   |
| Contraste ≥ 4.5:1                          |   ✅   |
| `prefers-reduced-motion`                   |   ✅   |
| Dialog : focus trap + `aria-modal` + Échap |   ✅   |
| Toast : `aria-live` polite/assertive       |   ✅   |
| Progress bar : `aria-valuenow`             |   ✅   |
| Radio group présences                      |   ✅   |
| Styles d'impression certificats            |   ✅   |

### Tests automatisés

```bash
npm run test:a11y       # Playwright + axe-core (WCAG 2.2 AA)
npm run test:e2e        # Tous les tests E2E
npm run test:e2e:ui     # Playwright avec interface visuelle
```

### Tests manuels recommandés

| Outil                    | Objectif                            |
| ------------------------ | ----------------------------------- |
| NVDA / Windows Narrator  | Lecteur d'écran Windows             |
| VoiceOver                | Lecteur d'écran macOS/iOS           |
| TalkBack                 | Lecteur d'écran Android             |
| Lighthouse Accessibility | Audit Chrome DevTools (cible ≥ 95)  |
| Axe DevTools             | Extension navigateur                |
| WAVE                     | wave.webaim.org                     |
| CCA                      | Vérificateur de contraste (≥ 4.5:1) |

---

## Scripts

| Commande              | Description                    |
| --------------------- | ------------------------------ |
| `npm run dev`         | Serveur de développement       |
| `npm run build`       | Build de production            |
| `npm start`           | Serveur de production          |
| `npm run lint`        | ESLint                         |
| `npm run test:e2e`    | Tests E2E Playwright           |
| `npm run test:e2e:ui` | Playwright avec interface      |
| `npm run test:a11y`   | Tests accessibilité uniquement |

---

## Script de démo

### Flux complet E2E

1. **S'inscrire / Se connecter**
   - `/register` → Remplir prénom, nom, email, mot de passe
   - Ou cliquer « Se connecter avec Google »
   - `/login` → email + mot de passe

2. **Créer un élève** (ADMIN / MANAGER)
   - `/students/new` → Prénom, Nom, Email → Soumettre

3. **Créer une formation**
   - `/trainings/new` → Nom, Description → 4 niveaux × 6 séances auto-générés

4. **Gérer les groupes**
   - `/groups` → Créer un groupe → Assigner des étudiants

5. **Inscrire l'élève à la formation**
   - Détail élève → « Ajouter une formation » → Sélectionner formation et groupe

6. **Marquer les présences**
   - `/attendance` → Formation → Niveau → Séance → PRÉSENT / ABSENT

7. **Voir la progression**
   - Détail élève → Onglet Progression → Badges niveaux, barres de progression

8. **Générer le certificat**
   - `/certificates` → Formation → Télécharger pour les élèves éligibles

---

## Stack technique

| Catégorie        | Technologie                                           |
| ---------------- | ----------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Turbopack)                    |
| Langage          | TypeScript 5                                          |
| CSS              | Tailwind CSS 4                                        |
| UI               | Radix UI (Dialog, Tabs, Accordion, Select, Progress…) |
| State / Fetching | TanStack Query (React Query) 5                        |
| Formulaires      | React Hook Form 7 + Zod 4                             |
| i18n             | next-intl 4                                           |
| Icônes           | Lucide React                                          |
| Tests E2E        | Playwright                                            |
| Tests A11y       | @axe-core/playwright                                  |
| Design           | Dark theme (#101622 bg, #135bec brand), Geist font    |

---

© 2026 ASTBA — Association Sciences and Technology Ben Arous, Tunisie
