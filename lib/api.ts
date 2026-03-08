const BASE_URL = 'https://api.openf1.org/v1'

export function buildUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`${BASE_URL}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }
  return url.toString()
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class OpenF1LockedError extends Error {
  constructor() {
    super('OpenF1 API locked during live session')
    this.name = 'OpenF1LockedError'
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const maxRetries = 4

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url)

    if (res.status === 401) {
      throw new OpenF1LockedError()
    }

    if (res.status === 404) {
      return [] as unknown as T
    }

    if (res.status === 429) {
      if (attempt < maxRetries) {
        const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 500
        await delay(backoff)
        continue
      }
      return [] as unknown as T
    }

    if (!res.ok) {
      throw new Error(`OpenF1 API error: ${res.status}`)
    }

    return res.json()
  }

  return [] as unknown as T
}
