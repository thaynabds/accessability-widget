// Pacote npm (ESM) + componente e hook React num DOM do jsdom.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newDom, installGlobals } from './helpers.mjs';

const dom = newDom();
installGlobals(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = await import('react');
const { createRoot } = await import('react-dom/client');
const widget = await import('../index.mjs');
const { AccessAbilityWidget, useAccessAbilityWidget } = await import('../react/index.mjs');
const { act, createElement: h, StrictMode } = React;

function render(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  return {
    rerender: el => act(() => root.render(el)),
    unmount: () => { act(() => root.unmount()); container.remove(); },
  };
}

test('importar o pacote não monta o widget sozinho', () => {
  assert.equal(widget.isMounted(), false);
  assert.equal(document.getElementById('a11y-widget-root'), null);
});

test('<AccessAbilityWidget /> monta ao renderizar e remove ao desmontar', () => {
  const r = render(h(AccessAbilityWidget));
  assert.equal(widget.isMounted(), true);
  r.unmount();
  assert.equal(widget.isMounted(), false);
  assert.equal(document.getElementById('a11y-widget-styles'), null);
});

test('funciona no StrictMode (montagem dupla)', () => {
  const r = render(h(StrictMode, null, h(AccessAbilityWidget)));
  assert.equal(widget.isMounted(), true);
  assert.equal(document.querySelectorAll('#a11y-widget-root').length, 1);
  r.unmount();
  assert.equal(widget.isMounted(), false);
});

test('dois componentes compartilham o widget até o último desmontar', () => {
  const a = render(h(AccessAbilityWidget));
  const b = render(h(AccessAbilityWidget));
  a.unmount();
  assert.equal(widget.isMounted(), true);
  b.unmount();
  assert.equal(widget.isMounted(), false);
});

test('prop prefs aplica e reaplica só quando o conteúdo muda', () => {
  widget.reset();
  const r = render(h(AccessAbilityWidget, { prefs: { highContrast: true } }));
  assert.equal(widget.getPrefs().highContrast, true);
  widget.applyPrefs({ highContrast: false });
  r.rerender(h(AccessAbilityWidget, { prefs: { highContrast: true } })); // mesmo conteúdo, objeto novo
  assert.equal(widget.getPrefs().highContrast, false, 'não sobrescreve a escolha do usuário à toa');
  r.rerender(h(AccessAbilityWidget, { prefs: { highContrast: true, fontSize: 1 } }));
  assert.equal(widget.getPrefs().fontSize, 1);
  r.unmount();
  widget.reset();
});

test('onChange recebe as mudanças, sempre com a função mais recente', () => {
  const calls = [];
  const r = render(h(AccessAbilityWidget, { onChange: () => calls.push('antiga') }));
  r.rerender(h(AccessAbilityWidget, { onChange: p => calls.push(p.darkMode) }));
  act(() => { document.getElementById('aw-dark').click(); });
  assert.deepEqual(calls, [true]);
  r.unmount();
  act(() => widget.applyPrefs({ darkMode: false }));
  assert.deepEqual(calls, [true], 'para de avisar depois de desmontar');
});

test('useAccessAbilityWidget acompanha as preferências e controla o painel', () => {
  widget.reset();
  let api;
  function Painel() {
    api = useAccessAbilityWidget();
    return h('span', { id: 'dark-state' }, api.prefs ? String(api.prefs.darkMode) : 'carregando');
  }
  const r = render(h('div', null, h(AccessAbilityWidget), h(Painel)));
  assert.equal(document.getElementById('dark-state').textContent, 'false');
  act(() => api.applyPrefs({ darkMode: true }));
  assert.equal(document.getElementById('dark-state').textContent, 'true');
  act(() => api.open());
  assert.ok(document.getElementById('a11y-panel').classList.contains('open'));
  act(() => api.close());
  act(() => api.reset());
  assert.equal(document.getElementById('dark-state').textContent, 'false');
  r.unmount();
});
