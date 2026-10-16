import { Router, Request, Response } from 'express';

export const pedidoRoutes = Router();

/**
 * POST /api/pedidos
 * Cria um novo pedido multi-tenant no sistema.
 * Suporta modalidades: Mesa, Retirada e Delivery.
 * Suporta métodos de pagamento: Pix, Cartão e Dinheiro (com troco).
 */
pedidoRoutes.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      tenant_slug,
      tipo_pedido,
      cliente,
      pagamento,
      itens,
      subtotal,
      taxa_entrega,
      total,
      criado_em,
    } = req.body;

    const pedidoId = `PED-${Date.now().toString().slice(-6)}`;

    const novoPedido = {
      id: pedidoId,
      tenantSlug: tenant_slug,
      tipoPedido: tipo_pedido,
      cliente,
      pagamento,
      itens,
      subtotal: subtotal || total,
      taxaEntrega: taxa_entrega || 0,
      total,
      status: 'RECEBIDO_COZINHA',
      criadoEm: criado_em || new Date().toISOString(),
    };

    console.log(`📦 [NOVO PEDIDO] ${pedidoId} (${tipo_pedido}) - Total: R$ ${total}`);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Pedido registrado com sucesso!',
      pedido: novoPedido,
    });
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Falha interna ao processar o pedido.',
    });
  }
});
