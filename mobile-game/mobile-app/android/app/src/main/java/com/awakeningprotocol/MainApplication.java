package com.awakeningprotocol;

import android.app.Application;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import java.util.ArrayList;
import java.util.List;

/**
 * MainApplication - React Native Application Instance
 * Initializes all React Native packages and configuration
 * Handles Firebase, Sentry, and other integrations
 */
public class MainApplication extends Application implements ReactApplication {
  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return true; // Enable dev support in debug builds
        }

        @Override
        protected List<ReactPackage> getPackages() {
          // Return list of packages that will be auto-linked
          // React Navigation, Gesture Handler, AsyncStorage, etc. are auto-linked
          List<ReactPackage> packages = new ArrayList<>();
          // Additional packages can be added here if needed
          // Example: packages.add(new MyCustomPackage());
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();

    // Initialize native libraries
    SoLoader.init(this, /* native exopackage */ false);

    // Initialize Firebase (if google-services.json is present)
    // FirebaseApp.initializeApp(this);

    // Initialize Sentry (if SENTRY_DSN is configured)
    // Sentry.init(this);
  }
}
