package tn.astba.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'adresse email n'est pas valide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, max = 128, message = "Le mot de passe doit contenir entre 8 et 128 caractères")
    private String password;

    @Size(min = 2, max = 100, message = "Le prénom doit contenir entre 2 et 100 caractères")
    private String firstName;

    @Size(min = 2, max = 100, message = "Le nom doit contenir entre 2 et 100 caractères")
    private String lastName;

    /**
     * Optional requested role: TRAINER (default) or MANAGER (requires ADMIN approval).
     */
    private String requestedRole;

    /** Technical speciality (e.g. "Informatique", "Robotique") – required for TRAINER */
    private String speciality;

    /** Years of experience – required for TRAINER */
    private Integer yearsExperience;

    /** Phone number (8 digits, Tunisia) */
    @Size(min = 8, max = 8, message = "Le numéro de téléphone doit contenir 8 chiffres")
    private String phone;
}
