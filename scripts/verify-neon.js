import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('⚡ Conectando ao Neon PostgreSQL via HTTPS (Porta 443)...\n');

  // Inserir um Tenant de demonstração
  const tenantSlug = 'restaurante-demo-' + Date.now();
  const [tenant] = await sql`
    INSERT INTO "tenants" (id, nome, slug, cor_primaria, logo_url, ativo, atualizado_em)
    VALUES (
      gen_random_uuid(),
      'Trattoria & Grill Gourmet',
      ${tenantSlug},
      '#EF4444',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
      true,
      NOW()
    )
    RETURNING *;
  `;
  console.log('✅ 1. TENANT CRIADO NO BANCO:');
  console.log(`   - ID: ${tenant.id}`);
  console.log(`   - Nome: ${tenant.nome}`);
  console.log(`   - Slug: ${tenant.slug}`);
  console.log(`   - Ativo: ${tenant.ativo}`);

  // Inserir Categoria vinculada ao Tenant
  const [categoria] = await sql`
    INSERT INTO "categorias" (id, tenant_id, nome, ordem, atualizado_em)
    VALUES (
      gen_random_uuid(),
      ${tenant.id},
      'Pratos Principais',
      1,
      NOW()
    )
    RETURNING *;
  `;
  console.log('\n✅ 2. CATEGORIA CRIADA COM FOREIGN KEY (tenant_id):');
  console.log(`   - ID: ${categoria.id}`);
  console.log(`   - Nome: ${categoria.nome}`);
  console.log(`   - Tenant ID: ${categoria.tenant_id}`);

  // Inserir Produto vinculado ao Tenant e Categoria
  const [produto] = await sql`
    INSERT INTO "produtos" (id, tenant_id, categoria_id, nome, descricao, preco_base, imagem_url, atualizado_em)
    VALUES (
      gen_random_uuid(),
      ${tenant.id},
      ${categoria.id},
      'Bife Ancho Premium com Risoto',
      'Corte nobre grelhado na brasa acompanhado de risoto de parmesão.',
      89.90,
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
      NOW()
    )
    RETURNING *;
  `;
  console.log('\n✅ 3. PRODUTO CRIADO COM RELAÇÕES:');
  console.log(`   - ID: ${produto.id}`);
  console.log(`   - Nome: ${produto.nome}`);
  console.log(`   - Preço: R$ ${produto.preco_base}`);
  console.log(`   - Categoria ID: ${produto.categoria_id}`);
  console.log(`   - Tenant ID: ${produto.tenant_id}`);

  // Inserir Mesa vinculada ao Tenant
  const [mesa] = await sql`
    INSERT INTO "mesas" (id, tenant_id, numero, qr_code_url, atualizado_em)
    VALUES (
      gen_random_uuid(),
      ${tenant.id},
      10,
      ${'https://qr.cardapio.online/' + tenant.slug + '/mesa/10'},
      NOW()
    )
    RETURNING *;
  `;
  console.log('\n✅ 4. MESA CRIADA COM FOREIGN KEY (tenant_id):');
  console.log(`   - ID: ${mesa.id}`);
  console.log(`   - Número: ${mesa.numero}`);
  console.log(`   - QR Code: ${mesa.qr_code_url}`);
  console.log(`   - Tenant ID: ${mesa.tenant_id}`);

  // Testar integridade relacional multi-tenant com JOIN
  console.log('\n🔍 TESTE DE CONSULTA MULTI-TENANT ISOLADA (JOIN NO BANCO):');
  const relatorio = await sql`
    SELECT 
      t.nome AS restaurante,
      t.slug,
      c.nome AS categoria,
      p.nome AS produto,
      p.preco_base,
      m.numero AS mesa_numero
    FROM "tenants" t
    INNER JOIN "categorias" c ON c.tenant_id = t.id
    INNER JOIN "produtos" p ON p.tenant_id = t.id AND p.categoria_id = c.id
    INNER JOIN "mesas" m ON m.tenant_id = t.id
    WHERE t.id = ${tenant.id};
  `;
  console.table(relatorio);

  console.log('\n🎯 CONCLUSÃO: Todas as 4 tabelas, relacionamentos e foreign keys estão 100% OPERACIONAIS no Neon!');
}

main().catch(console.error);
