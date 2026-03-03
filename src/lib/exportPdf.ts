import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '@/types/database';
import { formatCurrency } from '@/lib/currency';

interface CategoryStat {
  name: string;
  income: number;
  expense: number;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function exportReportPdf(
  transactions: Transaction[],
  stats: { totalIncome: number; totalExpense: number; balance: number },
  categoryStats: CategoryStat[],
  month: number,
  year: number,
  currency: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('DompetPintar', 14, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Laporan Keuangan', 14, 27);
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(`${MONTHS[month - 1]} ${year}`, 14, 36);

  // Line
  doc.setDrawColor(200);
  doc.line(14, 40, pageWidth - 14, 40);

  // Summary boxes
  let y = 48;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan', 14, y);
  y += 8;

  const summaryData = [
    ['Pemasukan', formatCurrency(stats.totalIncome, currency)],
    ['Pengeluaran', formatCurrency(stats.totalExpense, currency)],
    ['Saldo', formatCurrency(stats.balance, currency)],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Keterangan', 'Jumlah']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 },
  });

  // Category breakdown
  y = (doc as any).lastAutoTable.finalY + 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Pengeluaran per Kategori', 14, y);
  y += 4;

  const catRows = categoryStats
    .filter(c => c.expense > 0)
    .map(c => [c.name, formatCurrency(c.expense, currency)]);

  if (catRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Kategori', 'Total Pengeluaran']],
      body: catRows,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  } else {
    y += 8;
  }

  // Transaction list
  doc.setFont('helvetica', 'bold');
  doc.text('Daftar Transaksi', 14, y);
  y += 4;

  const txRows = transactions.map(t => [
    new Date(t.date).toLocaleDateString('id-ID'),
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    t.category?.name || 'Tanpa Kategori',
    (t.type === 'income' ? '+' : '-') + formatCurrency(Number(t.amount), currency),
    t.note || '-',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Catatan']],
    body: txRows,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      3: { halign: 'right' },
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `DompetPintar • ${MONTHS[month - 1]} ${year} • Halaman ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`laporan-keuangan-${MONTHS[month - 1]}-${year}.pdf`);
}
