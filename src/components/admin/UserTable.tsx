import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  MoreVertical, 
  Edit, 
  Ban, 
  CheckCircle, 
  Trash2,
  MessageCircle,
  Mail 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { maskSensitiveData } from '@/lib/security/utils';

interface UserTableProps {
  users: any[];
  onEdit: (user: any) => void;
  onToggleStatus: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export const UserTable = ({ users, onEdit, onToggleStatus, onDelete }: UserTableProps) => (
  <div className="w-full">
    {/* Desktop View */}
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
                <ActionMenu u={u} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Mobile View */}
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
            <ActionMenu u={u} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />
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
  </div>
);

const ActionMenu = ({ u, onEdit, onToggleStatus, onDelete }: any) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <MoreVertical size={16} />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="rounded-xl w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      <DropdownMenuLabel className="text-zinc-500 dark:text-zinc-400">Ações</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onEdit(u)} className="cursor-pointer text-zinc-900 dark:text-zinc-100">
        <Edit size={14} className="mr-2" /> Editar
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onToggleStatus(u.id)} className="cursor-pointer text-zinc-900 dark:text-zinc-100">
        {u.status === 'active' ? (
          <><Ban size={14} className="mr-2 text-amber-500" /> Bloquear</>
        ) : (
          <><CheckCircle size={14} className="mr-2 text-emerald-500" /> Desbloquear</>
        )}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 cursor-pointer">
            <Trash2 size={14} className="mr-2" /> Excluir
          </DropdownMenuItem>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-3xl w-[95%] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário {u.email} perderá acesso imediato ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onDelete(u.id)}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenuContent>
  </DropdownMenu>
);
