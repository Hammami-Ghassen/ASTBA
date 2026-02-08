package tn.astba.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.astba.domain.SeanceStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeanceResponse {
    private String id;
    private String trainingId;
    private String sessionId;
    private String groupId;
    private String trainerId;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private SeanceStatus status;
    private int levelNumber;
    private int sessionNumber;
    private String title;

    // Enriched
    private String trainingTitle;
    private String trainingDocumentUrl;
    private String groupName;
    private String trainerName;

    private Instant createdAt;
    private Instant updatedAt;
}
