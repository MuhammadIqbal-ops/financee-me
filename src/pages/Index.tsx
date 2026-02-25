import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">DompetPintar</h1>
      </div>
      <p className="text-muted-foreground mb-8 max-w-md">
        Aplikasi pengelolaan keuangan pribadi yang cerdas dan mudah digunakan.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => navigate('/login')}>Masuk</Button>
        <Button variant="outline" onClick={() => navigate('/register')}>Daftar</Button>
      </div>
      <footer className="absolute bottom-6 text-xs text-muted-foreground">
        © 2026 DompetPintar. All rights reserved.
      </footer>
    </div>
  );
}
