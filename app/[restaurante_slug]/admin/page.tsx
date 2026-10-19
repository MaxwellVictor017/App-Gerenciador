'use client';

import React, { use, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { MenuStudioDesigner } from '@/components/admin/MenuStudioDesigner';

interface PageProps {
  params: Promise<{ restaurante_slug: string }> | { restaurante_slug: string };
}

// ==============================================================================
// TIPAGENS DO ADMIN
// ==============================================================================

interface Categoria {
  id: string;
  nome: string;
  ordem?: number;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string | null;
  precoBase: number | string;
  imagemUrl?: string | null;
  disponivel: boolean;
  destaque?: boolean;
  categoria: Categoria;
  categoriaId?: string;
}

interface Funcionario {
  id: string;
  nome: string;
  cargo: 'GERENTE' | 'GARCOM' | 'COZINHEIRO' | 'CAIXA' | 'ATENDENTE' | 'ENTREGADOR';
  email?: string | null;
  telefone?: string | null;
  ativo: boolean;
  criadoEm: string;
}

interface ItemPedidoOpcional {
  id: string;
  nome: string;
  preco: number | string;
}

interface ItemPedido {
  id: string;
  nome?: string;
  nomeProduto?: string;
  quantidade: number;
  precoUnitario: number | string;
  subtotal: number | string;
  adicionais?: ItemPedidoOpcional[];
}

interface Pedido {
  id: string;
  codigo: string;
  tipo?: string;
  tipoPedido?: string;
  status: 'RECEBIDO' | 'EM_PREPARO' | 'PRONTO_ENTREGA' | 'FINALIZADO' | 'CANCELADO';
  statusPagamento?: 'PENDENTE' | 'PAGO' | 'REEMBOLSADO' | 'FALHOU';
  metodoPagamento?: string;
  numeroMesa?: string | null;
  nomeCliente?: string | null;
  clienteNome?: string | null;
  clienteTelefone?: string | null;
  cep?: string | null;
  rua?: string | null;
  numeroEndereco?: string | null;
  bairro?: string | null;
  total: number | string;
  criadoEm: string;
  itens: ItemPedido[];
}

function formatarMoeda(valor: number | string): string {
  const num = typeof valor === 'string' ? parseFloat(valor) : Number(valor) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

function formatarHora(dataIso: string): string {
  try {
    const d = new Date(dataIso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

function formatarTelefoneAdmin(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7, 11)}`;
}

export default function RestauranteAdminPage({ params }: PageProps) {
  const resolvedParams =
    typeof (params as any)?.then === 'function'
      ? use(params as Promise<{ restaurante_slug: string }>)
      : (params as { restaurante_slug: string });
  const { restaurante_slug } = resolvedParams;

  const [abaAtiva, setAbaAtiva] = useState<'produtos' | 'funcionarios' | 'kds' | 'metricas' | 'design'>('produtos');
  const [subAbaKds, setSubAbaKds] = useState<'cozinha' | 'aguardando_pagamento'>('cozinha');
  const [restauranteInfo, setRestauranteInfo] = useState<any>(null);

  // Estados de Produtos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [prodNome, setProdNome] = useState('');
  const [prodPreco, setProdPreco] = useState('');
  const [prodDescricao, setProdDescricao] = useState('');
  const [prodImagemUrl, setProdImagemUrl] = useState('');
  const [modoImagem, setModoImagem] = useState<'upload' | 'url'>('upload');
  const [carregandoImagem, setCarregandoImagem] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prodCategoriaNome, setProdCategoriaNome] = useState('');
  const [modoNovaCategoria, setModoNovaCategoria] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [prodDestaque, setProdDestaque] = useState(false);
  const [prodDisponivel, setProdDisponivel] = useState(true);
  const [salvandoProduto, setSalvandoProduto] = useState(false);

  // Estados de Funcionários
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [modalFuncionarioAberto, setModalFuncionarioAberto] = useState(false);
  const [funcEditando, setFuncEditando] = useState<Funcionario | null>(null);
  const [funcNome, setFuncNome] = useState('');
  const [funcCargo, setFuncCargo] = useState<'GERENTE' | 'GARCOM' | 'COZINHEIRO' | 'CAIXA' | 'ATENDENTE' | 'ENTREGADOR'>('ATENDENTE');
  const [funcEmail, setFuncEmail] = useState('');
  const [funcTelefone, setFuncTelefone] = useState('');
  const [funcAtivo, setFuncAtivo] = useState(true);
  const [salvandoFuncionario, setSalvandoFuncionario] = useState(false);

  // Estados de Pedidos (KDS)
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [mensagemFeedback, setMensagemFeedback] = useState<string | null>(null);

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const exibirFeedback = (msg: string) => {
    setMensagemFeedback(msg);
    setTimeout(() => setMensagemFeedback(null), 3500);
  };

  // Carrega categorias cadastradas no banco de dados para este restaurante
  const carregarCategorias = useCallback(async () => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/${restaurante_slug}/produtos/categorias?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.sucesso && Array.isArray(data.categorias) && data.categorias.length > 0) {
          setCategorias(data.categorias);
          return;
        }
      }
    } catch (_err) {}
  }, [backendBaseUrl, restaurante_slug]);

  // Carrega produtos do restaurante
  const carregarProdutos = useCallback(async () => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/${restaurante_slug}/produtos?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.sucesso) {
          setProdutos(data.produtos || []);
          if (data.restaurante) setRestauranteInfo(data.restaurante);

          // Extrai categorias caso endpoint específico ainda não tenha retornado
          const catsMap = new Map<string, Categoria>();
          (data.produtos || []).forEach((p: Produto) => {
            if (p.categoria) catsMap.set(p.categoria.id, p.categoria);
          });
          if (catsMap.size > 0) {
            setCategorias(Array.from(catsMap.values()));
          }
        }
      }
    } catch (_err) {}
  }, [backendBaseUrl, restaurante_slug]);

  // Carrega funcionários do restaurante
  const carregarFuncionarios = useCallback(async () => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/${restaurante_slug}/funcionarios?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.sucesso && Array.isArray(data.funcionarios)) {
          setFuncionarios(data.funcionarios);
        }
      }
    } catch (_err) {}
  }, [backendBaseUrl, restaurante_slug]);

  // Carrega pedidos KDS com indicador visual e sem cache
  const carregarPedidos = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregandoPedidos(true);
    try {
      const res = await fetch(`${backendBaseUrl}/api/pedidos?tenant_slug=${restaurante_slug}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sucesso && Array.isArray(data.pedidos)) {
          setPedidos(data.pedidos);
        }
      }
    } catch (_err) {
      console.error('Erro ao carregar fila de pedidos:', _err);
    } finally {
      if (!silencioso) setCarregandoPedidos(false);
    }
  }, [backendBaseUrl, restaurante_slug]);

  useEffect(() => {
    carregarCategorias();
    carregarProdutos();
    carregarFuncionarios();
    carregarPedidos(true);

    const intervalo = setInterval(() => {
      carregarPedidos(true);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [carregarCategorias, carregarProdutos, carregarFuncionarios, carregarPedidos]);

  // ============================================================================
  // HANDLERS: PRODUTOS & UPLOAD DE IMAGEM
  // ============================================================================
  const handleArquivoSelecionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setCarregandoImagem(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensiona inteligentemente mantendo a proporção para resolução web ideal (max 1024px)
        const maxDim = 1024;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setProdImagemUrl(dataUrl);
        } else {
          setProdImagemUrl(event.target?.result as string);
        }
        setCarregandoImagem(false);
      };
      img.onerror = () => {
        setProdImagemUrl(event.target?.result as string);
        setCarregandoImagem(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      alert('Erro ao ler a foto do dispositivo.');
      setCarregandoImagem(false);
    };
    reader.readAsDataURL(file);
  };

  const abrirModalNovoProduto = () => {
    setProdutoEditando(null);
    setProdNome('');
    setProdPreco('');
    setProdDescricao('');
    setProdImagemUrl('');
    setModoImagem('upload');
    setModoNovaCategoria(false);
    setNovaCategoriaNome('');
    setProdCategoriaNome(categorias[0]?.nome || '');
    setProdDestaque(false);
    setProdDisponivel(true);
    setModalProdutoAberto(true);
  };

  const abrirModalEditarProduto = (prod: Produto) => {
    setProdutoEditando(prod);
    setProdNome(prod.nome);
    setProdPreco(String(prod.precoBase));
    setProdDescricao(prod.descricao || '');
    setProdImagemUrl(prod.imagemUrl || '');
    setModoImagem(prod.imagemUrl?.startsWith('data:image') ? 'upload' : 'url');
    setModoNovaCategoria(false);
    setNovaCategoriaNome('');
    setProdCategoriaNome(prod.categoria?.nome || categorias[0]?.nome || '');
    setProdDestaque(Boolean(prod.destaque));
    setProdDisponivel(prod.disponivel);
    setModalProdutoAberto(true);
  };

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = prodNome.trim();
    if (!nomeLimpo || nomeLimpo.length < 2) {
      alert('O nome do produto é obrigatório e deve ter no mínimo 2 caracteres.');
      return;
    }

    const precoSanitizado = prodPreco.replace(/[^\d.,]/g, '').replace(',', '.');
    const precoNumero = parseFloat(precoSanitizado);
    if (isNaN(precoNumero) || precoNumero <= 0) {
      alert('Por favor, informe um preço numérico válido e maior que zero (apenas dígitos numéricos).');
      return;
    }

    const categoriaFinal = (modoNovaCategoria ? novaCategoriaNome : prodCategoriaNome).trim();
    if (!categoriaFinal) {
      alert('Por favor, selecione ou informe o nome da categoria para o produto.');
      return;
    }

    setSalvandoProduto(true);
    try {
      const payload = {
        nome: nomeLimpo,
        precoBase: precoNumero,
        descricao: prodDescricao.trim() || null,
        imagemUrl: prodImagemUrl.trim() || null,
        categoriaNome: categoriaFinal,
        destaque: prodDestaque,
        disponivel: prodDisponivel,
      };

      const url = produtoEditando
        ? `${backendBaseUrl}/api/${restaurante_slug}/produtos/${produtoEditando.id}`
        : `${backendBaseUrl}/api/${restaurante_slug}/produtos`;

      const method = produtoEditando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalProdutoAberto(false);
        await carregarCategorias();
        await carregarProdutos();
        exibirFeedback(produtoEditando ? '✓ Produto atualizado com sucesso!' : '✓ Novo produto cadastrado no cardápio!');
      } else {
        const erroJson = await res.json().catch(() => null);
        alert(erroJson?.erro || 'Falha ao salvar produto. Verifique os dados informados.');
      }
    } catch (_e) {
      alert('Erro de conexão ao salvar produto.');
    } finally {
      setSalvandoProduto(false);
    }
  };

  const handleToggleDisponibilidadeProduto = async (prod: Produto) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/${restaurante_slug}/produtos/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponivel: !prod.disponivel }),
      });
      if (res.ok) {
        await carregarProdutos();
        exibirFeedback(`Status alterado: ${prod.nome} agora está ${!prod.disponivel ? 'Disponível' : 'Esgotado'}.`);
      }
    } catch (_e) {}
  };

  const handleExcluirProduto = async (prod: Produto) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${prod.nome}" do cardápio?`)) return;

    try {
      const res = await fetch(`${backendBaseUrl}/api/${restaurante_slug}/produtos/${prod.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await carregarProdutos();
        exibirFeedback(`✓ Produto "${prod.nome}" removido do cardápio.`);
      }
    } catch (_e) {}
  };

  // ============================================================================
  // HANDLERS: FUNCIONÁRIOS
  // ============================================================================
  const abrirModalNovoFuncionario = () => {
    setFuncEditando(null);
    setFuncNome('');
    setFuncCargo('ATENDENTE');
    setFuncEmail('');
    setFuncTelefone('');
    setFuncAtivo(true);
    setModalFuncionarioAberto(true);
  };

  const abrirModalEditarFuncionario = (func: Funcionario) => {
    setFuncEditando(func);
    setFuncNome(func.nome);
    setFuncCargo(func.cargo);
    setFuncEmail(func.email || '');
    setFuncTelefone(func.telefone || '');
    setFuncAtivo(func.ativo);
    setModalFuncionarioAberto(true);
  };

  const handleSalvarFuncionario = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = funcNome.trim();
    if (!nomeLimpo || nomeLimpo.length < 2) {
      alert('O nome do colaborador é obrigatório e deve ter no mínimo 2 caracteres.');
      return;
    }

    if (funcEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(funcEmail.trim())) {
        alert('Por favor, informe um endereço de e-mail válido.');
        return;
      }
    }

    if (funcTelefone.trim()) {
      const telDigitos = funcTelefone.replace(/\D/g, '');
      if (telDigitos.length < 10) {
        alert('O telefone deve conter DDD + número com no mínimo 10 dígitos numéricos.');
        return;
      }
    }

    setSalvandoFuncionario(true);
    try {
      const payload = {
        nome: nomeLimpo,
        cargo: funcCargo,
        email: funcEmail.trim() || null,
        telefone: funcTelefone.trim() || null,
        ativo: funcAtivo,
      };

      const url = funcEditando
        ? `${backendBaseUrl}/api/${restaurante_slug}/funcionarios/${funcEditando.id}`
        : `${backendBaseUrl}/api/${restaurante_slug}/funcionarios`;

      const method = funcEditando ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalFuncionarioAberto(false);
        await carregarFuncionarios();
        exibirFeedback(funcEditando ? '✓ Colaborador atualizado com sucesso!' : '✓ Novo colaborador cadastrado na equipe!');
      } else {
        const erroJson = await res.json().catch(() => null);
        alert(erroJson?.erro || 'Falha ao salvar colaborador. Verifique os dados informados.');
      }
    } catch (_e) {
      alert('Erro de conexão ao salvar colaborador.');
    } finally {
      setSalvandoFuncionario(false);
    }
  };

  const handleToggleStatusFuncionario = async (func: Funcionario) => {
    try {
      const res = await fetch(`${backendBaseUrl}/api/${restaurante_slug}/funcionarios/${func.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !func.ativo }),
      });
      if (res.ok) {
        await carregarFuncionarios();
        exibirFeedback(`Status alterado: ${func.nome} agora está ${!func.ativo ? 'Ativo' : 'Inativo'}.`);
      }
    } catch (_e) {}
  };

  const handleExcluirFuncionario = async (func: Funcionario) => {
    if (!confirm(`Remover "${func.nome}" da equipe deste estabelecimento?`)) return;

    try {
      const res = await fetch(`${backendBaseUrl}/api/${restaurante_slug}/funcionarios/${func.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await carregarFuncionarios();
        exibirFeedback(`✓ Colaborador "${func.nome}" removido da equipe.`);
      }
    } catch (_e) {}
  };

  // ============================================================================
  // HANDLERS: KDS & LIBERAÇÃO DE PAGAMENTO
  // ============================================================================
  const handleConfirmarPagamentoPedido = async (pedido: Pedido) => {
    setStatusUpdatingId(pedido.id);
    try {
      const res = await fetch(`${backendBaseUrl}/api/pedidos/${pedido.id}/pagamento`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusPagamento: 'PAGO' }),
      });

      if (res.ok) {
        await carregarPedidos(true);
        exibirFeedback(`✓ Pagamento do pedido #${pedido.codigo} confirmado! Liberado para a Cozinha.`);
      } else {
        alert('Falha ao confirmar pagamento do pedido.');
      }
    } catch (_err) {
      alert('Erro de conexão ao confirmar pagamento.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // ============================================================================
  // HANDLERS: KDS (AVANÇAR PEDIDOS)
  // ============================================================================
  const handleAvancarStatusPedido = async (pedido: Pedido) => {
    let proximoStatus: 'EM_PREPARO' | 'PRONTO_ENTREGA' | 'FINALIZADO' | null = null;
    if (pedido.status === 'RECEBIDO') proximoStatus = 'EM_PREPARO';
    else if (pedido.status === 'EM_PREPARO') proximoStatus = 'PRONTO_ENTREGA';
    else if (pedido.status === 'PRONTO_ENTREGA') proximoStatus = 'FINALIZADO';

    if (!proximoStatus) return;

    setStatusUpdatingId(pedido.id);
    try {
      const res = await fetch(`${backendBaseUrl}/api/pedidos/${pedido.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: proximoStatus }),
      });

      if (res.ok) {
        await carregarPedidos();
        exibirFeedback(`Pedido #${pedido.codigo} avançado para ${proximoStatus}!`);
      }
    } catch (_err) {
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const nomeExibicao = restauranteInfo?.nome || restaurante_slug.replace(/-/g, ' ').toUpperCase();
  const corPrimaria = restauranteInfo?.corPrimaria || '#E11D48';

  const badgeCargo = (cargo: string) => {
    switch (cargo) {
      case 'GERENTE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'COZINHEIRO':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'GARCOM':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'CAIXA':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'ENTREGADOR':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-rose-500 selection:text-white pb-24">
      {/* Toast de Feedback */}
      {mensagemFeedback && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <span>✓</span>
          <span>{mensagemFeedback}</span>
        </div>
      )}

      {/* 
        ========================================================================
        HEADER DO PAINEL ADMINISTRATIVO
        ========================================================================
      */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
              title="Voltar ao Dev Hub"
            >
              ←
            </Link>

            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs shrink-0"
                style={{ backgroundColor: corPrimaria }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-white text-base tracking-tight leading-none">
                    {nomeExibicao}
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Painel ADM
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  /{restaurante_slug}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/${restaurante_slug}`}
              target="_blank"
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>🛍️</span>
              <span className="hidden sm:inline">Ver Cardápio do Cliente</span>
              <span>&rarr;</span>
            </Link>

            <Link
              href="/"
              className="py-1.5 px-3 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 rounded-xl text-xs font-bold text-rose-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚡</span>
              <span className="hidden sm:inline">Dev Hub</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-7 flex flex-col gap-6">
        {/* Banner de Sincronização em Tempo Real */}
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                Painel Administrativo Integrado em Tempo Real
              </h2>
              <p className="text-[11px] text-slate-400">
                Todo prato cadastrado ou editado aqui reflete instantaneamente no cardápio público do cliente em <code className="text-rose-300 bg-slate-950 px-1 py-0.5 rounded">/{restaurante_slug}</code>.
              </p>
            </div>
          </div>

          <Link
            href={`/${restaurante_slug}`}
            target="_blank"
            className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-md"
          >
            Abrir Cardápio Público &rarr;
          </Link>
        </div>

        {/* 
          ======================================================================
          ABAS DO PAINEL ADMINISTRATIVO
          ======================================================================
        */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setAbaAtiva('produtos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                abaAtiva === 'produtos'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>🍽️</span>
              <span>Cardápio & Produtos ({produtos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva('funcionarios')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                abaAtiva === 'funcionarios'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>👥</span>
              <span>Equipe & Funcionários ({funcionarios.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva('kds')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                abaAtiva === 'kds'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>👨‍🍳</span>
              <span>Cozinha & Pedidos KDS ({pedidos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva('metricas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                abaAtiva === 'metricas'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>📊</span>
              <span>Métricas</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva('design')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                abaAtiva === 'design'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-lg font-extrabold ring-2 ring-amber-400/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>🎨</span>
              <span>Design & Cardápio</span>
            </button>
          </div>

          {/* Botões de Ação Rápida no Topo da Aba */}
          {abaAtiva === 'produtos' && (
            <button
              type="button"
              onClick={abrirModalNovoProduto}
              className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>+</span>
              <span>Cadastrar Novo Produto</span>
            </button>
          )}

          {abaAtiva === 'funcionarios' && (
            <button
              type="button"
              onClick={abrirModalNovoFuncionario}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>+</span>
              <span>Cadastrar Colaborador</span>
            </button>
          )}
        </div>

        {/* 
          ======================================================================
          ABA 1: GESTÃO COMPLETA DE PRODUTOS & CARDÁPIO
          ======================================================================
        */}
        {abaAtiva === 'produtos' && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Gerencie todos os pratos, bebidas e itens disponíveis para os clientes deste restaurante.
              </p>
              <span className="text-xs font-bold text-slate-500">
                {produtos.length} produtos cadastrados
              </span>
            </div>

            {produtos.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-3">
                <span className="text-4xl">🍽️</span>
                <p className="text-base font-bold text-white">Nenhum produto cadastrado ainda</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Comece agora cadastrando o primeiro prato do cardápio deste restaurante.
                </p>
                <button
                  type="button"
                  onClick={abrirModalNovoProduto}
                  className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  + Cadastrar Primeiro Produto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {produtos.map((p) => {
                  const precoNum = typeof p.precoBase === 'string' ? parseFloat(p.precoBase) : p.precoBase;

                  return (
                    <article
                      key={p.id}
                      className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all ${
                        p.disponivel
                          ? 'border-slate-800 hover:border-slate-700'
                          : 'border-rose-900/40 bg-slate-950/80 opacity-75'
                      }`}
                    >
                      <div>
                        {/* Imagem + Nome + Preço */}
                        <div className="flex items-start gap-3.5 mb-3">
                          {p.imagemUrl ? (
                            <img
                              src={p.imagemUrl}
                              alt={p.nome}
                              className="w-16 h-16 rounded-xl object-cover border border-slate-800 bg-slate-800 shrink-0 shadow-md"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                              🍽️
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                                {p.categoria?.nome || 'Geral'}
                              </span>
                              {p.destaque && (
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                  ⭐ Destaque
                                </span>
                              )}
                              {!p.disponivel && (
                                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                                  Esgotado
                                </span>
                              )}
                            </div>

                            <h3 className="font-bold text-white text-sm mt-1 leading-snug truncate">
                              {p.nome}
                            </h3>

                            <div className="text-sm font-extrabold text-amber-400 mt-1">
                              {formatarMoeda(precoNum)}
                            </div>
                          </div>
                        </div>

                        {/* Descrição */}
                        {p.descricao && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                            {p.descricao}
                          </p>
                        )}
                      </div>

                      {/* Botões de Ação do Produto */}
                      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        {/* Toggle Disponível/Esgotado */}
                        <button
                          type="button"
                          onClick={() => handleToggleDisponibilidadeProduto(p)}
                          className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            p.disponivel
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {p.disponivel ? '✓ Disponível' : '✕ Esgotado'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirModalEditarProduto(p)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer"
                            title="Editar produto"
                          >
                            ✏️ Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExcluirProduto(p)}
                            className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 text-xs font-semibold rounded-lg border border-rose-900/50 transition-all cursor-pointer"
                            title="Excluir produto"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 
          ======================================================================
          ABA 2: GESTÃO DE EQUIPE & FUNCIONÁRIOS
          ======================================================================
        */}
        {abaAtiva === 'funcionarios' && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Acesse e cadastre os colaboradores que operam neste restaurante (cozinha, garçons, caixa e gerência).
              </p>
              <span className="text-xs font-bold text-slate-500">
                {funcionarios.length} colaboradores
              </span>
            </div>

            {funcionarios.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-3">
                <span className="text-4xl">👥</span>
                <p className="text-base font-bold text-white">Nenhum colaborador cadastrado</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Cadastre os garçons, cozinheiros e atendentes deste restaurante para gerenciar a equipe.
                </p>
                <button
                  type="button"
                  onClick={abrirModalNovoFuncionario}
                  className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  + Cadastrar Primeiro Colaborador
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {funcionarios.map((func) => (
                  <article
                    key={func.id}
                    className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all ${
                      func.ativo
                        ? 'border-slate-800 hover:border-slate-700'
                        : 'border-slate-800/60 bg-slate-950/80 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Topo: Nome + Cargo */}
                      <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
                        <div>
                          <h3 className="font-bold text-white text-sm leading-snug">
                            {func.nome}
                          </h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block mt-1 ${badgeCargo(func.cargo)}`}>
                            {func.cargo}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${func.ativo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                          {func.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      {/* Contatos */}
                      <div className="flex flex-col gap-1 text-xs text-slate-400 my-2">
                        {func.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <span>📧</span>
                            <span className="truncate">{func.email}</span>
                          </div>
                        )}
                        {func.telefone && (
                          <div className="flex items-center gap-1.5">
                            <span>📱</span>
                            <span>{func.telefone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações do Colaborador */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatusFuncionario(func)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          func.ativo
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {func.ativo ? 'Desativar' : 'Reativar'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirModalEditarFuncionario(func)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer"
                          title="Editar colaborador"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExcluirFuncionario(func)}
                          className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 text-xs font-semibold rounded-lg border border-rose-900/50 transition-all cursor-pointer"
                          title="Remover colaborador"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 
          ======================================================================
          ABA 3: COZINHA & PEDIDOS (KDS)
          ======================================================================
        */}
        {abaAtiva === 'kds' && (() => {
          // Regra de Cozinha: Mesas entram direto. Delivery/Retirada SÓ entram se pagamento estiver PAGO
          const pedidosCozinha = pedidos.filter(
            (p) => p.tipoPedido === 'MESA' || p.tipo === 'Mesa' || p.statusPagamento === 'PAGO'
          );
          const pedidosAguardandoPagamento = pedidos.filter(
            (p) => p.tipoPedido !== 'MESA' && p.tipo !== 'Mesa' && p.statusPagamento !== 'PAGO'
          );

          const listaAtual = subAbaKds === 'cozinha' ? pedidosCozinha : pedidosAguardandoPagamento;

          return (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 self-start">
                  <button
                    type="button"
                    onClick={() => setSubAbaKds('cozinha')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subAbaKds === 'cozinha'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>👨‍🍳</span>
                    <span>Fila da Cozinha (Liberados)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      subAbaKds === 'cozinha' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {pedidosCozinha.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubAbaKds('aguardando_pagamento')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subAbaKds === 'aguardando_pagamento'
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>⏳</span>
                    <span>Aguardando Pagamento (Delivery / Retirada)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      subAbaKds === 'aguardando_pagamento' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {pedidosAguardandoPagamento.length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={carregandoPedidos}
                  onClick={async () => {
                    await carregarPedidos(false);
                    exibirFeedback('✓ Fila de pedidos sincronizada com o banco de dados!');
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 border border-slate-700/80 hover:border-slate-500 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2 shadow cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                >
                  <span className={`inline-block transition-transform duration-500 ${carregandoPedidos ? 'animate-spin' : ''}`}>↻</span>
                  <span>{carregandoPedidos ? 'Atualizando...' : 'Atualizar Fila'}</span>
                </button>
              </div>

              {subAbaKds === 'cozinha' && (
                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl px-4 py-2.5 flex items-center gap-2 text-xs text-emerald-300">
                  <span>ℹ️</span>
                  <span>
                    <strong>Regra Operacional Ativa:</strong> A esteira da cozinha exibe apenas pedidos de <strong>Mesa</strong> e pedidos de <strong>Delivery/Retirada cujo pagamento já foi concluído</strong>.
                  </span>
                </div>
              )}

              {subAbaKds === 'aguardando_pagamento' && (
                <div className="bg-amber-950/20 border border-amber-900/30 rounded-2xl px-4 py-2.5 flex items-center gap-2 text-xs text-amber-300">
                  <span>⏳</span>
                  <span>
                    <strong>Controle de Caixa:</strong> Pedidos de Delivery e Retirada aguardando confirmação (Pix, Dinheiro ou Cartão na entrega). Ao confirmar, o pedido é liberado instantaneamente para a produção da cozinha.
                  </span>
                </div>
              )}

              {listaAtual.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-2">
                  <span className="text-3xl">
                    {subAbaKds === 'cozinha' ? '👨‍🍳' : '✅'}
                  </span>
                  <p className="text-sm font-bold text-white">
                    {subAbaKds === 'cozinha'
                      ? 'Nenhum pedido na fila de preparo da cozinha'
                      : 'Nenhum pedido pendente de pagamento'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    {subAbaKds === 'cozinha'
                      ? 'Assim que um pedido de mesa for feito ou o pagamento de entrega/retirada for confirmado, a comanda aparecerá aqui.'
                      : 'Todos os pedidos de delivery e retirada já foram quitados ou não há novos pedidos no momento.'}
                  </p>
                  <Link
                    href={`/${restaurante_slug}`}
                    target="_blank"
                    className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all"
                  >
                    Fazer Pedido de Teste no Cardápio &rarr;
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listaAtual.map((pedido) => {
                    const corStatus =
                      pedido.status === 'RECEBIDO'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : pedido.status === 'EM_PREPARO'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : pedido.status === 'PRONTO_ENTREGA'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : pedido.status === 'FINALIZADO'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

                    const labelStatus =
                      pedido.status === 'RECEBIDO'
                        ? '1. Recebido (Pendente)'
                        : pedido.status === 'EM_PREPARO'
                        ? '2. Em Preparo 🍳'
                        : pedido.status === 'PRONTO_ENTREGA'
                        ? '3. Pronto / Expedição 📦'
                        : pedido.status === 'FINALIZADO'
                        ? 'Concluído ✅'
                        : 'Cancelado ✕';

                    const isUpdating = statusUpdatingId === pedido.id;
                    const isAguardandoPagamento = subAbaKds === 'aguardando_pagamento';

                    return (
                      <article
                        key={pedido.id}
                        className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between shadow-lg ${
                          isAguardandoPagamento ? 'border-amber-700/50' : 'border-slate-800'
                        }`}
                      >
                        <div>
                          {/* Header da Comanda */}
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                            <span className="font-mono text-xs font-black text-white">
                              #{pedido.codigo}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {pedido.statusPagamento === 'PAGO' ? (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                  ✓ PAGO
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                  ⏳ Pagamento Pendente
                                </span>
                              )}
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${corStatus}`}>
                                {labelStatus}
                              </span>
                            </div>
                          </div>

                          {/* Modalidade / Horário */}
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
                            <span className="font-semibold text-slate-300">
                              {pedido.tipoPedido === 'MESA' || pedido.tipo === 'Mesa'
                                ? `Mesa ${pedido.numeroMesa || '0'}`
                                : pedido.tipoPedido === 'DELIVERY' || pedido.tipo === 'Delivery'
                                ? '🛵 Delivery'
                                : '🛍️ Retirada'}
                            </span>
                            <span className="text-[11px]">{formatarHora(pedido.criadoEm)}</span>
                          </div>

                          {/* Se for Delivery e tiver endereço */}
                          {pedido.rua && (
                            <div className="mb-2 p-2 bg-slate-950/50 rounded-xl border border-slate-800/60 text-[11px] text-slate-300">
                              <span className="text-slate-400">📍 Endereço:</span> {pedido.rua}, {pedido.numeroEndereco || 'S/N'} - {pedido.bairro}
                              {pedido.cep && <span className="text-slate-500 font-mono block">CEP: {pedido.cep}</span>}
                            </div>
                          )}

                          {/* Itens da Comanda */}
                          <div className="flex flex-col gap-1.5 my-2.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                            {pedido.itens.map((item, idx) => (
                              <div key={idx} className="flex flex-col text-xs">
                                <div className="flex justify-between items-center text-slate-200">
                                  <span>
                                    <strong className="text-white">{item.quantidade}x</strong> {item.nomeProduto || item.nome || 'Item do Cardápio'}
                                  </span>
                                  <span className="text-slate-400 font-mono text-[11px]">
                                    {formatarMoeda(item.subtotal)}
                                  </span>
                                </div>
                                {item.adicionais && item.adicionais.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5 pl-3">
                                    {item.adicionais.map((ad, adIdx) => (
                                      <span key={adIdx} className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded">
                                        + {ad.nome}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Total e Cliente */}
                          <div className="flex flex-col gap-0.5 text-xs text-slate-300 mb-3 pt-1 border-t border-slate-800/60">
                            <div className="flex justify-between">
                              <span>Cliente: <strong className="text-white">{pedido.clienteNome || pedido.nomeCliente || 'Presencial'}</strong></span>
                              <span>Total: <strong className="text-white">{formatarMoeda(pedido.total)}</strong></span>
                            </div>
                            {pedido.clienteTelefone && (
                              <span className="text-[11px] text-slate-400">
                                Tel: {pedido.clienteTelefone}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="pt-2 border-t border-slate-800">
                          {isAguardandoPagamento ? (
                            <button
                              type="button"
                              onClick={() => handleConfirmarPagamentoPedido(pedido)}
                              disabled={isUpdating}
                              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                              <span>{isUpdating ? 'Liberando...' : 'Confirmar Pagamento & Liberar p/ Cozinha ✅'}</span>
                            </button>
                          ) : (
                            <>
                              {pedido.status === 'RECEBIDO' && (
                                <button
                                  type="button"
                                  onClick={() => handleAvancarStatusPedido(pedido)}
                                  disabled={isUpdating}
                                  className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer disabled:opacity-60"
                                >
                                  {isUpdating ? 'Atualizando...' : 'Autorizar & Iniciar Preparo 🍳'}
                                </button>
                              )}

                              {pedido.status === 'EM_PREPARO' && (
                                <button
                                  type="button"
                                  onClick={() => handleAvancarStatusPedido(pedido)}
                                  disabled={isUpdating}
                                  className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer disabled:opacity-60"
                                >
                                  {isUpdating ? 'Atualizando...' : 'Marcar como Pronto 📦'}
                                </button>
                              )}

                              {pedido.status === 'PRONTO_ENTREGA' && (
                                <button
                                  type="button"
                                  onClick={() => handleAvancarStatusPedido(pedido)}
                                  disabled={isUpdating}
                                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer disabled:opacity-60"
                                >
                                  {isUpdating ? 'Atualizando...' : 'Finalizar / Entregar Pedido ✅'}
                                </button>
                              )}

                              {pedido.status === 'FINALIZADO' && (
                                <div className="text-center py-1 text-[11px] text-emerald-400 font-semibold">
                                  ✓ Pedido Concluído & Entregue
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })()}

        {/* 
          ======================================================================
          ABA 4: MÉTRICAS & FATURAMENTO
          ======================================================================
        */}
        {abaAtiva === 'metricas' && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Produtos Ativos</span>
              <div className="text-3xl font-black text-white mt-2">
                {produtos.filter((p) => p.disponivel).length}
              </div>
              <span className="text-[11px] text-slate-500 mt-1">De {produtos.length} cadastrados</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Colaboradores</span>
              <div className="text-3xl font-black text-white mt-2">
                {funcionarios.filter((f) => f.ativo).length}
              </div>
              <span className="text-[11px] text-slate-500 mt-1">Equipe ativa</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pedidos</span>
              <div className="text-3xl font-black text-amber-400 mt-2">
                {pedidos.length}
              </div>
              <span className="text-[11px] text-slate-500 mt-1">Hoje na comanda</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faturado Hoje</span>
              <div className="text-3xl font-black text-emerald-400 mt-2">
                {formatarMoeda(pedidos.reduce((acc, p) => acc + (Number(p.total) || 0), 0))}
              </div>
              <span className="text-[11px] text-slate-500 mt-1">Receita consolidada</span>
            </div>
          </section>
        )}

        {/* 
          ======================================================================
          ABA 5: MENU STUDIO (DESIGN & PERSONALIZAÇÃO VISUAL NO-CODE)
          ======================================================================
        */}
        {abaAtiva === 'design' && (
          <MenuStudioDesigner
            restaurante_slug={restaurante_slug}
            restauranteInfo={restauranteInfo}
          />
        )}
      </main>

      {/* 
        ========================================================================
        MODAL: CADASTRAR / EDITAR PRODUTO
        ========================================================================
      */}
      {modalProdutoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>🍽️</span>
                <span>{produtoEditando ? 'Editar Produto do Cardápio' : 'Cadastrar Novo Produto'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setModalProdutoAberto(false)}
                className="text-slate-400 hover:text-white text-sm font-bold bg-slate-800 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarProduto} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pizza Margherita Especial"
                  value={prodNome}
                  onChange={(e) => setProdNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:ring-2 focus:ring-rose-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Preço Base (R$) *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="Ex: 49.90"
                    value={prodPreco || ''}
                    onChange={(e) => setProdPreco(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-rose-500 transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Categoria do Banco *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setModoNovaCategoria(!modoNovaCategoria);
                        if (!modoNovaCategoria) {
                          setNovaCategoriaNome('');
                        }
                      }}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                    >
                      {modoNovaCategoria ? '← Selecionar da Lista' : '+ Nova Categoria'}
                    </button>
                  </div>

                  {!modoNovaCategoria ? (
                    <select
                      required
                      value={prodCategoriaNome}
                      onChange={(e) => {
                        if (e.target.value === '__NOVA__') {
                          setModoNovaCategoria(true);
                          setNovaCategoriaNome('');
                        } else {
                          setProdCategoriaNome(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
                    >
                      {categorias.length === 0 ? (
                        <option value="">Carregando categorias...</option>
                      ) : (
                        categorias.map((cat) => (
                          <option key={cat.id} value={cat.nome}>
                            📁 {cat.nome}
                          </option>
                        ))
                      )}
                      <option value="__NOVA__" className="text-rose-400 font-bold">
                        + Cadastrar Nova Categoria...
                      </option>
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Digite o nome da nova categoria (ex: Sobremesas)"
                        value={novaCategoriaNome}
                        onChange={(e) => setNovaCategoriaNome(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-rose-500 rounded-xl text-white text-xs placeholder:text-slate-600 focus:ring-2 focus:ring-rose-500 transition-all font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Foto do Prato
                  </label>
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setModoImagem('upload')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        modoImagem === 'upload'
                          ? 'bg-rose-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📁 No Dispositivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoImagem('url')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        modoImagem === 'url'
                          ? 'bg-rose-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🔗 Link URL
                    </button>
                  </div>
                </div>

                {modoImagem === 'upload' ? (
                  <div key="wrapper-upload-foto">
                    <input
                      key="input-foto-arquivo"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleArquivoSelecionado}
                      className="hidden"
                    />

                    {!prodImagemUrl ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/70 transition-all hover:bg-slate-950 group"
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">📸</span>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-200">
                            {carregandoImagem ? 'Processando imagem...' : 'Procurar foto no dispositivo ou tirar com a câmera'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Formatos PNG, JPG, WEBP • Compressão automática para o banco
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={prodImagemUrl}
                            alt="Prévia do Prato"
                            className="w-14 h-14 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-white truncate">Foto do prato anexada</span>
                            <span className="text-[10px] text-emerald-400 font-medium">✓ Pronta para cadastro no banco</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg border border-slate-700 transition-all cursor-pointer"
                          >
                            Trocar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProdImagemUrl('');
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-[11px] font-bold rounded-lg border border-rose-800/40 transition-all cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div key="wrapper-url-foto">
                    <input
                      key="input-foto-url"
                      type="url"
                      placeholder="https://exemplo.com/foto-do-prato.jpg"
                      value={prodImagemUrl || ''}
                      onChange={(e) => setProdImagemUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:ring-2 focus:ring-rose-500 transition-all font-mono"
                    />
                    {prodImagemUrl && (
                      <div className="mt-2.5 flex items-center justify-between gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={prodImagemUrl}
                            alt="Preview"
                            className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                            onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                          />
                          <span className="text-[11px] text-slate-300">Prévia da imagem via URL</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProdImagemUrl('')}
                          className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-[10px] font-bold rounded-lg border border-rose-800/40 cursor-pointer"
                        >
                          Limpar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Descrição dos Ingredientes / Prato
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva os ingredientes frescos, molhos especiais e preparo..."
                  value={prodDescricao}
                  onChange={(e) => setProdDescricao(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodDestaque}
                    onChange={(e) => setProdDestaque(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span>Destacar no topo do cardápio</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodDisponivel}
                    onChange={(e) => setProdDisponivel(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>Disponível para venda</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalProdutoAberto(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoProduto}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {salvandoProduto ? 'Salvando...' : produtoEditando ? 'Salvar Alterações' : 'Cadastrar no Cardápio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL: CADASTRAR / EDITAR FUNCIONÁRIO
        ========================================================================
      */}
      {modalFuncionarioAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>👥</span>
                <span>{funcEditando ? 'Editar Colaborador' : 'Cadastrar Novo Colaborador'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setModalFuncionarioAberto(false)}
                className="text-slate-400 hover:text-white text-sm font-bold bg-slate-800 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarFuncionario} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={funcNome}
                  onChange={(e) => setFuncNome(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Cargo / Função *
                </label>
                <select
                  value={funcCargo}
                  onChange={(e) => setFuncCargo(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
                >
                  <option value="GERENTE">Gerente Geral</option>
                  <option value="GARCOM">Garçom / Atendimento de Mesas</option>
                  <option value="COZINHEIRO">Cozinheiro / Chef</option>
                  <option value="CAIXA">Operador de Caixa</option>
                  <option value="ATENDENTE">Atendente de Balcão</option>
                  <option value="ENTREGADOR">Entregador / Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  placeholder="joao@restaurante.com.br"
                  value={funcEmail || ''}
                  onChange={(e) => setFuncEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="(11) 98888-7777"
                  value={funcTelefone || ''}
                  onChange={(e) => setFuncTelefone(formatarTelefoneAdmin(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={funcAtivo}
                  onChange={(e) => setFuncAtivo(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <span>Colaborador ativo na equipe</span>
              </label>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalFuncionarioAberto(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoFuncionario}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-amber-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {salvandoFuncionario ? 'Salvando...' : funcEditando ? 'Salvar Alterações' : 'Cadastrar na Equipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
