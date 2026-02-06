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

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                // === Border ===
                cs.setLineWidth(3f);
                cs.addRect(20, 20, pageWidth - 40, pageHeight - 40);
                cs.stroke();
                cs.setLineWidth(1f);
                cs.addRect(25, 25, pageWidth - 50, pageHeight - 50);
                cs.stroke();

                float centerX = pageWidth / 2;
                float y = pageHeight - 80;

                // === Header: ASTBA ===
                drawCenteredText(cs, "ASTBA", fontBold, 28, centerX, y, pageWidth);
                y -= 30;
                drawCenteredText(cs, "Association Sciences and Technology Ben Arous", fontRegular, 12, centerX, y, pageWidth);
                y -= 20;
                drawCenteredText(cs, "Tunisie", fontItalic, 11, centerX, y, pageWidth);

                // === Decorative line ===
                y -= 25;
                cs.setLineWidth(2f);
                cs.moveTo(centerX - 150, y);
                cs.lineTo(centerX + 150, y);
                cs.stroke();

                // === Certificate Title ===
                y -= 45;
                drawCenteredText(cs, "CERTIFICAT DE FORMATION", fontBold, 24, centerX, y, pageWidth);

                // === Body ===
                y -= 50;
                drawCenteredText(cs, "Nous certifions que", fontRegular, 14, centerX, y, pageWidth);

                y -= 40;
                drawCenteredText(cs, studentName, fontBold, 22, centerX, y, pageWidth);

                // Underline the name
                float nameWidth = fontBold.getStringWidth(studentName) / 1000 * 22;
                cs.setLineWidth(1f);
                cs.moveTo(centerX - nameWidth / 2, y - 3);
                cs.lineTo(centerX + nameWidth / 2, y - 3);
                cs.stroke();

                y -= 40;
                drawCenteredText(cs, "a complete avec succes les 4 niveaux de la formation", fontRegular, 14, centerX, y, pageWidth);

                y -= 35;
                drawCenteredText(cs, trainingTitle, fontBold, 18, centerX, y, pageWidth);

                y -= 35;
                String dateStr = "le " + completedDate.format(DATE_FMT);
                drawCenteredText(cs, dateStr, fontRegular, 13, centerX, y, pageWidth);

                // === Decorative line ===
                y -= 30;
                cs.setLineWidth(1f);
                cs.moveTo(centerX - 100, y);
                cs.lineTo(centerX + 100, y);
                cs.stroke();

                // === Signature ===
                y -= 50;
                drawCenteredText(cs, "Pour l'Association,", fontItalic, 12, centerX, y, pageWidth);
                y -= 20;
                drawCenteredText(cs, "Le President de l'ASTBA", fontRegular, 12, centerX, y, pageWidth);

                // Signature line
                y -= 30;
                cs.moveTo(centerX - 80, y);
                cs.lineTo(centerX + 80, y);
                cs.stroke();

                // === Certificate Number ===
                y = 50;
                drawCenteredText(cs, "N° " + certNumber, fontRegular, 9, centerX, y, pageWidth);
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
