import { prisma } from '../src/lib/prisma';

async function main() {
  const funcionarios = await prisma.funcionario.findMany({
    include: {
      tenant: {
        select: {
          nome: true,
          slug: true,
        },
      },
    },
    orderBy: { criadoEm: 'asc' },
  });

  console.log('================================================================');
  console.log('📊 CONEXÃO COM NEON POSTGRESQL (AWS SA-EAST-1) CONFIRMADA');
  console.log(`TOTAL DE COLABORADORES GRAVADOS NA TABELA: ${funcionarios.length}`);
  console.log('================================================================\n');

  funcionarios.forEach((f, idx) => {
    console.log(`[#${idx + 1}] ID (UUID no Banco): ${f.id}`);
    console.log(`    Nome:        ${f.nome}`);
    console.log(`    Cargo:       ${f.cargo}`);
    console.log(`    Email:       ${f.email || '(não informado)'}`);
    console.log(`    Telefone:    ${f.telefone || '(não informado)'}`);
    console.log(`    Status:      ${f.ativo ? 'ATIVO' : 'INATIVO'}`);
    console.log(`    Restaurante: ${f.tenant.nome} (slug: ${f.tenant.slug})`);
    console.log(`    Criado em:   ${f.criadoEm.toISOString()}`);
    console.log('----------------------------------------------------------------');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
