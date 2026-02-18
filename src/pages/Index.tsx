// Updated responsive design for Index.tsx
import React from 'react';
import './Index.css';

const Index = () => {
  return (
    <div className="container">
      <header className="header">
        <h1>Welcome to Financee</h1>
      </header>
      <main className="main-content">
        <section className="features">
          <h2>Features</h2>
          <p>Manage your finances with ease!</p>
        </section>
      </main>
      <footer className="footer">
        <p>© 2026 Financee. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;