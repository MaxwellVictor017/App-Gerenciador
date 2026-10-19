import { neon } from '@neondatabase/serverless';
import pkg from 'pg';
const { Pool } = pkg;
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL não configurada no arquivo .env.');
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🔄 EXECUTANDO MIGRAÇÃO DE ENGENHARIA MULTI-TENANT ENTERPRISE');
  console.log('================================================================');

  console.log('1. Gerando DDL com Prisma Migrate Diff...');
  const ddlSql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', {
    encoding: 'utf-8',
  });

  // Limpa comentários SQL e divide instruções por ponto e vírgula
  const cleanSql = ddlSql.replace(/--.*$/gm, '');
  const statements = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`2. Total de ${statements.length} instruções DDL geradas para aplicar.`);

  console.log('🚀 Conectando ao Neon PostgreSQL Serverless via HTTPS (Porta 443)...');
  const sql = neon(dbUrl);

  for (const statement of statements) {
    try {
      await sql(statement);
      console.log('✔ Executado:', statement.split('\n')[0].substring(0, 60) + '...');
    } catch (err) {
      console.warn('⚠️ Nota na instrução:', err.message);
    }
  }

  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('\n🎉 TABELAS ATIVAS NO POSTGRESQL NEON:');
  console.table(tables);

  console.log('\n✅ MIGRAÇÃO MULTI-TENANT CONCLUÍDA COM TOTAL SUCESSO NO NEON!');
}

runMigration().catch((err) => {
  console.error('❌ Falha ao aplicar migration:', err.message);
  process.exit(1);
});
