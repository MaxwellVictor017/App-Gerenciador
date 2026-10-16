import { prisma } from '../src/lib/prisma';

async function main() {
  const tenants = await prisma.tenant.findMany({
    include: {
      categorias: {
        include: {
          produtos: true,
        },
      },
      mesas: true,
    },
  });

  console.log('🎉 PRISMA ORM COM ADAPTADOR NEON ESTÁ 100% FUNCIONAL!');
  console.log('Restaurantes encontrados:', JSON.stringify(tenants, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
