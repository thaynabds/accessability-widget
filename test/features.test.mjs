// Recursos: lupa, descrição de imagens, som, legendas, mapa, leitura da página e perfis.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadWidget } from './helpers.mjs';

const $ = (win, id) => win.document.getElementById(id);
const q = (win, sel) => win.document.querySelector(sel);

function speech(win) {
  const spoken = [];
  win.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  Object.defineProperty(win, 'speechSynthesis', { configurable: true, value: { speak: u => spoken.push(u), cancel() {}, resume() {}, getVoices: () => [{ lang: 'pt-BR', name: 'Voz' }], addEventListener() {}, removeEventListener() {} } });
  return spoken;
}

const settle = (win) => new Promise(r => win.setTimeout(r, 0));

for (const [row, pref, cls] of [['aw-left', 'leftAlign', 'aw-left-align'], ['aw-width', 'readableWidth', 'aw-readable-width'], ['aw-targets', 'largeTargets', 'aw-large-targets']]) {
  test(`${row} liga, desliga e salva`, async () => {
    const win = await loadWidget();
    $(win, row).click();
    assert.equal(win.A11yWidget.getPrefs()[pref], true);
    assert.ok(win.document.body.classList.contains(cls));
    assert.equal($(win, row).getAttribute('aria-pressed'), 'true');
    $(win, row).click();
    assert.ok(!win.document.body.classList.contains(cls));
  });
}

test('descrição das imagens avisa quando falta, ignora decorativas e desfaz', async () => {
  const win = await loadWidget();
  win.document.body.insertAdjacentHTML('beforeend', '<img id="sem"><img id="deco" alt="">');
  $(win, 'aw-alt').click();
  const labels = () => Array.from(win.document.querySelectorAll('.aw-alt-label')).map(n => n.textContent);
  assert.deepEqual(labels().sort(), ['Imagem sem descrição', 'Imagem: imagem']);
  $(win, 'aw-alt').click();
  assert.equal(labels().length, 0);
});

test('descrição de imagem não executa HTML vindo do alt', async () => {
  const win = await loadWidget();
  win.document.querySelector('img').setAttribute('alt', '<b id="x">oi</b>');
  $(win, 'aw-alt').click();
  assert.equal($(win, 'x'), null);
  assert.equal(q(win, '.aw-alt-label').textContent, 'Imagem: <b id="x">oi</b>');
});

test('imagem adicionada depois também recebe descrição, sem laço', async () => {
  const win = await loadWidget();
  win.A11yWidget.applyPrefs({ showAltText: true });
  win.document.body.insertAdjacentHTML('beforeend', '<img alt="nova">');
  await settle(win); await settle(win);
  assert.equal(win.document.querySelectorAll('.aw-alt-label').length, 2);
});

test('silenciar só restaura o que o widget silenciou', async () => {
  const win = await loadWidget();
  win.document.body.insertAdjacentHTML('beforeend', '<audio id="a"></audio><video id="v"></video>');
  await settle(win);
  $(win, 'v').muted = true;
  $(win, 'aw-mute').click();
  assert.equal($(win, 'a').muted, true);
  $(win, 'aw-mute').click();
  assert.equal($(win, 'a').muted, false);
  assert.equal($(win, 'v').muted, true, 'já estava mudo antes');
});

test('legendas ligam a faixa do idioma e voltam ao estado anterior', async () => {
  const win = await loadWidget();
  const en = { kind: 'captions', language: 'en', mode: 'disabled' };
  const pt = { kind: 'subtitles', language: 'pt', mode: 'disabled' };
  const meta = { kind: 'metadata', language: 'pt', mode: 'hidden' };
  Object.defineProperty(q(win, 'video'), 'textTracks', { value: [meta, en, pt] });
  $(win, 'aw-captions').click();
  assert.equal(pt.mode, 'showing');
  assert.equal(en.mode, 'disabled');
  assert.equal(meta.mode, 'hidden');
  $(win, 'aw-captions').click();
  assert.equal(pt.mode, 'disabled');
});

test('lupa mostra o texto, some com Esc e não lê campos', async () => {
  const win = await loadWidget();
  win.document.body.insertAdjacentHTML('beforeend', '<p id="p">Texto <b id="b">grande</b></p><input id="senha" value="segredo">');
  const mag = $(win, 'aw-mag');
  const over = (el) => el.dispatchEvent(new win.MouseEvent('mouseover', { bubbles: true, clientX: 10, clientY: 10 }));
  over($(win, 'b'));
  assert.ok(!mag.classList.contains('show'), 'desligada não aparece');
  $(win, 'aw-textmag').click();
  over($(win, 'b'));
  assert.ok(mag.classList.contains('show'));
  assert.equal(mag.textContent, 'Texto grande');
  win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.ok(!mag.classList.contains('show'));
  over($(win, 'senha'));
  assert.ok(!mag.textContent.includes('segredo'));
  assert.equal(mag.children.length, 0);
});

test('mapa lista títulos como texto e leva o foco até eles', async () => {
  const win = await loadWidget();
  win.document.body.insertAdjacentHTML('beforeend', '<main id="m"><h3 id="alvo">&lt;img onerror=x&gt; Seção</h3></main>');
  win.A11yWidget.open();
  $(win, 'aw-map-btn').click();
  assert.equal($(win, 'aw-map-btn').getAttribute('aria-expanded'), 'true');
  assert.equal($(win, 'aw-map').querySelector('img'), null);
  const buttons = Array.from($(win, 'aw-map').querySelectorAll('button'));
  assert.equal(buttons[0].textContent, 'Ir para o conteúdo principal');
  buttons.find(b => b.textContent.includes('Seção')).click();
  assert.equal(win.document.activeElement.id, 'alvo');
  assert.ok(!$(win, 'a11y-panel').classList.contains('open'));
});

test('ler a página usa o conteúdo principal, a velocidade escolhida e para', async () => {
  const win = await loadWidget();
  const spoken = speech(win);
  win.document.body.insertAdjacentHTML('beforeend', '<main>Conteúdo<script>codigo()</script></main>');
  q(win, '[data-rate="1.5"]').click();
  $(win, 'aw-page-btn').click();
  assert.equal(spoken[0].text, 'Conteúdo');
  assert.equal(spoken[0].rate, 1.5);
  assert.equal($(win, 'aw-page-label').textContent, 'Parar leitura');
  assert.equal($(win, 'aw-tts-label').textContent, 'Ler texto selecionado');
  $(win, 'aw-page-btn').click();
  assert.equal($(win, 'aw-page-label').textContent, 'Ler a página');
});

test('interruptor da linha liga e desliga uma vez por clique', async () => {
  const win = await loadWidget();
  const row = $(win, 'aw-sat');
  row.querySelector('.aw-toggle').click();
  assert.equal(win.A11yWidget.getPrefs().saturationBoost, true);
  assert.equal(row.getAttribute('aria-pressed'), 'true');
  row.querySelector('.aw-toggle').click();
  assert.equal(win.A11yWidget.getPrefs().saturationBoost, false);
  row.querySelector('.aw-row-label').click();
  assert.equal(win.A11yWidget.getPrefs().saturationBoost, true);
});

test('velocidade inválida é ignorada', async () => {
  const win = await loadWidget();
  for (const bad of [0, 100, '1.5', null]) win.A11yWidget.applyPrefs({ ttsRate: bad });
  assert.equal(win.A11yWidget.getPrefs().ttsRate, 1);
});

test('perfil rápido liga tudo, mostra o estado e desliga', async () => {
  const win = await loadWidget();
  const button = q(win, '[data-preset="dyslexia"]');
  button.click();
  let p = win.A11yWidget.getPrefs();
  assert.ok(p.dyslexicFont && p.lineHeight && p.textSpacing && p.leftAlign && p.readableWidth);
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  button.click();
  p = win.A11yWidget.getPrefs();
  assert.ok(!p.dyslexicFont && !p.leftAlign);
  assert.equal(button.getAttribute('aria-pressed'), 'false');
});

test('perfil baixa visão aplica tema e fonte', async () => {
  const win = await loadWidget();
  win.A11yWidget.applyPrefs({ darkMode: true });
  q(win, '[data-preset="low_vision"]').click();
  const p = win.A11yWidget.getPrefs();
  assert.equal(p.theme, 'high_contrast');
  assert.equal(p.fontSize, 3);
  assert.equal(p.darkMode, false);
});

test('destroy desfaz o que entrou nos elementos da página', async () => {
  const win = await loadWidget();
  const video = q(win, 'video');
  win.A11yWidget.applyPrefs({ showAltText: true, muteMedia: true, pauseAnimations: true });
  assert.ok(win.document.querySelector('.aw-alt-label'));
  assert.equal(video.muted, true);
  win.A11yWidget.destroy();
  assert.equal(win.document.querySelector('.aw-alt-label'), null);
  assert.equal(video.muted, false);
  assert.ok(!win.document.documentElement.classList.contains('aw-pause-anim'));
});
