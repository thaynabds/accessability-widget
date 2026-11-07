// Entrada ESM: reexporta a versão CommonJS para que exista um único estado.
export {
  init, destroy, isMounted, getPrefs, applyPrefs, reset, open, close, speak, subscribe, version,
} from './index.cjs';
