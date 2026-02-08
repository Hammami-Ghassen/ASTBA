package tn.astba.dto;

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
public class TrainingUpdateRequest {

    @Size(min = 2, max = 200, message = "Le titre doit contenir entre 2 et 200 caractères")
    private String title;

    @Size(max = 1000, message = "La description ne doit pas dépasser 1000 caractères")
    private String description;

    private List<Level> levels;
}
