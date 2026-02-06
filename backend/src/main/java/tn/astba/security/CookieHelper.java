package tn.astba.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Helper to set/clear JWT cookies (HttpOnly, Secure, SameSite).
 */
@Component
@RequiredArgsConstructor
public class CookieHelper {

    @Value("${astba.cookie.secure:false}")
    private boolean secureCookie;

    @Value("${astba.cookie.same-site:Lax}")
    private String sameSite;

    private final JwtService jwtService;

    public void setAccessTokenCookie(HttpServletResponse response, String token) {
        long maxAge = jwtService.getAccessTtlMillis() / 1000;
        setCookie(response, "access_token", token, maxAge);
    }

    public void setRefreshTokenCookie(HttpServletResponse response, String token) {
        long maxAge = jwtService.getRefreshTtlMillis() / 1000;
        setCookie(response, "refresh_token", token, maxAge);
    }

    public void clearCookies(HttpServletResponse response) {
        setCookie(response, "access_token", "", 0);
        setCookie(response, "refresh_token", "", 0);
    }

    public String extractRefreshTokenFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refresh_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public String extractAccessTokenFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("access_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private void setCookie(HttpServletResponse response, String name, String value, long maxAgeSeconds) {
        StringBuilder sb = new StringBuilder();
        sb.append(name).append("=").append(value);
        sb.append("; Path=/");
        sb.append("; Max-Age=").append(maxAgeSeconds);
        sb.append("; HttpOnly");
        if (secureCookie) {
            sb.append("; Secure");
        }
        sb.append("; SameSite=").append(sameSite);

        response.addHeader("Set-Cookie", sb.toString());
    }
}
