import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { RESTAURANTES_CATALOGO } from '../data/mockCardapios';

export const pedidoRoutes = Router({ mergeParams: true });

// Store em memória resiliente para testes locais em desenvolvimento quando DB estiver offline
const PEDIDOS_MEMORIA: any[] = [];

/**
 * GET /api/pedidos/estatisticas
 * Retorna métricas globais e por tenant para o Dev Hub e Dashboard Operacional.
 */
pedidoRoutes.get('/estatisticas', async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    let totalTenants = 6;
    let totalProdutos = 37;
    let totalMesas = 60;
    let totalPedidos = 0;
    let pedidosRecebidos = 0;
    let pedidosEmPreparo = 0;
    let pedidosProntos = 0;
    let pedidosFinalizados = 0;
    let totalFaturado = 0;

    try {
      totalTenants = await prisma.tenant.count();
      totalProdutos = await prisma.produto.count();
      totalMesas = await prisma.mesa.count();
      totalPedidos = await prisma.pedido.count();

      const porStatus = await prisma.pedido.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { total: true },
      });

      porStatus.forEach((item) => {
        const count = item._count.id;
        const sum = Number(item._sum.total) || 0;
        totalFaturado += sum;

        if (item.status === 'RECEBIDO') pedidosRecebidos = count;
        if (item.status === 'EM_PREPARO') pedidosEmPreparo = count;
        if (item.status === 'PRONTO_ENTREGA') pedidosProntos = count;
        if (item.status === 'FINALIZADO') pedidosFinalizados = count;
      });
    } catch (_dbErr) {
      // Fallback em memória
      totalPedidos = PEDIDOS_MEMORIA.length;
      PEDIDOS_MEMORIA.forEach((p) => {
        totalFaturado += Number(p.total) || 0;
        if (p.status === 'RECEBIDO') pedidosRecebidos++;
        if (p.status === 'EM_PREPARO') pedidosEmPreparo++;
        if (p.status === 'PRONTO_ENTREGA') pedidosProntos++;
        if (p.status === 'FINALIZADO') pedidosFinalizados++;
      });
    }

    res.status(200).json({
      sucesso: true,
      estatisticas: {
        totalTenants,
        totalProdutos,
        totalMesas,
        totalPedidos,
        pedidosRecebidos,
        pedidosEmPreparo,
        pedidosProntos,
        pedidosFinalizados,
        totalFaturado: Number(totalFaturado.toFixed(2)),
        banco: 'Neon PostgreSQL Serverless (sa-east-1)',
      },
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Falha ao recuperar métricas da base.',
    });
  }
});

/**
 * GET /api/pedidos/cupons/validar
 * Valida se um cupom promocional existe e calcula o desconto.
 */
pedidoRoutes.get('/cupons/validar', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSlug = (req.params.tenant_slug as string) || (req.query.tenant_slug as string) || (req.headers['x-tenant-slug'] as string);
    const tenantSlug = typeof rawSlug === 'string' ? rawSlug.trim() : '';
    const codigo = ((req.query.codigo as string) || '').trim().toUpperCase();
    const subtotal = parseFloat(req.query.subtotal as string) || 0;

    if (!tenantSlug || !codigo) {
      res.status(400).json({
        sucesso: false,
        erro: 'Informe o tenant_slug e o código do cupom.',
      });
      return;
    }

    let cupomValido = null;

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });

      if (tenant) {
        cupomValido = await prisma.cupomDesconto.findUnique({
          where: {
            tenantId_codigo: {
              tenantId: tenant.id,
              codigo: codigo,
            },
          },
        });
      }
    } catch (_dbErr) {}

    // Fallback para códigos padrão se DB offline
    if (!cupomValido) {
      if (codigo === 'PRIMEIRACOMPRA') {
        cupomValido = {
          id: 'mock-cupom-1',
          codigo: 'PRIMEIRACOMPRA',
          tipo: 'PERCENTUAL',
          valor: 10.0,
          valorMinimo: 30.0,
          ativo: true,
        };
      } else if (codigo === 'VIP15') {
        cupomValido = {
          id: 'mock-cupom-2',
          codigo: 'VIP15',
          tipo: 'VALOR_FIXO',
          valor: 15.0,
          valorMinimo: 50.0,
          ativo: true,
        };
      }
    }

    if (!cupomValido || !cupomValido.ativo) {
      res.status(404).json({
        sucesso: false,
        erro: 'Cupom inválido ou expirado.',
      });
      return;
    }

    const valorMinimo = Number(cupomValido.valorMinimo);
    if (subtotal < valorMinimo) {
      res.status(400).json({
        sucesso: false,
        erro: `Este cupom requer um pedido mínimo de R$ ${valorMinimo.toFixed(2)}.`,
      });
      return;
    }

    let desconto = 0;
    const valorCupom = Number(cupomValido.valor);

    if (cupomValido.tipo === 'PERCENTUAL') {
      desconto = (subtotal * valorCupom) / 100;
    } else {
      desconto = Math.min(valorCupom, subtotal);
    }

    res.status(200).json({
      sucesso: true,
      mensagem: `Cupom ${codigo} aplicado com sucesso!`,
      cupom: {
        id: cupomValido.id,
        codigo: cupomValido.codigo,
        tipo: cupomValido.tipo,
        valor: valorCupom,
        descontoCalculado: Number(desconto.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('❌ Erro ao validar cupom:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Falha ao validar cupom.',
    });
  }
});

/**
 * POST /api/pedidos ou /api/:tenant_slug/pedidos
 * Cria e persiste um novo pedido com isolamento estrito por tenant.
 */
pedidoRoutes.post('/', async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    const rawSlug =
      (req.params.tenant_slug as string) ||
      (req.body?.tenant_slug as string) ||
      (req.headers['x-tenant-slug'] as string) ||
      (req.headers['tenant_slug'] as string) ||
      (req.query?.tenant_slug as string);

    const tenantSlug = typeof rawSlug === 'string' ? rawSlug.trim() : '';

    const {
      tipo_pedido,
      cliente,
      pagamento,
      itens,
      subtotal,
      taxa_entrega,
      desconto,
      cupom_id,
      total,
      criado_em,
    } = req.body;

    if (!tenantSlug) {
      res.status(400).json({
        sucesso: false,
        erro: 'O parâmetro tenant_slug é obrigatório para registrar o pedido.',
      });
      return;
    }

    const codigoPedido = `PED-${Math.floor(100000 + Math.random() * 900000)}`;

    // Normalização dos Enums
    const tipoNormalizado =
      tipo_pedido === 'Mesa' || tipo_pedido === 'MESA'
        ? 'MESA'
        : tipo_pedido === 'Retirada' || tipo_pedido === 'RETIRADA'
        ? 'RETIRADA'
        : 'DELIVERY';

    // Tratamento e validação estrita de dados
    if (tipoNormalizado === 'MESA') {
      const mesaStr = cliente?.mesa ? String(cliente.mesa).trim() : '';
      if (!mesaStr || !/^\d+$/.test(mesaStr)) {
        res.status(400).json({
          sucesso: false,
          erro: 'Para pedidos na mesa, é obrigatório informar o número da mesa (somente dígitos numéricos).',
        });
        return;
      }
    } else {
      // DELIVERY ou RETIRADA
      const nomeCliente = cliente?.nome ? String(cliente.nome).trim() : '';
      if (!nomeCliente || nomeCliente.length < 2) {
        res.status(400).json({
          sucesso: false,
          erro: 'O nome do cliente é obrigatório e deve ter no mínimo 2 caracteres.',
        });
        return;
      }

      const telefoneLimpo = cliente?.telefone ? String(cliente.telefone).replace(/\D/g, '') : '';
      if (telefoneLimpo.length < 10) {
        res.status(400).json({
          sucesso: false,
          erro: 'O telefone informado é inválido. Digite DDD + número com no mínimo 10 dígitos numéricos.',
        });
        return;
      }

      if (tipoNormalizado === 'DELIVERY') {
        const rua = cliente?.endereco?.rua ? String(cliente.endereco.rua).trim() : '';
        const numero = cliente?.endereco?.numero ? String(cliente.endereco.numero).trim() : '';
        const bairro = cliente?.endereco?.bairro ? String(cliente.endereco.bairro).trim() : '';

        if (!rua || !numero || !bairro) {
          res.status(400).json({
            sucesso: false,
            erro: 'Para entrega (Delivery), o endereço completo é obrigatório (rua, número e bairro).',
          });
          return;
        }
      }
    }

    if (pagamento?.precisa_troco) {
      const trocoParaNum = parseFloat(String(pagamento.troco_para || '').replace(/[^\d.,]/g, '').replace(',', '.'));
      if (isNaN(trocoParaNum) || trocoParaNum < Number(total || subtotal || 0)) {
        res.status(400).json({
          sucesso: false,
          erro: 'O valor para troco deve ser um número válido maior ou igual ao total do pedido.',
        });
        return;
      }
    }

    const metodoNormalizado =
      pagamento?.metodo === 'Pix' || pagamento?.metodo === 'PIX'
        ? 'PIX'
        : pagamento?.metodo === 'Cartao' || pagamento?.metodo === 'CARTAO_CREDITO'
        ? 'CARTAO_CREDITO'
        : 'DINHEIRO';

    let pedidoSalvo: any = null;

    // 1. Tenta persistência real no PostgreSQL via Prisma
    try {
      let tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });

      // Se o tenant não existe no banco, mas consta nos modelos padrão, auto-cria sob demanda
      if (!tenant && RESTAURANTES_CATALOGO[tenantSlug]) {
        const cat = RESTAURANTES_CATALOGO[tenantSlug];
        tenant = await prisma.tenant.create({
          data: {
            id: cat.restaurante.id,
            nome: cat.restaurante.nome,
            slug: cat.restaurante.slug,
            nicho: 'OUTRO',
            corPrimaria: cat.restaurante.corPrimaria,
            logoUrl: cat.restaurante.logoUrl,
            descricao: cat.restaurante.descricao,
            ativo: true,
          },
        });
      }

      if (tenant) {
        // Encontra ou associa a mesa se informada
        let mesaEncontrada = null;
        if (cliente?.mesa) {
          const numMesa = parseInt(String(cliente.mesa), 10);
          if (!isNaN(numMesa)) {
            mesaEncontrada = await prisma.mesa.findUnique({
              where: {
                tenantId_numero: {
                  tenantId: tenant.id,
                  numero: numMesa,
                },
              },
            });
          }
        }

        // Validação segura do cupom para evitar FK failure
        let validCupomId: string | null = null;
        if (cupom_id && typeof cupom_id === 'string' && cupom_id.length === 36) {
          const cupomExiste = await prisma.cupomDesconto.findUnique({
            where: { id: cupom_id },
            select: { id: true },
          });
          if (cupomExiste) validCupomId = cupomExiste.id;
        }

        // Mapeamento seguro dos itens (verificando produtoId para evitar FK failure)
        const itensData = [];
        for (const item of (itens || [])) {
          let validProdutoId: string | null = null;
          if (item.produto_id && typeof item.produto_id === 'string' && item.produto_id.length === 36) {
            const prodExiste = await prisma.produto.findUnique({
              where: { id: item.produto_id },
              select: { id: true },
            });
            if (prodExiste) validProdutoId = prodExiste.id;
          }

          itensData.push({
            produtoId: validProdutoId,
            nomeProduto: item.nome || item.nomeProduto || 'Item do Cardápio',
            precoUnitario: item.preco_unitario ?? item.precoUnitario ?? item.subtotal ?? 0,
            quantidade: item.quantidade || 1,
            subtotal: item.subtotal || ((item.preco_unitario || 0) * (item.quantidade || 1)),
            adicionais: {
              create: (item.adicionais || []).map((ad: any) => ({
                nome: ad.nome,
                preco: ad.preco || 0,
              })),
            },
          });
        }

        const nomeFinalCliente =
          cliente?.nome?.trim() ||
          (cliente?.mesa ? `Mesa ${cliente.mesa}` : 'Cliente Presencial');

        // Cria o pedido e seus itens em transação atômica
        pedidoSalvo = await prisma.pedido.create({
          data: {
            tenantId: tenant.id,
            mesaId: mesaEncontrada?.id || null,
            cupomId: validCupomId,
            codigo: codigoPedido,
            tipoPedido: tipoNormalizado as any,
            status: 'RECEBIDO',
            metodoPagamento: metodoNormalizado as any,
            statusPagamento: metodoNormalizado === 'PIX' ? 'PENDENTE' : 'PENDENTE',
            clienteNome: nomeFinalCliente,
            clienteTelefone: cliente?.telefone?.trim() || null,
            numeroMesa: cliente?.mesa ? String(cliente.mesa) : null,
            cep: cliente?.endereco?.cep || null,
            rua: cliente?.endereco?.rua || null,
            numeroEndereco: cliente?.endereco?.numero || null,
            bairro: cliente?.endereco?.bairro || null,
            complemento: cliente?.endereco?.complemento || null,
            observacoes: cliente?.observacoes || null,
            subtotal: subtotal || total || 0,
            taxaEntrega: taxa_entrega || 0,
            desconto: desconto || 0,
            total: total || subtotal || 0,
            precisaTroco: pagamento?.precisa_troco || false,
            trocoPara: pagamento?.troco_para ? parseFloat(String(pagamento.troco_para)) : null,
            itens: {
              create: itensData,
            },
          },
          include: {
            tenant: {
              select: {
                id: true,
                nome: true,
                slug: true,
                corPrimaria: true,
              },
            },
            itens: {
              include: {
                adicionais: true,
              },
            },
          },
        });
      }
    } catch (dbErr) {
      console.error('❌ Erro ao persistir pedido no Prisma:', dbErr);
    }

    // 2. Se o banco estava offline ou mock, armazena no cache resiliente
    if (!pedidoSalvo) {
      pedidoSalvo = {
        id: codigoPedido,
        codigo: codigoPedido,
        tenantSlug: tenantSlug,
        tipoPedido: tipoNormalizado,
        status: 'RECEBIDO',
        statusPagamento: 'PENDENTE',
        clienteNome: cliente?.nome || (cliente?.mesa ? `Mesa ${cliente.mesa}` : 'Cliente Presencial'),
        clienteTelefone: cliente?.telefone?.trim() || null,
        cep: cliente?.endereco?.cep || null,
        rua: cliente?.endereco?.rua || null,
        numeroEndereco: cliente?.endereco?.numero || null,
        bairro: cliente?.endereco?.bairro || null,
        cliente,
        pagamento,
        itens: (itens || []).map((i: any) => ({
          ...i,
          nomeProduto: i.nome || i.nomeProduto || 'Item',
        })),
        subtotal: subtotal || total || 0,
        taxaEntrega: taxa_entrega || 0,
        desconto: desconto || 0,
        total: total || subtotal || 0,
        criadoEm: criado_em || new Date().toISOString(),
      };
      PEDIDOS_MEMORIA.unshift(pedidoSalvo);
    }

    console.log(`📦 [NOVO PEDIDO REGISTRADO] ${codigoPedido} (${tipoNormalizado}) - R$ ${total} - Tenant: ${tenantSlug}`);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Pedido registrado com sucesso no sistema multi-tenant!',
      pedido: pedidoSalvo,
    });
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Falha interna ao processar o pedido no banco de dados.',
    });
  }
});

/**
 * GET /api/pedidos ou /api/:tenant_slug/pedidos
 * Lista os pedidos. Se tenant_slug for informado, filtra estritamente por ele.
 * Se tenant_slug for 'todos' ou omitido, lista pedidos de todos os inquilinos (para o KDS Master).
 */
pedidoRoutes.get('/', async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const rawSlug =
      (req.params.tenant_slug as string) ||
      (req.query.tenant_slug as string) ||
      (req.headers['x-tenant-slug'] as string) ||
      (req.headers['tenant_slug'] as string);

    const tenantSlug = rawSlug && rawSlug !== 'todos' ? rawSlug.trim() : undefined;
    const statusFiltro = req.query.status as string;
    const kdsFiltro = req.query.kds === 'true';
    const aguardandoPagamentoFiltro = req.query.aguardando_pagamento === 'true';

    let pedidos: any[] = [];

    // Tenta busca no Prisma
    try {
      let whereClause: any = {};

      if (tenantSlug) {
        const tenant = await prisma.tenant.findUnique({
          where: { slug: tenantSlug },
        });

        if (tenant) {
          whereClause.tenantId = tenant.id;
        } else {
          // Tenant específico não existe no DB: retorna lista vazia
          res.status(200).json({
            sucesso: true,
            tenant_slug: tenantSlug,
            total: 0,
            pedidos: [],
          });
          return;
        }
      }

      if (statusFiltro) {
        whereClause.status = statusFiltro;
      }

      // Regra de Cozinha (KDS): Só aparecem pedidos de MESA ou DELIVERY/RETIRADA com pagamento concluído
      if (kdsFiltro) {
        whereClause.OR = [
          { tipoPedido: 'MESA' },
          { tipoPedido: { in: ['DELIVERY', 'RETIRADA'] }, statusPagamento: 'PAGO' },
        ];
      } else if (aguardandoPagamentoFiltro) {
        // Pedidos de Delivery/Retirada que estão aguardando confirmação do pagamento
        whereClause.tipoPedido = { in: ['DELIVERY', 'RETIRADA'] };
        whereClause.statusPagamento = { not: 'PAGO' };
      }

      pedidos = await prisma.pedido.findMany({
        where: whereClause,
        include: {
          tenant: {
            select: {
              id: true,
              nome: true,
              slug: true,
              corPrimaria: true,
            },
          },
          itens: {
            include: {
              adicionais: true,
            },
          },
        },
        orderBy: {
          criadoEm: 'desc',
        },
        take: 100,
      });
    } catch (_dbErr) {
      console.error('❌ Erro no Prisma ao consultar pedidos:', _dbErr);
    }

    // Se Prisma retornou vazio ou offline, consulta store em memória para o tenant
    if (pedidos.length === 0 && PEDIDOS_MEMORIA.length > 0) {
      pedidos = PEDIDOS_MEMORIA.filter((p) => !tenantSlug || p.tenantSlug === tenantSlug);
      if (statusFiltro) {
        pedidos = pedidos.filter((p) => p.status === statusFiltro);
      }
      if (kdsFiltro) {
        pedidos = pedidos.filter((p) => p.tipoPedido === 'MESA' || p.statusPagamento === 'PAGO');
      } else if (aguardandoPagamentoFiltro) {
        pedidos = pedidos.filter((p) => (p.tipoPedido === 'DELIVERY' || p.tipoPedido === 'RETIRADA') && p.statusPagamento !== 'PAGO');
      }
    }

    res.status(200).json({
      sucesso: true,
      tenant_slug: tenantSlug || 'todos',
      total: pedidos.length,
      pedidos,
    });
  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Falha ao recuperar a lista de pedidos.',
    });
  }
});

/**
 * PATCH /api/pedidos/:id/status
 * Atualiza o status do pedido (Máquina de estados da cozinha/KDS)
 */
pedidoRoutes.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : String(rawId);
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        sucesso: false,
        erro: 'Informe o novo status do pedido.',
      });
      return;
    }

    let pedidoAtualizado = null;

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      let targetId = id;
      if (!isUuid) {
        const pFound = await prisma.pedido.findFirst({
          where: { codigo: id },
          select: { id: true },
        });
        if (pFound) targetId = pFound.id;
      }

      pedidoAtualizado = await prisma.pedido.update({
        where: { id: targetId },
        data: {
          status: status as any,
          ...(status === 'EM_PREPARO' ? { iniciadoEm: new Date() } : {}),
          ...(status === 'PRONTO_ENTREGA' ? { prontoEm: new Date() } : {}),
          ...(status === 'FINALIZADO' ? { finalizadoEm: new Date() } : {}),
          ...(status === 'CANCELADO' ? { canceladoEm: new Date() } : {}),
        },
        include: {
          tenant: {
            select: {
              id: true,
              nome: true,
              slug: true,
              corPrimaria: true,
            },
          },
          itens: {
            include: {
              adicionais: true,
            },
          },
        },
      });
    } catch (_dbErr) {
      // Fallback em memória
      const pMemoria = PEDIDOS_MEMORIA.find((p) => p.id === id || p.codigo === id);
      if (pMemoria) {
        pMemoria.status = status;
        pedidoAtualizado = pMemoria;
      }
    }

    if (!pedidoAtualizado) {
      res.status(404).json({
        sucesso: false,
        erro: 'Pedido não localizado para atualização de status.',
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      mensagem: `Status do pedido atualizado para ${status}`,
      pedido: pedidoAtualizado,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar status do pedido:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Falha ao atualizar o status do pedido.',
    });
  }
});

/**
 * PATCH /api/pedidos/:id/pagamento
 * Atualiza o status do pagamento do pedido (ex: PAGO, PENDENTE, FALHOU).
 * Ao marcar como PAGO, pedidos de DELIVERY ou RETIRADA passam a aparecer automaticamente na Cozinha (KDS).
 */
pedidoRoutes.patch('/:id/pagamento', async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : String(rawId);
    const { statusPagamento } = req.body;
    const novoStatus = (statusPagamento || 'PAGO').toUpperCase();

    const statusValidos = ['PENDENTE', 'PAGO', 'REEMBOLSADO', 'FALHOU'];
    if (!statusValidos.includes(novoStatus)) {
      res.status(400).json({
        sucesso: false,
        erro: `Status de pagamento inválido. Use um dos seguintes: ${statusValidos.join(', ')}`,
      });
      return;
    }

    let pedidoAtualizado = null;

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      let targetId = id;
      if (!isUuid) {
        const pFound = await prisma.pedido.findFirst({
          where: { codigo: id },
          select: { id: true },
        });
        if (pFound) targetId = pFound.id;
      }

      pedidoAtualizado = await prisma.pedido.update({
        where: { id: targetId },
        data: {
          statusPagamento: novoStatus as any,
        },
        include: {
          tenant: {
            select: {
              id: true,
              nome: true,
              slug: true,
              corPrimaria: true,
            },
          },
          itens: {
            include: {
              adicionais: true,
            },
          },
        },
      });
    } catch (_dbErr) {
      // Fallback em memória
      const pMemoria = PEDIDOS_MEMORIA.find((p) => p.id === id || p.codigo === id);
      if (pMemoria) {
        pMemoria.statusPagamento = novoStatus;
        pedidoAtualizado = pMemoria;
      }
    }

    if (!pedidoAtualizado) {
      res.status(404).json({
        sucesso: false,
        erro: 'Pedido não localizado para atualização de pagamento.',
      });
      return;
    }

    console.log(`💳 [PAGAMENTO ATUALIZADO] Pedido ${pedidoAtualizado.codigo} -> statusPagamento: ${novoStatus}`);

    res.status(200).json({
      sucesso: true,
      mensagem: `Status de pagamento atualizado para ${novoStatus}. O pedido foi liberado para a fila de produção da cozinha!`,
      pedido: pedidoAtualizado,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar pagamento do pedido:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Falha ao atualizar o status de pagamento.',
    });
  }
});
