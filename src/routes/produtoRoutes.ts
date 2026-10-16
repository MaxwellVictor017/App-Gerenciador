import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

export const produtoRoutes = Router({ mergeParams: true });

// Aplica o middleware multi-tenant: valida o tenant_slug e injeta req.tenant_id
produtoRoutes.use(tenantMiddleware);

/**
 * GET /api/produtos
 * Lista os produtos cadastrados filtrando OBRIGATORIAMENTE por req.tenant_id.
 * Garante o isolamento estrito entre inquilinos no ambiente multi-tenant.
 */
produtoRoutes.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Isolamento obrigatório: utiliza o req.tenant_id injetado pelo tenantMiddleware
    const tenantId = req.tenant_id;

    if (!tenantId) {
      res.status(400).json({
        erro: 'Contexto de tenant ausente.',
        mensagem: 'O tenant_id não foi identificado para esta requisição.',
      });
      return;
    }

    // Consulta no Prisma filtrando estritamente pelo tenantId
    const produtos = await prisma.produto.findMany({
      where: {
        tenantId: tenantId,
      },
      include: {
        categoria: {
          select: {
            id: true,
            nome: true,
            ordem: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });

    res.status(200).json({
      sucesso: true,
      restaurante: {
        id: req.tenant?.id,
        nome: req.tenant?.nome,
        slug: req.tenant?.slug,
        corPrimaria: req.tenant?.corPrimaria,
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
