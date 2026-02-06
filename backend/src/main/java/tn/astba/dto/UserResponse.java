package tn.astba.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.astba.domain.Role;
import tn.astba.domain.UserStatus;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private Set<Role> roles;
    private UserStatus status;
    private String provider;
    private Instant lastLoginAt;
    private Instant createdAt;
}
