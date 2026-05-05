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
        "rounded-full flex items-center justify-center font-display font-bold transition-all duration-500 cursor-default select-none border",
        active 
          ? "bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)] border-purple-400" 
          : "bg-white text-zinc-400 border-purple-100 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-200 shadow-sm",
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
