// Temas com perfil claro/escuro e filtros de cor do Congo Grey Parrot.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadWidget } from './helpers.mjs';

const FAMILIES = ['high_contrast', 'kuro', 'pink_void', 'red_void', 'yellow_void', 'green_void', 'blue_void'];
const ALL = ['light', 'dark', ...FAMILIES, ...FAMILIES.map(f => f + '_light')];

const channel = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const cssVar = (win, name) => win.document.documentElement.style.getPropertyValue(name);
const chip = (win, sel) => win.document.querySelector(sel);

test('todos os temas têm contraste AA para texto, links e botões', async () => {
  const win = await loadWidget();
  for (const theme of ALL) {
    win.A11yWidget.applyPrefs({ theme });
    assert.equal(win.A11yWidget.getPrefs().theme, theme);
    const v = (n) => cssVar(win, n);
    assert.ok(contrast(v('--aw-text'), v('--aw-page-bg')) >= 4.5, `${theme}: texto`);
    assert.ok(contrast(v('--aw-text'), v('--aw-surface')) >= 4.5, `${theme}: texto na superfície`);
    assert.ok(contrast(v('--aw-accent'), v('--aw-page-bg')) >= 4.5, `${theme}: link`);
    assert.ok(contrast(v('--aw-active-text'), v('--aw-active')) >= 4.5, `${theme}: seleção`);
  }
});

test('família e perfil são escolhidos em separado', async () => {
  const win = await loadWidget();
  chip(win, '[data-family="green_void"]').click();
  assert.equal(win.A11yWidget.getPrefs().theme, 'green_void');
  chip(win, '[data-profile="light"]').click();
  assert.equal(win.A11yWidget.getPrefs().theme, 'green_void_light');
  chip(win, '[data-family="kuro"]').click();
  assert.equal(win.A11yWidget.getPrefs().theme, 'kuro_light', 'mantém o perfil');
  assert.equal(chip(win, '[data-family="kuro"]').getAttribute('aria-checked'), 'true');
  assert.equal(chip(win, '[data-profile="light"]').getAttribute('aria-checked'), 'true');
  chip(win, '[data-family="base"]').click();
  assert.equal(win.A11yWidget.getPrefs().theme, 'light');
  chip(win, '[data-profile="dark"]').click();
  assert.equal(win.A11yWidget.getPrefs().theme, 'dark');
  chip(win, '[data-family="default"]').click();
  assert.equal(win.A11yWidget.getPrefs().theme, 'default');
  assert.equal(cssVar(win, '--aw-page-bg'), '');
});

test('tema inválido é ignorado, inclusive nomes de protótipo', async () => {
  for (const bad of ['__proto__', 'constructor', 'kuro;background:url(x)', 'x_light', 1]) {
    const win = await loadWidget({ storage: JSON.stringify({ theme: bad }) });
    assert.equal(win.A11yWidget.getPrefs().theme, 'default');
    win.A11yWidget.applyPrefs({ theme: bad });
    assert.equal(win.A11yWidget.getPrefs().theme, 'default');
    assert.equal(cssVar(win, '--aw-page-bg'), '');
  }
});

test('destroy e reset desfazem o tema', async () => {
  const win = await loadWidget();
  const html = win.document.documentElement;
  win.A11yWidget.applyPrefs({ theme: 'blue_void_light', colorBlind: 'smart_invert' });
  assert.ok(html.classList.contains('aw-themed'));
  assert.ok(win.document.body.classList.contains('aw-smart-invert'));
  win.A11yWidget.destroy();
  assert.ok(!html.classList.contains('aw-themed'));
  assert.ok(!win.document.body.classList.contains('aw-smart-invert'));
  assert.equal(cssVar(win, '--aw-accent'), '');
  win.A11yWidget.init();
  assert.ok(html.classList.contains('aw-themed'));
  win.A11yWidget.reset();
  assert.ok(!html.classList.contains('aw-themed'));
});

test('matrizes do Daltonizer e BT.709 são as do Congo, em sRGB', async () => {
  const win = await loadWidget();
  const expected = {
    protanopia: '0.46111 0.53889 0 0 0 0.37754 0.62246 0 0 0 0.30974 -0.30974 1 0 0 0 0 0 1 0',
    deuteranopia: '-0.01672 1.01672 0 0 0 0.07530 0.92470 0 0 0 -0.36845 0.36845 1 0 0 0 0 0 1 0',
    tritanopia: '1 -1.15102 1.15102 0 0 0 0.11263 0.88737 0 0 0 0.14975 0.85025 0 0 0 0 0 1 0',
    monochromia: '0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0',
  };
  for (const [name, values] of Object.entries(expected)) {
    const filter = win.document.getElementById('aw-f-' + name);
    assert.equal(filter.getAttribute('color-interpolation-filters'), 'sRGB');
    assert.equal(filter.querySelector('feColorMatrix').getAttribute('values').trim().replace(/\s+/g, ' '), values);
  }
});

test('filtros de cor são uma escolha única', async () => {
  const win = await loadWidget();
  const body = win.document.body;
  chip(win, '[data-cb="invert"]').click();
  assert.equal(win.A11yWidget.getPrefs().invertColors, true);
  assert.match(body.style.filter, /invert\(1\)/);
  assert.ok(!body.classList.contains('aw-smart-invert'), 'clássica inverte tudo');
  chip(win, '[data-cb="smart_invert"]').click();
  assert.equal(win.A11yWidget.getPrefs().invertColors, false);
  assert.ok(body.classList.contains('aw-smart-invert'));
  chip(win, '[data-cb="tritanopia"]').click();
  assert.ok(!body.classList.contains('aw-smart-invert'));
  assert.match(body.style.filter, /aw-f-tritanopia/);
  chip(win, '[data-cb="none"]').click();
  assert.equal(body.style.filter, '');
});

test('modo escuro salvo por versões antigas aparece e pode ser trocado', async () => {
  const win = await loadWidget({ storage: '{"darkMode":true}' });
  assert.equal(chip(win, '[data-family="base"]').getAttribute('aria-checked'), 'true');
  chip(win, '[data-family="default"]').click();
  const p = win.A11yWidget.getPrefs();
  assert.equal(p.darkMode, false);
  assert.equal(p.theme, 'default');
  assert.equal(win.document.body.style.filter, '');
});

test('tema pela API não soma com modo escuro antigo', async () => {
  const win = await loadWidget();
  win.A11yWidget.applyPrefs({ darkMode: true, highContrast: true });
  win.A11yWidget.applyPrefs({ theme: 'kuro' });
  const p = win.A11yWidget.getPrefs();
  assert.equal(p.darkMode, false);
  assert.equal(p.highContrast, false);
});
