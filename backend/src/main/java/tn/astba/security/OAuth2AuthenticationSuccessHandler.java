package tn.astba.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import tn.astba.domain.User;
import tn.astba.service.AuthService;
import tn.astba.service.RefreshTokenService;

import java.io.IOException;

/**
 * On successful Google OAuth2 login: find/create user, issue JWT cookies, redirect to frontend.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final JwtService jwtService;
    private final CookieHelper cookieHelper;
    private final RefreshTokenService refreshTokenService;

    @Value("${astba.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String googleId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");
        Boolean emailVerified = oAuth2User.getAttribute("email_verified");

        User user = authService.findOrCreateGoogleUser(
                googleId, email, firstName, lastName,
                emailVerified != null && emailVerified);

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRoles());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        refreshTokenService.storeRefreshToken(user.getId(), refreshToken);

        cookieHelper.setAccessTokenCookie(response, accessToken);
        cookieHelper.setRefreshTokenCookie(response, refreshToken);

        log.info("Connexion OAuth2 réussie: email={}", email);

        String targetUrl = frontendUrl + "/auth/callback?provider=google";
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
