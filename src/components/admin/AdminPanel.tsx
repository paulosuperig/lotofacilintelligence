import React, { useState } from 'react';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  MoreVertical, 
  Edit, 
  Ban, 
  CheckCircle, 
  Trash2,
  Key,
  Eye,
  EyeOff,
  Cpu,
  Target,
  ShieldAlert
} from 'lucide-react';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface AdminPanelProps {
  users: any[];
  onBack: () => void;
  onCreateOrUpdateUser: (userData: any, editingUser: any) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
  deepSeekKey: string;
  onSaveDeepSeekKey: (key: string) => void;
}

export const AdminPanel = ({ 
  users, 
  onBack, 
  onCreateOrUpdateUser, 
  onDeleteUser, 
  onToggleUserStatus,
  deepSeekKey,
  onSaveDeepSeekKey
}: AdminPanelProps) => {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
   const [userFormData, setUserFormData] = useState({ email: '', password: '', role: 'demo', status: 'active' });
   const [tempDeepSeekKey, setTempDeepSeekKey] = useState(deepSeekKey);
   const [showKey, setShowKey] = useState(false);
   const [showEmails, setShowEmails] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateOrUpdateUser(userFormData, editingUser);
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setUserFormData({ email: '', password: '', role: 'demo', status: 'active' });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 rounded-2xl md:rounded-[2rem] p-4 md:p-12 shadow-xl shadow-purple-500/5">
      <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-8 md:mb-10 gap-4 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-zinc-900 dark:text-zinc-100 mb-1 md:mb-2">Configurações do Sistema</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">Gerenciamento de usuários e acessos</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowEmails(!showEmails)}
            className="rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-400"
          >
            {showEmails ? <EyeOff size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}
            {showEmails ? 'Ocultar E-mails' : 'Revelar E-mails'}
          </Button>
          <Dialog open={isUserDialogOpen} onOpenChange={(open) => {
            setIsUserDialogOpen(open);
            if (!open) {
              setEditingUser(null);
              setUserFormData({ email: '', password: '', role: 'demo', status: 'active' });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                <UserPlus size={18} className="mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do usuário abaixo.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
                      <SelectItem value="demo">Demonstrativo (VIP)</SelectItem>
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
          <Button 
            variant="outline" 
            onClick={onBack}
            className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50"
          >
            Voltar
          </Button>
        </div>
      </div>

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
                      <DropdownMenuItem onClick={() => {
                        setEditingUser(u);
                        setUserFormData({ email: u.email, password: '', role: u.role, status: u.status });
                        setIsUserDialogOpen(true);
                      }} className="cursor-pointer">
                        <Edit size={14} className="mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleUserStatus(u.id)} className="cursor-pointer">
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
                              onClick={() => onDeleteUser(u.id)}
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
                  value={tempDeepSeekKey}
                  onChange={(e) => setTempDeepSeekKey(e.target.value)}
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
                onClick={() => onSaveDeepSeekKey(tempDeepSeekKey)}
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

      <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1">Proteção de Dados Intelligence</h4>
          <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
            Este painel opera sob diretrizes de <strong>Zero Trust</strong>. Dados sensíveis como e-mails são mascarados e senhas são criptografadas com SHA-256 antes do armazenamento local.
          </p>
        </div>
      </div>
    </div>
  );
};
