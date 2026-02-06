package tn.astba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.astba.domain.*;
import tn.astba.dto.*;
import tn.astba.exception.ResourceNotFoundException;
import tn.astba.repository.EnrollmentRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final EnrollmentRepository enrollmentRepository;
    private final TrainingService trainingService;
    private final StudentService studentService;

    /**
     * Mark attendance for multiple students in a single session.
     */
    public AttendanceMarkResponse markAttendance(AttendanceMarkRequest request) {
        Training training = trainingService.getTrainingOrThrow(request.getTrainingId());

        // Validate sessionId exists in training
        boolean sessionExists = training.getLevels().stream()
                .flatMap(l -> l.getSessions().stream())
                .anyMatch(s -> s.getSessionId().equals(request.getSessionId()));

        if (!sessionExists) {
            throw new ResourceNotFoundException("Séance", "sessionId", request.getSessionId());
        }

        int updatedCount = 0;
        List<String> missingStudentIds = new ArrayList<>();

        for (AttendanceRecord record : request.getRecords()) {
            var enrollmentOpt = enrollmentRepository.findByStudentIdAndTrainingId(
                    record.getStudentId(), request.getTrainingId());

            if (enrollmentOpt.isEmpty()) {
                missingStudentIds.add(record.getStudentId());
                continue;
            }

            Enrollment enrollment = enrollmentOpt.get();
            enrollment.getAttendance().put(request.getSessionId(), AttendanceEntry.builder()
                    .status(record.getStatus())
                    .markedAt(Instant.now())
                    .build());

            // Recompute progress
            enrollment.setProgressSnapshot(ProgressCalculator.compute(enrollment, training));
            enrollmentRepository.save(enrollment);
            updatedCount++;
        }

        String message = String.format("%d présence(s) marquée(s)", updatedCount);
        if (!missingStudentIds.isEmpty()) {
            message += String.format(", %d élève(s) sans inscription", missingStudentIds.size());
        }

        log.debug("Attendance marked: session={}, updated={}, missing={}", request.getSessionId(), updatedCount, missingStudentIds.size());

        return AttendanceMarkResponse.builder()
                .updatedCount(updatedCount)
                .missingEnrollmentsCount(missingStudentIds.size())
                .missingStudentIds(missingStudentIds)
                .progressUpdated(true)
                .message(message)
                .build();
    }

    /**
     * Get attendance statuses for a specific session.
     */
    public List<SessionAttendanceInfo> getSessionAttendance(String trainingId, String sessionId) {
        Training training = trainingService.getTrainingOrThrow(trainingId);

        List<Enrollment> enrollments = enrollmentRepository.findByTrainingId(trainingId);
        List<SessionAttendanceInfo> result = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            AttendanceEntry entry = enrollment.getAttendance().get(sessionId);
            Student student = studentService.getStudentOrThrow(enrollment.getStudentId());

            result.add(SessionAttendanceInfo.builder()
                    .studentId(enrollment.getStudentId())
                    .studentFirstName(student.getFirstName())
                    .studentLastName(student.getLastName())
                    .status(entry != null ? entry.getStatus() : null)
                    .build());
        }
        return result;
    }
}
