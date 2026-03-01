import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useCategories } from '@/hooks/useCategories';
import { useProfile } from '@/hooks/useProfile';
import {
  useRecurringTransactions,
  useCreateRecurringTransaction,
  useUpdateRecurringTransaction,
  useToggleRecurringTransaction,
  useDeleteRecurringTransaction,
  getFrequencyLabel,
  RecurringTransaction,
  RecurrenceFrequency,
} from '@/hooks/useRecurringTransactions';
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Pencil, RefreshCw, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

const formSchema = z.object({
  amount: z.string().min(1, 'Nominal harus diisi'),
  type: z.enum(['income', 'expense']),
  category_id: z.string().min(1, 'Kategori harus dipilih'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.string().min(1, 'Tanggal mulai harus diisi'),
  end_date: z.string().optional(),
  note: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Recurring() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const { data: profile } = useProfile();
  const { data: categories } = useCategories();
  const { data: recurringTransactions, isLoading } = useRecurringTransactions();
  const createMutation = useCreateRecurringTransaction();
  const updateMutation = useUpdateRecurringTransaction();
  const toggleMutation = useToggleRecurringTransaction();
  const deleteMutation = useDeleteRecurringTransaction();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      type: 'expense',
      category_id: '',
      frequency: 'monthly',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
      note: '',
    },
  });

  const selectedType = form.watch('type');
  const filteredCategories = categories?.filter((c) => c.type === selectedType) || [];

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset({
      amount: '',
      type: 'expense',
      category_id: '',
      frequency: 'monthly',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
      note: '',
    });
    setOpen(true);
  };

  const openEditDialog = (rt: RecurringTransaction) => {
    setEditingItem(rt);
    form.reset({
      amount: String(rt.amount),
      type: rt.type,
      category_id: rt.category_id || '',
      frequency: rt.frequency,
      start_date: rt.start_date,
      end_date: rt.end_date || '',
      note: rt.note || '',
    });
    setOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      amount: parseFloat(data.amount),
      type: data.type as 'income' | 'expense',
      category_id: data.category_id,
      frequency: data.frequency as RecurrenceFrequency,
      start_date: data.start_date,
      end_date: data.end_date || null,
      note: data.note,
    };

    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    form.reset();
    setEditingItem(null);
    setOpen(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await toggleMutation.mutateAsync({ id, is_active: !currentStatus });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const currency = profile?.currency || 'IDR';
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaksi Berulang</h1>
          <p className="text-muted-foreground">
            Kelola transaksi otomatis seperti gaji, tagihan, atau langganan
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="w-4 h-4" />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Transaksi Berulang' : 'Transaksi Berulang Baru'}</DialogTitle>
              <DialogDescription>
                {editingItem ? 'Ubah detail transaksi berulang' : 'Tambahkan transaksi yang akan dibuat otomatis secara berkala'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="income">Pemasukan</SelectItem>
                          <SelectItem value="expense">Pengeluaran</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nominal</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frekuensi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih frekuensi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Harian</SelectItem>
                          <SelectItem value="weekly">Mingguan</SelectItem>
                          <SelectItem value="monthly">Bulanan</SelectItem>
                          <SelectItem value="yearly">Tahunan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Mulai</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Berakhir</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tambahkan catatan..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Simpan'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Daftar Transaksi Berulang
          </CardTitle>
          <CardDescription>
            Transaksi yang akan dibuat secara otomatis berdasarkan jadwal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat...</div>
          ) : recurringTransactions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada transaksi berulang
            </div>
          ) : (
            <div className="space-y-3">
              {recurringTransactions?.map((rt) => (
                <div
                  key={rt.id}
                  className="flex items-center justify-between rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {rt.type === 'income' ? (
                      <TrendingUp className="w-5 h-5 text-[hsl(var(--income))] shrink-0" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-[hsl(var(--expense))] shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm truncate">
                          {rt.category?.name || 'Tanpa Kategori'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getFrequencyLabel(rt.frequency)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Berikutnya: {format(new Date(rt.next_run_date), 'd MMM yyyy', { locale: localeId })}</span>
                        {rt.note && <span>· {rt.note}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`font-semibold text-sm ${rt.type === 'income' ? 'text-[hsl(var(--income))]' : 'text-[hsl(var(--expense))]'}`}>
                      {rt.type === 'income' ? '+' : '-'}{formatCurrency(rt.amount, currency)}
                    </span>
                    <Switch
                      checked={rt.is_active}
                      onCheckedChange={() => handleToggle(rt.id, rt.is_active)}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(rt)}>
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Transaksi Berulang?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Transaksi berulang ini akan dihapus secara permanen dan tidak akan dibuat lagi secara otomatis.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(rt.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
