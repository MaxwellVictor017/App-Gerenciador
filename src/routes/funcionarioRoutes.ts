import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

export const funcionarioRoutes = Router({ mergeParams: true });

// Aplica o middleware multi-tenant: valida o tenant_slug e injeta req.tenant_id
funcionarioRoutes.use(tenantMiddleware);

/**
 * GET /api/:tenant_slug/funcionarios
 * Lista todos os colaboradores do restaurante com isolamento estrito por tenantId.
 */
funcionarioRoutes.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant_id;
    if (!tenantId) {
      res.status(400).json({ sucesso: false, erro: 'Tenant ID não identificado.' });
      return;
    }

    const funcionarios = await prisma.funcionario.findMany({
      where: { tenantId },
      orderBy: [
        { ativo: 'desc' },
        { cargo: 'asc' },
        { nome: 'asc' },
      ],
    });

    res.status(200).json({
      sucesso: true,
      total: funcionarios.length,
      funcionarios,
    });
  } catch (error) {
    console.error('❌ Erro ao listar funcionários:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao buscar colaboradores.' });
  }
});

/**
 * POST /api/:tenant_slug/funcionarios
 * Cadastra um novo colaborador na equipe do restaurante.
 */
funcionarioRoutes.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant_id;
    if (!tenantId) {
      res.status(400).json({ sucesso: false, erro: 'Tenant ID não identificado.' });
      return;
    }

    const { nome, cargo, email, telefone, ativo } = req.body;

    if (!nome?.trim() || nome.trim().length < 2) {
      res.status(400).json({ sucesso: false, erro: 'O nome do colaborador deve conter no mínimo 2 caracteres.' });
      return;
    }

    if (email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        res.status(400).json({ sucesso: false, erro: 'Formato de e-mail inválido.' });
        return;
      }
    }

    if (telefone?.trim()) {
      const telDigitos = telefone.replace(/\D/g, '');
      if (telDigitos.length < 10) {
        res.status(400).json({ sucesso: false, erro: 'O telefone deve conter DDD e no mínimo 10 dígitos.' });
        return;
      }
    }

    const cargosValidos = ['GERENTE', 'GARCOM', 'COZINHEIRO', 'CAIXA', 'ATENDENTE', 'ENTREGADOR'];
    const cargoFinal = cargosValidos.includes(cargo?.toUpperCase())
      ? cargo.toUpperCase()
      : 'ATENDENTE';

    const novoFuncionario = await prisma.funcionario.create({
      data: {
        tenantId,
        nome: nome.trim(),
        cargo: cargoFinal as any,
        email: email?.trim() || null,
        telefone: telefone?.trim() || null,
        ativo: ativo !== undefined ? Boolean(ativo) : true,
      },
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Colaborador cadastrado com sucesso!',
      funcionario: novoFuncionario,
    });
  } catch (error) {
    console.error('❌ Erro ao cadastrar funcionário:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao cadastrar o colaborador.' });
  }
});

/**
 * PATCH /api/:tenant_slug/funcionarios/:id
 * Atualiza dados ou altera status do funcionário.
 */
funcionarioRoutes.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant_id;
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : String(rawId);

    if (!tenantId) {
      res.status(400).json({ sucesso: false, erro: 'Tenant ID não identificado.' });
      return;
    }

    const funcionarioExistente = await prisma.funcionario.findFirst({
      where: { id, tenantId },
    });

    if (!funcionarioExistente) {
      res.status(404).json({ sucesso: false, erro: 'Colaborador não encontrado neste estabelecimento.' });
      return;
    }

    const { nome, cargo, email, telefone, ativo } = req.body;

    const dataAtualizacao: any = {};
    if (nome !== undefined) dataAtualizacao.nome = nome.trim();
    if (cargo !== undefined) dataAtualizacao.cargo = cargo.toUpperCase();
    if (email !== undefined) dataAtualizacao.email = email?.trim() || null;
    if (telefone !== undefined) dataAtualizacao.telefone = telefone?.trim() || null;
    if (ativo !== undefined) dataAtualizacao.ativo = Boolean(ativo);

    const funcionarioAtualizado = await prisma.funcionario.update({
      where: { id },
      data: dataAtualizacao,
    });

    res.status(200).json({
      sucesso: true,
      mensagem: 'Dados do colaborador atualizados com sucesso!',
      funcionario: funcionarioAtualizado,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar funcionário:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao atualizar o colaborador.' });
  }
});

/**
 * DELETE /api/:tenant_slug/funcionarios/:id
 * Remove um funcionário da equipe do restaurante.
 */
funcionarioRoutes.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant_id;
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : String(rawId);

    if (!tenantId) {
      res.status(400).json({ sucesso: false, erro: 'Tenant ID não identificado.' });
      return;
    }

    const funcionarioExistente = await prisma.funcionario.findFirst({
      where: { id, tenantId },
    });

    if (!funcionarioExistente) {
      res.status(404).json({ sucesso: false, erro: 'Colaborador não encontrado neste estabelecimento.' });
      return;
    }

    await prisma.funcionario.delete({
      where: { id },
    });

    res.status(200).json({
      sucesso: true,
      mensagem: 'Colaborador removido da equipe com sucesso!',
    });
  } catch (error) {
    console.error('❌ Erro ao remover funcionário:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao remover o colaborador.' });
  }
});
