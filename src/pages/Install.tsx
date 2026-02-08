import { Link } from 'react-router-dom';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle, Share, Plus, MoreVertical } from 'lucide-react';

export default function Install() {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      // Installed successfully
    }
  };

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Sudah Terinstall! 🎉</CardTitle>
            <CardDescription>
              DompetPintar sudah terinstall di perangkat Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard">
              <Button className="w-full">Buka Aplikasi</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Install DompetPintar</CardTitle>
          <CardDescription>
            Akses aplikasi langsung dari home screen HP Anda - tanpa perlu download dari app store!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstallable && (
            <Button onClick={handleInstall} className="w-full gap-2" size="lg">
              <Download className="w-5 h-5" />
              Install Sekarang
            </Button>
          )}

          {!isInstallable && (
            <div className="space-y-4">
              {isIOS ? (
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <p className="font-medium text-sm">Cara Install di iPhone/iPad:</p>
                  <ol className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                      <span>Tap tombol <Share className="w-4 h-4 inline mx-1" /> Share di Safari</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                      <span>Scroll dan tap <Plus className="w-4 h-4 inline mx-1" /> "Add to Home Screen"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                      <span>Tap "Add" di pojok kanan atas</span>
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <p className="font-medium text-sm">Cara Install di Android:</p>
                  <ol className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                      <span>Tap tombol menu <MoreVertical className="w-4 h-4 inline mx-1" /> di browser</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                      <span>Tap "Install app" atau "Add to Home screen"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                      <span>Tap "Install" untuk konfirmasi</span>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-3">Keuntungan Install:</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Akses cepat dari home screen
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Bekerja offline
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Tampilan fullscreen seperti app native
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Loading lebih cepat
              </li>
            </ul>
          </div>

          <div className="text-center pt-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              Kembali ke Beranda
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
