import React from 'react';
import { motion } from 'framer-motion';

const GridBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* 基础背景色 */}
      <div className="absolute inset-0 bg-gray-900" />
      
      {/* 漂浮的网格层 */}
      <motion.div 
        className="absolute inset-0"
        animate={{ 
          x: [0, 20, 0, -20, 0],
          y: [0, -20, 0, 20, 0],
        }}
        transition={{
          duration: 20,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <div 
          className="absolute inset-0 scale-150"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(66, 153, 225, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(66, 153, 225, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </motion.div>

      {/* 漂浮的光点 */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 40 - 20],
            y: [0, Math.random() * 40 - 20],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            delay: Math.random() * 5,
          }}
        />
      ))}

      {/* 大型光晕效果 */}
      <motion.div 
        className="absolute inset-0"
        animate={{ 
          x: [0, -30, 0, 30, 0],
          y: [0, 30, 0, -30, 0],
        }}
        transition={{
          duration: 30,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute -right-1/4 -bottom-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-[100px]" />
      </motion.div>

      {/* 渐变叠加层 - 减少不透明度 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/30 to-gray-900" />
    </div>
  );
};

export default GridBackground; 