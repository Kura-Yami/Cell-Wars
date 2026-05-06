import React, { useRef, useEffect } from 'react';
import { renderMinimap } from '@/lib/gameEngine';

export default function Minimap({ gameState }) {
  const canvasRef = useRef(null);
  const mapSize = 130;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    const ctx = canvas.getContext('2d');
    canvas.width = mapSize;
    canvas.height = mapSize;
    renderMinimap(ctx, gameState, mapSize);
  });

  return (
    <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-white/20 shadow-lg"
        style={{ width: mapSize, height: mapSize }}
      />
    </div>
  );
}