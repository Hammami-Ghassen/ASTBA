package tn.astba.service;

import tn.astba.domain.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Central business logic for computing enrollment progress.
 *
 * BUSINESS RULES (documented):
 * - A level is validated if ALL 6 sessions of that level have status PRESENT or EXCUSED.
 * - Training is completed if all 4 levels are validated.
 * - Certificate eligibility = training completed.
 * - completedAt is set when completed transitions from false to true.
 */
public final class ProgressCalculator {

    private ProgressCalculator() {}

    public static ProgressSnapshot compute(Enrollment enrollment, Training training) {
        Map<String, AttendanceEntry> attendance = enrollment.getAttendance();
        if (attendance == null) {
            attendance = Map.of();
        }

        int totalSessions = 0;
        int attendedCount = 0;
        int missedCount = 0;
        List<Integer> levelsValidated = new ArrayList<>();

        for (Level level : training.getLevels()) {
            boolean levelValid = true;
            for (Session session : level.getSessions()) {
                totalSessions++;
                AttendanceEntry entry = attendance.get(session.getSessionId());
                if (entry != null) {
                    if (entry.getStatus() == AttendanceStatus.PRESENT || entry.getStatus() == AttendanceStatus.EXCUSED) {
                        attendedCount++;
                    } else {
                        missedCount++;
                        levelValid = false;
                    }
                } else {
                    // Session not yet marked → not validated
                    levelValid = false;
                }
            }
            if (levelValid) {
                levelsValidated.add(level.getLevelNumber());
            }
        }

        boolean completed = levelsValidated.size() == 4;

        // Preserve completedAt if was already completed
        Instant completedAt = null;
        ProgressSnapshot existing = enrollment.getProgressSnapshot();
        if (completed) {
            if (existing != null && existing.getCompletedAt() != null) {
                completedAt = existing.getCompletedAt();
            } else {
                completedAt = Instant.now();
            }
        }

        // Preserve certificateIssuedAt
        Instant certificateIssuedAt = (existing != null) ? existing.getCertificateIssuedAt() : null;

        return ProgressSnapshot.builder()
                .totalSessions(totalSessions)
                .attendedCount(attendedCount)
                .missedCount(missedCount)
                .levelsValidated(levelsValidated)
                .completed(completed)
                .completedAt(completedAt)
                .eligibleForCertificate(completed)
                .certificateIssuedAt(certificateIssuedAt)
                .build();
    }

    /**
     * Returns session IDs where the student was absent or not marked.
     */
    public static List<String> getMissedSessionIds(Enrollment enrollment, Training training) {
        Map<String, AttendanceEntry> attendance = enrollment.getAttendance();
        if (attendance == null) attendance = Map.of();

        List<String> missed = new ArrayList<>();
        for (Level level : training.getLevels()) {
            for (Session session : level.getSessions()) {
                AttendanceEntry entry = attendance.get(session.getSessionId());
                if (entry == null || entry.getStatus() == AttendanceStatus.ABSENT) {
                    missed.add(session.getSessionId());
                }
            }
        }
        return missed;
    }
}
