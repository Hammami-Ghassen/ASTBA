package tn.astba.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.astba.dto.*;
import tn.astba.service.AuthService;

@Tag(name = "Admin – Utilisateurs", description = "Gestion des utilisateurs (ADMIN)")
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUsersController {

    private final AuthService authService;

    @Operation(summary = "Liste paginée des utilisateurs")
    @GetMapping
    public ResponseEntity<Page<UserResponse>> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(authService.listUsers(q, page, size));
    }

    @Operation(summary = "Modifier les rôles d'un utilisateur")
    @PatchMapping("/{userId}/roles")
    public ResponseEntity<UserResponse> updateRoles(
            @PathVariable String userId,
            @Valid @RequestBody UpdateRolesRequest request) {
        return ResponseEntity.ok(authService.updateRoles(userId, request.getRoles()));
    }

    @Operation(summary = "Modifier le statut d'un utilisateur")
    @PatchMapping("/{userId}/status")
    public ResponseEntity<UserResponse> updateStatus(
            @PathVariable String userId,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(authService.updateStatus(userId, request.getStatus()));
    }

    @Operation(summary = "Créer un utilisateur (admin)")
    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody AdminCreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.adminCreateUser(request));
    }
}
