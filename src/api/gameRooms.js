import { supabase } from './supabaseClient'
import { createId } from '@/lib/randomId'

const MOCK_ROOMS_KEY = 'cell-wars:mock-rooms'
const REQUEST_TIMEOUT_MS = 8000
let supportsExtendedPlayerState = true
const roomPlayerChannels = new Map()

export function createGameCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''

  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return code
}

function readMockRooms() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_ROOMS_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeMockRooms(rooms) {
  localStorage.setItem(MOCK_ROOMS_KEY, JSON.stringify(rooms))
}

function withTimeout(request, message) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
  })

  return Promise.race([request, timeout]).finally(() => clearTimeout(timeoutId))
}

function findMockRoom(roomIdOrCode) {
  const rooms = readMockRooms()
  return (
    rooms[roomIdOrCode] ||
    rooms[roomIdOrCode?.toUpperCase?.()] ||
    Object.values(rooms).find((candidate) => candidate.id === roomIdOrCode) ||
    null
  )
}

function createMockGameRoom({ hostUserId, hostName }) {
  const code = createGameCode()
  const rooms = readMockRooms()

  rooms[code] = {
    id: createId(),
    code,
    is_local: true,
    status: 'lobby',
    host_user_id: hostUserId,
    players: [
      {
        id: createId(),
        user_id: hostUserId,
        player_name: hostName || 'Host',
        score: 0,
        size: 24,
        is_eliminated: false,
      },
    ],
  }

  writeMockRooms(rooms)
  return rooms[code]
}

function joinMockGameRoom({ code, userId, playerName }) {
  const normalizedCode = code.trim().toUpperCase()
  const rooms = readMockRooms()
  const room = rooms[normalizedCode]

  if (!room) {
    throw new Error('Game room not found.')
  }

  if (room.status !== 'lobby') {
    throw new Error('Game already started')
  }

  room.players.push({
    id: createId(),
    user_id: userId,
    player_name: playerName,
    score: 0,
    size: 24,
    is_eliminated: false,
  })

  writeMockRooms(rooms)
  return room
}

function getSupabaseRoomErrorMessage(error, action) {
  const message = error?.message || `Supabase ${action} failed`

  if (message.includes('Could not find the table') || message.includes('schema cache')) {
    return 'Supabase room tables are not ready. Run supabase/schema.sql in your Supabase SQL editor, then try again.'
  }

  if (message.includes('row-level security') || error?.code === '42501') {
    return 'Supabase room permissions blocked this request. Check the RLS policies in supabase/schema.sql.'
  }

  return message
}

function isMissingPlayerStateColumn(error) {
  const message = error?.message || ''
  return (
    error?.code === 'PGRST204' ||
    (message.includes('Could not find') && message.includes('room_players') && message.includes('column'))
  )
}

export async function createGameRoom({ hostUserId, hostName, preferLocal = false }) {
  if (preferLocal || !supabase) {
    return createMockGameRoom({ hostUserId, hostName })
  }

  try {
    const code = createGameCode()
    const { data: room, error: roomError } = await withTimeout(
      supabase
        .from('game_rooms')
        .insert({
          code,
          host_user_id: hostUserId,
          status: 'lobby',
        })
        .select()
        .single(),
      'Supabase room creation timed out'
    )

    if (roomError) {
      throw roomError
    }

    if (hostName) {
      const { error: playerError } = await withTimeout(
        supabase.from('room_players').insert({
          room_id: room.id,
          user_id: hostUserId,
          player_name: hostName,
        }),
        'Supabase player creation timed out'
      )

      if (playerError) {
        throw playerError
      }
    }

    return room
  } catch (error) {
    throw new Error(getSupabaseRoomErrorMessage(error, 'room creation'))
  }
}

export async function getGameRoom(roomId) {
  const localRoom = findMockRoom(roomId)

  if (localRoom) {
    return localRoom
  }

  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle(),
      'Supabase room lookup timed out'
    )

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.warn('Supabase room lookup failed. Checking local rooms instead.', error)
    return findMockRoom(roomId)
  }
}

export async function getGameRoomByCode(code) {
  const normalizedCode = code.trim().toUpperCase()
  const localRoom = findMockRoom(normalizedCode)

  if (localRoom) {
    return localRoom
  }

  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('game_rooms')
        .select('*')
        .eq('code', normalizedCode)
        .maybeSingle(),
      'Supabase room lookup timed out'
    )

    if (error) {
      throw error
    }

    return data || findMockRoom(normalizedCode)
  } catch (error) {
    console.warn('Supabase room lookup failed. Checking local rooms instead.', error)
    return findMockRoom(normalizedCode)
  }
}

export async function joinGameRoom({ code, userId, playerName, preferLocal = false }) {
  const normalizedCode = code.trim().toUpperCase()

  if (preferLocal || !supabase) {
    return joinMockGameRoom({ code: normalizedCode, userId, playerName })
  }

  try {
    const { data: room, error: roomError } = await withTimeout(
      supabase
        .from('game_rooms')
        .select('*')
        .eq('code', normalizedCode)
        .maybeSingle(),
      'Supabase join lookup timed out'
    )

    if (roomError) {
      throw roomError
    }

    if (!room) {
      throw new Error(`No shared game room found for code ${normalizedCode}. Ask the host to create a new room after Supabase is configured.`)
    }

    if (room.status !== 'lobby') {
      throw new Error('Game already started')
    }

    const { error: playerError } = await withTimeout(
      supabase.from('room_players').insert({
        room_id: room.id,
        user_id: userId,
        player_name: playerName,
      }),
      'Supabase join timed out'
    )

    if (playerError) {
      throw playerError
    }

    return room
  } catch (error) {
    throw new Error(getSupabaseRoomErrorMessage(error, 'join'))
  }
}

export async function getRoomPlayers(roomIdOrCode) {
  const localRoom = findMockRoom(roomIdOrCode)

  if (localRoom) {
    return (localRoom.players || []).filter((player) => !player.is_eliminated)
  }

  if (!supabase) {
    return []
  }

  const { data, error } = await withTimeout(
    supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomIdOrCode)
      .eq('is_eliminated', false)
      .order('joined_at', { ascending: true }),
    'Supabase player lookup timed out'
  )

  if (error) {
    throw error
  }

  return data
}

export async function leaveRoomPlayer(playerId) {
  if (!playerId) {
    return null
  }

  if (!supabase) {
    const rooms = readMockRooms()
    const roomEntry = Object.entries(rooms).find(([, room]) =>
      room.players?.some((player) => player.id === playerId)
    )

    if (!roomEntry) {
      return null
    }

    const [code, room] = roomEntry
    room.players = room.players.map((player) =>
      player.id === playerId ? { ...player, is_eliminated: true } : player
    )
    rooms[code] = room
    writeMockRooms(rooms)
    return room.players.find((player) => player.id === playerId)
  }

  const { data, error } = await withTimeout(
    supabase
      .from('room_players')
      .update({ is_eliminated: true })
      .eq('id', playerId)
      .select()
      .single(),
    'Supabase player leave timed out'
  )

  if (error) {
    throw error
  }

  return data
}

export async function consumeRoomPlayer(roomId, victimPlayerId, event = {}) {
  if (!victimPlayerId) {
    return null
  }

  const consumptionEvent = {
    room_id: roomId,
    victim_id: victimPlayerId,
    attacker_id: event.attacker_id,
    attacker_name: event.attacker_name,
    score_gain: event.score_gain || 0,
    radius_gain: event.radius_gain || 0,
    consumed_at: Date.now(),
  }

  if (!supabase) {
    const rooms = readMockRooms()
    const roomEntry = Object.entries(rooms).find(([, room]) =>
      room.players?.some((player) => player.id === victimPlayerId)
    )

    if (!roomEntry) {
      return null
    }

    const [code, room] = roomEntry
    room.players = room.players.map((player) =>
      player.id === victimPlayerId ? { ...player, is_eliminated: true } : player
    )
    rooms[code] = room
    writeMockRooms(rooms)
    return room.players.find((player) => player.id === victimPlayerId)
  }

  await broadcastRoomPlayerConsumed(roomId, consumptionEvent)

  const { data, error } = await withTimeout(
    supabase
      .from('room_players')
      .update({ is_eliminated: true })
      .eq('id', victimPlayerId)
      .select()
      .single(),
    'Supabase player consume timed out'
  )

  if (error) {
    throw error
  }

  return data
}

export async function updateRoomPlayerState(playerId, playerState) {
  if (!playerId) {
    return null
  }

  if (!supabase) {
    const rooms = readMockRooms()
    const roomEntry = Object.entries(rooms).find(([, room]) =>
      room.players?.some((player) => player.id === playerId)
    )

    if (!roomEntry) {
      return null
    }

    const [code, room] = roomEntry
    room.players = room.players.map((player) =>
      player.id === playerId ? { ...player, ...playerState } : player
    )
    rooms[code] = room
    writeMockRooms(rooms)
    return room.players.find((player) => player.id === playerId)
  }

  const baseState = {
    x: playerState.x,
    y: playerState.y,
    score: playerState.score,
    size: playerState.size,
    is_eliminated: playerState.is_eliminated,
  }
  const extendedState = {
    ...baseState,
    role: playerState.role,
    team: playerState.team,
    angle: playerState.angle,
    last_seen_at: new Date().toISOString(),
  }

  const updatePlayer = (payload) =>
    withTimeout(
      supabase
        .from('room_players')
        .update(payload)
        .eq('id', playerId)
        .select()
        .single(),
      'Supabase player state update timed out'
    )

  let { data, error } = await updatePlayer(
    supportsExtendedPlayerState ? extendedState : baseState
  )

  if (error && supportsExtendedPlayerState && isMissingPlayerStateColumn(error)) {
    supportsExtendedPlayerState = false
    ;({ data, error } = await updatePlayer(baseState))
  }

  if (error) {
    throw error
  }

  return data
}

export async function broadcastRoomPlayerState(roomId, playerState) {
  if (!supabase || !roomId) {
    return null
  }

  const channel = roomPlayerChannels.get(roomId)
  if (!channel) {
    return null
  }

  return channel.send({
    type: 'broadcast',
    event: 'player_state',
    payload: {
      ...playerState,
      room_id: roomId,
      sent_at: Date.now(),
    },
  })
}

export async function broadcastRoomPlayerConsumed(roomId, event) {
  if (!supabase || !roomId) {
    return null
  }

  const channel = roomPlayerChannels.get(roomId)
  if (!channel) {
    return null
  }

  return channel.send({
    type: 'broadcast',
    event: 'player_consumed',
    payload: {
      ...event,
      room_id: roomId,
      consumed_at: event.consumed_at || Date.now(),
    },
  })
}

export async function startGameRoom(roomIdOrCode) {
  const rooms = readMockRooms()
  const normalizedCode = roomIdOrCode?.toUpperCase?.()
  const localRoomKey =
    (rooms[roomIdOrCode] && roomIdOrCode) ||
    (rooms[normalizedCode] && normalizedCode) ||
    Object.keys(rooms).find((code) => rooms[code].id === roomIdOrCode)

  if (localRoomKey) {
    rooms[localRoomKey].status = 'playing'
    writeMockRooms(rooms)
    return rooms[localRoomKey]
  }

  if (!supabase) {
    throw new Error('Game room not found.')
  }

  const { data, error } = await withTimeout(
    supabase
      .from('game_rooms')
      .update({
        status: 'playing',
        started_at: new Date().toISOString(),
      })
      .eq('id', roomIdOrCode)
      .select()
      .single(),
    'Supabase start game timed out'
  )

  if (error) {
    throw error
  }

  return data
}

export function subscribeToRoomPlayers(roomId, onPlayersChange, options = {}) {
  if (!supabase) {
    return () => {}
  }

  let isActive = true
  let latestPlayers = []
  const livePlayerStateById = new Map()

  const publishPlayers = () => {
    onPlayersChange([...latestPlayers])
  }

  const mergePlayer = (changedPlayer, rememberLiveState = false) => {
    if (!changedPlayer || changedPlayer.room_id !== roomId) {
      refreshPlayers()
      return
    }

    if (changedPlayer.is_eliminated) {
      latestPlayers = latestPlayers.filter((player) => player.id !== changedPlayer.id)
      livePlayerStateById.delete(changedPlayer.id)
      return
    }

    if (rememberLiveState) {
      livePlayerStateById.set(changedPlayer.id, {
        ...(livePlayerStateById.get(changedPlayer.id) || {}),
        ...changedPlayer,
      })
    }

    const playerWithLiveState = {
      ...changedPlayer,
      ...(livePlayerStateById.get(changedPlayer.id) || {}),
    }
    const playerIndex = latestPlayers.findIndex((player) => player.id === changedPlayer.id)
    if (playerIndex >= 0) {
      latestPlayers = latestPlayers.map((player, index) =>
        index === playerIndex ? { ...player, ...playerWithLiveState } : player
      )
    } else {
      latestPlayers = [...latestPlayers, playerWithLiveState]
    }
  }

  const mergePlayerChange = (payload) => {
    const changedPlayer = payload.new || payload.record || payload.old

    if (!changedPlayer || changedPlayer.room_id !== roomId) {
      refreshPlayers()
      return
    }

    if (payload.eventType === 'DELETE') {
      latestPlayers = latestPlayers.filter((player) => player.id !== changedPlayer.id)
      livePlayerStateById.delete(changedPlayer.id)
    } else {
      mergePlayer(changedPlayer)
    }

    if (isActive) {
      publishPlayers()
    }
  }

  const mergeBroadcastPlayerState = ({ payload }) => {
    mergePlayer(payload, true)

    if (isActive) {
      publishPlayers()
    }
  }

  const handlePlayerConsumed = ({ payload }) => {
    if (!payload || payload.room_id !== roomId) {
      return
    }

    latestPlayers = latestPlayers.filter((player) => player.id !== payload.victim_id)
    livePlayerStateById.delete(payload.victim_id)

    if (isActive) {
      publishPlayers()
      options.onPlayerConsumed?.(payload)
    }
  }

  const refreshPlayers = () => {
    getRoomPlayers(roomId)
      .then((players) => {
        if (isActive) {
          latestPlayers = players.map((player) => ({
            ...player,
            ...(livePlayerStateById.get(player.id) || {}),
          }))
          publishPlayers()
        }
      })
      .catch((error) => {
        console.error('Failed to sync room players', error)
      })
  }

  refreshPlayers()

  const channel = supabase
    .channel(`room_players:${roomId}`)
    .on('broadcast', { event: 'player_state' }, mergeBroadcastPlayerState)
    .on('broadcast', { event: 'player_consumed' }, handlePlayerConsumed)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_players',
        filter: `room_id=eq.${roomId}`,
      },
      mergePlayerChange
    )
    .subscribe()

  roomPlayerChannels.set(roomId, channel)

  const pollInterval = setInterval(refreshPlayers, 750)

  return () => {
    isActive = false
    clearInterval(pollInterval)
    if (roomPlayerChannels.get(roomId) === channel) {
      roomPlayerChannels.delete(roomId)
    }
    supabase.removeChannel(channel)
  }
}
