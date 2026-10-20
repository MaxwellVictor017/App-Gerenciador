import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { RESTAURANTES_CATALOGO } from '../data/mockCardapios';

export const tenantRoutes = Router();

// Mapeamento de nicho em minúsculas para o enum do Prisma
const NICHO_MAP: Record<string, 'PIZZARIA' | 'HAMBURGUERIA' | 'RESTAURANTE' | 'BAR' | 'ORIENTAL' | 'CAFETERIA' | 'OUTRO'> = {
  pizzaria: 'PIZZARIA',
  hamburgueria: 'HAMBURGUERIA',
  restaurante: 'RESTAURANTE',
  bar: 'BAR',
  oriental: 'ORIENTAL',
  cafeteria: 'CAFETERIA',
  outro: 'OUTRO',
};

const NICHO_REVERSE_MAP: Record<string, string> = {
  PIZZARIA: 'pizzaria',
  HAMBURGUERIA: 'hamburgueria',
  RESTAURANTE: 'restaurante',
  BAR: 'bar',
  ORIENTAL: 'oriental',
  CAFETERIA: 'cafeteria',
  OUTRO: 'outro',
};

// Ícones e gradientes padrão por nicho
const NICHOS_METADATA: Record<string, { icone: string; bannerGradient: string; categoriaTag: string }> = {
  pizzaria: {
    icone: '🍕',
    bannerGradient: 'from-rose-600 via-rose-700 to-rose-900',
    categoriaTag: 'Pizzaria Artesanal',
  },
  hamburgueria: {
    icone: '🍔',
    bannerGradient: 'from-orange-600 via-amber-700 to-amber-900',
    categoriaTag: 'Hamburgueria & Smash',
  },
  restaurante: {
    icone: '🥩',
    bannerGradient: 'from-teal-700 via-emerald-800 to-slate-950',
    categoriaTag: 'Restaurante & Grill',
  },
  bar: {
    icone: '🍺',
    bannerGradient: 'from-amber-600 via-amber-700 to-yellow-950',
    categoriaTag: 'Bar & Petiscaria',
  },
  oriental: {
    icone: '🍣',
    bannerGradient: 'from-red-600 via-slate-900 to-red-950',
    categoriaTag: 'Sushi Bar & Oriental',
  },
  cafeteria: {
    icone: '☕',
    bannerGradient: 'from-amber-800 via-yellow-900 to-amber-950',
    categoriaTag: 'Cafeteria & Confeitaria',
  },
  outro: {
    icone: '🍽️',
    bannerGradient: 'from-indigo-600 via-purple-700 to-slate-950',
    categoriaTag: 'Gastronomia Diversa',
  },
};

/**
 * GET /api/tenants/mascaras
 * Retorna as máscaras (templates) disponíveis para clonagem
 */
tenantRoutes.get('/mascaras', (_req: Request, res: Response) => {
  const mascaras = Object.entries(RESTAURANTES_CATALOGO).map(([slug, catalogo]) => ({
    slug,
    nome: catalogo.restaurante.nome,
    nicho: catalogo.restaurante.nicho,
    categoriaTag: catalogo.restaurante.categoriaTag,
    icone: catalogo.restaurante.icone,
    corPrimaria: catalogo.restaurante.corPrimaria,
    bannerGradient: catalogo.restaurante.bannerGradient,
    tags: catalogo.restaurante.tags,
    logoUrl: catalogo.restaurante.logoUrl,
    descricao: catalogo.restaurante.descricao,
    totalItens: catalogo.total,
    categorias: Array.from(new Set(catalogo.produtos.map((p) => p.categoria.nome))),
    exemplosProdutos: catalogo.produtos.slice(0, 3).map((p) => p.nome),
  }));

  // Adiciona a opção em branco
  mascaras.push({
    slug: 'limpo',
    nome: 'Modelo em Branco',
    nicho: 'outro' as any,
    categoriaTag: 'Personalizado do Zero',
    icone: '⚡',
    corPrimaria: '#3B82F6',
    bannerGradient: 'from-blue-600 via-indigo-700 to-slate-950',
    tags: ['Personalizável', 'Do Zero', 'Flexível'],
    logoUrl: null,
    descricao: 'Inicie com um modelo limpo para cadastrar manualmente suas próprias categorias e itens.',
    totalItens: 0,
    categorias: ['Geral'],
    exemplosProdutos: [],
  });

  res.status(200).json({ sucesso: true, mascaras });
});

/**
 * GET /api/tenants
 * Lista todos os estabelecimentos cadastrados no Neon DB com fallback dos templates
 */
tenantRoutes.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    let tenantsDoBanco: any[] = [];
    try {
      tenantsDoBanco = await prisma.tenant.findMany({
        include: {
          configuracao: true,
          categorias: {
            where: { ativa: true },
            select: { id: true, nome: true },
            orderBy: { ordem: 'asc' },
          },
          _count: {
            select: {
              produtos: true,
              mesas: true,
              funcionarios: true,
            },
          },
        },
        orderBy: { criadoEm: 'desc' },
      });
    } catch (dbErr) {
      console.warn('⚠️ Falha ao consultar tenants no Neon DB:', dbErr);
    }

    const slugsBanco = new Set(tenantsDoBanco.map((t) => t.slug));

    // Formata tenants vindos do banco de dados Neon
    const formatadosBanco = tenantsDoBanco.map((t) => {
      const nichoStr = NICHO_REVERSE_MAP[t.nicho] || 'outro';
      const meta = NICHOS_METADATA[nichoStr] || NICHOS_METADATA.outro;

      // Se existir máscara original associada ao slug
      const templateOriginal = RESTAURANTES_CATALOGO[t.slug]?.restaurante;

      return {
        id: t.id,
        nome: t.nome,
        slug: t.slug,
        nicho: nichoStr,
        categoriaTag: templateOriginal?.categoriaTag || meta.categoriaTag,
        icone: templateOriginal?.icone || meta.icone,
        corPrimaria: t.corPrimaria || '#E11D48',
        bannerGradient: templateOriginal?.bannerGradient || meta.bannerGradient,
        tags: templateOriginal?.tags || ['Cardápio Online', 'Delivery', 'QR Code Mesa'],
        logoUrl: t.logoUrl,
        descricao: t.descricao || 'Cardápio digital oficial para pedidos e atendimento.',
        totalItens: t._count?.produtos || 0,
        categorias: t.categorias.map((c: any) => c.nome),
        totalMesas: t._count?.mesas || 10,
        totalFuncionarios: t._count?.funcionarios || 0,
        origem: 'banco',
        ativo: t.ativo,
        criadoEm: t.criadoEm,
      };
    });

    // Se houver máscaras estáticas que ainda não estejam no banco, mescla como templates disponíveis
    const formatadosTemplates = Object.values(RESTAURANTES_CATALOGO)
      .filter((catalogo) => !slugsBanco.has(catalogo.restaurante.slug))
      .map((catalogo) => ({
        ...catalogo.restaurante,
        totalItens: catalogo.total,
        categorias: Array.from(new Set(catalogo.produtos.map((p) => p.categoria.nome))),
        totalMesas: 10,
        totalFuncionarios: 4,
        origem: 'template',
        ativo: true,
      }));

    // Combina: tenants do banco vêm primeiro, depois os templates
    const listaCompleta = [...formatadosBanco, ...formatadosTemplates];

    res.status(200).json({
      sucesso: true,
      total: listaCompleta.length,
      estabelecimentos: listaCompleta,
    });
  } catch (error: any) {
    console.error('❌ Erro ao listar estabelecimentos:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar estabelecimentos.' });
  }
});

/**
 * POST /api/tenants
 * Cria um novo estabelecimento clonando a máscara escolhida
 */
tenantRoutes.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      nome,
      slug: rawSlug,
      nicho = 'outro',
      corPrimaria,
      descricao,
      telefone,
      logoUrl,
      mascaraBase = 'limpo',
    } = req.body;

    if (!nome || !nome.trim()) {
      res.status(400).json({ sucesso: false, erro: 'O nome do estabelecimento é obrigatório.' });
      return;
    }

    // Normaliza o slug
    const slug = (rawSlug || nome)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .trim();

    if (!slug) {
      res.status(400).json({ sucesso: false, erro: 'Slug inválido para o estabelecimento.' });
      return;
    }

    // Verifica se slug já existe no banco de dados
    const tenantExistente = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (tenantExistente) {
      res.status(409).json({
        sucesso: false,
        erro: `O identificador /${slug} já está em uso. Por favor, escolha outro nome ou slug.`,
      });
      return;
    }

    // Define cor e nicho
    const nichoEnum = NICHO_MAP[nicho.toLowerCase()] || 'OUTRO';
    const nichoStr = nicho.toLowerCase();
    const metaNicho = NICHOS_METADATA[nichoStr] || NICHOS_METADATA.outro;

    // Obtém dados da máscara base se existir
    const mascara = RESTAURANTES_CATALOGO[mascaraBase];
    const corFinal = corPrimaria || mascara?.restaurante.corPrimaria || '#E11D48';
    const logoFinal = logoUrl || mascara?.restaurante.logoUrl || null;
    const descFinal = descricao || mascara?.restaurante.descricao || `Bem-vindo ao cardápio digital oficial de ${nome}.`;

    console.log(`🚀 Criando estabelecimento "${nome}" (slug: ${slug}) usando máscara base "${mascaraBase}"...`);

    // 1. Cria o Tenant no Neon DB
    const novoTenant = await prisma.tenant.create({
      data: {
        nome: nome.trim(),
        slug,
        nicho: nichoEnum,
        corPrimaria: corFinal,
        logoUrl: logoFinal,
        descricao: descFinal,
        telefone: telefone || '(11) 98765-4321',
        ativo: true,
      },
    });

    // 2. Cria as configurações operacionais (TenantConfig)
    await prisma.tenantConfig.create({
      data: {
        tenantId: novoTenant.id,
        chavePix: `${slug}@pixcardapio.com.br`,
        titularPix: nome.trim(),
        tipoChavePix: 'EMAIL',
        taxaEntregaPadrao: 8.0,
        pedidoMinimo: 20.0,
        tempoMedioPreparoMin: 30,
        tempoMedioEntregaMin: 45,
        aceitaMesa: true,
        aceitaRetirada: true,
        aceitaDelivery: true,
        aceitaPix: true,
        aceitaCartao: true,
        aceitaDinheiro: true,
        horarioFuncionamento: 'Seg - Dom • 11:30 às 23:30',
        enderecoCompleto: 'Endereço Comercial Configurado no SaaS',
      },
    });

    // 3. Cria 10 mesas padrão para atendimento por QR Code
    const mesasData = Array.from({ length: 10 }, (_, i) => ({
      tenantId: novoTenant.id,
      numero: i + 1,
      qrCodeUrl: `https://cardapio.online/${slug}?mesa=${i + 1}`,
      status: 'LIVRE' as const,
    }));
    await prisma.mesa.createMany({ data: mesasData });

    // 4. Cria equipe inicial padrão para o novo restaurante
    const equipeInicial = [
      { nome: 'Gerente Geral', cargo: 'GERENTE' as const, email: `gerente@${slug}.com.br`, telefone: '(11) 98111-2233' },
      { nome: 'Atendente de Mesa', cargo: 'GARCOM' as const, email: `atendimento@${slug}.com.br`, telefone: '(11) 98222-3344' },
      { nome: 'Chef da Cozinha', cargo: 'COZINHEIRO' as const, email: `cozinha@${slug}.com.br`, telefone: '(11) 98333-4455' },
      { nome: 'Operador de Caixa', cargo: 'CAIXA' as const, email: `caixa@${slug}.com.br`, telefone: '(11) 98444-5566' },
    ];
    await prisma.funcionario.createMany({
      data: equipeInicial.map((f) => ({
        tenantId: novoTenant.id,
        ...f,
        ativo: true,
      })),
    });

    // 5. Clona Categorias, Produtos e Opcionais se houver máscara
    if (mascara && Array.isArray(mascara.produtos) && mascara.produtos.length > 0) {
      // Agrupa categorias da máscara
      const categoriasUnicas = Array.from(
        new Map(mascara.produtos.map((p) => [p.categoria.nome, p.categoria])).values()
      );

      // Mapa de nome da categoria -> Categoria criada no banco
      const categoriaMap = new Map<string, string>();

      for (let i = 0; i < categoriasUnicas.length; i++) {
        const catMock = categoriasUnicas[i];
        const catCriada = await prisma.categoria.create({
          data: {
            tenantId: novoTenant.id,
            nome: catMock.nome,
            ordem: catMock.ordem || i + 1,
            ativa: true,
          },
        });
        categoriaMap.set(catMock.nome, catCriada.id);
      }

      // Cria os produtos vinculados
      for (let j = 0; j < mascara.produtos.length; j++) {
        const p = mascara.produtos[j];
        const categoriaId = categoriaMap.get(p.categoria.nome);
        if (categoriaId) {
          await prisma.produto.create({
            data: {
              tenantId: novoTenant.id,
              categoriaId,
              nome: p.nome,
              descricao: p.descricao || null,
              precoBase: p.precoBase,
              imagemUrl: p.imagemUrl || null,
              disponivel: true,
              destaque: j < 2,
              ordem: j + 1,
            },
          });
        }
      }

      // Cria grupo de adicionais/opcionais específico da máscara
      const grupoOpcional = await prisma.grupoOpcional.create({
        data: {
          tenantId: novoTenant.id,
          nome: nichoStr === 'pizzaria' ? 'Bordas Especiais' : nichoStr === 'hamburgueria' ? 'Adicionais Extras' : 'Complementos da Casa',
          minimo: 0,
          maximo: 3,
          obrigatorio: false,
          ordem: 1,
          itens: {
            create: [
              {
                nome: nichoStr === 'pizzaria' ? 'Borda Recheada Catupiry' : nichoStr === 'hamburgueria' ? 'Bacon Crocante Extra' : 'Porção Extra de Molho',
                preco: 10.0,
                disponivel: true,
                ordem: 1,
              },
              {
                nome: nichoStr === 'pizzaria' ? 'Borda Recheada Cheddar' : nichoStr === 'hamburgueria' ? 'Queijo Cheddar Inglês' : 'Farofa Especial da Casa',
                preco: 8.5,
                disponivel: true,
                ordem: 2,
              },
            ],
          },
        },
      });

      // Vincula o grupo opcional aos produtos
      const produtosCriados = await prisma.produto.findMany({
        where: { tenantId: novoTenant.id },
      });
      for (const prod of produtosCriados) {
        await prisma.produtoGrupoOpcional.create({
          data: {
            produtoId: prod.id,
            grupoOpcionalId: grupoOpcional.id,
          },
        });
      }
    } else {
      // Modelo em Branco: Cria uma categoria padrão e um item modelo
      const catPadrao = await prisma.categoria.create({
        data: {
          tenantId: novoTenant.id,
          nome: 'Cardápio Principal',
          ordem: 1,
          ativa: true,
        },
      });

      await prisma.produto.create({
        data: {
          tenantId: novoTenant.id,
          categoriaId: catPadrao.id,
          nome: 'Item Inicial Modelo',
          descricao: 'Este é um produto exemplo cadastrado na criação do estabelecimento. Edite ou adicione novos itens no Painel ADM.',
          precoBase: 25.0,
          imagemUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
          disponivel: true,
          destaque: true,
          ordem: 1,
        },
      });
    }

    console.log(`✅ Estabelecimento "${nome}" (slug: ${slug}) criado com sucesso no Neon DB!`);

    res.status(201).json({
      sucesso: true,
      mensagem: `Estabelecimento "${nome}" criado com sucesso!`,
      tenant: {
        id: novoTenant.id,
        nome: novoTenant.nome,
        slug: novoTenant.slug,
        nicho: nichoStr,
        corPrimaria: novoTenant.corPrimaria,
        logoUrl: novoTenant.logoUrl,
      },
      rotas: {
        cardapio: `/${slug}`,
        admin: `/${slug}/admin`,
        carrinho: `/${slug}/carrinho`,
        api: `/api/${slug}/produtos`,
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar estabelecimento:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Falha ao criar o estabelecimento no banco de dados.',
    });
  }
});

/**
 * DELETE /api/tenants/:slug
 * Exclui o estabelecimento e todos os registros associados no Neon PostgreSQL
 */
tenantRoutes.delete('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    if (!slug) {
      res.status(400).json({ sucesso: false, erro: 'Slug do estabelecimento é obrigatório.' });
      return;
    }

    // Busca o tenant no banco
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      res.status(404).json({
        sucesso: false,
        erro: `Estabelecimento com identificador /${slug} não encontrado no banco de dados.`,
      });
      return;
    }

    const tenantId = tenant.id;
    console.log(`🗑️ Excluindo estabelecimento "${tenant.nome}" (${slug}) do Neon DB...`);

    // Limpeza em ordem de integridade referencial
    await prisma.itemPedidoOpcional.deleteMany({
      where: {
        itemPedido: {
          pedido: { tenantId },
        },
      },
    });

    await prisma.itemPedido.deleteMany({
      where: {
        pedido: { tenantId },
      },
    });

    await prisma.transacaoPix.deleteMany({
      where: { tenantId },
    });

    await prisma.avaliacao.deleteMany({
      where: { tenantId },
    });

    await prisma.pedido.deleteMany({
      where: { tenantId },
    });

    await prisma.cliente.deleteMany({
      where: { tenantId },
    });

    await prisma.produtoGrupoOpcional.deleteMany({
      where: {
        produto: { tenantId },
      },
    });

    await prisma.itemOpcional.deleteMany({
      where: {
        grupo: { tenantId },
      },
    });

    await prisma.grupoOpcional.deleteMany({
      where: { tenantId },
    });

    await prisma.produto.deleteMany({
      where: { tenantId },
    });

    await prisma.categoria.deleteMany({
      where: { tenantId },
    });

    await prisma.mesa.deleteMany({
      where: { tenantId },
    });

    await prisma.cupomDesconto.deleteMany({
      where: { tenantId },
    });

    await prisma.funcionario.deleteMany({
      where: { tenantId },
    });

    await prisma.tenantConfig.deleteMany({
      where: { tenantId },
    });

    // Por fim, deleta o Tenant
    await prisma.tenant.delete({
      where: { id: tenantId },
    });

    console.log(`✅ Estabelecimento "${tenant.nome}" (${slug}) excluído com sucesso do Neon DB!`);

    res.status(200).json({
      sucesso: true,
      mensagem: `Estabelecimento "${tenant.nome}" (/${slug}) e todos os seus dados foram excluídos com sucesso.`,
    });
  } catch (error: any) {
    console.error('❌ Erro ao excluir estabelecimento:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Falha ao excluir o estabelecimento no banco de dados.',
    });
  }
});
