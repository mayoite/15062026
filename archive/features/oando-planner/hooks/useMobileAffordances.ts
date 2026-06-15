// @ts-nocheck
"use client";
/**
 * Mobile Affordances Hook - Safe-area, status-bar, and haptic feedback
 * Provides mobile-specific UI affordances and system integration
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import capacitorBridge from '../lib/capacitorBridge';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

export interface MobileAffordancesConfig {
  statusBarStyle?: Style;
  statusBarBackgroundColor?: string;
  autoStatusBar?: boolean;
  hapticEnabled?: boolean;
  networkListener?: boolean;
}

export function useMobileAffordances(config: MobileAffordancesConfig = {}) {
  const [isNative, setIsNative] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    connected: true,
    connectionType: 'wifi',
  });

  const {
    statusBarStyle = Style.Dark,
    statusBarBackgroundColor = 'var(--border-soft)',
    autoStatusBar = true,
    hapticEnabled = true,
    networkListener = true,
  } = config;

  // Initialize Capacitor and get platform info
  useEffect(() => {
    const initMobile = async () => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);

      if (native) {
        // Initialize capacitor bridge
        await capacitorBridge.initialize({
          statusBarStyle,
          statusBarBackgroundColor,
        });

        // Get safe area insets
        const insets = await capacitorBridge.getSafeAreaInsets();
        if (insets) {
          setSafeAreaInsets(insets);
        }

        // Get initial network status
        const network = await capacitorBridge.getNetworkStatus();
        if (network) {
          setNetworkStatus(network);
        }
      }
    };

    initMobile();
  }, [statusBarStyle, statusBarBackgroundColor]);

  // Set up network listener
  useEffect(() => {
    if (!isNative || !networkListener) return;

    let unsubscribe: (() => void) | null = null;

    const setupNetworkListener = async () => {
      unsubscribe = await Network.addListener('networkStatusChange', (status) => {
        setNetworkStatus({
          connected: status.connected,
          connectionType: status.connectionType,
        });
      });
    };

    setupNetworkListener();

    return () => {
      unsubscribe?.();
    };
  }, [isNative, networkListener]);

  /**
   * Haptic feedback - light impact
   */
  const hapticLight = useCallback(async () => {
    if (!isNative || !hapticEnabled) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }, [isNative, hapticEnabled]);

  /**
   * Haptic feedback - medium impact
   */
  const hapticMedium = useCallback(async () => {
    if (!isNative || !hapticEnabled) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }, [isNative, hapticEnabled]);

  /**
   * Haptic feedback - heavy impact
   */
  const hapticHeavy = useCallback(async () => {
    if (!isNative || !hapticEnabled) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }, [isNative, hapticEnabled]);

  /**
   * Haptic feedback - success notification
   */
  const hapticSuccess = useCallback(async () => {
    if (!isNative || !hapticEnabled) return;

    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }, [isNative, hapticEnabled]);

  /**
   * Haptic feedback - warning notification
   */
  const hapticWarning = useCallback(async () => {
    if (!isNative || !hapticEnabled) return;

    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }, [isNative, hapticEnabled]);

  /**
   * Haptic feedback - error notification
   */
  const hapticError = useCallback(async () => {
    if (!isNative || !hapticEnabled) return;

    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }, [isNative, hapticEnabled]);

  /**
   * Set status bar style
   */
  const setStatusBarStyle = useCallback(async (style: Style) => {
    if (!isNative || !autoStatusBar) return;

    try {
      await StatusBar.setStyle({ style });
    } catch (error) {
      console.error('Failed to set status bar style:', error);
    }
  }, [isNative, autoStatusBar]);

  /**
   * Set status bar background color
   */
  const setStatusBarBackgroundColor = useCallback(async (color: string) => {
    if (!isNative || !autoStatusBar) return;

    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.error('Failed to set status bar background color:', error);
    }
  }, [isNative, autoStatusBar]);

  /**
   * Show status bar
   */
  const showStatusBar = useCallback(async () => {
    if (!isNative || !autoStatusBar) return;

    try {
      await StatusBar.show();
    } catch (error) {
      console.error('Failed to show status bar:', error);
    }
  }, [isNative, autoStatusBar]);

  /**
   * Hide status bar
   */
  const hideStatusBar = useCallback(async () => {
    if (!isNative || !autoStatusBar) return;

    try {
      await StatusBar.hide();
    } catch (error) {
      console.error('Failed to hide status bar:', error);
    }
  }, [isNative, autoStatusBar]);

  /**
   * Get CSS variables for safe area
   */
  const getSafeAreaStyles = useCallback(() => {
    return {
      paddingTop: `${safeAreaInsets.top}px`,
      paddingBottom: `${safeAreaInsets.bottom}px`,
      paddingLeft: `${safeAreaInsets.left}px`,
      paddingRight: `${safeAreaInsets.right}px`,
    };
  }, [safeAreaInsets]);

  return {
    // Platform info
    isNative,
    platform: Capacitor.getPlatform(),
    
    // Safe area
    safeAreaInsets,
    getSafeAreaStyles,
    
    // Network
    networkStatus,
    
    // Haptic feedback
    hapticLight,
    hapticMedium,
    hapticHeavy,
    hapticSuccess,
    hapticWarning,
    hapticError,
    
    // Status bar
    setStatusBarStyle,
    setStatusBarBackgroundColor,
    showStatusBar,
    hideStatusBar,
  };
}

/**
 * Hook for safe area-aware dimensions
 */
export function useSafeArea() {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const getInsets = async () => {
      const safeInsets = await capacitorBridge.getSafeAreaInsets();
      if (safeInsets) {
        setInsets(safeInsets);
      }
    };

    getInsets();

    // Listen for orientation changes
    const handleOrientationChange = () => {
      getInsets();
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return {
    insets,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    safeAreaStyle: {
      paddingTop: `${insets.top}px`,
      paddingBottom: `${insets.bottom}px`,
      paddingLeft: `${insets.left}px`,
      paddingRight: `${insets.right}px`,
    },
  };
}

/**
 * Hook for network-aware behavior
 */
export function useNetworkAware() {
  const [status, setStatus] = useState<NetworkStatus>({
    connected: true,
    connectionType: 'wifi',
  });

  useEffect(() => {
    const setupListener = async () => {
      if (Capacitor.isNativePlatform()) {
        await Network.addListener('networkStatusChange', (networkStatus) => {
          setStatus({
            connected: networkStatus.connected,
            connectionType: networkStatus.connectionType,
          });
        });
      } else {
        // Fallback to browser events
        const handleOnline = () => {
          setStatus({ connected: true, connectionType: 'wifi' });
        };
        const handleOffline = () => {
          setStatus({ connected: false, connectionType: 'none' });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
    };

    setupListener();
  }, []);

  return {
    isOnline: status.connected,
    connectionType: status.connectionType,
    status,
  };
}