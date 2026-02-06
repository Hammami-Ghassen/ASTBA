package tn.astba.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissedSessionInfo {
    private String sessionId;
    private int levelNumber;
    private int sessionNumber;
    private String sessionTitle;
    private String status; // ABSENT, null (not marked), EXCUSED
}
