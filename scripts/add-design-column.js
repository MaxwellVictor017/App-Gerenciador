import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('🔄 Verificando e aplicando coluna design_config no Neon PostgreSQL...');
  await sql`ALTER TABLE tenant_configs ADD COLUMN IF NOT EXISTS design_config TEXT;`;
  console.log('✅ Coluna design_config garantida com sucesso na tabela tenant_configs!');
}

main().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
