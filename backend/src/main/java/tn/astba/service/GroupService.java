package tn.astba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.astba.domain.*;
import tn.astba.dto.*;
import tn.astba.exception.ResourceNotFoundException;
import tn.astba.repository.EnrollmentRepository;
import tn.astba.repository.GroupRepository;
import tn.astba.repository.UserRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final TrainingService trainingService;
    private final StudentService studentService;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public List<GroupResponse> findAll() {
        return groupRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<GroupResponse> findByTrainingId(String trainingId) {
        trainingService.getTrainingOrThrow(trainingId);
        return groupRepository.findByTrainingId(trainingId).stream().map(this::toResponse).toList();
    }

    public GroupResponse findById(String id) {
        return toResponse(getGroupOrThrow(id));
    }

    public GroupResponse create(GroupCreateRequest request) {
        trainingService.getTrainingOrThrow(request.getTrainingId());

        Group group = Group.builder()
                .name(request.getName().trim())
                .trainingId(request.getTrainingId())
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .studentIds(request.getStudentIds() != null ? request.getStudentIds() : new ArrayList<>())
                .trainerId(request.getTrainerId())
                .build();

        Group saved = groupRepository.save(group);
        log.debug("Groupe créé: id={}, name={}", saved.getId(), saved.getName());

        // Auto-enroll all initial students in the group's training
        if (saved.getStudentIds() != null) {
            for (String sid : saved.getStudentIds()) {
                autoEnroll(sid, saved.getTrainingId(), saved.getId());
            }
        }

        return toResponse(saved);
    }

    public GroupResponse update(String id, GroupUpdateRequest request) {
        Group group = getGroupOrThrow(id);

        if (request.getName() != null) group.setName(request.getName().trim());
        if (request.getDayOfWeek() != null) group.setDayOfWeek(request.getDayOfWeek());
        if (request.getStartTime() != null) group.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) group.setEndTime(request.getEndTime());
        List<String> oldStudentIds = new ArrayList<>(group.getStudentIds() != null ? group.getStudentIds() : List.of());
        if (request.getStudentIds() != null) group.setStudentIds(request.getStudentIds());
        if (request.getTrainerId() != null) group.setTrainerId(request.getTrainerId());

        Group saved = groupRepository.save(group);
        log.debug("Groupe mis à jour: id={}", saved.getId());

        // Auto-enroll any newly added students in the group's training
        if (request.getStudentIds() != null) {
            for (String sid : request.getStudentIds()) {
                if (!oldStudentIds.contains(sid)) {
                    autoEnroll(sid, saved.getTrainingId(), saved.getId());
                }
            }
        }

        return toResponse(saved);
    }

    public GroupResponse addStudent(String groupId, String studentId) {
        Group group = getGroupOrThrow(groupId);
        studentService.getStudentOrThrow(studentId);

        if (!group.getStudentIds().contains(studentId)) {
            group.getStudentIds().add(studentId);
            groupRepository.save(group);
        }
        // Auto-enroll the student in the group's training
        autoEnroll(studentId, group.getTrainingId(), group.getId());
        return toResponse(group);
    }

    public GroupResponse removeStudent(String groupId, String studentId) {
        Group group = getGroupOrThrow(groupId);
        group.getStudentIds().remove(studentId);
        groupRepository.save(group);
        return toResponse(group);
    }

    public void delete(String id) {
        if (!groupRepository.existsById(id)) {
            throw new ResourceNotFoundException("Groupe", "id", id);
        }
        groupRepository.deleteById(id);
        log.debug("Groupe supprimé: id={}", id);
    }

    public Group getGroupOrThrow(String id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe", "id", id));
    }

    /**
     * Auto-enroll a student in a training if not already enrolled.
     * Creates an Enrollment with the given groupId and computes the initial progress.
     */
    private void autoEnroll(String studentId, String trainingId, String groupId) {
        if (enrollmentRepository.existsByStudentIdAndTrainingId(studentId, trainingId)) {
            log.debug("Étudiant {} déjà inscrit à la formation {}, auto-inscription ignorée", studentId, trainingId);
            return;
        }
        Training training = trainingService.getTrainingOrThrow(trainingId);
        Enrollment enrollment = Enrollment.builder()
                .studentId(studentId)
                .trainingId(trainingId)
                .groupId(groupId)
                .enrolledAt(Instant.now())
                .attendance(new HashMap<>())
                .build();
        enrollment.setProgressSnapshot(ProgressCalculator.compute(enrollment, training));
        enrollmentRepository.save(enrollment);
        log.debug("Auto-inscription: étudiant {} → formation {} (groupe {})", studentId, trainingId, groupId);
    }

    private GroupResponse toResponse(Group g) {
        GroupResponse.GroupResponseBuilder builder = GroupResponse.builder()
                .id(g.getId())
                .name(g.getName())
                .trainingId(g.getTrainingId())
                .dayOfWeek(g.getDayOfWeek())
                .startTime(g.getStartTime())
                .endTime(g.getEndTime())
                .studentIds(g.getStudentIds())
                .studentCount(g.getStudentIds() != null ? g.getStudentIds().size() : 0)
                .trainerId(g.getTrainerId())
                .createdAt(g.getCreatedAt())
                .updatedAt(g.getUpdatedAt());

        // Enrich with training title
        try {
            builder.trainingTitle(trainingService.getTrainingOrThrow(g.getTrainingId()).getTitle());
        } catch (ResourceNotFoundException ignored) {}

        // Enrich with trainer name
        if (g.getTrainerId() != null) {
            try {
                userRepository.findById(g.getTrainerId()).ifPresent(u ->
                        builder.trainerName(u.getFirstName() + " " + u.getLastName()));
            } catch (Exception ignored) {}
        }

        // Enrich with student details
        if (g.getStudentIds() != null && !g.getStudentIds().isEmpty()) {
            List<StudentResponse> students = new ArrayList<>();
            for (String sid : g.getStudentIds()) {
                try {
                    students.add(studentService.toResponse(studentService.getStudentOrThrow(sid)));
                } catch (ResourceNotFoundException ignored) {}
            }
            builder.students(students);
        }

        return builder.build();
    }
}
