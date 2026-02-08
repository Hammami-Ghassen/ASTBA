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
import tn.astba.service.ImageStorageService;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequiredArgsConstructor
@Tag(name = "Uploads", description = "Upload de fichiers (images)")
public class FileUploadController {

    private final ImageStorageService imageStorageService;

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
}
}
