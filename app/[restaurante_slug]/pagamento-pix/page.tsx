'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface PageProps {
  params: Promise<{ restaurante_slug: string }> | { restaurante_slug: string };
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export default function PagamentoPixPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const resolvedParams =
    typeof (params as any)?.then === 'function'
      ? use(params as Promise<{ restaurante_slug: string }>)
      : (params as { restaurante_slug: string });
  const { restaurante_slug } = resolvedParams;

  const totalParam = searchParams.get('total') ? parseFloat(searchParams.get('total')!) : 0;
  const pedidoId = searchParams.get('pedido_id') || `PED-${Date.now().toString().slice(-6)}`;
  const cliente = searchParams.get('cliente') || 'Cliente';
  const tipo = searchParams.get('tipo') || 'Mesa';
  const mesa = searchParams.get('mesa') || '';

  // Simulação de chave Pix configurada para o restaurante
  const chavePixRestaurante =
    searchParams.get('chave_pix') || 'financeiro@pizzariabella.com.br';

  // Código Pix Copia e Cola formatado
  const codigoPixCopiaCola = `00020126580014br.gov.bcb.pix0136${chavePixRestaurante}520400005303986540${totalParam.toFixed(
    2
  )}5802BR59${restaurante_slug.toUpperCase().slice(0, 15)}6009SAO PAULO62070503***6304ABCD`;

  const [copiado, setCopiado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(900); // 15 minutos em segundos

  // Contador regressivo para expiração do Pix
  useEffect(() => {
    const timer = setInterval(() => {
      setTempoRestante((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutos = Math.floor(tempoRestante / 60);
  const segundos = tempoRestante % 60;

  // Função para copiar para o Clipboard com fallback
  const handleCopiarPix = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(codigoPixCopiaCola);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = codigoPixCopiaCola;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (_err) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  const handleConfirmarPagamento = () => {
    const paramMesa = mesa ? `&mesa=${encodeURIComponent(mesa)}` : '';
    router.push(
      `/${restaurante_slug}/sucesso?tipo=${encodeURIComponent(
        tipo
      )}${paramMesa}&cliente=${encodeURIComponent(
        cliente
      )}&total=${totalParam.toFixed(2)}&status=pix_confirmado`
    );
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
            href={`/${restaurante_slug}/carrinho${mesa ? `?mesa=${mesa}` : ''}`}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold text-xs py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>

          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
            Pagamento via Pix
          </h1>

          <span className="w-12 text-right text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Pix
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 flex flex-col gap-5">
        {/* Card do Resumo do Pagamento */}
        <section className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Aguardando Pagamento
          </div>

          <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
            Valor a Pagar
          </h2>
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            {formatarMoeda(totalParam)}
          </span>

          <p className="text-xs text-slate-500 mt-2">
            Identificador do Pedido: <strong className="text-slate-700 font-mono">{pedidoId}</strong>
          </p>

          {/* QR Code Container */}
          <div className="mt-5 p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col items-center justify-center">
            {/* QR Code Ilustrativo Dinâmico */}
            <div className="relative w-48 h-48 bg-slate-900 rounded-xl p-2 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full text-white" viewBox="0 0 100 100" fill="currentColor">
                {/* Visual estilizado de QR Code com pontos de canto e grid */}
                <rect x="0" y="0" width="30" height="30" rx="4" fill="white" />
                <rect x="5" y="5" width="20" height="20" rx="2" fill="#0f172a" />
                <rect x="10" y="10" width="10" height="10" fill="white" />

                <rect x="70" y="0" width="30" height="30" rx="4" fill="white" />
                <rect x="75" y="5" width="20" height="20" rx="2" fill="#0f172a" />
                <rect x="80" y="10" width="10" height="10" fill="white" />

                <rect x="0" y="70" width="30" height="30" rx="4" fill="white" />
                <rect x="5" y="75" width="20" height="20" rx="2" fill="#0f172a" />
                <rect x="10" y="80" width="10" height="10" fill="white" />

                <rect x="38" y="10" width="8" height="8" fill="white" />
                <rect x="52" y="10" width="8" height="8" fill="white" />
                <rect x="38" y="24" width="22" height="6" fill="white" />
                <rect x="10" y="42" width="20" height="6" fill="white" />
                <rect x="38" y="38" width="24" height="24" rx="4" fill="#10b981" />
                <rect x="70" y="42" width="20" height="6" fill="white" />
                <rect x="70" y="56" width="14" height="8" fill="white" />
                <rect x="42" y="72" width="16" height="8" fill="white" />
                <rect x="68" y="72" width="22" height="18" fill="white" />
              </svg>

              {/* Logo Central Pix */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-emerald-500 text-white w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shadow-md border-2 border-white">
                  ❖
                </div>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 mt-2 font-medium">
              Aponte a câmera do aplicativo do seu banco
            </span>
          </div>

          {/* Temporizador */}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Este código expira em{' '}
              <strong className="font-mono">
                {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
              </strong>
            </span>
          </div>
        </section>

        {/* Seção Pix Copia e Cola */}
        <section className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pix Copia e Cola
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Chave configurada</span>
          </div>

          <div className="relative">
            <input
              type="text"
              readOnly
              value={codigoPixCopiaCola}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-mono text-slate-600 select-all pr-24 overflow-hidden text-ellipsis focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopiarPix}
              className={`absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                copiado
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
              }`}
            >
              {copiado ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <strong>Como pagar:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-0.5 text-slate-600">
              <li>Copie o código Pix acima clicando no botão <strong>Copiar</strong>.</li>
              <li>Abra o app do seu banco e acerte a opção <strong>Pix Copia e Cola</strong>.</li>
              <li>Confira o valor e confirme a transferência.</li>
            </ol>
          </div>
        </section>
      </main>

      {/* 
        ========================================================================
        RODAPÉ FIXO: CONFIRMAÇÃO DO PAGAMENTO
        ========================================================================
      */}
      <aside className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 p-4 z-40 shadow-2xl">
        <div className="max-w-md mx-auto flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleConfirmarPagamento}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Já realizei o pagamento Pix</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
