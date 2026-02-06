package tn.astba.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.astba.domain.Level;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingCreateRequest {

    @NotBlank(message = "Le titre de la formation est obligatoire")
    @Size(min = 2, max = 200, message = "Le titre doit contenir entre 2 et 200 caractères")
    private String title;

    @Size(max = 1000, message = "La description ne doit pas dépasser 1000 caractères")
    private String description;

    /**
     * Optional: if not provided, 4 levels x 6 sessions are auto-generated.
     */
    private List<Level> levels;
}
