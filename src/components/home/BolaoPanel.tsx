import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Trash2, ChevronRight, ArrowLeft, RefreshCcw, SearchCheck, XCircle, UserPlus, Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { generateSecureId } from '@/lib/security/utils';
import { useBoloes } from '@/hooks/useBoloes';
import { lotteryService } from '@/services/lotteryService';
import { formatBRL } from '@/lib/lottery/prizeValue';
import {
  totalCotas, custoTotal, custoPorCota, custoDoCotista, conferirBolao,
  type Bolao, type BolaoConferencia,
} from '@/lib/lottery/bolao';
import { ResponsibleGaming } from '@/components/lottery/ResponsibleGaming';
import type { SavedGame } from '@/types/lottery';

interface BolaoPanelProps {
  onBack: () => void;
  history?: SavedGame[];
  defaultConcurso?: number;
}

const pad = (n: number) => String(n).padStart(2, '0');
const CELLS = Array.from({ length: 25 }, (_, i) => i + 1);

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

// ---- Detalhe de um bolão ----

interface DetailProps {
  bolao: Bolao;
  history: SavedGame[];
  defaultConcurso?: number;
  onChange: (b: Bolao) => void;
  onDelete: () => void;
  onBackToList: () => void;
}

const BolaoDetail = ({ bolao, history, defaultConcurso, onChange, onDelete, onBackToList }: DetailProps) => {
  const [nomeCotista, setNomeCotista] = useState('');
  const [cotasCotista, setCotasCotista] = useState('1');
  const [picker, setPicker] = useState<number[]>([]);
  const [concurso, setConcurso] = useState(defaultConcurso ? String(defaultConcurso) : '');
  const [conf, setConf] = useState<BolaoConferencia | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCotista = () => {
    const cotas = Math.max(1, Math.round(parseFloat(cotasCotista.replace(',', '.')) || 1));
    onChange({ ...bolao, cotistas: [...bolao.cotistas, { id: generateSecureId(), nome: nomeCotista.trim() || `Cotista ${bolao.cotistas.length + 1}`, cotas }] });
    setNomeCotista('');
    setCotasCotista('1');
  };
  const removeCotista = (id: string) => onChange({ ...bolao, cotistas: bolao.cotistas.filter((c) => c.id !== id) });

  const addGame = (nums: number[]) => {
    if (nums.length !== 15) return;
    const sig = [...nums].sort((a, b) => a - b).join(',');
    if (bolao.jogos.some((g) => [...g].sort((a, b) => a - b).join(',') === sig)) return;
    onChange({ ...bolao, jogos: [...bolao.jogos, [...nums].sort((a, b) => a - b)] });
    setConf(null);
  };
  const removeGame = (idx: number) => { onChange({ ...bolao, jogos: bolao.jogos.filter((_, i) => i !== idx) }); setConf(null); };
  const togglePick = (n: number) => setPicker((p) => p.includes(n) ? p.filter((x) => x !== n) : p.length >= 15 ? p : [...p, n]);

  const savedNotInBolao = history.filter((g) => {
    const sig = [...g.numbers].sort((a, b) => a - b).join(',');
    return !bolao.jogos.some((j) => [...j].sort((a, b) => a - b).join(',') === sig);
  }).slice(0, 12);

  const totCotas = totalCotas(bolao);

  const handleConferir = async () => {
    if (!concurso.trim() || bolao.jogos.length === 0 || loading) return;
    setLoading(true); setError(null); setConf(null);
    try {
      const res = await lotteryService.getResultByConcurso(parseInt(concurso, 10));
      setConf(conferirBolao(bolao, res.dezenas, res.premiacoes));
    } catch {
      setError('Não foi possível conferir. Verifique o concurso e sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 gap-6">
      <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-5 sm:p-8 md:p-12 shadow-xl shadow-purple-500/5">
        <div className="flex items-center justify-between mb-6 gap-3">
          <button onClick={onBackToList} className="flex items-center gap-2 text-xs font-bold text-purple-600 hover:text-purple-700"><ArrowLeft size={16} /> Meus bolões</button>
          <button onClick={onDelete} className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /> Excluir</button>
        </div>

        <h2 className="text-xl md:text-2xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1">{bolao.nome}</h2>

        {/* Resumo de custo */}
        <div className="grid grid-cols-3 gap-2 my-6">
          <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-zinc-800/40 border border-purple-100 dark:border-zinc-700 text-center">
            <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-400">Custo total</p>
            <p className="text-sm font-bold text-purple-600 dark:text-purple-400 tabular-nums">{formatBRL(custoTotal(bolao))}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-zinc-800/40 border border-purple-100 dark:border-zinc-700 text-center">
            <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-400">Por cota</p>
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 tabular-nums">{totCotas > 0 ? formatBRL(custoPorCota(bolao)) : '—'}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-zinc-800/40 border border-purple-100 dark:border-zinc-700 text-center">
            <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-400">Cotas</p>
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 tabular-nums">{totCotas}</p>
          </div>
        </div>

        {/* Cotistas */}
        <section className="mb-8">
          <h3 className="flex items-center gap-2 text-[11px] uppercase font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-3"><UserPlus size={14} /> Cotistas</h3>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <Input value={nomeCotista} onChange={(e) => setNomeCotista(e.target.value)} placeholder="Nome do cotista" aria-label="Nome do cotista" className="h-10 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm flex-grow" />
            <div className="flex gap-2">
              <Input value={cotasCotista} onChange={(e) => setCotasCotista(e.target.value)} inputMode="numeric" aria-label="Cotas" className="h-10 w-20 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" placeholder="Cotas" />
              <Button onClick={addCotista} className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"><Plus size={14} /></Button>
            </div>
          </div>
          {bolao.cotistas.length === 0 ? (
            <p className="text-[11px] text-zinc-400">Adicione cotistas e suas cotas para ratear o custo.</p>
          ) : (
            <div className="space-y-1.5">
              {bolao.cotistas.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{c.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-400">{c.cotas} cota(s) · {formatBRL(custoDoCotista(bolao, c))}</span>
                    <button onClick={() => removeCotista(c.id)} aria-label={`Remover ${c.nome}`} className="text-zinc-300 hover:text-rose-500"><XCircle size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Jogos */}
        <section className="mb-8">
          <h3 className="flex items-center gap-2 text-[11px] uppercase font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-3"><Ticket size={14} /> Jogos ({bolao.jogos.length})</h3>

          {bolao.jogos.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {bolao.jogos.map((g, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-700">
                  <div className="flex flex-wrap gap-1">
                    {g.map((n) => <span key={n} className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-600 text-[10px] font-bold tabular-nums">{pad(n)}</span>)}
                  </div>
                  <button onClick={() => removeGame(i)} aria-label={`Remover jogo ${i + 1}`} className="text-zinc-300 hover:text-rose-500 shrink-0"><XCircle size={16} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar dos jogos salvos */}
          {savedNotInBolao.length > 0 && (
            <div className="mb-4">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Adicionar dos seus jogos salvos:</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {savedNotInBolao.map((g) => (
                  <button key={g.id} onClick={() => addGame(g.numbers)} className="px-2.5 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:border-purple-300 transition-colors">
                    + {g.numbers.slice(0, 3).map(pad).join(' ')}…
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Picker manual */}
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Novo jogo avulso</span>
              <span className={cn('text-[10px] font-bold', picker.length === 15 ? 'text-emerald-500' : 'text-purple-500')}>{picker.length}/15</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {CELLS.map((n) => {
                const on = picker.includes(n);
                return (
                  <button key={n} type="button" aria-pressed={on} aria-label={`Dezena ${n}`} onClick={() => togglePick(n)}
                    className={cn('aspect-square rounded-lg border text-xs font-bold tabular-nums flex items-center justify-center transition-all active:scale-95',
                      on ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-purple-300')}>
                    {pad(n)}
                  </button>
                );
              })}
            </div>
            <Button disabled={picker.length !== 15} onClick={() => { addGame(picker); setPicker([]); }} className="w-full mt-3 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50">
              Adicionar jogo
            </Button>
          </div>
        </section>

        {/* Conferência do bolão */}
        <section className="mb-4">
          <h3 className="flex items-center gap-2 text-[11px] uppercase font-bold tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-3"><SearchCheck size={14} /> Conferir contra um concurso</h3>
          <div className="flex gap-2">
            <Input value={concurso} onChange={(e) => { setConcurso(e.target.value); setConf(null); }} type="number" inputMode="numeric" aria-label="Concurso" placeholder={defaultConcurso ? `Ex.: ${defaultConcurso}` : 'Nº do concurso'} className="h-11 w-40 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm" />
            <Button onClick={handleConferir} disabled={loading || bolao.jogos.length === 0 || !concurso.trim()} className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50">
              {loading ? <RefreshCcw className="animate-spin mr-2" size={14} /> : <SearchCheck className="mr-2" size={14} />}
              {loading ? 'Conferindo...' : 'Conferir'}
            </Button>
          </div>
          {error && <p className="text-xs text-rose-500 mt-3">{error}</p>}

          {conf && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <div className={cn('p-5 rounded-[1.5rem] text-white', conf.totalPremio > 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-zinc-700 to-zinc-800')}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/70">Resultado do bolão</p>
                    <p className="text-lg font-display font-bold">Prêmio total: {formatBRL(conf.totalPremio)}</p>
                    <p className="text-[11px] text-white/80">{conf.premiados} jogo(s) premiado(s) · melhor: {conf.melhorAcerto} acertos</p>
                  </div>
                </div>
                {conf.totalPremio > 0 && totCotas > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/70 mb-1">Rateio por cotista</p>
                    {conf.rateio.map((r) => (
                      <div key={r.cotistaId} className="flex items-center justify-between text-xs">
                        <span>{r.nome} <span className="text-white/60">({r.cotas} cota{r.cotas !== 1 ? 's' : ''})</span></span>
                        <span className="font-bold tabular-nums">{formatBRL(r.valor)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </section>

        <ResponsibleGaming games={bolao.jogos.length || undefined} />
      </div>
    </motion.div>
  );
};
