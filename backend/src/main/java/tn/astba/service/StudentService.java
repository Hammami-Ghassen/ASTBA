package tn.astba.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import tn.astba.domain.Student;
import tn.astba.dto.StudentCreateRequest;
import tn.astba.dto.StudentResponse;
import tn.astba.dto.StudentUpdateRequest;
import tn.astba.exception.BadRequestException;
import tn.astba.exception.ConflictException;
import tn.astba.exception.ResourceNotFoundException;
import tn.astba.repository.StudentRepository;

import java.time.LocalDate;
import java.time.Period;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;

    public Page<StudentResponse> findAll(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("lastName", "firstName"));
        Page<Student> students;
        if (query != null && !query.isBlank()) {
            students = studentRepository.searchByQuery(query.trim(), pageable);
        } else {
            students = studentRepository.findAll(pageable);
        }
        return students.map(this::toResponse);
    }

    public StudentResponse findById(String id) {
        return toResponse(getStudentOrThrow(id));
    }

    public StudentResponse create(StudentCreateRequest request) {
        validateAge(request.getBirthDate());
        checkEmailUniqueness(request.getEmail(), null);
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            checkPhoneUniqueness(request.getPhone(), null);
        }

        Student student = Student.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .birthDate(request.getBirthDate())
                .phone(request.getPhone())
                .email(request.getEmail())
                .imageUrl(request.getImageUrl())
                .notes(request.getNotes())
                .build();
        Student saved = studentRepository.save(student);
        log.debug("Étudiant créé: id={}", saved.getId());
        return toResponse(saved);
    }

    public StudentResponse update(String id, StudentUpdateRequest request) {
        Student student = getStudentOrThrow(id);

        if (request.getFirstName() != null) student.setFirstName(request.getFirstName().trim());
        if (request.getLastName() != null) student.setLastName(request.getLastName().trim());
        if (request.getBirthDate() != null) {
            validateAge(request.getBirthDate());
            student.setBirthDate(request.getBirthDate());
        }
        if (request.getPhone() != null) {
            if (!request.getPhone().isBlank()) {
                checkPhoneUniqueness(request.getPhone(), id);
            }
            student.setPhone(request.getPhone());
        }
        if (request.getEmail() != null) {
            checkEmailUniqueness(request.getEmail(), id);
            student.setEmail(request.getEmail());
        }
        if (request.getImageUrl() != null) student.setImageUrl(request.getImageUrl());
        if (request.getNotes() != null) student.setNotes(request.getNotes());

        Student saved = studentRepository.save(student);
        log.debug("Étudiant mis à jour: id={}", saved.getId());
        return toResponse(saved);
    }

    public void delete(String id) {
        if (!studentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Étudiant", "id", id);
        }
        studentRepository.deleteById(id);
        log.debug("Étudiant supprimé: id={}", id);
    }

    // ── Validation helpers ──────────────────────────────────────

    private void validateAge(LocalDate birthDate) {
        if (birthDate == null) return;
        int age = Period.between(birthDate, LocalDate.now()).getYears();
        if (age < 10 || age > 29) {
            throw new BadRequestException("L'élève doit avoir entre 10 et 29 ans");
        }
    }

    private void checkEmailUniqueness(String email, String excludeId) {
        if (email == null || email.isBlank()) return;
        studentRepository.findByEmail(email).ifPresent(existing -> {
            if (excludeId == null || !existing.getId().equals(excludeId)) {
                throw new ConflictException("Un élève avec l'email '" + email + "' existe déjà");
            }
        });
    }

    private void checkPhoneUniqueness(String phone, String excludeId) {
        if (phone == null || phone.isBlank()) return;
        studentRepository.findByPhone(phone).ifPresent(existing -> {
            if (excludeId == null || !existing.getId().equals(excludeId)) {
                throw new ConflictException("Un élève avec le numéro '" + phone + "' existe déjà");
            }
        });
    }

    // ── Helpers ──────────────────────────────────────────────────

    public Student getStudentOrThrow(String id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Étudiant", "id", id));
    }

    public StudentResponse toResponse(Student s) {
        return StudentResponse.builder()
                .id(s.getId())
                .firstName(s.getFirstName())
                .lastName(s.getLastName())
                .birthDate(s.getBirthDate())
                .phone(s.getPhone())
                .email(s.getEmail())
                .imageUrl(s.getImageUrl())
                .notes(s.getNotes())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
