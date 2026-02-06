# ASTBA Backend — Training & Attendance Tracking

> Backend Spring Boot pour l'Association Sciences and Technology Ben Arous (Tunisie).  
> Gestion des formations, inscriptions, présences, progression, certificats PDF, authentification JWT et RBAC.

---

## Prérequis

- **Java 17+** (JDK)
- **Maven 3.8+**
- **MongoDB** (local ou distant)

---

## Variables d'environnement

| Variable                       | Description                           | Défaut                                       |
|--------------------------------|---------------------------------------|----------------------------------------------|
| `MONGODB_URI`                  | Connection string MongoDB             | `mongodb://localhost:27017/astba`             |
| `SERVER_PORT`                  | Port du serveur                       | `8080`                                       |
| `ASTBA_JWT_SECRET`             | Clé secrète JWT (min 32 chars)        | dev default (changer en prod !)              |
| `ASTBA_JWT_ACCESS_TTL_MIN`     | Durée access token (minutes)          | `15`                                         |
| `ASTBA_JWT_REFRESH_TTL_DAYS`   | Durée refresh token (jours)           | `7`                                          |
| `ASTBA_COOKIE_SECURE`          | Cookie Secure (true en HTTPS)         | `false`                                      |
| `ASTBA_COOKIE_SAME_SITE`       | SameSite policy                       | `Lax`                                        |
| `FRONTEND_URL`                 | URL du frontend                       | `http://localhost:3000`                      |
| `ASTBA_PUBLIC_REGISTER`        | Inscription publique activée          | `true`                                       |
| `ASTBA_SEED_ADMIN_EMAIL`       | Email admin initial                   | `admin@astba.tn`                             |
| `ASTBA_SEED_ADMIN_PASSWORD`    | Mot de passe admin initial            | `Admin123!`                                  |

Copier `.env.example` → `.env` et adapter.

---

## Lancer le projet

```bash
cd backend

# Avec Maven wrapper (si disponible)
./mvnw spring-boot:run

# Ou directement
mvn spring-boot:run

# Avec variables d'environnement personnalisées
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/astba SERVER_PORT=8080 mvn spring-boot:run
```

---

## Endpoints principaux

### Swagger / OpenAPI
- **Swagger UI** : [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **API Docs JSON** : [http://localhost:8080/api-docs](http://localhost:8080/api-docs)

### Health Check
- **Actuator** : [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

### API REST (`/api`)

| Méthode | Endpoint                                         | Description                                    |
|---------|--------------------------------------------------|------------------------------------------------|
| GET     | `/api/students?query=&page=0&size=20`            | Lister les étudiants (paginé, recherche)       |
| POST    | `/api/students`                                  | Créer un étudiant                              |
| GET     | `/api/students/{studentId}`                      | Détails d'un étudiant                          |
| PUT     | `/api/students/{studentId}`                      | Modifier un étudiant                           |
| DELETE  | `/api/students/{studentId}`                      | Supprimer un étudiant                          |
| GET     | `/api/trainings`                                 | Lister les formations                          |
| POST    | `/api/trainings`                                 | Créer une formation                            |
| GET     | `/api/trainings/{trainingId}`                    | Détails d'une formation                        |
| PUT     | `/api/trainings/{trainingId}`                    | Modifier une formation                         |
| DELETE  | `/api/trainings/{trainingId}`                    | Supprimer une formation                        |
| GET     | `/api/trainings/{trainingId}/sessions`           | Liste aplatie des 24 séances                   |
| POST    | `/api/enrollments`                               | Inscrire un élève                              |
| GET     | `/api/enrollments/{enrollmentId}`                | Détails d'une inscription                      |
| GET     | `/api/students/{studentId}/enrollments`          | Inscriptions d'un élève                        |
| GET     | `/api/trainings/{trainingId}/enrollments`        | Inscriptions à une formation                   |
| POST    | `/api/attendance/mark`                           | Marquer les présences (batch)                  |
| GET     | `/api/attendance/session/{sessionId}?trainingId=`| Statuts d'une séance                           |
| GET     | `/api/students/{studentId}/progress`             | Progression d'un élève                         |
| GET     | `/api/enrollments/{enrollmentId}/progress`       | Progression d'une inscription                  |
| GET     | `/api/enrollments/{enrollmentId}/certificate/meta` | Métadonnées certificat                       |
| GET     | `/api/enrollments/{enrollmentId}/certificate`    | Télécharger le certificat PDF                  |

---

## Données de démonstration (Seed)

Au premier démarrage (collections vides), le système crée automatiquement :

- **2 formations** : "Robotique Débutant" et "Web Dev Junior" (4 niveaux × 6 séances chacune)
- **8 étudiants** avec données réalistes
- **5 inscriptions** avec présences pré-remplies :
  - **Ahmed Ben Ali** → Robotique : **24/24 PRESENT** → ✅ Certificat disponible !
  - **Fatma Trabelsi** → Robotique : 18/24 (niveaux 1-3 validés)
  - **Mohamed Hammami** → Robotique : 6/24 (niveau 1 validé)
  - **Amira Bouazizi** → Web Dev : 12/24 (niveaux 1-2 validés)
  - **Youssef Chahed** → Web Dev : inscrit, pas de présence

---

## Hypothèses métier

1. **Niveau validé** : les 6 séances du niveau ont le statut `PRESENT` ou `EXCUSED`.
2. **Formation complétée** : les 4 niveaux sont validés.
3. **Éligibilité certificat** : formation complétée = éligible.
4. **Séances par formation** : 4 niveaux × 6 séances = 24 séances.
5. **Statuts de présence** : `PRESENT`, `ABSENT`, `EXCUSED`.
6. **Auto-génération** : si aucun niveau n'est fourni à la création d'une formation, 4 niveaux × 6 séances sont auto-générés avec des UUID stables.

---

## Exemples curl

### Créer un étudiant
```bash
curl -X POST http://localhost:8080/api/students \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Nadia","lastName":"Khelifi","email":"nadia@email.com"}'
```

### Créer une formation (auto-génère 4×6 séances)
```bash
curl -X POST http://localhost:8080/api/trainings \
  -H "Content-Type: application/json" \
  -d '{"title":"IoT Avancé","description":"Formation Internet des Objets"}'
```

### Inscrire un élève
```bash
curl -X POST http://localhost:8080/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"studentId":"<STUDENT_ID>","trainingId":"<TRAINING_ID>"}'
```

### Marquer les présences
```bash
curl -X POST http://localhost:8080/api/attendance/mark \
  -H "Content-Type: application/json" \
  -d '{
    "trainingId":"<TRAINING_ID>",
    "sessionId":"<SESSION_ID>",
    "records":[
      {"studentId":"<S1>","status":"PRESENT"},
      {"studentId":"<S2>","status":"ABSENT"}
    ]
  }'
```

### Voir la progression
```bash
curl http://localhost:8080/api/students/<STUDENT_ID>/progress
```

### Télécharger un certificat PDF
```bash
curl http://localhost:8080/api/enrollments/<ENROLLMENT_ID>/certificate \
  -H "Accept: application/pdf" \
  --output certificate.pdf
```

---

## Architecture du code

```
src/main/java/tn/astba/
├── AstbaApplication.java          # Point d'entrée
├── config/
│   ├── CorsConfig.java            # CORS pour Next.js
│   ├── DataSeeder.java            # Données de démo
│   ├── MongoConfig.java           # Auditing MongoDB
│   └── OpenApiConfig.java         # Swagger/OpenAPI
├── controller/
│   ├── AttendanceController.java
│   ├── CertificateController.java
│   ├── EnrollmentController.java
│   ├── ProgressController.java
│   ├── StudentController.java
│   └── TrainingController.java
├── domain/
│   ├── AttendanceEntry.java
│   ├── AttendanceStatus.java
│   ├── Enrollment.java
│   ├── Level.java
│   ├── ProgressSnapshot.java
│   ├── Session.java
│   ├── Student.java
│   └── Training.java
├── dto/                           # Request/Response DTOs
├── exception/
│   ├── BadRequestException.java
│   ├── ConflictException.java
│   ├── GlobalExceptionHandler.java
│   └── ResourceNotFoundException.java
├── repository/
│   ├── EnrollmentRepository.java
│   ├── StudentRepository.java
│   └── TrainingRepository.java
└── service/
    ├── AttendanceService.java
    ├── CertificateService.java
    ├── EnrollmentService.java
    ├── ProgressCalculator.java
    ├── ProgressService.java
    ├── StudentService.java
    └── TrainingService.java
```

---

## Tests

```bash
mvn test
```

Tests inclus :
- `ProgressCalculatorTest` — 6 tests de calcul de progression
- `StudentControllerTest` — Tests REST + validation
- `AttendanceControllerTest` — Tests marquage présence

---

## Technologies

- Java 17
- Spring Boot 3.2
- MongoDB (Spring Data)
- Springdoc OpenAPI (Swagger UI)
- Apache PDFBox (certificats PDF)
- Lombok
- JUnit 5 + MockMvc
