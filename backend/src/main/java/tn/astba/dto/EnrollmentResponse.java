package tn.astba.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.astba.domain.AttendanceEntry;
import tn.astba.domain.ProgressSnapshot;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentResponse {
    private String id;
    private String studentId;
    private String trainingId;
    private Instant enrolledAt;
    private Map<String, AttendanceEntry> attendance;
    private ProgressSnapshot progressSnapshot;
    private Instant createdAt;

    // Enriched fields (populated when needed)
    private StudentResponse student;
    private TrainingResponse training;
}
