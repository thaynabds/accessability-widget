package br.com.thaynabds.a11yapi.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {

    // Segredo que ficava fixo no application.properties (público no repositório)
    private static final String OLD_PUBLIC_SECRET =
        "0aQ3r8zX1mL5pK9wE2yN7vB4tG6uD0aQ3r8zX1mL5pK9wE2yN7vB4tG6uD00a";

    @Test
    void withoutSecret_tokenForgedWithOldPublicKeyIsRejected() {
        var service = new JwtService("", 60_000);
        String forged = Jwts.builder()
            .subject("vitima@exemplo.com")
            .expiration(new Date(System.currentTimeMillis() + 60_000))
            .signWith(Keys.hmacShaKeyFor(OLD_PUBLIC_SECRET.getBytes(StandardCharsets.UTF_8)))
            .compact();

        assertThat(service.isTokenValid(forged)).isFalse();
    }

    @Test
    void withoutSecret_ownTokensWorkButEachStartupHasADifferentKey() {
        var first = new JwtService("", 60_000);
        var second = new JwtService(null, 60_000);
        String token = first.generateToken("user@exemplo.com");

        assertThat(first.isTokenValid(token)).isTrue();
        assertThat(first.extractEmail(token)).isEqualTo("user@exemplo.com");
        assertThat(second.isTokenValid(token)).isFalse();
    }

    @Test
    void shortSecret_isRefused() {
        assertThatThrownBy(() -> new JwtService("curto-demais", 60_000))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("32");
    }

    @Test
    void configuredSecret_isStableAcrossInstances() {
        String secret = "um-segredo-de-teste-com-mais-de-32-bytes!";
        String token = new JwtService(secret, 60_000).generateToken("user@exemplo.com");

        assertThat(new JwtService(secret, 60_000).isTokenValid(token)).isTrue();
    }

    @Test
    void expiredToken_isRejected() {
        var service = new JwtService("", -1_000);
        assertThat(service.isTokenValid(service.generateToken("user@exemplo.com"))).isFalse();
    }

    @Test
    void tamperedToken_isRejected() {
        var service = new JwtService("", 60_000);
        String token = service.generateToken("user@exemplo.com");
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("A") ? "BB" : "AA");

        assertThat(service.isTokenValid(tampered)).isFalse();
    }
}
