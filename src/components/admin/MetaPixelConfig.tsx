import React, { useEffect, useState } from 'react';
import { Activity, Hash, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { aiConfigService } from '@/services/aiConfigService';
import { initMetaPixel } from '@/lib/analytics/metaPixel';

export const MetaPixelConfig = () => {
  const { toast } = useToast();
  const [pixelId, setPixelId] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    aiConfigService.getMetaPixelId().then(setCurrentId).catch(() => {});
  }, []);

  const handleSave = async () => {
    const clean = pixelId.trim();
    if (!/^\d{6,20}$/.test(clean)) {
      toast({ title: 'ID inválido', description: 'Use apenas dígitos (6 a 20 caracteres).', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await aiConfigService.saveMetaPixelId(clean);
      setCurrentId(clean);
      setPixelId('');
      initMetaPixel(clean);
      toast({ title: 'Pixel configurado', description: 'O Meta Pixel foi salvo e ativado.' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err?.message || 'Verifique suas permissões de admin.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-8 p-8 border-t border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
          <Activity size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none">Meta / Facebook Pixel</h3>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Rastreamento de Campanhas Ads</p>
        </div>
        {currentId && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
            <CheckCircle2 size={14} /> Ativo: {currentId}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        <div className="space-y-3">
          <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            {currentId ? 'Atualizar ID do Pixel' : 'ID do Pixel do Meta'}
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <Input
                type="text"
                inputMode="numeric"
                placeholder={currentId ? `Atual: ${currentId}` : 'Ex: 1234567890123456'}
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value.replace(/\D/g, ''))}
                className="pl-10 rounded-xl"
                maxLength={20}
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={!pixelId.trim() || saving}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
            >
              {saving ? 'Salvando...' : 'Salvar Pixel'}
            </Button>
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed italic">
            Eventos rastreados: PageView, Login (CompleteRegistration), GerarJogos, SalvarJogo, ConsultaIA, AbrirAdmin.
            O Pixel é carregado dinamicamente e pode ser auditado no Meta Events Manager.
          </p>
        </div>
      </div>
    </div>
  );
};
