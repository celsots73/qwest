'use client';
import { Clock, Trash2, Plus, X } from 'lucide-react';
import { Question, QuestionOption } from '@/types';
import clsx from 'clsx';

interface Props {
  question: Question;
  index: number;
  onChange: (q: Question) => void;
  onRemove: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'Múltipla escolha', TRUE_FALSE: 'V ou F', OPEN_TEXT: 'Aberta', SLIDER: 'Slider', PUZZLE: 'Puzzle',
};

const OPT_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-pink-500', 'bg-cyan-500'];

export default function QuestionCard({ question, index, onChange, onRemove }: Props) {
  const update = (patch: Partial<Question>) => onChange({ ...question, ...patch });

  const updateOption = (i: number, patch: Partial<QuestionOption>) =>
    update({ options: question.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });

  const toggleCorrect = (i: number) => {
    if (question.type === 'MULTIPLE_CHOICE') {
      updateOption(i, { isCorrect: !question.options[i].isCorrect });
    } else {
      update({ options: question.options.map((o, idx) => ({ ...o, isCorrect: idx === i })) });
    }
  };

  const addOption = () => {
    if (question.options.length >= 6) return;
    update({ options: [...question.options, { id: crypto.randomUUID(), text: '', isCorrect: false }] });
  };

  const removeOption = (i: number) => {
    if (question.options.length <= 2) return;
    update({ options: question.options.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-gray-500 text-sm font-mono min-w-[2rem]">#{index + 1}</span>
        <span className="text-xs bg-brand-900/60 text-brand-400 px-2 py-0.5 rounded-full">{TYPE_LABELS[question.type]}</span>
        <div className="flex items-center gap-1 ml-auto">
          <Clock className="w-4 h-4 text-gray-500" />
          <select
            value={question.timeLimit}
            onChange={e => update({ timeLimit: Number(e.target.value) })}
            className="bg-gray-800 text-sm rounded-lg px-2 py-1 text-white border border-white/10"
          >
            {[10, 20, 30, 60, 90, 120, 180, 240].map(s => (
              <option key={s} value={s}>{s}s</option>
            ))}
          </select>
          <button onClick={onRemove} className="text-gray-500 hover:text-red-400 transition-colors ml-2">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question text */}
      <textarea
        value={question.text}
        onChange={e => update({ text: e.target.value })}
        placeholder="Digite a pergunta…"
        rows={2}
        className="input-field resize-none font-medium"
      />

      {/* Options */}
      {(question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {question.options.map((opt, i) => (
            <div
              key={opt.id}
              className={clsx(
                'flex items-center gap-2 rounded-xl px-3 py-2 border-2 transition-all cursor-pointer',
                opt.isCorrect ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-gray-800',
              )}
            >
              <div
                className={clsx('w-6 h-6 rounded-md flex-shrink-0', OPT_COLORS[i])}
                onClick={() => toggleCorrect(i)}
              />
              <input
                value={opt.text}
                onChange={e => updateOption(i, { text: e.target.value })}
                placeholder={`Opção ${i + 1}`}
                className="flex-1 bg-transparent focus:outline-none text-sm"
                disabled={question.type === 'TRUE_FALSE'}
              />
              <input
                type="checkbox"
                checked={!!opt.isCorrect}
                onChange={() => toggleCorrect(i)}
                className="accent-green-500 w-4 h-4 flex-shrink-0"
                title="Marcar como correta"
              />
              {question.type === 'MULTIPLE_CHOICE' && question.options.length > 2 && (
                <button onClick={() => removeOption(i)} className="text-gray-500 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {question.type === 'MULTIPLE_CHOICE' && question.options.length < 6 && (
            <button onClick={addOption} className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 hover:border-brand-500 py-3 text-gray-400 hover:text-white transition-colors text-sm">
              <Plus className="w-4 h-4" /> Adicionar opção
            </button>
          )}
        </div>
      )}

      {question.type === 'OPEN_TEXT' && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Resposta correta (texto exato ou palavra-chave)</label>
          <input
            value={question.options[0]?.text || ''}
            onChange={e => update({ options: [{ ...question.options[0], text: e.target.value, isCorrect: true }] })}
            placeholder="Resposta esperada…"
            className="input-field"
          />
        </div>
      )}

      {question.type === 'SLIDER' && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Mínimo</label>
            <input type="number" placeholder="0" className="input-field" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Máximo</label>
            <input type="number" placeholder="100" className="input-field" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Valor correto</label>
            <input
              type="number"
              value={question.options[0]?.text || ''}
              onChange={e => update({ options: [{ ...question.options[0], text: e.target.value, isCorrect: true }] })}
              className="input-field"
            />
          </div>
        </div>
      )}

      {question.type === 'PUZZLE' && (
        <div className="space-y-2">
          <label className="text-xs text-gray-500 block">Itens na ordem correta (de cima para baixo)</label>
          {question.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <span className="text-gray-500 text-sm w-5 text-center">{i + 1}.</span>
              <input
                value={opt.text}
                onChange={e => updateOption(i, { text: e.target.value })}
                placeholder={`Item ${i + 1}…`}
                className="input-field"
              />
              {question.options.length > 2 && (
                <button onClick={() => removeOption(i)} className="text-gray-500 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button onClick={addOption} className="text-brand-400 hover:text-brand-300 text-sm flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Adicionar item
          </button>
        </div>
      )}
    </div>
  );
}
