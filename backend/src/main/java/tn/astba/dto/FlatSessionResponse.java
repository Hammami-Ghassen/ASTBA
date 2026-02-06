package tn.astba.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlatSessionResponse {
    private String sessionId;
    private int levelNumber;
    private String levelTitle;
    private int sessionNumber;
    private String sessionTitle;
    private LocalDateTime plannedAt;
}
