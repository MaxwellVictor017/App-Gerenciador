'use client';

import React, { useEffect, useState } from 'react';
import { useCartStore } from '@/store/useCartStore';

interface CartSummaryProps {
  corPrimaria?: string;
  onOpenCart?: () => void;
}

/**
 * Utilitário para formatação monetária em Real Brasileiro (BRL)
 */
function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Componente Visual Flutuante (Mobile-First): CartSummary
 * 
 * Exibe a barra de resumo de pedido fixa na parte inferior da tela quando há itens no carrinho.
 * Integração reativa direta com o Zustand (`useCartStore`) e proteção contra hydration mismatch do SSR.
 */
export const CartSummary: React.FC<CartSummaryProps> = ({
  corPrimaria = '#E11D48',
  onOpenCart,
}) => {
  // Estado para garantir sincronização segura com localStorage no Next.js (evita hydration mismatch)
  const [isMounted, setIsMounted] = useState(false);

  // Seletores reativos do Zustand
  const items = useCartStore((state) => state.items);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Antes de hidratar no cliente, não renderiza nada
  if (!isMounted) {
    return null;
  }

  const totalItens = getTotalItems();
  const valorTotal = getTotalPrice();

  // Visibilidade Condicional: só renderiza se houver itens no carrinho
  if (totalItens === 0 || items.length === 0) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Resumo do carrinho de compras"
      className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-5"
    >
      <div
        onClick={onOpenCart}
        style={{ backgroundColor: corPrimaria }}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xl shadow-black/20 text-white cursor-pointer select-none active:scale-[0.98] transition-transform duration-150 backdrop-blur-md border border-white/20"
      >
        {/* Lado Esquerdo: Ícone de Sacola com Badge + Totais */}
        <div className="flex items-center gap-3">
          {/* Ícone com Badge de Quantidade */}
          <div className="relative flex items-center justify-center w-11 h-11 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>

            {/* Badge Flutuante */}
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-white text-slate-900 text-[11px] font-black rounded-full flex items-center justify-center shadow-md border border-slate-100">
              {totalItens}
            </span>
          </div>

          {/* Textos de Resumo e Preço */}
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-white/80 font-semibold leading-none">
              Total do Pedido
            </span>
            <span className="text-base sm:text-lg font-extrabold tracking-tight mt-1 leading-none drop-shadow-xs">
              {formatarMoeda(valorTotal)}
            </span>
          </div>
        </div>

        {/* Lado Direito: Botão Chamativo de Ação */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/25">
          <span className="text-xs sm:text-sm font-bold tracking-wide">
            Ver Carrinho
          </span>
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CartSummary;
