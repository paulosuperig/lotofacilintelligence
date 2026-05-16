import React, { useState } from 'react';
import { Cpu, Key, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeepSeekConfigProps {
  initialKey: string;
  onSave: (key: string) => void;
}

export const DeepSeekConfig = ({ initialKey, onSave }: DeepSeekConfigProps) => {
  const [tempKey, setTempKey] = useState(initialKey);
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="mt-8 p-8 border-t border-purple-100 dark:border-zinc-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Cpu size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none">Integração DeepSeek AI</h3>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-widest mt-1">Configuração de Inteligência Artificial</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-2xl mb-8">
        <div className="space-y-3">
          <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">API Key do DeepSeek</Label>
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <Input 
                type={showKey ? "text" : "password"} 
                placeholder="sk-..." 
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="pl-10 rounded-xl border-purple-100"
              />
              <button 
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-purple-600 transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Button 
              onClick={() => onSave(tempKey)}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6"
            >
              Salvar Chave
            </Button>
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed italic">
            A chave será armazenada localmente e usada para alimentar o especialista em IA.
          </p>
        </div>
      </div>
    </div>
  );
};
