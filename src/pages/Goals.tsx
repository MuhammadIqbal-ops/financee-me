import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Target, CalendarIcon, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/currency';
import { Goal } from '@/types/database';
import { cn } from '@/lib/utils';

const goalSchema = z.object({
  name: z.string().min(1, 'Nama target wajib diisi'),
  target_amount: z.number().positive('Target harus lebih dari 0'),
  current_amount: z.number().min(0, 'Jumlah tidak boleh negatif'),
  deadline: z.date().optional().nullable(),
});

type GoalFormData = z.infer<typeof goalSchema>;

export default function Goals() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addSavingsGoal, setAddSavingsGoal] = useState<Goal | null>(null);
  const [savingsAmount, setSavingsAmount] = useState('');

  const { data: goals, isLoading } = useGoals();
  const { data: profile } = useProfile();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const currency = profile?.currency || 'IDR';

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      target_amount: 0,
      current_amount: 0,
      deadline: null,
    },
  });

  const handleOpenDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      form.reset({
        name: goal.name,
        target_amount: Number(goal.target_amount),
        current_amount: Number(goal.current_amount),
        deadline: goal.deadline ? new Date(goal.deadline) : null,
      });
    } else {
      setEditingGoal(null);
      form.reset({
        name: '',
        target_amount: 0,
        current_amount: 0,
        deadline: null,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: GoalFormData) => {
    const formData = {
      name: data.name,
      target_amount: data.target_amount,
      current_amount: data.current_amount,
      deadline: data.deadline ? format(data.deadline, 'yyyy-MM-dd') : null,
    };

    if (editingGoal) {
      await updateGoal.mutateAsync({ id: editingGoal.id, ...formData });
    } else {
      await createGoal.mutateAsync(formData);
    }
    setIsDialogOpen(false);
    form.reset();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteGoal.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleAddSavings = async () => {
    if (addSavingsGoal && savingsAmount) {
      const amount = parseFloat(savingsAmount);
      if (amount > 0) {
        await updateGoal.mutateAsync({
          id: addSavingsGoal.id,
          current_amount: Number(addSavingsGoal.current_amount) + amount,
        });
        setAddSavingsGoal(null);
        setSavingsAmount('');
      }
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-success';
    if (percentage >= 75) return 'bg-primary';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-muted-foreground';
  };

  const getDeadlineStatus = (deadline: string | null) => {
    if (!deadline) return null;
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return { text: 'Lewat deadline', color: 'text-destructive' };
    if (days === 0) return { text: 'Hari ini', color: 'text-warning' };
    if (days <= 7) return { text: `${days} hari lagi`, color: 'text-warning' };
    if (days <= 30) return { text: `${days} hari lagi`, color: 'text-muted-foreground' };
    return { text: format(new Date(deadline), 'd MMM yyyy', { locale: id }), color: 'text-muted-foreground' };
  };

  const completedGoals = goals?.filter((g) => Number(g.current_amount) >= Number(g.target_amount)) || [];
  const activeGoals = goals?.filter((g) => Number(g.current_amount) < Number(g.target_amount)) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Target Keuangan</h1>
          <p className="text-muted-foreground">Kelola target tabungan dan investasi</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Target
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Aktif</p>
                <p className="text-2xl font-bold">{activeGoals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/10">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Tercapai</p>
                <p className="text-2xl font-bold">{completedGoals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Target Aktif</CardTitle>
          <CardDescription>Target yang sedang berjalan</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : activeGoals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada target aktif
            </p>
          ) : (
            <div className="space-y-4">
              {activeGoals.map((goal) => {
                const percentage = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
                const deadlineStatus = getDeadlineStatus(goal.deadline);

                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-soft transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{goal.name}</h3>
                        {deadlineStatus && (
                          <p className={cn('text-sm', deadlineStatus.color)}>
                            <CalendarIcon className="w-3 h-3 inline mr-1" />
                            {deadlineStatus.text}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAddSavingsGoal(goal)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Tabung
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(goal)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(goal.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={percentage} className={cn('h-3', getProgressColor(percentage))} />
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-primary">
                          {formatCurrency(Number(goal.current_amount), currency)}
                        </span>
                        <span className="text-muted-foreground">
                          dari {formatCurrency(Number(goal.target_amount), currency)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Kurang {formatCurrency(Number(goal.target_amount) - Number(goal.current_amount), currency)} lagi
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg text-success">🎉 Target Tercapai</CardTitle>
            <CardDescription>Selamat! Target-target yang sudah tercapai</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
                      <Target className="w-5 h-5 text-success-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{goal.name}</p>
                      <p className="text-sm text-success">
                        {formatCurrency(Number(goal.target_amount), currency)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(goal.id)}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Edit Target' : 'Tambah Target'}
            </DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Perbarui detail target' : 'Buat target keuangan baru'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Target</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Dana Darurat" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Jumlah</FormLabel>
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
                name="current_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Saat Ini</FormLabel>
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
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Deadline (opsional)</FormLabel>
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
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createGoal.isPending || updateGoal.isPending}>
                  {editingGoal ? 'Simpan' : 'Tambah'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Savings Dialog */}
      <Dialog open={!!addSavingsGoal} onOpenChange={() => setAddSavingsGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Tabungan</DialogTitle>
            <DialogDescription>
              Tambahkan jumlah tabungan untuk "{addSavingsGoal?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Jumlah</label>
              <Input
                type="number"
                placeholder="0"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSavingsGoal(null)}>
              Batal
            </Button>
            <Button onClick={handleAddSavings} disabled={!savingsAmount || updateGoal.isPending}>
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Target?</AlertDialogTitle>
            <AlertDialogDescription>
              Target ini akan dihapus permanen.
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
