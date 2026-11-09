/*!
 * AccessAbility Widget — Widget de Acessibilidade Universal
 * Autor: Thayná Batista da Silva — github.com/thaynabds
 * Versão: 2.2.0
 * Licença: MIT
 *
 * Embed (uma linha):
 * <script src="https://cdn.jsdelivr.net/gh/thaynabds/accessability-widget@2.2.0/src/accessability-widget.js"></script>
 *
 * Conformidade: WCAG 2.2 / LBI (Lei Brasileira de Inclusão 13.146/2015)
 */
(function () {
  'use strict';

  // Importado no servidor (SSR do Next.js, testes em Node): não há DOM, não faz nada.
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  // Carregado duas vezes (ex.: CDN + npm): mantém a primeira instância.
  if (window.A11yWidget && window.A11yWidget.__core) return;

  // ─── Constantes ────────────────────────────────────────────────────────────
  const STORAGE_KEY  = 'a11y-widget-v2';
  const WIDGET_ID    = 'a11y-widget-root';
  const STYLE_ID     = 'a11y-widget-styles';
  const GUIDE_ID     = 'a11y-reading-guide';
  const DYSLEXIC_URL = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.woff2';

  const defaults = {
    /* Visual */
    darkMode:         false,
    invertColors:     false,
    highContrast:     false,
    saturationBoost:  false,
    theme:            'default', // default, light, dark ou família com sufixo _light (ver THEMES)
    colorBlind:       'none',    // none | smart_invert | protanopia | deuteranopia | tritanopia | monochromia
    /* Tipografia */
    fontSize:         0,         // -2 a +4 (passos de 10%)
    dyslexicFont:     false,
    lineHeight:       false,
    textSpacing:      false,
    /* Conteúdo */
    highlightLinks:   false,
    highlightHeadings:false,
    hideImages:       false,
    /* Motor / movimento */
    pauseAnimations:  false,
    pauseVideos:      false,
    bigCursor:        false,
    focusVisible:     false,
    /* Leitura */
    readingGuide:     false,
    /* Áudio */
    tts:              false,     // lê texto selecionado ao pressionar o botão
  };

  const COLOR_BLIND_MODES = ['none', 'smart_invert', 'protanopia', 'deuteranopia', 'tritanopia', 'monochromia'];

  // Paletas do Congo Grey Parrot. accent e onAccent vêm dos temas do app Android.
  const THEMES = {
    light:         { bg: '#f4f7f5', surface: '#ffffff', text: '#1c2420', accent: '#1b6b45', onAccent: '#ffffff', border: '#d5e4dc' },
    dark:          { bg: '#121816', surface: '#1b2621', text: '#eef5f1', accent: '#8fd4b4', onAccent: '#052117', border: '#2a3b34' },
    high_contrast: { bg: '#000000', surface: '#000000', text: '#ffffff', accent: '#ffff00', onAccent: '#000000', border: '#ffff00' },
    kuro:          { bg: '#100e16', surface: '#1c1730', text: '#f4eefe', accent: '#b794f6', onAccent: '#1a1030', border: '#3a2d58' },
    pink_void:     { bg: '#160e12', surface: '#2a1520', text: '#fbeff4', accent: '#e56aa3', onAccent: '#2a1020', border: '#5a3048' },
    red_void:      { bg: '#160e0e', surface: '#2a1515', text: '#fbeeee', accent: '#e26464', onAccent: '#2a1010', border: '#5a3030' },
    yellow_void:   { bg: '#14120c', surface: '#262014', text: '#fbf6e8', accent: '#e6c200', onAccent: '#1a1404', border: '#5a4c28' },
    green_void:    { bg: '#0c140e', surface: '#142a1a', text: '#eefbf1', accent: '#5fd08a', onAccent: '#04210f', border: '#2c5a3a' },
    blue_void:     { bg: '#0c1016', surface: '#14202f', text: '#eef4fb', accent: '#6aa8e5', onAccent: '#0c1b2a', border: '#2f4a66' },
    high_contrast_light: { bg: '#ffffff', surface: '#ffffff', text: '#000000', accent: '#0000ff', onAccent: '#ffffff', border: '#0000ff' },
    kuro_light:          { bg: '#f5f1fd', surface: '#ffffff', text: '#1f1833', accent: '#5534a8', onAccent: '#ffffff', border: '#d9cdf0' },
    pink_void_light:     { bg: '#fdf1f6', surface: '#ffffff', text: '#2f1420', accent: '#9a2864', onAccent: '#ffffff', border: '#f0cfde' },
    red_void_light:      { bg: '#fdf1f1', surface: '#ffffff', text: '#2f1414', accent: '#8e2424', onAccent: '#ffffff', border: '#f0cfcf' },
    yellow_void_light:   { bg: '#fdf8e6', surface: '#ffffff', text: '#2b2408', accent: '#6b5600', onAccent: '#ffffff', border: '#ecdfae' },
    green_void_light:    { bg: '#effaf1', surface: '#ffffff', text: '#12291a', accent: '#1a6b35', onAccent: '#ffffff', border: '#c6e8d0' },
    blue_void_light:     { bg: '#eff5fd', surface: '#ffffff', text: '#12203a', accent: '#1f55a8', onAccent: '#ffffff', border: '#c8d9f2' },
  };
  const THEME_NAMES = ['default'].concat(Object.keys(THEMES));

  // Aceita só chaves conhecidas, com o tipo certo e dentro dos limites.
  // Protege contra localStorage adulterado e contra applyPrefs com dados
  // arbitrários (ex.: chave "__proto__", fontSize enorme, filtro inexistente).
  function sanitizePrefs(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    Object.keys(defaults).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(raw, key)) return;
      const v = raw[key];
      if (key === 'colorBlind') {
        if (COLOR_BLIND_MODES.indexOf(v) !== -1) out[key] = v;
      } else if (key === 'theme') {
        if (THEME_NAMES.indexOf(v) !== -1) out[key] = v;
      } else if (key === 'fontSize') {
        if (typeof v === 'number' && isFinite(v)) out[key] = clamp(Math.round(v), -2, 4);
      } else if (typeof v === 'boolean') {
        out[key] = v;
      }
    });
    return out;
  }

  let prefs = Object.assign({}, defaults, sanitizePrefs(loadPrefs()));
  let speechActive = false;
  let ttsSession = null;
  let lastSelection = '';

  // ─── Persistência ──────────────────────────────────────────────────────────
  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function savePrefs() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); }
    catch (_) {}
    notifyChange();
  }

  // ─── Assinantes de mudança (usado pelo hook React) ─────────────────────────
  const subscribers = [];
  function notifyChange() {
    const snapshot = Object.assign({}, prefs);
    subscribers.slice().forEach(fn => { try { fn(snapshot); } catch (_) {} });
  }

  // ─── Listeners globais (removidos em destroy) ──────────────────────────────
  let globalListeners = [];
  let videoObserver = null;
  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    globalListeners.push([target, type, fn, opts]);
  }

  // ─── CSS base ──────────────────────────────────────────────────────────────
  const BASE_CSS = `
    @font-face {
      font-family: 'OpenDyslexic';
      src: url('${DYSLEXIC_URL}') format('woff2');
      font-display: swap;
    }

    :root {
      --aw-primary:      #1A4A8A;
      --aw-primary-dark: #0f2d5c;
      --aw-bg:           #ffffff;
      --aw-text:         #1a1a2e;
      --aw-border:       #dde4f0;
      --aw-hover:        #e8f0fe;
      --aw-active:       #1A4A8A;
      --aw-active-text:  #ffffff;
      --aw-shadow:       rgba(0,0,0,.18);
      --aw-radius:       10px;
      --aw-z:            2147483647;
      --aw-panel-w:      318px;
    }

    /* ── Botão flutuante ── */
    #a11y-btn {
      position: fixed; bottom: 24px; right: 24px;
      z-index: var(--aw-z);
      width: 54px; height: 54px; border-radius: 50%;
      background: var(--aw-primary); color: var(--aw-active-text);
      font-size: 28px; line-height: 1;
      border: none; cursor: grab;
      box-shadow: 0 4px 20px var(--aw-shadow);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s, box-shadow .2s;
      outline: none;
      touch-action: none;
    }
    #a11y-btn:active { cursor: grabbing; }
    #a11y-btn:focus-visible { outline: 3px solid #ffcc00; outline-offset: 3px; }
    #a11y-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px var(--aw-shadow); }
    #a11y-btn[aria-expanded="true"] { background: var(--aw-primary-dark); }
    #a11y-btn span { pointer-events: none; }

    /* ── Painel ── */
    #a11y-panel {
      position: fixed; bottom: 90px; right: 24px;
      z-index: var(--aw-z);
      width: var(--aw-panel-w); max-width: calc(100vw - 16px);
      background: var(--aw-bg); color: var(--aw-text);
      border: 1.5px solid var(--aw-border);
      border-radius: var(--aw-radius);
      box-shadow: 0 8px 48px var(--aw-shadow);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13.5px; line-height: 1.4;
      display: none; overflow: hidden;
    }
    #a11y-panel.open {
      display: flex; flex-direction: column;
      animation: aw-in .17s ease;
      max-height: calc(100vh - 120px);
    }
    @keyframes aw-in {
      from { opacity: 0; transform: translateY(10px) scale(.98); }
      to   { opacity: 1; transform: translateY(0)  scale(1); }
    }

    /* ── Header do painel ── */
    .aw-header {
      background: var(--aw-primary); color: var(--aw-active-text);
      padding: 13px 16px; font-weight: 700; font-size: 13px;
      letter-spacing: .4px; display: flex; align-items: center;
      justify-content: space-between; flex-shrink: 0;
    }
    .aw-header-title { display: flex; align-items: center; gap: 8px; }
    .aw-close-btn {
      background: rgba(255,255,255,.15); border: none; color: var(--aw-active-text);
      width: 26px; height: 26px; border-radius: 50%;
      cursor: pointer; font-size: 16px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .aw-close-btn:hover { background: rgba(255,255,255,.3); }

    /* ── Corpo scrollável ── */
    .aw-body { padding: 8px 12px 14px; overflow-y: auto; flex: 1; }
    .aw-body::-webkit-scrollbar { width: 4px; }
    .aw-body::-webkit-scrollbar-thumb { background: var(--aw-border); border-radius: 4px; }

    /* ── Seção ── */
    .aw-section-label {
      font-size: 10px; font-weight: 700; letter-spacing: 1.3px;
      text-transform: uppercase; color: #8896a6;
      margin: 10px 0 5px 4px;
    }

    /* ── Linha de toggle ── */
    .aw-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 7px 10px; border-radius: 7px; cursor: pointer;
      transition: background .12s; gap: 8px; user-select: none;
    }
    .aw-row:hover { background: var(--aw-hover); }
    .aw-row.active { background: var(--aw-active); color: var(--aw-active-text); }
    .aw-row-label { display: flex; align-items: center; gap: 9px; font-weight: 500; flex: 1; min-width: 0; }
    .aw-ico { width: 20px; text-align: center; flex-shrink: 0; font-size: .95rem; }

    /* ── Toggle switch ── */
    .aw-toggle { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
    .aw-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .aw-toggle-track {
      position: absolute; inset: 0;
      background: #c8d3e0; border-radius: 20px; transition: background .18s;
    }
    .aw-toggle input:checked + .aw-toggle-track { background: #22c55e; }
    .aw-row.active .aw-toggle-track { background: rgba(255,255,255,.3); }
    .aw-toggle-thumb {
      position: absolute; top: 2px; left: 2px;
      width: 16px; height: 16px; background: #fff; border-radius: 50%;
      transition: left .18s; box-shadow: 0 1px 4px rgba(0,0,0,.25);
    }
    .aw-toggle input:checked ~ .aw-toggle-thumb { left: 18px; }

    /* ── Linha de fonte ── */
    .aw-font-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 10px; gap: 6px;
    }
    .aw-font-label { display: flex; align-items: center; gap: 9px; font-weight: 500; }
    .aw-font-controls { display: flex; align-items: center; gap: 4px; }
    .aw-icon-btn {
      width: 28px; height: 28px;
      border: 1.5px solid var(--aw-border); background: var(--aw-bg);
      color: var(--aw-text); border-radius: 6px; cursor: pointer;
      font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      transition: background .12s;
    }
    .aw-icon-btn:hover { background: var(--aw-hover); }
    .aw-font-pct { min-width: 36px; text-align: center; font-size: 12px; font-weight: 700; color: var(--aw-primary); }

    /* ── Chips daltonismo ── */
    .aw-chips { display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0 2px; padding: 0 4px; }
    .aw-chip {
      padding: 4px 10px; border-radius: 20px;
      border: 1.5px solid var(--aw-border); font-size: 11px; font-weight: 600;
      cursor: pointer; background: var(--aw-bg); color: var(--aw-text);
      transition: background .12s, color .12s; user-select: none;
    }
    .aw-chip:hover { background: var(--aw-hover); }
    .aw-chip.active { background: var(--aw-active); color: var(--aw-active-text); border-color: var(--aw-active); }

    /* ── Botão TTS ── */
    .aw-tts-btn {
      width: 100%; padding: 8px 10px; margin-top: 2px;
      background: var(--aw-hover); border: 1.5px solid var(--aw-border);
      border-radius: 7px; color: var(--aw-text); font-size: 13px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      transition: background .12s;
    }
    .aw-tts-btn:hover { background: var(--aw-border); }
    .aw-tts-btn.speaking { background: #fff3cd; border-color: #d69e2e; color: #7b5c00; }
    .aw-tts-status { margin: 6px 0 0; font-size: 12px; line-height: 1.4; color: var(--aw-text); }

    /* ── Botão reset ── */
    #aw-reset {
      width: 100%; margin-top: 10px; padding: 8px 10px;
      background: transparent; border: 1.5px solid #fce8e8;
      border-radius: 7px; color: #c53030; font-size: 12px; font-weight: 700;
      cursor: pointer; transition: background .12s; letter-spacing: .3px;
    }
    #aw-reset:hover { background: #fff5f5; }

    /* ── Divisor ── */
    .aw-divider { height: 1px; background: var(--aw-border); margin: 6px 0; }

    /* ═══════════════════════════════════════════
       EFEITOS APLICADOS NA PÁGINA
    ═══════════════════════════════════════════ */

    /* Filtros de cor do body (modo escuro, inversão, contraste, saturação,
       daltonismo) são combinados em applyFilters(), para poderem coexistir. */

    /* Dark mode — preserva imagens/vídeos */
    body.aw-dark-mode img,
    body.aw-dark-mode video,
    body.aw-dark-mode iframe,
    body.aw-dark-mode canvas,
    body.aw-dark-mode svg:not(.aw-svg-filter) {
      filter: invert(1) hue-rotate(180deg) !important;
    }

    /* Inversão inteligente — inverte a interface e mantém fotos e vídeos */
    body.aw-smart-invert img,
    body.aw-smart-invert video,
    body.aw-smart-invert iframe,
    body.aw-smart-invert canvas,
    body.aw-smart-invert svg { filter: invert(1) !important; }
    body.aw-dark-mode.aw-smart-invert img,
    body.aw-dark-mode.aw-smart-invert video,
    body.aw-dark-mode.aw-smart-invert iframe,
    body.aw-dark-mode.aw-smart-invert canvas,
    body.aw-dark-mode.aw-smart-invert svg { filter: hue-rotate(180deg) !important; }

    html.aw-themed #aw-reset { color: var(--aw-text); }
    html.aw-themed #aw-reset:hover { background: var(--aw-hover); }

    /* Temas — :where mantém a especificidade baixa para os destaques vencerem */
    html.aw-themed, html.aw-themed body { background: var(--aw-page-bg) !important; color: var(--aw-text) !important; }
    body.aw-themed :where(*:not(img, video, canvas, svg, svg *, picture, iframe, [role="img"])) {
      background-color: transparent !important;
      background-image: none !important;
      color: var(--aw-text) !important;
      border-color: var(--aw-border) !important;
      text-shadow: none !important;
    }
    body.aw-themed a, body.aw-themed a:visited { color: var(--aw-accent) !important; }
    body.aw-themed button, body.aw-themed input, body.aw-themed select, body.aw-themed textarea,
    body.aw-themed pre, body.aw-themed code, body.aw-themed [role="button"] {
      background-color: var(--aw-surface) !important;
    }

    /* Fonte dislexia */
    body.aw-dyslexic *,
    body.aw-dyslexic input,
    body.aw-dyslexic textarea,
    body.aw-dyslexic button,
    body.aw-dyslexic select {
      font-family: 'OpenDyslexic', sans-serif !important;
    }

    /* Altura de linha */
    body.aw-line-height * { line-height: 2.2 !important; }

    /* Espaçamento de texto */
    body.aw-text-spacing * {
      letter-spacing: .14em !important;
      word-spacing: .2em !important;
    }

    /* Pausar animações */
    body.aw-pause-anim *,
    body.aw-pause-anim *::before,
    body.aw-pause-anim *::after {
      animation-play-state: paused !important;
      transition-duration: 0ms !important;
    }

    /* Cursor grande */
    body.aw-big-cursor,
    body.aw-big-cursor *,
    #a11y-widget-root.aw-big-cursor * {
      cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Cpath d='M8 4l20 14-9 2-5 10z' fill='%23000' stroke='%23fff' stroke-width='2'/%3E%3C/svg%3E") 6 4, auto !important;
    }

    /* Foco sempre visível */
    body.aw-focus-visible *:focus,
    #a11y-widget-root.aw-focus-visible *:focus {
      outline: 3px solid #ffcc00 !important;
      outline-offset: 3px !important;
      border-radius: 3px !important;
    }

    /* Destacar links */
    body.aw-highlight-links a,
    body.aw-highlight-links a:visited {
      background-color: #fff3cd !important;
      color: #005fa3 !important;
      text-decoration: underline 2px #005fa3 !important;
      text-underline-offset: 3px !important;
      padding: 1px 3px !important;
      border-radius: 3px !important;
    }

    /* Destacar títulos */
    body.aw-highlight-headings h1,
    body.aw-highlight-headings h2,
    body.aw-highlight-headings h3,
    body.aw-highlight-headings h4,
    body.aw-highlight-headings h5,
    body.aw-highlight-headings h6 {
      border-left: 4px solid #1A4A8A !important;
      padding-left: 10px !important;
      background-color: #e8f0fe !important;
      border-radius: 0 4px 4px 0 !important;
    }

    body.aw-themed.aw-highlight-headings h1,
    body.aw-themed.aw-highlight-headings h2,
    body.aw-themed.aw-highlight-headings h3,
    body.aw-themed.aw-highlight-headings h4,
    body.aw-themed.aw-highlight-headings h5,
    body.aw-themed.aw-highlight-headings h6 {
      background-color: var(--aw-surface) !important;
      border-left-color: var(--aw-accent) !important;
    }

    /* Ocultar imagens */
    body.aw-hide-images img,
    body.aw-hide-images [role="img"],
    body.aw-hide-images picture { visibility: hidden !important; }

    /* Filtros de daltonismo (SVG) */
    .aw-svg-filter { position: absolute; width: 0; height: 0; overflow: hidden; }

    /* Guia de leitura */
    #a11y-reading-guide {
      position: fixed; left: 0; right: 0;
      pointer-events: none; z-index: calc(var(--aw-z) - 1);
      display: none;
    }
    #a11y-reading-guide.active { display: block; }
    #a11y-reading-guide .rg-mask-top,
    #a11y-reading-guide .rg-mask-bottom {
      position: fixed; left: 0; right: 0;
      background: rgba(0,0,0,.55);
    }
    #a11y-reading-guide .rg-line {
      position: fixed; left: 0; right: 0;
      height: 36px;
      border-top: 2px solid rgba(255,220,0,.7);
      border-bottom: 2px solid rgba(255,220,0,.7);
      background: rgba(255,255,200,.08);
    }
  `;

  // Protanopia, deuteranopia e tritanopia: Daltonizer do Android, modo Correction.
  // https://android.googlesource.com/platform/frameworks/native/+/refs/heads/master/services/surfaceflinger/Effects/Daltonizer.cpp
  // Monocromia: luminância da Rec. ITU-R BT.709.
  const COLOR_FILTERS_SVG = `
    <svg class="aw-svg-filter" aria-hidden="true" focusable="false"
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="aw-f-protanopia" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix"
            values="0.46111 0.53889 0 0 0
                    0.37754 0.62246 0 0 0
                    0.30974 -0.30974 1 0 0
                    0 0 0 1 0"/>
        </filter>
        <filter id="aw-f-deuteranopia" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix"
            values="-0.01672 1.01672 0 0 0
                    0.07530 0.92470 0 0 0
                    -0.36845 0.36845 1 0 0
                    0 0 0 1 0"/>
        </filter>
        <filter id="aw-f-tritanopia" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix"
            values="1 -1.15102 1.15102 0 0
                    0 0.11263 0.88737 0 0
                    0 0.14975 0.85025 0 0
                    0 0 0 1 0"/>
        </filter>
        <filter id="aw-f-monochromia" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix"
            values="0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0 0 0 1 0"/>
        </filter>
      </defs>
    </svg>
  `;

  // ─── HTML do painel ────────────────────────────────────────────────────────
  function panelHTML() {
    return `
      <button id="a11y-btn"
        aria-expanded="false" aria-haspopup="dialog"
        aria-label="Abrir central de acessibilidade"
        title="Acessibilidade (Alt+A)">
        <span aria-hidden="true">♿&#xFE0E;</span>
      </button>

      <div id="a11y-panel" role="dialog"
           aria-label="Central de acessibilidade" aria-modal="false">

        <div class="aw-header">
          <span class="aw-header-title">
            <span aria-hidden="true">♿</span> Central de acessibilidade
          </span>
          <button class="aw-close-btn" id="aw-close" aria-label="Fechar painel">✕</button>
        </div>

        <div class="aw-body">

          <!-- TEMAS -->
          <div class="aw-section-label">Tema</div>
          <div class="aw-chips" id="aw-chips-theme" role="radiogroup" aria-label="Tema">
            ${[['default','Original'],['base','Padrão'],['high_contrast','Alto contraste'],['kuro','Kuro'],
               ['pink_void','PinkVoid'],['red_void','RedVoid'],['yellow_void','YellowVoid'],
               ['green_void','GreenVoid'],['blue_void','BlueVoid']]
              .map(([id, name]) => `<span class="aw-chip" role="radio" tabindex="0" data-family="${id}">${name}</span>`).join('')}
          </div>
          <div class="aw-section-label">Perfil do tema</div>
          <div class="aw-chips" id="aw-chips-profile" role="radiogroup" aria-label="Perfil do tema">
            <span class="aw-chip" role="radio" tabindex="0" data-profile="light">Claro</span>
            <span class="aw-chip" role="radio" tabindex="0" data-profile="dark">Escuro</span>
          </div>

          <!-- VISUAL -->
          <div class="aw-section-label">Visão</div>

          ${row('aw-sat',      '🌈', 'Aumentar saturação')}
          ${row('aw-images',   '🖼',  'Ocultar imagens')}

          <!-- FILTROS DE COR -->
          <div class="aw-section-label">Filtros de cor</div>
          <div class="aw-chips" id="aw-chips-cb" role="radiogroup" aria-label="Filtro de cor">
            <span class="aw-chip" role="radio" tabindex="0" data-cb="none">Nenhum</span>
            <span class="aw-chip" role="radio" tabindex="0" data-cb="invert">Inverter</span>
            <span class="aw-chip" role="radio" tabindex="0" data-cb="smart_invert">Inversão inteligente</span>
            <span class="aw-chip" role="radio" tabindex="0" data-cb="protanopia">Protanopia</span>
            <span class="aw-chip" role="radio" tabindex="0" data-cb="deuteranopia">Deuteranopia</span>
            <span class="aw-chip" role="radio" tabindex="0" data-cb="tritanopia">Tritanopia</span>
            <span class="aw-chip" role="radio" tabindex="0" data-cb="monochromia">Monocromia</span>
          </div>

          <div class="aw-divider"></div>

          <!-- TIPOGRAFIA -->
          <div class="aw-section-label">Tipografia</div>

          <div class="aw-font-row">
            <span class="aw-font-label">
              <span class="aw-ico" aria-hidden="true">🔤</span>
              <span>Tamanho do texto</span>
            </span>
            <div class="aw-font-controls">
              <button class="aw-icon-btn" id="aw-font-dec" aria-label="Diminuir texto">A−</button>
              <span class="aw-font-pct" id="aw-font-pct" aria-live="polite">100%</span>
              <button class="aw-icon-btn" id="aw-font-inc" aria-label="Aumentar texto">A+</button>
            </div>
          </div>

          ${row('aw-dyslexic', '📖', 'Fonte dislexia (OpenDyslexic)')}
          ${row('aw-lheight',  '↕',  'Aumentar altura de linha')}
          ${row('aw-spacing',  '↔',  'Espaçamento de texto')}

          <div class="aw-divider"></div>

          <!-- CONTEÚDO -->
          <div class="aw-section-label">Conteúdo</div>

          ${row('aw-links',    '🔗', 'Destacar links')}
          ${row('aw-headings', '📑', 'Destacar títulos')}

          <div class="aw-divider"></div>

          <!-- MOTOR / MOVIMENTO -->
          <div class="aw-section-label">Motor / Movimento</div>

          ${row('aw-anim',    '⏸',  'Pausar animações CSS')}
          ${row('aw-videos',  '🎬', 'Pausar vídeos')}
          ${row('aw-cursor',  '🖱',  'Cursor grande')}
          ${row('aw-focus',   '🎯', 'Destacar foco do teclado')}
          ${row('aw-guide',   '📏', 'Guia de leitura')}

          <div class="aw-divider"></div>

          <!-- ÁUDIO -->
          <div class="aw-section-label">Áudio</div>

          <button class="aw-tts-btn" id="aw-tts-btn"
            aria-label="Ler texto selecionado em voz alta">
            <span aria-hidden="true">🔊</span>
            <span id="aw-tts-label">Ler texto selecionado</span>
          </button>
          <p class="aw-tts-status" id="aw-tts-status" role="status"></p>

          <button id="aw-reset" aria-label="Restaurar todas as configurações padrão">
            ↺ Restaurar padrões
          </button>

        </div>
      </div>

      <!-- Guia de leitura -->
      <div id="${GUIDE_ID}" aria-hidden="true">
        <div class="rg-mask-top"></div>
        <div class="rg-line"></div>
        <div class="rg-mask-bottom"></div>
      </div>

      ${COLOR_FILTERS_SVG}
    `;
  }

  function row(id, ico, label) {
    return `
      <div class="aw-row" id="${id}" role="button" tabindex="0" aria-pressed="false">
        <span class="aw-row-label">
          <span class="aw-ico" aria-hidden="true">${ico}</span>
          <span>${label}</span>
        </span>
        <label class="aw-toggle" aria-hidden="true">
          <input type="checkbox" id="${id}-chk" tabindex="-1">
          <span class="aw-toggle-track"></span>
          <span class="aw-toggle-thumb"></span>
        </label>
      </div>`;
  }

  // ─── Aplicação dos efeitos ─────────────────────────────────────────────────
  const CLASS_MAP = {
    darkMode:          'aw-dark-mode',
    invertColors:      'aw-invert',
    highContrast:      'aw-high-contrast',
    saturationBoost:   'aw-saturation',
    dyslexicFont:      'aw-dyslexic',
    lineHeight:        'aw-line-height',
    textSpacing:       'aw-text-spacing',
    highlightLinks:    'aw-highlight-links',
    highlightHeadings: 'aw-highlight-headings',
    hideImages:        'aw-hide-images',
    pauseAnimations:   'aw-pause-anim',
    bigCursor:         'aw-big-cursor',
    focusVisible:      'aw-focus-visible',
  };

  function applyAll() {
    const b = document.body;
    Object.entries(CLASS_MAP).forEach(([key, cls]) =>
      b.classList.toggle(cls, !!prefs[key])
    );
    // O widget fica fora do body; cursor e foco também valem dentro do painel
    const root = document.getElementById(WIDGET_ID);
    if (root) {
      root.classList.toggle('aw-big-cursor', !!prefs.bigCursor);
      root.classList.toggle('aw-focus-visible', !!prefs.focusVisible);
    }
    b.classList.toggle('aw-smart-invert', prefs.colorBlind === 'smart_invert');
    applyTheme();
    applyFilters();
    applyFontSize();
    applyVideos();
    applyReadingGuide();
  }

  // Os valores vêm só de THEMES; prefs.theme já passou pela lista permitida.
  const THEME_VARS = {
    '--aw-page-bg': 'bg', '--aw-surface': 'surface', '--aw-accent': 'accent',
    '--aw-primary': 'accent', '--aw-primary-dark': 'accent', '--aw-active': 'accent',
    '--aw-active-text': 'onAccent', '--aw-bg': 'surface', '--aw-text': 'text',
    '--aw-border': 'border', '--aw-hover': 'bg',
  };

  // O nome salvo junta família e perfil: kuro (escuro), kuro_light (claro).
  function themeParts(theme) {
    if (theme === 'default') return { family: 'default', profile: null };
    if (theme === 'light' || theme === 'dark') return { family: 'base', profile: theme };
    if (theme.endsWith('_light')) return { family: theme.slice(0, -6), profile: 'light' };
    return { family: theme, profile: 'dark' };
  }

  function themeName(family, profile) {
    if (family === 'default') return 'default';
    if (family === 'base') return profile;
    return profile === 'light' ? family + '_light' : family;
  }

  function activeThemeName() {
    if (prefs.theme !== 'default') return prefs.theme;
    return prefs.highContrast ? 'high_contrast' : prefs.darkMode ? 'dark' : 'default';
  }

  function chooseTheme(family, profile) {
    const current = themeParts(activeThemeName());
    const nextFamily = family || (current.family === 'default' ? 'base' : current.family);
    const nextProfile = profile || current.profile || (nextFamily === 'base' ? 'light' : 'dark');
    prefs.theme = themeName(nextFamily, nextProfile);
    prefs.darkMode = false;
    prefs.highContrast = false;
  }

  function clearTheme() {
    const html = document.documentElement;
    Object.keys(THEME_VARS).forEach(name => html.style.removeProperty(name));
    html.classList.remove('aw-themed');
    if (document.body) document.body.classList.remove('aw-themed');
  }

  function applyTheme() {
    const theme = prefs.theme === 'default' ? null : THEMES[prefs.theme];
    clearTheme();
    if (!theme) return;
    const html = document.documentElement;
    Object.entries(THEME_VARS).forEach(([name, field]) => html.style.setProperty(name, theme[field]));
    html.classList.add('aw-themed');
    document.body.classList.add('aw-themed');
  }

  const CB_FILTERS = {
    protanopia:   "url('#aw-f-protanopia')",
    deuteranopia: "url('#aw-f-deuteranopia')",
    tritanopia:   "url('#aw-f-tritanopia')",
    monochromia:  "url('#aw-f-monochromia')",
    smart_invert: 'invert(1)',
  };

  // Combina todos os filtros ativos num único `filter` no body. O widget fica
  // fora do body (ver injectHTML), então não é afetado nem perde o position: fixed.
  function applyFilters() {
    const f = [];
    if (prefs.darkMode)        f.push('invert(1) hue-rotate(180deg)');
    if (prefs.invertColors)    f.push('invert(1)');
    if (prefs.highContrast)    f.push('contrast(2.4)');
    if (prefs.saturationBoost) f.push('saturate(3) contrast(1.1)');
    if (CB_FILTERS[prefs.colorBlind]) f.push(CB_FILTERS[prefs.colorBlind]);
    if (f.length) document.body.style.setProperty('filter', f.join(' '), 'important');
    else document.body.style.removeProperty('filter');
  }

  function applyFontSize() {
    document.documentElement.style.fontSize =
      prefs.fontSize === 0 ? '' : (100 + prefs.fontSize * 10) + '%';
  }

  function applyVideos() {
    document.querySelectorAll('video').forEach(v => {
      if (prefs.pauseVideos) {
        if (!v.paused || v.autoplay) v.dataset.awPaused = '1';
        v.pause(); v.autoplay = false;
      } else if (v.dataset.awPaused) {
        // Retoma apenas os vídeos que o widget pausou
        delete v.dataset.awPaused;
        v.autoplay = true;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      }
    });
  }

  function applyReadingGuide() {
    const guide = document.getElementById(GUIDE_ID);
    if (!guide) return;
    guide.classList.toggle('active', prefs.readingGuide);
  }

  // ─── Sincroniza a UI com prefs ─────────────────────────────────────────────
  const ROW_KEY_MAP = {
    'aw-sat':      'saturationBoost',
    'aw-images':   'hideImages',
    'aw-dyslexic': 'dyslexicFont',
    'aw-lheight':  'lineHeight',
    'aw-spacing':  'textSpacing',
    'aw-links':    'highlightLinks',
    'aw-headings': 'highlightHeadings',
    'aw-anim':     'pauseAnimations',
    'aw-videos':   'pauseVideos',
    'aw-cursor':   'bigCursor',
    'aw-focus':    'focusVisible',
    'aw-guide':    'readingGuide',
  };

  function syncUI() {
    Object.entries(ROW_KEY_MAP).forEach(([rowId, prefKey]) => {
      const row = document.getElementById(rowId);
      const chk = document.getElementById(rowId + '-chk');
      const val = !!prefs[prefKey];
      if (row) { row.classList.toggle('active', val); row.setAttribute('aria-pressed', String(val)); }
      if (chk)   chk.checked = val;
    });

    const active = themeParts(activeThemeName());
    const activeFilter = prefs.invertColors ? 'invert' : prefs.colorBlind;
    document.querySelectorAll('.aw-chip').forEach(chip => {
      const on = chip.dataset.family ? chip.dataset.family === active.family
        : chip.dataset.profile ? chip.dataset.profile === active.profile
        : chip.dataset.cb === activeFilter;
      chip.classList.toggle('active', on);
      chip.setAttribute('aria-checked', String(on));
    });

    const pctEl = document.getElementById('aw-font-pct');
    if (pctEl) pctEl.textContent = (100 + prefs.fontSize * 10) + '%';
  }

  // ─── Guia de leitura (segue o mouse) ──────────────────────────────────────
  function initReadingGuide() {
    const guide   = document.getElementById(GUIDE_ID);
    const maskTop = guide.querySelector('.rg-mask-top');
    const line    = guide.querySelector('.rg-line');
    const maskBot = guide.querySelector('.rg-mask-bottom');
    const H = 36;

    on(document, 'mousemove', function (e) {
      if (!prefs.readingGuide) return;
      const y = e.clientY - H / 2;
      maskTop.style.cssText = `top:0; height:${Math.max(0, y)}px`;
      line.style.cssText    = `top:${y}px; height:${H}px`;
      maskBot.style.cssText = `top:${y + H}px; bottom:0; height:auto`;
    });
  }

  // ─── Text-to-Speech ────────────────────────────────────────────────────────
  const TTS_CHUNK_MAX   = 180;   // o Chrome corta falas longas; o Android recusa textos grandes
  const TTS_START_LIMIT = 6000;  // sem motor de voz, alguns navegadores nunca respondem
  const TTS_NO_VOICE    = 'Não foi possível ler: este navegador ou sistema não tem voz disponível. Instale uma voz ou tente outro navegador.';

  function setTtsStatus(message) {
    const status = document.getElementById('aw-tts-status');
    if (status) status.textContent = message;
  }

  function splitForSpeech(text) {
    const chunks = [];
    let rest = text.replace(/\s+/g, ' ').trim();
    while (rest.length > TTS_CHUNK_MAX) {
      const head = rest.slice(0, TTS_CHUNK_MAX);
      let cut = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? ')) + 1;
      if (cut < TTS_CHUNK_MAX / 2) cut = head.lastIndexOf(' ');
      if (cut <= 0) cut = TTS_CHUNK_MAX;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) chunks.push(rest);
    return chunks;
  }

  function pickVoice(lang) {
    const wanted = lang.toLowerCase().replace('_', '-');
    const base = wanted.split('-')[0];
    const normalized = (voice) => voice.lang.toLowerCase().replace('_', '-');
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => normalized(v) === wanted)
      || voices.find(v => normalized(v).split('-')[0] === base)
      || null;
  }

  function finishSpeech(message) {
    if (ttsSession) clearTimeout(ttsSession.watchdog);
    ttsSession = null;
    speechActive = false;
    updateTtsBtn();
    setTtsStatus(message || '');
  }

  function stopSpeech() {
    finishSpeech();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function speakNextChunk(session) {
    if (session !== ttsSession) return;
    if (session.index >= session.chunks.length) { finishSpeech(); return; }

    const utter = new SpeechSynthesisUtterance(session.chunks[session.index++]);
    utter.lang = session.lang;
    if (session.voice) utter.voice = session.voice;
    session.utter = utter;  // mantém a referência: o Chrome perde os eventos sem ela

    utter.onstart = () => { clearTimeout(session.watchdog); };
    utter.onend = () => { clearTimeout(session.watchdog); speakNextChunk(session); };
    utter.onerror = (event) => {
      if (session !== ttsSession) return;
      if (event.error === 'canceled' || event.error === 'interrupted') { finishSpeech(); return; }
      finishSpeech(event.error === 'not-allowed'
        ? 'O navegador bloqueou a leitura em voz alta nesta página.'
        : TTS_NO_VOICE);
    };

    clearTimeout(session.watchdog);
    session.watchdog = setTimeout(() => {
      if (session !== ttsSession) return;
      finishSpeech(TTS_NO_VOICE);
      window.speechSynthesis.cancel();
    }, TTS_START_LIMIT);
    window.speechSynthesis.speak(utter);
  }

  function speakSelection() {
    if (!('speechSynthesis' in window)) {
      setTtsStatus('Seu navegador não suporta leitura em voz alta.');
      return;
    }
    if (speechActive) { stopSpeech(); return; }

    const text = window.getSelection().toString().trim() || lastSelection;
    if (!text) {
      setTtsStatus('Selecione um texto na página para ler em voz alta.');
      return;
    }

    // Uma fala anterior travada bloquearia a fila inteira.
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const lang = document.documentElement.lang || 'pt-BR';
    ttsSession = { chunks: splitForSpeech(text), index: 0, lang, voice: pickVoice(lang), utter: null, watchdog: null };
    speechActive = true;
    updateTtsBtn();
    setTtsStatus('');
    speakNextChunk(ttsSession);
  }

  // No celular, tocar no botão ou no painel desfaz a seleção antes do clique.
  // Guarda o último trecho selecionado na página e esquece ao tocar fora do widget.
  function bindSelectionMemory() {
    const insideWidget = (node) => {
      const root = document.getElementById(WIDGET_ID);
      return !!(root && node && root.contains(node));
    };
    on(document, 'pointerdown', (event) => {
      if (!insideWidget(event.target)) lastSelection = '';
    }, true);
    on(document, 'selectionchange', () => {
      const selection = window.getSelection();
      if (!selection || insideWidget(selection.anchorNode)) return;
      const text = selection.toString().trim();
      if (text) lastSelection = text;
    });
  }

  function updateTtsBtn() {
    const btn   = document.getElementById('aw-tts-btn');
    const label = document.getElementById('aw-tts-label');
    if (!btn) return;
    btn.classList.toggle('speaking', speechActive);
    if (label) label.textContent = speechActive ? 'Parar leitura' : 'Ler texto selecionado';
  }

  // ─── Evento de toggle de linha ────────────────────────────────────────────
  function togglePref(prefKey) {
    prefs[prefKey] = !prefs[prefKey];
    savePrefs();
    applyAll();
    syncUI();
  }

  // ─── Botão arrastável ──────────────────────────────────────────────────────
  const DRAG_KEY = 'a11y-widget-pos';

  function saveBtnPos(bottom, right) {
    try { localStorage.setItem(DRAG_KEY, JSON.stringify({ bottom, right })); }
    catch (_) {}
  }

  function loadBtnPos() {
    try { return JSON.parse(localStorage.getItem(DRAG_KEY) || 'null'); }
    catch (_) { return null; }
  }

  function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

  // Área visível sem a barra de rolagem — é a referência de top/right/bottom
  // em elementos position: fixed (window.innerWidth inclui a barra).
  function viewW() { return document.documentElement.clientWidth  || window.innerWidth; }
  function viewH() { return document.documentElement.clientHeight || window.innerHeight; }

  // Abre o painel acima ou abaixo do botão (onde houver mais espaço),
  // sempre dentro da janela.
  function positionPanel() {
    const btn   = document.getElementById('a11y-btn');
    const panel = document.getElementById('a11y-panel');
    if (!btn || !panel || !panel.classList.contains('open')) return;
    const GAP = 12, M = 8;
    const r = btn.getBoundingClientRect();
    const above = r.top - GAP - M;
    const below = viewH() - r.bottom - GAP - M;
    const right = clamp(viewW() - r.right, M,
                        Math.max(M, viewW() - panel.offsetWidth - M));
    panel.style.left  = 'auto';
    panel.style.right = right + 'px';
    if (above >= below) {
      panel.style.top    = 'auto';
      panel.style.bottom = (viewH() - r.top + GAP) + 'px';
      panel.style.maxHeight = Math.max(160, above) + 'px';
    } else {
      panel.style.bottom = 'auto';
      panel.style.top    = (r.bottom + GAP) + 'px';
      panel.style.maxHeight = Math.max(160, below) + 'px';
    }
  }

  function initDraggable() {
    const btn   = document.getElementById('a11y-btn');
    const panel = document.getElementById('a11y-panel');
    let isDragging = false;
    let moved = false;
    let suppressClick = false;
    let startX, startY, startRight, startBottom;

    // Restaura posição salva (limitada à janela atual)
    const saved = loadBtnPos();
    if (saved && isFinite(saved.bottom) && isFinite(saved.right)) {
      const right  = clamp(saved.right,  8, Math.max(8, viewW()  - btn.offsetWidth  - 8));
      const bottom = clamp(saved.bottom, 8, Math.max(8, viewH() - btn.offsetHeight - 8));
      btn.style.bottom = bottom + 'px';
      btn.style.right  = right  + 'px';
      btn.style.top    = 'auto';
      btn.style.left   = 'auto';
    }

    function getPos(e) {
      return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
                       : { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
      // Ignora cliques nos botões internos do painel
      if (e.target !== btn && !btn.contains(e.target)) return;
      const { x, y } = getPos(e);
      startX = x;
      startY = y;
      const rect = btn.getBoundingClientRect();
      startRight  = viewW()  - rect.right;
      startBottom = viewH() - rect.bottom;
      isDragging = true;
      moved = false;
      btn.style.transition = 'none';
      e.preventDefault();
    }

    function onMove(e) {
      if (!isDragging) return;
      // Durante o arrasto por toque, a página não deve rolar junto
      if (e.touches && e.cancelable) e.preventDefault();
      const { x, y } = getPos(e);
      const dx = x - startX;
      const dy = y - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      if (!moved) return;

      const BW = btn.offsetWidth;
      const BH = btn.offsetHeight;
      const newRight  = clamp(startRight  - dx, 8, viewW()  - BW - 8);
      const newBottom = clamp(startBottom - dy, 8, viewH() - BH - 8);

      btn.style.right  = newRight  + 'px';
      btn.style.bottom = newBottom + 'px';
      btn.style.top    = 'auto';
      btn.style.left   = 'auto';

      // Reposiciona painel junto ao botão
      positionPanel();
    }

    function onEnd(e) {
      if (!isDragging) return;
      isDragging = false;
      btn.style.transition = '';

      if (moved) {
        saveBtnPos(
          parseFloat(btn.style.bottom),
          parseFloat(btn.style.right)
        );
        // Só o mouseup gera um click logo depois; no toque, o preventDefault
        // do touchend já impede. A flag expira caso o click não chegue
        // (ex.: botão solto fora do ícone).
        if (e.type === 'mouseup') {
          suppressClick = true;
          setTimeout(() => { suppressClick = false; }, 400);
        }
        e.preventDefault();
      } else if (e.type === 'touchend') {
        // O preventDefault do touchstart cancela o click sintético do navegador;
        // sem isso, tocar no ícone no celular não abria o painel.
        e.preventDefault();
        btn.click();
      }
      moved = false;
    }

    function onCancel() {
      if (!isDragging) return;
      isDragging = false;
      moved = false;
      btn.style.transition = '';
    }

    btn.addEventListener('mousedown',  onStart, { passive: false });
    btn.addEventListener('touchstart', onStart, { passive: false });
    on(document, 'mousemove',  onMove);
    on(document, 'touchmove',  onMove, { passive: false });
    on(document, 'mouseup',  onEnd);
    on(document, 'touchend', onEnd, { passive: false });
    on(document, 'touchcancel', onCancel);

    // Impede que o click gerado ao soltar o botão abra/feche o painel após arrastar
    btn.addEventListener('click', function (e) {
      if (suppressClick) { suppressClick = false; e.stopImmediatePropagation(); }
    }, true);
  }

  // ─── Atalho de teclado (Alt+A) ────────────────────────────────────────────
  function bindKeyShortcut() {
    on(document, 'keydown', function (e) {
      // e.code funciona com Caps Lock e no macOS (onde Alt+A gera "å")
      if (e.altKey && (e.code === 'KeyA' || e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        document.getElementById('a11y-btn').click();
      }
    });
  }

  // ─── Bind de todos os eventos ─────────────────────────────────────────────
  function bindEvents() {
    const btn   = document.getElementById('a11y-btn');
    const panel = document.getElementById('a11y-panel');
    const close = document.getElementById('aw-close');

    function openPanel()  { panel.classList.add('open');    btn.setAttribute('aria-expanded','true'); positionPanel(); }
    function closePanel() { panel.classList.remove('open'); btn.setAttribute('aria-expanded','false'); btn.focus(); }

    btn.addEventListener('click',   () => panel.classList.contains('open') ? closePanel() : openPanel());
    close.addEventListener('click', closePanel);
    on(window, 'resize', positionPanel);

    on(document, 'keydown', e => {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });

    // Click fora fecha (sem roubar o foco quando o painel já está fechado)
    on(document, 'click', e => {
      if (!panel.classList.contains('open')) return;
      if (!panel.contains(e.target) && !btn.contains(e.target)) {
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    }, true);

    // Linhas de toggle
    Object.entries(ROW_KEY_MAP).forEach(([rowId, prefKey]) => {
      const el = document.getElementById(rowId);
      if (!el) return;
      el.addEventListener('click', () => togglePref(prefKey));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePref(prefKey); }
      });
    });

    // Tamanho da fonte
    document.getElementById('aw-font-inc').addEventListener('click', e => {
      e.stopPropagation();
      if (prefs.fontSize < 4) { prefs.fontSize++; savePrefs(); applyAll(); syncUI(); }
    });
    document.getElementById('aw-font-dec').addEventListener('click', e => {
      e.stopPropagation();
      if (prefs.fontSize > -2) { prefs.fontSize--; savePrefs(); applyAll(); syncUI(); }
    });

    // Chips de tema e de filtro: uma escolha por grupo
    document.querySelectorAll('.aw-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (chip.dataset.family || chip.dataset.profile) {
          chooseTheme(chip.dataset.family, chip.dataset.profile);
        } else {
          prefs.invertColors = chip.dataset.cb === 'invert';
          prefs.colorBlind = prefs.invertColors ? 'none' : chip.dataset.cb;
        }
        savePrefs(); applyAll(); syncUI();
      });
      chip.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chip.click(); }
      });
    });

    // TTS
    document.getElementById('aw-tts-btn').addEventListener('click', speakSelection);
    bindSelectionMemory();

    // Reset
    document.getElementById('aw-reset').addEventListener('click', resetAll);

    // Vídeos novos adicionados ao DOM
    if (window.MutationObserver) {
      videoObserver = new MutationObserver(() => applyVideos());
      videoObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  // ─── Injeção na página ─────────────────────────────────────────────────────
  function injectStyle() {
    const s = document.createElement('style');
    s.id = STYLE_ID; s.textContent = BASE_CSS;
    document.head.appendChild(s);
  }

  function injectHTML() {
    const wrap = document.createElement('div');
    wrap.id = WIDGET_ID;
    wrap.innerHTML = panelHTML();
    // Fica como irmão do <body>: os filtros aplicados ao body não alteram as
    // cores do painel nem transformam o body em containing block do botão fixo.
    document.documentElement.appendChild(wrap);
  }

  // ─── Init ──────────────────────────────────────────────────────────────────
  function init() {
    if (document.getElementById(WIDGET_ID)) return;
    injectStyle();
    injectHTML();
    applyAll();
    syncUI();
    bindEvents();
    initReadingGuide();
    bindKeyShortcut();
    initDraggable();
    console.info('[AccessAbility Widget v2.2.0] pronto. Atalho: Alt+A | Arraste o botão para reposicionar.');
  }

  // Remove o widget e desfaz todos os efeitos na página. As preferências
  // continuam salvas e voltam no próximo init().
  function destroy() {
    globalListeners.forEach(([target, type, fn, opts]) => target.removeEventListener(type, fn, opts));
    globalListeners = [];
    if (videoObserver) { videoObserver.disconnect(); videoObserver = null; }
    stopSpeech();
    lastSelection = '';
    const root = document.getElementById(WIDGET_ID);
    if (root) root.remove();
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
    if (document.body) {
      Object.values(CLASS_MAP).forEach(cls => document.body.classList.remove(cls));
      document.body.style.removeProperty('filter');
    }
    clearTheme();
    if (document.body) document.body.classList.remove('aw-smart-invert');
    document.documentElement.style.fontSize = '';
  }

  // O pacote npm define __A11Y_WIDGET_MANUAL__ para que o app (ou o
  // componente React) decida quando montar. Pela tag <script>, monta sozinho.
  if (!window.__A11Y_WIDGET_MANUAL__) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // ─── API pública ───────────────────────────────────────────────────────────
  function resetAll() {
    stopSpeech();
    prefs = Object.assign({}, defaults);
    savePrefs();
    if (document.body) { applyAll(); syncUI(); }
    updateTtsBtn();
  }

  // A API pode ser chamada antes do DOMContentLoaded: monta o widget se o
  // <body> já existe; senão só guarda as preferências, aplicadas no init.
  function ensureReady() {
    if (!document.getElementById(WIDGET_ID) && document.body) init();
    return !!document.getElementById(WIDGET_ID);
  }

  function setPanelOpen(open) {
    if (!ensureReady()) return;
    document.getElementById('a11y-panel').classList.toggle('open', open);
    document.getElementById('a11y-btn').setAttribute('aria-expanded', String(open));
    if (open) positionPanel();
  }

  window.A11yWidget = {
    __core:     true,
    version:    '2.2.0',
    init:       () => { ensureReady(); },
    destroy:    destroy,
    isMounted:  () => !!document.getElementById(WIDGET_ID),
    subscribe:  (fn) => {
      if (typeof fn !== 'function') return () => {};
      subscribers.push(fn);
      return () => { const i = subscribers.indexOf(fn); if (i !== -1) subscribers.splice(i, 1); };
    },
    getPrefs:   () => Object.assign({}, prefs),
    applyPrefs: (p) => {
      const clean = sanitizePrefs(p);
      Object.assign(prefs, clean);
      // Tema e os antigos modo escuro/alto contraste somariam dois efeitos.
      if (clean.theme && clean.theme !== 'default') { prefs.darkMode = false; prefs.highContrast = false; }
      savePrefs();
      if (ensureReady()) { applyAll(); syncUI(); }
    },
    reset:      () => { ensureReady(); resetAll(); },
    open:       () => setPanelOpen(true),
    close:      () => setPanelOpen(false),
    speak:      (text) => {
      if (!('speechSynthesis' in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = document.documentElement.lang || 'pt-BR';
      window.speechSynthesis.speak(u);
    },
  };
  // Nome do projeto; window.A11yWidget continua valendo para quem já integrou.
  window.AccessAbilityWidget = window.A11yWidget;

})();
