package tn.astba.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressSnapshot {

    private int totalSessions;       // 24

    private int attendedCount;       // count PRESENT or EXCUSED

    private int missedCount;         // count ABSENT

    private List<Integer> levelsValidated; // e.g. [1, 2, 3]

    private boolean completed;

    private Instant completedAt;     // nullable

    private boolean eligibleForCertificate;

    private Instant certificateIssuedAt; // nullable - set when PDF generated
}
