package tn.astba.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tn.astba.security.JwtAccessDeniedHandler;
import tn.astba.security.JwtAuthenticationEntryPoint;
import tn.astba.security.JwtAuthenticationFilter;
import tn.astba.security.OAuth2AuthenticationFailureHandler;
import tn.astba.security.OAuth2AuthenticationSuccessHandler;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAccessDeniedHandler accessDeniedHandler;

    // OAuth2 — optional, only available when Google client-id is configured
    @Autowired(required = false)
    private OAuth2AuthenticationSuccessHandler oAuth2SuccessHandler;

    @Autowired(required = false)
    private OAuth2AuthenticationFailureHandler oAuth2FailureHandler;

    @Autowired(required = false)
    private ClientRegistrationRepository clientRegistrationRepository;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})           // delegates to CorsConfig bean
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                    .authenticationEntryPoint(authenticationEntryPoint)
                    .accessDeniedHandler(accessDeniedHandler))
            .authorizeHttpRequests(auth -> auth
                    // Public endpoints (login, register, refresh, logout – but NOT /me)
                    .requestMatchers("/api/auth/login", "/api/auth/register",
                                     "/api/auth/refresh", "/api/auth/logout").permitAll()
                    .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                    .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/api-docs/**").permitAll()
                    .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                    // Serve uploaded files publicly (images)
                    .requestMatchers("/uploads/**").permitAll()
                    // Admin endpoints
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    // Everything else requires authentication
                    .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        // Only enable OAuth2 login if a ClientRegistrationRepository is available
        if (clientRegistrationRepository != null && oAuth2SuccessHandler != null) {
            http.oauth2Login(oauth2 -> oauth2
                    .successHandler(oAuth2SuccessHandler)
                    .failureHandler(oAuth2FailureHandler)
            );
        }

        return http.build();
    }
}
