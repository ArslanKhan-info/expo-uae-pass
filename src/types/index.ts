/**
 * TypeScript type definitions for expo-uae-pass
 */

/**
 * Result of UAE Pass authentication
 */
export interface UAEPassAuthResult {
  success: boolean;
  authorizationCode?: string;
  state?: string;
  codeVerifier?: string;
  error?: string;
  details?: any;
}

/**
 * Parameters for WebView-based authentication
 */
export interface UAEPassWebViewAuthParams {
  authUrl: string;
  redirectUri: string;
  state: string;
  codeVerifier: string;
  acrValue: string;
  useWebView: boolean;
}

/**
 * Callback request for backend integration
 */
export interface UAEPassCallbackRequest {
  code: string;
  state: string;
  code_verifier?: string;
  device_type: 'ios' | 'android';
  device_token?: string;
}

/**
 * Callback response from backend
 */
export interface UAEPassCallbackResponse {
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    profile_picture?: string;
    uae_pass_uuid?: string;
  };
  access_token: string;
  token_type: "Bearer";
  expires_at: string;
}

