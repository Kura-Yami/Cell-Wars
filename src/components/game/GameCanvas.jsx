import React, { useRef, useEffect, useCallback, useState } from 'react';
import { createGameState, updateGameState, renderGame, getLeaderboard } from '@/lib/gameEngine';
import Leaderboard from './Leaderboard';
import ScoreDisplay from './ScoreDisplay';
import Minimap from './Minimap';

export default function GameCanvas({ playerName, players = [] }) {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState(null);

  // Initialize game state
  useEffect(() => {
    gameStateRef.current = createGameState(playerName, players);
    setGameState(gameStateRef.current);
  }, [playerName]);

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