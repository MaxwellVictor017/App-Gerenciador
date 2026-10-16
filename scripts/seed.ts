import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🍕 Criando dados de teste no Neon PostgreSQL...\n');

  // Limpa registros anteriores se houver (respeitando integridade referencial)
  await prisma.mesa.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.tenant.deleteMany();

  // 1. Criar Tenant (Restaurante)
  const tenant = await prisma.tenant.create({
    data: {
      nome: 'Pizzaria Bella Itália',
      slug: 'pizzaria-bella-italia',
      corPrimaria: '#DC2626',
      logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300',
      ativo: true,
    },
  });
  console.log('✅ 1. Tenant Criado:', tenant.nome, `(ID: ${tenant.id})`);

  // 2. Criar Categoria vinculada ao Tenant
  const categoria = await prisma.categoria.create({
    data: {
      tenantId: tenant.id,
      nome: 'Pizzas Especiais',
      ordem: 1,
    },
  });
  console.log('✅ 2. Categoria Criada:', categoria.nome, `(Tenant: ${categoria.tenantId})`);

  // 3. Criar Produto vinculado ao Tenant e Categoria
  const produto = await prisma.produto.create({
    data: {
      tenantId: tenant.id,
      categoriaId: categoria.id,
      nome: 'Pizza Margherita Especial',
      descricao: 'Molho de tomate pelado italiano, muçarela de búfala, manjericão fresco e azeite extravirgem.',
      precoBase: 64.90,
      imagemUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500',
    },
  });
  console.log('✅ 3. Produto Criado:', produto.nome, `(R$ ${produto.precoBase})`);

  // 4. Criar Mesa vinculada ao Tenant
  const mesa = await prisma.mesa.create({
    data: {
      tenantId: tenant.id,
      numero: 1,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://${tenant.slug}.app.cardapio/mesa/1`,
    },
  });
  console.log('✅ 4. Mesa Criada: Mesa', mesa.numero, `(Tenant: ${mesa.tenantId})`);

  // 5. Teste de Busca Multi-Tenant Relacional Completa
  console.log('\n🔍 Consultando os dados completos do restaurante via Prisma...');
  const dadosRestaurante = await prisma.tenant.findUnique({
    where: { slug: 'pizzaria-bella-italia' },
    include: {
      categorias: {
        include: {
          produtos: true,
        },
      },
      mesas: true,
    },
  });

  console.log('\n🎉 DADOS RECUPERADOS COM SUCESSO DO BANCO NEON:');
  console.dir(dadosRestaurante, { depth: null });
}

main()
  .catch(err => {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
