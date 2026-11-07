// Importar e renderizar no servidor (sem window/document), como no Next.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('o pacote importa no servidor e a API não quebra', async () => {
  assert.equal(typeof globalThis.document, 'undefined');
  const widget = await import('../index.mjs');
  assert.doesNotThrow(() => {
    widget.init();
    widget.applyPrefs({ darkMode: true });
    widget.open();
    widget.close();
    widget.reset();
    widget.destroy();
    widget.subscribe(() => {})();
  });
  assert.equal(widget.getPrefs(), null);
  assert.equal(widget.isMounted(), false);
});

test('componente e hook renderizam no servidor sem erro', async () => {
  const { createElement: h } = await import('react');
  const { renderToString } = await import('react-dom/server');
  const { A11yWidget, useA11yWidget } = await import('../react/index.mjs');
  function Estado() {
    const { prefs } = useA11yWidget();
    return h('p', null, prefs === null ? 'sem-prefs' : 'com-prefs');
  }
  const html = renderToString(h('div', null, h(A11yWidget, { prefs: { darkMode: true } }), h(Estado)));
  assert.equal(html, '<div><p>sem-prefs</p></div>');
});
