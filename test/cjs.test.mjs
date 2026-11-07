// Consumo via require() (CommonJS) e convivência com a entrada ESM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { newDom, installGlobals } from './helpers.mjs';

installGlobals(newDom().window);
const require = createRequire(import.meta.url);

test('require() do pacote e do React funciona', () => {
  const widget = require('../index.cjs');
  const react = require('../react/index.cjs');
  assert.equal(typeof widget.init, 'function');
  assert.equal(typeof react.A11yWidget, 'function');
  assert.equal(react.default, react.A11yWidget);
  assert.equal(widget.isMounted(), false, 'pelo pacote não monta sozinho');
});

test('CommonJS e ESM controlam o mesmo widget', async () => {
  const cjs = require('../index.cjs');
  const esm = await import('../index.mjs');
  cjs.init();
  assert.equal(esm.isMounted(), true);
  esm.applyPrefs({ darkMode: true });
  assert.equal(cjs.getPrefs().darkMode, true);
  esm.destroy();
  assert.equal(cjs.isMounted(), false);
  assert.equal(document.querySelectorAll('#a11y-widget-root').length, 0);
});
