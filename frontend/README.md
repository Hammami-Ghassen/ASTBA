# ASTBA – Frontend (Training & Attendance Tracking)

**Association Sciences and Technology Ben Arous, Tunisie**

Application de suivi des formations, présences et certifications.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- Backend API running (Spring Boot) on `http://localhost:8080/api`

### Installation

```bash
cd frontend
npm install
```

### Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable                     | Default                     | Description                      |
| ---------------------------- | --------------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`   | `http://localhost:8080/api` | Spring Boot backend URL          |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `ar-TN`                     | Default locale (`ar-TN` or `fr`) |

> **Auth** : L'authentification utilise des cookies HttpOnly définis par le backend. Aucune variable supplémentaire n'est requise côté frontend. Google OAuth2 est configuré côté backend Spring Boot.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx              # Dashboard (/)
│   │   ├── layout.tsx            # Root layout (i18n, RTL, skip link, nav)
│   │   ├── globals.css           # Global styles + a11y overrides
│   │   ├── login/page.tsx        # Login (/login)
│   │   ├── register/page.tsx     # Register (/register)
│   │   ├── access-denied/page.tsx # Access denied (/access-denied)
│   │   ├── auth/callback/page.tsx # OAuth callback (/auth/callback)
│   │   ├── admin/users/page.tsx  # Admin user management (/admin/users)
│   │   ├── students/
│   │   │   ├── page.tsx          # Student list (/students)
│   │   │   ├── new/page.tsx      # Create student (/students/new) – ADMIN/MANAGER
│   │   │   └── [id]/page.tsx     # Student detail (/students/:id)
│   │   ├── trainings/
│   │   │   ├── page.tsx          # Training list (/trainings)
│   │   │   ├── new/page.tsx      # Create training (/trainings/new) – ADMIN/MANAGER
│   │   │   └── [id]/page.tsx     # Training detail (/trainings/:id)
│   │   ├── attendance/
│   │   │   └── page.tsx          # Attendance marking (/attendance)
│   │   └── certificates/
│   │       └── page.tsx          # Certificates (/certificates)
│   ├── components/
│   │   ├── auth/                 # Auth components
│   │   │   ├── google-oauth-button.tsx  # Google OAuth redirect
│   │   │   └── require-auth.tsx         # Client-side route guard
│   │   ├── ui/                   # Accessible UI primitives (Radix-based)
│   │   │   ├── accordion.tsx, badge.tsx, button.tsx, card.tsx
│   │   │   ├── dialog.tsx, input.tsx, label.tsx, progress.tsx
│   │   │   ├── select.tsx, skeleton.tsx, table.tsx, tabs.tsx
│   │   │   ├── textarea.tsx, toast.tsx
│   │   └── layout/               # Layout components
│   │       ├── breadcrumb.tsx, form-field.tsx
│   │       ├── language-switcher.tsx, navbar.tsx, states.tsx
│   ├── lib/
│   │   ├── api-client.ts         # Typed REST API client (fetch + credentials)
│   │   ├── auth-api.ts           # Auth API client (login, register, OAuth)
│   │   ├── auth-provider.tsx     # AuthProvider context + RBAC helpers
│   │   ├── hooks.ts              # React Query hooks
│   │   ├── providers.tsx         # QueryClient + i18n + Auth providers
│   │   ├── types.ts              # TypeScript domain + auth types
│   │   ├── utils.ts              # Utility functions
│   │   └── validators.ts         # Zod schemas for forms (incl. auth)
│   ├── middleware.ts             # Route protection (cookie-based)
│   └── i18n.ts                   # next-intl config
├── messages/
│   ├── fr.json                   # French translations
│   └── ar-TN.json                # Arabic (Tunisia) translations
├── tests/
│   └── e2e-a11y.spec.ts          # Playwright + axe-core tests
├── playwright.config.ts
├── .env.example
└── next.config.ts
```

---

## 🌐 Internationalization (i18n)

- **Default locale**: `ar-TN` (Arabic, Tunisia – RTL)
- **Supported locales**: `ar-TN`, `fr`
- Translation files in `/messages/`
- Language switcher in the navbar (FR / عربي)
- `dir="rtl"` applied dynamically on `<html>` for Arabic
- All components use logical properties (`start`/`end` not `left`/`right`)

### Adding a new language

1. Create `/messages/xx.json` (copy structure from `fr.json`)
2. Add the locale to `src/i18n.ts` → `locales` array
3. If RTL, add to `rtlLocales`

---

## 🎯 API Contract

The frontend consumes a Spring Boot REST API. See `src/lib/api-client.ts` for the typed client.

| Method         | Path                                 | Description               |
| -------------- | ------------------------------------ | ------------------------- |
| GET            | `/students?query=&page=&size=`       | List students (paginated) |
| POST           | `/students`                          | Create student            |
| GET/PUT/DELETE | `/students/{id}`                     | Student CRUD              |
| GET            | `/students/{id}/enrollments`         | Student enrollments       |
| GET            | `/students/{id}/progress`            | Student progress          |
| GET            | `/trainings`                         | List trainings            |
| POST           | `/trainings`                         | Create training           |
| GET/PUT/DELETE | `/trainings/{id}`                    | Training CRUD             |
| POST           | `/enrollments`                       | Create enrollment         |
| POST           | `/attendance/mark`                   | Mark attendance           |
| GET            | `/enrollments/{id}/certificate`      | Download PDF              |
| GET            | `/enrollments/{id}/certificate/meta` | Certificate metadata      |

### Auth API

| Method | Path                           | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| POST   | `/auth/login`                  | Login (email + password)         |
| POST   | `/auth/register`               | Register                         |
| GET    | `/auth/me`                     | Current user                     |
| POST   | `/auth/logout`                 | Logout                           |
| POST   | `/auth/refresh`                | Refresh token                    |
| GET    | `/oauth2/authorization/google` | Google OAuth2 redirect (backend) |
| GET    | `/admin/users`                 | List users (ADMIN only)          |
| PUT    | `/admin/users/{id}/role`       | Change user role (ADMIN only)    |
| PUT    | `/admin/users/{id}/status`     | Enable/disable user (ADMIN only) |

### Authentification & RBAC

**Stratégie** : Cookies HttpOnly (définis par le backend Spring Boot). Le frontend utilise `credentials: 'include'` sur toutes les requêtes.

**Rôles** :

| Rôle      | Droits                                                                  |
| --------- | ----------------------------------------------------------------------- |
| `ADMIN`   | Tout (gestion utilisateurs, formations, élèves, présences, certificats) |
| `MANAGER` | Formations, élèves, présences, certificats (pas d'admin panel)          |
| `TRAINER` | Consultation + marquage des présences uniquement                        |

**Protection des routes** :

- **Middleware** (couche 1) : Vérifie la présence d'un cookie d'auth, redirige vers `/login` sinon
- **RequireAuth** (couche 2) : Composant client vérifiant l'utilisateur via `/api/auth/me` + vérification de rôle

**Google OAuth2** :

1. L'utilisateur clique sur « Se connecter avec Google »
2. Redirection vers `${backendBase}/oauth2/authorization/google`
3. Le backend gère le flux OAuth2 et définit le cookie
4. Callback sur `/auth/callback` → vérification via `/api/auth/me`

### Hypothèses Métier

- **Formation** : 4 niveaux × 6 séances = 24 séances
- **Niveau validé** si l'élève est PRÉSENT aux 6 séances
- **Formation terminée** si 4 niveaux validés
- **Certificat éligible** quand formation terminée
- **Statuts de présence** : `PRESENT` / `ABSENT`

---

## ♿ Accessibilité (WCAG 2.2 AA)

### Fonctionnalités implémentées

| Fonctionnalité                           | Statut |
| ---------------------------------------- | ------ |
| Skip link ("Aller au contenu")           | ✅     |
| H1 unique par page + hiérarchie H2/H3    | ✅     |
| HTML sémantique (header/nav/main/footer) | ✅     |
| Labels + aria-describedby pour erreurs   | ✅     |
| aria-invalid sur champs en erreur        | ✅     |
| Focus sur premier champ invalide         | ✅     |
| Résumé d'erreurs (aria-live)             | ✅     |
| Tables : caption + th scope              | ✅     |
| Navigation clavier (Tab logique)         | ✅     |
| Focus visible                            | ✅     |
| RTL (dir="rtl") dynamique                | ✅     |
| Propriétés logiques CSS                  | ✅     |
| Contraste ≥ 4.5:1                        | ✅     |
| prefers-reduced-motion                   | ✅     |
| Dialog : focus trap + aria-modal + Esc   | ✅     |
| Toast : aria-live polite/assertive       | ✅     |
| Progress bar : aria-valuenow             | ✅     |
| Radio group présences                    | ✅     |
| Styles d'impression certificats          | ✅     |

### Tests automatisés

```bash
npm run test:a11y       # Playwright + axe-core (WCAG 2.2 AA)
npm run test:e2e        # All E2E tests
npm run test:e2e:ui     # Playwright avec UI
```

### Tests manuels

#### NVDA (Windows)

1. Télécharger [NVDA](https://www.nvaccess.org/)
2. Ouvrir l'app dans Firefox/Chrome
3. Naviguer avec Tab, lire avec les flèches
4. Vérifier : titres (touche H), formulaires, tableaux, régions live

#### Windows Narrator

1. `Win + Ctrl + Enter` pour démarrer
2. Naviguer dans l'application
3. Vérifier que tous les éléments interactifs sont annoncés

#### VoiceOver (macOS / iOS)

1. `Cmd + F5` pour activer VoiceOver
2. Naviguer avec `Ctrl + Option + Flèche`
3. Vérifier : rotor pour titres, formulaires, landmarks

#### TalkBack (Android)

1. Paramètres → Accessibilité → TalkBack
2. Naviguer dans l'app mobile
3. Vérifier les cibles tactiles ≥ 24×24px

#### Lighthouse

1. Chrome DevTools → onglet Lighthouse
2. Sélectionner "Accessibility"
3. Lancer l'audit — cible : **≥ 95**

#### Axe DevTools

1. Installer l'extension [axe DevTools](https://www.deque.com/axe/browser-extensions/)
2. Ouvrir chaque page → lancer le scan

#### WAVE

1. [wave.webaim.org](https://wave.webaim.org/)
2. Entrer l'URL dev → analyser

#### Color Contrast Analyzer

1. Télécharger [CCA](https://www.tpgi.com/color-contrast-checker/)
2. Vérifier texte/fond : ≥ 4.5:1 (normal), ≥ 3:1 (gros)

---

## 🧪 Scripts

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

## 🎬 Script de démo

### Flux complet E2E

1. **S'inscrire / Se connecter**
   - Naviguer vers `/register` → Remplir prénom, nom, email, mot de passe
   - Ou cliquer « Se connecter avec Google »
   - Se connecter via `/login` avec email + mot de passe

2. **Créer un élève** (ADMIN / MANAGER)
   - Naviguer vers `/students/new`
   - Remplir : Prénom, Nom, Email
   - Soumettre → Redirigé vers le détail

3. **Créer une formation**
   - Naviguer vers `/trainings/new`
   - Remplir : Nom, Description
   - Soumettre → 4 niveaux × 6 séances créés

4. **Inscrire l'élève à la formation**
   - Page détail élève → "Ajouter une formation"
   - Sélectionner la formation → Enregistrer

5. **Marquer les présences**
   - `/attendance` → Sélectionner Formation → Niveau → Séance
   - Basculer chaque élève : PRÉSENT / ABSENT
   - Enregistrer

6. **Voir la progression**
   - Détail élève → Onglet Progression
   - Badges de niveaux, barres de progression

7. **Générer le certificat**
   - `/certificates` → Sélectionner la formation
   - Télécharger pour les élèves éligibles

---

## 🏗 Stack technique

| Catégorie      | Technologie                                           |
| -------------- | ----------------------------------------------------- |
| Framework      | Next.js 16 (App Router)                               |
| Langage        | TypeScript 5                                          |
| CSS            | Tailwind CSS 4                                        |
| UI             | Radix UI (Dialog, Tabs, Accordion, Select, Progress…) |
| State/Fetching | TanStack Query (React Query)                          |
| Formulaires    | React Hook Form + Zod                                 |
| i18n           | next-intl                                             |
| Icônes         | Lucide React                                          |
| Tests E2E      | Playwright                                            |
| Tests A11y     | @axe-core/playwright                                  |

---

© 2026 ASTBA – Association Sciences and Technology Ben Arous, Tunisie
