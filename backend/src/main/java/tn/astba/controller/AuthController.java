package tn.astba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tn.astba.dto.AuthResponse;
import tn.astba.dto.LoginRequest;
import tn.astba.dto.RegisterRequest;
import tn.astba.dto.UserResponse;
import tn.astba.security.CookieHelper;
import tn.astba.service.AuthService;
import tn.astba.service.AuthService.LoginResult;

@Tag(name = "Auth", description = "Authentification et gestion de session")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieHelper cookieHelper;

    @Operation(summary = "Inscription d'un nouvel utilisateur")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Connexion par email/mot de passe")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletResponse response) {
        LoginResult result = authService.login(request);
        cookieHelper.setAccessTokenCookie(response, result.getAccessToken());
        cookieHelper.setRefreshTokenCookie(response, result.getRefreshToken());

        AuthResponse body = AuthResponse.builder()
                .user(authService.toResponse(result.getUser()))
                .message("Connexion réussie")
                .accessTokenExpiresAt(result.getAccessTokenExpiresAt())
                .build();

        return ResponseEntity.ok(body);
    }

    @Operation(summary = "Rafraîchir le token d'accès")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request,
                                                 HttpServletResponse response) {
        String refreshToken = cookieHelper.extractRefreshTokenFromCookies(request);
        LoginResult result = authService.refresh(refreshToken);
        cookieHelper.setAccessTokenCookie(response, result.getAccessToken());
        cookieHelper.setRefreshTokenCookie(response, result.getRefreshToken());

        AuthResponse body = AuthResponse.builder()
                .user(authService.toResponse(result.getUser()))
                .message("Token rafraîchi")
                .accessTokenExpiresAt(result.getAccessTokenExpiresAt())
                .build();

        return ResponseEntity.ok(body);
    }

    @Operation(summary = "Déconnexion (révoque le refresh token)")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request,
                                        HttpServletResponse response) {
        String refreshToken = cookieHelper.extractRefreshTokenFromCookies(request);
        authService.logout(refreshToken);
        cookieHelper.clearCookies(response);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Profil de l'utilisateur connecté")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserDetails principal) {
        String userId = principal.getUsername(); // userId stored as username in JWT filter
        UserResponse user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(user);
    }
}
