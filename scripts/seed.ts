import { prisma } from '../src/lib/prisma';
import { RESTAURANTES_CATALOGO } from '../src/data/mockCardapios';

async function main() {
  console.log('🚀 Iniciando Engenharia e Povoamento Completo do Banco Multi-Tenant...\n');

  // Limpa registros anteriores respeitando integridade referencial
  console.log('🧹 Limpando dados legados...');
  await prisma.funcionario.deleteMany();
  await prisma.avaliacao.deleteMany();
  await prisma.cupomDesconto.deleteMany();
  await prisma.transacaoPix.deleteMany();
  await prisma.itemPedidoOpcional.deleteMany();
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.mesa.deleteMany();
  await prisma.produtoGrupoOpcional.deleteMany();
  await prisma.itemOpcional.deleteMany();
  await prisma.grupoOpcional.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.tenantConfig.deleteMany();
  await prisma.tenant.deleteMany();
  console.log('✨ Base de dados limpa com sucesso.\n');

  // Itera por todos os 6 estabelecimentos do catálogo Dev Hub
  for (const [slug, catalogo] of Object.entries(RESTAURANTES_CATALOGO)) {
    const { restaurante, produtos } = catalogo;

    const nichoMapeado: Record<string, any> = {
      pizzaria: 'PIZZARIA',
      hamburgueria: 'HAMBURGUERIA',
      restaurante: 'RESTAURANTE',
      bar: 'BAR',
      oriental: 'ORIENTAL',
      cafeteria: 'CAFETERIA',
    };

    console.log(`================================================================`);
    console.log(`🏢 Cadastrando Estabelecimento: ${restaurante.nome} (${restaurante.slug})`);

    // 1. Cria o Tenant (Restaurante Inquilino Isolado)
    const tenantCriado = await prisma.tenant.create({
      data: {
        id: restaurante.id,
        nome: restaurante.nome,
        slug: restaurante.slug,
        nicho: nichoMapeado[restaurante.nicho] || 'OUTRO',
        corPrimaria: restaurante.corPrimaria,
        logoUrl: restaurante.logoUrl,
        descricao: restaurante.descricao,
        telefone: '(11) 98765-4321',
        ativo: true,
      },
    });

    // 2. Cria as Configurações Operacionais & Chave Pix do Tenant
    await prisma.tenantConfig.create({
      data: {
        tenantId: tenantCriado.id,
        chavePix: `${restaurante.slug}@pixcardapio.com.br`,
        titularPix: restaurante.nome,
        tipoChavePix: 'EMAIL',
        taxaEntregaPadrao: 8.50,
        pedidoMinimo: 25.00,
        tempoMedioPreparoMin: 25,
        tempoMedioEntregaMin: 40,
        aceitaMesa: true,
        aceitaRetirada: true,
        aceitaDelivery: true,
        aceitaPix: true,
        aceitaCartao: true,
        aceitaDinheiro: true,
        horarioFuncionamento: restaurante.horarioFuncionamento || 'Seg - Dom • 12:00 às 23:00',
        enderecoCompleto: 'Avenida Gastronômica, 1000 - Jardins, São Paulo - SP',
      },
    });

    // 3. Cadastra Grupos de Opcionais & Adicionais específicos do nicho
    const grupoAdicionais = await prisma.grupoOpcional.create({
      data: {
        tenantId: tenantCriado.id,
        nome: restaurante.nicho === 'pizzaria' ? 'Bordas Recheadas' : restaurante.nicho === 'hamburgueria' ? 'Adicionais Extras' : 'Complementos Especiais',
        minimo: 0,
        maximo: 3,
        obrigatorio: false,
        ordem: 1,
        itens: {
          create: [
            {
              nome: restaurante.nicho === 'pizzaria' ? 'Borda Recheada Catupiry Original' : restaurante.nicho === 'hamburgueria' ? 'Bacon Artesanal Extra' : 'Porção Extra de Queijo',
              preco: 12.00,
              disponivel: true,
              ordem: 1,
            },
            {
              nome: restaurante.nicho === 'pizzaria' ? 'Borda Recheada Cheddar Cremoso' : restaurante.nicho === 'hamburgueria' ? 'Cheddar Inglês Extra' : 'Molho Especial da Casa',
              preco: 10.00,
              disponivel: true,
              ordem: 2,
            },
            {
              nome: 'Molho Especial do Chef (Pote 50ml)',
              preco: 6.50,
              disponivel: true,
              ordem: 3,
            },
          ],
        },
      },
      include: {
        itens: true,
      },
    });

    // 4. Cadastra Categorias e Produtos
    const categoriasCriadas = new Map<string, string>();

    for (const p of produtos) {
      let categoriaId = categoriasCriadas.get(p.categoria.nome);

      if (!categoriaId) {
        const catCriada = await prisma.categoria.create({
          data: {
            tenantId: tenantCriado.id,
            nome: p.categoria.nome,
            ordem: p.categoria.ordem || 1,
            ativa: true,
          },
        });
        categoriaId = catCriada.id;
        categoriasCriadas.set(p.categoria.nome, categoriaId);
      }

      // Cria Produto vinculado estritamente ao Tenant e Categoria
      const produtoCriado = await prisma.produto.create({
        data: {
          tenantId: tenantCriado.id,
          categoriaId: categoriaId,
          nome: p.nome,
          descricao: p.descricao,
          precoBase: p.precoBase,
          imagemUrl: p.imagemUrl,
          disponivel: true,
          destaque: true,
        },
      });

      // Vincula ao grupo de opcionais
      await prisma.produtoGrupoOpcional.create({
        data: {
          produtoId: produtoCriado.id,
          grupoOpcionalId: grupoAdicionais.id,
        },
      });
    }

    // 5. Cadastra Mesas Físicas (Mesas 1 a 12 com QR Codes únicos)
    for (let numeroMesa = 1; numeroMesa <= 10; numeroMesa++) {
      await prisma.mesa.create({
        data: {
          tenantId: tenantCriado.id,
          numero: numeroMesa,
          capacidade: numeroMesa % 2 === 0 ? 4 : 2,
          status: numeroMesa === 4 ? 'OCUPADA' : 'LIVRE',
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=http://localhost:3000/${restaurante.slug}?mesa=${numeroMesa}`,
        },
      });
    }

    // 6. Cadastra Cliente de Demonstração
    const clienteExemplo = await prisma.cliente.create({
      data: {
        tenantId: tenantCriado.id,
        nome: 'Maxwell Santos',
        telefone: '(11) 99999-8888',
        email: 'maxwell@cliente.com.br',
        endereco: 'Rua das Palmeiras, 123 - Apto 42',
        totalGasto: 154.80,
        pedidosTotal: 2,
      },
    });

    // 7. Cadastra Pedido Piloto no KDS (Mesa e Delivery)
    const pedidoMesa = await prisma.pedido.create({
      data: {
        tenantId: tenantCriado.id,
        clienteId: clienteExemplo.id,
        codigo: `PED-${Math.floor(100000 + Math.random() * 900000)}`,
        tipoPedido: 'MESA',
        status: 'EM_PREPARO',
        metodoPagamento: 'PIX',
        statusPagamento: 'PAGO',
        clienteNome: 'Maxwell Santos (Mesa 4)',
        clienteTelefone: '(11) 99999-8888',
        numeroMesa: '4',
        subtotal: produtos[0].precoBase,
        taxaEntrega: 0.00,
        total: produtos[0].precoBase,
        observacoes: 'Por favor, servir bem quente.',
        itens: {
          create: [
            {
              nomeProduto: produtos[0].nome,
              precoUnitario: produtos[0].precoBase,
              quantidade: 1,
              subtotal: produtos[0].precoBase,
              observacoes: 'Caprichar no azeite.',
            },
          ],
        },
      },
    });

    // 8. Cria Transação Pix vinculada ao Pedido
    await prisma.transacaoPix.create({
      data: {
        tenantId: tenantCriado.id,
        pedidoId: pedidoMesa.id,
        txid: `TXID-${tenantCriado.slug}-${Date.now()}`,
        chavePix: `${restaurante.slug}@pixcardapio.com.br`,
        valor: pedidoMesa.total,
        copiaCola: `00020126580014br.gov.bcb.pix0136${tenantCriado.id}5204000053039865405${pedidoMesa.total}5802BR5913${tenantCriado.nome}6009SAO PAULO62070503***6304ABCD`,
        status: 'PAGO',
        expiraEm: new Date(Date.now() + 30 * 60 * 1000),
        pagoEm: new Date(),
      },
    });

    // 9. Cria Cupons Promocionais do Restaurante
    await prisma.cupomDesconto.createMany({
      data: [
        {
          tenantId: tenantCriado.id,
          codigo: 'PRIMEIRACOMPRA',
          tipo: 'PERCENTUAL',
          valor: 10.00,
          valorMinimo: 30.00,
          limiteUsos: 100,
          ativo: true,
        },
        {
          tenantId: tenantCriado.id,
          codigo: 'VIP15',
          tipo: 'VALOR_FIXO',
          valor: 15.00,
          valorMinimo: 50.00,
          limiteUsos: 50,
          ativo: true,
        },
      ],
    });

    // 10. Cria Avaliações Reais de Clientes
    await prisma.avaliacao.createMany({
      data: [
        {
          tenantId: tenantCriado.id,
          pedidoId: pedidoMesa.id,
          clienteNome: 'Mariana Costa',
          nota: 5,
          comentario: 'Experiência incrível! Pedido entregue super rápido e quentinho.',
          respostaRestaurante: 'Muito obrigado, Mariana! Esperamos vê-la novamente em breve.',
        },
        {
          tenantId: tenantCriado.id,
          clienteNome: 'Rodrigo Almeida',
          nota: 5,
          comentario: 'Qualidade impecável dos ingredientes e o cardápio digital na mesa é muito prático!',
        },
      ],
    });

    // 11. Cria Funcionários da Equipe do Estabelecimento
    await prisma.funcionario.createMany({
      data: [
        {
          tenantId: tenantCriado.id,
          nome: `Carlos Silveira`,
          cargo: 'GERENTE',
          email: `gerencia@${restaurante.slug}.com.br`,
          telefone: '(11) 98111-2233',
          ativo: true,
        },
        {
          tenantId: tenantCriado.id,
          nome: `Ana Clara Mendes`,
          cargo: 'GARCOM',
          email: `atendimento@${restaurante.slug}.com.br`,
          telefone: '(11) 98222-3344',
          ativo: true,
        },
        {
          tenantId: tenantCriado.id,
          nome: `Chef Giovanni`,
          cargo: 'COZINHEIRO',
          email: `cozinha@${restaurante.slug}.com.br`,
          telefone: '(11) 98333-4455',
          ativo: true,
        },
        {
          tenantId: tenantCriado.id,
          nome: `Lucas Ferreira`,
          cargo: 'CAIXA',
          email: `caixa@${restaurante.slug}.com.br`,
          telefone: '(11) 98444-5566',
          ativo: true,
        },
      ],
    });

    console.log(`✅ [${restaurante.nome}] Cadastrado com sucesso!`);
    console.log(`   - Categorias: ${categoriasCriadas.size}`);
    console.log(`   - Produtos: ${produtos.length}`);
    console.log(`   - Mesas: 10 mesas ativas`);
    console.log(`   - Cupons: 2 cupons promocionais`);
    console.log(`   - Funcionários: 4 colaboradores na equipe`);
    console.log(`   - Avaliações: 2 feedbacks 5 estrelas`);
    console.log(`   - Pedido Piloto: ${pedidoMesa.codigo} (Status: ${pedidoMesa.status})\n`);
  }

  console.log('🎉 ENGENHARIA DE BANCO MULTI-TENANT CONCLUÍDA COM TOTAL SUCESSO!');
}

main()
  .catch((err) => {
    console.error('❌ Erro durante o povoamento:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
