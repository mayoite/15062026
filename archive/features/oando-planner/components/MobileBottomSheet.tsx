"use client";
/**
 * Mobile Bottom Sheet - Touch-optimized bottom sheet for mobile panels
 * Implements proper touch targets, safe areas, and mobile interactions
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // Percentage heights (e.g., [25, 50, 75, 100])
  defaultSnap?: number;
  header?: React.ReactNode;
  dismissible?: boolean;
  safeArea?: boolean;
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = [25, 50, 75],
  defaultSnap = 50,
  header,
  dismissible = true,
  safeArea = true,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(defaultSnap);
  
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        setCurrentHeight(defaultSnap);
        setCurrentSnap(defaultSnap);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen, defaultSnap]);

  const snapToNearest = useCallback((height: number) => {
    const nearestSnap = snapPoints.reduce((prev, curr) => 
      Math.abs(curr - height) < Math.abs(prev - height) ? curr : prev
    );
    setCurrentHeight(nearestSnap);
    setCurrentSnap(nearestSnap);
  }, [snapPoints]);

  const handleDragStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
  };

  const handleDragMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const deltaY = dragStartY - e.touches[0].clientY;
    const newHeight = currentSnap + (deltaY / window.innerHeight) * 100;
    setCurrentHeight(Math.max(0, Math.min(100, newHeight)));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    
    if (currentHeight < 10 && dismissible) {
      onClose();
    } else {
      snapToNearest(currentHeight);
    }
  };

  const handleSnapClick = (snap: number) => {
    setCurrentHeight(snap);
    setCurrentSnap(snap);
  };

  if (!isOpen) return null;

  const safeAreaPadding = safeArea ? 'pb-safe' : '';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl pointer-events-auto transition-transform duration-300 ease-out ${safeAreaPadding}`}
        style={{
          transform: `translateY(${100 - currentHeight}%)`,
          maxHeight: `${snapPoints[snapPoints.length - 1]}%`,
        }}
      >
        {/* Drag Handle */}
        <div
          ref={dragHandleRef}
          className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {header && (
          <div className="px-4 pb-4 border-b border-gray-200">
            {header}
          </div>
        )}

        {/* Snap Points */}
        <div className="flex gap-2 px-4 py-2 border-b border-gray-200 overflow-x-auto">
          {snapPoints.map((snap) => (
            <button
              key={snap}
              onClick={() => handleSnapClick(snap)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                currentSnap === snap
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {snap}%
              </button>
          ))}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="overflow-y-auto"
          style={{ height: `calc(${currentHeight}% - 120px)` }}
        >
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Touch Button - Touch-optimized button with proper target size
 */
export interface MobileTouchButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  haptic?: boolean;
}

export function MobileTouchButton({
  onPress,
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  haptic = true,
}: MobileTouchButtonProps) {
  const handlePress = async () => {
    if (disabled) return;

    // Haptic feedback if available
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    onPress();
  };

  const baseStyles = 'flex items-center justify-center rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100';
  
  const sizeStyles = {
    small: 'min-h-[44px] min-w-[44px] px-3 py-2 text-sm',
    medium: 'min-h-[48px] min-w-[48px] px-4 py-3 text-base',
    large: 'min-h-[52px] min-w-[52px] px-6 py-4 text-lg',
  };

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      onClick={handlePress}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`}
    >
      {children}
    </button>
  );
}

/**
 * Mobile Panel - Touch-optimized panel with collapsible sections
 */
export interface MobilePanelProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  defaultExpanded?: boolean;
}

export function MobilePanel({
  title,
  children,
  isOpen,
  onToggle,
  defaultExpanded = true,
}: MobilePanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    setIsExpanded(isOpen);
  }, [isOpen]);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          onToggle();
        }}
        className="w-full px-4 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors min-h-[56px]"
      >
        <span className="text-lg font-semibold text-gray-900">{title}</span>
        <span className={`text-2xl transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile Toolbar - Touch-optimized toolbar with proper spacing
 */
export interface MobileToolbarProps {
  children: React.ReactNode;
  position?: 'bottom' | 'top';
}

export function MobileToolbar({ children, position = 'bottom' }: MobileToolbarProps) {
  const positionStyles = {
    bottom: 'bottom-4 left-4 right-4',
    top: 'top-4 left-4 right-4',
  };

  return (
    <div className={`fixed ${positionStyles[position]} bg-white rounded-2xl shadow-xl p-2 flex gap-2 overflow-x-auto z-40`}>
      {React.Children.map(children, (child) => (
        <div className="flex-shrink-0">
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * Mobile-safe area wrapper
 */
export interface SafeAreaProps {
  children: React.ReactNode;
  edges?: 'top' | 'bottom' | 'left' | 'right' | 'all';
  className?: string;
}

export function SafeArea({ children, edges = 'all', className = '' }: SafeAreaProps) {
  const edgeStyles = {
    top: 'pt-safe',
    bottom: 'pb-safe',
    left: 'pl-safe',
    right: 'pr-safe',
    all: 'pt-safe pb-safe pl-safe pr-safe',
  };

  return (
    <div className={`${edgeStyles[edges]} ${className}`}>
      {children}
    </div>
  );
}
