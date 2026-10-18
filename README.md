# 🍽️ App Gerenciador - SaaS Multi-Tenant para Restaurantes & Cardápio Digital

Sistema completo de gestão multi-tenant e cardápio digital interativo para restaurantes com suporte a leitura de QR Code na mesa.

---

## 🚀 Tecnologias Utilizadas

### Front-end (Cardápio Digital)
* **Next.js 16 (App Router)** & **React 19**
* **TypeScript**
* **Tailwind CSS v4** (Mobile-first design)

### Back-end & API Multi-Tenant
* **Node.js** & **Express**
* **Prisma ORM** (com Driver Adapters para pooling serverless)
* **Neon PostgreSQL Serverless**
* **Middleware Multi-Tenant** com isolamento estrito por `tenant_slug`

---

## 📂 Estrutura do Projeto

```
.
├── app/                        # Next.js App Router (Front-end)
│   ├── [restaurante_slug]/     # Rota dinâmica do cardápio digital
│   │   └── page.tsx            # Página do cardápio com identidade visual e categorias
│   ├── layout.tsx              # Root Layout
│   ├── globals.css             # Estilos globais (Tailwind CSS)
│   └── page.tsx                # Hub inicial com demonstrações
├── prisma/
│   └── schema.prisma           # Modelagem de dados (Tenant, Categoria, Produto, Mesa)
├── src/                        # API Express (Back-end)
│   ├── @types/                 # Declarações de tipos estendidos do Express
│   ├── lib/                    # Conexão singleton do Prisma
│   ├── middlewares/            # Middleware de validação e isolamento de inquilinos
│   ├── routes/                 # Rotas da API (/api/:tenant_slug/produtos)
│   ├── app.ts                  # Configuração do Express
│   └── server.ts               # Inicialização do servidor HTTP
└── scripts/                    # Scripts de teste e migração de banco
```

---

## 🛠️ Como Executar o Projeto Localmente

### 1. Clonar o Repositório e Instalar Dependências
```bash
git clone https://github.com/MaxwellVictor017/App-Gerenciador.git
cd App-Gerenciador
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` baseado no `.env.example`:
```env
DATABASE_URL="sua_string_de_conexao_postgresql"
DIRECT_URL="sua_string_de_conexao_direta"
PORT=3001
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 3. Rodar as Migrações do Banco
```bash
npm run prisma:generate
npm run db:migrate
```

### 4. Iniciar os Serviços

* **Front-end (Cardápio Digital - Porta 3000)**:
  ```bash
  npm run dev
  # ou npm run dev:web
  ```

* **Back-end (API Multi-Tenant - Porta 3001)**:
  ```bash
  npm run dev:api
  ```

---

## 📱 Acessando o Cardápio Digital

* **Cardápio do Restaurante**: `http://localhost:3000/pizzaria-bella`
* **Pedido na Mesa (via QR Code)**: `http://localhost:3000/pizzaria-bella?mesa=4`
* **Health Check da API**: `http://localhost:3001/health`
