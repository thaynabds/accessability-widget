package br.com.thaynabds.a11yapi.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

// Limites iguais aos do widget: fontSize de -2 a +4 e filtros de daltonismo conhecidos.
public record PreferencesDto(
    boolean darkMode,
    boolean highContrast,
    @Min(-2) @Max(4) int fontSize,
    boolean dyslexicFont,
    @Pattern(regexp = "none|protanopia|deuteranopia|tritanopia|monochromia") String colorBlind,
    boolean pauseAnimations,
    boolean textSpacing,
    boolean bigCursor
) {}
