/**
 * MAIN ENTRY POINT - Awakening Protocol Mobile Game
 *
 * This is the root entry point for the React Native application.
 * It registers the app with AppRegistry and initializes all necessary
 * providers and configurations.
 *
 * Flow:
 * 1. Uses MemoryStorage (pure JS, no native dependencies)
 * 2. Registers app with AppRegistry
 * 3. Loads RootNavigator (handles Tutorial vs Main App routing)
 * 4. Wraps in GestureHandlerRootView for gesture support
 * 5. Ready for full navigation and game functionality
 *
 * @version 1.0.2
 */

// URL Polyfill for Hermes (required for Supabase)
import 'react-native-url-polyfill/auto';

import { AppRegistry } from 'react-native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Main navigation root
import RootNavigator from './src/navigation/RootNavigator';

// App name from app.json
import { name as appName } from './app.json';

/**
 * App wrapper component
 * Initializes gesture handler context and main navigation
 */
function AppEntry() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigator />
    </GestureHandlerRootView>
  );
}

// Register the app with React Native's AppRegistry
// This is required for all React Native applications
AppRegistry.registerComponent(appName, () => AppEntry);
