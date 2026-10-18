import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { RESTAURANTES_CATALOGO } from '../data/mockCardapios';

export const produtoRoutes = Router({ mergeParams: true });

// Aplica o middleware multi-tenant: valida o tenant_slug e injeta req.tenant_id
produtoRoutes.use(tenantMiddleware);

/**
 * GET /api/:tenant_slug/produtos/categorias
 * Retorna as categorias cadastradas para o tenant.
 */
produtoRoutes.get('/categorias', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant_id;
    if (!tenantId) {
      res.status(400).json({ sucesso: false, erro: 'Tenant ID não identificado.' });
      return;
    }

    const categorias = await prisma.categoria.findMany({
      where: { tenantId, ativa: true },
      orderBy: { ordem: 'asc' },
    });

    res.status(200).json({ sucesso: true, categorias });
  } catch (error) {
    console.error('❌ Erro ao listar categorias:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar categorias.' });
  }
});

/**
 * POST /api/:tenant_slug/produtos/categorias
 * Cria uma nova categoria para o tenant.
 */
produtoRoutes.post('/categorias', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant_id;
    const { nome, ordem } = req.body;

    if (!tenantId || !nome?.trim()) {
      res.status(400).json({ sucesso: false, erro: 'Nome da categoria é obrigatório.' });
      return;
    }

    const categoria = await prisma.categoria.upsert({
      where: {
        tenantId_nome: {
          tenantId,
          nome: nome.trim(),
        },
      },
      update: {
        ativa: true,
      },
      create: {
        tenantId,
        nome: nome.trim(),
        ordem: typeof ordem === 'number' ? ordem : 0,
      },
    });

    res.status(201).json({ sucesso: true, categoria });
  } catch (error) {
    console.error('❌ Erro ao criar categoria:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao cadastrar categoria.' });
  }
});

/**
 * GET /api/produtos ou /api/:tenant_slug/produtos
 * Lista os produtos cadastrados filtrando OBRIGATORIAMENTE por req.tenant_id.
 */
produtoRoutes.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant_id;
    const slug = req.tenant?.slug || (req.params.tenant_slug as string);

    if (!tenantId) {
      res.status(400).json({
        erro: 'Contexto de tenant ausente.',
        mensagem: 'O tenant_id não foi identificado para esta requisição.',
      });
      return;
    }

    let produtos: any[] = [];
    let config: any = null;

    // 1. Busca configurações e produtos com opcionais no Prisma Neon
    try {
      config = await prisma.tenantConfig.findUnique({
        where: { tenantId },
      });

      produtos = await prisma.produto.findMany({
        where: {
          tenantId: tenantId,
          disponivel: true,
        },
        include: {
          categoria: {
            select: {
              id: true,
              nome: true,
              ordem: true,
            },
          },
          gruposOpcao: {
            include: {
              grupo: {
                include: {
                  itens: {
                    where: { disponivel: true },
                    orderBy: { ordem: 'asc' },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          { categoria: { ordem: 'asc' } },
          { ordem: 'asc' },
          { nome: 'asc' },
        ],
      });
    } catch (_dbError) {
      // Banco indisponível ou offline em desenvolvimento
    }

    // 2. Fallback para os modelos do Dev Hub se a consulta ao banco não retornou itens
    if (produtos.length === 0 && slug && RESTAURANTES_CATALOGO[slug]) {
      const mockCatalog = RESTAURANTES_CATALOGO[slug];
      produtos = mockCatalog.produtos.map((p) => ({
        id: p.id,
        tenantId: mockCatalog.restaurante.id,
        categoriaId: p.categoria.id,
        nome: p.nome,
        descricao: p.descricao,
        precoBase: p.precoBase,
        imagemUrl: p.imagemUrl,
        categoria: p.categoria,
        gruposOpcao: [],
      }));
    }

    res.status(200).json({
      sucesso: true,
      restaurante: {
        id: req.tenant?.id,
        nome: req.tenant?.nome,
        slug: req.tenant?.slug,
        nicho: req.tenant?.nicho,
        corPrimaria: req.tenant?.corPrimaria,
        logoUrl: req.tenant?.logoUrl,
        descricao: req.tenant?.descricao,
        telefone: req.tenant?.telefone,
        horarioFuncionamento: config?.horarioFuncionamento || 'Seg - Dom • 12:00 às 23:00',
        config: config
          ? {
              taxaEntregaPadrao: Number(config.taxaEntregaPadrao),
              pedidoMinimo: Number(config.pedidoMinimo),
              tempoMedioPreparoMin: config.tempoMedioPreparoMin,
              tempoMedioEntregaMin: config.tempoMedioEntregaMin,
              chavePix: config.chavePix,
              aceitaMesa: config.aceitaMesa,
              aceitaRetirada: config.aceitaRetirada,
              aceitaDelivery: config.aceitaDelivery,
              aceitaPix: config.aceitaPix,
              aceitaCartao: config.aceitaCartao,
              aceitaDinheiro: config.aceitaDinheiro,
            }
          : null,
      },
      total: produtos.length,
      produtos,
    });
  } catch (error) {
    console.error('❌ Erro ao listar produtos no tenant:', error);
    res.status(500).json({
      erro: 'Falha interna ao recuperar a lista de produtos.',
    });
  }
});

/**
 * POST /api/:tenant_slug/produtos
 * Cadastra um novo produto no catálogo do restaurante.
 */
produtoRoutes.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant_id;
    if (!tenantId) {
      res.status(400).json({ sucesso: false, erro: 'Tenant ID não identificado.' });
      return;
    }

    const {
      nome,
      descricao,
      precoBase,
      imagemUrl,
      categoriaId,
      categoriaNome,
      destaque,
      disponivel,
    } = req.body;

    if (!nome?.trim() || nome.trim().length < 2) {
      res.status(400).json({ sucesso: false, erro: 'O nome do produto é obrigatório e deve ter no mínimo 2 caracteres.' });
      return;
    }

    if (precoBase === undefined || precoBase === null || precoBase === '') {
      res.status(400).json({ sucesso: false, erro: 'O preço base é obrigatório.' });
      return;
    }

    const precoSanitizado = typeof precoBase === 'string'
      ? precoBase.replace(/[^\d.,]/g, '').replace(',', '.')
      : precoBase;
    const precoNumero = parseFloat(precoSanitizado);
    if (isNaN(precoNumero) || precoNumero <= 0) {
      res.status(400).json({ sucesso: false, erro: 'Preço base inválido. O valor deve ser um número maior que zero.' });
      return;
    }

    let finalCategoriaId = categoriaId;

    // Se categoriaId não foi fornecido mas categoriaNome sim, busca ou cria
    if (!finalCategoriaId && categoriaNome?.trim()) {
      const cat = await prisma.categoria.upsert({
        where: {
          tenantId_nome: {
            tenantId,
            nome: categoriaNome.trim(),
          },
        },
        update: {},
        create: {
          tenantId,
          nome: categoriaNome.trim(),
        },
      });
      finalCategoriaId = cat.id;
    }

    // Se ainda não tiver categoria, vincula à primeira ou cria 'Geral'
    if (!finalCategoriaId) {
      const primeiraCat = await prisma.categoria.findFirst({
        where: { tenantId },
      });
      if (primeiraCat) {
        finalCategoriaId = primeiraCat.id;
      } else {
        const catGeral = await prisma.categoria.create({
          data: {
            tenantId,
            nome: 'Geral',
          },
        });
        finalCategoriaId = catGeral.id;
      }
    }

    const novoProduto = await prisma.produto.create({
      data: {
        tenantId,
        categoriaId: finalCategoriaId,
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        precoBase: precoNumero,
        imagemUrl: imagemUrl?.trim() || null,
        destaque: Boolean(destaque),
        disponivel: disponivel !== undefined ? Boolean(disponivel) : true,
      },
      include: {
        categoria: true,
      },
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Produto cadastrado com sucesso!',
      produto: novoProduto,
    });
  } catch (error) {
    console.error('❌ Erro ao cadastrar produto:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao cadastrar o produto.' });
  }
});

/**
 * PUT /api/:tenant_slug/produtos/:id
 * Atualiza um produto existente garantindo isolamento por tenantId.
 */
produtoRoutes.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant_id;
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : String(rawId);

    if (!tenantId) {
      res.status(400).json({ sucesso: false, erro: 'Tenant ID não identificado.' });
      return;
    }

    // Valida que o produto pertence a este tenant
    const produtoExistente = await prisma.produto.findFirst({
      where: { id, tenantId },
    });

    if (!produtoExistente) {
      res.status(404).json({ sucesso: false, erro: 'Produto não encontrado para este estabelecimento.' });
      return;
    }

    const {
      nome,
      descricao,
      precoBase,
      imagemUrl,
      categoriaId,
      categoriaNome,
      destaque,
      disponivel,
    } = req.body;

    const dataAtualizacao: any = {};
    if (nome !== undefined) {
      if (!nome.trim() || nome.trim().length < 2) {
        res.status(400).json({ sucesso: false, erro: 'O nome do produto deve ter no mínimo 2 caracteres.' });
        return;
      }
      dataAtualizacao.nome = nome.trim();
    }
    if (descricao !== undefined) dataAtualizacao.descricao = descricao?.trim() || null;
    if (precoBase !== undefined) {
      const precoSanitizado = typeof precoBase === 'string'
        ? precoBase.replace(/[^\d.,]/g, '').replace(',', '.')
        : precoBase;
      const precoNumero = parseFloat(precoSanitizado);
      if (isNaN(precoNumero) || precoNumero <= 0) {
        res.status(400).json({ sucesso: false, erro: 'Preço base inválido. O valor deve ser um número maior que zero.' });
        return;
      }
      dataAtualizacao.precoBase = precoNumero;
    }
    if (imagemUrl !== undefined) dataAtualizacao.imagemUrl = imagemUrl?.trim() || null;

    if (categoriaId !== undefined) {
      dataAtualizacao.categoriaId = categoriaId;
    } else if (categoriaNome?.trim()) {
      const cat = await prisma.categoria.upsert({
        where: {
          tenantId_nome: {
            tenantId,
            nome: categoriaNome.trim(),
          },
        },
        update: {},
        create: {
          tenantId,
          nome: categoriaNome.trim(),
        },
      });
      dataAtualizacao.categoriaId = cat.id;
    }

    if (destaque !== undefined) dataAtualizacao.destaque = Boolean(destaque);
    if (disponivel !== undefined) dataAtualizacao.disponivel = Boolean(disponivel);

    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: dataAtualizacao,
      include: {
        categoria: true,
      },
    });

    res.status(200).json({
      sucesso: true,
      mensagem: 'Produto atualizado com sucesso!',
      produto: produtoAtualizado,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao atualizar o produto.' });
  }
});

/**
 * DELETE /api/:tenant_slug/produtos/:id
 * Remove um produto do catálogo garantindo isolamento por tenantId.
 */
produtoRoutes.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant_id;
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : String(rawId);

    if (!tenantId) {
      res.status(400).json({ sucesso: false, erro: 'Tenant ID não identificado.' });
      return;
    }

    const produtoExistente = await prisma.produto.findFirst({
      where: { id, tenantId },
    });

    if (!produtoExistente) {
      res.status(404).json({ sucesso: false, erro: 'Produto não encontrado para este estabelecimento.' });
      return;
    }

    await prisma.produto.delete({
      where: { id },
    });

    res.status(200).json({
      sucesso: true,
      mensagem: 'Produto excluído do cardápio com sucesso!',
    });
  } catch (error) {
    console.error('❌ Erro ao excluir produto:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao excluir o produto.' });
  }
});
