import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download, Smartphone, CheckCircle, Share, Plus, MoreVertical,
  Zap, Wifi, WifiOff, Maximize, ArrowLeft, Apple, Chrome,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

const StepNumber = ({ n }: { n: number }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md">
    {n}
  </span>
);

function IOSSteps() {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <StepNumber n={1} />
        <div className="flex-1">
          <p className="font-semibold text-foreground">Ketuk tombol Share</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ketuk ikon <Share className="inline h-4 w-4 mx-0.5 text-primary" /> di bagian bawah Safari
          </p>
          <div className="mt-3 rounded-xl border bg-muted/50 p-4 flex items-center justify-center">
            <div className="flex items-center gap-6 text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
              <div className="h-5 w-5 rounded border" />
              <Share className="h-6 w-6 text-primary animate-pulse" />
              <div className="h-5 w-5 rounded border" />
              <div className="h-5 w-5 rounded border" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <StepNumber n={2} />
        <div className="flex-1">
          <p className="font-semibold text-foreground">Pilih "Add to Home Screen"</p>
          <p className="text-sm text-muted-foreground mt-1">Scroll ke bawah dan temukan opsi ini</p>
          <div className="mt-3 rounded-xl border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center gap-3 rounded-lg bg-card p-3 border">
              <Plus className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Add to Home Screen</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <StepNumber n={3} />
        <div className="flex-1">
          <p className="font-semibold text-foreground">Ketuk "Add"</p>
          <p className="text-sm text-muted-foreground mt-1">Konfirmasi di pojok kanan atas layar</p>
          <div className="mt-3 rounded-xl border bg-muted/50 p-3 flex justify-end">
            <span className="text-sm font-bold text-primary">Add</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AndroidSteps() {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <StepNumber n={1} />
        <div className="flex-1">
          <p className="font-semibold text-foreground">Buka menu browser</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ketuk ikon <MoreVertical className="inline h-4 w-4 mx-0.5 text-primary" /> di pojok kanan atas Chrome
          </p>
          <div className="mt-3 rounded-xl border bg-muted/50 p-4 flex justify-end">
            <MoreVertical className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <StepNumber n={2} />
        <div className="flex-1">
          <p className="font-semibold text-foreground">Pilih "Install app"</p>
          <p className="text-sm text-muted-foreground mt-1">Atau "Add to Home screen" di beberapa browser</p>
          <div className="mt-3 rounded-xl border bg-muted/50 p-3 space-y-1.5">
            <div className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-muted-foreground">
              <div className="h-4 w-4 rounded bg-muted-foreground/20" />
              <span>Share...</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-card p-2.5 border text-sm font-medium text-foreground">
              <Download className="h-4 w-4 text-primary" />
              <span>Install app</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-muted-foreground">
              <div className="h-4 w-4 rounded bg-muted-foreground/20" />
              <span>Desktop site</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <StepNumber n={3} />
        <div className="flex-1">
          <p className="font-semibold text-foreground">Ketuk "Install"</p>
          <p className="text-sm text-muted-foreground mt-1">Konfirmasi pada dialog yang muncul</p>
          <div className="mt-3 rounded-xl border bg-muted/50 p-4 flex justify-end gap-3">
            <span className="text-sm text-muted-foreground">Cancel</span>
            <span className="rounded-full bg-primary px-5 py-1.5 text-sm font-bold text-primary-foreground">Install</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const benefits = [
  { icon: Zap, label: 'Loading super cepat', desc: 'Cached untuk performa optimal' },
  { icon: WifiOff, label: 'Bekerja offline', desc: 'Tetap bisa diakses tanpa internet' },
  { icon: Maximize, label: 'Fullscreen', desc: 'Tampilan layar penuh seperti app native' },
  { icon: Smartphone, label: 'Icon di home screen', desc: 'Akses langsung satu ketukan' },
];

export default function Install() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [platform, setPlatform] = useState<Platform>('android');
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('android');

  useEffect(() => {
    const detected = detectPlatform();
    setPlatform(detected);
    setActiveTab(detected === 'ios' ? 'ios' : 'android');
  }, []);

  const handleInstall = async () => {
    await install();
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sudah Terinstall! 🎉</h1>
            <p className="text-muted-foreground mt-2">DompetPintar sudah siap di perangkat Anda</p>
          </div>
          <Link to="/dashboard">
            <Button className="w-full" size="lg">Buka Aplikasi</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="relative max-w-md mx-auto px-6 pt-12 pb-8 text-center">
          <div className="mx-auto w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-primary/25">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Install DompetPintar</h1>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            Pasang langsung di HP Anda — gratis, tanpa app store!
          </p>

          {platform !== 'desktop' && (
            <Badge variant="secondary" className="mt-3 gap-1.5">
              {platform === 'ios' ? <Apple className="h-3.5 w-3.5" /> : <Chrome className="h-3.5 w-3.5" />}
              {platform === 'ios' ? 'iPhone/iPad terdeteksi' : 'Android terdeteksi'}
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pb-12 space-y-8">
        {/* Native install button */}
        {isInstallable && (
          <Button onClick={handleInstall} className="w-full gap-2 shadow-lg shadow-primary/20" size="lg">
            <Download className="w-5 h-5" />
            Install Sekarang
          </Button>
        )}

        {/* Platform tabs + steps */}
        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('ios')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors',
                activeTab === 'ios'
                  ? 'bg-primary/5 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Apple className="h-4 w-4" /> iPhone / iPad
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors',
                activeTab === 'android'
                  ? 'bg-primary/5 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Chrome className="h-4 w-4" /> Android
            </button>
          </div>

          <div className="p-5">
            {activeTab === 'ios' ? <IOSSteps /> : <AndroidSteps />}
          </div>
        </div>

        {/* Benefits */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Kenapa harus install?</h2>
          <div className="grid grid-cols-2 gap-3">
            {benefits.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
