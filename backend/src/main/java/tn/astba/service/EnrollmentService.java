package tn.astba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.astba.domain.*;
import tn.astba.dto.*;
import tn.astba.exception.ConflictException;
import tn.astba.exception.ResourceNotFoundException;
import tn.astba.repository.EnrollmentRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentService studentService;
    private final TrainingService trainingService;

    public EnrollmentResponse create(EnrollmentCreateRequest request) {
        // Verify student and training exist
        studentService.getStudentOrThrow(request.getStudentId());
        trainingService.getTrainingOrThrow(request.getTrainingId());

        // Check for duplicate enrollment
        if (enrollmentRepository.existsByStudentIdAndTrainingId(request.getStudentId(), request.getTrainingId())) {
            throw new ConflictException("L'élève est déjà inscrit à cette formation");
        }

        Training training = trainingService.getTrainingOrThrow(request.getTrainingId());

        Enrollment enrollment = Enrollment.builder()
                .studentId(request.getStudentId())
                .trainingId(request.getTrainingId())
                .enrolledAt(Instant.now())
                .attendance(new HashMap<>())
                .build();

        // Initialize progress snapshot
        enrollment.setProgressSnapshot(ProgressCalculator.compute(enrollment, training));

        Enrollment saved = enrollmentRepository.save(enrollment);
        log.debug("Inscription créée: student={}, training={}", request.getStudentId(), request.getTrainingId());
        return toResponse(saved, true);
    }

    public EnrollmentResponse findById(String id) {
        Enrollment enrollment = getEnrollmentOrThrow(id);
        return toResponse(enrollment, true);
    }

    public List<EnrollmentResponse> findByStudentId(String studentId) {
        studentService.getStudentOrThrow(studentId);
        return enrollmentRepository.findByStudentId(studentId).stream()
                .map(e -> toResponse(e, true))
                .toList();
    }

    public List<EnrollmentResponse> findByTrainingId(String trainingId) {
        trainingService.getTrainingOrThrow(trainingId);
        return enrollmentRepository.findByTrainingId(trainingId).stream()
                .map(e -> toResponse(e, true))
                .toList();
    }

    public Enrollment getEnrollmentOrThrow(String id) {
        return enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inscription", "id", id));
    }

    public EnrollmentResponse toResponse(Enrollment e, boolean enriched) {
        EnrollmentResponse.EnrollmentResponseBuilder builder = EnrollmentResponse.builder()
                .id(e.getId())
                .studentId(e.getStudentId())
                .trainingId(e.getTrainingId())
                .enrolledAt(e.getEnrolledAt())
                .attendance(e.getAttendance())
                .progressSnapshot(e.getProgressSnapshot())
                .createdAt(e.getCreatedAt());

        if (enriched) {
            try {
                builder.student(studentService.toResponse(studentService.getStudentOrThrow(e.getStudentId())));
            } catch (ResourceNotFoundException ignored) {}
            try {
                builder.training(trainingService.toResponse(trainingService.getTrainingOrThrow(e.getTrainingId())));
            } catch (ResourceNotFoundException ignored) {}
        }

        return builder.build();
    }
}
