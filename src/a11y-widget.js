/*!
 * a11y-widget.js — Widget de Acessibilidade Universal
 * Autor: Thayná Batista da Silva — github.com/thaynabds
 * Versão: 2.0.0
 * Licença: MIT
 *
 * Embed (uma linha):
 * <script src="https://cdn.jsdelivr.net/gh/thaynabds/a11y-widget@latest/src/a11y-widget.js"></script>
 *
 * Conformidade: WCAG 2.2 / LBI (Lei Brasileira de Inclusão 13.146/2015)
 */
(function () {
  'use strict';

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
    colorBlind:       'none',    // none | protanopia | deuteranopia | tritanopia | monochromia
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

  let prefs = Object.assign({}, defaults, loadPrefs());
  let speechActive = false;

  // ─── Persistência ──────────────────────────────────────────────────────────
  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function savePrefs() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); }
    catch (_) {}
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
      background: var(--aw-primary); color: #fff;
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
    #a11y-btn svg { pointer-events: none; }

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
      background: var(--aw-primary); color: #fff;
      padding: 13px 16px; font-weight: 700; font-size: 13px;
      letter-spacing: .4px; display: flex; align-items: center;
      justify-content: space-between; flex-shrink: 0;
    }
    .aw-header-title { display: flex; align-items: center; gap: 8px; }
    .aw-close-btn {
      background: rgba(255,255,255,.15); border: none; color: #fff;
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

    /* Inversão de cores pura — preserva imagens/vídeos */
    body.aw-invert img,
    body.aw-invert video,
    body.aw-invert iframe { filter: invert(1) !important; }
    body.aw-dark-mode.aw-invert img,
    body.aw-dark-mode.aw-invert video,
    body.aw-dark-mode.aw-invert iframe { filter: hue-rotate(180deg) !important; }

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

  const COLOR_FILTERS_SVG = `
    <svg class="aw-svg-filter" aria-hidden="true" focusable="false"
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="aw-f-protanopia">
          <feColorMatrix type="matrix"
            values="0.567 0.433 0     0 0
                    0.558 0.442 0     0 0
                    0     0.242 0.758 0 0
                    0     0     0     1 0"/>
        </filter>
        <filter id="aw-f-deuteranopia">
          <feColorMatrix type="matrix"
            values="0.625 0.375 0   0 0
                    0.7   0.3   0   0 0
                    0     0.3   0.7 0 0
                    0     0     0   1 0"/>
        </filter>
        <filter id="aw-f-tritanopia">
          <feColorMatrix type="matrix"
            values="0.95  0.05  0     0 0
                    0     0.433 0.567 0 0
                    0     0.475 0.525 0 0
                    0     0     0     1 0"/>
        </filter>
      </defs>
    </svg>
  `;

  // ─── HTML do painel ────────────────────────────────────────────────────────
  function panelHTML() {
    return `
      <button id="a11y-btn"
        aria-expanded="false" aria-haspopup="dialog"
        aria-label="Abrir painel de acessibilidade"
        title="Acessibilidade (Alt+A)">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8"/>
          <path d="M7 9h10M12 9v5l-2.5 4M12 14l2.5 4"/>
        </svg>
      </button>

      <div id="a11y-panel" role="dialog"
           aria-label="Painel de acessibilidade" aria-modal="false">

        <div class="aw-header">
          <span class="aw-header-title">
            <span aria-hidden="true">♿</span> Acessibilidade
          </span>
          <button class="aw-close-btn" id="aw-close" aria-label="Fechar painel">✕</button>
        </div>

        <div class="aw-body">

          <!-- VISUAL -->
          <div class="aw-section-label">Visão</div>

          ${row('aw-dark',     '🌙', 'Modo escuro')}
          ${row('aw-invert',   '🔄', 'Inverter cores')}
          ${row('aw-contrast', '🔆', 'Alto contraste')}
          ${row('aw-sat',      '🌈', 'Aumentar saturação')}
          ${row('aw-images',   '🖼',  'Ocultar imagens')}

          <!-- DALTONISMO -->
          <div class="aw-section-label">Daltonismo</div>
          <div class="aw-chips" id="aw-chips-cb" role="radiogroup" aria-label="Filtro de daltonismo">
            <span class="aw-chip" role="radio" tabindex="0" data-cb="none">Normal</span>
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
    applyFilters();
    applyFontSize();
    applyVideos();
    applyReadingGuide();
  }

  const CB_FILTERS = {
    protanopia:   "url('#aw-f-protanopia')",
    deuteranopia: "url('#aw-f-deuteranopia')",
    tritanopia:   "url('#aw-f-tritanopia')",
    monochromia:  'grayscale(1)',
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
    'aw-dark':     'darkMode',
    'aw-invert':   'invertColors',
    'aw-contrast': 'highContrast',
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

    document.querySelectorAll('.aw-chip').forEach(chip => {
      const on = chip.dataset.cb === prefs.colorBlind;
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

    document.addEventListener('mousemove', function (e) {
      if (!prefs.readingGuide) return;
      const y = e.clientY - H / 2;
      maskTop.style.cssText = `top:0; height:${Math.max(0, y)}px`;
      line.style.cssText    = `top:${y}px; height:${H}px`;
      maskBot.style.cssText = `top:${y + H}px; bottom:0; height:auto`;
    });
  }

  // ─── Text-to-Speech ────────────────────────────────────────────────────────
  function speakSelection() {
    if (!('speechSynthesis' in window)) {
      alert('Seu navegador não suporta leitura em voz alta.');
      return;
    }
    if (speechActive) {
      window.speechSynthesis.cancel();
      speechActive = false;
      updateTtsBtn();
      return;
    }
    const text = window.getSelection().toString().trim();
    if (!text) {
      alert('Selecione um texto na página para ler em voz alta.');
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = document.documentElement.lang || 'pt-BR';
    utter.onend = utter.onerror = () => {
      speechActive = false;
      updateTtsBtn();
    };
    window.speechSynthesis.speak(utter);
    speechActive = true;
    updateTtsBtn();
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
        suppressClick = true;
        // touchend com preventDefault não gera click; limpa a flag nesse caso
        setTimeout(() => { suppressClick = false; }, 400);
        e.preventDefault();
      }
      moved = false;
    }

    btn.addEventListener('mousedown',  onStart, { passive: false });
    btn.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove',  onMove);
    document.addEventListener('touchmove',  onMove, { passive: false });
    document.addEventListener('mouseup',  onEnd);
    document.addEventListener('touchend', onEnd);

    // Impede que o click gerado ao soltar o botão abra/feche o painel após arrastar
    btn.addEventListener('click', function (e) {
      if (suppressClick) { suppressClick = false; e.stopImmediatePropagation(); }
    }, true);
  }

  // ─── Atalho de teclado (Alt+A) ────────────────────────────────────────────
  function bindKeyShortcut() {
    document.addEventListener('keydown', function (e) {
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
    window.addEventListener('resize', positionPanel);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });

    // Click fora fecha (sem roubar o foco quando o painel já está fechado)
    document.addEventListener('click', e => {
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

    // Chips daltonismo
    document.querySelectorAll('.aw-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        prefs.colorBlind = chip.dataset.cb;
        savePrefs(); applyAll(); syncUI();
      });
      chip.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chip.click(); }
      });
    });

    // TTS
    document.getElementById('aw-tts-btn').addEventListener('click', speakSelection);

    // Reset
    document.getElementById('aw-reset').addEventListener('click', () => {
      window.speechSynthesis && window.speechSynthesis.cancel();
      speechActive = false;
      prefs = Object.assign({}, defaults);
      document.documentElement.style.fontSize = '';
      savePrefs(); applyAll(); syncUI();
    });

    // Vídeos novos adicionados ao DOM
    if (window.MutationObserver) {
      new MutationObserver(() => applyVideos()).observe(document.body, { childList: true, subtree: true });
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
    console.info('[a11y-widget v2.0] pronto. Atalho: Alt+A | Arraste o botão para reposicionar.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── API pública ───────────────────────────────────────────────────────────
  window.A11yWidget = {
    version:    '2.0.0',
    getPrefs:   () => Object.assign({}, prefs),
    applyPrefs: (p) => { Object.assign(prefs, p); savePrefs(); applyAll(); syncUI(); },
    reset:      () => document.getElementById('aw-reset').click(),
    open:       () => { document.getElementById('a11y-panel').classList.add('open'); document.getElementById('a11y-btn').setAttribute('aria-expanded','true'); positionPanel(); },
    close:      () => { document.getElementById('a11y-panel').classList.remove('open'); document.getElementById('a11y-btn').setAttribute('aria-expanded','false'); },
    speak:      (text) => {
      if (!('speechSynthesis' in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = document.documentElement.lang || 'pt-BR';
      window.speechSynthesis.speak(u);
    },
  };

})();
