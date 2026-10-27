import { MoreVertical, Edit, Ban, CheckCircle, Trash2 } from 'lucide-react';
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
import type { UserProfile } from '@/types/lottery';
import type { UserRowActions } from './types';

interface ActionMenuProps extends UserRowActions {
  u: UserProfile;
}

export const UserActionMenu = ({ u, onEdit, onToggleStatus, onDelete }: ActionMenuProps) => (
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
