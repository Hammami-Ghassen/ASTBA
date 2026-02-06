package tn.astba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.astba.dto.*;
import tn.astba.service.TrainingService;

import java.util.List;

@RestController
@RequestMapping("/api/trainings")
@RequiredArgsConstructor
@Tag(name = "Formations", description = "Gestion des formations")
public class TrainingController {

    private final TrainingService trainingService;

    @GetMapping
    @Operation(summary = "Lister toutes les formations")
    public ResponseEntity<List<TrainingResponse>> findAll() {
        return ResponseEntity.ok(trainingService.findAll());
    }

    @GetMapping("/{trainingId}")
    @Operation(summary = "Détails d'une formation")
    public ResponseEntity<TrainingResponse> findById(@PathVariable String trainingId) {
        return ResponseEntity.ok(trainingService.findById(trainingId));
    }

    @PostMapping
    @Operation(summary = "Créer une formation", description = "Si levels non fournis, 4 niveaux x 6 séances sont auto-générés")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<TrainingResponse> create(@Valid @RequestBody TrainingCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(trainingService.create(request));
    }

    @PutMapping("/{trainingId}")
    @Operation(summary = "Mettre à jour une formation")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<TrainingResponse> update(@PathVariable String trainingId,
                                                    @Valid @RequestBody TrainingUpdateRequest request) {
        return ResponseEntity.ok(trainingService.update(trainingId, request));
    }

    @DeleteMapping("/{trainingId}")
    @Operation(summary = "Supprimer une formation")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String trainingId) {
        trainingService.delete(trainingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{trainingId}/sessions")
    @Operation(summary = "Liste aplatie des 24 séances", description = "Retourne toutes les séances (4 niveaux x 6) pour une UI simplifiée")
    public ResponseEntity<List<FlatSessionResponse>> getSessions(@PathVariable String trainingId) {
        return ResponseEntity.ok(trainingService.getFlatSessions(trainingId));
    }
}
