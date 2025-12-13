/**
 * MAIN ENTRY POINT - Awakening Protocol Mobile Game
 *
 * This is the root entry point for the React Native application.
 * It registers the app with AppRegistry and initializes all necessary
 * providers and configurations.
 *
 * Flow:
 * 1. Registers app with AppRegistry
 * 2. Loads Zustand game store
 * 3. Initializes Firebase/notifications
 * 4. Renders RootNavigator (which handles Tutorial vs Main App routing)
 *
 * @version 1.0.0
 */

import { AppRegistry } from 'react-native';
import React from 'react';

// Main navigation root
import RootNavigator from './src/navigation/RootNavigator';

// App name from app.json
import { name as appName } from './app.json';

/**
 * App wrapper component
 * Handles initialization and provider setup
 */
function AppEntry() {
  return (
    <>
      {/* Main navigation entry point */}
      <RootNavigator />
    </>
  );
}

// Register the app with React Native's AppRegistry
// This is required for all React Native applications
AppRegistry.registerComponent(appName, () => AppEntry);
