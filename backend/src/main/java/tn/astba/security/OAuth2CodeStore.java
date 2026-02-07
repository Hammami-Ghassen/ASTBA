package tn.astba.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory store for one-time OAuth2 authorization codes.
 * <p>
 * After a successful Google OAuth2 login, the backend generates a short-lived
 * random code, stores the JWT tokens mapped to it, and redirects to the frontend
 * with the code as a query parameter. The frontend then exchanges the code for
 * cookies via the Next.js API proxy, so the cookies are set on the frontend domain.
 * </p>
 */
@Component
public class OAuth2CodeStore {

    private static final long CODE_TTL_SECONDS = 60; // 1 minute

    private record StoredTokens(String accessToken, String refreshToken, Instant expiresAt) {}

    private final Map<String, StoredTokens> store = new ConcurrentHashMap<>();

    /**
     * Generate a one-time code and store the tokens for later exchange.
     */
    public String generateCode(String accessToken, String refreshToken) {
        cleanup();
        String code = UUID.randomUUID().toString();
        store.put(code, new StoredTokens(
                accessToken, refreshToken,
                Instant.now().plusSeconds(CODE_TTL_SECONDS)));
        return code;
    }

    /**
     * Exchange a one-time code for tokens. Returns null if the code is invalid or expired.
     * The code is consumed (deleted) on use.
     */
    public TokenPair exchange(String code) {
        StoredTokens tokens = store.remove(code);
        if (tokens == null || Instant.now().isAfter(tokens.expiresAt())) {
            return null;
        }
        return new TokenPair(tokens.accessToken(), tokens.refreshToken());
    }

    /** Returned by {@link #exchange(String)}. */
    public record TokenPair(String accessToken, String refreshToken) {}

    /** Remove expired entries to prevent memory leaks. */
    private void cleanup() {
        Instant now = Instant.now();
        store.entrySet().removeIf(e -> now.isAfter(e.getValue().expiresAt()));
    }
}
