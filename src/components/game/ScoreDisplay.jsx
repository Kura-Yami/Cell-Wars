import React from 'react';

export default function ScoreDisplay({ score, playerName }) {
  return (
    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 z-10 pointer-events-none">
      <p className="font-heading text-xs text-white/60 uppercase tracking-wider">{playerName}</p>
      <p className="font-heading text-2xl text-white font-bold">{score}</p>
    </div>
  );
}