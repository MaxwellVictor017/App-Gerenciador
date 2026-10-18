import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cardápio Digital | SaaS Restaurantes',
  description: 'Cardápio digital moderno para restaurantes e pedidos na mesa.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
