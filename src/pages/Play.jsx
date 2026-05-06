import React, { useState, useEffect } from 'react';
import GameCanvas from '@/components/game/GameCanvas';
import { getRoomByCode } from '@/lib/gameRoomManager';

export default function Play() {
  const urlParams = new URLSearchParams(window.location.search);
  const nameParam = urlParams.get('name');
  const solo = urlParams.get('solo');
  const code = urlParams.get('code');

  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function prepareGame() {
      try {
        const name = nameParam || localStorage.getItem('bd_player_name') || 'Player';
        const storedPlayerId = localStorage.getItem('bd_player_id');
        const storedRoomId = localStorage.getItem('bd_room_id');

        if (!isActive) return;
        setPlayerName(name);
        setPlayerId(storedPlayerId);

        if (code && !solo) {
          const room = await getRoomByCode(code);

          if (!room) {
            throw new Error('Game room not found. Rejoin from the lobby code.');
          }

          const matchingPlayer =
            room.players?.find((player) => player.id === storedPlayerId) ||
            room.players?.find((player) => player.name === name || player.player_name === name);

          if (!matchingPlayer) {
            throw new Error('This device has not joined the room yet. Go back and join with the room code first.');
          }

          if (!isActive) return;
          setRoomId(room.id || storedRoomId);
          setPlayerId(matchingPlayer.id);
          localStorage.setItem('bd_player_id', matchingPlayer.id);
          localStorage.setItem('bd_room_id', room.id);
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || 'Failed to open game');
        }
      } finally {
        if (isActive) {
          setReady(true);
        }
      }
    }

    prepareGame();

    return () => {
      isActive = false;
    };
  }, [code, nameParam, solo]);

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm rounded-lg border border-border bg-white/90 p-6 text-center shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-foreground">Could not open game</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.href = code ? `/join?code=${code}` : '/'}
            className="mt-5 rounded-lg bg-primary px-4 py-2 font-heading text-sm text-primary-foreground"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameCanvas
      playerName={playerName}
      roomId={roomId}
      playerId={playerId}
      players={[]}
    />
  );
}
