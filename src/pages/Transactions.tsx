import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Plus, Pencil, Trash2, Search, Filter, Upload, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useProfile } from '@/hooks/useProfile';
import { useWallets } from '@/hooks/useWallets';
import { formatCurrency } from '@/lib/currency';
import { Transaction, TransactionType } from '@/types/database';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const transactionSchema = z.object({
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  type: z.enum(['income', 'expense']),
  category_id: z.string().min(1, 'Pilih kategori'),
  date: z.date(),
  note: z.string().optional(),
  wallet_id: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function Transactions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useCategories();
  const { data: profile } = useProfile();
  const { data: wallets } = useWallets();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const currency = profile?.currency || 'IDR';

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      type: 'expense',
      category_id: '',
      date: new Date(),
      note: '',
      wallet_id: '',
    },
  });

  const selectedType = form.watch('type');
  const filteredCategories = categories?.filter((c) => c.type === selectedType) || [];

  const filteredTransactions = transactions?.filter((t) => {
    const matchesSearch =
      t.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return (searchQuery === '' || matchesSearch) && matchesType;
  });

  const handleOpenDialog = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      form.reset({
        amount: Number(transaction.amount),
        type: transaction.type,
        category_id: transaction.category_id || '',
        date: new Date(transaction.date),
        note: transaction.note || '',
        wallet_id: (transaction as any).wallet_id || '',
      });
      setReceiptPreview((transaction as any).receipt_url || null);
    } else {
      setEditingTransaction(null);
      form.reset({
        amount: 0,
        type: 'expense',
        category_id: '',
        date: new Date(),
        note: '',
        wallet_id: wallets?.[0]?.id || '',
      });
      setReceiptPreview(null);
    }
    setIsDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('receipts').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('receipts').getPublicUrl(path);
    return data.publicUrl;
  };

  const onSubmit = async (data: TransactionFormData) => {
    setUploading(true);
    try {
      let receipt_url: string | null | undefined = receiptPreview;
      if (receiptFile) {
        receipt_url = await uploadReceipt(receiptFile);
      }

      const formData = {
        amount: data.amount,
        type: data.type,
        category_id: data.category_id,
        date: format(data.date, 'yyyy-MM-dd'),
        note: data.note,
        wallet_id: data.wallet_id || null,
        receipt_url: receipt_url || null,
      };

      if (editingTransaction) {
        await updateTransaction.mutateAsync({ id: editingTransaction.id, ...formData });
      } else {
        await createTransaction.mutateAsync(formData);
      }
      setIsDialogOpen(false);
      form.reset();
      setReceiptFile(null);
      setReceiptPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTransaction.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaksi</h1>
          <p className="text-muted-foreground">Kelola pemasukan dan pengeluaran</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Transaksi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </DialogTitle>
              <DialogDescription>
                {editingTransaction
                  ? 'Perbarui detail transaksi'
                  : 'Catat pemasukan atau pengeluaran baru'}
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
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('category_id', '');
                        }}
                        value={field.value}
                      >
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
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
                          {filteredCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.name}
                              </div>
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
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Tanggal</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'd MMMM yyyy', { locale: id })
                              ) : (
                                <span>Pilih tanggal</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan (opsional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tambahkan catatan..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Wallet selector */}
                <FormField
                  control={form.control}
                  name="wallet_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dompet (opsional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih dompet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets?.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                                {w.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Receipt upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Foto Struk (opsional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {receiptPreview ? (
                    <div className="relative w-full">
                      <img src={receiptPreview} alt="Receipt" className="w-full max-h-40 object-cover rounded-lg border" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={16} />
                      Upload Struk
                    </Button>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createTransaction.isPending || updateTransaction.isPending || uploading}
                  >
                    {uploading ? 'Mengupload...' : editingTransaction ? 'Simpan' : 'Tambah'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as TransactionType | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="income">Pemasukan</SelectItem>
            <SelectItem value="expense">Pengeluaran</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Daftar Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : !filteredTransactions?.length ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery || filterType !== 'all'
                ? 'Tidak ada transaksi yang cocok'
                : 'Belum ada transaksi'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-medium"
                      style={{
                        backgroundColor: transaction.category?.color + '20',
                        color: transaction.category?.color,
                      }}
                    >
                      {transaction.category?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {transaction.category?.name || 'Tanpa Kategori'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.note ||
                          format(new Date(transaction.date), 'd MMM yyyy', { locale: id })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-semibold ${
                        transaction.type === 'income' ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(Number(transaction.amount), currency)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(transaction)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(transaction.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Transaksi akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
