package tn.astba.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "enrollments")
@CompoundIndex(name = "idx_enrollment_unique", def = "{'studentId': 1, 'trainingId': 1}", unique = true)
public class Enrollment {

    @Id
    private String id;

    @Indexed
    private String studentId;

    @Indexed
    private String trainingId;

    private Instant enrolledAt;

    @Builder.Default
    private Map<String, AttendanceEntry> attendance = new HashMap<>(); // sessionId -> AttendanceEntry

    private ProgressSnapshot progressSnapshot;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
