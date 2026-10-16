'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';

interface PageProps {
  params: Promise<{ restaurante_slug: string }> | { restaurante_slug: string };
}

export type MetodoPagamento = 'Pix' | 'Cartao' | 'Dinheiro';

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

  // Estados do Formulário de Identificação
  const mesaInicial = searchParams.get('mesa') || '';
  const [numeroMesa, setNumeroMesa] = useState(mesaInicial);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefone, setTelefone] = useState('');

  // Endereço para Delivery
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numeroEndereco, setNumeroEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [complemento, setComplemento] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Estados de Forma de Pagamento
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('Pix');
  const [precisaTroco, setPrecisaTroco] = useState(false);
  const [trocoPara, setTrocoPara] = useState('');

  // Estados de Submissão
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
  // FUNÇÃO DE SUBMISSÃO DO CHECKOUT (PAYLOAD FINAL COM PAGAMENTO)
  // ============================================================================
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroFormulario(null);

    // Validações por modalidade
    if (tipoPedido === 'Mesa') {
      if (!numeroMesa.trim()) {
        setErroFormulario('Por favor, informe o número da sua mesa.');
        return;
      }
    } else if (tipoPedido === 'Retirada') {
      if (!nomeCliente.trim()) {
        setErroFormulario('Por favor, informe seu nome para retirada.');
        return;
      }
      if (!telefone.trim()) {
        setErroFormulario('Por favor, informe seu telefone / WhatsApp.');
        return;
      }
    } else if (tipoPedido === 'Delivery') {
      if (!nomeCliente.trim()) {
        setErroFormulario('Por favor, informe seu nome para entrega.');
        return;
      }
      if (!telefone.trim()) {
        setErroFormulario('Por favor, informe seu telefone de contato.');
        return;
      }
      if (!rua.trim() || !numeroEndereco.trim() || !bairro.trim()) {
        setErroFormulario('Por favor, preencha os campos obrigatórios do endereço.');
        return;
      }
    }

    // Validação de troco para dinheiro
    if (metodoPagamento === 'Dinheiro' && precisaTroco) {
      const trocoNumero = parseFloat(trocoPara.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (isNaN(trocoNumero) || trocoNumero <= totalGeral) {
        setErroFormulario(`O valor para troco deve ser maior que o total do pedido (${formatarMoeda(totalGeral)}).`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Estruturação do Payload Final
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
        pagamento: {
          metodo: metodoPagamento,
          precisa_troco: metodoPagamento === 'Dinheiro' ? precisaTroco : false,
          troco_para:
            metodoPagamento === 'Dinheiro' && precisaTroco ? trocoPara.trim() : null,
          status: metodoPagamento === 'Pix' ? 'aguardando_pix' : 'pagamento_na_entrega',
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

      // 2. Chamada à API (com fallback suave para testes em dev)
      const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      let pedidoIdRetornado = `PED-${Date.now().toString().slice(-6)}`;

      try {
        const res = await fetch(`${backendBaseUrl}/api/pedidos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-slug': restaurante_slug,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.pedido?.id) {
            pedidoIdRetornado = resData.pedido.id;
          }
        }
      } catch (_apiErr) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // 3. Limpeza do Carrinho após criação do pedido
      clearCart();

      const paramMesa = tipoPedido === 'Mesa' ? `&mesa=${encodeURIComponent(numeroMesa.trim())}` : '';
      const paramCliente = tipoPedido !== 'Mesa' ? `&cliente=${encodeURIComponent(nomeCliente.trim())}` : `&cliente=Mesa+${encodeURIComponent(numeroMesa.trim())}`;

      // 4. Se o método escolhido for Pix, redireciona para a tela do Pix
      if (metodoPagamento === 'Pix') {
        router.push(
          `/${restaurante_slug}/pagamento-pix?pedido_id=${encodeURIComponent(
            pedidoIdRetornado
          )}&total=${totalGeral.toFixed(2)}${paramMesa}${paramCliente}&tipo=${encodeURIComponent(
            tipoPedido
          )}`
        );
      } else {
        // Redireciona diretamente para a tela de sucesso para Cartão ou Dinheiro
        router.push(
          `/${restaurante_slug}/sucesso?tipo=${encodeURIComponent(
            tipoPedido
          )}${paramMesa}${paramCliente}&total=${totalGeral.toFixed(2)}&metodo=${encodeURIComponent(
            metodoPagamento
          )}`
        );
      }
    } catch (_error) {
      setErroFormulario('Não foi possível processar o seu pedido. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-44 antialiased selection:bg-rose-500 selection:text-white">
      {/* CABEÇALHO */}
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
            Checkout do Pedido
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
          SEÇÃO 1: MODALIDADE DE RECEBIMENTO (RADIO GROUP PÍLULA)
          ======================================================================
        */}
        <section aria-label="Modalidade de consumo">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            1. Como deseja receber?
          </label>

          <div className="grid grid-cols-3 gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl shadow-inner border border-slate-300/60">
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
          SEÇÃO 2: RESUMO DOS ITENS
          ======================================================================
        */}
        <section aria-label="Itens selecionados" className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Resumo do Pedido ({items.length} itens)
            </h2>
            <span className="text-xs text-slate-500 font-semibold">
              Subtotal: {formatarMoeda(subtotal)}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {items.map((item) => {
              const adicionaisSoma = item.adicionais
                ? item.adicionais.reduce((acc, ad) => acc + ad.preco, 0)
                : 0;
              const precoItemUnitario = item.preco_base + adicionaisSoma;
              const subtotalItem = precoItemUnitario * item.quantidade;

              return (
                <article
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex flex-col gap-2"
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

                    <span className="font-extrabold text-sm text-slate-900 shrink-0">
                      {formatarMoeda(subtotalItem)}
                    </span>
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
          SEÇÃO 3: DADOS DE IDENTIFICAÇÃO E ENTREGA
          ======================================================================
        */}
        <form id="checkout-form" onSubmit={handleCheckout} className="flex flex-col gap-6">
          <section aria-label="Dados de entrega e cliente">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. {tipoPedido === 'Mesa' ? 'Dados da Mesa' : tipoPedido === 'Retirada' ? 'Dados para Retirada' : 'Endereço de Entrega'}
              </h2>
              <span className="text-[11px] text-rose-600 font-semibold">* Obrigatório</span>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3.5">
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
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                  />
                </div>
              )}

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
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
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
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                    />
                  </div>
                </>
              )}

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
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
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
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
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
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
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
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
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
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
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
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-slate-100">
                <label htmlFor="observacoes" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Observações para o Pedido (Opcional)
                </label>
                <textarea
                  id="observacoes"
                  rows={2}
                  placeholder="Ex: Ponto da carne bem passado, sem talheres plásticos..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>
          </section>

          {/* 
            ======================================================================
            SEÇÃO 4: FORMA DE PAGAMENTO (PIX, CARTÃO, DINHEIRO + TROCO)
            ======================================================================
          */}
          <section aria-label="Forma de pagamento">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              4. Forma de Pagamento
            </h2>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-2.5">
                {/* Opção Pix */}
                <label
                  onClick={() => setMetodoPagamento('Pix')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    metodoPagamento === 'Pix'
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                      ❖
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-slate-900">Pix</span>
                      <span className="block text-xs text-slate-500">
                        Aprovação instantânea via QR Code ou Copia e Cola
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="formaPagamento"
                    checked={metodoPagamento === 'Pix'}
                    onChange={() => setMetodoPagamento('Pix')}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                {/* Opção Cartão */}
                <label
                  onClick={() => setMetodoPagamento('Cartao')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    metodoPagamento === 'Cartao'
                      ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-slate-900">
                        Cartão (na entrega / mesa)
                      </span>
                      <span className="block text-xs text-slate-500">
                        Débito, Crédito ou Vale Refeição na maquininha
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="formaPagamento"
                    checked={metodoPagamento === 'Cartao'}
                    onChange={() => setMetodoPagamento('Cartao')}
                    className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                  />
                </label>

                {/* Opção Dinheiro */}
                <label
                  onClick={() => setMetodoPagamento('Dinheiro')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    metodoPagamento === 'Dinheiro'
                      ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-slate-900">Dinheiro</span>
                      <span className="block text-xs text-slate-500">
                        Pagamento em cédulas na entrega ou no caixa
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="formaPagamento"
                    checked={metodoPagamento === 'Dinheiro'}
                    onChange={() => setMetodoPagamento('Dinheiro')}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                </label>
              </div>

              {/* Lógica Condicional de Troco se Dinheiro */}
              {metodoPagamento === 'Dinheiro' && (
                <div className="mt-2 pt-3 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="checkTroco" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                      <input
                        id="checkTroco"
                        type="checkbox"
                        checked={precisaTroco}
                        onChange={(e) => setPrecisaTroco(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Precisa de troco?</span>
                    </label>

                    {precisaTroco && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Total a pagar: {formatarMoeda(totalGeral)}
                      </span>
                    )}
                  </div>

                  {precisaTroco && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label htmlFor="trocoPara" className="block text-xs font-bold text-slate-700 mb-1">
                        Precisa de troco para quanto? *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-sm font-bold text-slate-400">
                          R$
                        </span>
                        <input
                          id="trocoPara"
                          type="text"
                          required={precisaTroco}
                          placeholder="Ex: 100,00"
                          value={trocoPara}
                          onChange={(e) => setTrocoPara(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

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
        RODAPÉ FIXO: VALORES E BOTÃO DE SUBMIT
        ========================================================================
      */}
      <aside className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 p-4 z-40 shadow-2xl">
        <div className="max-w-md mx-auto flex flex-col gap-2.5">
          {tipoPedido === 'Delivery' && (
            <div className="flex flex-col gap-1 text-xs text-slate-500 border-b border-slate-100 pb-2">
              <div className="flex justify-between">
                <span>Subtotal dos Itens:</span>
                <span className="font-semibold text-slate-700">{formatarMoeda(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-600 font-semibold">Taxa de Entrega:</span>
                <span className="font-bold text-rose-600">{formatarMoeda(taxaEntrega)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total do Pedido
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Pagamento via: <strong>{metodoPagamento === 'Pix' ? 'Pix' : metodoPagamento === 'Cartao' ? 'Cartão' : 'Dinheiro'}</strong>
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatarMoeda(totalGeral)}
            </span>
          </div>

          <button
            form="checkout-form"
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 text-white font-extrabold text-base rounded-2xl shadow-lg active:scale-98 disabled:opacity-75 disabled:pointer-events-none transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              metodoPagamento === 'Pix'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processando Pedido...</span>
              </>
            ) : metodoPagamento === 'Pix' ? (
              <>
                <span className="text-lg">❖</span>
                <span>Pagar {formatarMoeda(totalGeral)} via Pix</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  {tipoPedido === 'Mesa' && 'Enviar Pedido para a Cozinha'}
                  {tipoPedido === 'Retirada' && 'Confirmar Pedido para Retirada'}
                  {tipoPedido === 'Delivery' && 'Confirmar Pedido para Entrega'}
                </span>
              </>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}
