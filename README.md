# ♿ a11y-widget

Widget de acessibilidade universal para web. Adicione ao seu site com **uma linha de código**.

[![npm](https://img.shields.io/npm/v/@thaynabds/a11y-widget)](https://www.npmjs.com/package/@thaynabds/a11y-widget)
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

Três formas: tag `<script>` (qualquer site), pacote npm (projetos com bundler) ou componente React.

### 1. Tag `<script>` (CDN)

Cole antes do `</body>`:

```html
<script src="https://cdn.jsdelivr.net/gh/thaynabds/a11y-widget@2.1.0/src/a11y-widget.js"></script>
```

Use a URL com versão (`@2.1.0`): ela nunca muda e o jsDelivr a entrega na hora. Com `@latest` o CDN pode servir uma versão antiga em cache por até 7 dias depois de uma atualização.

O botão aparece no canto inferior direito. Clique (ou toque, no celular) para abrir o painel; arraste para mudar a posição, que fica salva. Atalho de teclado: `Alt+A`; `Esc` fecha.

### 2. npm

```bash
npm install @thaynabds/a11y-widget
```

```js
import { init } from '@thaynabds/a11y-widget';

init(); // monta o widget na página
```

Pelo npm o widget **não** monta sozinho: chame `init()` (ou use o componente React). Importar o pacote no servidor (SSR) é seguro; as funções não fazem nada sem `window`. Tipos TypeScript incluídos.

### 3. React

```jsx
import { A11yWidget, useA11yWidget } from '@thaynabds/a11y-widget/react';

export default function App() {
  return (
    <>
      {/* Renderize uma vez, perto da raiz. Some ao desmontar. */}
      <A11yWidget onChange={(prefs) => console.log(prefs)} />
      <Conteudo />
    </>
  );
}

function BotaoModoEscuro() {
  const { prefs, applyPrefs, open } = useA11yWidget();
  if (!prefs) return null; // null na primeira renderização e no servidor
  return (
    <>
      <button onClick={() => applyPrefs({ darkMode: !prefs.darkMode })}>
        Modo escuro: {prefs.darkMode ? 'ligado' : 'desligado'}
      </button>
      <button onClick={open}>Mais opções de acessibilidade</button>
    </>
  );
}
```

- `<A11yWidget prefs={...} onChange={fn} />`: `prefs` aplica preferências (reaplicadas só quando o conteúdo muda); `onChange` recebe cada mudança.
- `useA11yWidget()` devolve `{ prefs, applyPrefs, reset, open, close, speak }` e atualiza o componente a cada mudança.
- Funciona com React 16.8+, StrictMode e Next.js (App Router: o módulo já tem `'use client'`).

---

## Funcionalidades (v2.1.0)

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
| 17 | 📏 Guia de leitura | Overlay com faixa transparente seguindo o mouse (em telas de toque não há cursor para seguir) | Dislexia, TDAH |
| 18 | 🔊 Ler texto (TTS) | Web Speech API `SpeechSynthesisUtterance` — lê o texto selecionado na página | Cegueira, baixa visão |
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

// Montar / remover o widget (remove também os efeitos na página)
window.A11yWidget.init();
window.A11yWidget.destroy();

// Acompanhar mudanças; a função retornada cancela
const parar = window.A11yWidget.subscribe((prefs) => console.log(prefs));
```

Pelo npm, as mesmas funções existem como exports nomeados: `init`, `destroy`, `isMounted`, `getPrefs`, `applyPrefs`, `reset`, `open`, `close`, `speak`, `subscribe`.

A API pode ser chamada a qualquer momento, inclusive antes de a página terminar de carregar. Valores inválidos em `applyPrefs` (chaves desconhecidas, tipos errados, `fontSize` fora de -2 a 4, filtro de daltonismo inexistente) são ignorados.

---

## Backend (opcional)

A pasta `api/` contém uma API REST em **Spring Boot 3.3** com **Spring Security + JWT** para sincronizar preferências entre dispositivos após login.

Stack: Java 21, Spring Boot 3.3, Spring Data JPA, H2, JJWT 0.12.6, BCrypt, OpenAPI/Swagger.

Rodar localmente:

```bash
cd api && ./mvnw spring-boot:run
```

Swagger em `http://localhost:8080/swagger-ui.html`. Testes: `./mvnw test`.

Variáveis de ambiente:
- `JWT_SECRET` — chave de assinatura dos tokens, com pelo menos 32 bytes. Sem ela a API gera uma chave aleatória a cada inicialização (bom para testar localmente; os tokens deixam de valer quando ela reinicia). Não há chave fixa no código.
- `CORS_ORIGINS` — origens autorizadas, separadas por vírgula (padrão inclui `https://thaynabds.github.io` e `localhost:5500`).
- `PORT` — porta HTTP (padrão `8080`).

Deploy gratuito: [Render](https://render.com) → **New > Blueprint** → selecione este repositório. O `render.yaml` da raiz constrói o `api/Dockerfile` e gera o `JWT_SECRET` automaticamente.

Endpoints:
- `POST /api/auth/register` — cadastro
- `POST /api/auth/login` — retorna JWT
- `GET  /api/preferences` — lê preferências (requer JWT)
- `PUT  /api/preferences` — salva preferências (requer JWT; `fontSize` de -2 a 4 e `colorBlind` entre `none`, `protanopia`, `deuteranopia`, `tritanopia`, `monochromia`)

---

## Deploy gratuito (widget)

1. Repositório público: [`thaynabds/a11y-widget`](https://github.com/thaynabds/a11y-widget).
2. Settings > Pages > Source: **GitHub Actions**.
3. Push na `main` — o workflow `.github/workflows/pages.yml` publica a demo em `https://thaynabds.github.io/a11y-widget/demo/` (a raiz redireciona para ela).
4. Para uma nova versão do widget, atualize `version` em `package.json`, `index.js` e `src/a11y-widget.js`, crie a tag (`git tag v2.1.1 && git push origin v2.1.1`) e atualize a URL `@2.1.1` no README e na demo.
5. Publicar no npm: `npm login` e depois `npm publish` (o `package.json` já publica como pacote público e só envia os arquivos do widget, sem `api/` nem testes). O jsDelivr serve cada tag em `cdn.jsdelivr.net/gh/thaynabds/a11y-widget@<versão>/src/a11y-widget.js`.

## Testes

- Pacote, núcleo e React (Node + jsdom): `npm install && npm test`.
- Widget no navegador: abra `tests/widget.test.html` num servidor local (ex.: `python3 -m http.server 5500` na raiz e acesse `http://localhost:5500/tests/widget.test.html`), de preferência com emulação de celular no DevTools para incluir os testes de toque. A página mostra `WIDGET_TESTS_OK` quando tudo passa.
- API: `cd api && ./mvnw test`.

---

## Stack

- Vanilla JavaScript ES2015+ (zero dependências de runtime)
- Integração React opcional (`@thaynabds/a11y-widget/react`, peer dependency `react >= 16.8`)
- CSS3 com `filter` e SVG `feColorMatrix`
- Web Speech API (TTS)
- MutationObserver (vídeos dinâmicos)

---

## Licença

MIT
