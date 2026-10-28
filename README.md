# ♿ a11y-widget

Widget de acessibilidade universal para web. Adicione ao seu site com **uma linha de código**.

[![jsDelivr CDN](https://img.shields.io/badge/CDN-jsDelivr-orange)](https://www.jsdelivr.com/package/gh/thaynabds/a11y-widget)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://thaynabds.github.io/a11y-widget/demo/)
[![WCAG 2.2](https://img.shields.io/badge/WCAG-2.2%20AA-green)](https://www.w3.org/WAI/WCAG22/quickref/)
[![LBI](https://img.shields.io/badge/LBI-13.146%2F2015-blue)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm)

---

## Demo ao vivo

**[thaynabds.github.io/a11y-widget/demo](https://thaynabds.github.io/a11y-widget/demo/)**

---

## Instalação

Cole antes do `</body>`:

```html
<script src="https://cdn.jsdelivr.net/gh/thaynabds/a11y-widget@latest/src/a11y-widget.js"></script>
```

O botão aparece no canto inferior direito e pode ser arrastado para outra posição (a posição é lembrada). Atalho de teclado: `Alt+A`.

---

## Funcionalidades (v2.0)

| # | Recurso | Implementação técnica | Beneficiários |
|---|---|---|---|
| 1 | 🌙 Modo escuro | `filter: invert(1) hue-rotate(180deg)` com exceção para `img/video` (combinável com os demais filtros) | Fotofobia, fadiga ocular |
| 2 | 🔄 Inverter cores | `filter: invert(1)` puro | Alto contraste básico |
| 3 | 🔆 Alto contraste | `filter: contrast(2.4)` | Baixa visão |
| 4 | 🌈 Aumentar saturação | `filter: saturate(3) contrast(1.1)` | Baixa acuidade de cores |
| 5 | 🖼 Ocultar imagens | `visibility: hidden` em `img` e `[role=img]` | Cognitivo, distração |
| 6 | 🎨 Filtros daltonismo | SVG `feColorMatrix` (protanopia, deuteranopia, tritanopia) + `grayscale(1)` para monocromia | Daltonismo |
| 7 | 🔤 Tamanho do texto | `font-size` de 80% a 140% em passos de 10% | Baixa visão, idosos |
| 8 | 📖 Fonte dislexia | OpenDyslexic via jsDelivr | Dislexia |
| 9 | ↕ Altura de linha | `line-height: 2.2` | Dislexia, TDAH |
| 10 | ↔ Espaçamento | `letter-spacing: .14em`, `word-spacing: .2em` | Dislexia |
| 11 | 🔗 Destacar links | Fundo amarelo + sublinhado visível em todos os `<a>` | Baixa visão, cognitivo |
| 12 | 📑 Destacar títulos | Borda lateral em `h1–h6` | Escaneamento de conteúdo |
| 13 | ⏸ Pausar animações | `animation-play-state: paused` + `transition-duration: 0ms` | Epilepsia, TDAH, vertigem |
| 14 | 🎬 Pausar vídeos | `.pause()` em todos os `<video>` + `MutationObserver` | Epilepsia, concentração |
| 15 | 🖱 Cursor grande | SVG cursor inline via `cursor: url(...)` | Tremor, baixa visão motora |
| 16 | 🎯 Foco de teclado | `outline: 3px solid #ffcc00` em `:focus` | Navegação por teclado |
| 17 | 📏 Guia de leitura | Overlay com faixa transparente seguindo o mouse | Dislexia, TDAH |
| 18 | 🔊 Ler texto (TTS) | Web Speech API `SpeechSynthesisUtterance` | Cegueira, baixa visão |
| 19 | 💾 Persistência | `localStorage` — sem servidor obrigatório | Todos |

---

## Conformidade

- **WCAG 2.2** (W3C) — Critérios de Sucesso AA atendidos pelas funcionalidades de contraste, texto e navegação.
- **LBI — Lei Brasileira de Inclusão 13.146/2015** — Amplia o acesso digital conforme Art. 63.

> Importante: widgets de sobreposição complementam mas não substituem a estruturação nativa acessível do HTML (semântica, ARIA, alt text). Referência: [UsableNet Overlay Report](https://usablenet.com).

---

## API JavaScript

```js
// Ler preferências salvas
const prefs = window.A11yWidget.getPrefs();

// Aplicar preferências (ex: carregar do backend após login)
window.A11yWidget.applyPrefs({ darkMode: true, fontSize: 2 });

// Falar texto programaticamente
window.A11yWidget.speak('Bem-vindo!');

// Controlar o painel
window.A11yWidget.open();
window.A11yWidget.close();

// Resetar tudo
window.A11yWidget.reset();
```

---

## Backend (opcional)

A pasta `api/` contém uma API REST em **Spring Boot 3.3** com **Spring Security + JWT** para sincronizar preferências entre dispositivos após login.

Stack: Java 21, Spring Boot 3.3, Spring Data JPA, H2, JJWT 0.12.6, BCrypt, OpenAPI/Swagger.

Rodar localmente:

```bash
cd api && ./mvnw spring-boot:run
```

Swagger em `http://localhost:8080/swagger-ui.html`. Testes: `./mvnw test`.

Deploy gratuito: [Render](https://render.com) via Blueprint — o arquivo `render.yaml` na raiz constrói o `api/Dockerfile`. Defina `JWT_SECRET` (gerado automaticamente pelo Blueprint) e `CORS_ORIGINS`.

Endpoints:
- `POST /api/auth/register` — cadastro
- `POST /api/auth/login` — retorna JWT
- `GET  /api/preferences` — lê preferências (requer JWT)
- `PUT  /api/preferences` — salva preferências (requer JWT)

---

## Deploy gratuito (widget)

1. Repositório público: [`thaynabds/a11y-widget`](https://github.com/thaynabds/a11y-widget).
2. Settings > Pages > Source: **GitHub Actions**.
3. Push na `main` — o workflow `.github/workflows/pages.yml` publica a demo em `https://thaynabds.github.io/a11y-widget/demo/` (a raiz redireciona para ela).
4. jsDelivr serve o script em: `cdn.jsdelivr.net/gh/thaynabds/a11y-widget@latest/src/a11y-widget.js`

---

## Stack

- Vanilla JavaScript ES2015+ (zero dependências de runtime)
- CSS3 com `filter`, `clip-path`, SVG `feColorMatrix`
- Web Speech API (TTS)
- MutationObserver (vídeos dinâmicos)

---

## Licença

MIT
