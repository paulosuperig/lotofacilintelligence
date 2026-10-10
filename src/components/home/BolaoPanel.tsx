import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBoloes } from '@/hooks/useBoloes';
import { formatBRL } from '@/lib/lottery/prizeValue';
import { custoTotal } from '@/lib/lottery/bolao';
import { BolaoDetail } from './bolao/BolaoDetail';
import type { SavedGame } from '@/types/lottery';

interface BolaoPanelProps {
  onBack: () => void;
  history?: SavedGame[];
  defaultConcurso?: number;
}

export const BolaoPanel = ({ onBack, history = [], defaultConcurso }: BolaoPanelProps) => {
  const { boloes, createBolao, updateBolao, deleteBolao } = useBoloes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [novoPreco, setNovoPreco] = useState('3');

  const selected = useMemo(() => boloes.find((b) => b.id === selectedId) ?? null, [boloes, selectedId]);

  const handleCreate = () => {
    const b = createBolao(novoNome, parseFloat(novoPreco.replace(',', '.')));
    setNovoNome('');
    setSelectedId(b.id);
  };

  if (selected) {
    return (
      <BolaoDetail
        bolao={selected}
        history={history}
        defaultConcurso={defaultConcurso}
        onChange={updateBolao}
        onDelete={() => { deleteBolao(selected.id); setSelectedId(null); }}
        onBackToList={() => setSelectedId(null)}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 gap-6">
      <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-5 sm:p-8 md:p-12 shadow-xl shadow-purple-500/5">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-6 md:mb-8 gap-6 text-center lg:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0"><Users size={20} /></div>
            <div>
              <h2 className="text-lg md:text-xl font-display font-bold text-zinc-900 dark:text-zinc-100">Bolão</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">Gestão de grupo: cotas, rateio de custo e de prêmio</p>
            </div>
          </div>
          <Button variant="outline" onClick={onBack} className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50">Voltar ao Início</Button>
        </div>

        {/* Criar bolão */}
        <div className="mb-8 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3 block">Novo bolão</span>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome do bolão (ex.: Bolão do trabalho)" aria-label="Nome do bolão" className="h-11 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm flex-grow" />
            <div className="flex gap-2">
              <Input value={novoPreco} onChange={(e) => setNovoPreco(e.target.value)} inputMode="decimal" aria-label="Preço por jogo" className="h-11 w-24 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm" placeholder="R$/jogo" />
              <Button onClick={handleCreate} className="h-11 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-widest"><Plus size={16} className="mr-1" /> Criar</Button>
            </div>
          </div>
        </div>

        {/* Lista de bolões */}
        {boloes.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 dark:text-zinc-500 py-8">Nenhum bolão ainda. Crie o primeiro acima.</p>
        ) : (
          <div className="space-y-3">
            {boloes.map((b) => (
              <button key={b.id} onClick={() => setSelectedId(b.id)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors text-left group">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{b.nome}</p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{b.cotistas.length} cotista(s) · {b.jogos.length} jogo(s) · {formatBRL(custoTotal(b))}</p>
                </div>
                <ChevronRight size={18} className="text-zinc-300 group-hover:text-purple-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

