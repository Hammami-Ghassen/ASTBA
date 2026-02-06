package tn.astba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.astba.domain.*;
import tn.astba.dto.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressService {

    private final EnrollmentService enrollmentService;
    private final TrainingService trainingService;

    /**
     * Get progress for all enrollments of a student.
     */
    public List<StudentProgressResponse> getStudentProgress(String studentId) {
        List<EnrollmentResponse> enrollments = enrollmentService.findByStudentId(studentId);
        List<StudentProgressResponse> result = new ArrayList<>();

        for (EnrollmentResponse er : enrollments) {
            Enrollment enrollment = enrollmentService.getEnrollmentOrThrow(er.getId());
            Training training = trainingService.getTrainingOrThrow(er.getTrainingId());

            result.add(buildProgressResponse(enrollment, training));
        }
        return result;
    }

    /**
     * Get progress for a specific enrollment.
     */
    public StudentProgressResponse getEnrollmentProgress(String enrollmentId) {
        Enrollment enrollment = enrollmentService.getEnrollmentOrThrow(enrollmentId);
        Training training = trainingService.getTrainingOrThrow(enrollment.getTrainingId());
        return buildProgressResponse(enrollment, training);
    }

    private StudentProgressResponse buildProgressResponse(Enrollment enrollment, Training training) {
        List<MissedSessionInfo> missedSessions = new ArrayList<>();
        Map<String, AttendanceEntry> attendance = enrollment.getAttendance();

        for (Level level : training.getLevels()) {
            for (Session session : level.getSessions()) {
                AttendanceEntry entry = attendance != null ? attendance.get(session.getSessionId()) : null;
                if (entry == null || entry.getStatus() == AttendanceStatus.ABSENT) {
                    missedSessions.add(MissedSessionInfo.builder()
                            .sessionId(session.getSessionId())
                            .levelNumber(level.getLevelNumber())
                            .sessionNumber(session.getSessionNumber())
                            .sessionTitle(session.getTitle())
                            .status(entry != null ? entry.getStatus().name() : "NON_MARQUÉ")
                            .build());
                }
            }
        }

        return StudentProgressResponse.builder()
                .enrollmentId(enrollment.getId())
                .trainingId(enrollment.getTrainingId())
                .trainingTitle(training.getTitle())
                .progressSnapshot(enrollment.getProgressSnapshot())
                .missedSessions(missedSessions)
                .build();
    }
}
