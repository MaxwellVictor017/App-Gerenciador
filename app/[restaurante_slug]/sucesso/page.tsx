'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface PageProps {
  params: Promise<{ restaurante_slug: string }> | { restaurante_slug: string };
}

export default function PedidoSucessoPage({ params }: PageProps) {
  const searchParams = useSearchParams();
  const resolvedParams = typeof (params as any)?.then === 'function' ? use(params as Promise<{ restaurante_slug: string }>) : (params as { restaurante_slug: string });
  const { restaurante_slug } = resolvedParams;

  const mesa = searchParams.get('mesa') || 'Não informada';
  const cliente = searchParams.get('cliente') || 'Cliente';
  const total = searchParams.get('total') ? `R$ ${parseFloat(searchParams.get('total')!).toFixed(2).replace('.', ',')}` : null;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto p-6 antialiased">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Ícone de Sucesso */}
        <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-emerald-200 animate-in zoom-in-75 duration-300">
          <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-3">
          Pedido Recebido com Sucesso!
        </span>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          A cozinha já começou o preparo!
        </h1>

        <p className="text-sm text-slate-500 max-w-xs mb-6 leading-relaxed">
          Obrigado, <strong className="text-slate-800">{cliente}</strong>. Seu pedido foi enviado diretamente para a cozinha e será servido em sua mesa em breve.
        </p>

        {/* Card com Detalhes do Pedido */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-2.5 text-left text-xs mb-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Mesa</span>
            <span className="font-extrabold text-slate-900 text-sm">Mesa {mesa}</span>
          </div>

          {total && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Valor Total</span>
              <span className="font-extrabold text-slate-900 text-sm">{total}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Status</span>
            <span className="flex items-center gap-1 font-semibold text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Na fila de preparo
            </span>
          </div>
        </div>
      </div>

      <Link
        href={`/${restaurante_slug}?mesa=${encodeURIComponent(mesa)}`}
        className="w-full py-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-center rounded-2xl shadow-lg shadow-slate-900/20 transition-all text-base"
      >
        Voltar para o Cardápio
      </Link>
    </main>
  );
}
