/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Download, Share, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'dialafia_install_dismissed_v1';

function isIOSBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const platform = window.navigator.platform || '';
  const userAgent = window.navigator.userAgent || '';
  const isIOSDevice = /iPad|iPhone|iPod/.test(platform)
    || /iPad|iPhone|iPod/.test(userAgent)
    || (platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  return isIOSDevice && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const standaloneMedia = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone;
  return Boolean(standaloneMedia || iosStandalone);
}

export default function PWAStatus() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

    if (isIOSBrowser()) {
      setShowInstallBanner(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    const handleInstalled = () => {
      setShowInstallBanner(false);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installEvent) {
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted' || choice.outcome === 'dismissed') {
      setShowInstallBanner(false);
      setInstallEvent(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setShowInstallBanner(false);
  };

  return (
    <>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-stone-900 text-stone-100 text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>You are offline; DiaLafia keeps working, your data stays saved on this device.</span>
        </div>
      )}

      {showInstallBanner && (
        <div className="fixed bottom-20 lg:bottom-5 left-4 right-4 lg:left-auto lg:right-5 lg:max-w-sm z-[60] bg-[#052E16] text-stone-100 rounded-2xl shadow-2xl border border-emerald-900 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-2 h-9 w-9 bg-emerald-800/60 rounded-xl border border-emerald-700 flex items-center justify-center shrink-0">
            {installEvent ? (
              <Download className="w-4 h-4 text-emerald-300" />
            ) : (
              <Share className="w-4 h-4 text-emerald-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold font-sans leading-tight">Install DiaLafia</h4>
            <p className="text-[11px] text-emerald-100/80 mt-1 leading-relaxed">
              {installEvent
                ? 'Add it to your home screen for quick, offline access to your meal log.'
                : 'On iPhone, tap Share in Safari, then Add to Home Screen.'}
            </p>
            <div className="flex gap-2 mt-3">
              {installEvent && (
                <button
                  onClick={handleInstallClick}
                  className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                >
                  Install
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="text-xs font-semibold px-3 py-1.5 text-emerald-100/70 hover:text-emerald-50 transition"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-emerald-100/50 hover:text-emerald-100 shrink-0"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
