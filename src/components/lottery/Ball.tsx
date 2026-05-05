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
    <motion.div 
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "rounded-full flex items-center justify-center font-display font-bold transition-all duration-500 cursor-default select-none premium-border",
        active 
          ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)] border-white/20" 
          : "bg-white/[0.03] text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08] hover:border-white/10",
        sizeClasses[size],
        onClick && "cursor-pointer",
        className
      )}
    >
      <span className="relative z-10">{number.toString().padStart(2, '0')}</span>
    </motion.div>
  );
};
import { motion } from 'framer-motion';
