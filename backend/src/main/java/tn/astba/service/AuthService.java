package tn.astba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tn.astba.domain.*;
import tn.astba.dto.*;
import tn.astba.exception.BadRequestException;
import tn.astba.exception.ConflictException;
import tn.astba.exception.ResourceNotFoundException;
import tn.astba.repository.UserRepository;
import tn.astba.security.JwtService;

import java.time.Instant;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Value("${astba.public-register:true}")
    private boolean publicRegisterEnabled;

    /**
     * Register a new local user.
     */
    public AuthResponse register(RegisterRequest request) {
        if (!publicRegisterEnabled) {
            throw new BadRequestException("L'inscription publique est désactivée. Contactez un administrateur.");
        }

        String email = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Un compte existe déjà avec cet email");
        }

        Role role = Role.TRAINER; // default
        UserStatus status = UserStatus.ACTIVE;

        if (request.getRequestedRole() != null) {
            try {
                Role requested = Role.valueOf(request.getRequestedRole().toUpperCase());
                if (requested == Role.MANAGER) {
                    role = Role.MANAGER;
                    status = UserStatus.PENDING; // needs admin approval
                } else if (requested == Role.ADMIN) {
                    throw new BadRequestException("Le rôle ADMIN ne peut pas être demandé lors de l'inscription");
                } else {
                    role = requested;
                }
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Rôle invalide: " + request.getRequestedRole());
            }
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName() != null ? request.getFirstName().trim() : null)
                .lastName(request.getLastName() != null ? request.getLastName().trim() : null)
                .roles(Set.of(role))
                .status(status)
                .provider(AuthProvider.LOCAL)
                .build();

        user = userRepository.save(user);
        log.info("Nouvel utilisateur inscrit: email={}, role={}, status={}", email, role, status);

        return AuthResponse.builder()
                .user(toResponse(user))
                .message(status == UserStatus.PENDING
                        ? "Inscription réussie. Votre compte est en attente de validation par un administrateur."
                        : "Inscription réussie.")
                .build();
    }

    /**
     * Authenticate with email + password. Returns tokens.
     */
    public LoginResult login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Email ou mot de passe incorrect"));

        if (user.getPasswordHash() == null) {
            throw new BadRequestException("Ce compte utilise la connexion Google. Veuillez vous connecter via Google.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Email ou mot de passe incorrect");
        }

        if (user.getStatus() == UserStatus.DISABLED) {
            throw new BadRequestException("Votre compte a été désactivé. Contactez un administrateur.");
        }

        if (user.getStatus() == UserStatus.PENDING) {
            throw new BadRequestException("Votre compte est en attente de validation par un administrateur.");
        }

        // Update last login
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRoles());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        refreshTokenService.storeRefreshToken(user.getId(), refreshToken);

        log.debug("Connexion réussie: email={}", email);

        return LoginResult.builder()
                .user(user)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpiresAt(jwtService.getAccessExpiration())
                .build();
    }

    /**
     * Refresh access token using a valid refresh token.
     */
    public LoginResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new BadRequestException("Token de rafraîchissement manquant");
        }

        if (!jwtService.validateToken(rawRefreshToken)) {
            throw new BadRequestException("Token de rafraîchissement invalide ou expiré");
        }

        var storedToken = refreshTokenService.validateRefreshToken(rawRefreshToken)
                .orElseThrow(() -> new BadRequestException("Token de rafraîchissement révoqué ou introuvable"));

        String userId = storedToken.getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("Utilisateur introuvable"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Compte inactif");
        }

        // Token rotation
        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRoles());
        String newRefreshToken = jwtService.generateRefreshToken(user.getId());
        refreshTokenService.rotateRefreshToken(userId, rawRefreshToken, newRefreshToken);

        return LoginResult.builder()
                .user(user)
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .accessTokenExpiresAt(jwtService.getAccessExpiration())
                .build();
    }

    /**
     * Logout: revoke current refresh token.
     */
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            refreshTokenService.revokeRefreshToken(rawRefreshToken);
        }
    }

    /**
     * Get current user by ID.
     */
    public UserResponse getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
        return toResponse(user);
    }

    /**
     * Find or create user from Google OAuth2 login.
     */
    public User findOrCreateGoogleUser(String googleId, String email, String firstName, String lastName, boolean emailVerified) {
        if (!emailVerified) {
            throw new BadRequestException("L'email Google n'est pas vérifié");
        }

        String normalizedEmail = email.toLowerCase().trim();
        var existing = userRepository.findByEmail(normalizedEmail);

        if (existing.isPresent()) {
            User user = existing.get();
            // Link Google provider if not already
            if (user.getProviderId() == null) {
                user.setProviderId(googleId);
                if (user.getProvider() == AuthProvider.LOCAL) {
                    user.setProvider(AuthProvider.GOOGLE); // upgrade
                }
            }
            if (user.getFirstName() == null && firstName != null) user.setFirstName(firstName);
            if (user.getLastName() == null && lastName != null) user.setLastName(lastName);
            user.setLastLoginAt(Instant.now());
            return userRepository.save(user);
        }

        // New Google user
        User user = User.builder()
                .email(normalizedEmail)
                .firstName(firstName)
                .lastName(lastName)
                .roles(Set.of(Role.TRAINER))
                .status(UserStatus.ACTIVE)
                .provider(AuthProvider.GOOGLE)
                .providerId(googleId)
                .lastLoginAt(Instant.now())
                .build();

        user = userRepository.save(user);
        log.info("Nouvel utilisateur Google créé: email={}", normalizedEmail);
        return user;
    }

    // === Admin operations ===

    public Page<UserResponse> listUsers(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> users;
        if (query != null && !query.isBlank()) {
            users = userRepository.searchByQuery(query.trim(), pageable);
        } else {
            users = userRepository.findAll(pageable);
        }
        return users.map(this::toResponse);
    }

    public UserResponse updateRoles(String userId, Set<Role> roles) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
        user.setRoles(roles);
        user = userRepository.save(user);
        log.info("Rôles mis à jour: userId={}, roles={}", userId, roles);
        return toResponse(user);
    }

    public UserResponse updateStatus(String userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
        user.setStatus(status);
        user = userRepository.save(user);
        log.info("Statut mis à jour: userId={}, status={}", userId, status);
        return toResponse(user);
    }

    public UserResponse adminCreateUser(AdminCreateUserRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Un compte existe déjà avec cet email");
        }

        User user = User.builder()
                .email(email)
                .firstName(request.getFirstName() != null ? request.getFirstName().trim() : null)
                .lastName(request.getLastName() != null ? request.getLastName().trim() : null)
                .roles(Set.of(request.getRole()))
                .status(UserStatus.ACTIVE)
                .provider(AuthProvider.LOCAL)
                .build();

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        user = userRepository.save(user);
        log.info("Utilisateur créé par admin: email={}, role={}", email, request.getRole());
        return toResponse(user);
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(user.getRoles())
                .status(user.getStatus())
                .provider(user.getProvider() != null ? user.getProvider().name() : null)
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Internal result object for login/refresh that includes raw tokens.
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class LoginResult {
        private User user;
        private String accessToken;
        private String refreshToken;
        private Instant accessTokenExpiresAt;
    }
}
