import React from 'react';
import { Mail, Lock } from 'lucide-react';
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

interface UserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: any;
  userFormData: any;
  setUserFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const UserDialog = ({
  isOpen,
  onOpenChange,
  editingUser,
  userFormData,
  setUserFormData,
  onSubmit
}: UserDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px] rounded-3xl">
      <DialogHeader>
        <DialogTitle>{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
        <DialogDescription>
          Preencha os dados do usuário abaixo.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <Input 
              id="email" 
              type="email" 
              className="pl-10 rounded-xl"
              placeholder="email@exemplo.com"
              value={userFormData.email}
              onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
              required
            />
          </div>
        </div>
        {!editingUser && (
          <div className="space-y-2">
            <Label htmlFor="password">Senha Temporária</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <Input 
                id="password" 
                type="password" 
                className="pl-10 rounded-xl"
                placeholder="••••••••"
                value={userFormData.password}
                onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                required={!editingUser}
              />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="role">Perfil de Acesso</Label>
          <Select 
            value={userFormData.role} 
            onValueChange={(value: any) => setUserFormData({...userFormData, role: value})}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Selecione o perfil" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="demo">Usuário</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="pt-4">
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12">
            {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);
