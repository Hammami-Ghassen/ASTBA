package tn.astba.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Session {

    private String sessionId; // UUID string, stable identifier for attendance

    private int sessionNumber; // 1..6

    private String title; // e.g. "Séance 1"

    private LocalDateTime plannedAt; // optional
}
