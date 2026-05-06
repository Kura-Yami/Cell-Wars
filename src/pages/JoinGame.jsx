import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FloatingCells from '@/components/game/FloatingCells';
import PlayerList from '@/components/game/PlayerList';
import GameCodeDisplay from '@/components/game/GameCodeDisplay';
import { joinRoom, getRoomByCode } from '@/lib/gameRoomManager';

export default function JoinGame() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledCode = urlParams.get('code') || '';

  const [code, setCode] = useState(prefilledCode);
  const [playerName, setPlayerName] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [room, setRoom] = useState(null);
  const [waitingForStart, setWaitingForStart] = useState(false);

  const handleJoin = async () => {
    if (joining) return;
    if (!code.trim()) {
      setError('Please enter a game code');
      return;
    }
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setJoining(true);
    setError('');

    try {
      const result = await joinRoom(code.trim().toUpperCase(), playerName.trim());
      setRoom(result.room);
      localStorage.setItem('bd_player_name', playerName.trim());
      localStorage.setItem('bd_player_id', result.playerId);
      localStorage.setItem('bd_room_id', result.room.id);
      setWaitingForStart(true);
    } catch (err) {
      setError(err.message || 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  // Poll for game start until Supabase realtime is wired into the lobby.
  useEffect(() => {
    if (!waitingForStart || !room) return;
    const interval = setInterval(async () => {
      try {
        const updated = await getRoomByCode(room.code);
        if (updated) {
          setRoom(updated);
          if (updated.status === 'playing') {
            navigate(`/play?code=${room.code}&name=${encodeURIComponent(playerName)}`);
          }
        }
      } catch (err) {
        console.error('Failed to refresh lobby', err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [waitingForStart, room, navigate, playerName]);

  if (waitingForStart && room) {
    return (
      <div className="min-h-screen bg-background relative flex flex-col items-center justify-center px-4">
        <FloatingCells />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6"
        >
          <h1 className="font-heading text-2xl font-bold text-foreground">Waiting for Host</h1>
          <GameCodeDisplay code={room.code} />

          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-body text-sm">Waiting for the host to start the game...</span>
          </div>

          <PlayerList players={room.players || []} hostName={room.host_name} />

          <button
            onClick={() => { setWaitingForStart(false); setRoom(null); }}
            className="text-sm text-muted-foreground hover:text-foreground font-body underline underline-offset-4 transition-colors"
          >
            Leave Lobby
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center px-4">
      <FloatingCells />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6"
      >
        <button
          onClick={() => navigate('/')}
          className="self-start text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-body transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="font-heading text-3xl font-bold text-foreground">Join Game</h1>
        <p className="font-body text-sm text-muted-foreground text-center">
          Enter the game code shared by the host
        </p>

        <Input
          placeholder="Game code (e.g. AB3X7)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="h-12 text-center font-heading text-xl tracking-[0.2em] rounded-xl uppercase"
          maxLength={6}
        />

        <Input
          placeholder="Your name..."
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          className="h-12 text-center font-heading text-lg rounded-xl"
          maxLength={16}
        />

        {error && <p className="text-destructive text-sm font-body">{error}</p>}

        <Button
          onClick={handleJoin}
          disabled={joining}
          className="w-full h-14 font-heading text-lg rounded-xl shadow-lg gap-2"
        >
          {joining ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Join Room
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
