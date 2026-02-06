package tn.astba.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.astba.domain.ProgressSnapshot;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProgressResponse {
    private String enrollmentId;
    private String trainingId;
    private String trainingTitle;
    private ProgressSnapshot progressSnapshot;
    private List<MissedSessionInfo> missedSessions;
}
