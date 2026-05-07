// @ts-nocheck
import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  ABILITY_CONFIG,
  activateAbility,
  createGameState,
  getLeaderboard,
  initGameImages,
  mapRoomPlayerToGamePlayer,
  renderGame,
  updateGameState,
} from '@/lib/gameEngine';
import imgWhiteBloodCell from '@/Images/Whiteblood cell.png';
import imgRedBloodCell from '@/Images/RedBloodCell.png';
import imgSingleBacteria from '@/Images/Single_Bacteria_cell.png';
import imgVirus from '@/Images/Virus.png';
import imgCancerCell from '@/Images/Cancercell.png';
import { leaveRoomPlayer, subscribeToRoomPlayers, updateRoomPlayerState } from '@/api/gameRooms';
import Leaderboard from './Leaderboard';
import ScoreDisplay from './ScoreDisplay';
import Minimap from './Minimap';

function AbilityButton({ role, cooldown, active, onActivate }) {
  const cfg = ABILITY_CONFIG[role];
  if (!cfg) return null;
  const onCooldown = cooldown > 0;
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (onCooldown ? cooldown / cfg.cooldown : 0);

  return (
    <div className="absolute bottom-16 right-4 z-10 flex flex-col items-center gap-1">
      <button
        onClick={onActivate}
        disabled={onCooldown}
        style={{ borderColor: active ? cfg.color : undefined }}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm border-2 transition-all
          ${active ? 'border-yellow-300 bg-yellow-400/20 text-yellow-200' :
            onCooldown ? 'border-white/20 bg-black/50 text-white/40 cursor-not-allowed' :
            'border-white/40 bg-black/60 text-white hover:bg-black/80 cursor-pointer'}`}
      >
        <svg className="absolute inset-0" width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          {onCooldown && (
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
            />
          )}
        </svg>
        <span className="relative z-10 text-xs font-bold text-center leading-tight px-1">
          {active ? 'ACTIVE' : onCooldown ? `${Math.ceil(cooldown)}s` : cfg.name.split(' ')[0]}
        </span>
      </button>
      <span className="text-[10px] text-white/60 bg-black/40 rounded px-2 py-0.5 font-body whitespace-nowrap">
        {cfg.name}
      </span>
    </div>
  );
}

export default function GameCanvas({ playerName, players = [], roomId, playerId, playerTeam = 'defender', playerRole = 'wbc' }) {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef(null);
  const isLeavingRef = useRef(false);
  const lastTimeRef = useRef(0);
  const lastSyncRef = useRef(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState(null);
  const [abilityState, setAbilityState] = useState({ cooldown: 0, active: false, duration: 0 });

  useEffect(() => {
    initGameImages({
      wbc: imgWhiteBloodCell,
      rbc: imgRedBloodCell,
      bacteria: imgSingleBacteria,
      virus: imgVirus,
      cancer: imgCancerCell,
    });
  }, []);

  const markPlayerLeft = useCallback(async () => {
    if (!playerId || isLeavingRef.current) {
      return;
    }

    isLeavingRef.current = true;
    await leaveRoomPlayer(playerId);
  }, [playerId]);

  // Initialize game state
  useEffect(() => {
    const existingPlayerSlots = roomId ? Array.from({ length: 3 }) : players;
    gameStateRef.current = createGameState(playerName, existingPlayerSlots, playerTeam, playerRole);
    if (playerId) {
      gameStateRef.current.player.id = playerId;
    }
    setGameState(gameStateRef.current);
  }, [playerName, playerId, roomId]);

  useEffect(() => {
    if (!roomId || !playerId) return undefined;

    const handlePageHide = () => {
      markPlayerLeft().catch((error) => {
        console.error('Failed to leave game during page close', error);
      });
    };

    window.addEventListener('pagehide', handlePageHide);

    const unsubscribe = subscribeToRoomPlayers(roomId, (roomPlayers) => {
      const state = gameStateRef.current;
      if (!state) return;

      state.otherPlayers = roomPlayers
        .filter((player) => player.id !== playerId && !player.is_eliminated)
        .map(mapRoomPlayerToGamePlayer);

      setLeaderboard(getLeaderboard(state));
      setGameState({ ...state });
    });

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      unsubscribe();
    };
  }, [roomId, playerId, markPlayerLeft]);

  useEffect(() => {
    if (!roomId || !playerId) return undefined;

    return () => {
      markPlayerLeft().catch((error) => {
        console.error('Failed to leave game during unmount', error);
      });
    };
  }, [roomId, playerId, markPlayerLeft]);

  // Handle mouse/touch movement
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseRef.current.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  }, []);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas || !touch) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    mouseRef.current.y = (touch.clientY - rect.top) * (canvas.height / rect.height);
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let leaderboardTimer = 0;

    const gameLoop = (timestamp) => {
      const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = timestamp;

      if (gameStateRef.current) {
        updateGameState(
          gameStateRef.current,
          mouseRef.current.x,
          mouseRef.current.y,
          canvas.width,
          canvas.height,
          dt
        );
        renderGame(ctx, gameStateRef.current, canvas.width, canvas.height);

        if (!isLeavingRef.current && roomId && playerId && timestamp - lastSyncRef.current > 250) {
          lastSyncRef.current = timestamp;
          const { player } = gameStateRef.current;
          updateRoomPlayerState(playerId, {
            x: player.x,
            y: player.y,
            score: player.score,
            size: player.radius,
            is_eliminated: !player.alive,
          }).catch((error) => {
            console.error('Failed to sync player state', error);
          });
        }

        // Update React state periodically (not every frame for performance)
        leaderboardTimer += dt;
        if (leaderboardTimer > 0.5) {
          leaderboardTimer = 0;
          setLeaderboard(getLeaderboard(gameStateRef.current));
          setScore(gameStateRef.current.player.score);
          setGameState({ ...gameStateRef.current });
          const { abilityCooldown, abilityActive, abilityDuration } = gameStateRef.current.player;
          setAbilityState({ cooldown: abilityCooldown, active: abilityActive, duration: abilityDuration });
        }
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleAbility = useCallback(() => {
    if (gameStateRef.current) {
      activateAbility(gameStateRef.current);
      const { abilityCooldown, abilityActive, abilityDuration } = gameStateRef.current.player;
      setAbilityState({ cooldown: abilityCooldown, active: abilityActive, duration: abilityDuration });
    }
  }, []);

  const handleLeaveGame = async () => {
    try {
      await markPlayerLeft();
    } catch (error) {
      console.error('Failed to leave game', error);
    } finally {
      localStorage.removeItem('bd_player_id');
      localStorage.removeItem('bd_room_id');
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-none touch-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchMove}
      />
      <ScoreDisplay score={score} playerName={playerName} />
      <Leaderboard entries={leaderboard} />
      {gameState && <Minimap gameState={gameState} />}

      {/* Ability button */}
      <AbilityButton
        role={playerRole}
        cooldown={abilityState.cooldown}
        active={abilityState.active}
        onActivate={handleAbility}
      />

      {/* Back button */}
      <button
        onClick={handleLeaveGame}
        className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-sm text-white/70 hover:text-white rounded-lg px-3 py-2 text-xs font-body transition-colors"
      >
        ← Leave Game
      </button>
    </div>
  );
}
