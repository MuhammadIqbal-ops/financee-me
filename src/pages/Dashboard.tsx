import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Wallet, Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { useTransactions, useMonthlyStats } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/currency';
import { Transaction } from '@/types/database';
import { StatCard } from '@/components/dashboard/StatCard';
import { ExpensePieChart } from '@/components/dashboard/ExpensePieChart';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { InsightsCard } from '@/components/dashboard/InsightsCard';
import { BudgetSummary } from '@/components/dashboard/BudgetSummary';
import { GoalsSummary } from '@/components/dashboard/GoalsSummary';
import { RecurringSummary } from '@/components/dashboard/RecurringSummary';
import { WalletSummary } from '@/components/dashboard/WalletSummary';
import { DebtSummary } from '@/components/dashboard/DebtSummary';
import { DashboardSettings } from '@/components/dashboard/DashboardSettings';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useNavigate } from 'react-router-dom';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const now = new Date();

  const [selectedDate, setSelectedDate] = useState(now);
  const selectedMonth = selectedDate.getMonth() + 1;
  const selectedYear = selectedDate.getFullYear();
  const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  const { data: profile } = useProfile();
  const { data: stats, isLoading: statsLoading } = useMonthlyStats(selectedMonth, selectedYear);
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(selectedMonth, selectedYear);
  const dashboardLayout = useDashboardLayout();

  const currency = profile?.currency || 'IDR';
  const recentTransactions = transactions?.slice(0, 5) || [];
  const greeting = useMemo(() => getGreeting(), []);
  const displayName = profile?.full_name?.split(' ')[0] || '';

  const WIDGET_MAP: Record<string, React.ReactNode> = {
    budget: <BudgetSummary key="budget" month={selectedMonth} year={selectedYear} currency={currency} />,
    goals: <GoalsSummary key="goals" currency={currency} />,
    recurring: <RecurringSummary key="recurring" currency={currency} />,
    wallets: <WalletSummary key="wallets" currency={currency} />,
    debts: <DebtSummary key="debts" currency={currency} />,
  };

  const goToPrevMonth = () => setSelectedDate((d) => subMonths(d, 1));
  const goToNextMonth = () => {
    const next = addMonths(selectedDate, 1);
    if (next <= now) setSelectedDate(next);
  };
  const goToCurrentMonth = () => setSelectedDate(now);

  return (
    <ScrollArea className="h-[100dvh] w-full">
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        {/* Header with Greeting & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {greeting}{displayName ? `, ${displayName}` : ''}! 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Ringkasan keuangan Anda
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-[hsl(var(--income))] text-[hsl(var(--income))] hover:bg-[hsl(var(--income)/0.1)]"
              onClick={() => navigate('/transactions?type=income')}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Pemasukan</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-[hsl(var(--expense))] text-[hsl(var(--expense))] hover:bg-[hsl(var(--expense)/0.1)]"
              onClick={() => navigate('/transactions?type=expense')}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Pengeluaran</span>
            </Button>
          </div>
        </div>

        {/* Month Filter */}
        <div className="flex items-center justify-center gap-2 animate-fade-in">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8">
            <ChevronLeft size={18} />
          </Button>
          <button
            onClick={goToCurrentMonth}
            className="px-4 py-1.5 rounded-lg bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-colors min-w-[160px] text-center"
          >
            {format(selectedDate, 'MMMM yyyy', { locale: id })}
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="h-8 w-8"
          >
            <ChevronRight size={18} />
          </Button>
          {!isCurrentMonth && (
            <Button variant="outline" size="sm" onClick={goToCurrentMonth} className="ml-2 gap-1 text-xs">
              <RefreshCw size={12} />
              Hari ini
            </Button>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
          {statsLoading ? (
            <>
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </>
          ) : (
            <>
              <StatCard
                title="Total Pemasukan"
                value={formatCurrency(stats?.totalIncome || 0, currency)}
                icon={<TrendingUp size={24} className="text-[hsl(var(--income))]" />}
                variant="income"
              />
              <StatCard
                title="Total Pengeluaran"
                value={formatCurrency(stats?.totalExpense || 0, currency)}
                icon={<TrendingDown size={24} className="text-[hsl(var(--expense))]" />}
                variant="expense"
              />
              <StatCard
                title="Sisa Saldo"
                value={formatCurrency(stats?.balance || 0, currency)}
                icon={<Wallet size={24} className="text-primary" />}
                variant="balance"
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          {transactionsLoading ? (
            <>
              <Skeleton className="h-80 w-full rounded-xl" />
              <Skeleton className="h-80 w-full rounded-xl" />
            </>
          ) : (
            <>
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Komposisi Pengeluaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpensePieChart transactions={transactions || []} currency={currency} />
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Cash Flow Bulanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <CashFlowChart
                    transactions={transactions || []}
                    month={selectedMonth}
                    year={selectedYear}
                    currency={currency}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Budget, Goals, Recurring, Wallets, Debts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
          <BudgetSummary month={selectedMonth} year={selectedYear} currency={currency} />
          <GoalsSummary currency={currency} />
          <RecurringSummary currency={currency} />
          <WalletSummary currency={currency} />
          <DebtSummary currency={currency} />
        </div>

        {/* Insights */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <InsightsCard month={selectedMonth} year={selectedYear} currency={currency} />
        </div>

        {/* Recent Transactions */}
        <Card className="shadow-card animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Transaksi Terbaru</CardTitle>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-primary hover:underline"
            >
              Lihat Semua
            </button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {transactionsLoading ? (
                <div className="flex justify-center py-8">
                  <Skeleton className="h-8 w-32" />
                </div>
              ) : recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada transaksi bulan ini</p>
              ) : (
                recentTransactions.map((transaction: Transaction) => {
                  const categoryColor = transaction.category?.color || '#999';
                  const isIncome = transaction.type === "income";
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-lg px-3 py-3 bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center h-10 w-10 rounded-full"
                          style={{ backgroundColor: categoryColor + '20' }}
                        >
                          <span className="font-bold text-base" style={{ color: categoryColor }}>
                            {transaction.category?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground text-sm">
                            {transaction.category?.name || 'Tanpa Kategori'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.note || format(new Date(transaction.date), "d MMM yyyy", { locale: id })}
                          </div>
                        </div>
                      </div>
                      <span className={`font-semibold text-sm ${isIncome ? 'text-[hsl(var(--income))]' : 'text-[hsl(var(--expense))]'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount), currency)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
