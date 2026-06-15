// @ts-nocheck
/**
 * Capacitor Bridge - Runtime bridge for native mobile functionality
 * Handles native device features and mobile-specific behavior
 */

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Keyboard } from '@capacitor/keyboard';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface CapacitorBridgeConfig {
  statusBarStyle?: Style;
  statusBarBackgroundColor?: string;
  keyboardResize?: 'body' | 'ionic' | 'native';
  splashAutoHide?: boolean;
  splashShowDuration?: number;
}

export class CapacitorBridge {
  private isNative: boolean = false;
  private platform: string = 'web';
  private isInitialized: boolean = false;

  /**
   * Initialize Capacitor bridge
   */
  async initialize(config?: CapacitorBridgeConfig): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.isNative = Capacitor.isNativePlatform();
    this.platform = Capacitor.getPlatform();

    if (!this.isNative) {
// eslint-disable-next-line no-console
      console.log('Capacitor: Running on web platform');
      this.isInitialized = true;
      return;
    }

    try {
      // Configure status bar
      await StatusBar.setStyle({
        style: config?.statusBarStyle || Style.Dark
      });

      if (config?.statusBarBackgroundColor) {
        await StatusBar.setBackgroundColor({
          color: config.statusBarBackgroundColor
        });
      }

      // Configure keyboard
      const { Keyboard } = await import('@capacitor/keyboard');
      const resizeValue = config?.keyboardResize === 'body' ? 'body' :
                         config?.keyboardResize === 'ionic' ? 'ionic' :
                         config?.keyboardResize === 'native' ? 'native' : 'none';
      await Keyboard.setResizeMode({
        mode: resizeValue as unknown
      });

      // Configure splash screen
      if (config?.splashAutoHide !== false) {
        await SplashScreen.hide({
          fadeOutDuration: config?.splashShowDuration || 300
        });
      }

      this.isInitialized = true;
// eslint-disable-next-line no-console
      console.log('Capacitor: Initialized successfully on', this.platform);
    } catch (error) {
      console.error('Capacitor: Initialization failed', error);
      throw error;
    }
  }

  /**
   * Check if running on native platform
   */
  isNativePlatform(): boolean {
    return this.isNative;
  }

  /**
   * Get current platform
   */
  getPlatform(): string {
    return this.platform;
  }

  /**
   * Get device information
   */
  async getDeviceInfo(): Promise<{ platform: string; model: string; osVersion: string } | null> {
    if (!this.isNative) {
      return null;
    }

    try {
      const info = await Device.getInfo();
      return {
        platform: info.platform,
        model: info.model,
        osVersion: info.osVersion
      };
    } catch (error) {
      console.error('Failed to get device info:', error);
      return null;
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<{ connected: boolean; connectionType: string } | null> {
    if (!this.isNative) {
      return { connected: navigator.onLine, connectionType: 'wifi' };
    }

    try {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType
      };
    } catch (error) {
      console.error('Failed to get network status:', error);
      return null;
    }
  }

  /**
   * Show splash screen
   */
  async showSplashScreen(): Promise<void> {
    if (!this.isNative) {
      return;
    }

    try {
      await SplashScreen.show();
    } catch (error) {
      console.error('Failed to show splash screen:', error);
    }
  }

  /**
   * Hide splash screen
   */
  async hideSplashScreen(): Promise<void> {
    if (!this.isNative) {
      return;
    }

    try {
      await SplashScreen.hide();
    } catch (error) {
      console.error('Failed to hide splash screen:', error);
    }
  }

  /**
   * Haptic feedback
   */
  async hapticImpact(style: ImpactStyle = ImpactStyle.Medium): Promise<void> {
    if (!this.isNative) {
      return;
    }

    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.error('Failed to trigger haptic feedback:', error);
    }
  }

  /**
   * Haptic notification
   */
  async hapticNotification(type: 'SUCCESS' | 'WARNING' | 'ERROR'): Promise<void> {
    if (!this.isNative) {
      return;
    }

    try {
      await Haptics.notification({ type: type as unknown });
    } catch (error) {
      console.error('Failed to trigger haptic notification:', error);
    }
  }

  /**
   * Set status bar style
   */
  async setStatusBarStyle(style: Style): Promise<void> {
    if (!this.isNative) {
      return;
    }

    try {
      await StatusBar.setStyle({ style });
    } catch (error) {
      console.error('Failed to set status bar style:', error);
    }
  }

  /**
   * Set status bar background color
   */
  async setStatusBarBackgroundColor(color: string): Promise<void> {
    if (!this.isNative) {
      return;
    }

    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.error('Failed to set status bar background color:', error);
    }
  }

  /**
   * Show/hide status bar
   */
  async setStatusBarVisibility(visible: boolean): Promise<void> {
    if (!this.isNative) {
      return;
    }

    try {
      await StatusBar[visible ? 'show' : 'hide']();
    } catch (error) {
      console.error('Failed to set status bar visibility:', error);
    }
  }

  /**
   * Add network status listener
   */
  async addNetworkStatusListener(
    callback: (status: { connected: boolean; connectionType: string }) => void
  ): Promise<void> {
    if (!this.isNative) {
      // Fallback to browser online/offline events
      window.addEventListener('online', () => {
        callback({ connected: true, connectionType: 'wifi' });
      });
      window.addEventListener('offline', () => {
        callback({ connected: false, connectionType: 'none' });
      });
      return;
    }

    try {
      await Network.addListener('networkStatusChange', (status) => {
        callback({
          connected: status.connected,
          connectionType: status.connectionType
        });
      });
    } catch (error) {
      console.error('Failed to add network listener:', error);
    }
  }

  /**
   * Get safe area insets
   */
  async getSafeAreaInsets(): Promise<{ top: number; bottom: number; left: number; right: number } | null> {
    if (!this.isNative) {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }

    try {
      const { StatusBar } = await import('@capacitor/status-bar');
      const info = await StatusBar.getInfo();
      return {
        top: info?.height || 0,
        bottom: 0,
        left: 0,
        right: 0
      };
    } catch (error) {
      console.error('Failed to get safe area insets:', error);
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }
  }
}

// Singleton instance
const capacitorBridge = new CapacitorBridge();

export default capacitorBridge;