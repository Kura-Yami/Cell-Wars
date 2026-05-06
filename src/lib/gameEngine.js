// ============================================
// Body Defense - Game Engine
// ============================================
// This module handles all game state, rendering,
// and physics for the Cell Wars arena.
// ============================================

const WORLD_SIZE = 4000;
const RED_CELL_COUNT = 300;
const BACTERIA_COUNT = 8;
const VIRUS_COUNT = 6;
const CANCER_COUNT = 3;
const BASE_SPEED = 3.5;
const MIN_PLAYER_RADIUS = 20;

// --- Entity Factories ---

function createRedCell() {
  return {
    x: Math.random() * WORLD_SIZE,
    y: Math.random() * WORLD_SIZE,
    radius: 6 + Math.random() * 4,
    type: 'redcell',
    opacity: 0.7 + Math.random() * 0.3,
    wobble: Math.random() * Math.PI * 2,
  };
}

function createBacterium() {
  return {
    x: Math.random() * WORLD_SIZE,
    y: Math.random() * WORLD_SIZE,
    radius: 25 + Math.random() * 15,
    type: 'bacteria',
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    angle: Math.random() * Math.PI * 2,
    chaseRange: 200,
    speed: 1.5 + Math.random() * 0.5,
  };
}

function createVirus() {
  return {
    x: Math.random() * WORLD_SIZE,
    y: Math.random() * WORLD_SIZE,
    radius: 12 + Math.random() * 6,
    type: 'virus',
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    angle: Math.random() * Math.PI * 2,
    speed: 3 + Math.random(),
    dirChangeTimer: 0,
  };
}

function createCancerCell() {
  return {
    x: Math.random() * WORLD_SIZE,
    y: Math.random() * WORLD_SIZE,
    radius: 45 + Math.random() * 20,
    type: 'cancer',
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    speed: 0.4,
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

// --- Game State ---

export function createGameState(playerName, existingPlayers = []) {
  const redCells = Array.from({ length: RED_CELL_COUNT }, createRedCell);
  const bacteria = Array.from({ length: BACTERIA_COUNT }, createBacterium);
  const viruses = Array.from({ length: VIRUS_COUNT }, createVirus);
  const cancerCells = Array.from({ length: CANCER_COUNT }, createCancerCell);

  // Create AI mock players if less than 3 total
  // MULTIPLAYER TODO: In real multiplayer, other players would join via real-time sync
  const aiPlayers = [];
  const aiNames = ['Neutrophil-X', 'T-Cell Alpha', 'Macrophage-9', 'B-Cell Pro'];
  const totalOthers = existingPlayers.length;
  const aiCount = Math.max(0, 3 - totalOthers);
  for (let i = 0; i < aiCount; i++) {
    aiPlayers.push({
      id: `ai_${i}`,
      name: aiNames[i],
      x: Math.random() * WORLD_SIZE,
      y: Math.random() * WORLD_SIZE,
      radius: MIN_PLAYER_RADIUS + Math.random() * 15,
      score: 0,
      isAI: true,
      targetX: Math.random() * WORLD_SIZE,
      targetY: Math.random() * WORLD_SIZE,
      color: ['#4FC3F7', '#81C784', '#FFB74D', '#CE93D8'][i],
    });
  }

  return {
    player: {
      id: 'local',
      name: playerName,
      x: WORLD_SIZE / 2,
      y: WORLD_SIZE / 2,
      radius: MIN_PLAYER_RADIUS,
      score: 0,
      isAI: false,
      alive: true,
      respawnTimer: 0,
    },
    otherPlayers: aiPlayers,
    redCells,
    bacteria,
    viruses,
    cancerCells,
    worldSize: WORLD_SIZE,
    camera: { x: 0, y: 0 },
    time: 0,
    gameOver: false,
  };
}

// --- Update Logic ---

export function updateGameState(state, mouseX, mouseY, canvasW, canvasH, dt) {
  const { player } = state;
  state.time += dt;

  // --- Player movement ---
  if (player.alive) {
    const worldMouseX = mouseX + state.camera.x;
    const worldMouseY = mouseY + state.camera.y;
    const dx = worldMouseX - player.x;
    const dy = worldMouseY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const speed = BASE_SPEED * (MIN_PLAYER_RADIUS / Math.max(player.radius, MIN_PLAYER_RADIUS)) * 1.2;
      player.x += (dx / dist) * speed;
      player.y += (dy / dist) * speed;
    }

    player.x = Math.max(player.radius, Math.min(WORLD_SIZE - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(WORLD_SIZE - player.radius, player.y));
  } else {
    player.respawnTimer -= dt;
    if (player.respawnTimer <= 0) {
      player.alive = true;
      player.x = Math.random() * WORLD_SIZE;
      player.y = Math.random() * WORLD_SIZE;
      player.radius = MIN_PLAYER_RADIUS;
    }
  }

  // --- Camera ---
  state.camera.x = player.x - canvasW / 2;
  state.camera.y = player.y - canvasH / 2;

  // --- Red cell collision (player eats) ---
  if (player.alive) {
    for (let i = state.redCells.length - 1; i >= 0; i--) {
      const rc = state.redCells[i];
      const d = Math.hypot(player.x - rc.x, player.y - rc.y);
      if (d < player.radius + rc.radius * 0.5) {
        player.score += 10;
        player.radius = Math.min(player.radius + 0.3, 120);
        state.redCells[i] = createRedCell();
      }
    }
  }

  // --- AI Players ---
  state.otherPlayers.forEach(ai => {
    if (!ai.isAI) return;

    // Retarget every now and then
    const toTarget = Math.hypot(ai.targetX - ai.x, ai.targetY - ai.y);
    if (toTarget < 50 || Math.random() < 0.005) {
      // Aim for nearby red cells
      let closest = null;
      let closestDist = 400;
      state.redCells.forEach(rc => {
        const d = Math.hypot(rc.x - ai.x, rc.y - ai.y);
        if (d < closestDist) { closest = rc; closestDist = d; }
      });
      if (closest) {
        ai.targetX = closest.x;
        ai.targetY = closest.y;
      } else {
        ai.targetX = Math.random() * WORLD_SIZE;
        ai.targetY = Math.random() * WORLD_SIZE;
      }
    }

    const dx = ai.targetX - ai.x;
    const dy = ai.targetY - ai.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 3) {
      const speed = BASE_SPEED * (MIN_PLAYER_RADIUS / Math.max(ai.radius, MIN_PLAYER_RADIUS)) * 0.9;
      ai.x += (dx / dist) * speed;
      ai.y += (dy / dist) * speed;
    }
    ai.x = Math.max(ai.radius, Math.min(WORLD_SIZE - ai.radius, ai.x));
    ai.y = Math.max(ai.radius, Math.min(WORLD_SIZE - ai.radius, ai.y));

    // AI eats red cells
    for (let i = state.redCells.length - 1; i >= 0; i--) {
      const rc = state.redCells[i];
      const d = Math.hypot(ai.x - rc.x, ai.y - rc.y);
      if (d < ai.radius + rc.radius * 0.5) {
        ai.score += 10;
        ai.radius = Math.min(ai.radius + 0.3, 100);
        state.redCells[i] = createRedCell();
      }
    }
  });

  // --- Enemy movement ---
  // Bacteria
  state.bacteria.forEach(b => {
    let chasing = false;
    if (player.alive) {
      const d = Math.hypot(player.x - b.x, player.y - b.y);
      if (d < b.chaseRange && player.radius < b.radius * 1.5) {
        const dx = player.x - b.x;
        const dy = player.y - b.y;
        b.vx = (dx / d) * b.speed;
        b.vy = (dy / d) * b.speed;
        chasing = true;
      }
    }
    if (!chasing) {
      if (Math.random() < 0.02) {
        b.vx = (Math.random() - 0.5) * b.speed * 2;
        b.vy = (Math.random() - 0.5) * b.speed * 2;
      }
    }
    b.x += b.vx;
    b.y += b.vy;
    b.x = Math.max(b.radius, Math.min(WORLD_SIZE - b.radius, b.x));
    b.y = Math.max(b.radius, Math.min(WORLD_SIZE - b.radius, b.y));
    b.angle = Math.atan2(b.vy, b.vx);
  });

  // Viruses
  state.viruses.forEach(v => {
    v.dirChangeTimer -= dt;
    if (v.dirChangeTimer <= 0) {
      v.vx = (Math.random() - 0.5) * v.speed * 2;
      v.vy = (Math.random() - 0.5) * v.speed * 2;
      v.dirChangeTimer = 0.5 + Math.random() * 2;
    }
    v.x += v.vx;
    v.y += v.vy;
    v.x = Math.max(v.radius, Math.min(WORLD_SIZE - v.radius, v.x));
    v.y = Math.max(v.radius, Math.min(WORLD_SIZE - v.radius, v.y));
  });

  // Cancer cells
  state.cancerCells.forEach(c => {
    if (Math.random() < 0.01) {
      c.vx = (Math.random() - 0.5) * c.speed;
      c.vy = (Math.random() - 0.5) * c.speed;
    }
    c.x += c.vx;
    c.y += c.vy;
    c.x = Math.max(c.radius, Math.min(WORLD_SIZE - c.radius, c.x));
    c.y = Math.max(c.radius, Math.min(WORLD_SIZE - c.radius, c.y));
    c.pulsePhase += dt * 2;
  });

  // --- Player-Enemy collisions ---
  if (player.alive) {
    // If player is big enough, they eat the enemy. Otherwise they take damage.
    const checkEnemyCollision = (enemy, damageMultiplier, scoreReward) => {
      const d = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (d < player.radius + enemy.radius * 0.7) {
        if (player.radius > enemy.radius * 1.3) {
          // Player eats the enemy
          player.score += scoreReward;
          player.radius = Math.min(player.radius + enemy.radius * 0.15, 120);
          // Respawn enemy
          enemy.x = Math.random() * WORLD_SIZE;
          enemy.y = Math.random() * WORLD_SIZE;
        } else {
          // Player takes damage
          player.radius -= enemy.radius * 0.1 * damageMultiplier;
          if (player.radius < MIN_PLAYER_RADIUS * 0.5) {
            player.alive = false;
            player.respawnTimer = 3;
            player.radius = MIN_PLAYER_RADIUS;
          }
        }
      }
    };

    state.bacteria.forEach(b => checkEnemyCollision(b, 0.5, 50));
    state.viruses.forEach(v => checkEnemyCollision(v, 0.8, 30));
    state.cancerCells.forEach(c => checkEnemyCollision(c, 1.0, 100));
  }

  return state;
}

// --- Rendering ---

export function renderGame(ctx, state, canvasW, canvasH) {
  const { camera, time } = state;

  // Clear
  ctx.fillStyle = '#fce4ec';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Draw bloodstream background
  drawBackground(ctx, camera, canvasW, canvasH, time);

  // Draw grid
  drawGrid(ctx, camera, canvasW, canvasH);

  // Draw world boundary
  drawBoundary(ctx, camera, canvasW, canvasH);

  // Draw red cells
  state.redCells.forEach(rc => {
    const sx = rc.x - camera.x;
    const sy = rc.y - camera.y;
    if (sx < -30 || sx > canvasW + 30 || sy < -30 || sy > canvasH + 30) return;
    drawRedCell(ctx, sx, sy, rc.radius, rc.opacity, time + rc.wobble);
  });

  // Draw enemies
  state.bacteria.forEach(b => {
    const sx = b.x - camera.x;
    const sy = b.y - camera.y;
    if (sx < -60 || sx > canvasW + 60 || sy < -60 || sy > canvasH + 60) return;
    drawBacterium(ctx, sx, sy, b.radius, b.angle, time);
  });

  state.viruses.forEach(v => {
    const sx = v.x - camera.x;
    const sy = v.y - camera.y;
    if (sx < -30 || sx > canvasW + 30 || sy < -30 || sy > canvasH + 30) return;
    drawVirus(ctx, sx, sy, v.radius, time);
  });

  state.cancerCells.forEach(c => {
    const sx = c.x - camera.x;
    const sy = c.y - camera.y;
    if (sx < -80 || sx > canvasW + 80 || sy < -80 || sy > canvasH + 80) return;
    drawCancerCell(ctx, sx, sy, c.radius, c.pulsePhase);
  });

  // Draw other players (AI)
  state.otherPlayers.forEach(p => {
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    if (sx < -100 || sx > canvasW + 100 || sy < -100 || sy > canvasH + 100) return;
    drawWhiteBloodCell(ctx, sx, sy, p.radius, p.color || '#4FC3F7', time, p.name);
  });

  // Draw local player
  if (state.player.alive) {
    const px = state.player.x - camera.x;
    const py = state.player.y - camera.y;
    drawWhiteBloodCell(ctx, px, py, state.player.radius, '#ffffff', time, state.player.name, true);
  }

  // Death overlay
  if (!state.player.alive) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Eliminated!', canvasW / 2, canvasH / 2 - 20);
    ctx.font = '20px Space Grotesk, sans-serif';
    ctx.fillText(`Respawning in ${Math.ceil(state.player.respawnTimer)}s...`, canvasW / 2, canvasH / 2 + 20);
  }
}

// --- Draw Helpers ---

function drawBackground(ctx, camera, w, h, time) {
  // Subtle flowing particles
  ctx.save();
  for (let i = 0; i < 40; i++) {
    const seed = i * 137.5;
    const x = ((seed * 7.3 + time * 15) % (w + 200)) - 100;
    const y = ((seed * 13.1 + time * 8) % (h + 200)) - 100;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(239, 154, 154, ${0.15 + (i % 5) * 0.03})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawGrid(ctx, camera, w, h) {
  ctx.strokeStyle = 'rgba(200, 150, 150, 0.08)';
  ctx.lineWidth = 1;
  const gridSize = 80;
  const startX = -(camera.x % gridSize);
  const startY = -(camera.y % gridSize);
  for (let x = startX; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = startY; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawBoundary(ctx, camera, w, h) {
  ctx.strokeStyle = 'rgba(180, 60, 60, 0.3)';
  ctx.lineWidth = 4;
  ctx.strokeRect(-camera.x, -camera.y, WORLD_SIZE, WORLD_SIZE);
}

function drawRedCell(ctx, x, y, r, opacity, time) {
  ctx.save();
  ctx.globalAlpha = opacity;
  // Biconcave disc shape
  const squish = 0.7 + Math.sin(time * 1.5) * 0.05;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * squish, 0, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
  grad.addColorStop(0, '#ef5350');
  grad.addColorStop(0.6, '#c62828');
  grad.addColorStop(1, '#8e0000');
  ctx.fillStyle = grad;
  ctx.fill();
  // Inner dimple
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.35, r * 0.25 * squish, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fill();
  ctx.restore();
}

function drawBacterium(ctx, x, y, r, angle, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Rod shape
  const w = r * 1.6;
  const h = r * 0.7;
  ctx.beginPath();
  ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(-w * 0.2, -h * 0.2, 0, 0, 0, w);
  grad.addColorStop(0, '#81C784');
  grad.addColorStop(0.7, '#388E3C');
  grad.addColorStop(1, '#1B5E20');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(27, 94, 32, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Flagella
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(56, 142, 60, 0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const startX = -w;
    const startY = (i - 1) * h * 0.4;
    ctx.moveTo(startX, startY);
    for (let t = 0; t < 20; t++) {
      ctx.lineTo(startX - t * 2, startY + Math.sin(t * 0.5 + time * 5) * 4);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawVirus(ctx, x, y, r, time) {
  ctx.save();
  // Spiky ball
  const spikes = 8;
  const spikeLen = r * 0.6;
  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 + time * 0.5;
    const outerX = x + Math.cos(a) * (r + spikeLen);
    const outerY = y + Math.sin(a) * (r + spikeLen);
    const midA = a + Math.PI / spikes;
    const innerX = x + Math.cos(midA) * r * 0.8;
    const innerY = y + Math.sin(midA) * r * 0.8;
    if (i === 0) ctx.moveTo(outerX, outerY);
    else ctx.lineTo(outerX, outerY);
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r + spikeLen);
  grad.addColorStop(0, '#CE93D8');
  grad.addColorStop(0.5, '#9C27B0');
  grad.addColorStop(1, '#4A148C');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 20, 140, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Spike tips
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 + time * 0.5;
    const tipX = x + Math.cos(a) * (r + spikeLen);
    const tipY = y + Math.sin(a) * (r + spikeLen);
    ctx.beginPath();
    ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#E1BEE7';
    ctx.fill();
  }
  ctx.restore();
}

function drawCancerCell(ctx, x, y, r, phase) {
  ctx.save();
  const pulse = 1 + Math.sin(phase) * 0.08;
  const pr = r * pulse;
  // Irregular blob
  ctx.beginPath();
  const points = 12;
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const wobble = 0.8 + Math.sin(a * 3 + phase) * 0.2;
    const px = x + Math.cos(a) * pr * wobble;
    const py = y + Math.sin(a) * pr * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(x, y, 0, x, y, pr);
  grad.addColorStop(0, '#616161');
  grad.addColorStop(0.5, '#37474F');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Inner dark spots
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + phase * 0.3;
    const d = pr * 0.4;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, pr * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
  }
  ctx.restore();
}

function drawWhiteBloodCell(ctx, x, y, r, color, time, name, isLocal = false) {
  ctx.save();
  // Soft organic blob
  const wobbleAmount = isLocal ? 0.06 : 0.04;
  ctx.beginPath();
  const segments = 24;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const wobble = 1 + Math.sin(a * 3 + time * 2) * wobbleAmount + Math.cos(a * 5 + time * 1.5) * wobbleAmount * 0.5;
    const px = x + Math.cos(a) * r * wobble;
    const py = y + Math.sin(a) * r * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Glow
  if (isLocal) {
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 20;
  }

  const grad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(0.7, isLocal ? 'rgba(220, 220, 240, 0.9)' : color);
  grad.addColorStop(1, isLocal ? 'rgba(180, 180, 210, 0.7)' : 'rgba(100,100,150,0.5)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = isLocal ? 'rgba(255,255,255,0.6)' : 'rgba(200,200,255,0.3)';
  ctx.lineWidth = isLocal ? 2.5 : 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Nucleus
  ctx.beginPath();
  ctx.ellipse(x + r * 0.1, y, r * 0.3, r * 0.25, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = isLocal ? 'rgba(120, 100, 180, 0.3)' : 'rgba(100, 100, 150, 0.25)';
  ctx.fill();

  // Name tag
  if (name) {
    ctx.font = `bold ${Math.max(10, Math.min(14, r * 0.5))}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isLocal ? '#1a1a2e' : '#333';
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(name, x, y - r - 8);
    ctx.fillText(name, x, y - r - 8);
  }
  ctx.restore();
}

// --- Minimap ---

export function renderMinimap(ctx, state, mapSize) {
  const scale = mapSize / WORLD_SIZE;
  ctx.fillStyle = 'rgba(30, 20, 40, 0.85)';
  ctx.fillRect(0, 0, mapSize, mapSize);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, mapSize, mapSize);

  // Red cells as dots
  ctx.fillStyle = 'rgba(239, 83, 80, 0.4)';
  state.redCells.forEach(rc => {
    ctx.fillRect(rc.x * scale, rc.y * scale, 1.5, 1.5);
  });

  // Enemies
  state.bacteria.forEach(b => {
    ctx.fillStyle = '#66BB6A';
    ctx.fillRect(b.x * scale - 1.5, b.y * scale - 1.5, 3, 3);
  });
  state.cancerCells.forEach(c => {
    ctx.fillStyle = '#546E7A';
    ctx.fillRect(c.x * scale - 2, c.y * scale - 2, 4, 4);
  });

  // Other players
  state.otherPlayers.forEach(p => {
    ctx.fillStyle = p.color || '#4FC3F7';
    ctx.beginPath();
    ctx.arc(p.x * scale, p.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Local player
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(state.player.x * scale, state.player.y * scale, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// --- Leaderboard ---

export function getLeaderboard(state) {
  const all = [
    { name: state.player.name, score: state.player.score, isLocal: true },
    ...state.otherPlayers.map(p => ({ name: p.name, score: p.score, isLocal: false })),
  ];
  return all.sort((a, b) => b.score - a.score).slice(0, 5);
}