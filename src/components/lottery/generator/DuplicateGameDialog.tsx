import React from 'react';
import { AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DuplicateGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DuplicateGameDialog = ({ open, onOpenChange }: DuplicateGameDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="rounded-[2rem] border-zinc-100 dark:border-zinc-800 shadow-2xl">
      <AlertDialogHeader>
        <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500 mb-4">
          <AlertCircle size={32} />
        </div>
        <AlertDialogTitle className="text-2xl font-display font-bold text-center text-zinc-900 dark:text-zinc-100">
          Jogo Repetido!
        </AlertDialogTitle>
        <AlertDialogDescription className="text-center text-zinc-500 dark:text-zinc-400 text-base leading-relaxed">
          Você já possui este jogo salvo em seu histórico. Experimente gerar uma nova combinação otimizada!
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="sm:justify-center mt-6">
        <AlertDialogAction
          onClick={() => onOpenChange(false)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-12 px-8 font-bold uppercase tracking-widest text-xs transition-all active:scale-95"
        >
          Entendido
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
