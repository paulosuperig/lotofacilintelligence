import { ShieldCheck, Sparkles, MessageCircle, Mail } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { UserProfile } from '@/types/lottery';
import type { UserRowActions } from './types';
import { UserActionMenu } from './UserActionMenu';

interface Props extends UserRowActions {
  users: UserProfile[];
}

/** Tabela de usuários exibida a partir de telas largas. */
export const UserDesktopTable = ({ users, onEdit, onToggleStatus, onDelete }: Props) => (
    <div className="hidden lg:block overflow-x-auto rounded-xl border border-purple-100 dark:border-zinc-800">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-purple-50/50 dark:bg-zinc-800/80">
            <th className="px-6 py-4 text-[10px] font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest border-b border-purple-100 dark:border-zinc-700">Usuário</th>
            <th className="px-6 py-4 text-[10px] font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest border-b border-purple-100 dark:border-zinc-700">Contato</th>
            <th className="px-6 py-4 text-[10px] font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest border-b border-purple-100 dark:border-zinc-700">Perfil</th>
            <th className="px-6 py-4 text-[10px] font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest border-b border-purple-100 dark:border-zinc-700">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold text-purple-400 dark:text-purple-300 uppercase tracking-widest border-b border-purple-100 dark:border-zinc-700 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-50 dark:divide-zinc-800">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-purple-50/30 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    u.role === 'admin' ? "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  )}>
                    {u.role === 'admin' ? <ShieldCheck size={16} /> : <Sparkles size={16} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{u.email}</p>
                      <a 
                        href={`mailto:${u.email}`}
                        className="p-1 hover:bg-purple-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        title="Enviar E-mail"
                      >
                        <Mail size={12} />
                      </a>
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      ID: {u.id.substring(0, 8)}... | Cadastrado em {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                {u.whatsapp ? (
                  <a 
                    href={`https://wa.me/55${u.whatsapp.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    <MessageCircle size={14} />
                    {u.whatsapp}
                  </a>
                ) : (
                  <span className="text-[10px] text-zinc-400 italic">Não informado</span>
                )}
              </td>
              <td className="px-6 py-5">
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  u.role === 'admin' ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                )}>
                  {u.role === 'admin' ? 'Admin' : 'Usuário'}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    u.status === 'active' ? "bg-emerald-500" : "bg-red-500"
                  )}></span>
                  <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                    {u.status === 'active' ? 'Ativo' : 'Bloqueado'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-5 text-right">
                <UserActionMenu u={u} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
);
