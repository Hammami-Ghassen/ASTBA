package tn.astba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.astba.dto.CertificateMetaResponse;
import tn.astba.service.CertificateService;

import java.io.IOException;

@RestController
@RequestMapping("/api/enrollments/{enrollmentId}/certificate")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
@Tag(name = "Certificats", description = "Génération et consultation des certificats")
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping("/meta")
    @Operation(summary = "Métadonnées du certificat", description = "Vérifie l'éligibilité et les dates")
    public ResponseEntity<CertificateMetaResponse> getCertificateMeta(@PathVariable String enrollmentId) {
        return ResponseEntity.ok(certificateService.getCertificateMeta(enrollmentId));
    }

    @GetMapping(produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Télécharger le certificat PDF", description = "Génère et retourne le certificat au format PDF. Erreur 409 si non éligible.")
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable String enrollmentId) throws IOException {
        byte[] pdf = certificateService.generateCertificatePdf(enrollmentId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"certificate-" + enrollmentId + ".pdf\"")
                .body(pdf);
    }
}
