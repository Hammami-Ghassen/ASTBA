package tn.astba.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CertificateMetaResponse {
    private boolean eligible;
    private Instant completedAt;
    private Instant issuedAt;
    private String studentName;
    private String trainingTitle;
}
