import { format } from 'date-fns';
import { Transaction } from '@/types/database';
import { formatCurrency } from '@/lib/currency';

export function exportTransactionsCsv(
  transactions: Transaction[],
  currency: string,
  filename?: string
) {
  if (!transactions.length) return;

  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Mata Uang', 'Catatan'];
  const rows = transactions.map((t) => [
    format(new Date(t.date), 'dd/MM/yyyy'),
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    t.category?.name || 'Tanpa Kategori',
    t.amount.toString(),
    t.currency || currency,
    t.note || '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename || `transaksi-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
