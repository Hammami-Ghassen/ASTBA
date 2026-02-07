package tn.astba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.astba.domain.*;
import tn.astba.dto.*;
import tn.astba.exception.BadRequestException;
import tn.astba.exception.ResourceNotFoundException;
import tn.astba.repository.SeanceRepository;
import tn.astba.repository.SessionReportRepository;
import tn.astba.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeanceService {

    private final SeanceRepository seanceRepository;
    private final SessionReportRepository sessionReportRepository;
    private final TrainingService trainingService;
    private final GroupService groupService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AttendanceService attendanceService;

    // ─── CRUD ─────────────────────────────────────────

    public SeanceResponse create(SeanceCreateRequest request) {
        // Validate trainer exists
        User trainer = userRepository.findById(request.getTrainerId())
                .orElseThrow(() -> new ResourceNotFoundException("Formateur", "id", request.getTrainerId()));
        if (!trainer.getRoles().contains(Role.TRAINER)) {
            throw new BadRequestException("L'utilisateur n'est pas un formateur");
        }

        // Validate training & group exist
        trainingService.getTrainingOrThrow(request.getTrainingId());
        groupService.getGroupOrThrow(request.getGroupId());

        // Check trainer availability
        checkTrainerAvailability(request.getTrainerId(), request.getDate(),
                request.getStartTime(), request.getEndTime(), null);

        Seance seance = Seance.builder()
                .trainingId(request.getTrainingId())
                .sessionId(request.getSessionId())
                .groupId(request.getGroupId())
                .trainerId(request.getTrainerId())
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .levelNumber(request.getLevelNumber())
                .sessionNumber(request.getSessionNumber())
                .title(request.getTitle())
                .build();

        Seance saved = seanceRepository.save(seance);
        log.debug("Séance créée: id={}", saved.getId());

        // Notify trainer
        notificationService.notifyUser(
                request.getTrainerId(),
                "Nouvelle séance assignée",
                String.format("Vous avez été assigné à la séance \"%s\" le %s",
                        request.getTitle(), request.getDate()),
                "/dashboard",
                NotificationType.SEANCE_ASSIGNED
        );

        return toResponse(saved);
    }

    public SeanceResponse update(String id, SeanceCreateRequest request) {
        Seance seance = getSeanceOrThrow(id);

        // Check availability if date/time/trainer changed
        if (!seance.getTrainerId().equals(request.getTrainerId())
                || !seance.getDate().equals(request.getDate())
                || !seance.getStartTime().equals(request.getStartTime())
                || !seance.getEndTime().equals(request.getEndTime())) {
            checkTrainerAvailability(request.getTrainerId(), request.getDate(),
                    request.getStartTime(), request.getEndTime(), id);
        }

        seance.setTrainingId(request.getTrainingId());
        seance.setSessionId(request.getSessionId());
        seance.setGroupId(request.getGroupId());
        seance.setTrainerId(request.getTrainerId());
        seance.setDate(request.getDate());
        seance.setStartTime(request.getStartTime());
        seance.setEndTime(request.getEndTime());
        seance.setLevelNumber(request.getLevelNumber());
        seance.setSessionNumber(request.getSessionNumber());
        seance.setTitle(request.getTitle());

        Seance saved = seanceRepository.save(seance);

        // Notify trainer of change
        notificationService.notifyUser(
                request.getTrainerId(),
                "Séance modifiée",
                String.format("La séance \"%s\" a été modifiée – %s", request.getTitle(), request.getDate()),
                "/dashboard",
                NotificationType.SEANCE_ASSIGNED
        );

        return toResponse(saved);
    }

    public void delete(String id) {
        if (!seanceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Séance", "id", id);
        }
        seanceRepository.deleteById(id);
    }

    public SeanceResponse findById(String id) {
        return toResponse(getSeanceOrThrow(id));
    }

    public List<SeanceResponse> findAll() {
        return seanceRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<SeanceResponse> findByTrainer(String trainerId) {
        return seanceRepository.findByTrainerId(trainerId).stream().map(this::toResponse).toList();
    }

    public List<SeanceResponse> findByTrainerAndDate(String trainerId, LocalDate date) {
        return seanceRepository.findByTrainerIdAndDate(trainerId, date).stream().map(this::toResponse).toList();
    }

    public List<SeanceResponse> findByTrainerBetweenDates(String trainerId, LocalDate from, LocalDate to) {
        return seanceRepository.findByTrainerIdAndDateBetween(trainerId, from, to).stream().map(this::toResponse).toList();
    }

    public List<SeanceResponse> findByDateRange(LocalDate from, LocalDate to) {
        return seanceRepository.findByDateBetween(from, to).stream().map(this::toResponse).toList();
    }

    public List<SeanceResponse> findByDate(LocalDate date) {
        return seanceRepository.findByDate(date).stream().map(this::toResponse).toList();
    }

    // ─── Trainer availability check ───────────────────

    public void checkTrainerAvailability(String trainerId, LocalDate date,
                                         LocalTime startTime, LocalTime endTime,
                                         String excludeSeanceId) {
        List<Seance> existing = seanceRepository.findByTrainerIdAndDate(trainerId, date);
        for (Seance s : existing) {
            if (excludeSeanceId != null && s.getId().equals(excludeSeanceId)) continue;
            // Check time overlap: s.start < endTime AND s.end > startTime
            if (s.getStartTime().isBefore(endTime) && s.getEndTime().isAfter(startTime)) {
                throw new BadRequestException(
                        String.format("Le formateur est déjà occupé le %s de %s à %s (séance: %s)",
                                date, s.getStartTime(), s.getEndTime(), s.getTitle()));
            }
        }
    }

    public boolean isTrainerAvailable(String trainerId, LocalDate date,
                                       LocalTime startTime, LocalTime endTime) {
        try {
            checkTrainerAvailability(trainerId, date, startTime, endTime, null);
            return true;
        } catch (BadRequestException e) {
            return false;
        }
    }

    // ─── Status transitions ───────────────────────────

    public SeanceResponse updateStatus(String id, SeanceStatus status) {
        Seance seance = getSeanceOrThrow(id);

        // ── Cannot start before scheduled date/time ──
        if (status == SeanceStatus.IN_PROGRESS) {
            LocalDateTime scheduledStart = LocalDateTime.of(seance.getDate(), seance.getStartTime());
            if (LocalDateTime.now().isBefore(scheduledStart)) {
                throw new BadRequestException(
                        String.format("Impossible de démarrer avant l'heure prévue (%s à %s)",
                                seance.getDate(), seance.getStartTime()));
            }
        }

        seance.setStatus(status);
        Seance saved = seanceRepository.save(seance);

        // ── Auto-mark all group students as ABSENT when starting ──
        if (status == SeanceStatus.IN_PROGRESS) {
            autoMarkAbsent(seance);
        }

        return toResponse(saved);
    }

    /**
     * When a seance is started, mark all students of the group as ABSENT.
     * The trainer can then update individual attendance to PRESENT/EXCUSED.
     */
    private void autoMarkAbsent(Seance seance) {
        try {
            Group group = groupService.getGroupOrThrow(seance.getGroupId());
            if (group.getStudentIds() == null || group.getStudentIds().isEmpty()) return;

            List<AttendanceRecord> records = group.getStudentIds().stream()
                    .map(sid -> AttendanceRecord.builder()
                            .studentId(sid)
                            .status(AttendanceStatus.ABSENT)
                            .build())
                    .toList();

            AttendanceMarkRequest markRequest = AttendanceMarkRequest.builder()
                    .trainingId(seance.getTrainingId())
                    .sessionId(seance.getSessionId())
                    .date(seance.getDate())
                    .records(records)
                    .build();

            attendanceService.markAttendance(markRequest);
            log.info("Auto-marked {} students as ABSENT for seance {}", records.size(), seance.getId());
        } catch (Exception e) {
            log.warn("Failed to auto-mark absent for seance {}: {}", seance.getId(), e.getMessage());
        }
    }

    // ─── Report / Postpone ────────────────────────────

    public SessionReportResponse reportSeance(String seanceId, String trainerId, SessionReportRequest request) {
        Seance seance = getSeanceOrThrow(seanceId);
        if (!seance.getTrainerId().equals(trainerId)) {
            throw new BadRequestException("Vous n'êtes pas assigné à cette séance");
        }

        seance.setStatus(SeanceStatus.REPORTED);
        seanceRepository.save(seance);

        SessionReport report = SessionReport.builder()
                .seanceId(seanceId)
                .trainerId(trainerId)
                .reason(request.getReason())
                .suggestedDate(request.getSuggestedDate())
                .build();

        SessionReport saved = sessionReportRepository.save(report);

        // Notify admins & managers
        String trainerName = userRepository.findById(trainerId)
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Formateur");

        notificationService.notifyByRole(Role.ADMIN, "Séance reportée",
                String.format("%s a reporté la séance \"%s\" : %s", trainerName, seance.getTitle(), request.getReason()),
                "/dashboard", NotificationType.SEANCE_REPORTED);
        notificationService.notifyByRole(Role.MANAGER, "Séance reportée",
                String.format("%s a reporté la séance \"%s\" : %s", trainerName, seance.getTitle(), request.getReason()),
                "/dashboard", NotificationType.SEANCE_REPORTED);

        return toReportResponse(saved);
    }

    public List<SessionReportResponse> getReports(String seanceId) {
        return sessionReportRepository.findBySeanceId(seanceId).stream()
                .map(this::toReportResponse)
                .toList();
    }

    // ─── Helpers ──────────────────────────────────────

    public Seance getSeanceOrThrow(String id) {
        return seanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Séance", "id", id));
    }

    private SeanceResponse toResponse(Seance s) {
        SeanceResponse.SeanceResponseBuilder builder = SeanceResponse.builder()
                .id(s.getId())
                .trainingId(s.getTrainingId())
                .sessionId(s.getSessionId())
                .groupId(s.getGroupId())
                .trainerId(s.getTrainerId())
                .date(s.getDate())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .status(s.getStatus())
                .levelNumber(s.getLevelNumber())
                .sessionNumber(s.getSessionNumber())
                .title(s.getTitle())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt());

        // Enrich with names
        try {
            builder.trainingTitle(trainingService.getTrainingOrThrow(s.getTrainingId()).getTitle());
        } catch (Exception ignored) {}
        try {
            builder.groupName(groupService.getGroupOrThrow(s.getGroupId()).getName());
        } catch (Exception ignored) {}
        try {
            userRepository.findById(s.getTrainerId()).ifPresent(u ->
                    builder.trainerName(u.getFirstName() + " " + u.getLastName()));
        } catch (Exception ignored) {}

        return builder.build();
    }

    private SessionReportResponse toReportResponse(SessionReport r) {
        SessionReportResponse.SessionReportResponseBuilder builder = SessionReportResponse.builder()
                .id(r.getId())
                .seanceId(r.getSeanceId())
                .trainerId(r.getTrainerId())
                .reason(r.getReason())
                .suggestedDate(r.getSuggestedDate())
                .reportStatus(r.getReportStatus())
                .createdAt(r.getCreatedAt());

        try {
            userRepository.findById(r.getTrainerId()).ifPresent(u ->
                    builder.trainerName(u.getFirstName() + " " + u.getLastName()));
        } catch (Exception ignored) {}

        return builder.build();
    }
}
