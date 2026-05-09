import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Try exchangerate-api.com free tier (no key needed for basic endpoint)
    const res = await fetch(
      'https://open.er-api.com/v6/latest/USD',
      { next: { revalidate: 3600 } } // cache 1hr
    )
    if (!res.ok) throw new Error('rate fetch failed')
    const data = await res.json()
    const rate: number = data?.rates?.NGN
    if (!rate) throw new Error('NGN rate not found')
    return NextResponse.json({ rate, source: 'open.er-api.com', timestamp: data.time_last_update_utc })
  } catch {
    return NextResponse.json({ error: 'Could not fetch rate' }, { status: 502 })
  }
}
