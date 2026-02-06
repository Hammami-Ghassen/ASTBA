package tn.astba.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tn.astba.domain.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ProgressCalculatorTest {

    private Training training;

    @BeforeEach
    void setUp() {
        List<Level> levels = TrainingService.generateDefaultLevels();
        training = Training.builder()
                .id("training-1")
                .title("Test Training")
                .levels(levels)
                .build();
    }

    @Test
    @DisplayName("Empty attendance → 0 progress, no levels validated")
    void testEmptyAttendance() {
        Enrollment enrollment = Enrollment.builder()
                .id("e1")
                .studentId("s1")
                .trainingId("training-1")
                .attendance(new HashMap<>())
                .build();

        ProgressSnapshot snapshot = ProgressCalculator.compute(enrollment, training);

        assertEquals(24, snapshot.getTotalSessions());
        assertEquals(0, snapshot.getAttendedCount());
        assertEquals(0, snapshot.getMissedCount());
        assertTrue(snapshot.getLevelsValidated().isEmpty());
        assertFalse(snapshot.isCompleted());
        assertFalse(snapshot.isEligibleForCertificate());
        assertNull(snapshot.getCompletedAt());
    }

    @Test
    @DisplayName("All sessions PRESENT → training completed, eligible for certificate")
    void testAllPresent() {
        Map<String, AttendanceEntry> attendance = new HashMap<>();
        for (Level level : training.getLevels()) {
            for (Session session : level.getSessions()) {
                attendance.put(session.getSessionId(), AttendanceEntry.builder()
                        .status(AttendanceStatus.PRESENT)
                        .markedAt(Instant.now())
                        .build());
            }
        }

        Enrollment enrollment = Enrollment.builder()
                .id("e1")
                .studentId("s1")
                .trainingId("training-1")
                .attendance(attendance)
                .build();

        ProgressSnapshot snapshot = ProgressCalculator.compute(enrollment, training);

        assertEquals(24, snapshot.getTotalSessions());
        assertEquals(24, snapshot.getAttendedCount());
        assertEquals(0, snapshot.getMissedCount());
        assertEquals(List.of(1, 2, 3, 4), snapshot.getLevelsValidated());
        assertTrue(snapshot.isCompleted());
        assertTrue(snapshot.isEligibleForCertificate());
        assertNotNull(snapshot.getCompletedAt());
    }

    @Test
    @DisplayName("Level 1 all PRESENT + Level 2 partial → only level 1 validated")
    void testPartialCompletion() {
        Map<String, AttendanceEntry> attendance = new HashMap<>();

        // Mark all 6 sessions of level 1 as PRESENT
        Level level1 = training.getLevels().get(0);
        for (Session session : level1.getSessions()) {
            attendance.put(session.getSessionId(), AttendanceEntry.builder()
                    .status(AttendanceStatus.PRESENT)
                    .markedAt(Instant.now())
                    .build());
        }

        // Mark 3 sessions of level 2 as PRESENT, 1 as ABSENT
        Level level2 = training.getLevels().get(1);
        for (int i = 0; i < 3; i++) {
            attendance.put(level2.getSessions().get(i).getSessionId(), AttendanceEntry.builder()
                    .status(AttendanceStatus.PRESENT)
                    .markedAt(Instant.now())
                    .build());
        }
        attendance.put(level2.getSessions().get(3).getSessionId(), AttendanceEntry.builder()
                .status(AttendanceStatus.ABSENT)
                .markedAt(Instant.now())
                .build());

        Enrollment enrollment = Enrollment.builder()
                .id("e1")
                .studentId("s1")
                .trainingId("training-1")
                .attendance(attendance)
                .build();

        ProgressSnapshot snapshot = ProgressCalculator.compute(enrollment, training);

        assertEquals(24, snapshot.getTotalSessions());
        assertEquals(9, snapshot.getAttendedCount());
        assertEquals(1, snapshot.getMissedCount());
        assertEquals(List.of(1), snapshot.getLevelsValidated());
        assertFalse(snapshot.isCompleted());
        assertFalse(snapshot.isEligibleForCertificate());
    }

    @Test
    @DisplayName("EXCUSED status counts as attended for level validation")
    void testExcusedCountsAsAttended() {
        Map<String, AttendanceEntry> attendance = new HashMap<>();

        // Mark all sessions PRESENT except one which is EXCUSED
        for (Level level : training.getLevels()) {
            for (Session session : level.getSessions()) {
                attendance.put(session.getSessionId(), AttendanceEntry.builder()
                        .status(AttendanceStatus.PRESENT)
                        .markedAt(Instant.now())
                        .build());
            }
        }

        // Change one session to EXCUSED
        String firstSessionId = training.getLevels().get(0).getSessions().get(0).getSessionId();
        attendance.put(firstSessionId, AttendanceEntry.builder()
                .status(AttendanceStatus.EXCUSED)
                .markedAt(Instant.now())
                .build());

        Enrollment enrollment = Enrollment.builder()
                .id("e1")
                .studentId("s1")
                .trainingId("training-1")
                .attendance(attendance)
                .build();

        ProgressSnapshot snapshot = ProgressCalculator.compute(enrollment, training);

        assertEquals(24, snapshot.getAttendedCount());
        assertEquals(0, snapshot.getMissedCount());
        assertTrue(snapshot.isCompleted());
        assertTrue(snapshot.isEligibleForCertificate());
    }

    @Test
    @DisplayName("Missed sessions list returns non-present session IDs")
    void testMissedSessionIds() {
        Map<String, AttendanceEntry> attendance = new HashMap<>();

        // Mark only level 1 sessions as PRESENT
        Level level1 = training.getLevels().get(0);
        for (Session session : level1.getSessions()) {
            attendance.put(session.getSessionId(), AttendanceEntry.builder()
                    .status(AttendanceStatus.PRESENT)
                    .markedAt(Instant.now())
                    .build());
        }

        // Mark one of level 2 as ABSENT
        Level level2 = training.getLevels().get(1);
        attendance.put(level2.getSessions().get(0).getSessionId(), AttendanceEntry.builder()
                .status(AttendanceStatus.ABSENT)
                .markedAt(Instant.now())
                .build());

        Enrollment enrollment = Enrollment.builder()
                .id("e1")
                .studentId("s1")
                .trainingId("training-1")
                .attendance(attendance)
                .build();

        List<String> missed = ProgressCalculator.getMissedSessionIds(enrollment, training);

        // 18 sessions not marked + 1 ABSENT = 19 missed (levels 2-4 minus 1 ABSENT that's already counted)
        // Actually: level 2 session 0 = ABSENT, level 2 sessions 1-5 = null, level 3 all null, level 4 all null
        // = 1 + 5 + 6 + 6 = 18
        assertEquals(18, missed.size());
    }

    @Test
    @DisplayName("completedAt is preserved when already set")
    void testCompletedAtPreserved() {
        Map<String, AttendanceEntry> attendance = new HashMap<>();
        for (Level level : training.getLevels()) {
            for (Session session : level.getSessions()) {
                attendance.put(session.getSessionId(), AttendanceEntry.builder()
                        .status(AttendanceStatus.PRESENT)
                        .markedAt(Instant.now())
                        .build());
            }
        }

        Instant previousCompletedAt = Instant.parse("2026-01-01T00:00:00Z");
        ProgressSnapshot existingSnapshot = ProgressSnapshot.builder()
                .completedAt(previousCompletedAt)
                .completed(true)
                .build();

        Enrollment enrollment = Enrollment.builder()
                .id("e1")
                .studentId("s1")
                .trainingId("training-1")
                .attendance(attendance)
                .progressSnapshot(existingSnapshot)
                .build();

        ProgressSnapshot snapshot = ProgressCalculator.compute(enrollment, training);

        assertEquals(previousCompletedAt, snapshot.getCompletedAt());
    }
}
