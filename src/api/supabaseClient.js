import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const REQUEST_TIMEOUT_MS = 8000

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.'
  )
}

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey)
    : null

function createMockGuest(playerName) {
  return {
    user: {
      id: crypto.randomUUID(),
      is_anonymous: true,
      user_metadata: { player_name: playerName },
    },
    session: null,
    isMock: true,
  }
}

function withTimeout(request, message) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
  })

  return Promise.race([request, timeout]).finally(() => clearTimeout(timeoutId))
}

export async function signInAsGuest(playerName) {
  if (!supabase) {
    return createMockGuest(playerName)
  }

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      throw sessionError
    }

    if (sessionData.session?.user) {
      return {
        user: sessionData.session.user,
        session: sessionData.session,
        isMock: false,
      }
    }

    const { data, error } = await withTimeout(
      supabase.auth.signInAnonymously({
        options: {
          data: {
            player_name: playerName,
          },
        },
      }),
      'Supabase guest auth timed out'
    )

    if (error) {
      throw error
    }

    return {
      user: data.user,
      session: data.session,
      isMock: false,
    }
  } catch (error) {
    console.warn('Supabase guest auth failed. Falling back to a local guest.', error)
    return createMockGuest(playerName)
  }
}

export async function signOut() {
  if (!supabase) {
    return
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}
