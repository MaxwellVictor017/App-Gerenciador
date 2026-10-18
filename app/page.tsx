'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LISTA_RESTAURANTES_HUB } from '@/src/data/mockCardapios';

export default function DevHubPage() {
  const [busca, setBusca] = useState('');
  const [filtroNicho, setFiltroNicho] = useState<string>('todos');
  const [slugCustom, setSlugCustom] = useState('');
  const [mesaCustom, setMesaCustom] = useState('');
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Checa status da API Express
  useEffect(() => {
    fetch(`${backendBaseUrl}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') setApiOnline(true);
      })
      .catch(() => setApiOnline(false));
  }, [backendBaseUrl]);

  const nichosDisponiveis = [
    { id: 'todos', label: 'Todos os Modelos', icone: '✨' },
    { id: 'pizzaria', label: 'Pizzarias', icone: '🍕' },
    { id: 'hamburgueria', label: 'Hamburguerias', icone: '🍔' },
    { id: 'restaurante', label: 'Restaurantes & Grill', icone: '🥩' },
    { id: 'bar', label: 'Bares & Petiscarias', icone: '🍺' },
    { id: 'oriental', label: 'Sushi & Oriental', icone: '🍣' },
    { id: 'cafeteria', label: 'Cafeterias & Bistrôs', icone: '☕' },
  ];

  // Filtra restaurantes por nicho e termo de busca (busca em tempo real)
  const termo = busca.toLowerCase().trim();
  const restaurantesFiltrados = LISTA_RESTAURANTES_HUB.filter((r) => {
    const matchNicho = filtroNicho === 'todos' || r.nicho === filtroNicho;
    const matchBusca =
      !termo ||
      r.nome.toLowerCase().includes(termo) ||
      r.slug.toLowerCase().includes(termo) ||
      r.categoriaTag.toLowerCase().includes(termo) ||
      (r.descricao || '').toLowerCase().includes(termo) ||
      r.tags.some((t) => t.toLowerCase().includes(termo));
    return matchNicho && matchBusca;
  });

  const gerarSlugAleatorio = () => {
    const exemplos = [
      'cantina-da-nonna',
      'smash-station',
      'fogao-a-lenha',
      'gelateria-milano',
      'bar-do-ze',
      'padaria-imperial',
      'steakhouse-prime',
      'poke-bowl-club',
    ];
    const sorteado = exemplos[Math.floor(Math.random() * exemplos.length)];
    setSlugCustom(sorteado);
    setMesaCustom('7');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-rose-500 selection:text-white pb-24">
      {/* Background Decorativo com Luzes Suaves */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/15 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-teal-500/15 rounded-full blur-[128px]" />
      </div>

      {/* 
        ========================================================================
        TOP BAR DO DEV HUB
        ========================================================================
      */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-amber-500 to-rose-400 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-rose-600/30">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">
                  Dev Hub
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  Modelos de Negócios & Cardápios
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Ambiente de desenvolvimento e modelagem dos estabelecimentos
              </p>
            </div>
          </div>

          {/* Badges de Status da API */}
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  apiOnline === true
                    ? 'bg-emerald-400 shadow-md shadow-emerald-400/50 animate-pulse'
                    : apiOnline === false
                    ? 'bg-amber-400'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-300 hidden md:inline">API Express :3001</span>
              <span className="text-emerald-400 font-bold">
                {apiOnline === true ? 'Online' : apiOnline === false ? 'Standby' : 'Checando...'}
              </span>
            </div>

            <a
              href={`${backendBaseUrl}/health`}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors"
            >
              <span>/health</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
        {/* 
          ======================================================================
          HERO & APRESENTAÇÃO
          ======================================================================
        */}
        <section className="flex flex-col gap-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 self-center sm:self-start bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs text-slate-300">
            <span className="text-base">🏬</span>
            <span>Painel do Desenvolvedor • Cada modelo com Área do Cliente e Painel ADM</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Modelos de Estabelecimentos <br className="hidden sm:inline" />
            & <span className="bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400 bg-clip-text text-transparent">Cardápios Digitais</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
            Selecione qualquer um dos modelos de negócio abaixo para programar e inspecionar suas duas áreas: a <strong>Área do Cliente</strong> (cardápio público para pedidos na mesa ou delivery) e a <strong>Área Administrativa</strong> (gestão e cozinha do restaurante).
          </p>
        </section>

        {/* 
          ======================================================================
          BARRA DE PESQUISA PRINCIPAL DOS ESTABELECIMENTOS
          ======================================================================
        */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Campo de Pesquisa em Tempo Real */}
            <div className="relative flex-1">
              <svg
                className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Pesquisar por nome (ex: Bella, Burger, Zen...), nicho, slug ou tag..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-2xl text-white text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-rose-500/30 transition-all font-medium"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white text-xs font-bold bg-slate-800 hover:bg-slate-700 w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer"
                  title="Limpar pesquisa"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Contador de Resultados */}
            <div className="shrink-0 text-xs font-bold text-slate-400 bg-slate-950 px-3.5 py-3 rounded-2xl border border-slate-800/80 text-center">
              <span>{restaurantesFiltrados.length}</span>{' '}
              {restaurantesFiltrados.length === 1 ? 'modelo encontrado' : 'modelos encontrados'}
            </div>
          </div>

          {/* Filtros em Chips por Nicho Gastronômico */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
            {nichosDisponiveis.map((nicho) => (
              <button
                key={nicho.id}
                type="button"
                onClick={() => setFiltroNicho(nicho.id)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  filtroNicho === nicho.id
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{nicho.icone}</span>
                <span>{nicho.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 
          ======================================================================
          GRID DE CARDS DOS MODELOS DE RESTAURANTES (LAYOUT TOTALMENTE CORRIGIDO)
          ======================================================================
        */}
        {restaurantesFiltrados.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">🔍</span>
            <p className="text-base font-bold text-white">
              Nenhum estabelecimento encontrado para &ldquo;{busca}&rdquo;
            </p>
            <p className="text-xs text-slate-400 max-w-md">
              Tente pesquisar por outro nome, categoria ou clique no botão abaixo para redefinir os filtros.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusca('');
                setFiltroNicho('todos');
              }}
              className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Limpar Filtros e Ver Todos
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurantesFiltrados.map((restaurante) => {
              const isPizzariaBella = restaurante.slug === 'pizzaria-bella';

              return (
                <article
                  key={restaurante.id}
                  className="group relative bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Banner Colorido Superior Limpo (Sem text overlap) */}
                  <div className={`h-24 bg-gradient-to-r ${restaurante.bannerGradient} relative p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/15 flex items-center gap-1.5 shadow-xs">
                        <span>{restaurante.icone}</span>
                        <span>{restaurante.categoriaTag}</span>
                      </span>

                      {isPizzariaBella && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-md">
                          ⭐ Destaque
                        </span>
                      )}
                    </div>

                    {/* Código Hex da Cor Primária */}
                    <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-[10px] font-mono text-white">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/40"
                        style={{ backgroundColor: restaurante.corPrimaria }}
                      />
                      <span>{restaurante.corPrimaria}</span>
                    </div>
                  </div>

                  {/* Conteúdo Principal do Card com espaçamento limpo e elegante */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Logo + Nome do Estabelecimento (Sem colisão de margens negativas) */}
                      <div className="flex items-center gap-3.5 mb-3.5">
                        {restaurante.logoUrl ? (
                          <img
                            src={restaurante.logoUrl}
                            alt={restaurante.nome}
                            className="w-13 h-13 rounded-2xl object-cover border border-slate-700 bg-slate-800 shadow-md shrink-0"
                          />
                        ) : (
                          <div
                            style={{ backgroundColor: restaurante.corPrimaria }}
                            className="w-13 h-13 rounded-2xl border border-slate-700 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0"
                          >
                            {restaurante.nome.charAt(0)}
                          </div>
                        )}

                        <div className="flex flex-col min-w-0">
                          <h2 className="text-base font-extrabold text-white group-hover:text-rose-400 transition-colors leading-snug truncate">
                            {restaurante.nome}
                          </h2>
                          <span className="text-xs font-mono text-slate-400">
                            /{restaurante.slug}
                          </span>
                        </div>
                      </div>

                      {/* Descrição */}
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {restaurante.descricao}
                      </p>

                      {/* Tags / Especialidades */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {restaurante.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium text-slate-400 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-lg"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Estatísticas de Itens e Categorias */}
                      <div className="py-2.5 border-y border-slate-800/80 flex items-center justify-between text-xs text-slate-400 mb-4">
                        <span>🍽️ {restaurante.totalItens} produtos</span>
                        <span>{restaurante.categorias.length} categorias</span>
                      </div>
                    </div>

                    {/* 
                      ==========================================================
                      DUAS ÁREAS DEDICADAS DO ESTABELECIMENTO:
                      1. ÁREA DO CLIENTE (Cardápio / Pedidos na Mesa)
                      2. ÁREA ADMINISTRATIVA (Painel ADM / Cozinha / Gestão)
                      ==========================================================
                    */}
                    <div className="flex flex-col gap-2.5 pt-1">
                      {/* Seção 1: Área do Cliente */}
                      <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/70">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                          <span className="flex items-center gap-1">
                            <span>🛍️</span>
                            <span>Área do Cliente</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">Cardápio</span>
                        </div>

                        <Link
                          href={`/${restaurante.slug}`}
                          className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white font-bold text-xs rounded-xl transition-all border border-slate-700 flex items-center justify-between group/btn"
                        >
                          <span>Acessar Cardápio Oficial</span>
                          <span className="group-hover/btn:translate-x-1 transition-transform">&rarr;</span>
                        </Link>

                        <div className="grid grid-cols-2 gap-1.5">
                          <Link
                            href={`/${restaurante.slug}?mesa=4`}
                            className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-[11px] rounded-lg transition-all border border-slate-800 flex items-center justify-center gap-1"
                          >
                            <span className="text-emerald-400 font-bold">QR</span>
                            <span>Mesa 4</span>
                          </Link>

                          <Link
                            href={`/${restaurante.slug}?mesa=10`}
                            className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-[11px] rounded-lg transition-all border border-slate-800 flex items-center justify-center gap-1"
                          >
                            <span className="text-emerald-400 font-bold">QR</span>
                            <span>Mesa 10</span>
                          </Link>
                        </div>
                      </div>

                      {/* Seção 2: Área Administrativa */}
                      <div className="flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/70">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                          <span className="flex items-center gap-1">
                            <span>⚙️</span>
                            <span>Área Administrativa</span>
                          </span>
                          <span className="text-[10px] text-amber-400 font-semibold">Gestão & ADM</span>
                        </div>

                        <Link
                          href={`/${restaurante.slug}/admin`}
                          className="w-full py-2.5 px-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 active:scale-98 text-amber-300 hover:text-amber-200 font-bold text-xs rounded-xl transition-all border border-amber-500/30 flex items-center justify-between group/adm"
                        >
                          <span className="flex items-center gap-1.5">
                            <span>🛠️</span>
                            <span>Acessar Painel ADM</span>
                          </span>
                          <span className="group-adm:translate-x-1 transition-transform">&rarr;</span>
                        </Link>
                      </div>

                      {/* Link Dev para API JSON */}
                      <a
                        href={`${backendBaseUrl}/api/${restaurante.slug}/produtos`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-center text-slate-500 hover:text-slate-400 font-mono py-1 hover:underline flex items-center justify-center gap-1"
                      >
                        <span>Inspecionar API JSON</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* 
          ======================================================================
          SIMULADOR DE NOVO SLUG / PLAYGROUND DO DESENVOLVEDOR (POSICIONADO NO FINAL)
          ======================================================================
        */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-6 backdrop-blur-xl flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>🧪</span>
                <span>Simulador de Nova Rota (Testar slug dinâmico em desenvolvimento)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Digite um identificador livre para testar a resposta do cardápio em qualquer rota <code className="text-rose-400 bg-slate-950 px-1 py-0.5 rounded text-[11px]">/[slug]</code>
              </p>
            </div>

            <button
              type="button"
              onClick={gerarSlugAleatorio}
              className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>🎲</span>
              <span>Gerar Exemplo</span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (slugCustom.trim()) {
                const url = `/${slugCustom.trim().toLowerCase()}${
                  mesaCustom.trim() ? `?mesa=${encodeURIComponent(mesaCustom.trim())}` : ''
                }`;
                window.location.href = url;
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1"
          >
            <div className="sm:col-span-6 relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono text-sm select-none">
                /
              </span>
              <input
                type="text"
                required
                placeholder="Ex: nova-hamburgueria ou bar-do-bairro"
                value={slugCustom}
                onChange={(e) => setSlugCustom(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-rose-500 transition-all"
              />
            </div>

            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder="Mesa (opcional, ex: 12)"
                value={mesaCustom}
                onChange={(e) => setMesaCustom(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:ring-2 focus:ring-rose-500 transition-all"
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={!slugCustom.trim()}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Testar Rota</span>
                <span>&rarr;</span>
              </button>
            </div>
          </form>
        </section>

        {/* 
          ======================================================================
          DOCUMENTAÇÃO RÁPIDA DE ROTAS DO SAAS
          ======================================================================
        */}
        <section className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <span>📚</span>
            <span>Estrutura de Rotas do SaaS</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl flex flex-col gap-1">
              <span className="font-bold text-rose-400">1. Área do Cliente</span>
              <code className="text-slate-300 bg-slate-900 p-1.5 rounded font-mono text-[11px]">
                /[slug]
              </code>
              <p className="text-slate-400 text-[11px]">
                Cardápio digital mobile-first, QR Code da mesa e checkout.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl flex flex-col gap-1">
              <span className="font-bold text-amber-400">2. Área Administrativa</span>
              <code className="text-slate-300 bg-slate-900 p-1.5 rounded font-mono text-[11px]">
                /[slug]/admin
              </code>
              <p className="text-slate-400 text-[11px]">
                Painel ADM, pedidos da cozinha (KDS) e gestão do estabelecimento.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl flex flex-col gap-1">
              <span className="font-bold text-sky-400">3. API Multi-Tenant</span>
              <code className="text-slate-300 bg-slate-900 p-1.5 rounded font-mono text-[11px]">
                /api/:slug/produtos
              </code>
              <p className="text-slate-400 text-[11px]">
                Endpoint isolado via middleware no PostgreSQL do Neon.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
