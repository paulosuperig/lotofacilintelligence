import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, History, Share2 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          LotoPro Premium
        </h1>
        <Button variant="outline" className="border-indigo-500/50 hover:bg-indigo-500/10">
          Entrar
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Latest Draw Info */}
        <Card className="md:col-span-2 bg-slate-900/50 border-indigo-500/20 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-indigo-300 flex items-center gap-2">
              <History size={20} /> Último Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-wider py-4">
              {/* Mock Numbers */}
              01 03 04 05 06 08 10 11 12 15 18 19 21 23 25
            </div>
            <p className="text-slate-400 text-sm">Concurso 3150 • 05/05/2026</p>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 border-none shadow-xl shadow-indigo-900/20">
          <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center gap-4">
            <Zap size={48} className="text-white" />
            <h2 className="text-xl font-semibold">Gerar Novo Jogo</h2>
            <Button className="bg-white text-indigo-700 hover:bg-indigo-50 w-full">
              Criar agora
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-indigo-500/20">
            <CardHeader><CardTitle className="flex items-center gap-2 text-purple-300"><TrendingUp size={20}/> Estatísticas</CardTitle></CardHeader>
            <CardContent>
                <p className="text-slate-400">Análises de tendências em breve...</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
