// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GameCanvas from '@/components/game/GameCanvas';
import FloatingCells from '@/components/game/FloatingCells';
import { Button } from '@/components/ui/button';
import { getRoomByCode } from '@/lib/gameRoomManager';
import { setPlayerRoleImage } from '@/lib/gameEngine';
import imgWBC from '@/Images/Whiteblood cell.png';
import imgBacteria from '@/Images/Single_Bacteria_cell.png';
import imgVirus from '@/Images/Virus.png';

const DEFENDERS = [
  {
    id: 'wbc',
    team: 'defender',
    img: imgWBC,
    name: 'White Blood Cell',
    role: 'Defender',
    desc: 'Patrol the bloodstream and eliminate invaders.',
    border: 'border-indigo-200',
    ring: 'ring-indigo-400',
    bg: 'bg-indigo-50',
  },
];

const ATTACKERS = [
  {
    id: 'bacteria',
    team: 'attacker',
    img: imgBacteria,
    name: 'Bacteria',
    role: 'Invader',
    desc: 'Multiply fast and overwhelm the immune system.',
    border: 'border-emerald-200',
    ring: 'ring-emerald-400',
    bg: 'bg-emerald-50',
  },
  {
    id: 'virus',
    team: 'attacker',
    img: imgVirus,
    name: 'Virus',
    role: 'Hijacker',
    desc: 'Tiny and fast — infiltrate and replicate.',
    border: 'border-purple-200',
    ring: 'ring-purple-400',
    bg: 'bg-purple-50',
  },
];

const ALL_ROLES = [...DEFENDERS, ...ATTACKERS];

const ROLE_IMG_MAP = {
  wbc: imgWBC,
  bacteria: imgBacteria,
  virus: imgVirus,
};

function RoleCard({ r, selected, onSelect }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(r.id)}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-150 ${r.bg} ${r.border} ${
        selected ? `ring-2 ${r.ring} shadow-lg` : 'opacity-70 hover:opacity-100'
      }`}
    >
      <img src={r.img} alt={r.name} className="h-16 w-16 shrink-0 object-contain drop-shadow" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{r.role}</p>
        <p className="font-heading text-base font-bold text-foreground">{r.name}</p>
        <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{r.desc}</p>
      </div>
    </motion.button>
  );
}

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
  const [selectedRole, setSelectedRole] = useState('wbc');
  const [roleConfirmed, setRoleConfirmed] = useState(false);

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
          if (!room) throw new Error('Game room not found. Rejoin from the lobby code.');
          const matchingPlayer =
            room.players?.find((p) => p.id === storedPlayerId) ||
            room.players?.find((p) => p.name === name || p.player_name === name);
          if (!matchingPlayer) throw new Error('This device has not joined the room yet.');
          if (!isActive) return;
          setRoomId(room.id || storedRoomId);
          setPlayerId(matchingPlayer.id);
          localStorage.setItem('bd_player_id', matchingPlayer.id);
          localStorage.setItem('bd_room_id', room.id);
        }
      } catch (err) {
        if (isActive) setError(err.message || 'Failed to open game');
      } finally {
        if (isActive) setReady(true);
      }
    }
    prepareGame();
    return () => { isActive = false; };
  }, [code, nameParam, solo]);

  const handleConfirmRole = () => {
    setPlayerRoleImage(ROLE_IMG_MAP[selectedRole]);
    setRoleConfirmed(true);
  };

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

  const active = ALL_ROLES.find((r) => r.id === selectedRole);

  if (roleConfirmed) {
    return (
      <GameCanvas
        playerName={playerName}
        roomId={roomId}
        playerId={playerId}
        players={[]}
        playerTeam={active.team}
        playerRole={selectedRole}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <FloatingCells />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Choose before you play</p>
            <h1 className="mt-1 font-heading text-4xl font-bold text-foreground md:text-5xl">
              Who are you?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Pick your side in the bloodstream</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Defenders */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-indigo-200" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">Defenders</span>
                <div className="h-px flex-1 bg-indigo-200" />
              </div>
              {DEFENDERS.map((r) => (
                <RoleCard key={r.id} r={r} selected={selectedRole === r.id} onSelect={setSelectedRole} />
              ))}
              <p className="text-center text-xs leading-4 text-muted-foreground">
                Defenders cannot eat other defenders.
              </p>
            </div>

            {/* Attackers */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-rose-200" />
                <span className="text-xs font-bold uppercase tracking-widest text-rose-500">Attackers</span>
                <div className="h-px flex-1 bg-rose-200" />
              </div>
              {ATTACKERS.map((r) => (
                <RoleCard key={r.id} r={r} selected={selectedRole === r.id} onSelect={setSelectedRole} />
              ))}
              <p className="text-center text-xs leading-4 text-muted-foreground">
                Attackers cannot eat other attackers.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              onClick={handleConfirmRole}
              className="h-14 rounded-xl px-10 font-heading text-lg shadow-lg"
            >
              Play as {active?.name} →
            </Button>
            <button
              onClick={() => window.location.href = '/'}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Back to home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
