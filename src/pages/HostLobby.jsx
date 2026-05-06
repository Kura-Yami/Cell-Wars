import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FloatingCells from '@/components/game/FloatingCells';
import GameCodeDisplay from '@/components/game/GameCodeDisplay';
import QRCodeDisplay from '@/components/game/QRCodeDisplay';
import PlayerList from '@/components/game/PlayerList';
import { createRoom, getRoomByCode, leaveRoom, startGame } from '@/lib/gameRoomManager';

function getConfiguredJoinOrigin(value) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return '';
  }

  try {
    return new URL(trimmedValue).origin;
  } catch {
    return trimmedValue.replace(/\/join.*$/, '').replace(/\/$/, '');
  }
}

const configuredJoinOrigin = getConfiguredJoinOrigin(import.meta.env.VITE_JOIN_ORIGIN);
const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|$)/.test(origin);
const getJoinOrigin = () => {
  if (!isLocalOrigin(window.location.origin)) {
    return window.location.origin;
  }

  return configuredJoinOrigin || window.location.origin;
};

export default function HostLobby() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState('');
  const [room, setRoom] = useState(null);
  const [creating, setCreating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [playerId, setPlayerId] = useState(localStorage.getItem('bd_player_id') || '');

  const handleCreate = async () => {
    if (creating) return;
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const result = await createRoom(hostName.trim());
      setRoom(result.room);
      setPlayerId(result.playerId);
      localStorage.setItem('bd_player_name', hostName.trim());
      localStorage.setItem('bd_player_id', result.playerId);
      localStorage.setItem('bd_room_id', result.room.id);
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  // Poll for player updates until Supabase realtime is wired into the lobby.
  useEffect(() => {
    if (!room) return;
    const interval = setInterval(async () => {
      try {
        const updated = await getRoomByCode(room.code);
        if (updated) setRoom(updated);
      } catch (err) {
        console.error('Failed to refresh lobby', err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [room]);

  const handleStart = async () => {
    if (!room) return;
    setStarting(true);
    setError('');
    try {
      await startGame(room.id);
      navigate(`/play?code=${room.code}&name=${encodeURIComponent(hostName)}`);
    } catch (err) {
      setError(err.message || 'Failed to start game');
    } finally {
      setStarting(false);
    }
  };

  const handleLeaveLobby = async () => {
    try {
      await leaveRoom(playerId || localStorage.getItem('bd_player_id'));
    } catch (err) {
      console.error('Failed to leave lobby', err);
    } finally {
      localStorage.removeItem('bd_player_id');
      localStorage.removeItem('bd_room_id');
      navigate('/');
    }
  };

  const joinOrigin = getJoinOrigin();
  const joinUrl = room ? `${joinOrigin}/join?code=${room.code}` : '';
  const qrNeedsNetworkUrl = room && isLocalOrigin(joinOrigin);
  const roomIsLocalOnly = room?.is_local;

  if (!room) {
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

          <h1 className="font-heading text-3xl font-bold text-foreground">Host a Game</h1>
          <p className="font-body text-sm text-muted-foreground text-center">
            Enter your name to create a game room
          </p>

          <Input
            placeholder="Your name..."
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="h-12 text-center font-heading text-lg rounded-xl"
            maxLength={16}
          />

          {error && <p className="text-destructive text-sm font-body">{error}</p>}

          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full h-14 font-heading text-lg rounded-xl shadow-lg"
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Room'}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center px-4 py-8">
      <FloatingCells />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md flex flex-col items-center gap-8"
      >
        <button
          onClick={handleLeaveLobby}
          className="self-start text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-body transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </button>

        <h1 className="font-heading text-2xl font-bold text-foreground">Game Lobby</h1>

        <GameCodeDisplay code={room.code} />

        <QRCodeDisplay value={joinUrl} size={160} />

        <p className="text-xs text-muted-foreground font-body text-center">
          Share this code or QR with friends to join
        </p>

        {qrNeedsNetworkUrl && (
          <p className="max-w-sm rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
            This QR uses localhost, which only works on this device. Open the app from Vite's Network URL or set VITE_JOIN_ORIGIN.
          </p>
        )}

        {roomIsLocalOnly && (
          <p className="max-w-sm rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
            This is a local-only room because Supabase is not configured. Other devices cannot find this code.
          </p>
        )}

        <PlayerList players={room.players || []} hostName={hostName} />

        {error && <p className="text-destructive text-sm font-body text-center">{error}</p>}

        <Button
          onClick={handleStart}
          disabled={starting}
          className="w-full max-w-xs h-14 font-heading text-lg rounded-xl shadow-lg bg-primary hover:bg-primary/90 gap-2"
        >
          {starting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Game
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
