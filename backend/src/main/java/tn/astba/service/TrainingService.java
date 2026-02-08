package tn.astba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.astba.domain.Level;
import tn.astba.domain.Session;
import tn.astba.domain.Training;
import tn.astba.dto.*;
import tn.astba.exception.ResourceNotFoundException;
import tn.astba.repository.TrainingRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrainingService {

    private final TrainingRepository trainingRepository;

    public List<TrainingResponse> findAll() {
        return trainingRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public TrainingResponse findById(String id) {
        return toResponse(getTrainingOrThrow(id));
    }

    public TrainingResponse create(TrainingCreateRequest request) {
        List<Level> levels = request.getLevels();
        if (levels == null || levels.isEmpty()) {
            levels = generateDefaultLevels();
        } else {
            // Ensure session IDs are set
            for (Level level : levels) {
                if (level.getSessions() != null) {
                    for (Session session : level.getSessions()) {
                        if (session.getSessionId() == null || session.getSessionId().isBlank()) {
                            session.setSessionId(UUID.randomUUID().toString());
                        }
                    }
                }
            }
        }

        Training training = Training.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .documentUrl(request.getDocumentUrl())
                .levels(levels)
                .build();

        Training saved = trainingRepository.save(training);
        log.debug("Formation créée: id={}, title={}", saved.getId(), saved.getTitle());
        return toResponse(saved);
    }

    public TrainingResponse update(String id, TrainingUpdateRequest request) {
        Training training = getTrainingOrThrow(id);

        if (request.getTitle() != null) training.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) training.setDescription(request.getDescription());
        // Allow empty string to clear the document URL
        if (request.getDocumentUrl() != null) {
            training.setDocumentUrl(request.getDocumentUrl().isBlank() ? null : request.getDocumentUrl());
        }
        if (request.getLevels() != null) training.setLevels(request.getLevels());

        Training saved = trainingRepository.save(training);
        log.debug("Formation mise à jour: id={}", saved.getId());
        return toResponse(saved);
    }

    public void delete(String id) {
        if (!trainingRepository.existsById(id)) {
            throw new ResourceNotFoundException("Formation", "id", id);
        }
        trainingRepository.deleteById(id);
        log.debug("Formation supprimée: id={}", id);
    }

    public List<FlatSessionResponse> getFlatSessions(String trainingId) {
        Training training = getTrainingOrThrow(trainingId);
        List<FlatSessionResponse> flat = new ArrayList<>();
        for (Level level : training.getLevels()) {
            for (Session session : level.getSessions()) {
                flat.add(FlatSessionResponse.builder()
                        .sessionId(session.getSessionId())
                        .levelNumber(level.getLevelNumber())
                        .levelTitle(level.getTitle())
                        .sessionNumber(session.getSessionNumber())
                        .sessionTitle(session.getTitle())
                        .plannedAt(session.getPlannedAt())
                        .build());
            }
        }
        return flat;
    }

    public Training getTrainingOrThrow(String id) {
        return trainingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Formation", "id", id));
    }

    public TrainingResponse toResponse(Training t) {
        return TrainingResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .documentUrl(t.getDocumentUrl())
                .levels(t.getLevels())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    /**
     * Generates default 4 levels x 6 sessions structure with stable UUIDs.
     */
    public static List<Level> generateDefaultLevels() {
        List<Level> levels = new ArrayList<>();
        for (int l = 1; l <= 4; l++) {
            List<Session> sessions = new ArrayList<>();
            for (int s = 1; s <= 6; s++) {
                sessions.add(Session.builder()
                        .sessionId(UUID.randomUUID().toString())
                        .sessionNumber(s)
                        .title("Séance " + s)
                        .build());
            }
            levels.add(Level.builder()
                    .levelNumber(l)
                    .title("Niveau " + l)
                    .sessions(sessions)
                    .build());
        }
        return levels;
    }
}
