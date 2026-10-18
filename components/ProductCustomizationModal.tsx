'use client';

import React, { useState, useMemo } from 'react';
import { useCartStore, Adicional } from '@/store/useCartStore';

export interface ItemOpcionalData {
  id: string;
  nome: string;
  preco: number | string;
  disponivel: boolean;
}

export interface GrupoOpcionalData {
  id: string;
  nome: string;
  minimo: number;
  maximo: number;
  obrigatorio: boolean;
  itens: ItemOpcionalData[];
}

export interface ProdutoCustomizavel {
  id: string;
  nome: string;
  descricao?: string | null;
  precoBase: number | string;
  imagemUrl?: string | null;
  gruposOpcao?: Array<{
    grupo: GrupoOpcionalData;
  }>;
}

interface ProductCustomizationModalProps {
  produto: ProdutoCustomizavel | null;
  isOpen: boolean;
  corPrimaria?: string;
  onClose: () => void;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export const ProductCustomizationModal: React.FC<ProductCustomizationModalProps> = ({
  produto,
  isOpen,
  corPrimaria = '#E11D48',
  onClose,
}) => {
  const addItem = useCartStore((state) => state.addItem);

  const [quantidade, setQuantidade] = useState<number>(1);
  const [opcoesSelecionadas, setOpcoesSelecionadas] = useState<Record<string, ItemOpcionalData[]>>({});
  const [observacoes, setObservacoes] = useState<string>('');

  // Reseta estado ao abrir novo produto
  React.useEffect(() => {
    if (isOpen) {
      setQuantidade(1);
      setOpcoesSelecionadas({});
      setObservacoes('');
    }
  }, [isOpen, produto?.id]);

  // Extrai o preço base com segurança
  const precoBaseNumero = produto
    ? typeof produto.precoBase === 'string'
      ? parseFloat(produto.precoBase)
      : Number(produto.precoBase) || 0
    : 0;

  // Cálculo do total somando preço base + opcionais selecionados (chamado incondicionalmente no topo)
  const totalItemUnitario = useMemo(() => {
    let somaOpcionais = 0;
    Object.values(opcoesSelecionadas).forEach((lista) => {
      lista.forEach((item) => {
        const precoNum = typeof item.preco === 'string' ? parseFloat(item.preco) : Number(item.preco) || 0;
        somaOpcionais += precoNum;
      });
    });
    return precoBaseNumero + somaOpcionais;
  }, [precoBaseNumero, opcoesSelecionadas]);

  const totalFinal = totalItemUnitario * quantidade;

  if (!isOpen || !produto) return null;

  // Extrai os grupos de opções
  const grupos = produto.gruposOpcao?.map((g) => g.grupo) || [];

  const handleToggleOpcao = (grupo: GrupoOpcionalData, item: ItemOpcionalData) => {
    setOpcoesSelecionadas((prev) => {
      const atuais = prev[grupo.id] || [];
      const jaExiste = atuais.some((x) => x.id === item.id);

      if (jaExiste) {
        return {
          ...prev,
          [grupo.id]: atuais.filter((x) => x.id !== item.id),
        };
      }

      // Se for escolha única (maximo = 1)
      if (grupo.maximo === 1) {
        return {
          ...prev,
          [grupo.id]: [item],
        };
      }

      // Se atingiu o máximo permitido
      if (atuais.length >= grupo.maximo) {
        return prev;
      }

      return {
        ...prev,
        [grupo.id]: [...atuais, item],
      };
    });
  };

  const handleConfirmar = () => {
    // Monta a lista plana de adicionais para o Zustand store
    const adicionaisParaCarrinho: Adicional[] = [];
    Object.values(opcoesSelecionadas).forEach((lista) => {
      lista.forEach((item) => {
        adicionaisParaCarrinho.push({
          nome: item.nome,
          preco: typeof item.preco === 'string' ? parseFloat(item.preco) : Number(item.preco) || 0,
        });
      });
    });

    addItem({
      produto_id: produto.id,
      nome: produto.nome,
      preco_base: precoBaseNumero,
      quantidade,
      adicionais: adicionaisParaCarrinho.length > 0 ? adicionaisParaCarrinho : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal com Imagem ou Cor */}
        <div className="relative">
          {produto.imagemUrl ? (
            <img
              src={produto.imagemUrl}
              alt={produto.nome}
              className="w-full h-44 object-cover"
            />
          ) : (
            <div
              style={{ backgroundColor: corPrimaria }}
              className="w-full h-28 flex items-center justify-center text-white text-3xl font-black"
            >
              🍽️
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Corpo com Scroll dos Opcionais */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
              {produto.nome}
            </h2>
            {produto.descricao && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {produto.descricao}
              </p>
            )}
            <div className="mt-2 text-base font-extrabold text-slate-900">
              {formatarMoeda(precoBaseNumero)}
            </div>
          </div>

          {/* Renderização dos Grupos de Opcionais (se houver) */}
          {grupos.length > 0 ? (
            <div className="flex flex-col gap-4">
              {grupos.map((grupo) => {
                const selecionadosNoGrupo = opcoesSelecionadas[grupo.id] || [];

                return (
                  <div
                    key={grupo.id}
                    className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {grupo.nome}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                        {grupo.maximo === 1 ? 'Escolha 1' : `Até ${grupo.maximo}`}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {grupo.itens.map((item) => {
                        const isSelected = selecionadosNoGrupo.some((x) => x.id === item.id);
                        const precoItem = typeof item.preco === 'string' ? parseFloat(item.preco) : Number(item.preco) || 0;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleToggleOpcao(grupo, item)}
                            className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white border-slate-900 shadow-xs'
                                : 'bg-white/60 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                  isSelected
                                    ? 'bg-slate-900 border-slate-900 text-white font-bold'
                                    : 'border-slate-300'
                                }`}
                              >
                                {isSelected ? '✓' : ''}
                              </span>
                              <span className="text-xs font-medium text-slate-800">
                                {item.nome}
                              </span>
                            </div>

                            {precoItem > 0 && (
                              <span className="text-xs font-bold text-slate-900">
                                + {formatarMoeda(precoItem)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-center">
              <span className="text-xs text-slate-500">
                Receita padrão preparada com ingredientes frescos da casa.
              </span>
            </div>
          )}

          {/* Campo de Observações */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Observações para o item (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Tirar cebola, ponto bem passado..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>
        </div>

        {/* Rodapé com Seletor de Quantidade e Botão Confirmar */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
          {/* Seletor de Quantidade */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all text-sm cursor-pointer"
            >
              -
            </button>
            <span className="w-8 text-center font-black text-xs text-slate-900 select-none">
              {quantidade}
            </span>
            <button
              type="button"
              onClick={() => setQuantidade((q) => q + 1)}
              className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all text-sm cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Botão de Adicionar */}
          <button
            type="button"
            onClick={handleConfirmar}
            style={{ backgroundColor: corPrimaria }}
            className="flex-1 py-3 px-4 text-white text-xs font-bold rounded-xl shadow-lg active:scale-98 transition-all flex items-center justify-between cursor-pointer"
          >
            <span>Adicionar ao Pedido</span>
            <span>{formatarMoeda(totalFinal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
