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
import tn.astba.exception.ResourceNotFoundException;
import tn.astba.repository.StudentRepository;

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
        Student student = Student.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .birthDate(request.getBirthDate())
                .phone(request.getPhone())
                .email(request.getEmail())
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
        if (request.getBirthDate() != null) student.setBirthDate(request.getBirthDate());
        if (request.getPhone() != null) student.setPhone(request.getPhone());
        if (request.getEmail() != null) student.setEmail(request.getEmail());
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
                .notes(s.getNotes())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
