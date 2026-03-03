import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText, Download, Filter, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactions, useMonthlyStats } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/currency';
import { exportReportPdf } from '@/lib/exportPdf';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const { data: transactions, isLoading } = useTransactions(month, year);
  const { data: stats } = useMonthlyStats(month, year);
  const { data: categories } = useCategories();
  const { data: profile } = useProfile();

  const currency = profile?.currency || 'IDR';

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (selectedCategoryId === 'all') return transactions;
    return transactions.filter((t) => t.category_id === selectedCategoryId);
  }, [transactions, selectedCategoryId]);

  const categoryStats = useMemo(() => {
    if (!transactions) return [];
    const map = new Map<string, { income: number; expense: number; name: string; color: string }>();
    transactions.forEach((t) => {
      const key = t.category_id || 'uncategorized';
      const existing = map.get(key) || { income: 0, expense: 0, name: t.category?.name || 'Tanpa Kategori', color: t.category?.color || '#6b7280' };
      if (t.type === 'income') existing.income += Number(t.amount);
      else existing.expense += Number(t.amount);
      map.set(key, existing);
    });
    return Array.from(map.entries()).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.expense - a.expense);
  }, [transactions]);

  const handlePrevMonth = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); };
  const handleNextMonth = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); };

  const exportToCSV = () => {
    if (!filteredTransactions.length) return;
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Catatan'];
    const rows = filteredTransactions.map((t) => [
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.category?.name || 'Tanpa Kategori',
      t.amount.toString(),
      t.note || '',
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-keuangan-${MONTHS[month - 1]}-${year}.csv`;
    link.click();
  };

  const handleExportPdf = () => {
    if (!filteredTransactions.length || !stats) return;
    exportReportPdf(filteredTransactions, stats, categoryStats, month, year, currency);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan Keuangan</h1>
          <p className="text-muted-foreground">Analisis pemasukan dan pengeluaran</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPdf} disabled={!filteredTransactions.length}>
            <FileDown className="w-4 h-4 mr-2" />Export PDF
          </Button>
          <Button onClick={exportToCSV} disabled={!filteredTransactions.length}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <Card className="shadow-card">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}><ChevronLeft className="w-4 h-4" /></Button>
            <p className="text-lg font-semibold">{MONTHS[month - 1]} {year}</p>
            <Button variant="outline" size="icon" onClick={handleNextMonth}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card stat-income">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Pemasukan</p>
            <p className="text-2xl font-bold text-income">{formatCurrency(stats?.totalIncome || 0, currency)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card stat-expense">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-expense">{formatCurrency(stats?.totalExpense || 0, currency)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card stat-balance">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats?.balance || 0, currency)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Ringkasan per Kategori</CardTitle>
          <CardDescription>Pengeluaran terbesar bulan ini</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : categoryStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.slice(0, 5).map((stat) => (
                <div key={stat.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: stat.color }}>
                      {stat.name.charAt(0)}
                    </div>
                    <span className="font-medium">{stat.name}</span>
                  </div>
                  <div className="text-right">
                    {stat.expense > 0 && <p className="text-expense font-semibold">-{formatCurrency(stat.expense, currency)}</p>}
                    {stat.income > 0 && <p className="text-income text-sm">+{formatCurrency(stat.income, currency)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction List with Filter */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" />Daftar Transaksi</CardTitle>
            <CardDescription>{filteredTransactions.length} transaksi</CardDescription>
          </div>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Filter kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />{cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Tidak ada transaksi</p>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: transaction.category?.color + '20', color: transaction.category?.color }}>
                      {transaction.category?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.category?.name || 'Tanpa Kategori'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.date), 'd MMM yyyy', { locale: id })}
                        {transaction.note && ` • ${transaction.note}`}
                      </p>
                    </div>
                  </div>
                  <p className={`font-semibold ${transaction.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount), currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
