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
import './src/__create/polyfills';
// Safely set Buffer - might not be available in all environments
try {
  global.Buffer = require('buffer').Buffer;
} catch (error) {
  // Buffer might not be available, but it's usually polyfilled by react-native-url-polyfill
  console.warn('Could not set global.Buffer:', error);
}

import 'expo-router/entry';
import { App } from 'expo-router/build/qualified-entry';
import type { ReactNode } from 'react';
import { AppRegistry, LogBox } from 'react-native';
import { DeviceErrorBoundaryWrapper } from './__create/DeviceErrorBoundary';
import AnythingMenu from './src/__create/anything-menu';


function AnythingMenuWrapper({ children }: { children: ReactNode }) {
  return (
    <AnythingMenu>
      {children}
    </AnythingMenu>
  );
};

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
