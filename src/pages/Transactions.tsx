import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Plus, Pencil, Trash2, Search, Filter, Upload, Image, X, Globe, Download } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import { exportTransactionsCsv } from '@/lib/exportCsv';
import { SUPPORTED_CURRENCIES, useExchangeRates, convertAmount } from '@/hooks/useExchangeRates';

const transactionSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Jumlah harus berupa angka' })
    .positive('Jumlah harus lebih dari 0')
    .max(999_999_999_999, 'Jumlah terlalu besar')
    .finite('Jumlah tidak valid'),
  type: z.enum(['income', 'expense']),
  category_id: z.string().min(1, 'Pilih kategori'),
  date: z.date({ required_error: 'Pilih tanggal' }),
  note: z.string().trim().max(500, 'Catatan maksimal 500 karakter').optional(),
  wallet_id: z.string().optional(),
  currency: z.string().optional(),
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
  const [isDragging, setIsDragging] = useState(false);
  const [amountRaw, setAmountRaw] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useCategories();
  const { data: profile } = useProfile();
  const { data: wallets } = useWallets();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const currency = profile?.currency || 'IDR';
  const { data: exchangeRates } = useExchangeRates(currency);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange',
    defaultValues: {
      amount: 0,
      type: 'expense',
      category_id: '',
      date: new Date(),
      note: '',
      wallet_id: '',
      currency: '',
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
      const amt = Number(transaction.amount);
      form.reset({
        amount: amt,
        type: transaction.type,
        category_id: transaction.category_id || '',
        date: new Date(transaction.date),
        note: transaction.note || '',
        wallet_id: (transaction as any).wallet_id || '',
        currency: transaction.currency || '',
      });
      setAmountRaw(amt ? String(amt) : '');
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
        currency: '',
      });
      setAmountRaw('');
      setReceiptPreview(null);
    }
    setIsDialogOpen(true);
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    if (!user) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('receipts').upload(path, file);
    if (error) throw error;
    const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 3600);
    if (!data?.signedUrl) throw new Error('Failed to create signed URL');
    return data.signedUrl;
  };

  const getReceiptUrl = async (storedUrl: string): Promise<string> => {
    // If it's already a signed URL or full URL, extract path
    try {
      const url = new URL(storedUrl);
      const pathMatch = url.pathname.match(/\/object\/(?:public|sign)\/receipts\/(.+)/);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1].split('?')[0]);
        const { data } = await supabase.storage.from('receipts').createSignedUrl(filePath, 3600);
        return data?.signedUrl || storedUrl;
      }
    } catch {
      // If it's just a path, use it directly
      const { data } = await supabase.storage.from('receipts').createSignedUrl(storedUrl, 3600);
      return data?.signedUrl || storedUrl;
    }
    return storedUrl;
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
        currency: data.currency || null,
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportTransactionsCsv(filteredTransactions || [], currency)}
            disabled={!filteredTransactions?.length}
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Transaksi
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-lg p-0 gap-0 max-h-[calc(100dvh-1rem)] flex flex-col">
            <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 border-b border-border/60 sticky top-0 bg-card/95 backdrop-blur-sm z-10 rounded-t-2xl">
              <DialogTitle className="text-lg">
                {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingTransaction
                  ? 'Perbarui detail transaksi'
                  : 'Catat pemasukan atau pengeluaran baru'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
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
                  render={({ field }) => {
                    const selectedCurrency = form.watch('currency') || currency;
                    const parsed = Number(amountRaw.replace(/,/g, '.')) || 0;
                    return (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          <span>Jumlah</span>
                          {parsed > 0 && (
                            <span className="text-xs font-normal text-primary">
                              {formatCurrency(parsed, selectedCurrency)}
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            pattern="[0-9.,]*"
                            placeholder="0"
                            value={amountRaw}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9.,]/g, '');
                              setAmountRaw(v);
                              const n = parseFloat(v.replace(/,/g, '.'));
                              field.onChange(Number.isFinite(n) ? n : 0);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            className="text-lg font-semibold tabular-nums h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />


                {/* Currency selector */}
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mata Uang</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === '__default__' ? '' : v)} value={field.value || '__default__'}>
                        <FormControl>
                          <SelectTrigger>
                            <Globe className="w-4 h-4 mr-2" />
                            <SelectValue placeholder={`${currency} (default)`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__default__">
                            {currency} (default)
                          </SelectItem>
                          {SUPPORTED_CURRENCIES.filter(c => c.code !== currency).map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.symbol} {c.code} - {c.name}
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

                {/* Receipt upload with drag-and-drop */}
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
                    <div className="relative w-full animate-scale-in">
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
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-all duration-200',
                        isDragging
                          ? 'border-primary bg-primary/5 scale-[1.02]'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      )}
                    >
                      <div className={cn(
                        'rounded-full p-2 transition-colors duration-200',
                        isDragging ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        <Image size={20} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          {isDragging ? 'Lepas untuk upload' : 'Seret foto struk ke sini'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          atau klik untuk memilih file
                        </p>
                      </div>
                    </div>
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
                    {(transaction as any).receipt_url && (
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={async () => {
                          const url = await getReceiptUrl((transaction as any).receipt_url);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <Image size={16} />
                      </button>
                    )}
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type === 'income' ? 'text-income' : 'text-expense'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(Number(transaction.amount), transaction.currency || currency)}
                      </p>
                      {transaction.currency && transaction.currency !== currency && exchangeRates && (
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatCurrency(
                            convertAmount(Number(transaction.amount), transaction.currency, currency, exchangeRates),
                            currency
                          )}
                        </p>
                      )}
                    </div>
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
