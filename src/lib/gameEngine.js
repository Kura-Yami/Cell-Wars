// @ts-nocheck
// ============================================
// Body Defense - Game Engine
// ============================================
// This module handles all game state, rendering,
// and physics for the Cell Wars arena.
// ============================================

// Module-level image cache loaded once via initGameImages()
const _imgs = {};

export function initGameImages(srcs) {
  Object.entries(srcs).forEach(([key, src]) => {
    const img = new Image();
    img.onload = () => { _imgs[key] = img; };
    img.src = src;
  });
}

export function setPlayerRoleImage(src) {
  const img = new Image();
  img.onload = () => { _imgs.playerRole = img; };
  img.src = src;
}

export const ABILITY_CONFIG = {
  wbc:      { cooldown: 8,  duration: 3,  name: 'Speed Boost',  color: '#7C4DFF' },
  bacteria: { cooldown: 5,  duration: 0,  name: 'Duplicate',    color: '#66BB6A' },
  virus:    { cooldown: 15, duration: 3,  name: 'Growth Boost', color: '#FFD700' },
  cancer:   { cooldown: 20, duration: 5,  name: 'Shield',       color: '#29B6F6' },
};

const WORLD_SIZE = 4000;
const RED_CELL_COUNT = 300;
const BACTERIA_COUNT = 8;
const VIRUS_COUNT = 6;
const CANCER_COUNT = 3;
const BASE_SPEED = 3.5;
const MIN_PLAYER_RADIUS = 20;
const PLAYER_COLORS = ['#4FC3F7', '#81C784', '#FFB74D', '#CE93D8', '#F06292', '#64B5F6'];

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

export function createGameState(playerName, existingPlayers = [], playerTeam = 'defender', playerRole = 'wbc') {
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
      team: 'defender',
      targetX: Math.random() * WORLD_SIZE,
      targetY: Math.random() * WORLD_SIZE,
      color: PLAYER_COLORS[i],
    });
  }

  return {
    player: {
      id: 'local',
      name: playerName,
      x: WORLD_SIZE / 2,
      y: WORLD_SIZE / 2,
      radius: playerRole === 'wbc' ? 50 : MIN_PLAYER_RADIUS,
      score: 0,
      isAI: false,
      alive: true,
      respawnTimer: 0,
      role: playerRole,
      abilityCooldown: 0,
      abilityActive: false,
      abilityDuration: 0,
      quizPending: false,
      hitCooldown: 0,
    },
    playerTeam,
    otherPlayers: aiPlayers,
    redCells,
    bacteria,
    viruses,
    cancerCells,
    duplicates: [],
    funFactTrigger: null,
    worldSize: WORLD_SIZE,
    camera: { x: 0, y: 0 },
    time: 0,
    gameOver: false,
  };
}

export function activateAbility(state) {
  const { player } = state;
  if (player.abilityCooldown > 0) return;
  const cfg = ABILITY_CONFIG[player.role];
  if (!cfg) return;
  player.abilityCooldown = cfg.cooldown;
  state.funFactTrigger = player.role;
  if (player.role === 'bacteria') {
    // Spawn a CPU clone with the player's name that hunts red cells
    state.duplicates.push({
      name: player.name,
      x: player.x + (Math.random() - 0.5) * 80,
      y: player.y + (Math.random() - 0.5) * 80,
      radius: player.radius * 0.65,
      life: 45,
      angle: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    });
  } else {
    player.abilityActive = true;
    player.abilityDuration = cfg.duration;
  }
}

function getPlayerColor(id, index = 0) {
  const hash = String(id || index)
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return PLAYER_COLORS[hash % PLAYER_COLORS.length];
}

export function mapRoomPlayerToGamePlayer(player, index = 0) {
  const role = player.role || 'wbc';
  return {
    id: player.id,
    userId: player.user_id,
    name: player.player_name || player.name || 'Player',
    x: Number(player.x) || WORLD_SIZE / 2,
    y: Number(player.y) || WORLD_SIZE / 2,
    radius: Number(player.size) || MIN_PLAYER_RADIUS,
    score: Number(player.score) || 0,
    angle: Number(player.angle) || 0,
    role,
    team: player.team || (role === 'wbc' ? 'defender' : 'attacker'),
    isAI: false,
    isRemote: true,
    color: getPlayerColor(player.id, index),
  };
}

// --- Update Logic ---

export function updateGameState(state, mouseX, mouseY, canvasW, canvasH, dt) {
  const { player } = state;
  state.time += dt;

  // --- Ability timers ---
  if (player.abilityCooldown > 0) player.abilityCooldown = Math.max(0, player.abilityCooldown - dt);
  if (player.hitCooldown > 0) player.hitCooldown = Math.max(0, player.hitCooldown - dt);
  if (player.abilityActive) {
    player.abilityDuration -= dt;
    if (player.abilityDuration <= 0) {
      player.abilityActive = false;
      player.abilityDuration = 0;
    }
  }

  // --- Player movement ---
  if (player.alive) {
    const worldMouseX = mouseX + state.camera.x;
    const worldMouseY = mouseY + state.camera.y;
    const dx = worldMouseX - player.x;
    const dy = worldMouseY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const speedMult = (player.abilityActive && player.role === 'wbc') ? 1.6 : 1;
      const speed = BASE_SPEED * (MIN_PLAYER_RADIUS / Math.max(player.radius, MIN_PLAYER_RADIUS)) * 1.2 * speedMult;
      player.x += (dx / dist) * speed;
      player.y += (dy / dist) * speed;
      player.angle = Math.atan2(dy, dx);
    }

    player.x = Math.max(player.radius, Math.min(WORLD_SIZE - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(WORLD_SIZE - player.radius, player.y));
  } else {
    player.respawnTimer -= dt;
    if (player.respawnTimer <= 0 && !player.quizPending) {
      const savedScore = player.score;
      const savedRadius = player.preDeathRadius || (player.role === 'wbc' ? 50 : MIN_PLAYER_RADIUS);
      player.alive = true;
      player.x = Math.random() * WORLD_SIZE;
      player.y = Math.random() * WORLD_SIZE;
      player.score = savedScore;
      player.radius = savedRadius;
      player.preDeathRadius = null;
      player.maxRadius = savedRadius;
    }
  }

  // --- Camera ---
  state.camera.x = player.x - canvasW / 2;
  state.camera.y = player.y - canvasH / 2;

  // --- Red cell collision (player eats) — WBC cannot eat red cells ---
  if (player.alive && player.role !== 'wbc' && state.playerTeam !== 'defender') {
    for (let i = state.redCells.length - 1; i >= 0; i--) {
      const rc = state.redCells[i];
      const d = Math.hypot(player.x - rc.x, player.y - rc.y);
      if (d < player.radius + rc.radius * 0.5) {
        player.score += 10;
        const growAmt = ((player.abilityActive && player.role === 'virus') ? 0.6 : 0.3) * 1.8;
        player.radius = Math.min(player.radius + growAmt, 120);
        player.maxRadius = Math.max(player.maxRadius || 0, player.radius);
        state.redCells[i] = createRedCell();
        state.funFactTrigger = player.role;
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
          // Player eats the enemy — WBC gets 1.8× bonus growth for hunting attackers
          player.score += scoreReward;
          const growMult = player.role === 'wbc' ? 1.8 : 1;
          player.radius = Math.min(player.radius + enemy.radius * 0.15 * growMult, 120);
          player.maxRadius = Math.max(player.maxRadius || 0, player.radius);
          state.funFactTrigger = player.role;
          // Respawn enemy
          enemy.x = Math.random() * WORLD_SIZE;
          enemy.y = Math.random() * WORLD_SIZE;
        } else if (!(player.abilityActive && player.role === 'cancer')) {
          // Player takes damage (cancer shield blocks this)
          player.radius -= enemy.radius * 0.1 * damageMultiplier;
          if (player.radius < MIN_PLAYER_RADIUS * 0.5) {
            player.alive = false;
            player.quizPending = true;
            player.preDeathRadius = player.maxRadius || (player.role === 'wbc' ? 50 : MIN_PLAYER_RADIUS);
            player.respawnTimer = 60;
            player.radius = MIN_PLAYER_RADIUS;
          }
        }
      }
    };

    // NPC collisions (radius-based, unchanged)
    if (state.playerTeam === 'defender') {
      state.bacteria.forEach(b => checkEnemyCollision(b, 0.5, 50));
      state.viruses.forEach(v => checkEnemyCollision(v, 0.8, 30));
      state.cancerCells.forEach(c => checkEnemyCollision(c, 1.0, 100));
    }

    // Player vs player: cross-team, score-based eating
    state.otherPlayers.forEach(other => {
      // Determine teams — wbc role = defender, everything else = attacker
      const otherIsDefender = other.team === 'defender' || other.role === 'wbc';
      const localIsDefender = state.playerTeam === 'defender';
      if (otherIsDefender === localIsDefender) return; // same team, immune

      // Tick this player's eat cooldown
      if (other.eatCooldown > 0) { other.eatCooldown = Math.max(0, other.eatCooldown - dt); return; }

      const d = Math.hypot(player.x - other.x, player.y - other.y);
      if (d >= player.radius + other.radius * 0.7) return;

      if (player.score > other.score) {
        // Local player eats the other — gain 25% of their score and size
        const scoreGain = Math.floor(other.score * 0.25);
        const radiusGain = other.radius * 0.25;
        player.score += scoreGain;
        player.radius = Math.min(player.radius + radiusGain, 120);
        player.maxRadius = Math.max(player.maxRadius || 0, player.radius);
        state.funFactTrigger = player.role;
        other.eatCooldown = 2;
        if (other.isAI) {
          other.score = Math.max(0, other.score - scoreGain);
          other.radius = Math.max(MIN_PLAYER_RADIUS, other.radius - radiusGain);
          other.x = Math.random() * WORLD_SIZE;
          other.y = Math.random() * WORLD_SIZE;
        }
      } else if (other.score > player.score && player.hitCooldown <= 0 && !(player.abilityActive && player.role === 'cancer')) {
        // Other player eats local — lose 25% score and size
        const scoreLoss = Math.floor(player.score * 0.25);
        const radiusLoss = player.radius * 0.25;
        player.score = Math.max(0, player.score - scoreLoss);
        player.radius -= radiusLoss;
        player.hitCooldown = 1.5;
        if (player.radius < MIN_PLAYER_RADIUS * 0.5) {
          player.alive = false;
          player.quizPending = true;
          player.preDeathRadius = player.maxRadius || (player.role === 'wbc' ? 50 : MIN_PLAYER_RADIUS);
          player.respawnTimer = 60;
          player.radius = MIN_PLAYER_RADIUS;
        }
      }
    });
  }

  // --- Duplicate clones (bacteria ability) ---
  state.duplicates = state.duplicates.filter(d => d.life > 0);
  state.duplicates.forEach(d => {
    d.life -= dt;
    // Seek nearest red cell like a CPU player
    let closest = null, closestDist = 500;
    state.redCells.forEach(rc => {
      const dist = Math.hypot(rc.x - d.x, rc.y - d.y);
      if (dist < closestDist) { closest = rc; closestDist = dist; }
    });
    if (closest) {
      const ddx = closest.x - d.x;
      const ddy = closest.y - d.y;
      const ddist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (ddist > 3) {
        d.vx = (ddx / ddist) * 1.8;
        d.vy = (ddy / ddist) * 1.8;
      }
    } else if (Math.random() < 0.03) {
      d.vx = (Math.random() - 0.5) * 2;
      d.vy = (Math.random() - 0.5) * 2;
    }
    d.x += d.vx;
    d.y += d.vy;
    d.x = Math.max(d.radius, Math.min(WORLD_SIZE - d.radius, d.x));
    d.y = Math.max(d.radius, Math.min(WORLD_SIZE - d.radius, d.y));
    d.angle = Math.atan2(d.vy, d.vx);
    for (let i = state.redCells.length - 1; i >= 0; i--) {
      const rc = state.redCells[i];
      if (Math.hypot(d.x - rc.x, d.y - rc.y) < d.radius + rc.radius * 0.5) {
        player.score += 5;
        state.redCells[i] = createRedCell();
      }
    }
  });

  return state;
}

// --- Rendering ---

export function renderGame(ctx, state, canvasW, canvasH) {
  const { camera, time } = state;

  // Clear
  ctx.fillStyle = '#090002';
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

  // Bacteria duplicates — rendered as CPU copies of the player with their name
  state.duplicates.forEach(d => {
    const sx = d.x - camera.x;
    const sy = d.y - camera.y;
    if (sx < -60 || sx > canvasW + 60 || sy < -60 || sy > canvasH + 60) return;
    const alpha = d.life < 3 ? d.life / 3 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Use the player's role image, rotated to face movement direction
    const img = _imgs.playerRole || _imgs.bacteria;
    ctx.translate(sx, sy);
    ctx.rotate(d.angle + Math.PI / 2);
    if (img) {
      drawImgProp(ctx, img, 0, 0, d.radius * 2.2);
    }
    ctx.restore();
    // Name tag drawn separately (no transform)
    if (d.name) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const fontSize = Math.max(10, Math.min(14, d.radius * 0.5));
      ctx.font = `bold ${fontSize}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff8f0';
      ctx.strokeStyle = 'rgba(20,0,0,0.85)';
      ctx.lineWidth = 4;
      ctx.strokeText(d.name, sx, sy - d.radius - 8);
      ctx.fillText(d.name, sx, sy - d.radius - 8);
      ctx.restore();
    }
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

  // Draw other players (AI + remote)
  state.otherPlayers.forEach(p => {
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    if (sx < -100 || sx > canvasW + 100 || sy < -100 || sy > canvasH + 100) return;
    drawPlayerCharacter(ctx, sx, sy, p.radius, p.color || '#4FC3F7', time, p.name, p.role || 'wbc', false, p.angle ?? null);
  });

  // Draw local player
  if (state.player.alive) {
    const px = state.player.x - camera.x;
    const py = state.player.y - camera.y;

    // Ability visual ring
    if (state.player.abilityActive) {
      const cfg = ABILITY_CONFIG[state.player.role];
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, state.player.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = cfg ? cfg.color : '#ffffff';
      ctx.globalAlpha = 0.55 + Math.sin(time * 8) * 0.35;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();
    }

    drawPlayerCharacter(ctx, px, py, state.player.radius, '#ffffff', time, state.player.name, state.player.role, true, state.player.angle ?? null);
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

// Draw an image centered at (cx, cy), scaled so the longest side = maxSize, aspect ratio preserved.
function drawImgProp(ctx, img, cx, cy, maxSize) {
  const aspect = img.naturalWidth / img.naturalHeight;
  const w = aspect >= 1 ? maxSize : maxSize * aspect;
  const h = aspect >= 1 ? maxSize / aspect : maxSize;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

function drawBackground(ctx, camera, w, h, time) {
  const gradient = ctx.createRadialGradient(w * 0.48, h * 0.42, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  gradient.addColorStop(0, '#3a0508');
  gradient.addColorStop(0.45, '#1d0205');
  gradient.addColorStop(1, '#050001');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 34;
  ctx.lineCap = 'round';
  for (let i = -2; i < 6; i++) {
    const y = ((i * 180 + time * 18) % (h + 360)) - 180;
    const xOffset = ((camera.x * 0.035) + i * 61) % 180;
    ctx.beginPath();
    ctx.moveTo(-120, y);
    ctx.bezierCurveTo(w * 0.25 + xOffset, y - 120, w * 0.62 - xOffset, y + 120, w + 120, y - 20);
    ctx.strokeStyle = i % 2 === 0 ? '#5b0b12' : '#7a1019';
    ctx.stroke();
  }
  ctx.restore();

  // Subtle flowing particles
  ctx.save();
  for (let i = 0; i < 40; i++) {
    const seed = i * 137.5;
    const x = ((seed * 7.3 + time * 15) % (w + 200)) - 100;
    const y = ((seed * 13.1 + time * 8) % (h + 200)) - 100;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 86, 86, ${0.12 + (i % 5) * 0.025})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawGrid(ctx, camera, w, h) {
  ctx.strokeStyle = 'rgba(255, 82, 82, 0.045)';
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
  ctx.strokeStyle = 'rgba(255, 75, 75, 0.28)';
  ctx.lineWidth = 4;
  ctx.strokeRect(-camera.x, -camera.y, WORLD_SIZE, WORLD_SIZE);
}

function drawRedCell(ctx, x, y, r, opacity, time) {
  ctx.save();
  ctx.globalAlpha = opacity;
  if (_imgs.rbc) {
    drawImgProp(ctx, _imgs.rbc, x, y, r * 2.8);
    ctx.restore();
    return;
  }
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
  if (_imgs.bacteria) {
    // image is tall/thin — rotate extra 90° so it aligns with movement direction
    ctx.rotate(Math.PI / 2);
    drawImgProp(ctx, _imgs.bacteria, 0, 0, r * 2.2);
    ctx.restore();
    return;
  }
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
  if (_imgs.virus) {
    drawImgProp(ctx, _imgs.virus, x, y, r * 2.4);
    ctx.restore();
    return;
  }
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
  if (_imgs.cancer) {
    const pulse = 1 + Math.sin(phase) * 0.06;
    drawImgProp(ctx, _imgs.cancer, x, y, r * 2.2 * pulse);
    ctx.restore();
    return;
  }
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

function drawPlayerCharacter(ctx, x, y, r, color, time, name, role = 'wbc', isLocal = false, angle = null) {
  ctx.save();
  const roleImgMap = { wbc: _imgs.wbc, bacteria: _imgs.bacteria, virus: _imgs.virus, cancer: _imgs.cancer };
  const playerImg = isLocal ? (_imgs.playerRole || roleImgMap[role] || _imgs.wbc) : (roleImgMap[role] || _imgs.wbc);
  if (playerImg) {
    // Draw rotated sprite
    ctx.save();
    if (isLocal) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 28;
    }
    ctx.translate(x, y);
    if (angle !== null) ctx.rotate(angle + Math.PI / 2);
    drawImgProp(ctx, playerImg, 0, 0, r * 2);
    ctx.restore();
    // Name tag drawn without rotation
    if (name) {
      ctx.font = `bold ${Math.max(10, Math.min(14, r * 0.5))}px Fredoka, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff8f0';
      ctx.strokeStyle = isLocal ? 'rgba(30,0,0,0.95)' : 'rgba(20,0,0,0.85)';
      ctx.lineWidth = 4;
      ctx.strokeText(name, x, y - r - 8);
      ctx.fillText(name, x, y - r - 8);
    }
    ctx.restore();
    return;
  }
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
    ctx.fillStyle = '#fff8f0';
    ctx.strokeStyle = isLocal ? 'rgba(30,0,0,0.95)' : 'rgba(20,0,0,0.85)';
    ctx.lineWidth = 4;
    ctx.strokeText(name, x, y - r - 8);
    ctx.fillText(name, x, y - r - 8);
  }
  ctx.restore();
}

// --- Minimap ---

export function renderMinimap(ctx, state, mapSize) {
  const scale = mapSize / WORLD_SIZE;
  ctx.fillStyle = 'rgba(18, 0, 3, 0.9)';
  ctx.fillRect(0, 0, mapSize, mapSize);
  ctx.strokeStyle = 'rgba(255,120,120,0.24)';
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
  return all.sort((a, b) => b.score - a.score);
}
