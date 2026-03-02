import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Plus, Pencil, Trash2, CalendarIcon, CreditCard, HandCoins, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebts, useCreateDebt, useUpdateDebt, useDeleteDebt, Debt, DebtType } from '@/hooks/useDebts';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

const debtSchema = z.object({
  person_name: z.string().min(1, 'Nama wajib diisi'),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  type: z.enum(['payable', 'receivable']),
  due_date: z.date().optional(),
  note: z.string().optional(),
});

type DebtFormData = z.infer<typeof debtSchema>;

export default function Debts() {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payDialog, setPayDialog] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [tab, setTab] = useState('all');

  const { data: debts, isLoading } = useDebts();
  const { data: profile } = useProfile();
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();
  const currency = profile?.currency || 'IDR';

  const form = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: { person_name: '', amount: 0, type: 'receivable', note: '' },
  });

  const openDialog = (debt?: Debt) => {
    if (debt) {
      setEditing(debt);
      form.reset({
        person_name: debt.person_name,
        amount: debt.amount,
        type: debt.type as DebtType,
        due_date: debt.due_date ? new Date(debt.due_date) : undefined,
        note: debt.note || '',
      });
    } else {
      setEditing(null);
      form.reset({ person_name: '', amount: 0, type: 'receivable', note: '' });
    }
    setIsOpen(true);
  };

  const onSubmit = async (data: DebtFormData) => {
    const payload = {
      person_name: data.person_name,
      amount: data.amount,
      type: data.type,
      due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : null,
      note: data.note,
    };
    if (editing) {
      await updateDebt.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createDebt.mutateAsync(payload);
    }
    setIsOpen(false);
  };

  const handlePay = async () => {
    if (!payDialog) return;
    const newPaid = payDialog.paid_amount + payAmount;
    const newStatus = newPaid >= payDialog.amount ? 'paid' : 'partial';
    await updateDebt.mutateAsync({ id: payDialog.id, paid_amount: newPaid, status: newStatus });
    setPayDialog(null);
    setPayAmount(0);
  };

  const filtered = debts?.filter(d => {
    if (tab === 'all') return true;
    if (tab === 'payable') return d.type === 'payable' && d.status !== 'paid';
    if (tab === 'receivable') return d.type === 'receivable' && d.status !== 'paid';
    if (tab === 'paid') return d.status === 'paid';
    return true;
  }) || [];

  const totalPayable = debts?.filter(d => d.type === 'payable' && d.status !== 'paid').reduce((s, d) => s + d.amount - d.paid_amount, 0) || 0;
  const totalReceivable = debts?.filter(d => d.type === 'receivable' && d.status !== 'paid').reduce((s, d) => s + d.amount - d.paid_amount, 0) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hutang & Piutang</h1>
          <p className="text-muted-foreground">Kelola catatan hutang dan piutang</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}><Plus className="w-4 h-4 mr-2" />Tambah</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit' : 'Tambah'} Hutang/Piutang</DialogTitle>
              <DialogDescription>Catat hutang atau piutang baru</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="payable">Hutang (Saya berutang)</SelectItem>
                        <SelectItem value="receivable">Piutang (Orang berutang ke saya)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="person_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Orang</FormLabel>
                    <FormControl><Input placeholder="Nama" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah</FormLabel>
                    <FormControl><Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="due_date" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Jatuh Tempo (opsional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'd MMMM yyyy', { locale: localeId }) : 'Pilih tanggal'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="note" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (opsional)</FormLabel>
                    <FormControl><Textarea placeholder="Catatan..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={createDebt.isPending || updateDebt.isPending}>
                    {editing ? 'Simpan' : 'Tambah'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-card border-[hsl(var(--expense))]/20 bg-[hsl(var(--expense))]/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-[hsl(var(--expense))]/10 flex items-center justify-center">
              <CreditCard className="text-[hsl(var(--expense))]" size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hutang</p>
              <p className="text-xl font-bold text-[hsl(var(--expense))]">{formatCurrency(totalPayable, currency)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-[hsl(var(--income))]/20 bg-[hsl(var(--income))]/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-[hsl(var(--income))]/10 flex items-center justify-center">
              <HandCoins className="text-[hsl(var(--income))]" size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Piutang</p>
              <p className="text-xl font-bold text-[hsl(var(--income))]">{formatCurrency(totalReceivable, currency)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & List */}
      <Card className="shadow-card">
        <CardHeader>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="payable">Hutang</TabsTrigger>
              <TabsTrigger value="receivable">Piutang</TabsTrigger>
              <TabsTrigger value="paid">Lunas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : !filtered.length ? (
            <p className="text-center text-muted-foreground py-8">Tidak ada data</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(d => {
                const remaining = d.amount - d.paid_amount;
                const pct = d.amount > 0 ? (d.paid_amount / d.amount) * 100 : 0;
                const isOverdue = d.due_date && new Date(d.due_date) < new Date() && d.status !== 'paid';
                return (
                  <div key={d.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${d.type === 'payable' ? 'bg-[hsl(var(--expense))]/10' : 'bg-[hsl(var(--income))]/10'}`}>
                          {d.type === 'payable' ? <CreditCard size={18} className="text-[hsl(var(--expense))]" /> : <HandCoins size={18} className="text-[hsl(var(--income))]" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{d.person_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant={d.status === 'paid' ? 'default' : d.status === 'partial' ? 'secondary' : 'outline'} className="text-[10px]">
                              {d.status === 'paid' ? 'Lunas' : d.status === 'partial' ? 'Sebagian' : 'Belum'}
                            </Badge>
                            {d.due_date && (
                              <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                                {isOverdue ? '⚠ ' : ''}Jatuh tempo: {format(new Date(d.due_date), 'd MMM yyyy', { locale: localeId })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`font-semibold text-sm ${d.type === 'payable' ? 'text-[hsl(var(--expense))]' : 'text-[hsl(var(--income))]'}`}>
                          {formatCurrency(remaining, currency)}
                        </span>
                        {d.status !== 'paid' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPayDialog(d); setPayAmount(remaining); }}>
                            <CheckCircle2 size={14} className="text-primary" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(d)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(d.id)}>
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {d.paid_amount > 0 && (
                      <div className="pl-13">
                        <Progress value={pct} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Dibayar {formatCurrency(d.paid_amount, currency)} dari {formatCurrency(d.amount, currency)}
                        </p>
                      </div>
                    )}
                    {d.note && <p className="text-xs text-muted-foreground pl-13">{d.note}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Dialog */}
      <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bayar {payDialog?.type === 'payable' ? 'Hutang' : 'Piutang'}</DialogTitle>
            <DialogDescription>Ke {payDialog?.person_name} - Sisa: {formatCurrency((payDialog?.amount || 0) - (payDialog?.paid_amount || 0), currency)}</DialogDescription>
          </DialogHeader>
          <Input type="number" value={payAmount} onChange={e => setPayAmount(parseFloat(e.target.value) || 0)} placeholder="Jumlah bayar" />
          <DialogFooter>
            <Button onClick={handlePay} disabled={updateDebt.isPending || payAmount <= 0}>Bayar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus?</AlertDialogTitle>
            <AlertDialogDescription>Data akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteDebt.mutateAsync(deleteId).then(() => setDeleteId(null)); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
