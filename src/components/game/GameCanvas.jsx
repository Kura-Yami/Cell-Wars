import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  createGameState,
  getLeaderboard,
  mapRoomPlayerToGamePlayer,
  renderGame,
  updateGameState,
} from '@/lib/gameEngine';
import { subscribeToRoomPlayers, updateRoomPlayerState } from '@/api/gameRooms';
import Leaderboard from './Leaderboard';
import ScoreDisplay from './ScoreDisplay';
import Minimap from './Minimap';

export default function GameCanvas({ playerName, players = [], roomId, playerId }) {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const lastSyncRef = useRef(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState(null);

  // Initialize game state
  useEffect(() => {
    const existingPlayerSlots = roomId ? Array.from({ length: 3 }) : players;
    gameStateRef.current = createGameState(playerName, existingPlayerSlots);
    if (playerId) {
      gameStateRef.current.player.id = playerId;
    }
    setGameState(gameStateRef.current);
  }, [playerName, playerId, roomId]);

  useEffect(() => {
    if (!roomId || !playerId) return undefined;

    return subscribeToRoomPlayers(roomId, (roomPlayers) => {
      const state = gameStateRef.current;
      if (!state) return;

      state.otherPlayers = roomPlayers
        .filter((player) => player.id !== playerId)
        .map(mapRoomPlayerToGamePlayer);

      setLeaderboard(getLeaderboard(state));
      setGameState({ ...state });
    });
  }, [roomId, playerId]);

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

        if (roomId && playerId && timestamp - lastSyncRef.current > 250) {
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

      {/* Back button */}
      <button
        onClick={() => window.location.href = '/'}
        className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-sm text-white/70 hover:text-white rounded-lg px-3 py-2 text-xs font-body transition-colors"
      >
        ← Leave Game
      </button>
    </div>
  );
}
