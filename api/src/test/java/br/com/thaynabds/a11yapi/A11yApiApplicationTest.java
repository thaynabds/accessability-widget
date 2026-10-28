package br.com.thaynabds.a11yapi;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

// Garante que o contexto completo sobe (pega, por exemplo, dependências circulares entre beans).
@SpringBootTest
class A11yApiApplicationTest {

    @Test
    void contextLoads() {
    }
}
