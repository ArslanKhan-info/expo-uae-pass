/**
 * Example Usage of expo-uae-pass
 * 
 * This file demonstrates how to use the package in your app
 */

import React, { useState } from 'react';
import { View, Button, Alert, ActivityIndicator } from 'react-native';
import {
  configureUAEPass,
  useUAEPassAuth,
  UAEPassWebViewAuth,
} from 'expo-uae-pass';

// ==================== Step 1: Configure (in App.tsx or index.ts) ====================

// Configure once at app startup
configureUAEPass({
  environment: __DEV__ ? 'staging' : 'production',
  clientId: 'your_client_id',
  redirectUri: 'yourapp://auth/uaepass',
  authorizationEndpoint: __DEV__
    ? 'https://stg-id.uaepass.ae/idshub/authorize'
    : 'https://id.uaepass.ae/idshub/authorize',
  tokenEndpoint: __DEV__
    ? 'https://stg-id.uaepass.ae/idshub/token'
    : 'https://id.uaepass.ae/idshub/token',
  userInfoEndpoint: __DEV__
    ? 'https://stg-id.uaepass.ae/idshub/userinfo'
    : 'https://id.uaepass.ae/idshub/userinfo',
  scopes: ['urn:uae:digitalid:profile:general'],
  channelName: 'Your App Name',
});

// ==================== Step 2: Use in Your Login Screen ====================

const LoginScreen = () => {
  const [webViewProps, setWebViewProps] = useState<any>(null);

  // Use the hook
  const uaePassAuth = useUAEPassAuth({
    onSuccess: async (result) => {
      if (result.details?.useWebView) {
        // UAE Pass app IS installed - show WebView
        setWebViewProps({
          visible: true,
          authUrl: result.details.authUrl,
          redirectUri: result.details.redirectUri,
          expectedState: result.details.expectedState,
          onSuccess: async (code: string, state: string) => {
            setWebViewProps(null);
            console.log('✅ Authorization code received:', code);
            
            // Send to your backend
            // await sendToBackend({ code, state, codeVerifier: result.codeVerifier });
            
            Alert.alert('Success', 'UAE Pass authentication successful!');
          },
          onCancel: () => {
            setWebViewProps(null);
            console.log('User cancelled');
          },
          onError: (error: string) => {
            setWebViewProps(null);
            Alert.alert('Error', error);
          },
        });
      } else if (result.success && result.authorizationCode) {
        // Browser flow - already got the code
        console.log('✅ Authorization code received:', result.authorizationCode);
        
        // Send to your backend
        // await sendToBackend({
        //   code: result.authorizationCode,
        //   state: result.state,
        //   codeVerifier: result.codeVerifier,
        // });
        
        Alert.alert('Success', 'UAE Pass authentication successful!');
      }
    },
    onError: (error) => {
      Alert.alert('Error', error);
    },
    onCancel: () => {
      console.log('User cancelled authentication');
    },
  });

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button
        title="Login with UAE Pass"
        onPress={uaePassAuth.authenticate}
        disabled={uaePassAuth.isLoading}
      />
      
      {uaePassAuth.isLoading && (
        <ActivityIndicator style={{ marginTop: 20 }} />
      )}
      
      {/* WebView Modal */}
      {webViewProps && <UAEPassWebViewAuth {...webViewProps} />}
    </View>
  );
};

// ==================== Alternative: Direct Service Usage ====================

import {
  authenticateWithUAEPass,
  isUAEPassAppInstalled,
} from 'expo-uae-pass';

const directAuthExample = async () => {
  // Check if app is installed
  const appInstalled = await isUAEPassAppInstalled();
  console.log('UAE Pass app installed:', appInstalled);
  
  // Authenticate
  const result = await authenticateWithUAEPass();
  
  if (result.success && result.authorizationCode) {
    console.log('Authorization code:', result.authorizationCode);
    // Send to backend
  } else {
    console.error('Authentication failed:', result.error);
  }
};

export default LoginScreen;

