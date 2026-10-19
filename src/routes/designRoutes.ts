import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

export const designRoutes = Router({ mergeParams: true });

// Injeta req.tenant_id e req.tenant
designRoutes.use(tenantMiddleware);

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

// Configuração padrão premium para restaurantes
export const DESIGN_PADRAO: DesignConfigData = {
  corPrimaria: '#E11D48',
  corSecundaria: '#FB7185',
  corFundo: 'claro',
  estiloHeader: 'gradiente',
  bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
  logoUrl: null,
  nomeRestaurante: '',
  slogan: 'Cardápio Digital Oficial',
  estiloCard: 'moderno',
  arredondamento: 'moderno',
  exibirFotos: true,
  fonteFamilia: 'Inter',
  secoes: [
    { id: 'header_topo', titulo: 'Cabeçalho e Identidade', ativo: true, ordem: 1, icone: '🏷️', descricao: 'Logo, nome e status de funcionamento' },
    { id: 'busca_produtos', titulo: 'Barra de Pesquisa Rápida', ativo: true, ordem: 2, icone: '🔍', descricao: 'Campo com busca em tempo real' },
    { id: 'destaques', titulo: 'Carrossel de Mais Vendidos', ativo: true, ordem: 3, icone: '🔥', descricao: 'Pratos recomendados pelo Chef' },
    { id: 'categorias_chips', titulo: 'Navegação de Categorias', ativo: true, ordem: 4, icone: '📑', descricao: 'Chips horizontais fixos no topo' },
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
    'Carnes': '🥩',
    'Massas': '🍝',
    'Cafés': '☕',
    'Lanches': '🥪',
  },
};

/**
 * GET /api/:tenant_slug/design
 * Retorna as configurações de layout e design do cardápio do restaurante.
 */
designRoutes.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant_id;
    const tenant = req.tenant;

    if (!tenantId || !tenant) {
      res.status(400).json({ sucesso: false, erro: 'Tenant não localizado.' });
      return;
    }

    // Busca configuração no banco Neon
    let tenantConfig = null;
    try {
      tenantConfig = await prisma.tenantConfig.findUnique({
        where: { tenantId },
      });
    } catch (_err) {}

    let design: DesignConfigData = {
      ...DESIGN_PADRAO,
      corPrimaria: tenant.corPrimaria || DESIGN_PADRAO.corPrimaria,
      logoUrl: tenant.logoUrl || null,
      nomeRestaurante: tenant.nome || '',
      slogan: tenant.descricao || DESIGN_PADRAO.slogan,
    };

    const rawDesignConfig = (tenantConfig as any)?.designConfig;
    if (rawDesignConfig) {
      try {
        const parsed = JSON.parse(rawDesignConfig);
        design = {
          ...design,
          ...parsed,
          // Garante que o nome e cor primária reflitam o estado atual do tenant
          nomeRestaurante: parsed.nomeRestaurante || tenant.nome,
          corPrimaria: parsed.corPrimaria || tenant.corPrimaria || DESIGN_PADRAO.corPrimaria,
          logoUrl: parsed.logoUrl !== undefined ? parsed.logoUrl : tenant.logoUrl,
        };
      } catch (_jsonErr) {
        console.warn('⚠️ Falha ao decodificar JSON do designConfig, usando padrão.');
      }
    }

    // Busca categorias cadastradas para auto-completar ícones padrão caso faltem
    let categoriasNomes: string[] = [];
    try {
      const categorias = await prisma.categoria.findMany({
        where: { tenantId, ativa: true },
        select: { id: true, nome: true },
        orderBy: { ordem: 'asc' },
      });
      categoriasNomes = categorias.map((c) => c.nome);
    } catch (_err) {}

    res.status(200).json({
      sucesso: true,
      design,
      categoriasDisponiveis: categoriasNomes,
      restaurante: {
        id: tenant.id,
        nome: tenant.nome,
        slug: tenant.slug,
        corPrimaria: tenant.corPrimaria,
        logoUrl: tenant.logoUrl,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao obter design do cardápio:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao carregar design.' });
  }
});

/**
 * PUT /api/:tenant_slug/design
 * Salva as alterações de design, layout e identidade visual no Neon PostgreSQL.
 */
designRoutes.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant_id;
    const tenant = req.tenant;

    if (!tenantId || !tenant) {
      res.status(400).json({ sucesso: false, erro: 'Tenant não localizado.' });
      return;
    }

    const novosDados: Partial<DesignConfigData> = req.body;

    // 1. Prepara dados mesclados
    let configExistente: any = null;
    try {
      configExistente = await prisma.tenantConfig.findUnique({
        where: { tenantId },
      });
    } catch (_err) {}

    let designAtual: DesignConfigData = {
      ...DESIGN_PADRAO,
      corPrimaria: tenant.corPrimaria || DESIGN_PADRAO.corPrimaria,
      logoUrl: tenant.logoUrl || null,
      nomeRestaurante: tenant.nome || '',
      slogan: tenant.descricao || DESIGN_PADRAO.slogan,
    };

    const rawDesignConfig = (configExistente as any)?.designConfig;
    if (rawDesignConfig) {
      try {
        designAtual = { ...designAtual, ...JSON.parse(rawDesignConfig) };
      } catch (_e) {}
    }

    const designFinal: DesignConfigData = {
      ...designAtual,
      ...novosDados,
    };

    // 2. Atualiza Tenant (para campos nativos de sincronização rápida)
    const atualizacoesTenant: any = {};
    if (designFinal.corPrimaria) atualizacoesTenant.corPrimaria = designFinal.corPrimaria;
    if (designFinal.logoUrl !== undefined) atualizacoesTenant.logoUrl = designFinal.logoUrl;
    if (designFinal.nomeRestaurante && designFinal.nomeRestaurante.trim()) {
      atualizacoesTenant.nome = designFinal.nomeRestaurante.trim();
    }
    if (designFinal.slogan) atualizacoesTenant.descricao = designFinal.slogan;

    if (Object.keys(atualizacoesTenant).length > 0) {
      try {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: atualizacoesTenant,
        });
      } catch (_err) {
        console.warn('⚠️ Nota ao atualizar tenant base:', _err);
      }
    }

    // 3. Atualiza ou cria TenantConfig com o JSON completo
    try {
      await (prisma.tenantConfig as any).upsert({
        where: { tenantId },
        update: {
          designConfig: JSON.stringify(designFinal),
        },
        create: {
          tenantId,
          designConfig: JSON.stringify(designFinal),
        },
      });
    } catch (_err) {
      console.error('❌ Erro ao salvar TenantConfig.designConfig:', _err);
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Design do cardápio atualizado e sincronizado com sucesso!',
      design: designFinal,
    });
  } catch (error) {
    console.error('❌ Erro ao salvar design do cardápio:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao salvar configurações de design.' });
  }
});
