'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Question, QuestionType } from '@/types';
import QuestionCard from './QuestionCard';
import ThemeEditor, { QuizTheme } from './ThemeEditor';
import CsvImport from './CsvImport';

const DEFAULT_THEME: QuizTheme = { primaryColor: '#9333ea', bgColor: '#030712', fontFamily: 'system-ui', logoUrl: '' };

interface Props {
  quizId?: string;
  initialData: { title: string; description?: string; isPublic: boolean; randomizeQ: boolean; randomizeA: boolean; questions: Question[]; theme?: QuizTheme };
  onSave: (data: unknown) => void;
  isSaving: boolean;
  onRefresh?: () => void;
}

const QUESTION_TYPES: { type: QuestionType; label: string; emoji: string }[] = [
  { type: 'MULTIPLE_CHOICE', label: 'Múltipla escolha', emoji: '🔢' },
  { type: 'TRUE_FALSE', label: 'Verdadeiro ou Falso', emoji: '✅' },
  { type: 'OPEN_TEXT', label: 'Resposta aberta', emoji: '✍️' },
  { type: 'SLIDER', label: 'Slider numérico', emoji: '🎚️' },
  { type: 'PUZZLE', label: 'Ordenar sequência', emoji: '🧩' },
];

function newQuestion(type: QuestionType, order: number): Question {
  const base = { id: crypto.randomUUID(), type, text: '', mediaUrl: null, timeLimit: 30, pointsBase: 1000, order };
  if (type === 'TRUE_FALSE') return { ...base, options: [
    { id: 'true', text: 'Verdadeiro', isCorrect: false },
    { id: 'false', text: 'Falso', isCorrect: false },
  ]};
  if (type === 'MULTIPLE_CHOICE') return { ...base, options: [
    { id: crypto.randomUUID(), text: '', isCorrect: false },
    { id: crypto.randomUUID(), text: '', isCorrect: false },
    { id: crypto.randomUUID(), text: '', isCorrect: false },
    { id: crypto.randomUUID(), text: '', isCorrect: false },
  ]};
  return { ...base, options: [{ id: crypto.randomUUID(), text: '', isCorrect: true }] };
}

export default function QuizEditor({ quizId, initialData, onSave, isSaving, onRefresh }: Props) {
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description || '');
  const [isPublic, setIsPublic] = useState(initialData.isPublic);
  const [randomizeQ, setRandomizeQ] = useState(initialData.randomizeQ);
  const [randomizeA, setRandomizeA] = useState(initialData.randomizeA);
  const [questions, setQuestions] = useState<Question[]>(initialData.questions);
  const [theme, setTheme] = useState<QuizTheme>(initialData.theme || DEFAULT_THEME);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const addQuestion = (type: QuestionType) => {
    setQuestions(qs => [...qs, newQuestion(type, qs.length)]);
    setShowTypeMenu(false);
  };

  const updateQuestion = (index: number, q: Question) =>
    setQuestions(qs => qs.map((x, i) => (i === index ? q : x)));

  const removeQuestion = (index: number) =>
    setQuestions(qs => qs.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i })));

  const handleSave = () => {
    const needsAnswer = ['TRUE_FALSE'];
    const invalid = questions.findIndex(q => needsAnswer.includes(q.type) && !q.options.some(o => o.isCorrect));
    if (invalid !== -1) {
      toast.error(`Pergunta #${invalid + 1}: marque a resposta correta antes de salvar.`);
      return;
    }
    onSave({ title, description, isPublic, randomizeQ, randomizeA, questions, theme });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Topbar */}
      <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título do quiz"
          className="flex-1 bg-transparent text-xl font-bold placeholder-gray-600 focus:outline-none"
        />
        <button onClick={handleSave} disabled={isSaving || !title.trim()} className="btn-primary flex items-center gap-2 py-2">
          <Save className="w-4 h-4" /> {isSaving ? 'Salvando…' : 'Salvar'}
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {/* Quiz meta */}
        <div className="card space-y-4">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            className="input-field resize-none"
          />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="accent-brand-500 w-4 h-4" />
              <span>Quiz público</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={randomizeQ} onChange={e => setRandomizeQ(e.target.checked)} className="accent-brand-500 w-4 h-4" />
              <span>Embaralhar perguntas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={randomizeA} onChange={e => setRandomizeA(e.target.checked)} className="accent-brand-500 w-4 h-4" />
              <span>Embaralhar respostas</span>
            </label>
          </div>
        </div>

        {/* Questions */}
        <AnimatePresence>
          {questions.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
              <QuestionCard
                question={q}
                index={i}
                onChange={(updated) => updateQuestion(i, updated)}
                onRemove={() => removeQuestion(i)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Theme + CSV */}
        <ThemeEditor theme={theme} onChange={setTheme} />
        {quizId && <CsvImport quizId={quizId} onImported={() => onRefresh?.()} />}

        {/* Add question */}
        <div className="relative">
          <button
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="w-full card border-dashed border-2 border-white/20 hover:border-brand-500 transition-colors flex items-center justify-center gap-3 py-6 text-gray-400 hover:text-white"
          >
            <Plus className="w-5 h-5" />
            Adicionar pergunta
          </button>

          <AnimatePresence>
            {showTypeMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-full mb-2 left-0 right-0 card z-10 grid grid-cols-2 sm:grid-cols-3 gap-2 p-3"
              >
                {QUESTION_TYPES.map(({ type, label, emoji }) => (
                  <button
                    key={type}
                    onClick={() => addQuestion(type)}
                    className="btn-ghost py-3 text-sm flex flex-col items-center gap-1 hover:bg-brand-900/40"
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
