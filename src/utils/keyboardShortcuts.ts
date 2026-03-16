/**
 * Keyboard Shortcuts Utility
 * Handles OS detection and keyboard shortcut formatting
 */

export type ModifierKey = 'ctrl' | 'cmd' | 'alt' | 'shift';
export type OS = 'mac' | 'windows' | 'linux';

/**
 * Detect the user's operating system
 */
export const detectOS = (): OS => {
  if (typeof window === 'undefined') return 'windows';

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() || '';

  if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'mac';
  }
  if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux';
  }
  return 'windows';
};

/**
 * Check if Command/Ctrl key is pressed based on OS
 */
export const isModifierPressed = (
  event: KeyboardEvent | React.KeyboardEvent,
): boolean => {
  const os = detectOS();
  return os === 'mac' ? event.metaKey : event.ctrlKey;
};

/**
 * Get the modifier key symbol based on OS
 */
export const getModifierSymbol = (): string => {
  const os = detectOS();
  return os === 'mac' ? '⌘' : 'Ctrl';
};

/**
 * Get the modifier key name
 */
export const getModifierKey = (): 'metaKey' | 'ctrlKey' => {
  const os = detectOS();
  return os === 'mac' ? 'metaKey' : 'ctrlKey';
};

/**
 * Format keyboard shortcut for display
 */
export const formatShortcut = (
  key: string,
  modifiers: ModifierKey[] = [],
): string => {
  const os = detectOS();
  const symbols: Record<OS, Record<ModifierKey, string>> = {
    mac: {
      cmd: '⌘',
      ctrl: '⌃',
      alt: '⌥',
      shift: '⇧',
    },
    windows: {
      cmd: 'Ctrl',
      ctrl: 'Ctrl',
      alt: 'Alt',
      shift: 'Shift',
    },
    linux: {
      cmd: 'Ctrl',
      ctrl: 'Ctrl',
      alt: 'Alt',
      shift: 'Shift',
    },
  };

  const osSymbols = symbols[os];
  const modifierStr = modifiers
    .map((mod) => osSymbols[mod])
    .join(os === 'mac' ? '' : '+');
  const keyStr = key.toUpperCase();

  return os === 'mac'
    ? `${modifierStr}${keyStr}`
    : modifiers.length > 0
      ? `${modifierStr}+${keyStr}`
      : keyStr;
};

/**
 * Common keyboard shortcuts
 */
export const shortcuts = {
  SEND_REQUEST: {
    key: 'Enter',
    modifiers: ['cmd'] as ModifierKey[],
    description: 'Send request',
    format: () => formatShortcut('Enter', ['cmd']),
  },
  SAVE_REQUEST: {
    key: 's',
    modifiers: ['cmd'] as ModifierKey[],
    description: 'Save request',
    format: () => formatShortcut('S', ['cmd']),
  },
  CANCEL_REQUEST: {
    key: 'Escape',
    modifiers: [] as ModifierKey[],
    description: 'Cancel request',
    format: () => formatShortcut('Esc'),
  },
  TOGGLE_SIDEBAR: {
    key: 'b',
    modifiers: ['cmd'] as ModifierKey[],
    description: 'Toggle sidebar',
    format: () => formatShortcut('B', ['cmd']),
  },
  SEARCH: {
    key: 'k',
    modifiers: ['cmd'] as ModifierKey[],
    description: 'Search',
    format: () => formatShortcut('K', ['cmd']),
  },
};

/**
 * Hook to handle keyboard shortcuts
 */
export const useKeyboardShortcut = (
  key: string,
  callback: () => void,
  modifiers: ModifierKey[] = [],
  deps: React.DependencyList = [],
) => {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedKey = event.key.toLowerCase();
      const targetKey = key.toLowerCase();

      // Check if the key matches
      if (
        pressedKey !== targetKey &&
        pressedKey !== targetKey.replace('enter', 'enter')
      ) {
        return;
      }

      // Check modifiers
      const hasCmd = modifiers.includes('cmd');
      const hasCtrl = modifiers.includes('ctrl');
      const hasAlt = modifiers.includes('alt');
      const hasShift = modifiers.includes('shift');

      const modifierPressed = hasCmd
        ? isModifierPressed(event)
        : hasCtrl
          ? event.ctrlKey
          : true;
      const altPressed = hasAlt ? event.altKey : !hasAlt ? !event.altKey : true;
      const shiftPressed = hasShift
        ? event.shiftKey
        : !hasShift
          ? !event.shiftKey
          : true;

      if (modifierPressed && altPressed && shiftPressed) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ...deps]);
};

// Re-export React for the hook
import React from 'react';
