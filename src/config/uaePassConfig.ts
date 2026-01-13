/**
 * UAE Pass OAuth Configuration
 * 
 * Configurable system for UAE Pass authentication
 * Users provide their own staging/production settings
 */

export interface UAEPassConfig {
  environment: 'staging' | 'production';
  clientId: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  scopes?: string[];
  channelName?: string;
}

export interface UAEPassAppSchemes {
  staging: {
    ios: string;
    android: string;
  };
  production: {
    ios: string;
    android: string;
  };
}

// Default app schemes (can be overridden)
const DEFAULT_APP_SCHEMES: UAEPassAppSchemes = {
  staging: {
    ios: 'uaepassstg://',
    android: 'ae.uaepass.mainapp.stg',
  },
  production: {
    ios: 'uaepass://',
    android: 'ae.uaepass.mainapp',
  },
};

// Default scopes
const DEFAULT_SCOPES = [
  'urn:uae:digitalid:profile:general',
];

// ACR values for authentication levels
export const UAE_PASS_ACR_VALUES = {
  /**
   * LOW - Web-based authentication only (no app-to-app)
   * Use when UAE Pass app is NOT detected
   */
  LOW: 'urn:safelayer:tws:policies:authentication:level:low',
  
  /**
   * MOBILE_ON_DEVICE - App-to-app authentication
   * Use when UAE Pass app IS detected
   */
  MOBILE_ON_DEVICE: 'urn:digitalid:authentication:flow:mobileondevice',
  
  // Medium and High levels (not commonly used in mobile)
  MEDIUM: 'urn:safelayer:tws:policies:authentication:level:medium',
  HIGH: 'urn:safelayer:tws:policies:authentication:level:high',
} as const;

// Global config instance
let globalConfig: UAEPassConfig | null = null;
let globalAppSchemes: UAEPassAppSchemes = DEFAULT_APP_SCHEMES;

/**
 * Initialize UAE Pass configuration
 * Call this once in your app initialization (e.g., App.tsx)
 * 
 * @param config - UAE Pass configuration
 * @param appSchemes - Optional app schemes override
 * 
 * @example
 * ```typescript
 * configureUAEPass({
 *   environment: __DEV__ ? 'staging' : 'production',
 *   clientId: 'your_client_id',
 *   redirectUri: 'yourapp://auth/uaepass',
 *   authorizationEndpoint: 'https://stg-id.uaepass.ae/idshub/authorize',
 * });
 * ```
 */
export const configureUAEPass = (
  config: UAEPassConfig,
  appSchemes?: Partial<UAEPassAppSchemes>
) => {
  globalConfig = {
    ...config,
    scopes: config.scopes || DEFAULT_SCOPES,
  };
  
  if (appSchemes) {
    globalAppSchemes = {
      staging: { ...DEFAULT_APP_SCHEMES.staging, ...appSchemes.staging },
      production: { ...DEFAULT_APP_SCHEMES.production, ...appSchemes.production },
    };
  }
};

/**
 * Get current configuration
 * @throws Error if not configured
 */
export const getUAEPassConfig = (): UAEPassConfig => {
  if (!globalConfig) {
    throw new Error(
      'UAE Pass not configured. Please call configureUAEPass() first in your app initialization.'
    );
  }
  return globalConfig;
};

/**
 * Get app schemes for current environment
 */
export const getUAEPassAppSchemes = (): { ios: string; android: string } => {
  const config = getUAEPassConfig();
  return globalAppSchemes[config.environment];
};

/**
 * Get current environment
 */
export const getUAEPassEnvironment = (): 'staging' | 'production' => {
  const config = getUAEPassConfig();
  return config.environment;
};

export default {
  configureUAEPass,
  getUAEPassConfig,
  getUAEPassAppSchemes,
  getUAEPassEnvironment,
  UAE_PASS_ACR_VALUES,
};

