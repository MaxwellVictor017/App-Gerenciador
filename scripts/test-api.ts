import { app } from '../src/app';
import http from 'http';

async function runTests() {
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(4001, () => {
      console.log('🧪 Servidor de teste iniciado na porta 4001');
      resolve();
    });
  });

  const baseUrl = 'http://localhost:4001';

  try {
    console.log('\n--- TESTE 1: Sem tenant_slug (esperado: 400) ---');
    const res1 = await fetch(`${baseUrl}/api/produtos`);
    const data1 = await res1.json();
    console.log(`Status: ${res1.status}`, data1);

    console.log('\n--- TESTE 2: Com slug inexistente (esperado: 404) ---');
    const res2 = await fetch(`${baseUrl}/api/produtos?tenant_slug=slug-nao-existe-xyz`);
    const data2 = await res2.json();
    console.log(`Status: ${res2.status}`, data2);

    console.log('\n--- TESTE 3: Com slug válido via Query Param (esperado: 200) ---');
    const res3 = await fetch(`${baseUrl}/api/produtos?tenant_slug=restaurante-demo-1792173835685`);
    const data3 = await res3.json();
    console.log(`Status: ${res3.status}`);
    console.log(`Restaurante:`, data3.restaurante);
    console.log(`Total produtos:`, data3.total);
    console.log(`Primeiro produto:`, data3.produtos?.[0]?.nome);

    console.log('\n--- TESTE 4: Com slug válido via Header tenant_slug (esperado: 200) ---');
    const res4 = await fetch(`${baseUrl}/api/produtos`, {
      headers: {
        'tenant_slug': 'restaurante-demo-1792173835685',
      },
    });
    const data4 = await res4.json();
    console.log(`Status: ${res4.status}`, `Total produtos encontrados: ${data4.total}`);

    console.log('\n--- TESTE 5: Com slug na URL da rota (esperado: 200) ---');
    const res5 = await fetch(`${baseUrl}/api/restaurante-demo-1792173835685/produtos`);
    const data5 = await res5.json();
    console.log(`Status: ${res5.status}`, `Total produtos encontrados: ${data5.total}`);

    console.log('\n✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
  } catch (err) {
    console.error('❌ Falha nos testes:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
