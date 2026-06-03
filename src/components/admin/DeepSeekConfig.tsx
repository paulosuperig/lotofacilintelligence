import React, { useState } from 'react';
import { Cpu, Key, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeepSeekConfigProps {
  isConfigured: boolean;
  onSaveDeepSeekKey: (key: string) => void;
}

export const DeepSeekConfig = ({ isConfigured, onSaveDeepSeekKey }: DeepSeekConfigProps) => {
  const [tempDeepSeekKey, setTempDeepSeekKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    if (!tempDeepSeekKey.trim()) return;
    onSaveDeepSeekKey(tempDeepSeekKey);
    setTempDeepSeekKey('');
  };

  return (
    <div className="mt-8 p-8 border-t border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white shadow-lg">
          <Cpu size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none">Configuração DeepSeek AI</h3>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Integração com API Externa</p>
        </div>
        {isConfigured && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
            <CheckCircle2 size={14} /> Configurada
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl mb-8">
        <div className="space-y-3">
          <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            {isConfigured ? 'Atualizar API Key do DeepSeek' : 'API Key do DeepSeek'}
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <Input
                type={showKey ? "text" : "password"}
                placeholder={isConfigured ? "•••••••••• (digite para substituir)" : "sk-..."}
                value={tempDeepSeekKey}
                onChange={(e) => setTempDeepSeekKey(e.target.value)}
                className="pl-10 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Ocultar chave" : "Mostrar chave"}
                aria-pressed={showKey}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showKey ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            <Button
              onClick={handleSave}
              disabled={!tempDeepSeekKey.trim()}
              className="bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl px-6"
            >
              Salvar Chave
            </Button>
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed italic">
            A chave é armazenada com segurança no Supabase (system_configs, RLS admin-only) e nunca trafega no cliente.
          </p>
        </div>
      </div>
    </div>
  );
};
