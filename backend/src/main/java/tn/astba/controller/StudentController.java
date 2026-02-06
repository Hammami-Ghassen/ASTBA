package tn.astba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.astba.dto.StudentCreateRequest;
import tn.astba.dto.StudentResponse;
import tn.astba.dto.StudentUpdateRequest;
import tn.astba.service.StudentService;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@Tag(name = "Étudiants", description = "Gestion des étudiants")
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    @Operation(summary = "Lister les étudiants", description = "Liste paginée avec recherche optionnelle (nom, prénom, email)")
    public ResponseEntity<Page<StudentResponse>> findAll(
            @Parameter(description = "Recherche par nom, prénom ou email") @RequestParam(required = false) String query,
            @Parameter(description = "Numéro de page (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Taille de la page") @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(studentService.findAll(query, page, size));
    }

    @GetMapping("/{studentId}")
    @Operation(summary = "Détails d'un étudiant")
    public ResponseEntity<StudentResponse> findById(@PathVariable String studentId) {
        return ResponseEntity.ok(studentService.findById(studentId));
    }

    @PostMapping
    @Operation(summary = "Créer un étudiant")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<StudentResponse> create(@Valid @RequestBody StudentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.create(request));
    }

    @PutMapping("/{studentId}")
    @Operation(summary = "Mettre à jour un étudiant")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<StudentResponse> update(@PathVariable String studentId,
                                                   @Valid @RequestBody StudentUpdateRequest request) {
        return ResponseEntity.ok(studentService.update(studentId, request));
    }

    @DeleteMapping("/{studentId}")
    @Operation(summary = "Supprimer un étudiant")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String studentId) {
        studentService.delete(studentId);
        return ResponseEntity.noContent().build();
    }
}
