export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochromia';

export interface A11yPrefs {
  darkMode: boolean;
  invertColors: boolean;
  highContrast: boolean;
  saturationBoost: boolean;
  colorBlind: ColorBlindMode;
  /** De -2 (80%) a 4 (140%), em passos de 10%. */
  fontSize: number;
  dyslexicFont: boolean;
  lineHeight: boolean;
  textSpacing: boolean;
  highlightLinks: boolean;
  highlightHeadings: boolean;
  hideImages: boolean;
  pauseAnimations: boolean;
  pauseVideos: boolean;
  bigCursor: boolean;
  focusVisible: boolean;
  readingGuide: boolean;
  tts: boolean;
}

/** Monta o widget na página (sem efeito no servidor ou se já estiver montado). */
export function init(): void;
/** Remove o widget e desfaz os efeitos na página; as preferências continuam salvas. */
export function destroy(): void;
export function isMounted(): boolean;
/** Preferências atuais, ou null no servidor. */
export function getPrefs(): A11yPrefs | null;
/** Aplica preferências; valores inválidos são ignorados. */
export function applyPrefs(prefs: Partial<A11yPrefs>): void;
export function reset(): void;
export function open(): void;
export function close(): void;
export function speak(text: string): void;
/** Chama `listener(prefs)` a cada mudança; retorna a função que cancela. */
export function subscribe(listener: (prefs: A11yPrefs) => void): () => void;
export const version: string;
