import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
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
    <ScrollArea className="h-[100dvh] w-full p-4 sm:p-6 md:p-8 bg-white space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-black">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan keuangan {format(now, 'MMMM yyyy', { locale: id })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Pemasukan"
              value={formatCurrency(stats?.totalIncome || 0, currency)}
              icon={<TrendingUp size={24} color="#10b981" />}
              variant="income"
            />
            <StatCard
              title="Total Pengeluaran"
              value={formatCurrency(stats?.totalExpense || 0, currency)}
              icon={<TrendingDown size={24} color="#ef4444" />}
              variant="expense"
            />
            <StatCard
              title="Sisa Saldo"
              value={formatCurrency(stats?.balance || 0, currency)}
              icon={<Wallet size={24} color="#3b82f6" />}
              variant="balance"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {transactionsLoading ? (
          <>
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Komposisi Pengeluaran</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpensePieChart transactions={transactions || []} currency={currency} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cashflow per Bulan</CardTitle>
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

      {/* Insights */}
      <div>
        <InsightsCard month={currentMonth} year={currentYear} currency={currency} />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaksi Terbaru</CardTitle>
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
                    className="flex items-center justify-between rounded-md px-3 py-3 bg-gray-50 dark:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center h-10 w-10 rounded-full"
                        style={{ backgroundColor: (categoryColor + '20') }}
                      >
                        <span className="font-bold text-base" style={{ color: categoryColor }}>
                          {transaction.category?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-black text-sm">
                          {transaction.category?.name || 'Tanpa Kategori'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.note || format(new Date(transaction.date), "d MMM yyyy", { locale: id })}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`font-semibold text-sm ${isIncome ? 'text-green-600' : 'text-red-500'}`}
                      >{isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount), currency)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}