import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, PieChart, Target, ArrowRight, Shield, Smartphone } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Lacak Keuangan',
      description: 'Catat pemasukan & pengeluaran dengan mudah dan cepat.',
    },
    {
      icon: <PieChart className="h-6 w-6" />,
      title: 'Laporan Visual',
      description: 'Lihat ringkasan keuangan dalam grafik yang informatif.',
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Target Keuangan',
      description: 'Tetapkan dan pantau target tabungan Anda.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Anggaran Pintar',
      description: 'Atur batas anggaran per kategori dengan notifikasi.',
    },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-x-hidden safe-top safe-bottom">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-12 sm:py-20 text-center relative">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -right-32 w-64 h-64 sm:w-96 sm:h-96 rounded-full opacity-10 blur-3xl"
            style={{ background: 'hsl(var(--primary))' }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-48 h-48 sm:w-72 sm:h-72 rounded-full opacity-10 blur-3xl"
            style={{ background: 'hsl(var(--accent))' }}
          />
        </div>

        {/* Logo + Title */}
        <div className="animate-fade-in flex flex-col items-center gap-4 mb-6 relative z-10">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl blur-xl opacity-30 scale-125"
              style={{ background: 'hsl(var(--primary))' }}
            />
            <div className="relative gradient-primary p-4 rounded-2xl shadow-elevated">
              <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            DompetPintar
          </h1>
        </div>

        {/* Subtitle */}
        <p
          className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-md sm:max-w-lg mb-8 leading-relaxed relative z-10"
          style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          Kelola keuangan pribadimu dengan <span className="text-primary font-semibold">cerdas</span>,{' '}
          <span className="text-accent font-semibold">mudah</span>, dan{' '}
          <span className="font-semibold text-foreground">aman</span>.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto relative z-10 animate-slide-up"
          style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          <Button
            size="lg"
            className="w-full sm:w-auto gradient-primary text-primary-foreground shadow-elevated hover:shadow-card transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-base px-8"
            onClick={() => navigate('/login')}
          >
            Mulai Sekarang
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto border-border hover:bg-secondary transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-base px-8"
            onClick={() => navigate('/register')}
          >
            Daftar Gratis
          </Button>
        </div>

        {/* Device hint */}
        <div
          className="flex items-center gap-2 mt-6 text-xs text-muted-foreground relative z-10 animate-slide-up"
          style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>Tersedia di semua perangkat</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-5 sm:px-8 pb-12 sm:pb-20">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-xl sm:text-2xl font-bold text-foreground text-center mb-8 sm:mb-12 animate-slide-up"
            style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
          >
            Fitur Unggulan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group flex gap-4 p-5 sm:p-6 rounded-xl bg-card shadow-card hover:shadow-elevated border border-border/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 animate-slide-up"
                style={{ animationDelay: `${0.3 + i * 0.1}s`, animationFillMode: 'both' }}
              >
                <div className="shrink-0 p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border/50 safe-bottom">
        © 2026 DompetPintar. All rights reserved.
      </footer>
    </div>
  );
}
