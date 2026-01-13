/**
 * UAE Pass Authentication Hook
 * 
 * React hook for UAE Pass authentication with WebView support
 */

import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import {
  prepareUAEPassAuth,
  authenticateWithUAEPassBrowser,
  isUAEPassAppInstalled,
} from '../services/uaePassService';
import { getUAEPassConfig } from '../config/uaePassConfig';
import type { UAEPassAuthResult, UAEPassWebViewAuthParams } from '../types';

export interface UseUAEPassAuthOptions {
  onSuccess?: (result: UAEPassAuthResult) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export interface UseUAEPassAuthReturn {
  /**
   * Start UAE Pass authentication
   * Returns auth result with authorization code if successful
   */
  authenticate: () => Promise<UAEPassAuthResult>;
  
  /**
   * Check if UAE Pass app is installed
   */
  checkAppInstalled: () => Promise<boolean>;
  
  /**
   * Exchange authorization code for tokens
   * Requires clientSecret (should be done on backend for security)
   */
  exchangeCode: (params: {
    code: string;
    codeVerifier?: string;
    clientSecret?: string;
  }) => Promise<any>;
  
  /**
   * Prepare auth params for WebView component
   * Use this when UAE Pass app IS installed
   */
  prepareForWebView: () => Promise<UAEPassWebViewAuthParams | null>;
  
  /**
   * Loading state
   */
  isLoading: boolean;
  
  /**
   * Current auth result
   */
  authResult: UAEPassAuthResult | null;
  
  /**
   * Reset auth state
   */
  reset: () => void;
}

/**
 * Hook for UAE Pass authentication
 * 
 * @param options - Callback options for success, error, and cancel
 * @returns Authentication methods and state
 * 
 * @example
 * ```typescript
 * const { authenticate, isLoading } = useUAEPassAuth({
 *   onSuccess: (result) => {
 *     console.log('Auth code:', result.authorizationCode);
 *   },
 *   onError: (error) => {
 *     console.error('Error:', error);
 *   },
 * });
 * ```
 */
export const useUAEPassAuth = (
  options?: UseUAEPassAuthOptions
): UseUAEPassAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [authResult, setAuthResult] = useState<UAEPassAuthResult | null>(null);

  const authenticate = useCallback(async (): Promise<UAEPassAuthResult> => {
    setIsLoading(true);
    setAuthResult(null);

    try {
      const config = getUAEPassConfig();
      
      // Prepare auth parameters
      const params = await prepareUAEPassAuth();
      
      if (params.useWebView) {
        // UAE Pass app IS installed - return params for WebView
        // The UI layer should handle WebView rendering
        const result: UAEPassAuthResult = {
          success: true,
          authorizationCode: undefined,
          state: params.state,
          codeVerifier: params.codeVerifier,
          details: {
            useWebView: true,
            authUrl: params.authUrl,
            redirectUri: params.redirectUri,
            expectedState: params.state,
          },
        };
        setAuthResult(result);
        setIsLoading(false);
        options?.onSuccess?.(result);
        return result;
      } else {
        // Browser flow
        const result = await authenticateWithUAEPassBrowser(
          params.authUrl,
          params.state,
          params.codeVerifier
        );
        setAuthResult(result);
        setIsLoading(false);
        
        if (result.success) {
          options?.onSuccess?.(result);
        } else if (result.error === 'User cancelled authentication') {
          options?.onCancel?.();
        } else {
          options?.onError?.(result.error || 'Authentication failed');
        }
        
        return result;
      }
    } catch (error) {
      const result: UAEPassAuthResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error',
      };
      setAuthResult(result);
      setIsLoading(false);
      options?.onError?.(result.error || 'Authentication failed');
      return result;
    }
  }, [options]);

  const checkAppInstalled = useCallback(async (): Promise<boolean> => {
    return await isUAEPassAppInstalled();
  }, []);

  const prepareForWebView = useCallback(async (): Promise<UAEPassWebViewAuthParams | null> => {
    try {
      const params = await prepareUAEPassAuth();
      if (params.useWebView) {
        return params;
      }
      return null;
    } catch (error) {
      console.error('Error preparing WebView params:', error);
      return null;
    }
  }, []);

  const exchangeCode = useCallback(async (params: {
    code: string;
    codeVerifier?: string;
    clientSecret?: string;
  }) => {
    const config = getUAEPassConfig();
    
    if (!config.tokenEndpoint) {
      throw new Error('Token endpoint not configured. Exchange should be done on backend.');
    }
    
    if (!params.clientSecret) {
      throw new Error('Client secret required for token exchange. This should be done on your backend for security.');
    }

    // Exchange code for tokens
    const tokenResult = await AuthSession.exchangeCodeAsync(
      {
        clientId: config.clientId,
        clientSecret: params.clientSecret,
        code: params.code,
        redirectUri: config.redirectUri,
        extraParams: params.codeVerifier
          ? { code_verifier: params.codeVerifier }
          : {},
      },
      {
        tokenEndpoint: config.tokenEndpoint,
      }
    );

    return tokenResult;
  }, []);

  const reset = useCallback(() => {
    setAuthResult(null);
    setIsLoading(false);
  }, []);

  return {
    authenticate,
    checkAppInstalled,
    exchangeCode,
    prepareForWebView,
    isLoading,
    authResult,
    reset,
  };
};

export default useUAEPassAuth;

