package tn.astba.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceMarkRequest {

    @NotBlank(message = "L'identifiant de la formation est obligatoire")
    private String trainingId;

    @NotBlank(message = "L'identifiant de la séance est obligatoire")
    private String sessionId;

    private LocalDate date;

    @NotEmpty(message = "La liste des enregistrements de présence ne peut pas être vide")
    @Valid
    private List<AttendanceRecord> records;
}
