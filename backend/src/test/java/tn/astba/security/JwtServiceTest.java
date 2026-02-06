package tn.astba.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tn.astba.domain.Role;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        // 15 min access, 7 days refresh
        jwtService = new JwtService("test-secret-key-for-jwt-unit-testing", 15, 7);
    }

    @Test
    @DisplayName("Generate and validate access token")
    void testGenerateAndValidateAccessToken() {
        String token = jwtService.generateAccessToken("user123", "test@email.com", Set.of(Role.TRAINER));

        assertTrue(jwtService.validateToken(token));
        assertEquals("user123", jwtService.getUserIdFromToken(token));
    }

    @Test
    @DisplayName("Extract roles from access token")
    void testExtractRoles() {
        String token = jwtService.generateAccessToken("user123", "test@email.com",
                Set.of(Role.ADMIN, Role.MANAGER));

        Set<Role> roles = jwtService.getRolesFromToken(token);
        assertTrue(roles.contains(Role.ADMIN));
        assertTrue(roles.contains(Role.MANAGER));
        assertEquals(2, roles.size());
    }

    @Test
    @DisplayName("Generate and validate refresh token")
    void testGenerateAndValidateRefreshToken() {
        String token = jwtService.generateRefreshToken("user123");

        assertTrue(jwtService.validateToken(token));
        assertEquals("user123", jwtService.getUserIdFromToken(token));
    }

    @Test
    @DisplayName("Invalid token returns false")
    void testInvalidToken() {
        assertFalse(jwtService.validateToken("invalid.token.here"));
        assertFalse(jwtService.validateToken(""));
        assertFalse(jwtService.validateToken(null));
    }

    @Test
    @DisplayName("Tampered token returns false")
    void testTamperedToken() {
        String token = jwtService.generateAccessToken("user123", "test@email.com", Set.of(Role.TRAINER));
        // tamper with the token
        String tampered = token.substring(0, token.length() - 3) + "xyz";

        assertFalse(jwtService.validateToken(tampered));
    }

    @Test
    @DisplayName("Access and refresh TTL are correct")
    void testTtl() {
        assertEquals(15 * 60 * 1000, jwtService.getAccessTtlMillis());
        assertEquals(7L * 24 * 60 * 60 * 1000, jwtService.getRefreshTtlMillis());
    }
}
