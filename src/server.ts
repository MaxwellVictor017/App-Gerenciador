import { app } from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT) || 3333;

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 SERVIDOR EXPRESS INICIALIZADO COM SUCESSO`);
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
  console.log(`🍕 Rota Teste (Query):  http://localhost:${PORT}/api/produtos?tenant_slug=restaurante-demo-1792173835685`);
  console.log(`🍕 Rota Teste (URL):    http://localhost:${PORT}/api/restaurante-demo-1792173835685/produtos`);
  console.log(`🍕 Rota Teste (Header): curl -H "tenant_slug: restaurante-demo-1792173835685" http://localhost:${PORT}/api/produtos`);
  console.log('====================================================');
});

// Tratamento de encerramento gracioso (Graceful Shutdown)
const gracefulShutdown = () => {
  console.log('\n🛑 Recebido sinal de encerramento. Finalizando servidor...');
  server.close(() => {
    console.log('🔒 Servidor HTTP finalizado com sucesso.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
