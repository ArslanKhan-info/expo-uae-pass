/**
 * Expo Config Plugin: Add UAE Pass Native Module
 * Package: expo-uae-pass
 * 
 * This plugin automatically adds the UAE Pass native module to Android projects
 * Creates Kotlin files for checking if UAE Pass app is installed
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Kotlin code for UAE Pass Module
 * Note: Package name will be dynamically determined from the project
 */
const UAEPassModuleKt = `package PACKAGE_NAME_PLACEHOLDER

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class UAEPassModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "UAEPassModule"
    }

    @ReactMethod
    fun isUAEPassInstalled(packageName: String, promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            pm.getApplicationInfo(packageName, 0)
            promise.resolve(true)
        } catch (e: PackageManager.NameNotFoundException) {
            promise.resolve(false)
        } catch (e: Exception) {
            promise.reject("ERROR", "Error checking app installation: \${e.message}", e)
        }
    }

    @ReactMethod
    fun launchUAEPassApp(packageName: String, deepLinkUrl: String, promise: Promise) {
        try {
            val activity = currentActivity
            if (activity == null) {
                promise.reject("ERROR", "Activity is null")
                return
            }

            // Try to launch with deep link first
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLinkUrl))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            
            // Try to set the package to ensure it opens in UAE Pass app
            try {
                val pm = reactApplicationContext.packageManager
                pm.getApplicationInfo(packageName, 0)
                intent.setPackage(packageName)
            } catch (e: PackageManager.NameNotFoundException) {
                // Package not found, try without package restriction
            }

            activity.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Error launching UAE Pass app: \${e.message}", e)
        }
    }

    @ReactMethod
    fun openUAEPassWithIntent(authUrl: String, callbackUrl: String, packageName: String, promise: Promise) {
        try {
            val activity = currentActivity
            if (activity == null) {
                promise.reject("ERROR", "Activity is null")
                return
            }

            // Create intent to open UAE Pass app with the authorization URL
            val scheme = if (packageName.contains(".stg")) "uaepassstg" else "uaepass"
            
            // Build the UAE Pass deep link with callback URLs
            val successCallback = Uri.encode(callbackUrl)
            val failureCallback = Uri.encode(callbackUrl + "?error=cancelled")
            
            val uaePassUrl = "\${scheme}://idshub/authorize?" +
                "spUrl=" + Uri.encode(authUrl) +
                "&successURL=" + successCallback +
                "&failureURL=" + failureCallback

            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uaePassUrl))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            intent.setPackage(packageName)

            activity.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            // If direct launch fails, try with just the scheme
            try {
                val scheme = if (packageName.contains(".stg")) "uaepassstg" else "uaepass"
                val fallbackIntent = Intent(Intent.ACTION_VIEW, Uri.parse("\${scheme}://"))
                fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                currentActivity?.startActivity(fallbackIntent)
                promise.resolve(true)
            } catch (e2: Exception) {
                promise.reject("ERROR", "Error launching UAE Pass: \${e2.message}", e2)
            }
        }
    }
}
`;

/**
 * Kotlin code for UAE Pass Package
 */
const UAEPassPackageKt = `package PACKAGE_NAME_PLACEHOLDER

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class UAEPassPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(UAEPassModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

/**
 * Get package name from Android project
 */
function getPackageName(projectRoot) {
  try {
    const buildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
    if (fs.existsSync(buildGradlePath)) {
      const content = fs.readFileSync(buildGradlePath, 'utf-8');
      const match = content.match(/namespace\s+['"]([^'"]+)['"]/) || content.match(/applicationId\s+['"]([^'"]+)['"]/);
      if (match) {
        return match[1];
      }
    }
  } catch (error) {
    console.warn('Could not read package name from build.gradle:', error);
  }
  
  // Fallback to default
  return 'com.yourapp';
}

/**
 * Convert package name to directory path
 */
function packageToPath(packageName) {
  return packageName.split('.').join(path.sep);
}

/**
 * Add UAE Pass native module files to Android project
 */
function withUAEPassModule(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageName = getPackageName(projectRoot);
      const packagePath = packageToPath(packageName);
      
      const androidProjectPath = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        packagePath
      );

      // Ensure directory exists
      if (!fs.existsSync(androidProjectPath)) {
        fs.mkdirSync(androidProjectPath, { recursive: true });
      }

      // Replace package name placeholder
      const moduleCode = UAEPassModuleKt.replace(/PACKAGE_NAME_PLACEHOLDER/g, packageName);
      const packageCode = UAEPassPackageKt.replace(/PACKAGE_NAME_PLACEHOLDER/g, packageName);

      // Write UAEPassModule.kt
      const moduleFilePath = path.join(androidProjectPath, 'UAEPassModule.kt');
      fs.writeFileSync(moduleFilePath, moduleCode, 'utf-8');
      console.log('✅ Created UAEPassModule.kt');

      // Write UAEPassPackage.kt
      const packageFilePath = path.join(androidProjectPath, 'UAEPassPackage.kt');
      fs.writeFileSync(packageFilePath, packageCode, 'utf-8');
      console.log('✅ Created UAEPassPackage.kt');

      // Try to modify MainApplication.kt to register the package
      const mainApplicationPath = path.join(androidProjectPath, 'MainApplication.kt');
      
      if (fs.existsSync(mainApplicationPath)) {
        let mainApplicationContent = fs.readFileSync(mainApplicationPath, 'utf-8');
        
        const importStatement = `import ${packageName}.UAEPassPackage`;
        if (!mainApplicationContent.includes(importStatement)) {
          // Add import after the last existing import
          mainApplicationContent = mainApplicationContent.replace(
            /import com\.facebook\.react\.soloader\.OpenSourceMergedSoMapping\n/,
            (match) => `${match}${importStatement}\n`
          );
        }

        // Inject package registration into getPackages()
        if (!mainApplicationContent.includes('packages.add(UAEPassPackage())')) {
          mainApplicationContent = mainApplicationContent.replace(
            /val packages = PackageList\(this\)\.packages/,
            'val packages = PackageList(this).packages\n            packages.add(UAEPassPackage())'
          );
        }

        if (!mainApplicationContent.includes('packages.add(UAEPassPackage())')) {
          console.warn('⚠️  Could not automatically register UAEPassPackage. Please manually add:');
          console.warn(`   ${importStatement}`);
          console.warn('   packages.add(UAEPassPackage())');
        } else {
          fs.writeFileSync(mainApplicationPath, mainApplicationContent, 'utf-8');
          console.log('✅ Registered UAEPassPackage in MainApplication.kt');
        }
      } else {
        console.warn('⚠️  MainApplication.kt not found. Please manually register UAEPassPackage.');
      }

      return config;
    },
  ]);
}

module.exports = withUAEPassModule;

