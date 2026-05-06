import React from 'react';
import { User, Crown } from 'lucide-react';

export default function PlayerList({ players, hostName }) {
  const visiblePlayers = (players || []).filter((player) => !player.is_eliminated);

  return (
    <div className="w-full max-w-sm">
      <h3 className="font-heading text-lg text-foreground mb-3 flex items-center gap-2">
        <User className="w-5 h-5 text-primary" />
        Players ({visiblePlayers.length})
      </h3>
      <div className="space-y-2">
        {visiblePlayers.map((player, idx) => {
          const playerName = player.name || player.player_name || 'Player';

          return (
            <div
              key={player.id || idx}
              className="flex items-center gap-3 bg-card/80 border border-border rounded-lg px-4 py-2.5 transition-all hover:border-primary/30"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-heading text-sm text-primary font-bold">
                {playerName[0]?.toUpperCase() || '?'}
              </div>
              <span className="font-body text-sm text-foreground flex-1">{playerName}</span>
              {playerName === hostName && (
                <Crown className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
