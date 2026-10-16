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

// ==============================================================================
// DADOS SIMULADOS DE FALLBACK (CASO A API BACKEND ESTEJA OFFLINE)
// ==============================================================================

const MOCK_CARDAPIOS: Record<string, ApiResponseCardapio> = {
  'pizzaria-bella': {
    sucesso: true,
    restaurante: {
      id: 'd9b1a78e-0192-4f33-8a9d-b8d96c429012',
      nome: 'Pizzaria Bella Napolitana',
      slug: 'pizzaria-bella',
      corPrimaria: '#E11D48', // Carmim / Rose vibrante
      logoUrl: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=160&auto=format&fit=crop&q=80',
      descricao: 'Autênticas pizzas artesanais fermentadas lentamente por 48 horas.',
      horarioFuncionamento: 'Ter - Dom • 18:30 às 23:30',
    },
    total: 6,
    produtos: [
      {
        id: 'p1',
        nome: 'Bruschetta Tradizionale',
        descricao: 'Pão italiano rústico tostado na lenha com tomates concassé, manjericão e azeite extravirgem.',
        precoBase: 28.5,
        imagemUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=300&auto=format&fit=crop&q=80',
        categoria: { id: 'c1', nome: 'Entradas', ordem: 1 },
      },
      {
        id: 'p2',
        nome: 'Burrata ao Pesto Cremoso',
        descricao: 'Burrata fresca sobre cama de rúcula fresca, tomatinhos confitados e pesto genovês.',
        precoBase: 44.0,
        imagemUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69107953?w=300&auto=format&fit=crop&q=80',
        categoria: { id: 'c1', nome: 'Entradas', ordem: 1 },
      },
      {
        id: 'p3',
        nome: 'Pizza Margherita D.O.P.',
        descricao: 'Molho San Marzano, mozzarella de búfala artesanal fresca e folhas de manjericão roxo.',
        precoBase: 58.9,
        imagemUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=300&auto=format&fit=crop&q=80',
        categoria: { id: 'c2', nome: 'Pizzas', ordem: 2 },
      },
      {
        id: 'p4',
        nome: 'Pizza Diavola Piccante',
        descricao: 'Molho de tomate especial, salame italiano curado levemente apimentado e azeitonas pretas.',
        precoBase: 64.0,
        imagemUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=300&auto=format&fit=crop&q=80',
        categoria: { id: 'c2', nome: 'Pizzas', ordem: 2 },
      },
      {
        id: 'p5',
        nome: 'Soda Italiana de Maçã Verde',
        descricao: 'Xarope artesanal francês Monin, água com gás gaseificada na hora e fatias de maçã.',
        precoBase: 16.0,
        imagemUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&auto=format&fit=crop&q=80',
        categoria: { id: 'c3', nome: 'Bebidas', ordem: 3 },
      },
      {
        id: 'p6',
        nome: 'Vinho Chianti Clássico (Taça)',
        descricao: 'Tinto toscano encorpado com notas de cereja madura, ideal para harmonizar com massas e pizzas.',
        precoBase: 32.0,
        imagemUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&auto=format&fit=crop&q=80',
        categoria: { id: 'c3', nome: 'Bebidas', ordem: 3 },
      },
    ],
  },
};

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

    // Se o backend retornou 404
    if (response.status === 404 && !MOCK_CARDAPIOS[slug]) {
      return null;
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

  // Busca os dados do restaurante e seus produtos na API
  const dados = await getCardapioData(restaurante_slug);

  if (!dados || !dados.restaurante) {
    notFound();
  }

  const { restaurante, produtos } = dados;
  const corPrimaria = restaurante.corPrimaria || restaurante.cor_primaria || '#E11D48';

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pb-24 selection:bg-rose-500 selection:text-white">
      {/* 
        ========================================================================
        CABEÇALHO MOBILE-FIRST DINÂMICO
        Fundo configurado com a cor_primaria vinda da API
        ========================================================================
      */}
      <header
        style={{ backgroundColor: corPrimaria }}
        className="relative text-white shadow-lg transition-colors duration-300"
      >
        {/* Camada sutil de gradiente para profundidade e contraste premium */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40 pointer-events-none" />

        <div className="relative max-w-md mx-auto px-5 pt-8 pb-6 flex flex-col gap-4">
          {/* Top Bar: Mesa / Status */}
          <div className="flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Aberto para pedidos</span>
            </div>

            {numeroMesa && (
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-semibold border border-white/20 shadow-sm">
                Mesa {numeroMesa}
              </div>
            )}
          </div>

          {/* Identificação do Restaurante */}
          <div className="flex items-center gap-3.5 mt-1">
            {restaurante.logoUrl ? (
              <img
                src={restaurante.logoUrl}
                alt={restaurante.nome}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/80 shadow-md shrink-0 bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                {restaurante.nome.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex flex-col">
              <h1 className="text-2xl font-extrabold tracking-tight leading-tight drop-shadow-sm">
                {restaurante.nome}
              </h1>
              <p className="text-xs text-white/90 line-clamp-1 mt-0.5">
                {restaurante.descricao || 'Cardápio Digital Oficial'}
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

      {/* 
        ========================================================================
        BARRA DE NAVEGAÇÃO DE CATEGORIAS (HORIZONTAL SCROLL CHIPS)
        ========================================================================
      */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none snap-x">
          {categoriasAgrupadas.map(({ categoria }, index) => (
            <a
              key={categoria.id}
              href={`#categoria-${categoria.id}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 snap-start shadow-xs ${
                index === 0
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {categoria.nome}
            </a>
          ))}
        </div>
      </nav>

      {/* 
        ========================================================================
        CORPO PRINCIPAL: SEÇÕES DE CATEGORIAS E CARDS DE PRODUTOS
        ========================================================================
      */}
      <main className="max-w-md mx-auto px-4 pt-6 flex flex-col gap-8">
        {categoriasAgrupadas.map(({ categoria, itens }) => (
          <section
            key={categoria.id}
            id={`categoria-${categoria.id}`}
            className="scroll-mt-16 flex flex-col gap-3.5"
          >
            {/* Título da Categoria */}
            <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {categoria.nome}
              </h2>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {itens.length}
              </span>
            </div>

            {/* Grid/Lista de Cards de Produtos */}
            <div className="flex flex-col gap-3">
              {itens.map((produto) => (
                <article
                  key={produto.id}
                  className="group relative bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex gap-3.5 items-start justify-between"
                >
                  {/* Dados textuais do produto (Nome, Descrição curta e Preço) */}
                  <div className="flex-1 flex flex-col justify-between min-h-[5.5rem]">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-base leading-snug group-hover:text-slate-700 transition-colors">
                        {produto.nome}
                      </h3>
                      {produto.descricao && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {produto.descricao}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {formatarPreco(produto.precoBase)}
                      </span>
                    </div>
                  </div>

                  {/* Foto do produto (se houver) ou Ação Rápida */}
                  <div className="flex flex-col items-end justify-between shrink-0 self-stretch">
                    {produto.imagemUrl ? (
                      <img
                        src={produto.imagemUrl}
                        alt={produto.nome}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-100 shadow-xs"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-100 border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Botão de Adicionar / Selecionar Integrado com Zustand */}
                    <AddToCartButton produto={produto} corPrimaria={corPrimaria} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* 
        ========================================================================
        BARRA FLUTUANTE REATIVA DO CARRINHO (ZUSTAND + LOCALSTORAGE)
        ========================================================================
      */}
      <CartSummary corPrimaria={corPrimaria} />
    </div>
  );
}
