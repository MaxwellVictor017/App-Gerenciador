'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { LISTA_RESTAURANTES_HUB } from '@/src/data/mockCardapios';

interface EstabelecimentoItem {
  id?: string;
  nome: string;
  slug: string;
  nicho: string;
  categoriaTag: string;
  icone: string;
  corPrimaria: string;
  bannerGradient?: string;
  tags: string[];
  logoUrl?: string | null;
  descricao?: string;
  totalItens: number;
  categorias: string[];
  totalMesas?: number;
  totalFuncionarios?: number;
  origem?: 'banco' | 'template';
  ativo?: boolean;
}

interface MascaraItem {
  slug: string;
  nome: string;
  nicho: string;
  categoriaTag: string;
  icone: string;
  corPrimaria: string;
  bannerGradient: string;
  tags: string[];
  logoUrl?: string | null;
  descricao: string;
  totalItens: number;
  categorias: string[];
  exemplosProdutos: string[];
}

export default function DevHubPage() {
  const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoItem[]>(
    LISTA_RESTAURANTES_HUB as unknown as EstabelecimentoItem[]
  );
  const [mascaras, setMascaras] = useState<MascaraItem[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroNicho, setFiltroNicho] = useState<string>('todos');
  const [slugCustom, setSlugCustom] = useState('');
  const [mesaCustom, setMesaCustom] = useState('');
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Estados do Modal "Novo Estabelecimento"
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [mascaraSelecionada, setMascaraSelecionada] = useState<string>('pizzaria-bella');
  const [novoNome, setNovoNome] = useState('');
  const [novoSlug, setNovoSlug] = useState('');
  const [novoNicho, setNovoNicho] = useState('pizzaria');
  const [novaCor, setNovaCor] = useState('#E11D48');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('(11) 98765-4321');
  const [novoLogoUrl, setNovoLogoUrl] = useState('');
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);

  // Estados do Modal de Exclusão
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [estabelecimentoParaExcluir, setEstabelecimentoParaExcluir] = useState<EstabelecimentoItem | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // Toast de Notificação
  const [toast, setToast] = useState<{ tipo: 'sucesso' | 'erro' | 'info'; mensagem: string } | null>(null);

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const exibirToast = (tipo: 'sucesso' | 'erro' | 'info', mensagem: string) => {
    setToast({ tipo, mensagem });
    setTimeout(() => setToast(null), 4500);
  };

  // Carrega estabelecimentos do backend Express / Neon DB
  const carregarEstabelecimentos = useCallback(async () => {
    try {
      setCarregandoLista(true);
      const res = await fetch(`${backendBaseUrl}/api/tenants?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.sucesso && Array.isArray(data.estabelecimentos)) {
          setEstabelecimentos(data.estabelecimentos);
          return;
        }
      }
    } catch (_err) {
      // Mantém fallback do mock estático
    } finally {
      setCarregandoLista(false);
    }
  }, [backendBaseUrl]);

  // Carrega máscaras disponíveis para clonagem
  const carregarMascaras = useCallback(async () => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/tenants/mascaras`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.sucesso && Array.isArray(data.mascaras)) {
          setMascaras(data.mascaras);
        }
      }
    } catch (_err) {}
  }, [backendBaseUrl]);

  // Checa status da API Express e carrega dados
  useEffect(() => {
    fetch(`${backendBaseUrl}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setApiOnline(true);
          carregarEstabelecimentos();
          carregarMascaras();
        }
      })
      .catch(() => setApiOnline(false));
  }, [backendBaseUrl, carregarEstabelecimentos, carregarMascaras]);

  const nichosDisponiveis = [
    { id: 'todos', label: 'Todos os Modelos', icone: '✨' },
    { id: 'pizzaria', label: 'Pizzarias', icone: '🍕' },
    { id: 'hamburgueria', label: 'Hamburguerias', icone: '🍔' },
    { id: 'restaurante', label: 'Restaurantes & Grill', icone: '🥩' },
    { id: 'bar', label: 'Bares & Petiscarias', icone: '🍺' },
    { id: 'oriental', label: 'Sushi & Oriental', icone: '🍣' },
    { id: 'cafeteria', label: 'Cafeterias & Bistrôs', icone: '☕' },
  ];

  const paletaCoresSugeridas = [
    { cor: '#E11D48', nome: 'Rose Carmine (Pizzaria)' },
    { cor: '#EA580C', nome: 'Laranja Brasa (Burger)' },
    { cor: '#0F766E', nome: 'Esmeralda Nobre (Grill)' },
    { cor: '#D97706', nome: 'Dourado Chopp (Boteco)' },
    { cor: '#DC2626', nome: 'Vermelho Tóquio (Sushi)' },
    { cor: '#78350F', nome: 'Caramelo Café (Cafeteria)' },
    { cor: '#2563EB', nome: 'Azul Real (SaaS)' },
    { cor: '#7C3AED', nome: 'Roxo Imperial' },
  ];

  // Helper para gerar slug automático a partir do nome
  const normalizarSlug = (texto: string) => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const lidarComMudancaNome = (valor: string) => {
    setNovoNome(valor);
    if (!slugEditadoManualmente) {
      setNovoSlug(normalizarSlug(valor));
    }
  };

  // Ao selecionar uma máscara no modal
  const lidarComSelecaoMascara = (mascara: MascaraItem) => {
    setMascaraSelecionada(mascara.slug);
    setNovoNicho(mascara.nicho);
    setNovaCor(mascara.corPrimaria);
    if (!novoNome) {
      const sugestoes: Record<string, string> = {
        'pizzaria-bella': 'Cantina & Forno Napolitano',
        'burger-craft': 'Smash Station Prime',
        'trattoria-grill': 'Parrilla & Cortes Gourmet',
        'boteco-boemia': 'Boteco do Bairro & Chopp',
        'sushi-zen': 'Kobe Sushi & Ramen Bar',
        'cafe-bistrot': 'Aroma Especial & Brunch',
        'limpo': 'Novo Restaurante SaaS',
      };
      const nomeSugerido = sugestoes[mascara.slug] || `${mascara.nome} Filial`;
      setNovoNome(nomeSugerido);
      if (!slugEditadoManualmente) {
        setNovoSlug(normalizarSlug(nomeSugerido));
      }
    }
    if (!novaDescricao) {
      setNovaDescricao(mascara.descricao);
    }
    if (mascara.logoUrl && !novoLogoUrl) {
      setNovoLogoUrl(mascara.logoUrl);
    }
  };

  // Submissão do formulário de criação de estabelecimento
  const submeterNovoEstabelecimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoSlug.trim()) {
      exibirToast('erro', 'Nome e slug são obrigatórios.');
      return;
    }

    try {
      setSalvandoNovo(true);
      const res = await fetch(`${backendBaseUrl}/api/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoNome.trim(),
          slug: novoSlug.trim(),
          nicho: novoNicho,
          corPrimaria: novaCor,
          descricao: novaDescricao.trim(),
          telefone: novoTelefone.trim(),
          logoUrl: novoLogoUrl.trim() || null,
          mascaraBase: mascaraSelecionada,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro || 'Falha ao criar estabelecimento.');
      }

      exibirToast('sucesso', `🎉 Estabelecimento "${novoNome}" criado com sucesso no Neon DB!`);
      setModalNovoAberto(false);

      // Reseta formulário
      setNovoNome('');
      setNovoSlug('');
      setNovaDescricao('');
      setNovoLogoUrl('');
      setSlugEditadoManualmente(false);

      // Atualiza a lista imediatamente
      await carregarEstabelecimentos();
    } catch (error: any) {
      exibirToast('erro', error.message || 'Erro ao criar estabelecimento.');
    } finally {
      setSalvandoNovo(false);
    }
  };

  // Confirmação e exclusão de estabelecimento
  const confirmarExclusao = async () => {
    if (!estabelecimentoParaExcluir) return;

    try {
      setExcluindo(true);
      const res = await fetch(`${backendBaseUrl}/api/tenants/${estabelecimentoParaExcluir.slug}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro || 'Falha ao excluir estabelecimento.');
      }

      exibirToast('sucesso', `🗑️ Estabelecimento "${estabelecimentoParaExcluir.nome}" foi excluído permanentemente.`);
      setModalExcluirAberto(false);
      setEstabelecimentoParaExcluir(null);

      // Atualiza a lista imediatamente
      await carregarEstabelecimentos();
    } catch (error: any) {
      exibirToast('erro', error.message || 'Erro ao excluir estabelecimento.');
    } finally {
      setExcluindo(false);
    }
  };

  // Filtra restaurantes por nicho e termo de busca (busca em tempo real)
  const termo = busca.toLowerCase().trim();
  const restaurantesFiltrados = estabelecimentos.filter((r) => {
    const matchNicho = filtroNicho === 'todos' || r.nicho === filtroNicho;
    const matchBusca =
      !termo ||
      r.nome.toLowerCase().includes(termo) ||
      r.slug.toLowerCase().includes(termo) ||
      (r.categoriaTag || '').toLowerCase().includes(termo) ||
      (r.descricao || '').toLowerCase().includes(termo) ||
      (r.tags || []).some((t) => t.toLowerCase().includes(termo));
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

      {/* Toast Flutuante */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300">
          <div
            className={`px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 text-sm font-semibold ${
              toast.tipo === 'sucesso'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50'
                : toast.tipo === 'erro'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-950/50'
                : 'bg-slate-900/90 text-slate-200 border-slate-700 shadow-black/50'
            }`}
          >
            <span>{toast.tipo === 'sucesso' ? '✨' : toast.tipo === 'erro' ? '⚠️' : 'ℹ️'}</span>
            <span>{toast.mensagem}</span>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        TOP BAR DO DEV HUB COM BOTÃO ADICIONAR NOVO SISTEMA
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
                  Gerenciador Multi-Tenant
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Adicione, exclua e teste sistemas gastronômicos clonando Máscaras
              </p>
            </div>
          </div>

          {/* Ações da TopBar: Botão + Novo Estabelecimento e Badges */}
          <div className="flex items-center gap-2.5">
            {/* Botão de Adicionar Estabelecimento */}
            <button
              type="button"
              onClick={() => {
                setModalNovoAberto(true);
                if (mascaras.length > 0) {
                  lidarComSelecaoMascara(mascaras[0]);
                }
              }}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer border border-rose-400/30"
            >
              <span className="text-base leading-none">＋</span>
              <span>Novo Estabelecimento</span>
            </button>

            {/* Badges de Status da API */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
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
            <span>Ambiente do Desenvolvedor • Sistemas Máscaras com Clonagem Instantânea no Neon DB</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Modelos de Estabelecimentos <br className="hidden sm:inline" />
                & <span className="bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400 bg-clip-text text-transparent">Cardápios Digitais</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed mt-2">
                Adicione novos restaurantes usando <strong>Sistemas Máscaras</strong> como base para clonar produtos, categorias e mesas, ou exclua sistemas para manter sua base limpa.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setModalNovoAberto(true);
                if (mascaras.length > 0) {
                  lidarComSelecaoMascara(mascaras[0]);
                }
              }}
              className="self-center sm:self-end px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-2xl text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2 transition-all shadow-xl cursor-pointer"
            >
              <span>✨</span>
              <span>Clonar Máscara Base</span>
            </button>
          </div>
        </section>

        {/* 
          ======================================================================
          BARRA DE PESQUISA & FILTROS DE NICHOS
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

            {/* Contador de Resultados e Botão de Atualizar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={carregarEstabelecimentos}
                disabled={carregandoLista}
                className="px-3.5 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-2xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                title="Recarregar do Neon DB"
              >
                <span className={carregandoLista ? 'animate-spin' : ''}>🔄</span>
                <span className="hidden sm:inline">Sincronizar</span>
              </button>

              <div className="shrink-0 text-xs font-bold text-slate-400 bg-slate-950 px-3.5 py-3 rounded-2xl border border-slate-800/80 text-center">
                <span>{restaurantesFiltrados.length}</span>{' '}
                {restaurantesFiltrados.length === 1 ? 'estabelecimento' : 'estabelecimentos'}
              </div>
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
          GRID DE CARDS DOS ESTABELECIMENTOS (COM BOTÃO DE EXCLUIR SISTEMA)
          ======================================================================
        */}
        {restaurantesFiltrados.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">🔍</span>
            <p className="text-base font-bold text-white">
              Nenhum estabelecimento encontrado para &ldquo;{busca}&rdquo;
            </p>
            <p className="text-xs text-slate-400 max-w-md">
              Tente pesquisar por outro nome, categoria ou adicione um novo estabelecimento agora.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setBusca('');
                  setFiltroNicho('todos');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Limpar Filtros
              </button>

              <button
                type="button"
                onClick={() => setModalNovoAberto(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                ＋ Adicionar Estabelecimento
              </button>
            </div>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurantesFiltrados.map((restaurante) => {
              const isPizzariaBella = restaurante.slug === 'pizzaria-bella';
              const gradientClass =
                restaurante.bannerGradient || 'from-slate-800 via-slate-900 to-slate-950';

              return (
                <article
                  key={restaurante.slug}
                  className="group relative bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Banner Superior com Categoria, Cores e Botão EXCLUIR */}
                  <div className={`h-24 bg-gradient-to-r ${gradientClass} relative p-4 flex items-center justify-between`}>
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

                    <div className="flex items-center gap-2">
                      {/* Código Hex da Cor */}
                      <div className="hidden sm:flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 text-[10px] font-mono text-white">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/40"
                          style={{ backgroundColor: restaurante.corPrimaria }}
                        />
                        <span>{restaurante.corPrimaria}</span>
                      </div>

                      {/* Botão de Exclusão do Sistema (Lixeira) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEstabelecimentoParaExcluir(restaurante);
                          setModalExcluirAberto(true);
                        }}
                        className="w-8 h-8 rounded-xl bg-black/50 hover:bg-rose-600/90 text-slate-300 hover:text-white border border-white/15 hover:border-rose-500/50 flex items-center justify-center transition-all cursor-pointer shadow-md"
                        title="Excluir este estabelecimento do Neon DB"
                      >
                        <span className="text-sm">🗑️</span>
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo Principal do Card */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Logo + Nome do Estabelecimento */}
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
                        {(restaurante.tags || []).map((tag, idx) => (
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
                        <span>{(restaurante.categorias || []).length} categorias</span>
                        <span className="text-emerald-400 font-semibold">10 mesas</span>
                      </div>
                    </div>

                    {/* Links de Acesso Direto */}
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
          SIMULADOR DE NOVO SLUG / TESTADOR LIVRE
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
                Painel ADM, pedidos da cozinha (KDS), Menu Studio e equipe.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl flex flex-col gap-1">
              <span className="font-bold text-sky-400">3. API Multi-Tenant</span>
              <code className="text-slate-300 bg-slate-900 p-1.5 rounded font-mono text-[11px]">
                /api/tenants & /api/:slug/produtos
              </code>
              <p className="text-slate-400 text-[11px]">
                CRUD de estabelecimentos e dados isolados no Neon PostgreSQL.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 
        ========================================================================
        MODAL: ADICIONAR NOVO ESTABELECIMENTO (COM SELEÇÃO DE MÁSCARA)
        ========================================================================
      */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto flex flex-col gap-6">
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold mb-2">
                  <span>⚡</span>
                  <span>Clonagem de Sistema Máscara</span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  Adicionar Novo Estabelecimento
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Selecione uma <strong>Máscara Base</strong> para clonar produtos, categorias e mesas, ou crie um modelo personalizado.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalNovoAberto(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submeterNovoEstabelecimento} className="flex flex-col gap-6">
              {/* ETAPA 1: SELEÇÃO DA MÁSCARA BASE */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2.5">
                  1. Escolha a Máscara Base (Template para Clonagem):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mascaras.map((m) => {
                    const isSelected = mascaraSelecionada === m.slug;
                    return (
                      <div
                        key={m.slug}
                        onClick={() => lidarComSelecaoMascara(m)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/50'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-2xl">{m.icone}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {m.categoriaTag}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-extrabold text-white flex items-center justify-between">
                            <span>{m.nome}</span>
                            {isSelected && <span className="text-rose-400 text-xs">✓ Ativo</span>}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {m.descricao}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span>🍽️ {m.totalItens} produtos</span>
                          <span>{m.categorias.length} categorias</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ETAPA 2: PERSONALIZAÇÃO DOS DADOS DO ESTABELECIMENTO */}
              <div className="border-t border-slate-800 pt-5 flex flex-col gap-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  2. Personalizar Dados do Novo Estabelecimento:
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Nome do Restaurante *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Cantina & Pizzaria di Roma"
                      value={novoNome}
                      onChange={(e) => lidarComMudancaNome(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-white text-xs font-semibold focus:ring-2 focus:ring-rose-500/20 transition-all"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Slug da Rota (URL) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-xs">
                        /
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="cantina-di-roma"
                        value={novoSlug}
                        onChange={(e) => {
                          setSlugEditadoManualmente(true);
                          setNovoSlug(normalizarSlug(e.target.value));
                        }}
                        className="w-full pl-7 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-rose-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nicho */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Nicho Gastronômico
                    </label>
                    <select
                      value={novoNicho}
                      onChange={(e) => setNovoNicho(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-white text-xs font-semibold focus:ring-2 focus:ring-rose-500/20 transition-all cursor-pointer"
                    >
                      <option value="pizzaria">🍕 Pizzaria</option>
                      <option value="hamburgueria">🍔 Hamburgueria & Smash</option>
                      <option value="restaurante">🥩 Restaurante & Grill</option>
                      <option value="bar">🍺 Bar & Petiscaria</option>
                      <option value="oriental">🍣 Sushi & Oriental</option>
                      <option value="cafeteria">☕ Cafeteria & Bistrô</option>
                      <option value="outro">🍽️ Outro / Geral</option>
                    </select>
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="(11) 98765-4321"
                      value={novoTelefone}
                      onChange={(e) => setNovoTelefone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-white text-xs focus:ring-2 focus:ring-rose-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Cor Primária */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Cor Primária da Marca
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="color"
                      value={novaCor}
                      onChange={(e) => setNovaCor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-950 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={novaCor}
                      onChange={(e) => setNovaCor(e.target.value)}
                      className="w-28 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                    />

                    <div className="flex flex-wrap gap-1.5 ml-2">
                      {paletaCoresSugeridas.map((item) => (
                        <button
                          key={item.cor}
                          type="button"
                          onClick={() => setNovaCor(item.cor)}
                          className="w-7 h-7 rounded-lg border border-slate-700 hover:scale-110 transition-transform cursor-pointer"
                          style={{ backgroundColor: item.cor }}
                          title={item.nome}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Descrição do Estabelecimento
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descrição para exibição no cardápio..."
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-white text-xs focus:ring-2 focus:ring-rose-500/20 transition-all"
                  />
                </div>

                {/* URL do Logo */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    URL da Logomarca (Opcional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={novoLogoUrl}
                    onChange={(e) => setNovoLogoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-white text-xs focus:ring-2 focus:ring-rose-500/20 transition-all"
                  />
                </div>
              </div>

              {/* PREVIEW DAS ROTAS GERADAS */}
              {novoSlug && (
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span>🚀</span>
                    <span>Rotas que ficarão ativas instantaneamente:</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Cardápio Cliente:</span>
                      <span className="text-white">/{novoSlug}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Painel ADM:</span>
                      <span className="text-amber-400">/{novoSlug}/admin</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Carrinho & Pix:</span>
                      <span className="text-white">/{novoSlug}/carrinho</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">API PostgreSQL:</span>
                      <span className="text-sky-400">/api/{novoSlug}/produtos</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões do Rodapé */}
              <div className="border-t border-slate-800 pt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  disabled={salvandoNovo}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvandoNovo || !novoNome.trim() || !novoSlug.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {salvandoNovo ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Clonando Máscara no Neon DB...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Criar Estabelecimento & Clonar Máscara</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE ESTABELECIMENTO
        ========================================================================
      */}
      {modalExcluirAberto && estabelecimentoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 animate-scaleIn">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Excluir Estabelecimento?
                </h3>
                <p className="text-xs text-slate-400">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 flex flex-col gap-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-white text-sm">{estabelecimentoParaExcluir.nome}</span>
                <span className="text-rose-400 font-mono">/{estabelecimentoParaExcluir.slug}</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Todos os produtos clonados, categorias, mesas com QR Codes, funcionários e pedidos associados a este estabelecimento serão removidos permanentemente do <strong>Neon PostgreSQL</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalExcluirAberto(false);
                  setEstabelecimentoParaExcluir(null);
                }}
                disabled={excluindo}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {excluindo ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Excluindo do Neon...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Sim, Excluir Estabelecimento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
