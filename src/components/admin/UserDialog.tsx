import React, { useState } from 'react';
import { Mail, Lock, Key } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type UserFormData = { email: string; password: string; role: "admin" | "demo"; status: "active" | "blocked" };

interface UserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: UserProfile | null;
  userFormData: UserFormData;
  setUserFormData: (data: UserFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResetPassword?: (newPassword: string) => void;
}

export const UserDialog = ({
  isOpen,
  onOpenChange,
  editingUser,
  userFormData,
  setUserFormData,
  onSubmit,
  onResetPassword
}: UserDialogProps) => {
  const [newPassword, setNewPassword] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-[425px] rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-zinc-100">{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do usuário abaixo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <Input 
                id="email" 
                type="email" 
                className="pl-10 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                placeholder="email@exemplo.com"
                value={userFormData.email}
                onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                required
              />
            </div>
          </div>
          {!editingUser && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">Senha Temporária</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  placeholder="••••••••"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                  required={!editingUser}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-zinc-700 dark:text-zinc-300">Perfil de Acesso</Label>
            <Select 
              value={userFormData.role} 
              onValueChange={(value) => setUserFormData({...userFormData, role: value as "admin" | "demo"})}
            >
              <SelectTrigger className="rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="demo">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editingUser && (
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-4">
              <Label className="text-zinc-700 dark:text-zinc-300">Resetar Senha</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <Input 
                    type="text" 
                    className="pl-10 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 h-10"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      type="button"
                      disabled={!newPassword || newPassword.length < 6}
                      variant="outline"
                      className="w-full sm:w-auto rounded-xl border-purple-200 dark:border-purple-900/30 text-purple-600 dark:text-purple-400 h-10"
                    >
                      Resetar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar reset de senha?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A senha do usuário {editingUser.email} será alterada para: <strong className="text-zinc-900 dark:text-zinc-100">{newPassword}</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                        onClick={() => {
                          if (onResetPassword) {
                            onResetPassword(newPassword);
                            setNewPassword('');
                          }
                        }}
                      >
                        Confirmar Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <p className="text-[10px] text-zinc-500">Mínimo de 6 caracteres.</p>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12">
              {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};