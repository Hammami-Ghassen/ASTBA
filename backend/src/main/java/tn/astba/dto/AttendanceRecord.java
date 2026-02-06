package tn.astba.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.astba.domain.AttendanceStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecord {

    @NotBlank(message = "L'identifiant de l'élève est obligatoire")
    private String studentId;

    @NotNull(message = "Le statut de présence est obligatoire (PRESENT, ABSENT, EXCUSED)")
    private AttendanceStatus status;
}
