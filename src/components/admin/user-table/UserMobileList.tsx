import { ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { UserProfile } from '@/types/lottery';
import type { UserRowActions } from './types';
import { UserActionMenu } from './UserActionMenu';

interface Props extends UserRowActions {
  users: UserProfile[];
}

/** Lista de usuários em cartões para telas estreitas. */
export const UserMobileList = ({ users, onEdit, onToggleStatus, onDelete }: Props) => (
    <div className="lg:hidden space-y-4">
      {users.map((u) => (
        <div key={u.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                u.role === 'admin' ? "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              )}>
                {u.role === 'admin' ? <ShieldCheck size={20} /> : <Sparkles size={20} />}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 break-all">{u.email}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium">
                  ID: {u.id.substring(0, 8)}
                </p>
              </div>
            </div>
            <UserActionMenu u={u} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50 dark:border-zinc-800/50">
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-bold mb-1">Perfil</p>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                u.role === 'admin' ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              )}>
                {u.role === 'admin' ? 'Admin' : 'Usuário'}
              </span>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-bold mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  u.status === 'active' ? "bg-emerald-500" : "bg-red-500"
                )}></span>
                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                  {u.status === 'active' ? 'Ativo' : 'Bloqueado'}
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-bold mb-1">WhatsApp</p>
              {u.whatsapp ? (
                <a 
                  href={`https://wa.me/55${u.whatsapp.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <MessageCircle size={12} />
                  {u.whatsapp}
                </a>
              ) : (
                <span className="text-[10px] text-zinc-400 italic">Não informado</span>
              )}
            </div>
            <div className="col-span-2">
              <p className="text-[9px] uppercase tracking-[0.15em] text-zinc-400 font-bold mb-1">Cadastro</p>
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
);
