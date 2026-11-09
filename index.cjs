'use strict';
// Entrada do pacote npm @thaynabds/accessability-widget (CommonJS; index.mjs reexporta).
// A ordem importa: manual.js roda antes do núcleo.
require('./src/manual.js');
require('./src/accessability-widget.js');

function api() {
  return typeof window !== 'undefined' ? window.A11yWidget : undefined;
}

/** Monta o widget na página (sem efeito no servidor ou se já estiver montado). */
exports.init = function init() { const a = api(); if (a) a.init(); };

/** Remove o widget e desfaz os efeitos na página; as preferências continuam salvas. */
exports.destroy = function destroy() { const a = api(); if (a) a.destroy(); };

exports.isMounted = function isMounted() { const a = api(); return a ? a.isMounted() : false; };

/** Preferências atuais, ou null no servidor. */
exports.getPrefs = function getPrefs() { const a = api(); return a ? a.getPrefs() : null; };

/** Aplica preferências; valores inválidos são ignorados. */
exports.applyPrefs = function applyPrefs(prefs) { const a = api(); if (a) a.applyPrefs(prefs); };

exports.reset = function reset() { const a = api(); if (a) a.reset(); };
exports.open = function open() { const a = api(); if (a) a.open(); };
exports.close = function close() { const a = api(); if (a) a.close(); };
exports.speak = function speak(text) { const a = api(); if (a) a.speak(text); };

/** Chama `listener(prefs)` a cada mudança; retorna a função que cancela. */
exports.subscribe = function subscribe(listener) { const a = api(); return a ? a.subscribe(listener) : function () {}; };

exports.version = '2.2.0';
