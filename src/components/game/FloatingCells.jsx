import React from 'react';
import { motion } from 'framer-motion';

// Decorative floating cells for lobby/home backgrounds
export default function FloatingCells() {
  const cells = [
    { color: 'bg-red-400/20', size: 'w-16 h-16', x: '10%', y: '20%', delay: 0 },
    { color: 'bg-red-300/15', size: 'w-10 h-10', x: '80%', y: '15%', delay: 0.5 },
    { color: 'bg-purple-400/15', size: 'w-12 h-12', x: '70%', y: '70%', delay: 1 },
    { color: 'bg-red-500/10', size: 'w-20 h-20', x: '20%', y: '75%', delay: 1.5 },
    { color: 'bg-purple-300/10', size: 'w-8 h-8', x: '55%', y: '40%', delay: 2 },
    { color: 'bg-green-400/10', size: 'w-14 h-14', x: '90%', y: '50%', delay: 0.8 },
    { color: 'bg-red-400/10', size: 'w-6 h-6', x: '35%', y: '90%', delay: 1.2 },
    { color: 'bg-purple-500/10', size: 'w-10 h-10', x: '5%', y: '50%', delay: 2.3 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {cells.map((cell, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${cell.color} ${cell.size} blur-sm`}
          style={{ left: cell.x, top: cell.y }}
          animate={{
            y: [0, -20, 0, 15, 0],
            x: [0, 10, 0, -10, 0],
            scale: [1, 1.1, 1, 0.95, 1],
          }}
          transition={{
            duration: 8 + i * 0.5,
            repeat: Infinity,
            delay: cell.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}