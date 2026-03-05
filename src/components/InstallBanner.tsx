import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallBanner() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('pwa-banner-dismissed');
    if (isDismissed) {
      const dismissedAt = parseInt(isDismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsIOS(iOS);
    if (iOS && !isStandalone) {
      setShowIOSBanner(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) handleDismiss();
  };

  if (isInstalled || dismissed) return null;

  // Android/Chrome: native install prompt
  if (isInstallable) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500">
        <div className="mx-auto max-w-lg p-3">
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-lg">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Install DompetPintar</p>
              <p className="text-xs text-muted-foreground">Akses cepat dari home screen</p>
            </div>
            <Button size="sm" onClick={handleInstall}>Install</Button>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS: manual instructions
  if (showIOSBanner && isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500">
        <div className="mx-auto max-w-lg p-3">
          <div className="relative rounded-xl border bg-card p-4 shadow-lg">
            <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Install DompetPintar</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ketuk <Share className="inline h-3.5 w-3.5 mx-0.5 -mt-0.5" /> lalu pilih <span className="font-medium">"Add to Home Screen"</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
