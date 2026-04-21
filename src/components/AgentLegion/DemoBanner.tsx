/**
 * Star Kitchen AI C-Suite -- Demo Mode Banner
 * Shown at the top of the chat interface when running in demo mode.
 * Dark theme, dismissible, amber accent color.
 */

'use client';

import { useState, useCallback } from 'react';

interface DemoBannerProps {
  /** Override the default banner text */
  message?: string;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
}

export function DemoBanner({ message, onDismiss }: DemoBannerProps) {
  const [visible, setVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  if (!visible) return null;

  const displayText =
    message ??
    '\uD83C\uDFAD \u6F14\u793A\u6A21\u5F0F \u2014 Demo responses are pre-scripted for presentation purposes';

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 border-b border-amber-500/30"
    >
      {/* Amber accent left bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />

      {/* Banner text */}
      <span className="text-amber-400">{displayText}</span>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss demo banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-amber-400 hover:bg-amber-500/20 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}
