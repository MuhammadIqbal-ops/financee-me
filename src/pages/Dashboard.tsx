import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react';
import { format } from 'date-fns';
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
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: profile } = useProfile();
  const { data: stats, isLoading: statsLoading } = useMonthlyStats(currentMonth, currentYear);
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(currentMonth, currentYear);

  const currency = profile?.currency || 'IDR';
  const recentTransactions = transactions?.slice(0, 5) || [];
  const greeting = useMemo(() => getGreeting(), []);
  const displayName = profile?.full_name?.split(' ')[0] || '';

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
              Ringkasan keuangan {format(now, 'MMMM yyyy', { locale: id })}
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
                    month={currentMonth}
                    year={currentYear}
                    currency={currency}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Budget & Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
          <BudgetSummary month={currentMonth} year={currentYear} currency={currency} />
          <GoalsSummary currency={currency} />
        </div>

        {/* Insights */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <InsightsCard month={currentMonth} year={currentYear} currency={currency} />
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
