package tn.astba.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentCreateRequest {

    @NotBlank(message = "L'identifiant de l'élève est obligatoire")
    private String studentId;

    @NotBlank(message = "L'identifiant de la formation est obligatoire")
    private String trainingId;
}
