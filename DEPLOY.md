# Qwest — Guia de Deploy

## 1. Pré-requisitos
- Conta gratuita em [railway.app](https://railway.app)
- Conta gratuita em [vercel.com](https://vercel.com)
- Git instalado

---

## 2. Backend → Railway

### 2.1 Criar projeto Railway

1. Acesse railway.app → **New Project**
2. Escolha **"Deploy from GitHub repo"** → conecte seu repo ou faça upload do código

### 2.2 Adicionar PostgreSQL

1. No projeto Railway, clique **"+ New"** → **Database** → **PostgreSQL**
2. Aguarde o banco ficar verde; Railway adiciona `DATABASE_URL` automaticamente ao ambiente

### 2.3 Configurar variáveis de ambiente (backend)

Vá em **Settings → Variables** do serviço backend e adicione:

```
JWT_SECRET=<string aleatória longa, ex: openssl rand -hex 32>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://SEU-APP.vercel.app
PORT=4000
```

> `DATABASE_URL` já é injetada pelo plugin PostgreSQL — não precisar adicionar manualmente.

### 2.4 Confirmar configurações de build

O arquivo `qwest/backend/railway.json` já está correto:
```json
{
  "build": { "builder": "DOCKERFILE" },
  "deploy": { "healthcheckPath": "/health" }
}
```

O Dockerfile faz `prisma migrate deploy && node dist/index.js` no startup.

### 2.5 Deploy

1. Railway detecta o Dockerfile automaticamente e faz o build
2. Aguarde o health check verde em `/health`
3. Copie a URL pública: `https://seu-backend.up.railway.app`

---

## 3. Frontend → Vercel

### 3.1 Importar projeto

1. Acesse vercel.com → **New Project** → importe o repo
2. Configure **Root Directory** como `qwest/frontend`
3. Framework: **Next.js** (detectado automaticamente)

### 3.2 Variáveis de ambiente (frontend)

Em **Settings → Environment Variables** adicione:

```
NEXT_PUBLIC_API_URL=https://seu-backend.up.railway.app/api
NEXT_PUBLIC_WS_URL=https://seu-backend.up.railway.app
```

### 3.3 Deploy

Clique **Deploy**. Vercel faz build e publica em `https://seu-app.vercel.app`.

---

## 4. Atualizar URL no Railway

Agora que a Vercel gerou a URL do frontend, volte ao Railway e atualize:

```
FRONTEND_URL=https://seu-app.vercel.app
```

Redeploy o backend (automático ao salvar variáveis).

---

## 5. Atualizar WordPress

Abra a página `https://mentorderesultados.facilities-insight.com.br/quizzes-interativos-ao-vivo/` no editor Gutenberg:

1. Mude para **Editor de código** (Ctrl+Shift+Alt+M)
2. Substitua as duas ocorrências de `QWEST_URL` pelo endereço Vercel:
   - `href="QWEST_URL/play"` → `href="https://seu-app.vercel.app/play"`
   - `href="QWEST_URL/login"` → `href="https://seu-app.vercel.app/login"`
3. Volte ao editor visual e publique

---

## 6. Desenvolvimento local (Docker)

```bash
cd qwest
cp backend/.env.example backend/.env   # preencha JWT_SECRET
docker compose up
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- DB: postgres://localhost:5432/qwest

Primeira execução: o Dockerfile roda `prisma migrate deploy` automaticamente.

---

## 7. Checklist pós-deploy

- [ ] `/health` retorna `{"ok":true,"app":"Qwest"}`
- [ ] Registro de conta funciona em `/register`
- [ ] Criar quiz e iniciar sessão gera PIN de 6 dígitos
- [ ] Participante entra em `/play` com o PIN e responde perguntas
- [ ] Placar aparece no fim do quiz
- [ ] Links do WordPress apontam para a URL correta da Vercel
