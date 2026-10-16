const { neon } = require('@neondatabase/serverless');
const { execSync } = require('child_process');
require('dotenv').config();

async function runMigration() {
  console.log('🔄 Gerando DDL com Prisma Migrate Diff...');
  const ddlSql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', {
    encoding: 'utf-8',
  });

  console.log('🚀 Conectando ao Neon via HTTPS (Port 443) e aplicando DDL...');
  const sql = neon(process.env.DATABASE_URL);

  // Remove comentários SQL e divide as instruções por ponto e vírgula
  const cleanSql = ddlSql.replace(/--.*$/gm, '');
  const statements = cleanSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await sql.query(statement);
      console.log('✔ Executado:', statement.split('\n')[0].substring(0, 50) + '...');
    } catch (err) {
      console.warn('⚠️ Nota na instrução:', err.message);
    }
  }

  // Verifica as tabelas criadas no schema público
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;

  console.log('\n🎉 TABELAS CRIADAS NO NEON POSTGRESQL:');
  console.table(tables);
}

runMigration().catch(err => {
  console.error('❌ Falha ao aplicar migration:', err);
  process.exit(1);
});
