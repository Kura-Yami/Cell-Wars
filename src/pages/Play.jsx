import React, { useState, useEffect } from 'react';
import GameCanvas from '@/components/game/GameCanvas';

export default function Play() {
  const urlParams = new URLSearchParams(window.location.search);
  const nameParam = urlParams.get('name');
  const solo = urlParams.get('solo');
  const code = urlParams.get('code');

  const [playerName, setPlayerName] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const name = nameParam || localStorage.getItem('bd_player_name') || 'Player';
    setPlayerName(name);
    setReady(true);
  }, [nameParam]);

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // MULTIPLAYER TODO: When code is present, fetch room players and pass to GameCanvas
  // For now, the game runs with AI opponents filling in for other players
  return <GameCanvas playerName={playerName} players={[]} />;
}