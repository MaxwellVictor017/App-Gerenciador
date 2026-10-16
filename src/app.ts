import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { produtoRoutes } from './routes/produtoRoutes';

export const app: Application = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Rota de Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    servico: 'API SaaS Restaurante Multi-Tenant',
    timestamp: new Date().toISOString(),
  });
});

// Registro da rota de produtos:
// Suporta chamada padrão com query/header: GET /api/produtos?tenant_slug=...
// Suporta chamada com slug na URL da rota: GET /api/:tenant_slug/produtos
app.use('/api/produtos', produtoRoutes);
app.use('/api/:tenant_slug/produtos', produtoRoutes);

// Fallback para rotas inexistentes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    erro: 'Rota não encontrada.',
  });
});
