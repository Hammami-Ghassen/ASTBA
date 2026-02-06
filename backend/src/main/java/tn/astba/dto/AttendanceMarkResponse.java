package tn.astba.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceMarkResponse {
    private int updatedCount;
    private int missingEnrollmentsCount;
    private List<String> missingStudentIds;
    private boolean progressUpdated;
    private String message;
}
