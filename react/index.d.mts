import type { A11yPrefs } from '../index.mjs';

export type { A11yPrefs, ColorBlindMode } from '../index.mjs';

export interface A11yWidgetProps {
  /** Preferências a aplicar; reaplicadas quando o conteúdo muda. */
  prefs?: Partial<A11yPrefs>;
  /** Chamado a cada mudança feita pelo usuário ou pela API. */
  onChange?: (prefs: A11yPrefs) => void;
}

/** Monta o widget enquanto estiver renderizado. Renderize uma vez, perto da raiz. */
export function A11yWidget(props?: A11yWidgetProps): null;
export default A11yWidget;

export function useA11yWidget(): {
  /** null na primeira renderização (e no servidor). */
  prefs: A11yPrefs | null;
  applyPrefs: (prefs: Partial<A11yPrefs>) => void;
  reset: () => void;
  open: () => void;
  close: () => void;
  speak: (text: string) => void;
};
