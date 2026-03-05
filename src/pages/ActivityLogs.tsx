import { useState } from 'react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Trash2, Activity, Plus, Pencil, Trash, ArrowRightLeft, Download, Search, CalendarIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-4 w-4" />,
  update: <Pencil className="h-4 w-4" />,
  delete: <Trash className="h-4 w-4" />,
  transfer: <ArrowRightLeft className="h-4 w-4" />,
  export: <Download className="h-4 w-4" />,
};

const entityLabels: Record<string, string> = {
  transaction: 'Transaksi', category: 'Kategori', budget: 'Anggaran',
  goal: 'Target', wallet: 'Dompet', debt: 'Hutang/Piutang',
  recurring: 'Transaksi Berulang', transfer: 'Transfer', profile: 'Profil',
};

const actionLabels: Record<string, string> = {
  create: 'Membuat', update: 'Mengubah', delete: 'Menghapus',
  transfer: 'Transfer', export: 'Mengekspor',
};

const actionColors: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  update: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  delete: 'bg-red-500/10 text-red-600 dark:text-red-400',
  transfer: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  export: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

export default function ActivityLogs() {
  const { logs, isLoading, clearLogs } = useActivityLogs();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const handleClearAll = () => {
    clearLogs.mutate(undefined, {
      onSuccess: () => toast.success('Semua log aktivitas dihapus'),
      onError: () => toast.error('Gagal menghapus log'),
    });
  };

  const clearFilters = () => {
    setSearch('');
    setEntityFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasFilters = search || entityFilter !== 'all' || dateFrom || dateTo;

  const filteredLogs = logs.filter((log) => {
    if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const details = log.details as Record<string, any> | null;
      const detailStr = details ? (details.name || details.note || details.description || '') : '';
      const matchText = `${actionLabels[log.action] || log.action} ${entityLabels[log.entity_type] || log.entity_type} ${detailStr}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    const logDate = new Date(log.created_at);
    if (dateFrom && logDate < startOfDay(dateFrom)) return false;
    if (dateTo && logDate > endOfDay(dateTo)) return false;
    return true;
  });

  const groupedLogs = filteredLogs.reduce<Record<string, typeof filteredLogs>>((acc, log) => {
    const date = format(new Date(log.created_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  const entityTypes = [...new Set(logs.map(l => l.entity_type))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Log Aktivitas</h1>
          <p className="text-muted-foreground">Riwayat semua aktivitas akun Anda</p>
        </div>
        {logs.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Semua
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus semua log?</AlertDialogTitle>
                <AlertDialogDescription>Semua riwayat aktivitas akan dihapus secara permanen.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>Hapus</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari aktivitas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                {entityTypes.map((t) => (
                  <SelectItem key={t} value={t}>{entityLabels[t] || t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[150px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'dd/MM/yy') : 'Dari'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[150px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'dd/MM/yy') : 'Sampai'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {hasFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Reset filter">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {hasFilters && (
            <p className="text-xs text-muted-foreground mt-2">{filteredLogs.length} dari {logs.length} aktivitas</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Aktivitas Terkini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Memuat...</p>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{hasFilters ? 'Tidak ada aktivitas yang cocok' : 'Belum ada aktivitas tercatat'}</p>
              {!hasFilters && <p className="text-sm text-muted-foreground/60 mt-1">Aktivitas akan muncul saat Anda membuat, mengubah, atau menghapus data</p>}
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                  <div key={date}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-card py-1">
                      {format(new Date(date), 'EEEE, d MMMM yyyy', { locale: id })}
                    </h3>
                    <div className="space-y-2">
                      {dateLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                          <div className={`p-2 rounded-lg ${actionColors[log.action] || 'bg-muted text-muted-foreground'}`}>
                            {actionIcons[log.action] || <Activity className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-foreground">{actionLabels[log.action] || log.action}</span>
                              <Badge variant="secondary" className="text-xs">{entityLabels[log.entity_type] || log.entity_type}</Badge>
                            </div>
                            {log.details && (
                              <p className="text-sm text-muted-foreground mt-1 truncate">
                                {(log.details as any).name || (log.details as any).note || (log.details as any).description || JSON.stringify(log.details)}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(log.created_at), 'HH:mm')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
