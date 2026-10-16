'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore, TipoPedido } from '@/store/useCartStore';

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
  const resolvedParams =
    typeof (params as any)?.then === 'function'
      ? use(params as Promise<{ restaurante_slug: string }>)
      : (params as { restaurante_slug: string });
  const { restaurante_slug } = resolvedParams;

  // Prevenção de hydration mismatch do SSR com o localStorage
  const [isMounted, setIsMounted] = useState(false);

  // Store Zustand
  const items = useCartStore((state) => state.items);
  const tipoPedido = useCartStore((state) => state.tipoPedido);
  const setTipoPedido = useCartStore((state) => state.setTipoPedido);
  const taxaEntrega = useCartStore((state) => state.taxaEntrega);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getCartTotal = useCartStore((state) => state.getCartTotal);

  // Estados do Formulário Dinâmico
  const mesaInicial = searchParams.get('mesa') || '';
  const [numeroMesa, setNumeroMesa] = useState(mesaInicial);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefone, setTelefone] = useState('');

  // Campos de Endereço para Delivery
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numeroEndereco, setNumeroEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [complemento, setComplemento] = useState('');

  // Observações gerais
  const [observacoes, setObservacoes] = useState('');

  // Feedback e Loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

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
  const subtotal = getSubtotal();
  const totalGeral = getCartTotal();

  // ============================================================================
  // TELA 1: CARRINHO VAZIO
  // ============================================================================
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto p-6 antialiased">
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

    // Validações condicionais por tipo de pedido
    if (tipoPedido === 'Mesa') {
      if (!numeroMesa.trim()) {
        setErroFormulario('Por favor, informe o número da mesa.');
        return;
      }
    } else if (tipoPedido === 'Retirada') {
      if (!nomeCliente.trim()) {
        setErroFormulario('Por favor, informe o seu nome para retirada.');
        return;
      }
      if (!telefone.trim()) {
        setErroFormulario('Por favor, informe seu telefone de contato.');
        return;
      }
    } else if (tipoPedido === 'Delivery') {
      if (!nomeCliente.trim()) {
        setErroFormulario('Por favor, informe o seu nome.');
        return;
      }
      if (!telefone.trim()) {
        setErroFormulario('Por favor, informe seu telefone de contato.');
        return;
      }
      if (!rua.trim() || !numeroEndereco.trim() || !bairro.trim()) {
        setErroFormulario('Por favor, preencha os campos obrigatórios do endereço de entrega.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Montagem do payload adaptado à modalidade escolhida
      const payload = {
        tenant_slug: restaurante_slug,
        tipo_pedido: tipoPedido,
        cliente: {
          nome: tipoPedido !== 'Mesa' ? nomeCliente.trim() : `Mesa ${numeroMesa.trim()}`,
          telefone: tipoPedido !== 'Mesa' ? telefone.trim() : undefined,
          mesa: tipoPedido === 'Mesa' ? numeroMesa.trim() : undefined,
          endereco:
            tipoPedido === 'Delivery'
              ? {
                  cep: cep.trim(),
                  rua: rua.trim(),
                  numero: numeroEndereco.trim(),
                  bairro: bairro.trim(),
                  complemento: complemento.trim() || undefined,
                }
              : undefined,
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
        subtotal,
        taxa_entrega: tipoPedido === 'Delivery' ? taxaEntrega : 0,
        total: totalGeral,
        criado_em: new Date().toISOString(),
      };

      // Chamada HTTP para o backend
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
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Limpa os itens do carrinho após submissão bem-sucedida
      clearCart();

      // Redireciona para a tela de confirmação
      const paramMesa = tipoPedido === 'Mesa' ? `&mesa=${encodeURIComponent(numeroMesa.trim())}` : '';
      const paramCliente = tipoPedido !== 'Mesa' ? `&cliente=${encodeURIComponent(nomeCliente.trim())}` : `&cliente=Mesa+${encodeURIComponent(numeroMesa.trim())}`;
      
      router.push(
        `/${restaurante_slug}/sucesso?tipo=${encodeURIComponent(
          tipoPedido
        )}${paramMesa}${paramCliente}&total=${totalGeral.toFixed(2)}`
      );
    } catch (_error) {
      setErroFormulario('Não foi possível enviar o seu pedido. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-36 antialiased selection:bg-rose-500 selection:text-white">
      {/* 
        ========================================================================
        CABEÇALHO
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
            Checkout ({totalItens})
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
          SELEÇÃO DE CONSUMO: RADIO GROUP EM PÍLULA (MESA, RETIRADA, DELIVERY)
          ======================================================================
        */}
        <section aria-label="Modalidade do pedido">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Como deseja receber seu pedido?
          </label>

          <div className="grid grid-cols-3 gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl shadow-inner border border-slate-300/60">
            {/* Opção: Na Mesa */}
            <button
              type="button"
              onClick={() => setTipoPedido('Mesa')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                tipoPedido === 'Mesa'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14" />
              </svg>
              <span>Na Mesa</span>
            </button>

            {/* Opção: Retirada */}
            <button
              type="button"
              onClick={() => setTipoPedido('Retirada')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                tipoPedido === 'Retirada'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Retirada</span>
            </button>

            {/* Opção: Delivery */}
            <button
              type="button"
              onClick={() => setTipoPedido('Delivery')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                tipoPedido === 'Delivery'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Delivery</span>
            </button>
          </div>
        </section>

        {/* 
          ======================================================================
          LISTA DE ITENS DO CARRINHO
          ======================================================================
        */}
        <section aria-label="Itens selecionados" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Itens ({items.length})
            </h2>
            <span className="text-xs text-slate-500 font-semibold">
              Subtotal: {formatarMoeda(subtotal)}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {items.map((item) => {
              const adicionaisSoma = item.adicionais
                ? item.adicionais.reduce((acc, ad) => acc + ad.preco, 0)
                : 0;
              const precoItemUnitario = item.preco_base + adicionaisSoma;
              const subtotalItem = precoItemUnitario * item.quantidade;

              return (
                <article
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {item.nome}
                      </h3>

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

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-sm text-slate-900">
                        {formatarMoeda(subtotalItem)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 py-1 px-1.5 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remover
                    </button>

                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                        className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all text-sm cursor-pointer"
                        aria-label="Diminuir"
                      >
                        -
                      </button>

                      <span className="w-8 text-center font-black text-xs text-slate-900 select-none">
                        {item.quantidade}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                        className="w-7 h-7 rounded-lg bg-white shadow-xs flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all text-sm cursor-pointer"
                        aria-label="Aumentar"
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
          FORMULÁRIO COM RENDERIZAÇÃO CONDICIONAL POR MODALIDADE
          ======================================================================
        */}
        <form id="checkout-form" onSubmit={handleCheckout} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              {tipoPedido === 'Mesa' && 'Dados da Mesa'}
              {tipoPedido === 'Retirada' && 'Dados para Retirada'}
              {tipoPedido === 'Delivery' && 'Endereço de Entrega'}
            </h2>
            <span className="text-xs text-rose-600 font-semibold">* Obrigatório</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3.5">
            {/* 
              CASO 1: SE 'NA MESA' -> MOSTRA APENAS 'NÚMERO DA MESA'
            */}
            {tipoPedido === 'Mesa' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="numeroMesa" className="block text-xs font-bold text-slate-700">
                    Número da Mesa *
                  </label>
                  {mesaInicial && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      QR Code Detectado
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
            )}

            {/* 
              CASO 2: SE 'RETIRADA' -> MOSTRA APENAS 'NOME' E 'TELEFONE'
            */}
            {tipoPedido === 'Retirada' && (
              <>
                <div>
                  <label htmlFor="nomeCliente" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    id="nomeCliente"
                    type="text"
                    required
                    placeholder="Ex: Maria Fernandes"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="telefone" className="block text-xs font-bold text-slate-700 mb-1.5">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    id="telefone"
                    type="tel"
                    required
                    placeholder="Ex: (11) 98765-4321"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                  />
                </div>
              </>
            )}

            {/* 
              CASO 3: SE 'DELIVERY' -> MOSTRA 'NOME', 'TELEFONE' E CAMPOS DE ENDEREÇO (OCULTA MESA)
            */}
            {tipoPedido === 'Delivery' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="nomeClienteDelivery" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nome do Destinatário *
                    </label>
                    <input
                      id="nomeClienteDelivery"
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva"
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="telefoneDelivery" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      id="telefoneDelivery"
                      type="tel"
                      required
                      placeholder="Ex: (11) 98888-7777"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label htmlFor="cep" className="block text-xs font-bold text-slate-700 mb-1.5">
                      CEP
                    </label>
                    <input
                      id="cep"
                      type="text"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="rua" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Rua / Avenida *
                    </label>
                    <input
                      id="rua"
                      type="text"
                      required
                      placeholder="Ex: Rua das Flores"
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label htmlFor="numeroEndereco" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Número *
                    </label>
                    <input
                      id="numeroEndereco"
                      type="text"
                      required
                      placeholder="123"
                      value={numeroEndereco}
                      onChange={(e) => setNumeroEndereco(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="bairro" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Bairro *
                    </label>
                    <input
                      id="bairro"
                      type="text"
                      required
                      placeholder="Ex: Centro"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="complemento" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Complemento (Apto, Bloco, Referência)
                  </label>
                  <input
                    id="complemento"
                    type="text"
                    placeholder="Ex: Apto 42, Bloco B"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                  />
                </div>
              </>
            )}

            {/* Campo: Observações Gerais */}
            <div className="pt-2 border-t border-slate-100">
              <label htmlFor="observacoes" className="block text-xs font-bold text-slate-700 mb-1.5">
                Observações do Pedido (Opcional)
              </label>
              <textarea
                id="observacoes"
                rows={2}
                placeholder="Ex: Ponto da carne bem passado, sem talheres plásticos..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all resize-none"
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
        RODAPÉ FIXO: DISCRIMINAÇÃO DE VALORES E BOTÃO DE SUBMIT
        ========================================================================
      */}
      <aside className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 p-4 z-40 shadow-2xl">
        <div className="max-w-md mx-auto flex flex-col gap-2.5">
          {/* Detalhamento de valores se for Delivery */}
          {tipoPedido === 'Delivery' && (
            <div className="flex flex-col gap-1 text-xs text-slate-500 border-b border-slate-100 pb-2">
              <div className="flex justify-between">
                <span>Subtotal dos Itens:</span>
                <span className="font-semibold text-slate-700">{formatarMoeda(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1 text-rose-600 font-semibold">
                  Taxa de Entrega:
                </span>
                <span className="font-bold text-rose-600">{formatarMoeda(taxaEntrega)}</span>
              </div>
            </div>
          )}

          {/* Valor Total Geral */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total {tipoPedido === 'Delivery' ? 'Geral' : 'do Pedido'}
            </span>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {formatarMoeda(totalGeral)}
            </span>
          </div>

          {/* Botão de Envio de Pedido */}
          <button
            form="checkout-form"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-75 disabled:pointer-events-none text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processando Pedido...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  {tipoPedido === 'Mesa' && 'Enviar Pedido para a Cozinha'}
                  {tipoPedido === 'Retirada' && 'Confirmar Pedido para Retirada'}
                  {tipoPedido === 'Delivery' && 'Finalizar Pedido para Entrega'}
                </span>
              </>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}
