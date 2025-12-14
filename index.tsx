// Note: ExceptionsManager deep import removed due to deprecation
// Error handling is now managed by DeviceErrorBoundaryWrapper

import 'react-native-url-polyfill/auto';

if (__DEV__) {
  // Suppress error dialogs in development - errors are handled by error boundary
  const originalError = console.error;
  console.error = (...args) => {
    // Log errors but don't show native error dialogs
    originalError(...args);
  };
}
// #region agent log
// #endregion
// Safely set Buffer - might not be available in all environments
try {
  global.Buffer = require('buffer').Buffer;
} catch (error) {
  // Buffer might not be available, but it's usually polyfilled by react-native-url-polyfill
  console.warn('Could not set global.Buffer:', error);
}

// Safely import and set up polyfills
try {
  require('./src/__create/polyfills');
} catch (error) {
  console.error('[Index] Error loading polyfills:', error);
  // Continue anyway - app might still work without custom fetch
}

import 'expo-router/entry';
import { App } from 'expo-router/build/qualified-entry';
import React, { type ReactNode } from 'react';
import { AppRegistry, LogBox } from 'react-native';

// Safely import error boundary and menu with fallbacks
let DeviceErrorBoundaryWrapper: React.ComponentType<{ children: ReactNode }>;
let AnythingMenu: React.ComponentType<{ children: ReactNode }>;

try {
  DeviceErrorBoundaryWrapper = require('./__create/DeviceErrorBoundary').DeviceErrorBoundaryWrapper;
} catch (error) {
  console.error('[Index] Error loading DeviceErrorBoundary:', error);
  // Create a fallback error boundary that just passes through children
  DeviceErrorBoundaryWrapper = ({ children }: { children: ReactNode }) => <>{children}</>;
}

try {
  AnythingMenu = require('./src/__create/anything-menu').default;
} catch (error) {
  console.error('[Index] Error loading AnythingMenu:', error);
  // Create a fallback that just passes through children
  AnythingMenu = ({ children }: { children: ReactNode }) => <>{children}</>;
}

function AnythingMenuWrapper({ children }: { children: ReactNode }) {
  return (
    <AnythingMenu>
      {children}
    </AnythingMenu>
  );
}

let WrapperComponentProvider = ({ children }: { children: ReactNode }) => {
  // Always wrap with error boundary in production to catch crashes
  return (
    <DeviceErrorBoundaryWrapper>
      <AnythingMenuWrapper>{children}</AnythingMenuWrapper>
    </DeviceErrorBoundaryWrapper>
  );
};

if (__DEV__) {
  LogBox.ignoreAllLogs();
  LogBox.uninstall();
}
AppRegistry.setWrapperComponentProvider(() => WrapperComponentProvider);
AppRegistry.registerComponent('main', () => App);
