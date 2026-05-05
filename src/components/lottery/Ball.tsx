import React from 'react';
import { cn } from "@/lib/utils";

interface BallProps {
  number: number | string;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const Ball: React.FC<BallProps> = ({ 
  number, 
  active = false, 
  size = 'md', 
  className,
  onClick 
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base"
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-full flex items-center justify-center font-bold transition-all duration-300 cursor-default select-none shadow-lg",
        active 
          ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white scale-110 ring-2 ring-purple-300/50" 
          : "bg-slate-800/80 border border-slate-700 text-slate-300 hover:border-indigo-500/50",
        sizeClasses[size],
        onClick && "cursor-pointer hover:scale-105 active:scale-95",
        className
      )}
    >
      {number.toString().padStart(2, '0')}
    </div>
  );
};
