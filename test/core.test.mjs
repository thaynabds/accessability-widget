// Núcleo carregado como <script> (modo CDN).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newDom, loadWidget, domLoaded, WIDGET_SRC } from './helpers.mjs';

test('script carregado durante o parse monta no DOMContentLoaded', async () => {
  const win = newDom().window;
  assert.equal(win.document.readyState, 'loading');
  win.eval(WIDGET_SRC);
  assert.equal(win.document.getElementById('a11y-widget-root'), null, 'ainda não montou');
  await domLoaded(win);
  assert.ok(win.document.getElementById('a11y-widget-root'));
});

test('pela tag <script> o widget monta sozinho', async () => {
  const win = await loadWidget();
  assert.ok(win.document.getElementById('a11y-widget-root'));
  assert.equal(win.document.getElementById('a11y-widget-root').parentElement, win.document.documentElement);
  assert.equal(win.A11yWidget.isMounted(), true);
  assert.equal(win.AccessAbilityWidget, win.A11yWidget, 'apelido com o nome do projeto');
});

test('com __A11Y_WIDGET_MANUAL__ só monta quando init() é chamado', async () => {
  const win = await loadWidget({ manual: true });
  assert.equal(win.document.getElementById('a11y-widget-root'), null);
  win.A11yWidget.init();
  assert.ok(win.document.getElementById('a11y-widget-root'));
  win.A11yWidget.init();
  assert.equal(win.document.querySelectorAll('#a11y-widget-root').length, 1, 'init é idempotente');
});

test('clique no ícone abre e fecha o painel', async () => {
  const win = await loadWidget();
  const btn = win.document.getElementById('a11y-btn');
  const panel = win.document.getElementById('a11y-panel');
  btn.click();
  assert.ok(panel.classList.contains('open'));
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
  btn.click();
  assert.ok(!panel.classList.contains('open'));
});

test('toque no ícone abre o painel (touchstart cancela o click nativo)', async () => {
  const win = await loadWidget();
  const btn = win.document.getElementById('a11y-btn');
  const opts = { bubbles: true, cancelable: true };
  const start = new win.Event('touchstart', opts);
  start.touches = [{ clientX: 10, clientY: 10 }];
  btn.dispatchEvent(start);
  assert.ok(start.defaultPrevented, 'o touchstart é cancelado para permitir arrastar');
  const end = new win.Event('touchend', opts);
  end.touches = [];
  btn.dispatchEvent(end);
  assert.ok(win.document.getElementById('a11y-panel').classList.contains('open'));
});

test('destroy remove o widget, os estilos, os efeitos e os listeners globais', async () => {
  const win = await loadWidget();
  const { document } = win;
  win.A11yWidget.applyPrefs({ darkMode: true, highlightLinks: true, fontSize: 2 });
  assert.match(document.body.style.filter, /invert/);
  win.A11yWidget.destroy();
  assert.equal(document.getElementById('a11y-widget-root'), null);
  assert.equal(document.getElementById('a11y-widget-styles'), null);
  assert.equal(document.body.style.filter, '');
  assert.equal(document.body.className, '');
  assert.equal(document.documentElement.style.fontSize, '');
  // Listeners que sobrassem disparariam erros ao usar teclado e mouse
  const errors = [];
  win.addEventListener('error', e => errors.push(e.message || String(e.error)));
  document.dispatchEvent(new win.KeyboardEvent('keydown', { altKey: true, code: 'KeyA', bubbles: true }));
  document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  document.dispatchEvent(new win.MouseEvent('mousemove', { bubbles: true }));
  document.dispatchEvent(new win.MouseEvent('mouseup', { bubbles: true }));
  document.body.click();
  win.dispatchEvent(new win.Event('resize'));
  assert.deepEqual(errors, []);
  assert.equal(document.getElementById('a11y-widget-root'), null);
});

test('destroy + init não duplica listeners (Alt+A abre uma vez só)', async () => {
  const win = await loadWidget();
  win.A11yWidget.destroy();
  win.A11yWidget.init();
  win.A11yWidget.destroy();
  win.A11yWidget.init();
  win.document.dispatchEvent(new win.KeyboardEvent('keydown', { altKey: true, code: 'KeyA', bubbles: true }));
  assert.ok(win.document.getElementById('a11y-panel').classList.contains('open'));
});

test('depois de destroy, init volta com as preferências salvas', async () => {
  const win = await loadWidget();
  win.A11yWidget.applyPrefs({ highContrast: true });
  win.A11yWidget.destroy();
  win.A11yWidget.init();
  assert.match(win.document.body.style.filter, /contrast\(2\.4\)/);
  assert.equal(win.document.getElementById('aw-contrast').getAttribute('aria-pressed'), 'true');
});

test('subscribe avisa as mudanças e o retorno cancela', async () => {
  const win = await loadWidget();
  const seen = [];
  const unsubscribe = win.A11yWidget.subscribe(p => seen.push(p.darkMode));
  win.document.getElementById('aw-dark').click();
  win.A11yWidget.reset();
  unsubscribe();
  win.A11yWidget.applyPrefs({ darkMode: true });
  assert.deepEqual(seen, [true, false]);
  assert.doesNotThrow(() => win.A11yWidget.subscribe('não é função')());
});

test('preferências adulteradas no localStorage são ignoradas', async () => {
  const win = await loadWidget({
    storage: '{"__proto__":{"polluted":true},"fontSize":9999,"colorBlind":"url(javascript:alert(1))","darkMode":"yes","highContrast":true}',
  });
  const p = win.A11yWidget.getPrefs();
  assert.equal(p.polluted, undefined);
  assert.equal(win.Object.prototype.polluted, undefined);
  assert.equal(p.fontSize, 4);
  assert.equal(p.colorBlind, 'none');
  assert.equal(p.darkMode, false);
  assert.equal(p.highContrast, true);
  assert.ok(!win.document.body.style.filter.includes('javascript'));
});

test('localStorage com JSON inválido não quebra o widget', async () => {
  const win = await loadWidget({ storage: '{quebrado' });
  assert.equal(win.A11yWidget.getPrefs().darkMode, false);
  assert.ok(win.A11yWidget.isMounted());
});

test('carregar o script duas vezes mantém uma única instância', async () => {
  const win = await loadWidget();
  const first = win.A11yWidget;
  win.eval(WIDGET_SRC);
  assert.equal(win.A11yWidget, first);
  assert.equal(win.document.querySelectorAll('#a11y-widget-root').length, 1);
});

test('textos do painel não interpretam HTML vindo de preferências', async () => {
  const win = await loadWidget();
  win.A11yWidget.applyPrefs({ colorBlind: '<img src=x onerror=alert(1)>' });
  assert.equal(win.document.querySelectorAll('#a11y-widget-root img').length, 0);
  assert.equal(win.A11yWidget.getPrefs().colorBlind, 'none');
});
