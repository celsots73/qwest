import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Expected CSV format:
// question_text,type,option_a,option_b,option_c,option_d,correct,time_limit
// "Qual é a capital?",MULTIPLE_CHOICE,Paris,Roma,Lisboa,Berlim,a,30

router.post('/csv/:quizId', requireAuth, upload.single('file'), async (req: AuthRequest, res) => {
  const quiz = await prisma.quiz.findFirst({ where: { id: req.params.quizId, authorId: req.userId } });
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const text = req.file.buffer.toString('utf-8');
    const lines = text.split('\n').filter(Boolean);
    const header = lines[0].toLowerCase();

    if (!header.includes('question')) {
      return res.status(400).json({ error: 'Invalid CSV: missing header row' });
    }

    const questions = lines.slice(1).map((line, idx) => {
      const cols = parseCsvLine(line);
      const [text, type = 'MULTIPLE_CHOICE', a, b, c, d, correct = 'a', timeLimit = '30'] = cols;

      const optionMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
      const correctIdx = optionMap[correct.toLowerCase()] ?? 0;
      const optTexts = [a, b, c, d].filter(Boolean);

      const options = optTexts.map((t, i) => ({
        id: `opt-${idx}-${i}`,
        text: t.trim(),
        isCorrect: i === correctIdx,
      }));

      return {
        quizId: quiz.id,
        type: type.trim().toUpperCase() as any,
        text: text.trim(),
        options,
        timeLimit: Number(timeLimit) || 30,
        pointsBase: 1000,
        order: idx,
      };
    });

    await prisma.$transaction([
      prisma.question.deleteMany({ where: { quizId: quiz.id } }),
      prisma.question.createMany({ data: questions }),
    ]);

    res.json({ imported: questions.length });
  } catch (e: any) {
    res.status(400).json({ error: `Parse error: ${e.message}` });
  }
});

// Template CSV download
router.get('/csv/template', (_req, res) => {
  const csv = `question_text,type,option_a,option_b,option_c,option_d,correct,time_limit
"Qual é a capital do Brasil?",MULTIPLE_CHOICE,Brasília,São Paulo,Rio de Janeiro,Salvador,a,30
"A Terra é plana?",TRUE_FALSE,Verdadeiro,Falso,,,b,20
"Qual a fórmula da água?",OPEN_TEXT,H2O,,,,a,60`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="qwest-template.csv"');
  res.send(csv);
});

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

export default router;
