import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

export const WIDGET_SRC = readFileSync(new URL('../src/a11y-widget.js', import.meta.url), 'utf8');

const PAGE = '<!doctype html><html lang="pt-BR"><head></head><body>'
  + '<h2>Título</h2><p><a href="#">link</a></p><img alt="imagem"><video></video></body></html>';

export function newDom() {
  return new JSDOM(PAGE, { runScripts: 'outside-only', url: 'https://example.test/', pretendToBeVisual: true });
}

export function domLoaded(win) {
  if (win.document.readyState !== 'loading') return Promise.resolve();
  return new Promise(resolve => win.document.addEventListener('DOMContentLoaded', resolve, { once: true }));
}

/** Carrega o widget como uma tag <script> clássica numa página já carregada. */
export async function loadWidget({ manual = false, storage, beforeLoad = false } = {}) {
  const dom = newDom();
  const win = dom.window;
  if (!beforeLoad) await domLoaded(win);
  if (manual) win.__A11Y_WIDGET_MANUAL__ = true;
  if (storage !== undefined) win.localStorage.setItem('a11y-widget-v2', storage);
  win.eval(WIDGET_SRC);
  return win;
}

/** Expõe o DOM do jsdom como globais, para importar o pacote ESM e o React. */
export function installGlobals(win) {
  const keys = [
    'window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'Element', 'Node',
    'MutationObserver', 'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent',
    'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
  ];
  for (const key of keys) {
    const value = typeof win[key] === 'function' && /^[a-z]/.test(key) ? win[key].bind(win) : win[key];
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
}
