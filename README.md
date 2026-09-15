# Qwest — Plataforma de Quizzes em Tempo Real

## Pré-requisitos
- Node.js 20+
- PostgreSQL 15+
- pnpm (ou npm)

## Setup rápido

```bash
# 1. Clone e instale dependências
cd qwest/backend
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env
# edite .env com seu DATABASE_URL e JWT_SECRET

# 3. Crie o banco e gere o cliente Prisma
npm run db:migrate
npm run db:generate

# 4. Inicie em dev
npm run dev
# → http://localhost:4000
# → ws://localhost:4000 (Socket.io)
```

## Endpoints REST

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | /api/auth/register | — | Criar conta |
| POST | /api/auth/login | — | Login (retorna JWT) |
| GET | /api/auth/me | ✓ | Dados do usuário |
| GET | /api/quizzes | ✓ | Listar meus quizzes |
| POST | /api/quizzes | ✓ | Criar quiz |
| PUT | /api/quizzes/:id | ✓ | Editar quiz |
| DELETE | /api/quizzes/:id | ✓ | Excluir quiz |
| POST | /api/quizzes/:id/duplicate | ✓ | Duplicar quiz |
| POST | /api/sessions | ✓ | Criar sessão (gera PIN) |
| GET | /api/sessions/pin/:pin | — | Verificar PIN (participante) |
| GET | /api/sessions/:id/results | ✓ | Resultados da sessão |
| GET | /api/reports/sessions/:id | ✓ | Analytics |
| GET | /api/reports/sessions/:id/csv | ✓ | Exportar CSV |

## Eventos Socket.io

### Host emite:
| Evento | Payload | Descrição |
|--------|---------|-----------|
| `host:join` | `{ pin }` | Entrar como host |
| `host:start` | `{ pin }` | Iniciar quiz |
| `host:next` | `{ pin }` | Próxima pergunta |
| `host:end` | `{ pin }` | Encerrar quiz |

### Participante emite:
| Evento | Payload | Descrição |
|--------|---------|-----------|
| `player:join` | `{ pin, nickname, avatar }` | Entrar na sala |
| `player:answer` | `{ value }` | Responder pergunta |

### Servidor emite (para todos na sala):
| Evento | Payload | Descrição |
|--------|---------|-----------|
| `game:start` | — | Quiz iniciado |
| `game:question` | `{ index, total, question, timeLimit }` | Nova pergunta |
| `game:leaderboard` | `{ leaderboard[] }` | Ranking intermediário |
| `game:end` | `{ leaderboard[] }` | Pódio final |
| `player:answer_result` | `{ correct, pointsEarned, comboBonus, newStreak }` | Feedback de resposta |
| `host:answer_count` | `{ count, total }` | Progresso de respostas (host) |

## Sistema de pontuação

```
pontos = base (1000) + bônus_tempo (até 500) + bônus_combo
```

| Streak | Bônus combo |
|--------|-------------|
| 0–1 | 0 |
| 2 | +200 |
| 3 | +400 |
| 4 | +600 |
| 5+ | +1000 |

## Testes

```bash
npm test
```

## Deploy

- **Backend**: Railway ou Render (variáveis de ambiente pelo painel)
- **Banco**: PostgreSQL no Railway ou Supabase
- **Frontend** (Fase 2): Vercel
- **Integração WordPress**: embed via `<iframe src="https://qwest.seudominio.com" />` ou widget customizado
