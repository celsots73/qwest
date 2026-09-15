'use client';
import { useState } from 'react';
import { Palette } from 'lucide-react';

export interface QuizTheme {
  primaryColor: string;
  bgColor: string;
  fontFamily: string;
  logoUrl: string;
}

const PRESETS: { name: string; theme: QuizTheme }[] = [
  { name: 'Roxo', theme: { primaryColor: '#9333ea', bgColor: '#030712', fontFamily: 'system-ui', logoUrl: '' } },
  { name: 'Azul', theme: { primaryColor: '#3b82f6', bgColor: '#0f172a', fontFamily: 'system-ui', logoUrl: '' } },
  { name: 'Verde', theme: { primaryColor: '#10b981', bgColor: '#022c22', fontFamily: 'system-ui', logoUrl: '' } },
  { name: 'Vermelho', theme: { primaryColor: '#ef4444', bgColor: '#1c0a0a', fontFamily: 'system-ui', logoUrl: '' } },
  { name: 'Laranja', theme: { primaryColor: '#f97316', bgColor: '#1c0f00', fontFamily: 'system-ui', logoUrl: '' } },
];

interface Props {
  theme: QuizTheme;
  onChange: (t: QuizTheme) => void;
}

export default function ThemeEditor({ theme, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 font-semibold text-sm w-full"
      >
        <Palette className="w-4 h-4 text-brand-400" />
        <span>Tema personalizado</span>
        <div className="ml-auto w-5 h-5 rounded-full border-2 border-white/20" style={{ background: theme.primaryColor }} />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {/* Presets */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Presets</p>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => onChange(p.theme)}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-1.5 text-sm transition-all"
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: p.theme.primaryColor }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Cor principal</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={e => onChange({ ...theme, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/20"
                />
                <input
                  value={theme.primaryColor}
                  onChange={e => onChange({ ...theme, primaryColor: e.target.value })}
                  className="input-field text-sm py-2"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Cor de fundo</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.bgColor}
                  onChange={e => onChange({ ...theme, bgColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/20"
                />
                <input
                  value={theme.bgColor}
                  onChange={e => onChange({ ...theme, bgColor: e.target.value })}
                  className="input-field text-sm py-2"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Fonte</label>
            <select
              value={theme.fontFamily}
              onChange={e => onChange({ ...theme, fontFamily: e.target.value })}
              className="input-field"
            >
              <option value="system-ui">Sistema (padrão)</option>
              <option value="'Georgia', serif">Georgia (Serifada)</option>
              <option value="'Courier New', monospace">Courier (Mono)</option>
              <option value="'Impact', sans-serif">Impact (Impacto)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">URL do Logo (opcional)</label>
            <input
              value={theme.logoUrl}
              onChange={e => onChange({ ...theme, logoUrl: e.target.value })}
              placeholder="https://seusite.com/logo.png"
              className="input-field text-sm"
            />
          </div>

          {/* Preview */}
          <div
            className="rounded-xl p-4 text-center text-sm font-bold transition-all"
            style={{ background: theme.bgColor, color: theme.primaryColor, fontFamily: theme.fontFamily }}
          >
            {theme.logoUrl && <img src={theme.logoUrl} className="h-8 mx-auto mb-2" alt="Logo" />}
            Prévia do tema Qwest
          </div>
        </div>
      )}
    </div>
  );
}
