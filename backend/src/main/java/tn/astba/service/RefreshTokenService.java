package tn.astba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.astba.domain.RefreshToken;
import tn.astba.repository.RefreshTokenRepository;
import tn.astba.security.JwtService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;

    /**
     * Persist a refresh token hash for the user.
     */
    public void storeRefreshToken(String userId, String rawToken) {
        RefreshToken entity = RefreshToken.builder()
                .userId(userId)
                .tokenHash(hashToken(rawToken))
                .expiresAt(jwtService.getRefreshExpiration())
                .build();
        refreshTokenRepository.save(entity);
    }

    /**
     * Validate a refresh token: hash must exist, not revoked, not expired.
     */
    public Optional<RefreshToken> validateRefreshToken(String rawToken) {
        String hash = hashToken(rawToken);
        return refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(hash)
                .filter(rt -> rt.getExpiresAt().isAfter(Instant.now()));
    }

    /**
     * Revoke a specific refresh token.
     */
    public void revokeRefreshToken(String rawToken) {
        String hash = hashToken(rawToken);
        refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(hash)
                .ifPresent(rt -> {
                    rt.setRevokedAt(Instant.now());
                    refreshTokenRepository.save(rt);
                });
    }

    /**
     * Revoke all refresh tokens for a user (e.g., on logout-all or password change).
     */
    public void revokeAllUserTokens(String userId) {
        List<RefreshToken> tokens = refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId);
        tokens.forEach(rt -> rt.setRevokedAt(Instant.now()));
        refreshTokenRepository.saveAll(tokens);
    }

    /**
     * Rotate: revoke old, store new.
     */
    public void rotateRefreshToken(String userId, String oldRawToken, String newRawToken) {
        revokeRefreshToken(oldRawToken);
        storeRefreshToken(userId, newRawToken);
    }

    /**
     * Cleanup expired tokens.
     */
    public void cleanupExpired() {
        refreshTokenRepository.deleteByExpiresAtBefore(Instant.now());
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
