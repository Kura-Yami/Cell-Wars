import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FloatingCells from '@/components/game/FloatingCells';

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center px-4">
      <FloatingCells />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
        {/* Logo / Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent flex items-center justify-center mb-6 shadow-xl border-2 border-primary/10"
        >
          <Shield className="w-12 h-12 md:w-16 md:h-16 text-primary" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-heading text-5xl md:text-7xl font-bold text-foreground mb-2"
        >
          Cell Wars
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="font-heading text-lg md:text-xl text-primary font-medium mb-4"
        >
          Body Defense
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="font-body text-muted-foreground text-sm md:text-base mb-10 max-w-sm leading-relaxed"
        >
          Control your white blood cell. Consume red cells to grow. Fight bacteria, viruses, and cancer. Survive the bloodstream!
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-xs"
        >
          <Link to="/host" className="flex-1">
            <Button className="w-full h-14 font-heading text-lg rounded-xl shadow-lg bg-primary hover:bg-primary/90 gap-2">
              <Users className="w-5 h-5" />
              Host Game
            </Button>
          </Link>
          <Link to="/join" className="flex-1">
            <Button variant="outline" className="w-full h-14 font-heading text-lg rounded-xl shadow-lg border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground gap-2">
              <Zap className="w-5 h-5" />
              Join Game
            </Button>
          </Link>
        </motion.div>

        {/* Quick play */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8"
        >
          <Link to="/play?solo=true">
            <button className="font-body text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
              or play solo →
            </button>
          </Link>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-16 grid grid-cols-3 gap-6 text-center w-full"
        >
          {[
            { icon: '🦠', label: 'Fight Bacteria' },
            { icon: '🧬', label: 'Grow & Evolve' },
            { icon: '🏆', label: 'Compete' },
          ].map((feat, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-2xl">{feat.icon}</span>
              <span className="font-body text-xs text-muted-foreground">{feat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}