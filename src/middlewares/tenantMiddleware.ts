import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Middleware Multi-Tenant
 *
 * Intercepta todas as requisições direcionadas ao cardápio público ou rotas de inquilinos.
 * Lê o parâmetro tenant_slug (oriundo de headers ou da URL - rota/query params),
 * busca o Tenant no banco via Prisma e injeta tenant_id e o tenant completo no objeto req.
 * Se o slug não for encontrado no banco de dados, encerra com HTTP 404.
 */
export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extração do parâmetro tenant_slug (via header ou URL: query ou params)
    const headerSlug = req.headers['tenant_slug'] || req.headers['x-tenant-slug'];
    const paramSlug = req.params.tenant_slug;
    const querySlug = req.query.tenant_slug;

    const rawSlug = headerSlug || paramSlug || querySlug;

    const tenantSlug =
      typeof rawSlug === 'string'
        ? rawSlug.trim()
        : Array.isArray(rawSlug) && typeof rawSlug[0] === 'string'
        ? rawSlug[0].trim()
        : undefined;

    // Se nenhum slug foi informado na requisição
    if (!tenantSlug) {
      res.status(400).json({
        erro: 'Identificador tenant_slug ausente.',
        mensagem:
          'Informe o tenant_slug no Header (tenant_slug ou x-tenant-slug) ou na URL (?tenant_slug=... / :tenant_slug).',
      });
      return;
    }

    // 2. Busca do Tenant no banco de dados Neon via Prisma
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: tenantSlug,
      },
    });

    // 3. Se o slug não existir, retorna erro 404 conforme solicitado
    if (!tenant) {
      res.status(404).json({
        erro: 'Restaurante não encontrado (Tenant 404).',
        mensagem: `Nenhum restaurante ativo foi localizado com o slug: "${tenantSlug}".`,
      });
      return;
    }

    // 4. Injeção obrigatória do tenant_id no objeto req do Express
    req.tenant_id = tenant.id;
    req.tenantId = tenant.id; // compatibilidade camelCase
    req.tenant = tenant;

    // Prossegue para a rota solicitada
    next();
  } catch (error) {
    console.error('❌ Erro no processamento do tenantMiddleware:', error);
    res.status(500).json({
      erro: 'Erro interno ao resolver o tenant da requisição.',
    });
  }
}
