'use client';

import React from 'react';
import { useCartStore } from '@/store/useCartStore';

interface AddToCartButtonProps {
  produto: {
    id: string;
    nome: string;
    precoBase: number | string;
  };
  corPrimaria?: string;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  produto,
  corPrimaria = '#E11D48',
}) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const preco = typeof produto.precoBase === 'string'
      ? parseFloat(produto.precoBase)
      : produto.precoBase;

    addItem({
      produto_id: produto.id,
      nome: produto.nome,
      preco_base: preco,
      quantidade: 1,
    });
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      style={{ color: corPrimaria }}
      className="mt-2 text-xs font-semibold px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 active:scale-95 cursor-pointer shadow-2xs"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
      </svg>
      Adicionar
    </button>
  );
};
