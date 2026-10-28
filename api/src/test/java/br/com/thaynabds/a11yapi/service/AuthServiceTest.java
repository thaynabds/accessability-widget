package br.com.thaynabds.a11yapi.service;

import br.com.thaynabds.a11yapi.dto.AuthRequest;
import br.com.thaynabds.a11yapi.model.User;
import br.com.thaynabds.a11yapi.repository.UserRepository;
import br.com.thaynabds.a11yapi.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock AuthenticationManager authenticationManager;

    @InjectMocks AuthService authService;

    @Test
    void register_shouldReturnToken_whenEmailIsNew() {
        when(userRepository.existsByEmail("test@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken("test@test.com")).thenReturn("jwt-token");

        var result = authService.register(new AuthRequest("test@test.com", "password123"));

        assertThat(result.token()).isEqualTo("jwt-token");
        assertThat(result.email()).isEqualTo("test@test.com");
        verify(userRepository).save(argThat(u -> "hashed".equals(u.getPassword())));
    }

    @Test
    void register_shouldThrow_whenEmailAlreadyExists() {
        when(userRepository.existsByEmail("exists@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(new AuthRequest("exists@test.com", "password123")))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("already registered");
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_shouldReturnToken_onValidCredentials() {
        when(jwtService.generateToken("user@test.com")).thenReturn("jwt-token");

        var result = authService.login(new AuthRequest("user@test.com", "password123"));

        assertThat(result.token()).isEqualTo("jwt-token");
        verify(authenticationManager).authenticate(any());
    }
}
