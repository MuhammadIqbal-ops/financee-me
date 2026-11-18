import { useState } from 'react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Trash2, Activity, Plus, Pencil, Trash, ArrowRightLeft, Download, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { DataToolbar } from '@/components/common/DataToolbar';
import { Pagination } from '@/components/common/Pagination';
import { ListSkeleton } from '@/components/common/ListSkeleton';
import { EmptyState } from '@/components/common/EmptyState';

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
  create: 'bg-[hsl(var(--income)/0.15)] text-[hsl(var(--income))]',
  update: 'bg-primary/10 text-primary',
  delete: 'bg-destructive/10 text-destructive',
  transfer: 'bg-accent/15 text-accent',
  export: 'bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]',
};

export default function ActivityLogs() {
  const { logs, isLoading, clearLogs } = useActivityLogs();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const resetPage = () => setPage(1);

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
    resetPage();
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

  const pagedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const groupedLogs = pagedLogs.reduce<Record<string, typeof pagedLogs>>((acc, log) => {
    const date = format(new Date(log.created_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  const entityTypes = [...new Set(logs.map(l => l.entity_type))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Aktivitas"
        description="Riwayat semua aktivitas akun Anda"
        actions={logs.length > 0 && (
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
      />

      <DataToolbar
        search={search}
        searchPlaceholder="Cari aktivitas..."
        onSearchChange={(value) => { setSearch(value); resetPage(); }}
        filters={(
          <>
            <Select value={entityFilter} onValueChange={(value) => { setEntityFilter(value); resetPage(); }}>
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
                <Calendar mode="single" selected={dateFrom} onSelect={(date) => { setDateFrom(date); resetPage(); }} initialFocus className="p-3 pointer-events-auto" />
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
                <Calendar mode="single" selected={dateTo} onSelect={(date) => { setDateTo(date); resetPage(); }} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {hasFilters && <Button variant="outline" onClick={clearFilters}>Reset filter</Button>}
          </>
        )}
        below={hasFilters ? <p className="text-xs text-muted-foreground">{filteredLogs.length} dari {logs.length} aktivitas</p> : undefined}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Aktivitas Terkini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-8 w-8" />}
              title={hasFilters ? 'Tidak ada aktivitas yang cocok' : 'Belum ada aktivitas tercatat'}
              description={!hasFilters ? 'Aktivitas akan muncul saat Anda membuat, mengubah, atau menghapus data.' : undefined}
            />
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
      <Pagination page={page} pageSize={pageSize} total={filteredLogs.length} onPageChange={setPage} />
    </div>
  );
}
