// ============================================
// Game Room Manager
// ============================================
// Handles game room creation, joining, and state.
// Uses Supabase when configured and falls back to local mock rooms.
// ============================================

import {
  createGameRoom,
  getGameRoom,
  getGameRoomByCode,
  getRoomPlayers,
  joinGameRoom,
  leaveRoomPlayer,
  startGameRoom,
} from '@/api/gameRooms';
import { signInAsGuest } from '@/api/supabaseClient';

function normalizePlayer(player) {
  const name = player.name || player.player_name || 'Player';

  return {
    ...player,
    name,
    player_name: player.player_name || name,
    score: player.score || 0,
  };
}

async function hydrateRoom(room) {
  if (!room) {
    return null;
  }

  const players = await getRoomPlayers(room.id || room.code);
  const normalizedPlayers = players.map(normalizePlayer);

  return {
    ...room,
    players: normalizedPlayers,
    host_name: room.host_name || normalizedPlayers[0]?.name || 'Host',
  };
}

function getCurrentPlayerId(room, userId, playerName) {
  const player = room.players?.find(
    (candidate) =>
      candidate.user_id === userId ||
      candidate.userId === userId ||
      candidate.name === playerName
  );

  return player?.id || userId;
}

export async function createRoom(hostName) {
  const auth = await signInAsGuest(hostName);
  const { user } = auth;
  const room = await createGameRoom({
    hostUserId: user.id,
    hostName,
    preferLocal: auth.isMock,
  });
  const hydratedRoom = await hydrateRoom(room);

  return {
    room: hydratedRoom,
    playerId: getCurrentPlayerId(hydratedRoom, user.id, hostName),
  };
}

export async function joinRoom(code, playerName) {
  const auth = await signInAsGuest(playerName);
  const { user } = auth;
  const room = await joinGameRoom({
    code,
    userId: user.id,
    playerName,
    preferLocal: auth.isMock,
  });
  const hydratedRoom = await hydrateRoom(room);

  return {
    room: hydratedRoom,
    playerId: getCurrentPlayerId(hydratedRoom, user.id, playerName),
  };
}

export async function getRoom(roomId) {
  const room = await getGameRoom(roomId);
  return hydrateRoom(room);
}

export async function getRoomByCode(code) {
  const room = await getGameRoomByCode(code);
  return hydrateRoom(room);
}

export async function startGame(roomId) {
  return startGameRoom(roomId);
}

export async function leaveRoom(playerId) {
  return leaveRoomPlayer(playerId);
}

export async function updateRoomPlayers(roomId, players) {
  const room = await getGameRoom(roomId);

  if (!room) {
    throw new Error('Room not found');
  }

  return hydrateRoom({
    ...room,
    players: players.map(normalizePlayer),
  });
}
