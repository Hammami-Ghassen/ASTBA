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
import org.springframework.web.bind.annotation.*;
import tn.astba.dto.AuthResponse;
import tn.astba.dto.LoginRequest;
import tn.astba.dto.RegisterRequest;
import tn.astba.dto.UserResponse;
import tn.astba.security.CookieHelper;
import tn.astba.security.OAuth2CodeStore;
import tn.astba.service.AuthService;
import tn.astba.service.AuthService.LoginResult;

@Tag(name = "Auth", description = "Authentification et gestion de session")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieHelper cookieHelper;
    private final OAuth2CodeStore oAuth2CodeStore;

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
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal String userId) {
        UserResponse user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Échanger un code OAuth2 unique contre des cookies JWT",
               description = "Après un login Google, le backend redirige avec un code temporaire. "
                           + "Le frontend échange ce code via le proxy Next.js pour que les cookies "
                           + "soient posés sur le domaine du frontend.")
    @PostMapping("/oauth2-exchange")
    public ResponseEntity<?> oauth2Exchange(@RequestParam String code,
                                            HttpServletResponse response) {
        OAuth2CodeStore.TokenPair tokens = oAuth2CodeStore.exchange(code);
        if (tokens == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("error", "Code invalide ou expiré"));
        }
        cookieHelper.setAccessTokenCookie(response, tokens.accessToken());
        cookieHelper.setRefreshTokenCookie(response, tokens.refreshToken());
        return ResponseEntity.ok(java.util.Map.of("message", "Cookies définis"));
    }
}
