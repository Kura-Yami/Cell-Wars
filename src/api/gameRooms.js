import { supabase } from './supabaseClient'
import { createId } from '@/lib/randomId'

const MOCK_ROOMS_KEY = 'cell-wars:mock-rooms'
const REQUEST_TIMEOUT_MS = 8000

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
    return localRoom.players || []
  }

  if (!supabase) {
    return []
  }

  const { data, error } = await withTimeout(
    supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomIdOrCode)
      .order('joined_at', { ascending: true }),
    'Supabase player lookup timed out'
  )

  if (error) {
    throw error
  }

  return data
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

export function subscribeToRoomPlayers(roomId, onPlayersChange) {
  if (!supabase) {
    return () => {}
  }

  // Connect lobby UI here. Supabase Realtime must be enabled for room_players.
  const channel = supabase
    .channel(`room_players:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_players',
        filter: `room_id=eq.${roomId}`,
      },
      () => {
        getRoomPlayers(roomId).then(onPlayersChange)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
