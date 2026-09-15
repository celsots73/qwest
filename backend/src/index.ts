import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { setupSocket } from './socket';
import authRouter from './routes/auth';
import quizzesRouter from './routes/quizzes';
import sessionsRouter from './routes/sessions';
import reportsRouter from './routes/reports';
import importRouter from './routes/import';
import selfpacedRouter from './routes/selfpaced';

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/import', importRouter);
app.use('/api/selfpaced', selfpacedRouter);

app.get('/health', (_req, res) => res.json({ ok: true, app: 'Qwest' }));

setupSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Qwest backend running on :${PORT}`));

export { app, server };
