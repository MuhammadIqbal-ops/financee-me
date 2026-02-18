import { useState, useEffect } from 'react';
import { Bell, BellOff, Wallet, RefreshCw, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export function NotificationSettings() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [settings, setSettings] = useState({
    push_enabled: true,
    notify_budget_alert: true,
    notify_recurring: true,
    notify_goal_reached: true,
  });

  useEffect(() => {
    if (profile) {
      setSettings({
        push_enabled: (profile as any).push_enabled ?? true,
        notify_budget_alert: (profile as any).notify_budget_alert ?? true,
        notify_recurring: (profile as any).notify_recurring ?? true,
        notify_goal_reached: (profile as any).notify_goal_reached ?? true,
      });
    }
  }, [profile]);

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };

    // If master toggle off, disable all
    if (key === 'push_enabled' && !value) {
      newSettings.notify_budget_alert = false;
      newSettings.notify_recurring = false;
      newSettings.notify_goal_reached = false;
    }

    // If enabling a sub-toggle, also enable master
    if (key !== 'push_enabled' && value) {
      newSettings.push_enabled = true;
    }

    setSettings(newSettings);

    try {
      await updateProfile.mutateAsync(newSettings as any);
      toast.success('Pengaturan notifikasi diperbarui');
    } catch {
      toast.error('Gagal memperbarui pengaturan');
      // Revert
      if (profile) {
        setSettings({
          push_enabled: (profile as any).push_enabled ?? true,
          notify_budget_alert: (profile as any).notify_budget_alert ?? true,
          notify_recurring: (profile as any).notify_recurring ?? true,
          notify_goal_reached: (profile as any).notify_goal_reached ?? true,
        });
      }
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {settings.push_enabled ? (
            <Bell className="w-5 h-5" />
          ) : (
            <BellOff className="w-5 h-5" />
          )}
          Pengaturan Notifikasi
        </CardTitle>
        <CardDescription>
          Kelola jenis notifikasi yang ingin Anda terima
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push_enabled" className="text-base font-medium">
              Push Notification
            </Label>
            <p className="text-sm text-muted-foreground">
              Aktifkan atau nonaktifkan semua notifikasi push
            </p>
          </div>
          <Switch
            id="push_enabled"
            checked={settings.push_enabled}
            onCheckedChange={(v) => handleToggle('push_enabled', v)}
          />
        </div>

        <Separator />

        {/* Sub-toggles */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Jenis Notifikasi</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(var(--warning))]/10">
                <Wallet className="w-4 h-4 text-[hsl(var(--warning))]" />
              </div>
              <div>
                <Label htmlFor="notify_budget" className="font-medium">
                  Peringatan Anggaran
                </Label>
                <p className="text-xs text-muted-foreground">
                  Saat pengeluaran mendekati batas anggaran
                </p>
              </div>
            </div>
            <Switch
              id="notify_budget"
              checked={settings.notify_budget_alert}
              disabled={!settings.push_enabled}
              onCheckedChange={(v) => handleToggle('notify_budget_alert', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <RefreshCw className="w-4 h-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="notify_recurring" className="font-medium">
                  Transaksi Berulang
                </Label>
                <p className="text-xs text-muted-foreground">
                  Saat transaksi berulang diproses
                </p>
              </div>
            </div>
            <Switch
              id="notify_recurring"
              checked={settings.notify_recurring}
              disabled={!settings.push_enabled}
              onCheckedChange={(v) => handleToggle('notify_recurring', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(var(--success))]/10">
                <Target className="w-4 h-4 text-[hsl(var(--success))]" />
              </div>
              <div>
                <Label htmlFor="notify_goal" className="font-medium">
                  Target Tercapai
                </Label>
                <p className="text-xs text-muted-foreground">
                  Saat target keuangan berhasil dicapai
                </p>
              </div>
            </div>
            <Switch
              id="notify_goal"
              checked={settings.notify_goal_reached}
              disabled={!settings.push_enabled}
              onCheckedChange={(v) => handleToggle('notify_goal_reached', v)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
