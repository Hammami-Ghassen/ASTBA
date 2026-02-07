# ASTBA Backend — Training & Attendance Tracking

> API REST Spring Boot pour l'**Association Sciences and Technology Ben Arous** (Tunisie).
> Gestion des formations, groupes, inscriptions, présences, progression,
> certificats PDF, authentification JWT (HttpOnly cookies) et RBAC.

---

## Table des matières

- [Prérequis](#prérequis)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Authentification & sécurité](#authentification--sécurité)
- [Google OAuth2](#google-oauth2)
- [API REST](#api-rest)
- [Données de démonstration (Seed)](#données-de-démonstration-seed)
- [Hypothèses métier](#hypothèses-métier)
- [Architecture du code](#architecture-du-code)
- [Tests](#tests)
- [Déploiement Heroku](#déploiement-heroku)
- [Stack technique](#stack-technique)

---

## Prérequis

| Outil       | Version             |
| ----------- | ------------------- |
| **Java**    | 17+                 |
| **Maven**   | 3.8+                |
| **MongoDB** | 6+ (local ou Atlas) |

---

## Démarrage rapide

```bash
cd backend

# 1. Copier le fichier .env
cp .env.example .env      # Adapter les valeurs

# 2. Lancer
mvn spring-boot:run
```

L'application démarre sur **http://localhost:8080**.

> **Note :** Spring Boot charge automatiquement le fichier `.env` grâce à la
> dépendance `spring-dotenv`.

### Swagger UI

| Ressource       | URL                                   |
| --------------- | ------------------------------------- |
| Swagger UI      | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON    | http://localhost:8080/api-docs        |
| Actuator Health | http://localhost:8080/actuator/health |

---

## Variables d'environnement

| Variable                     | Description                      | Défaut                            |
| ---------------------------- | -------------------------------- | --------------------------------- |
| `MONGODB_URI`                | Connection string MongoDB        | MongoDB Atlas (voir `.env`)       |
| `SERVER_PORT`                | Port du serveur                  | `8080`                            |
| `ASTBA_JWT_SECRET`           | Clé secrète JWT (≥ 32 chars)     | dev default — **changer en prod** |
| `ASTBA_JWT_ACCESS_TTL_MIN`   | Durée access token (minutes)     | `15`                              |
| `ASTBA_JWT_REFRESH_TTL_DAYS` | Durée refresh token (jours)      | `7`                               |
| `ASTBA_COOKIE_SECURE`        | Cookie Secure flag (HTTPS)       | `false`                           |
| `ASTBA_COOKIE_SAME_SITE`     | SameSite policy (`Lax` / `None`) | `Lax`                             |
| `FRONTEND_URL`               | URL du frontend (CORS)           | `http://localhost:3000`           |
| `ASTBA_PUBLIC_REGISTER`      | Inscription publique activée     | `true`                            |
| `ASTBA_SEED_ADMIN_EMAIL`     | Email admin initial (seed)       | `admin@astba.tn`                  |
| `ASTBA_SEED_ADMIN_PASSWORD`  | Mot de passe admin initial       | `Admin123!`                       |

### Google OAuth2 (optionnel)

| Variable                 | Description                    |
| ------------------------ | ------------------------------ |
| `SPRING_PROFILES_ACTIVE` | Mettre `oauth` pour activer    |
| `GOOGLE_CLIENT_ID`       | Client ID Google Cloud Console |
| `GOOGLE_CLIENT_SECRET`   | Client Secret Google           |
| `ASTBA_EXCLUDE_OAUTH2`   | Laisser vide quand OAuth actif |

---

## Authentification & sécurité

### Stratégie : JWT dans des cookies HttpOnly

1. **Login** (`POST /api/auth/login`) → Le serveur génère un `access_token` (JWT)
   et un `refresh_token`, stockés dans des **cookies HttpOnly**.
2. **Chaque requête** envoie automatiquement les cookies — aucun header
   `Authorization` n'est nécessaire côté client.
3. **Refresh** (`POST /api/auth/refresh`) → Renouvelle l'access token via le
   refresh token.
4. **Logout** (`POST /api/auth/logout`) → Supprime les cookies et invalide le
   refresh token.

### RBAC (Role Based Access Control)

| Rôle      | Droits                                                                           |
| --------- | -------------------------------------------------------------------------------- |
| `ADMIN`   | Tout : gestion utilisateurs, formations, élèves, groupes, présences, certificats |
| `MANAGER` | Formations, élèves, groupes, présences, certificats (pas de panel admin)         |
| `TRAINER` | Consultation + marquage des présences uniquement                                 |

### Endpoints publics (sans authentification)

- `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`
- `/swagger-ui/**`, `/api-docs/**`
- `/actuator/health`
- `/oauth2/**`, `/login/oauth2/**`

---

## Google OAuth2

1. L'utilisateur clique « Se connecter avec Google » dans le frontend.
2. Redirection vers `GET /oauth2/authorization/google` (Spring Security).
3. Google authentifie l'utilisateur → callback Spring.
4. Le backend crée/retrouve l'utilisateur, génère le JWT, set les cookies.
5. Redirection vers `{FRONTEND_URL}/auth/callback`.
6. Le frontend appelle `GET /api/auth/me` pour charger le profil.

> **Activer** : mettre `SPRING_PROFILES_ACTIVE=oauth` et les variables
> `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

---

## API REST

Tous les endpoints sont préfixés par `/api`.

### Étudiants

| Méthode | Endpoint                              | Description                          |
| ------- | ------------------------------------- | ------------------------------------ |
| GET     | `/api/students?query=&page=0&size=20` | Lister (paginé, recherche full-text) |
| POST    | `/api/students`                       | Créer un étudiant                    |
| GET     | `/api/students/{id}`                  | Détails                              |
| PUT     | `/api/students/{id}`                  | Modifier                             |
| DELETE  | `/api/students/{id}`                  | Supprimer                            |
| GET     | `/api/students/{id}/enrollments`      | Inscriptions de l'étudiant           |
| GET     | `/api/students/{id}/progress`         | Progression de l'étudiant            |

### Formations

| Méthode | Endpoint                          | Description                     |
| ------- | --------------------------------- | ------------------------------- |
| GET     | `/api/trainings`                  | Lister                          |
| POST    | `/api/trainings`                  | Créer (auto-génère 4×6 séances) |
| GET     | `/api/trainings/{id}`             | Détails                         |
| PUT     | `/api/trainings/{id}`             | Modifier                        |
| DELETE  | `/api/trainings/{id}`             | Supprimer                       |
| GET     | `/api/trainings/{id}/sessions`    | Liste aplatie des 24 séances    |
| GET     | `/api/trainings/{id}/enrollments` | Inscriptions à la formation     |

### Groupes

| Méthode | Endpoint                                | Description                              |
| ------- | --------------------------------------- | ---------------------------------------- |
| GET     | `/api/groups?trainingId=`               | Lister (optionnel filtrer par formation) |
| POST    | `/api/groups`                           | Créer un groupe                          |
| GET     | `/api/groups/{id}`                      | Détails du groupe                        |
| PUT     | `/api/groups/{id}`                      | Modifier                                 |
| DELETE  | `/api/groups/{id}`                      | Supprimer                                |
| POST    | `/api/groups/{id}/students/{studentId}` | Ajouter un étudiant au groupe            |
| DELETE  | `/api/groups/{id}/students/{studentId}` | Retirer un étudiant du groupe            |

### Inscriptions

| Méthode | Endpoint                         | Description                       |
| ------- | -------------------------------- | --------------------------------- |
| POST    | `/api/enrollments`               | Inscrire un élève à une formation |
| GET     | `/api/enrollments/{id}`          | Détails de l'inscription          |
| GET     | `/api/enrollments/{id}/progress` | Progression de l'inscription      |

### Présences

| Méthode | Endpoint                                          | Description                   |
| ------- | ------------------------------------------------- | ----------------------------- |
| POST    | `/api/attendance/mark`                            | Marquer les présences (batch) |
| GET     | `/api/attendance/session/{sessionId}?trainingId=` | Statuts d'une séance          |

### Certificats

| Méthode | Endpoint                                 | Description               |
| ------- | ---------------------------------------- | ------------------------- |
| GET     | `/api/enrollments/{id}/certificate/meta` | Métadonnées du certificat |
| GET     | `/api/enrollments/{id}/certificate`      | Télécharger le PDF        |

### Authentification

| Méthode | Endpoint                       | Description                      |
| ------- | ------------------------------ | -------------------------------- |
| POST    | `/api/auth/login`              | Connexion (email + mot de passe) |
| POST    | `/api/auth/register`           | Inscription                      |
| GET     | `/api/auth/me`                 | Utilisateur courant              |
| POST    | `/api/auth/logout`             | Déconnexion                      |
| POST    | `/api/auth/refresh`            | Rafraîchir le token              |
| GET     | `/oauth2/authorization/google` | Redirection Google OAuth2        |

### Administration

| Méthode | Endpoint                          | Description                       |
| ------- | --------------------------------- | --------------------------------- |
| GET     | `/api/admin/users?q=&page=&size=` | Lister les utilisateurs (ADMIN)   |
| PATCH   | `/api/admin/users/{id}/roles`     | Changer le rôle                   |
| PATCH   | `/api/admin/users/{id}/status`    | Activer/désactiver un utilisateur |

### Upload de fichiers

| Méthode | Endpoint             | Description               |
| ------- | -------------------- | ------------------------- |
| POST    | `/api/uploads/image` | Upload d'image (5 Mo max) |

---

## Données de démonstration (Seed)

Au premier démarrage (collections vides), le système crée automatiquement :

- **1 compte admin** avec l'email et le mot de passe configurés dans `.env`
- **2 formations** : « Robotique Débutant » et « Web Dev Junior »
  (4 niveaux × 6 séances = 24 séances chacune)
- **8 étudiants** avec données réalistes tunisiennes
- **5 inscriptions** avec présences pré-remplies :

| Étudiant        | Formation | Présences | État                     |
| --------------- | --------- | --------- | ------------------------ |
| Ahmed Ben Ali   | Robotique | 24/24     | ✅ Certificat disponible |
| Fatma Trabelsi  | Robotique | 18/24     | Niveaux 1-3 validés      |
| Mohamed Hammami | Robotique | 6/24      | Niveau 1 validé          |
| Amira Bouazizi  | Web Dev   | 12/24     | Niveaux 1-2 validés      |
| Youssef Chahed  | Web Dev   | 0/24      | Inscrit, pas de présence |

---

## Hypothèses métier

| Règle                  | Détail                                                            |
| ---------------------- | ----------------------------------------------------------------- |
| Structure formation    | 4 niveaux × 6 séances = 24 séances                                |
| Niveau validé          | Les 6 séances du niveau sont `PRESENT` ou `EXCUSED`               |
| Formation complétée    | Les 4 niveaux sont validés                                        |
| Éligibilité certificat | Formation complétée = éligible au certificat PDF                  |
| Statuts de présence    | `PRESENT`, `ABSENT`, `EXCUSED`                                    |
| Auto-génération        | Création d'une formation sans niveaux → 4×6 séances auto-générées |

---

## Architecture du code

```
src/main/java/tn/astba/
├── AstbaApplication.java              # Point d'entrée Spring Boot
│
├── config/
│   ├── CorsConfig.java                # CORS (autorise le frontend)
│   ├── DataSeeder.java                # Données de démo au démarrage
│   ├── MongoConfig.java               # Auditing MongoDB (createdAt/updatedAt)
│   ├── OpenApiConfig.java             # Configuration Swagger/OpenAPI
│   ├── PasswordEncoderConfig.java     # BCrypt encoder
│   ├── SecurityConfig.java            # Spring Security (JWT filter, routes publiques)
│   └── WebMvcConfig.java              # Servir les fichiers uploadés
│
├── controller/
│   ├── AdminUsersController.java      # CRUD utilisateurs (ADMIN)
│   ├── AttendanceController.java      # Marquage des présences
│   ├── AuthController.java            # Login, register, logout, refresh, me
│   ├── CertificateController.java     # Téléchargement certificats PDF
│   ├── EnrollmentController.java      # Inscriptions
│   ├── FileUploadController.java      # Upload d'images
│   ├── GroupController.java           # Gestion des groupes
│   ├── ProgressController.java        # Progression étudiants
│   ├── StudentController.java         # CRUD étudiants
│   └── TrainingController.java        # CRUD formations
│
├── domain/                            # Entités MongoDB
│   ├── AttendanceEntry.java
│   ├── AttendanceStatus.java          # Enum : PRESENT, ABSENT, EXCUSED
│   ├── AuthProvider.java              # Enum : LOCAL, GOOGLE
│   ├── Enrollment.java
│   ├── Group.java
│   ├── Level.java
│   ├── ProgressSnapshot.java
│   ├── RefreshToken.java
│   ├── Role.java                      # Enum : ADMIN, MANAGER, TRAINER
│   ├── Session.java
│   ├── Student.java
│   ├── Training.java
│   ├── User.java
│   └── UserStatus.java               # Enum : ACTIVE, DISABLED
│
├── dto/                               # Requêtes / Réponses
│   ├── AdminCreateUserRequest.java
│   ├── AttendanceMarkRequest.java / AttendanceMarkResponse.java
│   ├── AttendanceRecord.java
│   ├── AuthResponse.java
│   ├── CertificateMetaResponse.java
│   ├── EnrollmentCreateRequest.java / EnrollmentResponse.java
│   ├── FlatSessionResponse.java
│   ├── GroupCreateRequest.java / GroupResponse.java / GroupUpdateRequest.java
│   ├── LoginRequest.java / RegisterRequest.java
│   ├── MissedSessionInfo.java
│   ├── SessionAttendanceInfo.java
│   ├── StudentCreateRequest.java / StudentResponse.java / StudentUpdateRequest.java
│   ├── StudentProgressResponse.java
│   ├── TrainingCreateRequest.java / TrainingResponse.java / TrainingUpdateRequest.java
│   ├── UpdateRolesRequest.java / UpdateStatusRequest.java
│   └── UserResponse.java
│
├── exception/
│   ├── BadRequestException.java       # 400
│   ├── ConflictException.java         # 409
│   ├── GlobalExceptionHandler.java    # @ControllerAdvice centralisé
│   └── ResourceNotFoundException.java # 404
│
├── repository/
│   ├── EnrollmentRepository.java
│   ├── GroupRepository.java
│   ├── RefreshTokenRepository.java
│   ├── StudentRepository.java
│   ├── TrainingRepository.java
│   └── UserRepository.java
│
├── security/
│   ├── CookieHelper.java                        # Gestion cookies HttpOnly
│   ├── JwtAccessDeniedHandler.java               # Handler 403
│   ├── JwtAuthenticationEntryPoint.java           # Handler 401
│   ├── JwtAuthenticationFilter.java               # Filtre JWT (OncePerRequest)
│   ├── JwtService.java                            # Génération/validation JWT
│   ├── OAuth2AuthenticationFailureHandler.java    # Échec OAuth2
│   └── OAuth2AuthenticationSuccessHandler.java    # Succès OAuth2 → set cookies
│
└── service/
    ├── AttendanceService.java
    ├── AuthService.java               # Login, register, refresh, OAuth2
    ├── CertificateService.java        # Génération PDF (PDFBox)
    ├── EnrollmentService.java
    ├── FileStorageService.java        # Stockage fichiers uploadés
    ├── GroupService.java
    ├── ProgressCalculator.java        # Calcul niveaux validés / progression
    ├── ProgressService.java
    ├── RefreshTokenService.java
    ├── StudentService.java
    └── TrainingService.java
```

---

## Tests

```bash
mvn test
```

Tests unitaires et d'intégration :

- **`ProgressCalculatorTest`** — Calcul de progression (6 scénarios)
- **`StudentControllerTest`** — Tests REST étudiants + validation
- **`AttendanceControllerTest`** — Tests marquage de présence

---

## Déploiement Heroku

L'application est déployée sur Heroku (UE) à l'adresse :
**https://astba-backend-fb7592266f72.herokuapp.com/**

### Fichiers de déploiement

- **`Procfile`** : `web: java $JAVA_OPTS -jar target/*.jar --server.port=$PORT`
- **`system.properties`** : `java.runtime.version=17`

### Déployer une mise à jour

```bash
# Depuis la racine du monorepo
git subtree push --prefix backend heroku main
```

### Variables d'environnement Heroku

Configurer via `heroku config:set` ou le dashboard Heroku :

```bash
heroku config:set MONGODB_URI="mongodb+srv://..." \
  ASTBA_JWT_SECRET="..." \
  ASTBA_COOKIE_SECURE=true \
  ASTBA_COOKIE_SAME_SITE=None \
  FRONTEND_URL=https://your-frontend.vercel.app \
  SPRING_PROFILES_ACTIVE=oauth \
  GOOGLE_CLIENT_ID="..." \
  GOOGLE_CLIENT_SECRET="..."
```

> **Important** : En production cross-origin, utiliser `ASTBA_COOKIE_SECURE=true`
> et `ASTBA_COOKIE_SAME_SITE=None`.

---

## Exemples curl

### Authentification

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@astba.tn","password":"Admin123!"}' \
  -c cookies.txt

# Requêtes authentifiées (utiliser le cookie)
curl http://localhost:8080/api/auth/me -b cookies.txt
```

### Étudiants

```bash
curl -X POST http://localhost:8080/api/students \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"firstName":"Nadia","lastName":"Khelifi","email":"nadia@email.com"}'
```

### Formations

```bash
curl -X POST http://localhost:8080/api/trainings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"IoT Avancé","description":"Formation Internet des Objets"}'
```

### Inscription

```bash
curl -X POST http://localhost:8080/api/enrollments \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"studentId":"<STUDENT_ID>","trainingId":"<TRAINING_ID>"}'
```

### Présences

```bash
curl -X POST http://localhost:8080/api/attendance/mark \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "trainingId":"<TRAINING_ID>",
    "sessionId":"<SESSION_ID>",
    "records":[
      {"studentId":"<S1>","status":"PRESENT"},
      {"studentId":"<S2>","status":"ABSENT"}
    ]
  }'
```

### Certificat PDF

```bash
curl http://localhost:8080/api/enrollments/<ENROLLMENT_ID>/certificate \
  -b cookies.txt \
  -H "Accept: application/pdf" \
  --output certificate.pdf
```

---

## Stack technique

| Catégorie       | Technologie                              |
| --------------- | ---------------------------------------- |
| Langage         | Java 17                                  |
| Framework       | Spring Boot 3.2.3                        |
| Base de données | MongoDB (Spring Data MongoDB)            |
| Sécurité        | Spring Security + JWT (JJWT 0.12.5)      |
| OAuth2          | Spring OAuth2 Client (Google)            |
| API Docs        | Springdoc OpenAPI 2.3 (Swagger UI)       |
| PDF             | Apache PDFBox 3.0.1                      |
| Utilitaire      | Lombok 1.18.36                           |
| Tests           | JUnit 5 + MockMvc + Spring Security Test |
| Déploiement     | Heroku (Java buildpack)                  |

---

© 2026 ASTBA — Association Sciences and Technology Ben Arous, Tunisie
