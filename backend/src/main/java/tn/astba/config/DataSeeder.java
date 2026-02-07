package tn.astba.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import tn.astba.domain.*;
import tn.astba.repository.EnrollmentRepository;
import tn.astba.repository.GroupRepository;
import tn.astba.repository.StudentRepository;
import tn.astba.repository.TrainingRepository;
import tn.astba.repository.UserRepository;
import tn.astba.service.ProgressCalculator;
import tn.astba.service.TrainingService;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

/**
 * Seed data for demo purposes.
 * Only runs if collections are empty.
 * Seeds 50 students, 10 trainings, 5 groups (10 students each) with varied progression.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final StudentRepository studentRepository;
    private final TrainingRepository trainingRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${astba.seed.admin-email:admin@astba.tn}")
    private String seedAdminEmail;

    @Value("${astba.seed.admin-password:Admin123!}")
    private String seedAdminPassword;

    // ── Name pools ──
    private static final String[] FIRST_NAMES_M = {
        "Ahmed", "Mohamed", "Youssef", "Sami", "Omar", "Ali", "Hamza", "Amine",
        "Karim", "Bilel", "Fares", "Nabil", "Rami", "Khalil", "Zied", "Hatem",
        "Aymen", "Mehdi", "Hichem", "Nizar", "Wassim", "Sofien", "Anas", "Ghaith", "Seif"
    };
    private static final String[] FIRST_NAMES_F = {
        "Fatma", "Amira", "Nour", "Ines", "Sara", "Mariem", "Yasmine", "Rania",
        "Chaima", "Hiba", "Donia", "Meriem", "Eya", "Farah", "Asma", "Salma",
        "Rahma", "Ghada", "Aya", "Lina", "Wissal", "Malek", "Rim", "Syrine", "Manel"
    };
    private static final String[] LAST_NAMES = {
        "Ben Ali", "Trabelsi", "Hammami", "Bouazizi", "Chahed", "Jebali", "Gharbi",
        "Maaloul", "Bouzid", "Mansouri", "Khelifi", "Haddad", "Rezgui", "Mejri",
        "Nasri", "Dridi", "Saidi", "Belhadj", "Tlili", "Makhlouf", "Ayari",
        "Bennour", "Souissi", "Khemiri", "Ghanmi"
    };

    // ── Training definitions ──
    private static final String[][] TRAINING_DEFS = {
        {"Robotique Débutant",       "Initiation à la robotique : électronique, Arduino et construction de robots simples."},
        {"Web Dev Junior",           "Développement web : HTML, CSS, JavaScript et introduction à React."},
        {"Python pour les Jeunes",   "Programmation Python ludique : jeux, quiz et mini-projets."},
        {"Électronique Créative",    "Circuits, capteurs et projets IoT pour débutants."},
        {"Design 3D & Impression",   "Modélisation 3D avec TinkerCAD et Fusion 360, impression 3D."},
        {"Intelligence Artificielle","Bases de l'IA : machine learning, vision par ordinateur, chatbots."},
        {"Développement Mobile",     "Création d'applications mobiles avec Flutter."},
        {"Cybersécurité Junior",     "Sécurité informatique, cryptographie et hacking éthique pour débutants."},
        {"Jeux Vidéo avec Unity",    "Création de jeux 2D/3D avec le moteur Unity et C#."},
        {"Drones & Aéromodélisme",   "Pilotage, programmation et construction de drones."},
    };

    @Override
    public void run(String... args) {
        seedAdminUser();

        if (studentRepository.count() > 0 || trainingRepository.count() > 0) {
            log.info("Base de données non vide, seed ignoré.");
            return;
        }

        log.info("=== Initialisation des données de démonstration (50 étudiants, 10 formations, 5 groupes) ===");

        // ====== 10 TRAININGS ======
        List<Training> trainings = new ArrayList<>();
        for (String[] def : TRAINING_DEFS) {
            Training t = Training.builder()
                    .title(def[0])
                    .description(def[1])
                    .levels(TrainingService.generateDefaultLevels())
                    .build();
            trainings.add(trainingRepository.save(t));
        }
        log.info("{} formations créées", trainings.size());

        // ====== 50 STUDENTS ======
        Random rng = new Random(42); // deterministic seed
        List<Student> students = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            boolean female = i % 2 == 1;
            String firstName = female
                    ? FIRST_NAMES_F[i / 2 % FIRST_NAMES_F.length]
                    : FIRST_NAMES_M[i / 2 % FIRST_NAMES_M.length];
            String lastName = LAST_NAMES[i % LAST_NAMES.length];

            int year = 2009 + rng.nextInt(4);     // 2009-2012
            int month = 1 + rng.nextInt(12);
            int day = 1 + rng.nextInt(28);
            LocalDate birthDate = LocalDate.of(year, month, day);

            String phone = String.format("%08d", 50000000 + i * 111111);
            String email = (firstName + "." + lastName)
                    .toLowerCase()
                    .replace(" ", "")
                    .replace("é", "e")
                    .replace("è", "e")
                    .replace("ê", "e")
                    + (i + 1) + "@email.com";

            students.add(Student.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .birthDate(birthDate)
                    .email(email)
                    .phone(phone)
                    .build());
        }
        students = studentRepository.saveAll(students);
        log.info("{} étudiants créés", students.size());

        // ====== TRAINER user id (for groups) ======
        String trainerId = userRepository.findByEmail("trainer@astba.tn")
                .map(User::getId)
                .orElse(null);

        // ====== 5 GROUPS (10 students each) — first 5 trainings ======
        DayOfWeek[] days = { DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.SATURDAY };
        LocalTime[] starts = { LocalTime.of(9, 0), LocalTime.of(10, 0), LocalTime.of(14, 0), LocalTime.of(15, 0), LocalTime.of(9, 30) };

        List<Group> groups = new ArrayList<>();
        for (int g = 0; g < 5; g++) {
            Training training = trainings.get(g);
            List<String> groupStudentIds = new ArrayList<>();
            for (int s = g * 10; s < (g + 1) * 10; s++) {
                groupStudentIds.add(students.get(s).getId());
            }
            Group group = Group.builder()
                    .name("Groupe " + (char) ('A' + g))
                    .trainingId(training.getId())
                    .dayOfWeek(days[g])
                    .startTime(starts[g])
                    .endTime(starts[g].plusHours(1).plusMinutes(30))
                    .studentIds(groupStudentIds)
                    .trainerId(trainerId)
                    .build();
            groups.add(groupRepository.save(group));
            log.info("Groupe {} créé: {} étudiants pour '{}'", group.getName(), groupStudentIds.size(), training.getTitle());
        }

        // ====== ENROLLMENTS with varied attendance ======
        // Progression pattern per group of 10 students:
        //   2 students → 24/24 PRESENT (eligible for certificate)
        //   2 students → 18/24 (levels 1-3)
        //   2 students → 12/24 (levels 1-2)
        //   2 students → 6/24  (level 1 only)
        //   2 students → 0/24  (no attendance)
        int[] levelsPattern = {4, 4, 3, 3, 2, 2, 1, 1, 0, 0};

        int enrollmentCount = 0;
        for (int g = 0; g < 5; g++) {
            Training training = trainings.get(g);
            Group group = groups.get(g);
            for (int s = 0; s < 10; s++) {
                Student student = students.get(g * 10 + s);
                Enrollment enrollment = Enrollment.builder()
                        .studentId(student.getId())
                        .trainingId(training.getId())
                        .groupId(group.getId())
                        .enrolledAt(Instant.now())
                        .attendance(new HashMap<>())
                        .build();
                enrollment = enrollmentRepository.save(enrollment);

                int levelsToMark = levelsPattern[s];
                if (levelsToMark == 4) {
                    markAllPresent(enrollment, training);
                } else if (levelsToMark > 0) {
                    markLevelsPresent(enrollment, training, levelsToMark);
                }

                enrollment.setProgressSnapshot(ProgressCalculator.compute(enrollment, training));
                enrollmentRepository.save(enrollment);
                enrollmentCount++;
            }
        }
        log.info("{} inscriptions créées avec présences variées", enrollmentCount);

        log.info("=== Données de démonstration chargées avec succès ===");
        log.info("  → 50 étudiants, 10 formations, 5 groupes");
        log.info("  → Par groupe: 2 certifiables, 2×niv1-3, 2×niv1-2, 2×niv1, 2×aucun");
        log.info("  → Swagger UI: http://localhost:8080/swagger-ui.html");
    }

    /**
     * Seed admin user if not exists. Also create demo TRAINER and MANAGER accounts.
     */
    private void seedAdminUser() {
        String email = seedAdminEmail.toLowerCase().trim();
        if (!userRepository.existsByEmail(email)) {
            User admin = User.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(seedAdminPassword))
                    .firstName("Admin")
                    .lastName("ASTBA")
                    .roles(Set.of(Role.ADMIN))
                    .status(UserStatus.ACTIVE)
                    .provider(AuthProvider.LOCAL)
                    .build();
            userRepository.save(admin);
            log.info("Utilisateur admin créé: {}", email);
        } else {
            log.info("Utilisateur admin déjà existant: {}", email);
        }

        // Demo trainer account
        if (!userRepository.existsByEmail("trainer@astba.tn")) {
            userRepository.save(User.builder()
                    .email("trainer@astba.tn")
                    .passwordHash(passwordEncoder.encode("Trainer123!"))
                    .firstName("Formateur")
                    .lastName("Demo")
                    .roles(Set.of(Role.TRAINER))
                    .status(UserStatus.ACTIVE)
                    .provider(AuthProvider.LOCAL)
                    .build());
            log.info("Utilisateur formateur de démo créé: trainer@astba.tn");
        }

        // Demo manager account
        if (!userRepository.existsByEmail("manager@astba.tn")) {
            userRepository.save(User.builder()
                    .email("manager@astba.tn")
                    .passwordHash(passwordEncoder.encode("Manager123!"))
                    .firstName("Manager")
                    .lastName("Demo")
                    .roles(Set.of(Role.MANAGER))
                    .status(UserStatus.ACTIVE)
                    .provider(AuthProvider.LOCAL)
                    .build());
            log.info("Utilisateur manager de démo créé: manager@astba.tn");
        }
    }

    private void markAllPresent(Enrollment enrollment, Training training) {
        for (Level level : training.getLevels()) {
            for (Session session : level.getSessions()) {
                enrollment.getAttendance().put(session.getSessionId(), AttendanceEntry.builder()
                        .status(AttendanceStatus.PRESENT)
                        .markedAt(Instant.now())
                        .build());
            }
        }
    }

    private void markLevelsPresent(Enrollment enrollment, Training training, int levelsToMark) {
        for (Level level : training.getLevels()) {
            if (level.getLevelNumber() > levelsToMark) break;
            for (Session session : level.getSessions()) {
                enrollment.getAttendance().put(session.getSessionId(), AttendanceEntry.builder()
                        .status(AttendanceStatus.PRESENT)
                        .markedAt(Instant.now())
                        .build());
            }
        }
    }
}
