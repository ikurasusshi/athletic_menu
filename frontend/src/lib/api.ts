const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error ?? 'Request failed')
  }
  return res.json() as Promise<T>
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      request<{ token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    login: (email: string, password: string) =>
      request<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },
  profile: {
    get: () => request<Profile>('/profile'),
    update: (data: ProfileInput) =>
      request<Profile>('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  },
  sessions: {
    create: (data: ConditionInput) =>
      request<TrainingSession>('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    list: () => request<TrainingSessionSummary[]>('/sessions'),
    get: (id: string) => request<TrainingSession>(`/sessions/${id}`),
  },
  events: {
    list: () => request<CompetitionEvent[]>('/events'),
    create: (name: string, date: string) =>
      request<CompetitionEvent>('/events', { method: 'POST', body: JSON.stringify({ name, date }) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/events/${id}`, { method: 'DELETE' }),
  },
}

export type Profile = {
  id: string
  userId: string
  event: 'SHORT' | 'MIDDLE_LONG' | 'JUMP' | 'THROW'
  age: number
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  targetRecord: string | null
  personalBest: string | null
}

export type ProfileInput = Omit<Profile, 'id' | 'userId'>

export type ConditionInput = {
  motivation: number
  muscleSoreness: Record<string, 'NONE' | 'MILD' | 'SEVERE'>
  injuryStatus: { part: string; detail: string }[]
  goalCommitment: number
}

export type TrainingSession = {
  id: string
  userId: string
  date: string
  motivation: number
  muscleSoreness: Record<string, string>
  injuryStatus: { part: string; detail: string }[]
  goalCommitment: number
  generatedMenu: string
  createdAt: string
}

export type TrainingSessionSummary = Pick<TrainingSession, 'id' | 'date' | 'motivation' | 'goalCommitment' | 'createdAt'>

export type CompetitionEvent = {
  id: string
  userId: string
  name: string
  date: string
  createdAt: string
}
