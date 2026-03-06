import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Wallet as WalletIcon, ArrowRightLeft, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useWalletBalances, useCreateWallet, useUpdateWallet, useDeleteWallet, Wallet } from '@/hooks/useWallets';
import { useWalletTransfers, useCreateTransfer } from '@/hooks/useWalletTransfers';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/currency';

const walletSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  color: z.string().min(1),
  initial_balance: z.number().min(0, 'Saldo awal minimal 0'),
});

const transferSchema = z.object({
  from_wallet_id: z.string().min(1, 'Pilih dompet asal'),
  to_wallet_id: z.string().min(1, 'Pilih dompet tujuan'),
  amount: z.number().min(1, 'Jumlah minimal 1'),
  note: z.string().optional(),
});

type WalletFormData = z.infer<typeof walletSchema>;
type TransferFormData = z.infer<typeof transferSchema>;

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function TransferHistory({ transfers, wallets, currency }: {
  transfers: { id: string; from_wallet_id: string; to_wallet_id: string; amount: number; note: string | null; date: string }[];
  wallets: (Wallet & { balance: number })[];
  currency: string;
}) {
  const [filterMonth, setFilterMonth] = useState('all');
  const getWalletName = (id: string) => wallets.find(w => w.id === id)?.name || '?';

  const months = useMemo(() => {
    const set = new Set<string>();
    transfers.forEach(t => {
      const d = new Date(t.date);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(set).sort().reverse();
  }, [transfers]);

  const filtered = useMemo(() => {
    if (filterMonth === 'all') return transfers;
    return transfers.filter(t => {
      const d = new Date(t.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === filterMonth;
    });
  }, [transfers, filterMonth]);

  if (!transfers.length) return null;

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" /> Riwayat Transfer
        </CardTitle>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[160px]">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {months.map(m => {
              const [y, mo] = m.split('-');
              const label = format(new Date(Number(y), Number(mo) - 1), 'MMM yyyy', { locale: idLocale });
              return <SelectItem key={m} value={m}>{label}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">Tidak ada transfer</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(tr => (
              <div key={tr.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {getWalletName(tr.from_wallet_id)} → {getWalletName(tr.to_wallet_id)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(tr.date), 'd MMM yyyy', { locale: idLocale })}
                    {tr.note && ` • ${tr.note}`}
                  </p>
                </div>
                <p className="font-semibold text-primary">{formatCurrency(Number(tr.amount), currency)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Wallets() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [editing, setEditing] = useState<(Wallet & { balance: number }) | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: wallets, isLoading } = useWalletBalances();
  const { data: transfers } = useWalletTransfers();
  const { data: profile } = useProfile();
  const createWallet = useCreateWallet();
  const updateWallet = useUpdateWallet();
  const deleteWallet = useDeleteWallet();
  const createTransfer = useCreateTransfer();
  const currency = profile?.currency || 'IDR';

  const form = useForm<WalletFormData>({
    resolver: zodResolver(walletSchema),
    defaultValues: { name: '', color: '#3b82f6', initial_balance: 0 },
  });

  const transferForm = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: { from_wallet_id: '', to_wallet_id: '', amount: 0, note: '' },
  });

  const openDialog = (wallet?: Wallet & { balance: number }) => {
    if (wallet) {
      setEditing(wallet);
      form.reset({ name: wallet.name, color: wallet.color, initial_balance: wallet.initial_balance });
    } else {
      setEditing(null);
      form.reset({ name: '', color: '#3b82f6', initial_balance: 0 });
    }
    setIsOpen(true);
  };

  const onSubmit = async (data: WalletFormData) => {
    if (editing) {
      await updateWallet.mutateAsync({ id: editing.id, name: data.name, color: data.color, initial_balance: data.initial_balance });
    } else {
      await createWallet.mutateAsync({ name: data.name, color: data.color, initial_balance: data.initial_balance });
    }
    setIsOpen(false);
  };

  const onTransferSubmit = async (data: TransferFormData) => {
    if (data.from_wallet_id === data.to_wallet_id) {
      transferForm.setError('to_wallet_id', { message: 'Dompet tujuan harus berbeda' });
      return;
    }
    await createTransfer.mutateAsync({
      from_wallet_id: data.from_wallet_id,
      to_wallet_id: data.to_wallet_id,
      amount: data.amount,
      note: data.note,
    });
    setIsTransferOpen(false);
    transferForm.reset();
  };

  const totalBalance = wallets?.reduce((sum, w) => sum + w.balance, 0) || 0;

  const getWalletName = (id: string) => wallets?.find(w => w.id === id)?.name || '?';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dompet</h1>
          <p className="text-muted-foreground">Kelola akun keuangan Anda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { transferForm.reset(); setIsTransferOpen(true); }}>
            <ArrowRightLeft className="w-4 h-4 mr-2" />Transfer
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}><Plus className="w-4 h-4 mr-2" />Tambah Dompet</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Dompet' : 'Tambah Dompet'}</DialogTitle>
                <DialogDescription>Atur nama dan saldo awal dompet</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl><Input placeholder="Contoh: Bank BCA" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="initial_balance" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saldo Awal</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="color" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warna</FormLabel>
                      <div className="flex gap-2 flex-wrap">
                        {COLORS.map(c => (
                          <button key={c} type="button"
                            className={`w-8 h-8 rounded-full border-2 transition-all ${field.value === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                            onClick={() => field.onChange(c)}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="submit" disabled={createWallet.isPending || updateWallet.isPending}>
                      {editing ? 'Simpan' : 'Tambah'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Transfer Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Antar Dompet</DialogTitle>
            <DialogDescription>Pindahkan saldo dari satu dompet ke dompet lain</DialogDescription>
          </DialogHeader>
          <Form {...transferForm}>
            <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4">
              <FormField control={transferForm.control} name="from_wallet_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dari Dompet</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih dompet asal" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {wallets?.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance, currency)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={transferForm.control} name="to_wallet_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ke Dompet</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih dompet tujuan" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {wallets?.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={transferForm.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={transferForm.control} name="note" render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (opsional)</FormLabel>
                  <FormControl><Input placeholder="Misal: Top up GoPay" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={createTransfer.isPending}>Transfer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Total */}
      <Card className="shadow-card bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <WalletIcon className="text-primary" size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Saldo Semua Dompet</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalBalance, currency)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Wallet List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))
        ) : !wallets?.length ? (
          <p className="text-muted-foreground col-span-full text-center py-8">Belum ada dompet</p>
        ) : (
          wallets.map(w => (
            <Card key={w.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: w.color + '20' }}>
                      <WalletIcon size={20} style={{ color: w.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{w.name}</p>
                      {w.is_default && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(w)}>
                      <Pencil size={14} />
                    </Button>
                    {!w.is_default && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(w.id)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className={`text-xl font-bold ${w.balance >= 0 ? 'text-[hsl(var(--income))]' : 'text-[hsl(var(--expense))]'}`}>
                  {formatCurrency(w.balance, currency)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Transfer History with Date Filter */}
      <TransferHistory transfers={transfers || []} wallets={wallets || []} currency={currency} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dompet?</AlertDialogTitle>
            <AlertDialogDescription>Transaksi yang terhubung dengan dompet ini akan kehilangan referensi wallet.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteWallet.mutateAsync(deleteId).then(() => setDeleteId(null)); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
