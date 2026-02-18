import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react-native';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useTransactions, useMonthlyStats } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/currency';
import { Transaction } from '@/types/database';
import StatCard from '@/components/dashboard/StatCard';
import ExpensePieChart from '@/components/dashboard/ExpensePieChart';
import CashFlowChart from '@/components/dashboard/CashFlowChart';
import InsightsCard from '@/components/dashboard/InsightsCard';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    marginBottom: 24,
  },
  chartsContainer: {
    marginBottom: 24,
    gap: 16,
  },
  chartWrapper: {
    marginBottom: 16,
  },
  insightsSection: {
    marginBottom: 24,
  },
  transactionsCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontWeight: '600',
    fontSize: 14,
  },
  incomeAmount: {
    color: '#10b981',
  },
  expenseAmount: {
    color: '#ef4444',
  },
  emptyState: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 32,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
});

export default function Dashboard() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: profile } = useProfile();
  const { data: stats, isLoading: statsLoading } = useMonthlyStats(currentMonth, currentYear);
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(currentMonth, currentYear);

  const currency = profile?.currency || 'IDR';
  const recentTransactions = transactions?.slice(0, 5) || [];

  const renderStatCards = () => {
    if (statsLoading) {
      return (
        <View style={styles.statsGrid}>
          <SkeletonLoader height={128} style={{ marginBottom: 12 }} />
          <SkeletonLoader height={128} style={{ marginBottom: 12 }} />
          <SkeletonLoader height={128} />
        </View>
      );
    }

    return (
      <View style={styles.statsGrid}>
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
      </View>
    );
  };

  const renderCharts = () => {
    if (transactionsLoading) {
      return (
        <View style={styles.chartsContainer}>
          <SkeletonLoader height={400} />
          <SkeletonLoader height={400} />
        </View>
      );
    }

    return (
      <View style={styles.chartsContainer}>
        <View style={styles.chartWrapper}>
          <ExpensePieChart transactions={transactions || []} currency={currency} />
        </View>
        <View style={styles.chartWrapper}>
          <CashFlowChart
            transactions={transactions || []}
            month={currentMonth}
            year={currentYear}
            currency={currency}
          />
        </View>
      </View>
    );
  };

  const renderTransactionItem = ({ item: transaction }: { item: Transaction }) => {
    const categoryColor = transaction.category?.color || '#999';
    const isIncome = transaction.type === 'income';

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.transactionIcon,
              { backgroundColor: categoryColor + '20' },
            ]}
          >
            <Text style={[styles.transactionIconText, { color: categoryColor }]}>  
              {transaction.category?.name?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionCategory}>
              {transaction.category?.name || 'Tanpa Kategori'}
            </Text>
            <Text style={styles.transactionDate}>
              {transaction.note ||
                format(new Date(transaction.date), 'd MMM yyyy', { locale: id })}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            isIncome ? styles.incomeAmount : styles.expenseAmount,
          ]}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(Number(transaction.amount), currency)}
        </Text>
      </View>
    );
  };

  const renderTransactions = () => {
    if (transactionsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      );
    }

    if (recentTransactions.length === 0) {
      return (
        <Text style={styles.emptyState}>Belum ada transaksi bulan ini</Text>
      );
    }

    return (
      <FlatList
        data={recentTransactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>
            Ringkasan keuangan {format(now, 'MMMM yyyy', { locale: id })}
          </Text>
        </View>

        {/* Stats Cards */}
        {renderStatCards()}

        {/* Charts */}
        {renderCharts()}

        {/* Insights */}
        <View style={styles.insightsSection}>
          <InsightsCard month={currentMonth} year={currentYear} currency={currency} />
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsCard}>
          <Text style={styles.transactionsTitle}>Transaksi Terbaru</Text>
          {renderTransactions()}
        </View>
      </ScrollView>
    </View>
  );
}