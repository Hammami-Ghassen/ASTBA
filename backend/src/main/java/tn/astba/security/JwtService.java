package tn.astba.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tn.astba.domain.Role;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTtlMillis;
    private final long refreshTtlMillis;

    public JwtService(
            @Value("${astba.jwt.secret}") String secret,
            @Value("${astba.jwt.access-ttl-min:15}") long accessTtlMin,
            @Value("${astba.jwt.refresh-ttl-days:36500}") long refreshTtlDays) {
        // Pad secret to at least 64 bytes for HS512
        String padded = secret;
        while (padded.getBytes(StandardCharsets.UTF_8).length < 64) {
            padded = padded + secret;
        }
        this.signingKey = Keys.hmacShaKeyFor(padded.getBytes(StandardCharsets.UTF_8));
        this.accessTtlMillis = accessTtlMin * 60 * 1000;
        this.refreshTtlMillis = refreshTtlDays * 24 * 60 * 60 * 1000;
    }

    public String generateAccessToken(String userId, String email, Set<Role> roles) {
        Instant now = Instant.now();
        String rolesStr = roles.stream().map(Role::name).collect(Collectors.joining(","));

        return Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .claim("roles", rolesStr)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTtlMillis)))
                .signWith(signingKey)
                .compact();
    }

    public String generateRefreshToken(String userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .claim("type", "refresh")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(refreshTtlMillis)))
                .signWith(signingKey)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        if (token == null || token.isBlank()) return false;
        try {
            parseToken(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("JWT expiré");
        } catch (JwtException e) {
            log.debug("JWT invalide: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.debug("JWT invalide: {}", e.getMessage());
        }
        return false;
    }

    public String getUserIdFromToken(String token) {
        return parseToken(token).getSubject();
    }

    public Set<Role> getRolesFromToken(String token) {
        String rolesStr = parseToken(token).get("roles", String.class);
        if (rolesStr == null || rolesStr.isBlank()) return Set.of();
        return Set.of(rolesStr.split(",")).stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Role::valueOf)
                .collect(Collectors.toSet());
    }

    public long getAccessTtlMillis() {
        return accessTtlMillis;
    }

    public long getRefreshTtlMillis() {
        return refreshTtlMillis;
    }

    public Instant getAccessExpiration() {
        return Instant.now().plusMillis(accessTtlMillis);
    }

    public Instant getRefreshExpiration() {
        return Instant.now().plusMillis(refreshTtlMillis);
    }
}
