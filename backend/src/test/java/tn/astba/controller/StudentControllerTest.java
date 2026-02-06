package tn.astba.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import tn.astba.dto.StudentResponse;
import tn.astba.security.JwtService;
import tn.astba.service.StudentService;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StudentController.class)
@WithMockUser(roles = "ADMIN")
class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StudentService studentService;

    @MockBean
    private JwtService jwtService;

    @Test
    @DisplayName("GET /api/students returns paginated list")
    void testFindAll() throws Exception {
        StudentResponse student = StudentResponse.builder()
                .id("s1")
                .firstName("Ahmed")
                .lastName("Ben Ali")
                .createdAt(Instant.now())
                .build();

        Page<StudentResponse> page = new PageImpl<>(List.of(student));
        when(studentService.findAll(any(), eq(0), eq(20))).thenReturn(page);

        mockMvc.perform(get("/api/students")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].firstName").value("Ahmed"))
                .andExpect(jsonPath("$.content[0].lastName").value("Ben Ali"));
    }

    @Test
    @DisplayName("GET /api/students/{id} returns student")
    void testFindById() throws Exception {
        StudentResponse student = StudentResponse.builder()
                .id("s1")
                .firstName("Ahmed")
                .lastName("Ben Ali")
                .build();

        when(studentService.findById("s1")).thenReturn(student);

        mockMvc.perform(get("/api/students/s1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Ahmed"));
    }

    @Test
    @DisplayName("POST /api/students with valid body returns 201")
    void testCreate() throws Exception {
        StudentResponse created = StudentResponse.builder()
                .id("s1")
                .firstName("Ahmed")
                .lastName("Ben Ali")
                .createdAt(Instant.now())
                .build();

        when(studentService.create(any())).thenReturn(created);

        mockMvc.perform(post("/api/students")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "firstName": "Ahmed",
                                    "lastName": "Ben Ali"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("s1"))
                .andExpect(jsonPath("$.firstName").value("Ahmed"));
    }

    @Test
    @DisplayName("POST /api/students with missing firstName returns 400")
    void testCreateValidationError() throws Exception {
        mockMvc.perform(post("/api/students")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "lastName": "Ben Ali"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.firstName").exists());
    }

    @Test
    @DisplayName("POST /api/students with invalid email returns 400")
    void testCreateInvalidEmail() throws Exception {
        mockMvc.perform(post("/api/students")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "firstName": "Ahmed",
                                    "lastName": "Ben Ali",
                                    "email": "not-an-email"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists());
    }
}
