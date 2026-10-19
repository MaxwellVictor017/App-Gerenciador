import React from 'react';
import { notFound } from 'next/navigation';
import { CartSummary } from '@/components/CartSummary';
import { AddToCartButton } from '@/components/AddToCartButton';

// ==============================================================================
// TIPAGEM TYPESCRIPT
// ==============================================================================

export interface Categoria {
  id: string;
  nome: string;
  ordem?: number;
}

export interface Produto {
  id: string;
  nome: string;
  descricao?: string | null;
  precoBase: number | string;
  imagemUrl?: string | null;
  categoria: Categoria;
  gruposOpcao?: Array<{
    grupo: {
      id: string;
      nome: string;
      minimo: number;
      maximo: number;
      obrigatorio: boolean;
      itens: Array<{
        id: string;
        nome: string;
        preco: number | string;
        disponivel: boolean;
      }>;
    };
  }>;
}

export interface Restaurante {
  id?: string;
  nome: string;
  slug: string;
  corPrimaria?: string;
  cor_primaria?: string;
  logoUrl?: string | null;
  descricao?: string;
  horarioFuncionamento?: string;
  telefone?: string;
}

interface ApiResponseCardapio {
  sucesso: boolean;
  restaurante: Restaurante;
  total: number;
  produtos: Produto[];
}

interface PageProps {
  params: Promise<{ restaurante_slug: string }> | { restaurante_slug: string };
  searchParams?: Promise<{ mesa?: string }> | { mesa?: string };
}

import { RESTAURANTES_CATALOGO } from '@/src/data/mockCardapios';

// ==============================================================================
// DADOS SIMULADOS DE FALLBACK (CATÁLOGO MULTI-MODELOS COMPLETO)
// ==============================================================================

const MOCK_CARDAPIOS: Record<string, ApiResponseCardapio> = RESTAURANTES_CATALOGO as unknown as Record<string, ApiResponseCardapio>;


// ==============================================================================
// FUNÇÃO DE BUSCA DE DADOS (FETCH SERVER-SIDE COM FALLBACK)
// ==============================================================================

async function getCardapioData(slug: string): Promise<ApiResponseCardapio | null> {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    // Tentativa de chamada real para a rota Express multi-tenant:
    // GET /api/:tenant_slug/produtos
    const response = await fetch(`${backendBaseUrl}/api/${slug}/produtos`, {
      cache: 'no-store', // Sempre atualizado para os clientes do cardápio
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data: ApiResponseCardapio = await response.json();
      return data;
    }

  } catch (_error) {
    // API backend pode estar desligada ou ambiente de desenvolvimento local
  }


  // Fallback para os dados simulados
  if (MOCK_CARDAPIOS[slug]) {
    return MOCK_CARDAPIOS[slug];
  }

  // Fallback genérico para teste com qualquer slug digitado na URL
  return {
    sucesso: true,
    restaurante: {
      nome: slug.replace(/-/g, ' ').toUpperCase(),
      slug: slug,
      corPrimaria: '#0284C7', // Azul moderno
      descricao: 'Bem-vindo ao nosso cardápio digital oficial.',
      horarioFuncionamento: 'Aberto agora • Pedidos na mesa',
    },
    total: 3,
    produtos: [
      {
        id: 'mock-1',
        nome: 'Item Especial da Casa',
        descricao: 'Deliciosa receita preparada artesanalmente com ingredientes frescos e selecionados.',
        precoBase: 34.9,
        categoria: { id: 'cat-1', nome: 'Destaques', ordem: 1 },
      },
      {
        id: 'mock-2',
        nome: 'Prato Principal Executivo',
        descricao: 'Acompanha salada fresca, guarnição do dia e molho exclusivo do chef.',
        precoBase: 49.9,
        categoria: { id: 'cat-2', nome: 'Pratos Principais', ordem: 2 },
      },
      {
        id: 'mock-3',
        nome: 'Bebida Gelada',
        descricao: 'Suco natural feito na hora ou refrigerante lata 350ml bem gelado.',
        precoBase: 9.5,
        categoria: { id: 'cat-3', nome: 'Bebidas', ordem: 3 },
      },
    ],
  };
}

// ==============================================================================
// FUNÇÃO DE BUSCA DE DESIGN CUSTOMIZADO (MENU STUDIO)
// ==============================================================================

async function getDesignData(slug: string): Promise<any | null> {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const response = await fetch(`${backendBaseUrl}/api/${slug}/design`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      return data.design || null;
    }
  } catch (_e) {}
  return null;
}

// Utilitário para formatar moedas em Real Brasileiro (BRL)
function formatarPreco(valor: number | string): string {
  const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numero || 0);
}

// ==============================================================================
// COMPONENTE PRINCIPAL DA PÁGINA (NEXT.JS APP ROUTER)
// ==============================================================================

export default async function RestauranteCardapioPage({ params, searchParams }: PageProps) {
  // Resolução de params (compatível com Next.js 14 e Next.js 15 App Router)
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const { restaurante_slug } = resolvedParams;
  const numeroMesa = resolvedSearchParams?.mesa;

  // Busca concorrente dos dados do cardápio e das customizações de design
  const [dados, designConfig] = await Promise.all([
    getCardapioData(restaurante_slug),
    getDesignData(restaurante_slug),
  ]);

  if (!dados || !dados.restaurante) {
    notFound();
  }

  const { restaurante, produtos } = dados;

  // Parâmetros de design aplicados (vindos do Menu Studio ou com fallback)
  const corPrimaria = designConfig?.corPrimaria || restaurante.corPrimaria || restaurante.cor_primaria || '#E11D48';
  const corFundo = designConfig?.corFundo || 'claro';
  const estiloHeader = designConfig?.estiloHeader || 'gradiente';
  const bannerUrl = designConfig?.bannerUrl || null;
  const logoUrl = designConfig?.logoUrl || restaurante.logoUrl || null;
  const nomeExibicao = designConfig?.nomeRestaurante || restaurante.nome;
  const sloganExibicao = designConfig?.slogan || restaurante.descricao || 'Cardápio Digital Oficial';
  const estiloCard = designConfig?.estiloCard || 'moderno';
  const arredondamento = designConfig?.arredondamento || 'moderno';
  const exibirFotos = designConfig?.exibirFotos !== false;
  const iconesCategorias = designConfig?.iconesCategorias || {};
  const secoes = designConfig?.secoes || [];

  const isSecaoAtiva = (id: string, defaultAtivo = true) => {
    if (!secoes || secoes.length === 0) return defaultAtivo;
    const s = secoes.find((item: any) => item.id === id);
    return s ? s.ativo : defaultAtivo;
  };

  const getFundoClasses = () => {
    switch (corFundo) {
      case 'escuro':
        return 'bg-zinc-950 text-zinc-100';
      case 'creme':
        return 'bg-[#FAF6F0] text-[#292524]';
      case 'slate':
        return 'bg-slate-900 text-slate-100';
      case 'claro':
      default:
        return 'bg-slate-50 text-slate-800';
    }
  };

  const getCardBgClasses = () => {
    switch (corFundo) {
      case 'escuro':
        return 'bg-zinc-900 border-zinc-800 text-zinc-100';
      case 'creme':
        return 'bg-white border-[#E7E2D9] text-[#292524]';
      case 'slate':
        return 'bg-slate-950/70 border-slate-800 text-slate-100';
      case 'claro':
      default:
        return 'bg-white border-slate-200/80 text-slate-900';
    }
  };

  const getRadiusClass = () => {
    switch (arredondamento) {
      case 'suave':
        return 'rounded-lg';
      case 'pill':
        return 'rounded-3xl';
      case 'moderno':
      default:
        return 'rounded-2xl';
    }
  };

  // Agrupa os produtos por categoria mantendo a ordem
  const categoriasMap = new Map<string, { categoria: Categoria; itens: Produto[] }>();

  produtos.forEach((produto) => {
    const cat = produto.categoria || { id: 'geral', nome: 'Geral', ordem: 99 };
    if (!categoriasMap.has(cat.id)) {
      categoriasMap.set(cat.id, {
        categoria: cat,
        itens: [],
      });
    }
    categoriasMap.get(cat.id)!.itens.push(produto);
  });

  const categoriasAgrupadas = Array.from(categoriasMap.values()).sort(
    (a, b) => (a.categoria.ordem ?? 0) - (b.categoria.ordem ?? 0)
  );

  // Produtos destacados para o carrossel de mais vendidos
  const produtosDestaque = produtos.filter((p: any) => p.destaque || p.categoria?.nome?.toLowerCase().includes('destaque') || p.categoria?.nome?.toLowerCase().includes('entrada')).slice(0, 5);

  return (
    <div className={`min-h-screen ${getFundoClasses()} antialiased pb-28 selection:bg-rose-500 selection:text-white transition-colors duration-300`}>
      {/* 
        ========================================================================
        CABEÇALHO MOBILE-FIRST DINÂMICO
        Fundo configurado com a cor_primaria ou banner customizado do Menu Studio
        ========================================================================
      */}
      {isSecaoAtiva('header_topo', true) && (
        <header
          style={{ backgroundColor: corPrimaria }}
          className="relative text-white shadow-lg transition-colors duration-300"
        >
          {/* Banner de capa com overlay escuro quando ativo */}
          {estiloHeader === 'banner' && bannerUrl && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img src={bannerUrl} alt="Capa" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
            </div>
          )}

          {/* Camada sutil de gradiente para profundidade e contraste premium */}
          {estiloHeader === 'gradiente' && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45 pointer-events-none" />
          )}

          <div className="relative max-w-md mx-auto px-5 pt-8 pb-6 flex flex-col gap-4">
            {/* Top Bar: Mesa / Status */}
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Aberto para pedidos</span>
              </div>

              {numeroMesa && (
                <div className="bg-white/25 backdrop-blur-md px-3 py-1 rounded-full font-bold border border-white/25 shadow-sm">
                  Mesa {numeroMesa}
                </div>
              )}
            </div>

            {/* Identificação do Restaurante */}
            <div className="flex items-center gap-3.5 mt-1">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={nomeExibicao}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/80 shadow-md shrink-0 bg-white"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                  {nomeExibicao.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex flex-col">
                <h1 className="text-2xl font-extrabold tracking-tight leading-tight drop-shadow-sm">
                  {nomeExibicao}
                </h1>
                <p className="text-xs text-white/90 line-clamp-1 mt-0.5">
                  {sloganExibicao}
                </p>
                {restaurante.horarioFuncionamento && (
                  <span className="text-[11px] text-white/80 mt-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {restaurante.horarioFuncionamento}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* 
        ========================================================================
        BARRA DE PESQUISA RÁPIDA (SE ATIVA NO MENU STUDIO)
        ========================================================================
      */}
      {isSecaoAtiva('busca_produtos', true) && (
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 rounded-full px-4 py-2.5 flex items-center gap-2.5 shadow-xs">
            <span className="text-sm opacity-60">🔍</span>
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        CARROSSEL DE MAIS VENDIDOS / DESTAQUES (SE ATIVO NO MENU STUDIO)
        ========================================================================
      */}
      {isSecaoAtiva('destaques', true) && produtosDestaque.length > 0 && (
        <div className="max-w-md mx-auto px-4 pt-5 flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
            <span>🔥</span>
            <span>Mais Pedidos da Casa</span>
          </div>

          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {produtosDestaque.map((produto: any) => (
              <div
                key={`destaque-${produto.id}`}
                className={`shrink-0 w-40 ${getCardBgClasses()} ${getRadiusClass()} overflow-hidden shadow-xs flex flex-col justify-between`}
              >
                {exibirFotos && produto.imagemUrl && (
                  <img src={produto.imagemUrl} alt={produto.nome} className="w-full h-24 object-cover" />
                )}
                <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h3 className="text-xs font-bold line-clamp-1">{produto.nome}</h3>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                      {formatarPreco(produto.precoBase)}
                    </span>
                  </div>
                  <AddToCartButton produto={produto} corPrimaria={corPrimaria} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        BARRA DE NAVEGAÇÃO DE CATEGORIAS (HORIZONTAL SCROLL CHIPS)
        ========================================================================
      */}
      {isSecaoAtiva('categorias_chips', true) && (
        <nav className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 shadow-xs mt-3">
          <div className="max-w-md mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-none snap-x">
            {categoriasAgrupadas.map(({ categoria }, index) => {
              const icone = iconesCategorias[categoria.nome] || '🍽️';
              return (
                <a
                  key={categoria.id}
                  href={`#categoria-${categoria.id}`}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 snap-start shadow-xs flex items-center gap-1.5 ${
                    index === 0
                      ? 'text-white'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200'
                  }`}
                  style={index === 0 ? { backgroundColor: corPrimaria } : {}}
                >
                  <span className="text-sm">{icone}</span>
                  <span>{categoria.nome}</span>
                </a>
              );
            })}
          </div>
        </nav>
      )}

      {/* 
        ========================================================================
        CORPO PRINCIPAL: SEÇÕES DE CATEGORIAS E CARDS DE PRODUTOS
        Formatados conforme a escolha do lojista no Menu Studio
        ========================================================================
      */}
      {isSecaoAtiva('lista_produtos', true) && (
        <main className="max-w-md mx-auto px-4 pt-6 flex flex-col gap-8">
          {categoriasAgrupadas.map(({ categoria, itens }) => {
            const icone = iconesCategorias[categoria.nome] || '🍽️';
            return (
              <section
                key={categoria.id}
                id={`categoria-${categoria.id}`}
                className="scroll-mt-16 flex flex-col gap-3.5"
              >
                {/* Título da Categoria com Ícone */}
                <div className="flex items-center gap-2 border-b border-slate-200/70 dark:border-zinc-800 pb-2">
                  <span className="text-xl">{icone}</span>
                  <h2 className="text-lg font-bold tracking-tight">
                    {categoria.nome}
                  </h2>
                  <span className="text-xs font-medium opacity-60 bg-slate-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {itens.length}
                  </span>
                </div>

                {/* FORMATO 1: MODERNO HORIZONTAL */}
                {estiloCard === 'moderno' && (
                  <div className="flex flex-col gap-3">
                    {itens.map((produto) => (
                      <article
                        key={produto.id}
                        className={`group relative ${getCardBgClasses()} ${getRadiusClass()} p-4 shadow-xs hover:shadow-md transition-all duration-200 flex gap-3.5 items-start justify-between border`}
                      >
                        <div className="flex-1 flex flex-col justify-between min-h-[5.5rem]">
                          <div>
                            <h3 className="font-semibold text-base leading-snug group-hover:opacity-80 transition-opacity">
                              {produto.nome}
                            </h3>
                            {produto.descricao && (
                              <p className="text-xs opacity-70 mt-1 line-clamp-2 leading-relaxed">
                                {produto.descricao}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <span className="font-bold text-sm">
                              {formatarPreco(produto.precoBase)}
                            </span>
                            {produto.gruposOpcao && produto.gruposOpcao.length > 0 && (
                              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span>✨</span>
                                <span>Opções</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between shrink-0 self-stretch">
                          {exibirFotos && (
                            produto.imagemUrl ? (
                              <img
                                src={produto.imagemUrl}
                                alt={produto.nome}
                                className={`w-20 h-20 ${getRadiusClass()} object-cover border border-slate-100 shadow-xs`}
                              />
                            ) : (
                              <div className={`w-20 h-20 ${getRadiusClass()} bg-slate-100 dark:bg-zinc-800 border border-dashed border-slate-300 dark:border-zinc-700 flex items-center justify-center opacity-40`}>
                                🍽️
                              </div>
                            )
                          )}

                          <AddToCartButton produto={produto} corPrimaria={corPrimaria} />
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* FORMATO 2: VITRINE GRADE GOURMET */}
                {estiloCard === 'vitrine' && (
                  <div className="grid grid-cols-2 gap-3">
                    {itens.map((produto) => (
                      <article
                        key={produto.id}
                        className={`group relative ${getCardBgClasses()} ${getRadiusClass()} overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between border`}
                      >
                        {exibirFotos && (
                          produto.imagemUrl ? (
                            <img
                              src={produto.imagemUrl}
                              alt={produto.nome}
                              className="w-full h-28 object-cover"
                            />
                          ) : (
                            <div className="w-full h-28 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center opacity-40 text-2xl">
                              🍽️
                            </div>
                          )
                        )}

                        <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                          <div>
                            <h3 className="font-bold text-xs leading-snug line-clamp-1">
                              {produto.nome}
                            </h3>
                            {produto.descricao && (
                              <p className="text-[10px] opacity-70 mt-0.5 line-clamp-2">
                                {produto.descricao}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200/50 dark:border-zinc-800">
                            <span className="font-extrabold text-xs">
                              {formatarPreco(produto.precoBase)}
                            </span>
                            <AddToCartButton produto={produto} corPrimaria={corPrimaria} />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* FORMATO 3: COMPACTO CLÁSSICO */}
                {estiloCard === 'compacto' && (
                  <div className={`flex flex-col divide-y divide-slate-200 dark:divide-zinc-800 ${getCardBgClasses()} ${getRadiusClass()} px-3 shadow-xs border`}>
                    {itens.map((produto) => (
                      <article
                        key={produto.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-xs">{produto.nome}</h3>
                          {produto.descricao && (
                            <p className="text-[10px] opacity-60 line-clamp-1 mt-0.5">{produto.descricao}</p>
                          )}
                          <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                            {formatarPreco(produto.precoBase)}
                          </span>
                        </div>

                        <AddToCartButton produto={produto} corPrimaria={corPrimaria} />
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </main>
      )}

      {/* 
        ========================================================================
        RODAPÉ INFORMATIVO (SE ATIVO NO MENU STUDIO)
        ========================================================================
      */}
      {isSecaoAtiva('info_rodape', true) && (
        <footer className="max-w-md mx-auto px-6 py-8 text-center text-xs opacity-70 mt-8 border-t border-slate-200/60 dark:border-zinc-800 flex flex-col items-center gap-1.5">
          <div className="font-bold text-sm">{nomeExibicao}</div>
          <div className="text-[11px]">{sloganExibicao}</div>
          {restaurante.telefone && (
            <div className="text-[11px] font-mono">Contato: {restaurante.telefone}</div>
          )}
          <div className="text-[10px] opacity-60 mt-2">
            Cardápio Digital Oficial • SaaS Multi-Tenant Gastronômico
          </div>
        </footer>
      )}

      {/* 
        ========================================================================
        BARRA FLUTUANTE REATIVA DO CARRINHO (ZUSTAND + LOCALSTORAGE)
        ========================================================================
      */}
      <CartSummary corPrimaria={corPrimaria} />
    </div>
  );
}
