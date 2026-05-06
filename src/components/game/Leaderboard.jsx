import React from 'react';
import { Trophy } from 'lucide-react';

export default function Leaderboard({ entries }) {
  if (!entries || entries.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl p-3 min-w-[160px] pointer-events-none z-10">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <span className="font-heading text-xs text-white/80 uppercase tracking-wider">Leaderboard</span>
      </div>
      <div className="space-y-1">
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 text-xs font-body ${
              entry.isLocal ? 'text-yellow-300 font-bold' : 'text-white/70'
            }`}
          >
            <span className="w-4 text-right">{idx + 1}.</span>
            <span className="flex-1 truncate">{entry.name}</span>
            <span>{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}