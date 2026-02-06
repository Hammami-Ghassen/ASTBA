package tn.astba.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import tn.astba.dto.AuthResponse;
import tn.astba.dto.UserResponse;
import tn.astba.domain.Role;
import tn.astba.domain.UserStatus;
import tn.astba.domain.User;
import tn.astba.security.CookieHelper;
import tn.astba.security.JwtService;
import tn.astba.service.AuthService;
import tn.astba.service.AuthService.LoginResult;

import java.time.Instant;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@WithMockUser(roles = "ADMIN")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private CookieHelper cookieHelper;

    @MockBean
    private JwtService jwtService;

    @Test
    @DisplayName("POST /api/auth/register returns 201")
    void testRegister() throws Exception {
        UserResponse userResponse = UserResponse.builder()
                .id("u1")
                .email("test@email.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of(Role.TRAINER))
                .status(UserStatus.ACTIVE)
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .user(userResponse)
                .message("Inscription réussie.")
                .build();

        when(authService.register(any())).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "email": "test@email.com",
                                    "password": "SecurePass123!",
                                    "firstName": "Test",
                                    "lastName": "User"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.email").value("test@email.com"))
                .andExpect(jsonPath("$.message").value("Inscription réussie."));
    }

    @Test
    @DisplayName("POST /api/auth/login returns 200 with user info")
    void testLogin() throws Exception {
        User user = User.builder()
                .id("u1")
                .email("test@email.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of(Role.TRAINER))
                .status(UserStatus.ACTIVE)
                .build();

        LoginResult loginResult = LoginResult.builder()
                .user(user)
                .accessToken("access-jwt")
                .refreshToken("refresh-jwt")
                .accessTokenExpiresAt(Instant.now().plusSeconds(900))
                .build();

        UserResponse userResponse = UserResponse.builder()
                .id("u1")
                .email("test@email.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of(Role.TRAINER))
                .status(UserStatus.ACTIVE)
                .build();

        when(authService.login(any())).thenReturn(loginResult);
        when(authService.toResponse(any())).thenReturn(userResponse);

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "email": "test@email.com",
                                    "password": "SecurePass123!"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("test@email.com"))
                .andExpect(jsonPath("$.message").value("Connexion réussie"));

        verify(cookieHelper).setAccessTokenCookie(any(), eq("access-jwt"));
        verify(cookieHelper).setRefreshTokenCookie(any(), eq("refresh-jwt"));
    }

    @Test
    @DisplayName("GET /api/auth/me returns current user when authenticated")
    @WithMockUser(username = "u1", roles = "TRAINER")
    void testMe() throws Exception {
        UserResponse userResponse = UserResponse.builder()
                .id("u1")
                .email("test@email.com")
                .firstName("Test")
                .lastName("User")
                .roles(Set.of(Role.TRAINER))
                .status(UserStatus.ACTIVE)
                .build();

        when(authService.getCurrentUser("u1")).thenReturn(userResponse);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@email.com"));
    }

    @Test
    @DisplayName("POST /api/auth/register with invalid email returns 400")
    void testRegisterInvalidEmail() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "email": "not-valid",
                                    "password": "SecurePass123!"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/register with short password returns 400")
    void testRegisterShortPassword() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "email": "test@email.com",
                                    "password": "short"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
