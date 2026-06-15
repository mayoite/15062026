/**
 * Touch Gestures - Touch gesture handling for mobile canvas interaction
 * Implements pinch zoom, two-finger pan, long press, and double tap behaviors
 */

import { useCallback, useRef, useEffect } from 'react';

export interface TouchGestureConfig {
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onPan?: (delta: { x: number; y: number }) => void;
  onLongPress?: (position: { x: number; y: number }) => void;
  onDoubleTap?: (position: { x: number; y: number }) => void;
  onTap?: (position: { x: number; y: number }) => void;
  longPressDelay?: number;
  doubleTapDelay?: number;
  minPinchDistance?: number;
  enabled?: boolean;
}

export interface TouchGestureState {
  isPinching: boolean;
  isPanning: boolean;
  lastTouchCount: number;
  initialPinchDistance: number;
  currentPinchDistance: number;
  initialPinchCenter: { x: number; y: number };
  lastPanPosition: { x: number; y: number };
  longPressTimer: NodeJS.Timeout | null;
  lastTapTime: number;
  lastTapPosition: { x: number; y: number };
  tapCount: number;
}

export class TouchGestureHandler {
  private config: TouchGestureConfig;
  private state: TouchGestureState;
  private element: HTMLElement | null = null;

  constructor(config: TouchGestureConfig = {}) {
    this.config = {
      longPressDelay: 500,
      doubleTapDelay: 300,
      minPinchDistance: 10,
      enabled: true,
      ...config
    };

    this.state = {
      isPinching: false,
      isPanning: false,
      lastTouchCount: 0,
      initialPinchDistance: 0,
      currentPinchDistance: 0,
      initialPinchCenter: { x: 0, y: 0 },
      lastPanPosition: { x: 0, y: 0 },
      longPressTimer: null,
      lastTapTime: 0,
      lastTapPosition: { x: 0, y: 0 },
      tapCount: 0,
    };
  }

  /**
   * Attach gesture handlers to element
   */
  attach(element: HTMLElement): void {
    this.element = element;
    
    // Prevent default touch behaviors
    element.style.touchAction = 'none';
    
    element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  /**
   * Detach gesture handlers from element
   */
  detach(): void {
    if (this.element) {
      this.element.removeEventListener('touchstart', this.handleTouchStart);
      this.element.removeEventListener('touchmove', this.handleTouchMove);
      this.element.removeEventListener('touchend', this.handleTouchEnd);
      this.element.removeEventListener('touchcancel', this.handleTouchEnd);
      this.element.style.touchAction = '';
      this.element = null;
    }
    
    if (this.state.longPressTimer) {
      clearTimeout(this.state.longPressTimer);
      this.state.longPressTimer = null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TouchGestureConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private handleTouchStart = (event: TouchEvent): void => {
    if (!this.config.enabled) return;
    
    const touches = event.touches;
    const touchCount = touches.length;

    // Clear long press timer on multi-touch
    if (touchCount > 1 && this.state.longPressTimer) {
      clearTimeout(this.state.longPressTimer);
      this.state.longPressTimer = null;
    }

    if (touchCount === 2) {
      // Start pinch gesture
      const distance = this.getTouchDistance(touches[0], touches[1]);
      const center = this.getTouchCenter(touches[0], touches[1]);
      
      this.state.isPinching = true;
      this.state.initialPinchDistance = distance;
      this.state.currentPinchDistance = distance;
      this.state.initialPinchCenter = center;
      this.state.lastTouchCount = 2;
      
      event.preventDefault();
    } else if (touchCount === 1) {
      // Potential pan or tap gesture
      const touch = touches[0];
      this.state.lastPanPosition = { x: touch.clientX, y: touch.clientY };
      this.state.lastTouchCount = 1;
      
      // Start long press timer
      if (this.config.onLongPress) {
        this.state.longPressTimer = setTimeout(() => {
          this.config.onLongPress?.({ x: touch.clientX, y: touch.clientY });
          this.state.longPressTimer = null;
        }, this.config.longPressDelay);
      }
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (!this.config.enabled) return;
    
    const touches = event.touches;
    const touchCount = touches.length;

    // Cancel long press on movement
    if (this.state.longPressTimer) {
      clearTimeout(this.state.longPressTimer);
      this.state.longPressTimer = null;
    }

    if (touchCount === 2 && this.state.isPinching) {
      // Handle pinch zoom
      const distance = this.getTouchDistance(touches[0], touches[1]);
      const center = this.getTouchCenter(touches[0], touches[1]);
      
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (Math.abs(distance - this.state.currentPinchDistance) > this.config.minPinchDistance!) {
        const scale = distance / this.state.initialPinchDistance;
        this.config.onPinch?.(scale, center);
        this.state.currentPinchDistance = distance;
      }
      
      event.preventDefault();
    } else if (touchCount === 2 && !this.state.isPinching) {
      // Start two-finger pan
      this.state.isPanning = true;
      const center = this.getTouchCenter(touches[0], touches[1]);
      const delta = {
        x: center.x - this.state.lastPanPosition.x,
        y: center.y - this.state.lastPanPosition.y
      };
      
      this.config.onPan?.(delta);
      this.state.lastPanPosition = center;
      
      event.preventDefault();
    } else if (touchCount === 1 && this.state.isPanning) {
      // Single finger pan
      const touch = touches[0];
      const delta = {
        x: touch.clientX - this.state.lastPanPosition.x,
        y: touch.clientY - this.state.lastPanPosition.y
      };
      
      this.config.onPan?.(delta);
      this.state.lastPanPosition = { x: touch.clientX, y: touch.clientY };
      
      event.preventDefault();
    }
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    if (!this.config.enabled) return;
    
    const touches = event.touches;
    const touchCount = touches.length;

    // Clear long press timer
    if (this.state.longPressTimer) {
      clearTimeout(this.state.longPressTimer);
      this.state.longPressTimer = null;
    }

    if (touchCount === 0) {
      // All fingers lifted - check for tap/double tap
      if (this.state.lastTouchCount === 1) {
        const touch = event.changedTouches[0];
        const now = Date.now();
        const position = { x: touch.clientX, y: touch.clientY };
        
        // Check for double tap
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (now - this.state.lastTapTime < this.config.doubleTapDelay!) {
          this.state.tapCount++;
          if (this.state.tapCount === 2) {
            this.config.onDoubleTap?.(position);
            this.state.tapCount = 0;
          }
        } else {
          this.state.tapCount = 1;
          this.config.onTap?.(position);
        }
        
        this.state.lastTapTime = now;
        this.state.lastTapPosition = position;
      }
      
      // Reset gesture states
      this.state.isPinching = false;
      this.state.isPanning = false;
      this.state.lastTouchCount = 0;
    } else if (touchCount === 1 && this.state.isPinching) {
      // One finger lifted during pinch - switch to pan
      this.state.isPinching = false;
      this.state.isPanning = true;
      const touch = touches[0];
      this.state.lastPanPosition = { x: touch.clientX, y: touch.clientY };
    }
  };

  /**
   * Calculate distance between two touches
   */
  private getTouchDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate center point between two touches
   */
  private getTouchCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }
}

/**
 * React hook for touch gestures
 */
export function useTouchGestures(config: TouchGestureConfig) {
  const handlerRef = useRef<TouchGestureHandler | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const handler = new TouchGestureHandler(config);
    handler.attach(elementRef.current);
    handlerRef.current = handler;

    return () => {
      handler.detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handlerRef.current?.updateConfig(config);
  }, [config]);

  const setElement = useCallback((element: HTMLElement | null) => {
    if (handlerRef.current) {
      handlerRef.current.detach();
    }
    
    elementRef.current = element;
    
    if (element && handlerRef.current) {
      handlerRef.current.attach(element);
    }
  }, []);

  return {
    setElement,
    // eslint-disable-next-line react-hooks/refs
    handler: handlerRef.current
  };
}

/**
 * Utility: Check if device supports touch
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Utility: Get optimal touch target size (44px minimum per Apple guidelines)
 */
export function getTouchTargetSize(): number {
  return Math.max(44, window.innerWidth * 0.1);
}

export default TouchGestureHandler;