import React from 'react';
import { Trophy } from 'lucide-react';

function Row({ rank, entry }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-body ${entry.isLocal ? 'text-yellow-300 font-bold' : 'text-white/70'}`}>
      <span className="w-4 shrink-0 text-right">{rank}.</span>
      <span className="flex-1 truncate">{entry.name}</span>
      <span>{entry.score}</span>
    </div>
  );
}

export default function Leaderboard({ entries }) {
  if (!entries || entries.length === 0) return null;

  const top3 = entries.slice(0, 3);
  const localRank = entries.findIndex(e => e.isLocal) + 1;
  const localEntry = entries.find(e => e.isLocal);
  const localInTop3 = localRank <= 3;

  return (
    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl p-3 min-w-[160px] pointer-events-none z-10">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <span className="font-heading text-xs text-white/80 uppercase tracking-wider">Leaderboard</span>
      </div>
      <div className="space-y-1">
        {top3.map((entry, idx) => (
          <Row key={idx} rank={idx + 1} entry={entry} />
        ))}
        {!localInTop3 && localEntry && (
          <>
            <div className="my-1 border-t border-white/20" />
            <Row rank={localRank} entry={localEntry} />
          </>
        )}
      </div>
    </div>
  );
}