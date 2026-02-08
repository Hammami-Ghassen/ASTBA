package tn.astba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.Binary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.astba.domain.PdfDocument;
import tn.astba.exception.BadRequestException;
import tn.astba.exception.ResourceNotFoundException;
import tn.astba.repository.PdfRepository;

import java.io.IOException;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfStorageService {

    private static final List<String> ALLOWED_TYPES = List.of("application/pdf");
    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10 MB

    private final PdfRepository pdfRepository;

    public PdfDocument store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Le fichier est vide");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException("Type de fichier non autorisé: " + contentType
                    + ". Seuls les fichiers PDF sont acceptés.");
        }

        if (file.getSize() > MAX_SIZE) {
            throw new BadRequestException("Le fichier est trop volumineux (max 10 Mo)");
        }

        try {
            PdfDocument doc = PdfDocument.builder()
                    .filename(file.getOriginalFilename())
                    .contentType(contentType)
                    .size(file.getSize())
                    .data(new Binary(file.getBytes()))
                    .build();
            PdfDocument saved = pdfRepository.save(doc);
            log.debug("PDF stocké en MongoDB: id={}, filename={}", saved.getId(), saved.getFilename());
            return saved;
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la lecture du fichier: " + file.getOriginalFilename(), e);
        }
    }

    public PdfDocument findById(String id) {
        return pdfRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
    }

    public void delete(String id) {
        if (!pdfRepository.existsById(id)) {
            throw new ResourceNotFoundException("Document", "id", id);
        }
        pdfRepository.deleteById(id);
        log.debug("Document supprimé: id={}", id);
    }
}
