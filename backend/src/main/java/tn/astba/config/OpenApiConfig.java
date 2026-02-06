package tn.astba.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String bearerAuth = "bearerAuth";
        final String cookieAuth = "cookieAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("ASTBA - Training & Attendance Tracking API")
                        .version("1.0.0")
                        .description("API Backend pour la gestion des formations, présences et certificats " +
                                     "de l'Association Sciences and Technology Ben Arous.\n\n" +
                                     "**Authentification:** JWT via header `Authorization: Bearer <token>` ou cookie HttpOnly `access_token`.")
                        .contact(new Contact()
                                .name("ASTBA Team")
                                .email("contact@astba.tn")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development")
                ))
                .components(new Components()
                        .addSecuritySchemes(bearerAuth, new SecurityScheme()
                                .name(bearerAuth)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT Bearer token"))
                        .addSecuritySchemes(cookieAuth, new SecurityScheme()
                                .name("access_token")
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .description("JWT dans le cookie HttpOnly access_token")))
                .addSecurityItem(new SecurityRequirement().addList(bearerAuth).addList(cookieAuth));
    }
}
