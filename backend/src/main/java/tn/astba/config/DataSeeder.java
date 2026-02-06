package tn.astba.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import tn.astba.domain.*;
import tn.astba.repository.EnrollmentRepository;
import tn.astba.repository.StudentRepository;
import tn.astba.repository.TrainingRepository;
import tn.astba.repository.UserRepository;
import tn.astba.service.ProgressCalculator;
import tn.astba.service.TrainingService;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Seed data for demo purposes.
 * Only runs if collections are empty.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final StudentRepository studentRepository;
    private final TrainingRepository trainingRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${astba.seed.admin-email:admin@astba.tn}")
    private String seedAdminEmail;

    @Value("${astba.seed.admin-password:Admin123!}")
    private String seedAdminPassword;

    @Override
    public void run(String... args) {
        seedAdminUser();

        if (studentRepository.count() > 0 || trainingRepository.count() > 0) {
            log.info("Base de données non vide, seed ignoré.");
            return;
        }

        log.info("=== Initialisation des données de démonstration ===");

        // ====== TRAININGS ======
        Training robotique = Training.builder()
                .title("Robotique Débutant")
                .description("Formation d'initiation à la robotique pour débutants. " +
                             "Couvre les bases de l'électronique, la programmation Arduino et la construction de robots simples.")
                .levels(TrainingService.generateDefaultLevels())
                .build();

        Training webDev = Training.builder()
                .title("Web Dev Junior")
                .description("Formation au développement web : HTML, CSS, JavaScript et introduction à React. " +
                             "Projet final : création d'un site web interactif.")
                .levels(TrainingService.generateDefaultLevels())
                .build();

        robotique = trainingRepository.save(robotique);
        webDev = trainingRepository.save(webDev);
        log.info("2 formations créées: '{}', '{}'", robotique.getTitle(), webDev.getTitle());

        // ====== STUDENTS ======
        List<Student> students = new ArrayList<>();
        students.add(createStudent("Ahmed", "Ben Ali", LocalDate.of(2010, 3, 15), "ahmed.benali@email.com", "55 123 456"));
        students.add(createStudent("Fatma", "Trabelsi", LocalDate.of(2009, 7, 22), "fatma.trabelsi@email.com", "55 234 567"));
        students.add(createStudent("Mohamed", "Hammami", LocalDate.of(2011, 1, 8), "mohamed.hammami@email.com", "55 345 678"));
        students.add(createStudent("Amira", "Bouazizi", LocalDate.of(2010, 11, 30), "amira.bouazizi@email.com", "55 456 789"));
        students.add(createStudent("Youssef", "Chahed", LocalDate.of(2009, 5, 12), "youssef.chahed@email.com", "55 567 890"));
        students.add(createStudent("Nour", "Jebali", LocalDate.of(2011, 9, 3), "nour.jebali@email.com", "55 678 901"));
        students.add(createStudent("Sami", "Gharbi", LocalDate.of(2010, 6, 18), null, "55 789 012"));
        students.add(createStudent("Ines", "Maaloul", LocalDate.of(2009, 12, 25), "ines.maaloul@email.com", null));

        students = studentRepository.saveAll(students);
        log.info("{} étudiants créés", students.size());

        // ====== ENROLLMENTS ======
        // Ahmed, Fatma, Mohamed enrolled in Robotique
        Enrollment enrollAhmed = createEnrollment(students.get(0).getId(), robotique.getId());
        Enrollment enrollFatma = createEnrollment(students.get(1).getId(), robotique.getId());
        Enrollment enrollMohamed = createEnrollment(students.get(2).getId(), robotique.getId());

        // Amira, Youssef enrolled in Web Dev
        Enrollment enrollAmira = createEnrollment(students.get(3).getId(), webDev.getId());
        Enrollment enrollYoussef = createEnrollment(students.get(4).getId(), webDev.getId());

        // ====== ATTENDANCE: Make Ahmed ALMOST complete (all 24 sessions PRESENT) for demo ======
        markAllPresent(enrollAhmed, robotique);
        enrollAhmed.setProgressSnapshot(ProgressCalculator.compute(enrollAhmed, robotique));
        enrollmentRepository.save(enrollAhmed);
        log.info("Ahmed: toutes les séances marquées PRESENT → certificat disponible !");

        // Fatma: 18/24 sessions present (levels 1-3 complete, level 4 partial)
        markLevelsPresent(enrollFatma, robotique, 3);
        enrollFatma.setProgressSnapshot(ProgressCalculator.compute(enrollFatma, robotique));
        enrollmentRepository.save(enrollFatma);
        log.info("Fatma: 18/24 séances marquées (niveaux 1-3 validés)");

        // Mohamed: 6/24 sessions present (level 1 only)
        markLevelsPresent(enrollMohamed, robotique, 1);
        enrollMohamed.setProgressSnapshot(ProgressCalculator.compute(enrollMohamed, robotique));
        enrollmentRepository.save(enrollMohamed);
        log.info("Mohamed: 6/24 séances marquées (niveau 1 validé)");

        // Amira: 12/24 present in Web Dev
        markLevelsPresent(enrollAmira, webDev, 2);
        enrollAmira.setProgressSnapshot(ProgressCalculator.compute(enrollAmira, webDev));
        enrollmentRepository.save(enrollAmira);
        log.info("Amira: 12/24 séances marquées en Web Dev (niveaux 1-2 validés)");

        log.info("=== Données de démonstration chargées avec succès ===");
        log.info("  → Ahmed Ben Ali est éligible pour un certificat (Robotique)");
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

    private Student createStudent(String firstName, String lastName, LocalDate birthDate, String email, String phone) {
        return Student.builder()
                .firstName(firstName)
                .lastName(lastName)
                .birthDate(birthDate)
                .email(email)
                .phone(phone)
                .build();
    }

    private Enrollment createEnrollment(String studentId, String trainingId) {
        Enrollment enrollment = Enrollment.builder()
                .studentId(studentId)
                .trainingId(trainingId)
                .enrolledAt(Instant.now())
                .attendance(new HashMap<>())
                .build();
        return enrollmentRepository.save(enrollment);
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
