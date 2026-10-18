import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { RESTAURANTES_CATALOGO } from '../data/mockCardapios';

/**
 * Middleware Multi-Tenant
 *
 * Intercepta todas as requisições direcionadas ao cardápio público ou rotas de inquilinos.
 * Lê o parâmetro tenant_slug (oriundo de headers ou da URL - rota/query params),
 * busca o Tenant no banco via Prisma e injeta tenant_id e o tenant completo no objeto req.
 * Se o slug não for encontrado no banco de dados, encerra com HTTP 404 (ou recorre aos modelos cadastrados).
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
    let tenant = null;
    try {
      tenant = await prisma.tenant.findUnique({
        where: {
          slug: tenantSlug,
        },
      });
    } catch (_dbError) {
      // Banco de dados pode estar offline ou não inicializado
    }

    // 3. Fallback inteligente para os modelos registrados no catálogo Dev Hub
    if (!tenant && RESTAURANTES_CATALOGO[tenantSlug]) {
      const mock = RESTAURANTES_CATALOGO[tenantSlug].restaurante;
      tenant = {
        id: mock.id,
        nome: mock.nome,
        slug: mock.slug,
        nicho: (mock.nicho?.toUpperCase() || 'OUTRO') as any,
        corPrimaria: mock.corPrimaria,
        logoUrl: mock.logoUrl || null,
        descricao: mock.descricao || null,
        telefone: '(11) 98765-4321',
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };
    }

    // 4. Se o slug não existir em nenhuma fonte, retorna erro 404
    if (!tenant) {
      res.status(404).json({
        erro: 'Restaurante não encontrado (Tenant 404).',
        mensagem: `Nenhum restaurante ativo foi localizado com o slug: "${tenantSlug}".`,
      });
      return;
    }

    // 5. Injeção obrigatória do tenant_id no objeto req do Express
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

