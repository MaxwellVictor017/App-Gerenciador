import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-center">
        <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/30 text-2xl font-black">
          🍕
        </div>

        <h1 className="text-2xl font-black tracking-tight mb-2">
          Cardápio Digital SaaS
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Selecione uma demonstração abaixo para acessar o cardápio interativo mobile-first:
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/pizzaria-bella"
            className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-98 font-bold text-sm rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center justify-between"
          >
            <span>Acessar Pizzaria Bella (Geral)</span>
            <span>&rarr;</span>
          </Link>

          <Link
            href="/pizzaria-bella?mesa=4"
            className="w-full py-3.5 px-4 bg-slate-700/80 hover:bg-slate-700 active:scale-98 font-semibold text-sm rounded-xl transition-all border border-slate-600/70 flex items-center justify-between"
          >
            <span>Acessar via QR Code (Mesa 4)</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">Mesa 4</span>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700/60 text-xs text-slate-500">
          Rota dinâmica: <code className="text-rose-400 bg-slate-900/80 px-2 py-0.5 rounded">app/[restaurante_slug]/page.tsx</code>
        </div>
      </div>
    </main>
  );
}
