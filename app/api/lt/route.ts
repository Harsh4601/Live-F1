import { NextRequest, NextResponse } from 'next/server'

const LT_BASE = 'https://livetiming.formula1.com/static'

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')
  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  const url = `${LT_BASE}/${path}`

  try {
    const res = await fetch(url, {
      next: { revalidate: 2 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=2, stale-while-revalidate=5',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch from F1 Live Timing' },
      { status: 502 }
    )
  }
}
