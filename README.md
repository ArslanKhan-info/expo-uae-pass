# expo-uae-pass

UAE Pass authentication for React Native/Expo apps with support for both app-to-app and web authentication flows.

## Features

- ✅ Configurable staging and production environments
- ✅ Automatic detection of UAE Pass app installation
- ✅ WebView-based app-to-app authentication (when app installed)
- ✅ Browser-based fallback authentication (when app not installed)
- ✅ TypeScript support
- ✅ Expo config plugin for automatic native module setup
- ✅ Self-contained with no external project dependencies

## Installation

```bash
npm install expo-uae-pass
```

or with yarn:

```bash
yarn add expo-uae-pass
```

## Setup

### 1. Add Expo Plugin

Add the plugin to your `app.config.js` or `app.json`:

```javascript
export default {
  expo: {
    plugins: [
      // ... other plugins
      "expo-uae-pass/expo-plugin/withUAEPassModule"
    ]
  }
};
```

### 2. Configure Deep Links

Make sure your app has the proper deep link configuration. In your `app.config.js`:

```javascript
export default {
  expo: {
    scheme: "yourapp", // Your app scheme
    ios: {
      infoPlist: {
        LSApplicationQueriesSchemes: [
          "uaepass",
          "uaepassstg"
        ]
      }
    },
    android: {
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "yourapp",
              host: "auth"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
};
```

### 3. Initialize Configuration

Configure UAE Pass in your app initialization (e.g., `App.tsx`):

```typescript
import { configureUAEPass } from 'expo-uae-pass';

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
}, {
  // Optional: Override app schemes if needed
  staging: {
    ios: 'uaepassstg://',
    android: 'ae.uaepass.mainapp.stg',
  },
  production: {
    ios: 'uaepass://',
    android: 'ae.uaepass.mainapp',
  },
});
```

## Usage

### Basic Usage with Hook

```typescript
import { useUAEPassAuth } from 'expo-uae-pass';

const LoginScreen = () => {
  const uaePassAuth = useUAEPassAuth({
    onSuccess: async (result) => {
      if (result.success && result.authorizationCode) {
        // Send authorization code to your backend
        await socialLoginMutation.mutate({
          provider: 'uae',
          id_token: result.authorizationCode,
          code_verifier: result.codeVerifier,
          // ... other params
        });
      }
    },
    onError: (error) => {
      Alert.alert('Error', error);
    },
    onCancel: () => {
      console.log('User cancelled');
    },
  });

  return (
    <Button
      title="Login with UAE Pass"
      onPress={uaePassAuth.authenticate}
      loading={uaePassAuth.isLoading}
    />
  );
};
```

### Advanced Usage with WebView Component

When UAE Pass app IS installed, you can use the WebView component for better UX:

```typescript
import { useUAEPassAuth, UAEPassWebViewAuth } from 'expo-uae-pass';
import { useState } from 'react';

const LoginScreen = () => {
  const [webViewParams, setWebViewParams] = useState(null);
  const uaePassAuth = useUAEPassAuth({
    onSuccess: async (result) => {
      if (result.details?.useWebView) {
        // Show WebView component
        setWebViewParams({
          visible: true,
          authUrl: result.details.authUrl,
          redirectUri: result.details.redirectUri,
          expectedState: result.details.expectedState,
          onSuccess: (code, state) => {
            // Handle success
            setWebViewParams(null);
            console.log('Auth code:', code);
          },
          onCancel: () => {
            setWebViewParams(null);
          },
          onError: (error) => {
            setWebViewParams(null);
            Alert.alert('Error', error);
          },
        });
      } else {
        // Browser flow - already handled
        console.log('Auth code:', result.authorizationCode);
      }
    },
  });

  return (
    <>
      <Button
        title="Login with UAE Pass"
        onPress={uaePassAuth.authenticate}
        loading={uaePassAuth.isLoading}
      />
      
      {webViewParams && <UAEPassWebViewAuth {...webViewParams} />}
    </>
  );
};
```

### Direct Service Usage

For advanced use cases, you can use the service functions directly:

```typescript
import {
  authenticateWithUAEPass,
  prepareUAEPassAuth,
  isUAEPassAppInstalled,
} from 'expo-uae-pass';

// Check if app is installed
const appInstalled = await isUAEPassAppInstalled();

// Prepare auth params
const params = await prepareUAEPassAuth();

// Authenticate
const result = await authenticateWithUAEPass();
```

## API Reference

### `configureUAEPass(config, appSchemes?)`

Initialize UAE Pass configuration.

**Parameters:**
- `config`: `UAEPassConfig` - Configuration object
- `appSchemes?`: `Partial<UAEPassAppSchemes>` - Optional app schemes override

**Config Options:**
- `environment`: `'staging' | 'production'` - Environment
- `clientId`: `string` - UAE Pass client ID
- `redirectUri`: `string` - Your app's redirect URI
- `authorizationEndpoint`: `string` - Authorization endpoint URL
- `tokenEndpoint?`: `string` - Token endpoint (optional, for direct exchange)
- `userInfoEndpoint?`: `string` - User info endpoint (optional)
- `scopes?`: `string[]` - OAuth scopes (defaults to profile scope)
- `channelName?`: `string` - Channel name for UAE Pass

### `useUAEPassAuth(options?)`

React hook for UAE Pass authentication.

**Returns:**
- `authenticate()`: Start authentication
- `checkAppInstalled()`: Check if UAE Pass app is installed
- `exchangeCode(params)`: Exchange authorization code for tokens
- `prepareForWebView()`: Prepare params for WebView component
- `isLoading`: Loading state
- `authResult`: Current auth result
- `reset()`: Reset auth state

### `UAEPassWebViewAuth`

React component for WebView-based authentication.

**Props:**
- `visible`: `boolean` - Whether modal is visible
- `authUrl`: `string` - Authorization URL
- `redirectUri`: `string` - Redirect URI
- `expectedState`: `string` - Expected state for CSRF protection
- `onSuccess`: `(code: string, state: string) => void` - Success callback
- `onCancel`: `() => void` - Cancel callback
- `onError`: `(error: string) => void` - Error callback

## Configuration Examples

### Staging Configuration

```typescript
configureUAEPass({
  environment: 'staging',
  clientId: 'your_staging_client_id',
  redirectUri: 'yourapp://auth/uaepass',
  authorizationEndpoint: 'https://stg-id.uaepass.ae/idshub/authorize',
  tokenEndpoint: 'https://stg-id.uaepass.ae/idshub/token',
  userInfoEndpoint: 'https://stg-id.uaepass.ae/idshub/userinfo',
});
```

### Production Configuration

```typescript
configureUAEPass({
  environment: 'production',
  clientId: 'your_production_client_id',
  redirectUri: 'yourapp://auth/uaepass',
  authorizationEndpoint: 'https://id.uaepass.ae/idshub/authorize',
  tokenEndpoint: 'https://id.uaepass.ae/idshub/token',
  userInfoEndpoint: 'https://id.uaepass.ae/idshub/userinfo',
});
```

## Troubleshooting

### Native Module Not Found

If you get "UAEPassModule is not available", make sure:
1. You've added the expo plugin to `app.config.js`
2. You've run `npx expo prebuild` or rebuilt your app
3. The native module files were created in `android/app/src/main/java/...`

### Deep Link Not Working

Make sure:
1. Your `scheme` in `app.config.js` matches your `redirectUri`
2. You've added intent filters for Android
3. You've added `LSApplicationQueriesSchemes` for iOS

### WebView Not Opening UAE Pass App

This is expected behavior. The WebView intercepts the UAE Pass deep link and opens the app using `Linking.openURL()`. Make sure:
1. UAE Pass app is installed
2. Your app has the correct scheme queries configured

## Security Notes

- ⚠️ **Never store client secret in your mobile app**
- ⚠️ Token exchange should be done on your backend
- ⚠️ Authorization codes are short-lived - exchange them immediately
- ⚠️ Always validate the state parameter to prevent CSRF attacks

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

