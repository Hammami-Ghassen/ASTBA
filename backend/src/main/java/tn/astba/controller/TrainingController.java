package tn.astba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.astba.domain.Training;
import tn.astba.dto.*;
import tn.astba.repository.TrainingRepository;
import tn.astba.service.TrainingService;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/trainings")
@RequiredArgsConstructor
@Tag(name = "Formations", description = "Gestion des formations")
public class TrainingController {

    private final TrainingService trainingService;
    private final TrainingRepository trainingRepository;

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

    /* ══════════════ Document (Base64 in Training) ══════════════ */

    @PostMapping("/{trainingId}/document")
    @Operation(summary = "Upload un document PDF pour une formation", description = "Stocke le PDF en Base64 directement dans le document Training")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> uploadDocument(
            @PathVariable String trainingId,
            @RequestParam("file") MultipartFile file) {
        Training training = trainingService.getTrainingOrThrow(trainingId);
        try {
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            training.setDocumentBase64(base64);
            training.setDocumentFilename(file.getOriginalFilename());
            trainingRepository.save(training);
            String documentUrl = "/trainings/" + trainingId + "/document";
            return ResponseEntity.ok(Map.of(
                    "documentUrl", documentUrl,
                    "filename", file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf"
            ));
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'upload du document", e);
        }
    }

    @GetMapping("/{trainingId}/document")
    @Operation(summary = "Télécharger le document PDF d'une formation")
    public ResponseEntity<byte[]> getDocument(@PathVariable String trainingId) {
        Training training = trainingService.getTrainingOrThrow(trainingId);
        if (training.getDocumentBase64() == null || training.getDocumentBase64().isBlank()) {
            return ResponseEntity.notFound().build();
        }
        byte[] data = Base64.getDecoder().decode(training.getDocumentBase64());
        String filename = training.getDocumentFilename() != null ? training.getDocumentFilename() : "document.pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=" + TimeUnit.DAYS.toSeconds(30))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(data.length)
                .body(data);
    }

    @DeleteMapping("/{trainingId}/document")
    @Operation(summary = "Supprimer le document PDF d'une formation")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Void> deleteDocument(@PathVariable String trainingId) {
        Training training = trainingService.getTrainingOrThrow(trainingId);
        training.setDocumentBase64(null);
        training.setDocumentFilename(null);
        trainingRepository.save(training);
        return ResponseEntity.noContent().build();
    }
}
