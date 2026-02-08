package tn.astba.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Sends event payloads to n8n webhook endpoints which then forward
 * WhatsApp messages via the Facebook Graph API.
 */
@Slf4j
@Service
public class WhatsAppWebhookService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${astba.n8n.base-url:http://localhost:5678}")
    private String n8nBaseUrl;

    @Value("${astba.whatsapp.enabled:true}")
    private boolean enabled;

    public WhatsAppWebhookService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    // ─── 1. Absent Student → Catch-up Plan ──────────────

    /**
     * Notify a student that they were marked absent and should arrange catch-up.
     */
    public void notifyStudentAbsent(String studentName, String studentPhone,
                                     String trainingTitle, String seanceTitle,
                                     String date, String startTime, String endTime) {
        if (!enabled || studentPhone == null || studentPhone.isBlank()) {
            log.debug("WhatsApp disabled or no phone for student {}", studentName);
            return;
        }

        Map<String, String> payload = Map.of(
                "studentName", studentName,
                "studentPhone", normalizePhone(studentPhone),
                "trainingTitle", trainingTitle,
                "seanceTitle", seanceTitle,
                "date", date,
                "startTime", startTime,
                "endTime", endTime
        );

        postToWebhook("/webhook/student-absent", payload);
    }

    // ─── 2. Trainer Assigned to Séance ──────────────────

    /**
     * Notify a trainer that they have been assigned to a new séance.
     */
    public void notifyTrainerAssigned(String trainerName, String trainerPhone,
                                       String trainingTitle, String seanceTitle,
                                       String groupName, String date,
                                       String startTime, String endTime,
                                       int levelNumber, int sessionNumber) {
        if (!enabled || trainerPhone == null || trainerPhone.isBlank()) {
            log.debug("WhatsApp disabled or no phone for trainer {}", trainerName);
            return;
        }

        Map<String, Object> payload = Map.of(
                "trainerName", trainerName,
                "trainerPhone", normalizePhone(trainerPhone),
                "trainingTitle", trainingTitle,
                "seanceTitle", seanceTitle,
                "groupName", groupName,
                "date", date,
                "startTime", startTime,
                "endTime", endTime,
                "levelNumber", levelNumber,
                "sessionNumber", sessionNumber
        );

        postToWebhook("/webhook/trainer-assigned", payload);
    }

    // ─── 3. Séance Reported → Manager ───────────────────

    /**
     * Notify managers that a trainer has reported/postponed a séance.
     */
    public void notifySeanceReported(String managerPhone, String trainerName,
                                      String seanceTitle, String trainingTitle,
                                      String date, String reason, String suggestedDate) {
        if (!enabled || managerPhone == null || managerPhone.isBlank()) {
            log.debug("WhatsApp disabled or no phone for manager notification");
            return;
        }

        Map<String, String> payload = Map.of(
                "managerPhone", normalizePhone(managerPhone),
                "trainerName", trainerName,
                "seanceTitle", seanceTitle,
                "trainingTitle", trainingTitle,
                "date", date,
                "reason", reason,
                "suggestedDate", suggestedDate != null ? suggestedDate : "Non spécifiée"
        );

        postToWebhook("/webhook/seance-reported", payload);
    }

    // ─── Helpers ────────────────────────────────────────

    /**
     * POST JSON payload to an n8n webhook endpoint asynchronously.
     */
    private void postToWebhook(String path, Map<String, ?> payload) {
        CompletableFuture.runAsync(() -> {
            try {
                String json = objectMapper.writeValueAsString(payload);
                String url = n8nBaseUrl + path;

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(json))
                        .timeout(Duration.ofSeconds(10))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("WhatsApp webhook sent successfully: {} → {}", path, response.statusCode());
                } else {
                    log.warn("WhatsApp webhook returned {}: {} → {}", response.statusCode(), path, response.body());
                }
            } catch (Exception e) {
                log.error("Failed to send WhatsApp webhook to {}: {}", path, e.getMessage());
            }
        });
    }

    /**
     * Normalize phone to international format (Tunisia: +216).
     * WhatsApp requires phone numbers without the '+' prefix.
     */
    private String normalizePhone(String phone) {
        if (phone == null) return "";
        String digits = phone.replaceAll("[^0-9]", "");
        // If already starts with country code 216
        if (digits.startsWith("216")) {
            return digits;
        }
        // Tunisian local number (starts with 2, 5, 7, 9, etc.)
        if (digits.length() == 8) {
            return "216" + digits;
        }
        return digits;
    }
}
