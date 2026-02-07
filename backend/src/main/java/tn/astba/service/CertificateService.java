package tn.astba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tn.astba.domain.Enrollment;
import tn.astba.domain.ProgressSnapshot;
import tn.astba.domain.Student;
import tn.astba.domain.Training;
import tn.astba.dto.CertificateMetaResponse;
import tn.astba.exception.ConflictException;
import tn.astba.repository.EnrollmentRepository;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Calendar;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateService {

    private final EnrollmentService enrollmentService;
    private final StudentService studentService;
    private final TrainingService trainingService;
    private final EnrollmentRepository enrollmentRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRANCE);

    public CertificateMetaResponse getCertificateMeta(String enrollmentId) {
        Enrollment enrollment = enrollmentService.getEnrollmentOrThrow(enrollmentId);
        Student student = studentService.getStudentOrThrow(enrollment.getStudentId());
        Training training = trainingService.getTrainingOrThrow(enrollment.getTrainingId());

        ProgressSnapshot ps = enrollment.getProgressSnapshot();
        boolean eligible = ps != null && ps.isEligibleForCertificate();

        return CertificateMetaResponse.builder()
                .eligible(eligible)
                .completedAt(ps != null ? ps.getCompletedAt() : null)
                .issuedAt(ps != null ? ps.getCertificateIssuedAt() : null)
                .studentName(student.getFirstName() + " " + student.getLastName())
                .trainingTitle(training.getTitle())
                .build();
    }

    public byte[] generateCertificatePdf(String enrollmentId) throws IOException {
        Enrollment enrollment = enrollmentService.getEnrollmentOrThrow(enrollmentId);
        ProgressSnapshot ps = enrollment.getProgressSnapshot();

        if (ps == null || !ps.isEligibleForCertificate()) {
            throw new ConflictException("L'élève n'est pas éligible pour un certificat. La formation doit être complétée.");
        }

        Student student = studentService.getStudentOrThrow(enrollment.getStudentId());
        Training training = trainingService.getTrainingOrThrow(enrollment.getTrainingId());

        String studentName = student.getFirstName() + " " + student.getLastName();
        String certNumber = generateCertificateNumber(enrollment);

        LocalDate completedDate = ps.getCompletedAt() != null
                ? ps.getCompletedAt().atZone(ZoneId.systemDefault()).toLocalDate()
                : LocalDate.now();

        byte[] pdf = buildPdf(studentName, training.getTitle(), completedDate, certNumber);

        // Mark certificate as issued
        if (ps.getCertificateIssuedAt() == null) {
            ps.setCertificateIssuedAt(Instant.now());
            enrollment.setProgressSnapshot(ps);
            enrollmentRepository.save(enrollment);
        }

        log.debug("Certificat généré: enrollment={}, cert={}", enrollmentId, certNumber);
        return pdf;
    }

    private byte[] buildPdf(String studentName, String trainingTitle, LocalDate completedDate, String certNumber) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            // PDF landscape A4
            PDPage page = new PDPage(new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth()));
            doc.addPage(page);

            // Metadata
            PDDocumentInformation info = doc.getDocumentInformation();
            info.setTitle("Certificat - " + studentName);
            info.setAuthor("Association Sciences and Technology Ben Arous (ASTBA)");
            info.setSubject("Certificat de formation - " + trainingTitle);
            info.setCreator("ASTBA Training Platform");
            Calendar cal = Calendar.getInstance();
            info.setCreationDate(cal);

            float pageWidth = page.getMediaBox().getWidth();
            float pageHeight = page.getMediaBox().getHeight();

            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontItalic = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            // Load logo
            PDImageXObject logo = null;
            try {
                ClassPathResource logoRes = new ClassPathResource("static/logo.png");
                if (logoRes.exists()) {
                    logo = PDImageXObject.createFromByteArray(doc, logoRes.getInputStream().readAllBytes(), "logo.png");
                }
            } catch (Exception e) {
                log.warn("Logo non trouvé, certificat sans logo: {}", e.getMessage());
            }

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float centerX = pageWidth / 2;

                // === Outer decorative border (double-line) ===
                // Outer
                cs.setStrokingColor(0.2f, 0.4f, 0.7f); // dark blue
                cs.setLineWidth(3f);
                cs.addRect(15, 15, pageWidth - 30, pageHeight - 30);
                cs.stroke();
                // Inner
                cs.setLineWidth(1f);
                cs.addRect(22, 22, pageWidth - 44, pageHeight - 44);
                cs.stroke();
                // Corner accents (decorative L shapes)
                float cornerLen = 30;
                float inset = 28;
                cs.setLineWidth(2f);
                // Top-left
                cs.moveTo(inset, pageHeight - inset); cs.lineTo(inset + cornerLen, pageHeight - inset); cs.stroke();
                cs.moveTo(inset, pageHeight - inset); cs.lineTo(inset, pageHeight - inset - cornerLen); cs.stroke();
                // Top-right
                cs.moveTo(pageWidth - inset, pageHeight - inset); cs.lineTo(pageWidth - inset - cornerLen, pageHeight - inset); cs.stroke();
                cs.moveTo(pageWidth - inset, pageHeight - inset); cs.lineTo(pageWidth - inset, pageHeight - inset - cornerLen); cs.stroke();
                // Bottom-left
                cs.moveTo(inset, inset); cs.lineTo(inset + cornerLen, inset); cs.stroke();
                cs.moveTo(inset, inset); cs.lineTo(inset, inset + cornerLen); cs.stroke();
                // Bottom-right
                cs.moveTo(pageWidth - inset, inset); cs.lineTo(pageWidth - inset - cornerLen, inset); cs.stroke();
                cs.moveTo(pageWidth - inset, inset); cs.lineTo(pageWidth - inset, inset + cornerLen); cs.stroke();

                // Reset stroke color
                cs.setStrokingColor(0.3f, 0.3f, 0.3f);

                float y = pageHeight - 55;

                // === Logo ===
                if (logo != null) {
                    float logoH = 60;
                    float logoW = logoH * logo.getWidth() / logo.getHeight();
                    cs.drawImage(logo, centerX - logoW / 2, y - logoH, logoW, logoH);
                    y -= logoH + 10;
                }

                // === Header: Organization Name ===
                cs.setNonStrokingColor(0.3f, 0.3f, 0.3f);
                drawCenteredText(cs, "Association Sciences and Technology Ben Arous", fontRegular, 11, centerX, y, pageWidth);
                y -= 16;
                drawCenteredText(cs, "67 Avenue 14 Janvier, Ben Arous 2013 — Tunisie", fontItalic, 9, centerX, y, pageWidth);

                // === Decorative line ===
                y -= 20;
                cs.setStrokingColor(0.2f, 0.4f, 0.7f);
                cs.setLineWidth(1.5f);
                cs.moveTo(centerX - 180, y);
                cs.lineTo(centerX + 180, y);
                cs.stroke();

                // === Certificate Title ===
                y -= 40;
                cs.setNonStrokingColor(0.15f, 0.35f, 0.65f);
                drawCenteredText(cs, "CERTIFICAT DE FORMATION", fontBold, 26, centerX, y, pageWidth);

                // === Body ===
                cs.setNonStrokingColor(0.2f, 0.2f, 0.2f);
                y -= 40;
                drawCenteredText(cs, "Nous certifions que", fontRegular, 13, centerX, y, pageWidth);

                y -= 35;
                cs.setNonStrokingColor(0.1f, 0.1f, 0.1f);
                drawCenteredText(cs, studentName, fontBold, 24, centerX, y, pageWidth);

                // Underline the name with decorative line
                float nameWidth = fontBold.getStringWidth(studentName) / 1000 * 24;
                cs.setStrokingColor(0.2f, 0.4f, 0.7f);
                cs.setLineWidth(1f);
                cs.moveTo(centerX - nameWidth / 2 - 10, y - 4);
                cs.lineTo(centerX + nameWidth / 2 + 10, y - 4);
                cs.stroke();

                cs.setNonStrokingColor(0.2f, 0.2f, 0.2f);
                y -= 35;
                drawCenteredText(cs, "a complété avec succès les 4 niveaux de la formation", fontRegular, 13, centerX, y, pageWidth);

                y -= 30;
                cs.setNonStrokingColor(0.15f, 0.35f, 0.65f);
                drawCenteredText(cs, trainingTitle, fontBold, 20, centerX, y, pageWidth);

                cs.setNonStrokingColor(0.3f, 0.3f, 0.3f);
                y -= 28;
                String dateStr = "Délivré le " + completedDate.format(DATE_FMT);
                drawCenteredText(cs, dateStr, fontRegular, 12, centerX, y, pageWidth);

                // === Decorative line ===
                y -= 22;
                cs.setStrokingColor(0.2f, 0.4f, 0.7f);
                cs.setLineWidth(1f);
                cs.moveTo(centerX - 120, y);
                cs.lineTo(centerX + 120, y);
                cs.stroke();

                // === Signatures (two columns) ===
                y -= 40;
                float sigLeftX = pageWidth * 0.25f;
                float sigRightX = pageWidth * 0.75f;

                cs.setNonStrokingColor(0.2f, 0.2f, 0.2f);
                // Left: Manager signature
                drawCenteredText(cs, "Le Responsable", fontItalic, 11, sigLeftX, y, pageWidth);
                y -= 15;
                drawCenteredText(cs, "de la Formation", fontItalic, 11, sigLeftX, y, pageWidth);
                y -= 30;
                // Signature line
                cs.setStrokingColor(0.4f, 0.4f, 0.4f);
                cs.moveTo(sigLeftX - 70, y);
                cs.lineTo(sigLeftX + 70, y);
                cs.stroke();

                // Right: Association president signature
                float yRight = y + 45;
                drawCenteredText(cs, "Pour l'Association", fontItalic, 11, sigRightX, yRight, pageWidth);
                yRight -= 15;
                drawCenteredText(cs, "Le Président de l'ASTBA", fontItalic, 11, sigRightX, yRight, pageWidth);
                yRight -= 30;
                cs.moveTo(sigRightX - 70, yRight);
                cs.lineTo(sigRightX + 70, yRight);
                cs.stroke();

                // === Certificate Number (footer) ===
                cs.setNonStrokingColor(0.5f, 0.5f, 0.5f);
                drawCenteredText(cs, "N° " + certNumber, fontRegular, 8, centerX, 38, pageWidth);
                drawCenteredText(cs, "Ce certificat est délivré par l'Association Sciences and Technology Ben Arous", fontItalic, 7, centerX, 28, pageWidth);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private void drawCenteredText(PDPageContentStream cs, String text, PDType1Font font, float fontSize,
                                   float centerX, float y, float pageWidth) throws IOException {
        float textWidth = font.getStringWidth(text) / 1000 * fontSize;
        float x = centerX - textWidth / 2;
        cs.beginText();
        cs.setFont(font, fontSize);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
    }

    private String generateCertificateNumber(Enrollment enrollment) {
        int year = LocalDate.now().getYear();
        // Use last 4 chars of enrollment ID for uniqueness
        String suffix = enrollment.getId().length() > 4
                ? enrollment.getId().substring(enrollment.getId().length() - 4).toUpperCase()
                : enrollment.getId().toUpperCase();
        return String.format("ASTBA-%d-%s", year, suffix);
    }
}
