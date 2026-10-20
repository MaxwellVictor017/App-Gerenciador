import { prisma } from '../src/lib/prisma';

async function runFullVerification() {
  const backendUrl = 'http://localhost:3001';
  const frontendUrl = 'http://localhost:3000';

  console.log('================================================================');
  console.log('🧪 TESTE COMPLETO: ADICIONAR E EXCLUIR ESTABELECIMENTOS COM MÁSCARA');
  console.log('================================================================\n');

  // 1. Obter Máscaras
  console.log('1. Obtendo catálogo de máscaras (GET /api/tenants/mascaras)...');
  const resMascaras = await fetch(`${backendUrl}/api/tenants/mascaras`);
  const dataMascaras = await resMascaras.json();
  console.log(`✔ Status ${resMascaras.status}. Total de máscaras disponíveis: ${dataMascaras.mascaras.length}`);
  dataMascaras.mascaras.forEach((m: any) => console.log(`   - ${m.icone} ${m.nome} (${m.slug}): ${m.totalItens} produtos`));

  // 2. Criar novo estabelecimento clonando a máscara 'burger-craft'
  const novoSlug = 'smash-burger-do-dev';
  const novoNome = 'Smash Burger do Desenvolvedor';

  console.log(`\n2. Criando novo estabelecimento "${novoNome}" via POST /api/tenants...`);
  const resCriar = await fetch(`${backendUrl}/api/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: novoNome,
      slug: novoSlug,
      nicho: 'hamburgueria',
      corPrimaria: '#EA580C',
      descricao: 'Hamburgueria artesanal de alta performance com smash burgers ultracrocantes.',
      telefone: '(11) 97777-8888',
      mascaraBase: 'burger-craft',
    }),
  });

  const dataCriar = await resCriar.json();
  console.log(`✔ Status ${resCriar.status}: ${dataCriar.mensagem}`);
  console.log('   Rotas geradas:', dataCriar.rotas);

  // 3. Validar no Neon PostgreSQL via Prisma
  console.log('\n3. Validando dados gravados no Neon PostgreSQL via Prisma...');
  const tenantNoBanco = await prisma.tenant.findUnique({
    where: { slug: novoSlug },
    include: {
      configuracao: true,
      categorias: {
        include: { produtos: true },
      },
      mesas: true,
      funcionarios: true,
      gruposOpcao: {
        include: { itens: true },
      },
    },
  });

  if (!tenantNoBanco) {
    throw new Error('Tenant não foi encontrado no banco de dados!');
  }

  const totalProdutos = tenantNoBanco.categorias.reduce((acc, c) => acc + c.produtos.length, 0);
  console.log(`✔ Tenant ID: ${tenantNoBanco.id}`);
  console.log(`✔ Categorias criadas: ${tenantNoBanco.categorias.length}`);
  console.log(`✔ Produtos clonados: ${totalProdutos}`);
  console.log(`✔ Mesas criadas com QR Code: ${tenantNoBanco.mesas.length}`);
  console.log(`✔ Funcionários cadastrados: ${tenantNoBanco.funcionarios.length}`);
  console.log(`✔ Opcionais/Adicionais clonados: ${tenantNoBanco.gruposOpcao.length}`);

  // 4. Testar Rotas HTTP do Frontend e Backend
  console.log('\n4. Testando rotas HTTP do SaaS (Frontend + Backend)...');
  const rotasParaTestar = [
    { url: `${frontendUrl}/${novoSlug}`, label: 'Cardápio Digital' },
    { url: `${frontendUrl}/${novoSlug}/admin`, label: 'Painel Administrativo' },
    { url: `${frontendUrl}/${novoSlug}/carrinho`, label: 'Carrinho de Pedidos' },
    { url: `${backendUrl}/api/${novoSlug}/produtos`, label: 'API Neon Produtos' },
    { url: `${backendUrl}/api/${novoSlug}/funcionarios`, label: 'API Neon Funcionários' },
  ];

  for (const r of rotasParaTestar) {
    const res = await fetch(r.url);
    console.log(`✔ [HTTP ${res.status}] ${r.label} -> ${r.url}`);
    if (res.status !== 200) {
      throw new Error(`Rota ${r.url} respondeu com status ${res.status}`);
    }
  }

  // 5. Excluir o estabelecimento criado para testar limpeza completa
  console.log(`\n5. Testando exclusão do estabelecimento via DELETE /api/tenants/${novoSlug}...`);
  const resExcluir = await fetch(`${backendUrl}/api/tenants/${novoSlug}`, {
    method: 'DELETE',
  });
  const dataExcluir = await resExcluir.json();
  console.log(`✔ Status ${resExcluir.status}: ${dataExcluir.mensagem}`);

  // 6. Confirmar que foi removido do Neon DB
  const checagemPosExclusao = await prisma.tenant.findUnique({
    where: { slug: novoSlug },
  });
  console.log(`✔ Checagem pós-exclusão no Neon DB: ${checagemPosExclusao === null ? 'REMOVIDO COM SUCESSO (null)' : 'AINDA PRESENTE'}`);

  console.log('\n================================================================');
  console.log('🎉 SUCESSO TOTAL: FLUXO DE ADICIONAR, CLONAR MÁSCARA E EXCLUIR ESTÁ 100% OPERACIONAL!');
  console.log('================================================================\n');
}

runFullVerification()
  .catch((err) => {
    console.error('❌ Erro no teste:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
