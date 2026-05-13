import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface BallProps {
  number: number | string;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const Ball = memo(({ 
  number, 
  active = false, 
  size = 'md', 
  className,
  onClick 
}: BallProps) => {
  const sizeClasses = {
    sm: "w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-[9px] xs:text-[10px] sm:text-[11px] md:text-xs",
    md: "w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[10px] xs:text-xs sm:text-sm md:text-base",
    lg: "w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 text-[10px] xs:text-xs sm:text-sm md:text-lg"
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "rounded-full flex items-center justify-center font-display font-bold transition-all duration-500 cursor-default select-none border shrink-0",
        active 
          ? "bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30 border-2 border-white/20" 
          : "bg-white dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border border-zinc-100 dark:border-zinc-700",
        sizeClasses[size],
        onClick && "cursor-pointer",
        className
      )}
    >
      <span className="relative z-10">{number.toString().padStart(2, '0')}</span>
    </motion.div>
  );
});

Ball.displayName = 'Ball';
