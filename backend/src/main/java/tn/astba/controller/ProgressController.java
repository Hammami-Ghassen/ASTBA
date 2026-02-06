package tn.astba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.astba.dto.StudentProgressResponse;
import tn.astba.service.ProgressService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Progression", description = "Suivi de la progression des élèves")
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping("/students/{studentId}/progress")
    @Operation(summary = "Progression d'un élève", description = "Progression sur toutes les formations inscrites, avec séances manquées")
    public ResponseEntity<List<StudentProgressResponse>> getStudentProgress(@PathVariable String studentId) {
        return ResponseEntity.ok(progressService.getStudentProgress(studentId));
    }

    @GetMapping("/enrollments/{enrollmentId}/progress")
    @Operation(summary = "Progression d'une inscription")
    public ResponseEntity<StudentProgressResponse> getEnrollmentProgress(@PathVariable String enrollmentId) {
        return ResponseEntity.ok(progressService.getEnrollmentProgress(enrollmentId));
    }
}
