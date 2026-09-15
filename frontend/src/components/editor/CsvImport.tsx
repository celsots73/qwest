'use client';
import { useRef, useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Props { quizId: string; onImported: () => void; }

export default function CsvImport({ quizId, onImported }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [count, setCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) return toast.error('Selecione um arquivo .csv');
    setStatus('loading');
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post(`/import/csv/${quizId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCount(data.imported);
      setStatus('ok');
      onImported();
      toast.success(`${data.imported} perguntas importadas!`);
    } catch (e: any) {
      setStatus('error');
      toast.error(e?.response?.data?.error || 'Erro na importação');
    }
  };

  const downloadTemplate = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/import/csv/template`, '_blank');
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Upload className="w-4 h-4 text-brand-400" /> Importar via CSV
        </h3>
        <button onClick={downloadTemplate} className="text-xs text-gray-400 hover:text-brand-400 flex items-center gap-1 transition-colors">
          <Download className="w-3.5 h-3.5" /> Template
        </button>
      </div>

      <div
        className="border-2 border-dashed border-white/20 hover:border-brand-500 rounded-xl p-6 text-center cursor-pointer transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <input ref={inputRef} type="file" accept=".csv" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

        {status === 'idle' && <p className="text-gray-400 text-sm">Arraste o CSV aqui ou clique para selecionar</p>}
        {status === 'loading' && <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />}
        {status === 'ok' && <p className="text-green-400 flex items-center justify-center gap-2 text-sm"><CheckCircle className="w-4 h-4" /> {count} perguntas importadas</p>}
        {status === 'error' && <p className="text-red-400 flex items-center justify-center gap-2 text-sm"><AlertCircle className="w-4 h-4" /> Erro — verifique o formato</p>}
      </div>

      <p className="text-xs text-gray-600">
        Formato: <code className="text-gray-500">question_text, type, option_a, option_b, option_c, option_d, correct (a/b/c/d), time_limit</code>
      </p>
    </div>
  );
}
