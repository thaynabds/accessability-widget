package br.com.thaynabds.a11yapi.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class PreferencesDtoValidationTest {

    static Validator validator;

    @BeforeAll
    static void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    private static PreferencesDto prefs(int fontSize, String colorBlind) {
        return new PreferencesDto(true, false, fontSize, false, colorBlind, false, false, false);
    }

    @Test
    void validValues_areAccepted() {
        assertThat(validator.validate(prefs(-2, "none"))).isEmpty();
        assertThat(validator.validate(prefs(4, "monochromia"))).isEmpty();
        assertThat(validator.validate(prefs(0, null))).isEmpty();
    }

    @Test
    void fontSizeOutOfRange_isRejected() {
        assertThat(validator.validate(prefs(5, "none"))).isNotEmpty();
        assertThat(validator.validate(prefs(-3, "none"))).isNotEmpty();
        assertThat(validator.validate(prefs(Integer.MAX_VALUE, "none"))).isNotEmpty();
    }

    @Test
    void unknownColorBlindMode_isRejected() {
        assertThat(validator.validate(prefs(0, "url(javascript:alert(1))"))).isNotEmpty();
        assertThat(validator.validate(prefs(0, "x".repeat(10_000)))).isNotEmpty();
    }
}
