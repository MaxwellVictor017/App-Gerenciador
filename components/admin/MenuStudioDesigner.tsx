'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export interface SecaoCardapio {
  id: string;
  titulo: string;
  ativo: boolean;
  ordem: number;
  icone?: string;
  descricao?: string;
}

export interface DesignConfigData {
  corPrimaria: string;
  corSecundaria: string;
  corFundo: 'claro' | 'escuro' | 'creme' | 'slate';
  estiloHeader: 'gradiente' | 'banner' | 'solido' | 'minimalista';
  bannerUrl: string | null;
  logoUrl: string | null;
  nomeRestaurante: string;
  slogan: string;
  estiloCard: 'moderno' | 'vitrine' | 'compacto';
  arredondamento: 'suave' | 'moderno' | 'pill';
  exibirFotos: boolean;
  fonteFamilia: 'Inter' | 'Playfair' | 'Montserrat' | 'Poppins';
  secoes: SecaoCardapio[];
  iconesCategorias: Record<string, string>;
}

// 8 Paletas Gastronômicas Profissionais Prontas
const PALETAS_PRESET = [
  { nome: 'Ruby Gourmet', primaria: '#E11D48', secundaria: '#FB7185', fundo: 'claro', tag: 'Pizzaria / Carnes' },
  { nome: 'Pizzaria Napolitana', primaria: '#DC2626', secundaria: '#F87171', fundo: 'claro', tag: 'Tradicional' },
  { nome: 'Smash Burger & Fries', primaria: '#EA580C', secundaria: '#FDBA74', fundo: 'claro', tag: 'Hamburgueria' },
  { nome: 'Trattoria & Bistro', primaria: '#0F766E', secundaria: '#5EEAD4', fundo: 'claro', tag: 'Italiano / Parrilla' },
  { nome: 'Boteco & Cervejaria', primaria: '#D97706', secundaria: '#FDE68A', fundo: 'claro', tag: 'Petiscos / Bar' },
  { nome: 'Sushi Zen Luxury', primaria: '#D97706', secundaria: '#F59E0B', fundo: 'escuro', tag: 'Oriental Dark' },
  { nome: 'Café & Bakery Warm', primaria: '#854D0E', secundaria: '#FDE047', fundo: 'creme', tag: 'Cafeteria' },
  { nome: 'Cyber Neon Midnight', primaria: '#6366F1', secundaria: '#A5B4FC', fundo: 'escuro', tag: 'Pub Moderno' },
];

// Galeria de Banners Culinários em Alta Definição
const BANNERS_PRESET = [
  { titulo: 'Parrilla & Fogo', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80' },
  { titulo: 'Forno a Lenha & Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80' },
  { titulo: 'Hambúrguer na Brasa', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80' },
  { titulo: 'Bistrô & Ambiente Acolhedor', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80' },
];

// Ícones Gastronômicos para Categorias
const ICONES_GASTRONOMICOS = [
  '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🍣', '🍜', '🥩', '🍗',
  '🥗', '🍝', '🥐', '☕', '🍺', '🍷', '🍹', '🍰', '🍨', '🍩',
  '🔥', '⭐', '🏷️', '🧀', '🦐', '🥟', '🍳', '🍫'
];

interface MenuStudioDesignerProps {
  restaurante_slug: string;
  restauranteInfo?: any;
}

export function MenuStudioDesigner({ restaurante_slug, restauranteInfo }: MenuStudioDesignerProps) {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Estados de Configuração
  const [design, setDesign] = useState<DesignConfigData>({
    corPrimaria: restauranteInfo?.corPrimaria || '#E11D48',
    corSecundaria: '#FB7185',
    corFundo: 'claro',
    estiloHeader: 'gradiente',
    bannerUrl: BANNERS_PRESET[3].url,
    logoUrl: restauranteInfo?.logoUrl || null,
    nomeRestaurante: restauranteInfo?.nome || restaurante_slug.replace(/-/g, ' ').toUpperCase(),
    slogan: restauranteInfo?.descricao || 'Cardápio Digital Oficial',
    estiloCard: 'moderno',
    arredondamento: 'moderno',
    exibirFotos: true,
    fonteFamilia: 'Inter',
    secoes: [
      { id: 'header_topo', titulo: 'Cabeçalho e Identidade', ativo: true, ordem: 1, icone: '🏷️', descricao: 'Logo, nome e status de funcionamento' },
      { id: 'busca_produtos', titulo: 'Barra de Pesquisa Rápida', ativo: true, ordem: 2, icone: '🔍', descricao: 'Campo de pesquisa de pratos' },
      { id: 'destaques', titulo: 'Carrossel de Mais Vendidos', ativo: true, ordem: 3, icone: '🔥', descricao: 'Destaques e recomendações do Chef' },
      { id: 'categorias_chips', titulo: 'Navegação de Categorias', ativo: true, ordem: 4, icone: '📑', descricao: 'Chips horizontais fixados no topo' },
      { id: 'lista_produtos', titulo: 'Catálogo de Produtos', ativo: true, ordem: 5, icone: '🍽️', descricao: 'Grade de pratos agrupados' },
      { id: 'info_rodape', titulo: 'Rodapé & Informações', ativo: true, ordem: 6, icone: '📍', descricao: 'Endereço, contatos e redes sociais' },
    ],
    iconesCategorias: {
      'Pizzas': '🍕',
      'Burgers': '🍔',
      'Smash Burgers': '🍔',
      'Bebidas': '🍷',
      'Entradas': '🥗',
      'Sobremesas': '🍰',
      'Pratos Principais': '🥩',
      'Massas': '🍝',
      'Cafés': '☕',
    },
  });

  const [categoriasBanco, setCategoriasBanco] = useState<string[]>([]);
  const [subAbaEditor, setSubAbaEditor] = useState<'cores' | 'identidade' | 'cards' | 'secoes' | 'icones'>('cores');
  const [dispositivoPreview, setDispositivoPreview] = useState<'mobile' | 'desktop'>('mobile');
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [categoriaSelecionadaIcone, setCategoriaSelecionadaIcone] = useState<string | null>(null);

  // Drag and Drop de Seções
  const [arrastandoIndice, setArrastandoIndice] = useState<number | null>(null);
  const fileInputLogoRef = useRef<HTMLInputElement>(null);
  const fileInputBannerRef = useRef<HTMLInputElement>(null);

  // Busca dados de design da API ao carregar
  useEffect(() => {
    async function carregarDesign() {
      try {
        const res = await fetch(`${backendBaseUrl}/api/${restaurante_slug}/design?_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.sucesso && data.design) {
            setDesign(data.design);
          }
          if (Array.isArray(data.categoriasDisponiveis)) {
            setCategoriasBanco(data.categoriasDisponiveis);
            if (data.categoriasDisponiveis.length > 0) {
              setCategoriaSelecionadaIcone(data.categoriasDisponiveis[0]);
            }
          }
        }
      } catch (_e) {
        console.warn('Erro ao carregar design:', _e);
      }
    }
    carregarDesign();
  }, [backendBaseUrl, restaurante_slug]);

  // Salvar no Neon PostgreSQL
  const handleSalvar = async () => {
    setSalvando(true);
    setMensagemSucesso(null);
    try {
      const res = await fetch(`${backendBaseUrl}/api/${restaurante_slug}/design`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(design),
      });

      if (res.ok) {
        setMensagemSucesso('🎉 Design salvo com sucesso no Neon PostgreSQL!');
        setTimeout(() => setMensagemSucesso(null), 4000);
      } else {
        alert('Erro ao salvar configurações de design.');
      }
    } catch (_err) {
      alert('Falha de conexão com a API.');
    } finally {
      setSalvando(false);
    }
  };

  // Upload de Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDesign((prev) => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Upload de Banner
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDesign((prev) => ({ ...prev, bannerUrl: reader.result as string, estiloHeader: 'banner' }));
    };
    reader.readAsDataURL(file);
  };

  // Alterna ativação de uma seção
  const toggleSecao = (id: string) => {
    setDesign((prev) => ({
      ...prev,
      secoes: prev.secoes.map((s) => (s.id === id ? { ...s, ativo: !s.ativo } : s)),
    }));
  };

  // Mover seção para cima ou para baixo
  const moverSecao = (index: number, direcao: 'cima' | 'baixo') => {
    const novoIndice = direcao === 'cima' ? index - 1 : index + 1;
    if (novoIndice < 0 || novoIndice >= design.secoes.length) return;

    const novasSecoes = [...design.secoes];
    const [removido] = novasSecoes.splice(index, 1);
    novasSecoes.splice(novoIndice, 0, removido);

    setDesign((prev) => ({
      ...prev,
      secoes: novasSecoes.map((s, idx) => ({ ...s, ordem: idx + 1 })),
    }));
  };

  // Atribui ícone à categoria
  const atribuirIconeCategoria = (categoria: string, icone: string) => {
    setDesign((prev) => ({
      ...prev,
      iconesCategorias: {
        ...prev.iconesCategorias,
        [categoria]: icone,
      },
    }));
  };

  // Determina classes de fundo do simulador
  const getFundoSimulador = () => {
    switch (design.corFundo) {
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

  const getBorderRadius = () => {
    switch (design.arredondamento) {
      case 'suave':
        return 'rounded-lg';
      case 'pill':
        return 'rounded-3xl';
      case 'moderno':
      default:
        return 'rounded-2xl';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Toast de Sucesso */}
      {mensagemSucesso && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold text-xs px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-in slide-in-from-top-3">
          <span>✓</span>
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Barra de Ferramentas Superior do Studio */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg border border-white/20"
            style={{ backgroundColor: design.corPrimaria }}
          >
            🎨
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              Menu Studio • Construtor Visual No-Code
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono">
                Ao Vivo
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Personalize cores, logos, estilo de cards e arraste seções com preview instantâneo.
            </p>
          </div>
        </div>

        {/* Controles de Dispositivo & Ações */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Alternador Mobile / Desktop */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setDispositivoPreview('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                dispositivoPreview === 'mobile'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📱</span>
              <span>Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setDispositivoPreview('desktop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                dispositivoPreview === 'desktop'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>💻</span>
              <span>Desktop</span>
            </button>
          </div>

          <Link
            href={`/${restaurante_slug}`}
            target="_blank"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            title="Abrir página pública do cardápio"
          >
            <span>🔗</span>
            <span>Ver Cardápio Real</span>
          </Link>

          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-lg border border-emerald-400/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {salvando ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Principal: Painel de Edição (Esquerda) vs Simulador Live (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================================================================== */}
        {/* COLUNA ESQUERDA: CONTROLES NO-CODE (5 COLUNAS) */}
        {/* ==================================================================== */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-5">
          {/* Abas Internas de Customização */}
          <div className="flex gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setSubAbaEditor('cores')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                subAbaEditor === 'cores'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🎨</span>
              <span>Cores & Tema</span>
            </button>

            <button
              type="button"
              onClick={() => setSubAbaEditor('identidade')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                subAbaEditor === 'identidade'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏷️</span>
              <span>Identidade</span>
            </button>

            <button
              type="button"
              onClick={() => setSubAbaEditor('cards')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                subAbaEditor === 'cards'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📐</span>
              <span>Estilo dos Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setSubAbaEditor('secoes')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                subAbaEditor === 'secoes'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⠿</span>
              <span>Blocos & Seções</span>
            </button>

            <button
              type="button"
              onClick={() => setSubAbaEditor('icones')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                subAbaEditor === 'icones'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🍕</span>
              <span>Ícones</span>
            </button>
          </div>

          {/* CONTEÚDO SUB-ABA: CORES & TEMA */}
          {subAbaEditor === 'cores' && (
            <div className="flex flex-col gap-5">
              {/* Presets Gastronômicos Rápidos */}
              <div>
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">
                  Paletas Gastronômicas Rápidas (1 Clique)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PALETAS_PRESET.map((p) => (
                    <button
                      key={p.nome}
                      type="button"
                      onClick={() =>
                        setDesign((prev) => ({
                          ...prev,
                          corPrimaria: p.primaria,
                          corSecundaria: p.secundaria,
                          corFundo: p.fundo as any,
                        }))
                      }
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        design.corPrimaria === p.primaria && design.corFundo === p.fundo
                          ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/20'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full border border-white/40 shadow-xs" style={{ backgroundColor: p.primaria }} />
                        <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: p.secundaria }} />
                      </div>
                      <span className="text-[11px] font-bold text-white line-clamp-1">{p.nome}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">{p.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seletor de Cores Livres */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Cor Primária (Header, Botões)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.corPrimaria}
                      onChange={(e) => setDesign({ ...design, corPrimaria: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={design.corPrimaria}
                      onChange={(e) => setDesign({ ...design, corPrimaria: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Cor Secundária (Acentos, Badges)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.corSecundaria}
                      onChange={(e) => setDesign({ ...design, corSecundaria: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={design.corSecundaria}
                      onChange={(e) => setDesign({ ...design, corSecundaria: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tema de Fundo do Cardápio */}
              <div>
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">
                  Atmosfera & Fundo do Cardápio
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'claro', titulo: '☀️ Claro Clean', bg: 'bg-white text-slate-900', desc: 'Fundo clássico' },
                    { id: 'escuro', titulo: '🌙 Dark Luxury', bg: 'bg-zinc-950 text-white border border-zinc-700', desc: 'Modo noturno fino' },
                    { id: 'creme', titulo: '📜 Creme Papel', bg: 'bg-[#FAF6F0] text-[#292524]', desc: 'Vintage & acolhedor' },
                    { id: 'slate', titulo: '🌌 Deep Slate', bg: 'bg-slate-900 text-slate-100', desc: 'Moderno high-tech' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDesign({ ...design, corFundo: t.id as any })}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        design.corFundo === t.id
                          ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/20'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl shadow-xs flex items-center justify-center font-bold text-xs ${t.bg}`}>
                        Aa
                      </div>
                      <span className="text-xs font-bold text-white mt-1">{t.titulo}</span>
                      <span className="text-[10px] text-slate-400">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estilo do Cabeçalho */}
              <div>
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">
                  Estilo do Cabeçalho
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gradiente', titulo: 'Degradê & Sombra', desc: 'Camada suave sobre a cor primária' },
                    { id: 'banner', titulo: 'Foto de Capa com Overlay', desc: 'Banner gastronômico em destaque' },
                    { id: 'solido', titulo: 'Sólido Minimalista', desc: 'Cor pura sem gradientes' },
                    { id: 'minimalista', titulo: 'Clean Branco', desc: 'Visual leve com borda sutil' },
                  ].map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setDesign({ ...design, estiloHeader: e.id as any })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        design.estiloHeader === e.id
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{e.titulo}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{e.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO SUB-ABA: IDENTIDADE DA MARCA */}
          {subAbaEditor === 'identidade' && (
            <div className="flex flex-col gap-5">
              {/* Logo do Restaurante */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Logotipo Oficial</span>
                  {design.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setDesign({ ...design, logoUrl: null })}
                      className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer underline"
                    >
                      Remover Logo
                    </button>
                  )}
                </label>

                <div className="flex items-center gap-4">
                  {design.logoUrl ? (
                    <img
                      src={design.logoUrl}
                      alt="Logo"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md bg-white shrink-0"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md shrink-0 border-2 border-white/20"
                      style={{ backgroundColor: design.corPrimaria }}
                    >
                      {design.nomeRestaurante.charAt(0) || 'R'}
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="file"
                      ref={fileInputLogoRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputLogoRef.current?.click()}
                      className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>📁</span>
                      <span>Enviar Imagem do Logo</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Ou cole a URL da imagem aqui..."
                      value={design.logoUrl || ''}
                      onChange={(e) => setDesign({ ...design, logoUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Imagem de Capa / Banner do Topo */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                  Foto de Capa / Banner Superior
                </label>

                {design.bannerUrl && (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
                    <img src={design.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
                        Banner Ativo
                      </span>
                    </div>
                  </div>
                )}

                {/* Galeria de Fotos Prontas */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                    Sugestões Culinárias em Alta Resolução:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {BANNERS_PRESET.map((b) => (
                      <button
                        key={b.titulo}
                        type="button"
                        onClick={() =>
                          setDesign((prev) => ({
                            ...prev,
                            bannerUrl: b.url,
                            estiloHeader: 'banner',
                          }))
                        }
                        className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          design.bannerUrl === b.url
                            ? 'border-amber-400 bg-amber-500/10'
                            : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <img src={b.url} alt={b.titulo} className="w-10 h-10 rounded-lg object-cover" />
                        <span className="text-[11px] font-bold text-white line-clamp-1">{b.titulo}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputBannerRef}
                  onChange={handleBannerUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputBannerRef.current?.click()}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <span>📷</span>
                  <span>Fazer Upload de Capa Própria</span>
                </button>
              </div>

              {/* Textos de Apresentação */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nome do Estabelecimento
                  </label>
                  <input
                    type="text"
                    value={design.nomeRestaurante}
                    onChange={(e) => setDesign({ ...design, nomeRestaurante: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Slogan ou Descrição Rápida
                  </label>
                  <input
                    type="text"
                    value={design.slogan}
                    onChange={(e) => setDesign({ ...design, slogan: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO SUB-ABA: ESTILO DOS CARDS & FORMAS */}
          {subAbaEditor === 'cards' && (
            <div className="flex flex-col gap-5">
              {/* Formato dos Cards */}
              <div>
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">
                  Formato de Apresentação dos Pratos
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'moderno',
                      titulo: 'Moderno Horizontal',
                      icone: '🍱',
                      desc: 'Foto à direita, preço e texto à esquerda (estilo iFood)',
                    },
                    {
                      id: 'vitrine',
                      titulo: 'Vitrine Grade',
                      icone: '🖼️',
                      desc: 'Foto grande no topo com aspecto gourmet (estilo vitrine)',
                    },
                    {
                      id: 'compacto',
                      titulo: 'Compacto Clássico',
                      icone: '📄',
                      desc: 'Linhas minimalistas para cardápios com muitos itens',
                    },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setDesign({ ...design, estiloCard: c.id as any })}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        design.estiloCard === c.id
                          ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/20'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-2xl">{c.icone}</span>
                      <span className="text-xs font-bold text-white">{c.titulo}</span>
                      <span className="text-[10px] text-slate-400 leading-tight">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cantos Arredondados */}
              <div>
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">
                  Curvatura dos Cantos (Bordas)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'suave', titulo: 'Suave (8px)', classe: 'rounded-lg' },
                    { id: 'moderno', titulo: 'Moderno (16px)', classe: 'rounded-2xl' },
                    { id: 'pill', titulo: 'Arredondado (24px)', classe: 'rounded-3xl' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setDesign({ ...design, arredondamento: r.id as any })}
                      className={`p-3 border text-center transition-all cursor-pointer ${r.classe} ${
                        design.arredondamento === r.id
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold text-white">{r.titulo}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipografia */}
              <div>
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-2">
                  Tipografia do Cardápio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Inter', titulo: 'Inter Clean', desc: 'Legibilidade máxima e moderna' },
                    { id: 'Playfair', titulo: 'Playfair Gourmet', desc: 'Elegância refinada para restaurantes' },
                    { id: 'Montserrat', titulo: 'Montserrat Bold', desc: 'Visual forte e marcante' },
                    { id: 'Poppins', titulo: 'Poppins Tech', desc: 'Geométrica e amigável' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDesign({ ...design, fonteFamilia: f.id as any })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        design.fonteFamilia === f.id
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{f.titulo}</div>
                      <div className="text-[10px] text-slate-400">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fotos dos Itens */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Exibir Fotos nos Pratos</div>
                  <div className="text-[10px] text-slate-400">
                    Oculta as imagens para um cardápio puramente textual de leitura ultra rápida
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDesign({ ...design, exibirFotos: !design.exibirFotos })}
                  className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer flex items-center ${
                    design.exibirFotos ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          )}

          {/* CONTEÚDO SUB-ABA: BLOCOS ARRASTÁVEIS */}
          {subAbaEditor === 'secoes' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                    Organização das Seções na Tela
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Arraste ou use as setas para reordenar os blocos. Desative o que não quiser exibir.
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {design.secoes.map((secao, idx) => (
                  <div
                    key={secao.id}
                    draggable
                    onDragStart={() => setArrastandoIndice(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (arrastandoIndice === null || arrastandoIndice === idx) return;
                      const novas = [...design.secoes];
                      const [removido] = novas.splice(arrastandoIndice, 1);
                      novas.splice(idx, 0, removido);
                      setDesign({
                        ...design,
                        secoes: novas.map((s, i) => ({ ...s, ordem: i + 1 })),
                      });
                      setArrastandoIndice(null);
                    }}
                    className={`p-3 bg-slate-950 border rounded-2xl flex items-center justify-between gap-3 transition-all cursor-grab active:cursor-grabbing ${
                      secao.ativo ? 'border-slate-800' : 'border-slate-800/40 opacity-60'
                    } ${arrastandoIndice === idx ? 'border-amber-400 bg-amber-500/10' : 'hover:border-slate-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 hover:text-slate-300 text-sm select-none">
                        ⠿
                      </span>
                      <span className="text-lg">{secao.icone || '📦'}</span>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{secao.titulo}</span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                            #{idx + 1}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{secao.descricao}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Botões de Mover */}
                      <button
                        type="button"
                        onClick={() => moverSecao(idx, 'cima')}
                        disabled={idx === 0}
                        className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center justify-center cursor-pointer"
                        title="Subir bloco"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moverSecao(idx, 'baixo')}
                        disabled={idx === design.secoes.length - 1}
                        className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center justify-center cursor-pointer"
                        title="Descer bloco"
                      >
                        ▼
                      </button>

                      {/* Toggle On/Off */}
                      <button
                        type="button"
                        onClick={() => toggleSecao(secao.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          secao.ativo
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {secao.ativo ? 'Visível' : 'Oculto'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTEÚDO SUB-ABA: ÍCONES DAS CATEGORIAS */}
          {subAbaEditor === 'icones' && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block mb-1">
                  Ícones Gastronômicos das Categorias
                </label>
                <p className="text-[11px] text-slate-400">
                  Selecione uma categoria abaixo e clique em um dos ícones para personalizá-la.
                </p>
              </div>

              {/* Lista de Categorias Cadastradas */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-400">Suas Categorias:</span>
                <div className="flex flex-wrap gap-2">
                  {(categoriasBanco.length > 0 ? categoriasBanco : ['Pizzas', 'Burgers', 'Entradas', 'Bebidas', 'Sobremesas']).map((cat) => {
                    const iconeAtual = design.iconesCategorias[cat] || '🍽️';
                    const selecionada = categoriaSelecionadaIcone === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoriaSelecionadaIcone(cat)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                          selecionada
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                            : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-base">{iconeAtual}</span>
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Paleta de Ícones Clicáveis */}
              {categoriaSelecionadaIcone && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>
                      Escolha o ícone para: <strong className="text-amber-400">{categoriaSelecionadaIcone}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => atribuirIconeCategoria(categoriaSelecionadaIcone, '🍽️')}
                      className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Padrão
                    </button>
                  </div>

                  <div className="grid grid-cols-7 sm:grid-cols-9 gap-2">
                    {ICONES_GASTRONOMICOS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => atribuirIconeCategoria(categoriaSelecionadaIcone, emoji)}
                        className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-400 text-xl flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-sm"
                        title={`Usar ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* COLUNA DIREITA: LIVE SIMULATOR EM TEMPO REAL (6 COLUNAS) */}
        {/* ==================================================================== */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center sticky top-20">
          <div className="text-center mb-3">
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Simulador em Tempo Real
            </span>
            <span className="text-[11px] text-slate-500">
              {dispositivoPreview === 'mobile' ? 'Visualização Mobile Smartphone' : 'Visualização Desktop / Web'}
            </span>
          </div>

          {/* MOLDURA DO SMARTPHONE (DEVICE FRAME) */}
          <div
            className={`transition-all duration-300 shadow-2xl overflow-hidden border-8 border-slate-800 ${
              dispositivoPreview === 'mobile'
                ? 'w-full max-w-[390px] h-[680px] rounded-[48px] ring-1 ring-white/10'
                : 'w-full max-w-[620px] h-[680px] rounded-3xl ring-1 ring-white/10'
            } flex flex-col ${getFundoSimulador()}`}
          >
            {/* Barra Superior / Notch do Smartphone (Apenas modo Mobile) */}
            {dispositivoPreview === 'mobile' && (
              <div className="bg-black/90 px-6 pt-3 pb-2 flex items-center justify-between text-[11px] text-white/90 select-none shrink-0 z-30">
                <span className="font-bold">12:30</span>
                <div className="w-20 h-4 bg-black rounded-full border border-white/10" />
                <div className="flex items-center gap-1 text-[10px]">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* ÁREA DE SCROLL DO CARDÁPIO SIMULADO */}
            <div className="flex-1 overflow-y-auto scrollbar-none relative pb-16">
              {/* BLOCO: CABEÇALHO & IDENTIDADE */}
              {design.secoes.find((s) => s.id === 'header_topo')?.ativo && (
                <header
                  style={{ backgroundColor: design.corPrimaria }}
                  className="relative text-white transition-colors duration-300 shadow-md"
                >
                  {/* Foto de Banner se estilo for banner */}
                  {design.estiloHeader === 'banner' && design.bannerUrl && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <img src={design.bannerUrl} alt="Capa" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
                    </div>
                  )}

                  {/* Gradiente profundo se estilo for gradiente */}
                  {design.estiloHeader === 'gradiente' && (
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45 pointer-events-none" />
                  )}

                  <div className="relative px-5 pt-6 pb-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <div className="flex items-center gap-1.5 bg-black/35 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Aberto para pedidos</span>
                      </div>
                      <div className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                        Mesa 05
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {design.logoUrl ? (
                        <img
                          src={design.logoUrl}
                          alt="Logo"
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-white/80 shadow-md bg-white shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-xl font-black shadow-md shrink-0">
                          {design.nomeRestaurante.charAt(0) || 'R'}
                        </div>
                      )}

                      <div>
                        <h1 className="text-xl font-extrabold leading-tight drop-shadow-xs">
                          {design.nomeRestaurante || 'Nome do Estabelecimento'}
                        </h1>
                        <p className="text-[11px] text-white/90 line-clamp-1 mt-0.5">
                          {design.slogan || 'Cardápio Digital Oficial'}
                        </p>
                      </div>
                    </div>
                  </div>
                </header>
              )}

              {/* BLOCO: BARRA DE PESQUISA */}
              {design.secoes.find((s) => s.id === 'busca_produtos')?.ativo && (
                <div className="px-4 py-2.5">
                  <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-slate-200 dark:border-zinc-700 rounded-full px-3.5 py-2 flex items-center gap-2 shadow-xs">
                    <span className="text-xs opacity-60">🔍</span>
                    <input
                      type="text"
                      placeholder="Pesquisar prato, bebida ou sobremesa..."
                      className="w-full bg-transparent text-xs outline-none"
                    />
                  </div>
                </div>
              )}

              {/* BLOCO: CHIPS DE CATEGORIAS */}
              {design.secoes.find((s) => s.id === 'categorias_chips')?.ativo && (
                <div className="px-4 py-2 flex gap-1.5 overflow-x-auto scrollbar-none sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md z-10 border-b border-slate-200/50 dark:border-zinc-800">
                  {['Pizzas', 'Burgers', 'Entradas', 'Bebidas', 'Sobremesas'].map((cat, i) => (
                    <button
                      key={cat}
                      type="button"
                      className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs ${
                        i === 0
                          ? 'text-white shadow-xs'
                          : 'bg-slate-200/60 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                      style={i === 0 ? { backgroundColor: design.corPrimaria } : {}}
                    >
                      <span>{design.iconesCategorias[cat] || '🍽️'}</span>
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* BLOCO: DESTAQUES MAIS VENDIDOS */}
              {design.secoes.find((s) => s.id === 'destaques')?.ativo && (
                <div className="px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                    <span>🔥</span>
                    <span>Mais Pedidos da Casa</span>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto scrollbar-none">
                    {[
                      { nome: 'Pizza Especial da Casa', preco: 'R$ 68,90', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300' },
                      { nome: 'Smash Duplo Cheddar', preco: 'R$ 38,90', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300' },
                      { nome: 'Bife Ancho Prime', preco: 'R$ 89,90', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300' },
                    ].map((item) => (
                      <div
                        key={item.nome}
                        className={`shrink-0 w-36 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 ${getBorderRadius()} overflow-hidden shadow-xs flex flex-col`}
                      >
                        <img src={item.img} alt={item.nome} className="w-full h-20 object-cover" />
                        <div className="p-2 flex flex-col justify-between flex-1">
                          <span className="text-[11px] font-bold line-clamp-1">{item.nome}</span>
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                            {item.preco}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOCO: LISTAGEM DE PRODUTOS COM ESTILOS DE CARDS SELECIONADOS */}
              {design.secoes.find((s) => s.id === 'lista_produtos')?.ativo && (
                <div className="px-4 py-2 flex flex-col gap-3">
                  <div className="text-xs font-black uppercase tracking-wider">
                    <span>🍕 Pizzas Artesanais</span>
                  </div>

                  {/* FORMATO MODERNO HORIZONTAL */}
                  {design.estiloCard === 'moderno' && (
                    <div className="flex flex-col gap-2.5">
                      {[
                        { nome: 'Margherita D.O.P.', desc: 'Molho artesanal San Marzano, mozzarella de búfala e manjericão fresco.', preco: 'R$ 58,90', img: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=300' },
                        { nome: 'Quatro Queijos Especial', desc: 'Gorgonzola, fontina alpina, provolone e fior di latte artesanal.', preco: 'R$ 68,90', img: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=300' },
                      ].map((p) => (
                        <div
                          key={p.nome}
                          className={`bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 ${getBorderRadius()} p-3 shadow-xs flex items-center justify-between gap-3`}
                        >
                          <div className="flex-1">
                            <h3 className="text-xs font-bold leading-snug">{p.nome}</h3>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                              {p.desc}
                            </p>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                              {p.preco}
                            </span>
                          </div>

                          {design.exibirFotos && (
                            <img
                              src={p.img}
                              alt={p.nome}
                              className={`w-20 h-20 object-cover ${getBorderRadius()} shrink-0 shadow-xs`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FORMATO VITRINE GRADE */}
                  {design.estiloCard === 'vitrine' && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { nome: 'Margherita D.O.P.', preco: 'R$ 58,90', img: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=300' },
                        { nome: 'Quatro Queijos', preco: 'R$ 68,90', img: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=300' },
                      ].map((p) => (
                        <div
                          key={p.nome}
                          className={`bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 ${getBorderRadius()} overflow-hidden shadow-xs flex flex-col`}
                        >
                          {design.exibirFotos && (
                            <img src={p.img} alt={p.nome} className="w-full h-24 object-cover" />
                          )}
                          <div className="p-2.5 flex flex-col justify-between flex-1">
                            <h3 className="text-xs font-bold leading-tight line-clamp-1">{p.nome}</h3>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">
                              {p.preco}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FORMATO COMPACTO CLÁSSICO */}
                  {design.estiloCard === 'compacto' && (
                    <div className="flex flex-col divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl px-3 shadow-xs">
                      {[
                        { nome: 'Margherita D.O.P.', preco: 'R$ 58,90' },
                        { nome: 'Quatro Queijos Especial', preco: 'R$ 68,90' },
                      ].map((p) => (
                        <div key={p.nome} className="py-2.5 flex items-center justify-between">
                          <span className="text-xs font-bold">{p.nome}</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {p.preco}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* BLOCO: RODAPÉ */}
              {design.secoes.find((s) => s.id === 'info_rodape')?.ativo && (
                <div className="px-5 py-6 text-center text-[10px] text-slate-500 dark:text-zinc-500 border-t border-slate-200/60 dark:border-zinc-800 mt-4 flex flex-col items-center gap-1">
                  <div className="font-bold text-slate-700 dark:text-zinc-300">
                    {design.nomeRestaurante || 'Restaurante'}
                  </div>
                  <div>Atendimento na Mesa e Delivery Oficial</div>
                  <div className="text-[9px] opacity-70">Powered by SaaS Gerenciador Gastronômico</div>
                </div>
              )}
            </div>

            {/* BARRA FIXA FLUTUANTE DE CARRINHO SIMULADA */}
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between text-xs font-bold shadow-lg shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black" style={{ backgroundColor: design.corPrimaria }}>
                  2
                </span>
                <span>R$ 97,80</span>
              </div>
              <button
                type="button"
                className="px-4 py-1.5 rounded-full text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
                style={{ backgroundColor: design.corPrimaria }}
              >
                Ver Carrinho &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
