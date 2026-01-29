/**
 * Expo Config Plugin: Add Android Queries for UAE Pass
 * Allows the app to check if UAE Pass app is installed and open it via deep link
 * 
 * Required for Android 11+ (API 30+) package visibility
 */

const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Add queries to AndroidManifest.xml for UAE Pass app detection and deep linking
 */
function withAndroidQueries(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Check if queries already exist
    if (!androidManifest.queries) {
      androidManifest.queries = [];
    }

    // Ensure queries is an array
    if (!Array.isArray(androidManifest.queries)) {
      androidManifest.queries = [androidManifest.queries];
    }

    // Get or create the first queries element
    let queries = androidManifest.queries[0];
    if (!queries) {
      queries = {};
      androidManifest.queries[0] = queries;
    }

    // Add package queries for UAE Pass app detection
    if (!queries.package) {
      queries.package = [];
    }

    const uaePassPackages = [
      { $: { 'android:name': 'ae.uaepass.mainapp' } }, // Production
      { $: { 'android:name': 'ae.uaepass.mainapp.stg' } }, // Staging
      { $: { 'android:name': 'ae.uaepass.mainapp.dev' } }, // Development
    ];

    // Add packages if they don't already exist
    uaePassPackages.forEach((pkg) => {
      const packageName = pkg.$['android:name'];
      const exists = queries.package.some(
        (existingPkg) => existingPkg.$?.['android:name'] === packageName
      );
      if (!exists) {
        queries.package.push(pkg);
      }
    });

    // Add intent queries for UAE Pass deep link schemes (required for Android 11+)
    if (!queries.intent) {
      queries.intent = [];
    }

    // UAE Pass staging scheme intent (scheme only - covers all hosts)
    const uaePassStagingIntent = {
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      data: [{ $: { 'android:scheme': 'uaepassstg' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
      ],
    };

    // UAE Pass production scheme intent (scheme only - covers all hosts)
    const uaePassProductionIntent = {
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      data: [{ $: { 'android:scheme': 'uaepass' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
      ],
    };

    // Check if intents already exist before adding
    const hasStgIntent = queries.intent.some(
      (intent) => intent.data?.[0]?.$?.['android:scheme'] === 'uaepassstg'
    );
    const hasProdIntent = queries.intent.some(
      (intent) => intent.data?.[0]?.$?.['android:scheme'] === 'uaepass'
    );

    if (!hasStgIntent) {
      queries.intent.push(uaePassStagingIntent);
    }
    if (!hasProdIntent) {
      queries.intent.push(uaePassProductionIntent);
    }

    console.log('✅ Added UAE Pass package and intent queries to AndroidManifest.xml');

    return config;
  });
}

module.exports = withAndroidQueries;

