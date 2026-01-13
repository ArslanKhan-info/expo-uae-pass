/**
 * expo-uae-pass
 * 
 * Main entry point for UAE Pass authentication package
 */

// Configuration
export {
  configureUAEPass,
  getUAEPassConfig,
  getUAEPassAppSchemes,
  getUAEPassEnvironment,
  UAE_PASS_ACR_VALUES,
  type UAEPassConfig,
  type UAEPassAppSchemes,
} from './config/uaePassConfig';

// Hook
export {
  useUAEPassAuth,
  type UseUAEPassAuthOptions,
  type UseUAEPassAuthReturn,
} from './hooks/useUAEPassAuth';

// Service functions (for advanced usage)
export {
  authenticateWithUAEPass,
  authenticateWithUAEPassBrowser,
  prepareUAEPassAuth,
  isUAEPassAppInstalled,
} from './services/uaePassService';

// Components
export { default as UAEPassWebViewAuth } from './components/UAEPassWebViewAuth';

// Types
export type {
  UAEPassAuthResult,
  UAEPassWebViewAuthParams,
  UAEPassCallbackRequest,
  UAEPassCallbackResponse,
} from './types';

