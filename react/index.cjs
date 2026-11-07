'use client';
'use strict';
// Integração React do @thaynabds/a11y-widget (CommonJS; index.mjs reexporta).
const { useEffect, useRef, useState } = require('react');
const widget = require('../index.cjs');

// Vários <A11yWidget /> ao mesmo tempo compartilham um único widget: ele só é
// removido quando o último desmonta (também cobre o duplo mount do StrictMode).
let mountedCount = 0;

/**
 * Monta o widget de acessibilidade enquanto estiver renderizado.
 * Renderize uma vez, perto da raiz do app. Não renderiza nada no DOM do React:
 * o widget se monta fora do <body>.
 *
 * @param {{ prefs?: object, onChange?: (prefs: object) => void }} props
 */
function A11yWidget(props) {
  const { prefs, onChange } = props || {};
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    mountedCount += 1;
    widget.init();
    const unsubscribe = widget.subscribe(p => { if (onChangeRef.current) onChangeRef.current(p); });
    return () => {
      unsubscribe();
      mountedCount -= 1;
      if (mountedCount === 0) widget.destroy();
    };
  }, []);

  // Reaplica quando o conteúdo de `prefs` muda (não a cada novo objeto igual)
  const prefsKey = prefs ? JSON.stringify(prefs) : '';
  useEffect(() => {
    if (prefs) widget.applyPrefs(prefs);
  }, [prefsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/**
 * Lê e controla o widget. `prefs` é null na primeira renderização (inclusive no
 * servidor) e passa a acompanhar as mudanças depois de montado.
 */
function useA11yWidget() {
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    setPrefs(widget.getPrefs());
    return widget.subscribe(setPrefs);
  }, []);

  return {
    prefs,
    applyPrefs: widget.applyPrefs,
    reset: widget.reset,
    open: widget.open,
    close: widget.close,
    speak: widget.speak,
  };
}

exports.A11yWidget = A11yWidget;
exports.useA11yWidget = useA11yWidget;
exports.default = A11yWidget;
