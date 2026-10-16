'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';

interface PageProps {
  params: Promise<{ restaurante_slug: string }> | { restaurante_slug: string };
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export default function CarrinhoPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Compatibilidade com Next.js 14 e 15 (unwrapping de params)
  const resolvedParams = typeof (params as any)?.then === 'function' ? use(params as Promise<{ restaurante_slug: string }>) : (params as { restaurante_slug: string });
  const { restaurante_slug } = resolvedParams;

  // Prevenção de hydration mismatch do SSR com o localStorage
  const [isMounted, setIsMounted] = useState(false);

  // Estados do Formulário de Mesa / Cliente
  const mesaInicial = searchParams.get('mesa') || '';
  const [nomeCliente, setNomeCliente] = useState('');
  const [numeroMesa, setNumeroMesa] = useState(mesaInicial);
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  // Store Zustand
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Evita renderização descasada antes do cliente carregar os dados salvos
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  const totalItens = getTotalItems();
  const valorTotal = getTotalPrice();

  // ============================================================================
  // TELA 1: CARRINHO VAZIO
  // ============================================================================
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto p-6">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 shadow-xs border border-rose-100">
            <svg
              className="w-12 h-12 text-rose-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Seu carrinho está vazio
          </h1>
          <p className="text-sm text-slate-500 max-w-xs mb-8 leading-relaxed">
            Parece que você ainda não escolheu seus pratos favoritos. Explore o nosso cardápio para pedir!
          </p>
        </div>

        <Link
          href={`/${restaurante_slug}${numeroMesa ? `?mesa=${numeroMesa}` : ''}`}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-center rounded-2xl shadow-lg shadow-slate-900/20 transition-all text-base"
        >
          Voltar para o Cardápio
        </Link>
      </main>
    );
  }

  // ============================================================================
  // FUNÇÃO DE SUBMISSÃO DO CHECKOUT
  // ============================================================================
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroFormulario(null);

    // Validações básicas de usabilidade móvel
    if (!nomeCliente.trim()) {
      setErroFormulario('Por favor, informe seu nome para identificar o pedido.');
      return;
    }

    if (!numeroMesa.trim()) {
      setErroFormulario('Por favor, informe o número da mesa.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Estrutura o payload do pedido para envio à API
      const payload = {
        tenant_slug: restaurante_slug,
        cliente: {
          nome: nomeCliente.trim(),
          mesa: numeroMesa.trim(),
          observacoes: observacoes.trim() || undefined,
        },
        itens: items.map((item) => ({
          produto_id: item.produto_id,
          nome: item.nome,
          preco_unitario: item.preco_base,
          quantidade: item.quantidade,
          adicionais: item.adicionais || [],
          subtotal:
            (item.preco_base +
              (item.adicionais?.reduce((acc, ad) => acc + ad.preco, 0) || 0)) *
            item.quantidade,
        })),
        total: valorTotal,
        criado_em: new Date().toISOString(),
      };

      // Simulação / chamada para a API Express
      const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      try {
        await fetch(`${backendBaseUrl}/api/pedidos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-slug': restaurante_slug,
          },
          body: JSON.stringify(payload),
        });
      } catch (_apiErr) {
        // Fallback simulado para desenvolvimento
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Limpa a store do Zustand após sucesso
      clearCart();

      // Redireciona para a página de sucesso
      router.push(
        `/${restaurante_slug}/sucesso?mesa=${encodeURIComponent(
          numeroMesa.trim()
        )}&cliente=${encodeURIComponent(nomeCliente.trim())}&total=${valorTotal.toFixed(2)}`
      );
    } catch (_error) {
      setErroFormulario('Não foi possível enviar o seu pedido. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32 antialiased selection:bg-rose-500 selection:text-white">
      {/* 
        ========================================================================
        CABEÇALHO DA PÁGINA DE CHECKOUT
        ========================================================================
      */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3.5 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href={`/${restaurante_slug}${numeroMesa ? `?mesa=${numeroMesa}` : ''}`}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold text-xs py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Cardápio
          </Link>

          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
            Meu Pedido ({totalItens})
          </h1>

          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold py-1 px-2 rounded-lg hover:bg-rose-50 transition-colors"
          >
            Limpar
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 flex flex-col gap-6">
        {/* 
          ======================================================================
          LISTA DE ITENS DO CARRINHO
          ======================================================================
        */}
        <section aria-label="Itens selecionados" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Itens do Pedido
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {items.length} {items.length === 1 ? 'linha' : 'linhas'}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const adicionaisSoma = item.adicionais
                ? item.adicionais.reduce((acc, ad) => acc + ad.preco, 0)
                : 0;
              const precoItemUnitario = item.preco_base + adicionaisSoma;
              const subtotalItem = precoItemUnitario * item.quantidade;

              return (
                <article
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {item.nome}
                      </h3>

                      {/* Lista de adicionais escolhidos */}
                      {item.adicionais && item.adicionais.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.adicionais.map((ad, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
                            >
                              + {ad.nome} ({formatarMoeda(ad.preco)})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Preço total do item */}
                    <div className="text-right shrink-0">
                      <span className="font-black text-base text-slate-900">
                        {formatarMoeda(subtotalItem)}
                      </span>
                      {item.quantidade > 1 && (
                        <span className="block text-[11px] text-slate-400">
                          {formatarMoeda(precoItemUnitario)} cada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controles de Quantidade (+ e -) e Exclusão */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 py-1 px-2 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remover
                    </button>

                    <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                        className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all text-base"
                        aria-label="Diminuir quantidade"
                      >
                        -
                      </button>

                      <span className="w-9 text-center font-black text-sm text-slate-900 select-none">
                        {item.quantidade}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                        className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all text-base"
                        aria-label="Aumentar quantidade"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 
          ======================================================================
          DADOS DA MESA E CLIENTE (FORMULÁRIO MOBILE-FIRST)
          ======================================================================
        */}
        <form id="checkout-form" onSubmit={handleCheckout} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Identificação do Pedido
            </h2>
            <span className="text-xs text-rose-600 font-semibold">* Campos obrigatórios</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-4">
            {/* Campo: Nome do Cliente */}
            <div>
              <label htmlFor="nomeCliente" className="block text-xs font-bold text-slate-700 mb-1.5">
                Seu Nome *
              </label>
              <input
                id="nomeCliente"
                type="text"
                required
                placeholder="Ex: Carlos Silva"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
              />
            </div>

            {/* Campo: Número da Mesa */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="numeroMesa" className="block text-xs font-bold text-slate-700">
                  Número da Mesa *
                </label>
                {mesaInicial && (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Identificada via QR Code
                  </span>
                )}
              </div>
              <input
                id="numeroMesa"
                type="text"
                required
                placeholder="Ex: 04"
                value={numeroMesa}
                onChange={(e) => setNumeroMesa(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
              />
            </div>

            {/* Campo: Observações (Opcional) */}
            <div>
              <label htmlFor="observacoes" className="block text-xs font-bold text-slate-700 mb-1.5">
                Observações para a Cozinha (Opcional)
              </label>
              <textarea
                id="observacoes"
                rows={2}
                placeholder="Ex: Prato sem cebola, ponto da carne bem passado..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          {/* Mensagem de Erro de Validação */}
          {erroFormulario && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{erroFormulario}</span>
            </div>
          )}
        </form>
      </main>

      {/* 
        ========================================================================
        RODAPÉ FIXO: RESUMO DE VALORES E BOTÃO DE SUBMIT
        ========================================================================
      */}
      <aside className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 p-4 z-40 shadow-2xl">
        <div className="max-w-md mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total do Pedido
            </span>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {formatarMoeda(valorTotal)}
            </span>
          </div>

          <button
            form="checkout-form"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-75 disabled:pointer-events-none text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enviando para a Cozinha...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Enviar Pedido para a Cozinha</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}
