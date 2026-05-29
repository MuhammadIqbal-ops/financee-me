import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Tags as TagsIcon, PiggyBank, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/currency';
import { Category, TransactionType } from '@/types/database';
import { cn } from '@/lib/utils';

const COLORS = [
  '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
];

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  color: z.string(),
  icon: z.string(),
  type: z.enum(['income', 'expense']),
});

const budgetSchema = z.object({
  category_id: z.string().min(1, 'Pilih kategori'),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
});

type CategoryFormData = z.infer<typeof categorySchema>;
type BudgetFormData = z.infer<typeof budgetSchema>;

export default function Categories() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<string | null>(null);
  const [deleteBudget, setDeleteBudget] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: budgets, isLoading: budgetsLoading } = useBudgets(currentMonth, currentYear);
  const { data: transactions } = useTransactions(currentMonth, currentYear);
  const { data: profile } = useProfile();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudgetMutation = useDeleteBudget();

  const currency = profile?.currency || 'IDR';

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: COLORS[0],
      icon: 'tag',
      type: 'expense',
    },
  });

  const budgetForm = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category_id: '',
      amount: 0,
    },
  });

  const expenseCategories = categories?.filter((c) => c.type === 'expense') || [];
  const incomeCategories = categories?.filter((c) => c.type === 'income') || [];
  const currentCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  // Calculate spending per category
  const categorySpending = new Map<string, number>();
  transactions?.filter((t) => t.type === 'expense').forEach((t) => {
    if (t.category_id) {
      const current = categorySpending.get(t.category_id) || 0;
      categorySpending.set(t.category_id, current + Number(t.amount));
    }
  });

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      categoryForm.reset({
        name: category.name,
        color: category.color,
        icon: category.icon,
        type: category.type,
      });
    } else {
      setEditingCategory(null);
      categoryForm.reset({
        name: '',
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        icon: 'tag',
        type: activeTab,
      });
    }
    setCategoryDialogOpen(true);
  };

  const handleOpenBudgetDialog = (budget?: any) => {
    if (budget) {
      setEditingBudgetId(budget.id);
      budgetForm.reset({
        category_id: budget.category_id,
        amount: Number(budget.amount),
      });
    } else {
      setEditingBudgetId(null);
      budgetForm.reset({
        category_id: '',
        amount: 0,
      });
    }
    setBudgetDialogOpen(true);
  };

  const onCategorySubmit = async (data: CategoryFormData) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, name: data.name, color: data.color, icon: data.icon, type: data.type });
    } else {
      await createCategory.mutateAsync({ name: data.name, color: data.color, icon: data.icon, type: data.type });
    }
    setCategoryDialogOpen(false);
    categoryForm.reset();
  };

  const onBudgetSubmit = async (data: BudgetFormData) => {
    if (editingBudgetId) {
      await updateBudget.mutateAsync({ id: editingBudgetId, amount: data.amount });
    } else {
      await createBudget.mutateAsync({
        category_id: data.category_id,
        amount: data.amount,
        month: currentMonth,
        year: currentYear,
      });
    }
    setBudgetDialogOpen(false);
    budgetForm.reset();
  };

  const handleDeleteCategory = async () => {
    if (deleteCategory) {
      await deleteCategoryMutation.mutateAsync(deleteCategory);
      setDeleteCategory(null);
    }
  };

  const handleDeleteBudget = async () => {
    if (deleteBudget) {
      await deleteBudgetMutation.mutateAsync(deleteBudget);
      setDeleteBudget(null);
    }
  };

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return { color: 'bg-destructive', text: 'Melebihi anggaran!', danger: true };
    if (percentage >= 80) return { color: 'bg-warning', text: 'Mendekati batas', danger: false };
    return { color: 'bg-success', text: 'Aman', danger: false };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kategori & Anggaran</h1>
        <p className="text-muted-foreground">Kelola kategori dan atur batas anggaran bulanan</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TransactionType)}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
          <TabsTrigger value="income">Pemasukan</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {/* Categories Section */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TagsIcon className="w-5 h-5" />
                  Kategori {activeTab === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                </CardTitle>
                <CardDescription>
                  {currentCategories.length} kategori
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenCategoryDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah
              </Button>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : currentCategories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada kategori
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {currentCategories.map((category) => {
                    const spent = categorySpending.get(category.id) || 0;
                    const budget = budgets?.find((b) => b.category_id === category.id);
                    const budgetAmount = budget ? Number(budget.amount) : 0;
                    const hasBudget = activeTab === 'expense' && budgetAmount > 0;
                    const percentage = hasBudget ? (spent / budgetAmount) * 100 : 0;
                    const isExceeded = hasBudget && percentage >= 100;
                    const isNear = hasBudget && percentage >= 80 && percentage < 100;
                    const clampedPct = Math.min(percentage, 100);

                    return (
                      <div
                        key={category.id}
                        className={cn(
                          'flex flex-col gap-3 p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors',
                          isExceeded && 'border-destructive/60 bg-destructive/5',
                          isNear && 'border-warning/60 bg-warning/5'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-white shrink-0"
                              style={{ backgroundColor: category.color }}
                            >
                              {category.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{category.name}</p>
                              {hasBudget && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {formatCurrency(spent, currency)} / {formatCurrency(budgetAmount, currency)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenCategoryDialog(category)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteCategory(category.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        {hasBudget && (
                          <div className="space-y-2">
                            <Progress
                              value={clampedPct}
                              className={cn(
                                'h-2',
                                isExceeded && '[&>div]:bg-destructive',
                                isNear && '[&>div]:bg-warning',
                                !isExceeded && !isNear && '[&>div]:bg-success'
                              )}
                            />
                            <div className="flex items-center justify-between">
                              {isExceeded ? (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Melebihi anggaran
                                </Badge>
                              ) : isNear ? (
                                <Badge className="gap-1 bg-warning text-warning-foreground hover:bg-warning/90">
                                  <AlertTriangle className="w-3 h-3" />
                                  Mendekati batas
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-success" />
                                  Aman
                                </Badge>
                              )}
                              <span className={cn(
                                'text-xs font-semibold tabular-nums',
                                isExceeded && 'text-destructive',
                                isNear && 'text-warning'
                              )}>
                                {Math.round(percentage)}%
                              </span>
                            </div>
                          </div>
                        )}

                        {activeTab === 'expense' && !hasBudget && spent > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Terpakai {formatCurrency(spent, currency)} · belum ada anggaran
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budgets Section (only for expenses) */}
          {activeTab === 'expense' && (
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PiggyBank className="w-5 h-5" />
                    Anggaran Bulan Ini
                  </CardTitle>
                  <CardDescription>
                    Atur batas pengeluaran per kategori
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenBudgetDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Anggaran
                </Button>
              </CardHeader>
              <CardContent>
                {budgetsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : budgets?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada anggaran yang diatur
                  </p>
                ) : (
                  <div className="space-y-4">
                    {budgets?.map((budget) => {
                      const spent = categorySpending.get(budget.category_id) || 0;
                      const percentage = Math.min((spent / Number(budget.amount)) * 100, 100);
                      const status = getBudgetStatus(spent, Number(budget.amount));

                      return (
                        <div
                          key={budget.id}
                          className={cn(
                            'p-4 rounded-lg border',
                            status.danger && 'border-destructive/50 bg-destructive/5'
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                                style={{ backgroundColor: budget.category?.color }}
                              >
                                {budget.category?.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{budget.category?.name}</p>
                                <p className={cn('text-xs', status.danger ? 'text-destructive' : 'text-muted-foreground')}>
                                  {status.text}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="font-semibold">
                                  {formatCurrency(spent, currency)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  dari {formatCurrency(Number(budget.amount), currency)}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenBudgetDialog(budget)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteBudget(budget.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <Progress value={percentage} className={cn('h-2', status.color)} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Perbarui detail kategori' : 'Buat kategori baru'}
            </DialogDescription>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kategori</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Makanan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
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
                control={categoryForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warna</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 flex-wrap">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              'w-8 h-8 rounded-full transition-transform',
                              field.value === color && 'ring-2 ring-offset-2 ring-primary scale-110'
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                  {editingCategory ? 'Simpan' : 'Tambah'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Budget Dialog */}
      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudgetId ? 'Edit Anggaran' : 'Tambah Anggaran'}
            </DialogTitle>
            <DialogDescription>
              Atur batas pengeluaran untuk kategori
            </DialogDescription>
          </DialogHeader>
          <Form {...budgetForm}>
            <form onSubmit={budgetForm.handleSubmit(onBudgetSubmit)} className="space-y-4">
              <FormField
                control={budgetForm.control}
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
                        {expenseCategories.map((cat) => (
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
                control={budgetForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batas Anggaran</FormLabel>
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

              <DialogFooter>
                <Button type="submit" disabled={createBudget.isPending || updateBudget.isPending}>
                  {editingBudgetId ? 'Simpan' : 'Tambah'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi dengan kategori ini akan kehilangan kategorinya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Budget Confirmation */}
      <AlertDialog open={!!deleteBudget} onOpenChange={() => setDeleteBudget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Anggaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Anggaran ini akan dihapus dari bulan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBudget} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
