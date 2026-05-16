import React from 'react';
import { ShieldCheck, Sparkles, MoreVertical, Edit, Ban, CheckCircle, Trash2 } from 'lucide-react';
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
  showEmails: boolean;
  onEdit: (user: any) => void;
  onToggleStatus: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export const UserTable = ({ users, showEmails, onEdit, onToggleStatus, onDelete }: UserTableProps) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-purple-100 dark:border-zinc-800">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-purple-50/50 dark:bg-zinc-800/50">
            <th className="px-6 py-4 text-[10px] font-bold text-purple-400 uppercase tracking-widest border-b border-purple-100">Usuário</th>
            <th className="px-6 py-4 text-[10px] font-bold text-purple-400 uppercase tracking-widest border-b border-purple-100">Perfil</th>
            <th className="px-6 py-4 text-[10px] font-bold text-purple-400 uppercase tracking-widest border-b border-purple-100">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold text-purple-400 uppercase tracking-widest border-b border-purple-100 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-50">
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
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {showEmails ? u.email : maskSensitiveData(u.email)}
                      {u.full_name && <span className="ml-2 font-normal text-zinc-400 text-xs">({u.full_name})</span>}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {u.whatsapp && <span className="mr-2 text-emerald-500">WA: {u.whatsapp} |</span>}
                      ID: {u.id.substring(0, 8)}... | Cadastrado em {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-zinc-100 text-zinc-700"
                )}>
                  {u.role === 'admin' ? 'Admin' : 'Demo'}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    u.status === 'active' ? "bg-emerald-500" : "bg-red-500"
                  )}></span>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase">
                    {u.status === 'active' ? 'Ativo' : 'Bloqueado'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-5 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl w-48">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(u)} className="cursor-pointer">
                      <Edit size={14} className="mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleStatus(u.id)} className="cursor-pointer">
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
                      <AlertDialogContent className="rounded-3xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O usuário {u.email} perderá acesso imediato ao sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
