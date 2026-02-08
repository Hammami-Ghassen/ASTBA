package tn.astba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.astba.domain.ImageDocument;
import tn.astba.domain.PdfDocument;
import tn.astba.service.FileStorageService;
import tn.astba.service.ImageStorageService;
import tn.astba.service.PdfStorageService;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
@Tag(name = "Uploads", description = "Upload de fichiers (images, documents)")
public class FileUploadController {

    private final FileStorageService fileStorageService;
    private final ImageStorageService imageStorageService;
    private final PdfStorageService pdfStorageService;

    /* ──── Image upload → MongoDB ──── */

    @PostMapping("/api/uploads/image")
    @Operation(summary = "Upload d'une image", description = "Stocke l'image en MongoDB et retourne l'URL")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        ImageDocument saved = imageStorageService.store(file);
        String imageUrl = "/api/images/" + saved.getId();
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "filename", saved.getFilename(),
                "imageUrl", imageUrl
        ));
    }

    /* ──── Serve image from MongoDB ──── */

    @GetMapping("/api/images/{id}")
    @Operation(summary = "Récupérer une image", description = "Retourne l'image binaire depuis MongoDB")
    public ResponseEntity<byte[]> getImage(@PathVariable String id) {
        ImageDocument image = imageStorageService.findById(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=" + TimeUnit.DAYS.toSeconds(30))
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .contentLength(image.getSize())
                .body(image.getData().getData());
    }

    /* ──── Delete image ──── */

    @DeleteMapping("/api/images/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Supprimer une image")
    public ResponseEntity<Void> deleteImage(@PathVariable String id) {
        imageStorageService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /* ──── Document upload → MongoDB ──── */

    @PostMapping("/api/uploads/document")
    @Operation(summary = "Upload d'un document PDF", description = "Stocke le PDF en MongoDB et retourne l'URL")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> uploadDocument(@RequestParam("file") MultipartFile file) {
        PdfDocument saved = pdfStorageService.store(file);
        String documentUrl = "/documents/" + saved.getId();
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "filename", saved.getFilename(),
                "documentUrl", documentUrl
        ));
    }

    /* ──── Serve document from MongoDB ──── */

    @GetMapping("/api/documents/{id}")
    @Operation(summary = "Récupérer un document PDF", description = "Retourne le PDF binaire depuis MongoDB")
    public ResponseEntity<byte[]> getDocument(@PathVariable String id) {
        PdfDocument doc = pdfStorageService.findById(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=" + TimeUnit.DAYS.toSeconds(30))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(doc.getSize())
                .body(doc.getData().getData());
    }

    /* ──── Delete document ──── */

    @DeleteMapping("/api/documents/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Supprimer un document PDF")
    public ResponseEntity<Void> deleteDocument(@PathVariable String id) {
        pdfStorageService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /* ──── Backward-compatible: serve old filesystem uploads ──── */

    @GetMapping("/api/uploads/{filename:.+}")
    @Operation(summary = "Récupérer un ancien document uploadé sur le filesystem")
    public ResponseEntity<byte[]> getLegacyUpload(@PathVariable String filename) {
        try {
            java.nio.file.Path filePath = fileStorageService.getUploadPath().resolve(filename).normalize();
            if (!java.nio.file.Files.exists(filePath)) {
                throw new tn.astba.exception.ResourceNotFoundException("Document", "filename", filename);
            }
            byte[] data = java.nio.file.Files.readAllBytes(filePath);
            String contentType = java.nio.file.Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=" + TimeUnit.DAYS.toSeconds(30))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(data.length)
                    .body(data);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Erreur lors de la lecture du fichier: " + filename, e);
        }
    }
}
