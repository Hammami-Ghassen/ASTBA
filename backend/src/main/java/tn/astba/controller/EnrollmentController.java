package tn.astba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.astba.dto.EnrollmentCreateRequest;
import tn.astba.dto.EnrollmentResponse;
import tn.astba.service.EnrollmentService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Inscriptions", description = "Gestion des inscriptions élève ↔ formation")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping("/enrollments")
    @Operation(summary = "Inscrire un élève à une formation")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<EnrollmentResponse> create(@Valid @RequestBody EnrollmentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(enrollmentService.create(request));
    }

    @GetMapping("/enrollments/{enrollmentId}")
    @Operation(summary = "Détails d'une inscription")
    public ResponseEntity<EnrollmentResponse> findById(@PathVariable String enrollmentId) {
        return ResponseEntity.ok(enrollmentService.findById(enrollmentId));
    }

    @GetMapping("/students/{studentId}/enrollments")
    @Operation(summary = "Inscriptions d'un élève")
    public ResponseEntity<List<EnrollmentResponse>> findByStudent(@PathVariable String studentId) {
        return ResponseEntity.ok(enrollmentService.findByStudentId(studentId));
    }

    @GetMapping("/trainings/{trainingId}/enrollments")
    @Operation(summary = "Inscriptions à une formation")
    public ResponseEntity<List<EnrollmentResponse>> findByTraining(@PathVariable String trainingId) {
        return ResponseEntity.ok(enrollmentService.findByTrainingId(trainingId));
    }
}
