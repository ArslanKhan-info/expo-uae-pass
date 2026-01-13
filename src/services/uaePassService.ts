/**
 * UAE Pass Mobile Authentication Service
 * 
 * Self-contained service for UAE Pass authentication
 * Handles both app-to-app and browser flows
 */

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform, NativeModules } from 'react-native';
import {
  getUAEPassConfig,
  getUAEPassAppSchemes,
  getUAEPassEnvironment,
  UAE_PASS_ACR_VALUES,
} from '../config/uaePassConfig';
import type {
  UAEPassAuthResult,
  UAEPassWebViewAuthParams,
} from '../types';

// ==================== Security Helper Functions ====================

/**
 * Generate random state for CSRF protection
 */
const generateState = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Generate code verifier for PKCE (optional but recommended)
 */
const generateCodeVerifier = (): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvyz0123456789-._~';
  let verifier = '';
  for (let i = 0; i < 128; i++) {
    verifier += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return verifier;
};

// ==================== App Detection ====================

/**
 * Check if UAE Pass app is installed
 * Android: Check using native PackageManager
 * iOS: Check using URL scheme
 */
export const isUAEPassAppInstalled = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      // Android: Use native module to check via PackageManager
      const { UAEPassModule } = NativeModules;
      
      if (!UAEPassModule) {
        console.warn('UAEPassModule is not available. Make sure you have added the expo plugin.');
        return false;
      }
      
      const appSchemes = getUAEPassAppSchemes();
      const isInstalled = await UAEPassModule.isUAEPassInstalled(appSchemes.android);
      console.log(`Android: UAE Pass app installed: ${isInstalled}`, appSchemes.android);
      return isInstalled;
    } else {
      // iOS: Use URL scheme
      const appSchemes = getUAEPassAppSchemes();
      const canOpen = await Linking.canOpenURL(appSchemes.ios);
      console.log(`iOS: UAE Pass app installed: ${canOpen}`);
      return canOpen;
    }
  } catch (error) {
    console.error('Error checking UAE Pass app installation:', error);
    return false;
  }
};

// ==================== Authorization URL Builder ====================

/**
 * Build the authorization URL
 */
const buildAuthorizationURL = (params: {
  clientId: string;
  redirectUri: string;
  scopes: readonly string[];
  acrValue: string;
  state: string;
  codeVerifier?: string;
}): string => {
  const config = getUAEPassConfig();
  const { clientId, redirectUri, scopes, acrValue, state } = params;
  
  const queryParams = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    state: state,
    acr_values: acrValue,
    ui_locales: 'en', // or 'ar' for Arabic
  });
  
  return `${config.authorizationEndpoint}?${queryParams.toString()}`;
};

// ==================== Callback Parser ====================

/**
 * Parse the callback URL and extract authorization code
 */
const parseCallbackURL = (url: string, expectedState: string): UAEPassAuthResult => {
  try {
    // Handle custom scheme URLs
    const normalizedUrl = url.replace(/^[a-z]+:\/\//, 'https://');
    const parsedUrl = new URL(normalizedUrl);
    
    // Extract parameters
    const code = parsedUrl.searchParams.get('code');
    const state = parsedUrl.searchParams.get('state');
    const error = parsedUrl.searchParams.get('error');
    const errorDescription = parsedUrl.searchParams.get('error_description');
    
    // Check for errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return {
        success: false,
        error: errorDescription || error,
      };
    }
    
    // Validate state (CSRF protection)
    if (state !== expectedState) {
      console.error('State mismatch! Possible CSRF attack');
      return {
        success: false,
        error: 'Invalid state parameter',
      };
    }
    
    // Check if we have authorization code
    if (!code) {
      return {
        success: false,
        error: 'No authorization code received',
      };
    }
    
    console.log('✅ Authorization code received successfully');
    
    return {
      success: true,
      authorizationCode: code,
      state: state,
    };
    
  } catch (error) {
    console.error('Error parsing callback URL:', error);
    return {
      success: false,
      error: 'Failed to parse callback URL',
      details: error,
    };
  }
};

// ==================== Prepare Auth Params ====================

/**
 * Prepare authentication parameters for UAE Pass
 * 
 * When UAE Pass app IS installed:
 * - Returns useWebView: true
 * - UI layer should show WebView component
 * 
 * When UAE Pass app is NOT installed:
 * - Returns useWebView: false  
 * - Uses browser-based flow
 */
export const prepareUAEPassAuth = async (): Promise<UAEPassWebViewAuthParams> => {
  const config = getUAEPassConfig();
  
  // Check if UAE Pass app is installed
  const appInstalled = await isUAEPassAppInstalled();
  console.log(`UAE Pass app installed: ${appInstalled}`);
  
  // Determine ACR value based on app availability
  const acrValue = appInstalled 
    ? UAE_PASS_ACR_VALUES.MOBILE_ON_DEVICE 
    : UAE_PASS_ACR_VALUES.LOW;
  
  console.log(`Using ACR value: ${acrValue}`);
  
  // Generate security parameters
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  
  // Build authorization URL
  const authUrl = buildAuthorizationURL({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scopes: config.scopes || [],
    acrValue,
    state,
  });
  
  console.log('📋 Authorization URL:', authUrl);
  console.log('📋 Redirect URI:', config.redirectUri);
  console.log('📋 Use WebView:', appInstalled);
  
  return {
    authUrl,
    redirectUri: config.redirectUri,
    state,
    codeVerifier,
    acrValue,
    useWebView: appInstalled,
  };
};

// ==================== Browser Authentication ====================

/**
 * Browser-based authentication flow
 * Used when UAE Pass app is NOT installed
 */
export const authenticateWithUAEPassBrowser = async (
  authUrl: string,
  state: string,
  codeVerifier: string
): Promise<UAEPassAuthResult> => {
  console.log('Opening authentication in browser...');
  const config = getUAEPassConfig();
  
  // Set up deep link listener BEFORE opening URL
  const authCodePromise = new Promise<UAEPassAuthResult>((resolve) => {
    const subscription = Linking.addEventListener('url', (event: Linking.EventType) => {
      console.log('Deep link received:', event.url);
      
      // Parse the callback URL
      const result = parseCallbackURL(event.url, state);
      
      // Add code verifier to result for PKCE
      if (result.success) {
        result.codeVerifier = codeVerifier;
      }
      
      // Clean up listener
      subscription.remove();
      
      // Resolve with result
      resolve(result);
    });
    
    // Timeout after 5 minutes
    setTimeout(() => {
      subscription.remove();
      resolve({
        success: false,
        error: 'Authentication timeout',
      });
    }, 5 * 60 * 1000);
  });
  
  // Use WebBrowser.openAuthSessionAsync for browser flow
  const browserResult = await WebBrowser.openAuthSessionAsync(
    authUrl,
    config.redirectUri
  );
  
  console.log('Browser result type:', browserResult.type);
  
  // Handle different browser result types
  if (browserResult.type === 'success' && browserResult.url) {
    console.log('✅ Got direct URL from browser:', browserResult.url);
    const result = parseCallbackURL(browserResult.url, state);
    if (result.success) {
      result.codeVerifier = codeVerifier;
    }
    return result;
  }
  
  if (browserResult.type === 'cancel') {
    console.log('❌ User cancelled authentication');
    return {
      success: false,
      error: 'User cancelled authentication',
    };
  }
  
  if (browserResult.type === 'dismiss') {
    console.log('⏳ Browser dismissed - waiting for deep link callback...');
    // Browser was dismissed, wait for deep link callback
    const result = await authCodePromise;
    return result;
  }
  
  // Otherwise wait for deep link callback
  console.log('⏳ Waiting for deep link callback...');
  const result = await authCodePromise;
  
  console.log('Authentication result:', result.success ? 'SUCCESS' : 'FAILED');
  
  return result;
};

// ==================== Direct App Launch (Android) ====================

/**
 * Build UAE Pass app deep link URL for direct app-to-app authentication
 */
const buildUAEPassAppDeepLink = (params: {
  authUrl: string;
  successUrl: string;
  failureUrl: string;
}): string => {
  const { authUrl, successUrl, failureUrl } = params;
  const env = getUAEPassEnvironment();
  const uaePassScheme = env === 'production' ? 'uaepass' : 'uaepassstg';
  
  const encodedAuthUrl = encodeURIComponent(authUrl);
  const encodedSuccessUrl = encodeURIComponent(successUrl);
  const encodedFailureUrl = encodeURIComponent(failureUrl);
  
  return `${uaePassScheme}://idshub/authorize?spUrl=${encodedAuthUrl}&successURL=${encodedSuccessUrl}&failureURL=${encodedFailureUrl}`;
};

/**
 * Authenticate using direct UAE Pass app launch (Android)
 */
const authenticateWithUAEPassApp = async (
  authUrl: string,
  state: string,
  codeVerifier: string
): Promise<UAEPassAuthResult> => {
  console.log('📱 Opening UAE Pass app directly...');
  const config = getUAEPassConfig();
  const appSchemes = getUAEPassAppSchemes();
  
  // Set up deep link listener BEFORE opening UAE Pass app
  const authCodePromise = new Promise<UAEPassAuthResult>((resolve) => {
    const subscription = Linking.addEventListener('url', (event: Linking.EventType) => {
      console.log('📱 Deep link received from UAE Pass app:', event.url);
      
      // Check if this is our callback
      if (event.url.includes(config.redirectUri) || event.url.includes('code=')) {
        // Parse the callback URL
        const result = parseCallbackURL(event.url, state);
        
        // Add code verifier to result for PKCE
        if (result.success) {
          result.codeVerifier = codeVerifier;
        }
        
        // Clean up listener
        subscription.remove();
        
        // Resolve with result
        resolve(result);
      }
    });
    
    // Timeout after 5 minutes
    setTimeout(() => {
      subscription.remove();
      resolve({
        success: false,
        error: 'Authentication timeout - UAE Pass app did not respond',
      });
    }, 5 * 60 * 1000);
  });
  
  // Try using native module for Android
  if (Platform.OS === 'android') {
    const { UAEPassModule } = NativeModules;
    
    if (UAEPassModule?.openUAEPassWithIntent) {
      console.log('📱 Using native module to open UAE Pass app...');
      try {
        await UAEPassModule.openUAEPassWithIntent(
          authUrl,
          config.redirectUri,
          appSchemes.android
        );
        console.log('📱 Native module opened UAE Pass app, waiting for callback...');
        const result = await authCodePromise;
        return result;
      } catch (error) {
        console.log('📱 Native module launch failed:', error);
      }
    }
    
    // Try launchUAEPassApp method
    if (UAEPassModule?.launchUAEPassApp) {
      console.log('📱 Trying launchUAEPassApp...');
      const deepLinkUrl = buildUAEPassAppDeepLink({
        authUrl,
        successUrl: config.redirectUri,
        failureUrl: `${config.redirectUri}?error=cancelled`,
      });
      
      try {
        await UAEPassModule.launchUAEPassApp(appSchemes.android, deepLinkUrl);
        console.log('📱 Launched UAE Pass app, waiting for callback...');
        const result = await authCodePromise;
        return result;
      } catch (error) {
        console.log('📱 launchUAEPassApp failed:', error);
      }
    }
  }
  
  // Fallback: Try Linking API methods
  console.log('📱 Trying Linking API methods...');
  
  const env = getUAEPassEnvironment();
  const uaePassScheme = env === 'production' ? 'uaepass' : 'uaepassstg';
  const deepLinkUrl = buildUAEPassAppDeepLink({
    authUrl,
    successUrl: config.redirectUri,
    failureUrl: `${config.redirectUri}?error=cancelled`,
  });
  
  console.log('📱 Trying UAE Pass deep link:', deepLinkUrl);
  
  try {
    const canOpen = await Linking.canOpenURL(`${uaePassScheme}://`);
    console.log('📱 Can open UAE Pass scheme:', canOpen);
    
    if (canOpen) {
      await Linking.openURL(deepLinkUrl);
      console.log('📱 Opened UAE Pass app via Linking, waiting for callback...');
      const result = await authCodePromise;
      return result;
    }
  } catch (error) {
    console.log('📱 Failed to open with deep link:', error);
  }
  
  // If all direct methods fail, fall back to browser
  console.log('⚠️ All direct app launch methods failed, falling back to browser...');
  return authenticateWithUAEPassBrowser(authUrl, state, codeVerifier);
};

// ==================== Main Authentication Function ====================

/**
 * Main UAE Pass Authentication Function
 * 
 * This function handles BOTH flows:
 * 1. Direct app launch (when UAE Pass app IS installed)
 * 2. Browser flow (when UAE Pass app is NOT installed)
 */
export const authenticateWithUAEPass = async (): Promise<UAEPassAuthResult> => {
  try {
    console.log('=== UAE Pass Authentication Started ===');
    
    // 1. Check if UAE Pass app is installed
    const appInstalled = await isUAEPassAppInstalled();
    console.log(`UAE Pass app installed: ${appInstalled}`);
    
    // 2. Determine ACR value based on app availability
    const acrValue = appInstalled 
      ? UAE_PASS_ACR_VALUES.MOBILE_ON_DEVICE 
      : UAE_PASS_ACR_VALUES.LOW;
    
    console.log(`Using ACR value: ${acrValue}`);
    
    // 3. Generate security parameters
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    
    // 4. Build authorization URL
    const config = getUAEPassConfig();
    const authUrl = buildAuthorizationURL({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes || [],
      acrValue,
      state,
    });
    
    console.log('📋 Authorization URL:', authUrl);
    console.log('📋 Redirect URI:', config.redirectUri);
    
    // 5. DIFFERENT FLOW BASED ON APP INSTALLATION
    if (appInstalled && Platform.OS === 'android') {
      // Android: Try direct app launch
      return await authenticateWithUAEPassApp(authUrl, state, codeVerifier);
    } else {
      // Browser-only flow: UAE Pass app is NOT installed or iOS
      console.log('🌐 Using browser flow');
      return await authenticateWithUAEPassBrowser(authUrl, state, codeVerifier);
    }
    
  } catch (error) {
    console.error('UAE Pass authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication error',
      details: error,
    };
  }
};

export default {
  authenticateWithUAEPass,
  authenticateWithUAEPassBrowser,
  prepareUAEPassAuth,
  isUAEPassAppInstalled,
};

