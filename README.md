# expo-uae-pass

UAE Pass authentication for React Native/Expo apps with support for **app-to-app** and **app-to-web** flows.

- **App-to-app**: When the UAE Pass app **is installed**, the library opens the UAE Pass app for authentication (better UX, native flow).
- **App-to-web**: When the UAE Pass app **is not installed**, the library falls back to the browser (web) for authentication.

Both flows are handled by the same API: use `useUAEPassAuth` together with the `UAEPassWebViewAuth` component. This is the only pattern that works correctly for both scenarios.

## Features

- ✅ Configurable staging and production environments
- ✅ Automatic detection of UAE Pass app installation
- ✅ App-to-app: WebView-based flow when UAE Pass app is installed
- ✅ App-to-web: Browser-based fallback when UAE Pass app is not installed
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

**Option A: Use the combined plugin (recommended)**

```javascript
export default {
  expo: {
    plugins: [
      // ... other plugins
      "expo-uae-pass/expo-plugin"    // Includes both required plugins
    ]
  }
};
```

**Option B: Use individual plugins**

```javascript
export default {
  expo: {
    plugins: [
      // ... other plugins
      "expo-uae-pass/expo-plugin/withUAEPassModule",    // Native module for app detection
      "expo-uae-pass/expo-plugin/withAndroidQueries"    // Android 11+ package visibility
    ]
  }
};
```

**What the plugins do:**
- `withUAEPassModule` - Creates native modules for checking/launching UAE Pass app
- `withAndroidQueries` - Adds Android manifest queries (required for Android 11+ to detect installed apps)
- Combined plugin applies both automatically

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

### Basic Usage with Hook + WebView (recommended)

Use **both** `useUAEPassAuth` and `UAEPassWebViewAuth` together. This is the only way that works correctly for **app-to-app** (UAE Pass app installed) and **app-to-web** (browser fallback).

- When UAE Pass app **is installed**: the hook returns `result.details?.useWebView` and you show `UAEPassWebViewAuth` with the returned params; the user completes auth in the app.
- When UAE Pass app **is not installed**: the hook completes in the browser and returns `result.success && result.authorizationCode`; you exchange the code and continue.

```typescript
import { useUAEPassAuth, UAEPassWebViewAuth } from 'expo-uae-pass';
import { useState, useRef, useEffect } from 'react';

const LoginScreen = () => {
  const [webViewParams, setWebViewParams] = useState(null);
  const codeVerifierRef = useRef(undefined);

  const uaePassAuth = useUAEPassAuth({
    onSuccess: async (result) => {
      if (result.details?.useWebView) {
        // App-to-app: UAE Pass app is installed — show WebView
        codeVerifierRef.current = result.codeVerifier;
        setWebViewParams({
          visible: true,
          authUrl: result.details.authUrl,
          redirectUri: result.details.redirectUri,
          expectedState: result.details.expectedState,
          onSuccess: (code, state) => {
            setWebViewParams(null);
            exchangeCodeAndLogin(code, codeVerifierRef.current);
          },
          onCancel: () => setWebViewParams(null),
          onError: (error) => {
            setWebViewParams(null);
            Alert.alert('Error', error);
          },
        });
      } else if (result.success && result.authorizationCode) {
        // App-to-web: browser flow — already have the code
        await exchangeCodeAndLogin(result.authorizationCode, result.codeVerifier);
      }
    },
    onError: (error) => Alert.alert('Error', error),
    onCancel: () => console.log('User cancelled'),
  });

  const exchangeCodeAndLogin = async (code, codeVerifier) => {
    // Exchange code for tokens (prefer doing this on your backend)
    const tokenResult = await uaePassAuth.exchangeCode({
      code,
      codeVerifier,
      clientSecret: 'YOUR_CLIENT_SECRET', // Prefer backend exchange
    });
    // Then call your backend / login mutation with tokenResult or user info
  };

  return (
    <>
      <Button
        title="Login with UAE Pass"
        onPress={uaePassAuth.authenticate}
        disabled={uaePassAuth.isLoading}
      />
      {uaePassAuth.isLoading && <ActivityIndicator />}
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

### Native Module Not Found ("UAEPassModule is not available")

The plugin creates `UAEPassModule.kt` and `UAEPassPackage.kt`, but **the package must be registered in `MainApplication.kt`** or the module won't be available at runtime.

1. **Use only one plugin** in `app.config.js`:
   ```javascript
   plugins: ["expo-uae-pass/expo-plugin"]   // This applies both withUAEPassModule and withAndroidQueries
   ```
   Do **not** add both `"expo-uae-pass/expo-plugin"` and `"expo-uae-pass/expo-plugin/withUAEPassModule"`.

2. **Check registration in MainApplication.kt**  
   Open `android/app/src/main/java/<your-package>/MainApplication.kt`. You must have:
   - An import: `import <your-package>.UAEPassPackage`
   - Inside the `PackageList(this).packages.apply { }` block (or in `getPackages()`): `add(UAEPassPackage())`

3. **If the plugin didn't patch MainApplication.kt**, add it manually:
   - Add: `import <your-package>.UAEPassPackage` (e.g. `import com.aradiagent.UAEPassPackage`).
   - Inside the `apply { }` block (where it says "Packages that cannot be autolinked..."), add a new line: `add(UAEPassPackage())`.

4. Run `npx expo prebuild --clean` and rebuild. If you already prebuilt, update the package to the latest version (with the improved plugin) and run prebuild again, or apply the MainApplication.kt changes manually.

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

