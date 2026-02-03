import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ExpensePieChart } from '@/components/dashboard/ExpensePieChart';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { InsightsCard } from '@/components/dashboard/InsightsCard';
import { useTransactions, useMonthlyStats } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types/database';

export default function Dashboard() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: profile } = useProfile();
  const { data: stats, isLoading: statsLoading } = useMonthlyStats(currentMonth, currentYear);
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(currentMonth, currentYear);

  const currency = profile?.currency || 'IDR';

  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan keuangan {format(now, 'MMMM yyyy', { locale: id })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {statsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Pemasukan"
              value={formatCurrency(stats?.totalIncome || 0, currency)}
              icon={<TrendingUp className="w-6 h-6" />}
              variant="income"
            />
            <StatCard
              title="Total Pengeluaran"
              value={formatCurrency(stats?.totalExpense || 0, currency)}
              icon={<TrendingDown className="w-6 h-6" />}
              variant="expense"
            />
            <StatCard
              title="Sisa Saldo"
              value={formatCurrency(stats?.balance || 0, currency)}
              icon={<Wallet className="w-6 h-6" />}
              variant="balance"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {transactionsLoading ? (
          <>
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </>
        ) : (
          <>
            <ExpensePieChart transactions={transactions || []} currency={currency} />
            <CashFlowChart
              transactions={transactions || []}
              month={currentMonth}
              year={currentYear}
              currency={currency}
            />
          </>
        )}
      </div>

      {/* Insights */}
      <InsightsCard month={currentMonth} year={currentYear} currency={currency} />
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada transaksi bulan ini
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: transaction.category?.color + '20' }}
                    >
                      <span style={{ color: transaction.category?.color }}>
                        {transaction.category?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {transaction.category?.name || 'Tanpa Kategori'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.note || format(new Date(transaction.date), 'd MMM yyyy', { locale: id })}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold ${
                      transaction.type === 'income' ? 'text-income' : 'text-expense'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(Number(transaction.amount), currency)}
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
