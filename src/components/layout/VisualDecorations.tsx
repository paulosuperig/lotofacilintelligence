import React from 'react';

/**
 * Fundo decorativo.
 * Mobile: blur reduzido, sem animação e com menos camadas — desfoque de 100px+
 * é o efeito mais caro em GPU de celular e derrubava a fluidez da rolagem.
 * Desktop (md+): visual original preservado integralmente.
 */
export const DecorativeBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
    <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[48px] md:blur-[100px] md:animate-pulse" />
    <div
      className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[48px] md:blur-[100px] md:animate-pulse"
      style={{ animationDelay: '2s' }}
    />
    <div className="hidden md:block absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-300/10 dark:bg-zinc-800/20 rounded-full blur-[120px]" />

    {/* Grid de fundo sutil (apenas em telas maiores: quase imperceptível no celular) */}
    <div className="hidden sm:block absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
  </div>
);

export const DemoBanner = () => (
  <div className="fixed top-0 left-0 right-0 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] py-1.5 text-center z-[100] shadow-sm">
    Modo de Demonstração — Acesso VIP Intelligence
  </div>
);
