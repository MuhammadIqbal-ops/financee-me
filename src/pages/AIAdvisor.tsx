import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { useBudgets } from '@/hooks/useBudgets';
import { useGoals } from '@/hooks/useGoals';
import { useDebts } from '@/hooks/useDebts';
import { useWalletBalances } from '@/hooks/useWallets';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'Analisis pengeluaran saya bulan ini',
  'Beri saran cara menghemat uang',
  'Apakah anggaran saya sudah sehat?',
  'Bagaimana kondisi hutang piutang saya?',
];

export default function AIAdvisor() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const { data: transactions } = useTransactions(now.getMonth() + 1, now.getFullYear());
  const { data: profile } = useProfile();
  const { data: budgets } = useBudgets(now.getMonth() + 1, now.getFullYear());
  const { data: goals } = useGoals();
  const { data: debts } = useDebts();
  const { data: wallets } = useWalletBalances();
  const currency = profile?.currency || 'IDR';

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    const totalIncome = transactions?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || 0;
    const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) || 0;
    
    const categoryExpenses: Record<string, number> = {};
    transactions?.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category?.name || 'Lainnya';
      categoryExpenses[cat] = (categoryExpenses[cat] || 0) + Number(t.amount);
    });

    const totalWalletBalance = wallets?.reduce((s, w) => s + w.balance, 0) || 0;
    const totalDebt = debts?.filter(d => d.type === 'payable' && d.status !== 'paid').reduce((s, d) => s + d.amount - d.paid_amount, 0) || 0;
    const totalReceivable = debts?.filter(d => d.type === 'receivable' && d.status !== 'paid').reduce((s, d) => s + d.amount - d.paid_amount, 0) || 0;

    return `Data keuangan pengguna bulan ini (${currency}):
- Total Pemasukan: ${formatCurrency(totalIncome, currency)}
- Total Pengeluaran: ${formatCurrency(totalExpense, currency)}
- Saldo: ${formatCurrency(totalIncome - totalExpense, currency)}
- Total Saldo Dompet: ${formatCurrency(totalWalletBalance, currency)}
- Total Hutang Aktif: ${formatCurrency(totalDebt, currency)}
- Total Piutang Aktif: ${formatCurrency(totalReceivable, currency)}
- Pengeluaran per Kategori: ${Object.entries(categoryExpenses).map(([k, v]) => `${k}: ${formatCurrency(v, currency)}`).join(', ')}
- Jumlah Budget: ${budgets?.length || 0}
- Jumlah Goals: ${goals?.length || 0}
- Estimasi Pendapatan Bulanan: ${formatCurrency(profile?.monthly_income_estimate || 0, currency)}`;
  };

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    const allMessages = [...messages, userMsg];

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-advisor`;
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          context: buildContext(),
        }),
      });

      if (resp.status === 429) {
        toast.error('Terlalu banyak permintaan, coba lagi nanti.');
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error('Kredit AI habis, silakan top up.');
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error('Gagal memulai stream');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal mendapatkan respons AI');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-2rem)] animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="text-primary" size={24} />
          Asisten Keuangan AI
        </h1>
        <p className="text-muted-foreground text-sm">Tanyakan apa saja tentang kondisi keuangan Anda</p>
      </div>

      <Card className="flex-1 flex flex-col shadow-card overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot size={32} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">Halo! Saya asisten keuangan Anda</p>
                  <p className="text-sm text-muted-foreground mt-1">Saya bisa menganalisis keuangan dan memberi saran berdasarkan data Anda</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {SUGGESTIONS.map(s => (
                    <Button key={s} variant="outline" className="text-xs h-auto py-2 px-3 text-left justify-start" onClick={() => send(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-primary" />
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User size={16} className="text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-border">
          <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Tanya tentang keuangan Anda..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send size={18} />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
