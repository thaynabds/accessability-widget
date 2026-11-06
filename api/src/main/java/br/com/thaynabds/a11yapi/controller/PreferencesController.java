package br.com.thaynabds.a11yapi.controller;

import jakarta.validation.Valid;

import br.com.thaynabds.a11yapi.dto.PreferencesDto;
import br.com.thaynabds.a11yapi.service.PreferencesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preferences")
@Tag(name = "Preferences", description = "Save and retrieve accessibility preferences")
@SecurityRequirement(name = "bearerAuth")
public class PreferencesController {

    private final PreferencesService preferencesService;

    public PreferencesController(PreferencesService preferencesService) {
        this.preferencesService = preferencesService;
    }

    @GetMapping
    @Operation(summary = "Get preferences for the authenticated user")
    public ResponseEntity<PreferencesDto> get(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(preferencesService.getByEmail(user.getUsername()));
    }

    @PutMapping
    @Operation(summary = "Save preferences for the authenticated user")
    public ResponseEntity<PreferencesDto> save(
        @AuthenticationPrincipal UserDetails user,
        @RequestBody @Valid PreferencesDto dto
    ) {
        return ResponseEntity.ok(preferencesService.save(user.getUsername(), dto));
    }
}
