import { useState } from 'react';
import { Settings2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useDashboardLayout, useUpdateDashboardLayout, WIDGET_LABELS, DashboardLayout } from '@/hooks/useDashboardLayout';

export function DashboardSettings() {
  const layout = useDashboardLayout();
  const updateLayout = useUpdateDashboardLayout();
  const [open, setOpen] = useState(false);
  const [localLayout, setLocalLayout] = useState<DashboardLayout>(layout);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setLocalLayout(layout);
    setOpen(isOpen);
  };

  const toggleWidget = (key: string) => {
    setLocalLayout(prev => ({
      ...prev,
      visible: { ...prev.visible, [key]: !prev.visible[key] },
    }));
  };

  const moveWidget = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= localLayout.widgets.length) return;
    const newWidgets = [...localLayout.widgets];
    [newWidgets[index], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[index]];
    setLocalLayout(prev => ({ ...prev, widgets: newWidgets }));
  };

  const handleSave = async () => {
    await updateLayout.mutateAsync(localLayout);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kustomisasi Dashboard</DialogTitle>
          <DialogDescription>Atur widget yang tampil dan urutannya</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {localLayout.widgets.map((key, idx) => (
            <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveWidget(idx, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▲</button>
                  <button onClick={() => moveWidget(idx, 1)} disabled={idx === localLayout.widgets.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▼</button>
                </div>
                <GripVertical size={14} className="text-muted-foreground" />
                <Label htmlFor={key} className="cursor-pointer">{WIDGET_LABELS[key] || key}</Label>
              </div>
              <Switch id={key} checked={localLayout.visible[key] ?? true} onCheckedChange={() => toggleWidget(key)} />
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={updateLayout.isPending} className="w-full">
          Simpan
        </Button>
      </DialogContent>
    </Dialog>
  );
}
