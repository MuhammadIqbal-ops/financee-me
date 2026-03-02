import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalletBalances } from '@/hooks/useWallets';
import { formatCurrency } from '@/lib/currency';
import { Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WalletSummaryProps {
  currency?: string;
}

export function WalletSummary({ currency = 'IDR' }: WalletSummaryProps) {
  const navigate = useNavigate();
  const { data: wallets, isLoading } = useWalletBalances();

  if (isLoading) return null;

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Dompet</CardTitle>
        <button onClick={() => navigate('/wallets')} className="text-xs text-primary hover:underline">Kelola</button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!wallets?.length ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Wallet size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Belum ada dompet</p>
          </div>
        ) : (
          wallets.slice(0, 4).map(w => (
            <div key={w.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-muted/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: w.color + '20' }}>
                  <Wallet size={14} style={{ color: w.color }} />
                </div>
                <span className="text-sm font-medium text-foreground">{w.name}</span>
              </div>
              <span className={`text-sm font-semibold ${w.balance >= 0 ? 'text-[hsl(var(--income))]' : 'text-[hsl(var(--expense))]'}`}>
                {formatCurrency(w.balance, currency)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
