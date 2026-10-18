import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { produtoRoutes } from './routes/produtoRoutes';
import { pedidoRoutes } from './routes/pedidoRoutes';
import { funcionarioRoutes } from './routes/funcionarioRoutes';

export const app: Application = express();

// Middlewares Globais
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Rota de Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    servico: 'API SaaS Restaurante Multi-Tenant',
    timestamp: new Date().toISOString(),
  });
});

// Registro da rota de pedidos:
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/:tenant_slug/pedidos', pedidoRoutes);

// Registro da rota de produtos:
app.use('/api/produtos', produtoRoutes);
app.use('/api/:tenant_slug/produtos', produtoRoutes);

// Registro da rota de funcionários:
app.use('/api/funcionarios', funcionarioRoutes);
app.use('/api/:tenant_slug/funcionarios', funcionarioRoutes);

// Fallback para rotas inexistentes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    erro: 'Rota não encontrada.',
  });
});
