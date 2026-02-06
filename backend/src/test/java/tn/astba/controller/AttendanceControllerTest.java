package tn.astba.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import tn.astba.dto.AttendanceMarkResponse;
import tn.astba.dto.SessionAttendanceInfo;
import tn.astba.security.JwtService;
import tn.astba.service.AttendanceService;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AttendanceController.class)
@WithMockUser(roles = "ADMIN")
class AttendanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AttendanceService attendanceService;

    @MockBean
    private JwtService jwtService;

    @Test
    @DisplayName("POST /api/attendance/mark with valid body returns 200")
    void testMarkAttendance() throws Exception {
        AttendanceMarkResponse response = AttendanceMarkResponse.builder()
                .updatedCount(2)
                .missingEnrollmentsCount(0)
                .missingStudentIds(List.of())
                .progressUpdated(true)
                .message("2 présence(s) marquée(s)")
                .build();

        when(attendanceService.markAttendance(any())).thenReturn(response);

        mockMvc.perform(post("/api/attendance/mark")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "trainingId": "t1",
                                    "sessionId": "sess-1",
                                    "records": [
                                        {"studentId": "s1", "status": "PRESENT"},
                                        {"studentId": "s2", "status": "ABSENT"}
                                    ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatedCount").value(2))
                .andExpect(jsonPath("$.progressUpdated").value(true));
    }

    @Test
    @DisplayName("POST /api/attendance/mark with empty records returns 400")
    void testMarkAttendanceEmptyRecords() throws Exception {
        mockMvc.perform(post("/api/attendance/mark")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "trainingId": "t1",
                                    "sessionId": "sess-1",
                                    "records": []
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
