package tn.astba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.Binary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.astba.domain.ImageDocument;
import tn.astba.exception.BadRequestException;
import tn.astba.exception.ResourceNotFoundException;
import tn.astba.repository.ImageRepository;

import java.io.IOException;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageStorageService {

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    private final ImageRepository imageRepository;

    public ImageDocument store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Le fichier est vide");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException("Type de fichier non autorisé: " + contentType
                    + ". Types autorisés: " + String.join(", ", ALLOWED_TYPES));
        }

        if (file.getSize() > MAX_SIZE) {
            throw new BadRequestException("Le fichier est trop volumineux (max 5 Mo)");
        }

        try {
            ImageDocument image = ImageDocument.builder()
                    .filename(file.getOriginalFilename())
                    .contentType(contentType)
                    .size(file.getSize())
                    .data(new Binary(file.getBytes()))
                    .build();
            ImageDocument saved = imageRepository.save(image);
            log.debug("Image stockée en MongoDB: id={}, filename={}", saved.getId(), saved.getFilename());
            return saved;
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la lecture du fichier: " + file.getOriginalFilename(), e);
        }
    }

    public ImageDocument findById(String id) {
        return imageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Image", "id", id));
    }

    public void delete(String id) {
        if (!imageRepository.existsById(id)) {
            throw new ResourceNotFoundException("Image", "id", id);
        }
        imageRepository.deleteById(id);
        log.debug("Image supprimée: id={}", id);
    }
}
