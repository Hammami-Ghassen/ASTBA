package tn.astba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.astba.dto.AttendanceMarkRequest;
import tn.astba.dto.AttendanceMarkResponse;
import tn.astba.dto.SessionAttendanceInfo;
import tn.astba.service.AttendanceService;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Tag(name = "Présences", description = "Marquage et consultation des présences")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/mark")
    @Operation(summary = "Marquer la présence", description = "Marque la présence de plusieurs élèves pour une séance donnée")
    @PreAuthorize("hasAnyRole('TRAINER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<AttendanceMarkResponse> markAttendance(@Valid @RequestBody AttendanceMarkRequest request) {
        return ResponseEntity.ok(attendanceService.markAttendance(request));
    }

    @GetMapping("/session/{sessionId}")
    @Operation(summary = "Statuts d'une séance", description = "Liste des statuts de présence pour une séance")
    public ResponseEntity<List<SessionAttendanceInfo>> getSessionAttendance(
            @PathVariable String sessionId,
            @RequestParam String trainingId) {
        return ResponseEntity.ok(attendanceService.getSessionAttendance(trainingId, sessionId));
    }
}
