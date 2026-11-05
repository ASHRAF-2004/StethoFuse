import {validatePublicFirebaseConfig} from './firebase-contract';
export {FIREBASE_PROJECT,PUBLIC_ORIGIN} from './firebase-contract';
export const DEMO_ENABLED = import.meta.env.DEV &&
  (import.meta.env.VITE_APP_MODE === 'demo' || import.meta.env.MODE === 'demo');

export function firebaseConfiguration(env:Record<string,unknown>=import.meta.env){return validatePublicFirebaseConfig(env);}

export const firebaseConfigurationError = (() => {
  if (DEMO_ENABLED) return '';
  try { firebaseConfiguration(); return ''; } catch (error) { return (error as Error).message; }
})();
