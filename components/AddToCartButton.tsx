'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { ProductCustomizationModal, ProdutoCustomizavel } from './ProductCustomizationModal';

interface AddToCartButtonProps {
  produto: ProdutoCustomizavel;
  corPrimaria?: string;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  produto,
  corPrimaria = '#E11D48',
}) => {
  const addItem = useCartStore((state) => state.addItem);
  const [modalOpen, setModalOpen] = useState(false);
  const [adicionadoFeedback, setAdicionadoFeedback] = useState(false);

  const temOpcionais = Boolean(produto.gruposOpcao && produto.gruposOpcao.length > 0);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Se possui grupos de opcionais cadastrados (ex: borda de pizza, ponto da carne, etc)
    if (temOpcionais) {
      setModalOpen(true);
      return;
    }

    // Se é item simples, adiciona direto
    const preco = typeof produto.precoBase === 'string'
      ? parseFloat(produto.precoBase)
      : Number(produto.precoBase) || 0;

    addItem({
      produto_id: produto.id,
      nome: produto.nome,
      preco_base: preco,
      quantidade: 1,
    });

    setAdicionadoFeedback(true);
    setTimeout(() => setAdicionadoFeedback(false), 1200);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAction}
        style={{ color: adicionadoFeedback ? '#059669' : corPrimaria }}
        className="mt-2 text-xs font-semibold px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
      >
        {adicionadoFeedback ? (
          <>
            <span className="font-bold">✓</span> Adicionado!
          </>
        ) : temOpcionais ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Personalizar
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Adicionar
          </>
        )}
      </button>

      {/* Modal de personalização dinâmico */}
      <ProductCustomizationModal
        produto={produto}
        isOpen={modalOpen}
        corPrimaria={corPrimaria}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

